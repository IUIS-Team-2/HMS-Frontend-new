import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { apiService } from "../services/apiService";
import ThemeModeDock from "../components/ui/ThemeModeDock";
import { LogOut, Save, ClipboardList, Archive } from "lucide-react";

// ─── Constants ─────────────────────────────────────────────────────────────────
const DEPARTMENT = "query";
const accent     = "var(--accent)";

const QUERY_COLUMNS = [
  { key: "uhid",         label: "UHID",            width: 130 },
  { key: "claimId",      label: "Claim ID",         width: 130 },
  { key: "patientName",  label: "Patient Name",     width: 180 },
  { key: "raiseDate",    label: "Raise Date",       width: 130, type: "date" },
  { key: "queryRepDate", label: "Query Rep Date",   width: 130, type: "date" },
  { key: "hospital",     label: "Hospital",         width: 160 },
  { key: "justifyBy",    label: "Justify By",       width: 140 },
  { key: "replyBy",      label: "Reply By",         width: 140 },
  { key: "remarks",      label: "Remarks",          width: 200 },
];

// ─── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
* { box-sizing: border-box; }
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: var(--surface-2); }
::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 3px; }
.qapp { display: flex; flex-direction: column; height: 100dvh; min-height: 100vh; overflow: hidden; background: var(--bg); color: var(--text); font-family: var(--ui-font-sans); }
.qlayout { display: flex; flex: 1; min-height: 0; overflow: hidden; }
.qmain { flex: 1; min-width: 0; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 28px 32px; }
.qtopbar { height: 60px; background: var(--surface); display: flex; align-items: center; padding: 0 28px; justify-content: space-between; border-bottom: 1px solid var(--border); flex-shrink: 0; }
.qsidebar { width: 200px; min-width: 200px; background: var(--surface); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 18px 10px; min-height: 0; overflow-y: auto; }
.qslbl { font-size: 10px; font-weight: 700; color: var(--text-muted); letter-spacing: .1em; text-transform: uppercase; padding: 0 10px 8px; }
.qsi { display: flex; align-items: center; gap: 9px; padding: 9px 11px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500; color: var(--text-mid); transition: .13s; }
.qsi:hover { background: var(--bg); color: var(--text); }
.qsi.act { background: var(--warning-soft); color: var(--warning); font-weight: 700; border-left: 3px solid var(--warning); }
.qshr { height: 1px; background: var(--border); margin: 10px 10px; }
.qsmr { display: flex; justify-content: space-between; padding: 5px 11px; font-size: 12px; border-bottom: 1px solid var(--border); }
.qsmr:last-child { border-bottom: none; }
.qsmrl { color: var(--text-muted); }
.qpgh { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 22px; }
.qpgt { font-size: 26px; color: var(--text); font-weight: 800; letter-spacing: -.02em; }
.qpgs { font-size: 13px; color: var(--text-muted); margin-top: 3px; }
.qsrow { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 26px; }
.qsc { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 18px 20px; position: relative; overflow: hidden; }
.qscv { font-size: 30px; line-height: 1; margin-bottom: 4px; font-weight: 800; }
.qscl { font-size: 12px; color: var(--text-muted); font-weight: 500; }
.qtgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; }
.qtc { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 18px 20px; cursor: pointer; transition: .18s; }
.qtc:hover { border-color: var(--warning); box-shadow: 0 4px 16px rgba(245,158,11,.12); transform: translateY(-2px); }
.qtctp { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 10px; gap: 8px; }
.qtcnm { font-size: 15px; font-weight: 700; color: var(--text); }
.qtcid { font-size: 11px; color: var(--text-muted); font-family: monospace; margin-top: 2px; }
.qtcrs { margin-bottom: 10px; display: flex; flex-direction: column; gap: 5px; }
.qtcrw { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--text-mid); }
.qtcri { width: 16px; text-align: center; color: var(--text-muted); flex-shrink: 0; }
.qtcft { display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid var(--border); margin-top: 8px; }
.badge-amber { display: inline-flex; align-items: center; gap: 4px; padding: 4px 9px; border-radius: 20px; font-size: 11px; font-weight: 700; background: var(--warning-soft); color: var(--warning); white-space: nowrap; }
.badge-teal { display: inline-flex; align-items: center; gap: 4px; padding: 4px 9px; border-radius: 20px; font-size: 11px; font-weight: 700; background: var(--success-soft); color: var(--success); white-space: nowrap; }
.badge-blue { display: inline-flex; align-items: center; gap: 4px; padding: 4px 9px; border-radius: 20px; font-size: 11px; font-weight: 700; background: var(--info-soft); color: var(--info); white-space: nowrap; }
.badge-chip { padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 600; background: var(--surface-2); color: var(--text-mid); border: 1px solid var(--border); }
.qback-btn { display: inline-flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 600; color: var(--text-mid); cursor: pointer; background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 7px 15px; font-family: inherit; transition: .14s; margin-bottom: 20px; }
.qback-btn:hover { color: var(--text); border-color: var(--text); }
.qdhdr { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 20px 24px; margin-bottom: 18px; border-left: 4px solid var(--warning); }
.qdname { font-size: 22px; color: var(--text); margin-bottom: 4px; font-weight: 800; }
.qdmeta { font-size: 13px; color: var(--text-mid); margin-bottom: 10px; }
.qcl { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 18px 20px; margin-bottom: 18px; }
.qsavebtn { padding: 10px 22px; border-radius: 8px; font-size: 13px; font-weight: 700; background: var(--warning); color: #fff; border: none; cursor: pointer; font-family: inherit; transition: .14s; margin-top: 4px; }
.qsavebtn:hover { filter: brightness(1.08); }
.qhodbtn { padding: 10px 22px; border-radius: 8px; font-size: 13px; font-weight: 700; background: var(--warning); color: #fff; border: none; cursor: pointer; font-family: inherit; transition: .16s; box-shadow: 0 3px 10px rgba(245,158,11,.25); }
.qhodbtn:hover { filter: brightness(1.08); transform: translateY(-1px); }
.qhodbtn:disabled { opacity: .4; cursor: not-allowed; transform: none; box-shadow: none; }
.qform-card { background: var(--card); border: 1px solid #fde68a; border-radius: 12px; overflow: hidden; margin-bottom: 20px; }
.qform-hdr { background: #fef3c7; padding: 14px 20px; border-bottom: 1.5px solid #fde68a; display: flex; align-items: center; justify-content: space-between; }
.qform-title { font-size: 14px; font-weight: 700; color: #b45309; letter-spacing: .02em; }
.qform-body { padding: 22px; }
.qfgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
.qfg { display: flex; flex-direction: column; gap: 5px; }
.qfg.full { grid-column: 1 / -1; }
.qflbl { font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: .07em; }
.qfinp, .qftxt { background: var(--surface-2); border: 1.5px solid var(--border); border-radius: 8px; padding: 9px 12px; color: var(--text); font-size: 13px; font-family: inherit; outline: none; transition: .14s; width: 100%; }
.qfinp:focus, .qftxt:focus { border-color: #f59e0b; background: var(--card); box-shadow: 0 0 0 3px rgba(245,158,11,.1); }
.qftxt { resize: vertical; min-height: 76px; }
.overlay { position: fixed; inset: 0; background: rgba(11,25,41,.6); z-index: 999; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px); }
.modal { background: var(--card); border-radius: 16px; padding: 30px 32px; min-width: 360px; max-width: 95vw; box-shadow: var(--shadow-md); position: relative; max-height: 90vh; overflow-y: auto; }
.mclose { position: absolute; top: 16px; right: 16px; width: 28px; height: 28px; border-radius: 6px; background: var(--surface-2); border: 1px solid var(--border); cursor: pointer; font-size: 13px; color: var(--text-mid); display: flex; align-items: center; justify-content: center; }
.twrp { position: fixed; bottom: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 8px; pointer-events: none; }
.tst { background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 12px 16px; font-size: 13px; font-weight: 600; box-shadow: var(--shadow-md); display: flex; align-items: center; gap: 9px; animation: tsl .22s ease; color: var(--text); }
.tst.s { border-left: 3px solid var(--success); }
.tst.e { border-left: 3px solid var(--danger); }
@keyframes tsl { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
.qrec-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; padding: 14px 20px; background: var(--card); border: 1.5px solid #fde68a; border-radius: 12px; flex-wrap: wrap; }
.qchip { padding: 6px 16px; border-radius: 20px; font-size: 11px; font-family: inherit; cursor: pointer; background: var(--surface-2); border: 1.5px solid #fde68a; color: var(--text-mid); font-weight: 600; transition: all .15s; }
.qchip.act { background: rgba(245,158,11,.15); border-color: #f59e0b; color: #b45309; font-weight: 700; }
.empty { text-align: center; padding: 60px 20px; color: var(--text-muted); }
.empty-ico { font-size: 44px; margin-bottom: 12px; }
.qpbar { height: 4px; background: var(--border); border-radius: 4px; overflow: hidden; margin-top: 5px; }
.qpfil { height: 100%; background: var(--warning); border-radius: 4px; transition: width .3s; }
@media(max-width:860px) { .qsidebar { display: none; } .qmain { padding: 16px; } }
`;

function todayStr()   { return new Date().toISOString().slice(0, 10); }
function weekRange()  { const now = new Date(); const day = now.getDay(); const mon = new Date(now); mon.setDate(now.getDate() - ((day + 6) % 7)); const sun = new Date(mon); sun.setDate(mon.getDate() + 6); return { start: mon.toISOString().slice(0, 10), end: sun.toISOString().slice(0, 10) }; }
function monthRange() { const now = new Date(); return { start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10), end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10) }; }
function yearRange()  { const y = new Date().getFullYear(); return { start: `${y}-01-01`, end: `${y}-12-31` }; }
function fmtDt(d)     { return d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"; }
function fmtDtShort(d){ return d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"; }

let _tid = 0;

// ─── Main Component ────────────────────────────────────────────────────────────
export default function QueryDashboard({ currentUser, onLogout, db }) {
  const today = todayStr();

  const [view,          setView]          = useState("tasks");
  const [patients,      setPatients]      = useState([]);
  const [sel,           setSel]           = useState(null);
  const [queryForm,     setQueryForm]     = useState({});
  const [isSaved,       setIsSaved]       = useState(false);
  const [showConfirm,   setShowConfirm]   = useState(false);
  const [toasts,        setToasts]        = useState([]);

  // Records tab state
  const [allEntries,   setAllEntries]    = useState([]);
  const [viewTab,      setViewTab]       = useState("tasks");
  const [filterMode,   setFilterMode]    = useState("today");
  const [customStart,  setCustomStart]   = useState(today);
  const [customEnd,    setCustomEnd]     = useState(today);
  const [syncError,    setSyncError]     = useState("");

  // ─── Load assigned tasks ────────────────────────────────────────────────────
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const data = await apiService.getMyTasks();
        const tasks = Array.isArray(data) ? data : [];
        const mapped = tasks.map(task => {
          const pd  = task.patient_detail || {};
          const adm = task.admission_detail || task.current_admission_detail || pd.current_admission_detail || {};
          const dis = adm.discharge || {};
          const statusRaw = String(task.status || "").toLowerCase();
          const taskStatus = statusRaw.includes("complete") ? "completed" : statusRaw.includes("progress") ? "submitted" : "pending";
          return {
            id:          task.id,
            uhid:        task.patient_uhid || pd.uhid || `task-${task.id}`,
            admNo:       task.admNo || task.admission_no || task.current_admission_no || adm.admNo || "—",
            patientName: task.patient_name || pd.patientName || "Assigned Patient",
            age:         pd.ageYY || pd.age || "—",
            gender:      pd.gender || "",
            phone:       pd.phone  || "",
            address:     pd.address || "",
            doa:         dis.doa   || adm.dateTime || "",
            dod:         dis.dod   || "",
            ward:        dis.wardName || adm.wardName || "",
            bed:         dis.bedNo || adm.bedNo || "",
            doctor:      dis.doctorName || adm.medicalHistory?.treatingDoctor || "",
            diagnosis:   dis.diagnosis  || adm.medicalHistory?.previousDiagnosis || task.title || "",
            status:      dis.dod ? "discharged" : "admitted",
            taskStatus,
            // Pre-fill query form from existing task data if available
            queryData:   task.query_data || adm.queryData || {},
          };
        });
        setPatients(mapped);
      } catch (err) {
        console.error("Failed to load tasks", err);
        setPatients([]);
      }
    };
    loadTasks();
  }, []);

  // ─── Load records (existing query logs) ────────────────────────────────────
  useEffect(() => {
    const loadEntries = async () => {
      try {
        setSyncError("");
        const response = await apiService.getDepartmentLogs(DEPARTMENT);
        const normalized = (Array.isArray(response) ? response : []).map((entry, idx) => ({
          id: entry.id ? `query-${entry.id}` : crypto.randomUUID(),
          ...entry.data,
          createdAt: entry.data?.createdAt || `${entry.record_date}T00:00:00`,
          sNo: idx + 1,
        }));
        setAllEntries(normalized);
      } catch (err) {
        setSyncError("Unable to load saved query logs.");
      }
    };
    loadEntries();
  }, []);

  // ─── Toast ──────────────────────────────────────────────────────────────────
  const toast = (msg, type = "s") => {
    const id = _tid++;
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  };

  // ─── Open patient ────────────────────────────────────────────────────────────
  const openPatient = (p) => {
    setSel(p);
    setQueryForm({
      uhid:         p.uhid        || "",
      claimId:      p.queryData?.claimId      || "",
      patientName:  p.patientName || "",
      raiseDate:    p.queryData?.raiseDate    || "",
      queryRepDate: p.queryData?.queryRepDate || today,
      hospital:     p.queryData?.hospital     || "",
      justifyBy:    p.queryData?.justifyBy    || "",
      replyBy:      p.queryData?.replyBy      || "",
      remarks:      p.queryData?.remarks      || "",
    });
    setIsSaved(p.taskStatus === "completed" || Boolean(p.queryData?.saved));
    setView("patient");
  };

  // ─── Save query form ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!sel) return;
    try {
      setSyncError("");
      const payload = {
        ...queryForm,
        addedBy:   currentUser?.name || "",
        createdAt: new Date().toISOString(),
      };
      await apiService.saveDepartmentLogs(DEPARTMENT, [payload]);
      // Also update via task if API supports it
      try {
        await apiService.updateMedicalHistory(sel.uhid, sel.admNo, { queryData: { ...payload, saved: true } });
      } catch (_) { /* optional endpoint */ }
      setIsSaved(true);
      setPatients(prev => prev.map(p =>
        p.uhid === sel.uhid && p.admNo === sel.admNo
          ? { ...p, queryData: { ...payload, saved: true } }
          : p
      ));
      setSel(prev => prev ? { ...prev, queryData: { ...payload, saved: true } } : prev);
      // Add to all entries
      setAllEntries(prev => {
        const without = prev.filter(e => !(e.uhid === queryForm.uhid && e.claimId === queryForm.claimId));
        return [...without, { id: crypto.randomUUID(), ...payload, sNo: prev.length + 1 }];
      });
      toast("Query data saved ✓");
    } catch (err) {
      toast("Failed to save query data", "e");
    }
  };

  // ─── Submit to HOD ───────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!sel) return;
    try {
      await apiService.requestPrint(sel.uhid, sel.admNo);
      setPatients(prev => prev.map(p =>
        p.uhid === sel.uhid && p.admNo === sel.admNo
          ? { ...p, taskStatus: "completed" }
          : p
      ));
      setSel(prev => prev ? { ...prev, taskStatus: "completed" } : prev);
      setShowConfirm(false);
      toast("Submitted to Admin Management ✓");
    } catch (err) {
      toast("Failed to submit to HOD", "e");
    }
  };

  // ─── Records filtered ────────────────────────────────────────────────────────
  const filteredEntries = (() => {
    let start, end;
    if (filterMode === "today")      { start = today; end = today; }
    else if (filterMode === "week")  { ({ start, end } = weekRange()); }
    else if (filterMode === "month") { ({ start, end } = monthRange()); }
    else if (filterMode === "year")  { ({ start, end } = yearRange()); }
    else                             { start = customStart; end = customEnd; }
    return allEntries
      .filter(e => { const d = e.queryRepDate || e.createdAt?.slice(0,10) || ""; return d >= start && d <= end; })
      .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
  })();

  const handleDownload = () => {
    const data = filteredEntries.map((row, idx) => ({
      "S.No.": idx + 1,
      UHID: row.uhid || "", "Claim ID": row.claimId || "",
      "Patient Name": row.patientName || "", "Raise Date": row.raiseDate || "",
      "Query Rep Date": row.queryRepDate || "", Hospital: row.hospital || "",
      "Justify By": row.justifyBy || "", "Reply By": row.replyBy || "",
      Remarks: row.remarks || "", "Added By": row.addedBy || "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Query Logs");
    XLSX.writeFile(wb, `Sangi_Query_${filterMode}_${today}.xlsx`);
  };

  const pending   = patients.filter(p => p.taskStatus !== "completed").length;
  const completed = patients.filter(p => p.taskStatus === "completed").length;

  const setF = (k) => (e) => setQueryForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <>
      <style>{CSS}</style>
      <div className="qapp">

        {/* ── Topbar ─────────────────────────────────────────────────────── */}
        <header className="qtopbar">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--warning-soft)", border: "1px solid var(--warning-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "var(--warning)", fontWeight: 800 }}>?</div>
            <div>
              <div style={{ fontSize: 9, letterSpacing: "4px", color: "var(--text-muted)", textTransform: "uppercase" }}>Sangi Hospital</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>Query Department</div>
            </div>
            <div style={{ marginLeft: 8, padding: "4px 14px", borderRadius: 20, background: "var(--warning-soft)", border: "1.5px solid var(--warning-border)", fontSize: 10, color: "var(--warning)", fontWeight: 600 }}>{today}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ThemeModeDock variant="inline" />
            {currentUser && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 14, borderLeft: "1px solid var(--border)" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--warning-soft)", border: "1.5px solid var(--warning-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "var(--warning)", fontWeight: 700 }}>{currentUser.name?.[0] || "Q"}</div>
                <div>
                  <div style={{ fontSize: 12, color: "var(--text)", fontWeight: 700 }}>{currentUser.name}</div>
                  <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "1.5px", textTransform: "uppercase" }}>Query Staff</div>
                </div>
                <button onClick={onLogout} style={{ marginLeft: 6, padding: "5px 14px", borderRadius: 8, background: "var(--danger-soft)", border: "1.5px solid var(--danger-border)", color: "var(--danger)", fontSize: 10, cursor: "pointer", fontFamily: "inherit", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <LogOut size={12} strokeWidth={2} /> Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* ── Sub-nav ─────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", height: 48, borderBottom: "1.5px solid var(--border)", background: "var(--bg)", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 4 }}>
            {[{ id: "tasks", label: "My Patients", Icon: ClipboardList }, { id: "records", label: "Records", Icon: Archive }].map(tab => (
              <button key={tab.id} onClick={() => { setViewTab(tab.id); if (tab.id === "tasks") setView("tasks"); }}
                style={{ padding: "7px 20px", borderRadius: "8px 8px 0 0", fontSize: 12, fontFamily: "inherit", cursor: "pointer", border: "none", background: viewTab === tab.id ? "var(--surface)" : "transparent", color: viewTab === tab.id ? "var(--warning)" : "var(--text-muted)", borderBottom: viewTab === tab.id ? "3px solid var(--warning)" : "3px solid transparent", fontWeight: viewTab === tab.id ? 700 : 600, transition: "all .15s" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><tab.Icon size={14} strokeWidth={2} />{tab.label}</span>
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {syncError && <div style={{ fontSize: 10, color: "var(--danger)", fontWeight: 600 }}>{syncError}</div>}
            {viewTab === "records" && (
              <button onClick={handleDownload} style={{ padding: "6px 16px", borderRadius: 8, fontSize: 11, fontFamily: "inherit", cursor: "pointer", background: "var(--surface-2)", border: "1.5px solid var(--border)", color: "var(--info)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
                ↓ Export Excel
              </button>
            )}
          </div>
        </div>

        <div className="qlayout">
          {/* ── Sidebar ──────────────────────────────────────────────────── */}
          <aside className="qsidebar">
            <div className="qslbl">Workspace</div>
            <div className="qsi act"><span>❓</span> My Patients</div>
            <div className="qshr" />
            <div className="qslbl">Overview</div>
            <div className="qsmr"><span className="qsmrl">Total Assigned</span><strong style={{ color: "var(--warning)" }}>{patients.length}</strong></div>
            <div className="qsmr"><span className="qsmrl">Pending</span><strong style={{ color: "var(--warning)" }}>{pending}</strong></div>
            <div className="qsmr"><span className="qsmrl">Completed</span><strong style={{ color: "var(--success)" }}>{completed}</strong></div>
            <div className="qsmr"><span className="qsmrl">Records</span><strong style={{ color: "var(--info)" }}>{allEntries.length}</strong></div>
          </aside>

          <main className="qmain">

            {/* ── TASK LIST ─────────────────────────────────────────────── */}
            {viewTab === "tasks" && view === "tasks" && (
              <>
                <div className="qpgh">
                  <div>
                    <div className="qpgt">My Patients</div>
                    <div className="qpgs">Query tasks assigned to you — fill and submit each to HOD</div>
                  </div>
                  <div style={{ padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-mid)" }}>
                    {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
                  </div>
                </div>

                <div className="qsrow">
                  <div className="qsc" style={{ borderTop: "2px solid var(--warning)" }}>
                    <div className="qscv" style={{ color: "var(--warning)" }}>{patients.length}</div>
                    <div className="qscl">Total Assigned</div>
                  </div>
                  <div className="qsc" style={{ borderTop: "2px solid var(--info)" }}>
                    <div className="qscv" style={{ color: "var(--info)" }}>{pending}</div>
                    <div className="qscl">Pending Tasks</div>
                  </div>
                  <div className="qsc" style={{ borderTop: "2px solid var(--success)" }}>
                    <div className="qscv" style={{ color: "var(--success)" }}>{completed}</div>
                    <div className="qscl">Completed</div>
                  </div>
                </div>

                {patients.length === 0
                  ? (
                    <div className="empty">
                      <div className="empty-ico">🎉</div>
                      <div style={{ fontWeight: 600, marginBottom: 6 }}>No patients assigned yet!</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Patients assigned by your HOD will appear here.</div>
                    </div>
                  ) : (
                    <div className="qtgrid">
                      {patients.map(p => (
                        <div key={`${p.uhid}-${p.admNo}`} className="qtc" onClick={() => openPatient(p)}>
                          <div className="qtctp">
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="qtcnm">{p.patientName}</div>
                              <div className="qtcid">{p.uhid} · {p.admNo}</div>
                            </div>
                            <span className={p.taskStatus === "completed" ? "badge-teal" : "badge-amber"}>
                              {p.taskStatus === "completed" ? "✓ Done" : "⏳ Pending"}
                            </span>
                          </div>
                          <div className="qtcrs">
                            <div className="qtcrw"><span className="qtcri">👤</span>{p.age} yrs · {p.gender}</div>
                            <div className="qtcrw"><span className="qtcri">📞</span>{p.phone || "—"}</div>
                            <div className="qtcrw"><span className="qtcri">🩺</span>{p.diagnosis || "—"}</div>
                            <div className="qtcrw"><span className="qtcri">👨‍⚕️</span>{p.doctor || "—"}</div>
                          </div>
                          <div style={{ display: "flex", gap: 0, marginBottom: 12, background: "var(--surface-2)", borderRadius: 8, border: "1px solid var(--border)", overflow: "hidden" }}>
                            {[["Admitted", fmtDtShort(p.doa)], ["Ward · Bed", `${p.ward || "—"} · ${p.bed || "—"}`], ["Status", p.status]].map(([l, v]) => (
                              <div key={l} style={{ flex: 1, padding: "8px 10px", borderRight: "1px solid var(--border)" }}>
                                <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".07em" }}>{l}</div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginTop: 2 }}>{v}</div>
                              </div>
                            ))}
                            <div style={{ flex: 1, padding: "8px 10px" }}>
                              <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".07em" }}>Discharge</div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: p.dod ? "var(--success)" : "var(--warning)", marginTop: 2 }}>{p.dod ? fmtDtShort(p.dod) : "Active"}</div>
                            </div>
                          </div>
                          {p.taskStatus !== "completed" && (
                            <div style={{ marginBottom: 10 }}>
                              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                {p.queryData?.saved ? "Form filled — ready to submit" : "Form not yet filled"}
                              </div>
                              <div className="qpbar">
                                <div className="qpfil" style={{ width: p.queryData?.saved ? "100%" : "0%" }} />
                              </div>
                            </div>
                          )}
                          <div className="qtcft">
                            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>DOA: {fmtDt(p.doa)}</div>
                            <button className="qhodbtn" style={{ padding: "7px 18px", fontSize: 12 }} onClick={e => { e.stopPropagation(); openPatient(p); }}>Open →</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                }
              </>
            )}

            {/* ── PATIENT DETAIL ────────────────────────────────────────── */}
            {viewTab === "tasks" && view === "patient" && sel && (
              <>
                <button className="qback-btn" onClick={() => { setView("tasks"); setSel(null); }}>← Back to My Patients</button>

                {/* Patient header */}
                <div className="qdhdr">
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
                    <div>
                      <div className="qdname">{sel.patientName}</div>
                      <div className="qdmeta">
                        UHID: <strong>{sel.uhid}</strong> &nbsp;·&nbsp; Adm No: <strong>{sel.admNo}</strong>
                        &nbsp;·&nbsp; {sel.age} yrs · {sel.gender} &nbsp;·&nbsp; {sel.phone || "—"}
                      </div>
                    </div>
                    <span className={sel.taskStatus === "completed" ? "badge-teal" : "badge-amber"}>
                      {sel.taskStatus === "completed" ? "✓ Submitted to HOD" : "⏳ Pending"}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span className="badge-blue">🛏 {sel.ward} · {sel.bed}</span>
                    <span className="badge-blue">👨‍⚕️ {sel.doctor || "—"}</span>
                    <span className={sel.status === "admitted" ? "badge-teal" : "badge-blue"}>{sel.status}</span>
                    <span className="badge-chip">DOA: {fmtDt(sel.doa)}</span>
                    {sel.dod && <span className="badge-chip">DOD: {fmtDt(sel.dod)}</span>}
                  </div>
                </div>

                {/* Checklist strip */}
                <div className="qcl">
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".09em", marginBottom: 12 }}>Task Progress</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    {[
                      { label: "Fill Query Form", done: isSaved },
                      { label: "Submit to HOD",   done: sel.taskStatus === "completed" },
                    ].map(({ label, done }, idx) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, padding: "8px 12px", borderRadius: 9, background: done ? "var(--success-soft)" : "var(--surface-2)", border: `1px solid ${done ? "var(--success-border)" : "var(--border)"}` }}>
                          <div style={{ width: 24, height: 24, borderRadius: "50%", border: `2px solid ${done ? "var(--success)" : "var(--border-strong)"}`, background: done ? "var(--success)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: done ? "#fff" : "var(--text-muted)", fontWeight: 700, flexShrink: 0 }}>
                            {done ? "✓" : idx + 1}
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: done ? "var(--success)" : "var(--text-mid)" }}>{label}</span>
                        </div>
                        {idx < 1 && <div style={{ width: 24, height: 2, background: isSaved ? "var(--success)" : "var(--border)", flexShrink: 0 }} />}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
                    {sel.taskStatus === "completed"
                      ? <div style={{ fontSize: 13, color: "var(--success)", fontWeight: 600 }}>✔ Submitted to HOD & Admin Management</div>
                      : isSaved
                        ? <div style={{ fontSize: 13, color: "var(--success)", fontWeight: 600 }}>✔ Form saved — ready to submit</div>
                        : <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Fill and save the form below, then submit to HOD</div>
                    }
                    {sel.taskStatus !== "completed"
                      ? <button className="qhodbtn" disabled={!isSaved} onClick={() => setShowConfirm(true)}>Submit to HOD →</button>
                      : <div style={{ padding: "10px 18px", borderRadius: 8, background: "var(--success-soft)", border: "1px solid var(--success-border)", color: "var(--success)", fontWeight: 700, fontSize: 13 }}>✔ Submitted</div>
                    }
                  </div>
                </div>

                {/* Query Form */}
                <div className="qform-card">
                  <div className="qform-hdr">
                    <div className="qform-title">❓ Query Form — {sel.patientName}</div>
                    {isSaved && <span style={{ fontSize: 11, fontWeight: 700, color: "var(--success)", background: "var(--success-soft)", border: "1px solid var(--success-border)", borderRadius: 20, padding: "2px 10px" }}>✓ Saved</span>}
                  </div>
                  <div className="qform-body">
                    <div className="qfgrid">
                      <div className="qfg">
                        <label className="qflbl">UHID</label>
                        <input className="qfinp" value={queryForm.uhid || ""} onChange={setF("uhid")} placeholder={sel.uhid} style={{ fontFamily: "monospace", fontWeight: 700 }} />
                      </div>
                      <div className="qfg">
                        <label className="qflbl">Claim ID</label>
                        <input className="qfinp" value={queryForm.claimId || ""} onChange={setF("claimId")} placeholder="e.g. 42092669" />
                      </div>
                      <div className="qfg">
                        <label className="qflbl">Patient Name</label>
                        <input className="qfinp" value={queryForm.patientName || ""} onChange={setF("patientName")} placeholder={sel.patientName} />
                      </div>
                      <div className="qfg">
                        <label className="qflbl">Raise Date</label>
                        <input className="qfinp" type="date" value={queryForm.raiseDate || ""} onChange={setF("raiseDate")} />
                      </div>
                      <div className="qfg">
                        <label className="qflbl">Query Rep Date</label>
                        <input className="qfinp" type="date" value={queryForm.queryRepDate || ""} onChange={setF("queryRepDate")} />
                      </div>
                      <div className="qfg">
                        <label className="qflbl">Hospital</label>
                        <input className="qfinp" value={queryForm.hospital || ""} onChange={setF("hospital")} placeholder="Hospital name" />
                      </div>
                      <div className="qfg">
                        <label className="qflbl">Justify By</label>
                        <input className="qfinp" value={queryForm.justifyBy || ""} onChange={setF("justifyBy")} placeholder="Person responsible" />
                      </div>
                      <div className="qfg">
                        <label className="qflbl">Reply By</label>
                        <input className="qfinp" value={queryForm.replyBy || ""} onChange={setF("replyBy")} placeholder="Reply deadline or person" />
                      </div>
                      <div className="qfg full">
                        <label className="qflbl">Remarks</label>
                        <textarea className="qftxt" rows={3} value={queryForm.remarks || ""} onChange={setF("remarks")} placeholder="Any additional notes or remarks..." />
                      </div>
                    </div>
                  </div>
                </div>

                <button className="qsavebtn" onClick={handleSave}>
                  <Save size={14} strokeWidth={2} style={{ display: "inline", marginRight: 6 }} />
                  Save Query Form
                </button>
              </>
            )}

            {/* ── RECORDS ───────────────────────────────────────────────── */}
            {viewTab === "records" && (
              <>
                <div className="qpgh">
                  <div>
                    <div className="qpgt">Query Records</div>
                    <div className="qpgs">Browse all saved query logs by date range</div>
                  </div>
                </div>

                <div className="qrec-bar">
                  <span style={{ fontSize: 9, color: "var(--warning)", letterSpacing: "2.5px", textTransform: "uppercase", fontWeight: 600 }}>Period:</span>
                  {[{ id: "today", label: "Today" }, { id: "week", label: "This Week" }, { id: "month", label: "This Month" }, { id: "year", label: "This Year" }, { id: "custom", label: "Custom" }].map(f => (
                    <button key={f.id} className={"qchip" + (filterMode === f.id ? " act" : "")} onClick={() => setFilterMode(f.id)}>{f.label}</button>
                  ))}
                  {filterMode === "custom" && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} style={{ background: "var(--surface-2)", border: "1.5px solid #fde68a", color: "var(--text)", padding: "6px 12px", borderRadius: 8, fontSize: 11, fontFamily: "inherit", outline: "none" }} />
                      <span style={{ color: "var(--text-muted)", fontSize: 10 }}>to</span>
                      <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} style={{ background: "var(--surface-2)", border: "1.5px solid #fde68a", color: "var(--text)", padding: "6px 12px", borderRadius: 8, fontSize: 11, fontFamily: "inherit", outline: "none" }} />
                    </div>
                  )}
                  <div style={{ marginLeft: "auto", padding: "5px 16px", borderRadius: 20, background: "rgba(245,158,11,.15)", border: "1.5px solid #f59e0b", fontSize: 12, color: "#b45309", fontWeight: 700 }}>{filteredEntries.length} records</div>
                </div>

                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
                  {[
                    { label: "Total Records",    val: filteredEntries.length,                                                col: "var(--warning)" },
                    { label: "Unique Patients",  val: new Set(filteredEntries.map(e => e.patientName)).size,                col: "var(--success)" },
                    { label: "Unique Hospitals", val: new Set(filteredEntries.map(e => e.hospital).filter(Boolean)).size,   col: "var(--info)" },
                    { label: "Days Covered",     val: new Set(filteredEntries.map(e => e.createdAt?.slice(0,10))).size,     col: "var(--danger)" },
                  ].map(({ label, val, col }) => (
                    <div key={label} style={{ background: "var(--card)", border: "1.5px solid #fde68a", borderTop: `4px solid ${col}`, borderRadius: 12, padding: "16px 18px" }}>
                      <div style={{ fontSize: 8, letterSpacing: "2.5px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8, fontWeight: 700 }}>{label}</div>
                      <div style={{ fontSize: 30, fontWeight: 700, color: col, lineHeight: 1 }}>{val}</div>
                    </div>
                  ))}
                </div>

                {filteredEntries.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 60, color: "#fde68a", fontSize: 12, letterSpacing: "3px", background: "var(--card)", border: "1.5px solid #fde68a", borderRadius: 12, fontWeight: 700 }}>
                    NO RECORDS FOUND FOR THIS PERIOD
                  </div>
                ) : (
                  <div style={{ background: "var(--card)", border: "1.5px solid #fde68a", borderRadius: 12, overflow: "hidden" }}>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: "#fef3c7" }}>
                            <th style={{ padding: "11px 14px", textAlign: "left", fontSize: 9, letterSpacing: "2px", color: "#b45309", textTransform: "uppercase", borderBottom: "2px solid #fde68a", borderRight: "1px solid #fde68a" }}>S.No.</th>
                            {QUERY_COLUMNS.map(col => (
                              <th key={col.key} style={{ padding: "11px 14px", textAlign: "left", fontSize: 9, letterSpacing: "2px", color: "#b45309", textTransform: "uppercase", borderBottom: "2px solid #fde68a", whiteSpace: "nowrap", fontWeight: 700, borderRight: "1px solid #fde68a" }}>{col.label}</th>
                            ))}
                            <th style={{ padding: "11px 14px", fontSize: 9, color: "#b45309", borderBottom: "2px solid #fde68a" }}>Added By</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredEntries.map((row, i) => (
                            <tr key={row.id || i} style={{ borderBottom: "1px solid #fef3c7" }}>
                              <td style={{ padding: "10px 14px", color: "#fbbf24", fontSize: 10, borderRight: "1px solid #fef3c7" }}>{i + 1}</td>
                              <td style={{ padding: "10px 14px", color: "var(--info)", fontWeight: 600, borderRight: "1px solid #fef3c7", fontFamily: "monospace" }}>{row.uhid || "—"}</td>
                              <td style={{ padding: "10px 14px", color: "var(--warning)", fontWeight: 600, borderRight: "1px solid #fef3c7" }}>{row.claimId || "—"}</td>
                              <td style={{ padding: "10px 14px", color: "var(--text)", fontWeight: 700, borderRight: "1px solid #fef3c7" }}>{row.patientName || "—"}</td>
                              <td style={{ padding: "10px 14px", color: "var(--text-mid)", fontSize: 11, borderRight: "1px solid #fef3c7" }}>{row.raiseDate || "—"}</td>
                              <td style={{ padding: "10px 14px", color: "var(--text-mid)", fontSize: 11, borderRight: "1px solid #fef3c7" }}>{row.queryRepDate || "—"}</td>
                              <td style={{ padding: "10px 14px", color: "var(--text-mid)", borderRight: "1px solid #fef3c7" }}>{row.hospital || "—"}</td>
                              <td style={{ padding: "10px 14px", color: "var(--text-mid)", borderRight: "1px solid #fef3c7" }}>{row.justifyBy || "—"}</td>
                              <td style={{ padding: "10px 14px", color: "var(--text-mid)", borderRight: "1px solid #fef3c7" }}>{row.replyBy || "—"}</td>
                              <td style={{ padding: "10px 14px", color: "var(--text-muted)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", borderRight: "1px solid #fef3c7" }}>{row.remarks || "—"}</td>
                              <td style={{ padding: "10px 14px", color: "var(--text-mid)" }}>{row.addedBy || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

          </main>
        </div>

        {/* ── Submit Confirm Modal ─────────────────────────────────────── */}
        {showConfirm && (
          <div className="overlay" onClick={() => setShowConfirm(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <button className="mclose" onClick={() => setShowConfirm(false)}>✕</button>
              <div style={{ fontSize: 42, textAlign: "center", marginBottom: 12 }}>📤</div>
              <div style={{ fontSize: 21, fontWeight: 800, color: "var(--text)", textAlign: "center", marginBottom: 6 }}>Submit to HOD & Admin?</div>
              <div style={{ fontSize: 13, color: "var(--text-mid)", textAlign: "center", lineHeight: 1.65, marginBottom: 20 }}>
                Submitting completed query file for <strong>{sel?.patientName}</strong> ({sel?.uhid}) to the Head of Department and Admin Management.
              </div>
              <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: 16, marginBottom: 20 }}>
                {QUERY_COLUMNS.filter(c => queryForm[c.key]).map(col => (
                  <div key={col.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0", fontSize: 13, borderBottom: "1px solid var(--border)" }}>
                    <span style={{ color: "var(--success)", fontWeight: 700, flexShrink: 0 }}>✓</span>
                    <span style={{ color: "var(--text-mid)", minWidth: 120 }}>{col.label}:</span>
                    <span style={{ color: "var(--text)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{queryForm[col.key]}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button onClick={() => setShowConfirm(false)} style={{ padding: "10px 22px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: "var(--surface-2)", border: "1.5px solid var(--border)", color: "var(--text-mid)", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                <button className="qhodbtn" onClick={handleSubmit}>Confirm & Submit</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Toasts ───────────────────────────────────────────────────── */}
        <div className="twrp">
          {toasts.map(t => (
            <div key={t.id} className={"tst " + t.type}>{t.type === "s" ? "✓" : "✗"} {t.msg}</div>
          ))}
        </div>

      </div>
    </>
  );
}