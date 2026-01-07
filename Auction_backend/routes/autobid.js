import express from "express";
import { db } from "../conf/db.js";
import auth from "../middleware/auth.js";

const Router = express.Router();

Router.get("/", auth, async (req, res) => {
    const { auction_id, user_id } = req.query;
    
    try {
        const result = await db.query(
            'SELECT * FROM auto_bids WHERE auction_id = $1 AND user_id = $2',
            [auction_id, user_id]
        );
        
        res.status(200).json({
            exists: result.rows.length > 0,
            autobid: result.rows.length > 0 ? result.rows[0] : null
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Error checking auto bid" });
    }
});

Router.post("/", auth, async (req, res) => {
    const {auction_id, user_id, max_bid, increment} = req.body;
    try{
        await db.query('INSERT INTO auto_bids (auction_id, user_id, max_bid, increment) VALUES ($1, $2, $3, $4)', [auction_id, user_id, max_bid, increment]);
        res.status(201).send("Auto bid created successfully");
    }catch(err){
        console.log(err);
        res.status(500).send("Error creating auto bid");
    }
});

Router.delete("/", auth, async (req, res) => {
    const { auction_id, user_id } = req.body;

    try {
        await db.query(
            'DELETE FROM auto_bids WHERE auction_id = $1 AND user_id = $2',
            [auction_id, user_id]
        );
        res.status(200).send("Auto bid deleted successfully");
    } catch (err) {
        console.log(err);
        res.status(500).send("Error deleting auto bid");
    }
});


export default Router;
