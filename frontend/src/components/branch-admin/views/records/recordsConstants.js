import { REPORT_TEMPLATES } from "../../../../constants/billing/reportTemplates";
export const DEFAULT_TESTS = {
  CBC: [
    {id:1,name:"Haemoglobin",value:"",unit:"g/dL",refRange:"13.0-17.0",status:"Normal"},
    {id:2,name:"TLC",value:"",unit:"cells/cumm",refRange:"4000-11000",status:"Normal"},
    {id:3,name:"Platelets",value:"",unit:"Lacs/cumm",refRange:"1.5-4.5",status:"Normal"},
    {id:4,name:"RBC",value:"",unit:"mill/cumm",refRange:"4.5-5.5",status:"Normal"},
    {id:5,name:"PCV/HCT",value:"",unit:"%",refRange:"40-50",status:"Normal"},
    {id:6,name:"MCV",value:"",unit:"fL",refRange:"83-101",status:"Normal"},
    {id:7,name:"MCH",value:"",unit:"pg",refRange:"27-32",status:"Normal"},
    {id:8,name:"MCHC",value:"",unit:"g/dL",refRange:"31.5-34.5",status:"Normal"},
    {id:9,name:"Neutrophils",value:"",unit:"%",refRange:"40-80",status:"Normal"},
    {id:10,name:"Lymphocytes",value:"",unit:"%",refRange:"20-40",status:"Normal"},
    {id:11,name:"Monocytes",value:"",unit:"%",refRange:"2-10",status:"Normal"},
    {id:12,name:"Eosinophils",value:"",unit:"%",refRange:"1-6",status:"Normal"},
  ],
  LFT: [
    {id:1,name:"Total Bilirubin",value:"",unit:"mg/dL",refRange:"0.2-1.2",status:"Normal"},
    {id:2,name:"Direct Bilirubin",value:"",unit:"mg/dL",refRange:"0.0-0.4",status:"Normal"},
    {id:3,name:"Indirect Bilirubin",value:"",unit:"mg/dL",refRange:"0.2-0.8",status:"Normal"},
    {id:4,name:"SGOT (AST)",value:"",unit:"U/L",refRange:"10-40",status:"Normal"},
    {id:5,name:"SGPT (ALT)",value:"",unit:"U/L",refRange:"7-56",status:"Normal"},
    {id:6,name:"Alkaline Phosphatase",value:"",unit:"U/L",refRange:"44-147",status:"Normal"},
    {id:7,name:"Total Protein",value:"",unit:"g/dL",refRange:"6.3-8.2",status:"Normal"},
    {id:8,name:"Albumin",value:"",unit:"g/dL",refRange:"3.5-5.0",status:"Normal"},
    {id:9,name:"Globulin",value:"",unit:"g/dL",refRange:"2.0-3.5",status:"Normal"},
  ],
  KFT: [
    {id:1,name:"Blood Urea",value:"",unit:"mg/dL",refRange:"15-40",status:"Normal"},
    {id:2,name:"Serum Creatinine",value:"",unit:"mg/dL",refRange:"0.6-1.2",status:"Normal"},
    {id:3,name:"Uric Acid",value:"",unit:"mg/dL",refRange:"3.5-7.2",status:"Normal"},
    {id:4,name:"Sodium",value:"",unit:"mEq/L",refRange:"136-145",status:"Normal"},
    {id:5,name:"Potassium",value:"",unit:"mEq/L",refRange:"3.5-5.1",status:"Normal"},
    {id:6,name:"Chloride",value:"",unit:"mEq/L",refRange:"98-107",status:"Normal"},
    {id:7,name:"Bicarbonate",value:"",unit:"mEq/L",refRange:"22-29",status:"Normal"},
  ],
  RFT: [
    {id:1,name:"Blood Urea",value:"",unit:"mg/dL",refRange:"15-40",status:"Normal"},
    {id:2,name:"Serum Creatinine",value:"",unit:"mg/dL",refRange:"0.6-1.2",status:"Normal"},
    {id:3,name:"Sodium",value:"",unit:"mEq/L",refRange:"136-145",status:"Normal"},
    {id:4,name:"Potassium",value:"",unit:"mEq/L",refRange:"3.5-5.1",status:"Normal"},
  ],
  "Lipid Profile": [
    {id:1,name:"Total Cholesterol",value:"",unit:"mg/dL",refRange:"<200",status:"Normal"},
    {id:2,name:"Triglycerides",value:"",unit:"mg/dL",refRange:"<150",status:"Normal"},
    {id:3,name:"HDL Cholesterol",value:"",unit:"mg/dL",refRange:">40",status:"Normal"},
    {id:4,name:"LDL Cholesterol",value:"",unit:"mg/dL",refRange:"<100",status:"Normal"},
    {id:5,name:"VLDL",value:"",unit:"mg/dL",refRange:"<30",status:"Normal"},
  ],
  TFT: [
    {id:1,name:"T3",value:"",unit:"ng/dL",refRange:"80-200",status:"Normal"},
    {id:2,name:"T4",value:"",unit:"μg/dL",refRange:"5.1-14.1",status:"Normal"},
    {id:3,name:"TSH",value:"",unit:"μIU/mL",refRange:"0.4-4.0",status:"Normal"},
  ],
  HbA1c: [
    {id:1,name:"HbA1c",value:"",unit:"%",refRange:"<5.7",status:"Normal"},
    {id:2,name:"Mean Blood Glucose",value:"",unit:"mg/dL",refRange:"<117",status:"Normal"},
  ],
  BSF:  [{id:1,name:"Blood Sugar Fasting",value:"",unit:"mg/dL",refRange:"70-100",status:"Normal"}],
  BSPP: [{id:1,name:"Blood Sugar PP",value:"",unit:"mg/dL",refRange:"<140",status:"Normal"}],
  "Urine R/M": [
    {id:1,name:"Colour",value:"",unit:"",refRange:"Pale Yellow",status:"Normal"},
    {id:2,name:"Appearance",value:"",unit:"",refRange:"Clear",status:"Normal"},
    {id:3,name:"pH",value:"",unit:"",refRange:"4.5-8.0",status:"Normal"},
    {id:4,name:"Specific Gravity",value:"",unit:"",refRange:"1.005-1.030",status:"Normal"},
    {id:5,name:"Protein",value:"",unit:"",refRange:"Nil",status:"Normal"},
    {id:6,name:"Glucose",value:"",unit:"",refRange:"Nil",status:"Normal"},
    {id:7,name:"Pus Cells",value:"",unit:"/HPF",refRange:"0-5",status:"Normal"},
    {id:8,name:"RBC",value:"",unit:"/HPF",refRange:"0-2",status:"Normal"},
  ],
  Echo: [
    {id:1,name:"EF (Ejection Fraction)",value:"",unit:"%",refRange:"55-70",status:"Normal"},
    {id:2,name:"LVEDD",value:"",unit:"mm",refRange:"35-56",status:"Normal"},
    {id:3,name:"LVESD",value:"",unit:"mm",refRange:"25-40",status:"Normal"},
    {id:4,name:"IVS",value:"",unit:"mm",refRange:"6-11",status:"Normal"},
    {id:5,name:"Impression",value:"",unit:"",refRange:"Normal Study",status:"Normal"},
  ],
  ECG: [
    {id:1,name:"Heart Rate",value:"",unit:"bpm",refRange:"60-100",status:"Normal"},
    {id:2,name:"Rhythm",value:"",unit:"",refRange:"Sinus",status:"Normal"},
    {id:3,name:"PR Interval",value:"",unit:"ms",refRange:"120-200",status:"Normal"},
    {id:4,name:"QRS Duration",value:"",unit:"ms",refRange:"<120",status:"Normal"},
    {id:5,name:"Impression",value:"",unit:"",refRange:"Normal ECG",status:"Normal"},
  ],
};


