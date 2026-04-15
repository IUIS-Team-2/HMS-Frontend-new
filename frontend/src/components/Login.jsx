import { useState } from "react";
import ForgotPassword from "./ForgotPassword";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  if (showForgot) {
    return <ForgotPassword onBack={() => setShowForgot(false)} />;
  }

  const demoCredentials = [
    { role: "Super Admin", username: "superadmin" },
    { role: "Admin · Laxmi Nagar", username: "admin.laxmi" },
    { role: "Admin · Raya", username: "admin.raya" },
    { role: "Employee · Billing", username: "billing.laxmi" },
    { role: "Management Admin", username: "mgmt_admin" },
  ];

  const handleLogin = (e) => {
    e.preventDefault();
    if (onLogin) onLogin({ username, password });
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1a237e 0%, #1565c0 50%, #0d47a1 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Segoe UI', sans-serif"
    }}>
      <div style={{
        background: "white",
        borderRadius: "16px",
        padding: "40px",
        width: "100%",
        maxWidth: "420px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
      }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={{
            width: "64px", height: "64px", borderRadius: "50%",
            background: "#e8eaf6", display: "inline-flex",
            alignItems: "center", justifyContent: "center", fontSize: "28px"
          }}>🏥</div>
          <h2 style={{ color: "#1a237e", margin: "12px 0 4px", fontWeight: 700 }}>Sangi Hospital</h2>
          <p style={{ color: "#888", fontSize: "12px", letterSpacing: "2px", margin: 0 }}>IPD MANAGEMENT PORTAL</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px", color: "#333" }}>Username</label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: "100%", padding: "12px 14px", border: "1.5px solid #ddd",
                borderRadius: "8px", fontSize: "14px", boxSizing: "border-box", outline: "none"
              }}
            />
          </div>

          <div style={{ marginBottom: "8px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px", color: "#333" }}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%", padding: "12px 40px 12px 14px", border: "1.5px solid #ddd",
                  borderRadius: "8px", fontSize: "14px", boxSizing: "border-box", outline: "none"
                }}
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", fontSize: "16px" }}
              >
                {showPassword ? "🙈" : "👁️"}
              </span>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div style={{ textAlign: "right", marginBottom: "20px" }}>
            <span
              onClick={() => setShowForgot(true)}
              style={{ color: "#1565c0", fontSize: "13px", cursor: "pointer", fontWeight: 500 }}
            >
              Forgot Password?
            </span>
          </div>

          <button
            type="submit"
            style={{
              width: "100%", padding: "13px", background: "#1a237e",
              color: "white", border: "none", borderRadius: "8px",
              fontSize: "15px", fontWeight: 600, cursor: "pointer", letterSpacing: "0.5px"
            }}
          >
            Sign In
          </button>
        </form>

        {/* Demo Credentials */}
        <div style={{ marginTop: "24px", background: "#f8f9fa", borderRadius: "10px", padding: "16px" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1.5px", color: "#888", margin: "0 0 10px" }}>DEMO CREDENTIALS</p>
          {demoCredentials.map((cred) => (
            <div
              key={cred.username}
              onClick={() => setUsername(cred.username)}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 10px", borderRadius: "6px", cursor: "pointer",
                marginBottom: "4px", transition: "background 0.2s"
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#e8eaf6"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <span style={{ fontSize: "13px", color: "#333" }}>{cred.role}</span>
              <span style={{ fontSize: "12px", color: "#aaa", fontFamily: "monospace" }}>{cred.username}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
