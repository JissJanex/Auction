import { Routes, Route, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import LogoutModal from "./components/LogoutModal";
import AuctionPage from "./pages/AuctionPage";
import CreateAuction from "./pages/CreateAuction";
import AuctionDetails from "./pages/AuctionDetails";
import EndedAuctions from "./pages/EndedAuctions";
import Login from "./pages/LoginSignup";

function App() {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    localStorage.removeItem("token");
    setShowLogoutModal(false);
    navigate("/");
    // Notify components about auth state change
    window.dispatchEvent(new Event("authChange"));
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <div className="app-container">
      <Header onLogoutClick={handleLogoutClick} />

      {/* Main Content */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<AuctionPage />} />
          <Route path="/createauction" element={<CreateAuction />} />
          <Route path="/auction/:id" element={<AuctionDetails />} />
          <Route path="/auctions/ended" element={<EndedAuctions />} />
          <Route path="/login" element={<Login />} />
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

      <LogoutModal
        isOpen={showLogoutModal}
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
      />
    </div>
  );
}

export default App;
