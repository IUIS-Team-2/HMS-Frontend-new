import { useState } from "react";

export default function ForgotPassword({ onBack }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email) return setError("Please enter your email.");
    try {
      // Replace this URL with your actual API endpoint
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) setSent(true);
      else setError("Email not found. Please try again.");
    } catch {
      setError("Something went wrong. Please try again.");
    }
  };

  if (sent) {
    return (
      <div>
        <p>Password reset link sent to <strong>{email}</strong>. Check your inbox.</p>
        <button onClick={onBack}>Back to Login</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Forgot Password</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Enter your registered email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit">Send Reset Link</button>
      </form>
      <button onClick={onBack}>Back to Login</button>
    </div>
  );
}
