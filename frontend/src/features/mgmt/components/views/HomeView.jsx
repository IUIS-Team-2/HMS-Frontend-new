import React from "react";
import { Users, ClipboardList, Hospital, DoorOpen, CheckSquare, Clock3, AlertTriangle, Building2 } from "lucide-react";

export default function HomeView({ currentUser, bc, accent, locationPatients, allAdmissions, currentlyAdmitted, discharged, tasks, departments, fmtDt, normalizeSummaryType, summaryTypeCache, openSummaryEditor, SummaryPill, SUMMARY_META, SUMMARY_LABELS, setActiveTab, initials, Badge, StatCard, CardRow, TableWrap, Th, Td, PriorityPill, StatusPill, TASK_STATUS_META, TASK_PRIORITY_META }) {
  const pendingTasks = tasks.filter(t=>t.status==="Pending").length;
  const urgentTasks  = tasks.filter(t=>t.priority==="Urgent"&&t.status!=="Completed").length;
  const stats = [
    {label:"Branch Patients",    val:locationPatients.length, col:accent,      icon:Users,         sub:"All records",    topBorder:true},
    {label:"Total Admissions",   val:allAdmissions.length,    col:"#22d3ee",   icon:ClipboardList, sub:"All time",       topBorder:true},
    {label:"Currently Admitted", val:currentlyAdmitted,       col:"#34d399",   icon:Hospital,      sub:"Active",         topBorder:true},
    {label:"Discharged",         val:discharged,              col:"#8b949e",   icon:DoorOpen,      sub:"Completed",      topBorder:true},
    {label:"Total Tasks",        val:tasks.length,            col:"#818cf8",   icon:CheckSquare,   sub:"All tasks",      topBorder:true},
    {label:"Pending Tasks",      val:pendingTasks,            col:"#f59e0b",   icon:Clock3,        sub:"Awaiting action",topBorder:true},
    {label:"Urgent Tasks",       val:urgentTasks,             col:"#f87171",   icon:AlertTriangle, sub:"Need attention", topBorder:true},
    {label:"Departments",        val:departments.length,      col:"#34d399",   icon:Building2,     sub:"Active depts",   topBorder:true},
  ];
  return (
    <div>
      <div className="hms-prof-card" style={{display:"flex",alignItems:"flex-start",gap:18,border:`1px solid ${accent}30`,marginBottom:20}}>
        <div className="hms-big-avatar">{initials(currentUser?.name||"")}</div>
        <div style={{flex:1}}>
          <div style={{fontSize:16,fontWeight:700,marginBottom:3}}>{currentUser?.name||""}</div>
          <div style={{fontSize:11,color:accent,fontWeight:600,marginBottom:2}}>{currentUser?.dept||currentUser?.role?.toUpperCase()}</div>
          <div style={{fontSize:10,color:"#64748b"}}>{bc.label} Branch</div>
          <div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}>
            {currentUser?.dept&&<Badge col={accent}>{currentUser.dept}</Badge>}
            <Badge col={currentUser?.status==="Inactive"?"#f87171":"#34d399"}>{currentUser?.status||"Active"}</Badge>
          </div>
        </div>
      </div>
      <div className="hms-stat-grid">{stats.map((s,i)=><StatCard key={i} {...s}/>)}</div>
      {tasks.length>0&&(
        <div className="hms-card">
          <CardRow title="Recent Tasks" action={<button className="hms-add-btn" onClick={()=>setActiveTab("tasks")}>View All</button>}/>
          <TableWrap heads={["Task","Assigned To","Dept","Priority","Status","Due","Patients"]}>
            {tasks.slice(0,5).map((t,i)=>(
              <tr key={i}><Td hi>{t.title}</Td><Td>{t.assignedTo}</Td><Td><Badge col={accent}>{t.department}</Badge></Td><Td><PriorityPill p={t.priority}/></Td><Td><StatusPill s={t.status}/></Td><Td sm>{fmtDt(t.dueDate)}</Td><Td sm>{(t.patientNames||[]).length>0?<span style={{color:"#38bdf8"}}>{t.patientNames.join(", ")}</span>:"—"}</Td></tr>
            ))}
          </TableWrap>
        </div>
      )}
      <div className="hms-card">
        <CardRow title={`Recent Patients — ${bc.label}`} action={<button className="hms-add-btn" onClick={()=>setActiveTab("patients")}>View All</button>}/>
        {locationPatients.length===0?<div className="hms-empty">No patients yet.</div>:(
          <TableWrap heads={["Patient","UHID","Ward","Doctor","Summary","Status","Admit Date"]}>
            {locationPatients.slice(0,5).map((p,i)=>{ const last=p.admissions?.[p.admissions.length-1]; const d=last?.discharge||{}; const status=d.dod?"Discharged":"Admitted"; return (
              <tr key={i}><Td><span className="hms-td-hi">{p.patientName||p.name}</span><div className="hms-td-mono" style={{marginTop:2}}>{p.gender}·{p.ageYY||p.age}y</div></Td><Td mono>{p.uhid}</Td><Td>{d.wardName||"—"}</Td><Td sm>{d.doctorName||"—"}</Td><Td><span style={{cursor:"pointer"}} onClick={()=>openSummaryEditor(p)}><SummaryPill type={p.dischargeSummary?.type} p={p}/></span></Td><Td><Badge col={status==="Admitted"?"#34d399":"#8b949e"}>{status}</Badge></Td><Td sm>{fmtDt(last?.dateTime)}</Td></tr>
            );})}
          </TableWrap>
        )}
      </div>
    </div>
  );
}
