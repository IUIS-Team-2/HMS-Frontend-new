export function isPathologyCategory(category = "") {
  const n = String(category).toLowerCase();
  return ["path","lab","bio","haem","micro","sero","histo","radiology","x-ray","scan","echo","usg","mri","ct"].some(k => n.includes(k));
}

export function isMedicineCategory(category = "") {
  const n = String(category).toLowerCase();
  return ["med","pharma","drug","pharmacy","tablet","injection","iv fluid","consumable"].some(k => n.includes(k));
}

export function normalizeReportName(raw = "") {
  const s = String(raw).trim();
  const MAP = {
    "complete blood count":"CBC","cbc":"CBC","liver function test":"LFT","lft":"LFT",
    "kidney function test":"KFT","kft":"KFT","renal function test":"RFT","rft":"RFT",
    "blood sugar fasting":"BSF","blood sugar pp":"BSPP","hba1c":"HbA1c","lipid profile":"Lipid Profile",
    "thyroid profile":"TFT","tft":"TFT","urine routine":"Urine R/M","urine routine & microscopy":"Urine R/M",
    "serum creatinine":"S.Creatinine","serum electrolytes":"Electrolytes","c-reactive protein":"CRP","crp":"CRP",
    "esr":"ESR","pt/inr":"PT/INR","x-ray chest":"X-Ray Chest","usg abdomen":"USG Abdomen",
    "ct scan":"CT Scan","mri brain":"MRI Brain","echo":"Echo","ecg":"ECG","electrocardiogram":"ECG",
    "dengue ns1":"Dengue NS1","malaria antigen":"Malaria Ag","hbsag":"HBsAg","anti-hcv":"Anti-HCV",
    "hiv":"HIV I & II","vdrl":"VDRL","widal":"Widal","d-dimer":"D-Dimer","troponin":"Troponin I",
  };
  const key = s.toLowerCase().replace(/\s+/g," ").trim();
  for (const [pattern, label] of Object.entries(MAP)) {
    if (key === pattern || key.startsWith(pattern)) return label;
  }
  if (/^[A-Z0-9]{2,5}$/.test(s)) return s.toUpperCase();
  return s;
}

export function admissionGross(admission) {
  const services      = admission?.services || [];
  const reportRows    = admission?.labReports || admission?.lab_reports || [];
  const pharmacyRows  = admission?.pharmacyRecords || admission?.pharmacy_records || [];
  const serviceTotal  = services
    .filter(s => !isPathologyCategory(s.svcCat || s.type) && !isMedicineCategory(s.svcCat || s.type))
    .reduce((sum, s) => sum + Number(s.svcTot ?? s.total ?? ((s.svcRate ?? s.rate ?? 0) * (s.svcQty ?? s.qty ?? 1))), 0);
  const labTotal      = reportRows.reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const pharmacyTotal = pharmacyRows.reduce((sum, r) => sum + Number(r.amount ?? (Number(r.quantity || 1) * Number(r.rate || 0))), 0);
  const discount      = Number(admission?.billing?.discount || 0);
  return Math.max(0, serviceTotal + labTotal + pharmacyTotal - discount);
}

export function admissionDue(admission) {
  const billing = admission?.billing || {};
  return Math.max(0, admissionGross(admission) - Number(billing.advance || 0) - Number(billing.paidNow || 0));
}

export function mapLiveBranchPatients(patients = []) {
  return patients.flatMap(patient => {
    const admissions = Array.isArray(patient.admissions) ? patient.admissions : [];
    return admissions.map(admission => {
      const discharge      = admission?.discharge || {};
      const paymentModeRaw = String(patient.payMode || patient.pay_mode || patient.payment_mode || admission?.billing?.paymentMode || admission?.billing?.payment_mode || admission?.billing?.bill_type || "").toLowerCase().trim();
      const paymentMode    = paymentModeRaw.includes("cashless") || paymentModeRaw.includes("tpa") || paymentModeRaw.includes("card") || paymentModeRaw.includes("insurance") ? "cashless" : "cash";
      const paymentType    = paymentMode === "cashless" ? (admission?.billing?.insuranceType || patient.cashlessType || (patient.tpa ? "TPA" : (patient.tpaCard || patient.tpaPanelCardNo ? "Card" : ""))) : "";
      return {
        id:            `${patient.uhid}-${admission.admNo}`,
        name:          patient.patientName,
        age:           patient.ageYY || patient.age || "—",
        gender:        patient.gender,
        phone:         patient.phone,
        department:    discharge.department || discharge.wardName || "General",
        doctor:        discharge.doctorName || admission?.medicalHistory?.treatingDoctor || "—",
        admissionDate: (discharge.doa || admission.dateTime || "").slice(0, 10),
        dischargeDate: discharge.dod ? discharge.dod.slice(0, 10) : "",
        paymentMode,
        paymentType,
        status:        discharge.dod ? "discharged" : "admitted",
        uhid:          patient.uhid,
        patientObj:    patient,
        admObj:        admission,
      };
    });
  });
}

