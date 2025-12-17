import { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";

/**
 * BuyNow Component for Dutch Auctions
 * 
 * Allows users to purchase the item at the current price
 * Sends POST request to /dutchbids/buy/:id
 */

function BuyNow({ auction, onPurchase }) {
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handleBuyNow = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to purchase this item");
      return;
    }

    // Check if user is the owner
    try {
      const decoded = jwtDecode(token);
      if (decoded.id === auction.owner_id) {
        toast.error("You cannot buy your own auction");
        return;
      }
    } catch (error) {
      console.error("Error decoding token:", error);
      toast.error("Authentication error. Please login again.");
      return;
    }

    // Confirm purchase
    const confirmPurchase = window.confirm(
      `Are you sure you want to buy this item for $${auction.current_price}?`
    );
    
    if (!confirmPurchase) return;

    setIsPurchasing(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/dutchbids/buy/${auction.id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success(response.data.message || "Purchase successful! You won the auction!");
      
      // Call the callback to refresh auction data
      if (onPurchase) {
        onPurchase();
      }
    } catch (error) {
      console.error("Error purchasing item:", error);
      if (error.response?.status === 400) {
        toast.error(error.response.data.error || "Auction ended or already sold");
      } else if (error.response?.status === 401) {
        toast.error("Please login to purchase this item");
      } else {
        toast.error("Failed to complete purchase. Please try again.");
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="buy-now-container">
      <div className="buy-now-info">
        <div className="buy-now-price-label">Current Price</div>
        <div className="buy-now-price-display">
          <span className="currency">$</span>
          <span className="price-amount">{auction.current_price}</span>
        </div>
        <p className="buy-now-hint">
          ⚡ Price drops every {auction.drop_interval_minutes} minute(s) by ${auction.price_drop}
        </p>
      </div>

      <button
        className="btn btn-buy-now"
        onClick={handleBuyNow}
        disabled={isPurchasing}
      >
        {isPurchasing ? (
          <>
            <span className="btn-spinner"></span>
            Processing...
          </>
        ) : (
          <>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginRight: "8px" }}
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            Buy Now
          </>
        )}
      </button>

      <div className="buy-now-disclaimer">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span>First to buy wins. Price may drop if you wait.</span>
      </div>
    </div>
  );
}

export default BuyNow;
