import  himal  from "../assets/himal.jpg";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [role, setRole] = useState("citizen");
  const navigate = useNavigate();

  const handleLogin = () => {
    localStorage.setItem("role", role);
    if (role === "citizen") navigate("/dashboard"); // Redirect to dashboard
    else alert("Other roles not implemented yet");
  };

  return (
<div
  style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    fontFamily: "'Hind Siliguri', sans-serif",
    background: `linear-gradient(rgba(255,255,255,0.15), rgba(255,255,255,0.15)), url(${himal})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  }}
>

      {/* Semi-transparent overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(255,255,255,0.15)",
          zIndex: 0,
        }}
      ></div>

      {/* Login Card */}
      <div
        style={{
          padding: 50,
          borderRadius: 15,
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
          textAlign: "center",
          minWidth: 350,
          borderTop: "5px solid #c8102e",
          borderBottom: "5px solid #0072bb",
          position: "relative",
          overflow: "hidden",
          transform: "translateY(-20px)",
          animation: "slideDown 0.6s ease-out forwards",
        }}
      >
        <h1 style={{ marginBottom: 30, color: "#c8102e", zIndex: 1 }}>
          स्वागत छ! (Welcome!)
        </h1>

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={{
            padding: "10px 15px",
            marginBottom: 25,
            width: "100%",
            borderRadius: 8,
            border: "1px solid #ccc",
            fontSize: 16,
            zIndex: 1,
            position: "relative",
          }}
        >
          <option value="citizen">Citizen</option>
          <option value="ambulance">Ambulance</option>
          <option value="admin">Admin</option>
        </select>

        <button
          onClick={handleLogin}
          style={{
            padding: "12px 25px",
            borderRadius: 8,
            border: "none",
            backgroundColor: "#c8102e",
            color: "white",
            fontSize: 16,
            cursor: "pointer",
            width: "100%",
            zIndex: 1,
            transition: "0.3s",
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#a00b22")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#c8102e")}
        >
          Login
        </button>

        <p style={{ marginTop: 20, color: "#555", fontSize: 14, zIndex: 1 }}>
          🇳🇵 Proudly reflecting Nepalese culture 🇳🇵
        </p>
      </div>

      {/* Slide-down animation */}
      <style>
        {`
          @keyframes slideDown {
            0% { transform: translateY(-50px); opacity: 0; }
            100% { transform: translateY(0); opacity: 1; }
          }
        `}
      </style>
    </div>
  );
}
