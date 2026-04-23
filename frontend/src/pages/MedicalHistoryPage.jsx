import { useState, useRef, useEffect } from "react";
import { T } from "../data/constants";
import { Ico, IC } from "../components/ui/Icons";

// ─── REPORT TEMPLATES (matched exactly to Sangi Hospital PDF formats) ─────────
const REPORT_TEMPLATES = {
  "CBC": {
    key:"CBC", label:"Complete Blood Count", dept:"HAEMATOLOGY", color:"#dc2626", bg:"#fef2f2",
    sections:[
      { heading:"COMPLETE BLOOD COUNT", fields:[
        { name:"Haemoglobin", unit:"gm/dl", normal:"12–16" },
        { name:"TLC (Total Leucocyte Count)", unit:"/cumm", normal:"4000–11000" },
      ]},
      { heading:"DIFFERENTIAL LEUCOCYTE COUNT (DLC)", fields:[
        { name:"Polymorphs", unit:"%", normal:"40–75" },
        { name:"Lymphocyte", unit:"%", normal:"20–40" },
        { name:"Eosinophil", unit:"%", normal:"01–06" },
        { name:"Monocyte", unit:"%", normal:"00–08" },
        { name:"Basophil", unit:"%", normal:"00–00" },
      ]},
      { heading:"INDICES", fields:[
        { name:"PCV", unit:"%", normal:"34–45" },
        { name:"MCV (Mean Corp Volume)", unit:"Fl/dl", normal:"76–96" },
        { name:"MCH (Mean Corp Hb)", unit:"Pg/dl", normal:"27–32" },
        { name:"MCHC (Mean Corp Hb Conc)", unit:"gm/dl", normal:"31–38" },
        { name:"RBC (Red Blood Cell Count)", unit:"mill/cumm", normal:"3.5–5.5" },
        { name:"Platelet Count", unit:"Lacs/cumm", normal:"1.5–4.5" },
        { name:"ESR (Wintrobe)", unit:"mm", normal:"M: 0–10, F: 0–20" },
      ]},
    ],
  },
  "COAGULATION": {
    key:"COAGULATION", label:"Coagulation Profile", dept:"HAEMATOLOGY", color:"#dc2626", bg:"#fef2f2",
    sections:[
      { heading:"PROTHROMBIN TIME", fields:[
        { name:"Patient Time (PT)", unit:"Sec", normal:"10.0–14.0" },
        { name:"Control Time (PT)", unit:"Sec", normal:"" },
        { name:"INR", unit:"", normal:"" },
      ]},
      { heading:"APTT", fields:[
        { name:"Patient Time (APTT)", unit:"Sec", normal:"26.0–40.0" },
        { name:"Control Time (APTT)", unit:"Sec", normal:"" },
        { name:"Ratio (APTT)", unit:"", normal:"" },
      ]},
      { heading:"OTHER", fields:[
        { name:"BT (Bleeding Time)", unit:"Min/Sec", normal:"02–07" },
        { name:"CT (Clotting Time)", unit:"Min/Sec", normal:"04–09" },
        { name:"D-Dimer", unit:"µgFEU/mL", normal:"<0.5" },
      ]},
    ],
  },
  "BLOODGROUP": {
    key:"BLOODGROUP", label:"Blood Group & Rh Factor", dept:"HAEMATOLOGY", color:"#dc2626", bg:"#fef2f2",
    sections:[{ heading:"BLOOD GROUP", fields:[
      { name:"Blood Group", unit:"", normal:"" },
      { name:"Rh Factor", unit:"", normal:"" },
    ]}],
  },
  "PERIPHERAL_SMEAR": {
    key:"PERIPHERAL_SMEAR", label:"Blood Picture (Peripheral Smear)", dept:"HAEMATOLOGY", color:"#dc2626", bg:"#fef2f2",
    type:"narrative",
    fields:[
      { label:"Findings", multiline:true, rows:4 },
      { label:"Impression", multiline:true, rows:2 },
      { label:"Advice", multiline:false },
    ],
  },
  "KFT": {
    key:"KFT", label:"Kidney Function Test", dept:"BIOCHEMISTRY", color:"#2563eb", bg:"#eff6ff",
    sections:[{ heading:"KIDNEY FUNCTION TEST", fields:[
      { name:"Blood Urea", unit:"mg/dl", normal:"13–45" },
      { name:"Serum Creatinine", unit:"mg/dl", normal:"0.7–1.4" },
      { name:"S.Uric Acid", unit:"mg/dl", normal:"3.2–7.2" },
      { name:"Sodium", unit:"mmol/L", normal:"135–145" },
      { name:"Potassium", unit:"mmol/L", normal:"3.6–5.0" },
      { name:"Calcium", unit:"mg/dl", normal:"8.2–10.5" },
    ]}],
  },
  "LFT": {
    key:"LFT", label:"Liver Function Test", dept:"BIOCHEMISTRY", color:"#2563eb", bg:"#eff6ff",
    sections:[{ heading:"LIVER FUNCTION TEST", fields:[
      { name:"Serum Bilirubin (Total)", unit:"mg/dl", normal:"0.2–1.3" },
      { name:"Conjugated (D Bilirubin)", unit:"mg/dl", normal:"0.0–0.3" },
      { name:"Unconjugated (I.D Bilirubin)", unit:"mg/dl", normal:"0.2–1.1" },
      { name:"SGOT/AST", unit:"U/L", normal:"00–55" },
      { name:"SGPT/ALT", unit:"U/L", normal:"00–40" },
      { name:"Total Protein", unit:"gm/dl", normal:"6.3–8.2" },
      { name:"Albumin", unit:"gm/dl", normal:"3.5–5.0" },
      { name:"Globuline", unit:"gm/dl", normal:"2.5–5.6" },
      { name:"Alkaline Phosphatase", unit:"IU/L", normal:"20–130" },
    ]}],
  },
  "LIPID": {
    key:"LIPID", label:"Lipid Profile", dept:"BIOCHEMISTRY", color:"#2563eb", bg:"#eff6ff",
    sections:[{ heading:"LIPID PROFILE", fields:[
      { name:"Cholesterol Total", unit:"mg/dl", normal:"125–200" },
      { name:"Triglyceride", unit:"mg/dl", normal:"25–200" },
      { name:"Cholesterol HDL", unit:"mg/dl", normal:"35–80" },
      { name:"Cholesterol VLDL", unit:"mg/dl", normal:"5–40" },
      { name:"Cholesterol LDL", unit:"mg/dl", normal:"85–130" },
      { name:"LDL/HDL Ratio", unit:"", normal:"1.5–3.5" },
    ]}],
  },
  "BLOODGAS": {
    key:"BLOODGAS", label:"Blood Gas Analysis", dept:"BIOCHEMISTRY", color:"#2563eb", bg:"#eff6ff",
    sections:[{ heading:"BLOOD GAS ANALYSIS", fields:[
      { name:"pH", unit:"", normal:"7.35–7.45" },
      { name:"pCO2", unit:"mmHg", normal:"35–40" },
      { name:"pO2", unit:"mmHg", normal:"80–95" },
      { name:"TCO2", unit:"mmol/L", normal:"23–27" },
      { name:"HCO3", unit:"mmol/L", normal:"22–26" },
      { name:"BE", unit:"mmol/L", normal:"-2 to +2" },
      { name:"%SO2C", unit:"%", normal:"96–97" },
      { name:"Na+", unit:"mmol/L", normal:"134–146" },
      { name:"K+", unit:"mmol/L", normal:"3.4–5.0" },
      { name:"Cl", unit:"mmol/L", normal:"1.15–1.33" },
      { name:"GLU", unit:"mmol/L", normal:"74–100" },
      { name:"THbc", unit:"%", normal:"12–16" },
      { name:"HCT", unit:"mmol/L", normal:"38–51" },
    ]}],
  },
  "GLUCOSE": {
    key:"GLUCOSE", label:"Blood Glucose", dept:"BIOCHEMISTRY", color:"#2563eb", bg:"#eff6ff",
    sections:[{ heading:"BLOOD GLUCOSE", fields:[
      { name:"Blood Glucose Random (RBS)", unit:"mg/dl", normal:"100–150" },
      { name:"Blood Glucose Fasting (FBS)", unit:"mg/dl", normal:"70–110" },
      { name:"Blood Glucose PP", unit:"mg/dl", normal:"<140" },
      { name:"HbA1c (Glycosylated Haemoglobin)", unit:"%", normal:"4.30–6.40" },
      { name:"Mean Plasma Glucose", unit:"mg/dl", normal:"70–140" },
      { name:"Urine Ketone", unit:"", normal:"NEGATIVE" },
    ]}],
  },
  "CARDIAC": {
    key:"CARDIAC", label:"Cardiac Markers", dept:"BIOCHEMISTRY", color:"#2563eb", bg:"#eff6ff",
    sections:[{ heading:"CARDIAC MARKERS", fields:[
      { name:"Troponin-T", unit:"", normal:"NEGATIVE" },
      { name:"Troponin-I", unit:"", normal:"NEGATIVE" },
      { name:"CPK-MB", unit:"IU/L", normal:"upto 24" },
      { name:"CPK", unit:"U/L", normal:"22–198" },
      { name:"NT-proBNP", unit:"pg/ml", normal:"10–157" },
    ]}],
  },
  "CRP": {
    key:"CRP", label:"CRP / Procalcitonin", dept:"BIOCHEMISTRY", color:"#2563eb", bg:"#eff6ff",
    sections:[{ heading:"INFLAMMATORY MARKERS", fields:[
      { name:"CRP (Qualitative)", unit:"", normal:"NON-REACTIVE" },
      { name:"CRP (Quantitative)", unit:"mg/L", normal:"<6.0" },
      { name:"Serum Procalcitonin", unit:"pg/ml", normal:"0.0–500" },
    ]}],
  },
  "PANCREATIC": {
    key:"PANCREATIC", label:"Pancreatic Enzymes", dept:"BIOCHEMISTRY", color:"#2563eb", bg:"#eff6ff",
    sections:[{ heading:"PANCREATIC ENZYMES", fields:[
      { name:"S. Amylase", unit:"U/L", normal:"30.0–220.0" },
      { name:"S. Lipase", unit:"U/L", normal:"upto 190.0" },
    ]}],
  },
  "VITAMINS": {
    key:"VITAMINS", label:"Vitamins", dept:"BIOCHEMISTRY", color:"#2563eb", bg:"#eff6ff",
    sections:[{ heading:"VITAMINS", fields:[
      { name:"Vitamin B-12 (Cyanocobalamin)", unit:"pg/ml", normal:"211–911" },
      { name:"25 OH Vitamin D3", unit:"ng/ml", normal:"30–100" },
    ]}],
  },
  "IRON": {
    key:"IRON", label:"Iron Profile", dept:"BIOCHEMISTRY", color:"#2563eb", bg:"#eff6ff",
    sections:[{ heading:"IRON PROFILE", fields:[
      { name:"Iron (Serum)", unit:"µg/dL", normal:"49–181" },
      { name:"TIBC", unit:"µg/dL", normal:"261–462" },
      { name:"Unsaturated Iron Binding Capacity", unit:"µg/dL", normal:"110.0–370.0" },
      { name:"Transferrin Saturation", unit:"%", normal:"14–50" },
    ]}],
  },
  "MISC_BIO": {
    key:"MISC_BIO", label:"Miscellaneous Biochemistry", dept:"BIOCHEMISTRY", color:"#2563eb", bg:"#eff6ff",
    sections:[{ heading:"MISCELLANEOUS", fields:[
      { name:"Adenosine Deaminase (ADA)", unit:"U/L", normal:"<30" },
      { name:"Homocysteine", unit:"umol/L", normal:"5.45–16.20" },
      { name:"PSA (Prostate Specific Antigen)", unit:"ng/mL", normal:"<4.00" },
      { name:"SAAG (Serum Ascites Albumin Gradient)", unit:"", normal:"" },
      { name:"Albumin Fluid", unit:"gm/dL", normal:"" },
    ]}],
  },
  "THYROID": {
    key:"THYROID", label:"Total Thyroid Profile", dept:"ENDOCRINOLOGY", color:"#7c3aed", bg:"#f5f3ff",
    sections:[{ heading:"TOTAL THYROID PROFILE", fields:[
      { name:"T3 (Free)", unit:"pmol/i", normal:"0.9–2.5" },
      { name:"FT4 (Free Thyroxine)", unit:"pmol/i", normal:"60–135" },
      { name:"TSH (Thyroid Stimulating Hormone)", unit:"pmol/i", normal:"0.25–5.0" },
    ]}],
  },
  "WIDAL": {
    key:"WIDAL", label:"Widal Test (Slide Method)", dept:"IMMUNOLOGY – SEROLOGY", color:"#b45309", bg:"#fffbeb",
    type:"widal",
    antigens:["TO","TH","AH","BH"],
    dilutions:["1:20","1:40","1:80","1:160","1:320"],
  },
  "TYPHIDOT": {
    key:"TYPHIDOT", label:"Typhi Dot (IgG & IgM)", dept:"IMMUNOLOGY – SEROLOGY", color:"#b45309", bg:"#fffbeb",
    sections:[{ heading:"TYPHI DOT (IgG & IgM)", fields:[
      { name:"Thypidot Test for S.Typhi IgM", unit:"", normal:"" },
      { name:"Thypidot Test for S.Typhi IgG", unit:"", normal:"" },
    ]}],
  },
  "DENGUE": {
    key:"DENGUE", label:"Dengue Panel", dept:"IMMUNOLOGY – SEROLOGY", color:"#b45309", bg:"#fffbeb",
    sections:[{ heading:"DENGUE IgM & IgG", fields:[
      { name:"Dengue IgM Antibodies", unit:"", normal:"NON-REACTIVE" },
      { name:"Dengue IgG Antibodies", unit:"", normal:"NON-REACTIVE" },
      { name:"Dengue NS1 Antigen", unit:"", normal:"NON-REACTIVE" },
    ]}],
  },
  "ANTITPO": {
    key:"ANTITPO", label:"Anti-TPO Antibody", dept:"IMMUNOLOGY – SEROLOGY", color:"#b45309", bg:"#fffbeb",
    sections:[{ heading:"ANTI-TPO (THYROID PEROXIDASE ANTIBODY)", fields:[
      { name:"Anti-TPO", unit:"", normal:"<0.9 not detected" },
    ]}],
  },
  "MALARIA": {
    key:"MALARIA", label:"Malaria Antigen Test", dept:"MICROBIOLOGY", color:"#065f46", bg:"#ecfdf5",
    sections:[{ heading:"MALARIA ANTIGEN TEST", fields:[
      { name:"Plasmodium P.Vivax", unit:"", normal:"NEGATIVE" },
      { name:"Plasmodium Falciparum", unit:"", normal:"NEGATIVE" },
    ]}],
  },
  "VIRAL": {
    key:"VIRAL", label:"Viral Markers", dept:"MICROBIOLOGY", color:"#065f46", bg:"#ecfdf5",
    sections:[{ heading:"VIRAL MARKERS", fields:[
      { name:"HIV I & II", unit:"", normal:"NEGATIVE" },
      { name:'Hepatitis "B" (HBsAg)', unit:"", normal:"NEGATIVE" },
      { name:"HCV", unit:"", normal:"NEGATIVE" },
      { name:"COVID-19 (Ag)", unit:"", normal:"NON-REACTIVE" },
    ]}],
  },
  "URINE_RM": {
    key:"URINE_RM", label:"Urine Examination (R/M)", dept:"MICROBIOLOGY", color:"#065f46", bg:"#ecfdf5",
    type:"urine",
  },
  "URINE_GRAM": {
    key:"URINE_GRAM", label:"Urine Gram Stain", dept:"MICROBIOLOGY", color:"#065f46", bg:"#ecfdf5",
    type:"narrative",
    fields:[
      { label:"Nature of Sample", multiline:false },
      { label:"Result", multiline:true, rows:3 },
    ],
  },
  "URINE_CS": {
    key:"URINE_CS", label:"Urine C/S (Culture & Sensitivity)", dept:"MICROBIOLOGY", color:"#065f46", bg:"#ecfdf5",
    type:"culture", specimen:"URINE C/S",
  },
  "BLOOD_CS": {
    key:"BLOOD_CS", label:"Blood C/S (Culture & Sensitivity)", dept:"MICROBIOLOGY", color:"#065f46", bg:"#ecfdf5",
    type:"culture", specimen:"BLOOD C/S",
  },
  "SPUTUM": {
    key:"SPUTUM", label:"Sputum Examination", dept:"MICROBIOLOGY", color:"#065f46", bg:"#ecfdf5",
    type:"narrative",
    fields:[
      { label:"Sputum for AFB Result", multiline:false },
      { label:"Gram Stain Result", multiline:true, rows:2 },
    ],
  },
  "SPUTUM_CS": {
    key:"SPUTUM_CS", label:"Sputum C/S (Culture & Sensitivity)", dept:"MICROBIOLOGY", color:"#065f46", bg:"#ecfdf5",
    type:"culture", specimen:"SPUTUM C/S",
  },
  "STOOL": {
    key:"STOOL", label:"Stool Examination (R/M)", dept:"MICROBIOLOGY", color:"#065f46", bg:"#ecfdf5",
    type:"stool",
  },
  "STOOL_CS": {
    key:"STOOL_CS", label:"Stool C/S (Culture & Sensitivity)", dept:"MICROBIOLOGY", color:"#065f46", bg:"#ecfdf5",
    type:"culture", specimen:"STOOL C/S",
  },
  "BODY_FLUID": {
    key:"BODY_FLUID", label:"Body Fluid Analysis", dept:"MICROBIOLOGY", color:"#065f46", bg:"#ecfdf5",
    type:"body_fluid",
  },
};

