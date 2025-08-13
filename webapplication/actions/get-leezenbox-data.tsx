"use server";

import { DataPoint } from "@/types";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Constants for the original image dimensions
const ORIGINAL_WIDTH = 1200;
const ORIGINAL_HEIGHT = 1600;

// Function to normalize bbox coordinates from 800x600 to 0-1 scale
function normalizePredictions(dataPoints: unknown[]): DataPoint[] {
  return dataPoints.map((point: unknown) => {
    const typedPoint = point as DataPoint;
    return {
      ...typedPoint,
      predictions:
        typedPoint.predictions?.map((prediction) => ({
          ...prediction,
          bbox:
            prediction.bbox?.map((coord: number, index: number) => {
              // bbox format is typically [x, y, width, height]
              // Normalize x and width by image width, y and height by image height
              if (index === 0 || index === 2) {
                // x and width
                return coord / ORIGINAL_WIDTH;
              } else {
                // y and height
                return coord / ORIGINAL_HEIGHT;
              }
            }) || prediction.bbox,
        })) || [],
    };
  });
}

export async function getLeezenboxData(): Promise<DataPoint[]> {
  try {
    const result = await pool.query("SELECT * FROM ttn_data");
    return normalizePredictions(result.rows);
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getLeezenboxDataByTTNKey(
  ttnKey: string
): Promise<DataPoint[]> {
  try {
    const result = await pool.query(
      "SELECT * FROM ttn_data WHERE location = $1",
      [ttnKey]
    );
    return result.rows.length > 0 ? normalizePredictions(result.rows) : [];
  } catch (error) {
    console.error(error);
    return [];
  }
}
