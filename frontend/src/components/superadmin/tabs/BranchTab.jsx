import { useT, bColor, inr } from "../shared/tokens";
import { StatCard } from "../shared/MicroUI";
import { Users, CreditCard, Landmark, Wallet } from "lucide-react";
import PTable from "../tables/PTable";

export default function BranchTab({ pts, branch }) {
  const T = useT();
  const col = bColor(branch, T);
  const cash = pts.filter(p=>p.admType==="Cash");
  const cl   = pts.filter(p=>p.admType==="Cashless");
  return (
    <div>
      <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:18 }}>
        <StatCard icon={Users}    label="Total Patients"   value={pts.length}                     sub={pts.filter(p=>!p.dischargeDate).length+" active"} color={col}/>
        <StatCard icon={CreditCard} label="Cash"           value={cash.length}                    sub={inr(cash.reduce((s,p)=>s+p.grand,0))}            color={T.green}/>
        <StatCard icon={Landmark} label="Cashless / TPA"  value={cl.length}                      sub={inr(cl.reduce((s,p)=>s+p.grand,0))}              color={T.amber}/>
        <StatCard icon={Wallet}   label="Revenue"         value={inr(pts.reduce((s,p)=>s+p.grand,0))} sub={inr(pts.reduce((s,p)=>s+p.pending,0))+" pending"} color={col}/>
      </div>
      <PTable rows={pts} showBranch={false} filename={branch+"_patients.xlsx"}/>
    </div>
  );
}
