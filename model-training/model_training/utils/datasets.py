from pathlib import Path

import torch
from PIL import Image
from torch.utils.data import Dataset
from torchvision import transforms


class CalibrationDataset(Dataset):
    def __init__(self, path: Path, img_size: int | tuple[int, int] = 640):
        super().__init__()
        self.transform = transforms.Compose(
            [
                transforms.ToTensor(),
                transforms.Resize((img_size, img_size) if isinstance(img_size, int) else img_size),
                transforms.Normalize(mean=[0, 0, 0], std=[1, 1, 1]),
            ]
        )

        images_dir = path / "images"
        if not (images_dir.exists() and images_dir.is_dir()):
            raise NotADirectoryError(f"{images_dir} does not exist or is not a directory")

        self.img_paths = list(images_dir.glob("*.jpg"))

    def __len__(self) -> int:
        return len(self.img_paths)

    def __getitem__(self, idx: int) -> Image:
        img = Image.open(self.img_paths[idx].as_posix())  # 0~255 hwc #RGB
        if img.mode == "L":
            img = img.convert("RGB")
        img = self.transform(img)
        return img


class TrainDataset(CalibrationDataset):
    def __init__(self, path: Path, img_size: int | tuple[int, int] = 640):
        super().__init__(path, img_size)


class ValidationDataset(TrainDataset):
    def __init__(self, path: Path, img_size: int | tuple[int, int] = 640):
        super().__init__(path, img_size)

        labels_dir = path / "labels"
        if not (labels_dir.exists() and labels_dir.is_dir()):
            raise NotADirectoryError(f"{labels_dir} does not exist or is not a directory")
