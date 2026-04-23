import { useState, useEffect } from "react";
import { apiService } from "../services/apiService";

const CURRENT_USER = { name: "Priya Sharma", empId: "EMP-2041" };

const MOCK_PATIENTS = [
  {
    uhid: "LNM-0041", admNo: "ADM/2026/041", branch: "Laxmi Nagar Branch",
    patientName: "Rajan Sharma", age: 54, gender: "Male",
    phone: "9876543210", doa: "2026-04-10T09:00", dod: "2026-04-16T12:00", expectedDod: "2026-04-17T00:00",
    ward: "General", bed: "G-12", doctor: "Dr. Meena Kapoor",
    diagnosis: "Type-2 Diabetes", status: "discharged", taskStatus: "pending",
    saved: { discharge: false, admission: false, reports: false, medicines: false, billing: false },
    discharge: { doa: "2026-04-10T09:00", dod: "2026-04-16T12:00", expectedDod: "2026-04-17T00:00", ward: "General", bed: "G-12", doctor: "Dr. Meena Kapoor", diagnosis: "Type-2 Diabetes", condition: "Stable", instructions: "Low sugar diet, follow up in 2 weeks", notes: "" },
    medicalHistory: { previousDiagnosis: "Hypertension", pastSurgeries: "Appendectomy 2010", currentMedications: "Metformin 500mg", treatingDoctor: "Dr. Meena Kapoor", knownAllergies: "Penicillin", chronicConditions: "Diabetes, Hypertension", familyHistory: "Father had diabetes", smokingStatus: "Non-smoker", alcoholUse: "Occasional", notes: "Patient cooperative" },
    services: [
      { id: 1, name: "Room Charges", category: "Ward", qty: 6, rate: 800, amount: 4800 },
      { id: 2, name: "Doctor Visit", category: "Consultation", qty: 3, rate: 500, amount: 1500 },
      { id: 3, name: "IV Fluids", category: "Pharmacy", qty: 4, rate: 120, amount: 480 },
    ],
    labReports: [
      {
        id: 1, reportName: "Complete Blood Count (CBC)", reportType: "Pathology",
        date: "2026-04-11", orderedBy: "Dr. Meena Kapoor", amount: 350, remarks: "Mild anaemia noted.",
        tests: [
          { id: 1, name: "Haemoglobin",    value: "11.2",   unit: "g/dL",       refRange: "13.0 - 17.0",     status: "Low" },
          { id: 2, name: "Total WBC",      value: "8400",   unit: "/uL",        refRange: "4000 - 11000",    status: "Normal" },
          { id: 3, name: "Platelets",      value: "210000", unit: "/uL",        refRange: "150000 - 400000", status: "Normal" },
          { id: 4, name: "RBC Count",      value: "4.1",    unit: "million/uL", refRange: "4.5 - 5.9",       status: "Low" },
          { id: 5, name: "PCV/Hematocrit", value: "34",     unit: "%",          refRange: "40 - 54",         status: "Low" },
          { id: 6, name: "MCV",            value: "82",     unit: "fL",         refRange: "80 - 100",        status: "Normal" },
        ],
      },
      {
        id: 2, reportName: "Lipid Profile", reportType: "Biochemistry",
        date: "2026-04-12", orderedBy: "Dr. Meena Kapoor", amount: 500, remarks: "Dyslipidaemia. Statin therapy advised.",
        tests: [
          { id: 1, name: "Total Cholesterol", value: "214", unit: "mg/dL", refRange: "< 200", status: "High" },
          { id: 2, name: "LDL Cholesterol",   value: "138", unit: "mg/dL", refRange: "< 130", status: "High" },
          { id: 3, name: "HDL Cholesterol",   value: "42",  unit: "mg/dL", refRange: "> 40",  status: "Normal" },
          { id: 4, name: "Triglycerides",     value: "178", unit: "mg/dL", refRange: "< 150", status: "High" },
        ],
      },
      {
        id: 3, reportName: "Chest X-Ray", reportType: "Radiology",
        date: "2026-04-11", orderedBy: "Dr. Meena Kapoor", amount: 600, remarks: "No active consolidation. Heart size normal.",
        tests: [
          { id: 1, name: "Lung Fields",          value: "Clear",  unit: "--", refRange: "Clear",  status: "Normal" },
          { id: 2, name: "Heart Size",            value: "Normal", unit: "--", refRange: "Normal", status: "Normal" },
          { id: 3, name: "Costophrenic Angles",  value: "Acute",  unit: "--", refRange: "Acute",  status: "Normal" },
        ],
      },
    ],
    medicalBill: [
      { id: 1, item: "Metformin 500mg x30",    date: "2026-04-10", amount: 180 },
      { id: 2, item: "Normal Saline 500ml x4", date: "2026-04-11", amount: 200 },
    ],
    billing: { discount: 500, advance: 2000, paymentMode: "Cash", remarks: "" }
  },
  {
    uhid: "LNM-0042", admNo: "ADM/2026/042", branch: "Laxmi Nagar Branch",
    patientName: "Sunita Verma", age: 38, gender: "Female",
    phone: "9123456780", doa: "2026-04-13T11:30", dod: "", expectedDod: "2026-04-24T11:00",
    ward: "Private", bed: "P-03", doctor: "Dr. Arvind Singh",
    diagnosis: "Viral Fever", status: "admitted", taskStatus: "pending",
    saved: { discharge: false, admission: false, reports: false, medicines: false, billing: false },
    discharge: { doa: "2026-04-13T11:30", dod: "", expectedDod: "2026-04-24T11:00", ward: "Private", bed: "P-03", doctor: "Dr. Arvind Singh", diagnosis: "Viral Fever", condition: "", instructions: "", notes: "" },
    medicalHistory: { previousDiagnosis: "None", pastSurgeries: "None", currentMedications: "Paracetamol", treatingDoctor: "Dr. Arvind Singh", knownAllergies: "None", chronicConditions: "None", familyHistory: "None", smokingStatus: "Non-smoker", alcoholUse: "None", notes: "" },
    services: [
      { id: 1, name: "Room Charges", category: "Ward", qty: 3, rate: 2000, amount: 6000 },
      { id: 2, name: "Doctor Visit", category: "Consultation", qty: 2, rate: 800, amount: 1600 },
    ],
    labReports: [
      {
        id: 1, reportName: "Complete Blood Count (CBC)", reportType: "Pathology",
        date: "2026-04-13", orderedBy: "Dr. Arvind Singh", amount: 250, remarks: "Leukocytosis with neutrophilia - suggestive of infection.",
        tests: [
          { id: 1, name: "Haemoglobin",  value: "12.8",  unit: "g/dL", refRange: "12.0 - 16.0",  status: "Normal" },
          { id: 2, name: "Total WBC",    value: "13200", unit: "/uL",  refRange: "4000 - 11000", status: "High" },
          { id: 3, name: "Platelets",    value: "180000",unit: "/uL",  refRange: "150000 - 400000", status: "Normal" },
          { id: 4, name: "Neutrophils",  value: "78",    unit: "%",    refRange: "40 - 70",      status: "High" },
          { id: 5, name: "Lymphocytes",  value: "17",    unit: "%",    refRange: "20 - 45",      status: "Low" },
        ],
      },
    ],
    medicalBill: [{ id: 1, item: "Paracetamol 500mg x20", date: "2026-04-13", amount: 80 }],
    billing: { discount: 0, advance: 5000, paymentMode: "UPI", remarks: "" }
  },
  {
    uhid: "LNM-0039", admNo: "ADM/2026/039", branch: "Laxmi Nagar Branch",
    patientName: "Mohd. Akhtar", age: 62, gender: "Male",
    phone: "9988776655", doa: "2026-04-08T08:00", dod: "2026-04-15T10:00", expectedDod: "2026-04-15T00:00",
    ward: "ICU", bed: "ICU-2", doctor: "Dr. Priya Nair",
    diagnosis: "Cardiac Arrest", status: "discharged", taskStatus: "completed",
    saved: { discharge: true, admission: true, reports: true, medicines: true, billing: true },
    discharge: { doa: "2026-04-08T08:00", dod: "2026-04-15T10:00", expectedDod: "2026-04-15T00:00", ward: "ICU", bed: "ICU-2", doctor: "Dr. Priya Nair", diagnosis: "Cardiac Arrest", condition: "Recovering", instructions: "Strict bed rest, cardiac diet", notes: "Follow up in 1 week" },
    medicalHistory: { previousDiagnosis: "Angina", pastSurgeries: "Angioplasty 2018", currentMedications: "Aspirin, Statins", treatingDoctor: "Dr. Priya Nair", knownAllergies: "None", chronicConditions: "Heart Disease", familyHistory: "Father had MI", smokingStatus: "Ex-smoker", alcoholUse: "None", notes: "High risk patient" },
    services: [
      { id: 1, name: "ICU Charges",        category: "Ward",         qty: 7, rate: 5000, amount: 35000 },
      { id: 2, name: "Cardiology Consult", category: "Consultation", qty: 5, rate: 1200, amount: 6000 },
      { id: 3, name: "ECG",                category: "Procedure",    qty: 3, rate: 300,  amount: 900 },
      { id: 4, name: "Oxygen Therapy",     category: "Procedure",    qty: 7, rate: 200,  amount: 1400 },
    ],
    labReports: [
      {
        id: 1, reportName: "Cardiac Markers Panel", reportType: "Biochemistry",
        date: "2026-04-08", orderedBy: "Dr. Priya Nair", amount: 1800, remarks: "Markedly elevated cardiac markers - consistent with acute MI.",
        tests: [
          { id: 1, name: "Troponin I", value: "4.8", unit: "ng/mL", refRange: "< 0.04", status: "High" },
          { id: 2, name: "CK-MB",      value: "68",  unit: "U/L",   refRange: "< 25",   status: "High" },
          { id: 3, name: "BNP",        value: "820", unit: "pg/mL", refRange: "< 100",  status: "High" },
          { id: 4, name: "D-Dimer",    value: "0.9", unit: "ug/mL", refRange: "< 0.5",  status: "High" },
        ],
      },
      {
        id: 2, reportName: "2D Echo", reportType: "Cardiology",
        date: "2026-04-09", orderedBy: "Dr. Priya Nair", amount: 2200, remarks: "EF 35%. Moderate LV dysfunction.",
        tests: [
          { id: 1, name: "Ejection Fraction", value: "35", unit: "%",  refRange: "55 - 70", status: "Low" },
          { id: 2, name: "LVEDD",             value: "58", unit: "mm", refRange: "42 - 55", status: "High" },
          { id: 3, name: "LVESD",             value: "48", unit: "mm", refRange: "25 - 40", status: "High" },
        ],
      },
    ],
    medicalBill: [
      { id: 1, item: "Aspirin 75mg x30",      date: "2026-04-08", amount: 60 },
      { id: 2, item: "Atorvastatin 20mg x30", date: "2026-04-08", amount: 180 },
      { id: 3, item: "Heparin injection x5",  date: "2026-04-09", amount: 750 },
    ],
    billing: { discount: 2000, advance: 20000, paymentMode: "Insurance", remarks: "Insurance claim filed" }
  },
  {
    uhid: "RYA-0044", admNo: "ADM/2026/044", branch: "Raya Branch",
    patientName: "Kavita Joshi", age: 45, gender: "Female",
    phone: "9871234560", doa: "2026-04-18T14:00", dod: "", expectedDod: "2026-04-25T14:00",
    ward: "Semi-Private", bed: "SP-07", doctor: "Dr. Rahul Gupta",
    diagnosis: "Acute Appendicitis", status: "admitted", taskStatus: "pending",
    saved: { discharge: false, admission: false, reports: false, medicines: false, billing: false },
    discharge: { doa: "2026-04-18T14:00", dod: "", expectedDod: "2026-04-25T14:00", ward: "Semi-Private", bed: "SP-07", doctor: "Dr. Rahul Gupta", diagnosis: "Acute Appendicitis", condition: "", instructions: "", notes: "" },
    medicalHistory: { previousDiagnosis: "GERD", pastSurgeries: "None", currentMedications: "Pantoprazole", treatingDoctor: "Dr. Rahul Gupta", knownAllergies: "Sulfa drugs", chronicConditions: "GERD", familyHistory: "None", smokingStatus: "Non-smoker", alcoholUse: "None", notes: "" },
    services: [
      { id: 1, name: "Room Charges",    category: "Ward",      qty: 4, rate: 1500,  amount: 6000 },
      { id: 2, name: "Surgery Charges", category: "Procedure", qty: 1, rate: 25000, amount: 25000 },
      { id: 3, name: "Anaesthesia",     category: "Procedure", qty: 1, rate: 8000,  amount: 8000 },
      { id: 4, name: "OT Charges",      category: "Procedure", qty: 1, rate: 5000,  amount: 5000 },
    ],
    labReports: [
      {
        id: 1, reportName: "Pre-Op Panel", reportType: "Pathology",
        date: "2026-04-18", orderedBy: "Dr. Rahul Gupta", amount: 1800, remarks: "Leukocytosis + raised CRP - acute inflammation.",
        tests: [
          { id: 1, name: "Haemoglobin",      value: "13.1", unit: "g/dL",  refRange: "12.0 - 16.0", status: "Normal" },
          { id: 2, name: "Total WBC",        value: "14800",unit: "/uL",   refRange: "4000 - 11000",status: "High" },
          { id: 3, name: "CRP",              value: "48",   unit: "mg/L",  refRange: "< 5",         status: "High" },
          { id: 4, name: "Serum Creatinine", value: "0.8",  unit: "mg/dL", refRange: "0.5 - 1.1",   status: "Normal" },
        ],
      },
      {
        id: 2, reportName: "USG Abdomen", reportType: "Radiology",
        date: "2026-04-18", orderedBy: "Dr. Rahul Gupta", amount: 1200, remarks: "Thickened appendix. Suggestive of acute appendicitis.",
        tests: [
          { id: 1, name: "Appendix Diameter", value: "9",       unit: "mm", refRange: "< 6",    status: "High" },
          { id: 2, name: "Free Fluid",        value: "Present", unit: "--", refRange: "Absent", status: "High" },
          { id: 3, name: "Liver",             value: "Normal",  unit: "--", refRange: "Normal", status: "Normal" },
        ],
      },
    ],
    medicalBill: [
      { id: 1, item: "IV Antibiotics x5 days", date: "2026-04-18", amount: 1800 },
      { id: 2, item: "Post-op medications",    date: "2026-04-19", amount: 650 },
    ],
    billing: { discount: 0, advance: 15000, paymentMode: "Card", remarks: "" }
  },
];

