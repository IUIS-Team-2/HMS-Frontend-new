import React from "react";
import ThemeModeDock from "../ui/ThemeModeDock";
import { NAV, RANGES, T, mkInput, mkBtn } from "./branchAdminConstants";

export default function Topbar({ nav, range, setRange, fromDate, setFromDate, toDate, setToDate, resolvedBranchName }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 28px", borderBottom: `1px solid ${T.border}`, background: T.surface, flexShrink: 0 }}>
      <div>
        <div style={{ fontSize: "9px", letterSpacing: "2px", color: T.textMuted, textTransform: "uppercase", marginBottom: "2px" }}>
          {resolvedBranchName} / {NAV.find(n => n.id === nav)?.label}
        </div>
        <div style={{ fontSize: "18px", fontWeight: "800", color: T.text }}>{NAV.find(n => n.id === nav)?.label}</div>
      </div>
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <div style={{ display: "flex", background: "var(--surface-2)", border: `1px solid ${T.border}`, borderRadius: "8px", overflow: "hidden" }}>
          {RANGES.map(r => (
            <button key={r} onClick={() => setRange(r)} style={{ padding: "7px 14px", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "11px", letterSpacing: "0.5px", transition: "all 0.15s", background: range === r ? "var(--info-soft)" : "transparent", color: range === r ? "var(--info)" : T.textMuted, fontWeight: range === r ? "600" : "400" }}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
        <input type="date" style={{ ...mkInput(), fontSize: "11px" }} value={fromDate} onChange={e => setFromDate(e.target.value)} title="From Date" />
        <span style={{ color: T.textMuted }}>→</span>
        <input type="date" style={{ ...mkInput(), fontSize: "11px" }} value={toDate} onChange={e => setToDate(e.target.value)} title="To Date" />
        <ThemeModeDock variant="inline" />
      </div>
    </div>
  );
}
