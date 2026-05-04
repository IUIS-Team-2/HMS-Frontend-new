import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { apiService } from "../services/apiService";
import ThemeModeDock from "../components/ui/ThemeModeDock";
import {
  BookOpen, LogOut, ClipboardList, Save,
  Users, ChevronRight, X, RefreshCw,
} from "lucide-react";

// ── Columns ────────────────────────────────────────────────────────────────────
const COLUMNS = [
  { key: "sNo",         label: "S.No.",        width: 60,  readOnly: true },
  { key: "uhid",        label: "UHID",         width: 130 },
  { key: "claimId",     label: "Claim ID",     width: 130 },
  { key: "patientName", label: "Patient Name", width: 180 },
  { key: "noteDate",    label: "Note Date",    width: 130, type: "date" },
  { key: "noteType",    label: "Note Type",    width: 130 },
  { key: "doctor",      label: "Doctor",       width: 150 },
  { key: "ward",        label: "Ward",         width: 110 },
  { key: "diagnosis",   label: "Diagnosis",    width: 180 },
  { key: "noteContent", label: "Note Content", width: 240 },
  { key: "preparedBy",  label: "Prepared By",  width: 140 },
  { key: "addedBy",     label: "Added By",     width: 130 },
];

const NOTE_TYPES = [
  "Progress Note", "Admission Note", "Discharge Note",
  "Nursing Note", "Consultant Note", "Operative Note",
  "ICU Note", "Follow-up Note", "Other",
];

const DEPARTMENT = "notes";

// ── Helpers ────────────────────────────────────────────────────────────────────
const blankRow = (sNo) => ({
  id: crypto.randomUUID(),
  sNo,
  uhid: "", claimId: "", patientName: "",
  noteDate: new Date().toISOString().slice(0, 10),
  noteType: "", doctor: "", ward: "", diagnosis: "",
  noteContent: "", preparedBy: "", addedBy: "",
  createdAt: new Date().toISOString(),
});

