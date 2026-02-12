import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("citizen");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async () => {
    setError("");

    if (!username || !password || !email) {
      setError("Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      alert("Registration successful!");
      navigate("/login");
    } catch (err) {
      setError(err.message || "Failed to register. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.background}>
      <div style={styles.overlay}></div>
      <div style={styles.container}>
        <div style={styles.logoContainer}>
          <div style={styles.logo}>🚑</div>
          <h1 style={styles.title}>Pothole Management</h1>
          <p style={styles.subtitle}>Create your account</p>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.inputGroup}>
          <label style={styles.label}>Username</label>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Select Role</label>
          <div style={styles.roleOptions}>
            <div
              style={{
                ...styles.roleCard,
                ...(role === "citizen" ? styles.roleCardActive : {}),
              }}
              onClick={() => setRole("citizen")}
            >
              <span style={styles.roleIcon}>👤</span>
              <span style={styles.roleName}>Citizen</span>
            </div>
            <div
              style={{
                ...styles.roleCard,
                ...(role === "ambulance" ? styles.roleCardActive : {}),
              }}
              onClick={() => setRole("ambulance")}
            >
              <span style={styles.roleIcon}>🚑</span>
              <span style={styles.roleName}>Ambulance</span>
            </div>
            <div
              style={{
                ...styles.roleCard,
                ...(role === "admin" ? styles.roleCardActive : {}),
              }}
              onClick={() => setRole("admin")}
            >
              <span style={styles.roleIcon}>🛡️</span>
              <span style={styles.roleName}>Admin</span>
            </div>
          </div>
        </div>

        <button onClick={handleRegister} style={styles.button} disabled={loading}>
          {loading ? "Registering..." : "Create Account"}
        </button>

        <div style={styles.divider}>
          <span style={styles.dividerLine}></span>
          <span style={styles.dividerText}>OR</span>
          <span style={styles.dividerLine}></span>
        </div>

        <p style={styles.link}>
          Already have an account?{" "}
          <span onClick={() => navigate("/login")} style={styles.linkText}>
            Login here
          </span>
        </p>

        <p style={styles.backLink}>
          <span onClick={() => navigate("/")} style={styles.linkText}>
            ← Back to Home
          </span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  background: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundImage: "url('https://images.unsplash.com/photo-1557683316-973673baf926?w=1920')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    position: "relative",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(220, 20, 60, 0.7)", // Crimson overlay
  },
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "15px",
    padding: "40px 50px",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: "16px",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)",
    zIndex: 1,
    minWidth: "380px",
    maxWidth: "450px",
  },
  logoContainer: {
    textAlign: "center",
    marginBottom: "10px",
  },
  logo: {
    fontSize: "50px",
    marginBottom: "10px",
  },
  title: {
    margin: 0,
    fontSize: "24px",
    color: "#DC143C", // Crimson
    fontWeight: "bold",
  },
  subtitle: {
    margin: "5px 0 0 0",
    fontSize: "14px",
    color: "#666",
  },
  inputGroup: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#333",
  },
  input: {
    padding: "12px 15px",
    width: "100%",
    border: "2px solid #e0e0e0",
    borderRadius: "8px",
    fontSize: "14px",
    transition: "border-color 0.3s ease",
    boxSizing: "border-box",
    outline: "none",
  },
  roleOptions: {
    display: "flex",
    gap: "10px",
    width: "100%",
    justifyContent: "space-between",
  },
  roleCard: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "15px 10px",
    border: "2px solid #e0e0e0",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    backgroundColor: "#fff",
  },
  roleCardActive: {
    borderColor: "#DC143C",
    backgroundColor: "#fff0f3",
    boxShadow: "0 4px 12px rgba(220, 20, 60, 0.2)",
  },
  roleIcon: {
    fontSize: "24px",
    marginBottom: "5px",
  },
  roleName: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#333",
  },
  button: {
    padding: "12px 20px",
    width: "100%",
    backgroundColor: "#DC143C", // Crimson
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background-color 0.3s ease, transform 0.2s ease",
    marginTop: "10px",
  },
  error: {
    color: "#DC143C",
    backgroundColor: "#ffe6e6",
    padding: "10px 15px",
    borderRadius: "8px",
    width: "100%",
    textAlign: "center",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    margin: "10px 0",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    backgroundColor: "#e0e0e0",
  },
  dividerText: {
    padding: "0 10px",
    color: "#999",
    fontSize: "12px",
  },
  link: {
    margin: 0,
    fontSize: "14px",
    color: "#666",
  },
  linkText: {
    color: "#DC143C", // Crimson
    cursor: "pointer",
    textDecoration: "none",
    fontWeight: "600",
  },
  backLink: {
    marginTop: "5px",
    fontSize: "14px",
  },
};