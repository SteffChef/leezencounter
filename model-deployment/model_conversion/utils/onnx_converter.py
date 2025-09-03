import logging
from pathlib import Path
from typing import Any, Literal

import torch
from ppq import BaseGraph, QuantizationSettingFactory
from ppq.api import espdl_quantize_onnx, get_target_platform
from torch.utils.data import DataLoader

from model_conversion.core.constants import TARGET_SOC
from model_conversion.utils.data import CalibrationDataset

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


class OnnxQuantizer:
    def __init__(
        self,
        calib_data_path: Path,
        image_size: int | tuple[int, int],
        device: Literal["cpu", "cuda"] = "cpu",
        **kwargs: Any,
    ) -> None:
        """
        Initialize calibration dataloader for PTQ

        :param calib_data_path: Path to calibration data directory
        :param transform: torchvision transforms pipeline
        :param kwargs: keyword arguments for PyTorch DataLoader
        """
        self.device = device
        self.calib_dataset = CalibrationDataset(calib_data_path, image_size, device)
        self.calib_dataloader = DataLoader(
            self.calib_dataset, batch_size=1, shuffle=False, num_workers=0, pin_memory=False, **kwargs
        )
        # extract input shape, batch size = 1
        x = self.calib_dataset[0]
        if isinstance(x, (tuple, list)):
            x = x[0]
        x = x.unsqueeze(0)
        self.input_shape = x.shape

    @staticmethod
    def _check_file_path(file_path: Path, file_format: str) -> None:
        """
        Check the existence and file format for the specified file path.
        :param file_path: Path to file
        :param file_format: Expected file format
        """
        if not file_path.exists():
            raise FileNotFoundError(f"No such file: {file_path.as_posix()}")
        if file_path.is_file():
            if file_path.suffix != file_format:
                raise ValueError(
                    f"Invalid file format for onnx_model_path: {file_path.suffix}. Expected {file_format} format"
                )

    @staticmethod
    def _check_dir_path(dir_path: Path) -> None:
        """
        Checks the existence of a directory and creates it if not present.
        :param dir_path: Path to directory
        """
        if not dir_path.exists():
            logger.info(f"Directory {dir_path.as_posix()} does not exist.")
            dir_path.mkdir(parents=True, exist_ok=True)
            logger.info(f"Directory {dir_path.as_posix()} created.")

    def quantize_default(
        self,
        onnx_model_path: Path,
        espdl_export_dir_path: Path,
        calibration_steps: int = 8,
        quant_bits: Literal[8, 16] = 8,
        device: Literal["cpu", "cuda"] = "cpu",
    ) -> BaseGraph:
        """
        Convert .onnx model to .espdl format using 8-bit or 16-bit quantization with default settings.
        :param onnx_model_path: Import path to .onnx model file
        :param espdl_export_dir_path: Export path to .espdl model directory (excluding file name)
        :param calibration_steps: Number of calibration steps. At least 8 steps are recommended.
        :param quant_bits: Number of bits for integer quantization. Defaults to int8 quantization.
        :param device: Device used for quantization.
        returns: Quantized graph from PPQ
        """
        # validate paths
        self._check_file_path(onnx_model_path, ".onnx")
        self._check_dir_path(espdl_export_dir_path)

        export_file_path = espdl_export_dir_path / f"{onnx_model_path.stem}.espdl"

        quantized_model = espdl_quantize_onnx(
            onnx_import_file=onnx_model_path.as_posix(),
            espdl_export_file=export_file_path.as_posix(),
            calib_dataloader=self.calib_dataloader,
            calib_steps=calibration_steps,
            input_shape=self.input_shape,
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

    def quantize_mixed_precision(
        self,
        onnx_model_path: Path,
        espdl_export_path: Path,
        calibration_steps: int = 8,
        device: Literal["cpu", "cuda"] = "cpu",
    ) -> BaseGraph:
        """ """
        # validate paths
        self._check_file_path(onnx_model_path, ".onnx")
        self._check_file_path(espdl_export_path, ".espdl")
        # Quantize the following layers with 16-bits
        quant_setting = QuantizationSettingFactory.espdl_setting()
        quant_setting.dispatching_table.append("/model.2/cv2/conv/Conv", get_target_platform(TARGET_SOC, 16))
        quant_setting.dispatching_table.append("/model.3/conv/Conv", get_target_platform(TARGET_SOC, 16))
        quant_setting.dispatching_table.append("/model.4/cv2/conv/Conv", get_target_platform(TARGET_SOC, 16))

        # Horizontal Layer Split Pass
        quant_setting.weight_split = True
        quant_setting.weight_split_setting.method = "balance"
        quant_setting.weight_split_setting.value_threshold = 1.5
        quant_setting.weight_split_setting.interested_layers = ["/model.0/conv/Conv", "/model.1/conv/Conv"]

        quantized_model = espdl_quantize_onnx(
            onnx_import_file=onnx_model_path.as_posix(),
            espdl_export_file=espdl_export_path.as_posix(),
            calib_dataloader=self.calib_dataloader,
            calib_steps=calibration_steps,
            input_shape=self.input_shape,
            inputs=None,
            target=TARGET_SOC,
            collate_fn=self._collate_fn,
            dispatching_override=None,
            device=device,
            error_report=True,
            skip_export=False,
            export_test_values=True,
            verbose=1,
            setting=quant_setting,
        )
        return quantized_model
