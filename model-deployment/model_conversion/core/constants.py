from typing import Final

from ppq import QuantizationSetting, QuantizationSettingFactory

TARGET_SOC: Final[str] = "esp32s3"
YOLO11_IMGSZ: Final[int] = 640
DEFAULT_QUANT_SETTINGS: Final[QuantizationSetting] = QuantizationSettingFactory.espdl_setting()
