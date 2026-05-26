import { useState, useMemo } from "react";
import { useTheme } from "../../context/ThemeContext";
import { TC, T_DARK, T_LIGHT, T, BRANCH_REGISTRY, BRANCH_ACCENTS, bColor, bName, branchFilterOptions, cardStyle, SD, inr, fmt } from "../../components/superadmin/shared/tokens";
import { flattenDB, exportXLSX } from "../../components/superadmin/shared/helpers";
import ThemeModeDock from "../../components/ui/ThemeModeDock";
import SuperAdminDoctorsTab from "../../components/doctors/SuperAdminDoctorsTab";
import UpdateRecordsPanel from "../../components/admin/UpdateRecordsPanel";
import { Pill, StatCard, Badge, TH, XlsBtn, FilterSelect, STitle, StarRating } from "../../components/superadmin/shared/MicroUI";
import DashboardTab from "../../components/superadmin/tabs/DashboardTab";
import BranchTab from "../../components/superadmin/tabs/BranchTab";
import AllPatientsTab from "../../components/superadmin/tabs/AllPatientsTab";
import BillingTab from "../../components/superadmin/tabs/BillingTab";
import MedicalTab from "../../components/superadmin/tabs/MedicalTab";
import DischargeTab from "../../components/superadmin/tabs/DischargeTab";
import LabReportsTab from "../../components/superadmin/tabs/LabReportsTab";
import ReportsTab from "../../components/superadmin/tabs/ReportsTab";
import HospitalBranchesTab from "../../components/superadmin/tabs/HospitalBranchesTab";
import AdminsTab from "../../components/superadmin/tabs/AdminsTab";
import DepartmentsTab from "../../components/superadmin/tabs/DepartmentsTab";
import TaskPerformanceTab from "../../components/superadmin/tabs/TaskPerformanceTab";
import { LayoutDashboard, Hospital, Hotel, Users, CreditCard, Stethoscope, DoorOpen, FileDown, UserCog, Building2, Star, Upload, FlaskConical } from "lucide-react";

export { DischargeSummaryPrintModal } from "../../components/superadmin/print/DischargeSummaryPrintModal";

