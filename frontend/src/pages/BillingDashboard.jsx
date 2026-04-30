import { useState, useMemo } from "react";

const CURRENT_USER = { name: "Priya Sharma", empId: "EMP-2041", role: "Billing Staff" };

const INSURANCE_TYPES = ["ECHS", "ECI", "FCI", "Ayushman Bharat", "Northern Railways", "TPA", "Cash"];
const TPA_DOCS = [
  { id: "final_bill",        label: "Final Bill",          ico: "🧾" },
  { id: "prescription",      label: "Prescription",        ico: "📝" },
  { id: "pharmacy_bill",     label: "Pharmacy Bill",       ico: "💊" },
  { id: "pathology_bill",    label: "Pathology Bill",      ico: "🔬" },
  { id: "radiology_bill",    label: "Radiology Bill",      ico: "🩻" },
  { id: "discharge_summary", label: "Discharge Summary",   ico: "📋" },
  { id: "reports",           label: "Reports",             ico: "🗂️" },
  { id: "admission_note",    label: "Admission Note",      ico: "🩺" },
];

const LAB_REPORT_TYPES   = ["Pathology","Biochemistry","Haematology","Microbiology","Serology","Histopathology","Other"];
const RADIO_REPORT_TYPES = ["X-Ray","CT Scan","MRI","Ultrasound (USG)","Doppler","PET Scan","Mammography","Fluoroscopy","Echo","Other"];

const MOCK_PATIENTS = [
  {
    uhid:"LNM-0041",admNo:"ADM/2026/041",branch:"Laxmi Nagar Branch",
    patientName:"Rajan Sharma",age:54,gender:"Male",
    phone:"9876543210",doa:"2026-04-10T09:00",dod:"2026-04-16T12:00",expectedDod:"2026-04-17T00:00",
    ward:"General",bed:"G-12",doctor:"Dr. Meena Kapoor",
    diagnosis:"Type-2 Diabetes",status:"discharged",taskStatus:"pending",
    insuranceType:"ECHS",tpaInfo:{tpaName:"",policyNo:"",claimNo:"",authNo:""},
    saved:{discharge:false,admission:false,prescription:false,pathology:false,reports:false,medicines:false,billing:false},
    discharge:{doa:"2026-04-10T09:00",dod:"2026-04-16T12:00",expectedDod:"2026-04-17T00:00",ward:"General",bed:"G-12",doctor:"Dr. Meena Kapoor",diagnosis:"Type-2 Diabetes",condition:"Stable",instructions:"Low sugar diet, follow up in 2 weeks",notes:""},
    medicalHistory:{previousDiagnosis:"Hypertension",pastSurgeries:"Appendectomy 2010",currentMedications:"Metformin 500mg",treatingDoctor:"Dr. Meena Kapoor",knownAllergies:"Penicillin",chronicConditions:"Diabetes, Hypertension",familyHistory:"Father had diabetes",smokingStatus:"Non-smoker",alcoholUse:"Occasional",notes:"Patient cooperative"},
    services:[
      {id:1,name:"Room Charges",category:"Ward",qty:6,rate:800,amount:4800},
      {id:2,name:"Doctor Visit",category:"Consultation",qty:3,rate:500,amount:1500},
      {id:3,name:"IV Fluids",category:"Pharmacy",qty:4,rate:120,amount:480},
    ],
    prescription:[
      {id:1,medicine:"Metformin 500mg",dosage:"1-0-1",duration:"30 days",instructions:"After meals"},
      {id:2,medicine:"Amlodipine 5mg",dosage:"0-0-1",duration:"30 days",instructions:"At bedtime"},
    ],
    labReports:[
      {id:1,reportName:"Complete Blood Count (CBC)",reportType:"Pathology",reportCategory:"lab",date:"2026-04-11",orderedBy:"Dr. Meena Kapoor",amount:350,remarks:"Mild anaemia noted.",
       tests:[
         {id:1,name:"Haemoglobin",value:"11.2",unit:"g/dL",refRange:"13.0 - 17.0",status:"Low"},
         {id:2,name:"Total WBC",value:"8400",unit:"/uL",refRange:"4000 - 11000",status:"Normal"},
         {id:3,name:"Platelets",value:"210000",unit:"/uL",refRange:"150000 - 400000",status:"Normal"},
       ]},
      {id:2,reportName:"Chest X-Ray",reportType:"X-Ray",reportCategory:"radiology",date:"2026-04-11",orderedBy:"Dr. Meena Kapoor",amount:600,remarks:"No active consolidation.",
       modalityDetails:{modality:"X-Ray",bodyPart:"Chest",view:"PA",contrast:"No",findings:"Clear lung fields, normal heart size",impression:"Normal chest X-Ray"},
       tests:[
         {id:1,name:"Lung Fields",value:"Clear",unit:"--",refRange:"Clear",status:"Normal"},
         {id:2,name:"Heart Size",value:"Normal",unit:"--",refRange:"Normal",status:"Normal"},
       ]},
    ],
    medicalBill:[
      {id:1,item:"Metformin 500mg x30",date:"2026-04-10",amount:180},
      {id:2,item:"Normal Saline 500ml x4",date:"2026-04-11",amount:200},
    ],
    billing:{discount:500,advance:2000,paymentMode:"Cash",insuranceType:"ECHS",remarks:""},
    tpaDocStatus:{final_bill:false,prescription:false,pharmacy_bill:false,pathology_bill:false,radiology_bill:false,discharge_summary:false,reports:false,admission_note:false},
  },
  {
    uhid:"LNM-0042",admNo:"ADM/2026/042",branch:"Laxmi Nagar Branch",
    patientName:"Sunita Verma",age:38,gender:"Female",
    phone:"9123456780",doa:"2026-04-13T11:30",dod:"",expectedDod:"2026-04-24T11:00",
    ward:"Private",bed:"P-03",doctor:"Dr. Arvind Singh",
    diagnosis:"Viral Fever",status:"admitted",taskStatus:"pending",
    insuranceType:"TPA",tpaInfo:{tpaName:"Star Health TPA",policyNo:"SH2026/4421",claimNo:"CLM-0042",authNo:"AUTH-8812"},
    saved:{discharge:false,admission:false,prescription:false,pathology:false,reports:false,medicines:false,billing:false},
    discharge:{doa:"2026-04-13T11:30",dod:"",expectedDod:"2026-04-24T11:00",ward:"Private",bed:"P-03",doctor:"Dr. Arvind Singh",diagnosis:"Viral Fever",condition:"",instructions:"",notes:""},
    medicalHistory:{previousDiagnosis:"None",pastSurgeries:"None",currentMedications:"Paracetamol",treatingDoctor:"Dr. Arvind Singh",knownAllergies:"None",chronicConditions:"None",familyHistory:"None",smokingStatus:"Non-smoker",alcoholUse:"None",notes:""},
    services:[
      {id:1,name:"Room Charges",category:"Ward",qty:3,rate:2000,amount:6000},
      {id:2,name:"Doctor Visit",category:"Consultation",qty:2,rate:800,amount:1600},
    ],
    prescription:[{id:1,medicine:"Paracetamol 500mg",dosage:"1-1-1",duration:"5 days",instructions:"With water"}],
    labReports:[
      {id:1,reportName:"Complete Blood Count (CBC)",reportType:"Pathology",reportCategory:"lab",date:"2026-04-13",orderedBy:"Dr. Arvind Singh",amount:250,remarks:"Leukocytosis with neutrophilia.",
       tests:[
         {id:1,name:"Haemoglobin",value:"12.8",unit:"g/dL",refRange:"12.0 - 16.0",status:"Normal"},
         {id:2,name:"Total WBC",value:"13200",unit:"/uL",refRange:"4000 - 11000",status:"High"},
       ]},
      {id:2,reportName:"USG Abdomen",reportType:"Ultrasound (USG)",reportCategory:"radiology",date:"2026-04-14",orderedBy:"Dr. Arvind Singh",amount:800,remarks:"No significant findings.",
       modalityDetails:{modality:"Ultrasound",bodyPart:"Abdomen",view:"--",contrast:"No",findings:"Normal hepatic echotexture",impression:"No acute pathology"},
       tests:[
         {id:1,name:"Liver",value:"Normal",unit:"--",refRange:"Normal",status:"Normal"},
         {id:2,name:"Spleen",value:"Normal",unit:"--",refRange:"Normal",status:"Normal"},
       ]},
    ],
    medicalBill:[{id:1,item:"Paracetamol 500mg x20",date:"2026-04-13",amount:80}],
    billing:{discount:0,advance:5000,paymentMode:"UPI",insuranceType:"TPA",remarks:"TPA pre-auth pending"},
    tpaDocStatus:{final_bill:false,prescription:false,pharmacy_bill:false,pathology_bill:false,radiology_bill:false,discharge_summary:false,reports:false,admission_note:false},
  },
  {
    uhid:"LNM-0039",admNo:"ADM/2026/039",branch:"Laxmi Nagar Branch",
    patientName:"Mohd. Akhtar",age:62,gender:"Male",
    phone:"9988776655",doa:"2026-04-08T08:00",dod:"2026-04-15T10:00",expectedDod:"2026-04-15T00:00",
    ward:"ICU",bed:"ICU-2",doctor:"Dr. Priya Nair",
    diagnosis:"Cardiac Arrest",status:"discharged",taskStatus:"completed",
    insuranceType:"Northern Railways",tpaInfo:{tpaName:"",policyNo:"NR/2026/0391",claimNo:"CLM-NR-039",authNo:""},
    saved:{discharge:true,admission:true,prescription:true,pathology:true,reports:true,medicines:true,billing:true},
    discharge:{doa:"2026-04-08T08:00",dod:"2026-04-15T10:00",expectedDod:"2026-04-15T00:00",ward:"ICU",bed:"ICU-2",doctor:"Dr. Priya Nair",diagnosis:"Cardiac Arrest",condition:"Recovering",instructions:"Strict bed rest, cardiac diet",notes:"Follow up in 1 week"},
    medicalHistory:{previousDiagnosis:"Angina",pastSurgeries:"Angioplasty 2018",currentMedications:"Aspirin, Statins",treatingDoctor:"Dr. Priya Nair",knownAllergies:"None",chronicConditions:"Heart Disease",familyHistory:"Father had MI",smokingStatus:"Ex-smoker",alcoholUse:"None",notes:"High risk patient"},
    services:[
      {id:1,name:"ICU Charges",category:"Ward",qty:7,rate:5000,amount:35000},
      {id:2,name:"Cardiology Consult",category:"Consultation",qty:5,rate:1200,amount:6000},
      {id:3,name:"ECG",category:"Procedure",qty:3,rate:300,amount:900},
    ],
    prescription:[
      {id:1,medicine:"Aspirin 75mg",dosage:"1-0-0",duration:"Lifelong",instructions:"After breakfast"},
      {id:2,medicine:"Atorvastatin 20mg",dosage:"0-0-1",duration:"Lifelong",instructions:"At bedtime"},
    ],
    labReports:[
      {id:1,reportName:"Cardiac Markers Panel",reportType:"Biochemistry",reportCategory:"lab",date:"2026-04-08",orderedBy:"Dr. Priya Nair",amount:1800,remarks:"Markedly elevated cardiac markers.",
       tests:[
         {id:1,name:"Troponin I",value:"4.8",unit:"ng/mL",refRange:"< 0.04",status:"High"},
         {id:2,name:"CK-MB",value:"68",unit:"U/L",refRange:"< 25",status:"High"},
       ]},
      {id:2,reportName:"2D Echo",reportType:"Echo",reportCategory:"radiology",date:"2026-04-09",orderedBy:"Dr. Priya Nair",amount:2200,remarks:"EF 35%. Moderate LV dysfunction.",
       modalityDetails:{modality:"Echo",bodyPart:"Heart",view:"Parasternal",contrast:"No",findings:"EF 35%, moderate LV dysfunction",impression:"Moderate systolic dysfunction"},
       tests:[{id:1,name:"Ejection Fraction",value:"35",unit:"%",refRange:"55 - 70",status:"Low"}]},
    ],
    medicalBill:[
      {id:1,item:"Aspirin 75mg x30",date:"2026-04-08",amount:60},
      {id:2,item:"Atorvastatin 20mg x30",date:"2026-04-08",amount:180},
      {id:3,item:"Heparin injection x5",date:"2026-04-09",amount:750},
    ],
    billing:{discount:2000,advance:20000,paymentMode:"Insurance",insuranceType:"Northern Railways",remarks:"Insurance claim filed"},
    tpaDocStatus:{final_bill:true,prescription:true,pharmacy_bill:true,pathology_bill:true,radiology_bill:true,discharge_summary:true,reports:true,admission_note:true},
  },
  {
    uhid:"RYA-0044",admNo:"ADM/2026/044",branch:"Raya Branch",
    patientName:"Kavita Joshi",age:45,gender:"Female",
    phone:"9871234560",doa:"2026-04-18T14:00",dod:"",expectedDod:"2026-04-25T14:00",
    ward:"Semi-Private",bed:"SP-07",doctor:"Dr. Rahul Gupta",
    diagnosis:"Acute Appendicitis",status:"admitted",taskStatus:"pending",
    insuranceType:"Ayushman Bharat",tpaInfo:{tpaName:"",policyNo:"AB/2026/KJ44",claimNo:"",authNo:"AB-AUTH-7721"},
    saved:{discharge:false,admission:false,reports:false,medicines:false,billing:false},
    discharge:{doa:"2026-04-18T14:00",dod:"",expectedDod:"2026-04-25T14:00",ward:"Semi-Private",bed:"SP-07",doctor:"Dr. Rahul Gupta",diagnosis:"Acute Appendicitis",condition:"",instructions:"",notes:""},
    medicalHistory:{previousDiagnosis:"GERD",pastSurgeries:"None",currentMedications:"Pantoprazole",treatingDoctor:"Dr. Rahul Gupta",knownAllergies:"Sulfa drugs",chronicConditions:"GERD",familyHistory:"None",smokingStatus:"Non-smoker",alcoholUse:"None",notes:""},
    services:[
      {id:1,name:"Room Charges",category:"Ward",qty:4,rate:1500,amount:6000},
      {id:2,name:"Surgery Charges",category:"Procedure",qty:1,rate:25000,amount:25000},
      {id:3,name:"Anaesthesia",category:"Procedure",qty:1,rate:8000,amount:8000},
    ],
    prescription:[{id:1,medicine:"Cefuroxime 500mg",dosage:"1-0-1",duration:"7 days",instructions:"After meals"}],
    labReports:[
      {id:1,reportName:"Pre-Op Panel",reportType:"Pathology",reportCategory:"lab",date:"2026-04-18",orderedBy:"Dr. Rahul Gupta",amount:1800,remarks:"Leukocytosis + raised CRP.",
       tests:[
         {id:1,name:"Haemoglobin",value:"13.1",unit:"g/dL",refRange:"12.0 - 16.0",status:"Normal"},
         {id:2,name:"Total WBC",value:"14800",unit:"/uL",refRange:"4000 - 11000",status:"High"},
         {id:3,name:"CRP",value:"48",unit:"mg/L",refRange:"< 5",status:"High"},
       ]},
      {id:2,reportName:"CT Abdomen",reportType:"CT Scan",reportCategory:"radiology",date:"2026-04-18",orderedBy:"Dr. Rahul Gupta",amount:3500,remarks:"Thickened appendix with periappendiceal fat stranding.",
       modalityDetails:{modality:"CT Scan",bodyPart:"Abdomen & Pelvis",view:"Axial + Coronal",contrast:"IV Contrast",findings:"Appendix diameter 11mm, periappendiceal fat stranding, no perforation",impression:"Acute appendicitis without perforation"},
       tests:[
         {id:1,name:"Appendix Diameter",value:"11",unit:"mm",refRange:"< 6",status:"High"},
         {id:2,name:"Periappendiceal Stranding",value:"Present",unit:"--",refRange:"Absent",status:"High"},
       ]},
    ],
    medicalBill:[
      {id:1,item:"IV Antibiotics x5 days",date:"2026-04-18",amount:1800},
      {id:2,item:"Post-op medications",date:"2026-04-19",amount:650},
    ],
    billing:{discount:0,advance:15000,paymentMode:"Card",insuranceType:"Ayushman Bharat",remarks:"Ayushman pre-auth approved"},
    tpaDocStatus:{final_bill:false,prescription:false,pharmacy_bill:false,pathology_bill:false,radiology_bill:false,discharge_summary:false,reports:false,admission_note:false},
  },
  {
    uhid:"LNM-0045",admNo:"ADM/2026/045",branch:"Laxmi Nagar Branch",
    patientName:"Deepak Rawat",age:35,gender:"Male",
    phone:"9654321870",doa:"2026-04-20T10:00",dod:"",expectedDod:"2026-04-27T10:00",
    ward:"General",bed:"G-08",doctor:"Dr. Sunil Mehta",
    diagnosis:"Typhoid Fever",status:"admitted",taskStatus:"pending",
    insuranceType:"FCI",tpaInfo:{tpaName:"",policyNo:"FCI/2026/DR45",claimNo:"",authNo:""},
    saved:{discharge:false,admission:false,prescription:false,pathology:false,reports:false,medicines:false,billing:false},
    discharge:{doa:"2026-04-20T10:00",dod:"",expectedDod:"2026-04-27T10:00",ward:"General",bed:"G-08",doctor:"Dr. Sunil Mehta",diagnosis:"Typhoid Fever",condition:"",instructions:"",notes:""},
    medicalHistory:{previousDiagnosis:"None",pastSurgeries:"None",currentMedications:"None",treatingDoctor:"Dr. Sunil Mehta",knownAllergies:"None",chronicConditions:"None",familyHistory:"None",smokingStatus:"Non-smoker",alcoholUse:"Occasional",notes:""},
    services:[
      {id:1,name:"Room Charges",category:"Ward",qty:3,rate:800,amount:2400},
      {id:2,name:"Doctor Visit",category:"Consultation",qty:3,rate:500,amount:1500},
    ],
    prescription:[{id:1,medicine:"Ceftriaxone 1g IV",dosage:"0-0-1",duration:"7 days",instructions:"Slow IV push"}],
    labReports:[
      {id:1,reportName:"Typhidot / Widal",reportType:"Serology",reportCategory:"lab",date:"2026-04-20",orderedBy:"Dr. Sunil Mehta",amount:400,remarks:"Typhidot IgM positive.",
       tests:[
         {id:1,name:"Typhidot IgM",value:"Positive",unit:"--",refRange:"Negative",status:"High"},
         {id:2,name:"Widal O",value:"1:160",unit:"titre",refRange:"< 1:80",status:"High"},
       ]},
    ],
    medicalBill:[{id:1,item:"Ceftriaxone 1g x7",date:"2026-04-20",amount:350}],
    billing:{discount:0,advance:3000,paymentMode:"Cash",insuranceType:"FCI",remarks:"FCI coverage pending verification"},
    tpaDocStatus:{final_bill:false,prescription:false,pharmacy_bill:false,pathology_bill:false,radiology_bill:false,discharge_summary:false,reports:false,admission_note:false},
  },
  {
    uhid:"RYA-0046",admNo:"ADM/2026/046",branch:"Raya Branch",
    patientName:"Anita Bhatnagar",age:58,gender:"Female",
    phone:"9312456780",doa:"2026-04-21T08:30",dod:"",expectedDod:"2026-04-28T08:30",
    ward:"Private",bed:"P-11",doctor:"Dr. Rekha Sinha",
    diagnosis:"Knee Replacement",status:"admitted",taskStatus:"pending",
    insuranceType:"ECI",tpaInfo:{tpaName:"",policyNo:"ECI/2026/AB46",claimNo:"CLM-ECI-046",authNo:"ECI-AUTH-4421"},
    saved:{discharge:false,admission:false,prescription:false,pathology:false,reports:false,medicines:false,billing:false},
    discharge:{doa:"2026-04-21T08:30",dod:"",expectedDod:"2026-04-28T08:30",ward:"Private",bed:"P-11",doctor:"Dr. Rekha Sinha",diagnosis:"Knee Replacement",condition:"",instructions:"",notes:""},
    medicalHistory:{previousDiagnosis:"Osteoarthritis",pastSurgeries:"None",currentMedications:"Diclofenac, Calcium",treatingDoctor:"Dr. Rekha Sinha",knownAllergies:"NSAIDs",chronicConditions:"Osteoarthritis, Hypertension",familyHistory:"None",smokingStatus:"Non-smoker",alcoholUse:"None",notes:"High-value surgical case"},
    services:[
      {id:1,name:"Room Charges",category:"Ward",qty:5,rate:3000,amount:15000},
      {id:2,name:"Ortho Surgery",category:"Procedure",qty:1,rate:80000,amount:80000},
      {id:3,name:"Implant - Knee Prosthesis",category:"Implant",qty:1,rate:120000,amount:120000},
      {id:4,name:"Anaesthesia",category:"Procedure",qty:1,rate:12000,amount:12000},
    ],
    prescription:[
      {id:1,medicine:"Enoxaparin 40mg",dosage:"0-0-1",duration:"10 days",instructions:"Subcutaneous injection"},
      {id:2,medicine:"Tramadol 50mg",dosage:"1-1-1",duration:"5 days",instructions:"For pain, with food"},
    ],
    labReports:[
      {id:1,reportName:"Pre-Op Workup",reportType:"Haematology",reportCategory:"lab",date:"2026-04-21",orderedBy:"Dr. Rekha Sinha",amount:1200,remarks:"Within normal limits for surgery.",
       tests:[
         {id:1,name:"PT/INR",value:"1.1",unit:"ratio",refRange:"0.8 - 1.2",status:"Normal"},
         {id:2,name:"aPTT",value:"32",unit:"sec",refRange:"25 - 35",status:"Normal"},
       ]},
      {id:2,reportName:"MRI Right Knee",reportType:"MRI",reportCategory:"radiology",date:"2026-04-19",orderedBy:"Dr. Rekha Sinha",amount:5500,remarks:"Severe tricompartmental osteoarthritis. Medial meniscal tear.",
       modalityDetails:{modality:"MRI",bodyPart:"Right Knee",view:"Sagittal + Coronal + Axial",contrast:"No",findings:"Severe tricompartmental OA, medial meniscal tear, grade 4 chondral loss",impression:"Severe OA - surgical candidate"},
       tests:[
         {id:1,name:"Medial Meniscus",value:"Torn",unit:"--",refRange:"Intact",status:"High"},
         {id:2,name:"Articular Cartilage",value:"Grade 4",unit:"--",refRange:"Grade 0-1",status:"High"},
       ]},
    ],
    medicalBill:[
      {id:1,item:"Enoxaparin 40mg x10",date:"2026-04-21",amount:1200},
      {id:2,item:"Surgical consumables",date:"2026-04-21",amount:4500},
    ],
    billing:{discount:5000,advance:50000,paymentMode:"Insurance",insuranceType:"ECI",remarks:"ECI pre-auth approved INR 2.5L"},
    tpaDocStatus:{final_bill:false,prescription:false,pharmacy_bill:false,pathology_bill:false,radiology_bill:false,discharge_summary:false,reports:false,admission_note:false},
  },
];

