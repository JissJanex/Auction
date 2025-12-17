import express from "express";
import { db } from "../conf/db.js";
import auth from "../middleware/auth.js";
import { io } from "../server.js";

const router = express.Router();

// Buy the item
router.post('/buy/:id', auth, async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  // Check auction exists and not sold yet
  const auctionRes = await db.query(
    'SELECT * FROM dutch_auctions WHERE id=$1 AND winner_id IS NULL AND end_time > NOW()',
    [id]
  );
  if (!auctionRes.rows.length) return res.status(400).json({ error: 'Auction ended or sold' });

  const auction = auctionRes.rows[0];

  // Update winner
  await db.query('UPDATE dutch_auctions SET winner_id=$1 WHERE id=$2', [user_id, id]);

  // Emit winner event
  io.emit('dutchAuctionSold', {
    auction_id: id,
    winner_id: user_id,
    final_price: auction.current_price,
  });

  res.json({ message: 'You won the auction', auction_id: id, final_price: auction.current_price });
});

export default router;