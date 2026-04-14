import * as XLSX from "xlsx";
import MedDrawer from "../components/MedDrawer";
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
  { id: "home",      label: "Home",       icon: "🏠" },
  { id: "patients",  label: "Patients",   icon: "🧑‍⚕️" },
  { id: "discharge", label: "Discharge",  icon: "🚪" },
  { id: "medicines", label: "Medicines",  icon: "💊" },
  { id: "reports",   label: "Reports",    icon: "📋" },
  { id: "billing",   label: "Billing",    icon: "💳" },
  { id: "export",    label: "Export",     icon: "📥" },
  { id: "profile",   label: "My Profile", icon: "👤" },
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

function exportPatientHistoryXLSX(pts, filename = "patient_history.xlsx") {
  const wb = XLSX.utils.book_new();
  const headers = ["SR.NO","PATIENT NAME","AGE","GENDER","UHID","BRANCH","DEPT","DOA","DOD","STATUS","SUMMARY TYPE","DOCTOR","PHONE"];
  const rows = pts.map((p, i) => {
    const adm = p.admissions?.at(-1) || {};
    const d = adm.discharge || {};
    const ds = p.dischargeSummary || {};
    return [i+1, p.patientName||p.name||"", p.ageYY||p.age||"", p.gender||"", p.uhid||"", p._branchLabel||"", d.wardName||p.dept||"", d.doa?new Date(d.doa).toLocaleDateString("en-IN"):(p.admissions?.[0]?.dateTime?new Date(p.admissions[0].dateTime).toLocaleDateString("en-IN"):"—"), d.dod?new Date(d.dod).toLocaleDateString("en-IN"):"—", d.dod?"Discharged":"Admitted", ds.type||"Normal", ds.doctorName||d.doctorName||"—", p.phone||""];
  });
  const wsData = [["SANGI HOSPITAL — IPD PATIENT HISTORY RECORD"],["ESIC RAYA  |  Generated: "+new Date().toLocaleDateString("en-IN")+"  |  Confidential"],[],headers,...rows,[],["TOTAL PATIENTS",pts.length]];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws["!cols"] = [{wch:6},{wch:22},{wch:6},{wch:8},{wch:16},{wch:14},{wch:12},{wch:13},{wch:13},{wch:12},{wch:13},{wch:18},{wch:14}];
  ws["!merges"] = [{s:{r:0,c:0},e:{r:0,c:12}},{s:{r:1,c:0},e:{r:1,c:12}}];
  const titleStyle = {font:{bold:true,color:{rgb:"FFFFFF"},sz:14,name:"Arial"},fill:{fgColor:{rgb:"1A237E"},patternType:"solid"},alignment:{horizontal:"center",vertical:"center"}};
  const subStyle = {font:{italic:true,color:{rgb:"FFFFFF"},sz:10,name:"Arial"},fill:{fgColor:{rgb:"008B8B"},patternType:"solid"},alignment:{horizontal:"center",vertical:"center"}};
  const headerStyle = {font:{bold:true,color:{rgb:"FFFFFF"},sz:10,name:"Arial"},fill:{fgColor:{rgb:"6A0DAD"},patternType:"solid"},alignment:{horizontal:"center",vertical:"center",wrapText:true},border:{top:{style:"thin"},bottom:{style:"thin"},left:{style:"thin"},right:{style:"thin"}}};
  const footerStyle = {font:{bold:true,color:{rgb:"FFFFFF"},sz:10,name:"Arial"},fill:{fgColor:{rgb:"008B8B"},patternType:"solid"},alignment:{horizontal:"center"}};
  for (let c=0;c<=12;c++){const r0=XLSX.utils.encode_cell({r:0,c});const r1=XLSX.utils.encode_cell({r:1,c});if(!ws[r0])ws[r0]={v:"",t:"s"};if(!ws[r1])ws[r1]={v:"",t:"s"};ws[r0].s=titleStyle;ws[r1].s=subStyle;}
  headers.forEach((_,ci)=>{const ref=XLSX.utils.encode_cell({r:3,c:ci});if(!ws[ref])ws[ref]={v:headers[ci],t:"s"};ws[ref].s=headerStyle;});
  rows.forEach((row,ri)=>{const bgColor=ri%2===0?"E8F5E9":"FFFFFF";row.forEach((_,ci)=>{const ref=XLSX.utils.encode_cell({r:4+ri,c:ci});if(!ws[ref])ws[ref]={v:"",t:"s"};if(ci===9){const isD=row[9]==="Discharged";ws[ref].s={font:{bold:true,color:{rgb:isD?"1B5E20":"F57F17"},sz:9,name:"Arial"},fill:{fgColor:{rgb:isD?"C8E6C9":"FFF9C4"},patternType:"solid"},alignment:{horizontal:"center",vertical:"center"},border:{top:{style:"thin",color:{rgb:"BDBDBD"}},bottom:{style:"thin",color:{rgb:"BDBDBD"}},left:{style:"thin",color:{rgb:"BDBDBD"}},right:{style:"thin",color:{rgb:"BDBDBD"}}}};}else{ws[ref].s={font:{sz:9,name:"Arial",color:{rgb:ci===1?"1A237E":ci===4?"00695C":ci===5?"37474F":"424242"},bold:ci===1},fill:{fgColor:{rgb:bgColor},patternType:"solid"},alignment:{horizontal:ci===1?"left":"center",vertical:"center"},border:{top:{style:"thin",color:{rgb:"BDBDBD"}},bottom:{style:"thin",color:{rgb:"BDBDBD"}},left:{style:"thin",color:{rgb:"BDBDBD"}},right:{style:"thin",color:{rgb:"BDBDBD"}}}};}});});
  const footerRow=4+rows.length+1;for(let c=0;c<=12;c++){const ref=XLSX.utils.encode_cell({r:footerRow,c});if(!ws[ref])ws[ref]={v:"",t:"s"};ws[ref].s=footerStyle;}
  XLSX.utils.book_append_sheet(wb,ws,"Patient History");
  XLSX.writeFile(wb,filename,{bookType:"xlsx",cellStyles:true});
}
function exportCSV(filename, rows, headers) {
  const csv = [headers.join(","), ...rows.map(r => headers.map(h => `"${(r[h] ?? "").toString().replace(/"/g,'""')}"`).join(","))].join("\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = filename; a.click();
}
function exportTxt(filename, content) {
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([content], { type: "text/plain" })); a.download = filename; a.click();
}
function buildDischargeSummaryText(p, branchLabel, ds = {}, mh = {}, meds = [], reps = []) {
  const medLines = meds.map(m => `  - ${m.name} | Qty: ${m.qty} | Rate: ₹${m.rate}`).join("\n");
  const repLines = reps.map(r => `  - ${r.name} (${r.date||""}): ${r.result||""}`).join("\n");
  return `========================================\n  SANGI HOSPITAL — ${branchLabel.toUpperCase()}\n  DISCHARGE SUMMARY [${ds.type||"Normal"}]\n========================================\n\nPatient Name  : ${p.patientName||p.name||""}\nUHID          : ${p.uhid}\nAge / Gender  : ${p.ageYY||p.age||""}Y / ${p.gender||""}\nDepartment    : ${ds.wardName||p.dept||""}\nAdmit Date    : ${fmtDt(p.admissions?.[0]?.dateTime||p.admitDate)}\nDischarge Date: ${ds.dod||ds.date||"—"}\nExpected DOD  : ${ds.expectedDod||"—"}\nTreating Dr.  : ${ds.doctorName||mh.treatingDoctor||"—"}\n\n── CLINICAL ────────────────────────────\nDiagnosis     : ${ds.diagnosis||"—"}\nTreatment     : ${ds.treatment||"—"}\nFollow-up     : ${ds.followUp||"—"}\nNotes         : ${ds.notes||"—"}\n\n── MEDICAL HISTORY ─────────────────────\nPrevious Dx   : ${mh.previousDiagnosis||"—"}\nPast Surgeries: ${mh.pastSurgeries||"—"}\nAllergies     : ${mh.knownAllergies||"—"}\nChronic Cond. : ${mh.chronicConditions||"—"}\nCurrent Meds  : ${mh.currentMedications||"—"}\nSmoking       : ${mh.smokingStatus||"—"}\nAlcohol       : ${mh.alcoholUse||"—"}\n\n── MEDICINES PRESCRIBED ────────────────\n${medLines||"  None"}\n\n── INVESTIGATIONS ──────────────────────\n${repLines||"  None"}\n\n========================================\n  Generated: ${new Date().toLocaleString("en-IN")}\n========================================`;
}

