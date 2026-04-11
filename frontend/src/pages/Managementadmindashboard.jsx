// ─── EMPLOYEE THEME: Deep Charcoal + Amber/Cyan ──────────────────────────────
// BG: #0d0e12 | Sidebar: #111318 | Cards: #14161e | Laxmi=Amber | Raya=Cyan

import { useState, useMemo } from "react";
import { LOCATION_DB } from "../data/mockDb";
import { apiService } from "../services/apiService";
import { toast } from "react-toastify";

const BC = {
  laxmi: { label: "Laxmi Nagar", accent: "#f59e0b", dim: "#f59e0b16", border: "#f59e0b30" },
  raya:  { label: "Raya",        accent: "#22d3ee", dim: "#22d3ee16", border: "#22d3ee30" },
};

const BRANCH_KEYS = ["laxmi", "raya"];

const NAV = [
  { id: "home",      label: "Home",       icon: "◈" },
  { id: "patients",  label: "Patients",   icon: "♥" },
  { id: "discharge", label: "Discharge",  icon: "⊟" },
  { id: "medicines", label: "Medicines",  icon: "⊕" },
  { id: "reports",   label: "Reports",    icon: "◧" },
  { id: "billing",   label: "Billing",    icon: "₹" },
  { id: "export",    label: "Export",     icon: "↓" },
  { id: "profile",   label: "My Profile", icon: "◎" },
];

const SUMMARY_TYPES = ["Normal", "LAMA", "Refer", "Death", "DAMA"];
const DEPT_ROLES = ["opd","ipd","billing","pharmacy","doctor","nursing","lab","radiology","reception","employee"];

const fmt   = (n) => "₹" + Number(n).toLocaleString("en-IN");
const fmtDt = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
};
const initials = (name = "") =>
  name.trim().split(" ").filter(Boolean).map(w => w[0]).join("").slice(0,2).toUpperCase();

function exportCSV(filename, rows, headers) {
  const csv = [
    headers.join(","),
    ...rows.map(r => headers.map(h => `"${(r[h] ?? "").toString().replace(/"/g,'""')}"`).join(","))
  ].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = filename;
  a.click();
}

function exportTxt(filename, content) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
  a.download = filename;
  a.click();
}

function buildDischargeSummaryText(p, branchLabel, ds = {}, mh = {}, meds = [], reps = []) {
  const medLines = meds.map(m => `  - ${m.name} | Qty: ${m.qty} | Rate: ₹${m.rate}`).join("\n");
  const repLines = reps.map(r => `  - ${r.name} (${r.date||""}): ${r.result||""}`).join("\n");
  return `
========================================
  SANGI HOSPITAL — ${branchLabel.toUpperCase()}
  DISCHARGE SUMMARY [${ds.type||"Normal"}]
========================================

Patient Name  : ${p.patientName||p.name||""}
UHID          : ${p.uhid}
Age / Gender  : ${p.ageYY||p.age||""}Y / ${p.gender||""}
Department    : ${ds.wardName||p.dept||""}
Admit Date    : ${fmtDt(p.admissions?.[0]?.dateTime||p.admitDate)}
Discharge Date: ${ds.dod||ds.date||"—"}
Treating Dr.  : ${ds.doctorName||mh.treatingDoctor||"—"}

── CLINICAL ────────────────────────────
Diagnosis     : ${ds.diagnosis||"—"}
Treatment     : ${ds.treatment||"—"}
Follow-up     : ${ds.followUp||"—"}
Notes         : ${ds.notes||"—"}

── MEDICAL HISTORY ─────────────────────
Previous Dx   : ${mh.previousDiagnosis||"—"}
Past Surgeries: ${mh.pastSurgeries||"—"}
Allergies     : ${mh.knownAllergies||"—"}
Chronic Cond. : ${mh.chronicConditions||"—"}
Current Meds  : ${mh.currentMedications||"—"}
Smoking       : ${mh.smokingStatus||"—"}
Alcohol       : ${mh.alcoholUse||"—"}

── MEDICINES PRESCRIBED ────────────────
${medLines||"  None"}

── INVESTIGATIONS ──────────────────────
${repLines||"  None"}

========================================
  Generated: ${new Date().toLocaleString("en-IN")}
========================================
`.trim();
}

const SEED_MEDS = {
  "laxmi": [
    [{id:1,name:"Aspirin",qty:30,rate:5},{id:2,name:"Atorvastatin",qty:14,rate:12}],
    [{id:1,name:"Ibuprofen",qty:20,rate:8},{id:2,name:"Calcium",qty:30,rate:6}],
  ],
  "raya": [
    [{id:1,name:"Metformin",qty:60,rate:4},{id:2,name:"Glimepiride",qty:30,rate:9}],
    [{id:1,name:"Azithromycin",qty:5,rate:25},{id:2,name:"Paracetamol",qty:15,rate:3}],
  ],
};
const SEED_REPS = {
  "laxmi": [
    [{id:1,name:"ECG",date:"2026-03-29",result:"Normal sinus rhythm"},{id:2,name:"Blood Panel",date:"2026-03-30",result:"Cholesterol elevated"}],
    [{id:1,name:"X-Ray Knee",date:"2026-03-21",result:"Mild arthritis"}],
  ],
  "raya": [
    [{id:1,name:"HbA1c",date:"2026-04-04",result:"8.2%"},{id:2,name:"FBS",date:"2026-04-03",result:"210 mg/dL"}],
    [{id:1,name:"Chest X-Ray",date:"2026-03-26",result:"Consolidation RLL"}],
  ],
};

function seedPatients(dbBranch, branchKey) {
  return (dbBranch || []).map((p, idx) => ({
    ...p,
    medicines: p.medicines || (SEED_MEDS[branchKey]?.[idx] || []),
    reports:   p.reports   || (SEED_REPS[branchKey]?.[idx]  || []),
    dischargeSummary: p.dischargeSummary || {
      type:"Normal", diagnosis:"", treatment:"", followUp:"", notes:"", doctorName:"", date:""
    },
  }));
}

const SUMMARY_META = {
  Normal: { color:"#34d399", bg:"#34d39916", label:"Normal" },
  LAMA:   { color:"#f59e0b", bg:"#f59e0b16", label:"LAMA"   },
  Refer:  { color:"#22d3ee", bg:"#22d3ee16", label:"Refer"  },
  Death:  { color:"#f87171", bg:"#f8717116", label:"Death"  },
  DAMA:   { color:"#c084fc", bg:"#c084fc16", label:"DAMA"   },
};
const summaryColor = (type) => SUMMARY_META[type]?.color || "#6b7280";

