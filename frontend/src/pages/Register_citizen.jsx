import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config";
import "./Register.css";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    show: false,
    message: "",
    type: "success" // success or error
  });

  const navigate = useNavigate();

  const validateForm = () => {
    const errors = {};

    if (!fullName.trim()) {
      errors.fullName = "Full name is required";
    } else if (fullName.length < 3) {
      errors.fullName = "Full name must be at least 3 characters";
    }

    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const showSnackbar = (message, type = "success") => {
    setSnackbar({ show: true, message, type });
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setSnackbar(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  const hideSnackbar = () => {
    setSnackbar(prev => ({ ...prev, show: false }));
  };

  const handleRegister = async () => {
    setError("");
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      console.log("Sending registration data:", {
        url: `${API_BASE_URL}/auth/register`,
        data: { 
          email: email.trim().toLowerCase(), 
          password: "***", 
          full_name: fullName.trim() 
        }
      });

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          password, 
          full_name: fullName.trim()
        }),
      });

      const data = await response.json();
      console.log("Server response:", data);

      if (!response.ok) {
        if (response.status === 400) {
          if (data.message?.includes("email") || data.message?.includes("Email") || data.message?.includes("already registered")) {
            throw new Error("Email already exists. Please use a different email or login.");
          } else {
            throw new Error(data.message || data.error || "Registration failed");
          }
        } else if (response.status === 409) {
          throw new Error("Email already registered. Please login instead.");
        } else {
          throw new Error(data.message || "Registration failed");
        }
      }

      // Show success snackbar instead of alert
      showSnackbar("✅ Registration successful! Redirecting to login...", "success");
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
      
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message);
      showSnackbar(`❌ ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-hero">
        <div className="register-hero-overlay"></div>
        
        <div className="register-container">
          <div className="register-logo-container">
            <div className="register-logo">🚑</div>
            <h1 className="register-title">SADAK SUDHAR</h1>
            <p className="register-subtitle">Citizen Registration</p>
          </div>

          {error && <div className="register-error">{error}</div>}

          <div className="register-form">
            <div className="register-input-group">
              <label className="register-label">Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setValidationErrors({...validationErrors, fullName: null});
                }}
                className={`register-input ${validationErrors.fullName ? 'input-error' : ''}`}
              />
              {validationErrors.fullName && (
                <span className="field-error">{validationErrors.fullName}</span>
              )}
            </div>

            <div className="register-input-group">
              <label className="register-label">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setValidationErrors({...validationErrors, email: null});
                }}
                className={`register-input ${validationErrors.email ? 'input-error' : ''}`}
              />
              {validationErrors.email && (
                <span className="field-error">{validationErrors.email}</span>
              )}
            </div>

            <div className="register-input-group">
              <label className="register-label">Password</label>
              <input
                type="password"
                placeholder="Enter your password (min. 6 characters)"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setValidationErrors({...validationErrors, password: null});
                }}
                className={`register-input ${validationErrors.password ? 'input-error' : ''}`}
              />
              {validationErrors.password && (
                <span className="field-error">{validationErrors.password}</span>
              )}
              <span className="input-hint">Must be at least 6 characters</span>
            </div>

            <div className="register-role-section">
              <label className="register-label">Account Type</label>
              <div className="register-citizen-card">
                <div className="citizen-icon">👤</div>
                <div className="citizen-info">
                  <span className="citizen-role">Citizen Account</span>
                  <span className="citizen-desc">Report and track road issues in your community</span>
                </div>
              </div>
            </div>

            <button 
              onClick={handleRegister} 
              className="register-button"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Citizen Account"}
            </button>

            <div className="register-divider">
              <span className="divider-line"></span>
              <span className="divider-text">OR</span>
              <span className="divider-line"></span>
            </div>

            <p className="register-link">
              Already have an account?{" "}
              <span onClick={() => navigate("/login")} className="link-text">
                Login here
              </span>
            </p>

            <p className="register-back-link">
              <span onClick={() => navigate("/")} className="link-text">
                ← Back to Home
              </span>
            </p>

            <div className="register-note">
              <span className="note-icon">ℹ️</span>
              Ambulance and Admin accounts can only be created by system administrators
            </div>
          </div>
        </div>
      </div>

      {/* Snackbar Component */}
      <div className={`snackbar ${snackbar.show ? 'show' : ''} ${snackbar.type}`}>
        <div className="snackbar-content">
          <span className="snackbar-message">{snackbar.message}</span>
          <button className="snackbar-close" onClick={hideSnackbar}>×</button>
        </div>
        <div className="snackbar-progress"></div>
      </div>
    </div>
  );
}