import pkg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pkg;

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

db.query("SELECT 1")
  .then(() => console.log("DB connected"))
  .catch(err => console.error("DB connection error:", err));
