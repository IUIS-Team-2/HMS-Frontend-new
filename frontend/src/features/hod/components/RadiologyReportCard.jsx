import React from "react";
import { Printer } from "lucide-react";
import { RADIOLOGY_REPORT_TYPES } from "../constants/hodConstants";

export default function RadiologyReportCard({ rep, ri, patientName, updRep, onRemove, readOnly, onSave, onPrint }) {
  return (
    <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, marginBottom:18, overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,0.08)" }}>
      <div style={{ background:"linear-gradient(135deg,#064e3b 0%,#065f46 100%)", color:"#fff", padding:"16px 22px", display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(255,255,255,.12)", borderRadius:20, padding:"3px 10px", fontSize:10, fontWeight:700, letterSpacing:".08em", color:"#6ee7b7", marginBottom:8, textTransform:"uppercase" }}>🩻 RADIOLOGY REPORT</div>
          <input value={rep.reportName} placeholder="Radiology Report Name" onChange={e=>updRep(ri,"reportName",e.target.value)} disabled={readOnly}
            style={{ background:"transparent", border:"none", borderBottom:`1.5px solid ${readOnly?"transparent":"rgba(255,255,255,.3)"}`, outline:"none", color:"#fff", fontFamily:"inherit", fontSize:17, fontWeight:700, width:"100%", paddingBottom:3 }}/>
          <div style={{ display:"flex", gap:18, flexWrap:"wrap", marginTop:10, fontSize:12, color:"rgba(255,255,255,.7)", alignItems:"center" }}>
            <span>👤 <strong style={{ color:"#fff" }}>{patientName||"—"}</strong></span>
            <span>Modality:&nbsp;
              <select value={rep.reportType} onChange={e=>updRep(ri,"reportType",e.target.value)} disabled={readOnly}
                style={{ background:"transparent", border:"none", borderBottom:"1px solid rgba(255,255,255,.3)", outline:"none", color:"rgba(255,255,255,.85)", fontFamily:"inherit", fontSize:12 }}>
                {RADIOLOGY_REPORT_TYPES.map(t=><option key={t} value={t} style={{ background:"#065f46" }}>{t}</option>)}
              </select>
            </span>
            <span>Date:&nbsp;<input type="date" value={rep.date} onChange={e=>updRep(ri,"date",e.target.value)} disabled={readOnly} style={{ background:"transparent", border:"none", borderBottom:"1px solid rgba(255,255,255,.3)", outline:"none", color:"rgba(255,255,255,.7)", fontFamily:"inherit", fontSize:12 }}/></span>
          </div>
        </div>
        {!readOnly && <button onClick={onRemove} style={{ background:"rgba(248,113,113,.15)", color:"#fca5a5", border:"1px solid rgba(248,113,113,.3)", borderRadius:6, padding:"5px 13px", cursor:"pointer", fontSize:12, fontFamily:"inherit", fontWeight:600, flexShrink:0 }}>Remove</button>}
      </div>
      <div style={{ padding:"20px 22px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div>
          <label style={{ fontSize:10, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:".06em", display:"block", marginBottom:6 }}>Findings / Report</label>
          <textarea value={rep.findings||""} placeholder="Findings…" onChange={e=>updRep(ri,"findings",e.target.value)} disabled={readOnly} rows={5} style={{ width:"100%", background:readOnly?"transparent":"var(--surface-2)", border:readOnly?"none":"1.5px solid var(--border)", borderRadius:8, padding:"10px 12px", color:"var(--text)", fontSize:13, fontFamily:"inherit", outline:"none", resize:"vertical", boxSizing:"border-box" }}/>
        </div>
        <div>
          <label style={{ fontSize:10, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:".06em", display:"block", marginBottom:6 }}>Impression / Conclusion</label>
          <textarea value={rep.impression||""} placeholder="Clinical impression…" onChange={e=>updRep(ri,"impression",e.target.value)} disabled={readOnly} rows={5} style={{ width:"100%", background:readOnly?"transparent":"var(--surface-2)", border:readOnly?"none":"1.5px solid var(--border)", borderRadius:8, padding:"10px 12px", color:"var(--text)", fontSize:13, fontFamily:"inherit", outline:"none", resize:"vertical", boxSizing:"border-box" }}/>
        </div>
      </div>
      <div style={{ padding:"12px 22px", borderTop:"1px solid var(--border)", background:"var(--surface-2)", display:"flex", alignItems:"flex-end", gap:16 }}>
        <div style={{ flex:1 }}>
          <label style={{ fontSize:10, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:".06em", display:"block", marginBottom:4 }}>Remarks</label>
          <input value={rep.remarks} placeholder="Additional remarks…" onChange={e=>updRep(ri,"remarks",e.target.value)} disabled={readOnly} style={{ width:"100%", background:readOnly?"transparent":"var(--surface)", border:readOnly?"none":"1.5px solid var(--border)", borderRadius:8, padding:"8px 12px", color:"var(--text)", fontSize:13, fontFamily:"inherit", outline:"none" }}/>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:12, fontWeight:600, color:"var(--text-muted)" }}>Amount (₹)</span>
          <input type="number" value={rep.amount} onChange={e=>updRep(ri,"amount",Number(e.target.value))} disabled={readOnly} style={{ width:110, background:readOnly?"transparent":"var(--surface)", border:readOnly?"none":"1.5px solid var(--border)", borderRadius:8, padding:"8px 10px", color:"var(--text)", fontSize:13, fontFamily:"inherit", fontWeight:700, outline:"none" }}/>
        </div>
      </div>
      {onSave && (
        <div style={{ padding:"10px 22px", borderTop:"1px solid var(--border)", display:"flex", gap:10, justifyContent:"flex-end", background:"var(--surface)" }}>
          {onPrint && <button onClick={onPrint} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"7px 14px", background:"rgba(16,185,129,0.1)", border:"1.5px solid rgba(16,185,129,0.35)", color:"#10b981", borderRadius:8, cursor:"pointer", fontSize:12, fontFamily:"inherit", fontWeight:600 }}><Printer size={12}/> Print Report</button>}
          <button onClick={onSave} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"7px 14px", background:"#0f172a", border:"none", color:"#fff", borderRadius:8, cursor:"pointer", fontSize:12, fontFamily:"inherit", fontWeight:700 }}>💾 Save Report</button>
        </div>
      )}
    </div>
  );
}
