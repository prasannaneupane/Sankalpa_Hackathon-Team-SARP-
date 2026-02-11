import { useNavigate, useLocation } from "react-router-dom";

export default function Navbar({ loggedIn, toggleAbout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem("role");

  const handleLogout = () => {
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    navigate("/"); // go to home page after logout
  };

  return (
    <nav style={styles.nav}>
      <h2 style={styles.title}>TEAM-SARP</h2>

      <div style={styles.links}>
        {/* --- BACK BUTTON for REPORT PAGE --- */}
        {location.pathname.startsWith("/report") && (
          <button onClick={() => navigate("/dashboard")}>← Back</button>
        )}

        {/* BEFORE LOGIN (HOME, ABOUT, LOGIN, REGISTER) */}
        {!loggedIn && !location.pathname.startsWith("/report") && (
          <>
            {location.pathname !== "/" && (
              <button onClick={() => navigate("/")}>Home</button>
            )}
            <button onClick={toggleAbout}>About</button>
            <button onClick={() => navigate("/login")}>Login</button>
            <button onClick={() => navigate("/register")}>Register</button>
          </>
        )}

        {/* AFTER LOGIN (CITIZEN) */}
        {loggedIn && role === "citizen" && !location.pathname.startsWith("/report") && (
          <>
            <button onClick={() => navigate("/report")}>Report Issue</button>
            <button onClick={handleLogout}>Logout</button>
          </>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 20px",
    backgroundColor: "#f5f5f5",
    borderBottom: "1px solid #ccc",
  },
  title: { margin: 0 },
  links: { display: "flex", gap: "10px" },
};
