export default function IssueCard({ issue, handleVote }) {
  return (
    <div style={styles.card}>
      <h3>{issue.title}</h3>
      <p>Status: {issue.status}</p>
      <div style={styles.votes}>
        <button onClick={() => handleVote(issue.id, "up")}>👍 {issue.upvotes}</button>
        <button onClick={() => handleVote(issue.id, "down")}>👎 {issue.downvotes}</button>
      </div>
    </div>
  );
}

const styles = {
  card: { border: "1px solid #ccc", padding: 10, borderRadius: 5 },
  votes: { display: "flex", gap: 10, marginTop: 5 },
};