const TEST_TO_REPORT = {
  "Haemoglobin":"CBC","TLC (Total Leucocyte Count)":"CBC","Polymorphs":"CBC","Lymphocyte":"CBC","Eosinophil":"CBC","Monocyte":"CBC","Basophil":"CBC","PCV":"CBC","MCV (Mean Corp Volume)":"CBC","MCH (Mean Corp Hb)":"CBC","MCHC (Mean Corp Hb Conc)":"CBC","RBC (Red Blood Cell Count)":"CBC","Platelet Count":"CBC","ESR (Wintrobe)":"CBC",
  "Blood Picture (Peripheral Smear)":"PERIPHERAL_SMEAR",
  "Prothrombin Time (PT)":"COAGULATION","INR":"COAGULATION","APTT (Activated Partial Thromboplastin Time)":"COAGULATION","BT (Bleeding Time)":"COAGULATION","CT (Clotting Time)":"COAGULATION","D-Dimer":"COAGULATION",
  "Blood Group":"BLOODGROUP","Rh Factor":"BLOODGROUP",
  "Blood Urea":"KFT","Serum Creatinine":"KFT","S.Uric Acid":"KFT","Sodium":"KFT","Potassium":"KFT","Calcium":"KFT",
  "Serum Bilirubin (Total)":"LFT","Conjugated (D Bilirubin)":"LFT","Unconjugated (I.D Bilirubin)":"LFT","SGOT/AST":"LFT","SGPT/ALT":"LFT","Total Protein":"LFT","Albumin":"LFT","Globuline":"LFT","Alkaline Phosphatase":"LFT",
  "Cholesterol Total":"LIPID","Triglyceride":"LIPID","Cholesterol HDL":"LIPID","Cholesterol VLDL":"LIPID","Cholesterol LDL":"LIPID","LDL/HDL Ratio":"LIPID",
  "pH":"BLOODGAS","pCO2":"BLOODGAS","pO2":"BLOODGAS","TCO2":"BLOODGAS","HCO3":"BLOODGAS","BE":"BLOODGAS","%SO2C":"BLOODGAS","Na+":"BLOODGAS","K+":"BLOODGAS","Cl":"BLOODGAS","GLU":"BLOODGAS","THbc":"BLOODGAS","HCT":"BLOODGAS",
  "Blood Glucose Random (RBS)":"GLUCOSE","Blood Glucose Fasting (FBS)":"GLUCOSE","Blood Glucose PP":"GLUCOSE","HbA1c (Glycosylated Haemoglobin)":"GLUCOSE","Mean Plasma Glucose":"GLUCOSE","Urine Ketone":"GLUCOSE",
  "Troponin-T":"CARDIAC","Troponin-I":"CARDIAC","CPK-MB":"CARDIAC","CPK":"CARDIAC","NT-proBNP":"CARDIAC",
  "CRP (Qualitative)":"CRP","CRP (Quantitative)":"CRP","Serum Procalcitonin":"CRP",
  "S. Amylase":"PANCREATIC","S. Lipase":"PANCREATIC",
  "Vitamin B-12 (Cyanocobalamin)":"VITAMINS","25 OH Vitamin D3":"VITAMINS",
  "Iron (Serum)":"IRON","TIBC":"IRON","Unsaturated Iron Binding Capacity":"IRON","Transferrin Saturation":"IRON",
  "Adenosine Deaminase (ADA)":"MISC_BIO","Homocysteine":"MISC_BIO","PSA (Prostate Specific Antigen)":"MISC_BIO","SAAG (Serum Ascites Albumin Gradient)":"MISC_BIO","Albumin Fluid":"MISC_BIO",
  "T3 (Free)":"THYROID","FT4 (Free Thyroxine)":"THYROID","TSH (Thyroid Stimulating Hormone)":"THYROID","Total Thyroid Profile":"THYROID",
  "Widal Test (Slide Method)":"WIDAL","Typhidot IgM":"TYPHIDOT","Typhidot IgG":"TYPHIDOT",
  "Dengue IgM Antibodies":"DENGUE","Dengue IgG Antibodies":"DENGUE","Dengue NS1 Antigen":"DENGUE",
  "Anti-TPO (Thyroid Peroxidase Antibody)":"ANTITPO",
  "Malaria Antigen Test (MP Antigen)":"MALARIA","Plasmodium P.Vivax":"MALARIA","Plasmodium Falciparum":"MALARIA",
  "HIV I & II":"VIRAL","Hepatitis B (HBsAg)":"VIRAL","HCV":"VIRAL","COVID-19 Rapid Antigen":"VIRAL",
  "Urine Examination (R/M)":"URINE_RM","Urine Gram Stain":"URINE_GRAM","Urine C/S (Culture & Sensitivity)":"URINE_CS",
  "Blood C/S (Culture & Sensitivity)":"BLOOD_CS",
  "Sputum For AFB":"SPUTUM","Sputum Gram Stain":"SPUTUM","Sputum C/S (Culture & Sensitivity)":"SPUTUM_CS",
  "Stool R/M (Routine & Microscopy)":"STOOL","Stool C/S (Culture & Sensitivity)":"STOOL_CS",
  "Body Fluid Cytology":"BODY_FLUID","Body Fluid Routine Analysis":"BODY_FLUID","Ascitic Fluid TLC/DLC":"BODY_FLUID",
};