function todayStr() { return new Date().toISOString().slice(0, 10); }
function entryDate(e) { return e.noteDate || e.createdAt?.slice(0, 10) || ""; }
function fmtDt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Map patients from backend ──────────────────────────────────────────────────
function mapPatient(record) {
  const adm            = Array.isArray(record.admissions) && record.admissions.length ? record.admissions[0] : record;
  const patient        = record;
  const discharge      = adm.discharge      || {};
  const billing        = adm.billing        || {};
  const medicalHistory = adm.medicalHistory || {};
  return {
    id:            record.id  || adm.id  || "",
    uhid:          patient.uhid        || adm.uhid        || "",
    admNo:         adm.admNo           || adm.id          || "",
    patientName:   patient.patientName || patient.name    || adm.patientName || "Unknown",
    age:           patient.ageYY       || patient.age     || adm.age         || "—",
    gender:        patient.gender      || adm.gender      || "",
    phone:         patient.phone       || adm.phone       || "",
    address:       patient.address     || adm.address     || "",
    doa:           discharge.doa       || adm.dateTime    || adm.doa         || "",
    dod:           discharge.dod       || adm.dod         || "",
    ward:          discharge.wardName  || adm.wardName    || "",
    bed:           discharge.bedNo     || adm.bedNo       || "",
    doctor:        discharge.doctorName|| adm.doctorName  || medicalHistory.treatingDoctor || "",
    diagnosis:     discharge.diagnosis || medicalHistory.provisionalDiagnosis || "",
    claimId:       billing.claimId     || patient.claimId || "",
    panel:         billing.panel       || patient.panel   || "CASH",
    insuranceType: billing.insuranceType || "",
    tpaInfo:       billing.tpaInfo     || {},
    printStatus:   billing.printStatus || "PENDING",
    branch:        patient.branch      || adm.branch      || "",
  };
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function NotesDashboard({ currentUser, onLogout }) {
  const today = todayStr();

  const [allEntries,      setAllEntries]      = useState([]);
  const [rows,            setRows]            = useState(() => Array.from({ length: 10 }, (_, i) => blankRow(i + 1)));
  const [viewTab,         setViewTab]         = useState("entry");
  const [savedAt,         setSavedAt]         = useState(null);
  const [hasUnsaved,      setHasUnsaved]      = useState(false);
  const [syncError,       setSyncError]       = useState("");
  const [patients,        setPatients]        = useState([]);
  const [patLoading,      setPatLoading]      = useState(false);
  const [patError,        setPatError]        = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patSearch,       setPatSearch]       = useState("");

  // ── Load Notes logs ──────────────────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setSyncError("");
        const response = await apiService.getDepartmentLogs(DEPARTMENT);
        const normalized = (Array.isArray(response) ? response : []).map((entry, i) => ({
          id: entry.id ? `notes-${entry.id}` : crypto.randomUUID(),
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
        setSyncError("Unable to load saved notes logs.");
      }
    })();
    return () => { active = false; };
  }, [today]);

  // ── Load patients when Patients tab opens ────────────────────────────────────
  useEffect(() => {
    if (viewTab !== "patients") return;
    let active = true;
    (async () => {
      setPatLoading(true);
      setPatError("");
      try {
        let records = [];
        if (typeof apiService.getSubmittedBillingPatients === "function") {
          records = await apiService.getSubmittedBillingPatients();
        } else if (typeof apiService.getPatients === "function") {
          const all = await apiService.getPatients();
          const arr = Array.isArray(all) ? all : Object.values(all || {}).flat();
          records = arr.filter(r => {
            const adm = Array.isArray(r.admissions) ? r.admissions[0] : r;
            const ps  = adm?.billing?.printStatus || "";
            return ps === "PENDING" || ps === "APPROVED";
          });
        } else if (typeof apiService.getDepartmentPatients === "function") {
          records = await apiService.getDepartmentPatients("notes");
        }
        if (!active) return;
        setPatients((Array.isArray(records) ? records : []).map(mapPatient));
      } catch {
        if (!active) return;
        setPatError("Unable to load patients. Please try again.");
      } finally {
        if (active) setPatLoading(false);
      }
    })();
    return () => { active = false; };
  }, [viewTab]);

  // ── Row ops ──────────────────────────────────────────────────────────────────
  const updateRow = (rowId, key, val) => {
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, [key]: val } : r));
    setHasUnsaved(true);
  };
  const addRows = (count = 5) => {
    setRows(prev => {
      const start = prev.length + 1;
      return [...prev, ...Array.from({ length: count }, (_, i) => blankRow(start + i))];
    });
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
      patientName: p.patientName || "",
      noteDate:    today,
      noteType:    "Progress Note",
      doctor:      p.doctor      || "",
      ward:        p.ward        || "",
      diagnosis:   p.diagnosis   || "",
      noteContent: "",
      preparedBy:  currentUser?.name || "",
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
      .filter(r => r.uhid || r.claimId || r.patientName)
      .map((row, i) => ({
        ...row, sNo: i + 1,
        noteDate:  row.noteDate  || today,
        addedBy:   row.addedBy   || currentUser?.name || "",
        createdAt: row.createdAt || new Date().toISOString(),
      }));
    if (!filled.length) return;
    try {
      setSyncError("");
      await apiService.saveDepartmentLogs(DEPARTMENT, filled);
      setAllEntries(prev => [...prev.filter(e => entryDate(e) !== today), ...filled]);
      setSavedAt(new Date().toLocaleTimeString());
      setHasUnsaved(false);
    } catch {
      setSyncError("Save failed. Notes logs were not synced.");
    }
  };

  // ── Export ────────────────────────────────────────────────────────────────────
  const handleDownload = () => {
    const source = rows.filter(r => r.uhid || r.claimId || r.patientName);
    if (!source.length) return;
    const data = source.map((row, i) => ({
      "S.No.":        i + 1,
      "UHID":         row.uhid        || "",
      "Claim ID":     row.claimId     || "",
      "Patient Name": row.patientName || "",
      "Note Date":    row.noteDate    || "",
      "Note Type":    row.noteType    || "",
      "Doctor":       row.doctor      || "",
      "Ward":         row.ward        || "",
      "Diagnosis":    row.diagnosis   || "",
      "Note Content": row.noteContent || "",
      "Prepared By":  row.preparedBy  || "",
      "Added By":     row.addedBy     || "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = [
      { wch: 6 }, { wch: 14 }, { wch: 14 }, { wch: 22 }, { wch: 12 },
      { wch: 16 }, { wch: 18 }, { wch: 12 }, { wch: 22 }, { wch: 30 },
      { wch: 15 }, { wch: 14 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Notes Log");
    XLSX.writeFile(wb, `Sangi_Notes_${today}.xlsx`);
  };

  // ── Keyboard nav ─────────────────────────────────────────────────────────────
  const handleKeyDown = (e, rowIdx, colKey) => {
    const editableCols = COLUMNS.filter(c => !c.readOnly).map(c => c.key);
    const colIdx = editableCols.indexOf(colKey);
    if (e.key === "Tab") {
      e.preventDefault();
      const next = e.shiftKey ? colIdx - 1 : colIdx + 1;
      if (next >= 0 && next < editableCols.length)
        document.getElementById(`cell-${rowIdx}-${editableCols[next]}`)?.focus();
      else if (!e.shiftKey && rowIdx < rows.length - 1)
        document.getElementById(`cell-${rowIdx + 1}-${editableCols[0]}`)?.focus();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (rowIdx < rows.length - 1)
        document.getElementById(`cell-${rowIdx + 1}-${colKey}`)?.focus();
      else {
        addRows(1);
        setTimeout(() => document.getElementById(`cell-${rowIdx + 1}-${colKey}`)?.focus(), 50);
      }
    }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────────
  const todayCount   = allEntries.filter(e => entryDate(e) === today).length;
  const totalEntries = allEntries.length;
  const filledToday  = rows.filter(r => r.uhid || r.claimId || r.patientName).length;

  const filteredPatients = patients.filter(p => {
    if (!patSearch.trim()) return true;
    const q = patSearch.toLowerCase();
    return (
      p.patientName.toLowerCase().includes(q) ||
      p.uhid.toLowerCase().includes(q) ||
      (p.claimId || "").toLowerCase().includes(q) ||
      (p.doctor  || "").toLowerCase().includes(q)
    );
  });

  const purpleAccent = "#7c3aed";
  const purpleLight  = "#ede9fe";
  const purpleBorder = "#ddd6fe";
  const purpleMid    = "#8b5cf6";
  const purpleDark   = "#6d28d9";
  const purpleText   = "#4c1d95";
  const purpleMuted  = "#a78bfa";

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:"var(--bg)", color:"var(--text)", fontFamily:"var(--ui-font-sans)", overflow:"hidden" }}>
      <style>{`
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background:var(--surface-2); }
        ::-webkit-scrollbar-thumb { background:${purpleBorder}; border-radius:3px; }
        .ngrid-cell:focus { outline:2px solid ${purpleAccent}; outline-offset:-2px; background:${purpleLight} !important; z-index:2; position:relative; }
        .ngrid-cell { transition:background 0.1s; font-family:var(--ui-font-sans); }
        .ngrid-cell:hover { background:var(--surface-2) !important; }
        .ntab-btn:hover { color:${purpleAccent} !important; background:${purpleLight} !important; }
        .naction-btn:hover { filter:brightness(1.08); transform:translateY(-1px); }
        .nrow-remove { opacity:0; transition:opacity 0.15s; }
        tr:hover .nrow-remove { opacity:1; }
        tr:hover td { background:var(--surface-2) !important; }
        @keyframes nfadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        .nfade-in { animation:nfadeIn 0.3s ease; }
        @keyframes npulse { 0%,100%{opacity:1}50%{opacity:.4} }
        .npt-card { background:var(--card); border:1.5px solid ${purpleBorder}; border-radius:12px; overflow:hidden; transition:box-shadow 0.18s,transform 0.18s; cursor:pointer; }
        .npt-card:hover { box-shadow:0 6px 24px ${purpleAccent}20; transform:translateY(-2px); border-color:${purpleAccent}; }
        .npt-card-hdr { background:linear-gradient(135deg,${purpleDark},${purpleMid}); padding:14px 18px; }
        .npt-card-body { padding:14px 18px; }
        .ndrawer-overlay { position:fixed; inset:0; background:rgba(0,0,0,.45); z-index:500; display:flex; justify-content:flex-end; }
        .ndrawer { width:480px; max-width:95vw; height:100%; background:var(--card); overflow-y:auto; box-shadow:-8px 0 40px rgba(0,0,0,.2); display:flex; flex-direction:column; }
        .ndrawer-hdr { background:linear-gradient(135deg,${purpleDark},${purpleMid}); padding:20px 24px; display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-shrink:0; }
        .ndrawer-body { flex:1; overflow-y:auto; padding:20px 24px; }
        .nfield-row { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:14px; }
        .nfield-row.full { grid-template-columns:1fr; }
        .nfield-group { display:flex; flex-direction:column; gap:4px; }
        .nfield-label { font-size:9px; font-weight:700; color:#9ca3af; text-transform:uppercase; letter-spacing:.07em; }
        .nfield-value { font-size:13px; color:var(--text); font-weight:600; background:var(--bg); border:1px solid ${purpleBorder}; border-radius:8px; padding:8px 12px; min-height:36px; }
        .nstat-badge { display:flex; align-items:center; gap:5px; padding:5px 11px; border-radius:16px; font-size:11px; white-space:nowrap; flex-shrink:0; }
        .ntype-sel { background:transparent; border:none; outline:none; width:100%; font-size:11px; font-family:var(--ui-font-sans); color:#374151; cursor:pointer; padding:9px 12px; }
        .ntype-sel:focus { outline:2px solid ${purpleAccent}; }
      `}</style>

      {/* ══ TOPBAR ══ */}
      <header style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px", height:62, borderBottom:`2px solid ${purpleBorder}`, background:"var(--card)", flexShrink:0, boxShadow:"var(--shadow-sm)", gap:16, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:14, flexShrink:0 }}>
          <div style={{ width:38, height:38, borderRadius:10, background:`${purpleAccent}18`, border:`1px solid ${purpleBorder}`, display:"flex", alignItems:"center", justifyContent:"center", color:purpleAccent, flexShrink:0 }}>
            <BookOpen size={18} strokeWidth={2.1} />
          </div>
          <div>
            <div style={{ fontSize:9, letterSpacing:"4px", color:"var(--text-muted)", textTransform:"uppercase", fontWeight:500 }}>Sangi Hospital</div>
            <div style={{ fontSize:16, fontWeight:700, color:"var(--text)", whiteSpace:"nowrap" }}>Notes Department</div>
          </div>
          <div style={{ padding:"4px 12px", borderRadius:20, background:purpleLight, border:`1.5px solid ${purpleBorder}`, fontSize:10, color:purpleAccent, fontWeight:600, flexShrink:0 }}>{today}</div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:6, flex:1, justifyContent:"center", minWidth:0, overflow:"hidden" }}>
          {[
            { label:"Today",         val:todayCount,      col:purpleAccent },
            { label:"Total Entries", val:totalEntries,    col:purpleMid },
            { label:"Patients",      val:patients.length, col:"#10b981" },
          ].map(({ label, val, col }) => (
            <div key={label} className="nstat-badge" style={{ background:`${col}12`, border:`1.5px solid ${col}40` }}>
              <span style={{ color:col, fontWeight:700 }}>{val}</span>
              <span style={{ color:"var(--text-muted)", fontWeight:600 }}>{label}</span>
            </div>
          ))}
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
          <ThemeModeDock variant="inline" />
          {currentUser && (
            <div style={{ display:"flex", alignItems:"center", gap:8, paddingLeft:12, borderLeft:`2px solid ${purpleBorder}` }}>
              <div style={{ width:32, height:32, borderRadius:8, background:`${purpleAccent}20`, border:`1.5px solid ${purpleBorder}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color:purpleAccent, fontWeight:700, flexShrink:0 }}>
                {currentUser.name?.[0] || "N"}
              </div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:12, color:"var(--text)", fontWeight:700, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:120 }}>{currentUser.name}</div>
                <div style={{ fontSize:9, color:"var(--text-muted)", letterSpacing:"1.5px", textTransform:"uppercase" }}>Notes Staff</div>
              </div>
              <button onClick={onLogout} style={{ padding:"5px 12px", borderRadius:8, background:"var(--danger-soft)", border:"1.5px solid var(--danger-border)", color:"var(--danger)", fontSize:10, cursor:"pointer", fontFamily:"var(--ui-font-sans)", fontWeight:700, display:"inline-flex", alignItems:"center", gap:5, flexShrink:0 }}>
                <LogOut size={12} strokeWidth={2.1} /> Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ══ SUB-NAV ══ */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px", height:48, borderBottom:`1.5px solid ${purpleBorder}`, background:"var(--bg)", flexShrink:0, gap:12 }}>
        <div style={{ display:"flex", gap:2 }}>
          {[
            { id:"entry",    label:"Daily Entry", Icon:ClipboardList },
            { id:"patients", label:"Patients",    Icon:Users, badge: patients.length > 0 ? patients.length : null },
          ].map(tab => (
            <button key={tab.id} className="ntab-btn" onClick={() => setViewTab(tab.id)}
              style={{ padding:"7px 16px", borderRadius:"8px 8px 0 0", fontSize:12, fontFamily:"var(--ui-font-sans)", cursor:"pointer", border:"none", background: viewTab===tab.id ? "var(--surface)" : "transparent", color: viewTab===tab.id ? purpleAccent : "var(--text-dim)", borderBottom: viewTab===tab.id ? `3px solid ${purpleAccent}` : "3px solid transparent", fontWeight: viewTab===tab.id ? 700 : 600, transition:"all 0.15s", display:"inline-flex", alignItems:"center", gap:6 }}>
              <tab.Icon size={13} strokeWidth={2} />
              {tab.label}
              {tab.badge && (
                <span style={{ background:purpleMid, color:"#fff", borderRadius:20, fontSize:9, fontWeight:700, padding:"1px 5px" }}>{tab.badge}</span>
              )}
            </button>
          ))}
        </div>

        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {syncError && <div style={{ fontSize:10, color:"var(--danger)", fontWeight:600 }}>{syncError}</div>}
          {hasUnsaved && <div style={{ fontSize:10, color:purpleAccent, animation:"npulse 2s infinite", fontWeight:600 }}>● Unsaved changes</div>}
          {savedAt && !hasUnsaved && <div style={{ fontSize:10, color:"var(--success)", fontWeight:600 }}>✓ Saved at {savedAt}</div>}
          {viewTab === "entry" && (
            <>
              <button className="naction-btn" onClick={() => addRows(5)} style={{ padding:"6px 14px", borderRadius:8, fontSize:11, fontFamily:"var(--ui-font-sans)", cursor:"pointer", background:"var(--surface)", border:`1.5px solid ${purpleBorder}`, color:"var(--text-muted)", fontWeight:600, transition:"all 0.15s" }}>+ 5 Rows</button>
              <button className="naction-btn" onClick={handleSave} style={{ padding:"6px 18px", borderRadius:8, fontSize:12, fontFamily:"var(--ui-font-sans)", cursor:"pointer", background:`linear-gradient(135deg, ${purpleAccent}, ${purpleDark})`, border:"none", color:"#fff", fontWeight:700, boxShadow:"var(--shadow-sm)", transition:"all 0.15s", display:"inline-flex", alignItems:"center", gap:6 }}>
                <Save size={13} strokeWidth={2} /> Save
              </button>
              <button className="naction-btn" onClick={handleDownload} style={{ padding:"6px 14px", borderRadius:8, fontSize:11, fontFamily:"var(--ui-font-sans)", cursor:"pointer", background:"var(--surface-2)", border:`1.5px solid ${purpleBorder}`, color:purpleAccent, fontWeight:600, transition:"all 0.15s" }}>↓ Export</button>
            </>
          )}
          {viewTab === "patients" && (
            <button className="naction-btn" onClick={() => { setViewTab("entry"); setTimeout(() => setViewTab("patients"), 50); }} style={{ padding:"6px 14px", borderRadius:8, fontSize:11, fontFamily:"var(--ui-font-sans)", cursor:"pointer", background:"var(--surface)", border:`1.5px solid ${purpleBorder}`, color:purpleAccent, fontWeight:600, transition:"all 0.15s", display:"inline-flex", alignItems:"center", gap:5 }}>
              <RefreshCw size={12} strokeWidth={2} /> Refresh
            </button>
          )}
        </div>
      </div>

      {/* ══ CONTENT ══ */}
      <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>

        {/* ENTRY TAB */}
        {viewTab === "entry" && (
          <div style={{ flex:1, overflow:"auto", padding:"20px" }} className="nfade-in">
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, padding:"13px 18px", background:"var(--card)", border:`1.5px solid ${purpleAccent}40`, borderRadius:12, borderLeft:`5px solid ${purpleAccent}` }}>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:"var(--text)" }}>Today's Notes Log — {today}</div>
                <div style={{ fontSize:10, color:"#9ca3af", marginTop:3 }}>{filledToday} of {rows.length} rows filled · Tab to move right · Enter to move down</div>
              </div>
              <div style={{ fontSize:28, fontWeight:700, color:purpleAccent }}>{filledToday}</div>
            </div>

            <div style={{ overflowX:"auto", background:"var(--card)", border:`1.5px solid ${purpleBorder}`, borderRadius:12, overflow:"hidden" }}>
              <table style={{ borderCollapse:"collapse", width:"100%", fontSize:12 }}>
                <thead>
                  <tr style={{ background:purpleLight }}>
                    {COLUMNS.map(col => (
                      <th key={col.key} style={{ padding:"10px 12px", textAlign:"left", fontSize:9, letterSpacing:"2px", color:purpleText, textTransform:"uppercase", borderBottom:`2px solid ${purpleBorder}`, whiteSpace:"nowrap", minWidth:col.width, fontFamily:"var(--ui-font-sans)", fontWeight:700, borderRight:`1px solid ${purpleBorder}` }}>
                        {col.label}
                      </th>
                    ))}
                    <th style={{ padding:"10px 6px", borderBottom:`2px solid ${purpleBorder}` }} />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIdx) => {
                    const filled = !!(row.uhid || row.claimId || row.patientName);
                    return (
                      <tr key={row.id} style={{ background: filled ? `${purpleAccent}06` : "#ffffff", borderBottom:`1px solid ${purpleLight}` }}>
                        {COLUMNS.map(col => (
                          <td key={col.key} style={{ padding:0, borderRight:`1px solid ${purpleLight}` }}>
                            {col.readOnly ? (
                              <div style={{ padding:"9px 12px", color:purpleMuted, fontSize:11, userSelect:"none" }}>{row[col.key]}</div>
                            ) : col.key === "noteType" ? (
                              <select
                                id={`cell-${rowIdx}-${col.key}`}
                                className="ntype-sel"
                                value={row[col.key] || ""}
                                onChange={e => updateRow(row.id, col.key, e.target.value)}
                                onKeyDown={e => handleKeyDown(e, rowIdx, col.key)}
                              >
                                <option value="">— select —</option>
                                {NOTE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                            ) : (
                              <input
                                id={`cell-${rowIdx}-${col.key}`}
                                className="ngrid-cell"
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
                          <button className="nrow-remove" onClick={() => removeRow(row.id)} style={{ background:"none", border:"none", color:"#ef4444", cursor:"pointer", fontSize:14, padding:"0 4px" }}>✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button onClick={() => addRows(1)} style={{ marginTop:12, padding:"9px 20px", borderRadius:10, background:"transparent", border:`1.5px dashed ${purpleAccent}60`, color:purpleAccent, fontSize:12, cursor:"pointer", fontFamily:"var(--ui-font-sans)", fontWeight:700, width:"100%" }}>+ Add Row</button>
          </div>
        )}

        {/* PATIENTS TAB */}
        {viewTab === "patients" && (
          <div style={{ flex:1, overflow:"auto", padding:"20px" }} className="nfade-in">
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18, padding:"13px 18px", background:"var(--card)", border:`1.5px solid ${purpleAccent}40`, borderRadius:12, borderLeft:`5px solid ${purpleAccent}`, flexWrap:"wrap", gap:12 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:"var(--text)" }}>Patients from HOD</div>
                <div style={{ fontSize:11, color:"#9ca3af", marginTop:3 }}>Click any patient to view details and auto-fill today's notes entry</div>
              </div>
              <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
                <div style={{ position:"relative" }}>
                  <input
                    placeholder="Search name, UHID, Claim ID…"
                    value={patSearch}
                    onChange={e => setPatSearch(e.target.value)}
                    style={{ background:"var(--bg)", border:`1.5px solid ${purpleBorder}`, color:"var(--text)", padding:"7px 32px 7px 10px", borderRadius:8, fontSize:12, outline:"none", width:230, fontFamily:"var(--ui-font-sans)" }}
                  />
                  {patSearch && (
                    <button onClick={() => setPatSearch("")} style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"#9ca3af", cursor:"pointer", fontSize:16, padding:0, lineHeight:1 }}>×</button>
                  )}
                </div>
                <div style={{ padding:"5px 14px", borderRadius:20, background:purpleLight, border:`1.5px solid ${purpleBorder}`, fontSize:12, color:purpleAccent, fontWeight:700 }}>
                  {filteredPatients.length} patient{filteredPatients.length !== 1 ? "s" : ""}
                </div>
              </div>
            </div>

            {patLoading && <div style={{ textAlign:"center", padding:48, color:purpleMuted, fontSize:13, letterSpacing:"2px", fontWeight:700 }}>LOADING PATIENTS…</div>}
            {patError && !patLoading && <div style={{ textAlign:"center", padding:48, color:"var(--danger)", fontSize:12, background:"var(--danger-soft)", border:"1.5px solid var(--danger-border)", borderRadius:12 }}>{patError}</div>}
            {!patLoading && !patError && filteredPatients.length === 0 && (
              <div style={{ textAlign:"center", padding:60, color:purpleMuted, fontSize:12, letterSpacing:"3px", background:"var(--card)", border:`1.5px solid ${purpleBorder}`, borderRadius:12, fontWeight:700 }}>
                {patSearch ? "NO PATIENTS MATCH YOUR SEARCH" : "NO PATIENTS FOUND"}
              </div>
            )}

            {!patLoading && !patError && filteredPatients.length > 0 && (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))", gap:14 }}>
                {filteredPatients.map(p => (
                  <div key={`${p.uhid}-${p.admNo}`} className="npt-card" onClick={() => setSelectedPatient(p)}>
                    <div className="npt-card-hdr">
                      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8 }}>
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontSize:14, fontWeight:700, color:"#fff", marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.patientName}</div>
                          <div style={{ fontSize:10, color:"#c4b5fd", fontFamily:"monospace" }}>{p.uhid} · {p.admNo}</div>
                        </div>
                        <span style={{ padding:"3px 9px", borderRadius:20, fontSize:9, fontWeight:700, background: p.printStatus==="APPROVED" ? "#dcfce7" : "#fef9c3", color: p.printStatus==="APPROVED" ? "#15803d" : "#92400e", whiteSpace:"nowrap", flexShrink:0 }}>
                          {p.printStatus === "APPROVED" ? "✓ Approved" : "⏳ Pending"}
                        </span>
                      </div>
                    </div>
                    <div className="npt-card-body">
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                        {[
                          { label:"Claim ID", val:p.claimId  || "—" },
                          { label:"Panel",    val:p.panel    || "CASH" },
                          { label:"Doctor",   val:p.doctor   || "—" },
                          { label:"Ward/Bed", val:`${p.ward || "—"} / ${p.bed || "—"}` },
                          { label:"DOA",      val:fmtDt(p.doa) },
                          { label:"Branch",   val:p.branch   || "—" },
                        ].map(({ label, val }) => (
                          <div key={label} style={{ display:"flex", flexDirection:"column", gap:2 }}>
                            <div style={{ fontSize:9, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:".07em" }}>{label}</div>
                            <div style={{ fontSize:12, color:"var(--text)", fontWeight:500 }}>{val}</div>
                          </div>
                        ))}
                      </div>
                      {p.diagnosis && (
                        <div style={{ padding:"7px 10px", background:"var(--bg)", border:`1px solid ${purpleBorder}`, borderRadius:8, fontSize:11, color:"#374151", marginBottom:10 }}>
                          🩺 <strong style={{ color:purpleText }}>Dx:</strong> {p.diagnosis}
                        </div>
                      )}
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:10, borderTop:`1px solid ${purpleBorder}` }}>
                        <span style={{ fontSize:11, color:"#9ca3af" }}>{p.age} yrs · {p.gender}</span>
                        <div style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:8, background:purpleLight, border:`1px solid ${purpleBorder}`, color:purpleAccent, fontSize:11, fontWeight:700 }}>
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

      {/* ══ PATIENT DRAWER ══ */}
      {selectedPatient && (
        <div className="ndrawer-overlay" onClick={() => setSelectedPatient(null)}>
          <div className="ndrawer" onClick={e => e.stopPropagation()}>
            <div className="ndrawer-hdr">
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:17, fontWeight:700, color:"#fff", marginBottom:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{selectedPatient.patientName}</div>
                <div style={{ fontSize:11, color:"#c4b5fd", fontFamily:"monospace" }}>{selectedPatient.uhid} · Adm: {selectedPatient.admNo}</div>
                <div style={{ display:"flex", gap:8, marginTop:8, flexWrap:"wrap" }}>
                  <span style={{ padding:"2px 8px", borderRadius:20, background:"rgba(255,255,255,.15)", color:"#c4b5fd", fontSize:10, fontWeight:600 }}>{selectedPatient.age} yrs · {selectedPatient.gender}</span>
                  <span style={{ padding:"2px 8px", borderRadius:20, fontSize:10, fontWeight:700, background: selectedPatient.printStatus==="APPROVED" ? "#dcfce7" : "#fef9c3", color: selectedPatient.printStatus==="APPROVED" ? "#15803d" : "#92400e" }}>
                    {selectedPatient.printStatus === "APPROVED" ? "✓ HOD Approved" : "⏳ Pending HOD"}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedPatient(null)} style={{ background:"rgba(255,255,255,.15)", border:"1px solid rgba(255,255,255,.25)", color:"#fff", borderRadius:8, width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <X size={15} strokeWidth={2.5} />
              </button>
            </div>

            <div className="ndrawer-body">
              <div style={{ fontSize:10, fontWeight:700, color:purpleAccent, textTransform:"uppercase", letterSpacing:".08em", marginBottom:10, paddingBottom:6, borderBottom:`1px solid ${purpleBorder}` }}>Patient Information</div>
              <div className="nfield-row">
                {[
                  { label:"UHID",         val:selectedPatient.uhid },
                  { label:"Claim ID",     val:selectedPatient.claimId    || "—" },
                  { label:"Patient Name", val:selectedPatient.patientName },
                  { label:"Age / Sex",    val:`${selectedPatient.age} yrs / ${selectedPatient.gender}` },
                  { label:"Phone",        val:selectedPatient.phone      || "—" },
                  { label:"Branch",       val:selectedPatient.branch     || "—" },
                ].map(({ label, val }) => (
                  <div key={label} className="nfield-group">
                    <div className="nfield-label">{label}</div>
                    <div className="nfield-value">{val}</div>
                  </div>
                ))}
              </div>
              <div className="nfield-row full">
                <div className="nfield-group">
                  <div className="nfield-label">Address</div>
                  <div className="nfield-value" style={{ minHeight:40 }}>{selectedPatient.address || "—"}</div>
                </div>
              </div>

              <div style={{ fontSize:10, fontWeight:700, color:purpleAccent, textTransform:"uppercase", letterSpacing:".08em", margin:"16px 0 10px", paddingBottom:6, borderBottom:`1px solid ${purpleBorder}` }}>Admission Details</div>
              <div className="nfield-row">
                {[
                  { label:"DOA",             val:fmtDt(selectedPatient.doa) },
                  { label:"DOD",             val:selectedPatient.dod ? fmtDt(selectedPatient.dod) : "Active" },
                  { label:"Ward",            val:selectedPatient.ward   || "—" },
                  { label:"Bed",             val:selectedPatient.bed    || "—" },
                  { label:"Treating Doctor", val:selectedPatient.doctor || "—" },
                  { label:"Panel",           val:selectedPatient.panel  || "CASH" },
                ].map(({ label, val }) => (
                  <div key={label} className="nfield-group">
                    <div className="nfield-label">{label}</div>
                    <div className="nfield-value">{val}</div>
                  </div>
                ))}
              </div>
              <div className="nfield-row full">
                <div className="nfield-group">
                  <div className="nfield-label">Diagnosis</div>
                  <div className="nfield-value" style={{ minHeight:40 }}>{selectedPatient.diagnosis || "—"}</div>
                </div>
              </div>

              {selectedPatient.insuranceType && selectedPatient.insuranceType !== "Self Pay" && (
                <>
                  <div style={{ fontSize:10, fontWeight:700, color:"#0ea5e9", textTransform:"uppercase", letterSpacing:".08em", margin:"16px 0 10px", paddingBottom:6, borderBottom:"1px solid #bae6fd" }}>Insurance / TPA Details</div>
                  <div className="nfield-row">
                    {[
                      { label:"Insurance Type", val:selectedPatient.insuranceType },
                      { label:"TPA Name",       val:selectedPatient.tpaInfo?.tpaName  || "—" },
                      { label:"Policy No.",     val:selectedPatient.tpaInfo?.policyNo || "—" },
                      { label:"Claim No.",      val:selectedPatient.tpaInfo?.claimNo  || "—" },
                      { label:"Auth No.",       val:selectedPatient.tpaInfo?.authNo   || "—" },
                    ].map(({ label, val }) => (
                      <div key={label} className="nfield-group">
                        <div className="nfield-label">{label}</div>
                        <div className="nfield-value" style={{ borderColor:"#bae6fd", color:"#0369a1" }}>{val}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div style={{ marginTop:24, padding:"16px", background:purpleLight, border:`1.5px solid ${purpleBorder}`, borderRadius:12 }}>
                <div style={{ fontSize:12, fontWeight:600, color:"var(--text)", marginBottom:8 }}>📋 Auto-fill Today's Notes Entry</div>
                <div style={{ fontSize:11, color:"#9ca3af", marginBottom:14, lineHeight:1.5 }}>
                  Pre-fills a row with UHID, Claim ID, patient name, ward, doctor, and diagnosis. Note Type defaults to "Progress Note".
                </div>
                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={() => setSelectedPatient(null)} style={{ flex:1, padding:"9px", borderRadius:8, background:"transparent", border:`1.5px solid ${purpleBorder}`, color:"#6b7280", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"var(--ui-font-sans)" }}>Cancel</button>
                  <button onClick={() => fillRowFromPatient(selectedPatient)} style={{ flex:2, padding:"9px", borderRadius:8, background:`linear-gradient(135deg, ${purpleAccent}, ${purpleDark})`, border:"none", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"var(--ui-font-sans)", display:"inline-flex", alignItems:"center", justifyContent:"center", gap:7 }}>
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