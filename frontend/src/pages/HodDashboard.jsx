import { useState, useEffect, useCallback, useRef } from "react";
import ThemeModeDock from "../components/ui/ThemeModeDock";
import {
  IndianRupee, Upload, CircleHelp, Hospital,
  ClipboardList, CheckSquare, BarChart3, Star, Users,
  FileText, Activity, Send, Eye, ChevronDown, ChevronUp,
  AlertCircle, Clock, CheckCircle, XCircle, RefreshCw,
  Stethoscope, BookOpen, Search, Filter, Bell,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
const DEPARTMENTS = [
  "Billing", "Uploading", "Query", "OPD", "Intimation",
  "Nursing", "Doctor", "Notes", "Quality Analysis",
];

const INSURANCE_TYPES = [
  "TPA", "Ayushman Bharat", "ECHS", "ECI", "FCI",
  "Northern Railways", "Cash",
];

const DEPT_META = {
  Billing:          { color: "#10b981", icon: IndianRupee,   desc: "Final bill preparation & payment" },
  Uploading:        { color: "#3b82f6", icon: Upload,        desc: "Document upload & digitisation" },
  Query:            { color: "#f59e0b", icon: CircleHelp,    desc: "Patient & insurance queries" },
  OPD:              { color: "#ef4444", icon: Hospital,      desc: "Out-patient department tasks" },
  Intimation:       { color: "#06b6d4", icon: ClipboardList, desc: "Insurance intimation letters" },
  Nursing:          { color: "#a78bfa", icon: Users,         desc: "Nursing care & medication notes" },
  Doctor:           { color: "#f472b6", icon: Stethoscope,   desc: "Doctor notes & prescriptions" },
  Notes:            { color: "#64748b", icon: BookOpen,      desc: "Clinical & administrative notes" },
  "Quality Analysis": { color: "#f97316", icon: BarChart3,  desc: "Quality checks & analysis" },
};

const STATUS_META = {
  pending:       { bg:"rgba(245,158,11,0.12)",  text:"#f59e0b",  border:"rgba(245,158,11,0.3)",  label:"Pending"     },
  "in-progress": { bg:"rgba(6,182,212,0.12)",   text:"#06b6d4",  border:"rgba(6,182,212,0.3)",   label:"In Progress" },
  completed:     { bg:"rgba(16,185,129,0.12)",  text:"#10b981",  border:"rgba(16,185,129,0.3)",  label:"Completed"   },
  overdue:       { bg:"rgba(239,68,68,0.12)",   text:"#ef4444",  border:"rgba(239,68,68,0.3)",   label:"Overdue"     },
  submitted:     { bg:"rgba(99,102,241,0.12)",  text:"#6366f1",  border:"rgba(99,102,241,0.3)",  label:"Submitted"   },
  approved:      { bg:"rgba(16,185,129,0.12)",  text:"#10b981",  border:"rgba(16,185,129,0.3)",  label:"Approved"    },
  rejected:      { bg:"rgba(239,68,68,0.12)",   text:"#ef4444",  border:"rgba(239,68,68,0.3)",   label:"Rejected"    },
};

const PRIORITY_META = {
  Low:    { color:"#64748b", bg:"rgba(100,116,139,0.1)" },
  Medium: { color:"#f59e0b", bg:"rgba(245,158,11,0.1)"  },
  High:   { color:"#ef4444", bg:"rgba(239,68,68,0.1)"   },
  Urgent: { color:"#a855f7", bg:"rgba(168,85,247,0.1)"  },
};

const API_BASE = "http://localhost:8000/api";

async function apiFetch(path, options = {}) {
  // Grab the JWT token explicitly from sessionStorage
  const token = sessionStorage.getItem("hms_token"); 
  
  const headers = { 
    "Content-Type": "application/json",
    // Attach the token if it exists! This fixes the 401 and 403 errors.
    ...(token && { "Authorization": `Bearer ${token}` }) 
  };

  const res = await fetch(`${API_BASE}${path}`, {
    headers: { ...headers, ...(options.headers || {}) },
    ...options,
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || `API error ${res.status}`);
  }
  
  return res.json();
}

const fmt    = n => "₹" + Number(n || 0).toLocaleString("en-IN");
const fmtDt  = d => d ? new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "—";
const initials = name => (name || "?").trim().split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  *,*::before,*::after { box-sizing:border-box; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
  @keyframes slideIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:none} }
  ::-webkit-scrollbar { width:4px; height:4px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:var(--border-strong); border-radius:2px; }

  .hod-root { display:flex; height:100vh; background:var(--bg); color:var(--text); font-family:var(--ui-font-sans); overflow:hidden; }

  /* ── Sidebar ── */
  .hod-sb { width:220px; min-width:220px; background:var(--surface); border-right:1px solid var(--border); display:flex; flex-direction:column; transition:width .22s; overflow:hidden; position:relative; z-index:10; }
  .hod-sb.col { width:58px; min-width:58px; }
  .hod-sb-head { padding:16px 14px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; gap:8px; min-height:64px; }
  .hod-logo { width:32px; height:32px; border-radius:8px; background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.3); display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:800; color:#10b981; flex-shrink:0; }
  .hod-col-btn { width:24px; height:24px; border-radius:5px; background:var(--surface-2); border:1px solid var(--border); color:var(--text-muted); cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:11px; flex-shrink:0; }
  .hod-slbl { font-size:8px; letter-spacing:.12em; color:var(--text-muted); text-transform:uppercase; padding:12px 14px 5px; white-space:nowrap; overflow:hidden; }
  .hod-nav-item { display:flex; align-items:center; gap:9px; padding:9px 14px; cursor:pointer; background:transparent; border:none; width:100%; text-align:left; font-family:inherit; font-size:12px; color:var(--text-muted); transition:.13s; border-left:3px solid transparent; white-space:nowrap; }
  .hod-nav-item:hover { color:var(--text); background:var(--surface-2); }
  .hod-nav-item.act { color:#10b981; background:rgba(16,185,129,0.08); border-left-color:#10b981; font-weight:600; }
  .hod-nav-icon { width:22px; height:22px; border-radius:6px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .hod-sb-mini-stats { display:flex; gap:5px; padding:8px 14px; flex-wrap:wrap; }
  .hod-mini-stat { flex:1; min-width:40px; border-radius:6px; padding:5px 7px; text-align:center; border:1px solid; }
  .hod-sb-footer { margin-top:auto; border-top:1px solid var(--border); padding:12px 14px; display:flex; flex-direction:column; gap:8px; }
  .hod-user-card { display:flex; align-items:center; gap:9px; }
  .hod-avatar { width:30px; height:30px; border-radius:8px; background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.3); display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; color:#10b981; flex-shrink:0; }
  .hod-logout { display:flex; align-items:center; gap:7px; padding:8px 11px; background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2); border-radius:8px; color:#ef4444; font-size:11px; cursor:pointer; font-family:inherit; width:100%; }
  .hod-logout:hover { background:rgba(239,68,68,0.15); }

  /* ── Header ── */
  .hod-hdr { display:flex; align-items:center; justify-content:space-between; padding:0 24px; height:58px; background:var(--surface); border-bottom:1px solid var(--border); position:sticky; top:0; z-index:100; }
  .hod-hdr-right { display:flex; align-items:center; gap:10px; }
  .hod-sync-pill { display:flex; align-items:center; gap:6px; background:var(--surface-2); border:1px solid var(--border); border-radius:20px; padding:4px 11px; font-size:10px; color:#06b6d4; letter-spacing:.06em; }

  /* ── Main ── */
  .hod-main { flex:1; display:flex; flex-direction:column; overflow:hidden; }
  .hod-content { flex:1; overflow-y:auto; padding:22px 26px; }

  /* ── Cards & Grids ── */
  .hod-stat-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:12px; margin-bottom:22px; }
  .hod-stat-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:16px 18px; position:relative; overflow:hidden; animation:fadeIn .3s ease; }
  .hod-stat-card::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; }
  .hod-patient-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:14px; }
  .hod-patient-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:18px 20px; cursor:pointer; transition:.18s; animation:fadeIn .25s ease; }
  .hod-patient-card:hover { border-color:rgba(16,185,129,0.5); box-shadow:0 4px 20px rgba(16,185,129,0.1); transform:translateY(-2px); }

  /* ── Badges & Pills ── */
  .hod-badge { display:inline-flex; align-items:center; gap:4px; padding:3px 10px; border-radius:20px; font-size:10px; font-weight:700; white-space:nowrap; border:1px solid; }
  .hod-chip { padding:2px 9px; border-radius:20px; font-size:10px; font-weight:600; background:var(--surface-2); color:var(--text-muted); border:1px solid var(--border); white-space:nowrap; }
  .hod-dept-tag { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:6px; font-size:11px; font-weight:600; }

  /* ── Table ── */
  .hod-table-wrap { background:var(--surface); border:1px solid var(--border); border-radius:12px; overflow:hidden; margin-bottom:20px; }
  .hod-table { width:100%; border-collapse:collapse; font-size:12px; }
  .hod-table th { padding:10px 14px; text-align:left; font-size:9px; letter-spacing:.1em; color:var(--text-muted); text-transform:uppercase; border-bottom:1px solid var(--border); background:var(--surface-2); }
  .hod-table td { padding:10px 14px; border-bottom:1px solid var(--border); color:var(--text-mid); vertical-align:middle; }
  .hod-table tr:last-child td { border-bottom:none; }
  .hod-table tr:hover td { background:var(--surface-2); }

  /* ── Forms ── */
  .hod-inp { background:var(--surface-2); border:1px solid var(--border); border-radius:8px; padding:8px 11px; color:var(--text); font-size:12px; font-family:inherit; outline:none; width:100%; transition:.13s; }
  .hod-inp:focus { border-color:#10b981; background:var(--surface); }
  .hod-sel { background:var(--surface-2); border:1px solid var(--border); border-radius:8px; padding:8px 11px; color:var(--text); font-size:12px; font-family:inherit; outline:none; width:100%; }
  .hod-textarea { background:var(--surface-2); border:1px solid var(--border); border-radius:8px; padding:8px 11px; color:var(--text); font-size:12px; font-family:inherit; outline:none; width:100%; resize:vertical; min-height:70px; }
  .hod-lbl { display:block; font-size:9px; letter-spacing:.1em; color:var(--text-muted); text-transform:uppercase; margin-bottom:5px; font-weight:700; }
  .hod-form-row { margin-bottom:13px; }
  .hod-form-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:12px; }

  /* ── Buttons ── */
  .hod-btn { padding:8px 16px; border-radius:8px; font-size:12px; font-family:inherit; cursor:pointer; border:1px solid; transition:.14s; display:inline-flex; align-items:center; gap:6px; font-weight:600; white-space:nowrap; }
  .hod-btn-primary { background:#10b981; border-color:#10b981; color:#fff; }
  .hod-btn-primary:hover { background:#059669; }
  .hod-btn-primary:disabled { opacity:.4; cursor:not-allowed; }
  .hod-btn-ghost { background:transparent; border-color:var(--border); color:var(--text-muted); }
  .hod-btn-ghost:hover { color:var(--text); border-color:var(--border-strong); }
  .hod-btn-danger { background:rgba(239,68,68,0.1); border-color:rgba(239,68,68,0.3); color:#ef4444; }
  .hod-btn-danger:hover { background:rgba(239,68,68,0.2); }
  .hod-btn-amber { background:rgba(245,158,11,0.1); border-color:rgba(245,158,11,0.3); color:#f59e0b; }
  .hod-btn-blue { background:rgba(99,102,241,0.1); border-color:rgba(99,102,241,0.3); color:#6366f1; }

  /* ── Modal ── */
  .hod-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:1000; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px); animation:fadeIn .15s ease; }
  .hod-modal { background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:26px 28px; width:560px; max-width:95vw; max-height:88vh; overflow-y:auto; box-shadow:0 24px 60px rgba(0,0,0,0.5); position:relative; }
  .hod-modal-lg { width:780px; }
  .hod-modal-xl { width:920px; }
  .hod-modal-title { font-size:15px; font-weight:700; color:var(--text); margin-bottom:18px; padding-bottom:14px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:8px; }
  .hod-modal-close { position:absolute; top:14px; right:14px; width:28px; height:28px; border-radius:6px; background:var(--surface-2); border:1px solid var(--border); cursor:pointer; color:var(--text-muted); display:flex; align-items:center; justify-content:center; font-size:13px; }
  .hod-modal-close:hover { background:rgba(239,68,68,0.1); color:#ef4444; }
  .hod-modal-foot { display:flex; gap:10px; justify-content:flex-end; margin-top:18px; padding-top:14px; border-top:1px solid var(--border); }

  /* ── Section ── */
  .hod-section { background:var(--surface); border:1px solid var(--border); border-radius:12px; margin-bottom:16px; overflow:hidden; }
  .hod-section-head { display:flex; align-items:center; justify-content:space-between; padding:13px 18px; border-bottom:1px solid var(--border); background:var(--surface-2); }
  .hod-section-title { font-size:13px; font-weight:700; color:var(--text); display:flex; align-items:center; gap:8px; }
  .hod-section-body { padding:18px; }

  /* ── Filter bar ── */
  .hod-filter-bar { display:flex; gap:10px; flex-wrap:wrap; align-items:center; background:var(--surface); border:1px solid var(--border); border-radius:10px; padding:11px 16px; margin-bottom:18px; }

  /* ── Progress bar ── */
  .hod-progress-track { height:4px; background:var(--border); border-radius:4px; overflow:hidden; }
  .hod-progress-fill { height:100%; border-radius:4px; transition:width .3s; }

  /* ── Patient select list in modal ── */
  .hod-pt-list { background:var(--surface-2); border:1px solid var(--border); border-radius:8px; max-height:200px; overflow-y:auto; margin-top:4px; }
  .hod-pt-item { display:flex; align-items:center; justify-content:space-between; padding:8px 12px; cursor:pointer; border-bottom:1px solid var(--border); transition:.12s; font-size:12px; }
  .hod-pt-item:last-child { border-bottom:none; }
  .hod-pt-item:hover { background:rgba(16,185,129,0.06); }
  .hod-pt-item.sel { background:rgba(16,185,129,0.1); border-left:3px solid #10b981; }
  .hod-selected-pills { display:flex; flex-wrap:wrap; gap:6px; margin-top:8px; }
  .hod-sel-pill { display:inline-flex; align-items:center; gap:5px; background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); color:#10b981; border-radius:20px; padding:3px 10px; font-size:11px; font-weight:600; }
  .hod-sel-pill button { background:none; border:none; color:#10b981; cursor:pointer; font-size:12px; padding:0; opacity:.7; }
  .hod-sel-pill button:hover { opacity:1; }

  /* ── Review card ── */
  .hod-review-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:16px 18px; animation:fadeIn .25s ease; }
  .hod-star { color:#f59e0b; font-size:14px; }

  /* ── Toast ── */
  .hod-toasts { position:fixed; bottom:20px; right:20px; z-index:9999; display:flex; flex-direction:column; gap:8px; pointer-events:none; }
  .hod-toast { background:var(--surface); border:1px solid var(--border); border-radius:10px; padding:11px 16px; font-size:12px; font-weight:600; box-shadow:0 8px 30px rgba(0,0,0,0.3); display:flex; align-items:center; gap:8px; animation:fadeIn .2s ease; color:var(--text); }
  .hod-toast.s { border-left:3px solid #10b981; }
  .hod-toast.e { border-left:3px solid #ef4444; }
  .hod-toast.w { border-left:3px solid #f59e0b; }

  /* ── Empty ── */
  .hod-empty { text-align:center; padding:48px 20px; color:var(--text-muted); }
  .hod-empty-ico { font-size:40px; margin-bottom:12px; }

  /* ── Tab bar ── */
  .hod-tabs { display:flex; border-bottom:1px solid var(--border); background:var(--surface); overflow-x:auto; }
  .hod-tab { padding:11px 18px; font-size:12px; font-weight:600; cursor:pointer; border:none; background:none; color:var(--text-muted); font-family:inherit; border-bottom:2px solid transparent; transition:.12s; white-space:nowrap; display:flex; align-items:center; gap:6px; }
  .hod-tab:hover { color:var(--text-mid); }
  .hod-tab.act { color:#10b981; border-bottom-color:#10b981; }
  .hod-tab-dot { width:6px; height:6px; border-radius:50%; background:#10b981; }

  /* ── Dept assignment card ── */
  .hod-dept-assign-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:16px 18px; animation:slideIn .2s ease; }
  .hod-dept-header { display:flex; align-items:center; gap:10px; margin-bottom:12px; }
  .hod-dept-icon-wrap { width:36px; height:36px; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }

  /* ── HOD own work section ── */
  .hod-own-work-card { background:var(--surface); border:1.5px dashed var(--border-strong); border-radius:12px; padding:16px 18px; }

  @media(max-width:860px) {
    .hod-sb { display:none; }
    .hod-stat-grid { grid-template-columns:repeat(2,1fr); }
    .hod-patient-grid { grid-template-columns:1fr; }
  }
`;

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HodDashboard({ currentUser, onLogout }) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [activeView,  setActiveView]  = useState("overview");
  const [activeDept,  setActiveDept]  = useState("Billing");
  const [collapsed,   setCollapsed]   = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [toasts,      setToasts]      = useState([]);
  let _tid = useRef(0);

  // Data
  const [allPatients,  setAllPatients]  = useState([]);
  const [employees,    setEmployees]    = useState([]);
  const [tasks,        setTasks]        = useState([]);
  const [hodOwnTasks,  setHodOwnTasks]  = useState([]);
  const [reviews,      setReviews]      = useState([]);
  const [analytics,    setAnalytics]    = useState(null);
  const [notifications,setNotifications]= useState([]);

  // Assignment modal
  const [showAssignModal,  setShowAssignModal]  = useState(false);
  const [assignDept,       setAssignDept]       = useState("Billing");
  const [assignEmployee,   setAssignEmployee]   = useState("");
  const [assignPatients,   setAssignPatients]   = useState([]);
  const [assignPatientIds, setAssignPatientIds] = useState([]); // DB primary-key IDs
  const [assignPatientNames, setAssignPatientNames] = useState([]);
  const [assignPriority,   setAssignPriority]   = useState("Medium");
  const [assignDueDate,    setAssignDueDate]     = useState("");
  const [assignNotes,      setAssignNotes]       = useState("");
  const [patientSearch,    setPatientSearch]     = useState("");
  const [deptEmployees,    setDeptEmployees]     = useState([]);

  // HOD own work modal
  const [showHodWorkModal, setShowHodWorkModal] = useState(false);
  const [hodWorkPatient,   setHodWorkPatient]   = useState(null);
  const [hodWorkForm,      setHodWorkForm]      = useState({});

  // Review modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewTarget,    setReviewTarget]    = useState(null);
  const [reviewForm,      setReviewForm]      = useState({ rating:5, comments:"", score:"", period:"weekly" });

  // Submit to admin
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitTarget,    setSubmitTarget]    = useState(null);
  const [submitNote,      setSubmitNote]      = useState("");

  // Filters
  const [filterStatus,   setFilterStatus]   = useState("");
  const [filterEmployee, setFilterEmployee] = useState("");
  const [filterDate,     setFilterDate]     = useState("");
  const [filterRange,    setFilterRange]    = useState("weekly");
  const [searchQ,        setSearchQ]        = useState("");

  // ── Toast ──────────────────────────────────────────────────────────────────
  const toast = useCallback((msg, type = "s") => {
    const id = _tid.current++;
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3200);
  }, []);

  // ── API helpers ────────────────────────────────────────────────────────────
  const request = useCallback(async (path, options = {}) => {
    setLoading(true); setError(null);
    try {
      return await apiFetch(path, options);
    } catch (e) {
      setError(e.message);
      toast(e.message, "e");
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // ── Data loaders ───────────────────────────────────────────────────────────

  // GET /api/patients/  → PatientViewSet (all patients the HOD can access)
  const loadAllPatients = useCallback(async () => {
    const data = await request("/patients/");
    if (data) setAllPatients(Array.isArray(data) ? data : data.results || data.patients || []);
  }, [request]);

  // GET /api/hod/employees/?department=<dept>  → HODEmployeeListAPIView
  const loadEmployees = useCallback(async (dept = null) => {
    const q = dept ? `?department=${encodeURIComponent(dept)}` : "";
    const data = await request(`/hod/employees/${q}`);
    if (data) {
      const list = Array.isArray(data) ? data : data.employees || data.results || [];
      setEmployees(list);
      return list;
    }
    return [];
  }, [request]);

  // GET /api/hod/tasks/?department=<dept>&...  → HODTaskListCreateAPIView
  const loadTasks = useCallback(async () => {
    const params = new URLSearchParams({ department: activeDept });
    if (filterEmployee) params.append("assigned_to", filterEmployee);
    if (filterDate)     params.append("due_date",    filterDate);
    if (filterStatus)   params.append("status",      filterStatus);
    const data = await request(`/hod/tasks/?${params}`);
    if (data) setTasks(Array.isArray(data) ? data : data.results || data.tasks || []);
  }, [request, activeDept, filterEmployee, filterDate, filterStatus]);

  // GET /api/tasks/my-tasks/  → EmployeeMyTasksAPIView (HOD's own personal tasks)
  const loadHodOwnTasks = useCallback(async () => {
    const data = await request("/tasks/my-tasks/");
    if (data) setHodOwnTasks(Array.isArray(data) ? data : data.results || data.tasks || []);
  }, [request]);

  // GET /api/hod/analytics/?department=<dept>&range=<range>  → HODAnalyticsAPIView
  const loadAnalytics = useCallback(async () => {
    const params = new URLSearchParams({ department: activeDept, range: filterRange });
    if (filterEmployee) params.append("employee_id", filterEmployee);
    const data = await request(`/hod/analytics/?${params}`);
    if (data) setAnalytics(data);
  }, [request, activeDept, filterRange, filterEmployee]);

  // GET /api/hod/reviews/?department=<dept>  → HODReviewListCreateAPIView
  const loadReviews = useCallback(async () => {
    const data = await request(`/hod/reviews/?department=${encodeURIComponent(activeDept)}`);
    if (data) setReviews(Array.isArray(data) ? data : data.results || data.reviews || []);
  }, [request, activeDept]);

  // No dedicated notifications endpoint in backend — silently no-op to avoid 404
  const loadNotifications = useCallback(async () => {
    // /notifications/ is not registered in urls.py; skip gracefully
    setNotifications([]);
  }, []);

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    loadAllPatients();
    loadEmployees();
    loadTasks();
    loadHodOwnTasks();
    loadNotifications();
  }, []); // eslint-disable-line

  useEffect(() => {
    loadTasks();
    loadEmployees(activeDept).then(list => setDeptEmployees(list));
  }, [activeDept, filterStatus, filterEmployee, filterDate]); // eslint-disable-line

  useEffect(() => {
    if (activeView === "analytics")  loadAnalytics();
    if (activeView === "reviews")    loadReviews();
    if (activeView === "employees")  loadEmployees(activeDept).then(list => setDeptEmployees(list));
  }, [activeView, activeDept, filterRange]); // eslint-disable-line

  // ── Derived ────────────────────────────────────────────────────────────────
  const unassignedPatients = allPatients.filter(p =>
    !tasks.some(t => (t.patient_uhids || (t.patient_uhid ? [t.patient_uhid] : [])).includes(p.uhid))
  );
  const filteredPatients = allPatients.filter(p =>
    !searchQ || p.patientName?.toLowerCase().includes(searchQ.toLowerCase()) || p.uhid?.toLowerCase().includes(searchQ.toLowerCase())
  );
  const filteredPatientSearch = allPatients.filter(p =>
    !patientSearch ||
    p.patientName?.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.uhid?.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const pendingCount   = tasks.filter(t => t.status === "pending").length;
  const overdueCount   = tasks.filter(t => t.status === "overdue").length;
  const completedCount = tasks.filter(t => t.status === "completed").length;
  const submittedCount = tasks.filter(t => t.status === "submitted").length;
  const unreadNotif    = notifications.filter(n => !n.read).length;

  const deptColor = DEPT_META[activeDept]?.color || "#10b981";

  // ── Assignment handlers ────────────────────────────────────────────────────
  const openAssignModal = async (dept = activeDept) => {
    setAssignDept(dept);
    setAssignPatients([]);
    setAssignPatientIds([]);
    setAssignPatientNames([]);
    setAssignEmployee("");
    setAssignNotes("");
    setAssignDueDate("");
    setAssignPriority("Medium");
    setPatientSearch("");
    const list = await loadEmployees(dept);
    setDeptEmployees(list);
    setShowAssignModal(true);
  };

  const toggleAssignPatient = p => {
    const isSelected = assignPatients.includes(p.uhid);
    if (isSelected) {
      const idx = assignPatients.indexOf(p.uhid);
      setAssignPatients(prev => prev.filter(u => u !== p.uhid));
      setAssignPatientIds(prev => prev.filter((_, i) => i !== idx));
      setAssignPatientNames(prev => prev.filter((_, i) => i !== idx));
    } else if (assignPatients.length < 8) {
      setAssignPatients(prev => [...prev, p.uhid]);
      setAssignPatientIds(prev => [...prev, p.id]);          // DB integer PK
      setAssignPatientNames(prev => [...prev, p.patientName || p.name]);
    } else {
      toast("Maximum 8 patients per assignment", "w");
    }
  };

  // POST /api/tasks/bulk-assign/  → BulkTaskAssignAPIView
  // Payload fields: assign_to (int), patient_ids (int[]), department (str), title (str)
  const handleAssign = async () => {
    if (!assignEmployee)             { toast("Select an employee", "w"); return; }
    if (assignPatients.length === 0) { toast("Select at least one patient", "w"); return; }

    const payload = {
      department:  assignDept,
      assign_to:   Number(assignEmployee),   // ← BulkTaskAssignSerializer key
      patient_ids: assignPatientIds,          // ← integer PKs, not UHIDs
      title:       `${assignDept} task — ${assignPatients.length} patient(s)`,
    };

    const data = await request("/tasks/bulk-assign/", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (data) {
      toast(`Assigned ${assignPatients.length} patient(s) to ${assignDept}`);
      setShowAssignModal(false);
      loadTasks();
    }
  };

  // ── HOD own work ───────────────────────────────────────────────────────────
  const openHodWork = patient => {
    setHodWorkPatient(patient);
    setHodWorkForm({
      discharge: patient.discharge || {},
      medicalHistory: patient.medical_history || patient.medicalHistory || {},
      billing: patient.billing || {},
      notes: "",
      status: "in-progress",
      activeTab: "discharge",
    });
    setShowHodWorkModal(true);
  };

  // PATCH /api/hod/tasks/<pk>/  → HODTaskDetailAPIView (save progress on HOD's own task)
  // If task doesn't exist yet, POST /api/hod/tasks/ to create it first.
  const saveHodWork = async () => {
    if (!hodWorkPatient) return;

    // Find if HOD already has a task for this patient
    const existingTask = hodOwnTasks.find(t => t.patient_uhid === hodWorkPatient.uhid);

    const payload = {
      department:    activeDept,
      patient:       hodWorkPatient.id,
      title:         `HOD Work — ${hodWorkPatient.patientName || hodWorkPatient.name}`,
      status:        "in-progress",
      notes:         hodWorkForm.notes || "",
      extra_data:    {
        discharge:      hodWorkForm.discharge,
        medicalHistory: hodWorkForm.medicalHistory,
        billing:        hodWorkForm.billing,
      },
    };

    let data;
    if (existingTask) {
      // PATCH /api/hod/tasks/<pk>/  → HODTaskDetailAPIView
      data = await request(`/hod/tasks/${existingTask.id}/`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    } else {
      // POST /api/hod/tasks/  → HODTaskListCreateAPIView
      data = await request("/hod/tasks/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }

    if (data) {
      toast("Work saved successfully");
      setShowHodWorkModal(false);
      loadHodOwnTasks();
      loadAllPatients();
    }
  };

  // POST /api/tasks/<task_id>/update-status/  → EmployeeTaskUpdateAPIView
  // Used to mark HOD's own task as "submitted"
  const submitHodWorkToAdmin = async () => {
    if (!hodWorkPatient) return;
    const existingTask = hodOwnTasks.find(t => t.patient_uhid === hodWorkPatient.uhid);
    if (!existingTask) {
      toast("Save your work first before submitting", "w");
      return;
    }
    const data = await request(`/tasks/${existingTask.id}/update-status/`, {
      method: "POST",
      body: JSON.stringify({ status: "submitted", note: submitNote }),
    });
    if (data) {
      toast("Submitted to Admin Management ✓");
      setShowSubmitModal(false);
      setShowHodWorkModal(false);
      loadHodOwnTasks();
    }
  };

  // ── Review ─────────────────────────────────────────────────────────────────
  const openReview = (task, employee) => {
    setReviewTarget({ task, employee });
    setReviewForm({ rating:5, comments:"", score:"", period:"weekly" });
    setShowReviewModal(true);
  };

  // POST /api/hod/reviews/  → HODReviewListCreateAPIView
  const submitReview = async () => {
    if (!reviewTarget) return;
    const data = await request("/hod/reviews/", {
      method: "POST",
      body: JSON.stringify({
        ...reviewForm,
        department:        activeDept,
        employee_id:       reviewForm.employeeId ||
                           reviewTarget.employee?.id ||
                           reviewTarget.task?.assigned_to,
        task_id:           reviewTarget.task?.id,
        performance_score: reviewForm.score,
      }),
    });
    if (data) {
      toast("Review submitted ✓");
      setShowReviewModal(false);
      loadReviews();
    }
  };

  // ── Submit task to admin ───────────────────────────────────────────────────
  const openSubmitToAdmin = target => {
    setSubmitTarget(target);
    setSubmitNote("");
    setShowSubmitModal(true);
  };

  // POST /api/tasks/<task_id>/update-status/  → EmployeeTaskUpdateAPIView
  // Marks the task status as "submitted" (visible to Admin / Super Admin)
  const confirmSubmitToAdmin = async () => {
    if (!submitTarget) return;
    const data = await request(`/tasks/${submitTarget.id}/update-status/`, {
      method: "POST",
      body: JSON.stringify({ status: "submitted", note: submitNote }),
    });
    if (data) {
      toast("Submitted to Admin Management ✓");
      setShowSubmitModal(false);
      setSubmitTarget(null);
      loadTasks();
      loadHodOwnTasks();
    }
  };

  // ── Task status update ─────────────────────────────────────────────────────
  // POST /api/tasks/<task_id>/update-status/  → EmployeeTaskUpdateAPIView
  const updateTaskStatus = async (id, status) => {
    const data = await request(`/tasks/${id}/update-status/`, {
      method: "POST",
      body: JSON.stringify({ status }),
    });
    if (data) { toast(`Status → ${status}`); loadTasks(); }
  };

  // ── Render helpers ─────────────────────────────────────────────────────────
  const renderIcon = (Icon, size = 15, sw = 1.8) =>
    Icon ? <Icon size={size} strokeWidth={sw} /> : null;

  const StatusBadge = ({ status }) => {
    const m = STATUS_META[status] || STATUS_META.pending;
    return (
      <span className="hod-badge" style={{ background:m.bg, color:m.text, borderColor:m.border }}>
        {m.label}
      </span>
    );
  };

  const PriorityBadge = ({ priority }) => {
    const m = PRIORITY_META[priority] || PRIORITY_META.Medium;
    return (
      <span className="hod-badge" style={{ background:m.bg, color:m.color, borderColor:m.color + "40" }}>
        {priority}
      </span>
    );
  };

  const DeptTag = ({ dept }) => {
    const meta = DEPT_META[dept] || {};
    const Icon = meta.icon;
    return (
      <span className="hod-dept-tag" style={{ background:`${meta.color || "#64748b"}15`, color:meta.color || "#64748b", border:`1px solid ${meta.color || "#64748b"}30` }}>
        {Icon && <Icon size={10} strokeWidth={2}/>} {dept}
      </span>
    );
  };

  // ── Sidebar ─────────────────────────────────────────────────────────────────
  const VIEWS = [
    { id:"overview",   label:"Overview",         icon:Activity },
    { id:"assign",     label:"Assign Tasks",      icon:CheckSquare },
    { id:"my-work",    label:"My Own Work",       icon:FileText },
    { id:"dept-tasks", label:"Department Tasks",  icon:ClipboardList },
    { id:"analytics",  label:"Analytics",         icon:BarChart3 },
    { id:"reviews",    label:"Reviews",           icon:Star },
    { id:"employees",  label:"Employees",         icon:Users },
  ];

  const renderSidebar = () => (
    <aside className={`hod-sb${collapsed ? " col" : ""}`}>
      <div className="hod-sb-head">
        {!collapsed && (
          <div style={{ flex:1, overflow:"hidden" }}>
            <div style={{ fontSize:8, letterSpacing:".12em", color:deptColor, textTransform:"uppercase", marginBottom:2 }}>HOD Panel</div>
            <div style={{ fontSize:14, fontWeight:700, color:"var(--text)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
              {currentUser?.name || "Head of Dept"}
            </div>
          </div>
        )}
        {collapsed && <div className="hod-logo">H</div>}
        <button className="hod-col-btn" onClick={() => setCollapsed(c => !c)}>
          {collapsed ? "»" : "«"}
        </button>
      </div>

      {/* Mini stats */}
      {!collapsed && (
        <div className="hod-sb-mini-stats">
          {[
            { val:pendingCount,   col:"#f59e0b", lbl:"Pend" },
            { val:overdueCount,   col:"#ef4444", lbl:"Over" },
            { val:completedCount, col:"#10b981", lbl:"Done" },
          ].map((s,i) => (
            <div key={i} className="hod-mini-stat" style={{ background:`${s.col}10`, borderColor:`${s.col}25` }}>
              <div style={{ fontSize:15, fontWeight:800, color:s.col }}>{s.val}</div>
              <div style={{ fontSize:8, color:"var(--text-muted)", letterSpacing:".08em", textTransform:"uppercase", marginTop:1 }}>{s.lbl}</div>
            </div>
          ))}
        </div>
      )}

      {/* Dept selector */}
      <div className="hod-slbl">{collapsed ? "DEPT" : "Departments"}</div>
      {DEPARTMENTS.map(dept => {
        const meta = DEPT_META[dept] || {};
        const Icon = meta.icon;
        const deptTaskCount = tasks.filter(t => t.department === dept).length;
        return (
          <button
            key={dept}
            className={`hod-nav-item${activeDept === dept && activeView === "dept-tasks" ? " act" : ""}`}
            style={{ borderLeftColor: activeDept === dept && activeView === "dept-tasks" ? meta.color : "transparent" }}
            onClick={() => { setActiveDept(dept); setActiveView("dept-tasks"); }}
          >
            <div className="hod-nav-icon" style={{ background:`${meta.color || "#64748b"}15`, color:meta.color || "#64748b" }}>
              {Icon && <Icon size={14} strokeWidth={1.8}/>}
            </div>
            {!collapsed && (
              <>
                <span style={{ flex:1 }}>{dept}</span>
                {deptTaskCount > 0 && (
                  <span style={{ fontSize:9, background:`${meta.color}20`, color:meta.color, borderRadius:10, padding:"1px 6px", fontWeight:700 }}>
                    {deptTaskCount}
                  </span>
                )}
              </>
            )}
          </button>
        );
      })}

      {/* Navigation */}
      <div className="hod-slbl">{collapsed ? "NAV" : "Navigation"}</div>
      {VIEWS.map(v => {
        const Icon = v.icon;
        return (
          <button
            key={v.id}
            className={`hod-nav-item${activeView === v.id ? " act" : ""}`}
            onClick={() => setActiveView(v.id)}
          >
            <div className="hod-nav-icon">
              {Icon && <Icon size={14} strokeWidth={1.8}/>}
            </div>
            {!collapsed && v.label}
            {!collapsed && v.id === "my-work" && hodOwnTasks.filter(t => t.status !== "submitted").length > 0 && (
              <span style={{ fontSize:9, background:"rgba(99,102,241,0.2)", color:"#6366f1", borderRadius:10, padding:"1px 6px", fontWeight:700, marginLeft:"auto" }}>
                {hodOwnTasks.filter(t => t.status !== "submitted").length}
              </span>
            )}
          </button>
        );
      })}

      <div className="hod-sb-footer">
        {!collapsed && currentUser && (
          <div className="hod-user-card">
            <div className="hod-avatar">{initials(currentUser.name)}</div>
            <div style={{ overflow:"hidden" }}>
              <div style={{ fontSize:12, fontWeight:600, color:"var(--text)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{currentUser.name}</div>
              <div style={{ fontSize:9, color:"var(--text-muted)", letterSpacing:".06em", textTransform:"uppercase" }}>HOD · {currentUser.department || activeDept}</div>
            </div>
          </div>
        )}
        <button className="hod-logout" onClick={onLogout}>
          <span style={{ fontSize:14 }}>⎋</span>
          {!collapsed && "Logout"}
        </button>
      </div>
    </aside>
  );

  // ── Header ─────────────────────────────────────────────────────────────────
  const renderHeader = () => (
    <header className="hod-hdr">
      <div>
        <div style={{ fontSize:9, letterSpacing:".1em", color:"var(--text-muted)", textTransform:"uppercase" }}>
          HOD Dashboard / {activeDept}
        </div>
        <div style={{ fontSize:16, fontWeight:700, color:"var(--text)" }}>
          {VIEWS.find(v => v.id === activeView)?.label || activeDept} Department
        </div>
      </div>
      <div className="hod-hdr-right">
        {loading && (
          <div className="hod-sync-pill">
            <div style={{ width:6, height:6, borderRadius:"50%", background:"#06b6d4", animation:"pulse 1s infinite" }}/>
            SYNCING
          </div>
        )}
        <button className="hod-btn hod-btn-ghost" style={{ position:"relative" }}>
          <Bell size={14} strokeWidth={1.8}/>
          {unreadNotif > 0 && (
            <span style={{ position:"absolute", top:-4, right:-4, background:"#ef4444", color:"#fff", borderRadius:"50%", width:14, height:14, fontSize:8, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>
              {unreadNotif}
            </span>
          )}
        </button>
        <button className="hod-btn hod-btn-ghost" onClick={() => { loadTasks(); loadAllPatients(); loadHodOwnTasks(); }}>
          <RefreshCw size={13} strokeWidth={1.8}/>
        </button>
        <ThemeModeDock variant="inline"/>
      </div>
    </header>
  );

  // ── View: Overview ─────────────────────────────────────────────────────────
  const renderOverview = () => {
    const deptSummary = DEPARTMENTS.map(dept => ({
      dept,
      total:     tasks.filter(t => t.department === dept).length,
      pending:   tasks.filter(t => t.department === dept && t.status === "pending").length,
      completed: tasks.filter(t => t.department === dept && t.status === "completed").length,
      overdue:   tasks.filter(t => t.department === dept && t.status === "overdue").length,
    }));

    return (
      <div>
        {/* Stats */}
        <div className="hod-stat-grid">
          {[
            { label:"Total Patients",   val:allPatients.length,       col:"#10b981" },
            { label:"Tasks Assigned",   val:tasks.length,             col:"#3b82f6" },
            { label:"Pending",          val:pendingCount,              col:"#f59e0b" },
            { label:"Completed",        val:completedCount,            col:"#10b981" },
            { label:"Overdue",          val:overdueCount,              col:"#ef4444" },
            { label:"Submitted",        val:submittedCount,            col:"#6366f1" },
            { label:"My Own Tasks",     val:hodOwnTasks.length,        col:"#a78bfa" },
            { label:"Unassigned Pts",   val:unassignedPatients.length, col:"#f97316" },
          ].map((s,i) => (
            <div key={i} className="hod-stat-card" style={{ "--col":s.col }}>
              <style>{`.hod-stat-card:nth-child(${i+1})::before{background:${s.col}}`}</style>
              <div style={{ fontSize:26, fontWeight:800, color:s.col, marginBottom:4 }}>{s.val}</div>
              <div style={{ fontSize:11, color:"var(--text-muted)" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Dept summary table */}
        <div className="hod-section">
          <div className="hod-section-head">
            <div className="hod-section-title">📊 Department Summary</div>
            <button className="hod-btn hod-btn-primary" onClick={() => openAssignModal()}>
              + Assign Task
            </button>
          </div>
          <div className="hod-table-wrap" style={{ margin:0, borderRadius:0, border:"none" }}>
            <table className="hod-table">
              <thead>
                <tr>
                  {["Department","Total","Pending","Completed","Overdue","Action"].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deptSummary.map(d => {
                  const meta = DEPT_META[d.dept] || {};
                  const Icon = meta.icon;
                  return (
                    <tr key={d.dept}>
                      <td>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ width:28, height:28, borderRadius:7, background:`${meta.color || "#64748b"}15`, border:`1px solid ${meta.color || "#64748b"}25`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                            {Icon && <Icon size={13} strokeWidth={1.8} style={{ color:meta.color || "#64748b" }}/>}
                          </div>
                          <span style={{ fontWeight:600, color:"var(--text)" }}>{d.dept}</span>
                        </div>
                      </td>
                      <td><strong>{d.total}</strong></td>
                      <td><span style={{ color:"#f59e0b", fontWeight:600 }}>{d.pending}</span></td>
                      <td><span style={{ color:"#10b981", fontWeight:600 }}>{d.completed}</span></td>
                      <td><span style={{ color:"#ef4444", fontWeight:600 }}>{d.overdue}</span></td>
                      <td>
                        <div style={{ display:"flex", gap:6 }}>
                          <button className="hod-btn hod-btn-ghost" style={{ padding:"4px 10px", fontSize:"10px" }}
                            onClick={() => { setActiveDept(d.dept); setActiveView("dept-tasks"); }}>
                            View
                          </button>
                          <button className="hod-btn hod-btn-primary" style={{ padding:"4px 10px", fontSize:"10px" }}
                            onClick={() => openAssignModal(d.dept)}>
                            Assign
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Unassigned patients */}
        {unassignedPatients.length > 0 && (
          <div className="hod-section" style={{ marginTop:18 }}>
            <div className="hod-section-head">
              <div className="hod-section-title">
                <span style={{ color:"#f97316" }}>⚠</span>
                Unassigned Patients ({unassignedPatients.length})
              </div>
              <button className="hod-btn hod-btn-amber" onClick={() => openAssignModal()}>
                Assign Now
              </button>
            </div>
            <div className="hod-table-wrap" style={{ margin:0, borderRadius:0, border:"none" }}>
              <table className="hod-table">
                <thead>
                  <tr>{["Patient","UHID","Ward","DOA","Status","Action"].map(h => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {unassignedPatients.slice(0, 8).map(p => (
                    <tr key={p.uhid}>
                      <td style={{ color:"var(--text)", fontWeight:600 }}>{p.patientName || p.name}</td>
                      <td style={{ fontFamily:"monospace", fontSize:11 }}>{p.uhid}</td>
                      <td>{p.ward || "—"}</td>
                      <td style={{ fontSize:11 }}>{fmtDt(p.doa || p.dateTime)}</td>
                      <td><StatusBadge status={p.dod ? "completed" : "pending"}/></td>
                      <td>
                        <div style={{ display:"flex", gap:6 }}>
                          <button className="hod-btn hod-btn-primary" style={{ padding:"4px 10px", fontSize:"10px" }}
                            onClick={() => {
                              setAssignPatients([p.uhid]);
                              setAssignPatientIds([p.id]);
                              setAssignPatientNames([p.patientName || p.name]);
                              openAssignModal();
                            }}>
                            Assign
                          </button>
                          <button className="hod-btn hod-btn-ghost" style={{ padding:"4px 10px", fontSize:"10px" }}
                            onClick={() => openHodWork(p)}>
                            Work Myself
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── View: Assign Tasks ──────────────────────────────────────────────────────
  const renderAssign = () => (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:700, color:"var(--text)" }}>Assign Tasks to Departments</div>
          <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:3 }}>
            Assign multiple patients (up to 8) to any department employee
          </div>
        </div>
        <button className="hod-btn hod-btn-primary" onClick={() => openAssignModal()}>
          + New Assignment
        </button>
      </div>

      {/* Patient search */}
      <div className="hod-filter-bar">
        <Search size={14} strokeWidth={1.8} style={{ color:"var(--text-muted)" }}/>
        <input className="hod-inp" style={{ maxWidth:280 }} placeholder="Search patients…"
          value={searchQ} onChange={e => setSearchQ(e.target.value)}/>
      </div>

      {/* Per-dept assignment cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
        {DEPARTMENTS.map(dept => {
          const meta    = DEPT_META[dept] || {};
          const Icon    = meta.icon;
          const deptPts = tasks.filter(t => t.department === dept);
          const empCount = employees.filter(e => e.department === dept || e.dept === dept).length;
          return (
            <div key={dept} className="hod-dept-assign-card">
              <div className="hod-dept-header">
                <div className="hod-dept-icon-wrap" style={{ background:`${meta.color || "#64748b"}15`, border:`1px solid ${meta.color || "#64748b"}25` }}>
                  {Icon && <Icon size={16} strokeWidth={1.8} style={{ color:meta.color || "#64748b" }}/>}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"var(--text)" }}>{dept}</div>
                  <div style={{ fontSize:10, color:"var(--text-muted)", marginTop:1 }}>{meta.desc}</div>
                </div>
                <button className="hod-btn hod-btn-primary" style={{ padding:"5px 12px", fontSize:"10px" }}
                  onClick={() => openAssignModal(dept)}>
                  Assign
                </button>
              </div>
              <div style={{ display:"flex", gap:14, marginBottom:10 }}>
                {[
                  { label:"Employees", val:empCount,                                              col:meta.color || "#64748b" },
                  { label:"Tasks",     val:deptPts.length,                                        col:"#3b82f6" },
                  { label:"Done",      val:deptPts.filter(t=>t.status==="completed").length,      col:"#10b981" },
                ].map((s,i) => (
                  <div key={i} style={{ textAlign:"center" }}>
                    <div style={{ fontSize:18, fontWeight:800, color:s.col }}>{s.val}</div>
                    <div style={{ fontSize:9, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:".07em" }}>{s.label}</div>
                  </div>
                ))}
              </div>
              {deptPts.length > 0 && (
                <div>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"var(--text-muted)", marginBottom:4 }}>
                    <span>Progress</span>
                    <span>{Math.round((deptPts.filter(t=>t.status==="completed").length/deptPts.length)*100)}%</span>
                  </div>
                  <div className="hod-progress-track">
                    <div className="hod-progress-fill" style={{ width:`${(deptPts.filter(t=>t.status==="completed").length/deptPts.length)*100}%`, background:meta.color || "#10b981" }}/>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── View: My Own Work ───────────────────────────────────────────────────────
  const renderMyWork = () => (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:700, color:"var(--text)" }}>My Own Work</div>
          <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:3 }}>
            Patients you are personally handling — billing, notes, discharge, reports
          </div>
        </div>
      </div>

      {/* Patients not assigned to anyone */}
      <div className="hod-section" style={{ marginBottom:18 }}>
        <div className="hod-section-head">
          <div className="hod-section-title">📋 Patients I'm Handling Personally</div>
          <button className="hod-btn hod-btn-ghost" onClick={loadAllPatients}>
            <RefreshCw size={12}/> Refresh
          </button>
        </div>
        {unassignedPatients.length === 0 ? (
          <div className="hod-empty">
            <div className="hod-empty-ico">✅</div>
            <div>All patients are assigned to department staff.</div>
          </div>
        ) : (
          <div className="hod-patient-grid" style={{ padding:16 }}>
            {unassignedPatients.map(p => (
              <div key={p.uhid} className="hod-patient-card">
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:"var(--text)" }}>{p.patientName || p.name}</div>
                    <div style={{ fontSize:10, fontFamily:"monospace", color:"var(--text-muted)", marginTop:2 }}>{p.uhid}</div>
                  </div>
                  <StatusBadge status={p.dod ? "completed" : "pending"}/>
                </div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
                  {p.ward && <span className="hod-chip">🛏 {p.ward}</span>}
                  {p.doctor && <span className="hod-chip">👨‍⚕️ {p.doctor}</span>}
                  {p.ageYY && <span className="hod-chip">{p.ageYY}y {p.gender?.[0]}</span>}
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button className="hod-btn hod-btn-primary" style={{ flex:1 }} onClick={() => openHodWork(p)}>
                    <FileText size={12}/> Work on This
                  </button>
                  <button className="hod-btn hod-btn-ghost" style={{ flex:1 }} onClick={() => openAssignModal()}>
                    <Send size={12}/> Assign
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* HOD own task history — sourced from /tasks/my-tasks/ */}
      <div className="hod-section">
        <div className="hod-section-head">
          <div className="hod-section-title">📁 My Task History</div>
        </div>
        {hodOwnTasks.length === 0 ? (
          <div className="hod-empty">
            <div className="hod-empty-ico">📂</div>
            <div>No tasks recorded yet.</div>
          </div>
        ) : (
          <div className="hod-table-wrap" style={{ margin:0, borderRadius:0, border:"none" }}>
            <table className="hod-table">
              <thead>
                <tr>{["Patient","UHID","Priority","Status","Due","Action"].map(h=><th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {hodOwnTasks.map(t => (
                  <tr key={t.id}>
                    <td style={{ color:"var(--text)", fontWeight:600 }}>{t.patient_name}</td>
                    <td style={{ fontFamily:"monospace", fontSize:11 }}>{t.patient_uhid}</td>
                    <td><PriorityBadge priority={t.priority || "Medium"}/></td>
                    <td><StatusBadge status={t.status}/></td>
                    <td style={{ fontSize:11 }}>{fmtDt(t.due_date)}</td>
                    <td>
                      <div style={{ display:"flex", gap:6 }}>
                        {t.status !== "submitted" && (
                          <>
                            <button className="hod-btn hod-btn-ghost" style={{ padding:"4px 10px", fontSize:"10px" }}
                              onClick={() => openHodWork({ uhid:t.patient_uhid, patientName:t.patient_name, id:t.patient, ...t.extra_data })}>
                              Continue
                            </button>
                            <button className="hod-btn hod-btn-blue" style={{ padding:"4px 10px", fontSize:"10px" }}
                              onClick={() => openSubmitToAdmin({ id:t.id, type:"own", name:t.patient_name })}>
                              Submit
                            </button>
                          </>
                        )}
                        {t.status === "submitted" && (
                          <span style={{ fontSize:11, color:"#6366f1", fontWeight:600 }}>✓ Submitted</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  // ── View: Department Tasks ──────────────────────────────────────────────────
  const renderDeptTasks = () => {
    const filtered = tasks.filter(t => {
      if (filterStatus   && t.status      !== filterStatus)                return false;
      if (filterEmployee && String(t.assigned_to) !== filterEmployee)      return false;
      return true;
    });

    return (
      <div>
        <div className="hod-filter-bar">
          <Filter size={13} style={{ color:"var(--text-muted)" }}/>
          <select className="hod-sel" style={{ width:"auto" }} value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)}>
            <option value="">All Employees</option>
            {employees.filter(e => (e.department||e.dept) === activeDept).map(e => (
              <option key={e.id} value={e.id}>{e.name || e.get_full_name} ({e.employee_code || e.employeeCode})</option>
            ))}
          </select>
          <select className="hod-sel" style={{ width:"auto" }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            {Object.entries(STATUS_META).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <input type="date" className="hod-inp" style={{ width:"auto" }} value={filterDate} onChange={e => setFilterDate(e.target.value)}/>
          <button className="hod-btn hod-btn-ghost" onClick={loadTasks}><RefreshCw size={12}/></button>
          <button className="hod-btn hod-btn-primary" style={{ marginLeft:"auto" }} onClick={() => openAssignModal(activeDept)}>
            + Assign to {activeDept}
          </button>
        </div>

        {/* Stats */}
        <div className="hod-stat-grid" style={{ marginBottom:18 }}>
          {[
            { label:"Total",     val:tasks.filter(t=>t.department===activeDept).length,                         col:deptColor   },
            { label:"Pending",   val:tasks.filter(t=>t.department===activeDept&&t.status==="pending").length,   col:"#f59e0b" },
            { label:"Completed", val:tasks.filter(t=>t.department===activeDept&&t.status==="completed").length, col:"#10b981" },
            { label:"Overdue",   val:tasks.filter(t=>t.department===activeDept&&t.status==="overdue").length,   col:"#ef4444" },
          ].map((s,i) => (
            <div key={i} className="hod-stat-card">
              <div style={{ fontSize:24, fontWeight:800, color:s.col }}>{s.val}</div>
              <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:3 }}>{s.label} Tasks</div>
            </div>
          ))}
        </div>

        <div className="hod-table-wrap">
          <table className="hod-table">
            <thead>
              <tr>{["Task","Patients","Assignee","Priority","Status","Due","Submitted","Actions"].map(h=><th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign:"center", padding:40, color:"var(--text-muted)" }}>No tasks found</td></tr>
              ) : filtered.map(task => (
                <tr key={task.id}>
                  <td>
                    <div style={{ fontWeight:600, color:"var(--text)", fontSize:12 }}>{task.title}</div>
                    {task.notes && <div style={{ fontSize:10, color:"var(--text-muted)", marginTop:2 }}>{task.notes.slice(0,50)}{task.notes.length>50?"…":""}</div>}
                  </td>
                  <td>
                    {(task.patient_uhids || (task.patient_uhid ? [task.patient_uhid] : [])).map((u,i) => (
                      <div key={i} style={{ fontSize:10, color:"#06b6d4", fontFamily:"monospace" }}>
                        {(task.patient_names||[])[i] || u}
                      </div>
                    ))}
                  </td>
                  <td style={{ fontWeight:600 }}>{task.assigned_to_name || "—"}</td>
                  <td><PriorityBadge priority={task.priority || "Medium"}/></td>
                  <td>
                    {/* POST /api/tasks/<id>/update-status/ */}
                    <select
                      className="hod-sel"
                      style={{ width:"auto", padding:"3px 8px", fontSize:10, background:STATUS_META[task.status]?.bg||"transparent", color:STATUS_META[task.status]?.text||"var(--text-mid)", borderColor:STATUS_META[task.status]?.border||"var(--border)" }}
                      value={task.status}
                      onChange={e => updateTaskStatus(task.id, e.target.value)}
                    >
                      {Object.entries(STATUS_META).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </td>
                  <td style={{ fontSize:11 }}>{fmtDt(task.due_date)}</td>
                  <td style={{ fontSize:11 }}>
                    {task.submitted_at ? <span style={{ color:"#6366f1" }}>✓ {fmtDt(task.submitted_at)}</span> : "—"}
                  </td>
                  <td>
                    <div style={{ display:"flex", gap:5 }}>
                      <button className="hod-btn hod-btn-ghost" style={{ padding:"3px 9px", fontSize:"10px" }}
                        onClick={() => openReview(task, null)}>
                        <Star size={10}/> Review
                      </button>
                      {task.status === "completed" && !task.submitted_at && (
                        <button className="hod-btn hod-btn-blue" style={{ padding:"3px 9px", fontSize:"10px" }}
                          onClick={() => openSubmitToAdmin({ id:task.id, type:"task", name:task.title })}>
                          <Send size={10}/> Submit
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ── View: Analytics ─────────────────────────────────────────────────────────
  const renderAnalytics = () => (
    <div>
      <div className="hod-filter-bar">
        <select className="hod-sel" style={{ width:"auto" }} value={filterRange} onChange={e => setFilterRange(e.target.value)}>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
        <select className="hod-sel" style={{ width:"auto" }} value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)}>
          <option value="">All Employees</option>
          {employees.filter(e=>(e.department||e.dept)===activeDept).map(e => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
      </div>

      {!analytics ? (
        <div className="hod-empty"><div className="hod-empty-ico">📊</div><div>Loading analytics...</div></div>
      ) : (
        <>
          <div className="hod-stat-grid">
            {(analytics.stats || []).map((stat,i) => {
              const cols = [deptColor,"#34d399","#f59e0b","#a78bfa"];
              return (
                <div key={i} className="hod-stat-card">
                  <div style={{ fontSize:24, fontWeight:800, color:cols[i%4] }}>{stat.value}</div>
                  <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:3 }}>{stat.label}</div>
                  {stat.sub && <div style={{ fontSize:10, color:"var(--text-muted)", marginTop:2 }}>{stat.sub}</div>}
                </div>
              );
            })}
          </div>

          <div className="hod-section">
            <div className="hod-section-head">
              <div className="hod-section-title">👥 Employee Performance — {activeDept}</div>
            </div>
            <div className="hod-table-wrap" style={{ margin:0, borderRadius:0, border:"none" }}>
              <table className="hod-table">
                <thead>
                  <tr>{["Employee","Assigned","Completed","Pending","Overdue","Completion %","Action"].map(h=><th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {(analytics.employee_stats || analytics.employeeStats || []).map(emp => (
                    <tr key={emp.id}>
                      <td style={{ fontWeight:600, color:"var(--text)" }}>{emp.name}</td>
                      <td>{emp.assigned}</td>
                      <td style={{ color:"#10b981" }}>{emp.completed}</td>
                      <td style={{ color:"#f59e0b" }}>{emp.pending}</td>
                      <td style={{ color:"#ef4444" }}>{emp.overdue}</td>
                      <td>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ flex:1 }} className="hod-progress-track">
                            <div className="hod-progress-fill" style={{ width:`${emp.completion_pct||emp.completionPct||0}%`, background:emp.completion_pct>=80?"#10b981":emp.completion_pct>=50?"#f59e0b":"#ef4444" }}/>
                          </div>
                          <span style={{ fontSize:11, fontWeight:700, color:"var(--text)", minWidth:32 }}>
                            {emp.completion_pct||emp.completionPct||0}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <button className="hod-btn hod-btn-ghost" style={{ padding:"3px 9px", fontSize:"10px" }}
                          onClick={() => openReview(null, emp)}>
                          <Star size={10}/> Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );

  // ── View: Reviews ───────────────────────────────────────────────────────────
  const renderReviews = () => (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div style={{ fontSize:18, fontWeight:700, color:"var(--text)" }}>Department Reviews — {activeDept}</div>
        <button className="hod-btn hod-btn-primary" onClick={() => { setReviewTarget(null); setReviewForm({rating:5,comments:"",score:"",period:"weekly"}); setShowReviewModal(true); }}>
          <Star size={13}/> Submit Review
        </button>
      </div>

      {reviews.length === 0 ? (
        <div className="hod-empty">
          <div className="hod-empty-ico">⭐</div>
          <div>No reviews yet. Submit the first review!</div>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:14 }}>
          {reviews.map(rev => (
            <div key={rev.id} className="hod-review-card">
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:"var(--text)" }}>{rev.employee_name || rev.employeeName}</div>
                  <div style={{ fontSize:10, color:"var(--text-muted)", marginTop:2 }}>{rev.period} · {fmtDt(rev.submitted_at || rev.submittedAt || rev.created_at)}</div>
                </div>
                <span className="hod-badge" style={{ background:"rgba(245,158,11,0.1)", color:"#f59e0b", borderColor:"rgba(245,158,11,0.3)" }}>
                  {"★".repeat(rev.rating)}{"☆".repeat(5-rev.rating)}
                </span>
              </div>
              {rev.performance_score && (
                <div style={{ fontSize:12, color:"#10b981", fontWeight:700, marginBottom:6 }}>
                  Score: {rev.performance_score}
                </div>
              )}
              <div style={{ fontSize:12, color:"var(--text-mid)", lineHeight:1.6 }}>{rev.comments}</div>
              {rev.submitted_to_admin && (
                <div style={{ marginTop:8, fontSize:11, color:"#6366f1", fontWeight:600 }}>
                  ✓ Reflected to Admin Management
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── View: Employees ─────────────────────────────────────────────────────────
  const renderEmployees = () => (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div style={{ fontSize:18, fontWeight:700, color:"var(--text)" }}>Employees — {activeDept}</div>
        <button className="hod-btn hod-btn-ghost" onClick={() => loadEmployees(activeDept).then(l => setDeptEmployees(l))}>
          <RefreshCw size={12}/> Refresh
        </button>
      </div>
      {deptEmployees.length === 0 ? (
        <div className="hod-empty">
          <div className="hod-empty-ico">👥</div>
          <div>No employees found for {activeDept}.</div>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
          {deptEmployees.map((emp,i) => {
            const empTasks = tasks.filter(t => t.assigned_to === emp.id);
            return (
              <div key={emp.id} style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"16px 18px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:["rgba(16,185,129,0.15)","rgba(129,140,248,0.15)","rgba(245,158,11,0.15)","rgba(239,68,68,0.15)"][i%4], display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:700, color:[deptColor,"#818cf8","#f59e0b","#ef4444"][i%4], flexShrink:0 }}>
                    {initials(emp.name)}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"var(--text)" }}>{emp.name}</div>
                    <div style={{ fontSize:10, color:"var(--text-muted)", marginTop:2 }}>{emp.role || "Staff"} · {emp.employee_code || emp.employeeCode}</div>
                  </div>
                  <StatusBadge status={emp.is_active !== false ? "completed" : "overdue"}/>
                </div>
                {emp.email && <div style={{ fontSize:11, color:"var(--text-muted)", marginBottom:4 }}>✉ {emp.email}</div>}
                {emp.phone_number && <div style={{ fontSize:11, color:"var(--text-muted)", marginBottom:10 }}>📞 {emp.phone_number}</div>}
                <div style={{ display:"flex", gap:12 }}>
                  {[
                    { label:"Tasks",     val:empTasks.length,                                col:deptColor   },
                    { label:"Completed", val:empTasks.filter(t=>t.status==="completed").length, col:"#10b981" },
                    { label:"Pending",   val:empTasks.filter(t=>t.status==="pending").length,   col:"#f59e0b" },
                  ].map((s,j) => (
                    <div key={j} style={{ textAlign:"center" }}>
                      <div style={{ fontSize:16, fontWeight:800, color:s.col }}>{s.val}</div>
                      <div style={{ fontSize:9, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:".07em" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", gap:8, marginTop:12 }}>
                  <button className="hod-btn hod-btn-primary" style={{ flex:1, fontSize:"10px", padding:"5px" }}
                    onClick={() => { setAssignEmployee(String(emp.id)); openAssignModal(activeDept); }}>
                    Assign Task
                  </button>
                  <button className="hod-btn hod-btn-ghost" style={{ flex:1, fontSize:"10px", padding:"5px" }}
                    onClick={() => openReview(null, emp)}>
                    Review
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ── MODALS ─────────────────────────────────────────────────────────────────

  // Assign Modal  →  POST /api/tasks/bulk-assign/
  const renderAssignModal = () => (
    <div className="hod-overlay" onClick={() => setShowAssignModal(false)}>
      <div className="hod-modal hod-modal-lg" onClick={e => e.stopPropagation()}>
        <button className="hod-modal-close" onClick={() => setShowAssignModal(false)}>✕</button>
        <div className="hod-modal-title">
          <CheckSquare size={16} strokeWidth={1.8}/> Assign Task
        </div>

        <div className="hod-form-grid" style={{ marginBottom:14 }}>
          <div className="hod-form-row">
            <label className="hod-lbl">Department</label>
            <select className="hod-sel" value={assignDept}
              onChange={async e => {
                setAssignDept(e.target.value);
                setAssignEmployee("");
                const list = await loadEmployees(e.target.value);
                setDeptEmployees(list);
              }}>
              {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="hod-form-row">
            <label className="hod-lbl">Assign To *</label>
            <select className="hod-sel" value={assignEmployee} onChange={e => setAssignEmployee(e.target.value)}>
              <option value="">Select Employee</option>
              {deptEmployees.map(e => (
                <option key={e.id} value={e.id}>{e.name} ({e.employee_code || e.employeeCode})</option>
              ))}
            </select>
          </div>
          <div className="hod-form-row">
            <label className="hod-lbl">Priority</label>
            <select className="hod-sel" value={assignPriority} onChange={e => setAssignPriority(e.target.value)}>
              {["Low","Medium","High","Urgent"].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="hod-form-row">
            <label className="hod-lbl">Due Date</label>
            <input type="date" className="hod-inp" value={assignDueDate} onChange={e => setAssignDueDate(e.target.value)}/>
          </div>
        </div>

        {/* Patient multi-select */}
        <div className="hod-form-row">
          <label className="hod-lbl">
            Select Patients (up to 8) — {assignPatients.length}/8 selected
          </label>

          {assignPatients.length > 0 && (
            <div className="hod-selected-pills" style={{ marginBottom:8 }}>
              {assignPatients.map((uhid, idx) => (
                <span key={uhid} className="hod-sel-pill">
                  🧑‍⚕️ {assignPatientNames[idx]}
                  <span style={{ fontSize:9, opacity:.7 }}> · {uhid}</span>
                  <button onClick={() => {
                    setAssignPatients(prev => prev.filter(u => u !== uhid));
                    setAssignPatientIds(prev => prev.filter((_,i) => i !== idx));
                    setAssignPatientNames(prev => prev.filter((_,i) => i !== idx));
                  }}>✕</button>
                </span>
              ))}
              <button className="hod-btn hod-btn-ghost" style={{ padding:"2px 9px", fontSize:"10px" }}
                onClick={() => { setAssignPatients([]); setAssignPatientIds([]); setAssignPatientNames([]); }}>
                Clear All
              </button>
            </div>
          )}

          <input className="hod-inp" placeholder="Search patient by name or UHID…" value={patientSearch}
            onChange={e => setPatientSearch(e.target.value)} style={{ marginBottom:6 }}/>

          <div className="hod-pt-list">
            {filteredPatientSearch.length === 0 ? (
              <div style={{ padding:"14px", textAlign:"center", color:"var(--text-muted)", fontSize:12 }}>
                No patients found
              </div>
            ) : filteredPatientSearch.map(p => {
              const isSelected = assignPatients.includes(p.uhid);
              return (
                <div key={p.uhid} className={`hod-pt-item${isSelected ? " sel" : ""}`}
                  onClick={() => toggleAssignPatient(p)}>
                  <div>
                    <span style={{ fontWeight:600, color:"var(--text)" }}>{p.patientName || p.name}</span>
                    <span style={{ marginLeft:8, fontSize:10, fontFamily:"monospace", color:"var(--text-muted)" }}>{p.uhid}</span>
                    {isSelected && <span style={{ marginLeft:6, color:"#10b981", fontWeight:700 }}>✓</span>}
                  </div>
                  <div style={{ display:"flex", gap:5, alignItems:"center" }}>
                    <span style={{ fontSize:9, padding:"2px 6px", borderRadius:10, background:p.dod?"rgba(16,185,129,0.1)":"rgba(245,158,11,0.1)", color:p.dod?"#10b981":"#f59e0b" }}>
                      {p.dod ? "Discharged" : "Admitted"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="hod-form-row">
          <label className="hod-lbl">Notes / Instructions</label>
          <textarea className="hod-textarea" value={assignNotes} placeholder="Any instructions for the employee…"
            onChange={e => setAssignNotes(e.target.value)}/>
        </div>

        <div className="hod-modal-foot">
          <button className="hod-btn hod-btn-ghost" onClick={() => setShowAssignModal(false)}>Cancel</button>
          <button className="hod-btn hod-btn-primary" onClick={handleAssign}
            disabled={!assignEmployee || assignPatients.length === 0}>
            Assign {assignPatients.length > 0 ? `(${assignPatients.length} patient${assignPatients.length>1?"s":""})` : ""}
          </button>
        </div>
      </div>
    </div>
  );

  // HOD Own Work Modal
  const renderHodWorkModal = () => {
    if (!hodWorkPatient) return null;
    return (
      <div className="hod-overlay" onClick={() => setShowHodWorkModal(false)}>
        <div className="hod-modal hod-modal-xl" onClick={e => e.stopPropagation()} style={{ maxHeight:"92vh" }}>
          <button className="hod-modal-close" onClick={() => setShowHodWorkModal(false)}>✕</button>
          <div className="hod-modal-title">
            <FileText size={16}/> Working on: {hodWorkPatient.patientName || hodWorkPatient.name}
            <span style={{ fontFamily:"monospace", fontSize:11, color:"var(--text-muted)", marginLeft:6 }}>
              {hodWorkPatient.uhid}
            </span>
          </div>

          {/* Patient info strip */}
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:16, padding:"12px 16px", background:"var(--surface-2)", borderRadius:10, border:"1px solid var(--border)" }}>
            {[
              ["Ward",    hodWorkPatient.ward   || "—"],
              ["Doctor",  hodWorkPatient.doctor || "—"],
              ["Age",     hodWorkPatient.ageYY  || "—"],
              ["Gender",  hodWorkPatient.gender || "—"],
              ["DOA",     fmtDt(hodWorkPatient.doa)],
            ].map(([k,v]) => (
              <div key={k}>
                <div style={{ fontSize:9, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:".07em" }}>{k}</div>
                <div style={{ fontSize:12, fontWeight:700, color:"var(--text)" }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="hod-tabs" style={{ marginBottom:16 }}>
            {[
              { id:"discharge", lbl:"📋 Discharge" },
              { id:"medical",   lbl:"🩺 Admission Note" },
              { id:"billing",   lbl:"🧾 Final Bill" },
              { id:"notes",     lbl:"📝 Notes" },
            ].map(t => (
              <button key={t.id} className={`hod-tab${hodWorkForm.activeTab===t.id?" act":""}`}
                onClick={() => setHodWorkForm(p => ({ ...p, activeTab:t.id }))}>
                {t.lbl}
                {hodWorkForm.saved?.[t.id] && <span className="hod-tab-dot"/>}
              </button>
            ))}
          </div>

          {/* Discharge tab */}
          {(!hodWorkForm.activeTab || hodWorkForm.activeTab === "discharge") && (
            <div className="hod-form-grid">
              {[
                ["doa",         "DOA",             "datetime-local"],
                ["dod",         "DOD",             "datetime-local"],
                ["expectedDod", "Expected DOD",    "date"],
                ["ward",        "Ward",            "text"],
                ["bed",         "Bed No.",         "text"],
                ["doctor",      "Doctor",          "text"],
                ["diagnosis",   "Diagnosis",       "text"],
                ["condition",   "Condition",       "text"],
              ].map(([k,lbl,type]) => (
                <div key={k}>
                  <label className="hod-lbl">{lbl}</label>
                  <input type={type} className="hod-inp"
                    value={hodWorkForm.discharge?.[k] || ""}
                    onChange={e => setHodWorkForm(p => ({ ...p, discharge:{ ...p.discharge, [k]:e.target.value } }))}/>
                </div>
              ))}
              <div style={{ gridColumn:"1/-1" }}>
                <label className="hod-lbl">Instructions</label>
                <textarea className="hod-textarea"
                  value={hodWorkForm.discharge?.instructions || ""}
                  onChange={e => setHodWorkForm(p => ({ ...p, discharge:{ ...p.discharge, instructions:e.target.value } }))}/>
              </div>
            </div>
          )}

          {/* Medical / Admission tab */}
          {hodWorkForm.activeTab === "medical" && (
            <div className="hod-form-grid">
              {[
                ["presentComplaints",   "Present Complaints"],
                ["provisionalDiagnosis","Provisional Diagnosis"],
                ["treatmentAdvised",    "Treatment Advised"],
                ["currentMedications",  "Current Medications"],
                ["knownAllergies",      "Known Allergies"],
                ["treatingDoctor",      "Treating Doctor"],
              ].map(([k,lbl]) => (
                <div key={k}>
                  <label className="hod-lbl">{lbl}</label>
                  <input className="hod-inp"
                    value={hodWorkForm.medicalHistory?.[k] || ""}
                    onChange={e => setHodWorkForm(p => ({ ...p, medicalHistory:{ ...p.medicalHistory, [k]:e.target.value } }))}/>
                </div>
              ))}
            </div>
          )}

          {/* Billing tab */}
          {hodWorkForm.activeTab === "billing" && (
            <div className="hod-form-grid">
              {[
                ["panel",             "Panel / Insurance"],
                ["advance",           "Advance (₹)"],
                ["paidNow",           "Paid Now (₹)"],
                ["discount",          "Discount (₹)"],
                ["paymentMode",       "Payment Mode"],
                ["statusOnDischarge", "Status on Discharge"],
                ["guardianName",      "Guardian Name"],
                ["claimId",           "Claim ID"],
              ].map(([k,lbl]) => (
                <div key={k}>
                  <label className="hod-lbl">{lbl}</label>
                  <input className="hod-inp"
                    value={hodWorkForm.billing?.[k] || ""}
                    onChange={e => setHodWorkForm(p => ({ ...p, billing:{ ...p.billing, [k]:e.target.value } }))}/>
                </div>
              ))}
            </div>
          )}

          {/* Notes tab */}
          {hodWorkForm.activeTab === "notes" && (
            <div>
              <label className="hod-lbl">Clinical / Administrative Notes</label>
              <textarea className="hod-textarea" rows={8}
                value={hodWorkForm.notes || ""}
                onChange={e => setHodWorkForm(p => ({ ...p, notes:e.target.value }))}
                placeholder="Any clinical notes, HOD observations, instructions for the team…"/>
            </div>
          )}

          <div className="hod-modal-foot">
            <button className="hod-btn hod-btn-ghost" onClick={() => setShowHodWorkModal(false)}>Close</button>
            <button className="hod-btn hod-btn-ghost" onClick={saveHodWork}>💾 Save</button>
            <button className="hod-btn hod-btn-blue" onClick={() => {
              setShowHodWorkModal(false);
              openSubmitToAdmin({ id:hodWorkPatient.uhid, type:"own", name:hodWorkPatient.patientName || hodWorkPatient.name });
            }}>
              <Send size={13}/> Submit to Admin
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Review Modal  →  POST /api/hod/reviews/
  const renderReviewModal = () => (
    <div className="hod-overlay" onClick={() => setShowReviewModal(false)}>
      <div className="hod-modal" onClick={e => e.stopPropagation()}>
        <button className="hod-modal-close" onClick={() => setShowReviewModal(false)}>✕</button>
        <div className="hod-modal-title"><Star size={16}/> Submit Employee Review</div>

        <div className="hod-form-row">
          <label className="hod-lbl">Employee</label>
          <select className="hod-sel"
            value={reviewForm.employeeId || (reviewTarget?.employee?.id || reviewTarget?.task?.assigned_to || "")}
            onChange={e => setReviewForm(p => ({ ...p, employeeId:e.target.value }))}>
            <option value="">Select Employee</option>
            {employees.filter(e=>(e.department||e.dept)===activeDept).map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
          <div className="hod-form-row">
            <label className="hod-lbl">Period</label>
            <select className="hod-sel" value={reviewForm.period} onChange={e => setReviewForm(p => ({ ...p, period:e.target.value }))}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="hod-form-row">
            <label className="hod-lbl">Rating (1–5)</label>
            <select className="hod-sel" value={reviewForm.rating} onChange={e => setReviewForm(p => ({ ...p, rating:Number(e.target.value) }))}>
              {[1,2,3,4,5].map(r => <option key={r} value={r}>{"★".repeat(r)} ({r}/5)</option>)}
            </select>
          </div>
        </div>

        <div className="hod-form-row">
          <label className="hod-lbl">Performance Score</label>
          <input className="hod-inp" value={reviewForm.score} placeholder="e.g. 87/100"
            onChange={e => setReviewForm(p => ({ ...p, score:e.target.value }))}/>
        </div>

        <div className="hod-form-row">
          <label className="hod-lbl">Comments *</label>
          <textarea className="hod-textarea" value={reviewForm.comments}
            placeholder="Performance observations, areas of improvement, feedback…"
            onChange={e => setReviewForm(p => ({ ...p, comments:e.target.value }))}/>
        </div>

        <div style={{ background:"rgba(99,102,241,0.08)", border:"1px solid rgba(99,102,241,0.2)", borderRadius:8, padding:"10px 14px", marginBottom:14, fontSize:11, color:"#6366f1" }}>
          ℹ This review will be submitted to Admin Management and reflected in Super Admin performance analytics.
        </div>

        <div className="hod-modal-foot">
          <button className="hod-btn hod-btn-ghost" onClick={() => setShowReviewModal(false)}>Cancel</button>
          <button className="hod-btn hod-btn-primary" onClick={submitReview}
            disabled={!reviewForm.comments.trim()}>
            Submit Review
          </button>
        </div>
      </div>
    </div>
  );

  // Submit to Admin Modal  →  POST /api/tasks/<id>/update-status/ { status: "submitted" }
  const renderSubmitModal = () => (
    <div className="hod-overlay" onClick={() => setShowSubmitModal(false)}>
      <div className="hod-modal" onClick={e => e.stopPropagation()}>
        <button className="hod-modal-close" onClick={() => setShowSubmitModal(false)}>✕</button>
        <div style={{ textAlign:"center", marginBottom:16 }}>
          <div style={{ fontSize:40, marginBottom:10 }}>📤</div>
          <div style={{ fontSize:16, fontWeight:700, color:"var(--text)", marginBottom:6 }}>Submit to Admin Management</div>
          <div style={{ fontSize:12, color:"var(--text-muted)" }}>
            Submitting: <strong style={{ color:"var(--text)" }}>{submitTarget?.name}</strong>
          </div>
        </div>
        <div className="hod-form-row">
          <label className="hod-lbl">Handover Note (optional)</label>
          <textarea className="hod-textarea" value={submitNote}
            placeholder="Any notes for Admin Management / Super Admin…"
            onChange={e => setSubmitNote(e.target.value)}/>
        </div>
        <div style={{ background:"rgba(99,102,241,0.08)", border:"1px solid rgba(99,102,241,0.2)", borderRadius:8, padding:"10px 14px", marginBottom:14, fontSize:11, color:"#6366f1" }}>
          ✓ This will be visible to Admin Management and Super Admin for review & performance tracking.
        </div>
        <div className="hod-modal-foot">
          <button className="hod-btn hod-btn-ghost" onClick={() => setShowSubmitModal(false)}>Cancel</button>
          <button className="hod-btn hod-btn-primary" onClick={confirmSubmitToAdmin}>
            Confirm Submit →
          </button>
        </div>
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>
      <div className="hod-root">

        {renderSidebar()}

        <div className="hod-main">
          {renderHeader()}
          <div className="hod-content">
            {error && (
              <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", color:"#ef4444", padding:"10px 16px", borderRadius:8, fontSize:12, marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
                <AlertCircle size={14}/> {error}
                <button style={{ marginLeft:"auto", background:"none", border:"none", color:"#ef4444", cursor:"pointer", fontSize:11 }} onClick={() => setError(null)}>✕</button>
              </div>
            )}

            {activeView === "overview"   && renderOverview()}
            {activeView === "assign"     && renderAssign()}
            {activeView === "my-work"    && renderMyWork()}
            {activeView === "dept-tasks" && renderDeptTasks()}
            {activeView === "analytics"  && renderAnalytics()}
            {activeView === "reviews"    && renderReviews()}
            {activeView === "employees"  && renderEmployees()}
          </div>
        </div>

        {/* Modals */}
        {showAssignModal  && renderAssignModal()}
        {showHodWorkModal && renderHodWorkModal()}
        {showReviewModal  && renderReviewModal()}
        {showSubmitModal  && renderSubmitModal()}

        {/* Toasts */}
        <div className="hod-toasts">
          {toasts.map(t => (
            <div key={t.id} className={`hod-toast ${t.type}`}>
              {t.type === "s" ? "✓" : t.type === "e" ? "✗" : "⚠"} {t.msg}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}