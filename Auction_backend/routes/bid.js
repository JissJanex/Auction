import express from "express";
import { db } from "../conf/db.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Get bids for an auction to display winner
router.get('/', async (req, res) => {
  try {
    const { auction_id } = req.query;
    if (!auction_id) return res.status(400).json({ error: 'auction_id required' });

    const result = await db.query(
      `SELECT b.*, u.name as user_name
       FROM bids b
       LEFT JOIN users u ON b.user_id = u.id
       WHERE b.auction_id = $1
       ORDER BY b.amount DESC, b.id ASC`,
      [auction_id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bids' });
  }
});

// Helper function to check and update the bid in the database (used by both HTTP and WebSocket)
export async function placeBid(auction_id, user_id, amount) {
  // Checking if owner is bidding on own auction
  const owner_id = await db.query(`SELECT owner_id FROM auctions WHERE id=$1`, [auction_id]);
  if (owner_id.rows[0].owner_id === user_id) {
    throw new Error("Owner cannot place a bid on their own auction");
  }

  // Check if auction is still active
  const auctionCheck = await db.query(
    `SELECT end_time FROM auctions WHERE id=$1 AND end_time > NOW()`,
    [auction_id]
  );
  if (auctionCheck.rows.length === 0) {
    throw new Error("This auction has ended and is no longer accepting bids");
  }

  // Get the previous highest bidder (if exists)
  const previousBidResult = await db.query(
    `SELECT user_id FROM bids WHERE auction_id=$1 ORDER BY amount DESC LIMIT 1`,
    [auction_id]
  );
  const previousHighestBidder = previousBidResult.rows.length > 0 ? previousBidResult.rows[0].user_id : null;

  // Insert the bid
  await db.query(`INSERT INTO bids (auction_id, user_id, amount) VALUES ($1,$2,$3)`, [
    auction_id,
    user_id,
    amount,
  ]);

  // Update the current bid in the auctions table
  await db.query(`UPDATE auctions SET current_bid=$1 WHERE id=$2`, [amount, auction_id]);

  return { auction_id, user_id, amount, previousHighestBidder };
}

// HTTP POST route
router.post("/", auth, async (req, res) => {
  try {
    const { auction_id, amount } = req.body;
    const user_id = req.user.id;

    const bid = await placeBid(auction_id, user_id, amount);
    res.json({ message: "Bid placed", bid });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
