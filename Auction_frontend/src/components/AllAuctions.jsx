import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
function AllAuctions() {
  const [auctions, setAuctions] = useState([]);

  useEffect(() => {
    // Fetch auctions from the backend API
    const fetchAuctions = async () => {
      try {
        const response = await axios.get("http://localhost:3000/auctions");
        setAuctions(response.data);
      } catch (error) {
        console.error("Error fetching auctions:", error);
      }
    };
    fetchAuctions();
  }, []);

  return (
    <>
      <div>
        <h1>Auction Listings</h1>
        <ul>
          {auctions.map((auction) => (
            <li key={auction.id}>
              <img src={auction.image_url} alt={auction.title} width={150} />
              <h2>{auction.title}</h2>
              <p>{auction.description}</p>
              <p>Current Bid: ${auction.current_bid}</p>
              <p>Status: {auction.status}</p>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default AllAuctions;
