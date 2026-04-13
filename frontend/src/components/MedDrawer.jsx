import React from "react";

const dr = {
  overlay: { position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:1000, display:"flex", justifyContent:"flex-end" },
  drawer: { width:400, background:"#0f1117", borderLeft:"1px solid #1e2330", height:"100%", display:"flex", flexDirection:"column", fontFamily:"inherit" },
  header: { padding:"16px 18px 12px", borderBottom:"1px solid #1e2330" },
  title: { fontSize:14, fontWeight:600, color:"#f1f5f9", marginBottom:2 },
  uhid: { fontSize:10, color:"#4a5568", fontFamily:"monospace" },
  body: { flex:1, overflowY:"auto", padding:"14px 18px" },
  card: { background:"#161b27", border:"1px solid #1e2330", borderRadius:8, padding:"10px 12px", marginBottom:8 },
  nameInp: { width:"100%", background:"#0a0c12", border:"1px solid #2d3748", borderRadius:6, color:"#e2e8f0", fontSize:13, padding:"7px 10px", fontFamily:"inherit", outline:"none", marginBottom:10 },
  grid: { display:"grid", gridTemplateColumns:"1fr 100px 70px 28px", gap:8, alignItems:"center" },
  miniLbl: { fontSize:9, color:"#4a5568", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:3 },
  qtyWrap: { display:"flex", alignItems:"center", background:"#0a0c12", border:"1px solid #2d3748", borderRadius:6, overflow:"hidden", height:32 },
  qtyBtn: { width:28, height:32, background:"#1e2330", border:"none", color:"#e2e8f0", cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  qtyInp: { flex:1, background:"none", border:"none", color:"#e2e8f0", textAlign:"center", fontSize:13, fontFamily:"monospace", width:"100%", outline:"none" },
  rateInp: { width:"100%", background:"#0a0c12", border:"1px solid #2d3748", borderRadius:6, color:"#e2e8f0", fontSize:13, padding:"5px 8px", fontFamily:"monospace", outline:"none", textAlign:"center", height:32 },
  rateLocked: { width:"100%", background:"#0a0c12", border:"1px solid #1a1f2e", borderRadius:6, color:"#374151", fontSize:13, padding:"5px 8px", fontFamily:"monospace", textAlign:"center", height:32, display:"flex", alignItems:"center", justifyContent:"center" },
  delBtn: { background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", color:"#ef4444", width:28, height:28, borderRadius:4, cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" },
  subtotalRow: { display:"flex", justifyContent:"flex-end", marginTop:8 },
  subtotalVal: { fontSize:11, color:"#f59e0b", fontFamily:"monospace", background:"rgba(245,158,11,0.06)", border:"1px solid rgba(245,158,11,0.12)", borderRadius:4, padding:"2px 8px" },
  addBtn: { width:"100%", background:"rgba(16,185,129,0.05)", border:"1px dashed rgba(16,185,129,0.25)", borderRadius:7, color:"#10b981", fontSize:12, padding:"9px", cursor:"pointer", fontFamily:"inherit", fontWeight:500, marginBottom:10 },
  accessBox: (color) => ({ background:`${color}08`, border:`1px solid ${color}20`, borderRadius:7, padding:"8px 12px", fontSize:11, color }),
  footer: { padding:"12px 18px", borderTop:"1px solid #1e2330", background:"#0a0c12" },
  totalLbl: { fontSize:10, color:"#4a5568", marginBottom:2 },
  totalVal: { fontSize:20, fontWeight:700, color:"#10b981", fontFamily:"monospace", marginBottom:12 },
  btnRow: { display:"grid", gridTemplateColumns:"1fr 2fr", gap:8 },
  cancelBtn: { background:"none", border:"1px solid #2d3748", color:"#94a3b8", padding:"9px", borderRadius:7, fontSize:12, cursor:"pointer", fontFamily:"inherit" },
  saveBtn: { background:"#10b981", border:"none", color:"#fff", padding:"9px", borderRadius:7, fontSize:12, cursor:"pointer", fontFamily:"inherit", fontWeight:500 },
};

export default function MedDrawer({ editMedPt, onClose, updateMed, addMedRow, delMedRow, saveMeds, fmt, canEditRate }) {
  if (!editMedPt) return null;
  const meds = editMedPt.medicines || [];
  const total = meds.reduce((s, m) => s + ((+m.qty||0) * (+m.rate||0)), 0);
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

          {meds.length > 0 && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 100px 70px 28px", gap:8, paddingBottom:6, marginBottom:6, borderBottom:"1px solid #1e2330" }}>
              {["Medicine","Qty","Rate/unit",""].map(h => (
                <span key={h} style={{ fontSize:9, color:"#4a5568", textTransform:"uppercase", letterSpacing:"0.06em" }}>{h}</span>
              ))}
            </div>
          )}

          {meds.map((m, i) => (
            <div key={m.id || i} style={dr.card}>
              <input
                style={dr.nameInp}
                placeholder="Medicine name..."
                value={m.name}
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
                onChange={e => updateMed(i, "name", e.target.value)}
              />
              <div style={dr.grid}>
                <div>
                  <div style={dr.miniLbl}>Quantity</div>
                  <div style={dr.qtyWrap}>
                    <button style={dr.qtyBtn} onClick={() => changeQty(i, -1)}>−</button>
                    <input
                      style={dr.qtyInp}
                      type="number"
                      value={m.qty}
                      min={1}
                      autoComplete="off"
                      onChange={e => updateMed(i, "qty", e.target.value)}
                    />
                    <button style={dr.qtyBtn} onClick={() => changeQty(i, 1)}>+</button>
                  </div>
                </div>

                <div>
                  <div style={dr.miniLbl}>Rate (₹)</div>
                  {canEditRate
                    ? <input style={dr.rateInp} type="number" value={m.rate} autoComplete="off" onChange={e => updateMed(i, "rate", e.target.value)} />
                    : <div style={dr.rateLocked}>₹{m.rate}</div>
                  }
                </div>

                <button style={dr.delBtn} onClick={() => delMedRow(i)}>×</button>
              </div>

              <div style={dr.subtotalRow}>
                <span style={dr.subtotalVal}>= {fmt((+m.qty||0) * (+m.rate||0))}</span>
              </div>
            </div>
          ))}

          <button style={dr.addBtn} onClick={addMedRow}>+ Add Medicine</button>

          <div style={dr.accessBox(canEditRate ? "#818cf8" : "#fb923c")}>
            <strong style={{ fontSize:11 }}>{canEditRate ? "Management" : "Employee"} Access</strong>
            <div style={{ marginTop:2, opacity:0.75 }}>
              {canEditRate ? "You can edit names, quantities and rates." : "You can edit quantities. Rates are locked."}
            </div>
          </div>

        </div>

        <div style={dr.footer}>
          <div style={dr.totalLbl}>Prescription Total</div>
          <div style={dr.totalVal}>{fmt(total)}</div>
          <div style={dr.btnRow}>
            <button style={dr.cancelBtn} onClick={onClose}>Cancel</button>
            <button style={dr.saveBtn} onClick={saveMeds}>Save Changes</button>
          </div>
        </div>

      </div>
    </div>
  );
}
