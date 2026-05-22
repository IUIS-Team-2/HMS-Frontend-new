import { SANGI_MEDICINE_MASTER } from "../data/medicineMaster";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { apiService } from "../services/apiService";
import { T } from "../data/constants";
import { Ico, IC } from "../components/ui/Icons";
import { EXAMINATION_FIELDS, getFieldUnit } from "../data/examinationFields";

// ─── REPORT TEMPLATES ─────────────────────────────────────────────────────────
const REPORT_TEMPLATES = {
  "CBC": { key:"CBC", label:"Complete Blood Count", dept:"HAEMATOLOGY", color:"#dc2626", bg:"#fef2f2", sections:[{ heading:"COMPLETE BLOOD COUNT", fields:[{ name:"Haemoglobin", unit:"gm/dl", normal:"12–16" },{ name:"TLC (Total Leucocyte Count)", unit:"/cumm", normal:"4000–11000" }]},{ heading:"DIFFERENTIAL LEUCOCYTE COUNT (DLC)", fields:[{ name:"Polymorphs", unit:"%", normal:"40–75" },{ name:"Lymphocyte", unit:"%", normal:"20–40" },{ name:"Eosinophil", unit:"%", normal:"01–06" },{ name:"Monocyte", unit:"%", normal:"00–08" },{ name:"Basophil", unit:"%", normal:"00–00" }]},{ heading:"INDICES", fields:[{ name:"PCV", unit:"%", normal:"34–45" },{ name:"MCV (Mean Corp Volume)", unit:"Fl/dl", normal:"76–96" },{ name:"MCH (Mean Corp Hb)", unit:"Pg/dl", normal:"27–32" },{ name:"MCHC (Mean Corp Hb Conc)", unit:"gm/dl", normal:"31–38" },{ name:"RBC (Red Blood Cell Count)", unit:"mill/cumm", normal:"3.5–5.5" },{ name:"Platelet Count", unit:"Lacs/cumm", normal:"1.5–4.5" },{ name:"ESR (Wintrobe)", unit:"mm", normal:"M: 0–10, F: 0–20" }]}] },
  "COAGULATION": { key:"COAGULATION", label:"Coagulation Profile", dept:"HAEMATOLOGY", color:"#dc2626", bg:"#fef2f2", sections:[{ heading:"PROTHROMBIN TIME", fields:[{ name:"Patient Time (PT)", unit:"Sec", normal:"10.0–14.0" },{ name:"Control Time (PT)", unit:"Sec", normal:"" },{ name:"INR", unit:"", normal:"" }]},{ heading:"APTT", fields:[{ name:"Patient Time (APTT)", unit:"Sec", normal:"26.0–40.0" },{ name:"Control Time (APTT)", unit:"Sec", normal:"" },{ name:"Ratio (APTT)", unit:"", normal:"" }]},{ heading:"OTHER", fields:[{ name:"BT (Bleeding Time)", unit:"Min/Sec", normal:"02–07" },{ name:"CT (Clotting Time)", unit:"Min/Sec", normal:"04–09" },{ name:"D-Dimer", unit:"µgFEU/mL", normal:"<0.5" }]}] },
  "BLOODGROUP": { key:"BLOODGROUP", label:"Blood Group & Rh Factor", dept:"HAEMATOLOGY", color:"#dc2626", bg:"#fef2f2", sections:[{ heading:"BLOOD GROUP", fields:[{ name:"Blood Group", unit:"", normal:"" },{ name:"Rh Factor", unit:"", normal:"" }]}] },
  "PERIPHERAL_SMEAR": { key:"PERIPHERAL_SMEAR", label:"Blood Picture (Peripheral Smear)", dept:"HAEMATOLOGY", color:"#dc2626", bg:"#fef2f2", type:"narrative", fields:[{ label:"Findings", multiline:true, rows:4 },{ label:"Impression", multiline:true, rows:2 },{ label:"Advice", multiline:false }] },
  "KFT": { key:"KFT", label:"Kidney Function Test", dept:"BIOCHEMISTRY", color:"#2563eb", bg:"#eff6ff", sections:[{ heading:"KIDNEY FUNCTION TEST", fields:[{ name:"Blood Urea", unit:"mg/dl", normal:"13–45" },{ name:"Serum Creatinine", unit:"mg/dl", normal:"0.7–1.4" },{ name:"S.Uric Acid", unit:"mg/dl", normal:"3.2–7.2" },{ name:"Sodium", unit:"mmol/L", normal:"135–145" },{ name:"Potassium", unit:"mmol/L", normal:"3.6–5.0" },{ name:"Calcium", unit:"mg/dl", normal:"8.2–10.5" }]}] },
  "LFT": { key:"LFT", label:"Liver Function Test", dept:"BIOCHEMISTRY", color:"#2563eb", bg:"#eff6ff", sections:[{ heading:"LIVER FUNCTION TEST", fields:[{ name:"Serum Bilirubin (Total)", unit:"mg/dl", normal:"0.2–1.3" },{ name:"Conjugated (D Bilirubin)", unit:"mg/dl", normal:"0.0–0.3" },{ name:"Unconjugated (I.D Bilirubin)", unit:"mg/dl", normal:"0.2–1.1" },{ name:"SGOT/AST", unit:"U/L", normal:"00–55" },{ name:"SGPT/ALT", unit:"U/L", normal:"00–40" },{ name:"Total Protein", unit:"gm/dl", normal:"6.3–8.2" },{ name:"Albumin", unit:"gm/dl", normal:"3.5–5.0" },{ name:"Globuline", unit:"gm/dl", normal:"2.5–5.6" },{ name:"Alkaline Phosphatase", unit:"IU/L", normal:"20–130" }]}] },
  "LIPID": { key:"LIPID", label:"Lipid Profile", dept:"BIOCHEMISTRY", color:"#2563eb", bg:"#eff6ff", sections:[{ heading:"LIPID PROFILE", fields:[{ name:"Cholesterol Total", unit:"mg/dl", normal:"125–200" },{ name:"Triglyceride", unit:"mg/dl", normal:"25–200" },{ name:"Cholesterol HDL", unit:"mg/dl", normal:"35–80" },{ name:"Cholesterol VLDL", unit:"mg/dl", normal:"5–40" },{ name:"Cholesterol LDL", unit:"mg/dl", normal:"85–130" },{ name:"LDL/HDL Ratio", unit:"", normal:"1.5–3.5" }]}] },
  "BLOODGAS": { key:"BLOODGAS", label:"Blood Gas Analysis", dept:"BIOCHEMISTRY", color:"#2563eb", bg:"#eff6ff", sections:[{ heading:"BLOOD GAS ANALYSIS", fields:[{ name:"pH", unit:"", normal:"7.35–7.45" },{ name:"pCO2", unit:"mmHg", normal:"35–40" },{ name:"pO2", unit:"mmHg", normal:"80–95" },{ name:"TCO2", unit:"mmol/L", normal:"23–27" },{ name:"HCO3", unit:"mmol/L", normal:"22–26" },{ name:"BE", unit:"mmol/L", normal:"-2 to +2" },{ name:"%SO2C", unit:"%", normal:"96–97" }]}] },
  "GLUCOSE": { key:"GLUCOSE", label:"Blood Glucose", dept:"BIOCHEMISTRY", color:"#2563eb", bg:"#eff6ff", sections:[{ heading:"BLOOD GLUCOSE", fields:[{ name:"Blood Glucose Random (RBS)", unit:"mg/dl", normal:"100–150" },{ name:"Blood Glucose Fasting (FBS)", unit:"mg/dl", normal:"70–110" },{ name:"Blood Glucose PP", unit:"mg/dl", normal:"<140" },{ name:"HbA1c (Glycosylated Haemoglobin)", unit:"%", normal:"4.30–6.40" }]}] },
  "CARDIAC": { key:"CARDIAC", label:"Cardiac Markers", dept:"BIOCHEMISTRY", color:"#2563eb", bg:"#eff6ff", sections:[{ heading:"CARDIAC MARKERS", fields:[{ name:"Troponin-T", unit:"", normal:"NEGATIVE" },{ name:"Troponin-I", unit:"", normal:"NEGATIVE" },{ name:"CPK-MB", unit:"IU/L", normal:"upto 24" },{ name:"CPK", unit:"U/L", normal:"22–198" },{ name:"NT-proBNP", unit:"pg/ml", normal:"10–157" }]}] },
  "CRP": { key:"CRP", label:"CRP / Procalcitonin", dept:"BIOCHEMISTRY", color:"#2563eb", bg:"#eff6ff", sections:[{ heading:"INFLAMMATORY MARKERS", fields:[{ name:"CRP (Qualitative)", unit:"", normal:"NON-REACTIVE" },{ name:"CRP (Quantitative)", unit:"mg/L", normal:"<6.0" },{ name:"Serum Procalcitonin", unit:"pg/ml", normal:"0.0–500" }]}] },
  "PANCREATIC": { key:"PANCREATIC", label:"Pancreatic Enzymes", dept:"BIOCHEMISTRY", color:"#2563eb", bg:"#eff6ff", sections:[{ heading:"PANCREATIC ENZYMES", fields:[{ name:"S. Amylase", unit:"U/L", normal:"30.0–220.0" },{ name:"S. Lipase", unit:"U/L", normal:"upto 190.0" }]}] },
  "VITAMINS": { key:"VITAMINS", label:"Vitamins", dept:"BIOCHEMISTRY", color:"#2563eb", bg:"#eff6ff", sections:[{ heading:"VITAMINS", fields:[{ name:"Vitamin B-12 (Cyanocobalamin)", unit:"pg/ml", normal:"211–911" },{ name:"25 OH Vitamin D3", unit:"ng/ml", normal:"30–100" }]}] },
  "IRON": { key:"IRON", label:"Iron Profile", dept:"BIOCHEMISTRY", color:"#2563eb", bg:"#eff6ff", sections:[{ heading:"IRON PROFILE", fields:[{ name:"Iron (Serum)", unit:"µg/dL", normal:"49–181" },{ name:"TIBC", unit:"µg/dL", normal:"261–462" },{ name:"Transferrin Saturation", unit:"%", normal:"14–50" }]}] },
  "THYROID": { key:"THYROID", label:"Total Thyroid Profile", dept:"ENDOCRINOLOGY", color:"#7c3aed", bg:"#f5f3ff", sections:[{ heading:"TOTAL THYROID PROFILE", fields:[{ name:"T3 (Free)", unit:"pmol/i", normal:"0.9–2.5" },{ name:"FT4 (Free Thyroxine)", unit:"pmol/i", normal:"60–135" },{ name:"TSH (Thyroid Stimulating Hormone)", unit:"pmol/i", normal:"0.25–5.0" }]}] },
  "WIDAL": { key:"WIDAL", label:"Widal Test (Slide Method)", dept:"IMMUNOLOGY – SEROLOGY", color:"#b45309", bg:"#fffbeb", type:"widal", antigens:["TO","TH","AH","BH"], dilutions:["1:20","1:40","1:80","1:160","1:320"] },
  "TYPHIDOT": { key:"TYPHIDOT", label:"Typhi Dot (IgG & IgM)", dept:"IMMUNOLOGY – SEROLOGY", color:"#b45309", bg:"#fffbeb", sections:[{ heading:"TYPHI DOT", fields:[{ name:"Thypidot Test for S.Typhi IgM", unit:"", normal:"" },{ name:"Thypidot Test for S.Typhi IgG", unit:"", normal:"" }]}] },
  "DENGUE": { key:"DENGUE", label:"Dengue Panel", dept:"IMMUNOLOGY – SEROLOGY", color:"#b45309", bg:"#fffbeb", sections:[{ heading:"DENGUE IgM & IgG", fields:[{ name:"Dengue IgM Antibodies", unit:"", normal:"NON-REACTIVE" },{ name:"Dengue IgG Antibodies", unit:"", normal:"NON-REACTIVE" },{ name:"Dengue NS1 Antigen", unit:"", normal:"NON-REACTIVE" }]}] },
  "MALARIA": { key:"MALARIA", label:"Malaria Antigen Test", dept:"MICROBIOLOGY", color:"#065f46", bg:"#ecfdf5", sections:[{ heading:"MALARIA ANTIGEN TEST", fields:[{ name:"Plasmodium P.Vivax", unit:"", normal:"NEGATIVE" },{ name:"Plasmodium Falciparum", unit:"", normal:"NEGATIVE" }]}] },
  "VIRAL": { key:"VIRAL", label:"Viral Markers", dept:"MICROBIOLOGY", color:"#065f46", bg:"#ecfdf5", sections:[{ heading:"VIRAL MARKERS", fields:[{ name:"HIV I & II", unit:"", normal:"NEGATIVE" },{ name:'Hepatitis "B" (HBsAg)', unit:"", normal:"NEGATIVE" },{ name:"HCV", unit:"", normal:"NEGATIVE" },{ name:"COVID-19 (Ag)", unit:"", normal:"NON-REACTIVE" }]}] },
  "URINE_RM": { key:"URINE_RM", label:"Urine Examination (R/M)", dept:"MICROBIOLOGY", color:"#065f46", bg:"#ecfdf5", type:"urine" },
  "URINE_CS": { key:"URINE_CS", label:"Urine C/S (Culture & Sensitivity)", dept:"MICROBIOLOGY", color:"#065f46", bg:"#ecfdf5", type:"culture", specimen:"URINE C/S" },
  "BLOOD_CS": { key:"BLOOD_CS", label:"Blood C/S (Culture & Sensitivity)", dept:"MICROBIOLOGY", color:"#065f46", bg:"#ecfdf5", type:"culture", specimen:"BLOOD C/S" },
  "STOOL": { key:"STOOL", label:"Stool Examination (R/M)", dept:"MICROBIOLOGY", color:"#065f46", bg:"#ecfdf5", type:"stool" },
  "BODY_FLUID": { key:"BODY_FLUID", label:"Body Fluid Analysis", dept:"MICROBIOLOGY", color:"#065f46", bg:"#ecfdf5", type:"body_fluid" },
};

