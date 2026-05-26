import { useT, bColor, bName, inr, cardStyle } from "../shared/tokens";
import { StatCard, Pill, Badge, TH, XlsBtn } from "../shared/MicroUI";
import { exportXLSX } from "../shared/helpers";
import { Users, Wallet, Hospital, Landmark, Stethoscope, DoorOpen, CreditCard, ClipboardList } from "lucide-react";
import { fmt } from "../shared/tokens";

const PT_COLS = [
  { label:"UHID", key:"uhid" }, { label:"Patient", key:"name" }, { label:"Gender", key:"gender" },
  { label:"Branch", get:r=>bName(r._branch) }, { label:"Type", key:"admType" }, { label:"Doctor", key:"doctor" },
  { label:"Adm Date", get:r=>fmt(r.admDate) }, { label:"Status", key:"dischargeStatus" }, { label:"Grand Total", key:"grand" },
];

export default function DashboardTab({ all, branchRows }) {
  const T = useT();
  const totalRev = all.reduce((s,p)=>s+p.grand,0);
  const pend = all.reduce((s,p)=>s+p.pending,0);
  const admitted = all.filter(p=>!p.dischargeDate).length;
  const disch = all.filter(p=>p.dischargeDate).length;
  const cash = all.filter(p=>p.admType==="Cash").length;
  const cashless = all.filter(p=>p.admType==="Cashless").length;
  const branchEntries = Object.entries(branchRows||{});
  return (
    <div>
      <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:14 }}>
        <StatCard icon={Users} label="Total Patients" value={all.length} sub={admitted+" admitted / "+disch+" discharged"} color={T.laxmi}/>
        <StatCard icon={Wallet} label="Total Revenue" value={inr(totalRev)} sub={pend>0?inr(pend)+" pending":"All collected"} color={T.green}/>
        <StatCard icon={Hospital} label="Hospital Branches" value={branchEntries.length} sub="Configured branches" color={T.amber}/>
        <StatCard icon={Landmark} label="Cashless / TPA" value={cashless} sub={Math.round(cashless/Math.max(all.length,1)*100)+"%"} color={T.amber}/>
      </div>
      <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:22 }}>
        <StatCard icon={Stethoscope} label="Currently Admitted" value={admitted} sub="Active patients" color={T.amber}/>
        <StatCard icon={DoorOpen} label="Discharged" value={disch} sub="Completed" color={T.green}/>
        <StatCard icon={CreditCard} label="Cash Patients" value={cash} sub={Math.round(cash/Math.max(all.length,1)*100)+"%"} color={T.green}/>
        <StatCard icon={ClipboardList} label="Admissions" value={all.length} sub="Across all branches" color={T.laxmi}/>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))", gap:14, marginBottom:22 }}>
        {branchEntries.map(([br,pts])=>(
          <div key={br} style={{ ...cardStyle(T), borderTop:`3px solid ${bColor(br,T)}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
              <Pill color={bColor(br,T)}>{bName(br)}</Pill>
              <span style={{ fontSize:12, color:T.dim }}>Branch Summary</span>
            </div>
            {[["Total Admissions",pts.length],["Admitted",pts.filter(p=>!p.dischargeDate).length],
              ["Discharged",pts.filter(p=>p.dischargeDate).length],["Cash",pts.filter(p=>p.admType==="Cash").length],
              ["Cashless / TPA",pts.filter(p=>p.admType==="Cashless").length],
              ["Revenue",inr(pts.reduce((s,p)=>s+p.grand,0))],["Collected",inr(pts.reduce((s,p)=>s+p.paid,0))],
              ["Pending",inr(pts.reduce((s,p)=>s+p.pending,0))],
              ["Avg Bill",inr(Math.round(pts.reduce((s,p)=>s+p.grand,0)/Math.max(pts.length,1)))],
            ].map(([k,v])=>(<div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:`1px solid ${T.border}` }}><span style={{ fontSize:12, color:T.dim }}>{k}</span><span style={{ fontSize:13, fontWeight:700, color:T.white }}>{v}</span></div>))}
          </div>
        ))}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <div style={{ fontSize:11, fontWeight:800, letterSpacing:".12em", textTransform:"uppercase", color:T.dim }}>Recent Admissions — All Hospitals</div>
        <XlsBtn onClick={()=>exportXLSX(all,PT_COLS,"overview_all.xlsx")}/>
      </div>
      <div style={{ ...cardStyle(T), padding:0, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr>{["UHID","Patient","Branch","Type","Doctor","Admitted","Grand Total","Status"].map(h=><TH key={h} h={h}/>)}</tr></thead>
          <tbody>
            {all.slice(0,12).map((p,i)=>(
              <tr key={i} style={{ borderBottom:`1px solid ${T.border}`, background:i%2===0?T.card:T.surface }}>
                <td style={{ padding:"9px 12px", fontSize:12, fontWeight:700, color:bColor(p._branch,T) }}>{p.uhid}</td>
                <td style={{ padding:"9px 12px", fontSize:13, fontWeight:600, color:T.white }}>{p.name}</td>
                <td style={{ padding:"9px 12px" }}><Pill color={bColor(p._branch,T)}>{bName(p._branch)}</Pill></td>
                <td style={{ padding:"9px 12px" }}><Pill color={p.admType==="Cash"?T.green:T.amber}>{p.admType}</Pill></td>
                <td style={{ padding:"9px 12px", fontSize:12, color:T.dim }}>{p.doctor}</td>
                <td style={{ padding:"9px 12px", fontSize:11, color:T.dim }}>{fmt(p.admDate)}</td>
                <td style={{ padding:"9px 12px", fontSize:13, fontWeight:800, color:T.amber }}>{inr(p.grand)}</td>
                <td style={{ padding:"9px 12px" }}><Badge color={p.dischargeDate?T.green:T.amber}>{p.dischargeDate?"Discharged":"Admitted"}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
