from pathlib import Path
from typing import Final

# content root paths
DATA_DIR: Final[Path] = Path(__file__).parent.parent / "data"
DATASETS_DIR: Final[Path] = Path(__file__).parent.parent / "datasets"
MODELS_DIR: Final[Path] = Path(__file__).parent.parent / "models"
RUNS_DIR: Final[Path] = Path(__file__).parent.parent / "runs"
