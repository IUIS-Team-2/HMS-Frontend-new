
import { useState, useEffect } from "react";
import { apiService } from "../services/apiService";
import ThemeModeDock from "../components/ui/ThemeModeDock";
import {
  LayoutDashboard,
  Users,
  Wallet,
  Landmark,
  FileText,
  BarChart3,
  UserRound,
} from "lucide-react";

const UI_FONT_STACK = "var(--ui-font-sans)";
const UI_MONO_STACK = "var(--ui-font-mono)";
const EMPTY_EMP_FORM = {
  name: "",
  username: "",
  email: "",
  phone: "",
  role: "",
  employeeId: "",
  designation: "",
  departmentName: "",
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
  { id: "overview",   label: "Overview",          icon: LayoutDashboard },
  { id: "patients",   label: "All Patients",      icon: Users },
  { id: "cash",       label: "Cash Patients",     icon: Wallet },
  { id: "cashless",   label: "Cashless Patients", icon: Landmark },
  { id: "records",    label: "Patient Records",   icon: FileText },
  { id: "financials", label: "Financials",        icon: BarChart3 },
  { id: "employees",  label: "Employees",         icon: UserRound },
];

const RECORD_TYPES = [
  { id: "discharge_summary", label: "Discharge Summary" },
  { id: "reports",           label: "Reports"           },
  { id: "medicines",         label: "Medicines"         },
  { id: "admission_note",    label: "Admission Note"    },
  { id: "medical_history",   label: "Medical History"   },
];

const RANGES = ["daily", "weekly", "monthly", "yearly"];

function isPathologyCategory(category = "") {
  const normalized = String(category).toLowerCase();
  return ["path", "lab", "bio", "haem", "micro", "sero", "histo", "radiology", "x-ray", "scan", "echo", "usg", "mri", "ct"].some((key) => normalized.includes(key));
}

function isMedicineCategory(category = "") {
  const normalized = String(category).toLowerCase();
  return ["med", "pharma", "drug"].some((key) => normalized.includes(key));
}

