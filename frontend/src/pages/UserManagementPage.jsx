import { useState } from "react";
import { USERS } from "../data/constants";

const DEFAULT_USERS = [
  { id:"superadmin", name:"Super Admin", password:"super123", role:"superadmin", locations:["laxmi"] },
  { id:"admin_laxmi", name:"Admin Lakshmi Nagar", password:"laxmi123", role:"admin", locations:["laxmi"] },
  { id:"admin_raya", name:"Admin Raya", password:"raya123", role:"admin", locations:["raya"] },
];

function getUsers(){
  try { const u = sessionStorage.getItem("sangi_users"); return u ? JSON.parse(u) : DEFAULT_USERS; }
  catch { return DEFAULT_USERS; }
}

export function getUsersFromStorage(){ return getUsers(); }

const dark = {
  bg:"#0B1929", card:"#0F2237", cardBorder:"rgba(255,255,255,0.07)",
  input:"#0B1929", inputBorder:"rgba(255,255,255,0.1)",
  label:"rgba(255,255,255,0.4)", text:"#fff", textMuted:"rgba(255,255,255,0.55)",
  accent:"#38BDF8", accentDeep:"#0284C7", green:"#10B981", purple:"#A78BFA",
  divider:"rgba(255,255,255,0.06)",
};

function LockScreen({ onUnlock }) {
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [err, setErr] = useState("");
  const [shake, setShake] = useState(false);

  const handleUnlock = () => {
    const users = getUsers();
    const superUser = users.find(u => u.role === "superadmin");
    if (pin === superUser?.password) {
      onUnlock();
    } else {
      setErr("Incorrect password. Access denied.");
      setShake(true);
      setPin("");
      setTimeout(() => setShake(false), 600);
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:dark.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"DM Sans,sans-serif" }}>
      <style>{`
        @keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
      <div style={{ width:"100%", maxWidth:400, animation:"fadeUp 0.4s ease both" }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ width:72, height:72, borderRadius:22, background:"linear-gradient(135deg,#1a3a5c,#0F2237)", border:`1.5px solid ${dark.cardBorder}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", boxShadow:"0 8px 32px rgba(0,0,0,0.4)" }}>
            <span style={{ fontSize:30 }}>🔐</span>
          </div>
          <h2 style={{ color:"#fff", fontSize:20, fontWeight:800, margin:"0 0 6px", letterSpacing:"-0.02em" }}>Restricted Access</h2>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:13, margin:0 }}>Enter your Super Admin password to manage credentials</p>
        </div>
        <div style={{ background:dark.card, border:`1px solid ${dark.cardBorder}`, borderRadius:20, padding:28, boxShadow:"0 8px 40px rgba(0,0,0,0.4)", animation:shake?"shake 0.5s ease":"none" }}>
          <div style={{ height:2, background:`linear-gradient(90deg,${dark.purple},${dark.accent})`, borderRadius:2, marginBottom:24 }} />
          <label style={{ display:"block", fontSize:11, fontWeight:700, color:dark.label, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>Super Admin Password</label>
          <div style={{ position:"relative", marginBottom:16 }}>
            <input type={showPin?"text":"password"} value={pin} onChange={e => { setPin(e.target.value); setErr(""); }} onKeyDown={e => e.key==="Enter" && handleUnlock()} placeholder="Enter your password..." autoFocus
              style={{ width:"100%", padding:"12px 48px 12px 14px", borderRadius:10, fontSize:14, color:dark.text, background:dark.input, border:`1.5px solid ${err?"#F87171":dark.inputBorder}`, outline:"none", boxSizing:"border-box", fontFamily:"DM Sans,sans-serif" }}
            />
            <button onClick={() => setShowPin(p=>!p)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:dark.label, fontSize:11, fontWeight:700 }}>
              {showPin?"HIDE":"SHOW"}
            </button>
          </div>
          {err && (
            <div style={{ padding:"10px 14px", borderRadius:8, background:"rgba(220,38,38,0.1)", border:"1px solid rgba(220,38,38,0.2)", color:"#F87171", fontSize:13, marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
              <span>⚠</span> {err}
            </div>
          )}
          <button onClick={handleUnlock} style={{ width:"100%", padding:"12px", borderRadius:12, border:"none", cursor:"pointer", background:`linear-gradient(135deg,#7C3AED,${dark.accent})`, color:"#fff", fontFamily:"DM Sans,sans-serif", fontWeight:700, fontSize:14, boxShadow:"0 4px 16px rgba(124,58,237,0.3)" }}>
            Unlock Credentials →
          </button>
          <div style={{ textAlign:"center", marginTop:16, fontSize:12, color:"rgba(255,255,255,0.2)" }}>This action will be logged for security purposes</div>
        </div>
      </div>
    </div>
  );
}

function UserCard({ user, onSave, index }) {
  const [form, setForm] = useState({ name:user.name, id:user.id, password:user.password });
  const [showPass, setShowPass] = useState(false);
  const [saved, setSaved] = useState(false);
  const [focused, setFocused] = useState(null);
  const set = k => e => setForm(p => ({ ...p, [k]:e.target.value }));
  const isSuper = user.role === "superadmin";
  const isLaxmi = user.locations[0] === "laxmi";
  const accent = isSuper ? dark.purple : isLaxmi ? dark.accent : dark.green;
  const branchLabel = isSuper ? "Super Admin" : isLaxmi ? "Lakshmi Nagar" : "Raya";
  const roleLabel = isSuper ? "SUPERADMIN" : "BRANCH ADMIN";
  const handleSave = () => {
    if (!form.name.trim() || !form.id.trim() || !form.password.trim()) return;
    onSave(user.id, form); setSaved(true); setTimeout(() => setSaved(false), 2500);
  };
  const fields = [
    { label:"Display Name", key:"name", type:"text", placeholder:"Full name" },
    { label:"User ID / Login", key:"id", type:"text", placeholder:"Login username" },
    { label:"Password", key:"password", type:showPass?"text":"password", placeholder:"••••••••" },
  ];
  return (
    <div style={{ background:dark.card, border:`1px solid ${dark.cardBorder}`, borderRadius:20, overflow:"hidden", boxShadow:"0 4px 24px rgba(0,0,0,0.3)", animation:`fadeUp 0.4s ease ${index*0.1}s both` }}>
      <div style={{ height:3, background:`linear-gradient(90deg,${accent},transparent)` }} />
      <div style={{ padding:"22px 24px 18px", borderBottom:`1px solid ${dark.divider}`, display:"flex", alignItems:"center", gap:14 }}>
        <div style={{ width:46, height:46, borderRadius:14, background:`linear-gradient(135deg,${accent}22,${accent}44)`, border:`1.5px solid ${accent}55`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:800, color:accent, flexShrink:0 }}>
          {form.name.charAt(0)}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:700, color:dark.text }}>{branchLabel}</div>
          <div style={{ fontSize:12, color:dark.textMuted, marginTop:3 }}>{isSuper?"Full portal access":`Access to ${branchLabel} branch`}</div>
        </div>
        <div style={{ padding:"4px 10px", borderRadius:20, background:`${accent}18`, border:`1px solid ${accent}33`, fontSize:10, fontWeight:800, color:accent, letterSpacing:"0.08em" }}>{roleLabel}</div>
      </div>
      <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:14 }}>
        {fields.map(({ label, key, type, placeholder }) => (
          <div key={key}>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:dark.label, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>{label}</label>
            <div style={{ position:"relative" }}>
              <input type={type} value={form[key]} onChange={set(key)} placeholder={placeholder} onFocus={() => setFocused(key)} onBlur={() => setFocused(null)}
                style={{ width:"100%", padding:key==="password"?"10px 56px 10px 14px":"10px 14px", borderRadius:10, fontSize:14, color:dark.text, background:dark.input, border:`1.5px solid ${focused===key?accent+"66":dark.inputBorder}`, outline:"none", boxSizing:"border-box", fontFamily:"DM Sans,sans-serif", transition:"border-color 0.2s", boxShadow:focused===key?`0 0 0 3px ${accent}15`:"none" }}
              />
              {key==="password" && <button onClick={() => setShowPass(p=>!p)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:dark.label, fontSize:11, fontWeight:600 }}>{showPass?"HIDE":"SHOW"}</button>}
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding:"0 24px 24px" }}>
        <button onClick={handleSave} style={{ width:"100%", padding:"12px", borderRadius:12, border:"none", cursor:"pointer", background:saved?"linear-gradient(135deg,#059669,#10B981)":`linear-gradient(135deg,${isSuper?"#7C3AED":isLaxmi?dark.accentDeep:"#059669"},${accent})`, color:"#fff", fontFamily:"DM Sans,sans-serif", fontWeight:700, fontSize:14, transition:"all 0.3s" }}>
          {saved?"✓ Saved Successfully":"Save Changes"}
        </button>
      </div>
    </div>
  );
}

