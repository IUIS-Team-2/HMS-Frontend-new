import React from "react";
import { DISCHARGE_TYPES_CFG, DISCHARGE_SECTIONS_MAP } from "../../constants/mgmtConstants";

export default function SummaryModal({ showSummaryModal, editSumPt, summaryAdmNo, summaryType, setSummaryType, editDisFields, setEditDisFields, summarySaving, saveSummary, handlePrintSummary, setShowSummaryModal, setEditSumPt, bc, isDark, SUMMARY_TYPES, SUMMARY_LABELS }) {
const activeType = summaryType || editDisFields?.summary_type || editSumPt?.admissions?.[0]?.discharge?.dischargeStatus || "";
  if (!showSummaryModal || !editSumPt) return null;
  const dtCfg = DISCHARGE_TYPES_CFG[activeType] || DISCHARGE_TYPES_CFG.DOPR;
  const sections = DISCHARGE_SECTIONS_MAP[activeType] || DISCHARGE_SECTIONS_MAP.DOPR;
  const setF = (k,v) => setEditDisFields(p=>({...p,[k]:v}));
  return (
    <div className="hms-modal-overlay" onClick={e=>e.target===e.currentTarget&&(setShowSummaryModal(false),setEditSumPt(null))}>
      <div className="hms-modal-box" style={{width:780,maxHeight:"93vh",display:"flex",flexDirection:"column"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
          <div>
            <div className="hms-modal-title">Discharge Summary — {editSumPt.patientName||editSumPt.name}</div>
            <div style={{fontSize:11,color:"#64748b",marginTop:2}}>{editSumPt.uhid} · Adm #{summaryAdmNo} · {editSumPt._branchLabel||bc.label}</div>
          </div>
          
        </div>
       


          
<div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
  <div style={{padding:"5px 12px",borderRadius:20,fontSize:11,fontWeight:700,background:DISCHARGE_TYPES_CFG[editDisFields.summary_type || summaryType]?.bg,color:DISCHARGE_TYPES_CFG[editDisFields.summary_type || summaryType]?.color,border:`1px solid ${DISCHARGE_TYPES_CFG[editDisFields.summary_type || summaryType]?.color}`}}>
    {DISCHARGE_TYPES_CFG[editDisFields.summary_type || summaryType]?.icon} {SUMMARY_LABELS[editDisFields.summary_type || summaryType] || summaryType}
  
</div>

        </div>
        <div style={{background:dtCfg.bg,border:`2px solid ${dtCfg.border}`,borderRadius:12,padding:"12px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:24}}>{dtCfg.icon}</span>
          <div><div style={{fontSize:14,fontWeight:800,color:dtCfg.color}}>{dtCfg.label} Summary</div><div style={{fontSize:11,color:dtCfg.color,opacity:.75,marginTop:2}}>All fields are editable · Save then Print PDF</div></div>
        </div>
        <div style={{flex:1,overflowY:"auto",paddingRight:4}}>
          <div className="dis-section-card">
            <div className="dis-section-head">
              <div style={{width:22,height:22,borderRadius:6,background:dtCfg.bg,border:`1.5px solid ${dtCfg.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:dtCfg.color}}>📅</div>
              <span style={{fontSize:13,fontWeight:700,textTransform:"uppercase",letterSpacing:".04em"}}>Dates & Basic Information</span>
            </div>
            <div className="dis-section-body">
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12}}>
                <div><label className="hms-lbl">Date of Admission</label><input className="hms-inp" type="date" value={editDisFields.doa?.slice(0,10)||""} onChange={e=>setF("doa",e.target.value)}/></div>
                <div><label className="hms-lbl">Expected Discharge</label><input className="hms-inp" type="date" value={editDisFields.expectedDod?.slice(0,10)||""} onChange={e=>setF("expectedDod",e.target.value)}/></div>
                <div><label className="hms-lbl">Actual Discharge (DOD)</label><input className="hms-inp" type="date" value={editDisFields.dod?.slice(0,10)||""} onChange={e=>setF("dod",e.target.value)}/></div>
                <div><label className="hms-lbl">Ward</label><input className="hms-inp" value={editDisFields.ward||""} placeholder="e.g. General Ward" onChange={e=>setF("ward",e.target.value)}/></div>
                <div><label className="hms-lbl">Bed No.</label><input className="hms-inp" value={editDisFields.bed||""} placeholder="e.g. B-12" onChange={e=>setF("bed",e.target.value)}/></div>
                <div><label className="hms-lbl">Treating Doctor</label><input className="hms-inp" value={editDisFields.doctor||""} placeholder="Dr. Name" onChange={e=>setF("doctor",e.target.value)}/></div>
                <div style={{gridColumn:"1/-1"}}><label className="hms-lbl">Primary Diagnosis</label><input className="hms-inp" value={editDisFields.diagnosis||""} placeholder="e.g. Acute Appendicitis" onChange={e=>setF("diagnosis",e.target.value)}/></div>
              </div>
            </div>
          </div>
          {sections.map((sec,idx)=>(
            <div key={sec.key} className="dis-section-card">
              <div className="dis-section-head">
                <div style={{width:22,height:22,borderRadius:6,background:dtCfg.bg,border:`1.5px solid ${dtCfg.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:dtCfg.color}}>{idx+1}</div>
                <span style={{fontSize:13,fontWeight:700,textTransform:"uppercase",letterSpacing:".04em"}}>{sec.label}</span>
              </div>
              <div className="dis-section-body">
                {sec.type==="vitals_grid"?(
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12}}>
                    {[{k:"bp",lbl:"BP (mmHg)",ph:"120/80 mmHg"},{k:"pr",lbl:"Pulse (/min)",ph:"82/min"},{k:"spo2",lbl:"SPO2",ph:"98% On RA"},{k:"temp",lbl:"Temperature",ph:"98.6°F"},{k:"chest",lbl:"Chest",ph:"B/L Clear"},{k:"cvs",lbl:"CVS",ph:"S1 S2 +"},{k:"cns",lbl:"CNS",ph:"Conscious, Oriented"},{k:"pa",lbl:"P/A",ph:"Soft, Non-tender"}].map(v=>(
                      <div key={v.k}><label className="hms-lbl">{v.lbl}</label><input className="hms-inp" value={editDisFields[v.k]||""} placeholder={v.ph} onChange={e=>setF(v.k,e.target.value)}/></div>
                    ))}
                  </div>
                ):(
                  <textarea className="hms-textarea" rows={sec.rows||3} value={editDisFields[sec.key]||""} placeholder={`Enter ${sec.label.toLowerCase()}...`} style={{width:"100%",boxSizing:"border-box",resize:"vertical",lineHeight:1.55}} onChange={e=>setF(sec.key,e.target.value)}/>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="hms-modal-foot">
          <button className="hms-cancel-btn" onClick={()=>{setShowSummaryModal(false);setEditSumPt(null);}} disabled={summarySaving}>Cancel</button>
          <button style={{background:"transparent",border:`1px solid #3b82f640`,color:"#3b82f6",padding:"8px 14px",borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:700}} onClick={()=>handlePrintSummary({...editSumPt, summaryType: summaryType, dischargeSummary:{...(editSumPt?.dischargeSummary||{}), summary_type: summaryType, dischargeStatus: summaryType}})} disabled={summarySaving}>↓ Print PDF</button>
          <button className="hms-save-btn" onClick={saveSummary} disabled={summarySaving}>{summarySaving?"Saving…":"Save Summary"}</button>
        </div>
      </div>
    </div>
  );
}
