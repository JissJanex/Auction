import express from "express";
import { db } from "../conf/db.js";
import upload from "../middleware/upload.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Get all active or upcoming auctions
router.get("/", async (req, res) => {
  try {
    //Get a auctions where end time is over or if it is a dutch auction untill a winner exists
    const result = await db.query(`
      SELECT a.* FROM auctions a
      LEFT JOIN dutch_auctions da ON a.id = da.auction_id AND a.auction_type = 'dutch'
      WHERE a.end_time > NOW()
        AND (a.auction_type != 'dutch' OR da.winner_id IS NULL)
      ORDER BY a.start_time ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching active auctions:', err);
    res.status(500).json({ error: "Failed to fetch auctions" });
  }
});

// Get all ended auctions
router.get("/ended", async (req, res) => {
  try {
    //Get a auctions where end time is over or if it is a dutch auction untill a winner exists
    const result = await db.query(`
      SELECT a.* FROM auctions a
      LEFT JOIN dutch_auctions da ON a.id = da.auction_id AND a.auction_type = 'dutch'
      WHERE a.end_time <= NOW()
        OR (a.auction_type = 'dutch' AND da.winner_id IS NOT NULL)
      ORDER BY a.end_time DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching ended auctions:', err);
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
    // Convert start_time and end_time to UTC format
    const startUTC = new Date(start_time).toISOString();
    const endUTC = new Date(end_time).toISOString();

    const result = await db.query(
      `INSERT INTO auctions
       (title, description, image_url, start_time, end_time, owner_id, auction_type)
       VALUES ($1,$2,$3,$4,$5,$6, 'normal')
       RETURNING *`,
      [title, description, image_url, startUTC, endUTC, owner_id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create auction" });
  }
});

export default router;
