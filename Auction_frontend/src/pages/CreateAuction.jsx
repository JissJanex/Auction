import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

function CreateAuction() {
  const navigate = useNavigate();
  const [createdAuction, setCreatedAuction] = useState({
    title: "",
    description: "",
    image_url: "",
    start_time: "",
    end_time: "",
  });

  // Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Login to create an auction");
      navigate("/login");
      return;
    }
    
    // Validation
    if (!createdAuction.title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!createdAuction.description.trim()) {
      toast.error("Please enter a description");
      return;
    }
    if(!createdAuction.start_time) {
      toast.error("Please select a start time");
      return;
    }
    if(!createdAuction.end_time) {
      toast.error("Please select an end time");
      return;
    }
    if(new Date(createdAuction.end_time) <= new Date(createdAuction.start_time)) {
      toast.error("End time must be after start time");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:3000/auctions",
        createdAuction,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Auction created:", response.data);
      toast.success("Auction created successfully!");
      // Reset form
      setCreatedAuction({
        title: "",
        description: "",
        image_url: "",
        start_time: "",
        end_time: "",
      });
      // Navigate to home after short delay
      setTimeout(() => navigate("/"), 1500);
    } catch (error) {
      console.error("Error creating auction:", error);
      if (error.response?.status === 401) {
        toast.error("Login to create an auction");
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        toast.error("Failed to create auction. Please try again.");
      }
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
              onChange={(e) => setCreatedAuction({ ...createdAuction, title: e.target.value })}
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
              onChange={(e) => setCreatedAuction({ ...createdAuction, description: e.target.value })}
              placeholder="Describe your item in detail..."
              rows={4}
              style={{ resize: "vertical" }}
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="image_url">
              🖼️ Image URL
            </label>
            <input
              id="image_url"
              className="input"
              type="text"
              value={createdAuction.image_url}
              onChange={(e) => setCreatedAuction({ ...createdAuction, image_url: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="start_time">
              🕐 Start Time
            </label>
            <input
              id="start_time"
              className="input"
              type="datetime-local"
              value={createdAuction.start_time}
              onChange={(e) => setCreatedAuction({ ...createdAuction, start_time: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="end_time">
              End Time
            </label>
            <input
              id="end_time"
              className="input"
              type="datetime-local"
              value={createdAuction.end_time}
              onChange={(e) => setCreatedAuction({ ...createdAuction, end_time: e.target.value })}
            />
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-outline"
              onClick={() => navigate("/")}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-accent btn-lg"
            >
              Create Auction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateAuction;