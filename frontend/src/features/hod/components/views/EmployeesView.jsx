import React from "react";
import { RefreshCw } from "lucide-react";
import { initials } from "../../utils/hodUtils";

export default function EmployeesView({ deptEmployees, activeDept, tasks, deptColor, loadEmployees, setDeptEmployees, openAssignModal, openReview }) {
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div style={{ fontSize:18, fontWeight:700, color:"var(--text)" }}>Employees — {activeDept}</div>
        <button className="hod-btn hod-btn-ghost" onClick={() => loadEmployees(activeDept).then(l => setDeptEmployees(l))}><RefreshCw size={12}/> Refresh</button>
      </div>
      {deptEmployees.length === 0
        ? <div className="hod-empty"><div className="hod-empty-ico">👥</div><div>No employees found for {activeDept}.</div></div>
        : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
            {deptEmployees.map((emp,i) => {
              const empTasks = tasks.filter(t => t.assigned_to === emp.id);
              return (
                <div key={emp.id} style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"16px 18px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                    <div style={{ width:40, height:40, borderRadius:10, background:["rgba(16,185,129,0.15)","rgba(129,140,248,0.15)","rgba(245,158,11,0.15)","rgba(239,68,68,0.15)"][i%4], display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:700, color:[deptColor,"#818cf8","#f59e0b","#ef4444"][i%4], flexShrink:0 }}>{initials(emp.name)}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"var(--text)" }}>{emp.name}</div>
                      <div style={{ fontSize:10, color:"var(--text-muted)", marginTop:2 }}>{emp.role||"Staff"} · {emp.employee_code||emp.employeeCode}</div>
                    </div>
                  </div>
                  {emp.email && <div style={{ fontSize:11, color:"var(--text-muted)", marginBottom:4 }}>✉ {emp.email}</div>}
                  <div style={{ display:"flex", gap:12, marginBottom:12 }}>
                    {[{label:"Tasks",val:empTasks.length,col:deptColor},{label:"Done",val:empTasks.filter(t=>t.status==="completed").length,col:"#10b981"},{label:"Pending",val:empTasks.filter(t=>t.status==="pending").length,col:"#f59e0b"}].map((s,j) => (
                      <div key={j} style={{ textAlign:"center" }}>
                        <div style={{ fontSize:16, fontWeight:800, color:s.col }}>{s.val}</div>
                        <div style={{ fontSize:9, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:".07em" }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button className="hod-btn hod-btn-primary" style={{ flex:1, fontSize:"10px", padding:"5px" }} onClick={() => openAssignModal(activeDept, emp.id)}>Assign Task</button>
                    <button className="hod-btn hod-btn-ghost" style={{ flex:1, fontSize:"10px", padding:"5px" }} onClick={() => openReview(null, emp)}>Review</button>
                  </div>
                </div>
              );
            })}
          </div>
      }
    </div>
  );
}
