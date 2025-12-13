import { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";
import { Link, useNavigate } from "react-router-dom";

function LoginSignup() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });
  const [focusedField, setFocusedField] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    try {
      if (isLogin) {
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
          email: formData.email,
          password: formData.password,
        });
        localStorage.setItem("token", response.data.token);
        window.dispatchEvent(new Event('authChange'));
        navigate("/");
      } else {
        const response = await axios.post(`${API_BASE_URL}/auth/signup`, {
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });
        localStorage.setItem("token", response.data.token);
        window.dispatchEvent(new Event('authChange'));
        navigate("/");
      }
    } catch (error) {
      console.error(isLogin ? "Login error:" : "Signup error:", error);
      if (error.response?.status === 400 && isLogin) {
        setErrorMessage("Username or password is wrong");
      } else {
        setErrorMessage(error.response?.data?.error || "Authentication failed");
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-split-container">
        {/* Left Side - Branding */}
        <div className="auth-brand-side">
          <div className="auth-brand-content">
            <div className="auth-logo">
              <div className="auth-logo-icon">A</div>
              <h2>Auction Hub</h2>
            </div>
            <h1 className="auth-brand-title">
              {isLogin ? "Welcome Back!" : "Join Us Today!"}
            </h1>
            <p className="auth-brand-subtitle">
              {isLogin
                ? "Continue your bidding journey and discover amazing deals"
                : "Start bidding on exclusive items and win incredible auctions"}
            </p>
            <div className="auth-features">
              <div className="auth-feature">
                <div className="auth-feature-icon">✓</div>
                <span>Secure Bidding</span>
              </div>
              <div className="auth-feature">
                <div className="auth-feature-icon">✓</div>
                <span>Real-time Updates</span>
              </div>
              <div className="auth-feature">
                <div className="auth-feature-icon">✓</div>
                <span>Trusted Platform</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="auth-form-side">
          <Link to="/" className="auth-close-link">
            ← Back to Auctions
          </Link>

          <div className="auth-form-container">
            {/* Tab Switcher */}
            <div className="auth-tabs">
              <button
                type="button"
                className={`auth-tab ${isLogin ? "active" : ""}`}
                onClick={() => setIsLogin(true)}
              >
                Login
              </button>
              <button
                type="button"
                className={`auth-tab ${!isLogin ? "active" : ""}`}
                onClick={() => setIsLogin(false)}
              >
                Sign Up
              </button>
              <div
                className={`auth-tab-indicator ${!isLogin ? "right" : ""}`}
              />
            </div>

            <form onSubmit={handleSubmit} className="auth-form-modern">
              {!isLogin && (
                <div
                  className={`form-group-modern ${
                    focusedField === "name" ? "focused" : ""
                  }`}
                >
                  <label htmlFor="name" className="form-label-modern">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => setFocusedField(null)}
                    className="form-input-modern"
                    placeholder="Your full name"
                    required={!isLogin}
                  />
                </div>
              )}

              {errorMessage && (
                <div style={{ color: "#dc2626", fontSize: "0.875rem", marginBottom: "1rem", fontWeight: "500" }}>
                  {errorMessage}
                </div>
              )}

              <div
                className={`form-group-modern ${
                  focusedField === "email" ? "focused" : ""
                }`}
              >
                <label htmlFor="email" className="form-label-modern">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  className="form-input-modern"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div
                className={`form-group-modern ${
                  focusedField === "password" ? "focused" : ""
                }`}
              >
                <label htmlFor="password" className="form-label-modern">
                  Password
                </label>
                <div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    className="form-input-modern"
                    placeholder="••••••••"
                    required
                  />

                  <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      id="show-password-checkbox"
                      type="checkbox"
                      checked={showPassword}
                      onChange={(e) => setShowPassword(e.target.checked)}
                    />
                    <label htmlFor="show-password-checkbox" style={{ fontSize: '0.9rem', color: 'var(--gray-700)' }}>
                      Show password
                    </label>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn-auth-submit">
                {isLogin ? "Login" : "Create Account"}
                <span className="btn-auth-arrow">→</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginSignup;
