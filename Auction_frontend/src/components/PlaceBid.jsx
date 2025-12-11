import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export default function PlaceBid({ auction, onBidPlaced } = {}) {
  const [bid, setBid] = useState("");
  const navigate = useNavigate();

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

    try {
      const res = await axios.post(
        "http://localhost:3000/bids",
        {
          auction_id: auction.id,
          amount,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setBid(""); // Clear input after successful bid
      toast.success("Bid placed successfully!");
      // Notify parent to refresh or update current bid
      if (typeof onBidPlaced === "function") {
        onBidPlaced({ amount, auctionId: auction.id, response: res.data });
      }
    } catch (error) {
      console.error("Error placing bid:", error);
      if (error.response?.status === 400) { //Owner bidding own auction
        toast.error("You cannot bid on your own auction");
      } else if (error.response?.status === 401) {
        toast.error("Session expired. Please login again");
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        toast.error("Failed to place bid. Please try again");
      }
    }
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
