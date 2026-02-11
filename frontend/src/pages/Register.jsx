import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");

  const navigate = useNavigate();

  const handleRegister = () => {
    if (!username || !password) {
      alert("Please fill all fields");
      return;
    }

    const userData = { username, password };

    localStorage.setItem("registeredUser", JSON.stringify(userData));

    alert("Registration successful!");
    navigate("/login");
  };

  return (
    <div style={styles.container}>
      <h1>Register</h1>

      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={styles.input}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={styles.input}
      />
        <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={styles.input}
      />

      <button onClick={handleRegister} style={styles.button}>
        Register
      </button>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    padding: "40px",
  },
  input: {
    padding: "8px",
    width: "250px",
  },
  button: {
    padding: "8px 16px",
  },
};
