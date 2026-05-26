import React from "react";
import { TASK_STATUS, TASK_PRIORITY, TASK_STATUS_META } from "../../constants/mgmtConstants";

export default function TasksView({ accent, tasks, allDeptOptions, openNewTask, openEditTask, deleteTask, updateTaskStatus, fmtDt, Badge, PriorityPill, StatusPill, ActionBtn, EmptyState, CardRow, TableWrap, Th, Td }) {
  const ts = {total:tasks.length,pending:tasks.filter(t=>t.status==="Pending").length,inprogress:tasks.filter(t=>t.status==="In Progress").length,completed:tasks.filter(t=>t.status==="Completed").length,urgent:tasks.filter(t=>t.priority==="Urgent"&&t.status!=="Completed").length};
  return (
    <div>
      <div className="hms-stat-grid">{[{label:"Total",val:ts.total,col:accent},{label:"Pending",val:ts.pending,col:"#f59e0b"},{label:"In Progress",val:ts.inprogress,col:"#38bdf8"},{label:"Completed",val:ts.completed,col:"#34d399"},{label:"Urgent",val:ts.urgent,col:"#f87171"}].map((s,i)=>(<div key={i} className="hms-stat-card" style={{padding:"12px 14px",border:`1px solid ${s.col}18`}}><div className="hms-stat-num" style={{fontSize:20,color:s.col}}>{s.val}</div><div className="hms-stat-label">{s.label}</div></div>))}</div>
      <div className="hms-card">
        <CardRow title="All Tasks" action={<button className="hms-add-btn" onClick={openNewTask}>+ Assign Task</button>}/>
        {!tasks.length?<EmptyState icon="✅" label="No tasks yet" sub='Click "Assign Task" to create one'/>:(
          <TableWrap heads={["Task","Assigned To","Dept","Priority","Status","Due Date","Patients","Actions"]}>
            {tasks.map(t=>(
              <tr key={t.id}>
                <Td><span className="hms-td-hi">{t.title}</span>{t.description&&<div style={{fontSize:9,color:"#64748b",marginTop:2,maxWidth:180}}>{t.description.slice(0,60)}{t.description.length>60?"…":""}</div>}</Td>
                <Td>{t.assignedTo}</Td><Td><Badge col={accent}>{t.department}</Badge></Td>
                <Td><PriorityPill p={t.priority}/></Td>
                <Td><select className="hms-task-status-sel" style={{background:TASK_STATUS_META[t.status]?.bg||"transparent",borderColor:`${TASK_STATUS_META[t.status]?.color||"#6b7280"}40`,color:TASK_STATUS_META[t.status]?.color||"inherit"}} value={t.status} onChange={e=>updateTaskStatus(t.id,e.target.value)}>{TASK_STATUS.map(s=><option key={s} value={s}>{s}</option>)}</select></Td>
                <Td sm>{fmtDt(t.dueDate)}</Td>
                <Td sm>{(t.patientNames||[]).length>0?<div>{(t.patientNames||[]).map((name,ni)=><div key={ni} style={{color:"#38bdf8",fontSize:10}}>{name}</div>)}</div>:"—"}</Td>
                <Td><div style={{display:"flex",gap:4}}><ActionBtn aria-label="Edit task" col={accent} onClick={()=>openEditTask(t)}>✎</ActionBtn></div></Td>
              </tr>
            ))}
          </TableWrap>
        )}
      </div>
    </div>
  );
}
