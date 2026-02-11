import { useState } from "react";
import Navbar from "../components/Navbar";

export default function Home() {
  const [showAbout, setShowAbout] = useState(false);

  return (
    <div>
      <Navbar
        loggedIn={false}
        toggleAbout={() => setShowAbout(prev => !prev)}
      />

      <div style={{ padding: 20, textAlign: "center" }}>
        <h1>Welcome to TEAM-SARP</h1>

        {!showAbout && (
          <div>
            <h3>Completed Issues: 5</h3>
            <h3>Ongoing Issues: 3</h3>
            <h3>Delayed Issues: 1</h3>
          </div>
        )}

        {showAbout && (
          <div>
            <h2>About TEAM-SARP</h2>
            <p>
              TEAM-SARP is a Nepal-based platform where citizens
              can report and track community issues efficiently.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
