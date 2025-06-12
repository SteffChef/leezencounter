import os
from pathlib import Path
from typing import Literal

from PIL import Image
from torch.utils.data import Dataset


class Yolo11CalibrationDataset(Dataset):
    """Yolo11 calibration dataset"""

    def __init__(self, image_dir: Path, transform=None, device: Literal['cpu', 'cuda'] = 'cpu') -> None:
        self.image_dir = image_dir
        self.transform = transform
        self.device = device
        self.image_files = [
            os.path.join(image_dir, f) for f in os.listdir(image_dir) if f.lower().endswith((".jpg", ".jpeg"))
        ]

    def __len__(self):
        return len(self.image_files)

    def __getitem__(self, idx):
        image_path = self.image_files[idx]
        image = Image.open(image_path).convert("RGB")
        if self.transform:
            image = self.transform(image)
            image = image.to(self.device)
        return image
