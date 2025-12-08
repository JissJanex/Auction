import { useState } from "react";
import axios from "axios";

function CreateAuction() {
  const [createdAuction, setCreatedAuction] = useState({
    title: "",
    description: "",
    image_url: "",
    start_time: "",
    end_time: "",
    owner_id: 1,
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post("http://localhost:3000/auctions", createdAuction);
      console.log("Auction created:", response.data);
    } catch (error) {
      console.error("Error creating auction:", error);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={createdAuction.title}
          onChange={(e) => setCreatedAuction({ ...createdAuction, title: e.target.value })}
          placeholder="Title"
        />
        <input
          type="text"
          value={createdAuction.description}
          onChange={(e) => setCreatedAuction({ ...createdAuction, description: e.target.value })}
          placeholder="Description"
        />
        <input
          type="text"
          value={createdAuction.image_url}
          onChange={(e) => setCreatedAuction({ ...createdAuction, image_url: e.target.value })}
          placeholder="Image URL"
        />
        <input
          type="datetime-local"
          value={createdAuction.start_time}
          onChange={(e) => setCreatedAuction({ ...createdAuction, start_time: e.target.value })}
          placeholder="Start Time"
        />
        <input
          type="datetime-local"
          value={createdAuction.end_time}
          onChange={(e) => setCreatedAuction({ ...createdAuction, end_time: e.target.value })}
          placeholder="End Time"
        />
        <button type="submit">Create Auction</button>
      </form>
    </div>
  );
}

export default CreateAuction;