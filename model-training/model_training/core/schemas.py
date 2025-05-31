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


class DataConfigSchema(BaseModel):
    path: str = Field(..., description="Absolute path to dataset directory containing images/ and labels/ directories")
    train: str = Field(..., description="Path to training directory or .txt file, relative to 'path' argument")
    val: str = Field(..., description="Path to validation directory or .txt file, relative to 'path' argument")
    test: Optional[str] = Field(..., description="Path to test directory or .txt file, relative to 'path' argument")
    nc: int = Field(..., description="Number of classes contained in the dataset")
    names: dict[int, str] = Field(..., description="Mapping from class ID to class name")


class DataSplitArgs(BaseModel):
    weights: tuple[float, float, float] = Field(
        ..., description="Ratios for dataset splitting (train, val, test)"
    )
    annotated_only: bool = Field(..., description="Whether to split annotated images only")

    class Config:
        extra = "forbid"


class TrainConfigSchema(BaseModel):
    project_name: str = Field(..., description="Name of the W&B project")
    output_dir: str | PathLike = Field(..., description="Directory to save model runs")
    model: str | PathLike = Field(..., description="YOLO model name or path to weights")
    train_args: YoloTrainArgs = Field(..., description="Training arguments for Ultralytics YOLO class")
    data_split_args: Optional[DataSplitArgs] = Field(None, description="Data split arguments for Ultralytics YOLO class")

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
