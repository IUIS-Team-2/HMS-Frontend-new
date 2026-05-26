import React from "react";
import { T, mkBtn } from "../../branchAdminConstants";
import { BASE_URL } from "../../../../services/apiService";

export default function FinalBillTab({ selPatient, selectedAdmission, editableRows, setEditableRows, persistedSvcRows, persistedMedRows, setPersistedMedRows, billEdit, setBillEdit, canEditRecords, theme, savingRecords, onSave, setIsRecordDirty, isRecordDirtyRef }) {
  const p       = selPatient || {};
  const admObj  = selectedAdmission || {};
  const dis     = admObj.discharge || {};
  const billing = admObj.billing   || {};
  const uhid    = p.uhid || "";
  const admNo   = admObj.admNo || "";

  const services      = Array.isArray(admObj.services) ? admObj.services : [];
  const PURE_MED_CATS = ["med","pharma","drug","pharmacy","tablet","injection","iv fluid","consumable"];

  const svcRowsStatic = services
    .filter(s => !PURE_MED_CATS.some(k => (s.svcCat||s.type||"").toLowerCase().includes(k)))
    .map((s,i) => ({
      _localId: s.id || `svc-${i}`, isSvc: true,
      date_given: (s.svcDate || "").slice(0,10),
      cghs: s.cghs || s.cghs_code || "—",
      medicine_name: s.svcName || s.description || "Service",
      quantity: Number(s.svcQty || s.qty || 1),
      rate: Number(s.rate || s.svcRate || s.unit_price || s.price || 0),
      amount: Number(s.svcTot || s.total || (Number(s.svcRate||0) * Number(s.svcQty||1))),
    }));

  const finalSvcRows = persistedSvcRows.length ? persistedSvcRows : svcRowsStatic;
  const finalMedRows = persistedMedRows.length ? persistedMedRows : editableRows.filter(r => !r.isSvc);
  const allRows = [...finalSvcRows, ...finalMedRows].map((r,i) => ({
    srNo: i + 1, date: (r.date_given || r.date || "").slice(0,10), cghs: r.cghs || "—",
    description: r.medicine_name || "Service", quantity: Number(r.quantity || 1), rate: Number(r.rate || 0),
    amount: Number(r.quantity || 1) * Number(r.rate || 0), _localId: r._localId, isSvc: r.isSvc || false,
  }));

  const grossTotal = allRows.reduce((s,r) => s + r.amount, 0);
  const netPayable = Math.max(0, grossTotal - billEdit.discount - billEdit.advance);

  const patientName = p.name || "—";
  const ageSex = `${p.age || "—"} YRS / ${p.gender || "—"}`;
  const consultant = dis.doctorName || admObj.medicalHistory?.treatingDoctor || "—";
  const doa = dis.doa || admObj.dateTime ? new Date(dis.doa || admObj.dateTime).toLocaleString("en-IN") : "—";
  const dod = dis.dod ? new Date(dis.dod).toLocaleString("en-IN") : "—";
  const billDate = new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"2-digit",year:"numeric"});
  const ipd = admNo ? `SH/GEN/26/${admNo}` : "—";

  const cellStyle = { padding: "7px 10px", borderBottom: "1px solid #e2e8f0", fontSize: 12, color: "#1e293b" };
  const hdrCell  = { ...cellStyle, background: "#f8fafc", fontWeight: 700, fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" };
  const lbl = { fontSize: 11, color: "#64748b", fontWeight: 600 };
  const val = { fontSize: 12, color: "#0f172a", fontWeight: 500 };

  const updateRow = (row, field, val) => {
    setIsRecordDirty(true); isRecordDirtyRef.current = true;
    if (row.isSvc) {
      setEditableRows(prev => {
        const ex = prev.find(r => r._localId === row._localId);
        if (ex) return prev.map(r => r._localId === row._localId ? {...r,[field]:val,amount:field==="quantity"?val*Number(r.rate||0):field==="rate"?Number(r.quantity||1)*val:r.amount}:r);
        return [...prev, {...row,isSvc:true,[field]:val}];
      });
    } else {
      setEditableRows(prev => {
        const svcPart = prev.filter(r => r.isSvc), medPart = prev.filter(r => !r.isSvc);
        const mi = medPart.findIndex(r => r._localId === row._localId);
        if (mi === -1) return prev;
        medPart[mi] = {...medPart[mi],[field]:val,amount:field==="quantity"?val*Number(medPart[mi].rate||0):field==="rate"?Number(medPart[mi].quantity||1)*val:medPart[mi].amount};
        const next = [...svcPart,...medPart]; setPersistedMedRows(medPart); return next;
      });
    }
  };

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", fontFamily: "inherit", color: "#0f172a" }}>
      <div style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%)", padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Date: {billDate}</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1 }}>FINAL</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>BILL</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 6 }}>Admission Type: <span style={{ color: "#93c5fd" }}>{dis.admissionType || admObj.admissionType || "IPD"}</span></div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: 1 }}>SANGi <span style={{ fontWeight: 300 }}>HOSPITAL</span></div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", marginTop: 6, lineHeight: 1.6 }}>
            Lakshmi Nagar Branch · Mathura, UP - 281004<br/>📞 +91-9717444531 / +91-9717444532<br/>✉ laxminagar@sangihospital.com
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "2px solid #e2e8f0" }}>
        {[
          ["UHID", p.uhid || "—"], ["Bill No.", billing.billNo || "—"], ["IPD No.", ipd],
          ["Bill Date", `${billDate} ${new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})} HRS`],
          ["Patient Name", patientName], ["Guardian Name", p.patientObj?.guardianName || p.patientObj?.guardian_name || "—"],
          ["Age / Sex", ageSex], ["Address", p.patientObj?.address || "—"],
          ["Card No.", billing.cardNo || "—"], ["Consultant", consultant],
          ["Room / Bed", `${dis.roomNo || "—"} / ${dis.bedNo || "—"}`], ["Claim ID", billing.claimId || "—"],
          ["Panel", String(p.paymentMode || "CASH").toUpperCase()], ["DOA & Time", doa],
          ["Contact No.", p.phone || "—"], ["DOD & Time", dod],
          ["Status on Discharge", dis.dischargeStatus || dis.status || "—"],
        ].map(([label, value], i) => (
          <div key={i} style={{ padding: "8px 16px", borderBottom: "1px solid #f1f5f9", borderRight: i%2===0 ? "1px solid #e2e8f0" : "none" }}>
            <span style={lbl}>{label}: </span><span style={val}>{value}</span>
          </div>
        ))}
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr>{["SR NO.","DATE","CGHS CODE","DESCRIPTION","QUANTITY","RATE","AMOUNT", canEditRecords ? "" : ""].map(h => <th key={h} style={hdrCell}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {!allRows.length
              ? <tr><td colSpan={8} style={{ padding: "32px", textAlign: "center", color: "#94a3b8", fontStyle: "italic" }}>No services added yet.</td></tr>
              : allRows.map((row, i) => (
                <tr key={row._localId || i} style={{ background: i%2===0 ? "#fff" : "#f8fafc" }}>
                  <td style={cellStyle}>{row.srNo}</td>
                  <td style={cellStyle}>{canEditRecords ? <input type="date" value={row.date||""} onChange={e=>updateRow(row,"date_given",e.target.value)} style={{border:"none",background:"transparent",fontSize:11,width:110,color:"#0f172a"}}/> : row.date||"—"}</td>
                  <td style={cellStyle}>{row.cghs}</td>
                  <td style={{...cellStyle,fontWeight:600}}>{canEditRecords ? <input value={row.description||""} onChange={e=>updateRow(row,"medicine_name",e.target.value)} style={{border:"none",background:"transparent",fontSize:12,fontWeight:600,width:"100%",color:"#0f172a"}}/> : row.description}</td>
                  <td style={{...cellStyle,textAlign:"center"}}>{canEditRecords ? <input type="number" min={1} value={row.quantity} onChange={e=>updateRow(row,"quantity",Math.max(1,parseInt(e.target.value)||1))} style={{border:"none",background:"transparent",fontSize:12,width:50,textAlign:"center",color:"#0f172a"}}/> : row.quantity}</td>
                  <td style={{...cellStyle,textAlign:"right"}}>{canEditRecords ? <input type="number" min={0} step="0.01" value={row.rate} onChange={e=>updateRow(row,"rate",parseFloat(e.target.value)||0)} style={{border:"none",background:"transparent",fontSize:12,width:80,textAlign:"right",color:"#0f172a"}}/> : `₹${Number(row.rate).toFixed(2)}`}</td>
                  <td style={{...cellStyle,textAlign:"right",fontWeight:700,color:"#059669"}}>₹{(Number(row.quantity||1)*Number(row.rate||0)).toFixed(2)}</td>
                  {canEditRecords && <td style={cellStyle}><button onClick={()=>{setEditableRows(prev=>prev.filter(r=>r._localId!==row._localId));setIsRecordDirty(true);isRecordDirtyRef.current=true;}} style={{background:"#fee2e2",border:"none",color:"#ef4444",borderRadius:4,padding:"2px 8px",cursor:"pointer",fontSize:11}}>✕</button></td>}
                </tr>
              ))}
            {Array.from({length:Math.max(0,5-allRows.length)}).map((_,i)=>(
              <tr key={`empty-${i}`}>{Array(7).fill(null).map((_,j)=><td key={j} style={{...cellStyle,height:32}}>&nbsp;</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ borderTop: "2px solid #e2e8f0" }}>
        {[["Gross Total",`₹ ${grossTotal.toFixed(2)}`,false,false],["Discount",null,true,false],["Advance Payment",null,false,true]].map(([label,fixedVal,isDiscount,isAdvance])=>(
          <div key={label} style={{display:"flex",justifyContent:"flex-end",alignItems:"center",padding:"8px 20px",borderBottom:"1px solid #f1f5f9",gap:24}}>
            <span style={{fontSize:12,color:"#64748b",fontWeight:600,minWidth:160,textAlign:"right"}}>{label}:</span>
            {fixedVal
              ? <span style={{fontSize:13,fontWeight:700,color:"#0f172a",minWidth:100,textAlign:"right"}}>{fixedVal}</span>
              : canEditRecords
              ? <input type="number" min={0} value={isDiscount?billEdit.discount:billEdit.advance} onChange={e=>{setIsRecordDirty(true);isRecordDirtyRef.current=true;const v=parseFloat(e.target.value)||0;setBillEdit(p=>isDiscount?{...p,discount:v}:{...p,advance:v});}} style={{width:100,padding:"5px 8px",borderRadius:6,border:"1px solid #cbd5e1",fontSize:13,textAlign:"right",fontFamily:"inherit"}}/>
              : <span style={{fontSize:13,fontWeight:700,minWidth:100,textAlign:"right"}}>- ₹ {(isDiscount?billEdit.discount:billEdit.advance).toFixed(2)}</span>}
          </div>
        ))}
        <div style={{display:"flex",justifyContent:"flex-end",alignItems:"center",padding:"14px 20px",background:"#0f172a",gap:24}}>
          <span style={{fontSize:13,fontWeight:800,color:"#fff",minWidth:160,textAlign:"right",letterSpacing:"0.5px"}}>NET PAYABLE AMOUNT :</span>
          <span style={{fontSize:18,fontWeight:900,color:"#4ade80",minWidth:100,textAlign:"right"}}>₹ {netPayable.toFixed(2)}</span>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:20,padding:"24px 28px",borderTop:"2px solid #e2e8f0",alignItems:"flex-end"}}>
        <div style={{textAlign:"center"}}><div style={{borderTop:"1.5px solid #0f172a",paddingTop:8,fontSize:12,fontWeight:700}}>Authorised Signatory</div><div style={{fontSize:11,color:"#64748b"}}>Medical Superintendent</div><div style={{fontSize:11,color:"#64748b"}}>Sangi Hospital</div></div>
        <div style={{textAlign:"center"}}><div style={{fontSize:10,color:"#94a3b8",marginBottom:6,fontStyle:"italic"}}>Scan to visit our website</div><div style={{width:60,height:60,background:"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:4,margin:"0 auto 6px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#94a3b8"}}>QR</div><div style={{fontSize:11,color:"#3b82f6",fontWeight:600}}>www.sangihospital.com</div><div style={{fontSize:10,color:"#94a3b8",fontStyle:"italic"}}>This is a computer generated bill</div></div>
        <div style={{textAlign:"center"}}><div style={{borderTop:"1.5px solid #0f172a",paddingTop:8,fontSize:12,fontWeight:700}}>Patient / Attendant Signature</div><div style={{fontSize:11,color:"#64748b"}}>with date</div></div>
      </div>

      {canEditRecords && (
        <div style={{display:"flex",gap:10,padding:"12px 28px",borderTop:"1px solid #e2e8f0",background:"#f8fafc",flexWrap:"wrap"}}>
          <button style={{...mkBtn("dim",theme),padding:"8px 16px",fontSize:12}} onClick={()=>{setEditableRows(prev=>[...prev,{_localId:`svc-new-${Date.now()}`,isSvc:true,medicine_name:"",date_given:new Date().toISOString().slice(0,10),quantity:1,rate:0,batch_no:"",expiry_date:"",amount:0}]);setIsRecordDirty(true);isRecordDirtyRef.current=true;}}>+ Add Service Row</button>
          <button style={{...mkBtn("ghost",theme),padding:"8px 16px",fontSize:12}} onClick={()=>{setEditableRows(prev=>[...prev,{_localId:`med-new-${Date.now()}`,isSvc:false,medicine_name:"",date_given:new Date().toISOString().slice(0,10),quantity:1,rate:0,batch_no:"",expiry_date:"",amount:0}]);setIsRecordDirty(true);isRecordDirtyRef.current=true;}}>+ Add Medicine Row</button>
        </div>
      )}

      <div style={{display:"flex",gap:10,justifyContent:"flex-end",padding:"16px 28px",borderTop:"1px solid #e2e8f0",background:"#f8fafc",flexWrap:"wrap"}}>
        {canEditRecords && <button style={{...mkBtn("primary",theme),padding:"9px 18px",fontSize:12}} onClick={onSave} disabled={savingRecords}>{savingRecords?"Saving…":"💾 Save Bill"}</button>}
        <button style={{...mkBtn("excel",theme),padding:"9px 18px",fontSize:12}} onClick={()=>{if(!uhid||!admNo)return;window.open(`${BASE_URL}/patients/${uhid}/admissions/${admNo}/bill/print/`,"_blank");}}>🖨 Print Final Bill</button>
      </div>
    </div>
  );
}