export function mapBranchUsers(users = [], resolvedBranchKey = "laxmi") {
  const branchCode = String(resolvedBranchKey || "").toUpperCase() === resolvedBranchKey
    ? resolvedBranchKey
    : resolvedBranchKey === "raya" ? "RYM"
    : resolvedBranchKey === "laxmi" || resolvedBranchKey === "lakshmi" ? "LNM"
    : String(resolvedBranchKey || "").toUpperCase();
  return users
    .filter(u => u.branch === branchCode)
    .map(u => ({
      id:             u.id,
      employeeId:     u.emp_id || u.username,
      username:       u.username,
      name:           `${u.first_name} ${u.last_name}`.trim() || u.username,
      designation:    u.role.replaceAll("_"," ").toUpperCase(),
      email:          u.email || "—",
      phone:          u.phone_number || "—",
      role:           u.role === "admin" ? "Admin" : u.role === "billing" ? "Billing" : u.role === "hod" ? "HOD" : u.role.replaceAll("_"," ").replace(/\b\w/g, ch => ch.toUpperCase()),
      departmentName: u.role.replaceAll("_"," ").toUpperCase(),
      joinedDate:     u.date_joined?.slice(0, 10) || "—",
    }));
}

export function buildOverviewData(patientRows = [], employees = []) {
  const today        = new Date().toISOString().slice(0, 10);
  const totalRevenue = patientRows.reduce((sum, row) => sum + admissionGross(row.admObj), 0);
  const cashRevenue  = patientRows.filter(r => r.paymentMode === "cash").reduce((sum, r) => sum + admissionGross(r.admObj), 0);
  return {
    totalPatients:    patientRows.length,
    admittedToday:    patientRows.filter(r => r.admissionDate === today).length,
    dischargedToday:  patientRows.filter(r => r.dischargeDate === today).length,
    pendingDischarge: patientRows.filter(r => r.status === "admitted").length,
    cashRevenue,
    cashlessRevenue:  totalRevenue - cashRevenue,
    totalRevenue,
    pendingDues:      patientRows.reduce((sum, r) => sum + admissionDue(r.admObj), 0),
    empCount:         employees.length,
    tpaCount:         patientRows.filter(r => String(r.paymentType).toUpperCase() === "TPA").length,
    cardCount:        patientRows.filter(r => String(r.paymentType).toUpperCase() === "CARD").length,
    recentPatients:   patientRows.slice().sort((a, b) => b.admissionDate.localeCompare(a.admissionDate)).slice(0, 8),
  };
}

export function buildFinancialData(patientRows = []) {
  const cashRows = patientRows.filter(r => r.paymentMode === "cash");
  const cashTxns = cashRows.map(row => ({
    patientId:    row.id,
    patientName:  row.name,
    date:         row.admissionDate,
    amount:       admissionGross(row.admObj),
    description:  row.doctor || "Hospital Charges",
    receivedBy:   "Billing Desk",
    status:       admissionDue(row.admObj) > 0 ? "pending" : "paid",
  }));
  return {
    cashTotal:       cashTxns.reduce((s, r) => s + r.amount, 0),
    grandTotal:      cashTxns.reduce((s, r) => s + r.amount, 0),
    collectedToday:  cashTxns.filter(r => r.date === new Date().toISOString().slice(0, 10)).reduce((s, r) => s + r.amount, 0),
    pendingDues:     patientRows.reduce((sum, r) => sum + admissionDue(r.admObj), 0),
    txnCount:        cashTxns.length,
    cashTxns,
  };
}
