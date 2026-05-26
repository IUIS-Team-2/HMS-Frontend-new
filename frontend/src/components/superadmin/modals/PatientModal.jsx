import { useState } from "react";
import { useT, bColor, bName, cardStyle, inr, fmt } from "../shared/tokens";
import { Pill, Badge, STitle, TH, XlsBtn } from "../shared/MicroUI";
import { exportXLSX } from "../shared/helpers";
import { apiService } from "../../../services/apiService";
import { toast } from "react-toastify";
import { Printer, FileText } from "lucide-react";
import BillPrintModal from "../print/BillPrintModal";
import { DischargeSummaryPrintModal } from "../print/DischargeSummaryPrintModal";

const PT_COLS = [
  { label:"UHID", key:"uhid" }, { label:"Patient", key:"name" }, { label:"Branch", get:r=>bName(r._branch) },
  { label:"Gender", key:"gender" }, { label:"Age", key:"age" }, { label:"Phone", key:"phone" },
  { label:"Blood Group", key:"bloodGroup" }, { label:"Address", key:"address" },
  { label:"Doctor", key:"doctor" }, { label:"Ward", key:"ward" }, { label:"Bed", key:"bed" },
  { label:"Department", key:"department" }, { label:"Diagnosis", key:"diagnosis" },
  { label:"Adm Date", get:r=>fmt(r.admDate) }, { label:"Discharge Date", get:r=>fmt(r.dischargeDate) },
  { label:"Status", key:"dischargeStatus" }, { label:"Payment Mode", key:"paymentMode" },
  { label:"Grand Total", key:"grand" }, { label:"Paid", key:"paid" }, { label:"Pending", key:"pending" },
  { label:"TPA", key:"tpa" }, { label:"TPA Card", key:"tpaCard" },
];

