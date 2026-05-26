import React, { useState } from "react";
import { ArrowLeft, Printer, RefreshCw } from "lucide-react";
import { SECTION_KEYS, SECTION_LABELS, SECTION_ICONS, TAB_MAP, INSURANCE_TYPES_LIST, TPA_DOCS, PDF_DOC_TYPES, RADIOLOGY_REPORT_TYPES } from "../../constants/hodConstants";
import { fmtRs, fmtDt, calcTotals, isRadiologyType, emptyPathReport, emptyRadReport } from "../../utils/hodUtils";
import PdfDownloadBtn from "../PdfDownloadBtn";
import AdmissionNoteForm from "../AdmissionNoteForm";
import PathologyReportCard from "../PathologyReportCard";
import RadiologyReportCard from "../RadiologyReportCard";
import HodMedSearchDropdown from "../HodMedSearchDropdown";
import MedicineHistoryPicker from "../MedicineHistoryPicker";
import StatusBadge from "../StatusBadge";

export default function MyWorkPatient({
  myWorkSel, myActiveTab, setMyActiveTab, myShowConfirm, setMyShowConfirm,
  myEDis, setMyEDis, myEMed, setMyEMed, myESvc, setMyESvc,
  myELabRep, setMyELabRep, myEMedBill, setMyEMedBill, myEBilling, setMyEBilling,
  myESaved, myRepFilter, setMyRepFilter, reportSearch, setReportSearch,
  reportMaster, medicineMaster, serviceMaster, svcSearch, setSvcSearch,
  myDischargeSummary, setMyDischargeSummary, myDischargeSummaryType, setMyDischargeSummaryType,
  myDischargeSummaryLoading,
  updMyRep, updMyTest, addMyTest, delMyTest, updMySvc,
  addMedFromPicker, saveMySection, submitMyWork, submitNote, setSubmitNote,
  activeDept, currentUser, openMyWork, openAssignModal, setMyWorkView,
  toast, REPORT_TEMPLATES, API_BASE, apiService,
}) {
  const p = myWorkSel;
  if (!p) return null;
  const patientName = p.patientName || p.name || "";
  const pathReps = myELabRep.filter(r => !isRadiologyType(r.reportType));
  const radReps  = myELabRep.filter(r =>  isRadiologyType(r.reportType));
  const pathTotal = pathReps.reduce((a,r) => a + Number(r.amount||0), 0);
  const radTotal  = radReps.reduce((a,r)  => a + Number(r.amount||0), 0);
  const totals = calcTotals(myESvc, myELabRep, myEMedBill, myEBilling);
  const repFilterOptions = ["All","🧪 Pathology","🩻 Radiology",...Array.from(new Set(myELabRep.map(r=>r.reportType)))];
  const visibleReps = myELabRep.filter(r => {
    if (myRepFilter==="All") return true;
    if (myRepFilter==="🧪 Pathology") return !isRadiologyType(r.reportType);
    if (myRepFilter==="🩻 Radiology") return isRadiologyType(r.reportType);
    return r.reportType === myRepFilter;
  });
  const allSaved   = SECTION_KEYS.every(k => myESaved[k]);
  const savedCount = SECTION_KEYS.filter(k => myESaved[k]).length;
  const TABS = [
    {id:"discharge", sKey:"discharge", lbl:"Discharge Summary", ico:"📋"},
    {id:"medical",   sKey:"admission", lbl:"Admission Note",    ico:"🩺"},
    {id:"reports",   sKey:"reports",   lbl:"Reports",           ico:"🗂️"},
    {id:"med_bill",  sKey:"medicines", lbl:"Medicine Bill",     ico:"💊"},
    {id:"finalbill", sKey:"billing",   lbl:"Final Bill",        ico:"🧾"},
  ];

  return (
    <>
      <button className="hod-btn hod-btn-ghost" style={{ marginBottom:14 }}
        onClick={() => { setMyWorkView('list'); }}>
        <ArrowLeft size={13}/> Back to My Work List
      </button>

      {/* Patient Header */}
      <div className="hod-patient-hdr">
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, flexWrap:"wrap", marginBottom:8 }}>
          <div>
            <div style={{ fontSize:22, fontWeight:800, color:"var(--text)", marginBottom:3 }}>{patientName}</div>
            <div style={{ fontSize:13, color:"var(--text-mid)" }}>
              UHID: <strong style={{ color:"var(--text)" }}>{p.uhid}</strong> &nbsp;·&nbsp;
              Adm: <strong style={{ color:"var(--text)" }}>{p.admNo||"—"}</strong> &nbsp;·&nbsp;
              {p.ageYY||p.age||"—"} yrs · {p.gender||""}
            </div>
          </div>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:10 }}>
          {p.ward && <span className="hod-badge" style={{ background:"rgba(6,182,212,0.1)", color:"#06b6d4", borderColor:"rgba(6,182,212,0.3)" }}>🛏 {p.ward}</span>}
          {p.doctor && <span className="hod-badge" style={{ background:"rgba(6,182,212,0.1)", color:"#06b6d4", borderColor:"rgba(6,182,212,0.3)" }}>👨‍⚕️ {p.doctor}</span>}
          <StatusBadge status={p.dod?"completed":"pending"}/>
        </div>
        <div className="hod-dod-strip">
          <div className="hod-dod-item"><div className="hod-dod-lbl">Date of Admission</div><div className="hod-dod-val">{fmtDt(p.doa||p.dateTime)}</div></div>
          <div className="hod-dod-item"><div className="hod-dod-lbl">Expected Discharge</div><div className="hod-dod-val" style={{ color:"#f59e0b" }}>{myEDis.expectedDod?fmtDt(myEDis.expectedDod):"Not set"}</div></div>
          <div className="hod-dod-item"><div className="hod-dod-lbl">Actual Discharge</div><div className="hod-dod-val" style={{ color:"#10b981" }}>{p.dod?fmtDt(p.dod):"Not yet discharged"}</div></div>
          <div className="hod-dod-item"><div className="hod-dod-lbl">Diagnosis</div><div className="hod-dod-val" style={{ color:"#3b82f6" }}>{p.diagnosis||myEDis.diagnosis||"—"}</div></div>
        </div>
      </div>

      {/* PDF Downloads */}
      {p.uhid && (
        <div className="hod-pdf-panel">
          <div style={{ fontSize:12, fontWeight:700, color:"var(--text)" }}>📥 Download & Print Documents</div>
          <div className="hod-pdf-grid">
            {PDF_DOC_TYPES.map(d => (
              <PdfDownloadBtn key={d.key} uhid={p.uhid} admNo={p.admNo||1} docType={d.key} label={d.label} icon={d.icon} onToast={toast}/>
            ))}
          </div>
        </div>
      )}

      {/* Checklist */}
      <div className="hod-checklist">
        <div style={{ fontSize:10, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:".09em", marginBottom:14 }}>
          Task Checklist — save all 5 sections then submit to Admin Management
        </div>
        <div className="hod-checklist-steps">
          {SECTION_KEYS.map((k,idx) => (
            <div key={k} style={{ display:"flex", alignItems:"center", flex:1, minWidth:0 }}>
              <div className={`hod-step${myESaved[k]?" done":myActiveTab===TAB_MAP[k]?" cur":""}`}
                style={{ flex:1, minWidth:0 }} onClick={() => setMyActiveTab(TAB_MAP[k])}>
                <div className="hod-step-chk">{myESaved[k]?"✓":SECTION_ICONS[k]}</div>
                <div className="hod-step-lbl">{SECTION_LABELS[k]}</div>
              </div>
              {idx < SECTION_KEYS.length-1 && <div className={`hod-step-con${myESaved[k]?" done":""}`}/>}
            </div>
          ))}
        </div>
        <div style={{ borderTop:"1px solid var(--border)", paddingTop:14, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
          {allSaved
            ? <div style={{ fontSize:13, color:"#10b981", fontWeight:600 }}>✔ All sections saved — ready to submit!</div>
            : <div style={{ fontSize:13, color:"var(--text-muted)" }}><span style={{ color:"#f59e0b", fontWeight:700 }}>{5-savedCount} section{5-savedCount!==1?"s":""} remaining</span></div>
          }
          <button className="hod-btn hod-btn-navy" disabled={!allSaved} onClick={() => setMyShowConfirm(true)}>
            Submit to Admin Management →
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="hod-tabs" style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"12px 12px 0 0", marginBottom:0, overflow:"hidden" }}>
        {TABS.map(t => (
          <button key={t.id} className={`hod-tab${myActiveTab===t.id?" act":""}`} onClick={() => setMyActiveTab(t.id)}>
            {t.ico} {t.lbl} {myESaved[t.sKey] && <span className="hod-tab-dot"/>}
          </button>
        ))}
      </div>

      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderTop:"none", borderRadius:"0 0 12px 12px", padding:20, marginBottom:16 }}>

        {/* ── Discharge Tab ── */}
        {myActiveTab==="discharge" && (
          <div>
            <div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14, flexWrap:"wrap", gap:10 }}>
                <div style={{ fontSize:14, fontWeight:700, color:"var(--text)" }}>📝 Discharge Summary Template</div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <label className="hod-lbl" style={{ margin:0 }}>Type:</label>
                  <span style={{ padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:700, background:"rgba(59,130,246,0.1)", color:"#3b82f6", border:"1px solid rgba(59,130,246,0.3)" }}>{myDischargeSummaryType||"NORMAL"}</span>
                </div>
              </div>
              {myDischargeSummaryLoading
                ? <div style={{ textAlign:"center", padding:"30px", color:"var(--text-muted)", fontSize:13 }}>Loading summary template...</div>
                : myDischargeSummary&&Array.isArray(myDischargeSummary.sections)
                  ? <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                      {myDischargeSummary.sections.map((sec,idx) => (
                        <div key={sec.key||idx}>
                          <label className="hod-lbl" style={{ marginBottom:6 }}>{sec.label}</label>
                          {sec.type==="vitals_grid"
                            ? <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:10 }}>
                                {Object.entries(typeof sec.value==="object"&&sec.value!==null?sec.value:{}).map(([vk,vv])=>(
                                  <div key={vk}><label className="hod-lbl" style={{ textTransform:"uppercase", fontSize:9 }}>{vk}</label>
                                  <input className="hod-finp" value={vv||""} onChange={e=>{setMyDischargeSummary(prev=>{const secs=[...(prev?.sections||[])];secs[idx]={...secs[idx],value:{...(typeof secs[idx].value==="object"?secs[idx].value:{}),[vk]:e.target.value}};return{...prev,sections:secs};});}}/></div>
                                ))}
                              </div>
                            : sec.type==="textarea"
                              ? <textarea className="hod-ftxt" rows={3} value={typeof sec.value==="string"?sec.value:""} onChange={e=>{setMyDischargeSummary(prev=>{const secs=[...(prev?.sections||[])];secs[idx]={...secs[idx],value:e.target.value};return{...prev,sections:secs};});}}/>
                              : <input className="hod-finp" value={typeof sec.value==="string"?sec.value:""} onChange={e=>{setMyDischargeSummary(prev=>{const secs=[...(prev?.sections||[])];secs[idx]={...secs[idx],value:e.target.value};return{...prev,sections:secs};});}}/>
                          }
                        </div>
                      ))}
                      <button className="hod-btn hod-btn-primary" style={{ alignSelf:"flex-start" }}
                        onClick={async()=>{try{await apiService.saveDynamicSummary(p.uhid,p.admNo,{summary_type:myDischargeSummaryType,content:myDischargeSummary});toast("Discharge summary saved ✓");}catch{toast("Failed to save discharge summary","e");}}}>
                        Save Discharge Summary Template
                      </button>
                    </div>
                  : <div style={{ textAlign:"center", padding:"20px", color:"var(--text-muted)", fontSize:13, fontStyle:"italic" }}>No summary template loaded.</div>
              }
            </div>
          </div>
        )}

        {/* ── Admission Tab ── */}
        {myActiveTab==="medical" && <AdmissionNoteForm eMed={myEMed} setEMed={setMyEMed} readOnly={false}/>}

        {/* ── Reports Tab ── */}
        {myActiveTab==="reports" && (
          <>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center", marginBottom:14 }}>
              <span style={{ background:"rgba(59,130,246,0.1)", border:"1px solid rgba(59,130,246,0.3)", color:"#3b82f6", borderRadius:20, padding:"3px 11px", fontSize:11, fontWeight:700 }}>🧪 Path: {fmtRs(pathTotal)} ({pathReps.length})</span>
              <span style={{ background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.3)", color:"#10b981", borderRadius:20, padding:"3px 11px", fontSize:11, fontWeight:700 }}>🩻 Rad: {fmtRs(radTotal)} ({radReps.length})</span>
              <span style={{ background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.3)", color:"#6366f1", borderRadius:20, padding:"3px 11px", fontSize:11, fontWeight:700 }}>Grand: {fmtRs(pathTotal+radTotal)}</span>
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:14 }}>
              {repFilterOptions.map(t=>(
                <button key={t} onClick={()=>setMyRepFilter(t)} style={{ padding:"5px 13px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit", border:myRepFilter===t?"1.5px solid var(--text)":"1.5px solid var(--border)", background:myRepFilter===t?"var(--text)":"var(--surface)", color:myRepFilter===t?"var(--surface)":"var(--text-mid)" }}>{t}</button>
              ))}
            </div>
            <select style={{ padding:"10px 14px", borderRadius:10, border:"1px solid var(--border)", background:"var(--surface)", minWidth:260, fontSize:13, fontFamily:"inherit", marginBottom:14 }}
              onChange={e=>{
                if(!e.target.value) return;
                const tmpl=Object.values(REPORT_TEMPLATES).find(t=>t.label===e.target.value);
                const isRad=RADIOLOGY_REPORT_TYPES.includes(tmpl?.dept||"");
                setMyELabRep(prev=>[...prev, isRad?{...emptyRadReport(),reportName:tmpl?.label||e.target.value,reportType:tmpl?.dept||"X-Ray"}:{...emptyPathReport(),reportName:tmpl?.label||e.target.value,reportType:tmpl?.dept||"Haematology",tests:Array.isArray(tmpl?.tests)&&tmpl.tests.length?tmpl.tests.map(t=>({...t,id:Date.now()+Math.random()})):[]}]);
                e.target.value="";
              }}>
              <option value="">+ Add Report Template</option>
              {Object.values(REPORT_TEMPLATES).map(r=><option key={r.key} value={r.label}>{r.label}</option>)}
            </select>
            <div style={{ marginBottom:14, position:"relative" }}>
              <input type="text" value={reportSearch} onChange={e=>setReportSearch(e.target.value)} placeholder="Search pathology / radiology templates..."
                style={{ width:"100%", padding:"12px 14px", border:"1px solid var(--border)", borderRadius:10, fontSize:13, outline:"none", background:"var(--surface)", color:"var(--text)" }}/>
              {reportSearch && (
                <div style={{ position:"absolute", top:"105%", left:0, right:0, background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, maxHeight:260, overflowY:"auto", zIndex:50, boxShadow:"0 10px 24px rgba(0,0,0,0.08)" }}>
                  {Object.values(REPORT_TEMPLATES).filter(r=>(r.label||"").toLowerCase().includes(reportSearch.toLowerCase())).slice(0,20).map(r=>(
                    <button key={r.key} type="button" onClick={()=>{ const isRad=RADIOLOGY_REPORT_TYPES.includes(r.dept||""); setMyELabRep(prev=>[...prev,isRad?{...emptyRadReport(),reportName:r.label,reportType:r.dept||"X-Ray"}:{...emptyPathReport(),reportName:r.label,reportType:r.dept||"Haematology",tests:Array.isArray(r.tests)&&r.tests.length?r.tests.map(t=>({...t,id:Date.now()+Math.random()})):[]}]); setReportSearch(""); }}
                      style={{ width:"100%", textAlign:"left", padding:"10px 12px", border:"none", background:"transparent", cursor:"pointer", borderBottom:"1px solid var(--border)", fontSize:13, fontFamily:"inherit", color:"var(--text)" }}>
                      🧪 {r.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {visibleReps.map(rep => {
              const ri = myELabRep.findIndex(r=>r.id===rep.id);
              if (isRadiologyType(rep.reportType)) return (
                <RadiologyReportCard key={rep.id} rep={rep} ri={ri} patientName={patientName} updRep={updMyRep}
                  onRemove={()=>setMyELabRep(pr=>pr.filter(r=>r.id!==rep.id))} readOnly={false}
                  onSave={async()=>{try{await apiService.saveLabReportsBulk(p.uhid,p.admNo||p.id,[rep]);toast(`${rep.reportName||"Report"} saved ✓`);}catch{toast("Failed to save report","e");}}}
                  onPrint={()=>{if(p.uhid&&(p.admNo||p.id))window.open(`${API_BASE}/patients/${p.uhid}/admissions/${p.admNo||p.id}/lab-reports/print/`,"_blank");}}/>
              );
              return (
                <PathologyReportCard key={rep.id} rep={rep} ri={ri} patientName={patientName} updRep={updMyRep} updTest={updMyTest} addTest={addMyTest} delTest={delMyTest}
                  onRemove={()=>setMyELabRep(pr=>pr.filter(r=>r.id!==rep.id))} readOnly={false}
                  onSave={async()=>{try{await apiService.saveLabReportsBulk(p.uhid,p.admNo||p.id,[rep]);toast(`${rep.reportName||"Report"} saved ✓`);}catch{toast("Failed to save report","e");}}}
                  onPrint={()=>{if(p.uhid&&(p.admNo||p.id))window.open(`${API_BASE}/patients/${p.uhid}/admissions/${p.admNo||p.id}/lab-reports/print/`,"_blank");}}/>
              );
            })}
            <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginTop:4 }}>
              <button onClick={()=>setMyELabRep(pr=>[...pr,emptyPathReport()])} style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"10px 20px", background:"linear-gradient(135deg,#1e3a5f,#0f172a)", color:"#fff", border:"none", borderRadius:9, cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"inherit" }}>🧪 + Add Pathology Report</button>
              <button onClick={()=>setMyELabRep(pr=>[...pr,emptyRadReport()])} style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"10px 20px", background:"linear-gradient(135deg,#065f46,#064e3b)", color:"#fff", border:"none", borderRadius:9, cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"inherit" }}>🩻 + Add Radiology Report</button>
            </div>
          </>
        )}

        {/* ── Medicine Bill Tab ── */}
        {myActiveTab==="med_bill" && (
          <>
            <MedicineHistoryPicker eMed={myEMed} onAdd={addMedFromPicker}/>
            <HodMedSearchDropdown medicineMaster={medicineMaster} existingItems={myEMedBill} onSelect={row=>setMyEMedBill(pr=>[...pr,row])}/>
            <div style={{ overflowX:"auto", border:"1px solid var(--border)", borderRadius:10, marginBottom:10 }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead><tr style={{ background:"var(--surface-2)" }}>{["Medicine Name","Date","Qty","Rate (₹)","Batch No.","Expiry","Amount (₹)",""].map((h,i)=><th key={i} style={{ textAlign:"left", padding:"10px 14px", fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:".06em", borderBottom:"1px solid var(--border)", whiteSpace:"nowrap" }}>{h}</th>)}</tr></thead>
                <tbody>
                  {myEMedBill.map((r,i)=>(
                    <tr key={r.id} style={{ borderBottom:"1px solid var(--border)" }}>
                      <td style={{ padding:"8px 14px" }}><input className="hod-tinp" value={r.item||""} onChange={e=>{const n=[...myEMedBill];n[i]={...n[i],item:e.target.value};setMyEMedBill(n);}} style={{ minWidth:160 }}/></td>
                      <td style={{ padding:"8px 8px" }}><input className="hod-tinp" type="date" value={r.date||""} onChange={e=>{const n=[...myEMedBill];n[i]={...n[i],date:e.target.value};setMyEMedBill(n);}}/></td>
                      <td style={{ padding:"8px 8px" }}><input className="hod-tinp" type="number" min="1" value={r.quantity??1} onChange={e=>{const n=[...myEMedBill];const qty=Math.max(1,Number(e.target.value)||1);n[i]={...n[i],quantity:qty,amount:qty*Number(n[i].rate||0)};setMyEMedBill(n);}} style={{ width:60 }}/></td>
                      <td style={{ padding:"8px 8px" }}><input className="hod-tinp" type="number" min="0" step="0.01" value={r.rate??0} onChange={e=>{const n=[...myEMedBill];const rt=Number(e.target.value)||0;n[i]={...n[i],rate:rt,amount:rt*Number(n[i].quantity||1)};setMyEMedBill(n);}} style={{ width:90 }}/></td>
                      <td style={{ padding:"8px 8px" }}><input className="hod-tinp" value={r.batchNo||""} onChange={e=>{const n=[...myEMedBill];n[i]={...n[i],batchNo:e.target.value};setMyEMedBill(n);}} style={{ width:100 }}/></td>
                      <td style={{ padding:"8px 8px" }}><input className="hod-tinp" type="date" value={r.expiryDate||""} onChange={e=>{const n=[...myEMedBill];n[i]={...n[i],expiryDate:e.target.value};setMyEMedBill(n);}}/></td>
                      <td style={{ padding:"8px 8px", fontWeight:700, whiteSpace:"nowrap" }}>{fmtRs(r.amount||0)}</td>
                      <td style={{ padding:"8px 8px" }}><button onClick={()=>setMyEMedBill(pr=>pr.filter((_,j)=>j!==i))} style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", color:"#ef4444", borderRadius:5, padding:"4px 8px", cursor:"pointer", fontSize:12, fontFamily:"inherit" }}>×</button></td>
                    </tr>
                  ))}
                  {myEMedBill.length===0&&<tr><td colSpan={8} style={{ textAlign:"center", color:"var(--text-muted)", fontStyle:"italic", padding:"18px" }}>No medicines added.</td></tr>}
                </tbody>
              </table>
            </div>
            <button className="hod-addbtn" onClick={()=>setMyEMedBill(pr=>[...pr,{id:Date.now(),item:"",date:new Date().toISOString().slice(0,10),quantity:1,rate:0,amount:0,batchNo:"",expiryDate:""}])}>+ Add Medicine Manually</button>
            <div className="hod-tot-box"><div className="hod-tot-row hod-tot-fin"><span>Medicine Total</span><span>{fmtRs(myEMedBill.reduce((a,r)=>a+Number(r.amount||0),0))}</span></div></div>
          </>
        )}

        {/* ── Final Bill Tab ── */}
        {myActiveTab==="finalbill" && (
          <div className="hod-bgrid">
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:"var(--text)", marginBottom:12 }}>🧾 Services & Charges</div>
              <div style={{ overflowX:"auto", border:"1px solid var(--border)", borderRadius:10, marginBottom:10 }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead><tr style={{ background:"var(--surface-2)" }}>{["Service","Category","Qty","Rate","Amount",""].map((h,i)=><th key={i} style={{ textAlign:"left", padding:"10px 14px", fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:".06em", borderBottom:"1px solid var(--border)" }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {myESvc.map((r,i)=>(
                      <tr key={r.id} style={{ borderBottom:"1px solid var(--border)" }}>
                        <td style={{ padding:"8px 14px", position:"relative", minWidth:180 }}>
                          <input className="hod-tinp" value={svcSearch[i]!==undefined?svcSearch[i]:r.name}
                            onChange={e=>{ setSvcSearch(pr=>({...pr,[i]:e.target.value})); updMySvc(i,"name",e.target.value); }}
                            placeholder="Search service..." style={{ minWidth:160 }}/>
                          {svcSearch[i]!==undefined&&svcSearch[i].length>0&&(
                            <div style={{ position:"absolute",top:"105%",left:0,right:0,background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,maxHeight:200,overflowY:"auto",zIndex:99,boxShadow:"0 8px 24px rgba(0,0,0,0.1)" }}>
                              {serviceMaster.filter(s=>(s.description||s.name||"").toLowerCase().includes(svcSearch[i].toLowerCase())).slice(0,15).map(s=>(
                                <button key={s.id} type="button" onClick={()=>{ updMySvc(i,"name",s.description||s.name); updMySvc(i,"category",s.category||s.service_category||""); updMySvc(i,"rate",Number(s.rate||s.price||0)); updMySvc(i,"amount",Number(r.qty||1)*Number(s.rate||s.price||0)); setSvcSearch(pr=>({...pr,[i]:undefined})); }}
                                  style={{ width:"100%",textAlign:"left",padding:"9px 12px",border:"none",background:"transparent",cursor:"pointer",borderBottom:"1px solid var(--border)",fontSize:12,fontFamily:"inherit",color:"var(--text)" }}>
                                  {s.description||s.name}{s.rate?<span style={{ float:"right",color:"#10b981",fontWeight:700 }}>₹{s.rate}</span>:""}
                                </button>
                              ))}
                            </div>
                          )}
                        </td>
                        <td style={{ padding:"8px 14px" }}><input className="hod-tinp" value={r.category} onChange={e=>updMySvc(i,"category",e.target.value)}/></td>
                        <td style={{ padding:"8px 14px" }}><input className="hod-tinp" type="number" value={r.qty} onChange={e=>updMySvc(i,"qty",e.target.value)}/></td>
                        <td style={{ padding:"8px 14px" }}><input className="hod-tinp" type="number" value={r.rate} onChange={e=>updMySvc(i,"rate",e.target.value)}/></td>
                        <td style={{ padding:"8px 14px", fontWeight:700 }}>{fmtRs(r.amount)}</td>
                        <td style={{ padding:"8px 14px" }}><button onClick={()=>setMyESvc(pr=>pr.filter((_,j)=>j!==i))} style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", color:"#ef4444", borderRadius:5, padding:"4px 8px", cursor:"pointer", fontSize:12, fontFamily:"inherit" }}>×</button></td>
                      </tr>
                    ))}
                    {myESvc.length===0&&<tr><td colSpan={6} style={{ textAlign:"center", color:"var(--text-muted)", fontStyle:"italic", padding:"18px" }}>No services added yet.</td></tr>}
                  </tbody>
                </table>
              </div>
              <button className="hod-addbtn" onClick={()=>setMyESvc(pr=>[...pr,{id:Date.now(),name:"",category:"",qty:1,rate:0,amount:0}])}>+ Add Service</button>
            </div>
            <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:18 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"var(--text)", marginBottom:14 }}>💳 Payment Details</div>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {[{k:"discount",lbl:"Discount (₹)"},{k:"advance",lbl:"Advance Paid (₹)"},{k:"paidNow",lbl:"Paid Now (₹)"}].map(f=>(
                  <div key={f.k}><label className="hod-lbl">{f.lbl}</label><input className="hod-finp" type="number" value={myEBilling?.[f.k]||0} onChange={e=>setMyEBilling(pr=>({...pr,[f.k]:e.target.value}))}/></div>
                ))}
                <div><label className="hod-lbl">Payment Mode</label><select className="hod-fsel" value={myEBilling?.paymentMode||"Cash"} onChange={e=>setMyEBilling(pr=>({...pr,paymentMode:e.target.value}))}>{["Cash","UPI","Card","Insurance","NEFT","Cheque"].map(m=><option key={m}>{m}</option>)}</select></div>
                <div><label className="hod-lbl">Insurance Type</label><select className="hod-fsel" value={myEBilling?.insuranceType||"Self Pay"} onChange={e=>setMyEBilling(pr=>({...pr,insuranceType:e.target.value}))}>{INSURANCE_TYPES_LIST.map(t=><option key={t}>{t}</option>)}</select></div>
              </div>
              <div className="hod-tot-box">
                <div className="hod-tot-row"><span style={{ color:"var(--text-muted)" }}>Services</span><span style={{ fontWeight:700 }}>{fmtRs(totals.s)}</span></div>
                <div className="hod-tot-row"><span style={{ color:"var(--text-muted)" }}>🧪 Path + 🩻 Rad</span><span style={{ fontWeight:700 }}>{fmtRs(pathTotal+radTotal)}</span></div>
                <div className="hod-tot-row"><span style={{ color:"var(--text-muted)" }}>Medicines</span><span style={{ fontWeight:700 }}>{fmtRs(totals.m)}</span></div>
                <div className="hod-tot-row"><span style={{ color:"var(--text-muted)" }}>Gross Total</span><span style={{ fontWeight:700 }}>{fmtRs(totals.gross)}</span></div>
                <div className="hod-tot-row" style={{ color:"#ef4444" }}><span>Discount</span><span>- {fmtRs(totals.disc)}</span></div>
                <div className="hod-tot-row"><span style={{ color:"var(--text-muted)" }}>Net Payable</span><span style={{ fontWeight:700 }}>{fmtRs(totals.net)}</span></div>
                <div className="hod-tot-row hod-tot-fin"><span>Balance Due</span><span>{fmtRs(totals.due)}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Save button row */}
        <div style={{ marginTop:16, paddingTop:14, borderTop:"1px solid var(--border)", display:"flex", gap:10, justifyContent:"flex-end" }}>
          <PdfDownloadBtn
            uhid={p.uhid} admNo={p.admNo||1}
            docType={({discharge:"discharge_summary",medical:"admission_note",reports:"lab_reports",med_bill:"medicine_bill",finalbill:"final_bill"})[myActiveTab]||"discharge_summary"}
            label={({discharge:"Discharge Summary",medical:"Admission Note",reports:"Lab Reports",med_bill:"Medicine Bill",finalbill:"Final Bill"})[myActiveTab]||"Document"}
            icon={({discharge:"📋",medical:"🩺",reports:"🗂️",med_bill:"💊",finalbill:"🧾"})[myActiveTab]||"📄"}
            onToast={toast}
          />
          <button className="hod-savebtn"
            onClick={()=>{const m={discharge:"discharge",medical:"admission",reports:"reports",med_bill:"medicines",finalbill:"billing"};const sKey=m[myActiveTab];saveMySection(sKey,SECTION_LABELS[sKey]);}}>
            💾 Save {SECTION_LABELS[({discharge:"discharge",medical:"admission",reports:"reports",med_bill:"medicines",finalbill:"billing"})[myActiveTab]]}
          </button>
        </div>
      </div>

      {/* Submit confirm modal */}
      {myShowConfirm && (
        <div className="hod-overlay" onClick={()=>setMyShowConfirm(false)}>
          <div className="hod-modal" onClick={e=>e.stopPropagation()}>
            <button className="hod-modal-close" onClick={()=>setMyShowConfirm(false)}>✕</button>
            <div style={{ textAlign:"center", marginBottom:16 }}>
              <div style={{ fontSize:40, marginBottom:10 }}>📤</div>
              <div style={{ fontSize:16, fontWeight:700, color:"var(--text)", marginBottom:6 }}>Submit to Admin Management</div>
              <div style={{ fontSize:12, color:"var(--text-muted)" }}>Submitting complete file for <strong style={{ color:"var(--text)" }}>{patientName}</strong> ({p.uhid})</div>
            </div>
            <div style={{ background:"var(--surface-2)", borderRadius:10, padding:16, marginBottom:16, display:"flex", flexDirection:"column", gap:8 }}>
              {SECTION_KEYS.map(k=>(<div key={k} style={{ display:"flex", alignItems:"center", gap:10, fontSize:13 }}><span>{myESaved[k]?"✅":"⚠️"}</span><span style={{ color:myESaved[k]?"#10b981":"#f59e0b", fontWeight:600 }}>{SECTION_ICONS[k]} {SECTION_LABELS[k]} — {myESaved[k]?"Saved":"Not saved"}</span></div>))}
            </div>
            <div className="hod-form-row"><label className="hod-lbl">Handover Note (optional)</label><textarea className="hod-textarea" value={submitNote} placeholder="Any notes for Admin Management…" onChange={e=>setSubmitNote(e.target.value)}/></div>
            <div className="hod-modal-foot">
              <button className="hod-btn hod-btn-ghost" onClick={()=>setMyShowConfirm(false)}>Cancel</button>
              <button className="hod-btn hod-btn-navy" onClick={submitMyWork}>Confirm Submit →</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
