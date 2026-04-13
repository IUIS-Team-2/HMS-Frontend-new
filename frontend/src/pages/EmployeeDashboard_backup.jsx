import { useState } from "react";

// ─── Branch colour tokens (mirrors ManagementDashboard) ──────────────────────
const BC = {
  "Laxmi Nagar": { accent: "#38bdf8", dim: "#38bdf822", border: "#38bdf833" },
  Raya:          { accent: "#a78bfa", dim: "#a78bfa22", border: "#a78bfa33" },
  Management:    { accent: "#f59e0b", dim: "#f59e0b22", border: "#f59e0b33" },
};

// ─── Mock DB (replace with your HMSContext / real props) ─────────────────────
const MOCK_EMPLOYEES = {
  "emp-001": {
    id: "emp-001",
    name: "Dr. Anita Rao",
    role: "Doctor",
    branch: "Laxmi Nagar",
    department: "Cardiology",
    email: "anita@sangi.in",
    phone: "+91 98100 00001",
    status: "Active",
    joinDate: "2023-06-15",
    uhid: "EMP-LN-001",
    avatar: "AR",
  },
  "emp-002": {
    id: "emp-002",
    name: "Renu Kapoor",
    role: "Nurse",
    branch: "Raya",
    department: "General Medicine",
    email: "renu@sangi.in",
    phone: "+91 98100 00002",
    status: "Active",
    joinDate: "2024-01-10",
    uhid: "EMP-RY-002",
    avatar: "RK",
  },
};

const MOCK_PATIENTS = {
  "Laxmi Nagar": [
    { id: 1, name: "Ramesh Kumar",  age: 54, gender: "M", dept: "Cardiology",       status: "Admitted",   paymentType: "Cash",     cashAmount: 8500,  cashlessAmount: 0,     cashlessProvider: "",            admitDate: "2026-03-28", uhid: "LN-0041", dischargeSummary: { date:"", expectedDod:"", type:"Normal", diagnosis:"", treatment:"", followUp:"", notes:"", doctorName:"" } },
    { id: 2, name: "Priya Singh",   age: 32, gender: "F", dept: "Orthopedics",      status: "Discharged", paymentType: "Cashless", cashAmount: 0,     cashlessAmount: 12000, cashlessProvider: "Star Health", admitDate: "2026-03-20", uhid: "LN-0042", dischargeSummary: { date:"", expectedDod:"", type:"Normal", diagnosis:"", treatment:"", followUp:"", notes:"", doctorName:"" } },
    { id: 3, name: "Ajay Nair",     age: 67, gender: "M", dept: "Cardiology",       status: "Admitted",   paymentType: "Both",     cashAmount: 3000,  cashlessAmount: 9000,  cashlessProvider: "HDFC ERGO",   admitDate: "2026-04-01", uhid: "LN-0043", dischargeSummary: { date:"", expectedDod:"", type:"Normal", diagnosis:"", treatment:"", followUp:"", notes:"", doctorName:"" } },
  ],
  Raya: [
    { id: 1, name: "Sunita Devi",   age: 45, gender: "F", dept: "General Medicine", status: "Admitted",   paymentType: "Cashless", cashAmount: 0,     cashlessAmount: 5500,  cashlessProvider: "Bajaj Allianz", admitDate: "2026-04-03", uhid: "RY-0011", dischargeSummary: { date:"", expectedDod:"", type:"Normal", diagnosis:"", treatment:"", followUp:"", notes:"", doctorName:"" } },
    { id: 2, name: "Vikram Rao",    age: 38, gender: "M", dept: "General Medicine", status: "Discharged", paymentType: "Cash",     cashAmount: 4200,  cashlessAmount: 0,     cashlessProvider: "",              admitDate: "2026-03-25", uhid: "RY-0012", dischargeSummary: { date:"", expectedDod:"", type:"Normal", diagnosis:"", treatment:"", followUp:"", notes:"", doctorName:"" } },
  ],
  Management: [],
};

const MOCK_DEPARTMENTS = {
  "Laxmi Nagar": [
    { id: 1, name: "Cardiology",   head: "Dr. Sharma", beds: 20, staff: 8 },
    { id: 2, name: "Orthopedics",  head: "Dr. Mehta",  beds: 15, staff: 6 },
  ],
  Raya: [
    { id: 1, name: "General Medicine", head: "Dr. Verma", beds: 30, staff: 12 },
  ],
  Management: [],
};

