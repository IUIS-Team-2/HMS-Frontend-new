import React from "react";
export default function SectionCard({ icon, title, subtitle, children, theme }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", marginBottom: "16px", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 18px", borderBottom: "1px solid var(--border)", background: "var(--card)" }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: theme?.primaryDim, border: `1px solid ${theme?.primaryBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{icon}</div>
        <div>
          <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--text)" }}>{title}</div>
          {subtitle && <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{subtitle}</div>}
        </div>
      </div>
      <div style={{ padding: "18px" }}>{children}</div>
    </div>
  );
}
