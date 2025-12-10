import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AuctionPage from "./pages/AuctionPage";
import CreateAuction from "./components/CreateAuction";
import AuctionDetails from "./pages/AuctionDetails";
import EndedAuctions from "./pages/EndedAuctions";

function App() {
  return (
    <div className="app-container">
      <Header />

      {/* Main Content */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<AuctionPage />} />
          <Route path="/createauction" element={<CreateAuction />} />
          <Route path="/auction/:id" element={<AuctionDetails />} />
          <Route path="/auctions/ended" element={<EndedAuctions />} />
        </Routes>
      </main>

      <Footer />

      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
}

export default App;
