import { useRef } from "react";
import {
  CheckCircle,
  XCircle,
  FileText,
  Stethoscope,
  FolderOpen,
  Pill,
  Receipt
} from "lucide-react";
import { apiService } from "../../services/apiService";
import ThemeModeDock from "../ui/ThemeModeDock";
import { useBillingState } from "../../hooks/billing/useBillingState";
import AdmissionNoteForm from "./AdmissionNoteForm";
import PathologyReportCard from "./PathologyReportCard";
import RadiologyReportCard from "./RadiologyReportCard";
import MedicineHistoryPicker from "./MedicineHistoryPicker";
import SearchMultiDropdown from "./SearchMultiDropdown";

import { DISCHARGE_TYPES, DISCHARGE_SECTIONS, normalizeDischType } from "../../constants/billing/dischargeTypes";
import { isRadiologyType, emptyPathReport, emptyRadReport, REPORT_TEMPLATES } from "../../constants/billing/reportTemplates";
import { INSURANCE_TYPES, TPA_DOCS, SECTION_KEYS, SECTION_LABELS, SECTION_ICONS, TAB_MAP } from "../../constants/billing/billingConstants";
import {
  fmt, fmtDt, fmtDtShort, toLocalDT,
  calcTotals, buildLabReportPayload,
  normalizeMedicineKey,
} from "../../utils/billing/billingUtils";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TABS = [
  {
    id: "discharge",
    sKey: "discharge",
    lbl: "Discharge Summary",
    ico: <FileText size={16} />
  },
  {
    id: "medical",
    sKey: "admission",
    lbl: "Admission Note",
    ico: <Stethoscope size={16} />
  },
  {
    id: "reports",
    sKey: "reports",
    lbl: "Reports",
    ico: <FolderOpen size={16} />
  },
  {
    id: "med_bill",
    sKey: "medicines",
    lbl: "Medicine Bill",
    ico: <Pill size={16} />
  },
  {
    id: "finalbill",
    sKey: "billing",
    lbl: "Final Bill",
    ico: <Receipt size={16} />
  },
];

