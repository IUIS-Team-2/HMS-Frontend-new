import { createContext, useContext } from "react";

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

export const T = { ...T_DARK };
export const TC = createContext(T_DARK);
export const useT = () => useContext(TC);

export const SD = "0 4px 32px rgba(0,0,0,.5)";
export const cardStyle = (t) => ({ background: t.card, borderRadius: 14, padding: 20, boxShadow: SD });

export const ALL_HOSPITALS_LABEL = "All Hospitals";
export const BRANCH_ACCENTS = ["#3b82f6", "#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];
export let BRANCH_REGISTRY = [];

export const getBranchMeta = (loc) => {
  if (loc === "ALL" || loc === "all") return { slug: "all", name: ALL_HOSPITALS_LABEL, color: T.amber };
  const normalized = String(loc || "").toLowerCase();
  return BRANCH_REGISTRY.find((b) => b.slug === normalized) || {
    slug: normalized,
    name: normalized ? normalized.replace(/-/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase()) : "Branch",
    color: BRANCH_ACCENTS[0],
  };
};
export const bColor = (loc, t) => getBranchMeta(loc).color || t.laxmi;
export const bName = (loc) => getBranchMeta(loc).name;
export const branchFilterOptions = () => [["all", ALL_HOSPITALS_LABEL], ...BRANCH_REGISTRY.map((b) => [b.slug, b.name])];

export const BACK_OFFICE_ROLES = new Set([
  "hod","billing","opd","intimation","query","uploading",
  "nursing","notes","medical_officer","quality_analyst","doctor"
]);
export const roleUsesAllBranch = (role) => role === "office_admin" || BACK_OFFICE_ROLES.has(role);
export const isGlobalAccessUser = (user) => user?.role === "superadmin" || roleUsesAllBranch(user?.role) || user?.branch === "ALL";

export const ROLE_LABELS = { office_admin: "Office Admin", branch_admin: "Branch Admin", superadmin: "Super Admin" };
export const roleColor = (role, t) => {
  if (role === "superadmin") return t.amber;
  if (role === "office_admin") return t.laxmi;
  if (role === "branch_admin") return t.raya;
  return t.green;
};

export const fmt = d => { try { const dt = new Date(d); return isNaN(dt) ? "--" : dt.toLocaleDateString("en-IN"); } catch { return "--"; } };
export const inr = v => "Rs." + Number(v || 0).toLocaleString("en-IN");
