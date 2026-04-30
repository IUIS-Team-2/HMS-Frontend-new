// ============================================================
// mockApiService.js
// Drop-in replacement for src/services/apiService.js
// Returns mock data — no backend needed.
//
// USAGE: In src/services/apiService.js, swap the export:
//   import { mockApiService as apiService } from './mockApiService';
//   export { apiService };
//
// Or for a single toggle at the top of apiService.js:
//   const USE_MOCK = true;
// ============================================================

import {
  MOCK_PATIENTS,
  MOCK_BILLS,
  MOCK_REPORTS,
  MOCK_DISCHARGES,
  MOCK_NURSING,
  MOCK_OPD,
  MOCK_INTIMATIONS,
  MOCK_QUERIES,
  MOCK_USERS,
} from "../data/mockdata";

// ─── Helpers ──────────────────────────────────────────────────

const delay = (ms = 300) => new Promise(res => setTimeout(res, ms));

// Convert flat MOCK_PATIENTS into the nested shape App.jsx expects:
// { uhid, branch_location, admissions: [{ admNo, discharge, services, billing, ... }] }
function toDbShape(flatPatient) {
  const {
    uhid, admNo, branch, patientName, age, gender, phone,
    doa, dod, expectedDod, ward, bed, doctor, diagnosis,
    status, insuranceType, tpaId, address, bloodGroup,
    referredBy, depositPaid, totalBill, balance,
  } = flatPatient;

  const branchCode = branch?.includes("Laxmi") ? "LNM" : "RYM";

  const bill = MOCK_BILLS.find(b => b.admNo === admNo);
  const reports = MOCK_REPORTS.filter(r => r.uhid === uhid);
  const discharge = MOCK_DISCHARGES.find(d => d.admNo === admNo);
  const nursing = MOCK_NURSING.filter(n => n.admNo === admNo);

  return {
    uhid,
    patientName,
    age,
    gender,
    phone,
    address,
    bloodGroup,
    branch_location: branchCode,
    insuranceType,
    tpaId,
    referredBy,
    admissions: [
      {
        admNo,
        admissionType: ward === "Emergency" ? "Emergency" : "IPD",
        dateTime: doa,
        status,
        ward,
        bed,
        doctor,
        diagnosis,
        discharge: {
          doa,
          dod,
          expectedDod,
          diagnosis,
          conditionAtDischarge: discharge?.conditionAtDischarge || "",
          followUpDate: discharge?.followUpDate || "",
          instructions: discharge?.instructions || "",
          tpaDocs: discharge?.tpaDocs || [],
        },
        services: reports.map((r, i) => ({
          id:       `SVC-${uhid}-${i}`,
          category: r.type,
          name:     r.subType,
          qty:      1,
          rate:     0,
          date:     r.date,
          notes:    r.findings || "",
        })),
        billing: bill
          ? {
              billId:      bill.billId,
              billDate:    bill.billDate,
              subtotal:    bill.subtotal,
              discount:    bill.discount,
              totalAmount: bill.totalAmount,
              paidAmount:  bill.paidAmount,
              balance:     bill.balance,
              paymentMode: bill.paymentMode,
              billType:    insuranceType?.toLowerCase().includes("cash") ? "cash" : "cashless",
              printStatus: "NONE",
              items:       bill.items,
            }
          : {
              billId:      null,
              billDate:    null,
              subtotal:    totalBill || 0,
              discount:    0,
              totalAmount: totalBill || 0,
              paidAmount:  depositPaid || 0,
              balance:     balance || 0,
              paymentMode: insuranceType || "Cash",
              billType:    insuranceType?.toLowerCase().includes("cash") ? "cash" : "cashless",
              printStatus: "NONE",
              items:       [],
            },
        nursing,
        medicalHistory: {
          previousDiagnosis:  diagnosis || "",
          pastSurgeries:      "",
          currentMedications: "",
          treatingDoctor:     doctor || "",
          knownAllergies:     "",
          chronicConditions:  "",
          familyHistory:      "",
          smokingStatus:      "",
          alcoholUse:         "",
          notes:              "",
        },
      },
    ],
  };
}

const _db = MOCK_PATIENTS.map(toDbShape);

// ─── Mock Service Master ──────────────────────────────────────

