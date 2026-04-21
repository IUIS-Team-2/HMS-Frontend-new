import * as XLSX from "xlsx";
import MedDrawer from "../components/MedDrawer";
import { useState, useMemo, useEffect } from "react";
import { apiService } from "../services/apiService";

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const BC = {
  laxmi: { label: "Laxmi Nagar", accent: "#34d399", dim: "#34d39918", border: "#34d39930" },
  raya:  { label: "Raya",        accent: "#818cf8", dim: "#818cf818", border: "#818cf830" },
};
const BRANCH_KEYS = ["laxmi", "raya"];
const DEPT_OPTIONS = ["HOD", "Billing", "Uploading", "Intimation", "Query", "OPD"];
const TASK_STATUS   = ["Pending", "In Progress", "Completed", "On Hold"];
const TASK_PRIORITY = ["Low", "Medium", "High", "Urgent"];
const SUMMARY_TYPES = ["Normal", "LAMA", "Refer", "Death", "DAMA"];

const NAV = [
  { id: "home",        label: "Home",         icon: "🏠" },
  { id: "patients",    label: "Patients",      icon: "🧑‍⚕️" },
  { id: "discharge",   label: "Discharge",     icon: "🚪" },
  { id: "medicines",   label: "Medicines",     icon: "💊" },
  { id: "reports",     label: "Reports",       icon: "📋" },
  { id: "billing",     label: "Billing",       icon: "💳" },
  { id: "export",      label: "Export",        icon: "📥" },
  { id: "tasks",       label: "Task Manager",  icon: "✅" },
  { id: "taskreport",  label: "Task Report",   icon: "📊" },
  { id: "departments", label: "Departments",   icon: "🏢" },
  { id: "employees",   label: "Employees",     icon: "👥" },
  { id: "profile",     label: "My Profile",    icon: "👤" },
];

const SUMMARY_META = {
  Normal: { color: "#34d399", bg: "#34d39916" },
  LAMA:   { color: "#f59e0b", bg: "#f59e0b16" },
  Refer:  { color: "#34d399", bg: "#22d3ee16" },
  Death:  { color: "#f87171", bg: "#f8717116" },
  DAMA:   { color: "#c084fc", bg: "#c084fc16" },
};
const TASK_STATUS_META = {
  "Pending":     { color: "#f59e0b", bg: "#f59e0b18" },
  "In Progress": { color: "#38bdf8", bg: "#38bdf818" },
  "Completed":   { color: "#34d399", bg: "#34d39918" },
  "On Hold":     { color: "#f87171", bg: "#f8717118" },
};
const TASK_PRIORITY_META = {
  "Low":    { color: "#6b7280", bg: "#6b728018" },
  "Medium": { color: "#f59e0b", bg: "#f59e0b18" },
  "High":   { color: "#f87171", bg: "#f8717118" },
  "Urgent": { color: "#c084fc", bg: "#c084fc18" },
};
const DEPT_ICONS = { HOD:"👔", Billing:"💳", Uploading:"☁️", Intimation:"📢", Query:"❓", OPD:"🏥" };
const DEPT_ACCENT_CYCLE = ["#34d399","#818cf8","#f59e0b","#38bdf8","#f87171","#c084fc","#22d3ee"];

// ── UTILS ─────────────────────────────────────────────────────────────────────
const fmt    = (n)   => "₹" + Number(n).toLocaleString("en-IN");
const fmtDt  = (iso) => iso ? new Date(iso).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "—";
const initials = (name = "") => name.trim().split(" ").filter(Boolean).map(w => w[0]).join("").slice(0,2).toUpperCase();

const safeLoad = (key, fb) => { try { return JSON.parse(localStorage.getItem(key)||"null") || fb; } catch { return fb; } };
const safeSave = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

// ── EXPORT UTILS ──────────────────────────────────────────────────────────────
function exportPatientHistoryXLSX(pts, filename = "patient_history.xlsx") {
  const wb = XLSX.utils.book_new();
  const ROW1="FFEBF5FB", ROW2="FFFFFFFF", CASH_GRN="FFD5F5E3", CASH_YLW="FFFEF9E7", TOTAL_BG="FFF0F3F4";
  const hStyle = (bg="FF1A3C5E") => ({ font:{bold:true,color:{rgb:"FFFFFFFF"},sz:10,name:"Arial"}, fill:{patternType:"solid",fgColor:{rgb:bg}}, alignment:{horizontal:"center",vertical:"center",wrapText:true}, border:{top:{style:"thin",color:{rgb:"FFB2BEC3"}},bottom:{style:"thin",color:{rgb:"FFB2BEC3"}},left:{style:"thin",color:{rgb:"FFB2BEC3"}},right:{style:"thin",color:{rgb:"FFB2BEC3"}}} });
  const cStyle = (bg=ROW1, bold=false, color="FF000000") => ({ font:{sz:9,name:"Arial",bold,color:{rgb:color}}, fill:{patternType:"solid",fgColor:{rgb:bg}}, alignment:{horizontal:"center",vertical:"center",wrapText:true}, border:{top:{style:"thin",color:{rgb:"FFB2BEC3"}},bottom:{style:"thin",color:{rgb:"FFB2BEC3"}},left:{style:"thin",color:{rgb:"FFB2BEC3"}},right:{style:"thin",color:{rgb:"FFB2BEC3"}}} });
  const headers = ["SR.NO","PATIENT NAME","AGE","GENDER","UHID","BRANCH","DEPT","DOA","DOD","STATUS","SUMMARY TYPE","DOCTOR","PHONE","ADDRESS","PAYMENT TYPE"];
  const aoa = [["SANGI HOSPITAL — IPD PATIENT HISTORY RECORD",...Array(14).fill("")],[`Generated: ${new Date().toLocaleDateString("en-IN")}  |  Confidential`,...Array(14).fill("")],Array(15).fill(""),headers];
  pts.forEach((p, i) => { const adm = p.admissions?.[0] || {}; aoa.push([i+1,p.patientName||p.name||"—",p.age||adm.age||"—",p.gender||adm.gender||"—",p.uhid||"—",p._branchLabel||p.branch||"—",p.dept||adm.dept||"—",p.doa||adm.doa||"—",p.dod||adm.dod||"—",p.status||"Discharged",p.dischargeSummary?.type||adm.dischargeSummary?.type||"Normal",p.doctor||adm.doctor||"—",p.phone||adm.phone||"—",p.address||adm.address||"—",p.paymentMode||adm.paymentMode||"Cash"]); });
  aoa.push(["TOTAL PATIENTS","",pts.length,...Array(12).fill("")]);
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!merges"] = [{s:{r:0,c:0},e:{r:0,c:14}},{s:{r:1,c:0},e:{r:1,c:14}},{s:{r:aoa.length-1,c:0},e:{r:aoa.length-1,c:1}}];
  const enc = (r,c) => XLSX.utils.encode_cell({r,c});
  ws[enc(0,0)] = {v:"SANGI HOSPITAL — IPD PATIENT HISTORY RECORD",t:"s",s:{font:{bold:true,sz:14,name:"Arial",color:{rgb:"FFFFFFFF"}},fill:{patternType:"solid",fgColor:{rgb:"FF1A3C5E"}},alignment:{horizontal:"center",vertical:"center"}}};
  ws[enc(1,0)] = {v:`Generated: ${new Date().toLocaleDateString("en-IN")}  |  Confidential`,t:"s",s:{font:{italic:true,sz:10,name:"Arial",color:{rgb:"FFFFFFFF"}},fill:{patternType:"solid",fgColor:{rgb:"FF2E6DA4"}},alignment:{horizontal:"center",vertical:"center"}}};
  headers.forEach((h,c) => { ws[enc(3,c)] = {v:h,t:"s",s:hStyle()}; });
  pts.forEach((p,i) => { const r=4+i; const bg=i%2===0?ROW1:ROW2; const payment=aoa[r][14]; const payBg=payment==="Cash"?CASH_GRN:CASH_YLW; const payColor=payment==="Cash"?"FF1E8449":"FF7D6608"; const summType=aoa[r][10]; const summColor=summType==="Critical"?"FFC0392B":"FF1E8449"; for(let c=0;c<15;c++){const val=aoa[r][c];if(c===14)ws[enc(r,c)]={v:val,t:"s",s:cStyle(payBg,true,payColor)};else if(c===0)ws[enc(r,c)]={v:val,t:"n",s:cStyle("FFD6E4F0",true,"FF1A3C5E")};else if(c===10)ws[enc(r,c)]={v:val,t:"s",s:cStyle(bg,true,summColor)};else ws[enc(r,c)]={v:val,t:typeof val==="number"?"n":"s",s:cStyle(bg)};} });
  const tr=4+pts.length;
  ws[enc(tr,0)]={v:"TOTAL PATIENTS",t:"s",s:cStyle(TOTAL_BG,true,"FF1A3C5E")}; ws[enc(tr,2)]={v:pts.length,t:"n",s:cStyle(TOTAL_BG,true,"FF1A3C5E")};
  for(let c=1;c<15;c++) if(c!==2) ws[enc(tr,c)]={v:"",t:"s",s:cStyle(TOTAL_BG)};
  ws["!cols"]=[6,20,6,8,13,14,10,11,11,12,14,13,12,32,13].map(w=>({wch:w}));
  ws["!rows"]=[{hpt:28},{hpt:18},{hpt:6},{hpt:36},...pts.map(()=>({hpt:20})),{hpt:20}];
  XLSX.utils.book_append_sheet(wb, ws, "Patient History");
  XLSX.writeFile(wb, filename, {bookType:"xlsx",cellStyles:true});
}

function exportTasksXLSX(tasks, filename = "task_report.xlsx") {
  const wb = XLSX.utils.book_new();
  const headers = ["Task ID","Title","Assigned To","Department","Priority","Status","Due Date","Created Date","Description","Completed Date"];
  const rows = tasks.map((t,i) => [i+1,t.title,t.assignedTo,t.department,t.priority,t.status,t.dueDate||"—",t.createdAt?.split("T")[0]||"—",t.description||"—",t.completedAt?.split("T")[0]||"—"]);
  const aoa = [["SANGI HOSPITAL — TASK REPORT",...Array(9).fill("")],[`Generated: ${new Date().toLocaleDateString("en-IN")}`,...Array(9).fill("")],Array(10).fill(""),headers,...rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [6,24,18,14,10,12,12,12,40,12].map(w=>({wch:w}));
  XLSX.utils.book_append_sheet(wb, ws, "Task Report");
  XLSX.writeFile(wb, filename, {bookType:"xlsx"});
}

function exportCSV(filename, rows, headers) {
  const csv = [headers.join(","), ...rows.map(r => headers.map(h => `"${(r[h]??"").toString().replace(/"/g,'""')}"`).join(","))].join("\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"})); a.download = filename; a.click();
}
function exportTxt(filename, content) {
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([content],{type:"text/plain"})); a.download = filename; a.click();
}
function buildDischargeSummaryText(p, branchLabel, ds={}, mh={}, meds=[], reps=[]) {
  return `========================================\n  SANGI HOSPITAL — ${branchLabel.toUpperCase()}\n  DISCHARGE SUMMARY [${ds.type||"Normal"}]\n========================================\n\nPatient Name  : ${p.patientName||p.name||""}\nUHID          : ${p.uhid}\nAge / Gender  : ${p.ageYY||p.age||""}Y / ${p.gender||""}\nDepartment    : ${ds.wardName||p.dept||""}\nAdmit Date    : ${fmtDt(p.admissions?.[0]?.dateTime||p.admitDate)}\nDischarge Date: ${ds.dod||ds.date||"—"}\nExpected DOD  : ${ds.expectedDod||"—"}\nTreating Dr.  : ${ds.doctorName||mh.treatingDoctor||"—"}\n\n── CLINICAL ────────────────────────────\nDiagnosis     : ${ds.diagnosis||"—"}\nTreatment     : ${ds.treatment||"—"}\nFollow-up     : ${ds.followUp||"—"}\nNotes         : ${ds.notes||"—"}\n\n── MEDICAL HISTORY ─────────────────────\nPrevious Dx   : ${mh.previousDiagnosis||"—"}\nPast Surgeries: ${mh.pastSurgeries||"—"}\nAllergies     : ${mh.knownAllergies||"—"}\nChronic Cond. : ${mh.chronicConditions||"—"}\nCurrent Meds  : ${mh.currentMedications||"—"}\nSmoking       : ${mh.smokingStatus||"—"}\nAlcohol       : ${mh.alcoholUse||"—"}\n\n── MEDICINES PRESCRIBED ────────────────\n${meds.map(m=>`  - ${m.name} | Qty: ${m.qty} | Rate: ₹${m.rate}`).join("\n")||"  None"}\n\n── INVESTIGATIONS ──────────────────────\n${reps.map(r=>`  - ${r.name} (${r.date||""}): ${r.result||""}`).join("\n")||"  None"}\n\n========================================\n  Generated: ${new Date().toLocaleString("en-IN")}\n========================================`;
}