export default function EmployeeDashboard({ currentUser, onLogout }) {
  const homeBranch = currentUser?.branch || currentUser?.locations?.[0] || "laxmi";
  const [viewBranch, setViewBranch] = useState(homeBranch);
  const bc     = BC[viewBranch] || BC.laxmi;
  const accent = bc.accent;

  const [activeTab,  setActiveTab]  = useState("home");
  const [collapsed,  setCollapsed]  = useState(false);
  const [notif,      setNotif]      = useState(null);

  const [allPatients, setAllPatients] = useState(() => ({
    laxmi: seedPatients(LOCATION_DB["laxmi"], "laxmi"),
    raya:  seedPatients(LOCATION_DB["raya"],  "raya"),
  }));

  // modal states
  const [showMedModal,     setShowMedModal]     = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showReportModal,  setShowReportModal]  = useState(false);
  const [showViewModal,    setShowViewModal]    = useState(false);
  const [showDeleteConfirm,setShowDeleteConfirm]= useState(false);
  const [editMedPt,        setEditMedPt]        = useState(null);
  const [editSumPt,        setEditSumPt]        = useState(null);
  const [editRepPt,        setEditRepPt]        = useState(null);
  const [viewPt,           setViewPt]           = useState(null);
  const [deletePt,         setDeletePt]         = useState(null);
  const [summaryForm,      setSummaryForm]      = useState({});
  const [newReport,        setNewReport]        = useState({ name:"", date:"", result:"" });

  // export filters
  const [exportBranchFilter, setExportBranchFilter] = useState("All");
  const [exportType,         setExportType]          = useState("discharge");
  const [exportSumType,      setExportSumType]       = useState("All");

  // discharge tab filter
  const [dischSumFilter, setDischSumFilter] = useState("All");

  const toast = (msg, type="ok") => {
    setNotif({ msg, type });
    setTimeout(() => setNotif(null), 3000);
  };

  const locationPatients = allPatients[viewBranch] || [];

  const allAdmissions = useMemo(() =>
    locationPatients.flatMap(p =>
      (p.admissions||[]).map(a => ({
        ...a,
        patientName: p.patientName||p.name,
        uhid: p.uhid,
        gender: p.gender,
        bloodGroup: p.bloodGroup,
        phone: p.phone,
      }))
    ), [locationPatients]);

  const currentlyAdmitted = allAdmissions.filter(a => !a.discharge?.dod).length;
  const discharged        = allAdmissions.filter(a =>  a.discharge?.dod).length;
  const totalRevenue      = allAdmissions.reduce((s,a) => {
    const b = a.billing || {};
    return s + (parseFloat(b.paidNow)||0) + (parseFloat(b.advance)||0);
  }, 0);

  const branchColleagues = useMemo(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("hms_dept_users") || "[]");
      return stored.filter(u => u.branch === viewBranch && DEPT_ROLES.includes(u.role));
    } catch { return []; }
  }, [viewBranch]);

  const allPatientsFlat = useMemo(() =>
    BRANCH_KEYS.flatMap(bk =>
      (allPatients[bk]||[]).map(p => ({ ...p, _branch: bk, _branchLabel: BC[bk].label }))
    ), [allPatients]);

  const updatePatient = (branchKey, patientUhid, updater) => {
    setAllPatients(prev => ({
      ...prev,
      [branchKey]: prev[branchKey].map(p => p.uhid === patientUhid ? updater(p) : p),
    }));
  };

  // medicines
  const openMedEditor = (p) => { setEditMedPt(JSON.parse(JSON.stringify(p))); setShowMedModal(true); };
  const updateMed = (idx, field, val) => setEditMedPt(prev => {
    const m = [...prev.medicines];
    m[idx] = { ...m[idx], [field]: field === "name" ? val : (+val||0) };
    return { ...prev, medicines: m };
  });
  const addMedRow = () => setEditMedPt(prev => ({
    ...prev, medicines: [...(prev.medicines||[]), { id:Date.now(), name:"", qty:1, rate:0 }]
  }));
  const delMedRow = (idx) => setEditMedPt(prev => ({
    ...prev, medicines: prev.medicines.filter((_,i) => i !== idx)
  }));
  const saveMeds = () => {
    updatePatient(viewBranch, editMedPt.uhid, p => ({ ...p, medicines: editMedPt.medicines }));
    toast("Medicines saved"); setShowMedModal(false); setEditMedPt(null);
  };

  // discharge summary
  const openSummaryEditor = (p) => {
    setEditSumPt(p);
    setSummaryForm({ ...(p.dischargeSummary || { type:"Normal", diagnosis:"", treatment:"", followUp:"", notes:"", doctorName:"", date:"" }) });
    setShowSummaryModal(true);
  };
  const saveSummary = () => {
    updatePatient(viewBranch, editSumPt.uhid, p => ({ ...p, dischargeSummary: { ...summaryForm } }));
    toast("Summary saved"); setShowSummaryModal(false); setEditSumPt(null);
  };

  // view (read-only)
  const openViewModal = (p) => { setViewPt(p); setShowViewModal(true); };

  // delete/clear summary
  const confirmDelete = (p) => { setDeletePt(p); setShowDeleteConfirm(true); };
  const doDeleteSummary = () => {
    updatePatient(viewBranch, deletePt.uhid, p => ({
      ...p,
      dischargeSummary: { type:"Normal", diagnosis:"", treatment:"", followUp:"", notes:"", doctorName:"", date:"" }
    }));
    toast("Summary cleared"); setShowDeleteConfirm(false); setDeletePt(null);
  };

  // reports
  const openReportEditor = (p) => {
    setEditRepPt(JSON.parse(JSON.stringify(p)));
    setNewReport({ name:"", date:"", result:"" });
    setShowReportModal(true);
  };
  const addReport    = () => {
    if (!newReport.name) return;
    setEditRepPt(prev => ({ ...prev, reports: [...(prev.reports||[]), { id:Date.now(), ...newReport }] }));
    setNewReport({ name:"", date:"", result:"" });
  };
  const delReport    = (idx) => setEditRepPt(prev => ({ ...prev, reports: prev.reports.filter((_,i) => i !== idx) }));
  const updateReport = (idx, field, val) => setEditRepPt(prev => {
    const r = [...prev.reports]; r[idx] = { ...r[idx], [field]: val }; return { ...prev, reports: r };
  });
  const saveReports  = () => {
    updatePatient(viewBranch, editRepPt.uhid, p => ({ ...p, reports: editRepPt.reports }));
    toast("Reports saved"); setShowReportModal(false); setEditRepPt(null);
  };

  // export
  const getExportPatients = () => {
    let pts = exportBranchFilter === "All"
      ? allPatientsFlat
      : allPatientsFlat.filter(p => p._branchLabel === exportBranchFilter);
    if (exportSumType !== "All") pts = pts.filter(p => p.dischargeSummary?.type === exportSumType);
    return pts;
  };

  const doExport = () => {
    const pts = getExportPatients();
    if (pts.length === 0) { toast("No records match","warn"); return; }
    if (exportType === "discharge") {
      pts.forEach(p => {
        const adm = p.admissions?.[0] || {};
        const ds  = p.dischargeSummary || {};
        const mh  = adm.medicalHistory || p.medicalHistory || {};
        exportTxt(`discharge_${p.uhid}.txt`, buildDischargeSummaryText(p, p._branchLabel, { ...adm.discharge, ...ds }, mh, p.medicines||[], p.reports||[]));
      });
      toast(`Exported ${pts.length} discharge summary(s)`);
    } else if (exportType === "medical") {
      pts.forEach(p => {
        const adm = p.admissions?.[0] || {};
        const mh  = adm.medicalHistory || p.medicalHistory || {};
        const txt = `SANGI HOSPITAL — ${p._branchLabel}\nMEDICAL HISTORY\n\nPatient: ${p.patientName||p.name}\nUHID: ${p.uhid}\n\nPrevious Dx: ${mh.previousDiagnosis||"—"}\nPast Surgeries: ${mh.pastSurgeries||"—"}\nAllergies: ${mh.knownAllergies||"—"}\nChronic: ${mh.chronicConditions||"—"}\nCurrent Meds: ${mh.currentMedications||"—"}\nSmoking: ${mh.smokingStatus||"—"}\nAlcohol: ${mh.alcoholUse||"—"}\nNotes: ${mh.notes||"—"}`;
        exportTxt(`medhistory_${p.uhid}.txt`, txt);
      });
      toast(`Exported ${pts.length} medical history file(s)`);
    } else if (exportType === "medicines") {
      const rows = pts.flatMap(p =>
        (p.medicines||[]).map(m => ({ Branch:p._branchLabel, Patient:p.patientName||p.name, UHID:p.uhid, Medicine:m.name, Qty:m.qty, Rate:m.rate, Total:m.qty*m.rate }))
      );
      exportCSV("medicines_export.csv", rows, ["Branch","Patient","UHID","Medicine","Qty","Rate","Total"]);
      toast("Medicines CSV exported");
    } else if (exportType === "reports") {
      const rows = pts.flatMap(p =>
        (p.reports||[]).map(r => ({ Branch:p._branchLabel, Patient:p.patientName||p.name, UHID:p.uhid, Report:r.name, Date:r.date, Result:r.result }))
      );
      exportCSV("reports_export.csv", rows, ["Branch","Patient","UHID","Report","Date","Result"]);
      toast("Reports CSV exported");
    } else if (exportType === "patientHistory") {
      const rows = pts.map(p => ({
        Branch: p._branchLabel, Name: p.patientName||p.name, UHID: p.uhid,
        Age: p.ageYY||p.age, Gender: p.gender, Dept: p.dept||"",
        Status: p.admissions?.at(-1)?.discharge?.dod ? "Discharged" : "Admitted",
        SummaryType: p.dischargeSummary?.type||"",
      }));
      exportCSV("patient_history.csv", rows, ["Branch","Name","UHID","Age","Gender","Dept","Status","SummaryType"]);
      toast("Patient history CSV exported");
    }
  };

  // ── styles ────────────────────────────────────────────────────────────────
  const c = {
    wrap:      { display:"flex", flexDirection:"column", height:"100vh", background:"#0d0e12", fontFamily:"'DM Sans','Segoe UI',sans-serif", color:"#e8e2d9", overflow:"hidden" },
    hdr:       { height:54, background:"#0d0e12", borderBottom:"1px solid #1e2030", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 18px", flexShrink:0, zIndex:10 },
    body:      { display:"flex", flex:1, overflow:"hidden" },
    sb:        { width:collapsed?52:210, background:"#111318", borderRight:"1px solid #1e2030", display:"flex", flexDirection:"column", transition:"width 0.22s ease", flexShrink:0, overflow:"hidden" },
    sbTop:     { padding:collapsed?"14px 8px":"14px 12px", borderBottom:"1px solid #1e2030", flexShrink:0 },
    sbLabel:   { fontSize:9, fontWeight:700, color:"#3a3a4a", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:7, paddingLeft:2 },
    bsWrap:    { background:"#0d0e12", border:"1px solid #1e2030", borderRadius:9, overflow:"hidden" },
    bsBtn:     (bk) => ({ width:"100%", display:"flex", alignItems:"center", gap:8, padding:collapsed?"9px 0":"9px 11px", justifyContent:collapsed?"center":"flex-start", background:viewBranch===bk?BC[bk].dim:"transparent", borderLeft:viewBranch===bk?`2px solid ${BC[bk].accent}`:"2px solid transparent", cursor:"pointer", border:"none", color:viewBranch===bk?BC[bk].accent:"#4a4a5e", fontSize:12, fontWeight:viewBranch===bk?700:400, transition:"all 0.15s" }),
    bsDot:     (bk) => ({ width:7, height:7, borderRadius:"50%", background:BC[bk].accent, flexShrink:0 }),
    navWrap:   { flex:1, padding:"10px 0", overflowY:"auto" },
    navSection:{ fontSize:9, fontWeight:700, color:"#3a3a4a", letterSpacing:"0.1em", textTransform:"uppercase", padding:collapsed?"0":"0 14px", marginBottom:5, marginTop:4, textAlign:collapsed?"center":"left" },
    navItem:   (active) => ({ display:"flex", alignItems:"center", gap:9, padding:collapsed?"10px 0":"10px 14px", justifyContent:collapsed?"center":"flex-start", cursor:"pointer", fontSize:12, fontWeight:active?600:400, color:active?"#f5f0e8":"#4a4a5e", background:active?"#ffffff08":"transparent", borderLeft:active?`2px solid ${accent}`:"2px solid transparent", transition:"all 0.15s", whiteSpace:"nowrap" }),
    navIcon:   { fontSize:14, flexShrink:0, width:16, textAlign:"center" },
    sbBot:     { padding:collapsed?"10px 8px":"10px 12px", borderTop:"1px solid #1e2030", flexShrink:0 },
    colBtn:    { width:"100%", background:"transparent", border:"1px solid #1e2030", borderRadius:7, color:"#3a3a4a", cursor:"pointer", padding:"6px", fontSize:12, display:"flex", alignItems:"center", justifyContent:"center" },
    main:      { flex:1, overflowY:"auto", padding:"22px 26px" },
    logoRow:   { display:"flex", alignItems:"center", gap:10 },
    logoIcon:  { width:30, height:30, borderRadius:8, background:`linear-gradient(135deg,#f59e0b,#22d3ee)`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13, color:"#fff" },
    logoText:  { fontSize:14, fontWeight:700, color:"#f5f0e8" },
    logoSub:   { fontSize:9, color:"#3a3a4a" },
    hdrRight:  { display:"flex", alignItems:"center", gap:10 },
    roleBadge: { background:`${accent}18`, border:`1px solid ${accent}30`, color:accent, fontSize:9, fontWeight:700, padding:"3px 9px", borderRadius:20, letterSpacing:"0.07em" },
    deptBadge: { background:"#c084fc18", border:"1px solid #c084fc30", color:"#c084fc", fontSize:9, fontWeight:700, padding:"3px 9px", borderRadius:20, letterSpacing:"0.07em" },
    avatar:    { width:30, height:30, borderRadius:"50%", background:`linear-gradient(135deg,${accent},#c084fc)`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:11, color:"#fff" },
    logoutBtn: { background:"transparent", border:"1px solid #1e2030", color:"#4a4a5e", padding:"4px 11px", borderRadius:7, cursor:"pointer", fontSize:11 },
    pgLabel:   { fontSize:10, fontWeight:700, color:"#3a3a4a", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 },
    bPill:     { display:"inline-flex", alignItems:"center", gap:5, background:bc.dim, border:`1px solid ${bc.border}`, color:accent, fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:20, marginBottom:18, letterSpacing:"0.04em" },
    statGrid:  { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:12, marginBottom:20 },
    statCard:  (a) => ({ background:"#14161e", border:`1px solid ${a||"#1e2030"}`, borderRadius:11, padding:"14px 16px" }),
    statNum:   (col) => ({ fontSize:22, fontWeight:700, color:col||"#f5f0e8", lineHeight:1.2, marginBottom:3 }),
    statLabel: { fontSize:10, color:"#4a4a5e", fontWeight:500 },
    statSub:   { fontSize:9, color:"#3a3a4a", marginTop:1 },
    card:      { background:"#14161e", border:"1px solid #1e2030", borderRadius:13, padding:"16px 18px", marginBottom:18 },
    cardRow:   { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 },
    cardTitle: { fontSize:12, fontWeight:600, color:"#e8e2d9" },
    tbl:       { width:"100%", borderCollapse:"collapse" },
    th:        { textAlign:"left", fontSize:9, color:"#3a3a4a", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", padding:"0 9px 9px", borderBottom:"1px solid #1e2030" },
    td:        { padding:"10px 9px", borderBottom:"1px solid #1e203050", fontSize:11, color:"#8a8a9e", verticalAlign:"middle" },
    badge:     (bc2) => ({ display:"inline-block", background:bc2+"20", color:bc2, border:`1px solid ${bc2}40`, fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:20, whiteSpace:"nowrap" }),
    aBtn:      (bc2) => ({ background:"transparent", border:`1px solid ${bc2}40`, color:bc2, padding:"3px 9px", borderRadius:6, cursor:"pointer", fontSize:10, fontWeight:600 }),
    roBanner:  { background:"#c084fc10", border:"1px solid #c084fc30", borderRadius:8, padding:"8px 14px", marginBottom:16, fontSize:10, color:"#c084fc", fontWeight:600 },
    empty:     { textAlign:"center", padding:"2rem", color:"#3a3a4a", fontSize:12 },
    profCard:  { background:"#111318", border:`1px solid ${accent}30`, borderRadius:13, padding:"22px 20px", marginBottom:16 },
    bigAv:     { width:56, height:56, borderRadius:"50%", background:`linear-gradient(135deg,${accent},#c084fc)`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:18, color:"#fff", flexShrink:0 },
    modal:     { position:"fixed", inset:0, background:"rgba(5,5,8,0.9)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100 },
    modalBox:  { background:"#14161e", border:"1px solid #282a38", borderRadius:16, padding:"22px", width:520, maxWidth:"94vw", maxHeight:"90vh", overflowY:"auto" },
    modalBoxWide:{ background:"#14161e", border:"1px solid #282a38", borderRadius:16, padding:"22px", width:640, maxWidth:"96vw", maxHeight:"92vh", overflowY:"auto" },
    modalTitle:{ fontSize:14, fontWeight:700, color:"#f5f0e8", marginBottom:16 },
    lbl:       { display:"block", fontSize:9, color:"#4a4a5e", fontWeight:700, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:4 },
    inp:       { width:"100%", background:"#111318", border:"1px solid #282a38", borderRadius:7, padding:"8px 10px", color:"#e8e2d9", fontSize:11, marginBottom:12, boxSizing:"border-box", outline:"none" },
    sel:       { width:"100%", background:"#111318", border:"1px solid #282a38", borderRadius:7, padding:"8px 10px", color:"#e8e2d9", fontSize:11, marginBottom:12, boxSizing:"border-box", outline:"none" },
    mFoot:     { display:"flex", gap:9, marginTop:8 },
    cancelBtn: { flex:1, background:"transparent", border:"1px solid #282a38", color:"#4a4a5e", padding:"8px", borderRadius:7, cursor:"pointer", fontSize:11 },
    saveBtn:   { flex:1, background:`linear-gradient(135deg,${accent},${accent}cc)`, border:"none", color:"#0d0e12", padding:"8px", borderRadius:7, cursor:"pointer", fontSize:11, fontWeight:700 },
    dangerBtn: { flex:1, background:"#f8717118", border:"1px solid #f8717150", color:"#f87171", padding:"8px", borderRadius:7, cursor:"pointer", fontSize:11, fontWeight:700 },
    g2:        { display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 },
    g3:        { display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 },
    inpSm:     { background:"#111318", border:"1px solid #282a38", borderRadius:6, padding:"5px 7px", color:"#e8e2d9", fontSize:11, outline:"none", width:"100%" },
    sectionLabel:{ fontSize:9, fontWeight:700, color:"#3a3a4a", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:9, marginTop:2, paddingBottom:5, borderBottom:"1px solid #1e2030" },
    notif:     (t) => ({ position:"fixed", top:14, right:14, background:t==="ok"?"#0d1f12":"#1f0d0d", border:`1px solid ${t==="ok"?"#34d399":"#f87171"}`, color:t==="ok"?"#86efac":"#fca5a5", padding:"9px 16px", borderRadius:9, fontSize:11, fontWeight:600, zIndex:999 }),
    addBtn:    { background:`linear-gradient(135deg,${accent},${accent}cc)`, border:"none", color:"#0d0e12", padding:"6px 13px", borderRadius:7, cursor:"pointer", fontSize:11, fontWeight:700 },
    filterRow: { display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" },
    filterBtn: (active, col) => ({ background:active?(col||accent)+"20":"transparent", border:`1px solid ${active?(col||accent)+"50":"#282a38"}`, color:active?(col||accent):"#4a4a5e", padding:"4px 12px", borderRadius:20, cursor:"pointer", fontSize:10, fontWeight:active?700:400, transition:"all 0.15s" }),
    viewRow:   { display:"grid", gridTemplateColumns:"130px 1fr", gap:6, padding:"6px 0", borderBottom:"1px solid #1e203050" },
    viewKey:   { fontSize:10, color:"#4a4a5e", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" },
    viewVal:   { fontSize:11, color:"#e8e2d9" },
    summaryTypePill: (type) => {
      const m = SUMMARY_META[type] || { color:"#6b7280", bg:"#6b728018" };
      return { display:"inline-flex", alignItems:"center", gap:5, background:m.bg, border:`1px solid ${m.color}40`, color:m.color, fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:20 };
    },
  };

  const BranchHeader = ({ title }) => (
    <div style={{ marginBottom:18 }}>
      <div style={c.pgLabel}>{title}</div>
      <div style={c.bPill}><div style={c.bsDot(viewBranch)}/>{bc.label}</div>
    </div>
  );

  // ── HOME ──────────────────────────────────────────────────────────────────
  const renderHome = () => (
    <div>
      <BranchHeader title="Home" />
      <div style={{ ...c.profCard, display:"flex", alignItems:"flex-start", gap:18 }}>
        <div style={c.bigAv}>{initials(currentUser?.name)}</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:16, fontWeight:700, color:"#f5f0e8", marginBottom:3 }}>{currentUser?.name}</div>
          <div style={{ fontSize:11, color:accent, fontWeight:600, marginBottom:2 }}>{currentUser?.dept||currentUser?.role?.toUpperCase()}</div>
          <div style={{ fontSize:10, color:"#4a4a5e" }}>{bc.label} Branch</div>
          <div style={{ display:"flex", gap:8, marginTop:10, flexWrap:"wrap" }}>
            {currentUser?.dept&&<span style={c.badge(accent)}>{currentUser.dept}</span>}
            <span style={c.badge("#34d399")}>Active</span>
            <span style={{ ...c.badge("#6b7280"), fontFamily:"monospace" }}>{currentUser?.id}</span>
          </div>
        </div>
      </div>
      <div style={c.statGrid}>
        {[
          { label:"Branch Patients",    sub:"All records", val:locationPatients.length,  col:accent,    acc:accent+"18"  },
          { label:"Total Admissions",   sub:"All time",    val:allAdmissions.length,      col:"#22d3ee", acc:"#22d3ee18"  },
          { label:"Currently Admitted", sub:"Active",      val:currentlyAdmitted,          col:"#34d399", acc:"#34d39918"  },
          { label:"Discharged",         sub:"Completed",   val:discharged,                 col:"#8b949e", acc:"#8b949e18"  },
          { label:"Revenue Collected",  sub:bc.label,      val:fmt(totalRevenue),          col:"#f59e0b", acc:"#f59e0b18"  },
          { label:"Colleagues",         sub:"Same branch", val:branchColleagues.length,    col:"#c084fc", acc:"#c084fc18"  },
        ].map((s,i) => (
          <div key={i} style={c.statCard(s.acc)}>
            <div style={c.statNum(s.col)}>{s.val}</div>
            <div style={c.statLabel}>{s.label}</div>
            <div style={c.statSub}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div style={c.card}>
        <div style={c.cardRow}>
          <div style={c.cardTitle}>Recent Patients — {bc.label}</div>
          <button style={c.addBtn} onClick={() => setActiveTab("patients")}>View All</button>
        </div>
        {locationPatients.length === 0 ? <div style={c.empty}>No patients yet.</div> : (
          <table style={c.tbl}>
            <thead><tr>{["Patient","UHID","Ward","Doctor","Summary","Status","Admit Date"].map(h=><th key={h} style={c.th}>{h}</th>)}</tr></thead>
            <tbody>
              {locationPatients.slice(0,6).map((p,i) => {
                const last = p.admissions?.[p.admissions.length-1];
                const d = last?.discharge || {};
                const status = d.dod ? "Discharged" : "Admitted";
                return (
                  <tr key={i}>
                    <td style={c.td}><strong style={{ color:"#f5f0e8" }}>{p.patientName||p.name}</strong><div style={{ fontSize:9, color:"#3a3a4a" }}>{p.gender} · {p.ageYY||p.age}y · {p.bloodGroup}</div></td>
                    <td style={{ ...c.td, fontFamily:"monospace", fontSize:10, color:"#3a3a4a" }}>{p.uhid}</td>
                    <td style={c.td}>{d.wardName||"—"}<div style={{ fontSize:9, color:"#3a3a4a" }}>{d.bedNo}</div></td>
                    <td style={{ ...c.td, fontSize:10 }}>{d.doctorName||"—"}</td>
                    <td style={c.td}>
                      <span style={{ ...c.badge(summaryColor(p.dischargeSummary?.type)), cursor:"pointer" }} onClick={() => openSummaryEditor(p)}>
                        {p.dischargeSummary?.type||"Set"}
                      </span>
                    </td>
                    <td style={c.td}><span style={c.badge(status==="Admitted"?"#34d399":"#8b949e")}>{status}</span></td>
                    <td style={{ ...c.td, fontSize:10, color:"#3a3a4a" }}>{fmtDt(last?.dateTime)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  // ── PATIENTS ──────────────────────────────────────────────────────────────
  const renderPatients = () => (
    <div>
      <BranchHeader title="Patients" />
      <div style={c.roBanner}>◎ View + Edit Qty/Rates/Summaries · {currentUser?.dept||currentUser?.role} · {bc.label}</div>
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:16 }}>
        {[
          { label:"Total",     val:allAdmissions.length, col:accent,    acc:accent+"18"  },
          { label:"Admitted",  val:currentlyAdmitted,    col:"#34d399", acc:"#34d39918"  },
          { label:"Discharged",val:discharged,           col:"#8b949e", acc:"#8b949e18"  },
        ].map((s,i) => (
          <div key={i} style={{ ...c.statCard(s.acc), padding:"10px 14px" }}>
            <div style={{ fontSize:16, fontWeight:700, color:s.col }}>{s.val}</div>
            <div style={c.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={c.card}>
        {locationPatients.length === 0 ? <div style={c.empty}>No patients for {bc.label}.</div> : (
          <table style={c.tbl}>
            <thead>
              <tr>{["Patient/UHID","Contact","Ward/Bed","Doctor","Summary","DOA","DOD","Status","Actions"].map(h=><th key={h} style={c.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {locationPatients.flatMap((p,pi) =>
                (p.admissions||[]).map((adm,ai) => {
                  const d = adm.discharge || {};
                  const status = d.dod ? "Discharged" : "Admitted";
                  return (
                    <tr key={`${pi}-${ai}`}>
                      <td style={c.td}>
                        <strong style={{ color:"#f5f0e8", display:"block" }}>{p.patientName||p.name}</strong>
                        <span style={{ fontFamily:"monospace", fontSize:9, color:"#3a3a4a" }}>{p.uhid}</span>
                      </td>
                      <td style={{ ...c.td, fontSize:10 }}>
                        <div>{p.phone}</div>
                        <div style={{ color:"#3a3a4a", fontSize:9 }}>{p.email}</div>
                      </td>
                      <td style={c.td}>{d.wardName||"—"}<div style={{ fontSize:9, color:"#3a3a4a" }}>{d.bedNo}</div></td>
                      <td style={{ ...c.td, fontSize:10 }}>{d.doctorName||"—"}</td>
                      <td style={c.td}>
                        <span style={{ ...c.badge(summaryColor(p.dischargeSummary?.type)), cursor:"pointer" }} onClick={() => openSummaryEditor(p)}>
                          {p.dischargeSummary?.type||"Set ✎"}
                        </span>
                      </td>
                      <td style={{ ...c.td, fontSize:10, color:"#3a3a4a" }}>{fmtDt(d.doa)}</td>
                      <td style={{ ...c.td, fontSize:10, color:"#3a3a4a" }}>{fmtDt(d.dod)}</td>
                      <td style={c.td}><span style={c.badge(status==="Admitted"?"#34d399":"#8b949e")}>{status}</span></td>
                      <td style={c.td}>
                        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                          <button style={c.aBtn("#34d399")} onClick={() => openMedEditor(p)}>Meds</button>
                          <button style={c.aBtn("#22d3ee")} onClick={() => openReportEditor(p)}>Reports</button>
                          <button style={c.aBtn("#f59e0b")} onClick={() => {
                            const ds = p.dischargeSummary || {};
                            const mh = adm.medicalHistory || {};
                            exportTxt(`discharge_${p.uhid}.txt`, buildDischargeSummaryText(p, bc.label, { ...d, ...ds }, mh, p.medicines||[], p.reports||[]));
                            toast("Downloaded");
                          }}>↓</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  // ── DISCHARGE SUMMARY (dedicated tab) ────────────────────────────────────
  const renderDischarge = () => {
    const summaryStats = SUMMARY_TYPES.reduce((acc, t) => {
      acc[t] = locationPatients.filter(p => p.dischargeSummary?.type === t).length;
      return acc;
    }, {});
    const unset = locationPatients.filter(p => !p.dischargeSummary?.diagnosis).length;

    const filtered = dischSumFilter === "All"
      ? locationPatients
      : locationPatients.filter(p => p.dischargeSummary?.type === dischSumFilter);

    return (
      <div>
        <BranchHeader title="Discharge Summaries" />

        <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:16 }}>
          {[
            { label:"Total",   val:locationPatients.length,  col:accent,    acc:accent+"18"  },
            ...SUMMARY_TYPES.map(t => ({
              label:t, val:summaryStats[t]||0,
              col:SUMMARY_META[t].color, acc:SUMMARY_META[t].bg
            })),
            { label:"Pending", val:unset, col:"#64748b", acc:"#64748b18" },
          ].map((s,i) => (
            <div key={i} style={{ ...c.statCard(s.acc), padding:"10px 14px", minWidth:90 }}>
              <div style={{ fontSize:18, fontWeight:700, color:s.col }}>{s.val}</div>
              <div style={c.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={c.filterRow}>
          {["All",...SUMMARY_TYPES].map(t => (
            <button key={t} style={c.filterBtn(dischSumFilter===t, t!=="All"?SUMMARY_META[t]?.color:accent)}
              onClick={() => setDischSumFilter(t)}>{t}
            </button>
          ))}
        </div>

        <div style={c.card}>
          <div style={c.cardRow}>
            <div style={c.cardTitle}>
              {filtered.length} Record{filtered.length!==1?"s":""} — {bc.label}
            </div>
            <button style={c.aBtn("#f59e0b")} onClick={() => {
              filtered.forEach(p => {
                const adm = p.admissions?.[0] || {};
                const ds  = p.dischargeSummary || {};
                const mh  = adm.medicalHistory || {};
                exportTxt(`discharge_${p.uhid}.txt`, buildDischargeSummaryText(p, bc.label, { ...adm.discharge, ...ds }, mh, p.medicines||[], p.reports||[]));
              });
              toast(`Downloaded ${filtered.length} summaries`);
            }}>↓ Export All</button>
          </div>

          {filtered.length === 0 ? <div style={c.empty}>No summaries match this filter.</div> : (
            <table style={c.tbl}>
              <thead>
                <tr>{["Patient","UHID","Type","Diagnosis","Doctor","Discharge Date","Meds","Reports","Actions"].map(h=><th key={h} style={c.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const ds  = p.dischargeSummary || {};
                  const adm = p.admissions?.[0] || {};
                  const d   = adm.discharge || {};
                  const hasDiagnosis = !!ds.diagnosis;
                  return (
                    <tr key={i} style={{ background:i%2===0?"transparent":"#ffffff03" }}>
                      <td style={c.td}>
                        <strong style={{ color:"#f5f0e8", display:"block" }}>{p.patientName||p.name}</strong>
                        <div style={{ fontSize:9, color:"#3a3a4a" }}>{p.gender} · {p.ageYY||p.age}y</div>
                      </td>
                      <td style={{ ...c.td, fontFamily:"monospace", fontSize:10, color:"#3a3a4a" }}>{p.uhid}</td>
                      <td style={c.td}>
                        <span style={c.summaryTypePill(ds.type)}>
                          <span style={{ width:5, height:5, borderRadius:"50%", background:SUMMARY_META[ds.type]?.color||"#6b7280", display:"inline-block" }}/>
                          {ds.type||"Normal"}
                        </span>
                      </td>
                      <td style={{ ...c.td, maxWidth:140 }}>
                        {hasDiagnosis
                          ? <span style={{ color:"#e8e2d9", fontSize:11 }}>{ds.diagnosis}</span>
                          : <span style={{ color:"#3a3a4a", fontStyle:"italic", fontSize:10 }}>Not set</span>
                        }
                      </td>
                      <td style={{ ...c.td, fontSize:10 }}>{ds.doctorName||d.doctorName||"—"}</td>
                      <td style={{ ...c.td, fontSize:10, color:"#3a3a4a" }}>{fmtDt(ds.date||d.dod)}</td>
                      <td style={c.td}><span style={c.badge("#34d399")}>{(p.medicines||[]).length}</span></td>
                      <td style={c.td}><span style={c.badge("#22d3ee")}>{(p.reports||[]).length}</span></td>
                      <td style={c.td}>
                        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                          <button style={c.aBtn("#22d3ee")} onClick={() => openViewModal(p)}>View</button>
                          <button style={c.aBtn(accent)} onClick={() => openSummaryEditor(p)}>Edit</button>
                          <button style={c.aBtn("#f59e0b")} onClick={() => {
                            const mh = adm.medicalHistory || {};
                            exportTxt(`discharge_${p.uhid}.txt`, buildDischargeSummaryText(p, bc.label, { ...d, ...ds }, mh, p.medicines||[], p.reports||[]));
                            toast("Downloaded");
                          }}>↓</button>
                          <button style={c.aBtn("#f87171")} onClick={() => confirmDelete(p)}>✕</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  };

  // ── MEDICINES ─────────────────────────────────────────────────────────────
  const renderMedicines = () => (
    <div>
      <BranchHeader title="Medicines" />
      {locationPatients.map(p => {
        const medTotal = (p.medicines||[]).reduce((s,m) => s+(m.qty*m.rate), 0);
        return (
          <div key={p.uhid} style={c.card}>
            <div style={c.cardRow}>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:"#f5f0e8" }}>{p.patientName||p.name}</div>
                <div style={{ fontSize:9, color:"#3a3a4a", marginTop:2 }}>{p.uhid} · <span style={{ color:"#f59e0b" }}>{fmt(medTotal)} total</span></div>
              </div>
              <button style={c.addBtn} onClick={() => openMedEditor(p)}>Edit Medicines</button>
            </div>
            {(p.medicines||[]).length === 0 ? <div style={c.empty}>No medicines.</div> : (
              <table style={c.tbl}>
                <thead><tr>{["Medicine","Qty","Rate/unit","Total"].map(h=><th key={h} style={c.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {(p.medicines||[]).map((m,i) => (
                    <tr key={i}>
                      <td style={c.td}><strong style={{ color:"#f5f0e8" }}>{m.name}</strong></td>
                      <td style={c.td}><span style={c.badge(accent)}>{m.qty}</span></td>
                      <td style={c.td}>{fmt(m.rate)}</td>
                      <td style={c.td}><span style={{ color:"#f59e0b", fontWeight:700 }}>{fmt(m.qty*m.rate)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
      {locationPatients.length === 0 && <div style={{ ...c.card, ...c.empty }}>No patients for {bc.label}.</div>}
    </div>
  );

  // ── REPORTS ───────────────────────────────────────────────────────────────
  const renderReports = () => (
    <div>
      <BranchHeader title="Reports" />
      {locationPatients.map(p => (
        <div key={p.uhid} style={c.card}>
          <div style={c.cardRow}>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:"#f5f0e8" }}>{p.patientName||p.name}</div>
              <div style={{ fontSize:9, color:"#3a3a4a", marginTop:2 }}>{p.uhid} · {(p.reports||[]).length} report(s)</div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button style={c.aBtn("#f59e0b")} onClick={() => {
                const rows = (p.reports||[]).map(r => ({ Report:r.name, Date:r.date, Result:r.result }));
                exportCSV(`reports_${p.uhid}.csv`, rows, ["Report","Date","Result"]);
                toast("Downloaded");
              }}>↓ CSV</button>
              <button style={c.addBtn} onClick={() => openReportEditor(p)}>Edit</button>
            </div>
          </div>
          {(p.reports||[]).length === 0 ? <div style={c.empty}>No reports.</div> : (
            <table style={c.tbl}>
              <thead><tr>{["Report","Date","Result"].map(h=><th key={h} style={c.th}>{h}</th>)}</tr></thead>
              <tbody>
                {(p.reports||[]).map((r,i) => (
                  <tr key={i}>
                    <td style={c.td}><strong style={{ color:"#f5f0e8" }}>{r.name}</strong></td>
                    <td style={{ ...c.td, fontSize:10, color:"#3a3a4a" }}>{r.date}</td>
                    <td style={c.td}>{r.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
      {locationPatients.length === 0 && <div style={{ ...c.card, ...c.empty }}>No patients.</div>}
    </div>
  );

  // ── BILLING ───────────────────────────────────────────────────────────────
  const renderBilling = () => {
    const billRows = locationPatients.flatMap(p =>
      (p.admissions||[])
        .filter(a => a.billing && (parseFloat(a.billing.paidNow)||0)+(parseFloat(a.billing.advance)||0) > 0)
        .map(a => ({
          patient:  p.patientName||p.name,
          uhid:     p.uhid,
          admNo:    a.admNo,
          advance:  parseFloat(a.billing.advance)||0,
          paidNow:  parseFloat(a.billing.paidNow)||0,
          discount: parseFloat(a.billing.discount)||0,
          mode:     a.billing.paymentMode||"—",
          total:    (parseFloat(a.billing.advance)||0)+(parseFloat(a.billing.paidNow)||0),
        }))
    );
    const grandTotal = billRows.reduce((s,r) => s+r.total, 0);
    const totalAdv   = billRows.reduce((s,r) => s+r.advance, 0);
    return (
      <div>
        <BranchHeader title="Billing" />
        <div style={c.statGrid}>
          {[
            { label:"Total Collected", val:fmt(grandTotal), col:"#f59e0b", acc:"#f59e0b18" },
            { label:"Advance",         val:fmt(totalAdv),   col:"#22d3ee", acc:"#22d3ee18" },
            { label:"Records",         val:billRows.length, col:"#34d399", acc:"#34d39918" },
          ].map((s,i) => (
            <div key={i} style={c.statCard(s.acc)}>
              <div style={c.statNum(s.col)}>{s.val}</div>
              <div style={c.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={c.card}>
          {billRows.length === 0 ? <div style={c.empty}>No billing records.</div> : (
            <table style={c.tbl}>
              <thead><tr>{["Patient","UHID","Adm#","Advance","Paid","Discount","Mode","Total"].map(h=><th key={h} style={c.th}>{h}</th>)}</tr></thead>
              <tbody>
                {billRows.map((r,i) => (
                  <tr key={i}>
                    <td style={c.td}><strong style={{ color:"#f5f0e8" }}>{r.patient}</strong></td>
                    <td style={{ ...c.td, fontFamily:"monospace", fontSize:10, color:"#3a3a4a" }}>{r.uhid}</td>
                    <td style={c.td}><span style={c.badge(accent)}>#{r.admNo}</span></td>
                    <td style={c.td}><span style={{ color:"#22d3ee", fontWeight:700 }}>{fmt(r.advance)}</span></td>
                    <td style={c.td}><span style={{ color:"#34d399", fontWeight:700 }}>{fmt(r.paidNow)}</span></td>
                    <td style={c.td}>{r.discount>0?<span style={{ color:"#c084fc" }}>{fmt(r.discount)}</span>:<span style={{ color:"#1e2030" }}>—</span>}</td>
                    <td style={{ ...c.td, fontSize:10 }}>{r.mode}</td>
                    <td style={c.td}><span style={{ color:"#f59e0b", fontWeight:700 }}>{fmt(r.total)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  };

  // ── EXPORT ────────────────────────────────────────────────────────────────
  const renderExport = () => {
    const exportOptions = [
      { id:"discharge",      label:"Discharge Summary",    desc:"Full clinical summary .txt per patient", icon:"📋" },
      { id:"medical",        label:"Medical History",       desc:"Medical history .txt per patient",       icon:"🏥" },
      { id:"medicines",      label:"Medicines",             desc:"Medicines with qty & rates as .csv",     icon:"💊" },
      { id:"reports",        label:"Investigation Reports", desc:"Lab/radiology results as .csv",          icon:"🔬" },
      { id:"patientHistory", label:"Patient History",       desc:"Full patient list as .csv",              icon:"📊" },
    ];
    const previewPts = getExportPatients();
    return (
      <div>
        <div style={{ marginBottom:18 }}>
          <div style={c.pgLabel}>Export</div>
          <div style={{ fontSize:10, color:"#4a4a5e" }}>Download summaries and data for any branch</div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
          <div style={c.card}>
            <div style={{ ...c.sectionLabel, marginBottom:12 }}>Filters</div>
            <label style={c.lbl}>Branch</label>
            <select style={c.sel} value={exportBranchFilter} onChange={e=>setExportBranchFilter(e.target.value)}>
              <option value="All">All Branches</option>
              <option value="Laxmi Nagar">Laxmi Nagar</option>
              <option value="Raya">Raya</option>
            </select>
            <label style={c.lbl}>Summary Type</label>
            <select style={c.sel} value={exportSumType} onChange={e=>setExportSumType(e.target.value)}>
              <option value="All">All Types</option>
              {SUMMARY_TYPES.map(t=><option key={t}>{t}</option>)}
            </select>
            <div style={{ fontSize:10, color:"#4a4a5e" }}>{previewPts.length} patient(s) match</div>
          </div>
          <div style={c.card}>
            <div style={{ ...c.sectionLabel, marginBottom:12 }}>Export Type</div>
            {exportOptions.map(o => (
              <div key={o.id} onClick={() => setExportType(o.id)} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:8, marginBottom:6, cursor:"pointer", background:exportType===o.id?accent+"18":"transparent", border:`1px solid ${exportType===o.id?accent+"50":"#282a38"}`, transition:"all 0.15s" }}>
                <span style={{ fontSize:15 }}>{o.icon}</span>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:exportType===o.id?accent:"#e8e2d9" }}>{o.label}</div>
                  <div style={{ fontSize:9, color:"#4a4a5e" }}>{o.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <button onClick={doExport} style={{ width:"100%", padding:"13px", background:`linear-gradient(135deg,${accent},${accent}cc)`, border:"none", color:"#0d0e12", borderRadius:10, cursor:"pointer", fontSize:13, fontWeight:700 }}>
          ↓ Download {exportOptions.find(o=>o.id===exportType)?.label} — {previewPts.length} record(s)
        </button>
        <div style={{ ...c.card, marginTop:16 }}>
          <div style={{ ...c.sectionLabel, marginBottom:10 }}>Quick Download per Patient</div>
          <table style={c.tbl}>
            <thead><tr>{["Patient","Branch","Summary","Discharge","Med Hist","Meds","Reports"].map(h=><th key={h} style={c.th}>{h}</th>)}</tr></thead>
            <tbody>
              {allPatientsFlat.map(p => (
                <tr key={p.uhid+p._branch}>
                  <td style={c.td}><strong style={{ color:"#f5f0e8" }}>{p.patientName||p.name}</strong><div style={{ fontSize:9, color:"#3a3a4a" }}>{p.uhid}</div></td>
                  <td style={c.td}><span style={c.badge(BC[p._branch]?.accent||"#6b7280")}>{p._branchLabel}</span></td>
                  <td style={c.td}><span style={c.badge(summaryColor(p.dischargeSummary?.type))}>{p.dischargeSummary?.type||"—"}</span></td>
                  <td style={c.td}><button style={c.aBtn("#f59e0b")} onClick={()=>{exportTxt(`discharge_${p.uhid}.txt`,buildDischargeSummaryText(p,p._branchLabel,p.dischargeSummary||{},{},p.medicines||[],p.reports||[]));toast("Downloaded");}}>↓</button></td>
                  <td style={c.td}><button style={c.aBtn("#34d399")} onClick={()=>{exportTxt(`medhistory_${p.uhid}.txt`,`Medical History\nPatient: ${p.patientName||p.name}\nUHID: ${p.uhid}`);toast("Downloaded");}}>↓</button></td>
                  <td style={c.td}><button style={c.aBtn("#22d3ee")} onClick={()=>{const rows=(p.medicines||[]).map(m=>({Medicine:m.name,Qty:m.qty,Rate:m.rate,Total:m.qty*m.rate}));exportCSV(`meds_${p.uhid}.csv`,rows,["Medicine","Qty","Rate","Total"]);toast("Downloaded");}}>↓</button></td>
                  <td style={c.td}><button style={c.aBtn("#c084fc")} onClick={()=>{const rows=(p.reports||[]).map(r=>({Report:r.name,Date:r.date,Result:r.result}));exportCSV(`reports_${p.uhid}.csv`,rows,["Report","Date","Result"]);toast("Downloaded");}}>↓</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ── PROFILE ───────────────────────────────────────────────────────────────
  const renderProfile = () => (
    <div>
      <BranchHeader title="My Profile" />
      <div style={{ ...c.profCard, display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center" }}>
        <div style={{ ...c.bigAv, width:70, height:70, fontSize:22, marginBottom:12 }}>{initials(currentUser?.name)}</div>
        <div style={{ fontSize:16, fontWeight:700, color:"#f5f0e8", marginBottom:3 }}>{currentUser?.name}</div>
        <div style={{ fontSize:11, color:accent, fontWeight:600, marginBottom:4 }}>{currentUser?.dept||currentUser?.role?.toUpperCase()}</div>
        <div style={{ fontSize:10, color:"#4a4a5e", marginBottom:10 }}>{bc.label} Branch</div>
        <span style={c.badge("#34d399")}>Active</span>
      </div>
      <div style={c.card}>
        <div style={{ fontSize:12, fontWeight:600, color:"#e8e2d9", marginBottom:14 }}>Account Details</div>
        <table style={c.tbl}>
          <tbody>
            {[
              ["Employee ID",  currentUser?.id],
              ["Full Name",    currentUser?.name],
              ["Department",   currentUser?.dept||"—"],
              ["Role",         currentUser?.role],
              ["Home Branch",  BC[homeBranch]?.label||homeBranch],
              ["Status",       "Active"],
              ["Created By",   currentUser?.createdBy||"Admin"],
            ].map(([k,v]) => (
              <tr key={k}>
                <td style={{ ...c.td, width:150, fontSize:10, color:"#3a3a4a", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>{k}</td>
                <td style={{ ...c.td, color:"#8a8a9e", fontFamily:k==="Employee ID"?"monospace":"inherit" }}>{v||"—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ ...c.card, borderColor:"#34d39930" }}>
        <div style={{ fontSize:11, color:"#34d399", fontWeight:600, marginBottom:10 }}>Your Permissions</div>
        {["View patients — both branches","Edit medicines (qty & rates)","Edit discharge summaries","Add/edit investigation reports","Export discharge summaries, medical history, reports, medicines","View billing records"].map((r,i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
            <span style={{ color:"#34d399", fontSize:11 }}>✓</span>
            <span style={{ fontSize:11, color:"#4a4a5e" }}>{r}</span>
          </div>
        ))}
      </div>
      <div style={{ ...c.card, borderColor:"#f8717130" }}>
        <div style={{ fontSize:11, color:"#f87171", fontWeight:600, marginBottom:10 }}>Restrictions</div>
        {["Add/delete patients — Admin only","Create user accounts — Admin only","Manage departments — Admin only","Approve invoices — Super Admin only"].map((r,i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
            <span style={{ color:"#f87171", fontSize:11 }}>✕</span>
            <span style={{ fontSize:11, color:"#4a4a5e" }}>{r}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch(activeTab) {
      case "home":      return renderHome();
      case "patients":  return renderPatients();
      case "discharge": return renderDischarge();
      case "medicines": return renderMedicines();
      case "reports":   return renderReports();
      case "billing":   return renderBilling();
      case "export":    return renderExport();
      case "profile":   return renderProfile();
      default:          return renderHome();
    }
  };

  return (
    <div style={c.wrap}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:3px;height:3px;}
        ::-webkit-scrollbar-thumb{background:#282a38;border-radius:3px;}
        option{background:#0d0e12;}
      `}</style>

      {notif && <div style={c.notif(notif.type)}>{notif.type==="ok"?"✓ ":"⚠ "}{notif.msg}</div>}

      <header style={c.hdr}>
        <div style={c.logoRow}>
          <div style={c.logoIcon}>S</div>
          <div>
            <div style={c.logoText}>Sangi Hospital</div>
            <div style={c.logoSub}>{currentUser?.dept||currentUser?.role} · {bc.label}</div>
          </div>
        </div>
        <div style={c.hdrRight}>
          {currentUser?.dept && <span style={c.deptBadge}>{currentUser.dept.toUpperCase()}</span>}
          <span style={c.roleBadge}>{currentUser?.role?.toUpperCase()}</span>
          <div style={c.avatar}>{initials(currentUser?.name)}</div>
          <button style={c.logoutBtn} onClick={onLogout}>Logout</button>
        </div>
      </header>

      <div style={c.body}>
        <aside style={c.sb}>
          <div style={c.sbTop}>
            {!collapsed && <div style={c.sbLabel}>Branch</div>}
            <div style={c.bsWrap}>
              {BRANCH_KEYS.map(bk => (
                <button key={bk} style={c.bsBtn(bk)} onClick={() => setViewBranch(bk)} title={BC[bk].label}>
                  <div style={c.bsDot(bk)}/>{!collapsed && <span style={{ fontSize:12 }}>{BC[bk].label}</span>}
                </button>
              ))}
            </div>
          </div>
          <nav style={c.navWrap}>
            {!collapsed && <div style={c.navSection}>Menu</div>}
            {NAV.map(item => (
              <div key={item.id} style={c.navItem(activeTab===item.id)} onClick={() => setActiveTab(item.id)} title={item.label}>
                <span style={c.navIcon}>{item.icon}</span>
                {!collapsed && item.label}
              </div>
            ))}
          </nav>
          {!collapsed && (
            <div style={{ padding:"10px 12px", borderTop:"1px solid #1e2030", borderBottom:"1px solid #1e2030" }}>
              <div style={{ fontSize:9, color:"#3a3a4a", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:4 }}>Signed in as</div>
              <div style={{ fontSize:11, color:"#8a8a9e", fontWeight:600 }}>{currentUser?.name}</div>
              <div style={{ fontSize:9, color:"#4a4a5e", marginTop:1 }}>{currentUser?.dept||currentUser?.role}</div>
            </div>
          )}
          <div style={c.sbBot}>
            <button style={c.colBtn} onClick={() => setCollapsed(x=>!x)} title={collapsed?"Expand":"Collapse"}>
              {collapsed?"▶":"◀"}
            </button>
          </div>
        </aside>
        <main style={c.main}>{renderContent()}</main>
      </div>

      {/* ── MEDICINES MODAL ───────────────────────────────────────────── */}
      {showMedModal && editMedPt && (
        <div style={c.modal} onClick={e=>e.target===e.currentTarget&&(setShowMedModal(false),setEditMedPt(null))}>
          <div style={c.modalBox}>
            <div style={c.modalTitle}>Medicines — {editMedPt.patientName||editMedPt.name}</div>
            <div style={{ fontSize:9, color:"#4a4a5e", marginBottom:12 }}>{editMedPt.uhid}</div>
            <div style={c.sectionLabel}>Medicine List</div>
            {(editMedPt.medicines||[]).map((m,i) => (
              <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 80px 80px 28px", gap:6, marginBottom:6, alignItems:"center" }}>
                <input style={c.inpSm} placeholder="Medicine name" value={m.name} onChange={e=>updateMed(i,"name",e.target.value)}/>
                <input style={c.inpSm} type="number" placeholder="Qty" value={m.qty} onChange={e=>updateMed(i,"qty",e.target.value)}/>
                <input style={c.inpSm} type="number" placeholder="Rate ₹" value={m.rate} onChange={e=>updateMed(i,"rate",e.target.value)}/>
                <button style={{ ...c.aBtn("#f87171"), padding:"4px 6px" }} onClick={()=>delMedRow(i)}>✕</button>
              </div>
            ))}
            <button style={{ ...c.aBtn(accent), marginBottom:14, width:"100%", padding:"7px" }} onClick={addMedRow}>+ Add Medicine</button>
            <div style={{ fontSize:10, color:"#f59e0b", fontWeight:700, marginBottom:12 }}>
              Total: {fmt((editMedPt.medicines||[]).reduce((s,m)=>s+(m.qty*m.rate),0))}
            </div>
            <div style={c.mFoot}>
              <button style={c.cancelBtn} onClick={()=>{setShowMedModal(false);setEditMedPt(null);}}>Cancel</button>
              <button style={c.saveBtn} onClick={saveMeds}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW DISCHARGE SUMMARY MODAL (read-only) ──────────────────── */}
      {showViewModal && viewPt && (
        <div style={c.modal} onClick={e=>e.target===e.currentTarget&&(setShowViewModal(false),setViewPt(null))}>
          <div style={c.modalBoxWide}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
              <div>
                <div style={c.modalTitle}>Discharge Summary</div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={c.summaryTypePill(viewPt.dischargeSummary?.type)}>
                    <span style={{ width:5, height:5, borderRadius:"50%", background:SUMMARY_META[viewPt.dischargeSummary?.type]?.color||"#6b7280", display:"inline-block" }}/>
                    {viewPt.dischargeSummary?.type||"Normal"}
                  </span>
                  <span style={{ fontSize:10, color:"#4a4a5e", fontFamily:"monospace" }}>{viewPt.uhid}</span>
                </div>
              </div>
              <button style={c.logoutBtn} onClick={()=>{setShowViewModal(false);setViewPt(null);}}>✕</button>
            </div>

            <div style={{ ...c.statCard("#f59e0b18"), padding:"12px 14px", marginBottom:14 }}>
              <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
                <div><div style={c.viewKey}>Patient</div><div style={{ ...c.viewVal, fontWeight:700, color:"#f5f0e8" }}>{viewPt.patientName||viewPt.name}</div></div>
                <div><div style={c.viewKey}>Age / Gender</div><div style={c.viewVal}>{viewPt.ageYY||viewPt.age}Y / {viewPt.gender}</div></div>
                <div><div style={c.viewKey}>Blood Group</div><div style={c.viewVal}>{viewPt.bloodGroup||"—"}</div></div>
                <div><div style={c.viewKey}>Phone</div><div style={c.viewVal}>{viewPt.phone||"—"}</div></div>
                <div><div style={c.viewKey}>Admit Date</div><div style={c.viewVal}>{fmtDt(viewPt.admissions?.[0]?.dateTime)}</div></div>
              </div>
            </div>

            <div style={{ ...c.sectionLabel, marginBottom:10 }}>Clinical Details</div>
            {[
              ["Diagnosis",      viewPt.dischargeSummary?.diagnosis],
              ["Treatment",      viewPt.dischargeSummary?.treatment],
              ["Treating Doctor",viewPt.dischargeSummary?.doctorName],
              ["Discharge Date", fmtDt(viewPt.dischargeSummary?.date)],
              ["Follow-up",      viewPt.dischargeSummary?.followUp],
              ["Notes",          viewPt.dischargeSummary?.notes],
            ].map(([k,v]) => (
              <div key={k} style={c.viewRow}>
                <div style={c.viewKey}>{k}</div>
                <div style={{ ...c.viewVal, color:v?"#e8e2d9":"#3a3a4a", fontStyle:v?"normal":"italic" }}>{v||"Not set"}</div>
              </div>
            ))}

            {(viewPt.medicines||[]).length > 0 && (
              <>
                <div style={{ ...c.sectionLabel, marginTop:14, marginBottom:10 }}>Medicines ({(viewPt.medicines||[]).length})</div>
                <table style={c.tbl}>
                  <thead><tr>{["Medicine","Qty","Rate","Total"].map(h=><th key={h} style={c.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {(viewPt.medicines||[]).map((m,i) => (
                      <tr key={i}>
                        <td style={c.td}><strong style={{ color:"#f5f0e8" }}>{m.name}</strong></td>
                        <td style={c.td}><span style={c.badge(accent)}>{m.qty}</span></td>
                        <td style={c.td}>{fmt(m.rate)}</td>
                        <td style={c.td}><span style={{ color:"#f59e0b", fontWeight:700 }}>{fmt(m.qty*m.rate)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {(viewPt.reports||[]).length > 0 && (
              <>
                <div style={{ ...c.sectionLabel, marginTop:14, marginBottom:10 }}>Investigations ({(viewPt.reports||[]).length})</div>
                <table style={c.tbl}>
                  <thead><tr>{["Report","Date","Result"].map(h=><th key={h} style={c.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {(viewPt.reports||[]).map((r,i) => (
                      <tr key={i}>
                        <td style={c.td}><strong style={{ color:"#f5f0e8" }}>{r.name}</strong></td>
                        <td style={{ ...c.td, fontSize:10, color:"#3a3a4a" }}>{r.date}</td>
                        <td style={c.td}>{r.result}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            <div style={c.mFoot}>
              <button style={c.cancelBtn} onClick={()=>{setShowViewModal(false);setViewPt(null);}}>Close</button>
              <button style={c.aBtn(accent)} onClick={()=>{setShowViewModal(false);openSummaryEditor(viewPt);}}>✎ Edit</button>
              <button style={c.saveBtn} onClick={() => {
                const adm = viewPt.admissions?.[0] || {};
                const ds  = viewPt.dischargeSummary || {};
                const mh  = adm.medicalHistory || {};
                exportTxt(`discharge_${viewPt.uhid}.txt`, buildDischargeSummaryText(viewPt, bc.label, { ...adm.discharge, ...ds }, mh, viewPt.medicines||[], viewPt.reports||[]));
                toast("Downloaded");
              }}>↓ Download</button>
            </div>
          </div>
        </div>
      )}

      {/* ── DISCHARGE SUMMARY EDIT MODAL ──────────────────────────────── */}
      {showSummaryModal && editSumPt && (
        <div style={c.modal} onClick={e=>e.target===e.currentTarget&&(setShowSummaryModal(false),setEditSumPt(null))}>
          <div style={c.modalBox}>
            <div style={c.modalTitle}>Edit Discharge Summary — {editSumPt.patientName||editSumPt.name}</div>
            <label style={c.lbl}>Summary Type</label>
            <select style={c.sel} value={summaryForm.type||"Normal"} onChange={e=>setSummaryForm(f=>({...f,type:e.target.value}))}>
              {SUMMARY_TYPES.map(t=><option key={t}>{t}</option>)}
            </select>
            <div style={c.g2}>
              <div><label style={c.lbl}>Doctor Name</label><input style={c.inp} value={summaryForm.doctorName||""} onChange={e=>setSummaryForm(f=>({...f,doctorName:e.target.value}))}/></div>
              <div><label style={c.lbl}>Discharge Date</label><input style={c.inp} type="date" value={summaryForm.date||""} onChange={e=>setSummaryForm(f=>({...f,date:e.target.value}))}/></div>
            </div>
            <label style={c.lbl}>Diagnosis</label>
            <input style={c.inp} value={summaryForm.diagnosis||""} onChange={e=>setSummaryForm(f=>({...f,diagnosis:e.target.value}))}/>
            <label style={c.lbl}>Treatment</label>
            <input style={c.inp} value={summaryForm.treatment||""} onChange={e=>setSummaryForm(f=>({...f,treatment:e.target.value}))}/>
            <label style={c.lbl}>Follow-up Instructions</label>
            <input style={c.inp} value={summaryForm.followUp||""} onChange={e=>setSummaryForm(f=>({...f,followUp:e.target.value}))}/>
            <label style={c.lbl}>Notes</label>
            <input style={c.inp} value={summaryForm.notes||""} onChange={e=>setSummaryForm(f=>({...f,notes:e.target.value}))}/>
            <div style={c.mFoot}>
              <button style={c.cancelBtn} onClick={()=>{setShowSummaryModal(false);setEditSumPt(null);}}>Cancel</button>
              <button style={{ ...c.saveBtn, flex:"unset", padding:"8px 14px" }} onClick={()=>{
                exportTxt(`discharge_${editSumPt.uhid}.txt`, buildDischargeSummaryText(editSumPt,bc.label,summaryForm,{},editSumPt.medicines||[],editSumPt.reports||[]));
                toast("Downloaded");
              }}>↓ Download</button>
              <button style={c.saveBtn} onClick={saveSummary}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM MODAL ──────────────────────────────────────── */}
      {showDeleteConfirm && deletePt && (
        <div style={c.modal} onClick={e=>e.target===e.currentTarget&&(setShowDeleteConfirm(false),setDeletePt(null))}>
          <div style={{ ...c.modalBox, width:380 }}>
            <div style={{ ...c.modalTitle, color:"#f87171" }}>Clear Discharge Summary?</div>
            <div style={{ fontSize:12, color:"#8a8a9e", marginBottom:18, lineHeight:1.6 }}>
              This will reset the discharge summary for <strong style={{ color:"#f5f0e8" }}>{deletePt.patientName||deletePt.name}</strong> ({deletePt.uhid}). This action cannot be undone.
            </div>
            <div style={c.mFoot}>
              <button style={c.cancelBtn} onClick={()=>{setShowDeleteConfirm(false);setDeletePt(null);}}>Cancel</button>
              <button style={c.dangerBtn} onClick={doDeleteSummary}>Yes, Clear Summary</button>
            </div>
          </div>
        </div>
      )}

      {/* ── REPORTS MODAL ─────────────────────────────────────────────── */}
      {showReportModal && editRepPt && (
        <div style={c.modal} onClick={e=>e.target===e.currentTarget&&(setShowReportModal(false),setEditRepPt(null))}>
          <div style={c.modalBox}>
            <div style={c.modalTitle}>Reports — {editRepPt.patientName||editRepPt.name}</div>
            <div style={c.sectionLabel}>Existing Reports</div>
            {(editRepPt.reports||[]).length === 0 && <div style={{ ...c.empty, padding:"1rem" }}>No reports yet.</div>}
            {(editRepPt.reports||[]).map((r,i) => (
              <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 110px 1fr 28px", gap:6, marginBottom:6, alignItems:"center" }}>
                <input style={c.inpSm} placeholder="Report name" value={r.name} onChange={e=>updateReport(i,"name",e.target.value)}/>
                <input style={c.inpSm} type="date" value={r.date} onChange={e=>updateReport(i,"date",e.target.value)}/>
                <input style={c.inpSm} placeholder="Result" value={r.result} onChange={e=>updateReport(i,"result",e.target.value)}/>
                <button style={{ ...c.aBtn("#f87171"), padding:"4px 6px" }} onClick={()=>delReport(i)}>✕</button>
              </div>
            ))}
            <div style={c.sectionLabel}>Add New Report</div>
            <div style={c.g3}>
              <input style={c.inpSm} placeholder="Name" value={newReport.name} onChange={e=>setNewReport(f=>({...f,name:e.target.value}))}/>
              <input style={c.inpSm} type="date" value={newReport.date} onChange={e=>setNewReport(f=>({...f,date:e.target.value}))}/>
              <input style={c.inpSm} placeholder="Result" value={newReport.result} onChange={e=>setNewReport(f=>({...f,result:e.target.value}))}/>
            </div>
            <button style={{ ...c.aBtn(accent), marginTop:8, marginBottom:14, width:"100%", padding:"7px" }} onClick={addReport}>+ Add Report</button>
            <div style={c.mFoot}>
              <button style={c.cancelBtn} onClick={()=>{setShowReportModal(false);setEditRepPt(null);}}>Cancel</button>
              <button style={c.saveBtn} onClick={saveReports}>Save Reports</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}