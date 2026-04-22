import { useState, useEffect } from "react";
import { apiService } from "../services/apiService";

// ─── MOCK DATA ─────────────────────────────────────────────────────────────────
const BRANCHES = [
  { id: "laxmi", label: "Laxmi Nagar Branch" },
  { id: "raya",  label: "Raya Branch" },
];

const MOCK_PATIENTS = {
  laxmi: [
    {
      uhid: "LNM-0001", admNo: 1, assignedTo: "billing_user",
      patientName: "Rajan Sharma", age: 54, gender: "Male",
      phone: "9876543210", address: "Block A, Laxmi Nagar, Delhi",
      doa: "2025-04-10T09:00", dod: "2025-04-16T12:00",
      ward: "General", bed: "G-12", doctor: "Dr. Meena Kapoor",
      diagnosis: "Type-2 Diabetes", status: "admitted",
      taskStatus: "pending",
      discharge: {
        doa: "2025-04-10T09:00", dod: "2025-04-16T12:00",
        ward: "General", bed: "G-12", doctor: "Dr. Meena Kapoor",
        diagnosis: "Type-2 Diabetes", condition: "Stable",
        instructions: "Low sugar diet, follow up in 2 weeks", notes: ""
      },
      medicalHistory: {
        previousDiagnosis: "Hypertension", pastSurgeries: "Appendectomy 2010",
        currentMedications: "Metformin 500mg", treatingDoctor: "Dr. Meena Kapoor",
        knownAllergies: "Penicillin", chronicConditions: "Diabetes, Hypertension",
        familyHistory: "Father had diabetes", smokingStatus: "Non-smoker",
        alcoholUse: "Occasional", notes: "Patient cooperative"
      },
      services: [
        { id: 1, name: "Room Charges", category: "Ward", qty: 6, rate: 800, amount: 4800 },
        { id: 2, name: "Doctor Visit", category: "Consultation", qty: 3, rate: 500, amount: 1500 },
        { id: 3, name: "IV Fluids", category: "Pharmacy", qty: 4, rate: 120, amount: 480 },
      ],
      pathologyBill: [
        { id: 1, test: "HbA1c", date: "2025-04-11", amount: 350 },
        { id: 2, test: "Lipid Profile", date: "2025-04-12", amount: 500 },
      ],
      medicalBill: [
        { id: 1, item: "Metformin 500mg x30", date: "2025-04-10", amount: 180 },
        { id: 2, item: "Normal Saline 500ml x4", date: "2025-04-11", amount: 200 },
      ],
      billing: { discount: 500, advance: 2000, paymentMode: "Cash", remarks: "" }
    },
    {
      uhid: "LNM-0002", admNo: 1, assignedTo: "billing_user",
      patientName: "Sunita Verma", age: 38, gender: "Female",
      phone: "9123456780", address: "C-45, Preet Vihar, Delhi",
      doa: "2025-04-13T11:30", dod: "",
      ward: "Private", bed: "P-03", doctor: "Dr. Arvind Singh",
      diagnosis: "Viral Fever", status: "admitted",
      taskStatus: "pending",
      discharge: {
        doa: "2025-04-13T11:30", dod: "", ward: "Private", bed: "P-03",
        doctor: "Dr. Arvind Singh", diagnosis: "Viral Fever",
        condition: "", instructions: "", notes: ""
      },
      medicalHistory: {
        previousDiagnosis: "None", pastSurgeries: "None",
        currentMedications: "Paracetamol", treatingDoctor: "Dr. Arvind Singh",
        knownAllergies: "None", chronicConditions: "None",
        familyHistory: "None", smokingStatus: "Non-smoker",
        alcoholUse: "None", notes: ""
      },
      services: [
        { id: 1, name: "Room Charges", category: "Ward", qty: 3, rate: 2000, amount: 6000 },
        { id: 2, name: "Doctor Visit", category: "Consultation", qty: 2, rate: 800, amount: 1600 },
      ],
      pathologyBill: [
        { id: 1, test: "CBC", date: "2025-04-13", amount: 250 },
      ],
      medicalBill: [
        { id: 1, item: "Paracetamol 500mg x20", date: "2025-04-13", amount: 80 },
      ],
      billing: { discount: 0, advance: 5000, paymentMode: "UPI", remarks: "" }
    },
  ],
  raya: [
    {
      uhid: "RYM-0001", admNo: 2, assignedTo: "billing_user",
      patientName: "Mohd. Akhtar", age: 62, gender: "Male",
      phone: "9988776655", address: "Raya Town, Mathura",
      doa: "2025-04-08T08:00", dod: "2025-04-15T10:00",
      ward: "ICU", bed: "ICU-2", doctor: "Dr. Priya Nair",
      diagnosis: "Cardiac Arrest", status: "discharged",
      taskStatus: "submitted",
      discharge: {
        doa: "2025-04-08T08:00", dod: "2025-04-15T10:00",
        ward: "ICU", bed: "ICU-2", doctor: "Dr. Priya Nair",
        diagnosis: "Cardiac Arrest", condition: "Recovering",
        instructions: "Strict bed rest, cardiac diet", notes: "Follow up in 1 week"
      },
      medicalHistory: {
        previousDiagnosis: "Angina", pastSurgeries: "Angioplasty 2018",
        currentMedications: "Aspirin, Statins", treatingDoctor: "Dr. Priya Nair",
        knownAllergies: "None", chronicConditions: "Heart Disease",
        familyHistory: "Father had MI", smokingStatus: "Ex-smoker",
        alcoholUse: "None", notes: "High risk patient"
      },
      services: [
        { id: 1, name: "ICU Charges", category: "Ward", qty: 7, rate: 5000, amount: 35000 },
        { id: 2, name: "Cardiology Consult", category: "Consultation", qty: 5, rate: 1200, amount: 6000 },
        { id: 3, name: "ECG", category: "Procedure", qty: 3, rate: 300, amount: 900 },
        { id: 4, name: "Oxygen Therapy", category: "Procedure", qty: 7, rate: 200, amount: 1400 },
      ],
      pathologyBill: [
        { id: 1, test: "Troponin I", date: "2025-04-08", amount: 800 },
        { id: 2, test: "BNP", date: "2025-04-09", amount: 950 },
        { id: 3, test: "CBC + ESR", date: "2025-04-10", amount: 400 },
      ],
      medicalBill: [
        { id: 1, item: "Aspirin 75mg x30", date: "2025-04-08", amount: 60 },
        { id: 2, item: "Atorvastatin 20mg x30", date: "2025-04-08", amount: 180 },
        { id: 3, item: "Heparin injection x5", date: "2025-04-09", amount: 750 },
      ],
      billing: { discount: 2000, advance: 20000, paymentMode: "Insurance", remarks: "Insurance claim filed" }
    },
  ]
};