// ── SEED DATA ─────────────────────────────────────────────────────────────────
const SEED_MEDS = {
  laxmi: [[{id:1,name:"Aspirin",qty:30,rate:5},{id:2,name:"Atorvastatin",qty:14,rate:12}],[{id:1,name:"Ibuprofen",qty:20,rate:8},{id:2,name:"Calcium",qty:30,rate:6}]],
  raya:  [[{id:1,name:"Metformin",qty:60,rate:4},{id:2,name:"Glimepiride",qty:30,rate:9}],[{id:1,name:"Azithromycin",qty:5,rate:25},{id:2,name:"Paracetamol",qty:15,rate:3}]],
};
const SEED_REPS = {
  laxmi: [[{id:1,name:"ECG",date:"2026-03-29",result:"Normal sinus rhythm"},{id:2,name:"Blood Panel",date:"2026-03-30",result:"Cholesterol elevated"}],[{id:1,name:"X-Ray Knee",date:"2026-03-21",result:"Mild arthritis"}]],
  raya:  [[{id:1,name:"HbA1c",date:"2026-04-04",result:"8.2%"},{id:2,name:"FBS",date:"2026-04-03",result:"210 mg/dL"}],[{id:1,name:"Chest X-Ray",date:"2026-03-26",result:"Consolidation RLL"}]],
};

function seedPatients(dbBranch, branchKey) {
  return (dbBranch||[]).map((p,idx) => ({
    ...p,
    medicines: p.medicines || (SEED_MEDS[branchKey]?.[idx]||[]),
    reports:   p.reports   || (SEED_REPS[branchKey]?.[idx] ||[]),
    dischargeSummary: p.dischargeSummary || {type:"Normal",diagnosis:"",treatment:"",followUp:"",notes:"",doctorName:"",date:"",expectedDod:""},
  }));
}

