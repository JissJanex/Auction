import express from "express";
import { db } from "../conf/db.js";
import auth from "../middleware/auth.js";

const router = express.Router();

//Function to handle autobids
async function auto_bid(auction_id, currentBidderId) {
  try {
    // Get the current highest bid
    const maxBidResult = await db.query(
      `SELECT amount, user_id FROM bids WHERE auction_id=$1 ORDER BY amount DESC LIMIT 1`,
      [auction_id]
    );
    
    if (maxBidResult.rows.length === 0) {
      return null; // No bids yet
    }
    
    const currentHighestBid = parseFloat(maxBidResult.rows[0].amount);
    const currentHighestBidder = maxBidResult.rows[0].user_id;
    
    // Get autobidders who have max_bid higher than current bid and aren't the current bidder
    const autobidders = await db.query(
      `SELECT * FROM auto_bids 
       WHERE auction_id=$1 
       AND max_bid > $2 
       AND user_id != $3
       ORDER BY max_bid DESC, created_at ASC`,
      [auction_id, currentHighestBid, currentHighestBidder]
    );
    
    if (autobidders.rows.length === 0) {
      return null; // No eligible autobidders
    }
    
    // Get the highest autobidder
    const topAutobidder = autobidders.rows[0];
    
    // Calculate the new bid amount
    const increment = parseFloat(topAutobidder.increment);
    const maxBid = parseFloat(topAutobidder.max_bid);
    let newBidAmount = currentHighestBid + increment;
    
    // Don't exceed the autobidder's max_bid
    if (newBidAmount > maxBid) {
      newBidAmount = maxBid;
    }
    
    // Insert the autobid directly (without calling placeBid to avoid recursion)
    await db.query(
      `INSERT INTO bids (auction_id, user_id, amount) VALUES ($1,$2,$3)`,
      [auction_id, topAutobidder.user_id, newBidAmount]
    );
    
    // Update the current bid in the auctions table
    await db.query(`UPDATE auctions SET current_bid=$1 WHERE id=$2`, [
      newBidAmount,
      auction_id,
    ]);
    
    return { 
      auction_id, 
      user_id: topAutobidder.user_id, 
      amount: newBidAmount,
      previousHighestBidder: currentHighestBidder,
      isAutobid: true
    };
  } catch (error) {
    console.error("Error in auto_bid:", error);
    return null;
  }
}

// Helper function to check and update the bid in the database (used by both HTTP and WebSocket)
export async function placeBid(auction_id, user_id, amount) {
  // Checking if owner is bidding on own auction
  const owner_id = await db.query(`SELECT owner_id FROM auctions WHERE id=$1`, [
    auction_id,
  ]);
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
  const previousHighestBidder =
    previousBidResult.rows.length > 0
      ? previousBidResult.rows[0].user_id
      : null;

  // Insert the bid
  await db.query(
    `INSERT INTO bids (auction_id, user_id, amount) VALUES ($1,$2,$3)`,
    [auction_id, user_id, amount]
  );

  // Update the current bid in the auctions table
  await db.query(`UPDATE auctions SET current_bid=$1 WHERE id=$2`, [
    amount,
    auction_id,
  ]);

  // Call auto_bid to handle any automatic bidding logic (pass user_id to exclude them)
  const autobidResult = await auto_bid(auction_id, user_id);

  return { auction_id, user_id, amount, previousHighestBidder, autobidResult };
}

// Get bids for an auction to display winner
router.get("/", async (req, res) => {
  try {
    const { auction_id } = req.query;
    if (!auction_id)
      return res.status(400).json({ error: "auction_id required" });

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
    res.status(500).json({ error: "Failed to fetch bids" });
  }
});

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
