import { useState, useEffect, useRef } from "react";
import { apiService } from "../services/apiService";
import ThemeModeDock from "../components/ui/ThemeModeDock";

// ─── Report Templates ─────────────────────────────────────────────────────────
const REPORT_TEMPLATES = {
  "CBC": { key:"CBC", label:"Complete Blood Count", dept:"HAEMATOLOGY" },
  "COAGULATION": { key:"COAGULATION", label:"Coagulation Profile", dept:"HAEMATOLOGY" },
  "BLOODGROUP": { key:"BLOODGROUP", label:"Blood Group & Rh Factor", dept:"HAEMATOLOGY" },
  "PERIPHERAL_SMEAR": { key:"PERIPHERAL_SMEAR", label:"Blood Picture (Peripheral Smear)", dept:"HAEMATOLOGY" },
  "KFT": { key:"KFT", label:"Kidney Function Test", dept:"BIOCHEMISTRY" },
  "LFT": { key:"LFT", label:"Liver Function Test", dept:"BIOCHEMISTRY" },
  "LIPID": { key:"LIPID", label:"Lipid Profile", dept:"BIOCHEMISTRY" },
  "BLOODGAS": { key:"BLOODGAS", label:"Blood Gas Analysis", dept:"BIOCHEMISTRY" },
  "GLUCOSE": { key:"GLUCOSE", label:"Blood Glucose", dept:"BIOCHEMISTRY" },
  "CARDIAC": { key:"CARDIAC", label:"Cardiac Markers", dept:"BIOCHEMISTRY" },
  "CRP": { key:"CRP", label:"CRP / Procalcitonin", dept:"BIOCHEMISTRY" },
  "PANCREATIC": { key:"PANCREATIC", label:"Pancreatic Enzymes", dept:"BIOCHEMISTRY" },
  "VITAMINS": { key:"VITAMINS", label:"Vitamins", dept:"BIOCHEMISTRY" },
  "IRON": { key:"IRON", label:"Iron Profile", dept:"BIOCHEMISTRY" },
  "THYROID": { key:"THYROID", label:"Total Thyroid Profile", dept:"ENDOCRINOLOGY" },
  "WIDAL": { key:"WIDAL", label:"Widal Test (Slide Method)", dept:"IMMUNOLOGY – SEROLOGY" },
  "TYPHIDOT": { key:"TYPHIDOT", label:"Typhi Dot (IgG & IgM)", dept:"IMMUNOLOGY – SEROLOGY" },
  "DENGUE": { key:"DENGUE", label:"Dengue Panel", dept:"IMMUNOLOGY – SEROLOGY" },
  "MALARIA": { key:"MALARIA", label:"Malaria Antigen Test", dept:"MICROBIOLOGY" },
  "VIRAL": { key:"VIRAL", label:"Viral Markers", dept:"MICROBIOLOGY" },
  "URINE_RM": { key:"URINE_RM", label:"Urine Examination (R/M)", dept:"MICROBIOLOGY" },
  "URINE_CS": { key:"URINE_CS", label:"Urine C/S (Culture & Sensitivity)", dept:"MICROBIOLOGY" },
  "BLOOD_CS": { key:"BLOOD_CS", label:"Blood C/S (Culture & Sensitivity)", dept:"MICROBIOLOGY" },
  "STOOL": { key:"STOOL", label:"Stool Examination (R/M)", dept:"MICROBIOLOGY" },
  "BODY_FLUID": { key:"BODY_FLUID", label:"Body Fluid Analysis", dept:"MICROBIOLOGY" },
};

const INVESTIGATION_GROUPS = [
  { group:"🩸 Haematology",          color:"#dc2626", items:["CBC","COAGULATION","BLOODGROUP","PERIPHERAL_SMEAR"] },
  { group:"🧪 Biochemistry",         color:"#2563eb", items:["KFT","LFT","LIPID","BLOODGAS","GLUCOSE","CARDIAC","CRP","PANCREATIC","VITAMINS","IRON"] },
  { group:"⚗️ Endocrinology",        color:"#7c3aed", items:["THYROID"] },
  { group:"🔬 Immunology – Serology", color:"#b45309", items:["WIDAL","TYPHIDOT","DENGUE"] },
  { group:"🦠 Microbiology",         color:"#065f46", items:["MALARIA","VIRAL","URINE_RM","URINE_CS","BLOOD_CS","STOOL","BODY_FLUID"] },
];

const DOCTOR_LIST = [
  "Dr. Priya Sharma (MBBS, MD – General Medicine)",
  "Dr. Rajesh Kumar (MBBS, MS – General Surgery)",
  "Dr. Anita Singh (MBBS, DNB – Orthopaedics)",
  "Dr. Suresh Verma (MBBS, MD – Cardiology)",
  "Dr. Meena Agarwal (MBBS, MD – Gynaecology)",
  "Dr. Deepak Rawat (MBBS, DNB – Urology)",
  "Dr. Kavita Joshi (MBBS, MD – Paediatrics)",
  "Dr. Amit Bhatnagar (MBBS, MS – ENT)",
  "Dr. Ritu Kapoor (MBBS, MD – Dermatology)",
  "Dr. Sanjay Yadav (MBBS, MD – Neurology)",
  "Dr. Neha Gupta (MBBS, MD – Pulmonology)",
  "Dr. Vikas Sharma (MBBS, MS – Ophthalmology)",
];

const QUALIFICATION_LIST = [
  "MBBS","MBBS, MD","MBBS, MS","MBBS, DNB","MBBS, DM","MBBS, MCh",
  "MBBS, MD – General Medicine","MBBS, MD – Cardiology","MBBS, MD – Neurology",
  "MBBS, MD – Pulmonology","MBBS, MD – Gynaecology","MBBS, MD – Paediatrics",
  "MBBS, MD – Dermatology","MBBS, MS – General Surgery","MBBS, MS – Orthopaedics",
  "MBBS, MS – ENT","MBBS, MS – Ophthalmology","MBBS, DNB – Urology",
  "MBBS, DNB – Orthopaedics","BDS, MDS","BAMS","BHMS",
];

const MEDICATION_GROUPS = [
  { group:"💉 IV / Injections", items:["Inj. Normal Saline (NS) 500ml","Inj. Ringer Lactate (RL) 500ml","Inj. DNS 500ml","Inj. Pantoprazole 40mg IV BD","Inj. Esomeprazole 40mg IV BD","Inj. Ondansetron 4mg IV TDS","Inj. Tramadol 50mg IV TDS","Inj. Diclofenac 75mg IM BD","Inj. Ceftriaxone 1g IV BD","Inj. Amikacin 500mg IV OD","Inj. Metronidazole 500mg IV TDS","Inj. Furosemide 40mg IV OD","Inj. Dexamethasone 8mg IV OD","Inj. Hydrocortisone 100mg IV TDS","Inj. Heparin 5000 IU SC BD","Inj. Enoxaparin 40mg SC OD","Inj. Insulin Regular SC TDS","Inj. Atropine 0.6mg IV","Inj. Adrenaline 1mg IV"] },
  { group:"💊 Oral Tablets / Capsules", items:["Tab. Paracetamol 500mg TDS","Tab. Paracetamol 650mg TDS","Tab. Ibuprofen 400mg TDS","Tab. Diclofenac 50mg BD","Tab. Pantoprazole 40mg OD","Tab. Rabeprazole 20mg OD","Tab. Ondansetron 4mg TDS","Tab. Metformin 500mg BD","Tab. Metformin 1000mg BD","Tab. Amlodipine 5mg OD","Tab. Amlodipine 10mg OD","Tab. Atenolol 50mg OD","Tab. Ramipril 5mg OD","Tab. Losartan 50mg OD","Tab. Telmisartan 40mg OD","Tab. Atorvastatin 20mg HS","Tab. Atorvastatin 40mg HS","Tab. Clopidogrel 75mg OD","Tab. Aspirin 75mg OD","Tab. Aspirin 150mg OD","Tab. Azithromycin 500mg OD","Tab. Amoxicillin 500mg TDS","Tab. Ciprofloxacin 500mg BD","Tab. Metronidazole 400mg TDS","Tab. Doxycycline 100mg BD","Tab. Prednisolone 10mg OD","Tab. Prednisolone 40mg OD","Tab. Levothyroxine 50mcg OD","Tab. Folic Acid 5mg OD","Tab. Ferrous Sulphate 200mg BD","Cap. Amoxicillin + Clavulanate 625mg BD","Cap. Omeprazole 20mg BD"] },
  { group:"🩹 Topical / Local", items:["Syrup Paracetamol 125mg/5ml","Syrup Amoxicillin 125mg/5ml","Nebulisation Salbutamol 2.5mg","Nebulisation Ipratropium 0.5mg","Inhalation Budesonide 200mcg BD"] },
  { group:"🔧 Supportive / Others", items:["O2 Inhalation 2–4 L/min","Ryle's Tube Feed","IV Fluids NS/RL @ 100ml/hr","IV Fluids DNS @ 80ml/hr","Urinary Catheterisation","Dressing BD","Steam Inhalation BD","Physiotherapy","ICU Monitoring","Vital Monitoring 4th Hourly"] },
];

const PATHOLOGY_REPORT_TYPES = [
  "Haematology","Biochemistry","Microbiology","Immunology – Serology",
  "Histopathology","Cytology","Blood Bank","Clinical Pathology","Endocrinology",
];

const RADIOLOGY_REPORT_TYPES = [
  "X-Ray","USG","CT Scan","MRI","Echo","ECG","PET Scan",
  "Mammography","Fluoroscopy","Nuclear Medicine",
];

function isRadiologyType(reportType = "") {
  return RADIOLOGY_REPORT_TYPES.includes(reportType);
}

function fileNameSafe(str = "") {
  return str.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase().replace(/_+/g, "_").replace(/^_|_$/g, "");
}

function buildFileName(patientName, reportType, date) {
  const name = fileNameSafe(patientName || "PATIENT");
  const dt   = (date || new Date().toISOString().slice(0,10)).replace(/-/g, "");
  const prefix = isRadiologyType(reportType) ? "RAD" : "LAB";
  return `${prefix}_reports_${name}_${dt}.pdf`;
}

const emptyPathReport = () => ({
  id: Date.now() + Math.random(),
  reportName: "",
  reportType: "Haematology",
  billCategory: "PATHOLOGY",
  date: new Date().toISOString().slice(0,10),
  orderedBy: "",
  amount: 0,
  remarks: "",
  tests: [{ id: Date.now(), name:"", value:"", unit:"", refRange:"", status:"Normal" }],
});

const emptyRadReport = () => ({
  id: Date.now() + Math.random(),
  reportName: "",
  reportType: "X-Ray",
  billCategory: "RADIOLOGY",
  date: new Date().toISOString().slice(0,10),
  orderedBy: "",
  amount: 0,
  remarks: "",
  findings: "",
  impression: "",
  tests: [],
});

function statusColor(status) {
  if (status === "High") return "#dc2626";
  if (status === "Low")  return "#d97706";
  return "#059669";
}

