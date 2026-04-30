import { useState, useEffect, useCallback } from "react";

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

// ── Ocean Blue Palette ─────────────────────────────────────────────────────────
const C = {
  // Sidebar / topbar — deep navy (matches Sangi Hospital screenshot)
  navBg:      "#0a2240",
  topbarBg:   "#0d2a4a",
  navBorder:  "#122840",
  // Content — clean light
  pageBg:     "#f0f4f8",
  card:       "#ffffff",
  cardBorder: "#dde5ef",
  rowHover:   "#f0f6ff",
  theadBg:    "#f8fafc",
  // Primary ocean blue
  primary:    "#1a6eb5",
  primaryDim: "#dbeafe",
  primaryBdr: "#93c5fd",
  primaryGlow:"rgba(26,110,181,0.18)",
  // Text
  text:       "#0f1d2e",
  textSub:    "#3d5a7a",
  textMuted:  "#7a9ab8",
  navText:    "#b8d4f0",
  navMuted:   "#4a7098",
  // Semantic
  success:    "#0e7c5b",
  successDim: "#d1fae5",
  successBdr: "#6ee7b7",
  warning:    "#b45309",
  warningDim: "#fef3c7",
  warningBdr: "#fcd34d",
  danger:     "#c0392b",
  dangerDim:  "#fee2e2",
  dangerBdr:  "#fca5a5",
  blue:       "#1a6eb5",
  blueDim:    "#dbeafe",
  blueBdr:    "#93c5fd",
};

const STORAGE_KEY = "sangi_doctor_v2";
const SUBMIT_KEY  = "sangi_doctor_submitted";

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

function makeBlankRow(sNo) {
  return {
    id: crypto.randomUUID(),
    sNo, uhid: "", claimId: "", patientName: "",
    doa: "", dod: "", patStay: "", hospital: "",
    overView: "", remarks: "", addedBy: "",
    createdAt: new Date().toISOString(),
  };
}

function calcStay(doa, dod) {
  if (!doa || !dod) return "";
  const diff = Math.round((new Date(dod) - new Date(doa)) / 86400000);
  return diff >= 0 ? `${diff}d` : "";
}