export default function PatientModal({ p, onClose }) {
  const T = useT();
  const [editSvcs, setEditSvcs] = useState(null);
  const [showBillPrint, setShowBillPrint] = useState(false);
  const [showDischargePrint, setShowDischargePrint] = useState(false);
  if (!p) return null;
  const svcs = editSvcs || p.services || [];
  const upd = (i,field,val) => setEditSvcs((editSvcs||p.services||[]).map((s,idx)=>idx===i?{...s,[field]:val}:s));
  const subtotal = svcs.reduce((s,sv)=>s+(parseFloat(sv.rate)||0)*(parseFloat(sv.qty)||1),0);
  const discount = parseFloat(p.billingObj?.discount)||0;
  const grand = subtotal - discount;
  const col = bColor(p._branch, T);

  return (
    <>
      <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.8)", zIndex:3000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
        <div style={{ background:T.surface, borderRadius:20, width:"100%", maxWidth:860, maxHeight:"92vh", overflow:"hidden", display:"flex", flexDirection:"column", boxShadow:"0 32px 100px rgba(0,0,0,.7)", border:`1px solid ${T.border}` }}>
          <div style={{ padding:"18px 24px", borderBottom:`1px solid ${T.border}`, background:T.card, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:col+"20", border:`1.5px solid ${col}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🧑</div>
              <div>
                <div style={{ fontSize:16, fontWeight:900, color:T.white }}>{p.name}</div>
                <div style={{ fontSize:12, color:T.dim, display:"flex", gap:8, alignItems:"center", marginTop:2 }}>
                  <span>{p.uhid}</span><span>Adm #{p.admNo}</span>
                  <Pill color={col}>{bName(p._branch)}</Pill>
                  <Pill color={p.admType==="Cash"?T.green:T.amber}>{p.admType}</Pill>
                </div>
              </div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              {p.dischargeStatus && p.dischargeStatus!=="Admitted" && (
                <button onClick={()=>setShowDischargePrint(true)} style={{ padding:"6px 14px", borderRadius:8, background:T.amber+"20", color:T.amber, border:`1px solid ${T.amber}44`, fontSize:12, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}><FileText size={13}/> Discharge Doc</button>
              )}
              <button onClick={()=>setShowBillPrint(true)} style={{ padding:"6px 14px", borderRadius:8, background:T.laxmi+"20", color:T.laxmi, border:`1px solid ${T.laxmi}44`, fontSize:12, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}><Printer size={13}/> Print Bill</button>
              <XlsBtn onClick={()=>exportXLSX([p],PT_COLS,`${p.uhid}_adm${p.admNo}.xlsx`)} label="Download"/>
              <button onClick={onClose} style={{ background:"rgba(255,255,255,.08)", border:"none", color:T.white, width:34, height:34, borderRadius:8, cursor:"pointer", fontSize:16 }}>✕</button>
            </div>
          </div>
          <div style={{ overflowY:"auto", padding:24 }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:20 }}>
              {[["Gender",p.gender],["Age",p.age],["Blood Group",p.bloodGroup],["Phone",p.phone],
                ["Ward",p.ward],["Bed / Room",p.bed+" / "+p.room],["Department",p.department],["Doctor",p.doctor],
                ["Admitted",fmt(p.admDate)],["Discharged",p.dischargeDate?fmt(p.dischargeDate):"Still Admitted"],
                ["Diagnosis",p.diagnosis],["Status",p.dischargeStatus],
                ["Payment Mode",p.paymentMode],["Type",p.admType],["TPA",p.tpa],["Allergies",p.allergies],
              ].map(([k,v])=>(<div key={k} style={{ background:T.card, borderRadius:8, padding:"8px 12px" }}><div style={{ fontSize:10, color:T.dim, fontWeight:700, textTransform:"uppercase", letterSpacing:".05em", marginBottom:2 }}>{k}</div><div style={{ fontSize:12, color:T.white, fontWeight:600, wordBreak:"break-word" }}>{v||"--"}</div></div>))}
            </div>
            {p.medHistory && Object.values(p.medHistory).some(v=>v) && (
              <div style={{ ...cardStyle(T), marginBottom:18 }}>
                <STitle>Medical History</STitle>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  {Object.entries(p.medHistory).filter(([,v])=>v).map(([k,v])=>(<div key={k} style={{ background:T.bg, borderRadius:8, padding:"9px 12px" }}><div style={{ fontSize:10, color:T.dim, fontWeight:700, textTransform:"uppercase", marginBottom:2 }}>{k.replace(/([A-Z])/g," $1").trim()}</div><div style={{ fontSize:13, color:T.white }}>{v}</div></div>))}
                </div>
              </div>
            )}
            <div style={{ ...cardStyle(T), marginBottom:18 }}>
              <STitle action={
                <div style={{ display:"flex", gap:8 }}>
                  {editSvcs && <button onClick={()=>setEditSvcs(null)} style={{ padding:"5px 12px", borderRadius:7, background:"transparent", border:`1px solid ${T.border2}`, color:T.dim, fontSize:12, cursor:"pointer" }}>Reset</button>}
                  <button onClick={()=>setShowBillPrint(true)} style={{ padding:"5px 12px", borderRadius:7, background:T.laxmi+"20", color:T.laxmi, border:`1px solid ${T.laxmi}44`, fontSize:12, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}><Printer size={12}/> Print Bill</button>
                  <button onClick={async()=>{ if(!editSvcs)return; try{ await apiService.saveServicesBulk(p.uhid,p.admNo,editSvcs); toast.success("Services saved!"); }catch{ toast.error("Failed to save services."); } }} style={{ padding:"5px 12px", borderRadius:7, background:T.green, color:"#000", border:"none", fontSize:12, fontWeight:800, cursor:"pointer" }}>Save Changes</button>
                </div>
              }>Services and Bill (Editable Rates and Qty)</STitle>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead><tr>{["Service","Type","Rate","Qty","Amount"].map(h=><TH key={h} h={h}/>)}</tr></thead>
                <tbody>
                  {svcs.map((sv,i)=>(
                    <tr key={i} style={{ borderBottom:`1px solid ${T.border}` }}>
                      <td style={{ padding:"8px 12px", color:T.white, fontWeight:600 }}>{sv.title||sv.type}</td>
                      <td style={{ padding:"8px 12px" }}><Badge color={T.dim}>{sv.type}</Badge></td>
                      <td style={{ padding:"8px 12px" }}><input type="number" value={sv.rate} onChange={e=>upd(i,"rate",e.target.value)} style={{ width:90, background:T.bg, border:`1px solid ${T.border2}`, borderRadius:6, color:T.white, padding:"4px 8px", fontSize:13, outline:"none", textAlign:"right" }}/></td>
                      <td style={{ padding:"8px 12px" }}><input type="number" value={sv.qty} onChange={e=>upd(i,"qty",e.target.value)} style={{ width:60, background:T.bg, border:`1px solid ${T.border2}`, borderRadius:6, color:T.white, padding:"4px 8px", fontSize:13, outline:"none", textAlign:"right" }}/></td>
                      <td style={{ padding:"8px 12px", fontWeight:800, color:T.amber }}>{inr((parseFloat(sv.rate)||0)*(parseFloat(sv.qty)||1))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, marginTop:14, paddingTop:14, borderTop:`1px solid ${T.border}` }}>
                {[["Subtotal",inr(subtotal),T.white],["Discount","-"+inr(discount),T.red],["Advance",inr(parseFloat(p.billingObj?.advance)||0),T.green],["Paid Now",inr(p.paid),T.green]].map(([k,v,c])=>(<div key={k} style={{ fontSize:12, color:T.dim }}>{k}: <strong style={{ color:c }}>{v}</strong></div>))}
                <div style={{ fontSize:16, fontWeight:900, color:T.amber, marginTop:4 }}>Grand Total: {inr(grand)}</div>
                {p.pending>0 && <div style={{ fontSize:13, fontWeight:800, color:T.red }}>Pending: {inr(p.pending)}</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
      {showBillPrint && <BillPrintModal p={{...p,subtotal,discount,grand}} onClose={()=>setShowBillPrint(false)}/>}
      {showDischargePrint && <DischargeSummaryPrintModal p={p} branchKey={p._branch} onClose={()=>setShowDischargePrint(false)}/>}
    </>
  );
}
