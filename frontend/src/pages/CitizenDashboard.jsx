import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import IssueCard from "../components/IssueCard";

export default function CitizenDashboard() {
  const [issues, setIssues] = useState([
    { id: 1, title: "Broken street light", status: "ongoing", upvotes: 2, downvotes: 0 },
    { id: 2, title: "Water leakage in pipeline", status: "completed", upvotes: 5, downvotes: 1 },
  ]);

  const username = localStorage.getItem("user");

const handleVote = (id, type) => {
  const storedVotes = JSON.parse(localStorage.getItem("votes")) || {};

  if (!storedVotes[id]) {
    storedVotes[id] = {};
  }

  const previousVote = storedVotes[id][username];

  setIssues(prev =>
    prev.map(issue => {
      if (issue.id !== id) return issue;

      let newUpvotes = issue.upvotes;
      let newDownvotes = issue.downvotes;

      // If user already voted the same → do nothing
      if (previousVote === type) {
        return issue;
      }

      // Remove previous vote if exists
      if (previousVote === "up") newUpvotes -= 1;
      if (previousVote === "down") newDownvotes -= 1;

      // Add new vote
      if (type === "up") newUpvotes += 1;
      if (type === "down") newDownvotes += 1;

      // Save new vote
      storedVotes[id][username] = type;
      localStorage.setItem("votes", JSON.stringify(storedVotes));

      return {
        ...issue,
        upvotes: newUpvotes,
        downvotes: newDownvotes
      };
    })
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
