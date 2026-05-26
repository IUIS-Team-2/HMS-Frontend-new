import React from "react";
import TableShell, { Th, Td, EmptyRow } from "../../ui/TableShell";
import FilterBar from "../../ui/FilterBar";
import { mkBadge } from "../../ui/Badge";
import { T, mkBtn, mkInput, exportExcel } from "../branchAdminConstants";

function pRow(p, resolvedBranchName) {
  return { "Patient ID": p.id, Name: p.name, Age: p.age, Gender: p.gender, Phone: p.phone, Department: p.department, Doctor: p.doctor, "Admission Date": p.admissionDate, "Discharge Date": p.dischargeDate || "", "Payment Mode": p.paymentMode, "Payment Type": p.paymentType || "", Status: p.status, Branch: resolvedBranchName };
}

export default function PatientListView({ data, exportFile, title, theme, resolvedBranchName, search, setSearch, statusFil, setStatusFil, setSelPatient, setNav }) {
  const filtered = data.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFil === "all" || p.status === statusFil;
    return matchSearch && matchStatus;
  });
  return (
    <>
      <FilterBar search={search} setSearch={setSearch} statusFil={statusFil} setStatusFil={setStatusFil} onExport={() => exportExcel(filtered.map(p => pRow(p, resolvedBranchName)), exportFile)} exportLabel="Export Excel" mkInput={mkInput} mkBtn={mkBtn} theme={theme} />
      <TableShell title={title} count={filtered.length} theme={theme}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
          <thead>
            <tr>{["ID","Name","Age","Gender","Phone","Department","Doctor","Admission","Discharge","Pay Mode","Type","Status","Records"].map(h => <Th key={h}>{h}</Th>)}</tr>
          </thead>
          <tbody>
            {!filtered.length ? <EmptyRow cols={13} /> :
              filtered.map(p => (
                <tr key={p.id}>
                  <Td><span style={{ color: T.textMuted, fontSize: "10px" }}>#{p.id}</span></Td>
                  <Td primary>{p.name}</Td>
                  <Td>{p.age}</Td><Td>{p.gender}</Td><Td>{p.phone}</Td>
                  <Td>{p.department}</Td><Td>{p.doctor}</Td>
                  <Td>{p.admissionDate}</Td>
                  <Td>{p.dischargeDate || "—"}</Td>
                  <Td><span style={mkBadge(p.paymentMode)}>{p.paymentMode}</span></Td>
                  <Td><span style={mkBadge(p.paymentType)}>{p.paymentType || "—"}</span></Td>
                  <Td><span style={mkBadge(p.status)}>{p.status}</span></Td>
                  <Td><button style={{ ...mkBtn("dim", theme), padding: "4px 12px", fontSize: "10px" }} onClick={() => { setSelPatient(p); setNav("records"); }}>View</button></Td>
                </tr>
              ))}
          </tbody>
        </table>
      </TableShell>
    </>
  );
}
