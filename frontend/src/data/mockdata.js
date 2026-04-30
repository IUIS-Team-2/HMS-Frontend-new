// ============================================================
// HMS FRONTEND — COMPREHENSIVE MOCK DATA
// Covers: Billing, BranchAdmin, Doctor, HOD, Nursing, OPD,
//         Discharge, Intimation, Management, Query, Search,
//         PatientForm, PatientsHistory, MedicalHistory
// ============================================================

// ─── CONSTANTS ───────────────────────────────────────────────

export const BRANCHES = [
  "Laxmi Nagar Branch",
  "Dwarka Branch",
  "Rohini Branch",
  "Saket Branch",
  "Noida Branch",
];

export const WARDS = ["General", "ICU", "NICU", "Private", "Semi-Private", "Emergency", "Maternity"];

export const INSURANCE_TYPES = ["ECHS", "ECI", "PCI", "Ayushman Bharat", "Northern Railways", "TPA", "Cash", "CGHS"];

export const TPA_DOCS = [
  { id: "final_bill",        label: "Final Bill",          ico: "🧾" },
  { id: "prescription",      label: "Prescription",        ico: "📋" },
  { id: "pharmacy_bill",     label: "Pharmacy Bill",       ico: "💊" },
  { id: "pathology_bill",    label: "Pathology Bill",      ico: "🔬" },
  { id: "radiology_bill",    label: "Radiology Bill",      ico: "🩻" },
  { id: "discharge_summary", label: "Discharge Summary",   ico: "📄" },
  { id: "reports",           label: "Reports",             ico: "📁" },
  { id: "admission_note",    label: "Admission Note",      ico: "📝" },
];

export const LAB_REPORT_TYPES   = ["Pathology", "Biochemistry", "Haematology", "Microbiology", "Serology", "Histopathology", "Cytology"];
export const RADIO_REPORT_TYPES = ["X-Ray", "CT Scan", "MRI", "Ultrasound (USG)", "Doppler", "PET Scan", "Mammography"];
export const ALL_REPORT_TYPES   = ["All", ...LAB_REPORT_TYPES, ...RADIO_REPORT_TYPES];

export const DOCTORS = [
  { id: "D001", name: "Dr. Meena Kapoor",   dept: "General Medicine",   qualification: "MBBS, MD",        phone: "9810001111", available: true },
  { id: "D002", name: "Dr. Rajesh Sharma",  dept: "Cardiology",         qualification: "MBBS, DM (Card)", phone: "9810002222", available: true },
  { id: "D003", name: "Dr. Sunita Verma",   dept: "Gynaecology",        qualification: "MBBS, MS (OBG)",  phone: "9810003333", available: false },
  { id: "D004", name: "Dr. Anil Gupta",     dept: "Orthopaedics",       qualification: "MBBS, MS (Orth)", phone: "9810004444", available: true },
  { id: "D005", name: "Dr. Priya Nair",     dept: "Paediatrics",        qualification: "MBBS, MD (Peds)", phone: "9810005555", available: true },
  { id: "D006", name: "Dr. Suresh Pillai",  dept: "Neurology",          qualification: "MBBS, DM (Neuro)",phone: "9810006666", available: false },
  { id: "D007", name: "Dr. Kavita Singh",   dept: "Dermatology",        qualification: "MBBS, MD (Derm)", phone: "9810007777", available: true },
  { id: "D008", name: "Dr. Mohan Das",      dept: "Urology",            qualification: "MBBS, MCh (Uro)", phone: "9810008888", available: true },
];

export const NURSES = [
  { id: "N001", name: "Sister Rekha Devi",    ward: "General",    shift: "Morning",  phone: "9820001111" },
  { id: "N002", name: "Sister Pooja Yadav",   ward: "ICU",        shift: "Morning",  phone: "9820002222" },
  { id: "N003", name: "Sister Anita Rawat",   ward: "NICU",       shift: "Evening",  phone: "9820003333" },
  { id: "N004", name: "Sister Sunita Bhatia", ward: "Private",    shift: "Night",    phone: "9820004444" },
  { id: "N005", name: "Sister Meena Joshi",   ward: "Emergency",  shift: "Morning",  phone: "9820005555" },
];

// ─── PATIENTS ─────────────────────────────────────────────────

