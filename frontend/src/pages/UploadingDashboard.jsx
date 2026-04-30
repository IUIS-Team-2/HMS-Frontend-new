import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";

const COLUMNS = [
  { key: "sNo",        label: "S.No.",        width: 60,  readOnly: true },
  { key: "uhid",       label: "UHID",         width: 130 },
  { key: "claimId",    label: "Claim ID",     width: 130 },
  { key: "ipdNo",      label: "IPD No.",      width: 120 },
  { key: "patientName",label: "Patient Name", width: 180 },
  { key: "doa",        label: "DOA",          width: 120, type: "date" },
  { key: "dod",        label: "DOD",          width: 120, type: "date" },
  { key: "uploadDate", label: "Upload Date",  width: 130, type: "date" },
  { key: "hospital",   label: "Hospital",     width: 160 },
  { key: "prepareBy",  label: "Prepare By",   width: 140 },
  { key: "remarks",    label: "Remarks",      width: 200 },
  { key: "addedBy",    label: "Added By",     width: 130 },
];

const STORAGE_KEY = "sangi_uploading_entries";

const blankRow = (sNo) => ({
  id: crypto.randomUUID(),
  sNo,
  uhid: "",
  claimId: "",
  ipdNo: "",
  patientName: "",
  doa: "",
  dod: "",
  uploadDate: new Date().toISOString().slice(0, 10),
  hospital: "",
  prepareBy: "",
  remarks: "",
  addedBy: "",
  createdAt: new Date().toISOString(),
});

function todayStr() { return new Date().toISOString().slice(0, 10); }
function weekRange()  { const now = new Date(); const day = now.getDay(); const mon = new Date(now); mon.setDate(now.getDate() - ((day + 6) % 7)); const sun = new Date(mon); sun.setDate(mon.getDate() + 6); return { start: mon.toISOString().slice(0, 10), end: sun.toISOString().slice(0, 10) }; }
function monthRange() { const now = new Date(); return { start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10), end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10) }; }
function yearRange()  { const y = new Date().getFullYear(); return { start: `${y}-01-01`, end: `${y}-12-31` }; }

