import logging
import os
from datetime import datetime
from pathlib import Path

# isort: off
import wandb
from wandb.integration.ultralytics import add_wandb_callback
import yaml
from pydantic import ValidationError
from ultralytics import YOLO
from ultralytics.data.split import autosplit
# isort: on

from model_training.core.constants import WANDB_PROJECT
from model_training.core.schemas import (
    DataConfigSchema,
    DataSplitArgs,
    TrainConfigSchema,
)

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
        self.run_config: TrainConfigSchema = self._load_run_config()
        self.data_config: DataConfigSchema = self._load_data_config()
        self.model, self.model_name = self._load_model()
        self.run_name = self._generate_run_name()
        self.output_dir: Path = Path(self.run_config.output_dir) / self.run_name

        self._init_wandb()
        if self.run_config.data_split_args:
            self._split_dataset(split_args=self.run_config.data_split_args, data_path=self.data_config.path)

    @staticmethod
    def _split_dataset(split_args: DataSplitArgs, data_path: str) -> None:
        """
        Performs an auto-split of the dataset based on the split ratios
        :param split_args: Split arguments
        :param data_path: Absolute path to images directory
        :return: Creates autosplit_train.txt, autosplit_val.txt, autosplit_test.txt
        """
        autosplit(path=(Path(data_path) / 'images').as_posix(), **split_args.model_dump())

    def _load_run_config(self) -> TrainConfigSchema:
        """Loads and validates YAML config file"""
        with open(self.config_path, "r") as f:
            raw_config = yaml.safe_load(f)
        try:
            return TrainConfigSchema(**raw_config)
        except ValidationError as e:
            logger.error("❌ Run config validation error:\n%s", e)
            raise SystemExit(1)
        except ValueError as e:
            logger.error("Invalid argument for run configuration: \n%s", e)
            raise SystemExit(1)

    def _load_data_config(self) -> DataConfigSchema:
        """Loads and validates YAML config file for a YOLO dataset."""
        with open(self.run_config.train_args.data, "r") as f:
            raw_config = yaml.safe_load(f)
        try:
            return DataConfigSchema(**raw_config)
        except ValidationError as e:
            logger.error("❌ Data config validation error:\n%s", e)
            raise SystemExit(1)
        except ValueError as e:
            logger.error("Invalid argument for data configuration: \n%s", e)
            raise SystemExit(1)

    def _generate_run_name(self) -> str:
        """
        Generate training run name from project name, model name, and timestamp
        :return: Run name
        """
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        return f"{self.run_config.project_name}_{self.model_name}_{timestamp}"

    def _init_wandb(self) -> None:
        """Creates W&B session"""
        wandb.login(anonymous="allow", key=os.environ["WANDB_API_KEY"])
        add_wandb_callback(self.model, enable_model_checkpointing=True)

    def _load_model(self) -> tuple[YOLO, str]:
        """
        Loads Ultralytics YOLO model from YAML config
        :return: Ultralytics YOLO model and corresponding model name
        """
        model_path = Path(self.run_config.model)
        model = YOLO(model_path.as_posix())
        return model, model_path.stem

    def train(self) -> None:
        """
        Invokes Ultralytics training job
        :return: None
        """
        train_args = self.run_config.train_args.model_dump()
        train_args.update(
            {
                "project": WANDB_PROJECT,
                "name": self.run_name,
            }
        )
        self.model.train(**train_args)
        logger.info("Model training finished")

    def validate(self) -> None:
        """
        Validates best-performing YOLO model on test set.
        :return: None
        """
        best_model_path = Path(WANDB_PROJECT) / self.run_name / "weights" / "best.pt"
        if not best_model_path.exists():
            logger.error(f"No best model found at {best_model_path.as_posix()}")
            return
        best_model = YOLO(best_model_path.as_posix())
        metrics = best_model.val(
            project=WANDB_PROJECT,
            name=(Path(self.run_name) / "validation").as_posix(),
            data=self.run_config.train_args.data,
            **self.run_config.val_args.model_dump()  # type: ignore
        )
        result_logs = '\n'.join(f"{metric}: {value}" for metric, value in metrics.results_dict.items())
        logger.info(result_logs)

    @staticmethod
    def finish_run() -> None:
        """Log out from W&B session"""
        wandb.finish()
