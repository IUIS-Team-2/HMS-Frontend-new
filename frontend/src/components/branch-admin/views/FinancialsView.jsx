import React from "react";
import StatCard from "../../ui/StatCard";
import TableShell, { Th, Td, EmptyRow } from "../../ui/TableShell";
import { mkBadge } from "../../ui/Badge";
import { T, mkBtn, exportExcel } from "../branchAdminConstants";

export default function FinancialsView({ financials, theme, resolvedBranchKey, range }) {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px", marginBottom: "24px" }}>
        {[["Cash Total","cashTotal",T.success,"₹"],["Grand Total","grandTotal",theme.primary,"₹"],["Collected Today","collectedToday",T.blue,"₹"],["Pending Dues","pendingDues",T.danger,"₹"]].map(([l,k,c,p]) =>
          <StatCard key={k} label={l} value={financials?.[k]} color={c} prefix={p || ""} theme={theme} />
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
        <button style={mkBtn("excel", theme)} onClick={() => exportExcel(financials?.cashTxns || [], `financials_${resolvedBranchKey}_${range}`)}>↓ Export Excel</button>
      </div>
      <TableShell title="Cash Transactions" count={financials?.cashTxns?.length} theme={theme}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
          <thead><tr>{["Patient ID","Name","Date","Amount","Description","Received By","Status"].map(h => <Th key={h}>{h}</Th>)}</tr></thead>
          <tbody>
            {!financials?.cashTxns?.length ? <EmptyRow cols={7} msg="NO CASH TRANSACTIONS" /> :
              financials.cashTxns.map((r, i) => (
                <tr key={i}>
                  <Td><span style={{ color: T.textMuted, fontSize: "10px" }}>#{r.patientId}</span></Td>
                  <Td primary>{r.patientName}</Td>
                  <Td>{r.date}</Td>
                  <Td hi={T.success} style={{ fontWeight: "700" }}>₹{r.amount?.toLocaleString()}</Td>
                  <Td>{r.description}</Td>
                  <Td>{r.receivedBy}</Td>
                  <Td><span style={mkBadge(r.status)}>{r.status}</span></Td>
                </tr>
              ))}
          </tbody>
        </table>
      </TableShell>
    </>
  );
}
