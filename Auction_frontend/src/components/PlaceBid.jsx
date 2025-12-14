import { useState , useEffect, useRef} from "react";
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

  useEffect(() => {
    socketRef.current = io(SOCKET_URL);

    // Listen for new bids from server
    socketRef.current.on("bidUpdate", (newBid) => {
      if (newBid.auction_id === auction.id) {
        setBids((prev) => [...prev, newBid]);
        if (typeof onBidPlaced === "function") {
          onBidPlaced(newBid);
        }
      }
      
    });

    // Listen for errors
    socketRef.current.on("bidError", (err) => {
      toast.error(err.error);
    });

    return () => {
      socketRef.current.off("bidUpdate");
      socketRef.current.off("bidError");
      socketRef.current.disconnect();
    };
  }, []);

  const handleBid = async () => {
    // Validate auction prop
    if (!auction || !auction.id) {
      return;
    }

    //Token from localstorage
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // Validate bid amount
    const amount = parseFloat(bid);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid bid amount greater than 0");
      return;
    } else if (auction.current_bid && amount <= auction.current_bid) {
      toast.error(
        `Bid must be higher than current highest bid of $${auction.current_bid}`
      );
      return;
    } else if (amount < 5) {
      toast.error("Minimum bid amount is $5");
      return;
    }

    // Send bid to server via Websocket
    socketRef.current.emit("placeBid", {
      auction_id: auction.id,
      user_id: jwtDecode(token).id,
      amount,
    });

    setBid(""); // clear input
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
