import { useState } from "react";
import { useT, bColor, bName, inr, fmt, cardStyle, branchFilterOptions } from "../shared/tokens";
import { StatCard, Pill, Badge, TH, XlsBtn, FilterSelect } from "../shared/MicroUI";
import { exportXLSX } from "../shared/helpers";
import PatientModal from "../modals/PatientModal";
import BillPrintModal from "../print/BillPrintModal";
import { Wallet, ClipboardList, AlertTriangle, CreditCard } from "lucide-react";
import { Printer } from "lucide-react";

const BCOLS = [
  { label:"UHID", key:"uhid" }, { label:"Patient", key:"name" }, { label:"Branch", get:r=>bName(r._branch) },
  { label:"Type", key:"admType" }, { label:"Doctor", key:"doctor" }, { label:"Date", get:r=>fmt(r.admDate) },
  { label:"Subtotal", key:"subtotal" }, { label:"Discount", key:"discount" }, { label:"Advance", key:"advance" },
  { label:"Grand Total", key:"grand" }, { label:"Paid", key:"paid" }, { label:"Pending", key:"pending" },
  { label:"Payment Mode", key:"paymentMode" }, { label:"TPA", key:"tpa" },
];

export default function BillingTab({ all }) {
  const T = useT();
  const [branch, setBranch] = useState("all");
  const [typeF, setTypeF]   = useState("all");
  const [modal, setModal]   = useState(null);
  const [billPrint, setBillPrint] = useState(null);
  const rows = all.filter(p => {
    if (branch!=="all" && p._branch!==branch) return false;
    if (typeF==="cash" && p.admType!=="Cash") return false;
    if (typeF==="cashless" && p.admType!=="Cashless") return false;
    return true;
  });
  return (
    <div>
      <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:18 }}>
        <StatCard icon={Wallet}       label="Collected"   value={inr(rows.reduce((s,p)=>s+p.paid,0))}    color={T.green}/>
        <StatCard icon={ClipboardList} label="Grand Total" value={inr(rows.reduce((s,p)=>s+p.grand,0))}   color={T.amber}/>
        <StatCard icon={AlertTriangle} label="Pending Dues" value={inr(rows.reduce((s,p)=>s+p.pending,0))} color={T.red}/>
        <StatCard icon={CreditCard}    label="Records"     value={rows.length}                             color={T.laxmi}/>
      </div>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center", marginBottom:12 }}>
        <FilterSelect value={branch} onChange={setBranch} options={branchFilterOptions()}/>
        <FilterSelect value={typeF}  onChange={setTypeF}  options={[["all","All Types"],["cash","Cash"],["cashless","Cashless / TPA"]]}/>
        <XlsBtn onClick={()=>exportXLSX(rows,BCOLS,"billing_all.xlsx")}/>
      </div>
      <div style={{ ...cardStyle(T), padding:0, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr>{["UHID","Patient","Branch","Type","Doctor","Date","Grand","Paid","Pending","Mode","Actions"].map(h=><TH key={h} h={h}/>)}</tr></thead>
          <tbody>
            {rows.length===0 && <tr><td colSpan={11} style={{ padding:48, textAlign:"center", color:T.dim }}>No records</td></tr>}
            {rows.map((p,i)=>(
              <tr key={i} style={{ borderBottom:`1px solid ${T.border}`, background:i%2===0?T.card:T.surface }}>
                <td style={{ padding:"9px 12px", fontSize:12, fontWeight:700, color:bColor(p._branch,T) }}>{p.uhid}</td>
                <td style={{ padding:"9px 12px" }}><div style={{ fontSize:13, fontWeight:600, color:T.white }}>{p.name}</div><div style={{ fontSize:10, color:T.dim }}>{p.age} {p.gender}</div></td>
                <td style={{ padding:"9px 12px" }}><Pill color={bColor(p._branch,T)}>{bName(p._branch)}</Pill></td>
                <td style={{ padding:"9px 12px" }}><Pill color={p.admType==="Cash"?T.green:T.amber}>{p.admType}</Pill></td>
                <td style={{ padding:"9px 12px", fontSize:12, color:T.dim }}>{p.doctor}</td>
                <td style={{ padding:"9px 12px", fontSize:11, color:T.dim }}>{fmt(p.admDate)}</td>
                <td style={{ padding:"9px 12px", fontSize:13, fontWeight:800, color:T.amber }}>{inr(p.grand)}</td>
                <td style={{ padding:"9px 12px", fontSize:12, fontWeight:700, color:T.green }}>{inr(p.paid)}</td>
                <td style={{ padding:"9px 12px", fontSize:12, color:p.pending>0?T.red:T.dim }}>{p.pending>0?inr(p.pending):"--"}</td>
                <td style={{ padding:"9px 12px", fontSize:11, color:T.dim }}>{p.paymentMode}</td>
                <td style={{ padding:"9px 12px" }}>
                  <div style={{ display:"flex", gap:5 }}>
                    <button onClick={()=>setModal(p)} style={{ padding:"4px 9px", borderRadius:6, background:T.laxmi+"20", color:T.laxmi, border:`1px solid ${T.laxmi}40`, fontSize:11, fontWeight:700, cursor:"pointer" }}>Edit</button>
                    <button onClick={()=>setBillPrint(p)} style={{ padding:"4px 9px", borderRadius:6, background:T.green+"20", color:T.green, border:`1px solid ${T.green}40`, fontSize:11, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}><Printer size={11}/> Print</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PatientModal p={modal} onClose={()=>setModal(null)}/>
      {billPrint && <BillPrintModal p={billPrint} onClose={()=>setBillPrint(null)}/>}
    </div>
  );
}
