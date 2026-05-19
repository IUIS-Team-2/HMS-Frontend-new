import React from 'react';
import { useState, useEffect, useRef } from "react";
import { apiService, BASE_URL } from "../services/apiService";
import ThemeModeDock from "../components/ui/ThemeModeDock";
import DoctorsView        from "../components/doctors/DoctorsView";
import DoctorSelectField from "../components/doctors/DoctorSelectField";
import { useDoctors } from "../hooks/useDoctors";
import {
  LayoutDashboard,
  Users,
  Wallet,
  FileText,
  BarChart3,
  UserRound,
  Stethoscope,
} from "lucide-react";

const UI_FONT_STACK = "var(--ui-font-sans)";
const UI_MONO_STACK = "var(--ui-font-mono)";
const EMPTY_EMP_FORM = {
  name: "",
  username: "",
  email: "",
  phone: "",
  role: "Receptionist",
  employeeId: "",
  password: "",
  confirmPassword: "",
};

// ─── Branch Theme Map ──────────────────────────────────────────────────────────
const BRANCH_THEMES = {
  raya: {
    primary:       "#2563eb",
    primaryDim:    "rgba(37,99,235,0.12)",
    primaryBorder: "rgba(37,99,235,0.35)",
    glow:          "rgba(37,99,235,0.16)",
    label:         "Raya Branch",
    initial:       "R",
  },
  lakshmi: {
    primary:       "#3b82f6",
    primaryDim:    "rgba(59,130,246,0.12)",
    primaryBorder: "rgba(59,130,246,0.35)",
    glow:          "rgba(59,130,246,0.16)",
    label:         "Lakshmi Branch",
    initial:       "L",
  },
  laxmi: {
    primary:       "#3b82f6",
    primaryDim:    "rgba(59,130,246,0.12)",
    primaryBorder: "rgba(59,130,246,0.35)",
    glow:          "rgba(59,130,246,0.16)",
    label:         "Lakshmi Branch",
    initial:       "L",
  },
  default: {
    primary:       "#3b82f6",
    primaryDim:    "rgba(59,130,246,0.12)",
    primaryBorder: "rgba(59,130,246,0.35)",
    glow:          "rgba(59,130,246,0.16)",
    label:         "Branch",
    initial:       "B",
  },
};

const NAV = [
  { id: "overview",   label: "Overview",        icon: LayoutDashboard },
  { id: "patients",   label: "All Patients",    icon: Users },
  { id: "cash",       label: "Cash Patients",   icon: Wallet },
  { id: "records",    label: "Patient Records", icon: FileText },
  { id: "financials",      label: "Financials",       icon: BarChart3 },
  { id: "print_approvals", label: "Print Approvals",  icon: FileText },
  { id: "employees",  label: "Employees",       icon: UserRound },
  { id: "doctors",    label: "Doctors",         icon: Stethoscope },
];

const RECORD_TYPES = [
  { id: "discharge_summary", label: "Discharge Summary" },
  { id: "admission_note",    label: "Admission Note"    },
  { id: "reports",           label: "Reports"           },
  { id: "medicines",         label: "Medicines"         },
  { id: "services",          label: "Services"          },
  { id: "final_bill",        label: "Final Bill"        },

];

const RANGES = ["daily", "weekly", "monthly", "yearly"];

function isPathologyCategory(category = "") {
  const normalized = String(category).toLowerCase();
  return ["path", "lab", "bio", "haem", "micro", "sero", "histo", "radiology", "x-ray", "scan", "echo", "usg", "mri", "ct"].some((key) => normalized.includes(key));
}

function isMedicineCategory(category = "") {
  const normalized = String(category).toLowerCase();
  return ["med", "pharma", "drug", "pharmacy", "tablet", "injection", "iv fluid", "consumable"].some((key) =>
    normalized.includes(key)
  );
}

/** Normalizes pharmacy/API/legacy/service rows so Branch Admin medicines table always has item, date, qty, batch, expiry. */
function buildMedicineRowsForBranchAdmin(medicinesRaw, legacyMedicines, services, admissionDateFallback, medicineNameSet = new Set()) {
  const fallbackDate = String(admissionDateFallback || "").slice(0, 10);

  const coerceRow = (m, i) => {
    const id = m.id ?? m._localId;
    const desc =
      m.medicine_name ??
      m.item ??
      m.name ??
      m.itemDescription ??
      m.description ??
      m.medicineDescription ??
      (typeof m.medicine === "object" ? (m.medicine?.medicine_name || m.medicine?.name) : null) ??
      (typeof m.medicine === "string" ? m.medicine : m.medicine?.name) ??
      m.svcName ??
      m.title ??
      "";
    const dateRaw = m.date_given ?? m.date ?? m.svcDate ?? fallbackDate;
    const dateStr = dateRaw ? String(dateRaw).slice(0, 10) : "";
    const qtyRaw = m.quantity ?? m.svcQty ?? m.dosage ?? 1;
    const qty = Math.max(1, Number(qtyRaw) || 1);
    const rate = Number(m.rate ?? m.svcRate ?? 0);
    const batch = m.batch_no ?? m.batchNo ?? m.batch ?? "";
    const expRaw = m.expiry_date ?? m.expiryDate ?? m.expiry ?? "";
    const expStr = expRaw ? String(expRaw).slice(0, 10) : "";
    const amount = Number(m.amount ?? qty * rate);
    return {
      _localId: id || m._localId || `m-${i}`,
      medicine_name: String(desc || "").trim(),
      date_given: dateStr,
      quantity: qty,
      rate,
      batch_no: String(batch || "").trim(),
      expiry_date: expStr,
      amount,
    };
  };

  const api = Array.isArray(medicinesRaw) ? medicinesRaw : [];
  const legacy = Array.isArray(legacyMedicines) ? legacyMedicines : [];
  const svc = Array.isArray(services) ? services : [];

  let source = [];
  if (api.length) source = api;
  else if (legacy.length) source = legacy;
  else source = svc.filter((s) => {
    const title = String(s?.svcName || s?.title || "").trim().toUpperCase();
    return isMedicineCategory(s.svcCat || s.type) || medicineNameSet.has(title);
  });

  return source.map(coerceRow);
}

function normalizeReportName(raw = "") {
  const s = String(raw).trim();
  const MAP = {
    "complete blood count": "CBC", "cbc": "CBC",
    "liver function test": "LFT", "lft": "LFT",
    "kidney function test": "KFT", "kft": "KFT",
    "renal function test": "RFT", "rft": "RFT",
    "blood sugar fasting": "BSF", "blood sugar pp": "BSPP",
    "hba1c": "HbA1c", "lipid profile": "Lipid Profile",
    "thyroid profile": "TFT", "tft": "TFT",
    "urine routine": "Urine R/M", "urine routine & microscopy": "Urine R/M",
    "serum creatinine": "S.Creatinine", "serum electrolytes": "Electrolytes",
    "c-reactive protein": "CRP", "crp": "CRP",
    "esr": "ESR", "pt/inr": "PT/INR",
    "x-ray chest": "X-Ray Chest", "usg abdomen": "USG Abdomen",
    "ct scan": "CT Scan", "mri brain": "MRI Brain",
    "echo": "Echo", "ecg": "ECG", "electrocardiogram": "ECG",
    "dengue ns1": "Dengue NS1", "malaria antigen": "Malaria Ag",
    "hbsag": "HBsAg", "anti-hcv": "Anti-HCV",
    "hiv": "HIV I & II", "vdrl": "VDRL", "widal": "Widal",
    "d-dimer": "D-Dimer", "troponin": "Troponin I",
  };
  const key = s.toLowerCase().replace(/\s+/g, " ").trim();
  for (const [pattern, label] of Object.entries(MAP)) {
    if (key === pattern || key.startsWith(pattern)) return label;
  }
  if (/^[A-Z0-9]{2,5}$/.test(s)) return s.toUpperCase();
  return s;
}

const DEFAULT_TESTS = {
  'CBC': [
    {id:1,  name:'Haemoglobin',        value:'', unit:'g/dL',       refRange:'13.0-17.0',  status:'Normal'},
    {id:2,  name:'TLC',                value:'', unit:'cells/cumm', refRange:'4000-11000', status:'Normal'},
    {id:3,  name:'Platelets',          value:'', unit:'Lacs/cumm',  refRange:'1.5-4.5',    status:'Normal'},
    {id:4,  name:'RBC',                value:'', unit:'mill/cumm',  refRange:'4.5-5.5',    status:'Normal'},
    {id:5,  name:'PCV/HCT',            value:'', unit:'%',          refRange:'40-50',      status:'Normal'},
    {id:6,  name:'MCV',                value:'', unit:'fL',         refRange:'83-101',     status:'Normal'},
    {id:7,  name:'MCH',                value:'', unit:'pg',         refRange:'27-32',      status:'Normal'},
    {id:8,  name:'MCHC',               value:'', unit:'g/dL',       refRange:'31.5-34.5',  status:'Normal'},
    {id:9,  name:'Neutrophils',        value:'', unit:'%',          refRange:'40-80',      status:'Normal'},
    {id:10, name:'Lymphocytes',        value:'', unit:'%',          refRange:'20-40',      status:'Normal'},
    {id:11, name:'Monocytes',          value:'', unit:'%',          refRange:'2-10',       status:'Normal'},
    {id:12, name:'Eosinophils',        value:'', unit:'%',          refRange:'1-6',        status:'Normal'},
  ],
  'LFT': [
    {id:1, name:'Total Bilirubin',     value:'', unit:'mg/dL', refRange:'0.2-1.2',  status:'Normal'},
    {id:2, name:'Direct Bilirubin',    value:'', unit:'mg/dL', refRange:'0.0-0.4',  status:'Normal'},
    {id:3, name:'Indirect Bilirubin',  value:'', unit:'mg/dL', refRange:'0.2-0.8',  status:'Normal'},
    {id:4, name:'SGOT (AST)',          value:'', unit:'U/L',   refRange:'10-40',    status:'Normal'},
    {id:5, name:'SGPT (ALT)',          value:'', unit:'U/L',   refRange:'7-56',     status:'Normal'},
    {id:6, name:'Alkaline Phosphatase',value:'', unit:'U/L',   refRange:'44-147',   status:'Normal'},
    {id:7, name:'Total Protein',       value:'', unit:'g/dL',  refRange:'6.3-8.2',  status:'Normal'},
    {id:8, name:'Albumin',             value:'', unit:'g/dL',  refRange:'3.5-5.0',  status:'Normal'},
    {id:9, name:'Globulin',            value:'', unit:'g/dL',  refRange:'2.0-3.5',  status:'Normal'},
  ],
  'KFT': [
    {id:1, name:'Blood Urea',       value:'', unit:'mg/dL', refRange:'15-40',   status:'Normal'},
    {id:2, name:'Serum Creatinine', value:'', unit:'mg/dL', refRange:'0.6-1.2', status:'Normal'},
    {id:3, name:'Uric Acid',        value:'', unit:'mg/dL', refRange:'3.5-7.2', status:'Normal'},
    {id:4, name:'Sodium',           value:'', unit:'mEq/L', refRange:'136-145', status:'Normal'},
    {id:5, name:'Potassium',        value:'', unit:'mEq/L', refRange:'3.5-5.1', status:'Normal'},
    {id:6, name:'Chloride',         value:'', unit:'mEq/L', refRange:'98-107',  status:'Normal'},
    {id:7, name:'Bicarbonate',      value:'', unit:'mEq/L', refRange:'22-29',   status:'Normal'},
  ],
  'RFT': [
    {id:1, name:'Blood Urea',       value:'', unit:'mg/dL', refRange:'15-40',   status:'Normal'},
    {id:2, name:'Serum Creatinine', value:'', unit:'mg/dL', refRange:'0.6-1.2', status:'Normal'},
    {id:3, name:'Sodium',           value:'', unit:'mEq/L', refRange:'136-145', status:'Normal'},
    {id:4, name:'Potassium',        value:'', unit:'mEq/L', refRange:'3.5-5.1', status:'Normal'},
  ],
  'Lipid Profile': [
    {id:1, name:'Total Cholesterol', value:'', unit:'mg/dL', refRange:'<200', status:'Normal'},
    {id:2, name:'Triglycerides',     value:'', unit:'mg/dL', refRange:'<150', status:'Normal'},
    {id:3, name:'HDL Cholesterol',   value:'', unit:'mg/dL', refRange:'>40',  status:'Normal'},
    {id:4, name:'LDL Cholesterol',   value:'', unit:'mg/dL', refRange:'<100', status:'Normal'},
    {id:5, name:'VLDL',              value:'', unit:'mg/dL', refRange:'<30',  status:'Normal'},
  ],
  'TFT': [
    {id:1, name:'T3',  value:'', unit:'ng/dL',   refRange:'80-200',  status:'Normal'},
    {id:2, name:'T4',  value:'', unit:'μg/dL',   refRange:'5.1-14.1',status:'Normal'},
    {id:3, name:'TSH', value:'', unit:'μIU/mL',  refRange:'0.4-4.0', status:'Normal'},
  ],
  'HbA1c': [
    {id:1, name:'HbA1c',            value:'', unit:'%',     refRange:'<5.7',  status:'Normal'},
    {id:2, name:'Mean Blood Glucose',value:'', unit:'mg/dL', refRange:'<117',  status:'Normal'},
  ],
  'BSF':  [{id:1, name:'Blood Sugar Fasting', value:'', unit:'mg/dL', refRange:'70-100', status:'Normal'}],
  'BSPP': [{id:1, name:'Blood Sugar PP',      value:'', unit:'mg/dL', refRange:'<140',   status:'Normal'}],
  'Urine R/M': [
    {id:1, name:'Colour',          value:'', unit:'',     refRange:'Pale Yellow', status:'Normal'},
    {id:2, name:'Appearance',      value:'', unit:'',     refRange:'Clear',       status:'Normal'},
    {id:3, name:'pH',              value:'', unit:'',     refRange:'4.5-8.0',     status:'Normal'},
    {id:4, name:'Specific Gravity',value:'', unit:'',     refRange:'1.005-1.030', status:'Normal'},
    {id:5, name:'Protein',         value:'', unit:'',     refRange:'Nil',         status:'Normal'},
    {id:6, name:'Glucose',         value:'', unit:'',     refRange:'Nil',         status:'Normal'},
    {id:7, name:'Pus Cells',       value:'', unit:'/HPF', refRange:'0-5',         status:'Normal'},
    {id:8, name:'RBC',             value:'', unit:'/HPF', refRange:'0-2',         status:'Normal'},
  ],
  'Echo': [
    {id:1, name:'EF (Ejection Fraction)', value:'', unit:'%',  refRange:'55-70',       status:'Normal'},
    {id:2, name:'LVEDD',                  value:'', unit:'mm', refRange:'35-56',       status:'Normal'},
    {id:3, name:'LVESD',                  value:'', unit:'mm', refRange:'25-40',       status:'Normal'},
    {id:4, name:'IVS',                    value:'', unit:'mm', refRange:'6-11',        status:'Normal'},
    {id:5, name:'Impression',             value:'', unit:'',   refRange:'Normal Study',status:'Normal'},
  ],
  'ECG': [
    {id:1, name:'Heart Rate',    value:'', unit:'bpm', refRange:'60-100',  status:'Normal'},
    {id:2, name:'Rhythm',        value:'', unit:'',    refRange:'Sinus',   status:'Normal'},
    {id:3, name:'PR Interval',   value:'', unit:'ms',  refRange:'120-200', status:'Normal'},
    {id:4, name:'QRS Duration',  value:'', unit:'ms',  refRange:'<120',    status:'Normal'},
    {id:5, name:'Impression',    value:'', unit:'',    refRange:'Normal ECG',status:'Normal'},
  ],
};

function getDefaultTests(name) {
  const key = Object.keys(DEFAULT_TESTS).find(k =>
    name.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase().includes(name.toLowerCase())
  );
  return key
    ? DEFAULT_TESTS[key].map(t => ({ ...t, id: Date.now() + Math.random() }))
    : [{ id: Date.now(), name: '', value: '', unit: '', refRange: '', status: 'Normal' }];
}


function admissionGross(admission) {
  const services = admission?.services || [];
  const reportRows = admission?.labReports || admission?.lab_reports || [];
  const pharmacyRows = admission?.pharmacyRecords || admission?.pharmacy_records || [];
  const serviceTotal = services
    .filter((service) => !isPathologyCategory(service.svcCat || service.type) && !isMedicineCategory(service.svcCat || service.type))
    .reduce((sum, service) => (
    sum + Number(service.svcTot ?? service.total ?? ((service.svcRate ?? service.rate ?? 0) * (service.svcQty ?? service.qty ?? 1)))
  ), 0);
  const labTotal = reportRows.reduce((sum, report) => sum + Number(report.amount || 0), 0);
  const pharmacyTotal = pharmacyRows.reduce((sum, record) => (
    sum + Number(record.amount ?? (Number(record.quantity || 1) * Number(record.rate || 0)))
  ), 0);
  const billing = admission?.billing || {};
  const discount = Number(billing.discount || 0);
  return Math.max(0, serviceTotal + labTotal + pharmacyTotal - discount);
}

function admissionDue(admission) {
  const billing = admission?.billing || {};
  const gross = admissionGross(admission);
  return Math.max(0, gross - Number(billing.advance || 0) - Number(billing.paidNow || 0));
}

function buildPatientRecords(patient, admission) {
  const discharge = admission?.discharge || {};
  const medical = admission?.medicalHistory || {};
  const services = admission?.services || [];
  const reportsRaw = admission?.labReports ?? admission?.lab_reports ?? [];
  const pharmacyRaw = admission?.pharmacyRecords ?? admission?.pharmacy_records ?? [];
  const reports = Array.isArray(reportsRaw) ? reportsRaw : [];
  const pharmacyRecords = Array.isArray(pharmacyRaw) ? pharmacyRaw : [];
  const treatingDoctor = discharge.doctorName || medical.treatingDoctor || "—";
  const admissionDate = (admission?.dateTime || discharge?.doa || "").slice(0, 10);

  return {
    discharge_summary: discharge.diagnosis || discharge.dod ? [{
      date: (discharge.dod || discharge.doa || admission?.dateTime || "").slice(0, 10),
      summary: discharge.diagnosis || "—",
      doctor: treatingDoctor,
      nextVisit: discharge.expectedDod || "—",
      instructions: discharge.instructions || discharge.notes || "—",
    }] : [],
    reports: reports.length
      ? reports.map((report) => ({
          date: report.date || report.report_date || admissionDate,
          reportType: report.reportType || report.report_type || report.report_name || "Report",
          result: report.remarks || "Saved in billing reports",
          lab: report.reportCategory || report.report_category || "Lab",
          doctor: report.orderedBy || report.ordered_by || treatingDoctor,
          fileUrl: "",
        }))
      : services
          .filter((service) => isPathologyCategory(service.svcCat || service.type))
          .map((service) => ({
            date: service.svcDate || admissionDate,
            reportType: service.svcName || "Report",
            result: "Legacy service entry",
            lab: service.svcCat || "Lab",
            doctor: treatingDoctor,
            fileUrl: "",
          })),
    medicines: pharmacyRecords.length
      ? pharmacyRecords.map((record) => ({
          date: record.date || record.date_given || admissionDate,
          medicine: record.item || record.medicine_name || record.name || "Medicine",
          dosage: String(record.quantity || 1),
          frequency: "—",
          duration: "—",
          prescribedBy: treatingDoctor,
        }))
      : services
          .filter((service) => isMedicineCategory(service.svcCat || service.type))
          .map((service) => ({
            date: service.svcDate || admissionDate,
            medicine: service.svcName || "Medicine",
            dosage: String(service.svcQty || 1),
            frequency: "—",
            duration: "—",
            prescribedBy: treatingDoctor,
          })),
    admission_note: medical.previousDiagnosis || medical.notes ? [{
      date: admissionDate,
      note: medical.notes || medical.previousDiagnosis || "—",
      doctor: medical.treatingDoctor || "—",
      diagnosis: medical.previousDiagnosis || "—",
      plan: medical.currentMedications || "—",
    }] : [],
    medical_history: medical.previousDiagnosis || medical.notes ? [{
      date: admissionDate,
      condition: medical.previousDiagnosis || "—",
      treatment: medical.currentMedications || "—",
      doctor: medical.treatingDoctor || "—",
      notes: medical.notes || "—",
    }] : [],
  };
}

