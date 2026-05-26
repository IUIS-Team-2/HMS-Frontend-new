export const REPORT_TEMPLATES = {
  "BLOOD_GAS": {
    key:"BLOOD_GAS", label:"Blood Gas Analysis", dept:"BIOCHEMISTRY",
    tests:[
      { id:1, name:"pH",    value:"", unit:"",    refRange:"7.35–7.45", status:"Normal" },
      { id:2, name:"pCO2",  value:"", unit:"mmHg",refRange:"35–45",     status:"Normal" },
      { id:3, name:"pO2",   value:"", unit:"mmHg",refRange:"80–100",    status:"Normal" },
    ]
  },
  "CRP": {
    key:"CRP", label:"CRP (Qualitative)", dept:"BIOCHEMISTRY",
    tests:[
      { id:1, name:"CRP", value:"", unit:"mg/L", refRange:"Negative", status:"Normal" },
    ]
  },
  "RBS": {
    key:"RBS", label:"Blood Glucose (Random)", dept:"BIOCHEMISTRY",
    tests:[
      { id:1, name:"Random Blood Sugar", value:"", unit:"mg/dL", refRange:"70–140", status:"Normal" },
    ]
  },
  "FBS": {
    key:"FBS", label:"Blood Glucose (Fasting)", dept:"BIOCHEMISTRY",
    tests:[
      { id:1, name:"Fasting Blood Sugar", value:"", unit:"mg/dL", refRange:"70–100", status:"Normal" },
    ]
  },
  "WIDAL": {
    key:"WIDAL", label:"Widal Test (Slide Method)", dept:"MICROBIOLOGY",
    tests:[
      { id:1, name:"S. Typhi O", value:"", unit:"", refRange:"Negative", status:"Normal" },
      { id:2, name:"S. Typhi H", value:"", unit:"", refRange:"Negative", status:"Normal" },
    ]
  },
  "MALARIA": {
    key:"MALARIA", label:"Malaria Antigen Test", dept:"MICROBIOLOGY",
    tests:[
      { id:1, name:"Malaria Antigen", value:"", unit:"", refRange:"Negative", status:"Normal" },
    ]
  },
  "TYPHI_DOT": {
    key:"TYPHI_DOT", label:"Typhi Dot (IgG & IgM)", dept:"MICROBIOLOGY",
    tests:[
      { id:1, name:"IgG", value:"", unit:"", refRange:"Negative", status:"Normal" },
      { id:2, name:"IgM", value:"", unit:"", refRange:"Negative", status:"Normal" },
    ]
  },
  "DENGUE": {
    key:"DENGUE", label:"Dengue (IgM & IgG)", dept:"MICROBIOLOGY",
    tests:[
      { id:1, name:"IgG", value:"", unit:"", refRange:"Negative", status:"Normal" },
      { id:2, name:"IgM", value:"", unit:"", refRange:"Negative", status:"Normal" },
    ]
  },
  "DENGUE_NS1": {
    key:"DENGUE_NS1", label:"Dengue NS1 Antigen Test", dept:"MICROBIOLOGY",
    tests:[
      { id:1, name:"NS1 Antigen", value:"", unit:"", refRange:"Negative", status:"Normal" },
    ]
  },
  "VIRAL_MARKERS": {
    key:"VIRAL_MARKERS", label:"Viral Markers (HIV, HBsAg, HCV)", dept:"MICROBIOLOGY",
    tests:[
      { id:1, name:"HIV",   value:"", unit:"", refRange:"Negative", status:"Normal" },
      { id:2, name:"HBsAg", value:"", unit:"", refRange:"Negative", status:"Normal" },
      { id:3, name:"HCV",   value:"", unit:"", refRange:"Negative", status:"Normal" },
    ]
  },
  "COVID": {
    key:"COVID", label:"COVID-19 Rapid Antigen", dept:"MICROBIOLOGY",
    tests:[
      { id:1, name:"COVID Antigen", value:"", unit:"", refRange:"Negative", status:"Normal" },
    ]
  },
  "SPUTUM_AFB": {
    key:"SPUTUM_AFB", label:"Sputum for AFB", dept:"MICROBIOLOGY",
    tests:[
      { id:1, name:"AFB", value:"", unit:"", refRange:"Negative", status:"Normal" },
    ]
  },
  "CARDIAC_MARKERS": {
    key:"CARDIAC_MARKERS", label:"Cardiac Markers (Trop-T, Trop-I, CPK)", dept:"BIOCHEMISTRY",
    tests:[
      { id:1, name:"Troponin-T", value:"", unit:"",    refRange:"Negative", status:"Normal" },
      { id:2, name:"Troponin-I", value:"", unit:"",    refRange:"Negative", status:"Normal" },
      { id:3, name:"CPK",        value:"", unit:"U/L", refRange:"22–198",   status:"Normal" },
    ]
  },
  "AMYLASE_LIPASE": {
    key:"AMYLASE_LIPASE", label:"Serum Amylase & Lipase", dept:"BIOCHEMISTRY",
    tests:[
      { id:1, name:"Amylase", value:"", unit:"U/L", refRange:"30–110", status:"Normal" },
      { id:2, name:"Lipase",  value:"", unit:"U/L", refRange:"0–160",  status:"Normal" },
    ]
  },
  "ADA": {
    key:"ADA", label:"Adenosine Deaminase (ADA)", dept:"BIOCHEMISTRY",
    tests:[
      { id:1, name:"ADA", value:"", unit:"U/L", refRange:"<40", status:"Normal" },
    ]
  },
  "BODY_FLUID": {
    key:"BODY_FLUID", label:"Body Fluid Routine Analysis", dept:"PATHOLOGY",
    tests:[
      { id:1, name:"Colour",     value:"", unit:"",        refRange:"Clear", status:"Normal" },
      { id:2, name:"Protein",    value:"", unit:"g/dL",    refRange:"<3",    status:"Normal" },
      { id:3, name:"Cell Count", value:"", unit:"cells/mm³",refRange:"0–5",  status:"Normal" },
    ]
  },
  "ANTI_TPO": {
    key:"ANTI_TPO", label:"Anti-TPO (Thyroid Peroxidase Antibody)", dept:"ENDOCRINOLOGY",
    tests:[
      { id:1, name:"Anti-TPO", value:"", unit:"IU/mL", refRange:"<35", status:"Normal" },
    ]
  },
  "CRP_PROCALCITONIN": {
    key:"CRP_PROCALCITONIN", label:"CRP / Procalcitonin", dept:"BIOCHEMISTRY",
    tests:[
      { id:1, name:"CRP",          value:"", unit:"mg/L",  refRange:"NEGATIVE", status:"Normal" },
      { id:2, name:"Procalcitonin",value:"", unit:"ng/mL", refRange:"<0.5",     status:"Normal" },
    ]
  },
  "URINE_CS": {
    key:"URINE_CS", label:"Urine C/S (Culture & Sensitivity)", dept:"MICROBIOLOGY",
    tests:[
      { id:1, name:"Organism Isolated",       value:"", unit:"",       refRange:"No Growth", status:"Normal" },
      { id:2, name:"Colony Count",            value:"", unit:"CFU/mL", refRange:"<100000",   status:"Normal" },
      { id:3, name:"Antibiotic Sensitivity",  value:"", unit:"",       refRange:"",          status:"Normal" },
    ]
  },
  "TOTAL_THYROID_PROFILE": {
    key:"TOTAL_THYROID_PROFILE", label:"Total Thyroid Profile", dept:"ENDOCRINOLOGY",
    tests:[
      { id:1, name:"T3",  value:"", unit:"ng/dL",  refRange:"80–200", status:"Normal" },
      { id:2, name:"T4",  value:"", unit:"µg/dL",  refRange:"5–12",   status:"Normal" },
      { id:3, name:"TSH", value:"", unit:"µIU/mL", refRange:"0.4–4.5",status:"Normal" },
    ]
  },
  "CBC": {
    key:"CBC", label:"Complete Blood Count", dept:"HAEMATOLOGY",
    tests:[
      { id:1, name:"Hemoglobin",       value:"", unit:"", refRange:"", status:"Normal" },
      { id:2, name:"Total WBC Count",  value:"", unit:"", refRange:"", status:"Normal" },
      { id:3, name:"Platelet Count",   value:"", unit:"", refRange:"", status:"Normal" },
      { id:4, name:"RBC Count",        value:"", unit:"", refRange:"", status:"Normal" },
    ]
  },
  "COAGULATION":      { key:"COAGULATION",      label:"Coagulation Profile",         dept:"HAEMATOLOGY" },
  "BLOODGROUP":       { key:"BLOODGROUP",        label:"Blood Group & Rh Factor",     dept:"HAEMATOLOGY" },
  "PERIPHERAL_SMEAR": {
    key:"PERIPHERAL_SMEAR", label:"Blood Picture (Peripheral Smear)", dept:"HAEMATOLOGY",
    tests:[
      { id:1, name:"RBC Morphology",     value:"", unit:"", refRange:"Normal",    status:"Normal" },
      { id:2, name:"WBC Morphology",     value:"", unit:"", refRange:"Normal",    status:"Normal" },
      { id:3, name:"Platelet Morphology",value:"", unit:"", refRange:"Adequate",  status:"Normal" },
      { id:4, name:"Impression",         value:"", unit:"", refRange:"",          status:"Normal" },
    ]
  },
  "KFT": {
    key:"KFT", label:"Kidney Function Test", dept:"BIOCHEMISTRY",
    tests:[
      { id:1, name:"Urea",      value:"", unit:"", refRange:"", status:"Normal" },
      { id:2, name:"Creatinine",value:"", unit:"", refRange:"", status:"Normal" },
      { id:3, name:"Uric Acid", value:"", unit:"", refRange:"", status:"Normal" },
      { id:4, name:"Sodium",    value:"", unit:"", refRange:"", status:"Normal" },
      { id:5, name:"Potassium", value:"", unit:"", refRange:"", status:"Normal" },
    ]
  },
  "LFT": {
    key:"LFT", label:"Liver Function Test", dept:"BIOCHEMISTRY",
    tests:[
      { id:1, name:"Total Bilirubin",    value:"", unit:"mg/dL", refRange:"0.2–1.2", status:"Normal" },
      { id:2, name:"Direct Bilirubin",   value:"", unit:"mg/dL", refRange:"0–0.3",   status:"Normal" },
      { id:3, name:"Indirect Bilirubin", value:"", unit:"mg/dL", refRange:"0.2–0.9", status:"Normal" },
      { id:4, name:"SGOT (AST)",         value:"", unit:"U/L",   refRange:"5–40",    status:"Normal" },
      { id:5, name:"SGPT (ALT)",         value:"", unit:"U/L",   refRange:"5–41",    status:"Normal" },
      { id:6, name:"Alkaline Phosphatase",value:"",unit:"U/L",   refRange:"44–147",  status:"Normal" },
      { id:7, name:"Total Protein",      value:"", unit:"g/dL",  refRange:"6.0–8.3", status:"Normal" },
      { id:8, name:"Albumin",            value:"", unit:"g/dL",  refRange:"3.5–5.0", status:"Normal" },
    ]
  },
  "LIPID":      { key:"LIPID",      label:"Lipid Profile",          dept:"BIOCHEMISTRY" },
  "BLOODGAS":   { key:"BLOODGAS",   label:"Blood Gas Analysis",     dept:"BIOCHEMISTRY" },
  "GLUCOSE":    { key:"GLUCOSE",    label:"Blood Glucose",          dept:"BIOCHEMISTRY" },
  "CARDIAC":    { key:"CARDIAC",    label:"Cardiac Markers",        dept:"BIOCHEMISTRY" },
  "PANCREATIC": { key:"PANCREATIC", label:"Pancreatic Enzymes",     dept:"BIOCHEMISTRY" },
  "VITAMINS":   { key:"VITAMINS",   label:"Vitamins",               dept:"BIOCHEMISTRY" },
  "IRON":       { key:"IRON",       label:"Iron Profile",           dept:"BIOCHEMISTRY" },
  "THYROID":    { key:"THYROID",    label:"Total Thyroid Profile",  dept:"ENDOCRINOLOGY" },
  "TYPHIDOT":   { key:"TYPHIDOT",   label:"Typhi Dot (IgG & IgM)", dept:"IMMUNOLOGY – SEROLOGY" },
  "VIRAL":      { key:"VIRAL",      label:"Viral Markers",          dept:"MICROBIOLOGY" },
  "URINE_RM":   { key:"URINE_RM",   label:"Urine Examination (R/M)",dept:"MICROBIOLOGY" },
  "BLOOD_CS":   { key:"BLOOD_CS",   label:"Blood C/S (Culture & Sensitivity)", dept:"MICROBIOLOGY" },
  "STOOL":      { key:"STOOL",      label:"Stool Examination (R/M)",dept:"MICROBIOLOGY" },
};

