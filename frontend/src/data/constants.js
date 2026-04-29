export const T = {
  primary: "#0B2545",
  primaryDark: "#071830",
  primaryMid: "#1A4A7A",
  primaryLight: "#2563A8",
  accent: "#38BDF8",
  accentDark: "#0EA5E9",
  accentDeep: "#0284C7",
  accentLight: "#BAE6FD",
  bgPage: "#EBF6FD",
  bgTint: "#E0F2FE",
  bgTint2: "#BAE6FD",
  white: "#FFFFFF",
  offwhite: "#F0F9FF",
  border: "#BFDBEE",
  borderHov: "#90C4E4",
  text: "#0B2040",
  textMid: "#1E4976",
  textMuted: "#4A7FA5",
  textLight: "#88B4CC",
  red: "#DC2626",
  redTint: "#FEF2F2",
  green: "#059669",
  greenTint: "#ECFDF5",
  greenBorder: "#A7F3D0",
  amber: "#D97706",
  amberTint: "#FEF3C7",
  shadow: "0 1px 4px rgba(11,37,69,.07), 0 6px 20px rgba(11,37,69,.06)",
  shadowMd: "0 4px 12px rgba(11,37,69,.1), 0 12px 32px rgba(11,37,69,.08)",
  shadowLg: "0 8px 24px rgba(11,37,69,.14), 0 24px 56px rgba(11,37,69,.1)"
};

export const LOCATIONS = [
  { id: "laxmi", name: "Lakshmi Nagar", city: "Mathura", short: "LNM", color: "#0EA5E9" },
  { id: "raya",  name: "Raya",          city: "Mathura", short: "RYM", color: "#7C3AED" }
];

export const BLOOD_GRP   = ["A+", "A−", "B+", "B−", "O+", "O−", "AB+", "AB−"];
export const GENDERS     = ["Male", "Female", "Other"];
export const MARITAL     = ["Single", "Married", "Divorced", "Widowed"];
export const DISC_ST     = ["Recovered", "Referred", "LAMA (Left Against Medical Advice)", "Death"];
export const PAY_MODES   = ["Cash", "UPI / QR code", "Credit card", "Debit card", "Net banking", "NEFT / RTGS", "Cheque", "Insurance (TPA)", "Partial payment"];

export const TPA_LIST = [
  "Aditya Birla Health Insurance", "Bajaj Allianz General Insurance", "Care Health Insurance (formerly Religare)",
  "Cholamandalam MS General Insurance", "Edelweiss General Insurance", "Future Generali India Insurance",
  "Go Digit General Insurance", "HDFC ERGO General Insurance", "ICICI Lombard General Insurance",
  "IFFCO Tokio General Insurance", "Kotak Mahindra General Insurance", "Liberty General Insurance",
  "ManipalCigna Health Insurance", "Niva Bupa Health Insurance", "National Insurance Company",
  "New India Assurance", "Oriental Insurance Company", "Reliance General Insurance",
  "SBI General Insurance", "Star Health & Allied Insurance", "Tata AIG General Insurance",
  "United India Insurance", "Acko General Insurance", "LIC of India", "HDFC Life Insurance"
];

export const TPA_CARD_TYPES = ["ECHS", "ESI / ESIC", "FCI", "Ayushman Bharat", "Northern Railway"];

export const MASTER_ROOMS = [
  { title: "GENERAL WARD",   code: "RM01", rate: 1500 },
  { title: "SEMI PVT WARD",  code: "RM02", rate: 3000 }
];

export const MASTER_CONSULTANTS = [
  { title: "DR. NEERAJ JAI BHAGWAN SHARMA (UROLOGY)",   code: "CN003", rate: 700 },
  { title: "DR. G. A. NOMANI (CARDIOLOGY)",             code: "CN003", rate: 700 },
  { title: "DR. RAJENDER SINGLA (NEUROLOGY)",           code: "CN003", rate: 700 },
  { title: "DR. SURENDRA SHARMA (SURGEON)",             code: "CN003", rate: 700 },
  { title: "DR. HARENDRA SINGH (ORTHO)",                code: "CN003", rate: 700 },
  { title: "DR. R. K. MITTAL (CHEST PHYSICIAN)",        code: "CN003", rate: 700 }
];

export const MASTER_SERVICES = {
  "RADIOLOGY": [
    { title: "USG ABDOMEN",                              code: "RI020", rate: 544  },
    { title: "CT Scan Whole Abdomen With Contrast",      code: "RI070", rate: 3519 },
    { title: "CT Scan Whole Abdomen Without Contrast",   code: "RI069", rate: 2346 },
    { title: "NCCT Head/Brain",                          code: "RI062", rate: 704  },
    { title: "HRCT CHEST",                               code: "RI065", rate: 1360 },
    { title: "2D ECHO",                                  code: "RI001", rate: 1003 },
    { title: "ECG",                                      code: "CI001", rate: 119  }
  ],
  "ICU CARE": [
    { title: "ICU",                                      code: "CC001", rate: 5400 },
    { title: "OXYGEN CHARGES",                           code: "CC002", rate: 68   },
    { title: "Ventilator charges (Per day)",              code: "CC003", rate: 2040 }
  ],
  "GENERAL SERVICES": [
    { title: "DRESSING",                                 code: "GP001", rate: 204  },
    { title: "NEBULISATION CHARGES",                     code: "CC012", rate: 34   },
    { title: "PHYSIOTHERAPY",                            code: "PT005", rate: 204  }
  ]
};

export const DEPARTMENTS = [
  "General Medicine","Surgery","Orthopaedics","Gynaecology","Paediatrics",
  "Cardiology","ENT","Emergency","ICU","OPD","IPD","Pharmacy","Billing","Radiology","Pathology"
];

export const NAV_PAGES = [
  { id: "patient",   label: "Patient Info",     icon: "person"  },
  { id: "medical",   label: "Medical History",  icon: "pulse"   },
  { id: "discharge", label: "Discharge Details",icon: "bed"     },
  { id: "services",  label: "Service Charges",  icon: "pulse"   },
  { id: "summary",   label: "Summary",          icon: "receipt" }
];

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN CREDENTIALS
// ─────────────────────────────────────────────────────────────────────────────
//
//  HOW THE ROLE SYSTEM WORKS:
//  ──────────────────────────
//  superadmin  →  Sees all hospitals, all data, creates admins, approves print bills
//  admin       →  Sees their assigned branch only, creates depts & dept users
//  opd/ipd/billing/pharmacy/doctor/nursing/lab/radiology/reception
//              →  Dept-level users created by admin in the Admin Panel
//                 They see only their branch data via the Staff Portal
//
//  DEPT USERS are stored in localStorage under "hms_dept_users"
//  ADMIN users are stored in localStorage under "hms_admins"
//  Both can be created from the Admin Panel (SuperAdmin → Create Admin,
//  Admin → Dept Users page).
//
//  Below USERS is the SEED — used only if localStorage is empty.
// ─────────────────────────────────────────────────────────────────────────────
