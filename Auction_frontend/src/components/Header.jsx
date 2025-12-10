import { Link, useLocation } from "react-router-dom";

function Header() {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-brand">
          <span className="navbar-logo">
            <span>Auction</span> <span>Hub</span>
          </span>
        </Link>
        <div className="navbar-nav">
          <Link 
            to="/" 
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            🏠 Home
          </Link>
          <Link 
            to="/createauction" 
            className={`nav-link ${location.pathname === '/createauction' ? 'active' : ''}`}
          >
            Create Auction
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Header;
