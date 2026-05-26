import { buildFileName } from "../../utils/billing/billingUtils";
import { PATHOLOGY_REPORT_TYPES } from "../../constants/billing/reportTemplates";

function statusColor(status) {
  if (status === "High") return "#dc2626";
  if (status === "Low")  return "#d97706";
  return "#059669";
}

export default function PathologyReportCard({
  rep, ri, patientName,
  updRep, updTest, addTest, delTest,
  onRemove, onSave,
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
        background:"linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%)",
        color:"#fff", padding:"16px 22px",
        display:"flex", alignItems:"flex-start",
        justifyContent:"space-between", gap:12,
      }}>
        <div style={{ flex:1 }}>
          <div style={{
            display:"inline-flex", alignItems:"center", gap:6,
            background:"rgba(255,255,255,.12)", borderRadius:20,
            padding:"3px 10px", fontSize:10, fontWeight:700,
            letterSpacing:".08em", color:"#93c5fd", marginBottom:8, textTransform:"uppercase",
          }}>🧪 PATHOLOGY BILL</div>
          <input
            value={rep.reportName}
            placeholder="Report Name (e.g. Complete Blood Count)"
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
              Dept:&nbsp;
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
                {PATHOLOGY_REPORT_TYPES.map(t => (
                  <option key={t} value={t} style={{ background:"#1e3a5f" }}>{t}</option>
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
                value={rep.orderedBy}
                placeholder="Doctor"
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
        <button
          onClick={onRemove}
          style={{
            background:"rgba(248,113,113,.15)", color:"#fca5a5",
            border:"1px solid rgba(248,113,113,.3)", borderRadius:6,
            padding:"5px 13px", cursor:"pointer", fontSize:12,
            fontFamily:"inherit", fontWeight:600, flexShrink:0,
          }}
        >Remove</button>
      </div>

      {/* Table */}
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <colgroup>
            <col style={{ width:"35%" }}/><col style={{ width:"12%" }}/><col style={{ width:"9%" }}/>
            <col style={{ width:"35%" }}/><col style={{ width:"9%" }}/><col style={{ width:"40px" }}/>
          </colgroup>
          <thead>
            <tr style={{ background:"var(--bg,#f8fafc)" }}>
              {["Test Name","Value ✏️","Unit","Normal / Reference Range","Status",""].map((h, i) => (
                <th key={i} style={{
                  textAlign: i === 1 || i === 4 ? "center" : "left",
                  padding: i === 0 || i === 3 ? "10px 16px" : "10px 8px",
                  fontSize:11, fontWeight:700,
                  color: i === 1 ? "#0369a1" : "var(--text3,#94a3b8)",
                  textTransform:"uppercase", letterSpacing:".06em",
                  borderBottom:"2px solid var(--border,#e2e8f0)",
                  background: i === 1 ? "#f0f9ff" : undefined,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rep.tests.map((t, ti) => (
              <tr key={t.id} style={{ borderBottom:"1px solid var(--border,#e2e8f0)" }}>
                <td style={{ padding:"8px 16px" }}>
                  <input value={t.name} placeholder="e.g. Haemoglobin"
                    onChange={e => updTest(ri, ti, "name", e.target.value)}
                    style={{
                      background:"var(--bg,#f8fafc)", border:"1.5px solid var(--border,#e2e8f0)",
                      borderRadius:6, padding:"6px 10px", color:"var(--navy,#0f172a)",
                      fontSize:13, fontFamily:"inherit", outline:"none", width:"100%",
                    }}
                  />
                </td>
                <td style={{ padding:"8px 8px", background:"#f0f9ff", textAlign:"center" }}>
                  <input value={t.value} placeholder="—"
                    onChange={e => updTest(ri, ti, "value", e.target.value)}
                    style={{
                      background:"#fff", border:"2px solid #bae6fd",
                      borderRadius:6, padding:"6px 8px",
                      color: statusColor(t.status), fontSize:13,
                      fontFamily:"inherit", fontWeight:700,
                      outline:"none", width:"100%", textAlign:"center",
                    }}
                  />
                </td>
                <td style={{ padding:"8px 8px" }}>
                  <input value={t.unit} placeholder="g/dL"
                    onChange={e => updTest(ri, ti, "unit", e.target.value)}
                    style={{
                      background:"var(--bg,#f8fafc)", border:"1.5px solid var(--border,#e2e8f0)",
                      borderRadius:6, padding:"6px 8px", color:"var(--text2,#475569)",
                      fontSize:12, fontFamily:"inherit", outline:"none", width:"100%",
                    }}
                  />
                </td>
                <td style={{ padding:"8px 16px" }}>
                  <input value={t.refRange} placeholder="e.g. 13.0 – 17.0"
                    onChange={e => updTest(ri, ti, "refRange", e.target.value)}
                    style={{
                      background:"var(--bg,#f8fafc)", border:"1.5px solid var(--border,#e2e8f0)",
                      borderRadius:6, padding:"6px 10px", color:"var(--text2,#475569)",
                      fontSize:13, fontFamily:"inherit", outline:"none", width:"100%",
                    }}
                  />
                </td>
                <td style={{ padding:"8px 8px", textAlign:"center" }}>
                  <select value={t.status}
                    onChange={e => updTest(ri, ti, "status", e.target.value)}
                    style={{
                      background:"var(--bg,#f8fafc)", border:"1.5px solid var(--border,#e2e8f0)",
                      borderRadius:6, padding:"5px 4px",
                      color: statusColor(t.status), fontSize:11,
                      fontFamily:"inherit", outline:"none", fontWeight:700,
                    }}
                  >
                    <option>Normal</option>
                    <option>High</option>
                    <option>Low</option>
                  </select>
                </td>
                <td style={{ padding:"8px 8px", textAlign:"center" }}>
                  <button onClick={() => delTest(ri, ti)}
                    style={{
                      background:"var(--redBg,#fef2f2)",
                      border:"1px solid rgba(185,28,28,.15)",
                      color:"var(--red,#dc2626)", borderRadius:5,
                      padding:"4px 8px", cursor:"pointer", fontSize:12, fontFamily:"inherit",
                    }}
                  >×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ padding:"8px 16px" }}>
        <button onClick={() => addTest(ri)}
          style={{
            display:"inline-flex", alignItems:"center", gap:6,
            padding:"7px 14px", background:"var(--bg,#f8fafc)",
            border:"1.5px dashed var(--border2,#cbd5e1)",
            color:"var(--text2,#475569)", borderRadius:8,
            cursor:"pointer", fontSize:12, fontFamily:"inherit", fontWeight:600,
          }}
        >+ Add Row</button>
      </div>

      <div style={{ padding:"8px 16px 14px" }}>
        <button onClick={onSave}
          style={{
            display:"inline-flex", alignItems:"center", gap:6,
            padding:"9px 18px", background:"#0d9488", color:"#fff",
            border:"none", borderRadius:8, cursor:"pointer",
            fontSize:13, fontFamily:"inherit", fontWeight:700,
            boxShadow:"0 2px 8px rgba(13,148,136,.25)",
          }}
        >💾 Save This Report</button>
      </div>

      {/* Footer */}
      <div style={{
        padding:"12px 22px", borderTop:"1px solid var(--border,#e2e8f0)",
        background:"var(--bg,#f8fafc)",
        display:"flex", alignItems:"flex-end", gap:16, flexWrap:"wrap",
      }}>
        <div style={{ flex:1 }}>
          <div style={{
            fontSize:10, fontWeight:700, color:"var(--text3)",
            textTransform:"uppercase", letterSpacing:".06em", marginBottom:4,
          }}>Remarks / Interpretation</div>
          <input
            value={rep.remarks}
            placeholder="e.g. Mild anaemia noted, TLC elevated..."
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
      </div>
    </div>
  );
}