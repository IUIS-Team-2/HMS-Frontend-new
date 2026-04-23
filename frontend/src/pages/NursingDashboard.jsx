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

// ── Config ─────────────────────────────────────────────────────────────────────
const COLOR       = "#34d399";   // emerald green — Nursing dept
const GLOW        = "#34d39935";
const BG_ACTIVE   = "#021a0e";
const STORAGE_KEY = "sangi_nursing_v2";
const SUBMIT_KEY  = "sangi_nursing_submitted"; // shared: visible to HOD & Admin

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
  const [submitStatus, setSubmitStatus]   = useState(null); // null | "sending" | "done" | "error"
  const [submittedToday, setSubmittedToday] = useState(false);

  // ── Load from storage ──────────────────────────────────────────────────────
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
        // Check if already submitted today
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

  // ── Row ops ────────────────────────────────────────────────────────────────
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

  // ── Save locally ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    const filled = rows.filter(isFilled);
    if (!filled.length) return;
    const updated = [...allEntries.filter(e => e.createdAt?.slice(0, 10) !== today), ...filled];
    setAllEntries(updated);
    await persist(updated);
    setSavedAt(new Date().toLocaleTimeString());
    setHasUnsaved(false);
  };

  // ── Submit to HOD & Admin (shared storage) ────────────────────────────────
  const handleSubmit = async () => {
    const filled = rows.filter(isFilled);
    if (!filled.length) { setSubmitStatus("error"); setTimeout(() => setSubmitStatus(null), 2500); return; }

    setSubmitStatus("sending");
    try {
      // Save locally first
      const updated = [...allEntries.filter(e => e.createdAt?.slice(0, 10) !== today), ...filled];
      setAllEntries(updated);
      await persist(updated);

      // Push to shared key — HOD & Admin read this
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
      if (next >= 0 && next < editable.length) document.getElementById(`ns_${ri}_${editable[next]}`)?.focus();
      else if (!e.shiftKey && ri < rows.length - 1) document.getElementById(`ns_${ri + 1}_${editable[0]}`)?.focus();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (ri < rows.length - 1) document.getElementById(`ns_${ri + 1}_${colKey}`)?.focus();
      else { addRows(1); setTimeout(() => document.getElementById(`ns_${ri + 1}_${colKey}`)?.focus(), 60); }
    }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const todayCount  = allEntries.filter(e => e.createdAt?.slice(0, 10) === today).length;
  const weekCount   = (() => { const { start, end } = weekRange(); return allEntries.filter(e => { const d = e.createdAt?.slice(0,10)||""; return d>=start&&d<=end; }).length; })();
  const monthCount  = (() => { const { start, end } = monthRange(); return allEntries.filter(e => { const d = e.createdAt?.slice(0,10)||""; return d>=start&&d<=end; }).length; })();
  const filledToday = rows.filter(isFilled).length;

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#0c0e14", color:COLOR, fontSize:14, fontFamily:"'DM Sans',sans-serif" }}>
      Loading…
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:"#0c0e14", color:"#edf0f7", fontFamily:"'DM Sans',sans-serif", overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-thumb { background:#2a2f3e; border-radius:4px; }
        .ns_cell:focus  { outline:2px solid ${COLOR}; outline-offset:-2px; background:${BG_ACTIVE} !important; }
        .ns_cell:hover  { background:#0d1c14 !important; }
        .ns_cell        { transition:background 0.1s; color:#dde3f0; font-family:'JetBrains Mono',monospace; font-size:12px; }
        .ns_row_rm      { opacity:0; transition:opacity 0.15s; }
        tr:hover .ns_row_rm { opacity:1; }
        .ns_tr:hover > td   { background:#0e1a15 !important; }
        @keyframes ns_up { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none} }
        .ns_fade { animation:ns_up 0.25s ease both; }
        @keyframes blink { 0%,100%{opacity:1}50%{opacity:0.3} }
        .btn_h:hover { filter:brightness(1.12); transform:translateY(-1px); }
        .btn_h { transition:all 0.15s; }
        .chip_h:hover { border-color:${COLOR} !important; color:${COLOR} !important; }
      `}</style>

      {/* ── Topbar ── */}
      <header style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 26px", height:64, borderBottom:"1px solid #1e2334", background:"#0f1118", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:42, height:42, borderRadius:12, background:`${COLOR}20`, border:`2px solid ${COLOR}55`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>
            🩹
          </div>
          <div>
            <div style={{ fontSize:10, fontWeight:600, color:"#3a4060", textTransform:"uppercase", letterSpacing:"2.5px" }}>Sangi Hospital</div>
            <div style={{ fontSize:18, fontWeight:700, color:"#f4f6ff", letterSpacing:"-0.4px", marginTop:1 }}>Nursing Dashboard</div>
          </div>
          <div style={{ marginLeft:6, padding:"4px 14px", borderRadius:20, background:`${COLOR}18`, border:`1px solid ${COLOR}45`, fontSize:11, fontWeight:600, color:COLOR, fontFamily:"'JetBrains Mono',monospace" }}>
            {today}
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {[
            { lbl:"Today", val:todayCount, col:"#4ade80" },
            { lbl:"Week",  val:weekCount,  col:COLOR },
            { lbl:"Month", val:monthCount, col:"#facc15" },
          ].map(({ lbl, val, col }) => (
            <div key={lbl} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:20, background:"#161b28", border:"1px solid #2a3049", fontSize:12 }}>
              <span style={{ color:col, fontWeight:700, fontSize:15, fontFamily:"'JetBrains Mono',monospace" }}>{val}</span>
              <span style={{ color:"#6875a0", fontWeight:500 }}>{lbl}</span>
            </div>
          ))}

          {currentUser && (
            <div style={{ display:"flex", alignItems:"center", gap:9, marginLeft:8, paddingLeft:14, borderLeft:"1px solid #1e2334" }}>
              <div style={{ width:34, height:34, borderRadius:10, background:`${COLOR}25`, border:`2px solid ${COLOR}50`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, color:COLOR, fontWeight:700 }}>
                {currentUser.name?.[0]?.toUpperCase() || "N"}
              </div>
              <div>
                <div style={{ fontSize:13, color:"#edf0f7", fontWeight:600 }}>{currentUser.name}</div>
                <div style={{ fontSize:10, color:"#3a4060", textTransform:"uppercase", letterSpacing:"1px", fontWeight:500 }}>Nursing Staff</div>
              </div>
              <button onClick={onLogout} className="btn_h"
                style={{ marginLeft:4, padding:"6px 14px", borderRadius:7, background:"#1e0e0e", border:"1px solid #6b2020", color:"#f87171", fontSize:11, cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Sub-nav ── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 26px", height:52, borderBottom:"1px solid #1e2334", background:"#0f1118", flexShrink:0 }}>
        <div style={{ display:"flex", gap:2 }}>
          {[{ id:"entry", label:"📋 Daily Entry" }, { id:"records", label:"🗂 Records" }].map(tab => (
            <button key={tab.id} onClick={() => setViewTab(tab.id)}
              style={{ padding:"8px 22px", borderRadius:"7px 7px 0 0", fontSize:13, fontFamily:"inherit", cursor:"pointer", border:"none", background: viewTab===tab.id ? "#0c0e14" : "transparent", color: viewTab===tab.id ? COLOR : "#4f5875", borderBottom: viewTab===tab.id ? `2px solid ${COLOR}` : "2px solid transparent", fontWeight: viewTab===tab.id ? 600 : 400, transition:"all 0.15s" }}>
              {tab.label}
            </button>
          ))}
        </div>

        {viewTab === "entry" && (
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {hasUnsaved && <span style={{ fontSize:12, color:"#facc15", fontWeight:600, animation:"blink 2s infinite" }}>● Unsaved changes</span>}
            {savedAt && !hasUnsaved && <span style={{ fontSize:12, color:"#4ade80", fontWeight:500 }}>✓ Saved {savedAt}</span>}

            <button onClick={() => addRows(5)} className="btn_h"
              style={{ padding:"7px 16px", borderRadius:7, fontSize:12, fontFamily:"inherit", cursor:"pointer", background:"#161b28", border:"1px solid #2a3049", color:"#8b96c0", fontWeight:500 }}>
              + 5 Rows
            </button>

            <button onClick={handleSave} className="btn_h"
              style={{ padding:"7px 20px", borderRadius:7, fontSize:13, fontFamily:"inherit", cursor:"pointer", background:"#1e2334", border:`1px solid ${COLOR}40`, color:COLOR, fontWeight:600 }}>
              💾 Save Draft
            </button>

            {/* Submit to HOD & Admin */}
            <button onClick={handleSubmit} className="btn_h" disabled={submitStatus === "sending"}
              style={{
                padding:"7px 22px", borderRadius:7, fontSize:13, fontFamily:"inherit",
                cursor: submitStatus === "sending" ? "wait" : "pointer",
                background: submitStatus === "done"  ? "#14532d"
                          : submitStatus === "error" ? "#4a0e0e"
                          : COLOR,
                border:"none",
                color: submitStatus === "done"  ? "#4ade80"
                     : submitStatus === "error" ? "#f87171"
                     : "#0a0c12",
                fontWeight:700,
                boxShadow: submitStatus ? "none" : `0 0 18px ${GLOW}`,
                opacity: submitStatus === "sending" ? 0.7 : 1,
                minWidth: 185,
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
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 26px", background:"#0a1a0e", borderBottom:"1px solid #14532d", flexShrink:0 }}>
          <span style={{ fontSize:16 }}>✅</span>
          <span style={{ fontSize:12, color:"#4ade80", fontWeight:600 }}>Today's records have been submitted to HOD & Admin Management</span>
          <span style={{ fontSize:11, color:"#2a5a3a", marginLeft:4 }}>· You can re-submit anytime to update</span>
        </div>
      )}

      {/* ── Content ── */}
      <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>

        {/* ════ ENTRY TAB ════ */}
        {viewTab === "entry" && (
          <div style={{ flex:1, overflow:"auto", padding:"20px 26px" }} className="ns_fade">

            {/* Banner */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18, padding:"14px 22px", background:"#0f1118", border:`1px solid ${COLOR}35`, borderRadius:12, borderLeft:`4px solid ${COLOR}` }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:"#f4f6ff" }}>Daily Nursing Log — {today}</div>
                <div style={{ fontSize:12, color:"#4f5875", marginTop:4, fontWeight:500 }}>
                  <span style={{ color:COLOR, fontWeight:700 }}>{filledToday}</span>
                  <span style={{ color:"#6875a0" }}> of {rows.length} rows filled</span>
                  <span style={{ color:"#3a4060", marginLeft:12 }}>Tab = next column · Enter = next row</span>
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:36, fontWeight:700, color:COLOR, fontFamily:"'JetBrains Mono',monospace", lineHeight:1 }}>{filledToday}</div>
                <div style={{ fontSize:10, color:"#3a4060", marginTop:3, fontWeight:500, textTransform:"uppercase", letterSpacing:"1px" }}>Patients</div>
              </div>
            </div>

            {/* Grid */}
            <div style={{ background:"#0f1118", border:"1px solid #1e2334", borderRadius:12, overflow:"hidden" }}>
              <div style={{ overflowX:"auto" }}>
                <table style={{ borderCollapse:"collapse", width:"100%", minWidth:"max-content" }}>
                  <thead>
                    <tr style={{ background:"#0a0c14" }}>
                      {COLUMNS.map(col => (
                        <th key={col.key} style={{ padding:"12px 14px", textAlign:"left", fontSize:10, fontWeight:700, color:"#6875a0", textTransform:"uppercase", letterSpacing:"1.2px", borderBottom:"2px solid #1e2334", whiteSpace:"nowrap", minWidth:col.width, fontFamily:"'DM Sans',sans-serif", borderRight:"1px solid #181d2c" }}>
                          {col.label}
                          {col.key === "uhid" && <span style={{ marginLeft:5, padding:"1px 6px", borderRadius:4, background:`${COLOR}22`, color:COLOR, fontSize:9, fontWeight:700 }}>KEY</span>}
                        </th>
                      ))}
                      <th style={{ padding:"12px 8px", borderBottom:"2px solid #1e2334", width:34 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, ri) => {
                      const filled = isFilled(row);
                      return (
                        <tr key={row.id} className="ns_tr" style={{ background: filled ? "#0d1a12" : "transparent", borderBottom:"1px solid #181d2c" }}>
                          {COLUMNS.map(col => (
                            <td key={col.key} style={{ padding:0, borderRight:"1px solid #181d2c" }}>
                              {col.readOnly ? (
                                <div style={{ padding:"9px 14px", color:"#2e3654", fontSize:12, fontWeight:600, fontFamily:"'JetBrains Mono',monospace", userSelect:"none" }}>{row[col.key]}</div>
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
                                    color: col.key === "patientName" ? "#f4f6ff"
                                         : col.key === "claimId"     ? COLOR
                                         : col.key === "uhid"        ? "#a7f3d0"
                                         : col.key === "patStay"     ? "#60a5fa"
                                         : "#b8c2e0",
                                    fontSize:12, fontFamily:"'JetBrains Mono',monospace", outline:"none", minWidth:col.width,
                                    fontWeight: col.key === "patientName" ? 600 : col.key === "uhid" ? 500 : 400,
                                    textAlign: col.key === "patStay" ? "center" : "left",
                                  }}
                                  placeholder={col.type === "date" ? "yyyy-mm-dd" : ""}
                                />
                              )}
                            </td>
                          ))}
                          <td style={{ padding:"0 6px", textAlign:"center" }}>
                            <button className="ns_row_rm" onClick={() => removeRow(row.id)}
                              style={{ background:"none", border:"none", color:"#f87171", cursor:"pointer", fontSize:14, padding:"2px 5px" }}>
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
              style={{ marginTop:10, padding:"10px 20px", borderRadius:10, background:"transparent", border:`1.5px dashed ${COLOR}30`, color:COLOR, fontSize:12, cursor:"pointer", fontFamily:"inherit", width:"100%", fontWeight:600, letterSpacing:"0.5px" }}>
              + Add Row
            </button>

            {/* Reminder to submit */}
            {filledToday > 0 && !submittedToday && (
              <div style={{ marginTop:16, padding:"14px 20px", background:"#1a1200", border:"1px solid #713f12", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:"#fde68a" }}>Don't forget to submit today's records</div>
                  <div style={{ fontSize:11, color:"#92400e", marginTop:2 }}>{filledToday} record{filledToday !== 1 ? "s" : ""} ready · HOD & Admin are waiting for today's summary</div>
                </div>
                <button onClick={handleSubmit} className="btn_h"
                  style={{ padding:"8px 22px", borderRadius:8, fontSize:13, fontFamily:"inherit", cursor:"pointer", background:COLOR, border:"none", color:"#0a0c12", fontWeight:700, boxShadow:`0 0 16px ${GLOW}` }}>
                  Submit Now →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ════ RECORDS TAB ════ */}
        {viewTab === "records" && (
          <div style={{ flex:1, overflow:"auto", padding:"20px 26px" }} className="ns_fade">

            {/* Filter bar */}
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20, padding:"14px 20px", background:"#0f1118", border:"1px solid #1e2334", borderRadius:12, flexWrap:"wrap" }}>
              <span style={{ fontSize:11, fontWeight:700, color:"#3a4060", textTransform:"uppercase", letterSpacing:"1.5px", marginRight:4 }}>Period</span>
              {[{id:"today",lbl:"Today"},{id:"week",lbl:"Week"},{id:"month",lbl:"Month"},{id:"year",lbl:"Year"},{id:"custom",lbl:"Custom"}].map(f => (
                <button key={f.id} onClick={() => setFilterMode(f.id)} className="chip_h"
                  style={{ padding:"6px 16px", borderRadius:20, fontSize:12, fontFamily:"inherit", cursor:"pointer", background: filterMode===f.id ? `${COLOR}20` : "#161b28", border:`1px solid ${filterMode===f.id ? COLOR : "#2a3049"}`, color: filterMode===f.id ? COLOR : "#6875a0", fontWeight: filterMode===f.id ? 600 : 400, transition:"all 0.15s" }}>
                  {f.lbl}
                </button>
              ))}
              {filterMode === "custom" && (
                <div style={{ display:"flex", alignItems:"center", gap:8, marginLeft:8 }}>
                  <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                    style={{ background:"#0c0e14", border:"1px solid #2a3049", color:"#b8c2e0", padding:"6px 10px", borderRadius:7, fontSize:12, fontFamily:"'JetBrains Mono',monospace", outline:"none" }} />
                  <span style={{ color:"#3a4060" }}>→</span>
                  <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                    style={{ background:"#0c0e14", border:"1px solid #2a3049", color:"#b8c2e0", padding:"6px 10px", borderRadius:7, fontSize:12, fontFamily:"'JetBrains Mono',monospace", outline:"none" }} />
                </div>
              )}
              <div style={{ marginLeft:"auto", padding:"5px 16px", borderRadius:20, background:`${COLOR}18`, border:`1px solid ${COLOR}40`, fontSize:12, color:COLOR, fontWeight:700, fontFamily:"'JetBrains Mono',monospace" }}>
                {filteredEntries.length} records
              </div>
            </div>

            {/* Summary cards */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:22 }}>
              {[
                { lbl:"Total Records",    val:filteredEntries.length,                                              col:COLOR },
                { lbl:"Unique Patients",  val:new Set(filteredEntries.map(e => e.patientName)).size,               col:"#4ade80" },
                { lbl:"Unique Hospitals", val:new Set(filteredEntries.map(e => e.hospital).filter(Boolean)).size,  col:"#facc15" },
                { lbl:"Days Covered",     val:new Set(filteredEntries.map(e => e.createdAt?.slice(0,10))).size,    col:"#60a5fa" },
              ].map(({ lbl, val, col }) => (
                <div key={lbl} style={{ background:"#0f1118", border:"1px solid #1e2334", borderTop:`3px solid ${col}`, borderRadius:12, padding:"16px 20px" }}>
                  <div style={{ fontSize:10, fontWeight:700, color:"#3a4060", textTransform:"uppercase", letterSpacing:"1px", marginBottom:10 }}>{lbl}</div>
                  <div style={{ fontSize:34, fontWeight:700, color:col, lineHeight:1, fontFamily:"'JetBrains Mono',monospace" }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Table */}
            {filteredEntries.length === 0 ? (
              <div style={{ textAlign:"center", padding:60, color:"#2a3049", fontSize:14, fontWeight:600, background:"#0f1118", border:"1px solid #1e2334", borderRadius:12 }}>
                No records found for this period
              </div>
            ) : (
              <div style={{ background:"#0f1118", border:"1px solid #1e2334", borderRadius:12, overflow:"hidden" }}>
                <div style={{ overflowX:"auto" }}>
                  <table style={{ borderCollapse:"collapse", width:"100%", minWidth:"max-content" }}>
                    <thead>
                      <tr style={{ background:"#0a0c14" }}>
                        {COLUMNS.map(col => (
                          <th key={col.key} style={{ padding:"11px 14px", textAlign:"left", fontSize:10, fontWeight:700, color:"#6875a0", textTransform:"uppercase", letterSpacing:"1px", borderBottom:"2px solid #1e2334", whiteSpace:"nowrap", fontFamily:"'DM Sans',sans-serif", borderRight:"1px solid #181d2c" }}>
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEntries.map((row, i) => (
                        <tr key={row.id||i} className="ns_tr" style={{ borderBottom:"1px solid #181d2c" }}>
                          <td style={{ padding:"10px 14px", color:"#2e3654", fontSize:12, fontFamily:"'JetBrains Mono',monospace", borderRight:"1px solid #181d2c" }}>{i+1}</td>
                          <td style={{ padding:"10px 14px", color:"#a7f3d0", fontSize:12, fontFamily:"'JetBrains Mono',monospace", fontWeight:500, borderRight:"1px solid #181d2c" }}>{row.uhid || "—"}</td>
                          <td style={{ padding:"10px 14px", color:COLOR, fontSize:12, fontFamily:"'JetBrains Mono',monospace", borderRight:"1px solid #181d2c" }}>{row.claimId || "—"}</td>
                          <td style={{ padding:"10px 14px", color:"#8b96c0", fontSize:12, fontFamily:"'JetBrains Mono',monospace", borderRight:"1px solid #181d2c" }}>{row.ipdNo || "—"}</td>
                          <td style={{ padding:"10px 14px", color:"#f4f6ff", fontSize:13, fontWeight:600, borderRight:"1px solid #181d2c" }}>{row.patientName || "—"}</td>
                          <td style={{ padding:"10px 14px", color:"#6875a0", fontSize:11, fontFamily:"'JetBrains Mono',monospace", borderRight:"1px solid #181d2c" }}>{row.dod || "—"}</td>
                          <td style={{ padding:"10px 14px", color:"#b8c2e0", fontSize:12, borderRight:"1px solid #181d2c" }}>{row.hospital || "—"}</td>
                          <td style={{ padding:"10px 14px", color:"#b8c2e0", fontSize:12, borderRight:"1px solid #181d2c" }}>{row.prepareBy || "—"}</td>
                          <td style={{ padding:"10px 14px", borderRight:"1px solid #181d2c" }}>
                            {row.patStay
                              ? <span style={{ padding:"2px 10px", borderRadius:5, background:"#1e2d4a", color:"#60a5fa", fontSize:12, fontFamily:"'JetBrains Mono',monospace", fontWeight:600 }}>{row.patStay}</span>
                              : <span style={{ color:"#2e3654" }}>—</span>}
                          </td>
                          <td style={{ padding:"10px 14px", color:"#6875a0", fontSize:12, maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", borderRight:"1px solid #181d2c" }}>{row.remarks || "—"}</td>
                          <td style={{ padding:"10px 14px", color:"#8b96c0", fontSize:12 }}>{row.addedBy || "—"}</td>
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