const DEPT_ICONS = {
  "HAEMATOLOGY":"🩸","BIOCHEMISTRY":"🧪","ENDOCRINOLOGY":"⚗️",
  "IMMUNOLOGY – SEROLOGY":"🔬","MICROBIOLOGY":"🦠",
};

const ANTIBIOTICS = [
  "AMIKACIN","AMOXICILLIN + CLAVULANATE","AMPICILLIN","AMPICILLIN + SULBACTAM",
  "CEFOPERAZONE + SULBACTAM","CEFOTAXIME","CEFTAZIDIME","CEFTRIAXONE","CIPROFLOXACIN",
  "COLISTIN","CO-TRIMOXAZOLE","GENTAMYCIN","FOSFOMYCIN","IMIPENEM","LEVOFLOXACIN",
  "MEROPENEM","NETILMICIN","NITROFURANTOIN","OFLOXACIN","PIPERACILLIN + TAZOBACTAM",
  "POLYMYXIN B","TETRACYCLINE","TICARCILLIN + CLAVULANATE","TIGECYCLINE","CEFOTAXIME + CLAVULANATE",
];

function getReportKeys(selectedTests) {
  const keys = new Set();
  Object.keys(selectedTests).forEach(t => {
    if (selectedTests[t] && TEST_TO_REPORT[t]) keys.add(TEST_TO_REPORT[t]);
  });
  return Array.from(keys);
}

