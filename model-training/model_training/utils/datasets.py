from pathlib import Path

import numpy as np
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

        self.images_dir = path / "images"
        if not (self.images_dir.exists() and self.images_dir.is_dir()):
            raise NotADirectoryError(f"{self.images_dir} does not exist or is not a directory")
        # use all images for calibration
        self.img_paths = list(self.images_dir.glob("*.jpg"))

    def __len__(self) -> int:
        return len(self.img_paths)

    def __getitem__(self, idx: int) -> torch.Tensor:
        img = Image.open(self.img_paths[idx].as_posix())  # 0~255 hwc #RGB
        if img.mode == "L":
            img = img.convert("RGB")  # type: ignore
        img = self.transform(img)
        return img  # type: ignore


class TrainDataset(CalibrationDataset):
    def __init__(self, path: Path, split: str | float, img_size: int | tuple[int, int] = 640):
        super().__init__(path, img_size)

        # split can either be a string (PathLike) or a split ratio
        if isinstance(split, float):
            if not (0 < split < 1):
                raise ValueError("Split must be between 0 and 1")
            # select images based on split ratio
            n = int(len(self.img_paths) * split)
            self.img_paths = np.random.choice(np.array(self.img_paths), size=n, replace=False)  # type: ignore
        elif isinstance(split, str):
            txt_file_path = path / split

            if not (txt_file_path.exists() and txt_file_path.is_file() and txt_file_path.suffix == ".txt"):
                raise NotADirectoryError(f"{txt_file_path.as_posix()} does not exist or is not a .txt file")

            with txt_file_path.open("r") as txt_file:
                selected_train_images = list(map(lambda line: Path(line.strip()), txt_file.readlines()))

            self.img_paths = list(map(lambda path: self.images_dir / path.name, selected_train_images))
        else:
            raise ValueError("Split must be either a ratio (float) or path-like object (str)")


class ValidationDataset(TrainDataset):
    def __init__(self, path: Path, split: str | int, img_size: int | tuple[int, int] = 640):
        super().__init__(path, split, img_size)

        labels_dir = path / "labels"
        if not (labels_dir.exists() and labels_dir.is_dir()):
            raise NotADirectoryError(f"{labels_dir} does not exist or is not a directory")

        # TODO: load labels from directory
