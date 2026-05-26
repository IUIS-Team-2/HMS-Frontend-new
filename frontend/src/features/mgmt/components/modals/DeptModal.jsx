import React from "react";

export default function DeptModal({ showDeptModal, deptForm, setDeptForm, saveDepartment, setShowDeptModal }) {
  if (!showDeptModal) return null;
  return (
    <div className="hms-modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowDeptModal(false)}>
      <div className="hms-modal-box" style={{width:420}}>
        <div className="hms-modal-title">Create New Department</div>
        <label className="hms-lbl">Name *</label><input className="hms-inp" placeholder="E.g. Radiology" value={deptForm.name} onChange={e=>setDeptForm(f=>({...f,name:e.target.value}))}/>
        <label className="hms-lbl">Description</label><input className="hms-inp" placeholder="Brief description" value={deptForm.description} onChange={e=>setDeptForm(f=>({...f,description:e.target.value}))}/>
        <label className="hms-lbl">HOD (optional)</label><input className="hms-inp" placeholder="Name of HOD" value={deptForm.head} onChange={e=>setDeptForm(f=>({...f,head:e.target.value}))}/>
        <div className="hms-modal-foot">
          <button className="hms-cancel-btn" onClick={()=>setShowDeptModal(false)}>Cancel</button>
          <button className="hms-save-btn" onClick={saveDepartment}>Create</button>
        </div>
      </div>
    </div>
  );
}
