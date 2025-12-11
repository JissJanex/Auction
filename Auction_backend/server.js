import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import auctionRoutes from './routes/auction.js';
import bidRoutes, { placeBid } from './routes/bid.js';
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


//Web socket setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" } // Replace with frontend URL at production
});


io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("placeBid", async (data) => {
    try {
      // data should include: auction_id, user_id, amount
      const bid = await placeBid(data.auction_id, data.user_id, data.amount);

      // Broadcast the new bid to all connected clients
      io.emit("bidUpdate", bid);
    } catch (err) {
      socket.emit("bidError", { error: err.message });
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Start the HTTP server (used by both Express and Socket.IO)
server.listen(3000, () => {
  console.log("Server is running on port 3000");
});