import { useState } from "react";
import { useT, bColor, bName, fmt, cardStyle, branchFilterOptions, BRANCH_REGISTRY } from "../shared/tokens";
import { StatCard, Pill, Badge, TH, FilterSelect } from "../shared/MicroUI";
import { apiService } from "../../../services/apiService";
import { toast } from "react-toastify";
import MedicalHistoryPage from "../../../pages/MedicalHistoryPage";
import { ClipboardList, Hospital, Printer } from "lucide-react";

export default function MedicalTab({ all }) {
  const T = useT();
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [medData, setMedData] = useState({});
  const [branch, setBranch] = useState("all");
  const [search, setSearch] = useState("");
  const rows = all.filter(p => {
    if (branch!=="all" && p._branch!==branch) return false;
    if (search && ![p.name,p.uhid].some(v=>v?.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });
  const handleOpenPatient = (p) => { setSelectedPatient(p); setMedData(p.medHistory||{}); };
  const handleSaveMedData = async () => {
    if (!selectedPatient) return;
    try { await apiService.updateMedicalHistory(selectedPatient.uhid,selectedPatient.admNo,medData); toast.success("Medical history saved!"); setSelectedPatient(null); }
    catch { toast.error("Failed to save medical history."); }
  };
  if (selectedPatient) return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
        <button onClick={()=>setSelectedPatient(null)} style={{ padding:"7px 16px", borderRadius:8, background:T.bg, border:`1px solid ${T.border2}`, color:T.dim, fontSize:13, fontWeight:600, cursor:"pointer" }}>← Back to List</button>
        <div style={{ fontSize:14, fontWeight:700, color:T.white }}>{selectedPatient.name} — {selectedPatient.uhid}</div>
        <Pill color={bColor(selectedPatient._branch,T)}>{bName(selectedPatient._branch)}</Pill>
        <button onClick={()=>apiService.printMedicalHistory(selectedPatient.uhid,selectedPatient.admNo)} style={{ marginLeft:"auto", padding:"7px 16px", borderRadius:8, background:T.laxmi, color:"#000", border:"none", cursor:"pointer", fontSize:12, fontWeight:800, display:"flex", alignItems:"center", gap:6 }}><Printer size={13}/> Print Medical History</button>
      </div>
      <MedicalHistoryPage data={medData} setData={setMedData} onSave={handleSaveMedData} onSkip={()=>setSelectedPatient(null)} patient={selectedPatient._patient} discharge={selectedPatient._admission?.discharge} locId={selectedPatient._branch}/>
    </div>
  );
  const withMed = all.filter(p=>p.medHistory&&Object.values(p.medHistory).some(v=>v));
  return (
    <div>
      <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:18 }}>
        <StatCard icon={ClipboardList} label="With Medical History" value={withMed.length} sub={"of "+all.length+" total"} color={T.laxmi}/>
        <StatCard icon={Hospital} label="Hospital Branches" value={BRANCH_REGISTRY.length} color={T.amber}/>
      </div>
      <div style={{ display:"flex", gap:8, marginBottom:12, alignItems:"center" }}>
        <FilterSelect value={branch} onChange={setBranch} options={branchFilterOptions()}/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or UHID..." style={{ marginLeft:"auto", padding:"7px 13px", borderRadius:8, border:`1px solid ${T.border2}`, background:T.card, color:T.white, fontSize:13, outline:"none", width:240 }}/>
      </div>
      <div style={{ ...cardStyle(T), padding:0, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr>{["UHID","Patient","Branch","Doctor","Adm Date","Diagnosis","History Status",""].map(h=><TH key={h} h={h}/>)}</tr></thead>
          <tbody>
            {rows.length===0 && <tr><td colSpan={8} style={{ padding:48, textAlign:"center", color:T.dim }}>No records found</td></tr>}
            {rows.map((p,i)=>{ const hasMed=p.medHistory&&Object.values(p.medHistory).some(v=>v); return (
              <tr key={i} style={{ borderBottom:`1px solid ${T.border}`, background:i%2===0?T.card:T.surface }}>
                <td style={{ padding:"9px 12px", fontSize:12, fontWeight:700, color:bColor(p._branch,T) }}>{p.uhid}</td>
                <td style={{ padding:"9px 12px" }}><div style={{ fontSize:13, fontWeight:600, color:T.white }}>{p.name}</div><div style={{ fontSize:10, color:T.dim }}>{p.age} {p.gender}</div></td>
                <td style={{ padding:"9px 12px" }}><Pill color={bColor(p._branch,T)}>{bName(p._branch)}</Pill></td>
                <td style={{ padding:"9px 12px", fontSize:12, color:T.dim }}>{p.doctor}</td>
                <td style={{ padding:"9px 12px", fontSize:11, color:T.dim }}>{fmt(p.admDate)}</td>
                <td style={{ padding:"9px 12px", fontSize:11, color:T.dim, maxWidth:140, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.diagnosis}</td>
                <td style={{ padding:"9px 12px" }}><Badge color={hasMed?T.green:T.amber}>{hasMed?"Filled":"Not Filled"}</Badge></td>
                <td style={{ padding:"9px 12px" }}><button onClick={()=>handleOpenPatient(p)} style={{ padding:"4px 10px", borderRadius:6, background:T.laxmi+"20", color:T.laxmi, border:`1px solid ${T.laxmi}40`, fontSize:11, fontWeight:700, cursor:"pointer" }}>{hasMed?"Edit":"Add"} History</button></td>
              </tr>
            );})}
          </tbody>
        </table>
      </div>
    </div>
  );
}
