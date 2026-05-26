import React from "react";
import { DEPT_OPTIONS, DEPT_ICONS, DEPT_ACCENT_CYCLE } from "../../constants/mgmtConstants";

export default function DepartmentsView({ accent, employees, tasks, departments, setDepartments, setShowDeptModal, Badge, ProgressBar }) {
  const deptList = [...DEPT_OPTIONS.map(name=>({id:`default-${name}`,name,description:`${name} Department`,isDefault:true,memberCount:employees.filter(e=>e.dept===name).length})),...departments.filter(d=>!DEPT_OPTIONS.includes(d.name)).map(d=>({...d,isDefault:false,memberCount:employees.filter(e=>e.dept===d.name).length}))];
  return (
    <div>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}><button className="hms-add-btn-lg" onClick={()=>setShowDeptModal(true)}>+ Create Department</button></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14}}>
        {deptList.map((dept,i)=>{
          const dA=DEPT_ACCENT_CYCLE[i%DEPT_ACCENT_CYCLE.length];
          const deptTasks=tasks.filter(t=>t.department===dept.name);
          const completedTasks=deptTasks.filter(t=>t.status==="Completed").length;
          const pct=deptTasks.length?Math.round((completedTasks/deptTasks.length)*100):0;
          return (
            <div key={dept.id} className="hms-dept-card" style={{borderColor:`${dA}30`,borderTopColor:dA}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div style={{width:36,height:36,borderRadius:10,background:`${dA}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{DEPT_ICONS[dept.name]||"🏢"}</div>
                {dept.isDefault?<Badge col={accent}>DEFAULT</Badge>:<button onClick={()=>setDepartments(prev=>prev.filter(d=>d.id!==dept.id))} style={{background:"transparent",border:"none",color:"#64748b",cursor:"pointer",fontSize:12,padding:"2px 6px"}}>✕</button>}
              </div>
              <div style={{fontSize:13,fontWeight:700,marginBottom:4}}>{dept.name}</div>
              <div style={{fontSize:10,color:"#64748b",marginBottom:12}}>{dept.description}</div>
              <div style={{display:"flex",gap:10,marginBottom:deptTasks.length?10:0}}>
                {[{label:"Members",val:dept.memberCount,col:dA},{label:"Tasks",val:deptTasks.length,col:"#38bdf8"},{label:"Done",val:completedTasks,col:"#34d399"}].map((s,j)=>(<div key={j} style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:800,color:s.col}}>{s.val}</div><div style={{fontSize:9,color:"#64748b"}}>{s.label}</div></div>))}
              </div>
              {deptTasks.length>0&&<><div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#64748b",marginBottom:4}}><span>Progress</span><span>{pct}%</span></div><ProgressBar pct={pct} col={dA}/></>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
