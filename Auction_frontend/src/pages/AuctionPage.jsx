import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import AuctionCard from "../components/AuctionCard";

function AuctionPage() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAuctions = async () => {
    try {
      const response = await axios.get("http://localhost:3000/auctions");
      setAuctions(response.data);
    } catch (error) {
      console.error("Error fetching auctions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctions();
  }, []);

  if (loading) {
    return null;
  }

  if (auctions.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">😶 Nothing Here</div>
        <h3 className="empty-state-title">No Auctions Yet</h3>
        <p>Be the first to create an auction!</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header-flex">
        <div className="page-header-spacer"></div>
        <div className="page-header-center">
          <h1 className="page-title">Live Auctions</h1>
          <p className="page-subtitle">
            Discover amazing items and place your bids
          </p>
        </div>
        <div className="page-header-actions">
          <Link to="/auctions/ended">
            <button className="btn btn-outline">Past Auctions</button>
          </Link>
        </div>
      </div>

      <div className="auctions-grid">
        {auctions.map((auction) => (
          <AuctionCard key={auction.id} auction={auction} />
        ))}
      </div>

      <div className="action-buttons">
        <Link to="/createauction">
          <button className="btn btn-primary btn-lg">Create New Auction</button>
        </Link>
      </div>
    </div>
  );
}

export default AuctionPage;
