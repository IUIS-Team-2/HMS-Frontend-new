import React from "react";
import { Printer } from "lucide-react";
import { statusColor } from "../utils/hodUtils";

export default function PathologyReportCard({ rep, ri, patientName, updRep, updTest, addTest, delTest, onRemove, readOnly, onSave, onPrint }) {
  return (
    <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, marginBottom:18, overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,0.08)" }}>
      <div style={{ background:"linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%)", color:"#fff", padding:"16px 22px", display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(255,255,255,.12)", borderRadius:20, padding:"3px 10px", fontSize:10, fontWeight:700, letterSpacing:".08em", color:"#93c5fd", marginBottom:8, textTransform:"uppercase" }}>🧪 PATHOLOGY REPORT</div>
          <input value={rep.reportName} placeholder="Report Name" onChange={e => updRep(ri,"reportName",e.target.value)} disabled={readOnly}
            style={{ background:"transparent", border:"none", borderBottom:`1.5px solid ${readOnly?"transparent":"rgba(255,255,255,.3)"}`, outline:"none", color:"#fff", fontFamily:"inherit", fontSize:17, fontWeight:700, width:"100%", paddingBottom:3 }}/>
          <div style={{ display:"flex", gap:18, flexWrap:"wrap", marginTop:10, fontSize:12, color:"rgba(255,255,255,.7)", alignItems:"center" }}>
            <span>👤 <strong style={{ color:"#fff" }}>{patientName||"—"}</strong></span>
            <span>Date:&nbsp;<input type="date" value={rep.date} onChange={e=>updRep(ri,"date",e.target.value)} disabled={readOnly} style={{ background:"transparent", border:"none", borderBottom:"1px solid rgba(255,255,255,.3)", outline:"none", color:"rgba(255,255,255,.7)", fontFamily:"inherit", fontSize:12 }}/></span>
            <span>Ref.by:&nbsp;<input value={rep.orderedBy} placeholder="Doctor" onChange={e=>updRep(ri,"orderedBy",e.target.value)} disabled={readOnly} style={{ background:"transparent", border:"none", borderBottom:"1px solid rgba(255,255,255,.3)", outline:"none", color:"rgba(255,255,255,.7)", fontFamily:"inherit", fontSize:12, width:140 }}/></span>
          </div>
        </div>
        {!readOnly && <button onClick={onRemove} style={{ background:"rgba(248,113,113,.15)", color:"#fca5a5", border:"1px solid rgba(248,113,113,.3)", borderRadius:6, padding:"5px 13px", cursor:"pointer", fontSize:12, fontFamily:"inherit", fontWeight:600, flexShrink:0 }}>Remove</button>}
      </div>
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <colgroup><col style={{ width:"35%" }}/><col style={{ width:"12%" }}/><col style={{ width:"9%" }}/><col style={{ width:"35%" }}/><col style={{ width:"9%" }}/>{!readOnly&&<col style={{ width:"40px" }}/>}</colgroup>
          <thead>
            <tr style={{ background:"var(--surface-2)" }}>
              {["Test Name","Value ✏️","Unit","Normal / Reference Range","Status",...(!readOnly?[""]:[])].map((h,i) => (
                <th key={i} style={{ textAlign:i===1?"center":"left", padding:"10px 14px", fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:".06em", borderBottom:"2px solid var(--border)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rep.tests.map((t, ti) => (
              <tr key={t.id} style={{ borderBottom:"1px solid var(--border)" }}>
                <td style={{ padding:"8px 14px" }}><input value={t.name} placeholder="e.g. Haemoglobin" onChange={e=>updTest(ri,ti,"name",e.target.value)} disabled={readOnly} style={{ background:readOnly?"transparent":"var(--surface-2)", border:readOnly?"none":"1.5px solid var(--border)", borderRadius:6, padding:"6px 10px", color:"var(--text)", fontSize:12, fontFamily:"inherit", outline:"none", width:"100%" }}/></td>
                <td style={{ padding:"8px 8px", background:"rgba(14,165,233,0.05)", textAlign:"center" }}><input value={t.value} placeholder="—" onChange={e=>updTest(ri,ti,"value",e.target.value)} disabled={readOnly} style={{ background:readOnly?"transparent":"var(--surface)", border:readOnly?"none":"2px solid rgba(14,165,233,0.4)", borderRadius:6, padding:"6px 8px", color:statusColor(t.status), fontSize:13, fontFamily:"inherit", fontWeight:700, outline:"none", width:"100%", textAlign:"center" }}/></td>
                <td style={{ padding:"8px 8px" }}><input value={t.unit} placeholder="g/dL" onChange={e=>updTest(ri,ti,"unit",e.target.value)} disabled={readOnly} style={{ background:"transparent", border:"none", color:"var(--text-mid)", fontSize:12, fontFamily:"inherit", outline:"none", width:"100%" }}/></td>
                <td style={{ padding:"8px 14px" }}><input value={t.refRange} placeholder="e.g. 13.0–17.0" onChange={e=>updTest(ri,ti,"refRange",e.target.value)} disabled={readOnly} style={{ background:"transparent", border:"none", color:"var(--text-mid)", fontSize:12, fontFamily:"inherit", outline:"none", width:"100%" }}/></td>
                <td style={{ padding:"8px 8px", textAlign:"center" }}>
                  {readOnly
                    ? <span style={{ fontSize:11, fontWeight:700, color:statusColor(t.status) }}>{t.status}</span>
                    : <select value={t.status} onChange={e=>updTest(ri,ti,"status",e.target.value)} style={{ background:"var(--surface-2)", border:"1.5px solid var(--border)", borderRadius:6, padding:"5px 4px", color:statusColor(t.status), fontSize:11, fontFamily:"inherit", outline:"none", fontWeight:700 }}><option>Normal</option><option>High</option><option>Low</option></select>
                  }
                </td>
                {!readOnly && <td style={{ padding:"8px 8px", textAlign:"center" }}><button onClick={()=>delTest(ri,ti)} style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", color:"#ef4444", borderRadius:5, padding:"4px 8px", cursor:"pointer", fontSize:12, fontFamily:"inherit" }}>×</button></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!readOnly && (
        <div style={{ padding:"8px 16px" }}>
          <button onClick={()=>addTest(ri)} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"7px 14px", background:"var(--surface-2)", border:"1.5px dashed var(--border-strong)", color:"var(--text-muted)", borderRadius:8, cursor:"pointer", fontSize:12, fontFamily:"inherit", fontWeight:600 }}>+ Add Row</button>
        </div>
      )}
      <div style={{ padding:"12px 22px", borderTop:"1px solid var(--border)", background:"var(--surface-2)", display:"flex", alignItems:"flex-end", gap:16, flexWrap:"wrap" }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:10, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:".06em", marginBottom:4 }}>Remarks</div>
          <input value={rep.remarks} placeholder="Interpretation…" onChange={e=>updRep(ri,"remarks",e.target.value)} disabled={readOnly} style={{ width:"100%", background:readOnly?"transparent":"var(--surface)", border:readOnly?"none":"1.5px solid var(--border)", borderRadius:8, padding:"8px 12px", color:"var(--text)", fontSize:13, fontFamily:"inherit", outline:"none" }}/>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
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
