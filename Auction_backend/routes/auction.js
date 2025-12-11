import express from 'express';
import { db } from '../conf/db.js';
import generateStatus from '../middleware/auctionStatus.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get all active or upcoming auctions
router.get('/', async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM auctions WHERE status IN ('active', 'upcoming')");
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching auctions:', err);
    res.status(500).json({ error: 'Failed to fetch auctions' });
  }
});

// Get all ended auctions
router.get('/ended', async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM auctions WHERE status = 'ended'");
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching ended auctions:', err);
    res.status(500).json({ error: 'Failed to fetch ended auctions' });
  }
});

// Get a single auction
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM auctions WHERE id = $1', [id]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching auction:', err);
    res.status(500).json({ error: 'Failed to fetch auction' });
  }
});

// Insert a new auction
router.post('/', auth, async (req, res) => {
  const owner_id = req.user.id;
  
  try {
    const { title, description, image_url, start_time, end_time} = req.body;
    const status = generateStatus(new Date(start_time), new Date(end_time));
    const q = await db.query(
      `INSERT INTO auctions (title, description, image_url, start_time, end_time, owner_id, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [title, description, image_url, start_time, end_time, owner_id, status]
    );
    res.json(q.rows[0]);
  } catch (err) {
    console.error('Error creating auction:', err);
    res.status(500).json({ error: 'Failed to create auction' });
  }
});

export default router;
