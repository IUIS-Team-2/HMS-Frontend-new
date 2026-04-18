/**
 * BranchAdminDashboard.jsx
 *
 * Branch is injected via props — set by SuperAdmin at creation time.
 * The admin CANNOT switch branches. They only ever see their assigned branch.
 *
 * Usage (from your router / auth layer):
 *   const { branchId, branchName, adminName } = useAuth();
 *   <BranchAdminDashboard branchId={branchId} branchName={branchName} adminName={adminName} />
 *
 * SuperAdmin sets branchId = "raya" | "lakshmi" when creating the admin account.
 */

import { useState, useEffect, useCallback } from "react";

// ─── Branch Theme Map ──────────────────────────────────────────────────────────
const BRANCH_THEMES = {
  raya: {
    primary:       "#e8a030",
    primaryDim:    "#2a1c04",
    primaryBorder: "#6b4a10",
    glow:          "rgba(232,160,48,0.10)",
    label:         "Raya Branch",
    initial:       "R",
  },
  lakshmi: {
    primary:       "#818cf8",
    primaryDim:    "#13153a",
    primaryBorder: "#3730a3",
    glow:          "rgba(129,140,248,0.10)",
    label:         "Lakshmi Branch",
    initial:       "L",
  },
  default: {
    primary:       "#3b82f6",
    primaryDim:    "#0c1e40",
    primaryBorder: "#1d4ed8",
    glow:          "rgba(59,130,246,0.10)",
    label:         "Branch",
    initial:       "B",
  },
};

const NAV = [
  { id: "overview",    label: "Overview",                icon: "▣" },
  { id: "patients",    label: "All Patients",             icon: "◈" },
  { id: "cash",        label: "Cash Patients",            icon: "◎" },
  { id: "cashless",    label: "Cashless Patients",        icon: "◌" },
  { id: "records",     label: "Patient Records",          icon: "▤" },
  { id: "financials",  label: "Financials",               icon: "◆" },
  { id: "departments", label: "Departments",              icon: "▦" },
  { id: "employees",   label: "Employees",                icon: "◉" },
];

const RECORD_TYPES = [
  { id: "discharge_summary", label: "Discharge Summary" },
  { id: "reports",           label: "Reports"           },
  { id: "medicines",         label: "Medicines"         },
  { id: "admission_note",    label: "Admission Note"    },
  { id: "medical_history",   label: "Medical History"   },
];

const RANGES = ["daily", "weekly", "monthly", "yearly"];
const API    = "/api/branch-admin";

