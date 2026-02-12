import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config";
import Navbar from "../components/Navbar";
import AmbulanceFeedbackModal from "../components/AmbulanceFeedbackModal";
import { getLocationPreview, formatLocation } from '../utils/locationUtils';
import "./AmbulanceDashboard.css";

export default function AmbulanceDashboard() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [myAssignedIssues, setMyAssignedIssues] = useState([]);
  const [stats, setStats] = useState({
    available: 1,
    assigned: 0,
    resolved: 0
  });
  
  // ============ Feedback State ============
  const [feedbackStats, setFeedbackStats] = useState({
    averageRating: 0,
    totalRatings: 0,
    recentFeedback: []
  });
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const ambulanceId = user.id;

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    show: false,
    message: "",
    type: "success"
  });

  // ============ Feedback Functions ============
  
  const fetchAmbulanceFeedback = async () => {
      try {
          if (!ambulanceId) {
              console.warn("No ambulance ID available");
              return;
          }

          const response = await fetch(
              `${API_BASE_URL}/feedback/ambulance/${ambulanceId}/feedback?limit=5`,
              {
                  headers: { Authorization: `Bearer ${token}` },
              }
          );

          if (response.ok) {
              const data = await response.json();
              setFeedbackStats({
                  averageRating: data.average_rating?.average_rating || 0,
                  totalRatings: data.average_rating?.total_ratings || 0,
                  recentFeedback: data.feedbacks || []
              });
          }
      } catch (err) {
          console.error("Error fetching feedback:", err);
      }
  };

  const fetchAmbulanceRating = async () => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/feedback/ambulance/${ambulanceId}/rating`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );

        if (response.ok) {
            const data = await response.json();
            setFeedbackStats(prev => ({
                ...prev,
                averageRating: data.average_rating || 0,
                totalRatings: data.total_ratings || 0
            }));
        }
    } catch (err) {
        console.error("Error fetching rating:", err);
    }
};

  // ============ Issue Functions ============

  const fetchAvailableIssues = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/issues?status=pending&limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch issues");

      let data = await response.json();
      
      // Add location preview to each issue
      data = data.map(issue => ({
        ...issue,
        locationPreview: getLocationPreview(issue.location, 25)
      }));
      
      const sorted = data.sort((a, b) => (b.weight || 1) - (a.weight || 1));
      setIssues(sorted);
    } catch (err) {
      console.error("Error fetching issues:", err);
      setError("Failed to load issues");
    }
  };

  const fetchMyAssignedIssues = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/issues?status=assigned&limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch assigned issues");

      const data = await response.json();
      
      // Add location preview to each issue
      const issuesWithPreview = data.map(issue => ({
        ...issue,
        locationPreview: getLocationPreview(issue.location, 30)
      }));
      
      const myIssues = issuesWithPreview.filter(issue => issue.ambulance_id === ambulanceId);
      setMyAssignedIssues(myIssues);
      
      // Fetch resolved issues count
      const resolvedResponse = await fetch(`${API_BASE_URL}/issues?status=resolved&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (resolvedResponse.ok) {
        const resolvedData = await resolvedResponse.json();
        const myResolvedIssues = resolvedData.filter(issue => issue.ambulance_id === ambulanceId);
        
        setStats({
          available: myIssues.length === 0 ? 1 : 0,
          assigned: myIssues.length,
          resolved: myResolvedIssues.length
        });
      }
    } catch (err) {
      console.error("Error fetching assigned issues:", err);
    }
  };

  const handleClaimIssue = async (issueId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/issues/${issueId}/claim`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to claim issue");
      
      showSnackbar("✅ Issue claimed successfully!", "success");
      fetchAvailableIssues();
      fetchMyAssignedIssues();
    } catch (err) {
      console.error("Error claiming issue:", err);
      showSnackbar(`❌ ${err.message}`, "error");
    }
  };

  const handleStartMission = (issueId) => {
    navigate(`/mission/${issueId}`);
  };

  // ============ Utility Functions ============

  const showSnackbar = (message, type = "success") => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => setSnackbar(prev => ({ ...prev, show: false })), 4000);
  };

  const getPriorityClass = (priority) => {
    const p = parseInt(priority) || 1;
    if (p >= 4) return "critical";
    if (p === 3) return "high";
    if (p === 2) return "medium";
    return "low";
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`star ${i <= rating ? 'filled' : ''}`}>★</span>
      );
    }
    return stars;
  };

  const timeAgo = (dateString) => {
    if (!dateString) return "Recently";
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hr ago`;
    return `${Math.floor(diffMinutes / 1440)} days ago`;
  };

  // ============ Initial Fetch ============

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchAvailableIssues(),
          fetchMyAssignedIssues(),
          fetchAmbulanceFeedback(),
          fetchAmbulanceRating()
        ]);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  return (
    <div className="ambulance-dashboard">
      <Navbar loggedIn={true} />
      
      <div className="ambulance-container">
        {/* Header with Rating Summary */}
        <div className="ambulance-header">
          <div>
            <h1 className="ambulance-title">🚑 Ambulance Dashboard</h1>
            <p className="ambulance-subtitle">
              Welcome, {user.full_name || "Driver"} • 
              <span className={`status-badge ${stats.available ? 'available' : 'busy'}`}>
                {stats.available ? ' Available' : ' On Mission'}
              </span>
            </p>
          </div>
          
          {/* Rating Card */}
          {feedbackStats.totalRatings > 0 ? (
            <div className="rating-summary-card">
              <div className="rating-header">
                <span className="rating-icon">⭐</span>
                <span className="rating-label">Your Rating</span>
              </div>
              <div className="rating-value">
                {feedbackStats.averageRating.toFixed(1)}
                <span className="rating-max">/5</span>
              </div>
              <div className="rating-stars">
                {renderStars(Math.round(feedbackStats.averageRating))}
              </div>
              <div className="rating-count">
                {feedbackStats.totalRatings} {feedbackStats.totalRatings === 1 ? 'review' : 'reviews'}
              </div>
            </div>
          ) : (
            <div className="rating-summary-card no-ratings">
              <div className="rating-header">
                <span className="rating-icon">⭐</span>
                <span className="rating-label">Your Rating</span>
              </div>
              <div className="rating-value">
                0.0
                <span className="rating-max">/5</span>
              </div>
              <div className="rating-stars">
                {renderStars(0)}
              </div>
              <div className="rating-count">
                No reviews yet
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="ambulance-stats">
          <div className="stat-card">
            <span className="stat-value">{issues.length}</span>
            <span className="stat-label">Available Issues</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.assigned}</span>
            <span className="stat-label">My Missions</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.resolved}</span>
            <span className="stat-label">Resolved</span>
          </div>
        </div>

        {/* Error Message */}
        {error && <div className="ambulance-error">{error}</div>}

        {/* Recent Feedback Section */}
        {feedbackStats.recentFeedback.length > 0 && (
          <div className="feedback-section">
            <div className="section-header">
              <h2 className="section-title">
                📝 Recent Citizen Feedback
              </h2>
              <button 
                className="view-all-btn"
                onClick={() => setShowFeedbackModal(true)}
              >
                View All →
              </button>
            </div>

            <div className="feedback-grid">
              {feedbackStats.recentFeedback.map((feedback) => (
                <div key={feedback.id} className="feedback-card">
                  <div className="feedback-header">
                    <div className="feedback-rating">
                      <span className="rating-number">{feedback.citizen_rating}</span>
                      <div className="stars">
                        {renderStars(feedback.citizen_rating)}
                      </div>
                    </div>
                    <span className="feedback-time">
                      {timeAgo(feedback.created_at)}
                    </span>
                  </div>
                  
                  {feedback.comment && (
                    <p className="feedback-comment">"{feedback.comment}"</p>
                  )}
                  
                  <div className="feedback-footer">
                    <span className="feedback-issue">
                      Issue #{feedback.issue_id?.substring(0, 6)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Active Missions Section */}
        {myAssignedIssues.length > 0 && (
          <div className="missions-section">
            <h2 className="section-title">
              🚨 My Active Missions
              <span className="section-count">{myAssignedIssues.length}</span>
            </h2>
            
            <div className="missions-grid">
              {myAssignedIssues.map((issue) => (
                <div key={issue.id} className="mission-card">
                  <div className="mission-card-header">
                    <span className={`priority-badge priority-${getPriorityClass(issue.weight)}`}>
                      P{issue.weight || 1}
                    </span>
                    <span className="mission-id">#{issue.id.substring(0, 6)}</span>
                  </div>

                  <div className="mission-content">
                    {issue.photos && issue.photos.length > 0 ? (
                      <img 
                        src={issue.photos[0]} 
                        alt="Issue" 
                        className="mission-image"
                        onClick={() => window.open(issue.photos[0], '_blank')}
                      />
                    ) : (
                      <div className="mission-image-placeholder">
                        <span>📸 No Image</span>
                      </div>
                    )}

                    <div className="mission-details">
                      <p className="mission-description">
                        {issue.description || "No description provided"}
                      </p>
                      <div className="mission-meta">
                        <span className="mission-location">
                          📍 {issue.locationPreview || 'Location available'}
                        </span>
                        <span className="mission-time">
                          ⏱️ {timeAgo(issue.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    className="start-mission-btn"
                    onClick={() => handleStartMission(issue.id)}
                  >
                    🚑 Continue Mission →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Issues Section */}
        <div className="available-section">
          <h2 className="section-title">
            📋 Available Emergency Calls
            <span className="section-count">{issues.length}</span>
          </h2>

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading emergency calls...</p>
            </div>
          ) : issues.length === 0 ? (
            <div className="no-issues">
              <div className="no-issues-icon">🚑</div>
              <h3>No active issues</h3>
              <p>All clear! No pending emergency calls at the moment.</p>
            </div>
          ) : (
            <div className="issues-grid">
              {issues.map((issue) => (
                <div 
                  key={issue.id} 
                  className={`issue-card priority-${getPriorityClass(issue.weight)}`}
                >
                  <div className="issue-card-header">
                    <div className="priority-indicator">
                      <span className={`priority-badge priority-${getPriorityClass(issue.weight)}`}>
                        Priority {issue.weight || 1}
                      </span>
                      {issue.weight >= 4 && (
                        <span className="emergency-tag">🚨 EMERGENCY</span>
                      )}
                    </div>
                    <span className="issue-time">{timeAgo(issue.created_at)}</span>
                  </div>

                  <div className="issue-card-body">
                    {issue.photos && issue.photos.length > 0 ? (
                      <div className="issue-thumbnail">
                        <img 
                          src={issue.photos[0]} 
                          alt="Issue thumbnail"
                          onClick={() => window.open(issue.photos[0], '_blank')}
                        />
                      </div>
                    ) : (
                      <div className="issue-thumbnail-placeholder">
                        📷
                      </div>
                    )}

                    <div className="issue-info">
                      <p className="issue-description">
                        {issue.description || "No description provided"}
                      </p>
                      <div className="issue-details">
                        <span className="issue-location">
                          📍 {issue.locationPreview || 'Location available'}
                        </span>
                        <span className="issue-votes">
                          👍 {issue.vote_score || 0} votes
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="issue-card-footer">
                    <button
                      className="claim-btn"
                      onClick={() => handleClaimIssue(issue.id)}
                      disabled={!stats.available || myAssignedIssues.length >= 1}
                    >
                      {!stats.available ? '⏳ Busy on Mission' : 
                       myAssignedIssues.length >= 1 ? '⚠️ Already on Mission' : 
                       '🚑 Claim & Respond'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Feedback Modal */}
      <AmbulanceFeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        ambulanceId={ambulanceId}
      />

      {/* Snackbar */}
      <div className={`snackbar ${snackbar.show ? 'show' : ''} ${snackbar.type}`}>
        <div className="snackbar-content">
          <span className="snackbar-message">{snackbar.message}</span>
          <button className="snackbar-close" onClick={() => setSnackbar(prev => ({ ...prev, show: false }))}>×</button>
        </div>
        <div className="snackbar-progress"></div>
      </div>
    </div>
  );
}