const INVESTIGATION_GROUPS = [
  { group:"🩸 Haematology", color:"#dc2626", items:["CBC","COAGULATION","BLOODGROUP","PERIPHERAL_SMEAR","D_DIMER","BT_CT"] },
  { group:"🧪 Biochemistry", color:"#2563eb", items:["KFT","LFT","LIPID","BLOODGAS","GLUCOSE","CARDIAC","CRP","PANCREATIC","VITAMINS","IRON","SAAG","HOMOCYSTEINE","PSA","HBA1C","URINE_KETONE"] },
  { group:"⚗️ Endocrinology", color:"#7c3aed", items:["THYROID","ANTI_TPO"] },
  { group:"🔬 Immunology – Serology", color:"#b45309", items:["WIDAL","TYPHIDOT","DENGUE","COVID_AG"] },
  { group:"🦠 Microbiology", color:"#065f46", items:["MALARIA","VIRAL","URINE_RM","URINE_GRAM","URINE_CS","BLOOD_CS","SPUTUM_AFB","SPUTUM_GRAM","STOOL","BODY_FLUID","BODY_FLUID_CYTOLOGY","ADA","PROCALCITONIN"] },
  { group:"🧬 Coagulation", color:"#be123c", items:["PT","APTT"] },
];

const MEDICATION_GROUPS = [
  { group:"💉 IV / Injections", items:["Inj. Normal Saline (NS) 500ml", "Inj. Ringer Lactate (RL) 500ml", "Inj. DNS 500ml", "Inj. Pantoprazole 40mg IV BD", "Inj. Esomeprazole 40mg IV BD", "Inj. Ondansetron 4mg IV TDS", "Inj. Tramadol 50mg IV TDS", "Inj. Diclofenac 75mg IM BD", "Inj. Ceftriaxone 1g IV BD", "Inj. Amikacin 500mg IV OD", "Inj. Metronidazole 500mg IV TDS", "Inj. Furosemide 40mg IV OD", "Inj. Dexamethasone 8mg IV OD", "Inj. Hydrocortisone 100mg IV TDS", "Inj. Heparin 5000 IU SC BD", "Inj. Enoxaparin 40mg SC OD", "Inj. Insulin Regular SC TDS", "Inj. Atropine 0.6mg IV", "Inj. Adrenaline 1mg IV"] },
  { group:"💊 Oral Tablets / Capsules", items:["Tab. Paracetamol 500mg TDS", "Tab. Paracetamol 650mg TDS", "Tab. Ibuprofen 400mg TDS", "Tab. Diclofenac 50mg BD", "Tab. Pantoprazole 40mg OD", "Tab. Rabeprazole 20mg OD", "Tab. Ondansetron 4mg TDS", "Tab. Metformin 500mg BD", "Tab. Metformin 1000mg BD", "Tab. Amlodipine 5mg OD", "Tab. Amlodipine 10mg OD", "Tab. Atenolol 50mg OD", "Tab. Ramipril 5mg OD", "Tab. Losartan 50mg OD", "Tab. Telmisartan 40mg OD", "Tab. Atorvastatin 20mg HS", "Tab. Atorvastatin 40mg HS", "Tab. Clopidogrel 75mg OD", "Tab. Aspirin 75mg OD", "Tab. Aspirin 150mg OD", "Tab. Azithromycin 500mg OD", "Tab. Amoxicillin 500mg TDS", "Tab. Ciprofloxacin 500mg BD", "Tab. Metronidazole 400mg TDS", "Tab. Doxycycline 100mg BD", "Tab. Prednisolone 10mg OD", "Tab. Prednisolone 40mg OD", "Tab. Levothyroxine 50mcg OD", "Tab. Folic Acid 5mg OD", "Tab. Ferrous Sulphate 200mg BD", "Cap. Amoxicillin + Clavulanate 625mg BD", "Cap. Omeprazole 20mg BD"] },
  { group:"🩹 Topical / Local", items:["Syrup Paracetamol 125mg/5ml", "Syrup Amoxicillin 125mg/5ml", "Nebulisation Salbutamol 2.5mg", "Nebulisation Ipratropium 0.5mg", "Inhalation Budesonide 200mcg BD"] },
  { group:"🔧 Supportive / Others", items:["O2 Inhalation 2–4 L/min", "Ryle's Tube Feed", "IV Fluids NS/RL @ 100ml/hr", "IV Fluids DNS @ 80ml/hr", "Urinary Catheterisation", "Dressing BD", "Steam Inhalation BD", "Physiotherapy", "ICU Monitoring", "Vital Monitoring 4th Hourly"] },
];

