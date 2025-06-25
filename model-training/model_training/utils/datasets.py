import os
from pathlib import Path

import torch
from torch.utils.data import Dataset
from torchvision import transforms
from PIL import Image


class CalibrationDataset(Dataset):
    def __init__(self, path: Path):
        super().__init__()
        self.transform = transforms.Compose(
            [
                transforms.ToTensor(),
                transforms.Resize((640, 640)),
                transforms.Normalize(mean=[0, 0, 0], std=[1, 1, 1]),
            ]
        )

        self.imgs_path = list(path.glob("*.jpg"))

    def __len__(self) -> int:
        return len(self.imgs_path)

    def __getitem__(self, idx: int) -> torch.Tensor:
        img = Image.open(self.imgs_path[idx].as_posix())  # 0~255 hwc #RGB
        img = self.transform(img)
        return img


class TrainDataset(Dataset):
    def __init__(self, path: Path):
        super().__init__()
        self.transform = transforms.Compose(
            [
                transforms.ToTensor(),
                transforms.Resize((640, 640)),
                transforms.Normalize(mean=[0, 0, 0], std=[1, 1, 1]),
            ]
        )
        self.imgs_path = list(path.glob('*.jpg'))

    def __len__(self) -> int:
        return len(self.imgs_path)

    def __getitem__(self, idx):
        img = Image.open(self.imgs_path[idx].as_posix())
        if img.mode == "L":
            img = img.convert("RGB")
        img = self.transform(img)
        return img
