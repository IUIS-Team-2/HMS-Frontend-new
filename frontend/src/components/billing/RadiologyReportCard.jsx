import { buildFileName } from "../../utils/billing/billingUtils";
import { RADIOLOGY_REPORT_TYPES } from "../../constants/billing/reportTemplates";

export default function RadiologyReportCard({
  rep, ri, patientName,
  updRep, onRemove, onSave,
}) {
  const fileName = buildFileName(patientName, rep.reportType, rep.date);

  return (
    <div style={{
      background:"var(--white,#fff)", border:"1px solid var(--border,#e2e8f0)",
      borderRadius:14, marginBottom:18, overflow:"hidden",
      boxShadow:"0 2px 12px rgba(11,37,69,.08)",
    }}>
      {/* Header */}
      <div style={{
        background:"linear-gradient(135deg,#064e3b 0%,#065f46 100%)",
        color:"#fff", padding:"16px 22px",
        display:"flex", alignItems:"flex-start",
        justifyContent:"space-between", gap:12,
      }}>
        <div style={{ flex:1 }}>
          <div style={{
            display:"inline-flex", alignItems:"center", gap:6,
            background:"rgba(255,255,255,.12)", borderRadius:20,
            padding:"3px 10px", fontSize:10, fontWeight:700,
            letterSpacing:".08em", color:"#6ee7b7",
            marginBottom:8, textTransform:"uppercase",
          }}>🩻 RADIOLOGY BILL</div>
          <input
            value={rep.reportName}
            placeholder="Radiology Report Name (e.g. X-Ray Chest PA View)"
            onChange={e => updRep(ri, "reportName", e.target.value)}
            style={{
              background:"transparent", border:"none",
              borderBottom:"1.5px solid rgba(255,255,255,.3)",
              outline:"none", color:"#fff", fontFamily:"inherit",
              fontSize:17, fontWeight:700, width:"100%", paddingBottom:3,
            }}
          />
          <div style={{ fontSize:11, color:"rgba(255,255,255,.45)", marginTop:6, fontFamily:"monospace" }}>
            📄 {fileName}
          </div>
          <div style={{
            display:"flex", gap:18, flexWrap:"wrap", marginTop:10,
            fontSize:12, color:"rgba(255,255,255,.7)", alignItems:"center",
          }}>
            <span>👤 <strong style={{ color:"#fff" }}>{patientName || "—"}</strong></span>
            <span>
              Modality:&nbsp;
              <select
                value={rep.reportType}
                onChange={e => updRep(ri, "reportType", e.target.value)}
                style={{
                  background:"transparent", border:"none",
                  borderBottom:"1px solid rgba(255,255,255,.3)",
                  outline:"none", color:"rgba(255,255,255,.85)",
                  fontFamily:"inherit", fontSize:12,
                }}
              >
                {RADIOLOGY_REPORT_TYPES.map(t => (
                  <option key={t} value={t} style={{ background:"#065f46" }}>{t}</option>
                ))}
              </select>
            </span>
            <span>
              Date:&nbsp;
              <input
                type="date" value={rep.date}
                onChange={e => updRep(ri, "date", e.target.value)}
                style={{
                  background:"transparent", border:"none",
                  borderBottom:"1px solid rgba(255,255,255,.3)",
                  outline:"none", color:"rgba(255,255,255,.7)",
                  fontFamily:"inherit", fontSize:12,
                }}
              />
            </span>
            <span>
              Ref.by:&nbsp;
              <input
                value={rep.orderedBy} placeholder="Doctor"
                onChange={e => updRep(ri, "orderedBy", e.target.value)}
                style={{
                  background:"transparent", border:"none",
                  borderBottom:"1px solid rgba(255,255,255,.3)",
                  outline:"none", color:"rgba(255,255,255,.7)",
                  fontFamily:"inherit", fontSize:12, width:140,
                }}
              />
            </span>
          </div>
        </div>
        <button onClick={onRemove}
          style={{
            background:"rgba(248,113,113,.15)", color:"#fca5a5",
            border:"1px solid rgba(248,113,113,.3)", borderRadius:6,
            padding:"5px 13px", cursor:"pointer", fontSize:12,
            fontFamily:"inherit", fontWeight:600, flexShrink:0,
          }}
        >Remove</button>
      </div>

      {/* Findings */}
      <div style={{
        padding:"20px 22px",
        display:"grid", gridTemplateColumns:"1fr 1fr", gap:16,
      }}>
        <div>
          <label style={{
            fontSize:10, fontWeight:700, color:"var(--text3)",
            textTransform:"uppercase", letterSpacing:".06em",
            display:"block", marginBottom:6,
          }}>Findings / Report</label>
          <textarea
            value={rep.findings || ""}
            placeholder="Describe radiological findings here..."
            onChange={e => updRep(ri, "findings", e.target.value)}
            rows={5}
            style={{
              width:"100%", background:"var(--bg,#f8fafc)",
              border:"1.5px solid var(--border,#e2e8f0)",
              borderRadius:8, padding:"10px 12px",
              color:"var(--navy,#0f172a)", fontSize:13,
              fontFamily:"inherit", outline:"none",
              resize:"vertical", boxSizing:"border-box",
            }}
          />
        </div>
        <div>
          <label style={{
            fontSize:10, fontWeight:700, color:"var(--text3)",
            textTransform:"uppercase", letterSpacing:".06em",
            display:"block", marginBottom:6,
          }}>Impression / Conclusion</label>
          <textarea
            value={rep.impression || ""}
            placeholder="Clinical impression / diagnosis..."
            onChange={e => updRep(ri, "impression", e.target.value)}
            rows={5}
            style={{
              width:"100%", background:"var(--bg,#f8fafc)",
              border:"1.5px solid var(--border,#e2e8f0)",
              borderRadius:8, padding:"10px 12px",
              color:"var(--navy,#0f172a)", fontSize:13,
              fontFamily:"inherit", outline:"none",
              resize:"vertical", boxSizing:"border-box",
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding:"12px 22px", borderTop:"1px solid var(--border,#e2e8f0)",
        background:"var(--bg,#f8fafc)",
        display:"flex", alignItems:"flex-end", gap:16, flexWrap:"wrap",
      }}>
        <div style={{ flex:1 }}>
          <label style={{
            fontSize:10, fontWeight:700, color:"var(--text3)",
            textTransform:"uppercase", letterSpacing:".06em",
            display:"block", marginBottom:4,
          }}>Remarks</label>
          <input
            value={rep.remarks}
            placeholder="Additional remarks..."
            onChange={e => updRep(ri, "remarks", e.target.value)}
            style={{
              width:"100%", background:"#fff",
              border:"1.5px solid var(--border,#e2e8f0)",
              borderRadius:8, padding:"8px 12px",
              color:"var(--navy,#0f172a)", fontSize:13,
              fontFamily:"inherit", outline:"none",
            }}
          />
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
          <span style={{ fontSize:12, fontWeight:600, color:"var(--text3)", whiteSpace:"nowrap" }}>
            Amount (Rs.)
          </span>
          <input
            type="number" value={rep.amount}
            onChange={e => updRep(ri, "amount", Number(e.target.value))}
            style={{
              width:110, background:"#fff",
              border:"1.5px solid var(--border,#e2e8f0)",
              borderRadius:8, padding:"8px 10px",
              color:"var(--navy,#0f172a)", fontSize:13,
              fontFamily:"inherit", fontWeight:700, outline:"none",
            }}
          />
        </div>
        <button onClick={onSave}
          style={{
            display:"inline-flex", alignItems:"center", gap:6,
            padding:"9px 18px", background:"#0d9488", color:"#fff",
            border:"none", borderRadius:8, cursor:"pointer",
            fontSize:13, fontFamily:"inherit", fontWeight:700,
            flexShrink:0, boxShadow:"0 2px 8px rgba(13,148,136,.25)",
          }}
        >💾 Save This Report</button>
      </div>
    </div>
  );
}