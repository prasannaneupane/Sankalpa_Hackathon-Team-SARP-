import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  return (
    <nav style={{ padding: 10, borderBottom: "1px solid black" }}>
      <button onClick={() => navigate("/citizen")}>Dashboard</button>
      <button onClick={() => navigate("/citizen/report")} style={{ marginLeft: 10 }}>Report Issue</button>
      <button onClick={() => navigate("/citizen/issues")} style={{ marginLeft: 10 }}>View Issues</button>
      <button onClick={() => navigate("/citizen/feedback")} style={{ marginLeft: 10 }}>Feedback</button>
    </nav>
  );
}