const SEED_MEDS = {
  "laxmi": [[{id:1,name:"Aspirin",qty:30,rate:5},{id:2,name:"Atorvastatin",qty:14,rate:12}],[{id:1,name:"Ibuprofen",qty:20,rate:8},{id:2,name:"Calcium",qty:30,rate:6}]],
  "raya":  [[{id:1,name:"Metformin",qty:60,rate:4},{id:2,name:"Glimepiride",qty:30,rate:9}],[{id:1,name:"Azithromycin",qty:5,rate:25},{id:2,name:"Paracetamol",qty:15,rate:3}]],
};
const SEED_REPS = {
  "laxmi": [[{id:1,name:"ECG",date:"2026-03-29",result:"Normal sinus rhythm"},{id:2,name:"Blood Panel",date:"2026-03-30",result:"Cholesterol elevated"}],[{id:1,name:"X-Ray Knee",date:"2026-03-21",result:"Mild arthritis"}]],
  "raya":  [[{id:1,name:"HbA1c",date:"2026-04-04",result:"8.2%"},{id:2,name:"FBS",date:"2026-04-03",result:"210 mg/dL"}],[{id:1,name:"Chest X-Ray",date:"2026-03-26",result:"Consolidation RLL"}]],
};

function seedPatients(dbBranch, branchKey) {
  return (dbBranch || []).map((p, idx) => ({
    ...p,
    medicines: p.medicines || (SEED_MEDS[branchKey]?.[idx] || []),
    reports:   p.reports   || (SEED_REPS[branchKey]?.[idx]  || []),
    dischargeSummary: p.dischargeSummary || {
      type:"Normal", diagnosis:"", treatment:"", followUp:"", notes:"", doctorName:"", date:"", expectedDod:""
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
  const [exportBranchFilter, setExportBranchFilter] = useState("All");
  const [exportType,         setExportType]          = useState("discharge");
  const [exportSumType,      setExportSumType]       = useState("All");
  const [dischSumFilter, setDischSumFilter] = useState("All");
  const [isDark, setIsDark] = useState(true); // dark mode default

  const toast = (msg, type="ok") => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3000); };

  const locationPatients = allPatients[viewBranch] || [];
  const allAdmissions = useMemo(() => locationPatients.flatMap(p => (p.admissions||[]).map(a => ({ ...a, patientName: p.patientName||p.name, uhid: p.uhid, gender: p.gender, bloodGroup: p.bloodGroup, phone: p.phone }))), [locationPatients]);
  const currentlyAdmitted = allAdmissions.filter(a => !a.discharge?.dod).length;
  const discharged        = allAdmissions.filter(a =>  a.discharge?.dod).length;
  const totalRevenue      = allAdmissions.reduce((s,a) => { const b = a.billing || {}; return s + (parseFloat(b.paidNow)||0) + (parseFloat(b.advance)||0); }, 0);
  const branchColleagues  = useMemo(() => { try { return JSON.parse(localStorage.getItem("hms_dept_users") || "[]").filter(u => u.branch === viewBranch && DEPT_ROLES.includes(u.role)); } catch { return []; } }, [viewBranch]);
  const allPatientsFlat   = useMemo(() => BRANCH_KEYS.flatMap(bk => (allPatients[bk]||[]).map(p => ({ ...p, _branch: bk, _branchLabel: BC[bk].label }))), [allPatients]);

  const updatePatient = (branchKey, patientUhid, updater) => setAllPatients(prev => ({ ...prev, [branchKey]: prev[branchKey].map(p => p.uhid === patientUhid ? updater(p) : p) }));

  const openMedEditor = (p) => { setEditMedPt(JSON.parse(JSON.stringify(p))); setShowMedModal(true); };
  const updateMed = (idx, field, val) => setEditMedPt(prev => { const m = [...prev.medicines]; m[idx] = { ...m[idx], [field]: field === "name" ? val : (+val||0) }; return { ...prev, medicines: m }; });
  const addMedRow = () => setEditMedPt(prev => ({ ...prev, medicines: [...(prev.medicines||[]), { id:Date.now(), name:"", qty:1, rate:0 }] }));
  const delMedRow = (idx) => setEditMedPt(prev => ({ ...prev, medicines: prev.medicines.filter((_,i) => i !== idx) }));
  const saveMeds  = () => { updatePatient(viewBranch, editMedPt.uhid, p => ({ ...p, medicines: editMedPt.medicines })); toast("Medicines saved"); setShowMedModal(false); setEditMedPt(null); };

  const openSummaryEditor = (p) => { setEditSumPt(p); setSummaryForm({ ...(p.dischargeSummary || { type:"Normal", diagnosis:"", treatment:"", followUp:"", notes:"", doctorName:"", date:"", expectedDod:"" }) }); setShowSummaryModal(true); };
  const saveSummary = () => { updatePatient(viewBranch, editSumPt.uhid, p => ({ ...p, dischargeSummary: { ...summaryForm } })); toast("Summary saved"); setShowSummaryModal(false); setEditSumPt(null); };
  const openViewModal = (p) => { setViewPt(p); setShowViewModal(true); };
  const confirmDelete = (p) => { setDeletePt(p); setShowDeleteConfirm(true); };
  const doDeleteSummary = () => { updatePatient(viewBranch, deletePt.uhid, p => ({ ...p, dischargeSummary: { type:"Normal", diagnosis:"", treatment:"", followUp:"", notes:"", doctorName:"", date:"", expectedDod:"" } })); toast("Summary cleared"); setShowDeleteConfirm(false); setDeletePt(null); };

  const openReportEditor = (p) => { setEditRepPt(JSON.parse(JSON.stringify(p))); setNewReport({ name:"", date:"", result:"" }); setShowReportModal(true); };
  const addReport    = () => { if (!newReport.name) return; setEditRepPt(prev => ({ ...prev, reports: [...(prev.reports||[]), { id:Date.now(), ...newReport }] })); setNewReport({ name:"", date:"", result:"" }); };
  const delReport    = (idx) => setEditRepPt(prev => ({ ...prev, reports: prev.reports.filter((_,i) => i !== idx) }));
  const updateReport = (idx, field, val) => setEditRepPt(prev => { const r = [...prev.reports]; r[idx] = { ...r[idx], [field]: val }; return { ...prev, reports: r }; });
  const saveReports  = () => { updatePatient(viewBranch, editRepPt.uhid, p => ({ ...p, reports: editRepPt.reports })); toast("Reports saved"); setShowReportModal(false); setEditRepPt(null); };

  const getExportPatients = () => { let pts = exportBranchFilter === "All" ? allPatientsFlat : allPatientsFlat.filter(p => p._branchLabel === exportBranchFilter); if (exportSumType !== "All") pts = pts.filter(p => p.dischargeSummary?.type === exportSumType); return pts; };
  const doExport = () => {
    const pts = getExportPatients(); if (pts.length === 0) { toast("No records match","warn"); return; }
    if (exportType === "discharge") { pts.forEach(p => { const adm = p.admissions?.[0] || {}; const ds = p.dischargeSummary || {}; const mh = adm.medicalHistory || p.medicalHistory || {}; exportTxt(`discharge_${p.uhid}.txt`, buildDischargeSummaryText(p, p._branchLabel, { ...adm.discharge, ...ds }, mh, p.medicines||[], p.reports||[])); }); toast(`Exported ${pts.length} discharge summary(s)`); }
    else if (exportType === "medical") { pts.forEach(p => { const adm = p.admissions?.[0] || {}; const mh = adm.medicalHistory || p.medicalHistory || {}; exportTxt(`medhistory_${p.uhid}.txt`, `SANGI HOSPITAL — ${p._branchLabel}\nMEDICAL HISTORY\n\nPatient: ${p.patientName||p.name}\nUHID: ${p.uhid}\n\nPrevious Dx: ${mh.previousDiagnosis||"—"}\nPast Surgeries: ${mh.pastSurgeries||"—"}\nAllergies: ${mh.knownAllergies||"—"}\nChronic: ${mh.chronicConditions||"—"}\nCurrent Meds: ${mh.currentMedications||"—"}\nSmoking: ${mh.smokingStatus||"—"}\nAlcohol: ${mh.alcoholUse||"—"}\nNotes: ${mh.notes||"—"}`); }); toast(`Exported ${pts.length} file(s)`); }
    else if (exportType === "medicines") { exportCSV("medicines_export.csv", pts.flatMap(p => (p.medicines||[]).map(m => ({ Branch:p._branchLabel, Patient:p.patientName||p.name, UHID:p.uhid, Medicine:m.name, Qty:m.qty, Rate:m.rate, Total:m.qty*m.rate }))), ["Branch","Patient","UHID","Medicine","Qty","Rate","Total"]); toast("Medicines CSV exported"); }
    else if (exportType === "reports") { exportCSV("reports_export.csv", pts.flatMap(p => (p.reports||[]).map(r => ({ Branch:p._branchLabel, Patient:p.patientName||p.name, UHID:p.uhid, Report:r.name, Date:r.date, Result:r.result }))), ["Branch","Patient","UHID","Report","Date","Result"]); toast("Reports CSV exported"); }
    else if (exportType === "patientHistory") { exportPatientHistoryXLSX(pts, "patient_history.xlsx"); toast("Patient history Excel exported ✓"); }
  };

  // ── Theme tokens (dark / light) ──────────────────────────────────────────
  const T = isDark ? {
    bgPage:   "#0d0e12", bgSurf:  "#111318", bgCard:  "#13161f",
    bdr:      "#1e2a3a", bdr2:    "#1a2540",
    txt:      "#e2e8f0", txts:    "#64748b", txtm:    "#94a3b8", txtt:    "#2d3a50",
    txtHigh:  "#f1f5f9",
    modalBg:  "#13161f", modalBdr:"#1a2540",
    backdrop: "rgba(0,0,0,0.7)",
    notifOk:  "#052e1c", notifErr:"#3b0f05",
  } : {
    bgPage:   "#f4f6fa", bgSurf:  "#ffffff", bgCard:  "#ffffff",
    bdr:      "#e2e8f0", bdr2:    "#cbd5e1",
    txt:      "#1e293b", txts:    "#64748b", txtm:    "#475569", txtt:    "#94a3b8",
    txtHigh:  "#0f172a",
    modalBg:  "#ffffff", modalBdr:"#e2e8f0",
    backdrop: "rgba(15,23,42,0.6)",
    notifOk:  "#f0fdf4", notifErr:"#fef2f2",
  };

  const c = {
    wrap:      { display:"flex", flexDirection:"column", height:"100vh", background:T.bgPage, fontFamily:"'DM Sans','Segoe UI',sans-serif", color:T.txt, overflow:"hidden" },
    hdr:       { height:54, background:T.bgPage, borderBottom:`1px solid ${T.bdr}`, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 18px", flexShrink:0, zIndex:10 },
    body:      { display:"flex", flex:1, overflow:"hidden" },
    sb:        { width:collapsed?52:210, background:T.bgSurf, borderRight:`1px solid ${T.bdr}`, display:"flex", flexDirection:"column", transition:"width 0.22s ease", flexShrink:0, overflow:"hidden" },
    sbTop:     { padding:collapsed?"14px 8px":"14px 12px", borderBottom:`1px solid ${T.bdr}`, flexShrink:0 },
    sbLabel:   { fontSize:9, fontWeight:700, color:T.txtt, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:7, paddingLeft:2 },
    bsWrap:    { background:T.bgPage, border:"1px solid #1e2030", borderRadius:9, overflow:"hidden" },
    bsBtn:     (bk) => ({ width:"100%", display:"flex", alignItems:"center", gap:8, padding:collapsed?"9px 0":"9px 11px", justifyContent:collapsed?"center":"flex-start", background:viewBranch===bk?BC[bk].dim:"transparent", borderLeft:viewBranch===bk?`2px solid ${BC[bk].accent}`:"2px solid transparent", cursor:"pointer", border:"none", color:viewBranch===bk?BC[bk].accent:T.txts, fontSize:12, fontWeight:viewBranch===bk?700:400, transition:"all 0.15s" }),
    bsDot:     (bk) => ({ width:7, height:7, borderRadius:"50%", background:BC[bk].accent, flexShrink:0 }),
    navWrap:   { flex:1, padding:"10px 0", overflowY:"auto" },
    navSection:{ fontSize:9, fontWeight:700, color:T.txtt, letterSpacing:"0.1em", textTransform:"uppercase", padding:collapsed?"0":"0 14px", marginBottom:5, marginTop:4, textAlign:collapsed?"center":"left" },
    navItem:   (active) => ({ display:"flex", alignItems:"center", gap:9, padding:collapsed?"10px 0":"10px 14px", justifyContent:collapsed?"center":"flex-start", cursor:"pointer", fontSize:12, fontWeight:active?600:400, color:active?T.txtHigh:T.txts, background:active?isDark?"#00000008":"#00000008":"transparent", borderLeft:active?`2px solid ${accent}`:"2px solid transparent", transition:"all 0.15s", whiteSpace:"nowrap" }),
    navIcon:   { fontSize:14, flexShrink:0, width:16, textAlign:"center" },
    sbBot:     { padding:collapsed?"10px 8px":"10px 12px", borderTop:`1px solid ${T.bdr}`, flexShrink:0 },
    colBtn:    { width:"100%", background:"transparent", border:"1px solid #1e2030", borderRadius:7, color:T.txtt, cursor:"pointer", padding:"6px", fontSize:12, display:"flex", alignItems:"center", justifyContent:"center" },
    main:      { flex:1, overflowY:"auto", padding:"22px 26px" },
    logoRow:   { display:"flex", alignItems:"center", gap:10 },
    logoIcon:  { width:30, height:30, borderRadius:8, background:"linear-gradient(135deg,#f59e0b,#22d3ee)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13, color:"#fff" },
    logoText:  { fontSize:14, fontWeight:700, color:T.txtHigh },
    logoSub:   { fontSize:9, color:T.txtt },
    hdrRight:  { display:"flex", alignItems:"center", gap:14 },
    roleBadge: { background:`${accent}18`, border:`1px solid ${accent}30`, color:accent, fontSize:9, fontWeight:700, padding:"3px 9px", borderRadius:20, letterSpacing:"0.07em" },
    deptBadge: { background:"#c084fc18", border:"1px solid #c084fc30", color:"#c084fc", fontSize:9, fontWeight:700, padding:"3px 9px", borderRadius:20, letterSpacing:"0.07em" },
    avatar:    { width:30, height:30, borderRadius:"50%", background:`linear-gradient(135deg,${accent},#c084fc)`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:11, color:"#fff" },
    logoutBtn: { background:"transparent", border:`1px solid ${T.bdr}`, color:T.txts, padding:"5px 13px", borderRadius:8, cursor:"pointer", fontSize:11, fontWeight:500, display:"flex", alignItems:"center", gap:5 },
    pgLabel:   { fontSize:10, fontWeight:700, color:T.txtt, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 },
    bPill:     { display:"inline-flex", alignItems:"center", gap:5, background:bc.dim, border:`1px solid ${bc.border}`, color:accent, fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:20, marginBottom:18, letterSpacing:"0.04em" },
    statGrid:  { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:12, marginBottom:20 },
    statCard:  (a) => ({ background:T.bgCard, border:`1px solid ${a||T.bdr}`, borderRadius:11, padding:"14px 16px" }),
    statNum:   (col) => ({ fontSize:22, fontWeight:700, color:col||T.txtHigh, lineHeight:1.2, marginBottom:3 }),
    statLabel: { fontSize:10, color:T.txts, fontWeight:500 },
    statSub:   { fontSize:9, color:T.txtt, marginTop:1 },
    card:      { background:T.bgCard, border:`1px solid ${T.bdr}`, borderRadius:13, padding:"16px 18px", marginBottom:18 },
    cardRow:   { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 },
    cardTitle: { fontSize:12, fontWeight:600, color:T.txt },
    tbl:       { width:"100%", borderCollapse:"collapse" },
    th:        { textAlign:"left", fontSize:9, color:T.txtt, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", padding:"0 9px 9px", borderBottom:"1px solid #1e2030" },
    td:        { padding:"10px 9px", borderBottom:"1px solid #1e203050", fontSize:11, color:T.txtm, verticalAlign:"middle" },
    badge:     (bc2) => ({ display:"inline-block", background:bc2+"20", color:bc2, border:`1px solid ${bc2}40`, fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:20, whiteSpace:"nowrap" }),
    aBtn:      (bc2) => ({ background:"transparent", border:`1px solid ${bc2}40`, color:bc2, padding:"3px 9px", borderRadius:6, cursor:"pointer", fontSize:10, fontWeight:600 }),
    roBanner:  { background:"#c084fc10", border:"1px solid #c084fc30", borderRadius:8, padding:"8px 14px", marginBottom:16, fontSize:10, color:"#c084fc", fontWeight:600 },
    empty:     { textAlign:"center", padding:"2rem", color:T.txtt, fontSize:12 },
    profCard:  { background:T.bgSurf, border:`1px solid ${accent}30`, borderRadius:13, padding:"22px 20px", marginBottom:16 },
    bigAv:     { width:56, height:56, borderRadius:"50%", background:`linear-gradient(135deg,${accent},#c084fc)`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:18, color:"#fff", flexShrink:0 },
    modal:     { position:"fixed", inset:0, background:"T.backdrop", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100 },
    modalBox:  { background:T.bgCard, border:"1px solid #282a38", borderRadius:16, padding:"22px", width:520, maxWidth:"94vw", maxHeight:"90vh", overflowY:"auto" },
    modalBoxWide:{ background:T.bgCard, border:"1px solid #282a38", borderRadius:16, padding:"22px", width:640, maxWidth:"96vw", maxHeight:"92vh", overflowY:"auto" },
    modalTitle:{ fontSize:14, fontWeight:700, color:T.txtHigh, marginBottom:16 },
    lbl:       { display:"block", fontSize:9, color:T.txts, fontWeight:700, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:4 },
    inp:       { width:"100%", background:T.bgSurf, border:"1px solid #282a38", borderRadius:7, padding:"8px 10px", color:T.txt, fontSize:11, marginBottom:12, boxSizing:"border-box", outline:"none" },
    sel:       { width:"100%", background:T.bgSurf, border:"1px solid #282a38", borderRadius:7, padding:"8px 10px", color:T.txt, fontSize:11, marginBottom:12, boxSizing:"border-box", outline:"none" },
    mFoot:     { display:"flex", gap:9, marginTop:8 },
    cancelBtn: { flex:1, background:"transparent", border:"1px solid #282a38", color:T.txts, padding:"8px", borderRadius:7, cursor:"pointer", fontSize:11 },
    saveBtn:   { flex:1, background:`linear-gradient(135deg,${accent},${accent}cc)`, border:"none", color:"#0d0e12", padding:"8px", borderRadius:7, cursor:"pointer", fontSize:11, fontWeight:700 },
    dangerBtn: { flex:1, background:"#f8717118", border:"1px solid #f8717150", color:"#f87171", padding:"8px", borderRadius:7, cursor:"pointer", fontSize:11, fontWeight:700 },
    g2:        { display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 },
    g3:        { display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 },
    inpSm:     { background:T.bgSurf, border:"1px solid #282a38", borderRadius:6, padding:"5px 7px", color:T.txt, fontSize:11, outline:"none", width:"100%" },
    sectionLabel:{ fontSize:9, fontWeight:700, color:T.txtt, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:9, marginTop:2, paddingBottom:5, borderBottom:"1px solid #1e2030" },
    notif:     (t) => ({ position:"fixed", top:14, right:14, background:t==="ok"?T.notifOk:T.notifErr, border:`1px solid ${t==="ok"?"#34d399":"#f87171"}`, color:t==="ok"?"#86efac":"#fca5a5", padding:"9px 16px", borderRadius:9, fontSize:11, fontWeight:600, zIndex:999 }),
    addBtn:    { background:`linear-gradient(135deg,${accent},${accent}cc)`, border:"none", color:"#0d0e12", padding:"6px 13px", borderRadius:7, cursor:"pointer", fontSize:11, fontWeight:700 },
    filterRow: { display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" },
    filterBtn: (active, col) => ({ background:active?(col||accent)+"20":"transparent", border:`1px solid ${active?(col||accent)+"50":T.bdr2}`, color:active?(col||accent):T.txts, padding:"4px 12px", borderRadius:20, cursor:"pointer", fontSize:10, fontWeight:active?700:400, transition:"all 0.15s" }),
    viewRow:   { display:"grid", gridTemplateColumns:"130px 1fr", gap:6, padding:"6px 0", borderBottom:"1px solid #1e203050" },
    viewKey:   { fontSize:10, color:T.txts, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" },
    viewVal:   { fontSize:11, color:T.txt },
    summaryTypePill: (type) => { const m = SUMMARY_META[type] || { color:"#6b7280", bg:"#6b728018" }; return { display:"inline-flex", alignItems:"center", gap:5, background:m.bg, border:`1px solid ${m.color}40`, color:m.color, fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:20 }; },
    // Expected DOD pill style
    expDodPill: { display:"inline-flex", alignItems:"center", gap:4, background:"#22d3ee18", border:"1px solid #22d3ee40", color:"#22d3ee", fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:20 },
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
      <div style={{ background:isDark?"linear-gradient(135deg,#0d0e12 60%,#1a1040)":"linear-gradient(135deg,#f5f3ff 60%,#ede9fe)", border:`1px solid ${accent}25`, borderRadius:16, padding:"28px 24px", marginBottom:20, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-30, right:-30, width:140, height:140, borderRadius:"50%", background:`${accent}08`, pointerEvents:"none" }}/>
        <div style={{ display:"flex", alignItems:"center", gap:20 }}>
          <div style={{ position:"relative" }}>
            <div style={{ ...c.bigAv, width:72, height:72, fontSize:26, boxShadow:`0 0 0 4px ${accent}25` }}>{initials(currentUser?.name)}</div>
            <div style={{ position:"absolute", bottom:2, right:2, width:12, height:12, borderRadius:"50%", background:"#34d399", border:`2px solid ${T.bgPage}` }}/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:20, fontWeight:700, color:T.txtHigh, marginBottom:4, letterSpacing:"-0.3px" }}>{currentUser?.name}</div>
            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
              <span style={{ ...c.badge(accent), fontSize:10, padding:"3px 10px" }}>{currentUser?.dept||currentUser?.role?.toUpperCase()}</span>
              <span style={{ ...c.badge("#34d399"), fontSize:10, padding:"3px 10px" }}>● Active</span>
              <span style={{ fontSize:10, color:T.txts }}>{bc.label} Branch</span>
            </div>
            <div style={{ fontSize:10, color:T.txtt, marginTop:6, fontFamily:"monospace", letterSpacing:"0.05em" }}>ID: {currentUser?.id}</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:10, color:T.txts, marginBottom:4 }}>Today</div>
            <div style={{ fontSize:12, fontWeight:600, color:T.txtm }}>{new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</div>
          </div>
        </div>
      </div>
      <div style={c.statGrid}>
        {[
          { label:"Branch Patients",    sub:"All records", val:locationPatients.length,  col:accent,    icon:<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
          { label:"Total Admissions",   sub:"All time",    val:allAdmissions.length,      col:"#22d3ee", icon:<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
          { label:"Currently Admitted", sub:"Active",      val:currentlyAdmitted,          col:"#34d399", icon:<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/><line x1="12" y1="15" x2="12" y2="17"/></svg> },
          { label:"Discharged",         sub:"Completed",   val:discharged,                 col:"#8b949e", icon:<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="20 6 9 17 4 12"/></svg> },
          { label:"Revenue Collected",  sub:bc.label,      val:fmt(totalRevenue),          col:"#f59e0b", icon:<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
          { label:"Colleagues",         sub:"Same branch", val:branchColleagues.length,    col:"#c084fc", icon:<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
        ].map((s,i) => (
          <div key={i} style={{ ...c.statCard(s.col+"15"), borderTop:`3px solid ${s.col}`, position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:8, right:10, opacity:0.2, color:s.col }}>{s.icon}</div>
            <div style={{ fontSize:10, color:s.col, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>{s.label}</div>
            <div style={{ fontSize:26, fontWeight:800, color:s.col, lineHeight:1, marginBottom:4 }}>{s.val}</div>
            <div style={{ fontSize:10, color:T.txts }}>{s.sub}</div>
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
                    <td style={c.td}><strong style={{ color:T.txtHigh }}>{p.patientName||p.name}</strong><div style={{ fontSize:9, color:T.txtt }}>{p.gender} · {p.ageYY||p.age}y · {p.bloodGroup}</div></td>
                    <td style={{ ...c.td, fontFamily:"monospace", fontSize:10, color:T.txtt }}>{p.uhid}</td>
                    <td style={c.td}>{d.wardName||"—"}<div style={{ fontSize:9, color:T.txtt }}>{d.bedNo}</div></td>
                    <td style={{ ...c.td, fontSize:10 }}>{d.doctorName||"—"}</td>
                    <td style={c.td}><span style={{ ...c.badge(summaryColor(p.dischargeSummary?.type)), cursor:"pointer" }} onClick={() => openSummaryEditor(p)}>{p.dischargeSummary?.type||"Set"}</span></td>
                    <td style={c.td}><span style={c.badge(status==="Admitted"?"#34d399":"#8b949e")}>{status}</span></td>
                    <td style={{ ...c.td, fontSize:10, color:T.txtt }}>{fmtDt(last?.dateTime)}</td>
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
        {[{ label:"Total",val:allAdmissions.length,col:accent,acc:accent+"18"},{ label:"Admitted",val:currentlyAdmitted,col:"#34d399",acc:"#34d39918"},{ label:"Discharged",val:discharged,col:"#8b949e",acc:"#8b949e18"}].map((s,i) => (
          <div key={i} style={{ ...c.statCard(s.acc), padding:"10px 14px" }}>
            <div style={{ fontSize:16, fontWeight:700, color:s.col }}>{s.val}</div>
            <div style={c.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={c.card}>
        {locationPatients.length === 0 ? <div style={c.empty}>No patients for {bc.label}.</div> : (
          <table style={c.tbl}>
            <thead><tr>{["Patient/UHID","Contact","Ward/Bed","Doctor","Summary","DOA","DOD","Status","Actions"].map(h=><th key={h} style={c.th}>{h}</th>)}</tr></thead>
            <tbody>
              {locationPatients.flatMap((p,pi) => (p.admissions||[]).map((adm,ai) => {
                const d = adm.discharge || {}; const status = d.dod ? "Discharged" : "Admitted";
                return (
                  <tr key={`${pi}-${ai}`}>
                    <td style={c.td}><strong style={{ color:T.txtHigh, display:"block" }}>{p.patientName||p.name}</strong><span style={{ fontFamily:"monospace", fontSize:9, color:T.txtt }}>{p.uhid}</span></td>
                    <td style={{ ...c.td, fontSize:10 }}><div>{p.phone}</div><div style={{ color:T.txtt, fontSize:9 }}>{p.email}</div></td>
                    <td style={c.td}>{d.wardName||"—"}<div style={{ fontSize:9, color:T.txtt }}>{d.bedNo}</div></td>
                    <td style={{ ...c.td, fontSize:10 }}>{d.doctorName||"—"}</td>
                    <td style={c.td}><span style={{ ...c.badge(summaryColor(p.dischargeSummary?.type)), cursor:"pointer" }} onClick={() => openSummaryEditor(p)}>{p.dischargeSummary?.type||"Set ✎"}</span></td>
                    <td style={{ ...c.td, fontSize:10, color:T.txtt }}>{fmtDt(d.doa)}</td>
                    <td style={{ ...c.td, fontSize:10, color:T.txtt }}>{fmtDt(d.dod)}</td>
                    <td style={c.td}><span style={c.badge(status==="Admitted"?"#34d399":"#8b949e")}>{status}</span></td>
                    <td style={c.td}>
                      <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                        <button style={c.aBtn("#34d399")} onClick={() => openMedEditor(p)}>Meds</button>
                        <button style={c.aBtn("#22d3ee")} onClick={() => openReportEditor(p)}>Reports</button>
                        <button style={c.aBtn("#f59e0b")} onClick={() => { const ds = p.dischargeSummary || {}; const mh = adm.medicalHistory || {}; exportTxt(`discharge_${p.uhid}.txt`, buildDischargeSummaryText(p, bc.label, { ...d, ...ds }, mh, p.medicines||[], p.reports||[])); toast("Downloaded"); }}>↓</button>
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  // ── DISCHARGE SUMMARY (dedicated tab) — WITH EXPECTED DOD ─────────────────
  const renderDischarge = () => {
    const summaryStats = SUMMARY_TYPES.reduce((acc, t) => { acc[t] = locationPatients.filter(p => p.dischargeSummary?.type === t).length; return acc; }, {});
    const unset = locationPatients.filter(p => !p.dischargeSummary?.diagnosis).length;
    const filtered = dischSumFilter === "All" ? locationPatients : locationPatients.filter(p => p.dischargeSummary?.type === dischSumFilter);

    return (
      <div>
        <BranchHeader title="Discharge Summaries" />
        <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:16 }}>
          {[
            { label:"Total",   val:locationPatients.length, col:accent,   acc:accent+"18" },
            ...SUMMARY_TYPES.map(t => ({ label:t, val:summaryStats[t]||0, col:SUMMARY_META[t].color, acc:SUMMARY_META[t].bg })),
            { label:"Pending", val:unset, col:"#64748b", acc:"#64748b18" },
          ].map((s,i) => (
            <div key={i} style={{ ...c.statCard(s.acc), padding:"10px 14px", minWidth:90 }}>
              <div style={{ fontSize:18, fontWeight:700, color:s.col }}>{s.val}</div>
              <div style={c.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ marginBottom:14 }}>
          <select value={dischSumFilter} onChange={e => setDischSumFilter(e.target.value)}
            style={{ padding:"7px 28px 7px 12px", borderRadius:8, border:`1px solid ${T.bdr2}`,
              background:T.bgCard, color:T.txt, fontSize:12, fontWeight:600, cursor:"pointer",
              outline:"none", appearance:"none",
              backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23888'/%3E%3C/svg%3E")`,
              backgroundRepeat:"no-repeat", backgroundPosition:"right 10px center" }}>
            <option value="All">All Types</option>
            {SUMMARY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={c.card}>
          <div style={c.cardRow}>
            <div style={c.cardTitle}>{filtered.length} Record{filtered.length!==1?"s":""} — {bc.label}</div>
            <button style={c.aBtn("#f59e0b")} onClick={() => { filtered.forEach(p => { const adm = p.admissions?.[0] || {}; const ds = p.dischargeSummary || {}; const mh = adm.medicalHistory || {}; exportTxt(`discharge_${p.uhid}.txt`, buildDischargeSummaryText(p, bc.label, { ...adm.discharge, ...ds }, mh, p.medicines||[], p.reports||[])); }); toast(`Downloaded ${filtered.length} summaries`); }}>↓ Export All</button>
          </div>
          {filtered.length === 0 ? <div style={c.empty}>No summaries match this filter.</div> : (
            <table style={c.tbl}>
              <thead>
                <tr>{["Patient","UHID","Type","Diagnosis","Doctor","Discharge Date","Exp. DOD","Meds","Reports","Actions"].map(h=><th key={h} style={c.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const ds  = p.dischargeSummary || {};
                  const adm = p.admissions?.[0] || {};
                  const d   = adm.discharge || {};
                  return (
                    <tr key={i} style={{ background:i%2===0?"transparent":"#ffffff03" }}>
                      <td style={c.td}><strong style={{ color:T.txtHigh, display:"block" }}>{p.patientName||p.name}</strong><div style={{ fontSize:9, color:T.txtt }}>{p.gender} · {p.ageYY||p.age}y</div></td>
                      <td style={{ ...c.td, fontFamily:"monospace", fontSize:10, color:T.txtt }}>{p.uhid}</td>
                      <td style={c.td}>
                        <span style={c.summaryTypePill(ds.type)}>
                          <span style={{ width:5, height:5, borderRadius:"50%", background:SUMMARY_META[ds.type]?.color||"#6b7280", display:"inline-block" }}/>
                          {ds.type||"Normal"}
                        </span>
                      </td>
                      <td style={{ ...c.td, maxWidth:140 }}>
                        {ds.diagnosis ? <span style={{ color:T.txt, fontSize:11 }}>{ds.diagnosis}</span> : <span style={{ color:T.txtt, fontStyle:"italic", fontSize:10 }}>Not set</span>}
                      </td>
                      <td style={{ ...c.td, fontSize:10 }}>{ds.doctorName||d.doctorName||"—"}</td>
                      <td style={{ ...c.td, fontSize:10, color:T.txtt }}>{fmtDt(ds.date||d.dod)}</td>
                      {/* ── EXPECTED DOD COLUMN ── */}
                      <td style={c.td}>
                        {(ds.expectedDod||d.expectedDod)
                          ? <span style={c.expDodPill}>⏱ {fmtDt(ds.expectedDod||d.expectedDod)}</span>
                          : <span style={{ color:T.txtt, fontSize:10 }}>—</span>}
                      </td>
                      <td style={c.td}><span style={c.badge("#34d399")}>{(p.medicines||[]).length}</span></td>
                      <td style={c.td}><span style={c.badge("#22d3ee")}>{(p.reports||[]).length}</span></td>
                      <td style={c.td}>
                        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                          <button style={c.aBtn("#22d3ee")} onClick={() => openViewModal(p)}>View</button>
                          <button style={c.aBtn(accent)} onClick={() => openSummaryEditor(p)}>Edit</button>
                          <button style={c.aBtn("#f59e0b")} onClick={() => { const mh = adm.medicalHistory || {}; exportTxt(`discharge_${p.uhid}.txt`, buildDischargeSummaryText(p, bc.label, { ...d, ...ds }, mh, p.medicines||[], p.reports||[])); toast("Downloaded"); }}>↓</button>
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
      {locationPatients.map(p => { const medTotal = (p.medicines||[]).reduce((s,m) => s+(m.qty*m.rate), 0); return (
        <div key={p.uhid} style={c.card}>
          <div style={c.cardRow}>
            <div><div style={{ fontSize:12, fontWeight:700, color:T.txtHigh }}>{p.patientName||p.name}</div><div style={{ fontSize:9, color:T.txtt, marginTop:2 }}>{p.uhid} · <span style={{ color:"#f59e0b" }}>{fmt(medTotal)} total</span></div></div>
            <button style={c.addBtn} onClick={() => openMedEditor(p)}>Edit Medicines</button>
          </div>
          {(p.medicines||[]).length === 0 ? <div style={c.empty}>No medicines.</div> : (
            <table style={c.tbl}>
              <thead><tr>{["Medicine","Qty","Rate/unit","Total"].map(h=><th key={h} style={c.th}>{h}</th>)}</tr></thead>
              <tbody>{(p.medicines||[]).map((m,i) => <tr key={i}><td style={c.td}><strong style={{ color:T.txtHigh }}>{m.name}</strong></td><td style={c.td}><span style={c.badge(accent)}>{m.qty}</span></td><td style={c.td}>{fmt(m.rate)}</td><td style={c.td}><span style={{ color:"#f59e0b", fontWeight:700 }}>{fmt(m.qty*m.rate)}</span></td></tr>)}</tbody>
            </table>
          )}
        </div>
      ); })}
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
            <div><div style={{ fontSize:12, fontWeight:700, color:T.txtHigh }}>{p.patientName||p.name}</div><div style={{ fontSize:9, color:T.txtt, marginTop:2 }}>{p.uhid} · {(p.reports||[]).length} report(s)</div></div>
            <div style={{ display:"flex", gap:8 }}>
              <button style={c.aBtn("#f59e0b")} onClick={() => { exportCSV(`reports_${p.uhid}.csv`, (p.reports||[]).map(r => ({ Report:r.name, Date:r.date, Result:r.result })), ["Report","Date","Result"]); toast("Downloaded"); }}>↓ CSV</button>
              <button style={c.addBtn} onClick={() => openReportEditor(p)}>Edit</button>
            </div>
          </div>
          {(p.reports||[]).length === 0 ? <div style={c.empty}>No reports.</div> : (
            <table style={c.tbl}>
              <thead><tr>{["Report","Date","Result"].map(h=><th key={h} style={c.th}>{h}</th>)}</tr></thead>
              <tbody>{(p.reports||[]).map((r,i) => <tr key={i}><td style={c.td}><strong style={{ color:T.txtHigh }}>{r.name}</strong></td><td style={{ ...c.td, fontSize:10, color:T.txtt }}>{r.date}</td><td style={c.td}>{r.result}</td></tr>)}</tbody>
            </table>
          )}
        </div>
      ))}
      {locationPatients.length === 0 && <div style={{ ...c.card, ...c.empty }}>No patients.</div>}
    </div>
  );

  // ── BILLING ───────────────────────────────────────────────────────────────
  const renderBilling = () => {
    const billRows = locationPatients.flatMap(p => (p.admissions||[]).filter(a => a.billing && (parseFloat(a.billing.paidNow)||0)+(parseFloat(a.billing.advance)||0) > 0).map(a => ({ patient:p.patientName||p.name, uhid:p.uhid, admNo:a.admNo, advance:parseFloat(a.billing.advance)||0, paidNow:parseFloat(a.billing.paidNow)||0, discount:parseFloat(a.billing.discount)||0, mode:a.billing.paymentMode||"—", total:(parseFloat(a.billing.advance)||0)+(parseFloat(a.billing.paidNow)||0) })));
    const grandTotal = billRows.reduce((s,r) => s+r.total, 0);
    const totalAdv   = billRows.reduce((s,r) => s+r.advance, 0);
    return (
      <div>
        <BranchHeader title="Billing" />
        <div style={c.statGrid}>
          {[{ label:"Total Collected",val:fmt(grandTotal),col:"#f59e0b",acc:"#f59e0b18"},{ label:"Advance",val:fmt(totalAdv),col:"#22d3ee",acc:"#22d3ee18"},{ label:"Records",val:billRows.length,col:"#34d399",acc:"#34d39918"}].map((s,i) => (
            <div key={i} style={c.statCard(s.acc)}><div style={c.statNum(s.col)}>{s.val}</div><div style={c.statLabel}>{s.label}</div></div>
          ))}
        </div>
        <div style={c.card}>
          {billRows.length === 0 ? <div style={c.empty}>No billing records.</div> : (
            <table style={c.tbl}>
              <thead><tr>{["Patient","UHID","Adm#","Advance","Paid","Discount","Mode","Total"].map(h=><th key={h} style={c.th}>{h}</th>)}</tr></thead>
              <tbody>{billRows.map((r,i) => <tr key={i}><td style={c.td}><strong style={{ color:T.txtHigh }}>{r.patient}</strong></td><td style={{ ...c.td, fontFamily:"monospace", fontSize:10, color:T.txtt }}>{r.uhid}</td><td style={c.td}><span style={c.badge(accent)}>#{r.admNo}</span></td><td style={c.td}><span style={{ color:"#22d3ee", fontWeight:700 }}>{fmt(r.advance)}</span></td><td style={c.td}><span style={{ color:"#34d399", fontWeight:700 }}>{fmt(r.paidNow)}</span></td><td style={c.td}>{r.discount>0?<span style={{ color:"#c084fc" }}>{fmt(r.discount)}</span>:<span style={{ color:T.bdr }}>—</span>}</td><td style={{ ...c.td, fontSize:10 }}>{r.mode}</td><td style={c.td}><span style={{ color:"#f59e0b", fontWeight:700 }}>{fmt(r.total)}</span></td></tr>)}</tbody>
            </table>
          )}
        </div>
      </div>
    );
  };

  // ── EXPORT ────────────────────────────────────────────────────────────────
  const renderExport = () => {
    const exportOptions = [{ id:"discharge",label:"Discharge Summary",desc:"Full clinical summary .txt per patient",icon:"📋"},{ id:"medical",label:"Medical History",desc:"Medical history .txt per patient",icon:"🏥"},{ id:"medicines",label:"Medicines",desc:"Medicines with qty & rates as .csv",icon:"💊"},{ id:"reports",label:"Investigation Reports",desc:"Lab/radiology results as .csv",icon:"🔬"},{ id:"patientHistory",label:"Patient History",desc:"Full patient list as .xlsx",icon:"📊"}];
    const previewPts = getExportPatients();
    return (
      <div>
        <div style={{ marginBottom:18 }}><div style={c.pgLabel}>Export</div><div style={{ fontSize:10, color:T.txts }}>Download summaries and data for any branch</div></div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
          <div style={c.card}>
            <div style={{ ...c.sectionLabel, marginBottom:12 }}>Filters</div>
            <label style={c.lbl}>Branch</label>
            <select style={c.sel} value={exportBranchFilter} onChange={e=>setExportBranchFilter(e.target.value)}><option value="All">All Branches</option><option value="Laxmi Nagar">Laxmi Nagar</option><option value="Raya">Raya</option></select>
            <label style={c.lbl}>Summary Type</label>
            <select style={c.sel} value={exportSumType} onChange={e=>setExportSumType(e.target.value)}><option value="All">All Types</option>{SUMMARY_TYPES.map(t=><option key={t}>{t}</option>)}</select>
            <div style={{ fontSize:10, color:T.txts }}>{previewPts.length} patient(s) match</div>
          </div>
          <div style={c.card}>
            <div style={{ ...c.sectionLabel, marginBottom:12 }}>Export Type</div>
            {exportOptions.map(o => <div key={o.id} onClick={() => setExportType(o.id)} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:8, marginBottom:6, cursor:"pointer", background:exportType===o.id?accent+"18":"transparent", border:`1px solid ${exportType===o.id?accent+"50":T.bdr2}`, transition:"all 0.15s" }}><span style={{ fontSize:15 }}>{o.icon}</span><div><div style={{ fontSize:11, fontWeight:700, color:exportType===o.id?accent:T.txt }}>{o.label}</div><div style={{ fontSize:9, color:T.txts }}>{o.desc}</div></div></div>)}
          </div>
        </div>
        <button onClick={doExport} style={{ width:"100%", padding:"13px", background:`linear-gradient(135deg,${accent},${accent}cc)`, border:"none", color:"#0d0e12", borderRadius:10, cursor:"pointer", fontSize:13, fontWeight:700 }}>↓ Download {exportOptions.find(o=>o.id===exportType)?.label} — {previewPts.length} record(s)</button>
        <div style={{ ...c.card, marginTop:16 }}>
          <div style={{ ...c.sectionLabel, marginBottom:10 }}>Quick Download per Patient</div>
          <table style={c.tbl}>
            <thead><tr>{["Patient","Branch","Summary","Discharge","Med Hist","Meds","Reports"].map(h=><th key={h} style={c.th}>{h}</th>)}</tr></thead>
            <tbody>{allPatientsFlat.map(p => <tr key={p.uhid+p._branch}><td style={c.td}><strong style={{ color:T.txtHigh }}>{p.patientName||p.name}</strong><div style={{ fontSize:9, color:T.txtt }}>{p.uhid}</div></td><td style={c.td}><span style={c.badge(BC[p._branch]?.accent||"#6b7280")}>{p._branchLabel}</span></td><td style={c.td}><span style={c.badge(summaryColor(p.dischargeSummary?.type))}>{p.dischargeSummary?.type||"—"}</span></td><td style={c.td}><button style={c.aBtn("#f59e0b")} onClick={()=>{exportTxt(`discharge_${p.uhid}.txt`,buildDischargeSummaryText(p,p._branchLabel,p.dischargeSummary||{},{},p.medicines||[],p.reports||[]));toast("Downloaded");}}>↓</button></td><td style={c.td}><button style={c.aBtn("#34d399")} onClick={()=>{exportTxt(`medhistory_${p.uhid}.txt`,`Medical History\nPatient: ${p.patientName||p.name}\nUHID: ${p.uhid}`);toast("Downloaded");}}>↓</button></td><td style={c.td}><button style={c.aBtn("#22d3ee")} onClick={()=>{exportCSV(`meds_${p.uhid}.csv`,(p.medicines||[]).map(m=>({Medicine:m.name,Qty:m.qty,Rate:m.rate,Total:m.qty*m.rate})),["Medicine","Qty","Rate","Total"]);toast("Downloaded");}}>↓</button></td><td style={c.td}><button style={c.aBtn("#c084fc")} onClick={()=>{exportCSV(`reports_${p.uhid}.csv`,(p.reports||[]).map(r=>({Report:r.name,Date:r.date,Result:r.result})),["Report","Date","Result"]);toast("Downloaded");}}>↓</button></td></tr>)}</tbody>
          </table>
        </div>
      </div>
    );
  };

  // ── PROFILE ───────────────────────────────────────────────────────────────
  const renderProfile = () => (
    <div>
      <BranchHeader title="My Profile" />
      <div style={{ background:isDark?"linear-gradient(135deg,#0d0e12 60%,#1a1040)":"linear-gradient(135deg,#f5f3ff 60%,#ede9fe)", border:`1px solid ${accent}25`, borderRadius:16, padding:"36px 24px 28px", marginBottom:20, display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-40, left:-40, width:160, height:160, borderRadius:"50%", background:`${accent}06`, pointerEvents:"none" }}/>
        <div style={{ position:"absolute", bottom:-30, right:-30, width:120, height:120, borderRadius:"50%", background:"#c084fc06", pointerEvents:"none" }}/>
        <div style={{ position:"relative", marginBottom:14 }}>
          <div style={{ ...c.bigAv, width:88, height:88, fontSize:30, boxShadow:`0 0 0 5px ${accent}20, 0 8px 32px ${accent}30` }}>{initials(currentUser?.name)}</div>
          <div style={{ position:"absolute", bottom:4, right:4, width:16, height:16, borderRadius:"50%", background:"#34d399", border:`3px solid ${T.bgPage}` }}/>
        </div>
        <div style={{ fontSize:22, fontWeight:700, color:T.txtHigh, marginBottom:5, letterSpacing:"-0.3px" }}>{currentUser?.name}</div>
        <div style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap", marginBottom:8 }}>
          <span style={{ ...c.badge(accent), padding:"4px 12px", fontSize:10 }}>{currentUser?.dept||currentUser?.role?.toUpperCase()}</span>
          <span style={{ ...c.badge("#34d399"), padding:"4px 12px", fontSize:10 }}>● Active</span>
        </div>
        <div style={{ fontSize:11, color:T.txts }}>{bc.label} Branch · <span style={{ fontFamily:"monospace" }}>{currentUser?.id}</span></div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
        <div style={{ ...c.card, margin:0 }}>
          <div style={{ fontSize:10, fontWeight:700, color:T.txtt, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:14, paddingBottom:10, borderBottom:`1px solid ${T.bdr}` }}>Account Details</div>
          {[["Employee ID",currentUser?.id,true],["Full Name",currentUser?.name],["Department",currentUser?.dept||"—"],["Role",currentUser?.role],["Home Branch",BC[homeBranch]?.label||homeBranch],["Status","Active"],["Created By",currentUser?.createdBy||"Admin"]].map(([k,v,mono]) => (
            <div key={k} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:`1px solid ${T.bdr}50` }}>
              <span style={{ fontSize:10, color:T.txtt, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>{k}</span>
              <span style={{ fontSize:11, color:T.txtm, fontFamily:mono?"monospace":"inherit", fontWeight:mono?600:400 }}>{v||"—"}</span>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ ...c.card, margin:0, flex:1, borderLeft:`3px solid #34d399` }}>
            <div style={{ fontSize:10, fontWeight:700, color:"#34d399", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12 }}>✓ Permissions</div>
            {["View patients — both branches","Edit medicines (qty & rates)","Edit discharge summaries","Set Expected DOD","Add/edit investigation reports","Export reports & summaries","View billing records"].map((r,i) => (
              <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:7 }}>
                <span style={{ color:"#34d399", fontSize:12, marginTop:1, flexShrink:0 }}>✓</span>
                <span style={{ fontSize:11, color:T.txts, lineHeight:1.4 }}>{r}</span>
              </div>
            ))}
          </div>
          <div style={{ ...c.card, margin:0, borderLeft:"3px solid #f87171" }}>
            <div style={{ fontSize:10, fontWeight:700, color:"#f87171", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12 }}>✕ Restrictions</div>
            {["Add/delete patients","Create user accounts","Manage departments","Approve invoices"].map((r,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
                <span style={{ color:"#f87171", fontSize:12, flexShrink:0 }}>✕</span>
                <span style={{ fontSize:11, color:T.txts }}>{r}</span>
              </div>
            ))}
          </div>
        </div>
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
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0;}::-webkit-scrollbar{width:3px;height:3px;}::-webkit-scrollbar-thumb{background:${isDark?"#282a38":"#cbd5e1"};border-radius:3px;}option{background:${isDark?"#0d0e12":"#ffffff"};}`}</style>
      {notif && <div style={c.notif(notif.type)}>{notif.type==="ok"?"✓ ":"⚠ "}{notif.msg}</div>}

      <header style={c.hdr}>
        <div style={c.logoRow}><img src="/app_icon.png" alt="logo" style={{ width:30, height:30, borderRadius:8, objectFit:"cover" }}/><div><div style={c.logoText}>Sangi Hospital</div><div style={c.logoSub}>{currentUser?.dept||currentUser?.role} · {bc.label}</div></div></div>
        <div style={c.hdrRight}>
          
          <span style={c.roleBadge}>{currentUser?.role?.toUpperCase()}</span>
          <button
            onClick={() => setIsDark(d => !d)}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            style={{ background:"transparent", border:`1px solid ${T.bdr}`, color:T.txts, padding:"5px 10px", borderRadius:8, cursor:"pointer", fontSize:12, lineHeight:1, fontWeight:500, transition:"all 0.2s" }}
          >{isDark ? "Light" : "Dark"}</button>
          <div style={{ display:"flex", alignItems:"center", gap:8, background:isDark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.05)", borderRadius:20, padding:"3px 6px 3px 12px", border:`1px solid ${T.bdr}` }}><span style={{ fontSize:11, color:T.txtm, fontWeight:500 }}>{currentUser?.name}</span><div style={c.avatar}>{initials(currentUser?.name)}</div></div>
          <button style={c.logoutBtn} onClick={onLogout}>↪ Logout</button>
        </div>
      </header>

      <div style={c.body}>
        <aside style={c.sb}>
          <div style={c.sbTop}>
            {!collapsed && <div style={c.sbLabel}>Branch</div>}
            {collapsed ? (
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                {BRANCH_KEYS.map(bk => (
                  <button key={bk} onClick={() => setViewBranch(bk)} title={BC[bk].label}
                    style={{ width:"100%", padding:"7px 0", border:"none", borderRadius:7, cursor:"pointer",
                      background:viewBranch===bk?BC[bk].dim:"transparent",
                      display:"flex", justifyContent:"center" }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:BC[bk].accent }}/>
                  </button>
                ))}
              </div>
            ) : (
              <select
                value={viewBranch}
                onChange={e => setViewBranch(e.target.value)}
                style={{ width:"100%", padding:"8px 28px 8px 10px", borderRadius:8,
                  border:`1px solid ${T.bdr2}`, background:T.bgCard, color:T.txt,
                  fontSize:12, fontWeight:600, cursor:"pointer", outline:"none",
                  appearance:"none",
                  backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23888'/%3E%3C/svg%3E")`,
                  backgroundRepeat:"no-repeat", backgroundPosition:"right 10px center" }}>
                {BRANCH_KEYS.map(bk => (
                  <option key={bk} value={bk}>{BC[bk].label}</option>
                ))}
              </select>
            )}
          </div>
          <nav style={c.navWrap}>
            {!collapsed && <div style={c.navSection}>Menu</div>}
            {NAV.map(item => <div key={item.id} style={c.navItem(activeTab===item.id)} onClick={() => setActiveTab(item.id)} title={item.label}><span style={c.navIcon}>{item.icon}</span>{!collapsed && item.label}</div>)}
          </nav>
          {!collapsed && <div style={{ padding:"10px 12px", borderTop:`1px solid ${T.bdr}`, borderBottom:`1px solid ${T.bdr}` }}><div style={{ fontSize:9, color:T.txtt, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:4 }}>Signed in as</div><div style={{ fontSize:11, color:T.txtm, fontWeight:600 }}>{currentUser?.name}</div><div style={{ fontSize:9, color:T.txts, marginTop:1 }}>{currentUser?.dept||currentUser?.role}</div></div>}
          <div style={c.sbBot}><button style={c.colBtn} onClick={() => setCollapsed(x=>!x)} title={collapsed?"Expand":"Collapse"}>{collapsed?"▶":"◀"}</button></div>
        </aside>
        <main style={c.main}>{renderContent()}</main>
      </div>

      {/* MEDICINES MODAL */}
      {showMedModal && editMedPt && <MedDrawer editMedPt={editMedPt} onClose={()=>{setShowMedModal(false);setEditMedPt(null);}} updateMed={updateMed} addMedRow={addMedRow} delMedRow={delMedRow} saveMeds={saveMeds} fmt={fmt} canEditRate={false} />}

      {/* VIEW MODAL */}
      {showViewModal && viewPt && <div style={c.modal} onClick={e=>e.target===e.currentTarget&&(setShowViewModal(false),setViewPt(null))}><div style={c.modalBoxWide}><div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}><div><div style={c.modalTitle}>Discharge Summary</div><div style={{ display:"flex", alignItems:"center", gap:8 }}><span style={c.summaryTypePill(viewPt.dischargeSummary?.type)}><span style={{ width:5, height:5, borderRadius:"50%", background:SUMMARY_META[viewPt.dischargeSummary?.type]?.color||"#6b7280", display:"inline-block" }}/>{viewPt.dischargeSummary?.type||"Normal"}</span><span style={{ fontSize:10, color:T.txts, fontFamily:"monospace" }}>{viewPt.uhid}</span></div></div><button style={c.logoutBtn} onClick={()=>{setShowViewModal(false);setViewPt(null);}}>✕</button></div><div style={{ ...c.statCard("#f59e0b18"), padding:"12px 14px", marginBottom:14 }}><div style={{ display:"flex", gap:14, flexWrap:"wrap" }}><div><div style={c.viewKey}>Patient</div><div style={{ ...c.viewVal, fontWeight:700, color:T.txtHigh }}>{viewPt.patientName||viewPt.name}</div></div><div><div style={c.viewKey}>Age / Gender</div><div style={c.viewVal}>{viewPt.ageYY||viewPt.age}Y / {viewPt.gender}</div></div><div><div style={c.viewKey}>Blood Group</div><div style={c.viewVal}>{viewPt.bloodGroup||"—"}</div></div><div><div style={c.viewKey}>Phone</div><div style={c.viewVal}>{viewPt.phone||"—"}</div></div><div><div style={c.viewKey}>Admit Date</div><div style={c.viewVal}>{fmtDt(viewPt.admissions?.[0]?.dateTime)}</div></div></div></div><div style={{ ...c.sectionLabel, marginBottom:10 }}>Clinical Details</div>{[["Diagnosis",viewPt.dischargeSummary?.diagnosis],["Treatment",viewPt.dischargeSummary?.treatment],["Treating Doctor",viewPt.dischargeSummary?.doctorName],["Discharge Date",fmtDt(viewPt.dischargeSummary?.date)],["Expected DOD",fmtDt(viewPt.dischargeSummary?.expectedDod)],["Follow-up",viewPt.dischargeSummary?.followUp],["Notes",viewPt.dischargeSummary?.notes]].map(([k,v]) => <div key={k} style={c.viewRow}><div style={c.viewKey}>{k}</div><div style={{ ...c.viewVal, color:v&&v!=="—"?T.txt:T.txtt, fontStyle:v&&v!=="—"?"normal":"italic" }}>{v||"Not set"}</div></div>)}{(viewPt.medicines||[]).length > 0 && <><div style={{ ...c.sectionLabel, marginTop:14, marginBottom:10 }}>Medicines ({(viewPt.medicines||[]).length})</div><table style={c.tbl}><thead><tr>{["Medicine","Qty","Rate","Total"].map(h=><th key={h} style={c.th}>{h}</th>)}</tr></thead><tbody>{(viewPt.medicines||[]).map((m,i) => <tr key={i}><td style={c.td}><strong style={{ color:T.txtHigh }}>{m.name}</strong></td><td style={c.td}><span style={c.badge(accent)}>{m.qty}</span></td><td style={c.td}>{fmt(m.rate)}</td><td style={c.td}><span style={{ color:"#f59e0b", fontWeight:700 }}>{fmt(m.qty*m.rate)}</span></td></tr>)}</tbody></table></>}{(viewPt.reports||[]).length > 0 && <><div style={{ ...c.sectionLabel, marginTop:14, marginBottom:10 }}>Investigations ({(viewPt.reports||[]).length})</div><table style={c.tbl}><thead><tr>{["Report","Date","Result"].map(h=><th key={h} style={c.th}>{h}</th>)}</tr></thead><tbody>{(viewPt.reports||[]).map((r,i) => <tr key={i}><td style={c.td}><strong style={{ color:T.txtHigh }}>{r.name}</strong></td><td style={{ ...c.td, fontSize:10, color:T.txtt }}>{r.date}</td><td style={c.td}>{r.result}</td></tr>)}</tbody></table></>}<div style={c.mFoot}><button style={c.cancelBtn} onClick={()=>{setShowViewModal(false);setViewPt(null);}}>Close</button><button style={c.aBtn(accent)} onClick={()=>{setShowViewModal(false);openSummaryEditor(viewPt);}}>✎ Edit</button><button style={c.saveBtn} onClick={() => { const adm = viewPt.admissions?.[0] || {}; const ds = viewPt.dischargeSummary || {}; const mh = adm.medicalHistory || {}; exportTxt(`discharge_${viewPt.uhid}.txt`, buildDischargeSummaryText(viewPt, bc.label, { ...adm.discharge, ...ds }, mh, viewPt.medicines||[], viewPt.reports||[])); toast("Downloaded"); }}>↓ Download</button></div></div></div>}

      {/* DISCHARGE SUMMARY EDIT MODAL — includes Expected DOD field */}
      {showSummaryModal && editSumPt && <div style={c.modal} onClick={e=>e.target===e.currentTarget&&(setShowSummaryModal(false),setEditSumPt(null))}><div style={c.modalBox}><div style={c.modalTitle}>Edit Discharge Summary — {editSumPt.patientName||editSumPt.name}</div><label style={c.lbl}>Summary Type</label><select style={c.sel} value={summaryForm.type||"Normal"} onChange={e=>setSummaryForm(f=>({...f,type:e.target.value}))}>{SUMMARY_TYPES.map(t=><option key={t}>{t}</option>)}</select><div style={c.g2}><div><label style={c.lbl}>Doctor Name</label><input style={c.inp} value={summaryForm.doctorName||""} onChange={e=>setSummaryForm(f=>({...f,doctorName:e.target.value}))}/></div><div><label style={c.lbl}>Discharge Date</label><input style={c.inp} type="date" value={summaryForm.date||""} onChange={e=>setSummaryForm(f=>({...f,date:e.target.value}))}/></div></div><div style={c.g2}><div><label style={c.lbl}>Expected DOD</label><input style={{ ...c.inp, borderColor:"#22d3ee40" }} type="date" value={summaryForm.expectedDod||""} onChange={e=>setSummaryForm(f=>({...f,expectedDod:e.target.value}))}/></div><div></div></div><label style={c.lbl}>Diagnosis</label><input style={c.inp} value={summaryForm.diagnosis||""} onChange={e=>setSummaryForm(f=>({...f,diagnosis:e.target.value}))}/><label style={c.lbl}>Treatment</label><input style={c.inp} value={summaryForm.treatment||""} onChange={e=>setSummaryForm(f=>({...f,treatment:e.target.value}))}/><label style={c.lbl}>Follow-up Instructions</label><input style={c.inp} value={summaryForm.followUp||""} onChange={e=>setSummaryForm(f=>({...f,followUp:e.target.value}))}/><label style={c.lbl}>Notes</label><input style={c.inp} value={summaryForm.notes||""} onChange={e=>setSummaryForm(f=>({...f,notes:e.target.value}))}/><div style={c.mFoot}><button style={c.cancelBtn} onClick={()=>{setShowSummaryModal(false);setEditSumPt(null);}}>Cancel</button><button style={{ ...c.saveBtn, flex:"unset", padding:"8px 14px" }} onClick={()=>{exportTxt(`discharge_${editSumPt.uhid}.txt`,buildDischargeSummaryText(editSumPt,bc.label,summaryForm,{},editSumPt.medicines||[],editSumPt.reports||[]));toast("Downloaded");}}>↓ Download</button><button style={c.saveBtn} onClick={saveSummary}>Save</button></div></div></div>}

      {/* DELETE CONFIRM */}
      {showDeleteConfirm && deletePt && <div style={c.modal} onClick={e=>e.target===e.currentTarget&&(setShowDeleteConfirm(false),setDeletePt(null))}><div style={{ ...c.modalBox, width:380 }}><div style={{ ...c.modalTitle, color:"#f87171" }}>Clear Discharge Summary?</div><div style={{ fontSize:12, color:T.txtm, marginBottom:18, lineHeight:1.6 }}>This will reset the discharge summary for <strong style={{ color:T.txtHigh }}>{deletePt.patientName||deletePt.name}</strong> ({deletePt.uhid}). This action cannot be undone.</div><div style={c.mFoot}><button style={c.cancelBtn} onClick={()=>{setShowDeleteConfirm(false);setDeletePt(null);}}>Cancel</button><button style={c.dangerBtn} onClick={doDeleteSummary}>Yes, Clear Summary</button></div></div></div>}

      {/* REPORTS MODAL */}
      {showReportModal && editRepPt && <div style={c.modal} onClick={e=>e.target===e.currentTarget&&(setShowReportModal(false),setEditRepPt(null))}><div style={c.modalBox}><div style={c.modalTitle}>Reports — {editRepPt.patientName||editRepPt.name}</div><div style={c.sectionLabel}>Existing Reports</div>{(editRepPt.reports||[]).length === 0 && <div style={{ ...c.empty, padding:"1rem" }}>No reports yet.</div>}{(editRepPt.reports||[]).map((r,i) => <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 110px 1fr 28px", gap:6, marginBottom:6, alignItems:"center" }}><input style={c.inpSm} placeholder="Report name" value={r.name} onChange={e=>updateReport(i,"name",e.target.value)}/><input style={c.inpSm} type="date" value={r.date} onChange={e=>updateReport(i,"date",e.target.value)}/><input style={c.inpSm} placeholder="Result" value={r.result} onChange={e=>updateReport(i,"result",e.target.value)}/><button style={{ ...c.aBtn("#f87171"), padding:"4px 6px" }} onClick={()=>delReport(i)}>✕</button></div>)}<div style={c.sectionLabel}>Add New Report</div><div style={c.g3}><input style={c.inpSm} placeholder="Name" value={newReport.name} onChange={e=>setNewReport(f=>({...f,name:e.target.value}))}/><input style={c.inpSm} type="date" value={newReport.date} onChange={e=>setNewReport(f=>({...f,date:e.target.value}))}/><input style={c.inpSm} placeholder="Result" value={newReport.result} onChange={e=>setNewReport(f=>({...f,result:e.target.value}))}/></div><button style={{ ...c.aBtn(accent), marginTop:8, marginBottom:14, width:"100%", padding:"7px" }} onClick={addReport}>+ Add Report</button><div style={c.mFoot}><button style={c.cancelBtn} onClick={()=>{setShowReportModal(false);setEditRepPt(null);}}>Cancel</button><button style={c.saveBtn} onClick={saveReports}>Save Reports</button></div></div></div>}
    </div>
  );
}