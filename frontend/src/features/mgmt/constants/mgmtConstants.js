import {
  Home, Users, DoorOpen, Pill, ClipboardList, CreditCard,
  CheckSquare, BarChart3, Building2, UserRound, Hospital,
  AlertTriangle, FlaskConical,
} from "lucide-react";

export const BC = {
  laxmi: { label:"Laxmi Nagar", accent:"#3b82f6", dim:"rgba(59,130,246,0.12)", border:"rgba(59,130,246,0.32)" },
  raya:  { label:"Raya",        accent:"#2563eb", dim:"rgba(37,99,235,0.12)",  border:"rgba(37,99,235,0.32)" },
};
export const BRANCH_KEYS         = ["laxmi","raya"];
export const BRANCH_KEY_TO_CODE  = { laxmi:"LNM", raya:"RYM" };
export const BRANCH_CODE_TO_KEY  = { LNM:"laxmi", RYM:"raya" };
export const EMPLOYEE_ID_PREFIXES = { LNM:"LAK", RYM:"RAY", ALL:"OFF" };

export const DEPT_OPTIONS    = ["HOD","Billing","Uploading","Intimation","Query","OPD","Doctor","Nursing","Quality Analyst","Notes"];
export const TASK_STATUS     = ["Pending","In Progress","Completed","On Hold","Overdue"];
export const TASK_PRIORITY   = ["Low","Medium","High","Urgent"];
export const SUMMARY_TYPES   = ["NORMAL","LAMA","REFER","DEATH","DOPR"];
export const SUMMARY_LABELS  = { NORMAL:"Normal", LAMA:"LAMA", REFER:"Refer", DEATH:"Death", DOPR:"DOPR" };

export const DISCHARGE_TYPES_CFG = {
  NORMAL: { key:"NORMAL", label:"Normal Discharge", color:"#059669", bg:"#d1fae5", border:"#6ee7b7", icon:"✅" },
  LAMA:   { key:"LAMA",   label:"LAMA",             color:"#d97706", bg:"#fef3c7", border:"#fcd34d", icon:"⚠️" },
  REFER:  { key:"REFER",  label:"Refer",             color:"#2563eb", bg:"#dbeafe", border:"#93c5fd", icon:"🏥" },
  DEATH:  { key:"DEATH",  label:"Death",             color:"#dc2626", bg:"#fee2e2", border:"#fca5a5", icon:"💀" },
  DOPR:   { key:"DOPR",   label:"DAMA / DOPR",       color:"#7c3aed", bg:"#ede9fe", border:"#c4b5fd", icon:"🚨" },
};

export const DISCHARGE_SECTIONS_MAP = {
  NORMAL: [
    { key:"chiefComplaints",   label:"Chief Complaints",           rows:3 },
    { key:"historyOfIllness",  label:"History of Present Illness", rows:3 },
    { key:"onExamination",     label:"On Examination",             rows:2, type:"vitals_grid" },
    { key:"investigations",    label:"Investigations",             rows:3 },
    { key:"diagnosis",         label:"Diagnosis",                  rows:2 },
    { key:"treatmentGiven",    label:"Treatment Given",            rows:4 },
    { key:"adviceOnDischarge", label:"Advice on Discharge",        rows:3 },
    { key:"followUp",          label:"Follow Up",                  rows:2 },
  ],
  LAMA: [
    { key:"chiefComplaints",   label:"Chief Complaints",              rows:3 },
    { key:"diagnosis",         label:"Provisional Diagnosis",         rows:2 },
    { key:"onExamination",     label:"On Examination",                rows:2, type:"vitals_grid" },
    { key:"treatmentGiven",    label:"Treatment Given During Stay",   rows:3 },
    { key:"reasonForLama",     label:"Reason for LAMA",               rows:2 },
    { key:"adviceOnDischarge", label:"Advice Given Before Leaving",   rows:2 },
    { key:"lamaDeclaration",   label:"Declaration / Remarks",         rows:2 },
  ],
  REFER: [
    { key:"chiefComplaints",   label:"Chief Complaints",  rows:3 },
    { key:"diagnosis",         label:"Diagnosis",         rows:2 },
    { key:"onExamination",     label:"On Examination",    rows:2, type:"vitals_grid" },
    { key:"treatmentGiven",    label:"Treatment Given",   rows:3 },
    { key:"referredTo",        label:"Referred To",       rows:1 },
    { key:"reasonForDopr",     label:"Reason for Referral", rows:2 },
    { key:"adviceOnDischarge", label:"Advice Given",      rows:2 },
  ],
  DEATH: [
    { key:"chiefComplaints",   label:"Chief Complaints",        rows:3 },
    { key:"diagnosis",         label:"Diagnosis",               rows:2 },
    { key:"onExamination",     label:"On Examination",          rows:2, type:"vitals_grid" },
    { key:"treatmentGiven",    label:"Treatment Given",         rows:3 },
    { key:"adviceOnDischarge", label:"Remarks / Declaration",   rows:3 },
  ],
  DOPR: [
    { key:"chiefComplaints",   label:"Chief Complaints",          rows:3 },
    { key:"diagnosis",         label:"Diagnosis / Provisional",   rows:2 },
    { key:"onExamination",     label:"On Examination",            rows:2, type:"vitals_grid" },
    { key:"treatmentGiven",    label:"Treatment Given",           rows:3 },
    { key:"reasonForDopr",     label:"Reason for DAMA / DOPR",   rows:2 },
    { key:"referredTo",        label:"Referred To (if any)",      rows:1 },
    { key:"adviceOnDischarge", label:"Advice Given",              rows:2 },
  ],
};

