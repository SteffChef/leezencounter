from datetime import datetime
from pathlib import Path
from typing import Iterable, Literal, Any, Sequence

import numpy as np
import onnxruntime as ort
import ppq.lib as PFL
import torch
from ppq.IR import BaseGraph, TrainableGraph
from ppq.api import get_target_platform
from ppq.api.interface import load_onnx_graph
from ppq.core import TargetPlatform
from ppq.core.quant import QuantizationVisibility
from ppq.executor import TorchExecutor
from ppq.parser import NativeExporter
from ppq.quantization.optim.refine import QuantizeSimplifyPass, QuantizeFusionPass, QuantAlignmentPass
from ppq.quantization.optim.parameters import ParameterQuantizePass, PassiveParameterQuantizePass
from ppq.quantization.optim.calibration import RuntimeCalibrationPass
from torch import Tensor
from torch.utils.data import DataLoader
from tqdm import tqdm
from ultralytics import YOLO
from ultralytics.utils.metrics import DetMetrics

from model_training.core.constants import TARGET_PLATFORM
from model_training.utils.datasets import TrainDataset, CalibrationDataset
from model_training.utils.validators import QuantDetectionValidator


class QatTrainer:
    """
    Member Functions:
    1. epoch(): do one epoch training.
    2. step(): do one step training.
    3. eval(): evaluation on given dataset.
    4. save(): save trained model.
    5. clear(): clear training cache.

    PPQ will create a TrainableGraph on you graph, a wrapper class that
        implements a set of useful functions that enable training. You are recommended
        to edit its code to add new feature on graph.

    Optimizer controls the learning process and determine the parameters values ends up learning,
        you can rewrite the defination of optimizer and learning scheduler in __init__ function.
        Tuning them carefully, as hyperparameters will greatly affects training result.
    """

    def __init__(
            self,
            onnx_path: Path,
            yolo_model_path: Path,
            dataset_yaml_file_path: Path,
            device: Literal['cpu', 'cuda'] = 'cpu',
    ) -> None:
        """
        Quantization-aware training interface.
        :param onnx_path: Path to ONNX model
        :param yolo_model_path: Path to YOLO torch model
        :param dataset_yaml_file_path: Path to dataset yaml file (used by Ultralytics)
        :param device: Device type (CPU or GPU). Only cpu and cuda are supported.
        """

        if not yolo_model_path.exists():
            raise FileNotFoundError(f"No such file: {yolo_model_path.as_posix()}")
        if not yolo_model_path.with_suffix('.pt'):
            raise IOError(f"{yolo_model_path.as_posix()} if not a torch model. Expected .pt file.")

        if not (dataset_yaml_file_path.exists() and dataset_yaml_file_path.is_file()):
            raise FileNotFoundError(f"{dataset_yaml_file_path.as_posix()} not a file or does not exist.")
        if not (dataset_yaml_file_path.with_suffix('.yaml') or dataset_yaml_file_path.with_suffix('.yml')):
            raise IOError(f"{dataset_yaml_file_path.as_posix()} not a yaml file.")

        self._onnx_path = onnx_path
        self._graph = self._get_onnx_graph(self._onnx_path)
        self._executor = TorchExecutor(self._graph, device=device)
        self._training_graph = TrainableGraph(self._graph)
        self._loss_fn = torch.nn.MSELoss()
        self._device = device
        self._yolo_model_path = yolo_model_path
        self._dataset_yaml_file_path = dataset_yaml_file_path

        for tensor in self._training_graph.parameters():
            tensor.requires_grad = True
        self._optimizer = torch.optim.SGD(
            params=[{"params": self._training_graph.parameters()}], lr=3e-5
        )
        self._lr_scheduler = None
        self._epoch = 0

    @staticmethod
    def _get_train_dataloader(train_dataset_path: Path) -> DataLoader:
        train_set = TrainDataset(train_dataset_path)
        return DataLoader(train_set, batch_size=1, shuffle=True)

    @staticmethod
    def _get_calib_dataloader(calib_dataset_path: Path) -> DataLoader:
        calib_set = CalibrationDataset(calib_dataset_path)
        return DataLoader(dataset=calib_set, batch_size=1, shuffle=False)

    @staticmethod
    def _get_onnx_graph(onnx_path: Path) -> BaseGraph:
        return load_onnx_graph(onnx_path.as_posix())

    def _generate_run_name(self) -> str:
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        return f"qat_{self._yolo_model_path.stem}_{timestamp}"

    @staticmethod
    def _create_output_dir(run_name: str) -> Path:
        output_dir = Path('qat-runs') / run_name
        output_dir.mkdir(exist_ok=False)
        return output_dir

    @staticmethod
    def _get_target_platform(num_bits: int) -> TargetPlatform:
        return get_target_platform(TARGET_PLATFORM, num_bits)

    def _run_epoch(self, dataloader: Iterable) -> float:
        """Do one epoch Training with given dataloader.

        Given dataloader is supposed to be a iterable container of batched data,
            for example it can be a list of [img(torch.Tensor), label(torch.Tensor)].

        If your data has other layout that is not supported by this function,
            then you are supposed to rewrite the logic of epoch function by yourself.
        """
        epoch_loss = 0
        for bidx, batch in enumerate(
                tqdm(dataloader, desc=f"Epoch {self._epoch}: ", total=len(dataloader))
        ):
            data = batch
            data = data.to(self._device)
            _, loss = self.step(data)
            epoch_loss += loss

        self._epoch += 1
        print(f"Epoch Loss: {epoch_loss / len(dataloader):.4f}")
        return epoch_loss

    def step(self, data: torch.Tensor) -> tuple[list[Tensor], Any]:
        """Do one step Training with given data(torch.Tensor) and label(torch.Tensor).

        This one-step-forward function assume that your model have only one input and output variable.

        If the training model has more input or output variable, then you might need to
            rewrite this function by yourself.
        """
        # quantized model inference
        pred = self._executor.forward_with_gradient(data)
        # fp32 model inference
        session = ort.InferenceSession(self._onnx_path.as_posix())
        input_name = session.get_inputs()[0].name
        output_fp32 = session.run(None, {input_name: np.array(data.cpu())})
        # init QAT training loss
        loss = torch.nn.MSELoss().to(self._device)
        for i in range(len(pred)):
            loss += self._loss_fn(
                pred[i], torch.Tensor(output_fp32[i]).to(self._device)
            )
        loss.backward()
        if self._lr_scheduler is not None:
            self._lr_scheduler.step(epoch=self._epoch)
        self._optimizer.step()
        self._training_graph.zero_grad()

        return pred, loss.item()

    def eval(self) -> DetMetrics:
        """Do Evaluation process on given dataloader.

        Split your dataset into training and evaluation dataset at first, then
            use eval function to monitor model performance on evaluation dataset.
        """

        model = YOLO(self._yolo_model_path)
        model.to(self._device)
        results = model.val(
            data=self._dataset_yaml_file_path.as_posix(),
            imgsz=640,
            device=self._device,
            validator=QuantDetectionValidator(),
            split='test'
        )
        return results.summary()

    def save(self, espdl_file_path: Path, native_file_path: Path) -> BaseGraph:
        """Save model to given path.
        Saved model can be read by ppq.api.load_native_model function.

        :param espdl_file_path: path to save .espdl model file
        :param native_file_path: path to save native model file
        :returns quantized graph
        """
        # export .espdl
        PFL.Exporter(platform=TargetPlatform.ESPDL_INT8).export(
            file_path=espdl_file_path.as_posix(), graph=self._graph
        )
        qat_graph = self._graph
        # export .native
        exporter = NativeExporter()
        exporter.export(file_path=native_file_path.as_posix(), graph=self._graph)
        return qat_graph

    def train(
            self,
            train_dataset_path: Path,
            calib_dataset_path: Path,
            epochs: int,
            calib_steps: int = 32,
            num_bits: int = 8,
            input_shape: Sequence[int] = None
    ) -> BaseGraph:
        """
        Runs a QAT job
        :param train_dataset_path: Path to training dataset.
        :param calib_dataset_path: Path to calibration dataset.
        :param epochs: Number of epochs
        :param calib_steps: Number of calibration steps. Defaults to 32.
        :param num_bits: Number of bits used for quantization. Defaults to 8. Only int8 and int16 are available.
        :param input_shape: Tensor shape of YOLO model as [B, C, H, W]. Defaults to [1, 3, 640, 640] for Yolo11n.
        :return: Quantized graph from last epoch (not necessarily the best quantized graph).
        """
        if epochs < 1:
            raise ValueError(f"Train at least for one epoch")

        if input_shape is None:
            input_shape = [1, 3, 640, 640]

        quantizer = PFL.Quantizer(platform=self._get_target_platform(num_bits), graph=onnx_graph)
        dispatching_table = PFL.Dispatcher(graph=onnx_graph, method="conservative").dispatch(
            quantizer.quant_operation_types
        )
        dispatching_override = None

        # override dispatching result
        if dispatching_override is not None:
            for opname, platform in dispatching_override.items():
                if opname not in onnx_graph.operations:
                    continue
                assert isinstance(platform, int) or isinstance(platform, TargetPlatform), (
                    f"Your dispatching_override table contains a invalid setting of operation {opname}, "
                    "All platform setting given in dispatching_override table is expected given as int or TargetPlatform, "
                    f"however {type(platform)} was given."
                )
                dispatching_table[opname] = TargetPlatform(platform)

        for opname, platform in dispatching_table.items():
            if platform == TargetPlatform.UNSPECIFIED:
                dispatching_table[opname] = TargetPlatform(quantizer.target_platform)

        # init quant information
        for op in self._graph.operations.values():
            quantizer.quantize_operation(
                op_name=op.name, platform=dispatching_table[op.name]
            )

        executor = TorchExecutor(graph=self._graph, device=self._device)
        executor.tracing_operation_meta(inputs=torch.zeros(input_shape).to(self._device))

        train_dataloader = self._get_train_dataloader(train_dataset_path)
        calib_dataloader = self._get_calib_dataloader(calib_dataset_path)

        pipeline = PFL.Pipeline(
            [
                QuantizeSimplifyPass(),
                QuantizeFusionPass(activation_type=quantizer.activation_fusion_types),
                ParameterQuantizePass(),
                RuntimeCalibrationPass(method="kl"),
                PassiveParameterQuantizePass(
                    clip_visiblity=QuantizationVisibility.EXPORT_WHEN_ACTIVE
                ),
                QuantAlignmentPass(elementwise_alignment="Align to Output"),
            ]
        )

        pipeline.optimize(
            calib_steps=calib_steps,
            collate_fn=self._collate_fn,
            graph=self._graph,
            dataloader=calib_dataloader,
            executor=executor
        )

        run_name = self._generate_run_name()
        output_dir = self._create_output_dir(run_name)

        for epoch in range(epochs):
            epoch_run_name = f"qat_{self._yolo_model_path.stem}_epoch{epoch}"
            _ = self._run_epoch(train_dataloader)
            qat_graph = self.save(
                output_dir / f"{epoch_run_name}.espdl",
                output_dir / f"{epoch_run_name}.native"
            )
            detection_summary = self.eval()
            print(detection_summary)

        return qat_graph

    def clear(self):
        """Clear training state."""
        for tensor in self._training_graph.parameters():
            tensor.requires_grad = False
            tensor._grad = None

    def _collate_fn(self, batch: torch.tensor) -> torch.tensor:
        return batch.type(torch.float).to(self._device)
