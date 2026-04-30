import { useState, useMemo, useEffect, useRef, createContext, useContext } from "react";
import { useTheme } from "../context/ThemeContext";
import * as XLSX from "xlsx";
import { apiService } from "../services/apiService";
import { toast } from "react-toastify";

/* ══════════════════════════════════════════════════════════════
   DESIGN TOKENS & HELPERS  —  Ocean Blue Theme
══════════════════════════════════════════════════════════════ */
const T_DARK = {
  bg:      "#0B1829",
  surface: "#0F2035",
  card:    "#132641",
  card2:   "#172E4D",
  border:  "#1C3A5E",
  border2: "#245075",
  laxmi:   "#38BDF8",
  raya:    "#60A5FA",
  green:   "#34D399",
  amber:   "#FBBF24",
  red:     "#F87171",
  white:   "#E2F0FB",
  dim:     "#6BA3C8",
  dimmer:  "#1A3A58",
  sidebar: "#091522",
};
const T_LIGHT = {
  bg:      "#EEF5FB",
  surface: "#F7FBFF",
  card:    "#FFFFFF",
  card2:   "#F0F7FF",
  border:  "#C8DFF2",
  border2: "#A3C8E8",
  laxmi:   "#1A6FAB",
  raya:    "#2563EB",
  green:   "#0D7A55",
  amber:   "#B45309",
  red:     "#C0392B",
  white:   "#0F2B4A",
  dim:     "#3E6A8A",
  dimmer:  "#A8C8E0",
  sidebar: "#1B3A5C",
};
let T = T_DARK;
const TC = createContext(T_DARK);
const useT = () => useContext(TC);

const SD = "0 4px 32px rgba(0,0,0,.5)";
const cardStyle = (t) => ({ background: t.card, borderRadius: 14, padding: 20, boxShadow: SD });
const bColor = (loc, t) => loc === "laxmi" ? t.laxmi : t.raya;
const bName  = loc => loc === "laxmi" ? "Lakshmi Nagar" : "Raya";
const fmt    = d  => { try { const dt=new Date(d); return isNaN(dt)?"--":dt.toLocaleDateString("en-IN"); } catch { return "--"; } };
const inr    = v  => "Rs." + Number(v||0).toLocaleString("en-IN");

/* ── Role helpers ── */
const ROLE_LABELS = {
  office_admin:  "Office Admin",
  branch_admin:  "Branch Admin",
  superadmin:    "Super Admin",
};
const roleColor = (role, t) => {
  if (role === "superadmin")   return t.amber;
  if (role === "office_admin") return t.laxmi;
  if (role === "branch_admin") return t.raya;
  return t.green;
};
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
    background:T.green, color:"#fff", fontSize:12, fontWeight:800, cursor:"pointer", whiteSpace:"nowrap" }}>
    {label||"Download Excel"}
  </button>;
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