// ─── STYLES ────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Sora:wght@400;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0d1117; --surface: #161b22; --surface2: #1c2333; --surface3: #21262d;
    --border: #30363d; --border2: #3d444d; --text: #e6edf3; --text2: #8b949e; --text3: #6e7681;
    --accent: #3fb950; --accent2: #238636; --blue: #388bfd; --blue2: #1f6feb;
    --amber: #d29922; --amberBg: rgba(210,153,34,.12);
    --red: #f85149; --redBg: rgba(248,81,73,.10);
    --purple: #bc8cff; --purpleBg: rgba(188,140,255,.10);
    --radius: 10px; --shadow: 0 4px 24px rgba(0,0,0,.4);
  }
  body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; }
  .bd { min-height: 100vh; display: flex; flex-direction: column; background: var(--bg); }

  /* HEADER */
  .bd-hdr {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 24px; height: 58px;
    background: var(--surface); border-bottom: 1px solid var(--border);
    position: sticky; top: 0; z-index: 100;
  }
  .bd-hdr-l { display: flex; align-items: center; gap: 12px; }
  .bd-logo {
    width: 34px; height: 34px; border-radius: 8px;
    background: linear-gradient(135deg,#238636,#3fb950);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Sora',sans-serif; font-weight: 700; color: #fff; font-size: 13px;
  }
  .bd-title { font-family: 'Sora',sans-serif; font-weight: 700; font-size: 15px; }
  .bd-sub { font-size: 11px; color: var(--text2); }
  .bd-hdr-r { display: flex; align-items: center; gap: 10px; }
  .bd-branch-pill {
    padding: 5px 13px; border-radius: 20px; font-size: 12px; font-weight: 600;
    background: var(--purpleBg); color: var(--purple); border: 1px solid rgba(188,140,255,.25);
    cursor: pointer; transition: .2s; font-family: inherit;
  }
  .bd-branch-pill:hover { background: rgba(188,140,255,.2); }
  .bd-avatar {
    width: 30px; height: 30px; border-radius: 50%;
    background: linear-gradient(135deg,#388bfd,#bc8cff);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; color: #fff; flex-shrink: 0;
  }
  .bd-uname { font-size: 12px; font-weight: 600; }
  .bd-logout {
    padding: 5px 13px; border-radius: 7px; font-size: 12px; font-weight: 600;
    background: var(--redBg); color: var(--red); border: 1px solid rgba(248,81,73,.25);
    cursor: pointer; font-family: inherit; transition: .2s;
  }
  .bd-logout:hover { background: rgba(248,81,73,.2); }

  /* BODY */
  .bd-body { display: flex; flex: 1; }

  /* SIDEBAR */
  .bd-sidebar {
    width: 210px; min-width: 210px; background: var(--surface);
    border-right: 1px solid var(--border); display: flex; flex-direction: column;
    padding: 16px 8px; gap: 2px; position: sticky; top: 58px;
    height: calc(100vh - 58px); overflow-y: auto;
  }
  .sid-lbl { font-size: 10px; font-weight: 700; color: var(--text3); letter-spacing: .08em;
    text-transform: uppercase; padding: 8px 10px 5px; }
  .sid-item {
    display: flex; align-items: center; gap: 9px; padding: 8px 11px;
    border-radius: 7px; cursor: pointer; transition: .14s; font-size: 13px;
    font-weight: 500; color: var(--text2);
  }
  .sid-item:hover { background: var(--surface2); color: var(--text); }
  .sid-item.act { background: rgba(63,185,80,.12); color: var(--accent); font-weight: 600; }
  .sid-ico { width: 18px; text-align: center; font-size: 14px; }
  .sid-badge {
    margin-left: auto; background: var(--amber); color: #000; border-radius: 9px;
    font-size: 10px; font-weight: 700; padding: 1px 6px;
  }
  .sid-hr { height: 1px; background: var(--border); margin: 8px 6px; }
  .sid-stat { padding: 4px 11px; font-size: 12px; color: var(--text2); line-height: 1.9; }

  /* MAIN */
  .bd-main { flex: 1; overflow-y: auto; padding: 24px 28px; }

  /* PAGE HEADING */
  .pg-title { font-family: 'Sora',sans-serif; font-size: 20px; font-weight: 700; margin-bottom: 4px; }
  .pg-sub { font-size: 13px; color: var(--text2); margin-bottom: 22px; }

  /* STATS */
  .stats-row { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
  .stat-card {
    flex: 1; min-width: 120px; background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 14px 16px;
  }
  .stat-val { font-family: 'Sora',sans-serif; font-size: 24px; font-weight: 700; }
  .stat-lbl { font-size: 12px; color: var(--text2); margin-top: 3px; }

  /* PATIENT GRID */
  .pat-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(300px,1fr)); gap: 14px; }
  .pat-card {
    background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
    padding: 16px; cursor: pointer; transition: .18s; position: relative; overflow: hidden;
  }
  .pat-card::before { content:''; position:absolute; left:0; top:0; bottom:0; width:3px; background: var(--accent); }
  .pat-card.submitted::before { background: var(--blue); }
  .pat-card:hover { border-color: var(--border2); transform: translateY(-1px); box-shadow: var(--shadow); }
  .pat-name { font-weight: 700; font-size: 14px; margin-bottom: 3px; }
  .pat-uhid { font-size: 11px; color: var(--text2); font-family: monospace; }
  .pat-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 9px; }
  .tag {
    font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 20px;
  }
  .tag-green { background: rgba(63,185,80,.12); color: var(--accent); }
  .tag-blue  { background: rgba(56,139,253,.12); color: var(--blue); }
  .tag-amber { background: var(--amberBg); color: var(--amber); }
  .tag-purple{ background: var(--purpleBg); color: var(--purple); }
  .pat-foot { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; }
  .pat-doc { font-size: 12px; color: var(--text2); margin-top: 7px; }
  .open-btn {
    font-size: 12px; font-weight: 600; color: var(--accent); cursor: pointer;
    background: rgba(63,185,80,.10); border: 1px solid rgba(63,185,80,.25);
    border-radius: 6px; padding: 4px 11px; font-family: inherit; transition: .14s;
  }
  .open-btn:hover { background: rgba(63,185,80,.2); }

  /* BACK BTN */
  .back-btn {
    display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600;
    color: var(--text2); cursor: pointer; background: var(--surface2);
    border: 1px solid var(--border); border-radius: 8px; padding: 7px 14px;
    font-family: inherit; transition: .14s; margin-bottom: 18px;
  }
  .back-btn:hover { color: var(--text); }

  /* DETAIL HEADER */
  .det-hdr { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 22px; flex-wrap: wrap; }
  .det-info { flex: 1; }
  .det-name { font-family: 'Sora',sans-serif; font-size: 20px; font-weight: 700; }
  .det-meta { font-size: 13px; color: var(--text2); margin-top: 4px; }

  /* SUBMIT BTN */
  .submit-btn {
    padding: 9px 20px; border-radius: 8px; font-size: 13px; font-weight: 700;
    background: linear-gradient(135deg,#238636,#3fb950); color: #fff;
    border: none; cursor: pointer; font-family: inherit; transition: .18s;
    box-shadow: 0 3px 12px rgba(63,185,80,.3); white-space: nowrap;
  }
  .submit-btn:hover { transform: translateY(-1px); box-shadow: 0 5px 18px rgba(63,185,80,.4); }
  .submit-btn:disabled { opacity: .5; cursor: not-allowed; transform: none; }
  .submitted-badge {
    padding: 9px 18px; border-radius: 8px;
    background: rgba(56,139,253,.12); border: 1px solid rgba(56,139,253,.25);
    color: var(--blue); font-weight: 700; font-size: 13px; white-space: nowrap;
  }

  /* TABS */
  .tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--border); margin-bottom: 22px; flex-wrap: wrap; }
  .tab-btn {
    padding: 9px 16px; font-size: 13px; font-weight: 600; cursor: pointer;
    border: none; border-bottom: 2px solid transparent; color: var(--text2);
    transition: .14s; font-family: inherit; background: none;
  }
  .tab-btn:hover { color: var(--text); }
  .tab-btn.act { color: var(--accent); border-bottom-color: var(--accent); }

  /* SECTION */
  .section { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); margin-bottom: 16px; overflow: hidden; }
  .sec-hdr { display: flex; align-items: center; justify-content: space-between; padding: 13px 16px; border-bottom: 1px solid var(--border); background: var(--surface2); }
  .sec-title { font-size: 14px; font-weight: 700; }
  .sec-body { padding: 16px; }

  /* FORM */
  .form-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(210px,1fr)); gap: 13px; }
  .fg { display: flex; flex-direction: column; gap: 5px; }
  .fg.full { grid-column: 1/-1; }
  .flbl { font-size: 11px; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: .04em; }
  .finp, .fsel, .ftxt {
    background: var(--surface3); border: 1px solid var(--border);
    border-radius: 7px; padding: 8px 11px; color: var(--text); font-size: 13px;
    font-family: inherit; transition: .14s; outline: none; width: 100%;
  }
  .finp:focus, .fsel:focus, .ftxt:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(63,185,80,.09); }
  .ftxt { resize: vertical; min-height: 76px; }
  .fsel option { background: var(--surface3); }

  /* TABLE */
  .tbl-wrap { overflow-x: auto; }
  .tbl { width: 100%; border-collapse: collapse; font-size: 13px; }
  .tbl th { text-align: left; padding: 9px 11px; font-size: 11px; font-weight: 700; color: var(--text2); text-transform: uppercase; letter-spacing: .05em; border-bottom: 1px solid var(--border); background: var(--surface2); }
  .tbl td { padding: 9px 11px; border-bottom: 1px solid var(--border); vertical-align: middle; }
  .tbl tr:last-child td { border-bottom: none; }
  .tbl tr:hover td { background: rgba(255,255,255,.015); }
  .tinp {
    background: var(--surface3); border: 1px solid var(--border);
    border-radius: 6px; padding: 5px 8px; color: var(--text); font-size: 12px;
    font-family: inherit; outline: none; width: 100%;
  }
  .tinp:focus { border-color: var(--accent); }
  .add-row {
    display: flex; align-items: center; gap: 6px; padding: 7px 14px;
    background: var(--surface2); border: 1px dashed var(--border2);
    color: var(--text2); border-radius: 7px; cursor: pointer; font-size: 13px;
    font-family: inherit; font-weight: 600; margin-top: 9px; transition: .14s;
  }
  .add-row:hover { border-color: var(--accent); color: var(--accent); }
  .del-btn {
    background: var(--redBg); border: 1px solid rgba(248,81,73,.2);
    color: var(--red); border-radius: 5px; padding: 3px 7px; cursor: pointer;
    font-size: 12px; font-family: inherit; transition: .14s;
  }
  .del-btn:hover { background: rgba(248,81,73,.2); }

  /* TOTALS */
  .totals { margin-top: 16px; border-top: 1px solid var(--border); padding-top: 14px; }
  .tot-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 7px; font-size: 13px; }
  .tot-row.final { font-weight: 700; font-size: 15px; color: var(--accent); padding-top: 9px; border-top: 1px solid var(--border); margin-top: 9px; }
  .tot-lbl { color: var(--text2); }
  .tot-val { font-weight: 600; font-family: 'Sora',sans-serif; }

  /* REPORTS */
  .rep-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(240px,1fr)); gap: 13px; }
  .rep-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 18px; display: flex; flex-direction: column; gap: 9px; }
  .rep-ico { font-size: 26px; }
  .rep-name { font-weight: 700; font-size: 13px; }
  .rep-desc { font-size: 12px; color: var(--text2); }
  .rep-btn {
    margin-top: auto; padding: 7px 14px; border-radius: 7px; font-size: 12px; font-weight: 600;
    background: var(--surface2); border: 1px solid var(--border); color: var(--text);
    cursor: pointer; font-family: inherit; transition: .14s;
  }
  .rep-btn:hover { border-color: var(--blue); color: var(--blue); }

  /* MODAL */
  .overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,.72); z-index: 999;
    display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);
  }
  .modal {
    background: var(--surface); border: 1px solid var(--border); border-radius: 14px;
    padding: 26px; min-width: 340px; max-width: 95vw; box-shadow: var(--shadow);
    position: relative; max-height: 92vh; overflow-y: auto;
  }
  .modal-close {
    position: absolute; top: 14px; right: 14px; width: 26px; height: 26px;
    border-radius: 5px; background: var(--surface2); border: 1px solid var(--border);
    cursor: pointer; font-size: 13px; color: var(--text2);
    display: flex; align-items: center; justify-content: center; font-family: inherit;
  }
  .modal-close:hover { color: var(--text); }
  .modal-title { font-family: 'Sora',sans-serif; font-size: 17px; font-weight: 700; margin-bottom: 5px; }
  .modal-sub { font-size: 13px; color: var(--text2); margin-bottom: 18px; }
  .branch-opt {
    padding: 13px 16px; border-radius: 9px; cursor: pointer;
    font-size: 14px; display: flex; align-items: center; gap: 10px;
    border: 1px solid var(--border); background: var(--surface2);
    transition: .14s; margin-bottom: 8px;
  }
  .branch-opt.sel { background: rgba(63,185,80,.12); border-color: rgba(63,185,80,.4); color: var(--accent); font-weight: 700; }
  .confirm-center { text-align: center; }
  .confirm-ico { font-size: 44px; margin-bottom: 10px; }
  .confirm-txt { font-size: 13px; color: var(--text2); margin-bottom: 20px; line-height: 1.65; }
  .confirm-row { display: flex; gap: 10px; justify-content: center; }
  .cancel-btn {
    padding: 9px 20px; border-radius: 8px; font-size: 13px; font-weight: 600;
    background: var(--surface2); border: 1px solid var(--border); color: var(--text);
    cursor: pointer; font-family: inherit;
  }

  /* TOAST */
  .toast-wrap { position: fixed; bottom: 22px; right: 22px; z-index: 9999; display: flex; flex-direction: column; gap: 8px; }
  .toast-item {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 9px; padding: 11px 16px; font-size: 13px; font-weight: 600;
    box-shadow: var(--shadow); display: flex; align-items: center; gap: 9px;
    animation: su .22s ease;
  }
  .toast-item.s { border-left: 3px solid var(--accent); }
  .toast-item.e { border-left: 3px solid var(--red); }
  @keyframes su { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }

  /* EMPTY */
  .empty { text-align: center; padding: 56px 20px; color: var(--text2); }
  .empty-ico { font-size: 38px; margin-bottom: 10px; }

  @media (max-width: 768px) {
    .bd-sidebar { display: none; }
    .bd-main { padding: 14px; }
  }
