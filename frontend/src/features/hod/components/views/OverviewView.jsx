import React from "react";
import { DEPARTMENTS, DEPT_META } from "../../constants/hodConstants";
import { fmtDt } from "../../utils/hodUtils";
import StatusBadge from "../StatusBadge";

export default function OverviewView({
  allPatients, tasks, hodOwnTasks,
  pendingCount, overdueCount, completedCount, submittedCount,
  unassignedPatients,
  openAssignModal, openMyWork,
  setActiveDept, setActiveView,
  setAssignPatients, setAssignPatientIds, setAssignPatientNames,
}) {
  const deptSummary = DEPARTMENTS.map(dept => ({
    dept,
    total:     tasks.filter(t => t.department === dept).length,
    pending:   tasks.filter(t => t.department === dept && t.status === "pending").length,
    completed: tasks.filter(t => t.department === dept && t.status === "completed").length,
    overdue:   tasks.filter(t => t.department === dept && t.status === "overdue").length,
  }));
  return (
    <div>
      <div className="hod-stat-grid">
        {[
          { label:"Total Patients",  val:allPatients.length,        col:"#10b981" },
          { label:"Tasks Assigned",  val:tasks.length,              col:"#3b82f6" },
          { label:"Pending",         val:pendingCount,              col:"#f59e0b" },
          { label:"Completed",       val:completedCount,            col:"#10b981" },
          { label:"Overdue",         val:overdueCount,              col:"#ef4444" },
          { label:"Submitted",       val:submittedCount,            col:"#6366f1" },
          { label:"My Own Tasks",    val:hodOwnTasks.length,        col:"#a78bfa" },
          { label:"Unassigned Pts",  val:unassignedPatients.length, col:"#f97316" },
        ].map((s,i) => (
          <div key={i} className="hod-stat-card">
            <style>{`.hod-stat-card:nth-child(${i+1})::before{background:${s.col}}`}</style>
            <div style={{ fontSize:26, fontWeight:800, color:s.col, marginBottom:4 }}>{s.val}</div>
            <div style={{ fontSize:11, color:"var(--text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div className="hod-section">
        <div className="hod-section-head">
          <div className="hod-section-title">📊 Department Summary</div>
          <button className="hod-btn hod-btn-primary" onClick={() => openAssignModal()}>+ Assign Task</button>
        </div>
        <div className="hod-table-wrap" style={{ margin:0, borderRadius:0, border:"none" }}>
          <table className="hod-table">
            <thead><tr>{["Department","Total","Pending","Completed","Overdue","Action"].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {deptSummary.map(d => {
                const meta = DEPT_META[d.dept] || {};
                const Icon = meta.icon;
                return (
                  <tr key={d.dept}>
                    <td>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ width:30, height:30, borderRadius:7, background:`${meta.color||"#64748b"}15`, border:`1px solid ${meta.color||"#64748b"}25`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          {Icon && <Icon size={14} strokeWidth={1.8} style={{ color:meta.color||"#64748b", display:"block" }}/>}
                        </div>
                        <span style={{ fontWeight:600, color:"var(--text)" }}>{d.dept}</span>
                      </div>
                    </td>
                    <td><strong>{d.total}</strong></td>
                    <td><span style={{ color:"#f59e0b", fontWeight:600 }}>{d.pending}</span></td>
                    <td><span style={{ color:"#10b981", fontWeight:600 }}>{d.completed}</span></td>
                    <td><span style={{ color:"#ef4444", fontWeight:600 }}>{d.overdue}</span></td>
                    <td>
                      <div style={{ display:"flex", gap:6 }}>
                        <button className="hod-btn hod-btn-ghost" style={{ padding:"4px 10px", fontSize:"10px" }} onClick={() => { setActiveDept(d.dept); setActiveView("dept-tasks"); }}>View</button>
                        <button className="hod-btn hod-btn-primary" style={{ padding:"4px 10px", fontSize:"10px" }} onClick={() => openAssignModal(d.dept)}>Assign</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {unassignedPatients.length > 0 && (
        <div className="hod-section" style={{ marginTop:18 }}>
          <div className="hod-section-head">
            <div className="hod-section-title"><span style={{ color:"#f97316" }}>⚠</span> Unassigned Patients ({unassignedPatients.length})</div>
            <button className="hod-btn hod-btn-amber" onClick={() => openAssignModal()}>Assign Now</button>
          </div>
          <div className="hod-table-wrap" style={{ margin:0, borderRadius:0, border:"none" }}>
            <table className="hod-table">
              <thead><tr>{["Patient","UHID","Ward","DOA","Status","Action"].map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {unassignedPatients.slice(0,8).map(p => (
                  <tr key={p.uhid}>
                    <td style={{ color:"var(--text)", fontWeight:600 }}>{p.patientName||p.name}</td>
                    <td style={{ fontFamily:"monospace", fontSize:11 }}>{p.uhid}</td>
                    <td>{p.ward||"—"}</td>
                    <td style={{ fontSize:11 }}>{fmtDt(p.doa||p.dateTime)}</td>
                    <td><StatusBadge status={p.dod?"completed":"pending"}/></td>
                    <td>
                      <div style={{ display:"flex", gap:6 }}>
                        <button className="hod-btn hod-btn-primary" style={{ padding:"4px 10px", fontSize:"10px" }}
                          onClick={() => { setAssignPatients([p.uhid]); setAssignPatientIds([p.id]); setAssignPatientNames([p.patientName||p.name]); openAssignModal(); }}>Assign</button>
                        <button className="hod-btn hod-btn-ghost" style={{ padding:"4px 10px", fontSize:"10px" }}
                          onClick={() => { setActiveView("my-work"); openMyWork(p); }}>Work Myself</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
