import { useEffect, useRef, useCallback } from "react";
import { Prediction } from "@/types";

interface BorderBoxProps {
  predictions: Prediction[];
  backgroundImageSrc?: string; // Optional background image URL
}

const BorderBox: React.FC<BorderBoxProps> = ({
  predictions,
  backgroundImageSrc,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Original image dimensions
  const ORIGINAL_WIDTH = 1600;
  const ORIGINAL_HEIGHT = 1200;

  // Canvas display dimensions (maintaining 4:3 aspect ratio)
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;

  // Scale factors
  const scaleX = CANVAS_WIDTH / ORIGINAL_WIDTH;
  const scaleY = CANVAS_HEIGHT / ORIGINAL_HEIGHT;

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw background image if available
    if (imageRef.current) {
      ctx.drawImage(imageRef.current, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      // Set canvas background color if no image
      ctx.fillStyle = "#f8f9fa";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // Draw bounding boxes
    predictions.forEach((prediction) => {
      const [x_center, y_center, width, height] = prediction.bbox;

      // Convert YOLO format (percentages) to pixel coordinates
      const pixelXCenter = x_center * ORIGINAL_WIDTH;
      const pixelYCenter = y_center * ORIGINAL_HEIGHT;
      const pixelWidth = width * ORIGINAL_WIDTH;
      const pixelHeight = height * ORIGINAL_HEIGHT;

      // Convert center coordinates to top-left coordinates
      const pixelX = pixelXCenter - pixelWidth / 2;
      const pixelY = pixelYCenter - pixelHeight / 2;

      // Scale coordinates to canvas size
      const scaledX = pixelX * scaleX;
      const scaledY = pixelY * scaleY;
      const scaledWidth = pixelWidth * scaleX;
      const scaledHeight = pixelHeight * scaleY;

      // Set box style based on category or confidence
      ctx.strokeStyle = prediction.category === 1 ? "#ef4444" : "#3b82f6"; // red for category 1, blue for others
      ctx.lineWidth = 2;
      ctx.fillStyle =
        prediction.category === 1
          ? "rgba(239, 68, 68, 0.1)"
          : "rgba(59, 130, 246, 0.1)";

      // Draw filled rectangle (background)
      ctx.fillRect(scaledX, scaledY, scaledWidth, scaledHeight);

      // Draw border
      ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);

      // Draw label with confidence
      ctx.fillStyle = prediction.category === 1 ? "#ef4444" : "#3b82f6";
      ctx.font = "12px Arial";
      const label = `${prediction.category} (${(
        prediction.confidence * 100
      ).toFixed(1)}%)`;
      const labelY = scaledY > 20 ? scaledY - 5 : scaledY + scaledHeight + 15;
      ctx.fillText(label, scaledX, labelY);
    });
  }, [predictions, scaleX, scaleY]);

  // Load background image when backgroundImageSrc changes
  useEffect(() => {
    if (backgroundImageSrc) {
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        // Trigger a redraw when image loads
        drawCanvas();
      };
      img.onerror = () => {
        console.error("Failed to load background image:", backgroundImageSrc);
        imageRef.current = null;
      };
      img.src = backgroundImageSrc;
    } else {
      imageRef.current = null;
    }
  }, [backgroundImageSrc, drawCanvas]);

  // Redraw canvas when predictions change
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  return (
    <div className="border border-gray-300 p-4 rounded-lg w-full shadow-md">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="w-full h-auto border border-gray-200 rounded"
        style={{ aspectRatio: "4/3" }}
      />
    </div>
  );
};

export default BorderBox;