export const REPORT_MASTER = [
  "Complete Blood Count (CBC)","Kidney Function Test (KFT)","Liver Function Test (LFT)",
  "Lipid Profile","Blood Gas Analysis","CRP (Qualitative)","Blood Glucose (Random)",
  "Blood Glucose (Fasting)","Widal Test (Slide Method)","Malaria Antigen Test",
  "Typhi Dot (IgG & IgM)","Dengue (IgM & IgG)","Dengue NS1 Antigen Test",
  "Viral Markers (HIV, HBsAg, HCV)","COVID-19 Rapid Antigen","Urine Examination (Routine)",
  "Urine Gram Stain","Aerobic Culture & Sensitivity","Serum Procalcitonin","Sputum for AFB",
  "Sputum Gram Stain","Cardiac Markers (Trop-T, Trop-I, CPK)","Total Thyroid Profile",
  "Vitamin B-12 (Cyanocobalamin)","25 OH Vitamin D3","Stool Examination",
  "Blood Group & Rh Factor","HbA1c (Glycosylated Hemoglobin)","Urine Ketone","D-Dimer",
  "Serum Amylase & Lipase","Homocysteine (Quantitative)","PSA (Prostate Specific Antigen)",
  "Prothrombin Time (PT)","Activated Partial Thromboplastin Time (APTT)","Adenosine Deaminase (ADA)",
  "Body Fluid For Cytology","Body Fluid Routine Analysis","SAAG (Serum Ascites Albumin Gradient)",
  "Iron Profile","Blood Picture (Peripheral Smear)","Anti-TPO (Thyroid Peroxidase Antibody)",
  "Bleeding Time (BT) & Clotting Time (CT)",
];

