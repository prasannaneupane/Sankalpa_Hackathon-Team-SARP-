import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config";
import Navbar from "../components/Navbar";
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

  // ============ HELPER FUNCTIONS ============
  
  const extractCoordinates = (location) => {
    if (!location) return { lat: 27.7172, lng: 85.3240 };
    
    if (typeof location === 'string') {
      const match = location.match(/POINT\(([^ ]+) ([^ ]+)\)/);
      if (match) {
        return {
          lng: parseFloat(match[1]),
          lat: parseFloat(match[2])
        };
      }
    }
    
    if (location?.coordinates) {
      return {
        lng: parseFloat(location.coordinates[0]),
        lat: parseFloat(location.coordinates[1])
      };
    }
    
    return { lat: 27.7172, lng: 85.3240 };
  };

  const getPriorityClass = (priority) => {
    const p = parseInt(priority) || 1;
    if (p >= 4) return "critical";
    if (p === 3) return "high";
    if (p === 2) return "medium";
    return "low";
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

  const showSnackbar = (message, type = "success") => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => {
      setSnackbar(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  const hideSnackbar = () => {
    setSnackbar(prev => ({ ...prev, show: false }));
  };

  // ============ API FUNCTIONS ============
  
  // ✅ Fetch all available issues (pending)
  const fetchAvailableIssues = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/issues?status=pending&limit=50`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch issues");
      }

      let data = await response.json();
      
      // Add extracted coordinates to each issue
      data = data.map(issue => {
        const coords = extractCoordinates(issue.location);
        return {
          ...issue,
          lat: coords.lat,
          lng: coords.lng
        };
      });
      
      // Sort by priority (weight) - higher priority first
      const sorted = data.sort((a, b) => (b.weight || 1) - (a.weight || 1));
      setIssues(sorted);
    } catch (err) {
      console.error("Error fetching issues:", err);
      setError("Failed to load issues");
    }
  };

  // ✅ Fetch my assigned issues
  const fetchMyAssignedIssues = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/issues?status=assigned&limit=50`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch assigned issues");
      }

      const data = await response.json();
      
      // Filter only issues assigned to this ambulance
      const myIssues = data.filter(issue => issue.ambulance_id === ambulanceId);
      setMyAssignedIssues(myIssues);
      
      // Also fetch resolved issues count
      const resolvedResponse = await fetch(`${API_BASE_URL}/issues?status=resolved&limit=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (resolvedResponse.ok) {
        const resolvedData = await resolvedResponse.json();
        const myResolvedIssues = resolvedData.filter(issue => issue.ambulance_id === ambulanceId);
        
        // Update stats - available if no assigned issues
        setStats({
          available: myIssues.length === 0 ? 1 : 0,
          assigned: myIssues.length,
          resolved: myResolvedIssues.length
        });
      } else {
        // Still update assigned stats even if resolved fetch fails
        setStats(prev => ({
          ...prev,
          available: myIssues.length === 0 ? 1 : 0,
          assigned: myIssues.length
        }));
      }

    } catch (err) {
      console.error("Error fetching assigned issues:", err);
    }
  };

  // ✅ Claim an issue
  const handleClaimIssue = async (issueId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/issues/${issueId}/claim`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to claim issue");
      }

      showSnackbar("✅ Issue claimed successfully! You can now start the mission.", "success");
      
      // Refresh both lists
      await fetchAvailableIssues();
      await fetchMyAssignedIssues();

    } catch (err) {
      console.error("Error claiming issue:", err);
      showSnackbar(`❌ ${err.message}`, "error");
    }
  };

  // ✅ Navigate to mission page
  const handleStartMission = (issueId) => {
    navigate(`/mission/${issueId}`);
  };

  // ============ INITIAL FETCH ============
  
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        await fetchAvailableIssues(); // ✅ Now defined before usage
        await fetchMyAssignedIssues();
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []); // Empty dependency array - runs once on mount

  return (
    <div className="ambulance-dashboard">
      <Navbar loggedIn={true} />
      
      <div className="ambulance-container">
        {/* Header */}
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
        </div>

        {/* Error Message */}
        {error && <div className="ambulance-error">{error}</div>}

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
                          📍 {typeof issue.location === 'string' 
                            ? issue.location.substring(0, 30) + '...' 
                            : 'Location pinned'}
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

        {/* Available Issues Section - Sorted by Priority */}
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
                          📍 {typeof issue.location === 'string' 
                            ? issue.location.substring(0, 25) + '...' 
                            : 'Location available'}
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

      {/* Snackbar */}
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