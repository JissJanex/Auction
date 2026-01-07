import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";
import PlaceBid from "../components/PlaceBid";
import AutoBid from "../components/AutoBid";
import BuyNow from "../components/BuyNow";
import WinnerModal from "../components/WinnerModal";
import { API_BASE_URL, SOCKET_URL } from "../config";

function AuctionDetails() {
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState("");
  const [isDutchAuction, setIsDutchAuction] = useState(false);
  const socketRef = useRef(null);
  const hasBeenOutbidRef = useRef(false);

  const { id } = useParams();

  const fetchAuction = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/auctions/${id}`);
      const auctionData = res.data;
      
      if (auctionData.auction_type === 'dutch') {
        const dutchRes = await axios.get(`${API_BASE_URL}/dutchauctions/${id}`);
        setAuction({ ...auctionData, ...dutchRes.data });
        setIsDutchAuction(true);
      } else {
        setAuction(auctionData);
        setIsDutchAuction(false);
      }
    } catch (error) {
      console.error("Error fetching auction details:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAuction();
  }, [id]);

  // Socket.IO connection for real-time bid updates
  useEffect(() => {
    // Create new socket connection
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on("dutchAuctionPriceUpdate", (data) => {
      if (data.auction_id === parseInt(id)) {
        setAuction((prev) => prev ? { ...prev, current_price: data.new_price } : null);
      }
    });

    socketRef.current.on("dutchAuctionSold", (data) => {
      if (data.auction_id === parseInt(id)) {
        fetchAuction();
      }
    });

    socketRef.current.on("bidUpdate", (newBid) => {
      if (newBid.auction_id === parseInt(id)) {
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const decoded = jwtDecode(token);
            const currentUserId = decoded.id;

            if (
              newBid.previousHighestBidder === currentUserId &&
              newBid.user_id !== currentUserId &&
              !hasBeenOutbidRef.current
            ) {
              if (newBid.isAutobid) {
                toast.info(
                  `You've been outbid by an automatic bid! New highest bid: $${Number(newBid.amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
                  {
                    position: "top-center",
                    autoClose: 5000,
                    icon: "🤖",
                  }
                );
              } else {
                toast.warning(
                  `You've been outbid! New highest bid: $${Number(newBid.amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
                  {
                    position: "top-center",
                    autoClose: 5000,
                  }
                );
              }
              hasBeenOutbidRef.current = true; // Mark as notified (only once)
            }

            // Reset the notification flag if current user places a new bid
            if (newBid.user_id === currentUserId) {
              hasBeenOutbidRef.current = false;
            }
          } catch (error) {
            console.error("Error decoding token:", error);
          }
        }

        fetchAuction();
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off("bidUpdate");
        socketRef.current.off("dutchAuctionPriceUpdate");
        socketRef.current.off("dutchAuctionSold");
        socketRef.current.disconnect();
      }
    };
  }, [id, fetchAuction]);

  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [winnerInfo, setWinnerInfo] = useState(null);

  const handleBidPlaced = () => {
    fetchAuction();
  };

  // Calculate auction status dynamically based on times
  const getAuctionStatus = () => {
    if (!auction) return null;
    const now = new Date();
    const startTime = new Date(auction.start_time);
    const endTime = new Date(auction.end_time);

    if (now < startTime) return "upcoming";
    if (isDutchAuction && auction.winner_id) return "ended";
    if (now > endTime) return "ended";
    return "active";
  };

  // Update status dynamically - recalculate every second
  useEffect(() => {
    if (!auction) return;

    setCurrentStatus(getAuctionStatus());

    const interval = setInterval(() => {
      const newStatus = getAuctionStatus();
      if (newStatus !== currentStatus) {
        setCurrentStatus(newStatus);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [auction, currentStatus]);

  const winnerLoadedRef = useRef(false);
  useEffect(() => {
    if (!auction) return;
    if (currentStatus !== "ended") return;

    if (showWinnerModal) return;
    
    if (winnerLoadedRef.current) return;

    const loadWinner = async () => {
      try {
        if (isDutchAuction) {
          if (auction.winner_id) {
            const token = localStorage.getItem("token");
            let role = "loser";
            if (token) {
              try {
                const decoded = jwtDecode(token);
                const currentUserId = decoded.id;
                if (currentUserId === auction.owner_id) role = "owner";
                else if (currentUserId === auction.winner_id) role = "winner";
              } catch (err) {}
            }
            setWinnerInfo({ 
              role, 
              winnerName: "A buyer",
              winningBid: auction.current_price,
              isDutch: true
            });
          } else {
            const token = localStorage.getItem("token");
            const role = token
              ? jwtDecode(token).id === auction.owner_id
                ? "owner"
                : "loser"
              : "loser";
            setWinnerInfo({
              role,
              winnerName: null,
              winningBid: auction.current_price || null,
              isDutch: true
            });
          }
          setShowWinnerModal(true);
          winnerLoadedRef.current = true;
          return;
        }

        const res = await axios.get(
          `${API_BASE_URL}/bids?auction_id=${auction.id}`
        );
        const bids = res.data;
        if (!bids || bids.length === 0) {
          const token = localStorage.getItem("token");
          const role = token
            ? jwtDecode(token).id === auction.owner_id
              ? "owner"
              : "loser"
            : "loser";
          setWinnerInfo({
            role,
            winnerName: null,
            winningBid: auction.current_bid || null,
          });
        } else {
          const top = bids[0];
          const winnerName = top.user_name || null;
          const winningBid = top.amount;
          const token = localStorage.getItem("token");
          let role = "loser";
          if (token) {
            try {
              const decoded = jwtDecode(token);
              const currentUserId = decoded.id;
              if (currentUserId === auction.owner_id) role = "owner";
              else if (currentUserId === top.user_id) role = "winner";
            } catch (err) {}
          }
          setWinnerInfo({ role, winnerName, winningBid });
        }
        setShowWinnerModal(true);
        winnerLoadedRef.current = true;
      } catch (err) {
        console.error("Failed to load winner info", err);
      }
    };

    loadWinner();
  }, [auction, currentStatus, isDutchAuction]);

  const getTimeRemaining = (endTime, startTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diff = end - now;
    const diffToStart = start - now;

    const toParts = (milliseconds) => {
      const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
      const days = Math.floor(totalSeconds / (24 * 3600));
      const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      return { days, hours, minutes, seconds };
    };

    if (diffToStart > 0) {
      const { days, hours, minutes, seconds } = toParts(diffToStart);
      if (days > 0)
        return `Starts in ${days}d ${hours}h ${minutes}m ${seconds}s`;
      if (hours > 0) return `Starts in ${hours}h ${minutes}m ${seconds}s`;
      if (minutes > 0) return `Starts in ${minutes}m ${seconds}s`;
      return `Starts in ${seconds}s`;
    }

    if (diff <= 0) return "Auction ended";

    const { days, hours, minutes, seconds } = toParts(diff);
    if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  useEffect(() => {
    if (!auction) return;

    setTimeRemaining(getTimeRemaining(auction.end_time, auction.start_time));

    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(auction.end_time, auction.start_time));
    }, 1000);

    return () => clearInterval(interval);
  }, [auction]);

  if (loading) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⏳</div>
        <h3 className="empty-state-title">Loading Auction Details...</h3>
        <p>Please wait while we fetch the auction information.</p>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
          Note: Initial load may take longer due to free-tier hosting on Render.
        </p>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📦</div>
        <h3 className="empty-state-title">No item found.</h3>
      </div>
    );
  }

  return (
    <div className="auction-details-container">
      <Link to="/" className="btn btn-outline btn-back">
        ← Back to Auctions
      </Link>

      <div className="auction-details-grid">
        <div className="auction-image-section">
          {auction.image_url ? (
            <img
              src={auction.image_url}
              alt={auction.title}
              className="auction-detail-image"
            />
          ) : (
            <div className="auction-detail-placeholder">No Image Available</div>
          )}
        </div>

        <div className="auction-info-section">
          <div className="auction-detail-header">
            <div>
              <h1 className="auction-detail-title">{auction.title}</h1>
            </div>
          </div>

          <div className="auction-detail-section">
            <h3 className="section-title">Description</h3>
            <p className="auction-detail-description">{auction.description}</p>
          </div>

          <div className="auction-detail-section">
            <h3 className="section-title">Auction Timeline</h3>
            <div className="time-info-grid">
              <div className="time-info-card">
                <span className="time-label">Start Time</span>
                <span className="time-value">
                  {new Date(auction.start_time).toLocaleString()}
                </span>
              </div>
              <div className="time-info-card">
                <span className="time-label">End Time</span>
                <span className="time-value">
                  {new Date(auction.end_time).toLocaleString()}
                </span>
              </div>
              <div className="time-info-card highlight">
                <span className="time-label">Time Remaining</span>
                <span className="time-value countdown">{timeRemaining}</span>
              </div>
            </div>
          </div>

          {!isDutchAuction && (
            <div className="auction-detail-section current-bid-section">
              <h3 className="section-title">
                {currentStatus === "ended" ? "Winning Bid" : "Current Bid"}
              </h3>
              <div className="current-bid-display">
                <span className="currency">$</span>
                <span className="bid-amount">
                  {Number(auction.current_bid || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </span>
              </div>
            </div>
          )}

          {currentStatus === "active" ? (
            isDutchAuction ? (
              <div className="auction-detail-section bid-section">
                <h3 className="section-title">Dutch Auction - Buy Now</h3>
                <BuyNow auction={auction} onPurchase={fetchAuction} />
              </div>
            ) : (
              <div className="auction-detail-section bid-section">
                <h3 className="section-title">Place Your Bid</h3>
                <PlaceBid auction={auction} onBidPlaced={handleBidPlaced} />
                
                <AutoBid auction={auction} />
              </div>
            )
          ) : (
            <div className="auction-detail-section">
              <div className="auction-closed-message">
                {currentStatus === "ended"
                  ? "This auction has ended"
                  : `Auction starts at ${new Date(
                      auction.start_time
                    ).toLocaleString()}`}
              </div>
            </div>
          )}
        </div>
      </div>
      <WinnerModal
        isOpen={showWinnerModal}
        onClose={() => setShowWinnerModal(false)}
        winner={winnerInfo}
      />
    </div>
  );
}

export default AuctionDetails;