export const MOCK_PATIENTS = [
  {
    uhid:         "LNM-0041",
    admNo:        "ADM/2026/041",
    branch:       "Laxmi Nagar Branch",
    patientName:  "Rajan Sharma",
    age:          54,
    gender:       "Male",
    phone:        "9876543210",
    doa:          "2026-04-10T09:00:00",
    dod:          "2026-04-16T12:00:00",
    expectedDod:  "2026-04-17T00:00:00",
    ward:         "General",
    bed:          "G-12",
    doctor:       "Dr. Meena Kapoor",
    diagnosis:    "Type 2 Diabetes with Hypertension",
    status:       "Discharged",
    insuranceType:"CGHS",
    tpaId:        "TPA-CGHS-00412",
    address:      "45, Vikas Marg, New Delhi - 110092",
    bloodGroup:   "B+",
    referredBy:   "OPD",
    depositPaid:  15000,
    totalBill:    42600,
    balance:      27600,
  },
  {
    uhid:         "DWK-0088",
    admNo:        "ADM/2026/088",
    branch:       "Dwarka Branch",
    patientName:  "Sunita Mehta",
    age:          38,
    gender:       "Female",
    phone:        "9123456789",
    doa:          "2026-04-20T11:30:00",
    dod:          null,
    expectedDod:  "2026-05-02T00:00:00",
    ward:         "Maternity",
    bed:          "M-04",
    doctor:       "Dr. Sunita Verma",
    diagnosis:    "Normal Pregnancy — 38 weeks",
    status:       "Admitted",
    insuranceType:"Ayushman Bharat",
    tpaId:        "AB-DEL-88210",
    address:      "Plot 22, Sector 7, Dwarka, New Delhi - 110075",
    bloodGroup:   "O+",
    referredBy:   "OPD",
    depositPaid:  5000,
    totalBill:    18900,
    balance:      13900,
  },
  {
    uhid:         "RHN-0015",
    admNo:        "ADM/2026/015",
    branch:       "Rohini Branch",
    patientName:  "Arjun Bhatia",
    age:          67,
    gender:       "Male",
    phone:        "9988776655",
    doa:          "2026-04-25T08:00:00",
    dod:          null,
    expectedDod:  "2026-05-05T00:00:00",
    ward:         "ICU",
    bed:          "ICU-03",
    doctor:       "Dr. Rajesh Sharma",
    diagnosis:    "Acute Myocardial Infarction",
    status:       "Critical",
    insuranceType:"ECHS",
    tpaId:        "ECHS-RHN-00150",
    address:      "House 7, Sector 11, Rohini, Delhi - 110085",
    bloodGroup:   "A-",
    referredBy:   "Emergency",
    depositPaid:  50000,
    totalBill:    210000,
    balance:      160000,
  },
  {
    uhid:         "SKT-0033",
    admNo:        "ADM/2026/033",
    branch:       "Saket Branch",
    patientName:  "Priya Nair",
    age:          29,
    gender:       "Female",
    phone:        "8800112233",
    doa:          "2026-04-28T15:00:00",
    dod:          null,
    expectedDod:  "2026-05-01T00:00:00",
    ward:         "Semi-Private",
    bed:          "SP-08",
    doctor:       "Dr. Anil Gupta",
    diagnosis:    "Appendicitis — Post-operative",
    status:       "Admitted",
    insuranceType:"Cash",
    tpaId:        null,
    address:      "C-14, Malviya Nagar, New Delhi - 110017",
    bloodGroup:   "AB+",
    referredBy:   "OPD",
    depositPaid:  25000,
    totalBill:    55000,
    balance:      30000,
  },
  {
    uhid:         "NOI-0102",
    admNo:        "ADM/2026/102",
    branch:       "Noida Branch",
    patientName:  "Mohit Agarwal",
    age:          45,
    gender:       "Male",
    phone:        "9090909090",
    doa:          "2026-04-22T10:00:00",
    dod:          "2026-04-29T11:00:00",
    expectedDod:  "2026-04-30T00:00:00",
    ward:         "Private",
    bed:          "P-02",
    doctor:       "Dr. Suresh Pillai",
    diagnosis:    "Ischemic Stroke — Left MCA territory",
    status:       "Discharged",
    insuranceType:"Northern Railways",
    tpaId:        "NR-NOI-10200",
    address:      "B-201, Sector 62, Noida - 201301",
    bloodGroup:   "O-",
    referredBy:   "Emergency",
    depositPaid:  30000,
    totalBill:    98000,
    balance:      68000,
  },
  {
    uhid:         "LNM-0055",
    admNo:        "ADM/2026/055",
    branch:       "Laxmi Nagar Branch",
    patientName:  "Kavya Iyer",
    age:          8,
    gender:       "Female",
    phone:        "9711223344",
    doa:          "2026-04-29T07:30:00",
    dod:          null,
    expectedDod:  "2026-05-03T00:00:00",
    ward:         "NICU",
    bed:          "N-01",
    doctor:       "Dr. Priya Nair",
    diagnosis:    "Febrile Seizures",
    status:       "Admitted",
    insuranceType:"PCI",
    tpaId:        "PCI-LNM-05500",
    address:      "202, Nirman Vihar, Delhi - 110092",
    bloodGroup:   "B-",
    referredBy:   "OPD",
    depositPaid:  10000,
    totalBill:    22000,
    balance:      12000,
  },
];

