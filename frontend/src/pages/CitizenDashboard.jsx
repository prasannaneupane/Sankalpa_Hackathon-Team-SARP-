import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import API_BASE_URL from "../config";
import { getLocationPreview } from '../utils/locationUtils';
import CitizenFeedbackModal from "../components/CitizenFeedbackModal";
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
  
  // Feedback state
  const [selectedIssueForFeedback, setSelectedIssueForFeedback] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  
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

  // ============ FEEDBACK FUNCTIONS ============

  // Check if user can submit feedback
  const checkFeedbackEligibility = async (issueId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/feedback/issues/${issueId}/feedback/check`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      return data;
    } catch (err) {
      console.error("Error checking feedback eligibility:", err);
      return { canSubmit: false, reason: "Unable to check feedback eligibility" };
    }
  };

  // Handle feedback button click
  const handleFeedbackClick = async (issue) => {
    const eligibility = await checkFeedbackEligibility(issue.id);
    if (eligibility.canSubmit) {
      setSelectedIssueForFeedback({
        id: issue.id,
        resolutionPhoto: eligibility.resolution_photo
      });
      setShowFeedbackModal(true);
    } else {
      showSnackbar(eligibility.reason || "Feedback already submitted", "info");
    }
  };

  // Handle feedback submission
  const handleFeedbackSubmit = async (feedbackData) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/feedback/issues/${selectedIssueForFeedback.id}/feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(feedbackData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit feedback");
      }

      showSnackbar("✅ Thank you for your feedback!", "success");
      setShowFeedbackModal(false);
      setSelectedIssueForFeedback(null);
      
      // Refresh issues to update UI
      fetchIssues(1, false);
    } catch (err) {
      console.error("Error submitting feedback:", err);
      showSnackbar(`❌ ${err.message}`, "error");
    }
  };

  // ============ VOTE FUNCTIONS ============

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

  // ============ ISSUE FUNCTIONS ============

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
        photos: issue.photos || [],
        photo_count: issue.photo_count || 0,
        first_photo: issue.first_photo || null,
        has_feedback: issue.has_feedback || false // Track if feedback already given
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

  // ============ UTILITY FUNCTIONS ============

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

  const getPriorityClass = (priority) => {
    const p = parseInt(priority) || 1;
    if (p >= 4) return "critical";
    if (p === 3) return "high";
    if (p === 2) return "medium";
    return "low";
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
                        <span className={`priority-badge priority-${getPriorityClass(issue.weight)}`}>
                          P{issue.weight || 1}
                        </span>
                      </div>
                    </div>

                    <div className="issue-body">
                      {/* Photo Gallery */}
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
                          📍 {getLocationPreview(issue.location, 30)}
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
                      
                      <div className="issue-actions">
                        {issue.ambulance_id && (
                          <span className="assigned-info">
                            🚑 Assigned
                          </span>
                        )}
                        
                        {/* Feedback Button for Resolved Issues */}
                        {issue.status === "resolved" && !issue.has_feedback && (
                          <button
                            className="feedback-btn"
                            onClick={() => handleFeedbackClick(issue)}
                          >
                            ⭐ Rate Service
                          </button>
                        )}
                        
                        {issue.status === "resolved" && issue.has_feedback && (
                          <span className="feedback-submitted">
                            ✅ Feedback Submitted
                          </span>
                        )}
                      </div>
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



              {!loading && issues.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <h3>No issues found</h3>
                  <p>Be the first to report a road issue in your area!</p>
                  <button 
                    className="empty-report-button"
                    onClick={() => navigate("/report")}
                  >
                    Report an Issue
                  </button>
                </div>
              )}
            </>
          )}
        </div>
                      {!hasMore && issues.length > 0 && (
                <div className="end-message">
                  <span>🎉 You've seen all issues</span>
                </div>
              )}
      </div>

      {/* Feedback Modal */}
      <CitizenFeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => {
          setShowFeedbackModal(false);
          setSelectedIssueForFeedback(null);
        }}
        issueId={selectedIssueForFeedback?.id}
        resolutionPhoto={selectedIssueForFeedback?.resolutionPhoto}
        onSubmit={handleFeedbackSubmit}
      />

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