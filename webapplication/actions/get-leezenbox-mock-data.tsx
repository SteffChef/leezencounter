"use server";

import { DataPoint } from "@/types";
import { exampleDataPoints } from "@/example-data";

export async function getLeezenboxData(): Promise<DataPoint[]> {
  try {
    // const result = await pool.query("SELECT * FROM leezenbox");
    const data: DataPoint[] = exampleDataPoints;
    return data;
  } catch (error) {
    console.error(error);
    return [];
  }
}
