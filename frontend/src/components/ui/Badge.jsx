import React from "react";
const T = {
  successDim: "var(--success-soft)", success: "var(--success)", successBdr: "var(--success-border)",
  purpleDim: "var(--accent-soft)", purple: "var(--accent)", purpleBdr: "var(--accent-border)",
  blueDim: "var(--info-soft)", blue: "var(--info)", blueBdr: "var(--info-border)",
  warningDim: "var(--warning-soft)", warning: "var(--warning)", warningBdr: "var(--warning-border)",
  dangerDim: "var(--danger-soft)", danger: "var(--danger)", dangerBdr: "var(--danger-border)",
  surfaceRaised: "var(--surface-2)", textMuted: "var(--text-muted)", borderLight: "var(--border-strong)",
};
export function mkBadge(type) {
  const map = {
    cash:       [T.successDim, T.success,      T.successBdr],
    cashless:   [T.purpleDim,  T.purple,        T.purpleBdr],
    TPA:        [T.purpleDim,  T.purple,        T.purpleBdr],
    Card:       [T.blueDim,    T.blue,          T.blueBdr],
    active:     [T.successDim, T.success,       T.successBdr],
    admitted:   [T.blueDim,    T.blue,          T.blueBdr],
    discharged: [T.surfaceRaised, T.textMuted,  T.borderLight],
    pending:    [T.warningDim, T.warning,       T.warningBdr],
    paid:       [T.successDim, T.success,       T.successBdr],
    unpaid:     [T.dangerDim,  T.danger,        T.dangerBdr],
  };
  const [bg, c, b] = map[type] || ["var(--card)", "var(--text-mid)", "var(--border)"];
  return { display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600", letterSpacing: "0.4px", background: bg, color: c, border: `1px solid ${b}`, whiteSpace: "nowrap" };
}
export default function Badge({ type, children }) {
  return <span style={mkBadge(type)}>{children}</span>;
}