const fmt = (n) => "₹" + Number(n||0).toLocaleString("en-IN");
const fmtDt = (d) => d ? new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "—";
const fmtDtShort = (d) => d ? new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short"}) : "—";

function calcTotals(svcs, labReports, med, billing) {
  const s = svcs.reduce((a,r)=>a+Number(r.amount||0),0);
  const labTotal = labReports.filter(r=>r.reportCategory==="lab").reduce((a,r)=>a+Number(r.amount||0),0);
  const radioTotal = labReports.filter(r=>r.reportCategory==="radiology").reduce((a,r)=>a+Number(r.amount||0),0);
  const m = med.reduce((a,r)=>a+Number(r.amount||0),0);
  const gross = s + labTotal + radioTotal + m;
  const disc = Number(billing?.discount||0);
  const adv  = Number(billing?.advance||0);
  return { s, labTotal, radioTotal, m, gross, disc, adv, net: gross-disc, due: gross-disc-adv };
}

const SECTION_KEYS   = ["discharge","admission","prescription","reports","medicines","billing"];
const SECTION_LABELS = {discharge:"Discharge Summary",admission:"Admission Note",prescription:"Prescription",reports:"Reports",medicines:"Pharmacy Bill",billing:"Final Bill"};

const emptyLabReport = () => ({id:Date.now(),reportName:"",reportType:"Pathology",reportCategory:"lab",date:new Date().toISOString().slice(0,10),orderedBy:"",amount:0,remarks:"",tests:[{id:Date.now(),name:"",value:"",unit:"",refRange:"",status:"Normal"}]});
const emptyRadioReport = () => ({id:Date.now(),reportName:"",reportType:"X-Ray",reportCategory:"radiology",date:new Date().toISOString().slice(0,10),orderedBy:"",amount:0,remarks:"",modalityDetails:{modality:"X-Ray",bodyPart:"",view:"",contrast:"No",findings:"",impression:""},tests:[{id:Date.now(),name:"",value:"",unit:"",refRange:"",status:"Normal"}]});

let _tid = 0;