const MOCK_SERVICE_MASTER = [
  { id: "SM001", category: "Room",       name: "General Ward (per day)",    rate: 800  },
  { id: "SM002", category: "Room",       name: "Private Room (per day)",    rate: 3000 },
  { id: "SM003", category: "Room",       name: "ICU (per day)",             rate: 8000 },
  { id: "SM004", category: "Doctor",     name: "Doctor Visit",              rate: 600  },
  { id: "SM005", category: "Nursing",    name: "Nursing Charges (per day)", rate: 200  },
  { id: "SM006", category: "Pharmacy",   name: "Pharmacy",                  rate: 0    },
  { id: "SM007", category: "Pathology",  name: "Blood CBC",                 rate: 350  },
  { id: "SM008", category: "Pathology",  name: "HbA1c",                     rate: 800  },
  { id: "SM009", category: "Pathology",  name: "Lipid Profile",             rate: 700  },
  { id: "SM010", category: "Radiology",  name: "X-Ray",                     rate: 400  },
  { id: "SM011", category: "Radiology",  name: "CT Scan",                   rate: 4500 },
  { id: "SM012", category: "Radiology",  name: "MRI",                       rate: 7500 },
  { id: "SM013", category: "Radiology",  name: "Ultrasound (USG)",          rate: 1200 },
  { id: "SM014", category: "Procedure",  name: "Minor Surgical Procedure",  rate: 5000 },
  { id: "SM015", category: "Procedure",  name: "Major Surgical Procedure",  rate: 25000},
  { id: "SM016", category: "OPD",        name: "OPD Consultation",          rate: 500  },
];

// ─── In-memory state (mutations stay alive during the session) ─

let _patients = JSON.parse(JSON.stringify(_db));
let _nextUhid = 1000;

// ─── mockApiService ────────────────────────────────────────────

