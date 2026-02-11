import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";

export default function Home() {
  const [stats, setStats] = useState({ completed: 5, ongoing: 3, delayed: 1 });

  return (
    <div>
      <Navbar loggedIn={false} />

      <div style={styles.container}>
        <h1>Welcome to TEAM-SARP</h1>

        {/* Stats Section */}
        <div style={styles.stats}>
          <div>Completed Issues: {stats.completed}</div>
          <div>Ongoing Issues: {stats.ongoing}</div>
          <div>Delayed Issues: {stats.delayed}</div>
        </div>

        {/* About Section */}
        <div id="about-section" className="hidden" style={styles.about}>
          <h2>About TEAM-SARP</h2>
          <p>
            TEAM-SARP is a Nepal-based platform to track community issues.
            Citizens can report issues, track progress, and interact with
            ongoing projects.
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: 20, textAlign: "center" },
  stats: { margin: "20px 0", display: "flex", justifyContent: "center", gap: "20px" },
  about: { marginTop: 20 },
};