// ─── OPD RECORDS ──────────────────────────────────────────────

export const MOCK_OPD = [
  {
    opdId:       "OPD/2026/0881",
    branch:      "Laxmi Nagar Branch",
    date:        "2026-04-30",
    patientName: "Deepak Tiwari",
    age:         42,
    gender:      "Male",
    phone:       "9312345678",
    doctor:      "Dr. Mohan Das",
    dept:        "Urology",
    token:       14,
    status:      "Waiting",
    fee:         500,
    complaint:   "Burning sensation during urination",
  },
  {
    opdId:       "OPD/2026/0882",
    branch:      "Laxmi Nagar Branch",
    date:        "2026-04-30",
    patientName: "Geeta Rani",
    age:         55,
    gender:      "Female",
    phone:       "9412345678",
    doctor:      "Dr. Kavita Singh",
    dept:        "Dermatology",
    token:       15,
    status:      "In Consultation",
    fee:         500,
    complaint:   "Chronic itching — arms and neck",
  },
  {
    opdId:       "OPD/2026/0879",
    branch:      "Laxmi Nagar Branch",
    date:        "2026-04-30",
    patientName: "Ramesh Kumar",
    age:         60,
    gender:      "Male",
    phone:       "9512345678",
    doctor:      "Dr. Rajesh Sharma",
    dept:        "Cardiology",
    token:       12,
    status:      "Completed",
    fee:         700,
    complaint:   "Chest pain on exertion",
  },
];

// ─── BILLING RECORDS ──────────────────────────────────────────

export const MOCK_BILLS = [
  {
    billId:      "BILL/2026/0412",
    admNo:       "ADM/2026/041",
    uhid:        "LNM-0041",
    patientName: "Rajan Sharma",
    branch:      "Laxmi Nagar Branch",
    billDate:    "2026-04-16",
    items: [
      { desc: "Room Charges (6 days × ₹800)",  amount: 4800 },
      { desc: "Doctor Visit Charges",            amount: 3600 },
      { desc: "Nursing Charges",                 amount: 1200 },
      { desc: "Pharmacy",                        amount: 8900 },
      { desc: "Pathology",                       amount: 5200 },
      { desc: "Radiology (X-Ray × 2)",           amount: 1800 },
      { desc: "Procedure Charges",               amount: 12000 },
      { desc: "Miscellaneous",                   amount: 500 },
      { desc: "GST (5%)",                        amount: 4600 },
    ],
    subtotal:    38000,
    discount:    2000,
    totalAmount: 42600,
    paidAmount:  15000,
    balance:     27600,
    paymentMode: "CGHS",
    status:      "Partial",
  },
  {
    billId:      "BILL/2026/0102",
    admNo:       "ADM/2026/102",
    uhid:        "NOI-0102",
    patientName: "Mohit Agarwal",
    branch:      "Noida Branch",
    billDate:    "2026-04-29",
    items: [
      { desc: "Room Charges — Private (7 days × ₹3000)", amount: 21000 },
      { desc: "ICU Charges (2 days × ₹8000)",            amount: 16000 },
      { desc: "Doctor Visit Charges",                     amount: 9000 },
      { desc: "Pharmacy",                                 amount: 18000 },
      { desc: "CT Scan Brain",                            amount: 7500 },
      { desc: "MRI Brain",                                amount: 12000 },
      { desc: "Physiotherapy (5 sessions)",               amount: 5000 },
      { desc: "Miscellaneous",                            amount: 1000 },
      { desc: "GST (5%)",                                 amount: 8500 },
    ],
    subtotal:    93500,
    discount:    2500,
    totalAmount: 98000,
    paidAmount:  30000,
    balance:     68000,
    paymentMode: "Northern Railways",
    status:      "Partial",
  },
];

// ─── LAB / RADIOLOGY REPORTS ──────────────────────────────────

