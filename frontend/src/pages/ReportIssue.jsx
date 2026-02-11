import { useState } from "react";
import api from "../services/api.js";

export default function ReportIssue() {
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const handleSubmit = async () => {
    try {
      const res = await api.post("/reports", { description, imageUrl });
      alert("Report submitted! ID: " + res.data.id);
      setDescription("");
      setImageUrl("");
    } catch (err) {
      console.error(err);
      alert("Error submitting report");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Report Issue</h1>
      <input 
        type="text" 
        placeholder="Description" 
        value={description} 
        onChange={e => setDescription(e.target.value)} 
      />
      <input 
        type="text" 
        placeholder="Image URL" 
        value={imageUrl} 
        onChange={e => setImageUrl(e.target.value)} 
        style={{ marginLeft: 10 }}
      />
      <button onClick={handleSubmit} style={{ marginLeft: 10 }}>Submit</button>
    </div>
  );
}