const fmt = (n) => "Rs." + Number(n || 0).toLocaleString("en-IN");
const fmtDt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "--";
const fmtDtShort = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "--";

function calcTotals(svcs, labReports, med, billing) {
  const s = svcs.reduce((a, r) => a + Number(r.amount || 0), 0);
  const p = labReports.reduce((a, r) => a + Number(r.amount || 0), 0);
  const m = med.reduce((a, r) => a + Number(r.amount || 0), 0);
  const gross = s + p + m;
  const disc = Number(billing?.discount || 0);
  const adv  = Number(billing?.advance  || 0);
  return { s, p, m, gross, disc, adv, net: gross - disc, due: gross - disc - adv };
}

function normalizeServices(services = []) {
  return services.map((service, index) => ({
    id: service.id || `${service.svcName || service.title || "svc"}-${index}`,
    name: service.svcName || service.title || "",
    category: service.svcCat || service.type || "",
    qty: Number(service.svcQty ?? service.qty ?? 1),
    rate: Number(service.svcRate ?? service.rate ?? 0),
    amount: Number(service.svcTot ?? service.total ?? ((service.svcRate ?? service.rate ?? 0) * (service.svcQty ?? service.qty ?? 1))),
    date: service.svcDate || service.date || "",
  }));
}

function mapLivePatients(records = []) {
  return records.flatMap((patient) => {
    const admissions = Array.isArray(patient.admissions) ? patient.admissions : [];
    return admissions.map((adm, index) => {
      const allServices = normalizeServices(adm.services || []);
      const pathologyBill = allServices.filter((service) => String(service.category || "").toLowerCase().includes("path"));
      const medicalBill = allServices.filter((service) => String(service.category || "").toLowerCase().includes("med"));
      const directServices = allServices.filter((service) => {
        const category = String(service.category || "").toLowerCase();
        return !category.includes("path") && !category.includes("med");
      });
      const discharge = adm.discharge || {};
      const medicalHistory = adm.medicalHistory || {};
      return {
        uhid: patient.uhid,
        admNo: adm.admNo,
        assignedTo: "billing_user",
        patientName: patient.patientName,
        age: patient.ageYY || patient.age || "—",
        gender: patient.gender,
        phone: patient.phone,
        address: patient.address,
        doa: discharge.doa || adm.dateTime || "",
        dod: discharge.dod || "",
        ward: discharge.wardName || "",
        bed: discharge.bedNo || discharge.roomNo || "",
        doctor: discharge.doctorName || medicalHistory.treatingDoctor || "",
        diagnosis: discharge.diagnosis || medicalHistory.previousDiagnosis || "",
        status: discharge.dod ? "discharged" : "admitted",
        taskStatus: ["PENDING", "APPROVED"].includes(adm.billing?.printStatus) ? "submitted" : "pending",
        discharge: {
          doa: discharge.doa || adm.dateTime || "",
          dod: discharge.dod || "",
          ward: discharge.wardName || "",
          bed: discharge.bedNo || discharge.roomNo || "",
          doctor: discharge.doctorName || "",
          diagnosis: discharge.diagnosis || "",
          condition: discharge.dischargeStatus || "",
          instructions: discharge.instructions || "",
          notes: discharge.notes || "",
        },
        medicalHistory: {
          previousDiagnosis: medicalHistory.previousDiagnosis || "",
          pastSurgeries: medicalHistory.pastSurgeries || "",
          currentMedications: medicalHistory.currentMedications || "",
          treatingDoctor: medicalHistory.treatingDoctor || "",
          knownAllergies: medicalHistory.knownAllergies || "",
          chronicConditions: medicalHistory.chronicConditions || "",
          familyHistory: medicalHistory.familyHistory || "",
          smokingStatus: medicalHistory.smokingStatus || "",
          alcoholUse: medicalHistory.alcoholUse || "",
          notes: medicalHistory.notes || "",
        },
        services: directServices,
        pathologyBill: pathologyBill.map((service) => ({
          id: service.id,
          test: service.name,
          date: service.date,
          amount: service.amount,
        })),
        medicalBill: medicalBill.map((service) => ({
          id: service.id,
          item: service.name,
          date: service.date,
          amount: service.amount,
        })),
        billing: {
          id: adm.billing?.id,
          discount: Number(adm.billing?.discount || 0),
          advance: Number(adm.billing?.advance || 0),
          paidNow: Number(adm.billing?.paidNow || 0),
          paymentMode: adm.billing?.paymentMode || "",
          remarks: adm.billing?.remarks || "",
          printStatus: adm.billing?.printStatus || "DRAFT",
        },
      };
    });
  });
}

