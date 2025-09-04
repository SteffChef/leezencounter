"use server";

import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function deleteLeezenbox(
  id: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // First, check if this is a default location
    const checkResult = await pool.query(
      "SELECT default_location, name FROM leezenbox WHERE id = $1",
      [id]
    );

    if (checkResult.rows.length === 0) {
      return { success: false, error: "Leezenbox not found" };
    }

    const leezenbox = checkResult.rows[0];
    if (leezenbox.default_location) {
      return {
        success: false,
        error: `Cannot delete "${leezenbox.name}" because it is marked as a default location`,
      };
    }

    // Proceed with deletion if not a default location
    const result = await pool.query(
      "DELETE FROM leezenbox WHERE id = $1 RETURNING id",
      [id]
    );

    return { success: result.rows.length > 0 };
  } catch (error) {
    console.error("Error deleting leezenbox:", error);
    return { success: false, error: "Failed to delete leezenbox" };
  }
}
