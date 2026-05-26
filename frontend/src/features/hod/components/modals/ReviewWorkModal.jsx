import React from "react";
import { RefreshCw, Edit3, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown } from "lucide-react";
import { SECTION_LABELS, PDF_DOC_TYPES, INSURANCE_TYPES_LIST } from "../../constants/hodConstants";
import { fmtRs, fmtDt, calcTotals, isRadiologyType, emptyPathReport, emptyRadReport } from "../../utils/hodUtils";
import PdfDownloadBtn from "../PdfDownloadBtn";
import AdmissionNoteForm from "../AdmissionNoteForm";
import PathologyReportCard from "../PathologyReportCard";
import RadiologyReportCard from "../RadiologyReportCard";
import SectionComment from "../SectionComment";

export default function ReviewWorkModal({
  reviewWorkModal, setReviewWorkModal, reviewWorkTask, reviewWorkPat,
  reviewWorkLoading, reviewSectionOpen, setReviewSectionOpen,
  reviewEditMode, setReviewEditMode, reviewComments, setReviewComments,
  reviewRating, setReviewRating, reviewOverallNote, setReviewOverallNote,
  reviewSubmitting, reviewSaving,
  rvEDis, setRvEDis, rvEMed, setRvEMed,
  rvELabRep, setRvELabRep, rvEMedBill, setRvEMedBill,
  rvESvc, setRvESvc, rvEBilling, setRvEBilling,
  rvDischargeSummary, setRvDischargeSummary,
  rvDischargeSummaryType, setRvDischargeSummaryType,
  updRvRep, updRvTest, addRvTest, delRvTest,
  saveReviewSection, approveReviewWork, revertReviewWork,
  toast, apiService,
}) {
  if (!reviewWorkModal) return null;

  const pat     = reviewWorkPat;
  const uhid    = pat?.uhid  || "";
  const admNo   = pat?.admNo || pat?.adm_no || "";
  const patName = pat?.patientName || "";
  const pathReps = rvELabRep.filter(r => !isRadiologyType(r.reportType));
  const radReps  = rvELabRep.filter(r =>  isRadiologyType(r.reportType));
  const totals   = calcTotals(rvESvc, rvELabRep, rvEMedBill, rvEBilling);

  const SectionAccordion = ({ sKey, icon, title, children }) => {
    const isOpen    = reviewSectionOpen[sKey];
    const isEditing = reviewEditMode[sKey];
    const isSaving  = reviewSaving[sKey];
    return (
      <div className="hod-rv-section">
        <div className="hod-rv-section-head" onClick={() => setReviewSectionOpen(p=>({...p,[sKey]:!p[sKey]}))}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:16 }}>{icon}</span>
            <span style={{ fontSize:13, fontWeight:700, color:"var(--text)" }}>{title}</span>
            {reviewComments[sKey] && <span style={{ fontSize:10, background:"rgba(245,158,11,0.15)", color:"#f59e0b", border:"1px solid rgba(245,158,11,0.3)", borderRadius:20, padding:"2px 8px" }}>💬 Has comment</span>}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }} onClick={e=>e.stopPropagation()}>
            {uhid && admNo && (
              <PdfDownloadBtn uhid={uhid} admNo={admNo}
                docType={sKey==="discharge"?"discharge_summary":sKey==="admission"?"admission_note":sKey==="reports"?"lab_reports":sKey==="medicines"?"medicine_bill":"final_bill"}
                label={title} icon={icon} onToast={toast}/>
            )}
            {!isEditing
              ? <button className="hod-btn hod-btn-amber" style={{ padding:"4px 12px", fontSize:11 }} onClick={()=>setReviewEditMode(p=>({...p,[sKey]:true}))}><Edit3 size={11}/> Edit & Correct</button>
              : <div style={{ display:"flex", gap:6 }}>
                  <button className="hod-btn hod-btn-primary" style={{ padding:"4px 12px", fontSize:11 }} disabled={isSaving} onClick={()=>saveReviewSection(sKey)}>
                    {isSaving?<RefreshCw size={11} style={{ animation:"spin 1s linear infinite" }}/>:"💾"} Save
                  </button>
                  <button className="hod-btn hod-btn-ghost" style={{ padding:"4px 12px", fontSize:11 }} onClick={()=>setReviewEditMode(p=>({...p,[sKey]:false}))}>Cancel</button>
                </div>
            }
            {isOpen?<ChevronUp size={15} style={{ color:"var(--text-muted)" }}/>:<ChevronDown size={15} style={{ color:"var(--text-muted)" }}/>}
          </div>
        </div>
        {isOpen && (
          <div className="hod-rv-section-body">
            {children}
            <SectionComment sectionKey={sKey} comments={reviewComments} onChange={(k,v)=>setReviewComments(p=>({...p,[k]:v}))}/>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="hod-overlay" onClick={()=>setReviewWorkModal(false)}>
      <div className="hod-modal hod-modal-xl" onClick={e=>e.stopPropagation()} style={{ display:"flex", flexDirection:"column" }}>
      <button
  className="hod-modal-close"
  onClick={() => setReviewWorkModal(false)}
  aria-label="Close"
  title="Close"
>
  ✕
</button>

        {/* Header */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, color:"var(--text-muted)", letterSpacing:".08em", textTransform:"uppercase", marginBottom:4 }}>HOD Work Review</div>
          <div style={{ fontSize:18, fontWeight:800, color:"var(--text)" }}>{patName}</div>
          <div style={{ fontSize:12, color:"var(--text-mid)", marginTop:3 }}>
            UHID: <strong>{uhid}</strong> &nbsp;·&nbsp; Adm: <strong>{admNo}</strong>
            &nbsp;·&nbsp; Employee: <strong>{reviewWorkTask?.assigned_to_name||reviewWorkTask?.employeeName||"—"}</strong>
          </div>
        </div>

        {/* PDF panel */}
        {uhid && admNo && (
          <div className="hod-pdf-panel">
            <div style={{ fontSize:12, fontWeight:700, color:"var(--text)" }}>📥 Download All Documents as PDF</div>
            <div className="hod-pdf-grid">
              {PDF_DOC_TYPES.map(d=><PdfDownloadBtn key={d.key} uhid={uhid} admNo={admNo} docType={d.key} label={d.label} icon={d.icon} onToast={toast}/>)}
            </div>
          </div>
        )}

        {reviewWorkLoading ? (
          <div style={{ textAlign:"center", padding:"60px 20px", color:"var(--text-muted)" }}>
            <RefreshCw size={24} style={{ animation:"spin 1s linear infinite", marginBottom:12 }}/>
            <div>Loading patient data…</div>
          </div>
        ) : (
          <div style={{ flex:1, overflowY:"auto", minHeight:0 }}>

            {/* Discharge Summary */}
            <SectionAccordion sKey="discharge" icon="📋" title="Discharge Summary">
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:12, marginBottom:14 }}>
                {[{k:"doa",lbl:"Date of Admission",type:"datetime-local"},{k:"dod",lbl:"Actual Discharge",type:"datetime-local"},{k:"ward",lbl:"Ward",type:"text"},{k:"bed",lbl:"Bed No.",type:"text"},{k:"doctor",lbl:"Treating Doctor",type:"text"},{k:"diagnosis",lbl:"Primary Diagnosis",type:"text"},{k:"condition",lbl:"Condition at Discharge",type:"text"}].map(f=>(
                  <div key={f.k}><label className="hod-lbl">{f.lbl}</label><input type={f.type} className="hod-finp" value={rvEDis?.[f.k]||""} disabled={!reviewEditMode.discharge} onChange={e=>setRvEDis(p=>({...p,[f.k]:e.target.value}))} style={{ opacity:reviewEditMode.discharge?1:0.8 }}/></div>
                ))}
                <div style={{ gridColumn:"1/-1" }}><label className="hod-lbl">Discharge Instructions</label><textarea className="hod-ftxt" value={rvEDis?.instructions||""} disabled={!reviewEditMode.discharge} onChange={e=>setRvEDis(p=>({...p,instructions:e.target.value}))}/></div>
              </div>
              {rvDischargeSummary&&Array.isArray(rvDischargeSummary.sections)&&rvDischargeSummary.sections.length>0&&(
                <div style={{ marginTop:16, borderTop:"1px solid var(--border)", paddingTop:16 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"var(--text)" }}>Discharge Summary Template</div>
                    <select className="hod-finp" style={{ width:"auto" }} value={rvDischargeSummaryType} disabled={!reviewEditMode.discharge}
                      onChange={e=>{const t=e.target.value;setRvDischargeSummaryType(t);apiService.getDynamicSummary(uhid,admNo,t).then(res=>{const c=res?.content||{sections:[]};if(c.sections&&!Array.isArray(c.sections))c.sections=Object.entries(c.sections).map(([k,v])=>({key:k,...v}));setRvDischargeSummary(c);}).catch(()=>{});}}>
                      {["NORMAL","LAMA","REFER","DOPR","DEATH"].map(t=><option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                    {rvDischargeSummary.sections.map((sec,idx)=>(
                      <div key={sec.key||idx}>
                        <label className="hod-lbl">{sec.label}</label>
                        {sec.type==="vitals_grid"
                          ? <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:10 }}>
                              {Object.entries(typeof sec.value==="object"&&sec.value!==null?sec.value:{}).map(([vk,vv])=>(
                                <div key={vk}><label className="hod-lbl" style={{ fontSize:9,textTransform:"uppercase" }}>{vk}</label>
                                <input className="hod-finp" value={vv||""} disabled={!reviewEditMode.discharge} onChange={e=>setRvDischargeSummary(prev=>{const secs=[...(prev?.sections||[])];secs[idx]={...secs[idx],value:{...(typeof secs[idx].value==="object"?secs[idx].value:{}),[vk]:e.target.value}};return{...prev,sections:secs};})}/></div>
                              ))}
                            </div>
                          : sec.type==="textarea"
                            ? <textarea className="hod-ftxt" rows={3} value={typeof sec.value==="string"?sec.value:""} disabled={!reviewEditMode.discharge} onChange={e=>setRvDischargeSummary(prev=>{const secs=[...(prev?.sections||[])];secs[idx]={...secs[idx],value:e.target.value};return{...prev,sections:secs};})}/>
                            : <input className="hod-finp" value={typeof sec.value==="string"?sec.value:""} disabled={!reviewEditMode.discharge} onChange={e=>setRvDischargeSummary(prev=>{const secs=[...(prev?.sections||[])];secs[idx]={...secs[idx],value:e.target.value};return{...prev,sections:secs};})}/>
                        }
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </SectionAccordion>

            {/* Admission Note */}
            <SectionAccordion sKey="admission" icon="🩺" title="Admission Note">
              <AdmissionNoteForm eMed={rvEMed} setEMed={setRvEMed} readOnly={!reviewEditMode.admission}/>
            </SectionAccordion>

            {/* Reports */}
            <SectionAccordion sKey="reports" icon="🗂️" title="Lab Reports">
              {rvELabRep.length===0
                ? <div style={{ color:"var(--text-muted)", fontStyle:"italic", fontSize:13 }}>No lab reports found for this admission.</div>
                : rvELabRep.map((rep,ri)=>{
                    if(isRadiologyType(rep.reportType)) return <RadiologyReportCard key={rep.id} rep={rep} ri={ri} patientName={patName} updRep={updRvRep} onRemove={()=>setRvELabRep(p=>p.filter(r=>r.id!==rep.id))} readOnly={!reviewEditMode.reports}/>;
                    return <PathologyReportCard key={rep.id} rep={rep} ri={ri} patientName={patName} updRep={updRvRep} updTest={updRvTest} addTest={addRvTest} delTest={delRvTest} onRemove={()=>setRvELabRep(p=>p.filter(r=>r.id!==rep.id))} readOnly={!reviewEditMode.reports}/>;
                  })
              }
              {reviewEditMode.reports&&(
                <div style={{ display:"flex", gap:10, marginTop:8 }}>
                  <button onClick={()=>setRvELabRep(p=>[...p,emptyPathReport()])} style={{ display:"inline-flex",alignItems:"center",gap:6,padding:"9px 18px",background:"linear-gradient(135deg,#1e3a5f,#0f172a)",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"inherit" }}>🧪 + Add Pathology</button>
                  <button onClick={()=>setRvELabRep(p=>[...p,emptyRadReport()])} style={{ display:"inline-flex",alignItems:"center",gap:6,padding:"9px 18px",background:"linear-gradient(135deg,#065f46,#064e3b)",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"inherit" }}>🩻 + Add Radiology</button>
                </div>
              )}
              <div style={{ marginTop:10, display:"flex", gap:10 }}>
                <span style={{ background:"rgba(59,130,246,0.1)",border:"1px solid rgba(59,130,246,0.3)",color:"#3b82f6",borderRadius:20,padding:"3px 11px",fontSize:11,fontWeight:700 }}>🧪 Path: {fmtRs(pathReps.reduce((a,r)=>a+Number(r.amount||0),0))}</span>
                <span style={{ background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.3)",color:"#10b981",borderRadius:20,padding:"3px 11px",fontSize:11,fontWeight:700 }}>🩻 Rad: {fmtRs(radReps.reduce((a,r)=>a+Number(r.amount||0),0))}</span>
              </div>
            </SectionAccordion>

            {/* Medicine Bill */}
            <SectionAccordion sKey="medicines" icon="💊" title="Medicine Bill">
              <div style={{ overflowX:"auto", border:"1px solid var(--border)", borderRadius:10, marginBottom:10 }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead><tr style={{ background:"var(--surface-2)" }}>{["Medicine","Date","Qty","Rate","Batch","Expiry","Amount",...(reviewEditMode.medicines?[""]:[])].map((h,i)=><th key={i} style={{ textAlign:"left",padding:"10px 14px",fontSize:11,fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:".06em",borderBottom:"1px solid var(--border)" }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {rvEMedBill.length===0
                      ?<tr><td colSpan={8} style={{ textAlign:"center",color:"var(--text-muted)",fontStyle:"italic",padding:18 }}>No medicines recorded.</td></tr>
                      :rvEMedBill.map((r,i)=>(
                        <tr key={r.id} style={{ borderBottom:"1px solid var(--border)" }}>
                          <td style={{ padding:"8px 14px" }}>{reviewEditMode.medicines?<input className="hod-tinp" value={r.item||""} onChange={e=>{const n=[...rvEMedBill];n[i]={...n[i],item:e.target.value};setRvEMedBill(n);}} style={{ minWidth:140 }}/>:<span style={{ fontWeight:600 }}>{r.item}</span>}</td>
                          <td style={{ padding:"8px 8px" }}>{reviewEditMode.medicines?<input className="hod-tinp" type="date" value={r.date||""} onChange={e=>{const n=[...rvEMedBill];n[i]={...n[i],date:e.target.value};setRvEMedBill(n);}}/>:fmtDt(r.date)}</td>
                          <td style={{ padding:"8px 8px" }}>{reviewEditMode.medicines?<input className="hod-tinp" type="number" min="1" value={r.quantity??1} style={{ width:60 }} onChange={e=>{const n=[...rvEMedBill];const qty=Math.max(1,Number(e.target.value)||1);n[i]={...n[i],quantity:qty,amount:qty*Number(n[i].rate||0)};setRvEMedBill(n);}}/>:r.quantity}</td>
                          <td style={{ padding:"8px 8px" }}>{reviewEditMode.medicines?<input className="hod-tinp" type="number" min="0" step="0.01" value={r.rate??0} style={{ width:90 }} onChange={e=>{const n=[...rvEMedBill];const rt=Number(e.target.value)||0;n[i]={...n[i],rate:rt,amount:rt*Number(n[i].quantity||1)};setRvEMedBill(n);}}/>:fmtRs(r.rate)}</td>
                          <td style={{ padding:"8px 8px",fontSize:11 }}>{r.batchNo||"—"}</td>
                          <td style={{ padding:"8px 8px",fontSize:11 }}>{r.expiryDate?fmtDt(r.expiryDate):"—"}</td>
                          <td style={{ padding:"8px 8px",fontWeight:700 }}>{fmtRs(r.amount||0)}</td>
                          {reviewEditMode.medicines&&<td style={{ padding:"8px 8px" }}><button onClick={()=>setRvEMedBill(p=>p.filter((_,j)=>j!==i))} style={{ background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",color:"#ef4444",borderRadius:5,padding:"4px 8px",cursor:"pointer",fontSize:12,fontFamily:"inherit" }}>×</button></td>}
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
              {reviewEditMode.medicines&&<button className="hod-addbtn" onClick={()=>setRvEMedBill(p=>[...p,{id:Date.now(),item:"",date:new Date().toISOString().slice(0,10),quantity:1,rate:0,amount:0,batchNo:"",expiryDate:""}])}>+ Add Medicine</button>}
              <div style={{ textAlign:"right",fontWeight:700,fontSize:14,marginTop:10,color:"var(--text)" }}>Total: {fmtRs(rvEMedBill.reduce((a,r)=>a+Number(r.amount||0),0))}</div>
            </SectionAccordion>

            {/* Final Bill */}
            <SectionAccordion sKey="billing" icon="🧾" title="Final Bill">
              <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:14 }}>
                <div>
                  <div style={{ fontSize:12,fontWeight:700,color:"var(--text)",marginBottom:10 }}>Services & Charges</div>
                  <div style={{ overflowX:"auto",border:"1px solid var(--border)",borderRadius:10 }}>
                    <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
                      <thead><tr style={{ background:"var(--surface-2)" }}>{["Service","Qty","Rate","Amount",...(reviewEditMode.billing?[""]:[])].map((h,i)=><th key={i} style={{ textAlign:"left",padding:"10px 14px",fontSize:11,fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:".06em",borderBottom:"1px solid var(--border)" }}>{h}</th>)}</tr></thead>
                      <tbody>
                        {rvESvc.length===0
                          ?<tr><td colSpan={5} style={{ textAlign:"center",color:"var(--text-muted)",fontStyle:"italic",padding:18 }}>No services recorded.</td></tr>
                          :rvESvc.map((r,i)=>(
                            <tr key={r.id} style={{ borderBottom:"1px solid var(--border)" }}>
                              <td style={{ padding:"8px 14px" }}>{reviewEditMode.billing?<input className="hod-tinp" value={r.name} onChange={e=>{const n=[...rvESvc];n[i]={...n[i],name:e.target.value};setRvESvc(n);}}/>:r.name}</td>
                              <td style={{ padding:"8px 8px" }}>{reviewEditMode.billing?<input className="hod-tinp" type="number" value={r.qty} style={{ width:60 }} onChange={e=>{const n=[...rvESvc];n[i]={...n[i],qty:e.target.value,amount:Number(e.target.value)*Number(n[i].rate||0)};setRvESvc(n);}}/>:r.qty}</td>
                              <td style={{ padding:"8px 8px" }}>{reviewEditMode.billing?<input className="hod-tinp" type="number" value={r.rate} style={{ width:90 }} onChange={e=>{const n=[...rvESvc];n[i]={...n[i],rate:e.target.value,amount:Number(n[i].qty||0)*Number(e.target.value)};setRvESvc(n);}}/>:fmtRs(r.rate)}</td>
                              <td style={{ padding:"8px 8px",fontWeight:700 }}>{fmtRs(r.amount||0)}</td>
                              {reviewEditMode.billing&&<td style={{ padding:"8px 8px" }}><button onClick={()=>setRvESvc(p=>p.filter((_,j)=>j!==i))} style={{ background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",color:"#ef4444",borderRadius:5,padding:"4px 8px",cursor:"pointer",fontSize:12,fontFamily:"inherit" }}>×</button></td>}
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </div>
                  {reviewEditMode.billing&&<button className="hod-addbtn" onClick={()=>setRvESvc(p=>[...p,{id:Date.now(),name:"",category:"",qty:1,rate:0,amount:0}])}>+ Add Service</button>}
                </div>
                <div>
                  <div style={{ fontSize:12,fontWeight:700,color:"var(--text)",marginBottom:10 }}>Payment Summary</div>
                  <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                    {[{k:"insuranceType",lbl:"Insurance Type",type:"select",opts:INSURANCE_TYPES_LIST},{k:"paymentMode",lbl:"Payment Mode",type:"select",opts:["Cash","UPI","Card","Insurance","NEFT","Cheque"]},{k:"discount",lbl:"Discount (₹)",type:"number"},{k:"advance",lbl:"Advance Paid (₹)",type:"number"},{k:"paidNow",lbl:"Paid Now (₹)",type:"number"}].map(f=>(
                      <div key={f.k}>
                        <label className="hod-lbl">{f.lbl}</label>
                        {f.type==="select"
                          ?<select className="hod-fsel" value={rvEBilling?.[f.k]||""} disabled={!reviewEditMode.billing} onChange={e=>setRvEBilling(p=>({...p,[f.k]:e.target.value}))}>{f.opts.map(o=><option key={o}>{o}</option>)}</select>
                          :<input type={f.type} className="hod-finp" value={rvEBilling?.[f.k]||0} disabled={!reviewEditMode.billing} onChange={e=>setRvEBilling(p=>({...p,[f.k]:e.target.value}))}/>
                        }
                      </div>
                    ))}
                  </div>
                  <div className="hod-tot-box">
                    <div className="hod-tot-row"><span style={{ color:"var(--text-muted)" }}>Services</span><span>{fmtRs(totals.s)}</span></div>
                    <div className="hod-tot-row"><span style={{ color:"var(--text-muted)" }}>Lab / Radiology</span><span>{fmtRs(totals.p)}</span></div>
                    <div className="hod-tot-row"><span style={{ color:"var(--text-muted)" }}>Medicines</span><span>{fmtRs(totals.m)}</span></div>
                    <div className="hod-tot-row"><span style={{ color:"var(--text-muted)" }}>Gross</span><span style={{ fontWeight:700 }}>{fmtRs(totals.gross)}</span></div>
                    <div className="hod-tot-row" style={{ color:"#ef4444" }}><span>Discount</span><span>- {fmtRs(totals.disc)}</span></div>
                    <div className="hod-tot-row hod-tot-fin"><span>Balance Due</span><span>{fmtRs(totals.due)}</span></div>
                  </div>
                </div>
              </div>
            </SectionAccordion>

            {/* Rating & Decision */}
            <div style={{ background:"var(--surface-2)",border:"1px solid var(--border)",borderRadius:12,padding:"18px 20px",marginTop:16 }}>
              <div style={{ fontSize:13,fontWeight:700,color:"var(--text)",marginBottom:14 }}>⭐ HOD Rating & Decision</div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16 }}>
                <div>
                  <label className="hod-lbl">Performance Rating</label>
                  <div className="hod-stars" style={{ marginTop:6 }}>
                    {[1,2,3,4,5].map(n=>(
                      <span key={n} className="hod-star" onClick={()=>setReviewRating(n)} style={{ color:n<=reviewRating?"#f59e0b":"var(--border-strong)" }}>★</span>
                    ))}
                    <span style={{ fontSize:12,color:"var(--text-muted)",marginLeft:8,alignSelf:"center" }}>{reviewRating}/5</span>
                  </div>
                </div>
                <div>
                  <label className="hod-lbl">Section Comments Summary</label>
                  <div style={{ fontSize:11,color:"var(--text-muted)",marginTop:6,lineHeight:1.7 }}>
                    {Object.entries(reviewComments).filter(([,v])=>v).length===0
                      ?<span style={{ fontStyle:"italic" }}>No section comments yet.</span>
                      :Object.entries(reviewComments).filter(([,v])=>v).map(([k,v])=>(
                        <div key={k}><strong style={{ color:"var(--text)" }}>{SECTION_LABELS[k]}:</strong> {v}</div>
                      ))
                    }
                  </div>
                </div>
              </div>
              <div>
                <label className="hod-lbl">Overall Handover Note / Decision Reason</label>
                <textarea className="hod-textarea" value={reviewOverallNote} placeholder="Write overall assessment, corrections made, approval notes, or reason for reverts…" onChange={e=>setReviewOverallNote(e.target.value)} rows={3}/>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display:"flex",gap:12,justifyContent:"flex-end",paddingTop:16,borderTop:"1px solid var(--border)",marginTop:12,flexWrap:"wrap" }}>
          <button className="hod-btn hod-btn-ghost" onClick={()=>setReviewWorkModal(false)}>Close</button>
          <button className="hod-btn hod-btn-revert" disabled={reviewSubmitting} onClick={revertReviewWork}>
            {reviewSubmitting?<RefreshCw size={13} style={{ animation:"spin 1s linear infinite" }}/>:<ThumbsDown size={13}/>} Revert to Employee
          </button>
          <button className="hod-btn hod-btn-approve" disabled={reviewSubmitting} onClick={approveReviewWork}>
            {reviewSubmitting?<RefreshCw size={13} style={{ animation:"spin 1s linear infinite" }}/>:<ThumbsUp size={13}/>} Approve & Submit Rating
          </button>
        </div>
      </div>
    </div>
  );
}
