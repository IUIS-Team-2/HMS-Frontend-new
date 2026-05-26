import React from "react";
import { Edit3 } from "lucide-react";

export default function EditTaskModal({ editTask, editForm, setEditForm, deptEmployees, saveEditTask, onClose, STATUS_META, hodTaskRowStatus, backendStatusFromUi }) {
  return (
    <div className="hod-overlay" onClick={onClose}>
      <div className="hod-modal" onClick={e => e.stopPropagation()}>
        <button
  className="hod-modal-close"
  onClick={onClose}
  aria-label="Close"
  title="Close"
>
  ✕
</button>
        <div className="hod-modal-title"><Edit3 size={16}/> Edit Task</div>
        <div style={{ fontSize:13, color:"var(--text-muted)", marginBottom:16 }}>{editTask.taskType||editTask.title}</div>
        <div className="hod-form-grid" style={{ marginBottom:14 }}>
          <div className="hod-form-row">
            <label className="hod-lbl">Reassign To</label>
            <select className="hod-sel" value={editForm.assigned_to||editTask.assigned_to||""} onChange={e => setEditForm(p=>({...p,assigned_to:e.target.value}))}>
              <option value="">Keep Current ({editTask.employeeName||editTask.assigned_to_name||"—"})</option>
              {deptEmployees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.employee_code||e.employeeCode})</option>)}
            </select>
          </div>
          <div className="hod-form-row">
            <label className="hod-lbl">Priority</label>
            <select className="hod-sel" value={editForm.priority} onChange={e => setEditForm(p=>({...p,priority:e.target.value}))}>
              {["Low","Medium","High","Urgent"].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="hod-form-row">
            <label className="hod-lbl">Due Date</label>
            <input type="date" className="hod-inp" value={editForm.due_date} onChange={e => setEditForm(p=>({...p,due_date:e.target.value}))}/>
          </div>
          <div className="hod-form-row">
            <label className="hod-lbl">Status</label>
            <select className="hod-sel" value={editForm.status||hodTaskRowStatus(editTask)} onChange={e => setEditForm(p=>({...p,status:e.target.value}))}>
              {Object.entries(STATUS_META).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>
        <div className="hod-form-row"><label className="hod-lbl">Notes / Instructions</label><textarea className="hod-textarea" value={editForm.notes} placeholder="Update instructions..." onChange={e => setEditForm(p=>({...p,notes:e.target.value}))}/></div>
        <div style={{ background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:10, padding:"12px 14px", marginBottom:14 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:".07em", marginBottom:8 }}>Current Patients</div>
          {(editTask.patient_uhids||(editTask.patient_uhid?[editTask.patient_uhid]:[])).map((u,i) => (
            <div key={u} style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 0", borderBottom:"1px solid var(--border)", fontSize:12 }}>
              <span style={{ color:"#06b6d4", fontFamily:"monospace" }}>{u}</span>
              <span style={{ color:"var(--text-muted)" }}>{(editTask.patient_names||[])[i]||""}</span>
            </div>
          ))}
          {editTask.patientId && <div style={{ fontSize:12, color:"#06b6d4", fontFamily:"monospace" }}>{editTask.patientId}</div>}
        </div>
        <div className="hod-modal-foot">
          <button className="hod-btn hod-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="hod-btn hod-btn-primary" onClick={saveEditTask}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}
