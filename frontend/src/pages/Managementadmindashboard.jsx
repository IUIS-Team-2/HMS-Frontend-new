import { SANGI_MEDICINE_MASTER } from "../data/medicineMaster";
import * as XLSX from "xlsx";
import MedDrawer from "../components/MedDrawer";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { apiService, BASE_URL } from "../services/apiService";
import { useTheme } from "../context/ThemeContext";
import ThemeModeDock from "../components/ui/ThemeModeDock";
import UpdateRecordsPanel from "../components/admin/UpdateRecordsPanel";
import MedicalHistoryPage from "./MedicalHistoryPage";
import {
  Home, Users, DoorOpen, Pill, ClipboardList, CreditCard,
  CheckSquare, BarChart3, Building2, UserRound, Hospital,
  Clock3, AlertTriangle, Printer, FlaskConical, ChevronDown, ChevronUp,
} from "lucide-react";

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const BC = {
  laxmi: { label: "Laxmi Nagar", accent: "#3b82f6", dim: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.32)" },
  raya:  { label: "Raya",        accent: "#2563eb", dim: "rgba(37,99,235,0.12)",  border: "rgba(37,99,235,0.32)" },
};
const BRANCH_KEYS = ["laxmi", "raya"];
const BRANCH_KEY_TO_CODE = { laxmi: "LNM", raya: "RYM" };
const BRANCH_CODE_TO_KEY = { LNM: "laxmi", RYM: "raya" };

const DEPT_OPTIONS = ["HOD","Billing","Uploading","Intimation","Query","OPD","Doctor","Nursing","Quality Analyst","Notes"];
const TASK_STATUS   = ["Pending","In Progress","Completed","On Hold","Overdue"];
const TASK_PRIORITY = ["Low","Medium","High","Urgent"];
const SUMMARY_TYPES = ["NORMAL","LAMA","REFER","DEATH","DOPR"];
const SUMMARY_LABELS = { NORMAL:"Normal", LAMA:"LAMA", REFER:"Refer", DEATH:"Death", DOPR:"DOPR" };

// ── DISCHARGE TYPES & SECTIONS (billing-dashboard style) ─────────────────────
const DISCHARGE_TYPES_CFG = {
  NORMAL: { key:"NORMAL", label:"Normal Discharge", color:"#059669", bg:"#d1fae5", border:"#6ee7b7", icon:"✅" },
  LAMA:   { key:"LAMA",   label:"LAMA",             color:"#d97706", bg:"#fef3c7", border:"#fcd34d", icon:"⚠️" },
  REFER:  { key:"REFER",  label:"Refer",             color:"#2563eb", bg:"#dbeafe", border:"#93c5fd", icon:"🏥" },
  DEATH:  { key:"DEATH",  label:"Death",             color:"#dc2626", bg:"#fee2e2", border:"#fca5a5", icon:"💀" },
  DOPR:   { key:"DOPR",   label:"DAMA / DOPR",       color:"#7c3aed", bg:"#ede9fe", border:"#c4b5fd", icon:"🚨" },
};

const DISCHARGE_SECTIONS_MAP = {
  NORMAL: [
    { key:"chiefComplaints",      label:"Chief Complaints",              rows:3 },
    { key:"historyOfIllness",     label:"History of Present Illness",    rows:3 },
    { key:"onExamination",        label:"On Examination",                rows:2, type:"vitals_grid" },
    { key:"investigations",       label:"Investigations",                rows:3 },
    { key:"diagnosis",            label:"Diagnosis",                     rows:2 },
    { key:"treatmentGiven",       label:"Treatment Given",               rows:4 },
    { key:"adviceOnDischarge",    label:"Advice on Discharge",           rows:3 },
    { key:"followUp",             label:"Follow Up",                     rows:2 },
  ],
  LAMA: [
    { key:"chiefComplaints",      label:"Chief Complaints",              rows:3 },
    { key:"diagnosis",            label:"Provisional Diagnosis",         rows:2 },
    { key:"onExamination",        label:"On Examination",                rows:2, type:"vitals_grid" },
    { key:"treatmentGiven",       label:"Treatment Given During Stay",   rows:3 },
    { key:"reasonForLama",        label:"Reason for LAMA",               rows:2 },
    { key:"adviceOnDischarge",    label:"Advice Given Before Leaving",   rows:2 },
    { key:"lamaDeclaration",      label:"Declaration / Remarks",         rows:2 },
  ],
  REFER: [
    { key:"chiefComplaints",      label:"Chief Complaints",              rows:3 },
    { key:"diagnosis",            label:"Diagnosis",                     rows:2 },
    { key:"onExamination",        label:"On Examination",                rows:2, type:"vitals_grid" },
    { key:"treatmentGiven",       label:"Treatment Given",               rows:3 },
    { key:"referredTo",           label:"Referred To",                   rows:1 },
    { key:"reasonForDopr",        label:"Reason for Referral",           rows:2 },
    { key:"adviceOnDischarge",    label:"Advice Given",                  rows:2 },
  ],
  DEATH: [
    { key:"chiefComplaints",      label:"Chief Complaints",              rows:3 },
    { key:"diagnosis",            label:"Diagnosis",                     rows:2 },
    { key:"onExamination",        label:"On Examination",                rows:2, type:"vitals_grid" },
    { key:"treatmentGiven",       label:"Treatment Given",               rows:3 },
    { key:"adviceOnDischarge",    label:"Remarks / Declaration",         rows:3 },
  ],
  DOPR: [
    { key:"chiefComplaints",      label:"Chief Complaints",              rows:3 },
    { key:"diagnosis",            label:"Diagnosis / Provisional",       rows:2 },
    { key:"onExamination",        label:"On Examination",                rows:2, type:"vitals_grid" },
    { key:"treatmentGiven",       label:"Treatment Given",               rows:3 },
    { key:"reasonForDopr",        label:"Reason for DAMA / DOPR",        rows:2 },
    { key:"referredTo",           label:"Referred To (if any)",          rows:1 },
    { key:"adviceOnDischarge",    label:"Advice Given",                  rows:2 },
  ],
};

// ── REPORT TYPE HELPERS ───────────────────────────────────────────────────────
const RADIOLOGY_REPORT_TYPES_LIST = ["X-Ray","USG","CT Scan","MRI","Echo","ECG","PET Scan","Mammography","Fluoroscopy","Nuclear Medicine"];
const PATHOLOGY_REPORT_TYPES_LIST = ["Haematology","Biochemistry","Microbiology","Immunology – Serology","Histopathology","Cytology","Blood Bank","Clinical Pathology","Endocrinology"];
const isRadiologyType = (t="") => RADIOLOGY_REPORT_TYPES_LIST.includes(t);

const emptyPathReport = () => ({
  id: Date.now() + Math.random(),
  reportName:"", reportType:"Haematology", date: new Date().toISOString().slice(0,10),
  orderedBy:"", amount:0, remarks:"", findings:"", impression:"",
  tests:[{ id:Date.now(), name:"", value:"", unit:"", refRange:"", status:"Normal" }],
});
const emptyRadReport = () => ({
  id: Date.now() + Math.random(),
  reportName:"", reportType:"X-Ray", date: new Date().toISOString().slice(0,10),
  orderedBy:"", amount:0, remarks:"", findings:"", impression:"", tests:[],
});

const normalizeSummaryType = (t) => {
  if (!t) return "NORMAL";
  const u = String(t).toUpperCase().trim();
  if (u.startsWith("REFER") || u === "REFERRED") return "REFER";
  if (u === "DAMA" || u === "DOPR" || u === "DOR") return "DOPR";
  if (u === "LAMA") return "LAMA";
  if (u === "DEATH" || u === "DIED") return "DEATH";
  if (u === "NORMAL" || u === "DISCHARGE") return "NORMAL";
  return SUMMARY_TYPES.includes(u) ? u : "NORMAL";
};

const EMPLOYEE_ID_PREFIXES = { LNM:"LAK", RYM:"RAY", ALL:"OFF" };

const LAB_TEMPLATES = {
  "Complete Blood Count (CBC)": {
    tests: [
      { name:"HAEMOGLOBIN", unit:"gm/dl", refRange:"12–16" },
      { name:"TLC (Total Leucocyte Count)", unit:"/cumm", refRange:"4000–11000" },
      { name:"POLYMORPHS", unit:"%", refRange:"40-75" },
      { name:"LYMPHOCYTE", unit:"%", refRange:"20-40" },
      { name:"EOSINOPHIL", unit:"%", refRange:"01-06" },
      { name:"MONOCYTE", unit:"%", refRange:"00-08" },
      { name:"BASOPHIL", unit:"%", refRange:"00-00" },
      { name:"PCV", unit:"%", refRange:"34-45" },
      { name:"M C V", unit:"Fl/dl", refRange:"76-96" },
      { name:"M C H", unit:"Pg/dl", refRange:"27-32" },
      { name:"M C H C", unit:"gm/dl", refRange:"31-38" },
      { name:"R B C", unit:"mill/cumm", refRange:"3.5-5.5" },
      { name:"PLATELET COUNT", unit:"Lacs/cumm", refRange:"1.5-4.5" },
      { name:"ESR (Wintrobe)", unit:"mm", refRange:"M(0-10), F(0-20)" },
    ],
    defaultRemarks:"***End Of The Report***"
  },
  "Kidney Function Test (KFT)": {
    tests: [
      { name:"BLOOD UREA", unit:"mg/dl", refRange:"13-45" },
      { name:"SERUM CREATININE", unit:"mg/dl", refRange:"0.7-1.4" },
      { name:"S.URIC ACID", unit:"mg/dl", refRange:"3.2-7.2" },
      { name:"SODIUM", unit:"mmol/L", refRange:"135-145" },
      { name:"POTASSIUM", unit:"mmol/L", refRange:"3.6-5.0" },
      { name:"CALCIUM", unit:"mg/dl", refRange:"8.2-10.5" },
    ],
    defaultRemarks:"***End Of The Report***"
  },
  "Liver Function Test (LFT)": {
    tests: [
      { name:"SERUM BILIRUBIN (TOTAL)", unit:"mg/dl", refRange:"0.2-1.3" },
      { name:"CONJUGATED (D BILIRUBIN)", unit:"mg/dl", refRange:"0.0-0.3" },
      { name:"UNCONJUGATED (I.D BILIRUBIN)", unit:"mg/dl", refRange:"0.2-1.1" },
      { name:"SGOT/AST", unit:"U/L", refRange:"00-55" },
      { name:"SGPT/ALT", unit:"U/L", refRange:"00-40" },
      { name:"TOTAL PROTEIN", unit:"gm/dl", refRange:"6.3-8.2" },
      { name:"ALBUMIN", unit:"gm/dl", refRange:"3.5-5.0" },
      { name:"GLOBULINE", unit:"gm/dl", refRange:"2.5-5.6" },
      { name:"ALKALINE PHOSPHATASE", unit:"IU/L", refRange:"20-130" },
    ],
    defaultRemarks:"***End Of The Report***"
  },
  "Lipid Profile": {
    tests: [
      { name:"CHOLESTEROL TOTAL", unit:"mg/dl", refRange:"125-200" },
      { name:"TRIGLYCERIDE", unit:"mg/dl", refRange:"25-200" },
      { name:"CHOLESTEROL HDL", unit:"mg/dl", refRange:"35-80" },
      { name:"CHOLESTEROL VLDL", unit:"mg/dl", refRange:"5-40" },
      { name:"CHOLESTEROL LDL", unit:"mg/dl", refRange:"85-130" },
      { name:"LDL. / HDL RATIO", unit:"mg/dl", refRange:"1.5-3.5" },
    ],
    defaultRemarks:"***End Of The Report***"
  },
  "Blood Gas Analysis": {
    tests: [
      { name:"pH", unit:"", refRange:"7.35-7.45" },
      { name:"pCO2", unit:"mmHg", refRange:"35-40" },
      { name:"pO2", unit:"mmHg", refRange:"80-95" },
      { name:"HCO3", unit:"mmol/L", refRange:"22-26" },
      { name:"BE", unit:"mmol/L", refRange:"-2 to +2" },
      { name:"%SO2C", unit:"%", refRange:"96-97" },
      { name:"Na+", unit:"mmol/L", refRange:"134-146" },
      { name:"K+", unit:"mmol/L", refRange:"3.4-5.0" },
    ],
    defaultRemarks:"***End Of The Report***"
  },
  "CRP (Qualitative)": { tests:[{name:"CRP (Qualitative)",unit:"",refRange:"NON-REACTIVE"}], defaultRemarks:"***End Of The Report***" },
  "Blood Glucose (Random)": { tests:[{name:"BLOOD GLUCOSE RANDOM",unit:"mg/dl",refRange:"100-150"}], defaultRemarks:"***End Of The Report***" },
  "Blood Glucose (Fasting)": { tests:[{name:"BLOOD GLUCOSE FASTING",unit:"mg/dl",refRange:"70-110"}], defaultRemarks:"***End Of The Report***" },
  "Widal Test (Slide Method)": {
    tests: [
      { name:"Antigen TO (1:20 to 1:320)",unit:"",refRange:"Negative" },
      { name:"Antigen TH (1:20 to 1:320)",unit:"",refRange:"Negative" },
      { name:"RESULT",unit:"",refRange:"POSITIVE / NEGATIVE" },
    ],
    defaultRemarks:"INTERPRETATION: Antibody titer of 1:80 or higher suggests infection."
  },
  "Malaria Antigen Test": {
    tests:[{name:"PLASMODIUM P. VIVAX",unit:"",refRange:"NEGATIVE"},{name:"PLASMODIUM FALCIPARUM",unit:"",refRange:"NEGATIVE"}],
    defaultRemarks:"PRINCIPLE OF TEST: The test uses two antibodies."
  },
  "Dengue (IgM & IgG)": {
    tests:[{name:"DENGUE IgM ANTIBODIES",unit:"",refRange:"NON-REACTIVE"},{name:"DENGUE IgG ANTIBODIES",unit:"",refRange:"NON-REACTIVE"}],
    defaultRemarks:"REMARKS: Dengue viruses are mosquito-born viruses."
  },
  "Dengue NS1 Antigen Test": { tests:[{name:"DENGUE NS1 ANTIGEN",unit:"",refRange:"NON-REACTIVE"}], defaultRemarks:"***End Of The Report***" },
  "Viral Markers (HIV, HBsAg, HCV)": {
    tests:[{name:"HIV I & II",unit:"",refRange:"NEGATIVE"},{name:"HEPATITIS B (HbsAg)",unit:"",refRange:"NEGATIVE"},{name:"HCV",unit:"",refRange:"NEGATIVE"}],
    defaultRemarks:"***End Of The Report***"
  },
  "Urine Examination (Routine)": {
    tests: [
      { name:"COLOUR",unit:"",refRange:"Pale Yellow" },
      { name:"ALBUMIN",unit:"",refRange:"NIL" },
      { name:"SUGAR",unit:"",refRange:"NIL" },
      { name:"PH",unit:"",refRange:"4.5-8.0" },
      { name:"PUS CELLS",unit:"/HPF",refRange:"0-5" },
      { name:"RBC'S",unit:"/HPF",refRange:"NIL" },
      { name:"BACTERIA",unit:"",refRange:"NIL" },
    ],
    defaultRemarks:"***End Of The Report***"
  },
  "Blood Group & Rh Factor": { tests:[{name:"Blood Group",unit:"",refRange:""},{name:"Rh Factor",unit:"",refRange:""}], defaultRemarks:"***End Of The Report***" },
  "HbA1c": { tests:[{name:"HBA1C",unit:"%",refRange:"4.30-6.40"},{name:"MEAN PLASMA GLUCOSE",unit:"mg/dl",refRange:"70-140"}], defaultRemarks:"METHOD: HPLC" },
  "D-Dimer": { tests:[{name:"D-DIMER",unit:"µgFEU/mL",refRange:"<0.5"}], defaultRemarks:"***End Of The Report***" },
  "Cardiac Markers": {
    tests:[{name:"TROPONIN-T",unit:"",refRange:"NEGATIVE"},{name:"TROPONIN-I",unit:"",refRange:"NEGATIVE"},{name:"CPK-MB",unit:"IU/L",refRange:"upto 24"},{name:"CPK",unit:"U/L",refRange:"22-198"}],
    defaultRemarks:"***End Of The Report***"
  },
  "Total Thyroid Profile": {
    tests:[{name:"T3",unit:"pmol/l",refRange:"0.9-2.5"},{name:"Free Thyroxine (FT4)",unit:"pmol/l",refRange:"60-135"},{name:"TSH",unit:"pmol/l",refRange:"0.25-5.0"}],
    defaultRemarks:"Method: Enzyme linked fluorescent assay."
  },
};

const NAV = [
  { id:"home",        label:"Home",           icon:Home },
  { id:"patients",    label:"Patients",       icon:Users },
  { id:"discharge",   label:"Discharge",      icon:DoorOpen },
  { id:"medicines",   label:"Medicines",      icon:Pill },
  { id:"reports",     label:"Reports",        icon:ClipboardList },
  { id:"billing",     label:"Billing",        icon:CreditCard },
  { id:"tasks",       label:"Task Manager",   icon:CheckSquare },
  { id:"taskreport",  label:"Task Report",    icon:BarChart3 },
  { id:"medhistory",  label:"Medical History", icon:Hospital },
  { id:"records",     label:"Update Records", icon:AlertTriangle },
  { id:"departments", label:"Departments",    icon:Building2 },
  { id:"employees",   label:"Employees",      icon:Users },
  { id:"profile",     label:"My Profile",     icon:UserRound },
];

const SUMMARY_META = {
  NORMAL:{ color:"#34d399", bg:"#34d39916" },
  LAMA:  { color:"#f59e0b", bg:"#f59e0b16" },
  REFER: { color:"#22d3ee", bg:"#22d3ee16" },
  DEATH: { color:"#f87171", bg:"#f8717116" },
  DOPR:  { color:"#c084fc", bg:"#c084fc16" },
};
const TASK_STATUS_META = {
  "Pending":    { color:"#f59e0b", bg:"#f59e0b18" },
  "In Progress":{ color:"#38bdf8", bg:"#38bdf818" },
  "Completed":  { color:"#34d399", bg:"#34d39918" },
  "On Hold":    { color:"#f87171", bg:"#f8717118" },
  "Overdue":    { color:"#f87171", bg:"#f8717118" },
};
const TASK_PRIORITY_META = {
  "Low":   { color:"#6b7280", bg:"#6b728018" },
  "Medium":{ color:"#f59e0b", bg:"#f59e0b18" },
  "High":  { color:"#f87171", bg:"#f8717118" },
  "Urgent":{ color:"#c084fc", bg:"#c084fc18" },
};
const DEPT_ICONS = { HOD:"👔", Billing:"💳", Uploading:"☁️", Intimation:"📢", Query:"❓", OPD:"🏥", Doctor:"🩺", Nursing:"💉", "Quality Analyst":"📊", Notes:"📝" };
const DEPT_ACCENT_CYCLE = ["#34d399","#818cf8","#f59e0b","#38bdf8","#f87171","#c084fc","#22d3ee"];

const EMPLOYEE_ROLE_OPTIONS = [
  { value:"receptionist", label:"Receptionist" },
  { value:"hod",          label:"HOD" },
  { value:"billing",      label:"Billing" },
  { value:"opd",          label:"OPD" },
  { value:"intimation",   label:"Intimation" },
  { value:"query",        label:"Query" },
  { value:"uploading",    label:"Uploading" },
  { value:"doctor",       label:"Doctor" },
  { value:"nursing",      label:"Nursing" },
  { value:"quality_analyst", label:"Quality Analyst" },
  { value:"notes",        label:"Notes" },
];
const DEPARTMENT_ROLE_MAP = {
  HOD:"hod", Billing:"billing", OPD:"opd", Intimation:"intimation",
  Query:"query", Uploading:"uploading", Receptionist:"receptionist",
  Doctor:"doctor", Nursing:"nursing", "Quality Analyst":"quality_analyst", Notes:"notes",
};
const TASK_ASSIGNABLE_ROLES = new Set([
  "receptionist","billing","hod","opd","intimation","query","uploading",
  "admin","office_admin","doctor","nursing","quality_analyst","notes",
]);
const getRoleForDepartment = (department) => DEPARTMENT_ROLE_MAP[String(department||"").trim()] || "";

// ── UTILS ─────────────────────────────────────────────────────────────────────
const fmt    = (n)   => "₹" + Number(n||0).toLocaleString("en-IN");
const fmtDt  = (iso) => iso ? new Date(iso).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "—";
const initials = (name="") => name.trim().split(" ").filter(Boolean).map(w=>w[0]).join("").slice(0,2).toUpperCase();
const safeLoad = (key,fb) => { try { return JSON.parse(localStorage.getItem(key)||"null")||fb; } catch { return fb; } };
const safeSave = (key,val) => { try { localStorage.setItem(key,JSON.stringify(val)); } catch {} };

const mapTaskFromApi = (task) => ({
  id: task.id, title: task.title, description: task.description||"",
  assignedToId: task.assigned_to, assignedTo: task.assigned_to_name||"—",
  department: task.department, priority: task.priority,
  dueDate: task.due_date ? task.due_date.slice(0,10) : "", createdAt: task.created_at, updatedAt: task.updated_at,
  completedAt: task.status==="Completed" ? task.updated_at : "",
  patientName: task.patient_name||task.patient_names?.[0]||"",
  patientUhid: task.patient_uhid||task.patient_uhids?.[0]||"",
  patientNames: task.patient_names||(task.patient_name?[task.patient_name]:[]),
  patientUhids: task.patient_uhids||(task.patient_uhid?[task.patient_uhid]:[]),
  createdBy: task.assigned_by_name||"—",
  // Work done fields — saved by HOD review / employee submit
  remarks:     task.remarks||task.notes||"",
  notes:       task.notes||task.remarks||"",
  hodNote:     task.hod_note||task.review_note||task.hod_remarks||"",
  taskType:    task.task_type||task.taskType||task.title||"",
  adm_no:      task.adm_no||task.admNo||"",
  patient_uhid: task.patient_uhid||"",
  // Normalize status from backend variants
  status: (()=>{
    const s = String(task.status||"").toLowerCase();
    if(s==="completed"||s==="done"||s==="approved") return "Completed";
    if(s==="in_progress"||s==="inprogress"||s==="in-progress") return "In Progress";
    if(s==="on_hold"||s==="onhold") return "On Hold";
    if(s==="pending") return "Pending";
    return task.status||"Pending";
  })(),
});

