import { useState, useEffect } from "react";
import { useT, bColor, bName, branchFilterOptions, cardStyle, fmt } from "../shared/tokens";
import { Pill, Badge, StatCard, TH, FilterSelect, XlsBtn, StarRating } from "../shared/MicroUI";
import { exportXLSX } from "../shared/helpers";
import { apiService } from "../../../services/apiService";
import { Star, Hospital, Hotel, AlertTriangle, FileText, CreditCard, Upload, MessageCircle, Phone } from "lucide-react";

const DEPARTMENTS_PERF = ["Billing","Uploading","OPD","Query","Intimation"];
const DEPT_META = {
  Billing:   { icon:CreditCard,    color:"#FBBF24", desc:"Invoice generation, payment collection" },
  Uploading: { icon:Upload,        color:"#38BDF8", desc:"Document uploads, report filing" },
  OPD:       { icon:FileText,      color:"#34D399", desc:"Outpatient registration, scheduling" },
  Query:     { icon:MessageCircle, color:"#A78BFA", desc:"Patient queries, information desk" },
  Intimation:{ icon:Phone,         color:"#FB923C", desc:"Insurance intimation, TPA coordination" },
};
const ratingMeta = r => {
  if (r>=5) return { label:"Excellent", color:"#34D399" };
  if (r>=4) return { label:"Good",      color:"#4ADE80" };
  if (r>=3) return { label:"Average",   color:"#FBBF24" };
  if (r>=2) return { label:"Below Avg", color:"#FB923C" };
  return           { label:"Poor",      color:"#F87171" };
};
const DEMO = [
  { staffName:"Rahul Verma",   staffId:"EMP002", branch:"laxmi", role:"Billing Staff",   department:"Billing",    task:"Invoice Generation",      rating:4, reviewedBy:"Office Admin (Laxmi)", description:"Invoices raised accurately.",                       date:"2026-04-15" },
  { staffName:"Suresh Patel",  staffId:"EMP004", branch:"raya",  role:"Billing Staff",   department:"Billing",    task:"Cashless Billing",         rating:3, reviewedBy:"Office Admin (Raya)",  description:"Two invoice discrepancies found.",                  date:"2026-04-13" },
  { staffName:"Priya Nair",    staffId:"EMP003", branch:"raya",  role:"Billing Staff",   department:"Billing",    task:"Daily Collections",        rating:5, reviewedBy:"Office Admin (Raya)",  description:"Exceptional daily collection rate.",                date:"2026-04-14" },
  { staffName:"Meena Kapoor",  staffId:"EMP005", branch:"laxmi", role:"Lab Technician",  department:"Uploading",  task:"Report Upload Accuracy",   rating:5, reviewedBy:"Office Admin (Laxmi)", description:"All lab reports uploaded with zero errors.",        date:"2026-04-12" },
  { staffName:"Kavya Reddy",   staffId:"EMP007", branch:"laxmi", role:"Nurse",           department:"OPD",        task:"Patient Registration",     rating:5, reviewedBy:"Office Admin (Laxmi)", description:"Handled 62 OPD patients in a single shift.",        date:"2026-04-10" },
  { staffName:"Arjun Singh",   staffId:"EMP006", branch:"raya",  role:"Insurance Exec",  department:"Intimation", task:"TPA Pre-Auth Processing",  rating:2, reviewedBy:"Office Admin (Raya)",  description:"Two pre-auth requests with incorrect ICD codes.",   date:"2026-04-11" },
];
const PERF_COLS = [
  { label:"Staff Name",key:"staffName" },{ label:"Staff ID",key:"staffId" },
  { label:"Branch",get:r=>bName(r.branch) },{ label:"Role",key:"role" },
  { label:"Department",key:"department" },{ label:"Task",key:"task" },
  { label:"Rating",key:"rating" },{ label:"Label",get:r=>ratingMeta(r.rating).label },
  { label:"Description",key:"description" },{ label:"Reviewed By",key:"reviewedBy" },
  { label:"Date",get:r=>fmt(r.date) },
];

