import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Store user data and token in localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("role", data.user.role);

      console.log("Login successful:", data.user); // Debug log

      // ✅ REDIRECT BASED ON ROLE
      const role = data.user.role;
      
      if (role === "admin") {
        navigate("/admin/dashboard");
      } else if (role === "ambulance") {
        navigate("/ambulance/dashboard");
      } else if (role === "citizen") {
        navigate("/citizen/dashboard");
      } else {
        // Default fallback
        navigate("/citizen/dashboard");
      }
      
    } catch (err) {
      setError(err.message || "Failed to login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div style={styles.background}>
      <div style={styles.overlay}></div>
      <div style={styles.container}>
        <div style={styles.logoContainer}>
          <div style={styles.logo}>🚑</div>
          <h1 style={styles.title}>SADAK SUDHAR</h1>
          <p style={styles.subtitle}>Login to your account</p>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.inputGroup}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={handleKeyPress}
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
            onKeyPress={handleKeyPress}
            style={styles.input}
          />
        </div>

        <button 
          onClick={handleLogin} 
          style={styles.button} 
          disabled={loading}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#b01030'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#DC143C'}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <div style={styles.divider}>
          <span style={styles.dividerLine}></span>
          <span style={styles.dividerText}>OR</span>
          <span style={styles.dividerLine}></span>
        </div>

        <p style={styles.link}>
          Don't have an account?{" "}
          <span onClick={() => navigate("/register_citizen")} style={styles.linkText}>
            Register here
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
    backgroundColor: "rgba(220, 20, 60, 0.85)", // Darker crimson for better contrast
  },
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    padding: "40px 40px",
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderRadius: "20px",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.2)",
    zIndex: 1,
    minWidth: "380px",
    maxWidth: "420px",
    border: "1px solid rgba(255, 255, 255, 0.3)",
  },
  logoContainer: {
    textAlign: "center",
    marginBottom: "8px",
  },
  logo: {
    fontSize: "56px",
    marginBottom: "12px",
    animation: "float 3s ease-in-out infinite",
  },
  title: {
    margin: 0,
    fontSize: "28px",
    color: "#DC143C",
    fontWeight: "800",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    margin: "8px 0 0 0",
    fontSize: "14px",
    color: "#64748b",
    fontWeight: "500",
  },
  inputGroup: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1e293b",
  },
  input: {
    padding: "14px 18px",
    width: "100%",
    border: "2px solid #e2e8f0",
    borderRadius: "12px",
    fontSize: "15px",
    transition: "all 0.3s ease",
    boxSizing: "border-box",
    outline: "none",
    backgroundColor: "#f8fafc",
  },
  button: {
    padding: "14px 20px",
    width: "100%",
    backgroundColor: "#DC143C",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.3s ease",
    marginTop: "16px",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  },
  error: {
    color: "#DC143C",
    backgroundColor: "#ffe6e6",
    padding: "12px 18px",
    borderRadius: "12px",
    width: "100%",
    textAlign: "center",
    fontSize: "14px",
    boxSizing: "border-box",
    border: "1px solid #ffb3b3",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    margin: "16px 0 8px",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    background: "linear-gradient(to right, transparent, #e2e8f0, transparent)",
  },
  dividerText: {
    padding: "0 16px",
    color: "#94a3b8",
    fontSize: "13px",
    fontWeight: "600",
  },
  link: {
    margin: "4px 0",
    fontSize: "15px",
    color: "#475569",
  },
  linkText: {
    color: "#DC143C",
    cursor: "pointer",
    textDecoration: "none",
    fontWeight: "700",
    transition: "color 0.2s ease",
  },
  backLink: {
    marginTop: "8px",
    fontSize: "14px",
  },
};

// Add animation to styles
styles['@keyframes float'] = {
  '0%, 100%': { transform: 'translateY(0px)' },
  '50%': { transform: 'translateY(-10px)' },
};