import React, { useState } from "react";
import { reportIssue } from "../services/issueService";
import "../global.css"; // Import global styles

const ReportIssue = () => {
    const [formData, setFormData] = useState({
        lat: "",
        lon: "",
        description: "",
        photo_url: "",
    });
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await reportIssue(formData);
            setSuccess(true);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="container">
            <h1>Report a New Issue</h1>
            {success && (
                <p style={{ color: "green" }}>Issue reported successfully!</p>
            )}
            {error && <p style={{ color: "red" }}>Error: {error}</p>}
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    name="lat"
                    placeholder="Latitude"
                    value={formData.lat}
                    onChange={handleChange}
                />
                <input
                    type="text"
                    name="lon"
                    placeholder="Longitude"
                    value={formData.lon}
                    onChange={handleChange}
                />
                <textarea
                    name="description"
                    placeholder="Description"
                    value={formData.description}
                    onChange={handleChange}
                />
                <input
                    type="text"
                    name="photo_url"
                    placeholder="Photo URL"
                    value={formData.photo_url}
                    onChange={handleChange}
                />
                <button type="submit">Submit</button>
            </form>
        </div>
    );
};

export default ReportIssue;