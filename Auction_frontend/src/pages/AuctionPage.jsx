import { Link } from "react-router-dom";
import AllAuctions from "../components/AllAuctions";
import PlaceBid from "../components/PlaceBid";
import CreateAuction from "../components/CreateAuction";

function AuctionPage() {
  return (
    <>
      <AllAuctions />
      <Link to="/createauction">
        <button>Create Auction</button>
      </Link>
      <Link to="/placebid">
        <button>Place Bid</button>
      </Link>
    </>
  );
}

export default AuctionPage;
