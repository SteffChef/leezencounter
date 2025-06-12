from pathlib import Path
from typing import Any, Literal, Optional

import torch
from ppq import BaseGraph
from ppq.api import espdl_quantize_onnx
from torch.utils.data import DataLoader
from torchvision import transforms

from model_conversion.core.constants import TARGET_SOC
from model_conversion.utils import Yolo11CalibrationDataset


class OnnxConverter:
    def __init__(
            self,
            calib_data_path: Path,
            transform: Optional[transforms] = None,
            device: Literal["cpu", "cuda"] = "cpu", **kwargs: Any
    ) -> None:
        """
        Initialize calibration dataloader for PTQ

        :param calib_data_path: Path to calibration data directory
        :param transform: torchvision transforms pipeline
        :param kwargs: keyword arguments for PyTorch DataLoader
        """
        self.device = device
        self.calib_dataset = Yolo11CalibrationDataset(calib_data_path, transform=transform)
        self.calib_dataloader = DataLoader(self.calib_dataset, **kwargs)

    def to_espdl(
        self,
        onnx_model_path: Path,
        espdl_export_path: Path,
        calibration_steps: int = 8,
        quant_bits: int = 8,
        device: Literal["cpu", "cuda"] = "cpu",
    ) -> BaseGraph:
        """

        :param onnx_model_path: Import path to .onnx model file
        :param espdl_export_path: Export path to .espdl model file (including file name)
        :param calibration_steps: Number of calibration steps. At least 8 steps are recommended.
        :param quant_bits: Number of bits for integer quantization. Defaults to int8 quantization.
        :param device: Device used for quantization.
        returns: Quantized graph from PPQ
        """
        if not onnx_model_path.exists():
            raise FileNotFoundError(f"No such file: {onnx_model_path.as_posix()}")
        if not onnx_model_path.is_file():
            raise ValueError(f"{onnx_model_path.as_posix()} is not a file")
        if not onnx_model_path.with_suffix(".onnx"):
            raise ValueError(
                f"Invalid file format for onnx_model_path: {onnx_model_path.suffix}. Expected .onnx format"
            )
        if not espdl_export_path.with_suffix(".espdl"):
            raise ValueError(f"Invalid file format for espdl_export_path: {espdl_export_path.suffix}. Expected .espdl")
        x = self.calib_dataset[0].unsqueeze(0)

        quantized_model = espdl_quantize_onnx(
            onnx_import_file=onnx_model_path.as_posix(),
            espdl_export_file=espdl_export_path.as_posix(),
            calib_dataloader=self.calib_dataloader,
            calib_steps=calibration_steps,
            input_shape=x.shape,
            inputs=None,
            target=TARGET_SOC,
            num_of_bits=quant_bits,
            collate_fn=self._collate_fn,
            dispatching_override=None,
            device=device,
            error_report=True,
            skip_export=False,
            export_test_values=True,
            verbose=1,
        )
        return quantized_model

    def _collate_fn(self, batch: torch.Tensor) -> torch.Tensor:
        return batch.to(self.device)