function buildDischargePayload(form) {
  return {
    doa: form.doa || "",
    dod: form.dod || "",
    wardName: form.ward || "",
    bedNo: form.bed || "",
    roomNo: form.bed || "",
    doctorName: form.doctor || "",
    diagnosis: form.diagnosis || "",
    dischargeStatus: form.condition || "",
    notes: form.notes || "",
  };
}

function buildServicePayload(service, fallbackCategory) {
  const qty = Number(service.qty || 1);
  const rate = Number(service.rate || service.amount || 0);
  return {
    svcName: service.name,
    svcCat: service.category || fallbackCategory,
    svcQty: qty,
    svcRate: rate,
    svcDate: service.date || new Date().toISOString().slice(0, 10),
    rate,
    qty,
  };
}

const SECTION_KEYS   = ["discharge","admission","reports","medicines","billing"];
const SECTION_LABELS = { discharge:"Discharge Summary", admission:"Admission Note", reports:"Reports", medicines:"Medicine Bill", billing:"Final Bill" };
const SECTION_ICONS  = { discharge:"P", admission:"A", reports:"R", medicines:"M", billing:"B" };
const TAB_MAP        = { discharge:"discharge", admission:"medical", reports:"reports", medicines:"med_bill", billing:"finalbill" };
const REPORT_TYPES   = ["Pathology","Biochemistry","Radiology","Cardiology","Microbiology","Histopathology","Haematology","Serology","Other"];
const emptyReport    = () => ({ id: Date.now(), reportName:"", reportType:"Pathology", date: new Date().toISOString().slice(0,10), orderedBy:"", amount:0, remarks:"", tests:[{ id: Date.now(), name:"", value:"", unit:"", refRange:"", status:"Normal" }] });
let _tid = 0;
let tid = 0;

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --navy:#0B1929;--navy2:#0f2035;
  --bg:#f0f4f9;--bg2:#e6ecf4;--white:#fff;
  --border:#d0dae8;--border2:#b8c8dc;
  --text:#0B1929;--text2:#3d5a7a;--text3:#6b88a8;
  --teal:#0d7c72;--teal2:#0a6560;--tealBg:#e6f5f4;
  --amber:#b45309;--amberBg:#fef3cd;
  --red:#b91c1c;--redBg:#fde8e8;
  --blue:#1d4ed8;--blueBg:#e8effe;
  --green:#15803d;--greenBg:#dcfce7;
  --r:10px;--r2:14px;
  --sh:0 2px 16px rgba(11,25,41,.10);--sh2:0 6px 32px rgba(11,25,41,.14);
}
body{background:var(--bg);color:var(--text);font-family:'Plus Jakarta Sans',sans-serif;font-size:14px}
.app{display:flex;flex-direction:column;min-height:100vh}
.layout{display:flex;flex:1}
.main{flex:1;overflow-y:auto;padding:28px 32px}

