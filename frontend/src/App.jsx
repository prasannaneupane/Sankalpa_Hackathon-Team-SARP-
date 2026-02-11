import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import CitizenDashboard from "./pages/CitizenDashboard";
import ReportIssue from "./pages/ReportIssue";
import Register from "./pages/Register";


function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<CitizenDashboard />} />
      <Route path="/Report" element={<ReportIssue />} />
      <Route path="*" element={<Navigate to="/" />} />
      <Route path="/Register" element={<Register />} />
    </Routes>
  );
}

export default App;
