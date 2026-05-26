import React from "react";
const T_KEYS = {
  text: "var(--text)", textMuted: "var(--text-muted)", card: "var(--card)", border: "var(--border)",
};
export default function StatCard({ label, value, sub, color, prefix = "", theme }) {
  const c = color || theme?.primary || "#3b82f6";
  return (
    <div style={{ background: "var(--card)", border: `1px solid var(--border)`, borderTop: `2px solid ${c}`, borderRadius: "10px", padding: "18px 20px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, right: 0, width: "90px", height: "90px", background: `radial-gradient(circle at top right, ${c}14, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ fontSize: "9px", letterSpacing: "2.5px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "10px" }}>{label}</div>
      <div style={{ fontSize: "28px", fontWeight: "800", color: c, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
        {prefix}{typeof value === "number" ? value.toLocaleString() : (value ?? "—")}
      </div>
      {sub && <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "5px" }}>{sub}</div>}
    </div>
  );
}
