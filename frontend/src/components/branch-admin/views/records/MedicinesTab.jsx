import React from "react";
import SectionCard from "../../../../components/ui/SectionCard";
import { T, mkBtn } from "../../branchAdminConstants";
import { SANGI_MEDICINE_MASTER } from "../../../../data/medicineMaster";

const inpStyle = { width: "100%", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "13px", padding: "9px 11px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" };

function MedSearchDrop({ onAdd, medicineMaster }) {
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [rect, setRect] = React.useState(null);
  const ref = React.useRef(null);
  const wRef = React.useRef(null);
  React.useEffect(() => {
    const h = e => { if (wRef.current && !wRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const filtered = React.useMemo(() => {
    const lq = q.trim().toLowerCase();
    const merged = [...SANGI_MEDICINE_MASTER, ...(medicineMaster || []).filter(b => !SANGI_MEDICINE_MASTER.some(s => s.name.toLowerCase() === (b.name || b.medicine_name || "").toLowerCase()))];
    if (!lq) return merged.slice(0, 30);
    return merged.filter(m => (m.name || "").toLowerCase().includes(lq)).slice(0, 30);
  }, [q, medicineMaster]);
  return (
    <div ref={wRef} style={{ position: "relative", marginBottom: 12 }}>
      <input ref={ref} value={q} placeholder="🔍 Search & add medicine from master…"
        onChange={e => { setQ(e.target.value); if (ref.current) setRect(ref.current.getBoundingClientRect()); setOpen(true); }}
        onFocus={() => { if (ref.current) setRect(ref.current.getBoundingClientRect()); setOpen(true); }}
        style={{ ...inpStyle, width: "100%", boxSizing: "border-box" }} />
      {open && rect && (
        <div style={{ position: "fixed", top: rect.bottom + 4, left: rect.left, width: rect.width, zIndex: 99999, maxHeight: 250, overflowY: "auto", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, boxShadow: "0 12px 32px rgba(0,0,0,0.2)" }}>
          {filtered.length === 0 && <div style={{ padding: "10px 14px", fontSize: 12, color: "#94a3b8" }}>No medicines found</div>}
          {filtered.map((m, i) => (
            <div key={i} onClick={() => { const rate = Number(m.rate || m.price || 0); onAdd({ _localId: `m-${Date.now()}`, medicine_name: m.name || "", quantity: 1, qty: 1, rate, amount: rate, expiry_date: m.expiry_date || "", batch_no: m.batch_no || "", date_given: new Date().toISOString().slice(0,10) }); setQ(""); setOpen(false); }}
              style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f1f5f9" }}
              onMouseEnter={e => e.currentTarget.style.background = "#f0f9ff"} onMouseLeave={e => e.currentTarget.style.background = ""}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>+ {m.name}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>₹{m.rate || 0}{m.expiry_date ? ` · Exp: ${m.expiry_date}` : ""}{m.batch_no ? ` · Batch: ${m.batch_no}` : ""}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MedicinesTab({ editableRows, updateEditableField, addEditableRow, removeEditableRow, canEditRecords, theme, medicineMaster }) {
  const medTotal = editableRows.reduce((s, m) => s + (Number(m.quantity || m.qty || 1) * Number(m.rate || 0)), 0);
  return (
    <SectionCard theme={theme} icon="💊" title="Medicine Bill" subtitle={canEditRecords ? "Edit medicines with rate and expiry for cash patient" : "View only — cashless patient"}>
      {canEditRecords && <MedSearchDrop onAdd={addEditableRow} medicineMaster={medicineMaster} />}
      {!editableRows.length && <div style={{ padding: "22px", textAlign: "center", color: T.textMuted, fontStyle: "italic", border: `1px dashed ${T.border}`, borderRadius: "10px" }}>No medicines added.</div>}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: T.surfaceRaised }}>
              {["Medicine Name","Date","Qty","Rate (₹)","Expiry","Amount", canEditRecords ? "" : ""].map((h,i) => (
                <th key={i} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: T.textMuted, fontSize: 10, textTransform: "uppercase", borderBottom: `1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {editableRows.map((m, mi) => {
              const qty = Number(m.quantity || m.qty || 1), rate = Number(m.rate || 0);
              return (
                <tr key={m._localId || mi} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: "8px 12px" }}>{canEditRecords ? <input value={m.medicine_name || ""} placeholder="Medicine name" onChange={e => updateEditableField(mi,"medicine_name",e.target.value)} style={{ ...inpStyle, minWidth: 150 }} /> : <span style={{ fontWeight: 600, color: T.text }}>{m.medicine_name || "—"}</span>}</td>
                  <td style={{ padding: "8px 12px" }}>{canEditRecords ? <input type="date" value={m.date_given || m.date || ""} onChange={e => updateEditableField(mi,"date_given",e.target.value)} style={{ ...inpStyle, width: 120 }} /> : <span style={{ color: T.textSub }}>{m.date_given || m.date || "—"}</span>}</td>
                  <td style={{ padding: "8px 12px" }}>{canEditRecords ? <input type="number" min={1} value={qty} onChange={e => { const q = Math.max(1,parseInt(e.target.value)||1); updateEditableField(mi,"quantity",q); updateEditableField(mi,"amount",q*rate); }} style={{ ...inpStyle, width: 60, textAlign: "center" }} /> : <span style={{ color: T.textSub }}>{qty}</span>}</td>
                  <td style={{ padding: "8px 12px" }}>{canEditRecords ? <input type="number" min={0} step="0.01" value={rate} onChange={e => { const r = parseFloat(e.target.value)||0; updateEditableField(mi,"rate",r); updateEditableField(mi,"amount",qty*r); }} style={{ ...inpStyle, width: 80, textAlign: "right" }} /> : <span style={{ color: T.textSub }}>₹{rate}</span>}</td>
                  <td style={{ padding: "8px 12px" }}>{canEditRecords ? <input value={m.expiry_date || ""} placeholder="MM/YYYY" onChange={e => updateEditableField(mi,"expiry_date",e.target.value)} style={{ ...inpStyle, width: 90 }} /> : <span style={{ color: T.textSub }}>{m.expiry_date || "—"}</span>}</td>
                  <td style={{ padding: "8px 12px", fontWeight: 700, color: "#f59e0b" }}>₹{(qty*rate).toFixed(2)}</td>
                  {canEditRecords && <td style={{ padding: "8px 12px" }}><button style={{ ...mkBtn("danger",theme), padding: "4px 8px", fontSize: 11 }} onClick={() => removeEditableRow(mi)}>✕</button></td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {canEditRecords && (
        <button style={{ ...mkBtn("primary",theme), padding: "8px 14px", fontSize: 12, marginTop: 12 }}
          onClick={() => addEditableRow({ _localId: `m-new-${Date.now()}`, medicine_name: "", quantity: 1, qty: 1, rate: 0, amount: 0, expiry_date: "", batch_no: "", date_given: new Date().toISOString().slice(0,10) })}>
          + Add Medicine Manually
        </button>
      )}
      {editableRows.length > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
          <span style={{ fontWeight: 800, color: "#f59e0b", fontSize: 13 }}>Total: ₹{medTotal.toFixed(2)}</span>
        </div>
      )}
    </SectionCard>
  );
}