export default function UserManagementPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [users, setUsers] = useState(getUsers);

  if (!unlocked) return <LockScreen onUnlock={() => setUnlocked(true)} />;

  const handleSave = (originalId, form) => {
    setUsers(prev => {
      const updated = prev.map(u => u.id===originalId ? {...u,...form} : u);
      sessionStorage.setItem("sangi_users", JSON.stringify(updated));
      return updated;
    });
  };
  const handleReset = () => {
    if (!window.confirm("Reset all users to default credentials?")) return;
    sessionStorage.removeItem("sangi_users"); setUsers(DEFAULT_USERS);
  };

  return (
    <div style={{ minHeight:"100vh", background:dark.bg, padding:"0 0 80px", fontFamily:"DM Sans,sans-serif" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ background:"linear-gradient(135deg,#0F2237 0%,#0B1929 60%,#091520 100%)", borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"36px 44px 32px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-40, right:120, width:180, height:180, borderRadius:"50%", background:"rgba(56,189,248,0.04)", border:"1px solid rgba(56,189,248,0.08)", pointerEvents:"none" }} />
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", position:"relative" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
              <span style={{ fontSize:12, color:"rgba(255,255,255,0.3)" }}>Super Admin</span>
              <span style={{ color:"rgba(255,255,255,0.2)" }}>›</span>
              <span style={{ fontSize:12, color:dark.accent, fontWeight:600 }}>User Management</span>
            </div>
            <h1 style={{ fontSize:26, fontWeight:800, color:"#fff", margin:"0 0 6px", letterSpacing:"-0.02em" }}>Portal Credentials</h1>
            <p style={{ fontSize:14, color:"rgba(255,255,255,0.45)", margin:0 }}>Manage login access and credentials for all Sangi Hospital IPD staff</p>
            <div style={{ display:"flex", gap:10, marginTop:20 }}>
              {[
                { icon:"👥", label:`${users.length} Total Users`, color:"rgba(56,189,248,0.15)", border:"rgba(56,189,248,0.25)", text:dark.accent },
                { icon:"🏥", label:`${users.filter(u=>u.role==="admin").length} Branch Admins`, color:"rgba(16,185,129,0.12)", border:"rgba(16,185,129,0.25)", text:dark.green },
                { icon:"🔐", label:`${users.filter(u=>u.role==="superadmin").length} Super Admin`, color:"rgba(167,139,250,0.12)", border:"rgba(167,139,250,0.25)", text:dark.purple },
              ].map(({ icon, label, color, border, text }) => (
                <div key={label} style={{ padding:"6px 14px", borderRadius:30, background:color, border:`1px solid ${border}`, fontSize:12, fontWeight:600, color:text, display:"flex", alignItems:"center", gap:6 }}>
                  <span>{icon}</span>{label}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display:"flex", gap:10, marginTop:8 }}>
            <button onClick={() => setUnlocked(false)} style={{ padding:"9px 18px", borderRadius:10, cursor:"pointer", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.5)", fontSize:13, fontWeight:600, fontFamily:"DM Sans,sans-serif" }}>
              🔒 Lock
            </button>
            <button onClick={handleReset} style={{ padding:"9px 18px", borderRadius:10, cursor:"pointer", background:"rgba(220,38,38,0.1)", border:"1px solid rgba(220,38,38,0.25)", color:"#F87171", fontSize:13, fontWeight:600, fontFamily:"DM Sans,sans-serif" }}>
              ↺ Reset Defaults
            </button>
          </div>
        </div>
      </div>
      <div style={{ padding:"32px 44px 0" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:20, marginBottom:28 }}>
          {users.map((u,i) => <UserCard key={u.id} user={u} onSave={handleSave} index={i} />)}
        </div>
        <div style={{ padding:"14px 20px", borderRadius:12, background:"rgba(217,119,6,0.08)", border:"1px solid rgba(217,119,6,0.2)", fontSize:13, color:"#FCD34D", display:"flex", alignItems:"center", gap:10 }}>
          <span>⚠</span> Changes take effect on next login. Keep credentials safe — there is no password recovery.
        </div>
      </div>
    </div>
  );
}
