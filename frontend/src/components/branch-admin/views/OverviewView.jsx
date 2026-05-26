import React from "react";
import StatCard from "../../ui/StatCard";
import TableShell, { Th, Td, EmptyRow } from "../../ui/TableShell";
import { mkBadge } from "../../ui/Badge";
import { T, mkBtn } from "../branchAdminConstants";

export default function OverviewView({ overview, printRequests, resolvedBranchCode, theme, setSelPatient, setNav, onApprovePrint, onViewBill }) {
  const branchPendingPrints = (printRequests || []).filter(req =>
    String(req?.patient?.branch_location || "").toUpperCase() === resolvedBranchCode
  );
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px", marginBottom: "14px" }}>
        {[["Total Patients","totalPatients",theme.primary],["Admitted Today","admittedToday",T.blue],["Discharged Today","dischargedToday",T.success],["Pending Discharge","pendingDischarge",T.warning]].map(([l,k,c]) =>
          <StatCard key={k} label={l} value={overview?.[k]} color={c} theme={theme} />
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px", marginBottom: "14px" }}>
        {[["Cash Revenue","cashRevenue",T.success,"₹"],["Total Revenue","totalRevenue",theme.primary,"₹"],["Pending Dues","pendingDues",T.danger,"₹"]].map(([l,k,c,p]) =>
          <StatCard key={k} label={l} value={overview?.[k]} color={c} prefix={p} theme={theme} />
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px", marginBottom: "24px" }}>
        {[["Employees","empCount",T.blue],["TPA Patients","tpaCount",T.purple],["Card Patients","cardCount",T.warning]].map(([l,k,c]) =>
          <StatCard key={k} label={l} value={overview?.[k]} color={c} theme={theme} />
        )}
      </div>

      <TableShell title="Recent Registrations" count={overview?.recentPatients?.length} theme={theme}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
          <thead><tr>{["ID","Name","Dept","Doctor","Admission","Pay Mode","Type","Status"].map(h => <Th key={h}>{h}</Th>)}</tr></thead>
          <tbody>
            {!overview?.recentPatients?.length ? <EmptyRow cols={8} msg="NO RECENT PATIENTS" /> :
              overview.recentPatients.map(p => (
                <tr key={p.id} style={{ cursor: "pointer" }} onClick={() => { setSelPatient(p); setNav("records"); }}>
                  <Td><span style={{ color: T.textMuted, fontSize: "10px" }}>#{p.id}</span></Td>
                  <Td primary>{p.name}</Td>
                  <Td>{p.department}</Td>
                  <Td>{p.doctor}</Td>
                  <Td>{p.admissionDate}</Td>
                  <Td><span style={mkBadge(p.paymentMode)}>{p.paymentMode}</span></Td>
                  <Td><span style={mkBadge(p.paymentType)}>{p.paymentType || "—"}</span></Td>
                  <Td><span style={mkBadge(p.status)}>{p.status}</span></Td>
                </tr>
              ))}
          </tbody>
        </table>
      </TableShell>

      <div style={{ height: "16px" }} />
      <TableShell title="Print Approval Queue" count={branchPendingPrints.length} theme={theme}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
          <thead><tr>{["UHID","Patient","Admission","Requested At","Action"].map(h => <Th key={h}>{h}</Th>)}</tr></thead>
          <tbody>
            {!branchPendingPrints.length ? <EmptyRow cols={5} msg="NO PENDING PRINT REQUESTS" /> :
              branchPendingPrints.map(req => (
                <tr key={`${req.uhid}-${req.admNo}`}>
                  <Td><span style={{ color: T.textMuted, fontSize: "10px" }}>{req.uhid}</span></Td>
                  <Td primary>{req?.patient?.patientName || req?.patient?.name || "Patient"}</Td>
                  <Td>#{req.admNo}</Td>
                  <Td>{String(req.requestedAt || "").slice(0, 16).replace("T", " ") || "—"}</Td>
                  <Td>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button style={{ ...mkBtn("primary", theme), padding: "4px 12px", fontSize: "10px" }} onClick={() => onApprovePrint?.(req, "approve")}>Approve</button>
                      <button style={{ ...mkBtn("danger", theme), padding: "4px 12px", fontSize: "10px" }} onClick={() => onApprovePrint?.(req, "reject")}>Reject</button>
                      <button style={{ ...mkBtn("dim", theme), padding: "4px 12px", fontSize: "10px" }} onClick={() => onViewBill?.(req)}>View</button>
                    </div>
                  </Td>
                </tr>
              ))}
          </tbody>
        </table>
      </TableShell>
    </>
  );
}
