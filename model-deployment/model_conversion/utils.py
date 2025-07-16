from pathlib import Path
from typing import Literal

import torch
from PIL import Image
from torch.utils.data import Dataset
from torchvision import transforms


class CalibrationDataset(Dataset):
    """Yolo11 calibration dataset"""

    def __init__(
        self, image_dir: Path, img_size: int | tuple[int, int], device: Literal["cpu", "cuda"] = "cpu"
    ) -> None:
        self.image_dir = image_dir
        self.device = device
        self.image_files = list(image_dir.glob("*.jpg"))

        self.transform = transforms.Compose(
            [
                transforms.ToTensor(),
                transforms.Resize((img_size, img_size) if isinstance(img_size, int) else img_size),
                transforms.Normalize(mean=[0, 0, 0], std=[1, 1, 1]),
            ]
        )

    def __len__(self):
        return len(self.image_files)

    def __getitem__(self, idx: int) -> torch.Tensor:
        img = Image.open(self.image_files[idx].as_posix())  # 0~255 hwc #RGB
        if img.mode == "L":
            img = img.convert("RGB")  # type: ignore
        img = self.transform(img)
        return img  # type: ignore
