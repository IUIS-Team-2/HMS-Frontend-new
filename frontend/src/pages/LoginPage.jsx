import React, { useState } from 'react';
import { apiService } from "../services/apiService";
import appIcon from '../assets/app_icon.png';

export default function LoginPage({ onLogin }) {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Call the real Django backend
      const data = await apiService.login(username, password);

      // 2. Save the secure JWT token so the interceptor can use it
      sessionStorage.setItem('hms_token', data.access);

      // 3. Decode the JWT token 
      const payload = JSON.parse(atob(data.access.split('.')[1]));

      // 🌟 THE FIX: Translate backend branch codes to frontend theme words
      let frontendBranch = payload.branch;
      if (frontendBranch === "LNM") frontendBranch = "laxmi";
      if (frontendBranch === "RYM") frontendBranch = "raya";

      const loggedInUser = {
        id: payload.username,
        username: payload.username,
        name: payload.name,
        role: payload.role,
        branch: frontendBranch,       // Now safely "laxmi" or "raya"
        locations: [frontendBranch]   // Now safely "laxmi" or "raya"
      };

      // 4. Send the user into the app safely!
      onLogin(loggedInUser, frontendBranch || "laxmi");

    } catch (err) {
      setError(err.response?.data?.detail || "Invalid username or password");
    }

    setLoading(false);
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setForgotError('');
    if (!forgotEmail) return setForgotError('Please enter your email.');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      if (res.ok) setForgotSent(true);
      else setForgotError('Email not found. Please try again.');
    } catch {
      setForgotSent(true);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0c1c3d 0%, #1a3a8f 60%, #1e40af 100%)',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '44px 40px',
        width: 420, boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:5, background:'linear-gradient(90deg,#1e40af,#3b82f6,#1e40af)' }} />

        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{
            display:'inline-flex', alignItems:'center', justifyContent:'center',
            width:60, height:60, borderRadius:16, background:'#eff6ff',
            fontSize:26, marginBottom:12, overflow:'hidden',
          }}><img src={appIcon} alt="Sangi Hospital" style={{ width:44, height:44, objectFit:'contain' }} /></div>
          <div style={{ fontSize:22, fontWeight:800, color:'#0f2252', letterSpacing:'-0.5px' }}>Sangi Hospital</div>
          <div style={{ fontSize:12, color:'#6b7280', marginTop:3, textTransform:'uppercase', letterSpacing:'0.1em' }}>IPD Management Portal</div>
        </div>

        {showForgot ? (
          <div>
            <button onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail(''); setForgotError(''); }}
              style={{ background:'none', border:'none', color:'#1e40af', cursor:'pointer', fontSize:13, marginBottom:16, padding:0, display:'flex', alignItems:'center', gap:4 }}>
              ← Back to Login
            </button>
            <div style={{ fontSize:17, fontWeight:700, color:'#0f2252', marginBottom:6 }}>Forgot Password</div>
            <div style={{ fontSize:13, color:'#6b7280', marginBottom:20 }}>Enter your registered email and we'll send you a reset link.</div>
            {forgotSent ? (
              <div style={{ background:'#f0fdf4', border:'1px solid #86efac', color:'#166534', borderRadius:8, padding:'12px 14px', fontSize:13 }}>
                ✅ Reset link sent to <strong>{forgotEmail}</strong>. Check your inbox.
              </div>
            ) : (
              <form onSubmit={handleForgot}>
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:5 }}>Email Address</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    placeholder="Enter your email"
                    style={{
                      width:'100%', padding:'10px 14px', border:'1.5px solid #e5e7eb',
                      borderRadius:10, fontSize:14, boxSizing:'border-box', outline:'none',
                    }}
                    onFocus={e=>e.target.style.borderColor='#3b82f6'}
                    onBlur={e=>e.target.style.borderColor='#e5e7eb'}
                  />
                </div>
                {forgotError && (
                  <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', color:'#b91c1c', borderRadius:8, padding:'9px 14px', fontSize:13, marginBottom:14 }}>
                    {forgotError}
                  </div>
                )}
                <button type="submit" style={{
                  width:'100%', padding:'12px', background:'#1e40af', color:'#fff',
                  border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:'pointer',
                }}>
                  Send Reset Link
                </button>
              </form>
            )}
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:5 }}>Username</label>
                <input
                  value={username} onChange={e=>setUsername(e.target.value)}
                  placeholder="Enter your username" autoComplete="username"
                  style={{
                    width:'100%', padding:'10px 14px', border:'1.5px solid #e5e7eb',
                    borderRadius:10, fontSize:14, boxSizing:'border-box', outline:'none',
                  }}
                  onFocus={e=>e.target.style.borderColor='#3b82f6'}
                  onBlur={e=>e.target.style.borderColor='#e5e7eb'}
                />
              </div>

              <div style={{ marginBottom:8 }}>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:5 }}>Password</label>
                <div style={{ position:'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password} onChange={e=>setPassword(e.target.value)}
                    placeholder="Enter your password" autoComplete="current-password"
                    style={{
                      width:'100%', padding:'10px 40px 10px 14px', border:'1.5px solid #e5e7eb',
                      borderRadius:10, fontSize:14, boxSizing:'border-box', outline:'none',
                    }}
                    onFocus={e=>e.target.style.borderColor='#3b82f6'}
                    onBlur={e=>e.target.style.borderColor='#e5e7eb'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                      background:'none', border:'none', cursor:'pointer', padding:0,
                      color:'#9ca3af', display:'flex', alignItems:'center',
                    }}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div style={{ textAlign:'right', marginBottom:18 }}>
                <span
                  onClick={() => setShowForgot(true)}
                  style={{ fontSize:12, color:'#1e40af', cursor:'pointer', fontWeight:600 }}
                >
                  Forgot Password?
                </span>
              </div>

              {error && (
                <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', color:'#b91c1c', borderRadius:8, padding:'9px 14px', fontSize:13, marginBottom:14 }}>
                  {error}
                </div>
              )}

              <button
                type="submit" disabled={loading || !username || !password}
                style={{
                  width:'100%', padding:'12px', background: loading ? '#93c5fd' : '#1e40af',
                  color:'#fff', border:'none', borderRadius:10, fontSize:15,
                  fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer',
                  transition:'background 0.2s', letterSpacing:'0.02em',
                }}
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
