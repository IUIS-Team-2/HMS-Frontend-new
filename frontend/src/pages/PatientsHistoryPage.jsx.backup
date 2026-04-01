import { useState } from "react";
import { T, LOCATIONS } from "../data/constants";
import { fmtDT, fmtDate } from "../utils/helpers";
import { Ico, IC } from "../components/ui/Icons";
import { statusBadge } from "../components/ui/SharedUI";

export default function PatientsHistoryPage({db,locId,onBack,onDischarge,onGenerateBill,onSetExpectedDod,onViewPatient}){
  const loc=LOCATIONS.find(l=>l.id===locId);
  const [filterDate,setFilterDate]=useState(""); const [filterMonth,setFilterMonth]=useState(""); const [filterYear,setFilterYear]=useState("");
  const [expDodModal, setExpDodModal] = useState(null); // Modal state for Expected Discharge

  const allRows=db.flatMap(p=>p.admissions.map(adm=>({patientName:p.patientName,uhid:p.uhid,admNo:adm.admNo,doa:adm.discharge?.doa||adm.dateTime||"",dod:adm.discharge?.dod||"",status:adm.discharge?.dischargeStatus||"",billing:adm.billing||{},patientObj:p,admObj:adm}))).sort((a,b)=>new Date(b.doa)-new Date(a.doa));
  const years=[...new Set(allRows.map(r=>r.doa?new Date(r.doa).getFullYear():"").filter(Boolean))].sort((a,b)=>b-a);
  const months=["January","February","March","April","May","June","July","August","September","October","November","December"];

  const filtered=allRows.filter(r=>{
    if(!r.doa)return true;
    const d=new Date(r.doa);
    if(filterDate){const fd=new Date(filterDate);if(d.toDateString()!==fd.toDateString())return false;}
    if(filterMonth&&String(d.getMonth())!==filterMonth)return false;
    if(filterYear&&String(d.getFullYear())!==filterYear)return false;
    return true;
  });

  const totalAdm=filtered.length; const discharged=filtered.filter(r=>r.dod&&r.status).length; const pending=totalAdm-discharged; const billed=filtered.filter(r=>r.billing&&(r.billing.paidNow||r.billing.paymentMode)).length;
  const clearFilters=()=>{setFilterDate("");setFilterMonth("");setFilterYear("");};
  const hasFilter=filterDate||filterMonth||filterYear;

  return(
    <div className="hist-page">
      <div className="hist-page-hd"><div><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:5}}><button className="btn btn-ghost btn-sm" onClick={onBack} style={{padding:"6px 14px",fontSize:13}}><Ico d={IC.dn} size={13} sw={2.5} style={{transform:"rotate(90deg)"}}/> ← Back</button></div><h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:26,color:T.primary,marginBottom:4}}>Patients History</h1><p style={{fontSize:14,color:T.textMuted}}>{loc.name} Branch · All admissions record</p></div></div>
      
      <div className="hist-filter-bar">
        <span className="hist-filter-label"><Ico d={IC.calendar} size={13} sw={2}/> Filter by</span><div className="hist-filter-sep"/>
        <div style={{display:"flex",flexDirection:"column",gap:3}}><span style={{fontSize:10,fontWeight:700,color:T.textLight,textTransform:"uppercase",letterSpacing:".06em"}}>Date</span><input type="date" className="hist-filter-ctrl" value={filterDate} onChange={e=>setFilterDate(e.target.value)} style={{width:150}}/></div>
        <div style={{display:"flex",flexDirection:"column",gap:3}}><span style={{fontSize:10,fontWeight:700,color:T.textLight,textTransform:"uppercase",letterSpacing:".06em"}}>Month</span><select className="hist-filter-ctrl" value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} style={{width:140}}><option value="">All Months</option>{months.map((m,i)=><option key={i} value={String(i)}>{m}</option>)}</select></div>
        <div style={{display:"flex",flexDirection:"column",gap:3}}><span style={{fontSize:10,fontWeight:700,color:T.textLight,textTransform:"uppercase",letterSpacing:".06em"}}>Year</span><select className="hist-filter-ctrl" value={filterYear} onChange={e=>setFilterYear(e.target.value)} style={{width:110}}><option value="">All Years</option>{years.map(y=><option key={y} value={String(y)}>{y}</option>)}</select></div>
        {hasFilter&&<button className="hist-clear-btn" onClick={clearFilters}>✕ Clear</button>}
        <span style={{marginLeft:"auto",fontSize:13,color:T.textMuted,fontWeight:500}}>{filtered.length} record{filtered.length!==1?"s":""} found</span>
      </div>

      <div className="hist-summary-stats">{[{l:"Total Admissions",v:totalAdm,c:T.primary},{l:"Discharged",v:discharged,c:T.green},{l:"Pending Discharge",v:pending,c:T.amber},{l:"Bills Generated",v:billed,c:T.accentDeep}].map(s=>(<div key={s.l} className="hist-stat"><span className="hist-stat-num" style={{color:s.c}}>{s.v}</span><span className="hist-stat-lbl">{s.l}</span></div>))}</div>

      {filtered.length===0?(
        <div style={{textAlign:"center",padding:"60px 0",color:T.textMuted,fontSize:14,background:T.white,borderRadius:16,border:`1px solid ${T.border}`} }>
          <Ico d={IC.search} size={32} sw={1.5}/><br/><br/>
          No admissions found{hasFilter?" for the selected filter.":"."}
          {hasFilter&&<><br/><button className="btn btn-ghost btn-sm" style={{marginTop:12}} onClick={clearFilters}>Clear Filters</button></>}
        </div>
      ):(
        <div className="hist-table-wrap">
          <table className="hist-table">
            <thead>
              <tr><th>#</th><th>Patient</th><th>Date of Admission</th><th>Expected Discharge</th><th>Discharge Status</th><th>Bill</th></tr>
            </thead>
            <tbody>
              {filtered.map((r,i)=>{
                const isDischarge=r.dod&&r.status; 
                const hasBill=r.billing&&(r.billing.paidNow||r.billing.paymentMode);
                const expDod=r.admObj.discharge?.expectedDod;

                return(<tr key={i} onClick={()=>onViewPatient(r.patientObj)}>
                  <td style={{color:T.textMuted,fontSize:12,width:40}}>{i+1}</td>
                  <td>
                    <div className="hist-pt-name">{r.patientName}</div>
                    <div className="hist-pt-uhid">{r.uhid} · Adm #{r.admNo}</div>
                  </td>
                  <td style={{fontSize:13,color:T.textMid,whiteSpace:"nowrap"}}>{fmtDT(r.doa)}</td>
                  
                  {/* Expected Discharge Column */}
                  <td>
                    {expDod ? (
                      <div className="hist-dod-val" style={{color: T.textMid}}><Ico d={IC.calendar} size={11} sw={2.5}/> {fmtDate(expDod)}</div>
                    ) : (
                      <button className="btn btn-ghost btn-sm" style={{padding: "5px 10px", fontSize: 12}} onClick={(e) => { e.stopPropagation(); setExpDodModal({p: r.patientObj, a: r.admObj, date: ''}); }}>Set Date</button>
                    )}
                  </td>

                  {/* Discharge Status Column */}
                  <td>
                    {isDischarge ? (
                      <div>
                        {statusBadge(r.status)}
                        <div className="hist-dod-val" style={{marginTop: 4, fontSize: 11.5, color: T.textMid}}><Ico d={IC.check} size={10} sw={2.5}/> {fmtDT(r.dod)}</div>
                      </div>
                    ) : (
                      <button className="hist-discharge-btn" onClick={(e) => { e.stopPropagation(); onDischarge(r.patientObj, r.admObj); }}><Ico d={IC.bed} size={13} sw={2}/> Discharge</button>
                    )}
                  </td>
                  
                  {/* Bill Column */}
                  <td>
                    {hasBill ? (
                      <span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:12,fontWeight:600,padding:"3px 10px",borderRadius:20,background:T.greenTint,color:T.green,border:`1px solid ${T.greenBorder}`}}>
                        <Ico d={IC.check} size={10} sw={2.5}/> Generated
                      </span>
                    ) : (
                      <button className="btn btn-ghost btn-sm" style={{borderColor: T.accentDeep, color: T.accentDeep, padding: "5px 10px", fontSize: 12, display:"inline-flex", alignItems:"center", gap:6}} onClick={(e) => { e.stopPropagation(); onGenerateBill(r.patientObj, r.admObj); }}>
                        <Ico d={IC.receipt} size={12} sw={2}/> Generate Bill
                      </button>
                    )}
                  </td>
                </tr>);
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Expected Discharge Modal Popup */}
      {expDodModal && (
        <div className="pdm-overlay" onClick={(e)=>{if(e.target===e.currentTarget)setExpDodModal(null);}}>
          <div className="pdm-modal" style={{maxWidth: 400}}>
            <div className="pdm-hd" style={{padding: "14px 20px"}}>
              <div className="pdm-hd-name" style={{fontSize: 16}}>Set Expected Discharge</div>
              <button className="pdm-close" style={{width: 28, height: 28}} onClick={()=>setExpDodModal(null)}><Ico d={IC.x} size={14} sw={2}/></button>
            </div>
            <div className="pdm-body" style={{padding: "20px"}}>
              <p style={{marginBottom: 16, fontSize: 13.5, color: T.textMuted}}>
                Set the expected discharge date for <strong style={{color: T.primary}}>{expDodModal.p.patientName}</strong> (Adm #{expDodModal.a.admNo}).
              </p>
              <div className="fld" style={{marginBottom: 24}}>
                <label style={{fontSize: 11.5, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 7, display: "block"}}>Expected Date</label>
                <input type="date" className="ctrl" value={expDodModal.date} onChange={e=>setExpDodModal({...expDodModal, date: e.target.value})} />
              </div>
              <div className="btn-row">
                <button className="btn btn-ghost" onClick={()=>setExpDodModal(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={()=>{ onSetExpectedDod(expDodModal.p.uhid, expDodModal.a.admNo, expDodModal.date); setExpDodModal(null); }}>Save Date</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}