import { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

export default function AutoBid({ auction }) {
  const [isAutoBidActive, setIsAutoBidActive] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [maxBid, setMaxBid] = useState("");
  const [increment, setIncrement] = useState("");
  const [autobidData, setAutobidData] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkExistingAutoBid();
  }, [auction.id]);

  const checkExistingAutoBid = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const decoded = jwtDecode(token);
      const response = await axios.get(
        `${API_BASE_URL}/autobids?auction_id=${auction.id}&user_id=${decoded.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setIsAutoBidActive(response.data.exists);
      if (response.data.exists && response.data.autobid) {
        setAutobidData(response.data.autobid);
      }
    } catch (error) {
      console.error("Error checking autobid:", error);
    }
  };

  const handlePlaceAutoBid = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // Validation
    const maxBidValue = parseFloat(maxBid);
    const incrementValue = parseFloat(increment);
    const currentBid = parseFloat(auction.current_bid);

    if (isNaN(maxBidValue) || maxBidValue <= 0) {
      toast.error("Please enter a valid maximum bid amount");
      return;
    }

    if (maxBidValue <= currentBid) {
      toast.error(
        `Maximum bid must be higher than current bid of $${currentBid.toFixed(2)}`
      );
      return;
    }

    if (isNaN(incrementValue) || incrementValue <= 0) {
      toast.error("Please enter a valid increment amount");
      return;
    }

    if (incrementValue < 1) {
      toast.error("Minimum increment is $1");
      return;
    }

    setLoading(true);

    try {
      const decoded = jwtDecode(token);
      await axios.post(
        `${API_BASE_URL}/autobids`,
        {
          auction_id: auction.id,
          user_id: decoded.id,
          max_bid: maxBidValue,
          increment: incrementValue,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("🤖 Auto-bid activated successfully!");
      setIsAutoBidActive(true);
      setShowForm(false);
      setMaxBid("");
      setIncrement("");
      // Refresh autobid data to display the new values
      await checkExistingAutoBid();
    } catch (error) {
      console.error("Error placing autobid:", error);
      toast.error(error.response?.data || "Failed to activate auto-bid");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAutoBid = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);

    try {
      const decoded = jwtDecode(token);
      await axios.delete(`${API_BASE_URL}/autobids`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          auction_id: auction.id,
          user_id: decoded.id,
        },
      });

      toast.info("Auto-bid deactivated");
      setIsAutoBidActive(false);
      setShowForm(false);
      setAutobidData(null); // Clear the autobid data
    } catch (error) {
      console.error("Error deleting autobid:", error);
      toast.error("Failed to deactivate auto-bid");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="autobid-container">
      {!isAutoBidActive ? (
        <>
          {!showForm ? (
            <button
              className="btn btn-outline autobid-trigger"
              onClick={() => setShowForm(true)}
            >
              🤖 Set Auto-Bid
            </button>
          ) : (
            <div className="autobid-form">
              <div className="autobid-header">
                <h4 className="autobid-title">Auto-Bid Setup</h4>
                <button
                  className="autobid-close"
                  onClick={() => setShowForm(false)}
                >
                  ✕
                </button>
              </div>

              <p className="autobid-description">
                Automatically place bids when you're outbid, up to your maximum amount.
              </p>

              <div className="autobid-inputs">
                <div className="input-group">
                  <label className="input-label" htmlFor="maxBid">
                    Maximum Bid ($)
                  </label>
                  <input
                    id="maxBid"
                    className="input"
                    type="number"
                    placeholder="e.g., 500"
                    value={maxBid}
                    onChange={(e) => setMaxBid(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                  <small className="input-hint">
                    The highest amount you're willing to bid
                  </small>
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="increment">
                    Bid Increment ($)
                  </label>
                  <input
                    id="increment"
                    className="input"
                    type="number"
                    placeholder="e.g., 10"
                    value={increment}
                    onChange={(e) => setIncrement(e.target.value)}
                    min="1"
                    step="1"
                  />
                  <small className="input-hint">
                    How much to increase each auto-bid (min $1)
                  </small>
                </div>
              </div>

              <div className="autobid-actions">
                <button
                  className="btn btn-outline"
                  onClick={() => setShowForm(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-accent"
                  onClick={handlePlaceAutoBid}
                  disabled={loading}
                >
                  {loading ? "Activating..." : "Activate Auto-Bid"}
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="autobid-active">
          <div className="autobid-status">
            <span className="autobid-badge">🤖 Auto-Bid Active</span>
            <p className="autobid-status-text">
              You'll automatically bid when outbid
            </p>
            {autobidData && (
              <div className="autobid-details">
                <div className="autobid-detail-item">
                  <span className="autobid-detail-label">Max Bid:</span>
                  <span className="autobid-detail-value">
                    ${parseFloat(autobidData.max_bid).toFixed(2)}
                  </span>
                </div>
                <div className="autobid-detail-item">
                  <span className="autobid-detail-label">Increment:</span>
                  <span className="autobid-detail-value">
                    ${parseFloat(autobidData.increment).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
          <button
            className="btn btn-outline btn-sm autobid-delete"
            onClick={handleDeleteAutoBid}
            disabled={loading}
          >
            {loading ? "Deactivating..." : "Deactivate"}
          </button>
        </div>
      )}
    </div>
  );
}
