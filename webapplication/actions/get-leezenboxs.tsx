"use server";

import { Leezenbox } from "@/types";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function getLeezenboxs(): Promise<Leezenbox[]> {
  try {
    const result = await pool.query("SELECT * FROM leezenbox ORDER BY name");
    return result.rows;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getLeezenboxById(id: number): Promise<Leezenbox | null> {
  try {
    const result = await pool.query("SELECT * FROM leezenbox WHERE id = $1", [
      id,
    ]);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error(error);
    return null;
  }
}
