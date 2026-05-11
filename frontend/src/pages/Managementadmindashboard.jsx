import * as XLSX from "xlsx";
import MedDrawer from "../components/MedDrawer";
import { useState, useMemo, useEffect, useRef } from "react";
import { apiService, BASE_URL } from "../services/apiService";
import { useTheme } from "../context/ThemeContext";
import ThemeModeDock from "../components/ui/ThemeModeDock";
import UpdateRecordsPanel from "../components/admin/UpdateRecordsPanel";
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

const normalizeSummaryType = (t) => {
  const u = String(t||"NORMAL").toUpperCase();
  if (u.startsWith("REFER")) return "REFER";
  if (u==="DAMA") return "DOPR";
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
      { name:"M C V (Mean Corp Volume)", unit:"Fl/dl", refRange:"76-96" },
      { name:"M C H (Mean Corp Hb)", unit:"Pg/dl", refRange:"27-32" },
      { name:"M C H C (Mean Corp Hb Conc)", unit:"gm/dl", refRange:"31-38" },
      { name:"R B C (Red Blood Cell Count)", unit:"mill/cumm", refRange:"3.5-5.5" },
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
      { name:"TCO2", unit:"mmol/L", refRange:"23-27" },
      { name:"HCO3", unit:"mmol/L", refRange:"22-26" },
      { name:"BE", unit:"mmol/L", refRange:"-2 to +2" },
      { name:"%SO2C", unit:"%", refRange:"96-97" },
      { name:"Na+", unit:"mmol/L", refRange:"134-146" },
      { name:"K+", unit:"mmol/L", refRange:"3.4-5.0" },
      { name:"Cl", unit:"mmol/L", refRange:"1.15-1.33" },
      { name:"GLU", unit:"mmol/L", refRange:"74-100" },
      { name:"THbc", unit:"%", refRange:"12-16" },
      { name:"HCT", unit:"mmol/L", refRange:"38-51" },
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
      { name:"Antigen AH (1:20 to 1:320)",unit:"",refRange:"Negative" },
      { name:"Antigen BH (1:20 to 1:320)",unit:"",refRange:"Negative" },
      { name:"RESULT",unit:"",refRange:"POSITIVE / NEGATIVE" },
    ],
    defaultRemarks:"INTERPRETATION: Antibody titer of 1:80 or higher suggests infection."
  },
  "Malaria Antigen Test": {
    tests:[{name:"PLASMODIUM P. VIVAX",unit:"",refRange:"NEGATIVE"},{name:"PLASMODIUM FALCIPARUM",unit:"",refRange:"NEGATIVE"}],
    defaultRemarks:"PRINCIPLE OF TEST: The test uses two antibodies."
  },
  "Typhi Dot (IgG & IgM)": {
    tests:[{name:"THYPIDOT TEST FOR S.TYPHI IgM",unit:"",refRange:"POSITIVE / NEGATIVE"},{name:"THYPIDOT TEST FOR S.TYPHI IgG",unit:"",refRange:"POSITIVE / NEGATIVE"}],
    defaultRemarks:"COMMENTS: The typhidot test is based on dot enzyme immunosorbant assay."
  },
  "Dengue (IgM & IgG)": {
    tests:[{name:"DENGUE IgM ANTIBODIES",unit:"",refRange:"NON-REACTIVE"},{name:"DENGUE IgG ANTIBODIES",unit:"",refRange:"NON-REACTIVE"}],
    defaultRemarks:"REMARKS: Dengue viruses are mosquito-born viruses."
  },
  "Dengue NS1 Antigen Test": { tests:[{name:"DENGUE NS1 ANTIGEN",unit:"",refRange:"NON-REACTIVE"}], defaultRemarks:"REMARKS: NS1 antigen is an non-structural protein." },
  "Viral Markers (HIV, HBsAg, HCV)": {
    tests:[{name:"HIV I & II",unit:"",refRange:"NEGATIVE"},{name:"HEPATITIS B (HbsAg)",unit:"",refRange:"NEGATIVE"},{name:"HCV",unit:"",refRange:"NEGATIVE"}],
    defaultRemarks:"***End Of The Report***"
  },
  "COVID-19 Rapid Antigen": { tests:[{name:"COVID-19(Ag)",unit:"",refRange:"NON-REACTIVE"}], defaultRemarks:"***End Of The Report***" },
  "Urine Examination (Routine)": {
    tests: [
      { name:"COLOUR",unit:"",refRange:"Pale Yellow" },
      { name:"VOLUME",unit:"ml",refRange:"" },
      { name:"SPECIFIC GRAVITY",unit:"",refRange:"1.005-1.030" },
      { name:"REACTION",unit:"",refRange:"ACIDIC" },
      { name:"ALBUMIN",unit:"",refRange:"NIL" },
      { name:"SUGAR",unit:"",refRange:"NIL" },
      { name:"PH",unit:"",refRange:"4.5-8.0" },
      { name:"PUS CELLS",unit:"/HPF",refRange:"0-5" },
      { name:"EPITHELIAL CELLS",unit:"/HPF",refRange:"0-5" },
      { name:"RBC'S",unit:"/HPF",refRange:"NIL" },
      { name:"CASTS",unit:"",refRange:"NIL" },
      { name:"CRYSTALS",unit:"",refRange:"NIL" },
      { name:"BACTERIA",unit:"",refRange:"NIL" },
    ],
    defaultRemarks:"***End Of The Report***"
  },
  "Blood Group & Rh Factor": { tests:[{name:"Blood Group",unit:"",refRange:""},{name:"Rh Factor",unit:"",refRange:""}], defaultRemarks:"***End Of The Report***" },
  "HbA1c (Glycosylated Hemoglobin)": {
    tests:[{name:"HBA1C",unit:"%",refRange:"4.30-6.40"},{name:"MEAN PLASMA GLUCOSE",unit:"mg/dl",refRange:"70-140"}],
    defaultRemarks:"METHOD : HIGH PERFORMANCE LIQUID CHROMATOGRAPHY (HPLC)"
  },
  "D-Dimer": { tests:[{name:"D-DIMER",unit:"µgFEU/mL",refRange:"<0.5"}], defaultRemarks:"Physiological basis: D-dimer is one of the terminal fibrin degradation products." },
  "Cardiac Markers (Trop-T, Trop-I, CPK)": {
    tests:[{name:"TROPONIN-T",unit:"",refRange:"NEGATIVE"},{name:"TROPONIN-I",unit:"",refRange:"NEGATIVE"},{name:"CPK-MB",unit:"IU/L",refRange:"upto 24"},{name:"CPK",unit:"U/L",refRange:"22-198"},{name:"NT-proBNP",unit:"pg/ml",refRange:"10-157"}],
    defaultRemarks:"***End Of The Report***"
  },
  "Total Thyroid Profile": {
    tests:[{name:"T3",unit:"pmol/l",refRange:"0.9-2.5"},{name:"Free Thyroxine (FT4)",unit:"pmol/l",refRange:"60-135"},{name:"Thyroid Stimulation Hormone (TSH)",unit:"pmol/l",refRange:"0.25-5.0"}],
    defaultRemarks:"Method: Enzyme linked fluorescent assay."
  },
  "Stool Examination": {
    tests:[{name:"COLOUR",unit:"",refRange:"BROWNISH"},{name:"CONSISTANCY",unit:"",refRange:"SOFT"},{name:"MUCOUS",unit:"",refRange:"NIL"},{name:"PH",unit:"",refRange:"7.0 - 7.8"},{name:"REACTION",unit:"",refRange:"ACIDIC/ALKALINE"},{name:"PUS CELLS",unit:"/HPF",refRange:"0-1"},{name:"RED BLOOD CELLS",unit:"/HPF",refRange:"NIL"},{name:"OVA",unit:"",refRange:"NIL"},{name:"CYST",unit:"",refRange:"NIL"},{name:"BACTERIA",unit:"",refRange:"NIL"}],
    defaultRemarks:"***End Of The Report***"
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

const DEPT_ICONS = {
  HOD:"👔", Billing:"💳", Uploading:"☁️", Intimation:"📢",
  Query:"❓", OPD:"🏥", Doctor:"🩺", Nursing:"💉",
  "Quality Analyst":"📊", Notes:"📝",
};
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
const fmt    = (n)   => "₹" + Number(n).toLocaleString("en-IN");
const fmtDt  = (iso) => iso ? new Date(iso).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "—";
const initials = (name="") => name.trim().split(" ").filter(Boolean).map(w=>w[0]).join("").slice(0,2).toUpperCase();
const safeLoad = (key,fb) => { try { return JSON.parse(localStorage.getItem(key)||"null")||fb; } catch { return fb; } };
const safeSave = (key,val) => { try { localStorage.setItem(key,JSON.stringify(val)); } catch {} };

const mapTaskFromApi = (task) => ({
  id: task.id,
  title: task.title,
  description: task.description||"",
  assignedToId: task.assigned_to,
  assignedTo: task.assigned_to_name||"—",
  department: task.department,
  priority: task.priority,
  status: task.status,
  dueDate: task.due_date ? task.due_date.slice(0,10) : "",
  createdAt: task.created_at,
  updatedAt: task.updated_at,
  completedAt: task.status==="Completed" ? task.updated_at : "",
  patientName: task.patient_name||task.patient_names?.[0]||"",
  patientUhid: task.patient_uhid||task.patient_uhids?.[0]||"",
  patientNames: task.patient_names||(task.patient_name?[task.patient_name]:[]),
  patientUhids: task.patient_uhids||(task.patient_uhid?[task.patient_uhid]:[]),
  patientDetail: task.patient_detail||task.patientDetail||null,
  createdBy: task.assigned_by_name||"—",
});

// ── EXPORT UTILS ──────────────────────────────────────────────────────────────
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
function exportTxt(filename,content) {
  const a = document.createElement("a"); a.href=URL.createObjectURL(new Blob([content],{type:"text/plain"})); a.download=filename; a.click();
}

// ── DYNAMIC CSS ────────────────────────────────────────────────────────────────
const DYNAMIC_CSS = (accent,isDark) => `
  option { background: var(--surface); color: var(--text); }
  body { background: var(--bg); color: var(--text); }
  ::-webkit-scrollbar-thumb { background: var(--border-strong); }
  .hms-hdr        { background: var(--surface); }
  .hms-logo-text  { color: var(--text); }
  .hms-logo-sub   { color: var(--text-muted); }
  .hms-role-badge { background: ${accent}18; border: 1px solid ${accent}30; color: ${accent}; }
  .hms-avatar     { background: linear-gradient(135deg, ${accent}, #818cf8); }
  .hms-big-avatar { background: linear-gradient(135deg, ${accent}, #818cf8); }
  .hms-avatar-pill {
    background: ${isDark?"rgba(255,255,255,.05)":"rgba(0,0,0,.05)"};
    border: 1px solid ${isDark?"#1e2a3a":"#dde8f5"};
  }
  .hms-avatar-name { color: ${isDark?"#94a3b8":"#475569"}; }
  .hms-logout-btn { border: 1px solid ${isDark?"#1e2a3a":"#dde8f5"}; color: ${isDark?"#64748b":"#64748b"}; }
  .hms-wrap { background: var(--bg); color: var(--text); }
  .hms-sb { background: var(--sidebar); border-right: 1px solid var(--sidebar-border); }
  .hms-nav-section { color: ${isDark?"#2d3a50":"#94a3b8"}; }
  .hms-nav-item { color: ${isDark?"#64748b":"#64748b"}; }
  .hms-nav-item:hover { color: ${isDark?"#f1f5f9":"#0f172a"}; background: ${isDark?"rgba(0,0,0,.05)":"rgba(0,0,0,.05)"}; }
  .hms-nav-item.active { color: ${isDark?"#f1f5f9":"#0f172a"}; background: ${isDark?"rgba(0,0,0,.05)":"rgba(0,0,0,.05)"}; border-left: 2px solid ${accent}; font-weight: 600; }
  .hms-signed-in   { color: ${isDark?"#2d3a50":"#94a3b8"}; }
  .hms-signed-name { color: ${isDark?"#94a3b8":"#475569"}; }
  .hms-signed-role { color: ${isDark?"#64748b":"#64748b"}; }
  .hms-branch-label  { color: ${isDark?"#2d3a50":"#94a3b8"}; }
  .hms-branch-select { border: 1px solid ${isDark?"#1a2540":"#c7d5eb"}; background-color: ${isDark?"#0b1120":"#ffffff"}; color: ${isDark?"#e2e8f0":"#1e293b"}; }
  .hms-pg-label { color: ${isDark?"#2d3a50":"#94a3b8"}; }
  .hms-pg-sub   { color: ${isDark?"#64748b":"#64748b"}; }
  .hms-card       { background: var(--card); border-color: var(--border); }
  .hms-card-title { color: var(--text); }
  .hms-prof-card  { background: var(--card); }
  .hms-stat-card  { background: var(--card); border-color: var(--border); }
  .hms-stat-label { color: var(--text-muted); }
  .hms-th     { color: var(--text-muted); }
  .hms-td     { color: var(--text-mid); }
  .hms-td-hi  { color: var(--text); }
  .hms-td-mono { color: var(--text-muted); }
  .hms-td-sm  { color: var(--text-muted); }
  .hms-add-btn     { background: linear-gradient(135deg, ${accent}, ${accent}cc); }
  .hms-add-btn-lg  { background: linear-gradient(135deg, ${accent}, ${accent}cc); }
  .hms-cancel-btn  { color: ${isDark?"#64748b":"#64748b"}; }
  .hms-save-btn    { background: linear-gradient(135deg, ${accent}, ${accent}cc); }
  .hms-export-main-btn { background: linear-gradient(135deg, ${accent}, ${accent}cc); }
  .hms-lbl      { color: ${isDark?"#64748b":"#64748b"}; }
  .hms-inp      { background: var(--input-bg); color: var(--text); border-color: var(--input-border); }
  .hms-inp-sm   { background: var(--input-bg); color: var(--text); border-color: var(--input-border); }
  .hms-sel      { background: var(--input-bg); color: var(--text); border-color: var(--input-border); }
  .hms-textarea { background: var(--input-bg); color: var(--text); border-color: var(--input-border); }
  .hms-pass-toggle { color: ${isDark?"#64748b":"#64748b"}; }
  .hms-modal-overlay { background: var(--modal-overlay); }
  .hms-modal-box     { background: var(--modal-bg); border-color: var(--modal-border); }
  .hms-modal-title   { color: var(--text); }
  .hms-empty       { color: ${isDark?"#2d3a50":"#94a3b8"}; }
  .hms-view-key    { color: ${isDark?"#64748b":"#64748b"}; }
  .hms-view-val    { color: ${isDark?"#e2e8f0":"#1e293b"}; }
  .hms-section-label { color: ${isDark?"#2d3a50":"#94a3b8"}; }
  .hms-dept-card   { background: ${isDark?"#0b1120":"#ffffff"}; }
  .hms-progress-bar    { background: ${isDark?"#1e2a3a":"#dde8f5"}; }
  .hms-progress-bar-sm { background: ${isDark?"#1e2a3a":"#dde8f5"}; }
  .hms-patient-select-box {
    background: ${isDark?"#080c18":"#f8faff"};
    border: 1px solid ${isDark?"#1a2540":"#c7d5eb"};
    border-radius: 8px; max-height: 150px; overflow-y: auto; margin-top: 4px;
  }
  .hms-patient-select-item {
    padding: 7px 12px; cursor: pointer; font-size: 11px;
    display: flex; justify-content: space-between; align-items: center;
    border-bottom: 1px solid ${isDark?"#1a2540":"#e8eef8"}; transition: background 0.15s;
  }
  .hms-patient-select-item:last-child { border-bottom: none; }
  .hms-patient-select-item:hover { background: ${accent}18; }
  .hms-patient-select-item.selected { background: ${accent}22; border-left: 3px solid ${accent}; }
  .hms-patient-selected-pill {
    display: inline-flex; align-items: center; gap: 6px;
    background: ${accent}18; border: 1px solid ${accent}40; color: ${accent};
    border-radius: 20px; padding: 4px 10px; font-size: 11px; font-weight: 600; margin-top: 6px;
  }
  .hms-patient-clear-btn { background: none; border: none; color: ${accent}; cursor: pointer; font-size: 13px; line-height: 1; padding: 0; opacity: 0.7; }
  .hms-patient-clear-btn:hover { opacity: 1; }
  .hms-patient-search {
    background: ${isDark?"#080c18":"#ffffff"}; color: ${isDark?"#e2e8f0":"#1e293b"};
    border: 1px solid ${isDark?"#1a2540":"#c7d5eb"}; border-radius: 6px;
    padding: 6px 10px; font-size: 11px; width: 100%; box-sizing: border-box; margin-bottom: 4px; outline: none;
  }
  .hms-patient-search:focus { border-color: ${accent}; }
  .hms-mh-pill {
    display: inline-flex; align-items: center; font-size: 11px; padding: 3px 10px;
    border-radius: 12px; background: rgba(56,189,248,0.12); color: #38bdf8;
    border: 1px solid rgba(56,189,248,0.3); cursor: pointer; transition: background 0.15s;
  }
  .hms-mh-pill:hover { background: rgba(56,189,248,0.25); }
  .hms-med-inline-input {
    background: var(--input-bg); color: var(--text); border: 1px solid var(--input-border);
    border-radius: 6px; padding: 4px 8px; font-size: 12px; outline: none; transition: border-color 0.15s;
  }
  .hms-med-inline-input:focus { border-color: ${accent}; }

  /* ── BILLING ── */
  .bill-page-wrap {
    display: flex; gap: 18px; align-items: flex-start;
  }
  .bill-patient-list {
    width: 240px; flex-shrink: 0;
    background: ${isDark?"#0b1120":"#f8faff"};
    border: 1px solid ${isDark?"#1a2540":"#c7d5eb"};
    border-radius: 10px; overflow: hidden;
  }
  .bill-patient-list-head {
    padding: 10px 14px; font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: .08em; color: ${accent};
    border-bottom: 1px solid ${isDark?"#1a2540":"#c7d5eb"};
    background: ${isDark?"#080c18":"#eef3fc"};
  }
  .bill-patient-item {
    padding: 10px 14px; cursor: pointer; border-bottom: 1px solid ${isDark?"#111827":"#e8eef8"};
    transition: background 0.15s;
  }
  .bill-patient-item:last-child { border-bottom: none; }
  .bill-patient-item:hover { background: ${accent}12; }
  .bill-patient-item.active { background: ${accent}20; border-left: 3px solid ${accent}; }
  .bill-patient-name { font-size: 12px; font-weight: 600; color: ${isDark?"#e2e8f0":"#1e293b"}; }
  .bill-patient-uhid { font-size: 10px; color: ${isDark?"#475569":"#64748b"}; margin-top: 2px; }
  .bill-patient-badge { font-size: 9px; padding: 2px 6px; border-radius: 8px; margin-top: 4px; display: inline-block; }
  .bill-detail-pane { flex: 1; min-width: 0; }

  /* BILL PRINT CARD */
  .bill-print-card {
    background: ${isDark?"#0b1120":"#ffffff"};
    border: 1px solid ${isDark?"#1a2540":"#c7d5eb"};
    border-radius: 12px; padding: 28px; font-family: 'Courier New', monospace;
  }
  .bill-print-header {
    display: flex; justify-content: space-between; align-items: flex-start;
    padding-bottom: 16px; border-bottom: 2px solid ${isDark?"#1e2a3a":"#c7d5eb"}; margin-bottom: 18px;
  }
  .bill-print-hospital-name {
    font-size: 20px; font-weight: 800; color: ${isDark?"#f1f5f9":"#0f172a"};
    letter-spacing: -.02em; font-family: sans-serif;
  }
  .bill-print-branch {
    font-size: 10px; color: ${isDark?"#64748b":"#64748b"}; margin-top: 3px; line-height: 1.5;
  }
  .bill-print-title {
    text-align: right;
  }
  .bill-print-title-main {
    font-size: 18px; font-weight: 900; color: ${accent}; font-family: sans-serif; letter-spacing: .05em;
  }
  .bill-print-title-sub {
    font-size: 10px; color: ${isDark?"#64748b":"#64748b"}; margin-top: 2px;
  }
  .bill-info-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 1px;
    border: 1px solid ${isDark?"#1e2a3a":"#c7d5eb"}; border-radius: 6px; overflow: hidden;
    margin-bottom: 18px;
  }
  .bill-info-cell {
    padding: 7px 12px;
    border-right: 1px solid ${isDark?"#1e2a3a":"#c7d5eb"};
    border-bottom: 1px solid ${isDark?"#1e2a3a":"#c7d5eb"};
    background: ${isDark?"#0b1120":"#ffffff"};
  }
  .bill-info-cell:nth-child(even) { border-right: none; }
  .bill-info-label { font-size: 9px; font-weight: 700; color: ${isDark?"#475569":"#94a3b8"}; text-transform: uppercase; letter-spacing: .05em; }
  .bill-info-value { font-size: 12px; color: ${isDark?"#e2e8f0":"#1e293b"}; font-weight: 600; margin-top: 2px; }
  .bill-info-value-edit {
    font-size: 12px; color: ${isDark?"#e2e8f0":"#1e293b"}; font-weight: 600; margin-top: 2px;
    background: transparent; border: 1px dashed transparent; border-radius: 4px;
    width: 100%; outline: none; padding: 1px 4px; transition: border-color 0.15s;
  }
  .bill-info-value-edit:focus { border-color: ${accent}; background: ${isDark?"#080c18":"#f0f9ff"}; }
  .bill-services-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  .bill-services-table th {
    padding: 8px 10px; text-align: left; font-size: 10px; font-weight: 700;
    text-transform: uppercase; letter-spacing: .06em;
    background: ${isDark?"#0f172a":"#f1f5f9"}; color: ${isDark?"#64748b":"#64748b"};
    border: 1px solid ${isDark?"#1e2a3a":"#c7d5eb"};
  }
  .bill-services-table td {
    padding: 7px 10px; font-size: 12px; border: 1px solid ${isDark?"#1e2a3a":"#e2e8f0"};
    color: ${isDark?"#e2e8f0":"#1e293b"};
  }
  .bill-services-table td input {
    background: transparent; border: 1px dashed transparent; border-radius: 4px;
    font-size: 12px; color: ${isDark?"#e2e8f0":"#1e293b"}; width: 100%; padding: 2px 4px;
    outline: none; transition: border-color 0.15s;
  }
  .bill-services-table td input:focus { border-color: ${accent}; background: ${isDark?"#080c18":"#f0f9ff"}; }
  .bill-totals-section {
    display: flex; justify-content: flex-end; margin-bottom: 20px;
  }
  .bill-totals-box {
    width: 280px; border: 1px solid ${isDark?"#1e2a3a":"#c7d5eb"}; border-radius: 8px; overflow: hidden;
  }
  .bill-total-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 7px 14px; border-bottom: 1px solid ${isDark?"#1e2a3a":"#e2e8f0"};
    font-size: 12px;
  }
  .bill-total-row:last-child { border-bottom: none; }
  .bill-total-row.net {
    background: ${accent}15; font-weight: 700; font-size: 14px; padding: 10px 14px;
  }
  .bill-footer-sigs {
    display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 24px;
    padding-top: 16px; border-top: 1px solid ${isDark?"#1e2a3a":"#c7d5eb"};
  }
  .bill-sig-box { text-align: center; }
  .bill-sig-line {
    border-bottom: 1px solid ${isDark?"#1e2a3a":"#94a3b8"}; height: 40px; margin-bottom: 6px;
  }
  .bill-sig-label { font-size: 9px; font-weight: 700; text-transform: uppercase; color: ${isDark?"#64748b":"#94a3b8"}; }
  .bill-add-svc-row {
    display: flex; gap: 8px; align-items: center; padding: 8px 10px;
    border: 1px dashed ${isDark?"#1a2540":"#c7d5eb"}; border-radius: 6px;
    background: ${isDark?"#080c18":"#f8faff"}; margin-top: 6px; margin-bottom: 12px;
  }
  .bill-add-svc-row input {
    background: var(--input-bg); color: var(--text); border: 1px solid var(--input-border);
    border-radius: 5px; padding: 5px 8px; font-size: 11px; outline: none;
  }
  .bill-add-svc-row input:focus { border-color: ${accent}; }

  /* ── REPORTS REDESIGN ── */
  .rep-patient-card {
    background: ${isDark?"#0b1120":"#ffffff"};
    border: 1px solid ${isDark?"#1a2540":"#c7d5eb"};
    border-radius: 10px; margin-bottom: 14px; overflow: hidden;
  }
  .rep-patient-head {
    display: flex; justify-content: space-between; align-items: center;
    padding: 12px 16px; cursor: pointer;
    background: ${isDark?"#080c18":"#f8faff"};
    border-bottom: 1px solid ${isDark?"#1a2540":"#c7d5eb"};
  }
  .rep-patient-head:hover { background: ${accent}10; }
  .rep-patient-info { display: flex; align-items: center; gap: 10px; }
  .rep-patient-avatar {
    width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center;
    justify-content: center; font-size: 12px; font-weight: 700; color: #fff;
    background: linear-gradient(135deg, ${accent}, #818cf8);
  }
  .rep-patient-name { font-size: 13px; font-weight: 700; color: ${isDark?"#e2e8f0":"#1e293b"}; }
  .rep-patient-meta { font-size: 10px; color: ${isDark?"#475569":"#64748b"}; margin-top: 2px; }
  .rep-template-grid {
    display: flex; flex-wrap: wrap; gap: 8px; padding: 14px 16px;
    border-bottom: 1px solid ${isDark?"#1a2540":"#e2e8f0"};
    background: ${isDark?"#0b1120":"#f8faff"};
  }
  .rep-template-btn {
    padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 600;
    cursor: pointer; transition: all 0.15s; border: 1px solid ${accent}40;
    color: ${accent}; background: transparent;
  }
  .rep-template-btn:hover { background: ${accent}15; }
  .rep-template-btn.active { background: ${accent}; color: #fff; border-color: ${accent}; }
  .rep-report-body { padding: 16px; }
  .rep-report-block {
    border: 1px solid ${isDark?"#1a2540":"#c7d5eb"};
    border-radius: 8px; margin-bottom: 14px; overflow: hidden;
  }
  .rep-report-block-head {
    display: flex; justify-content: space-between; align-items: center;
    padding: 10px 14px; background: ${isDark?"#0f172a":"#f1f5f9"};
    border-bottom: 1px solid ${isDark?"#1a2540":"#c7d5eb"};
  }
  .rep-report-block-title { font-size: 13px; font-weight: 700; color: ${isDark?"#e2e8f0":"#1e293b"}; }
  .rep-test-table { width: 100%; border-collapse: collapse; }
  .rep-test-table th {
    padding: 6px 10px; font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: .05em; color: ${isDark?"#475569":"#94a3b8"};
    border-bottom: 1px solid ${isDark?"#1a2540":"#e2e8f0"}; text-align: left;
    background: ${isDark?"#080c18":"#f8faff"};
  }
  .rep-test-table td {
    padding: 7px 10px; font-size: 12px; border-bottom: 1px solid ${isDark?"#111827":"#f1f5f9"};
    color: ${isDark?"#cbd5e1":"#334155"};
  }
  .rep-test-table tr:last-child td { border-bottom: none; }
  .rep-test-input {
    background: transparent; border: 1px dashed transparent; border-radius: 4px;
    font-size: 12px; color: ${isDark?"#38bdf8":"#0284c7"}; font-weight: 600;
    width: 100%; padding: 2px 4px; outline: none; transition: border-color 0.15s;
  }
  .rep-test-input:focus { border-color: ${accent}; background: ${isDark?"#080c18":"#f0f9ff"}; }

  /* Billing tab */
  .hms-billing-tab {
    padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 600;
    cursor: pointer; transition: all 0.2s; border: 1px solid ${accent}50;
  }
  .hms-billing-tab.active { background: ${accent}; color: #fff; border-color: ${accent}; }
  .hms-billing-tab:not(.active) { background: transparent; color: ${accent}; }
`;

// ── PRINT STYLES (injected only during print) ─────────────────────────────────
const BILL_PRINT_CSS = `
  @media print {
    body * { visibility: hidden !important; }
    #bill-print-area, #bill-print-area * { visibility: visible !important; }
    #bill-print-area {
      position: fixed !important; left: 0 !important; top: 0 !important;
      width: 100% !important; z-index: 99999 !important;
      padding: 24px !important; background: #fff !important; color: #000 !important;
    }
    .bill-info-value-edit, .bill-services-table td input {
      border: none !important; background: transparent !important;
    }
    .no-print { display: none !important; }
  }
`;

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function ManagementAdminDashboard({ currentUser, db, locId, onLogout }) {
  const { isDark } = useTheme();
  const userBranchKey = BRANCH_CODE_TO_KEY[String(currentUser?.branch||"").toUpperCase()];
  const locBranchKey  = BRANCH_KEYS.includes(locId) ? locId : null;
  const homeBranch    = userBranchKey||locBranchKey||(currentUser?.locations?.find(l=>BRANCH_KEYS.includes(l))||"laxmi");
  const isOfficeAdmin = String(currentUser?.role||"").toLowerCase()==="office_admin";
  const isSuperAdmin  = String(currentUser?.role||"").toLowerCase()==="superadmin";
  const allowedBranchKeys = BRANCH_KEYS;

  const [viewBranch,  setViewBranch]  = useState(homeBranch);
  const activeBranchCode = BRANCH_KEY_TO_CODE[viewBranch]||"LNM";
  const bc     = BC[viewBranch]||BC.laxmi;
  const accent = bc.accent;

  useEffect(()=>{ if(!allowedBranchKeys.includes(viewBranch)) setViewBranch(homeBranch); },[allowedBranchKeys,viewBranch,homeBranch]);

  const [activeTab,  setActiveTab]  = useState("home");
  const [collapsed,  setCollapsed]  = useState(false);
  const [notif,      setNotif]      = useState(null);
  const [profileForm,setProfileForm]= useState({first_name:"",last_name:"",email:"",phone_number:"",emp_id:""});
  const [allPatients,setAllPatients]= useState({laxmi:[],raya:[]});
  const [employees,      setEmployees]      = useState([]);
  const [showEmpModal,   setShowEmpModal]   = useState(false);
  const [editEmpId,      setEditEmpId]      = useState(null);
  const [empForm,        setEmpForm]        = useState({fullName:"",username:"",empId:"",dept:"HOD",email:"",phone:"",role:"hod",password:"",confirmPassword:""});
  const [empShowPass,    setEmpShowPass]    = useState(false);
  const [empShowConfirm, setEmpShowConfirm] = useState(false);
  const [empPassErr,     setEmpPassErr]     = useState("");
  const [tasks,           setTasks]           = useState([]);
  const [showTaskModal,   setShowTaskModal]   = useState(false);
  const [editTask,        setEditTask]        = useState(null);
  const [taskForm,        setTaskForm]        = useState({title:"",description:"",assignedToId:"",department:"HOD",priority:"Medium",status:"Pending",dueDate:"",patientUhids:[],patientNames:[]});
  const [taskPatientSearch,setTaskPatientSearch]= useState("");
  const [taskReportFilter, setTaskReportFilter]= useState({period:"all",dept:"All",status:"All",empName:""});
  const [departments,   setDepartments]   = useState(()=>safeLoad("hms_mgmt_departments",[]));
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptForm,      setDeptForm]      = useState({name:"",description:"",head:""});

  // ── BILLING STATE (redesigned) ────────────────────────────────────────────
  const [selectedBillPatient, setSelectedBillPatient] = useState(null);
  const [billData, setBillData]     = useState({});   // per (uhid-admNo)
  const [billServices, setBillServices] = useState({}); // per (uhid-admNo)
  const [newSvcRow, setNewSvcRow]   = useState({date:"",cghs:"",desc:"",qty:1,rate:0});
  const billPrintRef = useRef(null);

  // ── REPORTS STATE (redesigned) ────────────────────────────────────────────
  const [expandedRepPatient,setExpandedRepPatient] = useState(null);
  const [activeRepTemplate, setActiveRepTemplate]  = useState({}); // uhid -> template name
  const [patientReports,    setPatientReports]     = useState({}); // uhid -> {reportName -> {tests,remarks,date,saved}}
  const [repLoading,        setRepLoading]         = useState({});
  const [repSaving,         setRepSaving]          = useState({});
  const [selectedReport, setSelectedReport] = useState({});
const [reportSearch, setReportSearch] = useState({});

  const [medSearch, setMedSearch] = useState("");
  const [medicineMaster, setMedicineMaster] = useState([]);
const [selectedMedPatient, setSelectedMedPatient] = useState({});
  const [showMedModal,      setShowMedModal]      = useState(false);
  const [showSummaryModal,  setShowSummaryModal]  = useState(false);
  const [showReportModal,   setShowReportModal]   = useState(false);
  const [showViewModal,     setShowViewModal]      = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editMedPt,         setEditMedPt]         = useState(null);
  const [editSumPt,         setEditSumPt]         = useState(null);
  const [editRepPt,         setEditRepPt]         = useState(null);
  const [viewPt,            setViewPt]            = useState(null);
  const [deletePt,          setDeletePt]          = useState(null);
  const [summaryType,       setSummaryType]       = useState("NORMAL");
  const [summaryContent,    setSummaryContent]    = useState(null);
  const [summaryAdmNo,      setSummaryAdmNo]      = useState(null);
  const [summaryLoading,    setSummaryLoading]    = useState(false);
  const [summarySaving,     setSummarySaving]     = useState(false);
  const [newReport,         setNewReport]         = useState({name:"",date:"",result:""});
  const [dischSumFilter,    setDischSumFilter]    = useState("All");

  const toast = (msg,type="ok") => { setNotif({msg,type}); setTimeout(()=>setNotif(null),3200); };

  useEffect(()=>{ if(db) setAllPatients(db); }, [db]);


  // Load employees on mount so taskAssignableEmployees is populated before task modal opens
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const users = await apiService.getUsers();
        setEmployees(users.map(u => ({
          id:       u.id,
          empId:    u.emp_id || "—",
          username: u.username,
          fullName: `${u.first_name} ${u.last_name}`.trim(),
          name:     `${u.first_name} ${u.last_name}`.trim() || u.username,
          email:    u.email,
          phone:    u.phone_number,
          role:     u.role,
          dept:     u.role.replaceAll("_", " ").replace(/\b\w/g, ch => ch.toUpperCase()),
          status:   u.is_active ? "Active" : "Inactive",
        })));
      } catch (err) {
        console.error("Failed to load employees", err);
      }
    };
    loadEmployees();
  }, []);

  useEffect(() => {

  const loadMedicineMaster = async () => {

    try {

      const res = await fetch(

        `${BASE_URL}/medicine-master/`,
        {
          headers: {
            Authorization:
              `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      const data = await res.json();

      setMedicineMaster(data || []);

    } catch(err) {

      console.error(err);

    }

  };

  loadMedicineMaster();

}, []);

  useEffect(()=>safeSave("hms_mgmt_departments",departments),[departments]);

  const allPatientsFlat   = useMemo(()=>BRANCH_KEYS.flatMap(bk=>(allPatients[bk]||[]).map(p=>({...p,_branch:bk,_branchLabel:BC[bk].label}))),[allPatients]);
  const allDeptOptions    = [...DEPT_OPTIONS,...departments.filter(d=>!DEPT_OPTIONS.includes(d.name)).map(d=>d.name)];
  const locationPatients  = useMemo(()=>isOfficeAdmin?allPatientsFlat:(allPatients[viewBranch]||[]),[isOfficeAdmin,allPatientsFlat,allPatients,viewBranch]);
  const allAdmissions     = useMemo(()=>locationPatients.flatMap(p=>(p.admissions||[]).map(a=>({...a,patientName:p.patientName||p.name,uhid:p.uhid,gender:p.gender,bloodGroup:p.bloodGroup,phone:p.phone}))),[locationPatients]);
  const currentlyAdmitted = allAdmissions.filter(a=>!a.discharge?.dod).length;
  const discharged        = allAdmissions.filter(a=> a.discharge?.dod).length;
  const allPatientsForTask= useMemo(()=>allPatientsFlat.map(p=>({id:p.id,uhid:p.uhid,name:p.patientName||p.name,branch:p._branchLabel,status:(p.admissions?.[p.admissions.length-1]?.discharge?.dod)?"Discharged":"Admitted"})),[allPatientsFlat]);
  const filteredTaskPatients=useMemo(()=>{
    if(!taskPatientSearch.trim()) return allPatientsForTask;
    const q=taskPatientSearch.toLowerCase();
    return allPatientsForTask.filter(p=>p.name.toLowerCase().includes(q)||p.uhid.toLowerCase().includes(q));
  },[allPatientsForTask,taskPatientSearch]);
  const taskAssignableEmployees=useMemo(()=>{
    const expectedRole=getRoleForDepartment(taskForm.department);
    return employees.filter(e=>{
      const role=String(e.role||"").toLowerCase();
      if(!TASK_ASSIGNABLE_ROLES.has(role)) return false;
      if(!expectedRole) return true;
      return role===expectedRole;
    });
  },[employees,taskForm.department]);

  const currentDisplayName = `${profileForm.first_name||""} ${profileForm.last_name||""}`.trim()||currentUser?.name;

  const getEmployeeBranchCode = ()=>{ if(isOfficeAdmin) return "ALL"; if(isSuperAdmin) return activeBranchCode; return String(currentUser?.branch||activeBranchCode||"LNM").toUpperCase(); };
  const buildEmployeeId = (branchCode)=>{ const prefix=EMPLOYEE_ID_PREFIXES[branchCode]||"EMP"; const hi=employees.reduce((max,e)=>{ const c=String(e.empId||"").trim().toUpperCase(); if(!c.startsWith(prefix)) return max; const n=Number(c.slice(prefix.length)); return Number.isInteger(n)?Math.max(max,n):max; },0); return `${prefix}${String(hi+1).padStart(4,"0")}`; };

  useEffect(()=>{
    if(!showEmpModal||editEmpId) return;
    const load=async()=>{ const bc2=getEmployeeBranchCode(); try { const d=await apiService.getNextEmpId({role:empForm.role,branch:bc2}); setEmpForm(f=>({...f,empId:d?.next_id||f.empId})); } catch { setEmpForm(f=>({...f,empId:f.empId||buildEmployeeId(bc2)})); } };
    load();
  },[showEmpModal,editEmpId,empForm.role,viewBranch,currentUser?.role]);

  const updatePatient=(branchKey,uhid,updater)=>setAllPatients(prev=>({...prev,[branchKey]:prev[branchKey].map(p=>p.uhid===uhid?updater(p):p)}));
  const fetchPatientMedicines = async (p) => {

  const existing =
    p.medicines || [];

  setSelectedMedPatient(prev => ({

    ...prev,

    [p.uhid]: existing.map(m => ({

      name:
        m.name || "",

      dosage:
        m.dosage || "",

      frequency:
        m.frequency || "",

      days:
        m.days || "",

      qty:
        m.qty || 1,

      rate:
        m.rate || 0,

    }))

  }));
};

const addMedicineToPatient = (
  p,
  medicineName
) => {

  const med =
    medicineMaster.find(m =>

      (m.name || "")
        .toLowerCase()
        ===
      medicineName.toLowerCase()
    );

  setSelectedMedPatient(prev => {

    const existing =
      prev[p.uhid] || [];

    return {

      ...prev,

      [p.uhid]: [

        ...existing,

        {

          name:
            med?.name ||
            medicineName,

          dosage:
            med?.dosage || "",

          frequency:
            med?.frequency || "",

          days: "",

          qty: 1,

          rate:
            med?.price || 0,

        }

      ]

    };

  });

};

  // ── PATIENT / SUMMARY HELPERS ──────────────────────────────────────────────
 const openMedEditor = (p) => {

  setEditMedPt(
    JSON.parse(JSON.stringify(p))
  );

  fetchPatientMedicines(p);

  setShowMedModal(true);

};
  const updateMed=(idx,field,val)=>setEditMedPt(prev=>{const m=[...prev.medicines];m[idx]={...m[idx],[field]:field==="name"?val:(+val||0)};return {...prev,medicines:m};});
  const addMedRow=()=>setEditMedPt(prev=>({...prev,medicines:[...(prev.medicines||[]),{id:Date.now(),name:"",qty:1,rate:0}]}));
  const delMedRow=(idx)=>setEditMedPt(prev=>({...prev,medicines:prev.medicines.filter((_,i)=>i!==idx)}));
  const saveMeds=()=>{ updatePatient(viewBranch,editMedPt.uhid,p=>({...p,medicines:editMedPt.medicines})); toast("Medicines saved"); setShowMedModal(false); setEditMedPt(null); };
  const resolveAdmNo=(p)=>{ const raw=p?.admissions?.[0]?.admNo??p?.admNo??1; const clean=String(raw).replace(/\D/g,""); return clean||"1"; };
  const normalizeSummarySections=(content)=>{ if(!content) return content; const next={...content}; if(next.sections&&!Array.isArray(next.sections)) next.sections=Object.entries(next.sections).map(([k,v])=>({key:k,...v})); return next; };
  const fetchSummaryTemplate=async(uhid,admNo,requestedType)=>{ setSummaryLoading(true); try { const res=await apiService.getDynamicSummary(uhid,admNo,requestedType); const content=normalizeSummarySections(res?.content||{sections:[]}); const resolvedType=normalizeSummaryType(res?.summary_type||requestedType); setSummaryContent(content); setSummaryType(resolvedType); } catch { setSummaryContent({sections:[]}); toast("Failed to load discharge summary template","err"); } finally { setSummaryLoading(false); } };
  const openSummaryEditor=(p)=>{ setEditSumPt(p); const initialType=normalizeSummaryType(p.dischargeSummary?.type); const admNo=resolveAdmNo(p); setSummaryType(initialType); setSummaryContent(null); setSummaryAdmNo(admNo); setShowSummaryModal(true); fetchSummaryTemplate(p.uhid,admNo,initialType); };
  const reloadSummary=(newType)=>{ if(!editSumPt) return; const next=normalizeSummaryType(newType); setSummaryType(next); setSummaryContent(null); fetchSummaryTemplate(editSumPt.uhid,summaryAdmNo||resolveAdmNo(editSumPt),next); };
  const updateSummarySection=(idx,val)=>setSummaryContent(prev=>{ if(!prev||!Array.isArray(prev.sections)) return prev; const sections=[...prev.sections]; sections[idx]={...sections[idx],value:val}; return {...prev,sections}; });
  const updateSummaryVital=(idx,vKey,val)=>setSummaryContent(prev=>{ if(!prev||!Array.isArray(prev.sections)) return prev; const sections=[...prev.sections]; const current=sections[idx]?.value&&typeof sections[idx].value==="object"?sections[idx].value:{}; sections[idx]={...sections[idx],value:{...current,[vKey]:val}}; return {...prev,sections}; });
  const saveSummary=async()=>{ if(!editSumPt) return; const admNo=summaryAdmNo||resolveAdmNo(editSumPt); setSummarySaving(true); try { await apiService.saveDynamicSummary(editSumPt.uhid,admNo,{summary_type:summaryType,content:summaryContent||{sections:[]}}); const branchKey=editSumPt._branch||viewBranch; updatePatient(branchKey,editSumPt.uhid,p=>({...p,dischargeSummary:{...(p.dischargeSummary||{}),type:summaryType}})); toast("Discharge summary saved"); setShowSummaryModal(false); setEditSumPt(null); } catch { toast("Failed to save discharge summary","err"); } finally { setSummarySaving(false); } };
  const handlePrintSummary=(p)=>{ if(!p?.uhid) return; const admNo=resolveAdmNo(p); window.open(`${BASE_URL}/patients/${p.uhid}/admissions/${admNo}/dynamic-summary/print/`,"_blank"); };
  const openViewModal=(p)=>{ setViewPt(p); setShowViewModal(true); };
  const confirmDelete=(p)=>{ setDeletePt(p); setShowDeleteConfirm(true); };
  const doDeleteSummary=()=>{ const branchKey=deletePt?._branch||viewBranch; updatePatient(branchKey,deletePt.uhid,p=>({...p,dischargeSummary:{type:"NORMAL",diagnosis:"",treatment:"",followUp:"",notes:"",doctorName:"",date:"",expectedDod:""}})); toast("Summary cleared"); setShowDeleteConfirm(false); setDeletePt(null); };
  const getPreferredAdmission=(p)=>p.admissions?.[0]||{};
  const getPreferredReports=(p)=>p.reports?.length?p.reports:(getPreferredAdmission(p).labReports||[]);
  const getPreferredDischarge=(p)=>({...(getPreferredAdmission(p).discharge||{}),...(p.dischargeSummary||{})});
  const openReportEditor=(p)=>{ const next=JSON.parse(JSON.stringify(p)); next.reports=getPreferredReports(p); setEditRepPt(next); setNewReport({name:"",date:"",result:""}); setShowReportModal(true); };
  const delReport=(idx)=>setEditRepPt(prev=>({...prev,reports:prev.reports.filter((_,i)=>i!==idx)}));
  const saveReports=async()=>{
    try {
      const cleanAdm=String(editRepPt.admissions?.[0]?.admNo||1).replace(/\D/g,"");
      for(const rep of editRepPt.reports){
        await apiService.saveLabReport(editRepPt.uhid,cleanAdm,{reportName:rep.reportName||rep.name,reportType:rep.reportType||"Pathology",date:rep.date,remarks:rep.remarks||"",tests:rep.tests||[]});
      }
      updatePatient(viewBranch,editRepPt.uhid,p=>({...p,reports:editRepPt.reports}));
      toast("Reports synced to Backend!"); setShowReportModal(false); setEditRepPt(null);
    } catch(e){ toast("Failed to sync reports.","err"); }
  };

  // ── REPORTS PAGE HELPERS ──────────────────────────────────────────────────
  const fetchPatientReports = async (p) => {

  const uhid = p.uhid;
  const admNo = String(resolveAdmNo(p));

  setRepLoading(prev => ({
    ...prev,
    [uhid]: true
  }));

  try {

    let fetched = [];

    try {

      fetched = await apiService.getLabReports(
        uhid,
        admNo
      );

    } catch {

      fetched = getPreferredReports(p);

    }

    const repMap = {};

    (fetched || []).forEach(rep => {

      const reportName =
        rep.reportName ||
        rep.name ||
        "Report";

      repMap[reportName] = {

        report_name: reportName,

        report_date:
          rep.date ||
          new Date()
            .toISOString()
            .slice(0,10),

        report_type:
          rep.reportType ||
          "Pathology",

        remarks:
          rep.remarks || "",

        findings:
          rep.findings || "",

        impression:
          rep.impression || "",

        tests: (rep.tests || []).map(t => ({

          name: t.name || "",

          value:
            t.result ||
            t.value ||
            "",

          unit:
            t.unit || "",

          normal:
            t.refRange ||
            t.normal ||
            "",

        })),

        saved: true,
      };

    });

    setPatientReports(prev => ({
      ...prev,
      [uhid]: repMap
    }));

  } catch(e) {

    console.error(e);

  }

  setRepLoading(prev => ({
    ...prev,
    [uhid]: false
  }));
};

const toggleRepPatient = (p) => {

  if(expandedRepPatient === p.uhid){

    setExpandedRepPatient(null);

    return;
  }

  setExpandedRepPatient(p.uhid);

  if(!patientReports[p.uhid]) {

    fetchPatientReports(p);

  }
};

const addTemplateReport = (
  p,
  templateName
) => {

  const uhid = p.uhid;

  const template =
    LAB_TEMPLATES[templateName];

  if(!template) return;

  setPatientReports(prev => {

    const existing =
      prev[uhid] || {};

    if(existing[templateName]) {

      return prev;

    }

    const tests =
      template.tests.map(t => ({

        name: t.name,

        value: "",

        unit: t.unit,

        normal: t.refRange,

      }));

    return {

      ...prev,

      [uhid]: {

        ...existing,

        [templateName]: {

          report_name: templateName,

          report_date:
            new Date()
              .toISOString()
              .slice(0,10),

          report_type: "Pathology",

          remarks:
            template.defaultRemarks || "",

          findings: "",

          impression: "",

          tests,

          saved: false,
        }
      }
    };

  });

  setSelectedReport(prev => ({
    ...prev,
    [uhid]: templateName
  }));
};

const updateRepTest = (
  uhid,
  reportName,
  testIdx,
  field,
  val
) => {

  setPatientReports(prev => {

    const repMap = {
      ...(prev[uhid] || {})
    };

    const rep = {
      ...(repMap[reportName] || {})
    };

    const tests = [
      ...(rep.tests || [])
    ];

    tests[testIdx] = {

      ...tests[testIdx],

      [field]: val
    };

    rep.tests = tests;

    rep.saved = false;

    repMap[reportName] = rep;

    return {

      ...prev,

      [uhid]: repMap
    };

  });
};

const updateRepRemarks = (
  uhid,
  reportName,
  val
) => {

  setPatientReports(prev => {

    const repMap = {
      ...(prev[uhid] || {})
    };

    repMap[reportName] = {

      ...(repMap[reportName] || {}),

      remarks: val,

      saved: false,
    };

    return {

      ...prev,

      [uhid]: repMap
    };

  });
};

const saveRepReport = async (
  p,
  reportName
) => {

  const uhid = p.uhid;

  const admNo =
    String(resolveAdmNo(p));

  const repData =
    patientReports[uhid]?.[
      reportName
    ];

  if(!repData) return;

  const key =
    `${uhid}-${reportName}`;

  setRepSaving(prev => ({
    ...prev,
    [key]: true
  }));

  try {

    await apiService.saveLabReport(
      uhid,
      admNo,
      {

        reportName,

        reportType:
          repData.report_type ||
          "Pathology",

        date:
          repData.report_date,

        remarks:
          repData.remarks || "",

        findings:
          repData.findings || "",

        impression:
          repData.impression || "",

        tests:
          repData.tests || [],
      }
    );

    setPatientReports(prev => ({

      ...prev,

      [uhid]: {

        ...prev[uhid],

        [reportName]: {

          ...prev[uhid][reportName],

          saved: true
        }
      }
    }));

    toast(`${reportName} saved`);

  } catch(e){

    toast(
      `Failed to save ${reportName}`,
      "err"
    );

  }

  setRepSaving(prev => ({
    ...prev,
    [key]: false
  }));
};

const printRepReport = (
  p,
  reportName
) => {

  const uhid = p.uhid;

  const admNo =
    String(resolveAdmNo(p));

  window.open(

    `${BASE_URL}/patients/${uhid}/admissions/${admNo}/lab-reports/print/?report=${encodeURIComponent(reportName)}`,

    "_blank"
  );
};

const addCustomRepRow = (
  uhid,
  reportName
) => {

  setPatientReports(prev => {

    const repMap = {
      ...prev[uhid]
    };

    const rep = {
      ...repMap[reportName]
    };

    rep.tests = [

      ...(rep.tests || []),

      {
        name:"",
        value:"",
        unit:"",
        normal:"",
      }

    ];

    rep.saved = false;

    repMap[reportName] = rep;

    return {

      ...prev,

      [uhid]: repMap
    };

  });
};

const delRepRow = (
  uhid,
  reportName,
  idx
) => {

  setPatientReports(prev => {

    const repMap = {
      ...prev[uhid]
    };

    const rep = {
      ...repMap[reportName]
    };

    rep.tests =
      rep.tests.filter(
        (_,i) => i !== idx
      );

    rep.saved = false;

    repMap[reportName] = rep;

    return {

      ...prev,

      [uhid]: repMap
    };

  });
};
  // ── BILLING HELPERS (redesigned) ──────────────────────────────────────────
  const getBillKey = (uhid, admNo) => `${uhid}-${admNo}`;

  const initBillData = (p, adm) => {
    const key = getBillKey(p.uhid, adm.admNo);
    if(billData[key]) return billData[key];
    const d = adm.discharge||{};
    return {
      patientName:  p.patientName||p.name||"",
      guardianName: p.guardianName||"",
      uhid:         p.uhid||"",
      ageYY:        p.ageYY||p.age||"",
      gender:       p.gender||"",
      address:      p.address||"",
      phone:        p.phone||"",
      cardNo:       p.cardNo||adm.billing?.cardNo||"",
      admNo:        adm.admNo||"",
      admType:      adm.admType||"General",
      billDate:     new Date().toISOString().slice(0,10),
      doa:          d.doa||adm.dateTime?.slice(0,10)||"",
      dod:          d.dod||"",
      wardName:     d.wardName||"",
      bedNo:        d.bedNo||"",
      doctorName:   d.doctorName||"",
      panel:        adm.billing?.panel||"CASH",
      paymentMode:  adm.billing?.paymentMode||"Cash",
      claimId:      adm.billing?.claimId||"",
      advance:      parseFloat(adm.billing?.advance)||0,
      discount:     parseFloat(adm.billing?.discount)||0,
      status:       p.dischargeSummary?.type||"",
      contactNo:    p.phone||"",
    };
  };

  const setBillField = (uhid, admNo, field, val) => {
    const key = getBillKey(uhid,admNo);
    setBillData(prev=>({...prev,[key]:{...(prev[key]||{}), [field]:val}}));
  };

  const getServices = (uhid, admNo) => {
    const key = getBillKey(uhid,admNo);
    return billServices[key]||[];
  };

  const initServices = (p, adm) => {
    const key = getBillKey(p.uhid, adm.admNo);
    if(billServices[key]) return;
    // Pre-fill medicines as services
    const medServices = (p.medicines||[]).map((m,i)=>({
      id:Date.now()+i, date:new Date().toISOString().slice(0,10),
      cghs:"", desc:m.name, qty:m.qty, rate:m.rate,
    }));
    setBillServices(prev=>({...prev,[key]:medServices}));
  };

  const addService = (uhid, admNo) => {
    if(!newSvcRow.desc) return;
    const key = getBillKey(uhid,admNo);
    setBillServices(prev=>({...prev,[key]:[...(prev[key]||[]),{id:Date.now(),...newSvcRow}]}));
    setNewSvcRow({date:"",cghs:"",desc:"",qty:1,rate:0});
  };

  const updateService = (uhid, admNo, idx, field, val) => {
    const key = getBillKey(uhid,admNo);
    setBillServices(prev=>{
      const list=[...(prev[key]||[])];
      list[idx]={...list[idx],[field]:field==="qty"||field==="rate"?parseFloat(val)||0:val};
      return {...prev,[key]:list};
    });
  };

  const removeService = (uhid, admNo, idx) => {
    const key = getBillKey(uhid,admNo);
    setBillServices(prev=>({...prev,[key]:(prev[key]||[]).filter((_,i)=>i!==idx)}));
  };

  const calcBillTotals = (uhid, admNo, bd) => {
    const services = getServices(uhid, admNo);
    const gross = services.reduce((s,svc)=>s+(parseFloat(svc.qty)||0)*(parseFloat(svc.rate)||0),0);
    const disc = parseFloat(bd?.discount)||0;
    const adv  = parseFloat(bd?.advance)||0;
    const net  = gross - disc - adv;
    return { gross, disc, adv, net };
  };

  const printBill = async (uhid, admNo) => {

  try {

    const response = await fetch(
      `${BASE_URL}/patients/${uhid}/admissions/${admNo}/bill/print/`,
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to generate bill");
    }

    const blob = await response.blob();

    const fileURL =
      window.URL.createObjectURL(blob);

    window.open(fileURL, "_blank");

  } catch (err) {

    console.error(err);

    toast("Unable to print bill");

  }

};
  // ── TASK HELPERS ──────────────────────────────────────────────────────────
  const openNewTask=()=>{ setEditTask(null); setTaskForm({title:"",description:"",assignedToId:"",department:"HOD",priority:"Medium",status:"Pending",dueDate:"",patientUhids:[],patientNames:[]}); setTaskPatientSearch(""); setShowTaskModal(true); };
  const openEditTask=(t)=>{ setEditTask(t); setTaskForm({title:t.title,description:t.description||"",assignedToId:t.assignedToId?String(t.assignedToId):"",department:t.department,priority:t.priority,status:t.status,dueDate:t.dueDate||"",patientUhids:t.patientUhids||(t.patientUhid?[t.patientUhid]:[]),patientNames:t.patientNames||(t.patientName?[t.patientName]:[])}); setTaskPatientSearch(""); setShowTaskModal(true); };
  const toggleTaskPatient=(p)=>{ const isSel=taskForm.patientUhids.includes(p.uhid); if(isSel){ setTaskForm(f=>({...f,patientUhids:f.patientUhids.filter(u=>u!==p.uhid),patientNames:f.patientNames.filter((_,i)=>f.patientUhids[i]!==p.uhid)})); } else if(taskForm.patientUhids.length<8){ setTaskForm(f=>({...f,patientUhids:[...f.patientUhids,p.uhid],patientNames:[...f.patientNames,p.name]})); } else { toast("Maximum 8 patients allowed per task","err"); } };
  const saveTask=async()=>{
    if(!taskForm.title||!taskForm.assignedToId){ toast("Title and Assigned To are required","err"); return; }
    const assignedEmployee=taskAssignableEmployees.find(e=>String(e.id)===String(taskForm.assignedToId));
    if(!assignedEmployee){ toast("Select a valid employee","err"); return; }
    const expectedRole=getRoleForDepartment(taskForm.department);
    if(expectedRole&&String(assignedEmployee.role||"").toLowerCase()!==expectedRole){ toast(`Department ${taskForm.department} must be assigned to a ${expectedRole.toUpperCase()} user`,"err"); return; }
    if(expectedRole==="billing"&&taskForm.patientUhids.length===0){ toast("Billing tasks must be linked to at least one patient","err"); return; }
    const linkedPatientIds=taskForm.patientUhids.map(uhid=>allPatientsForTask.find(p=>p.uhid===uhid)?.id).filter(Boolean);
    const payload={title:taskForm.title,description:taskForm.description,assigned_to:Number(taskForm.assignedToId),department:taskForm.department,priority:taskForm.priority,status:taskForm.status,due_date:taskForm.dueDate?`${taskForm.dueDate}T23:59:00Z`:null,patient:linkedPatientIds[0]||null};
    try {
      if(editTask){ const u=await apiService.updateTask(editTask.id,payload); setTasks(prev=>prev.map(t=>t.id===editTask.id?mapTaskFromApi(u):t)); toast("Task updated"); }
      else {
        if(linkedPatientIds.length>1){ await apiService.bulkAssignTasks({department:taskForm.department,assign_to:Number(taskForm.assignedToId),patient_ids:linkedPatientIds,title:taskForm.title,priority:taskForm.priority,due_date:taskForm.dueDate?`${taskForm.dueDate}T23:59:00Z`:null,notes:taskForm.description||""}); const r=await apiService.getTasks(); setTasks((r||[]).map(mapTaskFromApi)); toast(`Assigned ${linkedPatientIds.length} patients`); }
        else { const c=await apiService.createTask(payload); setTasks(prev=>[mapTaskFromApi(c),...prev]); toast("Task assigned"); }
      }
      setShowTaskModal(false); setEditTask(null);
    } catch(e){ const ae=e.response?.data; toast(ae?.patient?.[0]||ae?.assigned_to?.[0]||ae?.detail||ae?.error||"Failed to save task","err"); }
  };
  const deleteTask=async(id)=>{ try{ await apiService.deleteTask(id); setTasks(prev=>prev.filter(t=>t.id!==id)); toast("Task deleted"); } catch{ toast("Failed to delete task","err"); } };
  const updateTaskStatus=async(id,status)=>{ try{ const u=await apiService.updateTask(id,{status}); setTasks(prev=>prev.map(t=>t.id===id?mapTaskFromApi(u):t)); toast(`Task marked ${status}`); } catch{ toast("Failed to update task status","err"); } };

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

  const saveDepartment=()=>{ if(!deptForm.name){toast("Department name required","err");return;} setDepartments(prev=>[...prev,{id:`DEPT-${Date.now()}`,...deptForm,createdAt:new Date().toISOString(),memberCount:0}]); setShowDeptModal(false);setDeptForm({name:"",description:"",head:""});toast("Department created"); };
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
    }catch(e){const ae=e.response?.data||{};setEmpPassErr(ae.detail||ae.error||ae.username?.[0]||ae.emp_id?.[0]||ae.branch?.[0]||ae.role?.[0]||"Failed to save user.");}
  };
  const handleToggleActive=async(emp,index)=>{ const isActive=emp.status!=="Inactive"; const newLabel=isActive?"Inactive":"Active"; try{await apiService.updateUser(emp.id,{is_active:!isActive});setEmployees(prev=>prev.map((e,ei)=>ei===index?{...e,status:newLabel}:e));toast(`Employee ${newLabel==="Active"?"activated":"deactivated"}`);} catch{toast("Failed to update employee status.","err");} };

  const saveMyProfile=async()=>{
    try{
      const payload={first_name:profileForm.first_name,last_name:profileForm.last_name,email:profileForm.email,phone_number:profileForm.phone_number,emp_id:profileForm.emp_id};
      const updated=await apiService.updateMyProfile(payload);
      setProfileForm({first_name:updated.first_name||"",last_name:updated.last_name||"",email:updated.email||"",phone_number:updated.phone_number||"",emp_id:updated.emp_id||""});
      try{const raw=sessionStorage.getItem("hms_currentUser");if(raw){const parsed=JSON.parse(raw);sessionStorage.setItem("hms_currentUser",JSON.stringify({...parsed,name:`${updated.first_name||""} ${updated.last_name||""}`.trim()||parsed.name,email:updated.email||parsed.email,emp_id:updated.emp_id||parsed.emp_id,phone_number:updated.phone_number||parsed.phone_number}));}}catch{}
      toast("Profile updated");
    }catch(e){const ae=e.response?.data||{};toast(ae.email?.[0]||ae.phone_number?.[0]||ae.emp_id?.[0]||ae.detail||"Failed to update profile","err");}
  };

  // ── SMALL RENDER HELPERS ──────────────────────────────────────────────────
  const Badge=({col,children})=>(<span className="hms-badge" style={{background:`${col}20`,color:col,borderColor:`${col}40`}}>{children}</span>);
  const Pill=({col,bg,children,small})=>(<span className={small?"hms-pill-sm":"hms-pill"} style={{background:bg||`${col}20`,color:col,borderColor:`${col}40`}}>{children}</span>);
  const SummaryPill=({type})=>{ const key=normalizeSummaryType(type); const m=SUMMARY_META[key]||{color:"#6b7280",bg:"#6b728018"}; return <Pill col={m.color} bg={m.bg}><span className="hms-pill-dot" style={{background:m.color}}/>{SUMMARY_LABELS[key]||"Normal"}</Pill>; };
  const StatusPill=({s})=>{ const m=TASK_STATUS_META[s]||{color:"#6b7280",bg:"#6b728018"}; return <Pill col={m.color} bg={m.bg}>{s}</Pill>; };
  const PriorityPill=({p})=>{ const m=TASK_PRIORITY_META[p]||{color:"#6b7280",bg:"#6b728018"}; return <Pill small col={m.color} bg={m.bg}>{p}</Pill>; };
  const ActionBtn=({col,onClick,children})=><button className="hms-action-btn" style={{borderColor:`${col}40`,color:col}} onClick={onClick}>{children}</button>;
  const Th=({children})=><th className="hms-th">{children}</th>;
  const Td=({children,hi,mono,sm,style:s})=><td className={`hms-td${hi?" hms-td-hi":""}${mono?" hms-td-mono":""}${sm?" hms-td-sm":""}`} style={s}>{children}</td>;
  const ProgressBar=({pct,col})=>(<div className="hms-progress-bar"><div className="hms-progress-fill" style={{width:`${pct}%`,background:col}}/></div>);
  const BranchHeader=({title})=>(<div style={{marginBottom:18}}><div className="hms-pg-label">{title}</div><span className="hms-branch-pill" style={{background:bc.dim,border:`1px solid ${bc.border}`,color:accent}}><span style={{width:7,height:7,borderRadius:"50%",background:accent,display:"inline-block"}}/> {isOfficeAdmin?"All Hospitals":bc.label}</span></div>);
  const PageHeader=({title,subtitle})=>(<div style={{marginBottom:20}}><div className="hms-pg-label">{title}</div>{subtitle&&<div className="hms-pg-sub">{subtitle}</div>}</div>);
  const CardRow=({title,action})=>(<div className="hms-card-row"><div className="hms-card-title">{title}</div>{action}</div>);
  const TableWrap=({heads,children})=>(<div style={{overflowX:"auto"}}><table className="hms-tbl"><thead><tr>{heads.map(h=><Th key={h}>{h}</Th>)}</tr></thead><tbody>{children}</tbody></table></div>);
  const EmptyState=({icon,label,sub})=>{ const Icon=icon; const isComp=typeof Icon==="function"||(typeof Icon==="object"&&Icon!==null); return (<div style={{textAlign:"center",padding:"3rem",color:"#64748b"}}>{icon&&<div style={{fontSize:40,marginBottom:12}}>{isComp?<Icon size={36} strokeWidth={1.8}/>:icon}</div>}<div style={{fontSize:14,fontWeight:600,color:"#94a3b8",marginBottom:6}}>{label}</div>{sub&&<div style={{fontSize:12}}>{sub}</div>}</div>); };
  const StatCard=({col,icon,label,val,sub,topBorder})=>{ const Icon=icon; const isComp=typeof Icon==="function"||(typeof Icon==="object"&&Icon!==null); return (<div className="hms-stat-card" style={{borderTop:topBorder?`3px solid ${col}`:undefined,border:`1px solid ${col}15`}}>{icon&&<div className="hms-stat-icon">{isComp?<Icon size={18} strokeWidth={2}/>:icon}</div>}{topBorder&&<div style={{fontSize:10,color:col,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",marginBottom:8}}>{label}</div>}<div className="hms-stat-num" style={{fontSize:topBorder?26:22,color:col}}>{val}</div>{topBorder?<div className="hms-stat-label">{sub}</div>:<div className="hms-stat-label">{label}</div>}</div>); };

  // ── PAGE: HOME ────────────────────────────────────────────────────────────
  const renderHome = () => {
    const pendingTasks = tasks.filter(t=>t.status==="Pending").length;
    const urgentTasks  = tasks.filter(t=>t.priority==="Urgent"&&t.status!=="Completed").length;
    const stats = [
      { label:"Branch Patients",    val:locationPatients.length, col:accent,    icon:Users,         sub:"All records",      topBorder:true },
      { label:"Total Admissions",   val:allAdmissions.length,    col:"#22d3ee", icon:ClipboardList, sub:"All time",         topBorder:true },
      { label:"Currently Admitted", val:currentlyAdmitted,       col:"#34d399", icon:Hospital,      sub:"Active",           topBorder:true },
      { label:"Discharged",         val:discharged,              col:"#8b949e", icon:DoorOpen,      sub:"Completed",        topBorder:true },
      { label:"Total Tasks",        val:tasks.length,            col:"#818cf8", icon:CheckSquare,   sub:"All tasks",        topBorder:true },
      { label:"Pending Tasks",      val:pendingTasks,            col:"#f59e0b", icon:Clock3,        sub:"Awaiting action",  topBorder:true },
      { label:"Urgent Tasks",       val:urgentTasks,             col:"#f87171", icon:AlertTriangle, sub:"Need attention",   topBorder:true },
      { label:"Departments",        val:departments.length,      col:"#34d399", icon:Building2,     sub:"Active depts",     topBorder:true },
    ];
    return (
      <div>
        <BranchHeader title="Home"/>
        <div className="hms-prof-card" style={{display:"flex",alignItems:"flex-start",gap:18,border:`1px solid ${accent}30`}}>
          <div className="hms-big-avatar">{initials(currentUser?.name)}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:16,fontWeight:700,marginBottom:3}}>{currentUser?.name}</div>
            <div style={{fontSize:11,color:accent,fontWeight:600,marginBottom:2}}>{currentUser?.dept||currentUser?.role?.toUpperCase()}</div>
            <div style={{fontSize:10,color:"#64748b"}}>{bc.label} Branch</div>
            <div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}>
              {currentUser?.dept&&<Badge col={accent}>{currentUser.dept}</Badge>}
              <Badge col={currentUser?.status==="Inactive"?"#f87171":"#34d399"}>{currentUser?.status||"Active"}</Badge>
              <Badge col="#6b7280">{currentUser?.id}</Badge>
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
                <tr key={i}><Td><span className="hms-td-hi">{p.patientName||p.name}</span><div className="hms-td-mono" style={{marginTop:2}}>{p.gender} · {p.ageYY||p.age}y</div></Td><Td mono>{p.uhid}</Td><Td>{d.wardName||"—"}</Td><Td sm>{d.doctorName||"—"}</Td><Td><span style={{cursor:"pointer"}} onClick={()=>openSummaryEditor(p)}><SummaryPill type={p.dischargeSummary?.type}/></span></Td><Td><Badge col={status==="Admitted"?"#34d399":"#8b949e"}>{status}</Badge></Td><Td sm>{fmtDt(last?.dateTime)}</Td></tr>
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
      <div className="hms-ro-banner">◎ View + Edit · {currentUser?.dept||currentUser?.role} · {bc.label}</div>
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
                  <Td><span style={{cursor:"pointer"}} onClick={()=>openSummaryEditor(p)}><SummaryPill type={p.dischargeSummary?.type}/></span></Td>
                  <Td sm>{fmtDt(d.doa)}</Td><Td sm>{fmtDt(d.dod)}</Td>
                  <Td><Badge col={status==="Admitted"?"#34d399":"#8b949e"}>{status}</Badge></Td>
                  <Td>
                    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                      <ActionBtn col="#34d399" onClick={()=>openMedEditor(p)}>Meds</ActionBtn>
                      <ActionBtn col="#38bdf8" onClick={()=>openReportEditor(p)}>Reports</ActionBtn>
                      <ActionBtn col="#f59e0b" onClick={()=>handlePrintSummary(p)}>↓</ActionBtn>
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
          <CardRow title={`${filtered.length} Record${filtered.length!==1?"s":""} — ${bc.label}`} action={<ActionBtn col="#f59e0b" onClick={()=>{filtered.forEach(p=>handlePrintSummary(p));toast(`Opened ${filtered.length} summaries`);}}>↓ Export All</ActionBtn>}/>
          {filtered.length===0?<div className="hms-empty">No summaries match this filter.</div>:(
            <TableWrap heads={["Patient","UHID","Type","Diagnosis","Doctor","Discharge Date","Meds","Reports","Actions"]}>
              {filtered.map((p,i)=>{
                const ds=getPreferredDischarge(p); const adm=getPreferredAdmission(p); const d=adm.discharge||{}; const reports=getPreferredReports(p);
                return (
                  <tr key={i} className="hms-tr-alt">
                    <Td><span className="hms-td-hi">{p.patientName||p.name}</span><div className="hms-td-mono">{p.gender} · {p.ageYY||p.age}y</div></Td>
                    <Td mono>{p.uhid}</Td><Td><SummaryPill type={ds.type}/></Td>
                    <Td>{ds.diagnosis?<span>{ds.diagnosis}</span>:<span style={{color:"#64748b",fontStyle:"italic",fontSize:10}}>Not set</span>}</Td>
                    <Td sm>{ds.doctorName||d.doctorName||"—"}</Td><Td sm>{fmtDt(ds.date||d.dod)}</Td>
                    <Td><Badge col="#34d399">{(p.medicines||[]).length}</Badge></Td>
                    <Td><Badge col="#34d399">{reports.length}</Badge></Td>
                    <Td>
                      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                        <ActionBtn col="#34d399" onClick={()=>openViewModal(p)}>View</ActionBtn>
                        <ActionBtn col={accent} onClick={()=>openSummaryEditor(p)}>Edit</ActionBtn>
                        <ActionBtn col="#f59e0b" onClick={()=>handlePrintSummary(p)}>↓</ActionBtn>
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
  const renderMedicines = () => (
    <div>
      <BranchHeader title="Medicines"/>
      <div style={{marginBottom:14}}>
        <input className="hms-inp" placeholder="Search patient by name or UHID…" style={{maxWidth:320}} value={medSearch} onChange={e=>setMedSearch(e.target.value)}/>
      </div>
      {locationPatients.filter(p=>!medSearch||(p.patientName||p.name||"").toLowerCase().includes(medSearch.toLowerCase())||(p.uhid||"").toLowerCase().includes(medSearch.toLowerCase())).map(p=>{
        const medTotal=(p.medicines||[]).reduce((s,m)=>s+(m.qty*m.rate),0);
        const mhRaw=(p.admissions?.[0]?.medicalHistory||p.medicalHistory||{}).currentMedications||"";
        const mhMeds=mhRaw?mhRaw.split(/[,;|\n]+/).map(s=>s.trim()).filter(Boolean):[];
        return (
          <div key={p.uhid} className="hms-card">
            <CardRow title={<><span className="hms-td-hi">{p.patientName||p.name}</span><span className="hms-td-mono" style={{marginLeft:8}}>{p.uhid}</span><span style={{color:"#f59e0b",marginLeft:8,fontWeight:700}}>· {fmt(medTotal)}</span></>}
              action={<div style={{display:"flex",gap:8}}><ActionBtn col={accent} onClick={()=>updatePatient(viewBranch,p.uhid,pt=>({...pt,medicines:[...(pt.medicines||[]),{id:Date.now(),name:"",qty:1,rate:0}]}))}>+ Add Row</ActionBtn><button className="hms-add-btn" onClick={()=>openMedEditor(p)}>Open Drawer</button></div>}/>
            {mhMeds.length>0&&(<div style={{marginBottom:12,padding:"10px 14px",background:isDark?"rgba(56,189,248,0.06)":"rgba(56,189,248,0.08)",borderRadius:8,border:"1px solid rgba(56,189,248,0.2)"}}><div style={{fontSize:10,fontWeight:700,color:"#38bdf8",marginBottom:8,textTransform:"uppercase",letterSpacing:".06em"}}>📋 Medical History — Current Medications</div><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{mhMeds.map((med,mi)=>{ const already=(p.medicines||[]).some(m=>m.name.toLowerCase()===med.toLowerCase()); return (<span key={mi} className="hms-mh-pill" style={{opacity:already?0.45:1,cursor:already?"default":"pointer"}} onClick={()=>{ if(already){toast(`"${med}" already in list`,"err");return;} updatePatient(viewBranch,p.uhid,pt=>({...pt,medicines:[...(pt.medicines||[]),{id:Date.now(),name:med,qty:1,rate:0}]})); toast(`Added "${med}"`); }}>{already?"✓ ":"+ "}{med}</span>); })}</div></div>)}
            {!(p.medicines||[]).length?<div className="hms-empty">No medicines.</div>:(
              <div style={{overflowX:"auto"}}>
                <table className="hms-tbl"><thead><tr><Th>Medicine Name</Th><Th>Qty</Th><Th>Rate / unit (₹)</Th><Th>Total</Th><Th>Remove</Th></tr></thead>
                  <tbody>{(p.medicines||[]).map((m,mi)=>(<tr key={m.id||mi}>
                    <td className="hms-td hms-td-hi"><input className="hms-med-inline-input" style={{width:"100%",minWidth:140}} value={m.name} placeholder="Medicine name" onChange={e=>updatePatient(viewBranch,p.uhid,pt=>{const meds=[...pt.medicines];meds[mi]={...meds[mi],name:e.target.value};return{...pt,medicines:meds};})}/></td>
                    <td className="hms-td"><input type="number" min={0} className="hms-med-inline-input" style={{width:70,textAlign:"center"}} value={m.qty} onChange={e=>updatePatient(viewBranch,p.uhid,pt=>{const meds=[...pt.medicines];meds[mi]={...meds[mi],qty:Math.max(0,parseInt(e.target.value)||0)};return{...pt,medicines:meds};})}/></td>
                    <td className="hms-td"><input type="number" min={0} step="0.01" className="hms-med-inline-input" style={{width:90,textAlign:"right"}} value={m.rate} onChange={e=>updatePatient(viewBranch,p.uhid,pt=>{const meds=[...pt.medicines];meds[mi]={...meds[mi],rate:Math.max(0,parseFloat(e.target.value)||0)};return{...pt,medicines:meds};})}/></td>
                    <td className="hms-td"><span style={{color:"#f59e0b",fontWeight:700}}>{fmt(m.qty*m.rate)}</span></td>
                    <td className="hms-td"><ActionBtn col="#f87171" onClick={()=>updatePatient(viewBranch,p.uhid,pt=>({...pt,medicines:pt.medicines.filter((_,i)=>i!==mi)}))}>✕</ActionBtn></td>
                  </tr>))}</tbody>
                </table>
              </div>
            )}
            {(p.medicines||[]).length>0&&(<div style={{display:"flex",justifyContent:"flex-end",marginTop:10,paddingTop:10,borderTop:`1px solid ${accent}18`}}><span style={{fontSize:13,fontWeight:800,color:"#f59e0b"}}>Total: {fmt(medTotal)}</span></div>)}
          </div>
        );
      })}
      {!locationPatients.length&&<div className="hms-card hms-empty">No patients for {bc.label}.</div>}
    </div>
  );

  // ── PAGE: REPORTS (REDESIGNED) ────────────────────────────────────────────
  const renderReports = () => (
    <div>
      <BranchHeader title="Lab Reports"/>
      <div style={{fontSize:11,color:"#64748b",marginBottom:14}}>
        Click on a patient to expand their reports. Select a template to load pre-filled test fields, edit results, then save and print.
      </div>
      {!locationPatients.length&&<EmptyState icon={FlaskConical} label="No patients" sub="No patients found for this branch"/>}
      {locationPatients.map(p=>{
        const uhid = p.uhid;
        const isExpanded = expandedRepPatient===uhid;
        const repMap = patientReports[uhid]||{};
        const activeTemplate = activeRepTemplate[uhid];
        const savedReportNames = Object.keys(repMap);
        const repCount = savedReportNames.length;
        const isLoading = repLoading[uhid];
        const admNo = resolveAdmNo(p);

        return (
          <div key={uhid} className="rep-patient-card">
            {/* Patient header — click to expand */}
            <div className="rep-patient-head" onClick={()=>toggleRepPatient(p)}>
              <div className="rep-patient-info">
                <div className="rep-patient-avatar">{initials(p.patientName||p.name)}</div>
                <div>
                  <div className="rep-patient-name">{p.patientName||p.name}</div>
                  <div className="rep-patient-meta">{uhid} · Adm #{admNo} · {p.gender} · {p.ageYY||p.age}y · {(p.admissions?.[0]?.discharge?.dod)?"Discharged":"Admitted"}</div>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                {repCount>0&&<Badge col="#34d399">{repCount} report{repCount!==1?"s":""}</Badge>}
                {isLoading&&<span style={{fontSize:11,color:"#64748b"}}>Loading…</span>}
                {isExpanded?<ChevronUp size={16} color="#64748b"/>:<ChevronDown size={16} color="#64748b"/>}
              </div>
            </div>

            {isExpanded&&(
              <>
                <div className="rep-report-body">

  {/* FETCHED REPORTS */}

  <div
    style={{
      display:"flex",
      gap:8,
      flexWrap:"wrap",
      marginBottom:14
    }}
  >

    {Object.keys(
      patientReports[p.uhid] || {}
    ).map(reportName => (

      <button
        key={reportName}
        className={`rep-template-btn ${
          selectedReport[p.uhid] === reportName
            ? "active"
            : ""
        }`}
        onClick={() =>
          setSelectedReport(prev => ({
            ...prev,
            [p.uhid]: reportName
          }))
        }
      >
        {reportName}
      </button>

    ))}

  </div>

  {/* ADD NEW REPORT */}

  <div
    style={{
      display:"flex",
      gap:10,
      marginBottom:18
    }}
  >

    <input
      className="hms-inp"
      placeholder="Search report template..."
      value={reportSearch[p.uhid] || ""}
      onChange={(e)=>
        setReportSearch(prev => ({
          ...prev,
          [p.uhid]: e.target.value
        }))
      }
    />

    <select
      className="hms-sel"
      onChange={(e)=>{

        if(!e.target.value) return;

        addTemplateReport(
          p,
          e.target.value
        );

      }}
    >

      <option value="">
        Add Report
      </option>

      {Object.keys(LAB_TEMPLATES)

        .filter(name =>
          name
            .toLowerCase()
            .includes(
              (
                reportSearch[p.uhid] || ""
              ).toLowerCase()
            )
        )

        .map(name => (

          <option
            key={name}
            value={name}
          >
            {name}
          </option>

      ))}

        </select>

  </div>

</div>
                {/* Reports body */}
                <div className="rep-report-body">
                  {!activeTemplate&&savedReportNames.length===0&&(
                    <div style={{textAlign:"center",padding:"24px",color:"#64748b",fontSize:12}}>
                      Select a lab template above to start entering results.
                    </div>
                  )}

                  {/* Show active template or all saved */}
                  {(activeTemplate ? [activeTemplate] : savedReportNames).map(reportName=>{
                    const rep = repMap[reportName];
                    if(!rep) return null;
                    const isSavingThis = repSaving[`${uhid}-${reportName}`];
                    return (
                      <div key={reportName} className="rep-report-block">
                        <div className="rep-report-block-head">
                          <div className="rep-report-block-title">
                            <FlaskConical size={14} style={{marginRight:6,verticalAlign:"middle"}}/>{reportName}
                            {rep.saved&&<span style={{marginLeft:8,fontSize:10,color:"#34d399",fontWeight:600}}>✓ Saved</span>}
                            {!rep.saved&&<span style={{marginLeft:8,fontSize:10,color:"#f59e0b",fontWeight:600}}>● Unsaved</span>}
                          </div>
                          <div style={{display:"flex",gap:8,alignItems:"center"}}>
                            <input
                              className="hms-inp-sm"
                              type="date"
                              value={rep.date}
                              style={{padding:"3px 8px",fontSize:11}}
                              onChange={e=>setPatientReports(prev=>({...prev,[uhid]:{...prev[uhid],[reportName]:{...prev[uhid][reportName],date:e.target.value,saved:false}}}))}
                            />
                            <button
                              className="no-print"
                              style={{padding:"5px 12px",borderRadius:6,fontSize:11,fontWeight:600,background:"transparent",border:`1px solid ${accent}40`,color:accent,cursor:"pointer"}}
                              onClick={()=>printRepReport(p,reportName)}
                            >
                              <Printer size={12} style={{marginRight:4,verticalAlign:"middle"}}/>Print
                            </button>
                            <button
                              className="no-print"
                              style={{padding:"5px 12px",borderRadius:6,fontSize:11,fontWeight:600,background:isSavingThis?"#1e2a3a":`linear-gradient(135deg,${accent},${accent}cc)`,color:"#fff",border:"none",cursor:isSavingThis?"default":"pointer"}}
                              onClick={()=>saveRepReport(p,reportName)}
                              disabled={isSavingThis}
                            >
                              {isSavingThis?"Saving…":"💾 Save"}
                            </button>
                            <button
                              className="no-print"
                              style={{padding:"4px 8px",borderRadius:6,fontSize:11,background:"transparent",border:"1px solid #f8717140",color:"#f87171",cursor:"pointer"}}
                              onClick={()=>{
                                setPatientReports(prev=>{ const m={...prev[uhid]}; delete m[reportName]; return {...prev,[uhid]:m}; });
                                if(activeTemplate===reportName) setActiveRepTemplate(prev=>({...prev,[uhid]:undefined}));
                              }}
                            >✕</button>
                          </div>
                        </div>
                        <table className="rep-test-table">
                          <thead><tr><th style={{width:"35%"}}>Test Name</th><th style={{width:"20%"}}>Result</th><th style={{width:"15%"}}>Unit</th><th style={{width:"20%"}}>Ref. Range</th><th style={{width:"10%"}}></th></tr></thead>
                          <tbody>
                            {(rep.tests||[]).map((test,ti)=>(
                              <tr key={ti}>
                                <td><input className="rep-test-input" style={{color:isDark?"#cbd5e1":"#334155",fontWeight:400}} value={test.name} placeholder="Test name" onChange={e=>updateRepTest(uhid,reportName,ti,"name",e.target.value)}/></td>
                                <td><input className="rep-test-input" value={test.result} placeholder="Enter value" onChange={e=>updateRepTest(uhid,reportName,ti,"result",e.target.value)}/></td>
                                <td><input className="rep-test-input" style={{color:isDark?"#94a3b8":"#64748b",fontWeight:400}} value={test.unit} onChange={e=>updateRepTest(uhid,reportName,ti,"unit",e.target.value)}/></td>
                                <td><input className="rep-test-input" style={{color:isDark?"#94a3b8":"#64748b",fontWeight:400}} value={test.refRange} onChange={e=>updateRepTest(uhid,reportName,ti,"refRange",e.target.value)}/></td>
                                <td style={{textAlign:"center"}}><button style={{background:"none",border:"none",color:"#f87171",cursor:"pointer",fontSize:12}} onClick={()=>delRepRow(uhid,reportName,ti)}>✕</button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div style={{padding:"8px 12px",borderTop:`1px solid ${isDark?"#111827":"#f1f5f9"}`}}>
                          <button style={{fontSize:11,color:accent,background:"none",border:"none",cursor:"pointer",fontWeight:600}} onClick={()=>addCustomRepRow(uhid,reportName)}>+ Add Row</button>
                        </div>
                        <div style={{padding:"8px 12px",borderTop:`1px solid ${isDark?"#111827":"#f1f5f9"}`}}>
                          <label className="hms-lbl" style={{fontSize:9}}>Remarks</label>
                          <textarea className="hms-textarea" rows={2} value={rep.remarks} style={{width:"100%",boxSizing:"border-box",fontSize:11,marginTop:4}} onChange={e=>updateRepRemarks(uhid,reportName,e.target.value)}/>
                        </div>
                      </div>
                    );
                  })}

                  {/* If active template not yet in map */}
                  {activeTemplate&&!repMap[activeTemplate]&&<div style={{textAlign:"center",color:"#64748b",padding:16,fontSize:12}}>Loading template…</div>}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );

  // ── PAGE: BILLING (REDESIGNED — PDF-MATCHING FORMAT) ─────────────────────
  const renderBilling = () => {
    const branchInfo = isDark
      ? "Lakshmi Nagar Branch · Lakshmi Nagar, Mathura, Uttar Pradesh - 281004 · +91-9717444531 / +91-9717444532"
      : "Lakshmi Nagar Branch · Lakshmi Nagar, Mathura, Uttar Pradesh - 281004 · +91-9717444531";

    return (
      <div className="bill-page-wrap" style={{alignItems:"flex-start"}}>
        {/* LEFT — patient list */}
        <div className="bill-patient-list">
          <div className="bill-patient-list-head">
            <CreditCard size={12} style={{marginRight:6,verticalAlign:"middle"}}/>
            Patients ({locationPatients.length})
          </div>
          {!locationPatients.length&&<div style={{padding:"16px",fontSize:12,color:"#64748b",textAlign:"center"}}>No patients found.</div>}
          {locationPatients.map(p=>{
            const adm = p.admissions?.[0]||{};
            const isActive = selectedBillPatient===p.uhid;
            const hasPayment = adm.billing&&((parseFloat(adm.billing.paidNow)||0)+(parseFloat(adm.billing.advance)||0))>0;
            const status = adm.discharge?.dod?"Discharged":"Admitted";
            return (
              <div
                key={p.uhid}
                className={`bill-patient-item${isActive?" active":""}`}
                onClick={()=>{
                  setSelectedBillPatient(isActive?null:p.uhid);
                  if(!isActive){
                    // init bill data and services for first admission
                    const key=getBillKey(p.uhid,adm.admNo);
                    if(!billData[key]){ setBillData(prev=>({...prev,[key]:initBillData(p,adm)})); }
                    initServices(p,adm);
                  }
                }}
              >
                <div className="bill-patient-name">{p.patientName||p.name}</div>
                <div className="bill-patient-uhid">{p.uhid}</div>
                <div style={{display:"flex",gap:4,marginTop:4,flexWrap:"wrap"}}>
                  <span className="bill-patient-badge" style={{background:status==="Admitted"?"#34d39918":"#6b728018",color:status==="Admitted"?"#34d399":"#6b7280",border:`1px solid ${status==="Admitted"?"#34d39930":"#6b728030"}`}}>{status}</span>
                  {hasPayment&&<span className="bill-patient-badge" style={{background:"#f59e0b18",color:"#f59e0b",border:"1px solid #f59e0b30"}}>● Billed</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT — bill detail */}
        <div className="bill-detail-pane">
          {!selectedBillPatient&&(
            <div style={{textAlign:"center",padding:"60px 20px",color:"#64748b"}}>
              <CreditCard size={40} style={{marginBottom:12,opacity:0.3}}/>
              <div style={{fontSize:14,fontWeight:600,color:"#94a3b8",marginBottom:6}}>Select a patient to generate their bill</div>
              <div style={{fontSize:11}}>Choose from the list on the left to view, edit and print the final bill.</div>
            </div>
          )}
          {selectedBillPatient&&(()=>{
            const p = locationPatients.find(pt=>pt.uhid===selectedBillPatient);
            if(!p) return null;
            const adm = p.admissions?.[0]||{};
            const key = getBillKey(p.uhid, adm.admNo);
            const bd  = billData[key]||initBillData(p,adm);
            const services = getServices(p.uhid, adm.admNo);
            const { gross, disc, adv, net } = calcBillTotals(p.uhid, adm.admNo, bd);
            const setF = (f,v) => setBillField(p.uhid, adm.admNo, f, v);
            const today = new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"2-digit",year:"numeric"}).replace(/\//g,"/");
            const nowTime = new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}).toUpperCase()+" HRS";

            return (
              <div>
                {/* Action bar */}
                <div className="no-print" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div style={{fontSize:13,fontWeight:700}}>Bill for {p.patientName||p.name}</div>
                  <div style={{display:"flex",gap:8}}>
                    <button style={{padding:"7px 14px",borderRadius:7,fontSize:11,fontWeight:600,background:"transparent",border:`1px solid ${accent}40`,color:accent,cursor:"pointer"}}
                      onClick={()=>{
                        const lines=[`SANGI HOSPITAL — ${bc.label.toUpperCase()}`,`IPD: ${bd.admNo} | Date: ${today}`,`Patient: ${bd.patientName} | UHID: ${bd.uhid}`,`Panel: ${bd.panel} | Advance: ₹${bd.advance} | Discount: ₹${bd.discount}`,``,`Services:`, ...services.map((s,i)=>`${i+1}. ${s.desc} | Qty: ${s.qty} | Rate: ₹${s.rate} | Amt: ₹${(s.qty*s.rate).toFixed(2)}`),``,`Gross: ₹${gross.toFixed(2)} | Discount: ₹${disc.toFixed(2)} | Advance: ₹${adv.toFixed(2)}`,`NET PAYABLE: ₹${net.toFixed(2)}`];
                        exportTxt(`bill_${p.uhid}.txt`,lines.join("\n"));
                        toast("Bill downloaded");
                      }}
                    >↓ Download TXT</button>
                    <button
  style={{
    padding:"7px 14px",
    borderRadius:7,
    fontSize:11,
    fontWeight:700,
    background:`linear-gradient(135deg,${accent},${accent}cc)`,
    color:"#fff",
    border:"none",
    cursor:"pointer",
    display:"flex",
    alignItems:"center",
    gap:6
  }}
  onClick={() => printBill(p.uhid, bd.admNo)}
>
  <Printer size={13}/>Print Bill
</button>
                  </div>
                </div>

                {/* BILL PRINT AREA — matches PDF format */}
                <div id="bill-print-area" ref={billPrintRef} className="bill-print-card">
                  {/* Header */}
                  <div className="bill-print-header">
                    <div>
                      <div className="bill-print-hospital-name">SANGi HOSPITAL</div>
                      <div className="bill-print-branch">{branchInfo}</div>
                      <div className="bill-print-branch">✉ laxminagar@sangihospital.com · 🌐 www.sangihospital.com</div>
                    </div>
                    <div className="bill-print-title">
                      <div style={{fontSize:11,color:"#64748b",marginBottom:4}}>Date: {today}</div>
                      <div className="bill-print-title-main">FINAL BILL</div>
                      <div className="bill-print-title-sub">
                        Admission Type: <input className="bill-info-value-edit" style={{width:80,display:"inline-block"}} value={bd.admType||"General"} onChange={e=>setF("admType",e.target.value)}/>
                      </div>
                    </div>
                  </div>

                  {/* Patient info grid — 2 columns like PDF */}
                  <div className="bill-info-grid">
                    {[
                      ["UHID",        bd.uhid,          "uhid"],
                      ["Bill No.",    "—",              null],
                      ["IPD No.",     bd.admNo,         "admNo"],
                      ["Bill Date",   `${today} ${nowTime}`, null],
                      ["Patient Name",bd.patientName,   "patientName"],
                      ["Bill Date",   `${today} ${nowTime}`, null],
                      ["Guardian Name",bd.guardianName, "guardianName"],
                      ["Age/Sex",     `${bd.ageYY||"—"} YRS / ${bd.gender||"—"}`, null],
                      ["Address",     bd.address,       "address"],
                      ["Card No.",    bd.cardNo,        "cardNo"],
                      ["Consultant",  bd.doctorName,    "doctorName"],
                      ["Room",        `${bd.wardName||"—"} / ${bd.bedNo||"—"}`, null],
                      ["Claim ID",    bd.claimId||"—",  "claimId"],
                      ["Panel",       bd.panel,         "panel"],
                      ["DOA & Time",  bd.doa,           "doa"],
                      ["Contact No.", bd.contactNo,     "contactNo"],
                      ["DOD & Time",  bd.dod||"—",      "dod"],
                      ["Status on Discharge", bd.status||"—", "status"],
                    ].map(([label,value,field],i)=>(
                      <div key={i} className="bill-info-cell">
                        <div className="bill-info-label">{label}</div>
                        {field ? (
                          <input className="bill-info-value-edit" value={bd[field]||""} onChange={e=>setF(field,e.target.value)} placeholder="—"/>
                        ) : (
                          <div className="bill-info-value">{value||"—"}</div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Services table — matches PDF */}
                  <table className="bill-services-table">
                    <thead>
                      <tr>
                        <th style={{width:"5%"}}>SR NO.</th>
                        <th style={{width:"12%"}}>DATE</th>
                        <th style={{width:"12%"}}>CGHS CODE</th>
                        <th style={{width:"35%"}}>DESCRIPTION</th>
                        <th style={{width:"10%"}}>QUANTITY</th>
                        <th style={{width:"13%"}}>RATE</th>
                        <th style={{width:"13%"}}>AMOUNT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!services.length&&<tr><td colSpan={7} style={{textAlign:"center",color:"#94a3b8",fontStyle:"italic",padding:"12px"}}>No services added</td></tr>}
                      {services.map((svc,si)=>{
                        const amount=(parseFloat(svc.qty)||0)*(parseFloat(svc.rate)||0);
                        return (
                          <tr key={svc.id||si}>
                            <td>{si+1}</td>
                            <td><input value={svc.date} onChange={e=>updateService(p.uhid,adm.admNo,si,"date",e.target.value)} placeholder="date" style={{width:"100%"}}/></td>
                            <td><input value={svc.cghs||""} onChange={e=>updateService(p.uhid,adm.admNo,si,"cghs",e.target.value)} placeholder="code" style={{width:"100%"}}/></td>
                            <td><input value={svc.desc} onChange={e=>updateService(p.uhid,adm.admNo,si,"desc",e.target.value)} placeholder="description" style={{width:"100%"}}/></td>
                            <td><input type="number" min={0} value={svc.qty} onChange={e=>updateService(p.uhid,adm.admNo,si,"qty",e.target.value)} style={{width:"100%",textAlign:"right"}}/></td>
                            <td><input type="number" min={0} step="0.01" value={svc.rate} onChange={e=>updateService(p.uhid,adm.admNo,si,"rate",e.target.value)} style={{width:"100%",textAlign:"right"}}/></td>
                            <td style={{textAlign:"right",fontWeight:600,color:isDark?"#f59e0b":"#b45309"}}>₹ {amount.toFixed(2)}<button className="no-print" style={{marginLeft:6,background:"none",border:"none",color:"#f87171",cursor:"pointer",fontSize:10}} onClick={()=>removeService(p.uhid,adm.admNo,si)}>✕</button></td>
                          </tr>
                        );
                      })}
                      {/* Empty rows like PDF */}
                      {Array.from({length:Math.max(0,6-services.length)}).map((_,i)=>(
                        <tr key={`empty-${i}`}><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Add service row */}
                  <div className="bill-add-svc-row no-print">
                    <input placeholder="Description *" value={newSvcRow.desc} onChange={e=>setNewSvcRow(f=>({...f,desc:e.target.value}))} style={{flex:2}}/>
                    <input type="date" value={newSvcRow.date} onChange={e=>setNewSvcRow(f=>({...f,date:e.target.value}))} style={{flex:1}}/>
                    <input placeholder="CGHS" value={newSvcRow.cghs} onChange={e=>setNewSvcRow(f=>({...f,cghs:e.target.value}))} style={{flex:1}}/>
                    <input type="number" min={0} value={newSvcRow.qty} onChange={e=>setNewSvcRow(f=>({...f,qty:e.target.value}))} placeholder="Qty" style={{width:60}}/>
                    <input type="number" min={0} step="0.01" value={newSvcRow.rate} onChange={e=>setNewSvcRow(f=>({...f,rate:e.target.value}))} placeholder="Rate" style={{width:80}}/>
                    <button style={{padding:"5px 12px",borderRadius:6,fontSize:11,fontWeight:600,background:`linear-gradient(135deg,${accent},${accent}cc)`,color:"#fff",border:"none",cursor:"pointer"}} onClick={()=>addService(p.uhid,adm.admNo)}>+ Add</button>
                  </div>

                  {/* Totals — matches PDF layout */}
                  <div className="bill-totals-section">
                    <div className="bill-totals-box">
                      <div className="bill-total-row">
                        <span style={{color:"#64748b"}}>Gross Total :</span>
                        <span style={{fontWeight:700,color:isDark?"#e2e8f0":"#1e293b"}}>₹ {gross.toFixed(2)}</span>
                      </div>
                      <div className="bill-total-row">
                        <span style={{color:"#64748b"}}>Discount :</span>
                        <div style={{display:"flex",alignItems:"center",gap:4}}>
                          <span style={{color:"#c084fc"}}>- ₹</span>
                          <input type="number" min={0} className="no-print" style={{width:80,textAlign:"right",background:"transparent",border:`1px dashed ${isDark?"#1e2a3a":"#c7d5eb"}`,borderRadius:4,padding:"1px 6px",fontSize:12,color:isDark?"#c084fc":"#7c3aed"}} value={bd.discount||0} onChange={e=>setF("discount",e.target.value)}/>
                          <span className="no-print" style={{display:"none"}}/>
                          <span style={{fontWeight:700,color:"#c084fc"}}>{parseFloat(bd.discount||0).toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="bill-total-row">
                        <span style={{color:"#64748b"}}>Advance Payment :</span>
                        <div style={{display:"flex",alignItems:"center",gap:4}}>
                          <span style={{color:"#34d399"}}>- ₹</span>
                          <input type="number" min={0} className="no-print" style={{width:80,textAlign:"right",background:"transparent",border:`1px dashed ${isDark?"#1e2a3a":"#c7d5eb"}`,borderRadius:4,padding:"1px 6px",fontSize:12,color:isDark?"#34d399":"#059669"}} value={bd.advance||0} onChange={e=>setF("advance",e.target.value)}/>
                          <span style={{fontWeight:700,color:"#34d399"}}>{parseFloat(bd.advance||0).toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="bill-total-row net">
                        <span style={{color:accent}}>NET PAYABLE AMOUNT :</span>
                        <span style={{color:accent,fontSize:16}}>₹ {net.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer signatures */}
                  <div className="bill-footer-sigs">
                    <div className="bill-sig-box">
                      <div className="bill-sig-line"/>
                      <div style={{fontSize:12,fontWeight:700,marginBottom:2}}>Authorised Signatory</div>
                      <div className="bill-sig-label">Medical Superintendent</div>
                      <div className="bill-sig-label">Sangi Hospital</div>
                    </div>
                    <div className="bill-sig-box" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end"}}>
                      <div style={{fontSize:9,color:"#64748b",marginBottom:4,fontStyle:"italic"}}>Scan to visit our website</div>
                      <div style={{fontSize:10,color:accent,fontWeight:600}}>www.sangihospital.com</div>
                      <div style={{fontSize:9,color:"#64748b",marginTop:4}}>This is a computer generated bill</div>
                    </div>
                    <div className="bill-sig-box">
                      <div className="bill-sig-line"/>
                      <div style={{fontSize:12,fontWeight:700,marginBottom:2}}>Patient / Attendant Signature</div>
                      <div className="bill-sig-label">with date</div>
                    </div>
                  </div>

                  {/* Payment guidelines */}
                  <div style={{marginTop:20,padding:"12px 16px",background:isDark?"#080c18":"#f8faff",borderRadius:8,border:`1px solid ${isDark?"#1a2540":"#c7d5eb"}`,fontSize:10,color:"#64748b",lineHeight:1.8}}>
                    <div style={{fontWeight:700,marginBottom:6,color:accent}}>📋 Payment Guidelines & Important Instructions</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"2px 20px"}}>
                      {["All dues must be cleared prior to discharge.","Accepted modes: Cash, UPI, Debit/Credit Card, NEFT/RTGS.","ESIC / TPA patients must submit valid documents at admission.","Billing disputes must be raised within 24 hrs of bill generation.","Advance payments are adjusted in the final bill at discharge.","Medicines & consumables once issued are non-returnable.","Please collect original receipts for all payments made.",`Queries: laxminagar@sangihospital.com | +91-9717444531`].map((g,i)=>(
                        <div key={i}>• {g}</div>
                      ))}
                    </div>
                    <div style={{marginTop:8,textAlign:"center",fontSize:9}}>© 2026 Sangi Hospital Management System · Developed by IUI Solution +91-9717444531 / +91-9717444532</div>
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
        <div className="hms-stat-grid">
          {[{label:"Total",val:ts.total,col:accent},{label:"Pending",val:ts.pending,col:"#f59e0b"},{label:"In Progress",val:ts.inprogress,col:"#38bdf8"},{label:"Completed",val:ts.completed,col:"#34d399"},{label:"Urgent",val:ts.urgent,col:"#f87171"}].map((s,i)=>(
            <div key={i} className="hms-stat-card" style={{padding:"12px 14px",border:`1px solid ${s.col}18`}}><div className="hms-stat-num" style={{fontSize:20,color:s.col}}>{s.val}</div><div className="hms-stat-label">{s.label}</div></div>
          ))}
        </div>
        <div className="hms-card">
          <CardRow title="All Tasks" action={<button className="hms-add-btn" onClick={openNewTask}>+ Assign Task</button>}/>
          {!tasks.length?<EmptyState icon="✅" label="No tasks yet" sub='Click "Assign Task" to create the first task'/>:(
            <TableWrap heads={["Task","Assigned To","Dept","Priority","Status","Due Date","Patients","Created By","Actions"]}>
              {tasks.map((t,i)=>(
                <tr key={t.id} className="hms-tr-alt">
                  <Td><span className="hms-td-hi">{t.title}</span>{t.description&&<div style={{fontSize:9,color:"#64748b",marginTop:2,maxWidth:180}}>{t.description.slice(0,60)}{t.description.length>60?"…":""}</div>}</Td>
                  <Td>{t.assignedTo}</Td><Td><Badge col={accent}>{t.department}</Badge></Td>
                  <Td><PriorityPill p={t.priority}/></Td>
                  <Td><select className="hms-task-status-sel" style={{background:TASK_STATUS_META[t.status]?.bg||"transparent",borderColor:`${TASK_STATUS_META[t.status]?.color||"#6b7280"}40`,color:TASK_STATUS_META[t.status]?.color||"inherit"}} value={t.status} onChange={e=>updateTaskStatus(t.id,e.target.value)}>{TASK_STATUS.map(s=><option key={s} value={s}>{s}</option>)}</select></Td>
                  <Td sm style={{color:t.dueDate&&new Date(t.dueDate)<new Date()&&t.status!=="Completed"?"#f87171":"#64748b"}}>{fmtDt(t.dueDate)}</Td>
                  <Td sm>{(t.patientNames||[]).length>0?<div>{(t.patientNames||[]).map((name,ni)=>(<div key={ni} style={{color:"#38bdf8",fontSize:10}}>{name}</div>))}</div>:"—"}</Td>
                  <Td sm>{t.createdBy||"—"}</Td>
                  <Td><div style={{display:"flex",gap:4}}><ActionBtn col={accent} onClick={()=>openEditTask(t)}>✎ Edit</ActionBtn><ActionBtn col="#f87171" onClick={()=>deleteTask(t.id)}>✕</ActionBtn></div></Td>
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
    filteredTaskReport.forEach(t=>{
      if(!empMap[t.assignedTo]) empMap[t.assignedTo]={name:t.assignedTo,dept:t.department,total:0,completed:0,pending:0,inprogress:0,onhold:0};
      empMap[t.assignedTo].total++;
      if(t.status==="Completed") empMap[t.assignedTo].completed++;
      else if(t.status==="Pending") empMap[t.assignedTo].pending++;
      else if(t.status==="In Progress") empMap[t.assignedTo].inprogress++;
      else if(t.status==="On Hold") empMap[t.assignedTo].onhold++;
    });
    const empList=Object.values(empMap);
    return (
      <div>
        <PageHeader title="Task Report" subtitle="Filter and download task reports by time period, department, or employee"/>
        <div className="hms-card">
          <div className="hms-section-label">Filters</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:8}}>
            <div><label className="hms-lbl">Time Period</label><select className="hms-sel" value={taskReportFilter.period} onChange={e=>setTaskReportFilter(f=>({...f,period:e.target.value}))}><option value="all">All Time</option><option value="today">Today</option><option value="week">This Week</option><option value="month">This Month</option></select></div>
            <div><label className="hms-lbl">Department</label><select className="hms-sel" value={taskReportFilter.dept} onChange={e=>setTaskReportFilter(f=>({...f,dept:e.target.value}))}><option value="All">All Departments</option>{allDeptOptions.map(d=><option key={d}>{d}</option>)}</select></div>
            <div><label className="hms-lbl">Status</label><select className="hms-sel" value={taskReportFilter.status} onChange={e=>setTaskReportFilter(f=>({...f,status:e.target.value}))}><option value="All">All Status</option>{TASK_STATUS.map(s=><option key={s}>{s}</option>)}</select></div>
            <div><label className="hms-lbl">Employee Name</label><input className="hms-inp" style={{marginBottom:0}} placeholder="Search by name…" value={taskReportFilter.empName} onChange={e=>setTaskReportFilter(f=>({...f,empName:e.target.value}))}/></div>
          </div>
          <div style={{display:"flex",gap:8,marginTop:6,alignItems:"center"}}>
            <ActionBtn col="#34d399" onClick={()=>{exportTasksXLSX(filteredTaskReport,`task_report_${taskReportFilter.period}_${taskReportFilter.dept}.xlsx`);toast("Exported as XLSX");}}>↓ XLSX</ActionBtn>
            <ActionBtn col="#38bdf8" onClick={()=>{exportCSV(`task_report_${taskReportFilter.period}.csv`,filteredTaskReport.map(t=>({TaskID:t.id,Title:t.title,AssignedTo:t.assignedTo,Department:t.department,Priority:t.priority,Status:t.status,DueDate:t.dueDate||"—",CreatedDate:t.createdAt?.split("T")[0]||"—",Description:t.description||"—",CompletedDate:t.completedAt?.split("T")[0]||"—",PatientNames:(t.patientNames||[]).join("; ")||"—",PatientUHIDs:(t.patientUhids||[]).join("; ")||"—"})),["TaskID","Title","AssignedTo","Department","Priority","Status","DueDate","CreatedDate","Description","CompletedDate","PatientNames","PatientUHIDs"]);toast("Exported as CSV");}}>↓ CSV</ActionBtn>
            <span style={{marginLeft:"auto",fontSize:11,color:"#64748b"}}><strong>{filteredTaskReport.length}</strong> record{filteredTaskReport.length!==1?"s":""} · <span style={{color:accent}}>{periodLabel[taskReportFilter.period]}</span></span>
          </div>
        </div>
        <div className="hms-g4" style={{marginBottom:18}}>
          {TASK_STATUS.map(s=>{ const m=TASK_STATUS_META[s]||{color:"#6b7280",bg:"#6b728018"}; return (<div key={s} className="hms-stat-card" style={{padding:"10px 14px",textAlign:"center",border:`1px solid ${m.color}18`}}><div className="hms-stat-num" style={{fontSize:20,color:m.color}}>{filteredTaskReport.filter(t=>t.status===s).length}</div><div className="hms-stat-label">{s}</div></div>); })}
        </div>
        <div className="hms-card">
          <div className="hms-card-title" style={{marginBottom:14}}>Employee Task Summary — {periodLabel[taskReportFilter.period]}</div>
          {!empList.length?<div className="hms-empty">No tasks match current filters.</div>:(
            <TableWrap heads={["Employee","Department","Total","Pending","In Progress","Completed","On Hold","Completion %"]}>
              {empList.map((e,i)=>{ const pct=e.total?Math.round((e.completed/e.total)*100):0; return (<tr key={i}><Td hi>{e.name}</Td><Td><Badge col={accent}>{e.dept}</Badge></Td><Td><strong>{e.total}</strong></Td><Td><span style={{color:"#f59e0b"}}>{e.pending}</span></Td><Td><span style={{color:"#38bdf8"}}>{e.inprogress}</span></Td><Td><span style={{color:"#34d399"}}>{e.completed}</span></Td><Td><span style={{color:"#f87171"}}>{e.onhold}</span></Td><Td><div style={{display:"flex",alignItems:"center",gap:8}}><div className="hms-progress-bar-sm"><div className="hms-progress-fill" style={{width:`${pct}%`,background:"#34d399"}}/></div><span style={{fontSize:10,fontWeight:700,color:pct>=75?"#34d399":pct>=50?"#f59e0b":"#f87171",minWidth:32}}>{pct}%</span></div></Td></tr>); })}
            </TableWrap>
          )}
        </div>
        <div className="hms-card">
          <div className="hms-card-title" style={{marginBottom:14}}>Detailed Task List ({filteredTaskReport.length})</div>
          {!filteredTaskReport.length?<div className="hms-empty">No tasks match the selected filters.</div>:(
            <TableWrap heads={["Task ID","Title","Assigned To","Dept","Priority","Status","Due Date","Created","Patients","Completed"]}>
              {filteredTaskReport.map((t,i)=>(<tr key={t.id} className="hms-tr-alt"><Td mono>{t.id}</Td><Td><span className="hms-td-hi">{t.title}</span>{t.description&&<div style={{fontSize:9,color:"#64748b",marginTop:1}}>{t.description.slice(0,50)}{t.description.length>50?"…":""}</div>}</Td><Td>{t.assignedTo}</Td><Td><Badge col={accent}>{t.department}</Badge></Td><Td><PriorityPill p={t.priority}/></Td><Td><StatusPill s={t.status}/></Td><Td sm>{fmtDt(t.dueDate)}</Td><Td sm>{t.createdAt?.split("T")[0]||"—"}</Td><Td sm>{(t.patientNames||[]).length>0?<span style={{color:"#38bdf8"}}>{t.patientNames.join(", ")}</span>:"—"}</Td><Td><span style={{fontSize:10,color:"#34d399"}}>{t.completedAt?.split("T")[0]||"—"}</span></Td></tr>))}
            </TableWrap>
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
        <PageHeader title="Departments" subtitle="Manage hospital departments"/>
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}><button className="hms-add-btn-lg" onClick={()=>setShowDeptModal(true)}>+ Create Department</button></div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14,marginBottom:20}}>
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
                <div style={{fontSize:10,color:"#64748b",marginBottom:12,lineHeight:1.5}}>{dept.description}</div>
                <div style={{display:"flex",gap:10,marginBottom:deptTasks.length?10:0}}>
                  {[{label:"Members",val:dept.memberCount,col:dA},{label:"Tasks",val:deptTasks.length,col:"#38bdf8"},{label:"Done",val:completedTasks,col:"#34d399"}].map((s,j)=>(<div key={j} style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:800,color:s.col}}>{s.val}</div><div style={{fontSize:9,color:"#64748b"}}>{s.label}</div></div>))}
                </div>
                {deptTasks.length>0&&(<div><div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#64748b",marginBottom:4}}><span>Progress</span><span>{pct}%</span></div><ProgressBar pct={pct} col={dA}/></div>)}
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
      <PageHeader title="Employee Management" subtitle="Manage staff accounts and credentials"/>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
        <button className="hms-add-btn-lg" onClick={()=>{ setEditEmpId(null);setEmpPassErr(""); setEmpForm({fullName:"",username:"",empId:"",dept:"HOD",email:"",phone:"",role:"hod",password:"",confirmPassword:""}); setShowEmpModal(true); }}>+ Create Employee</button>
      </div>
      {!employees.length?<EmptyState icon="👤" label="No employees yet" sub='Click "Create Employee" to add your first employee'/>:(
        <TableWrap heads={["Emp ID","Full Name","Username","Role","Department","Email","Phone","Status","Actions"]}>
          {employees.map((emp,i)=>(
            <tr key={i} style={{borderBottom:"1px solid #1e2a3a"}}>
              <Td mono style={{color:accent}}>{emp.empId||emp.id}</Td><Td hi>{emp.fullName||emp.name}</Td><Td sm>{emp.username}</Td>
              <Td><Badge col="#818cf8">{emp.role||"Staff"}</Badge></Td><Td><Badge col={accent}>{emp.dept}</Badge></Td>
              <Td sm>{emp.email}</Td><Td sm>{emp.phone}</Td>
              <Td><Badge col={emp.status==="Inactive"?"#f87171":"#34d399"}>{emp.status||"Active"}</Badge></Td>
              <Td><div style={{display:"flex",gap:6}}><ActionBtn col={accent} onClick={()=>openEditEmployee(emp)}>✎ Edit / Reset</ActionBtn><ActionBtn col={emp.status==="Inactive"?"#34d399":"#f87171"} onClick={()=>handleToggleActive(emp,i)}>{emp.status==="Inactive"?"✓ Activate":"⊘ Deactivate"}</ActionBtn></div></Td>
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
        <div style={{fontSize:10,color:"#64748b",marginBottom:10}}>{bc.label} Branch</div>
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

  // ── RENDER ────────────────────────────────────────────────────────────────
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
      case "records":     return <UpdateRecordsPanel roleLabel="Office Admin"/>;
      case "departments": return renderDepartments();
      case "employees":   return renderEmployees();
      case "profile":     return renderProfile();
      default:            return renderHome();
    }
  };

  const sbWidth = collapsed ? 52 : 220;

  return (
    <div className="hms-wrap">
      <style>{DYNAMIC_CSS(accent,isDark)}</style>

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
            {!collapsed&&<div className="hms-nav-section" style={{padding:"0 14px"}}>Menu</div>}
            {NAV.map(item=>{ const Icon=item.icon; return (<div key={item.id} className={`hms-nav-item${activeTab===item.id?" active":""}`} style={{padding:collapsed?"10px 0":"10px 14px",justifyContent:collapsed?"center":"flex-start"}} onClick={()=>setActiveTab(item.id)} title={item.label}><span className="hms-nav-icon" style={{display:"inline-flex",alignItems:"center"}}>{Icon?<Icon size={15} strokeWidth={1.9}/>:null}</span>{!collapsed&&item.label}</div>); })}
          </nav>
          {!collapsed&&(<div style={{padding:"10px 12px",borderTop:"1px solid #1e2030",borderBottom:"1px solid #1e2030"}}><div className="hms-signed-in">Signed in as</div><div className="hms-signed-name">{currentDisplayName}</div><div className="hms-signed-role">{currentUser?.dept||currentUser?.role}</div></div>)}
          <div className="hms-sb-bot" style={{padding:collapsed?"10px 8px":"10px 12px"}}><button className="hms-col-btn" onClick={()=>setCollapsed(x=>!x)}>{collapsed?"▶":"◀"}</button></div>
        </aside>
        <main className="hms-main">{renderContent()}</main>
      </div>

      {/* ══ TASK MODAL ══ */}
      {showTaskModal&&(
        <div className="hms-modal-overlay" onClick={e=>e.target===e.currentTarget&&(setShowTaskModal(false),setEditTask(null))}>
          <div className="hms-modal-box" style={{width:540}}>
            <div className="hms-modal-title">{editTask?"Edit Task":"Assign New Task"}</div>
            <label className="hms-lbl">Task Title *</label><input className="hms-inp" placeholder="E.g. Prepare daily billing report" value={taskForm.title} onChange={e=>setTaskForm(f=>({...f,title:e.target.value}))}/>
            <label className="hms-lbl">Description</label><textarea className="hms-textarea" placeholder="Task details…" value={taskForm.description} onChange={e=>setTaskForm(f=>({...f,description:e.target.value}))}/>
            <div className="hms-g2">
              <div><label className="hms-lbl">Assigned To *</label><select className="hms-sel" value={taskForm.assignedToId} onChange={e=>setTaskForm(f=>({...f,assignedToId:e.target.value}))}><option value="">Select employee</option>{taskAssignableEmployees.map(e=>{ const fn=e.fullName||e.name||e.username; const id=e.empId||e.username||`ID-${e.id}`; return <option key={e.id} value={String(e.id)}>{`${fn} (${id})`}</option>; })}</select></div>
              <div><label className="hms-lbl">Department</label><select className="hms-sel" value={taskForm.department} onChange={e=>setTaskForm(f=>({...f,department:e.target.value,assignedToId:""}))}>{allDeptOptions.map(d=><option key={d}>{d}</option>)}</select></div>
            </div>
            <div className="hms-g2">
              <div><label className="hms-lbl">Priority</label><select className="hms-sel" value={taskForm.priority} onChange={e=>setTaskForm(f=>({...f,priority:e.target.value}))}>{TASK_PRIORITY.map(p=><option key={p}>{p}</option>)}</select></div>
              <div><label className="hms-lbl">Due Date</label><input className="hms-inp" type="date" value={taskForm.dueDate} onChange={e=>setTaskForm(f=>({...f,dueDate:e.target.value}))}/></div>
            </div>
            <label className="hms-lbl">Link to Patients <span style={{color:"#64748b",fontWeight:400,marginLeft:6}}>(optional · up to 8)</span></label>
            {taskForm.patientUhids.length>0&&(<div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>{taskForm.patientUhids.map((uhid,idx)=>(<div key={uhid} className="hms-patient-selected-pill">🧑‍⚕️ {taskForm.patientNames[idx]}<span style={{color:"#64748b",fontSize:10,fontWeight:400}}> · {uhid}</span><button className="hms-patient-clear-btn" onClick={()=>setTaskForm(f=>({...f,patientUhids:f.patientUhids.filter((_,i)=>i!==idx),patientNames:f.patientNames.filter((_,i)=>i!==idx)}))}>✕</button></div>))}<button style={{fontSize:10,color:"#f87171",background:"none",border:"1px solid #f8717140",borderRadius:12,padding:"3px 10px",cursor:"pointer"}} onClick={()=>setTaskForm(f=>({...f,patientUhids:[],patientNames:[]}))}>Clear All</button></div>)}
            {taskForm.patientUhids.length<8&&(<><input className="hms-patient-search" placeholder="Search by patient name or UHID…" value={taskPatientSearch} onChange={e=>setTaskPatientSearch(e.target.value)}/><div className="hms-patient-select-box">{filteredTaskPatients.length===0?(<div style={{padding:"10px 12px",fontSize:11,color:"#64748b",textAlign:"center"}}>No patients found</div>):filteredTaskPatients.map(p=>{ const isSel=taskForm.patientUhids.includes(p.uhid); return (<div key={p.uhid} className={`hms-patient-select-item${isSel?" selected":""}`} onClick={()=>toggleTaskPatient(p)}><div><span style={{fontWeight:600,color:isDark?"#e2e8f0":"#1e293b"}}>{p.name}</span><span style={{marginLeft:8,color:"#64748b",fontSize:10}}>{p.uhid}</span>{isSel&&<span style={{marginLeft:6,color:accent,fontSize:11,fontWeight:700}}>✓</span>}</div><div style={{display:"flex",gap:5,alignItems:"center"}}><span style={{fontSize:9,padding:"2px 6px",borderRadius:10,background:p.status==="Admitted"?"#34d39918":"#6b728018",color:p.status==="Admitted"?"#34d399":"#6b7280",border:`1px solid ${p.status==="Admitted"?"#34d39940":"#6b728040"}`}}>{p.status}</span><span style={{fontSize:9,color:"#64748b"}}>{p.branch}</span></div></div>); })}</div></>)}
            <div style={{fontSize:10,color:"#64748b",marginTop:4,marginBottom:4}}>{taskForm.patientUhids.length}/8 patients selected{taskForm.patientUhids.length>=8&&<span style={{color:"#f87171",marginLeft:6}}>· Maximum reached</span>}</div>
            <div className="hms-modal-foot"><button className="hms-cancel-btn" onClick={()=>{setShowTaskModal(false);setEditTask(null);}}>Cancel</button><button className="hms-save-btn" onClick={saveTask}>{editTask?"Update Task":"Assign Task"}</button></div>
          </div>
        </div>
      )}

      {/* ══ DEPARTMENT MODAL ══ */}
      {showDeptModal&&(<div className="hms-modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowDeptModal(false)}><div className="hms-modal-box" style={{width:420}}><div className="hms-modal-title">Create New Department</div><label className="hms-lbl">Department Name *</label><input className="hms-inp" placeholder="E.g. Radiology" value={deptForm.name} onChange={e=>setDeptForm(f=>({...f,name:e.target.value}))}/><label className="hms-lbl">Description</label><input className="hms-inp" placeholder="Brief description" value={deptForm.description} onChange={e=>setDeptForm(f=>({...f,description:e.target.value}))}/><label className="hms-lbl">Department Head (optional)</label><input className="hms-inp" placeholder="Name of HOD" value={deptForm.head} onChange={e=>setDeptForm(f=>({...f,head:e.target.value}))}/><div className="hms-modal-foot"><button className="hms-cancel-btn" onClick={()=>setShowDeptModal(false)}>Cancel</button><button className="hms-save-btn" onClick={saveDepartment}>Create Department</button></div></div></div>)}

      {/* ══ EMPLOYEE MODAL ══ */}
      {showEmpModal&&(<div className="hms-modal-overlay" onClick={e=>e.target===e.currentTarget&&(setShowEmpModal(false),setEmpPassErr(""),setEditEmpId(null))}><div className="hms-modal-box" style={{width:520}}><div className="hms-modal-title">{editEmpId?"Edit Employee Details":"Create New Employee"}</div><div className="hms-g2">{[["Full Name","fullName","text","Jane Doe"],["Username","username","text","jane.doe"],["Employee ID","empId","text","EMP-001"],["Email","email","email","jane@hospital.com"],["Phone","phone","tel","+91 98765 43210"]].map(([lbl,k,type,ph])=>(<div key={k}><label className="hms-lbl">{lbl}</label><input type={type} placeholder={ph} value={empForm[k]} className="hms-inp" onChange={e=>{setEmpForm(f=>({...f,[k]:e.target.value}));setEmpPassErr("");}} disabled={k==="username"&&!!editEmpId}/></div>))}</div><label className="hms-lbl">Access Role</label><select className="hms-sel" value={empForm.role} onChange={e=>{ const nr=e.target.value; const nd=EMPLOYEE_ROLE_OPTIONS.find(o=>o.value===nr)?.label||empForm.dept; setEmpForm(f=>({...f,role:nr,dept:nd})); }}>{EMPLOYEE_ROLE_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select><label className="hms-lbl">Department</label><select className="hms-sel" value={empForm.dept} onChange={e=>setEmpForm(f=>({...f,dept:e.target.value}))}>{allDeptOptions.map(d=><option key={d}>{d}</option>)}</select><div className="hms-g2">{[["Password","password",empShowPass,setEmpShowPass],["Confirm Password","confirmPassword",empShowConfirm,setEmpShowConfirm]].map(([lbl,k,show,setShow])=>(<div key={k}><label className="hms-lbl">{lbl}{editEmpId&&<span style={{fontSize:9}}> (Leave blank to keep current)</span>}</label><div className="hms-pass-wrap"><input type={show?"text":"password"} placeholder={editEmpId?"Leave blank to keep current":"••••••••"} value={empForm[k]} className="hms-inp" style={{paddingRight:50}} onChange={e=>{setEmpForm(f=>({...f,[k]:e.target.value}));setEmpPassErr("");}}/><button type="button" className="hms-pass-toggle" onClick={()=>setShow(p=>!p)}>{show?"HIDE":"SHOW"}</button></div></div>))}</div>{empPassErr&&<div className="hms-err-text">{empPassErr}</div>}<div className="hms-modal-foot"><button className="hms-cancel-btn" onClick={()=>{setShowEmpModal(false);setEmpPassErr("");setEditEmpId(null);}}>Cancel</button><button className="hms-save-btn" onClick={saveEmployee}>{editEmpId?"Save Changes":"Create Employee"}</button></div></div></div>)}

      {/* ══ MED DRAWER ══ */}
      {showMedModal&&editMedPt&&(<MedDrawer editMedPt={editMedPt} onClose={()=>{setShowMedModal(false);setEditMedPt(null);}} updateMed={updateMed} addMedRow={addMedRow} delMedRow={delMedRow} saveMeds={saveMeds} fmt={fmt} canEditRate={true}/>)}

      {/* ══ VIEW SUMMARY MODAL ══ */}
      {showViewModal&&viewPt&&(<div className="hms-modal-overlay" onClick={e=>e.target===e.currentTarget&&(setShowViewModal(false),setViewPt(null))}><div className="hms-modal-box" style={{width:640}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}><div><div className="hms-modal-title">Discharge Summary</div><div style={{display:"flex",alignItems:"center",gap:8}}><SummaryPill type={viewPt.dischargeSummary?.type}/><span className="hms-td-mono">{viewPt.uhid}</span></div></div><button className="hms-logout-btn" onClick={()=>{setShowViewModal(false);setViewPt(null);}}>✕</button></div><div className="hms-stat-card" style={{padding:"12px 14px",marginBottom:14,border:"1px solid #f59e0b18"}}><div style={{display:"flex",gap:14,flexWrap:"wrap"}}>{[["Patient",viewPt.patientName||viewPt.name],["Age/Gender",`${viewPt.ageYY||viewPt.age}Y / ${viewPt.gender}`],["Blood Group",viewPt.bloodGroup||"—"],["Phone",viewPt.phone||"—"],["Admit Date",fmtDt(viewPt.admissions?.[0]?.dateTime)]].map(([k,v])=>(<div key={k}><div className="hms-view-key">{k}</div><div className="hms-view-val" style={{fontWeight:700}}>{v}</div></div>))}</div></div><div className="hms-section-label">Clinical Details</div>{[["Diagnosis",viewPt.dischargeSummary?.diagnosis],["Treatment",viewPt.dischargeSummary?.treatment],["Treating Doctor",viewPt.dischargeSummary?.doctorName],["Discharge Date",fmtDt(viewPt.dischargeSummary?.date)],["Follow-up",viewPt.dischargeSummary?.followUp],["Notes",viewPt.dischargeSummary?.notes]].map(([k,v])=>(<div key={k} className="hms-view-row"><div className="hms-view-key">{k}</div><div className="hms-view-val" style={{color:v&&v!=="—"?"inherit":"#64748b",fontStyle:v&&v!=="—"?"normal":"italic"}}>{v||"Not set"}</div></div>))}<div className="hms-modal-foot"><button className="hms-cancel-btn" onClick={()=>{setShowViewModal(false);setViewPt(null);}}>Close</button><ActionBtn col={accent} onClick={()=>{setShowViewModal(false);openSummaryEditor(viewPt);}}>✎ Edit</ActionBtn><button className="hms-save-btn" onClick={()=>handlePrintSummary(viewPt)}>↓ Download</button></div></div></div>)}

      {/* ══ EDIT SUMMARY MODAL ══ */}
      {showSummaryModal&&editSumPt&&(<div className="hms-modal-overlay" onClick={e=>e.target===e.currentTarget&&(setShowSummaryModal(false),setEditSumPt(null))}><div className="hms-modal-box" style={{width:760,maxHeight:"92vh",display:"flex",flexDirection:"column"}}><div className="hms-modal-title" style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}><div><div>Discharge Summary — {editSumPt.patientName||editSumPt.name}</div><div style={{fontSize:11,color:"#64748b",fontWeight:500,marginTop:3}}>{editSumPt.uhid} · {editSumPt._branchLabel||bc.label}</div></div><SummaryPill type={summaryType}/></div><div style={{display:"grid",gridTemplateColumns:"1fr",gap:6,marginBottom:10}}><label className="hms-lbl">Summary Type / Format</label><select className="hms-sel" value={summaryType} disabled={summaryLoading||summarySaving} onChange={e=>reloadSummary(e.target.value)}>{SUMMARY_TYPES.map(t=><option key={t} value={t}>{SUMMARY_LABELS[t]||t}</option>)}</select><div style={{fontSize:10,color:"#64748b",marginTop:-2}}>Picking a type loads the official template for that discharge format.</div></div><div style={{flex:1,overflowY:"auto",paddingRight:4}}>{summaryLoading?(<div style={{textAlign:"center",padding:"40px 12px",color:"#64748b",fontSize:13}}>Loading {SUMMARY_LABELS[summaryType]||summaryType} template…</div>):!summaryContent||!Array.isArray(summaryContent.sections)||summaryContent.sections.length===0?(<div style={{textAlign:"center",padding:"40px 12px",color:"#64748b",fontSize:13}}>No template sections available.<div style={{marginTop:10}}><button className="hms-add-btn" onClick={()=>reloadSummary(summaryType)}>Retry</button></div></div>):(<div style={{display:"flex",flexDirection:"column",gap:14}}>{summaryContent.sections.map((sec,idx)=>{ const key=sec.key||`sec-${idx}`; if(sec.type==="textarea") return (<div key={key}><label className="hms-lbl">{sec.label}</label><textarea className="hms-inp" style={{minHeight:80,resize:"vertical",fontFamily:"inherit"}} value={sec.value||""} rows={3} onChange={e=>updateSummarySection(idx,e.target.value)}/></div>); if(sec.type==="text") return (<div key={key}><label className="hms-lbl">{sec.label}</label><input className="hms-inp" type="text" value={sec.value||""} onChange={e=>updateSummarySection(idx,e.target.value)}/></div>); if(sec.type==="vitals_grid"){const vitals=(sec.value&&typeof sec.value==="object")?sec.value:{}; const vitalKeys=Object.keys(vitals).length?Object.keys(vitals):(sec.fields||[]); return (<div key={key} style={{border:`1px solid ${accent}25`,borderRadius:8,padding:14}}><div className="hms-lbl" style={{marginBottom:10}}>{sec.label}</div><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>{vitalKeys.map(vKey=>(<div key={vKey}><div style={{fontSize:10,color:"#64748b",textTransform:"uppercase",marginBottom:4,fontWeight:700}}>{vKey}</div><input className="hms-inp" type="text" value={vitals[vKey]||""} onChange={e=>updateSummaryVital(idx,vKey,e.target.value)}/></div>))}</div></div>);} return null; })}</div>)}</div><div className="hms-modal-foot"><button className="hms-cancel-btn" onClick={()=>{setShowSummaryModal(false);setEditSumPt(null);}} disabled={summarySaving}>Cancel</button><button style={{background:"transparent",border:`1px solid ${accent}40`,color:accent,padding:"8px 14px",borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:700}} onClick={()=>handlePrintSummary(editSumPt)} disabled={summaryLoading||summarySaving}>↓ Print PDF</button><button className="hms-save-btn" onClick={saveSummary} disabled={summaryLoading||summarySaving||!summaryContent}>{summarySaving?"Saving…":"Save"}</button></div></div></div>)}

      {/* ══ DELETE CONFIRM ══ */}
      {showDeleteConfirm&&deletePt&&(<div className="hms-modal-overlay" onClick={e=>e.target===e.currentTarget&&(setShowDeleteConfirm(false),setDeletePt(null))}><div className="hms-modal-box" style={{width:380}}><div className="hms-modal-title" style={{color:"#f87171"}}>Clear Discharge Summary?</div><div style={{fontSize:12,color:"#94a3b8",marginBottom:18,lineHeight:1.6}}>This will reset the discharge summary for <strong>{deletePt.patientName||deletePt.name}</strong> ({deletePt.uhid}). This action cannot be undone.</div><div className="hms-modal-foot"><button className="hms-cancel-btn" onClick={()=>{setShowDeleteConfirm(false);setDeletePt(null);}}>Cancel</button><button className="hms-danger-btn" onClick={doDeleteSummary}>Yes, Clear Summary</button></div></div></div>)}

      {/* ══ REPORTS MODAL (legacy - kept for Patients page) ══ */}
      {showReportModal&&editRepPt&&(
        <div className="hms-modal-overlay" onClick={e=>e.target===e.currentTarget&&(setShowReportModal(false),setEditRepPt(null))}>
          <div className="hms-modal-box" style={{width:750,maxHeight:"90vh",overflowY:"auto"}}>
            <div className="hms-modal-title" style={{marginBottom:16}}>Lab Reports — {editRepPt.patientName||editRepPt.name}</div>
            {!(editRepPt.reports||[]).length&&<div className="hms-empty" style={{padding:"1rem"}}>No reports found.</div>}
            {(editRepPt.reports||[]).map((rep,rIdx)=>(
              <div key={rIdx} style={{background:isDark?"#080c18":"#f8fafc",border:`1px solid ${isDark?"#1a2540":"#e2e8f0"}`,borderRadius:10,padding:16,marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
                  <input className="hms-inp" style={{fontWeight:700,fontSize:15,width:"50%"}} value={rep.reportName||rep.name} onChange={e=>{const r=[...editRepPt.reports];r[rIdx].reportName=e.target.value;setEditRepPt({...editRepPt,reports:r});}} placeholder="Report Name"/>
                  <div style={{display:"flex",gap:10}}><input className="hms-inp" type="date" value={rep.date} onChange={e=>{const r=[...editRepPt.reports];r[rIdx].date=e.target.value;setEditRepPt({...editRepPt,reports:r});}}/><ActionBtn col="#f87171" onClick={()=>delReport(rIdx)}>✕ Delete</ActionBtn></div>
                </div>
                <div style={{overflowX:"auto",marginBottom:10}}>
                  <table style={{width:"100%",fontSize:12,borderCollapse:"collapse"}}><thead><tr style={{color:"#64748b",borderBottom:`1px solid ${isDark?"#1a2540":"#e2e8f0"}`}}><th style={{padding:6,textAlign:"left"}}>Test Name</th><th style={{padding:6,textAlign:"left"}}>Result</th><th style={{padding:6,textAlign:"left"}}>Unit</th><th style={{padding:6,textAlign:"left"}}>Ref Range</th><th style={{padding:6}}>✕</th></tr></thead>
                    <tbody>{(rep.tests||[]).map((test,tIdx)=>(<tr key={tIdx} style={{borderBottom:`1px solid ${isDark?"#0f172a":"#f1f5f9"}`}}><td style={{padding:4}}><input className="hms-inp-sm" style={{width:"100%"}} value={test.name} onChange={e=>{const r=[...editRepPt.reports];r[rIdx].tests[tIdx].name=e.target.value;setEditRepPt({...editRepPt,reports:r});}}/></td><td style={{padding:4}}><input className="hms-inp-sm" style={{width:"100%",color:"#38bdf8",fontWeight:600}} value={test.result||test.value} onChange={e=>{const r=[...editRepPt.reports];r[rIdx].tests[tIdx].result=e.target.value;setEditRepPt({...editRepPt,reports:r});}}/></td><td style={{padding:4}}><input className="hms-inp-sm" style={{width:"100%"}} value={test.unit} onChange={e=>{const r=[...editRepPt.reports];r[rIdx].tests[tIdx].unit=e.target.value;setEditRepPt({...editRepPt,reports:r});}}/></td><td style={{padding:4}}><input className="hms-inp-sm" style={{width:"100%"}} value={test.refRange} onChange={e=>{const r=[...editRepPt.reports];r[rIdx].tests[tIdx].refRange=e.target.value;setEditRepPt({...editRepPt,reports:r});}}/></td><td style={{padding:4,textAlign:"center"}}><button style={{background:"none",border:"none",color:"#f87171",cursor:"pointer"}} onClick={()=>{const r=[...editRepPt.reports];r[rIdx].tests.splice(tIdx,1);setEditRepPt({...editRepPt,reports:r});}}>✕</button></td></tr>))}</tbody>
                  </table>
                  <button style={{fontSize:11,color:accent,background:"none",border:"none",marginTop:8,cursor:"pointer",fontWeight:600}} onClick={()=>{const r=[...editRepPt.reports];if(!r[rIdx].tests)r[rIdx].tests=[];r[rIdx].tests.push({name:"",result:"",unit:"",refRange:""});setEditRepPt({...editRepPt,reports:r});}}>+ Add Custom Test Row</button>
                </div>
                <textarea className="hms-textarea" rows={2} placeholder="Remarks / Notes" value={rep.remarks} onChange={e=>{const r=[...editRepPt.reports];r[rIdx].remarks=e.target.value;setEditRepPt({...editRepPt,reports:r});}} style={{width:"100%",marginTop:8}}/>
              </div>
            ))}
            <div className="hms-section-label" style={{marginTop:16}}>Create New Blank Report</div>
            <div className="hms-g3" style={{alignItems:"center"}}>
              <select className="hms-sel" value={newReport.type} onChange={e=>{const type=e.target.value;const template=LAB_TEMPLATES[type]||{tests:[],defaultRemarks:""};setNewReport({...newReport,type,name:type,tests:template.tests.map(t=>({name:t.name,result:"",unit:t.unit,refRange:t.refRange})),remarks:template.defaultRemarks});}}>
                <option value="">-- Pre-fill Template --</option>{Object.keys(LAB_TEMPLATES).map(k=><option key={k} value={k}>{k}</option>)}
              </select>
              <input className="hms-inp" placeholder="Or type custom name..." value={newReport.name} onChange={e=>setNewReport(f=>({...f,name:e.target.value}))}/>
              <ActionBtn col={accent} onClick={()=>{ if(!newReport.name) return; const newRep={id:Date.now(),reportName:newReport.name,date:new Date().toISOString().slice(0,10),remarks:"",tests:newReport.tests||[]}; setEditRepPt(prev=>({...prev,reports:[...(prev.reports||[]),newRep]})); setNewReport({name:"",type:"",tests:[]}); }}>+ Add Report</ActionBtn>
            </div>
            <div className="hms-modal-foot" style={{marginTop:24}}><button className="hms-cancel-btn" onClick={()=>{setShowReportModal(false);setEditRepPt(null);}}>Cancel</button><button className="hms-save-btn" onClick={saveReports}>💾 Save All Reports</button></div>
          </div>
        </div>
      )}
    </div>
  );
}