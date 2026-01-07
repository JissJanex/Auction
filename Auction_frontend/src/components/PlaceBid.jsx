import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { SOCKET_URL } from "../config";

export default function PlaceBid({ auction, onBidPlaced } = {}) {
  const [bid, setBid] = useState("");
  const [bids, setBids] = useState([]);
  const navigate = useNavigate();

  const socketRef = useRef(null);
  const onBidPlacedRef = useRef(onBidPlaced);

  useEffect(() => {
    onBidPlacedRef.current = onBidPlaced;
  }, [onBidPlaced]);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on("bidUpdate", (newBid) => {
      if (newBid.auction_id === auction.id) {
        setBids((prev) => [...prev, newBid]);
        if (typeof onBidPlacedRef.current === "function") {
          onBidPlacedRef.current(newBid);
        }
      }
    });

    socketRef.current.on("bidError", (err) => {
      toast.error(err.error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off("bidUpdate");
        socketRef.current.off("bidError");
        socketRef.current.disconnect();
      }
    };
  }, [auction.id]);

  const handleBid = async () => {
    if (!auction || !auction.id) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const amount = parseFloat(bid);
    const currentBid = parseFloat(auction.current_bid);

    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid bid amount greater than 0");
      return;
    } else if (currentBid && amount <= currentBid) {
      toast.error(
        `Bid must be higher than current highest bid of $${currentBid.toFixed(
          2
        )}`
      );
      return;
    } else if (amount < 5) {
      toast.error("Minimum bid amount is $5");
      return;
    }

    socketRef.current.emit("placeBid", {
      auction_id: auction.id,
      user_id: jwtDecode(token).id,
      amount,
    });

    setBid("");
  };

  return (
    <div className="bid-form">
      <input
        className="bid-input"
        type="number"
        placeholder="$0.00"
        value={bid}
        onChange={(e) => setBid(e.target.value)}
        min="0"
        step="0.01"
      />
      <button className="bid-button" onClick={handleBid}>
        BID
      </button>
    </div>
  );
}
