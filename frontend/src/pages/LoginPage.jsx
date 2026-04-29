import React, { useState } from 'react';
import { apiService, BASE_URL } from "../services/apiService";
import appIcon from '../assets/app_icon.png';

export default function LoginPage({ onLogin }) {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 🌟 Forgot Password States
  const [showForgot, setShowForgot] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: Email, 2: OTP + New Password, 3: Success
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiService.login(username, password);
      sessionStorage.setItem('hms_token', data.access);
      const payload = JSON.parse(atob(data.access.split('.')[1]));

      let frontendBranch = payload.branch;
      if (frontendBranch === "LNM") frontendBranch = "laxmi";
      if (frontendBranch === "RYM") frontendBranch = "raya";
      if (frontendBranch === "ALL") frontendBranch = "all";

      const isGlobalUser =
        payload.access_scope === "all_hospitals" ||
        frontendBranch === "all" ||
        ["superadmin", "office_admin"].includes(payload.role);
      const userLocations = isGlobalUser ? ["laxmi", "raya"] : [frontendBranch];

      const loggedInUser = {
        id: payload.username,
        username: payload.username,
        name: payload.name,
        role: payload.role,
        branch: isGlobalUser ? null : frontendBranch,
        accessScope: isGlobalUser ? "all_hospitals" : "single_hospital",
        locations: userLocations,
      };

      onLogin(loggedInUser, isGlobalUser ? "laxmi" : (frontendBranch || "laxmi"));
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid username or password");
    }
    setLoading(false);
  };

  // 🌟 STEP 1: Send the OTP to the email
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setForgotError('');
    if (!forgotEmail) return setForgotError('Please enter your email.');
    setForgotLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/users/request-reset-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      if (res.ok) {
        setResetStep(2); // Move to OTP entry screen!
      } else {
        const errData = await res.json();
        setForgotError(errData.error || 'Email not found. Please try again.');
      }
    } catch {
      setForgotError('Server error. Please check your connection.');
    }
    setForgotLoading(false);
  };

  // 🌟 STEP 2: Verify OTP and Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotError('');
    if (!otp || !newPassword) return setForgotError('Please fill all fields.');
    setForgotLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/users/verify-reset-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, otp: otp, new_password: newPassword }),
      });
      if (res.ok) {
        setResetStep(3); // Success!
      } else {
        const errData = await res.json();
        setForgotError(errData.error || 'Invalid OTP. Please try again.');
      }
    } catch {
      setForgotError('Server error. Please check your connection.');
    }
    setForgotLoading(false);
  };

  // Resets the forgot password modal back to normal
  const closeForgotModal = () => {
    setShowForgot(false);
    setResetStep(1);
    setForgotEmail('');
    setOtp('');
    setNewPassword('');
    setForgotError('');
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
            <button onClick={closeForgotModal}
              style={{ background:'none', border:'none', color:'#1e40af', cursor:'pointer', fontSize:13, marginBottom:16, padding:0, display:'flex', alignItems:'center', gap:4 }}>
              ← Back to Login
            </button>
            <div style={{ fontSize:17, fontWeight:700, color:'#0f2252', marginBottom:6 }}>
              {resetStep === 1 ? 'Forgot Password' : resetStep === 2 ? 'Enter OTP & New Password' : 'Password Reset Successful'}
            </div>
            
            {/* Step 1: Request OTP */}
            {resetStep === 1 && (
              <form onSubmit={handleRequestOTP}>
                <div style={{ fontSize:13, color:'#6b7280', marginBottom:20 }}>Enter your registered email and we'll send you a secure OTP.</div>
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:5 }}>Email Address</label>
                  <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="Enter your email"
                    style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #e5e7eb', borderRadius:10, fontSize:14, boxSizing:'border-box', outline:'none' }}
                  />
                </div>
                {forgotError && <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', color:'#b91c1c', borderRadius:8, padding:'9px 14px', fontSize:13, marginBottom:14 }}>{forgotError}</div>}
                <button type="submit" disabled={forgotLoading} style={{ width:'100%', padding:'12px', background:'#1e40af', color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:'pointer' }}>
                  {forgotLoading ? 'Sending...' : 'Send OTP'}
                </button>
              </form>
            )}

            {/* Step 2: Enter OTP and New Password */}
            {resetStep === 2 && (
              <form onSubmit={handleResetPassword}>
                <div style={{ fontSize:13, color:'#6b7280', marginBottom:20 }}>We sent an OTP to <strong>{forgotEmail}</strong>. Please enter it below along with your new password.</div>
                
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:5 }}>6-Digit OTP</label>
                  <input type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter OTP" maxLength="6"
                    style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #e5e7eb', borderRadius:10, fontSize:14, boxSizing:'border-box', outline:'none', letterSpacing:'4px', fontWeight:'bold' }}
                  />
                </div>

                <div style={{ marginBottom:14 }}>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:5 }}>New Password</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password"
                    style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #e5e7eb', borderRadius:10, fontSize:14, boxSizing:'border-box', outline:'none' }}
                  />
                </div>

                {forgotError && <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', color:'#b91c1c', borderRadius:8, padding:'9px 14px', fontSize:13, marginBottom:14 }}>{forgotError}</div>}
                <button type="submit" disabled={forgotLoading} style={{ width:'100%', padding:'12px', background:'#1e40af', color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:'pointer' }}>
                  {forgotLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            )}

            {/* Step 3: Success Screen */}
            {resetStep === 3 && (
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
                <div style={{ color: '#166534', fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Your password has been successfully reset!</div>
                <button onClick={closeForgotModal} style={{ width:'100%', padding:'12px', background:'#10b981', color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:'pointer' }}>
                  Return to Login
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:5 }}>Username</label>
                <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Enter your username" autoComplete="username"
                  style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #e5e7eb', borderRadius:10, fontSize:14, boxSizing:'border-box', outline:'none' }}
                />
              </div>

              <div style={{ marginBottom:8 }}>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:5 }}>Password</label>
                <div style={{ position:'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password"
                    style={{ width:'100%', padding:'10px 40px 10px 14px', border:'1.5px solid #e5e7eb', borderRadius:10, fontSize:14, boxSizing:'border-box', outline:'none' }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', padding:0, color:'#9ca3af', display:'flex', alignItems:'center' }}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div style={{ textAlign:'right', marginBottom:18 }}>
                <span onClick={() => setShowForgot(true)} style={{ fontSize:12, color:'#1e40af', cursor:'pointer', fontWeight:600 }}>Forgot Password?</span>
              </div>

              {error && <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', color:'#b91c1c', borderRadius:8, padding:'9px 14px', fontSize:13, marginBottom:14 }}>{error}</div>}

              <button type="submit" disabled={loading || !username || !password}
                style={{ width:'100%', padding:'12px', background: loading ? '#93c5fd' : '#1e40af', color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
