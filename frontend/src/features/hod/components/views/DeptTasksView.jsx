import React from "react";
import { Filter, RefreshCw, Eye, Star, Send } from "lucide-react";
import { STATUS_META } from "../../constants/hodConstants";
import { fmtDt, hodTaskRowStatus, isHodTaskCompleted } from "../../utils/hodUtils";
import PriorityBadge from "../PriorityBadge";

export default function DeptTasksView({
  tasks, employees, activeDept, deptColor,
  filterEmployee, setFilterEmployee,
  filterStatus, setFilterStatus,
  filterDate, setFilterDate,
  loadTasks, openAssignModal, openReviewWork,
  openReview, openSubmitToAdmin, removeTask, updateTaskStatus,
}) {
  const filtered = tasks.filter(t => {
    if (filterStatus && hodTaskRowStatus(t) !== String(filterStatus).toLowerCase()) return false;
    const empId = t.employeeId ?? t.assigned_to;
    if (filterEmployee && String(empId) !== filterEmployee) return false;
    return true;
  });
  return (
    <div>
      <div className="hod-filter-bar">
        <Filter size={13} style={{ color:"var(--text-muted)" }}/>
        <select className="hod-sel" style={{ width:"auto" }} value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)}>
          <option value="">All Employees</option>
          {employees.filter(e => (e.department||e.dept) === activeDept).map(e => (
            <option key={e.id} value={e.id}>{e.name||e.get_full_name} ({e.employee_code||e.employeeCode})</option>
          ))}
        </select>
        <select className="hod-sel" style={{ width:"auto" }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          {Object.entries(STATUS_META).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <input type="date" className="hod-inp" style={{ width:"auto" }} value={filterDate} onChange={e => setFilterDate(e.target.value)}/>
        <button className="hod-btn hod-btn-ghost" onClick={loadTasks}><RefreshCw size={12}/></button>
        <button className="hod-btn hod-btn-primary" style={{ marginLeft:"auto" }} onClick={() => openAssignModal(activeDept)}>+ Assign to {activeDept}</button>
      </div>
      <div className="hod-stat-grid" style={{ marginBottom:18 }}>
        {[
          { label:"Total",     val:tasks.filter(t=>t.department===activeDept).length,                                    col:deptColor },
          { label:"Pending",   val:tasks.filter(t=>t.department===activeDept&&hodTaskRowStatus(t)==="pending").length,   col:"#f59e0b" },
          { label:"Completed", val:tasks.filter(t=>t.department===activeDept&&hodTaskRowStatus(t)==="completed").length, col:"#10b981" },
          { label:"Overdue",   val:tasks.filter(t=>t.department===activeDept&&hodTaskRowStatus(t)==="overdue").length,   col:"#ef4444" },
        ].map((s,i) => (
          <div key={i} className="hod-stat-card">
            <div style={{ fontSize:24, fontWeight:800, color:s.col }}>{s.val}</div>
            <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:3 }}>{s.label} Tasks</div>
          </div>
        ))}
      </div>
      <div className="hod-table-wrap">
        <table className="hod-table">
          <thead><tr>{["Task","Patients","Assignee","Priority","Status","Due","Actions"].map(h => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={7} style={{ textAlign:"center", padding:40, color:"var(--text-muted)" }}>No tasks found</td></tr>
              : filtered.map(task => (
                <tr key={task.id}>
                  <td>
                    <div style={{ fontWeight:600, color:"var(--text)", fontSize:12 }}>{task.taskType||task.title}</div>
                    {task.notes && <div style={{ fontSize:10, color:"var(--text-muted)", marginTop:2 }}>{String(task.notes).slice(0,50)}{String(task.notes).length>50?"…":""}</div>}
                  </td>
                  <td>
                    {task.patientId
                      ? <div style={{ fontSize:10, color:"#06b6d4", fontFamily:"monospace" }}>{task.patientId}</div>
                      : (task.patient_uhids||(task.patient_uhid?[task.patient_uhid]:[])).map((u,i) => <div key={i} style={{ fontSize:10, color:"#06b6d4", fontFamily:"monospace" }}>{(task.patient_names||[])[i]||u}</div>)
                    }
                  </td>
                  <td style={{ fontWeight:600 }}>{task.employeeName||task.assigned_to_name||"—"}</td>
                  <td><PriorityBadge priority={task.priority||"Medium"}/></td>
                  <td>
                    <select className="hod-sel" style={{ width:"auto", padding:"3px 8px", fontSize:10, background:STATUS_META[hodTaskRowStatus(task)]?.bg||"transparent", color:STATUS_META[hodTaskRowStatus(task)]?.text||"var(--text-mid)", borderColor:STATUS_META[hodTaskRowStatus(task)]?.border||"var(--border)" }}
                      value={hodTaskRowStatus(task)} onChange={e => updateTaskStatus(task.id, e.target.value)}>
                      {Object.entries(STATUS_META).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </td>
                  <td style={{ fontSize:11 }}>{fmtDt(task.dueDate||task.due_date)}</td>
                  <td>
                    <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                      {isHodTaskCompleted(task) && <button className="hod-btn hod-btn-blue" style={{ padding:"3px 9px", fontSize:"10px" }} onClick={() => openReviewWork(task)}><Eye size={10}/> Review Work</button>}
                      <button className="hod-btn hod-btn-ghost" style={{ padding:"3px 9px", fontSize:"10px" }} onClick={() => openReview(task,null)}><Star size={10}/> Rate</button>
                      {isHodTaskCompleted(task) && !task.submitted_at && <button className="hod-btn" style={{ padding:"3px 9px", fontSize:"10px", background:"rgba(99,102,241,0.1)", borderColor:"rgba(99,102,241,0.3)", color:"#6366f1" }} onClick={() => openSubmitToAdmin({ id:task.id, type:"task", name:task.taskType||task.title })}><Send size={10}/> Submit</button>}
                      <button className="hod-btn hod-btn-danger" style={{ padding:"3px 9px", fontSize:"10px" }} onClick={() => removeTask(task.id)}>✕ Remove</button>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
