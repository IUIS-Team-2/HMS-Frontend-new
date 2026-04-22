import { useState, useEffect } from "react";

const DEPARTMENTS = ["Billing", "Uploading", "Query", "OPD", "Intimation"];

const BILLING_TASK_TYPES = [
  "Generate Bill",
  "Discharge Summary",
  "Reports",
  "Medical History",
  "Medicines",
];

const STATUS_COLORS = {
  pending:     { bg: "#2a1f0a", text: "#f59e0b", border: "#92400e" },
  "in-progress": { bg: "#0a1f2a", text: "#38bdf8", border: "#0369a1" },
  completed:   { bg: "#0a2a1a", text: "#34d399", border: "#065f46" },
  overdue:     { bg: "#2a0a0a", text: "#f87171", border: "#991b1b" },
};

const PRIORITY_COLORS = {
  low:    "#6b7280",
  medium: "#f59e0b",
  high:   "#f87171",
};

const DEPT_COLORS = {
  Billing:    "#34d399",
  Uploading:  "#818cf8",
  Query:      "#f59e0b",
  OPD:        "#f87171",
  Intimation: "#38bdf8",
};

const DEPT_ICONS = {
  Billing:    "₹",
  Uploading:  "↑",
  Query:      "?",
  OPD:        "🏥",
  Intimation: "📋",
};

const VIEW_ICONS = {
  tasks:     "☑",
  analytics: "📊",
  reviews:   "⭐",
  employees: "👥",
};

