import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/hello", (req: Request, res: Response) => {
  res.json({ message: "Hello from the backend!" });
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Participants Route
app.get("/api/participants", async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM participants");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
});

// Leezenbox Route
app.get("/api/leezenbox", async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM leezenbox");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
});

app.listen(port, () => {
  console.log(`Backend running at http://localhost:${port}`);
});
