import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import auctionRoutes from "./routes/auction.js";
import bidRoutes, { placeBid } from "./routes/bid.js";
import auth from "./routes/auth.js";
import autobidRoutes from "./routes/autobid.js";
import dutchAuctionRoutes from "./routes/dutchauction.js";
import dutchBidRoutes from "./routes/dutchbid.js";

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

app.use("/auctions", auctionRoutes);
app.use("/bids", bidRoutes);
app.use("/autobids", autobidRoutes);
app.use("/auth", auth);
app.use("/dutchauctions", dutchAuctionRoutes);
app.use("/dutchbids", dutchBidRoutes);

const server = http.createServer(app);
export const io = new Server(server, {
  cors: { origin: FRONTEND_URL === "*" ? "*" : [FRONTEND_URL] },
});

io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("placeBid", async (data) => {
    try {
      const result = await placeBid(data.auction_id, data.user_id, data.amount);

      io.emit("bidUpdate", {
        auction_id: result.auction_id,
        user_id: result.user_id,
        amount: result.amount,
        previousHighestBidder: result.previousHighestBidder,
        isAutobid: false,
      });

      if (result.autobidResult && Array.isArray(result.autobidResult)) {
        for (const autobid of result.autobidResult) {
          io.emit("bidUpdate", autobid);
        }
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

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
