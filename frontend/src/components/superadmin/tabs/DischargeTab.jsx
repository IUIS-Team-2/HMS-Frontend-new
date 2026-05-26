import { useState } from "react";
import { useT, bColor, bName, inr, fmt, cardStyle, branchFilterOptions } from "../shared/tokens";
import { StatCard, Pill, Badge, TH, XlsBtn, FilterSelect } from "../shared/MicroUI";
import { exportXLSX } from "../shared/helpers";
import PatientModal from "../modals/PatientModal";
import { DischargeSummaryPrintModal } from "../print/DischargeSummaryPrintModal";
import { DoorOpen, Hospital, Wallet, Printer } from "lucide-react";

const DCOLS = [
  { label:"UHID", key:"uhid" }, { label:"Patient", key:"name" }, { label:"Branch", get:r=>bName(r._branch) },
  { label:"Doctor", key:"doctor" }, { label:"Department", key:"department" }, { label:"Diagnosis", key:"diagnosis" },
  { label:"Adm Date", get:r=>fmt(r.admDate) }, { label:"Discharge Date (DOD)", get:r=>fmt(r.dischargeDate) },
  { label:"Status", key:"dischargeStatus" }, { label:"Grand Total", key:"grand" }, { label:"Paid", key:"paid" },
  { label:"Pending", key:"pending" }, { label:"Type", key:"admType" },
];

export default function DischargeTab({ all }) {
  const T = useT();
  const disch = all.filter(p=>p.dischargeDate);
  const [branch, setBranch] = useState("all");
  const [modal, setModal] = useState(null);
  const [dischargePrint, setDischargePrint] = useState(null);
  const rows = branch==="all" ? disch : disch.filter(p=>p._branch===branch);
  return (
    <div>
      <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:18 }}>
        <StatCard icon={DoorOpen} label="Total Discharges" value={disch.length} color={T.dim}/>
        <StatCard icon={Hospital} label="Hospital Branches" value={0} color={T.amber}/>
        <StatCard icon={Wallet}   label="Revenue" value={inr(disch.reduce((s,p)=>s+p.grand,0))} color={T.amber}/>
      </div>
      <div style={{ display:"flex", gap:8, marginBottom:12, alignItems:"center" }}>
        <FilterSelect value={branch} onChange={setBranch} options={branchFilterOptions()}/>
        <XlsBtn onClick={()=>exportXLSX(rows,DCOLS,"discharge_summary.xlsx")}/>
      </div>
      <div style={{ ...cardStyle(T), padding:0, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr>{["UHID","Patient","Branch","Type","Doctor","Department","Admitted","DOD","Diagnosis","Status","Billed","Actions"].map(h=><TH key={h} h={h}/>)}</tr></thead>
          <tbody>
            {rows.length===0 && <tr><td colSpan={12} style={{ padding:48, textAlign:"center", color:T.dim }}>No discharges yet</td></tr>}
            {rows.map((p,i)=>(
              <tr key={i} style={{ borderBottom:`1px solid ${T.border}`, background:i%2===0?T.card:T.surface }}>
                <td style={{ padding:"9px 12px", fontSize:12, fontWeight:700, color:bColor(p._branch,T) }}>{p.uhid}</td>
                <td style={{ padding:"9px 12px", fontSize:13, fontWeight:600, color:T.white }}>{p.name}</td>
                <td style={{ padding:"9px 12px" }}><Pill color={bColor(p._branch,T)}>{bName(p._branch)}</Pill></td>
                <td style={{ padding:"9px 12px" }}><Pill color={p.admType==="Cash"?T.green:T.amber}>{p.admType}</Pill></td>
                <td style={{ padding:"9px 12px", fontSize:12, color:T.dim }}>{p.doctor}</td>
                <td style={{ padding:"9px 12px", fontSize:12, color:T.dim }}>{p.department}</td>
                <td style={{ padding:"9px 12px", fontSize:11, color:T.dim }}>{fmt(p.admDate)}</td>
                <td style={{ padding:"9px 12px", fontSize:11, color:T.green, fontWeight:700 }}>{fmt(p.dischargeDate)}</td>
                <td style={{ padding:"9px 12px", fontSize:11, color:T.dim, maxWidth:140, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.diagnosis}</td>
                <td style={{ padding:"9px 12px" }}><Badge color={p.dischargeStatus==="Recovered"?T.green:T.amber}>{p.dischargeStatus}</Badge></td>
                <td style={{ padding:"9px 12px", fontSize:13, fontWeight:800, color:T.amber }}>{inr(p.grand)}</td>
                <td style={{ padding:"9px 12px" }}>
                  <div style={{ display:"flex", gap:5 }}>
                    <button onClick={()=>setModal(p)} style={{ padding:"4px 10px", borderRadius:6, background:T.laxmi+"20", color:T.laxmi, border:`1px solid ${T.laxmi}40`, fontSize:11, fontWeight:700, cursor:"pointer" }}>View</button>
                    <button onClick={()=>setDischargePrint(p)} style={{ padding:"4px 10px", borderRadius:6, background:T.amber+"20", color:T.amber, border:`1px solid ${T.amber}40`, fontSize:11, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}><Printer size={11}/> Doc</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PatientModal p={modal} onClose={()=>setModal(null)}/>
      {dischargePrint && <DischargeSummaryPrintModal p={dischargePrint} branchKey={dischargePrint._branch} onClose={()=>setDischargePrint(null)}/>}
    </div>
  );
}