export default function TaskPerformanceTab() {
  const T = useT();
  const [performances, setPerformances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [branchF, setBranchF] = useState("all");
  const [deptF, setDeptF] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try { const data = await apiService.getPerformanceRatings(); setPerformances(data || []); }
      catch { setPerformances(DEMO); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const filtered = performances.filter(e => {
    if (branchF !== "all" && e.branch !== branchF) return false;
    if (deptF !== "all" && e.department !== deptF) return false;
    if (search && ![e.staffName, e.staffId, e.task, e.department].some(v => v?.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const overallAvg  = filtered.length ? (filtered.reduce((s,e)=>s+e.rating,0)/filtered.length).toFixed(1) : "—";
  const poorCount   = performances.filter(e=>e.rating<=2).length;
  const branchCount = new Set(performances.map(e=>e.branch).filter(Boolean)).size;

  return (
    <div>
      <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:18 }}>
        <StatCard icon={Star}          label="Overall Avg Rating"   value={overallAvg}  sub={performances.length+" total reviews"} color={T.amber} />
        <StatCard icon={Hospital}      label="Branches Reviewed"    value={branchCount} sub="Performance coverage"                color={T.laxmi} />
        <StatCard icon={Hotel}         label="Departments Reviewed" value={new Set(performances.map(e=>e.department)).size} sub="Across all branches" color={T.raya} />
        <StatCard icon={AlertTriangle} label="Poor Ratings (≤2)"   value={poorCount}   sub="Needs attention"                    color={poorCount>0?T.red:T.green} />
      </div>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center", marginBottom:14 }}>
        <FilterSelect value={branchF} onChange={setBranchF} options={branchFilterOptions()} />
        <FilterSelect value={deptF}   onChange={setDeptF}   options={[["all","All Departments"],...DEPARTMENTS_PERF.map(d=>[d,d])]} />
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search staff, task, dept..." style={{ marginLeft:"auto", padding:"7px 13px", borderRadius:8, border:`1px solid ${T.border2}`, background:T.card, color:T.white, fontSize:13, outline:"none", width:210 }} />
        <XlsBtn onClick={() => exportXLSX(filtered, PERF_COLS, "performance_ratings.xlsx")} />
      </div>
      {loading ? (
        <div style={{ ...cardStyle(T), textAlign:"center", padding:60, color:T.dim }}>Loading performance data...</div>
      ) : (
        <div style={{ ...cardStyle(T), padding:0, overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr>{["Staff","Branch","Dept","Task","Rating","Description","Reviewed By","Date"].map(h=><TH key={h} h={h}/>)}</tr></thead>
            <tbody>
              {filtered.length===0 && <tr><td colSpan={8} style={{ padding:48, textAlign:"center", color:T.dim }}>No performance records found</td></tr>}
              {filtered.map((e,i) => {
                const rm   = ratingMeta(e.rating);
                const meta = DEPT_META[e.department] || { icon:FileText, color:T.dim };
                return (
                  <tr key={i} style={{ borderBottom:`1px solid ${T.border}`, background:i%2===0?T.card:T.surface }}>
                    <td style={{ padding:"9px 12px" }}>
                      <div style={{ fontSize:13, fontWeight:700, color:T.white }}>{e.staffName}</div>
                      <div style={{ fontSize:10, color:T.dim }}>{e.staffId} · {e.role}</div>
                    </td>
                    <td style={{ padding:"9px 12px" }}><Pill color={bColor(e.branch,T)}>{bName(e.branch)}</Pill></td>
                    <td style={{ padding:"9px 12px" }}><span style={{ fontSize:12, color:meta.color, fontWeight:700 }}>{e.department}</span></td>
                    <td style={{ padding:"9px 12px", fontSize:12, color:T.white }}>{e.task}</td>
                    <td style={{ padding:"9px 12px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                        <span style={{ fontSize:16, fontWeight:900, color:rm.color }}>{e.rating}</span>
                        <StarRating rating={e.rating} size={11}/>
                      </div>
                      <Badge color={rm.color}>{rm.label}</Badge>
                    </td>
                    <td style={{ padding:"9px 12px", fontSize:11, color:T.dim, maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{e.description||"--"}</td>
                    <td style={{ padding:"9px 12px", fontSize:12, color:T.dim }}>{e.reviewedBy}</td>
                    <td style={{ padding:"9px 12px", fontSize:11, color:T.dim }}>{fmt(e.date)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}