import { useState, useEffect, useCallback } from "react";
import ThemeModeDock from "../components/ui/ThemeModeDock";

// ── Utilities ──────────────────────────────────────────────────────────────────
function todayStr() { return new Date().toISOString().slice(0, 10); }
function weekRange() {
  const now = new Date(), day = now.getDay();
  const mon = new Date(now); mon.setDate(now.getDate() - ((day + 6) % 7));
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  return { start: mon.toISOString().slice(0, 10), end: sun.toISOString().slice(0, 10) };
}
function monthRange() {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10),
  };
}
function yearRange() {
  const y = new Date().getFullYear();
  return { start: `${y}-01-01`, end: `${y}-12-31` };
}
function fmtDt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const COLOR       = "var(--accent)";
const GLOW        = "var(--accent-border)";
const BG_ACTIVE   = "var(--accent-soft)";
const STORAGE_KEY = "sangi_doctor_v2";
const SUBMIT_KEY  = "sangi_doctor_submitted";
const HOD_ASSIGN_KEY = "sangi_hod_assignments"; // HOD writes patient assignments here

const COLUMNS = [
  { key: "sNo",         label: "S.No.",        width: 55,  readOnly: true },
  { key: "uhid",        label: "UHID",         width: 130 },
  { key: "claimId",     label: "Claim ID",     width: 130 },
  { key: "patientName", label: "Patient Name", width: 180 },
  { key: "doa",         label: "DOA",          width: 125, type: "date" },
  { key: "dod",         label: "DOD",          width: 125, type: "date" },
  { key: "patStay",     label: "Pat. Stay",    width: 100 },
  { key: "hospital",    label: "Hospital",     width: 160 },
  { key: "overView",    label: "OverView",     width: 180 },
  { key: "remarks",     label: "Remarks",      width: 200 },
  { key: "addedBy",     label: "Added By",     width: 130 },
];

// Billing header fields auto-filled from patient data
const BILL_HEADER_FIELDS = [
  { key: "uhid",            label: "UHID",                   icon: "🔑", fromKey: "uhid" },
  { key: "patientName",     label: "Patient Name",           icon: "👤", fromKey: "patientName" },
  { key: "admNo",           label: "IPD / Adm No",          icon: "🏥", fromKey: "admNo" },
  { key: "contactNo",       label: "Contact No",             icon: "📞", fromKey: "phone" },
  { key: "ageSex",          label: "Age / Sex",              icon: "🧬", fromKey: null },
  { key: "wardRoom",        label: "Ward / Room",            icon: "🛏", fromKey: null },
  { key: "doctorName",      label: "Treating Doctor",        icon: "👨‍⚕️", fromKey: "doctor" },
  { key: "doaDisplay",      label: "Date of Admission",      icon: "📅", fromKey: "doa" },
  { key: "dodDisplay",      label: "Date of Discharge",      icon: "📅", fromKey: "dod" },
  { key: "diagnosis",       label: "Diagnosis",              icon: "🩺", fromKey: "diagnosis" },
  { key: "panel",           label: "Panel / Insurance",      icon: "💳", fromKey: "insuranceType" },
  { key: "address",         label: "Address",                icon: "📍", fromKey: "address" },
  { key: "guardianName",    label: "Guardian Name",          icon: "🧑", fromKey: "guardianName" },
  { key: "claimId",         label: "Claim ID",               icon: "📋", fromKey: "claimId" },
];

function makeBlankRow(sNo) {
  return {
    id: crypto.randomUUID(),
    sNo,
    uhid: "",
    claimId: "",
    patientName: "",
    doa: "",
    dod: "",
    patStay: "",
    hospital: "",
    overView: "",
    remarks: "",
    addedBy: "",
    createdAt: new Date().toISOString(),
  };
}

function calcStay(doa, dod) {
  if (!doa || !dod) return "";
  const diff = Math.round((new Date(dod) - new Date(doa)) / 86400000);
  return diff >= 0 ? `${diff}d` : "";
}

function buildBillHeaders(patient) {
  if (!patient) return {};
  const ageSex = [patient.age ? `${patient.age} Yrs` : "", patient.gender || ""].filter(Boolean).join(" / ");
  const wardRoom = [patient.ward || "", patient.bed || ""].filter(Boolean).join(" / ");
  return {
    uhid:         patient.uhid        || "",
    patientName:  patient.patientName || "",
    admNo:        patient.admNo       || "",
    contactNo:    patient.phone       || "",
    ageSex,
    wardRoom,
    doctorName:   patient.doctor      || "",
    doaDisplay:   patient.doa ? fmtDt(patient.doa) : "",
    dodDisplay:   patient.dod ? fmtDt(patient.dod) : "",
    diagnosis:    patient.diagnosis   || "",
    panel:        patient.insuranceType || "CASH",
    address:      patient.address     || "",
    guardianName: patient.guardianName || "",
    claimId:      patient.claimId     || "",
  };
}