// ─── Employee-only nav (no Users, no Departments mgmt) ────────────────────────
const NAV = [
  { id: "home",     label: "Home",     icon: "◈" },
  { id: "patients", label: "Patients", icon: "♥" },
  { id: "schedule", label: "Schedule", icon: "⊟" },
  { id: "billing",  label: "Billing",  icon: "₹" },
  { id: "profile",  label: "My Profile", icon: "◎" },
];

const fmt = (n) => "₹" + Number(n).toLocaleString("en-IN");

// ─── Main component ───────────────────────────────────────────────────────────
// Props expected from your App.jsx router:
//   employee : object from MOCK_EMPLOYEES (or real context user)
//   onLogout : function
export default function EmployeeDashboard({ employeeId = "emp-001", onLogout }) {
  const employee = MOCK_EMPLOYEES[employeeId] || MOCK_EMPLOYEES["emp-001"];
  const branch   = employee.branch;
  const accent   = (BC[branch] || BC["Laxmi Nagar"]).accent;

  const [activeTab, setActiveTab] = useState("home");
  const [collapsed, setCollapsed] = useState(false);
  const [notif, setNotif]         = useState(null);

  const toast = (msg, type = "ok") => {
    setNotif({ msg, type });
    setTimeout(() => setNotif(null), 3000);
  };

  // Derived data scoped to employee's branch + department
  const allBranchPatients  = MOCK_PATIENTS[branch]  || [];
  const deptPatients       = allBranchPatients.filter(p => p.dept === employee.department);
  const branchDepts        = MOCK_DEPARTMENTS[branch] || [];
  const myDept             = branchDepts.find(d => d.name === employee.department);

  const admitted  = deptPatients.filter(p => p.status === "Admitted").length;
  const discharged = deptPatients.filter(p => p.status === "Discharged").length;
  const totalCash     = deptPatients.reduce((s, p) => s + (p.cashAmount || 0), 0);
  const totalCashless = deptPatients.reduce((s, p) => s + (p.cashlessAmount || 0), 0);

  // ─── Styles (exact same palette / tokens as ManagementDashboard) ───────────
  const branchBC = BC[branch] || BC["Laxmi Nagar"];
  const c = {
    wrap: { display: "flex", flexDirection: "column", height: "100vh", background: "#0d1117", fontFamily: "'DM Sans','Segoe UI',sans-serif", color: "#e2e8f0", overflow: "hidden" },
    hdr:  { height: 54, background: "#0d1117", borderBottom: "1px solid #161d2e", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", flexShrink: 0, zIndex: 10 },
    body: { display: "flex", flex: 1, overflow: "hidden" },

    // sidebar
    sb:    { width: collapsed ? 52 : 210, background: "#090d14", borderRight: "1px solid #161d2e", display: "flex", flexDirection: "column", transition: "width 0.22s ease", flexShrink: 0, overflow: "hidden" },
    sbTop: { padding: collapsed ? "14px 8px" : "14px 12px", borderBottom: "1px solid #161d2e", flexShrink: 0 },

    // branch pill (read-only for employee — no switcher)
    branchPillSb: {
      display: "flex", alignItems: "center", gap: 8,
      padding: collapsed ? "9px 0" : "9px 11px",
      justifyContent: collapsed ? "center" : "flex-start",
      background: branchBC.dim,
      borderLeft: `2px solid ${branchBC.accent}`,
      borderRadius: 9,
      color: branchBC.accent,
      fontSize: 12, fontWeight: 700,
    },
    bsDot: { width: 7, height: 7, borderRadius: "50%", background: accent, flexShrink: 0 },

    navWrap:    { flex: 1, padding: "10px 0", overflowY: "auto" },
    navSection: { fontSize: 9, fontWeight: 700, color: "#2d3a50", letterSpacing: "0.1em", textTransform: "uppercase", padding: collapsed ? "0" : "0 14px", marginBottom: 5, marginTop: 4, textAlign: collapsed ? "center" : "left" },
    navItem: (active) => ({
      display: "flex", alignItems: "center", gap: 9,
      padding: collapsed ? "10px 0" : "10px 14px",
      justifyContent: collapsed ? "center" : "flex-start",
      cursor: "pointer", fontSize: 12, fontWeight: active ? 600 : 400,
      color: active ? "#f1f5f9" : "#3a4a60",
      background: active ? "#ffffff0a" : "transparent",
      borderLeft: active ? `2px solid ${accent}` : "2px solid transparent",
      transition: "all 0.15s", whiteSpace: "nowrap",
    }),
    navIcon: { fontSize: 14, flexShrink: 0, width: 16, textAlign: "center" },

    sbBot:  { padding: collapsed ? "10px 8px" : "10px 12px", borderTop: "1px solid #161d2e", flexShrink: 0 },
    colBtn: { width: "100%", background: "transparent", border: "1px solid #161d2e", borderRadius: 7, color: "#2d3a50", cursor: "pointer", padding: "6px", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" },

    main: { flex: 1, overflowY: "auto", padding: "22px 26px" },

    // header
    logoRow:  { display: "flex", alignItems: "center", gap: 10 },
    logoIcon: { width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#38bdf8,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "#fff" },
    logoText: { fontSize: 14, fontWeight: 700, color: "#f1f5f9" },
    logoSub:  { fontSize: 9, color: "#2d3a50" },
    hdrRight: { display: "flex", alignItems: "center", gap: 10 },
    roleBadge: { background: `${accent}15`, border: `1px solid ${accent}30`, color: accent, fontSize: 9, fontWeight: 700, padding: "3px 9px", borderRadius: 20, letterSpacing: "0.07em" },
    avatar:   { width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#a78bfa,#38bdf8)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11, color: "#fff" },
    logoutBtn:{ background: "transparent", border: "1px solid #161d2e", color: "#3a4a60", padding: "4px 11px", borderRadius: 7, cursor: "pointer", fontSize: 11 },

    // content
    pgLabel:    { fontSize: 10, fontWeight: 700, color: "#2d3a50", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 },
    branchPill: { display: "inline-flex", alignItems: "center", gap: 5, background: branchBC.dim, border: `1px solid ${branchBC.border}`, color: accent, fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, marginBottom: 18, letterSpacing: "0.04em" },

    statGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 20 },
    statCard: (a) => ({ background: "#0d1117", border: `1px solid ${a || "#161d2e"}`, borderRadius: 11, padding: "14px 16px" }),
    statNum:  (col) => ({ fontSize: 22, fontWeight: 700, color: col || "#f1f5f9", lineHeight: 1.2, marginBottom: 3 }),
    statLabel: { fontSize: 10, color: "#3a4a60", fontWeight: 500 },
    statSub:   { fontSize: 9, color: "#2d3a50", marginTop: 1 },

    card:      { background: "#0d1117", border: "1px solid #161d2e", borderRadius: 13, padding: "16px 18px", marginBottom: 18 },
    cardRow:   { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
    cardTitle: { fontSize: 12, fontWeight: 600, color: "#e2e8f0" },

    tbl: { width: "100%", borderCollapse: "collapse" },
    th:  { textAlign: "left", fontSize: 9, color: "#2d3a50", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "0 9px 9px", borderBottom: "1px solid #161d2e" },
    td:  { padding: "10px 9px", borderBottom: "1px solid #161d2e50", fontSize: 11, color: "#94a3b8", verticalAlign: "middle" },
    badge: (bc) => ({ display: "inline-block", background: bc + "20", color: bc, border: `1px solid ${bc}40`, fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 20, whiteSpace: "nowrap" }),
    cashPill:     { display: "inline-block", background: "#10b98118", color: "#10b981", border: "1px solid #10b98138", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 20 },
    cashlessPill: { display: "inline-block", background: "#f59e0b18", color: "#f59e0b", border: "1px solid #f59e0b38", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 20 },
    dash: { color: "#1f2937", fontSize: 11 },

    // profile card
    profileCard: { background: "#090d14", border: `1px solid ${accent}30`, borderRadius: 13, padding: "22px 20px", marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 18 },
    bigAvatar:   { width: 56, height: 56, borderRadius: "50%", background: `linear-gradient(135deg,${accent},#a78bfa)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18, color: "#fff", flexShrink: 0 },
    profileName: { fontSize: 16, fontWeight: 700, color: "#f1f5f9", marginBottom: 3 },
    profileRole: { fontSize: 11, color: accent, fontWeight: 600, marginBottom: 2 },
    profileMeta: { fontSize: 10, color: "#3a4a60" },
    profileGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px", marginTop: 12 },
    profileField:{ fontSize: 10, color: "#2d3a50", marginBottom: 2 },
    profileVal:  { fontSize: 11, color: "#94a3b8" },

    readOnlyBanner: { background: "#a78bfa10", border: "1px solid #a78bfa30", borderRadius: 8, padding: "8px 14px", marginBottom: 16, fontSize: 10, color: "#a78bfa", fontWeight: 600 },

    notif: (t) => ({ position: "fixed", top: 14, right: 14, background: t === "ok" ? "#052e1c" : "#3b0f05", border: `1px solid ${t === "ok" ? "#10b981" : "#f97316"}`, color: t === "ok" ? "#6ee7b7" : "#fed7aa", padding: "9px 16px", borderRadius: 9, fontSize: 11, fontWeight: 600, zIndex: 999 }),
    empty: { textAlign: "center", padding: "2rem", color: "#2d3a50", fontSize: 12 },
  };

  const BranchHeader = ({ title }) => (
    <div style={{ marginBottom: 18 }}>
      <div style={c.pgLabel}>{title}</div>
      <div style={c.branchPill}><div style={c.bsDot} />{branch}</div>
    </div>
  );

  // ─── HOME ────────────────────────────────────────────────────────────────────
  const renderHome = () => (
    <div>
      <BranchHeader title="Home" />

      {/* Quick identity strip */}
      <div style={c.profileCard}>
        <div style={c.bigAvatar}>{employee.avatar}</div>
        <div style={{ flex: 1 }}>
          <div style={c.profileName}>{employee.name}</div>
          <div style={c.profileRole}>{employee.role}</div>
          <div style={c.profileMeta}>{employee.department} · {branch}</div>
          <div style={c.profileGrid}>
            {[
              ["Email",   employee.email],
              ["Phone",   employee.phone],
              ["Emp ID",  employee.uhid],
              ["Joined",  employee.joinDate],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={c.profileField}>{k}</div>
                <div style={c.profileVal}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats for employee's department */}
      <div style={c.statGrid}>
        {[
          { label: "My Patients",    sub: employee.department,  val: deptPatients.length,  col: accent,     acc: accent + "20" },
          { label: "Admitted",       sub: "Currently",           val: admitted,             col: "#10b981",  acc: "#10b98120" },
          { label: "Discharged",     sub: "All time",            val: discharged,           col: "#6b7280",  acc: "#6b728020" },
          { label: "Dept Beds",      sub: myDept?.head || "—",   val: myDept?.beds ?? "—",  col: "#a78bfa",  acc: "#a78bfa20" },
        ].map((s, i) => (
          <div key={i} style={c.statCard(s.acc)}>
            <div style={c.statNum(s.col)}>{s.val}</div>
            <div style={c.statLabel}>{s.label}</div>
            <div style={c.statSub}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Recent patients preview */}
      <div style={c.card}>
        <div style={c.cardRow}>
          <div style={c.cardTitle}>Recent Patients — {employee.department}</div>
          <button
            style={{ background: `linear-gradient(135deg,${accent},${accent}cc)`, border: "none", color: "#fff", padding: "6px 13px", borderRadius: 7, cursor: "pointer", fontSize: 11, fontWeight: 700 }}
            onClick={() => setActiveTab("patients")}
          >View All</button>
        </div>
        {deptPatients.length === 0
          ? <div style={c.empty}>No patients in {employee.department} yet.</div>
          : (
            <table style={c.tbl}>
              <thead><tr>{["Patient", "UHID", "Status", "Admit Date"].map(h => <th key={h} style={c.th}>{h}</th>)}</tr></thead>
              <tbody>
                {deptPatients.slice(0, 4).map(p => (
                  <tr key={p.id}>
                    <td style={c.td}><strong style={{ color: "#f1f5f9" }}>{p.name}</strong><div style={{ fontSize: 9, color: "#2d3a50" }}>{p.age}y · {p.gender}</div></td>
                    <td style={{ ...c.td, fontFamily: "monospace", fontSize: 10, color: "#2d3a50" }}>{p.uhid}</td>
                    <td style={c.td}><span style={c.badge(p.status === "Admitted" ? "#10b981" : "#6b7280")}>{p.status}</span></td>
                    <td style={{ ...c.td, fontSize: 10, color: "#2d3a50" }}>{p.admitDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </div>
    </div>
  );

  // ─── PATIENTS (read-only, dept-scoped) ───────────────────────────────────────
  const renderPatients = () => (
    <div>
      <BranchHeader title="Patients" />
      <div style={c.readOnlyBanner}>◎ View-only · {employee.department} department · {branch} branch</div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        {[
          { label: "Admitted",  val: admitted,          col: "#10b981", acc: "#10b98120" },
          { label: "Discharged",val: discharged,         col: "#6b7280", acc: "#6b728020" },
          { label: "Cash",      val: fmt(totalCash),     col: "#10b981", acc: "#10b98120" },
          { label: "Cashless",  val: fmt(totalCashless), col: "#a78bfa", acc: "#a78bfa20" },
        ].map((s, i) => (
          <div key={i} style={{ ...c.statCard(s.acc), padding: "10px 14px" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: s.col }}>{s.val}</div>
            <div style={c.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={c.card}>
        {deptPatients.length === 0
          ? <div style={c.empty}>No patients in {employee.department} for {branch}.</div>
          : (
            <table style={c.tbl}>
              <thead>
                <tr>{["Patient / UHID", "Dept", "Date", "Status", "Type", "Cash", "Cashless", "Provider"].map(h => <th key={h} style={c.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {deptPatients.map(p => (
                  <tr key={p.id}>
                    <td style={c.td}>
                      <strong style={{ color: "#f1f5f9", display: "block" }}>{p.name}</strong>
                      <span style={{ fontFamily: "monospace", fontSize: 9, color: "#2d3a50" }}>{p.uhid} · {p.age}y {p.gender}</span>
                    </td>
                    <td style={c.td}>{p.dept}</td>
                    <td style={{ ...c.td, fontSize: 10, color: "#2d3a50" }}>{p.admitDate}</td>
                    <td style={c.td}><span style={c.badge(p.status === "Admitted" ? "#10b981" : "#6b7280")}>{p.status}</span></td>
                    <td style={c.td}><span style={c.badge(p.paymentType === "Cash" ? "#10b981" : p.paymentType === "Cashless" ? "#f59e0b" : "#38bdf8")}>{p.paymentType}</span></td>
                    <td style={c.td}>{p.cashAmount > 0 ? <span style={c.cashPill}>{fmt(p.cashAmount)}</span> : <span style={c.dash}>—</span>}</td>
                    <td style={c.td}>{p.cashlessAmount > 0 ? <span style={c.cashlessPill}>{fmt(p.cashlessAmount)}</span> : <span style={c.dash}>—</span>}</td>
                    <td style={{ ...c.td, fontSize: 10, color: "#3a4a60" }}>{p.cashlessProvider || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </div>
    </div>
  );

  // ─── SCHEDULE (placeholder, same pattern as admin) ───────────────────────────
  const renderSchedule = () => (
    <div>
      <BranchHeader title="Schedule" />
      <div style={{ ...c.card, textAlign: "center", padding: "3rem 2rem" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⊟</div>
        <div style={{ fontSize: 13, color: "#2d3a50" }}>Your shift schedule will appear here.</div>
        <div style={{ fontSize: 10, color: "#1f2937", marginTop: 4 }}>{branch} · {employee.department}</div>
      </div>
    </div>
  );

  // ─── BILLING (read-only summary) ─────────────────────────────────────────────
  const renderBilling = () => (
    <div>
      <BranchHeader title="Billing" />
      <div style={c.readOnlyBanner}>◎ Read-only summary · {employee.department}</div>
      <div style={c.statGrid}>
        {[
          { label: "Cash Collected",  sub: "Direct payments",  val: fmt(totalCash),     col: "#10b981", acc: "#10b98120" },
          { label: "Cashless Claims", sub: "Insurance",        val: fmt(totalCashless), col: "#a78bfa", acc: "#a78bfa20" },
          { label: "Total Revenue",   sub: "Combined",         val: fmt(totalCash + totalCashless), col: "#f59e0b", acc: "#f59e0b20" },
        ].map((s, i) => (
          <div key={i} style={c.statCard(s.acc)}>
            <div style={c.statNum(s.col)}>{s.val}</div>
            <div style={c.statLabel}>{s.label}</div>
            <div style={c.statSub}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div style={c.card}>
        <div style={{ ...c.cardTitle, marginBottom: 14, fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>Revenue Breakdown</div>
        {(() => {
          const total = totalCash + totalCashless;
          const cashPct = total > 0 ? Math.round((totalCash / total) * 100) : 0;
          return (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: "#10b981", fontWeight: 700 }}>Cash {fmt(totalCash)}</span>
                <span style={{ fontSize: 11, color: "#a78bfa", fontWeight: 700 }}>Cashless {fmt(totalCashless)}</span>
              </div>
              <div style={{ height: 7, background: "#161d2e", borderRadius: 7, overflow: "hidden" }}>
                {total > 0 && <div style={{ height: "100%", width: `${cashPct}%`, background: "linear-gradient(90deg,#10b981,#059669)", borderRadius: 7 }} />}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ fontSize: 9, color: "#2d3a50" }}>Cash — {cashPct}%</span>
                <span style={{ fontSize: 9, color: "#2d3a50" }}>Cashless — {100 - cashPct}%</span>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );

  // ─── PROFILE ──────────────────────────────────────────────────────────────────
  const renderProfile = () => (
    <div>
      <BranchHeader title="My Profile" />

      <div style={{ ...c.profileCard, flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <div style={{ ...c.bigAvatar, width: 70, height: 70, fontSize: 22, marginBottom: 12 }}>{employee.avatar}</div>
        <div style={c.profileName}>{employee.name}</div>
        <div style={c.profileRole}>{employee.role}</div>
        <div style={c.profileMeta}>{employee.department} · {branch}</div>
        <span style={{ ...c.badge("#10b981"), marginTop: 8 }}>{employee.status}</span>
      </div>

      <div style={c.card}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", marginBottom: 14 }}>Account Details</div>
        <table style={c.tbl}>
          <tbody>
            {[
              ["Employee ID",  employee.uhid],
              ["Email",        employee.email],
              ["Phone",        employee.phone],
              ["Branch",       branch],
              ["Department",   employee.department],
              ["Role",         employee.role],
              ["Joined",       employee.joinDate],
              ["Status",       employee.status],
            ].map(([k, v]) => (
              <tr key={k}>
                <td style={{ ...c.td, width: 140, fontSize: 10, color: "#2d3a50", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{k}</td>
                <td style={{ ...c.td, color: "#94a3b8" }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ ...c.card, borderColor: "#ef444430" }}>
        <div style={{ fontSize: 11, color: "#ef4444", fontWeight: 600, marginBottom: 8 }}>Access Restrictions</div>
        {[
          "User management — Admin only",
          "Department creation — Admin only",
          "Role assignment — Admin only",
          "Cross-branch data — Admin only",
          "Patient add / edit / delete — Admin only",
        ].map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
            <span style={{ color: "#ef4444", fontSize: 11 }}>✕</span>
            <span style={{ fontSize: 11, color: "#3a4a60" }}>{r}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "home":     return renderHome();
      case "patients": return renderPatients();
      case "schedule": return renderSchedule();
      case "billing":  return renderBilling();
      case "profile":  return renderProfile();
      default:         return renderHome();
    }
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div style={c.wrap}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-thumb { background: #161d2e; border-radius: 3px; }
        option { background: #090d14; }
      `}</style>

      {notif && <div style={c.notif(notif.type)}>{notif.type === "ok" ? "✓ " : "⚠ "}{notif.msg}</div>}

      {/* HEADER */}
      <header style={c.hdr}>
        <div style={c.logoRow}>
          <div style={c.logoIcon}>S</div>
          <div>
            <div style={c.logoText}>Sangi Hospital</div>
            <div style={c.logoSub}>{employee.role} · {branch}</div>
          </div>
        </div>
        <div style={c.hdrRight}>
          <span style={c.roleBadge}>{employee.role.toUpperCase()}</span>
          <div style={c.avatar}>{employee.avatar}</div>
          <button style={c.logoutBtn} onClick={onLogout}>Logout</button>
        </div>
      </header>

      <div style={c.body}>
        {/* SIDEBAR */}
        <aside style={c.sb}>
          {/* Branch pill — read-only for employee */}
          <div style={c.sbTop}>
            {!collapsed && <div style={{ fontSize: 9, fontWeight: 700, color: "#2d3a50", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 7, paddingLeft: 2 }}>Branch</div>}
            <div style={c.branchPillSb}>
              <div style={c.bsDot} />
              {!collapsed && <span>{branch}</span>}
            </div>
          </div>

          <nav style={c.navWrap}>
            {!collapsed && <div style={c.navSection}>Menu</div>}
            {NAV.map(item => (
              <div key={item.id} style={c.navItem(activeTab === item.id)} onClick={() => setActiveTab(item.id)} title={item.label}>
                <span style={c.navIcon}>{item.icon}</span>
                {!collapsed && item.label}
              </div>
            ))}
          </nav>

          <div style={c.sbBot}>
            <button style={c.colBtn} onClick={() => setCollapsed(x => !x)} title={collapsed ? "Expand" : "Collapse"}>
              {collapsed ? "▶" : "◀"}
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <main style={c.main}>{renderContent()}</main>
      </div>
    </div>
  );
}
