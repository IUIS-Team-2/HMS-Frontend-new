import { useState, useEffect, useCallback } from "react";
import ThemeModeDock from "../components/ui/ThemeModeDock";
import {
  IndianRupee, Upload, CircleHelp, Hospital,
  ClipboardList, CheckSquare, BarChart3, Star, Users,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────
const DEPARTMENTS = ["Billing", "Uploading", "Query", "OPD", "Intimation", "Nursing", "Doctor"];

const INSURANCE_TYPES = [
  "TPA", "Ayushman Bharat", "ECHS", "ECI", "FCI", "Northern Railways", "Cash",
];

const DEPT_COLORS = {
  Billing:    "var(--success)",
  Uploading:  "var(--accent)",
  Query:      "var(--warning)",
  OPD:        "var(--danger)",
  Intimation: "var(--info)",
  Nursing:    "#a78bfa",
  Doctor:     "#f472b6",
};

const DEPT_ICONS = {
  Billing:    IndianRupee,
  Uploading:  Upload,
  Query:      CircleHelp,
  OPD:        Hospital,
  Intimation: ClipboardList,
  Nursing:    Users,
  Doctor:     Star,
};

const VIEW_ICONS = {
  tasks:     CheckSquare,
  analytics: BarChart3,
  reviews:   Star,
  employees: Users,
};

const STATUS_COLORS = {
  pending:       { bg: "var(--warning-soft)",  text: "var(--warning)",  border: "var(--warning-border)"  },
  "in-progress": { bg: "var(--info-soft)",     text: "var(--info)",     border: "var(--info-border)"     },
  completed:     { bg: "var(--success-soft)",  text: "var(--success)",  border: "var(--success-border)"  },
  overdue:       { bg: "var(--danger-soft)",   text: "var(--danger)",   border: "var(--danger-border)"   },
};

// ─── Real API fetch ───────────────────────────────────────────
const API_BASE = "http://localhost:8000/api";// adjust to your actual base URL if needed

async function realApiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `API error ${res.status}`);
  }
  return res.json();
}

