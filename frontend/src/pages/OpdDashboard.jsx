import { useState, useEffect } from "react";
import * as XLSX from "xlsx";

// ─── Columns from screenshot: S.No. | Claim ID | OPD No. | Patient Name | OPD Date | UploadDate | Hospital | PrepareBy | Remarks | AddedBy
const COLUMNS = [
  { key: "sNo",         label: "S.No.",        width: 60,  readOnly: true },
  { key: "claimId",     label: "Claim ID",      width: 130 },
  { key: "opdNo",       label: "OPD No.",       width: 120 },
  { key: "patientName", label: "Patient Name",  width: 180 },
  { key: "opdDate",     label: "OPD Date",      width: 130, type: "date" },
  { key: "uploadDate",  label: "UploadDate",    width: 130, type: "date" },
  { key: "hospital",    label: "Hospital",      width: 160 },
  { key: "prepareBy",   label: "PrepareBy",     width: 140 },
  { key: "remarks",     label: "Remarks",       width: 200 },
  { key: "addedBy",     label: "AddedBy",       width: 130 },
];

const STORAGE_KEY = "sangi_opd_entries";
const accent      = "#f87171"; // red — OPD dept color

const blankRow = (sNo) => ({
  id: crypto.randomUUID(),
  sNo,
  claimId: "",
  opdNo: "",
  patientName: "",
  opdDate: "",
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

export default function OpdDashboard({ currentUser, onLogout }) {
  const today = todayStr();

  const [allEntries, setAllEntries] = useState(() => {
    try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
  });

  const [rows, setRows] = useState(() => {
    const existing = (() => { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; } })();
    const todayRows = existing.filter(e => e.createdAt?.slice(0, 10) === todayStr());
    return todayRows.length > 0 ? todayRows : Array.from({ length: 10 }, (_, i) => blankRow(i + 1));
  });

  const [filterMode, setFilterMode]   = useState("today");
  const [customStart, setCustomStart] = useState(today);
  const [customEnd, setCustomEnd]     = useState(today);
  const [viewTab, setViewTab]         = useState("entry");
  const [savedAt, setSavedAt]         = useState(null);
  const [hasUnsaved, setHasUnsaved]   = useState(false);


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
    const filled = rows.filter(r => r.claimId || r.opdNo || r.patientName);
    if (!filled.length) return;
    setAllEntries(prev => {
      const withoutToday = prev.filter(e => e.createdAt?.slice(0, 10) !== today);
      return [...withoutToday, ...filled];
    });
    setSavedAt(new Date().toLocaleTimeString());
    setHasUnsaved(false);
  };

  const filteredEntries = (() => {
    let start, end;
    if (filterMode === "today")       { start = today; end = today; }
    else if (filterMode === "week")   { ({ start, end } = weekRange()); }
    else if (filterMode === "month")  { ({ start, end } = monthRange()); }
    else if (filterMode === "year")   { ({ start, end } = yearRange()); }
    else                              { start = customStart; end = customEnd; }
    return allEntries.filter(e => { const d = e.createdAt?.slice(0, 10) || ""; return d >= start && d <= end; })
      .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
  })();

  const handleDownload = () => {
    const data = filteredEntries.length > 0 ? filteredEntries : rows.filter(r => r.claimId || r.opdNo || r.patientName);
    const wsData = [
      ["SANGI OPD", "", "", "", "", "", "", "", "", ""],
      ["S.No.", "Claim ID", "OPD No.", "Patient Name", "OPD Date", "UploadDate", "Hospital", "PrepareBy", "Remarks", "AddedBy"],
      ...data.map((r, i) => [i + 1, r.claimId, r.opdNo, r.patientName, r.opdDate, r.uploadDate, r.hospital, r.prepareBy, r.remarks, r.addedBy]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = [8, 15, 15, 22, 14, 14, 20, 16, 24, 16].map(w => ({ wch: w }));
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "OPD Log");
    const label = filterMode === "custom" ? `${customStart}_${customEnd}` : filterMode;
    XLSX.writeFile(wb, `Sangi_OPD_${label}_${today}.xlsx`);
  };

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

  const todayCount  = allEntries.filter(e => e.createdAt?.slice(0, 10) === today).length;
  const weekCount   = (() => { const { start, end } = weekRange(); return allEntries.filter(e => { const d = e.createdAt?.slice(0,10)||""; return d>=start&&d<=end; }).length; })();
  const monthCount  = (() => { const { start, end } = monthRange(); return allEntries.filter(e => { const d = e.createdAt?.slice(0,10)||""; return d>=start&&d<=end; }).length; })();
  const filledToday = rows.filter(r => r.claimId || r.opdNo || r.patientName).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#060a10", color: "#e2e8f0", fontFamily: "'IBM Plex Mono','Courier New',monospace", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e2a3a; border-radius: 3px; }
        .ogrid-cell:focus { outline: 2px solid ${accent}; outline-offset: -2px; background: #1a0505 !important; z-index: 2; position: relative; }
        .ogrid-cell { transition: background 0.1s; }
        .ogrid-cell:hover { background: #100505 !important; }
        .otab-btn:hover { color: #e2e8f0 !important; }
        .ofilter-chip:hover { border-color: ${accent} !important; color: ${accent} !important; }
        .oaction-btn:hover { filter: brightness(1.15); }
        .orow-remove { opacity: 0; transition: opacity 0.15s; }
        tr:hover .orow-remove { opacity: 1; }
        @keyframes ofadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .ofade-in { animation: ofadeIn 0.3s ease; }
        @keyframes opulse { 0%,100%{opacity:1}50%{opacity:.35} }
      `}</style>

      {/* Topbar */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", height: 58, borderBottom: "1px solid #16202e", background: "#0b1018", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: `${accent}25`, border: `1px solid ${accent}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: accent, fontWeight: 700 }}>🏥</div>
          <div>
            <div style={{ fontSize: 9, letterSpacing: "3px", color: "#374151", textTransform: "uppercase" }}>Sangi Hospital</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>OPD Department</div>
          </div>
          <div style={{ marginLeft: 12, padding: "3px 12px", borderRadius: 20, background: `${accent}18`, border: `1px solid ${accent}40`, fontSize: 10, color: accent, letterSpacing: "1px" }}>{today}</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {[{ label: "Today", val: todayCount, col: "#34d399" }, { label: "This Week", val: weekCount, col: accent }, { label: "This Month", val: monthCount, col: "#f59e0b" }].map(({ label, val, col }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, background: `${col}12`, border: `1px solid ${col}30`, fontSize: 11 }}>
              <span style={{ color: col, fontWeight: 700 }}>{val}</span>
              <span style={{ color: "#374151" }}>{label}</span>
            </div>
          ))}
          {currentUser && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 8, paddingLeft: 12, borderLeft: "1px solid #16202e" }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: `${accent}20`, border: `1px solid ${accent}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: accent, fontWeight: 700 }}>{currentUser.name?.[0] || "O"}</div>
              <div>
                <div style={{ fontSize: 11, color: "#e2e8f0", fontWeight: 600 }}>{currentUser.name}</div>
                <div style={{ fontSize: 9, color: "#374151", letterSpacing: "1px", textTransform: "uppercase" }}>OPD Staff</div>
              </div>
              <button onClick={onLogout} style={{ marginLeft: 6, padding: "5px 12px", borderRadius: 6, background: "#1a0a0a", border: "1px solid #3d1515", color: "#ef4444", fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>⎋ Logout</button>
            </div>
          )}
        </div>
      </header>

      {/* Sub-nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", height: 46, borderBottom: "1px solid #16202e", background: "#0b1018", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 4 }}>
          {[{ id: "entry", label: "📋 Daily Entry" }, { id: "records", label: "🗂 Records & Export" }].map(tab => (
            <button key={tab.id} className="otab-btn" onClick={() => setViewTab(tab.id)}
              style={{ padding: "6px 18px", borderRadius: "6px 6px 0 0", fontSize: 11, fontFamily: "inherit", cursor: "pointer", border: "none", background: viewTab === tab.id ? "#1a0505" : "transparent", color: viewTab === tab.id ? accent : "#374151", borderBottom: viewTab === tab.id ? `2px solid ${accent}` : "2px solid transparent", letterSpacing: "0.5px", transition: "all 0.15s" }}>
              {tab.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {viewTab === "entry" && (
            <>
              {hasUnsaved && <div style={{ fontSize: 10, color: "#f59e0b", animation: "opulse 2s infinite" }}>● Unsaved changes</div>}
              {savedAt && !hasUnsaved && <div style={{ fontSize: 10, color: "#34d399" }}>✓ Saved at {savedAt}</div>}
              <button className="oaction-btn" onClick={() => addRows(5)} style={{ padding: "5px 14px", borderRadius: 6, fontSize: 10, fontFamily: "inherit", cursor: "pointer", background: "#0f172a", border: "1px solid #1e2a3a", color: "#64748b" }}>+ 5 Rows</button>
              <button className="oaction-btn" onClick={handleSave} style={{ padding: "5px 16px", borderRadius: 6, fontSize: 11, fontFamily: "inherit", cursor: "pointer", background: accent, border: `1px solid ${accent}`, color: "#fff", fontWeight: 700 }}>💾 Save</button>
              <button className="oaction-btn" onClick={handleDownload} style={{ padding: "5px 14px", borderRadius: 6, fontSize: 10, fontFamily: "inherit", cursor: "pointer", background: "#064e3b", border: "1px solid #065f46", color: "#34d399" }}>↓ Export Today</button>
            </>
          )}
          {viewTab === "records" && (
            <button className="oaction-btn" onClick={handleDownload} style={{ padding: "5px 18px", borderRadius: 6, fontSize: 11, fontFamily: "inherit", cursor: "pointer", background: "#064e3b", border: "1px solid #065f46", color: "#34d399", fontWeight: 700 }}>↓ Download Excel</button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>

        {/* ENTRY TAB */}
        {viewTab === "entry" && (
          <div style={{ flex: 1, overflow: "auto", padding: "20px 28px" }} className="ofade-in">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, padding: "12px 18px", background: "#0b1018", border: `1px solid ${accent}30`, borderRadius: 10, borderLeft: `4px solid ${accent}` }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9" }}>Today's OPD Log — {today}</div>
                <div style={{ fontSize: 10, color: "#374151", marginTop: 3 }}>{filledToday} of {rows.length} rows filled · Tab to move right · Enter to move down</div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: accent }}>{filledToday}</div>
            </div>

            <div style={{ overflowX: "auto", background: "#0b1018", border: "1px solid #16202e", borderRadius: 10, overflow: "hidden" }}>
              <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#080f18" }}>
                    {COLUMNS.map(col => (
                      <th key={col.key} style={{ padding: "10px 12px", textAlign: "left", fontSize: 8, letterSpacing: "2px", color: "#374151", textTransform: "uppercase", borderBottom: "2px solid #16202e", whiteSpace: "nowrap", minWidth: col.width, fontFamily: "inherit", fontWeight: 600, borderRight: "1px solid #0d1520" }}>
                        {col.label}
                      </th>
                    ))}
                    <th style={{ padding: "10px 8px", fontSize: 8, color: "#374151", borderBottom: "2px solid #16202e", borderRight: "1px solid #0d1520" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIdx) => {
                    const filled = !!(row.claimId || row.opdNo || row.patientName);
                    return (
                      <tr key={row.id} style={{ background: filled ? "#0a0f1a" : "transparent", borderBottom: "1px solid #0d1520" }}>
                        {COLUMNS.map(col => (
                          <td key={col.key} style={{ padding: 0, borderRight: "1px solid #0d1520" }}>
                            {col.readOnly ? (
                              <div style={{ padding: "8px 12px", color: "#2d3d52", fontSize: 11, userSelect: "none" }}>{row[col.key]}</div>
                            ) : (
                              <input
                                id={`cell-${rowIdx}-${col.key}`}
                                className="ogrid-cell"
                                type={col.type || "text"}
                                value={row[col.key] || ""}
                                onChange={e => updateRow(row.id, col.key, e.target.value)}
                                onKeyDown={e => handleKeyDown(e, rowIdx, col.key)}

                                style={{ width: "100%", padding: "9px 12px", background: "transparent", border: "none", color: col.key === "patientName" ? "#e2e8f0" : "#94a3b8", fontSize: 11, fontFamily: "inherit", outline: "none", minWidth: col.width, cursor: "text" }}
                                placeholder={col.type === "date" ? "yyyy-mm-dd" : "—"}
                              />
                            )}
                          </td>
                        ))}
                        <td style={{ padding: "0 8px", borderRight: "1px solid #0d1520", textAlign: "center" }}>
                          <button className="orow-remove" onClick={() => removeRow(row.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14, padding: "0 4px", fontFamily: "inherit" }}>✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button onClick={() => addRows(1)} style={{ marginTop: 12, padding: "8px 20px", borderRadius: 8, background: "transparent", border: `1px dashed ${accent}40`, color: accent, fontSize: 11, cursor: "pointer", fontFamily: "inherit", width: "100%", letterSpacing: "1px" }}>+ Add Row</button>
          </div>
        )}

        {/* RECORDS TAB */}
        {viewTab === "records" && (
          <div style={{ flex: 1, overflow: "auto", padding: "20px 28px" }} className="ofade-in">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, padding: "14px 18px", background: "#0b1018", border: "1px solid #16202e", borderRadius: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 9, color: "#374151", letterSpacing: "2px", textTransform: "uppercase", marginRight: 4 }}>Period:</span>
              {[{ id: "today", label: "Today" }, { id: "week", label: "This Week" }, { id: "month", label: "This Month" }, { id: "year", label: "This Year" }, { id: "custom", label: "Custom" }].map(f => (
                <button key={f.id} className="ofilter-chip" onClick={() => setFilterMode(f.id)}
                  style={{ padding: "5px 14px", borderRadius: 20, fontSize: 10, fontFamily: "inherit", cursor: "pointer", background: filterMode === f.id ? `${accent}20` : "transparent", border: `1px solid ${filterMode === f.id ? accent : "#1e2a3a"}`, color: filterMode === f.id ? accent : "#4a5568", letterSpacing: "0.5px", transition: "all 0.15s" }}>
                  {f.label}
                </button>
              ))}
              {filterMode === "custom" && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 8 }}>
                  <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} style={{ background: "#060a10", border: "1px solid #1e2a3a", color: "#94a3b8", padding: "5px 10px", borderRadius: 6, fontSize: 11, fontFamily: "inherit", outline: "none" }} />
                  <span style={{ color: "#374151", fontSize: 10 }}>to</span>
                  <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} style={{ background: "#060a10", border: "1px solid #1e2a3a", color: "#94a3b8", padding: "5px 10px", borderRadius: 6, fontSize: 11, fontFamily: "inherit", outline: "none" }} />
                </div>
              )}
              <div style={{ marginLeft: "auto", padding: "4px 14px", borderRadius: 20, background: `${accent}15`, border: `1px solid ${accent}30`, fontSize: 11, color: accent, fontWeight: 700 }}>{filteredEntries.length} records</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
              {[
                { label: "Total Records",    val: filteredEntries.length,                                          col: accent },
                { label: "Unique Patients",  val: new Set(filteredEntries.map(e => e.patientName)).size,           col: "#34d399" },
                { label: "Unique Hospitals", val: new Set(filteredEntries.map(e => e.hospital).filter(Boolean)).size, col: "#f59e0b" },
                { label: "Days Covered",     val: new Set(filteredEntries.map(e => e.createdAt?.slice(0,10))).size, col: "#818cf8" },
              ].map(({ label, val, col }) => (
                <div key={label} style={{ background: "#0b1018", border: "1px solid #16202e", borderTop: `3px solid ${col}`, borderRadius: 10, padding: "14px 16px", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, right: 0, width: 70, height: 70, borderRadius: "50%", background: `${col}08`, transform: "translate(30%,-30%)" }} />
                  <div style={{ fontSize: 8, letterSpacing: "2px", color: "#374151", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: col, lineHeight: 1 }}>{val}</div>
                </div>
              ))}
            </div>

            {filteredEntries.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#1e2a3a", fontSize: 12, letterSpacing: "2px", background: "#0b1018", border: "1px solid #16202e", borderRadius: 10 }}>NO RECORDS FOUND FOR THIS PERIOD</div>
            ) : (
              <div style={{ background: "#0b1018", border: "1px solid #16202e", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: "#080f18" }}>
                        {COLUMNS.map(col => (
                          <th key={col.key} style={{ padding: "10px 14px", textAlign: "left", fontSize: 8, letterSpacing: "2px", color: "#374151", textTransform: "uppercase", borderBottom: "2px solid #16202e", whiteSpace: "nowrap", fontFamily: "inherit", fontWeight: 600, borderRight: "1px solid #0d1520" }}>{col.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEntries.map((row, i) => (
                        <tr key={row.id || i} style={{ borderBottom: "1px solid #0d1520" }}>
                          <td style={{ padding: "10px 14px", color: "#2d3d52", fontSize: 10, borderRight: "1px solid #0d1520" }}>{i + 1}</td>
                          <td style={{ padding: "10px 14px", color: accent, borderRight: "1px solid #0d1520" }}>{row.claimId || "—"}</td>
                          <td style={{ padding: "10px 14px", color: "#94a3b8", borderRight: "1px solid #0d1520" }}>{row.opdNo || "—"}</td>
                          <td style={{ padding: "10px 14px", color: "#e2e8f0", fontWeight: 600, borderRight: "1px solid #0d1520" }}>{row.patientName || "—"}</td>
                          <td style={{ padding: "10px 14px", color: "#64748b", fontSize: 11, borderRight: "1px solid #0d1520" }}>{row.opdDate || "—"}</td>
                          <td style={{ padding: "10px 14px", borderRight: "1px solid #0d1520" }}>
                            <span style={{ padding: "2px 8px", borderRadius: 4, background: `${accent}15`, color: accent, fontSize: 10 }}>{row.uploadDate || "—"}</span>
                          </td>
                          <td style={{ padding: "10px 14px", color: "#94a3b8", borderRight: "1px solid #0d1520" }}>{row.hospital || "—"}</td>
                          <td style={{ padding: "10px 14px", color: "#94a3b8", borderRight: "1px solid #0d1520" }}>{row.prepareBy || "—"}</td>
                          <td style={{ padding: "10px 14px", color: "#64748b", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", borderRight: "1px solid #0d1520" }}>{row.remarks || "—"}</td>
                          <td style={{ padding: "10px 14px", color: "#94a3b8" }}>{row.addedBy || "—"}</td>
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