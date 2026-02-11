import { useState } from "react";
import "../App.css";

export default function CitizenDashboard() {

  // 1. STATE: Holding form data
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  // 2. STATE: Simulate a database of reports
  const [reports, setReports] = useState([]);

  // Handle Image Selection
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Handle Form Submission
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
      <header>
        <h1>📢 Pothole Reporter</h1>
        <p>Report dangerous potholes in your area.</p>
      </header>

      <form className="report-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>📍 Location</label>
          <textarea
            type="text"
            placeholder="e.g. Main St, near Bus Stop"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>📝 Description (Optional)</label>
          <textarea
            placeholder="e.g. Deep hole, causing traffic jam"
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
          <p className="empty-state">No reports yet. Be the first!</p>
        ) : (
          <div className="reports-grid">
            {reports.map((report) => (
              <div key={report.id} className="report-card">
                <img src={report.image} alt="Pothole" />
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
