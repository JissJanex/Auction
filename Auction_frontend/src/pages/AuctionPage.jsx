import { Link } from "react-router-dom";
import AllAuctions from "../components/AllAuctions";

function AuctionPage() {
  return (
    <div>
      <AllAuctions />
      
      <div className="action-buttons">
        <Link to="/createauction">
          <button className="btn btn-primary btn-lg">
            ➕ Create New Auction
          </button>
        </Link>
      </div>
    </div>
  );
}

export default AuctionPage;
