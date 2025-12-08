import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AuctionPage from "./pages/AuctionPage";
import PlaceBid from "./components/PlaceBid";
import CreateAuction from "./components/CreateAuction";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<AuctionPage />} />
        <Route path="/createauction" element={<CreateAuction />} />
        <Route path="/placebid" element={<PlaceBid />} />
      </Routes>
      <ToastContainer />
    </>
  );
}

export default App;
