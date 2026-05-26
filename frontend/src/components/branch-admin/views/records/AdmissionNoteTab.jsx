import React from "react";
import SectionCard from "../../../../components/ui/SectionCard";
import Field from "../../../../components/ui/Field";
import DoctorSelectField from "../../../../components/doctors/DoctorSelectField";

export default function AdmissionNoteTab({ editableRows, updateEditableField, canEditRecords, theme, doctors }) {
  const r = editableRows[0] || {};
  const u = k => v => updateEditableField(0, k, v);
  return (
    <>
      <SectionCard theme={theme} icon="🩺" title="Present Complaints" subtitle="Chief complaints and presenting symptoms">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "14px 16px" }}>
          <Field editable={canEditRecords} label="Present Complaints"     multiline rows={4} value={r.presentComplaints}   onChange={u("presentComplaints")}   placeholder="Patient presented with…" />
          <Field editable={canEditRecords} label="C/O (Chief Complaints)" multiline rows={4} value={r.chiefComplaints}     onChange={u("chiefComplaints")}     placeholder="Severe pain, fever with chills…" />
        </div>
      </SectionCard>
      <SectionCard theme={theme} icon="💓" title="Examinations" subtitle="Vitals and clinical examination findings">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px 14px", marginBottom: "4px" }}>
          <Field editable={canEditRecords} label="BP (mmHg)" value={r.bp}    onChange={u("bp")}    placeholder="e.g. 120/80mmHg" />
          <Field editable={canEditRecords} label="PR (/min)" value={r.pulse} onChange={u("pulse")} placeholder="e.g. 82/min" />
          <Field editable={canEditRecords} label="SPO2"      value={r.spo2}  onChange={u("spo2")}  placeholder="e.g. 98% On RA" />
          <Field editable={canEditRecords} label="TEMP"      value={r.temp}  onChange={u("temp")}  placeholder="e.g. 98.6°F" />
          <Field editable={canEditRecords} label="Chest"     value={r.chest} onChange={u("chest")} placeholder="e.g. B/L Crepts+" />
          <Field editable={canEditRecords} label="CVS"       value={r.cvs}   onChange={u("cvs")}   placeholder="e.g. S1 S2 +" />
          <Field editable={canEditRecords} label="CNS"       value={r.cns}   onChange={u("cns")}   placeholder="e.g. Conscious" />
          <Field editable={canEditRecords} label="P/A"       value={r.pa}    onChange={u("pa")}    placeholder="e.g. Distended" />
        </div>
      </SectionCard>
      <SectionCard theme={theme} icon="🔬" title="Investigations & Diagnosis" subtitle="Tests ordered and provisional diagnosis">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "14px 16px" }}>
          <Field editable={canEditRecords} label="Investigations / Reports" multiline rows={4} value={r.investigations}        onChange={u("investigations")}        placeholder="Investigations ordered…" />
          <Field editable={canEditRecords} label="Provisional Diagnosis"    multiline rows={4} value={r.provisionalDiagnosis}  onChange={u("provisionalDiagnosis")}  placeholder="Acute Retention of Urine with ?UTI…" />
        </div>
      </SectionCard>
      <SectionCard theme={theme} icon="💊" title="Treatment Advised" subtitle="Plan of management">
        <Field editable={canEditRecords} label="Treatment Advised" colSpan={2} multiline rows={4} value={r.treatmentAdvised} onChange={u("treatmentAdvised")} placeholder="IV Fluids NS/RL @ 100ml/hr, Inj. Esomac 40mg IV BD…" />
      </SectionCard>
      <SectionCard theme={theme} icon="👨‍⚕️" title="Treating Doctor & Notes" subtitle="Doctor details and additional clinical notes">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "14px 16px" }}>
          <DoctorSelectField editable={canEditRecords} label="Treating Doctor" value={r.treatingDoctor} onChange={u("treatingDoctor")}
            onSelectDoctor={doc => { updateEditableField(0,"treatingDoctor",`Dr. ${doc.name}`); if(doc.qualification) updateEditableField(0,"doctorQual",doc.qualification); }}
            placeholder="Select or type doctor name…" doctors={doctors} />
          <Field editable={canEditRecords} label="Qualification & Reg. No." value={r.doctorQual} onChange={u("doctorQual")} placeholder="MBBS, MD…" />
          <Field editable={canEditRecords} label="Additional Notes / Remarks" colSpan={2} multiline rows={2} value={r.notes} onChange={u("notes")} placeholder="Any other relevant clinical information…" />
        </div>
      </SectionCard>
    </>
  );
}
