import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import DutchAuctionToggle from "../components/DutchAuctionToggle";

function CreateAuction() {
  const navigate = useNavigate();
  const [createdAuction, setCreatedAuction] = useState({
    title: "",
    description: "",
    image: null,
    start_time: "",
    end_time: "",
  });
  const [dutchData, setDutchData] = useState({
    isDutch: false,
    startPrice: null,
    priceDrop: null,
    dropInterval: null,
  });
  //To prevent multiple submissions while creating an auction
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Prevent multiple submissions
    if (isSubmitting) return;
    setIsSubmitting(true);

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Login to create an auction");
      navigate("/login");
      return;
    }

    // Validation
    if (!createdAuction.image) {
      toast.error("Please select an image");
      setIsSubmitting(false);
      return;
    }
    if (!createdAuction.title.trim()) {
      toast.error("Please enter a title");
      setIsSubmitting(false);
      return;
    }
    if (!createdAuction.description.trim()) {
      toast.error("Please enter a description");
      setIsSubmitting(false);
      return;
    }
    if (!createdAuction.start_time) {
      toast.error("Please select a start time");
      setIsSubmitting(false);
      return;
    }
    if (!createdAuction.end_time) {
      toast.error("Please select an end time");
      setIsSubmitting(false);
      return;
    }
    if (
      new Date(createdAuction.end_time) <= new Date(createdAuction.start_time)
    ) {
      toast.error("End time must be after start time");
      setIsSubmitting(false);
      return;
    }

    // Dutch auction validation
    if (dutchData.isDutch) {
      if (!dutchData.startPrice || dutchData.startPrice <= 0) {
        toast.error("Please enter a valid starting price for Dutch auction");
        setIsSubmitting(false);
        return;
      }
      if (!dutchData.priceDrop || dutchData.priceDrop <= 0) {
        toast.error("Please enter a valid price drop amount");
        setIsSubmitting(false);
        return;
      }
      if (!dutchData.dropInterval || dutchData.dropInterval < 1) {
        toast.error("Drop interval must be at least 1 minute");
        setIsSubmitting(false);
        return;
      }
    }

    // Prepare form data for file upload
    const formData = new FormData();
    formData.append("title", createdAuction.title);
    formData.append("description", createdAuction.description);
    // Convert local datetime to ISO UTC string
    formData.append("start_time", new Date(createdAuction.start_time).toISOString());
    formData.append("end_time", new Date(createdAuction.end_time).toISOString());
    formData.append("image", createdAuction.image);

    // Add Dutch auction specific fields if enabled
    if (dutchData.isDutch) {
      formData.append("start_price", dutchData.startPrice);
      formData.append("price_drop", dutchData.priceDrop);
      formData.append("drop_interval_minutes", dutchData.dropInterval);
    }

    // Choose endpoint based on auction type
    const endpoint = dutchData.isDutch ? "/dutchauctions" : "/auctions";

    try {
      const response = await axios.post(
        `${API_BASE_URL}${endpoint}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      toast.success(dutchData.isDutch ? "Dutch auction created successfully!" : "Auction created successfully!");
      // Reset form
      setCreatedAuction({
        title: "",
        description: "",
        image: null,
        start_time: "",
        end_time: "",
      });
      setDutchData({
        isDutch: false,
        startPrice: null,
        priceDrop: null,
        dropInterval: null,
      });
      navigate("/");
    } catch (error) {
      console.error("Error creating auction:", error);
      if (error.response?.status === 401) {
        toast.error("Login to create an auction");
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        toast.error("Failed to create auction. Please try again.");
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Create New Auction</h1>
        <p className="page-subtitle">List your item and start receiving bids</p>
      </div>

      <div className="form-container">
        <form className="form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label" htmlFor="title">
              📝 Auction Title
            </label>
            <input
              id="title"
              className="input"
              type="text"
              value={createdAuction.title}
              onChange={(e) =>
                setCreatedAuction({ ...createdAuction, title: e.target.value })
              }
              placeholder="Enter a catchy title for your item"
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="description">
              📄 Description
            </label>
            <textarea
              id="description"
              className="input"
              value={createdAuction.description}
              onChange={(e) =>
                setCreatedAuction({
                  ...createdAuction,
                  description: e.target.value,
                })
              }
              placeholder="Describe your item in detail..."
              rows={4}
              style={{ resize: "vertical" }}
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="image">
              🖼️ Auction Image
            </label>
            <div className="image-upload-wrapper">
              <input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setCreatedAuction({
                    ...createdAuction,
                    image: e.target.files[0],
                  })
                }
                style={{ display: 'none' }}
              />
              <label htmlFor="image" className="image-upload-label">
                {createdAuction.image ? (
                  <div className="image-preview">
                    <img 
                      src={URL.createObjectURL(createdAuction.image)} 
                      alt="Preview" 
                      style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }}
                    />
                    <span className="image-name">{createdAuction.image.name}</span>
                  </div>
                ) : (
                  <div className="image-upload-placeholder">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <span>Click to upload image</span>
                    <span className="image-upload-hint">PNG, JPG, GIF up to 10MB</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="start_time">
              🕐 Start Time
            </label>
            <div className="datetime-input-wrapper">
              <input
                id="start_time"
                className="input datetime-input"
                type="datetime-local"
                value={createdAuction.start_time}
                onChange={(e) =>
                  setCreatedAuction({
                    ...createdAuction,
                    start_time: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="end_time">
              ⏰ End Time
            </label>
            <div className="datetime-input-wrapper">
              <input
                id="end_time"
                className="input datetime-input"
                type="datetime-local"
                value={createdAuction.end_time}
                onChange={(e) =>
                  setCreatedAuction({
                    ...createdAuction,
                    end_time: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <DutchAuctionToggle onDutchDataChange={setDutchData} />

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate("/")}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-accent btn-lg" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Auction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateAuction;
