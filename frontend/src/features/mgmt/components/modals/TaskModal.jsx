import React from "react";
import { TASK_PRIORITY, TASK_STATUS } from "../../constants/mgmtConstants";

export default function TaskModal({ showTaskModal, editTask, taskForm, setTaskForm, allDeptOptions, taskAssignableEmployees, taskPatientSearch, setTaskPatientSearch, filteredTaskPatients, toggleTaskPatient, saveTask, setShowTaskModal, setEditTask, accent, isDark }) {
  if (!showTaskModal) return null;
  return (
    <div className="hms-modal-overlay" onClick={e=>e.target===e.currentTarget&&(setShowTaskModal(false),setEditTask(null))}>
      <div className="hms-modal-box" style={{width:540}}>
        <div className="hms-modal-title">{editTask?"Edit Task":"Assign New Task"}</div>
        <label className="hms-lbl">Task Title *</label>
        <input className="hms-inp" placeholder="E.g. Prepare daily billing report" value={taskForm.title} onChange={e=>setTaskForm(f=>({...f,title:e.target.value}))}/>
        <label className="hms-lbl">Description</label>
        <textarea className="hms-textarea" placeholder="Task details…" value={taskForm.description} onChange={e=>setTaskForm(f=>({...f,description:e.target.value}))}/>
        <div className="hms-g2">
          <div>
            <label className="hms-lbl">Assigned To *</label>
            <select className="hms-sel" value={taskForm.assignedToId} onChange={e=>setTaskForm(f=>({...f,assignedToId:e.target.value}))}>
              <option value="">Select employee</option>
              {taskAssignableEmployees.map(e=><option key={e.id} value={String(e.id)}>{`${e.fullName||e.name||e.username} (${e.empId||`ID-${e.id}`})`}</option>)}
            </select>
          </div>
          <div>
            <label className="hms-lbl">Department</label>
            <select className="hms-sel" value={taskForm.department} onChange={e=>setTaskForm(f=>({...f,department:e.target.value,assignedToId:""}))}>
              {allDeptOptions.map(d=><option key={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <div className="hms-g2">
          <div><label className="hms-lbl">Priority</label><select className="hms-sel" value={taskForm.priority} onChange={e=>setTaskForm(f=>({...f,priority:e.target.value}))}>{TASK_PRIORITY.map(p=><option key={p}>{p}</option>)}</select></div>
          <div><label className="hms-lbl">Due Date</label><input className="hms-inp" type="date" value={taskForm.dueDate} onChange={e=>setTaskForm(f=>({...f,dueDate:e.target.value}))}/></div>
        </div>
        <label className="hms-lbl">Link to Patients <span style={{color:"#64748b",fontWeight:400,marginLeft:6}}>(optional · up to 8)</span></label>
        {taskForm.patientUhids.length>0&&(
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
            {taskForm.patientUhids.map((uhid,idx)=>(
              <div key={uhid} className="hms-patient-selected-pill">🧑‍⚕️ {taskForm.patientNames[idx]}<span style={{color:"#64748b",fontSize:10,fontWeight:400}}> · {uhid}</span><button style={{background:"none",border:"none",color:accent,cursor:"pointer",fontSize:13,opacity:0.7}} onClick={()=>setTaskForm(f=>({...f,patientUhids:f.patientUhids.filter((_,i)=>i!==idx),patientNames:f.patientNames.filter((_,i)=>i!==idx)}))}>✕</button></div>
            ))}
            <button style={{fontSize:10,color:"#f87171",background:"none",border:"1px solid #f8717140",borderRadius:12,padding:"3px 10px",cursor:"pointer"}} onClick={()=>setTaskForm(f=>({...f,patientUhids:[],patientNames:[]}))}>Clear All</button>
          </div>
        )}
        {taskForm.patientUhids.length<8&&(
          <>
            <input className="hms-patient-search" placeholder="Search patient…" value={taskPatientSearch} onChange={e=>setTaskPatientSearch(e.target.value)}/>
            <div className="hms-patient-select-box">
              {filteredTaskPatients.length===0?<div style={{padding:"10px 12px",fontSize:11,color:"#64748b",textAlign:"center"}}>No patients found</div>:filteredTaskPatients.map(p=>{ const isSel=taskForm.patientUhids.includes(p.uhid); return (<div key={p.uhid} className={`hms-patient-select-item${isSel?" selected":""}`} onClick={()=>toggleTaskPatient(p)}><div><span style={{fontWeight:600,color:isDark?"#e2e8f0":"#1e293b"}}>{p.name}</span><span style={{marginLeft:8,color:"#64748b",fontSize:10}}>{p.uhid}</span>{isSel&&<span style={{marginLeft:6,color:accent,fontSize:11,fontWeight:700}}>✓</span>}</div><div style={{display:"flex",gap:5,alignItems:"center"}}><span style={{fontSize:9,padding:"2px 6px",borderRadius:10,background:p.status==="Admitted"?"#34d39918":"#6b728018",color:p.status==="Admitted"?"#34d399":"#6b7280"}}>{p.status}</span></div></div>); })}
            </div>
          </>
        )}
        <div style={{fontSize:10,color:"#64748b",marginTop:4,marginBottom:4}}>{taskForm.patientUhids.length}/8 selected</div>
        <div className="hms-modal-foot">
          <button className="hms-cancel-btn" onClick={()=>{setShowTaskModal(false);setEditTask(null);}}>Cancel</button>
          <button className="hms-save-btn" onClick={saveTask}>{editTask?"Update Task":"Assign Task"}</button>
        </div>
      </div>
    </div>
  );
}
