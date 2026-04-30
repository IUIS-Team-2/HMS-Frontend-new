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
    end:   new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10),
  };
}
function yearRange() {
  const y = new Date().getFullYear();
  return { start: `${y}-01-01`, end: `${y}-12-31` };
}

// ── Ocean Blue Config ──────────────────────────────────────────────────────────
const COLOR       = "#2563eb";   // ocean blue — matches Sangi Hospital portal
const COLOR_LIGHT = "#3b82f6";
const COLOR_PALE  = "#dbeafe";
const BG_MAIN     = "#f0f4f8";
const BG_WHITE    = "#ffffff";
const BG_HEADER   = "#1e3a5f";   // deep navy — matches screenshot header
const TEXT_DARK   = "#1e293b";
const TEXT_MID    = "#475569";
const TEXT_LIGHT  = "#94a3b8";
const BORDER      = "#e2e8f0";
const BORDER_MID  = "#cbd5e1";

const STORAGE_KEY = "sangi_nursing_v2";
const SUBMIT_KEY  = "sangi_nursing_submitted";

const COLUMNS = [
  { key: "sNo",         label: "S.No.",        width: 55,  readOnly: true },
  { key: "uhid",        label: "UHID",         width: 130 },
  { key: "claimId",     label: "Claim ID",     width: 130 },
  { key: "ipdNo",       label: "IPD No.",      width: 120 },
  { key: "patientName", label: "Patient Name", width: 180 },
  { key: "dod",         label: "DOD",          width: 125, type: "date" },
  { key: "hospital",    label: "Hospital",     width: 155 },
  { key: "prepareBy",   label: "Prepare By",   width: 135 },
  { key: "patStay",     label: "Pat. Stay",    width: 100 },
  { key: "remarks",     label: "Remarks",      width: 200 },
  { key: "addedBy",     label: "Added By",     width: 130 },
];

