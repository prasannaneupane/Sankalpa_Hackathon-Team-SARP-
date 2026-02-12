import { useState } from "react";
import "./CitizenFeedbackModal.css";

export default function CitizenFeedbackModal({ 
  isOpen, 
  onClose, 
  issueId, 
  resolutionPhoto,
  onSubmit 
}) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("❌ Image size should be less than 5MB");
        return;
      }
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      let afterPhotoUrl = null;
      if (selectedImage) {
        afterPhotoUrl = await convertToBase64(selectedImage);
      }

      await onSubmit({
        rating: rating,
        after_photo_url: afterPhotoUrl || resolutionPhoto
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="feedback-modal-overlay">
      <div className="feedback-modal-container">
        <div className="feedback-modal-header">
          <h2 className="feedback-modal-title">⭐ Rate Ambulance Service</h2>
          <button className="feedback-modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="feedback-modal-body">
            <div className="resolution-photo-section">
              <label className="feedback-label">After Repair Photo</label>
              <div className="resolution-photo">
                <img 
                  src={resolutionPhoto} 
                  alt="Repaired issue" 
                  onClick={() => window.open(resolutionPhoto, '_blank')}
                />
              </div>
            </div>

            <div className="feedback-section">
              <label className="feedback-label">Your Rating *</label>
              <div className="star-rating-container">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`star ${star <= (hoverRating || rating) ? 'active' : ''}`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    ★
                  </span>
                ))}
                <span className="rating-text">
                  {rating === 1 && 'Poor'}
                  {rating === 2 && 'Fair'}
                  {rating === 3 && 'Good'}
                  {rating === 4 && 'Very Good'}
                  {rating === 5 && 'Excellent'}
                </span>
              </div>
            </div>

            <div className="feedback-section">
              <label className="feedback-label">
                Upload Your After Photo (Optional)
              </label>
              <div className="photo-upload-area">
                <input
                  type="file"
                  id="feedback-image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="file-input"
                />
                <label htmlFor="feedback-image" className="upload-label">
                  <span className="upload-icon">📸</span>
                  <span className="upload-text">Click to upload photo</span>
                  <span className="upload-hint">Show the repaired issue</span>
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

            <div className="feedback-note">
              <span className="note-icon">ℹ️</span>
              <span className="note-text">
                Your feedback helps us improve ambulance services. 
                RDO will verify the repair quality.
              </span>
            </div>
          </div>

          <div className="feedback-modal-footer">
            <button type="button" className="feedback-cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="feedback-submit-btn"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}