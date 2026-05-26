import { useState } from "react";
import { useT, inr, BRANCH_REGISTRY, branchFilterOptions } from "../shared/tokens";
import { StatCard, FilterSelect } from "../shared/MicroUI";
import { Users, Hospital, Wallet } from "lucide-react";
import PTable from "../tables/PTable";

export default function AllPatientsTab({ all }) {
  const T = useT();
  const [branch, setBranch] = useState("all");
  const rows = branch==="all" ? all : all.filter(p=>p._branch===branch);
  return (
    <div>
      <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:18 }}>
        <StatCard icon={Users}   label="All Patients"      value={all.length}                              color={T.laxmi}/>
        <StatCard icon={Hospital} label="Hospital Branches" value={BRANCH_REGISTRY.length}                  color={T.amber}/>
        <StatCard icon={Wallet}  label="Combined Revenue"   value={inr(all.reduce((s,p)=>s+p.grand,0))}    color={T.green}/>
      </div>
      <div style={{ display:"flex", gap:8, marginBottom:12 }}>
        <FilterSelect value={branch} onChange={setBranch} options={branchFilterOptions()}/>
      </div>
      <PTable rows={rows} showBranch={branch==="all"} filename="all_patients.xlsx"/>
    </div>
  );
}
