import express from 'express';
import cors from 'cors';
import auctionRoutes from './routes/auction.js';
import bidRoutes from './routes/bid.js';
import auth from './routes/auth.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Server is running");
});

// Mount routes
app.use('/auctions', auctionRoutes);
app.use('/bids', bidRoutes);
app.use('/auth', auth);

app.listen(3000, () =>{
    console.log("Server is running on port 3000");
});
