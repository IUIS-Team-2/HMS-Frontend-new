// ─── Shared design tokens used by ALL dashboards ───────────────────────────
// Import this instead of defining T_DARK/T_LIGHT locally in each dashboard

export const T_DARK = {
  bg: "#0b1220", surface: "#111827", card: "#131c2c", card2: "#182236",
  border: "#1f2a3d", border2: "#2d3a52", laxmi: "#60a5fa", raya: "#93c5fd",
  green: "#34d399", amber: "#fbbf24", red: "#f87171", white: "#e2e8f0",
  dim: "#94a3b8", dimmer: "#64748b", sidebar: "#0d1424",
};

export const T_LIGHT = {
  bg: "#f6f8fb", surface: "#ffffff", card: "#ffffff", card2: "#f8fafc",
  border: "#e2e8f0", border2: "#cbd5e1", laxmi: "#3b82f6", raya: "#2563eb",
  green: "#059669", amber: "#d97706", red: "#dc2626", white: "#0f172a",
  dim: "#64748b", dimmer: "#94a3b8", sidebar: "#ffffff",
};

export const SD = "0 4px 32px rgba(0,0,0,.5)";
export const cardStyle = (t) => ({
  background: t.card, borderRadius: 14, padding: 20, boxShadow: SD
});

export const BRANCH_THEMES = {
  raya: {
    primary: "#2563eb", primaryDim: "rgba(37,99,235,0.12)",
    primaryBorder: "rgba(37,99,235,0.35)", glow: "rgba(37,99,235,0.16)",
    label: "Raya Branch", initial: "R",
  },
  lakshmi: {
    primary: "#3b82f6", primaryDim: "rgba(59,130,246,0.12)",
    primaryBorder: "rgba(59,130,246,0.35)", glow: "rgba(59,130,246,0.16)",
    label: "Lakshmi Branch", initial: "L",
  },
  laxmi: {
    primary: "#3b82f6", primaryDim: "rgba(59,130,246,0.12)",
    primaryBorder: "rgba(59,130,246,0.35)", glow: "rgba(59,130,246,0.16)",
    label: "Laxmi Branch", initial: "L",
  },
};

export const BACK_OFFICE_ROLES = new Set([
  "hod","billing","opd","intimation","query","uploading",
  "nursing","notes","medical_officer","quality_analyst","doctor"
]);

export const ALL_HOSPITALS_LABEL = "All Hospitals";
export const BRANCH_ACCENTS = ["#3b82f6","#2563eb","#10b981","#f59e0b","#8b5cf6","#ef4444"];

export const roleUsesAllBranch = (role) =>
  role === "office_admin" || BACK_OFFICE_ROLES.has(role);

export const isGlobalAccessUser = (user) =>
  user?.role === "superadmin" || roleUsesAllBranch(user?.role) || user?.branch === "ALL";
