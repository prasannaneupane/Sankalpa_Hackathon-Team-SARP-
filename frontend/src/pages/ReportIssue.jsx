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

  // ✅ CORRECT: Send file as FormData to backend
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
      // ✅ Create FormData
      const formData = new FormData();
      formData.append('image', selectedImage);  // Send the actual file
      formData.append('lat', latitude);
      formData.append('lon', longitude);
      formData.append('description', description.trim());
      formData.append('isDuplicate', 'false');
      
      // If duplicate exists
      // formData.append('isDuplicate', 'true');
      // formData.append('masterIssueId', existingIssueId);

      console.log("Sending form data with image:", selectedImage.name);

      // ✅ Send to backend
      const response = await fetch(`${API_BASE_URL}/issues/report`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type - browser will set it with boundary
        },
        body: formData,  // ✅ Send as FormData, not JSON
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit report");
      }

      showSnackbar("✅ Issue reported successfully! Thank you for contributing.", "success");

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

  const resetForm = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setLocation("");
    setDescription("");
    setLatitude(null);
    setLongitude(null);
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
              placeholder="Describe the issue in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              required
            />
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