function mapBranchUsers(users = [], resolvedBranchKey = "laxmi") {
  const branchCode = String(resolvedBranchKey || "").toUpperCase() === resolvedBranchKey
    ? resolvedBranchKey
    : (resolvedBranchKey === "raya" ? "RYM" : resolvedBranchKey === "laxmi" || resolvedBranchKey === "lakshmi" ? "LNM" : String(resolvedBranchKey || "").toUpperCase());
  return users
    .filter((user) => user.branch === branchCode)
    .map((user) => ({
      id: user.id,
      employeeId: user.emp_id || user.username,
      username: user.username,
      name: `${user.first_name} ${user.last_name}`.trim() || user.username,
      designation: user.role.replaceAll("_", " ").toUpperCase(),
      email: user.email || "—",
      phone: user.phone_number || "—",
      role: user.role === "admin" ? "Admin" : user.role === "billing" ? "Billing" : user.role === "hod" ? "HOD" : user.role.replaceAll("_", " ").replace(/\b\w/g, (ch) => ch.toUpperCase()),
      departmentName: user.role.replaceAll("_", " ").toUpperCase(),
      joinedDate: user.date_joined?.slice(0, 10) || "—",
    }));
}

function mapLiveBranchPatients(patients = []) {
  return patients.flatMap((patient) => {
    const admissions = Array.isArray(patient.admissions) ? patient.admissions : [];
    return admissions.map((admission) => {
      const discharge = admission?.discharge || {};
      const paymentModeRaw = String(
        patient.payMode ||
        patient.pay_mode ||
        patient.payment_mode ||
        admission?.billing?.paymentMode ||
        admission?.billing?.payment_mode ||
        admission?.billing?.bill_type ||
        ""
      ).toLowerCase().trim();
      const paymentMode =
        paymentModeRaw.includes("cashless") ||
        paymentModeRaw.includes("tpa") ||
        paymentModeRaw.includes("card") ||
        paymentModeRaw.includes("insurance")
          ? "cashless"
          : "cash";
      if (!paymentModeRaw) console.warn("[BranchAdmin] payMode missing for UHID:", patient.uhid);
      const paymentType = paymentMode === "cashless"
        ? (admission?.billing?.insuranceType || patient.cashlessType || (patient.tpa ? "TPA" : (patient.tpaCard || patient.tpaPanelCardNo ? "Card" : "")))
        : "";
      const records = buildPatientRecords(patient, admission);
      return {
        id: `${patient.uhid}-${admission.admNo}`,
        name: patient.patientName,
        age: patient.ageYY || patient.age || "—",
        gender: patient.gender,
        phone: patient.phone,
        department: discharge.department || discharge.wardName || "General",
        doctor: discharge.doctorName || admission?.medicalHistory?.treatingDoctor || "—",
        admissionDate: (discharge.doa || admission.dateTime || "").slice(0, 10),
        dischargeDate: discharge.dod ? discharge.dod.slice(0, 10) : "",
        paymentMode,
        paymentType,
        status: discharge.dod ? "discharged" : "admitted",
        uhid: patient.uhid,
        patientObj: patient,
        admObj: admission,
        records,
      };
    });
  });
}

function buildOverviewData(patientRows = [], employees = []) {
  const today = new Date().toISOString().slice(0, 10);
  const totalRevenue = patientRows.reduce((sum, row) => sum + admissionGross(row.admObj), 0);
  const cashRevenue = patientRows
    .filter((row) => row.paymentMode === "cash")
    .reduce((sum, row) => sum + admissionGross(row.admObj), 0);
  const cashlessRevenue = totalRevenue - cashRevenue;

  return {
    totalPatients: patientRows.length,
    admittedToday: patientRows.filter((row) => row.admissionDate === today).length,
    dischargedToday: patientRows.filter((row) => row.dischargeDate === today).length,
    pendingDischarge: patientRows.filter((row) => row.status === "admitted").length,
    cashRevenue,
    cashlessRevenue,
    totalRevenue,
    pendingDues: patientRows.reduce((sum, row) => sum + admissionDue(row.admObj), 0),
    empCount: employees.length,
    tpaCount: patientRows.filter((row) => String(row.paymentType).toUpperCase() === "TPA").length,
    cardCount: patientRows.filter((row) => String(row.paymentType).toUpperCase() === "CARD").length,
    recentPatients: patientRows.slice().sort((a, b) => b.admissionDate.localeCompare(a.admissionDate)).slice(0, 8),
  };
}

function buildFinancialData(patientRows = []) {
  const cashRows = patientRows.filter((row) => row.paymentMode === "cash");
  const cashTxns = cashRows.map((row) => ({
    patientId: row.id,
    patientName: row.name,
    date: row.admissionDate,
    amount: admissionGross(row.admObj),
    description: row.doctor || "Hospital Charges",
    receivedBy: "Billing Desk",
    status: admissionDue(row.admObj) > 0 ? "pending" : "paid",
  }));

  return {
    cashTotal: cashTxns.reduce((sum, row) => sum + row.amount, 0),
    grandTotal: cashTxns.reduce((sum, row) => sum + row.amount, 0),
    collectedToday: cashTxns
      .filter((row) => row.date === new Date().toISOString().slice(0, 10))
      .reduce((sum, row) => sum + row.amount, 0),
    pendingDues: patientRows.reduce((sum, row) => sum + admissionDue(row.admObj), 0),
    txnCount: cashTxns.length,
    cashTxns,
  };
}

