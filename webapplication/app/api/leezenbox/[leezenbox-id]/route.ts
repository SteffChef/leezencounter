import { exampleDataPoints } from "@/example-data";
import { DataPoint } from "@/types";
import { NextResponse } from "next/server";
// import { Pool } from "pg";

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
// });

export async function GET() {
  try {
    // const result = await pool.query("SELECT * FROM leezenbox");
    const data: DataPoint[] = exampleDataPoints;
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
