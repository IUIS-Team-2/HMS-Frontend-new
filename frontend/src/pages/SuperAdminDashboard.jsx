import { useState, useMemo, useEffect, useRef, createContext, useContext } from "react";
import { useTheme } from "../context/ThemeContext";
import * as XLSX from "xlsx";
import { USERS } from "../data/constants";
import { apiService } from "../services/apiService"; 
import { toast } from "react-toastify";

/* ══════════════════════════════════════════════════════════════
   DESIGN TOKENS & HELPERS
══════════════════════════════════════════════════════════════ */
const T_DARK = {
  bg:      "#08121E",
  surface: "#0D1B2A",
  card:    "#112236",
  card2:   "#162D45",
  border:  "#1A3550",
  border2: "#234869",
  laxmi:   "#38BDF8",
  raya:    "#A78BFA",
  green:   "#34D399",
  amber:   "#FBBF24",
  red:     "#F87171",
  white:   "#E8F4FF",
  dim:     "#5B8FAF",
  dimmer:  "#1E3D5C",
  sidebar: "#0A1828",
};
const T_LIGHT = {
  bg:      "#f5f3ff",
  surface: "#ffffff",
  card:    "#ffffff",
  card2:   "#faf8ff",
  border:  "#e9e3ff",
  border2: "#d4c8ff",
  laxmi:   "#0891b2",
  raya:    "#7c3aed",
  green:   "#059669",
  amber:   "#d97706",
  red:     "#dc2626",
  white:   "#1e1033",
  dim:     "#7c6fa0",
  dimmer:  "#c4b5fd",
  sidebar: "#ffffff",
};
let T = T_DARK;
const TC = createContext(T_DARK);
const useT = () => useContext(TC);


/* ══════════════════════════════════════════════════════════════
   DESIGN TOKENS
══════════════════════════════════════════════════════════════ */


const SD = "0 4px 32px rgba(0,0,0,.5)";
const cardStyle = (t) => ({ background: t.card, borderRadius: 14, padding: 20, boxShadow: SD });
const bColor = (loc, t) => loc === "laxmi" ? t.laxmi : t.raya;
const bName  = loc => loc === "laxmi" ? "Lakshmi Nagar" : "Raya";
const fmt    = d  => { try { const dt=new Date(d); return isNaN(dt)?"--":dt.toLocaleDateString("en-IN"); } catch { return "--"; } };
const inr    = v  => "Rs." + Number(v||0).toLocaleString("en-IN");

const BRANCH_COLORS = { laxmi: T.laxmi, raya: T.raya, all: T.green };
const BRANCH_LABELS = { laxmi: "Lakshmi Nagar", raya: "Raya", all: "All Branches" };

function exportXLSX(rows, cols, filename) {
  const data = rows.map(r => {
    const obj = {};
    cols.forEach(c => { obj[c.label] = typeof c.get==="function" ? c.get(r) : (r[c.key] ?? ""); });
    return obj;
  });
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, filename);
}

function flattenDB(db, branchFilter) {
  const out = [];
  Object.entries(db||{}).forEach(([branch, pts]) => {
    if (branchFilter && branchFilter !== "all" && branchFilter !== branch) return;
    (pts||[]).forEach(p => {
      (p.admissions||[]).forEach(adm => {
        const svcs = adm.services||[];
        const subtotal = svcs.reduce((s,sv)=>s+(parseFloat(sv.rate)||0)*(parseFloat(sv.qty)||1),0);
        const discount = parseFloat(adm.billing?.discount)||0;
        const advance  = parseFloat(adm.billing?.advance)||0;
        const paid     = parseFloat(adm.billing?.paidNow)||0;
        const grand    = subtotal - discount;
        const pending  = Math.max(0, grand - advance - paid);
        out.push({
          _branch: branch, _patient: p, _admission: adm,
          uhid: p.uhid, name: p.patientName, gender: p.gender||"--",
          age: p.ageYY ? p.ageYY+"y" : "--",
          phone: p.phone||"--", bloodGroup: p.bloodGroup||"--",
          address: p.address||"--", nationalId: p.nationalId||"--",
          allergies: p.allergies||"--", remarks: p.remarks||"--",
          tpa: p.tpa||"--", tpaCard: p.tpaCard||"--",
          admNo: adm.admNo,
          admDate:       adm.discharge?.doa || adm.dateTime || adm.date || "",
          dischargeDate: adm.discharge?.dod || null,
          doctor:        adm.discharge?.doctorName || "--",
          ward:          adm.discharge?.wardName   || "--",
          bed:           adm.discharge?.bedNo      || "--",
          room:          adm.discharge?.roomNo     || "--",
          department:    adm.discharge?.department || "--",
          diagnosis:     adm.discharge?.diagnosis  || "--",
          dischargeStatus: adm.discharge?.dischargeStatus || "Admitted",
          paymentMode:   adm.billing?.paymentMode  || "--",
          subtotal, discount, advance, paid, grand, pending,
          admType: (p.tpa || p.payMode==="cashless") ? "Cashless" : "Cash",
          services: svcs,
          medHistory: adm.medicalHistory||null,
          billingObj: adm.billing||{},
        });
      });
    });
  });
  return out;
}

/* ══════════════════════════════════════════════════════════════
   MICRO UI COMPONENTS
══════════════════════════════════════════════════════════════ */
function Pill({ children, color }) {
  return <span style={{ background:color+"1A", color, border:`1px solid ${color}40`,
    borderRadius:6, padding:"2px 9px", fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>{children}</span>;
}
function Badge({ children, color }) {
  return <span style={{ background:color+"18", color, borderRadius:5, padding:"2px 8px", fontSize:11, fontWeight:700 }}>{children}</span>;
}
function STitle({ children, action }) {
  const T = useT();
  return <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
    <div style={{ fontSize:11, fontWeight:800, letterSpacing:".12em", textTransform:"uppercase", color:T.dim }}>{children}</div>
    {action}
  </div>;
}
function StatCard({ icon, label, value, sub, color }) {
  const T = useT();
  const cs = cardStyle(T);
  return <div style={{ ...cs, borderLeft:`4px solid ${color||T.laxmi}`, flex:1, minWidth:150 }}>
    <div style={{ display:"flex", justifyContent:"space-between" }}>
      <div>
        <div style={{ fontSize:11, color:T.dim, fontWeight:700, textTransform:"uppercase", letterSpacing:".07em", marginBottom:5 }}>{label}</div>
        <div style={{ fontSize:22, fontWeight:900, color:T.white }}>{value}</div>
        {sub && <div style={{ fontSize:11, color:T.dim, marginTop:3 }}>{sub}</div>}
      </div>
      <div style={{ fontSize:22, opacity:.6 }}>{icon}</div>
    </div>
  </div>;
}
function XlsBtn({ onClick, label }) {
  const T = useT();
  return <button onClick={onClick} style={{ padding:"7px 14px", borderRadius:8, border:"none",
    background:T.green, color:"#000", fontSize:12, fontWeight:800, cursor:"pointer", whiteSpace:"nowrap" }}>
    {label||"Download Excel"}
  </button>;
}
function FBtn({ active, color, onClick, children }) {
  const T = useT();
  return <button onClick={onClick} style={{ padding:"6px 13px", borderRadius:8, cursor:"pointer",
    fontWeight:700, fontSize:12, border:`1px solid ${active?(color||T.laxmi):T.border}`,
    background:active?(color||T.laxmi)+"20":"transparent", color:active?(color||T.laxmi):T.dim }}>{children}</button>;
}
function FilterSelect({ value, onChange, options, style }) {
  const T = useT();
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        padding: '6px 28px 6px 12px',
        borderRadius: 8,
        border: `1px solid ${T.border2}`,
        background: T.card,
        color: T.white,
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        outline: 'none',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23888'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 10px center',
        ...style
      }}
    >
      {options.map(([val, label]) => (
        <option key={val} value={val}>{label}</option>
      ))}
    </select>
  );
}
function TH({ h }) {
  const T = useT();
  return <th style={{ padding:"10px 12px", textAlign:"left", fontSize:10, fontWeight:700,
    color:T.dim, textTransform:"uppercase", letterSpacing:".06em", whiteSpace:"nowrap", background:T.bg }}>{h}</th>;
}

