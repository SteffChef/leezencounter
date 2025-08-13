"use server";

import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function deleteLeezenbox(id: number): Promise<boolean> {
  try {
    const result = await pool.query(
      "DELETE FROM leezenbox WHERE id = $1 RETURNING id",
      [id]
    );

    return result.rows.length > 0;
  } catch (error) {
    console.error("Error deleting leezenbox:", error);
    throw new Error("Failed to delete leezenbox");
  }
}
