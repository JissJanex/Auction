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
  const hasBeenOutbidRef = useRef(false); // Track if user has been notified about being outbid

  //To fetch the auction id from the url
  const { id } = useParams();

  const fetchAuction = useCallback(async () => {
    try {
      // Always fetch from auctions table first
      const res = await axios.get(`${API_BASE_URL}/auctions/${id}`);
      const auctionData = res.data;
      
      // Check if it's a Dutch auction
      if (auctionData.auction_type === 'dutch') {
        // Fetch Dutch-specific details
        const dutchRes = await axios.get(`${API_BASE_URL}/dutchauctions/${id}`);
        // Merge the data
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

    // Listen for Dutch auction price updates
    socketRef.current.on("dutchAuctionPriceUpdate", (data) => {
      if (data.auction_id === parseInt(id)) {
        // Update current price in real-time
        setAuction((prev) => prev ? { ...prev, current_price: data.new_price } : null);
      }
    });

    // Listen for Dutch auction sold event
    socketRef.current.on("dutchAuctionSold", (data) => {
      if (data.auction_id === parseInt(id)) {
        // Just refresh auction data - the winner modal will show the message
        fetchAuction();
      }
    });

    socketRef.current.on("bidUpdate", (newBid) => {
      // Only process bids for this auction
      if (newBid.auction_id === parseInt(id)) {
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const decoded = jwtDecode(token);
            const currentUserId = decoded.id;

            // Check if current user was the previous highest bidder and got outbid
            if (
              newBid.previousHighestBidder === currentUserId &&
              newBid.user_id !== currentUserId &&
              !hasBeenOutbidRef.current
            ) {
              // Different messages for manual vs auto bids
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

        // Refresh auction data
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
    // For Dutch auctions, check if someone bought it (winner_id is not null and not undefined)
    if (isDutchAuction && auction.winner_id) return "ended";
    if (now > endTime) return "ended";
    return "active";
  };

  // Update status dynamically - recalculate every second
  useEffect(() => {
    if (!auction) return;

    // Initial status calculation
    setCurrentStatus(getAuctionStatus());

    // Update status every second to catch transitions
    const interval = setInterval(() => {
      const newStatus = getAuctionStatus();
      if (newStatus !== currentStatus) {
        setCurrentStatus(newStatus);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [auction, currentStatus]);

  const winnerLoadedRef = useRef(false); // To load winner info only once
  // When auction ends, fetch highest bid and show winner modal once
  useEffect(() => {
    if (!auction) return;
    if (currentStatus !== "ended") return;

    // Only show modal if not already shown
    if (showWinnerModal) return;
    
    // Prevent showing modal if already loaded
    if (winnerLoadedRef.current) return;

    const loadWinner = async () => {
      try {
        // For Dutch auctions, check winner_id directly
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
              } catch (err) {
                // ignore
              }
            }
            setWinnerInfo({ 
              role, 
              winnerName: "A buyer", // Dutch auctions don't show buyer name
              winningBid: auction.current_price,
              isDutch: true
            });
          } else {
            // No winner for Dutch auction
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

        // For regular auctions, fetch bids
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
          const top = bids[0]; // ordered by amount desc
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
            } catch (err) {
              // ignore
            }
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

  //Function to calculate time remaining for auction to start or end
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

    // If auction hasn't started yet
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

  // Update time remaining automatically every second
  useEffect(() => {
    if (!auction) return;

    // Initial calculation
    setTimeRemaining(getTimeRemaining(auction.end_time, auction.start_time));

    // Update every second
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
        {/* Left Column - Image and Gallery */}
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

        {/* Right Column - Details and Bidding */}
        <div className="auction-info-section">
          {/* Header with Status */}
          <div className="auction-detail-header">
            <div>
              <h1 className="auction-detail-title">{auction.title}</h1>
            </div>
          </div>

          {/* Description */}
          <div className="auction-detail-section">
            <h3 className="section-title">Description</h3>
            <p className="auction-detail-description">{auction.description}</p>
          </div>

          {/* Time Information */}
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

          {/* Current Bid - Only show for regular auctions */}
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

          {/* Place Bid Section or Buy Now (for Dutch Auction) */}
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
                
                {/* Auto-Bid Component */}
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
