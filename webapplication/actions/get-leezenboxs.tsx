"use server";

import { Leezenbox } from "@/types";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function getLeezenboxs(): Promise<Leezenbox[]> {
  try {
    const result = await pool.query("SELECT * FROM leezenbox");
    return result.rows;
  } catch (error) {
    console.error(error);
    return [];
  }
}
