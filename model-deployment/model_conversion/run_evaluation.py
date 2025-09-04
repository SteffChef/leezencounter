import torch
from collections import defaultdict
from ppq import TorchExecutor
from tqdm import tqdm
from model_conversion.utils.yolo_converter import YoloConverter
from model_conversion.utils.onnx_converter import OnnxQuantizer
from model_conversion.utils.model_evaluation import YoloDetector, ESPEvaluator
from model_conversion.core.paths import (
    CALIBRATION_IMAGE_DIR, BASE_MODEL_PRED_DIR, GROUND_TRUTH_CSV_DIR,
    QUANTIZED_MODEL_PRED_DIR, ONNX_MODEL_PATH, ESPDL_MODEL_PATH, BASE_MODEL_PT_PATH
)
from model_conversion.core.constants import (
    CONF_THRESHOLD, IOU_THRESHOLD, MAX_DETECTIONS, CLASS_NAMES, MODEL_MEAN,
    MODEL_STD, MODEL_INPUT_SHAPE, DEVICE, CALIB_STEPS
)


def main():
    FORCE_REGENERATE_BASELINE = True

    for dir_path in [BASE_MODEL_PRED_DIR, QUANTIZED_MODEL_PRED_DIR, GROUND_TRUTH_CSV_DIR, CALIBRATION_IMAGE_DIR]:
        dir_path.mkdir(parents=True, exist_ok=True)

    # Ensure parent directories for model files exist
    ONNX_MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    ESPDL_MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)

    print("\n--- STEP 1: GENERATE BASELINE PREDICTIONS (Original .pt Model) ---")
    if FORCE_REGENERATE_BASELINE:
        base_model_detector = YoloDetector(
            model_path=str(BASE_MODEL_PT_PATH),
            conf_threshold=CONF_THRESHOLD,
            iou_threshold=IOU_THRESHOLD,
            max_detections=MAX_DETECTIONS
        )
        base_model_detector.process_directory(image_dir=CALIBRATION_IMAGE_DIR, output_dir=BASE_MODEL_PRED_DIR)
    else:
        print("Skipping baseline generation. Assuming predictions exist.")

    print("\n--- STEP 2: EXPORT .PT MODEL TO ONNX ---")

    converter = YoloConverter(
        imgsz=MODEL_INPUT_SHAPE,
        opset=13,
        simplify=True,
        dynamic=False,
        half=False,
        nms=False,
        batch=1,
        device=DEVICE
    )

    converter.to_onnx(
        torch_model_path=BASE_MODEL_PT_PATH,
        onnx_export_path=ONNX_MODEL_PATH.parent
    )
    print(f"ONNX model successfully exported and moved to: {ONNX_MODEL_PATH}")

    print("\n--- STEP 3: QUANTIZE ONNX MODEL TO ESPDL ---")

    # The new OnnxQuantizer handles its own data loading internally.
    # We just need to provide the path to the calibration images.
    quantizer = OnnxQuantizer(
        calib_data_path=CALIBRATION_IMAGE_DIR,
        image_size=MODEL_INPUT_SHAPE,
        device=DEVICE
    )

    # Call the quantization method. It returns the quantized graph for inference.
    # The method needs the ONNX model path and the directory for the ESPDL export.
    quantized_model = quantizer.quantize_default(
        onnx_model_path=ONNX_MODEL_PATH,
        espdl_export_dir_path=ESPDL_MODEL_PATH.parent,
        calibration_steps=CALIB_STEPS,  # Use constant for calibration steps
        quant_bits=8,
        device=DEVICE
    )
    # The new quantizer names the output file automatically based on the onnx file name.
    # We assume ESPDL_MODEL_PATH points to where it will be saved.
    print(f"ESPDL model successfully exported to: {ESPDL_MODEL_PATH}")

    print("\n--- STEP 4: EVALUATE BOTH MODELS ---")
    evaluator = ESPEvaluator()
    image_paths_for_eval = sorted(list(CALIBRATION_IMAGE_DIR.glob("*.jpg")))

    # Evaluate Original Model from CSVs
    results_original = evaluator.evaluate_csv_predictions(
        image_paths=image_paths_for_eval,
        gt_dir=GROUND_TRUTH_CSV_DIR,
        prediction_dir=BASE_MODEL_PRED_DIR,
    )

    # Evaluate Quantized Model with Live Inference
    print("\n--> Evaluating QUANTIZED (INT8) Model with Live Inference...")
    live_predictions, live_ground_truths = defaultdict(list), defaultdict(list)
    executor = TorchExecutor(graph=quantized_model, device=DEVICE)

    for image_path in tqdm(image_paths_for_eval, desc="Quantized Model Inference"):
        image_base_name = image_path.stem
        gt_boxes, gt_classes = evaluator.load_ground_truth_from_csv(GROUND_TRUTH_CSV_DIR / f"{image_base_name}.csv")
        for box, cls_id in zip(gt_boxes, gt_classes):
            live_ground_truths[cls_id.item()].append([image_base_name, box.tolist()])

        input_tensor = evaluator.preprocess_for_esp_dl(str(image_path), MODEL_INPUT_SHAPE, MODEL_MEAN, MODEL_STD).to(
            DEVICE)
        outputs = executor(input_tensor)
        final_results = evaluator.postprocess_for_esp_dl(outputs, CONF_THRESHOLD, IOU_THRESHOLD, MAX_DETECTIONS)

        detections_for_saving = []
        if final_results:
            for class_id, score, x1, y1, x2, y2 in final_results:
                live_predictions[int(class_id)].append([image_base_name, [x1, y1, x2, y2], score])
                detections_for_saving.append([x1, y1, x2, y2, score, class_id])

        detections_tensor = torch.tensor(detections_for_saving,
                                         dtype=torch.float32) if detections_for_saving else torch.tensor([])
        evaluator.save_predictions_to_csv(detections_tensor, CLASS_NAMES,
                                          QUANTIZED_MODEL_PRED_DIR / f"{image_base_name}.csv")

    results_quantized = evaluator.calculate_metrics_from_collected_data(live_predictions, live_ground_truths)

    print("\n\n--- COMPREHENSIVE EVALUATION RESULTS ---\n")
    print("Note: True Negatives (TN) are not reported as they are ill-defined for object detection tasks.\n")
    header = f"{'CLASS':<15} | {'METRIC':<18} | {'ORIGINAL MODEL':<16} | {'QUANTIZED MODEL':<17} | {'CHANGE':<10}"
    print(header)
    print("-" * len(header))

    all_class_ids = sorted(
        list(set(results_original["ap_per_class"].keys()) | set(results_quantized["ap_per_class"].keys())))

    for class_id in all_class_ids:
        class_name = CLASS_NAMES.get(class_id, f"class_{class_id}")
        print(f"{class_name:<15} | {'-' * 18} | {'-' * 16} | {'-' * 17} | {'-' * 10}")

        metrics_to_show = {
            "AP @50": ("ap_per_class", ".4f"),
            "Precision": ("precision_per_class", ".4f"),
            "Recall": ("recall_per_class", ".4f"),
            "Avg IoU": ("avg_iou_per_class", ".4f"),
            "TP": ("tps_per_class", "d"),
            "FP": ("fps_per_class", "d"),
            "FN": ("fns_per_class", "d"),
        }
        for metric_name, (key, fmt) in metrics_to_show.items():
            val_orig = results_original[key].get(class_id, 0)
            val_quant = results_quantized[key].get(class_id, 0)
            change = val_quant - val_orig
            print(f"{'':<15} | {metric_name:<18} | {val_orig:<16{fmt}} | {val_quant:<17{fmt}} | {change:<+10{fmt}}")

    print("-" * len(header))
    print(f"{'OVERALL':<15} | {'-' * 18} | {'-' * 16} | {'-' * 17} | {'-' * 10}")

    # mAP
    fp32_map, quant_map = results_original.get("mAP", 0), results_quantized.get("mAP", 0)
    print(f"{'':<15} | {'mAP @50':<18} | {fp32_map:<16.4f} | {quant_map:<17.4f} | {quant_map - fp32_map:<+10.4f}")

    # Macro-average P & R
    fp32_p, quant_p = results_original.get("macro_precision", 0), results_quantized.get("macro_precision", 0)
    print(f"{'':<15} | {'Precision (Macro)':<18} | {fp32_p:<16.4f} | {quant_p:<17.4f} | {quant_p - fp32_p:<+10.4f}")
    fp32_r, quant_r = results_original.get("macro_recall", 0), results_quantized.get("macro_recall", 0)
    print(f"{'':<15} | {'Recall (Macro)':<18} | {fp32_r:<16.4f} | {quant_r:<17.4f} | {quant_r - fp32_r:<+10.4f}")

    # Total TP/FP/FN
    for metric_name, key in [("Total TPs", "tps_per_class"), ("Total FPs", "fps_per_class"),
                             ("Total FNs", "fns_per_class")]:
        total_orig = sum(results_original.get(key, {}).values())
        total_quant = sum(results_quantized.get(key, {}).values())
        print(f"{'':<15} | {metric_name:<18} | {total_orig:<16} | {total_quant:<17} | {total_quant - total_orig:<+10}")

    print("-" * len(header))
    print("\n")


if __name__ == "__main__":
    main()