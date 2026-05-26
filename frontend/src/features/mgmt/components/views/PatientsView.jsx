import React from "react";

export default function PatientsView({ bc, accent, locationPatients, allAdmissions, currentlyAdmitted, discharged, fmtDt, openSummaryEditor, handlePrintSummary, openMedEditor, setActiveTab, toggleRepPatient, SummaryPill, Badge, ActionBtn, StatCard, TableWrap, Th, Td }) {
  return (
    <div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:16}}>
        {[{label:"Total",val:allAdmissions.length,col:accent},{label:"Admitted",val:currentlyAdmitted,col:"#34d399"},{label:"Discharged",val:discharged,col:"#8b949e"}].map((s,i)=>(
          <div key={i} className="hms-stat-card" style={{padding:"10px 14px",border:`1px solid ${s.col}18`}}><div className="hms-stat-num" style={{fontSize:16,color:s.col}}>{s.val}</div><div className="hms-stat-label">{s.label}</div></div>
        ))}
      </div>
      <div className="hms-card">
        {locationPatients.length===0?<div className="hms-empty">No patients for {bc.label}.</div>:(
          <TableWrap heads={["Patient/UHID","Contact","Ward/Bed","Doctor","Summary","DOA","DOD","Status","Actions"]}>
            {locationPatients.flatMap((p,pi)=>(p.admissions||[]).map((adm,ai)=>{
              const d=adm.discharge||{}; const status=d.dod?"Discharged":"Admitted";
              return (
                <tr key={`${pi}-${ai}`}>
                  <Td><span className="hms-td-hi">{p.patientName||p.name}</span><div className="hms-td-mono">{p.uhid}</div></Td>
                  <Td sm><div>{p.phone}</div><div style={{color:"#64748b",fontSize:9}}>{p.email}</div></Td>
                  <Td>{d.wardName||"—"}<div className="hms-td-mono">{d.bedNo}</div></Td>
                  <Td sm>{d.doctorName||"—"}</Td>
                  <Td><span style={{cursor:"pointer"}} onClick={()=>openSummaryEditor(p)}><SummaryPill type={p.dischargeSummary?.type} p={p}/></span></Td>
                  <Td sm>{fmtDt(d.doa)}</Td><Td sm>{fmtDt(d.dod)}</Td>
                  <Td><Badge col={status==="Admitted"?"#34d399":"#8b949e"}>{status}</Badge></Td>
                  <Td>
                    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                      <ActionBtn col="#34d399" onClick={()=>openMedEditor(p)}>Meds</ActionBtn>
                      <ActionBtn col="#38bdf8" onClick={()=>{setActiveTab("reports");setTimeout(()=>toggleRepPatient(p),100);}}>Reports</ActionBtn>
                      <ActionBtn col="#f59e0b" onClick={()=>handlePrintSummary(p)}>↓ PDF</ActionBtn>
                    </div>
                  </Td>
                </tr>
              );
            }))}
          </TableWrap>
        )}
      </div>
    </div>
  );
}