export default function DoctorDashboard({ currentUser, onLogout }) {
  const today = todayStr();

  const [allEntries, setAllEntries]   = useState([]);
  const [rows, setRows]               = useState(() => Array.from({ length: 10 }, (_, i) => makeBlankRow(i + 1)));
  const [filterMode, setFilterMode]   = useState("today");
  const [customStart, setCustomStart] = useState(today);
  const [customEnd, setCustomEnd]     = useState(today);
  const [viewTab, setViewTab]         = useState("entry");
  const [savedAt, setSavedAt]         = useState(null);
  const [hasUnsaved, setHasUnsaved]   = useState(false);
  const [loading, setLoading]         = useState(true);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [submittedToday, setSubmittedToday] = useState(false);

  // HOD-assigned patients tab
  const [assignedPatients, setAssignedPatients] = useState([]);
  const [selectedPatient, setSelectedPatient]   = useState(null);
  const [editedBillHeaders, setEditedBillHeaders] = useState({});
  const [billSaved, setBillSaved]               = useState(false);

  // ── Load from storage ──────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY);
        if (res) {
          const data = JSON.parse(res.value);
          const entries = data.allEntries || [];
          setAllEntries(entries);
          const todayRows = entries.filter(e => e.createdAt?.slice(0, 10) === today);
          if (todayRows.length > 0) setRows(todayRows);
        }
        try {
          const subRes = await window.storage.get(SUBMIT_KEY, true);
          if (subRes) {
            const subData = JSON.parse(subRes.value);
            if (subData.lastSubmitDate === today) setSubmittedToday(true);
          }
        } catch {}
        // Load HOD-assigned patients
        try {
          const hodRes = await window.storage.get(HOD_ASSIGN_KEY, true);
          if (hodRes) {
            const hodData = JSON.parse(hodRes.value);
            setAssignedPatients(hodData.patients || []);
          }
        } catch {}
      } catch {}
      setLoading(false);
    })();
  }, [today]);

  const persist = useCallback(async (entries) => {
    try { await window.storage.set(STORAGE_KEY, JSON.stringify({ allEntries: entries })); } catch {}
  }, []);

  // ── Row ops ────────────────────────────────────────────────────────────────
  const updateRow = (rowId, key, val) => {
    setRows(prev => prev.map(r => {
      if (r.id !== rowId) return r;
      const updated = { ...r, [key]: val };
      if (key === "doa" || key === "dod") {
        const stay = calcStay(key === "doa" ? val : r.doa, key === "dod" ? val : r.dod);
        if (stay) updated.patStay = stay;
      }
      return updated;
    }));
    setHasUnsaved(true);
  };

  const addRows = (count = 5) => {
    setRows(prev => {
      const start = prev.length + 1;
      return [...prev, ...Array.from({ length: count }, (_, i) => makeBlankRow(start + i))];
    });
  };

  const removeRow = (rowId) => {
    setRows(prev => prev.filter(r => r.id !== rowId).map((r, i) => ({ ...r, sNo: i + 1 })));
    setHasUnsaved(true);
  };

  // ── Save locally ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    const filled = rows.filter(r => r.claimId || r.uhid || r.patientName);
    if (!filled.length) return;
    const updated = [...allEntries.filter(e => e.createdAt?.slice(0, 10) !== today), ...filled];
    setAllEntries(updated);
    await persist(updated);
    setSavedAt(new Date().toLocaleTimeString());
    setHasUnsaved(false);
  };

  // ── Submit to HOD & Admin ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    const filled = rows.filter(r => r.claimId || r.uhid || r.patientName);
    if (!filled.length) { setSubmitStatus("error"); setTimeout(() => setSubmitStatus(null), 2500); return; }
    setSubmitStatus("sending");
    try {
      const updated = [...allEntries.filter(e => e.createdAt?.slice(0, 10) !== today), ...filled];
      setAllEntries(updated);
      await persist(updated);
      let existingShared = [];
      try {
        const sharedRes = await window.storage.get(SUBMIT_KEY, true);
        if (sharedRes) {
          const parsed = JSON.parse(sharedRes.value);
          existingShared = parsed.submissions || [];
        }
      } catch {}
      const todaySubmission = {
        date: today,
        submittedAt: new Date().toISOString(),
        submittedBy: currentUser?.name || "Doctor",
        department: "Doctor",
        records: filled.map((r, i) => ({ ...r, sNo: i + 1 })),
        recordCount: filled.length,
      };
      const withoutToday = existingShared.filter(s => s.date !== today);
      const newShared = [...withoutToday, todaySubmission];
      await window.storage.set(SUBMIT_KEY, JSON.stringify({
        lastSubmitDate: today,
        submissions: newShared,
      }), true);
      setSavedAt(new Date().toLocaleTimeString());
      setHasUnsaved(false);
      setSubmittedToday(true);
      setSubmitStatus("done");
      setTimeout(() => setSubmitStatus(null), 3000);
    } catch {
      setSubmitStatus("error");
      setTimeout(() => setSubmitStatus(null), 3000);
    }
  };

  // ── Select patient → auto-fill bill headers ───────────────────────────────
  const openPatient = (patient) => {
    setSelectedPatient(patient);
    setEditedBillHeaders(buildBillHeaders(patient));
    setBillSaved(false);
  };

  const saveBillHeaders = async () => {
    if (!selectedPatient) return;
    try {
      const key = `sangi_bill_headers_${selectedPatient.uhid}_${selectedPatient.admNo || ""}`;
      await window.storage.set(key, JSON.stringify(editedBillHeaders));
      setBillSaved(true);
      setTimeout(() => setBillSaved(false), 3000);
    } catch {}
  };

  // ── Filtered records ──────────────────────────────────────────────────────
  const filteredEntries = (() => {
    let start, end;
    if (filterMode === "today")      { start = today; end = today; }
    else if (filterMode === "week")  { ({ start, end } = weekRange()); }
    else if (filterMode === "month") { ({ start, end } = monthRange()); }
    else if (filterMode === "year")  { ({ start, end } = yearRange()); }
    else                             { start = customStart; end = customEnd; }
    return allEntries
      .filter(e => { const d = e.createdAt?.slice(0, 10) || ""; return d >= start && d <= end; })
      .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
  })();

  // ── Keyboard nav ──────────────────────────────────────────────────────────
  const handleKeyDown = (e, ri, colKey) => {
    const editable = COLUMNS.filter(c => !c.readOnly).map(c => c.key);
    const ci = editable.indexOf(colKey);
    if (e.key === "Tab") {
      e.preventDefault();
      const next = e.shiftKey ? ci - 1 : ci + 1;
      if (next >= 0 && next < editable.length) document.getElementById(`dc_${ri}_${editable[next]}`)?.focus();
      else if (!e.shiftKey && ri < rows.length - 1) document.getElementById(`dc_${ri + 1}_${editable[0]}`)?.focus();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (ri < rows.length - 1) document.getElementById(`dc_${ri + 1}_${colKey}`)?.focus();
      else { addRows(1); setTimeout(() => document.getElementById(`dc_${ri + 1}_${colKey}`)?.focus(), 60); }
    }
  };

  const todayCount  = allEntries.filter(e => e.createdAt?.slice(0, 10) === today).length;
  const weekCount   = (() => { const { start, end } = weekRange(); return allEntries.filter(e => { const d = e.createdAt?.slice(0,10)||""; return d >= start && d <= end; }).length; })();
  const monthCount  = (() => { const { start, end } = monthRange(); return allEntries.filter(e => { const d = e.createdAt?.slice(0,10)||""; return d >= start && d <= end; }).length; })();
  const filledToday = rows.filter(r => r.claimId || r.uhid || r.patientName).length;

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"var(--bg)", color:COLOR, fontSize:14, fontFamily:"var(--ui-font-sans)" }}>
      Loading…
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:"var(--bg)", color:"var(--text)", fontFamily:"var(--ui-font-sans)", overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-thumb { background:var(--border-strong); border-radius:4px; }
        .dc_cell:focus { outline:2px solid ${COLOR}; outline-offset:-2px; background:${BG_ACTIVE} !important; }
        .dc_cell:hover { background:var(--surface-2) !important; }
        .dc_cell { transition:background 0.1s; color:var(--text-mid); font-family:'JetBrains Mono',monospace; font-size:12px; }
        .dc_row_rm { opacity:0; transition:opacity 0.15s; }
        tr:hover .dc_row_rm { opacity:1; }
        .dc_tr:hover > td { background:var(--surface-2) !important; }
        @keyframes dcup { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none} }
        .dc_fade { animation:dcup 0.25s ease both; }
        @keyframes blink { 0%,100%{opacity:1}50%{opacity:0.3} }
        .btn_hover:hover { filter:brightness(1.12); transform:translateY(-1px); }
        .btn_hover { transition:all 0.15s; }
        .chip_hover:hover { border-color:${COLOR} !important; color:${COLOR} !important; }
        .pat_card:hover { border-color:${COLOR} !important; box-shadow:0 4px 18px var(--shadow-sm); transform:translateY(-2px); }
        .pat_card { transition:all 0.18s; }
        .bill_field:focus { border-color:${COLOR} !important; background:var(--surface) !important; }
        .bill_field { transition:border-color 0.15s, background 0.15s; }
      `}</style>

      {/* ── Topbar ── */}
      <header style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 20px", height:64, borderBottom:"1px solid var(--border)",
        background:"var(--surface)", flexShrink:0, gap:12,
      }}>
        {/* Left: Logo + Title + Date chip */}
        <div style={{ display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
          <div style={{ width:40, height:40, borderRadius:11, background:`${COLOR}20`, border:`2px solid ${COLOR}55`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>
            🩺
          </div>
          <div style={{ flexShrink:0 }}>
            <div style={{ fontSize:10, fontWeight:600, color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"2.5px", lineHeight:1 }}>Sangi Hospital</div>
            <div style={{ fontSize:16, fontWeight:700, color:"var(--text)", letterSpacing:"-0.3px", marginTop:2, lineHeight:1.2 }}>Doctor Dashboard</div>
          </div>
          <div style={{ padding:"4px 12px", borderRadius:20, background:`${COLOR}18`, border:`1px solid ${COLOR}45`, fontSize:11, fontWeight:600, color:COLOR, fontFamily:"'JetBrains Mono',monospace", flexShrink:0 }}>
            {today}
          </div>
        </div>

        {/* Center: Stats */}
        <div style={{ display:"flex", alignItems:"center", gap:8, flex:1, justifyContent:"center", minWidth:0 }}>
          {[
            { lbl:"Today",  val:todayCount,  col:"var(--success)" },
            { lbl:"Week",   val:weekCount,   col:COLOR },
            { lbl:"Month",  val:monthCount,  col:"var(--warning)" },
          ].map(({ lbl, val, col }) => (
            <div key={lbl} style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:20, background:"var(--surface-2)", border:"1px solid var(--border-strong)", fontSize:12, flexShrink:0 }}>
              <span style={{ color:col, fontWeight:700, fontSize:14, fontFamily:"'JetBrains Mono',monospace" }}>{val}</span>
              <span style={{ color:"var(--text-muted)", fontWeight:500 }}>{lbl}</span>
            </div>
          ))}
        </div>

        {/* Right: Theme + User + Logout */}
        <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
          <ThemeModeDock variant="inline" />
          {currentUser && (
            <div style={{ display:"flex", alignItems:"center", gap:8, paddingLeft:12, borderLeft:"1px solid var(--border)" }}>
              <div style={{ width:32, height:32, borderRadius:9, background:`${COLOR}25`, border:`2px solid ${COLOR}50`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, color:COLOR, fontWeight:700, flexShrink:0 }}>
                {currentUser.name?.[0]?.toUpperCase() || "D"}
              </div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:13, color:"var(--text)", fontWeight:600, whiteSpace:"nowrap" }}>{currentUser.name}</div>
                <div style={{ fontSize:10, color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"1px", fontWeight:500 }}>Doctor</div>
              </div>
              <button onClick={onLogout} className="btn_hover"
                style={{ marginLeft:2, padding:"6px 12px", borderRadius:7, background:"var(--danger-soft)", border:"1px solid var(--danger-border)", color:"var(--danger)", fontSize:11, cursor:"pointer", fontFamily:"inherit", fontWeight:600, whiteSpace:"nowrap" }}>
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Sub-nav ── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px", height:52, borderBottom:"1px solid var(--border)", background:"var(--surface)", flexShrink:0 }}>
        <div style={{ display:"flex", gap:2 }}>
          {[
            { id:"entry",    label:"📋 Daily Entry" },
            { id:"records",  label:"🗂 Records" },
            { id:"patients", label:"🏥 My Patients", badge: assignedPatients.length },
          ].map(tab => (
            <button key={tab.id} onClick={() => setViewTab(tab.id)}
              style={{ padding:"8px 18px", borderRadius:"7px 7px 0 0", fontSize:13, fontFamily:"inherit", cursor:"pointer", border:"none", background: viewTab===tab.id ? "var(--bg)" : "transparent", color: viewTab===tab.id ? COLOR : "var(--text-muted)", borderBottom: viewTab===tab.id ? `2px solid ${COLOR}` : "2px solid transparent", fontWeight: viewTab===tab.id ? 600 : 400, transition:"all 0.15s", display:"flex", alignItems:"center", gap:6 }}>
              {tab.label}
              {tab.badge > 0 && (
                <span style={{ background:COLOR, color:"var(--text-on-accent)", borderRadius:20, fontSize:10, fontWeight:700, padding:"1px 6px" }}>{tab.badge}</span>
              )}
            </button>
          ))}
        </div>

        {viewTab === "entry" && (
          <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"nowrap" }}>
            {hasUnsaved && <span style={{ fontSize:12, color:"var(--warning)", fontWeight:600, animation:"blink 2s infinite", whiteSpace:"nowrap" }}>● Unsaved</span>}
            {savedAt && !hasUnsaved && <span style={{ fontSize:12, color:"var(--success)", fontWeight:500, whiteSpace:"nowrap" }}>✓ Saved {savedAt}</span>}
            <button onClick={() => addRows(5)} className="btn_hover"
              style={{ padding:"7px 14px", borderRadius:7, fontSize:12, fontFamily:"inherit", cursor:"pointer", background:"var(--surface-2)", border:"1px solid var(--border-strong)", color:"var(--text-muted)", fontWeight:500, whiteSpace:"nowrap" }}>
              + 5 Rows
            </button>
            <button onClick={handleSave} className="btn_hover"
              style={{ padding:"7px 16px", borderRadius:7, fontSize:12, fontFamily:"inherit", cursor:"pointer", background:"var(--border)", border:`1px solid ${COLOR}40`, color:COLOR, fontWeight:600, whiteSpace:"nowrap" }}>
              💾 Save Draft
            </button>
            <button onClick={handleSubmit} className="btn_hover" disabled={submitStatus === "sending"}
              style={{
                padding:"7px 18px", borderRadius:7, fontSize:12, fontFamily:"inherit",
                cursor: submitStatus==="sending" ? "wait" : "pointer",
                background: submitStatus==="done" ? "var(--success-soft)" : submitStatus==="error" ? "var(--danger-soft)" : COLOR,
                border: submitStatus ? "1px solid var(--border)" : "none",
                color: submitStatus==="done" ? "var(--success)" : submitStatus==="error" ? "var(--danger)" : "var(--text-on-accent)",
                fontWeight:700, boxShadow: submitStatus ? "none" : `0 0 14px ${GLOW}`,
                opacity: submitStatus==="sending" ? 0.7 : 1, whiteSpace:"nowrap",
              }}>
              {submitStatus === "sending" ? "⟳ Submitting…"
               : submitStatus === "done"  ? "✓ Submitted"
               : submitStatus === "error" ? "✗ Nothing to submit"
               : submittedToday           ? "↻ Re-submit"
               : "📤 Submit to HOD"}
            </button>
          </div>
        )}
      </div>

      {/* ── Submission notice banner ── */}
      {submittedToday && viewTab === "entry" && (
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 20px", background:"var(--success-soft)", borderBottom:"1px solid var(--success-border)", flexShrink:0 }}>
          <span style={{ fontSize:15 }}>✅</span>
          <span style={{ fontSize:12, color:"var(--success)", fontWeight:600 }}>Today&apos;s records submitted to HOD & Admin</span>
          <span style={{ fontSize:11, color:"var(--text-muted)", marginLeft:4 }}>· You can re-submit anytime to update</span>
        </div>
      )}

      {/* ── Content ── */}
      <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>

        {/* ════ ENTRY TAB ════ */}
        {viewTab === "entry" && (
          <div style={{ flex:1, overflow:"auto", padding:"20px" }} className="dc_fade">
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18, padding:"14px 20px", background:"var(--surface)", border:`1px solid ${COLOR}35`, borderRadius:12, borderLeft:`4px solid ${COLOR}` }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:"var(--text)" }}>Daily Patient Log — {today}</div>
                <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:4, fontWeight:500 }}>
                  <span style={{ color:COLOR, fontWeight:700 }}>{filledToday}</span>
                  <span style={{ color:"var(--text-muted)" }}> of {rows.length} rows filled</span>
                  <span style={{ color:"var(--text-dim)", marginLeft:12 }}>Tab = next column · Enter = next row · DOA + DOD auto-calculates Pat.Stay</span>
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:36, fontWeight:700, color:COLOR, fontFamily:"'JetBrains Mono',monospace", lineHeight:1 }}>{filledToday}</div>
                <div style={{ fontSize:10, color:"var(--text-dim)", marginTop:3, fontWeight:500, textTransform:"uppercase", letterSpacing:"1px" }}>Patients</div>
              </div>
            </div>

            <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, overflow:"hidden" }}>
              <div style={{ overflowX:"auto" }}>
                <table style={{ borderCollapse:"collapse", width:"100%", minWidth:"max-content" }}>
                  <thead>
                    <tr style={{ background:"var(--surface-2)" }}>
                      {COLUMNS.map(col => (
                        <th key={col.key} style={{ padding:"12px 14px", textAlign:"left", fontSize:10, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"1.2px", borderBottom:"2px solid var(--border)", whiteSpace:"nowrap", minWidth:col.width, fontFamily:"'DM Sans',sans-serif", borderRight:"1px solid var(--border)" }}>
                          {col.label}
                          {col.key === "uhid" && <span style={{ marginLeft:5, padding:"1px 6px", borderRadius:4, background:`${COLOR}25`, color:COLOR, fontSize:9, fontWeight:700, letterSpacing:"0.5px" }}>KEY</span>}
                          {col.key === "patStay" && <span style={{ marginLeft:5, fontSize:9, color:"var(--text-dim)", fontWeight:400 }}>auto</span>}
                        </th>
                      ))}
                      <th style={{ padding:"12px 8px", borderBottom:"2px solid var(--border)", width:34 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, ri) => {
                      const filled = !!(row.claimId || row.uhid || row.patientName);
                      return (
                        <tr key={row.id} className="dc_tr" style={{ background: filled ? "var(--surface-2)" : "transparent", borderBottom:"1px solid var(--border)" }}>
                          {COLUMNS.map(col => (
                            <td key={col.key} style={{ padding:0, borderRight:"1px solid var(--border)" }}>
                              {col.readOnly ? (
                                <div style={{ padding:"9px 14px", color:"var(--text-dim)", fontSize:12, fontWeight:600, fontFamily:"'JetBrains Mono',monospace", userSelect:"none" }}>{row[col.key]}</div>
                              ) : col.key === "patStay" ? (
                                <input id={`dc_${ri}_${col.key}`} className="dc_cell" type="text" value={row[col.key] || ""} onChange={e => updateRow(row.id, col.key, e.target.value)} onKeyDown={e => handleKeyDown(e, ri, col.key)}
                                  style={{ width:"100%", padding:"9px 14px", background:"transparent", border:"none", color:"var(--info)", fontSize:12, fontFamily:"'JetBrains Mono',monospace", outline:"none", minWidth:col.width, textAlign:"center", fontWeight:600 }} placeholder="—"/>
                              ) : (
                                <input id={`dc_${ri}_${col.key}`} className="dc_cell" type={col.type || "text"} value={row[col.key] || ""} onChange={e => updateRow(row.id, col.key, e.target.value)} onKeyDown={e => handleKeyDown(e, ri, col.key)}
                                  style={{ width:"100%", padding:"9px 14px", background:"transparent", border:"none", color: col.key==="patientName"?"var(--text)":col.key==="claimId"?COLOR:col.key==="uhid"?"var(--text-mid)":col.key==="overView"?"var(--accent)":"var(--text-mid)", fontSize:12, fontFamily:"'JetBrains Mono',monospace", outline:"none", minWidth:col.width, fontWeight:col.key==="patientName"?600:col.key==="uhid"?500:400 }}
                                  placeholder={col.type === "date" ? "yyyy-mm-dd" : ""}/>
                              )}
                            </td>
                          ))}
                          <td style={{ padding:"0 6px", textAlign:"center" }}>
                            <button className="dc_row_rm" onClick={() => removeRow(row.id)} style={{ background:"none", border:"none", color:"var(--danger)", cursor:"pointer", fontSize:14, padding:"2px 5px" }}>✕</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <button onClick={() => addRows(1)} style={{ marginTop:10, padding:"10px 20px", borderRadius:10, background:"transparent", border:`1.5px dashed ${COLOR}30`, color:COLOR, fontSize:12, cursor:"pointer", fontFamily:"inherit", width:"100%", fontWeight:600, letterSpacing:"0.5px" }}>
              + Add Row
            </button>

            {filledToday > 0 && !submittedToday && (
              <div style={{ marginTop:16, padding:"14px 20px", background:"var(--warning-soft)", border:"1px solid var(--warning-border)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:"var(--warning)" }}>Don&apos;t forget to submit today&apos;s records</div>
                  <div style={{ fontSize:11, color:"var(--text-mid)", marginTop:2 }}>{filledToday} record{filledToday !== 1 ? "s" : ""} ready · HOD & Admin are waiting</div>
                </div>
                <button onClick={handleSubmit} className="btn_hover" style={{ padding:"8px 20px", borderRadius:8, fontSize:13, fontFamily:"inherit", cursor:"pointer", background:COLOR, border:"none", color:"var(--text-on-accent)", fontWeight:700, boxShadow:`0 0 16px ${GLOW}` }}>
                  Submit Now →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ════ RECORDS TAB ════ */}
        {viewTab === "records" && (
          <div style={{ flex:1, overflow:"auto", padding:"20px" }} className="dc_fade">
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20, padding:"14px 20px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, flexWrap:"wrap" }}>
              <span style={{ fontSize:11, fontWeight:700, color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"1.5px", marginRight:4 }}>Period</span>
              {[{id:"today",lbl:"Today"},{id:"week",lbl:"Week"},{id:"month",lbl:"Month"},{id:"year",lbl:"Year"},{id:"custom",lbl:"Custom"}].map(f => (
                <button key={f.id} onClick={() => setFilterMode(f.id)} className="chip_hover"
                  style={{ padding:"6px 16px", borderRadius:20, fontSize:12, fontFamily:"inherit", cursor:"pointer", background: filterMode===f.id ? `${COLOR}20` : "var(--surface-2)", border:`1px solid ${filterMode===f.id ? COLOR : "var(--border-strong)"}`, color: filterMode===f.id ? COLOR : "var(--text-muted)", fontWeight: filterMode===f.id ? 600 : 400, transition:"all 0.15s" }}>
                  {f.lbl}
                </button>
              ))}
              {filterMode === "custom" && (
                <div style={{ display:"flex", alignItems:"center", gap:8, marginLeft:8 }}>
                  <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} style={{ background:"var(--bg)", border:"1px solid var(--border-strong)", color:"var(--text-mid)", padding:"6px 10px", borderRadius:7, fontSize:12, fontFamily:"'JetBrains Mono',monospace", outline:"none" }} />
                  <span style={{ color:"var(--text-dim)" }}>→</span>
                  <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} style={{ background:"var(--bg)", border:"1px solid var(--border-strong)", color:"var(--text-mid)", padding:"6px 10px", borderRadius:7, fontSize:12, fontFamily:"'JetBrains Mono',monospace", outline:"none" }} />
                </div>
              )}
              <div style={{ marginLeft:"auto", padding:"5px 16px", borderRadius:20, background:`${COLOR}18`, border:`1px solid ${COLOR}40`, fontSize:12, color:COLOR, fontWeight:700, fontFamily:"'JetBrains Mono',monospace" }}>
                {filteredEntries.length} records
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:22 }}>
              {[
                { lbl:"Total Records",    val:filteredEntries.length,                                              col:COLOR },
                { lbl:"Unique Patients",  val:new Set(filteredEntries.map(e => e.patientName)).size,               col:"var(--success)" },
                { lbl:"Unique Hospitals", val:new Set(filteredEntries.map(e => e.hospital).filter(Boolean)).size,  col:"var(--warning)" },
                { lbl:"Days Covered",     val:new Set(filteredEntries.map(e => e.createdAt?.slice(0,10))).size,    col:"var(--info)" },
              ].map(({ lbl, val, col }) => (
                <div key={lbl} style={{ background:"var(--surface)", border:"1px solid var(--border)", borderTop:`3px solid ${col}`, borderRadius:12, padding:"16px 20px" }}>
                  <div style={{ fontSize:10, fontWeight:700, color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:10 }}>{lbl}</div>
                  <div style={{ fontSize:34, fontWeight:700, color:col, lineHeight:1, fontFamily:"'JetBrains Mono',monospace" }}>{val}</div>
                </div>
              ))}
            </div>

            {filteredEntries.length === 0 ? (
              <div style={{ textAlign:"center", padding:60, color:"var(--border-strong)", fontSize:14, fontWeight:600, background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12 }}>
                No records found for this period
              </div>
            ) : (
              <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, overflow:"hidden" }}>
                <div style={{ overflowX:"auto" }}>
                  <table style={{ borderCollapse:"collapse", width:"100%", minWidth:"max-content" }}>
                    <thead>
                      <tr style={{ background:"var(--surface-2)" }}>
                        {COLUMNS.map(col => (
                          <th key={col.key} style={{ padding:"11px 14px", textAlign:"left", fontSize:10, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"1px", borderBottom:"2px solid var(--border)", whiteSpace:"nowrap", fontFamily:"'DM Sans',sans-serif", borderRight:"1px solid var(--border)" }}>
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEntries.map((row, i) => (
                        <tr key={row.id||i} className="dc_tr" style={{ borderBottom:"1px solid var(--border)" }}>
                          <td style={{ padding:"10px 14px", color:"var(--text-dim)", fontSize:12, fontFamily:"'JetBrains Mono',monospace", borderRight:"1px solid var(--border)" }}>{i+1}</td>
                          <td style={{ padding:"10px 14px", color:"var(--text-mid)", fontSize:12, fontFamily:"'JetBrains Mono',monospace", fontWeight:500, borderRight:"1px solid var(--border)" }}>{row.uhid || "—"}</td>
                          <td style={{ padding:"10px 14px", color:COLOR, fontSize:12, fontFamily:"'JetBrains Mono',monospace", borderRight:"1px solid var(--border)" }}>{row.claimId || "—"}</td>
                          <td style={{ padding:"10px 14px", color:"var(--text)", fontSize:13, fontWeight:600, borderRight:"1px solid var(--border)" }}>{row.patientName || "—"}</td>
                          <td style={{ padding:"10px 14px", color:"var(--text-muted)", fontSize:11, fontFamily:"'JetBrains Mono',monospace", borderRight:"1px solid var(--border)" }}>{row.doa || "—"}</td>
                          <td style={{ padding:"10px 14px", color:"var(--text-muted)", fontSize:11, fontFamily:"'JetBrains Mono',monospace", borderRight:"1px solid var(--border)" }}>{row.dod || "—"}</td>
                          <td style={{ padding:"10px 14px", borderRight:"1px solid var(--border)" }}>
                            {row.patStay ? <span style={{ padding:"2px 10px", borderRadius:5, background:"var(--info-soft)", color:"var(--info)", fontSize:12, fontFamily:"'JetBrains Mono',monospace", fontWeight:600 }}>{row.patStay}</span> : <span style={{ color:"var(--text-dim)" }}>—</span>}
                          </td>
                          <td style={{ padding:"10px 14px", color:"var(--text-mid)", fontSize:12, borderRight:"1px solid var(--border)" }}>{row.hospital || "—"}</td>
                          <td style={{ padding:"10px 14px", color:"var(--accent)", fontSize:12, maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", borderRight:"1px solid var(--border)" }}>{row.overView || "—"}</td>
                          <td style={{ padding:"10px 14px", color:"var(--text-muted)", fontSize:12, maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", borderRight:"1px solid var(--border)" }}>{row.remarks || "—"}</td>
                          <td style={{ padding:"10px 14px", color:"var(--text-muted)", fontSize:12 }}>{row.addedBy || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════ PATIENTS TAB (HOD-assigned) ════ */}
        {viewTab === "patients" && (
          <div style={{ flex:1, overflow:"auto", padding:"20px" }} className="dc_fade">

            {!selectedPatient ? (
              <>
                {/* Header */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
                  <div>
                    <div style={{ fontSize:18, fontWeight:700, color:"var(--text)", letterSpacing:"-0.3px" }}>My Assigned Patients</div>
                    <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:4 }}>Patients assigned by HOD · Click any patient to view & fill billing headers</div>
                  </div>
                  <div style={{ padding:"6px 16px", borderRadius:20, background:`${COLOR}18`, border:`1px solid ${COLOR}40`, fontSize:12, color:COLOR, fontWeight:700, fontFamily:"'JetBrains Mono',monospace" }}>
                    {assignedPatients.length} patients
                  </div>
                </div>

                {assignedPatients.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"60px 20px", background:"var(--surface)", border:`1.5px dashed ${COLOR}30`, borderRadius:16 }}>
                    <div style={{ fontSize:40, marginBottom:14 }}>🏥</div>
                    <div style={{ fontSize:15, fontWeight:600, color:"var(--text)", marginBottom:6 }}>No patients assigned yet</div>
                    <div style={{ fontSize:13, color:"var(--text-muted)" }}>The HOD will assign patients to you. Check back soon.</div>
                  </div>
                ) : (
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))", gap:14 }}>
                    {assignedPatients.map((p, i) => (
                      <div key={p.uhid || i} className="pat_card"
                        onClick={() => openPatient(p)}
                        style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, padding:"18px 20px", cursor:"pointer" }}>
                        {/* Card top */}
                        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:12, gap:10 }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:15, fontWeight:700, color:"var(--text)", marginBottom:3 }}>{p.patientName || "Unknown Patient"}</div>
                            <div style={{ fontSize:11, color:"var(--text-dim)", fontFamily:"'JetBrains Mono',monospace" }}>{p.uhid} · {p.admNo || "—"}</div>
                          </div>
                          <span style={{ padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:700, background: p.dod ? "var(--info-soft)" : "var(--success-soft)", color: p.dod ? "var(--info)" : "var(--success)", flexShrink:0 }}>
                            {p.dod ? "Discharged" : "Admitted"}
                          </span>
                        </div>

                        {/* Info rows */}
                        <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:14 }}>
                          {[
                            { icon:"👨‍⚕️", val: p.doctor || "—" },
                            { icon:"🩺",  val: p.diagnosis || "—" },
                            { icon:"🛏",   val: [p.ward, p.bed].filter(Boolean).join(" / ") || "—" },
                            { icon:"📞",  val: p.phone || "—" },
                          ].map(({ icon, val }) => (
                            <div key={icon} style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:"var(--text-mid)" }}>
                              <span style={{ fontSize:13, width:18, textAlign:"center", flexShrink:0 }}>{icon}</span>
                              <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{val}</span>
                            </div>
                          ))}
                        </div>

                        {/* DOA / DOD strip */}
                        <div style={{ display:"flex", gap:0, background:"var(--surface-2)", borderRadius:8, border:"1px solid var(--border)", overflow:"hidden", marginBottom:14 }}>
                          {[
                            { lbl:"Admitted",   val: fmtDt(p.doa), col:"var(--text)" },
                            { lbl:"Discharge",  val: p.dod ? fmtDt(p.dod) : "Active", col: p.dod ? "var(--info)" : "var(--success)" },
                            { lbl:"Panel",      val: p.insuranceType || "CASH", col: COLOR },
                          ].map(({ lbl, val, col }, idx) => (
                            <div key={lbl} style={{ flex:1, padding:"8px 10px", borderRight: idx < 2 ? "1px solid var(--border)" : "none" }}>
                              <div style={{ fontSize:9, fontWeight:700, color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:3 }}>{lbl}</div>
                              <div style={{ fontSize:12, fontWeight:700, color:col }}>{val}</div>
                            </div>
                          ))}
                        </div>

                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                          <div style={{ fontSize:11, color:"var(--text-dim)" }}>Age: {p.age || "—"} · {p.gender || "—"}</div>
                          <div style={{ fontSize:11, fontWeight:700, color:COLOR }}>Fill Bill Headers →</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* ── Patient Bill Header Detail View ── */
              <div>
                {/* Back */}
                <button onClick={() => setSelectedPatient(null)}
                  style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"7px 14px", borderRadius:8, background:"var(--surface)", border:"1px solid var(--border)", color:"var(--text-mid)", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", marginBottom:18, transition:"all 0.14s" }}>
                  ← Back to Patients
                </button>

                {/* Patient banner */}
                <div style={{ background:"var(--surface)", border:`1px solid ${COLOR}35`, borderRadius:14, padding:"20px 24px", marginBottom:20, borderLeft:`4px solid ${COLOR}` }}>
                  <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
                    <div>
                      <div style={{ fontSize:22, fontWeight:800, color:"var(--text)", marginBottom:4 }}>{selectedPatient.patientName}</div>
                      <div style={{ fontSize:13, color:"var(--text-mid)", marginBottom:10 }}>
                        UHID: <strong style={{ color:"var(--text)" }}>{selectedPatient.uhid}</strong>
                        {selectedPatient.admNo && <> &nbsp;·&nbsp; Adm: <strong style={{ color:"var(--text)" }}>{selectedPatient.admNo}</strong></>}
                        {selectedPatient.age && <> &nbsp;·&nbsp; {selectedPatient.age} yrs · {selectedPatient.gender}</>}
                        {selectedPatient.phone && <> &nbsp;·&nbsp; {selectedPatient.phone}</>}
                      </div>
                      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                        <span style={{ padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:700, background:`${COLOR}18`, color:COLOR }}>🏥 {selectedPatient.branch || "Sangi Hospital"}</span>
                        <span style={{ padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:700, background: selectedPatient.dod ? "var(--info-soft)" : "var(--success-soft)", color: selectedPatient.dod ? "var(--info)" : "var(--success)" }}>
                          {selectedPatient.dod ? "Discharged" : "Admitted"}
                        </span>
                        {selectedPatient.ward && <span style={{ padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:600, background:"var(--surface-2)", border:"1px solid var(--border)", color:"var(--text-mid)" }}>🛏 {selectedPatient.ward} · {selectedPatient.bed}</span>}
                        {selectedPatient.doctor && <span style={{ padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:600, background:"var(--surface-2)", border:"1px solid var(--border)", color:"var(--text-mid)" }}>👨‍⚕️ {selectedPatient.doctor}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <div style={{ fontSize:10, color:"var(--text-dim)", fontWeight:600, textTransform:"uppercase", letterSpacing:"1px", marginBottom:4 }}>DOA → DOD</div>
                      <div style={{ fontSize:13, fontWeight:700, color:"var(--text)" }}>{fmtDt(selectedPatient.doa)}</div>
                      <div style={{ fontSize:12, color: selectedPatient.dod ? "var(--info)" : "var(--success)", fontWeight:600 }}>
                        {selectedPatient.dod ? fmtDt(selectedPatient.dod) : "Still admitted"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Auto-fill notice */}
                <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 18px", background:"var(--success-soft)", border:"1px solid var(--success-border)", borderRadius:10, marginBottom:20 }}>
                  <span style={{ fontSize:16 }}>⚡</span>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:"var(--success)" }}>Billing headers auto-filled from patient data</div>
                    <div style={{ fontSize:12, color:"var(--text-mid)", marginTop:2 }}>Review and adjust any field below, then save to lock the billing header for this patient.</div>
                  </div>
                </div>

                {/* Billing header form */}
                <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, overflow:"hidden", marginBottom:16 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"15px 22px", borderBottom:"1px solid var(--border)", background:"var(--surface-2)" }}>
                    <div style={{ fontSize:14, fontWeight:700, color:"var(--text)", display:"flex", alignItems:"center", gap:8 }}>
                      🧾 Billing Header — Patient Information
                    </div>
                    <div style={{ fontSize:11, color:"var(--text-dim)" }}>Appears on the printed final bill</div>
                  </div>

                  <div style={{ padding:22 }}>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:16 }}>
                      {BILL_HEADER_FIELDS.map(field => (
                        <div key={field.key} style={{ display:"flex", flexDirection:"column", gap:5, ...(field.key === "address" ? { gridColumn:"1 / -1" } : {}) }}>
                          <label style={{ fontSize:10, fontWeight:700, color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.07em", display:"flex", alignItems:"center", gap:5 }}>
                            <span style={{ fontSize:12 }}>{field.icon}</span> {field.label}
                            {field.fromKey && editedBillHeaders[field.key] && (
                              <span style={{ marginLeft:4, fontSize:9, color:"var(--success)", fontWeight:700 }}>✓ auto</span>
                            )}
                          </label>
                          <input
                            className="bill_field"
                            value={editedBillHeaders[field.key] || ""}
                            onChange={e => setEditedBillHeaders(p => ({ ...p, [field.key]: e.target.value }))}
                            style={{
                              background:"var(--bg)", border:"1.5px solid var(--border)", borderRadius:8,
                              padding:"9px 12px", color:"var(--text)", fontSize:13, fontFamily:"inherit",
                              outline:"none", width:"100%",
                              ...(field.key === "uhid" ? { borderColor:COLOR, fontFamily:"'JetBrains Mono',monospace", fontWeight:700 } : {}),
                            }}
                            placeholder={field.label}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Save button */}
                <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                  <button onClick={saveBillHeaders} className="btn_hover"
                    style={{ padding:"11px 28px", borderRadius:9, fontSize:14, fontFamily:"inherit", cursor:"pointer", background:COLOR, border:"none", color:"var(--text-on-accent)", fontWeight:700, boxShadow:`0 0 18px ${GLOW}` }}>
                    💾 Save Billing Headers
                  </button>
                  {billSaved && (
                    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 18px", borderRadius:9, background:"var(--success-soft)", border:"1px solid var(--success-border)" }}>
                      <span style={{ fontSize:15 }}>✅</span>
                      <span style={{ fontSize:13, color:"var(--success)", fontWeight:600 }}>Headers saved successfully</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