export const mockApiService = {

  // ── Auth ────────────────────────────────────────────────────────
  // LoginPage decodes data.access as a JWT — we build a fake one here
  async login(usernameOrEmail, password) {
    await delay();
    const needle = String(usernameOrEmail).toLowerCase().trim();
    const user = MOCK_USERS.find(u => {
      const pw      = u.password === password;
      const byEmail = u.email.toLowerCase() === needle;
      const byName  = u.name.toLowerCase().replace(/\s+/g, "") === needle.replace(/\s+/g, "");
      const byId    = u.id.toLowerCase() === needle;
      return pw && (byEmail || byName || byId);
    });
    if (!user) throw new Error("Invalid credentials");

    // Build a fake JWT that LoginPage can atob-decode
    // LoginPage reads: payload.role, payload.name, payload.branch, payload.username, payload.access_scope
    const branchMap = {
      "Laxmi Nagar Branch": "LNM",
      "Dwarka Branch":      "RYM",
      "All":                "ALL",
    };
    const branchCode = user.branch === "All" || !user.branch ? "ALL" : (branchMap[user.branch] || "LNM");

    const payload = {
      username:     user.email,
      name:         user.name,
      role:         user.role,
      branch:       branchCode,
      access_scope: branchCode === "ALL" ? "all_hospitals" : "single_hospital",
      exp:          Math.floor(Date.now() / 1000) + 86400,
    };

    // Build a proper base64url-encoded fake JWT (header.payload.sig)
    const b64 = (obj) => btoa(JSON.stringify(obj))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

    const fakeJwt = `${b64({ alg: "HS256", typ: "JWT" })}.${b64(payload)}.mock_signature`;

    return { access: fakeJwt };
  },

  // ── Patients ──────────────────────────────────────────────────
  async getPatients() {
    await delay();
    return JSON.parse(JSON.stringify(_patients));
  },

  async registerPatient(patientData) {
    await delay(400);
    const branchCode = patientData.locId === "laxmi" ? "LNM" : "RYM";
    const newUhid = `${branchCode}-${++_nextUhid}`;
    const newAdmNo = `ADM/2026/${_nextUhid}`;
    const now = new Date().toISOString();

    const newRecord = {
      uhid: newUhid,
      branch_location: branchCode,
      ...patientData,
      admissions: [
        {
          admNo: newAdmNo,
          admissionType: patientData.admissionType || "IPD",
          dateTime: now,
          status: "Admitted",
          discharge: { doa: now },
          services: [],
          billing: {
            billType: "cash",
            printStatus: "NONE",
            subtotal: 0, discount: 0, totalAmount: 0,
            paidAmount: 0, balance: 0,
          },
          medicalHistory: {},
        },
      ],
    };
    _patients.unshift(newRecord);
    return newRecord;
  },

  async updatePatient(uhid, data) {
    await delay();
    _patients = _patients.map(p =>
      p.uhid === uhid ? { ...p, ...data } : p
    );
    return { success: true };
  },

  async newAdmission(uhid, admissionType = "IPD") {
    await delay();
    const p = _patients.find(x => x.uhid === uhid);
    if (!p) throw new Error("Patient not found");
    const newAdmNo = `ADM/2026/${Date.now()}`;
    const now = new Date().toISOString();
    const adm = {
      admNo: newAdmNo,
      admissionType,
      dateTime: now,
      status: "Admitted",
      discharge: { doa: now },
      services: [],
      billing: {
        billType: "cash",
        printStatus: "NONE",
        subtotal: 0, discount: 0, totalAmount: 0,
        paidAmount: 0, balance: 0,
      },
      medicalHistory: {},
    };
    p.admissions.push(adm);
    return { admNo: newAdmNo };
  },

  // ── Medical History ───────────────────────────────────────────
  async updateMedicalHistory(uhid, admNo, data) {
    await delay();
    const p = _patients.find(x => x.uhid === uhid);
    if (p) {
      const a = p.admissions.find(x => x.admNo === admNo);
      if (a) a.medicalHistory = data;
    }
    return { success: true };
  },

  // ── Discharge ────────────────────────────────────────────────
  async dischargePatient(uhid, admNo, dischargeData) {
    await delay();
    const p = _patients.find(x => x.uhid === uhid);
    if (p) {
      const a = p.admissions.find(x => x.admNo === admNo);
      if (a) { a.discharge = dischargeData; a.status = "Discharged"; }
    }
    return { success: true };
  },

  async setExpectedDod(uhid, admNo, date) {
    await delay();
    const p = _patients.find(x => x.uhid === uhid);
    if (p) {
      const a = p.admissions.find(x => x.admNo === admNo);
      if (a) {
        if (!a.discharge) a.discharge = {};
        a.discharge.expectedDod = date;
      }
    }
    return { success: true };
  },

  // ── Services / Billing ────────────────────────────────────────
  async saveServicesBulk(uhid, admNo, services) {
    await delay();
    const p = _patients.find(x => x.uhid === uhid);
    if (p) {
      const a = p.admissions.find(x => x.admNo === admNo);
      if (a) a.services = services;
    }
    return { services };
  },

  async updateBilling(uhid, admNo, billingData) {
    await delay();
    const p = _patients.find(x => x.uhid === uhid);
    if (p) {
      const a = p.admissions.find(x => x.admNo === admNo);
      if (a) a.billing = billingData;
    }
    return { success: true };
  },

  async getServiceMaster() {
    await delay();
    return JSON.parse(JSON.stringify(MOCK_SERVICE_MASTER));
  },

  // ── Print Requests ────────────────────────────────────────────
  async getPendingPrints() {
    await delay();
    // Return patients that have a billing.printStatus === 'PENDING'
    return _patients.filter(p =>
      p.admissions?.some(a => a.billing?.printStatus === "PENDING")
    );
  },

  async requestPrint(uhid, admNo) {
    await delay();
    const p = _patients.find(x => x.uhid === uhid);
    if (p) {
      const a = p.admissions.find(x => x.admNo === admNo);
      if (a && a.billing) {
        a.billing.printStatus = "PENDING";
        a.billing.printRequestedAt = new Date().toISOString();
      }
    }
    return { success: true };
  },

  async resolvePrint(uhid, admNo, action) {
    await delay();
    const p = _patients.find(x => x.uhid === uhid);
    if (p) {
      const a = p.admissions.find(x => x.admNo === admNo);
      if (a && a.billing) a.billing.printStatus = action; // "APPROVED" | "REJECTED"
    }
    return { success: true };
  },

  // ── OPD ───────────────────────────────────────────────────────
  async getOpdRecords(branchCode) {
    await delay();
    return branchCode
      ? MOCK_OPD.filter(o => o.branch?.includes(branchCode === "LNM" ? "Laxmi" : "Dwarka"))
      : [...MOCK_OPD];
  },

  // ── Intimations ───────────────────────────────────────────────
  async getIntimations() {
    await delay();
    return [...MOCK_INTIMATIONS];
  },

  // ── Queries ───────────────────────────────────────────────────
  async getQueries() {
    await delay();
    return [...MOCK_QUERIES];
  },
};