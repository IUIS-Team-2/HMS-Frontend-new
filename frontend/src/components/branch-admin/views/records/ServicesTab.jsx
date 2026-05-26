import React from "react";
import SectionCard from "../../../../components/ui/SectionCard";
import { T, mkBtn } from "../../branchAdminConstants";
import { SERVICE_MASTER } from "./recordsConstants";

const inpStyle = { width: "100%", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "13px", padding: "9px 11px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" };

function SvcSearchBar({ onAdd }) {
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
    if (!lq) return SERVICE_MASTER.slice(0, 20);
    return SERVICE_MASTER.filter(s => s.name.toLowerCase().includes(lq) || s.code.toLowerCase().includes(lq)).slice(0, 20);
  }, [q]);
  const addSvc = svc => { onAdd({ _localId: `svc-new-${Date.now()}`, isSvc: true, medicine_name: svc.name, date_given: new Date().toISOString().slice(0,10), quantity: 1, rate: svc.rate || 0, batch_no: svc.code || "", expiry_date: "", amount: svc.rate || 0 }); setQ(""); setOpen(false); };
  return (
    <div ref={wRef} style={{ position: "relative", marginBottom: 14 }}>
      <input value={q} placeholder="🔍 Search & add service from master list…" onChange={e => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} style={{ ...inpStyle, width: "100%", boxSizing: "border-box" }} />
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 99999, maxHeight: 280, overflowY: "auto", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, boxShadow: "0 12px 32px rgba(0,0,0,0.18)" }}>
          {filtered.length === 0 && <div style={{ padding: "10px 14px", fontSize: 12, color: "#94a3b8" }}>No match — add custom below</div>}
          {filtered.map((svc, i) => (
            <div key={i} onClick={() => addSvc(svc)} style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f1f5f9", fontSize: 13, color: "#0f172a", display: "flex", justifyContent: "space-between", alignItems: "center" }} onMouseEnter={e => e.currentTarget.style.background="#f0f9ff"} onMouseLeave={e => e.currentTarget.style.background=""}>
              <span><strong>{svc.name}</strong> <span style={{ fontSize: 11, color: "#94a3b8" }}>({svc.code})</span></span>
              <span style={{ fontSize: 12, color: "#059669", fontWeight: 700 }}>₹{svc.rate}</span>
            </div>
          ))}
          {q.trim() && !SERVICE_MASTER.some(s => s.name.toLowerCase() === q.trim().toLowerCase()) && (
            <div onClick={() => addSvc({ name: q.trim(), code: "", rate: 0 })} style={{ padding: "10px 14px", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#3b82f6", background: "#eff6ff", borderTop: "1px solid #bfdbfe" }} onMouseEnter={e => e.currentTarget.style.background="#dbeafe"} onMouseLeave={e => e.currentTarget.style.background="#eff6ff"}>
              + Add "{q.trim()}" as custom service
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ServicesTab({ editableRows, updateEditableField, addEditableRow, removeEditableRow, canEditRecords, theme, savingRecords, onSave }) {
  const svcTotal = editableRows.reduce((s, r) => s + Number(r.quantity || 1) * Number(r.rate || 0), 0);
  return (
    <SectionCard theme={theme} icon="🏥" title="Services & Charges" subtitle={canEditRecords ? "Add, edit or remove service line-items for this admission" : "View only — cashless patient"}>
      {canEditRecords && <SvcSearchBar onAdd={addEditableRow} />}
      {!editableRows.length && <div style={{ padding: "22px", textAlign: "center", color: T.textMuted, fontStyle: "italic", border: `1px dashed ${T.border}`, borderRadius: "10px" }}>No services added.{canEditRecords ? " Use the search above or add manually." : ""}</div>}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: T.surfaceRaised }}>
              {["#","Description","CGHS Code","Date","Qty","Rate (₹)","Amount", canEditRecords ? "" : ""].map((h,i) => (
                <th key={i} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: T.textMuted, fontSize: 10, textTransform: "uppercase", borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {editableRows.map((row, ri) => {
              const qty = Number(row.quantity || 1), rate = Number(row.rate || 0);
              return (
                <tr key={row._localId || ri} style={{ borderBottom: `1px solid ${T.border}`, background: ri % 2 === 0 ? "transparent" : T.surfaceRaised + "44" }}>
                  <td style={{ padding: "8px 12px", color: T.textMuted, fontSize: 11, fontWeight: 600 }}>{ri + 1}</td>
                  <td style={{ padding: "8px 12px", minWidth: 180 }}>{canEditRecords ? <input value={row.medicine_name || ""} placeholder="Service description" onChange={e => updateEditableField(ri,"medicine_name",e.target.value)} style={{ ...inpStyle, minWidth: 160 }} /> : <span style={{ fontWeight: 600, color: T.text }}>{row.medicine_name || "—"}</span>}</td>
                  <td style={{ padding: "8px 12px", minWidth: 110 }}>{canEditRecords ? <input value={row.batch_no || ""} placeholder="e.g. RM01" onChange={e => updateEditableField(ri,"batch_no",e.target.value)} style={{ ...inpStyle, width: 90 }} /> : <span style={{ color: T.textMuted, fontFamily: "monospace", fontSize: 11 }}>{row.batch_no || "—"}</span>}</td>
                  <td style={{ padding: "8px 12px" }}>{canEditRecords ? <input type="date" value={row.date_given || ""} onChange={e => updateEditableField(ri,"date_given",e.target.value)} style={{ ...inpStyle, width: 130 }} /> : <span style={{ color: T.textSub }}>{row.date_given || "—"}</span>}</td>
                  <td style={{ padding: "8px 12px" }}>{canEditRecords ? <input type="number" min={1} value={qty} onChange={e => { const q = Math.max(1,parseInt(e.target.value)||1); updateEditableField(ri,"quantity",q); updateEditableField(ri,"amount",q*rate); }} style={{ ...inpStyle, width: 60, textAlign: "center" }} /> : <span style={{ color: T.textSub }}>{qty}</span>}</td>
                  <td style={{ padding: "8px 12px" }}>{canEditRecords ? <input type="number" min={0} step="0.01" value={rate} onChange={e => { const r = parseFloat(e.target.value)||0; updateEditableField(ri,"rate",r); updateEditableField(ri,"amount",qty*r); }} style={{ ...inpStyle, width: 90, textAlign: "right" }} /> : <span style={{ color: T.textSub }}>₹{rate.toLocaleString()}</span>}</td>
                  <td style={{ padding: "8px 12px", fontWeight: 700, color: theme.primary, whiteSpace: "nowrap" }}>₹{(qty*rate).toLocaleString("en-IN",{minimumFractionDigits:2})}</td>
                  {canEditRecords && <td style={{ padding: "8px 12px" }}><button style={{ ...mkBtn("danger",theme), padding: "4px 8px", fontSize: 11 }} onClick={() => removeEditableRow(ri)}>✕</button></td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {canEditRecords && (
        <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          <button style={{ ...mkBtn("primary", theme), padding: "8px 14px", fontSize: 12 }} onClick={() => addEditableRow({ _localId: `svc-new-${Date.now()}`, isSvc: true, medicine_name: "", date_given: new Date().toISOString().slice(0,10), quantity: 1, rate: 0, batch_no: "", expiry_date: "", amount: 0 })}>+ Add Service Manually</button>
          <button style={{ ...mkBtn("success", theme), padding: "8px 18px", fontSize: 12 }} onClick={onSave} disabled={savingRecords}>{savingRecords ? "Saving…" : "💾 Save Services"}</button>
        </div>
      )}
      {editableRows.length > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12, paddingTop: 10, borderTop: `1px solid ${T.border}`, gap: 24, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: T.textMuted }}>Total Services: {editableRows.length}</span>
          <span style={{ fontWeight: 800, color: theme.primary, fontSize: 14 }}>Total: ₹{svcTotal.toLocaleString("en-IN",{minimumFractionDigits:2})}</span>
        </div>
      )}
    </SectionCard>
  );
}