export const INVESTIGATION_GROUPS = [
  { group:"🩸 Haematology",           color:"#dc2626", items:["CBC","COAGULATION","BLOODGROUP","PERIPHERAL_SMEAR"] },
  { group:"🧪 Biochemistry",          color:"#2563eb", items:["KFT","LFT","LIPID","BLOODGAS","GLUCOSE","CARDIAC","CRP","PANCREATIC","VITAMINS","IRON"] },
  { group:"⚗️ Endocrinology",         color:"#7c3aed", items:["THYROID"] },
  { group:"🔬 Immunology – Serology", color:"#b45309", items:["WIDAL","TYPHIDOT","DENGUE"] },
  { group:"🦠 Microbiology",          color:"#065f46", items:["MALARIA","VIRAL","URINE_RM","URINE_CS","BLOOD_CS","STOOL","BODY_FLUID"] },
];

export const PATHOLOGY_REPORT_TYPES = [
  "Haematology","Biochemistry","Microbiology","Immunology – Serology",
  "Histopathology","Cytology","Blood Bank","Clinical Pathology","Endocrinology",
];

export const RADIOLOGY_REPORT_TYPES = [
  "X-Ray","USG","CT Scan","MRI","Echo","ECG","PET Scan",
  "Mammography","Fluoroscopy","Nuclear Medicine",
];

export function isRadiologyType(reportType = "") {
  return RADIOLOGY_REPORT_TYPES.includes(reportType);
}

export const emptyPathReport = () => ({
  id: crypto.randomUUID(),
  reportName: "",
  reportType: "Haematology",
  billCategory: "PATHOLOGY",
  date: new Date().toISOString().slice(0,10),
  orderedBy: "",
  amount: 0,
  remarks: "",
  tests: [{ id: Date.now(), name:"", value:"", unit:"", refRange:"", status:"Normal" }],
});

export const emptyRadReport = () => ({
  id: crypto.randomUUID(),
  reportName: "",
  reportType: "X-Ray",
  billCategory: "RADIOLOGY",
  date: new Date().toISOString().slice(0,10),
  orderedBy: "",
  amount: 0,
  remarks: "",
  findings: "",
  impression: "",
  tests: [],
});