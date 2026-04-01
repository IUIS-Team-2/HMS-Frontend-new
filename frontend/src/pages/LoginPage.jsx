import { useState } from "react";
import { T, USERS } from "../data/constants";

export default function LoginPage({ onLogin }) {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    setErr("");
    
    // Validation
    if (!userId.trim()) { 
      setErr("Please enter your User ID"); 
      return; 
    }
    if (!password) { 
      setErr("Please enter your password"); 
      return; 
    }

    // Logic to find user manually by ID/Username
    const user = USERS.find(u => u.id.toLowerCase() === userId.toLowerCase().trim());
    
    if (!user || user.password !== password) { 
      setErr("Invalid User ID or password"); 
      return; 
    }

    setLoading(true);
    // Simulating API delay for a professional feel
    setTimeout(() => { 
      onLogin(user, user.locations[0]); 
    }, 600);
  };

  return (
    <div style={{ minHeight: "100vh", background: T.primary, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        
        {/* Header/Logo Section */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <img 
            src="/logo192.png" 
            alt="Sangi Hospital" 
            style={{ width: 80, height: 80, borderRadius: 20, objectFit: "cover", marginBottom: 14, boxShadow: "0 4px 24px rgba(0,0,0,.3)" }}
          />
          <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>Sangi Hospital</h1>
          <p style={{ color: "rgba(255,255,255,.5)", fontSize: 13, margin: 0 }}>IPD Portal — Login</p>
        </div>

        {/* Login Card */}
        <div style={{ background: "#fff", borderRadius: 20, padding: 32, boxShadow: T.shadowLg }}>
          <h2 style={{ color: T.primary, fontSize: 17, fontWeight: 700, margin: "0 0 22px" }}>Sign in to continue</h2>
          
          {/* User ID Input Field (Replaced Dropdown) */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: T.textLight, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>
              User ID
            </label>
            <input 
              type="text"
              placeholder="Enter your ID..."
              value={userId} 
              onChange={e => { setUserId(e.target.value); setErr(""); }} 
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              style={{ 
                width: "100%", 
                padding: "10px 12px", 
                borderRadius: 10, 
                border: `1.5px solid ${T.border}`, 
                fontSize: 14, 
                color: T.text, 
                background: "#fff", 
                outline: "none", 
                boxSizing: "border-box" 
              }} 
            />
          </div>

          {/* Password Input Field */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: T.textLight, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input 
                type={showPass ? "text" : "password"} 
                placeholder="Enter password..." 
                value={password} 
                onChange={e => { setPassword(e.target.value); setErr(""); }} 
                onKeyDown={e => e.key === "Enter" && handleSubmit()} 
                style={{ 
                  width: "100%", 
                  padding: "10px 40px 10px 12px", 
                  borderRadius: 10, 
                  border: `1.5px solid ${T.border}`, 
                  fontSize: 14, 
                  color: T.text, 
                  outline: "none", 
                  boxSizing: "border-box" 
                }}
              />
              <button 
                type="button"
                onClick={() => setShowPass(p => !p)} 
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: T.textLight, fontSize: 12, padding: 4 }}
              >
                {showPass ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {err && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: T.red, marginBottom: 16 }}>
              {err}
            </div>
          )}

          {/* Submit Button */}
          <button 
            onClick={handleSubmit} 
            disabled={loading} 
            style={{ 
              width: "100%", 
              padding: "12px", 
              borderRadius: 12, 
              background: loading ? T.textLight : T.primary, 
              color: "#fff", 
              fontWeight: 700, 
              fontSize: 15, 
              border: "none", 
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s"
            }}
          >
            {loading ? "Signing in…" : "Sign In →"}
          </button>
        </div>

        {/* Footer */}
        <p style={{ textAlign: "center", color: "rgba(255,255,255,.3)", fontSize: 12, marginTop: 20 }}>
          Sangi Hospital Management System
        </p>
      </div>
    </div>
  );
}