export const RADIOLOGY_REPORT_TYPES_LIST = ["X-Ray","USG","CT Scan","MRI","Echo","ECG","PET Scan","Mammography","Fluoroscopy","Nuclear Medicine"];
export const PATHOLOGY_REPORT_TYPES_LIST = ["Haematology","Biochemistry","Microbiology","Immunology – Serology","Histopathology","Cytology","Blood Bank","Clinical Pathology","Endocrinology"];

export const SUMMARY_META = {
  NORMAL:{ color:"#34d399", bg:"#34d39916" },
  LAMA:  { color:"#f59e0b", bg:"#f59e0b16" },
  REFER: { color:"#22d3ee", bg:"#22d3ee16" },
  DEATH: { color:"#f87171", bg:"#f8717116" },
  DOPR:  { color:"#c084fc", bg:"#c084fc16" },
};
export const TASK_STATUS_META = {
  "Pending":     { color:"#f59e0b", bg:"#f59e0b18" },
  "In Progress": { color:"#38bdf8", bg:"#38bdf818" },
  "Completed":   { color:"#34d399", bg:"#34d39918" },
  "On Hold":     { color:"#f87171", bg:"#f8717118" },
  "Overdue":     { color:"#f87171", bg:"#f8717118" },
};
export const TASK_PRIORITY_META = {
  "Low":    { color:"#6b7280", bg:"#6b728018" },
  "Medium": { color:"#f59e0b", bg:"#f59e0b18" },
  "High":   { color:"#f87171", bg:"#f8717118" },
  "Urgent": { color:"#c084fc", bg:"#c084fc18" },
};
export const DEPT_ICONS        = { HOD:"👔", Billing:"💳", Uploading:"☁️", Intimation:"📢", Query:"❓", OPD:"🏥", Doctor:"🩺", Nursing:"💉", "Quality Analyst":"📊", Notes:"📝" };
export const DEPT_ACCENT_CYCLE = ["#34d399","#818cf8","#f59e0b","#38bdf8","#f87171","#c084fc","#22d3ee"];

export const EMPLOYEE_ROLE_OPTIONS = [
  { value:"receptionist",    label:"Receptionist" },
  { value:"hod",             label:"HOD" },
  { value:"billing",         label:"Billing" },
  { value:"opd",             label:"OPD" },
  { value:"intimation",      label:"Intimation" },
  { value:"query",           label:"Query" },
  { value:"uploading",       label:"Uploading" },
  { value:"doctor",          label:"Doctor" },
  { value:"nursing",         label:"Nursing" },
  { value:"quality_analyst", label:"Quality Analyst" },
  { value:"notes",           label:"Notes" },
];
export const DEPARTMENT_ROLE_MAP = {
  HOD:"hod", Billing:"billing", OPD:"opd", Intimation:"intimation",
  Query:"query", Uploading:"uploading", Receptionist:"receptionist",
  Doctor:"doctor", Nursing:"nursing", "Quality Analyst":"quality_analyst", Notes:"notes",
};
export const TASK_ASSIGNABLE_ROLES = new Set([
  "receptionist","billing","hod","opd","intimation","query","uploading",
  "admin","office_admin","doctor","nursing","quality_analyst","notes",
]);

