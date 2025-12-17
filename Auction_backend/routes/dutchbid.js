import express from "express";
import { db } from "../conf/db.js";
import auth from "../middleware/auth.js";
import { io } from "../server.js";

const router = express.Router();

// Buy the item
router.post('/buy/:id', auth, async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  try {
    // Check auction exists and not sold yet (need to join with auctions table for end_time)
    const auctionRes = await db.query(
      `SELECT da.*, a.end_time 
       FROM dutch_auctions da
       JOIN auctions a ON da.auction_id = a.id
       WHERE da.auction_id=$1 AND da.winner_id IS NULL AND a.end_time > NOW()`,
      [id]
    );
    if (!auctionRes.rows.length) return res.status(400).json({ error: 'Auction ended or sold' });

    const auction = auctionRes.rows[0];

    // Update winner
    await db.query('UPDATE dutch_auctions SET winner_id=$1 WHERE auction_id=$2', [user_id, id]);

    // Emit winner event
    io.emit('dutchAuctionSold', {
      auction_id: parseInt(id),
      winner_id: user_id,
      final_price: auction.current_price,
    });

    res.json({ message: 'You won the auction', auction_id: id, final_price: auction.current_price });
  } catch (error) {
    console.error('Error buying Dutch auction:', error);
    res.status(500).json({ error: 'Failed to complete purchase' });
  }
});

export default router;