export default function SuperAdminDashboard({ db={}, branches=[], onBranchesChanged, onLogout }) {
  const { isDark } = useTheme();
  const activeT = isDark ? T_DARK : T_LIGHT;
  Object.assign(T, activeT);
  BRANCH_REGISTRY.length = 0;
  branches.forEach((b,i) => BRANCH_REGISTRY.push({ ...b, color: b.color || BRANCH_ACCENTS[i % BRANCH_ACCENTS.length] }));

  const [tab, setTab] = useState("dashboard");
  const all        = useMemo(() => flattenDB(db, "all"), [db]);
  const branchRows = useMemo(() => Object.fromEntries((branches||[]).map(b=>[b.slug, flattenDB(db,b.slug)])), [branches,db]);
  const branchTabs = (branches||[]).map((b,i)=>({ id:b.slug, icon:i%2===0?Hospital:Hotel, label:b.name }));

  const NAV = [
    { section:"Analytics" }, { id:"dashboard", icon:LayoutDashboard, label:"Dashboard" },
    { section:"Branches" }, { id:"hospitalbranches", icon:Building2, label:"Hospital Branches" },
    ...branchTabs,
    { id:"allpatients", icon:Users, label:"All Patients" },
    { section:"Finance" }, { id:"billing", icon:CreditCard, label:"Billing and Invoices" },
    { section:"Medical" }, { id:"medical", icon:Stethoscope, label:"Medical History" },
    { id:"discharge", icon:DoorOpen, label:"Discharge Summary" },
    { id:"labreports", icon:FlaskConical, label:"Lab Reports" },
    { section:"Management" }, { id:"reports", icon:FileDown, label:"Reports and Export" },
    { id:"records", icon:Upload, label:"Update Records" },
    { id:"admins", icon:UserCog, label:"Admin Management" },
    { id:"departments", icon:Building2, label:"Departments" },
    { id:"performance", icon:Star, label:"Task Performance" },
    { id:"doctors", icon:Stethoscope, label:"Doctors Registry" },
  ];

  const activeNav = NAV.find(n=>n.id===tab);
  const ActiveIcon = activeNav?.icon;

  return (
    <TC.Provider value={activeT}>
      <div style={{ height:"100vh", background:activeT.bg, fontFamily:"'Segoe UI',system-ui,sans-serif", overflow:"hidden", display:"flex" }}>
        <div style={{ width:228, height:"100vh", background:activeT.sidebar, display:"flex", flexDirection:"column", position:"fixed", top:0, left:0, zIndex:50, borderRight:`1px solid ${activeT.border}`, overflow:"hidden" }}>
          <div style={{ padding:"18px 14px 14px", borderBottom:`1px solid ${activeT.border}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <img src="/app_icon.png" alt="logo" style={{ width:36, height:36, borderRadius:10, objectFit:"cover" }}/>
              <div>
                <div style={{ color:activeT.white, fontWeight:800, fontSize:13 }}>Sangi Hospital</div>
                <div style={{ color:activeT.dim, fontSize:10, textTransform:"uppercase", letterSpacing:".1em" }}>Super Admin Portal</div>
              </div>
            </div>
          </div>
          <div style={{ flex:1, overflowY:"auto", padding:"6px 6px" }}>
            {NAV.map((n,i)=>{
              if(n.section) return <div key={i} style={{ fontSize:10, color:activeT.dimmer, fontWeight:700, textTransform:"uppercase", letterSpacing:".1em", padding:"12px 10px 4px" }}>{n.section}</div>;
              const active=tab===n.id; const Icon=n.icon;
              return <button key={n.id} onClick={()=>setTab(n.id)} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", borderRadius:9, border:"none", cursor:"pointer", width:"100%", textAlign:"left", marginBottom:1, background:active?"rgba(56,189,248,.12)":"transparent", color:active?activeT.laxmi:activeT.dim, fontWeight:active?700:400, fontSize:13, borderLeft:active?`3px solid ${activeT.laxmi}`:"3px solid transparent" }}>
                <span style={{ fontSize:15 }}>{Icon?<Icon size={15} strokeWidth={1.9}/>:null}</span>
                <span style={{ flex:1 }}>{n.label}</span>
              </button>;
            })}
          </div>
          <div style={{ padding:"10px", borderTop:`1px solid ${activeT.border}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 11px", background:"rgba(255,255,255,.04)", borderRadius:9 }}>
              <div style={{ width:30, height:30, borderRadius:8, background:activeT.laxmi+"30", display:"flex", alignItems:"center", justifyContent:"center", color:activeT.laxmi, fontWeight:900, fontSize:13 }}>S</div>
              <div style={{ flex:1 }}><div style={{ fontSize:12, color:activeT.white, fontWeight:700 }}>Super Admin</div><div style={{ fontSize:10, color:activeT.dim }}>All hospitals</div></div>
            </div>
          </div>
        </div>
        <div style={{ marginLeft:228, flex:1, height:"100vh", overflow:"hidden", display:"flex", flexDirection:"column", minWidth:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 28px", borderBottom:`1px solid ${activeT.border}`, background:activeT.sidebar, position:"sticky", top:0, zIndex:40, flexShrink:0 }}>
            <div style={{ fontSize:13, fontWeight:700, color:activeT.white, display:"inline-flex", alignItems:"center", gap:8 }}>
              {ActiveIcon?<ActiveIcon size={14} strokeWidth={2}/>:null}{activeNav?.label}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <ThemeModeDock variant="inline"/>
              <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.05)", borderRadius:20, padding:"3px 6px 3px 12px", border:`1px solid ${activeT.border}` }}>
                <span style={{ fontSize:11, color:activeT.dim, fontWeight:500 }}>Super Admin</span>
                <div style={{ width:28, height:28, borderRadius:"50%", background:activeT.laxmi+"30", display:"flex", alignItems:"center", justifyContent:"center", color:activeT.laxmi, fontWeight:900, fontSize:12 }}>S</div>
              </div>
              <button onClick={onLogout} style={{ background:"transparent", border:`1px solid ${activeT.border}`, color:activeT.dim, padding:"5px 13px", borderRadius:8, cursor:"pointer", fontSize:11, fontWeight:600, display:"flex", alignItems:"center", gap:5 }}>↪ Logout</button>
            </div>
          </div>
          <div style={{ flex:1, overflowY:"auto", overflowX:"hidden" }}>
            <div style={{ padding:"18px 28px 4px" }}>
              <div style={{ fontSize:12, color:activeT.dim }}>
                {new Date().toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}
                {" · "}{all.length} total records
                {Object.entries(branchRows).map(([slug,rows])=>` · ${rows.length} ${bName(slug)}`).join("")}
              </div>
            </div>
            <div style={{ padding:"16px 28px 28px" }}>
              {tab==="dashboard"        && <DashboardTab all={all} branchRows={branchRows}/>}
              {tab==="hospitalbranches" && <HospitalBranchesTab branches={branches} onChanged={onBranchesChanged}/>}
              {branchTabs.some(b=>b.id===tab) && <BranchTab pts={branchRows[tab]||[]} branch={tab}/>}
              {tab==="allpatients"      && <AllPatientsTab all={all}/>}
              {tab==="billing"          && <BillingTab all={all}/>}
              {tab==="medical"          && <MedicalTab all={all}/>}
              {tab==="discharge"        && <DischargeTab all={all}/>}
              {tab==="labreports"       && <LabReportsTab all={all}/>}
              {tab==="reports"          && <ReportsTab all={all}/>}
              {tab==="records"          && <UpdateRecordsPanel roleLabel="Super Admin"/>}
              {tab==="admins"           && <AdminsTab branches={branches}/>}
              {tab==="departments"      && <DepartmentsTab all={all}/>}
              {tab==="performance"      && <TaskPerformanceTab/>}
              {tab==="doctors"          && <SuperAdminDoctorsTab branches={branches} T={activeT} bColor={bColor} bName={bName} Pill={Pill} StatCard={StatCard} TH={TH} cardStyle={cardStyle} SD={SD}/>}
            </div>
          </div>
        </div>
      </div>
    </TC.Provider>
  );
}
