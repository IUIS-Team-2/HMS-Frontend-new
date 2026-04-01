import { useState } from "react";
import { T } from "../data/constants";
import { initials, fmtDate, fmtDT, admTotal } from "../utils/helpers";
import { Ico, IC } from "../components/ui/Icons";
import { statusBadge } from "../components/ui/SharedUI";

export default function PatientDetailModal({patient,onClose,onDischarge}){
  const [tab,setTab]=useState("info");
  const hasBill=adm=>adm.billing&&(adm.billing.paidNow||adm.billing.paymentMode);
  return(
    <div className="pdm-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="pdm-modal">
        <div className="pdm-hd">
          <div className="pdm-hd-left"><div className="pdm-avatar">{initials(patient.patientName)}</div><div><div className="pdm-hd-name">{patient.patientName}</div><div className="pdm-hd-meta">{patient.uhid} · {patient.gender} · {patient.bloodGroup} · {patient.phone}</div></div></div>
          <button className="pdm-close" onClick={onClose}><Ico d={IC.x} size={15} sw={2}/></button>
        </div>
        <div className="pdm-body">
          <div style={{display:"flex",gap:4,background:T.offwhite,borderRadius:12,padding:4,border:`1px solid ${T.border}`,width:"fit-content",marginBottom:20}}>
            {[{id:"info",label:"Registration",icon:IC.person},{id:"admissions",label:"Admissions & Discharge",icon:IC.bed},{id:"billing",label:"Billing",icon:IC.bill}].map(t=>(<button key={t.id} onClick={()=>setTab(t.id)} style={{display:"flex",alignItems:"center",gap:7,padding:"8px 16px",borderRadius:9,border:"none",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:tab===t.id?600:500,cursor:"pointer",transition:"all .18s",background:tab===t.id?T.primary:"transparent",color:tab===t.id?"#fff":T.textMuted,boxShadow:tab===t.id?"0 2px 8px rgba(11,37,69,.22)":"none"}}><Ico d={t.icon} size={13} sw={2}/>{t.label}</button>))}
          </div>

          {tab==="info"&&(<>
            <div className="pdm-section-title">Personal Details</div>
            <div className="pdm-grid">{[{l:"Patient Name",v:patient.patientName,hi:true},{l:"UHID",v:patient.uhid,hi:true},{l:"Guardian",v:patient.guardianName},{l:"Gender",v:patient.gender},{l:"Date of Birth",v:fmtDate(patient.dob)},{l:"Age",v:patient.ageYY?`${patient.ageYY}y ${patient.ageMM||0}m ${patient.ageDD||0}d`:""},{l:"Blood Group",v:patient.bloodGroup},{l:"Marital Status",v:patient.maritalStatus},{l:"National ID",v:patient.nationalId,hi:true}].map(({l,v,hi})=>(<div key={l} className={`pdm-item${hi?" hi":""}`}><div className="pdm-lbl">{l}</div><div className="pdm-val">{v||"—"}</div></div>))}</div>
            <div className="pdm-section-title">Contact</div>
            <div className="pdm-grid">{[{l:"Phone",v:patient.phone},{l:"Alternate",v:patient.altPhone||"—"},{l:"Email",v:patient.email},{l:"Address",v:patient.address}].map(({l,v})=>(<div key={l} className="pdm-item" style={l==="Address"?{gridColumn:"span 3"}:{}}><div className="pdm-lbl">{l}</div><div className="pdm-val">{v||"—"}</div></div>))}</div>
            {(patient.allergies||patient.remarks)&&<><div className="pdm-section-title">Notes</div><div className="pdm-grid">{patient.remarks&&<div className="pdm-item" style={{gridColumn:"span 1.5"}}><div className="pdm-lbl">Remarks</div><div className="pdm-val">{patient.remarks}</div></div>}{patient.allergies&&<div className="pdm-item" style={{gridColumn:"span 1.5"}}><div className="pdm-lbl">Allergies</div><div className="pdm-val">{patient.allergies}</div></div>}</div></>}
            {patient.tpa&&<><div className="pdm-section-title">TPA / Insurance</div><div className="pdm-grid">{[{l:"Panel",v:patient.tpa},{l:"Card Type",v:patient.tpaCardType||patient.tpaCard},{l:"Validity",v:fmtDate(patient.tpaValidity)}].map(({l,v})=>(<div key={l} className="pdm-item"><div className="pdm-lbl">{l}</div><div className="pdm-val">{v||"—"}</div></div>))}</div></>}
          </>)}

          {tab==="admissions"&&(patient.admissions.length===0?<div style={{textAlign:"center",padding:"40px 0",color:T.textMuted}}>No admissions recorded.</div>:[...patient.admissions].reverse().map((adm,i)=>{
            const isDischarged=adm.discharge?.dod&&adm.discharge?.dischargeStatus;
            return(<div key={i} className="pdm-adm-card">
              <div className="pdm-adm-hd">
                <div className="pdm-adm-left"><span style={{fontFamily:"'DM Serif Display',serif",fontSize:14,color:T.primary,fontWeight:600}}>Admission #{adm.admNo}</span><span className="adm-date">{fmtDT(adm.dateTime||adm.discharge?.doa)}</span>{adm.discharge?.department&&<span className="adm-dept">{adm.discharge.department}</span>}</div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>{statusBadge(adm.discharge?.dischargeStatus)}{!isDischarged&&<button className="ph-discharge-btn" onClick={()=>onDischarge(patient,adm)}><Ico d={IC.bed} size={12} sw={2}/>Discharge Now</button>}</div>
              </div>
              <div className="pdm-adm-body"><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>{[["Doctor",adm.discharge?.doctorName],["Ward",adm.discharge?.wardName],["Room/Bed",`${adm.discharge?.roomNo||"—"} / ${adm.discharge?.bedNo||"—"}`],["Admitted",fmtDT(adm.discharge?.doa)],["Discharged",adm.discharge?.dod?fmtDT(adm.discharge.dod):"Not yet"],["Diagnosis",adm.discharge?.diagnosis]].map(([l,v])=>(<div key={l} className="pdm-item"><div className="pdm-lbl">{l}</div><div className="pdm-val">{v||"—"}</div></div>))}</div></div>
            </div>);
          }))}

          {tab==="billing"&&(patient.admissions.length===0?<div style={{textAlign:"center",padding:"40px 0",color:T.textMuted}}>No billing records.</div>:[...patient.admissions].reverse().map((adm,i)=>{
            const billMade=hasBill(adm); const tot=admTotal(adm.services||[]); const disc=parseFloat(adm.billing?.discount)||0; const adv=parseFloat(adm.billing?.advance)||0; const paid=parseFloat(adm.billing?.paidNow)||0; const net=Math.max(0,tot-disc-adv-paid);
            return(<div key={i} className="pdm-adm-card">
              <div className="pdm-adm-hd">
                <div className="pdm-adm-left"><span style={{fontFamily:"'DM Serif Display',serif",fontSize:14,color:T.primary,fontWeight:600}}>Admission #{adm.admNo}</span><span className="adm-date">{fmtDate(adm.date||adm.discharge?.doa)}</span></div>
                <span className={`pdm-bill-badge ${billMade?"bill-yes":"bill-no"}`}><Ico d={billMade?IC.check:IC.pulse} size={11} sw={2.5}/>{billMade?"Bill Generated":"No Bill Yet"}</span>
              </div>
              {billMade&&(<div className="pdm-adm-body">
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:12}}>{[["Gross Total",`₹${tot.toFixed(2)}`],["Discount",`₹${disc.toFixed(2)}`],["Advance",`₹${adv.toFixed(2)}`],["Net Payable",`₹${net.toFixed(2)}`]].map(([l,v])=>(<div key={l} className={`pdm-item${l==="Net Payable"?" hi":""}`}><div className="pdm-lbl">{l}</div><div className="pdm-val">{v}</div></div>))}</div>
                {adm.billing?.paymentMode&&<div style={{fontSize:13,color:T.textMid}}><strong>Payment Mode:</strong> {adm.billing.paymentMode}</div>}
                {(adm.services||[]).length>0&&<><div style={{fontSize:11,fontWeight:700,color:T.textLight,textTransform:"uppercase",letterSpacing:".07em",margin:"14px 0 8px"}}>Services</div>{adm.services.map((s,si)=>(<div key={si} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"5px 0",borderBottom:`1px solid ${T.border}`,color:T.textMid}}><span>{s.title||s.type} {s.code?`(${s.code})`:""} × {s.qty}</span><span style={{fontWeight:600}}>₹{((parseFloat(s.rate)||0)*(parseInt(s.qty)||0)).toFixed(2)}</span></div>))}</>}
              </div>)}
            </div>);
          }))}
        </div>
      </div>
    </div>
  );
}