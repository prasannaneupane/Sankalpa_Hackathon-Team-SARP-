import { useState, useEffect } from "react";
import API_BASE_URL from "../config";
import "./AmbulanceFeedbackModal.css";

export default function AmbulanceFeedbackModal({ isOpen, onClose, ambulanceId }) {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalRatings: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (isOpen) {
      fetchFeedback();
      fetchRatingStats();
    }
  }, [isOpen, page]);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/feedback/ambulance/${ambulanceId}/feedback?page=${page}&limit=10`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (page === 1) {
          setFeedback(data.feedbacks || []);
        } else {
          setFeedback(prev => [...prev, ...(data.feedbacks || [])]);
        }
        setHasMore(data.feedbacks?.length === 10);
      }
    } catch (err) {
      console.error("Error fetching feedback:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRatingStats = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/feedback/ambulance/${ambulanceId}/rating`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStats({
          averageRating: data.average_rating || 0,
          totalRatings: data.total_ratings || 0,
          distribution: data.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        });
      }
    } catch (err) {
      console.error("Error fetching rating stats:", err);
    }
  };

    const renderStars = (rating) => {
        const stars = [];
        const roundedRating = Math.round(rating || 0);
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <span key={i} className={`star ${i <= roundedRating ? 'filled' : ''}`}>★</span>
            );
        }
        return stars;
    };

  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hr ago`;
    return `${Math.floor(diffMinutes / 1440)} days ago`;
  };

  if (!isOpen) return null;

  return (
    <div className="feedback-modal-overlay">
      <div className="feedback-modal-container">
        <div className="feedback-modal-header">
          <h2 className="feedback-modal-title">⭐ Your Feedback History</h2>
          <button className="feedback-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="feedback-modal-body">
          {/* Rating Summary */}
          <div className="rating-summary">
            <div className="overall-rating">
              <span className="big-rating">{stats.averageRating.toFixed(1)}</span>
              <span className="max-rating">/5</span>
              <div className="rating-stars">
                {renderStars(Math.round(stats.averageRating))}
              </div>
              <span className="total-ratings">
                Based on {stats.totalRatings} {stats.totalRatings === 1 ? 'review' : 'reviews'}
              </span>
            </div>

            <div className="rating-distribution">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats.distribution[star] || 0;
                const percentage = stats.totalRatings > 0 
                  ? (count / stats.totalRatings * 100).toFixed(0) 
                  : 0;
                
                return (
                  <div key={star} className="distribution-row">
                    <span className="star-label">{star} ★</span>
                    <div className="progress-bar-container">
                      <div 
                        className="progress-bar" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="star-count">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feedback List */}
          <div className="feedback-list">
            <h3 className="feedback-list-title">Recent Reviews</h3>
            
            {loading && page === 1 ? (
              <div className="loading-spinner-small"></div>
            ) : feedback.length === 0 ? (
              <div className="no-feedback">
                <p>No feedback yet</p>
              </div>
            ) : (
              <>
                {feedback.map((item) => (
                  <div key={item.id} className="feedback-item">
                    <div className="feedback-item-header">
                      <div className="feedback-item-rating">
                        <span className="rating-badge">{item.citizen_rating}</span>
                        <div className="stars">
                          {renderStars(item.citizen_rating)}
                        </div>
                      </div>
                      <span className="feedback-item-time">
                        {timeAgo(item.created_at)}
                      </span>
                    </div>

                    {item.comment && (
                      <p className="feedback-item-comment">"{item.comment}"</p>
                    )}

                    <div className="feedback-item-footer">
                      <span className="feedback-item-issue">
                        Issue #{item.issue_id?.substring(0, 6)}
                      </span>
                    </div>
                  </div>
                ))}

                {hasMore && (
                  <button 
                    className="load-more-btn"
                    onClick={() => setPage(p => p + 1)}
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}