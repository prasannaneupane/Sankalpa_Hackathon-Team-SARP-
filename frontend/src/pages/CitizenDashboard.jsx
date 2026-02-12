import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import API_BASE_URL from "../config";
import "./CitizenDashboard.css";

export default function CitizenDashboard() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [userVotes, setUserVotes] = useState({});
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    assigned: 0,
    resolved: 0
  });
  
  // Infinite scroll
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef();
  const lastIssueRef = useRef();

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    show: false,
    message: "",
    type: "success"
  });

  // Fetch user's votes from backend
  const fetchUserVotes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/issues/votes/my-votes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const votes = await response.json();
        const voteMap = {};
        votes.forEach(vote => {
          voteMap[vote.issue_id] = vote.vote_value;
        });
        setUserVotes(voteMap);
      }
    } catch (err) {
      console.error("Error fetching votes:", err);
    }
  };

  // Fetch issues with pagination
  const fetchIssues = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setRefreshing(true);

      const response = await fetch(
        `${API_BASE_URL}/issues?page=${pageNum}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch issues");
      }

      // Merge issues with user votes and ensure photos array exists
      const issuesWithVotes = data.map(issue => ({
        ...issue,
        userVote: userVotes[issue.id] || 0,
        vote_score: issue.vote_score || 0,
        total_votes: issue.total_votes || 0,
        photos: issue.photos || [], // Ensure photos array exists
        photo_count: issue.photo_count || 0,
        first_photo: issue.first_photo || null
      }));

      if (append) {
        setIssues(prev => [...prev, ...issuesWithVotes]);
      } else {
        setIssues(issuesWithVotes);
      }

      setHasMore(data.length === 10);
      setPage(pageNum);
      
      // Calculate stats
      if (pageNum === 1) {
        const total = data.length;
        const pending = data.filter(i => i.status === "pending").length;
        const assigned = data.filter(i => i.status === "assigned" || i.status === "in_progress").length;
        const resolved = data.filter(i => i.status === "resolved").length;
        setStats({ total, pending, assigned, resolved });
      }

    } catch (err) {
      console.error("Fetch issues error:", err);
      setError(err.message);
      showSnackbar(`❌ ${err.message}`, "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchUserVotes().then(() => {
      fetchIssues(1, false);
    });
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    if (loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !refreshing) {
          fetchIssues(page + 1, true);
        }
      },
      { threshold: 0.5 }
    );

    if (lastIssueRef.current) {
      observer.observe(lastIssueRef.current);
    }

    return () => observer.disconnect();
  }, [loading, hasMore, page, refreshing]);

  // Handle vote
  const handleVote = async (issueId, voteValue) => {
    try {
      const previousVote = userVotes[issueId] || 0;

      if (previousVote === voteValue) {
        showSnackbar("You've already voted this way", "info");
        return;
      }

      let voteDifference = voteValue;
      if (previousVote !== 0) {
        voteDifference = voteValue - previousVote;
      }

      // Optimistic update
      setIssues(prev =>
        prev.map(issue => {
          if (issue.id !== issueId) return issue;

          return {
            ...issue,
            vote_score: (issue.vote_score || 0) + voteDifference,
            total_votes: (issue.total_votes || 0) + (previousVote === 0 ? 1 : 0),
            userVote: voteValue
          };
        })
      );

      setUserVotes(prev => ({
        ...prev,
        [issueId]: voteValue
      }));

      const response = await fetch(`${API_BASE_URL}/issues/${issueId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ voteValue }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to cast vote");
      }

      showSnackbar(
        voteValue === 1 ? "👍 Issue upvoted!" : voteValue === -1 ? "👎 Issue downvoted!" : "🔄 Vote removed!",
        "success"
      );

    } catch (err) {
      console.error("Vote error:", err);
      showSnackbar(`❌ ${err.message}`, "error");
      
      fetchUserVotes();
      fetchIssues(1, false);
    }
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

  const getStatusBadge = (status) => {
    switch (status) {
      case "resolved":
        return <span className="status-badge resolved">✅ Resolved</span>;
      case "assigned":
      case "in_progress":
        return <span className="status-badge in-progress">🔄 In Progress</span>;
      case "pending":
        return <span className="status-badge pending">⏳ Pending</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Recently";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const openImage = (photoUrl) => {
    window.open(photoUrl, '_blank');
  };

  return (
    <div className="citizen-dashboard">
      <Navbar loggedIn={true} />
      
      {/* Hero Stats Section */}
      <div className="dashboard-hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">Welcome, {user.full_name || "Citizen"}! 👋</h1>
          <p className="hero-subtitle">Track and vote on road issues in your community</p>
          
          <div className="quick-stats">
            <div className="stat-item">
              <span className="stat-number">{stats.total}</span>
              <span className="stat-label">Total Issues</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.pending}</span>
              <span className="stat-label">Pending</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.assigned}</span>
              <span className="stat-label">In Progress</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.resolved}</span>
              <span className="stat-label">Resolved</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        <div className="content-header">
          <h2 className="section-title">📋 Live Issues Feed</h2>
          <button 
            className="report-button"
            onClick={() => navigate("/report")}
          >
            + Report New Issue
          </button>
        </div>

        {error && <div className="dashboard-error">{error}</div>}

        {/* Issues Feed */}
        <div className="issues-feed">
          {loading && issues.length === 0 ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading issues...</p>
            </div>
          ) : (
            <>
              {issues.map((issue, index) => {
                const userVote = issue.userVote || 0;
                
                return (
                  <div
                    key={issue.id}
                    className="issue-card"
                    ref={index === issues.length - 1 ? lastIssueRef : null}
                  >
                    <div className="issue-header">
                      <div className="issue-meta">
                        {getStatusBadge(issue.status)}
                        <span className="issue-id">#{issue.id.substring(0, 6)}</span>
                        <span className="issue-date">{formatDate(issue.created_at)}</span>
                      </div>
                      <div className="issue-weight">
                        ⚠️ Priority: <span className={issue.weight > 1 ? "high-priority" : ""}>
                          {issue.weight || 1}
                        </span>
                      </div>
                    </div>

                    <div className="issue-body">
                      {/* Photo Gallery - Fixed with no external dependencies */}
                      {issue.photos && issue.photos.length > 0 ? (
                        <div className="issue-photos">
                          <div className="photo-gallery">
                            {issue.photos.slice(0, 4).map((photo, photoIndex) => (
                              <div 
                                key={photoIndex} 
                                className="photo-thumbnail"
                                onClick={() => openImage(photo)}
                              >
                                <img 
                                  src={photo} 
                                  alt={`Issue ${issue.id.substring(0, 6)}`} 
                                  loading="lazy"
                                  onError={(e) => {
                                    // Hide broken image and show CSS fallback
                                    e.target.style.display = 'none';
                                    e.target.parentElement.classList.add('broken-image');
                                  }}
                                />
                              </div>
                            ))}
                            {issue.photos.length > 4 && (
                              <div className="photo-more" onClick={() => openImage(issue.photos[4])}>
                                +{issue.photos.length - 4}
                              </div>
                            )}
                          </div>
                          <span className="photo-count">
                            📸 {issue.photo_count || issue.photos.length} photo{issue.photos.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      ) : (
                        <div className="no-photo-placeholder">
                          <span className="no-photo-icon">📷</span>
                          <span className="no-photo-text">No photo uploaded</span>
                        </div>
                      )}

                      <p className="issue-description">
                        {issue.description || "No description provided"}
                      </p>
                      
                      {issue.location && (
                        <div className="issue-location">
                          📍 {typeof issue.location === 'string' 
                            ? issue.location.substring(0, 30) + '...' 
                            : 'Location pinned'}
                        </div>
                      )}
                    </div>

                    <div className="issue-footer">
                      <div className="vote-section">
                        <button
                          className={`vote-button upvote ${userVote === 1 ? 'active' : ''}`}
                          onClick={() => handleVote(issue.id, 1)}
                          disabled={loading}
                        >
                          👍 <span className="vote-count">+1</span>
                        </button>
                        <button
                          className={`vote-button downvote ${userVote === -1 ? 'active' : ''}`}
                          onClick={() => handleVote(issue.id, -1)}
                          disabled={loading}
                        >
                          👎 <span className="vote-count">-1</span>
                        </button>
                        <span className={`vote-score ${issue.vote_score > 0 ? 'positive' : issue.vote_score < 0 ? 'negative' : 'zero'}`}>
                          Score: {issue.vote_score || 0}
                        </span>
                        <span className="total-votes">
                          ({issue.total_votes || 0} vote{issue.total_votes !== 1 ? 's' : ''})
                        </span>
                      </div>
                      
                      {issue.ambulance_id && (
                        <div className="assigned-info">
                          🚑 Assigned to ambulance
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {refreshing && (
                <div className="loading-more">
                  <div className="loading-spinner small"></div>
                  <span>Loading more issues...</span>
                </div>
              )}

              {!hasMore && issues.length > 0 && (
                <div className="end-message">
                  <span>🎉 You've seen all issues</span>
                </div>
              )}

              {!loading && issues.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <h3>No issues found</h3>
                  <p>Be the first to report a road issue in your area!</p>
                  <button 
                    className="empty-report-button"
                    onClick={() => navigate("/report-issue")}
                  >
                    Report an Issue
                  </button>
                </div>
              )}
            </>
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