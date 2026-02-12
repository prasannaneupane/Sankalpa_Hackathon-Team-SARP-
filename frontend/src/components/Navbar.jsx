import { useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";

export default function Navbar({ loggedIn, toggleAbout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem("role");
  const user = localStorage.getItem("user");

  const handleLogout = () => {
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  const getUserInitial = () => {
    if (user) {
      try {
        const userData = JSON.parse(user);
        return userData.username ? userData.username.charAt(0).toUpperCase() : "U";
      } catch {
        return "U";
      }
    }
    return "U";
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => navigate("/")}>
        <img className="navbar-logo" src="../public/logo.png" alt="SADAK SUDHAR Logo" />
        <h2 className="navbar-title">SADAK SUDHAR</h2>
      </div>

      <div className="navbar-links">
        {/* --- BACK BUTTON for REPORT PAGE --- */}
        {location.pathname.startsWith("/report") && (
          <button className="nav-button back" onClick={() => navigate("/citizen-dashboard")}>
            ← Back
          </button>
        )}

        {/* BEFORE LOGIN (HOME, ABOUT, LOGIN, REGISTER) */}
        {!loggedIn && !location.pathname.startsWith("/report") && (
          <>
            {location.pathname !== "/" && (
              <button className="nav-button" onClick={() => navigate("/")}>
                Home
              </button>
            )}
            <button className="nav-button" onClick={toggleAbout}>
              About
            </button>
            <span className="nav-divider"></span>
            <button className="nav-button outline" onClick={() => navigate("/login")}>
              Login
            </button>
            <button className="nav-button primary" onClick={() => navigate("/register_citizen")}>
              Register as Citizen
            </button>
          </>
        )}

        {/* AFTER LOGIN (CITIZEN) */}
        {loggedIn && role === "citizen" && !location.pathname.startsWith("/report") && (
          <>
            <div className="user-info">
              <div className="user-badge">
                <span className="user-avatar">{getUserInitial()}</span>
                <span className="user-role">{role}</span>
              </div>
            </div>
            <button className="nav-button" onClick={() => navigate("/citizen-dashboard")}>
              Dashboard
            </button>
            <button className="nav-button primary" onClick={() => navigate("/report")}>
              Report Issue
            </button>
            <button className="nav-button logout" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}

        {/* AFTER LOGIN (AMBULANCE) */}
        {loggedIn && role === "ambulance" && (
          <>
            <div className="user-info">
              <div className="user-badge">
                <span className="user-avatar">🚑</span>
                <span className="user-role">{role}</span>
              </div>
            </div>
            <button className="nav-button" onClick={() => navigate("/dashboard")}>
              Dashboard
            </button>
            <button className="nav-button logout" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}

        {/* AFTER LOGIN (ADMIN) */}
        {loggedIn && role === "admin" && (
          <>
            <div className="user-info">
              <div className="user-badge">
                <span className="user-avatar">🛡️</span>
                <span className="user-role">{role}</span>
              </div>
            </div>
            <button className="nav-button logout" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