export default function DoctorDashboard({ currentUser, onLogout }) {
  const today = todayStr();

  const [allEntries, setAllEntries]     = useState([]);
  const [rows, setRows]                 = useState(() => Array.from({ length: 10 }, (_, i) => makeBlankRow(i + 1)));
  const [filterMode, setFilterMode]     = useState("today");
  const [customStart, setCustomStart]   = useState(today);
  const [customEnd, setCustomEnd]       = useState(today);
  const [viewTab, setViewTab]           = useState("entry");
  const [savedAt, setSavedAt]           = useState(null);
  const [hasUnsaved, setHasUnsaved]     = useState(false);
  const [loading, setLoading]           = useState(true);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [submittedToday, setSubmittedToday] = useState(false);

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
      } catch {}
      setLoading(false);
    })();
  }, []);

  const persist = useCallback(async (entries) => {
    try { await window.storage.set(STORAGE_KEY, JSON.stringify({ allEntries: entries })); } catch {}
  }, []);

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

  const handleSave = async () => {
    const filled = rows.filter(r => r.claimId || r.uhid || r.patientName);
    if (!filled.length) return;
    const updated = [...allEntries.filter(e => e.createdAt?.slice(0, 10) !== today), ...filled];
    setAllEntries(updated);
    await persist(updated);
    setSavedAt(new Date().toLocaleTimeString());
    setHasUnsaved(false);
  };

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
        if (sharedRes) { const parsed = JSON.parse(sharedRes.value); existingShared = parsed.submissions || []; }
      } catch {}
      const todaySubmission = {
        date: today, submittedAt: new Date().toISOString(),
        submittedBy: currentUser?.name || "Doctor", department: "Doctor",
        records: filled.map((r, i) => ({ ...r, sNo: i + 1 })), recordCount: filled.length,
      };
      const newShared = [...existingShared.filter(s => s.date !== today), todaySubmission];
      await window.storage.set(SUBMIT_KEY, JSON.stringify({ lastSubmitDate: today, submissions: newShared }), true);
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
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:C.pageBg, color:C.primary, fontSize:14, fontFamily:"'Segoe UI','DM Sans',sans-serif" }}>
      Loading…
    </div>
  );

  // ── Shared input style for table cells ──
  const cellStyle = (col) => ({
    width:"100%", padding:"9px 14px", background:"transparent", border:"none",
    color: col.key === "patientName" ? C.text
         : col.key === "claimId"     ? C.primary
         : col.key === "uhid"        ? "#1a4a7a"
         : col.key === "overView"    ? C.textSub
         : C.textSub,
    fontSize:12, fontFamily:"'Courier New',monospace", outline:"none", minWidth:col.width,
    fontWeight: col.key === "patientName" ? 600 : col.key === "uhid" ? 500 : 400,
    cursor:"text",
  });

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:C.pageBg, color:C.text, fontFamily:"'Segoe UI','DM Sans',system-ui,sans-serif", overflow:"hidden" }}>
      <style>{`
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-thumb { background:${C.cardBorder}; border-radius:4px; }
        ::-webkit-scrollbar-thumb:hover { background:${C.primaryBdr}; }
        .dc_cell:focus { outline:2px solid ${C.primary}; outline-offset:-2px; background:#eef4ff !important; }
        .dc_cell:hover { background:#f5f9ff !important; }
        .dc_cell { transition:background 0.1s; }
        .dc_row_rm { opacity:0; transition:opacity 0.15s; }
        tr:hover .dc_row_rm { opacity:1; }
        .dc_tr:hover > td { background:${C.rowHover} !important; }
        @keyframes dcup { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none} }
        .dc_fade { animation:dcup 0.25s ease both; }
        @keyframes blink { 0%,100%{opacity:1}50%{opacity:0.4} }
        .btn_hover:hover { filter:brightness(0.94); transform:translateY(-1px); }
        .btn_hover { transition:all 0.15s; }
        .chip_hover:hover { border-color:${C.primary} !important; color:${C.primary} !important; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.3) sepia(1) saturate(2) hue-rotate(185deg); cursor:pointer; }
        .nav-date-input::-webkit-calendar-picker-indicator { filter: invert(0.8) sepia(0.3) saturate(1.5) hue-rotate(185deg); cursor:pointer; }
      `}</style>

      {/* ── Topbar — deep navy matching Sangi Hospital ── */}
      <header style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 26px", height:64, borderBottom:`1px solid ${C.navBorder}`, background:C.navBg, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:42, height:42, borderRadius:12, background:"rgba(26,110,181,0.25)", border:"2px solid rgba(78,163,219,0.5)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, boxShadow:"0 2px 8px rgba(0,0,0,0.25)" }}>
            🩺
          </div>
          <div>
            <div style={{ fontSize:10, fontWeight:600, color:C.navMuted, textTransform:"uppercase", letterSpacing:"2.5px" }}>Sangi Hospital</div>
            <div style={{ fontSize:18, fontWeight:700, color:"#e2f0ff", letterSpacing:"-0.3px", marginTop:1 }}>Doctor Dashboard</div>
          </div>
          <div style={{ marginLeft:6, padding:"4px 14px", borderRadius:20, background:"rgba(26,110,181,0.22)", border:"1px solid rgba(78,163,219,0.4)", fontSize:11, fontWeight:600, color:"#7ec8f5", fontFamily:"'Courier New',monospace" }}>
            {today}
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {[
            { lbl:"Today",  val:todayCount,  col:"#4ade80" },
            { lbl:"Week",   val:weekCount,   col:"#7ec8f5" },
            { lbl:"Month",  val:monthCount,  col:"#fbbf24" },
          ].map(({ lbl, val, col }) => (
            <div key={lbl} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:20, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", fontSize:12 }}>
              <span style={{ color:col, fontWeight:700, fontSize:15, fontFamily:"'Courier New',monospace" }}>{val}</span>
              <span style={{ color:C.navMuted, fontWeight:500 }}>{lbl}</span>
            </div>
          ))}

          {currentUser && (
            <div style={{ display:"flex", alignItems:"center", gap:9, marginLeft:8, paddingLeft:14, borderLeft:"1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ width:34, height:34, borderRadius:10, background:"rgba(26,110,181,0.3)", border:"2px solid rgba(78,163,219,0.5)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, color:"#7ec8f5", fontWeight:700 }}>
                {currentUser.name?.[0]?.toUpperCase() || "D"}
              </div>
              <div>
                <div style={{ fontSize:13, color:"#e2f0ff", fontWeight:600 }}>{currentUser.name}</div>
                <div style={{ fontSize:10, color:C.navMuted, textTransform:"uppercase", letterSpacing:"1px", fontWeight:500 }}>Doctor</div>
              </div>
              <button onClick={onLogout} className="btn_hover"
                style={{ marginLeft:4, padding:"6px 14px", borderRadius:7, background:C.dangerDim, border:`1px solid ${C.dangerBdr}`, color:C.danger, fontSize:11, cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Sub-nav ── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 26px", height:52, borderBottom:`1px solid ${C.navBorder}`, background:C.topbarBg, flexShrink:0 }}>
        <div style={{ display:"flex", gap:2 }}>
          {[{ id:"entry", label:"📋 Daily Entry" }, { id:"records", label:"🗂 Records" }].map(tab => (
            <button key={tab.id} onClick={() => setViewTab(tab.id)}
              style={{ padding:"8px 22px", borderRadius:"7px 7px 0 0", fontSize:13, fontFamily:"inherit", cursor:"pointer", border:"none",
                background: viewTab===tab.id ? C.pageBg : "transparent",
                color: viewTab===tab.id ? C.primary : C.navMuted,
                borderBottom: viewTab===tab.id ? `2px solid ${C.primary}` : "2px solid transparent",
                fontWeight: viewTab===tab.id ? 600 : 400, transition:"all 0.15s" }}>
              {tab.label}
            </button>
          ))}
        </div>

        {viewTab === "entry" && (
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {hasUnsaved && <span style={{ fontSize:12, color:C.warning, fontWeight:600, animation:"blink 2s infinite" }}>● Unsaved changes</span>}
            {savedAt && !hasUnsaved && <span style={{ fontSize:12, color:C.success, fontWeight:500 }}>✓ Saved {savedAt}</span>}

            <button onClick={() => addRows(5)} className="btn_hover"
              style={{ padding:"7px 16px", borderRadius:7, fontSize:12, fontFamily:"inherit", cursor:"pointer", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", color:C.navText, fontWeight:500 }}>
              + 5 Rows
            </button>

            <button onClick={handleSave} className="btn_hover"
              style={{ padding:"7px 20px", borderRadius:7, fontSize:13, fontFamily:"inherit", cursor:"pointer", background:C.blueDim, border:`1px solid ${C.blueBdr}`, color:C.primary, fontWeight:600 }}>
              💾 Save Draft
            </button>

            <button onClick={handleSubmit} className="btn_hover" disabled={submitStatus === "sending"}
              style={{
                padding:"7px 22px", borderRadius:7, fontSize:13, fontFamily:"inherit",
                cursor: submitStatus==="sending" ? "wait" : "pointer",
                background: submitStatus==="done"  ? C.successDim
                          : submitStatus==="error" ? C.dangerDim
                          : C.primary,
                border: submitStatus==="done"  ? `1px solid ${C.successBdr}`
                      : submitStatus==="error" ? `1px solid ${C.dangerBdr}`
                      : "none",
                color: submitStatus==="done"  ? C.success
                     : submitStatus==="error" ? C.danger
                     : "#ffffff",
                fontWeight:700,
                boxShadow: submitStatus ? "none" : `0 2px 12px ${C.primaryGlow}`,
                opacity: submitStatus==="sending" ? 0.7 : 1,
                minWidth:190,
              }}>
              {submitStatus === "sending" ? "⟳ Submitting…"
               : submitStatus === "done"  ? "✓ Submitted to HOD & Admin"
               : submitStatus === "error" ? "✗ Nothing to submit"
               : submittedToday           ? "↻ Re-submit to HOD & Admin"
               : "📤 Submit to HOD & Admin"}
            </button>
          </div>
        )}
      </div>

      {/* ── Submission banner ── */}
      {submittedToday && viewTab === "entry" && (
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 26px", background:C.successDim, borderBottom:`1px solid ${C.successBdr}`, flexShrink:0 }}>
          <span style={{ fontSize:16 }}>✅</span>
          <span style={{ fontSize:12, color:C.success, fontWeight:600 }}>Today's records have been submitted to HOD & Admin Management</span>
          <span style={{ fontSize:11, color:"#6ee7b7", marginLeft:4 }}>· You can re-submit anytime to update</span>
        </div>
      )}

      {/* ── Content ── */}
      <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column", background:C.pageBg }}>

        {/* ════ ENTRY TAB ════ */}
        {viewTab === "entry" && (
          <div style={{ flex:1, overflow:"auto", padding:"20px 26px" }} className="dc_fade">

            {/* Banner */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18, padding:"14px 22px", background:C.card, border:`1px solid ${C.cardBorder}`, borderRadius:12, borderLeft:`4px solid ${C.primary}`, boxShadow:"0 1px 4px rgba(0,60,120,0.07)" }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:C.text }}>Daily Patient Log — {today}</div>
                <div style={{ fontSize:12, color:C.textMuted, marginTop:4, fontWeight:500 }}>
                  <span style={{ color:C.primary, fontWeight:700 }}>{filledToday}</span>
                  <span style={{ color:C.textSub }}> of {rows.length} rows filled</span>
                  <span style={{ color:C.textMuted, marginLeft:12 }}>Tab = next column · Enter = next row · DOA + DOD auto-calculates Pat.Stay</span>
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:36, fontWeight:700, color:C.primary, fontFamily:"'Courier New',monospace", lineHeight:1 }}>{filledToday}</div>
                <div style={{ fontSize:10, color:C.textMuted, marginTop:3, fontWeight:600, textTransform:"uppercase", letterSpacing:"1px" }}>Patients</div>
              </div>
            </div>

            {/* Grid */}
            <div style={{ background:C.card, border:`1px solid ${C.cardBorder}`, borderRadius:12, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,60,120,0.06)" }}>
              <div style={{ overflowX:"auto" }}>
                <table style={{ borderCollapse:"collapse", width:"100%", minWidth:"max-content" }}>
                  <thead>
                    <tr style={{ background:C.theadBg }}>
                      {COLUMNS.map(col => (
                        <th key={col.key} style={{ padding:"11px 14px", textAlign:"left", fontSize:9, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:"1.5px", borderBottom:`2px solid ${C.cardBorder}`, whiteSpace:"nowrap", minWidth:col.width, fontFamily:"'Segoe UI',sans-serif", borderRight:`1px solid ${C.cardBorder}` }}>
                          {col.label}
                          {col.key === "uhid" && <span style={{ marginLeft:5, padding:"1px 6px", borderRadius:4, background:C.blueDim, color:C.primary, fontSize:9, fontWeight:700 }}>KEY</span>}
                          {col.key === "patStay" && <span style={{ marginLeft:5, fontSize:9, color:C.textMuted, fontWeight:400 }}>auto</span>}
                        </th>
                      ))}
                      <th style={{ padding:"11px 8px", borderBottom:`2px solid ${C.cardBorder}`, width:34, background:C.theadBg }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, ri) => {
                      const filled = !!(row.claimId || row.uhid || row.patientName);
                      return (
                        <tr key={row.id} className="dc_tr" style={{ background: filled ? "#f5f9ff" : C.card, borderBottom:`1px solid ${C.cardBorder}` }}>
                          {COLUMNS.map(col => (
                            <td key={col.key} style={{ padding:0, borderRight:`1px solid ${C.cardBorder}` }}>
                              {col.readOnly ? (
                                <div style={{ padding:"9px 14px", color:C.textMuted, fontSize:12, fontWeight:600, fontFamily:"'Courier New',monospace", userSelect:"none" }}>{row[col.key]}</div>
                              ) : col.key === "patStay" ? (
                                <input
                                  id={`dc_${ri}_${col.key}`}
                                  className="dc_cell"
                                  type="text"
                                  value={row[col.key] || ""}
                                  onChange={e => updateRow(row.id, col.key, e.target.value)}
                                  onKeyDown={e => handleKeyDown(e, ri, col.key)}
                                  style={{ width:"100%", padding:"9px 14px", background:"transparent", border:"none", color:C.blue, fontSize:12, fontFamily:"'Courier New',monospace", outline:"none", minWidth:col.width, textAlign:"center", fontWeight:700 }}
                                  placeholder="—"
                                />
                              ) : (
                                <input
                                  id={`dc_${ri}_${col.key}`}
                                  className="dc_cell"
                                  type={col.type || "text"}
                                  value={row[col.key] || ""}
                                  onChange={e => updateRow(row.id, col.key, e.target.value)}
                                  onKeyDown={e => handleKeyDown(e, ri, col.key)}
                                  style={cellStyle(col)}
                                  placeholder={col.type === "date" ? "yyyy-mm-dd" : ""}
                                />
                              )}
                            </td>
                          ))}
                          <td style={{ padding:"0 6px", textAlign:"center", background:"transparent" }}>
                            <button className="dc_row_rm" onClick={() => removeRow(row.id)}
                              style={{ background:"none", border:"none", color:C.danger, cursor:"pointer", fontSize:14, padding:"2px 5px" }}>
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <button onClick={() => addRows(1)}
              style={{ marginTop:10, padding:"10px 20px", borderRadius:10, background:"transparent", border:`1.5px dashed ${C.primaryBdr}`, color:C.primary, fontSize:12, cursor:"pointer", fontFamily:"inherit", width:"100%", fontWeight:600, letterSpacing:"0.5px" }}>
              + Add Row
            </button>

            {filledToday > 0 && !submittedToday && (
              <div style={{ marginTop:16, padding:"14px 20px", background:C.warningDim, border:`1px solid ${C.warningBdr}`, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:C.warning }}>Don't forget to submit today's records</div>
                  <div style={{ fontSize:11, color:"#92400e", marginTop:2 }}>{filledToday} record{filledToday !== 1 ? "s" : ""} ready · HOD & Admin are waiting for today's summary</div>
                </div>
                <button onClick={handleSubmit} className="btn_hover"
                  style={{ padding:"8px 22px", borderRadius:8, fontSize:13, fontFamily:"inherit", cursor:"pointer", background:C.primary, border:"none", color:"#ffffff", fontWeight:700, boxShadow:`0 2px 10px ${C.primaryGlow}` }}>
                  Submit Now →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ════ RECORDS TAB ════ */}
        {viewTab === "records" && (
          <div style={{ flex:1, overflow:"auto", padding:"20px 26px" }} className="dc_fade">

            {/* Filter bar */}
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20, padding:"14px 20px", background:C.card, border:`1px solid ${C.cardBorder}`, borderRadius:12, flexWrap:"wrap", boxShadow:"0 1px 4px rgba(0,60,120,0.06)" }}>
              <span style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:"1.5px", marginRight:4 }}>Period</span>
              {[{id:"today",lbl:"Today"},{id:"week",lbl:"Week"},{id:"month",lbl:"Month"},{id:"year",lbl:"Year"},{id:"custom",lbl:"Custom"}].map(f => (
                <button key={f.id} onClick={() => setFilterMode(f.id)} className="chip_hover"
                  style={{ padding:"6px 16px", borderRadius:20, fontSize:12, fontFamily:"inherit", cursor:"pointer",
                    background: filterMode===f.id ? C.blueDim : "#f8fafc",
                    border:`1px solid ${filterMode===f.id ? C.primary : C.cardBorder}`,
                    color: filterMode===f.id ? C.primary : C.textSub,
                    fontWeight: filterMode===f.id ? 600 : 400, transition:"all 0.15s" }}>
                  {f.lbl}
                </button>
              ))}
              {filterMode === "custom" && (
                <div style={{ display:"flex", alignItems:"center", gap:8, marginLeft:8 }}>
                  <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                    style={{ background:"#f8fafc", border:`1px solid ${C.cardBorder}`, color:C.text, padding:"6px 10px", borderRadius:7, fontSize:12, fontFamily:"'Courier New',monospace", outline:"none" }} />
                  <span style={{ color:C.textMuted }}>→</span>
                  <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                    style={{ background:"#f8fafc", border:`1px solid ${C.cardBorder}`, color:C.text, padding:"6px 10px", borderRadius:7, fontSize:12, fontFamily:"'Courier New',monospace", outline:"none" }} />
                </div>
              )}
              <div style={{ marginLeft:"auto", padding:"5px 16px", borderRadius:20, background:C.blueDim, border:`1px solid ${C.blueBdr}`, fontSize:12, color:C.primary, fontWeight:700, fontFamily:"'Courier New',monospace" }}>
                {filteredEntries.length} records
              </div>
            </div>

            {/* Summary cards */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:22 }}>
              {[
                { lbl:"Total Records",    val:filteredEntries.length,                                             col:C.primary },
                { lbl:"Unique Patients",  val:new Set(filteredEntries.map(e => e.patientName)).size,              col:C.success },
                { lbl:"Unique Hospitals", val:new Set(filteredEntries.map(e => e.hospital).filter(Boolean)).size, col:C.warning },
                { lbl:"Days Covered",     val:new Set(filteredEntries.map(e => e.createdAt?.slice(0,10))).size,   col:"#6d28d9" },
              ].map(({ lbl, val, col }) => (
                <div key={lbl} style={{ background:C.card, border:`1px solid ${C.cardBorder}`, borderTop:`3px solid ${col}`, borderRadius:12, padding:"16px 20px", boxShadow:"0 1px 4px rgba(0,60,120,0.06)" }}>
                  <div style={{ fontSize:9, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:"1px", marginBottom:10 }}>{lbl}</div>
                  <div style={{ fontSize:34, fontWeight:700, color:col, lineHeight:1, fontFamily:"'Courier New',monospace" }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Table */}
            {filteredEntries.length === 0 ? (
              <div style={{ textAlign:"center", padding:60, color:C.textMuted, fontSize:14, fontWeight:600, background:C.card, border:`1px solid ${C.cardBorder}`, borderRadius:12 }}>
                No records found for this period
              </div>
            ) : (
              <div style={{ background:C.card, border:`1px solid ${C.cardBorder}`, borderRadius:12, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,60,120,0.06)" }}>
                <div style={{ overflowX:"auto" }}>
                  <table style={{ borderCollapse:"collapse", width:"100%", minWidth:"max-content" }}>
                    <thead>
                      <tr style={{ background:C.theadBg }}>
                        {COLUMNS.map(col => (
                          <th key={col.key} style={{ padding:"11px 14px", textAlign:"left", fontSize:9, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:"1px", borderBottom:`2px solid ${C.cardBorder}`, whiteSpace:"nowrap", fontFamily:"'Segoe UI',sans-serif", borderRight:`1px solid ${C.cardBorder}` }}>
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEntries.map((row, i) => (
                        <tr key={row.id||i} className="dc_tr" style={{ borderBottom:`1px solid ${C.cardBorder}` }}>
                          <td style={{ padding:"10px 14px", color:C.textMuted, fontSize:12, fontFamily:"'Courier New',monospace", borderRight:`1px solid ${C.cardBorder}` }}>{i+1}</td>
                          <td style={{ padding:"10px 14px", color:"#1a4a7a", fontSize:12, fontFamily:"'Courier New',monospace", fontWeight:500, borderRight:`1px solid ${C.cardBorder}` }}>{row.uhid || "—"}</td>
                          <td style={{ padding:"10px 14px", color:C.primary, fontSize:12, fontFamily:"'Courier New',monospace", borderRight:`1px solid ${C.cardBorder}` }}>{row.claimId || "—"}</td>
                          <td style={{ padding:"10px 14px", color:C.text, fontSize:13, fontWeight:600, borderRight:`1px solid ${C.cardBorder}` }}>{row.patientName || "—"}</td>
                          <td style={{ padding:"10px 14px", color:C.textSub, fontSize:11, fontFamily:"'Courier New',monospace", borderRight:`1px solid ${C.cardBorder}` }}>{row.doa || "—"}</td>
                          <td style={{ padding:"10px 14px", color:C.textSub, fontSize:11, fontFamily:"'Courier New',monospace", borderRight:`1px solid ${C.cardBorder}` }}>{row.dod || "—"}</td>
                          <td style={{ padding:"10px 14px", borderRight:`1px solid ${C.cardBorder}` }}>
                            {row.patStay
                              ? <span style={{ padding:"2px 10px", borderRadius:5, background:C.blueDim, color:C.blue, fontSize:12, fontFamily:"'Courier New',monospace", fontWeight:700 }}>{row.patStay}</span>
                              : <span style={{ color:C.textMuted }}>—</span>}
                          </td>
                          <td style={{ padding:"10px 14px", color:C.textSub, fontSize:12, borderRight:`1px solid ${C.cardBorder}` }}>{row.hospital || "—"}</td>
                          <td style={{ padding:"10px 14px", color:C.textSub, fontSize:12, maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", borderRight:`1px solid ${C.cardBorder}` }}>{row.overView || "—"}</td>
                          <td style={{ padding:"10px 14px", color:C.textMuted, fontSize:12, maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", borderRight:`1px solid ${C.cardBorder}` }}>{row.remarks || "—"}</td>
                          <td style={{ padding:"10px 14px", color:C.textMuted, fontSize:12 }}>{row.addedBy || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}