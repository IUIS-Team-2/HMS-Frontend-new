import { useState, useEffect, useRef } from "react";

// ── SheetJS for Excel export (loaded via CDN script tag in index.html or inline import)
// Usage: import * as XLSX from 'xlsx'  — listed as available in env  
import * as XLSX from "xlsx";
import { apiService } from "../services/apiService";

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

const DEPARTMENT = "uploading";
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

function entryDate(entry) {
  return entry.uploadDate || entry.createdAt?.slice(0, 10) || entry.doa || entry.dod || "";
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function UploadingDashboard({ currentUser, onLogout }) {
  const today = todayStr();
  const accent = "#818cf8";

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
  const [activeCell, setActiveCell]   = useState(null);
  const [savedAt, setSavedAt]         = useState(null);
  const [hasUnsaved, setHasUnsaved]   = useState(false);
  const [syncError, setSyncError]     = useState("");

  // 1. Load from Django Backend (Your Code)
  useEffect(() => {
    let active = true;
    const loadEntries = async () => {
      try {
        setSyncError("");
        const response = await apiService.getDepartmentLogs(DEPARTMENT);
        const normalized = (Array.isArray(response) ? response : []).map((entry, index) => ({
          id: entry.id ? `uploading-${entry.id}` : crypto.randomUUID(),
          ...entry.data,
          createdAt: entry.data?.createdAt || `${entry.record_date}T00:00:00`,
          sNo: index + 1,
        }));
        if (!active) return;
        setAllEntries(normalized);
        const todayRows = normalized.filter(entry => entryDate(entry) === today);
        setRows(todayRows.length ? todayRows.map((entry, index) => ({ ...entry, sNo: index + 1 })) : Array.from({ length: 10 }, (_, i) => blankRow(i + 1)));
      } catch (error) {
        if (!active) return;
        setSyncError("Unable to load saved uploading logs.");
      }
    };
    loadEntries();
    return () => { active = false; };
  }, [today]);

  // 2. Backup to LocalStorage (Frontend Dev's Code)
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(allEntries)); } catch {} }, [allEntries]);

  // Mark unsaved on row change
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

