import { useState, useEffect } from "react";
import axios from "axios";
import PlaceBid from "./PlaceBid";

function AllAuctions() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAuction, setSelectedAuction] = useState(null);

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
    // Fetch auctions from the backend API
    fetchAuctions();
  }, []);

  const handleBidPlaced = ({ amount, auctionId }) => {
    // Optimistically update current bid in UI
    setAuctions(prev => prev.map(a => (
      a.id === auctionId
        ? { ...a, current_bid: Math.max(Number(a.current_bid || 0), Number(amount)) }
        : a
    )));
    // Optionally re-fetch to ensure consistency
    fetchAuctions();
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      active: { class: "badge-active", label: "🔥 Active" },
      upcoming: { class: "badge-pending", label: "⏳ Upcoming" },
      closed: { class: "badge-ended", label: "🏁 Closed" },
    };
    const statusInfo = statusMap[status] || statusMap.upcoming;
    return <span className={`badge ${statusInfo.class}`}>{statusInfo.label}</span>;
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (auctions.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🔨</div>
        <h3 className="empty-state-title">No Auctions Yet</h3>
        <p>Be the first to create an auction!</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Live Auctions</h1>
        <p className="page-subtitle">Discover amazing items and place your bids</p>
      </div>

      <div className="auctions-grid">
        {auctions.map((auction) => (
          // mark card inactive when auction is not active
          <article key={auction.id} className={`auction-card ${auction.status !== 'active' ? 'inactive' : ''}`}>
            <div className="auction-card-status">
              {getStatusBadge(auction.status)}
            </div>
            {auction.image_url ? (
            <img
              src={auction.image_url || "https://picsum.photos/"}
              alt={auction.title}
              className="auction-card-image"
            />
            ) : (
              <div className="auction-card-placeholder">No Image Available</div>
            )}
            <div className="auction-card-body">
              <h2 className="auction-card-title">{auction.title}</h2>
              <p className="auction-card-description">{auction.description}</p>
              <div className="auction-card-price">
                <span className="price-label">Current Bid:</span>
                <span className="price-value">${auction.current_bid || "0.00"}</span>
              </div>
            </div>
            <div className="auction-card-footer">
              {auction.status === 'active' ? (
                selectedAuction?.id === auction.id ? (
                  <PlaceBid auction={auction} onBidPlaced={handleBidPlaced} />
                ) : (
                  <button
                    className="btn btn-accent"
                    style={{ width: "100%" }}
                    onClick={() => setSelectedAuction(auction)}
                  >
                    💰 Place Bid
                  </button>
                )
              ) : (
                <button className="btn btn-outline" style={{ width: "100%" }} disabled>
                  {auction.status === 'ended' ? ' Auction Ended' : `Starts at ${new Date(auction.start_time).toLocaleString()}`}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default AllAuctions;
