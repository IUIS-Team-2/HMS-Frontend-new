import { LayoutDashboard, Users, Wallet, FileText, BarChart3, UserRound, Stethoscope } from "lucide-react";

export const UI_FONT_STACK = "var(--ui-font-sans)";
export const UI_MONO_STACK = "var(--ui-font-mono)";

export const BRANCH_THEMES = {
  raya:    { primary: "#2563eb", primaryDim: "rgba(37,99,235,0.12)",  primaryBorder: "rgba(37,99,235,0.35)",  glow: "rgba(37,99,235,0.16)",  label: "Raya Branch",    initial: "R" },
  lakshmi: { primary: "#3b82f6", primaryDim: "rgba(59,130,246,0.12)", primaryBorder: "rgba(59,130,246,0.35)", glow: "rgba(59,130,246,0.16)", label: "Lakshmi Branch", initial: "L" },
  laxmi:   { primary: "#3b82f6", primaryDim: "rgba(59,130,246,0.12)", primaryBorder: "rgba(59,130,246,0.35)", glow: "rgba(59,130,246,0.16)", label: "Lakshmi Branch", initial: "L" },
  default: { primary: "#3b82f6", primaryDim: "rgba(59,130,246,0.12)", primaryBorder: "rgba(59,130,246,0.35)", glow: "rgba(59,130,246,0.16)", label: "Branch",          initial: "B" },
};

export const NAV = [
  { id: "overview",        label: "Overview",        icon: LayoutDashboard },
  { id: "patients",        label: "All Patients",    icon: Users           },
  { id: "cash",            label: "Cash Patients",   icon: Wallet          },
  { id: "records",         label: "Patient Records", icon: FileText        },
  { id: "financials",      label: "Financials",      icon: BarChart3       },
  { id: "print_approvals", label: "Print Approvals", icon: FileText        },
  { id: "employees",       label: "Employees",       icon: UserRound       },
  { id: "doctors",         label: "Doctors",         icon: Stethoscope     },
];

export const RECORD_TYPES = [
  { id: "discharge_summary", label: "Discharge Summary" },
  { id: "admission_note",    label: "Admission Note"    },
  { id: "reports",           label: "Reports"           },
  { id: "medicines",         label: "Medicines"         },
  { id: "services",          label: "Services"          },
  { id: "final_bill",        label: "Final Bill"        },
];

export const RANGES = ["daily", "weekly", "monthly", "yearly"];

export const EMPTY_EMP_FORM = {
  name: "", username: "", email: "", phone: "",
  role: "Receptionist", employeeId: "", password: "", confirmPassword: "",
};

export const T = {
  bg:            "var(--bg)",
  surface:       "var(--surface)",
  surfaceRaised: "var(--surface-2)",
  card:          "var(--card)",
  border:        "var(--border)",
  borderLight:   "var(--border-strong)",
  text:          "var(--text)",
  textSub:       "var(--text-mid)",
  textMuted:     "var(--text-muted)",
  success:       "var(--success)",
  successDim:    "var(--success-soft)",
  successBdr:    "var(--success-border)",
  warning:       "var(--warning)",
  warningDim:    "var(--warning-soft)",
  warningBdr:    "var(--warning-border)",
  danger:        "var(--danger)",
  dangerDim:     "var(--danger-soft)",
  dangerBdr:     "var(--danger-border)",
  blue:          "var(--info)",
  blueDim:       "var(--info-soft)",
  blueBdr:       "var(--info-border)",
  purple:        "var(--accent)",
  purpleDim:     "var(--accent-soft)",
  purpleBdr:     "var(--accent-border)",
};

export function mkBtn(v, theme) {
  const p  = theme?.primary       || "#3b82f6";
  const pd = theme?.primaryDim    || "#0c1e40";
  const pb = theme?.primaryBorder || "#1d4ed8";
  const defs = {
    primary: [p,             "#fff",    p          ],
    ghost:   ["transparent", "var(--text-mid)", "var(--border)"],
    success: ["var(--success-soft)", "var(--success)", "var(--success-border)"],
    danger:  ["var(--danger-soft)",  "var(--danger)",  "var(--danger-border)" ],
    excel:   ["#071a10",     "#4ade80", "#145228"  ],
    dim:     [pd,            p,         pb         ],
  };
  const [bg, c, b] = defs[v] || defs.ghost;
  return { padding: "9px 18px", borderRadius: "10px", fontSize: "14px", fontFamily: UI_FONT_STACK, cursor: "pointer", fontWeight: "600", border: `1px solid ${b}`, background: bg, color: c, transition: "all 0.15s", display: "inline-flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" };
}

export function mkInput() {
  return { background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)", padding: "10px 14px", borderRadius: "10px", fontSize: "14px", fontFamily: UI_FONT_STACK, outline: "none" };
}

export function exportExcel(rows, filename) {
  if (!rows?.length) return;
  const headers = Object.keys(rows[0]);
  const esc = v => { const s = String(v ?? ""); return (s.includes(",") || s.includes('"')) ? `"${s.replace(/"/g, '""')}"` : s; };
  const csv = [headers.join(","), ...rows.map(r => headers.map(h => esc(r[h])).join(","))].join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement("a"), { href: url, download: `${filename}.xlsx` });
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
