import { useState } from "react";
import { useT, bColor, bName, inr, fmt, cardStyle } from "../shared/tokens";
import { Pill, Badge, TH, XlsBtn, FilterSelect } from "../shared/MicroUI";
import { exportXLSX } from "../shared/helpers";
import PatientModal from "../modals/PatientModal";

const PT_COLS = [
  { label:"UHID", key:"uhid" }, { label:"Patient", key:"name" }, { label:"Gender", key:"gender" },
  { label:"Age", key:"age" }, { label:"Phone", key:"phone" }, { label:"Branch", get:r=>bName(r._branch) },
  { label:"Type", key:"admType" }, { label:"Doctor", key:"doctor" }, { label:"Ward", key:"ward" },
  { label:"Department", key:"department" }, { label:"Adm Date", get:r=>fmt(r.admDate) },
  { label:"Discharge Date", get:r=>fmt(r.dischargeDate) }, { label:"Diagnosis", key:"diagnosis" },
  { label:"Status", key:"dischargeStatus" }, { label:"Grand Total", key:"grand" },
  { label:"Paid", key:"paid" }, { label:"Pending", key:"pending" }, { label:"Payment Mode", key:"paymentMode" },
  { label:"TPA", key:"tpa" },
];

export default function PTable({ rows, showBranch, filename }) {
  const T = useT();
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState("");
  const [typeF, setTypeF] = useState("all");
  const filtered = rows.filter(p => {
    if (typeF==="cash" && p.admType!=="Cash") return false;
    if (typeF==="cashless" && p.admType!=="Cashless") return false;
    if (search && ![p.name,p.uhid,p.doctor,p.diagnosis].some(v=>v?.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });
  return (
    <>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center", marginBottom:12 }}>
        <FilterSelect value={typeF} onChange={setTypeF} options={[["all","All Types"],["cash","Cash Patients"],["cashless","Cashless / TPA"]]}/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, UHID, doctor, diagnosis..." style={{ marginLeft:"auto", padding:"7px 13px", borderRadius:8, border:`1px solid ${T.border2}`, background:T.card, color:T.white, fontSize:13, outline:"none", width:270 }}/>
        <XlsBtn onClick={()=>exportXLSX(filtered,PT_COLS,filename||"patients.xlsx")}/>
      </div>
      <div style={{ ...cardStyle(T), padding:0, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr>{["#","UHID","Patient","Type",showBranch&&"Branch","Doctor","Ward","Adm","Discharge","Diagnosis","Grand","Paid","Pending","Status",""].filter(Boolean).map(h=><TH key={h} h={h}/>)}</tr></thead>
          <tbody>
            {filtered.length===0 && <tr><td colSpan={15} style={{ padding:48, textAlign:"center", color:T.dim }}>No records found</td></tr>}
            {filtered.map((p,i)=>(
              <tr key={i} onClick={()=>setModal(p)} style={{ borderBottom:`1px solid ${T.border}`, background:i%2===0?T.card:T.surface, cursor:"pointer" }}>
                <td style={{ padding:"9px 12px", color:T.dim, fontSize:11 }}>{i+1}</td>
                <td style={{ padding:"9px 12px", fontSize:12, fontWeight:700, color:bColor(p._branch,T) }}>{p.uhid}</td>
                <td style={{ padding:"9px 12px" }}><div style={{ fontSize:13, fontWeight:600, color:T.white }}>{p.name}</div><div style={{ fontSize:10, color:T.dim }}>{p.age} {p.gender}</div></td>
                <td style={{ padding:"9px 12px" }}><Pill color={p.admType==="Cash"?T.green:T.amber}>{p.admType}</Pill></td>
                {showBranch && <td style={{ padding:"9px 12px" }}><Pill color={bColor(p._branch,T)}>{bName(p._branch)}</Pill></td>}
                <td style={{ padding:"9px 12px", fontSize:12, color:T.dim }}>{p.doctor}</td>
                <td style={{ padding:"9px 12px", fontSize:11, color:T.dim }}>{p.ward} {p.bed}</td>
                <td style={{ padding:"9px 12px", fontSize:11, color:T.dim }}>{fmt(p.admDate)}</td>
                <td style={{ padding:"9px 12px", fontSize:11, color:p.dischargeDate?T.green:T.amber }}>{p.dischargeDate?fmt(p.dischargeDate):"Admitted"}</td>
                <td style={{ padding:"9px 12px", fontSize:11, color:T.dim, maxWidth:130, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.diagnosis}</td>
                <td style={{ padding:"9px 12px", fontSize:13, fontWeight:800, color:T.amber }}>{inr(p.grand)}</td>
                <td style={{ padding:"9px 12px", fontSize:12, fontWeight:700, color:T.green }}>{inr(p.paid)}</td>
                <td style={{ padding:"9px 12px", fontSize:12, color:p.pending>0?T.red:T.dim }}>{p.pending>0?inr(p.pending):"--"}</td>
                <td style={{ padding:"9px 12px" }}><Badge color={p.dischargeStatus==="Recovered"?T.green:p.dischargeStatus==="Admitted"?T.laxmi:T.amber}>{p.dischargeStatus}</Badge></td>
                <td style={{ padding:"9px 12px" }}><button onClick={e=>{e.stopPropagation();setModal(p);}} style={{ padding:"4px 10px", borderRadius:6, background:T.laxmi+"20", color:T.laxmi, border:`1px solid ${T.laxmi}40`, fontSize:11, fontWeight:700, cursor:"pointer" }}>View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PatientModal p={modal} onClose={()=>setModal(null)}/>
    </>
  );
}
