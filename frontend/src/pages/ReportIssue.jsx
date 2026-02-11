import Navbar from "../components/Navbar";

export default function Report() {
  return (
    <div>
      <Navbar loggedIn={true} />
      <div style={{ padding: 20, textAlign: "center" }}>
        <h1>Report an Issue</h1>
        <p>This is where citizens can report new issues.</p>
        {/* You can add your form here later */}
      </div>
    </div>
  );
}
