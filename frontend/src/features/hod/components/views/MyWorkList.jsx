import React from "react";
import { RefreshCw, FileText, Send } from "lucide-react";
import { fmtDt, isTaskRowCompleted } from "../../utils/hodUtils";
import StatusBadge from "../StatusBadge";
import PriorityBadge from "../PriorityBadge";

export default function MyWorkList({
  unassignedPatients, hodOwnTasks,
  openMyWork, openAssignModal, openSubmitToAdmin,
  allPatients,
}) {
  const loadAllPatients = () => {};
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:700, color:"var(--text)" }}>My Own Work</div>
          <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:3 }}>Patients you are personally handling</div>
        </div>
      </div>
      <div className="hod-section" style={{ marginBottom:18 }}>
        <div className="hod-section-head">
          <div className="hod-section-title">📋 Unassigned Patients — Handle Personally</div>
          <button className="hod-btn hod-btn-ghost" onClick={loadAllPatients}><RefreshCw size={12}/> Refresh</button>
        </div>
        {unassignedPatients.length === 0
          ? <div className="hod-empty"><div className="hod-empty-ico">✅</div><div>All patients are assigned to department staff.</div></div>
          : <div className="hod-patient-grid" style={{ padding:16 }}>
              {unassignedPatients.map(p => (
                <div key={p.uhid} className="hod-patient-card" onClick={() => openMyWork(p)}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:"var(--text)" }}>{p.patientName||p.name}</div>
                      <div style={{ fontSize:10, fontFamily:"monospace", color:"var(--text-muted)", marginTop:2 }}>{p.uhid}</div>
                    </div>
                    <StatusBadge status={p.dod?"completed":"pending"}/>
                  </div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
                    {p.ward   && <span className="hod-chip">🛏 {p.ward}</span>}
                    {p.doctor && <span className="hod-chip">👨‍⚕️ {p.doctor}</span>}
                    {p.ageYY  && <span className="hod-chip">{p.ageYY}y {p.gender?.[0]}</span>}
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button className="hod-btn hod-btn-primary" style={{ flex:1 }} onClick={e => { e.stopPropagation(); openMyWork(p); }}><FileText size={12}/> Work on This</button>
                    <button className="hod-btn hod-btn-ghost"   style={{ flex:1 }} onClick={e => { e.stopPropagation(); openAssignModal(); }}><Send size={12}/> Assign</button>
                  </div>
                </div>
              ))}
            </div>
        }
      </div>
      <div className="hod-section">
        <div className="hod-section-head"><div className="hod-section-title">📁 My Task History</div></div>
        {hodOwnTasks.length === 0
          ? <div className="hod-empty"><div className="hod-empty-ico">📂</div><div>No tasks recorded yet.</div></div>
          : <div className="hod-table-wrap" style={{ margin:0, borderRadius:0, border:"none" }}>
              <table className="hod-table">
                <thead><tr>{["Patient","UHID","Priority","Status","Due","Action"].map(h => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {hodOwnTasks.map(t => (
                    <tr key={t.id}>
                      <td style={{ color:"var(--text)", fontWeight:600 }}>{t.patient_name}</td>
                      <td style={{ fontFamily:"monospace", fontSize:11 }}>{t.patient_uhid}</td>
                      <td><PriorityBadge priority={t.priority||"Medium"}/></td>
                      <td><StatusBadge status={t.status}/></td>
                      <td style={{ fontSize:11 }}>{fmtDt(t.due_date)}</td>
                      <td>
                        <div style={{ display:"flex", gap:6 }}>
                          {!isTaskRowCompleted(t) && (
                            <>
                              <button className="hod-btn hod-btn-ghost" style={{ padding:"4px 10px", fontSize:"10px" }}
                                onClick={() => openMyWork({ uhid:t.patient_uhid, patientName:t.patient_name, id:t.patient, admNo:t.admNo||"", doa:"", ward:"", ...(t.extra_data||{}) })}>Continue</button>
                              <button className="hod-btn hod-btn-blue" style={{ padding:"4px 10px", fontSize:"10px" }}
                                onClick={() => openSubmitToAdmin({ id:t.id, type:"own", name:t.patient_name })}>Submit</button>
                            </>
                          )}
                          {isTaskRowCompleted(t) && <span style={{ fontSize:11, color:"#6366f1", fontWeight:600 }}>✓ Submitted</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        }
      </div>
    </div>
  );
}
