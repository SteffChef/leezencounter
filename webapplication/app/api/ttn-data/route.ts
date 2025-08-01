import { NextResponse } from "next/server";
import { Pool } from "pg";
import { TTNDataRecord } from "@/types";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const deviceId = searchParams.get("device_id");
    const location = searchParams.get("location");

    // Build query with optional filters
    let query = `
      SELECT 
        id,
        device_id,
        received_at,
        confidence_threshold,
        location,
        timestamp,
        total_detected,
        predictions,
        created_at,
        updated_at
      FROM ttn_data
    `;

    const queryParams: (string | number)[] = [];
    const conditions: string[] = [];

    if (deviceId) {
      conditions.push(`device_id = $${queryParams.length + 1}`);
      queryParams.push(deviceId);
    }

    if (location) {
      conditions.push(`location = $${queryParams.length + 1}`);
      queryParams.push(location);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += ` ORDER BY timestamp DESC LIMIT $${
      queryParams.length + 1
    } OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count for pagination
    let countQuery = "SELECT COUNT(*) FROM ttn_data";
    const countParams: (string | number)[] = [];

    if (conditions.length > 0) {
      countQuery += ` WHERE ${conditions.join(" AND ")}`;
      if (deviceId) countParams.push(deviceId);
      if (location) countParams.push(location);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    const data: TTNDataRecord[] = result.rows.map((row) => ({
      id: row.id,
      device_id: row.device_id,
      received_at: row.received_at,
      confidence_threshold: parseFloat(row.confidence_threshold),
      location: row.location,
      timestamp: row.timestamp,
      total_detected: row.total_detected,
      predictions: row.predictions, // Already parsed as JSON by pg
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    return NextResponse.json({
      data,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch TTN data", details: String(error) },
      { status: 500 }
    );
  }
}
