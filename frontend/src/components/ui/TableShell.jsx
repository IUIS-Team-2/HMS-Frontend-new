import React from "react";
export function Th({ children }) {
  return (
    <th style={{ padding: "10px 16px", textAlign: "left", fontSize: "9px", letterSpacing: "2px", color: "var(--text-muted)", textTransform: "uppercase", borderBottom: "1px solid var(--border)", background: "var(--surface)", whiteSpace: "nowrap" }}>
      {children}
    </th>
  );
}
export function Td({ children, primary, hi, style: sx = {} }) {
  return (
    <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)22", color: primary ? "var(--text)" : hi || "var(--text-mid)", fontWeight: primary ? "600" : "400", verticalAlign: "middle", ...sx }}>
      {children}
    </td>
  );
}
export function EmptyRow({ cols, msg = "NO DATA" }) {
  return (
    <tr><td colSpan={cols} style={{ padding: "52px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: "10px", letterSpacing: "3px" }}>{msg}</td></tr>
  );
}
export default function TableShell({ title, count, children, theme }) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden", boxShadow: `0 18px 40px ${theme?.glow || "rgba(0,0,0,0.08)"}` }}>
      <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", background: "var(--surface)" }}>
        <div style={{ fontSize: "11px", color: "var(--text)", fontWeight: "700", letterSpacing: "0.2px" }}>{title}</div>
        <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{count ?? 0}</div>
      </div>
      <div style={{ overflowX: "auto" }}>{children}</div>
    </div>
  );
}
