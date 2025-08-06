from pathlib import Path
from typing import Final

ROOT_DIR: Final[Path] = Path(__file__).parent.parent.resolve()

# Main source and output directories
CORE_DIR: Final[Path] = ROOT_DIR / "core"
DATA_DIR: Final[Path] = ROOT_DIR.parent / "data"
MODELS_DIR: Final[Path] = ROOT_DIR.parent / "models"
UTILS_DIR: Final[Path] = ROOT_DIR / "utils"


CALIBRATION_IMAGE_DIR: Final[Path] = DATA_DIR / "calib_images_compressed"
ORIGINAL_IMAGE_DIR: Final[Path] = DATA_DIR / "original_images"
ORIGINAL_LABEL_DIR: Final[Path] = DATA_DIR / "original_labels"

GROUND_TRUTH_CSV_DIR: Final[Path] = DATA_DIR / "ground_truth_csvs"
BASE_MODEL_PRED_DIR: Final[Path] = DATA_DIR / "preds_base_model"
QUANTIZED_MODEL_PRED_DIR: Final[Path] = DATA_DIR / "preds_quantized_model"

BASE_MODEL_PT_PATH: Final[Path] = MODELS_DIR / "yolo11n.pt"
ONNX_MODEL_PATH: Final[Path] = MODELS_DIR / "yolo11n.onnx"
ESPDL_MODEL_PATH: Final[Path] = MODELS_DIR / "model.espdl"

_DIRS_TO_CREATE = [
    DATA_DIR, MODELS_DIR,
    CALIBRATION_IMAGE_DIR, ORIGINAL_IMAGE_DIR, ORIGINAL_LABEL_DIR,
    GROUND_TRUTH_CSV_DIR, BASE_MODEL_PRED_DIR, QUANTIZED_MODEL_PRED_DIR
]

def create_project_dirs() -> None:
    print("Ensuring project directories exist...")
    for path in _DIRS_TO_CREATE:
        path.mkdir(parents=True, exist_ok=True)
    print("All directories are ready.")