// ─── Report Body Content ──────────────────────────────────────────────────────
function ReportBody({ tmpl, vals, setVals }) {
  const get = k => vals?.[k] ?? "";
  const set = (k, v) => setVals(p => ({ ...(p || {}), [k]: v }));

  const cellInp = {
    fontFamily:"DM Sans,sans-serif", fontSize:13, color:"#1e293b",
    background:"transparent", border:"none", borderBottom:"1.5px solid #e2e8f0",
    outline:"none", width:"100%", textAlign:"center", padding:"3px 4px",
  };
  const blockInp = {
    fontFamily:"DM Sans,sans-serif", fontSize:13, color:"#1e293b",
    background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:7,
    padding:"8px 10px", width:"100%", outline:"none", boxSizing:"border-box",
  };

  const onFocus = (e, color) => { e.target.style.borderColor = color; };
  const onBlur  = (e, def="#e2e8f0") => { e.target.style.borderColor = def; };

  // ── WIDAL ──────────────────────────────────────────────────────────────────
  if (tmpl.type === "widal") {
    return (
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead>
            <tr style={{ background:tmpl.bg }}>
              <th style={{ padding:"9px 14px", textAlign:"left", color:tmpl.color, fontWeight:700, border:"1px solid #e2e8f0", width:100 }}>ANTIGEN</th>
              {tmpl.dilutions.map(d => (
                <th key={d} style={{ padding:"9px 12px", textAlign:"center", color:tmpl.color, fontWeight:700, border:"1px solid #e2e8f0", minWidth:64 }}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tmpl.antigens.map((ag, i) => (
              <tr key={ag} style={{ background:i%2===0?"#fafafa":"#fff" }}>
                <td style={{ padding:"8px 14px", fontWeight:700, color:"#334155", border:"1px solid #e2e8f0", fontSize:14 }}>{ag}</td>
                {tmpl.dilutions.map(d => {
                  const val = get(`${ag}_${d}`);
                  return (
                    <td key={d} style={{ padding:"6px 8px", textAlign:"center", border:"1px solid #e2e8f0" }}>
                      <select value={val} onChange={e=>set(`${ag}_${d}`,e.target.value)}
                        style={{ fontFamily:"DM Sans,sans-serif", fontSize:15, border:"1.5px solid #e2e8f0", borderRadius:6, padding:"5px 8px", background:"#fff", cursor:"pointer", color:val==="+"?"#059669":val==="-"?"#dc2626":"#94a3b8", fontWeight:700, width:60 }}>
                        <option value="">—</option>
                        <option value="+">+</option>
                        <option value="-">-</option>
                      </select>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // ── CULTURE & SENSITIVITY ──────────────────────────────────────────────────
  if (tmpl.type === "culture") {
    return (
      <div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:22 }}>
          {[["Specimen Source", tmpl.specimen||""],["Date Received",""],["Date Reported",""],["Culture Result",""]].map(([label, def]) => (
            <div key={label}>
              <div style={{ fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:".05em", marginBottom:5 }}>{label}</div>
              <input value={get(label)||(def||"")} onChange={e=>set(label,e.target.value)} placeholder={def||label}
                style={blockInp} onFocus={e=>onFocus(e,tmpl.color)} onBlur={e=>onBlur(e)} />
            </div>
          ))}
        </div>
        <div style={{ fontSize:11, fontWeight:700, color:tmpl.color, textTransform:"uppercase", letterSpacing:".06em", marginBottom:12, paddingTop:12, borderTop:`2px solid ${tmpl.bg}` }}>
          ANTIBIOTIC SENSITIVITY
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
          {ANTIBIOTICS.map(ab => {
            const val = get(`ab_${ab}`);
            return (
              <div key={ab} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"7px 10px", borderRadius:8, border:`1px solid ${val==="SENSITIVE"?"#bbf7d0":val==="RESISTANT"?"#fecaca":"#f1f5f9"}`, background:val==="SENSITIVE"?"#f0fdf4":val==="RESISTANT"?"#fef2f2":"#f8fafc", gap:8 }}>
                <span style={{ fontSize:12, color:"#334155" }}>{ab}</span>
                <select value={val} onChange={e=>set(`ab_${ab}`,e.target.value)}
                  style={{ fontFamily:"DM Sans,sans-serif", fontSize:12, border:"1.5px solid #e2e8f0", borderRadius:6, padding:"3px 6px", background:"#fff", cursor:"pointer", color:val==="SENSITIVE"?"#059669":val==="RESISTANT"?"#dc2626":"#64748b", fontWeight:600, minWidth:110 }}>
                  <option value="">— Select —</option>
                  <option value="SENSITIVE">✓ SENSITIVE</option>
                  <option value="RESISTANT">✗ RESISTANT</option>
                  <option value="INTERMEDIATE">~ INTERMEDIATE</option>
                </select>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── URINE R/M ──────────────────────────────────────────────────────────────
  if (tmpl.type === "urine") {
    const secs = [
      { h:"PHYSICAL EXAMINATION", fields:[["COLOUR",""],["VOLUME","ml"],["SPECIFIC GRAVITY",""]] },
      { h:"CHEMICAL EXAMINATION",  fields:[["REACTION",""],["ALBUMIN","NIL"],["SUGAR","NIL"],["pH",""]] },
      { h:"MICROSCOPIC EXAMINATION", fields:[["PUS CELLS","/HPF"],["EPITHELIAL CELLS","/HPF"],["RBC's","/HPF"],["CASTS","NIL"],["CRYSTALS","NIL"],["BACTERIA","NIL"],["OTHERS","NIL"]] },
    ];
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
        {secs.map(sec => (
          <div key={sec.h}>
            <div style={{ fontSize:11, fontWeight:700, color:tmpl.color, textTransform:"uppercase", letterSpacing:".06em", marginBottom:10, paddingBottom:5, borderBottom:`2px solid ${tmpl.bg}` }}>{sec.h}</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {sec.fields.map(([label,unit]) => (
                <div key={label}>
                  <div style={{ fontSize:11, fontWeight:600, color:"#64748b", marginBottom:4 }}>{label}{unit?` (${unit})`:""}</div>
                  <input value={get(`u_${label}`)} onChange={e=>set(`u_${label}`,e.target.value)} placeholder="—"
                    style={blockInp} onFocus={e=>onFocus(e,tmpl.color)} onBlur={e=>onBlur(e)} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── STOOL ──────────────────────────────────────────────────────────────────
  if (tmpl.type === "stool") {
    const secs = [
      { h:"PHYSICAL EXAMINATION",  fields:["COLOUR","CONSISTENCY","MUCOUS"] },
      { h:"CHEMICAL EXAMINATION",  fields:["pH","REACTION"] },
      { h:"MICROSCOPIC EXAMINATION", fields:["PUS CELLS /HPF","RED BLOOD CELLS /HPF","OVA","CYST","BACTERIA"] },
    ];
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
        {secs.map(sec => (
          <div key={sec.h}>
            <div style={{ fontSize:11, fontWeight:700, color:tmpl.color, textTransform:"uppercase", letterSpacing:".06em", marginBottom:10, paddingBottom:5, borderBottom:`2px solid ${tmpl.bg}` }}>{sec.h}</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {sec.fields.map(f => (
                <div key={f}>
                  <div style={{ fontSize:11, fontWeight:600, color:"#64748b", marginBottom:4 }}>{f}</div>
                  <input value={get(`st_${f}`)} onChange={e=>set(`st_${f}`,e.target.value)} placeholder="—"
                    style={blockInp} onFocus={e=>onFocus(e,tmpl.color)} onBlur={e=>onBlur(e)} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── BODY FLUID ─────────────────────────────────────────────────────────────
  if (tmpl.type === "body_fluid") {
    const secs = [
      { h:"PHYSICAL APPEARANCE", fields:["Sample Type","Volume (mL)","Colour","Appearance","Coagulum","Blood"] },
      { h:"BIO-CHEMICAL",        fields:["Glucose (mg/dL)","Total Protein (gm/dL)"] },
      { h:"MICROSCOPY",          fields:["TLC Body Fluid (/cumm)","Neutrophil (%)","Lymphocyte (%)"] },
    ];
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
        {secs.map(sec => (
          <div key={sec.h}>
            <div style={{ fontSize:11, fontWeight:700, color:tmpl.color, textTransform:"uppercase", letterSpacing:".06em", marginBottom:10, paddingBottom:5, borderBottom:`2px solid ${tmpl.bg}` }}>{sec.h}</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {sec.fields.map(f => (
                <div key={f}>
                  <div style={{ fontSize:11, fontWeight:600, color:"#64748b", marginBottom:4 }}>{f}</div>
                  <input value={get(`bf_${f}`)} onChange={e=>set(`bf_${f}`,e.target.value)} placeholder="—"
                    style={blockInp} onFocus={e=>onFocus(e,tmpl.color)} onBlur={e=>onBlur(e)} />
                </div>
              ))}
            </div>
          </div>
        ))}
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:tmpl.color, textTransform:"uppercase", letterSpacing:".06em", marginBottom:10, paddingBottom:5, borderBottom:`2px solid ${tmpl.bg}` }}>CYTOLOGY / IMPRESSION</div>
          <textarea value={get("bf_impression")} onChange={e=>set("bf_impression",e.target.value)} rows={3} placeholder="Findings and impression..."
            style={{...blockInp, resize:"vertical"}} onFocus={e=>onFocus(e,tmpl.color)} onBlur={e=>onBlur(e)} />
        </div>
      </div>
    );
  }

  // ── NARRATIVE ──────────────────────────────────────────────────────────────
  if (tmpl.type === "narrative") {
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        {tmpl.fields.map(f => (
          <div key={f.label}>
            <div style={{ fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:".05em", marginBottom:6 }}>{f.label}</div>
            {f.multiline
              ? <textarea value={get(`n_${f.label}`)} onChange={e=>set(`n_${f.label}`,e.target.value)} rows={f.rows||3} placeholder={`Enter ${f.label.toLowerCase()}...`}
                  style={{...blockInp, resize:"vertical"}} onFocus={e=>onFocus(e,tmpl.color)} onBlur={e=>onBlur(e)} />
              : <input value={get(`n_${f.label}`)} onChange={e=>set(`n_${f.label}`,e.target.value)} placeholder={`Enter ${f.label.toLowerCase()}...`}
                  style={blockInp} onFocus={e=>onFocus(e,tmpl.color)} onBlur={e=>onBlur(e)} />
            }
          </div>
        ))}
      </div>
    );
  }

  // ── STANDARD TABLE (sections with sub-headings) ────────────────────────────
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:22 }}>
      {(tmpl.sections||[]).map((sec, si) => (
        <div key={si}>
          {sec.heading && (
            <div style={{ fontSize:11, fontWeight:700, color:tmpl.color, textTransform:"uppercase", letterSpacing:".06em", marginBottom:10, paddingBottom:5, borderBottom:`2px solid ${tmpl.bg}` }}>
              {sec.heading}
            </div>
          )}
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ background:tmpl.bg }}>
                <th style={{ padding:"8px 12px", textAlign:"left", color:tmpl.color, fontWeight:700, border:"1px solid #e2e8f0", width:"50%" }}>TEST NAME</th>
                <th style={{ padding:"8px 12px", textAlign:"center", color:tmpl.color, fontWeight:700, border:"1px solid #e2e8f0", width:"22%" }}>VALUE</th>
                <th style={{ padding:"8px 12px", textAlign:"center", color:tmpl.color, fontWeight:700, border:"1px solid #e2e8f0", width:"28%" }}>NORMAL VALUE</th>
              </tr>
            </thead>
            <tbody>
              {sec.fields.map((field, fi) => (
                <tr key={fi} style={{ background:fi%2===0?"#fafafa":"#fff" }}>
                  <td style={{ padding:"8px 12px", color:"#334155", fontWeight:500, border:"1px solid #e2e8f0" }}>
                    {field.name}
                    {field.unit && <span style={{ color:"#94a3b8", fontSize:11, marginLeft:5 }}>({field.unit})</span>}
                  </td>
                  <td style={{ padding:"5px 8px", border:"1px solid #e2e8f0", textAlign:"center" }}>
                    <input
                      value={get(`v_${si}_${fi}`)}
                      onChange={e=>set(`v_${si}_${fi}`,e.target.value)}
                      placeholder="—"
                      style={cellInp}
                      onFocus={e=>onFocus(e,tmpl.color)} onBlur={e=>onBlur(e,"#e2e8f0")}
                    />
                  </td>
                  <td style={{ padding:"8px 12px", textAlign:"center", border:"1px solid #e2e8f0" }}>
                    <input
                      value={get(`n_${si}_${fi}`) || field.normal}
                      onChange={e=>set(`n_${si}_${fi}`,e.target.value)}
                      style={{ ...cellInp, color:"#64748b", fontSize:12, borderBottomStyle:"dashed" }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

// ─── Report Modal ─────────────────────────────────────────────────────────────
function ReportModal({ reportKeys, reportData, setReportData, onClose }) {
  const [currentIdx, setCurrentIdx]   = useState(0);
  const [saved, setSaved]             = useState({});
  const key   = reportKeys[currentIdx];
  const tmpl  = REPORT_TEMPLATES[key];
  const total = reportKeys.length;
  const progress = Math.round((Object.keys(saved).length / total) * 100);

  const handleSaveNext = () => {
    setSaved(p => ({ ...p, [key]: true }));
    if (currentIdx < total - 1) setCurrentIdx(i => i + 1);
    else onClose();
  };

  return (
    <div
      style={{ position:"fixed", inset:0, background:"rgba(15,23,42,.65)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:16, backdropFilter:"blur(3px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background:"#fff", borderRadius:20, width:"100%", maxWidth:820, maxHeight:"92vh", display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 32px 80px rgba(0,0,0,.35)" }}>

        {/* ── Top header ── */}
        <div style={{ padding:"18px 22px 0", background:"#fff", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
            <div style={{ width:42, height:42, borderRadius:11, background:tmpl?.bg, border:`2px solid ${tmpl?.color}25`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>
              {DEPT_ICONS[tmpl?.dept] || "🔬"}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                <span style={{ fontFamily:"DM Serif Display,serif", fontSize:17, color:"#1e3a5f" }}>Lab Report Entry</span>
                <span style={{ fontSize:12, color:"#94a3b8", background:"#f1f5f9", padding:"2px 10px", borderRadius:20 }}>{currentIdx+1} / {total}</span>
              </div>
              <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>Fill in report values · Save each · Proceed to next</div>
            </div>
            <button onClick={onClose} style={{ width:32, height:32, borderRadius:"50%", border:"1.5px solid #e2e8f0", background:"#fff", cursor:"pointer", fontSize:16, color:"#64748b", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>✕</button>
          </div>

          {/* Progress bar */}
          <div style={{ background:"#f1f5f9", borderRadius:10, height:5, overflow:"hidden", marginBottom:0 }}>
            <div style={{ height:"100%", width:`${progress}%`, background:`linear-gradient(90deg,${tmpl?.color||"#0ea5e9"},${tmpl?.color||"#0ea5e9"}99)`, borderRadius:10, transition:"width .4s ease" }} />
          </div>

          {/* Tab bar */}
          <div style={{ display:"flex", overflowX:"auto", borderBottom:"1px solid #f1f5f9", gap:0, marginTop:0 }}>
            {reportKeys.map((k, i) => {
              const t      = REPORT_TEMPLATES[k];
              const isCurr = i === currentIdx;
              const isDone = saved[k];
              return (
                <button key={k} onClick={() => setCurrentIdx(i)}
                  style={{ padding:"10px 14px", border:"none", background:"transparent", cursor:"pointer", fontFamily:"DM Sans,sans-serif", fontSize:12, fontWeight:isCurr?700:500, color:isCurr?t?.color:isDone?"#059669":"#94a3b8", borderBottom:`2.5px solid ${isCurr?t?.color:isDone?"#86efac":"transparent"}`, whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:6, flexShrink:0, transition:"all .15s" }}>
                  {isDone
                    ? <span style={{ color:"#059669", fontSize:11 }}>✓</span>
                    : <span style={{ width:7, height:7, borderRadius:"50%", background:isCurr?t?.color:"#e2e8f0", display:"inline-block", flexShrink:0 }}/>
                  }
                  {t?.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ flex:1, overflowY:"auto", padding:"20px 22px" }}>

          {/* Report banner */}
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20, padding:"13px 16px", background:tmpl?.bg, borderRadius:10, border:`1px solid ${tmpl?.color}20` }}>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:"DM Serif Display,serif", fontSize:15, color:tmpl?.color }}>{tmpl?.label}</div>
              <div style={{ fontSize:11, color:"#94a3b8", marginTop:1 }}>{tmpl?.dept} · Department of Pathology · Sangi Hospital</div>
            </div>
            {saved[key] && (
              <div style={{ background:"#dcfce7", color:"#059669", borderRadius:20, padding:"4px 13px", fontSize:12, fontWeight:700, flexShrink:0 }}>✓ Saved</div>
            )}
          </div>

          {/* Report form */}
          {tmpl && (
            <ReportBody
              tmpl={tmpl}
              vals={reportData[key]}
              setVals={v => setReportData(p => ({ ...p, [key]: typeof v === "function" ? v(p[key]) : v }))}
            />
          )}

          {/* Report metadata */}
          <div style={{ marginTop:20, padding:"14px 16px", background:"#f8fafc", borderRadius:10, border:"1px solid #e2e8f0" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".06em", marginBottom:10 }}>Report Details</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
              {[["Date","date"],["Technologist","tech"],["Pathologist","path"]].map(([label,k2]) => (
                <div key={k2}>
                  <div style={{ fontSize:11, color:"#94a3b8", marginBottom:3 }}>{label}</div>
                  <input
                    value={reportData[key]?.[`meta_${k2}`]||""}
                    onChange={e=>setReportData(p=>({...p,[key]:{...(p[key]||{}), [`meta_${k2}`]:e.target.value}}))}
                    placeholder={label}
                    style={{ fontFamily:"DM Sans,sans-serif", fontSize:13, color:"#1e293b", background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:7, padding:"7px 10px", width:"100%", outline:"none", boxSizing:"border-box" }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ padding:"14px 22px", borderTop:"1px solid #e2e8f0", background:"#f8fafc", display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
          <button
            onClick={() => currentIdx > 0 && setCurrentIdx(i => i - 1)}
            disabled={currentIdx === 0}
            style={{ padding:"9px 20px", borderRadius:9, border:"1.5px solid #e2e8f0", background:"#fff", color:currentIdx===0?"#cbd5e1":"#334155", fontFamily:"DM Sans,sans-serif", fontSize:13, fontWeight:600, cursor:currentIdx===0?"not-allowed":"pointer" }}
          >
            ← Previous
          </button>

          {/* Step dots */}
          <div style={{ flex:1, display:"flex", justifyContent:"center", gap:6, alignItems:"center" }}>
            {reportKeys.map((k,i) => (
              <div key={k} onClick={()=>setCurrentIdx(i)} style={{ width:i===currentIdx?22:8, height:8, borderRadius:10, background:saved[k]?"#059669":i===currentIdx?(REPORT_TEMPLATES[k]?.color||"#0ea5e9"):"#e2e8f0", transition:"all .3s", cursor:"pointer" }} />
            ))}
          </div>

          <button
            onClick={handleSaveNext}
            style={{ padding:"9px 26px", borderRadius:9, border:"none", background:currentIdx===total-1?"linear-gradient(135deg,#059669,#047857)":`linear-gradient(135deg,${tmpl?.color},${tmpl?.color}cc)`, color:"#fff", fontFamily:"DM Sans,sans-serif", fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:8, boxShadow:`0 4px 14px ${tmpl?.color}40` }}
          >
            {currentIdx === total - 1 ? "✓ Save All & Close" : "Save & Next →"}
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── LAB TEST DATA ────────────────────────────────────────────────────────────
const LAB_TESTS = {
  "HAEMATOLOGY": {
    color:"#dc2626", bg:"#fef2f2", border:"#fecaca", icon:"🩸",
    subgroups: {
      "Complete Blood Count (CBC)": ["Haemoglobin","TLC (Total Leucocyte Count)","Polymorphs","Lymphocyte","Eosinophil","Monocyte","Basophil","PCV","MCV (Mean Corp Volume)","MCH (Mean Corp Hb)","MCHC (Mean Corp Hb Conc)","RBC (Red Blood Cell Count)","Platelet Count","ESR (Wintrobe)"],
      "Coagulation": ["Prothrombin Time (PT)","INR","APTT (Activated Partial Thromboplastin Time)","BT (Bleeding Time)","CT (Clotting Time)","D-Dimer"],
      "Blood Group & Typing": ["Blood Group","Rh Factor"],
      "Peripheral Smear": ["Blood Picture (Peripheral Smear)"],
    }
  },
  "BIOCHEMISTRY": {
    color:"#2563eb", bg:"#eff6ff", border:"#bfdbfe", icon:"🧪",
    subgroups: {
      "Kidney Function Test (KFT)": ["Blood Urea","Serum Creatinine","S.Uric Acid","Sodium","Potassium","Calcium"],
      "Liver Function Test (LFT)": ["Serum Bilirubin (Total)","Conjugated (D Bilirubin)","Unconjugated (I.D Bilirubin)","SGOT/AST","SGPT/ALT","Total Protein","Albumin","Globuline","Alkaline Phosphatase"],
      "Lipid Profile": ["Cholesterol Total","Triglyceride","Cholesterol HDL","Cholesterol VLDL","Cholesterol LDL","LDL/HDL Ratio"],
      "Blood Gas Analysis": ["pH","pCO2","pO2","TCO2","HCO3","BE","%SO2C","Na+","K+","Cl","GLU","THbc","HCT"],
      "Glucose": ["Blood Glucose Random (RBS)","Blood Glucose Fasting (FBS)","Blood Glucose PP","HbA1c (Glycosylated Haemoglobin)","Mean Plasma Glucose","Urine Ketone"],
      "Cardiac Markers": ["Troponin-T","Troponin-I","CPK-MB","CPK","NT-proBNP"],
      "Inflammatory Markers": ["CRP (Qualitative)","CRP (Quantitative)","Serum Procalcitonin"],
      "Pancreatic": ["S. Amylase","S. Lipase"],
      "Vitamins & Minerals": ["Vitamin B-12 (Cyanocobalamin)","25 OH Vitamin D3","Iron (Serum)","TIBC","Unsaturated Iron Binding Capacity","Transferrin Saturation"],
      "Miscellaneous Biochemistry": ["Adenosine Deaminase (ADA)","Homocysteine","PSA (Prostate Specific Antigen)","SAAG (Serum Ascites Albumin Gradient)","Albumin Fluid"],
    }
  },
  "ENDOCRINOLOGY": {
    color:"#7c3aed", bg:"#f5f3ff", border:"#ddd6fe", icon:"⚗️",
    subgroups: {
      "Thyroid Profile": ["T3 (Free)","FT4 (Free Thyroxine)","TSH (Thyroid Stimulating Hormone)","Total Thyroid Profile"],
    }
  },
  "IMMUNOLOGY – SEROLOGY": {
    color:"#b45309", bg:"#fffbeb", border:"#fde68a", icon:"🔬",
    subgroups: {
      "Fever Panel": ["Widal Test (Slide Method)","Typhidot IgM","Typhidot IgG"],
      "Dengue": ["Dengue IgM Antibodies","Dengue IgG Antibodies","Dengue NS1 Antigen"],
      "Thyroid Autoimmune": ["Anti-TPO (Thyroid Peroxidase Antibody)"],
    }
  },
  "MICROBIOLOGY": {
    color:"#065f46", bg:"#ecfdf5", border:"#a7f3d0", icon:"🦠",
    subgroups: {
      "Malaria": ["Malaria Antigen Test (MP Antigen)","Plasmodium P.Vivax","Plasmodium Falciparum"],
      "Viral Markers": ["HIV I & II","Hepatitis B (HBsAg)","HCV","COVID-19 Rapid Antigen"],
      "Urine": ["Urine Examination (R/M)","Urine Gram Stain","Urine C/S (Culture & Sensitivity)"],
      "Blood": ["Blood C/S (Culture & Sensitivity)"],
      "Sputum": ["Sputum For AFB","Sputum Gram Stain","Sputum C/S (Culture & Sensitivity)"],
      "Stool": ["Stool R/M (Routine & Microscopy)","Stool C/S (Culture & Sensitivity)"],
      "Body Fluid": ["Body Fluid Cytology","Body Fluid Routine Analysis","Ascitic Fluid TLC/DLC"],
    }
  },
};

// ─── InvestigationsDropdown (unchanged from original) ─────────────────────────
function InvestigationsDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({});
  const [selected, setSelected] = useState(() => {
    const map = {};
    if (value) value.split(", ").forEach(t => { if (t.trim()) map[t.trim()] = true; });
    return map;
  });
  const dropRef = useRef(null);

  useEffect(() => {
    function handler(e) { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const str = Object.keys(selected).filter(k => selected[k]).join(", ");
    onChange({ target: { value: str } });
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedCount = Object.values(selected).filter(Boolean).length;
  const searchLower = search.toLowerCase();
  const matchesSearch = t => !search || t.toLowerCase().includes(searchLower);
  const deptHasMatch = dept => !search || Object.values(LAB_TESTS[dept].subgroups).flat().some(matchesSearch);

  function toggleTest(test) { setSelected(prev => ({ ...prev, [test]: !prev[test] })); }
  function toggleDept(deptTests) { const a=deptTests.every(t=>selected[t]); const u={}; deptTests.forEach(t=>{u[t]=!a;}); setSelected(prev=>({...prev,...u})); }
  function toggleSubgroup(tests) { const a=tests.every(t=>selected[t]); const u={}; tests.forEach(t=>{u[t]=!a;}); setSelected(prev=>({...prev,...u})); }
  function clearAll() { setSelected({}); }

  return (
    <div ref={dropRef} style={{ position:"relative", width:"100%" }}>
      <div onClick={() => setOpen(o=>!o)} style={{ fontFamily:"DM Sans,sans-serif", fontSize:14, color:selectedCount?T.text:T.textLight, background:T.white, border:`1.5px solid ${open?T.accentDeep:T.border}`, borderRadius:10, padding:"11px 14px", width:"100%", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between", boxSizing:"border-box", minHeight:46, transition:"border-color .15s" }}>
        <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:8 }}>
          {selectedCount > 0 ? `${selectedCount} test${selectedCount>1?"s":""} selected` : "Select investigations..."}
        </span>
        <span style={{ color:T.textLight, fontSize:12, flexShrink:0 }}>{open?"▴":"▾"}</span>
      </div>

      {selectedCount > 0 && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:7 }}>
          {Object.keys(selected).filter(k=>selected[k]).map(test => (
            <span key={test} style={{ display:"inline-flex", alignItems:"center", gap:4, background:"#e0f2fe", border:"1px solid #7dd3fc", borderRadius:20, padding:"3px 10px", fontSize:12, color:"#0369a1" }}>
              {test}
              <span onClick={e=>{e.stopPropagation();toggleTest(test);}} style={{ cursor:"pointer", fontSize:11, color:"#0284c7", fontWeight:700, lineHeight:1 }}>×</span>
            </span>
          ))}
          <span onClick={clearAll} style={{ cursor:"pointer", fontSize:12, color:"#ef4444", alignSelf:"center", marginLeft:4 }}>Clear all</span>
        </div>
      )}

      {open && (
        <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, right:0, background:T.white, border:`1.5px solid ${T.border}`, borderRadius:12, boxShadow:"0 8px 32px rgba(11,37,69,.14)", zIndex:1000, maxHeight:420, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div style={{ padding:"10px 12px", borderBottom:`1px solid ${T.border}` }}>
            <input autoFocus placeholder="Search tests..." value={search} onChange={e=>setSearch(e.target.value)}
              style={{ width:"100%", fontFamily:"DM Sans,sans-serif", fontSize:13, border:`1.5px solid ${T.border}`, borderRadius:8, padding:"8px 12px", outline:"none", boxSizing:"border-box", color:T.text, background:T.offwhite }} />
          </div>
          <div style={{ overflowY:"auto", flex:1 }}>
            {Object.entries(LAB_TESTS).map(([dept,{color,bg,border,icon,subgroups}]) => {
              if (!deptHasMatch(dept)) return null;
              const allDeptTests = Object.values(subgroups).flat().filter(matchesSearch);
              const deptSelCount = allDeptTests.filter(t=>selected[t]).length;
              const deptAllSel = allDeptTests.length>0 && allDeptTests.every(t=>selected[t]);
              const isDeptOpen = expanded[dept]!==false;
              return (
                <div key={dept}>
                  <div onClick={()=>setExpanded(p=>({...p,[dept]:!isDeptOpen}))} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:bg, borderTop:`2px solid ${border}`, cursor:"pointer", userSelect:"none" }}>
                    <input type="checkbox" checked={deptAllSel} ref={el=>{if(el)el.indeterminate=deptSelCount>0&&!deptAllSel;}} onChange={e=>{e.stopPropagation();toggleDept(allDeptTests);}} onClick={e=>e.stopPropagation()} style={{ width:15,height:15,cursor:"pointer",accentColor:color,flexShrink:0 }}/>
                    <span style={{ fontSize:14 }}>{icon}</span>
                    <span style={{ flex:1,fontWeight:700,fontSize:13,color,letterSpacing:".04em" }}>{dept}</span>
                    {deptSelCount>0 && <span style={{ background:color,color:"#fff",borderRadius:20,padding:"1px 8px",fontSize:11,fontWeight:700 }}>{deptSelCount}</span>}
                    <span style={{ color,fontSize:11,marginLeft:4 }}>{isDeptOpen?"▴":"▾"}</span>
                  </div>
                  {isDeptOpen && Object.entries(subgroups).map(([subgroup,tests]) => {
                    const filteredTests = tests.filter(matchesSearch);
                    if (filteredTests.length===0) return null;
                    const subAllSel = filteredTests.every(t=>selected[t]);
                    const subSomeSel = filteredTests.some(t=>selected[t]);
                    const isSubOpen = expanded[`${dept}_${subgroup}`]!==false;
                    return (
                      <div key={subgroup}>
                        <div onClick={()=>setExpanded(p=>({...p,[`${dept}_${subgroup}`]:!isSubOpen}))} style={{ display:"flex",alignItems:"center",gap:9,padding:"8px 14px 8px 28px",background:"#f8fafc",borderBottom:"1px solid #f1f5f9",cursor:"pointer",userSelect:"none" }}>
                          <input type="checkbox" checked={subAllSel} ref={el=>{if(el)el.indeterminate=subSomeSel&&!subAllSel;}} onChange={e=>{e.stopPropagation();toggleSubgroup(filteredTests);}} onClick={e=>e.stopPropagation()} style={{ width:14,height:14,cursor:"pointer",accentColor:color,flexShrink:0 }}/>
                          <span style={{ flex:1,fontSize:12,fontWeight:600,color:"#475569" }}>{subgroup}</span>
                          <span style={{ fontSize:10,color:"#94a3b8" }}>{isSubOpen?"▴":"▾"}</span>
                        </div>
                        {isSubOpen && filteredTests.map(test => (
                          <label key={test} style={{ display:"flex",alignItems:"center",gap:10,padding:"7px 14px 7px 46px",cursor:"pointer",userSelect:"none",borderBottom:"1px solid #f8fafc",background:selected[test]?bg:"transparent",transition:"background .1s" }}>
                            <input type="checkbox" checked={!!selected[test]} onChange={()=>toggleTest(test)} style={{ width:14,height:14,cursor:"pointer",accentColor:color,flexShrink:0 }}/>
                            <span style={{ fontSize:13,color:selected[test]?color:T.text,fontWeight:selected[test]?600:400 }}>{test}</span>
                          </label>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
          <div style={{ padding:"8px 14px",borderTop:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:T.offwhite }}>
            <span style={{ fontSize:12,color:T.textMuted }}>{selectedCount} test{selectedCount!==1?"s":""} selected</span>
            <button onClick={()=>setOpen(false)} style={{ padding:"5px 16px",borderRadius:8,border:"none",background:T.accentDeep,color:"#fff",fontFamily:"DM Sans,sans-serif",fontSize:13,fontWeight:600,cursor:"pointer" }}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shared form primitives (unchanged from original) ─────────────────────────
function Field({ label, req, children }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <label style={{ fontSize:11, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:".06em" }}>
        {label}{req && <span style={{ color:T.red }}> *</span>}
      </label>
      {children}
    </div>
  );
}
function Inp({ label, req, placeholder, value, onChange, type="text" }) {
  return (
    <Field label={label} req={req}>
      <input type={type} placeholder={placeholder} value={value} onChange={onChange}
        style={{ fontFamily:"DM Sans,sans-serif", fontSize:14, color:T.text, background:T.white, border:`1.5px solid ${T.border}`, borderRadius:10, padding:"11px 14px", width:"100%", outline:"none", boxSizing:"border-box" }} />
    </Field>
  );
}
function Txta({ label, req, placeholder, value, onChange, rows=3 }) {
  return (
    <Field label={label} req={req}>
      <textarea placeholder={placeholder} value={value} onChange={onChange} rows={rows}
        style={{ fontFamily:"DM Sans,sans-serif", fontSize:14, color:T.text, background:T.white, border:`1.5px solid ${T.border}`, borderRadius:10, padding:"11px 14px", width:"100%", outline:"none", resize:"vertical", boxSizing:"border-box" }} />
    </Field>
  );
}
function Section({ title, subtitle, icon, children }) {
  return (
    <div style={{ background:T.white, border:`1px solid ${T.border}`, borderRadius:16, marginBottom:20, overflow:"hidden", boxShadow:"0 1px 4px rgba(11,37,69,.07)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:13, padding:"17px 22px", borderBottom:`1px solid ${T.border}`, background:T.offwhite }}>
        <div style={{ width:36, height:36, borderRadius:10, background:T.bgTint, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", color:T.accentDeep }}>
          <Ico d={icon} size={16} sw={1.75}/>
        </div>
        <div>
          <p style={{ fontFamily:"DM Serif Display,serif", fontSize:15, color:T.primary, margin:0 }}>{title}</p>
          <p style={{ fontSize:12, color:T.textMuted, margin:"2px 0 0" }}>{subtitle}</p>
        </div>
      </div>
      <div style={{ padding:24 }}>{children}</div>
    </div>
  );
}

// ─── Print helpers (unchanged from original) ──────────────────────────────────
export function AdmissionNotePrint({ data, patient, discharge, locId }) {
  const branchInfo = {
    "laxmi":{ name:"Lakshmi Nagar Branch", address:"Lakshmi Nagar, Mathura, Uttar Pradesh - 281004", phone1:"+91-9717444531", phone2:"+91-9717444532", email:"laxminagar@sangihospital.com" },
    "raya": { name:"Raya Branch", address:"Raya, Mathura, Uttar Pradesh - 281204", phone1:"+91-9311212090", phone2:"+91-9311212091", email:"info@sangihospital.com" },
  };
  const branch = branchInfo[locId]||branchInfo["laxmi"];
  const today   = new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"2-digit",year:"numeric"});
  const nowTime = new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false});
  const investigationsText = [data?.investigations, data?.investigationsCustom].filter(Boolean).join(", ");
  return (
    <div id="admission-note-print" style={{ fontFamily:"Arial,sans-serif", fontSize:12, color:"#000", padding:"24px 32px", background:"#fff", maxWidth:800, margin:"0 auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", borderBottom:"2px solid #000", paddingBottom:10, marginBottom:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <img src="/logo512.png" alt="Sangi Hospital" style={{ width:64, height:64, objectFit:"contain", borderRadius:12 }}/>
          <div>
            <div style={{ fontSize:28, fontWeight:900, color:"#1a5b8c", letterSpacing:2, lineHeight:1 }}>SANGi</div>
            <div style={{ fontSize:13, fontWeight:700, color:"#d93838", letterSpacing:4 }}>HOSPITAL</div>
          </div>
        </div>
        <div style={{ textAlign:"right", fontSize:11, color:"#444", lineHeight:1.8 }}>
          <div>Add.: {branch.address}</div><div>Ph.: {branch.phone1}, {branch.phone2}</div>
          <div>Email: {branch.email}</div><div>Web.: www.sangihospital.com</div>
        </div>
      </div>
      <div style={{ textAlign:"center", fontSize:16, fontWeight:900, letterSpacing:2, borderBottom:"1px solid #000", paddingBottom:8, marginBottom:10 }}>ADMISSION NOTE</div>
      <div style={{ display:"flex", gap:24, marginBottom:10, flexWrap:"wrap" }}>
        <div><strong>Name of the Patient: </strong><u>{(patient?.patientName||"—").toUpperCase()}</u></div>
        <div><strong>Age/Sex: </strong><u>{patient?.ageYY||"—"}Y / {(patient?.gender||"—").toUpperCase()}</u></div>
        <div><strong>IPD NO: </strong><u>SH/{discharge?.department?.substring(0,4)?.toUpperCase()||"GEN"}/26/001</u></div>
      </div>
      <div style={{ display:"flex", gap:24, marginBottom:14, flexWrap:"wrap" }}>
        <div><strong>Card No: </strong><u>{patient?.tpaCard||patient?.tpaPanelCardNo||"—"}</u></div>
        <div><strong>WARD/Bed NO: </strong><u>{discharge?.wardName||"—"}</u></div>
        <div><strong>Date: </strong><u>{today} AT {nowTime} HR</u></div>
      </div>
      <table style={{ width:"100%", borderCollapse:"collapse", marginBottom:12 }}>
        <tbody>
          <tr>
            <td style={{ border:"1px solid #000", padding:"10px 12px", width:"50%", verticalAlign:"top" }}>
              <div style={{ fontWeight:900, fontSize:12, marginBottom:6 }}>PRESENT COMPLAINTS-</div>
              <div style={{ fontSize:12, whiteSpace:"pre-wrap", minHeight:60 }}>{data?.presentComplaints||"—"}</div>
              {data?.chiefComplaints&&<><div style={{ fontWeight:700, marginTop:8 }}>C/O-</div><div style={{ whiteSpace:"pre-wrap" }}>{data.chiefComplaints}</div></>}
            </td>
            <td style={{ border:"1px solid #000", padding:"10px 12px", width:"50%", verticalAlign:"top" }}>
              <div style={{ fontWeight:900, fontSize:12, marginBottom:6 }}>INVESTIGATIONS-</div>
              <div style={{ fontSize:12, whiteSpace:"pre-wrap", minHeight:60 }}>{investigationsText||"—"}</div>
            </td>
          </tr>
          <tr>
            <td style={{ border:"1px solid #000", padding:"10px 12px", verticalAlign:"top" }}>
              <div style={{ fontWeight:900, fontSize:12, marginBottom:6 }}>PAST HISTORY-</div>
              <div style={{ fontSize:12, whiteSpace:"pre-wrap", minHeight:40 }}>{[data?.previousDiagnosis,data?.pastSurgeries].filter(Boolean).join("\n")||"—"}</div>
            </td>
            <td style={{ border:"1px solid #000", padding:"10px 12px", verticalAlign:"top" }}>
              <div style={{ fontWeight:900, fontSize:12, marginBottom:6 }}>TREATMENT ADVISED-</div>
              <div style={{ fontSize:12, whiteSpace:"pre-wrap", minHeight:40 }}>{data?.treatmentAdvised||"—"}</div>
            </td>
          </tr>
          <tr>
            <td style={{ border:"1px solid #000", padding:"10px 12px", verticalAlign:"top" }}>
              <div style={{ fontWeight:900, fontSize:12, marginBottom:8 }}>EXAMINATIONS-</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"4px 12px", fontSize:12 }}>
                {[["BP",data?.bp],["PR",data?.pr],["SPO2",data?.spo2],["TEMP",data?.temp]].map(([k,v])=><div key={k}><strong>{k}= </strong>{v||"—"}</div>)}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"4px 12px", fontSize:12, marginTop:6 }}>
                {[["Chest",data?.chest],["CVS",data?.cvs],["CNS",data?.cns],["P/A",data?.pa]].map(([k,v])=><div key={k}><strong>{k}: </strong>{v||"—"}</div>)}
              </div>
            </td>
            <td style={{ border:"1px solid #000", padding:"10px 12px", verticalAlign:"top" }}>
              <div style={{ fontWeight:900, fontSize:12, marginBottom:6 }}>PROVISIONAL DIAGNOSIS-</div>
              <div style={{ fontSize:12, whiteSpace:"pre-wrap", minHeight:40 }}>{data?.provisionalDiagnosis||discharge?.diagnosis||"—"}</div>
            </td>
          </tr>
        </tbody>
      </table>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:40, fontSize:12 }}>
        <div style={{ textAlign:"center", minWidth:160 }}><div style={{ borderTop:"1px solid #000", paddingTop:6, fontWeight:700 }}>Adv.</div><div style={{ color:"#555", marginTop:4 }}>{data?.treatingDoctor||discharge?.doctorName||"—"}</div></div>
        <div style={{ textAlign:"center", minWidth:160 }}><div style={{ borderTop:"1px solid #000", paddingTop:6, fontWeight:700 }}>Consultant</div></div>
        <div style={{ textAlign:"center", minWidth:160 }}><div style={{ borderTop:"1px solid #000", paddingTop:6, fontWeight:700 }}>DOCTOR SIGNATURE</div></div>
      </div>
    </div>
  );
}

export function downloadAdmissionNote(data, patient, discharge, locId) {
  const printWindow = window.open("","_blank","width=900,height=700");
  const branchInfo = {
    "laxmi":{ address:"Lakshmi Nagar, Mathura, Uttar Pradesh - 281004", phone1:"+91-9717444531", phone2:"+91-9717444532", email:"laxminagar@sangihospital.com" },
    "raya": { address:"Raya, Mathura, Uttar Pradesh - 281204", phone1:"+91-9311212090", phone2:"+91-9311212091", email:"info@sangihospital.com" },
  };
  const branch = branchInfo[locId]||branchInfo["laxmi"];
  const today   = new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"2-digit",year:"numeric"});
  const nowTime = new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false});
  const investigationsText = [data?.investigations,data?.investigationsCustom].filter(Boolean).join(", ");
  printWindow.document.write(`<!DOCTYPE html><html><head><title>Admission Note - ${patient?.patientName||""}</title><style>body{font-family:Arial,sans-serif;font-size:12px;color:#000;padding:24px 32px;margin:0}table{width:100%;border-collapse:collapse}td{border:1px solid #000;padding:10px 12px;vertical-align:top;width:50%}.pre{white-space:pre-wrap;min-height:50px}@media print{@page{size:A4;margin:10mm}}</style></head><body><div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:10px"><div style="display:flex;align-items:center;gap:12px"><img src="/sangi-logo.png" onerror="this.src='/logo512.png'" style="width:64px;height:64px;object-fit:contain;border-radius:12px"/><div><div style="font-size:28px;font-weight:900;color:#1a5b8c;letter-spacing:2px;line-height:1">SANGi</div><div style="font-size:13px;font-weight:700;color:#d93838;letter-spacing:4px">HOSPITAL</div></div></div><div style="text-align:right;font-size:11px;color:#444;line-height:1.8"><div>Add.: ${branch.address}</div><div>Ph.: ${branch.phone1}, ${branch.phone2}</div><div>Email: ${branch.email}</div><div>Web.: www.sangihospital.com</div></div></div><div style="text-align:center;font-size:16px;font-weight:900;letter-spacing:2px;border-bottom:1px solid #000;padding-bottom:8px;margin-bottom:10px">ADMISSION NOTE</div><div style="display:flex;gap:24px;margin-bottom:8px;flex-wrap:wrap"><div><strong>Name of the Patient: </strong><u>${(patient?.patientName||"—").toUpperCase()}</u></div><div><strong>Age/Sex: </strong><u>${patient?.ageYY||"—"}Y / ${(patient?.gender||"—").toUpperCase()}</u></div><div><strong>IPD NO: </strong><u>SH/${discharge?.department?.substring(0,4)?.toUpperCase()||"GEN"}/26/001</u></div></div><div style="display:flex;gap:24px;margin-bottom:14px;flex-wrap:wrap"><div><strong>Card No: </strong><u>${patient?.tpaCard||patient?.tpaPanelCardNo||"—"}</u></div><div><strong>WARD/Bed NO: </strong><u>${discharge?.wardName||"—"}</u></div><div><strong>Date: </strong><u>${today} AT ${nowTime} HR</u></div></div><table><tr><td><strong>PRESENT COMPLAINTS-</strong><div class="pre">${data?.presentComplaints||"—"}</div>${data?.chiefComplaints?`<strong>C/O-</strong><div class="pre">${data.chiefComplaints}</div>`:""}</td><td><strong>INVESTIGATIONS-</strong><div class="pre">${investigationsText||"—"}</div></td></tr><tr><td><strong>PAST HISTORY-</strong><div class="pre">${[data?.previousDiagnosis,data?.pastSurgeries].filter(Boolean).join("\n")||"—"}</div></td><td><strong>TREATMENT ADVISED-</strong><div class="pre">${data?.treatmentAdvised||"—"}</div></td></tr><tr><td><strong>EXAMINATIONS-</strong><br/><div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;margin-top:6px"><div><strong>BP= </strong>${data?.bp||"—"}</div><div><strong>Chest: </strong>${data?.chest||"—"}</div><div><strong>PR= </strong>${data?.pr||"—"}</div><div><strong>CVS: </strong>${data?.cvs||"—"}</div><div><strong>SPO2= </strong>${data?.spo2||"—"}</div><div><strong>CNS: </strong>${data?.cns||"—"}</div><div><strong>TEMP= </strong>${data?.temp||"—"}</div><div><strong>P/A: </strong>${data?.pa||"—"}</div></div></td><td><strong>PROVISIONAL DIAGNOSIS-</strong><div class="pre">${data?.provisionalDiagnosis||discharge?.diagnosis||"—"}</div></td></tr></table><div style="display:flex;justify-content:space-between;margin-top:50px"><div style="text-align:center;min-width:160px"><div style="border-top:1px solid #000;padding-top:6px;font-weight:700">Adv.</div><div style="color:#555;margin-top:4px">${data?.treatingDoctor||discharge?.doctorName||"—"}</div></div><div style="text-align:center;min-width:160px"><div style="border-top:1px solid #000;padding-top:6px;font-weight:700">Consultant</div></div><div style="text-align:center;min-width:160px"><div style="border-top:1px solid #000;padding-top:6px;font-weight:700">DOCTOR SIGNATURE</div></div></div><script>window.onload=()=>{window.print();}<\/script></body></html>`);
  printWindow.document.close();
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MedicalHistoryPage({ data, setData, onSave, onSkip, patient, discharge, locId }) {
  const set = k => e => setData(p => ({ ...p, [k]: e.target.value }));
  const isFilled = data.presentComplaints || data.previousDiagnosis || data.provisionalDiagnosis;

  const [showReports, setShowReports] = useState(false);
  const [reportData,  setReportData]  = useState({});

  // Derive which report forms are needed from the selected investigation chips
  const selectedTests = data.investigations
    ? data.investigations.split(", ").reduce((acc, t) => { if (t.trim()) acc[t.trim()] = true; return acc; }, {})
    : {};
  const reportKeys   = getReportKeys(selectedTests);
  const savedCount   = Object.keys(reportData).length;
  const allSaved     = reportKeys.length > 0 && savedCount >= reportKeys.length;

  return (
    <div style={{ padding:"32px 44px 80px", animation:"fadeUp .3s ease both", fontFamily:"DM Sans,sans-serif" }}>

      {/* ── Report Modal (portal-style fixed overlay) ── */}
      {showReports && reportKeys.length > 0 && (
        <ReportModal
          reportKeys={reportKeys}
          reportData={reportData}
          setReportData={setReportData}
          onClose={() => setShowReports(false)}
        />
      )}

      {/* ── Page header ── */}
      <div style={{ marginBottom:28 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
          <div>
            <h1 style={{ fontFamily:"DM Serif Display,serif", fontSize:26, color:T.primary, marginBottom:5 }}>Medical History</h1>
            <p style={{ fontSize:14, color:T.textMuted }}>Record admission note — complaints, examinations and treatment</p>
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <div style={{ padding:"6px 14px", borderRadius:20, background:isFilled?T.greenTint:T.amberTint, border:`1px solid ${isFilled?T.greenBorder:"#FDE68A"}`, fontSize:12, fontWeight:600, color:isFilled?T.green:T.amber }}>
              {isFilled ? "✓ History Added" : "⚠ Not Filled"}
            </div>
          </div>
        </div>
      </div>

      {/* ── Present Complaints ── */}
      <Section title="Present Complaints" subtitle="Chief complaints and presenting symptoms" icon={IC.pulse}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
          <Txta label="Present Complaints" req placeholder="Patient presented in Department of Emergency Medicine..." value={data.presentComplaints||""} onChange={set("presentComplaints")} rows={4}/>
          <Txta label="C/O (Chief Complaints)" placeholder="Severe pain at Rt. Iliac fossa, fever with chills..." value={data.chiefComplaints||""} onChange={set("chiefComplaints")} rows={4}/>
        </div>
      </Section>

      {/* ── Examinations ── */}
      <Section title="Examinations" subtitle="Vitals and clinical examination findings" icon={IC.pulse}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:16 }}>
          <Inp label="BP (mmHg)"  placeholder="e.g. 120/80mmHg" value={data.bp||""}    onChange={set("bp")}/>
          <Inp label="PR (/min)"  placeholder="e.g. 82/min"     value={data.pr||""}    onChange={set("pr")}/>
          <Inp label="SPO2"       placeholder="e.g. 98% On RA"  value={data.spo2||""}  onChange={set("spo2")}/>
          <Inp label="TEMP"       placeholder="e.g. 98.6°F"     value={data.temp||""}  onChange={set("temp")}/>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
          <Inp label="Chest" placeholder="e.g. B/L Crepts+" value={data.chest||""} onChange={set("chest")}/>
          <Inp label="CVS"   placeholder="e.g. S1 S2 +"     value={data.cvs||""}  onChange={set("cvs")}/>
          <Inp label="CNS"   placeholder="e.g. Conscious"   value={data.cns||""}  onChange={set("cns")}/>
          <Inp label="P/A"   placeholder="e.g. Distended"   value={data.pa||""}   onChange={set("pa")}/>
        </div>
      </Section>

      {/* ── Investigations & Diagnosis ── */}
      <Section title="Investigations & Diagnosis" subtitle="Tests ordered and provisional diagnosis" icon={IC.file}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>

          {/* LEFT */}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <Field label="Investigations">
              <InvestigationsDropdown value={data.investigations||""} onChange={set("investigations")}/>
            </Field>

            <Txta label="Additional / Custom Tests" placeholder="Any other tests not listed above..." value={data.investigationsCustom||""} onChange={set("investigationsCustom")} rows={2}/>

            {/* ── CTA: Enter Report Values ── */}
            {reportKeys.length > 0 && (
              <button
                onClick={() => setShowReports(true)}
                style={{
                  padding:"13px 18px", borderRadius:12, border:"none", cursor:"pointer",
                  background: allSaved
                    ? "linear-gradient(135deg,#059669,#047857)"
                    : "linear-gradient(135deg,#0f172a,#1e3a5f)",
                  color:"#fff", fontFamily:"DM Sans,sans-serif",
                  display:"flex", alignItems:"center", gap:12,
                  boxShadow: allSaved
                    ? "0 4px 16px rgba(5,150,105,.28)"
                    : "0 4px 16px rgba(15,23,42,.22)",
                  transition:"all .2s",
                }}
              >
                <div style={{ width:40, height:40, borderRadius:10, background:"rgba(255,255,255,.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>📋</div>
                <div style={{ flex:1, textAlign:"left" }}>
                  <div style={{ fontSize:14, fontWeight:700 }}>
                    {allSaved ? "Reports Completed" : "Enter Lab Report Values"}
                  </div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,.65)", marginTop:1 }}>
                    {reportKeys.length} report form{reportKeys.length>1?"s":""}
                    {savedCount > 0 ? ` · ${savedCount}/${reportKeys.length} saved` : " · Not filled yet"}
                  </div>
                </div>
                <div style={{ flexShrink:0 }}>
                  {allSaved
                    ? <span style={{ fontSize:20 }}>✅</span>
                    : <div style={{ background:"rgba(255,255,255,.14)", borderRadius:8, padding:"4px 12px", fontSize:12, fontWeight:600 }}>
                        {savedCount > 0 ? "Edit →" : "Start →"}
                      </div>
                  }
                </div>
              </button>
            )}
          </div>

          {/* RIGHT */}
          <Txta label="Provisional Diagnosis" req placeholder="Acute Retention of Urine with ?UTI..." value={data.provisionalDiagnosis||""} onChange={set("provisionalDiagnosis")} rows={6}/>
        </div>
      </Section>

      {/* ── Treatment & Past History ── */}
      <Section title="Treatment & Past History" subtitle="Treatment advised and past medical history" icon={IC.wallet}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
          <Txta label="Treatment Advised" req placeholder="IV Fluids NS/RL @ 100ml/hr, Inj. Esomac 40mg IV BD..." value={data.treatmentAdvised||""} onChange={set("treatmentAdvised")} rows={5}/>
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <Txta label="Past History / Previous Diagnosis" placeholder="Diabetes, Hypertension, previous surgeries..." value={data.previousDiagnosis||""} onChange={set("previousDiagnosis")} rows={2}/>
            <Txta label="Past Surgeries" placeholder="e.g. Appendectomy 2018..." value={data.pastSurgeries||""} onChange={set("pastSurgeries")} rows={2}/>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
          <Txta label="Current Medications" placeholder="e.g. Metformin 500mg, Amlodipine 5mg..." value={data.currentMedications||""} onChange={set("currentMedications")} rows={2}/>
          <Txta label="Known Allergies"    placeholder="e.g. Penicillin, Sulfa drugs..."         value={data.knownAllergies||""}    onChange={set("knownAllergies")} rows={2}/>
        </div>
      </Section>

      {/* ── Doctor ── */}
      <Section title="Treating Doctor & Notes" subtitle="Doctor details and additional clinical notes" icon={IC.doctor}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
          <Inp label="Treating Doctor"        placeholder="Dr. Full Name & Speciality"            value={data.treatingDoctor||""} onChange={set("treatingDoctor")}/>
          <Inp label="Qualification & Reg. No." placeholder="MBBS (Mp), DNB (Urology), No. 35942" value={data.doctorQual||""}    onChange={set("doctorQual")}/>
          <div style={{ gridColumn:"span 2" }}>
            <Txta label="Additional Notes / Remarks" placeholder="Any other relevant clinical information..." value={data.notes||""} onChange={set("notes")} rows={2}/>
          </div>
        </div>
      </Section>

      {/* ── Action buttons ── */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginTop:8, justifyContent:"space-between" }}>
        <button onClick={onSkip} style={{ padding:"11px 26px", borderRadius:10, border:`1.5px solid ${T.border}`, background:T.white, color:T.textMid, fontFamily:"DM Sans,sans-serif", fontSize:14, fontWeight:600, cursor:"pointer" }}>
          Skip for now →
        </button>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={() => downloadAdmissionNote(data, patient, discharge, locId)}
            style={{ padding:"11px 26px", borderRadius:10, border:`1.5px solid ${T.accentDeep}`, background:T.white, color:T.accentDeep, fontFamily:"DM Sans,sans-serif", fontSize:14, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
            🖨 Preview Admission Note
          </button>
          <button onClick={onSave}
            style={{ padding:"11px 26px", borderRadius:10, border:"none", background:`linear-gradient(135deg,${T.accentDeep},${T.primary})`, color:"#fff", fontFamily:"DM Sans,sans-serif", fontSize:14, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:8, boxShadow:"0 4px 16px rgba(14,165,233,.32)" }}>
            <Ico d={IC.check} size={15} sw={2.5}/> Save & Continue →
          </button>
        </div>
      </div>
    </div>
  );
}