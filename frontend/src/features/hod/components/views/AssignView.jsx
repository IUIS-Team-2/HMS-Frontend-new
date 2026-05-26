import React from "react";
import { Search } from "lucide-react";
import { DEPARTMENTS, DEPT_META } from "../../constants/hodConstants";

export default function AssignView({ tasks, employees, searchQ, setSearchQ, openAssignModal }) {
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:700, color:"var(--text)" }}>Assign Tasks to Departments</div>
          <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:3 }}>Assign multiple patients (up to 8) to any department employee</div>
        </div>
        <button className="hod-btn hod-btn-primary" onClick={() => openAssignModal()}>+ New Assignment</button>
      </div>
      <div className="hod-filter-bar">
        <Search size={14} strokeWidth={1.8} style={{ color:"var(--text-muted)" }}/>
        <input className="hod-inp" style={{ maxWidth:280 }} placeholder="Search patients…" value={searchQ} onChange={e => setSearchQ(e.target.value)}/>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
        {DEPARTMENTS.map(dept => {
          const meta = DEPT_META[dept] || {};
          const Icon = meta.icon;
          const deptPts  = tasks.filter(t => t.department === dept);
          const empCount = employees.filter(e => (e.department||e.dept) === dept).length;
          return (
            <div key={dept} className="hod-dept-assign-card">
              <div className="hod-dept-header">
                <div className="hod-dept-icon-wrap" style={{ background:`${meta.color||"#64748b"}15`, border:`1px solid ${meta.color||"#64748b"}25` }}>
                  {Icon && <Icon size={16} strokeWidth={1.8} style={{ color:meta.color||"#64748b", display:"block" }}/>}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"var(--text)" }}>{dept}</div>
                  <div style={{ fontSize:10, color:"var(--text-muted)", marginTop:1 }}>{meta.desc}</div>
                </div>
                <button className="hod-btn hod-btn-primary" style={{ padding:"5px 12px", fontSize:"10px" }} onClick={() => openAssignModal(dept)}>Assign</button>
              </div>
              <div style={{ display:"flex", gap:14, marginBottom:10 }}>
                {[{label:"Employees",val:empCount,col:meta.color||"#64748b"},{label:"Tasks",val:deptPts.length,col:"#3b82f6"},{label:"Done",val:deptPts.filter(t=>t.status==="completed").length,col:"#10b981"}].map((s,i) => (
                  <div key={i} style={{ textAlign:"center" }}>
                    <div style={{ fontSize:18, fontWeight:800, color:s.col }}>{s.val}</div>
                    <div style={{ fontSize:9, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:".07em" }}>{s.label}</div>
                  </div>
                ))}
              </div>
              {deptPts.length > 0 && (
                <div>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"var(--text-muted)", marginBottom:4 }}>
                    <span>Progress</span><span>{Math.round((deptPts.filter(t=>t.status==="completed").length/deptPts.length)*100)}%</span>
                  </div>
                  <div className="hod-progress-track">
                    <div className="hod-progress-fill" style={{ width:`${(deptPts.filter(t=>t.status==="completed").length/deptPts.length)*100}%`, background:meta.color||"#10b981" }}/>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
