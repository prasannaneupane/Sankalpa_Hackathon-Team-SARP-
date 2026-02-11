import { useState } from "react";

export default function Feedback() {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    alert(`Submitted! Rating: ${rating}, Comment: ${comment}`);
    setRating(0);
    setComment("");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Feedback</h1>
      <input 
        type="number" 
        placeholder="Rating 1-5" 
        value={rating} 
        onChange={e => setRating(e.target.value)} 
      />
      <input 
        type="text" 
        placeholder="Comment" 
        value={comment} 
        onChange={e => setComment(e.target.value)} 
        style={{ marginLeft: 10 }}
      />
      <button onClick={handleSubmit} style={{ marginLeft: 10 }}>Submit</button>
    </div>
  );
}
