import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { apiService } from "../services/apiService";
import ThemeModeDock from "../components/ui/ThemeModeDock";
import { Hospital, LogOut, ClipboardList, Save, Users, ChevronRight, X } from "lucide-react";

// ── Columns ────────────────────────────────────────────────────────────────────
const COLUMNS = [
  { key: "sNo",         label: "S.No.",        width: 60,  readOnly: true },
  { key: "uhid",        label: "UHID",         width: 130 },
  { key: "claimId",     label: "Claim ID",     width: 130 },
  
  { key: "patientName", label: "Patient Name", width: 180 },
  { key: "RaiseDate",     label: "Raise Date",     width: 130, type: "date" },
  { key: "Query rep Date",  label: "Query rep Date",  width: 130, type: "date" },
  { key: "hospital",    label: "Hospital",     width: 160 },
  { key: "JustifyBy",   label: "Justify By",   width: 140 },
  { key: "Reply by",       label: "Reply by",      width: 120 },
  { key: "remarks",     label: "Remarks",      width: 200 },
  { key: "addedBy",     label: "Added By",     width: 130 },
];

const DEPARTMENT = "Query";
const accent     = "var(--accent)";

// ── Helpers ────────────────────────────────────────────────────────────────────
const blankRow = (sNo) => ({
  id: crypto.randomUUID(),
  sNo,
  uhid: "", claimId: "", opdNo: "", patientName: "",
  RaiseDate: "", Query: new Date().toISOString().slice(0, 10),
  hospital: "", JustifyBy: "", Reply: "", remarks: "", addedBy: "",
  createdAt: new Date().toISOString(),
});

function todayStr()   { return new Date().toISOString().slice(0, 10); }
function weekRange()  { const now = new Date(); const day = now.getDay(); const mon = new Date(now); mon.setDate(now.getDate() - ((day + 6) % 7)); const sun = new Date(mon); sun.setDate(mon.getDate() + 6); return { start: mon.toISOString().slice(0, 10), end: sun.toISOString().slice(0, 10) }; }
function monthRange() { const now = new Date(); return { start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10), end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10) }; }
function yearRange()  { const y = new Date().getFullYear(); return { start: `${y}-01-01`, end: `${y}-12-31` }; }
function entryDate(e) { return e.uploadDate || e.createdAt?.slice(0, 10) || e.opdDate || ""; }
function fmtDt(d)     { if (!d) return "—"; return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }

