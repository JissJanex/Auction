import { useState } from "react";

export default function DutchAuctionToggle({ onDutchDataChange }) {
  const [isDutchMode, setIsDutchMode] = useState(false);
  const [startPrice, setStartPrice] = useState("");
  const [priceDrop, setPriceDrop] = useState("");
  const [dropInterval, setDropInterval] = useState("");

  const handleToggle = () => {
    const newMode = !isDutchMode;
    setIsDutchMode(newMode);
    
    if (!newMode) {
      // Reset fields when disabling Dutch mode
      setStartPrice("");
      setPriceDrop("");
      setDropInterval("");
      onDutchDataChange({
        isDutch: false,
        startPrice: null,
        priceDrop: null,
        dropInterval: null,
      });
    } else {
      // Notify parent that Dutch mode is enabled
      onDutchDataChange({
        isDutch: true,
        startPrice: parseFloat(startPrice) || null,
        priceDrop: parseFloat(priceDrop) || null,
        dropInterval: parseFloat(dropInterval) || null,
      });
    }
  };

  const handleInputChange = (field, value) => {
    if (field === "startPrice") setStartPrice(value);
    if (field === "priceDrop") setPriceDrop(value);
    if (field === "dropInterval") setDropInterval(value);

    // Update parent with current values
    onDutchDataChange({
      isDutch: isDutchMode,
      startPrice: field === "startPrice" ? parseFloat(value) : parseFloat(startPrice),
      priceDrop: field === "priceDrop" ? parseFloat(value) : parseFloat(priceDrop),
      dropInterval: field === "dropInterval" ? parseFloat(value) : parseFloat(dropInterval),
    });
  };

  return (
    <div className="dutch-auction-container">
      <div className="dutch-auction-toggle-wrapper">
        <div className="dutch-auction-toggle-header">
          <div className="dutch-auction-info">
            <h4 className="dutch-auction-label">📉 Dutch Auction Mode</h4>
            <p className="dutch-auction-hint">
              Price decreases over time until someone buys
            </p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={isDutchMode}
              onChange={handleToggle}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {isDutchMode && (
          <div className="dutch-auction-form">
            <div className="dutch-form-note">
              <span className="note-icon">ℹ️</span>
              <span className="note-text">
                In Dutch auction, the price starts high and decreases over time.
                The first buyer to accept the current price wins.
              </span>
            </div>

            <div className="dutch-inputs-grid">
              <div className="input-group">
                <label className="input-label" htmlFor="startPrice">
                  Starting Price ($)
                </label>
                <input
                  id="startPrice"
                  className="input"
                  type="number"
                  placeholder="e.g., 1000"
                  value={startPrice}
                  onChange={(e) => handleInputChange("startPrice", e.target.value)}
                  min="0"
                  step="0.01"
                  required={isDutchMode}
                />
                <small className="input-hint">
                  The highest price at auction start
                </small>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="priceDrop">
                  Price Drop Amount ($)
                </label>
                <input
                  id="priceDrop"
                  className="input"
                  type="number"
                  placeholder="e.g., 50"
                  value={priceDrop}
                  onChange={(e) => handleInputChange("priceDrop", e.target.value)}
                  min="0.01"
                  step="0.01"
                  required={isDutchMode}
                />
                <small className="input-hint">
                  How much the price decreases each interval
                </small>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="dropInterval">
                  Drop Interval (minutes)
                </label>
                <input
                  id="dropInterval"
                  className="input"
                  type="number"
                  placeholder="e.g., 5"
                  value={dropInterval}
                  onChange={(e) => handleInputChange("dropInterval", e.target.value)}
                  min="1"
                  step="1"
                  required={isDutchMode}
                />
                <small className="input-hint">
                  Time between each price drop (minimum 1 minute)
                </small>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