// ─── XSS FIX: HTML escape helper ─────────────────────────────────────────────
// All user-supplied values MUST be passed through this before being
// interpolated into a document.write / innerHTML string.
function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
// Convenience: escape + toUpperCase (used for names/gender throughout)
function escHtmlUpper(value) {
  return escapeHtml(String(value == null ? "" : value).toUpperCase());
}

// ─── Reusable Searchable Multi-Select Dropdown ────────────────────────────────
function SearchMultiDropdown({ value, onChange, groups, placeholder, chipColor = "#0369a1", chipBg = "#e0f2fe", chipBorder = "#7dd3fc", allowCustom = false, singleSelect = false }) {
  const [open, setOpen]       = useState(false);
  const [search, setSearch]   = useState("");
  const [panelStyle, setPanelStyle] = useState({});
  const ref                   = useRef(null);
  const triggerRef            = useRef(null);
  const panelRef              = useRef(null);

  const selected = value ? value.split(", ").filter(Boolean) : [];

  const calcPosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const desiredHeight = 380;
    const gutter = 8;
    const spaceBelow = window.innerHeight - rect.bottom - gutter;
    const spaceAbove = rect.top - gutter;
    const openUpward = spaceBelow < 260 && spaceAbove > spaceBelow;
    const maxHeight = Math.max(220, Math.min(desiredHeight, openUpward ? spaceAbove : spaceBelow));

    setPanelStyle({
      position:"fixed",
      left:rect.left,
      width:rect.width,
      minWidth:Math.max(rect.width, 320),
      ...(openUpward
        ? { bottom:window.innerHeight - rect.top + 6, top:"auto" }
        : { top:rect.bottom + 6, bottom:"auto" }),
      background:T.white,
      border:`1.5px solid ${T.border}`,
      borderRadius:12,
      boxShadow:"0 12px 40px rgba(11,37,69,.16)",
      zIndex:9999,
      maxHeight,
      display:"flex",
      flexDirection:"column",
      overflow:"hidden",
    });
  };

  useEffect(() => {
    const handler = e => {
      const insideTrigger = triggerRef.current && triggerRef.current.contains(e.target);
      const insidePanel = panelRef.current && panelRef.current.contains(e.target);
      if (!insideTrigger && !insidePanel && ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    calcPosition();
    window.addEventListener("scroll", calcPosition, true);
    window.addEventListener("resize", calcPosition);
    return () => {
      window.removeEventListener("scroll", calcPosition, true);
      window.removeEventListener("resize", calcPosition);
    };
  }, [open]);

  const toggle = item => {
    if (singleSelect) {
      onChange(item === selected[0] ? "" : item);
      setOpen(false);
      setSearch("");
      return;
    }
    const set = new Set(selected);
    set.has(item) ? set.delete(item) : set.add(item);
    onChange([...set].join(", "));
  };

  const remove = item => {
    const set = new Set(selected);
    set.delete(item);
    onChange([...set].join(", "));
  };

  const addCustom = () => {
    const trimmed = search.trim();
    if (!trimmed) return;
    if (singleSelect) { onChange(trimmed); setOpen(false); setSearch(""); return; }
    if (!selected.includes(trimmed)) onChange([...selected, trimmed].join(", "));
    setSearch("");
  };

  const sl = search.toLowerCase();
  const filteredGroups = groups.map(g => ({
    ...g,
    items: g.items.filter(i => i.toLowerCase().includes(sl)),
  })).filter(g => g.items.length > 0);

  const exactMatch = groups.flatMap(g => g.items).some(i => i.toLowerCase() === sl);

  return (
    <div ref={ref} style={{ position:"relative", width:"100%" }}>
      <div
        ref={triggerRef}
        onClick={() => setOpen(o => !o)}
        style={{ fontFamily:"DM Sans,sans-serif", fontSize:14, color: selected.length ? T.text : T.textLight, background:T.white, border:`1.5px solid ${open ? T.accentDeep : T.border}`, borderRadius:10, padding:"11px 14px", width:"100%", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between", boxSizing:"border-box", minHeight:46, transition:"border-color .15s" }}
      >
        <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:8 }}>
          {selected.length > 0
            ? singleSelect ? selected[0] : `${selected.length} selected`
            : placeholder}
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink:0, transform: open?"rotate(180deg)":"none", transition:"transform .2s", color:T.textLight }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {!singleSelect && selected.length > 0 && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:7 }}>
          {selected.map(item => (
            <span key={item} style={{ display:"inline-flex", alignItems:"center", gap:5, background:chipBg, border:`1px solid ${chipBorder}`, borderRadius:20, padding:"3px 10px", fontSize:12, color:chipColor, maxWidth:280 }}>
              <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item}</span>
              <span onMouseDown={e=>{e.preventDefault();remove(item);}} style={{ cursor:"pointer", fontSize:13, color:chipColor, fontWeight:700, lineHeight:1, flexShrink:0 }}>×</span>
            </span>
          ))}
          <span onMouseDown={e=>{e.preventDefault();onChange("");}} style={{ cursor:"pointer", fontSize:12, color:"#ef4444", alignSelf:"center", marginLeft:4 }}>Clear all</span>
        </div>
      )}

      {open && (
        <div ref={panelRef} style={panelStyle}>
          <div style={{ padding:"10px 12px", borderBottom:`1px solid ${T.border}`, background:T.offwhite }}>
            <div style={{ position:"relative" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:T.textMuted }}>
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input
                autoFocus
                placeholder={`Search...`}
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && allowCustom && !exactMatch && addCustom()}
                style={{ width:"100%", fontFamily:"DM Sans,sans-serif", fontSize:13, border:`1.5px solid ${T.border}`, borderRadius:8, padding:"8px 10px 8px 32px", outline:"none", boxSizing:"border-box", color:T.text, background:T.white }}
              />
            </div>
          </div>

          <div style={{ overflowY:"auto", flex:1 }}>
            {filteredGroups.length === 0 && !allowCustom && (
              <div style={{ padding:"20px", textAlign:"center", fontSize:13, color:T.textMuted }}>No results found</div>
            )}
            {filteredGroups.map(({ group, color, items }) => (
              <div key={group}>
                <div style={{ padding:"8px 14px 5px", fontSize:10, fontWeight:700, color: color || T.textMuted, textTransform:"uppercase", letterSpacing:".07em", background:T.offwhite, borderBottom:`1px solid ${T.border}` }}>
                  {group}
                </div>
                {items.map(item => {
                  const isSel = selected.includes(item);
                  return (
                    <div
                      key={item}
                      onMouseDown={e => { e.preventDefault(); toggle(item); }}
                      style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 14px", cursor:"pointer", background: isSel ? (chipBg || "#e0f2fe") : "transparent", borderBottom:`1px solid ${T.border}20`, transition:"background .1s" }}
                    >
                      {!singleSelect && (
                        <div style={{ width:16, height:16, borderRadius:4, border:`2px solid ${isSel ? (chipColor||"#0369a1") : T.border}`, background: isSel ? (chipColor||"#0369a1") : "transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all .1s" }}>
                          {isSel && <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                      )}
                      {singleSelect && (
                        <div style={{ width:16, height:16, borderRadius:"50%", border:`2px solid ${isSel ? (chipColor||"#0369a1") : T.border}`, background: isSel ? (chipColor||"#0369a1") : "transparent", flexShrink:0, transition:"all .1s" }} />
                      )}
                      <span style={{ fontSize:13, color: isSel ? (chipColor||"#0369a1") : T.text, fontWeight: isSel ? 600 : 400 }}>{item}</span>
                    </div>
                  );
                })}
              </div>
            ))}

            {allowCustom && search.trim() && !exactMatch && (
              <div
                onMouseDown={e => { e.preventDefault(); addCustom(); }}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", cursor:"pointer", background:"#f0fdf4", borderTop:`1px solid #bbf7d0` }}
              >
                <span style={{ fontSize:18, color:"#059669" }}>+</span>
                <span style={{ fontSize:13, color:"#059669", fontWeight:600 }}>Add "{search.trim()}"</span>
              </div>
            )}
          </div>

          {!singleSelect && (
            <div style={{ padding:"8px 14px", borderTop:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", background:T.offwhite }}>
              <span style={{ fontSize:12, color:T.textMuted }}>{selected.length} selected</span>
              <button onMouseDown={e=>{e.preventDefault();setOpen(false);}} style={{ padding:"5px 16px", borderRadius:8, border:"none", background:T.accentDeep, color:"#fff", fontFamily:"DM Sans,sans-serif", fontSize:13, fontWeight:600, cursor:"pointer" }}>Done</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InvestigationsDropdown({ value, onChange }) {
  const groups = INVESTIGATION_GROUPS.map(g => ({
    group: g.group,
    color: g.color,
    items: g.items.map(key => REPORT_TEMPLATES[key]?.label || key),
  }));

  return (
    <SearchMultiDropdown
      value={value}
      onChange={onChange}
      groups={groups}
      placeholder="Select investigations / reports..."
      chipColor="#0369a1"
      chipBg="#e0f2fe"
      chipBorder="#7dd3fc"
      allowCustom={false}
    />
  );
}

function Field({ label, req, children }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <label style={{ fontSize:11, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:".06em" }}>
        {label}{req&&<span style={{ color:T.red }}> *</span>}
      </label>
      {children}
    </div>
  );
}

function InpWithUnit({ fieldName, label, req, placeholder, value, onChange, type="text" }) {
  const unit = getFieldUnit(fieldName);
  const fieldConfig = EXAMINATION_FIELDS[fieldName];
  const normalValue = fieldConfig?.normal || '';

  return (
    <Field label={label} req={req}>
      <div style={{ position: 'relative' }}>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          style={{
            fontFamily: "DM Sans,sans-serif",
            fontSize: 14,
            color: T.text,
            background: T.white,
            border: `1.5px solid ${T.border}`,
            borderRadius: 10,
            padding: "11px 14px",
            width: "100%",
            outline: "none",
            boxSizing: "border-box",
            paddingRight: unit ? '60px' : '14px',
          }}
        />
        {unit && (
          <span style={{
            position: 'absolute',
            right: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '12px',
            color: T.textMuted,
            fontWeight: 600,
            pointerEvents: 'none',
            background: T.white,
            padding: '0 4px',
          }}>
            {unit}
          </span>
        )}
      </div>
      {normalValue && (
        <div style={{ fontSize: '11px', color: T.textMuted, marginTop: '4px' }}>
          Normal: {normalValue}
        </div>
      )}
    </Field>
  );
}

function Txta({ label, req, placeholder, value, onChange, rows=3 }) {
  return (
    <Field label={label} req={req}>
      <textarea placeholder={placeholder} value={value} onChange={onChange} rows={rows}
        style={{ fontFamily:"DM Sans,sans-serif", fontSize:14, color:T.text, background:T.white, border:`1.5px solid ${T.border}`, borderRadius:10, padding:"11px 14px", width:"100%", outline:"none", resize:"vertical", boxSizing:"border-box" }} />
    </Field>
  );
}

function Section({ title, subtitle, icon, children }) {
  return (
    <div style={{ background:T.white, border:`1px solid ${T.border}`, borderRadius:16, marginBottom:20, overflow:"hidden", boxShadow:"0 1px 4px rgba(11,37,69,.07)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:13, padding:"17px 22px", borderBottom:`1px solid ${T.border}`, background:T.offwhite }}>
        <div style={{ width:36, height:36, borderRadius:10, background:T.bgTint, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", color:T.accentDeep }}>
          <Ico d={icon} size={16} sw={1.75}/>
        </div>
        <div>
          <p style={{ fontFamily:"DM Serif Display,serif", fontSize:15, color:T.primary, margin:0 }}>{title}</p>
          <p style={{ fontSize:12, color:T.textMuted, margin:"2px 0 0" }}>{subtitle}</p>
        </div>
      </div>
      <div style={{ padding:24 }}>{children}</div>
    </div>
  );
}

// ─── Print helpers ────────────────────────────────────────────────────────────
export function AdmissionNotePrint({ data, patient, discharge, locId }) {
  const branchInfo = { "laxmi":{ name:"Lakshmi Nagar Branch", address:"Lakshmi Nagar, Mathura, Uttar Pradesh - 281004", phone1:"+91-9717444531", phone2:"+91-9717444532", email:"laxminagar@sangihospital.com" }, "raya":{ name:"Raya Branch", address:"Raya, Mathura, Uttar Pradesh - 281204", phone1:"+91-9311212090", phone2:"+91-9311212091", email:"info@sangihospital.com" } };
  const branch = branchInfo[locId]||branchInfo["laxmi"];
  const today   = new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"2-digit",year:"numeric"});
  const nowTime = new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false});
  const investigationsText = [data?.investigations,data?.investigationsCustom].filter(Boolean).join(", ");
  return (
    <div id="admission-note-print" style={{ fontFamily:"Arial,sans-serif", fontSize:12, color:"#000", padding:"24px 32px", background:"#fff", maxWidth:800, margin:"0 auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", borderBottom:"2px solid #000", paddingBottom:10, marginBottom:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}><img src="/logo512.png" alt="Sangi Hospital" style={{ width:64, height:64, objectFit:"contain", borderRadius:12 }}/><div><div style={{ fontSize:28, fontWeight:900, color:"#1a5b8c", letterSpacing:2, lineHeight:1 }}>SANGi</div><div style={{ fontSize:13, fontWeight:700, color:"#d93838", letterSpacing:4 }}>HOSPITAL</div></div></div>
        <div style={{ textAlign:"right", fontSize:11, color:"#444", lineHeight:1.8 }}><div>Add.: {branch.address}</div><div>Ph.: {branch.phone1}, {branch.phone2}</div><div>Email: {branch.email}</div><div>Web.: www.sangihospital.com</div></div>
      </div>
      <div style={{ textAlign:"center", fontSize:16, fontWeight:900, letterSpacing:2, borderBottom:"1px solid #000", paddingBottom:8, marginBottom:10 }}>ADMISSION NOTE</div>
      <div style={{ display:"flex", gap:24, marginBottom:10, flexWrap:"wrap" }}><div><strong>Name of the Patient: </strong><u>{(patient?.patientName||"—").toUpperCase()}</u></div><div><strong>Age/Sex: </strong><u>{patient?.ageYY||"—"}Y / {(patient?.gender||"—").toUpperCase()}</u></div><div><strong>IPD NO: </strong><u>SH/{discharge?.department?.substring(0,4)?.toUpperCase()||"GEN"}/26/001</u></div></div>
      <div style={{ display:"flex", gap:24, marginBottom:14, flexWrap:"wrap" }}><div><strong>Card No: </strong><u>{patient?.tpaCard||patient?.tpaPanelCardNo||"—"}</u></div><div><strong>WARD/Bed NO: </strong><u>{discharge?.wardName||"—"}</u></div><div><strong>Date: </strong><u>{today} AT {nowTime} HR</u></div></div>
      <table style={{ width:"100%", borderCollapse:"collapse", marginBottom:12 }}><tbody>
        <tr><td style={{ border:"1px solid #000", padding:"10px 12px", width:"50%", verticalAlign:"top" }}><div style={{ fontWeight:900, fontSize:12, marginBottom:6 }}>PRESENT COMPLAINTS-</div><div style={{ fontSize:12, whiteSpace:"pre-wrap", minHeight:60 }}>{data?.presentComplaints||"—"}</div>{data?.chiefComplaints&&<><div style={{ fontWeight:700, marginTop:8 }}>C/O-</div><div style={{ whiteSpace:"pre-wrap" }}>{data.chiefComplaints}</div></>}</td><td style={{ border:"1px solid #000", padding:"10px 12px", width:"50%", verticalAlign:"top" }}><div style={{ fontWeight:900, fontSize:12, marginBottom:6 }}>INVESTIGATIONS-</div><div style={{ fontSize:12, whiteSpace:"pre-wrap", minHeight:60 }}>{investigationsText||"—"}</div></td></tr>
        <tr><td style={{ border:"1px solid #000", padding:"10px 12px", verticalAlign:"top" }}><div style={{ fontWeight:900, fontSize:12, marginBottom:6 }}>PAST HISTORY-</div><div style={{ fontSize:12, whiteSpace:"pre-wrap", minHeight:40 }}>{[data?.previousDiagnosis,data?.pastSurgeries].filter(Boolean).join("\n")||"—"}</div></td><td style={{ border:"1px solid #000", padding:"10px 12px", verticalAlign:"top" }}><div style={{ fontWeight:900, fontSize:12, marginBottom:6 }}>TREATMENT ADVISED-</div><div style={{ fontSize:12, whiteSpace:"pre-wrap", minHeight:40 }}>{data?.treatmentAdvised||"—"}</div></td></tr>
        <tr><td style={{ border:"1px solid #000", padding:"10px 12px", verticalAlign:"top" }}><div style={{ fontWeight:900, fontSize:12, marginBottom:8 }}>EXAMINATIONS-</div><div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"4px 12px", fontSize:12 }}>{[["BP",data?.bp],["PR",data?.pr],["SPO2",data?.spo2],["TEMP",data?.temp]].map(([k,v])=><div key={k}><strong>{k}= </strong>{v||"—"}</div>)}</div><div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"4px 12px", fontSize:12, marginTop:6 }}>{[["Chest",data?.chest],["CVS",data?.cvs],["CNS",data?.cns],["P/A",data?.pa]].map(([k,v])=><div key={k}><strong>{k}: </strong>{v||"—"}</div>)}</div></td><td style={{ border:"1px solid #000", padding:"10px 12px", verticalAlign:"top" }}><div style={{ fontWeight:900, fontSize:12, marginBottom:6 }}>PROVISIONAL DIAGNOSIS-</div><div style={{ fontSize:12, whiteSpace:"pre-wrap", minHeight:40 }}>{data?.provisionalDiagnosis||discharge?.diagnosis||"—"}</div></td></tr>
      </tbody></table>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:40, fontSize:12 }}>
        <div style={{ textAlign:"center", minWidth:160 }}><div style={{ borderTop:"1px solid #000", paddingTop:6, fontWeight:700 }}>Adv.</div><div style={{ color:"#555", marginTop:4 }}>{data?.treatingDoctor||discharge?.doctorName||"—"}</div></div>
        <div style={{ textAlign:"center", minWidth:160 }}><div style={{ borderTop:"1px solid #000", paddingTop:6, fontWeight:700 }}>Consultant</div></div>
        <div style={{ textAlign:"center", minWidth:160 }}><div style={{ borderTop:"1px solid #000", paddingTop:6, fontWeight:700 }}>DOCTOR SIGNATURE</div></div>
      </div>
    </div>
  );
}

