import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export default function PlaceBid({ auction, onBidPlaced } = {}) {
  const [bid, setBid] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBid = async () => {
    // Validate auction prop
    if (!auction || !auction.id) {
      return;
    }

    // Validate bid amount
    const amount = parseFloat(bid);
    if (isNaN(amount) || amount <= 0) {
      return;
    }else if (auction.highest_bid && amount <= auction.highest_bid) {
      toast.error(`Bid must be higher than current highest bid of $${auction.highest_bid}`);
      return;
    }else if (amount < 5) {
      toast.error("Minimum bid amount is $5");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:3000/bids", {
        auction_id: auction.id,
        user_id: 2, // current user
        amount
      });
      setBid(""); // Clear input after successful bid
      // Notify parent to refresh or update current bid
      if (typeof onBidPlaced === 'function') {
        onBidPlaced({ amount, auctionId: auction.id, response: res.data });
      }
    } catch (error) {
      console.error("Error placing bid:", error);
    } finally {
      setLoading(false);
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
        disabled={loading}
        min="0"
        step="0.01"
      />
      <button
        className="bid-button"
        onClick={handleBid}
        disabled={loading}
      >
        {loading ? "..." : "BID"}
      </button>
    </div>
  );
}
