import React, { useState } from "react";
import { MEDICATION_GROUPS } from "../constants/hodConstants";

export default function MedicineHistoryPicker({ eMed, onAdd }) {
  const [search, setSearch]     = useState("");
  const [expanded, setExpanded] = useState(false);

  const rawMeds =
  eMed?.currentMedications ||
  eMed?.medications ||
  eMed?.current_medications ||
  "";

const historyMeds = Array.isArray(rawMeds)
  ? rawMeds.filter(Boolean)
  : String(rawMeds)
      .split(/,|\n/)
      .map(m => m.trim())
      .filter(Boolean);
  const histFiltered = search.trim()
    ? historyMeds.filter(m => m.toLowerCase().includes(search.toLowerCase())) : historyMeds;

  if (!expanded) return (
    <div style={{ background:"rgba(16,185,129,0.06)", border:"1.5px dashed rgba(16,185,129,0.4)", borderRadius:10, padding:"10px 16px", marginBottom:14, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
      <span style={{ fontSize:12, fontWeight:600, color:"#10b981" }}>💊 Add from Medical History & Library</span>
      <button onClick={() => setExpanded(true)} style={{ background:"#10b981", color:"#fff", border:"none", borderRadius:7, padding:"5px 14px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Show ▾</button>
    </div>
  );

  return (
    <div style={{ background:"var(--surface)", border:"1.5px solid rgba(16,185,129,0.4)", borderRadius:12, marginBottom:16, overflow:"hidden" }}>
      <div style={{ background:"linear-gradient(135deg,#064e3b,#065f46)", padding:"12px 18px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ fontSize:13, fontWeight:700, color:"#fff" }}>💊 Add Medicines from Medical History & Library</div>
        <button onClick={() => setExpanded(false)} style={{ background:"rgba(255,255,255,.15)", color:"#fff", border:"1px solid rgba(255,255,255,.25)", borderRadius:7, padding:"5px 12px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Hide ▴</button>
      </div>
      <div style={{ padding:"10px 16px", borderBottom:"1px solid rgba(16,185,129,0.2)" }}>
        <input placeholder="Search medicines..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ width:"100%", fontFamily:"inherit", fontSize:12, border:"1.5px solid rgba(16,185,129,0.4)", borderRadius:8, padding:"7px 12px", outline:"none", color:"var(--text)", background:"var(--surface)", boxSizing:"border-box" }}/>
      </div>
      <div style={{ maxHeight:260, overflowY:"auto", padding:"12px 16px", display:"flex", flexDirection:"column", gap:10 }}>
        {histFiltered.length > 0 && (
          <div>
            <div style={{ fontSize:10, fontWeight:700, color:"#10b981", textTransform:"uppercase", letterSpacing:".08em", marginBottom:7 }}>⭐ From This Patient's Medical History</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {histFiltered.map(med => (
                <button key={med} onClick={() => onAdd(med)} style={{ background:"rgba(16,185,129,0.12)", border:"1.5px solid rgba(16,185,129,0.4)", borderRadius:20, padding:"5px 12px", fontSize:12, color:"#059669", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>+ {med}</button>
              ))}
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}
