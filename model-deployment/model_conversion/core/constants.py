from typing import Final, Dict, List, Tuple

DEVICE: Final[str] = 'cpu'
TARGET_SOC: Final[str] = 'esp32s3'
NUM_OF_BITS: Final[int] = 8
CALIB_STEPS: Final[int] = 8

IMAGE_SIZE: Final[int] = 640
BATCH_SIZE: Final[int] = 1
CLASS_NAMES: Final[Dict[int, str]] = {0: 'bicycle', 1: 'saddle'}

CONF_THRESHOLD: Final[float] = 0.25
IOU_THRESHOLD: Final[float] = 0.50
MAX_DETECTIONS: Final[int] = 100

MODEL_INPUT_SHAPE: Final[Tuple[int, int]] = (IMAGE_SIZE, IMAGE_SIZE)
MODEL_MEAN: Final[List[int]] = [0, 0, 0]
MODEL_STD: Final[List[int]] = [255, 255, 255]