/* ══════════════════════════════════════════════════════════════
   PATIENT DETAIL MODAL
══════════════════════════════════════════════════════════════ */
function PatientModal({ p, onClose }) {
  const T = useT();
  const [editSvcs, setEditSvcs] = useState(null);
  const [docTemplate, setDocTemplate] = useState(null);
  const [docLoading, setDocLoading] = useState(false);

  if (!p) return null;
  const svcs = editSvcs || p.services || [];
  const upd = (i,field,val) => setEditSvcs((editSvcs||p.services||[]).map((s,idx)=>idx===i?{...s,[field]:val}:s));
  const subtotal = svcs.reduce((s,sv)=>s+(parseFloat(sv.rate)||0)*(parseFloat(sv.qty)||1),0);
  const discount = parseFloat(p.billingObj?.discount)||0;
  const grand = subtotal - discount;
  const col = bColor(p._branch, T);

  const handleLoadDocument = async () => {
    setDocLoading(true);
    try {
      const res = await apiService.getDynamicSummary(p.uhid, p.admNo, p.dischargeStatus || 'NORMAL');
      let fetchedContent = res.content;
      
      // 🌟 AUTO-CONVERTER: If you have an old test record saved as an Object, this converts it to the new Array format instantly!
      if (fetchedContent && fetchedContent.sections && !Array.isArray(fetchedContent.sections)) {
        fetchedContent.sections = Object.entries(fetchedContent.sections).map(([k, v]) => ({ key: k, ...v }));
      }
      
      setDocTemplate(fetchedContent);
    } catch (err) {
      toast.error("Failed to load document template.");
    }
    setDocLoading(false);
  };

  const handleSaveDocument = async () => {
    try {
      await apiService.saveDynamicSummary(p.uhid, p.admNo, {
        summary_type: p.dischargeStatus?.toUpperCase().includes('LAMA') ? 'LAMA' : (p.dischargeStatus?.toUpperCase() || 'NORMAL'),
        content: docTemplate
      });
      toast.success("Official Document Saved!");
    } catch (err) {
      toast.error("Failed to save document.");
    }
  };

  // 🌟 Updated to safely handle Array changes
  const handleSectionUpdate = (index, val) => {
    const newSections = [...docTemplate.sections];
    newSections[index] = { ...newSections[index], value: val };
    setDocTemplate({ ...docTemplate, sections: newSections });
  };

  const handleVitalsUpdate = (index, vKey, val) => {
    const newSections = [...docTemplate.sections];
    newSections[index] = { 
      ...newSections[index], 
      value: { ...newSections[index].value, [vKey]: val } 
    };
    setDocTemplate({ ...docTemplate, sections: newSections });
  };

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:3000, display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div style={{ background:T.surface,borderRadius:20,width:"100%",maxWidth:860, maxHeight:"92vh",overflow:"hidden",display:"flex",flexDirection:"column", boxShadow:"0 32px 100px rgba(0,0,0,.7)",border:`1px solid ${T.border}` }}>
        
        {/* MODAL HEADER */}
        <div style={{ padding:"18px 24px",borderBottom:`1px solid ${T.border}`,background:T.card, display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <div style={{ display:"flex",alignItems:"center",gap:12 }}>
            <div style={{ width:40,height:40,borderRadius:10,background:col+"20",border:`1.5px solid ${col}44`, display:"flex",alignItems:"center",justifyContent:"center",fontSize:20 }}>🧑</div>
            <div>
              <div style={{ fontSize:16,fontWeight:900,color:T.white }}>{p.name}</div>
              <div style={{ fontSize:12,color:T.dim,display:"flex",gap:8,alignItems:"center",marginTop:2 }}>
                <span>{p.uhid}</span><span>Adm #{p.admNo}</span>
                <Pill color={col}>{bName(p._branch)}</Pill>
                <Pill color={p.admType==="Cash"?T.green:T.amber}>{p.admType}</Pill>
              </div>
            </div>
          </div>
          <div style={{ display:"flex",gap:8 }}>
            <XlsBtn onClick={()=>exportXLSX([p],[
              {label:"UHID",key:"uhid"},{label:"Patient",key:"name"},{label:"Branch",get:r=>bName(r._branch)},
              {label:"Gender",key:"gender"},{label:"Age",key:"age"},{label:"Phone",key:"phone"},
              {label:"Blood Group",key:"bloodGroup"},{label:"Address",key:"address"},
              {label:"Doctor",key:"doctor"},{label:"Ward",key:"ward"},{label:"Bed",key:"bed"},
              {label:"Department",key:"department"},{label:"Diagnosis",key:"diagnosis"},
              {label:"Adm Date",get:r=>fmt(r.admDate)},{label:"Discharge Date",get:r=>fmt(r.dischargeDate)},
              {label:"Status",key:"dischargeStatus"},{label:"Payment Mode",key:"paymentMode"},
              {label:"Grand Total",key:"grand"},{label:"Paid",key:"paid"},{label:"Pending",key:"pending"},
              {label:"TPA",key:"tpa"},{label:"TPA Card",key:"tpaCard"},
            ],`${p.uhid}_adm${p.admNo}.xlsx`)} label="Download"/>
            <button onClick={onClose} style={{ background:"rgba(255,255,255,.08)",border:"none", color:T.white,width:34,height:34,borderRadius:8,cursor:"pointer",fontSize:16 }}>x</button>
          </div>
        </div>

        <div style={{ overflowY:"auto",padding:24 }}>
          
          {/* RESTORED: PATIENT INFO GRID */}
          <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:20 }}>
            {[["Gender",p.gender],["Age",p.age],["Blood Group",p.bloodGroup],["Phone",p.phone],
              ["Ward",p.ward],["Bed / Room",p.bed+" / "+p.room],["Department",p.department],["Doctor",p.doctor],
              ["Admitted",fmt(p.admDate)],["Discharged",p.dischargeDate?fmt(p.dischargeDate):"Still Admitted"],
              ["Diagnosis",p.diagnosis],["Status",p.dischargeStatus],
              ["Payment Mode",p.paymentMode],["Type",p.admType],["TPA",p.tpa],["Allergies",p.allergies],
            ].map(([k,v])=>(
              <div key={k} style={{ background:T.card,borderRadius:8,padding:"8px 12px" }}>
                <div style={{ fontSize:10,color:T.dim,fontWeight:700,textTransform:"uppercase",letterSpacing:".05em",marginBottom:2 }}>{k}</div>
                <div style={{ fontSize:12,color:T.white,fontWeight:600,wordBreak:"break-word" }}>{v||"--"}</div>
              </div>
            ))}
          </div>

          {/* RESTORED: MEDICAL HISTORY */}
          {p.medHistory && Object.values(p.medHistory).some(v=>v) && (
            <div style={{ ...cardStyle(T),marginBottom:18 }}>
              <STitle>Medical History</STitle>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
                {Object.entries(p.medHistory).filter(([,v])=>v).map(([k,v])=>(
                  <div key={k} style={{ background:T.bg,borderRadius:8,padding:"9px 12px" }}>
                    <div style={{ fontSize:10,color:T.dim,fontWeight:700,textTransform:"uppercase",marginBottom:2 }}>
                      {k.replace(/([A-Z])/g," $1").trim()}
                    </div>
                    <div style={{ fontSize:13,color:T.white }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 🌟 OFFICIAL DISCHARGE DOCUMENT SECTION */}
          {p.dischargeStatus && p.dischargeStatus !== "Admitted" && (
            <div style={{ ...cardStyle, marginBottom: 18, borderLeft: `4px solid ${T.laxmi}` }}>
              <STitle action={
                <div style={{ display: "flex", gap: 8 }}>
                  {!docTemplate ? (
                    <button onClick={handleLoadDocument} style={{ padding: "5px 12px", borderRadius: 7, background: T.laxmi, color: "#000", border: "none", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                      {docLoading ? "Loading..." : "Prepare Official Document"}
                    </button>
                  ) : (
                    <>
                      <button onClick={() => setDocTemplate(null)} style={{ padding: "5px 12px", borderRadius: 7, background: "transparent", border: `1px solid ${T.border2}`, color: T.dim, fontSize: 12, cursor: "pointer" }}>Close Editor</button>
                      <button onClick={handleSaveDocument} style={{ padding: "5px 12px", borderRadius: 7, background: T.green, color: "#000", border: "none", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>Save Document</button>
                      <button onClick={() => window.open(`http://localhost:8000/api/patients/${p.uhid}/admissions/${p.admNo}/dynamic-summary/print/`, "_blank")} style={{ padding: "5px 12px", borderRadius: 7, background: T.white, color: "#000", border: "none", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>Print Document</button>
                    </>
                  )}
                </div>
              }>Official Discharge Document ({p.dischargeStatus})</STitle>

              {/* RENDER THE DYNAMIC EDITOR */}
              {docTemplate && Array.isArray(docTemplate.sections) && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
                  {docTemplate.sections.map((sec, index) => {
                    if (sec.type === "textarea") {
                      return (
                        <div key={sec.key}>
                          <div style={{ fontSize: 11, color: T.dim, fontWeight: 700, marginBottom: 4 }}>{sec.label}</div>
                          <textarea value={sec.value} onChange={e => handleSectionUpdate(index, e.target.value)} rows={3} style={{ width: "100%", padding: "10px", borderRadius: 8, background: T.bg, border: `1px solid ${T.border2}`, color: T.white, fontSize: 13, outline: "none", resize: "vertical" }} />
                        </div>
                      );
                    }
                    if (sec.type === "text") {
                      return (
                        <div key={sec.key}>
                          <div style={{ fontSize: 11, color: T.dim, fontWeight: 700, marginBottom: 4 }}>{sec.label}</div>
                          <input type="text" value={sec.value} onChange={e => handleSectionUpdate(index, e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: 8, background: T.bg, border: `1px solid ${T.border2}`, color: T.white, fontSize: 13, outline: "none" }} />
                        </div>
                      );
                    }
                    if (sec.type === "vitals_grid") {
                      return (
                        <div key={sec.key} style={{ background: T.bg, border: `1px solid ${T.border2}`, padding: 16, borderRadius: 8 }}>
                          <div style={{ fontSize: 11, color: T.dim, fontWeight: 700, marginBottom: 12 }}>{sec.label}</div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                            {Object.entries(sec.value).map(([vKey, vVal]) => (
                              <div key={vKey}>
                                <div style={{ fontSize: 10, color: T.dim, textTransform: "uppercase", marginBottom: 4 }}>{vKey}</div>
                                <input type="text" value={vVal} onChange={e => handleVitalsUpdate(index, vKey, e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: 6, background: T.card, border: `1px solid ${T.border2}`, color: T.white, fontSize: 12, outline: "none" }} />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              )}
            </div>
          )}

          {/* RESTORED: SERVICES AND BILL TABLE */}
          <div style={{ ...cardStyle(T),marginBottom:18 }}>
            <STitle action={
              <div style={{ display:"flex",gap:8 }}>
                {editSvcs && <button onClick={()=>setEditSvcs(null)} style={{ padding:"5px 12px",borderRadius:7,
                  background:"transparent",border:`1px solid ${T.border2}`,color:T.dim,fontSize:12,cursor:"pointer" }}>Reset</button>}
                <button onClick={()=>alert("Save connected to your backend")} style={{ padding:"5px 12px",borderRadius:7,
                  background:T.green,color:"#000",border:"none",fontSize:12,fontWeight:800,cursor:"pointer" }}>Save Changes</button>
              </div>
            }>Services and Bill (Editable Rates and Qty)</STitle>
            <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
              <thead><tr>{["Service","Type","Rate","Qty","Amount"].map(h=><TH key={h} h={h}/>)}</tr></thead>
              <tbody>
                {svcs.map((sv,i)=>(
                  <tr key={i} style={{ borderBottom:`1px solid ${T.border}` }}>
                    <td style={{ padding:"8px 12px",color:T.white,fontWeight:600 }}>{sv.title||sv.type}</td>
                    <td style={{ padding:"8px 12px" }}><Badge color={T.dim}>{sv.type}</Badge></td>
                    <td style={{ padding:"8px 12px" }}>
                      <input type="number" value={sv.rate} onChange={e=>upd(i,"rate",e.target.value)}
                        style={{ width:90,background:T.bg,border:`1px solid ${T.border2}`,borderRadius:6,
                          color:T.white,padding:"4px 8px",fontSize:13,outline:"none",textAlign:"right" }}/>
                    </td>
                    <td style={{ padding:"8px 12px" }}>
                      <input type="number" value={sv.qty} onChange={e=>upd(i,"qty",e.target.value)}
                        style={{ width:60,background:T.bg,border:`1px solid ${T.border2}`,borderRadius:6,
                          color:T.white,padding:"4px 8px",fontSize:13,outline:"none",textAlign:"right" }}/>
                    </td>
                    <td style={{ padding:"8px 12px",fontWeight:800,color:T.amber }}>
                      {inr((parseFloat(sv.rate)||0)*(parseFloat(sv.qty)||1))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,
              marginTop:14,paddingTop:14,borderTop:`1px solid ${T.border}` }}>
              {[["Subtotal",inr(subtotal),T.white],["Discount","-"+inr(discount),T.red],
                ["Advance",inr(parseFloat(p.billingObj?.advance)||0),T.green],
                ["Paid Now",inr(p.paid),T.green]].map(([k,v,c])=>(
                <div key={k} style={{ fontSize:12,color:T.dim }}>
                  {k}: <strong style={{ color:c }}>{v}</strong>
                </div>
              ))}
              <div style={{ fontSize:16,fontWeight:900,color:T.amber,marginTop:4 }}>Grand Total: {inr(grand)}</div>
              {p.pending>0 && <div style={{ fontSize:13,fontWeight:800,color:T.red }}>Pending: {inr(p.pending)}</div>}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB COMPONENTS
══════════════════════════════════════════════════════════════ */
// (PTable, DashboardTab, BranchTab, AllPatientsTab, BillingTab, InvoicesTab, MedicalTab, DischargeTab, ReportsTab, AdminsTab, DepartmentsTab go here...)
// To save space, assuming they are defined as in your previous version or below.

const PT_COLS = [
  {label:"UHID",key:"uhid"},{label:"Patient",key:"name"},{label:"Gender",key:"gender"},
  {label:"Age",key:"age"},{label:"Phone",key:"phone"},{label:"Branch",get:r=>bName(r._branch)},
  {label:"Type",key:"admType"},{label:"Doctor",key:"doctor"},{label:"Ward",key:"ward"},
  {label:"Department",key:"department"},{label:"Adm Date",get:r=>fmt(r.admDate)},
  {label:"Discharge Date",get:r=>fmt(r.dischargeDate)},{label:"Diagnosis",key:"diagnosis"},
  {label:"Status",key:"dischargeStatus"},{label:"Grand Total",key:"grand"},
  {label:"Paid",key:"paid"},{label:"Pending",key:"pending"},{label:"Payment Mode",key:"paymentMode"},
  {label:"TPA",key:"tpa"},
];

function PTable({ rows, showBranch, filename }) {
  const T = useT();
  const [modal, setModal]   = useState(null);
  const [search, setSearch] = useState("");
  const [typeF, setTypeF]   = useState("all");

  const filtered = rows.filter(p => {
    if (typeF==="cash" && p.admType!=="Cash") return false;
    if (typeF==="cashless" && p.admType!=="Cashless") return false;
    if (search && ![p.name,p.uhid,p.doctor,p.diagnosis].some(v=>v?.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  return (
    <>
      <div style={{ display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",marginBottom:12 }}>
        <FilterSelect value={typeF} onChange={setTypeF} options={[["all","All Types"],["cash","Cash Patients"],["cashless","Cashless / TPA"]]}/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, UHID, doctor, diagnosis..."
          style={{ marginLeft:"auto",padding:"7px 13px",borderRadius:8,border:`1px solid ${T.border2}`,
            background:T.card,color:T.white,fontSize:13,outline:"none",width:270 }}/>
        <XlsBtn onClick={()=>exportXLSX(filtered,PT_COLS,filename||"patients.xlsx")}/>
      </div>
      <div style={{ ...cardStyle(T),padding:0,overflow:"hidden" }}>
        <table style={{ width:"100%",borderCollapse:"collapse" }}>
          <thead><tr>
            {["#","UHID","Patient","Type",showBranch&&"Branch","Doctor","Ward","Adm","Discharge","Diagnosis","Grand","Paid","Pending","Status",""].filter(Boolean).map(h=><TH key={h} h={h}/>)}
          </tr></thead>
          <tbody>
            {filtered.length===0 && <tr><td colSpan={15} style={{ padding:48,textAlign:"center",color:T.dim }}>No records found</td></tr>}
            {filtered.map((p,i)=>(
              <tr key={i} onClick={()=>setModal(p)}
                style={{ borderBottom:`1px solid ${T.border}`,background:i%2===0?T.card:T.surface,cursor:"pointer" }}>
                <td style={{ padding:"9px 12px",color:T.dim,fontSize:11 }}>{i+1}</td>
                <td style={{ padding:"9px 12px",fontSize:12,fontWeight:700,color:bColor(p._branch, T) }}>{p.uhid}</td>
                <td style={{ padding:"9px 12px" }}>
                  <div style={{ fontSize:13,fontWeight:600,color:T.white }}>{p.name}</div>
                  <div style={{ fontSize:10,color:T.dim }}>{p.age} {p.gender}</div>
                </td>
                <td style={{ padding:"9px 12px" }}><Pill color={p.admType==="Cash"?T.green:T.amber}>{p.admType}</Pill></td>
                {showBranch && <td style={{ padding:"9px 12px" }}><Pill color={bColor(p._branch, T)}>{bName(p._branch)}</Pill></td>}
                <td style={{ padding:"9px 12px",fontSize:12,color:T.dim }}>{p.doctor}</td>
                <td style={{ padding:"9px 12px",fontSize:11,color:T.dim }}>{p.ward} {p.bed}</td>
                <td style={{ padding:"9px 12px",fontSize:11,color:T.dim }}>{fmt(p.admDate)}</td>
                <td style={{ padding:"9px 12px",fontSize:11,color:p.dischargeDate?T.green:T.amber }}>{p.dischargeDate?fmt(p.dischargeDate):"Admitted"}</td>
                <td style={{ padding:"9px 12px",fontSize:11,color:T.dim,maxWidth:130,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{p.diagnosis}</td>
                <td style={{ padding:"9px 12px",fontSize:13,fontWeight:800,color:T.amber }}>{inr(p.grand)}</td>
                <td style={{ padding:"9px 12px",fontSize:12,fontWeight:700,color:T.green }}>{inr(p.paid)}</td>
                <td style={{ padding:"9px 12px",fontSize:12,color:p.pending>0?T.red:T.dim }}>{p.pending>0?inr(p.pending):"--"}</td>
                <td style={{ padding:"9px 12px" }}><Badge color={p.dischargeStatus==="Recovered"?T.green:p.dischargeStatus==="Admitted"?T.laxmi:T.amber}>{p.dischargeStatus}</Badge></td>
                <td style={{ padding:"9px 12px" }}><button onClick={e=>{e.stopPropagation();setModal(p);}} style={{ padding:"4px 10px",borderRadius:6,background:T.laxmi+"20",color:T.laxmi,border:`1px solid ${T.laxmi}40`,fontSize:11,fontWeight:700,cursor:"pointer" }}>View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PatientModal p={modal} onClose={()=>setModal(null)}/>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB 1 — DASHBOARD
══════════════════════════════════════════════════════════════ */
function DashboardTab({ all, laxmi, raya }) {
  const T = useT();
  const totalRev = all.reduce((s,p)=>s+p.grand,0);
  const lRev     = laxmi.reduce((s,p)=>s+p.grand,0);
  const rRev     = raya.reduce((s,p)=>s+p.grand,0);
  const pend     = all.reduce((s,p)=>s+p.pending,0);
  const admitted = all.filter(p=>!p.dischargeDate).length;
  const disch    = all.filter(p=>p.dischargeDate).length;
  const cash     = all.filter(p=>p.admType==="Cash").length;
  const cashless = all.filter(p=>p.admType==="Cashless").length;

  return (
    <div>
      <div style={{ display:"flex",gap:12,flexWrap:"wrap",marginBottom:14 }}>
        <StatCard icon="👥" label="Total Patients" value={all.length} sub={admitted+" admitted / "+disch+" discharged"} color={T.laxmi}/>
        <StatCard icon="💰" label="Total Revenue" value={inr(totalRev)} sub={pend>0?inr(pend)+" pending":"All collected"} color={T.green}/>
        <StatCard icon="🏥" label="Laxmi Nagar" value={laxmi.length} sub={inr(lRev)} color={T.laxmi}/>
        <StatCard icon="🏨" label="Raya" value={raya.length} sub={inr(rRev)} color={T.raya}/>
      </div>
      <div style={{ display:"flex",gap:12,flexWrap:"wrap",marginBottom:22 }}>
        <StatCard icon="🛏️" label="Currently Admitted" value={admitted} sub="Active patients" color={T.amber}/>
        <StatCard icon="✅" label="Discharged" value={disch} sub="Completed" color={T.green}/>
        <StatCard icon="💵" label="Cash Patients" value={cash} sub={Math.round(cash/Math.max(all.length,1)*100)+"%"} color={T.green}/>
        <StatCard icon="🏦" label="Cashless / TPA" value={cashless} sub={Math.round(cashless/Math.max(all.length,1)*100)+"%"} color={T.amber}/>
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:22 }}>
        {[["laxmi",laxmi,T.laxmi],["raya",raya,T.raya]].map(([br,pts,col])=>(
          <div key={br} style={{ ...cardStyle(T),borderTop:`3px solid ${col}` }}>
            <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:16 }}>
              <Pill color={col}>{bName(br)}</Pill>
              <span style={{ fontSize:12,color:T.dim }}>Branch Summary</span>
            </div>
            {[["Total Admissions",pts.length],["Admitted",pts.filter(p=>!p.dischargeDate).length],
              ["Discharged",pts.filter(p=>p.dischargeDate).length],["Cash",pts.filter(p=>p.admType==="Cash").length],
              ["Cashless / TPA",pts.filter(p=>p.admType==="Cashless").length],
              ["Revenue",inr(pts.reduce((s,p)=>s+p.grand,0))],["Collected",inr(pts.reduce((s,p)=>s+p.paid,0))],
              ["Pending",inr(pts.reduce((s,p)=>s+p.pending,0))],
              ["Avg Bill",inr(Math.round(pts.reduce((s,p)=>s+p.grand,0)/Math.max(pts.length,1)))],
            ].map(([k,v])=>(
              <div key={k} style={{ display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${T.border}` }}>
                <span style={{ fontSize:12,color:T.dim }}>{k}</span>
                <span style={{ fontSize:13,fontWeight:700,color:T.white }}>{v}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <STitle action={<XlsBtn onClick={()=>exportXLSX(all,PT_COLS,"overview_all.xlsx")}/>}>
        Recent Admissions - Both Branches
      </STitle>
      <div style={{ ...cardStyle(T),padding:0,overflow:"hidden" }}>
        <table style={{ width:"100%",borderCollapse:"collapse" }}>
          <thead><tr>{["UHID","Patient","Branch","Type","Doctor","Admitted","Grand Total","Status"].map(h=><TH key={h} h={h}/>)}</tr></thead>
          <tbody>
            {all.slice(0,12).map((p,i)=>(
              <tr key={i} style={{ borderBottom:`1px solid ${T.border}`,background:i%2===0?T.card:T.surface }}>
                <td style={{ padding:"9px 12px",fontSize:12,fontWeight:700,color:bColor(p._branch, T) }}>{p.uhid}</td>
                <td style={{ padding:"9px 12px",fontSize:13,fontWeight:600,color:T.white }}>{p.name}</td>
                <td style={{ padding:"9px 12px" }}><Pill color={bColor(p._branch, T)}>{bName(p._branch)}</Pill></td>
                <td style={{ padding:"9px 12px" }}><Pill color={p.admType==="Cash"?T.green:T.amber}>{p.admType}</Pill></td>
                <td style={{ padding:"9px 12px",fontSize:12,color:T.dim }}>{p.doctor}</td>
                <td style={{ padding:"9px 12px",fontSize:11,color:T.dim }}>{fmt(p.admDate)}</td>
                <td style={{ padding:"9px 12px",fontSize:13,fontWeight:800,color:T.amber }}>{inr(p.grand)}</td>
                <td style={{ padding:"9px 12px" }}><Badge color={p.dischargeDate?T.green:T.amber}>{p.dischargeDate?"Discharged":"Admitted"}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB 2/3 — BRANCH PATIENTS
══════════════════════════════════════════════════════════════ */
function BranchTab({ pts, branch }) {
  const T = useT();
  const col = bColor(branch, T);
  const cash = pts.filter(p=>p.admType==="Cash");
  const cl   = pts.filter(p=>p.admType==="Cashless");
  return (
    <div>
      <div style={{ display:"flex",gap:12,flexWrap:"wrap",marginBottom:18 }}>
        <StatCard icon="👥" label="Total Patients" value={pts.length} sub={pts.filter(p=>!p.dischargeDate).length+" active"} color={col}/>
        <StatCard icon="💵" label="Cash" value={cash.length} sub={inr(cash.reduce((s,p)=>s+p.grand,0))} color={T.green}/>
        <StatCard icon="🏦" label="Cashless / TPA" value={cl.length} sub={inr(cl.reduce((s,p)=>s+p.grand,0))} color={T.amber}/>
        <StatCard icon="💰" label="Revenue" value={inr(pts.reduce((s,p)=>s+p.grand,0))} sub={inr(pts.reduce((s,p)=>s+p.pending,0))+" pending"} color={col}/>
      </div>
      <PTable rows={pts} showBranch={false} filename={branch+"_patients.xlsx"}/>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB 4 — ALL PATIENTS
══════════════════════════════════════════════════════════════ */
function AllPatientsTab({ all }) {
  const T = useT();
  const [branch, setBranch] = useState("all");
  const rows = branch==="all" ? all : all.filter(p=>p._branch===branch);
  return (
    <div>
      <div style={{ display:"flex",gap:12,flexWrap:"wrap",marginBottom:18 }}>
        <StatCard icon="👥" label="All Patients" value={all.length} color={T.laxmi}/>
        <StatCard icon="🏥" label="Laxmi Nagar" value={all.filter(p=>p._branch==="laxmi").length} color={T.laxmi}/>
        <StatCard icon="🏨" label="Raya" value={all.filter(p=>p._branch==="raya").length} color={T.raya}/>
        <StatCard icon="💰" label="Combined Revenue" value={inr(all.reduce((s,p)=>s+p.grand,0))} color={T.green}/>
      </div>
      <div style={{ display:"flex",gap:8,marginBottom:12 }}>
        <FilterSelect value={branch} onChange={setBranch} options={[["all","All Branches"],["laxmi","Lakshmi Nagar"],["raya","Raya"]]}/>
      </div>
      <PTable rows={rows} showBranch={branch==="all"} filename="all_patients.xlsx"/>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB 5 — BILLING
══════════════════════════════════════════════════════════════ */
function BillingTab({ all }) {
  const T = useT();
  const [branch, setBranch] = useState("all");
  const [typeF, setTypeF]   = useState("all");
  const [modal, setModal]   = useState(null);

  const rows = all.filter(p=>{
    if (branch!=="all"&&p._branch!==branch) return false;
    if (typeF==="cash"&&p.admType!=="Cash") return false;
    if (typeF==="cashless"&&p.admType!=="Cashless") return false;
    return true;
  });

  const BCOLS = [
    {label:"UHID",key:"uhid"},{label:"Patient",key:"name"},{label:"Branch",get:r=>bName(r._branch)},
    {label:"Type",key:"admType"},{label:"Doctor",key:"doctor"},{label:"Date",get:r=>fmt(r.admDate)},
    {label:"Subtotal",key:"subtotal"},{label:"Discount",key:"discount"},{label:"Advance",key:"advance"},
    {label:"Grand Total",key:"grand"},{label:"Paid",key:"paid"},{label:"Pending",key:"pending"},
    {label:"Payment Mode",key:"paymentMode"},{label:"TPA",key:"tpa"},
  ];

  return (
    <div>
      <div style={{ display:"flex",gap:12,flexWrap:"wrap",marginBottom:18 }}>
        <StatCard icon="💰" label="Collected" value={inr(rows.reduce((s,p)=>s+p.paid,0))} color={T.green}/>
        <StatCard icon="📋" label="Grand Total" value={inr(rows.reduce((s,p)=>s+p.grand,0))} color={T.amber}/>
        <StatCard icon="⚠️" label="Pending Dues" value={inr(rows.reduce((s,p)=>s+p.pending,0))} color={T.red}/>
        <StatCard icon="📊" label="Records" value={rows.length} color={T.laxmi}/>
      </div>
      <div style={{ display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",marginBottom:12 }}>
        <FilterSelect value={branch} onChange={setBranch} options={[["all","All Branches"],["laxmi","Lakshmi Nagar"],["raya","Raya"]]}/>
        <FilterSelect value={typeF} onChange={setTypeF} options={[["all","All Types"],["cash","Cash"],["cashless","Cashless / TPA"]]}/>
        <XlsBtn onClick={()=>exportXLSX(rows,BCOLS,"billing_all.xlsx")}/>
      </div>
      <div style={{ ...cardStyle(T),padding:0,overflow:"hidden" }}>
        <table style={{ width:"100%",borderCollapse:"collapse" }}>
          <thead><tr>{["UHID","Patient","Branch","Type","Doctor","Date","Grand","Paid","Pending","Mode",""].map(h=><TH key={h} h={h}/>)}</tr></thead>
          <tbody>
            {rows.length===0&&<tr><td colSpan={11} style={{ padding:48,textAlign:"center",color:T.dim }}>No records</td></tr>}
            {rows.map((p,i)=>(
              <tr key={i} style={{ borderBottom:`1px solid ${T.border}`,background:i%2===0?T.card:T.surface }}>
                <td style={{ padding:"9px 12px",fontSize:12,fontWeight:700,color:bColor(p._branch, T) }}>{p.uhid}</td>
                <td style={{ padding:"9px 12px",fontSize:13,fontWeight:600,color:T.white }}>{p.name}</td>
                <td style={{ padding:"9px 12px" }}><Pill color={bColor(p._branch, T)}>{bName(p._branch)}</Pill></td>
                <td style={{ padding:"9px 12px" }}><Pill color={p.admType==="Cash"?T.green:T.amber}>{p.admType}</Pill></td>
                <td style={{ padding:"9px 12px",fontSize:12,color:T.dim }}>{p.doctor}</td>
                <td style={{ padding:"9px 12px",fontSize:11,color:T.dim }}>{fmt(p.admDate)}</td>
                <td style={{ padding:"9px 12px",fontSize:13,fontWeight:800,color:T.amber }}>{inr(p.grand)}</td>
                <td style={{ padding:"9px 12px",fontSize:12,fontWeight:700,color:T.green }}>{inr(p.paid)}</td>
                <td style={{ padding:"9px 12px",fontSize:12,color:p.pending>0?T.red:T.dim }}>{p.pending>0?inr(p.pending):"--"}</td>
                <td style={{ padding:"9px 12px",fontSize:11,color:T.dim }}>{p.paymentMode}</td>
                <td style={{ padding:"9px 12px" }}><button onClick={()=>setModal(p)} style={{ padding:"4px 10px",borderRadius:6,background:T.laxmi+"20",color:T.laxmi,border:`1px solid ${T.laxmi}40`,fontSize:11,fontWeight:700,cursor:"pointer" }}>Edit Bill</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PatientModal p={modal} onClose={()=>setModal(null)}/>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB 6 — INVOICE APPROVALS
══════════════════════════════════════════════════════════════ */
function InvoicesTab({ printRequests, onApprovePrint }) {
  const T = useT();
  const reqs = printRequests||[];
  return (
    <div>
      <div style={{ display:"flex",gap:12,marginBottom:20 }}>
        <StatCard icon="📬" label="Pending Approvals" value={reqs.length} color={reqs.length>0?T.amber:T.green}/>
      </div>
      {reqs.length===0 ? (
        <div style={{ ...cardStyle(T),textAlign:"center",padding:80 }}>
          <div style={{ fontSize:52,marginBottom:14 }}>✅</div>
          <div style={{ fontSize:18,fontWeight:800,color:T.white }}>All clear</div>
          <div style={{ fontSize:13,color:T.dim,marginTop:6 }}>Invoice print requests from both branches will appear here</div>
        </div>
      ) : reqs.map((req,i)=>{
        const col = bColor(req.locId, T);
        const amt = Number(req.billing?.grandTotal)||Number(req.billing?.paidNow)||0;
        return (
          <div key={i} style={{ ...cardStyle(T),borderLeft:`5px solid ${col}`,marginBottom:12,
            display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16 }}>
            <div>
              <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:8 }}>
                <span style={{ fontSize:15,fontWeight:900,color:T.white }}>{req.patientName}</span>
                <Pill color={col}>{bName(req.locId)}</Pill>
              </div>
              <div style={{ fontSize:12,color:T.dim,display:"flex",gap:16,flexWrap:"wrap" }}>
                <span>UHID: <strong style={{ color:T.white }}>{req.uhid}</strong></span>
                <span>Adm #{req.admNo}</span>
                <span>Amount: <strong style={{ color:T.amber }}>{inr(amt)}</strong></span>
                <span>{new Date(req.requestedAt||Date.now()).toLocaleString("en-IN")}</span>
              </div>
            </div>
            <div style={{ display:"flex",gap:8 }}>
              <button onClick={()=>onApprovePrint&&onApprovePrint(req,"reject")} style={{ padding:"8px 18px",borderRadius:8,
                background:"rgba(248,113,113,.12)",color:T.red,border:`1px solid ${T.red}44`,fontWeight:800,fontSize:13,cursor:"pointer" }}>Reject</button>
              <button onClick={()=>onApprovePrint&&onApprovePrint(req,"approve")} style={{ padding:"8px 18px",borderRadius:8,
                background:T.green,color:"#000",border:"none",fontWeight:800,fontSize:13,cursor:"pointer" }}>Approve and Print</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB 7 — MEDICAL HISTORY
══════════════════════════════════════════════════════════════ */
function MedicalTab({ all }) {
  const T = useT();
  const withMed = all.filter(p=>p.medHistory&&Object.values(p.medHistory).some(v=>v));
  const [modal, setModal]   = useState(null);
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("all");

  const rows = withMed.filter(p=>{
    if (branch!=="all"&&p._branch!==branch) return false;
    if (search&&![p.name,p.uhid].some(v=>v?.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const MCOLS = [
    {label:"UHID",key:"uhid"},{label:"Patient",key:"name"},{label:"Branch",get:r=>bName(r._branch)},
    {label:"Doctor",key:"doctor"},{label:"Previous Diagnosis",get:r=>r.medHistory?.previousDiagnosis||"--"},
    {label:"Current Medications",get:r=>r.medHistory?.currentMedications||"--"},
    {label:"Known Allergies",get:r=>r.medHistory?.knownAllergies||"--"},
    {label:"Chronic Conditions",get:r=>r.medHistory?.chronicConditions||"--"},
    {label:"Past Surgeries",get:r=>r.medHistory?.pastSurgeries||"--"},
    {label:"Family History",get:r=>r.medHistory?.familyHistory||"--"},
    {label:"Smoking",get:r=>r.medHistory?.smokingStatus||"--"},
    {label:"Alcohol",get:r=>r.medHistory?.alcoholUse||"--"},
    {label:"Notes",get:r=>r.medHistory?.notes||"--"},
  ];

  return (
    <div>
      <div style={{ display:"flex",gap:12,flexWrap:"wrap",marginBottom:18 }}>
        <StatCard icon="📋" label="With Medical History" value={withMed.length} sub={"of "+all.length+" total"} color={T.laxmi}/>
        <StatCard icon="🏥" label="Laxmi Nagar" value={withMed.filter(p=>p._branch==="laxmi").length} color={T.laxmi}/>
        <StatCard icon="🏨" label="Raya" value={withMed.filter(p=>p._branch==="raya").length} color={T.raya}/>
      </div>
      <div style={{ display:"flex",gap:8,marginBottom:12,alignItems:"center" }}>
        <FilterSelect value={branch} onChange={setBranch} options={[["all","All Branches"],["laxmi","Lakshmi Nagar"],["raya","Raya"]]}/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or UHID..."
          style={{ marginLeft:"auto",padding:"7px 13px",borderRadius:8,border:`1px solid ${T.border2}`,
            background:T.card,color:T.white,fontSize:13,outline:"none",width:240 }}/>
        <XlsBtn onClick={()=>exportXLSX(rows,MCOLS,"medical_history.xlsx")}/>
      </div>
      <div style={{ ...cardStyle(T),padding:0,overflow:"hidden" }}>
        <table style={{ width:"100%",borderCollapse:"collapse" }}>
          <thead><tr>{["UHID","Patient","Branch","Doctor","Prev Diagnosis","Medications","Allergies","Chronic","Notes",""].map(h=><TH key={h} h={h}/>)}</tr></thead>
          <tbody>
            {rows.length===0&&<tr><td colSpan={10} style={{ padding:48,textAlign:"center",color:T.dim }}>No medical history records</td></tr>}
            {rows.map((p,i)=>(
              <tr key={i} style={{ borderBottom:`1px solid ${T.border}`,background:i%2===0?T.card:T.surface }}>
                <td style={{ padding:"9px 12px",fontSize:12,fontWeight:700,color:bColor(p._branch, T) }}>{p.uhid}</td>
                <td style={{ padding:"9px 12px",fontSize:13,fontWeight:600,color:T.white }}>{p.name}</td>
                <td style={{ padding:"9px 12px" }}><Pill color={bColor(p._branch, T)}>{bName(p._branch)}</Pill></td>
                <td style={{ padding:"9px 12px",fontSize:12,color:T.dim }}>{p.doctor}</td>
                {["previousDiagnosis","currentMedications","knownAllergies","chronicConditions","notes"].map(k=>(
                  <td key={k} style={{ padding:"9px 12px",fontSize:11,color:T.dim,maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{p.medHistory?.[k]||"--"}</td>
                ))}
                <td style={{ padding:"9px 12px" }}><button onClick={()=>setModal(p)} style={{ padding:"4px 10px",borderRadius:6,background:T.laxmi+"20",color:T.laxmi,border:`1px solid ${T.laxmi}40`,fontSize:11,fontWeight:700,cursor:"pointer" }}>Full View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PatientModal p={modal} onClose={()=>setModal(null)}/>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB 8 — DISCHARGE SUMMARY
══════════════════════════════════════════════════════════════ */
function DischargeTab({ all }) {
  const T = useT();
  const disch = all.filter(p=>p.dischargeDate);
  const [branch, setBranch] = useState("all");
  const [modal, setModal]   = useState(null);
  const rows = branch==="all" ? disch : disch.filter(p=>p._branch===branch);

  const DCOLS = [
    {label:"UHID",key:"uhid"},{label:"Patient",key:"name"},{label:"Branch",get:r=>bName(r._branch)},
    {label:"Doctor",key:"doctor"},{label:"Department",key:"department"},{label:"Diagnosis",key:"diagnosis"},
    {label:"Adm Date",get:r=>fmt(r.admDate)},{label:"Discharge Date (DOD)",get:r=>fmt(r.dischargeDate)},
    {label:"Status",key:"dischargeStatus"},{label:"Grand Total",key:"grand"},{label:"Paid",key:"paid"},
    {label:"Pending",key:"pending"},{label:"Type",key:"admType"},
  ];

  return (
    <div>
      <div style={{ display:"flex",gap:12,flexWrap:"wrap",marginBottom:18 }}>
        <StatCard icon="📋" label="Total Discharges" value={disch.length} color={T.dim}/>
        <StatCard icon="🏥" label="Laxmi Nagar" value={disch.filter(p=>p._branch==="laxmi").length} color={T.laxmi}/>
        <StatCard icon="🏨" label="Raya" value={disch.filter(p=>p._branch==="raya").length} color={T.raya}/>
        <StatCard icon="💰" label="Revenue" value={inr(disch.reduce((s,p)=>s+p.grand,0))} color={T.amber}/>
      </div>
      <div style={{ display:"flex",gap:8,marginBottom:12,alignItems:"center" }}>
        <FilterSelect value={branch} onChange={setBranch} options={[["all","All Branches"],["laxmi","Lakshmi Nagar"],["raya","Raya"]]}/>
        <XlsBtn onClick={()=>exportXLSX(rows,DCOLS,"discharge_summary.xlsx")}/>
      </div>
      <div style={{ ...cardStyle(T),padding:0,overflow:"hidden" }}>
        <table style={{ width:"100%",borderCollapse:"collapse" }}>
          <thead><tr>{["UHID","Patient","Branch","Type","Doctor","Department","Admitted","DOD","Diagnosis","Status","Billed",""].map(h=><TH key={h} h={h}/>)}</tr></thead>
          <tbody>
            {rows.length===0&&<tr><td colSpan={12} style={{ padding:48,textAlign:"center",color:T.dim }}>No discharges yet</td></tr>}
            {rows.map((p,i)=>(
              <tr key={i} style={{ borderBottom:`1px solid ${T.border}`,background:i%2===0?T.card:T.surface }}>
                <td style={{ padding:"9px 12px",fontSize:12,fontWeight:700,color:bColor(p._branch, T) }}>{p.uhid}</td>
                <td style={{ padding:"9px 12px",fontSize:13,fontWeight:600,color:T.white }}>{p.name}</td>
                <td style={{ padding:"9px 12px" }}><Pill color={bColor(p._branch, T)}>{bName(p._branch)}</Pill></td>
                <td style={{ padding:"9px 12px" }}><Pill color={p.admType==="Cash"?T.green:T.amber}>{p.admType}</Pill></td>
                <td style={{ padding:"9px 12px",fontSize:12,color:T.dim }}>{p.doctor}</td>
                <td style={{ padding:"9px 12px",fontSize:12,color:T.dim }}>{p.department}</td>
                <td style={{ padding:"9px 12px",fontSize:11,color:T.dim }}>{fmt(p.admDate)}</td>
                <td style={{ padding:"9px 12px",fontSize:11,color:T.green,fontWeight:700 }}>{fmt(p.dischargeDate)}</td>
                <td style={{ padding:"9px 12px",fontSize:11,color:T.dim,maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{p.diagnosis}</td>
                <td style={{ padding:"9px 12px" }}><Badge color={p.dischargeStatus==="Recovered"?T.green:T.amber}>{p.dischargeStatus}</Badge></td>
                <td style={{ padding:"9px 12px",fontSize:13,fontWeight:800,color:T.amber }}>{inr(p.grand)}</td>
                <td style={{ padding:"9px 12px" }}><button onClick={()=>setModal(p)} style={{ padding:"4px 10px",borderRadius:6,background:T.laxmi+"20",color:T.laxmi,border:`1px solid ${T.laxmi}40`,fontSize:11,fontWeight:700,cursor:"pointer" }}>View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PatientModal p={modal} onClose={()=>setModal(null)}/>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB 9 — REPORTS
══════════════════════════════════════════════════════════════ */
function ReportsTab({ all }) {
  const T = useT();
  const [branch, setBranch] = useState("all");
  const base = branch==="all" ? all : all.filter(p=>p._branch===branch);

  const REPORTS = [
    { title:"Complete Patient Register", icon:"📋", desc:"All admissions with every detail", rows:base,
      cols:PT_COLS, file:"complete_register.xlsx" },
    { title:"Revenue Report", icon:"💰", desc:"All billing and payment breakdown", rows:base,
      cols:[{label:"UHID",key:"uhid"},{label:"Patient",key:"name"},{label:"Branch",get:r=>bName(r._branch)},
        {label:"Type",key:"admType"},{label:"Doctor",key:"doctor"},{label:"Date",get:r=>fmt(r.admDate)},
        {label:"Subtotal",key:"subtotal"},{label:"Discount",key:"discount"},{label:"Advance",key:"advance"},
        {label:"Grand",key:"grand"},{label:"Paid",key:"paid"},{label:"Pending",key:"pending"},
        {label:"Mode",key:"paymentMode"},{label:"TPA",key:"tpa"}], file:"revenue_report.xlsx" },
    { title:"Discharge Summary", icon:"🚪", desc:"All discharged patients with DOD",
      rows:base.filter(p=>p.dischargeDate),
      cols:[{label:"UHID",key:"uhid"},{label:"Patient",key:"name"},{label:"Branch",get:r=>bName(r._branch)},
        {label:"Doctor",key:"doctor"},{label:"Diagnosis",key:"diagnosis"},
        {label:"Adm Date",get:r=>fmt(r.admDate)},{label:"DOD",get:r=>fmt(r.dischargeDate)},
        {label:"Status",key:"dischargeStatus"},{label:"Grand",key:"grand"}], file:"discharge_summary.xlsx" },
    { title:"Cash Patients Report", icon:"💵", desc:"Only cash payment patients",
      rows:base.filter(p=>p.admType==="Cash"),
      cols:[{label:"UHID",key:"uhid"},{label:"Patient",key:"name"},{label:"Branch",get:r=>bName(r._branch)},
        {label:"Doctor",key:"doctor"},{label:"Date",get:r=>fmt(r.admDate)},
        {label:"Grand",key:"grand"},{label:"Paid",key:"paid"},{label:"Pending",key:"pending"},
        {label:"Mode",key:"paymentMode"}], file:"cash_patients.xlsx" },
    { title:"Cashless and TPA Report", icon:"🏦", desc:"Insurance and TPA patients only",
      rows:base.filter(p=>p.admType==="Cashless"),
      cols:[{label:"UHID",key:"uhid"},{label:"Patient",key:"name"},{label:"Branch",get:r=>bName(r._branch)},
        {label:"Doctor",key:"doctor"},{label:"TPA",key:"tpa"},{label:"TPA Card",key:"tpaCard"},
        {label:"Date",get:r=>fmt(r.admDate)},{label:"Grand",key:"grand"},{label:"Paid",key:"paid"}],
      file:"cashless_tpa.xlsx" },
    { title:"Pending Dues Report", icon:"⚠️", desc:"Patients with outstanding balance",
      rows:base.filter(p=>p.pending>0),
      cols:[{label:"UHID",key:"uhid"},{label:"Patient",key:"name"},{label:"Phone",key:"phone"},
        {label:"Branch",get:r=>bName(r._branch)},{label:"Doctor",key:"doctor"},
        {label:"Grand",key:"grand"},{label:"Paid",key:"paid"},{label:"Pending",key:"pending"},
        {label:"Mode",key:"paymentMode"}], file:"pending_dues.xlsx" },
  ];

  return (
    <div>
      <div style={{ display:"flex",gap:8,marginBottom:20 }}>
        <FilterSelect value={branch} onChange={setBranch} options={[["all","All Branches"],["laxmi","Lakshmi Nagar"],["raya","Raya"]]}/>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14 }}>
        {REPORTS.map(r=>(
          <div key={r.title} style={{ ...cardStyle(T),display:"flex",flexDirection:"column",gap:12 }}>
            <div style={{ fontSize:30 }}>{r.icon}</div>
            <div style={{ fontSize:14,fontWeight:800,color:T.white }}>{r.title}</div>
            <div style={{ fontSize:12,color:T.dim,flex:1 }}>{r.desc}</div>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <span style={{ fontSize:13,fontWeight:700,color:T.amber }}>{r.rows.length} records</span>
              <XlsBtn onClick={()=>exportXLSX(r.rows,r.cols,r.file)}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB 10 — ADMIN MANAGEMENT
══════════════════════════════════════════════════════════════ */
function AdminsTab() {
  const T = useT();
  const base = USERS||[];
  const [users, setUsers] = useState(base);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ id:"", name:"", password:"", confirmPassword:"", role:"admin", branch:"laxmi" });
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [showAdminConfirm, setShowAdminConfirm] = useState(false);
  const [passErr, setPassErr] = useState("");
  const sf = k => e => { setForm(f=>({...f,[k]:e.target.value})); setPassErr(""); };
  const rc = r => r==="superadmin"?T.amber:r==="admin"?T.laxmi:T.green;

  const create = async () => {
    if (!form.id || !form.name || !form.password) { 
      toast.error("Fill all fields"); 
      return; 
    }
    
    // Split the full name into first and last name for Django
    const nameParts = form.name.split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : ".";

    // 🌟 FIXED: Map the frontend branch IDs to your Django backend choices
    const branchCode = form.branch === "laxmi" ? "LNM" : "RYM";

    // Format data to match your Django UserManagementSerializer
    const payload = {
      username: form.id,
      first_name: firstName,
      last_name: lastName,
      password: form.password,
      confirm_password: form.password, 
      role: form.role,
      branch: branchCode, // 🌟 Now sending 'LNM' or 'RYM' instead of 'laxmi'
      email: `${form.id}@sangihospital.com` 
    };

    try {
      await apiService.createUser(payload);
      toast.success("Admin created successfully in database!");
      setModal(false);
      setForm({ id:"", name:"", password:"", role:"admin", branch:"laxmi" });
      
    } catch (error) {
      console.error("Django Error:", error.response?.data);
      
      // 🌟 Better Error Handling: Show the exact Django error in the UI
      const errData = error.response?.data;
      if (errData?.username) toast.error("Username: " + errData.username[0]);
      else if (errData?.password) toast.error("Password: " + errData.password[0]);
      else if (errData?.branch) toast.error("Branch: " + errData.branch[0]);
      else toast.error("Failed to create user. Check console.");
    }
  };

  return (
    <div>
      <div style={{ display:"flex",gap:12,flexWrap:"wrap",marginBottom:18 }}>
        <StatCard icon="👥" label="Total Users" value={users.length} color={T.laxmi}/>
        <StatCard icon="⭐" label="Super Admins" value={users.filter(u=>u.role==="superadmin").length} color={T.amber}/>
        <StatCard icon="🔑" label="Branch Admins" value={users.filter(u=>u.role==="admin").length} color={T.laxmi}/>
        <StatCard icon="👤" label="Staff" value={users.filter(u=>u.role!=="superadmin"&&u.role!=="admin").length} color={T.green}/>
      </div>
      <div style={{ display:"flex",justifyContent:"flex-end",marginBottom:12 }}>
        <button onClick={()=>setModal(true)} style={{ padding:"9px 22px",borderRadius:9,background:T.laxmi,
          color:"#000",border:"none",fontWeight:800,fontSize:13,cursor:"pointer" }}>+ Create Admin</button>
      </div>
      <div style={{ ...cardStyle(T),padding:0,overflow:"hidden" }}>
        <table style={{ width:"100%",borderCollapse:"collapse" }}>
          <thead><tr>{["Username","Full Name","Role","Branch","Locations","Status"].map(h=><TH key={h} h={h}/>)}</tr></thead>
          <tbody>
            {users.map((u,i)=>(
              <tr key={i} style={{ borderBottom:`1px solid ${T.border}`,background:i%2===0?T.card:T.surface }}>
                <td style={{ padding:"10px 12px",fontSize:12,fontFamily:"monospace",color:T.laxmi }}>{u.id}</td>
                <td style={{ padding:"10px 12px",fontSize:13,fontWeight:600,color:T.white }}>{u.name}</td>
                <td style={{ padding:"10px 12px" }}><Pill color={rc(u.role)}>{u.role}</Pill></td>
                <td style={{ padding:"10px 12px" }}>{u.branch?<Pill color={bColor(u.branch, T)}>{bName(u.branch)}</Pill>:<span style={{ color:T.dim }}>All Branches</span>}</td>
                <td style={{ padding:"10px 12px",fontSize:12,color:T.dim }}>{(u.locations||[]).join(", ")||"--"}</td>
                <td style={{ padding:"10px 12px" }}><Badge color={T.green}>Active</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:2000,
          display:"flex",alignItems:"center",justifyContent:"center" }}>
          <div style={{ background:T.surface,borderRadius:16,padding:30,width:430,
            border:`1px solid ${T.border}`,boxShadow:SD }}>
            <div style={{ fontSize:16,fontWeight:800,color:T.white,marginBottom:20 }}>Create New Admin</div>
            {[["Username / ID","id","text","admin_xyz"],["Full Name","name","text","Full Name"],["Password","password",showAdminPass?"text":"password","••••••••"],["Confirm Password","confirmPassword",showAdminConfirm?"text":"password","Confirm password"]].map(([lbl,k,type,ph])=>(
              <div key={k} style={{ marginBottom:12 }}>
                <div style={{ fontSize:11,color:T.dim,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",marginBottom:4 }}>{lbl}</div>
                <div style={{ position:"relative" }}>
                  <input type={type} placeholder={ph} value={form[k]||""} onChange={sf(k)}
                    style={{ width:"100%",padding:"9px 40px 9px 13px",borderRadius:8,border:`1px solid ${T.border2}`,
                      background:T.card,color:T.white,fontSize:13,outline:"none",boxSizing:"border-box" }}/>
                  {(k==="password"||k==="confirmPassword") && (
                    <button type="button" onClick={()=>k==="password"?setShowAdminPass(p=>!p):setShowAdminConfirm(p=>!p)}
                      style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",
                        background:"none",border:"none",cursor:"pointer",color:"#9ca3af",fontSize:11,fontWeight:600 }}>
                      {k==="password"?(showAdminPass?"HIDE":"SHOW"):(showAdminConfirm?"HIDE":"SHOW")}
                    </button>
                  )}
                </div>
                {k==="confirmPassword" && passErr && (
                  <div style={{ color:"#ef4444",fontSize:12,marginTop:4 }}>{passErr}</div>
                )}
              </div>
            ))}
            {[["Role","role",[["admin","Admin"],["employee","Employee"]]],["Branch","branch",[["laxmi","Lakshmi Nagar"],["raya","Raya"]]]].map(([lbl,k,opts])=>(
              <div key={k} style={{ marginBottom:12 }}>
                <div style={{ fontSize:11,color:T.dim,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",marginBottom:4 }}>{lbl}</div>
                <select value={form[k]} onChange={sf(k)} style={{ width:"100%",padding:"9px 13px",borderRadius:8,
                  border:`1px solid ${T.border2}`,background:T.card,color:T.white,fontSize:13,outline:"none" }}>
                  {opts.map(([v,l])=><option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            ))}
            <div style={{ display:"flex",gap:8,justifyContent:"flex-end",marginTop:18 }}>
              <button onClick={()=>setModal(false)} style={{ padding:"9px 18px",borderRadius:8,
                background:"transparent",border:`1px solid ${T.border2}`,color:T.dim,fontWeight:700,cursor:"pointer" }}>Cancel</button>
              <button onClick={create} style={{ padding:"9px 18px",borderRadius:8,
                background:T.laxmi,color:"#000",border:"none",fontWeight:800,cursor:"pointer" }}>Create Admin</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB 11 — DEPARTMENTS
══════════════════════════════════════════════════════════════ */
function DepartmentsTab({ all }) {
  const T = useT();
  const map = {};
  all.forEach(p => {
    const key = p._branch+"__"+p.department;
    if (!map[key]) map[key] = { branch:p._branch, dept:p.department, patients:0, revenue:0, doctors:new Set() };
    map[key].patients++;
    map[key].revenue += p.grand;
    if (p.doctor&&p.doctor!=="--") map[key].doctors.add(p.doctor);
  });
  const depts = Object.values(map).map(d=>({...d,doctors:[...d.doctors]}));
  const allDepts = new Set(all.map(p=>p.department)).size;

  return (
    <div>
      <div style={{ display:"flex",gap:12,flexWrap:"wrap",marginBottom:20 }}>
        <StatCard icon="🏢" label="Total Departments" value={allDepts} color={T.laxmi}/>
        <StatCard icon="🏥" label="Laxmi Nagar Depts" value={new Set(all.filter(p=>p._branch==="laxmi").map(p=>p.department)).size} color={T.laxmi}/>
        <StatCard icon="🏨" label="Raya Depts" value={new Set(all.filter(p=>p._branch==="raya").map(p=>p.department)).size} color={T.raya}/>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14 }}>
        {depts.map((d,i)=>{
          const col = bColor(d.branch, T);
          return (
            <div key={i} style={{ ...cardStyle(T),borderTop:`3px solid ${col}` }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14 }}>
                <div>
                  <div style={{ fontSize:15,fontWeight:800,color:T.white }}>{d.dept}</div>
                  <div style={{ marginTop:5 }}><Pill color={col}>{bName(d.branch)}</Pill></div>
                </div>
                <div style={{ fontSize:24 }}>🏢</div>
              </div>
              {/* Corrected Department Stats */}
              <div style={{ display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${T.border}` }}>
                <span style={{ fontSize:12,color:T.dim }}>Total Patients</span>
                <span style={{ fontSize:13,fontWeight:700,color:T.white }}>{d.patients}</span>
              </div>
              <div style={{ display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${T.border}` }}>
                <span style={{ fontSize:12,color:T.dim }}>Doctors</span>
                <span style={{ fontSize:13,fontWeight:700,color:T.white }}>{d.doctors.length}</span>
              </div>
              <div style={{ display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${T.border}` }}>
                <span style={{ fontSize:12,color:T.dim }}>Total Revenue</span>
                <span style={{ fontSize:13,fontWeight:700,color:T.white }}>{inr(d.revenue)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT EXPORT
══════════════════════════════════════════════════════════════ */
export default function SuperAdminDashboard({ db={}, printRequests=[], onApprovePrint, onLogout }) {
  const { isDark, toggle } = useTheme();
  // eslint-disable-next-line no-global-assign
  T = isDark ? T_DARK : T_LIGHT;
  const [tab, setTab] = useState("dashboard");
  const [viewLoc, setViewLoc] = useState("all");
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef();

  const all   = useMemo(()=>flattenDB(db,"all"),  [db]);
  const laxmi = useMemo(()=>flattenDB(db,"laxmi"),[db]);
  const raya  = useMemo(()=>flattenDB(db,"raya"), [db]);
  const pending = (printRequests||[]).length;

  useEffect(() => {
    const handler = e => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const NAV = [
    { section:"Analytics" },
    { id:"dashboard",    icon:"📊", label:"Dashboard" },
    { section:"Branches" },
    { id:"laxmi",        icon:"🏥", label:"Lakshmi Nagar" },
    { id:"raya",         icon:"🏨", label:"Raya" },
    { id:"allpatients",  icon:"👥", label:"All Patients" },
    { section:"Finance" },
    { id:"billing",      icon:"💳", label:"Billing and Invoices" },
    { id:"invoices",     icon:"📬", label:"Print Approvals", badge:pending||null },
    { section:"Medical" },
    { id:"medical",      icon:"🩺", label:"Medical History" },
    { id:"discharge",    icon:"🚪", label:"Discharge Summary" },
    { section:"Management" },
    { id:"reports",      icon:"📥", label:"Reports and Export" },
    { id:"admins",       icon:"👤", label:"Admin Management" },
    { id:"departments",  icon:"🏢", label:"Departments" },
  ];

  const activeLabel = NAV.find(n=>n.id===tab);

  return (
    <TC.Provider value={T}>
    <div style={{ minHeight:"100vh",background:T.bg,fontFamily:"'Segoe UI',system-ui,sans-serif" }}>

      {/* SIDEBAR */}
      <div style={{ width:228,minHeight:"100vh",background:T.sidebar,display:"flex",flexDirection:"column",
        position:"fixed",top:0,left:0,zIndex:50,borderRight:`1px solid ${T.border}` }}>

        <div style={{ padding:"18px 14px 14px",borderBottom:`1px solid ${T.border}` }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <img src="/app_icon.png" alt="logo" style={{ width:36,height:36,borderRadius:10,
              objectFit:"cover" }}/>
            <div>
              <div style={{ color:T.white,fontWeight:800,fontSize:13 }}>Sangi Hospital</div>
              <div style={{ color:T.dim,fontSize:10,textTransform:"uppercase",letterSpacing:".1em" }}>Super Admin Portal</div>
            </div>
          </div>
        </div>

        <div style={{ flex:1,overflowY:"auto",padding:"6px 6px" }}>
          {NAV.map((n,i)=>{
            if (n.section) return (
              <div key={i} style={{ fontSize:10,color:T.dimmer,fontWeight:700,textTransform:"uppercase",
                letterSpacing:".1em",padding:"12px 10px 4px" }}>{n.section}</div>
            );
            const active = tab===n.id;
            return (
              <button key={n.id} onClick={()=>setTab(n.id)} style={{
                display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:9,
                border:"none",cursor:"pointer",width:"100%",textAlign:"left",marginBottom:1,
                background:active?"rgba(56,189,248,.12)":"transparent",
                color:active?T.laxmi:T.dim,fontWeight:active?700:400,fontSize:13,
                borderLeft:active?`3px solid ${T.laxmi}`:"3px solid transparent",
              }}>
                <span style={{ fontSize:15 }}>{n.icon}</span>
                <span style={{ flex:1 }}>{n.label}</span>
                {n.badge && <span style={{ background:T.amber,color:"#000",borderRadius:10,
                  padding:"1px 7px",fontSize:10,fontWeight:900 }}>{n.badge}</span>}
              </button>
            );
          })}
        </div>

        <div style={{ padding:"10px",borderTop:`1px solid ${T.border}` }}>
          <div style={{ display:"flex",alignItems:"center",gap:10,padding:"9px 11px",
            background:"rgba(255,255,255,.04)",borderRadius:9 }}>
            <div style={{ width:30,height:30,borderRadius:8,background:T.laxmi+"30",
              display:"flex",alignItems:"center",justifyContent:"center",color:T.laxmi,fontWeight:900,fontSize:13 }}>S</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12,color:T.white,fontWeight:700 }}>Super Admin</div>
              <div style={{ fontSize:10,color:T.dim }}>All branches</div>
            </div>
            
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ marginLeft:228,flex:1,minHeight:"100vh",overflowX:"hidden" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 28px",borderBottom:`1px solid ${T.border}`,background:T.sidebar,marginBottom:0,position:"sticky",top:0,zIndex:40 }}><div style={{ fontSize:13,fontWeight:700,color:T.white }}>{activeLabel?.icon} {activeLabel?.label}</div><div style={{ display:"flex",alignItems:"center",gap:12 }}><button onClick={toggle} style={{ background:"transparent",border:`1px solid ${T.border}`,color:T.dim,padding:"5px 12px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600 }}>{isDark?"☀ Light":"☾ Dark"}</button><div style={{ display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.05)",borderRadius:20,padding:"3px 6px 3px 12px",border:`1px solid ${T.border}` }}><span style={{ fontSize:11,color:T.dim,fontWeight:500 }}>Super Admin</span><div style={{ width:28,height:28,borderRadius:"50%",background:T.laxmi+"30",display:"flex",alignItems:"center",justifyContent:"center",color:T.laxmi,fontWeight:900,fontSize:12 }}>S</div></div><button onClick={onLogout} style={{ background:"transparent",border:`1px solid ${T.border}`,color:T.dim,padding:"5px 13px",borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:600,display:"flex",alignItems:"center",gap:5 }}>↪ Logout</button></div></div>
      <div style={{ marginBottom:18,marginTop:18 }}>
          <div style={{ fontSize:12,color:T.dim }}>
            {new Date().toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}
            {" · "}{all.length} total records · {laxmi.length} Laxmi Nagar · {raya.length} Raya
          </div>
        </div>

        <div style={{ padding:"24px 28px" }}>
        {tab==="dashboard"   && <DashboardTab all={all} laxmi={laxmi} raya={raya}/>}
        {tab==="laxmi"       && <BranchTab pts={laxmi} branch="laxmi"/>}
        {tab==="raya"        && <BranchTab pts={raya} branch="raya"/>}
        {tab==="allpatients" && <AllPatientsTab all={all}/>}
        {tab==="billing"     && <BillingTab all={all}/>}
        {tab==="invoices"    && <InvoicesTab printRequests={printRequests} onApprovePrint={onApprovePrint}/>}
        {tab==="medical"     && <MedicalTab all={all}/>}
        {tab==="discharge"   && <DischargeTab all={all}/>}
        {tab==="reports"     && <ReportsTab all={all}/>}
        {tab==="admins"      && <AdminsTab/>}
        {tab==="departments" && <DepartmentsTab all={all}/>}
      </div>
      </div>
    </div>
    </TC.Provider>
  );
}