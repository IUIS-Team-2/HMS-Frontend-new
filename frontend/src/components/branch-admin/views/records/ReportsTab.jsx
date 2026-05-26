import React from "react";
import { toast } from "react-toastify";
import { apiService } from "../../../../services/apiService";
import { T, mkBtn } from "../../branchAdminConstants";
import { REPORT_MASTER, REPORT_TYPES, getDefaultTests } from "./recordsConstants";

const inpStyle = { width: "100%", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "13px", padding: "9px 11px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
const STATUS_COLORS = { Normal: "#10b981", High: "#ef4444", Low: "#f59e0b" };

function ReportSearchBar({ onAdd, editableRows }) {
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const wRef = React.useRef(null);
  React.useEffect(() => {
    const h = e => { if (wRef.current && !wRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const filtered = React.useMemo(() => {
    const lq = q.trim().toLowerCase();
    if (!lq) return REPORT_MASTER.slice(0, 20);
    return REPORT_MASTER.filter(r => r.toLowerCase().includes(lq)).slice(0, 20);
  }, [q]);
  const addReport = name => {
    onAdd({ _localId: `r-new-${Date.now()}`, reportName: name, reportType: "Haematology", date: new Date().toISOString().slice(0,10), orderedBy: editableRows[0]?.orderedBy || "", remarks: "", impression: "", amount: 0, tests: getDefaultTests(name) });
    setQ(""); setOpen(false);
  };
  return (
    <div ref={wRef} style={{ position: "relative", marginBottom: 14 }}>
      <input value={q} placeholder="🔍 Search & add report from master list…" onChange={e => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} style={{ ...inpStyle, width: "100%", boxSizing: "border-box" }} />
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 99999, maxHeight: 260, overflowY: "auto", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, boxShadow: "0 12px 32px rgba(0,0,0,0.18)" }}>
          {filtered.length === 0 && <div style={{ padding: "10px 14px", fontSize: 12, color: "#94a3b8" }}>No match — click below to add custom</div>}
          {filtered.map((name, i) => (
            <div key={i} onClick={() => addReport(name)} style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f1f5f9", fontSize: 13, color: "#0f172a" }} onMouseEnter={e => e.currentTarget.style.background="#f0f9ff"} onMouseLeave={e => e.currentTarget.style.background=""}>+ {name}</div>
          ))}
          {q.trim() && !REPORT_MASTER.some(r => r.toLowerCase() === q.trim().toLowerCase()) && (
            <div onClick={() => addReport(q.trim())} style={{ padding: "10px 14px", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#3b82f6", background: "#eff6ff", borderTop: "1px solid #bfdbfe" }} onMouseEnter={e => e.currentTarget.style.background="#dbeafe"} onMouseLeave={e => e.currentTarget.style.background="#eff6ff"}>+ Add "{q.trim()}" as custom report</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ReportsTab({ editableRows, setEditableRows, updateEditableField, addEditableRow, removeEditableRow, canEditRecords, theme, selPatient, selectedAdmission }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {canEditRecords && <ReportSearchBar onAdd={addEditableRow} editableRows={editableRows} />}
      {!editableRows.length && (
        <div style={{ padding: "32px", textAlign: "center", color: T.textMuted, fontStyle: "italic", border: `1px dashed ${T.border}`, borderRadius: 10 }}>
          No reports found.{canEditRecords ? " Use the search above to add one." : ""}
        </div>
      )}
      {editableRows.map((rep, ri) => (
        <div key={rep._localId || ri} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ background: "linear-gradient(135deg,#0f172a,#1e3a5f)", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1 }}>
              {canEditRecords
                ? <input value={rep.reportName || ""} placeholder="Report Name" onChange={e => updateEditableField(ri, "reportName", e.target.value)} style={{ background: "transparent", border: "none", borderBottom: "1.5px solid rgba(255,255,255,.3)", outline: "none", color: "#fff", fontFamily: "inherit", fontSize: 14, fontWeight: 700, width: "100%", paddingBottom: 2 }} />
                : <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{rep.reportName || "Report"}</div>}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8, fontSize: 11, color: "rgba(255,255,255,.7)", alignItems: "center" }}>
                <span>Type:&nbsp;{canEditRecords
                  ? <select value={rep.reportType || "Haematology"} onChange={e => updateEditableField(ri, "reportType", e.target.value)} style={{ background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,.3)", outline: "none", color: "rgba(255,255,255,.85)", fontFamily: "inherit", fontSize: 11 }}>
                      {REPORT_TYPES.map(t => <option key={t} value={t} style={{ background: "#1e3a5f" }}>{t}</option>)}
                    </select>
                  : rep.reportType}</span>
                <span>Date:&nbsp;{canEditRecords
                  ? <input type="date" value={rep.date || ""} onChange={e => updateEditableField(ri, "date", e.target.value)} style={{ background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,.3)", outline: "none", color: "rgba(255,255,255,.85)", fontFamily: "inherit", fontSize: 11 }} />
                  : rep.date || "—"}</span>
                <span>Dr:&nbsp;{canEditRecords
                  ? <input value={rep.orderedBy || ""} placeholder="Doctor name" onChange={e => updateEditableField(ri, "orderedBy", e.target.value)} style={{ background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,.3)", outline: "none", color: "rgba(255,255,255,.85)", fontFamily: "inherit", fontSize: 11, width: 160 }} />
                  : rep.orderedBy || "—"}</span>
                <span>₹:&nbsp;{canEditRecords
                  ? <input type="number" min={0} value={rep.amount || 0} onChange={e => updateEditableField(ri, "amount", parseFloat(e.target.value) || 0)} style={{ background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,.3)", outline: "none", color: "rgba(255,255,255,.85)", fontFamily: "inherit", fontSize: 11, width: 70 }} />
                  : `₹${rep.amount || 0}`}</span>
              </div>
            </div>
            {canEditRecords && (
              <button onClick={() => removeEditableRow(ri)} style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>✕ Remove</button>
            )}
          </div>
          <div style={{ padding: "12px 16px" }}>
            {(rep.tests || []).length > 0 && (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 8 }}>
                <thead>
                  <tr style={{ background: T.surfaceRaised }}>
                    {["Test Name","Value","Unit","Ref Range","Status"].map(h => (
                      <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700, color: T.textMuted, fontSize: 10, textTransform: "uppercase", borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(rep.tests || []).map((t, ti) => (
                    <tr key={t.id || ti} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: "6px 10px", fontWeight: 500, color: T.text }}>{canEditRecords ? <input value={t.name || ""} onChange={e => { const rows = [...editableRows]; rows[ri] = { ...rows[ri], tests: rows[ri].tests.map((x,j) => j===ti ? {...x,name:e.target.value} : x) }; setEditableRows(rows); }} style={{ ...inpStyle, minWidth: 120 }} /> : t.name || "—"}</td>
                      <td style={{ padding: "6px 10px" }}>{canEditRecords ? <input value={t.value || ""} onChange={e => { const rows = [...editableRows]; rows[ri] = { ...rows[ri], tests: rows[ri].tests.map((x,j) => j===ti ? {...x,value:e.target.value} : x) }; setEditableRows(rows); }} style={{ ...inpStyle, width: 80 }} /> : <span style={{ fontWeight: 700, color: STATUS_COLORS[t.status] || T.text }}>{t.value || "—"}</span>}</td>
                      <td style={{ padding: "6px 10px", color: T.textMuted }}>{t.unit || "—"}</td>
                      <td style={{ padding: "6px 10px", color: T.textMuted }}>{t.refRange || t.normal || "—"}</td>
                      <td style={{ padding: "6px 10px" }}>{canEditRecords
                        ? <select value={t.status || "Normal"} onChange={e => { const rows = [...editableRows]; rows[ri] = { ...rows[ri], tests: rows[ri].tests.map((x,j) => j===ti ? {...x,status:e.target.value} : x) }; setEditableRows(rows); }} style={{ ...inpStyle, width: 80 }}>{["Normal","High","Low"].map(s => <option key={s}>{s}</option>)}</select>
                        : <span style={{ fontSize: 10, fontWeight: 700, color: STATUS_COLORS[t.status] || "#10b981", background: (STATUS_COLORS[t.status] || "#10b981") + "18", borderRadius: 4, padding: "2px 6px" }}>{t.status || "Normal"}</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {canEditRecords && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
                <div><label style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", fontWeight: 700 }}>Remarks / Interpretation</label>
                  <input value={rep.remarks || ""} placeholder="Clinical interpretation…" onChange={e => updateEditableField(ri, "remarks", e.target.value)} style={{ ...inpStyle, width: "100%", boxSizing: "border-box", marginTop: 4 }} /></div>
                <div><label style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", fontWeight: 700 }}>Impression</label>
                  <input value={rep.impression || ""} placeholder="Impression…" onChange={e => updateEditableField(ri, "impression", e.target.value)} style={{ ...inpStyle, width: "100%", boxSizing: "border-box", marginTop: 4 }} /></div>
              </div>
            )}
            {!canEditRecords && (rep.remarks || rep.impression) && (
              <div style={{ fontSize: 12, color: T.textSub, marginTop: 6, fontStyle: "italic" }}>{rep.remarks || ""}{rep.impression ? ` · ${rep.impression}` : ""}</div>
            )}
            {canEditRecords && (
              <button style={{ ...mkBtn("dim", theme), padding: "4px 10px", fontSize: 11, marginTop: 8 }}
                onClick={() => { const rows = [...editableRows]; rows[ri] = { ...rows[ri], tests: [...(rows[ri].tests || []), { id: Date.now(), name: "", value: "", unit: "", refRange: "", status: "Normal" }] }; setEditableRows(rows); }}>
                + Add Test Row
              </button>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              {canEditRecords && (
                <button style={{ ...mkBtn("primary", theme), padding: "7px 16px", fontSize: 12 }} onClick={async () => {
                  try {
                    await apiService.saveLabReportsBulk(selPatient.uhid, selectedAdmission.admNo, [{ reportName: rep.reportName || "Report", reportType: rep.reportType || "Haematology", date: rep.date || new Date().toISOString().slice(0,10), orderedBy: rep.orderedBy || "", remarks: rep.remarks || "", impression: rep.impression || "", amount: Number(rep.amount || 0), tests: (rep.tests || []).filter(t => t.name) }]);
                    toast.success("Saved: " + (rep.reportName || "Report"));
                  } catch(e) { toast.error("Failed to save report."); }
                }}>💾 Save This Report</button>
              )}
              <button style={{ ...mkBtn("dim", theme), padding: "7px 16px", fontSize: 12 }} onClick={() => {
                const uhid = selPatient?.uhid; const admNo = selectedAdmission?.admNo;
                if (!uhid || !admNo) { toast.error("Patient info missing."); return; }
                window.open((apiService.BASE_URL || "http://127.0.0.1:8000/api") + "/patients/" + uhid + "/admissions/" + admNo + "/lab-reports/print/", "_blank");
              }}>🖨 Print This Report</button>
            </div>
          </div>
        </div>
      ))}
      {canEditRecords && (
        <button style={{ ...mkBtn("ghost", theme), padding: "7px 14px", fontSize: 11, marginTop: 4 }}
          onClick={() => addEditableRow({ _localId: `r-new-${Date.now()}`, reportName: "", reportType: "Haematology", date: new Date().toISOString().slice(0,10), orderedBy: "", remarks: "", impression: "", amount: 0, tests: [{ id: Date.now(), name: "", value: "", unit: "", refRange: "", status: "Normal" }] })}>
          + Add Blank Report Manually
        </button>
      )}
    </div>
  );
}