// ─── BillingMedSearchDropdown ─────────────────────────────────────────────────
function BillingMedSearchDropdown({ medicineMaster, eMed, findMedicineMasterMatch, onSelect }) {
  const [query, setQuery]   = require("react").useState("");
  const [open, setOpen]     = require("react").useState(false);
  const [rect, setRect]     = require("react").useState(null);
  const inputRef = useRef(null);
  const wrapRef  = useRef(null);

  const mhMeds = (eMed?.currentMedications || "")
    .split(", ").filter(Boolean)
    .map(name => {
      const master = findMedicineMasterMatch(name);
      return { name, rate: Number(master?.rate ?? 0), expiry_date: master?.expiry_date || "", batch_no: master?.batch_no || "", fromMH: true };
    });

  const masterMeds = medicineMaster
    .map(m => ({ name: m.name || m.medicine_name || "", rate: Number(m.rate ?? 0), expiry_date: m.expiry_date || "", batch_no: m.batch_no || "", fromMH: false }))
    .filter(m => m.name && !mhMeds.some(mh => mh.name.toLowerCase() === m.name.toLowerCase()));

  const allMeds    = [...mhMeds, ...masterMeds];
  const q          = query.trim().toLowerCase();
  const filtered   = q ? allMeds.filter(m => m.name.toLowerCase().includes(q)).slice(0, 40) : allMeds.slice(0, 40);

  require("react").useEffect(() => {
    const h = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const openDrop = () => {
    if (inputRef.current) setRect(inputRef.current.getBoundingClientRect());
    setOpen(true);
  };
  const handleSelect = med => { onSelect(med); setQuery(""); setOpen(false); };
  const handleManual = () => {
    const name = query.trim(); if (!name) return;
    onSelect({ name, rate:0, expiry_date:"", batch_no:"" });
    setQuery(""); setOpen(false);
  };

  return (
    <div ref={wrapRef} style={{ position:"relative", marginBottom:16 }}>
      <input ref={inputRef} value={query}
        placeholder="🔍 Search & add medicine — shows medical history first…"
        onChange={e => { setQuery(e.target.value); openDrop(); }}
        onFocus={openDrop}
        onKeyDown={e => { if (e.key==="Enter") handleManual(); if (e.key==="Escape") setOpen(false); }}
        style={{ width:"100%", boxSizing:"border-box", padding:"10px 14px", borderRadius:9, border:"1.5px solid var(--border)", background:"var(--bg)", color:"var(--navy)", fontSize:13, fontFamily:"inherit", outline:"none" }}
      />
      {open && rect && (
        <div style={{ position:"fixed", top:rect.bottom+4, left:rect.left, width:rect.width, zIndex:99999, maxHeight:Math.min(300, window.innerHeight-rect.bottom-10), overflowY:"auto", borderRadius:10, boxShadow:"0 12px 32px rgba(0,0,0,0.25)", background:"var(--white,#fff)", border:"1.5px solid var(--border)" }}>
          {filtered.length === 0 && (
            <div onClick={handleManual} style={{ padding:"10px 14px", cursor:"pointer", color:"#10b981", fontSize:13, fontWeight:600 }}>
              + Add "{query.trim()}" manually
            </div>
          )}
          {filtered.map((m, idx) => (
            <div key={idx} onClick={() => handleSelect(m)}
              style={{ padding:"10px 14px", cursor:"pointer", borderBottom:"1px solid var(--border)" }}
              onMouseEnter={e => e.currentTarget.style.background="#f0f9ff"}
              onMouseLeave={e => e.currentTarget.style.background=""}>
              <div style={{ fontSize:13, fontWeight:600, color:"var(--navy)", display:"flex", alignItems:"center", gap:6 }}>
                {m.fromMH && <span style={{ fontSize:10, background:"#dcfce7", color:"#16a34a", borderRadius:4, padding:"1px 5px", fontWeight:700 }}>MH</span>}
                {m.name}
              </div>
              <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>
                ₹{m.rate}{m.expiry_date ? ` · Exp: ${m.expiry_date}` : ""}{m.batch_no ? ` · Batch: ${m.batch_no}` : ""}{m.fromMH ? " · From Medical History" : ""}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function BillingDashboard({ currentUser, onLogout, db, locId }) {
  const state = useBillingState({ db, currentUser, locId });
  const {
    patients, medicineMaster,
    view, setView, sel, setSel,
    activeTab, setActiveTab,
    showConfirm, setShowConfirm,
    saving, toasts,
    repFilter, setRepFilter,
    reportSearch, setReportSearch,
    eDis, setEDis, eMed, setEMed,
    eSvc, setESvc, eLabRep, setELabRep,
    eMedBill, setEMedBill,
    eBilling, setEBilling,
    eSaved, setESaved,
    backendTemplates,
    toast, openPatient, saveSection, submitTask,
    findMedicineMasterMatch,
    updRep, updTest, addTest, delTest,
    updSvc, updSvcAmount,
  } = state;

  const pending    = patients.filter(p => p.taskStatus === "pending").length;
  const completed  = patients.filter(p => p.taskStatus === "completed").length;
  const allSaved   = eSaved && SECTION_KEYS.every(k => eSaved[k]);
  const savedCount = eSaved ? SECTION_KEYS.filter(k => eSaved[k]).length : 0;

  const patientName = sel?.patientName || "";
  const pathReps    = eLabRep.filter(r => !isRadiologyType(r.reportType));
  const radReps     = eLabRep.filter(r =>  isRadiologyType(r.reportType));
  const pathTotal   = pathReps.reduce((a, r) => a + Number(r.amount||0), 0);
  const radTotal    = radReps.reduce((a, r) => a + Number(r.amount||0), 0);
  const totals      = sel ? calcTotals(eSvc, eLabRep, eMedBill, eBilling) : null;
  const isCashless  = eBilling?.insuranceType && eBilling.insuranceType !== "Self Pay";

  // ── Merge backend templates + hardcoded for dropdown ──────────────────────
  const allReportTemplates = [
    ...backendTemplates,
    ...Object.values(REPORT_TEMPLATES).filter(t =>
      !backendTemplates.some(b => b.reportName?.toLowerCase() === t.label?.toLowerCase())
    ).map(t => ({
      id: `hardcoded-${t.key}`,
      reportName: t.label,
      reportType: t.dept || "Haematology",
      billCategory: "PATHOLOGY",
      date: new Date().toISOString().slice(0,10),
      orderedBy: "", amount: 0, remarks: "",
      findings: "", impression: "",
      tests: Array.isArray(t.tests) ? t.tests.map((row, idx) => ({ id: row.id ?? crypto.randomUUID(),
        id: row.id || idx+1,
        name: row.name || "", value: row.value || "",
        unit: row.unit || "", refRange: row.refRange || "", status: row.status || "Normal",
      })) : [],
    })),
  ];

  const repFilterOptions = ["All","🧪 Pathology","🩻 Radiology",...Array.from(new Set(eLabRep.map(r=>r.reportType)))];
  const visibleReps = eLabRep.filter(r => {
    if (repFilter==="All")          return true;
    if (repFilter==="🧪 Pathology") return !isRadiologyType(r.reportType);
    if (repFilter==="🩻 Radiology") return  isRadiologyType(r.reportType);
    return r.reportType === repFilter;
  });

  const quickFillTags = sel ? [
    { label:"UHID",         field:"uhid",            value:sel.uhid,                                       icon:"🔑" },
    { label:"Patient Name", field:"patientName",      value:sel.patientName,                                icon:"👤" },
    { label:"IPD / Adm No", field:"billNo",           value:sel.admNo,                                      icon:"🏥" },
    { label:"Contact No",   field:"contactNo",        value:sel.phone,                                      icon:"📞" },
    { label:"Doctor",       field:"consultantName",   value:sel.doctor||eMed?.treatingDoctor||"",           icon:"👨‍⚕️" },
    { label:"Ward / Room",  field:"wardRoom",         value:`${sel.ward||""}${sel.bed?` / ${sel.bed}`:""}`, icon:"🛏" },
    { label:"DOA",          field:"doaDisplay",       value:fmtDt(sel.doa),                                 icon:"📅" },
    { label:"DOD",          field:"dodDisplay",       value:sel.dod?fmtDt(sel.dod):"",                      icon:"📅" },
    { label:"Diagnosis",    field:"diagnosisDisplay", value:sel.diagnosis||eDis?.diagnosis||"",              icon:"🩺" },
    { label:"Panel",        field:"panel",            value:eBilling?.insuranceType||"CASH",                icon:"💳" },
    { label:"Age/Sex",      field:"ageSex",           value:`${sel.age} Yrs / ${sel.gender||""}`,           icon:"🧬" },
    { label:"Address",      field:"addressDisplay",   value:sel.address||"",                                icon:"📍" },
  ] : [];

  const applyQuickFill = (field, value) => {
    if (!value) return;
    setEBilling(p => ({ ...p, [field]: value }));
    toast(`Filled: ${field.replace(/([A-Z])/g," $1").trim()}`);
  };

  // ─── Discharge Summary Renderer ──────────────────────────────────────────
  const renderDischargeSummary = () => {
    const dischargeType = normalizeDischType(eDis?.dischargeStatus || eDis?.dischargeType || "NORMAL");
    const dtConfig      = DISCHARGE_TYPES[dischargeType] || DISCHARGE_TYPES.NORMAL;
    const sections      = DISCHARGE_SECTIONS[dischargeType] || DISCHARGE_SECTIONS.NORMAL;
    const setDis        = (k, v) => setEDis(p => ({ ...p, [k]: v }));

    return (
      <>
        <div className="dtype-banner" style={{ background:dtConfig.bg, borderColor:dtConfig.border }}>
          <div className="dtype-icon">{dtConfig.icon}</div>
          <div style={{ flex:1 }}>
            <div className="dtype-title" style={{ color:dtConfig.color }}>{dtConfig.label} Summary</div>
            <div className="dtype-sub"   style={{ color:dtConfig.color }}>Discharge type set by reception · All fields editable by billing</div>
          </div>
          <div className="dtype-badge" style={{ color:dtConfig.color, borderColor:dtConfig.border }}>
            🏥 {dischargeType}
          </div>
        </div>

        {/* Dates */}
        <div className="ds-card">
          <div className="ds-card-hdr">
            <div className="ds-card-num" style={{ background:dtConfig.bg, borderColor:dtConfig.border, color:dtConfig.color }}>📅</div>
            <span className="ds-card-lbl">Dates &amp; Basic Information</span>
          </div>
          <div className="ds-card-body">
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))", gap:14 }}>
              {[
                { lbl:"Date of Admission",    key:"doa",         type:"datetime-local" },
                { lbl:"Expected Discharge",   key:"expectedDod", type:"date" },
                { lbl:"Actual Discharge Date",key:"dod",         type:"datetime-local" },
                { lbl:"Ward",                 key:"ward",        ph:"General Ward" },
                { lbl:"Bed No.",              key:"bed",         ph:"B-12" },
                { lbl:"Treating Doctor",      key:"doctor",      ph:"Dr. Name" },
                { lbl:"Primary Diagnosis",    key:"diagnosis",   ph:"e.g. Acute Appendicitis" },
              ].map(f => (
                <div key={f.key} className="fg">
                  <label className="flbl">{f.lbl}</label>
                  <input className="finp"
                    type={f.type || "text"}
                    value={f.type==="datetime-local" ? toLocalDT(eDis?.[f.key]) : f.type==="date" ? (eDis?.[f.key]?String(eDis[f.key]).slice(0,10):"") : (eDis?.[f.key]||"")}
                    placeholder={f.ph||""}
                    onChange={e => setDis(f.key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Clinical sections */}
        {sections.map((sec, idx) => (
          <div key={sec.key} className="ds-card">
            <div className="ds-card-hdr">
              <div className="ds-card-num" style={{ background:dtConfig.bg, borderColor:dtConfig.border, color:dtConfig.color }}>{idx+1}</div>
              <span className="ds-card-lbl">{sec.label}</span>
              {sec.type==="vitals_grid" && <span className="ds-card-type">Vitals Grid</span>}
            </div>
            <div className="ds-card-body">
              {sec.type === "vitals_grid" ? (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:12 }}>
                  {[
                    { k:"bp",    lbl:"BP (mmHg)",    ph:"120/80 mmHg" },
                    { k:"pr",    lbl:"Pulse (/min)",  ph:"82/min" },
                    { k:"spo2",  lbl:"SPO2",          ph:"98% On RA" },
                    { k:"temp",  lbl:"Temperature",   ph:"98.6°F" },
                    { k:"chest", lbl:"Chest",         ph:"B/L Clear" },
                    { k:"cvs",   lbl:"CVS",           ph:"S1 S2 +" },
                    { k:"cns",   lbl:"CNS",           ph:"Conscious, Oriented" },
                    { k:"pa",    lbl:"P/A (Abdomen)", ph:"Soft, Non-tender" },
                  ].map(v => (
                    <div key={v.k} className="fg">
                      <label className="flbl">{v.lbl}</label>
                      <input className="finp" value={eDis?.[v.k]||""} placeholder={v.ph} onChange={e=>setDis(v.k,e.target.value)}/>
                    </div>
                  ))}
                </div>
              ) : (
                <textarea className="ftxt"
                  value={eDis?.[sec.key]||""} placeholder={`Enter ${sec.label.toLowerCase()}...`}
                  rows={sec.rows||3} onChange={e=>setDis(sec.key,e.target.value)}/>
              )}
            </div>
          </div>
        ))}

        <div style={{ display:"flex", alignItems:"center", gap:14, marginTop:8 }}>
          <button className="savebtn" onClick={() => saveSection("discharge","Discharge Summary")}>Save Discharge Summary</button>
          <span style={{ fontSize:12, color:"var(--text3)" }}>Type: <strong style={{ color:dtConfig.color }}>{dtConfig.label}</strong> · {sections.length} sections</span>
        </div>
      </>
    );
  };

  // ─── Medicine Bill Renderer ───────────────────────────────────────────────
  const renderMedicineBill = () => {
    const medBillTotal = eMedBill.reduce((a,r) => a+Number(r.amount||0), 0);
    return (
      <>
        <MedicineHistoryPicker eMed={eMed} onAdd={med => {
          const medName = typeof med === "string" ? med : (med?.name || med?.item || "");
          const normalize = s => String(s||"").toLowerCase().replace(/[^a-z0-9]/g," ").replace(/\s+/g," ").trim();
          const needle = normalize(medName);
          const found = medicineMaster.find(m => normalize(m.name||m.medicine_name||"") === needle)
            || medicineMaster.find(m => normalize(m.name||m.medicine_name||"").includes(needle))
            || {};
          const rate = Number(found.rate || 0);
          setEMedBill(prev => [...prev, {
            id: crypto.randomUUID(), item: medName,
            date: new Date().toISOString().slice(0,10),
            quantity:1, rate, amount:rate,
            batchNo: found.batch_no||"", expiryDate: found.expiry_date||"",
          }]);
        }}/>

        <BillingMedSearchDropdown
          medicineMaster={medicineMaster} eMed={eMed}
          findMedicineMasterMatch={findMedicineMasterMatch}
          onSelect={med => {
            const name    = med.name || med;
            const rate    = Number(med.rate ?? 0);
            const already = eMedBill.some(r => (r.item||"").toLowerCase() === name.toLowerCase());
            if (already) { toast("Already added"); return; }
            setEMedBill(p => [...p, {
              id:Date.now(), item:name,
              date:new Date().toISOString().slice(0,10),
              quantity:1, rate, amount:rate,
              batchNo: med.batch_no||"", expiryDate: med.expiry_date||"",
            }]);
            toast(`Added: ${name.slice(0,40)}`);
          }}
        />

        <div className="tw">
          <table className="tbl">
            <thead>
              <tr>
                <th>Item Description</th><th>Date</th>
                <th style={{ width:70 }}>Qty</th><th style={{ width:110 }}>Rate (₹)</th>
                <th style={{ width:150 }}>Batch No.</th><th style={{ width:140 }}>Expiry</th>
                <th style={{ width:110 }}>Amount (₹)</th><th style={{ width:40 }}></th>
              </tr>
            </thead>
            <tbody>
              {eMedBill.map((r,i) => (
                <tr key={r.id}>
                  <td>
                    <input className="tinp" value={r.item} onChange={e => {
                      const val    = e.target.value;
                      const master = medicineMaster.find(m => (m.name||m.medicine_name||"").toLowerCase()===val.toLowerCase());
                      const n      = [...eMedBill];
                      n[i] = { ...n[i], item:val, rate:master?Number(master.rate??n[i].rate):n[i].rate, batchNo:master?.batch_no??n[i].batchNo??"", expiryDate:master?.expiry_date??n[i].expiryDate??"" };
                      n[i].amount = Number(n[i].quantity||1)*Number(n[i].rate||0);
                      setEMedBill(n);
                    }}/>
                  </td>
                  <td><input className="tinp" type="date" value={r.date} onChange={e=>{const n=[...eMedBill];n[i]={...n[i],date:e.target.value};setEMedBill(n);}}/></td>
                  <td><input className="tinp" type="number" min="1" value={r.quantity??1} onChange={e=>{const n=[...eMedBill];const qty=Math.max(1,Number(e.target.value)||1);n[i]={...n[i],quantity:qty,amount:qty*Number(n[i].rate||0)};setEMedBill(n);}}/></td>
                  <td><input className="tinp" type="number" min="0" step="0.01" value={r.rate??0} onChange={e=>{const n=[...eMedBill];const rate=Number(e.target.value)||0;n[i]={...n[i],rate,amount:Number(n[i].quantity||1)*rate};setEMedBill(n);}}/></td>
                  <td><input className="tinp" value={r.batchNo||""} onChange={e=>{const n=[...eMedBill];n[i]={...n[i],batchNo:e.target.value};setEMedBill(n);}}/></td>
                  <td>
                    <input className="tinp" type="date"
                      value={(r.expiryDate||"").includes("/")?`20${r.expiryDate.split("/")[1]}-${r.expiryDate.split("/")[0].padStart(2,"0")}-01`:(r.expiryDate||"")}
                      onChange={e=>{const n=[...eMedBill];n[i]={...n[i],expiryDate:e.target.value};setEMedBill(n);}}/>
                  </td>
                  <td><input className="tinp" type="number" min="0" step="0.01" value={r.amount} onChange={e=>{const n=[...eMedBill];n[i]={...n[i],amount:Number(e.target.value)||0};setEMedBill(n);}}/></td>
                  <td><button className="delbtn" onClick={()=>setEMedBill(p=>p.filter((_,j)=>j!==i))}>×</button></td>
                </tr>
              ))}
              {eMedBill.length===0&&(
                <tr><td colSpan={8} style={{ textAlign:"center", color:"var(--text3)", fontStyle:"italic", padding:20 }}>No medicines added yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <button className="addbtn" onClick={()=>setEMedBill(p=>[...p,{id:Date.now(),item:"",date:new Date().toISOString().slice(0,10),quantity:1,rate:0,batchNo:"",expiryDate:"",amount:0}])}>+ Add Row Manually</button>
        <div className="totbox">
          <div className="tr2 fin"><span>Medicine Total</span><span>{fmt(medBillTotal)}</span></div>
        </div>
        <button className="savebtn" style={{ marginTop:16 }} onClick={()=>saveSection("medicines","Medicine Bill")}>Save Medicine Bill</button>
      </>
    );
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="app">

      {/* TOPBAR */}
      <header className="topbar">
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div className="logo">Sh</div>
          <div>
            <div className="brand-name">Sangi Hospital</div>
            <div className="brand-sub">Billing Department</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <ThemeModeDock variant="inline"/>
          <div style={{ display:"flex", alignItems:"center", gap:9 }}>
            <div className="user-av">{currentUser?.name?.[0]||"B"}</div>
            <div>
              <div className="user-nm">{currentUser?.name||"Billing Staff"}</div>
              <div className="user-id">{currentUser?.emp_id||"EMP-001"} · Billing User</div>
            </div>
          </div>
          <button className="so-btn" onClick={onLogout}>Sign Out</button>
        </div>
      </header>

      <div className="layout">

        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="slbl">Workspace</div>
          <div className="si act"><span>📋</span> My Tasks {pending>0&&<span className="sbdg">{pending}</span>}</div>
          <div className="shr"/>
          <div className="slbl">Overview</div>
          <div className="smr"><span className="smrl">Total Assigned</span><strong style={{ color:"var(--navy)" }}>{patients.length}</strong></div>
          <div className="smr"><span className="smrl">Pending</span><strong style={{ color:"var(--amber)" }}>{pending}</strong></div>
          <div className="smr"><span className="smrl">Completed</span><strong style={{ color:"var(--teal)" }}>{completed}</strong></div>
        </aside>

        <main className="main">

          {/* ── TASK LIST ── */}
          {view === "tasks" && (
            <>
              <div className="pgh">
                <div>
                  <div className="pgt">My Tasks</div>
                  <div className="pgs">Patients assigned to you across all branches</div>
                </div>
                <div className="dchip">{new Date().toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"long",year:"numeric"})}</div>
              </div>
              <div className="srow">
                <div className="sc c1"><div className="scv">{patients.length}</div><div className="scl">Total Assigned</div></div>
                <div className="sc c2"><div className="scv">{pending}</div><div className="scl">Pending Tasks</div></div>
                <div className="sc c3"><div className="scv">{completed}</div><div className="scl">Completed</div></div>
              </div>
              {patients.length===0
                ? <div className="empty"><div className="empty-ico">🎉</div><div>All tasks done!</div></div>
                : (
                  <div className="tgrid">
                    {patients.filter(p=>p.taskStatus!=="completed").map(p => {
                      const dtCfg = DISCHARGE_TYPES[normalizeDischType(p.discharge?.dischargeStatus || p.discharge?.dischargeType || "NORMAL")]||DISCHARGE_TYPES.NORMAL;
                      const done  = SECTION_KEYS.filter(k=>p.saved?.[k]).length;
                      return (
                        <div key={`${p.uhid}-${p.admNo}`} className="tc">
                          <div className="tctp">
                            <div style={{ flex:1, minWidth:0 }}>
                              <div className="tcnm">{p.patientName}</div>
                              <div className="tcid">{p.uhid} · {p.admNo}</div>
                            </div>
                            <span className={"badge "+(p.taskStatus==="completed"?"bt":"ba")}>{p.taskStatus==="completed"?"Done":"Pending"}</span>
                          </div>
                          <div className="tcrs">
                            <div className="tcrw"><span className="tcri">🏥</span><strong style={{ color:"var(--navy)", fontSize:11 }}>{p.branch}</strong></div>
                            <div className="tcrw"><span className="tcri">👨‍⚕️</span>{p.doctor||"—"}</div>
                            <div className="tcrw"><span className="tcri">🩺</span>{p.diagnosis||"—"}</div>
                            <div className="tcrw"><span className="tcri">📞</span>{p.phone||"—"}</div>
                          </div>
                          <div style={{ marginBottom:10 }}>
                            <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:700, background:dtCfg.bg, border:`1.5px solid ${dtCfg.border}`, color:dtCfg.color }}>
                              {dtCfg.icon} {dtCfg.label}
                            </span>
                          </div>
                          <div className="tc-dod">
                            <div className="tc-dod-item"><div className="tc-dod-lbl">Admitted</div><div className="tc-dod-val">{fmtDtShort(p.doa)}</div></div>
                            <div className="tc-dod-item"><div className="tc-dod-lbl">Exp. Discharge</div><div className="tc-dod-val exp">{p.expectedDod?fmtDtShort(p.expectedDod):"--"}</div></div>
                            <div className="tc-dod-item"><div className="tc-dod-lbl">Discharged</div><div className="tc-dod-val dis">{p.dod?fmtDtShort(p.dod):"Active"}</div></div>
                          </div>
                          <div className="tcch">
                            <span className={"badge "+(p.status==="admitted"?"bg":"bb")}>{p.status==="admitted"?"Admitted":"Discharged"}</span>
                            <span className="chip">{p.ward} · {p.bed}</span>
                            <span className="chip">{p.age}y {p.gender?.[0]}</span>
                          </div>
                          {p.taskStatus!=="completed"&&(
                            <div className="tcpb">
                              <div className="tcplbl">Sections saved: {done}/5</div>
                              <div className="tcpbar"><div className="tcpfil" style={{ width:((done/5)*100)+"%" }}/></div>
                            </div>
                          )}
                          <div className="tcft">
                            <div className="tcdoa">DOA: {fmtDt(p.doa)}</div>
                            <button className="hod-btn" onClick={()=>openPatient(p)}>Open</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              }
            </>
          )}

          {/* ── PATIENT DETAIL ── */}
          {view==="patient" && sel && (
            <>
              <button className="back-btn" onClick={()=>{setView("tasks");setSel(null);}}>← Back to My Tasks</button>

              {/* Patient header */}
              <div className="dhdr">
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, flexWrap:"wrap", marginBottom:8 }}>
                  <div>
                    <div className="dname">{sel.patientName}</div>
                    <div className="dmeta">UHID: <strong>{sel.uhid}</strong> &nbsp;·&nbsp; Adm: <strong>{sel.admNo}</strong> &nbsp;·&nbsp; {sel.age} yrs · {sel.gender} &nbsp;·&nbsp; {sel.phone}</div>
                  </div>
                </div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:10 }}>
                  <span className="badge bb">🏥 {sel.branch}</span>
                  <span className={"badge "+(sel.status==="admitted"?"bg":"bt")}>{sel.status==="admitted"?"Admitted":"Discharged"}</span>
                  <span className="badge bb">🛏 {sel.ward} · {sel.bed}</span>
                  <span className="badge bb">👨‍⚕️ {sel.doctor}</span>
                  <span className={"badge "+(sel.taskStatus==="completed"?"bt":"ba")}>{sel.taskStatus==="completed"?"Submitted to HOD":"Task Pending"}</span>
                  {(()=>{
                    const dtCfg=DISCHARGE_TYPES[normalizeDischType(eDis?.dischargeStatus || eDis?.dischargeType || "NORMAL")]||DISCHARGE_TYPES.NORMAL;
                    return <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:700, background:dtCfg.bg, border:`1.5px solid ${dtCfg.border}`, color:dtCfg.color }}>{dtCfg.icon} {dtCfg.label}</span>;
                  })()}
                </div>
                <div className="dod-strip">
                  <div className="dod-strip-item"><div className="dod-strip-lbl">Date of Admission</div><div className="dod-strip-val">{fmtDt(sel.doa)}</div></div>
                  <div className="dod-strip-item"><div className="dod-strip-lbl">Expected Discharge</div><div className="dod-strip-val exp">{eDis.expectedDod?fmtDt(eDis.expectedDod):"Not set"}</div></div>
                  <div className="dod-strip-item"><div className="dod-strip-lbl">Actual Discharge</div><div className="dod-strip-val dis">{sel.dod?fmtDt(sel.dod):"Not yet discharged"}</div></div>
                  <div className="dod-strip-item"><div className="dod-strip-lbl">Primary Diagnosis</div><div className="dod-strip-val dia">{sel.diagnosis}</div></div>
                </div>
              </div>

              {/* Checklist */}
<div className="clpanel">
  <div className="cltitle">
    Task Checklist — save all 5 sections then submit to HOD
  </div>

  <div className="clsteps">
    {SECTION_KEYS.map((k, idx) => (
      <div
        key={k}
        style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}
      >
        <button
          type="button"
          className={
            "clstep" +
            (eSaved[k]
              ? " done"
              : activeTab === TAB_MAP[k]
              ? " cur"
              : "")
          }
          style={{ flex: 1, minWidth: 0 }}
          onClick={() => setActiveTab(TAB_MAP[k])}
        >
          <div className="clchk">
            {eSaved[k] ? "✓" : SECTION_ICONS[k]}
          </div>

          <div className="cllbl">
            {SECTION_LABELS[k]}
          </div>
        </button>

        {idx < SECTION_KEYS.length - 1 && (
          <div className={"clcon" + (eSaved[k] ? " done" : "")} />
        )}
      </div>
    ))}
  </div>

  <div className="clfoot">
    {sel.taskStatus === "completed" ? (
      <div className="clmsg-ok">
        ✔ Submitted to HOD &amp; Admin
      </div>
    ) : allSaved ? (
      <div className="clmsg-ok">
        ✔ All sections saved — ready to submit!
      </div>
    ) : (
      <div className="clmsg-pend">
        <span className="clmsg-cnt">
          {5 - savedCount} section
          {5 - savedCount !== 1 ? "s" : ""} remaining
        </span>
        {" "}— save all to unlock Submit
      </div>
    )}

    {sel.taskStatus !== "completed" ? (
      <button
        type="button"
        className="hod-btn"
        disabled={!allSaved}
        onClick={() => setShowConfirm(true)}
      >
        Submit to HOD →
      </button>
    ) : (
      <div className="done-bdg">
        ✔ Submitted
      </div>
    )}
  </div>
</div>
              {/* Tabs */}
              <div className="twrap">
                <div className="tabs">
                  {TABS.map(t=>(
                    <button key={t.id} className={"tabbtn"+(activeTab===t.id?" act":"")} onClick={()=>setActiveTab(t.id)}>
                      {t.ico} {t.lbl} {eSaved[t.sKey]&&<span className="tdot"/>}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── DISCHARGE SUMMARY ── */}
              {activeTab==="discharge" && renderDischargeSummary()}

              {/* ── ADMISSION NOTE ── */}
              {activeTab==="medical" && (
                <>
                  <AdmissionNoteForm eMed={eMed} setEMed={setEMed} medicineMaster={medicineMaster}/>
                  <button className="savebtn" onClick={()=>saveSection("admission","Admission Note")}>Save Admission Note</button>
                </>
              )}

              {/* ── REPORTS ── */}
              {activeTab==="reports" && (
                <>
                  <div className="secc">
                    <div className="sech">
                      <div className="sect">
                        🗂️ Reports
                        {patientName&&<span style={{ fontSize:12, fontWeight:600, color:"var(--text3)", background:"var(--bg)", border:"1px solid var(--border)", borderRadius:20, padding:"2px 10px", marginLeft:6 }}>👤 {patientName}</span>}
                      </div>
                      <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                        <span style={{ background:"#eff6ff", border:"1px solid #bfdbfe", color:"#1d4ed8", borderRadius:20, padding:"3px 11px", fontSize:11, fontWeight:700 }}>🧪 Path: {fmt(pathTotal)} ({pathReps.length})</span>
                        <span style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", color:"#15803d", borderRadius:20, padding:"3px 11px", fontSize:11, fontWeight:700 }}>🩻 Rad: {fmt(radTotal)} ({radReps.length})</span>
                        <span style={{ background:"var(--tealBg)", border:"1px solid rgba(13,124,114,.2)", color:"var(--teal)", borderRadius:20, padding:"3px 11px", fontSize:11, fontWeight:700 }}>Grand: {fmt(pathTotal+radTotal)}</span>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap", padding:"12px 20px", borderBottom:"1px solid var(--border)" }}>
                      {repFilterOptions.map(t=>(
                        <button key={t} onClick={()=>setRepFilter(t)}
                          style={{ padding:"5px 13px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:".13s", border:repFilter===t?"1.5px solid var(--navy)":"1.5px solid var(--border)", background:repFilter===t?"var(--navy)":"var(--white,#fff)", color:repFilter===t?"#fff":"var(--text2)" }}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Template dropdown — fetches from backend + hardcoded */}
                  <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap", marginBottom:18, marginTop:10 }}>
                    <input
                      placeholder="Search report templates..."
                      value={reportSearch[sel?.uhid]||""}
                      onChange={e=>setReportSearch(prev=>({...prev,[sel?.uhid]:e.target.value}))}
                      style={{ flex:1, minWidth:240, padding:"10px 14px", borderRadius:10, border:"1px solid var(--border)", background:"var(--white)", fontSize:13, fontFamily:"inherit" }}
                    />
                    <select
                      style={{ padding:"10px 14px", borderRadius:10, border:"1px solid var(--border)", background:"var(--white)", minWidth:260, fontSize:13, fontFamily:"inherit" }}
                      onChange={e=>{
                        if (!e.target.value) return;
                        const tpl = allReportTemplates.find(t=>t.reportName===e.target.value);
                        if (!tpl) return;
                        const report = {
                          ...( isRadiologyType(tpl.reportType) ? emptyRadReport() : emptyPathReport() ),
                          reportName: tpl.reportName,
                          reportType: tpl.reportType,
                          remarks:    tpl.remarks    || "",
                          findings:   tpl.findings   || "",
                          impression: tpl.impression || "",
                          tests: Array.isArray(tpl.tests) ? tpl.tests.map((row,idx)=>({ id: row.id ?? crypto.randomUUID(),
                            id: row.id||idx+1,
                            name: row.name||"", value: row.value||"",
                            unit: row.unit||"", refRange: row.refRange||"", status: row.status||"Normal",
                          })) : [],
                        };
                        setELabRep(prev=>[...prev, report]);
                        e.target.value="";
                      }}
                    >
                      <option value="">+ Add Report Template</option>
                      {allReportTemplates
                        .filter(t => t.reportName.toLowerCase().includes((reportSearch[sel?.uhid]||"").toLowerCase()))
                        .map((t,i)=>(
                          <option key={i} value={t.reportName}>{t.reportName}</option>
                        ))}
                    </select>
                  </div>

                  {visibleReps.length===0&&<div className="empty" style={{ padding:"30px 20px" }}><div>No reports yet. Use the dropdown above to add.</div></div>}

                  {visibleReps.map(rep=>{
                    const ri=eLabRep.findIndex(r=>r.id===rep.id);
                    if (isRadiologyType(rep.reportType)) {
                      return <RadiologyReportCard key={rep.id} rep={rep} ri={ri} patientName={patientName} updRep={updRep} onRemove={()=>setELabRep(p=>p.filter(r=>r.id!==rep.id))} onSave={async()=>{ try{ await apiService.saveLabReportsBulk(sel.uhid,sel.admNo,[buildLabReportPayload(rep)]); toast("Report saved ✓"); }catch{ toast("Failed to save report","e"); } }}/>;
                    }
                    return <PathologyReportCard key={rep.id} rep={rep} ri={ri} patientName={patientName} updRep={updRep} updTest={updTest} addTest={addTest} delTest={delTest} onRemove={()=>setELabRep(p=>p.filter(r=>r.id!==rep.id))} onSave={async()=>{ try{ await apiService.saveLabReportsBulk(sel.uhid,sel.admNo,[buildLabReportPayload(rep)]); toast("Report saved ✓"); }catch{ toast("Failed to save report","e"); } }}/>;
                  })}

                  <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap", marginBottom:16, marginTop:4 }}>
                    <button onClick={()=>setELabRep(p=>[...p,emptyPathReport()])} style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"10px 20px", background:"linear-gradient(135deg,#1e3a5f,#0f172a)", color:"#fff", border:"none", borderRadius:9, cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"inherit" }}>🧪 + Add Pathology Report</button>
                    <button onClick={()=>setELabRep(p=>[...p,emptyRadReport()])}  style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"10px 20px", background:"linear-gradient(135deg,#065f46,#064e3b)", color:"#fff", border:"none", borderRadius:9, cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"inherit" }}>🩻 + Add Radiology Report</button>
                  </div>
                  <button className="savebtn" onClick={()=>saveSection("reports","Reports")}>Save Reports</button>
                </>
              )}

              {/* ── MEDICINE BILL ── */}
              {activeTab==="med_bill" && <div className="secb">{renderMedicineBill()}</div>}

              {/* ── FINAL BILL ── */}
              {activeTab==="finalbill" && (
                <>
                  {/* Quick fill */}
                  <div style={{ background:"var(--white)", border:"1.5px solid var(--border)", borderRadius:14, marginBottom:16, overflow:"hidden" }}>
                    <div style={{ background:"linear-gradient(135deg,#1e3a5f,#0f172a)", padding:"12px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:"#fff" }}>⚡ Quick-Fill from Patient Data</div>
                        <div style={{ fontSize:11, color:"rgba(255,255,255,.55)", marginTop:1 }}>Click any tag to auto-fill that field in the bill below</div>
                      </div>
                      <span style={{ fontSize:11, color:"rgba(255,255,255,.5)", fontFamily:"monospace" }}>{sel.uhid} · {sel.admNo}</span>
                    </div>
                    <div style={{ padding:"12px 16px", display:"flex", flexWrap:"wrap", gap:7, background:"var(--bg)" }}>
                      {quickFillTags.map(tag=>(
                        <button key={tag.field}
                          className={"qtag"+(eBilling?.[tag.field]?" filled":"")}
                          onClick={()=>applyQuickFill(tag.field,tag.value)}
                          title={tag.value||"(not available)"}
                        >
                          <span>{tag.icon}</span>
                          <span style={{ fontWeight:700 }}>{tag.label}:</span>
                          <span style={{ maxWidth:140, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", opacity:.85 }}>{tag.value||<span style={{ fontStyle:"italic", opacity:.5 }}>—</span>}</span>
                          {eBilling?.[tag.field]&&<span style={{ fontSize:10, color:"#15803d" }}>✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bill header */}
                  <div className="secc" style={{ marginBottom:16 }}>
                    <div className="sech"><div className="sect">🧾 Bill Header — Patient Information</div></div>
                    <div className="secb">
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:14 }}>
                        {[
                          { lbl:"🔑 UHID",             key:"uhid",            ph:sel.uhid,      req:true },
                          { lbl:"IPD / Bill No.",       key:"billNo",          ph:sel.admNo },
                          { lbl:"Patient Name",         key:"patientName",     ph:sel.patientName },
                          { lbl:"Guardian Name",        key:"guardianName",    ph:"e.g. Ramesh Kumar" },
                          { lbl:"Age / Sex",            key:"ageSex",          ph:`${sel.age} Yrs / ${sel.gender||""}` },
                          { lbl:"Contact No.",          key:"contactNo",       ph:sel.phone },
                          { lbl:"Card No.",             key:"cardNo",          ph:"e.g. 1234" },
                          { lbl:"Claim ID",             key:"claimId",         ph:"e.g. 42092669" },
                          { lbl:"Panel",                key:"panel",           ph:"CASH / TPA / ECHS" },
                          { lbl:"Consultant / Doctor",  key:"consultantName",  ph:sel.doctor||eMed?.treatingDoctor||"" },
                          { lbl:"Ward / Room",          key:"wardRoom",        ph:`${sel.ward||""}${sel.bed?` / ${sel.bed}`:""}` },
                          { lbl:"Status on Discharge",  key:"statusOnDischarge",ph:"e.g. LAMA, Stable" },
                        ].map(f=>(
                          <div key={f.key} className="fg" style={f.req?{gridColumn:"1"}:{}}>
                            <label className="flbl" style={f.req?{color:"var(--teal)"}:{}}>{f.lbl}{f.req&&<span style={{ color:"var(--red)" }}> *</span>}</label>
                            <input className="finp" value={eBilling?.[f.key]||""} placeholder={f.ph||""} onChange={e=>setEBilling(p=>({...p,[f.key]:e.target.value}))} style={f.req?{borderColor:"var(--teal)",fontWeight:700,fontFamily:"monospace"}:{}}/>
                          </div>
                        ))}
                        <div className="fg" style={{ gridColumn:"1/-1" }}>
                          <label className="flbl">Address</label>
                          <input className="finp" value={eBilling?.addressDisplay||""} placeholder={sel.address||"Patient address"} onChange={e=>setEBilling(p=>({...p,addressDisplay:e.target.value}))}/>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Services + Payment */}
                  <div className="bgrid">
                    <div className="secc">
                      <div className="sech"><div className="sect">🧾 Services &amp; Charges</div></div>
                      <div className="secb">
                        <div className="tw">
                          <table className="tbl">
                            <thead><tr><th>Service</th><th>Category</th><th style={{ width:60 }}>Qty</th><th style={{ width:90 }}>Rate</th><th style={{ width:100 }}>Amount</th><th style={{ width:44 }}></th></tr></thead>
                            <tbody>
                              {eSvc.map((r,i)=>(
                                <tr key={r.id}>
                                  <td><input className="tinp" value={r.name}     onChange={e=>updSvc(i,"name",e.target.value)}/></td>
                                  <td><input className="tinp" value={r.category} onChange={e=>updSvc(i,"category",e.target.value)}/></td>
                                  <td><input className="tinp" type="number" min="1" step="1" value={r.qty}    onChange={e=>updSvc(i,"qty",e.target.value)}/></td>
                                  <td><input className="tinp" type="number" min="0" step="0.01" value={r.rate}   onChange={e=>updSvc(i,"rate",e.target.value)}/></td>
                                  <td><input className="tinp" type="number" min="0" step="0.01" value={r.amount??0} onChange={e=>updSvcAmount(i,e.target.value)}/></td>
                                  <td><button className="delbtn" onClick={()=>setESvc(p=>p.filter((_,j)=>j!==i))}>×</button></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <button className="addbtn" onClick={()=>setESvc(p=>[...p,{id:Date.now(),name:"",category:"",qty:1,rate:0,amount:0}])}>+ Add Service</button>
                      </div>
                    </div>

                    <div className="secc">
                      <div className="sech"><div className="sect">💳 Payment Details</div></div>
                      <div className="secb">
                        <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
                          {[{k:"discount",lbl:"Discount (Rs.)"},{k:"advance",lbl:"Advance Paid (Rs.)"},{k:"paidNow",lbl:"Paid Now (Rs.)"}].map(f=>(
                            <div key={f.k} className="fg">
                              <label className="flbl">{f.lbl}</label>
                              <input className="finp" type="number" value={eBilling?.[f.k]||0} onChange={e=>setEBilling(p=>({...p,[f.k]:e.target.value}))}/>
                            </div>
                          ))}
                          {!isCashless&&(
                            <div className="fg">
                              <label className="flbl">Payment Mode</label>
                              <select className="fsel" value={eBilling?.paymentMode||"Cash"} onChange={e=>setEBilling(p=>({...p,paymentMode:e.target.value}))}>
                                {["Cash","UPI","Card","Insurance","NEFT","Cheque"].map(m=><option key={m}>{m}</option>)}
                              </select>
                            </div>
                          )}
                          <div className="fg">
                            <label className="flbl">Insurance Type</label>
                            <select className="fsel" value={eBilling?.insuranceType||"Self Pay"} onChange={e=>setEBilling(p=>({...p,insuranceType:e.target.value}))}>
                              {INSURANCE_TYPES.map(t=><option key={t}>{t}</option>)}
                            </select>
                          </div>
                          {isCashless&&(
                            <>
                              {[{k:"tpaName",lbl:"TPA / Panel Name"},{k:"policyNo",lbl:"Policy / Card Number"},{k:"claimNo",lbl:"Claim Number"},{k:"authNo",lbl:"Authorization Number"}].map(f=>(
                                <div key={f.k} className="fg">
                                  <label className="flbl">{f.lbl}</label>
                                  <input className="finp" value={eBilling?.tpaInfo?.[f.k]||""} onChange={e=>setEBilling(p=>({...p,tpaInfo:{...(p.tpaInfo||{}),[f.k]:e.target.value}}))}/>
                                </div>
                              ))}
                              <div className="fg">
                                <label className="flbl">TPA Documents</label>
                                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:8 }}>
                                  {TPA_DOCS.map(doc=>(
                                    <label key={doc.key} style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:"var(--text2)", background:"var(--bg)", border:"1px solid var(--border)", borderRadius:8, padding:"8px 10px" }}>
                                      <input type="checkbox" checked={Boolean(eBilling?.tpaDocStatus?.[doc.key])} onChange={ev=>setEBilling(p=>({...p,tpaDocStatus:{...(p.tpaDocStatus||{}),[doc.key]:ev.target.checked}}))}/>
                                      <span>{doc.label}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                          <div className="fg">
                            <label className="flbl">Remarks</label>
                            <input className="finp" value={eBilling?.remarks||""} onChange={e=>setEBilling(p=>({...p,remarks:e.target.value}))}/>
                          </div>
                        </div>
                        {totals&&(
                          <div className="totbox">
                            <div className="tr2"><span className="trl">Services</span><span className="trv">{fmt(totals.s)}</span></div>
                            <div className="tr2"><span className="trl">🧪 Pathology</span><span className="trv">{fmt(pathTotal)}</span></div>
                            <div className="tr2"><span className="trl">🩻 Radiology</span><span className="trv">{fmt(radTotal)}</span></div>
                            <div className="tr2"><span className="trl">Medicines</span><span className="trv">{fmt(totals.m)}</span></div>
                            <div className="tr2"><span className="trl">Gross Total</span><span className="trv">{fmt(totals.gross)}</span></div>
                            <div className="tr2" style={{ color:"var(--red)" }}><span className="trl">Discount</span><span className="trv">- {fmt(totals.disc)}</span></div>
                            <div className="tr2"><span className="trl">Net Payable</span><span className="trv">{fmt(totals.net)}</span></div>
                            <div className="tr2" style={{ color:"var(--teal)" }}><span className="trl">Advance Paid</span><span className="trv">- {fmt(totals.adv)}</span></div>
                            <div className="tr2" style={{ color:"var(--teal)" }}><span className="trl">Paid Now</span><span className="trv">- {fmt(totals.paid)}</span></div>
                            <div className="tr2 fin"><span>Balance Due</span><span>{fmt(totals.due)}</span></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <button className="savebtn" onClick={()=>saveSection("billing","Final Bill")}>Save Final Bill</button>
                </>
              )}
            </>
          )}
        </main>
      </div>

      {/* CONFIRM MODAL */}
      {showConfirm&&(
        <div className="overlay" onClick={()=>setShowConfirm(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <button className="mclose" onClick={()=>setShowConfirm(false)}>×</button>
            <div className="mico">📤</div>
            <div className="mtitle">Submit to HOD and Admin?</div>
            <div className="msub">Submitting complete billing file for <strong>{sel?.patientName}</strong> ({sel?.uhid}) to HOD.</div>
            <div className="mcl">
              {SECTION_KEYS.map(k=>(
                <div key={k} className="mclr">
                  <span>{eSaved[k]?"✅":"⚠️"}</span>
                  <span style={{ color:eSaved[k]?"var(--teal)":"var(--amber)", fontWeight:600 }}>{SECTION_ICONS[k]} {SECTION_LABELS[k]} — {eSaved[k]?"Saved":"Not saved"}</span>
                </div>
              ))}
            </div>
           <div className="mrow">
  <button
    type="button"
    className="cbtn"
    onClick={() => setShowConfirm(false)}
  >
    Cancel
  </button>

  <button
    type="button"
    className="hod-btn"
    onClick={submitTask}
    disabled={saving}
  >
    {saving ? "Submitting..." : "Confirm and Submit"}
  </button>
</div>
          </div>
        </div>
      )}

      {/* TOASTS */}
<div className="twrp">
  {toasts.map(t => (
    <div
      key={t.id}
      className={"tst " + t.type}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px"
      }}
    >
      {t.type === "s" ? (
        <CheckCircle size={16} />
      ) : (
        <XCircle size={16} />
      )}

      <span>{t.msg}</span>
    </div>
  ))}
</div>
    </div>
  );
}