export default function UploadingDashboard({ currentUser, onLogout }) {
  const today = todayStr();

  // ── Ocean Blue palette ──────────────────────────────────────────────────────
  const accent       = "#0ea5e9";   // sky-500
  const accentDark   = "#0369a1";   // sky-700
  const accentGlow   = "#38bdf8";   // sky-400
  const accentFoam   = "#7dd3fc";   // sky-300
  const navyDeep     = "#0a1628";
  const navyMid      = "#0d2847";
  const navySurface  = "#0e3460";
  const pageBg       = "#f0f9ff";   // sky-50
  const cardBg       = "#ffffff";
  const borderCol    = "#bae6fd";   // sky-200
  const borderLight  = "#e0f2fe";   // sky-100
  const hoverBg      = "#f0f9ff";
  const focusBg      = "#e0f2fe";
  const theadBg      = `linear-gradient(135deg, ${navyDeep}, ${navyMid})`;
  const subnavBg     = `linear-gradient(180deg, #e0f2fe 0%, #f0f9ff 100%)`;
  // ────────────────────────────────────────────────────────────────────────────

  const [allEntries, setAllEntries] = useState(() => {
    try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
  });

  const [rows, setRows] = useState(() => {
    const existing = (() => { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; } })();
    const todayRows = existing.filter(e => e.uploadDate === todayStr() || e.createdAt?.slice(0, 10) === todayStr());
    return todayRows.length > 0 ? todayRows : Array.from({ length: 10 }, (_, i) => blankRow(i + 1));
  });

  const [filterMode, setFilterMode]   = useState("today");
  const [customStart, setCustomStart] = useState(today);
  const [customEnd, setCustomEnd]     = useState(today);
  const [viewTab, setViewTab]         = useState("entry");
  const [savedAt, setSavedAt]         = useState(null);
  const [hasUnsaved, setHasUnsaved]   = useState(false);
  const [activeCell, setActiveCell]   = useState(null);

  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(allEntries)); } catch {} }, [allEntries]);

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

  const handleSave = () => {
    const filled = rows.filter(r => r.uhid || r.claimId || r.ipdNo || r.patientName);
    if (!filled.length) return;
    setAllEntries(prev => {
      const withoutToday = prev.filter(e => { const d = e.uploadDate || e.createdAt?.slice(0, 10); return d !== today; });
      return [...withoutToday, ...filled];
    });
    setSavedAt(new Date().toLocaleTimeString());
    setHasUnsaved(false);
  };

  const filteredEntries = (() => {
    let start, end;
    if (filterMode === "today")      { start = today; end = today; }
    else if (filterMode === "week")  { ({ start, end } = weekRange()); }
    else if (filterMode === "month") { ({ start, end } = monthRange()); }
    else if (filterMode === "year")  { ({ start, end } = yearRange()); }
    else                             { start = customStart; end = customEnd; }
    return allEntries.filter(e => { const d = e.uploadDate || e.createdAt?.slice(0, 10) || ""; return d >= start && d <= end; })
      .sort((a, b) => (a.uploadDate || "").localeCompare(b.uploadDate || ""));
  })();

  const handleKeyDown = (e, rowIdx, colKey) => {
    const editableCols = COLUMNS.filter(c => !c.readOnly).map(c => c.key);
    const colIdx = editableCols.indexOf(colKey);
    if (e.key === "Tab") {
      e.preventDefault();
      const next = e.shiftKey ? colIdx - 1 : colIdx + 1;
      if (next >= 0 && next < editableCols.length) { document.getElementById(`cell-${rowIdx}-${editableCols[next]}`)?.focus(); }
      else if (!e.shiftKey && rowIdx < rows.length - 1) { document.getElementById(`cell-${rowIdx + 1}-${editableCols[0]}`)?.focus(); }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (rowIdx < rows.length - 1) { document.getElementById(`cell-${rowIdx + 1}-${colKey}`)?.focus(); }
      else { addRows(1); setTimeout(() => document.getElementById(`cell-${rowIdx + 1}-${colKey}`)?.focus(), 50); }
    }
  };

  const todayCount  = allEntries.filter(e => (e.uploadDate || e.createdAt?.slice(0,10)) === today).length;
  const weekCount   = (() => { const { start, end } = weekRange(); return allEntries.filter(e => { const d = e.uploadDate || e.createdAt?.slice(0,10) || ""; return d>=start&&d<=end; }).length; })();
  const monthCount  = (() => { const { start, end } = monthRange(); return allEntries.filter(e => { const d = e.uploadDate || e.createdAt?.slice(0,10) || ""; return d>=start&&d<=end; }).length; })();
  const filledToday = rows.filter(r => r.uhid || r.claimId || r.ipdNo || r.patientName).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: pageBg, color: "#0c1a2e", fontFamily: "'Plus Jakarta Sans', 'Inter', 'Segoe UI', sans-serif", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #e0f2fe; }
        ::-webkit-scrollbar-thumb { background: ${accent}; border-radius: 3px; }
        .ugrid-cell:focus { outline: 2px solid ${accent}; outline-offset: -2px; background: ${focusBg} !important; z-index: 2; position: relative; }
        .ugrid-cell { transition: background 0.1s; font-family: 'JetBrains Mono', monospace; }
        .ugrid-cell:hover { background: ${hoverBg} !important; }
        .utab-btn:hover { color: ${accent} !important; background: rgba(14,165,233,0.08) !important; }
        .ufilter-chip:hover { border-color: ${accent} !important; color: ${accent} !important; background: rgba(14,165,233,0.06) !important; }
        .uaction-btn:hover { filter: brightness(1.08); transform: translateY(-1px); }
        .urow-remove { opacity: 0; transition: opacity 0.15s; }
        tr:hover .urow-remove { opacity: 1; }
        tr:hover td { background: ${hoverBg} !important; }
        @keyframes ufadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .ufade-in { animation: ufadeIn 0.3s ease; }
        @keyframes upulse { 0%,100%{opacity:1}50%{opacity:.4} }
      `}</style>

      {/* ── Topbar ─────────────────────────────────────────────────────────── */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 28px", height: 64,
        borderBottom: `2px solid rgba(14,165,233,0.4)`,
        background: `linear-gradient(135deg, ${navyDeep} 0%, ${navyMid} 50%, ${navySurface} 100%)`,
        flexShrink: 0,
        boxShadow: "0 4px 24px rgba(10,22,40,0.5), 0 0 40px rgba(14,165,233,0.08)",
        position: "relative", overflow: "hidden",
      }}>
        {/* ambient glows */}
        <div style={{ position: "absolute", top: -30, left: -20, width: 200, height: 100, background: "radial-gradient(ellipse, rgba(14,165,233,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -20, right: 100, width: 150, height: 80, background: "radial-gradient(ellipse, rgba(56,189,248,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative", zIndex: 1 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 11,
            background: `linear-gradient(135deg, ${accent}, ${accentDark})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, color: "#fff", fontWeight: 800,
            boxShadow: `0 0 20px rgba(14,165,233,0.5), 0 4px 12px rgba(0,0,0,0.3)`,
            border: "1px solid rgba(125,211,252,0.3)",
          }}>↑</div>
          <div>
            <div style={{ fontSize: 8, letterSpacing: "4px", color: accentFoam, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>Sangi Hospital</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.4px" }}>Uploading Department</div>
          </div>
          <div style={{ marginLeft: 10, padding: "4px 14px", borderRadius: 20, background: "rgba(14,165,233,0.15)", border: `1px solid rgba(14,165,233,0.4)`, fontSize: 10, color: accentFoam, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>{today}</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative", zIndex: 1 }}>
          {[
            { label: "Today",      val: todayCount,  col: "#10b981" },
            { label: "This Week",  val: weekCount,   col: accentGlow },
            { label: "This Month", val: monthCount,  col: "#f59e0b" },
          ].map(({ label, val, col }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 20, background: `${col}18`, border: `1px solid ${col}40`, fontSize: 11 }}>
              <span style={{ color: col, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{val}</span>
              <span style={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>{label}</span>
            </div>
          ))}
          {currentUser && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 8, paddingLeft: 14, borderLeft: `1px solid rgba(14,165,233,0.3)` }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(14,165,233,0.2)", border: `1.5px solid rgba(14,165,233,0.5)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: accentFoam, fontWeight: 800 }}>{currentUser.name?.[0] || "U"}</div>
              <div>
                <div style={{ fontSize: 12, color: "#ffffff", fontWeight: 700 }}>{currentUser.name}</div>
                <div style={{ fontSize: 8, color: accentFoam, letterSpacing: "1.5px", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>Uploader</div>
              </div>
              <button onClick={onLogout} style={{ marginLeft: 6, padding: "5px 14px", borderRadius: 8, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#fca5a5", fontSize: 10, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}>⎋ Logout</button>
            </div>
          )}
        </div>
      </header>

      {/* ── Sub-nav ─────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", height: 48, borderBottom: `1.5px solid ${borderCol}`, background: subnavBg, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 4 }}>
          {[{ id: "entry", label: "📋 Daily Entry" }, { id: "records", label: "🗂 Records" }].map(tab => (
            <button key={tab.id} className="utab-btn" onClick={() => setViewTab(tab.id)}
              style={{
                padding: "7px 20px", borderRadius: "8px 8px 0 0", fontSize: 12,
                fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: "pointer", border: "none",
                background: viewTab === tab.id ? "#ffffff" : "transparent",
                color: viewTab === tab.id ? accent : "#9ca3af",
                borderBottom: viewTab === tab.id ? `3px solid ${accent}` : "3px solid transparent",
                fontWeight: viewTab === tab.id ? 800 : 600,
                boxShadow: viewTab === tab.id ? `0 -2px 8px rgba(14,165,233,0.1)` : "none",
                transition: "all 0.15s",
              }}>
              {tab.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {viewTab === "entry" && (
            <>
              {hasUnsaved && <div style={{ fontSize: 10, color: "#f59e0b", animation: "upulse 2s infinite", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>● Unsaved changes</div>}
              {savedAt && !hasUnsaved && <div style={{ fontSize: 10, color: "#10b981", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>✓ Saved at {savedAt}</div>}
              <button className="uaction-btn" onClick={() => addRows(5)} style={{ padding: "6px 16px", borderRadius: 8, fontSize: 11, fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: "pointer", background: "#fff", border: `1.5px solid ${borderCol}`, color: "#6b7280", fontWeight: 600 }}>+ 5 Rows</button>
              <button className="uaction-btn" onClick={handleSave} style={{ padding: "6px 20px", borderRadius: 8, fontSize: 12, fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: "pointer", background: `linear-gradient(135deg, ${accent}, ${accentDark})`, border: "none", color: "#fff", fontWeight: 800, boxShadow: `0 4px 14px rgba(14,165,233,0.4)` }}>💾 Save</button>
            </>
          )}
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>

        {/* Daily Entry tab */}
        {viewTab === "entry" && (
          <div style={{ flex: 1, overflow: "auto", padding: "20px 28px" }} className="ufade-in">
            {/* Info bar */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 16, padding: "14px 20px",
              background: `linear-gradient(135deg, #ffffff, #f0f9ff)`,
              border: `1.5px solid ${borderCol}`, borderLeft: `5px solid ${accent}`,
              borderRadius: 12, boxShadow: `0 2px 12px rgba(14,165,233,0.1)`,
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#0c1a2e" }}>Today's Uploading Log — {today}</div>
                <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 3, fontFamily: "'JetBrains Mono', monospace" }}>{filledToday} of {rows.length} rows filled · Tab to move right · Enter to move down</div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: accent, fontFamily: "'JetBrains Mono', monospace" }}>{filledToday}</div>
            </div>

            {/* Entry table */}
            <div style={{ overflowX: "auto", background: cardBg, border: `1.5px solid ${borderCol}`, borderRadius: 12, overflow: "hidden", boxShadow: `0 2px 16px rgba(14,165,233,0.08)` }}>
              <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: theadBg }}>
                    {COLUMNS.map(col => (
                      <th key={col.key} style={{ padding: "11px 14px", textAlign: "left", fontSize: 8.5, letterSpacing: "2.5px", color: accentFoam, textTransform: "uppercase", borderBottom: `2px solid rgba(14,165,233,0.4)`, whiteSpace: "nowrap", minWidth: col.width, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, borderRight: "1px solid rgba(14,165,233,0.2)" }}>
                        {col.label}
                      </th>
                    ))}
                    <th style={{ padding: "11px 8px", fontSize: 8.5, color: accentFoam, borderBottom: `2px solid rgba(14,165,233,0.4)`, borderRight: "1px solid rgba(14,165,233,0.2)" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIdx) => {
                    const filled = !!(row.uhid || row.claimId || row.ipdNo || row.patientName);
                    return (
                      <tr key={row.id} style={{ background: filled ? "#f8fdff" : cardBg, borderBottom: `1px solid ${borderLight}` }}>
                        {COLUMNS.map(col => (
                          <td key={col.key} style={{ padding: 0, borderRight: `1px solid ${borderLight}` }}>
                            {col.readOnly ? (
                              <div style={{ padding: "9px 14px", color: accentFoam, fontSize: 11, userSelect: "none", fontFamily: "'JetBrains Mono', monospace" }}>{row[col.key]}</div>
                            ) : (
                              <input
                                id={`cell-${rowIdx}-${col.key}`}
                                className="ugrid-cell"
                                type={col.type || "text"}
                                value={row[col.key] || ""}
                                onChange={e => updateRow(row.id, col.key, e.target.value)}
                                onKeyDown={e => handleKeyDown(e, rowIdx, col.key)}
                                onFocus={() => setActiveCell(`${rowIdx}-${col.key}`)}
                                onBlur={() => setActiveCell(null)}
                                style={{ width: "100%", padding: "10px 14px", background: "transparent", border: "none", color: col.key === "patientName" ? "#0c1a2e" : "#334155", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", outline: "none", minWidth: col.width, cursor: "text", fontWeight: col.key === "patientName" ? 700 : 400 }}
                                placeholder={col.type === "date" ? "yyyy-mm-dd" : "—"}
                              />
                            )}
                          </td>
                        ))}
                        <td style={{ padding: "0 8px", borderRight: `1px solid ${borderLight}`, textAlign: "center" }}>
                          <button className="urow-remove" onClick={() => removeRow(row.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14, padding: "0 4px" }}>✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button onClick={() => addRows(1)} style={{ marginTop: 14, padding: "10px 20px", borderRadius: 10, background: "transparent", border: `1.5px dashed rgba(14,165,233,0.4)`, color: accent, fontSize: 12, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, width: "100%", transition: "all 0.15s" }}>+ Add Row</button>
          </div>
        )}

        {/* Records tab */}
        {viewTab === "records" && (
          <div style={{ flex: 1, overflow: "auto", padding: "20px 28px" }} className="ufade-in">
            {/* Filter bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, padding: "14px 20px", background: cardBg, border: `1.5px solid ${borderCol}`, borderRadius: 12, flexWrap: "wrap", boxShadow: `0 2px 8px rgba(14,165,233,0.06)` }}>
              <span style={{ fontSize: 9, color: accent, letterSpacing: "2.5px", textTransform: "uppercase", marginRight: 4, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>Period:</span>
              {[{ id: "today", label: "Today" }, { id: "week", label: "This Week" }, { id: "month", label: "This Month" }, { id: "year", label: "This Year" }, { id: "custom", label: "Custom" }].map(f => (
                <button key={f.id} className="ufilter-chip" onClick={() => setFilterMode(f.id)}
                  style={{ padding: "6px 16px", borderRadius: 20, fontSize: 11, fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: "pointer", background: filterMode === f.id ? `rgba(14,165,233,0.1)` : "#f9fafb", border: `1.5px solid ${filterMode === f.id ? accent : borderCol}`, color: filterMode === f.id ? accent : "#6b7280", fontWeight: filterMode === f.id ? 700 : 600, transition: "all 0.15s" }}>
                  {f.label}
                </button>
              ))}
              {filterMode === "custom" && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 8 }}>
                  <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} style={{ background: "#f0f9ff", border: `1.5px solid ${borderCol}`, color: "#0c1a2e", padding: "6px 12px", borderRadius: 8, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", outline: "none" }} />
                  <span style={{ color: "#9ca3af", fontSize: 10 }}>to</span>
                  <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} style={{ background: "#f0f9ff", border: `1.5px solid ${borderCol}`, color: "#0c1a2e", padding: "6px 12px", borderRadius: 8, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", outline: "none" }} />
                </div>
              )}
              <div style={{ marginLeft: "auto", padding: "5px 16px", borderRadius: 20, background: `rgba(14,165,233,0.1)`, border: `1.5px solid ${accent}`, fontSize: 12, color: accent, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>{filteredEntries.length} records</div>
            </div>

            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
              {[
                { label: "Total Records",    val: filteredEntries.length,                                             col: accent },
                { label: "Unique Patients",  val: new Set(filteredEntries.map(e => e.patientName)).size,              col: "#10b981" },
                { label: "Unique Hospitals", val: new Set(filteredEntries.map(e => e.hospital).filter(Boolean)).size, col: "#f59e0b" },
                { label: "Days Covered",     val: new Set(filteredEntries.map(e => e.uploadDate)).size,               col: "#f87171" },
              ].map(({ label, val, col }) => (
                <div key={label} style={{ background: cardBg, border: `1.5px solid ${borderCol}`, borderTop: `4px solid ${col}`, borderRadius: 12, padding: "16px 18px", position: "relative", overflow: "hidden", boxShadow: `0 2px 8px rgba(14,165,233,0.06)` }}>
                  <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, borderRadius: "50%", background: `${col}08`, transform: "translate(30%,-30%)" }} />
                  <div style={{ fontSize: 8, letterSpacing: "2.5px", color: "#9ca3af", textTransform: "uppercase", marginBottom: 8, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}>{label}</div>
                  <div style={{ fontSize: 30, fontWeight: 800, color: col, lineHeight: 1, fontFamily: "'JetBrains Mono', monospace" }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Records table */}
            {filteredEntries.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: borderCol, fontSize: 12, letterSpacing: "3px", background: cardBg, border: `1.5px solid ${borderCol}`, borderRadius: 12, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}>NO RECORDS FOUND FOR THIS PERIOD</div>
            ) : (
              <div style={{ background: cardBg, border: `1.5px solid ${borderCol}`, borderRadius: 12, overflow: "hidden", boxShadow: `0 2px 12px rgba(14,165,233,0.06)` }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: theadBg }}>
                        {COLUMNS.map(col => (
                          <th key={col.key} style={{ padding: "11px 14px", textAlign: "left", fontSize: 8.5, letterSpacing: "2.5px", color: accentFoam, textTransform: "uppercase", borderBottom: `2px solid rgba(14,165,233,0.4)`, whiteSpace: "nowrap", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, borderRight: "1px solid rgba(14,165,233,0.2)" }}>{col.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEntries.map((row, i) => (
                        <tr key={row.id || i} style={{ borderBottom: `1px solid ${borderLight}` }}>
                          <td style={{ padding: "10px 14px", color: accentFoam, fontSize: 10, borderRight: `1px solid ${borderLight}`, fontFamily: "'JetBrains Mono', monospace" }}>{i + 1}</td>
                          <td style={{ padding: "10px 14px", color: accent, fontFamily: "'JetBrains Mono', monospace", borderRight: `1px solid ${borderLight}`, fontWeight: 600 }}>{row.uhid || "—"}</td>
                          <td style={{ padding: "10px 14px", color: accentGlow, fontFamily: "'JetBrains Mono', monospace", borderRight: `1px solid ${borderLight}`, fontWeight: 600 }}>{row.claimId || "—"}</td>
                          <td style={{ padding: "10px 14px", color: "#334155", borderRight: `1px solid ${borderLight}`, fontFamily: "'JetBrains Mono', monospace" }}>{row.ipdNo || "—"}</td>
                          <td style={{ padding: "10px 14px", color: "#0c1a2e", fontWeight: 700, borderRight: `1px solid ${borderLight}` }}>{row.patientName || "—"}</td>
                          <td style={{ padding: "10px 14px", color: "#64748b", fontSize: 11, borderRight: `1px solid ${borderLight}`, fontFamily: "'JetBrains Mono', monospace" }}>{row.doa || "—"}</td>
                          <td style={{ padding: "10px 14px", color: "#64748b", fontSize: 11, borderRight: `1px solid ${borderLight}`, fontFamily: "'JetBrains Mono', monospace" }}>{row.dod || "—"}</td>
                          <td style={{ padding: "10px 14px", borderRight: `1px solid ${borderLight}` }}>
                            <span style={{ padding: "3px 10px", borderRadius: 6, background: `rgba(14,165,233,0.1)`, color: accent, fontSize: 10, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{row.uploadDate || "—"}</span>
                          </td>
                          <td style={{ padding: "10px 14px", color: "#334155", borderRight: `1px solid ${borderLight}` }}>{row.hospital || "—"}</td>
                          <td style={{ padding: "10px 14px", color: "#334155", borderRight: `1px solid ${borderLight}` }}>{row.prepareBy || "—"}</td>
                          <td style={{ padding: "10px 14px", color: "#64748b", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", borderRight: `1px solid ${borderLight}` }}>{row.remarks || "—"}</td>
                          <td style={{ padding: "10px 14px", color: "#334155" }}>{row.addedBy || "—"}</td>
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