import React, { useState, useRef, useEffect, useMemo } from "react";


const dr = {
  overlay: { position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:1000, display:"flex", justifyContent:"flex-end" },
  drawer: { width:440, background:"#0f1117", borderLeft:"1px solid #1e2330", height:"100%", display:"flex", flexDirection:"column", fontFamily:"inherit" },
  header: { padding:"16px 18px 12px", borderBottom:"1px solid #1e2330" },
  title: { fontSize:14, fontWeight:600, color:"#f1f5f9", marginBottom:2 },
  uhid: { fontSize:10, color:"#4a5568", fontFamily:"monospace" },
  body: { flex:1, overflowY:"auto", padding:"14px 18px" },
  card: { background:"#161b27", border:"1px solid #1e2330", borderRadius:8, padding:"10px 12px", marginBottom:8 },
  nameInp: { width:"100%", background:"#0a0c12", border:"1px solid #2d3748", borderRadius:6, color:"#e2e8f0", fontSize:13, padding:"7px 10px", fontFamily:"inherit", outline:"none", marginBottom:6, boxSizing:"border-box" },
  grid: { display:"grid", gridTemplateColumns:"70px 70px 90px 1fr 28px", gap:8, alignItems:"center" },
  miniLbl: { fontSize:9, color:"#4a5568", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:3 },
  qtyWrap: { display:"flex", alignItems:"center", background:"#0a0c12", border:"1px solid #2d3748", borderRadius:6, overflow:"hidden", height:32 },
  qtyBtn: { width:28, height:32, background:"#1e2330", border:"none", color:"#e2e8f0", cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  qtyInp: { flex:1, background:"none", border:"none", color:"#e2e8f0", textAlign:"center", fontSize:13, fontFamily:"monospace", width:"100%", outline:"none" },
  rateInp: { width:"100%", background:"#0a0c12", border:"1px solid #2d3748", borderRadius:6, color:"#e2e8f0", fontSize:13, padding:"5px 8px", fontFamily:"monospace", outline:"none", textAlign:"center", height:32, boxSizing:"border-box" },
  delBtn: { background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", color:"#ef4444", width:28, height:28, borderRadius:4, cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  subtotalRow: { display:"flex", justifyContent:"flex-end", marginTop:6 },
  subtotalVal: { fontSize:11, color:"#f59e0b", fontFamily:"monospace", background:"rgba(245,158,11,0.06)", border:"1px solid rgba(245,158,11,0.12)", borderRadius:4, padding:"2px 8px" },
  addBtn: { width:"100%", background:"rgba(16,185,129,0.05)", border:"1px dashed rgba(16,185,129,0.25)", borderRadius:7, color:"#10b981", fontSize:12, padding:"9px", cursor:"pointer", fontFamily:"inherit", fontWeight:500, marginBottom:10 },
  accessBox: (color) => ({ background:`${color}08`, border:`1px solid ${color}20`, borderRadius:7, padding:"8px 12px", fontSize:11, color, marginTop:10 }),
  footer: { padding:"12px 18px", borderTop:"1px solid #1e2330", background:"#0a0c12" },
  totalLbl: { fontSize:10, color:"#4a5568", marginBottom:2 },
  totalVal: { fontSize:20, fontWeight:700, color:"#10b981", fontFamily:"monospace", marginBottom:12 },
  btnRow: { display:"grid", gridTemplateColumns:"1fr 2fr", gap:8 },
  cancelBtn: { background:"none", border:"1px solid #2d3748", color:"#94a3b8", padding:"9px", borderRadius:7, fontSize:12, cursor:"pointer", fontFamily:"inherit" },
  saveBtn: { background:"#10b981", border:"none", color:"#fff", padding:"9px", borderRadius:7, fontSize:12, cursor:"pointer", fontFamily:"inherit", fontWeight:500 },
};

// Internal searchable dropdown for MedDrawer
function DrawerMedSearch({ medicineMaster, existingMeds, onAdd }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const merged = medicineMaster || [];
    if (!q) return merged.slice(0, 30);
    return merged.filter(m => (m.name || "").toLowerCase().includes(q)).slice(0, 30);
  }, [query, medicineMaster]);

  useEffect(() => {
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const isAlready = (name) =>
    (existingMeds || []).some(m => (m.name || "").toLowerCase() === (name || "").toLowerCase());

  const handleSelect = (med) => {
    if (isAlready(med.name)) return;
    onAdd({ id: Date.now(), name: med.name, qty: 1, rate: med.rate ?? med.price ?? 0, expiryDate: med.expiry_date || "" });
    setQuery(""); setOpen(false);
  };

  const handleManual = () => {
    const name = query.trim();
    if (!name || isAlready(name)) return;
    onAdd({ id: Date.now(), name, qty: 1, rate: 0 });
    setQuery(""); setOpen(false);
  };

  return (
    <div ref={wrapRef} style={{ position:"relative", marginBottom:14 }}>
      <input
        style={{ ...dr.nameInp, marginBottom:0 }}
        placeholder="Search & add medicine from master list…"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={e => { if (e.key === "Enter") handleManual(); if (e.key === "Escape") setOpen(false); }}
      />
      {open && filtered.length > 0 && (
        <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, maxHeight:220, overflowY:"auto", background:"#0a0c12", border:"1px solid #2d3748", borderRadius:8, zIndex:200, boxShadow:"0 8px 24px rgba(0,0,0,0.4)" }}>
          {filtered.length === 0 && (
            <button type="button" onClick={handleManual} style={{ padding:"10px 12px", cursor:"pointer", borderBottom:"1px solid #1e2330", color:"#10b981", fontSize:12 }}>
              <div style={{ fontWeight:600 }}>+ Add "{query.trim()}" manually</div>
              <div style={{ fontSize:10, color:"#4a5568", marginTop:2 }}>Custom entry — rate: ₹0</div>
            </button>
          )}
          {filtered.map((m, i) => {
            const already = isAlready(m.name);
            return (
              <div key={i} onClick={() => !already && handleSelect(m)}
                style={{ padding:"10px 12px", cursor: already ? "default" : "pointer", borderBottom:"1px solid #1e2330", opacity: already ? 0.45 : 1 }}>
                <div style={{ color:"#e2e8f0", fontSize:13, fontWeight:500 }}>{already ? "✓ " : "+ "}{m.name}</div>
                <div style={{ fontSize:11, color:"#4a5568", marginTop:2 }}>₹{m.rate ?? m.price ?? 0}{m.expiry_date ? ` · Exp: ${m.expiry_date}` : ""}{already ? " (already added)" : ""}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function MedDrawer({
  editMedPt,
  onClose,
  updateMed,
  addMedRow,
  delMedRow,
  saveMeds,
  fmt,
  canEditRate,
  medicineMaster = [],
  onAddFromMaster,
}) {
  if (!editMedPt) return null;

  const meds = editMedPt.medicines || [];
  const total = meds.reduce((s, m) => s + ((+m.qty || 0) * (+m.rate || 0)), 0);
  const changeQty = (i, delta) => updateMed(i, "qty", Math.max(1, (+meds[i].qty || 1) + delta));

  return (
    <div style={dr.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={dr.drawer}>

        <div style={dr.header}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <div style={dr.title}>Medicines — {editMedPt.patientName || editMedPt.name}</div>
              <div style={dr.uhid}>{editMedPt.uhid} · {meds.length} medicine{meds.length !== 1 ? "s" : ""}</div>
            </div>
            <button onClick={onClose} style={{ background:"none", border:"none", color:"#4a5568", cursor:"pointer", fontSize:20, lineHeight:1, padding:0, marginTop:2 }}>×</button>
          </div>
        </div>

        <div style={dr.body}>

          {/* Searchable master dropdown */}
          <DrawerMedSearch
            medicineMaster={medicineMaster}
            existingMeds={meds}
            onAdd={onAddFromMaster}
          />

          {/* Medicine rows */}
          {meds.length === 0 && (
            <div style={{ textAlign:"center", padding:"24px 12px", color:"#4a5568", fontSize:12, fontStyle:"italic" }}>
              No medicines added. Search above or click "+ Add Row".
            </div>
          )}

          {meds.map((m, i) => (
            <div key={m.id || i} style={dr.card}>
              <input
                style={dr.nameInp}
                value={m.name || ""}
                placeholder="Medicine name"
                onChange={e => updateMed(i, "name", e.target.value)}
              />
              <div style={dr.grid}>
                {/* Qty */}
                <div>
                  <div style={dr.miniLbl}>Qty</div>
                  <div style={dr.qtyWrap}>
                    <button style={dr.qtyBtn} onClick={() => changeQty(i, -1)}>−</button>
                    <input
                      style={dr.qtyInp}
                      type="number"
                      min={1}
                      value={m.qty || 1}
                      onChange={e => updateMed(i, "qty", Math.max(1, parseInt(e.target.value) || 1))}
                    />
                    <button style={dr.qtyBtn} onClick={() => changeQty(i, +1)}>+</button>
                  </div>
                </div>
                {/* Rate */}
                <div>
                  <div style={dr.miniLbl}>Rate (₹)</div>
                  {canEditRate ? (
                    <input
                      style={dr.rateInp}
                      type="number"
                      min={0}
                      step="0.01"
                      value={m.rate || 0}
                      onChange={e => updateMed(i, "rate", Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                  ) : (
                    <div style={dr.rateLocked}>{m.rate || 0}</div>
                  )}
                </div>
                {/* Expiry */}
                <div>
                  <div style={dr.miniLbl}>Expiry</div>
                  <input
                    style={{ ...dr.rateInp, width:"100%", fontSize:11 }}
                    placeholder="MM/YYYY"
                    value={m.expiryDate || ""}
                    onChange={e => updateMed(i, "expiryDate", e.target.value)}
                  />
                </div>
                {/* Subtotal */}
                <div>
                  <div style={dr.miniLbl}>Subtotal</div>
                  <div style={{ ...dr.rateInp, color:"#f59e0b", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {fmt((+m.qty || 0) * (+m.rate || 0))}
                  </div>
                </div>
                {/* Delete */}
                <div style={{ paddingTop:16 }}>
                  <button style={dr.delBtn} onClick={() => delMedRow(i)}>×</button>
                </div>
              </div>
            </div>
          ))}

          <button style={dr.addBtn} onClick={addMedRow}>+ Add Row Manually</button>

          <div style={dr.accessBox(canEditRate ? "#818cf8" : "#fb923c")}>
            <strong style={{ fontSize:11 }}>{canEditRate ? "Management" : "Employee"} Access</strong>
            <div style={{ marginTop:2, opacity:0.75 }}>
              {canEditRate ? "You can edit medicines and rates." : "Rates are locked."}
            </div>
          </div>

        </div>

        <div style={dr.footer}>
          <div style={dr.totalLbl}>Prescription Total</div>
          <div style={dr.totalVal}>{fmt(total)}</div>
          <div style={dr.btnRow}>
            <button style={dr.cancelBtn} onClick={onClose}>Cancel</button>
            <button style={dr.saveBtn} onClick={saveMeds}>💾 Save Medicines</button>
          </div>
        </div>

      </div>
    </div>
  );
}