/* ── Star Rating display ── */
function StarRating({ rating, max = 5, size = 16 }) {
  const T = useT();
  return (
    <span style={{ display:"inline-flex", gap:2 }}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} style={{ fontSize: size, color: i < rating ? "#FBBF24" : T.dimmer, lineHeight:1 }}>
          {i < rating ? "★" : "☆"}
        </span>
      ))}
    </span>
  );
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

          {p.dischargeStatus && p.dischargeStatus !== "Admitted" && (
            <div style={{ ...cardStyle(T), marginBottom: 18, borderLeft: `4px solid ${T.laxmi}` }}>
              <STitle action={
                <div style={{ display: "flex", gap: 8 }}>
                  {!docTemplate ? (
                    <button onClick={handleLoadDocument} style={{ padding: "5px 12px", borderRadius: 7, background: T.laxmi, color: "#fff", border: "none", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                      {docLoading ? "Loading..." : "Prepare Official Document"}
                    </button>
                  ) : (
                    <>
                      <button onClick={() => setDocTemplate(null)} style={{ padding: "5px 12px", borderRadius: 7, background: "transparent", border: `1px solid ${T.border2}`, color: T.dim, fontSize: 12, cursor: "pointer" }}>Close Editor</button>
                      <button onClick={handleSaveDocument} style={{ padding: "5px 12px", borderRadius: 7, background: T.green, color: "#fff", border: "none", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>Save Document</button>
                      <button onClick={() => window.open(`http://localhost:8000/api/patients/${p.uhid}/admissions/${p.admNo}/dynamic-summary/print/`, "_blank")} style={{ padding: "5px 12px", borderRadius: 7, background: T.white, color: "#fff", border: "none", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>Print Document</button>
                    </>
                  )}
                </div>
              }>Official Discharge Document ({p.dischargeStatus})</STitle>
              {docTemplate && Array.isArray(docTemplate.sections) && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
                  {docTemplate.sections.map((sec, index) => {
                    if (sec.type === "textarea") return (
                      <div key={sec.key}>
                        <div style={{ fontSize: 11, color: T.dim, fontWeight: 700, marginBottom: 4 }}>{sec.label}</div>
                        <textarea value={sec.value} onChange={e => handleSectionUpdate(index, e.target.value)} rows={3} style={{ width: "100%", padding: "10px", borderRadius: 8, background: T.bg, border: `1px solid ${T.border2}`, color: T.white, fontSize: 13, outline: "none", resize: "vertical" }} />
                      </div>
                    );
                    if (sec.type === "text") return (
                      <div key={sec.key}>
                        <div style={{ fontSize: 11, color: T.dim, fontWeight: 700, marginBottom: 4 }}>{sec.label}</div>
                        <input type="text" value={sec.value} onChange={e => handleSectionUpdate(index, e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: 8, background: T.bg, border: `1px solid ${T.border2}`, color: T.white, fontSize: 13, outline: "none" }} />
                      </div>
                    );
                    if (sec.type === "vitals_grid") return (
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
                    return null;
                  })}
                </div>
              )}
            </div>
          )}

          <div style={{ ...cardStyle(T),marginBottom:18 }}>
            <STitle action={
              <div style={{ display:"flex",gap:8 }}>
                {editSvcs && <button onClick={()=>setEditSvcs(null)} style={{ padding:"5px 12px",borderRadius:7,
                  background:"transparent",border:`1px solid ${T.border2}`,color:T.dim,fontSize:12,cursor:"pointer" }}>Reset</button>}
                <button onClick={()=>alert("Save connected to your backend")} style={{ padding:"5px 12px",borderRadius:7,
                  background:T.green,color:"#fff",border:"none",fontSize:12,fontWeight:800,cursor:"pointer" }}>Save Changes</button>
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
   PATIENT TABLE (PTable)
══════════════════════════════════════════════════════════════ */
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
                background:T.green,color:"#fff",border:"none",fontWeight:800,fontSize:13,cursor:"pointer" }}>Approve and Print</button>
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

  const [users,       setUsers]       = useState([]);
  const [subTab,      setSubTab]      = useState("all");
  const [createModal, setCreateModal] = useState(false);
  const [editModal,   setEditModal]   = useState(null);
  const [confirmModal,setConfirmModal]= useState(null);
  const [search,      setSearch]      = useState("");

  const EMPTY_FORM = { id:"", name:"", password:"", confirmPassword:"", role:"office_admin", branch:"laxmi" };
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [editForm,    setEditForm]    = useState({});
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showEditPass,setShowEditPass]= useState(false);
  const [passErr,     setPassErr]     = useState("");
  const [loading,     setLoading]     = useState(false);

  const fetchUsers = async () => {
    try {
      const data = await apiService.getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setUsers([]);
    }
  };
  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.id?.toLowerCase().includes(search.toLowerCase()) ||
      u.role?.toLowerCase().includes(search.toLowerCase());
    if (subTab === "active")      return matchSearch && u.isActive !== false;
    if (subTab === "deactivated") return matchSearch && u.isActive === false;
    return matchSearch;
  });

  const officeAdmins = users.filter(u => u.role === "office_admin");
  const branchAdmins = users.filter(u => u.role === "branch_admin");
  const activeCount  = users.filter(u => u.isActive !== false).length;
  const deactCount   = users.filter(u => u.isActive === false).length;

  const sf  = k => e => { setForm(f=>({...f,[k]:e.target.value})); setPassErr(""); };
  const sef = k => e => setEditForm(f=>({...f,[k]:e.target.value}));

  const handleRoleChange = val =>
    setForm(f => ({ ...f, role: val, branch: val === "office_admin" ? "laxmi" : f.branch }));

  const handleCreate = async () => {
    if (!form.id || !form.name || !form.password) { toast.error("Fill all required fields"); return; }
    if (form.password !== form.confirmPassword)    { setPassErr("Passwords do not match"); return; }
    setLoading(true);
    const nameParts  = form.name.split(" ");
    const branchCode = form.role === "office_admin" ? "BOTH" : (form.branch === "laxmi" ? "LNM" : "RYM");
    const payload = {
      username: form.id,
      first_name: nameParts[0],
      last_name:  nameParts.length > 1 ? nameParts.slice(1).join(" ") : ".",
      password: form.password,
      confirm_password: form.password,
      role: form.role,
      branch: branchCode,
      email: `${form.id}@sangihospital.com`,
    };
    try {
      await apiService.createUser(payload);
      toast.success("User created successfully!");
      setCreateModal(false);
      setForm(EMPTY_FORM);
      fetchUsers();
    } catch (error) {
      const errData = error.response?.data;
      if (errData?.username) toast.error("Username: " + errData.username[0]);
      else if (errData?.password) toast.error("Password: " + errData.password[0]);
      else toast.error("Failed to create user.");
    } finally { setLoading(false); }
  };

  const openEdit = (u) => {
    setEditForm({
      name:     u.name   || "",
      role:     u.role   || "branch_admin",
      branch:   u.branch || "laxmi",
      newPass:  "",
      confirmNewPass: "",
    });
    setEditModal(u);
  };

  const handleSaveEdit = async () => {
    if (!editForm.name) { toast.error("Name cannot be empty"); return; }
    if (editForm.newPass && editForm.newPass !== editForm.confirmNewPass) {
      toast.error("New passwords do not match"); return;
    }
    setLoading(true);
    const nameParts  = editForm.name.split(" ");
    const branchCode = editForm.role === "office_admin" ? "BOTH" : (editForm.branch === "laxmi" ? "LNM" : "RYM");
    const payload = {
      first_name:  nameParts[0],
      last_name:   nameParts.length > 1 ? nameParts.slice(1).join(" ") : ".",
      role:        editForm.role,
      branch:      branchCode,
      ...(editForm.newPass ? { password: editForm.newPass, confirm_password: editForm.newPass } : {}),
    };
    try {
      await apiService.updateUser(editModal.id, payload);
      toast.success("User updated successfully!");
      setEditModal(null);
      fetchUsers();
    } catch (err) {
      toast.error("Failed to update user.");
    } finally { setLoading(false); }
  };

  const handleToggleActive = async (u) => {
    setLoading(true);
    try {
      if (u.isActive === false) {
        await apiService.reactivateUser(u.id);
        toast.success(`${u.name} reactivated.`);
      } else {
        await apiService.deactivateUser(u.id);
        toast.success(`${u.name} deactivated.`);
      }
      setConfirmModal(null);
      fetchUsers();
    } catch {
      toast.error("Failed to update user status.");
    } finally { setLoading(false); }
  };

  const handleDelete = async (u) => {
    setLoading(true);
    try {
      await apiService.deleteUser(u.id);
      toast.success(`${u.name} permanently deleted.`);
      setConfirmModal(null);
      fetchUsers();
    } catch {
      toast.error("Failed to delete user.");
    } finally { setLoading(false); }
  };

  const handleConfirm = () => {
    if (!confirmModal) return;
    if (confirmModal.type === "delete")              handleDelete(confirmModal.user);
    else if (confirmModal.type === "deactivate")     handleToggleActive(confirmModal.user);
    else if (confirmModal.type === "reactivate")     handleToggleActive(confirmModal.user);
  };

  const inputSt = {
    width:"100%", padding:"9px 13px", borderRadius:8,
    border:`1px solid ${T.border2}`, background:T.card,
    color:T.white, fontSize:13, outline:"none", boxSizing:"border-box",
  };
  const labelSt = {
    fontSize:11, color:T.dim, fontWeight:700, textTransform:"uppercase",
    letterSpacing:".06em", marginBottom:4, display:"block",
  };
  const btnSm = (bg, c, bdr) => ({
    padding:"5px 12px", borderRadius:7, fontSize:11, fontWeight:700,
    cursor:"pointer", border:`1px solid ${bdr||bg}`, background:bg, color:c,
    whiteSpace:"nowrap",
  });

  const SubPill = ({ id, label, count }) => (
    <button onClick={()=>setSubTab(id)} style={{
      padding:"6px 16px", borderRadius:20, fontSize:12, fontWeight:700,
      cursor:"pointer", border:"none",
      background: subTab===id ? T.laxmi : T.bg,
      color:       subTab===id ? "#fff"  : T.dim,
      display:"flex", alignItems:"center", gap:6,
    }}>
      {label}
      {count !== undefined && (
        <span style={{ background: subTab===id?"rgba(255,255,255,.2)":T.dimmer, color: subTab===id?"#fff":T.dim,
          borderRadius:10, padding:"1px 7px", fontSize:10, fontWeight:900 }}>{count}</span>
      )}
    </button>
  );

  const StatusBadge = ({ u }) => u.isActive === false
    ? <Badge color={T.red}>Deactivated</Badge>
    : <Badge color={T.green}>Active</Badge>;

  return (
    <div>
      <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:18 }}>
        <StatCard icon="👥" label="Total Users"    value={users.length}        color={T.laxmi}/>
        <StatCard icon="🟢" label="Active"          value={activeCount}          sub="Can log in"          color={T.green}/>
        <StatCard icon="🔴" label="Deactivated"     value={deactCount}           sub="Blocked from login"  color={T.red}/>
        <StatCard icon="🏢" label="Office Admins"   value={officeAdmins.length}  sub="Both branches"       color={T.laxmi}/>
        <StatCard icon="🏥" label="Branch Admins"   value={branchAdmins.length}  sub="Single branch"       color={T.raya}/>
      </div>

      <div style={{ ...cardStyle(T), marginBottom:18, display:"flex", gap:24, flexWrap:"wrap", padding:"14px 20px" }}>
        <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
          <Pill color={T.laxmi}>Office Admin</Pill>
          <div style={{ fontSize:12, color:T.dim, maxWidth:240 }}>
            Single admin for <strong style={{ color:T.white }}>both branches</strong>. Has a branch switcher.
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
          <Pill color={T.raya}>Branch Admin</Pill>
          <div style={{ fontSize:12, color:T.dim, maxWidth:240 }}>
            Dedicated admin for <strong style={{ color:T.white }}>one branch only</strong>. Cannot access other branch.
          </div>
        </div>
      </div>

      <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:14, flexWrap:"wrap" }}>
        <div style={{ display:"flex", gap:4, background:T.bg, borderRadius:22, padding:3, border:`1px solid ${T.border}` }}>
          <SubPill id="all"         label="All Users"    count={users.length}  />
          <SubPill id="active"      label="Active"       count={activeCount}   />
          <SubPill id="deactivated" label="Deactivated"  count={deactCount}    />
        </div>
        <input
          value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Search name, username, role..."
          style={{ marginLeft:"auto", padding:"7px 13px", borderRadius:8, border:`1px solid ${T.border2}`,
            background:T.card, color:T.white, fontSize:12, outline:"none", width:220 }}
        />
        <button onClick={()=>setCreateModal(true)} style={{
          padding:"8px 20px", borderRadius:9, background:T.laxmi, color:"#fff",
          border:"none", fontWeight:800, fontSize:13, cursor:"pointer",
        }}>+ Create User</button>
      </div>

      <div style={{ ...cardStyle(T), padding:0, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr>{["Username","Full Name","Role","Branch Access","Status","Last Login","Actions"].map(h=><TH key={h} h={h}/>)}</tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ padding:48, textAlign:"center", color:T.dim }}>
                {search ? "No users match your search" : "No users found"}
              </td></tr>
            )}
            {filtered.map((u,i)=>(
              <tr key={i} style={{
                borderBottom:`1px solid ${T.border}`,
                background: u.isActive===false
                  ? (i%2===0 ? T.bg+"cc" : T.surface+"cc")
                  : (i%2===0 ? T.card    : T.surface),
                opacity: u.isActive===false ? 0.7 : 1,
              }}>
                <td style={{ padding:"10px 12px", fontSize:12, fontFamily:"monospace", color:T.laxmi }}>{u.id}</td>
                <td style={{ padding:"10px 12px" }}>
                  <div style={{ fontSize:13, fontWeight:600, color:T.white }}>{u.name}</div>
                </td>
                <td style={{ padding:"10px 12px" }}>
                  <Pill color={roleColor(u.role, T)}>{ROLE_LABELS[u.role]||u.role}</Pill>
                </td>
                <td style={{ padding:"10px 12px" }}>
                  {u.role === "office_admin"
                    ? <div style={{ display:"flex", gap:4 }}>
                        <Pill color={T.laxmi}>Lakshmi Nagar</Pill>
                        <Pill color={T.raya}>Raya</Pill>
                      </div>
                    : u.branch
                      ? <Pill color={bColor(u.branch, T)}>{bName(u.branch)}</Pill>
                      : <span style={{ color:T.dim }}>--</span>
                  }
                </td>
                <td style={{ padding:"10px 12px" }}><StatusBadge u={u}/></td>
                <td style={{ padding:"10px 12px", fontSize:11, color:T.dim }}>{u.lastLogin ? fmt(u.lastLogin) : "--"}</td>
                <td style={{ padding:"10px 12px" }}>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    <button onClick={() => openEdit(u)} style={btnSm(T.laxmi+"20", T.laxmi, T.laxmi+"44")}>✏ Edit</button>
                    {u.isActive === false ? (
                      <button onClick={() => setConfirmModal({ type:"reactivate", user:u })} style={btnSm(T.green+"20", T.green, T.green+"44")}>▶ Activate</button>
                    ) : (
                      <button onClick={() => setConfirmModal({ type:"deactivate", user:u })} style={btnSm(T.amber+"18", T.amber, T.amber+"44")}>⏸ Deactivate</button>
                    )}
                    <button onClick={() => setConfirmModal({ type:"delete", user:u })} style={btnSm(T.red+"15", T.red, T.red+"44")}>🗑 Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {createModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.78)", zIndex:2000,
          display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:T.surface, borderRadius:16, padding:30, width:460,
            border:`1px solid ${T.border}`, boxShadow:SD, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div style={{ fontSize:16, fontWeight:800, color:T.white }}>Create New User</div>
              <button onClick={()=>setCreateModal(false)} style={{ background:"rgba(255,255,255,.07)", border:"none", color:T.white, width:30, height:30, borderRadius:7, cursor:"pointer", fontSize:14 }}>✕</button>
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={labelSt}>Username / ID <span style={{ color:T.red }}>*</span></label>
              <input type="text" placeholder="admin_xyz" value={form.id} onChange={sf("id")} style={inputSt}/>
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={labelSt}>Full Name <span style={{ color:T.red }}>*</span></label>
              <input type="text" placeholder="Full Name" value={form.name} onChange={sf("name")} style={inputSt}/>
            </div>
            {[["Password","password",showPass,()=>setShowPass(p=>!p)],
              ["Confirm Password","confirmPassword",showConfirm,()=>setShowConfirm(p=>!p)]
            ].map(([lbl,k,visible,toggle])=>(
              <div key={k} style={{ marginBottom:12 }}>
                <label style={labelSt}>{lbl} <span style={{ color:T.red }}>*</span></label>
                <div style={{ position:"relative" }}>
                  <input type={visible?"text":"password"} placeholder="••••••••"
                    value={form[k]||""} onChange={sf(k)} style={{ ...inputSt, paddingRight:52 }}/>
                  <button type="button" onClick={toggle} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#9ca3af", fontSize:11, fontWeight:600 }}>
                    {visible?"HIDE":"SHOW"}
                  </button>
                </div>
                {k==="confirmPassword" && passErr && <div style={{ color:T.red, fontSize:12, marginTop:4 }}>{passErr}</div>}
              </div>
            ))}
            <div style={{ marginBottom:12 }}>
              <label style={labelSt}>Role</label>
              <select value={form.role} onChange={e=>handleRoleChange(e.target.value)} style={{ ...inputSt, cursor:"pointer" }}>
                <option value="office_admin">Office Admin (Both Branches)</option>
                <option value="branch_admin">Branch Admin (Single Branch)</option>
              </select>
              <div style={{ fontSize:11, color:T.dim, marginTop:5, padding:"6px 10px", background:T.bg, borderRadius:6 }}>
                {form.role==="office_admin" ? "⚡ Office Admin has access to both branches with a branch switcher." : "🏥 Branch Admin is restricted to the single branch below."}
              </div>
            </div>
            <div style={{ marginBottom:18 }}>
              <label style={labelSt}>Branch {form.role==="office_admin" && <span style={{ color:T.green, textTransform:"none", letterSpacing:0, fontWeight:500 }}>(auto: both)</span>}</label>
              {form.role==="office_admin" ? (
                <div style={{ padding:"9px 13px", borderRadius:8, border:`1px solid ${T.border}`, background:T.bg, color:T.dim, fontSize:13, display:"flex", gap:8 }}>
                  <Pill color={T.laxmi}>Lakshmi Nagar</Pill><Pill color={T.raya}>Raya</Pill>
                </div>
              ) : (
                <select value={form.branch} onChange={sf("branch")} style={{ ...inputSt, cursor:"pointer" }}>
                  <option value="laxmi">Lakshmi Nagar</option>
                  <option value="raya">Raya</option>
                </select>
              )}
            </div>
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
              <button onClick={()=>setCreateModal(false)} style={{ padding:"9px 18px", borderRadius:8, background:"transparent", border:`1px solid ${T.border2}`, color:T.dim, fontWeight:700, cursor:"pointer" }}>Cancel</button>
              <button onClick={handleCreate} disabled={loading} style={{ padding:"9px 18px", borderRadius:8, background:T.laxmi, color:"#fff", border:"none", fontWeight:800, cursor:"pointer", opacity:loading?0.7:1 }}>
                {loading ? "Creating..." : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.78)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:T.surface, borderRadius:16, padding:30, width:460, border:`1px solid ${T.border}`, boxShadow:SD, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
              <div style={{ fontSize:16, fontWeight:800, color:T.white }}>Edit User</div>
              <button onClick={()=>setEditModal(null)} style={{ background:"rgba(255,255,255,.07)", border:"none", color:T.white, width:30, height:30, borderRadius:7, cursor:"pointer", fontSize:14 }}>✕</button>
            </div>
            <div style={{ fontSize:12, color:T.dim, marginBottom:20 }}>Editing: <strong style={{ color:T.laxmi, fontFamily:"monospace" }}>{editModal.id}</strong></div>
            <div style={{ marginBottom:12 }}>
              <label style={labelSt}>Full Name <span style={{ color:T.red }}>*</span></label>
              <input type="text" value={editForm.name} onChange={sef("name")} style={inputSt}/>
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={labelSt}>Role</label>
              <select value={editForm.role} onChange={e => setEditForm(f=>({ ...f, role:e.target.value, branch: e.target.value==="office_admin"?"laxmi":f.branch }))} style={{ ...inputSt, cursor:"pointer" }}>
                <option value="office_admin">Office Admin (Both Branches)</option>
                <option value="branch_admin">Branch Admin (Single Branch)</option>
              </select>
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={labelSt}>Branch {editForm.role==="office_admin" && <span style={{ color:T.green, textTransform:"none", letterSpacing:0, fontWeight:500 }}>(auto: both)</span>}</label>
              {editForm.role==="office_admin" ? (
                <div style={{ padding:"9px 13px", borderRadius:8, border:`1px solid ${T.border}`, background:T.bg, display:"flex", gap:8 }}>
                  <Pill color={T.laxmi}>Lakshmi Nagar</Pill><Pill color={T.raya}>Raya</Pill>
                </div>
              ) : (
                <select value={editForm.branch} onChange={sef("branch")} style={{ ...inputSt, cursor:"pointer" }}>
                  <option value="laxmi">Lakshmi Nagar</option>
                  <option value="raya">Raya</option>
                </select>
              )}
            </div>
            <div style={{ borderTop:`1px solid ${T.border}`, margin:"18px 0 14px", fontSize:11, color:T.dim, fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", paddingTop:14 }}>
              Reset Password <span style={{ color:T.dimmer, textTransform:"none", fontWeight:400 }}>(leave blank to keep current)</span>
            </div>
            {[["New Password","newPass",showEditPass,()=>setShowEditPass(p=>!p)],["Confirm New Password","confirmNewPass",showEditPass,()=>{}]].map(([lbl,k,visible])=>(
              <div key={k} style={{ marginBottom:12 }}>
                <label style={labelSt}>{lbl}</label>
                <div style={{ position:"relative" }}>
                  <input type={visible?"text":"password"} placeholder="••••••••" value={editForm[k]||""} onChange={sef(k)} style={{ ...inputSt, paddingRight:52 }}/>
                  {k==="newPass" && <button type="button" onClick={()=>setShowEditPass(p=>!p)} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#9ca3af", fontSize:11, fontWeight:600 }}>{showEditPass?"HIDE":"SHOW"}</button>}
                </div>
              </div>
            ))}
            {editForm.newPass && editForm.newPass !== editForm.confirmNewPass && <div style={{ color:T.red, fontSize:12, marginBottom:10 }}>Passwords do not match</div>}
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:18 }}>
              <button onClick={()=>setEditModal(null)} style={{ padding:"9px 18px", borderRadius:8, background:"transparent", border:`1px solid ${T.border2}`, color:T.dim, fontWeight:700, cursor:"pointer" }}>Cancel</button>
              <button onClick={handleSaveEdit} disabled={loading} style={{ padding:"9px 18px", borderRadius:8, background:T.laxmi, color:"#fff", border:"none", fontWeight:800, cursor:"pointer", opacity:loading?0.7:1 }}>{loading ? "Saving..." : "Save Changes"}</button>
            </div>
          </div>
        </div>
      )}

      {confirmModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.82)", zIndex:2100, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:T.surface, borderRadius:16, padding:28, width:400,
            border:`1px solid ${confirmModal.type==="delete"?T.red:confirmModal.type==="deactivate"?T.amber:T.green}44`, boxShadow:SD }}>
            <div style={{ textAlign:"center", marginBottom:16 }}>
              <div style={{ fontSize:44, marginBottom:8 }}>{confirmModal.type==="delete"?"🗑️":confirmModal.type==="deactivate"?"⏸️":"▶️"}</div>
              <div style={{ fontSize:16, fontWeight:900, color:T.white }}>
                {confirmModal.type==="delete"?"Permanently Delete User?":confirmModal.type==="deactivate"?"Deactivate User?":"Reactivate User?"}
              </div>
            </div>
            <div style={{ background:T.bg, borderRadius:10, padding:"12px 16px", marginBottom:20 }}>
              <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:4 }}>{confirmModal.user.name}</div>
              <div style={{ fontSize:12, color:T.dim, fontFamily:"monospace" }}>{confirmModal.user.id}</div>
              <div style={{ marginTop:8, fontSize:12, color:T.dim }}>
                {confirmModal.type==="delete"?"⚠️ This action is permanent and cannot be undone.":confirmModal.type==="deactivate"?"This will block the user from logging in.":"This will restore the user's login access immediately."}
              </div>
            </div>
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
              <button onClick={()=>setConfirmModal(null)} style={{ padding:"9px 18px", borderRadius:8, background:"transparent", border:`1px solid ${T.border2}`, color:T.dim, fontWeight:700, cursor:"pointer" }}>Cancel</button>
              <button onClick={handleConfirm} disabled={loading} style={{ padding:"9px 20px", borderRadius:8, border:"none", fontWeight:800, cursor:"pointer", opacity:loading?0.7:1,
                background:confirmModal.type==="delete"?T.red:confirmModal.type==="deactivate"?T.amber:T.green,
                color:confirmModal.type==="delete"?"#fff":"#fff" }}>
                {loading?"Processing...":confirmModal.type==="delete"?"Yes, Delete":confirmModal.type==="deactivate"?"Yes, Deactivate":"Yes, Reactivate"}
              </button>
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
              {[["Total Patients",d.patients],["Doctors",d.doctors.length],["Total Revenue",inr(d.revenue)]].map(([k,v])=>(
                <div key={k} style={{ display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${T.border}` }}>
                  <span style={{ fontSize:12,color:T.dim }}>{k}</span>
                  <span style={{ fontSize:13,fontWeight:700,color:T.white }}>{v}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB 12 — TASK PERFORMANCE
══════════════════════════════════════════════════════════════ */
const DEPARTMENTS = ["Billing", "Uploading", "OPD", "Query", "Intimation"];

const DEPT_META = {
  Billing:    { icon:"💳", color:"#FBBF24", desc:"Invoice generation, payment collection, discount handling" },
  Uploading:  { icon:"📤", color:"#38BDF8", desc:"Document uploads, report filing, data entry accuracy" },
  OPD:        { icon:"🩺", color:"#34D399", desc:"Outpatient registration, scheduling, patient flow management" },
  Query:      { icon:"💬", color:"#A78BFA", desc:"Patient and visitor queries, information desk, call handling" },
  Intimation: { icon:"📞", color:"#FB923C", desc:"Insurance intimation, TPA coordination, pre-auth processing" },
};

const ratingMeta = (r) => {
  if (r >= 5) return { label:"Excellent",  color:"#34D399" };
  if (r >= 4) return { label:"Good",        color:"#4ADE80" };
  if (r >= 3) return { label:"Average",     color:"#FBBF24" };
  if (r >= 2) return { label:"Below Avg",   color:"#FB923C" };
  return             { label:"Poor",         color:"#F87171" };
};

function DeptOverviewCard({ dept, entries }) {
  const T = useT();
  const meta = DEPT_META[dept];
  const avg = entries.length ? (entries.reduce((s,e)=>s+e.rating,0)/entries.length).toFixed(1) : "—";
  const poor  = entries.filter(e=>e.rating<=2).length;
  const excel = entries.filter(e=>e.rating>=5).length;
  const rm    = entries.length ? ratingMeta(parseFloat(avg)) : { label:"—", color:T.dim };
  const dist = [5,4,3,2,1].map(s=>({
    s, count: entries.filter(e=>e.rating===s).length,
    pct: entries.length ? Math.round(entries.filter(e=>e.rating===s).length/entries.length*100) : 0,
  }));
  return (
    <div style={{ background:T.card, borderRadius:14, padding:18, boxShadow:SD,
      borderTop:`3px solid ${meta.color}`, display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
            <span style={{ fontSize:20 }}>{meta.icon}</span>
            <span style={{ fontSize:15, fontWeight:800, color:T.white }}>{dept}</span>
          </div>
          <div style={{ fontSize:11, color:T.dim, maxWidth:200 }}>{meta.desc}</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:28, fontWeight:900, color:rm.color }}>{avg}</div>
          <div style={{ fontSize:10, color:T.dim }}>avg / 5</div>
        </div>
      </div>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        <span style={{ background:T.bg, borderRadius:6, padding:"3px 9px", fontSize:11, color:T.dim }}>
          <strong style={{ color:T.white }}>{entries.length}</strong> reviews
        </span>
        <span style={{ background:T.green+"18", borderRadius:6, padding:"3px 9px", fontSize:11, color:T.green }}>
          <strong>{excel}</strong> excellent
        </span>
        {poor > 0 && <span style={{ background:T.red+"18", borderRadius:6, padding:"3px 9px", fontSize:11, color:T.red }}>
          <strong>{poor}</strong> poor
        </span>}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
        {dist.map(d=>(
          <div key={d.s} style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:14, fontSize:10, color:T.amber, fontWeight:700 }}>{d.s}★</div>
            <div style={{ flex:1, height:6, borderRadius:3, background:T.bg, overflow:"hidden" }}>
              <div style={{ height:"100%", width:d.pct+"%", borderRadius:3, background:ratingMeta(d.s).color, transition:"width .4s ease", minWidth:d.count>0?4:0 }}/>
            </div>
            <div style={{ width:28, textAlign:"right", fontSize:10, color:T.dim }}>{d.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmployeeCard({ emp, entries, onClick }) {
  const T = useT();
  const overallAvg = entries.length ? (entries.reduce((s,e)=>s+e.rating,0)/entries.length).toFixed(1) : "—";
  const rm  = entries.length ? ratingMeta(parseFloat(overallAvg)) : { label:"—", color:T.dim };
  const col = bColor(emp.branch, T);
  const deptBreakdown = DEPARTMENTS.map(dept => {
    const de = entries.filter(e=>e.department===dept);
    const avg = de.length ? (de.reduce((s,e)=>s+e.rating,0)/de.length).toFixed(1) : null;
    return { dept, avg, count: de.length, meta: DEPT_META[dept] };
  });
  return (
    <div onClick={onClick} style={{ background:T.card, borderRadius:14, padding:18, boxShadow:SD, cursor:"pointer", border:`1px solid ${T.border}`, borderLeft:`4px solid ${col}` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <div style={{ width:38, height:38, borderRadius:10, background:col+"25", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:900, color:col }}>
            {emp.staffName?.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:800, color:T.white }}>{emp.staffName}</div>
            <div style={{ fontSize:11, color:T.dim, marginTop:2, display:"flex", gap:6 }}>
              <span>{emp.staffId}</span><span>·</span><span style={{ color:col }}>{bName(emp.branch)}</span>
            </div>
          </div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:22, fontWeight:900, color:rm.color }}>{overallAvg}</div>
          <span style={{ fontSize:10, background:rm.color+"22", color:rm.color, borderRadius:5, padding:"1px 7px", fontWeight:700 }}>{rm.label}</span>
        </div>
      </div>
      <div style={{ marginBottom:10 }}>
        <span style={{ background:T.bg, borderRadius:5, padding:"2px 8px", fontSize:11, color:T.dim, fontWeight:600 }}>{emp.role}</span>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {deptBreakdown.map(({ dept, avg, count, meta }) => (
          <div key={dept} style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:12 }}>{meta.icon}</span>
            <div style={{ width:68, fontSize:10, color:T.dim, fontWeight:600 }}>{dept}</div>
            {avg !== null ? (
              <>
                <div style={{ flex:1, height:5, borderRadius:3, background:T.bg, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:(parseFloat(avg)/5*100)+"%", borderRadius:3, background:meta.color, opacity:.85 }}/>
                </div>
                <div style={{ width:22, textAlign:"right", fontSize:11, fontWeight:700, color:meta.color }}>{avg}</div>
                <div style={{ width:24, textAlign:"right", fontSize:10, color:T.dim }}>({count})</div>
              </>
            ) : (
              <div style={{ flex:1, fontSize:10, color:T.dimmer }}>No data</div>
            )}
          </div>
        ))}
      </div>
      <div style={{ marginTop:10, textAlign:"right", fontSize:11, color:T.dim }}>
        {entries.length} total reviews — <span style={{ color:T.laxmi }}>View Details →</span>
      </div>
    </div>
  );
}

function EmployeeDetailModal({ emp, entries, onClose }) {
  const T = useT();
  const [activeDept, setActiveDept] = useState("all");
  if (!emp) return null;
  const col = bColor(emp.branch, T);
  const overallAvg = entries.length ? (entries.reduce((s,e)=>s+e.rating,0)/entries.length).toFixed(1) : "—";
  const rm = entries.length ? ratingMeta(parseFloat(overallAvg)) : { label:"—", color:T.dim };
  const deptEntries = activeDept === "all" ? entries : entries.filter(e=>e.department===activeDept);

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.82)",zIndex:3000, display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div style={{ background:T.surface, borderRadius:20, width:"100%", maxWidth:780, maxHeight:"92vh", overflow:"hidden", display:"flex", flexDirection:"column", border:`1px solid ${T.border}`, boxShadow:"0 32px 100px rgba(0,0,0,.7)" }}>
        <div style={{ padding:"16px 22px", borderBottom:`1px solid ${T.border}`, background:T.card, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:col+"25", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:900, color:col }}>
              {emp.staffName?.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize:16, fontWeight:900, color:T.white }}>{emp.staffName}</div>
              <div style={{ fontSize:12, color:T.dim, display:"flex", gap:8, marginTop:2 }}>
                <span>{emp.staffId}</span><span>·</span><span>{emp.role}</span><span>·</span>
                <Pill color={col}>{bName(emp.branch)}</Pill>
              </div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:28, fontWeight:900, color:rm.color }}>{overallAvg}<span style={{ fontSize:14, color:T.dim }}>/5</span></div>
              <StarRating rating={Math.round(parseFloat(overallAvg)||0)} size={14}/>
            </div>
            <button onClick={onClose} style={{ background:"rgba(255,255,255,.08)", border:"none", color:T.white, width:32, height:32, borderRadius:8, cursor:"pointer", fontSize:15 }}>✕</button>
          </div>
        </div>
        <div style={{ overflowY:"auto", padding:22 }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8, marginBottom:18 }}>
            {DEPARTMENTS.map(dept => {
              const de = entries.filter(e=>e.department===dept);
              const avg = de.length ? (de.reduce((s,e)=>s+e.rating,0)/de.length).toFixed(1) : null;
              const meta = DEPT_META[dept];
              return (
                <div key={dept} onClick={()=>setActiveDept(activeDept===dept?"all":dept)}
                  style={{ background:activeDept===dept?meta.color+"25":T.card, border:`1.5px solid ${activeDept===dept?meta.color:T.border}`, borderRadius:10, padding:"10px 12px", cursor:"pointer", textAlign:"center" }}>
                  <div style={{ fontSize:18, marginBottom:4 }}>{meta.icon}</div>
                  <div style={{ fontSize:10, color:T.dim, fontWeight:600, marginBottom:4 }}>{dept}</div>
                  <div style={{ fontSize:18, fontWeight:900, color:avg?ratingMeta(parseFloat(avg)).color:T.dimmer }}>{avg||"—"}</div>
                  <div style={{ fontSize:10, color:T.dim, marginTop:2 }}>{de.length} reviews</div>
                </div>
              );
            })}
          </div>
          {activeDept !== "all" && (
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
              <span style={{ fontSize:12, color:T.dim }}>Showing:</span>
              <Pill color={DEPT_META[activeDept].color}>{DEPT_META[activeDept].icon} {activeDept}</Pill>
              <button onClick={()=>setActiveDept("all")} style={{ background:"transparent", border:`1px solid ${T.border2}`, color:T.dim, borderRadius:6, padding:"2px 8px", fontSize:11, cursor:"pointer" }}>Clear</button>
            </div>
          )}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {deptEntries.length === 0 && <div style={{ textAlign:"center", padding:40, color:T.dim }}>No reviews for this department</div>}
            {deptEntries.map((e,i) => {
              const meta = DEPT_META[e.department] || { icon:"📋", color:T.dim };
              const rm2  = ratingMeta(e.rating);
              return (
                <div key={i} style={{ background:T.bg, borderRadius:10, padding:"14px 16px", border:`1px solid ${T.border}`, borderLeft:`3px solid ${meta.color}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                    <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                      <span style={{ fontSize:13 }}>{meta.icon}</span>
                      <span style={{ fontSize:12, fontWeight:700, color:meta.color }}>{e.department}</span>
                      <Badge color={T.dim}>{e.task}</Badge>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ fontSize:16, fontWeight:900, color:rm2.color }}>{e.rating}</span>
                      <StarRating rating={e.rating} size={11}/>
                      <Badge color={rm2.color}>{rm2.label}</Badge>
                    </div>
                  </div>
                  <div style={{ fontSize:12, color:T.white, lineHeight:1.65, marginBottom:8 }}>{e.description||e.reason||"No feedback provided."}</div>
                  <div style={{ display:"flex", gap:16, fontSize:11, color:T.dim }}>
                    <span>Reviewed by: <strong style={{ color:T.white }}>{e.reviewedBy}</strong></span>
                    <span>Date: <strong style={{ color:T.white }}>{fmt(e.date)}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskPerformanceTab() {
  const T = useT();
  const [performances, setPerformances] = useState([]);
  const [loading, setLoading]           = useState(false);
  const [selectedEmp, setSelectedEmp]   = useState(null);
  const [viewMode, setViewMode]         = useState("employees");
  const [branchF, setBranchF]           = useState("all");
  const [deptF, setDeptF]               = useState("all");
  const [ratingF, setRatingF]           = useState("all");
  const [search, setSearch]             = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await apiService.getPerformanceRatings();
        setPerformances(data || []);
      } catch {
        setPerformances(DEMO_PERFORMANCES);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const filtered = performances.filter(e => {
    if (branchF !== "all" && e.branch !== branchF) return false;
    if (deptF   !== "all" && e.department !== deptF) return false;
    if (ratingF !== "all" && String(e.rating) !== ratingF) return false;
    if (search && ![e.staffName, e.staffId, e.task, e.department].some(v => v?.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const empMap = {};
  filtered.forEach(e => {
    if (!empMap[e.staffId]) empMap[e.staffId] = { staffId:e.staffId, staffName:e.staffName, branch:e.branch, role:e.role, entries:[] };
    empMap[e.staffId].entries.push(e);
  });
  const employees = Object.values(empMap);

  const overallAvg   = filtered.length ? (filtered.reduce((s,e)=>s+e.rating,0)/filtered.length).toFixed(1) : "—";
  const laxmiEntries = performances.filter(e=>e.branch==="laxmi");
  const rayaEntries  = performances.filter(e=>e.branch==="raya");
  const laxmiAvg     = laxmiEntries.length ? (laxmiEntries.reduce((s,e)=>s+e.rating,0)/laxmiEntries.length).toFixed(1) : "—";
  const rayaAvg      = rayaEntries.length  ? (rayaEntries.reduce((s,e)=>s+e.rating,0)/rayaEntries.length).toFixed(1)  : "—";
  const poorCount    = performances.filter(e=>e.rating<=2).length;
  const selEntries   = selectedEmp ? performances.filter(e=>e.staffId===selectedEmp.staffId) : [];

  const PERF_COLS = [
    {label:"Staff Name",key:"staffName"},{label:"Staff ID",key:"staffId"},
    {label:"Branch",get:r=>bName(r.branch)},{label:"Role",key:"role"},
    {label:"Department",key:"department"},{label:"Task",key:"task"},
    {label:"Rating",key:"rating"},{label:"Label",get:r=>ratingMeta(r.rating).label},
    {label:"Description",key:"description"},{label:"Reason",key:"reason"},
    {label:"Reviewed By",key:"reviewedBy"},{label:"Date",get:r=>fmt(r.date)},
  ];

  return (
    <div>
      <div style={{ display:"flex",gap:12,flexWrap:"wrap",marginBottom:18 }}>
        <StatCard icon="⭐" label="Overall Avg Rating" value={overallAvg}  sub={performances.length+" total reviews"} color={T.amber}/>
        <StatCard icon="🏥" label="Laxmi Nagar Avg"   value={laxmiAvg}    sub="Branch average"                       color={T.laxmi}/>
        <StatCard icon="🏨" label="Raya Avg"           value={rayaAvg}     sub="Branch average"                       color={T.raya}/>
        <StatCard icon="⚠️" label="Poor Ratings (≤2)"  value={poorCount}   sub="Needs attention"                      color={poorCount>0?T.red:T.green}/>
      </div>
      <div style={{ marginBottom:22 }}>
        <STitle>Department Overview</STitle>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12 }}>
          {DEPARTMENTS.map(dept => <DeptOverviewCard key={dept} dept={dept} entries={performances.filter(e=>e.department===dept)}/>)}
        </div>
      </div>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center", marginBottom:14 }}>
        <div style={{ display:"flex", background:T.bg, borderRadius:9, padding:3, gap:2, border:`1px solid ${T.border}` }}>
          {[["employees","👤 By Employee"],["departments","🏢 By Department"]].map(([v,lbl])=>(
            <button key={v} onClick={()=>setViewMode(v)} style={{ padding:"5px 13px", borderRadius:7, cursor:"pointer", fontWeight:700, fontSize:12, border:"none", background:viewMode===v?T.laxmi+"25":"transparent", color:viewMode===v?T.laxmi:T.dim, borderLeft:viewMode===v?`2px solid ${T.laxmi}`:"2px solid transparent" }}>{lbl}</button>
          ))}
        </div>
        <FilterSelect value={branchF} onChange={setBranchF} options={[["all","All Branches"],["laxmi","Lakshmi Nagar"],["raya","Raya"]]}/>
        <FilterSelect value={deptF}   onChange={setDeptF}   options={[["all","All Departments"],...DEPARTMENTS.map(d=>[d,d])]}/>
        <FilterSelect value={ratingF} onChange={setRatingF} options={[["all","All Ratings"],["5","★★★★★ Excellent"],["4","★★★★ Good"],["3","★★★ Average"],["2","★★ Below Avg"],["1","★ Poor"]]}/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search staff, task, dept..."
          style={{ marginLeft:"auto", padding:"7px 13px", borderRadius:8, border:`1px solid ${T.border2}`, background:T.card, color:T.white, fontSize:13, outline:"none", width:210 }}/>
        <XlsBtn onClick={()=>exportXLSX(filtered, PERF_COLS, "performance_ratings.xlsx")}/>
      </div>
      {loading ? (
        <div style={{ ...cardStyle(T), textAlign:"center", padding:60, color:T.dim }}>Loading performance data...</div>
      ) : viewMode === "employees" ? (
        employees.length === 0 ? (
          <div style={{ ...cardStyle(T), textAlign:"center", padding:60 }}>
            <div style={{ fontSize:36, marginBottom:12 }}>📭</div>
            <div style={{ color:T.dim }}>No performance records found</div>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:14 }}>
            {employees.map((emp, i) => <EmployeeCard key={i} emp={emp} entries={emp.entries} onClick={()=>setSelectedEmp(emp)}/>)}
          </div>
        )
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          {DEPARTMENTS.filter(d => deptF==="all" || d===deptF).map(dept => {
            const de = filtered.filter(e=>e.department===dept);
            const meta = DEPT_META[dept];
            if (de.length === 0) return null;
            const avg = (de.reduce((s,e)=>s+e.rating,0)/de.length).toFixed(1);
            return (
              <div key={dept}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                  <span style={{ fontSize:20 }}>{meta.icon}</span>
                  <span style={{ fontSize:14, fontWeight:800, color:T.white }}>{dept} Department</span>
                  <Pill color={meta.color}>{avg} avg</Pill>
                  <span style={{ fontSize:12, color:T.dim }}>{de.length} reviews</span>
                </div>
                <div style={{ ...cardStyle(T), padding:0, overflow:"hidden" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead><tr>{["Staff","Branch","Role","Task","Rating","Description","Reviewed By","Date"].map(h=><TH key={h} h={h}/>)}</tr></thead>
                    <tbody>
                      {de.map((e,i)=>{
                        const rm2 = ratingMeta(e.rating);
                        return (
                          <tr key={i} style={{ borderBottom:`1px solid ${T.border}`, background:i%2===0?T.card:T.surface }}>
                            <td style={{ padding:"9px 12px" }}>
                              <div style={{ fontSize:13, fontWeight:700, color:T.white }}>{e.staffName}</div>
                              <div style={{ fontSize:10, color:T.dim }}>{e.staffId}</div>
                            </td>
                            <td style={{ padding:"9px 12px" }}><Pill color={bColor(e.branch, T)}>{bName(e.branch)}</Pill></td>
                            <td style={{ padding:"9px 12px", fontSize:12, color:T.dim }}>{e.role}</td>
                            <td style={{ padding:"9px 12px", fontSize:12, color:T.white }}>{e.task}</td>
                            <td style={{ padding:"9px 12px" }}>
                              <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                                <span style={{ fontSize:16, fontWeight:900, color:rm2.color }}>{e.rating}</span>
                                <StarRating rating={e.rating} size={11}/>
                              </div>
                              <div style={{ marginTop:2 }}><Badge color={rm2.color}>{rm2.label}</Badge></div>
                            </td>
                            <td style={{ padding:"9px 12px", fontSize:11, color:T.dim, maxWidth:220, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{e.description||e.reason||"--"}</td>
                            <td style={{ padding:"9px 12px", fontSize:12, color:T.dim }}>{e.reviewedBy}</td>
                            <td style={{ padding:"9px 12px", fontSize:11, color:T.dim, whiteSpace:"nowrap" }}>{fmt(e.date)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {selectedEmp && <EmployeeDetailModal emp={selectedEmp} entries={selEntries} onClose={()=>setSelectedEmp(null)}/>}
    </div>
  );
}

const DEMO_PERFORMANCES = [
  { staffName:"Rahul Verma",  staffId:"EMP002", branch:"laxmi", role:"Billing Staff",  department:"Billing",    task:"Invoice Generation",         rating:4, reviewedBy:"Office Admin (Laxmi)", description:"Invoices raised accurately with minor formatting issues.", reason:"", date:"2026-04-15" },
  { staffName:"Suresh Patel", staffId:"EMP004", branch:"raya",  role:"Billing Staff",  department:"Billing",    task:"Cashless Billing",           rating:3, reviewedBy:"Office Admin (Raya)",  description:"Two invoice discrepancies found this week.", reason:"", date:"2026-04-13" },
  { staffName:"Priya Nair",   staffId:"EMP003", branch:"raya",  role:"Billing Staff",  department:"Billing",    task:"Daily Collections",          rating:5, reviewedBy:"Office Admin (Raya)",  description:"Exceptional daily collection rate.", reason:"", date:"2026-04-14" },
  { staffName:"Meena Kapoor", staffId:"EMP005", branch:"laxmi", role:"Lab Technician", department:"Uploading",  task:"Report Upload Accuracy",     rating:5, reviewedBy:"Office Admin (Laxmi)", description:"All lab reports uploaded with zero errors.", reason:"", date:"2026-04-12" },
  { staffName:"Kavya Reddy",  staffId:"EMP007", branch:"laxmi", role:"Nurse",          department:"OPD",        task:"Patient Registration",       rating:5, reviewedBy:"Office Admin (Laxmi)", description:"Handled 62 OPD patients in a single shift.", reason:"", date:"2026-04-10" },
  { staffName:"Deepak Joshi", staffId:"EMP008", branch:"raya",  role:"Receptionist",   department:"Query",      task:"Patient Query Handling",     rating:4, reviewedBy:"Office Admin (Raya)",  description:"Most queries resolved at first contact.", reason:"", date:"2026-04-09" },
  { staffName:"Arjun Singh",  staffId:"EMP006", branch:"raya",  role:"Insurance Exec", department:"Intimation", task:"TPA Pre-Auth Processing",    rating:2, reviewedBy:"Office Admin (Raya)",  description:"Two pre-auth requests with incorrect ICD codes.", reason:"", date:"2026-04-11" },
  { staffName:"Meena Kapoor", staffId:"EMP005", branch:"laxmi", role:"Insurance Exec", department:"Intimation", task:"Cashless Intimation Filing", rating:5, reviewedBy:"Office Admin (Laxmi)", description:"All intimation files submitted within 2 hours.", reason:"", date:"2026-04-12" },
];

/* ══════════════════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════════════════ */
export default function SuperAdminDashboard({ db={}, printRequests=[], onApprovePrint, onLogout }) {
  const { isDark, toggle } = useTheme();
  // eslint-disable-next-line no-global-assign
  T = isDark ? T_DARK : T_LIGHT;
  const [tab, setTab] = useState("dashboard");
  const dropRef       = useRef();

  const all   = useMemo(()=>flattenDB(db,"all"),  [db]);
  const laxmi = useMemo(()=>flattenDB(db,"laxmi"),[db]);
  const raya  = useMemo(()=>flattenDB(db,"raya"), [db]);
  const pending = (printRequests||[]).length;

  useEffect(() => {
    const handler = e => { if (dropRef.current && !dropRef.current.contains(e.target)) {} };
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
    { id:"performance",  icon:"⭐", label:"Task Performance" },
  ];

  const activeLabel = NAV.find(n=>n.id===tab);

  /* ── Sidebar text colour adapts: white text on dark navy sidebar ── */
  const sidebarTextColor = "#E2F0FB";
  const sidebarDimColor  = "#6BA3C8";

  return (
    <TC.Provider value={T}>
    <div style={{ minHeight:"100vh", background:T.bg, fontFamily:"'Segoe UI',system-ui,sans-serif" }}>

      {/* SIDEBAR — always navy regardless of light/dark toggle */}
      <div style={{ width:228, minHeight:"100vh", background:"#1B3A5C", display:"flex", flexDirection:"column",
        position:"fixed", top:0, left:0, zIndex:50, borderRight:`1px solid #244D6E` }}>
        <div style={{ padding:"18px 14px 14px", borderBottom:`1px solid #244D6E` }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <img src="/app_icon.png" alt="logo" style={{ width:36, height:36, borderRadius:10, objectFit:"cover" }}/>
            <div>
              <div style={{ color:"#E2F0FB", fontWeight:800, fontSize:13 }}>Sangi Hospital</div>
              <div style={{ color:"#6BA3C8", fontSize:10, textTransform:"uppercase", letterSpacing:".1em" }}>Super Admin Portal</div>
            </div>
          </div>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"6px 6px" }}>
          {NAV.map((n,i)=>{
            if (n.section) return (
              <div key={i} style={{ fontSize:10, color:"#4A7EA0", fontWeight:700, textTransform:"uppercase",
                letterSpacing:".1em", padding:"12px 10px 4px" }}>{n.section}</div>
            );
            const active = tab===n.id;
            return (
              <button key={n.id} onClick={()=>setTab(n.id)} style={{
                display:"flex", alignItems:"center", gap:8, padding:"8px 10px", borderRadius:9,
                border:"none", cursor:"pointer", width:"100%", textAlign:"left", marginBottom:1,
                background:active?"rgba(56,189,248,.15)":"transparent",
                color:active?"#38BDF8":sidebarDimColor, fontWeight:active?700:400, fontSize:13,
                borderLeft:active?"3px solid #38BDF8":"3px solid transparent",
              }}>
                <span style={{ fontSize:15 }}>{n.icon}</span>
                <span style={{ flex:1 }}>{n.label}</span>
                {n.badge && <span style={{ background:"#FBBF24", color:"#000", borderRadius:10,
                  padding:"1px 7px", fontSize:10, fontWeight:900 }}>{n.badge}</span>}
              </button>
            );
          })}
        </div>
        <div style={{ padding:"10px", borderTop:`1px solid #244D6E` }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 11px",
            background:"rgba(255,255,255,.06)", borderRadius:9 }}>
            <div style={{ width:30, height:30, borderRadius:8, background:"rgba(56,189,248,.2)",
              display:"flex", alignItems:"center", justifyContent:"center", color:"#38BDF8", fontWeight:900, fontSize:13 }}>S</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, color:"#E2F0FB", fontWeight:700 }}>Super Admin</div>
              <div style={{ fontSize:10, color:"#6BA3C8" }}>All branches</div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ marginLeft:228, flex:1, minHeight:"100vh", overflowX:"hidden" }}>
        {/* Top bar — also always navy */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 28px",
          borderBottom:`1px solid #244D6E`, background:"#1B3A5C", position:"sticky", top:0, zIndex:40 }}>
          <div style={{ fontSize:13, fontWeight:700, color:"#E2F0FB" }}>{activeLabel?.icon} {activeLabel?.label}</div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <button onClick={toggle} style={{ background:"rgba(255,255,255,.08)", border:`1px solid #244D6E`, color:"#6BA3C8",
              padding:"5px 12px", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:600 }}>
              {isDark?"☀ Light":"☾ Dark"}
            </button>
            <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,.05)",
              borderRadius:20, padding:"3px 6px 3px 12px", border:`1px solid #244D6E` }}>
              <span style={{ fontSize:11, color:"#6BA3C8", fontWeight:500 }}>Super Admin</span>
              <div style={{ width:28, height:28, borderRadius:"50%", background:"rgba(56,189,248,.2)",
                display:"flex", alignItems:"center", justifyContent:"center", color:"#38BDF8", fontWeight:900, fontSize:12 }}>S</div>
            </div>
            <button onClick={onLogout} style={{ background:"rgba(255,255,255,.06)", border:`1px solid #244D6E`, color:"#6BA3C8",
              padding:"5px 13px", borderRadius:8, cursor:"pointer", fontSize:11, fontWeight:600, display:"flex", alignItems:"center", gap:5 }}>
              ↪ Logout
            </button>
          </div>
        </div>
        <div style={{ padding:"18px 28px 4px" }}>
          <div style={{ fontSize:12, color:T.dim }}>
            {new Date().toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}
            {" · "}{all.length} total records · {laxmi.length} Laxmi Nagar · {raya.length} Raya
          </div>
        </div>
        <div style={{ padding:"16px 28px 28px" }}>
          {tab==="dashboard"   && <DashboardTab all={all} laxmi={laxmi} raya={raya}/>}
          {tab==="laxmi"       && <BranchTab pts={laxmi} branch="laxmi"/>}
          {tab==="raya"        && <BranchTab pts={raya}  branch="raya"/>}
          {tab==="allpatients" && <AllPatientsTab all={all}/>}
          {tab==="billing"     && <BillingTab all={all}/>}
          {tab==="invoices"    && <InvoicesTab printRequests={printRequests} onApprovePrint={onApprovePrint}/>}
          {tab==="medical"     && <MedicalTab all={all}/>}
          {tab==="discharge"   && <DischargeTab all={all}/>}
          {tab==="reports"     && <ReportsTab all={all}/>}
          {tab==="admins"      && <AdminsTab/>}
          {tab==="departments" && <DepartmentsTab all={all}/>}
          {tab==="performance" && <TaskPerformanceTab/>}
        </div>
      </div>
    </div>
    </TC.Provider>
  );
}