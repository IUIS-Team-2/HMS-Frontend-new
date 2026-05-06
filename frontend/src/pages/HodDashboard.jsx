import { useState, useEffect, useCallback } from "react";
import ThemeModeDock from "../components/ui/ThemeModeDock";
import { BASE_URL } from "../services/apiService";
import {
  IndianRupee, Upload, CircleHelp, Hospital,
  ClipboardList, CheckSquare, BarChart3, Star, Users,
  FileText, Activity, Send,
  AlertCircle, RefreshCw,
  Stethoscope, BookOpen, Search, Filter, LogOut,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
const DEPARTMENTS = [
  "Billing", "Uploading", "Query", "OPD", "Intimation",
  "Nursing", "Doctor", "Notes", "Quality Analysis",
];

const DEPT_META = {
  Billing:          { color: "#10b981", icon: IndianRupee,   desc: "Final bill preparation & payment" },
  Uploading:        { color: "#3b82f6", icon: Upload,        desc: "Document upload & digitisation" },
  Query:            { color: "#f59e0b", icon: CircleHelp,    desc: "Patient & insurance queries" },
  OPD:              { color: "#ef4444", icon: Hospital,      desc: "Out-patient department tasks" },
  Intimation:       { color: "#06b6d4", icon: ClipboardList, desc: "Insurance intimation letters" },
  Nursing:          { color: "#a78bfa", icon: Users,         desc: "Nursing care & medication notes" },
  Doctor:           { color: "#f472b6", icon: Stethoscope,   desc: "Doctor notes & prescriptions" },
  Notes:            { color: "#64748b", icon: BookOpen,      desc: "Clinical & administrative notes" },
  "Quality Analysis": { color: "#f97316", icon: BarChart3,  desc: "Quality checks & analysis" },
};

const STATUS_META = {
  pending:       { bg:"rgba(245,158,11,0.12)",  text:"#f59e0b",  border:"rgba(245,158,11,0.3)",  label:"Pending"     },
  "in-progress": { bg:"rgba(6,182,212,0.12)",   text:"#06b6d4",  border:"rgba(6,182,212,0.3)",   label:"In Progress" },
  completed:     { bg:"rgba(16,185,129,0.12)",  text:"#10b981",  border:"rgba(16,185,129,0.3)",  label:"Completed"   },
  overdue:       { bg:"rgba(239,68,68,0.12)",   text:"#ef4444",  border:"rgba(239,68,68,0.3)",   label:"Overdue"     },
  submitted:     { bg:"rgba(99,102,241,0.12)",  text:"#6366f1",  border:"rgba(99,102,241,0.3)",  label:"Submitted"   },
  approved:      { bg:"rgba(16,185,129,0.12)",  text:"#10b981",  border:"rgba(16,185,129,0.3)",  label:"Approved"    },
  rejected:      { bg:"rgba(239,68,68,0.12)",   text:"#ef4444",  border:"rgba(239,68,68,0.3)",   label:"Rejected"    },
};

const PRIORITY_META = {
  Low:    { color:"#64748b", bg:"rgba(100,116,139,0.1)" },
  Medium: { color:"#f59e0b", bg:"rgba(245,158,11,0.1)"  },
  High:   { color:"#ef4444", bg:"rgba(239,68,68,0.1)"   },
  Urgent: { color:"#a855f7", bg:"rgba(168,85,247,0.1)"  },
};

// ─── Billing constants ────────────────────────────────────────────────────────
const PATHOLOGY_REPORT_TYPES = [
  "Haematology","Biochemistry","Microbiology","Immunology – Serology",
  "Histopathology","Cytology","Blood Bank","Clinical Pathology","Endocrinology",
];
const RADIOLOGY_REPORT_TYPES = [
  "X-Ray","USG","CT Scan","MRI","Echo","ECG","PET Scan",
  "Mammography","Fluoroscopy","Nuclear Medicine",
];
const MEDICATION_GROUPS = [
  { group:"💉 IV / Injections", items:["Inj. Normal Saline (NS) 500ml","Inj. Ringer Lactate (RL) 500ml","Inj. DNS 500ml","Inj. Pantoprazole 40mg IV BD","Inj. Ondansetron 4mg IV TDS","Inj. Tramadol 50mg IV TDS","Inj. Ceftriaxone 1g IV BD","Inj. Amikacin 500mg IV OD","Inj. Metronidazole 500mg IV TDS","Inj. Furosemide 40mg IV OD","Inj. Dexamethasone 8mg IV OD","Inj. Enoxaparin 40mg SC OD","Inj. Insulin Regular SC TDS"] },
  { group:"💊 Oral Tablets / Capsules", items:["Tab. Paracetamol 500mg TDS","Tab. Paracetamol 650mg TDS","Tab. Ibuprofen 400mg TDS","Tab. Pantoprazole 40mg OD","Tab. Metformin 500mg BD","Tab. Amlodipine 5mg OD","Tab. Atenolol 50mg OD","Tab. Ramipril 5mg OD","Tab. Atorvastatin 20mg HS","Tab. Clopidogrel 75mg OD","Tab. Aspirin 75mg OD","Tab. Azithromycin 500mg OD","Tab. Amoxicillin 500mg TDS","Tab. Ciprofloxacin 500mg BD","Tab. Metronidazole 400mg TDS","Tab. Prednisolone 10mg OD","Cap. Omeprazole 20mg BD"] },
  { group:"🔧 Supportive / Others", items:["O2 Inhalation 2–4 L/min","Ryle's Tube Feed","IV Fluids NS/RL @ 100ml/hr","Urinary Catheterisation","Dressing BD","Steam Inhalation BD","Physiotherapy","ICU Monitoring","Vital Monitoring 4th Hourly"] },
];
const TPA_DOCS = [
  { key:"final_bill", label:"Final Bill" },
  { key:"pharmacy_bill", label:"Pharmacy Bill" },
  { key:"pathology_bill", label:"Pathology Bill" },
  { key:"radiology_bill", label:"Radiology Bill" },
  { key:"discharge_summary", label:"Discharge Summary" },
  { key:"reports", label:"Reports" },
  { key:"admission_note", label:"Admission Note" },
];
const INSURANCE_TYPES_LIST = ["Self Pay","TPA","ECHS","ECI","FCI","Ayushman Bharat","Northern Railways","Cash"];
const SECTION_KEYS   = ["discharge","admission","reports","medicines","billing"];
const SECTION_LABELS = { discharge:"Discharge Summary", admission:"Admission Note", reports:"Reports", medicines:"Medicine Bill", billing:"Final Bill" };
const SECTION_ICONS  = { discharge:"P", admission:"A", reports:"R", medicines:"M", billing:"B" };
const TAB_MAP        = { discharge:"discharge", admission:"medical", reports:"reports", medicines:"med_bill", billing:"finalbill" };

const isRadiologyType = (rt = "") => RADIOLOGY_REPORT_TYPES.includes(rt);
const fmtRs = n => "₹" + Number(n || 0).toLocaleString("en-IN");
const fmtDt = d => d ? new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "—";
const initials = name => (name || "?").trim().split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

const emptyPathReport = () => ({
  id: Date.now() + Math.random(),
  reportName: "", reportType: "Haematology", billCategory: "PATHOLOGY",
  date: new Date().toISOString().slice(0,10), orderedBy: "", amount: 0, remarks: "",
  tests: [{ id: Date.now(), name:"", value:"", unit:"", refRange:"", status:"Normal" }],
});
const emptyRadReport = () => ({
  id: Date.now() + Math.random(),
  reportName: "", reportType: "X-Ray", billCategory: "RADIOLOGY",
  date: new Date().toISOString().slice(0,10), orderedBy: "", amount: 0, remarks: "",
  findings: "", impression: "", tests: [],
});

function statusColor(s) {
  if (s === "High") return "#dc2626";
  if (s === "Low")  return "#d97706";
  return "#059669";
}

function calcTotals(svcs, labReports, med, billing) {
  const s = svcs.reduce((a,r) => a + Number(r.amount||0), 0);
  const p = labReports.reduce((a,r) => a + Number(r.amount||0), 0);
  const m = med.reduce((a,r) => a + Number(r.amount||0), 0);
  const gross = s + p + m;
  const disc  = Number(billing?.discount||0);
  const adv   = Number(billing?.advance||0);
  const paid  = Number(billing?.paidNow||0);
  return { s, p, m, gross, disc, adv, paid, net: gross - disc, due: gross - disc - adv - paid };
}

const API_BASE = BASE_URL;

async function apiFetch(path, options = {}) {
  const token = sessionStorage.getItem("hms_token");
  const headers = {
    "Content-Type": "application/json",
    ...(token && { "Authorization": `Bearer ${token}` }),
  };
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { ...headers, ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || `API error ${res.status}`);
  }
  return res.json();
}

