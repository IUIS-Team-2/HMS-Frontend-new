import React from "react";
import { CheckSquare } from "lucide-react";
import { DEPARTMENTS } from "../../constants/hodConstants";

export default function AssignModal({
  assignDept, setAssignDept, assignEmployee, setAssignEmployee,
  assignPatients, assignPatientIds, assignPatientNames,
  assignPriority, setAssignPriority, assignDueDate, setAssignDueDate,
  assignNotes, setAssignNotes, patientSearch, setPatientSearch,
  deptEmployees, setDeptEmployees, filteredPatientSearch,
  setAssignPatients, setAssignPatientIds, setAssignPatientNames,
  toggleAssignPatient, handleAssign, loadEmployees, onClose,
}) {
  return (
    <div className="hod-overlay" onClick={onClose}>
      <div className="hod-modal hod-modal-lg" onClick={e => e.stopPropagation()}>
       <button
  className="hod-modal-close"
  onClick={onClose}
  aria-label="Close"
  title="Close"
>
  ✕
</button>
        <div className="hod-modal-title"><CheckSquare size={16} strokeWidth={1.8}/> Assign Task</div>
        <div className="hod-form-grid" style={{ marginBottom:14 }}>
          <div className="hod-form-row">
            <label className="hod-lbl">Department</label>
            <select className="hod-sel" value={assignDept} onChange={async e => { setAssignDept(e.target.value); setAssignEmployee(""); const list=await loadEmployees(e.target.value); setDeptEmployees(list); }}>
              {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="hod-form-row">
            <label className="hod-lbl">Assign To *</label>
            <select className="hod-sel" value={assignEmployee} onChange={e => setAssignEmployee(e.target.value)}>
              <option value="">Select Employee</option>
              {deptEmployees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.employee_code||e.employeeCode})</option>)}
            </select>
          </div>
          <div className="hod-form-row">
            <label className="hod-lbl">Priority</label>
            <select className="hod-sel" value={assignPriority} onChange={e => setAssignPriority(e.target.value)}>
              {["Low","Medium","High","Urgent"].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="hod-form-row">
            <label className="hod-lbl">Due Date</label>
            <input type="date" className="hod-inp" value={assignDueDate} onChange={e => setAssignDueDate(e.target.value)}/>
          </div>
        </div>
        <div className="hod-form-row">
          <label className="hod-lbl">Select Patients (up to 8) — {assignPatients.length}/8 selected</label>
          {assignPatients.length > 0 && (
            <div className="hod-selected-pills" style={{ marginBottom:8 }}>
              {assignPatients.map((uhid,idx) => (
                <span key={uhid} className="hod-sel-pill">🧑‍⚕️ {assignPatientNames[idx]}<span style={{ fontSize:9, opacity:.7 }}> · {uhid}</span>
                  <button onClick={() => { const i=assignPatients.indexOf(uhid); setAssignPatients(p=>p.filter(u=>u!==uhid)); setAssignPatientIds(p=>p.filter((_,j)=>j!==i)); setAssignPatientNames(p=>p.filter((_,j)=>j!==i)); }}>✕</button>
                </span>
              ))}
              <button className="hod-btn hod-btn-ghost" style={{ padding:"2px 9px", fontSize:"10px" }} onClick={() => { setAssignPatients([]); setAssignPatientIds([]); setAssignPatientNames([]); }}>Clear All</button>
            </div>
          )}
          <input className="hod-inp" placeholder="Search patient by name or UHID…" value={patientSearch} onChange={e => setPatientSearch(e.target.value)} style={{ marginBottom:6 }}/>
          <div className="hod-pt-list">
            {filteredPatientSearch.length === 0
              ? <div style={{ padding:"14px", textAlign:"center", color:"var(--text-muted)", fontSize:12 }}>No patients found</div>
              : filteredPatientSearch.map(p => {
                  const isSelected = assignPatients.includes(p.uhid);
                  return (
                    <div key={p.uhid} className={`hod-pt-item${isSelected?" sel":""}`} onClick={() => toggleAssignPatient(p)}>
                      <div><span style={{ fontWeight:600, color:"var(--text)" }}>{p.patientName||p.name}</span><span style={{ marginLeft:8, fontSize:10, fontFamily:"monospace", color:"var(--text-muted)" }}>{p.uhid}</span>{isSelected&&<span style={{ marginLeft:6, color:"#10b981", fontWeight:700 }}>✓</span>}</div>
                      <span style={{ fontSize:9, padding:"2px 6px", borderRadius:10, background:p.dod?"rgba(16,185,129,0.1)":"rgba(245,158,11,0.1)", color:p.dod?"#10b981":"#f59e0b" }}>{p.dod?"Discharged":"Admitted"}</span>
                    </div>
                  );
                })
            }
          </div>
        </div>
        <div className="hod-form-row"><label className="hod-lbl">Notes / Instructions</label><textarea className="hod-textarea" value={assignNotes} placeholder="Any instructions…" onChange={e => setAssignNotes(e.target.value)}/></div>
        <div className="hod-modal-foot">
          <button className="hod-btn hod-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="hod-btn hod-btn-primary" onClick={handleAssign} disabled={!assignEmployee||assignPatients.length===0}>
            Assign {assignPatients.length>0?`(${assignPatients.length} patient${assignPatients.length>1?"s":""})`:""}
          </button>
        </div>
      </div>
    </div>
  );
}
