import { UI_STATUS_TO_BACKEND, RADIOLOGY_REPORT_TYPES } from "../constants/hodConstants";

export const isRadiologyType = (rt = "") => RADIOLOGY_REPORT_TYPES.includes(rt);
export const fmtRs = n => "₹" + Number(n || 0).toLocaleString("en-IN");
export const fmtDt = d => d ? new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "—";
export const initials = name => (name || "?").trim().split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

export function statusColor(s) {
  if (s === "High") return "#dc2626";
  if (s === "Low")  return "#d97706";
  return "#059669";
}

export function calcTotals(svcs, labReports, med, billing) {
  const s = svcs.reduce((a,r) => a + Number(r.amount||0), 0);
  const p = labReports.reduce((a,r) => a + Number(r.amount||0), 0);
  const m = med.reduce((a,r) => a + Number(r.amount||0), 0);
  const gross = s + p + m;
  const disc  = Number(billing?.discount||0);
  const adv   = Number(billing?.advance||0);
  const paid  = Number(billing?.paidNow||0);
  return { s, p, m, gross, disc, adv, paid, net: gross - disc, due: gross - disc - adv - paid };
}

export function backendStatusFromUi(uiStatus) {
  const key = String(uiStatus || "").toLowerCase();
  return UI_STATUS_TO_BACKEND[key] || uiStatus;
}

export function hodTaskRowStatus(t) {
  const s = t?.status;
  return typeof s === "string" ? s.toLowerCase() : "";
}
export const isHodTaskCompleted  = t => hodTaskRowStatus(t) === "completed";
export const isTaskRowCompleted  = t => String(t?.status || "").toLowerCase() === "completed";

export const emptyPathReport = () => ({
  id: Date.now() + Math.random(),
  reportName: "", reportType: "Haematology", billCategory: "PATHOLOGY",
  date: new Date().toISOString().slice(0,10), orderedBy: "", amount: 0, remarks: "",
  tests: [{ id: Date.now(), name:"", value:"", unit:"", refRange:"", status:"Normal" }],
});
export const emptyRadReport = () => ({
  id: Date.now() + Math.random(),
  reportName: "", reportType: "X-Ray", billCategory: "RADIOLOGY",
  date: new Date().toISOString().slice(0,10), orderedBy: "", amount: 0, remarks: "",
  findings: "", impression: "", tests: [],
});

export function resolveAdmissionNoFromPatient(p) {
  if (!p || typeof p !== "object") return null;
  const direct = p.admNo ?? p.adm_no ?? p.current_admission_no;
  if (direct != null && direct !== "") {
    const n = Number(direct);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  const detail = p.current_admission_detail;
  const fromDetail = detail?.admNo ?? detail?.adm_no;
  if (fromDetail != null && fromDetail !== "") {
    const n = Number(fromDetail);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  const admissions = Array.isArray(p.admissions) ? p.admissions : [];
  if (!admissions.length) return null;
  const sorted = [...admissions].sort((a, b) => Number(b?.admNo ?? b?.adm_no ?? 0) - Number(a?.admNo ?? a?.adm_no ?? 0));
  const n = Number(sorted[0]?.admNo ?? sorted[0]?.adm_no);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function pickAdmissionRecord(patient, admNoHint) {
  if (!patient || typeof patient !== "object") return null;
  const n = Number(admNoHint);
  const admissions = Array.isArray(patient.admissions) ? patient.admissions : [];
  if (Number.isFinite(n) && n > 0) {
    const found = admissions.find(a => Number(a?.admNo ?? a?.adm_no) === n);
    if (found) return found;
  }
  const detail = patient.current_admission_detail;
  if (detail) return detail;
  if (!admissions.length) return null;
  return [...admissions].sort((a, b) => Number(b?.admNo ?? 0) - Number(a?.admNo ?? 0))[0];
}

export function normalizeExpiry(e) {
  if (!e) return "";
  if (/^\d{4}-\d{2}$/.test(e)) return e + "-01";
  if (/^\d{2}\/\d{4}$/.test(e)) { const [m,y]=e.split("/"); return `${y}-${m}-01`; }
  if (/^\d{2}\/\d{2}$/.test(e)) { const [m,y]=e.split("/"); return `20${y}-${m}-01`; }
  if (/^\d{4}-\d{2}-\d{2}$/.test(e)) return e;
  return "";
}
