import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import RegisterCitizen from "./pages/Register_citizen.jsx";
import CitizenDashboard from "./pages/CitizenDashboard.jsx";
import RegisterAmbulance from "./pages/Register_ambulance.jsx";
import ReportIssue from "./pages/ReportIssue.jsx";
import ViewIssues from "./pages/ViewIssues.jsx";
import Feedback from "./pages/Feedback.jsx";

function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register_citizen" element={<RegisterCitizen />} />
            <Route path="/register_ambulance" element={<RegisterAmbulance />} />
            <Route path="/dashboard" element={<CitizenDashboard />} />
            <Route path="/report" element={<ReportIssue />} />
            <Route path="/view-issues" element={<ViewIssues />} />
            <Route path="/feedback" element={<Feedback />} />
        </Routes>
    );
}

export default App;