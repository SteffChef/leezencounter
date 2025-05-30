from os import PathLike
from pathlib import Path
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class YoloTrainArgs(BaseModel):
    data: str = Field(..., description="Path to dataset YAML file")
    epochs: int = Field(..., gt=0, description="Number of training epochs")
    device: Optional[int | str] = Field("cpu", description="Device to train on")
    val: Optional[bool] = Field(True, description="Enable validation")
    plots: Optional[bool] = Field(False, description="Save validation plots during training")

    class Config:
        extra = "allow"


class TrainConfigSchema(BaseModel):
    project_name: str = Field(..., description="Name of the W&B project")
    output_dir: str | PathLike = Field(..., description="Directory to save model runs")
    model: str | PathLike = Field(..., description="YOLO model name or path to weights")
    train_args: YoloTrainArgs = Field(..., description="Training arguments for Ultralytics YOLO class")

    class Config:
        extra = "forbid"

    @classmethod
    @field_validator("output_dir", mode="before")
    def ensure_output_dir(cls, v):
        if isinstance(v, str):
            v = Path(v)
        if not v.is_dir():
            raise ValueError(f"{v} is not a directory")
        if not v.exists():
            raise ValueError(f"Directory {v} does not exist")
