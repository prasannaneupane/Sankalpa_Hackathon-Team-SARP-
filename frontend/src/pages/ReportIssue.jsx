import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config";
import "./ReportIssue.css";

export default function ReportIssue() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Form states
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  // Duplicate detection states
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [nearbyIssue, setNearbyIssue] = useState(null);
  const [pendingFormData, setPendingFormData] = useState(null);
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    show: false,
    message: "",
    type: "success"
  });

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Get current location
  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    setError("");
    
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`)
          .then(res => res.json())
          .then(data => {
            setLocation(data.display_name || `${position.coords.latitude}, ${position.coords.longitude}`);
          })
          .catch(() => {
            setLocation(`${position.coords.latitude}, ${position.coords.longitude}`);
          });
        
        setIsGettingLocation(false);
        showSnackbar("📍 Location detected successfully!", "success");
      },
      (error) => {
        setError("Could not get location. Please enable location services.");
        setIsGettingLocation(false);
      }
    );
  };

  // Handle image selection
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
      
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Check for nearby duplicate issues
  const checkNearbyIssue = async (lat, lon) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/issues/check-nearby?lat=${lat}&lon=${lon}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error("Failed to check nearby issues");
      }
      
      return await response.json();
    } catch (err) {
      console.error("Error checking nearby issue:", err);
      return { nearbyFound: false };
    }
  };

  // Handle form submission - Step 1: Check for duplicates
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedImage) {
      showSnackbar("❌ Please upload a photo of the issue", "error");
      return;
    }

    if (!latitude || !longitude) {
      showSnackbar("❌ Please detect your location first", "error");
      return;
    }

    if (!description.trim()) {
      showSnackbar("❌ Please provide a description", "error");
      return;
    }

    setLoading(true);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('lat', latitude);
      formData.append('lon', longitude);
      formData.append('description', description.trim());

      // Check for nearby issues
      console.log("Checking for nearby issues at:", latitude, longitude);
      const nearbyCheck = await checkNearbyIssue(latitude, longitude);
      
      // If duplicate found, show custom dialog
      if (nearbyCheck.nearbyFound) {
        setNearbyIssue(nearbyCheck.existingIssue);
        setPendingFormData(formData);
        setShowDuplicateDialog(true);
        setLoading(false);
      } else {
        // No duplicate, proceed with submission
        await submitReport(formData, false, null);
      }

    } catch (err) {
      console.error("Error checking nearby issues:", err);
      showSnackbar(`❌ ${err.message}`, "error");
      setLoading(false);
    }
  };

  // Step 2: Submit the report (after duplicate decision)
  const submitReport = async (formData, isDuplicate, masterIssueId) => {
    try {
      // Append duplicate info if needed
      if (isDuplicate) {
        formData.append('isDuplicate', 'true');
        formData.append('masterIssueId', masterIssueId);
      } else {
        formData.append('isDuplicate', 'false');
      }

      console.log("Submitting report...");
      
      const response = await fetch(`${API_BASE_URL}/issues/report`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit report");
      }

      // Show success message
      if (data.status === 'merged') {
        showSnackbar("✅ Your report has been added to the existing issue!", "success");
      } else {
        showSnackbar("✅ New issue reported successfully! Thank you for contributing.", "success");
      }

      resetForm();

      setTimeout(() => {
        navigate("/citizen-dashboard");
      }, 2000);

    } catch (err) {
      console.error("Report error:", err);
      showSnackbar(`❌ ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // Handle duplicate dialog actions
  const handleMergeConfirm = () => {
    setShowDuplicateDialog(false);
    submitReport(pendingFormData, true, nearbyIssue.id);
  };

  const handleMergeReject = () => {
    setShowDuplicateDialog(false);
    submitReport(pendingFormData, false, null);
  };

  const handleMergeCancel = () => {
    setShowDuplicateDialog(false);
    setNearbyIssue(null);
    setPendingFormData(null);
    setLoading(false);
  };

  const resetForm = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setLocation("");
    setDescription("");
    setLatitude(null);
    setLongitude(null);
    setNearbyIssue(null);
    setPendingFormData(null);
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

  return (
    <div className="report-issue-page">
      {/* Header */}
      <div className="report-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 className="report-title">📢 Report a Road Issue</h1>
        <p className="report-subtitle">Help make our roads safer for everyone</p>
      </div>

      <div className="report-container">
        {error && <div className="report-error">{error}</div>}

        <form className="report-form" onSubmit={handleSubmit}>
          {/* Location Section */}
          <div className="form-section">
            <h3 className="section-heading">📍 Location</h3>
            <div className="location-input-group">
              <button
                type="button"
                className={`location-button ${isGettingLocation ? 'loading' : ''}`}
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
              >
                {isGettingLocation ? (
                  <>📍 Detecting location...</>
                ) : (
                  <>📍 Detect My Location</>
                )}
              </button>
              
              {latitude && longitude && (
                <div className="location-coordinates">
                  <span className="coordinate-badge">
                    Lat: {latitude.toFixed(6)}
                  </span>
                  <span className="coordinate-badge">
                    Lon: {longitude.toFixed(6)}
                  </span>
                </div>
              )}
            </div>

            {location && (
              <div className="location-address">
                <strong>Address:</strong> {location}
              </div>
            )}
          </div>

          {/* Description Section */}
          <div className="form-section">
            <h3 className="section-heading">📝 Description</h3>
            <textarea
              className="description-input"
              placeholder="Describe the issue in detail (size, severity, how long it's been there, etc.)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              required
            />
            <span className="input-hint">{description.length}/500 characters</span>
          </div>

          {/* Photo Upload Section */}
          <div className="form-section">
            <h3 className="section-heading">📸 Photo</h3>
            <div className="photo-upload-area">
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                onChange={handleImageChange}
                className="file-input"
              />
              <label htmlFor="image-upload" className="upload-label">
                <span className="upload-icon">📸</span>
                <span className="upload-text">Click to upload photo</span>
                <span className="upload-hint">JPG, PNG up to 5MB</span>
              </label>
            </div>

            {previewUrl && (
              <div className="image-preview-container">
                <img src={previewUrl} alt="Preview" className="image-preview" />
                <button
                  type="button"
                  className="remove-image-btn"
                  onClick={() => {
                    setSelectedImage(null);
                    setPreviewUrl(null);
                  }}
                >
                  ×
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button
              type="submit"
              className="submit-button"
              disabled={loading || !selectedImage || !latitude || !longitude}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Submitting report...
                </>
              ) : (
                <>
                  🚀 Submit Report
                </>
              )}
            </button>
            
            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate("/citizen-dashboard")}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Custom Duplicate Dialog Modal */}
      {showDuplicateDialog && nearbyIssue && (
        <div className="dialog-overlay">
          <div className="dialog-container">
            <div className="dialog-header">
              <span className="dialog-icon">⚠️</span>
              <h2 className="dialog-title">Duplicate Issue Detected</h2>
            </div>
            
            <div className="dialog-body">
              <p className="dialog-message">
                An issue has already been reported near this location.
              </p>
              
              <div className="duplicate-issue-details">
                <div className="detail-row">
                  <span className="detail-label">Issue ID:</span>
                  <span className="detail-value">#{nearbyIssue.id.substring(0, 8)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Description:</span>
                  <span className="detail-value">
                    {nearbyIssue.description?.substring(0, 100) || 'No description'}
                    {nearbyIssue.description?.length > 100 ? '...' : ''}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className={`status-badge ${nearbyIssue.status || 'pending'}`}>
                    {nearbyIssue.status || 'Pending'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Reported:</span>
                  <span className="detail-value">
                    {nearbyIssue.created_at ? new Date(nearbyIssue.created_at).toLocaleDateString() : 'Recently'}
                  </span>
                </div>
              </div>

              <p className="dialog-question">
                Do you want to add your report as an update to the existing issue?
              </p>
            </div>

            <div className="dialog-footer">
              <button 
                className="dialog-btn cancel-btn"
                onClick={handleMergeCancel}
              >
                Cancel
              </button>
              <button 
                className="dialog-btn reject-btn"
                onClick={handleMergeReject}
              >
                No, Create New
              </button>
              <button 
                className="dialog-btn confirm-btn"
                onClick={handleMergeConfirm}
              >
                Yes, Merge
              </button>
            </div>
          </div>
        </div>
      )}

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