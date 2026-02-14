import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API_BASE_URL from "../config";
import Navbar from "../components/Navbar";
import MapComponent from "../components/MapComponent";
import { formatLocation, extractCoordinates } from '../utils/locationUtils';
import "./MissionView.css";

export default function MissionView() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  // Resolution form states
  const [afterImage, setAfterImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [resolutionComment, setResolutionComment] = useState("");
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    show: false,
    message: "",
    type: "success"
  });

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Fetch issue details
  useEffect(() => {
    const fetchIssueDetails = async () => {
      try {
        if (!id) {
          throw new Error("No issue ID provided");
        }

        const response = await fetch(`${API_BASE_URL}/issues/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch issue details");
        }

        const data = await response.json();
        
        // Verify this issue is assigned to this ambulance
        if (data.ambulance_id !== user.id) {
          showSnackbar("❌ This issue is not assigned to you", "error");
          setTimeout(() => navigate("/ambulance/dashboard"), 2000);
          return;
        }

        // Check if already resolved
        if (data.status === 'resolved') {
          showSnackbar("✅ This issue is already resolved", "info");
          setTimeout(() => navigate("/ambulance/dashboard"), 2000);
          return;
        }

        setIssue(data);
      } catch (err) {
        console.error("Error fetching issue:", err);
        setError(err.message);
        showSnackbar(`❌ ${err.message}`, "error");
      } finally {
        setLoading(false);
      }
    };

    fetchIssueDetails();
  }, [id, token, user.id, navigate]);

  // Handle resolution image selection
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showSnackbar("❌ Image size should be less than 5MB", "error");
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        showSnackbar("❌ Please upload an image file", "error");
        return;
      }
      
      setAfterImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setAfterImage(null);
    setPreviewUrl(null);
  };

  // In MissionView.jsx - handleComplete function
  const handleComplete = async () => {
    if (!afterImage) {
      showSnackbar("❌ Please upload a photo of the repaired issue", "error");
      return;
    }

    if (!resolutionComment.trim()) {
      showSnackbar("❌ Please describe how the issue was resolved", "error");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('image', afterImage); // ✅ Field name must match 'image' (from uploadMiddleware)
      formData.append('comment', resolutionComment.trim());

      console.log(`📤 Resolving issue ${id} with photo:`, afterImage.name);

      const response = await fetch(`${API_BASE_URL}/issues/${id}/resolve`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type - browser sets it with boundary
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to resolve issue");
      }

      showSnackbar("✅ Mission complete! Issue resolved successfully.", "success");
      
      setTimeout(() => {
        navigate("/ambulance/dashboard");
      }, 2000);

    } catch (err) {
      console.error("Error resolving issue:", err);
      showSnackbar(`❌ ${err.message}`, "error");
    } finally {
      setSubmitting(false);
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

  // Get priority class for styling
  const getPriorityClass = (priority) => {
    const p = parseInt(priority) || 1;
    if (p >= 4) return "critical";
    if (p === 3) return "high";
    if (p === 2) return "medium";
    return "low";
  };

  if (loading) {
    return (
      <div className="mission-page">
        <Navbar loggedIn={true} />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading mission details...</p>
        </div>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="mission-page">
        <Navbar loggedIn={true} />
        <div className="error-container">
          <div className="error-icon">❌</div>
          <h2>Mission Not Found</h2>
          <p>{error || "The requested mission could not be found."}</p>
          <button 
            className="back-to-dashboard-btn"
            onClick={() => navigate("/ambulance/dashboard")}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mission-page">
      <Navbar loggedIn={true} />
      
      <div className="mission-container">
        {/* Header */}
        <div className="mission-header">
          <button 
            className="back-button" 
            onClick={() => navigate("/ambulance/dashboard")}
          >
            ← Back to Dashboard
          </button>
          <div className="mission-title-wrapper">
            <h1 className="mission-title">🚑 Active Mission</h1>
            <p className="mission-subtitle">
              Issue #{issue.id?.substring(0, 8) || id.substring(0, 8)}
            </p>
          </div>
          <div className="mission-status">
            <span className={`status-badge ${issue.status}`}>
              {issue.status === 'assigned' ? 'IN PROGRESS' : issue.status}
            </span>
          </div>
        </div>

        <div className="mission-content">
          {/* Left Column - Issue Details */}
          <div className="issue-details-card">
            <h2 className="card-title">📋 Issue Details</h2>
            
            <div className="priority-section">
              <span className={`priority-badge priority-${getPriorityClass(issue.weight)}`}>
                Priority {issue.weight || 1}
              </span>
              <span className="vote-score">
                👍 {issue.vote_score || 0} votes
              </span>
            </div>

            <div className="description-section">
              <h3>Description</h3>
              <p>{issue.description || "No description provided"}</p>
            </div>

            <div className="location-section">
              <h3>📍 Location</h3>
              <p className="location-address">
                {formatLocation(issue.location)}
              </p>
              {(() => {
                const coords = extractCoordinates(issue.location);
                return (
                  <div className="coordinates">
                    <span className="coordinate-badge">
                      Lat: {coords.lat.toFixed(6)}
                    </span>
                    <span className="coordinate-badge">
                      Lng: {coords.lng.toFixed(6)}
                    </span>
                  </div>
                );
              })()}
            </div>

            <div className="meta-section">
              <div className="meta-row">
                <span className="meta-label">Reported By:</span>
                <span className="meta-value">Citizen</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Reported On:</span>
                <span className="meta-value">
                  {issue.created_at ? new Date(issue.created_at).toLocaleString() : 'N/A'}
                </span>
              </div>
              {issue.assigned_at && (
                <div className="meta-row">
                  <span className="meta-label">Assigned At:</span>
                  <span className="meta-value">
                    {new Date(issue.assigned_at).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {issue.photos && issue.photos.length > 0 && (
              <div className="photos-section">
                <h3>📸 Issue Photos</h3>
                <div className="photo-gallery">
                  {issue.photos.map((photo, index) => (
                    <div 
                      key={index} 
                      className="photo-thumbnail"
                      onClick={() => window.open(photo, '_blank')}
                    >
                      <img src={photo} alt={`Issue ${index + 1}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Map & Resolution */}
          <div className="mission-action-card">
            {/* Map Section */}
            <div className="map-section">
              <h2 className="card-title">📍 Location Map</h2>
              <div className="map-container">
                <MapComponent 
                  issues={[issue]} 
                  focusedLocation={{ 
                    lat: issue.lat || 27.7172, 
                    lng: issue.lng || 85.3240 
                  }}
                  height="250px"
                />
              </div>
            </div>

            {/* Resolution Form */}
            <div className="resolution-section">
              <h2 className="card-title">✅ Complete Mission</h2>
              
              <form onSubmit={(e) => e.preventDefault()}>
                <div className="form-group">
                  <label className="form-label">
                    📸 Upload Repaired Issue Photo *
                  </label>
                  <div className="photo-upload-area">
                    <input
                      type="file"
                      id="resolution-image"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="file-input"
                    />
                    <label htmlFor="resolution-image" className="upload-label">
                      <span className="upload-icon">📸</span>
                      <span className="upload-text">Click to upload photo</span>
                      <span className="upload-hint">Show the repaired issue</span>
                    </label>
                  </div>

                  {previewUrl && (
                    <div className="image-preview-container">
                      <img 
                        src={previewUrl} 
                        alt="Resolution preview" 
                        className="image-preview" 
                      />
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={handleRemoveImage}
                      >
                        ×
                      </button>
                    </div>
                  )}

                  <div className="file-name-display">
                    {afterImage ? (
                      <span className="selected-file">
                        ✅ Selected: {afterImage.name}
                      </span>
                    ) : (
                      <span className="no-file">No file chosen</span>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    📝 Resolution Comment *
                  </label>
                  <textarea
                    className="comment-input"
                    placeholder="Describe how the issue was resolved (e.g., pothole filled, road repaired, etc.)"
                    value={resolutionComment}
                    onChange={(e) => setResolutionComment(e.target.value)}
                    rows={4}
                    required
                  />
                  <span className="input-hint">
                    {resolutionComment.length}/300 characters
                  </span>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => navigate("/ambulance/dashboard")}
                  >
                    Cancel Mission
                  </button>
                  <button
                    type="button"
                    className="complete-btn"
                    onClick={handleComplete}
                    disabled={submitting || !afterImage || !resolutionComment.trim()}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner"></span>
                        Processing...
                      </>
                    ) : (
                      <>
                        ✅ Mark as Resolved
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="mission-note">
                <span className="note-icon">⚠️</span>
                <span className="note-text">
                  Once resolved, this issue will be marked as completed and 
                  you'll become available for new missions.
                </span>
              </div>
            </div>
          </div>
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