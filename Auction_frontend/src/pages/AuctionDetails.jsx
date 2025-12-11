import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";
import PlaceBid from "../components/PlaceBid";

function AuctionDetails() {
    const [auction, setAuction] = useState(null);
    const [loading, setLoading] = useState(true);
    const socketRef = useRef(null);
    const hasBeenOutbidRef = useRef(false); // Track if user has been notified about being outbid

    //To fetch the auction id from the url
    const { id } = useParams();

    const fetchAuction = async () => {
        try {
            const res = await axios.get(`http://localhost:3000/auctions/${id}`);
            setAuction(res.data);
        } catch (error) {
            console.error("Error fetching auction details:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchAuction();
    }, [id]);

    // Socket.IO connection for real-time bid updates
    useEffect(() => {
        socketRef.current = io("http://localhost:3000");

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
                            toast.warning(`You've been outbid! New highest bid: $${newBid.amount}`, {
                                position: "top-center",
                                autoClose: 5000,
                            });
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
                socketRef.current.disconnect();
            }
        };
    }, [id]);

    const handleBidPlaced = () => {
        fetchAuction();
    };

    

    const getTimeRemaining = (endTime) => {
        const now = new Date();
        const end = new Date(endTime);
        const diff = end - now;

        if (diff <= 0) return "Auction ended";

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) return `${days}d ${hours}h ${minutes}m`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    if (loading) {
        return null;
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
                                <span className="time-value countdown">
                                    {getTimeRemaining(auction.end_time)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Current Bid */}
                    <div className="auction-detail-section current-bid-section">
                        <h3 className="section-title">{auction.status === 'ended' ? "Winning Bid" : "Current Bid"}</h3>
                        <div className="current-bid-display">
                            <span className="currency">$</span>
                            <span className="bid-amount">{auction.current_bid || "0.00"}</span>
                        </div>
                    </div>

                    {/* Place Bid Section */}
                    {auction.status === 'active' ? (
                        <div className="auction-detail-section bid-section">
                            <h3 className="section-title">Place Your Bid</h3>
                            <PlaceBid auction={auction} onBidPlaced={handleBidPlaced} />
                        </div>
                    ) : (
                        <div className="auction-detail-section">
                            <div className="auction-closed-message">
                                {auction.status === 'closed' || auction.status === 'ended'
                                    ? 'This auction has ended'
                                    : `Auction starts at ${new Date(auction.start_time).toLocaleString()}`}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AuctionDetails;