`;

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

function calcTotals(svcs, path, med, billing) {
  const s = svcs.reduce((a, r) => a + Number(r.amount || 0), 0);
  const p = path.reduce((a, r) => a + Number(r.amount || 0), 0);
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

let tid = 0;

export default function BillingDashboard({ currentUser, db: propDb, locId: initLoc, onLogout }) {
  const user = currentUser || { name: "Billing Staff", role: "billing" };
  const [branch, setBranch] = useState(initLoc || "laxmi");
  const [patients, setPatients] = useState([]);
  const [view, setView] = useState("dashboard"); // dashboard | patient
  const [sel, setSel] = useState(null);
  const [sideTab, setSideTab] = useState("pending");
  const [activeTab, setActiveTab] = useState("discharge");
  const [showBranch, setShowBranch] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Editable state
  const [eDis, setEDis] = useState({});
  const [eMed, setEMed] = useState({});
  const [eSvc, setESvc] = useState([]);
  const [ePath, setEPath] = useState([]);
  const [eMedBill, setEMedBill] = useState([]);
  const [eBilling, setEBilling] = useState({});

  useEffect(() => {
    const src = propDb ? mapLivePatients(propDb[branch] || []) : (MOCK_PATIENTS[branch] || []);
    setPatients(src);
    setView("dashboard"); setSel(null);
  }, [branch, propDb]);

  const toast = (msg, type = "s") => {
    const id = tid++;
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3200);
  };

  const openPatient = (p) => {
    setSel(p);
    setEDis({ ...p.discharge });
    setEMed({ ...p.medicalHistory });
    setESvc(JSON.parse(JSON.stringify(p.services)));
    setEPath(JSON.parse(JSON.stringify(p.pathologyBill)));
    setEMedBill(JSON.parse(JSON.stringify(p.medicalBill)));
    setEBilling({ ...p.billing });
    setActiveTab("discharge");
    setView("patient");
  };

  const syncSelectedPatient = () => {
    setPatients(prev => prev.map(p =>
      p.uhid === sel.uhid && p.admNo === sel.admNo
        ? { ...p, discharge: { ...eDis }, medicalHistory: { ...eMed }, services: [...eSvc], pathologyBill: [...ePath], medicalBill: [...eMedBill], billing: { ...eBilling } }
        : p
    ));
    setSel(prev => prev ? ({ ...prev, discharge: { ...eDis }, medicalHistory: { ...eMed }, services: [...eSvc], pathologyBill: [...ePath], medicalBill: [...eMedBill], billing: { ...eBilling } }) : prev);
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
      } else if (activeTab === "pathology") {
        for (const row of ePath.filter(item => item.test)) {
          await apiService.addService(sel.uhid, sel.admNo, buildServicePayload({ name: row.test, category: "PATHOLOGY", qty: 1, rate: row.amount, date: row.date }, "PATHOLOGY"));
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

  const updSvc = (setter, i, k, v) => setter(prev => {
    const n = [...prev]; n[i] = { ...n[i], [k]: v };
    if (k === "qty" || k === "rate") n[i].amount = Number(n[i].qty || 0) * Number(n[i].rate || 0);
    return n;
  });
  const addRow = (setter, tpl) => setter(prev => [...prev, { id: Date.now(), ...tpl }]);
  const delRow = (setter, i) => setter(prev => prev.filter((_, j) => j !== i));

  const totals = sel ? calcTotals(eSvc, ePath, eMedBill, eBilling) : null;
  const pending   = patients.filter(p => p.taskStatus === "pending").length;
  const submitted = patients.filter(p => p.taskStatus === "submitted").length;
  const admitted  = patients.filter(p => p.status === "admitted").length;
  const visible   = sideTab === "submitted" ? patients.filter(p => p.taskStatus === "submitted") : patients.filter(p => p.taskStatus === "pending");

  const TABS = [
    { id: "discharge",   lbl: "📋 Discharge Summary" },
    { id: "medical",     lbl: "🩺 Admission Note" },
    { id: "finalbill",   lbl: "🧾 Final Bill" },
    { id: "pathology",   lbl: "🧪 Pathology Bill" },
    { id: "med_bill",    lbl: "💊 Medicine Bill" },
    { id: "reports",     lbl: "📊 Reports" },
  ];

  return (
    <>
      <style>{css}</style>
      <div className="bd">

        {/* ── HEADER */}
        <header className="bd-hdr">
          <div className="bd-hdr-l">
            <div className="bd-logo">SH</div>
            <div>
              <div className="bd-title">Sangi Hospital</div>
              <div className="bd-sub">Billing Department</div>
            </div>
          </div>
          <div className="bd-hdr-r">
            <button className="bd-branch-pill" onClick={() => setShowBranch(true)}>
              🏥 {branch === "laxmi" ? "Laxmi Nagar" : "Raya"} ▾
            </button>
            <div className="bd-avatar">{user.name?.[0] || "B"}</div>
            <span className="bd-uname">{user.name}</span>
            <button className="bd-logout" onClick={onLogout}>Logout</button>
          </div>
        </header>

        <div className="bd-body">
          {/* ── SIDEBAR */}
          <aside className="bd-sidebar">
            <div className="sid-lbl">Navigation</div>
            {[
              { id: "pending",   lbl: "My Patients",  ico: "👥", badge: pending },
              { id: "submitted", lbl: "Submitted",     ico: "✅" },
              { id: "reports",   lbl: "Reports",       ico: "📊" },
            ].map(item => (
              <div key={item.id}
                className={`sid-item${sideTab === item.id && view === "dashboard" ? " act" : ""}`}
                onClick={() => { setSideTab(item.id); setView("dashboard"); setSel(null); }}>
                <span className="sid-ico">{item.ico}</span>
                {item.lbl}
                {item.badge > 0 && <span className="sid-badge">{item.badge}</span>}
              </div>
            ))}
            <div className="sid-hr" />
            <div className="sid-lbl">Quick Stats</div>
            <div className="sid-stat">
              Total: <strong style={{ color: "var(--text)" }}>{patients.length}</strong><br />
              Pending: <strong style={{ color: "var(--amber)" }}>{pending}</strong><br />
              Submitted: <strong style={{ color: "var(--blue)" }}>{submitted}</strong><br />
              Admitted: <strong style={{ color: "var(--accent)" }}>{admitted}</strong>
            </div>
          </aside>

          {/* ── MAIN */}
          <main className="bd-main">

            {/* ════ DASHBOARD ════ */}
            {view === "dashboard" && (
              <>
                <div className="pg-title">
                  {sideTab === "submitted" ? "✅ Submitted Tasks" : sideTab === "reports" ? "📊 Reports" : "👥 My Assigned Patients"}
                </div>
                <div className="pg-sub">
                  {branch === "laxmi" ? "Laxmi Nagar Branch" : "Raya Branch"} &nbsp;·&nbsp;
                  {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </div>

                {sideTab !== "reports" && (
                  <>
                    <div className="stats-row">
                      {[
                        { val: patients.length, lbl: "Total Assigned", col: "var(--text)" },
                        { val: pending,   lbl: "Pending Tasks",  col: "var(--amber)" },
                        { val: submitted, lbl: "Submitted",      col: "var(--blue)" },
                        { val: admitted,  lbl: "Admitted",       col: "var(--accent)" },
                      ].map(s => (
                        <div key={s.lbl} className="stat-card">
                          <div className="stat-val" style={{ color: s.col }}>{s.val}</div>
                          <div className="stat-lbl">{s.lbl}</div>
                        </div>
                      ))}
                    </div>

                    {visible.length === 0
                      ? <div className="empty"><div className="empty-ico">{sideTab === "submitted" ? "📭" : "🎉"}</div><div>{sideTab === "submitted" ? "No submitted tasks yet." : "No pending patients!"}</div></div>
                      : <div className="pat-grid">
                          {visible.map(p => (
                            <div key={p.uhid} className={`pat-card${p.taskStatus === "submitted" ? " submitted" : ""}`}>
                              <div className="pat-name">{p.patientName}</div>
                              <div className="pat-uhid">{p.uhid} · Adm #{p.admNo}</div>
                              <div className="pat-doc">👨‍⚕️ {p.doctor} · {p.diagnosis}</div>
                              <div className="pat-tags">
                                <span className={`tag ${p.status === "admitted" ? "tag-green" : "tag-blue"}`}>{p.status === "admitted" ? "🟢 Admitted" : "🔵 Discharged"}</span>
                                <span className="tag tag-purple">🛏 {p.ward} {p.bed}</span>
                                <span className={`tag ${p.taskStatus === "submitted" ? "tag-blue" : "tag-amber"}`}>{p.taskStatus === "submitted" ? "✅ Submitted" : "⏳ Pending"}</span>
                              </div>
                              <div className="pat-foot">
                                <span style={{ fontSize: 11, color: "var(--text3)" }}>DOA: {p.doa ? new Date(p.doa).toLocaleDateString("en-IN") : "—"}</span>
                                <button className="open-btn" onClick={() => openPatient(p)}>Open →</button>
                              </div>
                            </div>
                          ))}
                        </div>
                    }
                  </>
                )}

                {sideTab === "reports" && (
                  <div className="rep-grid">
                    {[
                      { ico: "💰", name: "Daily Collection",     desc: "Today's billing collections across all patients." },
                      { ico: "🧾", name: "Pending Bills",         desc: "Patients with unpaid or partial balances." },
                      { ico: "🏥", name: "Ward-wise Billing",     desc: "Billing summary grouped by ward and bed." },
                      { ico: "📦", name: "Service-wise Revenue",  desc: "Revenue breakdown by service category." },
                      { ico: "🧪", name: "Pathology Collections", desc: "Summary of all pathology lab bill amounts." },
                      { ico: "💊", name: "Medicine Revenue",      desc: "Total revenue from pharmacy bills." },
                      { ico: "📤", name: "Submitted Tasks",       desc: "All billing tasks submitted to HOD today." },
                      { ico: "📈", name: "Monthly Summary",       desc: "Month-to-date revenue, discounts, and dues." },
                    ].map(r => (
                      <div key={r.name} className="rep-card">
                        <div className="rep-ico">{r.ico}</div>
                        <div className="rep-name">{r.name}</div>
                        <div className="rep-desc">{r.desc}</div>
                        <button className="rep-btn" onClick={() => toast(`${r.name} generated ✓`)}>Generate →</button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ════ PATIENT DETAIL ════ */}
            {view === "patient" && sel && (
              <>
                <button className="back-btn" onClick={() => { setView("dashboard"); setSel(null); }}>← Back</button>

                <div className="det-hdr">
                  <div className="det-info">
                    <div className="det-name">{sel.patientName}</div>
                    <div className="det-meta">
                      UHID: <strong>{sel.uhid}</strong> · Adm #{sel.admNo} · {sel.age}y {sel.gender} · 📞 {sel.phone}
                    </div>
                    <div className="pat-tags" style={{ marginTop: 10 }}>
                      <span className={`tag ${sel.status === "admitted" ? "tag-green" : "tag-blue"}`}>{sel.status === "admitted" ? "🟢 Admitted" : "🔵 Discharged"}</span>
                      <span className="tag tag-purple">🛏 {sel.ward} · {sel.bed}</span>
                      <span className="tag tag-purple">👨‍⚕️ {sel.doctor}</span>
                      <span className={`tag ${sel.taskStatus === "submitted" ? "tag-blue" : "tag-amber"}`}>{sel.taskStatus === "submitted" ? "✅ Submitted to HOD" : "⏳ Pending"}</span>
                    </div>
                  </div>
                  {sel.taskStatus !== "submitted"
                    ? <button className="submit-btn" onClick={() => setShowConfirm(true)}>✅ Submit to HOD & Admin</button>
                    : <div className="submitted-badge">✅ Submitted to HOD & Admin</div>
                  }
                </div>

                {/* TABS */}
                <div className="tabs">
                  {TABS.map(t => (
                    <button key={t.id} className={`tab-btn${activeTab === t.id ? " act" : ""}`} onClick={() => setActiveTab(t.id)}>{t.lbl}</button>
                  ))}
                </div>

                {/* ── DISCHARGE SUMMARY */}
                {activeTab === "discharge" && (
                  <>
                    <div className="section">
                      <div className="sec-hdr"><div className="sec-title">📋 Discharge Summary</div></div>
                      <div className="sec-body">
                        <div className="form-grid">
                          {[
                            { k:"doa", lbl:"Date of Admission", type:"datetime-local" },
                            { k:"dod", lbl:"Date of Discharge",  type:"datetime-local" },
                            { k:"ward", lbl:"Ward" }, { k:"bed", lbl:"Bed No." },
                            { k:"doctor", lbl:"Treating Doctor" }, { k:"diagnosis", lbl:"Primary Diagnosis" },
                            { k:"condition", lbl:"Condition at Discharge" },
                          ].map(f => (
                            <div key={f.k} className="fg">
                              <label className="flbl">{f.lbl}</label>
                              <input className="finp" type={f.type || "text"} value={eDis?.[f.k] || ""}
                                onChange={e => setEDis(p => ({ ...p, [f.k]: e.target.value }))} />
                            </div>
                          ))}
                          <div className="fg full">
                            <label className="flbl">Discharge Instructions</label>
                            <textarea className="ftxt" value={eDis?.instructions || ""}
                              onChange={e => setEDis(p => ({ ...p, instructions: e.target.value }))} />
                          </div>
                          <div className="fg full">
                            <label className="flbl">Additional Notes</label>
                            <textarea className="ftxt" value={eDis?.notes || ""}
                              onChange={e => setEDis(p => ({ ...p, notes: e.target.value }))} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <button className="submit-btn" onClick={() => saveSection("Discharge Summary")}>💾 Save Discharge Summary</button>
                  </>
                )}

                {/* ── ADMISSION NOTE */}
                {activeTab === "medical" && (
                  <>
                    <div className="section">
                      <div className="sec-hdr"><div className="sec-title">🩺 Admission Note / Medical History</div></div>
                      <div className="sec-body">
                        <div className="form-grid">
                          {[
                            { k:"treatingDoctor",    lbl:"Treating Doctor" },
                            { k:"previousDiagnosis", lbl:"Previous Diagnosis" },
                            { k:"chronicConditions", lbl:"Chronic Conditions" },
                            { k:"pastSurgeries",     lbl:"Past Surgeries" },
                            { k:"currentMedications",lbl:"Current Medications" },
                            { k:"knownAllergies",    lbl:"Known Allergies" },
                            { k:"familyHistory",     lbl:"Family History" },
                            { k:"smokingStatus",     lbl:"Smoking Status" },
                            { k:"alcoholUse",        lbl:"Alcohol Use" },
                          ].map(f => (
                            <div key={f.k} className="fg">
                              <label className="flbl">{f.lbl}</label>
                              <input className="finp" value={eMed?.[f.k] || ""}
                                onChange={e => setEMed(p => ({ ...p, [f.k]: e.target.value }))} />
                            </div>
                          ))}
                          <div className="fg full">
                            <label className="flbl">Additional Notes</label>
                            <textarea className="ftxt" value={eMed?.notes || ""}
                              onChange={e => setEMed(p => ({ ...p, notes: e.target.value }))} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <button className="submit-btn" onClick={() => saveSection("Admission Note")}>💾 Save Admission Note</button>
                  </>
                )}

                {/* ── FINAL BILL */}
                {activeTab === "finalbill" && (
                  <>
                    <div className="section">
                      <div className="sec-hdr"><div className="sec-title">🧾 Services & Charges</div></div>
                      <div className="sec-body">
                        <div className="tbl-wrap">
                          <table className="tbl">
                            <thead><tr><th>Service</th><th>Category</th><th style={{width:65}}>Qty</th><th style={{width:95}}>Rate (₹)</th><th style={{width:100}}>Amount</th><th style={{width:50}}></th></tr></thead>
                            <tbody>
                              {eSvc.map((r, i) => (
                                <tr key={r.id}>
                                  <td><input className="tinp" value={r.name} onChange={e => updSvc(setESvc, i, "name", e.target.value)} /></td>
                                  <td><input className="tinp" value={r.category} onChange={e => updSvc(setESvc, i, "category", e.target.value)} /></td>
                                  <td><input className="tinp" type="number" value={r.qty} onChange={e => updSvc(setESvc, i, "qty", e.target.value)} /></td>
                                  <td><input className="tinp" type="number" value={r.rate} onChange={e => updSvc(setESvc, i, "rate", e.target.value)} /></td>
                                  <td style={{fontWeight:600}}>{fmt(r.amount)}</td>
                                  <td><button className="del-btn" onClick={() => delRow(setESvc, i)}>✕</button></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <button className="add-row" onClick={() => addRow(setESvc, { name:"", category:"", qty:1, rate:0, amount:0 })}>+ Add Service</button>
                      </div>
                    </div>

                    <div className="section">
                      <div className="sec-hdr"><div className="sec-title">💳 Payment Details</div></div>
                      <div className="sec-body">
                        <div className="form-grid">
                          <div className="fg">
                            <label className="flbl">Discount (₹)</label>
                            <input className="finp" type="number" value={eBilling?.discount || 0} onChange={e => setEBilling(p => ({ ...p, discount: e.target.value }))} />
                          </div>
                          <div className="fg">
                            <label className="flbl">Advance Paid (₹)</label>
                            <input className="finp" type="number" value={eBilling?.advance || 0} onChange={e => setEBilling(p => ({ ...p, advance: e.target.value }))} />
                          </div>
                          <div className="fg">
                            <label className="flbl">Payment Mode</label>
                            <select className="fsel" value={eBilling?.paymentMode || "Cash"} onChange={e => setEBilling(p => ({ ...p, paymentMode: e.target.value }))}>
                              {["Cash","UPI","Card","Insurance","NEFT","Cheque"].map(m => <option key={m}>{m}</option>)}
                            </select>
                          </div>
                          <div className="fg full">
                            <label className="flbl">Remarks</label>
                            <input className="finp" value={eBilling?.remarks || ""} onChange={e => setEBilling(p => ({ ...p, remarks: e.target.value }))} />
                          </div>
                        </div>
                        {totals && (
                          <div className="totals">
                            <div className="tot-row"><span className="tot-lbl">Services</span><span className="tot-val">{fmt(totals.s)}</span></div>
                            <div className="tot-row"><span className="tot-lbl">Pathology</span><span className="tot-val">{fmt(totals.p)}</span></div>
                            <div className="tot-row"><span className="tot-lbl">Medicines</span><span className="tot-val">{fmt(totals.m)}</span></div>
                            <div className="tot-row"><span className="tot-lbl">Gross Total</span><span className="tot-val">{fmt(totals.gross)}</span></div>
                            <div className="tot-row"><span className="tot-lbl">Discount</span><span className="tot-val" style={{color:"var(--red)"}}>- {fmt(totals.disc)}</span></div>
                            <div className="tot-row"><span className="tot-lbl">Net Payable</span><span className="tot-val">{fmt(totals.net)}</span></div>
                            <div className="tot-row"><span className="tot-lbl">Advance Paid</span><span className="tot-val" style={{color:"var(--accent)"}}>- {fmt(totals.adv)}</span></div>
                            <div className="tot-row final"><span>Balance Due</span><span>{fmt(totals.due)}</span></div>
                          </div>
                        )}
                      </div>
                    </div>
                    <button className="submit-btn" onClick={() => saveSection("Final Bill")}>💾 Save Final Bill</button>
                  </>
                )}

                {/* ── PATHOLOGY BILL */}
                {activeTab === "pathology" && (
                  <>
                    <div className="section">
                      <div className="sec-hdr"><div className="sec-title">🧪 Pathology / Lab Bill</div></div>
                      <div className="sec-body">
                        <div className="tbl-wrap">
                          <table className="tbl">
                            <thead><tr><th>Test Name</th><th>Date</th><th style={{width:120}}>Amount (₹)</th><th style={{width:50}}></th></tr></thead>
                            <tbody>
                              {ePath.map((r, i) => (
                                <tr key={r.id}>
                                  <td><input className="tinp" value={r.test} onChange={e => { const n=[...ePath]; n[i]={...n[i],test:e.target.value}; setEPath(n); }} /></td>
                                  <td><input className="tinp" type="date" value={r.date} onChange={e => { const n=[...ePath]; n[i]={...n[i],date:e.target.value}; setEPath(n); }} /></td>
                                  <td><input className="tinp" type="number" value={r.amount} onChange={e => { const n=[...ePath]; n[i]={...n[i],amount:Number(e.target.value)}; setEPath(n); }} /></td>
                                  <td><button className="del-btn" onClick={() => delRow(setEPath, i)}>✕</button></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <button className="add-row" onClick={() => addRow(setEPath, { test:"", date:new Date().toISOString().slice(0,10), amount:0 })}>+ Add Test</button>
                        <div className="totals"><div className="tot-row final"><span>Pathology Total</span><span>{fmt(ePath.reduce((a,r)=>a+Number(r.amount||0),0))}</span></div></div>
                      </div>
                    </div>
                    <button className="submit-btn" onClick={() => saveSection("Pathology Bill")}>💾 Save Pathology Bill</button>
                  </>
                )}

                {/* ── MEDICINE BILL */}
                {activeTab === "med_bill" && (
                  <>
                    <div className="section">
                      <div className="sec-hdr"><div className="sec-title">💊 Medicine / Pharmacy Bill</div></div>
                      <div className="sec-body">
                        <div className="tbl-wrap">
                          <table className="tbl">
                            <thead><tr><th>Item Description</th><th>Date</th><th style={{width:120}}>Amount (₹)</th><th style={{width:50}}></th></tr></thead>
                            <tbody>
                              {eMedBill.map((r, i) => (
                                <tr key={r.id}>
                                  <td><input className="tinp" value={r.item} onChange={e => { const n=[...eMedBill]; n[i]={...n[i],item:e.target.value}; setEMedBill(n); }} /></td>
                                  <td><input className="tinp" type="date" value={r.date} onChange={e => { const n=[...eMedBill]; n[i]={...n[i],date:e.target.value}; setEMedBill(n); }} /></td>
                                  <td><input className="tinp" type="number" value={r.amount} onChange={e => { const n=[...eMedBill]; n[i]={...n[i],amount:Number(e.target.value)}; setEMedBill(n); }} /></td>
                                  <td><button className="del-btn" onClick={() => delRow(setEMedBill, i)}>✕</button></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <button className="add-row" onClick={() => addRow(setEMedBill, { item:"", date:new Date().toISOString().slice(0,10), amount:0 })}>+ Add Medicine</button>
                        <div className="totals"><div className="tot-row final"><span>Medicine Total</span><span>{fmt(eMedBill.reduce((a,r)=>a+Number(r.amount||0),0))}</span></div></div>
                      </div>
                    </div>
                    <button className="submit-btn" onClick={() => saveSection("Medicine Bill")}>💾 Save Medicine Bill</button>
                  </>
                )}

                {/* ── REPORTS */}
                {activeTab === "reports" && (
                  <div className="rep-grid">
                    {[
                      { ico:"🧾", name:"Print Final Bill",        desc:"Complete billing summary for this patient." },
                      { ico:"📋", name:"Print Discharge Summary", desc:"Official discharge summary for records." },
                      { ico:"🩺", name:"Print Admission Note",    desc:"Medical history and admission note." },
                      { ico:"🧪", name:"Print Pathology Report",  desc:"All lab test details and charges." },
                      { ico:"💊", name:"Print Medicine Bill",     desc:"Pharmacy/medicine charges for this admission." },
                      { ico:"📤", name:"Send Summary to HOD",     desc:"Share billing summary with Head of Department." },
                    ].map(r => (
                      <div key={r.name} className="rep-card">
                        <div className="rep-ico">{r.ico}</div>
                        <div className="rep-name">{r.name}</div>
                        <div className="rep-desc">{r.desc}</div>
                        <button className="rep-btn" onClick={() => toast(`${r.name} done ✓`)}>Generate →</button>
                      </div>
                    ))}
                    {totals && (
                      <div className="section" style={{ gridColumn:"1/-1", margin:0 }}>
                        <div className="sec-hdr"><div className="sec-title">📊 Live Billing Summary</div></div>
                        <div className="sec-body">
                          <div className="totals" style={{ marginTop:0 }}>
                            <div className="tot-row"><span className="tot-lbl">Services</span><span className="tot-val">{fmt(totals.s)}</span></div>
                            <div className="tot-row"><span className="tot-lbl">Pathology</span><span className="tot-val">{fmt(totals.p)}</span></div>
                            <div className="tot-row"><span className="tot-lbl">Medicines</span><span className="tot-val">{fmt(totals.m)}</span></div>
                            <div className="tot-row"><span className="tot-lbl">Discount</span><span className="tot-val" style={{color:"var(--red)"}}>- {fmt(totals.disc)}</span></div>
                            <div className="tot-row"><span className="tot-lbl">Advance</span><span className="tot-val" style={{color:"var(--accent)"}}>- {fmt(totals.adv)}</span></div>
                            <div className="tot-row final"><span>Balance Due</span><span>{fmt(totals.due)}</span></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </main>
        </div>

        {/* ── BRANCH MODAL */}
        {showBranch && (
          <div className="overlay" onClick={() => setShowBranch(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowBranch(false)}>✕</button>
              <div className="modal-title">🏥 Switch Branch</div>
              <div className="modal-sub">Select a hospital branch to work on.</div>
              {BRANCHES.map(b => (
                <div key={b.id} className={`branch-opt${branch === b.id ? " sel" : ""}`}
                  onClick={() => { setBranch(b.id); setShowBranch(false); }}>
                  {branch === b.id ? "✅" : "🏥"} {b.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SUBMIT CONFIRM MODAL */}
        {showConfirm && (
          <div className="overlay" onClick={() => setShowConfirm(false)}>
            <div className="modal confirm-center" onClick={e => e.stopPropagation()}>
              <div className="confirm-ico">📤</div>
              <div className="modal-title" style={{ textAlign:"center" }}>Submit Task to HOD & Admin?</div>
              <div className="confirm-txt">
                You are submitting the billing task for <strong>{sel?.patientName}</strong> (UHID: {sel?.uhid}) to the Head of Department and Admin Management.<br /><br />
                Please make sure all sections are saved before submitting.
              </div>
              <div className="confirm-row">
                <button className="cancel-btn" onClick={() => setShowConfirm(false)}>Cancel</button>
                <button className="submit-btn" onClick={submitTask}>✅ Yes, Submit</button>
              </div>
            </div>
          </div>
        )}

        {/* ── TOASTS */}
        <div className="toast-wrap">
          {toasts.map(t => (
            <div key={t.id} className={`toast-item ${t.type}`}>
              {t.type === "s" ? "✅" : "❌"} {t.msg}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
