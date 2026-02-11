import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import IssueCard from "../components/IssueCard";

export default function CitizenDashboard() {
  const [issues, setIssues] = useState([
    { id: 1, title: "Broken street light", status: "ongoing", upvotes: 2, downvotes: 0 },
    { id: 2, title: "Water leakage in pipeline", status: "completed", upvotes: 5, downvotes: 1 },
  ]);

  const handleVote = (id, type) => {
    setIssues(prev =>
      prev.map(issue =>
        issue.id === id
          ? { ...issue, upvotes: type === "up" ? issue.upvotes + 1 : issue.upvotes, downvotes: type === "down" ? issue.downvotes + 1 : issue.downvotes }
          : issue
      )
    );
  };

  return (
    <div>
      <Navbar loggedIn={true} />
      <div style={styles.container}>
        <h1>Citizen Dashboard</h1>
        <div style={styles.issues}>
          {issues.map(issue => (
            <IssueCard key={issue.id} issue={issue} handleVote={handleVote} />
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: 20 },
  issues: { display: "flex", flexDirection: "column", gap: 15 },
};
