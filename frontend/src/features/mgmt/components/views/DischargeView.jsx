import React from "react";
import { SUMMARY_TYPES, SUMMARY_LABELS, SUMMARY_META, DISCHARGE_TYPES_CFG } from "../../constants/mgmtConstants";

export default function DischargeView({ bc, accent, locationPatients, dischSumFilter, setDischSumFilter, normalizeSummaryType, getPreferredDischarge, getPreferredAdmission, openViewModal, openSummaryEditor, handlePrintSummary, confirmDelete, fmtDt, SummaryPill, Badge, ActionBtn, CardRow, TableWrap, Th, Td }) {
  const summaryStats = SUMMARY_TYPES.reduce((acc,t)=>{acc[t]=locationPatients.filter(p=>normalizeSummaryType(getPreferredDischarge(p)?.dischargeStatus || getPreferredDischarge(p)?.summary_type || getPreferredDischarge(p)?.type)===t).length;return acc;},{});
  const unset = locationPatients.filter(p=>!getPreferredDischarge(p)?.diagnosis).length;
  const filtered = dischSumFilter==="All"?locationPatients:locationPatients.filter(p=>normalizeSummaryType(getPreferredDischarge(p)?.dischargeStatus || getPreferredDischarge(p)?.summary_type || getPreferredDischarge(p)?.type)===dischSumFilter);
  return (
    <div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:16}}>
        {[{label:"Total",val:locationPatients.length,col:accent},...SUMMARY_TYPES.map(t=>({label:SUMMARY_LABELS[t]||t,val:summaryStats[t]||0,col:SUMMARY_META[t].color})),{label:"Pending",val:unset,col:"#64748b"}].map((s,i)=>(
          <div key={i} className="hms-stat-card" style={{padding:"10px 14px",minWidth:90,border:`1px solid ${s.col}15`}}><div className="hms-stat-num" style={{fontSize:18,color:s.col}}>{s.val}</div><div className="hms-stat-label">{s.label}</div></div>
        ))}
      </div>
      <div style={{marginBottom:14}}>
        <select className="hms-branch-select" style={{width:"auto",padding:"7px 28px 7px 12px"}} value={dischSumFilter} onChange={e=>setDischSumFilter(e.target.value)}>
          <option value="All">All Types</option>{SUMMARY_TYPES.map(t=><option key={t} value={t}>{SUMMARY_LABELS[t]||t}</option>)}
        </select>
      </div>
      <div className="hms-card">
        <CardRow title={`${filtered.length} Record${filtered.length!==1?"s":""} — ${bc.label}`}/>
        {filtered.length===0?<div className="hms-empty">No summaries match.</div>:(
          <TableWrap heads={["Patient","UHID","Type","Diagnosis","Doctor","Discharge Date","Actions"]}>
            {filtered.map((p,i)=>{
              return (
                <tr key={i}>
                  <Td><span className="hms-td-hi">{p.patientName||p.name}</span><div className="hms-td-mono">{p.gender}·{p.ageYY||p.age}y</div></Td>
                  <Td mono>{p.uhid}</Td><Td><SummaryPill type={p.summaryType || getPreferredDischarge(p)?.dischargeStatus || getPreferredDischarge(p)?.summary_type || getPreferredDischarge(p)?.type || "-"} p={p} /></Td>
                  <Td>{p.diagnosis?<span>{p.diagnosis}</span>:<span style={{color:"#64748b",fontStyle:"italic",fontSize:10}}>Not set</span>}</Td>
                  <Td sm>{p.doctorName||p.doctorName||"—"}</Td><Td sm>{fmtDt(p.date||p.dod)}</Td>
                  <Td>
                    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                      <ActionBtn col="#34d399" onClick={()=>openViewModal(p)}>View</ActionBtn>
                      <ActionBtn col={accent} onClick={()=>openSummaryEditor(p)}>✎ Edit</ActionBtn>
                      <ActionBtn col="#f59e0b" onClick={()=>handlePrintSummary({...p, summaryType: normalizeSummaryType(getPreferredDischarge(p)?.dischargeStatus || getPreferredDischarge(p)?.summary_type || getPreferredDischarge(p)?.type || "NORMAL")})}>↓ Print</ActionBtn>
                      <ActionBtn col="#f87171" onClick={()=>confirmDelete(p)}>✕</ActionBtn>
                    </div>
                  </Td>
                </tr>
              );
            })}
          </TableWrap>
        )}
      </div>
    </div>
  );
}