// ── DYNAMIC CSS (theme-dependent only) ────────────────────────────────────────
// Only rules that reference `accent` or `isDark` live here.
// All static rules have been moved to index.css.
const DYNAMIC_CSS = (accent, isDark) => `
  option { background: ${isDark ? "#040710" : "#ffffff"}; }

  /* ── THEME: GLOBAL ── */
  body { background: ${isDark ? "#05080f" : "#f0f4ff"}; color: ${isDark ? "#e2e8f0" : "#1e293b"}; }

  ::-webkit-scrollbar-thumb { background: ${isDark ? "#1a2540" : "#c7d5eb"}; }

  /* ── HEADER ── */
  .hms-hdr        { background: ${isDark ? "#05080f" : "#f0f4ff"}; }
  .hms-logo-text  { color: ${isDark ? "#f1f5f9" : "#0f172a"}; }
  .hms-logo-sub   { color: ${isDark ? "#2d3a50" : "#94a3b8"}; }
  .hms-role-badge { background: ${accent}18; border: 1px solid ${accent}30; color: ${accent}; }
  .hms-avatar     { background: linear-gradient(135deg, ${accent}, #818cf8); }
  .hms-big-avatar { background: linear-gradient(135deg, ${accent}, #818cf8); }
  .hms-avatar-pill {
    background: ${isDark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.05)"};
    border: 1px solid ${isDark ? "#1e2a3a" : "#dde8f5"};
  }
  .hms-avatar-name { color: ${isDark ? "#94a3b8" : "#475569"}; }
  .hms-logout-btn {
    border: 1px solid ${isDark ? "#1e2a3a" : "#dde8f5"};
    color: ${isDark ? "#64748b" : "#64748b"};
  }
  .hms-theme-btn {
    border: 1px solid ${isDark ? "#1e2a3a" : "#dde8f5"};
    color: ${isDark ? "#64748b" : "#64748b"};
  }

  /* ── LAYOUT ── */
  .hms-wrap { background: ${isDark ? "#05080f" : "#f0f4ff"}; color: ${isDark ? "#e2e8f0" : "#1e293b"}; }

  /* ── SIDEBAR ── */
  .hms-sb { background: ${isDark ? "#080c18" : "#ffffff"}; }
  .hms-nav-section { color: ${isDark ? "#2d3a50" : "#94a3b8"}; }
  .hms-nav-item { color: ${isDark ? "#64748b" : "#64748b"}; }
  .hms-nav-item:hover { color: ${isDark ? "#f1f5f9" : "#0f172a"}; background: ${isDark ? "rgba(0,0,0,.05)" : "rgba(0,0,0,.05)"}; }
  .hms-nav-item.active {
    color: ${isDark ? "#f1f5f9" : "#0f172a"};
    background: ${isDark ? "rgba(0,0,0,.05)" : "rgba(0,0,0,.05)"};
    border-left: 2px solid ${accent};
    font-weight: 600;
  }
  .hms-signed-in   { color: ${isDark ? "#2d3a50" : "#94a3b8"}; }
  .hms-signed-name { color: ${isDark ? "#94a3b8" : "#475569"}; }
  .hms-signed-role { color: ${isDark ? "#64748b" : "#64748b"}; }

  /* ── BRANCH SELECT ── */
  .hms-branch-label  { color: ${isDark ? "#2d3a50" : "#94a3b8"}; }
  .hms-branch-select {
    border: 1px solid ${isDark ? "#1a2540" : "#c7d5eb"};
    background-color: ${isDark ? "#0b1120" : "#ffffff"};
    color: ${isDark ? "#e2e8f0" : "#1e293b"};
  }

  /* ── PAGE HEADERS ── */
  .hms-pg-label { color: ${isDark ? "#2d3a50" : "#94a3b8"}; }
  .hms-pg-sub   { color: ${isDark ? "#64748b" : "#64748b"}; }

  /* ── CARDS ── */
  .hms-card       { background: ${isDark ? "#0b1120" : "#ffffff"}; }
  .hms-card-title { color: ${isDark ? "#e2e8f0" : "#1e293b"}; }
  .hms-prof-card  { background: ${isDark ? "#080c18" : "#ffffff"}; }

  /* ── STAT ── */
  .hms-stat-card  { background: ${isDark ? "#0b1120" : "#ffffff"}; }
  .hms-stat-label { color: ${isDark ? "#64748b" : "#64748b"}; }

  /* ── TABLE ── */
  .hms-th     { color: ${isDark ? "#2d3a50" : "#94a3b8"}; }
  .hms-td     { color: ${isDark ? "#94a3b8" : "#475569"}; }
  .hms-td-hi  { color: ${isDark ? "#f1f5f9" : "#0f172a"}; }
  .hms-td-mono { color: ${isDark ? "#2d3a50" : "#94a3b8"}; }
  .hms-td-sm  { color: ${isDark ? "#64748b" : "#64748b"}; }

  /* ── BUTTONS ── */
  .hms-add-btn     { background: linear-gradient(135deg, ${accent}, ${accent}cc); }
  .hms-add-btn-lg  { background: linear-gradient(135deg, ${accent}, ${accent}cc); }
  .hms-cancel-btn  { color: ${isDark ? "#64748b" : "#64748b"}; }
  .hms-save-btn    { background: linear-gradient(135deg, ${accent}, ${accent}cc); }
  .hms-export-main-btn { background: linear-gradient(135deg, ${accent}, ${accent}cc); }

  /* ── FORMS ── */
  .hms-lbl      { color: ${isDark ? "#64748b" : "#64748b"}; }
  .hms-inp      { background: ${isDark ? "#080c18" : "#ffffff"}; color: ${isDark ? "#e2e8f0" : "#1e293b"}; }
  .hms-inp-sm   { background: ${isDark ? "#080c18" : "#ffffff"}; color: ${isDark ? "#e2e8f0" : "#1e293b"}; }
  .hms-sel      { background: ${isDark ? "#080c18" : "#ffffff"}; color: ${isDark ? "#e2e8f0" : "#1e293b"}; }
  .hms-textarea { background: ${isDark ? "#080c18" : "#ffffff"}; color: ${isDark ? "#e2e8f0" : "#1e293b"}; }
  .hms-pass-toggle { color: ${isDark ? "#64748b" : "#64748b"}; }

  /* ── MODAL ── */
  .hms-modal-overlay { background: ${isDark ? "rgba(0,0,0,.7)" : "rgba(5,15,40,.6)"}; }
  .hms-modal-box     { background: ${isDark ? "#0b1120" : "#ffffff"}; }
  .hms-modal-title   { color: ${isDark ? "#f1f5f9" : "#0f172a"}; }

  /* ── MISC ── */
  .hms-empty       { color: ${isDark ? "#2d3a50" : "#94a3b8"}; }
  .hms-view-key    { color: ${isDark ? "#64748b" : "#64748b"}; }
  .hms-view-val    { color: ${isDark ? "#e2e8f0" : "#1e293b"}; }
  .hms-section-label { color: ${isDark ? "#2d3a50" : "#94a3b8"}; }
  .hms-dept-card   { background: ${isDark ? "#0b1120" : "#ffffff"}; }
  .hms-progress-bar    { background: ${isDark ? "#1e2a3a" : "#dde8f5"}; }
  .hms-progress-bar-sm { background: ${isDark ? "#1e2a3a" : "#dde8f5"}; }
`;

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function ManagementAdminDashboard({ currentUser, db, onLogout }) {
  const homeBranch = currentUser?.branch || currentUser?.locations?.[0] || "laxmi";
  const [viewBranch,  setViewBranch]  = useState(homeBranch);
  const bc     = BC[viewBranch] || BC.laxmi;
  const accent = bc.accent;

  const [activeTab,  setActiveTab]  = useState("home");
  const [collapsed,  setCollapsed]  = useState(false);
  const [notif,      setNotif]      = useState(null);
  const [isDark,     setIsDark]     = useState(true);

  // 1. Keep the state so your edit buttons still work
  const [allPatients, setAllPatients] = useState({ laxmi: [], raya: [] });

  // Employees State (🌟 Added Edit ID tracker)
  const [employees,      setEmployees]      = useState([]);
  const [showEmpModal,   setShowEmpModal]   = useState(false);
  const [editEmpId,      setEditEmpId]      = useState(null); 
  const [empForm,        setEmpForm]        = useState({ fullName:"", username:"", empId:"", dept:"HOD", email:"", phone:"", role:"", password:"", confirmPassword:"" });

  // 2. Automatically load the real, secure data!
  useEffect(() => {
    if (db) setAllPatients(db);
    
    // 🌟 THE FIX: Fetch real employees from Django so we have their real integer IDs!
    const loadEmployees = async () => {
        try {
            const users = await apiService.getUsers();
            const mapped = users.map(u => ({
                id: u.id, // REAL DB INTEGER ID!
                empId: u.emp_id || "—",
                username: u.username,
                fullName: `${u.first_name} ${u.last_name}`.trim(),
                email: u.email,
                phone: u.phone_number,
                role: u.role,
                dept: u.role.toUpperCase(),
                status: u.is_active ? "Active" : "Inactive"
            }));
            setEmployees(mapped);
        } catch (err) { console.error("Failed to fetch employees", err); }
    };
    loadEmployees();
  }, [db]);

  // Departments
  const [departments,    setDepartments]    = useState(() => safeLoad("hms_mgmt_departments", []));
  const [showDeptModal,  setShowDeptModal]  = useState(false);
  const [deptForm,       setDeptForm]       = useState({ name:"", description:"", head:"" });
  const [empShowPass,    setEmpShowPass]    = useState(false);
  const [empShowConfirm, setEmpShowConfirm] = useState(false);
  const [empPassErr,     setEmpPassErr]     = useState("");

  // Tasks
  const [tasks,           setTasks]           = useState(() => safeLoad("hms_mgmt_tasks", []));
  const [showTaskModal,   setShowTaskModal]   = useState(false);
  const [editTask,        setEditTask]        = useState(null);
  const [taskForm,        setTaskForm]        = useState({ title:"", description:"", assignedTo:"", department:"HOD", priority:"Medium", status:"Pending", dueDate:"" });
  const [taskReportFilter,setTaskReportFilter]= useState({ period:"all", dept:"All", status:"All", empName:"" });

  // Patient modals
  const [showMedModal,      setShowMedModal]      = useState(false);
  const [showSummaryModal,  setShowSummaryModal]  = useState(false);
  const [showReportModal,   setShowReportModal]   = useState(false);
  const [showViewModal,     setShowViewModal]      = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editMedPt,         setEditMedPt]         = useState(null);
  const [editSumPt,         setEditSumPt]         = useState(null);
  const [editRepPt,         setEditRepPt]         = useState(null);
  const [viewPt,            setViewPt]            = useState(null);
  const [deletePt,          setDeletePt]          = useState(null);
  const [summaryForm,       setSummaryForm]       = useState({});
  const [newReport,         setNewReport]         = useState({ name:"", date:"", result:"" });
  const [dischSumFilter,    setDischSumFilter]    = useState("All");
  const [exportBranchFilter,setExportBranchFilter]= useState("All");
  const [exportType,        setExportType]        = useState("discharge");
  const [exportSumType,     setExportSumType]     = useState("All");

  const toast = (msg, type="ok") => { setNotif({msg,type}); setTimeout(()=>setNotif(null), 3200); };

  useEffect(() => safeSave("hms_mgmt_departments", departments), [departments]);
  useEffect(() => safeSave("hms_mgmt_employees",   employees),   [employees]);
  useEffect(() => safeSave("hms_mgmt_tasks",       tasks),       [tasks]);

  const locationPatients  = allPatients[viewBranch] || [];
  const allAdmissions     = useMemo(() => locationPatients.flatMap(p => (p.admissions||[]).map(a => ({...a, patientName:p.patientName||p.name, uhid:p.uhid, gender:p.gender, bloodGroup:p.bloodGroup, phone:p.phone}))), [locationPatients]);
  const currentlyAdmitted = allAdmissions.filter(a => !a.discharge?.dod).length;
  const discharged        = allAdmissions.filter(a =>  a.discharge?.dod).length;
  const allPatientsFlat   = useMemo(() => BRANCH_KEYS.flatMap(bk => (allPatients[bk]||[]).map(p=>({...p,_branch:bk,_branchLabel:BC[bk].label}))), [allPatients]);
  const allDeptOptions    = [...DEPT_OPTIONS, ...departments.filter(d=>!DEPT_OPTIONS.includes(d.name)).map(d=>d.name)];

  const updatePatient = (branchKey, uhid, updater) => setAllPatients(prev => ({...prev,[branchKey]:prev[branchKey].map(p=>p.uhid===uhid?updater(p):p)}));

  // ── PATIENT HELPERS ───────────────────────────────────────────────────────
  const openMedEditor = (p) => { setEditMedPt(JSON.parse(JSON.stringify(p))); setShowMedModal(true); };
  const updateMed = (idx, field, val) => setEditMedPt(prev => { const m=[...prev.medicines]; m[idx]={...m[idx],[field]:field==="name"?val:(+val||0)}; return {...prev,medicines:m}; });
  const addMedRow = () => setEditMedPt(prev => ({...prev,medicines:[...(prev.medicines||[]),{id:Date.now(),name:"",qty:1,rate:0}]}));
  const delMedRow = (idx) => setEditMedPt(prev => ({...prev,medicines:prev.medicines.filter((_,i)=>i!==idx)}));
  const saveMeds  = () => { updatePatient(viewBranch, editMedPt.uhid, p=>({...p,medicines:editMedPt.medicines})); toast("Medicines saved"); setShowMedModal(false); setEditMedPt(null); };

  const openSummaryEditor = (p) => { setEditSumPt(p); setSummaryForm({...(p.dischargeSummary||{type:"Normal",diagnosis:"",treatment:"",followUp:"",notes:"",doctorName:"",date:"",expectedDod:""})}); setShowSummaryModal(true); };
  const saveSummary = () => { updatePatient(viewBranch, editSumPt.uhid, p=>({...p,dischargeSummary:{...summaryForm}})); toast("Summary saved"); setShowSummaryModal(false); setEditSumPt(null); };
  const openViewModal = (p) => { setViewPt(p); setShowViewModal(true); };
  const confirmDelete = (p) => { setDeletePt(p); setShowDeleteConfirm(true); };
  const doDeleteSummary = () => { updatePatient(viewBranch, deletePt.uhid, p=>({...p,dischargeSummary:{type:"Normal",diagnosis:"",treatment:"",followUp:"",notes:"",doctorName:"",date:"",expectedDod:""}})); toast("Summary cleared"); setShowDeleteConfirm(false); setDeletePt(null); };

  const openReportEditor = (p) => { setEditRepPt(JSON.parse(JSON.stringify(p))); setNewReport({name:"",date:"",result:""}); setShowReportModal(true); };
  const addReport    = () => { if (!newReport.name) return; setEditRepPt(prev=>({...prev,reports:[...(prev.reports||[]),{id:Date.now(),...newReport}]})); setNewReport({name:"",date:"",result:""}); };
  const delReport    = (idx) => setEditRepPt(prev=>({...prev,reports:prev.reports.filter((_,i)=>i!==idx)}));
  const updateReport = (idx, field, val) => setEditRepPt(prev=>{ const r=[...prev.reports]; r[idx]={...r[idx],[field]:val}; return {...prev,reports:r}; });
  const saveReports  = () => { updatePatient(viewBranch, editRepPt.uhid, p=>({...p,reports:editRepPt.reports})); toast("Reports saved"); setShowReportModal(false); setEditRepPt(null); };

  // ── TASK HELPERS ──────────────────────────────────────────────────────────
  const openNewTask  = () => { setEditTask(null); setTaskForm({title:"",description:"",assignedTo:"",department:"HOD",priority:"Medium",status:"Pending",dueDate:""}); setShowTaskModal(true); };
  const openEditTask = (t) => { setEditTask(t); setTaskForm({title:t.title,description:t.description||"",assignedTo:t.assignedTo,department:t.department,priority:t.priority,status:t.status,dueDate:t.dueDate||""}); setShowTaskModal(true); };
  const saveTask = () => {
    if (!taskForm.title || !taskForm.assignedTo) { toast("Title and Assigned To are required","err"); return; }
    if (editTask) {
      setTasks(prev => prev.map(t => t.id===editTask.id ? {...t,...taskForm,updatedAt:new Date().toISOString(),completedAt:taskForm.status==="Completed"?(t.completedAt||new Date().toISOString()):undefined} : t));
      toast("Task updated");
    } else {
      setTasks(prev => [{...taskForm,id:`TASK-${Date.now()}`,createdAt:new Date().toISOString(),createdBy:currentUser?.name||"Admin"},...prev]);
      toast("Task assigned");
    }
    setShowTaskModal(false); setEditTask(null);
  };
  const deleteTask       = (id)     => { setTasks(prev=>prev.filter(t=>t.id!==id)); toast("Task deleted"); };
  const updateTaskStatus = (id,status) => { setTasks(prev=>prev.map(t=>t.id===id?{...t,status,updatedAt:new Date().toISOString(),completedAt:status==="Completed"?new Date().toISOString():t.completedAt}:t)); toast(`Task marked ${status}`); };

  const filteredTaskReport = useMemo(() => {
    const now = new Date();
    return tasks.filter(t => {
      const created = new Date(t.createdAt);
      if (taskReportFilter.period==="today" && created.toDateString()!==now.toDateString()) return false;
      if (taskReportFilter.period==="week") { const w=new Date(now); w.setDate(w.getDate()-7); if(created<w) return false; }
      if (taskReportFilter.period==="month" && (created.getMonth()!==now.getMonth()||created.getFullYear()!==now.getFullYear())) return false;
      if (taskReportFilter.dept!=="All" && t.department!==taskReportFilter.dept) return false;
      if (taskReportFilter.status!=="All" && t.status!==taskReportFilter.status) return false;
      if (taskReportFilter.empName && !t.assignedTo.toLowerCase().includes(taskReportFilter.empName.toLowerCase())) return false;
      return true;
    });
  }, [tasks, taskReportFilter]);

  // ── DEPT / EMP HELPERS ────────────────────────────────────────────────────
  const saveDepartment = () => {
    if (!deptForm.name) { toast("Department name required","err"); return; }
    setDepartments(prev=>[...prev,{id:`DEPT-${Date.now()}`,...deptForm,createdAt:new Date().toISOString(),memberCount:0}]);
    setShowDeptModal(false); setDeptForm({name:"",description:"",head:""}); toast("Department created");
  };
  const openEditEmployee = (emp) => {
    setEditEmpId(emp.id); // Save real DB ID
    setEmpForm({
      fullName: emp.fullName || emp.name, username: emp.username, empId: emp.empId,
      dept: emp.dept || "HOD", email: emp.email, phone: emp.phone, role: emp.role,
      password: "", confirmPassword: "" // Keep blank so we don't accidentally overwrite it
    });
    setEmpPassErr(""); setShowEmpModal(true);
  };

  const saveEmployee = async () => {
    if (!empForm.fullName||!empForm.username||!empForm.empId||!empForm.email||!empForm.phone||!empForm.dept) { 
      setEmpPassErr("Please fill all required fields"); return; 
    }
    if (empForm.password !== empForm.confirmPassword) { 
      setEmpPassErr("Passwords do not match"); return; 
    }
    if (!editEmpId && !empForm.password) {
      setEmpPassErr("Password is required for new employees"); return;
    }

    try {
      const [firstName, ...lastNameArr] = empForm.fullName.split(' ');
      
      let mappedRole = 'receptionist';
      const combined = (String(empForm.role) + " " + String(empForm.dept)).toLowerCase();
      if (combined.includes('office')) mappedRole = 'office_admin';
      else if (combined.includes('branch') || combined.includes('admin')) mappedRole = 'admin';
      else if (combined.includes('hod')) mappedRole = 'hod';
      else if (combined.includes('bill')) mappedRole = 'billing';
      else if (combined.includes('opd')) mappedRole = 'opd';
      else if (combined.includes('intimation')) mappedRole = 'intimation';
      else if (combined.includes('query')) mappedRole = 'query';
      else if (combined.includes('uploading')) mappedRole = 'uploading';

      const payload = {
        username: empForm.username, email: empForm.email, first_name: firstName,
        last_name: lastNameArr.join(' ') || "", emp_id: empForm.empId,
        phone_number: empForm.phone, role: mappedRole, 
        branch: viewBranch === 'laxmi' ? 'LNM' : 'RYM' 
      };

      // Only send password to Django if they typed a new one!
      if (empForm.password) {
        payload.password = empForm.password; payload.confirm_password = empForm.confirmPassword;
      }

      if (editEmpId) {
        await apiService.updateUser(editEmpId, payload);
        toast("Employee updated successfully!");
      } else {
        await apiService.createUser(payload);
        toast("Employee securely created!");
      }

      // Instantly refresh table with Django data
      const users = await apiService.getUsers();
      setEmployees(users.map(u => ({
          id: u.id, empId: u.emp_id || "—", username: u.username,
          fullName: `${u.first_name} ${u.last_name}`.trim(), email: u.email,
          phone: u.phone_number, role: u.role, dept: u.role.toUpperCase(),
          status: u.is_active ? "Active" : "Inactive"
      })));

      setShowEmpModal(false); setEditEmpId(null);
      setEmpForm({fullName:"",username:"",empId:"",dept:"HOD",email:"",phone:"",role:"",password:"",confirmPassword:""}); 
    } catch (error) {
      setEmpPassErr(error.response?.data?.detail || "Failed to save user. Username or Emp ID might exist.");
    }
  };

  const handleToggleActive = async (emp, index) => {
    const isCurrentlyActive = emp.status !== "Inactive";
    const newStatusLabel = isCurrentlyActive ? "Inactive" : "Active";
    try {
      await apiService.updateUser(emp.id, { is_active: !isCurrentlyActive });
      setEmployees(prev => prev.map((e, ei) => ei === index ? { ...e, status: newStatusLabel } : e));
      toast(`Employee ${newStatusLabel === "Active" ? "activated" : "deactivated"} successfully!`);
    } catch (error) {
      toast("Failed to update employee status in the database.", "err");
    }
  };

  // ── EXPORT HELPERS ────────────────────────────────────────────────────────
  const getExportPatients = () => {
    let pts = exportBranchFilter==="All" ? allPatientsFlat : allPatientsFlat.filter(p=>p._branchLabel===exportBranchFilter);
    if (exportSumType!=="All") pts = pts.filter(p=>p.dischargeSummary?.type===exportSumType);
    return pts;
  };
  const doExport = () => {
    const pts = getExportPatients(); if (!pts.length) { toast("No records match","err"); return; }
    if (exportType==="discharge")      { pts.forEach(p=>{ const adm=p.admissions?.[0]||{}; exportTxt(`discharge_${p.uhid}.txt`,buildDischargeSummaryText(p,p._branchLabel,{...adm.discharge,...(p.dischargeSummary||{})},adm.medicalHistory||p.medicalHistory||{},p.medicines||[],p.reports||[])); }); toast(`Exported ${pts.length} discharge summary(s)`); }
    else if (exportType==="medical")   { pts.forEach(p=>{ const mh=(p.admissions?.[0]||{}).medicalHistory||p.medicalHistory||{}; exportTxt(`medhistory_${p.uhid}.txt`,`SANGI HOSPITAL — ${p._branchLabel}\nMEDICAL HISTORY\n\nPatient: ${p.patientName||p.name}\nUHID: ${p.uhid}\n\nPrevious Dx: ${mh.previousDiagnosis||"—"}\nPast Surgeries: ${mh.pastSurgeries||"—"}\nAllergies: ${mh.knownAllergies||"—"}\nChronic: ${mh.chronicConditions||"—"}\nCurrent Meds: ${mh.currentMedications||"—"}\nSmoking: ${mh.smokingStatus||"—"}\nAlcohol: ${mh.alcoholUse||"—"}\nNotes: ${mh.notes||"—"}`); }); toast(`Exported ${pts.length} file(s)`); }
    else if (exportType==="medicines") { exportCSV("medicines_export.csv",pts.flatMap(p=>(p.medicines||[]).map(m=>({Branch:p._branchLabel,Patient:p.patientName||p.name,UHID:p.uhid,Medicine:m.name,Qty:m.qty,Rate:m.rate,Total:m.qty*m.rate}))),["Branch","Patient","UHID","Medicine","Qty","Rate","Total"]); toast("Medicines CSV exported"); }
    else if (exportType==="reports")   { exportCSV("reports_export.csv",pts.flatMap(p=>(p.reports||[]).map(r=>({Branch:p._branchLabel,Patient:p.patientName||p.name,UHID:p.uhid,Report:r.name,Date:r.date,Result:r.result}))),["Branch","Patient","UHID","Report","Date","Result"]); toast("Reports CSV exported"); }
    else if (exportType==="patientHistory") { exportPatientHistoryXLSX(pts,"patient_history.xlsx"); toast("Patient history Excel exported ✓"); }
  };

  // ── SMALL RENDER HELPERS ──────────────────────────────────────────────────
  const Badge = ({ col, children }) => (
    <span className="hms-badge" style={{ background:`${col}20`, color:col, borderColor:`${col}40` }}>{children}</span>
  );
  const Pill = ({ col, bg, children, small }) => (
    <span className={small?"hms-pill-sm":"hms-pill"} style={{ background:bg||`${col}20`, color:col, borderColor:`${col}40` }}>{children}</span>
  );
  const SummaryPill = ({ type }) => { const m=SUMMARY_META[type]||{color:"#6b7280",bg:"#6b728018"}; return <Pill col={m.color} bg={m.bg}><span className="hms-pill-dot" style={{ background:m.color }}/>{type||"Normal"}</Pill>; };
  const StatusPill  = ({ s }) => { const m=TASK_STATUS_META[s]||{color:"#6b7280",bg:"#6b728018"}; return <Pill col={m.color} bg={m.bg}>{s}</Pill>; };
  const PriorityPill= ({ p }) => { const m=TASK_PRIORITY_META[p]||{color:"#6b7280",bg:"#6b728018"}; return <Pill small col={m.color} bg={m.bg}>{p}</Pill>; };
  const ActionBtn   = ({ col, onClick, children }) => <button className="hms-action-btn" style={{ borderColor:`${col}40`, color:col }} onClick={onClick}>{children}</button>;
  const Th = ({ children }) => <th className="hms-th">{children}</th>;
  const Td = ({ children, hi, mono, sm, style:s }) => <td className={`hms-td${hi?" hms-td-hi":""}${mono?" hms-td-mono":""}${sm?" hms-td-sm":""}`} style={s}>{children}</td>;

  const ProgressBar = ({ pct, col }) => (
    <div className="hms-progress-bar">
      <div className="hms-progress-fill" style={{ width:`${pct}%`, background:col }}/>
    </div>
  );

  const BranchHeader = ({ title }) => (
    <div style={{ marginBottom:18 }}>
      <div className="hms-pg-label">{title}</div>
      <span className="hms-branch-pill" style={{ background:bc.dim, border:`1px solid ${bc.border}`, color:accent }}>
        <span className="hms-branch-dot" style={{ width:7,height:7,borderRadius:"50%",background:accent,display:"inline-block" }}/> {bc.label}
      </span>
    </div>
  );
  const PageHeader = ({ title, subtitle }) => (
    <div style={{ marginBottom:20 }}>
      <div className="hms-pg-label">{title}</div>
      {subtitle && <div className="hms-pg-sub">{subtitle}</div>}
    </div>
  );
  const CardRow = ({ title, action }) => (
    <div className="hms-card-row"><div className="hms-card-title">{title}</div>{action}</div>
  );
  const TableWrap = ({ heads, children }) => (
    <div style={{ overflowX:"auto" }}>
      <table className="hms-tbl">
        <thead><tr>{heads.map(h=><Th key={h}>{h}</Th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
  const EmptyState = ({ icon, label, sub }) => (
    <div style={{ textAlign:"center", padding:"3rem", color:"#64748b" }}>
      {icon && <div style={{ fontSize:40, marginBottom:12 }}>{icon}</div>}
      <div style={{ fontSize:14, fontWeight:600, color:"#94a3b8", marginBottom:6 }}>{label}</div>
      {sub && <div style={{ fontSize:12 }}>{sub}</div>}
    </div>
  );
  const StatCard = ({ col, icon, label, val, sub, topBorder }) => (
    <div className="hms-stat-card" style={{ borderTop:topBorder?`3px solid ${col}`:undefined, border:`1px solid ${col}15` }}>
      {icon && <div className="hms-stat-icon">{icon}</div>}
      {topBorder && <div style={{ fontSize:10, color:col, fontWeight:700, textTransform:"uppercase", letterSpacing:".08em", marginBottom:8 }}>{label}</div>}
      <div className="hms-stat-num" style={{ fontSize:topBorder?26:22, color:col }}>{val}</div>
      {topBorder ? <div className="hms-stat-label">{sub}</div> : <div className="hms-stat-label">{label}</div>}
    </div>
  );

  const downloadDischarge = (p, branchLabel) => {
    const adm=p.admissions?.[0]||{}; const ds=p.dischargeSummary||{}; const mh=adm.medicalHistory||p.medicalHistory||{};
    exportTxt(`discharge_${p.uhid}.txt`, buildDischargeSummaryText(p, branchLabel, {...adm.discharge,...ds}, mh, p.medicines||[], p.reports||[]));
    toast("Downloaded");
  };

  // ── PAGE: HOME ────────────────────────────────────────────────────────────
  const renderHome = () => {
    const pendingTasks = tasks.filter(t=>t.status==="Pending").length;
    const urgentTasks  = tasks.filter(t=>t.priority==="Urgent"&&t.status!=="Completed").length;
    const stats = [
      { label:"Branch Patients",    val:locationPatients.length, col:accent,    icon:"🧑‍⚕️", sub:"All records" },
      { label:"Total Admissions",   val:allAdmissions.length,    col:"#22d3ee", icon:"📋", sub:"All time" },
      { label:"Currently Admitted", val:currentlyAdmitted,       col:"#34d399", icon:"🏥", sub:"Active" },
      { label:"Discharged",         val:discharged,              col:"#8b949e", icon:"🚪", sub:"Completed" },
      { label:"Total Tasks",        val:tasks.length,            col:"#818cf8", icon:"✅", sub:"All tasks" },
      { label:"Pending Tasks",      val:pendingTasks,            col:"#f59e0b", icon:"⏳", sub:"Awaiting action" },
      { label:"Urgent Tasks",       val:urgentTasks,             col:"#f87171", icon:"🚨", sub:"Need attention" },
      { label:"Departments",        val:departments.length,      col:"#34d399", icon:"🏢", sub:"Active depts" },
    ];
    return (
      <div>
        <BranchHeader title="Home"/>
        <div className="hms-prof-card" style={{ display:"flex", alignItems:"flex-start", gap:18, border:`1px solid ${accent}30` }}>
          <div className="hms-big-avatar">{initials(currentUser?.name)}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:16, fontWeight:700, marginBottom:3 }}>{currentUser?.name}</div>
            <div style={{ fontSize:11, color:accent, fontWeight:600, marginBottom:2 }}>{currentUser?.dept||currentUser?.role?.toUpperCase()}</div>
            <div style={{ fontSize:10, color:"#64748b" }}>{bc.label} Branch</div>
            <div style={{ display:"flex", gap:8, marginTop:10, flexWrap:"wrap" }}>
              {currentUser?.dept && <Badge col={accent}>{currentUser.dept}</Badge>}
              <Badge col={currentUser?.status==="Inactive"?"#f87171":"#34d399"}>{currentUser?.status||"Active"}</Badge>
              <Badge col="#6b7280">{currentUser?.id}</Badge>
            </div>
          </div>
        </div>
        <div className="hms-stat-grid">
          {stats.map((s,i) => <StatCard key={i} topBorder {...s}/>)}
        </div>
        {tasks.length>0 && (
          <div className="hms-card">
            <CardRow title="Recent Tasks" action={<button className="hms-add-btn" onClick={()=>setActiveTab("tasks")}>View All</button>}/>
            <TableWrap heads={["Task","Assigned To","Dept","Priority","Status","Due"]}>
              {tasks.slice(0,5).map((t,i)=>(
                <tr key={i}>
                  <Td hi>{t.title}</Td>
                  <Td>{t.assignedTo}</Td>
                  <Td><Badge col={accent}>{t.department}</Badge></Td>
                  <Td><PriorityPill p={t.priority}/></Td>
                  <Td><StatusPill s={t.status}/></Td>
                  <Td sm>{fmtDt(t.dueDate)}</Td>
                </tr>
              ))}
            </TableWrap>
          </div>
        )}
        <div className="hms-card">
          <CardRow title={`Recent Patients — ${bc.label}`} action={<button className="hms-add-btn" onClick={()=>setActiveTab("patients")}>View All</button>}/>
          {locationPatients.length===0 ? <div className="hms-empty">No patients yet.</div> : (
            <TableWrap heads={["Patient","UHID","Ward","Doctor","Summary","Status","Admit Date"]}>
              {locationPatients.slice(0,5).map((p,i)=>{
                const last=p.admissions?.[p.admissions.length-1]; const d=last?.discharge||{}; const status=d.dod?"Discharged":"Admitted";
                return (
                  <tr key={i}>
                    <Td><span className="hms-td-hi">{p.patientName||p.name}</span><div className="hms-td-mono" style={{ marginTop:2 }}>{p.gender} · {p.ageYY||p.age}y</div></Td>
                    <Td mono>{p.uhid}</Td>
                    <Td>{d.wardName||"—"}</Td>
                    <Td sm>{d.doctorName||"—"}</Td>
                    <Td><span style={{ cursor:"pointer" }} onClick={()=>openSummaryEditor(p)}><SummaryPill type={p.dischargeSummary?.type}/></span></Td>
                    <Td><Badge col={status==="Admitted"?"#34d399":"#8b949e"}>{status}</Badge></Td>
                    <Td sm>{fmtDt(last?.dateTime)}</Td>
                  </tr>
                );
              })}
            </TableWrap>
          )}
        </div>
      </div>
    );
  };

  // ── PAGE: PATIENTS ────────────────────────────────────────────────────────
  const renderPatients = () => (
    <div>
      <BranchHeader title="Patients"/>
      <div className="hms-ro-banner">◎ View + Edit Qty/Rates/Summaries · {currentUser?.dept||currentUser?.role} · {bc.label}</div>
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:16 }}>
        {[{label:"Total",val:allAdmissions.length,col:accent},{label:"Admitted",val:currentlyAdmitted,col:"#34d399"},{label:"Discharged",val:discharged,col:"#8b949e"}].map((s,i)=>(
          <div key={i} className="hms-stat-card" style={{ padding:"10px 14px", border:`1px solid ${s.col}18` }}>
            <div className="hms-stat-num" style={{ fontSize:16, color:s.col }}>{s.val}</div>
            <div className="hms-stat-label">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="hms-card">
        {locationPatients.length===0 ? <div className="hms-empty">No patients for {bc.label}.</div> : (
          <TableWrap heads={["Patient/UHID","Contact","Ward/Bed","Doctor","Summary","DOA","DOD","Status","Actions"]}>
            {locationPatients.flatMap((p,pi)=>(p.admissions||[]).map((adm,ai)=>{
              const d=adm.discharge||{}; const status=d.dod?"Discharged":"Admitted";
              return (
                <tr key={`${pi}-${ai}`}>
                  <Td><span className="hms-td-hi">{p.patientName||p.name}</span><div className="hms-td-mono">{p.uhid}</div></Td>
                  <Td sm><div>{p.phone}</div><div style={{ color:"#64748b", fontSize:9 }}>{p.email}</div></Td>
                  <Td>{d.wardName||"—"}<div className="hms-td-mono">{d.bedNo}</div></Td>
                  <Td sm>{d.doctorName||"—"}</Td>
                  <Td><span style={{ cursor:"pointer" }} onClick={()=>openSummaryEditor(p)}><SummaryPill type={p.dischargeSummary?.type}/></span></Td>
                  <Td sm>{fmtDt(d.doa)}</Td>
                  <Td sm>{fmtDt(d.dod)}</Td>
                  <Td><Badge col={status==="Admitted"?"#34d399":"#8b949e"}>{status}</Badge></Td>
                  <Td>
                    <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                      <ActionBtn col="#34d399" onClick={()=>openMedEditor(p)}>Meds</ActionBtn>
                      <ActionBtn col="#34d399" onClick={()=>openReportEditor(p)}>Reports</ActionBtn>
                      <ActionBtn col="#f59e0b" onClick={()=>downloadDischarge(p,bc.label)}>↓</ActionBtn>
                    </div>
                  </Td>
                </tr>
              );
            }))}
          </TableWrap>
        )}
      </div>
    </div>
  );

  // ── PAGE: DISCHARGE ───────────────────────────────────────────────────────
  const renderDischarge = () => {
    const summaryStats = SUMMARY_TYPES.reduce((acc,t)=>{acc[t]=locationPatients.filter(p=>p.dischargeSummary?.type===t).length; return acc;},{});
    const unset = locationPatients.filter(p=>!p.dischargeSummary?.diagnosis).length;
    const filtered = dischSumFilter==="All" ? locationPatients : locationPatients.filter(p=>p.dischargeSummary?.type===dischSumFilter);
    return (
      <div>
        <BranchHeader title="Discharge Summaries"/>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:16 }}>
          {[{label:"Total",val:locationPatients.length,col:accent},...SUMMARY_TYPES.map(t=>({label:t,val:summaryStats[t]||0,col:SUMMARY_META[t].color})),{label:"Pending",val:unset,col:"#64748b"}].map((s,i)=>(
            <div key={i} className="hms-stat-card" style={{ padding:"10px 14px", minWidth:90, border:`1px solid ${s.col}15` }}>
              <div className="hms-stat-num" style={{ fontSize:18, color:s.col }}>{s.val}</div>
              <div className="hms-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ marginBottom:14 }}>
          <select className="hms-branch-select" style={{ width:"auto", padding:"7px 28px 7px 12px" }} value={dischSumFilter} onChange={e=>setDischSumFilter(e.target.value)}>
            <option value="All">All Types</option>
            {SUMMARY_TYPES.map(t=><option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="hms-card">
          <CardRow title={`${filtered.length} Record${filtered.length!==1?"s":""} — ${bc.label}`}
            action={<ActionBtn col="#f59e0b" onClick={()=>{ filtered.forEach(p=>{ downloadDischarge(p,bc.label); }); toast(`Downloaded ${filtered.length} summaries`); }}>↓ Export All</ActionBtn>}/>
          {filtered.length===0 ? <div className="hms-empty">No summaries match this filter.</div> : (
            <TableWrap heads={["Patient","UHID","Type","Diagnosis","Doctor","Discharge Date","Exp. DOD","Meds","Reports","Actions"]}>
              {filtered.map((p,i)=>{
                const ds=p.dischargeSummary||{}; const adm=p.admissions?.[0]||{}; const d=adm.discharge||{};
                return (
                  <tr key={i} className="hms-tr-alt">
                    <Td><span className="hms-td-hi">{p.patientName||p.name}</span><div className="hms-td-mono">{p.gender} · {p.ageYY||p.age}y</div></Td>
                    <Td mono>{p.uhid}</Td>
                    <Td><SummaryPill type={ds.type}/></Td>
                    <Td>{ds.diagnosis?<span>{ds.diagnosis}</span>:<span style={{ color:"#64748b", fontStyle:"italic", fontSize:10 }}>Not set</span>}</Td>
                    <Td sm>{ds.doctorName||d.doctorName||"—"}</Td>
                    <Td sm>{fmtDt(ds.date||d.dod)}</Td>
                    <Td>{(ds.expectedDod||d.expectedDod)?<span className="hms-exp-dod-pill">⏱ {fmtDt(ds.expectedDod||d.expectedDod)}</span>:<span style={{ color:"#64748b", fontSize:10 }}>—</span>}</Td>
                    <Td><Badge col="#34d399">{(p.medicines||[]).length}</Badge></Td>
                    <Td><Badge col="#34d399">{(p.reports||[]).length}</Badge></Td>
                    <Td>
                      <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                        <ActionBtn col="#34d399" onClick={()=>openViewModal(p)}>View</ActionBtn>
                        <ActionBtn col={accent} onClick={()=>openSummaryEditor(p)}>Edit</ActionBtn>
                        <ActionBtn col="#f59e0b" onClick={()=>downloadDischarge(p,bc.label)}>↓</ActionBtn>
                        <ActionBtn col="#f87171" onClick={()=>confirmDelete(p)}>✕</ActionBtn>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </TableWrap>
          )}
        </div>
      </div>
    );
  };

  // ── PAGE: MEDICINES ───────────────────────────────────────────────────────
  const renderMedicines = () => (
    <div>
      <BranchHeader title="Medicines"/>
      {locationPatients.map(p=>{
        const medTotal=(p.medicines||[]).reduce((s,m)=>s+(m.qty*m.rate),0);
        return (
          <div key={p.uhid} className="hms-card">
            <CardRow title={<><span className="hms-td-hi">{p.patientName||p.name}</span> <span className="hms-td-mono">{p.uhid}</span> <span style={{ color:"#f59e0b" }}>· {fmt(medTotal)}</span></>}
              action={<button className="hms-add-btn" onClick={()=>openMedEditor(p)}>Edit Medicines</button>}/>
            {!(p.medicines||[]).length ? <div className="hms-empty">No medicines.</div> : (
              <TableWrap heads={["Medicine","Qty","Rate/unit","Total"]}>
                {(p.medicines||[]).map((m,i)=>(
                  <tr key={i}>
                    <Td hi>{m.name}</Td>
                    <Td><Badge col={accent}>{m.qty}</Badge></Td>
                    <Td>{fmt(m.rate)}</Td>
                    <Td><span style={{ color:"#f59e0b", fontWeight:700 }}>{fmt(m.qty*m.rate)}</span></Td>
                  </tr>
                ))}
              </TableWrap>
            )}
          </div>
        );
      })}
      {!locationPatients.length && <div className="hms-card hms-empty">No patients for {bc.label}.</div>}
    </div>
  );

  // ── PAGE: REPORTS ─────────────────────────────────────────────────────────
  const renderReports = () => (
    <div>
      <BranchHeader title="Reports"/>
      {locationPatients.map(p=>(
        <div key={p.uhid} className="hms-card">
          <CardRow title={<><span className="hms-td-hi">{p.patientName||p.name}</span> <span className="hms-td-mono">{p.uhid} · {(p.reports||[]).length} report(s)</span></>}
            action={
              <div style={{ display:"flex", gap:8 }}>
                <ActionBtn col="#f59e0b" onClick={()=>{exportCSV(`reports_${p.uhid}.csv`,(p.reports||[]).map(r=>({Report:r.name,Date:r.date,Result:r.result})),["Report","Date","Result"]);toast("Downloaded");}}>↓ CSV</ActionBtn>
                <button className="hms-add-btn" onClick={()=>openReportEditor(p)}>Edit</button>
              </div>
            }/>
          {!(p.reports||[]).length ? <div className="hms-empty">No reports.</div> : (
            <TableWrap heads={["Report","Date","Result"]}>
              {(p.reports||[]).map((r,i)=>(
                <tr key={i}><Td hi>{r.name}</Td><Td sm>{r.date}</Td><Td>{r.result}</Td></tr>
              ))}
            </TableWrap>
          )}
        </div>
      ))}
      {!locationPatients.length && <div className="hms-card hms-empty">No patients.</div>}
    </div>
  );

  // ── PAGE: BILLING ─────────────────────────────────────────────────────────
  const renderBilling = () => {
    const billRows = locationPatients.flatMap(p=>(p.admissions||[]).filter(a=>a.billing&&(parseFloat(a.billing.paidNow)||0)+(parseFloat(a.billing.advance)||0)>0).map(a=>({patient:p.patientName||p.name,uhid:p.uhid,admNo:a.admNo,advance:parseFloat(a.billing.advance)||0,paidNow:parseFloat(a.billing.paidNow)||0,discount:parseFloat(a.billing.discount)||0,mode:a.billing.paymentMode||"—",total:(parseFloat(a.billing.advance)||0)+(parseFloat(a.billing.paidNow)||0)})));
    const grandTotal=billRows.reduce((s,r)=>s+r.total,0); const totalAdv=billRows.reduce((s,r)=>s+r.advance,0);
    return (
      <div>
        <BranchHeader title="Billing"/>
        <div className="hms-stat-grid">
          {[{label:"Total Collected",val:fmt(grandTotal),col:"#f59e0b"},{label:"Advance",val:fmt(totalAdv),col:"#34d399"},{label:"Records",val:billRows.length,col:"#34d399"}].map((s,i)=>(
            <div key={i} className="hms-stat-card" style={{ border:`1px solid ${s.col}18` }}>
              <div className="hms-stat-num" style={{ color:s.col }}>{s.val}</div>
              <div className="hms-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="hms-card">
          {!billRows.length ? <div className="hms-empty">No billing records.</div> : (
            <TableWrap heads={["Patient","UHID","Adm#","Advance","Paid","Discount","Mode","Total"]}>
              {billRows.map((r,i)=>(
                <tr key={i}>
                  <Td hi>{r.patient}</Td>
                  <Td mono>{r.uhid}</Td>
                  <Td><Badge col={accent}>#{r.admNo}</Badge></Td>
                  <Td><span style={{ color:"#34d399", fontWeight:700 }}>{fmt(r.advance)}</span></Td>
                  <Td><span style={{ color:"#34d399", fontWeight:700 }}>{fmt(r.paidNow)}</span></Td>
                  <Td>{r.discount>0?<span style={{ color:"#c084fc" }}>{fmt(r.discount)}</span>:"—"}</Td>
                  <Td sm>{r.mode}</Td>
                  <Td><span style={{ color:"#f59e0b", fontWeight:700 }}>{fmt(r.total)}</span></Td>
                </tr>
              ))}
            </TableWrap>
          )}
        </div>
      </div>
    );
  };

  // ── PAGE: EXPORT ──────────────────────────────────────────────────────────
  const renderExport = () => {
    const exportOptions = [
      {id:"discharge",     label:"Discharge Summary",   desc:"Full clinical summary .txt per patient", icon:"📋"},
      {id:"medical",       label:"Medical History",      desc:"Medical history .txt per patient",       icon:"🏥"},
      {id:"medicines",     label:"Medicines",            desc:"Medicines with qty & rates as .csv",     icon:"💊"},
      {id:"reports",       label:"Investigation Reports",desc:"Lab/radiology results as .csv",          icon:"🔬"},
      {id:"patientHistory",label:"Patient History",      desc:"Full patient list as .xlsx",             icon:"📊"},
    ];
    const previewPts = getExportPatients();
    return (
      <div>
        <PageHeader title="Export" subtitle="Download summaries and data for any branch"/>
        <div className="hms-g2" style={{ marginBottom:20 }}>
          <div className="hms-card">
            <div className="hms-section-label">Filters</div>
            <label className="hms-lbl">Branch</label>
            <select className="hms-sel" value={exportBranchFilter} onChange={e=>setExportBranchFilter(e.target.value)}>
              <option value="All">All Branches</option><option value="Laxmi Nagar">Laxmi Nagar</option><option value="Raya">Raya</option>
            </select>
            <label className="hms-lbl">Summary Type</label>
            <select className="hms-sel" value={exportSumType} onChange={e=>setExportSumType(e.target.value)}>
              <option value="All">All Types</option>{SUMMARY_TYPES.map(t=><option key={t}>{t}</option>)}
            </select>
            <div style={{ fontSize:10, color:"#64748b" }}>{previewPts.length} patient(s) match</div>
          </div>
          <div className="hms-card">
            <div className="hms-section-label">Export Type</div>
            {exportOptions.map(o=>(
              <div key={o.id} className="hms-export-type-row"
                style={{ background:exportType===o.id?`${accent}18`:"transparent", borderColor:exportType===o.id?`${accent}50`:"#1a2540" }}
                onClick={()=>setExportType(o.id)}>
                <span style={{ fontSize:15 }}>{o.icon}</span>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:exportType===o.id?accent:"inherit" }}>{o.label}</div>
                  <div style={{ fontSize:9, color:"#64748b" }}>{o.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <button className="hms-export-main-btn" onClick={doExport}>
          ↓ Download {exportOptions.find(o=>o.id===exportType)?.label} — {previewPts.length} record(s)
        </button>
        <div className="hms-card" style={{ marginTop:16 }}>
          <div className="hms-section-label" style={{ marginBottom:10 }}>Quick Download per Patient</div>
          <TableWrap heads={["Patient","Branch","Summary","Discharge","Med Hist","Meds","Reports"]}>
            {allPatientsFlat.map(p=>(
              <tr key={p.uhid+p._branch}>
                <Td><span className="hms-td-hi">{p.patientName||p.name}</span><div className="hms-td-mono">{p.uhid}</div></Td>
                <Td><Badge col={BC[p._branch]?.accent||"#6b7280"}>{p._branchLabel}</Badge></Td>
                <Td><Badge col={SUMMARY_META[p.dischargeSummary?.type]?.color||"#6b7280"}>{p.dischargeSummary?.type||"—"}</Badge></Td>
                <Td><ActionBtn col="#f59e0b" onClick={()=>downloadDischarge(p,p._branchLabel)}>↓</ActionBtn></Td>
                <Td><ActionBtn col="#34d399" onClick={()=>{exportTxt(`medhistory_${p.uhid}.txt`,`Medical History\nPatient: ${p.patientName||p.name}\nUHID: ${p.uhid}`);toast("Downloaded");}}>↓</ActionBtn></Td>
                <Td><ActionBtn col="#34d399" onClick={()=>{exportCSV(`meds_${p.uhid}.csv`,(p.medicines||[]).map(m=>({Medicine:m.name,Qty:m.qty,Rate:m.rate,Total:m.qty*m.rate})),["Medicine","Qty","Rate","Total"]);toast("Downloaded");}}>↓</ActionBtn></Td>
                <Td><ActionBtn col="#c084fc" onClick={()=>{exportCSV(`reports_${p.uhid}.csv`,(p.reports||[]).map(r=>({Report:r.name,Date:r.date,Result:r.result})),["Report","Date","Result"]);toast("Downloaded");}}>↓</ActionBtn></Td>
              </tr>
            ))}
          </TableWrap>
        </div>
      </div>
    );
  };

  // ── PAGE: TASKS ───────────────────────────────────────────────────────────
  const renderTasks = () => {
    const ts = { total:tasks.length, pending:tasks.filter(t=>t.status==="Pending").length, inprogress:tasks.filter(t=>t.status==="In Progress").length, completed:tasks.filter(t=>t.status==="Completed").length, urgent:tasks.filter(t=>t.priority==="Urgent"&&t.status!=="Completed").length };
    return (
      <div>
        <PageHeader title="Task Manager" subtitle="Assign and track tasks across all departments"/>
        <div className="hms-stat-grid">
          {[{label:"Total",val:ts.total,col:accent},{label:"Pending",val:ts.pending,col:"#f59e0b"},{label:"In Progress",val:ts.inprogress,col:"#38bdf8"},{label:"Completed",val:ts.completed,col:"#34d399"},{label:"Urgent",val:ts.urgent,col:"#f87171"}].map((s,i)=>(
            <div key={i} className="hms-stat-card" style={{ padding:"12px 14px", border:`1px solid ${s.col}18` }}>
              <div className="hms-stat-num" style={{ fontSize:20, color:s.col }}>{s.val}</div>
              <div className="hms-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="hms-card">
          <CardRow title="All Tasks" action={<button className="hms-add-btn" onClick={openNewTask}>+ Assign Task</button>}/>
          {!tasks.length ? <EmptyState icon="✅" label="No tasks yet" sub='Click "Assign Task" to create the first task'/> : (
            <TableWrap heads={["Task","Assigned To","Dept","Priority","Status","Due Date","Created By","Actions"]}>
              {tasks.map((t,i)=>(
                <tr key={t.id} className="hms-tr-alt">
                  <Td><span className="hms-td-hi">{t.title}</span>{t.description&&<div style={{ fontSize:9, color:"#64748b", marginTop:2, maxWidth:180 }}>{t.description.slice(0,60)}{t.description.length>60?"…":""}</div>}</Td>
                  <Td>{t.assignedTo}</Td>
                  <Td><Badge col={accent}>{t.department}</Badge></Td>
                  <Td><PriorityPill p={t.priority}/></Td>
                  <Td>
                    <select className="hms-task-status-sel"
                      style={{ background:TASK_STATUS_META[t.status]?.bg||"transparent", borderColor:`${TASK_STATUS_META[t.status]?.color||"#6b7280"}40`, color:TASK_STATUS_META[t.status]?.color||"inherit" }}
                      value={t.status} onChange={e=>updateTaskStatus(t.id,e.target.value)}>
                      {TASK_STATUS.map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                  </Td>
                  <Td sm style={{ color:t.dueDate&&new Date(t.dueDate)<new Date()&&t.status!=="Completed"?"#f87171":"#64748b" }}>{fmtDt(t.dueDate)}</Td>
                  <Td sm>{t.createdBy||"—"}</Td>
                  <Td>
                    <div style={{ display:"flex", gap:4 }}>
                      <ActionBtn col={accent} onClick={()=>openEditTask(t)}>✎ Edit</ActionBtn>
                      <ActionBtn col="#f87171" onClick={()=>deleteTask(t.id)}>✕</ActionBtn>
                    </div>
                  </Td>
                </tr>
              ))}
            </TableWrap>
          )}
        </div>
      </div>
    );
  };

  // ── PAGE: TASK REPORT ─────────────────────────────────────────────────────
  const renderTaskReport = () => {
    const periodLabel = { all:"All Time", today:"Today", week:"This Week", month:"This Month" };
    const empMap = {};
    filteredTaskReport.forEach(t => {
      if (!empMap[t.assignedTo]) empMap[t.assignedTo]={name:t.assignedTo,dept:t.department,total:0,completed:0,pending:0,inprogress:0,onhold:0};
      empMap[t.assignedTo].total++;
      if(t.status==="Completed")empMap[t.assignedTo].completed++;
      else if(t.status==="Pending")empMap[t.assignedTo].pending++;
      else if(t.status==="In Progress")empMap[t.assignedTo].inprogress++;
      else if(t.status==="On Hold")empMap[t.assignedTo].onhold++;
    });
    const empList = Object.values(empMap);
    return (
      <div>
        <PageHeader title="Task Report" subtitle="Filter and download task reports by time period, department, or employee"/>
        <div className="hms-card">
          <div className="hms-section-label">Filters</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12, marginBottom:8 }}>
            <div><label className="hms-lbl">Time Period</label>
              <select className="hms-sel" value={taskReportFilter.period} onChange={e=>setTaskReportFilter(f=>({...f,period:e.target.value}))}>
                <option value="all">All Time</option><option value="today">Today</option><option value="week">This Week</option><option value="month">This Month</option>
              </select>
            </div>
            <div><label className="hms-lbl">Department</label>
              <select className="hms-sel" value={taskReportFilter.dept} onChange={e=>setTaskReportFilter(f=>({...f,dept:e.target.value}))}>
                <option value="All">All Departments</option>
                {allDeptOptions.map(d=><option key={d}>{d}</option>)}
              </select>
            </div>
            <div><label className="hms-lbl">Status</label>
              <select className="hms-sel" value={taskReportFilter.status} onChange={e=>setTaskReportFilter(f=>({...f,status:e.target.value}))}>
                <option value="All">All Status</option>{TASK_STATUS.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="hms-lbl">Employee Name</label>
              <input className="hms-inp" style={{ marginBottom:0 }} placeholder="Search by name…" value={taskReportFilter.empName} onChange={e=>setTaskReportFilter(f=>({...f,empName:e.target.value}))}/>
            </div>
          </div>
          <div style={{ display:"flex", gap:8, marginTop:6, alignItems:"center" }}>
            <ActionBtn col="#34d399" onClick={()=>{exportTasksXLSX(filteredTaskReport,`task_report_${taskReportFilter.period}_${taskReportFilter.dept}.xlsx`);toast("Task report exported as XLSX");}}>↓ XLSX</ActionBtn>
            <ActionBtn col="#38bdf8" onClick={()=>{exportCSV(`task_report_${taskReportFilter.period}.csv`,filteredTaskReport.map(t=>({TaskID:t.id,Title:t.title,AssignedTo:t.assignedTo,Department:t.department,Priority:t.priority,Status:t.status,DueDate:t.dueDate||"—",CreatedDate:t.createdAt?.split("T")[0]||"—",Description:t.description||"—",CompletedDate:t.completedAt?.split("T")[0]||"—"})),["TaskID","Title","AssignedTo","Department","Priority","Status","DueDate","CreatedDate","Description","CompletedDate"]);toast("Task report exported as CSV");}}>↓ CSV</ActionBtn>
            <span style={{ marginLeft:"auto", fontSize:11, color:"#64748b" }}><strong>{filteredTaskReport.length}</strong> record{filteredTaskReport.length!==1?"s":""} · <span style={{ color:accent }}>{periodLabel[taskReportFilter.period]}</span></span>
          </div>
        </div>
        <div className="hms-g4" style={{ marginBottom:18 }}>
          {TASK_STATUS.map(s=>{ const m=TASK_STATUS_META[s]||{color:"#6b7280",bg:"#6b728018"}; return (
            <div key={s} className="hms-stat-card" style={{ padding:"10px 14px", textAlign:"center", border:`1px solid ${m.color}18` }}>
              <div className="hms-stat-num" style={{ fontSize:20, color:m.color }}>{filteredTaskReport.filter(t=>t.status===s).length}</div>
              <div className="hms-stat-label">{s}</div>
            </div>
          );})}
        </div>
        <div className="hms-card">
          <div className="hms-card-title" style={{ marginBottom:14 }}>Employee Task Summary — {periodLabel[taskReportFilter.period]}</div>
          {!empList.length ? <div className="hms-empty">No tasks match current filters.</div> : (
            <TableWrap heads={["Employee","Department","Total","Pending","In Progress","Completed","On Hold","Completion %"]}>
              {empList.map((e,i)=>{
                const pct=e.total?Math.round((e.completed/e.total)*100):0;
                return (
                  <tr key={i}>
                    <Td hi>{e.name}</Td>
                    <Td><Badge col={accent}>{e.dept}</Badge></Td>
                    <Td><strong>{e.total}</strong></Td>
                    <Td><span style={{ color:"#f59e0b" }}>{e.pending}</span></Td>
                    <Td><span style={{ color:"#38bdf8" }}>{e.inprogress}</span></Td>
                    <Td><span style={{ color:"#34d399" }}>{e.completed}</span></Td>
                    <Td><span style={{ color:"#f87171" }}>{e.onhold}</span></Td>
                    <Td>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div className="hms-progress-bar-sm"><div className="hms-progress-fill" style={{ width:`${pct}%`, background:"#34d399" }}/></div>
                        <span style={{ fontSize:10, fontWeight:700, color:pct>=75?"#34d399":pct>=50?"#f59e0b":"#f87171", minWidth:32 }}>{pct}%</span>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </TableWrap>
          )}
        </div>
        <div className="hms-card">
          <div className="hms-card-title" style={{ marginBottom:14 }}>Detailed Task List ({filteredTaskReport.length})</div>
          {!filteredTaskReport.length ? <div className="hms-empty">No tasks match the selected filters.</div> : (
            <TableWrap heads={["Task ID","Title","Assigned To","Dept","Priority","Status","Due Date","Created","Completed"]}>
              {filteredTaskReport.map((t,i)=>(
                <tr key={t.id} className="hms-tr-alt">
                  <Td mono>{t.id}</Td>
                  <Td><span className="hms-td-hi">{t.title}</span>{t.description&&<div style={{ fontSize:9, color:"#64748b", marginTop:1 }}>{t.description.slice(0,50)}{t.description.length>50?"…":""}</div>}</Td>
                  <Td>{t.assignedTo}</Td>
                  <Td><Badge col={accent}>{t.department}</Badge></Td>
                  <Td><PriorityPill p={t.priority}/></Td>
                  <Td><StatusPill s={t.status}/></Td>
                  <Td sm>{fmtDt(t.dueDate)}</Td>
                  <Td sm>{t.createdAt?.split("T")[0]||"—"}</Td>
                  <Td><span style={{ fontSize:10, color:"#34d399" }}>{t.completedAt?.split("T")[0]||"—"}</span></Td>
                </tr>
              ))}
            </TableWrap>
          )}
        </div>
      </div>
    );
  };

  // ── PAGE: DEPARTMENTS ─────────────────────────────────────────────────────
  const renderDepartments = () => {
    const deptList = [...DEPT_OPTIONS.map(name=>({id:`default-${name}`,name,description:`${name} Department`,isDefault:true,memberCount:employees.filter(e=>e.dept===name).length})),...departments.filter(d=>!DEPT_OPTIONS.includes(d.name)).map(d=>({...d,isDefault:false,memberCount:employees.filter(e=>e.dept===d.name).length}))];
    return (
      <div>
        <PageHeader title="Departments" subtitle="Manage hospital departments"/>
        <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:16 }}>
          <button className="hms-add-btn-lg" onClick={()=>setShowDeptModal(true)}>+ Create Department</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:14, marginBottom:20 }}>
          {deptList.map((dept,i)=>{
            const dA=DEPT_ACCENT_CYCLE[i%DEPT_ACCENT_CYCLE.length];
            const deptTasks=tasks.filter(t=>t.department===dept.name);
            const completedTasks=deptTasks.filter(t=>t.status==="Completed").length;
            const pct=deptTasks.length?Math.round((completedTasks/deptTasks.length)*100):0;
            return (
              <div key={dept.id} className="hms-dept-card" style={{ borderColor:`${dA}30`, borderTopColor:dA }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                  <div style={{ width:36,height:36,borderRadius:10,background:`${dA}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18 }}>{DEPT_ICONS[dept.name]||"🏢"}</div>
                  {dept.isDefault ? <Badge col={accent}>DEFAULT</Badge> : <button onClick={()=>setDepartments(prev=>prev.filter(d=>d.id!==dept.id))} style={{ background:"transparent",border:"none",color:"#64748b",cursor:"pointer",fontSize:12,padding:"2px 6px" }}>✕</button>}
                </div>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:4 }}>{dept.name}</div>
                <div style={{ fontSize:10, color:"#64748b", marginBottom:12, lineHeight:1.5 }}>{dept.description}</div>
                <div style={{ display:"flex", gap:10, marginBottom:deptTasks.length?10:0 }}>
                  {[{label:"Members",val:dept.memberCount,col:dA},{label:"Tasks",val:deptTasks.length,col:"#38bdf8"},{label:"Done",val:completedTasks,col:"#34d399"}].map((s,j)=>(
                    <div key={j} style={{ textAlign:"center" }}>
                      <div style={{ fontSize:18,fontWeight:800,color:s.col }}>{s.val}</div>
                      <div style={{ fontSize:9,color:"#64748b" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                {deptTasks.length>0 && (
                  <div>
                    <div style={{ display:"flex",justifyContent:"space-between",fontSize:9,color:"#64748b",marginBottom:4 }}><span>Progress</span><span>{pct}%</span></div>
                    <ProgressBar pct={pct} col={dA}/>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── PAGE: EMPLOYEES ───────────────────────────────────────────────────────
  const renderEmployees = () => (
    <div>
      <PageHeader title="Employee Management" subtitle="Manage staff accounts and credentials"/>
      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:16 }}>
        <button className="hms-add-btn-lg" onClick={()=>setShowEmpModal(true)}>+ Create Employee</button>
      </div>
      {!employees.length ? <EmptyState icon="👤" label="No employees yet" sub='Click "Create Employee" to add your first employee'/> : (
        <div className="hms-card" style={{ padding:0, overflow:"hidden" }}>
          <TableWrap heads={["Emp ID","Full Name","Username","Role","Department","Email","Phone","Status","Actions"]}>
            {employees.map((emp,i)=>(
              <tr key={i} style={{ borderBottom:"1px solid #1e2a3a" }}>
                <Td mono style={{ color:accent }}>{emp.empId||emp.id}</Td>
                <Td hi>{emp.fullName||emp.name}</Td>
                <Td sm>{emp.username}</Td>
                <Td><Badge col="#818cf8">{emp.role||"Staff"}</Badge></Td>
                <Td><Badge col={accent}>{emp.dept}</Badge></Td>
                <Td sm>{emp.email}</Td>
                <Td sm>{emp.phone}</Td>
                <Td><Badge col={emp.status==="Inactive"?"#f87171":"#34d399"}>{emp.status||"Active"}</Badge></Td>
                <Td>
                  <div style={{ display:"flex", gap:6 }}>
                    <ActionBtn col={accent} onClick={() => openEditEmployee(emp)}>✎ Edit / Reset</ActionBtn>
                    <ActionBtn col={emp.status==="Inactive"?"#34d399":"#f87171"} onClick={() => handleToggleActive(emp, i)}>
                      {emp.status==="Inactive"?"✓ Activate":"⊘ Deactivate"}
                    </ActionBtn>
                  </div>
                </Td>
              </tr>
            ))}
          </TableWrap>
        </div>
      )}
    </div>
  );

  // ── PAGE: PROFILE ─────────────────────────────────────────────────────────
  const renderProfile = () => (
    <div>
      <BranchHeader title="My Profile"/>
      <div className="hms-prof-card" style={{ display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center", border:`1px solid ${accent}30` }}>
        <div style={{ width:70,height:70,borderRadius:"50%",background:`linear-gradient(135deg,${accent},#818cf8)`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:22,color:"#fff",marginBottom:12 }}>{initials(currentUser?.name)}</div>
        <div style={{ fontSize:16, fontWeight:700, marginBottom:3 }}>{currentUser?.name}</div>
        <div style={{ fontSize:11, color:accent, fontWeight:600, marginBottom:4 }}>{currentUser?.dept||currentUser?.role?.toUpperCase()}</div>
        <div style={{ fontSize:10, color:"#64748b", marginBottom:10 }}>{bc.label} Branch</div>
        <Badge col="#34d399">Active</Badge>
      </div>
      <div className="hms-card">
        <div className="hms-card-title" style={{ marginBottom:14 }}>Account Details</div>
        <table className="hms-tbl">
          <tbody>
            {[["Employee ID",currentUser?.id],["Full Name",currentUser?.name],["Department",currentUser?.dept||"—"],["Role",currentUser?.role],["Home Branch",BC[homeBranch]?.label||homeBranch],["Status","Active"],["Created By",currentUser?.createdBy||"Admin"]].map(([k,v])=>(
              <tr key={k}>
                <Td sm style={{ width:150, fontWeight:700, textTransform:"uppercase", letterSpacing:".06em" }}>{k}</Td>
                <Td style={{ fontFamily:k==="Employee ID"?"monospace":"inherit" }}>{v||"—"}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ── RENDER ────────────────────────────────────────────────────────────────
  const renderContent = () => {
    switch(activeTab) {
      case "home":        return renderHome();
      case "patients":    return renderPatients();
      case "discharge":   return renderDischarge();
      case "medicines":   return renderMedicines();
      case "reports":     return renderReports();
      case "billing":     return renderBilling();
      case "export":      return renderExport();
      case "tasks":       return renderTasks();
      case "taskreport":  return renderTaskReport();
      case "departments": return renderDepartments();
      case "employees":   return renderEmployees();
      case "profile":     return renderProfile();
      default:            return renderHome();
    }
  };

  const sbWidth = collapsed ? 52 : 220;

  return (
    <div className="hms-wrap">
      {/* Dynamic theme CSS — only accent/dark-mode dependent rules */}
      <style>{DYNAMIC_CSS(accent, isDark)}</style>

      {/* NOTIFICATION */}
      {notif && (
        <div className="hms-notif" style={{ background:notif.type==="ok"?(isDark?"#052e1c":"#f0fdf4"):(isDark?"#3b0f05":"#fef2f2"), borderColor:notif.type==="ok"?"#34d399":"#f87171", color:notif.type==="ok"?"#86efac":"#fca5a5" }}>
          {notif.type==="ok"?"✓ ":"⚠ "}{notif.msg}
        </div>
      )}

      {/* HEADER */}
      <header className="hms-hdr">
        <div className="hms-logo-row">
          <img src="/app_icon.png" alt="logo" style={{ width:30,height:30,borderRadius:8,objectFit:"cover" }}/>
          <div><div className="hms-logo-text">Sangi Hospital</div><div className="hms-logo-sub">{currentUser?.dept||currentUser?.role} · Management</div></div>
        </div>
        <div className="hms-hdr-right">
          <span className="hms-role-badge">{currentUser?.role?.toUpperCase()}</span>
          <button className="hms-theme-btn" onClick={()=>setIsDark(d=>!d)} title={isDark?"Light Mode":"Dark Mode"}>{isDark?"☀":"☾"}</button>
          <div className="hms-avatar-pill">
            <span className="hms-avatar-name">{currentUser?.name}</span>
            <div className="hms-avatar">{initials(currentUser?.name)}</div>
          </div>
          <button className="hms-logout-btn" onClick={onLogout}>↪ Logout</button>
        </div>
      </header>

      <div className="hms-body">
        {/* SIDEBAR */}
        <aside className="hms-sb" style={{ width:sbWidth }}>
          <div className="hms-sb-top" style={{ padding:collapsed?"14px 8px":"14px 12px" }}>
            {!collapsed && <div className="hms-branch-label">Branch</div>}
            {collapsed ? (
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                {BRANCH_KEYS.map(bk=>(
                  <button key={bk} className="hms-branch-dot-btn" onClick={()=>setViewBranch(bk)} style={{ background:viewBranch===bk?BC[bk].dim:"transparent" }}>
                    <div className="hms-branch-dot" style={{ background:BC[bk].accent }}/>
                  </button>
                ))}
              </div>
            ) : (
              <select className="hms-branch-select" value={viewBranch} onChange={e=>setViewBranch(e.target.value)}>
                {BRANCH_KEYS.map(bk=><option key={bk} value={bk}>{BC[bk].label}</option>)}
              </select>
            )}
          </div>

          <nav className="hms-nav-wrap">
            {!collapsed && <div className="hms-nav-section" style={{ padding:"0 14px" }}>Menu</div>}
            {NAV.map(item=>(
              <div key={item.id} className={`hms-nav-item${activeTab===item.id?" active":""}`}
                style={{ padding:collapsed?"10px 0":"10px 14px", justifyContent:collapsed?"center":"flex-start" }}
                onClick={()=>setActiveTab(item.id)} title={item.label}>
                <span className="hms-nav-icon">{item.icon}</span>
                {!collapsed && item.label}
              </div>
            ))}
          </nav>

          {!collapsed && (
            <div style={{ padding:"10px 12px", borderTop:"1px solid #1e2030", borderBottom:"1px solid #1e2030" }}>
              <div className="hms-signed-in">Signed in as</div>
              <div className="hms-signed-name">{currentUser?.name}</div>
              <div className="hms-signed-role">{currentUser?.dept||currentUser?.role}</div>
            </div>
          )}

          <div className="hms-sb-bot" style={{ padding:collapsed?"10px 8px":"10px 12px" }}>
            <button className="hms-col-btn" onClick={()=>setCollapsed(x=>!x)}>{collapsed?"▶":"◀"}</button>
          </div>
        </aside>

        <main className="hms-main">{renderContent()}</main>
      </div>

      {/* ══ TASK MODAL ══ */}
      {showTaskModal && (
        <div className="hms-modal-overlay" onClick={e=>e.target===e.currentTarget&&(setShowTaskModal(false),setEditTask(null))}>
          <div className="hms-modal-box" style={{ width:500 }}>
            <div className="hms-modal-title">{editTask?"Edit Task":"Assign New Task"}</div>
            <label className="hms-lbl">Task Title *</label>
            <input className="hms-inp" placeholder="E.g. Prepare daily billing report" value={taskForm.title} onChange={e=>setTaskForm(f=>({...f,title:e.target.value}))}/>
            <label className="hms-lbl">Description</label>
            <textarea className="hms-textarea" placeholder="Task details…" value={taskForm.description} onChange={e=>setTaskForm(f=>({...f,description:e.target.value}))}/>
            <div className="hms-g2">
              <div>
                <label className="hms-lbl">Assigned To *</label>
                <input className="hms-inp" placeholder="Employee name" value={taskForm.assignedTo} onChange={e=>setTaskForm(f=>({...f,assignedTo:e.target.value}))} list="emp-list"/>
                <datalist id="emp-list">{employees.map((e,i)=><option key={i} value={e.fullName||e.name}/>)}</datalist>
              </div>
              <div>
                <label className="hms-lbl">Department</label>
                <select className="hms-sel" value={taskForm.department} onChange={e=>setTaskForm(f=>({...f,department:e.target.value}))}>
                  {allDeptOptions.map(d=><option key={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div className="hms-g3">
              <div>
                <label className="hms-lbl">Priority</label>
                <select className="hms-sel" value={taskForm.priority} onChange={e=>setTaskForm(f=>({...f,priority:e.target.value}))}>
                  {TASK_PRIORITY.map(p=><option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="hms-lbl">Status</label>
                <select className="hms-sel" value={taskForm.status} onChange={e=>setTaskForm(f=>({...f,status:e.target.value}))}>
                  {TASK_STATUS.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="hms-lbl">Due Date</label>
                <input className="hms-inp" type="date" value={taskForm.dueDate} onChange={e=>setTaskForm(f=>({...f,dueDate:e.target.value}))}/>
              </div>
            </div>
            <div className="hms-modal-foot">
              <button className="hms-cancel-btn" onClick={()=>{setShowTaskModal(false);setEditTask(null);}}>Cancel</button>
              <button className="hms-save-btn" onClick={saveTask}>{editTask?"Update Task":"Assign Task"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ DEPARTMENT MODAL ══ */}
      {showDeptModal && (
        <div className="hms-modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowDeptModal(false)}>
          <div className="hms-modal-box" style={{ width:420 }}>
            <div className="hms-modal-title">Create New Department</div>
            <label className="hms-lbl">Department Name *</label>
            <input className="hms-inp" placeholder="E.g. Radiology" value={deptForm.name} onChange={e=>setDeptForm(f=>({...f,name:e.target.value}))}/>
            <label className="hms-lbl">Description</label>
            <input className="hms-inp" placeholder="Brief description" value={deptForm.description} onChange={e=>setDeptForm(f=>({...f,description:e.target.value}))}/>
            <label className="hms-lbl">Department Head (optional)</label>
            <input className="hms-inp" placeholder="Name of HOD" value={deptForm.head} onChange={e=>setDeptForm(f=>({...f,head:e.target.value}))}/>
            <div className="hms-modal-foot">
              <button className="hms-cancel-btn" onClick={()=>setShowDeptModal(false)}>Cancel</button>
              <button className="hms-save-btn" onClick={saveDepartment}>Create Department</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ EMPLOYEE MODAL ══ */}
      {showEmpModal && (
        <div className="hms-modal-overlay" onClick={e=>e.target===e.currentTarget&&(setShowEmpModal(false),setEmpPassErr(""),setEditEmpId(null))}>
          <div className="hms-modal-box" style={{ width:520 }}>
            <div className="hms-modal-title">{editEmpId ? "Edit Employee Details" : "Create New Employee"}</div>
            <div className="hms-g2">
              {[["Full Name","fullName","text","Jane Doe"],["Username","username","text","jane.doe"],["Employee ID","empId","text","EMP-001"],["Email","email","email","jane@hospital.com"],["Phone","phone","tel","+91 98765 43210"],["Role","role","text","Staff / HOD / etc."]].map(([lbl,k,type,ph])=>(
                <div key={k}>
                  <label className="hms-lbl">{lbl}</label>
                  <input type={type} placeholder={ph} value={empForm[k]} className="hms-inp" onChange={e=>{setEmpForm(f=>({...f,[k]:e.target.value}));setEmpPassErr("");}} disabled={k==="username" && editEmpId}/>
                </div>
              ))}
            </div>
            <label className="hms-lbl">Department</label>
            <select className="hms-sel" value={empForm.dept} onChange={e=>setEmpForm(f=>({...f,dept:e.target.value}))}>
              {allDeptOptions.map(d=><option key={d}>{d}</option>)}
            </select>
            <div className="hms-g2">
              {[["Password","password",empShowPass,setEmpShowPass],["Confirm Password","confirmPassword",empShowConfirm,setEmpShowConfirm]].map(([lbl,k,show,setShow])=>(
                <div key={k}>
                  <label className="hms-lbl">{lbl} {editEmpId && <span style={{fontSize:9}}>(Leave blank to keep current)</span>}</label>
                  <div className="hms-pass-wrap">
                    <input type={show?"text":"password"} placeholder={editEmpId ? "Leave blank to keep current" : "••••••••"} value={empForm[k]} className="hms-inp" style={{ paddingRight:50 }} onChange={e=>{setEmpForm(f=>({...f,[k]:e.target.value}));setEmpPassErr("");}}/>
                    <button type="button" className="hms-pass-toggle" onClick={()=>setShow(p=>!p)}>{show?"HIDE":"SHOW"}</button>
                  </div>
                </div>
              ))}
            </div>
            {empPassErr && <div className="hms-err-text">{empPassErr}</div>}
            <div className="hms-modal-foot">
              <button className="hms-cancel-btn" onClick={()=>{setShowEmpModal(false);setEmpPassErr("");setEditEmpId(null);}}>Cancel</button>
              <button className="hms-save-btn" onClick={saveEmployee}>{editEmpId ? "Save Changes" : "Create Employee"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MED DRAWER ══ */}
      {showMedModal && editMedPt && (
        <MedDrawer editMedPt={editMedPt} onClose={()=>{setShowMedModal(false);setEditMedPt(null);}} updateMed={updateMed} addMedRow={addMedRow} delMedRow={delMedRow} saveMeds={saveMeds} fmt={fmt} canEditRate={true}/>
      )}

      {/* ══ VIEW SUMMARY MODAL ══ */}
      {showViewModal && viewPt && (
        <div className="hms-modal-overlay" onClick={e=>e.target===e.currentTarget&&(setShowViewModal(false),setViewPt(null))}>
          <div className="hms-modal-box" style={{ width:640 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
              <div>
                <div className="hms-modal-title">Discharge Summary</div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <SummaryPill type={viewPt.dischargeSummary?.type}/>
                  <span className="hms-td-mono">{viewPt.uhid}</span>
                </div>
              </div>
              <button className="hms-logout-btn" onClick={()=>{setShowViewModal(false);setViewPt(null);}}>✕</button>
            </div>
            <div className="hms-stat-card" style={{ padding:"12px 14px", marginBottom:14, border:"1px solid #f59e0b18" }}>
              <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
                {[["Patient",viewPt.patientName||viewPt.name],["Age/Gender",`${viewPt.ageYY||viewPt.age}Y / ${viewPt.gender}`],["Blood Group",viewPt.bloodGroup||"—"],["Phone",viewPt.phone||"—"],["Admit Date",fmtDt(viewPt.admissions?.[0]?.dateTime)]].map(([k,v])=>(
                  <div key={k}><div className="hms-view-key">{k}</div><div className="hms-view-val" style={{ fontWeight:700 }}>{v}</div></div>
                ))}
              </div>
            </div>
            <div className="hms-section-label">Clinical Details</div>
            {[["Diagnosis",viewPt.dischargeSummary?.diagnosis],["Treatment",viewPt.dischargeSummary?.treatment],["Treating Doctor",viewPt.dischargeSummary?.doctorName],["Discharge Date",fmtDt(viewPt.dischargeSummary?.date)],["Expected DOD",fmtDt(viewPt.dischargeSummary?.expectedDod)],["Follow-up",viewPt.dischargeSummary?.followUp],["Notes",viewPt.dischargeSummary?.notes]].map(([k,v])=>(
              <div key={k} className="hms-view-row"><div className="hms-view-key">{k}</div><div className="hms-view-val" style={{ color:v&&v!=="—"?"inherit":"#64748b", fontStyle:v&&v!=="—"?"normal":"italic" }}>{v||"Not set"}</div></div>
            ))}
            {(viewPt.medicines||[]).length>0 && <>
              <div className="hms-section-label" style={{ marginTop:14 }}>Medicines</div>
              <TableWrap heads={["Medicine","Qty","Rate","Total"]}>
                {(viewPt.medicines||[]).map((m,i)=>(
                  <tr key={i}><Td hi>{m.name}</Td><Td><Badge col={accent}>{m.qty}</Badge></Td><Td>{fmt(m.rate)}</Td><Td><span style={{ color:"#f59e0b", fontWeight:700 }}>{fmt(m.qty*m.rate)}</span></Td></tr>
                ))}
              </TableWrap>
            </>}
            {(viewPt.reports||[]).length>0 && <>
              <div className="hms-section-label" style={{ marginTop:14 }}>Investigations</div>
              <TableWrap heads={["Report","Date","Result"]}>
                {(viewPt.reports||[]).map((r,i)=>(
                  <tr key={i}><Td hi>{r.name}</Td><Td sm>{r.date}</Td><Td>{r.result}</Td></tr>
                ))}
              </TableWrap>
            </>}
            <div className="hms-modal-foot">
              <button className="hms-cancel-btn" onClick={()=>{setShowViewModal(false);setViewPt(null);}}>Close</button>
              <ActionBtn col={accent} onClick={()=>{setShowViewModal(false);openSummaryEditor(viewPt);}}>✎ Edit</ActionBtn>
              <button className="hms-save-btn" onClick={()=>downloadDischarge(viewPt,bc.label)}>↓ Download</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ EDIT SUMMARY MODAL ══ */}
      {showSummaryModal && editSumPt && (
        <div className="hms-modal-overlay" onClick={e=>e.target===e.currentTarget&&(setShowSummaryModal(false),setEditSumPt(null))}>
          <div className="hms-modal-box" style={{ width:520 }}>
            <div className="hms-modal-title">Edit Discharge Summary — {editSumPt.patientName||editSumPt.name}</div>
            <label className="hms-lbl">Summary Type</label>
            <select className="hms-sel" value={summaryForm.type||"Normal"} onChange={e=>setSummaryForm(f=>({...f,type:e.target.value}))}>
              {SUMMARY_TYPES.map(t=><option key={t}>{t}</option>)}
            </select>
            <div className="hms-g2">
              <div><label className="hms-lbl">Doctor Name</label><input className="hms-inp" value={summaryForm.doctorName||""} onChange={e=>setSummaryForm(f=>({...f,doctorName:e.target.value}))}/></div>
              <div><label className="hms-lbl">Discharge Date</label><input className="hms-inp" type="date" value={summaryForm.date||""} onChange={e=>setSummaryForm(f=>({...f,date:e.target.value}))}/></div>
            </div>
            <div className="hms-g2">
              <div><label className="hms-lbl">Expected DOD</label><input className="hms-inp" type="date" value={summaryForm.expectedDod||""} onChange={e=>setSummaryForm(f=>({...f,expectedDod:e.target.value}))}/></div>
              <div/>
            </div>
            <label className="hms-lbl">Diagnosis</label><input className="hms-inp" value={summaryForm.diagnosis||""} onChange={e=>setSummaryForm(f=>({...f,diagnosis:e.target.value}))}/>
            <label className="hms-lbl">Treatment</label><input className="hms-inp" value={summaryForm.treatment||""} onChange={e=>setSummaryForm(f=>({...f,treatment:e.target.value}))}/>
            <label className="hms-lbl">Follow-up Instructions</label><input className="hms-inp" value={summaryForm.followUp||""} onChange={e=>setSummaryForm(f=>({...f,followUp:e.target.value}))}/>
            <label className="hms-lbl">Notes</label><input className="hms-inp" value={summaryForm.notes||""} onChange={e=>setSummaryForm(f=>({...f,notes:e.target.value}))}/>
            <div className="hms-modal-foot">
              <button className="hms-cancel-btn" onClick={()=>{setShowSummaryModal(false);setEditSumPt(null);}}>Cancel</button>
              <button style={{ background:"transparent", border:`1px solid ${accent}40`, color:accent, padding:"8px 14px", borderRadius:7, cursor:"pointer", fontSize:11, fontWeight:700 }} onClick={()=>{ exportTxt(`discharge_${editSumPt.uhid}.txt`,buildDischargeSummaryText(editSumPt,bc.label,summaryForm,{},editSumPt.medicines||[],editSumPt.reports||[])); toast("Downloaded"); }}>↓ Download</button>
              <button className="hms-save-btn" onClick={saveSummary}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ DELETE CONFIRM ══ */}
      {showDeleteConfirm && deletePt && (
        <div className="hms-modal-overlay" onClick={e=>e.target===e.currentTarget&&(setShowDeleteConfirm(false),setDeletePt(null))}>
          <div className="hms-modal-box" style={{ width:380 }}>
            <div className="hms-modal-title" style={{ color:"#f87171" }}>Clear Discharge Summary?</div>
            <div style={{ fontSize:12, color:"#94a3b8", marginBottom:18, lineHeight:1.6 }}>
              This will reset the discharge summary for <strong>{deletePt.patientName||deletePt.name}</strong> ({deletePt.uhid}). This action cannot be undone.
            </div>
            <div className="hms-modal-foot">
              <button className="hms-cancel-btn" onClick={()=>{setShowDeleteConfirm(false);setDeletePt(null);}}>Cancel</button>
              <button className="hms-danger-btn" onClick={doDeleteSummary}>Yes, Clear Summary</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ REPORTS MODAL ══ */}
      {showReportModal && editRepPt && (
        <div className="hms-modal-overlay" onClick={e=>e.target===e.currentTarget&&(setShowReportModal(false),setEditRepPt(null))}>
          <div className="hms-modal-box" style={{ width:520 }}>
            <div className="hms-modal-title">Reports — {editRepPt.patientName||editRepPt.name}</div>
            <div className="hms-section-label">Existing Reports</div>
            {!(editRepPt.reports||[]).length && <div className="hms-empty" style={{ padding:"1rem" }}>No reports yet.</div>}
            {(editRepPt.reports||[]).map((r,i)=>(
              <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 110px 1fr 28px", gap:6, marginBottom:6, alignItems:"center" }}>
                <input className="hms-inp-sm" placeholder="Report name" value={r.name} onChange={e=>updateReport(i,"name",e.target.value)}/>
                <input className="hms-inp-sm" type="date" value={r.date} onChange={e=>updateReport(i,"date",e.target.value)}/>
                <input className="hms-inp-sm" placeholder="Result" value={r.result} onChange={e=>updateReport(i,"result",e.target.value)}/>
                <ActionBtn col="#f87171" onClick={()=>delReport(i)}>✕</ActionBtn>
              </div>
            ))}
            <div className="hms-section-label" style={{ marginTop:8 }}>Add New Report</div>
            <div className="hms-g3">
              <input className="hms-inp-sm" placeholder="Name" value={newReport.name} onChange={e=>setNewReport(f=>({...f,name:e.target.value}))}/>
              <input className="hms-inp-sm" type="date" value={newReport.date} onChange={e=>setNewReport(f=>({...f,date:e.target.value}))}/>
              <input className="hms-inp-sm" placeholder="Result" value={newReport.result} onChange={e=>setNewReport(f=>({...f,result:e.target.value}))}/>
            </div>
            <ActionBtn col={accent} onClick={addReport}>+ Add Report</ActionBtn>
            <div className="hms-modal-foot" style={{ marginTop:14 }}>
              <button className="hms-cancel-btn" onClick={()=>{setShowReportModal(false);setEditRepPt(null);}}>Cancel</button>
              <button className="hms-save-btn" onClick={saveReports}>Save Reports</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}