const handleSave = async () => {
    const filled = rows
      .filter(r => r.uhid || r.claimId || r.ipdNo || r.patientName) // Kept their uhid check
      .map((row, index) => ({
        ...row,
        sNo: index + 1,
        uploadDate: row.uploadDate || today,
        addedBy: row.addedBy || currentUser?.name || "",
        createdAt: row.createdAt || new Date().toISOString(),
      }));
    if (filled.length === 0) return;

    try {
      setSyncError("");
      await apiService.saveDepartmentLogs(DEPARTMENT, filled); // Kept your Backend save
      setAllEntries(prev => {
        const withoutToday = prev.filter(entry => entryDate(entry) !== today);
        return [...withoutToday, ...filled];
      });
      setSavedAt(new Date().toLocaleTimeString());
      setHasUnsaved(false);
    } catch (error) {
      setSyncError("Save failed. Uploading logs were not synced.");
    }
  };

  const filteredEntries = (() => {
    let start, end;
    if (filterMode === "today")      { start = today; end = today; }
    else if (filterMode === "week")  { ({ start, end } = weekRange()); }
    else if (filterMode === "month") { ({ start, end } = monthRange()); }
    else if (filterMode === "year")  { ({ start, end } = yearRange()); }
    else { start = customStart; end = customEnd; }

    return allEntries.filter(e => {
      const d = entryDate(e);
      return d >= start && d <= end;
    }).sort((a, b) => (a.uploadDate || "").localeCompare(b.uploadDate || ""));
  })();

  // ── Excel Download ────────────────────────────────────────────────────────────
  const handleDownload = () => {
    const data = filteredEntries.length > 0 ? filteredEntries : rows.filter(r => r.claimId || r.ipdNo || r.patientName);

    const wsData = [
      ["SANGI UPLOADING", "", "", "", "", "", "", "", "", "", ""],
      ["S.No.", "Claim ID", "IPD No.", "Patient Name", "DOA", "DOD", "Upload Date", "Hospital", "Prepare By", "Remarks", "Added By"],
      ...data.map((r, i) => [
        i + 1,
        r.claimId,
        r.ipdNo,
        r.patientName,
        r.doa,
        r.dod,
        r.uploadDate,
        r.hospital,
        r.prepareBy,
        r.remarks,
        r.addedBy,
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Column widths
    ws["!cols"] = [8, 15, 15, 22, 14, 14, 14, 20, 16, 24, 16].map(w => ({ wch: w }));

    // Merge title row
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 10 } }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Uploading Log");

    const label = filterMode === "custom" ? `${customStart}_${customEnd}` : filterMode;
    XLSX.writeFile(wb, `Sangi_Uploading_${label}_${today}.xlsx`);
  };

  // ── Stats ─────────────────────────────────────────────────────────────────────
  const todayCount   = allEntries.filter(e => entryDate(e) === today).length;
  const weekCount    = (() => { const { start, end } = weekRange(); return allEntries.filter(e => { const d = entryDate(e); return d >= start && d <= end; }).length; })();
  const monthCount   = (() => { const { start, end } = monthRange(); return allEntries.filter(e => { const d = entryDate(e); return d >= start && d <= end; }).length; })();
  const filledToday  = rows.filter(r => r.claimId || r.ipdNo || r.patientName).length;

  // ── Keyboard nav: Tab moves right, Enter moves down ──────────────────────────
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

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#f5f3ff", color: "#1e1b4b", fontFamily: "'Inter', 'Segoe UI', sans-serif", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #ede9fe; }
        ::-webkit-scrollbar-thumb { background: #a78bfa; border-radius: 3px; }
        .ugrid-cell:focus { outline: 2px solid ${accent}; outline-offset: -2px; background: #ede9fe !important; z-index: 2; position: relative; }
        .ugrid-cell { transition: background 0.1s; font-family: 'DM Mono', monospace; }
        .ugrid-cell:hover { background: #f5f3ff !important; }
        .utab-btn:hover { color: ${accent} !important; background: #ede9fe !important; }
        .ufilter-chip:hover { border-color: ${accent} !important; color: ${accent} !important; background: #ede9fe !important; }
        .uaction-btn:hover { filter: brightness(1.08); transform: translateY(-1px); }
        .urow-remove { opacity: 0; transition: opacity 0.15s; }
        tr:hover .urow-remove { opacity: 1; }
        tr:hover td { background: #ede9fe !important; }
        @keyframes ufadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .ufade-in { animation: ufadeIn 0.3s ease; }
        @keyframes upulse { 0%,100%{opacity:1}50%{opacity:.4} }
      `}</style>

      {/* Topbar */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", height: 62, borderBottom: "2px solid #ddd6fe", background: "#ffffff", flexShrink: 0, boxShadow: "0 2px 12px #818cf815" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg, ${accent}, #6366f1)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#fff", fontWeight: 700, boxShadow: `0 4px 12px ${accent}50` }}>↑</div>
          <div>
            <div style={{ fontSize: 9, letterSpacing: "4px", color: "#a78bfa", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>Sangi Hospital</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1e1b4b", letterSpacing: "-0.3px" }}>Uploading Department</div>
          </div>
          <div style={{ marginLeft: 10, padding: "4px 14px", borderRadius: 20, background: "#ede9fe", border: `1.5px solid ${accent}`, fontSize: 10, color: accent, fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>{today}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {[{ label: "Today", val: todayCount, col: "#10b981" }, { label: "This Week", val: weekCount, col: accent }, { label: "This Month", val: monthCount, col: "#f59e0b" }].map(({ label, val, col }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 20, background: `${col}12`, border: `1.5px solid ${col}40`, fontSize: 11 }}>
              <span style={{ color: col, fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{val}</span>
              <span style={{ color: "#6b7280", fontWeight: 600 }}>{label}</span>
            </div>
          ))}
          {currentUser && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 8, paddingLeft: 14, borderLeft: "2px solid #ddd6fe" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${accent}20`, border: `1.5px solid ${accent}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: accent, fontWeight: 700 }}>{currentUser.name?.[0] || "U"}</div>
              <div>
                <div style={{ fontSize: 12, color: "#1e1b4b", fontWeight: 700 }}>{currentUser.name}</div>
                <div style={{ fontSize: 9, color: "#a78bfa", letterSpacing: "1.5px", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>Uploader</div>
              </div>
              <button onClick={onLogout} style={{ marginLeft: 6, padding: "5px 14px", borderRadius: 8, background: "#fff1f2", border: "1.5px solid #fecaca", color: "#ef4444", fontSize: 10, cursor: "pointer", fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>⎋ Logout</button>
            </div>
          )}
        </div>
      </header>

      {/* Sub-nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", height: 48, borderBottom: "1.5px solid #ddd6fe", background: "#f5f3ff", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 4 }}>
          {[{ id: "entry", label: "📋 Daily Entry" }, { id: "records", label: "🗂 Records" }].map(tab => (
            <button key={tab.id} className="utab-btn" onClick={() => setViewTab(tab.id)}
              style={{ padding: "7px 20px", borderRadius: "8px 8px 0 0", fontSize: 12, fontFamily: "'Inter', sans-serif", cursor: "pointer", border: "none", background: viewTab === tab.id ? "#ffffff" : "transparent", color: viewTab === tab.id ? accent : "#9ca3af", borderBottom: viewTab === tab.id ? `3px solid ${accent}` : "3px solid transparent", fontWeight: viewTab === tab.id ? 700 : 600, transition: "all 0.15s" }}>
              {tab.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {viewTab === "entry" && (
            <>
{syncError && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "#f87171", fontWeight: 600 }}>
                  {syncError}
                </div>
              )}
              {hasUnsaved && (
                <div style={{ fontSize: 10, color: "#f59e0b", animation: "upulse 2s infinite", fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>
                  ● Unsaved changes
                </div>
              )}
              {savedAt && !hasUnsaved && (
                <div style={{ fontSize: 10, color: "#10b981", fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>
                  ✓ Saved at {savedAt}
                </div>
              )}
              <button className="uaction-btn" onClick={() => addRows(5)} 
                style={{ padding: "6px 16px", borderRadius: 8, fontSize: 11, fontFamily: "'Inter', sans-serif", cursor: "pointer", background: "#fff", border: "1.5px solid #ddd6fe", color: "#6b7280", fontWeight: 600 }}>
                + 5 Rows
              </button>
              <button className="uaction-btn" onClick={handleSave} 
                style={{ padding: "6px 20px", borderRadius: 8, fontSize: 12, fontFamily: "'Inter', sans-serif", cursor: "pointer", background: `linear-gradient(135deg, ${accent}, #6366f1)`, border: "none", color: "#fff", fontWeight: 700, boxShadow: `0 4px 14px ${accent}50` }}>
                💾 Save
              </button>
              <button className="uaction-btn" onClick={handleDownload}
                style={{ padding: "6px 16px", borderRadius: 8, fontSize: 11, fontFamily: "'Inter', sans-serif", cursor: "pointer", background: "#064e3b", border: "1.5px solid #065f46", color: "#34d399", fontWeight: 600 }}>
                ↓ Export Today
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>

        {viewTab === "entry" && (
          <div style={{ flex: 1, overflow: "auto", padding: "20px 28px" }} className="ufade-in">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, padding: "14px 20px", background: "#ffffff", border: `1.5px solid ${accent}40`, borderRadius: 12, borderLeft: `5px solid ${accent}`, boxShadow: "0 2px 8px #818cf810" }}>
              <div>
<div style={{ fontSize: 13, fontWeight: 700, color: "#1e1b4b" }}>Today's Uploading Log — {today}</div>
                <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 3, fontFamily: "'DM Mono', monospace" }}>
                  {filledToday} of {rows.length} rows filled · Tab to move right · Enter to move down · Synced to backend
                </div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: accent, fontFamily: "'DM Mono', monospace" }}>{filledToday}</div>
            </div>

            <div style={{ overflowX: "auto", background: "#ffffff", border: "1.5px solid #ddd6fe", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 12px #818cf808" }}>
              <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#ede9fe" }}>
                    {COLUMNS.map(col => (
                      <th key={col.key} style={{ padding: "11px 14px", textAlign: "left", fontSize: 9, letterSpacing: "2px", color: "#7c3aed", textTransform: "uppercase", borderBottom: "2px solid #ddd6fe", whiteSpace: "nowrap", minWidth: col.width, fontFamily: "'Inter', sans-serif", fontWeight: 700, borderRight: "1px solid #ddd6fe" }}>
                        {col.label}
                      </th>
                    ))}
                    <th style={{ padding: "11px 8px", fontSize: 9, color: "#7c3aed", borderBottom: "2px solid #ddd6fe", borderRight: "1px solid #ddd6fe" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIdx) => {
                    const filled = !!(row.uhid || row.claimId || row.ipdNo || row.patientName);
                    return (
                      <tr key={row.id} style={{ background: filled ? "#f5f3ff" : "#ffffff", borderBottom: "1px solid #ede9fe" }}>
                        {COLUMNS.map(col => (
                          <td key={col.key} style={{ padding: 0, borderRight: "1px solid #ede9fe" }}>
                            {col.readOnly ? (
                              <div style={{ padding: "9px 14px", color: "#c4b5fd", fontSize: 11, userSelect: "none", fontFamily: "'DM Mono', monospace" }}>{row[col.key]}</div>
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
                                style={{ 
                                  width: "100%", 
                                  padding: "10px 14px", 
                                  background: "transparent", 
                                  border: "none", 
                                  color: col.key === "patientName" ? "#1e1b4b" : "#374151", 
                                  fontSize: 11, 
                                  fontFamily: "'DM Mono', monospace", 
                                  outline: "none", 
                                  minWidth: col.width, 
                                  cursor: "text", 
                                  fontWeight: col.key === "patientName" ? 600 : 400 
                                }}
                                placeholder={col.type === "date" ? "yyyy-mm-dd" : "—"}
                              />
                            )}
                          </td>
                        ))}
                        <td style={{ padding: "0 8px", borderRight: "1px solid #ede9fe", textAlign: "center" }}>
                          <button className="urow-remove" onClick={() => removeRow(row.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14, padding: "0 4px" }}>✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button onClick={() => addRows(1)} style={{ marginTop: 14, padding: "10px 20px", borderRadius: 10, background: "transparent", border: `1.5px dashed ${accent}60`, color: accent, fontSize: 12, cursor: "pointer", fontFamily: "'Inter', sans-serif", fontWeight: 700, width: "100%" }}>+ Add Row</button>
          </div>
        )}

        {viewTab === "records" && (
          <div style={{ flex: 1, overflow: "auto", padding: "20px 28px" }} className="ufade-in">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, padding: "14px 20px", background: "#ffffff", border: "1.5px solid #ddd6fe", borderRadius: 12, flexWrap: "wrap", boxShadow: "0 2px 8px #818cf808" }}>
              <span style={{ fontSize: 9, color: "#a78bfa", letterSpacing: "2.5px", textTransform: "uppercase", marginRight: 4, fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>Period:</span>
              {[{ id: "today", label: "Today" }, { id: "week", label: "This Week" }, { id: "month", label: "This Month" }, { id: "year", label: "This Year" }, { id: "custom", label: "Custom" }].map(f => (
                <button key={f.id} className="ufilter-chip" onClick={() => setFilterMode(f.id)}
                  style={{ padding: "6px 16px", borderRadius: 20, fontSize: 11, fontFamily: "'Inter', sans-serif", cursor: "pointer", background: filterMode === f.id ? `${accent}15` : "#f9fafb", border: `1.5px solid ${filterMode === f.id ? accent : "#ddd6fe"}`, color: filterMode === f.id ? accent : "#6b7280", fontWeight: filterMode === f.id ? 700 : 600, transition: "all 0.15s" }}>
                  {f.label}
                </button>
              ))}
              {filterMode === "custom" && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 8 }}>
                  <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} style={{ background: "#f5f3ff", border: "1.5px solid #c4b5fd", color: "#1e1b4b", padding: "6px 12px", borderRadius: 8, fontSize: 11, fontFamily: "'DM Mono', monospace", outline: "none" }} />
                  <span style={{ color: "#9ca3af", fontSize: 10 }}>to</span>
                  <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} style={{ background: "#f5f3ff", border: "1.5px solid #c4b5fd", color: "#1e1b4b", padding: "6px 12px", borderRadius: 8, fontSize: 11, fontFamily: "'DM Mono', monospace", outline: "none" }} />
                </div>
              )}
              <div style={{ marginLeft: "auto", padding: "5px 16px", borderRadius: 20, background: `${accent}15`, border: `1.5px solid ${accent}`, fontSize: 12, color: accent, fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{filteredEntries.length} records</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
              {[
                { label: "Total Records",    val: filteredEntries.length,                                                  col: accent },
                { label: "Unique Patients",  val: new Set(filteredEntries.map(e => e.patientName)).size,                   col: "#10b981" },
                { label: "Unique Hospitals", val: new Set(filteredEntries.map(e => e.hospital).filter(Boolean)).size,      col: "#f59e0b" },
                { label: "Days Covered",     val: new Set(filteredEntries.map(e => e.uploadDate)).size,                    col: "#f87171" },
              ].map(({ label, val, col }) => (
                <div key={label} style={{ background: "#ffffff", border: "1.5px solid #ddd6fe", borderTop: `4px solid ${col}`, borderRadius: 12, padding: "16px 18px", position: "relative", overflow: "hidden", boxShadow: "0 2px 8px #818cf808" }}>
                  <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, borderRadius: "50%", background: `${col}08`, transform: "translate(30%,-30%)" }} />
                  <div style={{ fontSize: 8, letterSpacing: "2.5px", color: "#9ca3af", textTransform: "uppercase", marginBottom: 8, fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>{label}</div>
                  <div style={{ fontSize: 30, fontWeight: 700, color: col, lineHeight: 1, fontFamily: "'DM Mono', monospace" }}>{val}</div>
                </div>
              ))}
            </div>

            {filteredEntries.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#ddd6fe", fontSize: 12, letterSpacing: "3px", background: "#ffffff", border: "1.5px solid #ddd6fe", borderRadius: 12, fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>NO RECORDS FOUND FOR THIS PERIOD</div>
            ) : (
              <div style={{ background: "#ffffff", border: "1.5px solid #ddd6fe", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 12px #818cf808" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: "#ede9fe" }}>
                        {COLUMNS.map(col => (
                          <th key={col.key} style={{ padding: "11px 14px", textAlign: "left", fontSize: 9, letterSpacing: "2px", color: "#7c3aed", textTransform: "uppercase", borderBottom: "2px solid #ddd6fe", whiteSpace: "nowrap", fontFamily: "'Inter', sans-serif", fontWeight: 700, borderRight: "1px solid #ddd6fe" }}>{col.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEntries.map((row, i) => (
                        <tr key={row.id || i} style={{ borderBottom: "1px solid #ede9fe" }}>
                          <td style={{ padding: "10px 14px", color: "#c4b5fd", fontSize: 10, borderRight: "1px solid #ede9fe", fontFamily: "'DM Mono', monospace" }}>{i + 1}</td>
                          <td style={{ padding: "10px 14px", color: "#0ea5e9", fontFamily: "'DM Mono', monospace", borderRight: "1px solid #ede9fe", fontWeight: 600 }}>{row.uhid || "—"}</td>
                          <td style={{ padding: "10px 14px", color: accent, fontFamily: "'DM Mono', monospace", borderRight: "1px solid #ede9fe", fontWeight: 600 }}>{row.claimId || "—"}</td>
                          <td style={{ padding: "10px 14px", color: "#374151", borderRight: "1px solid #ede9fe", fontFamily: "'DM Mono', monospace" }}>{row.ipdNo || "—"}</td>
                          <td style={{ padding: "10px 14px", color: "#1e1b4b", fontWeight: 700, borderRight: "1px solid #ede9fe" }}>{row.patientName || "—"}</td>
                          <td style={{ padding: "10px 14px", color: "#6b7280", fontSize: 11, borderRight: "1px solid #ede9fe", fontFamily: "'DM Mono', monospace" }}>{row.doa || "—"}</td>
                          <td style={{ padding: "10px 14px", color: "#6b7280", fontSize: 11, borderRight: "1px solid #ede9fe", fontFamily: "'DM Mono', monospace" }}>{row.dod || "—"}</td>
                          <td style={{ padding: "10px 14px", borderRight: "1px solid #ede9fe" }}>
                            <span style={{ padding: "3px 10px", borderRadius: 6, background: `${accent}15`, color: accent, fontSize: 10, fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>{row.uploadDate || "—"}</span>
                          </td>
                          <td style={{ padding: "10px 14px", color: "#374151", borderRight: "1px solid #ede9fe" }}>{row.hospital || "—"}</td>
                          <td style={{ padding: "10px 14px", color: "#374151", borderRight: "1px solid #ede9fe" }}>{row.prepareBy || "—"}</td>
                          <td style={{ padding: "10px 14px", color: "#6b7280", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", borderRight: "1px solid #ede9fe" }}>{row.remarks || "—"}</td>
                          <td style={{ padding: "10px 14px", color: "#374151" }}>{row.addedBy || "—"}</td>
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
