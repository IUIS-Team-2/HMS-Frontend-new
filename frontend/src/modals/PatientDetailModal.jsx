import { useState } from "react";
import { T } from "../data/constants";
import { initials, fmtDate, fmtDT, admTotal } from "../utils/helpers";
import { Ico, IC } from "../components/ui/Icons";
import { statusBadge } from "../components/ui/SharedUI";
import { apiService } from "../services/apiService";

export default function PatientDetailModal({patient,onClose,onDischarge,onSaved,currentUser}){
  const [tab,setTab]=useState("info");
  const [isEditing,setIsEditing]=useState(false);
  const canEditPatient = String(currentUser?.role || "").toLowerCase() !== "receptionist";
  const [editData,setEditData]=useState({
    patientName:patient.patientName||"",
    guardianName:patient.guardianName||"",
    gender:patient.gender||"",
    dob:patient.dob||"",
    bloodGroup:patient.bloodGroup||"",
    maritalStatus:patient.maritalStatus||"",
    nationalId:patient.nationalId||"",
    phone:patient.phone||"",
    altPhone:patient.altPhone||"",
    email:patient.email||"",
    address:patient.address||"",
    remarks:patient.remarks||"",
    allergies:patient.allergies||"",
    tpa:patient.tpa||"",
    tpaCard:patient.tpaCard||"",
    tpaValidity:patient.tpaValidity||"",
    tpaCardType:patient.tpaCardType||"",
    tpaPanelCardNo:patient.tpaPanelCardNo||"",
    tpaPanelValidity:patient.tpaPanelValidity||"",
    payMode:patient.payMode||"",
  });
  const [saving,setSaving]=useState(false);
  const [saveError,setSaveError]=useState("");

  const handleEditChange=(field,value)=>{
    setEditData(prev=>({...prev,[field]:value}));
    setSaveError("");
  };

  const handleSave=async()=>{
    setSaving(true);
    setSaveError("");
    try{
      const updatedPatient = await apiService.updatePatient(patient.uhid,editData);
      onSaved?.(updatedPatient);
      setIsEditing(false);
    }catch(err){
      setSaveError(err.response?.data?.detail||err.message||"Failed to save patient details");
    }finally{
      setSaving(false);
    }
  };

  const hasBill=adm=>adm.billing&&(adm.billing.paidNow||adm.billing.paymentMode);
  return(
    <div className="pdm-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="pdm-modal">
        <div className="pdm-hd">
          <div className="pdm-hd-left"><div className="pdm-avatar">{initials(patient.patientName)}</div><div><div className="pdm-hd-name">{patient.patientName}</div><div className="pdm-hd-meta">{patient.uhid} · {patient.gender} · {patient.bloodGroup} · {patient.phone}</div></div></div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {canEditPatient && tab==="info"&&!isEditing&&<button onClick={()=>{setIsEditing(true);setSaveError("");}} style={{padding:"7px 14px",borderRadius:8,border:"1px solid #3b82f6",background:"#eff6ff",color:"#3b82f6",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><Ico d={IC.edit} size={13} sw={2}/>Edit</button>}
            {isEditing&&<div style={{display:"flex",gap:6}}><button onClick={handleSave} disabled={saving} style={{padding:"7px 14px",borderRadius:8,border:"none",background:saving?"#ccc":"#10b981",color:"#fff",fontSize:13,fontWeight:600,cursor:saving?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:5}}><Ico d={IC.check} size={13} sw={2}/>{saving?"Saving...":"Save"}</button><button onClick={()=>setIsEditing(false)} style={{padding:"7px 14px",borderRadius:8,border:"1px solid #ddd",background:"#fff",color:"#666",fontSize:13,fontWeight:600,cursor:"pointer"}}>Cancel</button></div>}
            <button className="pdm-close" onClick={onClose}><Ico d={IC.x} size={15} sw={2}/></button>
          </div>
        </div>
        {saveError&&<div style={{background:"#fee2e2",border:"1px solid #fca5a5",color:"#dc2626",padding:"10px 16px",margin:"12px 16px 0",borderRadius:8,fontSize:13}}>{saveError}</div>}
        <div className="pdm-body">
          <div style={{display:"flex",gap:4,background:T.offwhite,borderRadius:12,padding:4,border:`1px solid ${T.border}`,width:"fit-content",marginBottom:20}}>
            {[{id:"info",label:"Registration",icon:IC.person},{id:"admissions",label:"Admissions & Discharge",icon:IC.bed},{id:"billing",label:"Billing",icon:IC.bill}].map(t=>(<button key={t.id} onClick={()=>setTab(t.id)} style={{display:"flex",alignItems:"center",gap:7,padding:"8px 16px",borderRadius:9,border:"none",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:tab===t.id?600:500,cursor:"pointer",transition:"all .18s",background:tab===t.id?T.primary:"transparent",color:tab===t.id?"#fff":T.textMuted,boxShadow:tab===t.id?"0 2px 8px rgba(11,37,69,.22)":"none"}}><Ico d={t.icon} size={13} sw={2}/>{t.label}</button>))}
          </div>

          {tab==="info"&&(<>
            <div className="pdm-section-title">Personal Details</div>
            <div className="pdm-grid">
              {isEditing?(
                <>
                  <div style={{gridColumn:"span 1.5"}}><div className="pdm-lbl">Patient Name</div><input type="text" value={editData.patientName} onChange={e=>handleEditChange("patientName",e.target.value)} style={{width:"100%",padding:"8px",borderRadius:6,border:"1px solid #ddd",fontSize:13}} /></div>
                  <div style={{gridColumn:"span 1.5"}}><div className="pdm-lbl">Guardian</div><input type="text" value={editData.guardianName} onChange={e=>handleEditChange("guardianName",e.target.value)} style={{width:"100%",padding:"8px",borderRadius:6,border:"1px solid #ddd",fontSize:13}} /></div>
                  <div><div className="pdm-lbl">Gender</div><select value={editData.gender} onChange={e=>handleEditChange("gender",e.target.value)} style={{width:"100%",padding:"8px",borderRadius:6,border:"1px solid #ddd",fontSize:13}}><option value="">Select</option><option value="M">Male</option><option value="F">Female</option><option value="O">Other</option></select></div>
                  <div><div className="pdm-lbl">Date of Birth</div><input type="date" value={editData.dob} onChange={e=>handleEditChange("dob",e.target.value)} style={{width:"100%",padding:"8px",borderRadius:6,border:"1px solid #ddd",fontSize:13}} /></div>
                  <div><div className="pdm-lbl">Blood Group</div><input type="text" value={editData.bloodGroup} onChange={e=>handleEditChange("bloodGroup",e.target.value)} style={{width:"100%",padding:"8px",borderRadius:6,border:"1px solid #ddd",fontSize:13}} placeholder="O+" /></div>
                  <div><div className="pdm-lbl">Marital Status</div><input type="text" value={editData.maritalStatus} onChange={e=>handleEditChange("maritalStatus",e.target.value)} style={{width:"100%",padding:"8px",borderRadius:6,border:"1px solid #ddd",fontSize:13}} /></div>
                  <div><div className="pdm-lbl">National ID</div><input type="text" value={editData.nationalId} onChange={e=>handleEditChange("nationalId",e.target.value)} style={{width:"100%",padding:"8px",borderRadius:6,border:"1px solid #ddd",fontSize:13}} /></div>
                </>
              ):(
                [
                  {l:"Patient Name",v:patient.patientName,hi:true},
                  {l:"UHID",v:patient.uhid,hi:true},
                  {l:"Guardian",v:patient.guardianName},
                  {l:"Gender",v:patient.gender},
                  {l:"Date of Birth",v:fmtDate(patient.dob)},
                  {l:"Age",v:patient.ageYY?`${patient.ageYY}y ${patient.ageMM||0}m ${patient.ageDD||0}d`:""},
                  {l:"Blood Group",v:patient.bloodGroup},
                  {l:"Marital Status",v:patient.maritalStatus},
                  {l:"National ID",v:patient.nationalId,hi:true}
                ].map(({l,v,hi})=>(<div key={l} className={`pdm-item${hi?" hi":""}`}><div className="pdm-lbl">{l}</div><div className="pdm-val">{v||"—"}</div></div>))
              )}
            </div>
            <div className="pdm-section-title">Contact</div>
            <div className="pdm-grid">
              {isEditing?(
                <>
                  <div><div className="pdm-lbl">Phone</div><input type="tel" value={editData.phone} onChange={e=>handleEditChange("phone",e.target.value)} style={{width:"100%",padding:"8px",borderRadius:6,border:"1px solid #ddd",fontSize:13}} /></div>
                  <div><div className="pdm-lbl">Alternate Phone</div><input type="tel" value={editData.altPhone} onChange={e=>handleEditChange("altPhone",e.target.value)} style={{width:"100%",padding:"8px",borderRadius:6,border:"1px solid #ddd",fontSize:13}} /></div>
                  <div><div className="pdm-lbl">Email</div><input type="email" value={editData.email} onChange={e=>handleEditChange("email",e.target.value)} style={{width:"100%",padding:"8px",borderRadius:6,border:"1px solid #ddd",fontSize:13}} /></div>
                  <div style={{gridColumn:"span 3"}}><div className="pdm-lbl">Address</div><textarea value={editData.address} onChange={e=>handleEditChange("address",e.target.value)} style={{width:"100%",padding:"8px",borderRadius:6,border:"1px solid #ddd",fontSize:13,minHeight:"60px",fontFamily:"inherit"}} /></div>
                </>
              ):(
                [
                  {l:"Phone",v:patient.phone},
                  {l:"Alternate",v:patient.altPhone||"—"},
                  {l:"Email",v:patient.email},
                  {l:"Address",v:patient.address}
                ].map(({l,v})=>(<div key={l} className="pdm-item" style={l==="Address"?{gridColumn:"span 3"}:{}}><div className="pdm-lbl">{l}</div><div className="pdm-val">{v||"—"}</div></div>))
              )}
            </div>
            {!isEditing&&(patient.allergies||patient.remarks)&&<><div className="pdm-section-title">Notes</div><div className="pdm-grid">{patient.remarks&&<div className="pdm-item" style={{gridColumn:"span 1.5"}}><div className="pdm-lbl">Remarks</div><div className="pdm-val">{patient.remarks}</div></div>}{patient.allergies&&<div className="pdm-item" style={{gridColumn:"span 1.5"}}><div className="pdm-lbl">Allergies</div><div className="pdm-val">{patient.allergies}</div></div>}</div></>}
            {isEditing&&<><div className="pdm-section-title">Additional Notes</div><div className="pdm-grid"><div style={{gridColumn:"span 1.5"}}><div className="pdm-lbl">Remarks</div><textarea value={editData.remarks} onChange={e=>handleEditChange("remarks",e.target.value)} style={{width:"100%",padding:"8px",borderRadius:6,border:"1px solid #ddd",fontSize:13,minHeight:"50px",fontFamily:"inherit"}} /></div><div style={{gridColumn:"span 1.5"}}><div className="pdm-lbl">Allergies</div><textarea value={editData.allergies} onChange={e=>handleEditChange("allergies",e.target.value)} style={{width:"100%",padding:"8px",borderRadius:6,border:"1px solid #ddd",fontSize:13,minHeight:"50px",fontFamily:"inherit"}} /></div></div></>}
            {isEditing&&<><div className="pdm-section-title">Payment / Insurance</div><div className="pdm-grid"><div><div className="pdm-lbl">Payment Mode</div><input type="text" value={editData.payMode} onChange={e=>handleEditChange("payMode",e.target.value)} style={{width:"100%",padding:"8px",borderRadius:6,border:"1px solid #ddd",fontSize:13}} /></div><div><div className="pdm-lbl">TPA / Panel</div><input type="text" value={editData.tpa} onChange={e=>handleEditChange("tpa",e.target.value)} style={{width:"100%",padding:"8px",borderRadius:6,border:"1px solid #ddd",fontSize:13}} /></div><div><div className="pdm-lbl">TPA Card</div><input type="text" value={editData.tpaCard} onChange={e=>handleEditChange("tpaCard",e.target.value)} style={{width:"100%",padding:"8px",borderRadius:6,border:"1px solid #ddd",fontSize:13}} /></div><div><div className="pdm-lbl">TPA Validity</div><input type="date" value={editData.tpaValidity} onChange={e=>handleEditChange("tpaValidity",e.target.value)} style={{width:"100%",padding:"8px",borderRadius:6,border:"1px solid #ddd",fontSize:13}} /></div><div><div className="pdm-lbl">Panel Card Type</div><input type="text" value={editData.tpaCardType} onChange={e=>handleEditChange("tpaCardType",e.target.value)} style={{width:"100%",padding:"8px",borderRadius:6,border:"1px solid #ddd",fontSize:13}} /></div><div><div className="pdm-lbl">Panel Card No.</div><input type="text" value={editData.tpaPanelCardNo} onChange={e=>handleEditChange("tpaPanelCardNo",e.target.value)} style={{width:"100%",padding:"8px",borderRadius:6,border:"1px solid #ddd",fontSize:13}} /></div><div><div className="pdm-lbl">Panel Validity</div><input type="date" value={editData.tpaPanelValidity} onChange={e=>handleEditChange("tpaPanelValidity",e.target.value)} style={{width:"100%",padding:"8px",borderRadius:6,border:"1px solid #ddd",fontSize:13}} /></div></div></>}
            {!isEditing&&(patient.tpa||patient.tpaCard||patient.tpaPanelCardNo||patient.payMode)&&<><div className="pdm-section-title">TPA / Insurance</div><div className="pdm-grid">{[{l:"Panel",v:patient.tpa},{l:"Card Type",v:patient.tpaCardType||patient.tpaCard},{l:"Card No.",v:patient.tpaPanelCardNo||patient.tpaCard},{l:"Validity",v:fmtDate(patient.tpaValidity||patient.tpaPanelValidity)},{l:"Payment Mode",v:patient.payMode}].map(({l,v})=>(<div key={l} className="pdm-item"><div className="pdm-lbl">{l}</div><div className="pdm-val">{v||"—"}</div></div>))}</div></>}
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
                {adm.billing?.paymentMode && String(patient?.payMode || "").toLowerCase() !== "cashless" && <div style={{fontSize:13,color:T.textMid}}><strong>Payment Mode:</strong> {adm.billing.paymentMode}</div>}
                {(adm.services||[]).length>0&&<><div style={{fontSize:11,fontWeight:700,color:T.textLight,textTransform:"uppercase",letterSpacing:".07em",margin:"14px 0 8px"}}>Services</div>{adm.services.map((s,si)=>(<div key={si} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"5px 0",borderBottom:`1px solid ${T.border}`,color:T.textMid}}><span>{s.title||s.type} {s.code?`(${s.code})`:""} × {s.qty}</span><span style={{fontWeight:600}}>₹{((parseFloat(s.rate)||0)*(parseInt(s.qty)||0)).toFixed(2)}</span></div>))}</>}
              </div>)}
            </div>);
          }))}
        </div>
      </div>
    </div>
  );
}