// ─── Excel Export Utility ─────────────────────────────────────────────────────
function exportExcel(rows, filename) {
  if (!rows?.length) return;
  const headers = Object.keys(rows[0]);
  const esc     = (v) => { const s = String(v ?? ""); return (s.includes(",") || s.includes('"')) ? `"${s.replace(/"/g,'""')}"` : s; };
  const csv     = [headers.join(","), ...rows.map(r => headers.map(h => esc(r[h])).join(","))].join("\r\n");
  const blob    = new Blob(["\uFEFF" + csv], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url     = URL.createObjectURL(blob);
  const a       = Object.assign(document.createElement("a"), { href: url, download: `${filename}.xlsx` });
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  bg:            "var(--bg)",
  surface:       "var(--surface)",
  surfaceRaised: "var(--surface-2)",
  card:          "var(--card)",
  border:        "var(--border)",
  borderLight:   "var(--border-strong)",
  text:          "var(--text)",
  textSub:       "var(--text-mid)",
  textMuted:     "var(--text-muted)",
  success:       "var(--success)",
  successDim:    "var(--success-soft)",
  successBdr:    "var(--success-border)",
  warning:       "var(--warning)",
  warningDim:    "var(--warning-soft)",
  warningBdr:    "var(--warning-border)",
  danger:        "var(--danger)",
  dangerDim:     "var(--danger-soft)",
  dangerBdr:     "var(--danger-border)",
  blue:          "var(--info)",
  blueDim:       "var(--info-soft)",
  blueBdr:       "var(--info-border)",
  purple:        "var(--accent)",
  purpleDim:     "var(--accent-soft)",
  purpleBdr:     "var(--accent-border)",
};

// ─── Style Factories ──────────────────────────────────────────────────────────
const mkBadge = (type) => {
  const map = {
    cash:       [T.successDim, T.success, T.successBdr],
    cashless:   [T.purpleDim,  T.purple,  T.purpleBdr ],
    TPA:        [T.purpleDim,  T.purple,  T.purpleBdr ],
    Card:       [T.blueDim,    T.blue,    T.blueBdr   ],
    active:     [T.successDim, T.success, T.successBdr],
    admitted:   [T.blueDim,    T.blue,    T.blueBdr   ],
    discharged: [T.surfaceRaised, T.textMuted, T.borderLight],
    pending:    [T.warningDim, T.warning, T.warningBdr],
    paid:       [T.successDim, T.success, T.successBdr],
    unpaid:     [T.dangerDim,  T.danger,  T.dangerBdr ],
  };
  const [bg, c, b] = map[type] || [T.card, T.textSub, T.border];
  return { display:"inline-flex", alignItems:"center", padding:"3px 10px", borderRadius:"20px", fontSize:"11px", fontWeight:"600", letterSpacing:"0.4px", background:bg, color:c, border:`1px solid ${b}`, whiteSpace:"nowrap" };
};

const mkInput = () => ({
  background: T.surfaceRaised, border:`1px solid ${T.border}`, color:T.text,
  padding:"10px 14px", borderRadius:"10px", fontSize:"14px", fontFamily:UI_FONT_STACK, outline:"none",
});

const mkBtn = (v, theme) => {
  const p  = theme?.primary       || "#3b82f6";
  const pd = theme?.primaryDim    || "#0c1e40";
  const pb = theme?.primaryBorder || "#1d4ed8";
  const defs = {
    primary: [p,           "#fff",    p          ],
    ghost:   ["transparent",T.textSub, T.border  ],
    success: [T.successDim, T.success, T.successBdr],
    danger:  [T.dangerDim,  T.danger,  T.dangerBdr ],
    excel:   ["#071a10",   "#4ade80", "#145228"  ],
    dim:     [pd,           p,         pb         ],
  };
  const [bg, c, b] = defs[v] || defs.ghost;
  return {
    padding:"9px 18px", borderRadius:"10px", fontSize:"14px", fontFamily:UI_FONT_STACK,
    cursor:"pointer", fontWeight:"600", border:`1px solid ${b}`,
    background:bg, color:c, transition:"all 0.15s",
    display:"inline-flex", alignItems:"center", gap:"6px", whiteSpace:"nowrap",
  };
};

// ─── Records Form Styles (module-scope so they don't change between renders) ─
const lblStyle = { fontSize:"10px", letterSpacing:"1px", textTransform:"uppercase", color:T.textMuted, fontWeight:"700", marginBottom:"5px" };
const inpStyle = { width:"100%", background:T.card, border:`1px solid ${T.border}`, borderRadius:"8px", color:T.text, fontSize:"13px", padding:"9px 11px", fontFamily:"inherit", outline:"none", boxSizing:"border-box" };
const txaStyle = { ...inpStyle, resize:"vertical" };
const ROStyle  = { fontSize:"13px", color:T.text, fontWeight:"600", padding:"9px 0", lineHeight:1.5, whiteSpace:"pre-wrap" };

// Field/SectionCard MUST be declared at module scope. If they were declared
// inside RecordsView() they would receive a fresh function identity on every
// keystroke, causing React to unmount/remount the underlying <input>/<textarea>
// and lose focus after each character.
function Field({ label, value, onChange, type = "text", placeholder = "", colSpan = 1, multiline = false, rows = 3, editable, list }) {
  return (
    <div style={{ gridColumn: `span ${colSpan}`, display:"flex", flexDirection:"column" }}>
      <label style={lblStyle}>{label}</label>
      {editable ? (
        multiline
          ? <textarea rows={rows} placeholder={placeholder} value={value || ""} onChange={(e) => onChange(e.target.value)} style={txaStyle} />
          : <input type={type} placeholder={placeholder} value={value || ""} onChange={(e) => onChange(e.target.value)} style={inpStyle} list={list} />
      ) : (
        <div style={ROStyle}>{value || "—"}</div>
      )}
    </div>
  );
}

function SectionCard({ icon, title, subtitle, children, theme }) {
  return (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"12px", marginBottom:"16px", overflow:"hidden" }}>
      <div style={{ display:"flex", alignItems:"center", gap:"12px", padding:"14px 18px", borderBottom:`1px solid ${T.border}`, background:T.card }}>
        <div style={{ width:34, height:34, borderRadius:8, background:theme?.primaryDim, border:`1px solid ${theme?.primaryBorder}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>{icon}</div>
        <div>
          <div style={{ fontSize:"13px", fontWeight:"700", color:T.text }}>{title}</div>
          {subtitle && <div style={{ fontSize:"11px", color:T.textMuted, marginTop:"2px" }}>{subtitle}</div>}
        </div>
      </div>
      <div style={{ padding:"18px" }}>{children}</div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BranchAdminDashboard({
  currentUser,
  db,
  locId,
  printRequests = [],
  onApprovePrint,
  onViewBill,
  onLogout,
  branchId   = "raya",
  branchName = "",
  adminName  = "Admin",
}) {
  const contentScrollRef = useRef(null);
  const resolvedBranchRaw  = locId || String(currentUser?.branch || "").toLowerCase() || branchId;
  const resolvedBranchCode = String(currentUser?.branchCode || "").toUpperCase() || (
    String(currentUser?.branch || "").toUpperCase() || (
      resolvedBranchRaw === "raya" ? "RYM" :
      resolvedBranchRaw === "laxmi" || resolvedBranchRaw === "lakshmi" ? "LNM" :
      String(resolvedBranchRaw || "").toUpperCase()
    )
  );
  const resolvedBranchKey = (
    resolvedBranchRaw === "lnm" ? "laxmi" :
    resolvedBranchRaw === "rym" ? "raya"  :
    resolvedBranchRaw
  );
  const theme              = BRANCH_THEMES[resolvedBranchKey] || BRANCH_THEMES.default;
  const resolvedBranchName = branchName || theme.label;
  const resolvedAdminName  = currentUser?.name || adminName;

  const [nav,      setNav]      = useState("overview");
  const [range,    setRange]    = useState("monthly");
  const [fromDate, setFromDate] = useState("");
  const [toDate,   setToDate]   = useState("");

  const [overview,   setOverview]   = useState(null);
  const [patients,   setPatients]   = useState([]);
  const [cashPats,   setCashPats]   = useState([]);
  const [financials, setFinancials] = useState(null);
  const [employees,  setEmployees]  = useState([]);

  const [selPatient, setSelPatient] = useState(null);
  const [recTab,     setRecTab]     = useState("discharge_summary");
  const [editableRows, setEditableRows] = useState([]);
  const [persistedSvcRows, setPersistedSvcRows] = useState([]); // survives tab switches
  const [persistedMedRows, setPersistedMedRows] = useState([]); // med rows survive tab switches
  const [savingRecords, setSavingRecords] = useState(false);
  const [isRecordDirty, setIsRecordDirty] = useState(false);
  const isRecordDirtyRef = useRef(false);
  const [medicineMaster, setMedicineMaster] = useState([]);
  const [billEdit, setBillEdit] = useState({ discount: 0, advance: 0 });

  // ─── Doctors registry ────────────────────────────────────────────────────
  const { doctors, addDoctor, removeDoctor } = useDoctors(resolvedBranchCode);
  const [serviceMaster, setServiceMaster] = useState([]);

  // Fetch medicine master on mount
  useEffect(() => {
    apiService.getMedicineMaster()
      .then(list => setMedicineMaster(Array.isArray(list) ? list : []))
      .catch(() => setMedicineMaster([]));
  }, []);

  const [search,    setSearch]    = useState("");
  const [statusFil, setStatusFil] = useState("all");

  const [empForm,  setEmpForm]  = useState(EMPTY_EMP_FORM);
  const [empError, setEmpError] = useState("");
  const [modal,    setModal]    = useState(null);

  // ─── Load data ────────────────────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    const loadLiveData = async () => {
      setSearch("");
      setStatusFil("all");
      if (nav !== "records") setSelPatient(null);

      const branchPatients = (
        (Array.isArray(db?.[resolvedBranchKey]) && db[resolvedBranchKey]) ||
        (Array.isArray(db?.[resolvedBranchRaw]) && db[resolvedBranchRaw]) ||
        (resolvedBranchCode === "LNM" && (Array.isArray(db?.laxmi) ? db.laxmi : [])) ||
        (resolvedBranchCode === "RYM" && (Array.isArray(db?.raya) ? db.raya : [])) ||
        []
      );
      const safeBranchPatients = branchPatients.length
        ? branchPatients
        : Object.values(db || {}).find((rows) => Array.isArray(rows) && rows.length) || [];
      const mappedPatients = mapLiveBranchPatients(safeBranchPatients);
      if (!active) return;

      setPatients(mappedPatients);
      setCashPats(mappedPatients.filter(p => p.paymentMode === "cash"));
      setFinancials(buildFinancialData(mappedPatients));

      try {
        const users = await apiService.getUsers();
        if (!active) return;
        const branchUsers = mapBranchUsers(users, resolvedBranchCode);
        setEmployees(branchUsers);
        setOverview(buildOverviewData(mappedPatients, branchUsers));
      } catch (error) {
        if (!active) return;
        setEmployees([]);
        setOverview(buildOverviewData(mappedPatients, []));
      }

    };

    loadLiveData();
    return () => { active = false; };
  }, [nav, range, fromDate, toDate, db, resolvedBranchKey, resolvedBranchRaw, resolvedBranchCode]);

  useEffect(() => {
    setIsRecordDirty(false);
    isRecordDirtyRef.current = false;
    setPersistedSvcRows([]); // reset persisted svc rows when patient changes
    setPersistedMedRows([]); // reset persisted med rows when patient changes
  }, [nav, selPatient?.uhid, selPatient?.admObj?.admNo]);

  useEffect(() => {
    const b = selPatient?.admObj?.billing || {};
    setBillEdit({ discount: Number(b.discount||0), advance: Number(b.advance||0) });
  }, [selPatient?.uhid, selPatient?.admObj?.admNo]);

  useEffect(() => {
    if (nav !== "records" || !selPatient) {
      setEditableRows([]);
      return;
    }
    if (isRecordDirtyRef.current) return;
    const admission = selPatient.admObj || {};
    const discharge = admission.discharge || {};
    const medical = admission.medicalHistory || {};

    const rowsByTab = {
      discharge_summary: [{
        doa:             discharge.doa             || discharge.doa_date        || admission.dateTime    || "",
        expectedDod:     discharge.expectedDod     || discharge.expected_dod    || "",
        dod:             discharge.dod             || discharge.dod_date        || "",
        department:      discharge.department      || discharge.wardName        || medical.department    || "",
        wardName:        discharge.wardName        || discharge.ward_name       || "",
        roomNo:          discharge.roomNo          || discharge.room_no         || discharge.roomNumber  || "",
        bedNo:           discharge.bedNo           || discharge.bed_no          || discharge.bedNumber   || "",
        doctorName:      discharge.doctorName      || discharge.doctor_name     || medical.treatingDoctor || "",
        diagnosis:       discharge.diagnosis       || discharge.finalDiagnosis  || discharge.final_diagnosis || medical.provisionalDiagnosis || "",
        dischargeStatus: discharge.dischargeStatus || discharge.discharge_status|| discharge.status      || "",
        instructions:    discharge.instructions   || discharge.discharge_instructions || "",
        notes:           discharge.notes           || "",
      }],
      admission_note: [{
        treatingDoctor: medical.treatingDoctor || discharge.doctorName || "",
        doctorQual: medical.doctorQual || "",
        presentComplaints: medical.presentComplaints || "",
        chiefComplaints: medical.chiefComplaints || "",
        bp: medical.bp || "",
        pulse: medical.pulse || "",
        spo2: medical.spo2 || "",
        temp: medical.temp || "",
        chest: medical.chest || "",
        cvs: medical.cvs || "",
        cns: medical.cns || "",
        pa: medical.pa || "",
        investigations: medical.investigations || "",
        provisionalDiagnosis: medical.provisionalDiagnosis || "",
        treatmentAdvised: medical.treatmentAdvised || "",
        notes: medical.notes || "",
      }],
      medical_history: [{
        previousDiagnosis:  medical.previousDiagnosis  || medical.previous_diagnosis   || medical.past_history    || medical.pastHistory       || medical.history            || "",
        pastSurgeries:      medical.pastSurgeries      || medical.past_surgeries        || medical.previous_surgery|| medical.surgeries         || "",
        currentMedications: medical.currentMedications || medical.current_medications   || medical.medications     || medical.on_medications    || medical.current_drugs      || "",
        knownAllergies:     medical.knownAllergies     || medical.known_allergies       || medical.allergies       || medical.drug_allergy      || medical.allergy            || "",
        chronicConditions:  medical.chronicConditions  || medical.chronic_conditions    || medical.comorbidities   || medical.co_morbidities    || medical.chronic_disease    || "",
        familyHistory:      medical.familyHistory      || medical.family_history        || medical.family_medical_history || "",
        smokingStatus:      medical.smokingStatus      || medical.smoking_status        || medical.smoking         || medical.tobacco_use       || "",
        alcoholUse:         medical.alcoholUse         || medical.alcohol_use           || medical.alcohol         || medical.alcohol_history   || "",
        treatingDoctor:     medical.treatingDoctor     || medical.treating_doctor       || discharge.doctorName    || "",
        notes:              medical.notes              || medical.other_notes           || medical.general_notes   || medical.remarks           || "",
      }],
      services: (() => {
        const svcList = Array.isArray(admission?.services) ? admission.services : [];
        return svcList.map((s, i) => ({
          _localId:      s.id ? `svc-${s.id}` : `svc-seed-${i}`,
          isSvc:         true,
          medicine_name: s.svcName || s.description || s.title || "",
          date_given:    (s.svcDate || String(admission?.dateTime || "").slice(0, 10)),
          quantity:      Number(s.svcQty  || s.qty  || 1),
          rate: Number(s.rate || s.svcRate || s.unit_price || s.price || 0),
          batch_no:      s.svcCode || s.code || s.cghs || "",
          expiry_date:   "",
          amount: Number(s.svcTot || s.total || s.amount || (Number(s.rate||s.svcRate||0) * Number(s.svcQty||s.qty||1))),
        }));
      })(),
      // reports and medicines are loaded by the dedicated API fetch effect below
      // pre-seed from already-loaded admObj so tab isn't blank while API loads
      reports: [],
      medicines: (() => {
        const pharma = Array.isArray(admission?.pharmacyRecords)  ? admission.pharmacyRecords
                     : Array.isArray(admission?.pharmacy_records) ? admission.pharmacy_records
                     : [];
        const svc    = Array.isArray(admission?.services) ? admission.services : [];
        if (pharma.length) return pharma.map((r, i) => ({
          _localId:      r.id || `m-preseed-${i}`,
          medicine_name: r.medicine_name || r.item || r.name || "",
          date_given:    (r.date_given || r.date || "").slice(0, 10),
          quantity:      Number(r.quantity || r.qty || 1),
          rate:          Number(r.rate || 0),
          batch_no:      r.batch_no || r.batchNo || "",
          expiry_date:   (r.expiry_date || r.expiryDate || "").slice(0, 10),
          amount:        Number(r.amount || 0),
        }));
        const medStr = medical.currentMedications || medical.current_medications
                    || medical.medications || medical.on_medications || "";
        if (medStr) {
          return medStr.split(/[\n,;]+/).map((m, i) => ({
            _localId:      `m-hist-${i}`,
            medicine_name: m.trim(),
            date_given:    String(admission.dateTime || "").slice(0, 10),
            quantity:      1,
            rate:          0,
            batch_no:      "",
            expiry_date:   "",
            amount:        0,
          })).filter(r => r.medicine_name);
        }
        return svc
          .filter(s => ["med","pharma","drug","pharmacy","tablet","injection","iv fluid","consumable"].some(k => (s.svcCat||s.type||"").toLowerCase().includes(k)))
          .map((s, i) => ({
            _localId: s.id || `m-svc-${i}`,
            medicine_name: s.svcName || "",
            date_given: (s.svcDate || "").slice(0, 10),
            quantity: Number(s.svcQty || 1),
            rate: Number(s.svcRate || 0),
            batch_no: "",
            expiry_date: "",
            amount: Number(s.svcTot || s.total || 0),
          }));
      })(),
      final_bill: (() => {
        const svcList = Array.isArray(admission?.services) ? admission.services : [];
        const pharma  = Array.isArray(admission?.pharmacyRecords)  ? admission.pharmacyRecords
                      : Array.isArray(admission?.pharmacy_records) ? admission.pharmacy_records
                      : [];
        const PURE_MED = ["pharmacy","pharma","medicine","drug","tablet","capsule","injection","iv fluid","consumable"];
        // All non-medicine services (room, consultant, oxygen, procedures etc)
        const svcRows = svcList
          .filter(s => !PURE_MED.some(k => (s.svcCat||s.type||"").toLowerCase().includes(k)))
          .map((s, i) => ({
            _localId:      s.id ? `svc-${s.id}` : `svc-${i}`,
            isSvc:         true,
            medicine_name: s.svcName || s.title || "Service",
            date_given:    (s.svcDate || admission?.dateTime || "").slice(0, 10),
            quantity:      Number(s.svcQty  || s.qty  || 1),
            rate: Number(s.rate || s.svcRate || s.unit_price || s.price || 0),
            batch_no:      s.svcCode || s.code || "",
            expiry_date:   "",
            amount:        Number(s.svcTot  || s.total || (Number(s.svcRate||0) * Number(s.svcQty||1))),
          }));
        // Pharmacy rows
        const medRows = pharma.map((r, i) => ({
          _localId:      r.id ? `med-${r.id}` : `med-${i}`,
          isSvc:         false,
          medicine_name: r.medicine_name || r.item || r.name || "",
          date_given:    (r.date_given || r.date || "").slice(0, 10),
          quantity:      Number(r.quantity || r.qty || 1),
          rate:          Number(r.rate || 0),
          batch_no:      r.batch_no || "",
          expiry_date:   (r.expiry_date || "").slice(0, 10),
          amount:        Number(r.amount || (Number(r.quantity||1) * Number(r.rate||0))),
        }));
        return [...svcRows, ...medRows];
      })(),
    };

    setEditableRows(rowsByTab[recTab] || []);
  }, [nav, selPatient?.uhid, selPatient?.admObj?.admNo, recTab]);

  useEffect(() => {
    if (nav !== "records" || !selPatient) return;
    if (recTab !== "reports" && recTab !== "medicines" && recTab !== "final_bill" && recTab !== "services") return;
    const admObj = selPatient?.admObj;
    const admissionDateFallback = admObj?.dateTime || admObj?.discharge?.doa || "";
    const uhid = selPatient?.uhid;
    const admNo = selPatient?.admObj?.admNo;
    if (!uhid || !admNo) return;
    const admDate = admissionDateFallback.slice(0, 10);
    const discharge = admObj?.discharge || {};
    const doctor = discharge.doctorName || admObj?.medicalHistory?.treatingDoctor || "";
    const services = Array.isArray(admObj?.services) ? admObj.services : [];
    let active = true;

    if (recTab === "services") {
      const svcList = Array.isArray(admObj?.services) ? admObj.services : [];
      // Only reload from API if we don't have persisted edits for this patient
      if (persistedSvcRows.length === 0) {
        // Fetch service master to look up rates by CGHS code
        fetch("http://127.0.0.1:8000/api/service-master/", {
          headers: { Authorization: "Bearer " + (sessionStorage.getItem("hms_token") || "") }
        }).then(r=>r.json()).then(master=>{
          if (!active) return;
          const ml = Array.isArray(master) ? master : master?.results || [];
          const lr = (code, name) => {
            const c = (code||"").toUpperCase().trim();
            const n = (name||"").toLowerCase().trim();
            const hit = ml.find(s=>s.code===c)
              || ml.find(s=>(s.description||"").toLowerCase()===n)
              || ml.find(s=>n.length>4&&(s.description||"").toLowerCase().includes(n.slice(0,6)));
            return Number(hit?.rate || 0);
          };
          const mapped = svcList.map((s,i)=>{
            const rate = Number(s.rate||s.svcRate||s.unit_price||s.price||0) || lr(s.svcCode||s.code, s.svcName||s.title||s.description);
            const qty  = Number(s.svcQty||s.qty||1);
            return {
              _localId:      s.id ? "svc-"+s.id : "svc-seed-"+i,
              isSvc:         true,
              medicine_name: s.svcName||s.description||s.title||"",
              date_given:    s.svcDate||admDate,
              quantity:      qty,
              rate,
              batch_no:      s.svcCode||s.code||s.cghs||"",
              expiry_date:   "",
              amount:        rate*qty,
            };
          });
          isRecordDirtyRef.current = false;
          setEditableRows(mapped);
          setPersistedSvcRows(mapped);
        }).catch(()=>{
          if (!active) return;
          const mapped = svcList.map((s,i)=>({
            _localId:      s.id ? "svc-"+s.id : "svc-seed-"+i,
            isSvc:         true,
            medicine_name: s.svcName||s.description||s.title||"",
            date_given:    s.svcDate||admDate,
            quantity:      Number(s.svcQty||s.qty||1),
            rate:          0,
            batch_no:      s.svcCode||s.code||s.cghs||"",
            expiry_date:   "",
            amount:        0,
          }));
          isRecordDirtyRef.current = false;
          setEditableRows(mapped);
          setPersistedSvcRows(mapped);
        });
      } else {
        // Restore persisted edits
        isRecordDirtyRef.current = false;
        setEditableRows(persistedSvcRows);
      }
      return () => { active = false; };
    }

    if (recTab === "medicines" || recTab === "final_bill") {
      const load = async () => {
        try {
          const data = await apiService.getPharmacyRecords(uhid, admNo);
          if (!active) return;
          // Handle all possible API response shapes
          let items = [];
          if (Array.isArray(data))            items = data;
          else if (Array.isArray(data?.results)) items = data.results;
          else if (Array.isArray(data?.data))    items = data.data;
          else if (data && typeof data === "object") items = Object.values(data).find(v => Array.isArray(v)) || [];
          console.log("[BranchAdmin] pharmacy raw items:", items.length, items[0]);
          // Build service rows from admObj (room, consultant, etc) — always include these
          const PURE_MED_CATS = ["pharmacy","pharma","medicine","drug","tablet","capsule","injection","iv fluid","consumable"];
          const svcRowsForBill = services
            .filter(s => !PURE_MED_CATS.some(k => (s.svcCat||s.type||"").toLowerCase().includes(k)))
            .map((s, i) => ({
              _localId:      s.id ? `svc-${s.id}` : `svc-${i}`,
              isSvc:         true,
              medicine_name: s.svcName || s.title || "Service",
              date_given:    (s.svcDate || admDate),
              quantity:      Number(s.svcQty  || s.qty  || 1),
              rate: Number(s.rate || s.svcRate || s.unit_price || s.price || 0),
              batch_no:      s.svcCode || s.code || "",
              expiry_date:   "",
              amount: Number(s.svcTot || s.total || s.amount || (Number(s.rate||s.svcRate||0) * Number(s.svcQty||s.qty||1))),
            }));

          if (items.length) {
            const medRows = items.map((r, i) => {
              if (i === 0) console.log("[BranchAdmin] pharmacy item keys:", Object.keys(r), r);
              return {
                _localId:      r.id           || `m-${i}`,
                isSvc:         false,
                medicine_name: r.medicine_name || r.item    || r.name     || r.drug_name || r.medicine || r.description || "",
                date_given:    String(r.date_given || r.given_date || r.date || admDate).slice(0, 10),
                quantity:      Number(r.quantity   || r.qty  || r.units   || 1),
                rate:          Number(r.rate        || r.unit_price || r.price || r.cost || 0),
                batch_no:      r.batch_no || r.batch_number || r.batch || "",
                expiry_date:   String(r.expiry_date || r.expiry || r.exp_date || "").slice(0, 10),
                amount:        Number(r.amount || r.total || (Number(r.quantity||1)*Number(r.rate||0))),
              };
            });
            console.log("[BranchAdmin] bill rows — svc:", svcRowsForBill.length, "med:", medRows.length);
            isRecordDirtyRef.current = false;
            // For final_bill: always show svc rows + med rows together
            // For medicines tab: show only med rows
            if (recTab === "final_bill") {
              // seed persistedMedRows only once
              if (persistedMedRows.length === 0) setPersistedMedRows(medRows);
              // editableRows for final_bill = ONLY med rows (svc rows come from persistedSvcRows/svcRowsStatic in renderFinalBill)
              isRecordDirtyRef.current = false;
              setEditableRows(persistedMedRows.length ? persistedMedRows : medRows);
            } else {
              // medicines tab: only pharmacy rows
              isRecordDirtyRef.current = false;
              if (persistedMedRows.length === 0) {
                setPersistedMedRows(medRows);
                setEditableRows(medRows);
              } else {
                setEditableRows(persistedMedRows);
              }
            }
          } else {
            console.warn("[BranchAdmin] pharmacy API returned empty");
            console.log("[BranchAdmin] svcRowsForBill:", svcRowsForBill.length, svcRowsForBill, "raw services:", services.length, services);
            if (recTab === "final_bill") {
              isRecordDirtyRef.current = false;
              setEditableRows(svcRowsForBill);
              return;
            }
            const svcMeds = services.filter(s =>
              ["med","pharma","drug","pharmacy","tablet","injection","iv fluid","consumable"]
                .some(k => (s.svcCat||s.type||"").toLowerCase().includes(k))
            ).map((s, i) => ({
              _localId:      s.id || `m-svc-${i}`,
              medicine_name: s.svcName || s.name || "",
              date_given:    String(s.svcDate || admDate).slice(0, 10),
              quantity:      Number(s.svcQty  || 1),
              rate:          Number(s.svcRate || 0),
              batch_no:      "",
              expiry_date:   "",
              amount:        Number(s.svcTot  || s.total || 0),
            }));
            console.log("[BranchAdmin] services fallback meds:", svcMeds);
            if (svcMeds.length) {
              setEditableRows(svcMeds);
            } else {
              // Last resort: parse currentMedications string from medical history
              const medHistory = admObj?.medicalHistory || {};
              const medStr = medHistory.currentMedications || medHistory.current_medications
                          || medHistory.medications || medHistory.on_medications || "";
              console.log("[BranchAdmin] medHistory fallback string:", medStr);
              if (medStr) {
                // fetch medicine master to cross-ref rates/batch/expiry
                let master = [];
                try { master = await apiService.getMedicineMaster(); } catch(_) {}
                // Normalize: uppercase, strip dots, strip common prefixes, collapse spaces
                const normalizeMedName = (s) => String(s || "")
                  .toUpperCase()
                  .replace(/\./g, "")
                  .replace(/\b(INJ|CAP|TAB|SYP|SYRUP|OINT|NEB|AMP|VIAL|SACHET|GEL|CREAM|DROP|EYE|EAR)\b/gi, "")
                  .replace(/[^A-Z0-9%\/]/g, " ")
                  .replace(/\s+/g, " ")
                  .trim();
                const masterMap = {};
                (Array.isArray(master) ? master : []).forEach(m => {
                  if (m.name) masterMap[normalizeMedName(m.name)] = m;
                });
                const histRows = medStr.split(/[\n,;]+/).map((m, i) => {
                  const name = m.trim();
                  if (!name) return null;
                  const normName = normalizeMedName(name);
                  // Try exact normalized match first, then partial
                  const masterKey = masterMap[normName]
                    ? normName
                    : Object.keys(masterMap).find(k =>
                        k.includes(normName) || normName.includes(k)
                      );
                  const masterEntry = masterKey ? masterMap[masterKey] : null;
                  const rate = Number(masterEntry?.rate || masterEntry?.price || 0);
                  return {
                    _localId:      `m-hist-${i}`,
                    medicine_name: name,
                    date_given:    admDate,
                    quantity:      1,
                    rate,
                    batch_no:      masterEntry?.batch_no || masterEntry?.batch || "",
                    expiry_date:   masterEntry?.expiry_date || masterEntry?.expiry || "",
                    amount:        rate,
                  };
                }).filter(r => r && r.medicine_name.length > 0);
                console.log("[BranchAdmin] medHistory rows with master lookup:", histRows);
                setEditableRows(histRows);
              } else {
                // No medicines anywhere — set one blank row so user can add
                console.warn("[BranchAdmin] No medicines found anywhere — showing blank row");
                setEditableRows([{
                  _localId:      `m-blank-0`,
                  medicine_name: "",
                  date_given:    admDate,
                  quantity:      1,
                  rate:          0,
                  batch_no:      "",
                  expiry_date:   "",
                  amount:        0,
                }]);
              }
            }
          }
        } catch (_e) {
          console.error("[BranchAdmin] pharmacy fetch error:", _e);
          if (!active) return;
          setEditableRows(buildMedicineRowsForBranchAdmin([], [], services, admissionDateFallback));
        }
      };
      load();
      return () => { active = false; };
    }

    if (recTab === "reports") {
      const load = async () => {
        try {
          const data = await apiService.getLabReports(uhid, admNo);
          if (!active) return;
          let items = [];
          if (Array.isArray(data))               items = data;
          else if (Array.isArray(data?.results)) items = data.results;
          else if (Array.isArray(data?.data))    items = data.data;
          else if (data && typeof data === "object") items = Object.values(data).find(v => Array.isArray(v)) || [];
          console.log("[BranchAdmin] lab-reports raw items:", items.length, items[0]);
          // Debug: show what's in admObj directly
          const admObjDebug = selPatient?.admObj || {};
          console.log("[BranchAdmin] admObj.labReports:", admObjDebug.labReports);
          console.log("[BranchAdmin] admObj.lab_reports:", admObjDebug.lab_reports);
          console.log("[BranchAdmin] admObj.services count:", admObjDebug.services?.length, "cats:", admObjDebug.services?.map(s=>s.svcCat));
          const getDefaultTests = (name) => {
            const n = (name || "").toLowerCase().trim();
            // Exact match first
            const exactKey = Object.keys(DEFAULT_TESTS).find(k => k.toLowerCase() === n);
            if (exactKey) return DEFAULT_TESTS[exactKey].map(t => ({...t, id: Date.now() + Math.random()}));
            // Partial match
            const partialKey = Object.keys(DEFAULT_TESTS).find(k =>
              n.includes(k.toLowerCase()) || k.toLowerCase().includes(n)
            );
            return partialKey
              ? DEFAULT_TESTS[partialKey].map(t => ({...t, id: Date.now() + Math.random()}))
              : [{id: Date.now(), name:"", value:"", unit:"", refRange:"", status:"Normal"}];
          };
          const fromLab = items.map((r, i) => {
            if (i === 0) console.log("[BranchAdmin] lab item keys:", Object.keys(r), r);
            // Keep full name for display — only use normalizeReportName for DEFAULT_TESTS lookup
            const rawName = r.report_name || r.reportName || r.name || r.test_name || "Report";
            return {
              _localId:   r.id             || `r-lab-${i}`,
              reportName: rawName,
              reportType: r.report_type    || r.reportType    || r.category    || r.type        || "Haematology",
              date:       String(r.report_date || r.date      || r.test_date   || admDate).slice(0, 10),
              orderedBy:  r.ordered_by     || r.orderedBy     || r.doctor_name || r.doctor      || doctor,
              amount:     Number(r.amount  || r.rate          || r.price       || r.cost        || 0),
              remarks:    r.remarks        || r.interpretation || r.finding    || r.observation || "",
              impression: r.impression     || r.conclusion    || "",
              tests:      (() => {
                const t = Array.isArray(r.tests) ? r.tests : (Array.isArray(r.test_rows) ? r.test_rows : []);
                if (t.length) return t;
                return getDefaultTests(normalizeReportName(rawName));
              })(),
            };
          });
          console.log("[BranchAdmin] fromLab rows:", fromLab.length);
          console.log("[BranchAdmin] ALL service cats:", services.map(s => ({ name: s.svcName, cat: s.svcCat, type: s.type })));
          // Only add service rows that are NOT already in lab reports
          const labIds = new Set(fromLab.map(r => String(r._localId)));
          const fromSvc = services
            .filter(s => {
              const cat = (s.svcCat || s.type || '').toLowerCase();
              return ['path','lab','bio','haem','micro','sero','histo',
                'radiology','x-ray','xray','scan','echo','usg','mri','ct','ecg']
                .some(k => cat.includes(k));
            })
            .filter(s => s.svcName && !labIds.has(String(s.id)))
            .map((s, i) => {
              const name = normalizeReportName(s.svcName || "Report");
              return {
                _localId:   s.id || `r-svc-${i}`,
                reportName: name,
                reportType: s.svcCat  || "Haematology",
                date:       String(s.svcDate || admDate).slice(0, 10),
                orderedBy:  doctor,
                amount: Number(s.svcTot || s.total || s.amount || (Number(s.rate||s.svcRate||0) * Number(s.svcQty||s.qty||1))),
                remarks: "", impression: "",
                tests: getDefaultTests(normalizeReportName(s.svcName || "")),
              };
            });
          console.log("[BranchAdmin] fromSvc rows:", fromSvc.length);

          // Parse investigations text from admission note into report rows
          const investigationsText = admObj?.medicalHistory?.investigations
                                  || admObj?.medicalHistory?.investigation
                                  || admObj?.medicalHistory?.tests_ordered
                                  || "";
          const existingNames = new Set([
            ...fromLab.map(r => r.reportName.toLowerCase().trim()),
            ...fromSvc.map(r => r.reportName.toLowerCase().trim()),
          ]);
          const fromInvestigations = investigationsText
            ? investigationsText
                .split(/[,;\n]+/)
                .map(s => s.trim())
                .filter(s => s.length > 2)
                .map(s => {
                  // strip leading labels like "1.", "-", "Adv:", "Inv:"
                  return s.replace(/^(\d+[.)\s]+|[-•*]+|adv[:\s]+|inv[:\s]+|investigation[s]?[:\s]+)/i, '').trim();
                })
                .filter(s => s.length > 1)
                .filter(s => {
                  const norm = normalizeReportName(s).toLowerCase().trim();
                  return !existingNames.has(norm) && !existingNames.has(s.toLowerCase().trim());
                })
                .map((s, i) => {
                  const name = normalizeReportName(s);
                  return {
                    _localId:   `r-inv-${Date.now()}-${i}`,
                    reportName: name,
                    reportType: "Haematology",
                    date:       admDate,
                    orderedBy:  doctor,
                    amount:     0,
                    remarks:    "",
                    impression: "",
                    tests:      getDefaultTests(name),
                  };
                })
            : [];
          console.log("[BranchAdmin] fromInvestigations rows:", fromInvestigations.length, investigationsText);
          setEditableRows([...fromLab, ...fromSvc, ...fromInvestigations]);
        } catch (_e) {
          if (!active) return;
          // fallback to services on error
          const admObj = selPatient?.admObj;
          const svcFallback = Array.isArray(admObj?.services) ? admObj.services : [];
          const admDateFb = (admObj?.dateTime || admObj?.discharge?.doa || "").slice(0, 10);
          const docFb = (admObj?.discharge?.doctorName || admObj?.medicalHistory?.treatingDoctor || "");
          setEditableRows(svcFallback
            .filter(s => {
              const cat = (s.svcCat || s.type || "").toLowerCase();
              return !["med","pharma","drug","pharmacy","tablet","injection","iv fluid","consumable","room","consultant","icu"].some(k => cat.includes(k));
            })
            .filter(s => s.svcName)
            .map((s, i) => ({
              _localId: s.id || `r-svc-${i}`,
              reportName: s.svcName || "Report",
              reportType: s.svcCat || "Haematology",
              date: (s.svcDate || admDateFb).slice(0, 10),
              orderedBy: docFb,
              amount: Number(s.svcTot || s.total || s.amount || (Number(s.rate||s.svcRate||0) * Number(s.svcQty||s.qty||1))),
              remarks: "", impression: "", tests: [],
            })));
        }
      };
      load();
      return () => { active = false; };
    }

    return () => { active = false; };
  }, [nav, recTab, selPatient?.uhid, selPatient?.admObj?.admNo]);

  // ─── Filter helpers ───────────────────────────────────────────────────────
  const filterPatients = (list) => list.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFil === "all" || p.status === statusFil;
    return matchSearch && matchStatus;
  });

  // ─── Mutations ────────────────────────────────────────────────────────────
  async function addEmployee(e) {
    e.preventDefault();
    setEmpError("");
    if (!empForm.name || !empForm.username || !empForm.password) {
      setEmpError("Fill all required fields."); return;
    }
    if (empForm.password !== empForm.confirmPassword) {
      setEmpError("Passwords do not match."); return;
    }

    const [firstName, ...rest] = empForm.name.trim().split(/\s+/);
    const roleMap = {
      Receptionist: "receptionist",
      HOD: "hod",
      OPD: "opd",
      Intimation: "intimation",
      Query: "query",
      Uploading: "uploading",
    };

    try {
      await apiService.createUser({
        username: empForm.username,
        email: empForm.email || `${empForm.username}@sangihospital.com`,
        first_name: firstName || empForm.username,
        last_name: rest.join(" ") || ".",
        emp_id: empForm.employeeId || empForm.username,
        phone_number: empForm.phone,
        role: roleMap[empForm.role] || "receptionist",
        branch: resolvedBranchCode,
        password: empForm.password,
        confirm_password: empForm.confirmPassword,
      });
      const users = await apiService.getUsers();
      const branchUsers = mapBranchUsers(users, resolvedBranchCode);
      setEmployees(branchUsers);
      setOverview(buildOverviewData(patients, branchUsers));
      setModal(null);
      setEmpForm(EMPTY_EMP_FORM);
    } catch (error) {
      const data = error.response?.data || {};
      setEmpError(data.username?.[0] || data.emp_id?.[0] || data.password?.[0] || "Failed to create employee.");
    }
  }

  function updateEmpField(field, value) {
    setEmpForm((currentForm) => ({ ...currentForm, [field]: value }));
    if (empError) setEmpError("");
  }

  async function deleteEmp(id) {
    if (!window.confirm("Remove this employee?")) return;
    try {
      await apiService.deleteUser(id);
      const nextEmployees = employees.filter((employee) => employee.id !== id);
      setEmployees(nextEmployees);
      setOverview(buildOverviewData(patients, nextEmployees));
    } catch (error) {
      window.alert("Failed to remove employee from backend.");
    }
  }

  // ─── Patient row for Excel ────────────────────────────────────────────────
  const pRow = (p) => ({
    "Patient ID":p.id, Name:p.name, Age:p.age, Gender:p.gender, Phone:p.phone,
    Department:p.department, Doctor:p.doctor, "Admission Date":p.admissionDate,
    "Discharge Date":p.dischargeDate||"", "Payment Mode":p.paymentMode,
    "Payment Type":p.paymentType||"", Status:p.status, Branch:resolvedBranchName,
  });

  // ─── Shared UI ────────────────────────────────────────────────────────────
  const Th = ({ children }) => (
    <th style={{ padding:"10px 16px", textAlign:"left", fontSize:"9px", letterSpacing:"2px", color:T.textMuted, textTransform:"uppercase", borderBottom:`1px solid ${T.border}`, background:T.surface, whiteSpace:"nowrap" }}>
      {children}
    </th>
  );
  const Td = ({ children, primary, hi, style:sx={} }) => (
    <td style={{ padding:"12px 16px", borderBottom:`1px solid ${T.border}22`, color:primary?T.text:hi||T.textSub, fontWeight:primary?"600":"400", verticalAlign:"middle", ...sx }}>
      {children}
    </td>
  );
  const EmptyRow = ({ cols, msg="NO DATA" }) => (
    <tr><td colSpan={cols} style={{ padding:"52px 20px", textAlign:"center", color:T.textMuted, fontSize:"10px", letterSpacing:"3px" }}>{msg}</td></tr>
  );
  const TableShell = ({ title, count, children }) => (
    <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:"12px", overflow:"hidden", boxShadow:`0 18px 40px ${theme.glow || "rgba(0,0,0,0.08)"}` }}>
      <div style={{ padding:"16px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", gap:"12px", background:T.surface }}>
        <div style={{ fontSize:"11px", color:T.text, fontWeight:"700", letterSpacing:"0.2px" }}>{title}</div>
        <div style={{ fontSize:"10px", color:T.textMuted }}>{count ?? 0}</div>
      </div>
      <div style={{ overflowX:"auto" }}>
        {children}
      </div>
    </div>
  );

  function StatCard({ label, value, sub, color, prefix="" }) {
    const c = color || theme.primary;
    return (
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderTop:`2px solid ${c}`, borderRadius:"10px", padding:"18px 20px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, right:0, width:"90px", height:"90px", background:`radial-gradient(circle at top right, ${c}14, transparent 70%)`, pointerEvents:"none" }} />
        <div style={{ fontSize:"9px", letterSpacing:"2.5px", color:T.textMuted, textTransform:"uppercase", marginBottom:"10px" }}>{label}</div>
        <div style={{ fontSize:"28px", fontWeight:"800", color:c, lineHeight:1, fontVariantNumeric:"tabular-nums" }}>
          {prefix}{typeof value === "number" ? value.toLocaleString() : (value ?? "—")}
        </div>
        {sub && <div style={{ fontSize:"11px", color:T.textMuted, marginTop:"5px" }}>{sub}</div>}
      </div>
    );
  }

  useEffect(() => {
    if (modal !== "emp") return;

    const loadNextEmployeeId = async () => {
      try {
        const data = await apiService.getNextEmpId({ role: "receptionist", branch: resolvedBranchCode });
        setEmpForm((currentForm) => ({ ...currentForm, employeeId: data?.next_id || currentForm.employeeId }));
      } catch (error) {
        setEmpForm((currentForm) => ({
          ...currentForm,
          employeeId: currentForm.employeeId || `${resolvedBranchCode.slice(0, 3) || "EMP"}0001`,
        }));
      }
    };

    loadNextEmployeeId();
  }, [modal, resolvedBranchCode]);

  const FilterBar = ({ exportLabel, onExport }) => (
    <div style={{ display:"flex", gap:"10px", marginBottom:"18px", flexWrap:"wrap", alignItems:"center" }}>
      <div style={{ position:"relative" }}>
        <span style={{ position:"absolute", left:"11px", top:"50%", transform:"translateY(-50%)", color:T.textMuted }}>⌕</span>
        <input
          style={{ ...mkInput(), paddingLeft:"30px", width:"220px" }}
          placeholder="Search name / ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <select style={{ ...mkInput(), cursor:"pointer" }} value={statusFil} onChange={e => setStatusFil(e.target.value)}>
        <option value="all">All Status</option>
        <option value="admitted">Admitted</option>
        <option value="discharged">Discharged</option>
        <option value="pending">Pending</option>
      </select>
      <button style={{ ...mkBtn("excel", theme), marginLeft:"auto" }} onClick={onExport}>↓ {exportLabel}</button>
    </div>
  );

  // ─── Views ────────────────────────────────────────────────────────────────
  function OverviewView() {
    const branchPendingPrints = (printRequests || []).filter((request) => {
      const requestBranch = String(request?.patient?.branch_location || "").toUpperCase();
      return requestBranch === resolvedBranchCode;
    });
    return (
      <>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"14px", marginBottom:"14px" }}>
          {[
            ["Total Patients",    "totalPatients",    theme.primary],
            ["Admitted Today",    "admittedToday",    T.blue       ],
            ["Discharged Today",  "dischargedToday",  T.success    ],
            ["Pending Discharge", "pendingDischarge", T.warning    ],
          ].map(([l,k,c]) => <StatCard key={k} label={l} value={overview?.[k]} color={c} />)}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"14px", marginBottom:"14px" }}>
          {[
            ["Cash Revenue",     "cashRevenue",     T.success,     "₹"],
            ["Total Revenue",    "totalRevenue",    theme.primary, "₹"],
            ["Pending Dues",     "pendingDues",     T.danger,      "₹"],
          ].map(([l,k,c,p]) => <StatCard key={k} label={l} value={overview?.[k]} color={c} prefix={p} />)}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"14px", marginBottom:"24px" }}>
          {[
            ["Employees",    "empCount",  T.blue  ],
            ["TPA Patients", "tpaCount",  T.purple],
            ["Card Patients","cardCount", T.warning],
          ].map(([l,k,c]) => <StatCard key={k} label={l} value={overview?.[k]} color={c} />)}
        </div>

        <TableShell title="Recent Registrations" count={overview?.recentPatients?.length}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"12px" }}>
            <thead><tr>{["ID","Name","Dept","Doctor","Admission","Pay Mode","Type","Status"].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
            <tbody>
              {!(overview?.recentPatients?.length)
                ? <EmptyRow cols={8} msg="NO RECENT PATIENTS" />
                : overview.recentPatients.map(p => (
                  <tr key={p.id} style={{ cursor:"pointer" }}
                    onClick={() => { setSelPatient(p); setNav("records"); }}>
                    <Td><span style={{ color:T.textMuted, fontSize:"10px" }}>#{p.id}</span></Td>
                    <Td primary>{p.name}</Td>
                    <Td>{p.department}</Td>
                    <Td>{p.doctor}</Td>
                    <Td>{p.admissionDate}</Td>
                    <Td><span style={mkBadge(p.paymentMode)}>{p.paymentMode}</span></Td>
                    <Td><span style={mkBadge(p.paymentType)}>{p.paymentType||"—"}</span></Td>
                    <Td><span style={mkBadge(p.status)}>{p.status}</span></Td>
                  </tr>
                ))}
            </tbody>
          </table>
        </TableShell>

        <div style={{ height:"16px" }} />
        <TableShell title="Print Approval Queue" count={branchPendingPrints.length}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"12px" }}>
            <thead><tr>{["UHID","Patient","Admission","Requested At","Action"].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
            <tbody>
              {!branchPendingPrints.length
                ? <EmptyRow cols={5} msg="NO PENDING PRINT REQUESTS" />
                : branchPendingPrints.map((req) => (
                  <tr key={`${req.uhid}-${req.admNo}`}>
                    <Td><span style={{ color:T.textMuted, fontSize:"10px" }}>{req.uhid}</span></Td>
                    <Td primary>{req?.patient?.patientName || req?.patient?.name || "Patient"}</Td>
                    <Td>#{req.admNo}</Td>
                    <Td>{String(req.requestedAt || "").slice(0, 16).replace("T", " ") || "—"}</Td>
                    <Td>
                      <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
                        <button
                          style={{ ...mkBtn("primary", theme), padding:"4px 12px", fontSize:"10px" }}
                          onClick={() => onApprovePrint?.(req, "approve")}
                        >Approve</button>
                        <button
                          style={{ ...mkBtn("danger", theme), padding:"4px 12px", fontSize:"10px" }}
                          onClick={() => onApprovePrint?.(req, "reject")}
                        >Reject</button>
                        <button
                          style={{ ...mkBtn("dim", theme), padding:"4px 12px", fontSize:"10px" }}
                          onClick={() => onViewBill?.(req)}
                        >View</button>
                      </div>
                    </Td>
                  </tr>
                ))}
            </tbody>
          </table>
        </TableShell>
      </>
    );
  }

  function PatientListView({ data, exportFile, title }) {
    const filtered = filterPatients(data);
    return (
      <>
        <FilterBar
          data={filtered}
          onExport={() => exportExcel(filtered.map(pRow), exportFile)}
          exportLabel="Export Excel"
        />
        <TableShell title={title} count={filtered.length}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"12px" }}>
            <thead>
              <tr>{["ID","Name","Age","Gender","Phone","Department","Doctor","Admission","Discharge","Pay Mode","Type","Status","Records"].map(h=><Th key={h}>{h}</Th>)}</tr>
            </thead>
            <tbody>
              {!filtered.length
                ? <EmptyRow cols={13} />
                : filtered.map(p => (
                  <tr key={p.id}>
                    <Td><span style={{ color:T.textMuted, fontSize:"10px" }}>#{p.id}</span></Td>
                    <Td primary>{p.name}</Td>
                    <Td>{p.age}</Td>
                    <Td>{p.gender}</Td>
                    <Td>{p.phone}</Td>
                    <Td>{p.department}</Td>
                    <Td>{p.doctor}</Td>
                    <Td>{p.admissionDate}</Td>
                    <Td>{p.dischargeDate||"—"}</Td>
                    <Td><span style={mkBadge(p.paymentMode)}>{p.paymentMode}</span></Td>
                    <Td><span style={mkBadge(p.paymentType)}>{p.paymentType||"—"}</span></Td>
                    <Td><span style={mkBadge(p.status)}>{p.status}</span></Td>
                    <Td>
                      <button
                        style={{ ...mkBtn("dim", theme), padding:"4px 12px", fontSize:"10px" }}
                        onClick={() => { setSelPatient(p); setNav("records"); }}
                      >View</button>
                    </Td>
                  </tr>
                ))}
            </tbody>
          </table>
        </TableShell>
      </>
    );
  }

  function FinancialsView() {
    return (
      <>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"14px", marginBottom:"24px" }}>
          {[
            ["Cash Total",      "cashTotal",      T.success,     "₹"],
            ["Grand Total",     "grandTotal",     theme.primary, "₹"],
            ["Collected Today", "collectedToday", T.blue,        "₹"],
            ["Pending Dues",    "pendingDues",    T.danger,      "₹"],
          ].map(([l,k,c,p]) => <StatCard key={k} label={l} value={financials?.[k]} color={c} prefix={p||""} />)}
        </div>

        <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:"16px" }}>
          <button style={mkBtn("excel", theme)} onClick={() => {
            exportExcel(financials?.cashTxns || [], `financials_${resolvedBranchKey}_${range}`);
          }}>↓ Export Excel</button>
        </div>

        <TableShell title="Cash Transactions" count={financials?.cashTxns?.length}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"12px" }}>
            <thead><tr>{["Patient ID","Name","Date","Amount","Description","Received By","Status"].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
            <tbody>
              {!(financials?.cashTxns?.length)
                ? <EmptyRow cols={7} msg="NO CASH TRANSACTIONS" />
                : financials.cashTxns.map((r,i) => (
                  <tr key={i}>
                    <Td><span style={{color:T.textMuted,fontSize:"10px"}}>#{r.patientId}</span></Td>
                    <Td primary>{r.patientName}</Td>
                    <Td>{r.date}</Td>
                    <Td hi={T.success} style={{fontWeight:"700"}}>₹{r.amount?.toLocaleString()}</Td>
                    <Td>{r.description}</Td>
                    <Td>{r.receivedBy}</Td>
                    <Td><span style={mkBadge(r.status)}>{r.status}</span></Td>
                  </tr>
                ))}
            </tbody>
          </table>
        </TableShell>
      </>
    );
  }

  function RecordsView() {
    // datalist for treating-doctor autocomplete
    const doctorDatalist = (
      <datalist id={`branch-doctors-${resolvedBranchCode}`}>
        {doctors.map(d => (
          <option key={d.id} value={`Dr. ${d.name}${d.qualification ? " (" + d.qualification + ")" : ""}`} />
        ))}
      </datalist>
    );

    if (!selPatient) return (
      <div style={{ textAlign:"center", padding:"80px 20px" }}>
        <div style={{ fontSize:"40px", marginBottom:"16px", color:T.textMuted }}>◈</div>
        <div style={{ fontSize:"11px", letterSpacing:"3px", color:T.textMuted, marginBottom:"12px" }}>NO PATIENT SELECTED</div>
        <p style={{ color:T.textSub, fontSize:"13px", maxWidth:"360px", margin:"0 auto 24px" }}>
          Open All Patients or Cash Patients and click View on any row.
        </p>
        <button style={mkBtn("dim", theme)} onClick={() => setNav("patients")}>→ Go to Patients</button>
      </div>
    );

    const livePatientRow = (patients || []).find(
      (p) =>
        p.uhid === selPatient.uhid &&
        Number(p.admObj?.admNo) === Number(selPatient.admObj?.admNo)
    );
    const selectedAdmission = livePatientRow?.admObj || selPatient.admObj || {};
    const selectedDischarge = selectedAdmission.discharge || {};
    const selectedMedical = selectedAdmission.medicalHistory || {};

    const canEditRecords = selPatient?.paymentMode === "cash";

    const updateEditableField = (rowIdx, field, value) => {
      setIsRecordDirty(true);
      isRecordDirtyRef.current = true;
      setEditableRows((prev) => {
        const next = prev.map((row, idx) => idx === rowIdx ? { ...row, [field]: value } : row);
        if (recTab === "services") setPersistedSvcRows(next);
        if (recTab === "medicines") setPersistedMedRows(next);
        return next;
      });
    };
    const addEditableRow = (template) => {
      setIsRecordDirty(true);
      isRecordDirtyRef.current = true;
      setEditableRows((prev) => {
        const next = [...prev, template];
        if (recTab === "services") setPersistedSvcRows(next);
        if (recTab === "medicines") setPersistedMedRows(next);
        return next;
      });
    };
    const removeEditableRow = (rowIdx) => {
      setIsRecordDirty(true);
      isRecordDirtyRef.current = true;
      setEditableRows((prev) => {
        const next = prev.filter((_, idx) => idx !== rowIdx);
        if (recTab === "services") setPersistedSvcRows(next);
        if (recTab === "medicines") setPersistedMedRows(next);
        return next;
      });
    };

    const PRINT_KIND_MAP = {
      discharge_summary: "dynamic-summary",
      admission_note:    "admission-note",
      medical_history:   "medical-history",
      reports:           "lab-reports",
      medicines:         "pharmacy-records",
    };
    const handlePrint = () => {
      const admNo = selectedAdmission?.admNo;
      const uhid  = selPatient?.uhid;
      if (!uhid || !admNo) {
        window.alert("Patient/Admission identifiers missing — cannot print.");
        return;
      }
      const kind = PRINT_KIND_MAP[recTab];
      if (recTab === "discharge_summary") {
        const summaryType = (selectedDischarge?.dischargeStatus || "LAMA").toString().toUpperCase();
        window.open(`${BASE_URL}/patients/${uhid}/admissions/${admNo}/${kind}/print/?type=${encodeURIComponent(summaryType)}`, "_blank");
        return;
      }
      window.open(`${BASE_URL}/patients/${uhid}/admissions/${admNo}/${kind}/print/`, "_blank");
    };

    const saveCurrentTab = async () => {
      if (!canEditRecords || !selPatient?.uhid || !selectedAdmission?.admNo) return;
      setSavingRecords(true);
      try {
        if (recTab === "discharge_summary") {
          const f = editableRows[0] || {};
          await apiService.dischargePatient(selPatient.uhid, selectedAdmission.admNo, {
            ...selectedDischarge,
            doa: f.doa || selectedDischarge.doa || "",
            expectedDod: f.expectedDod || selectedDischarge.expectedDod || "",
            dod: f.dod || selectedDischarge.dod || "",
            department: f.department || selectedDischarge.department || "",
            wardName: f.wardName || selectedDischarge.wardName || "",
            roomNo: f.roomNo || selectedDischarge.roomNo || "",
            bedNo: f.bedNo || selectedDischarge.bedNo || "",
            doctorName: f.doctorName || selectedDischarge.doctorName || "",
            diagnosis: f.diagnosis || selectedDischarge.diagnosis || "",
            dischargeStatus: f.dischargeStatus || selectedDischarge.dischargeStatus || "",
            instructions: f.instructions || selectedDischarge.instructions || "",
            notes: f.notes || selectedDischarge.notes || "",
          });
        } else if (recTab === "reports") {
          await apiService.saveLabReportsBulk(
            selPatient.uhid,
            selectedAdmission.admNo,
            editableRows.filter(r=>r.reportName).map((row) => ({
              reportName: row.reportName || "Report",
              reportType: row.reportType || "Haematology",
              date: row.date || new Date().toISOString().slice(0, 10),
              orderedBy: row.orderedBy || "",
              remarks: row.remarks || "",
              impression: row.impression || "",
              amount: Number(row.amount || 0),
              tests: (row.tests||[]).filter(t=>t.name),
            }))
          );
        } else if (recTab === "medicines") {
          await apiService.savePharmacyRecordsBulk(
            selPatient.uhid,
            selectedAdmission.admNo,
            editableRows.map((row) => ({
              medicine_name: row.medicine_name || "Medicine",
              date_given: row.date_given || row.date || new Date().toISOString().slice(0, 10),
              quantity: Number(row.quantity || row.qty || 1),
              rate: Number(row.rate || 0),
              batch_no: row.batch_no || "",
              expiry_date: row.expiry_date || "",
              quantity: Number(row.quantity || 1) || 1,
              rate: Number(row.rate || 0),
              expiry_date: row.expiry_date || "",
            }))
          );
        } else if (recTab === "admission_note") {
          const f = editableRows[0] || {};
          await apiService.updateMedicalHistory(selPatient.uhid, selectedAdmission.admNo, {
            ...selectedMedical,
            treatingDoctor: f.treatingDoctor || selectedMedical.treatingDoctor || "",
            doctorQual: f.doctorQual || selectedMedical.doctorQual || "",
            presentComplaints: f.presentComplaints || selectedMedical.presentComplaints || "",
            chiefComplaints: f.chiefComplaints || selectedMedical.chiefComplaints || "",
            bp: f.bp || selectedMedical.bp || "",
            pulse: f.pulse || selectedMedical.pulse || "",
            spo2: f.spo2 || selectedMedical.spo2 || "",
            temp: f.temp || selectedMedical.temp || "",
            chest: f.chest || selectedMedical.chest || "",
            cvs: f.cvs || selectedMedical.cvs || "",
            cns: f.cns || selectedMedical.cns || "",
            pa: f.pa || selectedMedical.pa || "",
            investigations: f.investigations || selectedMedical.investigations || "",
            provisionalDiagnosis: f.provisionalDiagnosis || selectedMedical.provisionalDiagnosis || "",
            treatmentAdvised: f.treatmentAdvised || selectedMedical.treatmentAdvised || "",
            notes: f.notes || selectedMedical.notes || "",
          });
        } else if (recTab === "services") {
        await apiService.saveServicesBulk(
          selPatient.uhid,
          selectedAdmission.admNo,
          editableRows.map((row) => ({
            svcName: row.medicine_name || "Service",
            svcDate: row.date_given || new Date().toISOString().slice(0, 10),
            svcQty:  Number(row.quantity || 1),
            svcRate: Number(row.rate || 0),
            svcTot:  Number(row.quantity || 1) * Number(row.rate || 0),
            svcCode: row.batch_no || "",
            cghs:    row.batch_no || "",
          }))
        );
      } else if (recTab === "final_bill") {
          await apiService.savePharmacyRecordsBulk(
            selPatient.uhid,
            selectedAdmission.admNo,
            editableRows.map((row) => ({
              medicine_name: row.medicine_name || "Medicine",
              date_given: row.date_given || row.date || new Date().toISOString().slice(0, 10),
              quantity: Number(row.quantity || 1),
              rate: Number(row.rate || 0),
              batch_no: row.batch_no || "",
              expiry_date: row.expiry_date || "",
            }))
          );
          await apiService.updateBilling(selPatient.uhid, selectedAdmission.admNo, billEdit);
        } else if (recTab === "medical_history") {
          const f = editableRows[0] || {};
          await apiService.updateMedicalHistory(selPatient.uhid, selectedAdmission.admNo, {
            ...selectedMedical,
            previousDiagnosis: f.previousDiagnosis || selectedMedical.previousDiagnosis || "",
            pastSurgeries: f.pastSurgeries || selectedMedical.pastSurgeries || "",
            currentMedications: f.currentMedications || selectedMedical.currentMedications || "",
            knownAllergies: f.knownAllergies || selectedMedical.knownAllergies || "",
            chronicConditions: f.chronicConditions || selectedMedical.chronicConditions || "",
            familyHistory: f.familyHistory || selectedMedical.familyHistory || "",
            smokingStatus: f.smokingStatus || selectedMedical.smokingStatus || "",
            alcoholUse: f.alcoholUse || selectedMedical.alcoholUse || "",
            treatingDoctor: f.treatingDoctor || selectedMedical.treatingDoctor || "",
            notes: f.notes || selectedMedical.notes || "",
          });
        }
        setIsRecordDirty(false);
        isRecordDirtyRef.current = false;
        window.alert("Record updated successfully.");
      } catch (_error) {
        window.alert("Failed to update this section.");
      } finally {
        setSavingRecords(false);
      }
    };

    // ── Tab renderers ────────────────────────────────────────────────────
        const renderFinalBill = () => {
      const p        = selPatient || {};
      const admObj   = selectedAdmission || {};
      const dis      = admObj.discharge || {};
      const billing  = admObj.billing   || {};
      const uhid     = p.uhid || "";
      const admNo    = admObj.admNo || "";

      // ALL rows are editable for cash patients — services + medicines merged into editableRows
      const services = Array.isArray(admObj.services) ? admObj.services : [];

      // Build combined allRows from editableRows (which now contains both svc + med rows)
      // On first load, seed editableRows with svc rows if not already seeded
      const svcRowsStatic = services
        .filter(s => {
          const cat = (s.svcCat || s.type || "").toLowerCase();
          return !["med","pharma","drug","pharmacy","tablet","injection","iv fluid","consumable"].some(k => cat.includes(k));
        })
        .map((s, i) => ({
          _localId:    s.id || `svc-${i}`,
          isSvc:       true,
          date_given:  (s.svcDate || "").slice(0, 10),
          cghs:        s.cghs || s.cghs_code || "—",
          medicine_name: s.svcName || s.description || "Service",
          quantity:    Number(s.svcQty  || s.qty  || 1),
          rate: Number(s.rate || s.svcRate || s.unit_price || s.price || 0),
          amount:      Number(s.svcTot  || s.total || (Number(s.svcRate||0) * Number(s.svcQty||1))),
        }));

      // Merge: svc rows first, then medicine rows from editableRows (exclude any already-merged svc rows)
      // Use editableRows isSvc entries if available (reflects any edits/additions on Services tab)
      // Use persistedSvcRows (from Services tab edits) OR fall back to svcRowsStatic (original admObj)
      // Never merge both — that caused duplication
      const finalSvcRows = persistedSvcRows.length ? persistedSvcRows : svcRowsStatic;
      const finalMedRows = persistedMedRows.length ? persistedMedRows : editableRows.filter(r => !r.isSvc);
      const allEditableRows = [...finalSvcRows, ...finalMedRows];

      const allRows = allEditableRows.map((r, i) => ({
        srNo:        i + 1,
        date:        (r.date_given || r.date || "").slice(0, 10),
        cghs:        r.cghs || "—",
        description: r.medicine_name || "Service",
        quantity:    Number(r.quantity || 1),
        rate:        Number(r.rate || 0),
        amount:      Number(r.quantity || 1) * Number(r.rate || 0),
        _localId:    r._localId,
        isSvc:       r.isSvc || false,
        _idx:        i,
      }));
      const svcRows = { length: svcRowsStatic.length }; // keep for srNo offset compat
      const grossTotal = allRows.reduce((s, r) => s + r.amount, 0);
      const discount   = billEdit.discount;
      const advance    = billEdit.advance;
      const netPayable = Math.max(0, grossTotal - discount - advance);

      // Header info
      const patientName    = p.name         || "—";
      const guardianName   = p.patientObj?.guardianName || p.patientObj?.guardian_name || "—";
      const address        = p.patientObj?.address      || "—";
      const contact        = p.phone        || p.patientObj?.phone || "—";
      const ageSex         = `${p.age || "—"} YRS / ${p.gender || "—"}`;
      const consultant     = dis.doctorName || admObj.medicalHistory?.treatingDoctor || "—";
      const room           = dis.roomNo     || dis.room_no || "—";
      const bed            = dis.bedNo      || dis.bed_no  || "—";
      const panel          = String(p.paymentMode || "CASH").toUpperCase();
      const doaRaw         = dis.doa        || admObj.dateTime || "";
      const dodRaw         = dis.dod        || "";
      const doa            = doaRaw ? new Date(doaRaw).toLocaleString("en-IN") : "—";
      const dod            = dodRaw ? new Date(dodRaw).toLocaleString("en-IN") : "—";
      const dischargeStatus= dis.dischargeStatus || dis.status || "—";
      const billDate       = new Date().toLocaleDateString("en-IN", { day:"2-digit", month:"2-digit", year:"numeric" });
      const admissionType  = dis.admissionType || admObj.admissionType || "IPD";
      const ipd            = admNo ? `SH/GEN/26/${admNo}` : "—";

      const cellStyle = { padding:"7px 10px", borderBottom:"1px solid #e2e8f0", fontSize:12, color:"#1e293b" };
      const hdrCell  = { ...cellStyle, background:"#f8fafc", fontWeight:700, fontSize:11, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.5px" };
      const labelStyle = { fontSize:11, color:"#64748b", fontWeight:600 };
      const valueStyle = { fontSize:12, color:"#0f172a", fontWeight:500 };

      return (
        <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, overflow:"hidden", fontFamily:"inherit", color:"#0f172a" }}>

          {/* ── Header ── */}
          <div style={{ background:"linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%)", padding:"20px 28px", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.6)", letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>Date: {billDate}</div>
              <div style={{ fontSize:22, fontWeight:900, color:"#fff", lineHeight:1 }}>FINAL</div>
              <div style={{ fontSize:22, fontWeight:900, color:"#fff" }}>BILL</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.7)", marginTop:6 }}>Admission Type: <span style={{ color:"#93c5fd" }}>{admissionType}</span></div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:20, fontWeight:900, color:"#fff", letterSpacing:1 }}>SANGi <span style={{ fontWeight:300 }}>HOSPITAL</span></div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.65)", marginTop:6, lineHeight:1.6 }}>
                Lakshmi Nagar Branch · Mathura, UP - 281004<br/>
                📞 +91-9717444531 / +91-9717444532<br/>
                ✉ laxminagar@sangihospital.com
              </div>
            </div>
          </div>

          {/* ── Patient Info Grid ── */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", borderBottom:"2px solid #e2e8f0" }}>
            {[
              ["UHID",              `${p.uhid || "—"}`],
              ["Bill No.",          billing.billNo || "—"],
              ["IPD No.",           ipd],
              ["Bill Date",         `${billDate} ${new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})} HRS`],
              ["Patient Name",      patientName],
              ["Bill Date",         `${billDate} ${new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})} HRS`],
              ["Guardian Name",     guardianName],
              ["Age / Sex",         ageSex],
              ["Address",           address],
              ["Card No.",          billing.cardNo || "—"],
              ["Consultant",        consultant],
              ["Room / Bed",        `${room} / ${bed}`],
              ["Claim ID",          billing.claimId || "—"],
              ["Panel",             panel],
              ["DOA & Time",        doa],
              ["Contact No.",       contact],
              ["DOD & Time",        dod],
              ["Status on Discharge", dischargeStatus],
            ].map(([label, value], i) => (
              <div key={i} style={{ padding:"8px 16px", borderBottom:"1px solid #f1f5f9", borderRight: i%2===0 ? "1px solid #e2e8f0" : "none" }}>
                <span style={labelStyle}>{label}: </span>
                <span style={valueStyle}>{value}</span>
              </div>
            ))}
          </div>

          {/* ── Services Table ── */}
          <div style={{ padding:"0 0 0 0", overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead>
                <tr>
                  {["SR NO.","DATE","CGHS CODE","DESCRIPTION","QUANTITY","RATE","AMOUNT", canEditRecords ? "" : ""].map(h => (
                    <th key={h} style={hdrCell}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!allRows.length ? (
                  <tr><td colSpan={8} style={{ padding:"32px", textAlign:"center", color:"#94a3b8", fontStyle:"italic" }}>No services added yet. Use buttons below to add.</td></tr>
                ) : allRows.map((row, i) => {
                  const updateRow = (field, val) => {
                    if (row.isSvc) {
                      // svc rows are static from services array — just update display via a local override
                      // We store overrides in editableRows with isSvc=true
                      setEditableRows(prev => {
                        const existing = prev.find(r => r._localId === row._localId);
                        if (existing) return prev.map(r => r._localId === row._localId ? {...r, [field]: val, amount: field==="quantity" ? val*Number(r.rate||0) : field==="rate" ? Number(r.quantity||1)*val : r.amount} : r);
                        return [...prev, {...row, isSvc:true, [field]: val}];
                      });
                    } else {
                      setEditableRows(prev => {
                        const svcPart = prev.filter(r => r.isSvc);
                        const medPart = prev.filter(r => !r.isSvc);
                        const mi = medPart.findIndex(r => r._localId === row._localId);
                        if (mi === -1) return prev;
                        medPart[mi] = {...medPart[mi], [field]: val,
                          amount: field==="quantity" ? val*Number(medPart[mi].rate||0) : field==="rate" ? Number(medPart[mi].quantity||1)*val : medPart[mi].amount
                        };
                        const next = [...svcPart, ...medPart];
                        setPersistedMedRows(medPart);
                        return next;
                      });
                    }
                    setIsRecordDirty(true); isRecordDirtyRef.current = true;
                  };
                  return (
                  <tr key={row._localId||i} style={{ background: i%2===0 ? "#fff" : "#f8fafc" }}>
                    <td style={cellStyle}>{row.srNo}</td>
                    <td style={cellStyle}>
                      {canEditRecords
                        ? <input type="date" value={row.date||""} onChange={e=>updateRow("date_given",e.target.value)} style={{border:"none",background:"transparent",fontSize:11,width:110,color:"#0f172a"}}/>
                        : row.date||"—"}
                    </td>
                    <td style={cellStyle}>{row.cghs}</td>
                    <td style={{ ...cellStyle, fontWeight:600 }}>
                      {canEditRecords
                        ? <input value={row.description||""} onChange={e=>updateRow("medicine_name",e.target.value)} style={{border:"none",background:"transparent",fontSize:12,fontWeight:600,width:"100%",color:"#0f172a"}}/>
                        : row.description}
                    </td>
                    <td style={{ ...cellStyle, textAlign:"center" }}>
                      {canEditRecords
                        ? <input type="number" min={1} value={row.quantity} onChange={e=>updateRow("quantity",Math.max(1,parseInt(e.target.value)||1))} style={{border:"none",background:"transparent",fontSize:12,width:50,textAlign:"center",color:"#0f172a"}}/>
                        : row.quantity}
                    </td>
                    <td style={{ ...cellStyle, textAlign:"right" }}>
                      {canEditRecords
                        ? <input type="number" min={0} step="0.01" value={row.rate} onChange={e=>updateRow("rate",parseFloat(e.target.value)||0)} style={{border:"none",background:"transparent",fontSize:12,width:80,textAlign:"right",color:"#0f172a"}}/>
                        : `₹${Number(row.rate).toFixed(2)}`}
                    </td>
                    <td style={{ ...cellStyle, textAlign:"right", fontWeight:700, color:"#059669" }}>₹{(Number(row.quantity||1)*Number(row.rate||0)).toFixed(2)}</td>
                    {canEditRecords && (
                      <td style={cellStyle}>
                        <button onClick={()=>{
                          setEditableRows(prev => prev.filter(r => r._localId !== row._localId));
                          setIsRecordDirty(true); isRecordDirtyRef.current = true;
                        }} style={{background:"#fee2e2",border:"none",color:"#ef4444",borderRadius:4,padding:"2px 8px",cursor:"pointer",fontSize:11}}>✕</button>
                      </td>
                    )}
                  </tr>
                  );
                })}
                {/* Empty rows like the PDF */}
                {Array.from({ length: Math.max(0, 5 - allRows.length) }).map((_, i) => (
                  <tr key={`empty-${i}`}>
                    {Array(7).fill(null).map((_, j) => <td key={j} style={{ ...cellStyle, height:32 }}>&nbsp;</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Totals ── */}
          <div style={{ borderTop:"2px solid #e2e8f0" }}>
            {[
              ["Gross Total", `₹ ${grossTotal.toFixed(2)}`, false, false],
              ["Discount",    null,                          true,  false],
              ["Advance Payment", null,                      false, true ],
            ].map(([label, fixedVal, isDiscount, isAdvance]) => (
              <div key={label} style={{ display:"flex", justifyContent:"flex-end", alignItems:"center", padding:"8px 20px", borderBottom:"1px solid #f1f5f9", gap:24 }}>
                <span style={{ fontSize:12, color:"#64748b", fontWeight:600, minWidth:160, textAlign:"right" }}>{label}:</span>
                {fixedVal
                  ? <span style={{ fontSize:13, fontWeight:700, color:"#0f172a", minWidth:100, textAlign:"right" }}>{fixedVal}</span>
                  : canEditRecords
                  ? <input
                      type="number" min={0}
                      value={isDiscount ? discount : advance}
                      onChange={e => {
                        setIsRecordDirty(true); isRecordDirtyRef.current = true;
                        const val = parseFloat(e.target.value) || 0;
                        setBillEdit(p => isDiscount ? { ...p, discount: val } : { ...p, advance: val });
                      }}
                      style={{ width:100, padding:"5px 8px", borderRadius:6, border:"1px solid #cbd5e1", fontSize:13, textAlign:"right", fontFamily:"inherit" }}
                    />
                  : <span style={{ fontSize:13, fontWeight:700, minWidth:100, textAlign:"right" }}>
                      - ₹ {(isDiscount ? discount : advance).toFixed(2)}
                    </span>
                }
              </div>
            ))}
            <div style={{ display:"flex", justifyContent:"flex-end", alignItems:"center", padding:"14px 20px", background:"#0f172a", gap:24 }}>
              <span style={{ fontSize:13, fontWeight:800, color:"#fff", minWidth:160, textAlign:"right", letterSpacing:"0.5px" }}>NET PAYABLE AMOUNT :</span>
              <span style={{ fontSize:18, fontWeight:900, color:"#4ade80", minWidth:100, textAlign:"right" }}>₹ {netPayable.toFixed(2)}</span>
            </div>
          </div>

          {/* ── Footer ── */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:20, padding:"24px 28px", borderTop:"2px solid #e2e8f0", alignItems:"flex-end" }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ borderTop:"1.5px solid #0f172a", paddingTop:8, fontSize:12, fontWeight:700 }}>Authorised Signatory</div>
              <div style={{ fontSize:11, color:"#64748b" }}>Medical Superintendent</div>
              <div style={{ fontSize:11, color:"#64748b" }}>Sangi Hospital</div>
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:10, color:"#94a3b8", marginBottom:6, fontStyle:"italic" }}>Scan to visit our website</div>
              <div style={{ width:60, height:60, background:"#f1f5f9", border:"1px solid #e2e8f0", borderRadius:4, margin:"0 auto 6px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:"#94a3b8" }}>QR</div>
              <div style={{ fontSize:11, color:"#3b82f6", fontWeight:600 }}>www.sangihospital.com</div>
              <div style={{ fontSize:10, color:"#94a3b8", fontStyle:"italic" }}>This is a computer generated bill</div>
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ borderTop:"1.5px solid #0f172a", paddingTop:8, fontSize:12, fontWeight:700 }}>Patient / Attendant Signature</div>
              <div style={{ fontSize:11, color:"#64748b" }}>with date</div>
            </div>
          </div>

          {/* ── Add Row Buttons ── */}
          {canEditRecords && (
            <div style={{ display:"flex", gap:10, padding:"12px 28px", borderTop:"1px solid #e2e8f0", background:"#f8fafc", flexWrap:"wrap" }}>
              <button
                style={{ ...mkBtn("dim", theme), padding:"8px 16px", fontSize:12 }}
                onClick={() => {
                  setEditableRows(prev => [...prev, {
                    _localId: `svc-new-${Date.now()}`,
                    isSvc: true,
                    medicine_name: "",
                    date_given: new Date().toISOString().slice(0,10),
                    quantity: 1,
                    rate: 0,
                    batch_no: "",
                    expiry_date: "",
                    amount: 0,
                  }]);
                  setIsRecordDirty(true); isRecordDirtyRef.current = true;
                }}>
                + Add Service Row
              </button>
              <button
                style={{ ...mkBtn("ghost", theme), padding:"8px 16px", fontSize:12 }}
                onClick={() => {
                  setEditableRows(prev => [...prev, {
                    _localId: `med-new-${Date.now()}`,
                    isSvc: false,
                    medicine_name: "",
                    date_given: new Date().toISOString().slice(0,10),
                    quantity: 1,
                    rate: 0,
                    batch_no: "",
                    expiry_date: "",
                    amount: 0,
                  }]);
                  setIsRecordDirty(true); isRecordDirtyRef.current = true;
                }}>
                + Add Medicine Row
              </button>
            </div>
          )}

          {/* ── Action Buttons ── */}
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end", padding:"16px 28px", borderTop:"1px solid #e2e8f0", background:"#f8fafc", flexWrap:"wrap" }}>
            {canEditRecords && (
              <button style={{ ...mkBtn("primary",theme), padding:"9px 18px", fontSize:12 }} onClick={saveCurrentTab} disabled={savingRecords}>
                {savingRecords ? "Saving…" : "💾 Save Bill"}
              </button>
            )}
            <button style={{ ...mkBtn("excel",theme), padding:"9px 18px", fontSize:12 }}
              onClick={() => { if(!uhid||!admNo) return; window.open(`${BASE_URL}/patients/${uhid}/admissions/${admNo}/bill/print/`,"_blank"); }}>
              🖨 Print Final Bill
            </button>
          </div>
        </div>
      );
    };
const renderDischarge = () => {
      const r = editableRows[0] || {};
      const u = (k) => (v) => updateEditableField(0, k, v);
      return (
        <>
          <SectionCard theme={theme} icon="🛏" title="Admission & Discharge" subtitle="Dates, status and room details">
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"14px 16px" }}>
              <Field editable={canEditRecords} label="Status on Discharge" value={r.dischargeStatus} onChange={u("dischargeStatus")} placeholder="e.g. Recovered / DOR / LAMA" />
              <Field editable={canEditRecords} label="Department"         value={r.department}      onChange={u("department")}      placeholder="e.g. General Medicine" />
              <Field editable={canEditRecords} label="Date & Time of Admission (DOA)" type="datetime-local" value={String(r.doa || "").slice(0,16)} onChange={u("doa")} />
              <Field editable={canEditRecords} label="Date & Time of Discharge (DOD)" type="datetime-local" value={String(r.dod || "").slice(0,16)} onChange={u("dod")} />
              <Field editable={canEditRecords} label="Expected Discharge Date" type="date" value={String(r.expectedDod || "").slice(0,10)} onChange={u("expectedDod")} />
              <DoctorSelectField
                editable={canEditRecords}
                label="Treating Doctor"
                value={r.doctorName}
                onChange={u("doctorName")}
                onSelectDoctor={doc => {
                  updateEditableField(0, "doctorName", `Dr. ${doc.name}`);
                }}
                placeholder="e.g. Dr. Sangi"
                doctors={doctors}
              />
              <Field editable={canEditRecords} label="Ward Name"          value={r.wardName}        onChange={u("wardName")}        placeholder="e.g. General Ward" />
              <Field editable={canEditRecords} label="Room Number"        value={r.roomNo}          onChange={u("roomNo")}          placeholder="e.g. 204" />
              <Field editable={canEditRecords} label="Bed Number"         value={r.bedNo}           onChange={u("bedNo")}           placeholder="e.g. B-12" />
            </div>
          </SectionCard>
          <SectionCard theme={theme} icon="🩺" title="Clinical Summary" subtitle="Diagnosis, instructions and notes">
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"14px 16px" }}>
              <Field editable={canEditRecords} label="Primary Diagnosis / Condition" colSpan={2} multiline rows={2} value={r.diagnosis}    onChange={u("diagnosis")}    placeholder="Primary diagnosis or condition…" />
              <Field editable={canEditRecords} label="Discharge Instructions"         colSpan={2} multiline rows={3} value={r.instructions} onChange={u("instructions")} placeholder="Instructions for the patient on discharge…" />
              <Field editable={canEditRecords} label="Additional Notes"               colSpan={2} multiline rows={3} value={r.notes}        onChange={u("notes")}        placeholder="Additional remarks…" />
            </div>
          </SectionCard>
        </>
      );
    };

    const renderAdmissionNote = () => {
      const r = editableRows[0] || {};
      const u = (k) => (v) => updateEditableField(0, k, v);
      return (
        <>
          <SectionCard theme={theme} icon="🩺" title="Present Complaints" subtitle="Chief complaints and presenting symptoms">
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"14px 16px" }}>
              <Field editable={canEditRecords} label="Present Complaints" colSpan={1} multiline rows={4} value={r.presentComplaints} onChange={u("presentComplaints")} placeholder="Patient presented with…" />
              <Field editable={canEditRecords} label="C/O (Chief Complaints)" colSpan={1} multiline rows={4} value={r.chiefComplaints} onChange={u("chiefComplaints")} placeholder="Severe pain, fever with chills…" />
            </div>
          </SectionCard>
          <SectionCard theme={theme} icon="💓" title="Examinations" subtitle="Vitals and clinical examination findings">
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"12px 14px", marginBottom:"4px" }}>
              <Field editable={canEditRecords} label="BP (mmHg)" value={r.bp}    onChange={u("bp")}    placeholder="e.g. 120/80mmHg" />
              <Field editable={canEditRecords} label="PR (/min)" value={r.pulse} onChange={u("pulse")} placeholder="e.g. 82/min" />
              <Field editable={canEditRecords} label="SPO2"      value={r.spo2}  onChange={u("spo2")}  placeholder="e.g. 98% On RA" />
              <Field editable={canEditRecords} label="TEMP"      value={r.temp}  onChange={u("temp")}  placeholder="e.g. 98.6°F" />
              <Field editable={canEditRecords} label="Chest"     value={r.chest} onChange={u("chest")} placeholder="e.g. B/L Crepts+" />
              <Field editable={canEditRecords} label="CVS"       value={r.cvs}   onChange={u("cvs")}   placeholder="e.g. S1 S2 +" />
              <Field editable={canEditRecords} label="CNS"       value={r.cns}   onChange={u("cns")}   placeholder="e.g. Conscious" />
              <Field editable={canEditRecords} label="P/A"       value={r.pa}    onChange={u("pa")}    placeholder="e.g. Distended" />
            </div>
          </SectionCard>
          <SectionCard theme={theme} icon="🔬" title="Investigations & Diagnosis" subtitle="Tests ordered and provisional diagnosis">
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"14px 16px" }}>
              <Field editable={canEditRecords} label="Investigations / Reports" colSpan={1} multiline rows={4} value={r.investigations} onChange={u("investigations")} placeholder="Investigations ordered…" />
              <Field editable={canEditRecords} label="Provisional Diagnosis"     colSpan={1} multiline rows={4} value={r.provisionalDiagnosis} onChange={u("provisionalDiagnosis")} placeholder="Acute Retention of Urine with ?UTI…" />
            </div>
          </SectionCard>
          <SectionCard theme={theme} icon="💊" title="Treatment Advised" subtitle="Plan of management">
            <Field editable={canEditRecords} label="Treatment Advised" colSpan={2} multiline rows={4} value={r.treatmentAdvised} onChange={u("treatmentAdvised")} placeholder="IV Fluids NS/RL @ 100ml/hr, Inj. Esomac 40mg IV BD…" />
          </SectionCard>
          <SectionCard theme={theme} icon="👨‍⚕️" title="Treating Doctor & Notes" subtitle="Doctor details and additional clinical notes">
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"14px 16px" }}>
              <DoctorSelectField
                editable={canEditRecords}
                label="Treating Doctor"
                value={r.treatingDoctor}
                onChange={u("treatingDoctor")}
                onSelectDoctor={doc => {
                  updateEditableField(0, "treatingDoctor", `Dr. ${doc.name}`);
                  if (doc.qualification) updateEditableField(0, "doctorQual", doc.qualification);
                }}
                placeholder="Select or type doctor name…"
                doctors={doctors}
              />
              <Field editable={canEditRecords} label="Qualification & Reg. No." value={r.doctorQual}     onChange={u("doctorQual")}     placeholder="MBBS, MD…" />
              <Field editable={canEditRecords} label="Additional Notes / Remarks" colSpan={2} multiline rows={2} value={r.notes} onChange={u("notes")} placeholder="Any other relevant clinical information…" />
            </div>
          </SectionCard>
        </>
      );
    };

    const renderMedicalHistory = () => {
      const r = editableRows[0] || {};
      const u = (k) => (v) => updateEditableField(0, k, v);
      return (
        <SectionCard theme={theme} icon="📜" title="Medical History" subtitle="Past illnesses, allergies and ongoing medications">
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"14px 16px" }}>
            <Field editable={canEditRecords} label="Past History / Previous Diagnosis" colSpan={1} multiline rows={3} value={r.previousDiagnosis}  onChange={u("previousDiagnosis")}  placeholder="Diabetes, Hypertension, previous surgeries…" />
            <Field editable={canEditRecords} label="Past Surgeries"                    colSpan={1} multiline rows={3} value={r.pastSurgeries}      onChange={u("pastSurgeries")}      placeholder="e.g. Appendectomy 2018…" />
            <Field editable={canEditRecords} label="Current Medications"               colSpan={2} multiline rows={3} value={r.currentMedications} onChange={u("currentMedications")} placeholder="Currently used medications…" />
            <Field editable={canEditRecords} label="Known Allergies"                                       value={r.knownAllergies}    onChange={u("knownAllergies")}    placeholder="e.g. Penicillin, Sulfa drugs…" />
            <Field editable={canEditRecords} label="Chronic Conditions"                                    value={r.chronicConditions} onChange={u("chronicConditions")} placeholder="e.g. Asthma, COPD…" />
            <Field editable={canEditRecords} label="Family History"                    colSpan={2} multiline rows={2} value={r.familyHistory}      onChange={u("familyHistory")}     placeholder="Relevant family medical history…" />
            <Field editable={canEditRecords} label="Smoking Status"                                        value={r.smokingStatus}     onChange={u("smokingStatus")}     placeholder="Yes / No / Former" />
            <Field editable={canEditRecords} label="Alcohol Use"                                           value={r.alcoholUse}        onChange={u("alcoholUse")}        placeholder="Yes / No / Occasional" />
            <DoctorSelectField
                editable={canEditRecords}
                label="Treating Doctor"
                value={r.treatingDoctor}
                onChange={u("treatingDoctor")}
                onSelectDoctor={doc => {
                  updateEditableField(0, "treatingDoctor", `Dr. ${doc.name}`);
                }}
                placeholder="Treating doctor name"
                doctors={doctors}
              />
            <Field editable={canEditRecords} label="Additional Notes"                  colSpan={2} multiline rows={3} value={r.notes}              onChange={u("notes")}             placeholder="Other notes…" />
          </div>
        </SectionCard>
      );
    };

    const REPORT_TYPES = ["Haematology","Biochemistry","Microbiology","Immunology – Serology","Histopathology","Cytology","X-Ray","USG","CT Scan","MRI","Echo","ECG"];
    const STATUS_COLORS = { Normal:"#10b981", High:"#ef4444", Low:"#f59e0b" };

    const REPORT_MASTER = [
      "Complete Blood Count (CBC)",
      "Kidney Function Test (KFT)",
      "Liver Function Test (LFT)",
      "Lipid Profile",
      "Blood Gas Analysis",
      "CRP (Qualitative)",
      "Blood Glucose (Random)",
      "Blood Glucose (Fasting)",
      "Widal Test (Slide Method)",
      "Malaria Antigen Test",
      "Typhi Dot (IgG & IgM)",
      "Dengue (IgM & IgG)",
      "Dengue NS1 Antigen Test",
      "Viral Markers (HIV, HBsAg, HCV)",
      "COVID-19 Rapid Antigen",
      "Urine Examination (Routine)",
      "Urine Gram Stain",
      "Aerobic Culture & Sensitivity",
      "Serum Procalcitonin",
      "Sputum for AFB",
      "Sputum Gram Stain",
      "Cardiac Markers (Trop-T, Trop-I, CPK)",
      "Total Thyroid Profile",
      "Vitamin B-12 (Cyanocobalamin)",
      "25 OH Vitamin D3",
      "Stool Examination",
      "Blood Group & Rh Factor",
      "HbA1c (Glycosylated Hemoglobin)",
      "Urine Ketone",
      "D-Dimer",
      "Serum Amylase & Lipase",
      "Homocysteine (Quantitative)",
      "PSA (Prostate Specific Antigen)",
      "Prothrombin Time (PT)",
      "Activated Partial Thromboplastin Time (APTT)",
      "Adenosine Deaminase (ADA)",
      "Body Fluid For Cytology",
      "Body Fluid Routine Analysis",
      "SAAG (Serum Ascites Albumin Gradient)",
      "Iron Profile",
      "Blood Picture (Peripheral Smear)",
      "Anti-TPO (Thyroid Peroxidase Antibody)",
      "Bleeding Time (BT) & Clotting Time (CT)",
    ];

    const ReportSearchBar = () => {
      const [q, setQ] = React.useState("");
      const [open, setOpen] = React.useState(false);
      const wRef = React.useRef(null);
      const inpRef = React.useRef(null);
      React.useEffect(() => {
        const h = e => { if (wRef.current && !wRef.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
      }, []);
      const filtered = React.useMemo(() => {
        const lq = q.trim().toLowerCase();
        if (!lq) return REPORT_MASTER.slice(0, 20);
        return REPORT_MASTER.filter(r => r.toLowerCase().includes(lq)).slice(0, 20);
      }, [q]);
      const addReport = (name) => {
        addEditableRow({
          _localId: `r-new-${Date.now()}`,
          reportName: name,
          reportType: "Haematology",
          date: new Date().toISOString().slice(0, 10),
          orderedBy: editableRows[0]?.orderedBy || "",
          remarks: "", impression: "", amount: 0,
          tests: getDefaultTests(name),
        });
        setQ(""); setOpen(false);
      };
      return (
        <div ref={wRef} style={{ position:"relative", marginBottom:14 }}>
          <input
            ref={inpRef}
            value={q}
            placeholder="🔍 Search & add report from master list…"
            onChange={e => { setQ(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            style={{ ...inpStyle, width:"100%", boxSizing:"border-box" }}
          />
          {open && (
            <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, zIndex:99999, maxHeight:260, overflowY:"auto", background:"#fff", border:"1px solid #e2e8f0", borderRadius:10, boxShadow:"0 12px 32px rgba(0,0,0,0.18)" }}>
              {filtered.length === 0 && (
                <div style={{ padding:"10px 14px", fontSize:12, color:"#94a3b8" }}>No match — click below to add custom</div>
              )}
              {filtered.map((name, i) => (
                <div key={i} onClick={() => addReport(name)}
                  style={{ padding:"10px 14px", cursor:"pointer", borderBottom:"1px solid #f1f5f9", fontSize:13, color:"#0f172a" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f0f9ff"}
                  onMouseLeave={e => e.currentTarget.style.background = ""}>
                  + {name}
                </div>
              ))}
              {q.trim() && !REPORT_MASTER.some(r => r.toLowerCase() === q.trim().toLowerCase()) && (
                <div onClick={() => addReport(q.trim())}
                  style={{ padding:"10px 14px", cursor:"pointer", fontSize:13, fontWeight:700, color:"#3b82f6", background:"#eff6ff", borderTop:"1px solid #bfdbfe" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#dbeafe"}
                  onMouseLeave={e => e.currentTarget.style.background = "#eff6ff"}>
                  + Add "{q.trim()}" as custom report
                </div>
              )}
            </div>
          )}
        </div>
      );
    };

    const renderReports = () => (
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        {canEditRecords && <ReportSearchBar />}
        {!editableRows.length && (
          <div style={{ padding:"32px", textAlign:"center", color:T.textMuted, fontStyle:"italic", border:`1px dashed ${T.border}`, borderRadius:10 }}>
            No reports found.{canEditRecords ? " Use the search above to add one." : ""}
          </div>
        )}
        {editableRows.map((rep, ri) => (
          <div key={rep._localId||ri} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, overflow:"hidden" }}>
            {/* Report Header */}
            <div style={{ background:"linear-gradient(135deg,#0f172a,#1e3a5f)", padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
              <div style={{ flex:1 }}>
                {canEditRecords
                  ? <input value={rep.reportName||""} placeholder="Report Name (e.g. Complete Blood Count)"
                      onChange={e=>updateEditableField(ri,"reportName",e.target.value)}
                      style={{ background:"transparent", border:"none", borderBottom:"1.5px solid rgba(255,255,255,.3)", outline:"none", color:"#fff", fontFamily:"inherit", fontSize:14, fontWeight:700, width:"100%", paddingBottom:2 }}/>
                  : <div style={{ fontSize:14, fontWeight:700, color:"#fff" }}>{rep.reportName||"Report"}</div>}
                <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginTop:8, fontSize:11, color:"rgba(255,255,255,.7)", alignItems:"center" }}>
                  <span>Type:&nbsp;
                    {canEditRecords
                      ? <select value={rep.reportType||"Haematology"} onChange={e=>updateEditableField(ri,"reportType",e.target.value)}
                          style={{ background:"transparent", border:"none", borderBottom:"1px solid rgba(255,255,255,.3)", outline:"none", color:"rgba(255,255,255,.85)", fontFamily:"inherit", fontSize:11 }}>
                          {REPORT_TYPES.map(t=><option key={t} value={t} style={{ background:"#1e3a5f" }}>{t}</option>)}
                        </select>
                      : rep.reportType}
                  </span>
                  <span>Date:&nbsp;
                    {canEditRecords
                      ? <input type="date" value={rep.date||""} onChange={e=>updateEditableField(ri,"date",e.target.value)}
                          style={{ background:"transparent", border:"none", borderBottom:"1px solid rgba(255,255,255,.3)", outline:"none", color:"rgba(255,255,255,.85)", fontFamily:"inherit", fontSize:11 }}/>
                      : rep.date||"—"}
                  </span>
                  <span>Dr:&nbsp;
                    {canEditRecords
                      ? <input value={rep.orderedBy||""} placeholder="Doctor name" onChange={e=>updateEditableField(ri,"orderedBy",e.target.value)}
                          style={{ background:"transparent", border:"none", borderBottom:"1px solid rgba(255,255,255,.3)", outline:"none", color:"rgba(255,255,255,.85)", fontFamily:"inherit", fontSize:11, width:160 }}/>
                      : rep.orderedBy||"—"}
                  </span>
                  <span>₹:&nbsp;
                    {canEditRecords
                      ? <input type="number" min={0} value={rep.amount||0} onChange={e=>updateEditableField(ri,"amount",parseFloat(e.target.value)||0)}
                          style={{ background:"transparent", border:"none", borderBottom:"1px solid rgba(255,255,255,.3)", outline:"none", color:"rgba(255,255,255,.85)", fontFamily:"inherit", fontSize:11, width:70 }}/>
                      : `₹${rep.amount||0}`}
                  </span>
                </div>
              </div>
              {canEditRecords && (
                <button onClick={()=>removeEditableRow(ri)}
                  style={{ background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.3)", color:"#ef4444", borderRadius:6, padding:"4px 10px", cursor:"pointer", fontSize:11, fontFamily:"inherit" }}>✕ Remove</button>
              )}
            </div>
            {/* Test Rows */}
            <div style={{ padding:"12px 16px" }}>
              {(rep.tests||[]).length > 0 && (
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, marginBottom:8 }}>
                  <thead>
                    <tr style={{ background:T.surfaceRaised }}>
                      {["Test Name","Value","Unit","Ref Range","Status"].map(h=>(
                        <th key={h} style={{ padding:"6px 10px", textAlign:"left", fontWeight:700, color:T.textMuted, fontSize:10, textTransform:"uppercase", borderBottom:`1px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(rep.tests||[]).map((t,ti)=>(
                      <tr key={t.id||ti} style={{ borderBottom:`1px solid ${T.border}` }}>
                        <td style={{ padding:"6px 10px", fontWeight:500, color:T.text }}>{canEditRecords
                          ? <input value={t.name||""} onChange={e=>{const rows=[...editableRows];rows[ri]={...rows[ri],tests:rows[ri].tests.map((x,j)=>j===ti?{...x,name:e.target.value}:x)};setEditableRows(rows);setIsRecordDirty(true);isRecordDirtyRef.current=true;}} style={{...inpStyle,minWidth:120}}/>
                          : t.name||"—"}</td>
                        <td style={{ padding:"6px 10px" }}>{canEditRecords
                          ? <input value={t.value||""} onChange={e=>{const rows=[...editableRows];rows[ri]={...rows[ri],tests:rows[ri].tests.map((x,j)=>j===ti?{...x,value:e.target.value}:x)};setEditableRows(rows);setIsRecordDirty(true);isRecordDirtyRef.current=true;}} style={{...inpStyle,width:80}}/>
                          : <span style={{ fontWeight:700, color:STATUS_COLORS[t.status]||T.text }}>{t.value||"—"}</span>}</td>
                        <td style={{ padding:"6px 10px", color:T.textMuted }}>{t.unit||"—"}</td>
                        <td style={{ padding:"6px 10px", color:T.textMuted }}>{t.refRange||t.normal||"—"}</td>
                        <td style={{ padding:"6px 10px" }}>
                          {canEditRecords
                            ? <select value={t.status||"Normal"} onChange={e=>{const rows=[...editableRows];rows[ri]={...rows[ri],tests:rows[ri].tests.map((x,j)=>j===ti?{...x,status:e.target.value}:x)};setEditableRows(rows);setIsRecordDirty(true);isRecordDirtyRef.current=true;}} style={{...inpStyle,width:80}}>
                                {["Normal","High","Low"].map(s=><option key={s}>{s}</option>)}
                              </select>
                            : <span style={{ fontSize:10, fontWeight:700, color:STATUS_COLORS[t.status]||"#10b981", background:STATUS_COLORS[t.status]+"18"||"#10b98118", borderRadius:4, padding:"2px 6px" }}>{t.status||"Normal"}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {/* Remarks / Findings */}
              {canEditRecords && (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:8 }}>
                  <div><label style={{ fontSize:10, color:T.textMuted, textTransform:"uppercase", fontWeight:700 }}>Remarks / Interpretation</label>
                    <input value={rep.remarks||""} placeholder="Clinical interpretation…" onChange={e=>updateEditableField(ri,"remarks",e.target.value)} style={{...inpStyle,width:"100%",boxSizing:"border-box",marginTop:4}}/></div>
                  <div><label style={{ fontSize:10, color:T.textMuted, textTransform:"uppercase", fontWeight:700 }}>Impression</label>
                    <input value={rep.impression||""} placeholder="Impression…" onChange={e=>updateEditableField(ri,"impression",e.target.value)} style={{...inpStyle,width:"100%",boxSizing:"border-box",marginTop:4}}/></div>
                </div>
              )}
              {!canEditRecords && (rep.remarks||rep.impression) && (
                <div style={{ fontSize:12, color:T.textSub, marginTop:6, fontStyle:"italic" }}>{rep.remarks||""}{rep.impression?` · ${rep.impression}`:""}</div>
              )}
              {canEditRecords && (
                <button style={{ ...mkBtn("dim",theme), padding:"4px 10px", fontSize:11, marginTop:8 }}
                  onClick={()=>{const rows=[...editableRows];rows[ri]={...rows[ri],tests:[...(rows[ri].tests||[]),{id:Date.now(),name:"",value:"",unit:"",refRange:"",status:"Normal"}]};setEditableRows(rows);setIsRecordDirty(true);isRecordDirtyRef.current=true;}}>
                  + Add Test Row
                </button>
              )}
            </div>
          </div>
        ))}
        {canEditRecords && (
          <button style={{ ...mkBtn("ghost",theme), padding:"7px 14px", fontSize:11, marginTop:4 }}
            onClick={()=>addEditableRow({ _localId:`r-new-${Date.now()}`, reportName:"", reportType:"Haematology", date:new Date().toISOString().slice(0,10), orderedBy:"", remarks:"", impression:"", amount:0, tests:[{id:Date.now(),name:"",value:"",unit:"",refRange:"",status:"Normal"}] })}>
            + Add Blank Report Manually
          </button>
        )}
      </div>
    );

    const renderMedicines = () => {
      const medTotal = editableRows.reduce((s,m)=>s+(Number(m.quantity||m.qty||1)*Number(m.rate||0)),0);
      return (
        <SectionCard theme={theme} icon="💊" title="Medicine Bill" subtitle={canEditRecords ? "Edit medicines with rate and expiry for cash patient" : "View only — cashless patient"}>
          {/* Search dropdown for cash patients */}
          {canEditRecords && (() => {
            const BranchMedDrop = () => {
              const [q, setQ] = React.useState("");
              const [open, setOpen] = React.useState(false);
              const [rect, setRect] = React.useState(null);
              const ref = React.useRef(null);
              const wRef = React.useRef(null);
              React.useEffect(()=>{
                const h=e=>{if(wRef.current&&!wRef.current.contains(e.target))setOpen(false);};
                document.addEventListener("mousedown",h);
                return()=>document.removeEventListener("mousedown",h);
              },[]);
              const filtered = React.useMemo(()=>{
                const lq=q.trim().toLowerCase();
                if(!lq) return medicineMaster.slice(0,30);
                return medicineMaster.filter(m=>(m.name||"").toLowerCase().includes(lq)).slice(0,30);
              },[q]);
              return (
                <div ref={wRef} style={{position:"relative",marginBottom:12}}>
                  <input ref={ref} value={q} placeholder="🔍 Search & add medicine from master…"
                    onChange={e=>{setQ(e.target.value);if(ref.current)setRect(ref.current.getBoundingClientRect());setOpen(true);}}
                    onFocus={()=>{if(ref.current)setRect(ref.current.getBoundingClientRect());setOpen(true);}}
                    style={{...inpStyle,width:"100%",boxSizing:"border-box"}}/>
                  {open && rect && (
                    <div style={{position:"fixed",top:rect.bottom+4,left:rect.left,width:rect.width,zIndex:99999,maxHeight:250,overflowY:"auto",background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,boxShadow:"0 12px 32px rgba(0,0,0,0.2)"}}>
                      {filtered.length===0 && <div style={{padding:"10px 14px",fontSize:12,color:"#94a3b8"}}>No medicines found</div>}
                      {filtered.map((m,i)=>(
                        <div key={i} onClick={()=>{
                          const rate=Number(m.rate||m.price||0);
                          addEditableRow({_localId:`m-${Date.now()}`,medicine_name:m.name||"",quantity:1,qty:1,rate,amount:rate,expiry_date:m.expiry_date||"",batch_no:m.batch_no||"",date_given:new Date().toISOString().slice(0,10)});
                          setQ(""); setOpen(false);
                        }} style={{padding:"10px 14px",cursor:"pointer",borderBottom:"1px solid #f1f5f9"}}
                        onMouseEnter={e=>e.currentTarget.style.background="#f0f9ff"}
                        onMouseLeave={e=>e.currentTarget.style.background=""}>
                          <div style={{fontSize:13,fontWeight:600,color:"#0f172a"}}>+ {m.name}</div>
                          <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>₹{m.rate||0}{m.expiry_date?` · Exp: ${m.expiry_date}`:""}{m.batch_no?` · Batch: ${m.batch_no}`:""}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            };
            return <BranchMedDrop/>;
          })()}
          {!editableRows.length && (
            <div style={{ padding:"22px", textAlign:"center", color:T.textMuted, fontStyle:"italic", border:`1px dashed ${T.border}`, borderRadius:"10px" }}>No medicines added.</div>
          )}
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead>
                <tr style={{ background:T.surfaceRaised }}>
                  {["Medicine Name","Date","Qty","Rate (₹)","Expiry","Amount",canEditRecords?"":""].map((h,i)=>(
                    <th key={i} style={{ padding:"8px 12px", textAlign:"left", fontWeight:700, color:T.textMuted, fontSize:10, textTransform:"uppercase", borderBottom:`1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {editableRows.map((m, mi) => {
                  const qty = Number(m.quantity||m.qty||1);
                  const rate = Number(m.rate||0);
                  return (
                    <tr key={m._localId||mi} style={{ borderBottom:`1px solid ${T.border}` }}>
                      <td style={{ padding:"8px 12px" }}>
                        {canEditRecords
                          ? <input value={m.medicine_name||""} placeholder="Medicine name" onChange={e=>updateEditableField(mi,"medicine_name",e.target.value)} style={{...inpStyle,minWidth:150}}/>
                          : <span style={{ fontWeight:600, color:T.text }}>{m.medicine_name||"—"}</span>}
                      </td>
                      <td style={{ padding:"8px 12px" }}>
                        {canEditRecords
                          ? <input type="date" value={m.date_given||m.date||""} onChange={e=>updateEditableField(mi,"date_given",e.target.value)} style={{...inpStyle,width:120}}/>
                          : <span style={{ color:T.textSub }}>{m.date_given||m.date||"—"}</span>}
                      </td>
                      <td style={{ padding:"8px 12px" }}>
                        {canEditRecords
                          ? <input type="number" min={1} value={qty} onChange={e=>{const q=Math.max(1,parseInt(e.target.value)||1);updateEditableField(mi,"quantity",q);updateEditableField(mi,"amount",q*rate);}} style={{...inpStyle,width:60,textAlign:"center"}}/>
                          : <span style={{ color:T.textSub }}>{qty}</span>}
                      </td>
                      <td style={{ padding:"8px 12px" }}>
                        {canEditRecords
                          ? <input type="number" min={0} step="0.01" value={rate} onChange={e=>{const r=parseFloat(e.target.value)||0;updateEditableField(mi,"rate",r);updateEditableField(mi,"amount",qty*r);}} style={{...inpStyle,width:80,textAlign:"right"}}/>
                          : <span style={{ color:T.textSub }}>₹{rate}</span>}
                      </td>
                      <td style={{ padding:"8px 12px" }}>
                        {canEditRecords
                          ? <input value={m.expiry_date||""} placeholder="MM/YYYY" onChange={e=>updateEditableField(mi,"expiry_date",e.target.value)} style={{...inpStyle,width:90}}/>
                          : <span style={{ color:T.textSub }}>{m.expiry_date||"—"}</span>}
                      </td>
                      <td style={{ padding:"8px 12px", fontWeight:700, color:"#f59e0b" }}>₹{(qty*rate).toFixed(2)}</td>
                      {canEditRecords && (
                        <td style={{ padding:"8px 12px" }}>
                          <button style={{ ...mkBtn("danger",theme), padding:"4px 8px", fontSize:11 }} onClick={()=>removeEditableRow(mi)}>✕</button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {canEditRecords && (
            <button style={{ ...mkBtn("primary",theme), padding:"8px 14px", fontSize:12, marginTop:12 }}
              onClick={()=>addEditableRow({_localId:`m-new-${Date.now()}`,medicine_name:"",quantity:1,qty:1,rate:0,amount:0,expiry_date:"",batch_no:"",date_given:new Date().toISOString().slice(0,10)})}>
              + Add Medicine Manually
            </button>
          )}
          {editableRows.length>0 && (
            <div style={{ display:"flex", justifyContent:"flex-end", marginTop:10, paddingTop:10, borderTop:`1px solid ${T.border}` }}>
              <span style={{ fontWeight:800, color:"#f59e0b", fontSize:13 }}>Total: ₹{medTotal.toFixed(2)}</span>
            </div>
          )}
        </SectionCard>
      );
    };


    const SERVICE_MASTER = [
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

    const renderServices = () => {
      const svcTotal = editableRows.reduce((s, r) => s + Number(r.quantity || 1) * Number(r.rate || 0), 0);

      const SvcSearchBar = () => {
        const [q, setQ] = React.useState("");
        const [open, setOpen] = React.useState(false);
        const wRef = React.useRef(null);
        React.useEffect(() => {
          const h = (e) => { if (wRef.current && !wRef.current.contains(e.target)) setOpen(false); };
          document.addEventListener("mousedown", h);
          return () => document.removeEventListener("mousedown", h);
        }, []);
        const filtered = React.useMemo(() => {
          const lq = q.trim().toLowerCase();
          if (!lq) return SERVICE_MASTER.slice(0, 20);
          return SERVICE_MASTER.filter(s => s.name.toLowerCase().includes(lq) || s.code.toLowerCase().includes(lq)).slice(0, 20);
        }, [q]);
        const addSvc = (svc) => {
          addEditableRow({
            _localId:      `svc-new-${Date.now()}`,
            isSvc:         true,
            medicine_name: svc.name,
            date_given:    new Date().toISOString().slice(0, 10),
            quantity:      1,
            rate:          svc.rate || 0,
            batch_no:      svc.code || "",
            expiry_date:   "",
            amount:        svc.rate || 0,
          });
          setQ(""); setOpen(false);
        };
        return (
          <div ref={wRef} style={{ position: "relative", marginBottom: 14 }}>
            <input
              value={q}
              placeholder="🔍 Search & add service from master list…"
              onChange={e => { setQ(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              style={{ ...inpStyle, width: "100%", boxSizing: "border-box" }}
            />
            {open && (
              <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 99999, maxHeight: 280, overflowY: "auto", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, boxShadow: "0 12px 32px rgba(0,0,0,0.18)" }}>
                {filtered.length === 0 && <div style={{ padding: "10px 14px", fontSize: 12, color: "#94a3b8" }}>No match — add custom below</div>}
                {filtered.map((svc, i) => (
                  <div key={i} onClick={() => addSvc(svc)}
                    style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f1f5f9", fontSize: 13, color: "#0f172a", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f0f9ff"}
                    onMouseLeave={e => e.currentTarget.style.background = ""}>
                    <span><strong>{svc.name}</strong> <span style={{ fontSize: 11, color: "#94a3b8" }}>({svc.code})</span></span>
                    <span style={{ fontSize: 12, color: "#059669", fontWeight: 700 }}>₹{svc.rate}</span>
                  </div>
                ))}
                {q.trim() && !SERVICE_MASTER.some(s => s.name.toLowerCase() === q.trim().toLowerCase()) && (
                  <div onClick={() => addSvc({ name: q.trim(), code: "", rate: 0 })}
                    style={{ padding: "10px 14px", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#3b82f6", background: "#eff6ff", borderTop: "1px solid #bfdbfe" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#dbeafe"}
                    onMouseLeave={e => e.currentTarget.style.background = "#eff6ff"}>
                    + Add "{q.trim()}" as custom service
                  </div>
                )}
              </div>
            )}
          </div>
        );
      };

      return (
        <SectionCard theme={theme} icon="🏥" title="Services & Charges" subtitle={canEditRecords ? "Add, edit or remove service line-items for this admission" : "View only — cashless patient"}>
          {canEditRecords && <SvcSearchBar />}
          {!editableRows.length && (
            <div style={{ padding: "22px", textAlign: "center", color: T.textMuted, fontStyle: "italic", border: `1px dashed ${T.border}`, borderRadius: "10px" }}>
              No services added.{canEditRecords ? " Use the search above or add manually." : ""}
            </div>
          )}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.surfaceRaised }}>
                  {["#", "Description", "CGHS Code", "Date", "Qty", "Rate (₹)", "Amount", canEditRecords ? "" : ""].map((h, i) => (
                    <th key={i} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: T.textMuted, fontSize: 10, textTransform: "uppercase", borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {editableRows.map((row, ri) => {
                  const qty  = Number(row.quantity || 1);
                  const rate = Number(row.rate || 0);
                  return (
                    <tr key={row._localId || ri} style={{ borderBottom: `1px solid ${T.border}`, background: ri % 2 === 0 ? "transparent" : T.surfaceRaised + "44" }}>
                      <td style={{ padding: "8px 12px", color: T.textMuted, fontSize: 11, fontWeight: 600 }}>{ri + 1}</td>
                      <td style={{ padding: "8px 12px", minWidth: 180 }}>
                        {canEditRecords
                          ? <input value={row.medicine_name || ""} placeholder="Service description" onChange={e => updateEditableField(ri, "medicine_name", e.target.value)} style={{ ...inpStyle, minWidth: 160 }} />
                          : <span style={{ fontWeight: 600, color: T.text }}>{row.medicine_name || "—"}</span>}
                      </td>
                      <td style={{ padding: "8px 12px", minWidth: 110 }}>
                        {canEditRecords
                          ? <input value={row.batch_no || ""} placeholder="e.g. RM01" onChange={e => updateEditableField(ri, "batch_no", e.target.value)} style={{ ...inpStyle, width: 90 }} />
                          : <span style={{ color: T.textMuted, fontFamily: "monospace", fontSize: 11 }}>{row.batch_no || "—"}</span>}
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        {canEditRecords
                          ? <input type="date" value={row.date_given || ""} onChange={e => updateEditableField(ri, "date_given", e.target.value)} style={{ ...inpStyle, width: 130 }} />
                          : <span style={{ color: T.textSub }}>{row.date_given || "—"}</span>}
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        {canEditRecords
                          ? <input type="number" min={1} value={qty}
                              onChange={e => { const q = Math.max(1, parseInt(e.target.value) || 1); updateEditableField(ri, "quantity", q); updateEditableField(ri, "amount", q * rate); }}
                              style={{ ...inpStyle, width: 60, textAlign: "center" }} />
                          : <span style={{ color: T.textSub }}>{qty}</span>}
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        {canEditRecords
                          ? <input type="number" min={0} step="0.01" value={rate}
                              onChange={e => { const r = parseFloat(e.target.value) || 0; updateEditableField(ri, "rate", r); updateEditableField(ri, "amount", qty * r); }}
                              style={{ ...inpStyle, width: 90, textAlign: "right" }} />
                          : <span style={{ color: T.textSub }}>₹{rate.toLocaleString()}</span>}
                      </td>
                      <td style={{ padding: "8px 12px", fontWeight: 700, color: theme.primary, whiteSpace: "nowrap" }}>
                        ₹{(qty * rate).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      {canEditRecords && (
                        <td style={{ padding: "8px 12px" }}>
                          <button style={{ ...mkBtn("danger", theme), padding: "4px 8px", fontSize: 11 }} onClick={() => removeEditableRow(ri)}>✕</button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {canEditRecords && (
            <div style={{ display:"flex", gap:10, marginTop:12, flexWrap:"wrap" }}>
              <button style={{ ...mkBtn("primary", theme), padding: "8px 14px", fontSize: 12 }}
                onClick={() => addEditableRow({ _localId: `svc-new-${Date.now()}`, isSvc: true, medicine_name: "", date_given: new Date().toISOString().slice(0, 10), quantity: 1, rate: 0, batch_no: "", expiry_date: "", amount: 0 })}>
                + Add Service Manually
              </button>
              <button style={{ ...mkBtn("success", theme), padding: "8px 18px", fontSize: 12 }}
                onClick={saveCurrentTab} disabled={savingRecords}>
                {savingRecords ? "Saving…" : "💾 Save Services"}
              </button>
            </div>
          )}
          {editableRows.length > 0 && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12, paddingTop: 10, borderTop: `1px solid ${T.border}`, gap: 24, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: T.textMuted }}>Total Services: {editableRows.length}</span>
              <span style={{ fontWeight: 800, color: theme.primary, fontSize: 14 }}>Total: ₹{svcTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
          )}
        </SectionCard>
      );
    };
    return (
      <>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderLeft:`3px solid ${theme.primary}`, borderRadius:"10px", padding:"18px 24px", marginBottom:"22px", display:"flex", gap:"28px", flexWrap:"wrap", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:"9px", letterSpacing:"2px", color:T.textMuted, textTransform:"uppercase", marginBottom:"3px" }}>Patient</div>
            <div style={{ fontSize:"18px", fontWeight:"800", color:T.text }}>{selPatient.name}</div>
          </div>
          {[["ID","#"+selPatient.id],["Age",selPatient.age],["Dept",selPatient.department],["Doctor",selPatient.doctor],["Pay Mode",selPatient.paymentMode],["Type",selPatient.paymentType||"—"],["Status",selPatient.status]].map(([l,v])=>(
            <div key={l}>
              <div style={{ fontSize:"9px", letterSpacing:"2px", color:T.textMuted, textTransform:"uppercase", marginBottom:"3px" }}>{l}</div>
              <div style={{ fontSize:"12px", color:T.textSub }}>{v}</div>
            </div>
          ))}
          <div style={{ marginLeft:"auto", display:"flex", gap:"8px", alignItems:"center", flexWrap:"wrap" }}>
            <button style={{ ...mkBtn("dim", theme), padding:"8px 14px", fontSize:"11px" }} onClick={handlePrint}>
              ⎙ Print Section
            </button>
            {canEditRecords && (
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {[
                  {key:"discharge_summary", label:"Discharge", kind:"dynamic-summary"},
                  {key:"admission_note",    label:"Admission", kind:"admission-note"},
                  {key:"reports",           label:"Reports",   kind:"lab-reports"},
                  {key:"medicines",         label:"Medicines", kind:"pharmacy-records"},
                ].map(d => (
                  <button key={d.key}
                    style={{ ...mkBtn("primary", theme), padding:"6px 10px", fontSize:10 }}
                    onClick={() => {
                      const uhid = selPatient?.uhid;
                      const admNo = selectedAdmission?.admNo;
                      if(!uhid||!admNo) return;
                      window.open(`${BASE_URL}/patients/${uhid}/admissions/${admNo}/${d.kind}/print/`, "_blank");
                    }}>
                    🖨 {d.label}
                  </button>
                ))}
              </div>
            )}
            <button style={{ ...mkBtn("excel", theme), fontSize:"11px" }}
              onClick={() => exportExcel((editableRows || []).map(r=>({...r, patientId:selPatient.id, patientName:selPatient.name})), `${recTab}_${selPatient.id}`)}>
              ↓ Excel
            </button>
            {canEditRecords ? (
              <button style={{ ...mkBtn("primary", theme), padding:"8px 12px", fontSize:"11px" }} onClick={saveCurrentTab} disabled={savingRecords}>
                {savingRecords ? "Saving..." : "Save Section"}
              </button>
            ) : (
              <div style={{ fontSize:"10px", color:T.textMuted, alignSelf:"center", padding:"4px 10px", border:`1px solid ${T.border}`, borderRadius:"20px" }}>Cashless: View only</div>
            )}
            <button style={{ ...mkBtn("ghost", theme), padding:"8px 12px" }} onClick={() => setSelPatient(null)}>✕</button>
          </div>
        </div>

        {doctorDatalist}
        <div style={{ display:"flex", gap:"6px", marginBottom:"20px", flexWrap:"wrap" }}>
          {RECORD_TYPES.map(rt => (
            <button key={rt.id} onClick={() => setRecTab(rt.id)} style={{
              padding:"7px 16px", borderRadius:"7px", fontSize:"11px", fontFamily:"inherit",
              cursor:"pointer", border:"1px solid", transition:"all 0.15s",
              background: recTab===rt.id ? theme.primaryDim : "transparent",
              borderColor: recTab===rt.id ? theme.primaryBorder : T.border,
              color: recTab===rt.id ? theme.primary : T.textSub,
              fontWeight: recTab===rt.id ? "600" : "400",
            }}>{rt.label}</button>
          ))}
        </div>

        <div>
          {recTab === "discharge_summary" && renderDischarge()}
          {recTab === "admission_note"    && renderAdmissionNote()}

          {recTab === "reports"           && renderReports()}
          {recTab === "medicines"         && renderMedicines()}
          {recTab === "services"          && renderServices()}
          {recTab === "final_bill"       && renderFinalBill()}
        </div>
      </>
    );
  }


  function PrintApprovalsView() {
    const allPrints  = printRequests || [];
    const branchPrints = allPrints.filter(req =>
      String(req?.patient?.branch_location || "").toUpperCase() === resolvedBranchCode
    );
    const pending  = branchPrints.filter(r => !r.approvedAt && !r.rejectedAt);
    const approved = branchPrints.filter(r => !!r.approvedAt);
    const rejected = branchPrints.filter(r => !!r.rejectedAt);

    const PATable = ({ rows, label, showActions }) => (
      <div style={{ marginBottom:20 }}>
        <TableShell title={label} count={rows.length}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"12px" }}>
            <thead><tr>{["UHID","Patient","Adm #","Requested At", showActions ? "Action" : "Status"].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
            <tbody>
              {!rows.length
                ? <EmptyRow cols={5} msg="NONE" />
                : rows.map(req => (
                  <tr key={req.uhid+"-"+req.admNo}>
                    <Td><span style={{color:T.textMuted,fontSize:"10px"}}>{req.uhid}</span></Td>
                    <Td primary>{req?.patient?.patientName || req?.patient?.name || "Patient"}</Td>
                    <Td>#{req.admNo}</Td>
                    <Td>{String(req.requestedAt||"").slice(0,16).replace("T"," ")||"—"}</Td>
                    <Td>
                      {showActions ? (
                        <div style={{display:"flex",gap:"8px"}}>
                          <button style={{...mkBtn("primary",theme),padding:"4px 12px",fontSize:"10px"}} onClick={()=>onApprovePrint?.(req,"approve")}>Approve</button>
                          <button style={{...mkBtn("danger",theme),padding:"4px 12px",fontSize:"10px"}} onClick={()=>onApprovePrint?.(req,"reject")}>Reject</button>
                          <button style={{...mkBtn("dim",theme),padding:"4px 12px",fontSize:"10px"}} onClick={()=>onViewBill?.(req)}>View</button>
                        </div>
                      ) : (
                        <span style={mkBadge(req.approvedAt ? "active" : "unpaid")}>
                          {req.approvedAt ? "Approved" : "Rejected"}
                        </span>
                      )}
                    </Td>
                  </tr>
                ))}
            </tbody>
          </table>
        </TableShell>
      </div>
    );

    return (
      <>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"14px",marginBottom:"24px"}}>
          <StatCard label="Pending"  value={pending.length}  color={T.warning} />
          <StatCard label="Approved" value={approved.length} color={T.success} />
          <StatCard label="Rejected" value={rejected.length} color={T.danger}  />
        </div>
        <PATable rows={pending}  label="Pending Approvals"  showActions={true}  />
        <PATable rows={approved} label="Approved"           showActions={false} />
        <PATable rows={rejected} label="Rejected"           showActions={false} />
      </>
    );
  }

  function EmployeesView() {
    const roleColor = { Doctor:T.blue, Nurse:T.success, Admin:T.warning, Billing:T.purple, HOD:theme.primary };
    return (
      <>
        <div style={{ display:"flex", justifyContent:"flex-end", gap:"10px", marginBottom:"20px" }}>
          <button style={mkBtn("excel", theme)} onClick={() => exportExcel(employees.map(e=>({ "Emp ID":e.employeeId, Name:e.name, Email:e.email, Phone:e.phone, Role:e.role, Joined:e.joinedDate, Branch:resolvedBranchName })), `employees_${resolvedBranchKey}`)}>↓ Excel</button>
          <button style={mkBtn("primary", theme)} onClick={() => setModal("emp")}>+ Add Employee</button>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"14px", marginBottom:"22px" }}>
          <StatCard label="Total Staff" value={employees.length} color={theme.primary} />
          {["Doctor","Nurse","Admin","Billing"].map(r => (
            <StatCard key={r} label={`${r}s`} value={employees.filter(e=>e.role===r).length} color={roleColor[r]||T.blue} />
          ))}
        </div>

        <TableShell title="Employees" count={employees.length}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"12px" }}>
            <thead><tr>{["Emp ID","Name","Email","Phone","Role","Joined","Action"].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
            <tbody>
              {!employees.length
                ? <EmptyRow cols={7} msg="NO EMPLOYEES" />
                : employees.map(emp => (
                  <tr key={emp.id}>
                    <Td><span style={{color:T.textMuted,fontSize:"10px"}}>{emp.employeeId}</span></Td>
                    <Td primary>{emp.name}</Td>
                    <Td>{emp.email}</Td>
                    <Td>{emp.phone}</Td>
                    <Td>
                      <span style={{ background:(roleColor[emp.role]||T.blue)+"20", color:roleColor[emp.role]||T.blue, border:`1px solid ${(roleColor[emp.role]||T.blue)}40`, padding:"2px 9px", borderRadius:"20px", fontSize:"10px", fontWeight:"600" }}>
                        {emp.role}
                      </span>
                    </Td>
                    <Td>{emp.joinedDate}</Td>
                    <Td><button style={{ ...mkBtn("danger",theme), padding:"4px 12px", fontSize:"10px" }} onClick={()=>deleteEmp(emp.id)}>Remove</button></Td>
                  </tr>
                ))}
            </tbody>
          </table>
        </TableShell>
      </>
    );
  }

  const fi = { ...mkInput(), width:"100%" };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ display:"flex", height:"100dvh", minHeight:"100vh", background:T.bg, color:T.text, fontFamily:UI_FONT_STACK, fontSize:"15px", overflow:"hidden" }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside style={{ width:"256px", minWidth:"256px", background:T.surface, borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column", minHeight:0 }}>
        <div style={{ padding:"22px 20px 18px", borderBottom:`1px solid ${T.border}` }}>
          <div style={{ fontSize:"8px", letterSpacing:"4px", color:T.textMuted, textTransform:"uppercase", marginBottom:"2px" }}>MedCore HMS</div>
          <div style={{ fontSize:"16px", fontWeight:"800", color:T.text }}>Branch Admin</div>
          <div style={{ marginTop:"12px", display:"flex", alignItems:"center", gap:"10px" }}>
            <div style={{ width:"34px", height:"34px", borderRadius:"9px", flexShrink:0, background:theme.primaryDim, border:`1px solid ${theme.primaryBorder}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"14px", fontWeight:"800", color:theme.primary }}>
              {resolvedAdminName?.[0]?.toUpperCase() || "A"}
            </div>
            <div>
              <div style={{ fontSize:"13px", fontWeight:"600", color:T.text }}>{resolvedAdminName}</div>
              <div style={{ fontSize:"9px", color:T.textMuted, letterSpacing:"1px" }}>Branch Admin</div>
            </div>
          </div>
        </div>

        <div style={{ margin:"14px 14px 2px", padding:"11px 14px", background:theme.glow, border:`1px solid ${theme.primaryBorder}`, borderRadius:"9px" }}>
          <div style={{ fontSize:"8px", letterSpacing:"2px", color:T.textMuted, textTransform:"uppercase", marginBottom:"5px" }}>Assigned Branch</div>
          <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"3px" }}>
            <div style={{ width:"9px", height:"9px", borderRadius:"50%", background:theme.primary, flexShrink:0 }} />
            <div style={{ fontSize:"14px", fontWeight:"700", color:theme.primary }}>{resolvedBranchName}</div>
          </div>
          <div style={{ fontSize:"9px", color:T.textMuted }}>Read-only · Set by SuperAdmin</div>
          {onLogout && (
            <button style={{ ...mkBtn("danger", theme), marginTop:"10px", width:"100%", justifyContent:"center" }} onClick={onLogout}>Logout</button>
          )}
        </div>

        <div style={{ flex:1, minHeight:0, padding:"14px 12px", overflowY:"auto", overscrollBehavior:"contain" }}>
          <div style={{ fontSize:"8px", letterSpacing:"3px", color:T.textMuted, textTransform:"uppercase", padding:"0 8px", marginBottom:"8px" }}>Menu</div>
          {NAV.map(item => {
            const Icon = item.icon;
            return (<button key={item.id} onClick={() => setNav(item.id)} style={{
              display:"flex", alignItems:"center", gap:"10px",
              width:"100%", padding:"10px 12px", borderRadius:"8px",
              border:"none", cursor:"pointer", textAlign:"left",
              marginBottom:"2px", fontFamily:"inherit",
              background: nav===item.id ? theme.primaryDim : "transparent",
              color: nav===item.id ? theme.primary : T.textSub,
              borderLeft: nav===item.id ? `2px solid ${theme.primary}` : "2px solid transparent",
              transition:"all 0.15s",
            }}>
              <span style={{ fontSize:"15px", width:"20px", textAlign:"center", flexShrink:0, display:"inline-flex", justifyContent:"center" }}>
                {Icon ? <Icon size={15} strokeWidth={2} /> : null}
              </span>
              <span style={{ fontSize:"12px", fontWeight: nav===item.id ? "600" : "400" }}>{item.label}</span>
            </button>);
          })}
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0, minHeight:0 }}>

        {/* Topbar */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 28px", borderBottom:`1px solid ${T.border}`, background:T.surface, flexShrink:0 }}>
          <div>
            <div style={{ fontSize:"9px", letterSpacing:"2px", color:T.textMuted, textTransform:"uppercase", marginBottom:"2px" }}>
              {resolvedBranchName} / {NAV.find(n=>n.id===nav)?.label}
            </div>
            <div style={{ fontSize:"18px", fontWeight:"800", color:T.text }}>{NAV.find(n=>n.id===nav)?.label}</div>
          </div>

          <div style={{ display:"flex", gap:"10px", alignItems:"center" }}>
            <div style={{ display:"flex", background:T.surfaceRaised, border:`1px solid ${T.border}`, borderRadius:"8px", overflow:"hidden" }}>
              {RANGES.map(r => (
                <button key={r} onClick={() => setRange(r)} style={{
                  padding:"7px 14px", border:"none", cursor:"pointer", fontFamily:"inherit",
                  fontSize:"11px", letterSpacing:"0.5px", transition:"all 0.15s",
                  background: range===r ? theme.primaryDim : "transparent",
                  color: range===r ? theme.primary : T.textMuted,
                  fontWeight: range===r ? "600" : "400",
                }}>{r.charAt(0).toUpperCase()+r.slice(1)}</button>
              ))}
            </div>
            <input type="date" style={{ ...mkInput(), fontSize:"11px" }} value={fromDate} onChange={e=>setFromDate(e.target.value)} title="From Date" />
            <span style={{ color:T.textMuted }}>→</span>
            <input type="date" style={{ ...mkInput(), fontSize:"11px" }} value={toDate} onChange={e=>setToDate(e.target.value)} title="To Date" />
            <ThemeModeDock variant="inline" />
          </div>
        </div>

        {/* Page content */}
        <div ref={contentScrollRef} style={{ flex:1, minWidth:0, minHeight:0, overflowY:"auto", overscrollBehavior:"contain", padding:"26px 28px" }}>
          {nav==="overview"   && <OverviewView />}
          {nav==="patients"   && <PatientListView data={patients}  exportFile={`all_patients_${resolvedBranchKey}_${range}`}  title="All Patients" />}
          {nav==="cash"       && <PatientListView data={cashPats}  exportFile={`cash_patients_${resolvedBranchKey}_${range}`} title="Cash Patients" />}
          {nav==="records"    && RecordsView()}
          {nav==="financials"      && <FinancialsView />}
          {nav==="print_approvals" && <PrintApprovalsView />}
          {nav==="employees"  && <EmployeesView />}
          {nav==="doctors"    && (
            <DoctorsView
              doctors={doctors}
              addDoctor={addDoctor}
              removeDoctor={removeDoctor}
              theme={theme}
              T={T}
              mkBtn={mkBtn}
              mkInput={mkInput}
            />
          )}
        </div>
      </div>

      {/* ── Employee Modal ───────────────────────────────────────────────── */}
      {modal==="emp" && (
        <div
          style={{ position:"fixed", inset:0, background:"rgba(3,8,18,0.72)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(8px)" }}
          onClick={() => setModal(null)}
        >
          <div
            style={{ background:T.surface, border:`1px solid ${T.borderLight}`, borderRadius:"18px", padding:"32px", width:"520px", maxHeight:"88vh", overflowY:"auto", boxShadow:`0 30px 80px rgba(0,0,0,0.55), 0 0 0 1px ${theme.primary}24` }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"24px" }}>
              <div>
                <div style={{ fontSize:"11px", letterSpacing:"0.18em", color:theme.primary, textTransform:"uppercase", marginBottom:"6px", fontWeight:"700" }}>{resolvedBranchName}</div>
                <div style={{ fontSize:"28px", fontWeight:"800", color:T.text, lineHeight:1.1 }}>Add Employee</div>
                <div style={{ fontSize:"13px", color:T.textSub, marginTop:"6px" }}>Create a receptionist account for this branch.</div>
              </div>
              <button type="button" style={{ ...mkBtn("ghost",theme), padding:"8px 11px" }} onClick={() => setModal(null)}>✕</button>
            </div>

            <form onSubmit={addEmployee}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px 18px" }}>
                <div>
                  <label style={{ display:"block", fontSize:"12px", fontWeight:"700", color:T.textSub, marginBottom:"7px" }}>Full Name</label>
                  <input style={fi} value={empForm.name} onChange={e => updateEmpField("name", e.target.value)} placeholder="Aman Kumar" required />
                </div>
                <div>
                  <label style={{ display:"block", fontSize:"12px", fontWeight:"700", color:T.textSub, marginBottom:"7px" }}>Username</label>
                  <input style={fi} value={empForm.username} onChange={e => updateEmpField("username", e.target.value)} placeholder="aman.kumar" required />
                </div>
                <div>
                  <label style={{ display:"block", fontSize:"12px", fontWeight:"700", color:T.textSub, marginBottom:"7px" }}>Employee ID</label>
                  <input style={{ ...fi, fontFamily:UI_MONO_STACK }} value={empForm.employeeId} onChange={e => updateEmpField("employeeId", e.target.value)} placeholder="Auto-generated" readOnly />
                </div>
                <div>
                  <label style={{ display:"block", fontSize:"12px", fontWeight:"700", color:T.textSub, marginBottom:"7px" }}>Email</label>
                  <input type="email" style={fi} value={empForm.email} onChange={e => updateEmpField("email", e.target.value)} placeholder="aman@sangihospital.com" required />
                </div>
                <div>
                  <label style={{ display:"block", fontSize:"12px", fontWeight:"700", color:T.textSub, marginBottom:"7px" }}>Phone</label>
                  <input style={fi} value={empForm.phone} onChange={e => updateEmpField("phone", e.target.value)} placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label style={{ display:"block", fontSize:"12px", fontWeight:"700", color:T.textSub, marginBottom:"7px" }}>Role</label>
                  <div style={{ ...fi, display:"flex", alignItems:"center", gap:"8px", cursor:"default", userSelect:"none" }}>
                    <span style={{ width:"8px", height:"8px", borderRadius:"50%", background:theme.primary, flexShrink:0 }} />
                    <span style={{ color:T.text, fontWeight:"600" }}>Receptionist</span>
                  </div>
                </div>
                <div>
                  <label style={{ display:"block", fontSize:"12px", fontWeight:"700", color:T.textSub, marginBottom:"7px" }}>Password</label>
                  <input type="password" style={fi} value={empForm.password} onChange={e => updateEmpField("password", e.target.value)} placeholder="Create a password" required />
                </div>
                <div>
                  <label style={{ display:"block", fontSize:"12px", fontWeight:"700", color:T.textSub, marginBottom:"7px" }}>Confirm Password</label>
                  <input type="password" style={fi} value={empForm.confirmPassword} onChange={e => updateEmpField("confirmPassword", e.target.value)} placeholder="Repeat the password" required />
                </div>
              </div>

              {empError && <div style={{ color:T.danger, fontSize:"12px", marginTop:"12px" }}>{empError}</div>}

              <div style={{ display:"flex", gap:"10px", justifyContent:"flex-end", marginTop:"24px", paddingTop:"18px", borderTop:`1px solid ${T.border}` }}>
                <button type="button" style={mkBtn("ghost",theme)} onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" style={mkBtn("primary",theme)}>Create Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        *::-webkit-scrollbar { width:5px; height:5px }
        *::-webkit-scrollbar-track { background:transparent }
        *::-webkit-scrollbar-thumb { background:${T.border}; border-radius:10px }
        *::-webkit-scrollbar-thumb:hover { background:${T.borderLight} }
        tr:hover td { background:${T.surfaceRaised}22 }
      `}</style>
    </div>
  );
}
