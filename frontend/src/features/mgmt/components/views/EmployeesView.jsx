import React from "react";

export default function EmployeesView({ accent, employees, openEditEmployee, handleToggleActive, setEditEmpId, setEmpPassErr, setEmpForm, setShowEmpModal, Badge, ActionBtn, EmptyState, TableWrap, Th, Td }) {
  return (
    <div>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
        <button className="hms-add-btn-lg" onClick={()=>{ setEditEmpId(null);setEmpPassErr("");setEmpForm({fullName:"",username:"",empId:"",dept:"HOD",email:"",phone:"",role:"hod",password:"",confirmPassword:""});setShowEmpModal(true); }}>+ Create Employee</button>
      </div>
      {!employees.length?<EmptyState icon="👤" label="No employees yet"/>:(
        <TableWrap heads={["Emp ID","Full Name","Username","Role","Department","Email","Phone","Status","Actions"]}>
          {employees.map((emp,i)=>(
            <tr key={i}>
              <Td mono style={{color:accent}}>{emp.empId||emp.id}</Td><Td hi>{emp.fullName||emp.name}</Td><Td sm>{emp.username}</Td>
              <Td><Badge col="#818cf8">{emp.role||"Staff"}</Badge></Td><Td><Badge col={accent}>{emp.dept}</Badge></Td>
              <Td sm>{emp.email}</Td><Td sm>{emp.phone}</Td>
              <Td><Badge col={emp.status==="Inactive"?"#f87171":"#34d399"}>{emp.status||"Active"}</Badge></Td>
              <Td><div style={{display:"flex",gap:6}}><ActionBtn col={accent} onClick={()=>openEditEmployee(emp)}>✎ Edit</ActionBtn><ActionBtn col={emp.status==="Inactive"?"#34d399":"#f87171"} onClick={()=>handleToggleActive(emp,i)}>{emp.status==="Inactive"?"✓ Activate":"⊘ Deactivate"}</ActionBtn></div></Td>
            </tr>
          ))}
        </TableWrap>
      )}
    </div>
  );
}
