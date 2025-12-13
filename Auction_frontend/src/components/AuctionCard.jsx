import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

function AuctionCard({ auction }) {
  const [currentStatus, setCurrentStatus] = useState('upcoming');

  // Calculate status dynamically based on start_time and end_time
  const getAuctionStatus = () => {
    const now = new Date();
    const startTime = new Date(auction.start_time);
    const endTime = new Date(auction.end_time);

    if (now < startTime) return 'upcoming';
    if (now > endTime) return 'ended';
    return 'active';
  };

  // Update status dynamically - recalculate every second
  useEffect(() => {
    // Initial status
    setCurrentStatus(getAuctionStatus());

    // Update every second to catch status transitions
    const interval = setInterval(() => {
      setCurrentStatus(getAuctionStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, [auction.start_time, auction.end_time]);

  const getStatusBadge = (status) => {
    const statusMap = {
      active: { class: "badge-active", label: "Active" },
      upcoming: { class: "badge-pending", label: "Upcoming" },
    };
    const statusInfo = statusMap[status] || statusMap.upcoming;
    return <span className={`badge ${statusInfo.class}`}>{statusInfo.label}</span>;
  };

  return (
    <article className={`auction-card`}>
      {currentStatus !== 'ended' && (
        <div className="auction-card-status">
          {getStatusBadge(currentStatus)}
        </div>
      )}
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
          <Link to={`/auction/${auction.id}`} className="btn btn-accent btn-block" role="button">
            View
          </Link>
      </div>
    </article>
  );
}

export default AuctionCard;
