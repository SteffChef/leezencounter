import logging
import os
from datetime import datetime
from pathlib import Path

# isort: off
import wandb
import yaml
from pydantic import ValidationError
from ultralytics import YOLO
# isort: on

from model_training.core.constants import WANDB_PROJECT
from model_training.core.schemas import TrainConfigSchema

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


class Trainer:
    """Run model trainings from YAML config files"""

    def __init__(self, config_path: Path | str) -> None:
        """
        Constructor
        :param config_path: path to YAML config file
        """
        if isinstance(config_path, str):
            config_path = Path(config_path)
        if not isinstance(config_path, Path):
            raise ValueError("Invalid datatype for config_path, expected Path or str")

        self.config_path = config_path
        self.config: TrainConfigSchema = self._load_config()
        self.model, self.model_name = self._load_model()
        self.run_name = self._generate_run_name()
        self.output_dir = Path(self.config.output_dir) / self.run_name

        self._init_wandb()

    def _load_config(self) -> TrainConfigSchema:
        """Loads and validates YAML config file"""
        with open(self.config_path, "r") as f:
            raw_config = yaml.safe_load(f)
        try:
            return TrainConfigSchema(**raw_config)
        except ValidationError as e:
            logger.error("❌ Config validation error:\n%s", e)
            raise SystemExit(1)
        except ValueError as e:
            logger.error("Invalid argument configuration: \n%s", e)
            raise SystemExit(1)

    def _generate_run_name(self) -> str:
        """
        Generate training run name from project name, model name, and timestamp
        :return: Run name
        """
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        return f"{self.config.project_name}_{self.model_name}_{timestamp}"

    @staticmethod
    def _init_wandb() -> None:
        """Creates W&B session"""
        wandb.login(anonymous="allow", key=os.environ["WANDB_API_KEY"])

    def _load_model(self) -> tuple[YOLO, str]:
        """
        Loads Ultralytics YOLO model from YAML config
        :return: Ultralytics YOLO model and corresponding model name
        """
        model_path = Path(self.config.model)
        model = YOLO(model_path.as_posix())
        return model, model_path.stem

    def train(self) -> None:
        """
        Invokes Ultralytics training job
        :return: None
        """
        train_args = self.config.train_args.model_dump()
        train_args.update(
            {
                "project": WANDB_PROJECT,
                "name": self.run_name,
            }
        )
        self.model.train(**train_args)
        logger.info("Model training finished")

    @staticmethod
    def finish_run() -> None:
        """Log out from W&B session"""
        wandb.finish()