// ─── PathologyReportCard ──────────────────────────────────────────────────────
function PathologyReportCard({ rep, ri, patientName, updRep, updTest, addTest, delTest, onRemove }) {
  return (
    <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, marginBottom:18, overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,0.08)" }}>
      <div style={{ background:"linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%)", color:"#fff", padding:"16px 22px", display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(255,255,255,.12)", borderRadius:20, padding:"3px 10px", fontSize:10, fontWeight:700, letterSpacing:".08em", color:"#93c5fd", marginBottom:8, textTransform:"uppercase" }}>
            🧪 PATHOLOGY REPORT
          </div>
          <input value={rep.reportName} placeholder="Report Name (e.g. Complete Blood Count)"
            onChange={e => updRep(ri,"reportName",e.target.value)}
            style={{ background:"transparent", border:"none", borderBottom:"1.5px solid rgba(255,255,255,.3)", outline:"none", color:"#fff", fontFamily:"inherit", fontSize:17, fontWeight:700, width:"100%", paddingBottom:3 }}/>
          <div style={{ display:"flex", gap:18, flexWrap:"wrap", marginTop:10, fontSize:12, color:"rgba(255,255,255,.7)", alignItems:"center" }}>
            <span>👤 <strong style={{ color:"#fff" }}>{patientName||"—"}</strong></span>
            <span>Dept:&nbsp;
              <select value={rep.reportType} onChange={e => updRep(ri,"reportType",e.target.value)}
                style={{ background:"transparent", border:"none", borderBottom:"1px solid rgba(255,255,255,.3)", outline:"none", color:"rgba(255,255,255,.85)", fontFamily:"inherit", fontSize:12 }}>
                {PATHOLOGY_REPORT_TYPES.map(t => <option key={t} value={t} style={{ background:"#1e3a5f" }}>{t}</option>)}
              </select>
            </span>
            <span>Date:&nbsp;<input type="date" value={rep.date} onChange={e => updRep(ri,"date",e.target.value)} style={{ background:"transparent", border:"none", borderBottom:"1px solid rgba(255,255,255,.3)", outline:"none", color:"rgba(255,255,255,.7)", fontFamily:"inherit", fontSize:12 }}/></span>
            <span>Ref.by:&nbsp;<input value={rep.orderedBy} placeholder="Doctor" onChange={e => updRep(ri,"orderedBy",e.target.value)} style={{ background:"transparent", border:"none", borderBottom:"1px solid rgba(255,255,255,.3)", outline:"none", color:"rgba(255,255,255,.7)", fontFamily:"inherit", fontSize:12, width:140 }}/></span>
          </div>
        </div>
        <button onClick={onRemove} style={{ background:"rgba(248,113,113,.15)", color:"#fca5a5", border:"1px solid rgba(248,113,113,.3)", borderRadius:6, padding:"5px 13px", cursor:"pointer", fontSize:12, fontFamily:"inherit", fontWeight:600, flexShrink:0 }}>Remove</button>
      </div>
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <colgroup><col style={{ width:"35%" }}/><col style={{ width:"12%" }}/><col style={{ width:"9%" }}/><col style={{ width:"35%" }}/><col style={{ width:"9%" }}/><col style={{ width:"40px" }}/></colgroup>
          <thead>
            <tr style={{ background:"var(--surface-2)" }}>
              {["Test Name","Value ✏️","Unit","Normal / Reference Range","Status",""].map((h,i) => (
                <th key={i} style={{ textAlign: i===1?"center":"left", padding:"10px 14px", fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:".06em", borderBottom:"2px solid var(--border)", background: i===1?"rgba(14,165,233,0.08)":"var(--surface-2)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rep.tests.map((t, ti) => (
              <tr key={t.id} style={{ borderBottom:"1px solid var(--border)" }}>
                <td style={{ padding:"8px 14px" }}><input value={t.name} placeholder="e.g. Haemoglobin" onChange={e => updTest(ri,ti,"name",e.target.value)} style={{ background:"var(--surface-2)", border:"1.5px solid var(--border)", borderRadius:6, padding:"6px 10px", color:"var(--text)", fontSize:12, fontFamily:"inherit", outline:"none", width:"100%" }}/></td>
                <td style={{ padding:"8px 8px", background:"rgba(14,165,233,0.05)", textAlign:"center" }}><input value={t.value} placeholder="—" onChange={e => updTest(ri,ti,"value",e.target.value)} style={{ background:"var(--surface)", border:"2px solid rgba(14,165,233,0.4)", borderRadius:6, padding:"6px 8px", color:statusColor(t.status), fontSize:13, fontFamily:"inherit", fontWeight:700, outline:"none", width:"100%", textAlign:"center" }}/></td>
                <td style={{ padding:"8px 8px" }}><input value={t.unit} placeholder="g/dL" onChange={e => updTest(ri,ti,"unit",e.target.value)} style={{ background:"var(--surface-2)", border:"1.5px solid var(--border)", borderRadius:6, padding:"6px 8px", color:"var(--text-mid)", fontSize:12, fontFamily:"inherit", outline:"none", width:"100%" }}/></td>
                <td style={{ padding:"8px 14px" }}><input value={t.refRange} placeholder="e.g. 13.0 – 17.0" onChange={e => updTest(ri,ti,"refRange",e.target.value)} style={{ background:"var(--surface-2)", border:"1.5px solid var(--border)", borderRadius:6, padding:"6px 10px", color:"var(--text-mid)", fontSize:12, fontFamily:"inherit", outline:"none", width:"100%" }}/></td>
                <td style={{ padding:"8px 8px", textAlign:"center" }}><select value={t.status} onChange={e => updTest(ri,ti,"status",e.target.value)} style={{ background:"var(--surface-2)", border:"1.5px solid var(--border)", borderRadius:6, padding:"5px 4px", color:statusColor(t.status), fontSize:11, fontFamily:"inherit", outline:"none", fontWeight:700 }}><option>Normal</option><option>High</option><option>Low</option></select></td>
                <td style={{ padding:"8px 8px", textAlign:"center" }}><button onClick={() => delTest(ri,ti)} style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", color:"#ef4444", borderRadius:5, padding:"4px 8px", cursor:"pointer", fontSize:12, fontFamily:"inherit" }}>×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ padding:"8px 16px" }}>
        <button onClick={() => addTest(ri)} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"7px 14px", background:"var(--surface-2)", border:"1.5px dashed var(--border-strong)", color:"var(--text-muted)", borderRadius:8, cursor:"pointer", fontSize:12, fontFamily:"inherit", fontWeight:600 }}>+ Add Row</button>
      </div>
      <div style={{ padding:"12px 22px", borderTop:"1px solid var(--border)", background:"var(--surface-2)", display:"flex", alignItems:"flex-end", gap:16, flexWrap:"wrap" }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:10, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:".06em", marginBottom:4 }}>Remarks / Interpretation</div>
          <input value={rep.remarks} placeholder="e.g. Mild anaemia noted, TLC elevated..." onChange={e => updRep(ri,"remarks",e.target.value)} style={{ width:"100%", background:"var(--surface)", border:"1.5px solid var(--border)", borderRadius:8, padding:"8px 12px", color:"var(--text)", fontSize:13, fontFamily:"inherit", outline:"none" }}/>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
          <span style={{ fontSize:12, fontWeight:600, color:"var(--text-muted)", whiteSpace:"nowrap" }}>Amount (₹)</span>
          <input type="number" value={rep.amount} onChange={e => updRep(ri,"amount",Number(e.target.value))} style={{ width:110, background:"var(--surface)", border:"1.5px solid var(--border)", borderRadius:8, padding:"8px 10px", color:"var(--text)", fontSize:13, fontFamily:"inherit", fontWeight:700, outline:"none" }}/>
        </div>
      </div>
    </div>
  );
}

// ─── RadiologyReportCard ──────────────────────────────────────────────────────
function RadiologyReportCard({ rep, ri, patientName, updRep, onRemove }) {
  return (
    <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, marginBottom:18, overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,0.08)" }}>
      <div style={{ background:"linear-gradient(135deg,#064e3b 0%,#065f46 100%)", color:"#fff", padding:"16px 22px", display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(255,255,255,.12)", borderRadius:20, padding:"3px 10px", fontSize:10, fontWeight:700, letterSpacing:".08em", color:"#6ee7b7", marginBottom:8, textTransform:"uppercase" }}>
            🩻 RADIOLOGY REPORT
          </div>
          <input value={rep.reportName} placeholder="Radiology Report Name (e.g. X-Ray Chest PA View)" onChange={e => updRep(ri,"reportName",e.target.value)} style={{ background:"transparent", border:"none", borderBottom:"1.5px solid rgba(255,255,255,.3)", outline:"none", color:"#fff", fontFamily:"inherit", fontSize:17, fontWeight:700, width:"100%", paddingBottom:3 }}/>
          <div style={{ display:"flex", gap:18, flexWrap:"wrap", marginTop:10, fontSize:12, color:"rgba(255,255,255,.7)", alignItems:"center" }}>
            <span>👤 <strong style={{ color:"#fff" }}>{patientName||"—"}</strong></span>
            <span>Modality:&nbsp;<select value={rep.reportType} onChange={e => updRep(ri,"reportType",e.target.value)} style={{ background:"transparent", border:"none", borderBottom:"1px solid rgba(255,255,255,.3)", outline:"none", color:"rgba(255,255,255,.85)", fontFamily:"inherit", fontSize:12 }}>{RADIOLOGY_REPORT_TYPES.map(t => <option key={t} value={t} style={{ background:"#065f46" }}>{t}</option>)}</select></span>
            <span>Date:&nbsp;<input type="date" value={rep.date} onChange={e => updRep(ri,"date",e.target.value)} style={{ background:"transparent", border:"none", borderBottom:"1px solid rgba(255,255,255,.3)", outline:"none", color:"rgba(255,255,255,.7)", fontFamily:"inherit", fontSize:12 }}/></span>
            <span>Ref.by:&nbsp;<input value={rep.orderedBy} placeholder="Doctor" onChange={e => updRep(ri,"orderedBy",e.target.value)} style={{ background:"transparent", border:"none", borderBottom:"1px solid rgba(255,255,255,.3)", outline:"none", color:"rgba(255,255,255,.7)", fontFamily:"inherit", fontSize:12, width:140 }}/></span>
          </div>
        </div>
        <button onClick={onRemove} style={{ background:"rgba(248,113,113,.15)", color:"#fca5a5", border:"1px solid rgba(248,113,113,.3)", borderRadius:6, padding:"5px 13px", cursor:"pointer", fontSize:12, fontFamily:"inherit", fontWeight:600, flexShrink:0 }}>Remove</button>
      </div>
      <div style={{ padding:"20px 22px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div>
          <label style={{ fontSize:10, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:".06em", display:"block", marginBottom:6 }}>Findings / Report</label>
          <textarea value={rep.findings||""} placeholder="Describe radiological findings here..." onChange={e => updRep(ri,"findings",e.target.value)} rows={5} style={{ width:"100%", background:"var(--surface-2)", border:"1.5px solid var(--border)", borderRadius:8, padding:"10px 12px", color:"var(--text)", fontSize:13, fontFamily:"inherit", outline:"none", resize:"vertical", boxSizing:"border-box" }}/>
        </div>
        <div>
          <label style={{ fontSize:10, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:".06em", display:"block", marginBottom:6 }}>Impression / Conclusion</label>
          <textarea value={rep.impression||""} placeholder="Clinical impression / diagnosis..." onChange={e => updRep(ri,"impression",e.target.value)} rows={5} style={{ width:"100%", background:"var(--surface-2)", border:"1.5px solid var(--border)", borderRadius:8, padding:"10px 12px", color:"var(--text)", fontSize:13, fontFamily:"inherit", outline:"none", resize:"vertical", boxSizing:"border-box" }}/>
        </div>
      </div>
      <div style={{ padding:"12px 22px", borderTop:"1px solid var(--border)", background:"var(--surface-2)", display:"flex", alignItems:"flex-end", gap:16, flexWrap:"wrap" }}>
        <div style={{ flex:1 }}>
          <label style={{ fontSize:10, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:".06em", display:"block", marginBottom:4 }}>Remarks</label>
          <input value={rep.remarks} placeholder="Additional remarks..." onChange={e => updRep(ri,"remarks",e.target.value)} style={{ width:"100%", background:"var(--surface)", border:"1.5px solid var(--border)", borderRadius:8, padding:"8px 12px", color:"var(--text)", fontSize:13, fontFamily:"inherit", outline:"none" }}/>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
          <span style={{ fontSize:12, fontWeight:600, color:"var(--text-muted)", whiteSpace:"nowrap" }}>Amount (₹)</span>
          <input type="number" value={rep.amount} onChange={e => updRep(ri,"amount",Number(e.target.value))} style={{ width:110, background:"var(--surface)", border:"1.5px solid var(--border)", borderRadius:8, padding:"8px 10px", color:"var(--text)", fontSize:13, fontFamily:"inherit", fontWeight:700, outline:"none" }}/>
        </div>
      </div>
    </div>
  );
}

// ─── AdmissionNoteForm ────────────────────────────────────────────────────────
function AdmissionNoteForm({ eMed, setEMed }) {
  const setE = k => e => setEMed(p => ({ ...p, [k]: e.target.value }));
  const inp = (label, key, placeholder) => (
    <div>
      <label style={{ fontSize:10, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:".06em", display:"block", marginBottom:5 }}>{label}</label>
      <input placeholder={placeholder} value={eMed?.[key]||""} onChange={setE(key)} style={{ fontFamily:"inherit", fontSize:13, color:"var(--text)", background:"var(--surface-2)", border:"1.5px solid var(--border)", borderRadius:8, padding:"9px 12px", width:"100%", outline:"none", boxSizing:"border-box" }}/>
    </div>
  );
  const txa = (label, key, placeholder, rows=3) => (
    <div>
      <label style={{ fontSize:10, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:".06em", display:"block", marginBottom:5 }}>{label}</label>
      <textarea placeholder={placeholder} value={eMed?.[key]||""} onChange={setE(key)} rows={rows} style={{ fontFamily:"inherit", fontSize:13, color:"var(--text)", background:"var(--surface-2)", border:"1.5px solid var(--border)", borderRadius:8, padding:"9px 12px", width:"100%", outline:"none", resize:"vertical", boxSizing:"border-box" }}/>
    </div>
  );
  const SBlock = ({ icon, title, children, cols = 2 }) => (
    <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, marginBottom:16, overflow:"hidden" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 18px", borderBottom:"1px solid var(--border)", background:"var(--surface-2)" }}>
        <span style={{ fontSize:16 }}>{icon}</span>
        <div style={{ fontSize:13, fontWeight:700, color:"var(--text)" }}>{title}</div>
      </div>
      <div style={{ padding:18, display:"grid", gridTemplateColumns:`repeat(${cols}, 1fr)`, gap:14 }}>{children}</div>
    </div>
  );
  return (
    <div>
      <SBlock icon="🩺" title="Present Complaints" cols={2}>
        {txa("Present Complaints","presentComplaints","Patient presented in Department of Emergency Medicine...",4)}
        {txa("Chief Complaints","chiefComplaints","Severe pain at Rt. Iliac fossa, fever with chills...",4)}
      </SBlock>
      <SBlock icon="💓" title="Examinations" cols={4}>
        {inp("BP (mmHg)","bp","e.g. 120/80mmHg")}
        {inp("PR (/min)","pr","e.g. 82/min")}
        {inp("SPO2","spo2","e.g. 98% On RA")}
        {inp("TEMP","temp","e.g. 98.6°F")}
        {inp("Chest","chest","e.g. B/L Crepts+")}
        {inp("CVS","cvs","e.g. S1 S2 +")}
        {inp("CNS","cns","e.g. Conscious")}
        {inp("P/A","pa","e.g. Distended")}
      </SBlock>
      <SBlock icon="🔬" title="Investigations & Diagnosis" cols={2}>
        {txa("Investigations / Reports","investigations","CBC, LFT, KFT, USG Abdomen...",3)}
        {txa("Provisional Diagnosis","provisionalDiagnosis","Acute Retention of Urine with ?UTI...",3)}
      </SBlock>
      <SBlock icon="💊" title="Treatment & History" cols={2}>
        {txa("Current Medications","currentMedications","IV Fluids NS/RL @ 100ml/hr, Inj. Esomac 40mg IV BD...",3)}
        {txa("Treatment Advised","treatmentAdvised","IV antibiotics, oral medications, monitoring...",3)}
        {txa("Past History","previousDiagnosis","Diabetes, Hypertension, previous surgeries...",2)}
        {txa("Past Surgeries","pastSurgeries","e.g. Appendectomy 2018...",2)}
        {inp("Treating Doctor","treatingDoctor","Dr. Name (MBBS, MD)")}
        {inp("Known Allergies","knownAllergies","e.g. Penicillin, Sulfa drugs...")}
      </SBlock>
    </div>
  );
}

// ─── MedicineHistoryPicker ────────────────────────────────────────────────────
function MedicineHistoryPicker({ eMed, onAdd }) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(false);
  const historyMeds = eMed?.currentMedications ? eMed.currentMedications.split(", ").filter(Boolean) : [];
  const histFiltered = search.trim() ? historyMeds.filter(m => m.toLowerCase().includes(search.toLowerCase())) : historyMeds;
  if (!expanded) return (
    <div style={{ background:"rgba(16,185,129,0.06)", border:"1.5px dashed rgba(16,185,129,0.4)", borderRadius:10, padding:"10px 16px", marginBottom:14, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
      <span style={{ fontSize:12, fontWeight:600, color:"#10b981" }}>💊 Add from Medical History & Library</span>
      <button onClick={() => setExpanded(true)} style={{ background:"#10b981", color:"#fff", border:"none", borderRadius:7, padding:"5px 14px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Show ▾</button>
    </div>
  );
  return (
    <div style={{ background:"var(--surface)", border:"1.5px solid rgba(16,185,129,0.4)", borderRadius:12, marginBottom:16, overflow:"hidden" }}>
      <div style={{ background:"linear-gradient(135deg,#064e3b,#065f46)", padding:"12px 18px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ fontSize:13, fontWeight:700, color:"#fff" }}>💊 Add Medicines from Medical History & Library</div>
        <button onClick={() => setExpanded(false)} style={{ background:"rgba(255,255,255,.15)", color:"#fff", border:"1px solid rgba(255,255,255,.25)", borderRadius:7, padding:"5px 12px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Hide ▴</button>
      </div>
      <div style={{ padding:"10px 16px", borderBottom:"1px solid rgba(16,185,129,0.2)", background:"rgba(16,185,129,0.04)" }}>
        <input placeholder="Search medicines..." value={search} onChange={e => setSearch(e.target.value)} style={{ width:"100%", fontFamily:"inherit", fontSize:12, border:"1.5px solid rgba(16,185,129,0.4)", borderRadius:8, padding:"7px 12px", outline:"none", color:"var(--text)", background:"var(--surface)", boxSizing:"border-box" }}/>
      </div>
      <div style={{ maxHeight:260, overflowY:"auto", padding:"12px 16px", display:"flex", flexDirection:"column", gap:10 }}>
        {histFiltered.length > 0 && (
          <div>
            <div style={{ fontSize:10, fontWeight:700, color:"#10b981", textTransform:"uppercase", letterSpacing:".08em", marginBottom:7 }}>⭐ From This Patient's Medical History</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {histFiltered.map(med => (
                <button key={med} onClick={() => onAdd(med)} style={{ background:"rgba(16,185,129,0.12)", border:"1.5px solid rgba(16,185,129,0.4)", borderRadius:20, padding:"5px 12px", fontSize:12, color:"#059669", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>+ {med}</button>
              ))}
            </div>
          </div>
        )}
        {MEDICATION_GROUPS.map(grp => {
          const items = search.trim() ? grp.items.filter(m => m.toLowerCase().includes(search.toLowerCase())) : grp.items;
          if (!items.length) return null;
          return (
            <div key={grp.group}>
              <div style={{ fontSize:10, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:".08em", marginBottom:6 }}>{grp.group}</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                {items.map(med => (
                  <button key={med} onClick={() => onAdd(med)} style={{ background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:20, padding:"4px 10px", fontSize:11, color:"var(--text-mid)", fontWeight:500, cursor:"pointer", fontFamily:"inherit" }}>+ {med}</button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  *,*::before,*::after { box-sizing:border-box; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
  @keyframes slideIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:none} }
  ::-webkit-scrollbar { width:4px; height:4px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:var(--border-strong); border-radius:2px; }

  .hod-root { display:flex; height:100dvh; min-height:100vh; background:var(--bg); color:var(--text); font-family:var(--ui-font-sans); overflow:hidden; }

  /* ── Sidebar ── */
  .hod-sb { width:224px; min-width:224px; background:var(--surface); border-right:1px solid var(--border); display:flex; flex-direction:column; transition:width .22s; overflow:hidden; position:relative; z-index:10; min-height:0; }
  .hod-sb.col { width:62px; min-width:62px; }
  .hod-sb-head { padding:16px 14px 16px 16px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; gap:8px; min-height:64px; }
  .hod-logo { width:32px; height:32px; border-radius:8px; background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.3); display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:800; color:#10b981; flex-shrink:0; }
  .hod-col-btn { width:24px; height:24px; border-radius:5px; background:var(--surface-2); border:1px solid var(--border); color:var(--text-muted); cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:11px; flex-shrink:0; }
  .hod-sb-scroll { flex:1; min-height:0; overflow-y:auto; overscroll-behavior:contain; padding-bottom:12px; }
  .hod-slbl { font-size:8px; letter-spacing:.12em; color:var(--text-muted); text-transform:uppercase; padding:12px 16px 5px; white-space:nowrap; overflow:hidden; }

  /* ── FIX: Nav items — proper icon alignment, no clipping ── */
  .hod-nav-item { display:flex; align-items:center; gap:9px; padding:9px 12px 9px 14px; cursor:pointer; background:transparent; border:none; width:100%; text-align:left; font-family:inherit; font-size:12px; color:var(--text-muted); transition:.13s; border-left:3px solid transparent; white-space:nowrap; position:relative; overflow:visible; }
  .hod-nav-item:hover { color:var(--text); background:var(--surface-2); }
  .hod-nav-item.act { color:#10b981; background:rgba(16,185,129,0.08); border-left-color:#10b981; font-weight:600; }

  /* ── FIX: Icon wrapper — bigger, no clipping, properly centred ── */
  .hod-nav-icon { width:30px; height:30px; min-width:30px; min-height:30px; border-radius:7px; display:flex; align-items:center; justify-content:center; flex-shrink:0; overflow:visible; }

  /* Collapsed — centre icon */
  .hod-sb.col .hod-nav-item { padding:10px 0; justify-content:center; border-left:none; border-bottom:2px solid transparent; overflow:visible; }
  .hod-sb.col .hod-nav-item.act { border-bottom-color:#10b981; }
  .hod-sb.col .hod-slbl { padding:10px 0 4px; text-align:center; font-size:7px; }
  .hod-sb.col .hod-sb-mini-stats { flex-direction:column; gap:4px; }

  .hod-sb-mini-stats { display:flex; gap:5px; padding:8px 12px; flex-wrap:wrap; }
  .hod-mini-stat { flex:1; min-width:40px; border-radius:6px; padding:5px 7px; text-align:center; border:1px solid; }
  .hod-sb-footer { margin-top:auto; border-top:1px solid var(--border); padding:12px 14px; display:flex; flex-direction:column; gap:8px; }
  .hod-user-card { display:flex; align-items:center; gap:9px; }
  .hod-avatar { width:30px; height:30px; border-radius:8px; background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.3); display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; color:#10b981; flex-shrink:0; }
  .hod-logout { display:flex; align-items:center; gap:7px; padding:8px 11px; background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2); border-radius:8px; color:#ef4444; font-size:11px; cursor:pointer; font-family:inherit; width:100%; }
  .hod-logout:hover { background:rgba(239,68,68,0.15); }

  /* ── Header ── */
  .hod-hdr { display:flex; align-items:center; justify-content:space-between; padding:0 24px; height:58px; background:var(--surface); border-bottom:1px solid var(--border); position:sticky; top:0; z-index:100; }
  .hod-hdr-right { display:flex; align-items:center; gap:10px; }
  .hod-sync-pill { display:flex; align-items:center; gap:6px; background:var(--surface-2); border:1px solid var(--border); border-radius:20px; padding:4px 11px; font-size:10px; color:#06b6d4; letter-spacing:.06em; }
  .hod-hdr-logout { display:flex; align-items:center; gap:6px; padding:6px 13px; background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.25); border-radius:8px; color:#ef4444; font-size:11px; font-weight:600; cursor:pointer; font-family:inherit; transition:.14s; }
  .hod-hdr-logout:hover { background:rgba(239,68,68,0.18); border-color:rgba(239,68,68,0.5); }

  /* ── Main ── */
  .hod-main { flex:1; display:flex; flex-direction:column; overflow:hidden; min-width:0; min-height:0; }
  .hod-content { flex:1; overflow-y:auto; min-width:0; min-height:0; overscroll-behavior:contain; padding:22px 26px; }

  /* ── Cards & Grids ── */
  .hod-stat-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:12px; margin-bottom:22px; }
  .hod-stat-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:16px 18px; position:relative; overflow:hidden; animation:fadeIn .3s ease; }
  .hod-stat-card::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; }
  .hod-patient-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:14px; }
  .hod-patient-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:18px 20px; cursor:pointer; transition:.18s; animation:fadeIn .25s ease; }
  .hod-patient-card:hover { border-color:rgba(16,185,129,0.5); box-shadow:0 4px 20px rgba(16,185,129,0.1); transform:translateY(-2px); }

  /* ── Badges & Pills ── */
  .hod-badge { display:inline-flex; align-items:center; gap:4px; padding:3px 10px; border-radius:20px; font-size:10px; font-weight:700; white-space:nowrap; border:1px solid; }
  .hod-chip { padding:2px 9px; border-radius:20px; font-size:10px; font-weight:600; background:var(--surface-2); color:var(--text-muted); border:1px solid var(--border); white-space:nowrap; }
  .hod-dept-tag { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:6px; font-size:11px; font-weight:600; }

  /* ── Table ── */
  .hod-table-wrap { background:var(--surface); border:1px solid var(--border); border-radius:12px; overflow:hidden; margin-bottom:20px; }
  .hod-table { width:100%; border-collapse:collapse; font-size:12px; }
  .hod-table th { padding:10px 14px; text-align:left; font-size:9px; letter-spacing:.1em; color:var(--text-muted); text-transform:uppercase; border-bottom:1px solid var(--border); background:var(--surface-2); }
  .hod-table td { padding:10px 14px; border-bottom:1px solid var(--border); color:var(--text-mid); vertical-align:middle; }
  .hod-table tr:last-child td { border-bottom:none; }
  .hod-table tr:hover td { background:var(--surface-2); }

  /* ── Forms ── */
  .hod-inp { background:var(--surface-2); border:1px solid var(--border); border-radius:8px; padding:8px 11px; color:var(--text); font-size:12px; font-family:inherit; outline:none; width:100%; transition:.13s; }
  .hod-inp:focus { border-color:#10b981; background:var(--surface); }
  .hod-sel { background:var(--surface-2); border:1px solid var(--border); border-radius:8px; padding:8px 11px; color:var(--text); font-size:12px; font-family:inherit; outline:none; width:100%; }
  .hod-textarea { background:var(--surface-2); border:1px solid var(--border); border-radius:8px; padding:8px 11px; color:var(--text); font-size:12px; font-family:inherit; outline:none; width:100%; resize:vertical; min-height:70px; }
  .hod-lbl { display:block; font-size:9px; letter-spacing:.1em; color:var(--text-muted); text-transform:uppercase; margin-bottom:5px; font-weight:700; }
  .hod-form-row { margin-bottom:13px; }
  .hod-form-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:12px; }

  /* ── Buttons ── */
  .hod-btn { padding:8px 16px; border-radius:8px; font-size:12px; font-family:inherit; cursor:pointer; border:1px solid; transition:.14s; display:inline-flex; align-items:center; gap:6px; font-weight:600; white-space:nowrap; }
  .hod-btn-primary { background:#10b981; border-color:#10b981; color:#fff; }
  .hod-btn-primary:hover { background:#059669; }
  .hod-btn-primary:disabled { opacity:.4; cursor:not-allowed; }
  .hod-btn-ghost { background:transparent; border-color:var(--border); color:var(--text-muted); }
  .hod-btn-ghost:hover { color:var(--text); border-color:var(--border-strong); }
  .hod-btn-danger { background:rgba(239,68,68,0.1); border-color:rgba(239,68,68,0.3); color:#ef4444; }
  .hod-btn-danger:hover { background:rgba(239,68,68,0.2); }
  .hod-btn-amber { background:rgba(245,158,11,0.1); border-color:rgba(245,158,11,0.3); color:#f59e0b; }
  .hod-btn-blue { background:rgba(99,102,241,0.1); border-color:rgba(99,102,241,0.3); color:#6366f1; }
  .hod-btn-navy { background:#0f172a; border-color:#0f172a; color:#fff; }
  .hod-btn-navy:hover { background:#1e293b; }
  .hod-btn-navy:disabled { opacity:.4; cursor:not-allowed; }

  /* ── Modal ── */
  .hod-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:1000; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px); animation:fadeIn .15s ease; }
  .hod-modal { background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:26px 28px; width:560px; max-width:95vw; max-height:88vh; overflow-y:auto; box-shadow:0 24px 60px rgba(0,0,0,0.5); position:relative; }
  .hod-modal-lg { width:780px; }
  .hod-modal-title { font-size:15px; font-weight:700; color:var(--text); margin-bottom:18px; padding-bottom:14px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:8px; }
  .hod-modal-close { position:absolute; top:14px; right:14px; width:28px; height:28px; border-radius:6px; background:var(--surface-2); border:1px solid var(--border); cursor:pointer; color:var(--text-muted); display:flex; align-items:center; justify-content:center; font-size:13px; }
  .hod-modal-close:hover { background:rgba(239,68,68,0.1); color:#ef4444; }
  .hod-modal-foot { display:flex; gap:10px; justify-content:flex-end; margin-top:18px; padding-top:14px; border-top:1px solid var(--border); }

  /* ── Section ── */
  .hod-section { background:var(--surface); border:1px solid var(--border); border-radius:12px; margin-bottom:16px; overflow:hidden; }
  .hod-section-head { display:flex; align-items:center; justify-content:space-between; padding:13px 18px; border-bottom:1px solid var(--border); background:var(--surface-2); }
  .hod-section-title { font-size:13px; font-weight:700; color:var(--text); display:flex; align-items:center; gap:8px; }
  .hod-section-body { padding:18px; }

  /* ── Filter bar ── */
  .hod-filter-bar { display:flex; gap:10px; flex-wrap:wrap; align-items:center; background:var(--surface); border:1px solid var(--border); border-radius:10px; padding:11px 16px; margin-bottom:18px; }

  /* ── Progress bar ── */
  .hod-progress-track { height:4px; background:var(--border); border-radius:4px; overflow:hidden; }
  .hod-progress-fill { height:100%; border-radius:4px; transition:width .3s; }

  /* ── Patient select list in modal ── */
  .hod-pt-list { background:var(--surface-2); border:1px solid var(--border); border-radius:8px; max-height:200px; overflow-y:auto; margin-top:4px; }
  .hod-pt-item { display:flex; align-items:center; justify-content:space-between; padding:8px 12px; cursor:pointer; border-bottom:1px solid var(--border); transition:.12s; font-size:12px; }
  .hod-pt-item:last-child { border-bottom:none; }
  .hod-pt-item:hover { background:rgba(16,185,129,0.06); }
  .hod-pt-item.sel { background:rgba(16,185,129,0.1); border-left:3px solid #10b981; }
  .hod-selected-pills { display:flex; flex-wrap:wrap; gap:6px; margin-top:8px; }
  .hod-sel-pill { display:inline-flex; align-items:center; gap:5px; background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); color:#10b981; border-radius:20px; padding:3px 10px; font-size:11px; font-weight:600; }
  .hod-sel-pill button { background:none; border:none; color:#10b981; cursor:pointer; font-size:12px; padding:0; opacity:.7; }
  .hod-sel-pill button:hover { opacity:1; }

  /* ── Review card ── */
  .hod-review-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:16px 18px; animation:fadeIn .25s ease; }

  /* ── Toast ── */
  .hod-toasts { position:fixed; bottom:20px; right:20px; z-index:9999; display:flex; flex-direction:column; gap:8px; pointer-events:none; }
  .hod-toast { background:var(--surface); border:1px solid var(--border); border-radius:10px; padding:11px 16px; font-size:12px; font-weight:600; box-shadow:0 8px 30px rgba(0,0,0,0.3); display:flex; align-items:center; gap:8px; animation:fadeIn .2s ease; color:var(--text); }
  .hod-toast.s { border-left:3px solid #10b981; }
  .hod-toast.e { border-left:3px solid #ef4444; }
  .hod-toast.w { border-left:3px solid #f59e0b; }

  /* ── Empty ── */
  .hod-empty { text-align:center; padding:48px 20px; color:var(--text-muted); }
  .hod-empty-ico { font-size:40px; margin-bottom:12px; }

  /* ── Tab bar ── */
  .hod-tabs { display:flex; border-bottom:1px solid var(--border); background:var(--surface); overflow-x:auto; }
  .hod-tab { padding:11px 18px; font-size:12px; font-weight:600; cursor:pointer; border:none; background:none; color:var(--text-muted); font-family:inherit; border-bottom:2px solid transparent; transition:.12s; white-space:nowrap; display:flex; align-items:center; gap:6px; }
  .hod-tab:hover { color:var(--text-mid); }
  .hod-tab.act { color:#10b981; border-bottom-color:#10b981; }
  .hod-tab-dot { width:6px; height:6px; border-radius:50%; background:#10b981; }

  /* ── Dept assignment card ── */
  .hod-dept-assign-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:16px 18px; animation:slideIn .2s ease; }
  .hod-dept-header { display:flex; align-items:center; gap:10px; margin-bottom:12px; }
  .hod-dept-icon-wrap { width:36px; height:36px; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }

  /* ── HOD Billing work (patient detail view) ── */
  .hod-work-root { flex:1; display:flex; flex-direction:column; overflow:hidden; min-width:0; min-height:0; }
  .hod-work-content { flex:1; overflow-y:auto; min-width:0; min-height:0; overscroll-behavior:contain; padding:22px 26px; }
  .hod-checklist { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:18px 20px; margin-bottom:16px; }
  .hod-checklist-steps { display:flex; align-items:center; margin-bottom:16px; }
  .hod-step { display:flex; align-items:center; gap:8px; flex:1; min-width:0; padding:9px 10px; border-radius:9px; cursor:pointer; transition:.13s; }
  .hod-step:hover { background:var(--surface-2); }
  .hod-step.done { background:rgba(16,185,129,0.08); }
  .hod-step.cur { background:rgba(99,102,241,0.08); }
  .hod-step-chk { width:26px; height:26px; border-radius:50%; border:2px solid var(--border-strong); display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:11px; font-weight:700; background:var(--surface); color:var(--text-muted); }
  .hod-step.done .hod-step-chk { background:#10b981; border-color:#10b981; color:#fff; }
  .hod-step.cur .hod-step-chk { border-color:#6366f1; color:#6366f1; }
  .hod-step-lbl { font-size:11px; font-weight:600; color:var(--text-muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .hod-step.done .hod-step-lbl { color:#10b981; }
  .hod-step.cur .hod-step-lbl { color:#6366f1; }
  .hod-step-con { width:14px; height:2px; background:var(--border); flex-shrink:0; }
  .hod-step-con.done { background:#10b981; }
  .hod-patient-hdr { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:20px 24px; margin-bottom:14px; }
  .hod-dod-strip { display:flex; background:var(--surface-2); border-radius:10px; border:1px solid var(--border); overflow:hidden; margin-top:12px; }
  .hod-dod-item { flex:1; padding:10px 16px; display:flex; flex-direction:column; gap:3px; border-right:1px solid var(--border); }
  .hod-dod-item:last-child { border-right:none; }
  .hod-dod-lbl { font-size:9px; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:.07em; }
  .hod-dod-val { font-size:12px; font-weight:700; color:var(--text); }
  .hod-tot-box { margin-top:18px; border-top:2px solid var(--border); padding-top:14px; max-width:360px; margin-left:auto; }
  .hod-tot-row { display:flex; justify-content:space-between; padding:5px 0; font-size:13px; }
  .hod-tot-fin { border-top:2px solid var(--text); margin-top:8px; padding-top:10px; font-size:15px; font-weight:800; color:var(--text); }
  .hod-finp { background:var(--surface-2); border:1.5px solid var(--border); border-radius:8px; padding:9px 12px; color:var(--text); font-size:13px; font-family:inherit; transition:.14s; outline:none; width:100%; }
  .hod-finp:focus { border-color:#10b981; background:var(--surface); }
  .hod-fsel { background:var(--surface-2); border:1.5px solid var(--border); border-radius:8px; padding:9px 12px; color:var(--text); font-size:13px; font-family:inherit; outline:none; width:100%; }
  .hod-ftxt { background:var(--surface-2); border:1.5px solid var(--border); border-radius:8px; padding:9px 12px; color:var(--text); font-size:13px; font-family:inherit; outline:none; width:100%; resize:vertical; min-height:78px; }
  .hod-tinp { background:var(--surface-2); border:1.5px solid var(--border); border-radius:6px; padding:6px 9px; color:var(--text); font-size:12px; font-family:inherit; outline:none; width:100%; }
  .hod-tinp:focus { border-color:#10b981; background:var(--surface); }
  .hod-tsel { background:var(--surface-2); border:1.5px solid var(--border); border-radius:6px; padding:6px 8px; color:var(--text); font-size:12px; font-family:inherit; outline:none; width:100%; }
  .hod-addbtn { display:inline-flex; align-items:center; gap:6px; padding:8px 15px; background:var(--surface-2); border:1.5px dashed var(--border-strong); color:var(--text-muted); border-radius:8px; cursor:pointer; font-size:12px; font-family:inherit; font-weight:600; margin-top:12px; transition:.14s; }
  .hod-addbtn:hover { border-color:#10b981; color:#10b981; background:rgba(16,185,129,0.06); }
  .hod-savebtn { padding:10px 22px; border-radius:8px; font-size:13px; font-weight:700; background:#0f172a; color:#fff; border:none; cursor:pointer; font-family:inherit; transition:.14s; margin-top:4px; }
  .hod-savebtn:hover { background:#1e293b; }
  .hod-bgrid { display:grid; grid-template-columns:1fr 320px; gap:16px; align-items:start; }

  /* ── Logout confirm modal ── */
  .hod-logout-modal { background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:32px 28px; width:380px; max-width:92vw; box-shadow:0 24px 60px rgba(0,0,0,0.5); position:relative; text-align:center; }

  @media(max-width:860px) {
    .hod-sb { display:none; }
    .hod-stat-grid { grid-template-columns:repeat(2,1fr); }
    .hod-patient-grid { grid-template-columns:1fr; }
    .hod-bgrid { grid-template-columns:1fr; }
  }
`;

let _tid = 0;

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HodDashboard({ currentUser, onLogout }) {
  const [activeView,  setActiveView]  = useState("overview");
  const [activeDept,  setActiveDept]  = useState("Billing");
  const [collapsed,   setCollapsed]   = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [toasts,      setToasts]      = useState([]);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Data
  const [allPatients,  setAllPatients]  = useState([]);
  const [employees,    setEmployees]    = useState([]);
  const [tasks,        setTasks]        = useState([]);
  const [hodOwnTasks,  setHodOwnTasks]  = useState([]);
  const [reviews,      setReviews]      = useState([]);
  const [analytics,    setAnalytics]    = useState(null);

  // HOD Own Work state
  const [myWorkView,    setMyWorkView]   = useState("list");
  const [myWorkSel,     setMyWorkSel]    = useState(null);
  const [myActiveTab,   setMyActiveTab]  = useState("discharge");
  const [myShowConfirm, setMyShowConfirm] = useState(false);
  const [myEDis,   setMyEDis]   = useState({});
  const [myEMed,   setMyEMed]   = useState({});
  const [myESvc,   setMyESvc]   = useState([]);
  const [myELabRep,setMyELabRep]= useState([]);
  const [myEMedBill,setMyEMedBill]= useState([]);
  const [myEBilling,setMyEBilling]= useState({});
  const [myESaved,  setMyESaved] = useState({});
  const [myRepFilter,setMyRepFilter]= useState("All");

  // Assignment modal
  const [showAssignModal,  setShowAssignModal]  = useState(false);
  const [assignDept,       setAssignDept]       = useState("Billing");
  const [assignEmployee,   setAssignEmployee]   = useState("");
  const [assignPatients,   setAssignPatients]   = useState([]);
  const [assignPatientIds, setAssignPatientIds] = useState([]);
  const [assignPatientNames,setAssignPatientNames]= useState([]);
  const [assignPriority,   setAssignPriority]   = useState("Medium");
  const [assignDueDate,    setAssignDueDate]     = useState("");
  const [assignNotes,      setAssignNotes]       = useState("");
  const [patientSearch,    setPatientSearch]     = useState("");
  const [deptEmployees,    setDeptEmployees]     = useState([]);

  // Review modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewTarget,    setReviewTarget]    = useState(null);
  const [reviewForm,      setReviewForm]      = useState({ rating:5, comments:"", score:"", period:"weekly" });

  // Submit to admin
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitTarget,    setSubmitTarget]    = useState(null);
  const [submitNote,      setSubmitNote]      = useState("");

  // Filters
  const [filterStatus,   setFilterStatus]   = useState("");
  const [filterEmployee, setFilterEmployee] = useState("");
  const [filterDate,     setFilterDate]     = useState("");
  const [filterRange,    setFilterRange]    = useState("weekly");
  const [searchQ,        setSearchQ]        = useState("");

  // ── Toast ──────────────────────────────────────────────────────────────────
  const toast = useCallback((msg, type = "s") => {
    const id = _tid++;
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3200);
  }, []);

  // ── API helpers ────────────────────────────────────────────────────────────
  const request = useCallback(async (path, options = {}) => {
    setLoading(true); setError(null);
    try {
      return await apiFetch(path, options);
    } catch (e) {
      setError(e.message);
      toast(e.message, "e");
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadAllPatients = useCallback(async () => {
    const data = await request("/patients/");
    if (data) setAllPatients(Array.isArray(data) ? data : data.results || data.patients || []);
  }, [request, currentUser]);

  const loadEmployees = useCallback(async (dept = null) => {
    const q = dept ? `?department=${encodeURIComponent(dept)}` : "";
    const data = await request(`/hod/employees/${q}`);
    if (data) {
      const list = Array.isArray(data) ? data : data.employees || data.results || [];
      const targetDept = String(dept || "").trim().toLowerCase();
      const currentDept = String(currentUser?.department || currentUser?.dept || "").trim().toLowerCase();
      const nextList = [...list];

      if (
        currentUser?.role === "hod" &&
        targetDept &&
        currentDept === targetDept &&
        !nextList.some((employee) => String(employee.id) === String(currentUser.id))
      ) {
        nextList.unshift({
          id: currentUser.id,
          name: currentUser.name || currentUser.full_name || currentUser.username,
          role: currentUser.role,
          employee_code: currentUser.employee_code || currentUser.employeeCode,
          employeeCode: currentUser.employeeCode || currentUser.employee_code,
          email: currentUser.email,
        });
      }

      setEmployees(nextList);
      return nextList;
    }
    return [];
  }, [request, currentUser]);

  const loadTasks = useCallback(async () => {
    const params = new URLSearchParams({ department: activeDept });
    if (filterEmployee) params.append("assigned_to", filterEmployee);
    if (filterDate)     params.append("due_date",    filterDate);
    if (filterStatus)   params.append("status",      filterStatus);
    const data = await request(`/hod/tasks/?${params}`);
    if (data) setTasks(Array.isArray(data) ? data : data.results || data.tasks || []);
  }, [request, activeDept, filterEmployee, filterDate, filterStatus]);

  const loadHodOwnTasks = useCallback(async () => {
    const data = await request("/tasks/my-tasks/");
    if (data) setHodOwnTasks(Array.isArray(data) ? data : data.results || data.tasks || []);
  }, [request]);

  const loadAnalytics = useCallback(async () => {
    const params = new URLSearchParams({ department: activeDept, range: filterRange });
    if (filterEmployee) params.append("employee_id", filterEmployee);
    const data = await request(`/hod/analytics/?${params}`);
    if (data) setAnalytics(data);
  }, [request, activeDept, filterRange, filterEmployee]);

  const loadReviews = useCallback(async () => {
    const data = await request(`/hod/reviews/?department=${encodeURIComponent(activeDept)}`);
    if (data) setReviews(Array.isArray(data) ? data : data.results || data.reviews || []);
  }, [request, activeDept]);

  useEffect(() => {
    loadAllPatients();
    loadEmployees();
    loadTasks();
    loadHodOwnTasks();
  }, []); // eslint-disable-line

  useEffect(() => {
    loadTasks();
    loadEmployees(activeDept).then(list => setDeptEmployees(list));
  }, [activeDept, filterStatus, filterEmployee, filterDate]); // eslint-disable-line

  useEffect(() => {
    if (activeView === "analytics")  loadAnalytics();
    if (activeView === "reviews")    loadReviews();
    if (activeView === "employees")  loadEmployees(activeDept).then(list => setDeptEmployees(list));
  }, [activeView, activeDept, filterRange]); // eslint-disable-line

  // ── Derived ────────────────────────────────────────────────────────────────
  const assignedUhids = new Set(tasks.flatMap(t => t.patient_uhids || (t.patient_uhid ? [t.patient_uhid] : [])));
  const unassignedPatients = allPatients.filter(p => !assignedUhids.has(p.uhid));

  const filteredPatientSearch = allPatients.filter(p =>
    !patientSearch ||
    p.patientName?.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.uhid?.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const pendingCount   = tasks.filter(t => t.status === "pending").length;
  const overdueCount   = tasks.filter(t => t.status === "overdue").length;
  const completedCount = tasks.filter(t => t.status === "completed").length;
  const submittedCount = tasks.filter(t => t.status === "submitted").length;

  const deptColor = DEPT_META[activeDept]?.color || "#10b981";

  // ── Assignment handlers ────────────────────────────────────────────────────
  const openAssignModal = async (dept = activeDept, preselectedEmployeeId = "") => {
    setAssignDept(dept);
    setAssignPatients([]);
    setAssignPatientIds([]);
    setAssignPatientNames([]);
    setAssignEmployee(preselectedEmployeeId ? String(preselectedEmployeeId) : "");
    setAssignNotes("");
    setAssignDueDate("");
    setAssignPriority("Medium");
    setPatientSearch("");
    const list = await loadEmployees(dept);
    setDeptEmployees(list);
    if (preselectedEmployeeId && !list.some((employee) => String(employee.id) === String(preselectedEmployeeId))) {
      setAssignEmployee("");
    }
    setShowAssignModal(true);
  };

  const toggleAssignPatient = p => {
    const isSelected = assignPatients.includes(p.uhid);
    if (isSelected) {
      const idx = assignPatients.indexOf(p.uhid);
      setAssignPatients(prev => prev.filter(u => u !== p.uhid));
      setAssignPatientIds(prev => prev.filter((_, i) => i !== idx));
      setAssignPatientNames(prev => prev.filter((_, i) => i !== idx));
    } else if (assignPatients.length < 8) {
      setAssignPatients(prev => [...prev, p.uhid]);
      setAssignPatientIds(prev => [...prev, p.id]);
      setAssignPatientNames(prev => [...prev, p.patientName || p.name]);
    } else {
      toast("Maximum 8 patients per assignment", "w");
    }
  };

  // ── FIX: 400 error — clean payload, no duplicate keys, NaN guard ──────────
  const handleAssign = async () => {
    if (!assignEmployee)             { toast("Select an employee", "w"); return; }
    if (assignPatients.length === 0) { toast("Select at least one patient", "w"); return; }

    // Guard against NaN from parseInt on empty string
    const empId = parseInt(assignEmployee, 10);
    if (isNaN(empId)) { toast("Invalid employee selected", "w"); return; }

    // Build a clean payload — no duplicate fields, no undefined values
    const payload = {
      department:  assignDept,
      assigned_to: empId,
      patient_ids: assignPatientIds,   // single authoritative field
      title:       `${assignDept} — ${assignPatients.length} patient(s)`,
      priority:    assignPriority,
    };

    // Only append optional fields when they actually have values
    if (assignDueDate.trim()) payload.due_date = assignDueDate;
    if (assignNotes.trim())   payload.notes    = assignNotes;

    const data = await request("/tasks/bulk-assign/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (data) {
      toast(`Assigned ${assignPatients.length} patient(s) to ${assignDept}`);
      setShowAssignModal(false);
      loadTasks();
    }
  };

  // ── HOD own work — open patient ────────────────────────────────────────────
  const openMyWork = (p) => {
    setMyWorkSel(p);
    setMyEDis({ doa: p.doa||p.dateTime||"", dod: p.dod||"", ward: p.ward||p.wardName||"", bed: p.bed||p.bedNo||"", doctor: p.doctor||p.doctorName||"", diagnosis: p.diagnosis||"", ...( p.discharge||{}) });
    setMyEMed({ ...(p.medicalHistory||{}) });
    setMyESvc([]);
    setMyELabRep([]);
    setMyEMedBill([]);
    setMyEBilling({ insuranceType:"Self Pay", discount:0, advance:0, paidNow:0, paymentMode:"Cash", ...(p.billing||{}) });
    setMyESaved({ discharge:false, admission:false, reports:false, medicines:false, billing:false });
    setMyRepFilter("All");
    setMyActiveTab("discharge");
    setMyWorkView("patient");
  };

  // ── Save a section ─────────────────────────────────────────────────────────
  const saveMySection = async (sectionKey, label) => {
    if (!myWorkSel) return;
    try {
      if (myActiveTab === "discharge") {
        await apiFetch(`/patients/${myWorkSel.uhid}/admissions/${myWorkSel.admNo||myWorkSel.id}/discharge/`, { method:"POST", body:JSON.stringify(myEDis) });
      } else if (myActiveTab === "medical") {
        await apiFetch(`/patients/${myWorkSel.uhid}/admissions/${myWorkSel.admNo||myWorkSel.id}/medical-history/`, { method:"POST", body:JSON.stringify(myEMed) });
      } else if (myActiveTab === "reports") {
        await apiFetch(`/patients/${myWorkSel.uhid}/admissions/${myWorkSel.admNo||myWorkSel.id}/lab-reports/bulk/`, { method:"POST", body:JSON.stringify(myELabRep) });
      } else if (myActiveTab === "med_bill") {
        await apiFetch(`/patients/${myWorkSel.uhid}/admissions/${myWorkSel.admNo||myWorkSel.id}/pharmacy/bulk/`, { method:"POST", body:JSON.stringify(myEMedBill) });
      } else if (myActiveTab === "finalbill") {
        await apiFetch(`/patients/${myWorkSel.uhid}/admissions/${myWorkSel.admNo||myWorkSel.id}/billing/`, { method:"POST", body:JSON.stringify({ services:myESvc, billing:myEBilling }) });
      }
      const nextSaved = { ...myESaved, [sectionKey]: true };
      setMyESaved(nextSaved);
      toast(`${label} saved ✓`);
    } catch (err) {
      toast(`Failed to save ${label}`, "e");
    }
  };

  // ── Submit my work to admin ────────────────────────────────────────────────
  const submitMyWork = async () => {
    if (!myWorkSel) return;
    try {
      const existingTask = hodOwnTasks.find(t => t.patient_uhid === myWorkSel.uhid);
      if (existingTask) {
        await apiFetch(`/tasks/${existingTask.id}/update-status/`, { method:"POST", body:JSON.stringify({ status:"submitted", note: submitNote }) });
      } else {
        await apiFetch("/hod/tasks/", { method:"POST", body:JSON.stringify({ department:activeDept, patient:myWorkSel.id, title:`HOD Work — ${myWorkSel.patientName||myWorkSel.name}`, status:"submitted", notes:submitNote }) });
      }
      toast("Submitted to Admin Management ✓");
      setMyShowConfirm(false);
      setMyWorkView("list");
      loadHodOwnTasks();
    } catch (err) {
      toast("Failed to submit", "e");
    }
  };

  // ── Report helpers ─────────────────────────────────────────────────────────
  const updMyRep  = (ri, k, v) => setMyELabRep(p => { const n = JSON.parse(JSON.stringify(p)); n[ri][k] = v; return n; });
  const updMyTest = (ri, ti, k, v) => setMyELabRep(p => { const n = JSON.parse(JSON.stringify(p)); n[ri].tests[ti][k] = v; return n; });
  const addMyTest = ri => setMyELabRep(p => { const n = JSON.parse(JSON.stringify(p)); n[ri].tests.push({ id:Date.now(), name:"", value:"", unit:"", refRange:"", status:"Normal" }); return n; });
  const delMyTest = (ri, ti) => setMyELabRep(p => { const n = JSON.parse(JSON.stringify(p)); n[ri].tests.splice(ti,1); return n; });
  const updMySvc  = (i, k, v) => setMyESvc(prev => { const n=[...prev]; n[i]={...n[i],[k]:v}; if(k==="qty"||k==="rate") n[i].amount=Number(n[i].qty||0)*Number(n[i].rate||0); return n; });

  const addMedFromPicker = (medName) => {
    setMyEMedBill(p => [...p, { id:Date.now(), item:medName, date:new Date().toISOString().slice(0,10), amount:0 }]);
    toast(`Added: ${medName.slice(0,40)}${medName.length>40?"…":""}`);
  };

  // ── Review ─────────────────────────────────────────────────────────────────
  const openReview = (task, employee) => {
    setReviewTarget({ task, employee });
    setReviewForm({ rating:5, comments:"", score:"", period:"weekly" });
    setShowReviewModal(true);
  };
  const submitReview = async () => {
    if (!reviewTarget) return;
    const data = await request("/hod/reviews/", {
      method: "POST",
      body: JSON.stringify({ ...reviewForm, department:activeDept, employee_id:reviewForm.employeeId||reviewTarget.employee?.id||reviewTarget.task?.assigned_to, task_id:reviewTarget.task?.id, performance_score:reviewForm.score }),
    });
    if (data) { toast("Review submitted ✓"); setShowReviewModal(false); loadReviews(); }
  };

  const openSubmitToAdmin = target => { setSubmitTarget(target); setSubmitNote(""); setShowSubmitModal(true); };
  const confirmSubmitToAdmin = async () => {
    if (!submitTarget) return;
    const data = await request(`/tasks/${submitTarget.id}/update-status/`, { method:"POST", body:JSON.stringify({ status:"submitted", note:submitNote }) });
    if (data) { toast("Submitted to Admin Management ✓"); setShowSubmitModal(false); setSubmitTarget(null); loadTasks(); loadHodOwnTasks(); }
  };
  const updateTaskStatus = async (id, status) => {
    const data = await request(`/tasks/${id}/update-status/`, { method:"POST", body:JSON.stringify({ status }) });
    if (data) { toast(`Status → ${status}`); loadTasks(); }
  };

  // ── Render helpers ─────────────────────────────────────────────────────────
  const StatusBadge = ({ status }) => {
    const m = STATUS_META[status] || STATUS_META.pending;
    return <span className="hod-badge" style={{ background:m.bg, color:m.text, borderColor:m.border }}>{m.label}</span>;
  };
  const PriorityBadge = ({ priority }) => {
    const m = PRIORITY_META[priority] || PRIORITY_META.Medium;
    return <span className="hod-badge" style={{ background:m.bg, color:m.color, borderColor:m.color+"40" }}>{priority}</span>;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // ── Sidebar
  // ─────────────────────────────────────────────────────────────────────────
  const VIEWS = [
    { id:"overview",   label:"Overview",         icon:Activity },
    { id:"assign",     label:"Assign Tasks",      icon:CheckSquare },
    { id:"my-work",    label:"My Own Work",       icon:FileText },
    { id:"dept-tasks", label:"Department Tasks",  icon:ClipboardList },
    { id:"analytics",  label:"Analytics",         icon:BarChart3 },
    { id:"reviews",    label:"Reviews",           icon:Star },
    { id:"employees",  label:"Employees",         icon:Users },
  ];

  const renderSidebar = () => (
    <aside className={`hod-sb${collapsed ? " col" : ""}`}>
      <div className="hod-sb-head">
        {!collapsed && (
          <div style={{ flex:1, overflow:"hidden" }}>
            <div style={{ fontSize:8, letterSpacing:".12em", color:deptColor, textTransform:"uppercase", marginBottom:2 }}>HOD Panel</div>
            <div style={{ fontSize:14, fontWeight:700, color:"var(--text)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{currentUser?.name || "Head of Dept"}</div>
          </div>
        )}
        {collapsed && <div className="hod-logo">H</div>}
        <button className="hod-col-btn" onClick={() => setCollapsed(c => !c)}>{collapsed ? "»" : "«"}</button>
      </div>

      <div className="hod-sb-scroll">
        {!collapsed && (
          <div className="hod-sb-mini-stats">
            {[{ val:pendingCount, col:"#f59e0b", lbl:"Pend" }, { val:overdueCount, col:"#ef4444", lbl:"Over" }, { val:completedCount, col:"#10b981", lbl:"Done" }].map((s,i) => (
              <div key={i} className="hod-mini-stat" style={{ background:`${s.col}10`, borderColor:`${s.col}25` }}>
                <div style={{ fontSize:15, fontWeight:800, color:s.col }}>{s.val}</div>
                <div style={{ fontSize:8, color:"var(--text-muted)", letterSpacing:".08em", textTransform:"uppercase", marginTop:1 }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        )}

        <div className="hod-slbl">{collapsed ? "DEPT" : "Departments"}</div>
        {DEPARTMENTS.map(dept => {
          const meta = DEPT_META[dept] || {};
          const Icon = meta.icon;
          return (
            <button key={dept}
              className={`hod-nav-item${activeDept === dept && activeView === "dept-tasks" ? " act" : ""}`}
              style={{ borderLeftColor: activeDept === dept && activeView === "dept-tasks" ? meta.color : "transparent" }}
              onClick={() => { setActiveDept(dept); setActiveView("dept-tasks"); setMyWorkView("list"); }}>
              <div className="hod-nav-icon" style={{
                background: `${meta.color || "#64748b"}18`,
                color: meta.color || "#64748b",
              }}>
                {Icon && <Icon size={15} strokeWidth={1.8} style={{ display:"block", color: meta.color || "#64748b" }}/>}
              </div>
              {!collapsed && <span style={{ flex:1 }}>{dept}</span>}
            </button>
          );
        })}

        <div className="hod-slbl">{collapsed ? "NAV" : "Navigation"}</div>
        {VIEWS.map(v => {
          const Icon = v.icon;
          return (
            <button key={v.id}
              className={`hod-nav-item${activeView === v.id ? " act" : ""}`}
              onClick={() => { setActiveView(v.id); if (v.id !== "my-work") setMyWorkView("list"); }}>
              <div className="hod-nav-icon" style={{
                background: activeView === v.id ? "rgba(16,185,129,0.15)" : "var(--surface-2)",
                color: activeView === v.id ? "#10b981" : "var(--text-muted)",
              }}>
                {Icon && <Icon size={15} strokeWidth={1.8} style={{ display:"block" }}/>}
              </div>
              {!collapsed && v.label}
            </button>
          );
        })}
      </div>

      <div className="hod-sb-footer">
        {!collapsed && currentUser && (
          <div className="hod-user-card">
            <div className="hod-avatar">{initials(currentUser.name)}</div>
            <div style={{ overflow:"hidden" }}>
              <div style={{ fontSize:12, fontWeight:600, color:"var(--text)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{currentUser.name}</div>
              <div style={{ fontSize:9, color:"var(--text-muted)", letterSpacing:".06em", textTransform:"uppercase" }}>HOD · {currentUser.department || activeDept}</div>
            </div>
          </div>
        )}
        <button className="hod-logout" onClick={() => setShowLogoutConfirm(true)}>
          <LogOut size={13} strokeWidth={1.8}/>
          {!collapsed && "Logout"}
        </button>
      </div>
    </aside>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // ── Header
  // ─────────────────────────────────────────────────────────────────────────
  const renderHeader = () => (
    <header className="hod-hdr">
      <div>
        <div style={{ fontSize:9, letterSpacing:".1em", color:"var(--text-muted)", textTransform:"uppercase" }}>
          HOD Dashboard / {activeDept}
          {activeView === "my-work" && myWorkView === "patient" && myWorkSel && (
            <span style={{ color:"#6366f1" }}> / {myWorkSel.patientName || myWorkSel.name}</span>
          )}
        </div>
        <div style={{ fontSize:16, fontWeight:700, color:"var(--text)" }}>
          {activeView === "my-work" && myWorkView === "patient"
            ? `Working on: ${myWorkSel?.patientName || myWorkSel?.name || ""}`
            : VIEWS.find(v => v.id === activeView)?.label || activeDept + " Department"
          }
        </div>
      </div>
      <div className="hod-hdr-right">
        {loading && (
          <div className="hod-sync-pill">
            <div style={{ width:6, height:6, borderRadius:"50%", background:"#06b6d4", animation:"pulse 1s infinite" }}/>
            SYNCING
          </div>
        )}
        <button className="hod-btn hod-btn-ghost" onClick={() => { loadTasks(); loadAllPatients(); loadHodOwnTasks(); }}>
          <RefreshCw size={13} strokeWidth={1.8}/>
        </button>
        <ThemeModeDock variant="inline"/>
        <button className="hod-hdr-logout" onClick={() => setShowLogoutConfirm(true)}>
          <LogOut size={13} strokeWidth={1.8}/>
          Logout
        </button>
      </div>
    </header>
  );

  // ── Logout confirm modal ───────────────────────────────────────────────────
  const renderLogoutConfirm = () => (
    <div className="hod-overlay" onClick={() => setShowLogoutConfirm(false)}>
      <div className="hod-logout-modal" onClick={e => e.stopPropagation()}>
        <div style={{ fontSize:38, marginBottom:12 }}>👋</div>
        <div style={{ fontSize:16, fontWeight:700, color:"var(--text)", marginBottom:6 }}>Sign out?</div>
        <div style={{ fontSize:12, color:"var(--text-muted)", marginBottom:24, lineHeight:1.6 }}>
          You will be signed out of the HOD panel.<br/>
          Any unsaved changes will be lost.
        </div>
        <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
          <button className="hod-btn hod-btn-ghost" style={{ minWidth:100 }} onClick={() => setShowLogoutConfirm(false)}>
            Cancel
          </button>
          <button
            className="hod-btn hod-btn-danger"
            style={{ minWidth:100 }}
            onClick={() => { setShowLogoutConfirm(false); onLogout(); }}
          >
            <LogOut size={13} strokeWidth={1.8}/> Sign Out
          </button>
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // ── View: Overview
  // ─────────────────────────────────────────────────────────────────────────
  const renderOverview = () => {
    const deptSummary = DEPARTMENTS.map(dept => ({
      dept,
      total:     tasks.filter(t => t.department === dept).length,
      pending:   tasks.filter(t => t.department === dept && t.status === "pending").length,
      completed: tasks.filter(t => t.department === dept && t.status === "completed").length,
      overdue:   tasks.filter(t => t.department === dept && t.status === "overdue").length,
    }));
    return (
      <div>
        <div className="hod-stat-grid">
          {[
            { label:"Total Patients",   val:allPatients.length,          col:"#10b981" },
            { label:"Tasks Assigned",   val:tasks.length,                col:"#3b82f6" },
            { label:"Pending",          val:pendingCount,                col:"#f59e0b" },
            { label:"Completed",        val:completedCount,              col:"#10b981" },
            { label:"Overdue",          val:overdueCount,                col:"#ef4444" },
            { label:"Submitted",        val:submittedCount,              col:"#6366f1" },
            { label:"My Own Tasks",     val:hodOwnTasks.length,          col:"#a78bfa" },
            { label:"Unassigned Pts",   val:unassignedPatients.length,   col:"#f97316" },
          ].map((s,i) => (
            <div key={i} className="hod-stat-card" style={{ "--col":s.col }}>
              <style>{`.hod-stat-card:nth-child(${i+1})::before{background:${s.col}}`}</style>
              <div style={{ fontSize:26, fontWeight:800, color:s.col, marginBottom:4 }}>{s.val}</div>
              <div style={{ fontSize:11, color:"var(--text-muted)" }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="hod-section">
          <div className="hod-section-head">
            <div className="hod-section-title">📊 Department Summary</div>
            <button className="hod-btn hod-btn-primary" onClick={() => openAssignModal()}>+ Assign Task</button>
          </div>
          <div className="hod-table-wrap" style={{ margin:0, borderRadius:0, border:"none" }}>
            <table className="hod-table">
              <thead><tr>{["Department","Total","Pending","Completed","Overdue","Action"].map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {deptSummary.map(d => {
                  const meta = DEPT_META[d.dept] || {};
                  const Icon = meta.icon;
                  return (
                    <tr key={d.dept}>
                      <td>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ width:30, height:30, borderRadius:7, background:`${meta.color||"#64748b"}15`, border:`1px solid ${meta.color||"#64748b"}25`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                            {Icon && <Icon size={14} strokeWidth={1.8} style={{ color:meta.color||"#64748b", display:"block" }}/>}
                          </div>
                          <span style={{ fontWeight:600, color:"var(--text)" }}>{d.dept}</span>
                        </div>
                      </td>
                      <td><strong>{d.total}</strong></td>
                      <td><span style={{ color:"#f59e0b", fontWeight:600 }}>{d.pending}</span></td>
                      <td><span style={{ color:"#10b981", fontWeight:600 }}>{d.completed}</span></td>
                      <td><span style={{ color:"#ef4444", fontWeight:600 }}>{d.overdue}</span></td>
                      <td>
                        <div style={{ display:"flex", gap:6 }}>
                          <button className="hod-btn hod-btn-ghost" style={{ padding:"4px 10px", fontSize:"10px" }} onClick={() => { setActiveDept(d.dept); setActiveView("dept-tasks"); }}>View</button>
                          <button className="hod-btn hod-btn-primary" style={{ padding:"4px 10px", fontSize:"10px" }} onClick={() => openAssignModal(d.dept)}>Assign</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {unassignedPatients.length > 0 && (
          <div className="hod-section" style={{ marginTop:18 }}>
            <div className="hod-section-head">
              <div className="hod-section-title"><span style={{ color:"#f97316" }}>⚠</span> Unassigned Patients ({unassignedPatients.length})</div>
              <button className="hod-btn hod-btn-amber" onClick={() => openAssignModal()}>Assign Now</button>
            </div>
            <div className="hod-table-wrap" style={{ margin:0, borderRadius:0, border:"none" }}>
              <table className="hod-table">
                <thead><tr>{["Patient","UHID","Ward","DOA","Status","Action"].map(h => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {unassignedPatients.slice(0, 8).map(p => (
                    <tr key={p.uhid}>
                      <td style={{ color:"var(--text)", fontWeight:600 }}>{p.patientName||p.name}</td>
                      <td style={{ fontFamily:"monospace", fontSize:11 }}>{p.uhid}</td>
                      <td>{p.ward||"—"}</td>
                      <td style={{ fontSize:11 }}>{fmtDt(p.doa||p.dateTime)}</td>
                      <td><StatusBadge status={p.dod?"completed":"pending"}/></td>
                      <td>
                        <div style={{ display:"flex", gap:6 }}>
                          <button className="hod-btn hod-btn-primary" style={{ padding:"4px 10px", fontSize:"10px" }}
                            onClick={() => { setAssignPatients([p.uhid]); setAssignPatientIds([p.id]); setAssignPatientNames([p.patientName||p.name]); openAssignModal(); }}>Assign</button>
                          <button className="hod-btn hod-btn-ghost" style={{ padding:"4px 10px", fontSize:"10px" }}
                            onClick={() => { setActiveView("my-work"); openMyWork(p); }}>Work Myself</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // ── View: Assign Tasks
  // ─────────────────────────────────────────────────────────────────────────
  const renderAssign = () => (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:700, color:"var(--text)" }}>Assign Tasks to Departments</div>
          <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:3 }}>Assign multiple patients (up to 8) to any department employee</div>
        </div>
        <button className="hod-btn hod-btn-primary" onClick={() => openAssignModal()}>+ New Assignment</button>
      </div>
      <div className="hod-filter-bar">
        <Search size={14} strokeWidth={1.8} style={{ color:"var(--text-muted)" }}/>
        <input className="hod-inp" style={{ maxWidth:280 }} placeholder="Search patients…" value={searchQ} onChange={e => setSearchQ(e.target.value)}/>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
        {DEPARTMENTS.map(dept => {
          const meta = DEPT_META[dept] || {};
          const Icon = meta.icon;
          const deptPts = tasks.filter(t => t.department === dept);
          const empCount = employees.filter(e => e.department === dept || e.dept === dept).length;
          return (
            <div key={dept} className="hod-dept-assign-card">
              <div className="hod-dept-header">
                <div className="hod-dept-icon-wrap" style={{ background:`${meta.color||"#64748b"}15`, border:`1px solid ${meta.color||"#64748b"}25` }}>
                  {Icon && <Icon size={16} strokeWidth={1.8} style={{ color:meta.color||"#64748b", display:"block" }}/>}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"var(--text)" }}>{dept}</div>
                  <div style={{ fontSize:10, color:"var(--text-muted)", marginTop:1 }}>{meta.desc}</div>
                </div>
                <button className="hod-btn hod-btn-primary" style={{ padding:"5px 12px", fontSize:"10px" }} onClick={() => openAssignModal(dept)}>Assign</button>
              </div>
              <div style={{ display:"flex", gap:14, marginBottom:10 }}>
                {[{ label:"Employees", val:empCount, col:meta.color||"#64748b" }, { label:"Tasks", val:deptPts.length, col:"#3b82f6" }, { label:"Done", val:deptPts.filter(t=>t.status==="completed").length, col:"#10b981" }].map((s,i) => (
                  <div key={i} style={{ textAlign:"center" }}>
                    <div style={{ fontSize:18, fontWeight:800, color:s.col }}>{s.val}</div>
                    <div style={{ fontSize:9, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:".07em" }}>{s.label}</div>
                  </div>
                ))}
              </div>
              {deptPts.length > 0 && (
                <div>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"var(--text-muted)", marginBottom:4 }}>
                    <span>Progress</span>
                    <span>{Math.round((deptPts.filter(t=>t.status==="completed").length/deptPts.length)*100)}%</span>
                  </div>
                  <div className="hod-progress-track">
                    <div className="hod-progress-fill" style={{ width:`${(deptPts.filter(t=>t.status==="completed").length/deptPts.length)*100}%`, background:meta.color||"#10b981" }}/>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // ── View: My Own Work — LIST
  // ─────────────────────────────────────────────────────────────────────────
  const renderMyWorkList = () => (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:700, color:"var(--text)" }}>My Own Work</div>
          <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:3 }}>Patients you are personally handling — billing, notes, discharge, reports</div>
        </div>
      </div>
      <div className="hod-section" style={{ marginBottom:18 }}>
        <div className="hod-section-head">
          <div className="hod-section-title">📋 Unassigned Patients — Handle Personally</div>
          <button className="hod-btn hod-btn-ghost" onClick={loadAllPatients}><RefreshCw size={12}/> Refresh</button>
        </div>
        {unassignedPatients.length === 0 ? (
          <div className="hod-empty"><div className="hod-empty-ico">✅</div><div>All patients are assigned to department staff.</div></div>
        ) : (
          <div className="hod-patient-grid" style={{ padding:16 }}>
            {unassignedPatients.map(p => (
              <div key={p.uhid} className="hod-patient-card" onClick={() => openMyWork(p)}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:"var(--text)" }}>{p.patientName||p.name}</div>
                    <div style={{ fontSize:10, fontFamily:"monospace", color:"var(--text-muted)", marginTop:2 }}>{p.uhid}</div>
                  </div>
                  <StatusBadge status={p.dod?"completed":"pending"}/>
                </div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
                  {p.ward&&<span className="hod-chip">🛏 {p.ward}</span>}
                  {p.doctor&&<span className="hod-chip">👨‍⚕️ {p.doctor}</span>}
                  {p.ageYY&&<span className="hod-chip">{p.ageYY}y {p.gender?.[0]}</span>}
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button className="hod-btn hod-btn-primary" style={{ flex:1 }} onClick={e => { e.stopPropagation(); openMyWork(p); }}><FileText size={12}/> Work on This</button>
                  <button className="hod-btn hod-btn-ghost" style={{ flex:1 }} onClick={e => { e.stopPropagation(); openAssignModal(); }}><Send size={12}/> Assign</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="hod-section">
        <div className="hod-section-head"><div className="hod-section-title">📁 My Task History</div></div>
        {hodOwnTasks.length === 0 ? (
          <div className="hod-empty"><div className="hod-empty-ico">📂</div><div>No tasks recorded yet.</div></div>
        ) : (
          <div className="hod-table-wrap" style={{ margin:0, borderRadius:0, border:"none" }}>
            <table className="hod-table">
              <thead><tr>{["Patient","UHID","Priority","Status","Due","Action"].map(h=><th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {hodOwnTasks.map(t => (
                  <tr key={t.id}>
                    <td style={{ color:"var(--text)", fontWeight:600 }}>{t.patient_name}</td>
                    <td style={{ fontFamily:"monospace", fontSize:11 }}>{t.patient_uhid}</td>
                    <td><PriorityBadge priority={t.priority||"Medium"}/></td>
                    <td><StatusBadge status={t.status}/></td>
                    <td style={{ fontSize:11 }}>{fmtDt(t.due_date)}</td>
                    <td>
                      <div style={{ display:"flex", gap:6 }}>
                        {t.status !== "submitted" && (
                          <>
                            <button className="hod-btn hod-btn-ghost" style={{ padding:"4px 10px", fontSize:"10px" }}
                              onClick={() => openMyWork({ uhid:t.patient_uhid, patientName:t.patient_name, id:t.patient, admNo:t.admNo||"", doa:"", ward:"", ...( t.extra_data||{}) })}>
                              Continue
                            </button>
                            <button className="hod-btn hod-btn-blue" style={{ padding:"4px 10px", fontSize:"10px" }}
                              onClick={() => openSubmitToAdmin({ id:t.id, type:"own", name:t.patient_name })}>
                              Submit
                            </button>
                          </>
                        )}
                        {t.status === "submitted" && <span style={{ fontSize:11, color:"#6366f1", fontWeight:600 }}>✓ Submitted</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // ── View: My Own Work — PATIENT DETAIL
  // ─────────────────────────────────────────────────────────────────────────
  const renderMyWorkPatient = () => {
    if (!myWorkSel) return null;
    const p = myWorkSel;
    const patientName = p.patientName || p.name || "";
    const pathReps = myELabRep.filter(r => !isRadiologyType(r.reportType));
    const radReps  = myELabRep.filter(r =>  isRadiologyType(r.reportType));
    const pathTotal = pathReps.reduce((a,r) => a+Number(r.amount||0), 0);
    const radTotal  = radReps.reduce((a,r)  => a+Number(r.amount||0), 0);
    const repFilterOptions = ["All", "🧪 Pathology", "🩻 Radiology", ...Array.from(new Set(myELabRep.map(r => r.reportType)))];
    const visibleReps = myELabRep.filter(r => {
      if (myRepFilter === "All") return true;
      if (myRepFilter === "🧪 Pathology") return !isRadiologyType(r.reportType);
      if (myRepFilter === "🩻 Radiology") return  isRadiologyType(r.reportType);
      return r.reportType === myRepFilter;
    });
    const totals    = calcTotals(myESvc, myELabRep, myEMedBill, myEBilling);
    const allSaved  = SECTION_KEYS.every(k => myESaved[k]);
    const savedCount= SECTION_KEYS.filter(k => myESaved[k]).length;

    const TABS = [
      { id:"discharge", sKey:"discharge", lbl:"Discharge Summary", ico:"📋" },
      { id:"medical",   sKey:"admission", lbl:"Admission Note",    ico:"🩺" },
      { id:"reports",   sKey:"reports",   lbl:"Reports",           ico:"🗂️" },
      { id:"med_bill",  sKey:"medicines", lbl:"Medicine Bill",     ico:"💊" },
      { id:"finalbill", sKey:"billing",   lbl:"Final Bill",        ico:"🧾" },
    ];

    return (
      <>
        <button className="hod-btn hod-btn-ghost" style={{ marginBottom:14 }} onClick={() => setMyWorkView("list")}>
          ← Back to My Work List
        </button>

        <div className="hod-patient-hdr">
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, flexWrap:"wrap", marginBottom:8 }}>
            <div>
              <div style={{ fontSize:22, fontWeight:800, color:"var(--text)", marginBottom:3 }}>{patientName}</div>
              <div style={{ fontSize:13, color:"var(--text-mid)" }}>UHID: <strong style={{ color:"var(--text)" }}>{p.uhid}</strong> &nbsp;·&nbsp; Adm: <strong style={{ color:"var(--text)" }}>{p.admNo||"—"}</strong> &nbsp;·&nbsp; {p.ageYY||p.age||"—"} yrs · {p.gender||""} &nbsp;·&nbsp; {p.phone||""}</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:10 }}>
            {p.ward&&<span className="hod-badge" style={{ background:"rgba(6,182,212,0.1)", color:"#06b6d4", borderColor:"rgba(6,182,212,0.3)" }}>🛏 {p.ward}</span>}
            {p.doctor&&<span className="hod-badge" style={{ background:"rgba(6,182,212,0.1)", color:"#06b6d4", borderColor:"rgba(6,182,212,0.3)" }}>👨‍⚕️ {p.doctor}</span>}
            <StatusBadge status={p.dod?"completed":"pending"}/>
          </div>
          <div className="hod-dod-strip">
            <div className="hod-dod-item"><div className="hod-dod-lbl">Date of Admission</div><div className="hod-dod-val">{fmtDt(p.doa||p.dateTime)}</div></div>
            <div className="hod-dod-item"><div className="hod-dod-lbl">Expected Discharge</div><div className="hod-dod-val" style={{ color:"#f59e0b" }}>{myEDis.expectedDod?fmtDt(myEDis.expectedDod):"Not set"}</div></div>
            <div className="hod-dod-item"><div className="hod-dod-lbl">Actual Discharge</div><div className="hod-dod-val" style={{ color:"#10b981" }}>{p.dod?fmtDt(p.dod):"Not yet discharged"}</div></div>
            <div className="hod-dod-item"><div className="hod-dod-lbl">Diagnosis</div><div className="hod-dod-val" style={{ color:"#3b82f6" }}>{p.diagnosis||myEDis.diagnosis||"—"}</div></div>
          </div>
        </div>

        <div className="hod-checklist">
          <div style={{ fontSize:10, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:".09em", marginBottom:14 }}>Task Checklist — save all 5 sections then submit to Admin Management</div>
          <div className="hod-checklist-steps">
            {SECTION_KEYS.map((k, idx) => (
              <div key={k} style={{ display:"flex", alignItems:"center", flex:1, minWidth:0 }}>
                <div className={`hod-step${myESaved[k]?" done":myActiveTab===TAB_MAP[k]?" cur":""}`} style={{ flex:1, minWidth:0 }} onClick={() => setMyActiveTab(TAB_MAP[k])}>
                  <div className="hod-step-chk">{myESaved[k]?"✓":SECTION_ICONS[k]}</div>
                  <div className="hod-step-lbl">{SECTION_LABELS[k]}</div>
                </div>
                {idx < SECTION_KEYS.length-1 && <div className={`hod-step-con${myESaved[k]?" done":""}`}/>}
              </div>
            ))}
          </div>
          <div style={{ borderTop:"1px solid var(--border)", paddingTop:14, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
            {allSaved
              ? <div style={{ fontSize:13, color:"#10b981", fontWeight:600 }}>✔ All sections saved — ready to submit!</div>
              : <div style={{ fontSize:13, color:"var(--text-muted)" }}><span style={{ color:"#f59e0b", fontWeight:700 }}>{5-savedCount} section{5-savedCount!==1?"s":""} remaining</span> — save all to unlock Submit</div>
            }
            <button className="hod-btn hod-btn-navy" disabled={!allSaved} onClick={() => setMyShowConfirm(true)}>
              Submit to Admin Management →
            </button>
          </div>
        </div>

        <div className="hod-tabs" style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"12px 12px 0 0", marginBottom:0, overflow:"hidden" }}>
          {TABS.map(t => (
            <button key={t.id} className={`hod-tab${myActiveTab===t.id?" act":""}`} onClick={() => setMyActiveTab(t.id)}>
              {t.ico} {t.lbl} {myESaved[t.sKey]&&<span className="hod-tab-dot"/>}
            </button>
          ))}
        </div>
        <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderTop:"none", borderRadius:"0 0 12px 12px", padding:20, marginBottom:16 }}>

          {myActiveTab === "discharge" && (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))", gap:14, marginBottom:14 }}>
                {[
                  { k:"doa", lbl:"Date of Admission", type:"datetime-local" },
                  { k:"expectedDod", lbl:"Expected Discharge", type:"date" },
                  { k:"dod", lbl:"Actual Discharge", type:"datetime-local" },
                  { k:"ward", lbl:"Ward", type:"text" },
                  { k:"bed", lbl:"Bed No.", type:"text" },
                  { k:"doctor", lbl:"Treating Doctor", type:"text" },
                  { k:"diagnosis", lbl:"Primary Diagnosis", type:"text" },
                  { k:"condition", lbl:"Condition at Discharge", type:"text" },
                ].map(f => (
                  <div key={f.k}>
                    <label className="hod-lbl">{f.lbl}</label>
                    <input type={f.type} className="hod-finp" value={myEDis?.[f.k]||""} onChange={e => setMyEDis(p=>({...p,[f.k]:e.target.value}))}/>
                  </div>
                ))}
                <div style={{ gridColumn:"1/-1" }}>
                  <label className="hod-lbl">Discharge Instructions</label>
                  <textarea className="hod-ftxt" value={myEDis?.instructions||""} onChange={e => setMyEDis(p=>({...p,instructions:e.target.value}))}/>
                </div>
                <div style={{ gridColumn:"1/-1" }}>
                  <label className="hod-lbl">Additional Notes</label>
                  <textarea className="hod-ftxt" value={myEDis?.notes||""} onChange={e => setMyEDis(p=>({...p,notes:e.target.value}))}/>
                </div>
              </div>
            </div>
          )}

          {myActiveTab === "medical" && <AdmissionNoteForm eMed={myEMed} setEMed={setMyEMed}/>}

          {myActiveTab === "reports" && (
            <>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center", marginBottom:14 }}>
                <span style={{ background:"rgba(59,130,246,0.1)", border:"1px solid rgba(59,130,246,0.3)", color:"#3b82f6", borderRadius:20, padding:"3px 11px", fontSize:11, fontWeight:700 }}>🧪 Path: {fmtRs(pathTotal)} ({pathReps.length})</span>
                <span style={{ background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.3)", color:"#10b981", borderRadius:20, padding:"3px 11px", fontSize:11, fontWeight:700 }}>🩻 Rad: {fmtRs(radTotal)} ({radReps.length})</span>
                <span style={{ background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.3)", color:"#6366f1", borderRadius:20, padding:"3px 11px", fontSize:11, fontWeight:700 }}>Grand: {fmtRs(pathTotal+radTotal)}</span>
              </div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:14 }}>
                {repFilterOptions.map(t => (
                  <button key={t} onClick={() => setMyRepFilter(t)} style={{ padding:"5px 13px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit", border:myRepFilter===t?"1.5px solid var(--text)":"1.5px solid var(--border)", background:myRepFilter===t?"var(--text)":"var(--surface)", color:myRepFilter===t?"var(--surface)":"var(--text-mid)" }}>{t}</button>
                ))}
              </div>
              {visibleReps.map(rep => {
                const ri = myELabRep.findIndex(r => r.id === rep.id);
                if (isRadiologyType(rep.reportType)) return <RadiologyReportCard key={rep.id} rep={rep} ri={ri} patientName={patientName} updRep={updMyRep} onRemove={() => setMyELabRep(p => p.filter(r => r.id !== rep.id))}/>;
                return <PathologyReportCard key={rep.id} rep={rep} ri={ri} patientName={patientName} updRep={updMyRep} updTest={updMyTest} addTest={addMyTest} delTest={delMyTest} onRemove={() => setMyELabRep(p => p.filter(r => r.id !== rep.id))}/>;
              })}
              <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginTop:4 }}>
                <button onClick={() => setMyELabRep(p => [...p, emptyPathReport()])} style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"10px 20px", background:"linear-gradient(135deg,#1e3a5f,#0f172a)", color:"#fff", border:"none", borderRadius:9, cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"inherit" }}>🧪 + Add Pathology Report</button>
                <button onClick={() => setMyELabRep(p => [...p, emptyRadReport()])} style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"10px 20px", background:"linear-gradient(135deg,#065f46,#064e3b)", color:"#fff", border:"none", borderRadius:9, cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"inherit" }}>🩻 + Add Radiology Report</button>
              </div>
            </>
          )}

          {myActiveTab === "med_bill" && (
            <>
              <MedicineHistoryPicker eMed={myEMed} onAdd={addMedFromPicker}/>
              <div style={{ overflowX:"auto", border:"1px solid var(--border)", borderRadius:10, marginBottom:10 }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead><tr style={{ background:"var(--surface-2)" }}>{["Item Description","Date","Amount (₹)",""].map((h,i) => <th key={i} style={{ textAlign:"left", padding:"10px 14px", fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:".06em", borderBottom:"1px solid var(--border)" }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {myEMedBill.map((r,i) => (
                      <tr key={r.id} style={{ borderBottom:"1px solid var(--border)" }}>
                        <td style={{ padding:"8px 14px" }}><input className="hod-tinp" value={r.item} onChange={e => { const n=[...myEMedBill]; n[i]={...n[i],item:e.target.value}; setMyEMedBill(n); }}/></td>
                        <td style={{ padding:"8px 14px" }}><input className="hod-tinp" type="date" value={r.date} onChange={e => { const n=[...myEMedBill]; n[i]={...n[i],date:e.target.value}; setMyEMedBill(n); }}/></td>
                        <td style={{ padding:"8px 14px" }}><input className="hod-tinp" type="number" value={r.amount} onChange={e => { const n=[...myEMedBill]; n[i]={...n[i],amount:Number(e.target.value)}; setMyEMedBill(n); }}/></td>
                        <td style={{ padding:"8px 14px" }}><button onClick={() => setMyEMedBill(p => p.filter((_,j) => j!==i))} style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", color:"#ef4444", borderRadius:5, padding:"4px 8px", cursor:"pointer", fontSize:12, fontFamily:"inherit" }}>×</button></td>
                      </tr>
                    ))}
                    {myEMedBill.length === 0 && <tr><td colSpan={4} style={{ textAlign:"center", color:"var(--text-muted)", fontStyle:"italic", padding:"18px" }}>No medicines added. Use the picker above or click + Add.</td></tr>}
                  </tbody>
                </table>
              </div>
              <button className="hod-addbtn" onClick={() => setMyEMedBill(p => [...p, { id:Date.now(), item:"", date:new Date().toISOString().slice(0,10), amount:0 }])}>+ Add Medicine Manually</button>
              <div className="hod-tot-box"><div className="hod-tot-row hod-tot-fin"><span>Medicine Total</span><span>{fmtRs(myEMedBill.reduce((a,r)=>a+Number(r.amount||0),0))}</span></div></div>
            </>
          )}

          {myActiveTab === "finalbill" && (
            <div className="hod-bgrid">
              <div>
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"var(--text)", marginBottom:12 }}>🧾 Bill Header — Patient Information</div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:12 }}>
                    {[
                      { k:"uhid", lbl:"UHID", ph:p.uhid },
                      { k:"billNo", lbl:"IPD / Bill No.", ph:p.admNo },
                      { k:"patientName", lbl:"Patient Name", ph:patientName },
                      { k:"guardianName", lbl:"Guardian Name", ph:"e.g. Ramesh Kumar" },
                      { k:"ageSex", lbl:"Age / Sex", ph:`${p.ageYY||p.age||"—"} Yrs / ${p.gender||""}` },
                      { k:"contactNo", lbl:"Contact No.", ph:p.phone||"" },
                      { k:"cardNo", lbl:"Card No.", ph:"e.g. 1234" },
                      { k:"claimId", lbl:"Claim ID", ph:"e.g. 42092669" },
                      { k:"panel", lbl:"Panel", ph:"CASH / TPA / ECHS" },
                      { k:"consultantName", lbl:"Consultant / Doctor", ph:p.doctor||"" },
                      { k:"wardRoom", lbl:"Ward / Room", ph:`${p.ward||""}${p.bed?` / ${p.bed}`:""}` },
                      { k:"statusOnDischarge", lbl:"Status on Discharge", ph:"e.g. LAMA, Stable" },
                    ].map(f => (
                      <div key={f.k}>
                        <label className="hod-lbl">{f.lbl}</label>
                        <input className="hod-finp" value={myEBilling?.[f.k]||""} onChange={e => setMyEBilling(prev=>({...prev,[f.k]:e.target.value}))} placeholder={f.ph}/>
                      </div>
                    ))}
                    <div style={{ gridColumn:"1/-1" }}>
                      <label className="hod-lbl">Address</label>
                      <input className="hod-finp" value={myEBilling?.addressDisplay||""} onChange={e => setMyEBilling(p=>({...p,addressDisplay:e.target.value}))} placeholder={p.address||"Patient address"}/>
                    </div>
                  </div>
                </div>

                <div style={{ fontSize:12, fontWeight:700, color:"var(--text)", marginBottom:10 }}>🧾 Services & Charges</div>
                <div style={{ overflowX:"auto", border:"1px solid var(--border)", borderRadius:10, marginBottom:10 }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                    <thead><tr style={{ background:"var(--surface-2)" }}>{["Service","Category","Qty","Rate","Amount",""].map((h,i) => <th key={i} style={{ textAlign:"left", padding:"10px 14px", fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:".06em", borderBottom:"1px solid var(--border)" }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {myESvc.map((r,i) => (
                        <tr key={r.id} style={{ borderBottom:"1px solid var(--border)" }}>
                          <td style={{ padding:"8px 14px" }}><input className="hod-tinp" value={r.name} onChange={e => updMySvc(i,"name",e.target.value)}/></td>
                          <td style={{ padding:"8px 14px" }}><input className="hod-tinp" value={r.category} onChange={e => updMySvc(i,"category",e.target.value)}/></td>
                          <td style={{ padding:"8px 14px" }}><input className="hod-tinp" type="number" value={r.qty} onChange={e => updMySvc(i,"qty",e.target.value)}/></td>
                          <td style={{ padding:"8px 14px" }}><input className="hod-tinp" type="number" value={r.rate} onChange={e => updMySvc(i,"rate",e.target.value)}/></td>
                          <td style={{ padding:"8px 14px", fontWeight:700 }}>{fmtRs(r.amount)}</td>
                          <td style={{ padding:"8px 14px" }}><button onClick={() => setMyESvc(p=>p.filter((_,j)=>j!==i))} style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", color:"#ef4444", borderRadius:5, padding:"4px 8px", cursor:"pointer", fontSize:12, fontFamily:"inherit" }}>×</button></td>
                        </tr>
                      ))}
                      {myESvc.length === 0 && <tr><td colSpan={6} style={{ textAlign:"center", color:"var(--text-muted)", fontStyle:"italic", padding:"18px" }}>No services added yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
                <button className="hod-addbtn" onClick={() => setMyESvc(p=>[...p,{id:Date.now(),name:"",category:"",qty:1,rate:0,amount:0}])}>+ Add Service</button>
              </div>

              <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:18 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"var(--text)", marginBottom:14 }}>💳 Payment Details</div>
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {[{ k:"discount", lbl:"Discount (₹)" }, { k:"advance", lbl:"Advance Paid (₹)" }, { k:"paidNow", lbl:"Paid Now (₹)" }].map(f => (
                    <div key={f.k}>
                      <label className="hod-lbl">{f.lbl}</label>
                      <input className="hod-finp" type="number" value={myEBilling?.[f.k]||0} onChange={e => setMyEBilling(p=>({...p,[f.k]:e.target.value}))}/>
                    </div>
                  ))}
                  <div>
                    <label className="hod-lbl">Payment Mode</label>
                    <select className="hod-fsel" value={myEBilling?.paymentMode||"Cash"} onChange={e => setMyEBilling(p=>({...p,paymentMode:e.target.value}))}>
                      {["Cash","UPI","Card","Insurance","NEFT","Cheque"].map(m=><option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="hod-lbl">Insurance Type</label>
                    <select className="hod-fsel" value={myEBilling?.insuranceType||"Self Pay"} onChange={e => setMyEBilling(p=>({...p,insuranceType:e.target.value}))}>
                      {INSURANCE_TYPES_LIST.map(t=><option key={t}>{t}</option>)}
                    </select>
                  </div>
                  {myEBilling?.insuranceType && myEBilling.insuranceType !== "Self Pay" && myEBilling.insuranceType !== "Cash" && (
                    <>
                      {[{ k:"tpaName", lbl:"TPA / Panel Name" }, { k:"policyNo", lbl:"Policy / Card Number" }, { k:"claimNo", lbl:"Claim Number" }, { k:"authNo", lbl:"Authorization Number" }].map(f => (
                        <div key={f.k}>
                          <label className="hod-lbl">{f.lbl}</label>
                          <input className="hod-finp" value={myEBilling?.tpaInfo?.[f.k]||""} onChange={e => setMyEBilling(p=>({...p,tpaInfo:{...(p.tpaInfo||{}),[f.k]:e.target.value}}))}/>
                        </div>
                      ))}
                      <div>
                        <label className="hod-lbl">TPA Documents</label>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                          {TPA_DOCS.map(doc => (
                            <label key={doc.key} style={{ display:"flex", alignItems:"center", gap:7, fontSize:11, color:"var(--text-mid)", background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:7, padding:"6px 9px" }}>
                              <input type="checkbox" checked={Boolean(myEBilling?.tpaDocStatus?.[doc.key])} onChange={ev => setMyEBilling(p=>({...p,tpaDocStatus:{...(p.tpaDocStatus||{}),[doc.key]:ev.target.checked}}))}/>
                              <span>{doc.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                  <div>
                    <label className="hod-lbl">Remarks</label>
                    <input className="hod-finp" value={myEBilling?.remarks||""} onChange={e => setMyEBilling(p=>({...p,remarks:e.target.value}))}/>
                  </div>
                </div>
                <div className="hod-tot-box">
                  <div className="hod-tot-row"><span style={{ color:"var(--text-muted)" }}>Services</span><span style={{ fontWeight:700 }}>{fmtRs(totals.s)}</span></div>
                  <div className="hod-tot-row"><span style={{ color:"var(--text-muted)" }}>🧪 Pathology</span><span style={{ fontWeight:700 }}>{fmtRs(pathTotal)}</span></div>
                  <div className="hod-tot-row"><span style={{ color:"var(--text-muted)" }}>🩻 Radiology</span><span style={{ fontWeight:700 }}>{fmtRs(radTotal)}</span></div>
                  <div className="hod-tot-row"><span style={{ color:"var(--text-muted)" }}>Medicines</span><span style={{ fontWeight:700 }}>{fmtRs(totals.m)}</span></div>
                  <div className="hod-tot-row"><span style={{ color:"var(--text-muted)" }}>Gross Total</span><span style={{ fontWeight:700 }}>{fmtRs(totals.gross)}</span></div>
                  <div className="hod-tot-row" style={{ color:"#ef4444" }}><span>Discount</span><span>- {fmtRs(totals.disc)}</span></div>
                  <div className="hod-tot-row"><span style={{ color:"var(--text-muted)" }}>Net Payable</span><span style={{ fontWeight:700 }}>{fmtRs(totals.net)}</span></div>
                  <div className="hod-tot-row" style={{ color:"#10b981" }}><span>Advance Paid</span><span>- {fmtRs(totals.adv)}</span></div>
                  <div className="hod-tot-row" style={{ color:"#10b981" }}><span>Paid Now</span><span>- {fmtRs(totals.paid)}</span></div>
                  <div className="hod-tot-row hod-tot-fin"><span>Balance Due</span><span>{fmtRs(totals.due)}</span></div>
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop:16, paddingTop:14, borderTop:"1px solid var(--border)", display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button className="hod-savebtn"
              onClick={() => {
                const tabToSection = { discharge:"discharge", medical:"admission", reports:"reports", med_bill:"medicines", finalbill:"billing" };
                const sKey = tabToSection[myActiveTab];
                saveMySection(sKey, SECTION_LABELS[sKey]);
              }}>
              💾 Save {SECTION_LABELS[({ discharge:"discharge", medical:"admission", reports:"reports", med_bill:"medicines", finalbill:"billing" })[myActiveTab]]}
            </button>
          </div>
        </div>

        {myShowConfirm && (
          <div className="hod-overlay" onClick={() => setMyShowConfirm(false)}>
            <div className="hod-modal" onClick={e => e.stopPropagation()}>
              <button className="hod-modal-close" onClick={() => setMyShowConfirm(false)}>✕</button>
              <div style={{ textAlign:"center", marginBottom:16 }}>
                <div style={{ fontSize:40, marginBottom:10 }}>📤</div>
                <div style={{ fontSize:16, fontWeight:700, color:"var(--text)", marginBottom:6 }}>Submit to Admin Management</div>
                <div style={{ fontSize:12, color:"var(--text-muted)" }}>Submitting complete file for <strong style={{ color:"var(--text)" }}>{patientName}</strong> ({p.uhid})</div>
              </div>
              <div style={{ background:"var(--surface-2)", borderRadius:10, padding:16, marginBottom:16, display:"flex", flexDirection:"column", gap:8 }}>
                {SECTION_KEYS.map(k => (
                  <div key={k} style={{ display:"flex", alignItems:"center", gap:10, fontSize:13 }}>
                    <span>{myESaved[k]?"✅":"⚠️"}</span>
                    <span style={{ color:myESaved[k]?"#10b981":"#f59e0b", fontWeight:600 }}>{SECTION_ICONS[k]} {SECTION_LABELS[k]} — {myESaved[k]?"Saved":"Not saved"}</span>
                  </div>
                ))}
              </div>
              <div className="hod-form-row">
                <label className="hod-lbl">Handover Note (optional)</label>
                <textarea className="hod-textarea" value={submitNote} placeholder="Any notes for Admin Management…" onChange={e => setSubmitNote(e.target.value)}/>
              </div>
              <div className="hod-modal-foot">
                <button className="hod-btn hod-btn-ghost" onClick={() => setMyShowConfirm(false)}>Cancel</button>
                <button className="hod-btn hod-btn-navy" onClick={submitMyWork}>Confirm Submit →</button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // ── View: Department Tasks
  // ─────────────────────────────────────────────────────────────────────────
  const renderDeptTasks = () => {
    const filtered = tasks.filter(t => {
      if (filterStatus   && t.status !== filterStatus) return false;
      if (filterEmployee && String(t.assigned_to) !== filterEmployee) return false;
      return true;
    });
    return (
      <div>
        <div className="hod-filter-bar">
          <Filter size={13} style={{ color:"var(--text-muted)" }}/>
          <select className="hod-sel" style={{ width:"auto" }} value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)}>
            <option value="">All Employees</option>
            {employees.filter(e => (e.department||e.dept) === activeDept).map(e => (
              <option key={e.id} value={e.id}>{e.name||e.get_full_name} ({e.employee_code||e.employeeCode})</option>
            ))}
          </select>
          <select className="hod-sel" style={{ width:"auto" }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            {Object.entries(STATUS_META).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <input type="date" className="hod-inp" style={{ width:"auto" }} value={filterDate} onChange={e => setFilterDate(e.target.value)}/>
          <button className="hod-btn hod-btn-ghost" onClick={loadTasks}><RefreshCw size={12}/></button>
          <button className="hod-btn hod-btn-primary" style={{ marginLeft:"auto" }} onClick={() => openAssignModal(activeDept)}>+ Assign to {activeDept}</button>
        </div>
        <div className="hod-stat-grid" style={{ marginBottom:18 }}>
          {[
            { label:"Total",     val:tasks.filter(t=>t.department===activeDept).length,                         col:deptColor },
            { label:"Pending",   val:tasks.filter(t=>t.department===activeDept&&t.status==="pending").length,   col:"#f59e0b" },
            { label:"Completed", val:tasks.filter(t=>t.department===activeDept&&t.status==="completed").length, col:"#10b981" },
            { label:"Overdue",   val:tasks.filter(t=>t.department===activeDept&&t.status==="overdue").length,   col:"#ef4444" },
          ].map((s,i) => (
            <div key={i} className="hod-stat-card">
              <div style={{ fontSize:24, fontWeight:800, color:s.col }}>{s.val}</div>
              <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:3 }}>{s.label} Tasks</div>
            </div>
          ))}
        </div>
        <div className="hod-table-wrap">
          <table className="hod-table">
            <thead><tr>{["Task","Patients","Assignee","Priority","Status","Due","Submitted","Actions"].map(h=><th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={8} style={{ textAlign:"center", padding:40, color:"var(--text-muted)" }}>No tasks found</td></tr>
                : filtered.map(task => (
                  <tr key={task.id}>
                    <td>
                      <div style={{ fontWeight:600, color:"var(--text)", fontSize:12 }}>{task.title}</div>
                      {task.notes && <div style={{ fontSize:10, color:"var(--text-muted)", marginTop:2 }}>{task.notes.slice(0,50)}{task.notes.length>50?"…":""}</div>}
                    </td>
                    <td>
                      {(task.patient_uhids||(task.patient_uhid?[task.patient_uhid]:[])).map((u,i) => (
                        <div key={i} style={{ fontSize:10, color:"#06b6d4", fontFamily:"monospace" }}>{(task.patient_names||[])[i]||u}</div>
                      ))}
                    </td>
                    <td style={{ fontWeight:600 }}>{task.assigned_to_name||"—"}</td>
                    <td><PriorityBadge priority={task.priority||"Medium"}/></td>
                    <td>
                      <select className="hod-sel" style={{ width:"auto", padding:"3px 8px", fontSize:10, background:STATUS_META[task.status]?.bg||"transparent", color:STATUS_META[task.status]?.text||"var(--text-mid)", borderColor:STATUS_META[task.status]?.border||"var(--border)" }}
                        value={task.status} onChange={e => updateTaskStatus(task.id, e.target.value)}>
                        {Object.entries(STATUS_META).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </td>
                    <td style={{ fontSize:11 }}>{fmtDt(task.due_date)}</td>
                    <td style={{ fontSize:11 }}>{task.submitted_at?<span style={{ color:"#6366f1" }}>✓ {fmtDt(task.submitted_at)}</span>:"—"}</td>
                    <td>
                      <div style={{ display:"flex", gap:5 }}>
                        <button className="hod-btn hod-btn-ghost" style={{ padding:"3px 9px", fontSize:"10px" }} onClick={() => openReview(task,null)}><Star size={10}/> Review</button>
                        {task.status === "completed" && !task.submitted_at && (
                          <button className="hod-btn hod-btn-blue" style={{ padding:"3px 9px", fontSize:"10px" }} onClick={() => openSubmitToAdmin({ id:task.id, type:"task", name:task.title })}><Send size={10}/> Submit</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // ── View: Analytics
  // ─────────────────────────────────────────────────────────────────────────
  const renderAnalytics = () => (
    <div>
      <div className="hod-filter-bar">
        <select className="hod-sel" style={{ width:"auto" }} value={filterRange} onChange={e => setFilterRange(e.target.value)}>
          <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
        </select>
        <select className="hod-sel" style={{ width:"auto" }} value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)}>
          <option value="">All Employees</option>
          {employees.filter(e=>(e.department||e.dept)===activeDept).map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </div>
      {!analytics
        ? <div className="hod-empty"><div className="hod-empty-ico">📊</div><div>Loading analytics...</div></div>
        : <>
          <div className="hod-stat-grid">
            {(analytics.stats||[]).map((stat,i) => {
              const cols=[deptColor,"#34d399","#f59e0b","#a78bfa"];
              return <div key={i} className="hod-stat-card"><div style={{ fontSize:24, fontWeight:800, color:cols[i%4] }}>{stat.value}</div><div style={{ fontSize:11, color:"var(--text-muted)", marginTop:3 }}>{stat.label}</div></div>;
            })}
          </div>
          <div className="hod-section">
            <div className="hod-section-head"><div className="hod-section-title">👥 Employee Performance — {activeDept}</div></div>
            <div className="hod-table-wrap" style={{ margin:0, borderRadius:0, border:"none" }}>
              <table className="hod-table">
                <thead><tr>{["Employee","Assigned","Completed","Pending","Overdue","Completion %","Action"].map(h=><th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {(analytics.employee_stats||analytics.employeeStats||[]).map(emp => (
                    <tr key={emp.id}>
                      <td style={{ fontWeight:600, color:"var(--text)" }}>{emp.name}</td>
                      <td>{emp.assigned}</td>
                      <td style={{ color:"#10b981" }}>{emp.completed}</td>
                      <td style={{ color:"#f59e0b" }}>{emp.pending}</td>
                      <td style={{ color:"#ef4444" }}>{emp.overdue}</td>
                      <td>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ flex:1 }} className="hod-progress-track">
                            <div className="hod-progress-fill" style={{ width:`${emp.completion_pct||emp.completionPct||0}%`, background:(emp.completion_pct||emp.completionPct||0)>=80?"#10b981":(emp.completion_pct||emp.completionPct||0)>=50?"#f59e0b":"#ef4444" }}/>
                          </div>
                          <span style={{ fontSize:11, fontWeight:700, color:"var(--text)", minWidth:32 }}>{emp.completion_pct||emp.completionPct||0}%</span>
                        </div>
                      </td>
                      <td><button className="hod-btn hod-btn-ghost" style={{ padding:"3px 9px", fontSize:"10px" }} onClick={() => openReview(null,emp)}><Star size={10}/> Review</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      }
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // ── View: Reviews
  // ─────────────────────────────────────────────────────────────────────────
  const renderReviews = () => (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div style={{ fontSize:18, fontWeight:700, color:"var(--text)" }}>Department Reviews — {activeDept}</div>
        <button className="hod-btn hod-btn-primary" onClick={() => { setReviewTarget(null); setReviewForm({rating:5,comments:"",score:"",period:"weekly"}); setShowReviewModal(true); }}><Star size={13}/> Submit Review</button>
      </div>
      {reviews.length === 0
        ? <div className="hod-empty"><div className="hod-empty-ico">⭐</div><div>No reviews yet.</div></div>
        : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:14 }}>
          {reviews.map(rev => (
            <div key={rev.id} className="hod-review-card">
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:"var(--text)" }}>{rev.employee_name||rev.employeeName}</div>
                  <div style={{ fontSize:10, color:"var(--text-muted)", marginTop:2 }}>{rev.period} · {fmtDt(rev.submitted_at||rev.created_at)}</div>
                </div>
                <span className="hod-badge" style={{ background:"rgba(245,158,11,0.1)", color:"#f59e0b", borderColor:"rgba(245,158,11,0.3)" }}>{"★".repeat(rev.rating)}{"☆".repeat(5-rev.rating)}</span>
              </div>
              {rev.performance_score && <div style={{ fontSize:12, color:"#10b981", fontWeight:700, marginBottom:6 }}>Score: {rev.performance_score}</div>}
              <div style={{ fontSize:12, color:"var(--text-mid)", lineHeight:1.6 }}>{rev.comments}</div>
            </div>
          ))}
        </div>
      }
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // ── View: Employees
  // ─────────────────────────────────────────────────────────────────────────
  const renderEmployees = () => (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div style={{ fontSize:18, fontWeight:700, color:"var(--text)" }}>Employees — {activeDept}</div>
        <button className="hod-btn hod-btn-ghost" onClick={() => loadEmployees(activeDept).then(l=>setDeptEmployees(l))}><RefreshCw size={12}/> Refresh</button>
      </div>
      {deptEmployees.length === 0
        ? <div className="hod-empty"><div className="hod-empty-ico">👥</div><div>No employees found for {activeDept}.</div></div>
        : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
          {deptEmployees.map((emp,i) => {
            const empTasks = tasks.filter(t => t.assigned_to === emp.id);
            return (
              <div key={emp.id} style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"16px 18px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:["rgba(16,185,129,0.15)","rgba(129,140,248,0.15)","rgba(245,158,11,0.15)","rgba(239,68,68,0.15)"][i%4], display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:700, color:[deptColor,"#818cf8","#f59e0b","#ef4444"][i%4], flexShrink:0 }}>
                    {initials(emp.name)}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"var(--text)" }}>{emp.name}</div>
                    <div style={{ fontSize:10, color:"var(--text-muted)", marginTop:2 }}>{emp.role||"Staff"} · {emp.employee_code||emp.employeeCode}</div>
                  </div>
                </div>
                {emp.email&&<div style={{ fontSize:11, color:"var(--text-muted)", marginBottom:4 }}>✉ {emp.email}</div>}
                <div style={{ display:"flex", gap:12, marginBottom:12 }}>
                  {[{ label:"Tasks", val:empTasks.length, col:deptColor }, { label:"Done", val:empTasks.filter(t=>t.status==="completed").length, col:"#10b981" }, { label:"Pending", val:empTasks.filter(t=>t.status==="pending").length, col:"#f59e0b" }].map((s,j)=>(
                    <div key={j} style={{ textAlign:"center" }}>
                      <div style={{ fontSize:16, fontWeight:800, color:s.col }}>{s.val}</div>
                      <div style={{ fontSize:9, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:".07em" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button className="hod-btn hod-btn-primary" style={{ flex:1, fontSize:"10px", padding:"5px" }} onClick={() => openAssignModal(activeDept, emp.id)}>Assign Task</button>
                  <button className="hod-btn hod-btn-ghost" style={{ flex:1, fontSize:"10px", padding:"5px" }} onClick={() => openReview(null,emp)}>Review</button>
                </div>
              </div>
            );
          })}
        </div>
      }
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // ── Modals
  // ─────────────────────────────────────────────────────────────────────────
  const renderAssignModal = () => (
    <div className="hod-overlay" onClick={() => setShowAssignModal(false)}>
      <div className="hod-modal hod-modal-lg" onClick={e => e.stopPropagation()}>
        <button className="hod-modal-close" onClick={() => setShowAssignModal(false)}>✕</button>
        <div className="hod-modal-title"><CheckSquare size={16} strokeWidth={1.8}/> Assign Task</div>
        <div className="hod-form-grid" style={{ marginBottom:14 }}>
          <div className="hod-form-row">
            <label className="hod-lbl">Department</label>
            <select className="hod-sel" value={assignDept} onChange={async e => { setAssignDept(e.target.value); setAssignEmployee(""); const list = await loadEmployees(e.target.value); setDeptEmployees(list); }}>
              {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="hod-form-row">
            <label className="hod-lbl">Assign To *</label>
            <select className="hod-sel" value={assignEmployee} onChange={e => setAssignEmployee(e.target.value)}>
              <option value="">Select Employee</option>
              {deptEmployees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.employee_code||e.employeeCode})</option>)}
            </select>
          </div>
          <div className="hod-form-row">
            <label className="hod-lbl">Priority</label>
            <select className="hod-sel" value={assignPriority} onChange={e => setAssignPriority(e.target.value)}>
              {["Low","Medium","High","Urgent"].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="hod-form-row">
            <label className="hod-lbl">Due Date</label>
            <input type="date" className="hod-inp" value={assignDueDate} onChange={e => setAssignDueDate(e.target.value)}/>
          </div>
        </div>
        <div className="hod-form-row">
          <label className="hod-lbl">Select Patients (up to 8) — {assignPatients.length}/8 selected</label>
          {assignPatients.length > 0 && (
            <div className="hod-selected-pills" style={{ marginBottom:8 }}>
              {assignPatients.map((uhid,idx) => (
                <span key={uhid} className="hod-sel-pill">
                  🧑‍⚕️ {assignPatientNames[idx]}<span style={{ fontSize:9, opacity:.7 }}> · {uhid}</span>
                  <button onClick={() => {
                    const i = assignPatients.indexOf(uhid);
                    setAssignPatients(prev=>prev.filter(u=>u!==uhid));
                    setAssignPatientIds(prev=>prev.filter((_,j)=>j!==i));
                    setAssignPatientNames(prev=>prev.filter((_,j)=>j!==i));
                  }}>✕</button>
                </span>
              ))}
              <button className="hod-btn hod-btn-ghost" style={{ padding:"2px 9px", fontSize:"10px" }} onClick={() => { setAssignPatients([]); setAssignPatientIds([]); setAssignPatientNames([]); }}>Clear All</button>
            </div>
          )}
          <input className="hod-inp" placeholder="Search patient by name or UHID…" value={patientSearch} onChange={e => setPatientSearch(e.target.value)} style={{ marginBottom:6 }}/>
          <div className="hod-pt-list">
            {filteredPatientSearch.length === 0
              ? <div style={{ padding:"14px", textAlign:"center", color:"var(--text-muted)", fontSize:12 }}>No patients found</div>
              : filteredPatientSearch.map(p => {
                const isSelected = assignPatients.includes(p.uhid);
                return (
                  <div key={p.uhid} className={`hod-pt-item${isSelected?" sel":""}`} onClick={() => toggleAssignPatient(p)}>
                    <div>
                      <span style={{ fontWeight:600, color:"var(--text)" }}>{p.patientName||p.name}</span>
                      <span style={{ marginLeft:8, fontSize:10, fontFamily:"monospace", color:"var(--text-muted)" }}>{p.uhid}</span>
                      {isSelected&&<span style={{ marginLeft:6, color:"#10b981", fontWeight:700 }}>✓</span>}
                    </div>
                    <span style={{ fontSize:9, padding:"2px 6px", borderRadius:10, background:p.dod?"rgba(16,185,129,0.1)":"rgba(245,158,11,0.1)", color:p.dod?"#10b981":"#f59e0b" }}>{p.dod?"Discharged":"Admitted"}</span>
                  </div>
                );
              })
            }
          </div>
        </div>
        <div className="hod-form-row">
          <label className="hod-lbl">Notes / Instructions</label>
          <textarea className="hod-textarea" value={assignNotes} placeholder="Any instructions for the employee…" onChange={e => setAssignNotes(e.target.value)}/>
        </div>
        <div className="hod-modal-foot">
          <button className="hod-btn hod-btn-ghost" onClick={() => setShowAssignModal(false)}>Cancel</button>
          <button className="hod-btn hod-btn-primary" onClick={handleAssign} disabled={!assignEmployee || assignPatients.length === 0}>
            Assign {assignPatients.length > 0 ? `(${assignPatients.length} patient${assignPatients.length>1?"s":""})` : ""}
          </button>
        </div>
      </div>
    </div>
  );

  const renderReviewModal = () => (
    <div className="hod-overlay" onClick={() => setShowReviewModal(false)}>
      <div className="hod-modal" onClick={e => e.stopPropagation()}>
        <button className="hod-modal-close" onClick={() => setShowReviewModal(false)}>✕</button>
        <div className="hod-modal-title"><Star size={16}/> Submit Employee Review</div>
        <div className="hod-form-row">
          <label className="hod-lbl">Employee</label>
          <select className="hod-sel" value={reviewForm.employeeId||(reviewTarget?.employee?.id||reviewTarget?.task?.assigned_to||"")} onChange={e => setReviewForm(p=>({...p,employeeId:e.target.value}))}>
            <option value="">Select Employee</option>
            {employees.filter(e=>(e.department||e.dept)===activeDept).map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
          <div className="hod-form-row">
            <label className="hod-lbl">Period</label>
            <select className="hod-sel" value={reviewForm.period} onChange={e => setReviewForm(p=>({...p,period:e.target.value}))}>
              <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="hod-form-row">
            <label className="hod-lbl">Rating (1–5)</label>
            <select className="hod-sel" value={reviewForm.rating} onChange={e => setReviewForm(p=>({...p,rating:Number(e.target.value)}))}>
              {[1,2,3,4,5].map(r=><option key={r} value={r}>{"★".repeat(r)} ({r}/5)</option>)}
            </select>
          </div>
        </div>
        <div className="hod-form-row">
          <label className="hod-lbl">Performance Score</label>
          <input className="hod-inp" value={reviewForm.score} placeholder="e.g. 87/100" onChange={e => setReviewForm(p=>({...p,score:e.target.value}))}/>
        </div>
        <div className="hod-form-row">
          <label className="hod-lbl">Comments *</label>
          <textarea className="hod-textarea" value={reviewForm.comments} placeholder="Performance observations, feedback…" onChange={e => setReviewForm(p=>({...p,comments:e.target.value}))}/>
        </div>
        <div style={{ background:"rgba(99,102,241,0.08)", border:"1px solid rgba(99,102,241,0.2)", borderRadius:8, padding:"10px 14px", marginBottom:14, fontSize:11, color:"#6366f1" }}>
          ℹ This review will be submitted to Admin Management and reflected in Super Admin analytics.
        </div>
        <div className="hod-modal-foot">
          <button className="hod-btn hod-btn-ghost" onClick={() => setShowReviewModal(false)}>Cancel</button>
          <button className="hod-btn hod-btn-primary" onClick={submitReview} disabled={!reviewForm.comments.trim()}>Submit Review</button>
        </div>
      </div>
    </div>
  );

  const renderSubmitModal = () => (
    <div className="hod-overlay" onClick={() => setShowSubmitModal(false)}>
      <div className="hod-modal" onClick={e => e.stopPropagation()}>
        <button className="hod-modal-close" onClick={() => setShowSubmitModal(false)}>✕</button>
        <div style={{ textAlign:"center", marginBottom:16 }}>
          <div style={{ fontSize:40, marginBottom:10 }}>📤</div>
          <div style={{ fontSize:16, fontWeight:700, color:"var(--text)", marginBottom:6 }}>Submit to Admin Management</div>
          <div style={{ fontSize:12, color:"var(--text-muted)" }}>Submitting: <strong style={{ color:"var(--text)" }}>{submitTarget?.name}</strong></div>
        </div>
        <div className="hod-form-row">
          <label className="hod-lbl">Handover Note (optional)</label>
          <textarea className="hod-textarea" value={submitNote} placeholder="Any notes for Admin Management / Super Admin…" onChange={e => setSubmitNote(e.target.value)}/>
        </div>
        <div style={{ background:"rgba(99,102,241,0.08)", border:"1px solid rgba(99,102,241,0.2)", borderRadius:8, padding:"10px 14px", marginBottom:14, fontSize:11, color:"#6366f1" }}>
          ✓ This will be visible to Admin Management and Super Admin for review & performance tracking.
        </div>
        <div className="hod-modal-foot">
          <button className="hod-btn hod-btn-ghost" onClick={() => setShowSubmitModal(false)}>Cancel</button>
          <button className="hod-btn hod-btn-primary" onClick={confirmSubmitToAdmin}>Confirm Submit →</button>
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // ── Root render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>
      <div className="hod-root">
        {renderSidebar()}

        <div className="hod-main">
          {renderHeader()}
          <div className="hod-content">
            {error && (
              <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", color:"#ef4444", padding:"10px 16px", borderRadius:8, fontSize:12, marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
                <AlertCircle size={14}/> {error}
                <button style={{ marginLeft:"auto", background:"none", border:"none", color:"#ef4444", cursor:"pointer", fontSize:11 }} onClick={() => setError(null)}>✕</button>
              </div>
            )}

            {activeView === "overview"   && renderOverview()}
            {activeView === "assign"     && renderAssign()}
            {activeView === "my-work"    && (myWorkView === "patient" ? renderMyWorkPatient() : renderMyWorkList())}
            {activeView === "dept-tasks" && renderDeptTasks()}
            {activeView === "analytics"  && renderAnalytics()}
            {activeView === "reviews"    && renderReviews()}
            {activeView === "employees"  && renderEmployees()}
          </div>
        </div>

        {showAssignModal  && renderAssignModal()}
        {showReviewModal  && renderReviewModal()}
        {showSubmitModal  && renderSubmitModal()}
        {showLogoutConfirm && renderLogoutConfirm()}

        <div className="hod-toasts">
          {toasts.map(t => (
            <div key={t.id} className={`hod-toast ${t.type}`}>
              {t.type==="s"?"✓":t.type==="e"?"✗":"⚠"} {t.msg}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
