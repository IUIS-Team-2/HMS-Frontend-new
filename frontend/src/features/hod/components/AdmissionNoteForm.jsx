import React from "react";

const SBlock = ({ icon, title, children, cols = 2 }) => (
  <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, marginBottom:16, overflow:"hidden" }}>
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 18px", borderBottom:"1px solid var(--border)", background:"var(--surface-2)" }}>
      <span style={{ fontSize:16 }}>{icon}</span>
      <div style={{ fontSize:13, fontWeight:700, color:"var(--text)" }}>{title}</div>
    </div>
    <div style={{ padding:18, display:"grid", gridTemplateColumns:`repeat(${cols}, 1fr)`, gap:14 }}>{children}</div>
  </div>
);

export default function AdmissionNoteForm({ eMed, setEMed, readOnly }) {
  const refs = React.useRef({});

  const collectAndFlush = React.useCallback(() => {
    const out = {};
    Object.entries(refs.current).forEach(([k, el]) => { if (el) out[k] = el.value; });
    setEMed(prev => ({ ...prev, ...out }));
  }, [setEMed]);

  React.useEffect(() => { setEMed._flush = collectAndFlush; });

  const baseStyle = (readOnly) => ({
    fontFamily:"inherit", fontSize:13, color:"var(--text)",
    background: readOnly ? "transparent" : "var(--surface-2)",
    border: readOnly ? "1px solid var(--border)" : "1.5px solid var(--border)",
    borderRadius:8, padding:"9px 12px", width:"100%", outline:"none", boxSizing:"border-box",
  });

  const inp = (label, key, placeholder) => (
    <div>
      <label style={{ fontSize:10, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:".06em", display:"block", marginBottom:5 }}>{label}</label>
      <input placeholder={placeholder} defaultValue={eMed?.[key] || ""} disabled={readOnly}
        ref={el => { refs.current[key] = el; }} onChange={() => {}} style={baseStyle(readOnly)}/>
    </div>
  );

  const txa = (label, key, placeholder, rows = 3) => (
    <div>
      <label style={{ fontSize:10, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:".06em", display:"block", marginBottom:5 }}>{label}</label>
      <textarea placeholder={placeholder} defaultValue={eMed?.[key] || ""} disabled={readOnly}
        ref={el => { refs.current[key] = el; }} rows={rows}
        style={{ ...baseStyle(readOnly), resize:"vertical" }}/>
    </div>
  );

  return (
    <div>
      <SBlock icon="🩺" title="Present Complaints" cols={2}>
        {txa("Present Complaints", "presentComplaints", "Patient presented in Department of Emergency Medicine...", 4)}
        {txa("Chief Complaints", "chiefComplaints", "Severe pain at Rt. Iliac fossa...", 4)}
      </SBlock>
      <SBlock icon="💓" title="Examinations" cols={4}>
        {inp("BP (mmHg)", "bp", "120/80mmHg")}
        {inp("PR (/min)", "pr", "82/min")}
        {inp("SPO2", "spo2", "98% On RA")}
        {inp("TEMP", "temp", "98.6°F")}
        {inp("Chest", "chest", "B/L Crepts+")}
        {inp("CVS", "cvs", "S1 S2 +")}
        {inp("CNS", "cns", "Conscious")}
        {inp("P/A", "pa", "Distended")}
      </SBlock>
      <SBlock icon="🔬" title="Investigations & Diagnosis" cols={2}>
        {txa("Investigations / Reports", "investigations", "CBC, LFT, KFT...", 3)}
        {txa("Provisional Diagnosis", "provisionalDiagnosis", "Acute Retention of Urine...", 3)}
      </SBlock>
      <SBlock icon="💊" title="Treatment & History" cols={2}>
        {txa("Current Medications", "currentMedications", "IV Fluids NS/RL @ 100ml/hr...", 3)}
        {txa("Treatment Advised", "treatmentAdvised", "IV antibiotics, oral medications...", 3)}
        {txa("Past History", "previousDiagnosis", "Diabetes, Hypertension...", 2)}
        {txa("Past Surgeries", "pastSurgeries", "e.g. Appendectomy 2018...", 2)}
        {inp("Treating Doctor", "treatingDoctor", "Dr. Name (MBBS, MD)")}
        {inp("Known Allergies", "knownAllergies", "e.g. Penicillin")}
      </SBlock>
    </div>
  );
}
