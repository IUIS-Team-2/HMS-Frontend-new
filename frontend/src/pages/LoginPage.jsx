import React, { useState } from 'react';
import { useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { apiService, BASE_URL } from "../services/apiService";
import appIcon from '../assets/app_icon.png';

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  border: '1.5px solid var(--input-border)',
  borderRadius: 10,
  fontSize: 14,
  boxSizing: 'border-box',
  outline: 'none',
  background: 'var(--input-bg)',
  color: 'var(--text)',
  fontFamily: 'inherit',
};

const labelStyle = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text-mid)',
  marginBottom: 5,
};

const errorBoxStyle = {
  background: 'var(--danger-soft)',
  border: '1px solid var(--danger-border)',
  color: 'var(--danger)',
  borderRadius: 8,
  padding: '9px 14px',
  fontSize: 13,
  marginBottom: 14,
};

const primaryBtnStyle = (disabled) => ({
  width: '100%',
  padding: '12px',
  background: disabled ? 'var(--text-dim)' : 'var(--accent)',
  color: 'var(--text-on-accent)',
  border: 'none',
  borderRadius: 10,
  fontSize: 15,
  fontWeight: 700,
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontFamily: 'inherit',
  transition: 'background-color 0.15s ease',
});

export default function LoginPage({ onLogin }) {
  const [branches, setBranches] = useState(() => {
    try {
      const raw = sessionStorage.getItem("hms_branches");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [showForgot, setShowForgot] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const MAX_OTP_ATTEMPTS = 5;

  useEffect(() => {
    let ignore = false;
    apiService.getHospitalBranches()
      .then((rows) => {
        if (ignore) return;
        const normalized = (Array.isArray(rows) ? rows : []).map((row, index) => ({
          id: row.id ?? row.branch ?? index,
          code: String(row.branch || "").toUpperCase(),
          slug: String(row.slug || row.branch || `branch-${index + 1}`).toLowerCase(),
          name: row.branch_name || row.branch || `Branch ${index + 1}`,
        }));
        setBranches(normalized);
        try { sessionStorage.setItem("hms_branches", JSON.stringify(normalized)); } catch {}
      })
      .catch((e) => console.warn("Branch fetch failed:", e?.message));
    return () => { ignore = true; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const normalizedUsername = String(username || "").trim().toLowerCase();
      const normalizedPassword = String(password || "").trim();
      if (!normalizedUsername) {
        setError("Username is required");
        setLoading(false);
        return;
      }
      if (!normalizedPassword) {
        setError("Password is required");
        setLoading(false);
        return;
      }
      const data = await apiService.login(normalizedUsername, normalizedPassword);
      sessionStorage.setItem('hms_token', data.access);
      // fetch verified user info from server — never trust JWT payload
      const profile = await apiService.getMyProfile();

      let frontendBranch = profile.branch;
      if (frontendBranch === "ALL") {
        frontendBranch = "all";
      } else if (frontendBranch) {
        frontendBranch = branches.find((branch) => branch.code === frontendBranch)?.slug || String(frontendBranch).toLowerCase();
      }

      const isGlobalUser =
        profile.access_scope === "all_hospitals" ||
        frontendBranch === "all" ||
        ["superadmin", "office_admin"].includes(profile.role);
      const allBranchSlugs = branches.map((branch) => branch.slug);
      const userLocations = isGlobalUser ? (allBranchSlugs.length ? allBranchSlugs : ["laxmi", "raya"]) : [frontendBranch];

      const loggedInUser = {
        id: profile.username,
        username: profile.username,
        name: profile.name,
        role: profile.role,
        branchCode: profile.branch,
        branch: isGlobalUser ? null : frontendBranch,
        accessScope: isGlobalUser ? "all_hospitals" : "single_hospital",
        locations: userLocations,
      };

      onLogin(loggedInUser, isGlobalUser ? (userLocations[0] || "laxmi") : (frontendBranch || userLocations[0] || "laxmi"));
    } catch (err) {
      const backendDetail = err.response?.data?.detail;
      if (backendDetail) {
        setError(backendDetail);
      } else {
        const msg = err.message || err.code || "";
        setError(
          msg
            ? `Cannot reach API (${msg}). Check backend is running and CORS allows this origin.`
            : "Login request failed before reaching server. Refresh and retry."
        );
      }
    }
    setLoading(false);
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setForgotError('');
    if (!forgotEmail) return setForgotError('Please enter your email.');
    setForgotLoading(true);

    try {
      const result = await apiService.requestResetOtp(forgotEmail);
      if (result !== undefined) {
        setResetStep(2);
      } else {
        setForgotError('Email not found. Please try again.');
      }
    } catch {
      setForgotError('Server error. Please check your connection.');
    }
    setForgotLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotError('');
    if (otpAttempts >= MAX_OTP_ATTEMPTS) return setForgotError("Too many attempts. Please request a new OTP.");
    if (!otp || !newPassword) return setForgotError("Please fill all fields.");
    setForgotLoading(true);

    try {
      await apiService.verifyResetOtp(forgotEmail, otp, newPassword);
      setResetStep(3);
    } catch {
      setForgotError('Server error. Please check your connection.');
    }
    setForgotLoading(false);
  };

  const closeForgotModal = () => {
    setShowForgot(false);
    setResetStep(1);
    setForgotEmail('');
    setOtp('');
    setNewPassword("");
    setOtpAttempts(0);
    setForgotError('');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'linear-gradient(135deg, var(--accent-strong) 0%, var(--accent) 60%, var(--accent-hover) 100%)',
        fontFamily: 'var(--ui-font-sans)',
        padding: 16,
      }}
    >
      <div
        style={{
          background: 'var(--card)',
          borderRadius: 20,
          padding: '44px 40px',
          width: 420,
          maxWidth: '100%',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative',
          overflow: 'hidden',
          color: 'var(--text)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 5,
            background:
              'linear-gradient(90deg, var(--accent-strong), var(--accent), var(--accent-strong))',
          }}
        />

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 60,
              height: 60,
              borderRadius: 16,
              background: 'var(--accent-soft)',
              marginBottom: 12,
              overflow: 'hidden',
            }}
          >
            <img
              src={appIcon}
              alt="Sangi Hospital"
              style={{ width: 44, height: 44, objectFit: 'contain' }}
            />
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: 'var(--text)',
              letterSpacing: '-0.5px',
            }}
          >
            Sangi Hospital
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              marginTop: 3,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            IPD Management Portal
          </div>
        </div>

        {showForgot ? (
          <div>
            <button
              onClick={closeForgotModal}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent)',
                cursor: 'pointer',
                fontSize: 13,
                marginBottom: 16,
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontFamily: 'inherit',
                fontWeight: 600,
              }}
            >
              ← Back to Login
            </button>
            <div
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: 'var(--text)',
                marginBottom: 6,
              }}
            >
              {resetStep === 1
                ? 'Forgot Password'
                : resetStep === 2
                ? 'Enter OTP & New Password'
                : 'Password Reset Successful'}
            </div>

            {resetStep === 1 && (
              <form onSubmit={handleRequestOTP}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                  Enter your registered email and we'll send you a secure OTP.
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Email Address</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="Enter your email"
                    style={inputStyle}
                  />
                </div>
                {forgotError && <div style={errorBoxStyle}>{forgotError}</div>}
                <button type="submit" disabled={forgotLoading} style={primaryBtnStyle(forgotLoading)}>
                  {forgotLoading ? 'Sending…' : 'Send OTP'}
                </button>
              </form>
            )}

            {resetStep === 2 && (
              <form onSubmit={handleResetPassword}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                  We sent an OTP to <strong>{forgotEmail}</strong>. Please enter it below along with your new password.
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>6-Digit OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter OTP"
                    maxLength="6"
                    style={{ ...inputStyle, letterSpacing: '4px', fontWeight: 'bold' }}
                  />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    style={inputStyle}
                  />
                </div>

                {forgotError && <div style={errorBoxStyle}>{forgotError}</div>}
                <button type="submit" disabled={forgotLoading} style={primaryBtnStyle(forgotLoading)}>
                  {forgotLoading ? 'Resetting…' : 'Reset Password'}
                </button>
              </form>
            )}

            {resetStep === 3 && (
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
                <div
                  style={{
                    color: 'var(--success)',
                    fontSize: 15,
                    fontWeight: 600,
                    marginBottom: 20,
                  }}
                >
                  Your password has been successfully reset!
                </div>
                <button
                  onClick={closeForgotModal}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'var(--success)',
                    color: 'var(--text-on-accent)',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Return to Login
                </button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 8 }}>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  style={{ ...inputStyle, paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showPassword ? <EyeOff size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'right', marginBottom: 18 }}>
              <span
                onClick={() => setShowForgot(true)}
                style={{
                  fontSize: 12,
                  color: 'var(--accent)',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Forgot Password?
              </span>
            </div>

            {error && <div style={errorBoxStyle}>{error}</div>}

            <button
              type="submit"
              disabled={loading || !username || !password}
              style={primaryBtnStyle(loading || !username || !password)}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