const INS_CONFIG = {
  "ECHS":            { color:"#1d4ed8", bg:"#eff6ff", border:"#bfdbfe" },
  "ECI":             { color:"#0e7490", bg:"#ecfeff", border:"#a5f3fc" },
  "FCI":             { color:"#0f766e", bg:"#f0fdfa", border:"#99f6e4" },
  "Ayushman Bharat": { color:"#15803d", bg:"#f0fdf4", border:"#bbf7d0" },
  "Northern Railways":{ color:"#7c3aed", bg:"#faf5ff", border:"#ddd6fe" },
  "TPA":             { color:"#b45309", bg:"#fffbeb", border:"#fde68a" },
  "Cash":            { color:"#374151", bg:"#f9fafb", border:"#e5e7eb" },
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --primary: #0a4d68;
  --primary-mid: #0d6b91;
  --primary-light: #1a8ab0;
  --accent: #00b4d8;
  --accent2: #90e0ef;
  --bg: #f4f7fa;
  --bg2: #eaf1f8;
  --surface: #ffffff;
  --border: #dde6ef;
  --border2: #c4d7e8;
  --text: #0d2136;
  --text2: #2c4a63;
  --text3: #6b8aa3;
  --text4: #9ab0c2;
  --success: #0d7a4e;
  --success-bg: #ecfdf5;
  --success-border: #a7f3d0;
  --warning: #92400e;
  --warning-bg: #fffbeb;
  --warning-border: #fde68a;
  --danger: #991b1b;
  --danger-bg: #fef2f2;
  --danger-border: #fecaca;
  --purple: #5b21b6;
  --purple-bg: #f5f3ff;
  --purple-border: #ddd6fe;
  --radius: 8px;
  --radius-lg: 12px;
  --shadow: 0 1px 3px rgba(10,77,104,.08), 0 4px 12px rgba(10,77,104,.06);
  --shadow-lg: 0 4px 16px rgba(10,77,104,.12), 0 12px 40px rgba(10,77,104,.10);
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

.app { display: flex; flex-direction: column; min-height: 100vh; }
.layout { display: flex; flex: 1; overflow: hidden; }
.main-scroll { flex: 1; overflow-y: auto; padding: 28px 32px 48px; background: var(--bg); }

/* ── TOPBAR ── */
.topbar {
  height: 58px;
  background: var(--primary);
  display: flex;
  align-items: center;
  padding: 0 24px;
  justify-content: space-between;
  position: sticky; top: 0; z-index: 300;
  box-shadow: 0 2px 8px rgba(10,77,104,.25);
}
.topbar-left { display: flex; align-items: center; gap: 14px; }
.logo-mark {
  width: 34px; height: 34px; border-radius: 8px;
  background: rgba(255,255,255,.15);
  border: 1px solid rgba(255,255,255,.2);
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; color: #fff; font-weight: 700;
  flex-shrink: 0;
}
.brand-name { font-size: 15px; font-weight: 700; color: #fff; letter-spacing: -.01em; }
.brand-sub { font-size: 11px; color: rgba(255,255,255,.45); letter-spacing: .06em; text-transform: uppercase; margin-top: 1px; }
.topbar-divider { width: 1px; height: 28px; background: rgba(255,255,255,.15); margin: 0 4px; }
.topbar-right { display: flex; align-items: center; gap: 12px; }
.user-pill {
  display: flex; align-items: center; gap: 10px;
  padding: 5px 12px 5px 5px;
  background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 100px;
}
.user-av {
  width: 28px; height: 28px; border-radius: 50%;
  background: var(--accent); color: var(--primary);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; flex-shrink: 0;
}
.user-nm { font-size: 13px; font-weight: 600; color: #fff; }
.user-role { font-size: 10px; color: rgba(255,255,255,.45); }
.signout-btn {
  padding: 7px 16px;
  background: rgba(255,255,255,.10);
  border: 1px solid rgba(255,255,255,.18);
  color: rgba(255,255,255,.85);
  border-radius: 7px;
  font-size: 12px; font-weight: 600;
  cursor: pointer; font-family: inherit;
  transition: all .15s ease;
  display: flex; align-items: center; gap: 6px;
}
.signout-btn:hover { background: rgba(255,255,255,.20); color: #fff; border-color: rgba(255,255,255,.3); }

/* ── SIDEBAR ── */
.sidebar {
  width: 220px; min-width: 220px;
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex; flex-direction: column;
  padding: 20px 12px 20px;
  position: sticky; top: 58px;
  height: calc(100vh - 58px);
  overflow-y: auto;
}
.sidebar-section { margin-bottom: 24px; }
.sidebar-label {
  font-size: 10px; font-weight: 700;
  color: var(--text4); letter-spacing: .1em;
  text-transform: uppercase;
  padding: 0 8px 8px;
}
.nav-item {
  display: flex; align-items: center; gap: 9px;
  padding: 9px 10px; border-radius: var(--radius);
  cursor: pointer; font-size: 13px; font-weight: 500;
  color: var(--text2); transition: all .13s;
  position: relative;
}
.nav-item:hover { background: var(--bg); color: var(--text); }
.nav-item.active {
  background: #e8f4fb; color: var(--primary);
  font-weight: 600;
}
.nav-item.active::before {
  content: ''; position: absolute; left: 0; top: 50%;
  transform: translateY(-50%);
  width: 3px; height: 18px;
  background: var(--primary); border-radius: 0 3px 3px 0;
}
.nav-badge {
  margin-left: auto;
  background: #d97706; color: #fff;
  border-radius: 20px; font-size: 10px; font-weight: 700;
  padding: 2px 7px; min-width: 20px; text-align: center;
}
.sidebar-divider { height: 1px; background: var(--border); margin: 4px 8px 12px; }
.stat-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 5px 10px; font-size: 12px;
}
.stat-label { color: var(--text3); }
.stat-val { font-weight: 700; color: var(--text); }
.ins-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 4px 10px; font-size: 11px;
}

/* ── PAGE HEADER ── */
.page-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 24px;
}
.page-title { font-family: 'DM Serif Display', serif; font-size: 26px; color: var(--text); }
.page-subtitle { font-size: 13px; color: var(--text3); margin-top: 2px; }
.date-chip {
  padding: 7px 14px; background: var(--surface);
  border: 1px solid var(--border); border-radius: 8px;
  font-size: 12px; font-weight: 600; color: var(--text2);
}

/* ── STAT CARDS ── */
.stats-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-bottom: 28px; }
.stat-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 18px 20px;
  position: relative; overflow: hidden;
  box-shadow: var(--shadow);
}
.stat-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
}
.stat-card.c1::before { background: linear-gradient(90deg, var(--primary), var(--accent)); }
.stat-card.c2::before { background: linear-gradient(90deg, #d97706, #fbbf24); }
.stat-card.c3::before { background: linear-gradient(90deg, var(--purple), #a78bfa); }
.stat-card.c4::before { background: linear-gradient(90deg, var(--success), #34d399); }
.stat-num {
  font-family: 'DM Serif Display', serif;
  font-size: 34px; line-height: 1; margin-bottom: 4px;
}
.stat-card.c1 .stat-num { color: var(--primary); }
.stat-card.c2 .stat-num { color: #d97706; }
.stat-card.c3 .stat-num { color: var(--purple); }
.stat-card.c4 .stat-num { color: var(--success); }
.stat-lbl { font-size: 12px; color: var(--text3); font-weight: 500; }

/* ── PATIENT CARDS GRID ── */
.cards-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(320px,1fr)); gap: 16px; }

.patient-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: all .18s ease;
  box-shadow: var(--shadow);
}
.patient-card:hover {
  border-color: var(--primary-light);
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
.card-header {
  padding: 16px 18px 14px;
  border-bottom: 1px solid var(--border);
  background: #fafcfe;
}
.card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
.card-name { font-size: 15px; font-weight: 700; color: var(--text); }
.card-uid { font-size: 11px; color: var(--text3); font-family: monospace; margin-top: 2px; }
.card-body { padding: 14px 18px; }
.card-meta { display: flex; flex-direction: column; gap: 5px; margin-bottom: 12px; }
.meta-row { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text2); }
.meta-icon { width: 15px; text-align: center; color: var(--text3); font-size: 12px; flex-shrink: 0; }

.dates-strip {
  display: grid; grid-template-columns: 1fr 1fr 1fr;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px; overflow: hidden;
  margin-bottom: 12px;
}
.date-item { padding: 8px 10px; border-right: 1px solid var(--border); }
.date-item:last-child { border-right: none; }
.date-lbl { font-size: 9px; font-weight: 700; color: var(--text4); text-transform: uppercase; letter-spacing: .07em; margin-bottom: 3px; }
.date-val { font-size: 12px; font-weight: 700; color: var(--text); }
.date-val.warn { color: #d97706; }
.date-val.info { color: var(--primary-light); }

.tags-row { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; }

.progress-area { margin-bottom: 14px; }
.progress-header { display: flex; justify-content: space-between; margin-bottom: 5px; }
.progress-label { font-size: 11px; color: var(--text3); }
.progress-count { font-size: 11px; font-weight: 700; color: var(--primary); }
.progress-track { height: 4px; background: var(--bg2); border-radius: 4px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, var(--primary), var(--accent)); border-radius: 4px; transition: width .3s; }

.card-footer {
  display: flex; justify-content: space-between; align-items: center;
  padding-top: 12px; border-top: 1px solid var(--border);
}
.card-doa { font-size: 11px; color: var(--text3); }

/* ── BADGES & TAGS ── */
.badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 9px; border-radius: 100px;
  font-size: 11px; font-weight: 600; white-space: nowrap;
}
.badge-pending { background: var(--warning-bg); color: var(--warning); border: 1px solid var(--warning-border); }
.badge-done { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
.badge-admitted { background: var(--success-bg); color: var(--success); border: 1px solid var(--success-border); }
.badge-discharged { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
.chip {
  display: inline-flex; align-items: center;
  padding: 3px 8px; border-radius: 6px;
  font-size: 11px; font-weight: 500; background: var(--bg2);
  color: var(--text2); border: 1px solid var(--border);
}
.ins-badge {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 10px; border-radius: 100px;
  font-size: 11px; font-weight: 700; border: 1px solid;
}

/* ── BACK BUTTON ── */
.back-btn {
  display: inline-flex; align-items: center; gap: 7px;
  font-size: 13px; font-weight: 600; color: var(--text2);
  cursor: pointer; background: var(--surface);
  border: 1px solid var(--border); border-radius: var(--radius);
  padding: 7px 14px; font-family: inherit;
  transition: all .14s; margin-bottom: 20px;
}
.back-btn:hover { color: var(--primary); border-color: var(--primary-light); background: #e8f4fb; }

/* ── PATIENT DETAIL HEADER ── */
.patient-header {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 24px;
  margin-bottom: 16px; box-shadow: var(--shadow);
}
.patient-header-top {
  display: flex; justify-content: space-between;
  align-items: flex-start; gap: 16px; margin-bottom: 14px; flex-wrap: wrap;
}
.patient-name { font-family: 'DM Serif Display', serif; font-size: 24px; color: var(--text); }
.patient-meta { font-size: 13px; color: var(--text2); margin-top: 3px; }
.patient-meta strong { color: var(--text); font-weight: 700; }
.header-badges { display: flex; gap: 7px; flex-wrap: wrap; margin-bottom: 16px; }

.info-strip {
  display: grid; grid-template-columns: repeat(4, 1fr);
  background: var(--bg); border: 1px solid var(--border);
  border-radius: 10px; overflow: hidden;
}
.info-strip-item {
  padding: 12px 16px; border-right: 1px solid var(--border);
}
.info-strip-item:last-child { border-right: none; }
.info-strip-lbl { font-size: 10px; font-weight: 700; color: var(--text4); text-transform: uppercase; letter-spacing: .07em; margin-bottom: 4px; }
.info-strip-val { font-size: 13px; font-weight: 700; color: var(--text); }
.info-strip-val.warn { color: #d97706; }
.info-strip-val.info { color: var(--primary-light); }
.info-strip-val.teal { color: #0e7490; }

/* ── TPA PANEL ── */
.tpa-panel {
  background: linear-gradient(135deg, #fffbeb 0%, #fefce8 100%);
  border: 1px solid #fde68a;
  border-radius: var(--radius-lg); padding: 20px;
  margin-bottom: 16px;
}
.tpa-panel-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 16px;
}
.tpa-panel-title { font-size: 13px; font-weight: 700; color: #92400e; text-transform: uppercase; letter-spacing: .06em; display: flex; align-items: center; gap: 8px; }
.tpa-progress { font-size: 12px; font-weight: 600; color: #b45309; }
.tpa-fields { display: grid; grid-template-columns: repeat(auto-fill,minmax(190px,1fr)); gap: 12px; margin-bottom: 16px; }
.tpa-docs-label { font-size: 11px; font-weight: 700; color: #92400e; text-transform: uppercase; letter-spacing: .07em; margin-bottom: 10px; }
.tpa-docs-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(115px,1fr)); gap: 8px; }
.tpa-doc-btn {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 12px 8px; background: #fff;
  border: 1px solid #fde68a; border-radius: 8px;
  cursor: pointer; font-family: inherit; transition: all .14s; text-align: center;
}
.tpa-doc-btn:hover { border-color: #d97706; background: #fffbeb; transform: translateY(-1px); }
.tpa-doc-btn.done { background: var(--success-bg); border-color: var(--success-border); }
.tpa-doc-ico { font-size: 20px; }
.tpa-doc-lbl { font-size: 10px; font-weight: 600; color: var(--text2); line-height: 1.3; }
.tpa-doc-btn.done .tpa-doc-lbl { color: var(--success); }
.tpa-doc-check { font-size: 10px; font-weight: 700; color: var(--success); }

/* ── CHECKLIST ── */
.checklist {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 20px;
  margin-bottom: 16px; box-shadow: var(--shadow);
}
.checklist-title { font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: .09em; margin-bottom: 16px; }
.checklist-steps { display: flex; align-items: center; gap: 0; }
.step-wrap { display: flex; align-items: center; flex: 1; min-width: 0; }
.step-item {
  display: flex; align-items: center; gap: 7px; flex: 1; min-width: 0;
  padding: 8px 10px; border-radius: var(--radius);
  cursor: pointer; transition: background .13s;
}
.step-item:hover { background: var(--bg); }
.step-item.done { background: #e8f4fb; }
.step-item.active { background: var(--bg2); }
.step-num {
  width: 24px; height: 24px; border-radius: 50%;
  border: 2px solid var(--border2);
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; color: var(--text3);
  flex-shrink: 0; background: var(--surface);
}
.step-item.done .step-num { background: var(--primary); border-color: var(--primary); color: #fff; font-size: 11px; }
.step-item.active .step-num { border-color: var(--primary); color: var(--primary); }
.step-label { font-size: 11px; font-weight: 500; color: var(--text2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.step-item.done .step-label { color: var(--primary); font-weight: 600; }
.step-item.active .step-label { color: var(--primary); }
.step-line { width: 20px; height: 2px; background: var(--border); flex-shrink: 0; margin: 0 -2px; }
.step-line.done { background: var(--primary); }

.checklist-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding-top: 16px; border-top: 1px solid var(--border); margin-top: 16px; flex-wrap: wrap; gap: 12px;
}
.footer-msg-ok { font-size: 13px; color: var(--success); font-weight: 600; }
.footer-msg-pending { font-size: 13px; color: var(--text3); }
.footer-count { color: #d97706; font-weight: 700; }

/* ── PRIMARY BUTTON ── */
.btn-primary {
  padding: 9px 20px; border-radius: var(--radius);
  font-size: 13px; font-weight: 700;
  background: var(--primary); color: #fff;
  border: none; cursor: pointer; font-family: inherit;
  transition: all .16s; display: inline-flex; align-items: center; gap: 7px;
}
.btn-primary:hover { background: var(--primary-mid); }
.btn-primary:disabled { opacity: .4; cursor: not-allowed; }
.btn-success { background: var(--success); }
.btn-success:hover { background: #0a5c3b; }
.btn-done {
  padding: 9px 18px; border-radius: var(--radius);
  background: var(--success-bg); border: 1px solid var(--success-border);
  color: var(--success); font-weight: 700; font-size: 13px;
  display: inline-flex; align-items: center; gap: 6px;
}
.btn-save {
  padding: 10px 22px; border-radius: var(--radius);
  font-size: 13px; font-weight: 700;
  background: var(--primary); color: #fff;
  border: none; cursor: pointer; font-family: inherit;
  transition: all .14s; margin-top: 6px;
}
.btn-save:hover { background: var(--primary-mid); }
.btn-ghost {
  padding: 8px 16px; border-radius: var(--radius);
  font-size: 12px; font-weight: 600;
  background: var(--surface); border: 1px solid var(--border);
  color: var(--text2); cursor: pointer; font-family: inherit;
  transition: all .13s; display: inline-flex; align-items: center; gap: 6px;
}
.btn-ghost:hover { border-color: var(--primary-light); color: var(--primary); background: #e8f4fb; }

/* ── TABS ── */
.tabs-bar {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden; margin-bottom: 20px;
  box-shadow: var(--shadow);
}
.tabs-nav { display: flex; border-bottom: 1px solid var(--border); overflow-x: auto; }
.tab-btn {
  padding: 13px 18px; font-size: 13px; font-weight: 500;
  cursor: pointer; border: none; background: none;
  color: var(--text3); font-family: inherit;
  border-bottom: 2px solid transparent;
  transition: all .13s; white-space: nowrap;
  display: flex; align-items: center; gap: 7px;
}
.tab-btn:hover { color: var(--text2); background: var(--bg); }
.tab-btn.active { color: var(--primary); border-bottom-color: var(--primary); background: #e8f4fb; font-weight: 700; }
.tab-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--success); }

/* ── SECTION CARDS ── */
.section-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-lg); margin-bottom: 16px;
  overflow: hidden; box-shadow: var(--shadow);
}
.section-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 13px 20px; border-bottom: 1px solid var(--border);
  background: #fafcfe;
}
.section-title { font-size: 14px; font-weight: 700; color: var(--text); display: flex; align-items: center; gap: 8px; }
.section-body { padding: 20px; }

/* ── FORM ── */
.form-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(210px,1fr)); gap: 14px; }
.fg { display: flex; flex-direction: column; gap: 5px; }
.fg.full { grid-column: 1 / -1; }
.flbl { font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: .07em; }
.finp, .fsel, .ftxt {
  background: var(--surface); border: 1.5px solid var(--border);
  border-radius: var(--radius); padding: 9px 12px;
  color: var(--text); font-size: 13px; font-family: inherit;
  transition: all .14s; outline: none; width: 100%;
}
.finp:focus, .fsel:focus, .ftxt:focus {
  border-color: var(--primary-light);
  box-shadow: 0 0 0 3px rgba(10,77,104,.08);
}
.ftxt { resize: vertical; min-height: 78px; }

/* ── TABLE ── */
.table-wrap { overflow-x: auto; border-radius: var(--radius); border: 1px solid var(--border); }
.tbl { width: 100%; border-collapse: collapse; font-size: 13px; }
.tbl th {
  text-align: left; padding: 10px 14px;
  font-size: 11px; font-weight: 700; color: var(--text3);
  text-transform: uppercase; letter-spacing: .06em;
  background: #fafcfe; border-bottom: 1px solid var(--border);
}
.tbl td { padding: 9px 14px; border-bottom: 1px solid var(--border); vertical-align: middle; }
.tbl tr:last-child td { border-bottom: none; }
.tbl tr:hover td { background: var(--bg); }
.tinp {
  background: var(--bg); border: 1.5px solid var(--border);
  border-radius: 6px; padding: 6px 9px; color: var(--text);
  font-size: 12px; font-family: inherit; outline: none; width: 100%;
}
.tinp:focus { border-color: var(--primary-light); background: #fff; }
.tsel {
  background: var(--bg); border: 1.5px solid var(--border);
  border-radius: 6px; padding: 6px 8px; color: var(--text);
  font-size: 12px; font-family: inherit; outline: none; width: 100%;
}

.add-row-btn {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 8px 14px; background: var(--bg);
  border: 1.5px dashed var(--border2); color: var(--text2);
  border-radius: var(--radius); cursor: pointer;
  font-size: 12px; font-family: inherit; font-weight: 600;
  margin-top: 12px; transition: all .14s;
}
.add-row-btn:hover { border-color: var(--primary); color: var(--primary); background: #e8f4fb; }
.del-btn {
  padding: 4px 9px; border-radius: 5px;
  background: var(--danger-bg); border: 1px solid var(--danger-border);
  color: var(--danger); cursor: pointer; font-size: 12px; font-family: inherit;
  transition: all .13s;
}
.del-btn:hover { background: #fecaca; }

/* ── STATUS CELLS ── */
.val-high { color: var(--danger); font-weight: 700; }
.val-low { color: #d97706; font-weight: 700; }
.val-normal { color: var(--success); font-weight: 700; }

/* ── REPORT CARDS ── */
.report-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-lg); margin-bottom: 16px;
  overflow: hidden; box-shadow: var(--shadow);
}
.report-hdr {
  background: var(--primary); color: #fff;
  padding: 14px 20px;
  display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
}
.report-hdr.radiology { background: var(--purple); }
.report-name-inp {
  background: transparent; border: none; border-bottom: 1px solid rgba(255,255,255,.25);
  outline: none; color: #fff; font-family: 'DM Serif Display', serif;
  font-style: italic; font-size: 17px; width: 100%;
}
.report-meta-row { display: flex; gap: 18px; flex-wrap: wrap; margin-top: 8px; }
.report-meta-item { font-size: 11px; color: rgba(255,255,255,.55); display: flex; align-items: center; gap: 5px; }
.report-meta-inp {
  background: transparent; border: none; border-bottom: 1px solid rgba(255,255,255,.2);
  outline: none; color: rgba(255,255,255,.8);
  font-family: inherit; font-size: 11px; width: 130px;
}
.report-meta-sel {
  background: transparent; border: none; border-bottom: 1px solid rgba(255,255,255,.2);
  outline: none; color: rgba(255,255,255,.8); font-family: inherit; font-size: 11px;
}
.report-remove-btn {
  background: rgba(255,255,255,.10); color: rgba(255,255,255,.7);
  border: 1px solid rgba(255,255,255,.2); border-radius: 6px;
  padding: 5px 12px; cursor: pointer; font-size: 11px; font-family: inherit; font-weight: 600;
  white-space: nowrap; flex-shrink: 0; transition: all .13s;
}
.report-remove-btn:hover { background: rgba(239,68,68,.2); color: #fca5a5; border-color: rgba(239,68,68,.3); }

.modality-grid {
  display: grid; grid-template-columns: repeat(auto-fill,minmax(160px,1fr)); gap: 10px;
  padding: 14px 20px; background: #f5f3ff; border-bottom: 1px solid var(--purple-border);
}
.modality-lbl { font-size: 10px; font-weight: 700; color: var(--purple); text-transform: uppercase; letter-spacing: .06em; margin-bottom: 3px; }
.modality-inp {
  width: 100%; background: #fff; border: 1.5px solid var(--purple-border);
  border-radius: 7px; padding: 7px 10px; font-size: 12px; font-family: inherit; outline: none; color: var(--text);
}
.modality-inp:focus { border-color: var(--purple); }
.modality-txt {
  width: 100%; background: #fff; border: 1.5px solid var(--purple-border);
  border-radius: 7px; padding: 7px 10px; font-size: 12px; font-family: inherit; outline: none; color: var(--text);
  resize: vertical; min-height: 60px;
}

.report-footer {
  padding: 14px 20px; background: #fafcfe;
  border-top: 1px solid var(--border);
  display: flex; align-items: flex-end; gap: 16px; flex-wrap: wrap;
}
.remarks-lbl { font-size: 10px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: .06em; margin-bottom: 4px; }
.remarks-inp {
  flex: 1; min-width: 200px; background: #fff;
  border: 1.5px solid var(--border); border-radius: var(--radius);
  padding: 8px 12px; color: var(--text); font-size: 13px; font-family: inherit; outline: none;
}
.remarks-inp:focus { border-color: var(--primary-light); }
.amount-grp { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.amount-lbl { font-size: 12px; font-weight: 600; color: var(--text3); white-space: nowrap; }
.amount-inp {
  width: 115px; background: #fff; border: 1.5px solid var(--border);
  border-radius: var(--radius); padding: 8px 10px;
  color: var(--text); font-size: 14px; font-family: inherit; font-weight: 700; outline: none;
}
.amount-inp:focus { border-color: var(--primary-light); }

/* ── REPORT SUB-TABS ── */
.sub-tabs { display: flex; gap: 8px; padding: 12px 20px; border-bottom: 1px solid var(--border); background: #fafcfe; }
.sub-tab {
  padding: 6px 16px; border-radius: 100px; font-size: 12px; font-weight: 600;
  cursor: pointer; border: 1.5px solid var(--border); background: var(--surface);
  color: var(--text2); font-family: inherit; transition: all .13s;
}
.sub-tab:hover { border-color: var(--primary); color: var(--primary); }
.sub-tab.lab { background: var(--primary); border-color: var(--primary); color: #fff; }
.sub-tab.radio { background: var(--purple); border-color: var(--purple); color: #fff; }

.filter-bar { display: flex; gap: 8px; padding: 10px 20px; border-bottom: 1px solid var(--border); flex-wrap: wrap; align-items: center; background: var(--bg); }
.search-inp {
  flex: 1; min-width: 180px; background: var(--surface);
  border: 1.5px solid var(--border); border-radius: var(--radius);
  padding: 7px 12px; font-size: 13px; font-family: inherit; outline: none; color: var(--text);
}
.search-inp:focus { border-color: var(--primary-light); }
.filter-btn {
  padding: 5px 12px; border-radius: 100px; font-size: 11px; font-weight: 600;
  cursor: pointer; border: 1.5px solid var(--border); background: var(--surface);
  color: var(--text2); font-family: inherit; transition: all .13s;
}
.filter-btn:hover { border-color: var(--primary); color: var(--primary); }
.filter-btn.sel { background: var(--primary); border-color: var(--primary); color: #fff; }
.filter-btn.sel-radio { background: var(--purple); border-color: var(--purple); color: #fff; }

.add-report-btn {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 10px 18px; background: var(--primary); color: #fff;
  border: none; border-radius: var(--radius);
  cursor: pointer; font-size: 13px; font-weight: 600; font-family: inherit;
  transition: all .14s;
}
.add-report-btn:hover { background: var(--primary-mid); }
.add-radio-btn {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 10px 18px; background: var(--purple); color: #fff;
  border: none; border-radius: var(--radius);
  cursor: pointer; font-size: 13px; font-weight: 600; font-family: inherit;
  transition: all .14s;
}
.add-radio-btn:hover { background: #4c1d95; }

/* ── TOTALS ── */
.totals-box {
  margin-top: 16px; border-top: 2px solid var(--border);
  padding-top: 12px; max-width: 340px; margin-left: auto;
}
.total-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
.total-lbl { color: var(--text3); }
.total-val { font-weight: 700; }
.total-row.final {
  border-top: 2px solid var(--primary); margin-top: 8px; padding-top: 10px;
  font-size: 15px; font-weight: 800; color: var(--primary);
}

.bill-grid { display: grid; grid-template-columns: 1fr 320px; gap: 16px; align-items: start; }

/* ── MODAL OVERLAY ── */
.overlay {
  position: fixed; inset: 0;
  background: rgba(5,20,40,.6);
  z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(4px);
  animation: fadeIn .15s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

/* ── MAIN MODAL ── */
.modal {
  background: var(--surface); border-radius: 14px;
  padding: 0; width: 460px; max-width: 95vw;
  box-shadow: var(--shadow-lg);
  position: relative; max-height: 90vh; overflow-y: auto;
  border: 1px solid var(--border);
  animation: slideUp .18s ease;
}
@keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
.modal-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border);
  display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
}
.modal-title { font-family: 'DM Serif Display', serif; font-size: 20px; color: var(--text); }
.modal-sub { font-size: 13px; color: var(--text2); margin-top: 4px; line-height: 1.5; }
.modal-close {
  width: 28px; height: 28px; border-radius: 6px;
  background: var(--bg); border: 1px solid var(--border);
  cursor: pointer; font-size: 12px; color: var(--text2);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: all .13s;
}
.modal-close:hover { background: var(--danger-bg); color: var(--danger); border-color: var(--danger-border); }
.modal-body { padding: 20px 24px; }
.modal-footer { padding: 16px 24px; border-top: 1px solid var(--border); display: flex; gap: 10px; justify-content: flex-end; background: #fafcfe; border-radius: 0 0 14px 14px; }

.checklist-preview { background: var(--bg); border-radius: var(--radius); padding: 14px; margin-bottom: 4px; display: flex; flex-direction: column; gap: 8px; }
.preview-row { display: flex; align-items: center; gap: 10px; font-size: 13px; }

/* ── TPA DOC MODAL ── */
.tpa-modal { background: var(--surface); border-radius: 14px; width: 500px; max-width: 95vw; }
.tpa-modal .modal-header { border-top: 3px solid #d97706; border-radius: 14px 14px 0 0; }

/* ── LOGOUT MODAL ── */
.logout-modal { background: var(--surface); border-radius: 14px; width: 380px; max-width: 95vw; }
.logout-modal .modal-header { border-top: 3px solid var(--danger); border-radius: 14px 14px 0 0; }

/* ── PATIENT DETAIL PREVIEW CARD ── */
.detail-preview {
  background: var(--bg); border-radius: var(--radius); padding: 14px;
  margin: 0 0 4px; display: flex; flex-direction: column; gap: 7px; font-size: 13px;
}
.detail-row { display: flex; gap: 6px; }
.detail-key { color: var(--text3); font-weight: 600; flex-shrink: 0; }

/* ── TOASTS ── */
.toast-wrap {
  position: fixed; bottom: 20px; right: 20px; z-index: 9999;
  display: flex; flex-direction: column; gap: 8px; pointer-events: none;
}
.toast {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 10px; padding: 11px 16px; font-size: 13px; font-weight: 600;
  box-shadow: var(--shadow-lg); display: flex; align-items: center; gap: 9px;
  color: var(--text); animation: toastIn .2s ease;
}
.toast.success { border-left: 3px solid var(--success); }
.toast.error { border-left: 3px solid var(--danger); }
@keyframes toastIn { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: none; } }

.empty-state { text-align: center; padding: 50px 20px; color: var(--text3); }
.empty-ico { font-size: 42px; margin-bottom: 12px; }
.empty-text { font-size: 15px; font-weight: 600; }
.empty-sub { font-size: 12px; margin-top: 4px; }

@media(max-width:860px) {
  .sidebar { display: none; }
  .main-scroll { padding: 16px; }
  .stats-row { grid-template-columns: 1fr 1fr; }
  .bill-grid { grid-template-columns: 1fr; }
  .info-strip { grid-template-columns: 1fr 1fr; }
}
`;

export default function BillingDashboard() {
  const [patients, setPatients] = useState(MOCK_PATIENTS);
  const [view, setView]         = useState("tasks"); // "tasks" | "patient" | "loggedout"
  const [sel, setSel]           = useState(null);
  const [activeTab, setActiveTab] = useState("discharge");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showLogout, setShowLogout]   = useState(false);
  const [toasts, setToasts]     = useState([]);

  const [repSubTab, setRepSubTab]     = useState("lab");
  const [labFilter, setLabFilter]     = useState("All");
  const [radioFilter, setRadioFilter] = useState("All");
  const [labSearch, setLabSearch]     = useState("");
  const [radioSearch, setRadioSearch] = useState("");
  const [tpaDocModal, setTpaDocModal] = useState(null);

  const [eDis, setEDis]           = useState({});
  const [eMed, setEMed]           = useState({});
  const [eSvc, setESvc]           = useState([]);
  const [eLabRep, setELabRep]     = useState([]);
  const [eMedBill, setEMedBill]   = useState([]);
  const [eBilling, setEBilling]   = useState({});
  const [eSaved, setESaved]       = useState({});
  const [ePrescrip, setEPrescrip] = useState([]);
  const [eTpaDocStatus, setETpaDocStatus] = useState({});
  const [eTpaInfo, setETpaInfo]   = useState({});

  const toast = (msg, type="success") => {
    const id = _tid++;
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  };

  const openPatient = (p) => {
    setSel(p);
    setEDis({...p.discharge});
    setEMed({...p.medicalHistory});
    setESvc(JSON.parse(JSON.stringify(p.services)));
    setELabRep(JSON.parse(JSON.stringify(p.labReports)));
    setEMedBill(JSON.parse(JSON.stringify(p.medicalBill)));
    setEBilling({...p.billing});
    setESaved({...p.saved});
    setEPrescrip(JSON.parse(JSON.stringify(p.prescription||[])));
    setETpaDocStatus({...p.tpaDocStatus});
    setETpaInfo({...p.tpaInfo});
    setRepSubTab("lab"); setLabFilter("All"); setRadioFilter("All");
    setLabSearch(""); setRadioSearch("");
    setActiveTab("discharge");
    setView("patient");
  };

  const saveSection = (sKey, label) => {
    const ns = {...eSaved, [sKey]: true};
    setESaved(ns);
    setPatients(prev => prev.map(p =>
      p.uhid === sel.uhid
        ? {...p, saved:ns, discharge:{...eDis}, medicalHistory:{...eMed}, services:[...eSvc],
           labReports:JSON.parse(JSON.stringify(eLabRep)), medicalBill:[...eMedBill],
           billing:{...eBilling}, prescription:JSON.parse(JSON.stringify(ePrescrip)),
           tpaDocStatus:{...eTpaDocStatus}, tpaInfo:{...eTpaInfo}}
        : p
    ));
    toast(label + " saved successfully");
  };

  const markTpaDoc = (docId) => {
    const ns = {...eTpaDocStatus, [docId]: true};
    setETpaDocStatus(ns);
    setPatients(prev => prev.map(p => p.uhid===sel.uhid ? {...p, tpaDocStatus:ns} : p));
    toast(TPA_DOCS.find(d=>d.id===docId)?.label + " marked as ready");
    setTpaDocModal(null);
  };

  const savedCount = eSaved ? SECTION_KEYS.filter(k=>eSaved[k]).length : 0;
  const allSaved   = savedCount === SECTION_KEYS.length;

  const completeTask = () => {
    setPatients(prev => prev.map(p => p.uhid===sel.uhid ? {...p, taskStatus:"completed", saved:{...eSaved}} : p));
    setSel(prev => ({...prev, taskStatus:"completed"}));
    setShowConfirm(false);
    toast("Task submitted to HOD & Admin Management");
  };

  const isTPA = sel && ["ECHS","ECI","FCI","Ayushman Bharat","Northern Railways","TPA"].includes(eBilling?.insuranceType);

  const updSvc = (i,k,v) => setESvc(prev => {
    const n=[...prev]; n[i]={...n[i],[k]:v};
    if(k==="qty"||k==="rate") n[i].amount=Number(n[i].qty||0)*Number(n[i].rate||0);
    return n;
  });
  const updRep        = (ri,k,v) => setELabRep(p=>{const n=JSON.parse(JSON.stringify(p));n[ri][k]=v;return n;});
  const updModality   = (ri,k,v) => setELabRep(p=>{const n=JSON.parse(JSON.stringify(p));n[ri].modalityDetails={...n[ri].modalityDetails,[k]:v};return n;});
  const updTest       = (ri,ti,k,v) => setELabRep(p=>{const n=JSON.parse(JSON.stringify(p));n[ri].tests[ti][k]=v;return n;});
  const addTest       = (ri) => setELabRep(p=>{const n=JSON.parse(JSON.stringify(p));n[ri].tests.push({id:Date.now(),name:"",value:"",unit:"",refRange:"",status:"Normal"});return n;});
  const delTest       = (ri,ti) => setELabRep(p=>{const n=JSON.parse(JSON.stringify(p));n[ri].tests.splice(ti,1);return n;});

  const labReports   = eLabRep.filter(r=>r.reportCategory==="lab");
  const radioReports = eLabRep.filter(r=>r.reportCategory==="radiology");
  const labTypes     = useMemo(()=>["All",...Array.from(new Set(labReports.map(r=>r.reportType)))]   ,[labReports.length]);
  const radioTypes   = useMemo(()=>["All",...Array.from(new Set(radioReports.map(r=>r.reportType)))] ,[radioReports.length]);
  const visibleLab   = labReports.filter(r=>(labFilter==="All"||r.reportType===labFilter)&&(!labSearch||r.reportName.toLowerCase().includes(labSearch.toLowerCase())));
  const visibleRadio = radioReports.filter(r=>(radioFilter==="All"||r.reportType===radioFilter)&&(!radioSearch||r.reportName.toLowerCase().includes(radioSearch.toLowerCase())));

  const totals = sel ? calcTotals(eSvc, eLabRep, eMedBill, eBilling) : null;
  const pending   = patients.filter(p=>p.taskStatus==="pending").length;
  const completed = patients.filter(p=>p.taskStatus==="completed").length;

  const TABS = [
    {id:"discharge", sKey:"discharge", lbl:"Discharge Summary", ico:"📋"},
    {id:"medical",   sKey:"admission",  lbl:"Admission Note",   ico:"🩺"},
    {id:"reports",   sKey:"reports",    lbl:"Reports",          ico:"🗂️"},
    {id:"med_bill",  sKey:"medicines",  lbl:"Medicine Bill",    ico:"💊"},
    {id:"finalbill", sKey:"billing",    lbl:"Final Bill",       ico:"🧾"},
  ];

  const insStyle = (t) => {
    const c = INS_CONFIG[t] || INS_CONFIG["Cash"];
    return { color: c.color, background: c.bg, borderColor: c.border };
  };

  // ── LOGGED OUT SCREEN ──
  if (view === "loggedout") {
    return (
      <>
        <style>{CSS}</style>
        <div style={{
          minHeight:"100vh", background: "var(--primary)",
          display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:24,
          fontFamily: "'DM Sans', sans-serif"
        }}>
          <div style={{
            background:"var(--surface)", borderRadius:16, padding:"40px 48px", textAlign:"center",
            boxShadow: "var(--shadow-lg)", width:380, maxWidth:"95vw"
          }}>
            <div style={{fontSize:44, marginBottom:12}}>🏥</div>
            <div style={{fontFamily:"'DM Serif Display',serif", fontSize:22, color:"var(--text)", marginBottom:6}}>
              Sangi Hospital
            </div>
            <div style={{fontSize:13, color:"var(--text3)", marginBottom:24}}>Billing Department Portal</div>
            <div style={{
              padding:"12px 16px", background:"var(--success-bg)",
              border:"1px solid var(--success-border)", borderRadius:8,
              fontSize:13, color:"var(--success)", fontWeight:600, marginBottom:24
            }}>
              ✓ You have been signed out successfully
            </div>
            <button
              className="btn-primary"
              style={{width:"100%", justifyContent:"center"}}
              onClick={()=>setView("tasks")}
            >
              Sign In Again
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="app">

        {/* ── TOPBAR ── */}
        <header className="topbar">
          <div className="topbar-left">
            <div className="logo-mark">Sh</div>
            <div>
              <div className="brand-name">Sangi Hospital</div>
              <div className="brand-sub">Billing Department</div>
            </div>
          </div>
          <div className="topbar-right">
            <div className="user-pill">
              <div className="user-av">{CURRENT_USER.name[0]}</div>
              <div>
                <div className="user-nm">{CURRENT_USER.name}</div>
                <div className="user-role">{CURRENT_USER.empId} · {CURRENT_USER.role}</div>
              </div>
            </div>
            <button className="signout-btn" onClick={()=>setShowLogout(true)}>
              <span>↪</span> Sign Out
            </button>
          </div>
        </header>

        <div className="layout">
          {/* ── SIDEBAR ── */}
          <aside className="sidebar">
            <div className="sidebar-section">
              <div className="sidebar-label">Workspace</div>
              <div className="nav-item active">
                <span>📋</span> My Tasks
                {pending > 0 && <span className="nav-badge">{pending}</span>}
              </div>
            </div>
            <div className="sidebar-divider" />
            <div className="sidebar-section">
              <div className="sidebar-label">Overview</div>
              <div className="stat-row"><span className="stat-label">Total Assigned</span><span className="stat-val">{patients.length}</span></div>
              <div className="stat-row"><span className="stat-label">Daily Capacity</span><span className="stat-val" style={{color:"var(--primary)"}}>6</span></div>
              <div className="stat-row"><span className="stat-label">Pending</span><span className="stat-val" style={{color:"#d97706"}}>{pending}</span></div>
              <div className="stat-row"><span className="stat-label">Completed</span><span className="stat-val" style={{color:"var(--success)"}}>{completed}</span></div>
            </div>
            <div className="sidebar-divider" />
            <div className="sidebar-section">
              <div className="sidebar-label">By Insurance</div>
              {INSURANCE_TYPES.map(ins => (
                <div key={ins} className="ins-row">
                  <span style={{color:"var(--text3)"}}>{ins}</span>
                  <span style={{fontWeight:700, color: (INS_CONFIG[ins]||INS_CONFIG["Cash"]).color}}>
                    {patients.filter(p=>p.insuranceType===ins).length}
                  </span>
                </div>
              ))}
            </div>
          </aside>

          <main className="main-scroll">

            {/* ═══════════ TASK LIST ═══════════ */}
            {view === "tasks" && (
              <>
                <div className="page-header">
                  <div>
                    <div className="page-title">My Tasks</div>
                    <div className="page-subtitle">Patients assigned to you · Daily capacity: 6 patients</div>
                  </div>
                  <div className="date-chip">
                    {new Date().toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"long",year:"numeric"})}
                  </div>
                </div>

                <div className="stats-row">
                  <div className="stat-card c1"><div className="stat-num">{patients.length}</div><div className="stat-lbl">Total Assigned</div></div>
                  <div className="stat-card c2"><div className="stat-num">{pending}</div><div className="stat-lbl">Pending Tasks</div></div>
                  <div className="stat-card c3"><div className="stat-num">{completed}</div><div className="stat-lbl">Completed</div></div>
                  <div className="stat-card c4"><div className="stat-num">{patients.filter(p=>["ECHS","ECI","FCI","Ayushman Bharat","Northern Railways","TPA"].includes(p.insuranceType)).length}</div><div className="stat-lbl">Insurance Cases</div></div>
                </div>

                {patients.length === 0
                  ? <div className="empty-state"><div className="empty-ico">🎉</div><div className="empty-text">All tasks completed!</div></div>
                  : <div className="cards-grid">
                      {patients.map(p => {
                        const done = SECTION_KEYS.filter(k=>p.saved?.[k]).length;
                        const ist = insStyle(p.insuranceType);
                        return (
                          <div key={p.uhid} className="patient-card">
                            <div className="card-header">
                              <div className="card-top">
                                <div>
                                  <div className="card-name">{p.patientName}</div>
                                  <div className="card-uid">{p.uhid} · {p.admNo}</div>
                                </div>
                                <span className={"badge "+(p.taskStatus==="completed"?"badge-done":"badge-pending")}>
                                  {p.taskStatus==="completed" ? "✓ Done" : "Pending"}
                                </span>
                              </div>
                              <span className="ins-badge" style={ist}>🏷 {p.insuranceType}</span>
                            </div>

                            <div className="card-body">
                              <div className="card-meta">
                                <div className="meta-row"><span className="meta-icon">🏥</span><strong style={{fontSize:11}}>{p.branch}</strong></div>
                                <div className="meta-row"><span className="meta-icon">👨‍⚕️</span>{p.doctor}</div>
                                <div className="meta-row"><span className="meta-icon">🩺</span>{p.diagnosis}</div>
                                <div className="meta-row"><span className="meta-icon">📞</span>{p.phone}</div>
                              </div>

                              <div className="dates-strip">
                                <div className="date-item">
                                  <div className="date-lbl">Admitted</div>
                                  <div className="date-val">{fmtDtShort(p.doa)}</div>
                                </div>
                                <div className="date-item">
                                  <div className="date-lbl">Exp. Discharge</div>
                                  <div className="date-val warn">{p.expectedDod ? fmtDtShort(p.expectedDod) : "—"}</div>
                                </div>
                                <div className="date-item">
                                  <div className="date-lbl">Discharged</div>
                                  <div className="date-val info">{p.dod ? fmtDtShort(p.dod) : "Active"}</div>
                                </div>
                              </div>

                              <div className="tags-row">
                                <span className={"badge "+(p.status==="admitted"?"badge-admitted":"badge-discharged")}>
                                  {p.status==="admitted"?"● Admitted":"✓ Discharged"}
                                </span>
                                <span className="chip">{p.ward} · {p.bed}</span>
                                <span className="chip">{p.age}y {p.gender[0]}</span>
                              </div>

                              {p.taskStatus !== "completed" && (
                                <div className="progress-area">
                                  <div className="progress-header">
                                    <span className="progress-label">Sections completed</span>
                                    <span className="progress-count">{done} / {SECTION_KEYS.length}</span>
                                  </div>
                                  <div className="progress-track">
                                    <div className="progress-fill" style={{width:((done/SECTION_KEYS.length)*100)+"%"}} />
                                  </div>
                                </div>
                              )}

                              <div className="card-footer">
                                <div className="card-doa">DOA: {fmtDt(p.doa)}</div>
                                <button className="btn-primary" onClick={()=>openPatient(p)} style={{padding:"7px 18px",fontSize:13}}>
                                  Open →
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                }
              </>
            )}

            {/* ═══════════ PATIENT DETAIL ═══════════ */}
            {view === "patient" && sel && (
              <>
                <button className="back-btn" onClick={()=>{setView("tasks");setSel(null);}}>
                  ← Back to My Tasks
                </button>

                {/* Patient Header */}
                <div className="patient-header">
                  <div className="patient-header-top">
                    <div>
                      <div className="patient-name">{sel.patientName}</div>
                      <div className="patient-meta">
                        UHID: <strong>{sel.uhid}</strong> &nbsp;·&nbsp;
                        Adm: <strong>{sel.admNo}</strong> &nbsp;·&nbsp;
                        {sel.age} yrs · {sel.gender} &nbsp;·&nbsp; {sel.phone}
                      </div>
                    </div>
                    <div className="fg" style={{minWidth:180}}>
                      <label className="flbl">Insurance / Scheme</label>
                      <select className="fsel" value={eBilling?.insuranceType||"Cash"} onChange={e=>setEBilling(p=>({...p,insuranceType:e.target.value}))}>
                        {INSURANCE_TYPES.map(t=><option key={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="header-badges">
                    <span className="chip">🏥 {sel.branch}</span>
                    <span className={"badge "+(sel.status==="admitted"?"badge-admitted":"badge-discharged")}>
                      {sel.status==="admitted"?"● Admitted":"✓ Discharged"}
                    </span>
                    <span className="chip">🛏 {sel.ward} · {sel.bed}</span>
                    <span className="chip">👨‍⚕️ {sel.doctor}</span>
                    <span className={"badge "+(sel.taskStatus==="completed"?"badge-done":"badge-pending")}>
                      {sel.taskStatus==="completed"?"✓ Submitted to HOD":"Task Pending"}
                    </span>
                    {eBilling?.insuranceType && (
                      <span className="ins-badge" style={insStyle(eBilling.insuranceType)}>🏷 {eBilling.insuranceType}</span>
                    )}
                  </div>

                  <div className="info-strip">
                    <div className="info-strip-item">
                      <div className="info-strip-lbl">Date of Admission</div>
                      <div className="info-strip-val">{fmtDt(sel.doa)}</div>
                    </div>
                    <div className="info-strip-item">
                      <div className="info-strip-lbl">Expected Discharge</div>
                      <div className="info-strip-val warn">{eDis.expectedDod ? fmtDt(eDis.expectedDod) : "Not set"}</div>
                    </div>
                    <div className="info-strip-item">
                      <div className="info-strip-lbl">Actual Discharge</div>
                      <div className="info-strip-val info">{sel.dod ? fmtDt(sel.dod) : "Not yet discharged"}</div>
                    </div>
                    <div className="info-strip-item">
                      <div className="info-strip-lbl">Primary Diagnosis</div>
                      <div className="info-strip-val teal">{sel.diagnosis}</div>
                    </div>
                  </div>
                </div>

                {/* TPA Panel */}
                {isTPA && (
                  <div className="tpa-panel">
                    <div className="tpa-panel-header">
                      <div className="tpa-panel-title">
                        <span>🏷</span> {eBilling?.insuranceType} — Insurance Documents
                      </div>
                      <span className="tpa-progress">
                        {Object.values(eTpaDocStatus).filter(Boolean).length}/{TPA_DOCS.length} documents ready
                      </span>
                    </div>
                    <div className="tpa-fields">
                      {[
                        {k:"policyNo",lbl:"Policy / Beneficiary No."},
                        {k:"claimNo",lbl:"Claim No."},
                        {k:"authNo",lbl:"Pre-Auth No."},
                        {k:"tpaName",lbl:"TPA / Scheme Name"},
                      ].map(f=>(
                        <div key={f.k} className="fg">
                          <label className="flbl">{f.lbl}</label>
                          <input className="finp" value={eTpaInfo?.[f.k]||""} placeholder={f.lbl} onChange={e=>setETpaInfo(p=>({...p,[f.k]:e.target.value}))} />
                        </div>
                      ))}
                    </div>
                    <div className="tpa-docs-label">TPA Document Checklist — click to mark ready</div>
                    <div className="tpa-docs-grid">
                      {TPA_DOCS.map(doc => {
                        const done = eTpaDocStatus?.[doc.id];
                        return (
                          <button key={doc.id} className={"tpa-doc-btn"+(done?" done":"")} onClick={()=>setTpaDocModal({...doc})}>
                            <span className="tpa-doc-ico">{doc.ico}</span>
                            <span className="tpa-doc-lbl">{doc.label}</span>
                            {done && <span className="tpa-doc-check">✓ Ready</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Checklist */}
                <div className="checklist">
                  <div className="checklist-title">Task Checklist — Save all sections then submit to HOD</div>
                  <div className="checklist-steps">
                    {SECTION_KEYS.map((k,idx) => (
                      <div key={k} className="step-wrap">
                        <div
                          className={"step-item"+(eSaved[k]?" done":activeTab===["discharge","medical","","reports","med_bill","finalbill"][idx]?" active":"")}
                          onClick={()=>setActiveTab(["discharge","medical","medical","reports","med_bill","finalbill"][idx])}
                        >
                          <div className="step-num">{eSaved[k]?"✓":(idx+1)}</div>
                          <div className="step-label">{SECTION_LABELS[k]}</div>
                        </div>
                        {idx < SECTION_KEYS.length-1 && (
                          <div className={"step-line"+(eSaved[k]?" done":"")} />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="checklist-footer">
                    {sel.taskStatus==="completed"
                      ? <div className="footer-msg-ok">✓ Successfully submitted to HOD & Admin Management</div>
                      : allSaved
                        ? <div className="footer-msg-ok">✓ All sections saved — ready to submit!</div>
                        : <div className="footer-msg-pending">
                            <span className="footer-count">{SECTION_KEYS.length - savedCount} section{SECTION_KEYS.length - savedCount !== 1 ? "s" : ""} remaining</span>
                            {" "}— save all sections to unlock submission
                          </div>
                    }
                    {sel.taskStatus !== "completed"
                      ? <button className="btn-primary" disabled={!allSaved} onClick={()=>setShowConfirm(true)}>
                          Submit to HOD →
                        </button>
                      : <div className="btn-done">✓ Submitted</div>
                    }
                  </div>
                </div>

                {/* Tabs */}
                <div className="tabs-bar">
                  <div className="tabs-nav">
                    {TABS.map(t => (
                      <button key={t.id} className={"tab-btn"+(activeTab===t.id?" active":"")} onClick={()=>setActiveTab(t.id)}>
                        {t.ico} {t.lbl} {eSaved[t.sKey] && <span className="tab-dot" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── DISCHARGE SUMMARY ── */}
                {activeTab === "discharge" && (
                  <>
                    <div className="section-card">
                      <div className="section-header"><div className="section-title">📋 Discharge Summary</div></div>
                      <div className="section-body">
                        <div className="form-grid">
                          <div className="fg"><label className="flbl">Date of Admission</label><input className="finp" type="datetime-local" value={eDis?.doa||""} onChange={e=>setEDis(p=>({...p,doa:e.target.value}))} /></div>
                          <div className="fg"><label className="flbl">Expected Discharge</label><input className="finp" type="datetime-local" value={eDis?.expectedDod||""} onChange={e=>setEDis(p=>({...p,expectedDod:e.target.value}))} /></div>
                          <div className="fg"><label className="flbl">Actual Discharge Date</label><input className="finp" type="datetime-local" value={eDis?.dod||""} onChange={e=>setEDis(p=>({...p,dod:e.target.value}))} /></div>
                          {[{k:"ward",lbl:"Ward"},{k:"bed",lbl:"Bed No."},{k:"doctor",lbl:"Treating Doctor"},{k:"diagnosis",lbl:"Primary Diagnosis"},{k:"condition",lbl:"Condition at Discharge"}].map(f=>(
                            <div key={f.k} className="fg"><label className="flbl">{f.lbl}</label><input className="finp" value={eDis?.[f.k]||""} onChange={e=>setEDis(p=>({...p,[f.k]:e.target.value}))} /></div>
                          ))}
                          <div className="fg full"><label className="flbl">Discharge Instructions</label><textarea className="ftxt" value={eDis?.instructions||""} onChange={e=>setEDis(p=>({...p,instructions:e.target.value}))} /></div>
                          <div className="fg full"><label className="flbl">Additional Notes</label><textarea className="ftxt" value={eDis?.notes||""} onChange={e=>setEDis(p=>({...p,notes:e.target.value}))} /></div>
                        </div>
                      </div>
                    </div>
                    <button className="btn-save" onClick={()=>saveSection("discharge","Discharge Summary")}>Save Discharge Summary</button>
                  </>
                )}

                {/* ── ADMISSION NOTE ── */}
                {activeTab === "medical" && (
                  <>
                    <div className="section-card">
                      <div className="section-header"><div className="section-title">🩺 Admission Note / Medical History</div></div>
                      <div className="section-body">
                        <div className="form-grid">
                          {[
                            {k:"treatingDoctor",lbl:"Treating Doctor"},{k:"previousDiagnosis",lbl:"Previous Diagnosis"},
                            {k:"chronicConditions",lbl:"Chronic Conditions"},{k:"pastSurgeries",lbl:"Past Surgeries"},
                            {k:"currentMedications",lbl:"Current Medications"},{k:"knownAllergies",lbl:"Known Allergies"},
                            {k:"familyHistory",lbl:"Family History"},{k:"smokingStatus",lbl:"Smoking Status"},{k:"alcoholUse",lbl:"Alcohol Use"},
                          ].map(f=>(
                            <div key={f.k} className="fg"><label className="flbl">{f.lbl}</label><input className="finp" value={eMed?.[f.k]||""} onChange={e=>setEMed(p=>({...p,[f.k]:e.target.value}))} /></div>
                          ))}
                          <div className="fg full"><label className="flbl">Notes</label><textarea className="ftxt" value={eMed?.notes||""} onChange={e=>setEMed(p=>({...p,notes:e.target.value}))} /></div>
                        </div>
                      </div>
                    </div>

                    <div className="section-card" style={{marginTop:16}}>
                      <div className="section-header"><div className="section-title">📝 Prescription</div></div>
                      <div className="section-body">
                        <div className="table-wrap">
                          <table className="tbl">
                            <thead><tr><th>Medicine Name</th><th>Dosage (M-A-N)</th><th>Duration</th><th>Instructions</th><th style={{width:40}}></th></tr></thead>
                            <tbody>
                              {ePrescrip.map((r,i)=>(
                                <tr key={r.id}>
                                  <td><input className="tinp" value={r.medicine} placeholder="e.g. Metformin 500mg" onChange={e=>{const n=[...ePrescrip];n[i]={...n[i],medicine:e.target.value};setEPrescrip(n);}}/></td>
                                  <td><input className="tinp" value={r.dosage} placeholder="1-0-1" onChange={e=>{const n=[...ePrescrip];n[i]={...n[i],dosage:e.target.value};setEPrescrip(n);}}/></td>
                                  <td><input className="tinp" value={r.duration} placeholder="7 days" onChange={e=>{const n=[...ePrescrip];n[i]={...n[i],duration:e.target.value};setEPrescrip(n);}}/></td>
                                  <td><input className="tinp" value={r.instructions} placeholder="After meals" onChange={e=>{const n=[...ePrescrip];n[i]={...n[i],instructions:e.target.value};setEPrescrip(n);}}/></td>
                                  <td><button className="del-btn" onClick={()=>setEPrescrip(p=>p.filter((_,j)=>j!==i))}>✕</button></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <button className="add-row-btn" onClick={()=>setEPrescrip(p=>[...p,{id:Date.now(),medicine:"",dosage:"",duration:"",instructions:""}])}>+ Add Medicine</button>
                      </div>
                    </div>
                    <button className="btn-save" onClick={()=>{saveSection("admission","Admission Note");saveSection("prescription","Prescription");}}>Save Admission Note & Prescription</button>
                  </>
                )}

                {/* ── REPORTS ── */}
                {activeTab === "reports" && (
                  <>
                    <div className="section-card">
                      <div className="section-header">
                        <div className="section-title">🗂️ Reports</div>
                        <div style={{fontSize:12,color:"var(--text3)"}}>
                          Lab: {labReports.length} · Radiology: {radioReports.length} · Total: {fmt(eLabRep.reduce((a,r)=>a+Number(r.amount||0),0))}
                        </div>
                      </div>
                      <div className="sub-tabs">
                        <button className={"sub-tab"+(repSubTab==="lab"?" lab":"")} onClick={()=>setRepSubTab("lab")}>🔬 Lab Reports ({labReports.length})</button>
                        <button className={"sub-tab"+(repSubTab==="radiology"?" radio":"")} onClick={()=>setRepSubTab("radiology")}>🩻 Radiology ({radioReports.length})</button>
                      </div>

                      {repSubTab === "lab" && (
                        <div className="filter-bar">
                          <input className="search-inp" placeholder="Search lab reports..." value={labSearch} onChange={e=>setLabSearch(e.target.value)} />
                          {labTypes.map(t=><button key={t} className={"filter-btn"+(labFilter===t?" sel":"")} onClick={()=>setLabFilter(t)}>{t}</button>)}
                        </div>
                      )}
                      {repSubTab === "radiology" && (
                        <div className="filter-bar">
                          <input className="search-inp" placeholder="Search radiology reports..." value={radioSearch} onChange={e=>setRadioSearch(e.target.value)} />
                          {["All",...RADIO_REPORT_TYPES].map(t=><button key={t} className={"filter-btn"+(radioFilter===t?" sel-radio":"")} onClick={()=>setRadioFilter(t)}>{t}</button>)}
                        </div>
                      )}
                    </div>

                    {/* Lab Reports */}
                    {repSubTab === "lab" && <>
                      {visibleLab.length === 0 && <div className="empty-state" style={{padding:"30px 20px"}}><div className="empty-ico">🔬</div><div className="empty-text">No lab reports found</div></div>}
                      {visibleLab.map(rep => {
                        const ri = eLabRep.findIndex(r=>r.id===rep.id);
                        return (
                          <div key={rep.id} className="report-card">
                            <div className="report-hdr">
                              <div style={{flex:1}}>
                                <input value={rep.reportName} placeholder="Report Name" onChange={e=>updRep(ri,"reportName",e.target.value)} className="report-name-inp" />
                                <div className="report-meta-row">
                                  <span className="report-meta-item">Type: <select value={rep.reportType} onChange={e=>updRep(ri,"reportType",e.target.value)} className="report-meta-sel">{LAB_REPORT_TYPES.map(t=><option key={t} style={{background:"#0a4d68"}}>{t}</option>)}</select></span>
                                  <span className="report-meta-item">Date: <input type="date" value={rep.date} onChange={e=>updRep(ri,"date",e.target.value)} className="report-meta-inp" style={{width:110}} /></span>
                                  <span className="report-meta-item">Ordered by: <input value={rep.orderedBy} placeholder="Doctor" onChange={e=>updRep(ri,"orderedBy",e.target.value)} className="report-meta-inp" /></span>
                                </div>
                              </div>
                              <button className="report-remove-btn" onClick={()=>setELabRep(p=>p.filter((_,i)=>i!==ri))}>Remove</button>
                            </div>
                            <div className="table-wrap" style={{borderRadius:0,border:"none",borderBottom:"1px solid var(--border)"}}>
                              <table className="tbl">
                                <thead><tr><th>Test / Parameter</th><th style={{width:90}}>Value</th><th style={{width:80}}>Unit</th><th style={{width:155}}>Reference Range</th><th style={{width:100}}>Status</th><th style={{width:40}}></th></tr></thead>
                                <tbody>
                                  {rep.tests.map((t,ti)=>(
                                    <tr key={t.id}>
                                      <td><input className="tinp" value={t.name} placeholder="Test name" onChange={e=>updTest(ri,ti,"name",e.target.value)} /></td>
                                      <td><input className="tinp" value={t.value} placeholder="—" onChange={e=>updTest(ri,ti,"value",e.target.value)} className={"tinp val-"+(t.status?.toLowerCase()||"normal")} /></td>
                                      <td><input className="tinp" value={t.unit} placeholder="g/dL" onChange={e=>updTest(ri,ti,"unit",e.target.value)} /></td>
                                      <td><input className="tinp" value={t.refRange} placeholder="13.0 - 17.0" onChange={e=>updTest(ri,ti,"refRange",e.target.value)} /></td>
                                      <td><select className="tsel" value={t.status} onChange={e=>updTest(ri,ti,"status",e.target.value)}><option>Normal</option><option>High</option><option>Low</option></select></td>
                                      <td><button className="del-btn" onClick={()=>delTest(ri,ti)}>✕</button></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <div style={{padding:"6px 16px"}}><button className="add-row-btn" onClick={()=>addTest(ri)}>+ Add Row</button></div>
                            <div className="report-footer">
                              <div style={{flex:1}}><div className="remarks-lbl">Remarks / Interpretation</div><input className="remarks-inp" value={rep.remarks} placeholder="e.g. Mild anaemia noted..." onChange={e=>updRep(ri,"remarks",e.target.value)} /></div>
                              <div className="amount-grp"><div className="amount-lbl">Amount (₹)</div><input className="amount-inp" type="number" value={rep.amount} onChange={e=>updRep(ri,"amount",Number(e.target.value))} /></div>
                            </div>
                          </div>
                        );
                      })}
                      <div style={{display:"flex",gap:14,alignItems:"center",flexWrap:"wrap",marginBottom:16}}>
                        <button className="add-report-btn" onClick={()=>{setELabRep(p=>[...p,emptyLabReport()]);setLabFilter("All");setLabSearch("");}}>+ Add Lab Report</button>
                        <span style={{fontSize:13,color:"var(--text3)"}}>Lab Total: <strong style={{color:"var(--text)"}}>{fmt(labReports.reduce((a,r)=>a+Number(r.amount||0),0))}</strong></span>
                      </div>
                    </>}

                    {/* Radiology Reports */}
                    {repSubTab === "radiology" && <>
                      {visibleRadio.length === 0 && <div className="empty-state" style={{padding:"30px 20px"}}><div className="empty-ico">🩻</div><div className="empty-text">No radiology reports found</div></div>}
                      {visibleRadio.map(rep => {
                        const ri = eLabRep.findIndex(r=>r.id===rep.id);
                        const md = rep.modalityDetails || {};
                        return (
                          <div key={rep.id} className="report-card">
                            <div className="report-hdr radiology">
                              <div style={{flex:1}}>
                                <input value={rep.reportName} placeholder="Report Name (e.g. MRI Brain)" onChange={e=>updRep(ri,"reportName",e.target.value)} className="report-name-inp" />
                                <div className="report-meta-row">
                                  <span className="report-meta-item">Modality: <select value={rep.reportType} onChange={e=>updRep(ri,"reportType",e.target.value)} className="report-meta-sel">{RADIO_REPORT_TYPES.map(t=><option key={t} style={{background:"#4c1d95"}}>{t}</option>)}</select></span>
                                  <span className="report-meta-item">Date: <input type="date" value={rep.date} onChange={e=>updRep(ri,"date",e.target.value)} className="report-meta-inp" style={{width:110}} /></span>
                                  <span className="report-meta-item">Referred by: <input value={rep.orderedBy} placeholder="Doctor" onChange={e=>updRep(ri,"orderedBy",e.target.value)} className="report-meta-inp" /></span>
                                </div>
                              </div>
                              <button className="report-remove-btn" onClick={()=>setELabRep(p=>p.filter((_,i)=>i!==ri))}>Remove</button>
                            </div>
                            <div className="modality-grid">
                              {[{k:"bodyPart",lbl:"Body Part",pl:"e.g. Brain, Knee"},{k:"view",lbl:"View / Sequence",pl:"Axial, PA"},{k:"contrast",lbl:"Contrast",pl:"Yes / No"},{k:"modality",lbl:"Modality",pl:"MRI / CT"}].map(f=>(
                                <div key={f.k}><div className="modality-lbl">{f.lbl}</div><input className="modality-inp" value={md[f.k]||""} placeholder={f.pl} onChange={e=>updModality(ri,f.k,e.target.value)} /></div>
                              ))}
                              <div style={{gridColumn:"1/-1"}}><div className="modality-lbl">Findings</div><textarea className="modality-txt" value={md.findings||""} placeholder="Describe imaging findings..." onChange={e=>updModality(ri,"findings",e.target.value)} /></div>
                              <div style={{gridColumn:"1/-1"}}><div className="modality-lbl">Impression / Conclusion</div><textarea className="modality-txt" value={md.impression||""} placeholder="Radiologist's impression..." onChange={e=>updModality(ri,"impression",e.target.value)} /></div>
                            </div>
                            <div style={{padding:"8px 16px 4px",fontSize:11,fontWeight:700,color:"var(--purple)",textTransform:"uppercase",letterSpacing:".06em"}}>Measurements / Parameters</div>
                            <div className="table-wrap" style={{borderRadius:0,border:"none",borderBottom:"1px solid var(--border)"}}>
                              <table className="tbl">
                                <thead><tr><th>Parameter</th><th style={{width:120}}>Value</th><th style={{width:80}}>Unit</th><th style={{width:155}}>Normal Range</th><th style={{width:100}}>Status</th><th style={{width:40}}></th></tr></thead>
                                <tbody>
                                  {rep.tests.map((t,ti)=>(
                                    <tr key={t.id}>
                                      <td><input className="tinp" value={t.name} placeholder="e.g. Ejection Fraction" onChange={e=>updTest(ri,ti,"name",e.target.value)} /></td>
                                      <td><input className="tinp" value={t.value} placeholder="—" onChange={e=>updTest(ri,ti,"value",e.target.value)} /></td>
                                      <td><input className="tinp" value={t.unit} placeholder="%" onChange={e=>updTest(ri,ti,"unit",e.target.value)} /></td>
                                      <td><input className="tinp" value={t.refRange} placeholder="55 - 70" onChange={e=>updTest(ri,ti,"refRange",e.target.value)} /></td>
                                      <td><select className="tsel" value={t.status} onChange={e=>updTest(ri,ti,"status",e.target.value)}><option>Normal</option><option>High</option><option>Low</option></select></td>
                                      <td><button className="del-btn" onClick={()=>delTest(ri,ti)}>✕</button></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <div style={{padding:"6px 16px"}}><button className="add-row-btn" onClick={()=>addTest(ri)}>+ Add Parameter</button></div>
                            <div className="report-footer">
                              <div style={{flex:1}}><div className="remarks-lbl">Remarks</div><input className="remarks-inp" value={rep.remarks} placeholder="Additional remarks..." onChange={e=>updRep(ri,"remarks",e.target.value)} /></div>
                              <div className="amount-grp"><div className="amount-lbl">Amount (₹)</div><input className="amount-inp" type="number" value={rep.amount} onChange={e=>updRep(ri,"amount",Number(e.target.value))} /></div>
                            </div>
                          </div>
                        );
                      })}
                      <div style={{display:"flex",gap:14,alignItems:"center",flexWrap:"wrap",marginBottom:16}}>
                        <button className="add-radio-btn" onClick={()=>{setELabRep(p=>[...p,emptyRadioReport()]);setRadioFilter("All");setRadioSearch("");}}>+ Add Radiology Report</button>
                        <span style={{fontSize:13,color:"var(--text3)"}}>Radiology Total: <strong style={{color:"var(--text)"}}>{fmt(radioReports.reduce((a,r)=>a+Number(r.amount||0),0))}</strong></span>
                      </div>
                    </>}
                    <button className="btn-save" onClick={()=>saveSection("reports","Reports")}>Save Reports</button>
                  </>
                )}

                {/* ── MEDICINE BILL ── */}
                {activeTab === "med_bill" && (
                  <>
                    <div className="section-card">
                      <div className="section-header"><div className="section-title">💊 Medicine / Pharmacy Bill</div></div>
                      <div className="section-body">
                        <div className="table-wrap">
                          <table className="tbl">
                            <thead><tr><th>Item Description</th><th>Date</th><th style={{width:130}}>Amount (₹)</th><th style={{width:40}}></th></tr></thead>
                            <tbody>
                              {eMedBill.map((r,i)=>(
                                <tr key={r.id}>
                                  <td><input className="tinp" value={r.item} onChange={e=>{const n=[...eMedBill];n[i]={...n[i],item:e.target.value};setEMedBill(n);}}/></td>
                                  <td><input className="tinp" type="date" value={r.date} onChange={e=>{const n=[...eMedBill];n[i]={...n[i],date:e.target.value};setEMedBill(n);}}/></td>
                                  <td><input className="tinp" type="number" value={r.amount} onChange={e=>{const n=[...eMedBill];n[i]={...n[i],amount:Number(e.target.value)};setEMedBill(n);}}/></td>
                                  <td><button className="del-btn" onClick={()=>setEMedBill(p=>p.filter((_,j)=>j!==i))}>✕</button></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <button className="add-row-btn" onClick={()=>setEMedBill(p=>[...p,{id:Date.now(),item:"",date:new Date().toISOString().slice(0,10),amount:0}])}>+ Add Item</button>
                        <div className="totals-box">
                          <div className="total-row final"><span>Medicine Total</span><span>{fmt(eMedBill.reduce((a,r)=>a+Number(r.amount||0),0))}</span></div>
                        </div>
                      </div>
                    </div>
                    <button className="btn-save" onClick={()=>saveSection("medicines","Medicine Bill")}>Save Medicine Bill</button>
                  </>
                )}

                {/* ── FINAL BILL ── */}
                {activeTab === "finalbill" && (
                  <>
                    <div className="bill-grid">
                      <div>
                        <div className="section-card">
                          <div className="section-header"><div className="section-title">🧾 Services & Charges</div></div>
                          <div className="section-body">
                            <div className="table-wrap">
                              <table className="tbl">
                                <thead><tr><th>Service</th><th>Category</th><th style={{width:60}}>Qty</th><th style={{width:90}}>Rate (₹)</th><th style={{width:110}}>Amount</th><th style={{width:40}}></th></tr></thead>
                                <tbody>
                                  {eSvc.map((r,i)=>(
                                    <tr key={r.id}>
                                      <td><input className="tinp" value={r.name} onChange={e=>updSvc(i,"name",e.target.value)} /></td>
                                      <td><input className="tinp" value={r.category} onChange={e=>updSvc(i,"category",e.target.value)} /></td>
                                      <td><input className="tinp" type="number" value={r.qty} onChange={e=>updSvc(i,"qty",e.target.value)} /></td>
                                      <td><input className="tinp" type="number" value={r.rate} onChange={e=>updSvc(i,"rate",e.target.value)} /></td>
                                      <td style={{fontWeight:700,color:"var(--text)"}}>{fmt(r.amount)}</td>
                                      <td><button className="del-btn" onClick={()=>setESvc(p=>p.filter((_,j)=>j!==i))}>✕</button></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <button className="add-row-btn" onClick={()=>setESvc(p=>[...p,{id:Date.now(),name:"",category:"",qty:1,rate:0,amount:0}])}>+ Add Service</button>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="section-card">
                          <div className="section-header"><div className="section-title">💳 Payment Details</div></div>
                          <div className="section-body">
                            <div style={{display:"flex",flexDirection:"column",gap:13}}>
                              <div className="fg">
                                <label className="flbl">Insurance / Scheme</label>
                                <select className="fsel" value={eBilling?.insuranceType||"Cash"} onChange={e=>setEBilling(p=>({...p,insuranceType:e.target.value}))}>
                                  {INSURANCE_TYPES.map(t=><option key={t}>{t}</option>)}
                                </select>
                              </div>
                              {[{k:"discount",lbl:"Discount (₹)"},{k:"advance",lbl:"Advance Paid (₹)"}].map(f=>(
                                <div key={f.k} className="fg">
                                  <label className="flbl">{f.lbl}</label>
                                  <input className="finp" type="number" value={eBilling?.[f.k]||0} onChange={e=>setEBilling(p=>({...p,[f.k]:e.target.value}))} />
                                </div>
                              ))}
                              <div className="fg">
                                <label className="flbl">Payment Mode</label>
                                <select className="fsel" value={eBilling?.paymentMode||"Cash"} onChange={e=>setEBilling(p=>({...p,paymentMode:e.target.value}))}>
                                  {["Cash","UPI","Card","Insurance","NEFT","Cheque"].map(m=><option key={m}>{m}</option>)}
                                </select>
                              </div>
                              <div className="fg">
                                <label className="flbl">Remarks</label>
                                <input className="finp" value={eBilling?.remarks||""} onChange={e=>setEBilling(p=>({...p,remarks:e.target.value}))} />
                              </div>
                            </div>
                            {totals && (
                              <div className="totals-box">
                                <div className="total-row"><span className="total-lbl">Services</span><span className="total-val">{fmt(totals.s)}</span></div>
                                <div className="total-row"><span className="total-lbl">Lab Reports</span><span className="total-val">{fmt(totals.labTotal)}</span></div>
                                <div className="total-row"><span className="total-lbl">Radiology</span><span className="total-val">{fmt(totals.radioTotal)}</span></div>
                                <div className="total-row"><span className="total-lbl">Medicines</span><span className="total-val">{fmt(totals.m)}</span></div>
                                <div className="total-row"><span className="total-lbl">Gross Total</span><span className="total-val">{fmt(totals.gross)}</span></div>
                                <div className="total-row" style={{color:"var(--danger)"}}><span className="total-lbl">Discount</span><span className="total-val">− {fmt(totals.disc)}</span></div>
                                <div className="total-row"><span className="total-lbl">Net Payable</span><span className="total-val">{fmt(totals.net)}</span></div>
                                <div className="total-row" style={{color:"var(--primary)"}}><span className="total-lbl">Advance Paid</span><span className="total-val">− {fmt(totals.adv)}</span></div>
                                <div className="total-row final"><span>Balance Due</span><span>{fmt(totals.due)}</span></div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <button className="btn-save" onClick={()=>saveSection("billing","Final Bill")}>Save Final Bill</button>
                  </>
                )}
              </>
            )}
          </main>
        </div>

        {/* ═══ LOGOUT CONFIRM MODAL ═══ */}
        {showLogout && (
          <div className="overlay" onClick={()=>setShowLogout(false)}>
            <div className="modal logout-modal" onClick={e=>e.stopPropagation()}>
              <div className="modal-header" style={{borderTop:"3px solid var(--danger)",borderRadius:"14px 14px 0 0"}}>
                <div>
                  <div className="modal-title">Sign Out</div>
                  <div className="modal-sub">Are you sure you want to sign out of the Billing Portal?</div>
                </div>
                <button className="modal-close" onClick={()=>setShowLogout(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div style={{background:"var(--warning-bg)",border:"1px solid var(--warning-border)",borderRadius:8,padding:"12px 14px",fontSize:13,color:"var(--warning)",display:"flex",alignItems:"center",gap:8}}>
                  <span>⚠</span> Any unsaved changes will be lost.
                </div>
                <div style={{marginTop:14,fontSize:13,color:"var(--text2)"}}>
                  <div style={{marginBottom:6}}><strong>Signed in as:</strong> {CURRENT_USER.name}</div>
                  <div><strong>Role:</strong> {CURRENT_USER.role} &nbsp;·&nbsp; {CURRENT_USER.empId}</div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-ghost" onClick={()=>setShowLogout(false)}>Cancel</button>
                <button className="btn-primary" style={{background:"var(--danger)"}} onClick={()=>{setShowLogout(false);setView("loggedout");}}>
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ SUBMIT CONFIRM MODAL ═══ */}
        {showConfirm && (
          <div className="overlay" onClick={()=>setShowConfirm(false)}>
            <div className="modal" onClick={e=>e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <div className="modal-title">Submit Billing File to HOD</div>
                  <div className="modal-sub">Submitting complete billing file for <strong>{sel?.patientName}</strong> ({sel?.uhid})</div>
                </div>
                <button className="modal-close" onClick={()=>setShowConfirm(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div style={{marginBottom:12,fontSize:12,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:".07em"}}>Section Status</div>
                <div className="checklist-preview">
                  {SECTION_KEYS.map(k=>(
                    <div key={k} className="preview-row">
                      <span>{eSaved[k]?"✅":"⚠️"}</span>
                      <span style={{color:eSaved[k]?"var(--success)":"var(--warning)",fontWeight:600}}>
                        {SECTION_LABELS[k]}
                      </span>
                      <span style={{marginLeft:"auto",fontSize:12,color:eSaved[k]?"var(--success)":"var(--warning)"}}>
                        {eSaved[k]?"Saved":"Pending"}
                      </span>
                    </div>
                  ))}
                  {isTPA && (
                    <div className="preview-row">
                      <span>🏷</span>
                      <span style={{color:"#d97706",fontWeight:600}}>{eBilling?.insuranceType} Documents</span>
                      <span style={{marginLeft:"auto",fontSize:12,color:"#d97706"}}>
                        {Object.values(eTpaDocStatus).filter(Boolean).length}/{TPA_DOCS.length} ready
                      </span>
                    </div>
                  )}
                </div>
                <div className="detail-preview">
                  <div className="detail-row"><span className="detail-key">Patient:</span><span>{sel?.patientName}, {sel?.age}y, {sel?.gender}</span></div>
                  <div className="detail-row"><span className="detail-key">Diagnosis:</span><span>{sel?.diagnosis}</span></div>
                  <div className="detail-row"><span className="detail-key">Admission:</span><span>{fmtDt(sel?.doa)}</span></div>
                  {totals && <div className="detail-row"><span className="detail-key">Total Bill:</span><span style={{fontWeight:700}}>{fmt(totals.gross)} &nbsp;|&nbsp; Balance Due: {fmt(totals.due)}</span></div>}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-ghost" onClick={()=>setShowConfirm(false)}>Cancel</button>
                <button className="btn-primary btn-success" onClick={completeTask}>
                  ✓ Confirm & Submit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ TPA DOC MODAL ═══ */}
        {tpaDocModal && (
          <div className="overlay" onClick={()=>setTpaDocModal(null)}>
            <div className="modal tpa-modal" onClick={e=>e.stopPropagation()}>
              <div className="modal-header" style={{borderTop:"3px solid #d97706",borderRadius:"14px 14px 0 0"}}>
                <div>
                  <div className="modal-title">{tpaDocModal.ico} {tpaDocModal.label}</div>
                  <div className="modal-sub">
                    Generate or verify for <strong>{sel?.patientName}</strong> ({sel?.uhid})<br/>
                    <span style={{color:(INS_CONFIG[eBilling?.insuranceType]||INS_CONFIG["Cash"]).color,fontWeight:700}}>{eBilling?.insuranceType}</span>
                    {eTpaInfo?.policyNo && <> &nbsp;·&nbsp; Policy: <strong>{eTpaInfo.policyNo}</strong></>}
                    {eTpaInfo?.authNo && <> &nbsp;·&nbsp; Auth: <strong>{eTpaInfo.authNo}</strong></>}
                  </div>
                </div>
                <button className="modal-close" onClick={()=>setTpaDocModal(null)}>✕</button>
              </div>
              <div className="modal-body">
                <div style={{fontSize:12,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:10}}>Document Preview</div>
                <div className="detail-preview">
                  <div className="detail-row"><span className="detail-key">Patient:</span><span>{sel?.patientName}, {sel?.age}y, {sel?.gender}</span></div>
                  <div className="detail-row"><span className="detail-key">Diagnosis:</span><span>{sel?.diagnosis}</span></div>
                  <div className="detail-row"><span className="detail-key">Admission:</span><span>{fmtDt(sel?.doa)} → Discharge: {sel?.dod ? fmtDt(sel.dod) : "Active"}</span></div>
                  <div className="detail-row"><span className="detail-key">Doctor:</span><span>{sel?.doctor}</span></div>
                  {totals && <div className="detail-row"><span className="detail-key">Total Bill:</span><span style={{fontWeight:700}}>{fmt(totals.gross)} &nbsp;|&nbsp; Payable: {fmt(totals.net)}</span></div>}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-ghost" onClick={()=>setTpaDocModal(null)}>Cancel</button>
                <button className="btn-primary" onClick={()=>markTpaDoc(tpaDocModal.id)}>
                  ✓ Mark as Ready
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ TOASTS ═══ */}
        <div className="toast-wrap">
          {toasts.map(t=>(
            <div key={t.id} className={"toast "+(t.type||"success")}>
              {t.type==="error" ? "✕" : "✓"} {t.msg}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}