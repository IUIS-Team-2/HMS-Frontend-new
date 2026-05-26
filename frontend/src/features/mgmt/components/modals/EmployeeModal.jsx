import React from "react";
import { EMPLOYEE_ROLE_OPTIONS } from "../../constants/mgmtConstants";

export default function EmployeeModal({ showEmpModal, editEmpId, empForm, setEmpForm, empPassErr, setEmpPassErr, empShowPass, setEmpShowPass, empShowConfirm, setEmpShowConfirm, allDeptOptions, saveEmployee, setShowEmpModal, setEditEmpId }) {
  if (!showEmpModal) return null;
  return (
    <div className="hms-modal-overlay" onClick={e=>e.target===e.currentTarget&&(setShowEmpModal(false),setEmpPassErr(""),setEditEmpId(null))}>
      <div className="hms-modal-box" style={{width:520}}>
        <div className="hms-modal-title">{editEmpId?"Edit Employee Details":"Create New Employee"}</div>
        <div className="hms-g2">
          {[["Full Name","fullName","text","Jane Doe"],["Username","username","text","jane.doe"],["Employee ID","empId","text","EMP-001"],["Email","email","email","jane@hospital.com"],["Phone","phone","tel","+91 98765 43210"]].map(([lbl,k,type,ph])=>(
            <div key={k}><label className="hms-lbl">{lbl}</label><input type={type} placeholder={ph} value={empForm[k]} className="hms-inp" onChange={e=>{setEmpForm(f=>({...f,[k]:e.target.value}));setEmpPassErr("");}} disabled={k==="username"&&!!editEmpId}/></div>
          ))}
        </div>
        <label className="hms-lbl">Access Role</label>
        <select className="hms-sel" value={empForm.role} onChange={e=>{ const nr=e.target.value; const nd=EMPLOYEE_ROLE_OPTIONS.find(o=>o.value===nr)?.label||empForm.dept; setEmpForm(f=>({...f,role:nr,dept:nd})); }}>
          {EMPLOYEE_ROLE_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <label className="hms-lbl">Department</label>
        <select className="hms-sel" value={empForm.dept} onChange={e=>setEmpForm(f=>({...f,dept:e.target.value}))}>
          {allDeptOptions.map(d=><option key={d}>{d}</option>)}
        </select>
        <div className="hms-g2">
          {[["Password","password",empShowPass,setEmpShowPass],["Confirm Password","confirmPassword",empShowConfirm,setEmpShowConfirm]].map(([lbl,k,show,setShow])=>(
            <div key={k}><label className="hms-lbl">{lbl}{editEmpId&&<span style={{fontSize:9}}> (Leave blank to keep current)</span>}</label><div className="hms-pass-wrap"><input type={show?"text":"password"} placeholder={editEmpId?"Leave blank to keep current":"••••••••"} value={empForm[k]} className="hms-inp" style={{paddingRight:50}} onChange={e=>{setEmpForm(f=>({...f,[k]:e.target.value}));setEmpPassErr("");}}/><button type="button" className="hms-pass-toggle" onClick={()=>setShow(p=>!p)}>{show?"HIDE":"SHOW"}</button></div></div>
          ))}
        </div>
        {empPassErr&&<div className="hms-err-text">{empPassErr}</div>}
        <div className="hms-modal-foot">
          <button className="hms-cancel-btn" onClick={()=>{setShowEmpModal(false);setEmpPassErr("");setEditEmpId(null);}}>Cancel</button>
          <button className="hms-save-btn" onClick={saveEmployee}>{editEmpId?"Save Changes":"Create Employee"}</button>
        </div>
      </div>
    </div>
  );
}
