import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import API_BASE_URL from "../config";
import "./Home.css";

export default function Home() {
  const [showAbout, setShowAbout] = useState(false);
  const [stats, setStats] = useState({
    completed: 0,
    ongoing: 0,
    delayed: 0,
    total: 0,
  });
  const [recentIssues, setRecentIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
    fetchRecentIssues();
  }, []);

  const fetchStats = async () => {
    console.log("Fetching dashboard stats...");
    try {
      const response = await fetch(`${API_BASE_URL}/issues/dashboard`);
      const data = await response.json();
      console.log("Raw stats data:", data);
      
      // Check if data has the stats property (backend returns {stats: {...}, hotSpots: [...]})
      if (data && data.stats) {
        setStats({
          completed: data.stats.resolved_count || 0,
          ongoing: (data.stats.in_progress_count || 0) + (data.stats.pending_count || 0),
          delayed: data.stats.delayed_count || 0,
          total: data.stats.total_issues || 0,
        });
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const fetchRecentIssues = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/issues/dashboard`);
      const data = await response.json();
      
      // Check if data has hotSpots array
      if (data && Array.isArray(data.hotSpots)) {
        setRecentIssues(data.hotSpots.slice(0, 5));
      }
    } catch (err) {
      console.error("Error fetching recent issues:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "resolved":
        return "resolved";
      case "in_progress":
        return "in-progress";
      case "delayed":
        return "delayed";
      default:
        return "pending";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "resolved":
        return "Resolved";
      case "in_progress":
        return "In Progress";
      case "delayed":
        return "Delayed";
      default:
        return "Pending";
    }
  };

  return (
    <div className="home-page">
      <Navbar loggedIn={false} toggleAbout={() => setShowAbout((prev) => !prev)} />

      {/* Hero Section */}
      <div className="hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">🚑 Pothole Management System</h1>
          <p className="hero-subtitle">
            Report, track, and resolve road issues in your community
          </p>
          <div className="hero-buttons">
            <button className="primary-button" onClick={() => navigate("/login")}>
              Get Started
            </button>
            <button
              className="secondary-button"
              onClick={() => setShowAbout((prev) => !prev)}
            >
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* About Section */}
      {showAbout && (
        <div className="about-section">
          <div className="about-card">
            <h2 className="about-title">About TEAM-SARP</h2>
            <p className="about-text">
              TEAM-SARP is a Nepal-based platform designed to empower citizens to report
              and track community road issues efficiently. Our mission is to create safer
              roads for everyone by connecting citizens, authorities, and emergency services.
            </p>
            <div className="features">
              <div className="feature-item">
                <span className="feature-icon">📍</span>
                <h3 className="feature-title">Report Issues</h3>
                <p className="feature-text">Easily report potholes with location and photos</p>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📊</span>
                <h3 className="feature-title">Track Progress</h3>
                <p className="feature-text">Monitor the status of reported issues in real-time</p>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🚑</span>
                <h3 className="feature-title">Ambulance Alerts</h3>
                <p className="feature-text">Alert ambulances about road hazards on their route</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Section */}
      <div className="stats-section">
        <h2 className="section-title">Issue Statistics</h2>
        <div className="stats-grid">
          <div className="stat-card resolved">
            <span className="stat-number">{stats.completed}</span>
            <span className="stat-label">Resolved</span>
            <span className="stat-icon">✅</span>
          </div>
          <div className="stat-card in-progress">
            <span className="stat-number">{stats.ongoing}</span>
            <span className="stat-label">In Progress</span>
            <span className="stat-icon">🔄</span>
          </div>
          <div className="stat-card delayed">
            <span className="stat-number">{stats.delayed}</span>
            <span className="stat-label">Delayed</span>
            <span className="stat-icon">⚠️</span>
          </div>
          <div className="stat-card total">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Total Issues</span>
            <span className="stat-icon">📋</span>
          </div>
        </div>
      </div>

      {/* Recent Issues Section */}
      <div className="recent-section">
        <h2 className="section-title">Recent Issues</h2>
        {loading ? (
          <p className="loading-text">Loading issues...</p>
        ) : recentIssues.length > 0 ? (
          <div className="issues-grid">
            {recentIssues.map((issue) => (
              <div key={issue.id} className="issue-card">
                <div className="issue-header">
                  <span className={`status-badge ${getStatusClass(issue.status)}`}>
                    {getStatusLabel(issue.status)}
                  </span>
                </div>
                <p className="issue-description">
                  {issue.description || "No description available"}
                </p>
                <div className="issue-footer">
                  <span className="issue-location">📍 Location #{issue.id}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-issues-text">No issues reported yet.</p>
        )}
        <button className="view-all-button" onClick={() => navigate("/view-issues")}>
          View All Issues
        </button>
      </div>

      {/* Call to Action Section */}
      <div className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to make a difference?</h2>
          <p className="cta-text">
            Join our community and help improve road safety in your area.
          </p>
          <div className="cta-buttons">
            <button className="cta-primary-button" onClick={() => navigate("/register")}>
              Register Now
            </button>
            <button className="cta-secondary-button" onClick={() => navigate("/login")}>
              Login
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-title">🚑 TEAM-SARP</h3>
            <p className="footer-text">Making roads safer, one report at a time.</p>
          </div>
          <div className="footer-section">
            <h4 className="footer-subtitle">Quick Links</h4>
            <ul className="footer-links">
              <li className="footer-link" onClick={() => navigate("/")}>Home</li>
              <li className="footer-link" onClick={() => navigate("/login")}>Login</li>
              <li className="footer-link" onClick={() => navigate("/register")}>Register</li>
            </ul>
          </div>
          <div className="footer-section">
            <h4 className="footer-subtitle">Contact</h4>
            <p className="footer-text">📧 support@teamsarp.com</p>
            <p className="footer-text">📞 +977-1234567890</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p className="footer-copyright">© 2026 TEAM-SARP. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