// ─── FIX (XSS #3): downloadAdmissionNote — all user values escaped ─────────────
// Previously interpolated raw patient fields directly into document.write HTML.
// Every field is now passed through escapeHtml() before insertion.
export function downloadAdmissionNote(data, patient, discharge, locId) {
  const printWindow = window.open("","_blank","width=900,height=700");
  const branchInfo = { "laxmi":{ address:"Lakshmi Nagar, Mathura, Uttar Pradesh - 281004", phone1:"+91-9717444531", phone2:"+91-9717444532", email:"laxminagar@sangihospital.com" }, "raya":{ address:"Raya, Mathura, Uttar Pradesh - 281204", phone1:"+91-9311212090", phone2:"+91-9311212091", email:"info@sangihospital.com" } };
  const branch = branchInfo[locId]||branchInfo["laxmi"];
  const today   = new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"2-digit",year:"numeric"});
  const nowTime = new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false});
  const investigationsText = [data?.investigations,data?.investigationsCustom].filter(Boolean).join(", ");

  // ── Escaped patient/data values ──────────────────────────────────────────
  const eName        = escHtmlUpper(patient?.patientName || "—");
  const eAgeYY       = escapeHtml(patient?.ageYY || "—");
  const eGender      = escHtmlUpper(patient?.gender || "—");
  const eDept        = escapeHtml(discharge?.department?.substring(0,4)?.toUpperCase() || "GEN");
  const eTpaCard     = escapeHtml(patient?.tpaCard || patient?.tpaPanelCardNo || "—");
  const eWardName    = escapeHtml(discharge?.wardName || "—");
  const eComplaints  = escapeHtml(data?.presentComplaints || "—");
  const eChief       = data?.chiefComplaints ? `<strong>C/O-</strong><div class="pre">${escapeHtml(data.chiefComplaints)}</div>` : "";
  const eInvest      = escapeHtml(investigationsText || "—");
  const ePastHist    = escapeHtml([data?.previousDiagnosis,data?.pastSurgeries].filter(Boolean).join("\n") || "—");
  const eTreatment   = escapeHtml(data?.treatmentAdvised || "—");
  const eBP          = escapeHtml(data?.bp || "—");
  const ePR          = escapeHtml(data?.pr || "—");
  const eSPO2        = escapeHtml(data?.spo2 || "—");
  const eTemp        = escapeHtml(data?.temp || "—");
  const eChest       = escapeHtml(data?.chest || "—");
  const eCVS         = escapeHtml(data?.cvs || "—");
  const eCNS         = escapeHtml(data?.cns || "—");
  const ePA          = escapeHtml(data?.pa || "—");
  const eDiagnosis   = escapeHtml(data?.provisionalDiagnosis || discharge?.diagnosis || "—");
  const eDoctor      = escapeHtml(data?.treatingDoctor || discharge?.doctorName || "—");

  printWindow.document.write(`<!DOCTYPE html><html><head><title>Admission Note - ${eName}</title><style>body{font-family:Arial,sans-serif;font-size:12px;color:#000;padding:24px 32px;margin:0}table{width:100%;border-collapse:collapse}td{border:1px solid #000;padding:10px 12px;vertical-align:top;width:50%}.pre{white-space:pre-wrap;min-height:50px}@media print{@page{size:A4;margin:10mm}}</style></head><body><div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:10px"><div style="display:flex;align-items:center;gap:12px"><img src="/logo512.png" style="width:64px;height:64px;object-fit:contain;border-radius:12px"/><div><div style="font-size:28px;font-weight:900;color:#1a5b8c;letter-spacing:2px;line-height:1">SANGi</div><div style="font-size:13px;font-weight:700;color:#d93838;letter-spacing:4px">HOSPITAL</div></div></div><div style="text-align:right;font-size:11px;color:#444;line-height:1.8"><div>Add.: ${escapeHtml(branch.address)}</div><div>Ph.: ${escapeHtml(branch.phone1)}, ${escapeHtml(branch.phone2)}</div><div>Email: ${escapeHtml(branch.email)}</div><div>Web.: www.sangihospital.com</div></div></div><div style="text-align:center;font-size:16px;font-weight:900;letter-spacing:2px;border-bottom:1px solid #000;padding-bottom:8px;margin-bottom:10px">ADMISSION NOTE</div><div style="display:flex;gap:24px;margin-bottom:8px;flex-wrap:wrap"><div><strong>Name of the Patient: </strong><u>${eName}</u></div><div><strong>Age/Sex: </strong><u>${eAgeYY}Y / ${eGender}</u></div><div><strong>IPD NO: </strong><u>SH/${eDept}/26/001</u></div></div><div style="display:flex;gap:24px;margin-bottom:14px;flex-wrap:wrap"><div><strong>Card No: </strong><u>${eTpaCard}</u></div><div><strong>WARD/Bed NO: </strong><u>${eWardName}</u></div><div><strong>Date: </strong><u>${escapeHtml(today)} AT ${escapeHtml(nowTime)} HR</u></div></div><table><tr><td><strong>PRESENT COMPLAINTS-</strong><div class="pre">${eComplaints}</div>${eChief}</td><td><strong>INVESTIGATIONS-</strong><div class="pre">${eInvest}</div></td></tr><tr><td><strong>PAST HISTORY-</strong><div class="pre">${ePastHist}</div></td><td><strong>TREATMENT ADVISED-</strong><div class="pre">${eTreatment}</div></td></tr><tr><td><strong>EXAMINATIONS-</strong><br/><div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;margin-top:6px"><div><strong>BP= </strong>${eBP}</div><div><strong>Chest: </strong>${eChest}</div><div><strong>PR= </strong>${ePR}</div><div><strong>CVS: </strong>${eCVS}</div><div><strong>SPO2= </strong>${eSPO2}</div><div><strong>CNS: </strong>${eCNS}</div><div><strong>TEMP= </strong>${eTemp}</div><div><strong>P/A: </strong>${ePA}</div></div></td><td><strong>PROVISIONAL DIAGNOSIS-</strong><div class="pre">${eDiagnosis}</div></td></tr></table><div style="display:flex;justify-content:space-between;margin-top:50px"><div style="text-align:center;min-width:160px"><div style="border-top:1px solid #000;padding-top:6px;font-weight:700">Adv.</div><div style="color:#555;margin-top:4px">${eDoctor}</div></div><div style="text-align:center;min-width:160px"><div style="border-top:1px solid #000;padding-top:6px;font-weight:700">Consultant</div></div><div style="text-align:center;min-width:160px"><div style="border-top:1px solid #000;padding-top:6px;font-weight:700">DOCTOR SIGNATURE</div></div></div><script>window.onload=()=>{window.print();}<\/script></body></html>`);
  printWindow.document.close();
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MedicalHistoryPage({ data, setData, onSave, onSkip, patient, discharge, locId, doctors = [] }) {
  const doctorDirectory = useMemo(() => {
  const normalized = doctors
    .map((doctor) => {
      const name = String(
        doctor?.name ||
        doctor?.doctor_name ||
        doctor?.doctorName ||
        doctor?.full_name ||
        ""
      ).trim();

      const qualification = String(
        doctor?.qualification ||
        doctor?.degree ||
        doctor?.doctor_qualification ||
        doctor?.qualification_name ||
        ""
      ).trim();

      if (!name) return null;

      return {
        name,
        qualification,
        display: qualification
          ? `${name} (${qualification})`
          : name,
      };
    })
    .filter(Boolean);

  return normalized;
}, [doctors]);

  const doctorOptions = doctorDirectory.map((doctor) => doctor.display);
  const qualificationOptions = Array.from(new Set(doctorDirectory.map((doctor) => doctor.qualification).filter(Boolean)));

  const resolveDoctorQualification = useCallback((doctorValue = "") => {
    const trimmed = String(doctorValue || "").trim();
    if (!trimmed) return "";
    const match = doctorDirectory.find(
      (doctor) => doctor.display === trimmed || doctor.name === trimmed
    );
    return match?.qualification || "";
  }, [doctorDirectory]);

  const set = k => v => setData(p => ({ ...p, [k]: v }));
  const setE = k => e => setData(p => ({ ...p, [k]: e.target.value }));
  const setDoctor = (doctorValue) => {
    const qualification = resolveDoctorQualification(doctorValue);
    setData(prev => ({
      ...prev,
      treatingDoctor: doctorValue,
      doctorQual: qualification || prev.doctorQual || "",
    }));
  };

  useEffect(() => {
    if (!data?.treatingDoctor || data?.doctorQual) return;
    const qualification = resolveDoctorQualification(data.treatingDoctor);
    if (!qualification) return;
    setData(prev => (prev.doctorQual ? prev : { ...prev, doctorQual: qualification }));
  }, [data?.treatingDoctor, data?.doctorQual, setData, resolveDoctorQualification]);
  const isFilled = data.presentComplaints || data.previousDiagnosis || data.provisionalDiagnosis;

  const doctorGroups = [{ group:"👨‍⚕️ Doctors", color:"#0369a1", items: doctorOptions }];
  const qualGroups   = [{ group:"🎓 Qualifications", color:"#7c3aed", items: qualificationOptions }];
  const [medicineMaster, setMedicineMaster] = useState([]);
  useEffect(() => {
    apiService.getMedicineMaster()
      .then(list => setMedicineMaster(Array.isArray(list) ? list : []))
      .catch(() => setMedicineMaster([]));
  }, []);

  const masterItems = medicineMaster.map(m => m.name || m.medicine_name || "").filter(Boolean);
  const medGroups = [
    ...MEDICATION_GROUPS.map(g => ({ group: g.group, color:"#059669", items: g.items })),
    ...(masterItems.length > 0 ? [{
      group: "💊 Medicine Master",
      color: "#059669",
      items: masterItems.filter(name =>
        !MEDICATION_GROUPS.some(g => g.items.some(i => i.toLowerCase() === name.toLowerCase()))
      )
    }] : []),
  ];

  return (
    <div style={{ padding:"32px 44px 80px", animation:"fadeUp .3s ease both", fontFamily:"DM Sans,sans-serif" }}>

      <div style={{ marginBottom:28 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
          <div>
            <h1 style={{ fontFamily:"DM Serif Display,serif", fontSize:26, color:T.primary, marginBottom:5 }}>Medical History</h1>
            <p style={{ fontSize:14, color:T.textMuted }}>Record admission note — complaints, examinations and treatment</p>
          </div>
          <div style={{ padding:"6px 14px", borderRadius:20, background:isFilled?T.greenTint:T.amberTint, border:`1px solid ${isFilled?T.greenBorder:"#FDE68A"}`, fontSize:12, fontWeight:600, color:isFilled?T.green:T.amber }}>
            {isFilled ? "✓ History Added" : "⚠ Not Filled"}
          </div>
        </div>
      </div>

      <Section title="Present Complaints" subtitle="Chief complaints and presenting symptoms" icon={IC.pulse}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
          <Txta label="Present Complaints" req placeholder="Patient presented in Department of Emergency Medicine..." value={data.presentComplaints||""} onChange={setE("presentComplaints")} rows={4}/>
          <Txta label="C/O (Chief Complaints)" placeholder="Severe pain at Rt. Iliac fossa, fever with chills..." value={data.chiefComplaints||""} onChange={setE("chiefComplaints")} rows={4}/>
        </div>
      </Section>

      <Section title="Examinations" subtitle="Vitals and clinical examination findings" icon={IC.pulse}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:16 }}>
          <InpWithUnit fieldName="bp" label="BP (mmHg)"  placeholder="e.g. 120/80mmHg" value={data.bp||""}    onChange={setE("bp")}/>
          <InpWithUnit fieldName="pr" label="PR (/min)"  placeholder="e.g. 82/min"     value={data.pr||""}    onChange={setE("pr")}/>
          <InpWithUnit fieldName="spo2" label="SPO2"       placeholder="e.g. 98% On RA"  value={data.spo2||""}  onChange={setE("spo2")}/>
          <InpWithUnit fieldName="temp" label="TEMP"       placeholder="e.g. 98.6°F"     value={data.temp||""}  onChange={setE("temp")}/>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
          <InpWithUnit fieldName="chest" label="Chest" placeholder="e.g. B/L Crepts+" value={data.chest||""} onChange={setE("chest")}/>
          <InpWithUnit fieldName="cvs" label="CVS"   placeholder="e.g. S1 S2 +"     value={data.cvs||""}  onChange={setE("cvs")}/>
          <InpWithUnit fieldName="cns" label="CNS"   placeholder="e.g. Conscious"   value={data.cns||""}  onChange={setE("cns")}/>
          <InpWithUnit fieldName="pa" label="P/A"   placeholder="e.g. Distended"   value={data.pa||""}   onChange={setE("pa")}/>
        </div>
      </Section>

      <Section title="Investigations & Diagnosis" subtitle="Tests ordered and provisional diagnosis" icon={IC.file}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <Field label="Investigations / Reports">
              <InvestigationsDropdown value={data.investigations||""} onChange={v => set("investigations")(v)} />
            </Field>
            <Txta label="Additional / Custom Tests" placeholder="Any other tests not listed above..." value={data.investigationsCustom||""} onChange={setE("investigationsCustom")} rows={2}/>
          </div>
          <Txta label="Provisional Diagnosis" req placeholder="Acute Retention of Urine with ?UTI..." value={data.provisionalDiagnosis||""} onChange={setE("provisionalDiagnosis")} rows={6}/>
        </div>
      </Section>

      <Section title="Treatment & Past History" subtitle="Treatment advised and past medical history" icon={IC.wallet}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
          <Field label="Current Medications">
            <SearchMultiDropdown
              value={data.currentMedications||""}
              onChange={set("currentMedications")}
              groups={medGroups}
              placeholder="Select medications..."
              chipColor="#047857"
              chipBg="#d1fae5"
              chipBorder="#6ee7b7"
              allowCustom={true}
            />
          </Field>
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <Txta label="Treatment Advised" req placeholder="IV Fluids NS/RL @ 100ml/hr, Inj. Esomac 40mg IV BD..." value={data.treatmentAdvised||""} onChange={setE("treatmentAdvised")} rows={3}/>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
          <Txta label="Past History / Previous Diagnosis" placeholder="Diabetes, Hypertension, previous surgeries..." value={data.previousDiagnosis||""} onChange={setE("previousDiagnosis")} rows={2}/>
          <Txta label="Past Surgeries" placeholder="e.g. Appendectomy 2018..." value={data.pastSurgeries||""} onChange={setE("pastSurgeries")} rows={2}/>
        </div>
        <Field label="Known Allergies">
          <input placeholder="e.g. Penicillin, Sulfa drugs..." value={data.knownAllergies||""} onChange={setE("knownAllergies")} style={{ fontFamily:"DM Sans,sans-serif", fontSize:14, color:T.text, background:T.white, border:`1.5px solid ${T.border}`, borderRadius:10, padding:"11px 14px", width:"100%", outline:"none", boxSizing:"border-box" }} />
        </Field>
      </Section>

      <Section title="Treating Doctor & Notes" subtitle="Doctor details and additional clinical notes" icon={IC.doctor}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
          <Field label="Treating Doctor" req>
            <SearchMultiDropdown
              value={data.treatingDoctor||""}
              onChange={setDoctor}
              groups={doctorGroups}
              placeholder="Select or type doctor name..."
              chipColor="#0369a1"
              chipBg="#e0f2fe"
              chipBorder="#7dd3fc"
              allowCustom={true}
              singleSelect={true}
            />
          </Field>
          <Field label="Qualification & Reg. No.">
            <SearchMultiDropdown
              value={data.doctorQual||""}
              onChange={set("doctorQual")}
              groups={qualGroups}
              placeholder="Select or type qualification..."
              chipColor="#7c3aed"
              chipBg="#f3e8ff"
              chipBorder="#c4b5fd"
              allowCustom={true}
              singleSelect={true}
            />
          </Field>
        </div>
        <Txta label="Additional Notes / Remarks" placeholder="Any other relevant clinical information..." value={data.notes||""} onChange={setE("notes")} rows={2}/>
      </Section>

      <div style={{ display:"flex", alignItems:"center", gap:12, marginTop:8, justifyContent:"space-between" }}>
        <button onClick={onSkip} style={{ padding:"11px 26px", borderRadius:10, border:`1.5px solid ${T.border}`, background:T.white, color:T.textMid, fontFamily:"DM Sans,sans-serif", fontSize:14, fontWeight:600, cursor:"pointer" }}>Skip for now →</button>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={()=>downloadAdmissionNote(data,patient,discharge,locId)} style={{ padding:"11px 26px", borderRadius:10, border:`1.5px solid ${T.accentDeep}`, background:T.white, color:T.accentDeep, fontFamily:"DM Sans,sans-serif", fontSize:14, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>🖨 Preview Admission Note</button>
          <button onClick={onSave} style={{ padding:"11px 26px", borderRadius:10, border:"none", background:`linear-gradient(135deg,${T.accentDeep},${T.primary})`, color:"#fff", fontFamily:"DM Sans,sans-serif", fontSize:14, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:8, boxShadow:"0 4px 16px rgba(14,165,233,.32)" }}>
            <Ico d={IC.check} size={15} sw={2.5}/> Save & Continue →
          </button>
        </div>
      </div>
    </div>
  );
}