function admissionGross(admission) {
  const services = admission?.services || [];
  const serviceTotal = services
    .filter((service) => !isPathologyCategory(service.svcCat || service.type) && !isMedicineCategory(service.svcCat || service.type))
    .reduce((sum, service) => (
    sum + Number(service.svcTot ?? service.total ?? ((service.svcRate ?? service.rate ?? 0) * (service.svcQty ?? service.qty ?? 1)))
  ), 0);
  const labTotal = (admission?.labReports || []).reduce((sum, report) => sum + Number(report.amount || 0), 0);
  const pharmacyTotal = (admission?.pharmacyRecords || []).reduce((sum, record) => (
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
  const reports = Array.isArray(admission?.labReports) ? admission.labReports : [];
  const pharmacyRecords = Array.isArray(admission?.pharmacyRecords) ? admission.pharmacyRecords : [];
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
          medicine: record.item || record.medicine_name || "Medicine",
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
  const branchCode = resolvedBranchKey === "raya" ? "RYM" : "LNM";
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
      const paymentModeRaw = String(patient.payMode || admission?.billing?.paymentMode || admission?.billing?.bill_type || "").toLowerCase();
      const paymentMode = paymentModeRaw.includes("cashless") ? "cashless" : "cash";
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
  const cashlessRows = patientRows.filter((row) => row.paymentMode === "cashless");
  const cashTxns = cashRows.map((row) => ({
    patientId: row.id,
    patientName: row.name,
    date: row.admissionDate,
    amount: admissionGross(row.admObj),
    description: row.doctor || "Hospital Charges",
    receivedBy: "Billing Desk",
    status: admissionDue(row.admObj) > 0 ? "pending" : "paid",
  }));
  const cashlessTxns = cashlessRows.map((row) => ({
    patientId: row.id,
    patientName: row.name,
    date: row.admissionDate,
    amount: admissionGross(row.admObj),
    paymentType: row.paymentType || "Cashless",
    authCode: row.patientObj?.tpaPanelCardNo || row.patientObj?.tpaCard || "—",
    insurerOrBank: row.patientObj?.tpa || row.patientObj?.cashlessType || "—",
    status: admissionDue(row.admObj) > 0 ? "pending" : "paid",
  }));

  return {
    cashTotal: cashTxns.reduce((sum, row) => sum + row.amount, 0),
    cashlessTotal: cashlessTxns.reduce((sum, row) => sum + row.amount, 0),
    tpaTotal: cashlessTxns.filter((row) => String(row.paymentType).toUpperCase() === "TPA").reduce((sum, row) => sum + row.amount, 0),
    cardTotal: cashlessTxns.filter((row) => String(row.paymentType).toUpperCase() === "CARD").reduce((sum, row) => sum + row.amount, 0),
    grandTotal: [...cashTxns, ...cashlessTxns].reduce((sum, row) => sum + row.amount, 0),
    collectedToday: [...cashTxns, ...cashlessTxns]
      .filter((row) => row.date === new Date().toISOString().slice(0, 10))
      .reduce((sum, row) => sum + row.amount, 0),
    pendingDues: patientRows.reduce((sum, row) => sum + admissionDue(row.admObj), 0),
    txnCount: cashTxns.length + cashlessTxns.length,
    cashTxns,
    cashlessTxns,
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

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BranchAdminDashboard({
  currentUser,
  db,
  locId,
  onLogout,
  branchId   = "raya",
  branchName = "",
  adminName  = "Admin",
}) {
  const resolvedBranchKey  = locId || currentUser?.branch || branchId;
  const theme              = BRANCH_THEMES[resolvedBranchKey] || BRANCH_THEMES.default;
  const resolvedBranchName = branchName || theme.label;
  const resolvedAdminName  = currentUser?.name || adminName;

  const [nav,      setNav]      = useState("overview");
  const [range,    setRange]    = useState("monthly");
  const [fromDate, setFromDate] = useState("");
  const [toDate,   setToDate]   = useState("");

  const [overview,     setOverview]     = useState(null);
  const [patients,     setPatients]     = useState([]);
  const [cashPats,     setCashPats]     = useState([]);
  const [cashlessPats, setCashlessPats] = useState([]);
  const [financials,   setFinancials]   = useState(null);
  const [employees,    setEmployees]    = useState([]);

  const [selPatient, setSelPatient] = useState(null);
  const [recTab,     setRecTab]     = useState("discharge_summary");
  const [records,    setRecords]    = useState([]);

  const [search,    setSearch]    = useState("");
  const [statusFil, setStatusFil] = useState("all");

  const [empForm, setEmpForm] = useState(EMPTY_EMP_FORM);
  const [empError, setEmpError] = useState("");
  const [modal,   setModal]   = useState(null);

  // ─── Load mock data ───────────────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    const loadLiveData = async () => {
      setSearch("");
      setStatusFil("all");
      if (nav !== "records") setSelPatient(null);

      const branchPatients = Array.isArray(db?.[resolvedBranchKey]) ? db[resolvedBranchKey] : [];
      const mappedPatients = mapLiveBranchPatients(branchPatients);
      if (!active) return;

      setPatients(mappedPatients);
      setCashPats(mappedPatients.filter(p => p.paymentMode === "cash"));
      setCashlessPats(mappedPatients.filter(p => p.paymentMode === "cashless"));
      setFinancials(buildFinancialData(mappedPatients));

      try {
        const users = await apiService.getUsers();
        if (!active) return;
        const branchUsers = mapBranchUsers(users, resolvedBranchKey);
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
  }, [nav, range, fromDate, toDate, db, resolvedBranchKey]);

  useEffect(() => {
    if (nav === "records" && selPatient) {
      setRecords(selPatient.records?.[recTab] || []);
    }
  }, [selPatient, recTab, nav]);

  // ─── Filter helpers ───────────────────────────────────────────────────────
  const filterPatients = (list) => list.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFil === "all" || p.status === statusFil;
    return matchSearch && matchStatus;
  });

  // ─── Mutations (frontend-only) ────────────────────────────────────────────
  async function addEmployee(e) {
    e.preventDefault();
    setEmpError("");
    if (!empForm.name || !empForm.username || !empForm.role || !empForm.password) {
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
        branch: resolvedBranchKey === "raya" ? "RYM" : "LNM",
        password: empForm.password,
        confirm_password: empForm.confirmPassword,
      });
      const users = await apiService.getUsers();
      const branchUsers = mapBranchUsers(users, resolvedBranchKey);
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

  function TableShell({ title, count, action, children }) {
    return (
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:"10px", overflow:"hidden", marginBottom:"22px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 18px", borderBottom:`1px solid ${T.border}`, background:T.surfaceRaised }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <span style={{ fontSize:"10px", letterSpacing:"2px", color:T.textSub, textTransform:"uppercase" }}>{title}</span>
            {count !== undefined && <span style={{ fontSize:"10px", color:T.textMuted, background:T.surface, border:`1px solid ${T.border}`, padding:"1px 8px", borderRadius:"20px" }}>{count}</span>}
          </div>
          {action}
        </div>
        <div style={{ overflowX:"auto" }}>{children}</div>
      </div>
    );
  }

  function FilterBar({ data, onExport, exportLabel="Export Excel" }) {
    return (
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
  }

  // ─── Views ────────────────────────────────────────────────────────────────
  function OverviewView() {
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
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"14px", marginBottom:"14px" }}>
          {[
            ["Cash Revenue",     "cashRevenue",     T.success,     "₹"],
            ["Cashless Revenue", "cashlessRevenue", T.purple,      "₹"],
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
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"14px", marginBottom:"14px" }}>
          {[
            ["Cash Total",     "cashTotal",     T.success, "₹"],
            ["Cashless Total", "cashlessTotal", T.purple,  "₹"],
            ["TPA Total",      "tpaTotal",      T.blue,    "₹"],
            ["Card Total",     "cardTotal",     T.warning, "₹"],
          ].map(([l,k,c,p]) => <StatCard key={k} label={l} value={financials?.[k]} color={c} prefix={p} />)}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"14px", marginBottom:"24px" }}>
          {[
            ["Grand Total",     "grandTotal",     theme.primary, "₹"],
            ["Collected Today", "collectedToday", T.success,     "₹"],
            ["Pending Dues",    "pendingDues",    T.danger,      "₹"],
            ["Transactions",    "txnCount",       T.blue        ],
          ].map(([l,k,c,p]) => <StatCard key={k} label={l} value={financials?.[k]} color={c} prefix={p||""} />)}
        </div>

        <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:"16px" }}>
          <button style={mkBtn("excel", theme)} onClick={() => {
            const rows = [
              ...(financials?.cashTxns||[]).map(r=>({...r, __mode:"CASH"})),
              ...(financials?.cashlessTxns||[]).map(r=>({...r, __mode:"CASHLESS"})),
            ];
            exportExcel(rows, `financials_${resolvedBranchKey}_${range}`);
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

        <TableShell title="Cashless Transactions — TPA / Card" count={financials?.cashlessTxns?.length}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"12px" }}>
            <thead><tr>{["Patient ID","Name","Date","Amount","Mode","Auth Code","Insurer / Bank","Status"].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
            <tbody>
              {!(financials?.cashlessTxns?.length)
                ? <EmptyRow cols={8} msg="NO CASHLESS TRANSACTIONS" />
                : financials.cashlessTxns.map((r,i) => (
                  <tr key={i}>
                    <Td><span style={{color:T.textMuted,fontSize:"10px"}}>#{r.patientId}</span></Td>
                    <Td primary>{r.patientName}</Td>
                    <Td>{r.date}</Td>
                    <Td hi={T.purple} style={{fontWeight:"700"}}>₹{r.amount?.toLocaleString()}</Td>
                    <Td><span style={mkBadge(r.paymentType)}>{r.paymentType}</span></Td>
                    <Td>{r.authCode||"—"}</Td>
                    <Td>{r.insurerOrBank||"—"}</Td>
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
    if (!selPatient) return (
      <div style={{ textAlign:"center", padding:"80px 20px" }}>
        <div style={{ fontSize:"40px", marginBottom:"16px", color:T.textMuted }}>◈</div>
        <div style={{ fontSize:"11px", letterSpacing:"3px", color:T.textMuted, marginBottom:"12px" }}>NO PATIENT SELECTED</div>
        <p style={{ color:T.textSub, fontSize:"13px", maxWidth:"360px", margin:"0 auto 24px" }}>
          Open All Patients, Cash Patients, or Cashless Patients and click "View" on any row.
        </p>
        <button style={mkBtn("dim", theme)} onClick={() => setNav("patients")}>→ Go to Patients</button>
      </div>
    );

    const cols = {
      discharge_summary:["Date","Summary","Doctor","Next Visit","Instructions"],
      reports:          ["Date","Report Type","Result","Lab / Tech","Doctor","File"],
      medicines:        ["Date","Medicine","Dosage","Frequency","Duration","Prescribed By"],
      admission_note:   ["Date","Note","Doctor","Diagnosis","Plan"],
      medical_history:  ["Date","Condition","Treatment","Doctor","Notes"],
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
          <div style={{ marginLeft:"auto", display:"flex", gap:"8px" }}>
            <button style={{ ...mkBtn("excel", theme), fontSize:"11px" }}
              onClick={() => exportExcel(records.map(r=>({...r, patientId:selPatient.id, patientName:selPatient.name})), `${recTab}_${selPatient.id}`)}>
              ↓ Excel
            </button>
            <button style={{ ...mkBtn("ghost", theme), padding:"8px 12px" }} onClick={() => setSelPatient(null)}>✕</button>
          </div>
        </div>

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

        <TableShell title={RECORD_TYPES.find(r=>r.id===recTab)?.label} count={records.length}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"12px" }}>
            <thead><tr>{(cols[recTab]||[]).map(h=><Th key={h}>{h}</Th>)}</tr></thead>
            <tbody>
              {!records.length
                ? <EmptyRow cols={(cols[recTab]||[]).length} msg={`NO ${recTab.replace(/_/g," ").toUpperCase()} RECORDS`} />
                : records.map((rec,i) => (
                  <tr key={i}>
                    <Td>{rec.date}</Td>
                    {recTab==="discharge_summary" && <><Td style={{maxWidth:"180px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{rec.summary}</Td><Td>{rec.doctor}</Td><Td>{rec.nextVisit}</Td><Td>{rec.instructions}</Td></>}
                    {recTab==="reports" && <><Td primary>{rec.reportType}</Td><Td>{rec.result}</Td><Td>{rec.lab}</Td><Td>{rec.doctor}</Td><Td>{rec.fileUrl ? <a href={rec.fileUrl} target="_blank" rel="noreferrer" style={{color:theme.primary}}>↗</a> : "—"}</Td></>}
                    {recTab==="medicines" && <><Td primary>{rec.medicine}</Td><Td>{rec.dosage}</Td><Td>{rec.frequency}</Td><Td>{rec.duration}</Td><Td>{rec.prescribedBy}</Td></>}
                    {recTab==="admission_note" && <><Td style={{maxWidth:"180px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{rec.note}</Td><Td>{rec.doctor}</Td><Td>{rec.diagnosis}</Td><Td>{rec.plan}</Td></>}
                    {recTab==="medical_history" && <><Td primary>{rec.condition}</Td><Td>{rec.treatment}</Td><Td>{rec.doctor}</Td><Td style={{maxWidth:"160px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{rec.notes}</Td></>}
                  </tr>
                ))}
            </tbody>
          </table>
        </TableShell>
      </>
    );
  }

  function EmployeesView() {
    const roleColor = { Doctor:T.blue, Nurse:T.success, Admin:T.warning, Billing:T.purple, HOD:theme.primary };
    return (
      <>
        <div style={{ display:"flex", justifyContent:"flex-end", gap:"10px", marginBottom:"20px" }}>
          <button style={mkBtn("excel", theme)} onClick={() => exportExcel(employees.map(e=>({ "Emp ID":e.employeeId, Name:e.name, Email:e.email, Phone:e.phone, Role:e.role, Designation:e.designation, Department:e.departmentName, Joined:e.joinedDate, Branch:resolvedBranchName })), `employees_${resolvedBranchKey}`)}>↓ Excel</button>
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
            <thead><tr>{["Emp ID","Name","Designation","Email","Phone","Role","Department","Joined","Action"].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
            <tbody>
              {!employees.length
                ? <EmptyRow cols={9} msg="NO EMPLOYEES" />
                : employees.map(emp => (
                  <tr key={emp.id}>
                    <Td><span style={{color:T.textMuted,fontSize:"10px"}}>{emp.employeeId}</span></Td>
                    <Td primary>{emp.name}</Td>
                    <Td>{emp.designation||"—"}</Td>
                    <Td>{emp.email}</Td>
                    <Td>{emp.phone}</Td>
                    <Td>
                      <span style={{ background:(roleColor[emp.role]||T.blue)+"20", color:roleColor[emp.role]||T.blue, border:`1px solid ${(roleColor[emp.role]||T.blue)}40`, padding:"2px 9px", borderRadius:"20px", fontSize:"10px", fontWeight:"600" }}>
                        {emp.role}
                      </span>
                    </Td>
                    <Td>{emp.departmentName}</Td>
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
  const fs = { ...mkInput(), width:"100%", cursor:"pointer" };

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
        <div style={{ flex:1, minWidth:0, minHeight:0, overflowY:"auto", overscrollBehavior:"contain", padding:"26px 28px" }}>
          {nav==="overview"   && <OverviewView />}
          {nav==="patients"   && <PatientListView data={patients}     exportFile={`all_patients_${resolvedBranchKey}_${range}`}      title="All Patients" />}
          {nav==="cash"       && <PatientListView data={cashPats}     exportFile={`cash_patients_${resolvedBranchKey}_${range}`}     title="Cash Patients" />}
          {nav==="cashless"   && <PatientListView data={cashlessPats} exportFile={`cashless_patients_${resolvedBranchKey}_${range}`} title="Cashless Patients — TPA / Card" />}
          {nav==="records"    && <RecordsView />}
          {nav==="financials" && <FinancialsView />}
          {nav==="employees"  && <EmployeesView />}
        </div>
      </div>

      {/* ── Employee Modal ───────────────────────────────────────────────── */}
      {modal==="emp" && (
        <div
          style={{ position:"fixed", inset:0, background:"rgba(3,8,18,0.72)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(8px)" }}
          onClick={() => setModal(null)}
        >
          <div
            style={{ background:T.surface, border:`1px solid ${T.borderLight}`, borderRadius:"18px", padding:"32px", width:"560px", maxHeight:"88vh", overflowY:"auto", boxShadow:`0 30px 80px rgba(0,0,0,0.55), 0 0 0 1px ${theme.primary}24` }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"24px" }}>
              <div>
                <div style={{ fontSize:"11px", letterSpacing:"0.18em", color:theme.primary, textTransform:"uppercase", marginBottom:"6px", fontWeight:"700" }}>{resolvedBranchName}</div>
                <div style={{ fontSize:"28px", fontWeight:"800", color:T.text, lineHeight:1.1 }}>Add Employee</div>
                <div style={{ fontSize:"13px", color:T.textSub, marginTop:"6px" }}>Create a staff account for this branch with the same form behavior and styling used across the admin dashboards.</div>
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
                  <input style={{ ...fi, fontFamily:UI_MONO_STACK }} value={empForm.employeeId} onChange={e => updateEmpField("employeeId", e.target.value)} placeholder="EMP-001" />
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
                  <select style={fs} value={empForm.role} onChange={e => updateEmpField("role", e.target.value)} required>
                    <option value="">Select role</option>
                    {["Billing","Receptionist","HOD","OPD","Intimation","Query","Uploading"].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display:"block", fontSize:"12px", fontWeight:"700", color:T.textSub, marginBottom:"7px" }}>Designation</label>
                  <input style={fi} value={empForm.designation} onChange={e => updateEmpField("designation", e.target.value)} placeholder="Senior Consultant" />
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

              <div style={{ marginTop:"16px" }}>
                <label style={{ display:"block", fontSize:"12px", fontWeight:"700", color:T.textSub, marginBottom:"7px" }}>Department Name</label>
                <input style={fi} value={empForm.departmentName} onChange={e => updateEmpField("departmentName", e.target.value)} placeholder="Cardiology, ICU" required />
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