// ── Map patients from backend ──────────────────────────────────────────────────
function mapPatient(record) {
  const adm            = Array.isArray(record.admissions) && record.admissions.length ? record.admissions[0] : record;
  const patient        = Array.isArray(record.admissions) && record.admissions.length ? record : record;
  const discharge      = adm.discharge      || {};
  const billing        = adm.billing        || {};
  const medicalHistory = adm.medicalHistory || {};
  return {
    id:           record.id  || adm.id  || "",
    uhid:         patient.uhid        || adm.uhid        || "",
    admNo:        adm.admNo           || adm.id          || "",
    patientName:  patient.patientName || patient.name    || adm.patientName || "Unknown",
    age:          patient.ageYY       || patient.age     || adm.age         || "—",
    gender:       patient.gender      || adm.gender      || "",
    phone:        patient.phone       || adm.phone       || "",
    address:      patient.address     || adm.address     || "",
    doa:          discharge.doa       || adm.dateTime    || adm.doa         || "",
    dod:          discharge.dod       || adm.dod         || "",
    ward:         discharge.wardName  || adm.wardName    || "",
    bed:          discharge.bedNo     || adm.bedNo       || "",
    doctor:       discharge.doctorName|| adm.doctorName  || medicalHistory.treatingDoctor || "",
    diagnosis:    discharge.diagnosis || medicalHistory.provisionalDiagnosis || "",
    claimId:      billing.claimId     || patient.claimId || "",
    panel:        billing.panel       || patient.panel   || "CASH",
    insuranceType:billing.insuranceType || "",
    tpaInfo:      billing.tpaInfo     || {},
    printStatus:  billing.printStatus || "PENDING",
    branch:       patient.branch      || adm.branch      || "",
  };
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function QueryDashboard({ currentUser, onLogout }) {
  const today = todayStr();

  // Entry / Records state
  const [allEntries,  setAllEntries]  = useState([]);
  const [rows,        setRows]        = useState(() => Array.from({ length: 10 }, (_, i) => blankRow(i + 1)));
  const [filterMode]  = useState("today");
  const [customStart] = useState(today);
  const [customEnd]   = useState(today);
  const [viewTab,     setViewTab]     = useState("entry");
  const [savedAt,     setSavedAt]     = useState(null);
  const [hasUnsaved,  setHasUnsaved]  = useState(false);
  const [syncError,   setSyncError]   = useState("");

  // Patients tab state
  const [patients,        setPatients]        = useState([]);
  const [patLoading,      setPatLoading]       = useState(false);
  const [patError,        setPatError]         = useState("");
  const [selectedPatient, setSelectedPatient]  = useState(null);
  const [patSearch,       setPatSearch]        = useState("");

  // ── Load OPD logs ────────────────────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setSyncError("");
        const response = await apiService.getDepartmentLogs(DEPARTMENT);
        const normalized = (Array.isArray(response) ? response : []).map((entry, i) => ({
          id: entry.id ? `opd-${entry.id}` : crypto.randomUUID(),
          ...entry.data,
          createdAt: entry.data?.createdAt || `${entry.record_date}T00:00:00`,
          sNo: i + 1,
        }));
        if (!active) return;
        setAllEntries(normalized);
        const todayRows = normalized.filter(e => entryDate(e) === today);
        setRows(todayRows.length
          ? todayRows.map((e, i) => ({ ...e, sNo: i + 1 }))
          : Array.from({ length: 10 }, (_, i) => blankRow(i + 1))
        );
      } catch {
        if (!active) return;
       setSyncError("Unable to load saved Query logs.");
      }
    })();
    return () => { active = false; };
  }, [today]);

  // ── Load patients when Patients tab opens ────────────────────────────────────
  useEffect(() => {
    if (viewTab !== "patients") return;
    let active = true;

    const load = async () => {
      setPatLoading(true);
      setPatError("");
      try {
        // The backend automatically filters and returns ONLY the patients assigned to this specific OPD staff!
        const response = await apiService.getPatients();
        const records = Array.isArray(response) ? response : (response.results || Object.values(response || {}).flat());

        if (!active) return;
        
        // Directly map the patients using the OPD mapper
        setPatients(records.map(mapPatient));
      } catch (err) {
        if (!active) return;
        setPatError("Unable to load patients. Please try again.");
      } finally {
        if (active) setPatLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, [viewTab]);

  // ── Row ops ──────────────────────────────────────────────────────────────────
  const updateRow = (rowId, key, val) => {
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, [key]: val } : r));
    setHasUnsaved(true);
  };
  const addRows = (count = 5) => {
    setRows(prev => { const start = prev.length + 1; return [...prev, ...Array.from({ length: count }, (_, i) => blankRow(start + i))]; });
  };
  const removeRow = (rowId) => {
    setRows(prev => prev.filter(r => r.id !== rowId).map((r, i) => ({ ...r, sNo: i + 1 })));
    setHasUnsaved(true);
  };

  // ── Auto-fill from patient ───────────────────────────────────────────────────
  const fillRowFromPatient = (p) => {
    const emptyIdx = rows.findIndex(r => !r.uhid && !r.patientName && !r.claimId);
    const prefilled = {
      id:          emptyIdx >= 0 ? rows[emptyIdx].id : crypto.randomUUID(),
      sNo:         emptyIdx >= 0 ? rows[emptyIdx].sNo : rows.length + 1,
      uhid:        p.uhid        || "",
      claimId:     p.claimId     || "",
      opdNo:       p.admNo       || "",
      patientName: p.patientName || "",
      opdDate:     p.doa ? p.doa.slice(0, 10) : "",
      uploadDate:  today,
      hospital:    p.branch      || "",
      prepareBy:   p.doctor      || "",
      remarks:     p.diagnosis   || "",
      addedBy:     currentUser?.name || "",
      createdAt:   new Date().toISOString(),
    };
    if (emptyIdx >= 0) {
      setRows(prev => prev.map((r, i) => i === emptyIdx ? prefilled : r));
    } else {
      setRows(prev => [...prev, prefilled]);
    }
    setHasUnsaved(true);
    setSelectedPatient(null);
    setViewTab("entry");
  };

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const filled = rows
      .filter(r => r.uhid || r.claimId || r.opdNo || r.patientName)
      .map((row, i) => ({
        ...row, sNo: i + 1,
        QueryDate: row.QueryDate || today,
        addedBy:    row.addedBy    || currentUser?.name || "",
        createdAt:  row.createdAt  || new Date().toISOString(),
      }));
    if (!filled.length) return;
    try {
      setSyncError("");
      await apiService.saveDepartmentLogs(DEPARTMENT, filled);
      setAllEntries(prev => [...prev.filter(e => entryDate(e) !== today), ...filled]);
      setSavedAt(new Date().toLocaleTimeString());
      setHasUnsaved(false);
    } catch {
      setSyncError("Save failed. Query logs were not synced.");
    }
  };

  // ── Filtered entries ─────────────────────────────────────────────────────────
  const filteredEntries = (() => {
    let start, end;
    if      (filterMode === "today")  { start = today; end = today; }
    else if (filterMode === "week")   { ({ start, end } = weekRange()); }
    else if (filterMode === "month")  { ({ start, end } = monthRange()); }
    else if (filterMode === "year")   { ({ start, end } = yearRange()); }
    else                              { start = customStart; end = customEnd; }
    return allEntries
      .filter(e => { const d = entryDate(e); return d >= start && d <= end; })
      .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
  })();

  // ── Export ────────────────────────────────────────────────────────────────────
  const handleDownload = () => {
    const source = filteredEntries.length
      ? filteredEntries
      : rows.filter(r => r.uhid || r.claimId || r.opdNo || r.patientName);
    if (!source.length) return;
    const data = source.map((row, i) => ({
      "S.No.":        i + 1,
      "UHID":         row.uhid        || "",
      "Claim ID":     row.claimId     || "",
      "OPD No.":      row.opdNo       || "",
      "Patient Name": row.patientName || "",
      "Raise Date":     row.RaiseDate     || "",
      "Query Date":  row.QueryDate  || "",
      "Hospital":     row.hospital    || "",
      "Justify By":   row.JustifyBy   || "",
      "Reply":      row.Reply     || "",
      "Remarks":      row.remarks     || "",
      "Added By":     row.addedBy     || "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = [
      { wch: 6 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 22 },
      { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 15 }, { wch: 24 }, { wch: 14 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Query Log");
    XLSX.writeFile(wb, `Sangi_Query_${filterMode}_${today}.xlsx`);
  };

  // ── Keyboard nav ─────────────────────────────────────────────────────────────
  const handleKeyDown = (e, rowIdx, colKey) => {
    const editableCols = COLUMNS.filter(c => !c.readOnly).map(c => c.key);
    const colIdx = editableCols.indexOf(colKey);
    if (e.key === "Tab") {
      e.preventDefault();
      const next = e.shiftKey ? colIdx - 1 : colIdx + 1;
      if (next >= 0 && next < editableCols.length) document.getElementById(`cell-${rowIdx}-${editableCols[next]}`)?.focus();
      else if (!e.shiftKey && rowIdx < rows.length - 1) document.getElementById(`cell-${rowIdx + 1}-${editableCols[0]}`)?.focus();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (rowIdx < rows.length - 1) document.getElementById(`cell-${rowIdx + 1}-${colKey}`)?.focus();
      else { addRows(1); setTimeout(() => document.getElementById(`cell-${rowIdx + 1}-${colKey}`)?.focus(), 50); }
    }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────────
  const todayCount  = allEntries.filter(e => entryDate(e) === today).length;
  const weekCount   = (() => { const { start, end } = weekRange();  return allEntries.filter(e => { const d = entryDate(e); return d >= start && d <= end; }).length; })();
  const monthCount  = (() => { const { start, end } = monthRange(); return allEntries.filter(e => { const d = entryDate(e); return d >= start && d <= end; }).length; })();
  const filledToday = rows.filter(r => r.uhid || r.claimId || r.opdNo || r.patientName).length;

  const filteredPatients = patients.filter(p => {
    if (!patSearch.trim()) return true;
    const q = patSearch.toLowerCase();
    return p.patientName.toLowerCase().includes(q) || p.uhid.toLowerCase().includes(q) ||
           (p.claimId || "").toLowerCase().includes(q) || (p.doctor || "").toLowerCase().includes(q);
  });

  // ─── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:"var(--bg)", color:"var(--text)", fontFamily:"var(--ui-font-sans)", overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background:var(--surface-2); }
        ::-webkit-scrollbar-thumb { background:var(--border-strong); border-radius:3px; }
        .ogrid-cell:focus { outline:2px solid var(--accent); outline-offset:-2px; background:var(--accent-soft) !important; z-index:2; position:relative; }
        .ogrid-cell { transition:background 0.1s; font-family:var(--ui-font-sans); }
        .ogrid-cell:hover { background:var(--surface-2) !important; }
        .otab-btn:hover { color:var(--accent) !important; background:var(--accent-soft) !important; }
        .ofilter-chip:hover { border-color:var(--accent) !important; color:var(--accent) !important; background:var(--accent-soft) !important; }
        .oaction-btn:hover { filter:brightness(1.08); transform:translateY(-1px); }
        .orow-remove { opacity:0; transition:opacity 0.15s; }
        tr:hover .orow-remove { opacity:1; }
        tr:hover td { background:var(--surface-2) !important; }
        @keyframes ofadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        .ofade-in { animation:ofadeIn 0.3s ease; }
        @keyframes opulse { 0%,100%{opacity:1}50%{opacity:.4} }
        .opt-card { background:var(--card); border:1.5px solid #fecdd3; border-radius:12px; overflow:hidden; transition:box-shadow 0.18s,transform 0.18s; cursor:pointer; }
        .opt-card:hover { box-shadow:0 6px 24px #f8717118; transform:translateY(-2px); border-color:var(--accent); }
        .opt-card-hdr { background:linear-gradient(135deg,#9f1239,#be123c); padding:14px 18px; }
        .opt-card-body { padding:14px 18px; }
        .odrawer-overlay { position:fixed; inset:0; background:rgba(0,0,0,.45); z-index:500; display:flex; justify-content:flex-end; }
        .odrawer { width:460px; max-width:95vw; height:100%; background:var(--card); overflow-y:auto; box-shadow:-8px 0 40px rgba(0,0,0,.2); display:flex; flex-direction:column; }
        .odrawer-hdr { background:linear-gradient(135deg,#9f1239,#be123c); padding:20px 24px; display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-shrink:0; }
        .odrawer-body { flex:1; overflow-y:auto; padding:20px 24px; }
        .ofield-row { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:14px; }
        .ofield-row.full { grid-template-columns:1fr; }
        .ofield-group { display:flex; flex-direction:column; gap:4px; }
        .ofield-label { font-size:9px; font-weight:700; color:#9ca3af; text-transform:uppercase; letter-spacing:.07em; }
        .ofield-value { font-size:13px; color:var(--text); font-weight:600; background:var(--bg); border:1px solid #fecdd3; border-radius:8px; padding:8px 12px; min-height:36px; }
        .ostat-badge { display:flex; align-items:center; gap:5px; padding:5px 11px; border-radius:16px; font-size:11px; white-space:nowrap; flex-shrink:0; }
      `}</style>

      {/* ══════════════════════ TOPBAR ══════════════════════ */}
      <header style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 20px", height:62,
        borderBottom:"2px solid var(--border)", background:"var(--card)",
        flexShrink:0, boxShadow:"var(--shadow-sm)", gap:16, minWidth:0,
      }}>
        {/* Left: brand — never shrinks */}
        <div style={{ display:"flex", alignItems:"center", gap:14, flexShrink:0 }}>
          <div style={{ width:38, height:38, borderRadius:10, background:"var(--hdr-chip-bg)", border:"1px solid var(--hdr-chip-border)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--hdr-text)", boxShadow:"var(--shadow-sm)", flexShrink:0 }}>
            <Hospital size={18} strokeWidth={2.1} />
          </div>
          <div>
            <div style={{ fontSize:9, letterSpacing:"4px", color:"var(--text-muted)", textTransform:"uppercase", fontWeight:500 }}>Sangi Hospital</div>
            <div style={{ fontSize:16, fontWeight:700, color:"var(--text)", letterSpacing:"-0.3px", whiteSpace:"nowrap" }}>Query Department</div>
          </div>
          <div style={{ padding:"4px 12px", borderRadius:20, background:"var(--accent-soft)", border:`1.5px solid ${accent}`, fontSize:10, color:accent, fontWeight:600, flexShrink:0 }}>
            {today}
          </div>
        </div>

        {/* Center: stats — compress gracefully */}
        <div style={{ display:"flex", alignItems:"center", gap:6, flex:1, justifyContent:"center", minWidth:0, overflow:"hidden" }}>
          {[
            { label:"Today",      val:todayCount,  col:"var(--success)" },
            { label:"This Week",  val:weekCount,   col:accent },
            { label:"This Month", val:monthCount,  col:"var(--warning)" },
          ].map(({ label, val, col }) => (
            <div key={label} className="ostat-badge" style={{ background:`${col}12`, border:`1.5px solid ${col}40` }}>
              <span style={{ color:col, fontWeight:700 }}>{val}</span>
              <span style={{ color:"var(--text-muted)", fontWeight:600 }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Right: theme + user — never shrinks */}
        <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
          <ThemeModeDock variant="inline" />
          {currentUser && (
            <div style={{ display:"flex", alignItems:"center", gap:8, paddingLeft:12, borderLeft:"2px solid var(--border)" }}>
              <div style={{ width:32, height:32, borderRadius:8, background:`${accent}20`, border:`1.5px solid ${accent}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color:accent, fontWeight:700, flexShrink:0 }}>
                {currentUser.name?.[0] || "O"}
              </div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:12, color:"var(--text)", fontWeight:700, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:120 }}>{currentUser.name}</div>
                <div style={{ fontSize:9, color:"var(--text-muted)", letterSpacing:"1.5px", textTransform:"uppercase" }}>OPD Staff</div>
              </div>
              <button onClick={onLogout} style={{ padding:"5px 12px", borderRadius:8, background:"var(--danger-soft)", border:"1.5px solid var(--danger-border)", color:"var(--danger)", fontSize:10, cursor:"pointer", fontFamily:"var(--ui-font-sans)", fontWeight:700, display:"inline-flex", alignItems:"center", gap:5, flexShrink:0 }}>
                <LogOut size={12} strokeWidth={2.1} /> Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ══════════════════════ SUB-NAV ══════════════════════ */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px", height:48, borderBottom:"1.5px solid var(--border)", background:"var(--bg)", flexShrink:0, gap:12 }}>
        <div style={{ display:"flex", gap:2, flexShrink:0 }}>
          {[
            { id:"entry",    label:"Daily Entry", Icon:ClipboardList },
            
            { id:"patients", label:"Patients",    Icon:Users, badge: patients.length > 0 ? patients.length : null },
          ].map(tab => (
            <button key={tab.id} className="otab-btn" onClick={() => setViewTab(tab.id)}
              style={{ padding:"7px 16px", borderRadius:"8px 8px 0 0", fontSize:12, fontFamily:"var(--ui-font-sans)", cursor:"pointer", border:"none", background: viewTab === tab.id ? "var(--surface)" : "transparent", color: viewTab === tab.id ? accent : "var(--text-dim)", borderBottom: viewTab === tab.id ? `3px solid ${accent}` : "3px solid transparent", fontWeight: viewTab === tab.id ? 700 : 600, transition:"all 0.15s", display:"inline-flex", alignItems:"center", gap:6, position:"relative" }}>
              <tab.Icon size={13} strokeWidth={2} />
              {tab.label}
              {tab.badge && (
                <span style={{ background:"var(--warning)", color:"#fff", borderRadius:20, fontSize:9, fontWeight:700, padding:"1px 5px" }}>{tab.badge}</span>
              )}
            </button>
          ))}
        </div>

        <div style={{ display:"flex", gap:8, alignItems:"center", flexShrink:0 }}>
          {viewTab === "entry" && (
            <>
              {syncError && <div style={{ fontSize:10, color:"var(--danger)", fontWeight:600 }}>{syncError}</div>}
              {hasUnsaved && <div style={{ fontSize:10, color:accent, animation:"opulse 2s infinite", fontWeight:600 }}>● Unsaved changes</div>}
              {savedAt && !hasUnsaved && <div style={{ fontSize:10, color:"var(--success)", fontWeight:600 }}>✓ Saved at {savedAt}</div>}
              <button className="oaction-btn" onClick={() => addRows(5)} style={{ padding:"6px 14px", borderRadius:8, fontSize:11, fontFamily:"var(--ui-font-sans)", cursor:"pointer", background:"var(--surface)", border:"1.5px solid var(--border)", color:"var(--text-muted)", fontWeight:600, transition:"all 0.15s" }}>+ 5 Rows</button>
              <button className="oaction-btn" onClick={handleSave} style={{ padding:"6px 18px", borderRadius:8, fontSize:12, fontFamily:"var(--ui-font-sans)", cursor:"pointer", background:`linear-gradient(135deg, ${accent}, var(--accent-strong))`, border:"none", color:"var(--text-on-accent)", fontWeight:700, boxShadow:"var(--shadow-sm)", transition:"all 0.15s", display:"inline-flex", alignItems:"center", gap:6 }}>
                <Save size={13} strokeWidth={2} /> Save
              </button>
              <button className="oaction-btn" onClick={handleDownload} style={{ padding:"6px 14px", borderRadius:8, fontSize:11, fontFamily:"var(--ui-font-sans)", cursor:"pointer", background:"var(--surface-2)", border:"1.5px solid var(--border)", color:"var(--info)", fontWeight:600, transition:"all 0.15s" }}>↓ Export</button>
            </>
          )}
          
        </div>
      </div>

      {/* ══════════════════════ CONTENT ══════════════════════ */}
      <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>

        {/* ═══ ENTRY TAB ═══ */}
        {viewTab === "entry" && (
          <div style={{ flex:1, overflow:"auto", padding:"20px 20px" }} className="ofade-in">
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, padding:"13px 18px", background:"var(--card)", border:`1.5px solid ${accent}40`, borderRadius:12, borderLeft:`5px solid ${accent}`, boxShadow:"0 2px 8px #f8717110" }}>
              <div>
               <div style={{ fontSize:13, fontWeight:700, color:"var(--text)" }}>
  Today's Query Log — {today}
</div>
                <div style={{ fontSize:10, color:"#9ca3af", marginTop:3 }}>{filledToday} of {rows.length} rows filled · Tab to move right · Enter to move down</div>
              </div>
              <div style={{ fontSize:28, fontWeight:700, color:accent }}>{filledToday}</div>
            </div>

            <div style={{ overflowX:"auto", background:"var(--card)", border:"1.5px solid #fecdd3", borderRadius:12, overflow:"hidden", boxShadow:"0 2px 12px #f8717108" }}>
              <table style={{ borderCollapse:"collapse", width:"100%", fontSize:12 }}>
                <thead>
                  <tr style={{ background:"#ffe4e6" }}>
                    {COLUMNS.map(col => (
                      <th key={col.key} style={{ padding:"10px 12px", textAlign:"left", fontSize:9, letterSpacing:"2px", color:"#be123c", textTransform:"uppercase", borderBottom:"2px solid #fecdd3", whiteSpace:"nowrap", minWidth:col.width, fontFamily:"var(--ui-font-sans)", fontWeight:700, borderRight:"1px solid #fecdd3" }}>
                        {col.label}
                      </th>
                    ))}
                    <th style={{ padding:"10px 6px", fontSize:9, color:"#be123c", borderBottom:"2px solid #fecdd3" }} />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIdx) => {
                    const filled = !!(row.uhid || row.claimId || row.opdNo || row.patientName);
                    return (
                      <tr key={row.id} style={{ background: filled ? "#fff1f2" : "#ffffff", borderBottom:"1px solid #ffe4e6" }}>
                        {COLUMNS.map(col => (
                          <td key={col.key} style={{ padding:0, borderRight:"1px solid #ffe4e6" }}>
                            {col.readOnly ? (
                              <div style={{ padding:"9px 12px", color:"#fca5a5", fontSize:11, userSelect:"none" }}>{row[col.key]}</div>
                            ) : (
                              <input
                                id={`cell-${rowIdx}-${col.key}`}
                                className="ogrid-cell"
                                type={col.type || "text"}
                                value={row[col.key] || ""}
                                onChange={e => updateRow(row.id, col.key, e.target.value)}
                                onKeyDown={e => handleKeyDown(e, rowIdx, col.key)}
                                style={{ width:"100%", padding:"9px 12px", background:"transparent", border:"none", color: col.key === "patientName" ? "var(--text)" : "#374151", fontSize:11, fontFamily:"var(--ui-font-sans)", outline:"none", minWidth:col.width, cursor:"text", fontWeight: col.key === "patientName" ? 600 : 400 }}
                                placeholder={col.type === "date" ? "yyyy-mm-dd" : "—"}
                              />
                            )}
                          </td>
                        ))}
                        <td style={{ padding:"0 6px", textAlign:"center" }}>
                          <button className="orow-remove" onClick={() => removeRow(row.id)} style={{ background:"none", border:"none", color:"#ef4444", cursor:"pointer", fontSize:14, padding:"0 4px" }}>✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button onClick={() => addRows(1)} style={{ marginTop:12, padding:"9px 20px", borderRadius:10, background:"transparent", border:`1.5px dashed ${accent}60`, color:accent, fontSize:12, cursor:"pointer", fontFamily:"var(--ui-font-sans)", fontWeight:700, width:"100%" }}>
              + Add Row
            </button>
          </div>
        )}

        

        {/* ═══ PATIENTS TAB ═══ */}
        {viewTab === "patients" && (
          <div style={{ flex:1, overflow:"auto", padding:"20px 20px" }} className="ofade-in">
            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18, padding:"13px 18px", background:"var(--card)", border:`1.5px solid ${accent}40`, borderRadius:12, borderLeft:`5px solid ${accent}`, flexWrap:"wrap", gap:12 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:"var(--text)" }}>Patients from HOD</div>
                <div style={{ fontSize:11, color:"#9ca3af", marginTop:3 }}>Click any patient to view details and auto-fill today's Query entry</div>
              </div>
              <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
                <div style={{ position:"relative" }}>
                  <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:12, color:"#9ca3af", pointerEvents:"none" }}>🔍</span>
                  <input
                    placeholder="Search name, UHID, Claim ID…"
                    value={patSearch}
                    onChange={e => setPatSearch(e.target.value)}
                    style={{ background:"var(--bg)", border:"1.5px solid #fecdd3", color:"var(--text)", padding:"7px 10px 7px 30px", borderRadius:8, fontSize:12, outline:"none", width:230, fontFamily:"var(--ui-font-sans)" }}
                  />
                  {patSearch && <button onClick={() => setPatSearch("")} style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"#9ca3af", cursor:"pointer", fontSize:14, padding:0 }}>×</button>}
                </div>
                <div style={{ padding:"5px 14px", borderRadius:20, background:`${accent}15`, border:`1.5px solid ${accent}`, fontSize:12, color:accent, fontWeight:700 }}>
                  {filteredPatients.length} patient{filteredPatients.length !== 1 ? "s" : ""}
                </div>
              </div>
            </div>

            {patLoading && (
              <div style={{ textAlign:"center", padding:48, color:"#fca5a5", fontSize:13, letterSpacing:"2px", fontWeight:700 }}>LOADING PATIENTS…</div>
            )}
            {patError && !patLoading && (
              <div style={{ textAlign:"center", padding:48, color:"var(--danger)", fontSize:12, background:"var(--danger-soft)", border:"1.5px solid var(--danger-border)", borderRadius:12 }}>{patError}</div>
            )}
            {!patLoading && !patError && filteredPatients.length === 0 && (
              <div style={{ textAlign:"center", padding:60, color:"#fecdd3", fontSize:12, letterSpacing:"3px", background:"var(--card)", border:"1.5px solid #fecdd3", borderRadius:12, fontWeight:700 }}>
                {patSearch ? "NO PATIENTS MATCH YOUR SEARCH" : "NO SUBMITTED PATIENTS FOUND"}
              </div>
            )}

            {!patLoading && !patError && filteredPatients.length > 0 && (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))", gap:14 }}>
                {filteredPatients.map(p => (
                  <div key={`${p.uhid}-${p.admNo}`} className="opt-card" onClick={() => setSelectedPatient(p)}>
                    <div className="opt-card-hdr">
                      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8 }}>
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontSize:14, fontWeight:700, color:"#fff", marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.patientName}</div>
                          <div style={{ fontSize:10, color:"#fda4af", fontFamily:"monospace" }}>{p.uhid} · {p.admNo}</div>
                        </div>
                        <span style={{ padding:"3px 9px", borderRadius:20, fontSize:9, fontWeight:700, background: p.printStatus==="APPROVED" ? "#dcfce7" : "#fef9c3", color: p.printStatus==="APPROVED" ? "#15803d" : "#92400e", whiteSpace:"nowrap", flexShrink:0 }}>
                          {p.printStatus === "APPROVED" ? "✓ Approved" : "⏳ Pending"}
                        </span>
                      </div>
                    </div>
                    <div className="opt-card-body">
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                        {[
                          { label:"Claim ID", val:p.claimId   || "—" },
                          { label:"Panel",    val:p.panel     || "CASH" },
                          { label:"Doctor",   val:p.doctor    || "—" },
                          { label:"Branch",   val:p.branch    || "—" },
                          { label:"DOA",      val:fmtDt(p.doa) },
                          { label:"Ward/Bed", val:`${p.ward || "—"} / ${p.bed || "—"}` },
                        ].map(({ label, val }) => (
                          <div key={label} style={{ display:"flex", flexDirection:"column", gap:2 }}>
                            <div style={{ fontSize:9, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:".07em" }}>{label}</div>
                            <div style={{ fontSize:12, color:"var(--text)", fontWeight:500 }}>{val}</div>
                          </div>
                        ))}
                      </div>
                      {p.diagnosis && (
                        <div style={{ padding:"7px 10px", background:"var(--bg)", border:"1px solid #fecdd3", borderRadius:8, fontSize:11, color:"#374151", marginBottom:10 }}>
                          🩺 <strong style={{ color:"#9f1239" }}>Dx:</strong> {p.diagnosis}
                        </div>
                      )}
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:10, borderTop:"1px solid #fecdd3" }}>
                        <span style={{ fontSize:11, color:"#9ca3af" }}>{p.age} yrs · {p.gender}</span>
                        <div style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:8, background:`${accent}15`, border:`1px solid ${accent}40`, color:accent, fontSize:11, fontWeight:700 }}>
                          Fill Entry <ChevronRight size={12} strokeWidth={2.5} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════ PATIENT DRAWER ══════════════════════ */}
      {selectedPatient && (
        <div className="odrawer-overlay" onClick={() => setSelectedPatient(null)}>
          <div className="odrawer" onClick={e => e.stopPropagation()}>
            <div className="odrawer-hdr">
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:17, fontWeight:700, color:"#fff", marginBottom:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{selectedPatient.patientName}</div>
                <div style={{ fontSize:11, color:"#fda4af", fontFamily:"monospace" }}>{selectedPatient.uhid} · Adm: {selectedPatient.admNo}</div>
                <div style={{ display:"flex", gap:8, marginTop:8, flexWrap:"wrap" }}>
                  <span style={{ padding:"2px 8px", borderRadius:20, background:"rgba(255,255,255,.15)", color:"#fda4af", fontSize:10, fontWeight:600 }}>{selectedPatient.age} yrs · {selectedPatient.gender}</span>
                  <span style={{ padding:"2px 8px", borderRadius:20, fontSize:10, fontWeight:700, background: selectedPatient.printStatus==="APPROVED" ? "#dcfce7" : "#fef9c3", color: selectedPatient.printStatus==="APPROVED" ? "#15803d" : "#92400e" }}>
                    {selectedPatient.printStatus === "APPROVED" ? "✓ HOD Approved" : "⏳ Pending HOD"}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedPatient(null)} style={{ background:"rgba(255,255,255,.15)", border:"1px solid rgba(255,255,255,.25)", color:"#fff", borderRadius:8, width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <X size={15} strokeWidth={2.5} />
              </button>
            </div>

            <div className="odrawer-body">
              {/* Patient Info */}
              <div style={{ fontSize:10, fontWeight:700, color:accent, textTransform:"uppercase", letterSpacing:".08em", marginBottom:10, paddingBottom:6, borderBottom:`1px solid ${accent}30` }}>Patient Information</div>
              <div className="ofield-row">
                {[
                  { label:"UHID",        val:selectedPatient.uhid },
                  { label:"Claim ID",    val:selectedPatient.claimId || "—" },
                  { label:"Patient Name",val:selectedPatient.patientName },
                  { label:"Age / Sex",   val:`${selectedPatient.age} yrs / ${selectedPatient.gender}` },
                  { label:"Phone",       val:selectedPatient.phone || "—" },
                  { label:"Branch",      val:selectedPatient.branch || "—" },
                ].map(({ label, val }) => (
                  <div key={label} className="ofield-group">
                    <div className="ofield-label">{label}</div>
                    <div className="ofield-value">{val}</div>
                  </div>
                ))}
              </div>
              <div className="ofield-row full">
                <div className="ofield-group">
                  <div className="ofield-label">Address</div>
                  <div className="ofield-value" style={{ minHeight:40 }}>{selectedPatient.address || "—"}</div>
                </div>
              </div>

              {/* Admission Details */}
              <div style={{ fontSize:10, fontWeight:700, color:accent, textTransform:"uppercase", letterSpacing:".08em", margin:"16px 0 10px", paddingBottom:6, borderBottom:`1px solid ${accent}30` }}>Admission Details</div>
              <div className="ofield-row">
                {[
                  { label:"DOA",             val:fmtDt(selectedPatient.doa) },
                  { label:"DOD",             val:selectedPatient.dod ? fmtDt(selectedPatient.dod) : "Active" },
                  { label:"Ward",            val:selectedPatient.ward  || "—" },
                  { label:"Bed",             val:selectedPatient.bed   || "—" },
                  { label:"Treating Doctor", val:selectedPatient.doctor || "—" },
                  { label:"Panel",           val:selectedPatient.panel  || "CASH" },
                ].map(({ label, val }) => (
                  <div key={label} className="ofield-group">
                    <div className="ofield-label">{label}</div>
                    <div className="ofield-value">{val}</div>
                  </div>
                ))}
              </div>
              <div className="ofield-row full">
                <div className="ofield-group">
                  <div className="ofield-label">Diagnosis</div>
                  <div className="ofield-value" style={{ minHeight:40 }}>{selectedPatient.diagnosis || "—"}</div>
                </div>
              </div>

              {/* Insurance / TPA */}
              {selectedPatient.insuranceType && selectedPatient.insuranceType !== "Self Pay" && (
                <>
                  <div style={{ fontSize:10, fontWeight:700, color:"#0ea5e9", textTransform:"uppercase", letterSpacing:".08em", margin:"16px 0 10px", paddingBottom:6, borderBottom:"1px solid #bae6fd" }}>Insurance / TPA Details</div>
                  <div className="ofield-row">
                    {[
                      { label:"Insurance Type", val:selectedPatient.insuranceType },
                      { label:"TPA Name",       val:selectedPatient.tpaInfo?.tpaName  || "—" },
                      { label:"Policy No.",     val:selectedPatient.tpaInfo?.policyNo || "—" },
                      { label:"Claim No.",      val:selectedPatient.tpaInfo?.claimNo  || "—" },
                      { label:"Auth No.",       val:selectedPatient.tpaInfo?.authNo   || "—" },
                    ].map(({ label, val }) => (
                      <div key={label} className="ofield-group">
                        <div className="ofield-label">{label}</div>
                        <div className="ofield-value" style={{ borderColor:"#bae6fd", color:"#0369a1" }}>{val}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* CTA */}
              <div style={{ marginTop:24, padding:"16px", background:`${accent}08`, border:`1.5px solid ${accent}30`, borderRadius:12 }}>
                <div style={{ fontSize:12, fontWeight:600, color:"var(--text)", marginBottom:8 }}>📋 Auto-fill Today's OPD Entry</div>
                <div style={{ fontSize:11, color:"#9ca3af", marginBottom:14, lineHeight:1.5 }}>
                  Pre-fills a row with UHID, Claim ID, patient name, DOA, hospital, doctor and diagnosis. You can edit any field after.
                </div>
                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={() => setSelectedPatient(null)} style={{ flex:1, padding:"9px", borderRadius:8, background:"transparent", border:"1.5px solid #fecdd3", color:"#6b7280", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"var(--ui-font-sans)" }}>Cancel</button>
                  <button onClick={() => fillRowFromPatient(selectedPatient)} style={{ flex:2, padding:"9px", borderRadius:8, background:`linear-gradient(135deg, ${accent}, var(--accent-strong))`, border:"none", color:"var(--text-on-accent)", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"var(--ui-font-sans)", display:"inline-flex", alignItems:"center", justifyContent:"center", gap:7 }}>
                    <ClipboardList size={14} strokeWidth={2} /> Fill Entry & Switch to Grid
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