export default function HodDashboard({ currentUser, onLogout }) {
  const [activeDept, setActiveDept] = useState("Billing");
  const [activeView, setActiveView] = useState("tasks");
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Filters
  const [filterEmployee, setFilterEmployee] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterRange, setFilterRange] = useState("daily");
  const [filterStatus, setFilterStatus] = useState("");

  // Task form
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({
    employeeId: "",
    department: activeDept,
    taskType: "",
    patientId: "",
    patientType: "TPA",
    priority: "medium",
    dueDate: "",
    notes: "",
  });

  // Review form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    employeeId: "",
    period: "weekly",
    rating: 5,
    comments: "",
    performanceScore: "",
  });

  // Edit task
  const [editingTask, setEditingTask] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const API = "/api/hod";

  function normalizeApiPath(path) {
    const [pathname, search = ""] = String(path || "/").split("?");
    const normalizedPath = pathname.endsWith("/") ? pathname : `${pathname}/`;
    return search ? `${normalizedPath}?${search}` : normalizedPath;
  }

  async function apiFetch(path, options = {}) {
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem("hms_token");
      const res = await fetch(`${API}${normalizeApiPath(path)}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...options,
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return await res.json();
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEmployees();
    fetchTasks();
  }, [activeDept]);

  useEffect(() => {
    if (activeView === "analytics") fetchAnalytics();
    if (activeView === "reviews") fetchReviews();
    if (activeView === "employees") fetchEmployees();
  }, [activeView, filterRange, filterEmployee, filterDate]);

  async function fetchEmployees() {
    const data = await apiFetch(`/employees?department=${activeDept}`);
    if (data) setEmployees(data.employees || []);
  }

  async function fetchTasks() {
    const params = new URLSearchParams({ department: activeDept });
    if (filterEmployee) params.append("employeeId", filterEmployee);
    if (filterDate) params.append("date", filterDate);
    if (filterStatus) params.append("status", filterStatus);
    const data = await apiFetch(`/tasks?${params}`);
    if (data) setTasks(data.tasks || []);
  }

  async function fetchAnalytics() {
    const params = new URLSearchParams({ department: activeDept, range: filterRange });
    if (filterEmployee) params.append("employeeId", filterEmployee);
    if (filterDate) params.append("date", filterDate);
    const data = await apiFetch(`/analytics?${params}`);
    if (data) setAnalytics(data);
  }

  async function fetchReviews() {
    const data = await apiFetch(`/reviews?department=${activeDept}`);
    if (data) setReviews(data.reviews || []);
  }

  async function handleAssignTask(e) {
    e.preventDefault();
    const data = await apiFetch("/tasks", {
      method: "POST",
      body: JSON.stringify({ ...taskForm, department: activeDept }),
    });
    if (data) {
      setShowTaskForm(false);
      setTaskForm({ employeeId: "", department: activeDept, taskType: "", patientId: "", patientType: "TPA", priority: "medium", dueDate: "", notes: "" });
      fetchTasks();
    }
  }

  async function handleUpdateTask(taskId, updates) {
    const data = await apiFetch(`/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    if (data) { setEditingTask(null); fetchTasks(); }
  }

  async function handleMarkComplete(taskId) {
    await handleUpdateTask(taskId, { status: "completed" });
  }

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

  async function handleDownloadReport() {
    const params = new URLSearchParams({ department: activeDept, range: filterRange });
    if (filterEmployee) params.append("employeeId", filterEmployee);
    if (filterDate) params.append("date", filterDate);
    window.open(`${API}${normalizeApiPath(`/reports/download?${params}`)}`, "_blank");
  }

  // ─── Quick stats for sidebar ─────────────────────────────────────────────────
  const pendingCount  = tasks.filter(t => t.status === "pending").length;
  const overdueCount  = tasks.filter(t => t.status === "overdue").length;
  const doneCount     = tasks.filter(t => t.status === "completed").length;

  // ─── Styles ──────────────────────────────────────────────────────────────────
  const c = DEPT_COLORS[activeDept] || "#38bdf8";

  const s = {
    root: {
      display: "flex",
      height: "100vh",
      background: "#060a10",
      color: "#e2e8f0",
      fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
      overflow: "hidden",
    },
    sidebar: {
      width: sidebarCollapsed ? "64px" : "240px",
      minWidth: sidebarCollapsed ? "64px" : "240px",
      background: "#0b1018",
      borderRight: "1px solid #16202e",
      display: "flex",
      flexDirection: "column",
      transition: "all 0.25s cubic-bezier(.4,0,.2,1)",
      overflow: "hidden",
      position: "relative",
      zIndex: 10,
    },
    sidebarHeader: {
      padding: sidebarCollapsed ? "20px 0" : "22px 18px 18px",
      borderBottom: "1px solid #16202e",
      display: "flex",
      alignItems: "center",
      justifyContent: sidebarCollapsed ? "center" : "space-between",
      gap: 10,
      minHeight: 72,
    },
    logo: {
      display: sidebarCollapsed ? "none" : "block",
      fontSize: "9px",
      letterSpacing: "3px",
      color: c,
      textTransform: "uppercase",
      marginBottom: "3px",
      transition: "all 0.2s",
    },
    logoSub: {
      display: sidebarCollapsed ? "none" : "block",
      fontSize: "15px",
      fontWeight: "700",
      color: "#f1f5f9",
      letterSpacing: "0.5px",
    },
    collapseBtn: {
      background: "#131c27",
      border: "1px solid #1e2a3a",
      color: "#475569",
      width: 28,
      height: 28,
      borderRadius: 6,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 12,
      flexShrink: 0,
      transition: "all 0.15s",
    },
    sectionLabel: {
      fontSize: "8px",
      letterSpacing: "3px",
      color: "#2d3d52",
      textTransform: "uppercase",
      padding: sidebarCollapsed ? "16px 0 6px" : "16px 18px 6px",
      textAlign: sidebarCollapsed ? "center" : "left",
      whiteSpace: "nowrap",
      overflow: "hidden",
    },
    deptBtn: (active, dept) => ({
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: sidebarCollapsed ? "12px 0" : "10px 18px",
      justifyContent: sidebarCollapsed ? "center" : "flex-start",
      cursor: "pointer",
      background: active ? `${DEPT_COLORS[dept]}15` : "transparent",
      borderLeft: active ? `3px solid ${DEPT_COLORS[dept]}` : "3px solid transparent",
      color: active ? DEPT_COLORS[dept] : "#4a5568",
      fontSize: "12px",
      letterSpacing: "0.5px",
      transition: "all 0.15s",
      border: "none",
      width: "100%",
      textAlign: "left",
      position: "relative",
    }),
    deptIcon: (dept) => ({
      width: "22px",
      height: "22px",
      borderRadius: "6px",
      background: `${DEPT_COLORS[dept]}20`,
      border: `1px solid ${DEPT_COLORS[dept]}40`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "11px",
      flexShrink: 0,
      color: DEPT_COLORS[dept],
    }),
    navBtn: (active) => ({
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: sidebarCollapsed ? "10px 0" : "9px 18px",
      justifyContent: sidebarCollapsed ? "center" : "flex-start",
      cursor: "pointer",
      background: active ? "#101824" : "transparent",
      color: active ? "#e2e8f0" : "#374151",
      fontSize: "12px",
      border: "none",
      width: "100%",
      textAlign: "left",
      transition: "all 0.15s",
      borderLeft: active ? "3px solid #38bdf820" : "3px solid transparent",
    }),
    navIcon: (active) => ({
      fontSize: "14px",
      opacity: active ? 1 : 0.5,
      flexShrink: 0,
    }),
    sidebarStats: {
      display: sidebarCollapsed ? "none" : "flex",
      gap: 6,
      padding: "10px 18px",
      flexWrap: "wrap",
    },
    miniStat: (col) => ({
      flex: 1,
      minWidth: 44,
      background: `${col}12`,
      border: `1px solid ${col}30`,
      borderRadius: 6,
      padding: "6px 8px",
      textAlign: "center",
    }),
    miniStatVal: (col) => ({
      fontSize: 15,
      fontWeight: 700,
      color: col,
      lineHeight: 1,
    }),
    miniStatLabel: {
      fontSize: 8,
      color: "#374151",
      letterSpacing: "1px",
      marginTop: 2,
      textTransform: "uppercase",
    },
    sidebarFooter: {
      marginTop: "auto",
      borderTop: "1px solid #16202e",
      padding: sidebarCollapsed ? "12px 0" : "14px 18px",
      display: "flex",
      flexDirection: "column",
      gap: 8,
    },
    userCard: {
      display: sidebarCollapsed ? "none" : "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 4,
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 8,
      background: `${c}25`,
      border: `1px solid ${c}50`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 13,
      color: c,
      fontWeight: 700,
      flexShrink: 0,
    },
    userName: {
      fontSize: 12,
      color: "#e2e8f0",
      fontWeight: 600,
    },
    userRole: {
      fontSize: 9,
      color: "#374151",
      letterSpacing: "1px",
      textTransform: "uppercase",
    },
    logoutBtn: {
      display: "flex",
      alignItems: "center",
      justifyContent: sidebarCollapsed ? "center" : "flex-start",
      gap: 8,
      padding: sidebarCollapsed ? "8px 0" : "9px 12px",
      background: "#1a0a0a",
      border: "1px solid #3d1515",
      borderRadius: 8,
      color: "#ef4444",
      fontSize: 11,
      cursor: "pointer",
      fontFamily: "inherit",
      letterSpacing: "0.5px",
      transition: "all 0.15s",
      width: "100%",
    },
    main: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      background: "#060a10",
    },
    topbar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "14px 24px",
      borderBottom: "1px solid #16202e",
      background: "#0b1018",
    },
    topbarLeft: { display: "flex", flexDirection: "column" },
    breadcrumb: {
      fontSize: "9px",
      color: "#2d3d52",
      letterSpacing: "2px",
      textTransform: "uppercase",
      marginBottom: "3px",
    },
    pageTitle: {
      fontSize: "17px",
      fontWeight: "700",
      color: "#f1f5f9",
      display: "flex",
      alignItems: "center",
      gap: 8,
    },
    deptPill: {
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: 20,
      fontSize: 10,
      background: `${c}18`,
      border: `1px solid ${c}40`,
      color: c,
      marginLeft: 4,
    },
    topbarRight: { display: "flex", gap: "10px", alignItems: "center" },
    loadingPill: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      background: "#0f1f35",
      border: "1px solid #1e2a3a",
      borderRadius: 20,
      padding: "4px 12px",
      fontSize: 10,
      color: "#38bdf8",
      letterSpacing: "1px",
    },
    loadingDot: {
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: "#38bdf8",
      animation: "pulse 1s infinite",
    },
    btn: (variant = "default") => ({
      padding: "8px 16px",
      borderRadius: "7px",
      fontSize: "11px",
      fontFamily: "inherit",
      cursor: "pointer",
      letterSpacing: "0.5px",
      border: "1px solid",
      transition: "all 0.15s",
      display: "flex",
      alignItems: "center",
      gap: 6,
      ...(variant === "primary"
        ? { background: c, borderColor: c, color: "#000", fontWeight: 700 }
        : variant === "ghost"
        ? { background: "transparent", borderColor: "#1e2a3a", color: "#64748b" }
        : variant === "danger"
        ? { background: "#7f1d1d", borderColor: "#991b1b", color: "#fca5a5" }
        : variant === "success"
        ? { background: "#064e3b", borderColor: "#065f46", color: "#34d399" }
        : { background: "#0f172a", borderColor: "#1e2a3a", color: "#64748b" }),
    }),
    content: {
      flex: 1,
      overflowY: "auto",
      padding: "22px 24px",
      scrollbarWidth: "thin",
      scrollbarColor: "#16202e transparent",
    },
    filterBar: {
      display: "flex",
      gap: "10px",
      marginBottom: "20px",
      flexWrap: "wrap",
      alignItems: "center",
      background: "#0b1018",
      border: "1px solid #16202e",
      borderRadius: 10,
      padding: "12px 16px",
    },
    filterLabel: {
      fontSize: 9,
      color: "#2d3d52",
      letterSpacing: "2px",
      textTransform: "uppercase",
      marginRight: 4,
    },
    select: {
      background: "#060a10",
      border: "1px solid #1e2a3a",
      color: "#94a3b8",
      padding: "7px 10px",
      borderRadius: "6px",
      fontSize: "11px",
      fontFamily: "inherit",
      cursor: "pointer",
      outline: "none",
    },
    input: {
      background: "#060a10",
      border: "1px solid #1e2a3a",
      color: "#e2e8f0",
      padding: "7px 10px",
      borderRadius: "6px",
      fontSize: "11px",
      fontFamily: "inherit",
      outline: "none",
    },
    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "14px",
      marginBottom: "20px",
    },
    statCard: (color = "#38bdf8") => ({
      background: "#0b1018",
      border: "1px solid #16202e",
      borderTop: `3px solid ${color}`,
      borderRadius: "10px",
      padding: "16px 18px",
      position: "relative",
      overflow: "hidden",
    }),
    statGlow: (color) => ({
      position: "absolute",
      top: 0,
      right: 0,
      width: 80,
      height: 80,
      borderRadius: "50%",
      background: `${color}08`,
      transform: "translate(30%, -30%)",
      pointerEvents: "none",
    }),
    statLabel: {
      fontSize: "8px",
      letterSpacing: "2px",
      color: "#374151",
      textTransform: "uppercase",
      marginBottom: "8px",
    },
    statValue: (color = "#f1f5f9") => ({
      fontSize: "26px",
      fontWeight: "700",
      color,
      lineHeight: 1,
    }),
    statSub: {
      fontSize: "10px",
      color: "#374151",
      marginTop: "5px",
    },
    sectionTitle: {
      fontSize: "9px",
      letterSpacing: "3px",
      color: "#2d3d52",
      textTransform: "uppercase",
      marginBottom: "12px",
      display: "flex",
      alignItems: "center",
      gap: 8,
    },
    sectionLine: {
      flex: 1,
      height: 1,
      background: "#16202e",
    },
    tableWrap: {
      background: "#0b1018",
      border: "1px solid #16202e",
      borderRadius: "10px",
      overflow: "hidden",
      marginBottom: "24px",
    },
    table: { width: "100%", borderCollapse: "collapse", fontSize: "12px" },
    th: {
      padding: "10px 14px",
      textAlign: "left",
      fontSize: "8px",
      letterSpacing: "2px",
      color: "#2d3d52",
      textTransform: "uppercase",
      borderBottom: "1px solid #16202e",
      background: "#080f18",
    },
    td: {
      padding: "11px 14px",
      borderBottom: "1px solid #0d1520",
      color: "#64748b",
      verticalAlign: "middle",
    },
    badge: (status) => ({
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      padding: "3px 10px",
      borderRadius: "20px",
      fontSize: "10px",
      letterSpacing: "0.5px",
      background: STATUS_COLORS[status]?.bg || "#1e2a3a",
      color: STATUS_COLORS[status]?.text || "#94a3b8",
      border: `1px solid ${STATUS_COLORS[status]?.border || "#1e2a3a"}`,
    }),
    priorityDot: (p) => ({
      display: "inline-block",
      width: "7px",
      height: "7px",
      borderRadius: "50%",
      background: PRIORITY_COLORS[p] || "#6b7280",
      marginRight: "6px",
    }),
    modal: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.75)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      backdropFilter: "blur(4px)",
    },
    modalBox: {
      background: "#0b1018",
      border: "1px solid #1e2a3a",
      borderRadius: "14px",
      padding: "26px",
      width: "500px",
      maxHeight: "82vh",
      overflowY: "auto",
      boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
    },
    modalTitle: {
      fontSize: "11px",
      letterSpacing: "3px",
      textTransform: "uppercase",
      color: c,
      marginBottom: "20px",
      display: "flex",
      alignItems: "center",
      gap: 8,
      paddingBottom: 14,
      borderBottom: "1px solid #16202e",
    },
    formRow: { marginBottom: "14px" },
    label: {
      display: "block",
      fontSize: "9px",
      letterSpacing: "1.5px",
      color: "#374151",
      textTransform: "uppercase",
      marginBottom: "5px",
    },
    textarea: {
      background: "#060a10",
      border: "1px solid #1e2a3a",
      color: "#e2e8f0",
      padding: "8px 10px",
      borderRadius: "6px",
      fontSize: "12px",
      fontFamily: "inherit",
      width: "100%",
      resize: "vertical",
      minHeight: "70px",
      outline: "none",
    },
    formActions: {
      display: "flex",
      gap: "10px",
      justifyContent: "flex-end",
      marginTop: "18px",
      paddingTop: 14,
      borderTop: "1px solid #16202e",
    },
    emptyRow: {
      padding: "48px",
      textAlign: "center",
      color: "#1e2a3a",
      fontSize: "11px",
      letterSpacing: "2px",
    },
    errorBar: {
      background: "#1a0505",
      border: "1px solid #7f1d1d",
      color: "#f87171",
      padding: "10px 16px",
      borderRadius: "8px",
      fontSize: "12px",
      marginBottom: "16px",
      display: "flex",
      alignItems: "center",
      gap: 8,
    },
    empCard: {
      background: "#0b1018",
      border: "1px solid #16202e",
      borderRadius: 10,
      padding: "16px 18px",
      display: "flex",
      alignItems: "center",
      gap: 14,
    },
    empAvatar: (i) => ({
      width: 40,
      height: 40,
      borderRadius: 10,
      background: [`${c}20`, "#818cf820", "#f59e0b20", "#f8717120"][i % 4],
      border: [`1px solid ${c}40`, "1px solid #818cf840", "1px solid #f59e0b40", "1px solid #f8717140"][i % 4],
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 16,
      flexShrink: 0,
    }),
  };

  // ─── Sub-components ───────────────────────────────────────────────────────────

  function SectionHeader({ title }) {
    return (
      <div style={s.sectionTitle}>
        {title}
        <div style={s.sectionLine} />
      </div>
    );
  }

  function TasksView() {
    const filtered = tasks.filter(t => !filterStatus || t.status === filterStatus);
    return (
      <>
        <div style={s.filterBar}>
          <span style={s.filterLabel}>Filter:</span>
          <select style={s.select} value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)}>
            <option value="">All Employees</option>
            {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
          </select>
          <select style={s.select} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
          <input type="date" style={s.input} value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
          <button style={{ ...s.btn("ghost"), marginLeft: "auto" }} onClick={fetchTasks}>↻ Refresh</button>
          <button style={s.btn("primary")} onClick={() => setShowTaskForm(true)}>+ Assign Task</button>
        </div>

        <div style={s.statsGrid}>
          {[
            { label: "Total", key: "total", color: c, valueColor: c },
            { label: "Pending", key: "pending", color: "#f59e0b", valueColor: "#f59e0b" },
            { label: "Completed", key: "completed", color: "#34d399", valueColor: "#34d399" },
            { label: "Overdue", key: "overdue", color: "#f87171", valueColor: "#f87171" },
          ].map(({ label, key, color, valueColor }) => {
            const count = key === "total" ? tasks.length : tasks.filter(t => t.status === key).length;
            return (
              <div key={key} style={s.statCard(color)}>
                <div style={s.statGlow(color)} />
                <div style={s.statLabel}>{label} Tasks</div>
                <div style={s.statValue(valueColor)}>{count}</div>
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
                {["Task ID", "Employee", "Task Type", "Patient", "Type", "Priority", "Due Date", "Status", "Actions"].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} style={s.emptyRow}>NO TASKS FOUND — ASSIGN TASKS TO GET STARTED</td></tr>
              ) : (
                filtered.map((task) => (
                  <tr key={task.id} style={{ transition: "background 0.1s" }}>
                    <td style={{ ...s.td, color: "#1e2a3a", fontSize: "10px" }}>#{task.id}</td>
                    <td style={{ ...s.td, color: "#e2e8f0", fontWeight: 600 }}>{task.employeeName || task.employeeId}</td>
                    <td style={s.td}>{task.taskType}</td>
                    <td style={{ ...s.td, color: "#e2e8f0" }}>{task.patientId || "—"}</td>
                    <td style={s.td}>
                      {task.patientType && (
                        <span style={{ background: task.patientType === "TPA" ? "#0a1f2a" : "#1a0a2a", color: task.patientType === "TPA" ? "#38bdf8" : "#a78bfa", padding: "2px 8px", borderRadius: "4px", fontSize: "10px" }}>
                          {task.patientType}
                        </span>
                      )}
                    </td>
                    <td style={s.td}>
                      <span style={s.priorityDot(task.priority)} />
                      {task.priority}
                    </td>
                    <td style={{ ...s.td, fontSize: "11px" }}>{task.dueDate || "—"}</td>
                    <td style={s.td}><span style={s.badge(task.status)}>{task.status}</span></td>
                    <td style={s.td}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        {task.status !== "completed" && (
                          <button style={{ ...s.btn("success"), padding: "4px 10px", fontSize: "10px" }} onClick={() => handleMarkComplete(task.id)}>✓</button>
                        )}
                        <button style={{ ...s.btn("ghost"), padding: "4px 10px", fontSize: "10px" }} onClick={() => setEditingTask(task)}>Edit</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
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
          <select style={s.select} value={filterRange} onChange={(e) => setFilterRange(e.target.value)}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <select style={s.select} value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)}>
            <option value="">All Employees</option>
            {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
          </select>
          <input type="date" style={s.input} value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
          <button style={{ ...s.btn("ghost"), marginLeft: "auto" }} onClick={handleDownloadReport}>↓ Download Report</button>
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
                  <tr>
                    {["Employee", "Assigned", "Completed", "Pending", "Overdue", "Completion %"].map(h => <th key={h} style={s.th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {(analytics.employeeStats || []).length === 0 ? (
                    <tr><td colSpan={6} style={s.emptyRow}>NO ANALYTICS DATA AVAILABLE</td></tr>
                  ) : (
                    (analytics.employeeStats || []).map((emp) => (
                      <tr key={emp.id}>
                        <td style={{ ...s.td, color: "#e2e8f0", fontWeight: 600 }}>{emp.name}</td>
                        <td style={s.td}>{emp.assigned}</td>
                        <td style={{ ...s.td, color: "#34d399" }}>{emp.completed}</td>
                        <td style={{ ...s.td, color: "#f59e0b" }}>{emp.pending}</td>
                        <td style={{ ...s.td, color: "#f87171" }}>{emp.overdue}</td>
                        <td style={s.td}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ flex: 1, height: "5px", background: "#16202e", borderRadius: "3px", overflow: "hidden" }}>
                              <div style={{ width: `${emp.completionPct || 0}%`, height: "100%", background: emp.completionPct >= 80 ? "#34d399" : emp.completionPct >= 50 ? "#f59e0b" : "#f87171", borderRadius: "3px" }} />
                            </div>
                            <span style={{ fontSize: "11px", minWidth: "36px", color: "#e2e8f0" }}>{emp.completionPct || 0}%</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div style={{ ...s.emptyRow, padding: 60, color: "#1e2a3a" }}>LOADING ANALYTICS...</div>
        )}
      </>
    );
  }

  function ReviewsView() {
    return (
      <>
        <div style={s.filterBar}>
          <span style={s.filterLabel}>Reviews</span>
          <button style={{ ...s.btn("primary"), marginLeft: "auto" }} onClick={() => setShowReviewForm(true)}>+ Submit Review</button>
        </div>
        <SectionHeader title={`Employee Reviews — ${activeDept}`} />
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                {["Employee", "Period", "Rating", "Score", "Comments", "Submitted"].map(h => <th key={h} style={s.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {reviews.length === 0 ? (
                <tr><td colSpan={6} style={s.emptyRow}>NO REVIEWS SUBMITTED YET</td></tr>
              ) : (
                reviews.map((rev) => (
                  <tr key={rev.id}>
                    <td style={{ ...s.td, color: "#e2e8f0", fontWeight: 600 }}>{rev.employeeName}</td>
                    <td style={s.td}>
                      <span style={{ background: rev.period === "weekly" ? "#0a1f2a" : "#1a0a2a", color: rev.period === "weekly" ? "#38bdf8" : "#a78bfa", padding: "2px 8px", borderRadius: "4px", fontSize: "10px" }}>
                        {rev.period}
                      </span>
                    </td>
                    <td style={{ ...s.td, color: "#f59e0b" }}>{"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}</td>
                    <td style={s.td}>{rev.performanceScore || "—"}</td>
                    <td style={{ ...s.td, maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rev.comments}</td>
                    <td style={{ ...s.td, fontSize: "11px" }}>{rev.submittedAt || "—"}</td>
                  </tr>
                ))
              )}
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
          <button style={{ ...s.btn("ghost"), marginLeft: "auto" }} onClick={fetchEmployees}>↻ Refresh</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {employees.length === 0 ? (
            <div style={{ ...s.emptyRow, gridColumn: "1/-1" }}>NO EMPLOYEES FOUND</div>
          ) : (
            employees.map((emp, i) => (
              <div key={emp.id} style={s.empCard}>
                <div style={s.empAvatar(i)}>{emp.name?.[0] || "?"}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}>{emp.name}</div>
                  <div style={{ fontSize: 10, color: "#374151", letterSpacing: "1px", marginTop: 2 }}>{emp.role || "Staff"}</div>
                  {emp.email && <div style={{ fontSize: 10, color: "#2d3d52", marginTop: 3 }}>{emp.email}</div>}
                </div>
                {emp.taskCount !== undefined && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: c }}>{emp.taskCount}</div>
                    <div style={{ fontSize: 8, color: "#374151", letterSpacing: "1px", textTransform: "uppercase" }}>Tasks</div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={s.root}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        ::-webkit-scrollbar { width: 4px; } 
        ::-webkit-scrollbar-track { background: transparent; } 
        ::-webkit-scrollbar-thumb { background: #16202e; border-radius: 2px; }
      `}</style>

      {/* ── Sidebar ── */}
      <aside style={s.sidebar}>
        <div style={s.sidebarHeader}>
          <div style={{ display: sidebarCollapsed ? "none" : "block" }}>
            <div style={s.logo}>MedCore HMS</div>
            <div style={s.logoSub}>HOD Panel</div>
          </div>
          {sidebarCollapsed && (
            <div style={{ ...s.avatar, width: 28, height: 28, fontSize: 12 }}>H</div>
          )}
          <button style={s.collapseBtn} onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            {sidebarCollapsed ? "»" : "«"}
          </button>
        </div>

        {/* Dept quick stats */}
        {!sidebarCollapsed && (
          <div style={s.sidebarStats}>
            <div style={s.miniStat("#f59e0b")}>
              <div style={s.miniStatVal("#f59e0b")}>{pendingCount}</div>
              <div style={s.miniStatLabel}>Pend.</div>
            </div>
            <div style={s.miniStat("#f87171")}>
              <div style={s.miniStatVal("#f87171")}>{overdueCount}</div>
              <div style={s.miniStatLabel}>Over.</div>
            </div>
            <div style={s.miniStat("#34d399")}>
              <div style={s.miniStatVal("#34d399")}>{doneCount}</div>
              <div style={s.miniStatLabel}>Done</div>
            </div>
          </div>
        )}

        <div style={s.sectionLabel}>Departments</div>
        {DEPARTMENTS.map((dept) => (
          <button key={dept} style={s.deptBtn(activeDept === dept, dept)}
            onClick={() => { setActiveDept(dept); setActiveView("tasks"); setFilterEmployee(""); setFilterDate(""); setFilterStatus(""); }}>
            <div style={s.deptIcon(dept)}>{DEPT_ICONS[dept]}</div>
            {!sidebarCollapsed && <span style={{ flex: 1 }}>{dept}</span>}
            {!sidebarCollapsed && activeDept === dept && tasks.length > 0 && (
              <span style={{ fontSize: 10, background: `${DEPT_COLORS[dept]}25`, color: DEPT_COLORS[dept], borderRadius: 10, padding: "1px 6px" }}>{tasks.length}</span>
            )}
          </button>
        ))}

        <div style={s.sectionLabel}>Views</div>
        {[
          { id: "tasks", label: "Tasks" },
          { id: "analytics", label: "Analytics" },
          { id: "reviews", label: "Reviews" },
          { id: "employees", label: "Employees" },
        ].map((v) => (
          <button key={v.id} style={s.navBtn(activeView === v.id)} onClick={() => setActiveView(v.id)}>
            <span style={s.navIcon(activeView === v.id)}>{VIEW_ICONS[v.id]}</span>
            {!sidebarCollapsed && v.label}
          </button>
        ))}

        {/* Footer */}
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

      {/* ── Main ── */}
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
            {loading && (
              <div style={s.loadingPill}>
                <div style={s.loadingDot} />
                SYNCING
              </div>
            )}
            <button style={s.btn("ghost")} onClick={() => { fetchTasks(); fetchEmployees(); }}>↻</button>
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
          <div style={s.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalTitle}>⊕ Assign Task — {activeDept}</div>
            <form onSubmit={handleAssignTask}>
              <div style={s.formRow}>
                <label style={s.label}>Employee</label>
                <select style={{ ...s.select, width: "100%" }} value={taskForm.employeeId} onChange={(e) => setTaskForm({ ...taskForm, employeeId: e.target.value })} required>
                  <option value="">Select Employee</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
              </div>

              {activeDept === "Billing" ? (
                <>
                  <div style={s.formRow}>
                    <label style={s.label}>Task Type</label>
                    <select style={{ ...s.select, width: "100%" }} value={taskForm.taskType} onChange={(e) => setTaskForm({ ...taskForm, taskType: e.target.value })} required>
                      <option value="">Select Task</option>
                      {BILLING_TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <div style={{ ...s.formRow, flex: 1 }}>
                      <label style={s.label}>Patient ID</label>
                      <input style={{ ...s.input, width: "100%" }} value={taskForm.patientId} onChange={(e) => setTaskForm({ ...taskForm, patientId: e.target.value })} placeholder="PT-00123" />
                    </div>
                    <div style={{ ...s.formRow, flex: 1 }}>
                      <label style={s.label}>Patient Type</label>
                      <select style={{ ...s.select, width: "100%" }} value={taskForm.patientType} onChange={(e) => setTaskForm({ ...taskForm, patientType: e.target.value })}>
                        <option value="TPA">TPA</option>
                        <option value="Card">Card</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <div style={s.formRow}>
                  <label style={s.label}>Task Type</label>
                  <input style={{ ...s.input, width: "100%" }} value={taskForm.taskType} onChange={(e) => setTaskForm({ ...taskForm, taskType: e.target.value })} placeholder="Enter task type" required />
                </div>
              )}

              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ ...s.formRow, flex: 1 }}>
                  <label style={s.label}>Priority</label>
                  <select style={{ ...s.select, width: "100%" }} value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div style={{ ...s.formRow, flex: 1 }}>
                  <label style={s.label}>Due Date</label>
                  <input type="date" style={{ ...s.input, width: "100%" }} value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
                </div>
              </div>

              <div style={s.formRow}>
                <label style={s.label}>Notes</label>
                <textarea style={s.textarea} value={taskForm.notes} onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })} placeholder="Optional notes..." />
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
          <div style={s.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalTitle}>✎ Update Task #{editingTask.id}</div>
            <div style={s.formRow}>
              <label style={s.label}>Status</label>
              <select style={{ ...s.select, width: "100%" }} value={editingTask.status} onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })}>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div style={s.formRow}>
              <label style={s.label}>Priority</label>
              <select style={{ ...s.select, width: "100%" }} value={editingTask.priority} onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div style={s.formRow}>
              <label style={s.label}>Notes</label>
              <textarea style={s.textarea} value={editingTask.notes || ""} onChange={(e) => setEditingTask({ ...editingTask, notes: e.target.value })} />
            </div>
            <div style={s.formActions}>
              <button style={s.btn("ghost")} onClick={() => setEditingTask(null)}>Cancel</button>
              <button style={s.btn("primary")} onClick={() => handleUpdateTask(editingTask.id, { status: editingTask.status, priority: editingTask.priority, notes: editingTask.notes })}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Review Modal ── */}
      {showReviewForm && (
        <div style={s.modal} onClick={() => setShowReviewForm(false)}>
          <div style={s.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalTitle}>⭐ Submit Employee Review</div>
            <form onSubmit={handleSubmitReview}>
              <div style={s.formRow}>
                <label style={s.label}>Employee</label>
                <select style={{ ...s.select, width: "100%" }} value={reviewForm.employeeId} onChange={(e) => setReviewForm({ ...reviewForm, employeeId: e.target.value })} required>
                  <option value="">Select Employee</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ ...s.formRow, flex: 1 }}>
                  <label style={s.label}>Period</label>
                  <select style={{ ...s.select, width: "100%" }} value={reviewForm.period} onChange={(e) => setReviewForm({ ...reviewForm, period: e.target.value })}>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div style={{ ...s.formRow, flex: 1 }}>
                  <label style={s.label}>Rating (1–5)</label>
                  <select style={{ ...s.select, width: "100%" }} value={reviewForm.rating} onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}>
                    {[1, 2, 3, 4, 5].map(r => <option key={r} value={r}>{"★".repeat(r)} ({r})</option>)}
                  </select>
                </div>
              </div>
              <div style={s.formRow}>
                <label style={s.label}>Performance Score</label>
                <input style={{ ...s.input, width: "100%" }} value={reviewForm.performanceScore} onChange={(e) => setReviewForm({ ...reviewForm, performanceScore: e.target.value })} placeholder="e.g. 87/100" />
              </div>
              <div style={s.formRow}>
                <label style={s.label}>Comments</label>
                <textarea style={s.textarea} value={reviewForm.comments} onChange={(e) => setReviewForm({ ...reviewForm, comments: e.target.value })} placeholder="Performance observations, feedback..." required />
              </div>
              <div style={s.formActions}>
                <button type="button" style={s.btn("ghost")} onClick={() => setShowReviewForm(false)}>Cancel</button>
                <button type="submit" style={s.btn("primary")}>Submit Review</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Logout Confirm Modal ── */}
      {showLogoutConfirm && (
        <div style={s.modal} onClick={() => setShowLogoutConfirm(false)}>
          <div style={{ ...s.modalBox, width: 360, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⎋</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>Confirm Logout</div>
            <div style={{ fontSize: 12, color: "#374151", marginBottom: 20 }}>
              You'll be signed out of the HOD Panel. Any unsaved changes will be lost.
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button style={s.btn("ghost")} onClick={() => setShowLogoutConfirm(false)}>Stay</button>
              <button style={s.btn("danger")} onClick={() => { setShowLogoutConfirm(false); onLogout?.(); }}>Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
