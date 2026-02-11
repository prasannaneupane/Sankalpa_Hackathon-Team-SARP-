import { Link, useNavigate } from "react-router-dom";

export default function Navbar({ loggedIn }) {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  const handleLogout = () => {
    localStorage.removeItem("role");
    navigate("/");
  };

  return (
    <nav style={styles.nav}>
      <h2 style={styles.title}>TEAM-SARP</h2>
      <div style={styles.links}>
        {!loggedIn && (
          <>
            <button onClick={() => navigate("/")}>Home</button>
            <button onClick={() => navigate("/login")}>Login / Register</button>
            <button onClick={() => document.getElementById("about-section")?.classList.toggle("hidden")}>About</button>
          </>
        )}
        {loggedIn && role === "citizen" && (
          <>
            <button onClick={() => navigate("/report")}>Repost Issue</button>
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
    alignItems: "center",
    padding: "10px 20px",
    backgroundColor: "#f5f5f5",
    borderBottom: "1px solid #ccc",
  },
  title: { margin: 0 },
  links: { display: "flex", gap: "10px" },
};