export const MOCK_REPORTS = [
  {
    reportId:    "RPT/2026/LAB/0210",
    uhid:        "LNM-0041",
    patientName: "Rajan Sharma",
    type:        "Pathology",
    subType:     "Biochemistry",
    date:        "2026-04-12",
    orderedBy:   "Dr. Meena Kapoor",
    status:      "Completed",
    findings:    "HbA1c: 8.2% (High). FBS: 186 mg/dL. Serum Creatinine: 1.1 mg/dL. Lipid profile within normal limits.",
    reportedBy:  "Dr. Sandeep Khanna (Pathologist)",
  },
  {
    reportId:    "RPT/2026/RAD/0088",
    uhid:        "RHN-0015",
    patientName: "Arjun Bhatia",
    type:        "Radiology",
    subType:     "ECG",
    date:        "2026-04-25",
    orderedBy:   "Dr. Rajesh Sharma",
    status:      "Completed",
    findings:    "ST elevation in leads II, III, aVF. Q waves in inferior leads. Consistent with acute inferior MI.",
    reportedBy:  "Dr. Rajesh Sharma (Cardiologist)",
  },
  {
    reportId:    "RPT/2026/RAD/0103",
    uhid:        "NOI-0102",
    patientName: "Mohit Agarwal",
    type:        "Radiology",
    subType:     "MRI",
    date:        "2026-04-23",
    orderedBy:   "Dr. Suresh Pillai",
    status:      "Completed",
    findings:    "Acute infarct in left MCA territory. No haemorrhagic transformation. No mass effect.",
    reportedBy:  "Dr. Lata Mishra (Radiologist)",
  },
  {
    reportId:    "RPT/2026/LAB/0055",
    uhid:        "LNM-0055",
    patientName: "Kavya Iyer",
    type:        "Pathology",
    subType:     "Haematology",
    date:        "2026-04-29",
    orderedBy:   "Dr. Priya Nair",
    status:      "Pending",
    findings:    null,
    reportedBy:  null,
  },
];

// ─── DISCHARGE RECORDS ────────────────────────────────────────

export const MOCK_DISCHARGES = [
  {
    dischargeId:  "DC/2026/041",
    admNo:        "ADM/2026/041",
    uhid:         "LNM-0041",
    patientName:  "Rajan Sharma",
    branch:       "Laxmi Nagar Branch",
    doa:          "2026-04-10",
    dod:          "2026-04-16",
    doctor:       "Dr. Meena Kapoor",
    diagnosis:    "Type 2 Diabetes with Hypertension",
    conditionAtDischarge: "Stable",
    followUpDate: "2026-04-30",
    instructions: "Continue Metformin 500mg BD, Amlodipine 5mg OD. Low salt, low sugar diet. Monitor BP daily.",
    tpaDocs: ["final_bill", "prescription", "pharmacy_bill", "pathology_bill", "discharge_summary"],
    billCleared:  false,
  },
  {
    dischargeId:  "DC/2026/102",
    admNo:        "ADM/2026/102",
    uhid:         "NOI-0102",
    patientName:  "Mohit Agarwal",
    branch:       "Noida Branch",
    doa:          "2026-04-22",
    dod:          "2026-04-29",
    doctor:       "Dr. Suresh Pillai",
    diagnosis:    "Ischemic Stroke — Left MCA territory",
    conditionAtDischarge: "Improved — residual left hemiparesis",
    followUpDate: "2026-05-06",
    instructions: "Aspirin 75mg OD, Atorvastatin 40mg OD. Continue physiotherapy. Strict BP control.",
    tpaDocs: ["final_bill", "prescription", "pharmacy_bill", "radiology_bill", "discharge_summary", "reports"],
    billCleared:  false,
  },
];

// ─── INTIMATION / INSURANCE INTIMATIONS ──────────────────────

export const MOCK_INTIMATIONS = [
  {
    intimationId: "INT/2026/088",
    admNo:        "ADM/2026/088",
    uhid:         "DWK-0088",
    patientName:  "Sunita Mehta",
    branch:       "Dwarka Branch",
    insuranceType:"Ayushman Bharat",
    tpaId:        "AB-DEL-88210",
    intimationDate: "2026-04-20",
    estimatedCost:  18900,
    approvedAmount: 15000,
    status:         "Approved",
    remarks:        "Pre-auth approved for normal delivery package.",
  },
  {
    intimationId: "INT/2026/015",
    admNo:        "ADM/2026/015",
    uhid:         "RHN-0015",
    patientName:  "Arjun Bhatia",
    branch:       "Rohini Branch",
    insuranceType:"ECHS",
    tpaId:        "ECHS-RHN-00150",
    intimationDate: "2026-04-25",
    estimatedCost:  210000,
    approvedAmount: null,
    status:         "Pending",
    remarks:        "Sent to ECHS regional office. Awaiting approval.",
  },
];

