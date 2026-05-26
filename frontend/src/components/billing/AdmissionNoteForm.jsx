import { useEffect } from "react";
import { DOCTOR_LIST, QUALIFICATION_LIST, getDoctorQualification } from "../../data/doctors";
import { MEDICATION_GROUPS } from "../../constants/billing/medicationGroups";
import SearchMultiDropdown from "./SearchMultiDropdown";
import InvestigationsDropdown from "./InvestigationsDropdown";

export default function AdmissionNoteForm({ eMed, setEMed, medicineMaster }) {
  const setE = k => e => setEMed(p => ({ ...p, [k]: e.target.value }));
  const set  = k => v => setEMed(p => ({ ...p, [k]: v }));

  const setDoctor = doctorValue => setEMed(prev => ({
    ...prev,
    treatingDoctor: doctorValue,
    doctorQual: getDoctorQualification(doctorValue) || prev.doctorQual || "",
  }));

  const doctorGroups = [{ group:"👨‍⚕️ Doctors",       color:"#0369a1", items: DOCTOR_LIST }];
  const qualGroups   = [{ group:"🎓 Qualifications", color:"#7c3aed", items: QUALIFICATION_LIST }];

  const masterItems = medicineMaster.map(m => m.name || m.medicine_name || "").filter(Boolean);
  const medGroups = [
    ...MEDICATION_GROUPS,
    ...(masterItems.length > 0 ? [{
      group: "💊 Medicine Master (Backend)",
      color: "#059669",
      items: masterItems.filter(name =>
        !MEDICATION_GROUPS.some(g => g.items.includes(name))
      ),
    }] : []),
  ];

  useEffect(() => {
    if (!eMed?.treatingDoctor || eMed?.doctorQual) return;
    const qualification = getDoctorQualification(eMed.treatingDoctor);
    if (!qualification) return;
    setEMed(prev => (prev.doctorQual ? prev : { ...prev, doctorQual: qualification }));
  }, [eMed?.treatingDoctor, eMed?.doctorQual, setEMed]);

  const SectionBlock = ({ icon, title, subtitle, children }) => (
    <div style={{
      background:"var(--white,#fff)", border:"1px solid var(--border)",
      borderRadius:14, marginBottom:18, overflow:"hidden",
      boxShadow:"0 1px 4px rgba(11,37,69,.06)",
    }}>
      <div style={{
        display:"flex", alignItems:"center", gap:12,
        padding:"15px 20px", borderBottom:"1px solid var(--border)",
        background:"var(--bg)",
      }}>
        <div style={{
          width:34, height:34, borderRadius:9,
          background:"var(--tealBg,#e6faf8)", border:"1px solid var(--border)",
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:16,
        }}>{icon}</div>
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
      <label style={{
        fontSize:10, fontWeight:700, color:"var(--text3)",
        textTransform:"uppercase", letterSpacing:".06em",
      }}>
        {label}{req && <span style={{ color:"var(--red)" }}> *</span>}
      </label>
      {children}
    </div>
  );

  const inp = (label, key, placeholder, req) => (
    <FieldWrap label={label} req={req}>
      <input
        placeholder={placeholder}
        value={eMed?.[key] || ""}
        onChange={setE(key)}
        style={{
          fontFamily:"inherit", fontSize:13, color:"var(--navy)",
          background:"var(--bg)", border:"1.5px solid var(--border)",
          borderRadius:8, padding:"9px 12px", width:"100%",
          outline:"none", boxSizing:"border-box",
        }}
      />
    </FieldWrap>
  );

  const txa = (label, key, placeholder, rows = 3, req) => (
    <FieldWrap label={label} req={req}>
      <textarea
        placeholder={placeholder}
        value={eMed?.[key] || ""}
        onChange={setE(key)}
        rows={rows}
        style={{
          fontFamily:"inherit", fontSize:13, color:"var(--navy)",
          background:"var(--bg)", border:"1.5px solid var(--border)",
          borderRadius:8, padding:"9px 12px", width:"100%",
          outline:"none", resize:"vertical", boxSizing:"border-box",
        }}
      />
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
              <InvestigationsDropdown
                value={eMed?.investigations || ""}
                onChange={set("investigations")}
              />
            </FieldWrap>
            {txa("Additional / Custom Tests","investigationsCustom","Any other tests not listed above...",2)}
          </div>
          {txa("Provisional Diagnosis","provisionalDiagnosis","Acute Retention of Urine with ?UTI...",6,true)}
        </div>
      </SectionBlock>

      <SectionBlock icon="💊" title="Treatment & Past History" subtitle="Treatment advised and past medical history">
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
          <FieldWrap label="Current Medications">
            <SearchMultiDropdown
              value={eMed?.currentMedications || ""}
              onChange={set("currentMedications")}
              groups={medGroups}
              placeholder="Select medications..."
              chipColor="#047857" chipBg="#d1fae5" chipBorder="#6ee7b7"
              allowCustom={true}
            />
          </FieldWrap>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {txa("Treatment Advised","treatmentAdvised","IV Fluids NS/RL @ 100ml/hr...",3,true)}
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
          {txa("Past History / Previous Diagnosis","previousDiagnosis","Diabetes, Hypertension...",2)}
          {txa("Past Surgeries","pastSurgeries","e.g. Appendectomy 2018...",2)}
        </div>
        <FieldWrap label="Known Allergies">
          <input
            placeholder="e.g. Penicillin, Sulfa drugs..."
            value={eMed?.knownAllergies || ""}
            onChange={setE("knownAllergies")}
            style={{
              fontFamily:"inherit", fontSize:13, color:"var(--navy)",
              background:"var(--bg)", border:"1.5px solid var(--border)",
              borderRadius:8, padding:"9px 12px", width:"100%",
              outline:"none", boxSizing:"border-box",
            }}
          />
        </FieldWrap>
      </SectionBlock>

      <SectionBlock icon="👨‍⚕️" title="Treating Doctor & Notes" subtitle="Doctor details and additional clinical notes">
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
          <FieldWrap label="Treating Doctor" req>
            <SearchMultiDropdown
              value={eMed?.treatingDoctor || ""}
              onChange={setDoctor}
              groups={doctorGroups}
              placeholder="Select or type doctor name..."
              chipColor="#0369a1" chipBg="#e0f2fe" chipBorder="#7dd3fc"
              allowCustom={true} singleSelect={true}
            />
          </FieldWrap>
          <FieldWrap label="Qualification & Reg. No.">
            <SearchMultiDropdown
              value={eMed?.doctorQual || ""}
              onChange={set("doctorQual")}
              groups={qualGroups}
              placeholder="Select or type qualification..."
              chipColor="#7c3aed" chipBg="#f3e8ff" chipBorder="#c4b5fd"
              allowCustom={true} singleSelect={true}
            />
          </FieldWrap>
        </div>
        <FieldWrap label="Additional Notes / Remarks">
          <textarea
            placeholder="Any other relevant clinical information..."
            value={eMed?.notes || ""}
            onChange={setE("notes")}
            rows={2}
            style={{
              fontFamily:"inherit", fontSize:13, color:"var(--navy)",
              background:"var(--bg)", border:"1.5px solid var(--border)",
              borderRadius:8, padding:"9px 12px", width:"100%",
              outline:"none", resize:"vertical", boxSizing:"border-box",
            }}
          />
        </FieldWrap>
      </SectionBlock>
    </div>
  );
}