function exportTasksXLSX(tasks,filename="task_report.xlsx") {
  const wb = XLSX.utils.book_new();
  const headers = ["Task ID","Title","Assigned To","Department","Priority","Status","Due Date","Created Date","Description","Completed Date","Patient Name","Patient UHID"];
  const rows = tasks.map((t,i)=>[i+1,t.title,t.assignedTo,t.department,t.priority,t.status,t.dueDate||"—",t.createdAt?.split("T")[0]||"—",t.description||"—",t.completedAt?.split("T")[0]||"—",t.patientName||"—",t.patientUhid||"—"]);
  const aoa = [["SANGI HOSPITAL — TASK REPORT",...Array(11).fill("")],[`Generated: ${new Date().toLocaleDateString("en-IN")}`,...Array(11).fill("")],Array(12).fill(""),headers,...rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [6,24,18,14,10,12,12,12,40,12,20,14].map(w=>({wch:w}));
  XLSX.utils.book_append_sheet(wb,ws,"Task Report");
  XLSX.writeFile(wb,filename,{bookType:"xlsx"});
}
function exportCSV(filename,rows,headers) {
  const csv = [headers.join(","),...rows.map(r=>headers.map(h=>`"${(r[h]??"").toString().replace(/"/g,'""')}"`).join(","))].join("\n");
  const a = document.createElement("a"); a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"})); a.download=filename; a.click();
}
const statusColor = (s) => s==="High"?"#dc2626":s==="Low"?"#d97706":"#059669";

// ── DYNAMIC CSS ────────────────────────────────────────────────────────────────
const DYNAMIC_CSS = (accent,isDark) => `
  option { background: var(--surface); color: var(--text); }
  body { background: var(--bg); color: var(--text); }
  .hms-hdr { background: var(--surface); }
  .hms-logo-text { color: var(--text); }
  .hms-logo-sub { color: var(--text-muted); }
  .hms-role-badge { background: ${accent}18; border: 1px solid ${accent}30; color: ${accent}; }
  .hms-avatar { background: linear-gradient(135deg, ${accent}, #818cf8); }
  .hms-big-avatar { background: linear-gradient(135deg, ${accent}, #818cf8); }
  .hms-avatar-pill { background: ${isDark?"rgba(255,255,255,.05)":"rgba(0,0,0,.05)"}; border: 1px solid ${isDark?"#1e2a3a":"#dde8f5"}; }
  .hms-avatar-name { color: ${isDark?"#94a3b8":"#475569"}; }
  .hms-logout-btn { border: 1px solid ${isDark?"#1e2a3a":"#dde8f5"}; color: ${isDark?"#64748b":"#64748b"}; }
  .hms-wrap { background: var(--bg); color: var(--text); }
  .hms-sb { background: var(--sidebar); border-right: 1px solid var(--sidebar-border); }
  .hms-nav-item { color: ${isDark?"#64748b":"#64748b"}; }
  .hms-nav-item:hover { color: ${isDark?"#f1f5f9":"#0f172a"}; background: ${isDark?"rgba(0,0,0,.05)":"rgba(0,0,0,.05)"}; }
  .hms-nav-item.active { color: ${isDark?"#f1f5f9":"#0f172a"}; background: ${isDark?"rgba(0,0,0,.05)":"rgba(0,0,0,.05)"}; border-left: 2px solid ${accent}; font-weight: 600; }
  .hms-branch-select { border: 1px solid ${isDark?"#1a2540":"#c7d5eb"}; background-color: ${isDark?"#0b1120":"#ffffff"}; color: ${isDark?"#e2e8f0":"#1e293b"}; }
  .hms-card { background: var(--card); border-color: var(--border); }
  .hms-card-title { color: var(--text); }
  .hms-prof-card { background: var(--card); }
  .hms-stat-card { background: var(--card); border-color: var(--border); }
  .hms-stat-label { color: var(--text-muted); }
  .hms-th { color: var(--text-muted); }
  .hms-td { color: var(--text-mid); }
  .hms-td-hi { color: var(--text); }
  .hms-td-mono { color: var(--text-muted); }
  .hms-td-sm { color: var(--text-muted); }
  .hms-add-btn { background: linear-gradient(135deg, ${accent}, ${accent}cc); }
  .hms-add-btn-lg { background: linear-gradient(135deg, ${accent}, ${accent}cc); }
  .hms-cancel-btn { color: ${isDark?"#64748b":"#64748b"}; }
  .hms-save-btn { background: linear-gradient(135deg, ${accent}, ${accent}cc); }
  .hms-lbl { color: ${isDark?"#64748b":"#64748b"}; }
  .hms-inp { background: var(--input-bg); color: var(--text); border-color: var(--input-border); }
  .hms-inp-sm { background: var(--input-bg); color: var(--text); border-color: var(--input-border); }
  .hms-sel { background: var(--input-bg); color: var(--text); border-color: var(--input-border); }
  .hms-textarea { background: var(--input-bg); color: var(--text); border-color: var(--input-border); }
  .hms-modal-overlay { background: var(--modal-overlay); }
  .hms-modal-box { background: var(--modal-bg); border-color: var(--modal-border); }
  .hms-modal-title { color: var(--text); }
  .hms-empty { color: ${isDark?"#2d3a50":"#94a3b8"}; }
  .hms-view-key { color: ${isDark?"#64748b":"#64748b"}; }
  .hms-view-val { color: ${isDark?"#e2e8f0":"#1e293b"}; }
  .hms-dept-card { background: ${isDark?"#0b1120":"#ffffff"}; }
  .hms-progress-bar { background: ${isDark?"#1e2a3a":"#dde8f5"}; }
  .hms-progress-bar-sm { background: ${isDark?"#1e2a3a":"#dde8f5"}; }
  .hms-patient-select-box { background: ${isDark?"#080c18":"#f8faff"}; border: 1px solid ${isDark?"#1a2540":"#c7d5eb"}; border-radius: 8px; max-height: 150px; overflow-y: auto; margin-top: 4px; }
  .hms-patient-select-item { padding: 7px 12px; cursor: pointer; font-size: 11px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid ${isDark?"#1a2540":"#e8eef8"}; transition: background 0.15s; }
  .hms-patient-select-item:hover { background: ${accent}18; }
  .hms-patient-select-item.selected { background: ${accent}22; border-left: 3px solid ${accent}; }
  .hms-patient-selected-pill { display: inline-flex; align-items: center; gap: 6px; background: ${accent}18; border: 1px solid ${accent}40; color: ${accent}; border-radius: 20px; padding: 4px 10px; font-size: 11px; font-weight: 600; margin-top: 6px; }
  .hms-patient-search { background: ${isDark?"#080c18":"#ffffff"}; color: ${isDark?"#e2e8f0":"#1e293b"}; border: 1px solid ${isDark?"#1a2540":"#c7d5eb"}; border-radius: 6px; padding: 6px 10px; font-size: 11px; width: 100%; box-sizing: border-box; margin-bottom: 4px; outline: none; }
  .hms-patient-search:focus { border-color: ${accent}; }
  .hms-mh-pill { display: inline-flex; align-items: center; font-size: 11px; padding: 3px 10px; border-radius: 12px; background: rgba(56,189,248,0.12); color: #38bdf8; border: 1px solid rgba(56,189,248,0.3); cursor: pointer; }
  .hms-med-inline-input { background: var(--input-bg); color: var(--text); border: 1px solid var(--input-border); border-radius: 6px; padding: 4px 8px; font-size: 12px; outline: none; }
  .hms-med-inline-input:focus { border-color: ${accent}; }
  .hms-med-dropdown { position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: ${isDark?"#0f172a":"#ffffff"}; border: 1px solid ${isDark?"#1e293b":"#c7d5eb"}; border-radius: 10px; overflow: hidden; max-height: 260px; overflow-y: auto; z-index: 200; box-shadow: 0 12px 32px rgba(0,0,0,0.18); }
  .hms-med-dropdown-item { padding: 10px 14px; cursor: pointer; border-bottom: 1px solid ${isDark?"rgba(148,163,184,0.08)":"rgba(148,163,184,0.15)"}; transition: background 0.12s; }
  .hms-med-dropdown-item:hover { background: ${accent}12; }
  .hms-med-dropdown-item.disabled { opacity: 0.45; cursor: default; }
  .hms-med-dropdown-name { font-size: 13px; font-weight: 600; color: ${isDark?"#e2e8f0":"#0f172a"}; }
  .hms-med-dropdown-meta { font-size: 11px; color: #94a3b8; margin-top: 2px; }
  /* ── BILLING ── */
  .bill-page-wrap { display: flex; gap: 18px; align-items: flex-start; }
  .bill-patient-list { width: 240px; flex-shrink: 0; background: ${isDark?"#0b1120":"#f8faff"}; border: 1px solid ${isDark?"#1a2540":"#c7d5eb"}; border-radius: 10px; overflow: hidden; }
  .bill-patient-list-head { padding: 10px 14px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: ${accent}; border-bottom: 1px solid ${isDark?"#1a2540":"#c7d5eb"}; background: ${isDark?"#080c18":"#eef3fc"}; }
  .bill-patient-item { padding: 10px 14px; cursor: pointer; border-bottom: 1px solid ${isDark?"#111827":"#e8eef8"}; transition: background 0.15s; }
  .bill-patient-item:hover { background: ${accent}12; }
  .bill-patient-item.active { background: ${accent}20; border-left: 3px solid ${accent}; }
  .bill-patient-name { font-size: 12px; font-weight: 600; color: ${isDark?"#e2e8f0":"#1e293b"}; }
  .bill-patient-uhid { font-size: 10px; color: ${isDark?"#475569":"#64748b"}; margin-top: 2px; }
  .bill-patient-badge { font-size: 9px; padding: 2px 6px; border-radius: 8px; margin-top: 4px; display: inline-block; }
  .bill-detail-pane { flex: 1; min-width: 0; }
  .bill-print-card { background: ${isDark?"#0b1120":"#ffffff"}; border: 1px solid ${isDark?"#1a2540":"#c7d5eb"}; border-radius: 12px; padding: 28px; font-family: 'Courier New', monospace; }
  .bill-print-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 2px solid ${isDark?"#1e2a3a":"#c7d5eb"}; margin-bottom: 18px; }
  .bill-print-hospital-name { font-size: 20px; font-weight: 800; color: ${isDark?"#f1f5f9":"#0f172a"}; letter-spacing: -.02em; font-family: sans-serif; }
  .bill-print-branch { font-size: 10px; color: ${isDark?"#64748b":"#64748b"}; margin-top: 3px; line-height: 1.5; }
  .bill-print-title-main { font-size: 18px; font-weight: 900; color: ${accent}; font-family: sans-serif; letter-spacing: .05em; }
  .bill-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; border: 1px solid ${isDark?"#1e2a3a":"#c7d5eb"}; border-radius: 6px; overflow: hidden; margin-bottom: 18px; }
  .bill-info-cell { padding: 7px 12px; border-right: 1px solid ${isDark?"#1e2a3a":"#c7d5eb"}; border-bottom: 1px solid ${isDark?"#1e2a3a":"#c7d5eb"}; background: ${isDark?"#0b1120":"#ffffff"}; }
  .bill-info-cell:nth-child(even) { border-right: none; }
  .bill-info-label { font-size: 9px; font-weight: 700; color: ${isDark?"#475569":"#94a3b8"}; text-transform: uppercase; letter-spacing: .05em; }
  .bill-info-value { font-size: 12px; color: ${isDark?"#e2e8f0":"#1e293b"}; font-weight: 600; margin-top: 2px; }
  .bill-info-value-edit { font-size: 12px; color: ${isDark?"#e2e8f0":"#1e293b"}; font-weight: 600; margin-top: 2px; background: transparent; border: 1px dashed transparent; border-radius: 4px; width: 100%; outline: none; padding: 1px 4px; transition: border-color 0.15s; }
  .bill-info-value-edit:focus { border-color: ${accent}; background: ${isDark?"#080c18":"#f0f9ff"}; }
  .bill-services-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  .bill-services-table th { padding: 8px 10px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; background: ${isDark?"#0f172a":"#f1f5f9"}; color: ${isDark?"#64748b":"#64748b"}; border: 1px solid ${isDark?"#1e2a3a":"#c7d5eb"}; }
  .bill-services-table td { padding: 7px 10px; font-size: 12px; border: 1px solid ${isDark?"#1e2a3a":"#e2e8f0"}; color: ${isDark?"#e2e8f0":"#1e293b"}; }
  .bill-services-table td input { background: transparent; border: 1px dashed transparent; border-radius: 4px; font-size: 12px; color: ${isDark?"#e2e8f0":"#1e293b"}; width: 100%; padding: 2px 4px; outline: none; transition: border-color 0.15s; }
  .bill-services-table td input:focus { border-color: ${accent}; background: ${isDark?"#080c18":"#f0f9ff"}; }
  .bill-totals-section { display: flex; justify-content: flex-end; margin-bottom: 20px; }
  .bill-totals-box { width: 280px; border: 1px solid ${isDark?"#1e2a3a":"#c7d5eb"}; border-radius: 8px; overflow: hidden; }
  .bill-total-row { display: flex; justify-content: space-between; align-items: center; padding: 7px 14px; border-bottom: 1px solid ${isDark?"#1e2a3a":"#e2e8f0"}; font-size: 12px; }
  .bill-total-row:last-child { border-bottom: none; }
  .bill-total-row.net { background: ${accent}15; font-weight: 700; font-size: 14px; padding: 10px 14px; }
  .bill-add-svc-row { display: flex; gap: 8px; align-items: center; padding: 8px 10px; border: 1px dashed ${isDark?"#1a2540":"#c7d5eb"}; border-radius: 6px; background: ${isDark?"#080c18":"#f8faff"}; margin-top: 6px; margin-bottom: 12px; }
  .bill-add-svc-row input { background: var(--input-bg); color: var(--text); border: 1px solid var(--input-border); border-radius: 5px; padding: 5px 8px; font-size: 11px; outline: none; }
  /* ── REPORTS REDESIGN ── */
  .rep-patient-card { background: ${isDark?"#0b1120":"#ffffff"}; border: 1px solid ${isDark?"#1a2540":"#c7d5eb"}; border-radius: 10px; margin-bottom: 14px; overflow: hidden; }
  .rep-patient-head { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; cursor: pointer; background: ${isDark?"#080c18":"#f8faff"}; border-bottom: 1px solid ${isDark?"#1a2540":"#c7d5eb"}; }
  .rep-patient-head:hover { background: ${accent}10; }
  .rep-patient-avatar { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #fff; background: linear-gradient(135deg, ${accent}, #818cf8); }
  .rep-patient-name { font-size: 13px; font-weight: 700; color: ${isDark?"#e2e8f0":"#1e293b"}; }
  .rep-patient-meta { font-size: 10px; color: ${isDark?"#475569":"#64748b"}; margin-top: 2px; }
  /* ── Discharge summary form (billing style) ── */
  .dis-section-card { background: ${isDark?"#0b1120":"#ffffff"}; border: 1px solid ${isDark?"#1a2540":"#c7d5eb"}; border-radius: 12px; margin-bottom: 14px; overflow: hidden; }
  .dis-section-head { display: flex; align-items: center; gap: 10px; padding: 11px 18px; border-bottom: 1px solid ${isDark?"#1a2540":"#c7d5eb"}; background: ${isDark?"#080c18":"#f8faff"}; }
  .dis-section-body { padding: 16px 18px; }
`;

const BILL_PRINT_CSS = `
  @media print {
    body * { visibility: hidden !important; }
    #bill-print-area, #bill-print-area * { visibility: visible !important; }
    #bill-print-area { position: fixed !important; left: 0 !important; top: 0 !important; width: 100% !important; z-index: 99999 !important; padding: 24px !important; background: #fff !important; color: #000 !important; }
    .bill-info-value-edit, .bill-services-table td input { border: none !important; background: transparent !important; }
    .no-print { display: none !important; }
  }
`;

// ── MEDICINE SEARCH DROPDOWN ──────────────────────────────────────────────────
function MedSearchDropdown({ medicineMaster, existingMedicines, onSelect, isDark, accent, placeholder = "Search & add medicine..." }) {
  const [query, setQuery] = useState("");
  const [open, setOpen]   = useState(false);
  const [rect, setRect]   = useState(null);
  const inputRef = useRef(null);
  const wrapRef  = useRef(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const merged1 = [...SANGI_MEDICINE_MASTER, ...(medicineMaster || []).filter(b =>
      !SANGI_MEDICINE_MASTER.some(s => s.name.toLowerCase() === (b.name||b.medicine_name||"").toLowerCase())
    )];
    if (!q) return merged1.slice(0, 30);
    return merged1.filter(m => ((m.name || m.medicine_name || "").toLowerCase().includes(q))).slice(0, 30);
  }, [query, medicineMaster]);

  useEffect(() => {
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const openDropdown = () => {
    if (inputRef.current) setRect(inputRef.current.getBoundingClientRect());
    setOpen(true);
  };

  const isAlready = (name) => (existingMedicines || []).some(m => (m.name || "").toLowerCase() === (name || "").toLowerCase());
  const handleSelect = (med) => { const n = med.name || med.medicine_name || ""; if (isAlready(n)) return; onSelect({...med, name: n}); setQuery(""); setOpen(false); };
  const handleManualAdd = () => { if (!query.trim() || isAlready(query.trim())) return; onSelect({ name: query.trim(), rate: 0, expiry_date: "" }); setQuery(""); setOpen(false); };

  return (
    <div ref={wrapRef} style={{ position: "relative", width: "100%" }}>
      <input
        ref={inputRef}
        placeholder={placeholder}
        value={query}
        onChange={e => { setQuery(e.target.value); openDropdown(); }}
        onFocus={openDropdown}
        onKeyDown={e => { if (e.key === "Enter") handleManualAdd(); if (e.key === "Escape") setOpen(false); }}
        style={{ width:"100%", padding:"10px 12px", borderRadius:8, boxSizing:"border-box", background:isDark?"#0f172a":"#fff", color:isDark?"#e2e8f0":"#0f172a", border:`1px solid ${isDark?"#1e293b":"#c7d5eb"}`, fontSize:13, outline:"none", fontFamily:"inherit" }}
      />
      {open && rect && filtered.length > 0 && (
        <div style={{ position:"fixed", top: rect.bottom + 4, left: rect.left, width: rect.width, zIndex:99999, maxHeight:260, overflowY:"auto", borderRadius:10, boxShadow:"0 12px 32px rgba(0,0,0,0.35)", background:isDark?"#0f172a":"#ffffff", border:`1px solid ${isDark?"#334155":"#c7d5eb"}` }}>
          {filtered.length === 0 && (
            <div onClick={handleManualAdd} style={{ padding:"10px 14px", cursor:"pointer", borderBottom:`1px solid ${isDark?"#1e293b":"#e2e8f0"}`, color:"#10b981" }}>
              <div style={{ fontWeight:600, fontSize:13 }}>+ Add "{query.trim()}" manually</div>
              <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>Custom entry — rate: ₹0</div>
            </div>
          )}
          {filtered.map((m, idx) => {
            const already  = isAlready(m.name || m.medicine_name || "");
            const medName  = m.name || m.medicine_name || "";
            const medRate  = m.rate ?? m.price ?? 0;
            const medExpiry = m.expiry_date || m.expiryDate || "";
            return (
              <div key={idx} onClick={() => !already && handleSelect(m)}
                style={{ padding:"10px 14px", cursor:already?"default":"pointer", borderBottom:`1px solid ${isDark?"#1e293b":"#f1f5f9"}`, opacity:already?0.45:1, background:"inherit" }}
                onMouseEnter={e => { if (!already) e.currentTarget.style.background = isDark?"#1e293b":"#f0f9ff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "inherit"; }}>
                <div style={{ fontSize:13, fontWeight:600, color:isDark?"#e2e8f0":"#0f172a" }}>{already?"✓ ":"+ "}{medName}</div>
                <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>₹{medRate}{medExpiry?` · Exp: ${medExpiry}`:""}{already?" (already added)":""}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── PATHOLOGY REPORT CARD (management style) ──────────────────────────────────
function MgtPathologyReportCard({ rep, ri, patientName, isDark, accent, updRep, updTest, addTest, delTest, onRemove, onSave, onPrint, isSaving }) {
  return (
    <div style={{ background: isDark?"#0b1120":"#ffffff", border: `1px solid ${isDark?"#1a2540":"#c7d5eb"}`, borderRadius: 14, marginBottom: 18, overflow: "hidden", boxShadow: "0 2px 12px rgba(11,37,69,.08)" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%)", color: "#fff", padding: "14px 20px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.12)", borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 700, letterSpacing: ".08em", color: "#93c5fd", marginBottom: 8, textTransform: "uppercase" }}>🧪 PATHOLOGY</div>
          <input value={rep.reportName} placeholder="Report Name (e.g. Complete Blood Count)"
            onChange={e=>updRep(ri,"reportName",e.target.value)}
            style={{ background: "transparent", border: "none", borderBottom: "1.5px solid rgba(255,255,255,.3)", outline: "none", color: "#fff", fontFamily: "inherit", fontSize: 15, fontWeight: 700, width: "100%", paddingBottom: 3 }}/>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 10, fontSize: 12, color: "rgba(255,255,255,.7)", alignItems: "center" }}>
            <span>👤 <strong style={{ color: "#fff" }}>{patientName||"—"}</strong></span>
            <span>Dept:&nbsp;
              <select value={rep.reportType} onChange={e=>updRep(ri,"reportType",e.target.value)}
                style={{ background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,.3)", outline: "none", color: "rgba(255,255,255,.85)", fontFamily: "inherit", fontSize: 12 }}>
                {PATHOLOGY_REPORT_TYPES_LIST.map(t=><option key={t} value={t} style={{ background: "#1e3a5f" }}>{t}</option>)}
              </select>
            </span>
            <span>Date:&nbsp;
              <input type="date" value={rep.date} onChange={e=>updRep(ri,"date",e.target.value)}
                style={{ background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,.3)", outline: "none", color: "rgba(255,255,255,.7)", fontFamily: "inherit", fontSize: 12 }}/>
            </span>
            <span>Ref.by:&nbsp;
              <input value={rep.orderedBy||""} placeholder="Doctor" onChange={e=>updRep(ri,"orderedBy",e.target.value)}
                style={{ background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,.3)", outline: "none", color: "rgba(255,255,255,.7)", fontFamily: "inherit", fontSize: 12, width: 120 }}/>
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0, flexDirection: "column", alignItems: "flex-end" }}>
          <button onClick={onRemove} style={{ background: "rgba(248,113,113,.15)", color: "#fca5a5", border: "1px solid rgba(248,113,113,.3)", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11, fontFamily: "inherit", fontWeight: 600 }}>Remove</button>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={onPrint} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: "transparent", border: `1px solid ${accent}60`, color: accent, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><Printer size={11}/> Print</button>
            <button onClick={onSave} disabled={!!isSaving} style={{ padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: isSaving?"#1e2a3a":`linear-gradient(135deg,${accent},${accent}cc)`, color: "#fff", border: "none", cursor: isSaving?"default":"pointer" }}>{isSaving?"Saving…":"💾 Save"}</button>
          </div>
          {rep.saved===true&&<span style={{ fontSize: 10, color: "#34d399", fontWeight: 600 }}>✓ Saved</span>}
          {rep.saved===false&&<span style={{ fontSize: 10, color: "#f59e0b", fontWeight: 600 }}>● Unsaved</span>}
        </div>
      </div>
      {/* Test table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <colgroup><col style={{ width:"36%" }}/><col style={{ width:"18%" }}/><col style={{ width:"10%" }}/><col style={{ width:"24%" }}/><col style={{ width:"8%" }}/><col style={{ width:"40px" }}/></colgroup>
          <thead>
            <tr style={{ background: isDark?"#0f172a":"#f8fafc" }}>
              <th style={{ textAlign:"left", padding:"9px 14px", fontSize:10, fontWeight:700, color:isDark?"#475569":"#94a3b8", textTransform:"uppercase", letterSpacing:".06em", borderBottom:`2px solid ${isDark?"#1a2540":"#e2e8f0"}` }}>Test Name</th>
              <th style={{ textAlign:"center", padding:"9px 8px", fontSize:10, fontWeight:700, color:"#0369a1", textTransform:"uppercase", letterSpacing:".06em", borderBottom:`2px solid ${isDark?"#1a2540":"#e2e8f0"}`, background:"#f0f9ff" }}>Value ✏️</th>
              <th style={{ textAlign:"left", padding:"9px 8px", fontSize:10, fontWeight:700, color:isDark?"#475569":"#94a3b8", textTransform:"uppercase", letterSpacing:".06em", borderBottom:`2px solid ${isDark?"#1a2540":"#e2e8f0"}` }}>Unit</th>
              <th style={{ textAlign:"left", padding:"9px 14px", fontSize:10, fontWeight:700, color:isDark?"#475569":"#94a3b8", textTransform:"uppercase", letterSpacing:".06em", borderBottom:`2px solid ${isDark?"#1a2540":"#e2e8f0"}` }}>Normal Range</th>
              <th style={{ textAlign:"center", padding:"9px 8px", fontSize:10, fontWeight:700, color:isDark?"#475569":"#94a3b8", textTransform:"uppercase", letterSpacing:".06em", borderBottom:`2px solid ${isDark?"#1a2540":"#e2e8f0"}` }}>Status</th>
              <th style={{ borderBottom:`2px solid ${isDark?"#1a2540":"#e2e8f0"}` }}/>
            </tr>
          </thead>
          <tbody>
            {!(rep.tests||[]).length&&<tr><td colSpan={6} style={{ textAlign:"center", padding:"14px", color:"#64748b", fontStyle:"italic", fontSize:12 }}>No test rows yet — click "+ Add Row" below.</td></tr>}
            {(rep.tests||[]).map((t,ti)=>(
              <tr key={t.id||ti} style={{ borderBottom:`1px solid ${isDark?"#111827":"#f1f5f9"}` }}>
                <td style={{ padding:"7px 14px" }}>
                  <input value={t.name||""} placeholder="e.g. Haemoglobin" onChange={e=>updTest(ri,ti,"name",e.target.value)}
                    style={{ background:isDark?"#0b1120":"#f8fafc", border:`1.5px solid ${isDark?"#1a2540":"#e2e8f0"}`, borderRadius:6, padding:"5px 9px", color:isDark?"#cbd5e1":"#334155", fontSize:12, fontFamily:"inherit", outline:"none", width:"100%" }}/>
                </td>
                <td style={{ padding:"7px 8px", background:"#f0f9ff", textAlign:"center" }}>
                  <input value={t.value||""} placeholder="—" onChange={e=>updTest(ri,ti,"value",e.target.value)}
                    style={{ background:"#fff", border:"2px solid #bae6fd", borderRadius:6, padding:"5px 7px", color:statusColor(t.status), fontSize:13, fontFamily:"inherit", fontWeight:700, outline:"none", width:"100%", textAlign:"center" }}/>
                </td>
                <td style={{ padding:"7px 8px" }}>
                  <input value={t.unit||""} onChange={e=>updTest(ri,ti,"unit",e.target.value)}
                    style={{ background:isDark?"#0b1120":"#f8fafc", border:`1.5px solid ${isDark?"#1a2540":"#e2e8f0"}`, borderRadius:6, padding:"5px 7px", color:isDark?"#94a3b8":"#64748b", fontSize:11, fontFamily:"inherit", outline:"none", width:"100%" }}/>
                </td>
                <td style={{ padding:"7px 14px" }}>
                  <input value={t.refRange||""} onChange={e=>updTest(ri,ti,"refRange",e.target.value)}
                    style={{ background:isDark?"#0b1120":"#f8fafc", border:`1.5px solid ${isDark?"#1a2540":"#e2e8f0"}`, borderRadius:6, padding:"5px 9px", color:isDark?"#94a3b8":"#64748b", fontSize:12, fontFamily:"inherit", outline:"none", width:"100%" }}/>
                </td>
                <td style={{ padding:"7px 8px", textAlign:"center" }}>
                  <select value={t.status||"Normal"} onChange={e=>updTest(ri,ti,"status",e.target.value)}
                    style={{ background:isDark?"#0b1120":"#f8fafc", border:`1.5px solid ${isDark?"#1a2540":"#e2e8f0"}`, borderRadius:6, padding:"4px 4px", color:statusColor(t.status||"Normal"), fontSize:11, fontFamily:"inherit", outline:"none", fontWeight:700 }}>
                    <option>Normal</option><option>High</option><option>Low</option>
                  </select>
                </td>
                <td style={{ padding:"7px 8px", textAlign:"center" }}>
                  <button onClick={()=>delTest(ri,ti)} style={{ background:"none", border:"none", color:"#f87171", cursor:"pointer", fontSize:13 }}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ padding:"8px 14px", borderTop:`1px solid ${isDark?"#111827":"#f1f5f9"}` }}>
        <button onClick={()=>addTest(ri)} style={{ fontSize:11, color:accent, background:"none", border:"none", cursor:"pointer", fontWeight:600 }}>+ Add Row</button>
      </div>
      <div style={{ padding:"10px 14px 14px", borderTop:`1px solid ${isDark?"#111827":"#f1f5f9"}` }}>
        <label style={{ fontSize:9, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:".06em", display:"block", marginBottom:4 }}>Remarks / Interpretation</label>
        <input value={rep.remarks||""} placeholder="e.g. Mild anaemia noted, TLC elevated..." onChange={e=>updRep(ri,"remarks",e.target.value)}
          style={{ width:"100%", background:isDark?"#080c18":"#fff", border:`1.5px solid ${isDark?"#1a2540":"#e2e8f0"}`, borderRadius:8, padding:"7px 11px", color:isDark?"#e2e8f0":"#0f172a", fontSize:12, fontFamily:"inherit", outline:"none" }}/>
      </div>
    </div>
  );
}

// ── RADIOLOGY REPORT CARD (management style) ──────────────────────────────────
function MgtRadiologyReportCard({ rep, ri, patientName, isDark, accent, updRep, onRemove, onSave, onPrint, isSaving }) {
  return (
    <div style={{ background: isDark?"#0b1120":"#ffffff", border: `1px solid ${isDark?"#1a2540":"#c7d5eb"}`, borderRadius: 14, marginBottom: 18, overflow: "hidden", boxShadow: "0 2px 12px rgba(11,37,69,.08)" }}>
      <div style={{ background: "linear-gradient(135deg,#064e3b 0%,#065f46 100%)", color: "#fff", padding: "14px 20px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.12)", borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 700, letterSpacing: ".08em", color: "#6ee7b7", marginBottom: 8, textTransform: "uppercase" }}>🩻 RADIOLOGY</div>
          <input value={rep.reportName} placeholder="Radiology Report Name (e.g. X-Ray Chest PA View)"
            onChange={e=>updRep(ri,"reportName",e.target.value)}
            style={{ background: "transparent", border: "none", borderBottom: "1.5px solid rgba(255,255,255,.3)", outline: "none", color: "#fff", fontFamily: "inherit", fontSize: 15, fontWeight: 700, width: "100%", paddingBottom: 3 }}/>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 10, fontSize: 12, color: "rgba(255,255,255,.7)", alignItems: "center" }}>
            <span>👤 <strong style={{ color: "#fff" }}>{patientName||"—"}</strong></span>
            <span>Modality:&nbsp;
              <select value={rep.reportType} onChange={e=>updRep(ri,"reportType",e.target.value)}
                style={{ background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,.3)", outline: "none", color: "rgba(255,255,255,.85)", fontFamily: "inherit", fontSize: 12 }}>
                {RADIOLOGY_REPORT_TYPES_LIST.map(t=><option key={t} value={t} style={{ background: "#065f46" }}>{t}</option>)}
              </select>
            </span>
            <span>Date:&nbsp;
              <input type="date" value={rep.date} onChange={e=>updRep(ri,"date",e.target.value)}
                style={{ background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,.3)", outline: "none", color: "rgba(255,255,255,.7)", fontFamily: "inherit", fontSize: 12 }}/>
            </span>
            <span>Ref.by:&nbsp;
              <input value={rep.orderedBy||""} placeholder="Doctor" onChange={e=>updRep(ri,"orderedBy",e.target.value)}
                style={{ background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,.3)", outline: "none", color: "rgba(255,255,255,.7)", fontFamily: "inherit", fontSize: 12, width: 120 }}/>
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0, flexDirection: "column", alignItems: "flex-end" }}>
          <button onClick={onRemove} style={{ background: "rgba(248,113,113,.15)", color: "#fca5a5", border: "1px solid rgba(248,113,113,.3)", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11, fontFamily: "inherit", fontWeight: 600 }}>Remove</button>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={onPrint} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: "transparent", border: `1px solid ${accent}60`, color: accent, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><Printer size={11}/> Print</button>
            <button onClick={onSave} disabled={!!isSaving} style={{ padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: isSaving?"#1e2a3a":`linear-gradient(135deg,${accent},${accent}cc)`, color: "#fff", border: "none", cursor: isSaving?"default":"pointer" }}>{isSaving?"Saving…":"💾 Save"}</button>
          </div>
          {rep.saved===true&&<span style={{ fontSize:10, color:"#34d399", fontWeight:600 }}>✓ Saved</span>}
        </div>
      </div>
      <div style={{ padding:"18px 20px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        <div>
          <label style={{ fontSize:10, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:".06em", display:"block", marginBottom:6 }}>Findings / Report</label>
          <textarea value={rep.findings||""} placeholder="Describe radiological findings here..." onChange={e=>updRep(ri,"findings",e.target.value)} rows={5}
            style={{ width:"100%", background:isDark?"#080c18":"#f8fafc", border:`1.5px solid ${isDark?"#1a2540":"#e2e8f0"}`, borderRadius:8, padding:"9px 11px", color:isDark?"#e2e8f0":"#0f172a", fontSize:12, fontFamily:"inherit", outline:"none", resize:"vertical", boxSizing:"border-box" }}/>
        </div>
        <div>
          <label style={{ fontSize:10, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:".06em", display:"block", marginBottom:6 }}>Impression / Conclusion</label>
          <textarea value={rep.impression||""} placeholder="Clinical impression / diagnosis..." onChange={e=>updRep(ri,"impression",e.target.value)} rows={5}
            style={{ width:"100%", background:isDark?"#080c18":"#f8fafc", border:`1.5px solid ${isDark?"#1a2540":"#e2e8f0"}`, borderRadius:8, padding:"9px 11px", color:isDark?"#e2e8f0":"#0f172a", fontSize:12, fontFamily:"inherit", outline:"none", resize:"vertical", boxSizing:"border-box" }}/>
        </div>
      </div>
      <div style={{ padding:"10px 20px 16px", borderTop:`1px solid ${isDark?"#111827":"#f1f5f9"}` }}>
        <label style={{ fontSize:10, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:".06em", display:"block", marginBottom:4 }}>Remarks</label>
        <input value={rep.remarks||""} placeholder="Additional remarks..." onChange={e=>updRep(ri,"remarks",e.target.value)}
          style={{ width:"100%", background:isDark?"#080c18":"#fff", border:`1.5px solid ${isDark?"#1a2540":"#e2e8f0"}`, borderRadius:8, padding:"7px 11px", color:isDark?"#e2e8f0":"#0f172a", fontSize:12, fontFamily:"inherit", outline:"none" }}/>
      </div>
    </div>
  );
}

// ── MANUAL REPORT ADDER ────────────────────────────────────────────────────────
function ManualReportAdder({ isDark, accent, onAdd }) {
  const [name, setName] = useState("");
  const handleAdd = () => { const t = name.trim(); if (!t) return; onAdd(t); setName(""); };
  return (
    <div style={{ display:"flex", gap:6, alignItems:"center" }}>
      <input value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleAdd()} placeholder="Custom report name…"
        style={{ background:isDark?"#080c18":"#ffffff", color:isDark?"#e2e8f0":"#1e293b", border:`1px solid ${isDark?"#1a2540":"#c7d5eb"}`, borderRadius:6, padding:"5px 10px", fontSize:11, outline:"none", width:180 }}/>
      <button onClick={handleAdd} disabled={!name.trim()}
        style={{ padding:"5px 11px", borderRadius:6, fontSize:11, fontWeight:700, background:name.trim()?`linear-gradient(135deg,${accent},${accent}cc)`:isDark?"#1e2a3a":"#e2e8f0", color:name.trim()?"#fff":"#64748b", border:"none", cursor:name.trim()?"pointer":"default", whiteSpace:"nowrap" }}>
        + Add
      </button>
    </div>
  );
}


const MGMT_SERVICE_MASTER = [
  { name:"General Ward",            code:"RM01",  cat:"ROOM CHARGES",     rate:1500 },
  { name:"Semi-Private Ward",       code:"RM02",  cat:"ROOM CHARGES",     rate:2500 },
  { name:"Private Room",            code:"RM03",  cat:"ROOM CHARGES",     rate:4000 },
  { name:"ICU",                     code:"CC001", cat:"CRITICAL CARE",    rate:5400 },
  { name:"NICU",                    code:"CC002", cat:"CRITICAL CARE",    rate:6000 },
  { name:"HDU",                     code:"CC003", cat:"CRITICAL CARE",    rate:4500 },
  { name:"Ventilator Charges",      code:"CC004", cat:"CRITICAL CARE",    rate:3000 },
  { name:"Oxygen Charges",          code:"OX001", cat:"GENERAL SERVICES", rate:500  },
  { name:"Consultant Visit",        code:"CN001", cat:"CONSULTATION",     rate:700  },
  { name:"Specialist Consultation", code:"CN002", cat:"CONSULTATION",     rate:1000 },
  { name:"Operation Theatre (OT)",  code:"OT001", cat:"SURGICAL",         rate:8000 },
  { name:"Minor OT",                code:"OT002", cat:"SURGICAL",         rate:2000 },
  { name:"Dressing",                code:"DR001", cat:"PROCEDURE",        rate:300  },
  { name:"IV Cannula Insertion",    code:"PR001", cat:"PROCEDURE",        rate:150  },
  { name:"Catheterisation",         code:"PR002", cat:"PROCEDURE",        rate:400  },
  { name:"Nebulization",            code:"PR003", cat:"PROCEDURE",        rate:200  },
  { name:"ECG",                     code:"EC001", cat:"DIAGNOSTICS",      rate:350  },
  { name:"Blood Transfusion",       code:"BT001", cat:"PROCEDURE",        rate:800  },
  { name:"Physiotherapy",           code:"PT001", cat:"GENERAL SERVICES", rate:600  },
  { name:"Diet Charges",            code:"DT001", cat:"GENERAL SERVICES", rate:250  },
  { name:"Ambulance",               code:"AM001", cat:"GENERAL SERVICES", rate:1200 },
  { name:"Registration Fee",        code:"RF001", cat:"GENERAL SERVICES", rate:100  },
];

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function ManagementAdminDashboard({ currentUser, db, locId, onLogout }) {
  const { isDark } = useTheme();
  const userBranchKey = BRANCH_CODE_TO_KEY[String(currentUser?.branch||"").toUpperCase()];
  const locBranchKey  = BRANCH_KEYS.includes(locId) ? locId : null;
  const homeBranch    = userBranchKey||locBranchKey||(currentUser?.locations?.find(l=>BRANCH_KEYS.includes(l))||"laxmi");
  const isOfficeAdmin = String(currentUser?.role||"").toLowerCase()==="office_admin";
  const isSuperAdmin  = String(currentUser?.role||"").toLowerCase()==="superadmin";
  const allowedBranchKeys = BRANCH_KEYS;

  const [viewBranch, setViewBranch] = useState(homeBranch);
  const activeBranchCode = BRANCH_KEY_TO_CODE[viewBranch]||"LNM";
  const bc     = BC[viewBranch]||BC.laxmi;
  const accent = bc.accent;

  useEffect(()=>{ if(!allowedBranchKeys.includes(viewBranch)) setViewBranch(homeBranch); },[allowedBranchKeys,viewBranch,homeBranch]);

  const [activeTab,   setActiveTab]   = useState("home");
  const [collapsed,   setCollapsed]   = useState(false);
  const [notif,       setNotif]       = useState(null);
  const [profileForm, setProfileForm] = useState({first_name:"",last_name:"",email:"",phone_number:"",emp_id:""});
  const [allPatients, setAllPatients] = useState({laxmi:[],raya:[]});
  const [employees,      setEmployees]      = useState([]);
  const [showEmpModal,   setShowEmpModal]   = useState(false);
  const [editEmpId,      setEditEmpId]      = useState(null);
  const [empForm,        setEmpForm]        = useState({fullName:"",username:"",empId:"",dept:"HOD",email:"",phone:"",role:"hod",password:"",confirmPassword:""});
  const [empShowPass,    setEmpShowPass]    = useState(false);
  const [empShowConfirm, setEmpShowConfirm] = useState(false);
  const [empPassErr,     setEmpPassErr]     = useState("");
  const [tasks,          setTasks]          = useState([]);
  const [tasksLoading,   setTasksLoading]   = useState(false);

  const loadTasks = useCallback(async () => {
    setTasksLoading(true);
    try {
      const data = await apiService.getTasks();
      const list = Array.isArray(data) ? data : (data?.results || []);
      setTasks(list.map(mapTaskFromApi));
    } catch(err) { console.error("Failed to load tasks:", err); }
    finally { setTasksLoading(false); }
  }, []);
  const [showTaskModal,  setShowTaskModal]  = useState(false);
  const [editTask,       setEditTask]       = useState(null);
  const [taskForm,       setTaskForm]       = useState({title:"",description:"",assignedToId:"",department:"HOD",priority:"Medium",status:"Pending",dueDate:"",patientUhids:[],patientNames:[]});
  const [taskPatientSearch,setTaskPatientSearch] = useState("");
  const [taskReportFilter, setTaskReportFilter]  = useState({period:"all",dept:"All",status:"All",empName:""});
  const [departments,   setDepartments]   = useState(()=>safeLoad("hms_mgmt_departments",[]));
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptForm,      setDeptForm]      = useState({name:"",description:"",head:""});

  // ── BILLING STATE ─────────────────────────────────────────────────────────
  const [selectedBillPatient, setSelectedBillPatient] = useState(null);
  const [billData,   setBillData]   = useState({});
  const [billServices, setBillServices] = useState({});
  const [newSvcRow,  setNewSvcRow]  = useState({date:"",cghs:"",desc:"",qty:1,rate:0});
  const [svcSearch,  setSvcSearch]  = useState("");
  const [svcSearchOpen, setSvcSearchOpen] = useState(false);
  const svcSearchRef = useRef(null);
  const billPrintRef = useRef(null);

  // ── REPORTS STATE (card-based) ────────────────────────────────────────────
  const [expandedRepPatient, setExpandedRepPatient] = useState(null);
  const [patientReports,     setPatientReports]     = useState({});   // uhid -> { reportName -> repObj }
  const [repLoading,         setRepLoading]         = useState({});
  const [repSaving,          setRepSaving]          = useState({});
  const [repTemplateSearch,  setRepTemplateSearch]  = useState({});
  const [repFilter,          setRepFilter]          = useState({});    // uhid -> "All"|"🧪 Pathology"|"🩻 Radiology"

  // ── DISCHARGE SUMMARY STATE (flat-fields, billing-dashboard style) ─────────
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryTypeCache, setSummaryTypeCache] = useState({});
  const [editSumPt,        setEditSumPt]        = useState(null);
  const [summaryType,      setSummaryType]      = useState("NORMAL");
  const [summaryAdmNo,     setSummaryAdmNo]     = useState(null);
  const [editDisFields,    setEditDisFields]    = useState({});   // flat discharge fields
  const [summarySaving,    setSummarySaving]    = useState(false);

  // ── OTHER MODAL STATE ─────────────────────────────────────────────────────
  const [showViewModal,     setShowViewModal]     = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReportModal,   setShowReportModal]   = useState(false);
  const [viewPt,            setViewPt]            = useState(null);
  const [deletePt,          setDeletePt]          = useState(null);
  const [editRepPt,         setEditRepPt]         = useState(null);
  const [newReport,         setNewReport]         = useState({name:"",date:"",result:""});
  const [dischSumFilter,    setDischSumFilter]    = useState("All");

  // ── MEDICINES STATE ───────────────────────────────────────────────────────
  const [medSearch,      setMedSearch]      = useState("");
  const [medicineMaster, setMedicineMaster] = useState([]);
  const [showMedModal,   setShowMedModal]   = useState(false);
  const [selectedMedPt,  setSelectedMedPt]  = useState(null);
  const [medHistData,    setMedHistData]     = useState({});
  const [editMedPt,      setEditMedPt]      = useState(null);

  const toast = (msg,type="ok") => { setNotif({msg,type}); setTimeout(()=>setNotif(null),3200); };

  // ── LOAD EMPLOYEES ─────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const users = await apiService.getUsers();
        setEmployees(users.map(u => ({ id:u.id, empId:u.emp_id||"—", username:u.username, fullName:`${u.first_name} ${u.last_name}`.trim(), name:`${u.first_name} ${u.last_name}`.trim()||u.username, email:u.email, phone:u.phone_number, role:u.role, dept:u.role.replaceAll("_"," ").replace(/\b\w/g,ch=>ch.toUpperCase()), status:u.is_active?"Active":"Inactive" })));
      } catch(err) { console.error("Failed to load employees",err); }
    };
    load();
  }, []);

  // ── SYNC DB → allPatients ─────────────────────────────────────────────────
  useEffect(() => {
    if (db) {
      setAllPatients(prev => {
        const merged = { ...db };
        for (const bk of ["laxmi","raya"]) {
          if (!Array.isArray(db[bk])) continue;
          merged[bk] = db[bk].map(dbPt => {
            const localPt = (prev[bk]||[]).find(p=>p.uhid===dbPt.uhid);
            if (!localPt) return dbPt;
            return { ...dbPt, medicines: localPt.medicines??dbPt.medicines };
          });
        }
        return merged;
      });
    }
  }, [db]);

  // ── FETCH MEDICINE MASTER (uses apiService like HOD/Billing) ────────────
  // ── Load tasks from backend on mount + refresh every 60s ─────────────────
  useEffect(() => {
    loadTasks();
    const interval = setInterval(loadTasks, 60000);
    return () => clearInterval(interval);
  }, [loadTasks]);


  useEffect(() => {
    apiService.getMedicineMaster()
      .then(list => {
        console.log("Medicine master loaded:", list?.length, "items", list?.[0]);
        setMedicineMaster(Array.isArray(list) && list.length > 0 ? list : []);
      })
      .catch(err => { console.error("Medicine master fetch error:", err); setMedicineMaster([]); });
  }, []);

  useEffect(()=>safeSave("hms_mgmt_departments",departments),[departments]);

  const allPatientsFlat  = useMemo(()=>BRANCH_KEYS.flatMap(bk=>(allPatients[bk]||[]).map(p=>({...p,_branch:bk,_branchLabel:BC[bk].label}))),[allPatients]);
  const allDeptOptions   = [...DEPT_OPTIONS,...departments.filter(d=>!DEPT_OPTIONS.includes(d.name)).map(d=>d.name)];
  const locationPatients = useMemo(()=>isOfficeAdmin?allPatientsFlat:(allPatients[viewBranch]||[]),[isOfficeAdmin,allPatientsFlat,allPatients,viewBranch]);
  const allAdmissions    = useMemo(()=>locationPatients.flatMap(p=>(p.admissions||[]).map(a=>({...a,patientName:p.patientName||p.name,uhid:p.uhid,gender:p.gender,bloodGroup:p.bloodGroup,phone:p.phone}))),[locationPatients]);
  const currentlyAdmitted= allAdmissions.filter(a=>!a.discharge?.dod).length;
  const discharged       = allAdmissions.filter(a=> a.discharge?.dod).length;
  const allPatientsForTask=useMemo(()=>allPatientsFlat.map(p=>({id:p.id,uhid:p.uhid,name:p.patientName||p.name,branch:p._branchLabel,status:(p.admissions?.[p.admissions.length-1]?.discharge?.dod)?"Discharged":"Admitted"})),[allPatientsFlat]);
  const filteredTaskPatients=useMemo(()=>{
    if(!taskPatientSearch.trim()) return allPatientsForTask;
    const q=taskPatientSearch.toLowerCase();
    return allPatientsForTask.filter(p=>p.name.toLowerCase().includes(q)||p.uhid.toLowerCase().includes(q));
  },[allPatientsForTask,taskPatientSearch]);
  const taskAssignableEmployees=useMemo(()=>{
    const expectedRole=getRoleForDepartment(taskForm.department);
    return employees.filter(e=>{ const role=String(e.role||"").toLowerCase(); if(!TASK_ASSIGNABLE_ROLES.has(role)) return false; if(!expectedRole) return true; return role===expectedRole; });
  },[employees,taskForm.department]);

  const currentDisplayName = `${profileForm.first_name||""} ${profileForm.last_name||""}`.trim()||currentUser?.name||"";

  const getEmployeeBranchCode = useCallback(()=>{ if(isOfficeAdmin) return "ALL"; if(isSuperAdmin) return activeBranchCode; return String(currentUser?.branch||activeBranchCode||"LNM").toUpperCase(); }, [isOfficeAdmin, isSuperAdmin, activeBranchCode, currentUser?.branch]);
  const buildEmployeeId = useCallback((branchCode)=>{ const prefix=EMPLOYEE_ID_PREFIXES[branchCode]||"EMP"; const hi=employees.reduce((max,e)=>{ const c=String(e.empId||"").trim().toUpperCase(); if(!c.startsWith(prefix)) return max; const n=Number(c.slice(prefix.length)); return Number.isInteger(n)?Math.max(max,n):max; },0); return `${prefix}${String(hi+1).padStart(4,"0")}`; }, [employees]);

  useEffect(()=>{
    if(!showEmpModal||editEmpId) return;
    const load=async()=>{ const bc2=getEmployeeBranchCode(); try { const d=await apiService.getNextEmpId({role:empForm.role,branch:bc2}); setEmpForm(f=>({...f,empId:d?.next_id||f.empId})); } catch { setEmpForm(f=>({...f,empId:f.empId||buildEmployeeId(bc2)})); } };
    load();
  },[showEmpModal,editEmpId,empForm.role,viewBranch,currentUser?.role,buildEmployeeId,getEmployeeBranchCode]);

  // ── PATIENT UPDATER ───────────────────────────────────────────────────────
  const updatePatient = useCallback((branchKey, uhid, updater) => {
    setAllPatients(prev => ({ ...prev, [branchKey]: (prev[branchKey]||[]).map(p=>p.uhid===uhid?updater(p):p) }));
  }, []);

  const resolveAdmNo = (p) => { const raw=p?.admissions?.[0]?.admNo??p?.admNo??1; const clean=String(raw).replace(/\D/g,""); return clean||"1"; };

  // ── MEDICINE HELPERS ──────────────────────────────────────────────────────
  const openMedEditor = useCallback((p) => {
    const copy = JSON.parse(JSON.stringify(p));
    copy.medicines = Array.isArray(copy.medicines)?copy.medicines:[];
    setEditMedPt(copy); setShowMedModal(true);
  }, []);

  const addMedToPatientInline = useCallback((branchKey, p, med) => {
    const already = (p.medicines||[]).some(m=>(m.name||"").toLowerCase()===(med.name||"").toLowerCase());
    if (already) { toast(`"${med.name}" already added`,"err"); return; }
    updatePatient(branchKey, p.uhid, pt=>({ ...pt, medicines:[...(pt.medicines||[]),{id:Date.now(),name:med.name||med.medicine_name||"",qty:1,rate:parseFloat(med.rate??med.price??0),batchNo:med.batch_no||med.batchNo||"",expiryDate:med.expiry_date||med.expiryDate||""}] }));
    toast(`"${med.name}" added`);
  }, [updatePatient, medicineMaster]);

  const addMedFromHistoryPill = useCallback((branchKey, p, medName) => {
    const already = (p.medicines||[]).some(m=>(m.name||"").toLowerCase()===medName.toLowerCase());
    if (already) { toast(`"${medName}" already in list`,"err"); return; }
    const normName = n => String(n||"").toLowerCase().replace(/[^a-z0-9]/g,"");
    const normMed = normName(medName);
    const masterMed = (medicineMaster||[]).find(m=>normName(m.name)===normMed)
      || (medicineMaster||[]).find(m=>normName(m.name).includes(normMed.slice(0,8)))
      || (medicineMaster||[]).find(m=>normMed.includes(normName(m.name).slice(0,8)));
    updatePatient(branchKey, p.uhid, pt=>({ ...pt, medicines:[...(pt.medicines||[]),{id:Date.now(),name:medName,qty:1,rate:parseFloat(masterMed?.rate??masterMed?.price??masterMed?.selling_price??masterMed?.mrp??0),batchNo:masterMed?.batch_no||masterMed?.batchNo||"",expiryDate:masterMed?.expiry_date||masterMed?.expiryDate||""}] }));
    toast(`Added "${medName}"`);
  }, [updatePatient, medicineMaster]);

  const updateMed = (idx,field,val) => setEditMedPt(prev=>{ if(!prev) return prev; const m=[...(prev.medicines||[])]; m[idx]={...m[idx],[field]:field==="name"?val:(parseFloat(val)||0)}; return{...prev,medicines:m}; });
  const addMedRow = () => setEditMedPt(prev=>{ if(!prev) return prev; return{...prev,medicines:[...(prev.medicines||[]),{id:Date.now(),name:"",qty:1,rate:0}]}; });
  const delMedRow = (idx) => setEditMedPt(prev=>{ if(!prev) return prev; return{...prev,medicines:(prev.medicines||[]).filter((_,i)=>i!==idx)}; });

  const addMedFromDropdownToDrawer = useCallback((med) => {
    setEditMedPt(prev=>{ if(!prev) return prev; const already=(prev.medicines||[]).some(m=>(m.name||"").toLowerCase()===(med.name||"").toLowerCase()); if(already) return prev; return{...prev,medicines:[...(prev.medicines||[]),{id:Date.now(),name:med.name,qty:1,rate:parseFloat(med.rate??med.price??0),batchNo:med.batch_no||med.batchNo||"",expiryDate:med.expiry_date||med.expiryDate||""}]}; });
  }, []);

  const saveMeds = () => {
    if (!editMedPt) return;
    const branchKey = editMedPt._branch||viewBranch;
    updatePatient(branchKey, editMedPt.uhid, p=>({...p,medicines:editMedPt.medicines||[]}));
    toast("Medicines saved"); setShowMedModal(false); setEditMedPt(null);
  };

  // ── DISCHARGE SUMMARY (billing-dashboard style) ───────────────────────────
  const openSummaryEditor = async (p) => {
    setEditSumPt(p);
    const adm = p.admissions?.[0]||{};
    const d   = adm.discharge||{};
    let ds = p.dischargeSummary||{};
    const dischargeStatusFromAdm = p.admissions?.[0]?.discharge?.dischargeStatus || "";
    let initialType = normalizeSummaryType(ds.type || dischargeStatusFromAdm || "NORMAL");

    try {
      const admNo = String(resolveAdmNo(p));
      const res = await fetch(BASE_URL + "/patients/" + p.uhid + "/admissions/" + admNo + "/dynamic-summary/", {
        headers: { Authorization: "Bearer " + (sessionStorage.getItem("hms_token") || "") }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.summary_type) initialType = normalizeSummaryType(data.summary_type === "REFERRED" ? "REFER" : data.summary_type);
        if (data.content?.sections) {
          const sec = {};
          data.content.sections.forEach(s => {
            if (s.type === "vitals_grid" && typeof s.value === "object") {
              sec.bp = s.value.bp||""; sec.pr = s.value.pulse||"";
              sec.spo2 = s.value.spo2||""; sec.temp = s.value.temp||"";
              sec.chest = s.value.chest||""; sec.cvs = s.value.cvs||"";
              sec.cns = s.value.cns||""; sec.pa = s.value.abd||"";
            } else { sec[s.key] = s.value||""; }
          });
          ds = { ...ds, ...sec };
        }
      }
    } catch(e) { console.warn("Could not fetch summary:", e); }
    setSummaryAdmNo(resolveAdmNo(p));
    // Pull medical history as prefill source (same as BillingDashboard)
    const mh = adm.medicalHistory || p.medicalHistory || {};
    setEditDisFields({
      doa:              d.doa||adm.dateTime?.slice(0,10)||"",
      dod:              d.dod||"",
      expectedDod:      d.expectedDod||"",
      ward:             d.wardName||"",
      bed:              d.bedNo||"",
      doctor:           d.doctorName||ds.doctorName||mh.treatingDoctor||"",
      diagnosis:        ds.diagnosis||d.diagnosis||mh.diagnosis||mh.provisionalDiagnosis||"",
      chiefComplaints:  ds.chiefComplaints||adm.complaints||mh.chiefComplaints||mh.presentComplaints||"",
      historyOfIllness: ds.historyOfIllness||mh.historyOfIllness||mh.historyOfPresentIllness||"",
      investigations:   ds.investigations||mh.investigations||"",
      treatmentGiven:   ds.treatmentGiven||ds.treatment||mh.treatmentAdvised||mh.treatmentGiven||"",
      conditionAtDischarge: ds.conditionAtDischarge||"",
      adviceOnDischarge:    ds.adviceOnDischarge||ds.followUp||mh.adviceOnDischarge||"",
      followUp:         ds.followUp||mh.followUp||"",
      reasonForLama:    ds.reasonForLama||"",
      lamaDeclaration:  ds.lamaDeclaration||"",
      reasonForDopr:    ds.reasonForDopr||"",
      referredTo:       ds.referredTo||"",
      notes:            ds.notes||mh.notes||"",
      bp:    d.bp   ||mh.bp   ||"",
      pr:    d.pr   ||mh.pr   ||"",
      spo2:  d.spo2 ||mh.spo2 ||"",
      temp:  d.temp ||mh.temp ||"",
      chest: d.chest||mh.chest||"",
      cvs:   d.cvs  ||mh.cvs  ||"",
      cns:   d.cns  ||mh.cns  ||"",
      pa:    d.pa   ||mh.pa   ||"",
    });
    setSummaryType(initialType);
    setSummaryTypeCache(prev => ({ ...prev, [p.uhid]: initialType }));

    setShowSummaryModal(true);
  };

  const saveSummary = async () => {
    if (!editSumPt) return;
    const admNo = summaryAdmNo||resolveAdmNo(editSumPt);
    setSummarySaving(true);
    try {
      const sections = (DISCHARGE_SECTIONS_MAP[summaryType]||DISCHARGE_SECTIONS_MAP.NORMAL).map(sec => ({
        key:   sec.key,
        label: sec.label,
        type:  sec.type||"text",
        value: sec.type==="vitals_grid"
          ? { bp:editDisFields.bp||"", pulse:editDisFields.pr||"", spo2:editDisFields.spo2||"", temp:editDisFields.temp||"", chest:editDisFields.chest||"", cvs:editDisFields.cvs||"", cns:editDisFields.cns||"", abd:editDisFields.pa||"" }
          : (editDisFields[sec.key]||""),
      }));
      await apiService.saveDynamicSummary(editSumPt.uhid, admNo, { summary_type:summaryType, content:{ sections } });
      const branchKey = editSumPt._branch||viewBranch;
      updatePatient(branchKey, editSumPt.uhid, p=>({
        ...p,
        dischargeSummary:{
          ...(p.dischargeSummary||{}),
          type:summaryType, diagnosis:editDisFields.diagnosis,
          treatment:editDisFields.treatmentGiven, followUp:editDisFields.followUp,
          notes:editDisFields.notes, doctorName:editDisFields.doctor,
        }
      }));
      setSummaryTypeCache(prev => ({ ...prev, [editSumPt.uhid]: summaryType }));
      toast("Discharge summary saved"); setShowSummaryModal(false); setEditSumPt(null);
    } catch { toast("Failed to save discharge summary","err"); }
    finally { setSummarySaving(false); }
  };

  const handlePrintSummary = (p) => { if(!p?.uhid) return; const admNo=resolveAdmNo(p); window.open(`${BASE_URL}/patients/${p.uhid}/admissions/${admNo}/dynamic-summary/print/`,"_blank"); };

  // ── REPORTS (card-based, billing-dashboard style) ─────────────────────────
  const fetchPatientReports = async (p) => {
    const uhid  = p.uhid;
    const admNo = String(resolveAdmNo(p));
    setRepLoading(prev=>({...prev,[uhid]:true}));
    try {
      const token = sessionStorage.getItem("hms_token") || "";
      const repMap = {};

      // 1. Fetch already saved reports
      try {
        const savedRes = await fetch(BASE_URL + "/patients/" + uhid + "/admissions/" + admNo + "/lab-reports/", {
          headers: { Authorization: "Bearer " + token }
        });
        if (savedRes.ok) {
          const fetched = await savedRes.json();
          (Array.isArray(fetched) ? fetched : fetched.reports || []).forEach(rep => {
            const name = rep.report_name || rep.reportName || rep.name || "Report";
            repMap[name] = {
              id:          rep.id || Date.now(),
              reportName:  name,
              report_date: rep.report_date || rep.date || new Date().toISOString().slice(0,10),
              reportType:  rep.report_type || rep.reportType || "Haematology",
              orderedBy:   rep.ordered_by || rep.orderedBy || "",
              remarks:     rep.remarks || "",
              findings:    rep.findings || "",
              impression:  rep.impression || "",
              tests: (rep.table_data || rep.tests || []).map(t => ({
                id:       Date.now() + Math.random(),
                name:     t.test || t.name || "",
                value:    t.result || t.value || "",
                unit:     t.unit || "",
                refRange: t.ref || t.refRange || "",
                status:   t.status || "Normal"
              })),
              saved: true,
            };
          });
        }
      } catch(e) { console.warn("Could not fetch saved reports:", e); }

      // 2. Fetch suggested templates from medical history/diagnosis
      try {
        const tplRes = await fetch(BASE_URL + "/patients/" + uhid + "/admissions/" + admNo + "/lab-report-templates/", {
          headers: { Authorization: "Bearer " + token }
        });
        if (tplRes.ok) {
          const tplData = await tplRes.json();
          const suggested = Array.isArray(tplData) ? tplData : tplData.suggested_reports || tplData.templates || tplData.suggested || [];
          suggested.forEach(tpl => {
            const tplName = tpl.reportName || tpl.name || tpl.report_name || tpl;
            if (repMap[tplName]) return;
            repMap[tplName] = {
              id:          tpl.id || Date.now() + Math.random(),
              reportName:  tplName,
              report_date: tpl.date || new Date().toISOString().slice(0,10),
              reportType:  tpl.reportType || tpl.report_type || "Haematology",
              orderedBy:   tpl.orderedBy || tpl.ordered_by || "",
              remarks:     tpl.remarks || "",
              findings:    tpl.findings || "",
              impression:  tpl.impression || "",
              tests: (tpl.tests || []).map(t => ({
                id:       Date.now() + Math.random(),
                name:     t.name || "",
                value:    t.value || "",
                unit:     t.unit || "",
                refRange: t.refRange || t.ref || "",
                status:   t.status || "Normal"
              })),
              saved: false,
            };
          });
        }
      } catch(e) { console.warn("Could not fetch templates:", e); }

      setPatientReports(prev=>({...prev,[uhid]:repMap}));
    } catch(e) {
      console.error("fetchPatientReports error:", e);
      setPatientReports(prev=>({...prev,[uhid]:prev[uhid]||{}}));
    }
    setRepLoading(prev=>({...prev,[uhid]:false}));
  };

  const toggleRepPatient = (p) => {
    if (expandedRepPatient===p.uhid) { setExpandedRepPatient(null); return; }
    setExpandedRepPatient(p.uhid);
    if (!patientReports[p.uhid]) fetchPatientReports(p);
  };

  const addTemplateReport = (p, templateName) => {
    const uhid = p.uhid;
    const template = LAB_TEMPLATES[templateName];
    if (!template) return;
    setPatientReports(prev => {
      const existing = prev[uhid]||{};
      if (existing[templateName]) return prev;
      const tests = template.tests.map(t=>({ id:Date.now()+Math.random(), name:t.name||"", value:"", unit:t.unit||"", refRange:t.refRange||"", status:"Normal" }));
      return { ...prev, [uhid]:{ ...existing, [templateName]:{ id:Date.now(), reportName:templateName, report_date:new Date().toISOString().slice(0,10), reportType:"Haematology", orderedBy:"", amount:0, remarks:template.defaultRemarks||"", findings:"", impression:"", tests, saved:false } } };
    });
  };

  const updRepField = (uhid, reportName, field, val) => {
    setPatientReports(prev => { const rm={...prev[uhid]}; rm[reportName]={...rm[reportName],[field]:val,saved:false}; return{...prev,[uhid]:rm}; });
  };
  const updRepTest = (uhid, reportName, ti, field, val) => {
    setPatientReports(prev => { const rm={...prev[uhid]}; const rep={...rm[reportName]}; const tests=[...(rep.tests||[])]; tests[ti]={...tests[ti],[field]:val}; rep.tests=tests; rep.saved=false; rm[reportName]=rep; return{...prev,[uhid]:rm}; });
  };
  const addRepTest = (uhid, reportName) => {
    setPatientReports(prev => { const rm={...prev[uhid]}; const rep={...rm[reportName]}; rep.tests=[...(rep.tests||[]),{id:Date.now(),name:"",value:"",unit:"",refRange:"",status:"Normal"}]; rep.saved=false; rm[reportName]=rep; return{...prev,[uhid]:rm}; });
  };
  const delRepTest = (uhid, reportName, ti) => {
    setPatientReports(prev => { const rm={...prev[uhid]}; const rep={...rm[reportName]}; rep.tests=(rep.tests||[]).filter((_,i)=>i!==ti); rep.saved=false; rm[reportName]=rep; return{...prev,[uhid]:rm}; });
  };
  const delRepReport = (uhid, reportName) => {
    setPatientReports(prev => { const rm={...(prev[uhid]||{})}; delete rm[reportName]; return{...prev,[uhid]:rm}; });
  };

  const saveRepReport = async (p, reportName) => {
    const uhid  = p.uhid;
    const admNo = String(resolveAdmNo(p));
    const rep   = patientReports[uhid]?.[reportName];
    if (!rep) return;
    const key = `${uhid}-${reportName}`;
    setRepSaving(prev=>({...prev,[key]:true}));
    try {
      const token = sessionStorage.getItem("hms_token") || "";
      const res = await fetch(BASE_URL + "/patients/" + uhid + "/admissions/" + admNo + "/lab-reports/bulk-save/", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ reports: [{
          report_name: reportName,
          report_type: rep.reportType || "Haematology",
          report_date: rep.report_date || new Date().toISOString().slice(0,10),
          findings: rep.findings || "",
          impression: rep.impression || "",
          remarks: rep.remarks || "",
          table_data: (rep.tests||[]).map(t => ({ test: t.name, result: t.value||"", unit: t.unit||"", ref: t.refRange||"", status: t.status||"Normal" }))
        }]})
      });
      if (!res.ok) throw new Error("Save failed");
      setPatientReports(prev=>({...prev,[uhid]:{...prev[uhid],[reportName]:{...prev[uhid][reportName],saved:true}}}));
      toast(`${reportName} saved`);
    } catch(e) { toast(`Failed to save ${reportName}`,"err"); }
    setRepSaving(prev=>({...prev,[key]:false}));
  };

  const printRepReport = (p, reportName) => {
    const uhid  = p.uhid;
    const admNo = String(resolveAdmNo(p));
    window.open(`${BASE_URL}/patients/${uhid}/admissions/${admNo}/lab-reports/print/?report=${encodeURIComponent(reportName)}`,"_blank");
  };

  // ── VIEW/DELETE MODALS ────────────────────────────────────────────────────
  const openViewModal  = (p) => { setViewPt(p); setShowViewModal(true); };
  const confirmDelete  = (p) => { setDeletePt(p); setShowDeleteConfirm(true); };
  const doDeleteSummary = () => {
    const branchKey=deletePt?._branch||viewBranch;
    updatePatient(branchKey,deletePt.uhid,p=>({...p,dischargeSummary:{type:"NORMAL",diagnosis:"",treatment:"",followUp:"",notes:"",doctorName:"",date:"",expectedDod:""}}));
    toast("Summary cleared"); setShowDeleteConfirm(false); setDeletePt(null);
  };

  const getPreferredAdmission = (p) => p.admissions?.[0]||{};
  const getPreferredReports   = (p) => p.reports?.length?p.reports:(getPreferredAdmission(p).labReports||[]);
  const getPreferredDischarge = (p) => ({...(getPreferredAdmission(p).discharge||{}),...(p.dischargeSummary||{})});

  // eslint-disable-next-line no-unused-vars
  const openReportEditor = (p) => {
    const next=JSON.parse(JSON.stringify(p));
    next.reports=getPreferredReports(p);
    setEditRepPt(next); setNewReport({name:"",date:"",result:""}); setShowReportModal(true);
  };
  const delReport = (idx) => setEditRepPt(prev=>({...prev,reports:(prev.reports||[]).filter((_,i)=>i!==idx)}));
  const saveReports = async () => {
    if (!editRepPt) return;
    try {
      const cleanAdm=String(editRepPt.admissions?.[0]?.admNo||1).replace(/\D/g,"");
      for(const rep of (editRepPt.reports||[])){
        await apiService.saveLabReport(editRepPt.uhid,cleanAdm,{reportName:rep.reportName||rep.name,reportType:rep.reportType||"Pathology",date:rep.date,remarks:rep.remarks||"",tests:rep.tests||[]});
      }
      updatePatient(viewBranch,editRepPt.uhid,p=>({...p,reports:editRepPt.reports}));
      toast("Reports synced!"); setShowReportModal(false); setEditRepPt(null);
    } catch(e){ toast("Failed to sync reports.","err"); }
  };

  // ── BILLING HELPERS ───────────────────────────────────────────────────────
  const getBillKey     = (uhid,admNo) => `${uhid}-${admNo}`;
  const initBillData   = (p,adm) => {
    const key=getBillKey(p.uhid,adm.admNo);
    if(billData[key]) return billData[key];
    const d=adm.discharge||{};
    return { patientName:p.patientName||p.name||"", guardianName:p.guardianName||"", uhid:p.uhid||"", ageYY:p.ageYY||p.age||"", gender:p.gender||"", address:p.address||"", phone:p.phone||"", cardNo:p.cardNo||adm.billing?.cardNo||"", admNo:adm.admNo||"", admType:adm.admType||"General", billDate:new Date().toISOString().slice(0,10), doa:d.doa||adm.dateTime?.slice(0,10)||"", dod:d.dod||"", wardName:d.wardName||"", bedNo:d.bedNo||"", doctorName:d.doctorName||"", panel:adm.billing?.panel||"CASH", paymentMode:adm.billing?.paymentMode||"Cash", claimId:adm.billing?.claimId||"", advance:parseFloat(adm.billing?.advance)||0, discount:parseFloat(adm.billing?.discount)||0, status:p.dischargeSummary?.type||"", contactNo:p.phone||"" };
  };
  const setBillField   = (uhid,admNo,field,val) => { const key=getBillKey(uhid,admNo); setBillData(prev=>({...prev,[key]:{...(prev[key]||{}),[field]:val}})); };
  const getServices    = (uhid,admNo) => { const key=getBillKey(uhid,admNo); return billServices[key]||[]; };
  const initServices   = (p,adm) => {
    const key=getBillKey(p.uhid,adm.admNo);
    if(billServices[key]) return;
    const medServices=(p.medicines||[]).map((m,i)=>({id:Date.now()+i,date:new Date().toISOString().slice(0,10),cghs:"",desc:m.name,qty:m.qty||1,rate:m.rate||0}));
    setBillServices(prev=>({...prev,[key]:medServices}));
  };
  const fetchBillServices = async (p,adm) => {
    const key=getBillKey(p.uhid,adm.admNo);
    if(billServices[key]) return;
    // Services are already in the admission data from the db prop
    const admServices = adm.services || [];
    if (admServices.length) {
      const services = admServices.map((s,i) => ({
        id:   s.id || Date.now()+i,
        date: s.svcDate || new Date().toISOString().slice(0,10),
        cghs: s.svcCode || s.code || "",
        desc: s.svcName || s.title || s.name || "",
        qty:  parseFloat(s.svcQty || s.qty) || 1,
        rate: parseFloat(s.svcRate || s.rate) || 0,
      }));
      setBillServices(prev=>({...prev,[key]:services}));
      // Also prefill billing info from adm.billing
      const billing = adm.billing || {};
      setBillData(prev=>({...prev,[key]:{
        ...initBillData(p,adm),
        discount: parseFloat(billing.discount||0),
        advance:  parseFloat(billing.advance||0),
        panel:    billing.panel||"CASH",
        paymentMode: billing.paymentMode||"Cash",
        claimId:  billing.claimId||"",
        cardNo:   billing.cardNo||"",
      }}));
    } else {
      initServices(p,adm);
    }
  };
  const addService     = (uhid,admNo) => { if(!newSvcRow.desc) return; const key=getBillKey(uhid,admNo); setBillServices(prev=>({...prev,[key]:[...(prev[key]||[]),{id:Date.now(),...newSvcRow}]})); setNewSvcRow({date:"",cghs:"",desc:"",qty:1,rate:0}); };
  const updateService  = (uhid,admNo,idx,field,val) => { const key=getBillKey(uhid,admNo); setBillServices(prev=>{ const list=[...(prev[key]||[])]; list[idx]={...list[idx],[field]:field==="qty"||field==="rate"?parseFloat(val)||0:val}; return{...prev,[key]:list}; }); };
  const removeService  = (uhid,admNo,idx) => { const key=getBillKey(uhid,admNo); setBillServices(prev=>({...prev,[key]:(prev[key]||[]).filter((_,i)=>i!==idx)})); };
  const calcBillTotals = (uhid,admNo,bd) => { const services=getServices(uhid,admNo); const gross=services.reduce((s,svc)=>s+(parseFloat(svc.qty)||0)*(parseFloat(svc.rate)||0),0); const disc=parseFloat(bd?.discount)||0; const adv=parseFloat(bd?.advance)||0; return{gross,disc,adv,net:gross-disc-adv}; };
  const printBill      = async (uhid,admNo) => {
    try {
      const response=await fetch(`${BASE_URL}/patients/${uhid}/admissions/${admNo}/bill/print/`,{method:"GET"});
      if(!response.ok) throw new Error("Failed");
      const blob=await response.blob();
      window.open(window.URL.createObjectURL(blob),"_blank");
    } catch { toast("Unable to print bill","err"); }
  };

  // ── TASK HELPERS ──────────────────────────────────────────────────────────
  const openNewTask  = ()=>{ setEditTask(null);setTaskForm({title:"",description:"",assignedToId:"",department:"HOD",priority:"Medium",status:"Pending",dueDate:"",patientUhids:[],patientNames:[]});setTaskPatientSearch("");setShowTaskModal(true); };
  const openEditTask = (t)=>{ setEditTask(t);setTaskForm({title:t.title,description:t.description||"",assignedToId:t.assignedToId?String(t.assignedToId):"",department:t.department,priority:t.priority,status:t.status,dueDate:t.dueDate||"",patientUhids:t.patientUhids||(t.patientUhid?[t.patientUhid]:[]),patientNames:t.patientNames||(t.patientName?[t.patientName]:[])});setTaskPatientSearch("");setShowTaskModal(true); };
  const toggleTaskPatient=(p)=>{ const isSel=taskForm.patientUhids.includes(p.uhid); if(isSel){setTaskForm(f=>({...f,patientUhids:f.patientUhids.filter(u=>u!==p.uhid),patientNames:f.patientNames.filter((_,i)=>f.patientUhids[i]!==p.uhid)}));}else if(taskForm.patientUhids.length<8){setTaskForm(f=>({...f,patientUhids:[...f.patientUhids,p.uhid],patientNames:[...f.patientNames,p.name]}));}else{toast("Maximum 8 patients allowed","err");} };
  const saveTask = async ()=>{
    if(!taskForm.title||!taskForm.assignedToId){toast("Title and Assigned To are required","err");return;}
    const assignedEmployee=taskAssignableEmployees.find(e=>String(e.id)===String(taskForm.assignedToId));
    if(!assignedEmployee){toast("Select a valid employee","err");return;}
    const linkedPatientIds=taskForm.patientUhids.map(uhid=>allPatientsForTask.find(p=>p.uhid===uhid)?.id).filter(Boolean);
    const payload={title:taskForm.title,description:taskForm.description,assigned_to:Number(taskForm.assignedToId),department:taskForm.department,priority:taskForm.priority,status:taskForm.status,due_date:taskForm.dueDate?`${taskForm.dueDate}T23:59:00Z`:null,patient:linkedPatientIds[0]||null};
    try{
      if(editTask){const u=await apiService.updateTask(editTask.id,payload);setTasks(prev=>prev.map(t=>t.id===editTask.id?mapTaskFromApi(u):t));toast("Task updated");}
      else{
        if(linkedPatientIds.length>1){await apiService.bulkAssignTasks({department:taskForm.department,assign_to:Number(taskForm.assignedToId),patient_ids:linkedPatientIds,title:taskForm.title,priority:taskForm.priority,due_date:taskForm.dueDate?`${taskForm.dueDate}T23:59:00Z`:null,notes:taskForm.description||""});const r=await apiService.getTasks();setTasks((r||[]).map(mapTaskFromApi));toast(`Assigned ${linkedPatientIds.length} patients`);}
        else{await apiService.createTask(payload);await loadTasks();toast("Task assigned");}
      }
      setShowTaskModal(false);setEditTask(null);
    }catch(e){const ae=e.response?.data||{};toast(ae?.patient?.[0]||ae?.assigned_to?.[0]||ae?.detail||"Failed to save task","err");}
  };
  const deleteTask     = async(id)=>{try{await apiService.deleteTask(id);setTasks(prev=>prev.filter(t=>t.id!==id));toast("Task deleted");}catch{toast("Failed to delete task","err");}};
  const updateTaskStatus=async(id,status)=>{try{const u=await apiService.updateTask(id,{status});setTasks(prev=>prev.map(t=>t.id===id?mapTaskFromApi(u):t));toast(`Task marked ${status}`);}catch{toast("Failed to update task","err");}};

  const filteredTaskReport=useMemo(()=>{
    const now=new Date();
    return tasks.filter(t=>{
      const created=new Date(t.createdAt);
      if(taskReportFilter.period==="today"&&created.toDateString()!==now.toDateString()) return false;
      if(taskReportFilter.period==="week"){const w=new Date(now);w.setDate(w.getDate()-7);if(created<w) return false;}
      if(taskReportFilter.period==="month"&&(created.getMonth()!==now.getMonth()||created.getFullYear()!==now.getFullYear())) return false;
      if(taskReportFilter.dept!=="All"&&t.department!==taskReportFilter.dept) return false;
      if(taskReportFilter.status!=="All"&&t.status!==taskReportFilter.status) return false;
      if(taskReportFilter.empName&&!t.assignedTo.toLowerCase().includes(taskReportFilter.empName.toLowerCase())) return false;
      return true;
    });
  },[tasks,taskReportFilter]);

  const saveDepartment=()=>{ if(!deptForm.name){toast("Department name required","err");return;} setDepartments(prev=>[...prev,{id:`DEPT-${Date.now()}`,...deptForm,createdAt:new Date().toISOString(),memberCount:0}]);setShowDeptModal(false);setDeptForm({name:"",description:"",head:""});toast("Department created"); };
  const openEditEmployee=(emp)=>{ setEditEmpId(emp.id);setEmpForm({fullName:emp.fullName||emp.name,username:emp.username,empId:emp.empId,dept:emp.dept||"HOD",email:emp.email,phone:emp.phone,role:emp.role,password:"",confirmPassword:""});setEmpPassErr("");setShowEmpModal(true); };
  const saveEmployee=async()=>{
    if(!empForm.fullName||!empForm.username||!empForm.email||!empForm.phone||!empForm.dept){setEmpPassErr("Please fill all required fields");return;}
    if(empForm.password!==empForm.confirmPassword){setEmpPassErr("Passwords do not match");return;}
    if(!editEmpId&&!empForm.password){setEmpPassErr("Password is required for new employees");return;}
    try{
      const[firstName,...lastNameArr]=empForm.fullName.split(" ");
      const mappedRole=empForm.role||DEPARTMENT_ROLE_MAP[empForm.dept]||"receptionist";
      const branchCode=getEmployeeBranchCode();
      const payload={username:empForm.username,email:empForm.email,first_name:firstName,last_name:lastNameArr.join(" ")||"",emp_id:empForm.empId||buildEmployeeId(branchCode),phone_number:empForm.phone,role:mappedRole,branch:branchCode};
      if(empForm.password){payload.password=empForm.password;payload.confirm_password=empForm.confirmPassword;}
      if(editEmpId){await apiService.updateUser(editEmpId,payload);toast("Employee updated!");}
      else{await apiService.createUser(payload);toast("Employee created!");}
      const users=await apiService.getUsers();
      setEmployees(users.map(u=>({id:u.id,empId:u.emp_id||"—",username:u.username,fullName:`${u.first_name} ${u.last_name}`.trim(),email:u.email,phone:u.phone_number,role:u.role,dept:u.role.replaceAll("_"," ").replace(/\b\w/g,ch=>ch.toUpperCase()),status:u.is_active?"Active":"Inactive"})));
      setShowEmpModal(false);setEditEmpId(null);setEmpForm({fullName:"",username:"",empId:"",dept:"HOD",email:"",phone:"",role:"hod",password:"",confirmPassword:""});
    }catch(e){const ae=e.response?.data||{};setEmpPassErr(ae.detail||ae.error||ae.username?.[0]||ae.emp_id?.[0]||"Failed to save user.");}
  };
  const handleToggleActive=async(emp,index)=>{ const isActive=emp.status!=="Inactive";const newLabel=isActive?"Inactive":"Active";try{await apiService.updateUser(emp.id,{is_active:!isActive});setEmployees(prev=>prev.map((e,ei)=>ei===index?{...e,status:newLabel}:e));toast(`Employee ${newLabel==="Active"?"activated":"deactivated"}`);}catch{toast("Failed to update employee status.","err");} };
  const saveMyProfile=async()=>{
    try{
      const payload={first_name:profileForm.first_name,last_name:profileForm.last_name,email:profileForm.email,phone_number:profileForm.phone_number,emp_id:profileForm.emp_id};
      const updated=await apiService.updateMyProfile(payload);
      setProfileForm({first_name:updated.first_name||"",last_name:updated.last_name||"",email:updated.email||"",phone_number:updated.phone_number||"",emp_id:updated.emp_id||""});
      toast("Profile updated");
    }catch(e){const ae=e.response?.data||{};toast(ae.email?.[0]||ae.detail||"Failed to update profile","err");}
  };

  // ── RENDER HELPERS ────────────────────────────────────────────────────────
  const Badge        = ({col,children})=>(<span className="hms-badge" style={{background:`${col}20`,color:col,borderColor:`${col}40`}}>{children}</span>);
  const Pill         = ({col,bg,children,small})=>(<span className={small?"hms-pill-sm":"hms-pill"} style={{background:bg||`${col}20`,color:col,borderColor:`${col}40`}}>{children}</span>);
  const SummaryPill  = ({type,p})=>{ const cached=p?.uhid?summaryTypeCache[p.uhid]:null; const raw=cached||type||(p?.admissions?.[0]?.discharge?.dischargeStatus)||"NORMAL"; const key=normalizeSummaryType(raw); const m=SUMMARY_META[key]||{color:"#6b7280",bg:"#6b728018"}; return <Pill col={m.color} bg={m.bg}><span className="hms-pill-dot" style={{background:m.color}}/>{SUMMARY_LABELS[key]||"Normal"}</Pill>; };
  const StatusPill   = ({s})=>{ const m=TASK_STATUS_META[s]||{color:"#6b7280",bg:"#6b728018"}; return <Pill col={m.color} bg={m.bg}>{s}</Pill>; };
  const PriorityPill = ({p})=>{ const m=TASK_PRIORITY_META[p]||{color:"#6b7280",bg:"#6b728018"}; return <Pill small col={m.color} bg={m.bg}>{p}</Pill>; };
  const ActionBtn    = ({col,onClick,children})=><button className="hms-action-btn" style={{borderColor:`${col}40`,color:col}} onClick={onClick}>{children}</button>;
  const Th           = ({children})=><th className="hms-th">{children}</th>;
  const Td           = ({children,hi,mono,sm,style:s})=><td className={`hms-td${hi?" hms-td-hi":""}${mono?" hms-td-mono":""}${sm?" hms-td-sm":""}`} style={s}>{children}</td>;
  const ProgressBar  = ({pct,col})=>(<div className="hms-progress-bar"><div className="hms-progress-fill" style={{width:`${pct}%`,background:col}}/></div>);
  const BranchHeader = ({title})=>(<div style={{marginBottom:18}}><div className="hms-pg-label">{title}</div><span className="hms-branch-pill" style={{background:bc.dim,border:`1px solid ${bc.border}`,color:accent}}><span style={{width:7,height:7,borderRadius:"50%",background:accent,display:"inline-block"}}/> {isOfficeAdmin?"All Hospitals":bc.label}</span></div>);
  const PageHeader   = ({title,subtitle})=>(<div style={{marginBottom:20}}><div className="hms-pg-label">{title}</div>{subtitle&&<div className="hms-pg-sub">{subtitle}</div>}</div>);
  const CardRow      = ({title,action})=>(<div className="hms-card-row"><div className="hms-card-title">{title}</div>{action}</div>);
  const TableWrap    = ({heads,children})=>(<div style={{overflowX:"auto"}}><table className="hms-tbl"><thead><tr>{heads.map(h=><Th key={h}>{h}</Th>)}</tr></thead><tbody>{children}</tbody></table></div>);
  const EmptyState   = ({icon,label,sub})=>{ const Icon=icon; const isComp=typeof Icon==="function"||(typeof Icon==="object"&&Icon!==null); return (<div style={{textAlign:"center",padding:"3rem",color:"#64748b"}}>{icon&&<div style={{fontSize:40,marginBottom:12}}>{isComp?<Icon size={36} strokeWidth={1.8}/>:icon}</div>}<div style={{fontSize:14,fontWeight:600,color:"#94a3b8",marginBottom:6}}>{label}</div>{sub&&<div style={{fontSize:12}}>{sub}</div>}</div>); };
  const StatCard     = ({col,icon,label,val,sub,topBorder})=>{ const Icon=icon; const isComp=typeof Icon==="function"||(typeof Icon==="object"&&Icon!==null); return (<div className="hms-stat-card" style={{borderTop:topBorder?`3px solid ${col}`:undefined,border:`1px solid ${col}15`}}>{icon&&<div className="hms-stat-icon">{isComp?<Icon size={18} strokeWidth={2}/>:icon}</div>}{topBorder&&<div style={{fontSize:10,color:col,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",marginBottom:8}}>{label}</div>}<div className="hms-stat-num" style={{fontSize:topBorder?26:22,color:col}}>{val}</div>{topBorder?<div className="hms-stat-label">{sub}</div>:<div className="hms-stat-label">{label}</div>}</div>); };

  // ── PAGE: HOME ────────────────────────────────────────────────────────────
  const renderHome = () => {
    const pendingTasks=tasks.filter(t=>t.status==="Pending").length;
    const urgentTasks =tasks.filter(t=>t.priority==="Urgent"&&t.status!=="Completed").length;
    const stats = [
      {label:"Branch Patients",val:locationPatients.length,col:accent,icon:Users,sub:"All records",topBorder:true},
      {label:"Total Admissions",val:allAdmissions.length,col:"#22d3ee",icon:ClipboardList,sub:"All time",topBorder:true},
      {label:"Currently Admitted",val:currentlyAdmitted,col:"#34d399",icon:Hospital,sub:"Active",topBorder:true},
      {label:"Discharged",val:discharged,col:"#8b949e",icon:DoorOpen,sub:"Completed",topBorder:true},
      {label:"Total Tasks",val:tasks.length,col:"#818cf8",icon:CheckSquare,sub:"All tasks",topBorder:true},
      {label:"Pending Tasks",val:pendingTasks,col:"#f59e0b",icon:Clock3,sub:"Awaiting action",topBorder:true},
      {label:"Urgent Tasks",val:urgentTasks,col:"#f87171",icon:AlertTriangle,sub:"Need attention",topBorder:true},
      {label:"Departments",val:departments.length,col:"#34d399",icon:Building2,sub:"Active depts",topBorder:true},
    ];
    return (
      <div>
        <BranchHeader title="Home"/>
        <div className="hms-prof-card" style={{display:"flex",alignItems:"flex-start",gap:18,border:`1px solid ${accent}30`}}>
          <div className="hms-big-avatar">{initials(currentUser?.name||"")}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:16,fontWeight:700,marginBottom:3}}>{currentUser?.name||""}</div>
            <div style={{fontSize:11,color:accent,fontWeight:600,marginBottom:2}}>{currentUser?.dept||currentUser?.role?.toUpperCase()}</div>
            <div style={{fontSize:10,color:"#64748b"}}>{bc.label} Branch</div>
            <div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}>
              {currentUser?.dept&&<Badge col={accent}>{currentUser.dept}</Badge>}
              <Badge col={currentUser?.status==="Inactive"?"#f87171":"#34d399"}>{currentUser?.status||"Active"}</Badge>
            </div>
          </div>
        </div>
        <div className="hms-stat-grid">{stats.map((s,i)=><StatCard key={i} {...s}/>)}</div>
        {tasks.length>0&&(
          <div className="hms-card">
            <CardRow title="Recent Tasks" action={<button className="hms-add-btn" onClick={()=>setActiveTab("tasks")}>View All</button>}/>
            <TableWrap heads={["Task","Assigned To","Dept","Priority","Status","Due","Patients"]}>
              {tasks.slice(0,5).map((t,i)=>(
                <tr key={i}><Td hi>{t.title}</Td><Td>{t.assignedTo}</Td><Td><Badge col={accent}>{t.department}</Badge></Td><Td><PriorityPill p={t.priority}/></Td><Td><StatusPill s={t.status}/></Td><Td sm>{fmtDt(t.dueDate)}</Td><Td sm>{(t.patientNames||[]).length>0?<span style={{color:"#38bdf8"}}>{t.patientNames.join(", ")}</span>:"—"}</Td></tr>
              ))}
            </TableWrap>
          </div>
        )}
        <div className="hms-card">
          <CardRow title={`Recent Patients — ${bc.label}`} action={<button className="hms-add-btn" onClick={()=>setActiveTab("patients")}>View All</button>}/>
          {locationPatients.length===0?<div className="hms-empty">No patients yet.</div>:(
            <TableWrap heads={["Patient","UHID","Ward","Doctor","Summary","Status","Admit Date"]}>
              {locationPatients.slice(0,5).map((p,i)=>{ const last=p.admissions?.[p.admissions.length-1]; const d=last?.discharge||{}; const status=d.dod?"Discharged":"Admitted"; return (
                <tr key={i}><Td><span className="hms-td-hi">{p.patientName||p.name}</span><div className="hms-td-mono" style={{marginTop:2}}>{p.gender}·{p.ageYY||p.age}y</div></Td><Td mono>{p.uhid}</Td><Td>{d.wardName||"—"}</Td><Td sm>{d.doctorName||"—"}</Td><Td><span style={{cursor:"pointer"}} onClick={()=>openSummaryEditor(p)}><SummaryPill type={p.dischargeSummary?.type} p={p}/></span></Td><Td><Badge col={status==="Admitted"?"#34d399":"#8b949e"}>{status}</Badge></Td><Td sm>{fmtDt(last?.dateTime)}</Td></tr>
              ); })}
            </TableWrap>
          )}
        </div>
      </div>
    );
  };

  // ── PAGE: PATIENTS ────────────────────────────────────────────────────────
  const renderPatients = () => (
    <div>
      <BranchHeader title="Patients"/>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:16}}>
        {[{label:"Total",val:allAdmissions.length,col:accent},{label:"Admitted",val:currentlyAdmitted,col:"#34d399"},{label:"Discharged",val:discharged,col:"#8b949e"}].map((s,i)=>(
          <div key={i} className="hms-stat-card" style={{padding:"10px 14px",border:`1px solid ${s.col}18`}}><div className="hms-stat-num" style={{fontSize:16,color:s.col}}>{s.val}</div><div className="hms-stat-label">{s.label}</div></div>
        ))}
      </div>
      <div className="hms-card">
        {locationPatients.length===0?<div className="hms-empty">No patients for {bc.label}.</div>:(
          <TableWrap heads={["Patient/UHID","Contact","Ward/Bed","Doctor","Summary","DOA","DOD","Status","Actions"]}>
            {locationPatients.flatMap((p,pi)=>(p.admissions||[]).map((adm,ai)=>{
              const d=adm.discharge||{}; const status=d.dod?"Discharged":"Admitted";
              return (
                <tr key={`${pi}-${ai}`}>
                  <Td><span className="hms-td-hi">{p.patientName||p.name}</span><div className="hms-td-mono">{p.uhid}</div></Td>
                  <Td sm><div>{p.phone}</div><div style={{color:"#64748b",fontSize:9}}>{p.email}</div></Td>
                  <Td>{d.wardName||"—"}<div className="hms-td-mono">{d.bedNo}</div></Td>
                  <Td sm>{d.doctorName||"—"}</Td>
                  <Td><span style={{cursor:"pointer"}} onClick={()=>openSummaryEditor(p)}><SummaryPill type={p.dischargeSummary?.type} p={p}/></span></Td>
                  <Td sm>{fmtDt(d.doa)}</Td><Td sm>{fmtDt(d.dod)}</Td>
                  <Td><Badge col={status==="Admitted"?"#34d399":"#8b949e"}>{status}</Badge></Td>
                  <Td>
                    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                      <ActionBtn col="#34d399" onClick={()=>openMedEditor(p)}>Meds</ActionBtn>
                      <ActionBtn col="#38bdf8" onClick={()=>{setActiveTab("reports");setTimeout(()=>toggleRepPatient(p),100);}}>Reports</ActionBtn>
                      <ActionBtn col="#f59e0b" onClick={()=>handlePrintSummary(p)}>↓ PDF</ActionBtn>
                    </div>
                  </Td>
                </tr>
              );
            }))}
          </TableWrap>
        )}
      </div>
    </div>
  );

  // ── PAGE: DISCHARGE ───────────────────────────────────────────────────────
  const renderDischarge = () => {
    const summaryStats=SUMMARY_TYPES.reduce((acc,t)=>{acc[t]=locationPatients.filter(p=>normalizeSummaryType(getPreferredDischarge(p)?.type)===t).length;return acc;},{});
    const unset=locationPatients.filter(p=>!getPreferredDischarge(p)?.diagnosis).length;
    const filtered=dischSumFilter==="All"?locationPatients:locationPatients.filter(p=>normalizeSummaryType(getPreferredDischarge(p)?.type)===dischSumFilter);
    return (
      <div>
        <BranchHeader title="Discharge Summaries"/>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:16}}>
          {[{label:"Total",val:locationPatients.length,col:accent},...SUMMARY_TYPES.map(t=>({label:SUMMARY_LABELS[t]||t,val:summaryStats[t]||0,col:SUMMARY_META[t].color})),{label:"Pending",val:unset,col:"#64748b"}].map((s,i)=>(
            <div key={i} className="hms-stat-card" style={{padding:"10px 14px",minWidth:90,border:`1px solid ${s.col}15`}}><div className="hms-stat-num" style={{fontSize:18,color:s.col}}>{s.val}</div><div className="hms-stat-label">{s.label}</div></div>
          ))}
        </div>
        <div style={{marginBottom:14}}>
          <select className="hms-branch-select" style={{width:"auto",padding:"7px 28px 7px 12px"}} value={dischSumFilter} onChange={e=>setDischSumFilter(e.target.value)}>
            <option value="All">All Types</option>{SUMMARY_TYPES.map(t=><option key={t} value={t}>{SUMMARY_LABELS[t]||t}</option>)}
          </select>
        </div>
        <div className="hms-card">
          <CardRow title={`${filtered.length} Record${filtered.length!==1?"s":""} — ${bc.label}`}/>
          {filtered.length===0?<div className="hms-empty">No summaries match.</div>:(
            <TableWrap heads={["Patient","UHID","Type","Diagnosis","Doctor","Discharge Date","Actions"]}>
              {filtered.map((p,i)=>{
                const ds=getPreferredDischarge(p); const adm=getPreferredAdmission(p); const d=adm.discharge||{};
                return (
                  <tr key={i}>
                    <Td><span className="hms-td-hi">{p.patientName||p.name}</span><div className="hms-td-mono">{p.gender}·{p.ageYY||p.age}y</div></Td>
                    <Td mono>{p.uhid}</Td><Td><SummaryPill type={ds.type} p={p}/></Td>
                    <Td>{ds.diagnosis?<span>{ds.diagnosis}</span>:<span style={{color:"#64748b",fontStyle:"italic",fontSize:10}}>Not set</span>}</Td>
                    <Td sm>{ds.doctorName||d.doctorName||"—"}</Td><Td sm>{fmtDt(ds.date||d.dod)}</Td>
                    <Td>
                      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                        <ActionBtn col="#34d399" onClick={()=>openViewModal(p)}>View</ActionBtn>
                        <ActionBtn col={accent} onClick={()=>openSummaryEditor(p)}>✎ Edit</ActionBtn>
                        <ActionBtn col="#f59e0b" onClick={()=>handlePrintSummary(p)}>↓ Print</ActionBtn>
                        <ActionBtn col="#f87171" onClick={()=>confirmDelete(p)}>✕</ActionBtn>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </TableWrap>
          )}
        </div>
      </div>
    );
  };

  // ── PAGE: MEDICINES ───────────────────────────────────────────────────────
  const renderMedicines = () => {
    const filtered = locationPatients.filter(p => !medSearch||((p.patientName||p.name||"").toLowerCase().includes(medSearch.toLowerCase())||(p.uhid||"").toLowerCase().includes(medSearch.toLowerCase())));
    return (
      <div>
        <BranchHeader title="Medicines"/>
        <div style={{marginBottom:14}}><input className="hms-inp" placeholder="Search patient…" style={{maxWidth:320}} value={medSearch} onChange={e=>setMedSearch(e.target.value)}/></div>
        {!locationPatients.length&&<div className="hms-card hms-empty">No patients for {bc.label}.</div>}
        {filtered.map(p=>{
          const branchKey=p._branch||viewBranch;
          const medTotal=(p.medicines||[]).reduce((s,m)=>s+((m.qty||0)*(m.rate||0)),0);
          const mhRaw=(p.admissions?.[0]?.medicalHistory||p.medicalHistory||{}).currentMedications||"";
          const mhMeds=mhRaw?mhRaw.split(/[,;|\n]+/).map(s=>s.trim()).filter(Boolean):[];
          return (
            <div key={p.uhid} className="hms-card">
              <CardRow
                title={<><span className="hms-td-hi">{p.patientName||p.name}</span><span className="hms-td-mono" style={{marginLeft:8}}>{p.uhid}</span><span style={{color:"#f59e0b",marginLeft:8,fontWeight:700}}>· {fmt(medTotal)}</span></>}
                action={<div style={{display:"flex",gap:8}}><ActionBtn col={accent} onClick={()=>updatePatient(branchKey,p.uhid,pt=>({...pt,medicines:[...(pt.medicines||[]),{id:Date.now(),name:"",qty:1,rate:0}]}))}>+ Add Row</ActionBtn><button className="hms-add-btn" onClick={()=>openMedEditor(p)}>Open Drawer</button></div>}
              />
              {mhMeds.length>0&&(
                <div style={{marginBottom:12,padding:"10px 14px",background:isDark?"rgba(56,189,248,0.06)":"rgba(56,189,248,0.08)",borderRadius:8,border:"1px solid rgba(56,189,248,0.2)"}}>
                  <div style={{fontSize:10,fontWeight:700,color:"#38bdf8",marginBottom:8,textTransform:"uppercase",letterSpacing:".06em"}}>📋 Medical History — Current Medications</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {mhMeds.map((med,mi)=>{ const already=(p.medicines||[]).some(m=>(m.name||"").toLowerCase()===med.toLowerCase()); return (<span key={mi} className="hms-mh-pill" style={{opacity:already?0.45:1,cursor:already?"default":"pointer"}} onClick={()=>{ if(!already) addMedFromHistoryPill(branchKey,p,med); }}>{already?"✓ ":"+ "}{med}</span>); })}
                  </div>
                </div>
              )}
              <div style={{marginBottom:14, position:"relative", zIndex:100}}>
                <MedSearchDropdown medicineMaster={medicineMaster} existingMedicines={p.medicines||[]} onSelect={(med)=>addMedToPatientInline(branchKey,p,med)} isDark={isDark} accent={accent} placeholder="Search & add medicine…"/>
              </div>
              {!(p.medicines||[]).length?<div className="hms-empty">No medicines.</div>:(
                <div style={{overflowX:"auto"}}>
                  <table className="hms-tbl"><thead><tr><Th>Medicine Name</Th><Th>Qty</Th><Th>Rate (₹)</Th><Th>Batch No</Th><Th>Expiry Date</Th><Th>Total</Th><Th>Remove</Th></tr></thead>
                    <tbody>{(p.medicines||[]).map((m,mi)=>(
                      <tr key={m.id||mi}>
                        <td className="hms-td hms-td-hi"><input className="hms-med-inline-input" style={{width:"100%",minWidth:140}} value={m.name||""} placeholder="Medicine name" onChange={e=>updatePatient(branchKey,p.uhid,pt=>{const meds=[...(pt.medicines||[])];meds[mi]={...meds[mi],name:e.target.value};return{...pt,medicines:meds};})}/></td>
                        <td className="hms-td"><input type="number" min={0} className="hms-med-inline-input" style={{width:70,textAlign:"center"}} value={m.qty||0} onChange={e=>updatePatient(branchKey,p.uhid,pt=>{const meds=[...(pt.medicines||[])];meds[mi]={...meds[mi],qty:Math.max(0,parseInt(e.target.value)||0)};return{...pt,medicines:meds};})}/></td>
                        <td className="hms-td"><input type="number" min={0} step="0.01" className="hms-med-inline-input" style={{width:90,textAlign:"right"}} value={m.rate||0} onChange={e=>updatePatient(branchKey,p.uhid,pt=>{const meds=[...(pt.medicines||[])];meds[mi]={...meds[mi],rate:Math.max(0,parseFloat(e.target.value)||0)};return{...pt,medicines:meds};})}/></td>
                        <td className="hms-td"><input className="hms-med-inline-input" style={{width:90,textAlign:"center",fontSize:11}} value={m.batchNo||""} placeholder="Batch No" onChange={e=>updatePatient(branchKey,p.uhid,pt=>{const meds=[...(pt.medicines||[])];meds[mi]={...meds[mi],batchNo:e.target.value};return{...pt,medicines:meds};})}/></td>
                        <td className="hms-td"><input className="hms-med-inline-input" style={{width:100,textAlign:"center",fontSize:11}} value={m.expiryDate||""} placeholder="MM/YYYY" onChange={e=>updatePatient(branchKey,p.uhid,pt=>{const meds=[...(pt.medicines||[])];meds[mi]={...meds[mi],expiryDate:e.target.value};return{...pt,medicines:meds};})}/></td>
                        <td className="hms-td"><span style={{color:"#f59e0b",fontWeight:700}}>{fmt((m.qty||0)*(m.rate||0))}</span></td>
                        <td className="hms-td"><ActionBtn col="#f87171" onClick={()=>updatePatient(branchKey,p.uhid,pt=>({...pt,medicines:(pt.medicines||[]).filter((_,i)=>i!==mi)}))}>✕</ActionBtn></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
              {(p.medicines||[]).length>0&&(<div style={{display:"flex",justifyContent:"flex-end",marginTop:10,paddingTop:10,borderTop:`1px solid ${accent}18`}}><span style={{fontSize:13,fontWeight:800,color:"#f59e0b"}}>Total: {fmt(medTotal)}</span></div>)}
            </div>
          );
        })}
      </div>
    );
  };

  // ── PAGE: MEDICAL HISTORY ───────────────────────────────────────────────────
  const renderMedHistory = () => {
    const handleOpenMedPt = (p) => {
      const adm = p.admissions?.[0] || {};
      setMedHistData(adm.medicalHistory || p.medicalHistory || {});
      setSelectedMedPt(p);
    };

    const handleSaveMed = async () => {
      if (!selectedMedPt) return;
      const admNo = String(resolveAdmNo(selectedMedPt));
      try {
        await apiService.updateMedicalHistory(selectedMedPt.uhid, admNo, medHistData);
        const branchKey = selectedMedPt._branch || viewBranch;
        updatePatient(branchKey, selectedMedPt.uhid, p => ({
          ...p,
          admissions: (p.admissions || []).map((a, i) =>
            i === 0 ? { ...a, medicalHistory: medHistData } : a
          ),
        }));
        toast("Medical history saved");
        setSelectedMedPt(null);
      } catch { toast("Failed to save", "err"); }
    };

    if (selectedMedPt) {
      return (
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
            <button onClick={() => setSelectedMedPt(null)}
              style={{ padding:"7px 16px", borderRadius:8, border:"1px solid #1e2a3a", background:"transparent", color:"#64748b", cursor:"pointer", fontSize:13, fontWeight:600 }}>
              Back to List
            </button>
            <div style={{ fontSize:14, fontWeight:700 }}>{selectedMedPt.patientName || selectedMedPt.name}</div>
            <span className="hms-role-badge">{selectedMedPt.uhid}</span>
            <button
              onClick={() => apiService.printMedicalHistory(selectedMedPt.uhid, String(resolveAdmNo(selectedMedPt)))}
              style={{ marginLeft:"auto", padding:"7px 16px", borderRadius:8, background:`linear-gradient(135deg,${accent},${accent}cc)`, color:"#fff", border:"none", cursor:"pointer", fontSize:12, fontWeight:700, display:"flex", alignItems:"center", gap:6 }}>
              <Printer size={13}/> Print Medical History
            </button>
          </div>
          <MedicalHistoryPage
            data={medHistData}
            setData={setMedHistData}
            onSave={handleSaveMed}
            onSkip={() => setSelectedMedPt(null)}
            patient={selectedMedPt}
            discharge={selectedMedPt.admissions?.[0]?.discharge}
            locId={selectedMedPt._branch || viewBranch}
          />
        </div>
      );
    }

    const withMed = locationPatients.filter(p => {
      const mh = p.admissions?.[0]?.medicalHistory || p.medicalHistory || {};
      return Object.values(mh).some(v => v);
    });

    return (
      <div>
        <BranchHeader title="Medical History" />
        <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:16 }}>
          {[
            { label:"With History",   val:withMed.length,                           col:"#34d399" },
            { label:"Total Patients", val:locationPatients.length,                  col:accent },
            { label:"Pending Fill",   val:locationPatients.length - withMed.length, col:"#f59e0b" },
          ].map((s, i) => (
            <div key={i} className="hms-stat-card" style={{ padding:"10px 14px", border:"1px solid " + s.col + "18" }}>
              <div className="hms-stat-num" style={{ fontSize:18, color:s.col }}>{s.val}</div>
              <div className="hms-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="hms-card">
          <TableWrap heads={["Patient","UHID","Age/Gender","Doctor","Adm Date","Diagnosis","History Status","Action"]}>
            {locationPatients.length === 0
              ? <tr><td colSpan={8}><div className="hms-empty">No patients for {bc.label}.</div></td></tr>
              : locationPatients.map((p, i) => {
                  const adm    = p.admissions?.[0] || {};
                  const mh     = adm.medicalHistory || p.medicalHistory || {};
                  const hasMed = Object.values(mh).some(v => v);
                  return (
                    <tr key={i}>
                      <Td hi>{p.patientName || p.name}</Td>
                      <Td mono>{p.uhid}</Td>
                      <Td sm>{p.ageYY || p.age}y / {p.gender}</Td>
                      <Td sm>{adm.discharge?.doctorName || "—"}</Td>
                      <Td sm>{fmtDt(adm.dateTime)}</Td>
                      <Td>{adm.discharge?.diagnosis || p.dischargeSummary?.diagnosis || "—"}</Td>
                      <Td>
                        <Badge col={hasMed ? "#34d399" : "#f59e0b"}>
                          {hasMed ? "Filled" : "Not Filled"}
                        </Badge>
                      </Td>
                      <Td>
                        <ActionBtn col={accent} onClick={() => handleOpenMedPt(p)}>
                          {hasMed ? "Edit" : "Add"} History
                        </ActionBtn>
                      </Td>
                    </tr>
                  );
                })
            }
          </TableWrap>
        </div>
      </div>
    );
  };

  // ── PAGE: REPORTS (billing-dashboard card style) ──────────────────────────
  const renderReports = () => (
    <div>
      <BranchHeader title="Lab Reports"/>
      <div style={{fontSize:11,color:"#64748b",marginBottom:16}}>Expand a patient → load/add reports → fill results → Save → Print.</div>
      {!locationPatients.length&&<EmptyState icon={FlaskConical} label="No patients" sub="No patients found for this branch"/>}
      {locationPatients.map(p=>{
        const uhid       = p.uhid;
        const isExpanded = expandedRepPatient===uhid;
        const repMap     = patientReports[uhid]||{};
        const repNames   = Object.keys(repMap);
        const isLoading  = repLoading[uhid];
        const admNo      = resolveAdmNo(p);
        const tSearch    = repTemplateSearch[uhid]||"";
        const currentFilter = repFilter[uhid]||"All";
        const visibleReps = repNames.filter(name=>{
          if (currentFilter==="All") return true;
          if (currentFilter==="🧪 Pathology") return !isRadiologyType(repMap[name]?.reportType);
          if (currentFilter==="🩻 Radiology") return  isRadiologyType(repMap[name]?.reportType);
          return true;
        });

        return (
          <div key={uhid} className="rep-patient-card">
            {/* Patient header */}
            <div className="rep-patient-head" onClick={()=>toggleRepPatient(p)}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div className="rep-patient-avatar">{initials(p.patientName||p.name||"")}</div>
                <div>
                  <div className="rep-patient-name">{p.patientName||p.name}</div>
                  <div className="rep-patient-meta">{uhid} · Adm #{admNo} · {p.gender} · {p.ageYY||p.age}y · {p.admissions?.[0]?.discharge?.dod?"Discharged":"Admitted"}</div>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                {repNames.length>0&&<Badge col="#34d399">{repNames.length} report{repNames.length!==1?"s":""}</Badge>}
                {isLoading&&<span style={{fontSize:11,color:"#64748b"}}>Loading…</span>}
                {isExpanded?<ChevronUp size={16} color="#64748b"/>:<ChevronDown size={16} color="#64748b"/>}
              </div>
            </div>

            {isExpanded&&(
              <div style={{padding:16}}>
                {/* Controls */}
                <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",marginBottom:16,padding:"12px 14px",background:isDark?"rgba(59,130,246,0.05)":"rgba(59,130,246,0.04)",border:`1px solid ${accent}20`,borderRadius:8}}>
                  {/* Filter */}
                  {["All","🧪 Pathology","🩻 Radiology"].map(f=>(
                    <button key={f} onClick={()=>setRepFilter(prev=>({...prev,[uhid]:f}))}
                      style={{padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",border:currentFilter===f?`1.5px solid ${accent}`:`1.5px solid ${isDark?"#1e2a3a":"#e2e8f0"}`,background:currentFilter===f?accent:"transparent",color:currentFilter===f?"#fff":isDark?"#94a3b8":"#475569"}}>
                      {f}
                    </button>
                  ))}
                  <div style={{width:1,height:22,background:isDark?"#1e2a3a":"#dde8f5",flexShrink:0}}/>
                  {/* Template search + dropdown */}
                  <input className="hms-inp" placeholder="Filter templates…" value={tSearch} onChange={e=>setRepTemplateSearch(prev=>({...prev,[uhid]:e.target.value}))} style={{maxWidth:160,padding:"5px 10px",fontSize:11}}/>
                  <select className="hms-sel" value="" style={{fontSize:11}} onChange={e=>{if(!e.target.value)return;addTemplateReport(p,e.target.value);e.target.value="";}}>
                    <option value="">+ From Template</option>
                    {Object.keys(LAB_TEMPLATES).filter(n=>!tSearch||n.toLowerCase().includes(tSearch.toLowerCase())).map(n=><option key={n} value={n}>{n}</option>)}
                  </select>
                  {/* Add pathology / radiology blank */}
                  <button onClick={()=>{const r=emptyPathReport();setPatientReports(prev=>({...prev,[uhid]:{...(prev[uhid]||{}),[`Report-${Date.now()}`]:r}}));}} style={{padding:"5px 11px",borderRadius:7,fontSize:11,fontWeight:700,background:"linear-gradient(135deg,#1e3a5f,#0f172a)",color:"#fff",border:"none",cursor:"pointer"}}>🧪 + Pathology</button>
                  <button onClick={()=>{const r=emptyRadReport();setPatientReports(prev=>({...prev,[uhid]:{...(prev[uhid]||{}),[`Radiology-${Date.now()}`]:r}}));}} style={{padding:"5px 11px",borderRadius:7,fontSize:11,fontWeight:700,background:"linear-gradient(135deg,#065f46,#064e3b)",color:"#fff",border:"none",cursor:"pointer"}}>🩻 + Radiology</button>
                  <div style={{width:1,height:22,background:isDark?"#1e2a3a":"#dde8f5",flexShrink:0}}/>
                  {/* Manual custom name */}
                  <ManualReportAdder isDark={isDark} accent={accent} onAdd={(customName)=>{
                    if(repMap[customName]){toast(`"${customName}" already added`,"err");return;}
                    setPatientReports(prev=>({...prev,[uhid]:{...(prev[uhid]||{}),[customName]:{id:Date.now(),reportName:customName,report_date:new Date().toISOString().slice(0,10),reportType:"Haematology",orderedBy:"",amount:0,remarks:"",findings:"",impression:"",tests:[],saved:false}}}));
                    toast(`"${customName}" added`);
                  }}/>
                  {isLoading&&<span style={{fontSize:11,color:"#64748b"}}>Fetching…</span>}
                </div>

                {/* Empty */}
                {visibleReps.length===0&&!isLoading&&(
                  <div style={{textAlign:"center",padding:"28px 16px",color:"#64748b",fontSize:12,border:`1px dashed ${isDark?"#1e2a3a":"#dde8f5"}`,borderRadius:8}}>
                    <FlaskConical size={26} style={{opacity:0.3,marginBottom:8}}/><div style={{fontWeight:600,color:"#94a3b8",marginBottom:4}}>No lab reports yet</div><div>Add a template or enter a custom name above.</div>
                  </div>
                )}

                {/* All reports — card style */}
                {visibleReps.map(reportName=>{
                  const rep    = repMap[reportName]; if(!rep) return null;
                  const repIdx = repNames.indexOf(reportName);
                  const isSavingThis = repSaving[`${uhid}-${reportName}`];
                  const isRad  = isRadiologyType(rep.reportType);

                  if (isRad) {
                    return (
                      <MgtRadiologyReportCard key={reportName} rep={{...rep,reportName,date:rep.report_date||rep.date||""}} ri={repIdx} patientName={p.patientName||p.name} isDark={isDark} accent={accent}
                        updRep={(_ri,field,val)=>updRepField(uhid,reportName,field==="date"?"report_date":field,val)}
                        onRemove={()=>delRepReport(uhid,reportName)}
                        onSave={()=>saveRepReport(p,reportName)}
                        onPrint={()=>printRepReport(p,reportName)}
                        isSaving={isSavingThis}
                      />
                    );
                  }
                  return (
                    <MgtPathologyReportCard key={reportName} rep={{...rep,reportName,date:rep.report_date||rep.date||""}} ri={repIdx} patientName={p.patientName||p.name} isDark={isDark} accent={accent}
                      updRep={(_ri,field,val)=>updRepField(uhid,reportName,field==="date"?"report_date":field,val)}
                      updTest={(_ri,ti,field,val)=>updRepTest(uhid,reportName,ti,field,val)}
                      addTest={()=>addRepTest(uhid,reportName)}
                      delTest={(_ri,ti)=>delRepTest(uhid,reportName,ti)}
                      onRemove={()=>delRepReport(uhid,reportName)}
                      onSave={()=>saveRepReport(p,reportName)}
                      onPrint={()=>printRepReport(p,reportName)}
                      isSaving={isSavingThis}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // ── PAGE: BILLING ─────────────────────────────────────────────────────────
  const renderBilling = () => {
    const branchInfo = "Lakshmi Nagar Branch · Lakshmi Nagar, Mathura, U.P. - 281004 · +91-9717444531";
    return (
      <div className="bill-page-wrap">
        {/* Patient list */}
        <div className="bill-patient-list">
          <div className="bill-patient-list-head"><CreditCard size={12} style={{marginRight:6,verticalAlign:"middle"}}/>Patients ({locationPatients.length})</div>
          {!locationPatients.length&&<div style={{padding:"16px",fontSize:12,color:"#64748b",textAlign:"center"}}>No patients found.</div>}
          {locationPatients.map(p=>{
            const adm=p.admissions?.[0]||{};
            const isActive=selectedBillPatient===p.uhid;
            const status=adm.discharge?.dod?"Discharged":"Admitted";
            return (
              <div key={p.uhid} className={`bill-patient-item${isActive?" active":""}`}
                onClick={()=>{ setSelectedBillPatient(isActive?null:p.uhid); if(!isActive){ const key=getBillKey(p.uhid,adm.admNo); if(!billData[key]) setBillData(prev=>({...prev,[key]:initBillData(p,adm)})); fetchBillServices(p,adm); } }}>
                <div className="bill-patient-name">{p.patientName||p.name}</div>
                <div className="bill-patient-uhid">{p.uhid}</div>
                <div style={{display:"flex",gap:4,marginTop:4,flexWrap:"wrap"}}>
                  <span className="bill-patient-badge" style={{background:status==="Admitted"?"#34d39918":"#6b728018",color:status==="Admitted"?"#34d399":"#6b7280",border:`1px solid ${status==="Admitted"?"#34d39930":"#6b728030"}`}}>{status}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bill detail */}
        <div className="bill-detail-pane">
          {!selectedBillPatient&&(
            <div style={{textAlign:"center",padding:"60px 20px",color:"#64748b"}}>
              <CreditCard size={40} style={{marginBottom:12,opacity:0.3}}/>
              <div style={{fontSize:14,fontWeight:600,color:"#94a3b8",marginBottom:6}}>Select a patient to generate their bill</div>
            </div>
          )}
          {selectedBillPatient&&(()=>{
            const p=locationPatients.find(pt=>pt.uhid===selectedBillPatient);
            if(!p) return null;
            const adm=p.admissions?.[0]||{};
            const key=getBillKey(p.uhid,adm.admNo);
            const bd=billData[key]||initBillData(p,adm);
            const services=getServices(p.uhid,adm.admNo);
            const {gross,net}=calcBillTotals(p.uhid,adm.admNo,bd);
            const setF=(f,v)=>setBillField(p.uhid,adm.admNo,f,v);
            const today=new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"2-digit",year:"numeric"});
            const nowTime=new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}).toUpperCase()+" HRS";
            return (
              <div>
                <div className="no-print" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div style={{fontSize:13,fontWeight:700}}>Bill for {p.patientName||p.name}</div>
                  <div style={{display:"flex",gap:8}}>
                    <button style={{padding:"7px 14px",borderRadius:7,fontSize:11,fontWeight:700,background:`linear-gradient(135deg,${accent},${accent}cc)`,color:"#fff",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:6}} onClick={()=>printBill(p.uhid,bd.admNo)}>
                      <Printer size={13}/>Print Bill
                    </button>
                  </div>
                </div>
                <div id="bill-print-area" ref={billPrintRef} className="bill-print-card">
                  <div className="bill-print-header">
                    <div>
                      <div className="bill-print-hospital-name">SANGi HOSPITAL</div>
                      <div className="bill-print-branch">{branchInfo}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:11,color:"#64748b",marginBottom:4}}>Date: {today}</div>
                      <div className="bill-print-title-main">FINAL BILL</div>
                      <div style={{fontSize:10,color:"#64748b"}}>Admission Type: <input className="bill-info-value-edit" style={{width:80,display:"inline-block"}} value={bd.admType||"General"} onChange={e=>setF("admType",e.target.value)}/></div>
                    </div>
                  </div>
                  {/* Patient info grid */}
                  <div className="bill-info-grid">
                    {[
                      ["UHID",bd.uhid,"uhid"],["Bill No.","—",null],["IPD No.",bd.admNo,"admNo"],
                      ["Bill Date/Time",`${today} ${nowTime}`,null],["Patient Name",bd.patientName,"patientName"],
                      ["Guardian",bd.guardianName,"guardianName"],["Age/Sex",`${bd.ageYY||"—"} YRS / ${bd.gender||"—"}`,null],
                      ["Contact",bd.contactNo,"contactNo"],["Address",bd.address,"address"],["Card No.",bd.cardNo,"cardNo"],
                      ["Consultant",bd.doctorName,"doctorName"],["Room/Bed",`${bd.wardName||"—"} / ${bd.bedNo||"—"}`,null],
                      ["Claim ID",bd.claimId||"—","claimId"],["Panel",bd.panel,"panel"],
                      ["DOA",bd.doa,"doa"],["DOD",bd.dod||"—","dod"],
                      ["Status",bd.status||"—","status"],["Payment Mode",bd.paymentMode,"paymentMode"],
                    ].map(([label,value,field],i)=>(
                      <div key={i} className="bill-info-cell">
                        <div className="bill-info-label">{label}</div>
                        {field?(<input className="bill-info-value-edit" value={bd[field]||""} onChange={e=>setF(field,e.target.value)} placeholder="—"/>):(<div className="bill-info-value">{value||"—"}</div>)}
                      </div>
                    ))}
                  </div>
                  {/* Services table */}
                  <table className="bill-services-table">
                    <thead><tr><th style={{width:"5%"}}>SR</th><th style={{width:"12%"}}>DATE</th><th style={{width:"12%"}}>CGHS CODE</th><th style={{width:"36%"}}>DESCRIPTION</th><th style={{width:"10%"}}>QTY</th><th style={{width:"12%"}}>RATE</th><th style={{width:"13%"}}>AMOUNT</th></tr></thead>
                    <tbody>
                      {!services.length&&<tr><td colSpan={7} style={{textAlign:"center",color:"#94a3b8",fontStyle:"italic",padding:"12px"}}>No services added</td></tr>}
                      {services.map((svc,si)=>{ const amount=(parseFloat(svc.qty)||0)*(parseFloat(svc.rate)||0); return (
                        <tr key={svc.id||si}>
                          <td>{si+1}</td>
                          <td><input value={svc.date||""} onChange={e=>updateService(p.uhid,adm.admNo,si,"date",e.target.value)} style={{width:"100%"}}/></td>
                          <td><input value={svc.cghs||""} onChange={e=>updateService(p.uhid,adm.admNo,si,"cghs",e.target.value)} style={{width:"100%"}}/></td>
                          <td><input value={svc.desc||""} onChange={e=>updateService(p.uhid,adm.admNo,si,"desc",e.target.value)} style={{width:"100%"}}/></td>
                          <td><input type="number" min={0} value={svc.qty||0} onChange={e=>updateService(p.uhid,adm.admNo,si,"qty",e.target.value)} style={{width:"100%",textAlign:"right"}}/></td>
                          <td><input type="number" min={0} step="0.01" value={svc.rate||0} onChange={e=>updateService(p.uhid,adm.admNo,si,"rate",e.target.value)} style={{width:"100%",textAlign:"right"}}/></td>
                          <td style={{textAlign:"right",fontWeight:600,color:isDark?"#f59e0b":"#b45309"}}>₹ {amount.toFixed(2)}<button className="no-print" style={{marginLeft:6,background:"none",border:"none",color:"#f87171",cursor:"pointer",fontSize:10}} onClick={()=>removeService(p.uhid,adm.admNo,si)}>✕</button></td>
                        </tr>
                      ); })}
                      {Array.from({length:Math.max(0,6-services.length)}).map((_,i)=><tr key={`e-${i}`}><td>&nbsp;</td><td/><td/><td/><td/><td/><td/></tr>)}
                    </tbody>
                  </table>
                  {/* Service master search */}
                  <div ref={svcSearchRef} style={{position:"relative",marginBottom:8}} className="no-print">
                    <input
                      value={svcSearch}
                      placeholder="🔍 Search service master (ICU, OT, General Ward…) or fill manually below"
                      onChange={e=>{setSvcSearch(e.target.value);setSvcSearchOpen(true);}}
                      onFocus={()=>setSvcSearchOpen(true)}
                      style={{width:"100%",boxSizing:"border-box",padding:"8px 12px",borderRadius:7,border:`1px solid ${isDark?"#1a2540":"#c7d5eb"}`,fontSize:12,outline:"none",background:isDark?"#080c18":"#f8faff",color:isDark?"#e2e8f0":"#0f172a",fontFamily:"inherit"}}
                    />
                    {svcSearchOpen&&(()=>{
                      const q=svcSearch.trim().toLowerCase();
                      const filtered=q?MGMT_SERVICE_MASTER.filter(s=>s.name.toLowerCase().includes(q)||s.code.toLowerCase().includes(q)).slice(0,20):MGMT_SERVICE_MASTER.slice(0,20);
                      return (
                        <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,zIndex:9999,maxHeight:260,overflowY:"auto",background:isDark?"#0f172a":"#fff",border:`1px solid ${isDark?"#1e293b":"#c7d5eb"}`,borderRadius:10,boxShadow:"0 12px 32px rgba(0,0,0,0.2)"}}>
                          {filtered.map((svc,si)=>(
                            <div key={si}
                              onClick={()=>{
                                const key=getBillKey(p.uhid,adm.admNo);
                                setBillServices(prev=>({...prev,[key]:[...(prev[key]||[]),{id:Date.now(),date:new Date().toISOString().slice(0,10),cghs:svc.code,desc:svc.name,qty:1,rate:svc.rate}]}));
                                setSvcSearch("");setSvcSearchOpen(false);
                              }}
                              style={{padding:"9px 14px",cursor:"pointer",borderBottom:`1px solid ${isDark?"#1e293b":"#f1f5f9"}`,fontSize:13,display:"flex",justifyContent:"space-between",alignItems:"center"}}
                              onMouseEnter={e=>e.currentTarget.style.background=isDark?"#1e293b":"#f0f9ff"}
                              onMouseLeave={e=>e.currentTarget.style.background=""}>
                              <span><strong>{svc.name}</strong> <span style={{fontSize:11,color:"#94a3b8"}}>({svc.code}) · {svc.cat}</span></span>
                              <span style={{fontSize:12,color:"#059669",fontWeight:700}}>₹{svc.rate}</span>
                            </div>
                          ))}
                          {svcSearch.trim()&&!MGMT_SERVICE_MASTER.some(s=>s.name.toLowerCase()===svcSearch.trim().toLowerCase())&&(
                            <div onClick={()=>{setNewSvcRow(f=>({...f,desc:svcSearch.trim()}));setSvcSearch("");setSvcSearchOpen(false);}}
                              style={{padding:"9px 14px",cursor:"pointer",fontSize:13,fontWeight:700,color:"#3b82f6",background:"#eff6ff",borderTop:"1px solid #bfdbfe"}}
                              onMouseEnter={e=>e.currentTarget.style.background="#dbeafe"}
                              onMouseLeave={e=>e.currentTarget.style.background="#eff6ff"}>
                              + Use "{svcSearch.trim()}" as custom description
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  {/* Add service row — manual */}
                  <div className="bill-add-svc-row no-print">
                    <input placeholder="Description *" value={newSvcRow.desc||""} onChange={e=>setNewSvcRow(f=>({...f,desc:e.target.value}))} style={{flex:2}}/>
                    <input type="date" value={newSvcRow.date||""} onChange={e=>setNewSvcRow(f=>({...f,date:e.target.value}))} style={{flex:1}}/>
                    <input placeholder="CGHS" value={newSvcRow.cghs||""} onChange={e=>setNewSvcRow(f=>({...f,cghs:e.target.value}))} style={{flex:1}}/>
                    <input type="number" min={0} value={newSvcRow.qty||1} onChange={e=>setNewSvcRow(f=>({...f,qty:e.target.value}))} placeholder="Qty" style={{width:60}}/>
                    <input type="number" min={0} step="0.01" value={newSvcRow.rate||0} onChange={e=>setNewSvcRow(f=>({...f,rate:e.target.value}))} placeholder="Rate" style={{width:80}}/>
                    <button style={{padding:"5px 12px",borderRadius:6,fontSize:11,fontWeight:600,background:`linear-gradient(135deg,${accent},${accent}cc)`,color:"#fff",border:"none",cursor:"pointer"}} onClick={()=>addService(p.uhid,adm.admNo)}>+ Add</button>
                  </div>
                  {/* Totals */}
                  <div className="bill-totals-section">
                    <div className="bill-totals-box">
                      <div className="bill-total-row"><span style={{color:"#64748b"}}>Gross Total:</span><span style={{fontWeight:700}}>₹ {gross.toFixed(2)}</span></div>
                      <div className="bill-total-row">
                        <span style={{color:"#64748b"}}>Discount:</span>
                        <div style={{display:"flex",alignItems:"center",gap:4}}>
                          <span style={{color:"#c084fc"}}>- ₹</span>
                          <input type="number" min={0} className="no-print" style={{width:80,textAlign:"right",background:"transparent",border:`1px dashed ${isDark?"#1e2a3a":"#c7d5eb"}`,borderRadius:4,padding:"1px 6px",fontSize:12,color:"#c084fc"}} value={bd.discount||0} onChange={e=>setF("discount",e.target.value)}/>
                          <span style={{fontWeight:700,color:"#c084fc"}}>{parseFloat(bd.discount||0).toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="bill-total-row">
                        <span style={{color:"#64748b"}}>Advance:</span>
                        <div style={{display:"flex",alignItems:"center",gap:4}}>
                          <span style={{color:"#34d399"}}>- ₹</span>
                          <input type="number" min={0} className="no-print" style={{width:80,textAlign:"right",background:"transparent",border:`1px dashed ${isDark?"#1e2a3a":"#c7d5eb"}`,borderRadius:4,padding:"1px 6px",fontSize:12,color:"#34d399"}} value={bd.advance||0} onChange={e=>setF("advance",e.target.value)}/>
                          <span style={{fontWeight:700,color:"#34d399"}}>{parseFloat(bd.advance||0).toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="bill-total-row net"><span style={{color:accent}}>NET PAYABLE:</span><span style={{color:accent,fontSize:16}}>₹ {net.toFixed(2)}</span></div>
                    </div>
                  </div>
                  {/* Footer */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:20,marginTop:24,paddingTop:16,borderTop:`1px solid ${isDark?"#1e2a3a":"#c7d5eb"}`}}>
                    <div style={{textAlign:"center"}}><div style={{borderBottom:`1px solid ${isDark?"#1e2a3a":"#94a3b8"}`,height:40,marginBottom:6}}/><div style={{fontSize:12,fontWeight:700}}>Authorised Signatory</div><div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",color:"#94a3b8"}}>Medical Superintendent</div></div>
                    <div style={{textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end"}}><div style={{fontSize:10,color:accent,fontWeight:600}}>www.sangihospital.com</div><div style={{fontSize:9,color:"#64748b",marginTop:4}}>Computer generated bill</div></div>
                    <div style={{textAlign:"center"}}><div style={{borderBottom:`1px solid ${isDark?"#1e2a3a":"#94a3b8"}`,height:40,marginBottom:6}}/><div style={{fontSize:12,fontWeight:700}}>Patient / Attendant Signature</div><div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",color:"#94a3b8"}}>with date</div></div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    );
  };

  // ── PAGE: TASKS ───────────────────────────────────────────────────────────
  const renderTasks = () => {
    const ts={total:tasks.length,pending:tasks.filter(t=>t.status==="Pending").length,inprogress:tasks.filter(t=>t.status==="In Progress").length,completed:tasks.filter(t=>t.status==="Completed").length,urgent:tasks.filter(t=>t.priority==="Urgent"&&t.status!=="Completed").length};
    return (
      <div>
        <PageHeader title="Task Manager" subtitle="Assign and track tasks across all departments"/>
        <div className="hms-stat-grid">{[{label:"Total",val:ts.total,col:accent},{label:"Pending",val:ts.pending,col:"#f59e0b"},{label:"In Progress",val:ts.inprogress,col:"#38bdf8"},{label:"Completed",val:ts.completed,col:"#34d399"},{label:"Urgent",val:ts.urgent,col:"#f87171"}].map((s,i)=>(<div key={i} className="hms-stat-card" style={{padding:"12px 14px",border:`1px solid ${s.col}18`}}><div className="hms-stat-num" style={{fontSize:20,color:s.col}}>{s.val}</div><div className="hms-stat-label">{s.label}</div></div>))}</div>
        <div className="hms-card">
          <CardRow title="All Tasks" action={<button className="hms-add-btn" onClick={openNewTask}>+ Assign Task</button>}/>
          {!tasks.length?<EmptyState icon="✅" label="No tasks yet" sub='Click "Assign Task" to create one'/>:(
            <TableWrap heads={["Task","Assigned To","Dept","Priority","Status","Due Date","Patients","Actions"]}>
              {tasks.map((t)=>(
                <tr key={t.id}>
                  <Td><span className="hms-td-hi">{t.title}</span>{t.description&&<div style={{fontSize:9,color:"#64748b",marginTop:2,maxWidth:180}}>{t.description.slice(0,60)}{t.description.length>60?"…":""}</div>}</Td>
                  <Td>{t.assignedTo}</Td><Td><Badge col={accent}>{t.department}</Badge></Td>
                  <Td><PriorityPill p={t.priority}/></Td>
                  <Td><select className="hms-task-status-sel" style={{background:TASK_STATUS_META[t.status]?.bg||"transparent",borderColor:`${TASK_STATUS_META[t.status]?.color||"#6b7280"}40`,color:TASK_STATUS_META[t.status]?.color||"inherit"}} value={t.status} onChange={e=>updateTaskStatus(t.id,e.target.value)}>{TASK_STATUS.map(s=><option key={s} value={s}>{s}</option>)}</select></Td>
                  <Td sm>{fmtDt(t.dueDate)}</Td>
                  <Td sm>{(t.patientNames||[]).length>0?<div>{(t.patientNames||[]).map((name,ni)=><div key={ni} style={{color:"#38bdf8",fontSize:10}}>{name}</div>)}</div>:"—"}</Td>
                  <Td><div style={{display:"flex",gap:4}}><ActionBtn col={accent} onClick={()=>openEditTask(t)}>✎</ActionBtn><ActionBtn col="#f87171" onClick={()=>deleteTask(t.id)}>✕</ActionBtn></div></Td>
                </tr>
              ))}
            </TableWrap>
          )}
        </div>
      </div>
    );
  };

  // ── PAGE: TASK REPORT ─────────────────────────────────────────────────────
  const renderTaskReport = () => {
    const periodLabel={all:"All Time",today:"Today",week:"This Week",month:"This Month"};
    const empMap={};
    filteredTaskReport.forEach(t=>{ if(!empMap[t.assignedTo]) empMap[t.assignedTo]={name:t.assignedTo,dept:t.department,total:0,completed:0,pending:0,inprogress:0,onhold:0}; empMap[t.assignedTo].total++; if(t.status==="Completed") empMap[t.assignedTo].completed++; else if(t.status==="Pending") empMap[t.assignedTo].pending++; else if(t.status==="In Progress") empMap[t.assignedTo].inprogress++; else if(t.status==="On Hold") empMap[t.assignedTo].onhold++; });
    const empList=Object.values(empMap);
    return (
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
          <PageHeader title="Task Report" subtitle="Filter and download task reports"/>
          <button onClick={loadTasks} disabled={tasksLoading}
            style={{fontSize:11,fontWeight:700,color:accent,background:`${accent}12`,border:`1px solid ${accent}30`,borderRadius:6,padding:"6px 14px",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}>
            {tasksLoading?"⏳ Loading…":"↻ Refresh"}
          </button>
        </div>
        <div className="hms-card">
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:8}}>
            <div><label className="hms-lbl">Time Period</label><select className="hms-sel" value={taskReportFilter.period} onChange={e=>setTaskReportFilter(f=>({...f,period:e.target.value}))}><option value="all">All Time</option><option value="today">Today</option><option value="week">This Week</option><option value="month">This Month</option></select></div>
            <div><label className="hms-lbl">Department</label><select className="hms-sel" value={taskReportFilter.dept} onChange={e=>setTaskReportFilter(f=>({...f,dept:e.target.value}))}><option value="All">All Departments</option>{allDeptOptions.map(d=><option key={d}>{d}</option>)}</select></div>
            <div><label className="hms-lbl">Status</label><select className="hms-sel" value={taskReportFilter.status} onChange={e=>setTaskReportFilter(f=>({...f,status:e.target.value}))}><option value="All">All Status</option>{TASK_STATUS.map(s=><option key={s}>{s}</option>)}</select></div>
            <div><label className="hms-lbl">Employee</label><input className="hms-inp" style={{marginBottom:0}} placeholder="Search…" value={taskReportFilter.empName} onChange={e=>setTaskReportFilter(f=>({...f,empName:e.target.value}))}/></div>
          </div>
          <div style={{display:"flex",gap:8,marginTop:6}}>
            <ActionBtn col="#34d399" onClick={()=>{exportTasksXLSX(filteredTaskReport,`task_report_${taskReportFilter.period}.xlsx`);toast("Exported XLSX");}}>↓ XLSX</ActionBtn>
            <ActionBtn col="#38bdf8" onClick={()=>{exportCSV(`task_report.csv`,filteredTaskReport.map(t=>({TaskID:t.id,Title:t.title,AssignedTo:t.assignedTo,Department:t.department,Priority:t.priority,Status:t.status,DueDate:t.dueDate||"—",CreatedDate:t.createdAt?.split("T")[0]||"—",PatientNames:(t.patientNames||[]).join("; ")||"—"})),["TaskID","Title","AssignedTo","Department","Priority","Status","DueDate","CreatedDate","PatientNames"]);toast("Exported CSV");}}>↓ CSV</ActionBtn>
            <span style={{marginLeft:"auto",fontSize:11,color:"#64748b"}}><strong>{filteredTaskReport.length}</strong> records · <span style={{color:accent}}>{periodLabel[taskReportFilter.period]}</span></span>
          </div>
        </div>
        <div className="hms-card">
          <div className="hms-card-title" style={{marginBottom:14}}>Employee Summary</div>
          {!empList.length?<div className="hms-empty">No tasks match filters.</div>:(
            <TableWrap heads={["Employee","Dept","Total","Pending","In Progress","Completed","Completion %"]}>
              {empList.map((e,i)=>{ const pct=e.total?Math.round((e.completed/e.total)*100):0; return (<tr key={i}><Td hi>{e.name}</Td><Td><Badge col={accent}>{e.dept}</Badge></Td><Td><strong>{e.total}</strong></Td><Td><span style={{color:"#f59e0b"}}>{e.pending}</span></Td><Td><span style={{color:"#38bdf8"}}>{e.inprogress}</span></Td><Td><span style={{color:"#34d399"}}>{e.completed}</span></Td><Td><div style={{display:"flex",alignItems:"center",gap:8}}><ProgressBar pct={pct} col="#34d399"/><span style={{fontSize:10,fontWeight:700,color:pct>=75?"#34d399":pct>=50?"#f59e0b":"#f87171",minWidth:32}}>{pct}%</span></div></Td></tr>); })}
            </TableWrap>
          )}
        </div>

        {/* ── Detailed Task Work Done ── */}
        <div className="hms-card">
          <div className="hms-card-title" style={{marginBottom:14}}>Detailed Work Report</div>
          {!filteredTaskReport.length ? <div className="hms-empty">No tasks match filters.</div> : (
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {filteredTaskReport.map((t,i)=>{
                const statusCol = t.status==="Completed"?"#34d399":t.status==="In Progress"?"#38bdf8":t.status==="On Hold"?"#f59e0b":"#94a3b8";
                const sections = t.sections || t.taskSections || [];
                const patients = t.patientNames?.length ? t.patientNames : t.patientName ? [t.patientName] : [];
                const uhids    = t.patientUhids?.length ? t.patientUhids : t.patientUhid ? [t.patientUhid] : [];
                return (
                  <div key={t.id||i} style={{border:`1px solid ${isDark?"#1e2a3a":"#e2e8f0"}`,borderRadius:10,overflow:"hidden"}}>
                    {/* Task header */}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:isDark?"#0b1120":"#f8faff",borderBottom:`1px solid ${isDark?"#1e2a3a":"#e2e8f0"}`}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontSize:11,fontWeight:700,color:"#64748b",fontFamily:"monospace"}}>#{t.id}</span>
                        <span style={{fontSize:13,fontWeight:700,color:isDark?"#e2e8f0":"#0f172a"}}>{t.title}</span>
                        <Badge col={statusCol}>{t.status}</Badge>
                        <Badge col={accent}>{t.department}</Badge>
                        {t.priority&&<Badge col={t.priority==="High"?"#f87171":t.priority==="Medium"?"#f59e0b":"#34d399"}>{t.priority}</Badge>}
                      </div>
                      <div style={{fontSize:11,color:"#64748b",textAlign:"right"}}>
                        <div>👤 {t.assignedTo}</div>
                        {t.dueDate&&<div>Due: {t.dueDate?.slice(0,10)}</div>}
                        {t.completedAt&&<div style={{color:"#34d399"}}>✓ Done: {t.completedAt?.slice(0,10)}</div>}
                      </div>
                    </div>
                    {/* Work details */}
                    <div style={{padding:"12px 14px",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12}}>
                      {/* Patients linked */}
                      {patients.length>0&&(
                        <div>
                          <div style={{fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".05em",marginBottom:6}}>Patients</div>
                          <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                            {patients.map((pn,pi)=>(
                              <span key={pi} style={{fontSize:11,background:`${accent}18`,color:accent,border:`1px solid ${accent}30`,borderRadius:12,padding:"2px 8px",fontWeight:600}}>
                                {pn}{uhids[pi]?` · ${uhids[pi]}`:""}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Sections completed */}
                      {sections.length>0&&(
                        <div>
                          <div style={{fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".05em",marginBottom:6}}>Sections Done</div>
                          <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                            {sections.map((s,si)=>(
                              <span key={si} style={{fontSize:11,background:"rgba(52,211,153,0.1)",color:"#34d399",border:"1px solid rgba(52,211,153,0.3)",borderRadius:12,padding:"2px 8px",fontWeight:600}}>✓ {s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Work done / remarks */}
                      {(t.remarks||t.notes||t.description)&&(
                        <div style={{gridColumn:"1/-1"}}>
                          <div style={{fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".05em",marginBottom:6}}>Work Done / Submit Note</div>
                          <div style={{fontSize:12,color:isDark?"#cbd5e1":"#334155",background:isDark?"#0f172a":"#f8faff",border:`1px solid ${isDark?"#1e293b":"#e2e8f0"}`,borderRadius:6,padding:"8px 10px",lineHeight:1.6}}>{t.remarks||t.notes||t.description}</div>
                        </div>
                      )}
                      {/* HOD review note */}
                      {t.hodNote&&(
                        <div style={{gridColumn:"1/-1"}}>
                          <div style={{fontSize:10,fontWeight:700,color:"#818cf8",textTransform:"uppercase",letterSpacing:".05em",marginBottom:6}}>HOD Review Note</div>
                          <div style={{fontSize:12,color:isDark?"#cbd5e1":"#334155",background:isDark?"rgba(129,140,248,0.06)":"#f5f3ff",border:"1px solid rgba(129,140,248,0.2)",borderRadius:6,padding:"8px 10px",lineHeight:1.6}}>{t.hodNote}</div>
                        </div>
                      )}
                      {/* View patient work button */}
                      {(t.patient_uhid||t.patientUhid)&&(
                        <div style={{gridColumn:"1/-1"}}>
                          <button onClick={()=>{ setActiveTab("discharge"); }}
                            style={{fontSize:11,fontWeight:700,color:accent,background:`${accent}12`,border:`1px solid ${accent}30`,borderRadius:6,padding:"5px 12px",cursor:"pointer",fontFamily:"inherit"}}>
                            → View Patient Record ({t.patient_uhid||t.patientUhid})
                          </button>
                        </div>
                      )}
                      {/* Dates */}
                      <div>
                        <div style={{fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".05em",marginBottom:6}}>Timeline</div>
                        <div style={{fontSize:11,color:"#94a3b8",lineHeight:1.8}}>
                          <div>Created: <span style={{color:isDark?"#cbd5e1":"#475569",fontWeight:600}}>{t.createdAt?.slice(0,10)||"—"}</span></div>
                          {t.dueDate&&<div>Due: <span style={{color:"#f59e0b",fontWeight:600}}>{t.dueDate?.slice(0,10)}</span></div>}
                          {t.completedAt&&<div>Completed: <span style={{color:"#34d399",fontWeight:600}}>{t.completedAt?.slice(0,10)}</span></div>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── PAGE: DEPARTMENTS ─────────────────────────────────────────────────────
  const renderDepartments = () => {
    const deptList=[...DEPT_OPTIONS.map(name=>({id:`default-${name}`,name,description:`${name} Department`,isDefault:true,memberCount:employees.filter(e=>e.dept===name).length})),...departments.filter(d=>!DEPT_OPTIONS.includes(d.name)).map(d=>({...d,isDefault:false,memberCount:employees.filter(e=>e.dept===d.name).length}))];
    return (
      <div>
        <PageHeader title="Departments"/>
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}><button className="hms-add-btn-lg" onClick={()=>setShowDeptModal(true)}>+ Create Department</button></div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14}}>
          {deptList.map((dept,i)=>{
            const dA=DEPT_ACCENT_CYCLE[i%DEPT_ACCENT_CYCLE.length];
            const deptTasks=tasks.filter(t=>t.department===dept.name);
            const completedTasks=deptTasks.filter(t=>t.status==="Completed").length;
            const pct=deptTasks.length?Math.round((completedTasks/deptTasks.length)*100):0;
            return (
              <div key={dept.id} className="hms-dept-card" style={{borderColor:`${dA}30`,borderTopColor:dA}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                  <div style={{width:36,height:36,borderRadius:10,background:`${dA}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{DEPT_ICONS[dept.name]||"🏢"}</div>
                  {dept.isDefault?<Badge col={accent}>DEFAULT</Badge>:<button onClick={()=>setDepartments(prev=>prev.filter(d=>d.id!==dept.id))} style={{background:"transparent",border:"none",color:"#64748b",cursor:"pointer",fontSize:12,padding:"2px 6px"}}>✕</button>}
                </div>
                <div style={{fontSize:13,fontWeight:700,marginBottom:4}}>{dept.name}</div>
                <div style={{fontSize:10,color:"#64748b",marginBottom:12}}>{dept.description}</div>
                <div style={{display:"flex",gap:10,marginBottom:deptTasks.length?10:0}}>
                  {[{label:"Members",val:dept.memberCount,col:dA},{label:"Tasks",val:deptTasks.length,col:"#38bdf8"},{label:"Done",val:completedTasks,col:"#34d399"}].map((s,j)=>(<div key={j} style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:800,color:s.col}}>{s.val}</div><div style={{fontSize:9,color:"#64748b"}}>{s.label}</div></div>))}
                </div>
                {deptTasks.length>0&&<><div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#64748b",marginBottom:4}}><span>Progress</span><span>{pct}%</span></div><ProgressBar pct={pct} col={dA}/></>}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── PAGE: EMPLOYEES ───────────────────────────────────────────────────────
  const renderEmployees = () => (
    <div>
      <PageHeader title="Employee Management"/>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
        <button className="hms-add-btn-lg" onClick={()=>{ setEditEmpId(null);setEmpPassErr("");setEmpForm({fullName:"",username:"",empId:"",dept:"HOD",email:"",phone:"",role:"hod",password:"",confirmPassword:""});setShowEmpModal(true); }}>+ Create Employee</button>
      </div>
      {!employees.length?<EmptyState icon="👤" label="No employees yet"/>:(
        <TableWrap heads={["Emp ID","Full Name","Username","Role","Department","Email","Phone","Status","Actions"]}>
          {employees.map((emp,i)=>(
            <tr key={i}>
              <Td mono style={{color:accent}}>{emp.empId||emp.id}</Td><Td hi>{emp.fullName||emp.name}</Td><Td sm>{emp.username}</Td>
              <Td><Badge col="#818cf8">{emp.role||"Staff"}</Badge></Td><Td><Badge col={accent}>{emp.dept}</Badge></Td>
              <Td sm>{emp.email}</Td><Td sm>{emp.phone}</Td>
              <Td><Badge col={emp.status==="Inactive"?"#f87171":"#34d399"}>{emp.status||"Active"}</Badge></Td>
              <Td><div style={{display:"flex",gap:6}}><ActionBtn col={accent} onClick={()=>openEditEmployee(emp)}>✎ Edit</ActionBtn><ActionBtn col={emp.status==="Inactive"?"#34d399":"#f87171"} onClick={()=>handleToggleActive(emp,i)}>{emp.status==="Inactive"?"✓ Activate":"⊘ Deactivate"}</ActionBtn></div></Td>
            </tr>
          ))}
        </TableWrap>
      )}
    </div>
  );

  // ── PAGE: PROFILE ─────────────────────────────────────────────────────────
  const renderProfile = () => (
    <div>
      <BranchHeader title="My Profile"/>
      <div className="hms-prof-card" style={{display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center",border:`1px solid ${accent}30`}}>
        <div style={{width:70,height:70,borderRadius:"50%",background:`linear-gradient(135deg,${accent},#818cf8)`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:22,color:"#fff",marginBottom:12}}>{initials(currentDisplayName)}</div>
        <div style={{fontSize:16,fontWeight:700,marginBottom:3}}>{currentDisplayName}</div>
        <div style={{fontSize:11,color:accent,fontWeight:600,marginBottom:4}}>{currentUser?.dept||currentUser?.role?.toUpperCase()}</div>
        <Badge col="#34d399">Active</Badge>
      </div>
      <div className="hms-card">
        <div className="hms-card-title" style={{marginBottom:14}}>Account Details</div>
        <div className="hms-g2">
          <div><label className="hms-lbl">First Name</label><input className="hms-inp" value={profileForm.first_name} onChange={e=>setProfileForm(f=>({...f,first_name:e.target.value}))}/></div>
          <div><label className="hms-lbl">Last Name</label><input className="hms-inp" value={profileForm.last_name} onChange={e=>setProfileForm(f=>({...f,last_name:e.target.value}))}/></div>
        </div>
        <div className="hms-g2">
          <div><label className="hms-lbl">Email</label><input className="hms-inp" type="email" value={profileForm.email} onChange={e=>setProfileForm(f=>({...f,email:e.target.value}))}/></div>
          <div><label className="hms-lbl">Phone</label><input className="hms-inp" value={profileForm.phone_number} onChange={e=>setProfileForm(f=>({...f,phone_number:e.target.value}))}/></div>
        </div>
        <div className="hms-g2">
          <div><label className="hms-lbl">Employee Code</label><input className="hms-inp" value={profileForm.emp_id} onChange={e=>setProfileForm(f=>({...f,emp_id:e.target.value}))}/></div>
          <div><label className="hms-lbl">Role</label><input className="hms-inp" value={currentUser?.role||""} readOnly/></div>
        </div>
        <div className="hms-modal-foot" style={{justifyContent:"flex-end"}}><button className="hms-save-btn" onClick={saveMyProfile}>Save Profile</button></div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch(activeTab) {
      case "home":        return renderHome();
      case "patients":    return renderPatients();
      case "discharge":   return renderDischarge();
      case "medicines":   return renderMedicines();
      case "reports":     return renderReports();
      case "billing":     return renderBilling();
      case "tasks":       return renderTasks();
      case "taskreport":  return renderTaskReport();
      case "medhistory":  return renderMedHistory();
      case "records":     return <UpdateRecordsPanel roleLabel="Office Admin"/>;
      case "departments": return renderDepartments();
      case "employees":   return renderEmployees();
      case "profile":     return renderProfile();
      default:            return renderHome();
    }
  };

  const sbWidth = collapsed ? 52 : 220;

  // ── DISCHARGE SUMMARY MODAL (billing-dashboard style) ─────────────────────
  const renderSummaryModal = () => {
    if (!showSummaryModal || !editSumPt) return null;
    const dtCfg   = DISCHARGE_TYPES_CFG[summaryType]||DISCHARGE_TYPES_CFG.NORMAL;
    const sections = DISCHARGE_SECTIONS_MAP[summaryType]||DISCHARGE_SECTIONS_MAP.NORMAL;
    const setF = (k,v) => setEditDisFields(p=>({...p,[k]:v}));

    return (
      <div className="hms-modal-overlay" onClick={e=>e.target===e.currentTarget&&(setShowSummaryModal(false),setEditSumPt(null))}>
        <div className="hms-modal-box" style={{width:780,maxHeight:"93vh",display:"flex",flexDirection:"column"}}>
          {/* Header */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
            <div>
              <div className="hms-modal-title">Discharge Summary — {editSumPt.patientName||editSumPt.name}</div>
              <div style={{fontSize:11,color:"#64748b",marginTop:2}}>{editSumPt.uhid} · Adm #{summaryAdmNo} · {editSumPt._branchLabel||bc.label}</div>
            </div>
            <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:20,fontSize:12,fontWeight:700,background:dtCfg.bg,border:`1.5px solid ${dtCfg.border}`,color:dtCfg.color}}>{dtCfg.icon} {dtCfg.label}</div>
          </div>

          

          {/* Type banner */}
          <div style={{background:dtCfg.bg,border:`2px solid ${dtCfg.border}`,borderRadius:12,padding:"12px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:24}}>{dtCfg.icon}</span>
            <div><div style={{fontSize:14,fontWeight:800,color:dtCfg.color}}>{dtCfg.label} Summary</div><div style={{fontSize:11,color:dtCfg.color,opacity:.75,marginTop:2}}>All fields are editable · Save then Print PDF from the button below</div></div>
          </div>

          {/* Scrollable form */}
          <div style={{flex:1,overflowY:"auto",paddingRight:4}}>
            {/* Dates + Basic Info */}
            <div className="dis-section-card">
              <div className="dis-section-head">
                <div style={{width:22,height:22,borderRadius:6,background:dtCfg.bg,border:`1.5px solid ${dtCfg.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:dtCfg.color}}>📅</div>
                <span style={{fontSize:13,fontWeight:700,textTransform:"uppercase",letterSpacing:".04em"}}>Dates & Basic Information</span>
              </div>
              <div className="dis-section-body">
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12}}>
                  <div><label className="hms-lbl">Date of Admission</label><input className="hms-inp" type="date" value={editDisFields.doa?.slice(0,10)||""} onChange={e=>setF("doa",e.target.value)}/></div>
                  <div><label className="hms-lbl">Expected Discharge</label><input className="hms-inp" type="date" value={editDisFields.expectedDod?.slice(0,10)||""} onChange={e=>setF("expectedDod",e.target.value)}/></div>
                  <div><label className="hms-lbl">Actual Discharge (DOD)</label><input className="hms-inp" type="date" value={editDisFields.dod?.slice(0,10)||""} onChange={e=>setF("dod",e.target.value)}/></div>
                  <div><label className="hms-lbl">Ward</label><input className="hms-inp" value={editDisFields.ward||""} placeholder="e.g. General Ward" onChange={e=>setF("ward",e.target.value)}/></div>
                  <div><label className="hms-lbl">Bed No.</label><input className="hms-inp" value={editDisFields.bed||""} placeholder="e.g. B-12" onChange={e=>setF("bed",e.target.value)}/></div>
                  <div><label className="hms-lbl">Treating Doctor</label><input className="hms-inp" value={editDisFields.doctor||""} placeholder="Dr. Name" onChange={e=>setF("doctor",e.target.value)}/></div>
                  <div style={{gridColumn:"1/-1"}}><label className="hms-lbl">Primary Diagnosis</label><input className="hms-inp" value={editDisFields.diagnosis||""} placeholder="e.g. Acute Appendicitis" onChange={e=>setF("diagnosis",e.target.value)}/></div>
                </div>
              </div>
            </div>

            {/* Dynamic sections */}
            {sections.map((sec,idx)=>(
              <div key={sec.key} className="dis-section-card">
                <div className="dis-section-head">
                  <div style={{width:22,height:22,borderRadius:6,background:dtCfg.bg,border:`1.5px solid ${dtCfg.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:dtCfg.color}}>{idx+1}</div>
                  <span style={{fontSize:13,fontWeight:700,textTransform:"uppercase",letterSpacing:".04em"}}>{sec.label}</span>
                  {sec.type==="vitals_grid"&&<span style={{fontSize:10,fontWeight:600,color:"#64748b",background:isDark?"#1e2a3a":"#f1f5f9",border:`1px solid ${isDark?"#1a2540":"#e2e8f0"}`,borderRadius:20,padding:"1px 8px",marginLeft:4}}>Vitals Grid</span>}
                </div>
                <div className="dis-section-body">
                  {sec.type==="vitals_grid"?(
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12}}>
                      {[{k:"bp",lbl:"BP (mmHg)",ph:"120/80 mmHg"},{k:"pr",lbl:"Pulse (/min)",ph:"82/min"},{k:"spo2",lbl:"SPO2",ph:"98% On RA"},{k:"temp",lbl:"Temperature",ph:"98.6°F"},{k:"chest",lbl:"Chest",ph:"B/L Clear"},{k:"cvs",lbl:"CVS",ph:"S1 S2 +"},{k:"cns",lbl:"CNS",ph:"Conscious, Oriented"},{k:"pa",lbl:"P/A",ph:"Soft, Non-tender"}].map(v=>(
                        <div key={v.k}><label className="hms-lbl">{v.lbl}</label><input className="hms-inp" value={editDisFields[v.k]||""} placeholder={v.ph} onChange={e=>setF(v.k,e.target.value)}/></div>
                      ))}
                    </div>
                  ):(
                    <textarea className="hms-textarea" rows={sec.rows||3} value={editDisFields[sec.key]||""} placeholder={`Enter ${sec.label.toLowerCase()}...`} style={{width:"100%",boxSizing:"border-box",resize:"vertical",lineHeight:1.55}} onChange={e=>setF(sec.key,e.target.value)}/>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="hms-modal-foot">
            <button className="hms-cancel-btn" onClick={()=>{setShowSummaryModal(false);setEditSumPt(null);}} disabled={summarySaving}>Cancel</button>
            <button style={{background:"transparent",border:`1px solid ${accent}40`,color:accent,padding:"8px 14px",borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:700}} onClick={()=>handlePrintSummary(editSumPt)} disabled={summarySaving}>↓ Print PDF</button>
            <button className="hms-save-btn" onClick={saveSummary} disabled={summarySaving}>{summarySaving?"Saving…":"Save Summary"}</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="hms-wrap">
      <style>{DYNAMIC_CSS(accent,isDark)}</style>
      <style>{BILL_PRINT_CSS}</style>

      {notif&&(<div className="hms-notif" style={{background:notif.type==="ok"?(isDark?"#052e1c":"#f0fdf4"):(isDark?"#3b0f05":"#fef2f2"),borderColor:notif.type==="ok"?"#34d399":"#f87171",color:notif.type==="ok"?"#86efac":"#fca5a5"}}>{notif.type==="ok"?"✓ ":"⚠ "}{notif.msg}</div>)}

      <header className="hms-hdr">
        <div className="hms-logo-row">
          <img src="/app_icon.png" alt="logo" style={{width:30,height:30,borderRadius:8,objectFit:"cover"}}/>
          <div><div className="hms-logo-text">Sangi Hospital</div><div className="hms-logo-sub">{currentUser?.dept||currentUser?.role} · Management</div></div>
        </div>
        <div className="hms-hdr-right">
          <span className="hms-role-badge">{currentUser?.role?.toUpperCase()}</span>
          <ThemeModeDock variant="inline"/>
          <div className="hms-avatar-pill"><span className="hms-avatar-name">{currentDisplayName}</span><div className="hms-avatar">{initials(currentDisplayName)}</div></div>
          <button className="hms-logout-btn" onClick={onLogout}>↪ Logout</button>
        </div>
      </header>

      <div className="hms-body">
        <aside className="hms-sb" style={{width:sbWidth}}>
          <div className="hms-sb-top" style={{padding:collapsed?"14px 8px":"14px 12px"}}>
            {!collapsed&&<div className="hms-branch-label">Branch</div>}
            {collapsed?(
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                {allowedBranchKeys.map(bk=>(<button key={bk} className="hms-branch-dot-btn" onClick={()=>setViewBranch(bk)} style={{background:viewBranch===bk?BC[bk].dim:"transparent"}}><div className="hms-branch-dot" style={{background:BC[bk].accent}}/></button>))}
              </div>
            ):(
              <select className="hms-branch-select" value={viewBranch} onChange={e=>setViewBranch(e.target.value)}>
                {allowedBranchKeys.map(bk=><option key={bk} value={bk}>{BC[bk].label}</option>)}
              </select>
            )}
          </div>
          <nav className="hms-nav-wrap">
            {NAV.map(item=>{ const Icon=item.icon; return (<div key={item.id} className={`hms-nav-item${activeTab===item.id?" active":""}`} style={{padding:collapsed?"10px 0":"10px 14px",justifyContent:collapsed?"center":"flex-start"}} onClick={()=>setActiveTab(item.id)} title={item.label}><span className="hms-nav-icon" style={{display:"inline-flex",alignItems:"center"}}>{Icon?<Icon size={15} strokeWidth={1.9}/>:null}</span>{!collapsed&&item.label}</div>); })}
          </nav>
          {!collapsed&&(<div style={{padding:"10px 12px",borderTop:"1px solid #1e2030",borderBottom:"1px solid #1e2030"}}><div className="hms-signed-in">Signed in as</div><div className="hms-signed-name">{currentDisplayName}</div><div className="hms-signed-role">{currentUser?.dept||currentUser?.role}</div></div>)}
          <div className="hms-sb-bot" style={{padding:collapsed?"10px 8px":"10px 12px"}}><button className="hms-col-btn" onClick={()=>setCollapsed(x=>!x)}>{collapsed?"▶":"◀"}</button></div>
        </aside>
        <main className="hms-main">{renderContent()}</main>
      </div>

      {/* ══ DISCHARGE SUMMARY MODAL (billing-dashboard style) ══ */}
      {renderSummaryModal()}

      {/* ══ TASK MODAL ══ */}
      {showTaskModal&&(
        <div className="hms-modal-overlay" onClick={e=>e.target===e.currentTarget&&(setShowTaskModal(false),setEditTask(null))}>
          <div className="hms-modal-box" style={{width:540}}>
            <div className="hms-modal-title">{editTask?"Edit Task":"Assign New Task"}</div>
            <label className="hms-lbl">Task Title *</label><input className="hms-inp" placeholder="E.g. Prepare daily billing report" value={taskForm.title} onChange={e=>setTaskForm(f=>({...f,title:e.target.value}))}/>
            <label className="hms-lbl">Description</label><textarea className="hms-textarea" placeholder="Task details…" value={taskForm.description} onChange={e=>setTaskForm(f=>({...f,description:e.target.value}))}/>
            <div className="hms-g2">
              <div><label className="hms-lbl">Assigned To *</label><select className="hms-sel" value={taskForm.assignedToId} onChange={e=>setTaskForm(f=>({...f,assignedToId:e.target.value}))}><option value="">Select employee</option>{taskAssignableEmployees.map(e=>{ const fn=e.fullName||e.name||e.username; const id=e.empId||`ID-${e.id}`; return <option key={e.id} value={String(e.id)}>{`${fn} (${id})`}</option>; })}</select></div>
              <div><label className="hms-lbl">Department</label><select className="hms-sel" value={taskForm.department} onChange={e=>setTaskForm(f=>({...f,department:e.target.value,assignedToId:""}))}>{allDeptOptions.map(d=><option key={d}>{d}</option>)}</select></div>
            </div>
            <div className="hms-g2">
              <div><label className="hms-lbl">Priority</label><select className="hms-sel" value={taskForm.priority} onChange={e=>setTaskForm(f=>({...f,priority:e.target.value}))}>{TASK_PRIORITY.map(p=><option key={p}>{p}</option>)}</select></div>
              <div><label className="hms-lbl">Due Date</label><input className="hms-inp" type="date" value={taskForm.dueDate} onChange={e=>setTaskForm(f=>({...f,dueDate:e.target.value}))}/></div>
            </div>
            <label className="hms-lbl">Link to Patients <span style={{color:"#64748b",fontWeight:400,marginLeft:6}}>(optional · up to 8)</span></label>
            {taskForm.patientUhids.length>0&&(<div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>{taskForm.patientUhids.map((uhid,idx)=>(<div key={uhid} className="hms-patient-selected-pill">🧑‍⚕️ {taskForm.patientNames[idx]}<span style={{color:"#64748b",fontSize:10,fontWeight:400}}> · {uhid}</span><button style={{background:"none",border:"none",color:accent,cursor:"pointer",fontSize:13,opacity:0.7}} onClick={()=>setTaskForm(f=>({...f,patientUhids:f.patientUhids.filter((_,i)=>i!==idx),patientNames:f.patientNames.filter((_,i)=>i!==idx)}))}>✕</button></div>))}<button style={{fontSize:10,color:"#f87171",background:"none",border:"1px solid #f8717140",borderRadius:12,padding:"3px 10px",cursor:"pointer"}} onClick={()=>setTaskForm(f=>({...f,patientUhids:[],patientNames:[]}))}>Clear All</button></div>)}
            {taskForm.patientUhids.length<8&&(<><input className="hms-patient-search" placeholder="Search patient…" value={taskPatientSearch} onChange={e=>setTaskPatientSearch(e.target.value)}/><div className="hms-patient-select-box">{filteredTaskPatients.length===0?(<div style={{padding:"10px 12px",fontSize:11,color:"#64748b",textAlign:"center"}}>No patients found</div>):filteredTaskPatients.map(p=>{ const isSel=taskForm.patientUhids.includes(p.uhid); return (<div key={p.uhid} className={`hms-patient-select-item${isSel?" selected":""}`} onClick={()=>toggleTaskPatient(p)}><div><span style={{fontWeight:600,color:isDark?"#e2e8f0":"#1e293b"}}>{p.name}</span><span style={{marginLeft:8,color:"#64748b",fontSize:10}}>{p.uhid}</span>{isSel&&<span style={{marginLeft:6,color:accent,fontSize:11,fontWeight:700}}>✓</span>}</div><div style={{display:"flex",gap:5,alignItems:"center"}}><span style={{fontSize:9,padding:"2px 6px",borderRadius:10,background:p.status==="Admitted"?"#34d39918":"#6b728018",color:p.status==="Admitted"?"#34d399":"#6b7280"}}>{p.status}</span></div></div>); })}</div></>)}
            <div style={{fontSize:10,color:"#64748b",marginTop:4,marginBottom:4}}>{taskForm.patientUhids.length}/8 selected</div>
            <div className="hms-modal-foot"><button className="hms-cancel-btn" onClick={()=>{setShowTaskModal(false);setEditTask(null);}}>Cancel</button><button className="hms-save-btn" onClick={saveTask}>{editTask?"Update Task":"Assign Task"}</button></div>
          </div>
        </div>
      )}

      {/* ══ DEPARTMENT MODAL ══ */}
      {showDeptModal&&(<div className="hms-modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowDeptModal(false)}><div className="hms-modal-box" style={{width:420}}><div className="hms-modal-title">Create New Department</div><label className="hms-lbl">Name *</label><input className="hms-inp" placeholder="E.g. Radiology" value={deptForm.name} onChange={e=>setDeptForm(f=>({...f,name:e.target.value}))}/><label className="hms-lbl">Description</label><input className="hms-inp" placeholder="Brief description" value={deptForm.description} onChange={e=>setDeptForm(f=>({...f,description:e.target.value}))}/><label className="hms-lbl">HOD (optional)</label><input className="hms-inp" placeholder="Name of HOD" value={deptForm.head} onChange={e=>setDeptForm(f=>({...f,head:e.target.value}))}/><div className="hms-modal-foot"><button className="hms-cancel-btn" onClick={()=>setShowDeptModal(false)}>Cancel</button><button className="hms-save-btn" onClick={saveDepartment}>Create</button></div></div></div>)}

      {/* ══ EMPLOYEE MODAL ══ */}
      {showEmpModal&&(<div className="hms-modal-overlay" onClick={e=>e.target===e.currentTarget&&(setShowEmpModal(false),setEmpPassErr(""),setEditEmpId(null))}><div className="hms-modal-box" style={{width:520}}><div className="hms-modal-title">{editEmpId?"Edit Employee Details":"Create New Employee"}</div><div className="hms-g2">{[["Full Name","fullName","text","Jane Doe"],["Username","username","text","jane.doe"],["Employee ID","empId","text","EMP-001"],["Email","email","email","jane@hospital.com"],["Phone","phone","tel","+91 98765 43210"]].map(([lbl,k,type,ph])=>(<div key={k}><label className="hms-lbl">{lbl}</label><input type={type} placeholder={ph} value={empForm[k]} className="hms-inp" onChange={e=>{setEmpForm(f=>({...f,[k]:e.target.value}));setEmpPassErr("");}} disabled={k==="username"&&!!editEmpId}/></div>))}</div><label className="hms-lbl">Access Role</label><select className="hms-sel" value={empForm.role} onChange={e=>{ const nr=e.target.value; const nd=EMPLOYEE_ROLE_OPTIONS.find(o=>o.value===nr)?.label||empForm.dept; setEmpForm(f=>({...f,role:nr,dept:nd})); }}>{EMPLOYEE_ROLE_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select><label className="hms-lbl">Department</label><select className="hms-sel" value={empForm.dept} onChange={e=>setEmpForm(f=>({...f,dept:e.target.value}))}>{allDeptOptions.map(d=><option key={d}>{d}</option>)}</select><div className="hms-g2">{[["Password","password",empShowPass,setEmpShowPass],["Confirm Password","confirmPassword",empShowConfirm,setEmpShowConfirm]].map(([lbl,k,show,setShow])=>(<div key={k}><label className="hms-lbl">{lbl}{editEmpId&&<span style={{fontSize:9}}> (Leave blank to keep current)</span>}</label><div className="hms-pass-wrap"><input type={show?"text":"password"} placeholder={editEmpId?"Leave blank to keep current":"••••••••"} value={empForm[k]} className="hms-inp" style={{paddingRight:50}} onChange={e=>{setEmpForm(f=>({...f,[k]:e.target.value}));setEmpPassErr("");}}/><button type="button" className="hms-pass-toggle" onClick={()=>setShow(p=>!p)}>{show?"HIDE":"SHOW"}</button></div></div>))}</div>{empPassErr&&<div className="hms-err-text">{empPassErr}</div>}<div className="hms-modal-foot"><button className="hms-cancel-btn" onClick={()=>{setShowEmpModal(false);setEmpPassErr("");setEditEmpId(null);}}>Cancel</button><button className="hms-save-btn" onClick={saveEmployee}>{editEmpId?"Save Changes":"Create Employee"}</button></div></div></div>) }
      {/* ══ MED DRAWER — passes medicineMaster + dropdown adder ══ */}
      {showMedModal && editMedPt && (
        <MedDrawer
          editMedPt={editMedPt}
          onClose={()=>{setShowMedModal(false);setEditMedPt(null);}}
          updateMed={updateMed}
          addMedRow={addMedRow}
          delMedRow={delMedRow}
          saveMeds={saveMeds}
          fmt={fmt}
          canEditRate={true}
          // Pass these so MedDrawer can render the searchable dropdown
          medicineMaster={medicineMaster}
          onAddFromMaster={addMedFromDropdownToDrawer}
          MedSearchDropdown={MedSearchDropdown}
          isDark={isDark}
          accent={accent}
        />
      )}

      {/* ══ VIEW SUMMARY MODAL ══ */}
      {showViewModal&&viewPt&&(<div className="hms-modal-overlay" onClick={e=>e.target===e.currentTarget&&(setShowViewModal(false),setViewPt(null))}><div className="hms-modal-box" style={{width:640}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}><div><div className="hms-modal-title">Discharge Summary</div><div style={{display:"flex",alignItems:"center",gap:8}}><SummaryPill type={viewPt.dischargeSummary?.type} p={viewPt}/><span className="hms-td-mono">{viewPt.uhid}</span></div></div><button className="hms-logout-btn" onClick={()=>{setShowViewModal(false);setViewPt(null);}}>✕</button></div><div className="hms-stat-card" style={{padding:"12px 14px",marginBottom:14,border:"1px solid #f59e0b18"}}><div style={{display:"flex",gap:14,flexWrap:"wrap"}}>{[["Patient",viewPt.patientName||viewPt.name],["Age/Gender",`${viewPt.ageYY||viewPt.age}Y / ${viewPt.gender}`],["Blood Group",viewPt.bloodGroup||"—"],["Phone",viewPt.phone||"—"],["Admit Date",fmtDt(viewPt.admissions?.[0]?.dateTime)]].map(([k,v])=>(<div key={k}><div className="hms-view-key">{k}</div><div className="hms-view-val" style={{fontWeight:700}}>{v}</div></div>))}</div></div><div className="hms-section-label">Clinical Details</div>{[["Diagnosis",viewPt.dischargeSummary?.diagnosis],["Treatment",viewPt.dischargeSummary?.treatment],["Treating Doctor",viewPt.dischargeSummary?.doctorName],["Discharge Date",fmtDt(viewPt.dischargeSummary?.date)],["Follow-up",viewPt.dischargeSummary?.followUp],["Notes",viewPt.dischargeSummary?.notes]].map(([k,v])=>(<div key={k} className="hms-view-row"><div className="hms-view-key">{k}</div><div className="hms-view-val" style={{color:v&&v!=="—"?"inherit":"#64748b",fontStyle:v&&v!=="—"?"normal":"italic"}}>{v||"Not set"}</div></div>))}<div className="hms-modal-foot"><button className="hms-cancel-btn" onClick={()=>{setShowViewModal(false);setViewPt(null);}}>Close</button><ActionBtn col={accent} onClick={()=>{setShowViewModal(false);openSummaryEditor(viewPt);}}>✎ Edit</ActionBtn><button className="hms-save-btn" onClick={()=>handlePrintSummary(viewPt)}>↓ Download</button></div></div></div>)}


      {/* ══ DELETE CONFIRM ══ */}
      {showDeleteConfirm&&deletePt&&(<div className="hms-modal-overlay" onClick={e=>e.target===e.currentTarget&&(setShowDeleteConfirm(false),setDeletePt(null))}><div className="hms-modal-box" style={{width:380}}><div className="hms-modal-title" style={{color:"#f87171"}}>Clear Discharge Summary?</div><div style={{fontSize:12,color:"#94a3b8",marginBottom:18,lineHeight:1.6}}>This will reset the discharge summary for <strong>{deletePt.patientName||deletePt.name}</strong> ({deletePt.uhid}). This action cannot be undone.</div><div className="hms-modal-foot"><button className="hms-cancel-btn" onClick={()=>{setShowDeleteConfirm(false);setDeletePt(null);}}>Cancel</button><button className="hms-danger-btn" onClick={doDeleteSummary}>Yes, Clear Summary</button></div></div></div>)}

      {/* ══ REPORTS MODAL (legacy — for Patients page quick edit) ══ */}
      {showReportModal&&editRepPt&&(
        <div className="hms-modal-overlay" onClick={e=>e.target===e.currentTarget&&(setShowReportModal(false),setEditRepPt(null))}>
          <div className="hms-modal-box" style={{width:750,maxHeight:"90vh",overflowY:"auto"}}>
            <div className="hms-modal-title" style={{marginBottom:16}}>Lab Reports — {editRepPt.patientName||editRepPt.name}</div>
            {!(editRepPt.reports||[]).length&&<div className="hms-empty" style={{padding:"1rem"}}>No reports found.</div>}
            {(editRepPt.reports||[]).map((rep,rIdx)=>(
              <div key={rIdx} style={{background:isDark?"#080c18":"#f8fafc",border:`1px solid ${isDark?"#1a2540":"#e2e8f0"}`,borderRadius:10,padding:16,marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
                  <input className="hms-inp" style={{fontWeight:700,fontSize:15,width:"50%"}} value={rep.reportName||rep.name||""} onChange={e=>{const r=[...editRepPt.reports];r[rIdx]={...r[rIdx],reportName:e.target.value};setEditRepPt({...editRepPt,reports:r});}} placeholder="Report Name"/>
                  <div style={{display:"flex",gap:10}}><input className="hms-inp" type="date" value={rep.date||""} onChange={e=>{const r=[...editRepPt.reports];r[rIdx]={...r[rIdx],date:e.target.value};setEditRepPt({...editRepPt,reports:r});}}/><ActionBtn col="#f87171" onClick={()=>delReport(rIdx)}>✕ Delete</ActionBtn></div>
                </div>
                <div style={{overflowX:"auto",marginBottom:10}}>
                  <table style={{width:"100%",fontSize:12,borderCollapse:"collapse"}}>
                    <thead><tr style={{color:"#64748b",borderBottom:`1px solid ${isDark?"#1a2540":"#e2e8f0"}`}}><th style={{padding:6,textAlign:"left"}}>Test Name</th><th style={{padding:6,textAlign:"left"}}>Result</th><th style={{padding:6,textAlign:"left"}}>Unit</th><th style={{padding:6,textAlign:"left"}}>Ref Range</th><th style={{padding:6}}>✕</th></tr></thead>
                    <tbody>{(rep.tests||[]).map((test,tIdx)=>(<tr key={tIdx} style={{borderBottom:`1px solid ${isDark?"#0f172a":"#f1f5f9"}`}}>
                      <td style={{padding:4}}><input className="hms-inp-sm" style={{width:"100%"}} value={test.name||""} onChange={e=>{const r=[...editRepPt.reports];r[rIdx].tests[tIdx]={...r[rIdx].tests[tIdx],name:e.target.value};setEditRepPt({...editRepPt,reports:r});}}/></td>
                      <td style={{padding:4}}><input className="hms-inp-sm" style={{width:"100%",color:"#38bdf8",fontWeight:600}} value={test.result||test.value||""} onChange={e=>{const r=[...editRepPt.reports];r[rIdx].tests[tIdx]={...r[rIdx].tests[tIdx],result:e.target.value,value:e.target.value};setEditRepPt({...editRepPt,reports:r});}}/></td>
                      <td style={{padding:4}}><input className="hms-inp-sm" style={{width:"100%"}} value={test.unit||""} onChange={e=>{const r=[...editRepPt.reports];r[rIdx].tests[tIdx]={...r[rIdx].tests[tIdx],unit:e.target.value};setEditRepPt({...editRepPt,reports:r});}}/></td>
                      <td style={{padding:4}}><input className="hms-inp-sm" style={{width:"100%"}} value={test.refRange||""} onChange={e=>{const r=[...editRepPt.reports];r[rIdx].tests[tIdx]={...r[rIdx].tests[tIdx],refRange:e.target.value};setEditRepPt({...editRepPt,reports:r});}}/></td>
                      <td style={{padding:4,textAlign:"center"}}><button style={{background:"none",border:"none",color:"#f87171",cursor:"pointer"}} onClick={()=>{const r=[...editRepPt.reports];r[rIdx].tests=r[rIdx].tests.filter((_,i)=>i!==tIdx);setEditRepPt({...editRepPt,reports:r});}}>✕</button></td>
                    </tr>))}</tbody>
                  </table>
                  <button style={{fontSize:11,color:accent,background:"none",border:"none",marginTop:8,cursor:"pointer",fontWeight:600}} onClick={()=>{const r=[...editRepPt.reports];if(!r[rIdx].tests)r[rIdx].tests=[];r[rIdx].tests.push({name:"",result:"",value:"",unit:"",refRange:""});setEditRepPt({...editRepPt,reports:r});}}>+ Add Custom Test Row</button>
                </div>
                <textarea className="hms-textarea" rows={2} placeholder="Remarks / Notes" value={rep.remarks||""} onChange={e=>{const r=[...editRepPt.reports];r[rIdx]={...r[rIdx],remarks:e.target.value};setEditRepPt({...editRepPt,reports:r});}} style={{width:"100%",marginTop:8}}/>
              </div>
            ))}
            <div className="hms-section-label" style={{marginTop:16}}>Add New Report</div>
            <div className="hms-g3" style={{alignItems:"center"}}>
              <select className="hms-sel" value={newReport.type||""} onChange={e=>{const type=e.target.value;const template=LAB_TEMPLATES[type]||{tests:[],defaultRemarks:""};setNewReport({...newReport,type,name:type,tests:template.tests.map(t=>({name:t.name,result:"",value:"",unit:t.unit,refRange:t.refRange})),remarks:template.defaultRemarks});}}>
                <option value="">-- Pre-fill Template --</option>{Object.keys(LAB_TEMPLATES).map(k=><option key={k} value={k}>{k}</option>)}
              </select>
              <input className="hms-inp" placeholder="Or type custom name..." value={newReport.name||""} onChange={e=>setNewReport(f=>({...f,name:e.target.value}))}/>
              <ActionBtn col={accent} onClick={()=>{ if(!newReport.name) return; const newRep={id:Date.now(),reportName:newReport.name,date:new Date().toISOString().slice(0,10),remarks:newReport.remarks||"",tests:newReport.tests||[]}; setEditRepPt(prev=>({...prev,reports:[...(prev.reports||[]),newRep]})); setNewReport({name:"",type:"",tests:[],remarks:""}); }}>+ Add Report</ActionBtn>
            </div>
            <div className="hms-modal-foot" style={{marginTop:24}}><button className="hms-cancel-btn" onClick={()=>{setShowReportModal(false);setEditRepPt(null);}}>Cancel</button><button className="hms-save-btn" onClick={saveReports}>💾 Save All Reports</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
