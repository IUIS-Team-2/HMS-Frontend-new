import React, { useState } from 'react';
import { useAuth } from '../App';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    const res = login(username, password);
    if (!res.success) setError(res.error);
    setLoading(false);
  };

  const demoFill = (u, p) => { setUsername(u); setPassword(p); setError(''); };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0c1c3d 0%, #1a3a8f 60%, #1e40af 100%)',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      {/* Card */}
      <div style={{
        background: '#fff', borderRadius: 20, padding: '44px 40px',
        width: 420, boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Top accent */}
        <div style={{ position:'absolute', top:0, left:0, right:0, height:5, background:'linear-gradient(90deg,#1e40af,#3b82f6,#1e40af)' }} />

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{
            display:'inline-flex', alignItems:'center', justifyContent:'center',
            width:60, height:60, borderRadius:16, background:'#eff6ff',
            fontSize:26, marginBottom:12,
          }}>🏥</div>
          <div style={{ fontSize:22, fontWeight:800, color:'#0f2252', letterSpacing:'-0.5px' }}>Sangi Hospital</div>
          <div style={{ fontSize:12, color:'#6b7280', marginTop:3, textTransform:'uppercase', letterSpacing:'0.1em' }}>IPD Management Portal</div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:5 }}>Username</label>
            <input
              value={username} onChange={e=>setUsername(e.target.value)}
              placeholder="Enter your username" autoComplete="username"
              style={{
                width:'100%', padding:'10px 14px', border:'1.5px solid #e5e7eb',
                borderRadius:10, fontSize:14, boxSizing:'border-box',
                outline:'none', transition:'border-color 0.2s',
              }}
              onFocus={e=>e.target.style.borderColor='#3b82f6'}
              onBlur={e=>e.target.style.borderColor='#e5e7eb'}
            />
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:5 }}>Password</label>
            <input
              type="password" value={password} onChange={e=>setPassword(e.target.value)}
              placeholder="Enter your password" autoComplete="current-password"
              style={{
                width:'100%', padding:'10px 14px', border:'1.5px solid #e5e7eb',
                borderRadius:10, fontSize:14, boxSizing:'border-box', outline:'none',
              }}
              onFocus={e=>e.target.style.borderColor='#3b82f6'}
              onBlur={e=>e.target.style.borderColor='#e5e7eb'}
            />
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

        {/* Demo credentials */}
        <div style={{ marginTop:24, padding:'16px', background:'#f8fafc', borderRadius:10, border:'1px solid #e5e7eb' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#6b7280', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.08em' }}>Demo Credentials</div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {[
              { label:'Super Admin', u:'superadmin', p:'admin123' },
              { label:'Admin · Laxmi Nagar', u:'admin.laxmi', p:'laxmi123' },
              { label:'Admin · Raya', u:'admin.raya', p:'raya123' },
              { label:'Employee · Billing', u:'billing.laxmi', p:'bill123' },
              { label:'Management Admin', u:'mgmt_admin', p:'mgmt123' },
            ].map(d => (
              <button key={d.u} onClick={() => demoFill(d.u, d.p)} style={{
                display:'flex', justifyContent:'space-between', alignItems:'center',
                background:'#fff', border:'1px solid #e5e7eb', borderRadius:7,
                padding:'6px 12px', cursor:'pointer', fontSize:12, color:'#374151',
              }}>
                <span style={{ fontWeight:500 }}>{d.label}</span>
                <span style={{ color:'#9ca3af', fontFamily:'monospace' }}>{d.u}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}