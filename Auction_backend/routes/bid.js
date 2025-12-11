import express from "express";
import { db } from "../conf/db.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Place a bid on an auction
router.post("/", auth, async (req, res) => {
  try {
    const { auction_id, amount } = req.body;
    const user_id = req.user.id; //From the auth middleware

    //Checking if the creator of the auction itself is biding
    const owner_id = await db.query(
      `SELECT owner_id FROM auctions WHERE id=$1`,
      [auction_id]
    );
    if(owner_id.rows[0].owner_id === user_id) {
      return res.status(400).json({ error: "Owner cannot place a bid on their own auction" });
    }

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

    res.json({ message: "Bid placed" });
  } catch (err) {
    console.error("Error placing bid:", err);
    res.status(500).json({ error: "Failed to place bid" });
  }
});

export default router;
