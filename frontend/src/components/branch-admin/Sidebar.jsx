import React from "react";
import { NAV, T, mkBtn } from "./branchAdminConstants";

export default function Sidebar({ nav, setNav, theme, resolvedBranchName, resolvedAdminName, onLogout }) {
  return (
    <aside style={{ width: "256px", minWidth: "256px", background: T.surface, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div style={{ padding: "22px 20px 18px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: "8px", letterSpacing: "4px", color: T.textMuted, textTransform: "uppercase", marginBottom: "2px" }}>MedCore HMS</div>
        <div style={{ fontSize: "16px", fontWeight: "800", color: T.text }}>Branch Admin</div>
        <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "34px", height: "34px", borderRadius: "9px", flexShrink: 0, background: theme.primaryDim, border: `1px solid ${theme.primaryBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "800", color: theme.primary }}>
            {resolvedAdminName?.[0]?.toUpperCase() || "A"}
          </div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: "600", color: T.text }}>{resolvedAdminName}</div>
            <div style={{ fontSize: "9px", color: T.textMuted, letterSpacing: "1px" }}>Branch Admin</div>
          </div>
        </div>
      </div>

      <div style={{ margin: "14px 14px 2px", padding: "11px 14px", background: theme.glow, border: `1px solid ${theme.primaryBorder}`, borderRadius: "9px" }}>
        <div style={{ fontSize: "8px", letterSpacing: "2px", color: T.textMuted, textTransform: "uppercase", marginBottom: "5px" }}>Assigned Branch</div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
          <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: theme.primary, flexShrink: 0 }} />
          <div style={{ fontSize: "14px", fontWeight: "700", color: theme.primary }}>{resolvedBranchName}</div>
        </div>
        <div style={{ fontSize: "9px", color: T.textMuted }}>Read-only · Set by SuperAdmin</div>
        {onLogout && (
          <button style={{ ...mkBtn("danger", theme), marginTop: "10px", width: "100%", justifyContent: "center" }} onClick={onLogout}>Logout</button>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0, padding: "14px 12px", overflowY: "auto", overscrollBehavior: "contain" }}>
        <div style={{ fontSize: "8px", letterSpacing: "3px", color: T.textMuted, textTransform: "uppercase", padding: "0 8px", marginBottom: "8px" }}>Menu</div>
        {NAV.map(item => {
          const Icon = item.icon;
          return (
            <button key={item.id} onClick={() => setNav(item.id)} style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "10px 12px", borderRadius: "8px", border: "none", cursor: "pointer", textAlign: "left", marginBottom: "2px", fontFamily: "inherit", background: nav === item.id ? theme.primaryDim : "transparent", color: nav === item.id ? theme.primary : T.textSub, borderLeft: nav === item.id ? `2px solid ${theme.primary}` : "2px solid transparent", transition: "all 0.15s" }}>
              <span style={{ fontSize: "15px", width: "20px", textAlign: "center", flexShrink: 0, display: "inline-flex", justifyContent: "center" }}>
                {Icon ? <Icon size={15} strokeWidth={2} /> : null}
              </span>
              <span style={{ fontSize: "12px", fontWeight: nav === item.id ? "600" : "400" }}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
