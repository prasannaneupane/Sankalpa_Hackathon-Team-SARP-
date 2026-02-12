import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "../App.css"; // make sure CSS is imported

export default function ReportIssue() {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [reports, setReports] = useState([]);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedImage || !location) {
      alert("Please provide an image and location!");
      return;
    }

    const newReport = {
      id: Date.now(),
      image: previewUrl,
      location: location,
      desc: description,
      date: new Date().toLocaleDateString()
    };

    setReports([newReport, ...reports]);
    resetForm();
  };

  const resetForm = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setLocation("");
    setDescription("");
  };

  return (
    <div className="app-container">
      <div style={{ padding: "10px 20px", backgroundColor: "#f5f5f5", marginBottom: 20 }}>
  <button
    onClick={() => navigate(-1)} // goes back to previous page
    style={{
      padding: "8px 12px",
      border: "none",
      borderRadius: 6,
      backgroundColor: "#28a745",
      color: "white",
      cursor: "pointer"
    }}
  >
    ← Back
  </button>
</div>

      <header>
        <h1>📢 Report an Issue</h1>
        <p>Submit community issues here.</p>
      </header>

      <form className="report-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>📍 Location</label>
          <input
            type="text"
            placeholder="Enter location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>📝 Description</label>
          <textarea
            placeholder="Describe the issue"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>📸 Upload Photo</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
        </div>

        {previewUrl && (
          <div className="preview-box">
            <img src={previewUrl} alt="Preview" />
          </div>
        )}

        <button type="submit" className="submit-btn">
          🚀 Submit Report
        </button>
      </form>

      <hr />

      <div className="feed-section">
        <h2>Recent Reports ({reports.length})</h2>

        {reports.length === 0 ? (
          <p className="empty-state">No reports yet.</p>
        ) : (
          <div className="reports-grid">
            {reports.map((report) => (
              <div key={report.id} className="report-card">
                <img src={report.image} alt="Issue" />
                <div className="card-content">
                  <h3>{report.location}</h3>
                  <p>{report.desc}</p>
                  <small>{report.date}</small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