// ─── Component ────────────────────────────────────────────────
export default function HodDashboard({ currentUser, onLogout }) {
  const renderIcon = (Icon, size = 15, sw = 2) =>
    Icon ? <Icon size={size} strokeWidth={sw} /> : null;

  const [activeDept,        setActiveDept]        = useState("Billing");
  const [activeView,        setActiveView]        = useState("tasks");
  const [employees,         setEmployees]         = useState([]);
  const [patients,          setPatients]          = useState([]);
  const [tasks,             setTasks]             = useState([]);
  const [analytics,         setAnalytics]         = useState(null);
  const [reviews,           setReviews]           = useState([]);
  const [loading,           setLoading]           = useState(false);
  const [error,             setError]             = useState(null);
  const [sidebarCollapsed,  setSidebarCollapsed]  = useState(false);
  const [filterEmployee,    setFilterEmployee]    = useState("");
  const [filterDate,        setFilterDate]        = useState("");
  const [filterRange,       setFilterRange]       = useState("daily");
  const [filterStatus,      setFilterStatus]      = useState("");
  const [showTaskForm,      setShowTaskForm]      = useState(false);
  const [taskForm,          setTaskForm]          = useState({
    employeeId: "", department: "Billing", taskType: "",
    patientUhid: "", patientType: "TPA", dueDate: "", notes: "",
  });
  const [showReviewForm,    setShowReviewForm]    = useState(false);
  const [reviewForm,        setReviewForm]        = useState({
    employeeId: "", period: "weekly", rating: 5, comments: "", performanceScore: "",
  });
  const [editingTask,        setEditingTask]       = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // ─── API wrapper ──────────────────────────────────────────────
  const apiFetch = useCallback(async (path, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      return await realApiFetch(path, options);
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Data fetchers ────────────────────────────────────────────
  const fetchEmployees = useCallback(async () => {
    const data = await apiFetch(`/employees?department=${activeDept}`);
    if (data) setEmployees(data.employees || []);
  }, [apiFetch, activeDept]);

  const fetchPatients = useCallback(async () => {
    const data = await apiFetch(`/patients`);
    if (data) setPatients(data.patients || []);
  }, [apiFetch]);

  const fetchTasks = useCallback(async () => {
    const params = new URLSearchParams({ department: activeDept });
    if (filterEmployee) params.append("employeeId", filterEmployee);
    if (filterDate)     params.append("date",       filterDate);
    if (filterStatus)   params.append("status",     filterStatus);
    const data = await apiFetch(`/tasks?${params}`);
    if (data) setTasks(data.tasks || []);
  }, [apiFetch, activeDept, filterEmployee, filterDate, filterStatus]);

  const fetchAnalytics = useCallback(async () => {
    const params = new URLSearchParams({ department: activeDept, range: filterRange });
    if (filterEmployee) params.append("employeeId", filterEmployee);
    if (filterDate)     params.append("date",       filterDate);
    const data = await apiFetch(`/analytics?${params}`);
    if (data) setAnalytics(data);
  }, [apiFetch, activeDept, filterRange, filterEmployee, filterDate]);

  const fetchReviews = useCallback(async () => {
    const data = await apiFetch(`/reviews?department=${activeDept}`);
    if (data) setReviews(data.reviews || []);
  }, [apiFetch, activeDept]);

  // ─── Effects ──────────────────────────────────────────────────
  useEffect(() => {
    fetchEmployees();
    fetchTasks();
    fetchPatients();
  }, [activeDept]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeView === "analytics") fetchAnalytics();
    if (activeView === "reviews")   fetchReviews();
    if (activeView === "employees") fetchEmployees();
  }, [activeView, filterRange, filterEmployee, filterDate]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Handlers ────────────────────────────────────────────────
  async function handleAssignTask(e) {
    e.preventDefault();
    if (!taskForm.patientUhid)    { setError("Please select a patient.");         return; }
    if (!taskForm.taskType.trim()) { setError("Please enter a task description."); return; }
    const data = await apiFetch("/tasks", {
      method: "POST",
      body: JSON.stringify({ ...taskForm, department: taskForm.department }),
    });
    if (data) {
      setShowTaskForm(false);
      setTaskForm({ employeeId: "", department: activeDept, taskType: "", patientUhid: "", patientType: "TPA", dueDate: "", notes: "" });
      fetchTasks();
    }
  }

  async function handleUpdateTask(taskId, updates) {
    const data = await apiFetch(`/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify(updates) });
    if (data) { setEditingTask(null); fetchTasks(); }
  }

  const handleMarkComplete = (id) => handleUpdateTask(id, { status: "completed" });

  async function handleSubmitReview(e) {
    e.preventDefault();
    const data = await apiFetch("/reviews", {
      method: "POST",
      body: JSON.stringify({ ...reviewForm, department: activeDept }),
    });
    if (data) {
      setShowReviewForm(false);
      setReviewForm({ employeeId: "", period: "weekly", rating: 5, comments: "", performanceScore: "" });
      fetchReviews();
    }
  }

  function openTaskForm() {
    setTaskForm(f => ({ ...f, department: activeDept, employeeId: "" }));
    setError(null);
    setShowTaskForm(true);
  }

  // ─── Derived counts ───────────────────────────────────────────
  const pendingCount = tasks.filter(t => t.status === "pending").length;
  const overdueCount = tasks.filter(t => t.status === "overdue").length;
  const doneCount    = tasks.filter(t => t.status === "completed").length;
  const c = DEPT_COLORS[activeDept] || "#38bdf8";

  // ─── Styles ──────────────────────────────────────────────────
  const s = {
    root: { display:"flex", height:"100vh", background:"var(--bg)", color:"var(--text)", fontFamily:"var(--ui-font-sans)", overflow:"hidden" },
    sidebar: { width: sidebarCollapsed?"64px":"240px", minWidth: sidebarCollapsed?"64px":"240px", background:"var(--surface)", borderRight:"1px solid #16202e", display:"flex", flexDirection:"column", transition:"all 0.25s cubic-bezier(.4,0,.2,1)", overflow:"hidden", position:"relative", zIndex:10 },
    sidebarHeader: { padding: sidebarCollapsed?"20px 0":"22px 18px 18px", borderBottom:"1px solid #16202e", display:"flex", alignItems:"center", justifyContent: sidebarCollapsed?"center":"space-between", gap:10, minHeight:72 },
    logo:    { display: sidebarCollapsed?"none":"block", fontSize:"9px", letterSpacing:"3px", color:c, textTransform:"uppercase", marginBottom:"3px" },
    logoSub: { display: sidebarCollapsed?"none":"block", fontSize:"15px", fontWeight:"700", color:"var(--text)", letterSpacing:"0.5px" },
    collapseBtn: { background:"var(--card)", border:"1px solid #1e2a3a", color:"var(--text-muted)", width:28, height:28, borderRadius:6, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, flexShrink:0 },
    sectionLabel: { fontSize:"8px", letterSpacing:"3px", color:"var(--text-dim)", textTransform:"uppercase", padding: sidebarCollapsed?"16px 0 6px":"16px 18px 6px", textAlign: sidebarCollapsed?"center":"left", whiteSpace:"nowrap", overflow:"hidden" },
    deptBtn: (active, dept) => ({ display:"flex", alignItems:"center", gap:"10px", padding: sidebarCollapsed?"12px 0":"10px 18px", justifyContent: sidebarCollapsed?"center":"flex-start", cursor:"pointer", background: active?`${DEPT_COLORS[dept]}15`:"transparent", borderLeft: active?`3px solid ${DEPT_COLORS[dept]}`:"3px solid transparent", color: active?DEPT_COLORS[dept]:"var(--text-muted)", fontSize:"12px", letterSpacing:"0.5px", transition:"all 0.15s", border:"none", width:"100%", textAlign:"left" }),
    deptIcon: (dept) => ({ width:"22px", height:"22px", borderRadius:"6px", background:`${DEPT_COLORS[dept]}20`, border:`1px solid ${DEPT_COLORS[dept]}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"11px", flexShrink:0, color:DEPT_COLORS[dept] }),
    navBtn: (active) => ({ display:"flex", alignItems:"center", gap:"10px", padding: sidebarCollapsed?"10px 0":"9px 18px", justifyContent: sidebarCollapsed?"center":"flex-start", cursor:"pointer", background: active?"var(--surface-2)":"transparent", color: active?"var(--text)":"var(--text-muted)", fontSize:"12px", border:"none", width:"100%", textAlign:"left", transition:"all 0.15s", borderLeft: active?"3px solid #38bdf820":"3px solid transparent" }),
    sidebarStats: { display: sidebarCollapsed?"none":"flex", gap:6, padding:"10px 18px", flexWrap:"wrap" },
    miniStat: (col) => ({ flex:1, minWidth:44, background:`${col}12`, border:`1px solid ${col}30`, borderRadius:6, padding:"6px 8px", textAlign:"center" }),
    miniStatVal: (col) => ({ fontSize:15, fontWeight:700, color:col, lineHeight:1 }),
    miniStatLabel: { fontSize:8, color:"var(--text-muted)", letterSpacing:"1px", marginTop:2, textTransform:"uppercase" },
    sidebarFooter: { marginTop:"auto", borderTop:"1px solid #16202e", padding: sidebarCollapsed?"12px 0":"14px 18px", display:"flex", flexDirection:"column", gap:8 },
    userCard: { display: sidebarCollapsed?"none":"flex", alignItems:"center", gap:10, marginBottom:4 },
    avatar: { width:32, height:32, borderRadius:8, background:`${c}25`, border:`1px solid ${c}50`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color:c, fontWeight:700, flexShrink:0 },
    userName: { fontSize:12, color:"var(--text)", fontWeight:600 },
    userRole: { fontSize:9, color:"var(--text-muted)", letterSpacing:"1px", textTransform:"uppercase" },
    logoutBtn: { display:"flex", alignItems:"center", justifyContent: sidebarCollapsed?"center":"flex-start", gap:8, padding: sidebarCollapsed?"8px 0":"9px 12px", background:"#1a0a0a", border:"1px solid #3d1515", borderRadius:8, color:"#ef4444", fontSize:11, cursor:"pointer", fontFamily:"inherit", letterSpacing:"0.5px", width:"100%" },
    main:    { flex:1, display:"flex", flexDirection:"column", overflow:"hidden", background:"var(--bg)" },
    topbar:  { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 24px", borderBottom:"1px solid #16202e", background:"var(--surface)" },
    topbarLeft: { display:"flex", flexDirection:"column" },
    breadcrumb: { fontSize:"9px", color:"var(--text-dim)", letterSpacing:"2px", textTransform:"uppercase", marginBottom:"3px" },
    pageTitle:  { fontSize:"17px", fontWeight:"700", color:"var(--text)", display:"flex", alignItems:"center", gap:8 },
    deptPill:   { display:"inline-block", padding:"2px 10px", borderRadius:20, fontSize:10, background:`${c}18`, border:`1px solid ${c}40`, color:c, marginLeft:4 },
    topbarRight:{ display:"flex", gap:"10px", alignItems:"center" },
    loadingPill:{ display:"flex", alignItems:"center", gap:6, background:"var(--card)", border:"1px solid #1e2a3a", borderRadius:20, padding:"4px 12px", fontSize:10, color:"#38bdf8", letterSpacing:"1px" },
    loadingDot: { width:6, height:6, borderRadius:"50%", background:"#38bdf8", animation:"pulse 1s infinite" },
    btn: (variant="default") => ({ padding:"8px 16px", borderRadius:"7px", fontSize:"11px", fontFamily:"inherit", cursor:"pointer", letterSpacing:"0.5px", border:"1px solid", transition:"all 0.15s", display:"flex", alignItems:"center", gap:6, ...(variant==="primary"?{background:c,borderColor:c,color:"#000",fontWeight:700}:variant==="ghost"?{background:"transparent",borderColor:"var(--border-strong)",color:"var(--text-muted)"}:variant==="danger"?{background:"#7f1d1d",borderColor:"#991b1b",color:"#fca5a5"}:variant==="success"?{background:"#064e3b",borderColor:"#065f46",color:"#34d399"}:{background:"var(--surface-2)",borderColor:"var(--border-strong)",color:"var(--text-muted)"}) }),
    content:    { flex:1, overflowY:"auto", padding:"22px 24px", scrollbarWidth:"thin", scrollbarColor:"#16202e transparent" },
    filterBar:  { display:"flex", gap:"10px", marginBottom:"20px", flexWrap:"wrap", alignItems:"center", background:"var(--surface)", border:"1px solid #16202e", borderRadius:10, padding:"12px 16px" },
    filterLabel:{ fontSize:9, color:"var(--text-dim)", letterSpacing:"2px", textTransform:"uppercase", marginRight:4 },
    select: { background:"var(--bg)", border:"1px solid #1e2a3a", color:"var(--text-mid)", padding:"7px 10px", borderRadius:"6px", fontSize:"11px", fontFamily:"inherit", cursor:"pointer", outline:"none" },
    input:  { background:"var(--bg)", border:"1px solid #1e2a3a", color:"var(--text)", padding:"7px 10px", borderRadius:"6px", fontSize:"11px", fontFamily:"inherit", outline:"none" },
    statsGrid: { display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:"14px", marginBottom:"20px" },
    statCard: (color="#38bdf8") => ({ background:"var(--surface)", border:"1px solid #16202e", borderTop:`3px solid ${color}`, borderRadius:"10px", padding:"16px 18px", position:"relative", overflow:"hidden" }),
    statGlow: (color) => ({ position:"absolute", top:0, right:0, width:80, height:80, borderRadius:"50%", background:`${color}08`, transform:"translate(30%, -30%)", pointerEvents:"none" }),
    statLabel:  { fontSize:"8px", letterSpacing:"2px", color:"var(--text-muted)", textTransform:"uppercase", marginBottom:"8px" },
    statValue:  (color="var(--text)") => ({ fontSize:"26px", fontWeight:"700", color, lineHeight:1 }),
    statSub:    { fontSize:"10px", color:"var(--text-muted)", marginTop:"5px" },
    sectionTitle:{ fontSize:"9px", letterSpacing:"3px", color:"var(--text-dim)", textTransform:"uppercase", marginBottom:"12px", display:"flex", alignItems:"center", gap:8 },
    sectionLine: { flex:1, height:1, background:"var(--border)" },
    tableWrap:  { background:"var(--surface)", border:"1px solid #16202e", borderRadius:"10px", overflow:"hidden", marginBottom:"24px" },
    table:  { width:"100%", borderCollapse:"collapse", fontSize:"12px" },
    th:     { padding:"10px 14px", textAlign:"left", fontSize:"8px", letterSpacing:"2px", color:"var(--text-dim)", textTransform:"uppercase", borderBottom:"1px solid #16202e", background:"var(--surface-2)" },
    td:     { padding:"11px 14px", borderBottom:"1px solid #0d1520", color:"var(--text-muted)", verticalAlign:"middle" },
    badge:  (status) => ({ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 10px", borderRadius:"20px", fontSize:"10px", letterSpacing:"0.5px", background:STATUS_COLORS[status]?.bg||"var(--border-strong)", color:STATUS_COLORS[status]?.text||"var(--text-mid)", border:`1px solid ${STATUS_COLORS[status]?.border||"var(--border-strong)"}` }),
    modal:  { position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(4px)" },
    modalBox: { background:"var(--surface)", border:"1px solid #1e2a3a", borderRadius:"14px", padding:"26px", width:"520px", maxHeight:"85vh", overflowY:"auto", boxShadow:"0 25px 60px rgba(0,0,0,0.6)" },
    modalTitle: { fontSize:"11px", letterSpacing:"3px", textTransform:"uppercase", color:c, marginBottom:"20px", display:"flex", alignItems:"center", gap:8, paddingBottom:14, borderBottom:"1px solid #16202e" },
    formRow:  { marginBottom:"14px" },
    label:    { display:"block", fontSize:"9px", letterSpacing:"1.5px", color:"var(--text-muted)", textTransform:"uppercase", marginBottom:"5px" },
    textarea: { background:"var(--bg)", border:"1px solid #1e2a3a", color:"var(--text)", padding:"8px 10px", borderRadius:"6px", fontSize:"12px", fontFamily:"inherit", width:"100%", resize:"vertical", minHeight:"70px", outline:"none" },
    formActions: { display:"flex", gap:"10px", justifyContent:"flex-end", marginTop:"18px", paddingTop:14, borderTop:"1px solid #16202e" },
    emptyRow:   { padding:"48px", textAlign:"center", color:"var(--border-strong)", fontSize:"11px", letterSpacing:"2px" },
    errorBar:   { background:"#1a0505", border:"1px solid #7f1d1d", color:"#f87171", padding:"10px 16px", borderRadius:"8px", fontSize:"12px", marginBottom:"16px", display:"flex", alignItems:"center", gap:8 },
    empCard:    { background:"var(--surface)", border:"1px solid #16202e", borderRadius:10, padding:"16px 18px", display:"flex", alignItems:"center", gap:14 },
    empAvatar: (i) => ({ width:40, height:40, borderRadius:10, background:[`${c}20`,"#818cf820","#f59e0b20","#f8717120"][i%4], border:[`1px solid ${c}40`,"1px solid #818cf840","1px solid #f59e0b40","1px solid #f8717140"][i%4], display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }),
  };

  function SectionHeader({ title }) {
    return <div style={s.sectionTitle}>{title}<div style={s.sectionLine} /></div>;
  }

  function EmployeeOptions({ dept }) {
    const list = employees; // uses live employees for the currently selected dept in the form
    // If form dept differs from activeDept we rely on the list already fetched;
    // for cross-dept assignment the parent should refetch on dept change (handled in form onChange).
    return (
      <>
        <option value="">Select Assignee</option>
        <option value="HOD"> Assign to HOD (Self)</option>
        {list.map(e => (
          <option key={e.id} value={e.id}>{e.name} ({e.employeeCode})</option>
        ))}
      </>
    );
  }

  // When dept changes inside the task form, reload the employee list for that dept
  async function handleTaskFormDeptChange(dept) {
    setTaskForm(f => ({ ...f, department: dept, employeeId: "" }));
    const data = await apiFetch(`/employees?department=${dept}`);
    if (data) setEmployees(data.employees || []);
  }

  // ─── Views ───────────────────────────────────────────────────
  function TasksView() {
    const filtered = tasks.filter(t => !filterStatus || t.status === filterStatus);
    return (
      <>
        <div style={s.filterBar}>
          <span style={s.filterLabel}>Filter:</span>
          <select style={s.select} value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)}>
            <option value="">All Employees</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.name} ({e.employeeCode})</option>
            ))}
          </select>
          <select style={s.select} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
          <input type="date" style={s.input} value={filterDate} onChange={e => setFilterDate(e.target.value)} />
          <button style={{ ...s.btn("ghost"), marginLeft:"auto" }} onClick={fetchTasks}>↻ Refresh</button>
          <button style={s.btn("primary")} onClick={openTaskForm}>+ Assign Task</button>
        </div>

        <div style={s.statsGrid}>
          {[
            { label:"Total",     key:"total",     color:c,         vc:c         },
            { label:"Pending",   key:"pending",   color:"#f59e0b", vc:"#f59e0b" },
            { label:"Completed", key:"completed", color:"#34d399", vc:"#34d399" },
            { label:"Overdue",   key:"overdue",   color:"#f87171", vc:"#f87171" },
          ].map(({ label, key, color, vc }) => {
            const count = key === "total" ? tasks.length : tasks.filter(t => t.status === key).length;
            return (
              <div key={key} style={s.statCard(color)}>
                <div style={s.statGlow(color)} />
                <div style={s.statLabel}>{label} Tasks</div>
                <div style={s.statValue(vc)}>{count}</div>
                <div style={s.statSub}>{activeDept} Dept</div>
              </div>
            );
          })}
        </div>

        <SectionHeader title={`Task List — ${activeDept}`} />
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                {["Task ID","Assignee","Department","Patient","Insurance","Task","Due Date","Status","Actions"].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} style={s.emptyRow}>NO TASKS FOUND — ASSIGN TASKS TO GET STARTED</td></tr>
              ) : filtered.map(task => (
                <tr key={task.id}>
                  <td style={{ ...s.td, color:"var(--border-strong)", fontSize:"10px" }}>#{task.id}</td>
                  <td style={{ ...s.td, color:"var(--text)", fontWeight:600 }}>{task.employeeName}</td>
                  <td style={s.td}>
                    <span style={{ background:`${DEPT_COLORS[task.department]}18`, color:DEPT_COLORS[task.department], padding:"2px 8px", borderRadius:4, fontSize:10 }}>{task.department}</span>
                  </td>
                  <td style={{ ...s.td, color:"var(--text)" }}>
                    <div style={{ fontSize:12 }}>{task.patientName}</div>
                    <div style={{ fontSize:10, color:"var(--text-dim)", fontFamily:"monospace" }}>{task.patientUhid}</div>
                  </td>
                  <td style={s.td}>
                    <span style={{ background:"#0a1f2a", color:"#38bdf8", padding:"2px 8px", borderRadius:4, fontSize:10 }}>{task.patientType}</span>
                  </td>
                  <td style={s.td}>{task.taskType}</td>
                  <td style={{ ...s.td, fontSize:"11px" }}>{task.dueDate || "—"}</td>
                  <td style={s.td}><span style={s.badge(task.status)}>{task.status}</span></td>
                  <td style={s.td}>
                    <div style={{ display:"flex", gap:6 }}>
                      {task.status !== "completed" && (
                        <button style={{ ...s.btn("success"), padding:"4px 10px", fontSize:"10px" }} onClick={() => handleMarkComplete(task.id)}>✓</button>
                      )}
                      <button style={{ ...s.btn("ghost"), padding:"4px 10px", fontSize:"10px" }} onClick={() => setEditingTask(task)}>Edit</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  function AnalyticsView() {
    return (
      <>
        <div style={s.filterBar}>
          <span style={s.filterLabel}>Range:</span>
          <select style={s.select} value={filterRange} onChange={e => setFilterRange(e.target.value)}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <select style={s.select} value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)}>
            <option value="">All Employees</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.name} ({e.employeeCode})</option>
            ))}
          </select>
          <input type="date" style={s.input} value={filterDate} onChange={e => setFilterDate(e.target.value)} />
        </div>
        {analytics ? (
          <>
            <div style={s.statsGrid}>
              {(analytics.stats || []).map((stat, i) => {
                const colors = [c, "#34d399", "#f59e0b", "#a78bfa"];
                const col = colors[i % 4];
                return (
                  <div key={i} style={s.statCard(col)}>
                    <div style={s.statGlow(col)} />
                    <div style={s.statLabel}>{stat.label}</div>
                    <div style={s.statValue(col)}>{stat.value}</div>
                    {stat.sub && <div style={s.statSub}>{stat.sub}</div>}
                  </div>
                );
              })}
            </div>
            <SectionHeader title="Employee Performance" />
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>{["Employee","Assigned","Completed","Pending","Overdue","Completion %"].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {(analytics.employeeStats || []).length === 0
                    ? <tr><td colSpan={6} style={s.emptyRow}>NO ANALYTICS DATA</td></tr>
                    : (analytics.employeeStats || []).map(emp => (
                        <tr key={emp.id}>
                          <td style={{ ...s.td, color:"var(--text)", fontWeight:600 }}>{emp.name}</td>
                          <td style={s.td}>{emp.assigned}</td>
                          <td style={{ ...s.td, color:"#34d399" }}>{emp.completed}</td>
                          <td style={{ ...s.td, color:"#f59e0b" }}>{emp.pending}</td>
                          <td style={{ ...s.td, color:"#f87171" }}>{emp.overdue}</td>
                          <td style={s.td}>
                            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                              <div style={{ flex:1, height:"5px", background:"var(--border)", borderRadius:"3px", overflow:"hidden" }}>
                                <div style={{ width:`${emp.completionPct || 0}%`, height:"100%", background: emp.completionPct >= 80 ? "#34d399" : emp.completionPct >= 50 ? "#f59e0b" : "#f87171", borderRadius:"3px" }} />
                              </div>
                              <span style={{ fontSize:"11px", minWidth:"36px", color:"var(--text)" }}>{emp.completionPct || 0}%</span>
                            </div>
                          </td>
                        </tr>
                      ))
                  }
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div style={{ ...s.emptyRow, padding:60 }}>LOADING ANALYTICS...</div>
        )}
      </>
    );
  }

  function ReviewsView() {
    return (
      <>
        <div style={s.filterBar}>
          <span style={s.filterLabel}>Reviews — {activeDept}</span>
          <button style={{ ...s.btn("primary"), marginLeft:"auto" }} onClick={() => setShowReviewForm(true)}>+ Submit Review</button>
        </div>
        <SectionHeader title={`Employee Reviews — ${activeDept}`} />
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead><tr>{["Employee","Period","Rating","Score","Comments","Submitted"].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
            <tbody>
              {reviews.length === 0
                ? <tr><td colSpan={6} style={s.emptyRow}>NO REVIEWS SUBMITTED YET</td></tr>
                : reviews.map(rev => (
                    <tr key={rev.id}>
                      <td style={{ ...s.td, color:"var(--text)", fontWeight:600 }}>{rev.employeeName}</td>
                      <td style={s.td}><span style={{ background:"#0a1f2a", color:"#38bdf8", padding:"2px 8px", borderRadius:4, fontSize:10 }}>{rev.period}</span></td>
                      <td style={{ ...s.td, color:"#f59e0b" }}>{"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}</td>
                      <td style={s.td}>{rev.performanceScore || "—"}</td>
                      <td style={{ ...s.td, maxWidth:"200px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{rev.comments}</td>
                      <td style={{ ...s.td, fontSize:"11px" }}>{rev.submittedAt || "—"}</td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </>
    );
  }

  function EmployeesView() {
    return (
      <>
        <div style={s.filterBar}>
          <span style={s.filterLabel}>Employees — {activeDept}</span>
          <button style={{ ...s.btn("ghost"), marginLeft:"auto" }} onClick={fetchEmployees}>↻ Refresh</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:14 }}>
          {employees.length === 0
            ? <div style={{ ...s.emptyRow, gridColumn:"1/-1" }}>NO EMPLOYEES FOUND</div>
            : employees.map((emp, i) => (
                <div key={emp.id} style={s.empCard}>
                  <div style={s.empAvatar(i)}>{emp.name?.[0] || "?"}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, color:"var(--text)", fontWeight:600 }}>{emp.name}</div>
                    <div style={{ fontSize:10, color:"var(--text-muted)", letterSpacing:"1px", marginTop:2 }}>{emp.role || "Staff"} · {emp.employeeCode}</div>
                    {emp.email && <div style={{ fontSize:10, color:"var(--text-dim)", marginTop:3 }}>{emp.email}</div>}
                  </div>
                  {emp.taskCount !== undefined && (
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:16, fontWeight:700, color:c }}>{emp.taskCount}</div>
                      <div style={{ fontSize:8, color:"var(--text-muted)", letterSpacing:"1px", textTransform:"uppercase" }}>Tasks</div>
                    </div>
                  )}
                </div>
              ))
          }
        </div>
      </>
    );
  }

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div style={s.root}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#16202e;border-radius:2px}`}</style>

      {/* Sidebar */}
      <aside style={s.sidebar}>
        <div style={s.sidebarHeader}>
          <div style={{ display: sidebarCollapsed ? "none" : "block" }}>
            <div style={s.logo}>MedCore HMS</div>
            <div style={s.logoSub}>HOD Panel</div>
          </div>
          {sidebarCollapsed && <div style={{ ...s.avatar, width:28, height:28, fontSize:12 }}>H</div>}
          <button style={s.collapseBtn} onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            {sidebarCollapsed ? "»" : "«"}
          </button>
        </div>

        {!sidebarCollapsed && (
          <div style={s.sidebarStats}>
            <div style={s.miniStat("#f59e0b")}><div style={s.miniStatVal("#f59e0b")}>{pendingCount}</div><div style={s.miniStatLabel}>Pend.</div></div>
            <div style={s.miniStat("#f87171")}><div style={s.miniStatVal("#f87171")}>{overdueCount}</div><div style={s.miniStatLabel}>Over.</div></div>
            <div style={s.miniStat("#34d399")}><div style={s.miniStatVal("#34d399")}>{doneCount}</div><div style={s.miniStatLabel}>Done</div></div>
          </div>
        )}

        <div style={s.sectionLabel}>Departments</div>
        {DEPARTMENTS.map(dept => (
          <button key={dept} style={s.deptBtn(activeDept === dept, dept)}
            onClick={() => { setActiveDept(dept); setActiveView("tasks"); setFilterEmployee(""); setFilterDate(""); setFilterStatus(""); }}>
            <div style={s.deptIcon(dept)}>{renderIcon(DEPT_ICONS[dept], 15, 2)}</div>
            {!sidebarCollapsed && <span style={{ flex:1 }}>{dept}</span>}
            {!sidebarCollapsed && activeDept === dept && tasks.length > 0 && (
              <span style={{ fontSize:10, background:`${DEPT_COLORS[dept]}25`, color:DEPT_COLORS[dept], borderRadius:10, padding:"1px 6px" }}>{tasks.length}</span>
            )}
          </button>
        ))}

        <div style={s.sectionLabel}>Views</div>
        {[{ id:"tasks", label:"Tasks" }, { id:"analytics", label:"Analytics" }, { id:"reviews", label:"Reviews" }, { id:"employees", label:"Employees" }].map(v => (
          <button key={v.id} style={s.navBtn(activeView === v.id)} onClick={() => setActiveView(v.id)}>
            <span style={{ opacity: activeView === v.id ? 1 : 0.5, flexShrink:0 }}>{renderIcon(VIEW_ICONS[v.id], 14, 2)}</span>
            {!sidebarCollapsed && v.label}
          </button>
        ))}

        <div style={s.sidebarFooter}>
          {currentUser && !sidebarCollapsed && (
            <div style={s.userCard}>
              <div style={s.avatar}>{currentUser.name?.[0] || "H"}</div>
              <div>
                <div style={s.userName}>{currentUser.name}</div>
                <div style={s.userRole}>HOD · {activeDept}</div>
              </div>
            </div>
          )}
          <button style={s.logoutBtn} onClick={() => setShowLogoutConfirm(true)}>
            <span>⎋</span>
            {!sidebarCollapsed && "Logout"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={s.main}>
        <div style={s.topbar}>
          <div style={s.topbarLeft}>
            <div style={s.breadcrumb}>HOD Dashboard / {activeDept} / {activeView}</div>
            <div style={s.pageTitle}>
              {activeDept} Department
              <span style={s.deptPill}>{activeView}</span>
            </div>
          </div>
          <div style={s.topbarRight}>
            {loading && <div style={s.loadingPill}><div style={s.loadingDot} />SYNCING</div>}
            <button style={s.btn("ghost")} onClick={() => { fetchTasks(); fetchEmployees(); }}>↻</button>
            <ThemeModeDock variant="inline" />
          </div>
        </div>

        <div style={s.content}>
          {error && <div style={s.errorBar}>⚠ {error}</div>}
          {activeView === "tasks"     && <TasksView />}
          {activeView === "analytics" && <AnalyticsView />}
          {activeView === "reviews"   && <ReviewsView />}
          {activeView === "employees" && <EmployeesView />}
        </div>
      </div>

      {/* ── Assign Task Modal ── */}
      {showTaskForm && (
        <div style={s.modal} onClick={() => setShowTaskForm(false)}>
          <div style={s.modalBox} onClick={e => e.stopPropagation()}>
            <div style={s.modalTitle}>⊕ Assign Task</div>
            <form onSubmit={handleAssignTask}>
              <div style={s.formRow}>
                <label style={s.label}>Department</label>
                <select style={{ ...s.select, width:"100%" }} value={taskForm.department}
                  onChange={e => handleTaskFormDeptChange(e.target.value)}>
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>

              <div style={s.formRow}>
                <label style={s.label}>Assign To</label>
                <select style={{ ...s.select, width:"100%" }} value={taskForm.employeeId}
                  onChange={e => setTaskForm({ ...taskForm, employeeId: e.target.value })} required>
                  <EmployeeOptions dept={taskForm.department} />
                </select>
              </div>

              <div style={s.formRow}>
                <label style={s.label}>Select Patient</label>
                <select style={{ ...s.select, width:"100%" }} value={taskForm.patientUhid}
                  onChange={e => setTaskForm({ ...taskForm, patientUhid: e.target.value })} required>
                  <option value="">— Select Patient —</option>
                  {patients.map(p => (
                    <option key={p.uhid} value={p.uhid}>{p.name} ({p.uhid})</option>
                  ))}
                </select>
              </div>

              <div style={s.formRow}>
                <label style={s.label}>Insurance / Scheme</label>
                <select style={{ ...s.select, width:"100%" }} value={taskForm.patientType}
                  onChange={e => setTaskForm({ ...taskForm, patientType: e.target.value })}>
                  {INSURANCE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div style={s.formRow}>
                <label style={s.label}>Task Description</label>
                <input style={{ ...s.input, width:"100%" }} value={taskForm.taskType}
                  onChange={e => setTaskForm({ ...taskForm, taskType: e.target.value })}
                  placeholder="e.g. Generate final bill, Upload lab reports..." required />
              </div>

              <div style={s.formRow}>
                <label style={s.label}>Due Date</label>
                <input type="date" style={{ ...s.input, width:"100%" }} value={taskForm.dueDate}
                  onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
              </div>

              <div style={s.formRow}>
                <label style={s.label}>Notes (optional)</label>
                <textarea style={s.textarea} value={taskForm.notes}
                  onChange={e => setTaskForm({ ...taskForm, notes: e.target.value })}
                  placeholder="Any additional instructions..." />
              </div>

              <div style={s.formActions}>
                <button type="button" style={s.btn("ghost")} onClick={() => setShowTaskForm(false)}>Cancel</button>
                <button type="submit" style={s.btn("primary")}>Assign Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Task Modal ── */}
      {editingTask && (
        <div style={s.modal} onClick={() => setEditingTask(null)}>
          <div style={s.modalBox} onClick={e => e.stopPropagation()}>
            <div style={s.modalTitle}>✎ Update Task #{editingTask.id}</div>
            <div style={s.formRow}>
              <label style={s.label}>Status</label>
              <select style={{ ...s.select, width:"100%" }} value={editingTask.status}
                onChange={e => setEditingTask({ ...editingTask, status: e.target.value })}>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div style={s.formRow}>
              <label style={s.label}>Notes</label>
              <textarea style={s.textarea} value={editingTask.notes || ""}
                onChange={e => setEditingTask({ ...editingTask, notes: e.target.value })} />
            </div>
            <div style={s.formActions}>
              <button style={s.btn("ghost")} onClick={() => setEditingTask(null)}>Cancel</button>
              <button style={s.btn("primary")} onClick={() => handleUpdateTask(editingTask.id, { status: editingTask.status, notes: editingTask.notes })}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Review Modal ── */}
      {showReviewForm && (
        <div style={s.modal} onClick={() => setShowReviewForm(false)}>
          <div style={s.modalBox} onClick={e => e.stopPropagation()}>
            <div style={s.modalTitle}>⭐ Submit Employee Review</div>
            <form onSubmit={handleSubmitReview}>
              <div style={s.formRow}>
                <label style={s.label}>Employee</label>
                <select style={{ ...s.select, width:"100%" }} value={reviewForm.employeeId}
                  onChange={e => setReviewForm({ ...reviewForm, employeeId: e.target.value })} required>
                  <option value="">Select Employee</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display:"flex", gap:"12px" }}>
                <div style={{ ...s.formRow, flex:1 }}>
                  <label style={s.label}>Period</label>
                  <select style={{ ...s.select, width:"100%" }} value={reviewForm.period}
                    onChange={e => setReviewForm({ ...reviewForm, period: e.target.value })}>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div style={{ ...s.formRow, flex:1 }}>
                  <label style={s.label}>Rating (1–5)</label>
                  <select style={{ ...s.select, width:"100%" }} value={reviewForm.rating}
                    onChange={e => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}>
                    {[1,2,3,4,5].map(r => <option key={r} value={r}>{"★".repeat(r)} ({r})</option>)}
                  </select>
                </div>
              </div>
              <div style={s.formRow}>
                <label style={s.label}>Performance Score</label>
                <input style={{ ...s.input, width:"100%" }} value={reviewForm.performanceScore}
                  onChange={e => setReviewForm({ ...reviewForm, performanceScore: e.target.value })} placeholder="e.g. 87/100" />
              </div>
              <div style={s.formRow}>
                <label style={s.label}>Comments</label>
                <textarea style={s.textarea} value={reviewForm.comments}
                  onChange={e => setReviewForm({ ...reviewForm, comments: e.target.value })}
                  placeholder="Performance observations, feedback..." required />
              </div>
              <div style={s.formActions}>
                <button type="button" style={s.btn("ghost")} onClick={() => setShowReviewForm(false)}>Cancel</button>
                <button type="submit" style={s.btn("primary")}>Submit Review</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Logout Modal ── */}
      {showLogoutConfirm && (
        <div style={s.modal} onClick={() => setShowLogoutConfirm(false)}>
          <div style={{ ...s.modalBox, width:360, textAlign:"center" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:32, marginBottom:12 }}>⎋</div>
            <div style={{ fontSize:14, fontWeight:700, color:"var(--text)", marginBottom:8 }}>Confirm Logout</div>
            <div style={{ fontSize:12, color:"var(--text-muted)", marginBottom:20 }}>
              You'll be signed out of the HOD Panel. Any unsaved changes will be lost.
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
              <button style={s.btn("ghost")} onClick={() => setShowLogoutConfirm(false)}>Stay</button>
              <button style={s.btn("danger")} onClick={() => { setShowLogoutConfirm(false); onLogout?.(); }}>Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}