import express from "express";
import { db } from "../conf/db.js";
import upload from "../middleware/upload.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Get all active or upcoming auctions
router.get("/", async (req, res) => {
  try {
    console.log("db");
    const result = await db.query(`
      SELECT * FROM auctions
      WHERE end_time > NOW()
      ORDER BY start_time ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch auctions" });
  }
});

// Get all ended auctions
router.get("/ended", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM auctions
      WHERE end_time <= NOW()
      ORDER BY end_time DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch ended auctions" });
  }
});

// Get a single auction
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const result = await db.query("SELECT * FROM auctions WHERE id=$1", [id]);
  res.json(result.rows[0]);
});

// Insert a new auction
router.post("/", auth, upload.single("image"), async (req, res) => {
  const owner_id = req.user.id;
  const { title, description, start_time, end_time } = req.body;

  const image_url = req.file.path; // Cloudinary URL

  try {
    const result = await db.query(
      `INSERT INTO auctions
       (title, description, image_url, start_time, end_time, owner_id)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [title, description, image_url, start_time, end_time, owner_id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create auction" });
  }
});

export default router;
