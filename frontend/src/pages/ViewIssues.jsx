import { useEffect, useState } from "react";
import api from "../services/api.js";
import IssueCard from "../components/IssueCard.jsx";

export default function ViewIssues() {
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    api.get("/reports").then(res => setIssues(res.data));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>View Issues</h1>
      {issues.map(issue => (
        <IssueCard key={issue.id} issue={issue} />
      ))}
    </div>
  );
}
