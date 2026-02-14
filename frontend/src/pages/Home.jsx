import { useState, useEffect, useRef } from "react";
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
  
  // Create ref for about section
  const aboutRef = useRef(null);

  useEffect(() => {
    fetchStats();
    fetchRecentIssues();
  }, []);

  // Auto-scroll to about section when showAbout becomes true
  useEffect(() => {
    if (showAbout && aboutRef.current) {
      aboutRef.current.scrollIntoView({ 
        behavior: "smooth",
        block: "start"
      });
    }
  }, [showAbout]);

  const fetchStats = async () => {
    console.log("Fetching dashboard stats...");
    try {
      const response = await fetch(`${API_BASE_URL}/issues/dashboard`);
      const data = await response.json();
      console.log("Raw stats data:", data);
      
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

  const toggleAbout = () => {
    setShowAbout((prev) => !prev);
  };

  return (
    <div className="home-page">
      <Navbar loggedIn={false} toggleAbout={toggleAbout} />

      {/* Hero Section */}
      <div className="hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <img className="hero-logo" src="/logo.png" alt="SADAK SUDHAR Logo" />
          <h1 className="hero-title">SADAK SUDHAR</h1>
          <p className="hero-subtitle">
            Report, track, and resolve road issues in your community
          </p>
          <h2 className="cta-title">Ready to make a difference?</h2>
          <p className="cta-text">
            Join our community and help improve road safety in your area.
          </p>
          <div className="hero-buttons">
            <button className="primary-button" onClick={() => navigate("/login")}>
              Get Started
            </button>
            <button
              className="secondary-button"
              onClick={toggleAbout}
            >
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div ref={aboutRef} className="about-section">
        <div className="about-card">
          <h2 className="about-title">About SADAK SUDHAR</h2>
          <p className="about-subtitle">Nepal's Road Infrastructure Reporting Platform</p>
          
          <p className="about-text">
            SADAK SUDHAR is a digital platform built to bridge the gap between Nepali citizens 
            and municipal authorities. We enable real-time reporting, tracking, and resolution 
            of road issues including potholes, damaged roads, and infrastructure hazards.
          </p>
          
          <p className="about-text">
            Our mission is to create safer roads across Nepal by empowering citizens to report 
            problems instantly and enabling authorities to respond efficiently.
          </p>

          <div className="features">
            <div className="feature-item">
              <span className="feature-icon">📍</span>
              <h3 className="feature-title">Report Issues</h3>
              <p className="feature-text">
                Report potholes and road damage instantly with photos and exact location
              </p>
            </div>
            
            <div className="feature-item">
              <span className="feature-icon">📊</span>
              <h3 className="feature-title">Track Progress</h3>
              <p className="feature-text">
                Follow your report from submission to resolution with real-time status updates
              </p>
            </div>
            
            <div className="feature-item">
              <span className="feature-icon">🚑</span>
              <h3 className="feature-title">Emergency Response</h3>
              <p className="feature-text">
                Direct alerts to ambulance services for rapid response to road-related emergencies
              </p>
            </div>
          </div>
        </div>
      </div>

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

      {/* Recent Issues Section - Removed View All Issues button */}
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
                    {getStatusLabel(issue.status || "pending")}
                  </span>
                </div>
                <p className="issue-description">
                  {issue.description || "No description available"}
                </p>
                <div className="issue-footer">
                  <span className="issue-location">📍 Location #{issue.id.substring(0, 8)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-issues-text">No issues reported yet.</p>
        )}
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