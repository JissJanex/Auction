import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

function Header({ onLogoutClick }) {
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, [location]);

  // Listen for auth changes (login/logout)
  useEffect(() => {
    const handleAuthChange = () => {
      const token = localStorage.getItem("token");
      setIsLoggedIn(!!token);
    };
    window.addEventListener('authChange', handleAuthChange);
    return () => window.removeEventListener('authChange', handleAuthChange);
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-brand">
          <img src="/logo.png" alt="Auction Hub Logo" className="navbar-logo" />
          <span className="navbar-logo">
            <span>Auction</span> <span>Hub</span>
          </span>
        </Link>
        <div className="navbar-nav">
          <Link 
            to="/" 
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Home
          </Link>
          <Link 
            to="/createauction" 
            className={`nav-link ${location.pathname === '/createauction' ? 'active' : ''}`}
          >
            Create Auction
          </Link>
          {isLoggedIn ? (
            <button onClick={onLogoutClick} className="nav-link nav-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Logout
            </button>
          ) : (
            <Link 
              to="/login" 
              className={`nav-link nav-btn ${location.pathname === '/login' ? 'active' : ''}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                <polyline points="10 17 15 12 10 7"></polyline>
                <line x1="15" y1="12" x2="3" y2="12"></line>
              </svg>
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Header;
