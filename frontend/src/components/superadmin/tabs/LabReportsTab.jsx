import { useState } from "react";
import { useT, bColor, bName, fmt, cardStyle, branchFilterOptions, BRANCH_REGISTRY } from "../shared/tokens";
import { StatCard, Pill, TH, FilterSelect } from "../shared/MicroUI";
import { apiService } from "../../../services/apiService";
import { toast } from "react-toastify";
import { openPrintWindow } from "../print/openPrintWindow";
import { escapeHtml } from "../shared/helpers";
import { getBranchMeta } from "../shared/tokens";
import { FlaskConical, Hospital, Printer } from "lucide-react";

const LAB_TEST_COLORS = {
  HAEMATOLOGY:{ color:"#dc2626", bg:"#fef2f2" }, BIOCHEMISTRY:{ color:"#2563eb", bg:"#eff6ff" },
  MICROBIOLOGY:{ color:"#065f46", bg:"#ecfdf5" }, "IMMUNOLOGY – SEROLOGY":{ color:"#b45309", bg:"#fffbeb" },
  ENDOCRINOLOGY:{ color:"#7c3aed", bg:"#f5f3ff" },
};

export default function LabReportsTab({ all }) {
  const T = useT();
  const [branch, setBranch] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [reports, setReports] = useState([]);
  const [templateSuggestions, setTemplateSuggestions] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [expandedReport, setExpandedReport] = useState(null);

  const rows = all.filter(p => {
    if (branch!=="all" && p._branch!==branch) return false;
    if (search && ![p.name,p.uhid].some(v=>v?.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const fetchReports = async (p) => {
    setSelectedPatient(p); setReports([]); setTemplateSuggestions([]); setLoadingReports(true);
    try {
      const [reportsData,templatesData] = await Promise.all([
        apiService.getLabReports(p.uhid,p.admNo).catch(()=>[]),
        apiService.getLabReportTemplates(p.uhid,p.admNo).catch(()=>({suggested_reports:[]})),
      ]);
      const rawReports = Array.isArray(reportsData)?reportsData:[];
      const suggestions = Array.isArray(templatesData?.suggested_reports)?templatesData.suggested_reports:[];
      setTemplateSuggestions(suggestions);
      const normalizeKey=(v)=>String(v||"").toLowerCase().replace(/[^a-z0-9]/g,"");
      const templateMap=new Map();
      suggestions.forEach(t=>{[t?.reportName,t?.reportType,t?.reportCategory].forEach(kv=>{const k=normalizeKey(kv);if(k)templateMap.set(k,t);});});
      const mergedReports=rawReports.map(report=>{
        const template=templateMap.get(normalizeKey(report?.reportName))||templateMap.get(normalizeKey(report?.title))||templateMap.get(normalizeKey(report?.reportType))||templateMap.get(normalizeKey(report?.reportCategory));
        if(!template)return report;
        const hasDetails=(Array.isArray(report?.tests)&&report.tests.length>0)||(Array.isArray(report?.fields)&&report.fields.length>0)||Boolean(report?.narrative||report?.findings||report?.impression);
        if(hasDetails)return report;
        return{...report,tests:Array.isArray(template.tests)?template.tests:[],remarks:report?.remarks||template?.remarks||"",reportType:report?.reportType||template?.reportType||report?.type,reportCategory:report?.reportCategory||template?.reportCategory||report?.department};
      });
      setReports(mergedReports.length>0?mergedReports:suggestions.map(t=>({...t,title:t.reportName,type:t.reportType,department:t.reportCategory,isTemplateOnly:true})));
    } catch { toast.error("Failed to load lab reports."); setReports([]); setTemplateSuggestions([]); }
    setLoadingReports(false);
  };

  const handlePrintReport = (report) => {
    const branchMeta = getBranchMeta(selectedPatient?._branch);
    const bi = { name:`${branchMeta.name} Branch`, address:branchMeta.address||"Mathura, Uttar Pradesh", phone:branchMeta.phone||"—" };
    const dept = report.department||"PATHOLOGY";
    const deptStyle = LAB_TEST_COLORS[dept]||{color:"#333",bg:"#f9f9f9"};
    const ePtName=escapeHtml(selectedPatient?.name||"--"), ePtAge=escapeHtml(selectedPatient?.age||"--"), ePtGender=escapeHtml(selectedPatient?.gender?.toUpperCase()||"--"), ePtUhid=escapeHtml(selectedPatient?.uhid||"--");
    const eBiName=escapeHtml(bi.name), eBiAddr=escapeHtml(bi.address), eBiPhone=escapeHtml(bi.phone);
    const eRptDate=escapeHtml(report.date||fmt(new Date())), eRptSrNo=escapeHtml(report.srNo||"--"), eDept=escapeHtml(dept), eTitle=escapeHtml(report.title||report.type||""), eDeptColor=escapeHtml(deptStyle.color);
    const mappedTests=Array.isArray(report.tests)?report.tests.map(t=>({name:t.name||t.test_name||t.parameter||"Test",value:t.value||t.result||"--",unit:t.unit||"--",normal:t.refRange||t.normal||t.normal_value||"--",isAbnormal:String(t.status||"").toLowerCase()==="high"||String(t.status||"").toLowerCase()==="low"})):[];
    const detailFields=Array.isArray(report.fields)&&report.fields.length>0?report.fields:mappedTests;
    const fieldsHtml=Array.isArray(detailFields)&&detailFields.length>0?detailFields.map(f=>`<tr><td style="padding:6px 10px;border:1px solid #ccc;font-size:12px">${escapeHtml(f.name||f.label)}</td><td style="padding:6px 10px;border:1px solid #ccc;font-size:12px;font-weight:bold;color:${f.isAbnormal?"red":"#000"}">${escapeHtml(f.value||"--")}</td><td style="padding:6px 10px;border:1px solid #ccc;font-size:12px;color:#555">${escapeHtml(f.unit||"")}</td><td style="padding:6px 10px;border:1px solid #ccc;font-size:12px;color:#555">${escapeHtml(f.normal||"")}</td></tr>`).join(""):`<tr><td colspan="4" style="padding:10px;text-align:center;color:#999">No fields</td></tr>`;
    const html=`<div style="display:flex;justify-content:space-between;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:12px"><div><div style="font-size:28px;font-weight:900;color:#1a5b8c;letter-spacing:2px">SANGi</div><div style="font-size:13px;font-weight:700;color:#d93838;letter-spacing:4px">HOSPITAL</div></div><div style="text-align:right;font-size:11px;color:#555"><div>${eBiName}</div><div>${eBiAddr}</div><div>Ph: ${eBiPhone}</div></div></div><div style="text-align:center;font-size:14px;font-weight:900;letter-spacing:1px;margin-bottom:10px">Department of Pathology</div><table style="margin-bottom:10px;font-size:11px"><tr><td style="padding:4px 8px;border:1px solid #ccc"><strong>Patient's Name:</strong> ${ePtName}</td><td style="padding:4px 8px;border:1px solid #ccc"><strong>Referred by:</strong> SANGI HOSPITAL</td></tr><tr><td style="padding:4px 8px;border:1px solid #ccc"><strong>Age/Sex:</strong> ${ePtAge} / ${ePtGender}</td><td style="padding:4px 8px;border:1px solid #ccc"><strong>Date:</strong> ${eRptDate}</td></tr><tr><td style="padding:4px 8px;border:1px solid #ccc"><strong>Patient ID:</strong> ${ePtUhid}</td><td style="padding:4px 8px;border:1px solid #ccc"><strong>Sr. No.:</strong> ${eRptSrNo}</td></tr></table><div style="text-align:center;font-size:13px;font-weight:900;text-transform:uppercase;margin:10px 0;color:${eDeptColor}">${eDept}</div><div style="text-align:center;font-size:12px;font-weight:700;text-decoration:underline;margin-bottom:8px">${eTitle}</div><table><thead><tr><th>Test Name</th><th>Value</th><th>Unit</th><th>Normal Value</th></tr></thead><tbody>${fieldsHtml}</tbody></table><div style="text-align:center;margin:20px 0;font-size:12px">***End Of The Report***</div><div style="display:flex;justify-content:space-between;margin-top:40px"><div><div style="border-top:1px solid #000;padding-top:5px;font-weight:700">TECHNOLOGIST</div></div><div style="text-align:right"><div style="font-weight:700">Dr. Rakesh Koul</div><div style="font-size:11px;color:#555">(M.B.B.S. DCP)</div><div style="font-weight:700;border-top:1px solid #000;padding-top:5px;margin-top:30px">PATHOLOGIST</div></div></div>`;
    openPrintWindow(`Lab Report - ${escapeHtml(selectedPatient?.name)}`, html);
  };

  if (selectedPatient) return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
        <button onClick={()=>{setSelectedPatient(null);setReports([]);}} style={{ padding:"7px 16px", borderRadius:8, background:T.bg, border:`1px solid ${T.border2}`, color:T.dim, fontSize:13, fontWeight:600, cursor:"pointer" }}>← Back</button>
        <div><div style={{ fontSize:15, fontWeight:800, color:T.white }}>{selectedPatient.name}</div><div style={{ fontSize:12, color:T.dim, display:"flex", gap:8, marginTop:2 }}><span>{selectedPatient.uhid}</span><Pill color={bColor(selectedPatient._branch,T)}>{bName(selectedPatient._branch)}</Pill><span>{selectedPatient.age} {selectedPatient.gender}</span></div></div>
      </div>
      {loadingReports ? <div style={{ ...cardStyle(T), textAlign:"center", padding:60 }}><div style={{ fontSize:36, marginBottom:12 }}>🔬</div><div style={{ color:T.dim }}>Loading lab reports...</div></div>
      : reports.length===0 ? <div style={{ ...cardStyle(T), textAlign:"center", padding:60 }}><div style={{ fontSize:40, marginBottom:12 }}>📋</div><div style={{ fontSize:15, fontWeight:700, color:T.white, marginBottom:8 }}>No Lab Reports Found</div><div style={{ fontSize:13, color:T.dim }}>No lab reports are available for this patient admission.</div></div>
      : <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {reports.map((report,i)=>{
            const dept=report.department||"PATHOLOGY";
            const deptMeta=LAB_TEST_COLORS[dept]||{color:T.laxmi,bg:T.laxmi+"10"};
            const isExpanded=expandedReport===i;
            return (
              <div key={i} style={{ ...cardStyle(T), borderLeft:`4px solid ${deptMeta.color}`, padding:0, overflow:"hidden" }}>
                <div role="button" tabIndex={0} onClick={()=>setExpandedReport(isExpanded?null:i)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" ")setExpandedReport(isExpanded?null:i);}} style={{ padding:"14px 18px", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ background:deptMeta.bg, borderRadius:8, padding:"6px 12px" }}><div style={{ fontSize:10, fontWeight:700, color:deptMeta.color, textTransform:"uppercase", letterSpacing:".06em" }}>{dept}</div></div>
                    <div><div style={{ fontSize:14, fontWeight:800, color:T.white }}>{report.title||report.type}</div><div style={{ fontSize:11, color:T.dim, marginTop:2 }}>Date: {report.date||"--"} · Sr. No.: {report.srNo||"--"}</div></div>
                  </div>
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <button onClick={e=>{e.stopPropagation();handlePrintReport(report);}} style={{ padding:"5px 12px", borderRadius:7, background:T.laxmi+"20", color:T.laxmi, border:`1px solid ${T.laxmi}44`, fontSize:11, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}><Printer size={11}/> Print</button>
                    <span style={{ fontSize:12, color:T.dim }}>{isExpanded?"▲":"▼"}</span>
                  </div>
                </div>
                {isExpanded && <div style={{ padding:"0 18px 18px", borderTop:`1px solid ${T.border}` }}>
                  {(()=>{
                    const mappedTests=Array.isArray(report.tests)?report.tests.map(t=>({name:t.name||t.test_name||t.parameter||"Test",value:t.value||t.result||"--",unit:t.unit||"--",normal:t.refRange||t.normal||t.normal_value||"--",isAbnormal:String(t.status||"").toLowerCase()==="high"||String(t.status||"").toLowerCase()==="low"})):[];
                    const detailFields=Array.isArray(report.fields)&&report.fields.length>0?report.fields:(mappedTests.length>0?mappedTests:[]);
                    if(detailFields.length>0) return <table style={{ width:"100%", borderCollapse:"collapse", marginTop:12 }}><thead><tr>{["Test Name","Value","Unit","Normal Range"].map(h=><TH key={h} h={h}/>)}</tr></thead><tbody>{detailFields.map((f,fi)=>(<tr key={fi} style={{ borderBottom:`1px solid ${T.border}`, background:fi%2===0?T.card:T.surface }}><td style={{ padding:"8px 12px", fontSize:12, color:T.white }}>{f.name||f.label}</td><td style={{ padding:"8px 12px", fontSize:13, fontWeight:800, color:f.isAbnormal?T.red:T.green }}>{f.value||"--"}</td><td style={{ padding:"8px 12px", fontSize:11, color:T.dim }}>{f.unit||"--"}</td><td style={{ padding:"8px 12px", fontSize:11, color:T.dim }}>{f.normal||"--"}</td></tr>))}</tbody></table>;
                    if(report.narrative||report.findings||report.impression) return <div style={{ background:T.bg, borderRadius:8, padding:14, marginTop:12, fontSize:13, color:T.white, lineHeight:1.7 }}>{report.narrative||[report.findings,report.impression].filter(Boolean).join("\n\n")}</div>;
                    return <div style={{ textAlign:"center", padding:"20px", color:T.dim, fontSize:12 }}>No detailed fields available</div>;
                  })()}
                  {report.remarks && <div style={{ marginTop:10, background:T.amber+"10", border:`1px solid ${T.amber}40`, borderRadius:8, padding:"10px 14px", fontSize:12, color:T.amber }}><strong>Remarks:</strong> {report.remarks}</div>}
                </div>}
              </div>
            );
          })}
        </div>}
    </div>
  );

  return (
    <div>
      <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:18 }}>
        <StatCard icon={FlaskConical} label="Total Patients" value={all.length} sub="Select to view reports" color={T.laxmi}/>
        <StatCard icon={Hospital} label="Hospital Branches" value={BRANCH_REGISTRY.length} color={T.amber}/>
      </div>
      <div style={{ display:"flex", gap:8, marginBottom:12, alignItems:"center" }}>
        <FilterSelect value={branch} onChange={setBranch} options={branchFilterOptions()}/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or UHID..." style={{ marginLeft:"auto", padding:"7px 13px", borderRadius:8, border:`1px solid ${T.border2}`, background:T.card, color:T.white, fontSize:13, outline:"none", width:240 }}/>
      </div>
      <div style={{ ...cardStyle(T), padding:0, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr>{["UHID","Patient","Branch","Age/Sex","Doctor","Adm Date","Diagnosis",""].map(h=><TH key={h} h={h}/>)}</tr></thead>
          <tbody>
            {rows.length===0 && <tr><td colSpan={8} style={{ padding:48, textAlign:"center", color:T.dim }}>No records found</td></tr>}
            {rows.map((p,i)=>(
              <tr key={i} style={{ borderBottom:`1px solid ${T.border}`, background:i%2===0?T.card:T.surface }}>
                <td style={{ padding:"9px 12px", fontSize:12, fontWeight:700, color:bColor(p._branch,T) }}>{p.uhid}</td>
                <td style={{ padding:"9px 12px" }}><div style={{ fontSize:13, fontWeight:600, color:T.white }}>{p.name}</div></td>
                <td style={{ padding:"9px 12px" }}><Pill color={bColor(p._branch,T)}>{bName(p._branch)}</Pill></td>
                <td style={{ padding:"9px 12px", fontSize:11, color:T.dim }}>{p.age} / {p.gender}</td>
                <td style={{ padding:"9px 12px", fontSize:12, color:T.dim }}>{p.doctor}</td>
                <td style={{ padding:"9px 12px", fontSize:11, color:T.dim }}>{fmt(p.admDate)}</td>
                <td style={{ padding:"9px 12px", fontSize:11, color:T.dim, maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.diagnosis}</td>
                <td style={{ padding:"9px 12px" }}><button onClick={()=>fetchReports(p)} style={{ padding:"5px 12px", borderRadius:7, background:T.laxmi+"20", color:T.laxmi, border:`1px solid ${T.laxmi}44`, fontSize:11, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}><FlaskConical size={11}/> View Reports</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