export const NAV = [
  { id:"home",        label:"Home",            icon:Home },
  { id:"patients",    label:"Patients",        icon:Users },
  { id:"discharge",   label:"Discharge",       icon:DoorOpen },
  { id:"medicines",   label:"Medicines",       icon:Pill },
  { id:"reports",     label:"Reports",         icon:ClipboardList },
  { id:"billing",     label:"Billing",         icon:CreditCard },
  { id:"tasks",       label:"Task Manager",    icon:CheckSquare },
  { id:"taskreport",  label:"Task Report",     icon:BarChart3 },
  { id:"medhistory",  label:"Medical History", icon:Hospital },
  { id:"records",     label:"Update Records",  icon:AlertTriangle },
  { id:"departments", label:"Departments",     icon:Building2 },
  { id:"employees",   label:"Employees",       icon:Users },
  { id:"profile",     label:"My Profile",      icon:UserRound },
];

export const MGMT_SERVICE_MASTER = [
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

export const LAB_TEMPLATES = {
  "Complete Blood Count (CBC)": {
    tests: [
      { name:"HAEMOGLOBIN",              unit:"gm/dl",      refRange:"12–16" },
      { name:"TLC (Total Leucocyte Count)", unit:"/cumm",   refRange:"4000–11000" },
      { name:"POLYMORPHS",               unit:"%",          refRange:"40-75" },
      { name:"LYMPHOCYTE",               unit:"%",          refRange:"20-40" },
      { name:"EOSINOPHIL",               unit:"%",          refRange:"01-06" },
      { name:"MONOCYTE",                 unit:"%",          refRange:"00-08" },
      { name:"BASOPHIL",                 unit:"%",          refRange:"00-00" },
      { name:"PCV",                      unit:"%",          refRange:"34-45" },
      { name:"M C V",                    unit:"Fl/dl",      refRange:"76-96" },
      { name:"M C H",                    unit:"Pg/dl",      refRange:"27-32" },
      { name:"M C H C",                  unit:"gm/dl",      refRange:"31-38" },
      { name:"R B C",                    unit:"mill/cumm",  refRange:"3.5-5.5" },
      { name:"PLATELET COUNT",           unit:"Lacs/cumm",  refRange:"1.5-4.5" },
      { name:"ESR (Wintrobe)",           unit:"mm",         refRange:"M(0-10), F(0-20)" },
    ],
    defaultRemarks:"***End Of The Report***",
  },
  "Kidney Function Test (KFT)": {
    tests: [
      { name:"BLOOD UREA",       unit:"mg/dl",  refRange:"13-45"  },
      { name:"SERUM CREATININE", unit:"mg/dl",  refRange:"0.7-1.4" },
      { name:"S.URIC ACID",      unit:"mg/dl",  refRange:"3.2-7.2" },
      { name:"SODIUM",           unit:"mmol/L", refRange:"135-145" },
      { name:"POTASSIUM",        unit:"mmol/L", refRange:"3.6-5.0" },
      { name:"CALCIUM",          unit:"mg/dl",  refRange:"8.2-10.5" },
    ],
    defaultRemarks:"***End Of The Report***",
  },
  "Liver Function Test (LFT)": {
    tests: [
      { name:"SERUM BILIRUBIN (TOTAL)",   unit:"mg/dl", refRange:"0.2-1.3" },
      { name:"CONJUGATED (D BILIRUBIN)",  unit:"mg/dl", refRange:"0.0-0.3" },
      { name:"UNCONJUGATED (I.D BILIRUBIN)", unit:"mg/dl", refRange:"0.2-1.1" },
      { name:"SGOT/AST",                  unit:"U/L",   refRange:"00-55" },
      { name:"SGPT/ALT",                  unit:"U/L",   refRange:"00-40" },
      { name:"TOTAL PROTEIN",             unit:"gm/dl", refRange:"6.3-8.2" },
      { name:"ALBUMIN",                   unit:"gm/dl", refRange:"3.5-5.0" },
      { name:"GLOBULINE",                 unit:"gm/dl", refRange:"2.5-5.6" },
      { name:"ALKALINE PHOSPHATASE",      unit:"IU/L",  refRange:"20-130" },
    ],
    defaultRemarks:"***End Of The Report***",
  },
  "Lipid Profile": {
    tests: [
      { name:"CHOLESTEROL TOTAL", unit:"mg/dl", refRange:"125-200" },
      { name:"TRIGLYCERIDE",      unit:"mg/dl", refRange:"25-200"  },
      { name:"CHOLESTEROL HDL",   unit:"mg/dl", refRange:"35-80"   },
      { name:"CHOLESTEROL VLDL",  unit:"mg/dl", refRange:"5-40"    },
      { name:"CHOLESTEROL LDL",   unit:"mg/dl", refRange:"85-130"  },
      { name:"LDL. / HDL RATIO",  unit:"mg/dl", refRange:"1.5-3.5" },
    ],
    defaultRemarks:"***End Of The Report***",
  },
  "Urine Examination (Routine)": {
    tests: [
      { name:"COLOUR",    unit:"",    refRange:"Pale Yellow" },
      { name:"ALBUMIN",   unit:"",    refRange:"NIL" },
      { name:"SUGAR",     unit:"",    refRange:"NIL" },
      { name:"PH",        unit:"",    refRange:"4.5-8.0" },
      { name:"PUS CELLS", unit:"/HPF",refRange:"0-5" },
      { name:"RBC'S",     unit:"/HPF",refRange:"NIL" },
      { name:"BACTERIA",  unit:"",    refRange:"NIL" },
    ],
    defaultRemarks:"***End Of The Report***",
  },
  "Widal Test (Slide Method)": {
    tests: [
      { name:"Antigen TO (1:20 to 1:320)", unit:"", refRange:"Negative" },
      { name:"Antigen TH (1:20 to 1:320)", unit:"", refRange:"Negative" },
      { name:"RESULT",                     unit:"", refRange:"POSITIVE / NEGATIVE" },
    ],
    defaultRemarks:"INTERPRETATION: Antibody titer of 1:80 or higher suggests infection.",
  },
  "Viral Markers (HIV, HBsAg, HCV)": {
    tests: [
      { name:"HIV I & II",          unit:"", refRange:"NEGATIVE" },
      { name:"HEPATITIS B (HbsAg)", unit:"", refRange:"NEGATIVE" },
      { name:"HCV",                 unit:"", refRange:"NEGATIVE" },
    ],
    defaultRemarks:"***End Of The Report***",
  },
  "HbA1c":        { tests:[{ name:"HBA1C", unit:"%", refRange:"4.30-6.40" },{ name:"MEAN PLASMA GLUCOSE", unit:"mg/dl", refRange:"70-140" }], defaultRemarks:"METHOD: HPLC" },
  "D-Dimer":      { tests:[{ name:"D-DIMER", unit:"µgFEU/mL", refRange:"<0.5" }], defaultRemarks:"***End Of The Report***" },
  "Blood Group & Rh Factor": { tests:[{ name:"Blood Group", unit:"", refRange:"" },{ name:"Rh Factor", unit:"", refRange:"" }], defaultRemarks:"***End Of The Report***" },
  "CRP (Qualitative)":       { tests:[{ name:"CRP (Qualitative)", unit:"", refRange:"NON-REACTIVE" }], defaultRemarks:"***End Of The Report***" },
  "Blood Glucose (Random)":  { tests:[{ name:"BLOOD GLUCOSE RANDOM",  unit:"mg/dl", refRange:"100-150" }], defaultRemarks:"***End Of The Report***" },
  "Blood Glucose (Fasting)": { tests:[{ name:"BLOOD GLUCOSE FASTING", unit:"mg/dl", refRange:"70-110"  }], defaultRemarks:"***End Of The Report***" },
  "Dengue NS1 Antigen Test": { tests:[{ name:"DENGUE NS1 ANTIGEN", unit:"", refRange:"NON-REACTIVE" }], defaultRemarks:"***End Of The Report***" },
};