// ─── Excel Export Utility ─────────────────────────────────────────────────────
function exportExcel(rows, filename) {
  if (!rows?.length) return;
  const headers = Object.keys(rows[0]);
  const esc     = (v) => { const s = String(v ?? ""); return (s.includes(",") || s.includes('"')) ? `"${s.replace(/"/g,'""')}"` : s; };
  const csv     = [headers.join(","), ...rows.map(r => headers.map(h => esc(r[h])).join(","))].join("\r\n");
  const blob    = new Blob(["\uFEFF" + csv], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url     = URL.createObjectURL(blob);
  const a       = Object.assign(document.createElement("a"), { href: url, download: `${filename}.xlsx` });
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  bg:            "#060810",
  surface:       "#0b0f1a",
  surfaceRaised: "#0f1422",
  card:          "#111827",
  border:        "#1c2535",
  borderLight:   "#243045",
  text:          "#f0f4ff",
  textSub:       "#8899bb",
  textMuted:     "#3d4f6e",
  success:       "#22d3a0",
  successDim:    "#041f16",
  successBdr:    "#0a4a32",
  warning:       "#f59e0b",
  warningDim:    "#1f1204",
  warningBdr:    "#7a4d08",
  danger:        "#f87171",
  dangerDim:     "#1f0505",
  dangerBdr:     "#7a2020",
  blue:          "#60a5fa",
  blueDim:       "#0d1630",
  blueBdr:       "#1d3a70",
  purple:        "#a78bfa",
  purpleDim:     "#160d36",
  purpleBdr:     "#4c2d9e",
};

// ─── Style Factories ──────────────────────────────────────────────────────────
const mkBadge = (type) => {
  const map = {
    cash:       [T.successDim, T.success, T.successBdr],
    cashless:   [T.purpleDim,  T.purple,  T.purpleBdr ],
    TPA:        [T.purpleDim,  T.purple,  T.purpleBdr ],
    Card:       [T.blueDim,    T.blue,    T.blueBdr   ],
    active:     [T.successDim, T.success, T.successBdr],
    admitted:   [T.blueDim,    T.blue,    T.blueBdr   ],
    discharged: ["#111",       "#94a3b8", "#2a3040"   ],
    pending:    [T.warningDim, T.warning, T.warningBdr],
    paid:       [T.successDim, T.success, T.successBdr],
    unpaid:     [T.dangerDim,  T.danger,  T.dangerBdr ],
  };
  const [bg, c, b] = map[type] || [T.card, T.textSub, T.border];
  return { display:"inline-flex", alignItems:"center", padding:"3px 10px", borderRadius:"20px", fontSize:"10px", fontWeight:"600", letterSpacing:"0.4px", background:bg, color:c, border:`1px solid ${b}`, whiteSpace:"nowrap" };
};

const mkInput = () => ({
  background: T.surfaceRaised, border:`1px solid ${T.border}`, color:T.text,
  padding:"8px 13px", borderRadius:"7px", fontSize:"12px", fontFamily:"inherit", outline:"none",
});

const mkBtn = (v, theme) => {
  const p  = theme?.primary       || "#3b82f6";
  const pd = theme?.primaryDim    || "#0c1e40";
  const pb = theme?.primaryBorder || "#1d4ed8";
  const defs = {
    primary: [p,           "#fff",    p          ],
    ghost:   ["transparent",T.textSub, T.border  ],
    success: [T.successDim, T.success, T.successBdr],
    danger:  [T.dangerDim,  T.danger,  T.dangerBdr ],
    excel:   ["#071a10",   "#4ade80", "#145228"  ],
    dim:     [pd,           p,         pb         ],
  };
  const [bg, c, b] = defs[v] || defs.ghost;
  return {
    padding:"8px 18px", borderRadius:"7px", fontSize:"12px", fontFamily:"inherit",
    cursor:"pointer", fontWeight:"500", border:`1px solid ${b}`,
    background:bg, color:c, transition:"all 0.15s",
    display:"inline-flex", alignItems:"center", gap:"6px", whiteSpace:"nowrap",
  };
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BranchAdminDashboard({
  branchId   = "raya",
  branchName = "",
  adminName  = "Admin",
}) {
  const theme              = BRANCH_THEMES[branchId] || BRANCH_THEMES.default;
  const resolvedBranchName = branchName || theme.label;

  const [nav,      setNav]      = useState("overview");
  const [range,    setRange]    = useState("monthly");
  const [fromDate, setFromDate] = useState("");
  const [toDate,   setToDate]   = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const [overview,     setOverview]     = useState(null);
  const [patients,     setPatients]     = useState([]);
  const [cashPats,     setCashPats]     = useState([]);
  const [cashlessPats, setCashlessPats] = useState([]);
  const [financials,   setFinancials]   = useState(null);
  const [departments,  setDepartments]  = useState([]);
  const [employees,    setEmployees]    = useState([]);

  const [selPatient, setSelPatient] = useState(null);
  const [recTab,     setRecTab]     = useState("discharge_summary");
  const [records,    setRecords]    = useState([]);

  const [search,    setSearch]    = useState("");
  const [statusFil, setStatusFil] = useState("all");
  const [modal,     setModal]     = useState(null);

  const [deptForm, setDeptForm] = useState({ name:"", description:"", hodName:"" });
  const [empForm,  setEmpForm]  = useState({ name:"", email:"", phone:"", role:"", departmentId:"", employeeId:"", designation:"" });

  // ─── API ──────────────────────────────────────────────────────────────────
  const apiFetch = useCallback(async (path, opts = {}) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API}${path}`, { headers:{"Content-Type":"application/json"}, ...opts });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      return await res.json();
    } catch (e) { setError(e.message); return null; }
    finally { setLoading(false); }
  }, []);

  const qp = useCallback((extra = {}) => {
    const p = new URLSearchParams({ branch:branchId, range, ...extra });
    if (fromDate) p.set("from", fromDate);
    if (toDate)   p.set("to",   toDate);
    return p.toString();
  }, [branchId, range, fromDate, toDate]);

  // ─── Loaders ──────────────────────────────────────────────────────────────
  useEffect(() => {
    setSearch(""); setStatusFil("all");
    if (nav !== "records") setSelPatient(null);
    if (nav === "overview")    loadOverview();
    if (nav === "patients")    loadPatients();
    if (nav === "cash")        loadCash();
    if (nav === "cashless")    loadCashless();
    if (nav === "financials")  loadFinancials();
    if (nav === "departments") loadDepts();
    if (nav === "employees")   loadEmps();
  }, [nav, range, fromDate, toDate]);

  useEffect(() => { if (nav === "records" && selPatient) loadRecords(); }, [selPatient, recTab]);

  const loadOverview  = async () => { const d = await apiFetch(`/overview?${qp()}`);                                                        if (d) setOverview(d); };
  const loadPatients  = async () => { const d = await apiFetch(`/patients?${qp({ search, status:statusFil })}`);                           if (d) setPatients(d.patients||[]); };
  const loadCash      = async () => { const d = await apiFetch(`/patients?${qp({ paymentMode:"cash", search, status:statusFil })}`);       if (d) setCashPats(d.patients||[]); };
  const loadCashless  = async () => { const d = await apiFetch(`/patients?${qp({ paymentMode:"cashless", search, status:statusFil })}`);   if (d) setCashlessPats(d.patients||[]); };
  const loadFinancials= async () => { const d = await apiFetch(`/financials?${qp()}`);                                                     if (d) setFinancials(d); };
  const loadDepts     = async () => { const d = await apiFetch(`/departments?branch=${branchId}`);                                         if (d) setDepartments(d.departments||[]); };
  const loadEmps      = async () => { const d = await apiFetch(`/employees?branch=${branchId}`);                                           if (d) setEmployees(d.employees||[]); };
  const loadRecords   = async () => { const d = await apiFetch(`/patients/${selPatient?.id}/records?type=${recTab}&branch=${branchId}`);   if (d) setRecords(d.records||[]); };

  // ─── Mutations ────────────────────────────────────────────────────────────
  async function createDept(e) {
    e.preventDefault();
    const d = await apiFetch("/departments", { method:"POST", body:JSON.stringify({...deptForm, branch:branchId}) });
    if (d) { setModal(null); setDeptForm({name:"",description:"",hodName:""}); loadDepts(); }
  }
  async function createEmp(e) {
    e.preventDefault();
    const d = await apiFetch("/employees", { method:"POST", body:JSON.stringify({...empForm, branch:branchId}) });
    if (d) { setModal(null); setEmpForm({name:"",email:"",phone:"",role:"",departmentId:"",employeeId:"",designation:""}); loadEmps(); }
  }
  async function deleteDept(id) {
    if (!window.confirm("Delete this department?")) return;
    await apiFetch(`/departments/${id}`, { method:"DELETE" }); loadDepts();
  }
  async function deleteEmp(id) {
    if (!window.confirm("Remove this employee?")) return;
    await apiFetch(`/employees/${id}`, { method:"DELETE" }); loadEmps();
  }

  // ─── Patient row for Excel ────────────────────────────────────────────────
  const pRow = (p) => ({
    "Patient ID":p.id, Name:p.name, Age:p.age, Gender:p.gender, Phone:p.phone,
    Department:p.department, Doctor:p.doctor, "Admission Date":p.admissionDate,
    "Discharge Date":p.dischargeDate||"", "Payment Mode":p.paymentMode,
    "Payment Type":p.paymentType||"", Status:p.status, Branch:resolvedBranchName,
  });

  // ─── Shared UI Pieces ─────────────────────────────────────────────────────
  const Th = ({ children }) => (
    <th style={{ padding:"10px 16px", textAlign:"left", fontSize:"9px", letterSpacing:"2px", color:T.textMuted, textTransform:"uppercase", borderBottom:`1px solid ${T.border}`, background:T.surface, whiteSpace:"nowrap" }}>
      {children}
    </th>
  );
  const Td = ({ children, primary, hi, style:sx={} }) => (
    <td style={{ padding:"12px 16px", borderBottom:`1px solid ${T.border}22`, color:primary?T.text:hi||T.textSub, fontWeight:primary?"600":"400", verticalAlign:"middle", ...sx }}>
      {children}
    </td>
  );
  const EmptyRow = ({ cols, msg="NO DATA" }) => (
    <tr><td colSpan={cols} style={{ padding:"52px 20px", textAlign:"center", color:T.textMuted, fontSize:"10px", letterSpacing:"3px" }}>{msg}</td></tr>
  );

  function StatCard({ label, value, sub, color, prefix="" }) {
    const c = color || theme.primary;
    return (
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderTop:`2px solid ${c}`, borderRadius:"10px", padding:"18px 20px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, right:0, width:"90px", height:"90px", background:`radial-gradient(circle at top right, ${c}14, transparent 70%)`, pointerEvents:"none" }} />
        <div style={{ fontSize:"9px", letterSpacing:"2.5px", color:T.textMuted, textTransform:"uppercase", marginBottom:"10px" }}>{label}</div>
        <div style={{ fontSize:"28px", fontWeight:"800", color:c, lineHeight:1, fontVariantNumeric:"tabular-nums" }}>
          {prefix}{typeof value === "number" ? value.toLocaleString() : (value ?? "—")}
        </div>
        {sub && <div style={{ fontSize:"11px", color:T.textMuted, marginTop:"5px" }}>{sub}</div>}
      </div>
    );
  }

  function TableShell({ title, count, action, children }) {
    return (
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:"10px", overflow:"hidden", marginBottom:"22px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 18px", borderBottom:`1px solid ${T.border}`, background:T.surfaceRaised }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <span style={{ fontSize:"10px", letterSpacing:"2px", color:T.textSub, textTransform:"uppercase" }}>{title}</span>
            {count !== undefined && <span style={{ fontSize:"10px", color:T.textMuted, background:T.surface, border:`1px solid ${T.border}`, padding:"1px 8px", borderRadius:"20px" }}>{count}</span>}
          </div>
          {action}
        </div>
        <div style={{ overflowX:"auto" }}>{children}</div>
      </div>
    );
  }

  function FilterBar({ onSearch, onExport, exportLabel="Export Excel" }) {
    return (
      <div style={{ display:"flex", gap:"10px", marginBottom:"18px", flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ position:"relative" }}>
          <span style={{ position:"absolute", left:"11px", top:"50%", transform:"translateY(-50%)", color:T.textMuted }}>⌕</span>
          <input
            style={{ ...mkInput(), paddingLeft:"30px", width:"220px" }}
            placeholder="Search name / ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && onSearch?.()}
          />
        </div>
        <select style={{ ...mkInput(), cursor:"pointer" }} value={statusFil} onChange={e => setStatusFil(e.target.value)}>
          <option value="all">All Status</option>
          <option value="admitted">Admitted</option>
          <option value="discharged">Discharged</option>
          <option value="pending">Pending</option>
        </select>
        <button style={{ ...mkBtn("ghost", theme), padding:"8px 12px" }} onClick={onSearch} title="Refresh">↻</button>
        <button style={{ ...mkBtn("excel", theme), marginLeft:"auto" }} onClick={onExport}>↓ {exportLabel}</button>
      </div>
    );
  }

  // ─── Views ────────────────────────────────────────────────────────────────
  function OverviewView() {
    return (
      <>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"14px", marginBottom:"14px" }}>
          {[
            ["Total Patients",    "totalPatients",    theme.primary],
            ["Admitted Today",    "admittedToday",    T.blue       ],
            ["Discharged Today",  "dischargedToday",  T.success    ],
            ["Pending Discharge", "pendingDischarge", T.warning    ],
          ].map(([l,k,c]) => <StatCard key={k} label={l} value={overview?.[k]} color={c} />)}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"14px", marginBottom:"14px" }}>
          {[
            ["Cash Revenue",     "cashRevenue",     T.success,      "₹"],
            ["Cashless Revenue", "cashlessRevenue", T.purple,       "₹"],
            ["Total Revenue",    "totalRevenue",    theme.primary,  "₹"],
            ["Pending Dues",     "pendingDues",     T.danger,       "₹"],
          ].map(([l,k,c,p]) => <StatCard key={k} label={l} value={overview?.[k]} color={c} prefix={p} />)}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"14px", marginBottom:"24px" }}>
          {[
            ["Departments",  "deptCount", T.blue  ],
            ["Employees",    "empCount",  T.blue  ],
            ["TPA Patients", "tpaCount",  T.purple],
            ["Card Patients","cardCount", T.warning],
          ].map(([l,k,c]) => <StatCard key={k} label={l} value={overview?.[k]} color={c} />)}
        </div>

        <TableShell title="Recent Registrations" count={overview?.recentPatients?.length}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"12px" }}>
            <thead><tr>{["ID","Name","Dept","Doctor","Admission","Pay Mode","Type","Status"].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
            <tbody>
              {!(overview?.recentPatients?.length)
                ? <EmptyRow cols={8} msg="NO RECENT PATIENTS" />
                : overview.recentPatients.map(p => (
                  <tr key={p.id} style={{ cursor:"pointer" }}
                    onClick={() => { setSelPatient(p); setNav("records"); }}>
                    <Td><span style={{ color:T.textMuted, fontSize:"10px" }}>#{p.id}</span></Td>
                    <Td primary>{p.name}</Td>
                    <Td>{p.department}</Td>
                    <Td>{p.doctor}</Td>
                    <Td>{p.admissionDate}</Td>
                    <Td><span style={mkBadge(p.paymentMode)}>{p.paymentMode}</span></Td>
                    <Td><span style={mkBadge(p.paymentType)}>{p.paymentType||"—"}</span></Td>
                    <Td><span style={mkBadge(p.status)}>{p.status}</span></Td>
                  </tr>
                ))}
            </tbody>
          </table>
        </TableShell>
      </>
    );
  }

  function PatientListView({ data, reload, exportFile, title }) {
    return (
      <>
        <FilterBar
          onSearch={reload}
          onExport={() => exportExcel(data.map(pRow), exportFile)}
          exportLabel="Export Excel"
        />
        <TableShell title={title} count={data.length}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"12px" }}>
            <thead>
              <tr>{["ID","Name","Age","Gender","Phone","Department","Doctor","Admission","Discharge","Pay Mode","Type","Status","Records"].map(h=><Th key={h}>{h}</Th>)}</tr>
            </thead>
            <tbody>
              {!data.length
                ? <EmptyRow cols={13} />
                : data.map(p => (
                  <tr key={p.id}>
                    <Td><span style={{ color:T.textMuted, fontSize:"10px" }}>#{p.id}</span></Td>
                    <Td primary>{p.name}</Td>
                    <Td>{p.age}</Td>
                    <Td>{p.gender}</Td>
                    <Td>{p.phone}</Td>
                    <Td>{p.department}</Td>
                    <Td>{p.doctor}</Td>
                    <Td>{p.admissionDate}</Td>
                    <Td>{p.dischargeDate||"—"}</Td>
                    <Td><span style={mkBadge(p.paymentMode)}>{p.paymentMode}</span></Td>
                    <Td><span style={mkBadge(p.paymentType)}>{p.paymentType||"—"}</span></Td>
                    <Td><span style={mkBadge(p.status)}>{p.status}</span></Td>
                    <Td>
                      <button
                        style={{ ...mkBtn("dim", theme), padding:"4px 12px", fontSize:"10px" }}
                        onClick={() => { setSelPatient(p); setNav("records"); }}
                      >View</button>
                    </Td>
                  </tr>
                ))}
            </tbody>
          </table>
        </TableShell>
      </>
    );
  }

  function FinancialsView() {
    return (
      <>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"14px", marginBottom:"14px" }}>
          {[
            ["Cash Total",        "cashTotal",      T.success,      "₹"],
            ["Cashless Total",    "cashlessTotal",  T.purple,       "₹"],
            ["TPA Total",         "tpaTotal",       T.blue,         "₹"],
            ["Card Total",        "cardTotal",      T.warning,      "₹"],
          ].map(([l,k,c,p]) => <StatCard key={k} label={l} value={financials?.[k]} color={c} prefix={p} />)}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"14px", marginBottom:"24px" }}>
          {[
            ["Grand Total",       "grandTotal",     theme.primary,  "₹"],
            ["Collected Today",   "collectedToday", T.success,      "₹"],
            ["Pending Dues",      "pendingDues",    T.danger,       "₹"],
            ["Transactions",      "txnCount",       T.blue         ],
          ].map(([l,k,c,p]) => <StatCard key={k} label={l} value={financials?.[k]} color={c} prefix={p||""} />)}
        </div>

        <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:"16px" }}>
          <button style={mkBtn("excel", theme)} onClick={() => {
            const rows = [
              ...(financials?.cashTxns||[]).map(r=>({...r, __mode:"CASH"})),
              ...(financials?.cashlessTxns||[]).map(r=>({...r, __mode:"CASHLESS"})),
            ];
            exportExcel(rows, `financials_${branchId}_${range}`);
          }}>↓ Export Excel</button>
        </div>

        <TableShell title="Cash Transactions" count={financials?.cashTxns?.length}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"12px" }}>
            <thead><tr>{["Patient ID","Name","Date","Amount","Description","Received By","Status"].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
            <tbody>
              {!(financials?.cashTxns?.length)
                ? <EmptyRow cols={7} msg="NO CASH TRANSACTIONS" />
                : financials.cashTxns.map((r,i) => (
                  <tr key={i}>
                    <Td><span style={{color:T.textMuted,fontSize:"10px"}}>#{r.patientId}</span></Td>
                    <Td primary>{r.patientName}</Td>
                    <Td>{r.date}</Td>
                    <Td hi={T.success} style={{fontWeight:"700"}}>₹{r.amount?.toLocaleString()}</Td>
                    <Td>{r.description}</Td>
                    <Td>{r.receivedBy}</Td>
                    <Td><span style={mkBadge(r.status)}>{r.status}</span></Td>
                  </tr>
                ))}
            </tbody>
          </table>
        </TableShell>

        <TableShell title="Cashless Transactions — TPA / Card" count={financials?.cashlessTxns?.length}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"12px" }}>
            <thead><tr>{["Patient ID","Name","Date","Amount","Mode","Auth Code","Insurer / Bank","Status"].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
            <tbody>
              {!(financials?.cashlessTxns?.length)
                ? <EmptyRow cols={8} msg="NO CASHLESS TRANSACTIONS" />
                : financials.cashlessTxns.map((r,i) => (
                  <tr key={i}>
                    <Td><span style={{color:T.textMuted,fontSize:"10px"}}>#{r.patientId}</span></Td>
                    <Td primary>{r.patientName}</Td>
                    <Td>{r.date}</Td>
                    <Td hi={T.purple} style={{fontWeight:"700"}}>₹{r.amount?.toLocaleString()}</Td>
                    <Td><span style={mkBadge(r.paymentType)}>{r.paymentType}</span></Td>
                    <Td>{r.authCode||"—"}</Td>
                    <Td>{r.insurerOrBank||"—"}</Td>
                    <Td><span style={mkBadge(r.status)}>{r.status}</span></Td>
                  </tr>
                ))}
            </tbody>
          </table>
        </TableShell>
      </>
    );
  }

  function RecordsView() {
    if (!selPatient) return (
      <div style={{ textAlign:"center", padding:"80px 20px" }}>
        <div style={{ fontSize:"40px", marginBottom:"16px", color:T.textMuted }}>◈</div>
        <div style={{ fontSize:"11px", letterSpacing:"3px", color:T.textMuted, marginBottom:"12px" }}>NO PATIENT SELECTED</div>
        <p style={{ color:T.textSub, fontSize:"13px", maxWidth:"360px", margin:"0 auto 24px" }}>
          Open All Patients, Cash Patients, or Cashless Patients and click "View" on any row.
        </p>
        <button style={mkBtn("dim", theme)} onClick={() => setNav("patients")}>→ Go to Patients</button>
      </div>
    );

    const cols = {
      discharge_summary:["Date","Summary","Doctor","Next Visit","Instructions"],
      reports:          ["Date","Report Type","Result","Lab / Tech","Doctor","File"],
      medicines:        ["Date","Medicine","Dosage","Frequency","Duration","Prescribed By"],
      admission_note:   ["Date","Note","Doctor","Diagnosis","Plan"],
      medical_history:  ["Date","Condition","Treatment","Doctor","Notes"],
    };

    return (
      <>
        {/* Patient card */}
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderLeft:`3px solid ${theme.primary}`, borderRadius:"10px", padding:"18px 24px", marginBottom:"22px", display:"flex", gap:"28px", flexWrap:"wrap", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:"9px", letterSpacing:"2px", color:T.textMuted, textTransform:"uppercase", marginBottom:"3px" }}>Patient</div>
            <div style={{ fontSize:"18px", fontWeight:"800", color:T.text }}>{selPatient.name}</div>
          </div>
          {[["ID","#"+selPatient.id],["Age",selPatient.age],["Dept",selPatient.department],["Doctor",selPatient.doctor],["Pay Mode",selPatient.paymentMode],["Type",selPatient.paymentType||"—"],["Status",selPatient.status]].map(([l,v])=>(
            <div key={l}>
              <div style={{ fontSize:"9px", letterSpacing:"2px", color:T.textMuted, textTransform:"uppercase", marginBottom:"3px" }}>{l}</div>
              <div style={{ fontSize:"12px", color:T.textSub }}>{v}</div>
            </div>
          ))}
          <div style={{ marginLeft:"auto", display:"flex", gap:"8px" }}>
            <button style={{ ...mkBtn("excel", theme), fontSize:"11px" }}
              onClick={() => exportExcel(records.map(r=>({...r, patientId:selPatient.id, patientName:selPatient.name})), `${recTab}_${selPatient.id}`)}>
              ↓ Excel
            </button>
            <button style={{ ...mkBtn("ghost", theme), padding:"8px 12px" }} onClick={() => setSelPatient(null)}>✕</button>
          </div>
        </div>

        {/* Record type tabs */}
        <div style={{ display:"flex", gap:"6px", marginBottom:"20px", flexWrap:"wrap" }}>
          {RECORD_TYPES.map(rt => (
            <button key={rt.id} onClick={() => setRecTab(rt.id)} style={{
              padding:"7px 16px", borderRadius:"7px", fontSize:"11px", fontFamily:"inherit",
              cursor:"pointer", border:"1px solid", transition:"all 0.15s",
              background: recTab===rt.id ? theme.primaryDim : "transparent",
              borderColor: recTab===rt.id ? theme.primaryBorder : T.border,
              color: recTab===rt.id ? theme.primary : T.textSub,
              fontWeight: recTab===rt.id ? "600" : "400",
            }}>{rt.label}</button>
          ))}
        </div>

        <TableShell title={RECORD_TYPES.find(r=>r.id===recTab)?.label} count={records.length}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"12px" }}>
            <thead><tr>{(cols[recTab]||[]).map(h=><Th key={h}>{h}</Th>)}</tr></thead>
            <tbody>
              {!records.length
                ? <EmptyRow cols={(cols[recTab]||[]).length} msg={`NO ${recTab.replace(/_/g," ").toUpperCase()} RECORDS`} />
                : records.map((rec,i) => (
                  <tr key={i}>
                    <Td>{rec.date}</Td>
                    {recTab==="discharge_summary" && <><Td sx={{maxWidth:"180px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{rec.summary}</Td><Td>{rec.doctor}</Td><Td>{rec.nextVisit}</Td><Td>{rec.instructions}</Td></>}
                    {recTab==="reports" && <><Td primary>{rec.reportType}</Td><Td>{rec.result}</Td><Td>{rec.lab}</Td><Td>{rec.doctor}</Td><Td>{rec.fileUrl ? <a href={rec.fileUrl} target="_blank" rel="noreferrer" style={{color:theme.primary}}>↗</a> : "—"}</Td></>}
                    {recTab==="medicines" && <><Td primary>{rec.medicine}</Td><Td>{rec.dosage}</Td><Td>{rec.frequency}</Td><Td>{rec.duration}</Td><Td>{rec.prescribedBy}</Td></>}
                    {recTab==="admission_note" && <><Td sx={{maxWidth:"180px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{rec.note}</Td><Td>{rec.doctor}</Td><Td>{rec.diagnosis}</Td><Td>{rec.plan}</Td></>}
                    {recTab==="medical_history" && <><Td primary>{rec.condition}</Td><Td>{rec.treatment}</Td><Td>{rec.doctor}</Td><Td sx={{maxWidth:"160px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{rec.notes}</Td></>}
                  </tr>
                ))}
            </tbody>
          </table>
        </TableShell>
      </>
    );
  }

  function DepartmentsView() {
    return (
      <>
        <div style={{ display:"flex", justifyContent:"flex-end", gap:"10px", marginBottom:"20px" }}>
          <button style={mkBtn("excel", theme)} onClick={() => exportExcel(departments.map(d=>({ ID:d.id, Name:d.name, Description:d.description, HOD:d.hodName, Employees:d.employeeCount, Created:d.createdAt, Branch:resolvedBranchName })), `departments_${branchId}`)}>↓ Excel</button>
          <button style={mkBtn("primary", theme)} onClick={() => setModal("dept")}>+ New Department</button>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"14px", marginBottom:"22px" }}>
          <StatCard label="Total Departments" value={departments.length}                                                   color={theme.primary} />
          <StatCard label="Total Staff"        value={departments.reduce((a,d)=>a+(d.employeeCount||0),0)}                 color={T.success}     />
          <StatCard label="Branch"             value={resolvedBranchName}                                                  color={theme.primary} />
        </div>

        <TableShell title="Departments" count={departments.length}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"12px" }}>
            <thead><tr>{["ID","Name","Description","HOD","Employees","Created","Action"].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
            <tbody>
              {!departments.length
                ? <EmptyRow cols={7} msg="NO DEPARTMENTS — CREATE ONE" />
                : departments.map(d => (
                  <tr key={d.id}>
                    <Td><span style={{color:T.textMuted,fontSize:"10px"}}>#{d.id}</span></Td>
                    <Td primary>{d.name}</Td>
                    <Td>{d.description||"—"}</Td>
                    <Td>{d.hodName||"—"}</Td>
                    <Td hi={theme.primary}>{d.employeeCount||0}</Td>
                    <Td>{d.createdAt}</Td>
                    <Td><button style={{ ...mkBtn("danger",theme), padding:"4px 12px", fontSize:"10px" }} onClick={()=>deleteDept(d.id)}>Delete</button></Td>
                  </tr>
                ))}
            </tbody>
          </table>
        </TableShell>
      </>
    );
  }

  function EmployeesView() {
    const roleColor = { Doctor:T.blue, Nurse:T.success, Admin:T.warning, Billing:T.purple, HOD:theme.primary };
    return (
      <>
        <div style={{ display:"flex", justifyContent:"flex-end", gap:"10px", marginBottom:"20px" }}>
          <button style={mkBtn("excel", theme)} onClick={() => exportExcel(employees.map(e=>({ "Emp ID":e.employeeId, Name:e.name, Email:e.email, Phone:e.phone, Role:e.role, Designation:e.designation, Department:e.departmentName, Joined:e.joinedDate, Branch:resolvedBranchName })), `employees_${branchId}`)}>↓ Excel</button>
          <button style={mkBtn("primary", theme)} onClick={() => { if (!departments.length) loadDepts(); setModal("emp"); }}>+ Add Employee</button>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"14px", marginBottom:"22px" }}>
          <StatCard label="Total Staff" value={employees.length} color={theme.primary} />
          {["Doctor","Nurse","Admin","Billing"].map(r => (
            <StatCard key={r} label={`${r}s`} value={employees.filter(e=>e.role===r).length} color={roleColor[r]||T.blue} />
          ))}
        </div>

        <TableShell title="Employees" count={employees.length}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"12px" }}>
            <thead><tr>{["Emp ID","Name","Designation","Email","Phone","Role","Department","Joined","Action"].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
            <tbody>
              {!employees.length
                ? <EmptyRow cols={9} msg="NO EMPLOYEES" />
                : employees.map(emp => (
                  <tr key={emp.id}>
                    <Td><span style={{color:T.textMuted,fontSize:"10px"}}>{emp.employeeId}</span></Td>
                    <Td primary>{emp.name}</Td>
                    <Td>{emp.designation||"—"}</Td>
                    <Td>{emp.email}</Td>
                    <Td>{emp.phone}</Td>
                    <Td>
                      <span style={{ background:(roleColor[emp.role]||T.blue)+"20", color:roleColor[emp.role]||T.blue, border:`1px solid ${(roleColor[emp.role]||T.blue)}40`, padding:"2px 9px", borderRadius:"20px", fontSize:"10px", fontWeight:"600" }}>
                        {emp.role}
                      </span>
                    </Td>
                    <Td>{emp.departmentName}</Td>
                    <Td>{emp.joinedDate}</Td>
                    <Td><button style={{ ...mkBtn("danger",theme), padding:"4px 12px", fontSize:"10px" }} onClick={()=>deleteEmp(emp.id)}>Remove</button></Td>
                  </tr>
                ))}
            </tbody>
          </table>
        </TableShell>
      </>
    );
  }

  // ─── Modal Wrapper ────────────────────────────────────────────────────────
  function ModalWrap({ title, onClose, onSubmit, children }) {
    return (
      <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.82)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(4px)" }}
        onClick={onClose}>
        <div style={{ background:T.card, border:`1px solid ${T.borderLight}`, borderRadius:"14px", padding:"30px", width:"530px", maxHeight:"85vh", overflowY:"auto", boxShadow:`0 30px 70px rgba(0,0,0,0.7), 0 0 0 1px ${theme.primary}28` }}
          onClick={e => e.stopPropagation()}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"26px" }}>
            <div>
              <div style={{ fontSize:"9px", letterSpacing:"3px", color:theme.primary, textTransform:"uppercase", marginBottom:"3px" }}>{resolvedBranchName}</div>
              <div style={{ fontSize:"16px", fontWeight:"700", color:T.text }}>{title}</div>
            </div>
            <button style={{ ...mkBtn("ghost",theme), padding:"6px 10px" }} onClick={onClose}>✕</button>
          </div>
          <form onSubmit={onSubmit}>
            {children}
            <div style={{ display:"flex", gap:"10px", justifyContent:"flex-end", marginTop:"24px", paddingTop:"18px", borderTop:`1px solid ${T.border}` }}>
              <button type="button" style={mkBtn("ghost",theme)} onClick={onClose}>Cancel</button>
              <button type="submit" style={mkBtn("primary",theme)}>Confirm</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const FRow = ({ label, children }) => (
    <div style={{ marginBottom:"15px" }}>
      <label style={{ display:"block", fontSize:"9px", letterSpacing:"2px", color:T.textMuted, textTransform:"uppercase", marginBottom:"6px" }}>{label}</label>
      {children}
    </div>
  );
  const fi = { ...mkInput(), width:"100%" };
  const fs = { ...mkInput(), width:"100%", cursor:"pointer" };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ display:"flex", height:"100vh", background:T.bg, color:T.text, fontFamily:"'DM Mono','JetBrains Mono','Fira Code','Courier New',monospace", overflow:"hidden" }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside style={{ width:"256px", minWidth:"256px", background:T.surface, borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column" }}>

        {/* Logo + admin */}
        <div style={{ padding:"22px 20px 18px", borderBottom:`1px solid ${T.border}` }}>
          <div style={{ fontSize:"8px", letterSpacing:"4px", color:T.textMuted, textTransform:"uppercase", marginBottom:"2px" }}>MedCore HMS</div>
          <div style={{ fontSize:"16px", fontWeight:"800", color:T.text }}>Branch Admin</div>
          <div style={{ marginTop:"12px", display:"flex", alignItems:"center", gap:"10px" }}>
            <div style={{ width:"34px", height:"34px", borderRadius:"9px", flexShrink:0, background:theme.primaryDim, border:`1px solid ${theme.primaryBorder}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"14px", fontWeight:"800", color:theme.primary }}>
              {adminName?.[0]?.toUpperCase() || "A"}
            </div>
            <div>
              <div style={{ fontSize:"13px", fontWeight:"600", color:T.text }}>{adminName}</div>
              <div style={{ fontSize:"9px", color:T.textMuted, letterSpacing:"1px" }}>Branch Admin</div>
            </div>
          </div>
        </div>

        {/* Branch pill — locked, set by SuperAdmin */}
        <div style={{ margin:"14px 14px 2px", padding:"11px 14px", background:theme.glow, border:`1px solid ${theme.primaryBorder}`, borderRadius:"9px" }}>
          <div style={{ fontSize:"8px", letterSpacing:"2px", color:T.textMuted, textTransform:"uppercase", marginBottom:"5px" }}>Assigned Branch</div>
          <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"3px" }}>
            <div style={{ width:"9px", height:"9px", borderRadius:"50%", background:theme.primary, flexShrink:0 }} />
            <div style={{ fontSize:"14px", fontWeight:"700", color:theme.primary }}>{resolvedBranchName}</div>
          </div>
          <div style={{ fontSize:"9px", color:T.textMuted }}>Read-only · Set by SuperAdmin</div>
        </div>

        {/* Nav */}
        <div style={{ flex:1, padding:"14px 12px", overflowY:"auto" }}>
          <div style={{ fontSize:"8px", letterSpacing:"3px", color:T.textMuted, textTransform:"uppercase", padding:"0 8px", marginBottom:"8px" }}>Menu</div>
          {NAV.map(item => (
            <button key={item.id} onClick={() => setNav(item.id)} style={{
              display:"flex", alignItems:"center", gap:"10px",
              width:"100%", padding:"10px 12px", borderRadius:"8px",
              border:"none", cursor:"pointer", textAlign:"left",
              marginBottom:"2px", fontFamily:"inherit",
              background: nav===item.id ? theme.primaryDim : "transparent",
              color: nav===item.id ? theme.primary : T.textSub,
              borderLeft: nav===item.id ? `2px solid ${theme.primary}` : "2px solid transparent",
              transition:"all 0.15s",
            }}>
              <span style={{ fontSize:"15px", width:"20px", textAlign:"center", flexShrink:0 }}>{item.icon}</span>
              <span style={{ fontSize:"12px", fontWeight: nav===item.id ? "600" : "400" }}>{item.label}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Topbar */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 28px", borderBottom:`1px solid ${T.border}`, background:T.surface, flexShrink:0 }}>
          <div>
            <div style={{ fontSize:"9px", letterSpacing:"2px", color:T.textMuted, textTransform:"uppercase", marginBottom:"2px" }}>
              {resolvedBranchName} / {NAV.find(n=>n.id===nav)?.label}
            </div>
            <div style={{ fontSize:"18px", fontWeight:"800", color:T.text }}>{NAV.find(n=>n.id===nav)?.label}</div>
          </div>

          <div style={{ display:"flex", gap:"10px", alignItems:"center" }}>
            {/* Range toggle */}
            <div style={{ display:"flex", background:T.surfaceRaised, border:`1px solid ${T.border}`, borderRadius:"8px", overflow:"hidden" }}>
              {RANGES.map(r => (
                <button key={r} onClick={() => setRange(r)} style={{
                  padding:"7px 14px", border:"none", cursor:"pointer", fontFamily:"inherit",
                  fontSize:"11px", letterSpacing:"0.5px", transition:"all 0.15s",
                  background: range===r ? theme.primaryDim : "transparent",
                  color: range===r ? theme.primary : T.textMuted,
                  fontWeight: range===r ? "600" : "400",
                }}>{r.charAt(0).toUpperCase()+r.slice(1)}</button>
              ))}
            </div>
            <input type="date" style={{ ...mkInput(), fontSize:"11px" }} value={fromDate} onChange={e=>setFromDate(e.target.value)} title="From Date" />
            <span style={{ color:T.textMuted }}>→</span>
            <input type="date" style={{ ...mkInput(), fontSize:"11px" }} value={toDate} onChange={e=>setToDate(e.target.value)} title="To Date" />
            {loading && <div style={{ width:"7px", height:"7px", borderRadius:"50%", background:theme.primary, animation:"blink 1s ease-in-out infinite" }} />}
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{ background:T.dangerDim, borderBottom:`1px solid ${T.dangerBdr}`, color:T.danger, padding:"10px 28px", fontSize:"12px", display:"flex", alignItems:"center", gap:"8px" }}>
            <span>⚠</span> {error}
            <button style={{ ...mkBtn("ghost",theme), marginLeft:"auto", padding:"3px 10px", fontSize:"10px", color:T.danger, borderColor:T.dangerBdr }} onClick={()=>setError(null)}>✕</button>
          </div>
        )}

        {/* Page content */}
        <div style={{ flex:1, overflowY:"auto", padding:"26px 28px" }}>
          {nav==="overview"    && <OverviewView />}
          {nav==="patients"    && <PatientListView data={patients}     reload={loadPatients}  exportFile={`all_patients_${branchId}_${range}`}       title="All Patients" />}
          {nav==="cash"        && <PatientListView data={cashPats}     reload={loadCash}      exportFile={`cash_patients_${branchId}_${range}`}      title="Cash Patients" />}
          {nav==="cashless"    && <PatientListView data={cashlessPats} reload={loadCashless}  exportFile={`cashless_patients_${branchId}_${range}`}   title="Cashless Patients — TPA / Card" />}
          {nav==="records"     && <RecordsView />}
          {nav==="financials"  && <FinancialsView />}
          {nav==="departments" && <DepartmentsView />}
          {nav==="employees"   && <EmployeesView />}
        </div>
      </div>

      {/* ── Department Modal ─────────────────────────────────────────────── */}
      {modal==="dept" && (
        <ModalWrap title="Create Department" onClose={()=>setModal(null)} onSubmit={createDept}>
          <FRow label="Department Name">
            <input style={fi} value={deptForm.name} onChange={e=>setDeptForm({...deptForm,name:e.target.value})} placeholder="e.g. Radiology, ICU, OPD" required />
          </FRow>
          <FRow label="HOD Name">
            <input style={fi} value={deptForm.hodName} onChange={e=>setDeptForm({...deptForm,hodName:e.target.value})} placeholder="Head of Department name" />
          </FRow>
          <FRow label="Description">
            <input style={fi} value={deptForm.description} onChange={e=>setDeptForm({...deptForm,description:e.target.value})} placeholder="Optional" />
          </FRow>
        </ModalWrap>
      )}

      {/* ── Employee Modal ───────────────────────────────────────────────── */}
      {modal==="emp" && (
        <ModalWrap title="Add Employee" onClose={()=>setModal(null)} onSubmit={createEmp}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
            <FRow label="Full Name"><input style={fi} value={empForm.name} onChange={e=>setEmpForm({...empForm,name:e.target.value})} required /></FRow>
            <FRow label="Employee ID"><input style={fi} value={empForm.employeeId} onChange={e=>setEmpForm({...empForm,employeeId:e.target.value})} placeholder="EMP-001" /></FRow>
            <FRow label="Email"><input type="email" style={fi} value={empForm.email} onChange={e=>setEmpForm({...empForm,email:e.target.value})} required /></FRow>
            <FRow label="Phone"><input style={fi} value={empForm.phone} onChange={e=>setEmpForm({...empForm,phone:e.target.value})} /></FRow>
            <FRow label="Role">
              <select style={fs} value={empForm.role} onChange={e=>setEmpForm({...empForm,role:e.target.value})} required>
                <option value="">Select role</option>
                {["Doctor","Nurse","Admin","Billing","Receptionist","Lab Technician","Pharmacist","HOD","Radiologist"].map(r=><option key={r} value={r}>{r}</option>)}
              </select>
            </FRow>
            <FRow label="Designation"><input style={fi} value={empForm.designation} onChange={e=>setEmpForm({...empForm,designation:e.target.value})} placeholder="e.g. Senior Consultant" /></FRow>
          </div>
          <FRow label="Department">
            <select style={fs} value={empForm.departmentId} onChange={e=>setEmpForm({...empForm,departmentId:e.target.value})} required>
              <option value="">Select department</option>
              {departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </FRow>
        </ModalWrap>
      )}

      <style>{`
        @keyframes blink { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.2;transform:scale(0.6)} }
        *::-webkit-scrollbar { width:5px; height:5px }
        *::-webkit-scrollbar-track { background:transparent }
        *::-webkit-scrollbar-thumb { background:${T.border}; border-radius:10px }
        *::-webkit-scrollbar-thumb:hover { background:${T.borderLight} }
        tr:hover td { background:${T.surfaceRaised}22 }
      `}</style>
    </div>
  );
}