import React from "react";
import StatCard from "../../ui/StatCard";
import TableShell, { Th, Td, EmptyRow } from "../../ui/TableShell";
import { T, mkBtn, exportExcel } from "../branchAdminConstants";

export default function EmployeesView({ employees, theme, resolvedBranchKey, resolvedBranchName, onAddEmployee, onDeleteEmployee }) {
  const roleColor = { Doctor: T.blue, Nurse: T.success, Admin: T.warning, Billing: T.purple, HOD: theme.primary };
  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginBottom: "20px" }}>
        <button style={mkBtn("excel", theme)} onClick={() => exportExcel(employees.map(e => ({ "Emp ID": e.employeeId, Name: e.name, Email: e.email, Phone: e.phone, Role: e.role, Joined: e.joinedDate, Branch: resolvedBranchName })), `employees_${resolvedBranchKey}`)}>↓ Excel</button>
        <button style={mkBtn("primary", theme)} onClick={onAddEmployee}>+ Add Employee</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "14px", marginBottom: "22px" }}>
        <StatCard label="Total Staff" value={employees.length} color={theme.primary} theme={theme} />
        {["Doctor","Nurse","Admin","Billing"].map(r => (
          <StatCard key={r} label={`${r}s`} value={employees.filter(e => e.role === r).length} color={roleColor[r] || T.blue} theme={theme} />
        ))}
      </div>
      <TableShell title="Employees" count={employees.length} theme={theme}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
          <thead><tr>{["Emp ID","Name","Email","Phone","Role","Joined","Action"].map(h => <Th key={h}>{h}</Th>)}</tr></thead>
          <tbody>
            {!employees.length ? <EmptyRow cols={7} msg="NO EMPLOYEES" /> :
              employees.map(emp => (
                <tr key={emp.id}>
                  <Td><span style={{ color: T.textMuted, fontSize: "10px" }}>{emp.employeeId}</span></Td>
                  <Td primary>{emp.name}</Td>
                  <Td>{emp.email}</Td>
                  <Td>{emp.phone}</Td>
                  <Td>
                    <span style={{ background: (roleColor[emp.role] || T.blue) + "20", color: roleColor[emp.role] || T.blue, border: `1px solid ${(roleColor[emp.role] || T.blue)}40`, padding: "2px 9px", borderRadius: "20px", fontSize: "10px", fontWeight: "600" }}>
                      {emp.role}
                    </span>
                  </Td>
                  <Td>{emp.joinedDate}</Td>
                  <Td><button style={{ ...mkBtn("danger", theme), padding: "4px 12px", fontSize: "10px" }} onClick={() => onDeleteEmployee(emp.id)}>Remove</button></Td>
                </tr>
              ))}
          </tbody>
        </table>
      </TableShell>
    </>
  );
}
