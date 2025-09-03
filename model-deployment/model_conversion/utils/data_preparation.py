from PIL import Image
import torch
from torch.utils.data import Dataset, DataLoader
import torchvision.transforms as transforms
import cv2
import pandas as pd
from pathlib import Path
from typing import Dict, Tuple, List, Final
from tqdm import tqdm

class ImageFolderDataset(Dataset):

    def __init__(self, image_dir: Path, image_size: Tuple[int, int]):
        if not image_dir.is_dir():
            raise NotADirectoryError(f"Directory not found: {image_dir}")

        image_extensions = ["*.jpg", "*.jpeg", "*.png"]
        self.image_paths: List[Path] = []
        for ext in image_extensions:
            # Sort each glob result before extending to maintain a globally sorted list
            self.image_paths.extend(sorted(list(image_dir.glob(ext))))

        if not self.image_paths:
            raise FileNotFoundError(f"No images found in {image_dir} with extensions {image_extensions}")

        self.transform = transforms.Compose([
            transforms.Resize(image_size),
            transforms.ToTensor(),
        ])

    def __len__(self) -> int:
        return len(self.image_paths)

    def __getitem__(self, idx: int) -> torch.Tensor:

        image_path = self.image_paths[idx]
        image = Image.open(image_path).convert("RGB")
        return self.transform(image)

    def get_filename(self, idx: int) -> str:
        return self.image_paths[idx].name


class ImageDataLoader:
    def __init__(
            self,
            image_dir: Path,
            image_size: int,
            batch_size: int,
            shuffle: bool = False,
            num_workers: int = 0
    ):

        self.dataset = ImageFolderDataset(
            image_dir=image_dir,
            image_size=(image_size, image_size)
        )

        self.loader = DataLoader(
            self.dataset,
            batch_size=batch_size,
            shuffle=shuffle,
            num_workers=num_workers,
            pin_memory=True if torch.cuda.is_available() else False,
        )

        print(f"DataLoader created for {image_dir} with {len(self.dataset)} images.")

    def print_file_mappings(self, num_to_show: int = 10):
        print(f"\n--- Mapping of Index to Filename (First {num_to_show} Files) ---")
        count = min(num_to_show, len(self.dataset))
        if count == 0:
            print("Dataset is empty.")
            return

        for i in range(count):
            filename = self.dataset.get_filename(i)
            print(f"Index {i}: {filename}")


class ImageResizeProcessor:
    """Resizes images in a directory to a target size."""

    def __init__(self, target_size: Tuple[int, int]):
        # target_size should be (height, width)
        self.target_size = target_size

    def process_directory(self, input_dir: Path, output_dir: Path):
        image_paths = sorted(list(input_dir.glob("*.jpg")))
        if not image_paths:
            raise FileNotFoundError(f"No .jpg images found in {input_dir}")

        for img_path in tqdm(image_paths, desc="Resizing Images"):
            image = cv2.imread(str(img_path))
            if image is None:
                print(f"Warning: Could not read image {img_path}, skipping.")
                continue

            resized_image = cv2.resize(image, (self.target_size[1], self.target_size[0]),
                                       interpolation=cv2.INTER_NEAREST)

            output_path = output_dir / img_path.name
            cv2.imwrite(str(output_path), resized_image)


class GTLabelConverter:
    """
    Converts YOLO .txt format labels to absolute pixel coordinate CSVs,
    scaled to the FINAL model input size.

    This version correctly handles varying original image sizes by de-normalizing
    coordinates using original image dimensions before scaling them to the target shape.
    """

    def __init__(self, class_names_map: Dict[int, str]):
        self.class_names_map = class_names_map

    def _find_corresponding_image(self, label_path: Path, image_dir: Path) -> Path:
        """Finds the image file corresponding to a label file."""
        for ext in ['.jpg', '.jpeg', '.png']:
            image_path = image_dir / (label_path.stem + ext)
            if image_path.exists():
                return image_path
        raise FileNotFoundError(f"No corresponding image found for label {label_path.name} in {image_dir}")

    def _convert_yolo_to_absolute(
        self,
        yolo_box: list,
        original_dims: Tuple[int, int],
        target_dims: Tuple[int, int]
    ):
        """
        Converts a single YOLO bounding box (normalized) to absolute pixel
        coordinates [x1, y1, x2, y2] based on the target model dimensions.
        """
        original_w, original_h = original_dims
        target_w, target_h = target_dims

        # De-normalize using the ORIGINAL width and height
        x_center_norm, y_center_norm, w_norm, h_norm = yolo_box
        box_w_orig = w_norm * original_w
        box_h_orig = h_norm * original_h
        x_center_orig = x_center_norm * original_w
        y_center_orig = y_center_norm * original_h

        # Calculate original top-left (x1, y1)
        x1_orig = x_center_orig - (box_w_orig / 2)
        y1_orig = y_center_orig - (box_h_orig / 2)

        # Calculate scaling factors
        # This mirrors the cv2.resize(image, (target_w, target_h)) operation
        x_scale = target_w / original_w
        y_scale = target_h / original_h

        # Apply scaling to the top-left corner and the box dimensions
        x1_new = x1_orig * x_scale
        y1_new = y1_orig * y_scale
        w_new = box_w_orig * x_scale
        h_new = box_h_orig * y_scale

        # Calculate the new bottom-right corner
        x2_new = x1_new + w_new
        y2_new = y1_new + h_new

        return [x1_new, y1_new, x2_new, y2_new]

    def process_directory(self, label_dir: Path, image_dir: Path, output_dir: Path, target_shape: Tuple[int, int]):
        """
        Processes all .txt label files in a directory.

        Args:
            label_dir: Directory containing YOLO .txt labels.
            image_dir: Directory containing the ORIGINAL images. This is crucial for
                       getting original dimensions.
            output_dir: Directory to save the output .csv files.
            target_shape: The final (height, width) of the model input.
        """
        label_paths = sorted(list(label_dir.glob("*.txt")))
        if not label_paths:
            raise FileNotFoundError(f"No .txt label files found in {label_dir}")

        target_h, target_w = target_shape

        for label_path in tqdm(label_paths, desc="Converting Labels"):
            try:
                # Find the corresponding original image and get its dimensions
                original_image_path = self._find_corresponding_image(label_path, image_dir)
                with Image.open(original_image_path) as img:
                    original_w, original_h = img.size # (width, height)
            except FileNotFoundError as e:
                print(f"Warning: {e}. Skipping this label.")
                continue

            rows = []
            with open(label_path, 'r') as f:
                for line in f:
                    parts = line.strip().split()
                    if len(parts) != 5:
                        continue

                    class_id = int(parts[0])
                    yolo_coords = list(map(float, parts[1:]))

                    # Convert to absolute pixel coordinates for the target space
                    abs_box = self._convert_yolo_to_absolute(
                        yolo_coords,
                        original_dims=(original_w, original_h),
                        target_dims=(target_w, target_h)
                    )

                    rows.append({
                        'x1': abs_box[0],
                        'y1': abs_box[1],
                        'x2': abs_box[2],
                        'y2': abs_box[3],
                        'confidence': 1.0,  # Ground truth has 100% confidence
                        'class_id': class_id,
                        'class_name': self.class_names_map.get(class_id, "unknown")
                    })

            if rows:
                df = pd.DataFrame(rows)
                output_csv_path = output_dir / f"{label_path.stem}.csv"
                df.to_csv(output_csv_path, index=False, float_format='%.2f')