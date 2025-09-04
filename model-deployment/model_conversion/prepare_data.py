from pathlib import Path
from model_conversion.utils.data_preparation import ImageResizeProcessor, GTLabelConverter
from model_conversion.core.constants import MODEL_INPUT_SHAPE, CLASS_NAMES
from model_conversion.core.paths import (
    ORIGINAL_IMAGE_DIR,
    ORIGINAL_LABEL_DIR,
    CALIBRATION_IMAGE_DIR,
    GROUND_TRUTH_CSV_DIR,
    DATA_DIR,
    MODELS_DIR,
    BASE_MODEL_PRED_DIR,
    QUANTIZED_MODEL_PRED_DIR
)


CURRENT_FILE_PATH = Path(__file__).resolve()
PROJECT_ROOT = CURRENT_FILE_PATH.parents[2]
DEFAULT_TEST_LIST_PATH = PROJECT_ROOT / "model-training" / "datasets" / "combined_preprocessed" / "YOLO" / "autosplit_test.txt"

def create_project_dirs() -> None:
    print("Ensuring project directories exist...")
    _DIRS_TO_CREATE = [
        DATA_DIR, MODELS_DIR,
        CALIBRATION_IMAGE_DIR, ORIGINAL_IMAGE_DIR, ORIGINAL_LABEL_DIR,
        GROUND_TRUTH_CSV_DIR, BASE_MODEL_PRED_DIR, QUANTIZED_MODEL_PRED_DIR
    ]

    for path in _DIRS_TO_CREATE:
        path.mkdir(parents=True, exist_ok=True)
    print("All directories are ready.")



def cleanup_directory(target_dir: Path, keep_list_file: Path):
    """
    Removes all files from a directory except for those listed in a given file.
    """
    print(f"\n[STEP 2/3] Cleaning up calibration directory to keep only test images...")
    print(f"  - Target directory: {target_dir}")
    print(f"  - File with list of images to keep: {keep_list_file}")

    if not keep_list_file.is_file():
        print(f"  - WARNING: The 'keep list' file was not found at '{keep_list_file}'.")
        print("  - Skipping cleanup step.")
        return

    try:
        with open(keep_list_file, 'r') as f:
            files_to_keep = {Path(line.strip()).name for line in f if line.strip()}
    except Exception as e:
        print(f"  - ERROR: Could not read the keep list file: {e}. Skipping cleanup.")
        return

    if not files_to_keep:
        print("  - WARNING: The 'keep list' file is empty. Skipping cleanup.")
        return

    print(f"  - Successfully loaded {len(files_to_keep)} filenames to keep.")

    deleted_count = 0
    kept_count = 0

    if not target_dir.is_dir():
        print(f"  - WARNING: Target directory '{target_dir}' does not exist. Skipping cleanup.")
        return

    for item_path in target_dir.iterdir():
        if item_path.is_file():
            if item_path.name in files_to_keep:
                kept_count += 1
            else:
                item_path.unlink()
                deleted_count += 1

    print(f"  - Cleanup Summary: Kept {kept_count} files | Deleted {deleted_count} files.")
    print("[STEP 2/3] Cleanup complete.")


def main():
    """
    Main script to orchestrate the data preparation pipeline.
    """
    print("--- Starting Data Preparation Pipeline ---")
    print(f"  Creating necessary directories if they don't exist...")
    create_project_dirs()

    print(f"\n[STEP 1/3] Resizing images to {MODEL_INPUT_SHAPE}...")
    print(f"  - Input directory:  {ORIGINAL_IMAGE_DIR}")
    print(f"  - Output directory: {CALIBRATION_IMAGE_DIR}")

    CALIBRATION_IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    image_resizer = ImageResizeProcessor(target_size=MODEL_INPUT_SHAPE)
    image_resizer.process_directory(
        input_dir=ORIGINAL_IMAGE_DIR,
        output_dir=CALIBRATION_IMAGE_DIR
    )
    print("[STEP 1/3] Image resizing complete.")

    cleanup_directory(
        target_dir=CALIBRATION_IMAGE_DIR,
        keep_list_file=DEFAULT_TEST_LIST_PATH
    )

    print(f"\n[STEP 3/3] Converting YOLO .txt labels to .csv format...")
    print(f"  - Input label directory:    {ORIGINAL_LABEL_DIR}")
    print(f"  - Input original img dir: {ORIGINAL_IMAGE_DIR}")
    print(f"  - Output CSV directory:     {GROUND_TRUTH_CSV_DIR}")

    GROUND_TRUTH_CSV_DIR.mkdir(parents=True, exist_ok=True)
    label_converter = GTLabelConverter(class_names_map=CLASS_NAMES)
    label_converter.process_directory(
        label_dir=ORIGINAL_LABEL_DIR,
        image_dir=ORIGINAL_IMAGE_DIR,
        output_dir=GROUND_TRUTH_CSV_DIR,
        target_shape=MODEL_INPUT_SHAPE
    )
    print("[STEP 3/3] Label conversion complete.")

    print("\n--- Data Preparation Pipeline Finished Successfully! ---")
    print(f"Your final test images are in: {CALIBRATION_IMAGE_DIR}")
    print(f"Your ground truth CSVs are in: {GROUND_TRUTH_CSV_DIR}")


if __name__ == "__main__":
    try:
        main()
    except (NotADirectoryError, FileNotFoundError) as e:
        print(f"\n\nERROR: A required directory was not found.")
        print(f"DETAILS: {e}")
        print(
            "\nPlease check your path configurations in 'model_deployment/core/paths.py' and ensure the raw data directories exist.")
    except Exception as e:
        print(f"\n\nAn unexpected error occurred: {e}")