export const REPORT_TYPES = [
  "Haematology","Biochemistry","Microbiology","Immunology – Serology",
  "Histopathology","Cytology","X-Ray","USG","CT Scan","MRI","Echo","ECG",
];

export const SERVICE_MASTER = [
  { name: "General Ward",            code: "RM01",  rate: 1500 },
  { name: "Semi-Private Ward",       code: "RM02",  rate: 2500 },
  { name: "Private Room",            code: "RM03",  rate: 4000 },
  { name: "ICU",                     code: "CC001", rate: 5400 },
  { name: "NICU",                    code: "CC002", rate: 6000 },
  { name: "HDU",                     code: "CC003", rate: 4500 },
  { name: "Ventilator Charges",      code: "CC004", rate: 3000 },
  { name: "Oxygen Charges",          code: "OX001", rate:  500 },
  { name: "Consultant Visit",        code: "CN001", rate:  700 },
  { name: "Specialist Consultation", code: "CN002", rate: 1000 },
  { name: "Operation Theatre (OT)",  code: "OT001", rate: 8000 },
  { name: "Minor OT",                code: "OT002", rate: 2000 },
  { name: "Dressing",                code: "DR001", rate:  300 },
  { name: "IV Cannula Insertion",    code: "PR001", rate:  150 },
  { name: "Catheterisation",         code: "PR002", rate:  400 },
  { name: "Nebulization",            code: "PR003", rate:  200 },
  { name: "ECG",                     code: "EC001", rate:  350 },
  { name: "Blood Transfusion",       code: "BT001", rate:  800 },
  { name: "Physiotherapy",           code: "PT001", rate:  600 },
  { name: "Diet Charges",            code: "DT001", rate:  250 },
  { name: "Ambulance",               code: "AM001", rate: 1200 },
  { name: "Registration Fee",        code: "RF001", rate:  100 },
];

// ── Override getDefaultTests to use central REPORT_TEMPLATES ─────────────────

export function getDefaultTests(name) {
  const n = (name || "").toLowerCase();
  const tmpl = Object.values(REPORT_TEMPLATES).find(t =>
    n.includes((t.label || "").toLowerCase()) ||
    (t.label || "").toLowerCase().includes(n) ||
    n.includes((t.key || "").toLowerCase())
  );
  if (tmpl?.tests?.length) {
    return tmpl.tests.map(t => ({ ...t, id: Date.now() + Math.random() }));
  }
  const legacy = Object.keys(DEFAULT_TESTS).find(k =>
    n.includes(k.toLowerCase()) || k.toLowerCase().includes(n)
  );
  return legacy
    ? DEFAULT_TESTS[legacy].map(t => ({ ...t, id: Date.now() + Math.random() }))
    : [{ id: Date.now(), name: "", value: "", unit: "", refRange: "", status: "Normal" }];
}
