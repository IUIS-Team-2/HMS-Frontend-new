import { T, LOCATIONS } from "../data/constants";
import { Ico, IC } from "../components/ui/Icons";

export default function PrintModal({uhid,patient,discharge,svcs,billing,locId,admNo,onClose}){
  const total=svcs.reduce((a,s)=>a+(parseFloat(s.rate)||0)*(parseInt(s.qty)||0),0);
  const disc=parseFloat(billing.discount)||0;
  const adv=parseFloat(billing.advance)||0;
  const paid=parseFloat(billing.paidNow)||0;
  const net=Math.max(0,total-disc-adv-paid);
  const today=new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"2-digit",year:"numeric"});
  const nowTime=new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false});
  const loc=LOCATIONS.find(l=>l.id===locId)||{name:"Sangi",color:"#0EA5E9"};
  const branchInfo={
    "laxmi-nagar":{address:"Lakshmi Nagar, Mathura, Uttar Pradesh - 281004",phone1:"+91-9717444531",phone2:"+91-9717444532",email:"laxminagar@sangihospital.com"},
    "raya":{address:"Raya, Mathura, Uttar Pradesh - 281204",phone1:"+91-9311212090",phone2:"+91-9311212091",landline:"05663-299009",email:"info@sangihospital.com"}
  };
  const branch=branchInfo[locId]||branchInfo["laxmi-nagar"];
  const mockIpdNo=`SH/${patient.tpa?patient.tpa.substring(0,4).toUpperCase():"GEN"}/26/${1900+admNo}`;
  const mockBillNo=`${1900+admNo}/26`;
  const mockClaimId="42092669";

  const printStyles = `
    @media print {
      @page { size: A4; margin: 10mm; }
      body * { visibility: hidden; }
      #print-area, #print-area * { visibility: visible; }
      #print-area { position: fixed; left: 0; top: 0; width: 100%; }
      .no-print { display: none !important; }
    }
  `;

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:1000,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"20px",overflowY:"auto"}}>
      <style>{printStyles}</style>
      <div style={{background:"#fff",maxWidth:900,width:"100%",borderRadius:4,boxShadow:"0 20px 60px rgba(0,0,0,.4)"}}>
        
        {/* Action Bar */}
        <div className="no-print" style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 20px",borderBottom:"2px solid #0B2545",background:"#0B2545",borderRadius:"4px 4px 0 0"}}>
          <span style={{color:"#fff",fontWeight:700,fontSize:15,fontFamily:"Arial"}}>📄 Invoice Preview — Admission #{admNo}</span>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>window.print()} style={{padding:"8px 20px",background:"#38BDF8",color:"#0B2545",border:"none",borderRadius:6,fontWeight:700,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>🖨 Print</button>
            <button onClick={onClose} style={{padding:"8px 16px",background:"rgba(255,255,255,.15)",color:"#fff",border:"1px solid rgba(255,255,255,.3)",borderRadius:6,fontWeight:600,fontSize:13,cursor:"pointer"}}>✕ Close</button>
          </div>
        </div>

        {/* Bill Content */}
        <div id="print-area" style={{padding:"28px 36px",fontFamily:"Arial, sans-serif",color:"#000",fontSize:12}}>
          
          {/* TOP HEADER */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:0,paddingBottom:12,borderBottom:"3px solid #0B2545"}}>
            <div>
              <div style={{fontSize:11,color:"#555",marginBottom:4}}>Date: <strong style={{color:"#1a5b8c",textDecoration:"underline"}}>{today}</strong></div>
              <div style={{fontSize:18,fontWeight:900,color:"#0B2545",letterSpacing:1}}>FINAL BILL</div>
              <div style={{fontSize:11,color:"#666",marginTop:4}}>Admission Type: <strong>{patient.admissionType||"IPD"}</strong></div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:10,marginBottom:4}}>
                <img src="/logo512.png" alt="Sangi Hospital" style={{width:64,height:64,objectFit:"contain",borderRadius:12}}/>
                <div>
                  <div style={{fontSize:32,fontWeight:900,color:"#1a5b8c",letterSpacing:2,lineHeight:1,fontFamily:"Arial Black"}}>SANGi</div>
                  <div style={{fontSize:14,fontWeight:700,color:"#d93838",letterSpacing:4,lineHeight:1}}>HOSPITAL</div>
                </div>
              </div>
              <div style={{fontSize:11,color:"#666",textAlign:"right"}}>
                <span style={{display:"inline-block",width:7,height:7,borderRadius:"50%",background:loc.color,marginRight:4,verticalAlign:"middle"}}/>
{loc.name} Branch · {branch.address} · 📞 {branch.phone1} / {branch.phone2} · ✉ {branch.email} · 🌐 www.sangihospital.com
              </div>
            </div>
          </div>

          {/* PATIENT INFO GRID */}
          <table style={{width:"100%",borderCollapse:"collapse",marginTop:0,border:"1px solid #000"}}>
            <tbody>
              {[
                [["UHID",uhid||"—"],["Bill No.",mockBillNo]],[["IPD No.",mockIpdNo],["Bill Date",`${today} ${nowTime} HRS`]],
                [["Patient Name",patient.patientName?.toUpperCase()||"—"],["Bill Date",`${today} ${nowTime} HRS`]],
                [["Guardian Name",patient.guardianName?.toUpperCase()||"—"],["Age/Sex",`${patient.ageYY||"—"} YRS / ${patient.gender?.toUpperCase()||"—"}`]],
                [["Address",(patient.address||"—").toUpperCase()],["Card No.",patient.tpaCard||patient.tpaPanelCardNo||"—"]],
                [["Consultant",(discharge.doctorName||"—").toUpperCase()],["Room",`${discharge.wardName||"—"} / ${discharge.roomNo||"—"}`]],
                [["Claim ID",mockClaimId],["Panel",(patient.tpa||"CASH").toUpperCase()]],
                [["DOA & Time",discharge.doa?new Date(discharge.doa).toLocaleString("en-IN"):"—"],["Contact No.",patient.phone||"—"]],
                [["DOD & Time",discharge.dod?new Date(discharge.dod).toLocaleString("en-IN"):"—"],["Status on Discharge",(discharge.dischargeStatus||"—").toUpperCase()]],
              ].map((row,ri)=>(
                <tr key={ri}>
                  {row.map(([lbl,val],ci)=>(
                    <td key={ci} style={{border:"1px solid #000",padding:"6px 10px",width:"50%",verticalAlign:"top"}}>
                      <span style={{fontWeight:700,marginRight:4}}>{lbl} :</span>
                      <span style={{color:"#222"}}>{val}</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {/* SERVICES TABLE */}
          <table style={{width:"100%",borderCollapse:"collapse",marginTop:16,border:"1px solid #000"}}>
            <thead>
              <tr style={{background:"#0B2545"}}>
                {["Sr No.","Date","CGHS Code","Description","Quantity","Rate","Amount"].map(h=>(
                  <th key={h} style={{border:"1px solid #555",padding:"8px 10px",textAlign:"left",fontSize:11,fontWeight:700,color:"#fff",textTransform:"uppercase",letterSpacing:.5}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {svcs.filter(s=>s.title||s.type).length===0?(
                <tr><td colSpan={7} style={{border:"1px solid #000",padding:"16px",textAlign:"center",color:"#999",fontStyle:"italic"}}>No services added</td></tr>
              ):svcs.filter(s=>s.title||s.type).map((s,i)=>(
                <tr key={i} style={{background:i%2===0?"#fff":"#f9f9f9"}}>
                  <td style={{border:"1px solid #000",padding:"7px 10px"}}>{i+1}</td>
                  <td style={{border:"1px solid #000",padding:"7px 10px"}}>{today}</td>
                  <td style={{border:"1px solid #000",padding:"7px 10px"}}>{s.code||"—"}</td>
                  <td style={{border:"1px solid #000",padding:"7px 10px",fontWeight:500}}>{(s.title||s.type||"—").toUpperCase()}</td>
                  <td style={{border:"1px solid #000",padding:"7px 10px",textAlign:"center"}}>{s.qty||1}</td>
                  <td style={{border:"1px solid #000",padding:"7px 10px",textAlign:"right"}}>{parseFloat(s.rate||0).toFixed(2)}</td>
                  <td style={{border:"1px solid #000",padding:"7px 10px",textAlign:"right",fontWeight:600}}>{((parseFloat(s.rate)||0)*(parseInt(s.qty)||0)).toFixed(2)}</td>
                </tr>
              ))}

              {/* Empty rows for aesthetics */}
              {Array.from({length:Math.max(0,5-svcs.filter(s=>s.title||s.type).length)}).map((_,i)=>(
                <tr key={"empty"+i}>
                  {Array.from({length:7}).map((_,j)=>(
                    <td key={j} style={{border:"1px solid #000",padding:"7px 10px"}}>&nbsp;</td>
                  ))}
                </tr>
              ))}

              {/* Totals */}
              <tr style={{background:"#f5f5f5"}}>
                <td colSpan={6} style={{border:"1px solid #000",padding:"8px 10px",textAlign:"right",fontWeight:700,fontSize:13}}>Gross Total :</td>
                <td style={{border:"1px solid #000",padding:"8px 10px",textAlign:"right",fontWeight:700,fontSize:13}}>₹ {total.toFixed(2)}</td>
              </tr>
              <tr>
                <td colSpan={6} style={{border:"1px solid #000",padding:"7px 10px",textAlign:"right",fontWeight:600}}>Discount :</td>
                <td style={{border:"1px solid #000",padding:"7px 10px",textAlign:"right",fontWeight:600}}>- ₹ {disc.toFixed(2)}</td>
              </tr>
              <tr>
                <td colSpan={6} style={{border:"1px solid #000",padding:"7px 10px",textAlign:"right",fontWeight:600}}>Advance Payment :</td>
                <td style={{border:"1px solid #000",padding:"7px 10px",textAlign:"right",fontWeight:600}}>- ₹ {adv.toFixed(2)}</td>
              </tr>
              <tr style={{background:"#0B2545"}}>
                <td colSpan={6} style={{border:"1px solid #333",padding:"10px",textAlign:"right",fontWeight:800,fontSize:14,color:"#fff",letterSpacing:.5}}>NET PAYABLE AMOUNT :</td>
                <td style={{border:"1px solid #333",padding:"10px",textAlign:"right",fontWeight:900,fontSize:16,color:"#38BDF8"}}>₹ {net.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          {/* Payment Mode */}
          {billing.paymentMode&&(
            <div style={{marginTop:10,padding:"8px 14px",background:"#EFF6FF",border:"1px solid #BFDBEE",borderRadius:6,fontSize:12,color:"#0B2545",display:"inline-block"}}>
              💳 Payment Mode: <strong>{billing.paymentMode}</strong>
            </div>
          )}

          {/* Signatures */}
          <div style={{marginTop:50,display:"flex",justifyContent:"space-between",fontSize:12}}>
            <div style={{textAlign:"center",minWidth:180}}>
              <div style={{borderTop:"1px solid #000",paddingTop:8,fontWeight:700}}>Authorised Signatory</div>
              <div style={{fontSize:10,color:"#666",marginTop:2}}>Medical Superintendent</div>
              <div style={{fontSize:10,color:"#666"}}>Sangi Hospital</div>
            </div>
            <div style={{textAlign:"center"}}>
              <img src={"https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=https://sangihospital.com/"} alt="QR" style={{width:80,height:80,marginBottom:4}}/>
              <div style={{fontSize:10,color:"#888",fontStyle:"italic"}}>Scan to visit our website</div>
              <div style={{fontSize:10,color:"#1a5b8c",fontWeight:600}}>www.sangihospital.com</div>
              <div style={{fontSize:10,color:"#888",marginTop:2}}>This is a computer generated bill</div>
            </div>
            <div style={{textAlign:"center",minWidth:180}}>
              <div style={{borderTop:"1px solid #000",paddingTop:8,fontWeight:700}}>Patient / Attendant Signature</div>
              <div style={{fontSize:10,color:"#666",marginTop:2}}>with date</div>
            </div>
          </div>

          {/* Payment Guidelines */}
          <div style={{marginTop:18,padding:"12px 16px",background:"#F0F7FF",border:"1px solid #BFDBEE",borderRadius:6,fontSize:11,color:"#0B2545"}}>
            <div style={{fontWeight:700,marginBottom:8,fontSize:12,borderBottom:"1px solid #BFDBEE",paddingBottom:5}}>📋 Payment Guidelines & Important Instructions</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"5px 24px",color:"#333",lineHeight:1.7}}>
              <div>• All dues must be cleared prior to discharge.</div>
              <div>• Accepted modes: Cash, UPI, Debit/Credit Card, NEFT/RTGS.</div>
              <div>• ESIC / TPA patients must submit valid documents at admission.</div>
              <div>• Billing disputes must be raised within 24 hrs of bill generation.</div>
              <div>• Advance payments are adjusted in the final bill at discharge.</div>
              <div>• Medicines & consumables once issued are non-returnable.</div>
              <div>• Please collect original receipts for all payments made.</div>
              <div>• Queries: {branch.email} | {branch.phone1}</div>
            </div>
          </div>
          {/* Footer */}
          <div style={{marginTop:14,paddingTop:10,borderTop:"2px solid #0B2545",display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:10,color:"#888"}}>
            <span>© 2026 Sangi Hospital Management System · Developed by IUI Solution</span>
            <span style={{color:"#1a5b8c",fontWeight:600}}>{branch.phone1} / {branch.phone2}</span>
          </div>

        </div>
      </div>
    </div>
  );
}