// ─── NURSING RECORDS ──────────────────────────────────────────

export const MOCK_NURSING = [
  {
    recordId:    "NRS/2026/041/01",
    admNo:       "ADM/2026/041",
    patientName: "Rajan Sharma",
    ward:        "General",
    bed:         "G-12",
    shift:       "Morning",
    nurse:       "Sister Rekha Devi",
    date:        "2026-04-14",
    vitals: {
      bp:          "138/88 mmHg",
      pulse:       "82 bpm",
      temperature: "98.6 °F",
      spo2:        "97%",
      rbs:         "164 mg/dL",
    },
    medications: [
      { name: "Metformin 500mg", route: "Oral", time: "08:00", given: true },
      { name: "Amlodipine 5mg",  route: "Oral", time: "08:00", given: true },
      { name: "Insulin 8 units", route: "SC",   time: "07:30", given: true },
    ],
    notes: "Patient cooperative. No complaints. Blood sugar slightly elevated.",
  },
  {
    recordId:    "NRS/2026/015/01",
    admNo:       "ADM/2026/015",
    patientName: "Arjun Bhatia",
    ward:        "ICU",
    bed:         "ICU-03",
    shift:       "Morning",
    nurse:       "Sister Pooja Yadav",
    date:        "2026-04-30",
    vitals: {
      bp:          "158/96 mmHg",
      pulse:       "92 bpm",
      temperature: "99.1 °F",
      spo2:        "94%",
      rbs:         "N/A",
    },
    medications: [
      { name: "Aspirin 75mg",          route: "Oral",  time: "08:00", given: true },
      { name: "Heparin 5000 units",    route: "IV",    time: "06:00", given: true },
      { name: "Atorvastatin 40mg",     route: "Oral",  time: "20:00", given: false },
    ],
    notes: "Patient on continuous cardiac monitoring. BP elevated. Informed Dr. Sharma.",
  },
];

// ─── QUERIES ──────────────────────────────────────────────────

export const MOCK_QUERIES = [
  {
    queryId:     "QRY/2026/0041",
    branch:      "Laxmi Nagar Branch",
    date:        "2026-04-30",
    callerName:  "Anita Sharma",
    callerPhone: "9811223344",
    relation:    "Daughter",
    patientUhid: "LNM-0041",
    patientName: "Rajan Sharma",
    queryType:   "Billing",
    message:     "Enquiring about outstanding balance and TPA claim status for CGHS.",
    status:      "Open",
    assignedTo:  "Billing Desk — LNM",
    resolvedAt:  null,
  },
  {
    queryId:     "QRY/2026/0033",
    branch:      "Saket Branch",
    date:        "2026-04-29",
    callerName:  "Rahul Nair",
    callerPhone: "9822334455",
    relation:    "Husband",
    patientUhid: "SKT-0033",
    patientName: "Priya Nair",
    queryType:   "Clinical",
    message:     "Wants update on recovery post appendectomy and expected discharge date.",
    status:      "Resolved",
    assignedTo:  "Dr. Anil Gupta",
    resolvedAt:  "2026-04-29T16:00:00",
  },
];

// ─── MEDICAL HISTORY ──────────────────────────────────────────

export const MOCK_MEDICAL_HISTORY = {
  "LNM-0041": {
    uhid:        "LNM-0041",
    patientName: "Rajan Sharma",
    allergies:   ["Sulpha drugs", "Penicillin"],
    chronicConditions: ["Type 2 Diabetes Mellitus", "Essential Hypertension"],
    surgicalHistory:   ["Appendectomy (2009)", "Cataract Surgery Right Eye (2021)"],
    familyHistory:     ["Father — CAD", "Mother — Diabetes"],
    admissions: [
      { admNo: "ADM/2024/088", doa: "2024-08-10", dod: "2024-08-16", diagnosis: "Diabetic Ketoacidosis", doctor: "Dr. Meena Kapoor" },
      { admNo: "ADM/2026/041", doa: "2026-04-10", dod: "2026-04-16", diagnosis: "Type 2 Diabetes with Hypertension", doctor: "Dr. Meena Kapoor" },
    ],
  },
  "RHN-0015": {
    uhid:        "RHN-0015",
    patientName: "Arjun Bhatia",
    allergies:   [],
    chronicConditions: ["Hypertension (10 years)", "Hyperlipidaemia"],
    surgicalHistory:   ["CABG (2019)"],
    familyHistory:     ["Father — MI", "Brother — Hypertension"],
    admissions: [
      { admNo: "ADM/2019/204", doa: "2019-03-05", dod: "2019-03-18", diagnosis: "Coronary Artery Disease — CABG", doctor: "Dr. Rajesh Sharma" },
      { admNo: "ADM/2026/015", doa: "2026-04-25", dod: null,          diagnosis: "Acute Myocardial Infarction",    doctor: "Dr. Rajesh Sharma" },
    ],
  },
};

