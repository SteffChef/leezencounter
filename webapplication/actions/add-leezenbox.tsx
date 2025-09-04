"use server";

import { Leezenbox } from "@/types";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface CreateLeezenboxData {
  name: string;
  address: string;
  ttn_location_key: string;
  postcode: string;
  city: string;
  latitude: number;
  longitude: number;
  num_lockers_with_power: number;
  capacity: number;
}

export async function addLeezenbox(
  data: CreateLeezenboxData
): Promise<Leezenbox | null> {
  try {
    const result = await pool.query(
      `INSERT INTO leezenbox 
       (name, address, ttn_location_key, postcode, city, latitude, longitude, num_lockers_with_power, capacity) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [
        data.name,
        data.address,
        data.ttn_location_key,
        data.postcode,
        data.city,
        data.latitude,
        data.longitude,
        data.num_lockers_with_power,
        data.capacity,
      ]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error("Error adding leezenbox:", error);
    throw new Error("Failed to add leezenbox");
  }
}
