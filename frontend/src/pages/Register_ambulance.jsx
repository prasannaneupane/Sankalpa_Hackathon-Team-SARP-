import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config";
import "./Register.css";

export default function RegisterAmbulance() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState(""); // Vehicle plate input
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    show: false,
    message: "",
    type: "success"
  });

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

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

    if (!vehiclePlate.trim()) {
      errors.vehiclePlate = "Vehicle plate number is required";
    } else if (vehiclePlate.length < 4) {
      errors.vehiclePlate = "Please enter a valid vehicle plate number";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const showSnackbar = (message, type = "success") => {
    setSnackbar({ show: true, message, type });
    
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
      console.log("Creating ambulance user with plate:", {
        email: email.trim().toLowerCase(),
        full_name: fullName.trim(),
        vehicle_plate: vehiclePlate.trim().toUpperCase()
      });

      const response = await fetch(`${API_BASE_URL}/auth/admin/create-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          password, 
          full_name: fullName.trim(),
          role: "ambulance",
          vehicle_plate: vehiclePlate.trim().toUpperCase() // Sending plate to backend
        }),
      });

      const data = await response.json();
      console.log("Server response:", data);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Unauthorized. Admin access required.");
        } else if (response.status === 400) {
          if (data.message?.includes("Vehicle plate")) {
            throw new Error(data.message);
          } else if (data.message?.includes("email")) {
            throw new Error("Email already exists. Please use a different email.");
          } else {
            throw new Error(data.message || data.error || "Failed to create ambulance user");
          }
        } else {
          throw new Error(data.message || "Failed to create ambulance user");
        }
      }

      // Show success snackbar with vehicle plate
      showSnackbar(`✅ Ambulance registered successfully! Vehicle: ${vehiclePlate.toUpperCase()}`, "success");
      
      // Clear form
      setFullName("");
      setEmail("");
      setPassword("");
      setVehiclePlate("");
      setValidationErrors({});
      
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message);
      showSnackbar(`❌ ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format vehicle plate as uppercase
  const handleVehiclePlateChange = (e) => {
    setVehiclePlate(e.target.value.toUpperCase());
    setValidationErrors({...validationErrors, vehiclePlate: null});
  };

  return (
    <div className="register-page">
      <div className="register-hero">
        <div className="register-hero-overlay"></div>
        
        <div className="register-container">
          <div className="register-logo-container">
            <div className="register-logo">🚑</div>
            <h1 className="register-title">SADAK SUDHAR</h1>
            <p className="register-subtitle">Admin: Register Ambulance</p>
          </div>

          {error && <div className="register-error">{error}</div>}

          <div className="register-form">
            <div className="register-input-group">
              <label className="register-label">Driver Full Name</label>
              <input
                type="text"
                placeholder="Enter ambulance driver's full name"
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
                placeholder="Enter driver's email"
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
                placeholder="Enter temporary password (min. 6 characters)"
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
              <span className="input-hint">Driver can change password after first login</span>
            </div>

            {/* Vehicle Plate Input - NEW */}
            <div className="register-input-group">
              <label className="register-label">Vehicle Plate Number</label>
              <input
                type="text"
                placeholder="e.g., BA 1 PA 1234"
                value={vehiclePlate}
                onChange={handleVehiclePlateChange}
                className={`register-input ${validationErrors.vehiclePlate ? 'input-error' : ''}`}
              />
              {validationErrors.vehiclePlate && (
                <span className="field-error">{validationErrors.vehiclePlate}</span>
              )}
              <span className="input-hint">Enter the official vehicle registration number</span>
            </div>

            {/* Ambulance Info Card */}
            <div className="register-role-section">
              <label className="register-label">Account Details</label>
              <div className="register-citizen-card" style={{ background: '#fff0f3', borderColor: '#DC143C' }}>
                <div className="citizen-icon">🚑</div>
                <div className="citizen-info">
                  <span className="citizen-role">Ambulance Account</span>
                  <span className="citizen-desc">
                    Vehicle Plate: <strong style={{ color: '#DC143C' }}>{vehiclePlate || 'Not specified'}</strong>
                  </span>
                  <span className="citizen-desc" style={{ marginTop: '4px', color: '#DC143C' }}>
                    ⚡ Driver will be verified and ready to respond
                  </span>
                </div>
              </div>
            </div>

            <button 
              onClick={handleRegister} 
              className="register-button"
              disabled={loading}
            >
              {loading ? "Registering Ambulance..." : "🚑 Register Ambulance"}
            </button>

            <div className="register-divider">
              <span className="divider-line"></span>
              <span className="divider-text">ADMIN</span>
              <span className="divider-line"></span>
            </div>

            <p className="register-back-link">
              <span onClick={() => navigate("/admin/dashboard")} className="link-text">
                ← Back to Admin Dashboard
              </span>
            </p>

            <div className="register-note">
              <span className="note-icon">⚠️</span>
              <strong>Admin Only:</strong> This will create a verified ambulance driver account with the specified vehicle plate.
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