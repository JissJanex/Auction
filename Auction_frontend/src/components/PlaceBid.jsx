import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export default function PlaceBid({ auction }) {
  const [bid, setBid] = useState("");

  const handleBid = async () => {
    await axios.post("http://localhost:3000/bids", {
      auction_id: auction.id,
      user_id: 2, // current user
      amount: parseFloat(bid)
    });
    toast.success("Bid placed!");
  };

  return (
    <div>
      <input placeholder="Your Bid" value={bid} onChange={e => setBid(e.target.value)} />
      <button onClick={handleBid}>Bid</button>
    </div>
  );
}
