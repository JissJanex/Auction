import express from 'express';
import cors from 'cors';
import {db} from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Server is running");
})

app.listen(3000, () =>{
    console.log("Server is running on port 3000");
})

//Get all active auctions
app.get("/auctions", async (req, res) => {
    const result = await db.query("SELECT * FROM auctions WHERE status = 'active'");
    res.json(result.rows);
});

//Insert a new auction
app.post("/auctions", async (req, res) => {
  const { title, description, image_url, start_time, end_time, owner_id } = req.body;

  const q = await db.query(
    `INSERT INTO auctions (title, description, image_url, start_time, end_time, owner_id)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
     [title, description, image_url, start_time, end_time, owner_id]
  );

  res.json(q.rows[0]);
});

//Place a bid on an auction
app.post("/bids", async (req, res) => {
  const { auction_id, user_id, amount } = req.body;

  // Insert the bid
  await db.query(
    `INSERT INTO bids (auction_id, user_id, amount) VALUES ($1,$2,$3)`,
    [auction_id, user_id, amount]
  );

  // Update the current bid in the auctions table
  await db.query(
    `UPDATE auctions SET current_bid=$1 WHERE id=$2`,
    [amount, auction_id]
  );

  res.json({ message: "Bid placed" });
});
