import {
  IndianRupee, Upload, CircleHelp, Hospital, ClipboardList,
  BarChart3, Star, Users, FileText, Activity, CheckSquare,
  Stethoscope, BookOpen,
} from "lucide-react";

export const DEPARTMENTS = [
  "Billing", "Uploading", "Query", "OPD", "Intimation",
  "Nursing", "Doctor", "Notes", "Quality Analysis",
];

export const DEPT_META = {
  Billing:          { color:"#10b981", icon:IndianRupee,   desc:"Final bill preparation & payment" },
  Uploading:        { color:"#3b82f6", icon:Upload,        desc:"Document upload & digitisation" },
  Query:            { color:"#f59e0b", icon:CircleHelp,    desc:"Patient & insurance queries" },
  OPD:              { color:"#ef4444", icon:Hospital,      desc:"Out-patient department tasks" },
  Intimation:       { color:"#06b6d4", icon:ClipboardList, desc:"Insurance intimation letters" },
  Nursing:          { color:"#a78bfa", icon:Users,         desc:"Nursing care & medication notes" },
  Doctor:           { color:"#f472b6", icon:Stethoscope,   desc:"Doctor notes & prescriptions" },
  Notes:            { color:"#64748b", icon:BookOpen,      desc:"Clinical & administrative notes" },
  "Quality Analysis": { color:"#f97316", icon:BarChart3,  desc:"Quality checks & analysis" },
};

export const STATUS_META = {
  pending:       { bg:"rgba(245,158,11,0.12)",  text:"#f59e0b",  border:"rgba(245,158,11,0.3)",  label:"Pending"     },
  "in-progress": { bg:"rgba(6,182,212,0.12)",   text:"#06b6d4",  border:"rgba(6,182,212,0.3)",   label:"In Progress" },
  completed:     { bg:"rgba(16,185,129,0.12)",  text:"#10b981",  border:"rgba(16,185,129,0.3)",  label:"Completed"   },
  overdue:       { bg:"rgba(239,68,68,0.12)",   text:"#ef4444",  border:"rgba(239,68,68,0.3)",   label:"Overdue"     },
  submitted:     { bg:"rgba(99,102,241,0.12)",  text:"#6366f1",  border:"rgba(99,102,241,0.3)",  label:"Submitted"   },
  approved:      { bg:"rgba(16,185,129,0.12)",  text:"#10b981",  border:"rgba(16,185,129,0.3)",  label:"Approved"    },
  rejected:      { bg:"rgba(239,68,68,0.12)",   text:"#ef4444",  border:"rgba(239,68,68,0.3)",   label:"Rejected"    },
};

export const PRIORITY_META = {
  Low:    { color:"#64748b", bg:"rgba(100,116,139,0.1)" },
  Medium: { color:"#f59e0b", bg:"rgba(245,158,11,0.1)"  },
  High:   { color:"#ef4444", bg:"rgba(239,68,68,0.1)"   },
  Urgent: { color:"#a855f7", bg:"rgba(168,85,247,0.1)"  },
};

export const SECTION_KEYS   = ["discharge","admission","reports","medicines","billing"];
export const SECTION_LABELS = { discharge:"Discharge Summary", admission:"Admission Note", reports:"Reports", medicines:"Medicine Bill", billing:"Final Bill" };
export const SECTION_ICONS  = { discharge:"📋", admission:"🩺", reports:"🗂️", medicines:"💊", billing:"🧾" };
export const TAB_MAP        = { discharge:"discharge", admission:"medical", reports:"reports", medicines:"med_bill", billing:"finalbill" };

export const INSURANCE_TYPES_LIST = ["Self Pay","TPA","ECHS","ECI","FCI","Ayushman Bharat","Northern Railways","Cash"];
export const TPA_DOCS = [
  { key:"final_bill",        label:"Final Bill" },
  { key:"pharmacy_bill",     label:"Pharmacy Bill" },
  { key:"pathology_bill",    label:"Pathology Bill" },
  { key:"radiology_bill",    label:"Radiology Bill" },
  { key:"discharge_summary", label:"Discharge Summary" },
  { key:"reports",           label:"Reports" },
  { key:"admission_note",    label:"Admission Note" },
];
export const PDF_DOC_TYPES = [
  { key:"discharge_summary", label:"Discharge Summary", icon:"📋" },
  { key:"admission_note",    label:"Admission Note",    icon:"🩺" },
  { key:"lab_reports",       label:"Lab Reports",       icon:"🗂️" },
  { key:"medicine_bill",     label:"Medicine Bill",     icon:"💊" },
  { key:"final_bill",        label:"Final Bill",        icon:"🧾" },
];
export const PATHOLOGY_REPORT_TYPES = [
  "Haematology","Biochemistry","Microbiology","Immunology – Serology",
  "Histopathology","Cytology","Blood Bank","Clinical Pathology","Endocrinology",
];
export const RADIOLOGY_REPORT_TYPES = [
  "X-Ray","USG","CT Scan","MRI","Echo","ECG","PET Scan",
  "Mammography","Fluoroscopy","Nuclear Medicine",
];
export const MEDICATION_GROUPS = [
  { group:"💉 IV / Injections", items:["Inj. Normal Saline (NS) 500ml","Inj. Ringer Lactate (RL) 500ml","Inj. DNS 500ml","Inj. Pantoprazole 40mg IV BD","Inj. Ondansetron 4mg IV TDS","Inj. Tramadol 50mg IV TDS","Inj. Ceftriaxone 1g IV BD","Inj. Amikacin 500mg IV OD","Inj. Metronidazole 500mg IV TDS","Inj. Furosemide 40mg IV OD","Inj. Dexamethasone 8mg IV OD","Inj. Enoxaparin 40mg SC OD","Inj. Insulin Regular SC TDS"] },
  { group:"💊 Oral Tablets / Capsules", items:["Tab. Paracetamol 500mg TDS","Tab. Paracetamol 650mg TDS","Tab. Ibuprofen 400mg TDS","Tab. Pantoprazole 40mg OD","Tab. Metformin 500mg BD","Tab. Amlodipine 5mg OD","Tab. Atenolol 50mg OD","Tab. Ramipril 5mg OD","Tab. Atorvastatin 20mg HS","Tab. Clopidogrel 75mg OD","Tab. Aspirin 75mg OD","Tab. Azithromycin 500mg OD","Tab. Amoxicillin 500mg TDS","Tab. Ciprofloxacin 500mg BD","Tab. Metronidazole 400mg TDS","Tab. Prednisolone 10mg OD","Cap. Omeprazole 20mg BD"] },
  { group:"🔧 Supportive / Others", items:["O2 Inhalation 2–4 L/min","Ryle's Tube Feed","IV Fluids NS/RL @ 100ml/hr","Urinary Catheterisation","Dressing BD","Steam Inhalation BD","Physiotherapy","ICU Monitoring","Vital Monitoring 4th Hourly"] },
];
export const UI_STATUS_TO_BACKEND = {
  pending:"Pending", "in-progress":"In Progress", completed:"Completed",
  overdue:"Overdue", submitted:"Completed", "on-hold":"On Hold",
};
export const VIEWS = [
  { id:"overview",   label:"Overview",        icon:Activity },
  { id:"assign",     label:"Assign Tasks",     icon:CheckSquare },
  { id:"my-work",    label:"My Own Work",      icon:FileText },
  { id:"dept-tasks", label:"Department Tasks", icon:ClipboardList },
  { id:"analytics",  label:"Analytics",        icon:BarChart3 },
  { id:"reviews",    label:"Reviews",          icon:Star },
  { id:"employees",  label:"Employees",        icon:Users },
];