// ─── SearchMultiDropdown ──────────────────────────────────────────────────────
function SearchMultiDropdown({ value, onChange, groups, placeholder, chipColor="#0369a1", chipBg="#e0f2fe", chipBorder="#7dd3fc", allowCustom=false, singleSelect=false }) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState("");
  const [panelStyle, setPanelStyle] = useState({});
  const triggerRef = useRef(null);
  const panelRef   = useRef(null);
  const selected   = value ? value.split(", ").filter(Boolean) : [];

  const calcPosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const panelH = 370;
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    const openUpward = spaceBelow < panelH && spaceAbove > spaceBelow;
    setPanelStyle({
      position:"fixed", left:rect.left, width:rect.width,
      minWidth:Math.max(rect.width,320),
      ...(openUpward ? { bottom:window.innerHeight-rect.top+5, top:"auto" } : { top:rect.bottom+5, bottom:"auto" }),
      background:"var(--white,#fff)", border:"1.5px solid var(--border,#e2e8f0)",
      borderRadius:10, boxShadow:"0 12px 40px rgba(11,37,69,.22)", zIndex:9999,
      maxHeight:Math.min(panelH, openUpward?spaceAbove:spaceBelow),
      display:"flex", flexDirection:"column", overflow:"hidden",
    });
  };

  useEffect(() => {
    if (open) { calcPosition(); window.addEventListener("scroll",calcPosition,true); window.addEventListener("resize",calcPosition); }
    return () => { window.removeEventListener("scroll",calcPosition,true); window.removeEventListener("resize",calcPosition); };
  }, [open]);

  useEffect(() => {
    const handler = e => {
      if (triggerRef.current && !triggerRef.current.contains(e.target) && panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = item => {
    if (singleSelect) { onChange(item===selected[0]?"":item); setOpen(false); setSearch(""); return; }
    const set = new Set(selected); set.has(item)?set.delete(item):set.add(item); onChange([...set].join(", "));
  };
  const remove = item => { const set=new Set(selected); set.delete(item); onChange([...set].join(", ")); };
  const addCustom = () => {
    const trimmed = search.trim(); if (!trimmed) return;
    if (singleSelect) { onChange(trimmed); setOpen(false); setSearch(""); return; }
    if (!selected.includes(trimmed)) onChange([...selected,trimmed].join(", ")); setSearch("");
  };

  const sl = search.toLowerCase();
  const filteredGroups = groups.map(g=>({...g,items:g.items.filter(i=>i.toLowerCase().includes(sl))})).filter(g=>g.items.length>0);
  const exactMatch = groups.flatMap(g=>g.items).some(i=>i.toLowerCase()===sl);

  return (
    <div style={{ position:"relative", width:"100%" }}>
      <div ref={triggerRef} onClick={()=>setOpen(o=>!o)}
        style={{ fontFamily:"inherit", fontSize:13, color:selected.length?"var(--navy)":"var(--text3)", background:"var(--bg)", border:`1.5px solid ${open?"var(--teal)":"var(--border)"}`, borderRadius:8, padding:"9px 12px", width:"100%", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between", boxSizing:"border-box", minHeight:40, transition:"border-color .15s" }}>
        <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:8 }}>
          {selected.length>0?(singleSelect?selected[0]:`${selected.length} selected`):placeholder}
        </span>
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ flexShrink:0, transform:open?"rotate(180deg)":"none", transition:"transform .2s" }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      {!singleSelect && selected.length>0 && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:6 }}>
          {selected.map(item=>(
            <span key={item} style={{ display:"inline-flex", alignItems:"center", gap:4, background:chipBg, border:`1px solid ${chipBorder}`, borderRadius:20, padding:"2px 9px", fontSize:11, color:chipColor, maxWidth:260 }}>
              <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item}</span>
              <span onMouseDown={e=>{e.preventDefault();remove(item);}} style={{ cursor:"pointer", fontSize:13, color:chipColor, fontWeight:700, lineHeight:1, flexShrink:0 }}>×</span>
            </span>
          ))}
          <span onMouseDown={e=>{e.preventDefault();onChange("");}} style={{ cursor:"pointer", fontSize:11, color:"#ef4444", alignSelf:"center", marginLeft:3 }}>Clear all</span>
        </div>
      )}
      {open && (
        <div ref={panelRef} style={panelStyle}>
          <div style={{ padding:"8px 10px", borderBottom:"1px solid var(--border)", background:"var(--bg)", flexShrink:0 }}>
            <div style={{ position:"relative" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ position:"absolute", left:9, top:"50%", transform:"translateY(-50%)", color:"var(--text3)", pointerEvents:"none" }}>
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input autoFocus placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&allowCustom&&!exactMatch&&addCustom()}
                style={{ width:"100%", fontFamily:"inherit", fontSize:12, border:"1.5px solid var(--border)", borderRadius:7, padding:"7px 9px 7px 30px", outline:"none", boxSizing:"border-box", color:"var(--navy)", background:"var(--white,#fff)" }}/>
            </div>
          </div>
          <div style={{ overflowY:"auto", flex:1 }}>
            {filteredGroups.length===0&&!allowCustom&&<div style={{ padding:"18px", textAlign:"center", fontSize:12, color:"var(--text3)" }}>No results found</div>}
            {filteredGroups.map(({group,color,items})=>(
              <div key={group}>
                <div style={{ padding:"7px 12px 4px", fontSize:10, fontWeight:700, color:color||"var(--text3)", textTransform:"uppercase", letterSpacing:".07em", background:"var(--bg)", borderBottom:"1px solid var(--border)" }}>{group}</div>
                {items.map(item=>{
                  const isSel=selected.includes(item);
                  return (
                    <div key={item} onMouseDown={e=>{e.preventDefault();toggle(item);}}
                      style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 12px", cursor:"pointer", background:isSel?(chipBg||"#e0f2fe"):"transparent", borderBottom:"1px solid var(--border,#e2e8f0)22", transition:"background .1s" }}>
                      {!singleSelect&&(
                        <div style={{ width:15, height:15, borderRadius:4, border:`2px solid ${isSel?(chipColor||"#0369a1"):"var(--border2,#ccc)"}`, background:isSel?(chipColor||"#0369a1"):"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all .1s" }}>
                          {isSel&&<svg width="8" height="8" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                      )}
                      {singleSelect&&<div style={{ width:15, height:15, borderRadius:"50%", border:`2px solid ${isSel?(chipColor||"#0369a1"):"var(--border2,#ccc)"}`, background:isSel?(chipColor||"#0369a1"):"transparent", flexShrink:0, transition:"all .1s" }}/>}
                      <span style={{ fontSize:12, color:isSel?(chipColor||"#0369a1"):"var(--navy)", fontWeight:isSel?600:400 }}>{item}</span>
                    </div>
                  );
                })}
              </div>
            ))}
            {allowCustom&&search.trim()&&!exactMatch&&(
              <div onMouseDown={e=>{e.preventDefault();addCustom();}}
                style={{ display:"flex", alignItems:"center", gap:9, padding:"9px 12px", cursor:"pointer", background:"#f0fdf4", borderTop:"1px solid #bbf7d0" }}>
                <span style={{ fontSize:16, color:"#059669" }}>+</span>
                <span style={{ fontSize:12, color:"#059669", fontWeight:600 }}>Add "{search.trim()}"</span>
              </div>
            )}
          </div>
          {!singleSelect&&(
            <div style={{ padding:"7px 12px", borderTop:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center", background:"var(--bg)", flexShrink:0 }}>
              <span style={{ fontSize:11, color:"var(--text3)" }}>{selected.length} selected</span>
              <button onMouseDown={e=>{e.preventDefault();setOpen(false);}} style={{ padding:"4px 14px", borderRadius:7, border:"none", background:"var(--navy)", color:"#fff", fontFamily:"inherit", fontSize:12, fontWeight:600, cursor:"pointer" }}>Done</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── InvestigationsDropdown ───────────────────────────────────────────────────
function InvestigationsDropdown({ value, onChange }) {
  const groups = INVESTIGATION_GROUPS.map(g=>({
    group:g.group, color:g.color,
    items:g.items.map(key=>REPORT_TEMPLATES[key]?.label||key),
  }));
  return (
    <SearchMultiDropdown value={value} onChange={onChange} groups={groups}
      placeholder="Select investigations / reports..."
      chipColor="#0369a1" chipBg="#e0f2fe" chipBorder="#7dd3fc" allowCustom={false}/>
  );
}

// ─── MedicineHistoryPicker ────────────────────────────────────────────────────
function MedicineHistoryPicker({ eMed, onAdd }) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(true);

  const historyMeds = eMed?.currentMedications
    ? eMed.currentMedications.split(", ").filter(Boolean)
    : [];

  const allMeds = MEDICATION_GROUPS.flatMap(g => g.items);

  const filtered = search.trim()
    ? allMeds.filter(m => m.toLowerCase().includes(search.toLowerCase()))
    : allMeds;

  const historyFiltered = search.trim()
    ? historyMeds.filter(m => m.toLowerCase().includes(search.toLowerCase()))
    : historyMeds;

  if (!expanded) {
    return (
      <div style={{ background:"#f0fdf4", border:"1.5px dashed #86efac", borderRadius:10, padding:"10px 16px", marginBottom:14, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontSize:12, fontWeight:600, color:"#15803d" }}>
          💊 Add from Medical History {historyMeds.length > 0 && <span style={{ background:"#dcfce7", border:"1px solid #86efac", borderRadius:20, padding:"1px 8px", fontSize:11, marginLeft:6 }}>{historyMeds.length} prescribed</span>}
        </span>
        <button onClick={() => setExpanded(true)} style={{ background:"#15803d", color:"#fff", border:"none", borderRadius:7, padding:"5px 14px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Show ▾</button>
      </div>
    );
  }

  return (
    <div style={{ background:"var(--white,#fff)", border:"1.5px solid #86efac", borderRadius:12, marginBottom:16, overflow:"hidden" }}>
      <div style={{ background:"linear-gradient(135deg,#14532d,#15803d)", padding:"12px 18px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:"#fff", display:"flex", alignItems:"center", gap:8 }}>
            💊 Add Medicines from Medical History & Library
            {historyMeds.length > 0 && (
              <span style={{ background:"rgba(255,255,255,.2)", border:"1px solid rgba(255,255,255,.3)", borderRadius:20, padding:"2px 9px", fontSize:11, color:"#bbf7d0" }}>
                {historyMeds.length} from this patient's Rx
              </span>
            )}
          </div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,.6)", marginTop:2 }}>Click any medicine to add to the bill</div>
        </div>
        <button onClick={() => setExpanded(false)} style={{ background:"rgba(255,255,255,.15)", color:"#fff", border:"1px solid rgba(255,255,255,.25)", borderRadius:7, padding:"5px 12px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Hide ▴</button>
      </div>

      <div style={{ padding:"10px 16px", borderBottom:"1px solid #dcfce7", background:"#f0fdf4" }}>
        <div style={{ position:"relative" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#86efac", pointerEvents:"none" }}>
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            placeholder="Search medicines..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width:"100%", fontFamily:"inherit", fontSize:12, border:"1.5px solid #86efac", borderRadius:8, padding:"7px 10px 7px 32px", outline:"none", boxSizing:"border-box", color:"var(--navy)", background:"#fff" }}
          />
        </div>
      </div>

      <div style={{ maxHeight:280, overflowY:"auto", padding:"12px 16px", display:"flex", flexDirection:"column", gap:10 }}>
        {historyFiltered.length > 0 && (
          <div>
            <div style={{ fontSize:10, fontWeight:700, color:"#15803d", textTransform:"uppercase", letterSpacing:".08em", marginBottom:7, display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ background:"#dcfce7", borderRadius:4, padding:"1px 6px" }}>⭐ From This Patient's Medical History</span>
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {historyFiltered.map(med => (
                <button key={med} onClick={() => onAdd(med)}
                  style={{ display:"inline-flex", alignItems:"center", gap:5, background:"#dcfce7", border:"1.5px solid #86efac", borderRadius:20, padding:"5px 12px", fontSize:12, color:"#14532d", fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:"all .13s" }}
                  onMouseEnter={e => { e.currentTarget.style.background="#bbf7d0"; e.currentTarget.style.transform="scale(1.03)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background="#dcfce7"; e.currentTarget.style.transform="scale(1)"; }}
                >
                  + {med}
                </button>
              ))}
            </div>
          </div>
        )}

        {historyMeds.length === 0 && !search && (
          <div style={{ fontSize:11, color:"#86efac", fontStyle:"italic", marginBottom:4 }}>
            No medications found in Admission Note. Fill in the Admission Note to see them here.
          </div>
        )}

        {MEDICATION_GROUPS.map(grp => {
          const items = search.trim()
            ? grp.items.filter(m => m.toLowerCase().includes(search.toLowerCase()))
            : grp.items;
          if (items.length === 0) return null;
          return (
            <div key={grp.group}>
              <div style={{ fontSize:10, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:".08em", marginBottom:6 }}>{grp.group}</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                {items.map(med => (
                  <button key={med} onClick={() => onAdd(med)}
                    style={{ display:"inline-flex", alignItems:"center", gap:4, background:"var(--bg)", border:"1px solid var(--border)", borderRadius:20, padding:"4px 10px", fontSize:11, color:"var(--text2)", fontWeight:500, cursor:"pointer", fontFamily:"inherit", transition:"all .13s" }}
                    onMouseEnter={e => { e.currentTarget.style.background="var(--tealBg)"; e.currentTarget.style.borderColor="var(--teal)"; e.currentTarget.style.color="var(--teal)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background="var(--bg)"; e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.color="var(--text2)"; }}
                  >
                    + {med}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── AdmissionNoteForm ────────────────────────────────────────────────────────
function AdmissionNoteForm({ eMed, setEMed }) {
  const setE = k => e => setEMed(p=>({...p,[k]:e.target.value}));
  const set  = k => v => setEMed(p=>({...p,[k]:v}));
  const doctorGroups = [{ group:"👨‍⚕️ Doctors", color:"#0369a1", items:DOCTOR_LIST }];
  const qualGroups   = [{ group:"🎓 Qualifications", color:"#7c3aed", items:QUALIFICATION_LIST }];
  const medGroups    = MEDICATION_GROUPS.map(g=>({group:g.group, color:"#059669", items:g.items}));

  const SectionBlock = ({ icon, title, subtitle, children }) => (
    <div style={{ background:"var(--white,#fff)", border:"1px solid var(--border)", borderRadius:14, marginBottom:18, overflow:"hidden", boxShadow:"0 1px 4px rgba(11,37,69,.06)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"15px 20px", borderBottom:"1px solid var(--border)", background:"var(--bg)" }}>
        <div style={{ width:34, height:34, borderRadius:9, background:"var(--tealBg,#e6faf8)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>{icon}</div>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:"var(--navy)" }}>{title}</div>
          <div style={{ fontSize:11, color:"var(--text3)", marginTop:1 }}>{subtitle}</div>
        </div>
      </div>
      <div style={{ padding:20 }}>{children}</div>
    </div>
  );

  const FieldWrap = ({ label, req, children }) => (
    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
      <label style={{ fontSize:10, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:".06em" }}>
        {label}{req&&<span style={{ color:"var(--red)" }}> *</span>}
      </label>
      {children}
    </div>
  );

  const inp = (label, key, placeholder, req) => (
    <FieldWrap label={label} req={req}>
      <input placeholder={placeholder} value={eMed?.[key]||""} onChange={setE(key)}
        style={{ fontFamily:"inherit", fontSize:13, color:"var(--navy)", background:"var(--bg)", border:"1.5px solid var(--border)", borderRadius:8, padding:"9px 12px", width:"100%", outline:"none", boxSizing:"border-box" }}/>
    </FieldWrap>
  );

  const txa = (label, key, placeholder, rows=3, req) => (
    <FieldWrap label={label} req={req}>
      <textarea placeholder={placeholder} value={eMed?.[key]||""} onChange={setE(key)} rows={rows}
        style={{ fontFamily:"inherit", fontSize:13, color:"var(--navy)", background:"var(--bg)", border:"1.5px solid var(--border)", borderRadius:8, padding:"9px 12px", width:"100%", outline:"none", resize:"vertical", boxSizing:"border-box" }}/>
    </FieldWrap>
  );

  return (
    <div>
      <SectionBlock icon="🩺" title="Present Complaints" subtitle="Chief complaints and presenting symptoms">
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          {txa("Present Complaints","presentComplaints","Patient presented in Department of Emergency Medicine...",4,true)}
          {txa("C/O (Chief Complaints)","chiefComplaints","Severe pain at Rt. Iliac fossa, fever with chills...",4)}
        </div>
      </SectionBlock>

      <SectionBlock icon="💓" title="Examinations" subtitle="Vitals and clinical examination findings">
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:14 }}>
          {inp("BP (mmHg)","bp","e.g. 120/80mmHg")}
          {inp("PR (/min)","pr","e.g. 82/min")}
          {inp("SPO2","spo2","e.g. 98% On RA")}
          {inp("TEMP","temp","e.g. 98.6°F")}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
          {inp("Chest","chest","e.g. B/L Crepts+")}
          {inp("CVS","cvs","e.g. S1 S2 +")}
          {inp("CNS","cns","e.g. Conscious")}
          {inp("P/A","pa","e.g. Distended")}
        </div>
      </SectionBlock>

      <SectionBlock icon="🔬" title="Investigations & Diagnosis" subtitle="Tests ordered and provisional diagnosis">
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <FieldWrap label="Investigations / Reports">
              <InvestigationsDropdown value={eMed?.investigations||""} onChange={set("investigations")}/>
            </FieldWrap>
            {txa("Additional / Custom Tests","investigationsCustom","Any other tests not listed above...",2)}
          </div>
          {txa("Provisional Diagnosis","provisionalDiagnosis","Acute Retention of Urine with ?UTI...",6,true)}
        </div>
      </SectionBlock>

      <SectionBlock icon="💊" title="Treatment & Past History" subtitle="Treatment advised and past medical history">
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
          <FieldWrap label="Current Medications">
            <SearchMultiDropdown value={eMed?.currentMedications||""} onChange={set("currentMedications")}
              groups={medGroups} placeholder="Select medications..."
              chipColor="#047857" chipBg="#d1fae5" chipBorder="#6ee7b7" allowCustom={true}/>
          </FieldWrap>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {txa("Treatment Advised","treatmentAdvised","IV Fluids NS/RL @ 100ml/hr, Inj. Esomac 40mg IV BD...",3,true)}
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
          {txa("Past History / Previous Diagnosis","previousDiagnosis","Diabetes, Hypertension, previous surgeries...",2)}
          {txa("Past Surgeries","pastSurgeries","e.g. Appendectomy 2018...",2)}
        </div>
        <FieldWrap label="Known Allergies">
          <input placeholder="e.g. Penicillin, Sulfa drugs..." value={eMed?.knownAllergies||""} onChange={setE("knownAllergies")}
            style={{ fontFamily:"inherit", fontSize:13, color:"var(--navy)", background:"var(--bg)", border:"1.5px solid var(--border)", borderRadius:8, padding:"9px 12px", width:"100%", outline:"none", boxSizing:"border-box" }}/>
        </FieldWrap>
      </SectionBlock>

      <SectionBlock icon="👨‍⚕️" title="Treating Doctor & Notes" subtitle="Doctor details and additional clinical notes">
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
          <FieldWrap label="Treating Doctor" req>
            <SearchMultiDropdown value={eMed?.treatingDoctor||""} onChange={set("treatingDoctor")}
              groups={doctorGroups} placeholder="Select or type doctor name..."
              chipColor="#0369a1" chipBg="#e0f2fe" chipBorder="#7dd3fc" allowCustom={true} singleSelect={true}/>
          </FieldWrap>
          <FieldWrap label="Qualification & Reg. No.">
            <SearchMultiDropdown value={eMed?.doctorQual||""} onChange={set("doctorQual")}
              groups={qualGroups} placeholder="Select or type qualification..."
              chipColor="#7c3aed" chipBg="#f3e8ff" chipBorder="#c4b5fd" allowCustom={true} singleSelect={true}/>
          </FieldWrap>
        </div>
        <FieldWrap label="Additional Notes / Remarks">
          <textarea placeholder="Any other relevant clinical information..." value={eMed?.notes||""} onChange={setE("notes")} rows={2}
            style={{ fontFamily:"inherit", fontSize:13, color:"var(--navy)", background:"var(--bg)", border:"1.5px solid var(--border)", borderRadius:8, padding:"9px 12px", width:"100%", outline:"none", resize:"vertical", boxSizing:"border-box" }}/>
        </FieldWrap>
      </SectionBlock>
    </div>
  );
}

// ─── PathologyReportCard ──────────────────────────────────────────────────────
function PathologyReportCard({ rep, ri, patientName, updRep, updTest, addTest, delTest, onRemove }) {
  const fileName = buildFileName(patientName, rep.reportType, rep.date);
  return (
    <div style={{ background:"var(--white,#fff)", border:"1px solid var(--border,#e2e8f0)", borderRadius:14, marginBottom:18, overflow:"hidden", boxShadow:"0 2px 12px rgba(11,37,69,.08)" }}>
      <div style={{ background:"linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%)", color:"#fff", padding:"16px 22px", display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(255,255,255,.12)", borderRadius:20, padding:"3px 10px", fontSize:10, fontWeight:700, letterSpacing:".08em", color:"#93c5fd", marginBottom:8, textTransform:"uppercase" }}>
            🧪 PATHOLOGY BILL
          </div>
          <input value={rep.reportName} placeholder="Report Name (e.g. Complete Blood Count)"
            onChange={e=>updRep(ri,"reportName",e.target.value)}
            style={{ background:"transparent", border:"none", borderBottom:"1.5px solid rgba(255,255,255,.3)", outline:"none", color:"#fff", fontFamily:"inherit", fontSize:17, fontWeight:700, width:"100%", paddingBottom:3 }}/>
          <div style={{ fontSize:11, color:"rgba(255,255,255,.45)", marginTop:6, fontFamily:"monospace" }}>📄 {fileName}</div>
          <div style={{ display:"flex", gap:18, flexWrap:"wrap", marginTop:10, fontSize:12, color:"rgba(255,255,255,.7)", alignItems:"center" }}>
            <span>👤 <strong style={{ color:"#fff" }}>{patientName||"—"}</strong></span>
            <span>
              Dept:&nbsp;
              <select value={rep.reportType} onChange={e=>updRep(ri,"reportType",e.target.value)}
                style={{ background:"transparent", border:"none", borderBottom:"1px solid rgba(255,255,255,.3)", outline:"none", color:"rgba(255,255,255,.85)", fontFamily:"inherit", fontSize:12 }}>
                {PATHOLOGY_REPORT_TYPES.map(t=><option key={t} value={t} style={{ background:"#1e3a5f" }}>{t}</option>)}
              </select>
            </span>
            <span>
              Date:&nbsp;
              <input type="date" value={rep.date} onChange={e=>updRep(ri,"date",e.target.value)}
                style={{ background:"transparent", border:"none", borderBottom:"1px solid rgba(255,255,255,.3)", outline:"none", color:"rgba(255,255,255,.7)", fontFamily:"inherit", fontSize:12 }}/>
            </span>
            <span>
              Ref.by:&nbsp;
              <input value={rep.orderedBy} placeholder="Doctor" onChange={e=>updRep(ri,"orderedBy",e.target.value)}
                style={{ background:"transparent", border:"none", borderBottom:"1px solid rgba(255,255,255,.3)", outline:"none", color:"rgba(255,255,255,.7)", fontFamily:"inherit", fontSize:12, width:140 }}/>
            </span>
          </div>
        </div>
        <button onClick={onRemove} style={{ background:"rgba(248,113,113,.15)", color:"#fca5a5", border:"1px solid rgba(248,113,113,.3)", borderRadius:6, padding:"5px 13px", cursor:"pointer", fontSize:12, fontFamily:"inherit", fontWeight:600, flexShrink:0 }}>Remove</button>
      </div>

      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <colgroup>
            <col style={{ width:"35%" }}/><col style={{ width:"12%" }}/><col style={{ width:"9%" }}/>
            <col style={{ width:"35%" }}/><col style={{ width:"9%" }}/><col style={{ width:"40px" }}/>
          </colgroup>
          <thead>
            <tr style={{ background:"var(--bg,#f8fafc)" }}>
              <th style={{ textAlign:"left", padding:"10px 16px", fontSize:11, fontWeight:700, color:"var(--text3,#94a3b8)", textTransform:"uppercase", letterSpacing:".06em", borderBottom:"2px solid var(--border,#e2e8f0)" }}>Test Name</th>
              <th style={{ textAlign:"center", padding:"10px 8px", fontSize:11, fontWeight:700, color:"#0369a1", textTransform:"uppercase", letterSpacing:".06em", borderBottom:"2px solid var(--border,#e2e8f0)", background:"#f0f9ff" }}>Value ✏️</th>
              <th style={{ textAlign:"left", padding:"10px 8px", fontSize:11, fontWeight:700, color:"var(--text3,#94a3b8)", textTransform:"uppercase", letterSpacing:".06em", borderBottom:"2px solid var(--border,#e2e8f0)" }}>Unit</th>
              <th style={{ textAlign:"left", padding:"10px 16px", fontSize:11, fontWeight:700, color:"var(--text3,#94a3b8)", textTransform:"uppercase", letterSpacing:".06em", borderBottom:"2px solid var(--border,#e2e8f0)" }}>Normal / Reference Range</th>
              <th style={{ textAlign:"center", padding:"10px 8px", fontSize:11, fontWeight:700, color:"var(--text3,#94a3b8)", textTransform:"uppercase", letterSpacing:".06em", borderBottom:"2px solid var(--border,#e2e8f0)" }}>Status</th>
              <th style={{ borderBottom:"2px solid var(--border,#e2e8f0)" }}/>
            </tr>
          </thead>
          <tbody>
            {rep.tests.map((t,ti)=>(
              <tr key={t.id} style={{ borderBottom:"1px solid var(--border,#e2e8f0)" }}>
                <td style={{ padding:"8px 16px" }}>
                  <input value={t.name} placeholder="e.g. Haemoglobin" onChange={e=>updTest(ri,ti,"name",e.target.value)}
                    style={{ background:"var(--bg,#f8fafc)", border:"1.5px solid var(--border,#e2e8f0)", borderRadius:6, padding:"6px 10px", color:"var(--navy,#0f172a)", fontSize:13, fontFamily:"inherit", outline:"none", width:"100%" }}/>
                </td>
                <td style={{ padding:"8px 8px", background:"#f0f9ff", textAlign:"center" }}>
                  <input value={t.value} placeholder="—" onChange={e=>updTest(ri,ti,"value",e.target.value)}
                    style={{ background:"#fff", border:"2px solid #bae6fd", borderRadius:6, padding:"6px 8px", color:statusColor(t.status), fontSize:13, fontFamily:"inherit", fontWeight:700, outline:"none", width:"100%", textAlign:"center" }}/>
                </td>
                <td style={{ padding:"8px 8px" }}>
                  <input value={t.unit} placeholder="g/dL" onChange={e=>updTest(ri,ti,"unit",e.target.value)}
                    style={{ background:"var(--bg,#f8fafc)", border:"1.5px solid var(--border,#e2e8f0)", borderRadius:6, padding:"6px 8px", color:"var(--text2,#475569)", fontSize:12, fontFamily:"inherit", outline:"none", width:"100%" }}/>
                </td>
                <td style={{ padding:"8px 16px" }}>
                  <input value={t.refRange} placeholder="e.g. 13.0 – 17.0" onChange={e=>updTest(ri,ti,"refRange",e.target.value)}
                    style={{ background:"var(--bg,#f8fafc)", border:"1.5px solid var(--border,#e2e8f0)", borderRadius:6, padding:"6px 10px", color:"var(--text2,#475569)", fontSize:13, fontFamily:"inherit", outline:"none", width:"100%" }}/>
                </td>
                <td style={{ padding:"8px 8px", textAlign:"center" }}>
                  <select value={t.status} onChange={e=>updTest(ri,ti,"status",e.target.value)}
                    style={{ background:"var(--bg,#f8fafc)", border:"1.5px solid var(--border,#e2e8f0)", borderRadius:6, padding:"5px 4px", color:statusColor(t.status), fontSize:11, fontFamily:"inherit", outline:"none", fontWeight:700 }}>
                    <option>Normal</option><option>High</option><option>Low</option>
                  </select>
                </td>
                <td style={{ padding:"8px 8px", textAlign:"center" }}>
                  <button onClick={()=>delTest(ri,ti)} style={{ background:"var(--redBg,#fef2f2)", border:"1px solid rgba(185,28,28,.15)", color:"var(--red,#dc2626)", borderRadius:5, padding:"4px 8px", cursor:"pointer", fontSize:12, fontFamily:"inherit" }}>×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ padding:"8px 16px" }}>
        <button onClick={()=>addTest(ri)} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"7px 14px", background:"var(--bg,#f8fafc)", border:"1.5px dashed var(--border2,#cbd5e1)", color:"var(--text2,#475569)", borderRadius:8, cursor:"pointer", fontSize:12, fontFamily:"inherit", fontWeight:600 }}>
          + Add Row
        </button>
      </div>

      <div style={{ padding:"12px 22px", borderTop:"1px solid var(--border,#e2e8f0)", background:"var(--bg,#f8fafc)", display:"flex", alignItems:"flex-end", gap:16, flexWrap:"wrap" }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:10, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:".06em", marginBottom:4 }}>Remarks / Interpretation</div>
          <input value={rep.remarks} placeholder="e.g. Mild anaemia noted, TLC elevated..." onChange={e=>updRep(ri,"remarks",e.target.value)}
            style={{ width:"100%", background:"#fff", border:"1.5px solid var(--border,#e2e8f0)", borderRadius:8, padding:"8px 12px", color:"var(--navy,#0f172a)", fontSize:13, fontFamily:"inherit", outline:"none" }}/>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
          <span style={{ fontSize:12, fontWeight:600, color:"var(--text3)", whiteSpace:"nowrap" }}>Amount (Rs.)</span>
          <input type="number" value={rep.amount} onChange={e=>updRep(ri,"amount",Number(e.target.value))}
            style={{ width:110, background:"#fff", border:"1.5px solid var(--border,#e2e8f0)", borderRadius:8, padding:"8px 10px", color:"var(--navy,#0f172a)", fontSize:13, fontFamily:"inherit", fontWeight:700, outline:"none" }}/>
        </div>
      </div>
    </div>
  );
}

// ─── RadiologyReportCard ──────────────────────────────────────────────────────
function RadiologyReportCard({ rep, ri, patientName, updRep, onRemove }) {
  const fileName = buildFileName(patientName, rep.reportType, rep.date);
  return (
    <div style={{ background:"var(--white,#fff)", border:"1px solid var(--border,#e2e8f0)", borderRadius:14, marginBottom:18, overflow:"hidden", boxShadow:"0 2px 12px rgba(11,37,69,.08)" }}>
      <div style={{ background:"linear-gradient(135deg,#064e3b 0%,#065f46 100%)", color:"#fff", padding:"16px 22px", display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(255,255,255,.12)", borderRadius:20, padding:"3px 10px", fontSize:10, fontWeight:700, letterSpacing:".08em", color:"#6ee7b7", marginBottom:8, textTransform:"uppercase" }}>
            🩻 RADIOLOGY BILL
          </div>
          <input value={rep.reportName} placeholder="Radiology Report Name (e.g. X-Ray Chest PA View)"
            onChange={e=>updRep(ri,"reportName",e.target.value)}
            style={{ background:"transparent", border:"none", borderBottom:"1.5px solid rgba(255,255,255,.3)", outline:"none", color:"#fff", fontFamily:"inherit", fontSize:17, fontWeight:700, width:"100%", paddingBottom:3 }}/>
          <div style={{ fontSize:11, color:"rgba(255,255,255,.45)", marginTop:6, fontFamily:"monospace" }}>📄 {fileName}</div>
          <div style={{ display:"flex", gap:18, flexWrap:"wrap", marginTop:10, fontSize:12, color:"rgba(255,255,255,.7)", alignItems:"center" }}>
            <span>👤 <strong style={{ color:"#fff" }}>{patientName||"—"}</strong></span>
            <span>
              Modality:&nbsp;
              <select value={rep.reportType} onChange={e=>updRep(ri,"reportType",e.target.value)}
                style={{ background:"transparent", border:"none", borderBottom:"1px solid rgba(255,255,255,.3)", outline:"none", color:"rgba(255,255,255,.85)", fontFamily:"inherit", fontSize:12 }}>
                {RADIOLOGY_REPORT_TYPES.map(t=><option key={t} value={t} style={{ background:"#065f46" }}>{t}</option>)}
              </select>
            </span>
            <span>
              Date:&nbsp;
              <input type="date" value={rep.date} onChange={e=>updRep(ri,"date",e.target.value)}
                style={{ background:"transparent", border:"none", borderBottom:"1px solid rgba(255,255,255,.3)", outline:"none", color:"rgba(255,255,255,.7)", fontFamily:"inherit", fontSize:12 }}/>
            </span>
            <span>
              Ref.by:&nbsp;
              <input value={rep.orderedBy} placeholder="Doctor" onChange={e=>updRep(ri,"orderedBy",e.target.value)}
                style={{ background:"transparent", border:"none", borderBottom:"1px solid rgba(255,255,255,.3)", outline:"none", color:"rgba(255,255,255,.7)", fontFamily:"inherit", fontSize:12, width:140 }}/>
            </span>
          </div>
        </div>
        <button onClick={onRemove} style={{ background:"rgba(248,113,113,.15)", color:"#fca5a5", border:"1px solid rgba(248,113,113,.3)", borderRadius:6, padding:"5px 13px", cursor:"pointer", fontSize:12, fontFamily:"inherit", fontWeight:600, flexShrink:0 }}>Remove</button>
      </div>

      <div style={{ padding:"20px 22px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div>
          <label style={{ fontSize:10, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:".06em", display:"block", marginBottom:6 }}>Findings / Report</label>
          <textarea value={rep.findings||""} placeholder="Describe radiological findings here..." onChange={e=>updRep(ri,"findings",e.target.value)} rows={5}
            style={{ width:"100%", background:"var(--bg,#f8fafc)", border:"1.5px solid var(--border,#e2e8f0)", borderRadius:8, padding:"10px 12px", color:"var(--navy,#0f172a)", fontSize:13, fontFamily:"inherit", outline:"none", resize:"vertical", boxSizing:"border-box" }}/>
        </div>
        <div>
          <label style={{ fontSize:10, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:".06em", display:"block", marginBottom:6 }}>Impression / Conclusion</label>
          <textarea value={rep.impression||""} placeholder="Clinical impression / diagnosis..." onChange={e=>updRep(ri,"impression",e.target.value)} rows={5}
            style={{ width:"100%", background:"var(--bg,#f8fafc)", border:"1.5px solid var(--border,#e2e8f0)", borderRadius:8, padding:"10px 12px", color:"var(--navy,#0f172a)", fontSize:13, fontFamily:"inherit", outline:"none", resize:"vertical", boxSizing:"border-box" }}/>
        </div>
      </div>

      <div style={{ padding:"12px 22px", borderTop:"1px solid var(--border,#e2e8f0)", background:"var(--bg,#f8fafc)", display:"flex", alignItems:"flex-end", gap:16, flexWrap:"wrap" }}>
        <div style={{ flex:1 }}>
          <label style={{ fontSize:10, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:".06em", display:"block", marginBottom:4 }}>Remarks</label>
          <input value={rep.remarks} placeholder="Additional remarks..." onChange={e=>updRep(ri,"remarks",e.target.value)}
            style={{ width:"100%", background:"#fff", border:"1.5px solid var(--border,#e2e8f0)", borderRadius:8, padding:"8px 12px", color:"var(--navy,#0f172a)", fontSize:13, fontFamily:"inherit", outline:"none" }}/>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
          <span style={{ fontSize:12, fontWeight:600, color:"var(--text3)", whiteSpace:"nowrap" }}>Amount (Rs.)</span>
          <input type="number" value={rep.amount} onChange={e=>updRep(ri,"amount",Number(e.target.value))}
            style={{ width:110, background:"#fff", border:"1.5px solid var(--border,#e2e8f0)", borderRadius:8, padding:"8px 10px", color:"var(--navy,#0f172a)", fontSize:13, fontFamily:"inherit", fontWeight:700, outline:"none" }}/>
        </div>
      </div>
    </div>
  );
}

// ─── Billing utility functions ────────────────────────────────────────────────
const INSURANCE_TYPES = ["Self Pay","TPA","ECHS","ECI","FCI","Ayushman Bharat","Northern Railways"];
const TPA_DOCS = [
  { key:"final_bill",       label:"Final Bill" },
  { key:"pharmacy_bill",    label:"Pharmacy Bill" },
  { key:"pathology_bill",   label:"Pathology Bill" },
  { key:"radiology_bill",   label:"Radiology Bill" },
  { key:"discharge_summary",label:"Discharge Summary" },
  { key:"reports",          label:"Reports" },
  { key:"admission_note",   label:"Admission Note" },
];

const fmt        = n => "Rs." + Number(n||0).toLocaleString("en-IN");
const fmtDt      = d => d ? new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "--";
const fmtDtShort = d => d ? new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short"}) : "--";

function calcTotals(svcs, labReports, med, billing) {
  const s = svcs.reduce((a,r)=>a+Number(r.amount||0),0);
  const p = labReports.reduce((a,r)=>a+Number(r.amount||0),0);
  const m = med.reduce((a,r)=>a+Number(r.amount||0),0);
  const gross=s+p+m, disc=Number(billing?.discount||0), adv=Number(billing?.advance||0), paid=Number(billing?.paidNow||0);
  return { s,p,m,gross,disc,adv,paid,net:gross-disc,due:gross-disc-adv-paid };
}

function normalizeServices(services=[]) {
  return services.map((svc,i)=>({
    id:svc.id||`svc-${i}`, name:svc.svcName||svc.title||"", category:svc.svcCat||svc.type||"",
    qty:Number(svc.svcQty??svc.qty??1), rate:Number(svc.svcRate??svc.rate??0),
    amount:Number(svc.svcTot??svc.total??((svc.svcRate??svc.rate??0)*(svc.svcQty??svc.qty??1))),
    date:svc.svcDate||svc.date||"",
  }));
}

function hasAnyValue(value) {
  if (value===null||value===undefined) return false;
  if (typeof value==="number") return value!==0;
  if (typeof value==="string") return value.trim()!=="";
  if (Array.isArray(value)) return value.some(hasAnyValue);
  if (typeof value==="object") return Object.values(value).some(hasAnyValue);
  return Boolean(value);
}

function isPathologyCategory(category="") {
  const n=String(category).toLowerCase();
  return ["path","lab","bio","haem","micro","sero","histo","radiology","x-ray","scan","echo","usg","mri","ct"].some(k=>n.includes(k));
}
function isMedicineCategory(category="") {
  const n=String(category).toLowerCase();
  return ["med","pharma","drug"].some(k=>n.includes(k));
}

function normalizeLabReports(reports=[], fallbackServices=[]) {
  if (reports.length) {
    return reports.map((r,i)=>({
      id:r.id||`report-${i}`, reportName:r.reportName||r.report_name||"",
      reportType:r.reportType||r.report_type||"Haematology",
      billCategory: isRadiologyType(r.reportType||r.report_type||"") ? "RADIOLOGY" : "PATHOLOGY",
      reportCategory:r.reportCategory||r.report_category||"",
      date:r.date||r.report_date||new Date().toISOString().slice(0,10),
      orderedBy:r.orderedBy||r.ordered_by||"", amount:Number(r.amount||0), remarks:r.remarks||"",
      modalityDetails:r.modalityDetails||r.modality_details||{},
      findings:r.findings||"", impression:r.impression||"",
      tests:Array.isArray(r.tests)?r.tests:Array.isArray(r.table_data)?r.table_data:[{id:Date.now()+i,name:"",value:"",unit:"",refRange:"",status:"Normal"}],
    }));
  }
  return fallbackServices.filter(s=>isPathologyCategory(s.category)).map((s,i)=>({
    id:s.id||`legacy-report-${i}`, reportName:s.name, reportType:s.category||"Haematology",
    billCategory:"PATHOLOGY", reportCategory:"legacy",
    date:s.date||new Date().toISOString().slice(0,10), orderedBy:"", amount:Number(s.amount||0),
    remarks:"", modalityDetails:{}, findings:"", impression:"",
    tests:[{id:Date.now()+i,name:s.name,value:"",unit:"",refRange:"",status:"Normal"}],
  }));
}

function normalizePharmacyRecords(records=[], fallbackServices=[]) {
  if (records.length) {
    return records.map((r,i)=>({
      id:r.id||`pharmacy-${i}`, item:r.item||r.medicine_name||"",
      date:r.date||r.date_given||new Date().toISOString().slice(0,10),
      amount:Number(r.amount??(Number(r.quantity||1)*Number(r.rate||0))),
      quantity:Number(r.quantity||1), rate:Number(r.rate||0),
      batchNo:r.batchNo||r.batch_no||"", expiryDate:r.expiryDate||r.expiry_date||"",
    }));
  }
  return fallbackServices.filter(s=>isMedicineCategory(s.category)).map((s,i)=>({
    id:s.id||`legacy-pharmacy-${i}`, item:s.name, date:s.date||new Date().toISOString().slice(0,10),
    amount:Number(s.amount||0), quantity:Number(s.qty||1), rate:Number(s.rate||0), batchNo:"", expiryDate:"",
  }));
}

function deriveInsuranceType(patient, billing) {
  if (billing?.insuranceType) return billing.insuranceType;
  const payMode=String(patient?.payMode||"").toLowerCase();
  if (payMode.includes("cashless")) return patient?.cashlessType||patient?.tpa||"TPA";
  return "Self Pay";
}

function deriveSavedState(discharge, medicalHistory, labReports, pharmacyRecords, billing, services) {
  return {
    discharge:hasAnyValue({diagnosis:discharge?.diagnosis,doctor:discharge?.doctor,ward:discharge?.ward,bed:discharge?.bed,doa:discharge?.doa,dod:discharge?.dod,expectedDod:discharge?.expectedDod,condition:discharge?.condition,instructions:discharge?.instructions,notes:discharge?.notes}),
    admission:hasAnyValue(medicalHistory),
    reports:labReports.length>0,
    medicines:pharmacyRecords.length>0,
    billing:services.length>0||hasAnyValue({discount:billing?.discount,advance:billing?.advance,paidNow:billing?.paidNow,paymentMode:billing?.paymentMode,remarks:billing?.remarks,insuranceType:billing?.insuranceType,tpaInfo:billing?.tpaInfo,tpaDocStatus:billing?.tpaDocStatus}),
  };
}

// ─── FIX: Robust dual-format patient normalizer ────────────────────────────────
// Handles THREE possible data shapes from the API:
//   Shape A (nested):  [{ uhid, patientName, admissions: [{ admNo, services, ... }] }]
//   Shape B (flat):    [{ uhid, patientName, admNo, services, ... }]  ← each record IS one admission
//   Shape C (mixed):   any combination of the above
function mapLivePatients(records=[], branchKey="laxmi") {
  const branchName = branchKey==="raya"?"Raya Branch":"Laxmi Nagar Branch";

  // Ensure records is always an array
  if (!Array.isArray(records) || records.length === 0) return [];

  const result = [];

  for (const record of records) {
    if (!record) continue;

    // Determine if this record uses nested admissions (Shape A) or is flat (Shape B)
    const hasNestedAdmissions = Array.isArray(record.admissions) && record.admissions.length > 0;

    // Build the list of admissions to iterate over
    const admissions = hasNestedAdmissions
      ? record.admissions
      : [record]; // treat the record itself as a single admission

    for (const adm of admissions) {
      if (!adm) continue;

      // Patient-level fields: prefer parent record, fall back to adm itself
      const patient = hasNestedAdmissions ? record : adm;

      const allServices    = normalizeServices(adm.services || []);
      const labReports     = normalizeLabReports(adm.labReports || [], allServices);
      const medicalBill    = normalizePharmacyRecords(adm.pharmacyRecords || [], allServices);
      const directServices = allServices.filter(s => !isPathologyCategory(s.category) && !isMedicineCategory(s.category));
      const discharge      = adm.discharge || {};
      const medicalHistory = adm.medicalHistory || {};

      const billingInfo = {
        id:               adm.billing?.id,
        discount:         Number(adm.billing?.discount  || 0),
        advance:          Number(adm.billing?.advance   || 0),
        paidNow:          Number(adm.billing?.paidNow   || 0),
        paymentMode:      adm.billing?.paymentMode      || "",
        remarks:          adm.billing?.remarks          || "",
        insuranceType:    deriveInsuranceType(patient, adm.billing),
        tpaInfo:          adm.billing?.tpaInfo          || { tpaName: patient?.tpa||"", policyNo: patient?.tpaCard||"", claimNo: patient?.tpaPanelCardNo||"", authNo:"" },
        tpaDocStatus:     adm.billing?.tpaDocStatus     || {},
        printStatus:      adm.billing?.printStatus      || "DRAFT",
        guardianName:     adm.billing?.guardianName     || patient?.guardianName || "",
        cardNo:           adm.billing?.cardNo           || patient?.cardNo       || "",
        claimId:          adm.billing?.claimId          || patient?.claimId      || "",
        panel:            adm.billing?.panel            || patient?.panel        || "CASH",
        statusOnDischarge:adm.billing?.statusOnDischarge|| discharge?.dischargeStatus || "",
        billNo:           adm.billing?.billNo           || adm.admNo             || "",
      };

      const dischargeObj = {
        doa:          discharge.doa          || adm.dateTime || adm.doa || "",
        dod:          discharge.dod          || adm.dod      || "",
        expectedDod:  discharge.expectedDod  || adm.expectedDod || "",
        ward:         discharge.wardName     || adm.wardName || adm.ward || "",
        bed:          discharge.bedNo        || discharge.roomNo || adm.bedNo || adm.bed || "",
        doctor:       discharge.doctorName   || adm.doctorName || "",
        diagnosis:    discharge.diagnosis    || "",
        condition:    discharge.dischargeStatus || "",
        instructions: discharge.instructions || "",
        notes:        discharge.notes        || "",
      };

      const savedState = deriveSavedState(
        dischargeObj, medicalHistory, labReports, medicalBill, billingInfo, directServices
      );

      result.push({
        uhid:           patient.uhid        || adm.uhid        || "",
        admNo:          adm.admNo           || adm.id          || "",
        assignedTo:     adm.assigned_to     || null,
        assignedToName: adm.assigned_to_name|| "",
        department:     adm.department      || "Billing",
        branch:         branchName,
        patientName:    patient.patientName || patient.name    || adm.patientName || "Unknown Patient",
        age:            patient.ageYY       || patient.age     || adm.age         || "—",
        gender:         patient.gender      || adm.gender      || "",
        phone:          patient.phone       || adm.phone       || "",
        address:        patient.address     || adm.address     || "",
        doa:            dischargeObj.doa,
        dod:            dischargeObj.dod,
        expectedDod:    dischargeObj.expectedDod,
        ward:           dischargeObj.ward,
        bed:            dischargeObj.bed,
        doctor:         dischargeObj.doctor || medicalHistory.treatingDoctor || "",
        diagnosis:      dischargeObj.diagnosis || medicalHistory.previousDiagnosis || "",
        status:         dischargeObj.dod ? "discharged" : "admitted",
        taskStatus:     billingInfo.printStatus === "APPROVED" ? "completed"
                      : billingInfo.printStatus === "PENDING"  ? "submitted"
                      : "pending",
        saved:          savedState,
        discharge:      dischargeObj,
        medicalHistory: {
          previousDiagnosis:   medicalHistory.previousDiagnosis   || "",
          pastSurgeries:       medicalHistory.pastSurgeries        || "",
          currentMedications:  medicalHistory.currentMedications   || "",
          treatingDoctor:      medicalHistory.treatingDoctor        || "",
          knownAllergies:      medicalHistory.knownAllergies        || "",
          chronicConditions:   medicalHistory.chronicConditions     || "",
          familyHistory:       medicalHistory.familyHistory         || "",
          smokingStatus:       medicalHistory.smokingStatus         || "",
          alcoholUse:          medicalHistory.alcoholUse            || "",
          notes:               medicalHistory.notes                 || "",
          presentComplaints:   medicalHistory.presentComplaints     || "",
          chiefComplaints:     medicalHistory.chiefComplaints       || "",
          bp:                  medicalHistory.bp                    || "",
          pr:                  medicalHistory.pr                    || "",
          spo2:                medicalHistory.spo2                  || "",
          temp:                medicalHistory.temp                  || "",
          chest:               medicalHistory.chest                 || "",
          cvs:                 medicalHistory.cvs                   || "",
          cns:                 medicalHistory.cns                   || "",
          pa:                  medicalHistory.pa                    || "",
          investigations:      medicalHistory.investigations        || "",
          investigationsCustom:medicalHistory.investigationsCustom  || "",
          provisionalDiagnosis:medicalHistory.provisionalDiagnosis  || "",
          treatmentAdvised:    medicalHistory.treatmentAdvised       || "",
          doctorQual:          medicalHistory.doctorQual             || "",
        },
        services:    directServices,
        labReports,
        medicalBill,
        billing:     billingInfo,
      });
    }
  }

  return result;
}

function buildDischargePayload(form) {
  return { doa:form.doa||"",dod:form.dod||"",expectedDod:form.expectedDod?String(form.expectedDod).slice(0,10):"",wardName:form.ward||"",bedNo:form.bed||"",roomNo:form.bed||"",doctorName:form.doctor||"",diagnosis:form.diagnosis||"",dischargeStatus:form.condition||"",instructions:form.instructions||"",notes:form.notes||"" };
}
function buildServicePayload(service, fallbackCategory) {
  const qty=Number(service.qty||1), rate=Number(service.rate||service.amount||0);
  return { svcName:service.name,svcCat:service.category||fallbackCategory,svcQty:qty,svcRate:rate,svcDate:service.date||new Date().toISOString().slice(0,10),pricing_type:service.pricing_type,rate,qty };
}
function buildLabReportPayload(report) {
  return { reportName:report.reportName||"",reportType:report.reportType||"Haematology",reportCategory:report.reportCategory||"",date:report.date||new Date().toISOString().slice(0,10),orderedBy:report.orderedBy||"",amount:Number(report.amount||0),remarks:report.remarks||"",modalityDetails:report.modalityDetails||{},findings:report.findings||"",impression:report.impression||"",tests:Array.isArray(report.tests)?report.tests:[] };
}
function buildPharmacyPayload(record) {
  return { medicine_name:record.item||"",date_given:record.date||new Date().toISOString().slice(0,10),quantity:Number(record.quantity||1),rate:Number(record.rate||(record.amount||0)),batch_no:record.batchNo||"",expiry_date:record.expiryDate||"" };
}

const SECTION_KEYS   = ["discharge","admission","reports","medicines","billing"];
const SECTION_LABELS = { discharge:"Discharge Summary",admission:"Admission Note",reports:"Reports",medicines:"Medicine Bill",billing:"Final Bill" };
const SECTION_ICONS  = { discharge:"P",admission:"A",reports:"R",medicines:"M",billing:"B" };
const TAB_MAP        = { discharge:"discharge",admission:"medical",reports:"reports",medicines:"med_bill",billing:"finalbill" };
let _tid = 0;

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --navy:var(--accent-strong,#115e59);--navy2:var(--accent-hover,#0f766e);
  --bg2:var(--surface-2);--white:var(--surface);--border2:var(--border-strong);
  --text2:var(--text-mid);--text3:var(--text-muted);
  --teal:var(--accent);--teal2:var(--accent-hover);--tealBg:var(--accent-soft);
  --amber:var(--warning);--amberBg:var(--warning-soft);
  --red:var(--danger);--redBg:var(--danger-soft);
  --blue:var(--info);--blueBg:var(--info-soft);
  --green:var(--success);--greenBg:var(--success-soft);
  --r:10px;--r2:14px;--sh:var(--shadow-sm);--sh2:var(--shadow-md);
}
body{background:var(--bg);color:var(--text);font-family:var(--ui-font-sans);font-size:15px}
.app{display:flex;flex-direction:column;min-height:100vh}
.layout{display:flex;flex:1}
.main{flex:1;overflow-y:auto;padding:28px 32px}
.topbar{height:60px;background:var(--hdr-bg);display:flex;align-items:center;padding:0 28px;justify-content:space-between;position:sticky;top:0;z-index:200;box-shadow:var(--shadow-md)}
.logo{width:38px;height:38px;border-radius:9px;background:var(--hdr-chip-bg);border:1px solid var(--hdr-chip-border);display:flex;align-items:center;justify-content:center;font-family:var(--ui-font-sans);color:var(--hdr-text);font-size:17px;font-weight:800;flex-shrink:0}
.brand-name{font-size:16px;font-weight:700;color:var(--hdr-text)}
.brand-sub{font-size:11px;color:var(--hdr-sub);letter-spacing:.05em;text-transform:uppercase}
.user-av{width:32px;height:32px;border-radius:50%;background:var(--hdr-chip-bg);border:1px solid var(--hdr-chip-border);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:var(--hdr-text)}
.user-nm{font-size:14px;font-weight:600;color:var(--hdr-text)}
.user-id{font-size:12px;color:var(--hdr-sub)}
.so-btn{padding:6px 14px;border-radius:7px;font-size:13px;font-weight:600;background:var(--hdr-chip-bg);border:1px solid var(--hdr-chip-border);color:var(--hdr-text);cursor:pointer;font-family:inherit}
.so-btn:hover{filter:brightness(1.07)}
.sidebar{width:210px;min-width:210px;background:var(--white);border-right:1px solid var(--border);display:flex;flex-direction:column;padding:20px 10px;position:sticky;top:60px;height:calc(100vh - 60px);overflow-y:auto}
.slbl{font-size:10px;font-weight:700;color:var(--text3);letter-spacing:.1em;text-transform:uppercase;padding:0 10px 8px}
.si{display:flex;align-items:center;gap:9px;padding:9px 11px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;color:var(--text2);transition:.13s;position:relative}
.si:hover{background:var(--bg);color:var(--text)}
.si.act{background:var(--tealBg);color:var(--teal);font-weight:700}
.si.act::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:3px;height:20px;background:var(--teal);border-radius:0 3px 3px 0}
.sbdg{margin-left:auto;background:var(--amber);color:#fff;border-radius:20px;font-size:10px;font-weight:700;padding:2px 7px}
.shr{height:1px;background:var(--border);margin:12px 10px}
.smr{display:flex;justify-content:space-between;padding:5px 11px;font-size:12px;border-bottom:1px solid var(--border)}
.smr:last-child{border-bottom:none}
.smrl{color:var(--text3)}
.pgh{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:22px}
.pgt{font-size:26px;color:var(--text);font-weight:800;letter-spacing:-.02em}
.pgs{font-size:13px;color:var(--text3);margin-top:3px}
.dchip{padding:7px 14px;border-radius:8px;font-size:12px;font-weight:600;background:var(--white);border:1px solid var(--border);color:var(--text2);white-space:nowrap}
.srow{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:26px}
.sc{background:var(--white);border:1px solid var(--border);border-radius:var(--r2);padding:18px 20px;position:relative;overflow:hidden}
.sc::after{content:'';position:absolute;bottom:0;left:0;right:0;height:3px}
.sc.c1::after{background:var(--teal)}.sc.c2::after{background:var(--amber)}.sc.c3::after{background:var(--blue)}
.scv{font-size:30px;line-height:1;margin-bottom:4px;font-weight:800}
.sc.c1 .scv{color:var(--teal)}.sc.c2 .scv{color:var(--amber)}.sc.c3 .scv{color:var(--blue)}
.scl{font-size:12px;color:var(--text3);font-weight:500}
.tgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:14px}
.tc{background:var(--white);border:1px solid var(--border);border-radius:var(--r2);padding:18px 20px;cursor:pointer;transition:.18s}
.tc:hover{border-color:var(--teal);box-shadow:var(--sh2);transform:translateY(-2px)}
.tctp{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px;gap:8px}
.tcnm{font-size:15px;font-weight:700;color:var(--navy)}
.tcid{font-size:11px;color:var(--text3);font-family:monospace;margin-top:2px}
.tcrs{margin-bottom:10px;display:flex;flex-direction:column;gap:5px}
.tcrw{display:flex;align-items:center;gap:7px;font-size:12px;color:var(--text2)}
.tcri{width:16px;text-align:center;color:var(--text3);flex-shrink:0}
.tc-dod{display:flex;gap:0;margin-bottom:12px;background:var(--bg);border-radius:8px;border:1px solid var(--border);overflow:hidden}
.tc-dod-item{flex:1;padding:8px 10px;display:flex;flex-direction:column;gap:2px;border-right:1px solid var(--border)}
.tc-dod-item:last-child{border-right:none}
.tc-dod-lbl{font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.07em}
.tc-dod-val{font-size:12px;font-weight:700;color:var(--navy)}
.tc-dod-val.exp{color:var(--amber)}.tc-dod-val.dis{color:var(--teal)}
.tcch{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}
.tcft{display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px solid var(--border)}
.tcdoa{font-size:11px;color:var(--text3)}
.tcpb{margin-bottom:12px}
.tcpbar{height:4px;background:var(--border);border-radius:4px;overflow:hidden;margin-top:5px}
.tcpfil{height:100%;background:var(--teal);border-radius:4px;transition:width .3s}
.tcplbl{font-size:11px;color:var(--text3)}
.badge{display:inline-flex;align-items:center;gap:4px;padding:4px 9px;border-radius:20px;font-size:11px;font-weight:700;white-space:nowrap}
.ba{background:var(--amberBg);color:var(--amber)}.bt{background:var(--tealBg);color:var(--teal)}
.bb{background:var(--blueBg);color:var(--blue)}.bg{background:var(--greenBg);color:var(--green)}
.chip{padding:3px 9px;border-radius:20px;font-size:11px;font-weight:600;background:var(--bg2);color:var(--text2);border:1px solid var(--border)}
.back-btn{display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:600;color:var(--text2);cursor:pointer;background:var(--white);border:1px solid var(--border);border-radius:8px;padding:7px 15px;font-family:inherit;transition:.14s;margin-bottom:20px}
.back-btn:hover{color:var(--navy);border-color:var(--navy)}
.dhdr{background:var(--white);border:1px solid var(--border);border-radius:var(--r2);padding:20px 24px;margin-bottom:10px}
.dname{font-size:22px;color:var(--navy);margin-bottom:4px;font-weight:800}
.dmeta{font-size:13px;color:var(--text2);margin-bottom:10px}
.dmeta strong{color:var(--navy)}
.dod-strip{display:flex;gap:0;background:var(--bg);border-radius:10px;border:1px solid var(--border);overflow:hidden;margin-top:12px}
.dod-strip-item{flex:1;padding:10px 16px;display:flex;flex-direction:column;gap:3px;border-right:1px solid var(--border)}
.dod-strip-item:last-child{border-right:none}
.dod-strip-lbl{font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.07em}
.dod-strip-val{font-size:13px;font-weight:700;color:var(--navy)}
.dod-strip-val.exp{color:var(--amber)}.dod-strip-val.dis{color:var(--teal)}.dod-strip-val.dia{color:var(--blue)}
.clpanel{background:var(--white);border:1px solid var(--border);border-radius:var(--r2);padding:18px 20px;margin-bottom:18px}
.cltitle{font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.09em;margin-bottom:14px}
.clsteps{display:flex;align-items:center;margin-bottom:16px}
.clstep{display:flex;align-items:center;gap:8px;flex:1;min-width:0;padding:9px 10px;border-radius:9px;cursor:pointer;transition:.13s}
.clstep:hover{background:var(--bg)}.clstep.done{background:var(--tealBg)}.clstep.cur{background:var(--blueBg)}
.clchk{width:26px;height:26px;border-radius:50%;border:2px solid var(--border2);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:11px;font-weight:700;background:var(--white);color:var(--text3)}
.clstep.done .clchk{background:var(--teal);border-color:var(--teal);color:#fff}
.clstep.cur .clchk{border-color:var(--blue);color:var(--blue)}
.cllbl{font-size:11px;font-weight:600;color:var(--text2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.clstep.done .cllbl{color:var(--teal)}.clstep.cur .cllbl{color:var(--blue)}
.clcon{width:14px;height:2px;background:var(--border);flex-shrink:0}
.clcon.done{background:var(--teal)}
.clfoot{border-top:1px solid var(--border);padding-top:14px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}
.clmsg-ok{font-size:13px;color:var(--teal);font-weight:600}
.clmsg-pend{font-size:13px;color:var(--text3)}
.clmsg-cnt{color:var(--amber);font-weight:700}
.hod-btn{padding:10px 22px;border-radius:8px;font-size:13px;font-weight:700;background:var(--teal);color:#fff;border:none;cursor:pointer;font-family:inherit;transition:.16s;box-shadow:0 3px 10px rgba(13,124,114,.2)}
.hod-btn:hover{background:var(--teal2);transform:translateY(-1px)}
.hod-btn:disabled{opacity:.4;cursor:not-allowed;transform:none;box-shadow:none}
.done-bdg{padding:10px 18px;border-radius:8px;background:var(--tealBg);border:1px solid rgba(13,124,114,.25);color:var(--teal);font-weight:700;font-size:13px}
.savebtn{padding:10px 22px;border-radius:8px;font-size:13px;font-weight:700;background:var(--navy);color:#fff;border:none;cursor:pointer;font-family:inherit;transition:.14s;margin-top:4px}
.savebtn:hover{background:var(--navy2)}
.twrap{background:var(--white);border:1px solid var(--border);border-radius:var(--r2);overflow:hidden;margin-bottom:20px}
.tabs{display:flex;overflow-x:auto;border-bottom:1px solid var(--border)}
.tabbtn{padding:12px 18px;font-size:13px;font-weight:600;cursor:pointer;border:none;background:none;color:var(--text3);font-family:inherit;border-bottom:2px solid transparent;transition:.13s;white-space:nowrap;display:flex;align-items:center;gap:6px}
.tabbtn:hover{color:var(--text2)}.tabbtn.act{color:var(--teal);border-bottom-color:var(--teal)}
.tdot{width:7px;height:7px;border-radius:50%;background:var(--teal)}
.secc{background:var(--white);border:1px solid var(--border);border-radius:var(--r2);margin-bottom:16px;overflow:hidden}
.sech{display:flex;align-items:center;justify-content:space-between;padding:13px 20px;border-bottom:1px solid var(--border);background:var(--bg)}
.sect{font-size:14px;font-weight:700;color:var(--navy);display:flex;align-items:center;gap:7px}
.secb{padding:20px}
.fgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px}
.fg{display:flex;flex-direction:column;gap:5px}
.fg.full{grid-column:1/-1}
.flbl{font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.07em}
.finp,.fsel,.ftxt{background:var(--bg);border:1.5px solid var(--border);border-radius:8px;padding:9px 12px;color:var(--navy);font-size:13px;font-family:inherit;transition:.14s;outline:none;width:100%}
.finp:focus,.fsel:focus,.ftxt:focus{border-color:var(--teal);background:#fff;box-shadow:0 0 0 3px rgba(13,124,114,.07)}
.ftxt{resize:vertical;min-height:78px}
.tw{overflow-x:auto;border-radius:var(--r);border:1px solid var(--border)}
.tbl{width:100%;border-collapse:collapse;font-size:13px}
.tbl th{text-align:left;padding:10px 14px;font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;background:var(--bg);border-bottom:1px solid var(--border)}
.tbl td{padding:9px 14px;border-bottom:1px solid var(--border);vertical-align:middle}
.tbl tr:last-child td{border-bottom:none}.tbl tr:hover td{background:var(--bg)}
.tinp{background:var(--bg);border:1.5px solid var(--border);border-radius:6px;padding:6px 9px;color:var(--navy);font-size:12px;font-family:inherit;outline:none;width:100%}
.tinp:focus{border-color:var(--teal);background:#fff}
.tsel{background:var(--bg);border:1.5px solid var(--border);border-radius:6px;padding:6px 8px;color:var(--navy);font-size:12px;font-family:inherit;outline:none;width:100%}
.addbtn{display:inline-flex;align-items:center;gap:6px;padding:8px 15px;background:var(--bg);border:1.5px dashed var(--border2);color:var(--text2);border-radius:8px;cursor:pointer;font-size:12px;font-family:inherit;font-weight:600;margin-top:12px;transition:.14s}
.addbtn:hover{border-color:var(--teal);color:var(--teal);background:var(--tealBg)}
.delbtn{background:var(--redBg);border:1px solid rgba(185,28,28,.15);color:var(--red);border-radius:5px;padding:4px 8px;cursor:pointer;font-size:12px;font-family:inherit}
.delbtn:hover{background:#fcc}
.totbox{margin-top:18px;border-top:2px solid var(--border);padding-top:14px;max-width:360px;margin-left:auto}
.tr2{display:flex;justify-content:space-between;padding:5px 0;font-size:13px}
.trl{color:var(--text3)}.trv{font-weight:700}
.tr2.fin{border-top:2px solid var(--navy);margin-top:8px;padding-top:10px;font-size:15px;font-weight:800;color:var(--navy)}
.bgrid{display:grid;grid-template-columns:1fr 320px;gap:16px;align-items:start}
.overlay{position:fixed;inset:0;background:rgba(11,25,41,.6);z-index:999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(5px)}
.modal{background:var(--white);border-radius:16px;padding:30px 32px;min-width:360px;max-width:95vw;box-shadow:var(--sh2);position:relative;max-height:90vh;overflow-y:auto}
.mclose{position:absolute;top:16px;right:16px;width:28px;height:28px;border-radius:6px;background:var(--bg);border:1px solid var(--border);cursor:pointer;font-size:13px;color:var(--text2);display:flex;align-items:center;justify-content:center}
.mclose:hover{background:var(--redBg);color:var(--red)}
.mico{font-size:42px;text-align:center;margin-bottom:12px}
.mtitle{font-size:21px;color:var(--navy);text-align:center;margin-bottom:6px;font-weight:800}
.msub{font-size:13px;color:var(--text2);text-align:center;line-height:1.65;margin-bottom:20px}
.mcl{background:var(--bg);border-radius:var(--r);padding:16px;margin-bottom:20px;display:flex;flex-direction:column;gap:8px}
.mclr{display:flex;align-items:center;gap:10px;font-size:13px}
.mrow{display:flex;gap:10px;justify-content:center}
.cbtn{padding:10px 22px;border-radius:8px;font-size:13px;font-weight:600;background:var(--bg);border:1.5px solid var(--border);color:var(--text2);cursor:pointer;font-family:inherit}
.cbtn:hover{border-color:var(--navy);color:var(--navy)}
.twrp{position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none}
.tst{background:var(--white);border:1px solid var(--border);border-radius:10px;padding:12px 16px;font-size:13px;font-weight:600;box-shadow:var(--sh2);display:flex;align-items:center;gap:9px;animation:tsl .22s ease;color:var(--navy)}
.tst.s{border-left:3px solid var(--teal)}.tst.e{border-left:3px solid var(--red)}
@keyframes tsl{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.empty{text-align:center;padding:60px 20px;color:var(--text3)}
.empty-ico{font-size:44px;margin-bottom:12px}
.qtag{display:inline-flex;align-items:center;gap:5px;padding:4px 11px;border-radius:20px;font-size:11px;font-weight:600;cursor:pointer;border:1.5px solid var(--border);background:var(--bg);color:var(--text2);font-family:inherit;transition:all .13s;white-space:nowrap}
.qtag:hover{border-color:var(--teal);background:var(--tealBg);color:var(--teal)}
.qtag.filled{border-color:#86efac;background:#f0fdf4;color:#15803d}
@media(max-width:860px){
  .sidebar{display:none}.main{padding:16px}
  .srow{grid-template-columns:repeat(2,1fr)}
  .bgrid{grid-template-columns:1fr}
  .clcon{display:none}
}
`;

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function BillingDashboard({ currentUser, onLogout, db, locId }) {
  const resolvedBranchKey = locId||(String(currentUser?.branch||"").toUpperCase()==="RYM"?"raya":"laxmi");
  const [patients, setPatients]     = useState([]);
  const [view, setView]             = useState("tasks");
  const [sel, setSel]               = useState(null);
  const [activeTab, setActiveTab]   = useState("discharge");
  const [showConfirm, setShowConfirm] = useState(false);
  const [toasts, setToasts]         = useState([]);
  const [repFilter, setRepFilter]   = useState("All");

  const [eDis, setEDis]       = useState({});
  const [eMed, setEMed]       = useState({});
  const [eSvc, setESvc]       = useState([]);
  const [eLabRep, setELabRep] = useState([]);
  const [eMedBill, setEMedBill] = useState([]);
  const [eBilling, setEBilling] = useState({});
  const [eSaved, setESaved]   = useState({});

  // ── FIX: Robust db → patients normalization ─────────────────────────────────
  // db can be:
  //   { laxmi: [...], raya: [...] }   — branch-keyed object (expected)
  //   [...]                           — flat array passed directly
  //   { patients: [...] }             — wrapped in a patients key
  //   a single patient object         — accidentally unwrapped
  useEffect(() => {
    let rawRecords = [];

    if (!db) {
      rawRecords = [];
    } else if (Array.isArray(db)) {
      // db is already a flat array — use it directly
      rawRecords = db;
    } else if (typeof db === "object") {
      // Try branch key first
      const branchData = db[resolvedBranchKey];
      if (Array.isArray(branchData)) {
        rawRecords = branchData;
      } else if (Array.isArray(db.patients)) {
        // Fallback: db.patients
        rawRecords = db.patients;
      } else if (Array.isArray(db.data)) {
        // Fallback: db.data
        rawRecords = db.data;
      } else {
        // Last resort: if db itself looks like a single patient record, wrap it
        if (db.uhid || db.patientName || db.admNo) {
          rawRecords = [db];
        } else {
          // Try all values that are arrays
          const arrayValues = Object.values(db).filter(v => Array.isArray(v));
          if (arrayValues.length > 0) {
            // Merge all branch arrays together
            rawRecords = arrayValues.flat();
          }
        }
      }
    }

    const mapped = mapLivePatients(rawRecords, resolvedBranchKey);
    setPatients(mapped);
    setView("tasks");
    setSel(null);
  }, [db, resolvedBranchKey]);

  const toast = (msg, type = "s") => {
    const id = _tid++;
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  };

  const openPatient = p => {
    setSel(p);
    setEDis({ ...p.discharge });
    setEMed({ ...p.medicalHistory });
    setESvc(JSON.parse(JSON.stringify(p.services)));
    setELabRep(JSON.parse(JSON.stringify(p.labReports)));
    setEMedBill(JSON.parse(JSON.stringify(p.medicalBill)));
    setEBilling({ tpaInfo:{}, tpaDocStatus:{}, ...p.billing });
    setESaved({ ...p.saved });
    setRepFilter("All");
    setActiveTab("discharge");
    setView("patient");
  };

  const syncSelectedPatient = (overrides = {}) => {
    const nS  = overrides.saved        || eSaved;
    const nD  = overrides.discharge    || eDis;
    const nM  = overrides.medicalHistory || eMed;
    const nSv = overrides.services     || eSvc;
    const nR  = overrides.labReports   || eLabRep;
    const nMb = overrides.medicalBill  || eMedBill;
    const nB  = overrides.billing      || eBilling;
    const nTs = overrides.taskStatus   || sel?.taskStatus;
    setPatients(prev => prev.map(p =>
      p.uhid === sel.uhid && p.admNo === sel.admNo
        ? { ...p, taskStatus:nTs, saved:{...nS}, discharge:{...nD}, medicalHistory:{...nM}, services:[...nSv], labReports:JSON.parse(JSON.stringify(nR)), medicalBill:[...nMb], billing:{...nB} }
        : p
    ));
    setSel(prev => prev ? ({ ...prev, taskStatus:nTs, saved:{...nS}, discharge:{...nD}, medicalHistory:{...nM}, services:[...nSv], labReports:JSON.parse(JSON.stringify(nR)), medicalBill:[...nMb], billing:{...nB} }) : prev);
  };

  const saveSection = async (sectionKey, label = sectionKey) => {
    if (!sel) return;
    try {
      if (activeTab === "discharge")
        await apiService.dischargePatient(sel.uhid, sel.admNo, buildDischargePayload(eDis));
      else if (activeTab === "medical")
        await apiService.updateMedicalHistory(sel.uhid, sel.admNo, eMed);
      else if (activeTab === "finalbill") {
        const serviceRows = eSvc.filter(r => r.name);
        await apiService.saveServicesBulk(sel.uhid, sel.admNo, serviceRows.map(s => buildServicePayload({ ...s, pricing_type: eBilling?.insuranceType && eBilling.insuranceType !== "Self Pay" ? "CASHLESS" : "CASH" }, s.category || "GENERAL SERVICES")));
        await apiService.updateBilling(sel.uhid, sel.admNo, eBilling);
      } else if (activeTab === "reports") {
        await apiService.saveLabReportsBulk(sel.uhid, sel.admNo, eLabRep.filter(r => r.reportName).map(buildLabReportPayload));
      } else if (activeTab === "med_bill") {
        await apiService.savePharmacyRecordsBulk(sel.uhid, sel.admNo, eMedBill.filter(i => i.item).map(buildPharmacyPayload));
      }
      const nextSaved = { ...eSaved, [sectionKey]: true };
      setESaved(nextSaved);
      syncSelectedPatient({ saved: nextSaved });
      toast(`${label} saved ✓`);
    } catch (error) {
      toast(`Failed to save ${label}`, "e");
    }
  };

  const submitTask = async () => {
    if (!sel) return;
    try {
      await apiService.requestPrint(sel.uhid, sel.admNo);
      setPatients(prev => prev.map(p =>
        p.uhid === sel.uhid && p.admNo === sel.admNo
          ? { ...p, taskStatus:"submitted", billing:{...p.billing, printStatus:"PENDING"} }
          : p
      ));
      setSel(prev => prev ? ({ ...prev, taskStatus:"submitted", billing:{...prev.billing, printStatus:"PENDING"} }) : prev);
      setShowConfirm(false);
      toast("Submitted to Admin print queue ✓");
    } catch (error) {
      toast("Failed to submit billing task", "e");
    }
  };

  const updSvc  = (i, k, v) => setESvc(prev => { const n = [...prev]; n[i] = { ...n[i], [k]: v }; if (k === "qty" || k === "rate") n[i].amount = Number(n[i].qty || 0) * Number(n[i].rate || 0); return n; });
  const updRep  = (ri, k, v) => setELabRep(p => { const n = JSON.parse(JSON.stringify(p)); n[ri][k] = v; return n; });
  const updTest = (ri, ti, k, v) => setELabRep(p => { const n = JSON.parse(JSON.stringify(p)); n[ri].tests[ti][k] = v; return n; });
  const addTest = ri => setELabRep(p => { const n = JSON.parse(JSON.stringify(p)); n[ri].tests.push({ id: Date.now(), name:"", value:"", unit:"", refRange:"", status:"Normal" }); return n; });
  const delTest = (ri, ti) => setELabRep(p => { const n = JSON.parse(JSON.stringify(p)); n[ri].tests.splice(ti, 1); return n; });

  const addMedFromPicker = (medName) => {
    setEMedBill(p => [...p, { id: Date.now(), item: medName, date: new Date().toISOString().slice(0,10), amount: 0 }]);
    toast(`Added: ${medName.slice(0,40)}${medName.length > 40 ? "…" : ""}`);
  };

  const patientName = sel?.patientName || "";
  const pathReps    = eLabRep.filter(r => !isRadiologyType(r.reportType));
  const radReps     = eLabRep.filter(r =>  isRadiologyType(r.reportType));
  const pathTotal   = pathReps.reduce((a, r) => a + Number(r.amount || 0), 0);
  const radTotal    = radReps.reduce((a, r) => a + Number(r.amount || 0), 0);

  const repFilterOptions = ["All", "🧪 Pathology", "🩻 Radiology", ...Array.from(new Set(eLabRep.map(r => r.reportType)))];
  const visibleReps = eLabRep.filter(r => {
    if (repFilter === "All") return true;
    if (repFilter === "🧪 Pathology") return !isRadiologyType(r.reportType);
    if (repFilter === "🩻 Radiology") return  isRadiologyType(r.reportType);
    return r.reportType === repFilter;
  });

  const totals     = sel ? calcTotals(eSvc, eLabRep, eMedBill, eBilling) : null;
  const pending    = patients.filter(p => p.taskStatus === "pending").length;
  const completed  = patients.filter(p => p.taskStatus === "completed").length;
  const allSaved   = eSaved && SECTION_KEYS.every(k => eSaved[k]);
  const savedCount = eSaved ? SECTION_KEYS.filter(k => eSaved[k]).length : 0;

  const quickFillTags = sel ? [
    { label:"UHID",         field:"uhid",            value: sel.uhid,                                        icon:"🔑" },
    { label:"Patient Name", field:"patientName",      value: sel.patientName,                                 icon:"👤" },
    { label:"IPD / Adm No", field:"billNo",           value: sel.admNo,                                       icon:"🏥" },
    { label:"Contact No",   field:"contactNo",        value: sel.phone,                                       icon:"📞" },
    { label:"Doctor",       field:"consultantName",   value: sel.doctor || eMed?.treatingDoctor || "",        icon:"👨‍⚕️" },
    { label:"Ward / Room",  field:"wardRoom",         value: `${sel.ward || ""}${sel.bed ? ` / ${sel.bed}` : ""}`, icon:"🛏" },
    { label:"DOA",          field:"doaDisplay",       value: fmtDt(sel.doa),                                  icon:"📅" },
    { label:"DOD",          field:"dodDisplay",       value: sel.dod ? fmtDt(sel.dod) : "",                   icon:"📅" },
    { label:"Diagnosis",    field:"diagnosisDisplay", value: sel.diagnosis || eDis?.diagnosis || "",           icon:"🩺" },
    { label:"Panel",        field:"panel",            value: eBilling?.insuranceType || "CASH",               icon:"💳" },
    { label:"Age/Sex",      field:"ageSex",           value: `${sel.age} Yrs / ${sel.gender || ""}`,          icon:"🧬" },
    { label:"Address",      field:"addressDisplay",   value: sel.address || "",                               icon:"📍" },
  ] : [];

  const applyQuickFill = (field, value) => {
    if (!value) return;
    setEBilling(p => ({ ...p, [field]: value }));
    toast(`Filled: ${field.replace(/([A-Z])/g, " $1").trim()}`);
  };

  const TABS = [
    { id:"discharge", sKey:"discharge", lbl:"Discharge Summary", ico:"📋" },
    { id:"medical",   sKey:"admission", lbl:"Admission Note",    ico:"🩺" },
    { id:"reports",   sKey:"reports",   lbl:"Reports",           ico:"🗂️" },
    { id:"med_bill",  sKey:"medicines", lbl:"Medicine Bill",     ico:"💊" },
    { id:"finalbill", sKey:"billing",   lbl:"Final Bill",        ico:"🧾" },
  ];

  return (
    <>
      <style>{CSS}</style>
      <div className="app">

        {/* TOPBAR */}
        <header className="topbar">
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div className="logo">Sh</div>
            <div>
              <div className="brand-name">Sangi Hospital</div>
              <div className="brand-sub">Billing Department</div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <ThemeModeDock variant="inline"/>
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              <div className="user-av">{currentUser?.name?.[0] || "B"}</div>
              <div>
                <div className="user-nm">{currentUser?.name || "Billing Staff"}</div>
                <div className="user-id">{currentUser?.emp_id || "EMP-001"} · Billing User</div>
              </div>
            </div>
            <button className="so-btn" onClick={onLogout}>Sign Out</button>
          </div>
        </header>

        <div className="layout">
          {/* SIDEBAR */}
          <aside className="sidebar">
            <div className="slbl">Workspace</div>
            <div className="si act">
              <span>📋</span> My Tasks
              {pending > 0 && <span className="sbdg">{pending}</span>}
            </div>
            <div className="shr"/>
            <div className="slbl">Overview</div>
            <div className="smr"><span className="smrl">Total Assigned</span><strong style={{ color:"var(--navy)" }}>{patients.length}</strong></div>
            <div className="smr"><span className="smrl">Pending</span><strong style={{ color:"var(--amber)" }}>{pending}</strong></div>
            <div className="smr"><span className="smrl">Completed</span><strong style={{ color:"var(--teal)" }}>{completed}</strong></div>
          </aside>

          <main className="main">

            {/* ── TASK LIST ── */}
            {view === "tasks" && (
              <>
                <div className="pgh">
                  <div>
                    <div className="pgt">My Tasks</div>
                    <div className="pgs">Patients assigned to you across all branches</div>
                  </div>
                  <div className="dchip">{new Date().toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"long", year:"numeric" })}</div>
                </div>
                <div className="srow">
                  <div className="sc c1"><div className="scv">{patients.length}</div><div className="scl">Total Assigned</div></div>
                  <div className="sc c2"><div className="scv">{pending}</div><div className="scl">Pending Tasks</div></div>
                  <div className="sc c3"><div className="scv">{completed}</div><div className="scl">Completed</div></div>
                </div>
                {patients.length === 0
                  ? <div className="empty"><div className="empty-ico">🎉</div><div>All tasks done!</div></div>
                  : <div className="tgrid">
                    {patients.map(p => {
                      const done = SECTION_KEYS.filter(k => p.saved?.[k]).length;
                      return (
                        <div key={`${p.uhid}-${p.admNo}`} className="tc">
                          <div className="tctp">
                            <div style={{ flex:1, minWidth:0 }}>
                              <div className="tcnm">{p.patientName}</div>
                              <div className="tcid">{p.uhid} · {p.admNo}</div>
                            </div>
                            <span className={"badge " + (p.taskStatus === "completed" ? "bt" : "ba")}>
                              {p.taskStatus === "completed" ? "Done" : "Pending"}
                            </span>
                          </div>
                          <div className="tcrs">
                            <div className="tcrw"><span className="tcri">🏥</span><strong style={{ color:"var(--navy)", fontSize:11 }}>{p.branch}</strong></div>
                            <div className="tcrw"><span className="tcri">👨‍⚕️</span>{p.doctor || "—"}</div>
                            <div className="tcrw"><span className="tcri">🩺</span>{p.diagnosis || "—"}</div>
                            <div className="tcrw"><span className="tcri">📞</span>{p.phone || "—"}</div>
                          </div>
                          <div className="tc-dod">
                            <div className="tc-dod-item"><div className="tc-dod-lbl">Admitted</div><div className="tc-dod-val">{fmtDtShort(p.doa)}</div></div>
                            <div className="tc-dod-item"><div className="tc-dod-lbl">Exp. Discharge</div><div className="tc-dod-val exp">{p.expectedDod ? fmtDtShort(p.expectedDod) : "--"}</div></div>
                            <div className="tc-dod-item"><div className="tc-dod-lbl">Discharged</div><div className="tc-dod-val dis">{p.dod ? fmtDtShort(p.dod) : "Active"}</div></div>
                          </div>
                          <div className="tcch">
                            <span className={"badge " + (p.status === "admitted" ? "bg" : "bb")}>{p.status === "admitted" ? "Admitted" : "Discharged"}</span>
                            <span className="chip">{p.ward} · {p.bed}</span>
                            <span className="chip">{p.age}y {p.gender?.[0]}</span>
                          </div>
                          {p.taskStatus !== "completed" && (
                            <div className="tcpb">
                              <div className="tcplbl">Sections saved: {done}/5</div>
                              <div className="tcpbar"><div className="tcpfil" style={{ width: ((done / 5) * 100) + "%" }}/></div>
                            </div>
                          )}
                          <div className="tcft">
                            <div className="tcdoa">DOA: {fmtDt(p.doa)}</div>
                            <button className="hod-btn" onClick={() => openPatient(p)}>Open</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                }
              </>
            )}

            {/* ── PATIENT DETAIL ── */}
            {view === "patient" && sel && (
              <>
                <button className="back-btn" onClick={() => { setView("tasks"); setSel(null); }}>← Back to My Tasks</button>

                {/* Patient header */}
                <div className="dhdr">
                  <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, flexWrap:"wrap", marginBottom:8 }}>
                    <div>
                      <div className="dname">{sel.patientName}</div>
                      <div className="dmeta">UHID: <strong>{sel.uhid}</strong> &nbsp;·&nbsp; Adm: <strong>{sel.admNo}</strong> &nbsp;·&nbsp; {sel.age} yrs · {sel.gender} &nbsp;·&nbsp; {sel.phone}</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:10 }}>
                    <span className="badge bb">🏥 {sel.branch}</span>
                    <span className={"badge " + (sel.status === "admitted" ? "bg" : "bt")}>{sel.status === "admitted" ? "Admitted" : "Discharged"}</span>
                    <span className="badge bb">🛏 {sel.ward} · {sel.bed}</span>
                    <span className="badge bb">👨‍⚕️ {sel.doctor}</span>
                    <span className={"badge " + (sel.taskStatus === "completed" ? "bt" : "ba")}>{sel.taskStatus === "completed" ? "Submitted to HOD" : "Task Pending"}</span>
                  </div>
                  <div className="dod-strip">
                    <div className="dod-strip-item"><div className="dod-strip-lbl">Date of Admission</div><div className="dod-strip-val">{fmtDt(sel.doa)}</div></div>
                    <div className="dod-strip-item"><div className="dod-strip-lbl">Expected Discharge</div><div className="dod-strip-val exp">{eDis.expectedDod ? fmtDt(eDis.expectedDod) : "Not set"}</div></div>
                    <div className="dod-strip-item"><div className="dod-strip-lbl">Actual Discharge</div><div className="dod-strip-val dis">{sel.dod ? fmtDt(sel.dod) : "Not yet discharged"}</div></div>
                    <div className="dod-strip-item"><div className="dod-strip-lbl">Primary Diagnosis</div><div className="dod-strip-val dia">{sel.diagnosis}</div></div>
                  </div>
                </div>

                {/* Checklist */}
                <div className="clpanel">
                  <div className="cltitle">Task Checklist — save all 5 sections then submit to HOD</div>
                  <div className="clsteps">
                    {SECTION_KEYS.map((k, idx) => (
                      <div key={k} style={{ display:"flex", alignItems:"center", flex:1, minWidth:0 }}>
                        <div className={"clstep" + (eSaved[k] ? " done" : activeTab === TAB_MAP[k] ? " cur" : "")} style={{ flex:1, minWidth:0 }} onClick={() => setActiveTab(TAB_MAP[k])}>
                          <div className="clchk">{eSaved[k] ? "✓" : SECTION_ICONS[k]}</div>
                          <div className="cllbl">{SECTION_LABELS[k]}</div>
                        </div>
                        {idx < SECTION_KEYS.length - 1 && <div className={"clcon" + (eSaved[k] ? " done" : "")}/>}
                      </div>
                    ))}
                  </div>
                  <div className="clfoot">
                    {sel.taskStatus === "completed"
                      ? <div className="clmsg-ok">✔ Submitted to HOD & Admin Management</div>
                      : allSaved
                        ? <div className="clmsg-ok">✔ All sections saved — ready to submit!</div>
                        : <div className="clmsg-pend"><span className="clmsg-cnt">{5 - savedCount} section{5 - savedCount !== 1 ? "s" : ""} remaining</span>{" "}— save all to unlock Submit</div>
                    }
                    {sel.taskStatus !== "completed"
                      ? <button className="hod-btn" disabled={!allSaved} onClick={() => setShowConfirm(true)}>Submit to HOD →</button>
                      : <div className="done-bdg">✔ Submitted</div>
                    }
                  </div>
                </div>

                {/* Tabs */}
                <div className="twrap">
                  <div className="tabs">
                    {TABS.map(t => (
                      <button key={t.id} className={"tabbtn" + (activeTab === t.id ? " act" : "")} onClick={() => setActiveTab(t.id)}>
                        {t.ico} {t.lbl} {eSaved[t.sKey] && <span className="tdot"/>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── DISCHARGE SUMMARY ── */}
                {activeTab === "discharge" && (
                  <>
                    <div className="secc">
                      <div className="sech"><div className="sect">📋 Discharge Summary</div></div>
                      <div className="secb">
                        <div className="fgrid">
                          <div className="fg"><label className="flbl">Date of Admission</label><input className="finp" type="datetime-local" value={eDis?.doa || ""} onChange={e => setEDis(p => ({ ...p, doa: e.target.value }))}/></div>
                          <div className="fg"><label className="flbl">Expected Discharge Date</label><input className="finp" type="date" value={eDis?.expectedDod ? String(eDis.expectedDod).slice(0,10) : ""} onChange={e => setEDis(p => ({ ...p, expectedDod: e.target.value }))}/></div>
                          <div className="fg"><label className="flbl">Actual Discharge Date</label><input className="finp" type="datetime-local" value={eDis?.dod || ""} onChange={e => setEDis(p => ({ ...p, dod: e.target.value }))}/></div>
                          {[{ k:"ward", lbl:"Ward" }, { k:"bed", lbl:"Bed No." }, { k:"doctor", lbl:"Treating Doctor" }, { k:"diagnosis", lbl:"Primary Diagnosis" }, { k:"condition", lbl:"Condition at Discharge" }].map(f => (
                            <div key={f.k} className="fg"><label className="flbl">{f.lbl}</label><input className="finp" value={eDis?.[f.k] || ""} onChange={e => setEDis(p => ({ ...p, [f.k]: e.target.value }))}/></div>
                          ))}
                          <div className="fg full"><label className="flbl">Discharge Instructions</label><textarea className="ftxt" value={eDis?.instructions || ""} onChange={e => setEDis(p => ({ ...p, instructions: e.target.value }))}/></div>
                          <div className="fg full"><label className="flbl">Additional Notes</label><textarea className="ftxt" value={eDis?.notes || ""} onChange={e => setEDis(p => ({ ...p, notes: e.target.value }))}/></div>
                        </div>
                      </div>
                    </div>
                    <button className="savebtn" onClick={() => saveSection("discharge", "Discharge Summary")}>Save Discharge Summary</button>
                  </>
                )}

                {/* ── ADMISSION NOTE ── */}
                {activeTab === "medical" && (
                  <>
                    <AdmissionNoteForm eMed={eMed} setEMed={setEMed}/>
                    <button className="savebtn" onClick={() => saveSection("admission", "Admission Note")}>Save Admission Note</button>
                  </>
                )}

                {/* ── REPORTS ── */}
                {activeTab === "reports" && (
                  <>
                    <div className="secc">
                      <div className="sech">
                        <div className="sect">
                          🗂️ Reports
                          {patientName && (
                            <span style={{ fontSize:12, fontWeight:600, color:"var(--text3)", background:"var(--bg)", border:"1px solid var(--border)", borderRadius:20, padding:"2px 10px", marginLeft:6 }}>
                              👤 {patientName}
                            </span>
                          )}
                        </div>
                        <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                          <span style={{ background:"#eff6ff", border:"1px solid #bfdbfe", color:"#1d4ed8", borderRadius:20, padding:"3px 11px", fontSize:11, fontWeight:700 }}>
                            🧪 Path: {fmt(pathTotal)} ({pathReps.length})
                          </span>
                          <span style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", color:"#15803d", borderRadius:20, padding:"3px 11px", fontSize:11, fontWeight:700 }}>
                            🩻 Rad: {fmt(radTotal)} ({radReps.length})
                          </span>
                          <span style={{ background:"var(--tealBg,#e6faf8)", border:"1px solid rgba(13,124,114,.2)", color:"var(--teal)", borderRadius:20, padding:"3px 11px", fontSize:11, fontWeight:700 }}>
                            Grand: {fmt(pathTotal + radTotal)}
                          </span>
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:8, flexWrap:"wrap", padding:"12px 20px", borderBottom:"1px solid var(--border)" }}>
                        {repFilterOptions.map(t => (
                          <button key={t} onClick={() => setRepFilter(t)}
                            style={{ padding:"5px 13px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:".13s", border:repFilter === t ? "1.5px solid var(--navy,#0f172a)" : "1.5px solid var(--border,#e2e8f0)", background:repFilter === t ? "var(--navy,#0f172a)" : "var(--white,#fff)", color:repFilter === t ? "#fff" : "var(--text2,#475569)" }}>
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    {visibleReps.length === 0 && (
                      <div className="empty" style={{ padding:"30px 20px" }}><div>No reports yet. Use the buttons below to add.</div></div>
                    )}
                    {visibleReps.map(rep => {
                      const ri = eLabRep.findIndex(r => r.id === rep.id);
                      if (isRadiologyType(rep.reportType)) {
                        return (<RadiologyReportCard key={rep.id} rep={rep} ri={ri} patientName={patientName} updRep={updRep} onRemove={() => setELabRep(p => p.filter(r => r.id !== rep.id))}/>);
                      }
                      return (<PathologyReportCard key={rep.id} rep={rep} ri={ri} patientName={patientName} updRep={updRep} updTest={updTest} addTest={addTest} delTest={delTest} onRemove={() => setELabRep(p => p.filter(r => r.id !== rep.id))}/>);
                    })}
                    <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap", marginBottom:16, marginTop:4 }}>
                      <button onClick={() => setELabRep(p => [...p, emptyPathReport()])}
                        style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"10px 20px", background:"linear-gradient(135deg,#1e3a5f,#0f172a)", color:"#fff", border:"none", borderRadius:9, cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"inherit", boxShadow:"0 3px 10px rgba(15,23,42,.2)" }}>
                        🧪 + Add Pathology Report
                      </button>
                      <button onClick={() => setELabRep(p => [...p, emptyRadReport()])}
                        style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"10px 20px", background:"linear-gradient(135deg,#065f46,#064e3b)", color:"#fff", border:"none", borderRadius:9, cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"inherit", boxShadow:"0 3px 10px rgba(6,79,70,.2)" }}>
                        🩻 + Add Radiology Report
                      </button>
                    </div>
                    <button className="savebtn" onClick={() => saveSection("reports", "Reports")}>Save Reports</button>
                  </>
                )}

                {/* ── MEDICINE BILL ── */}
                {activeTab === "med_bill" && (
                  <>
                    <MedicineHistoryPicker eMed={eMed} onAdd={addMedFromPicker}/>
                    <div className="secc">
                      <div className="sech">
                        <div className="sect">💊 Medicine / Pharmacy Bill</div>
                        {eMedBill.length > 0 && (
                          <span style={{ fontSize:12, fontWeight:700, color:"var(--teal)", background:"var(--tealBg)", border:"1px solid rgba(13,124,114,.2)", borderRadius:20, padding:"3px 11px" }}>
                            {eMedBill.length} items · {fmt(eMedBill.reduce((a, r) => a + Number(r.amount || 0), 0))}
                          </span>
                        )}
                      </div>
                      <div className="secb">
                        <div className="tw">
                          <table className="tbl">
                            <thead><tr><th>Item Description</th><th>Date</th><th style={{ width:130 }}>Amount</th><th style={{ width:44 }}></th></tr></thead>
                            <tbody>
                              {eMedBill.map((r, i) => (
                                <tr key={r.id}>
                                  <td><input className="tinp" value={r.item} onChange={e => { const n = [...eMedBill]; n[i] = { ...n[i], item: e.target.value }; setEMedBill(n); }}/></td>
                                  <td><input className="tinp" type="date" value={r.date} onChange={e => { const n = [...eMedBill]; n[i] = { ...n[i], date: e.target.value }; setEMedBill(n); }}/></td>
                                  <td><input className="tinp" type="number" value={r.amount} onChange={e => { const n = [...eMedBill]; n[i] = { ...n[i], amount: Number(e.target.value) }; setEMedBill(n); }}/></td>
                                  <td><button className="delbtn" onClick={() => setEMedBill(p => p.filter((_, j) => j !== i))}>X</button></td>
                                </tr>
                              ))}
                              {eMedBill.length === 0 && (
                                <tr><td colSpan={4} style={{ textAlign:"center", color:"var(--text3)", fontStyle:"italic", padding:"18px" }}>No medicines added yet. Use the picker above or click + Add.</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                        <button className="addbtn" onClick={() => setEMedBill(p => [...p, { id: Date.now(), item:"", date: new Date().toISOString().slice(0,10), amount: 0 }])}>+ Add Medicine Manually</button>
                        <div className="totbox"><div className="tr2 fin"><span>Medicine Total</span><span>{fmt(eMedBill.reduce((a, r) => a + Number(r.amount || 0), 0))}</span></div></div>
                      </div>
                    </div>
                    <button className="savebtn" onClick={() => saveSection("medicines", "Medicine Bill")}>Save Medicine Bill</button>
                  </>
                )}

                {/* ── FINAL BILL ── */}
                {activeTab === "finalbill" && (
                  <>
                    {/* Quick-fill tags */}
                    <div style={{ background:"var(--white)", border:"1.5px solid var(--border)", borderRadius:14, marginBottom:16, overflow:"hidden" }}>
                      <div style={{ background:"linear-gradient(135deg,#1e3a5f,#0f172a)", padding:"12px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
                        <div>
                          <div style={{ fontSize:13, fontWeight:700, color:"#fff" }}>⚡ Quick-Fill from Patient Data</div>
                          <div style={{ fontSize:11, color:"rgba(255,255,255,.55)", marginTop:1 }}>Click any tag to auto-fill that field in the bill below</div>
                        </div>
                        <span style={{ fontSize:11, color:"rgba(255,255,255,.5)", fontFamily:"monospace" }}>{sel.uhid} · {sel.admNo}</span>
                      </div>
                      <div style={{ padding:"12px 16px", display:"flex", flexWrap:"wrap", gap:7, background:"var(--bg)" }}>
                        {quickFillTags.map(tag => (
                          <button key={tag.field}
                            className={"qtag" + (eBilling?.[tag.field] ? " filled" : "")}
                            onClick={() => applyQuickFill(tag.field, tag.value)}
                            title={tag.value || "(not available)"}
                          >
                            <span>{tag.icon}</span>
                            <span style={{ fontWeight:700 }}>{tag.label}:</span>
                            <span style={{ maxWidth:140, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", opacity:.85 }}>
                              {tag.value || <span style={{ fontStyle:"italic", opacity:.5 }}>—</span>}
                            </span>
                            {eBilling?.[tag.field] && <span style={{ fontSize:10, color:"#15803d" }}>✓</span>}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Bill header */}
                    <div className="secc" style={{ marginBottom:16 }}>
                      <div className="sech">
                        <div className="sect">🧾 Bill Header — Patient Information</div>
                        <span style={{ fontSize:11, color:"var(--text3)" }}>Appears on the printed final bill</span>
                      </div>
                      <div className="secb">
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:14 }}>
                          <div className="fg">
                            <label className="flbl" style={{ color:"var(--teal)" }}>🔑 UHID <span style={{ color:"var(--red)" }}>*</span></label>
                            <input className="finp" value={eBilling?.uhid || ""} onChange={e => setEBilling(p => ({ ...p, uhid: e.target.value }))} placeholder={sel.uhid} style={{ borderColor:"var(--teal)", fontWeight:700, fontFamily:"monospace" }}/>
                          </div>
                          <div className="fg"><label className="flbl">IPD / Bill No.</label><input className="finp" value={eBilling?.billNo || ""} onChange={e => setEBilling(p => ({ ...p, billNo: e.target.value }))} placeholder={sel.admNo}/></div>
                          <div className="fg"><label className="flbl">Patient Name</label><input className="finp" value={eBilling?.patientName || ""} onChange={e => setEBilling(p => ({ ...p, patientName: e.target.value }))} placeholder={sel.patientName}/></div>
                          <div className="fg"><label className="flbl">Guardian / Attendant Name</label><input className="finp" value={eBilling?.guardianName || ""} onChange={e => setEBilling(p => ({ ...p, guardianName: e.target.value }))} placeholder="e.g. Ramesh Kumar"/></div>
                          <div className="fg"><label className="flbl">Age / Sex</label><input className="finp" value={eBilling?.ageSex || ""} onChange={e => setEBilling(p => ({ ...p, ageSex: e.target.value }))} placeholder={`${sel.age} Yrs / ${sel.gender || ""}`}/></div>
                          <div className="fg"><label className="flbl">Contact No.</label><input className="finp" value={eBilling?.contactNo || ""} onChange={e => setEBilling(p => ({ ...p, contactNo: e.target.value }))} placeholder={sel.phone}/></div>
                          <div className="fg"><label className="flbl">Card No.</label><input className="finp" value={eBilling?.cardNo || ""} onChange={e => setEBilling(p => ({ ...p, cardNo: e.target.value }))} placeholder="e.g. 1234"/></div>
                          <div className="fg"><label className="flbl">Claim ID</label><input className="finp" value={eBilling?.claimId || ""} onChange={e => setEBilling(p => ({ ...p, claimId: e.target.value }))} placeholder="e.g. 42092669"/></div>
                          <div className="fg"><label className="flbl">Panel</label><input className="finp" value={eBilling?.panel || ""} onChange={e => setEBilling(p => ({ ...p, panel: e.target.value }))} placeholder="CASH / TPA / ECHS"/></div>
                          <div className="fg"><label className="flbl">Consultant / Doctor</label><input className="finp" value={eBilling?.consultantName || ""} onChange={e => setEBilling(p => ({ ...p, consultantName: e.target.value }))} placeholder={sel.doctor || eMed?.treatingDoctor || ""}/></div>
                          <div className="fg"><label className="flbl">Ward / Room</label><input className="finp" value={eBilling?.wardRoom || ""} onChange={e => setEBilling(p => ({ ...p, wardRoom: e.target.value }))} placeholder={`${sel.ward || ""}${sel.bed ? ` / ${sel.bed}` : ""}`}/></div>
                          <div className="fg"><label className="flbl">Status on Discharge</label><input className="finp" value={eBilling?.statusOnDischarge || ""} onChange={e => setEBilling(p => ({ ...p, statusOnDischarge: e.target.value }))} placeholder="e.g. LAMA, Stable, Referred"/></div>
                          <div className="fg" style={{ gridColumn:"1/-1" }}><label className="flbl">Address</label><input className="finp" value={eBilling?.addressDisplay || ""} onChange={e => setEBilling(p => ({ ...p, addressDisplay: e.target.value }))} placeholder={sel.address || "Patient address"}/></div>
                        </div>
                      </div>
                    </div>

                    {/* Services & Payment */}
                    <div className="bgrid">
                      <div>
                        <div className="secc">
                          <div className="sech"><div className="sect">🧾 Services & Charges</div></div>
                          <div className="secb">
                            <div className="tw">
                              <table className="tbl">
                                <thead><tr><th>Service</th><th>Category</th><th style={{ width:60 }}>Qty</th><th style={{ width:90 }}>Rate</th><th style={{ width:100 }}>Amount</th><th style={{ width:44 }}></th></tr></thead>
                                <tbody>
                                  {eSvc.map((r, i) => (
                                    <tr key={r.id}>
                                      <td><input className="tinp" value={r.name} onChange={e => updSvc(i, "name", e.target.value)}/></td>
                                      <td><input className="tinp" value={r.category} onChange={e => updSvc(i, "category", e.target.value)}/></td>
                                      <td><input className="tinp" type="number" value={r.qty} onChange={e => updSvc(i, "qty", e.target.value)}/></td>
                                      <td><input className="tinp" type="number" value={r.rate} onChange={e => updSvc(i, "rate", e.target.value)}/></td>
                                      <td style={{ fontWeight:700 }}>{fmt(r.amount)}</td>
                                      <td><button className="delbtn" onClick={() => setESvc(p => p.filter((_, j) => j !== i))}>X</button></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <button className="addbtn" onClick={() => setESvc(p => [...p, { id: Date.now(), name:"", category:"", qty:1, rate:0, amount:0 }])}>+ Add Service</button>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="secc">
                          <div className="sech"><div className="sect">💳 Payment Details</div></div>
                          <div className="secb">
                            <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
                              {[{ k:"discount", lbl:"Discount (Rs.)" }, { k:"advance", lbl:"Advance Paid (Rs.)" }, { k:"paidNow", lbl:"Paid Now (Rs.)" }].map(f => (
                                <div key={f.k} className="fg"><label className="flbl">{f.lbl}</label><input className="finp" type="number" value={eBilling?.[f.k] || 0} onChange={e => setEBilling(p => ({ ...p, [f.k]: e.target.value }))}/></div>
                              ))}
                              <div className="fg"><label className="flbl">Payment Mode</label>
                                <select className="fsel" value={eBilling?.paymentMode || "Cash"} onChange={e => setEBilling(p => ({ ...p, paymentMode: e.target.value }))}>
                                  {["Cash", "UPI", "Card", "Insurance", "NEFT", "Cheque"].map(m => <option key={m}>{m}</option>)}
                                </select>
                              </div>
                              <div className="fg"><label className="flbl">Insurance Type</label>
                                <select className="fsel" value={eBilling?.insuranceType || "Self Pay"} onChange={e => setEBilling(p => ({ ...p, insuranceType: e.target.value }))}>
                                  {INSURANCE_TYPES.map(t => <option key={t}>{t}</option>)}
                                </select>
                              </div>
                              {eBilling?.insuranceType && eBilling.insuranceType !== "Self Pay" && (
                                <>
                                  {[{ k:"tpaName", lbl:"TPA / Panel Name" }, { k:"policyNo", lbl:"Policy / Card Number" }, { k:"claimNo", lbl:"Claim Number" }, { k:"authNo", lbl:"Authorization Number" }].map(f => (
                                    <div key={f.k} className="fg"><label className="flbl">{f.lbl}</label><input className="finp" value={eBilling?.tpaInfo?.[f.k] || ""} onChange={e => setEBilling(p => ({ ...p, tpaInfo: { ...(p.tpaInfo || {}), [f.k]: e.target.value } }))}/></div>
                                  ))}
                                  <div className="fg">
                                    <label className="flbl">TPA Documents</label>
                                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:8 }}>
                                      {TPA_DOCS.map(doc => (
                                        <label key={doc.key} style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:"var(--text2)", background:"var(--bg)", border:"1px solid var(--border)", borderRadius:8, padding:"8px 10px" }}>
                                          <input type="checkbox" checked={Boolean(eBilling?.tpaDocStatus?.[doc.key])} onChange={ev => setEBilling(p => ({ ...p, tpaDocStatus: { ...(p.tpaDocStatus || {}), [doc.key]: ev.target.checked } }))}/>
                                          <span>{doc.label}</span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                </>
                              )}
                              <div className="fg"><label className="flbl">Remarks</label><input className="finp" value={eBilling?.remarks || ""} onChange={e => setEBilling(p => ({ ...p, remarks: e.target.value }))}/></div>
                            </div>
                            {totals && (
                              <div className="totbox">
                                <div className="tr2"><span className="trl">Services</span><span className="trv">{fmt(totals.s)}</span></div>
                                <div className="tr2"><span className="trl">🧪 Pathology Reports</span><span className="trv">{fmt(pathTotal)}</span></div>
                                <div className="tr2"><span className="trl">🩻 Radiology Reports</span><span className="trv">{fmt(radTotal)}</span></div>
                                <div className="tr2"><span className="trl">Medicines</span><span className="trv">{fmt(totals.m)}</span></div>
                                <div className="tr2"><span className="trl">Gross Total</span><span className="trv">{fmt(totals.gross)}</span></div>
                                <div className="tr2" style={{ color:"var(--red)" }}><span className="trl">Discount</span><span className="trv">- {fmt(totals.disc)}</span></div>
                                <div className="tr2"><span className="trl">Net Payable</span><span className="trv">{fmt(totals.net)}</span></div>
                                <div className="tr2" style={{ color:"var(--teal)" }}><span className="trl">Advance Paid</span><span className="trv">- {fmt(totals.adv)}</span></div>
                                <div className="tr2" style={{ color:"var(--teal)" }}><span className="trl">Paid Now</span><span className="trv">- {fmt(totals.paid)}</span></div>
                                <div className="tr2 fin"><span>Balance Due</span><span>{fmt(totals.due)}</span></div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <button className="savebtn" onClick={() => saveSection("billing", "Final Bill")}>Save Final Bill</button>
                  </>
                )}
              </>
            )}
          </main>
        </div>

        {/* CONFIRM MODAL */}
        {showConfirm && (
          <div className="overlay" onClick={() => setShowConfirm(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <button className="mclose" onClick={() => setShowConfirm(false)}>X</button>
              <div className="mico">📤</div>
              <div className="mtitle">Submit to HOD and Admin?</div>
              <div className="msub">Submitting complete billing file for <strong>{sel?.patientName}</strong> ({sel?.uhid}) to the Head of Department.</div>
              <div className="mcl">
                {SECTION_KEYS.map(k => (
                  <div key={k} className="mclr">
                    <span>{eSaved[k] ? "✅" : "⚠️"}</span>
                    <span style={{ color: eSaved[k] ? "var(--teal)" : "var(--amber)", fontWeight:600 }}>{SECTION_ICONS[k]} {SECTION_LABELS[k]} — {eSaved[k] ? "Saved" : "Not saved"}</span>
                  </div>
                ))}
              </div>
              <div className="mrow">
                <button className="cbtn" onClick={() => setShowConfirm(false)}>Cancel</button>
                <button className="hod-btn" onClick={submitTask}>Confirm and Submit</button>
              </div>
            </div>
          </div>
        )}

        {/* TOASTS */}
        <div className="twrp">
          {toasts.map(t => (
            <div key={t.id} className={"tst " + t.type}>{t.type === "s" ? "✓" : "✗"} {t.msg}</div>
          ))}
        </div>
      </div>
    </>
  );
}