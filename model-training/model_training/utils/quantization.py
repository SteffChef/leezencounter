from pathlib import Path
from typing import Optional, Literal

import onnx
import torch
from onnxsim import simplify
from ppq import QuantizationSettingFactory
from ppq.IR import BaseGraph
from ppq.api import espdl_quantize_onnx
from torch.utils.data import DataLoader

from model_training.core.constants import TARGET_PLATFORM
from model_training.utils.datasets import CalibrationDataset


def quantize_yolo(
        onnx_model_path: Path,
        espdl_model_path: Path,
        calib_dataset_path: Path,
        input_shape: Optional[list[int]] = None,
        batch_size: int = 32,
        num_of_bits: Literal[8, 16] = 8,
        calib_steps: int = 32,
        sim: bool = True,
        device: Literal['cpu', 'cuda'] = 'cpu'
) -> BaseGraph:
    """
    On-the-fly quantization of YOLO11n for Quantization-aware Training
    :param onnx_model_path: Path to ONNX model file
    :param espdl_model_path: Path to export ESP-DL model file
    :param calib_dataset_path: Path to calibration dataset
    :param input_shape: Model input shape of form [C, H, W]
    :param batch_size: Batch size used for quantization
    :param num_of_bits: Number of bits used for quantization. Only int8 and int16 are supported for .espdl
    :param calib_steps: Number of calibration steps
    :param sim: Whether to simplify the ONNX graph
    :param device: Device used for quantization. Only cpu and cuda are supported.
    :return: quantized graph from ESP-PPQ framework.
    """
    if input_shape is None:
        input_shape = [3, 640, 640]
    if num_of_bits not in (8, 16):
        raise ValueError(f"int8 and int16 are supported but received {num_of_bits} bit for quantization.")
    # validate onnx_model_path
    if not onnx_model_path.exists():
        raise FileNotFoundError(f"No such path: {onnx_model_path.as_posix()}")
    if not onnx_model_path.with_suffix('.onnx'):
        raise IOError(f"Invalid file format for onnx_model_path: {onnx_model_path.suffix}. Expected .onnx")
    # validate espdl_model_path
    if not espdl_model_path.with_suffix('.espdl'):
        raise IOError(f"Invalid file format for espdl_model_path: {espdl_model_path.suffix}. Expected .espdl")
    # validate calibration dataset path
    if not (calib_dataset_path.is_dir() and calib_dataset_path.exists()):
        raise NotADirectoryError(f"{calib_dataset_path.as_posix()} is not a directory or does not exist.")

    model = onnx.load(onnx_model_path.as_posix())
    if sim:
        model, check = simplify(model)
        if not check:
            raise RuntimeError("Simplified ONNX model could not be validated")
    onnx.save(onnx.shape_inference.infer_shapes(model), onnx_model_path.as_posix())

    calibration_dataset = CalibrationDataset(calib_dataset_path)
    dataloader = DataLoader(
        dataset=calibration_dataset, batch_size=batch_size, shuffle=False
    )

    def collate_fn(batch: torch.Tensor) -> torch.Tensor:
        return batch.to(device)

    # default setting
    quant_setting = QuantizationSettingFactory.espdl_setting()

    """
    # Mixed-Precision + Horizontal Layer Split Pass Quantization

    quant_setting.dispatching_table.append(
        operation='/model.2/cv2/conv/Conv',
        platform=get_target_platform(TARGET_PLATFORM, 16)
    )
    quant_setting.dispatching_table.append(
        operation='/model.3/conv/Conv',
        platform=get_target_platform(TARGET_PLATFORM, 16)
    )

    quant_setting.dispatching_table.append(
        operation='/model.4/cv2/conv/Conv',
        platform=get_target_platform(TARGET_PLATFORM, 16)
    )

    quant_setting.weight_split = True
    quant_setting.weight_split_setting.method = 'balance'
    quant_setting.weight_split_setting.value_threshold = 1.5 #1.5
    quant_setting.weight_split_setting.interested_layers = ['/model.0/conv/Conv',
                                                            '/model.1/conv/Conv' ]
    """

    quant_ppq_graph = espdl_quantize_onnx(
        onnx_import_file=onnx_model_path.as_posix(),
        espdl_export_file=espdl_model_path.as_posix(),
        calib_dataloader=dataloader,
        calib_steps=calib_steps,
        input_shape=[1] + input_shape,
        target=TARGET_PLATFORM,
        num_of_bits=num_of_bits,
        collate_fn=collate_fn,
        setting=quant_setting,
        device=device,
        error_report=True,
        skip_export=False,
        export_test_values=False,
        verbose=0,
        inputs=None,
    )
    return quant_ppq_graph
