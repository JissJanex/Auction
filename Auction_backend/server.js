import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import auctionRoutes from "./routes/auction.js";
import bidRoutes, { placeBid } from "./routes/bid.js";
import auth from "./routes/auth.js";
import autobidRoutes from "./routes/autobid.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "*";
const PORT = process.env.PORT || 3000;

const app = express();
app.use(
  cors({
    origin: FRONTEND_URL === "*" ? "*" : [FRONTEND_URL],
    credentials: true,
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is running");
});

// Mount routes
app.use("/auctions", auctionRoutes);
app.use("/bids", bidRoutes);
app.use("/autobids", autobidRoutes);
app.use("/auth", auth);

//Web socket setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: FRONTEND_URL === "*" ? "*" : [FRONTEND_URL] },
});

io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("placeBid", async (data) => {
    try {
      // data should include: auction_id, user_id, amount
      const result = await placeBid(data.auction_id, data.user_id, data.amount);

      // Broadcast the manual bid to all connected clients
      io.emit("bidUpdate", {
        auction_id: result.auction_id,
        user_id: result.user_id,
        amount: result.amount,
        previousHighestBidder: result.previousHighestBidder,
        isAutobid: false,
      });

      // If there was an autobid triggered, broadcast it too
      if (result.autobidResult) {
        io.emit("bidUpdate", result.autobidResult);
      }
      console.log(result);
    } catch (err) {
      socket.emit("bidError", { error: err.message });
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Start the HTTP server (used by both Express and Socket.IO)
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
