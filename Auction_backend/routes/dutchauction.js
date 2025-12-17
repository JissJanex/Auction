import express from "express";
import { db } from "../conf/db.js";
import upload from "../middleware/upload.js";
import auth from "../middleware/auth.js";
import { io } from "../server.js";

const router = express.Router();

//Function to update the dutch aution price
export async function startDutchPriceDrop(auction_id) {
  // Get drop interval first
  const initialRes = await db.query(
    `SELECT drop_interval_minutes FROM dutch_auctions WHERE auction_id=$1`,
    [auction_id]
  );
  if (!initialRes.rows.length) {
    console.log(`No Dutch auction found with auction_id ${auction_id}`);
    return;
  }
  const dropIntervalMinutes = initialRes.rows[0].drop_interval_minutes;

  const interval = setInterval(async () => {
    try {
      // Get auction details from both tables
      const auctionRes = await db.query(
        `SELECT a.start_time, a.end_time, da.current_price, da.price_drop, da.winner_id
         FROM auctions a
         JOIN dutch_auctions da ON a.id = da.auction_id
         WHERE a.id = $1`,
        [auction_id]
      );
      
      if (!auctionRes.rows.length) {
        console.log(`Auction ${auction_id} not found, clearing interval`);
        return clearInterval(interval);
      }
      
      const auction = auctionRes.rows[0];
      const now = new Date();
      const startTime = new Date(auction.start_time);
      const endTime = new Date(auction.end_time);

      // Check if auction has started
      if (now < startTime) {
        return;
      }

      // Check if auction has ended or been sold
      if (auction.winner_id || now > endTime) {
        return clearInterval(interval);
      }

      const newPrice = Math.max(0, parseFloat(auction.current_price) - parseFloat(auction.price_drop));
      
      await db.query(
        `UPDATE dutch_auctions SET current_price=$1 WHERE auction_id=$2`,
        [newPrice, auction_id]
      );

      io.emit("dutchAuctionPriceUpdate", { auction_id, new_price: newPrice });

      if (newPrice <= 0) {
        clearInterval(interval);
      }
    } catch (error) {
      console.error(`Error in price drop for auction ${auction_id}:`, error);
    }
  }, 1000 * 60 * dropIntervalMinutes); // drop_interval_minutes from DB
};

//Get the dutch auction by Id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const auction = await db.query("SELECT * FROM dutch_auctions WHERE auction_id=$1", [
    id,
  ]);
  if (!auction.rows.length)
    return res.status(404).json({ error: "Auction not found" });
  res.json(auction.rows[0]);
});

//Post a new dutch auction
router.post("/", auth, upload.single("image"), async (req, res) => {
  const {
    title,
    description,
    start_price,
    price_drop,
    drop_interval_minutes,
    start_time,
    end_time,
  } = req.body;

  const owner_id = req.user.id;
  const image_url = req.file.path; // Cloudinary URL


  const auction = await db.query(
    `INSERT INTO auctions 
     (title, description, image_url, start_time, end_time, owner_id, auction_type)
     VALUES ($1,$2,$3,$4,$5,$6,'dutch')
     RETURNING id`,
    [title, description, image_url, start_time, end_time, owner_id]
  );

  await db.query(
    `INSERT INTO dutch_auctions
     (auction_id, start_price, current_price, price_drop, drop_interval_minutes)
     VALUES ($1,$2,$2,$3,$4)`,
    [auction.rows[0].id, start_price, price_drop, drop_interval_minutes]
  );

  // Start the price drop mechanism
  startDutchPriceDrop(auction.rows[0].id);

  res.json({ message: "Dutch auction created" });
});

export default router;