function makeBlankRow(sNo) {
  return {
    id: crypto.randomUUID(),
    sNo,
    uhid: "",
    claimId: "",
    ipdNo: "",
    patientName: "",
    dod: "",
    hospital: "",
    prepareBy: "",
    patStay: "",
    remarks: "",
    addedBy: "",
    createdAt: new Date().toISOString(),
  };
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function NursingDashboard({ currentUser, onLogout }) {
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
  const [submitStatus, setSubmitStatus]   = useState(null);
  const [submittedToday, setSubmittedToday] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY);
        if (res) {
          const data    = JSON.parse(res.value);
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
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, [key]: val } : r));
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

  const isFilled = (r) => !!(r.claimId || r.uhid || r.ipdNo || r.patientName);

  const handleSave = async () => {
    const filled = rows.filter(isFilled);
    if (!filled.length) return;
    const updated = [...allEntries.filter(e => e.createdAt?.slice(0, 10) !== today), ...filled];
    setAllEntries(updated);
    await persist(updated);
    setSavedAt(new Date().toLocaleTimeString());
    setHasUnsaved(false);
  };

  const handleSubmit = async () => {
    const filled = rows.filter(isFilled);
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
        submittedBy: currentUser?.name || "Nursing Staff",
        department: "Nursing",
        records: filled.map((r, i) => ({ ...r, sNo: i + 1 })),
        recordCount: filled.length,
      };

      const withoutToday = existingShared.filter(s => s.date !== today);
      await window.storage.set(SUBMIT_KEY, JSON.stringify({
        lastSubmitDate: today,
        submissions: [...withoutToday, todaySubmission],
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
      if (next >= 0 && next < editable.length) document.getElementById(`ns_${ri}_${editable[next]}`)?.focus();
      else if (!e.shiftKey && ri < rows.length - 1) document.getElementById(`ns_${ri + 1}_${editable[0]}`)?.focus();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (ri < rows.length - 1) document.getElementById(`ns_${ri + 1}_${colKey}`)?.focus();
      else { addRows(1); setTimeout(() => document.getElementById(`ns_${ri + 1}_${colKey}`)?.focus(), 60); }
    }
  };

  const todayCount  = allEntries.filter(e => e.createdAt?.slice(0, 10) === today).length;
  const weekCount   = (() => { const { start, end } = weekRange(); return allEntries.filter(e => { const d = e.createdAt?.slice(0,10)||""; return d>=start&&d<=end; }).length; })();
  const monthCount  = (() => { const { start, end } = monthRange(); return allEntries.filter(e => { const d = e.createdAt?.slice(0,10)||""; return d>=start&&d<=end; }).length; })();
  const filledToday = rows.filter(isFilled).length;

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:BG_MAIN, color:COLOR, fontSize:14, fontFamily:"'Inter',sans-serif" }}>
      Loading…
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:BG_MAIN, color:TEXT_DARK, fontFamily:"'Inter',sans-serif", overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-thumb { background:#cbd5e1; border-radius:4px; }
        ::-webkit-scrollbar-track { background:#f1f5f9; }

        .ns_cell { transition:background 0.1s; color:${TEXT_DARK}; font-family:'JetBrains Mono',monospace; font-size:12px; }
        .ns_cell:focus { outline:2px solid ${COLOR}; outline-offset:-2px; background:#eff6ff !important; }
        .ns_cell:hover { background:#f0f9ff !important; }

        .ns_row_rm { opacity:0; transition:opacity 0.15s; }
        tr:hover .ns_row_rm { opacity:1; }
        .ns_tr:hover > td { background:#f8fafc !important; }

        @keyframes ns_up { from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none} }
        .ns_fade { animation:ns_up 0.22s ease both; }
        @keyframes blink { 0%,100%{opacity:1}50%{opacity:0.4} }

        .btn_h:hover { filter:brightness(0.94); transform:translateY(-1px); }
        .btn_h { transition:all 0.15s; }
        .chip_h:hover { border-color:${COLOR} !important; color:${COLOR} !important; background:${COLOR_PALE} !important; }

        .tab_active { color:${COLOR} !important; border-bottom:2.5px solid ${COLOR} !important; background:#fff !important; font-weight:600 !important; }
        .tab_inactive { color:${TEXT_MID} !important; border-bottom:2.5px solid transparent !important; }
        .tab_inactive:hover { color:${COLOR_LIGHT} !important; background:#f0f9ff !important; }

        input[type="date"]::-webkit-calendar-picker-indicator { opacity: 0.5; cursor: pointer; }
      `}</style>

      {/* ── Topbar (navy blue header matching screenshot) ── */}
      <header style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 28px", height:64,
        background:BG_HEADER,
        boxShadow:"0 2px 8px rgba(30,58,95,0.18)",
        flexShrink:0,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          {/* Hospital logo block */}
          <div style={{ width:40, height:40, borderRadius:10, background:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, boxShadow:"0 2px 8px rgba(0,0,0,0.15)" }}>
            🏥
          </div>
          <div>
            <div style={{ fontSize:17, fontWeight:700, color:"#ffffff", letterSpacing:"-0.3px" }}>Sangi Hospital</div>
            <div style={{ fontSize:11, color:"#93c5fd", fontWeight:500, marginTop:1 }}>IPD Portal · Nursing Department</div>
          </div>
        </div>

        {/* Center stats */}
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {[
            { lbl:"Today",  val:todayCount,  col:"#4ade80" },
            { lbl:"Week",   val:weekCount,   col:"#60a5fa" },
            { lbl:"Month",  val:monthCount,  col:"#fbbf24" },
          ].map(({ lbl, val, col }) => (
            <div key={lbl} style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 14px", borderRadius:20, background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)", fontSize:12 }}>
              <span style={{ color:col, fontWeight:700, fontSize:14, fontFamily:"'JetBrains Mono',monospace" }}>{val}</span>
              <span style={{ color:"#bfdbfe", fontWeight:500 }}>{lbl}</span>
            </div>
          ))}
        </div>

        {/* Right — date + user */}
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:8, background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)" }}>
            <span style={{ fontSize:13, color:"#bfdbfe" }}>📅</span>
            <span style={{ fontSize:12, color:"#e0f2fe", fontFamily:"'JetBrains Mono',monospace", fontWeight:500 }}>
              {new Date().toLocaleDateString("en-IN", { weekday:"short", day:"2-digit", month:"short", year:"numeric" })}
            </span>
          </div>

          {currentUser && (
            <div style={{ display:"flex", alignItems:"center", gap:9, paddingLeft:12, borderLeft:"1px solid rgba(255,255,255,0.15)" }}>
              <div style={{ width:34, height:34, borderRadius:9, background:COLOR, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, color:"#fff", fontWeight:700 }}>
                {currentUser.name?.[0]?.toUpperCase() || "N"}
              </div>
              <div>
                <div style={{ fontSize:13, color:"#ffffff", fontWeight:600 }}>{currentUser.name}</div>
                <div style={{ fontSize:10, color:"#93c5fd", fontWeight:500 }}>Nursing Staff</div>
              </div>
              <button onClick={onLogout} className="btn_h"
                style={{ marginLeft:4, padding:"6px 14px", borderRadius:7, background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.4)", color:"#fca5a5", fontSize:11, cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Sub-nav (white tab bar) ── */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 28px", height:50,
        background:BG_WHITE,
        borderBottom:`2px solid ${BORDER}`,
        flexShrink:0,
        boxShadow:"0 1px 4px rgba(30,58,95,0.06)",
      }}>
        <div style={{ display:"flex", gap:0, height:"100%" }}>
          {[{ id:"entry", label:"📋  Daily Entry" }, { id:"records", label:"🗂  Records" }].map(tab => (
            <button key={tab.id}
              onClick={() => setViewTab(tab.id)}
              className={viewTab === tab.id ? "tab_active" : "tab_inactive"}
              style={{
                padding:"0 22px", height:"100%",
                fontSize:13, fontFamily:"inherit", cursor:"pointer",
                background:"transparent", border:"none",
                borderBottom:"2.5px solid transparent",
                transition:"all 0.15s",
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {viewTab === "entry" && (
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {hasUnsaved && <span style={{ fontSize:12, color:"#f59e0b", fontWeight:600, animation:"blink 2s infinite" }}>● Unsaved changes</span>}
            {savedAt && !hasUnsaved && <span style={{ fontSize:12, color:"#16a34a", fontWeight:500 }}>✓ Saved {savedAt}</span>}

            <button onClick={() => addRows(5)} className="btn_h"
              style={{ padding:"7px 16px", borderRadius:7, fontSize:12, fontFamily:"inherit", cursor:"pointer", background:BG_MAIN, border:`1px solid ${BORDER_MID}`, color:TEXT_MID, fontWeight:500 }}>
              + 5 Rows
            </button>

            <button onClick={handleSave} className="btn_h"
              style={{ padding:"7px 20px", borderRadius:7, fontSize:12, fontFamily:"inherit", cursor:"pointer", background:BG_WHITE, border:`1.5px solid ${COLOR}`, color:COLOR, fontWeight:600 }}>
              💾 Save Draft
            </button>

            <button onClick={handleSubmit} className="btn_h" disabled={submitStatus === "sending"}
              style={{
                padding:"7px 22px", borderRadius:7, fontSize:13, fontFamily:"inherit",
                cursor: submitStatus === "sending" ? "wait" : "pointer",
                background: submitStatus === "done"  ? "#dcfce7"
                          : submitStatus === "error" ? "#fee2e2"
                          : COLOR,
                border:"none",
                color: submitStatus === "done"  ? "#15803d"
                     : submitStatus === "error" ? "#b91c1c"
                     : "#ffffff",
                fontWeight:700,
                boxShadow: submitStatus ? "none" : `0 2px 12px rgba(37,99,235,0.3)`,
                opacity: submitStatus === "sending" ? 0.75 : 1,
                minWidth:185,
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

      {/* ── Submitted banner ── */}
      {submittedToday && viewTab === "entry" && (
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 28px", background:"#f0fdf4", borderBottom:"1px solid #bbf7d0", flexShrink:0 }}>
          <span style={{ fontSize:15 }}>✅</span>
          <span style={{ fontSize:12, color:"#15803d", fontWeight:600 }}>Today's records have been submitted to HOD & Admin Management</span>
          <span style={{ fontSize:11, color:"#86efac", marginLeft:4 }}>· You can re-submit anytime to update</span>
        </div>
      )}

      {/* ── Content ── */}
      <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>

        {/* ════ ENTRY TAB ════ */}
        {viewTab === "entry" && (
          <div style={{ flex:1, overflow:"auto", padding:"20px 28px" }} className="ns_fade">

            {/* Banner card */}
            <div style={{
              display:"flex", alignItems:"center", justifyContent:"space-between",
              marginBottom:18, padding:"16px 24px",
              background:BG_WHITE,
              border:`1px solid ${BORDER}`,
              borderLeft:`4px solid ${COLOR}`,
              borderRadius:10,
              boxShadow:"0 1px 6px rgba(30,58,95,0.07)",
            }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:TEXT_DARK }}>Daily Nursing Log — {today}</div>
                <div style={{ fontSize:12, color:TEXT_LIGHT, marginTop:4, fontWeight:500 }}>
                  <span style={{ color:COLOR, fontWeight:700 }}>{filledToday}</span>
                  <span style={{ color:TEXT_MID }}> of {rows.length} rows filled</span>
                  <span style={{ color:TEXT_LIGHT, marginLeft:12 }}>Tab = next column · Enter = next row</span>
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:38, fontWeight:700, color:COLOR, fontFamily:"'JetBrains Mono',monospace", lineHeight:1 }}>{filledToday}</div>
                <div style={{ fontSize:10, color:TEXT_LIGHT, marginTop:3, fontWeight:600, textTransform:"uppercase", letterSpacing:"1px" }}>Patients</div>
              </div>
            </div>

            {/* Grid */}
            <div style={{ background:BG_WHITE, border:`1px solid ${BORDER}`, borderRadius:10, overflow:"hidden", boxShadow:"0 1px 6px rgba(30,58,95,0.06)" }}>
              <div style={{ overflowX:"auto" }}>
                <table style={{ borderCollapse:"collapse", width:"100%", minWidth:"max-content" }}>
                  <thead>
                    <tr style={{ background:"#f8fafc" }}>
                      {COLUMNS.map(col => (
                        <th key={col.key} style={{
                          padding:"11px 14px", textAlign:"left",
                          fontSize:10, fontWeight:700, color:"#64748b",
                          textTransform:"uppercase", letterSpacing:"1px",
                          borderBottom:`2px solid ${BORDER}`,
                          whiteSpace:"nowrap", minWidth:col.width,
                          fontFamily:"'Inter',sans-serif",
                          borderRight:`1px solid ${BORDER}`,
                        }}>
                          {col.label}
                          {col.key === "uhid" && <span style={{ marginLeft:5, padding:"1px 6px", borderRadius:4, background:COLOR_PALE, color:COLOR, fontSize:9, fontWeight:700 }}>KEY</span>}
                        </th>
                      ))}
                      <th style={{ padding:"11px 8px", borderBottom:`2px solid ${BORDER}`, width:34, background:"#f8fafc" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, ri) => {
                      const filled = isFilled(row);
                      return (
                        <tr key={row.id} className="ns_tr" style={{ background: filled ? "#f0f9ff" : BG_WHITE, borderBottom:`1px solid ${BORDER}` }}>
                          {COLUMNS.map(col => (
                            <td key={col.key} style={{ padding:0, borderRight:`1px solid ${BORDER}` }}>
                              {col.readOnly ? (
                                <div style={{ padding:"9px 14px", color:TEXT_LIGHT, fontSize:12, fontWeight:600, fontFamily:"'JetBrains Mono',monospace", userSelect:"none" }}>{row[col.key]}</div>
                              ) : (
                                <input
                                  id={`ns_${ri}_${col.key}`}
                                  className="ns_cell"
                                  type={col.type || "text"}
                                  value={row[col.key] || ""}
                                  onChange={e => updateRow(row.id, col.key, e.target.value)}
                                  onKeyDown={e => handleKeyDown(e, ri, col.key)}
                                  style={{
                                    width:"100%", padding:"9px 14px", background:"transparent", border:"none",
                                    color: col.key === "patientName" ? TEXT_DARK
                                         : col.key === "claimId"     ? COLOR
                                         : col.key === "uhid"        ? "#0369a1"
                                         : col.key === "patStay"     ? "#0891b2"
                                         : TEXT_MID,
                                    fontSize:12, fontFamily:"'JetBrains Mono',monospace", outline:"none", minWidth:col.width,
                                    fontWeight: col.key === "patientName" ? 600 : col.key === "uhid" ? 500 : 400,
                                    textAlign: col.key === "patStay" ? "center" : "left",
                                  }}
                                  placeholder={col.type === "date" ? "yyyy-mm-dd" : ""}
                                />
                              )}
                            </td>
                          ))}
                          <td style={{ padding:"0 6px", textAlign:"center", background: filled ? "#f0f9ff" : BG_WHITE }}>
                            <button className="ns_row_rm" onClick={() => removeRow(row.id)}
                              style={{ background:"none", border:"none", color:"#ef4444", cursor:"pointer", fontSize:13, padding:"2px 5px" }}>
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
              style={{ marginTop:10, padding:"10px 20px", borderRadius:9, background:"transparent", border:`1.5px dashed ${BORDER_MID}`, color:COLOR, fontSize:12, cursor:"pointer", fontFamily:"inherit", width:"100%", fontWeight:600, letterSpacing:"0.5px", transition:"all 0.15s" }}
              onMouseEnter={e => { e.target.style.borderColor = COLOR; e.target.style.background = COLOR_PALE; }}
              onMouseLeave={e => { e.target.style.borderColor = BORDER_MID; e.target.style.background = "transparent"; }}>
              + Add Row
            </button>

            {/* Reminder */}
            {filledToday > 0 && !submittedToday && (
              <div style={{ marginTop:16, padding:"14px 20px", background:"#fffbeb", border:"1px solid #fde68a", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:"#92400e" }}>Don't forget to submit today's records</div>
                  <div style={{ fontSize:11, color:"#a16207", marginTop:2 }}>{filledToday} record{filledToday !== 1 ? "s" : ""} ready · HOD & Admin are waiting for today's summary</div>
                </div>
                <button onClick={handleSubmit} className="btn_h"
                  style={{ padding:"8px 22px", borderRadius:8, fontSize:13, fontFamily:"inherit", cursor:"pointer", background:COLOR, border:"none", color:"#fff", fontWeight:700, boxShadow:"0 2px 10px rgba(37,99,235,0.25)" }}>
                  Submit Now →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ════ RECORDS TAB ════ */}
        {viewTab === "records" && (
          <div style={{ flex:1, overflow:"auto", padding:"20px 28px" }} className="ns_fade">

            {/* Filter bar */}
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20, padding:"14px 20px", background:BG_WHITE, border:`1px solid ${BORDER}`, borderRadius:10, flexWrap:"wrap", boxShadow:"0 1px 4px rgba(30,58,95,0.06)" }}>
              <span style={{ fontSize:11, fontWeight:700, color:TEXT_LIGHT, textTransform:"uppercase", letterSpacing:"1.5px", marginRight:4 }}>Period</span>
              {[{id:"today",lbl:"Today"},{id:"week",lbl:"Week"},{id:"month",lbl:"Month"},{id:"year",lbl:"Year"},{id:"custom",lbl:"Custom"}].map(f => (
                <button key={f.id} onClick={() => setFilterMode(f.id)} className="chip_h"
                  style={{
                    padding:"6px 16px", borderRadius:20, fontSize:12, fontFamily:"inherit", cursor:"pointer",
                    background: filterMode===f.id ? COLOR_PALE : BG_MAIN,
                    border:`1px solid ${filterMode===f.id ? COLOR : BORDER_MID}`,
                    color: filterMode===f.id ? COLOR : TEXT_MID,
                    fontWeight: filterMode===f.id ? 600 : 400,
                    transition:"all 0.15s",
                  }}>
                  {f.lbl}
                </button>
              ))}
              {filterMode === "custom" && (
                <div style={{ display:"flex", alignItems:"center", gap:8, marginLeft:8 }}>
                  <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                    style={{ background:BG_WHITE, border:`1px solid ${BORDER_MID}`, color:TEXT_DARK, padding:"6px 10px", borderRadius:7, fontSize:12, fontFamily:"'JetBrains Mono',monospace", outline:"none" }} />
                  <span style={{ color:TEXT_LIGHT }}>→</span>
                  <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                    style={{ background:BG_WHITE, border:`1px solid ${BORDER_MID}`, color:TEXT_DARK, padding:"6px 10px", borderRadius:7, fontSize:12, fontFamily:"'JetBrains Mono',monospace", outline:"none" }} />
                </div>
              )}
              <div style={{ marginLeft:"auto", padding:"5px 16px", borderRadius:20, background:COLOR_PALE, border:`1px solid #bfdbfe`, fontSize:12, color:COLOR, fontWeight:700, fontFamily:"'JetBrains Mono',monospace" }}>
                {filteredEntries.length} records
              </div>
            </div>

            {/* Summary cards */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:22 }}>
              {[
                { lbl:"Total Records",    val:filteredEntries.length,                                              col:COLOR,     bg:"#eff6ff", border:"#bfdbfe" },
                { lbl:"Unique Patients",  val:new Set(filteredEntries.map(e => e.patientName)).size,               col:"#16a34a",  bg:"#f0fdf4", border:"#bbf7d0" },
                { lbl:"Unique Hospitals", val:new Set(filteredEntries.map(e => e.hospital).filter(Boolean)).size,  col:"#d97706",  bg:"#fffbeb", border:"#fde68a" },
                { lbl:"Days Covered",     val:new Set(filteredEntries.map(e => e.createdAt?.slice(0,10))).size,    col:"#0891b2",  bg:"#ecfeff", border:"#a5f3fc" },
              ].map(({ lbl, val, col, bg, border }) => (
                <div key={lbl} style={{ background:bg, border:`1px solid ${border}`, borderTop:`3px solid ${col}`, borderRadius:10, padding:"16px 20px", boxShadow:"0 1px 4px rgba(30,58,95,0.05)" }}>
                  <div style={{ fontSize:10, fontWeight:700, color:TEXT_LIGHT, textTransform:"uppercase", letterSpacing:"1px", marginBottom:10 }}>{lbl}</div>
                  <div style={{ fontSize:34, fontWeight:700, color:col, lineHeight:1, fontFamily:"'JetBrains Mono',monospace" }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Table */}
            {filteredEntries.length === 0 ? (
              <div style={{ textAlign:"center", padding:60, color:TEXT_LIGHT, fontSize:14, fontWeight:600, background:BG_WHITE, border:`1px solid ${BORDER}`, borderRadius:10 }}>
                No records found for this period
              </div>
            ) : (
              <div style={{ background:BG_WHITE, border:`1px solid ${BORDER}`, borderRadius:10, overflow:"hidden", boxShadow:"0 1px 6px rgba(30,58,95,0.06)" }}>
                <div style={{ overflowX:"auto" }}>
                  <table style={{ borderCollapse:"collapse", width:"100%", minWidth:"max-content" }}>
                    <thead>
                      <tr style={{ background:"#f8fafc" }}>
                        {COLUMNS.map(col => (
                          <th key={col.key} style={{ padding:"11px 14px", textAlign:"left", fontSize:10, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"1px", borderBottom:`2px solid ${BORDER}`, whiteSpace:"nowrap", fontFamily:"'Inter',sans-serif", borderRight:`1px solid ${BORDER}` }}>
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEntries.map((row, i) => (
                        <tr key={row.id||i} className="ns_tr" style={{ borderBottom:`1px solid ${BORDER}`, background:BG_WHITE }}>
                          <td style={{ padding:"10px 14px", color:TEXT_LIGHT, fontSize:12, fontFamily:"'JetBrains Mono',monospace", borderRight:`1px solid ${BORDER}` }}>{i+1}</td>
                          <td style={{ padding:"10px 14px", color:"#0369a1", fontSize:12, fontFamily:"'JetBrains Mono',monospace", fontWeight:500, borderRight:`1px solid ${BORDER}` }}>{row.uhid || "—"}</td>
                          <td style={{ padding:"10px 14px", color:COLOR, fontSize:12, fontFamily:"'JetBrains Mono',monospace", borderRight:`1px solid ${BORDER}` }}>{row.claimId || "—"}</td>
                          <td style={{ padding:"10px 14px", color:TEXT_MID, fontSize:12, fontFamily:"'JetBrains Mono',monospace", borderRight:`1px solid ${BORDER}` }}>{row.ipdNo || "—"}</td>
                          <td style={{ padding:"10px 14px", color:TEXT_DARK, fontSize:13, fontWeight:600, borderRight:`1px solid ${BORDER}` }}>{row.patientName || "—"}</td>
                          <td style={{ padding:"10px 14px", color:TEXT_MID, fontSize:11, fontFamily:"'JetBrains Mono',monospace", borderRight:`1px solid ${BORDER}` }}>{row.dod || "—"}</td>
                          <td style={{ padding:"10px 14px", color:TEXT_MID, fontSize:12, borderRight:`1px solid ${BORDER}` }}>{row.hospital || "—"}</td>
                          <td style={{ padding:"10px 14px", color:TEXT_MID, fontSize:12, borderRight:`1px solid ${BORDER}` }}>{row.prepareBy || "—"}</td>
                          <td style={{ padding:"10px 14px", borderRight:`1px solid ${BORDER}` }}>
                            {row.patStay
                              ? <span style={{ padding:"2px 10px", borderRadius:5, background:"#e0f2fe", color:"#0369a1", fontSize:12, fontFamily:"'JetBrains Mono',monospace", fontWeight:600 }}>{row.patStay}</span>
                              : <span style={{ color:TEXT_LIGHT }}>—</span>}
                          </td>
                          <td style={{ padding:"10px 14px", color:TEXT_MID, fontSize:12, maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", borderRight:`1px solid ${BORDER}` }}>{row.remarks || "—"}</td>
                          <td style={{ padding:"10px 14px", color:TEXT_MID, fontSize:12 }}>{row.addedBy || "—"}</td>
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