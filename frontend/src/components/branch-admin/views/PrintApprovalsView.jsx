import React from "react";
import StatCard from "../../ui/StatCard";
import TableShell, { Th, Td, EmptyRow } from "../../ui/TableShell";
import { mkBadge } from "../../ui/Badge";
import { T, mkBtn } from "../branchAdminConstants";

export default function PrintApprovalsView({ printRequests, resolvedBranchCode, theme, onApprovePrint, onViewBill }) {
  const allPrints    = printRequests || [];
  const branchPrints = allPrints.filter(req => String(req?.patient?.branch_location || "").toUpperCase() === resolvedBranchCode);
  const pending      = branchPrints.filter(r => !r.approvedAt && !r.rejectedAt);
  const approved     = branchPrints.filter(r => !!r.approvedAt);
  const rejected     = branchPrints.filter(r => !!r.rejectedAt);

  const PATable = ({ rows, label, showActions }) => (
    <div style={{ marginBottom: 20 }}>
      <TableShell title={label} count={rows.length} theme={theme}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
          <thead><tr>{["UHID","Patient","Adm #","Requested At", showActions ? "Action" : "Status"].map(h => <Th key={h}>{h}</Th>)}</tr></thead>
          <tbody>
            {!rows.length ? <EmptyRow cols={5} msg="NONE" /> :
              rows.map(req => (
                <tr key={req.uhid + "-" + req.admNo}>
                  <Td><span style={{ color: T.textMuted, fontSize: "10px" }}>{req.uhid}</span></Td>
                  <Td primary>{req?.patient?.patientName || req?.patient?.name || "Patient"}</Td>
                  <Td>#{req.admNo}</Td>
                  <Td>{String(req.requestedAt || "").slice(0, 16).replace("T", " ") || "—"}</Td>
                  <Td>
                    {showActions ? (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button style={{ ...mkBtn("primary", theme), padding: "4px 12px", fontSize: "10px" }} onClick={() => onApprovePrint?.(req, "approve")}>Approve</button>
                        <button style={{ ...mkBtn("danger", theme), padding: "4px 12px", fontSize: "10px" }} onClick={() => onApprovePrint?.(req, "reject")}>Reject</button>
                        <button style={{ ...mkBtn("dim", theme), padding: "4px 12px", fontSize: "10px" }} onClick={() => onViewBill?.(req)}>View</button>
                      </div>
                    ) : (
                      <span style={mkBadge(req.approvedAt ? "active" : "unpaid")}>{req.approvedAt ? "Approved" : "Rejected"}</span>
                    )}
                  </Td>
                </tr>
              ))}
          </tbody>
        </table>
      </TableShell>
    </div>
  );

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px", marginBottom: "24px" }}>
        <StatCard label="Pending"  value={pending.length}  color={T.warning} theme={theme} />
        <StatCard label="Approved" value={approved.length} color={T.success} theme={theme} />
        <StatCard label="Rejected" value={rejected.length} color={T.danger}  theme={theme} />
      </div>
      <PATable rows={pending}  label="Pending Approvals" showActions={true}  />
      <PATable rows={approved} label="Approved"          showActions={false} />
      <PATable rows={rejected} label="Rejected"          showActions={false} />
    </>
  );
}