// ─── BRANCH ADMIN STATS ───────────────────────────────────────

export const MOCK_BRANCH_STATS = {
  "Laxmi Nagar Branch": {
    totalBeds:    120,
    occupiedBeds: 87,
    availableBeds: 33,
    admissionsToday: 6,
    dischargeToday:  4,
    opdToday:       52,
    revenue: {
      today:    148000,
      thisMonth: 4200000,
      target:    5000000,
    },
    pendingBills: 23,
    pendingTPA:   8,
  },
  "Dwarka Branch": {
    totalBeds:    80,
    occupiedBeds: 61,
    availableBeds: 19,
    admissionsToday: 4,
    dischargeToday:  2,
    opdToday:       38,
    revenue: {
      today:    96000,
      thisMonth: 2800000,
      target:    3500000,
    },
    pendingBills: 14,
    pendingTPA:   5,
  },
};

// ─── MANAGEMENT / HOD STATS ───────────────────────────────────

export const MOCK_MANAGEMENT_STATS = {
  totalBranches: 5,
  totalPatients: 412,
  totalAdmitted: 289,
  totalOPDToday: 248,
  totalRevenue: {
    today:     644000,
    thisMonth: 18600000,
    target:    22000000,
    ytd:       74000000,
  },
  topDepartments: [
    { dept: "General Medicine", patients: 94 },
    { dept: "Cardiology",       patients: 68 },
    { dept: "Gynaecology",      patients: 55 },
    { dept: "Orthopaedics",     patients: 42 },
    { dept: "Paediatrics",      patients: 38 },
  ],
  pendingInsuranceClaims: 42,
  claimsValue: 3800000,
};

// ─── USERS / AUTH ─────────────────────────────────────────────

export const MOCK_USERS = [
  { id: "U001", name: "Admin User",        email: "admin@hms.in",      role: "admin",         branch: "All",                  password: "admin123"   },
  { id: "U002", name: "Priyanka Agarwal",  email: "billing@lnm.hms.in",role: "billing",        branch: "Laxmi Nagar Branch",  password: "billing123" },
  { id: "U003", name: "Dr. Meena Kapoor",  email: "drmeena@hms.in",    role: "doctor",         branch: "Laxmi Nagar Branch",  password: "doctor123"  },
  { id: "U004", name: "Sister Rekha Devi", email: "rekha@hms.in",      role: "nurse",          branch: "Laxmi Nagar Branch",  password: "nurse123"   },
  { id: "U005", name: "HOD Cardiology",    email: "hod.cardio@hms.in", role: "hod",            branch: "Rohini Branch",        password: "hod123"     },
  { id: "U006", name: "Branch Manager",    email: "mgr@dwk.hms.in",    role: "branch_admin",   branch: "Dwarka Branch",        password: "mgr123"     },
  { id: "U007", name: "OPD Receptionist",  email: "opd@lnm.hms.in",    role: "opd",            branch: "Laxmi Nagar Branch",  password: "opd123"     },
];

// ─── HELPER: get patient by UHID ──────────────────────────────

export function getPatientByUhid(uhid) {
  return MOCK_PATIENTS.find((p) => p.uhid === uhid) || null;
}

export function getPatientsByBranch(branch) {
  return MOCK_PATIENTS.filter((p) => p.branch === branch);
}

export function getActivePatients() {
  return MOCK_PATIENTS.filter((p) => p.status === "Admitted" || p.status === "Critical");
}

export function getBillByAdmNo(admNo) {
  return MOCK_BILLS.find((b) => b.admNo === admNo) || null;
}

export function getReportsByUhid(uhid) {
  return MOCK_REPORTS.filter((r) => r.uhid === uhid);
}