export default function IssueCard({ issue }) {
  return (
    <div style={{ border: "1px solid gray", padding: 10, margin: 10 }}>
      <h3>{issue.description}</h3>
      <img src={issue.imageUrl} alt="issue" width={150} />
      <p>Likes: {issue.likes}</p>
      <p>Status: {issue.status}</p>
    </div>
  );
}
