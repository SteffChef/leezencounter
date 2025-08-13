"use server";

import { DataPoint } from "@/types";
import { Pool } from "pg";
import { generateExampleDataForLeezenboxes } from "@/example-data";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Constants for the original image dimensions (4:3 aspect ratio)
const ORIGINAL_WIDTH = 800;
const ORIGINAL_HEIGHT = 600;

// Function to normalize and convert bbox coordinates
// Real data format: [left_up_x, left_up_y, right_down_x, right_down_y] (absolute pixels)
// Target format: [x_center, y_center, width, height] (normalized 0-1 YOLO format)
function normalizePredictions(dataPoints: unknown[]): DataPoint[] {
  return dataPoints.map((point: unknown) => {
    const typedPoint = point as DataPoint;
    return {
      ...typedPoint,
      predictions:
        typedPoint.predictions?.map((prediction) => {
          if (!prediction.bbox || prediction.bbox.length !== 4) {
            return prediction;
          }

          const [left_up_x, left_up_y, right_down_x, right_down_y] =
            prediction.bbox;

          // Calculate width and height
          const width = right_down_x - left_up_x;
          const height = right_down_y - left_up_y;

          // Calculate center coordinates
          const center_x = left_up_x + width / 2;
          const center_y = left_up_y + height / 2;

          // Normalize to 0-1 scale using original image dimensions
          const normalized_center_x = center_x / ORIGINAL_WIDTH;
          const normalized_center_y = center_y / ORIGINAL_HEIGHT;
          const normalized_width = width / ORIGINAL_WIDTH;
          const normalized_height = height / ORIGINAL_HEIGHT;

          return {
            ...prediction,
            bbox: [
              normalized_center_x,
              normalized_center_y,
              normalized_width,
              normalized_height,
            ],
          };
        }) || [],
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

// New function that handles demo vs real data based on leezenbox configuration
export async function getLeezenboxDataByLeezenbox(
  leezenboxId: number,
  isDemo: boolean,
  ttnKey?: string
): Promise<DataPoint[]> {
  if (isDemo) {
    // Generate mock data for this specific leezenbox ID
    const mockData = generateExampleDataForLeezenboxes([leezenboxId]);
    return mockData;
  } else {
    // Return real data for non-demo leezenboxes
    if (!ttnKey) {
      console.warn(`No TTN key provided for non-demo leezenbox ${leezenboxId}`);
      return [];
    }
    return await getLeezenboxDataByTTNKey(ttnKey);
  }
}

// Function to get data for multiple leezenboxes with demo support
export async function getLeezenboxDataForMultiple(
  leezenboxes: Array<{ id: number; demo: boolean; ttn_location_key: string }>
): Promise<DataPoint[]> {
  const allData: DataPoint[] = [];

  for (const leezenbox of leezenboxes) {
    const data = await getLeezenboxDataByLeezenbox(
      leezenbox.id,
      leezenbox.demo,
      leezenbox.ttn_location_key
    );
    allData.push(...data);
  }

  return allData;
}

// Function to get latest occupancy for a single leezenbox with demo support
export async function getLatestOccupancyByLeezenbox(
  leezenboxId: number,
  isDemo: boolean,
  ttnKey?: string
): Promise<{ bikes: number; saddles: number }> {
  let data: DataPoint[];

  if (isDemo) {
    // Generate fresh mock data for this specific leezenbox ID
    data = generateExampleDataForLeezenboxes([leezenboxId]);
  } else {
    // Get real data for non-demo leezenboxes
    if (!ttnKey) {
      console.warn(`No TTN key provided for non-demo leezenbox ${leezenboxId}`);
      return { bikes: 0, saddles: 0 };
    }
    data = await getLeezenboxDataByTTNKey(ttnKey);
  }

  if (data.length === 0) {
    return { bikes: 0, saddles: 0 };
  }

  // Get the most recent data point
  const latestDataPoint = data.sort(
    (a, b) =>
      new Date(b.received_at).getTime() - new Date(a.received_at).getTime()
  )[0];

  return {
    bikes: latestDataPoint.predictions.length,
    saddles: 0, // We don't use saddles anymore
  };
}

// Function to get latest occupancy for all leezenboxes with demo support
export async function getLatestOccupancyForAllLeezenboxes(
  leezenboxes: Array<{ id: number; demo: boolean; ttn_location_key: string }>
): Promise<{ [leezenboxId: number]: { bikes: number; saddles: number } }> {
  const occupancies: {
    [leezenboxId: number]: { bikes: number; saddles: number };
  } = {};

  for (const leezenbox of leezenboxes) {
    const occupancy = await getLatestOccupancyByLeezenbox(
      leezenbox.id,
      leezenbox.demo,
      leezenbox.ttn_location_key
    );
    occupancies[leezenbox.id] = occupancy;
  }

  return occupancies;
}