.topbar{height:60px;background:var(--navy);display:flex;align-items:center;padding:0 28px;justify-content:space-between;position:sticky;top:0;z-index:200;box-shadow:0 2px 12px rgba(0,0,0,.25)}
.logo{width:38px;height:38px;border-radius:9px;background:linear-gradient(135deg,#0d7c72,#14b8a6);display:flex;align-items:center;justify-content:center;font-family:'Instrument Serif',serif;font-style:italic;color:#fff;font-size:17px;flex-shrink:0}
.brand-name{font-size:15px;font-weight:700;color:#fff}
.brand-sub{font-size:11px;color:rgba(255,255,255,.4);letter-spacing:.05em;text-transform:uppercase}
.user-av{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#0d7c72,#1d4ed8);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff}
.user-nm{font-size:13px;font-weight:600;color:#fff}
.user-id{font-size:11px;color:rgba(255,255,255,.4)}
.so-btn{padding:6px 14px;border-radius:7px;font-size:12px;font-weight:600;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:rgba(255,255,255,.7);cursor:pointer;font-family:inherit}
.so-btn:hover{background:rgba(255,255,255,.15);color:#fff}

.sidebar{width:210px;min-width:210px;background:var(--white);border-right:1px solid var(--border);display:flex;flex-direction:column;padding:20px 10px;position:sticky;top:60px;height:calc(100vh - 60px);overflow-y:auto}
.slbl{font-size:10px;font-weight:700;color:var(--text3);letter-spacing:.1em;text-transform:uppercase;padding:0 10px 8px}
.si{display:flex;align-items:center;gap:9px;padding:9px 11px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;color:var(--text2);transition:.13s;position:relative}
.si:hover{background:var(--bg);color:var(--text)}
.si.act{background:var(--tealBg);color:var(--teal);font-weight:700}
.si.act::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:3px;height:20px;background:var(--teal);border-radius:0 3px 3px 0}
.sbdg{margin-left:auto;background:var(--amber);color:#fff;border-radius:20px;font-size:10px;font-weight:700;padding:2px 7px}
.shr{height:1px;background:var(--border);margin:12px 10px}
.smr{display:flex;justify-content:space-between;padding:5px 11px;font-size:12px;border-bottom:1px solid var(--border)}
.smr:last-child{border-bottom:none}
.smrl{color:var(--text3)}

.pgh{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:22px}
.pgt{font-family:'Instrument Serif',serif;font-size:24px;color:var(--navy)}
.pgs{font-size:12px;color:var(--text3);margin-top:3px}
.dchip{padding:7px 14px;border-radius:8px;font-size:12px;font-weight:600;background:var(--white);border:1px solid var(--border);color:var(--text2);white-space:nowrap}

.srow{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:26px}
.sc{background:var(--white);border:1px solid var(--border);border-radius:var(--r2);padding:18px 20px;position:relative;overflow:hidden}
.sc::after{content:'';position:absolute;bottom:0;left:0;right:0;height:3px}
.sc.c1::after{background:var(--teal)}.sc.c2::after{background:var(--amber)}.sc.c3::after{background:var(--blue)}
.scv{font-family:'Instrument Serif',serif;font-size:30px;line-height:1;margin-bottom:4px}
.sc.c1 .scv{color:var(--teal)}.sc.c2 .scv{color:var(--amber)}.sc.c3 .scv{color:var(--blue)}
.scl{font-size:12px;color:var(--text3);font-weight:500}

.tgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:14px}
.tc{background:var(--white);border:1px solid var(--border);border-radius:var(--r2);padding:18px 20px;cursor:pointer;transition:.18s}
.tc:hover{border-color:var(--teal);box-shadow:var(--sh2);transform:translateY(-2px)}
.tctp{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px;gap:8px}
.tcnm{font-size:15px;font-weight:700;color:var(--navy)}
.tcid{font-size:11px;color:var(--text3);font-family:monospace;margin-top:2px}
.tcrs{margin-bottom:10px;display:flex;flex-direction:column;gap:5px}
.tcrw{display:flex;align-items:center;gap:7px;font-size:12px;color:var(--text2)}
.tcri{width:16px;text-align:center;color:var(--text3);flex-shrink:0}
.tc-dod{display:flex;gap:0;margin-bottom:12px;background:var(--bg);border-radius:8px;border:1px solid var(--border);overflow:hidden}
.tc-dod-item{flex:1;padding:8px 10px;display:flex;flex-direction:column;gap:2px;border-right:1px solid var(--border)}
.tc-dod-item:last-child{border-right:none}
.tc-dod-lbl{font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.07em}
.tc-dod-val{font-size:12px;font-weight:700;color:var(--navy)}
.tc-dod-val.exp{color:var(--amber)}
.tc-dod-val.dis{color:var(--teal)}
.tcch{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}
.tcft{display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px solid var(--border)}
.tcdoa{font-size:11px;color:var(--text3)}
.tcpb{margin-bottom:12px}
.tcpbar{height:4px;background:var(--border);border-radius:4px;overflow:hidden;margin-top:5px}
.tcpfil{height:100%;background:var(--teal);border-radius:4px;transition:width .3s}
.tcplbl{font-size:11px;color:var(--text3)}

.badge{display:inline-flex;align-items:center;gap:4px;padding:4px 9px;border-radius:20px;font-size:11px;font-weight:700;white-space:nowrap}
.ba{background:var(--amberBg);color:var(--amber)}
.bt{background:var(--tealBg);color:var(--teal)}
.bb{background:var(--blueBg);color:var(--blue)}
.bg{background:var(--greenBg);color:var(--green)}
.chip{padding:3px 9px;border-radius:20px;font-size:11px;font-weight:600;background:var(--bg2);color:var(--text2);border:1px solid var(--border)}

.back-btn{display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:600;color:var(--text2);cursor:pointer;background:var(--white);border:1px solid var(--border);border-radius:8px;padding:7px 15px;font-family:inherit;transition:.14s;margin-bottom:20px}
.back-btn:hover{color:var(--navy);border-color:var(--navy)}

.dhdr{background:var(--white);border:1px solid var(--border);border-radius:var(--r2);padding:20px 24px;margin-bottom:10px}
.dname{font-family:'Instrument Serif',serif;font-size:22px;color:var(--navy);margin-bottom:4px}
.dmeta{font-size:13px;color:var(--text2);margin-bottom:10px}
.dmeta strong{color:var(--navy)}
.dod-strip{display:flex;gap:0;background:var(--bg);border-radius:10px;border:1px solid var(--border);overflow:hidden;margin-top:12px}
.dod-strip-item{flex:1;padding:10px 16px;display:flex;flex-direction:column;gap:3px;border-right:1px solid var(--border)}
.dod-strip-item:last-child{border-right:none}
.dod-strip-lbl{font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.07em}
.dod-strip-val{font-size:13px;font-weight:700;color:var(--navy)}
.dod-strip-val.exp{color:var(--amber)}
.dod-strip-val.dis{color:var(--teal)}
.dod-strip-val.dia{color:var(--blue)}

.clpanel{background:var(--white);border:1px solid var(--border);border-radius:var(--r2);padding:18px 20px;margin-bottom:18px}
.cltitle{font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.09em;margin-bottom:14px}
.clsteps{display:flex;align-items:center;margin-bottom:16px}
.clstep{display:flex;align-items:center;gap:8px;flex:1;min-width:0;padding:9px 10px;border-radius:9px;cursor:pointer;transition:.13s}
.clstep:hover{background:var(--bg)}
.clstep.done{background:var(--tealBg)}
.clstep.cur{background:var(--blueBg)}
.clchk{width:26px;height:26px;border-radius:50%;border:2px solid var(--border2);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:11px;font-weight:700;background:var(--white);color:var(--text3)}
.clstep.done .clchk{background:var(--teal);border-color:var(--teal);color:#fff}
.clstep.cur .clchk{border-color:var(--blue);color:var(--blue)}
.cllbl{font-size:11px;font-weight:600;color:var(--text2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.clstep.done .cllbl{color:var(--teal)}
.clstep.cur .cllbl{color:var(--blue)}
.clcon{width:14px;height:2px;background:var(--border);flex-shrink:0}
.clcon.done{background:var(--teal)}
.clfoot{border-top:1px solid var(--border);padding-top:14px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}
.clmsg-ok{font-size:13px;color:var(--teal);font-weight:600}
.clmsg-pend{font-size:13px;color:var(--text3)}
.clmsg-cnt{color:var(--amber);font-weight:700}

.hod-btn{padding:10px 22px;border-radius:8px;font-size:13px;font-weight:700;background:var(--teal);color:#fff;border:none;cursor:pointer;font-family:inherit;transition:.16s;box-shadow:0 3px 10px rgba(13,124,114,.2)}
.hod-btn:hover{background:var(--teal2);transform:translateY(-1px)}
.hod-btn:disabled{opacity:.4;cursor:not-allowed;transform:none;box-shadow:none}
.done-bdg{padding:10px 18px;border-radius:8px;background:var(--tealBg);border:1px solid rgba(13,124,114,.25);color:var(--teal);font-weight:700;font-size:13px}
.savebtn{padding:10px 22px;border-radius:8px;font-size:13px;font-weight:700;background:var(--navy);color:#fff;border:none;cursor:pointer;font-family:inherit;transition:.14s;margin-top:4px}
.savebtn:hover{background:var(--navy2)}

.twrap{background:var(--white);border:1px solid var(--border);border-radius:var(--r2);overflow:hidden;margin-bottom:20px}
.tabs{display:flex;overflow-x:auto;border-bottom:1px solid var(--border)}
.tabbtn{padding:12px 18px;font-size:13px;font-weight:600;cursor:pointer;border:none;background:none;color:var(--text3);font-family:inherit;border-bottom:2px solid transparent;transition:.13s;white-space:nowrap;display:flex;align-items:center;gap:6px}
.tabbtn:hover{color:var(--text2)}
.tabbtn.act{color:var(--teal);border-bottom-color:var(--teal)}
.tdot{width:7px;height:7px;border-radius:50%;background:var(--teal)}

.secc{background:var(--white);border:1px solid var(--border);border-radius:var(--r2);margin-bottom:16px;overflow:hidden}
.sech{display:flex;align-items:center;justify-content:space-between;padding:13px 20px;border-bottom:1px solid var(--border);background:var(--bg)}
.sect{font-size:14px;font-weight:700;color:var(--navy);display:flex;align-items:center;gap:7px}
.secb{padding:20px}

.fgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px}
.fg{display:flex;flex-direction:column;gap:5px}
.fg.full{grid-column:1/-1}
.flbl{font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.07em}
.finp,.fsel,.ftxt{background:var(--bg);border:1.5px solid var(--border);border-radius:8px;padding:9px 12px;color:var(--navy);font-size:13px;font-family:inherit;transition:.14s;outline:none;width:100%}
.finp:focus,.fsel:focus,.ftxt:focus{border-color:var(--teal);background:#fff;box-shadow:0 0 0 3px rgba(13,124,114,.07)}
.ftxt{resize:vertical;min-height:78px}

.tw{overflow-x:auto;border-radius:var(--r);border:1px solid var(--border)}
.tbl{width:100%;border-collapse:collapse;font-size:13px}
.tbl th{text-align:left;padding:10px 14px;font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;background:var(--bg);border-bottom:1px solid var(--border)}
.tbl td{padding:9px 14px;border-bottom:1px solid var(--border);vertical-align:middle}
.tbl tr:last-child td{border-bottom:none}
.tbl tr:hover td{background:var(--bg)}
.tinp{background:var(--bg);border:1.5px solid var(--border);border-radius:6px;padding:6px 9px;color:var(--navy);font-size:12px;font-family:inherit;outline:none;width:100%}
.tinp:focus{border-color:var(--teal);background:#fff}
.tsel{background:var(--bg);border:1.5px solid var(--border);border-radius:6px;padding:6px 8px;color:var(--navy);font-size:12px;font-family:inherit;outline:none;width:100%}
.addbtn{display:inline-flex;align-items:center;gap:6px;padding:8px 15px;background:var(--bg);border:1.5px dashed var(--border2);color:var(--text2);border-radius:8px;cursor:pointer;font-size:12px;font-family:inherit;font-weight:600;margin-top:12px;transition:.14s}
.addbtn:hover{border-color:var(--teal);color:var(--teal);background:var(--tealBg)}
.delbtn{background:var(--redBg);border:1px solid rgba(185,28,28,.15);color:var(--red);border-radius:5px;padding:4px 8px;cursor:pointer;font-size:12px;font-family:inherit}
.delbtn:hover{background:#fcc}

.rtype-row{display:flex;gap:8px;flex-wrap:wrap;padding:12px 20px;border-bottom:1px solid var(--border)}
.rtype-btn{padding:5px 12px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;border:1.5px solid var(--border);background:var(--white);color:var(--text2);font-family:inherit;transition:.13s}
.rtype-btn:hover{border-color:var(--navy);color:var(--navy)}
.rtype-btn.sel{background:var(--navy);border-color:var(--navy);color:#fff}

.prcard{background:var(--white);border:1px solid var(--border);border-radius:var(--r2);margin-bottom:18px;overflow:hidden}
.prhdr{background:var(--navy);color:#fff;padding:14px 20px;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap}
.prmt{font-size:12px;color:rgba(255,255,255,.5);margin-top:6px;display:flex;gap:20px;flex-wrap:wrap}
.prftr{padding:14px 20px;border-top:1px solid var(--border);background:var(--bg);display:flex;align-items:flex-end;gap:20px;flex-wrap:wrap}
.rmlbl{font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px}
.rminp{flex:1;min-width:200px;background:var(--white);border:1.5px solid var(--border);border-radius:8px;padding:8px 12px;color:var(--navy);font-size:13px;font-family:inherit;outline:none}
.rminp:focus{border-color:var(--teal)}
.amtgrp{display:flex;align-items:center;gap:8px;flex-shrink:0}
.amtlbl{font-size:12px;font-weight:600;color:var(--text3);white-space:nowrap}
.amtinp{width:110px;background:var(--white);border:1.5px solid var(--border);border-radius:8px;padding:8px 10px;color:var(--navy);font-size:13px;font-family:inherit;font-weight:700;outline:none}
.addrep{display:inline-flex;align-items:center;gap:7px;padding:10px 18px;background:var(--navy);color:#fff;border:none;border-radius:9px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit;transition:.14s}
.addrep:hover{background:var(--navy2)}

.totbox{margin-top:18px;border-top:2px solid var(--border);padding-top:14px;max-width:360px;margin-left:auto}
.tr2{display:flex;justify-content:space-between;padding:5px 0;font-size:13px}
.trl{color:var(--text3)}.trv{font-weight:700}
.tr2.fin{border-top:2px solid var(--navy);margin-top:8px;padding-top:10px;font-size:15px;font-weight:800;color:var(--navy)}
.bgrid{display:grid;grid-template-columns:1fr 320px;gap:16px;align-items:start}

.overlay{position:fixed;inset:0;background:rgba(11,25,41,.6);z-index:999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(5px)}
.modal{background:var(--white);border-radius:16px;padding:30px 32px;min-width:360px;max-width:95vw;box-shadow:var(--sh2);position:relative;max-height:90vh;overflow-y:auto}
.mclose{position:absolute;top:16px;right:16px;width:28px;height:28px;border-radius:6px;background:var(--bg);border:1px solid var(--border);cursor:pointer;font-size:13px;color:var(--text2);display:flex;align-items:center;justify-content:center}
.mclose:hover{background:var(--redBg);color:var(--red)}
.mico{font-size:42px;text-align:center;margin-bottom:12px}
.mtitle{font-family:'Instrument Serif',serif;font-size:21px;color:var(--navy);text-align:center;margin-bottom:6px}
.msub{font-size:13px;color:var(--text2);text-align:center;line-height:1.65;margin-bottom:20px}
.mcl{background:var(--bg);border-radius:var(--r);padding:16px;margin-bottom:20px;display:flex;flex-direction:column;gap:8px}
.mclr{display:flex;align-items:center;gap:10px;font-size:13px}
.mrow{display:flex;gap:10px;justify-content:center}
.cbtn{padding:10px 22px;border-radius:8px;font-size:13px;font-weight:600;background:var(--bg);border:1.5px solid var(--border);color:var(--text2);cursor:pointer;font-family:inherit}
.cbtn:hover{border-color:var(--navy);color:var(--navy)}

.twrp{position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none}
.tst{background:var(--white);border:1px solid var(--border);border-radius:10px;padding:12px 16px;font-size:13px;font-weight:600;box-shadow:var(--sh2);display:flex;align-items:center;gap:9px;animation:tsl .22s ease;color:var(--navy)}
.tst.s{border-left:3px solid var(--teal)}.tst.e{border-left:3px solid var(--red)}
@keyframes tsl{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}

.empty{text-align:center;padding:60px 20px;color:var(--text3)}
.empty-ico{font-size:44px;margin-bottom:12px}
@media(max-width:860px){
  .sidebar{display:none}.main{padding:16px}
  .srow{grid-template-columns:repeat(2,1fr)}
  .bgrid{grid-template-columns:1fr}
  .clcon{display:none}
}
`;

export default function BillingDashboard({ currentUser, onLogout, propDb, branch = "Sangi Hospital" }) {
  const [patients, setPatients]   = useState(MOCK_PATIENTS);
  const [view, setView]           = useState("tasks");
  const [sel, setSel]             = useState(null);
  const [activeTab, setActiveTab] = useState("discharge");
  const [showConfirm, setShowConfirm] = useState(false);
  const [toasts, setToasts]       = useState([]);
  const [repFilter, setRepFilter] = useState("All");

  const [eDis, setEDis]         = useState({});
  const [eMed, setEMed]         = useState({});
  const [eSvc, setESvc]         = useState([]);
  const [eLabRep, setELabRep]   = useState([]);
  const [eMedBill, setEMedBill] = useState([]);
  const [eBilling, setEBilling] = useState({});
  const [eSaved, setESaved]     = useState({}); 

  useEffect(() => {
    const src = propDb ? mapLivePatients(propDb[branch] || []) : (MOCK_PATIENTS[branch] || []);
    setPatients(src);
    setView("dashboard"); setSel(null);
  }, [branch, propDb]);

  const toast = (msg, type = "s") => {
    const id = _tid++;
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  };

  const openPatient = (p) => {
    setSel(p);
    setEDis({ ...p.discharge });
    setEMed({ ...p.medicalHistory });
    setESvc(JSON.parse(JSON.stringify(p.services)));
    setELabRep(JSON.parse(JSON.stringify(p.labReports)));
    setEMedBill(JSON.parse(JSON.stringify(p.medicalBill)));
    setEBilling({ ...p.billing });
    setESaved({ ...p.saved });
    setRepFilter("All");
    setActiveTab("discharge");
    setView("patient");
  };

  const syncSelectedPatient = () => {
    setPatients(prev => prev.map(p =>
      p.uhid === sel.uhid && p.admNo === sel.admNo
        ? { ...p, saved: { ...eSaved }, discharge: { ...eDis }, medicalHistory: { ...eMed }, services: [...eSvc], labReports: JSON.parse(JSON.stringify(eLabRep)), medicalBill: [...eMedBill], billing: { ...eBilling } }
        : p
    ));
    setSel(prev => prev ? ({ ...prev, saved: { ...eSaved }, discharge: { ...eDis }, medicalHistory: { ...eMed }, services: [...eSvc], labReports: JSON.parse(JSON.stringify(eLabRep)), medicalBill: [...eMedBill], billing: { ...eBilling } }) : prev);
  };

  const saveSection = async (label) => {
    if (!sel) return;
    try {
      if (activeTab === "discharge") {
        await apiService.dischargePatient(sel.uhid, sel.admNo, buildDischargePayload(eDis));
      } else if (activeTab === "medical") {
        await apiService.updateMedicalHistory(sel.uhid, sel.admNo, eMed);
      } else if (activeTab === "finalbill") {
        for (const service of eSvc.filter(row => row.name)) {
          await apiService.addService(sel.uhid, sel.admNo, buildServicePayload(service, service.category || "GENERAL SERVICES"));
        }
        await apiService.updateBilling(sel.uhid, sel.admNo, eBilling);
      } else if (activeTab === "reports") {
        for (const row of eLabRep) {
          await apiService.addService(sel.uhid, sel.admNo, buildServicePayload({ name: row.reportName, category: row.reportType || "PATHOLOGY", qty: 1, rate: row.amount, date: row.date }, "PATHOLOGY"));
        }
      } else if (activeTab === "med_bill") {
        for (const row of eMedBill.filter(item => item.item)) {
          await apiService.addService(sel.uhid, sel.admNo, buildServicePayload({ name: row.item, category: "MEDICINE", qty: 1, rate: row.amount, date: row.date }, "MEDICINE"));
        }
      }

      syncSelectedPatient();
      toast(`${label} saved ✓`);
    } catch (error) {
      toast(`Failed to save ${label}`, "e");
    }
  };

  const submitTask = async () => {
    if (!sel) return;
    try {
      await apiService.requestPrint(sel.uhid, sel.admNo);
      setPatients(prev => prev.map(p => p.uhid === sel.uhid && p.admNo === sel.admNo ? { ...p, taskStatus: "submitted", billing: { ...p.billing, printStatus: "PENDING" } } : p));
      setSel(prev => prev ? ({ ...prev, taskStatus: "submitted", billing: { ...prev.billing, printStatus: "PENDING" } }) : prev);
      setShowConfirm(false);
      toast("Submitted to Admin print queue ✓");
    } catch (error) {
      toast("Failed to submit billing task", "e");
    }
  };

  const updSvc = (i, k, v) => setESvc(prev => {
    const n = [...prev]; n[i] = { ...n[i], [k]: v };
    if (k === "qty" || k === "rate") n[i].amount = Number(n[i].qty || 0) * Number(n[i].rate || 0);
    return n;
  });
  const updRep  = (ri, k, v) => setELabRep(p => { const n = JSON.parse(JSON.stringify(p)); n[ri][k] = v; return n; });
  const updTest = (ri, ti, k, v) => setELabRep(p => { const n = JSON.parse(JSON.stringify(p)); n[ri].tests[ti][k] = v; return n; });
  const addTest = (ri) => setELabRep(p => { const n = JSON.parse(JSON.stringify(p)); n[ri].tests.push({ id: Date.now(), name: "", value: "", unit: "", refRange: "", status: "Normal" }); return n; });
  const delTest = (ri, ti) => setELabRep(p => { const n = JSON.parse(JSON.stringify(p)); n[ri].tests.splice(ti, 1); return n; });

  const totals = sel ? calcTotals(eSvc, eLabRep, eMedBill, eBilling) : null;
  const pending   = patients.filter(p => p.taskStatus === "pending").length;
  const completed = patients.filter(p => p.taskStatus === "completed").length;
  const repTypes  = sel ? ["All", ...Array.from(new Set(eLabRep.map(r => r.reportType)))] : ["All"];
  const visibleReps = eLabRep.filter(r => repFilter === "All" || r.reportType === repFilter);
  const allSaved   = eSaved && SECTION_KEYS.every(k => eSaved[k]);
  const savedCount = eSaved ? SECTION_KEYS.filter(k => eSaved[k]).length : 0;

  const TABS = [
    { id: "discharge", sKey: "discharge", lbl: "Discharge Summary", ico: "📋" },
    { id: "medical",   sKey: "admission",  lbl: "Admission Note",    ico: "🩺" },
    { id: "reports",   sKey: "reports",    lbl: "Reports",           ico: "🗂️" },
    { id: "med_bill",  sKey: "medicines",  lbl: "Medicine Bill",     ico: "💊" },
    { id: "finalbill", sKey: "billing",    lbl: "Final Bill",        ico: "🧾" },
  ];

  return (
    <>
      <style>{CSS}</style>
      <div className="app">

        {/* TOPBAR - no branch */}
        <header className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className="logo">Sh</div>
            <div>
              <div className="brand-name">Sangi Hospital</div>
              <div className="brand-sub">Billing Department</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div className="user-av">{CURRENT_USER.name[0]}</div>
              <div>
                <div className="user-nm">{CURRENT_USER.name}</div>
                <div className="user-id">{CURRENT_USER.empId} · Billing Staff</div>
              </div>
            </div>
            <button className="so-btn">Sign Out</button>
          </div>
        </header>

        <div className="layout">
          {/* SIDEBAR */}
          <aside className="sidebar">
            <div className="slbl">Workspace</div>
            <div className="si act">
              <span>📋</span> My Tasks
              {pending > 0 && <span className="sbdg">{pending}</span>}
            </div>
            <div className="shr" />
            <div className="slbl">Overview</div>
            <div className="smr"><span className="smrl">Total Assigned</span><strong style={{ color: "var(--navy)" }}>{patients.length}</strong></div>
            <div className="smr"><span className="smrl">Pending</span><strong style={{ color: "var(--amber)" }}>{pending}</strong></div>
            <div className="smr"><span className="smrl">Completed</span><strong style={{ color: "var(--teal)" }}>{completed}</strong></div>
          </aside>

          <main className="main">

            {/* TASK LIST */}
            {view === "tasks" && (
              <>
                <div className="pgh">
                  <div>
                    <div className="pgt">My Tasks</div>
                    <div className="pgs">Patients assigned to you across all branches</div>
                  </div>
                  <div className="dchip">{new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}</div>
                </div>

                <div className="srow">
                  <div className="sc c1"><div className="scv">{patients.length}</div><div className="scl">Total Assigned</div></div>
                  <div className="sc c2"><div className="scv">{pending}</div><div className="scl">Pending Tasks</div></div>
                  <div className="sc c3"><div className="scv">{completed}</div><div className="scl">Completed</div></div>
                </div>

                {patients.length === 0
                  ? <div className="empty"><div className="empty-ico">🎉</div><div>All tasks done!</div></div>
                  : <div className="tgrid">
                      {patients.map(p => {
                        const done = SECTION_KEYS.filter(k => p.saved?.[k]).length;
                        return (
                          <div key={p.uhid} className="tc">
                            <div className="tctp">
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="tcnm">{p.patientName}</div>
                                <div className="tcid">{p.uhid} · {p.admNo}</div>
                              </div>
                              <span className={"badge " + (p.taskStatus === "completed" ? "bt" : "ba")}>
                                {p.taskStatus === "completed" ? "Done" : "Pending"}
                              </span>
                            </div>

                            <div className="tcrs">
                              <div className="tcrw"><span className="tcri">🏥</span><strong style={{ color: "var(--navy)", fontSize: 11 }}>{p.branch}</strong></div>
                              <div className="tcrw"><span className="tcri">👨‍⚕️</span>{p.doctor}</div>
                              <div className="tcrw"><span className="tcri">🩺</span>{p.diagnosis}</div>
                              <div className="tcrw"><span className="tcri">📞</span>{p.phone}</div>
                            </div>

                            {/* DOD strip on card */}
                            <div className="tc-dod">
                              <div className="tc-dod-item">
                                <div className="tc-dod-lbl">Admitted</div>
                                <div className="tc-dod-val">{fmtDtShort(p.doa)}</div>
                              </div>
                              <div className="tc-dod-item">
                                <div className="tc-dod-lbl">Exp. Discharge</div>
                                <div className={"tc-dod-val exp"}>{p.expectedDod ? fmtDtShort(p.expectedDod) : "--"}</div>
                              </div>
                              <div className="tc-dod-item">
                                <div className="tc-dod-lbl">Discharged</div>
                                <div className={"tc-dod-val dis"}>{p.dod ? fmtDtShort(p.dod) : "Active"}</div>
                              </div>
                            </div>

                            <div className="tcch">
                              <span className={"badge " + (p.status === "admitted" ? "bg" : "bb")}>
                                {p.status === "admitted" ? "Admitted" : "Discharged"}
                              </span>
                              <span className="chip">{p.ward} · {p.bed}</span>
                              <span className="chip">{p.age}y {p.gender[0]}</span>
                            </div>

                            {p.taskStatus !== "completed" && (
                              <div className="tcpb">
                                <div className="tcplbl">Sections saved: {done}/5</div>
                                <div className="tcpbar"><div className="tcpfil" style={{ width: ((done / 5) * 100) + "%" }} /></div>
                              </div>
                            )}

                            <div className="tcft">
                              <div className="tcdoa">DOA: {fmtDt(p.doa)}</div>
                              <button className="hod-btn" onClick={() => openPatient(p)}>Open</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                }
              </>
            )}

            {/* PATIENT DETAIL */}
            {view === "patient" && sel && (
              <>
                <button className="back-btn" onClick={() => { setView("tasks"); setSel(null); }}>
                  &larr; Back to My Tasks
                </button>

                {/* Patient header */}
                <div className="dhdr">
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
                    <div>
                      <div className="dname">{sel.patientName}</div>
                      <div className="dmeta">
                        UHID: <strong>{sel.uhid}</strong> &nbsp;&middot;&nbsp;
                        Adm: <strong>{sel.admNo}</strong> &nbsp;&middot;&nbsp;
                        {sel.age} yrs &middot; {sel.gender} &nbsp;&middot;&nbsp; {sel.phone}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                    <span className="badge bb">🏥 {sel.branch}</span>
                    <span className={"badge " + (sel.status === "admitted" ? "bg" : "bt")}>
                      {sel.status === "admitted" ? "Admitted" : "Discharged"}
                    </span>
                    <span className="badge bb">🛏 {sel.ward} · {sel.bed}</span>
                    <span className="badge bb">👨‍⚕️ {sel.doctor}</span>
                    <span className={"badge " + (sel.taskStatus === "completed" ? "bt" : "ba")}>
                      {sel.taskStatus === "completed" ? "Submitted to HOD" : "Task Pending"}
                    </span>
                  </div>

                  {/* DOD strip in detail */}
                  <div className="dod-strip">
                    <div className="dod-strip-item">
                      <div className="dod-strip-lbl">Date of Admission</div>
                      <div className="dod-strip-val">{fmtDt(sel.doa)}</div>
                    </div>
                    <div className="dod-strip-item">
                      <div className="dod-strip-lbl">Expected Discharge</div>
                      <div className="dod-strip-val exp">{eDis.expectedDod ? fmtDt(eDis.expectedDod) : "Not set"}</div>
                    </div>
                    <div className="dod-strip-item">
                      <div className="dod-strip-lbl">Actual Discharge</div>
                      <div className="dod-strip-val dis">{sel.dod ? fmtDt(sel.dod) : "Not yet discharged"}</div>
                    </div>
                    <div className="dod-strip-item">
                      <div className="dod-strip-lbl">Primary Diagnosis</div>
                      <div className="dod-strip-val dia">{sel.diagnosis}</div>
                    </div>
                  </div>
                </div>

                {/* CHECKLIST */}
                <div className="clpanel">
                  <div className="cltitle">Task Checklist — save all 5 sections then submit to HOD</div>
                  <div className="clsteps">
                    {SECTION_KEYS.map((k, idx) => (
                      <div key={k} style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
                        <div
                          className={"clstep" + (eSaved[k] ? " done" : activeTab === TAB_MAP[k] ? " cur" : "")}
                          style={{ flex: 1, minWidth: 0 }}
                          onClick={() => setActiveTab(TAB_MAP[k])}
                        >
                          <div className="clchk">{eSaved[k] ? "✓" : SECTION_ICONS[k]}</div>
                          <div className="cllbl">{SECTION_LABELS[k]}</div>
                        </div>
                        {idx < SECTION_KEYS.length - 1 && <div className={"clcon" + (eSaved[k] ? " done" : "")} />}
                      </div>
                    ))}
                  </div>
                  <div className="clfoot">
                    {sel.taskStatus === "completed"
                      ? <div className="clmsg-ok">✔ Submitted to HOD & Admin Management</div>
                      : allSaved
                        ? <div className="clmsg-ok">✔ All sections saved — ready to submit!</div>
                        : <div className="clmsg-pend">
                            <span className="clmsg-cnt">{5 - savedCount} section{5 - savedCount !== 1 ? "s" : ""} remaining</span>
                            {" "}— save all to unlock Submit
                          </div>
                    }
                    {sel.taskStatus !== "completed"
                      ? <button className="hod-btn" disabled={!allSaved} onClick={() => setShowConfirm(true)}>Submit to HOD →</button>
                      : <div className="done-bdg">✔ Submitted</div>
                    }
                  </div>
                </div>

                {/* TABS */}
                <div className="twrap">
                  <div className="tabs">
                    {TABS.map(t => (
                      <button key={t.id} className={"tabbtn" + (activeTab === t.id ? " act" : "")} onClick={() => setActiveTab(t.id)}>
                        {t.ico} {t.lbl} {eSaved[t.sKey] && <span className="tdot" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* DISCHARGE SUMMARY */}
                {activeTab === "discharge" && (
                  <>
                    <div className="secc">
                      <div className="sech"><div className="sect">📋 Discharge Summary</div></div>
                      <div className="secb">
                        <div className="fgrid">
                          <div className="fg">
                            <label className="flbl">Date of Admission</label>
                            <input className="finp" type="datetime-local" value={eDis?.doa || ""} onChange={e => setEDis(p => ({ ...p, doa: e.target.value }))} />
                          </div>
                          <div className="fg">
                            <label className="flbl">Expected Discharge Date</label>
                            <input className="finp" type="datetime-local" value={eDis?.expectedDod || ""} onChange={e => setEDis(p => ({ ...p, expectedDod: e.target.value }))} />
                          </div>
                          <div className="fg">
                            <label className="flbl">Actual Discharge Date</label>
                            <input className="finp" type="datetime-local" value={eDis?.dod || ""} onChange={e => setEDis(p => ({ ...p, dod: e.target.value }))} />
                          </div>
                          {[
                            { k: "ward",      lbl: "Ward" },
                            { k: "bed",       lbl: "Bed No." },
                            { k: "doctor",    lbl: "Treating Doctor" },
                            { k: "diagnosis", lbl: "Primary Diagnosis" },
                            { k: "condition", lbl: "Condition at Discharge" },
                          ].map(f => (
                            <div key={f.k} className="fg">
                              <label className="flbl">{f.lbl}</label>
                              <input className="finp" value={eDis?.[f.k] || ""} onChange={e => setEDis(p => ({ ...p, [f.k]: e.target.value }))} />
                            </div>
                          ))}
                          <div className="fg full">
                            <label className="flbl">Discharge Instructions</label>
                            <textarea className="ftxt" value={eDis?.instructions || ""} onChange={e => setEDis(p => ({ ...p, instructions: e.target.value }))} />
                          </div>
                          <div className="fg full">
                            <label className="flbl">Additional Notes</label>
                            <textarea className="ftxt" value={eDis?.notes || ""} onChange={e => setEDis(p => ({ ...p, notes: e.target.value }))} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <button className="savebtn" onClick={() => saveSection("discharge", "Discharge Summary")}>Save Discharge Summary</button>
                  </>
                )}

                {/* ADMISSION NOTE */}
                {activeTab === "medical" && (
                  <>
                    <div className="secc">
                      <div className="sech"><div className="sect">🩺 Admission Note / Medical History</div></div>
                      <div className="secb">
                        <div className="fgrid">
                          {[
                            { k: "treatingDoctor",     lbl: "Treating Doctor" },
                            { k: "previousDiagnosis",  lbl: "Previous Diagnosis" },
                            { k: "chronicConditions",  lbl: "Chronic Conditions" },
                            { k: "pastSurgeries",      lbl: "Past Surgeries" },
                            { k: "currentMedications", lbl: "Current Medications" },
                            { k: "knownAllergies",     lbl: "Known Allergies" },
                            { k: "familyHistory",      lbl: "Family History" },
                            { k: "smokingStatus",      lbl: "Smoking Status" },
                            { k: "alcoholUse",         lbl: "Alcohol Use" },
                          ].map(f => (
                            <div key={f.k} className="fg">
                              <label className="flbl">{f.lbl}</label>
                              <input className="finp" value={eMed?.[f.k] || ""} onChange={e => setEMed(p => ({ ...p, [f.k]: e.target.value }))} />
                            </div>
                          ))}
                          <div className="fg full">
                            <label className="flbl">Notes</label>
                            <textarea className="ftxt" value={eMed?.notes || ""} onChange={e => setEMed(p => ({ ...p, notes: e.target.value }))} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <button className="savebtn" onClick={() => saveSection("admission", "Admission Note")}>Save Admission Note</button>
                  </>
                )}

                {/* REPORTS */}
                {activeTab === "reports" && (
                  <>
                    <div className="secc">
                      <div className="sech">
                        <div className="sect">🗂️ Reports</div>
                        <div style={{ fontSize: 12, color: "var(--text3)" }}>
                          {eLabRep.length} report{eLabRep.length !== 1 ? "s" : ""} &nbsp;·&nbsp; Total: {fmt(eLabRep.reduce((a, r) => a + Number(r.amount || 0), 0))}
                        </div>
                      </div>
                      <div className="rtype-row">
                        {repTypes.map(t => (
                          <button key={t} className={"rtype-btn" + (repFilter === t ? " sel" : "")} onClick={() => setRepFilter(t)}>{t}</button>
                        ))}
                      </div>
                    </div>

                    {visibleReps.length === 0 && (
                      <div className="empty" style={{ padding: "30px 20px" }}><div>No reports of this type yet.</div></div>
                    )}

                    {visibleReps.map((rep) => {
                      const ri = eLabRep.findIndex(r => r.id === rep.id);
                      return (
                        <div key={rep.id} className="prcard">
                          <div className="prhdr">
                            <div style={{ flex: 1 }}>
                              <input
                                value={rep.reportName}
                                placeholder="Report Name (e.g. Complete Blood Count)"
                                onChange={e => updRep(ri, "reportName", e.target.value)}
                                style={{ background: "transparent", border: "none", outline: "none", color: "#fff", fontFamily: "'Instrument Serif',serif", fontSize: 16, width: "100%", fontStyle: "italic" }}
                              />
                              <div className="prmt">
                                <span>
                                  Type:&nbsp;
                                  <select value={rep.reportType} onChange={e => updRep(ri, "reportType", e.target.value)}
                                    style={{ background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,.3)", outline: "none", color: "rgba(255,255,255,.8)", fontFamily: "inherit", fontSize: 12 }}>
                                    {REPORT_TYPES.map(t => <option key={t} style={{ background: "#1a2e42" }}>{t}</option>)}
                                  </select>
                                </span>
                                <span>
                                  Date:&nbsp;
                                  <input type="date" value={rep.date} onChange={e => updRep(ri, "date", e.target.value)}
                                    style={{ background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,.3)", outline: "none", color: "rgba(255,255,255,.7)", fontFamily: "inherit", fontSize: 12 }} />
                                </span>
                                <span>
                                  Ordered by:&nbsp;
                                  <input value={rep.orderedBy} placeholder="Doctor" onChange={e => updRep(ri, "orderedBy", e.target.value)}
                                    style={{ background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,.3)", outline: "none", color: "rgba(255,255,255,.7)", fontFamily: "inherit", fontSize: 12, width: 140 }} />
                                </span>
                              </div>
                            </div>
                            <button onClick={() => setELabRep(p => p.filter((_, i) => i !== ri))}
                              style={{ background: "rgba(248,113,113,.15)", color: "#fca5a5", border: "1px solid rgba(248,113,113,.3)", borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: 600 }}>
                              Remove
                            </button>
                          </div>

                          <div>
                            <div className="tw" style={{ borderRadius: 0, border: "none", borderBottom: "1px solid var(--border)" }}>
                              <table className="tbl">
                                <thead>
                                  <tr>
                                    <th>Test / Parameter</th>
                                    <th style={{ width: 90 }}>Value</th>
                                    <th style={{ width: 80 }}>Unit</th>
                                    <th style={{ width: 155 }}>Reference Range</th>
                                    <th style={{ width: 100 }}>Status</th>
                                    <th style={{ width: 40 }}></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {rep.tests.map((t, ti) => (
                                    <tr key={t.id}>
                                      <td><input className="tinp" value={t.name} placeholder="e.g. Haemoglobin" onChange={e => updTest(ri, ti, "name", e.target.value)} /></td>
                                      <td>
                                        <input className="tinp" value={t.value} placeholder="12.4"
                                          onChange={e => updTest(ri, ti, "value", e.target.value)}
                                          style={{ fontWeight: 700, color: t.status === "High" ? "var(--red)" : t.status === "Low" ? "var(--amber)" : "var(--green)" }} />
                                      </td>
                                      <td><input className="tinp" value={t.unit} placeholder="g/dL" onChange={e => updTest(ri, ti, "unit", e.target.value)} /></td>
                                      <td><input className="tinp" value={t.refRange} placeholder="13.0 - 17.0" onChange={e => updTest(ri, ti, "refRange", e.target.value)} /></td>
                                      <td>
                                        <select className="tsel" value={t.status} onChange={e => updTest(ri, ti, "status", e.target.value)}>
                                          <option>Normal</option><option>High</option><option>Low</option>
                                        </select>
                                      </td>
                                      <td><button className="delbtn" onClick={() => delTest(ri, ti)}>X</button></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <div style={{ padding: "8px 16px" }}>
                              <button className="addbtn" onClick={() => addTest(ri)}>+ Add Row</button>
                            </div>
                          </div>

                          <div className="prftr">
                            <div style={{ flex: 1 }}>
                              <div className="rmlbl">Remarks / Interpretation</div>
                              <input className="rminp" value={rep.remarks} placeholder="e.g. Mild anaemia noted..." onChange={e => updRep(ri, "remarks", e.target.value)} />
                            </div>
                            <div className="amtgrp">
                              <div className="amtlbl">Amount (Rs.)</div>
                              <input className="amtinp" type="number" value={rep.amount} onChange={e => updRep(ri, "amount", Number(e.target.value))} />
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
                      <button className="addrep" onClick={() => { setELabRep(p => [...p, emptyReport()]); setRepFilter("All"); }}>+ Add Report</button>
                      <span style={{ fontSize: 13, color: "var(--text3)" }}>
                        Total: <strong style={{ color: "var(--navy)" }}>{fmt(eLabRep.reduce((a, r) => a + Number(r.amount || 0), 0))}</strong>
                      </span>
                    </div>
                    <button className="savebtn" onClick={() => saveSection("reports", "Reports")}>Save Reports</button>
                  </>
                )}

                {/* MEDICINE BILL */}
                {activeTab === "med_bill" && (
                  <>
                    <div className="secc">
                      <div className="sech"><div className="sect">💊 Medicine / Pharmacy Bill</div></div>
                      <div className="secb">
                        <div className="tw">
                          <table className="tbl">
                            <thead><tr><th>Item Description</th><th>Date</th><th style={{ width: 130 }}>Amount</th><th style={{ width: 44 }}></th></tr></thead>
                            <tbody>
                              {eMedBill.map((r, i) => (
                                <tr key={r.id}>
                                  <td><input className="tinp" value={r.item} onChange={e => { const n = [...eMedBill]; n[i] = { ...n[i], item: e.target.value }; setEMedBill(n); }} /></td>
                                  <td><input className="tinp" type="date" value={r.date} onChange={e => { const n = [...eMedBill]; n[i] = { ...n[i], date: e.target.value }; setEMedBill(n); }} /></td>
                                  <td><input className="tinp" type="number" value={r.amount} onChange={e => { const n = [...eMedBill]; n[i] = { ...n[i], amount: Number(e.target.value) }; setEMedBill(n); }} /></td>
                                  <td><button className="delbtn" onClick={() => setEMedBill(p => p.filter((_, j) => j !== i))}>X</button></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <button className="addbtn" onClick={() => setEMedBill(p => [...p, { id: Date.now(), item: "", date: new Date().toISOString().slice(0, 10), amount: 0 }])}>+ Add Medicine</button>
                        <div className="totbox">
                          <div className="tr2 fin"><span>Medicine Total</span><span>{fmt(eMedBill.reduce((a, r) => a + Number(r.amount || 0), 0))}</span></div>
                        </div>
                      </div>
                    </div>
                    <button className="savebtn" onClick={() => saveSection("medicines", "Medicine Bill")}>Save Medicine Bill</button>
                  </>
                )}

                {/* FINAL BILL */}
                {activeTab === "finalbill" && (
                  <>
                    <div className="bgrid">
                      <div>
                        <div className="secc">
                          <div className="sech"><div className="sect">🧾 Services & Charges</div></div>
                          <div className="secb">
                            <div className="tw">
                              <table className="tbl">
                                <thead><tr><th>Service</th><th>Category</th><th style={{ width: 60 }}>Qty</th><th style={{ width: 90 }}>Rate</th><th style={{ width: 100 }}>Amount</th><th style={{ width: 44 }}></th></tr></thead>
                                <tbody>
                                  {eSvc.map((r, i) => (
                                    <tr key={r.id}>
                                      <td><input className="tinp" value={r.name} onChange={e => updSvc(i, "name", e.target.value)} /></td>
                                      <td><input className="tinp" value={r.category} onChange={e => updSvc(i, "category", e.target.value)} /></td>
                                      <td><input className="tinp" type="number" value={r.qty} onChange={e => updSvc(i, "qty", e.target.value)} /></td>
                                      <td><input className="tinp" type="number" value={r.rate} onChange={e => updSvc(i, "rate", e.target.value)} /></td>
                                      <td style={{ fontWeight: 700 }}>{fmt(r.amount)}</td>
                                      <td><button className="delbtn" onClick={() => setESvc(p => p.filter((_, j) => j !== i))}>X</button></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <button className="addbtn" onClick={() => setESvc(p => [...p, { id: Date.now(), name: "", category: "", qty: 1, rate: 0, amount: 0 }])}>+ Add Service</button>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="secc">
                          <div className="sech"><div className="sect">💳 Payment Details</div></div>
                          <div className="secb">
                            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                              {[{ k: "discount", lbl: "Discount (Rs.)" }, { k: "advance", lbl: "Advance Paid (Rs.)" }].map(f => (
                                <div key={f.k} className="fg">
                                  <label className="flbl">{f.lbl}</label>
                                  <input className="finp" type="number" value={eBilling?.[f.k] || 0} onChange={e => setEBilling(p => ({ ...p, [f.k]: e.target.value }))} />
                                </div>
                              ))}
                              <div className="fg">
                                <label className="flbl">Payment Mode</label>
                                <select className="fsel" value={eBilling?.paymentMode || "Cash"} onChange={e => setEBilling(p => ({ ...p, paymentMode: e.target.value }))}>
                                  {["Cash", "UPI", "Card", "Insurance", "NEFT", "Cheque"].map(m => <option key={m}>{m}</option>)}
                                </select>
                              </div>
                              <div className="fg">
                                <label className="flbl">Remarks</label>
                                <input className="finp" value={eBilling?.remarks || ""} onChange={e => setEBilling(p => ({ ...p, remarks: e.target.value }))} />
                              </div>
                            </div>
                            {totals && (
                              <div className="totbox">
                                <div className="tr2"><span className="trl">Services</span><span className="trv">{fmt(totals.s)}</span></div>
                                <div className="tr2"><span className="trl">Reports</span><span className="trv">{fmt(totals.p)}</span></div>
                                <div className="tr2"><span className="trl">Medicines</span><span className="trv">{fmt(totals.m)}</span></div>
                                <div className="tr2"><span className="trl">Gross Total</span><span className="trv">{fmt(totals.gross)}</span></div>
                                <div className="tr2" style={{ color: "var(--red)" }}><span className="trl">Discount</span><span className="trv">- {fmt(totals.disc)}</span></div>
                                <div className="tr2"><span className="trl">Net Payable</span><span className="trv">{fmt(totals.net)}</span></div>
                                <div className="tr2" style={{ color: "var(--teal)" }}><span className="trl">Advance Paid</span><span className="trv">- {fmt(totals.adv)}</span></div>
                                <div className="tr2 fin"><span>Balance Due</span><span>{fmt(totals.due)}</span></div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <button className="savebtn" onClick={() => saveSection("billing", "Final Bill")}>Save Final Bill</button>
                  </>
                )}
              </>
            )}
          </main>
        </div>

        {/* CONFIRM MODAL */}
        {showConfirm && (
          <div className="overlay" onClick={() => setShowConfirm(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <button className="mclose" onClick={() => setShowConfirm(false)}>X</button>
              <div className="mico">📤</div>
              <div className="mtitle">Submit to HOD and Admin?</div>
              <div className="msub">
                Submitting complete billing file for <strong>{sel?.patientName}</strong> ({sel?.uhid}) to the Head of Department.
              </div>
              <div className="mcl">
                {SECTION_KEYS.map(k => (
                  <div key={k} className="mclr">
                    <span>{eSaved[k] ? "✅" : "⚠️"}</span>
                    <span style={{ color: eSaved[k] ? "var(--teal)" : "var(--amber)", fontWeight: 600 }}>
                      {SECTION_ICONS[k]} {SECTION_LABELS[k]} — {eSaved[k] ? "Saved" : "Not saved"}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mrow">
                <button className="cbtn" onClick={() => setShowConfirm(false)}>Cancel</button>
                <button className="hod-btn" onClick={submitTask}>Confirm and Submit</button>
              </div>
            </div>
          </div>
        )}

        {/* TOASTS */}
        <div className="twrp">
          {toasts.map(t => (
            <div key={t.id} className={"tst " + t.type}>{t.type === "s" ? "✓" : "✗"} {t.msg}</div>
          ))}
        </div>
      </div>
    </>
  );
}
