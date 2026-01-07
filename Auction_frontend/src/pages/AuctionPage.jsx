import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { API_BASE_URL } from "../config";
import AuctionCard from "../components/AuctionCard";

function AuctionPage() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const fetchAuctions = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auctions`);
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

  useEffect(() => {
    const checkUser = () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decoded = jwtDecode(token);
          setUser(decoded.name);
        } catch (error) {
          console.error("Error decoding token:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    checkUser();

    window.addEventListener('authChange', checkUser);
    return () => window.removeEventListener('authChange', checkUser);
  }, []);

  if (loading) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⏳</div>
        <h3 className="empty-state-title">Loading Auctions...</h3>
        <p>Please wait while we fetch the latest auctions.</p>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
          Note: Initial load may take longer due to free-tier hosting on Render.
        </p>
      </div>
    );
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
          <h1 className="page-title">
            {user ? `Welcome back, ${user}!` : "Live Auctions"}
          </h1>

          <p className="page-subtitle">
            {user
              ? "Start bidding on your favorite items now"
              : "Discover amazing items and place your bids"}
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
