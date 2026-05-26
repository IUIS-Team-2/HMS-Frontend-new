import React from "react";
import SectionCard from "../../../../components/ui/SectionCard";
import Field from "../../../../components/ui/Field";
import DoctorSelectField from "../../../../components/doctors/DoctorSelectField";

export default function MedicalHistoryTab({ editableRows, updateEditableField, canEditRecords, theme, doctors }) {
  const r = editableRows[0] || {};
  const u = k => v => updateEditableField(0, k, v);
  return (
    <SectionCard theme={theme} icon="📜" title="Medical History" subtitle="Past illnesses, allergies and ongoing medications">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "14px 16px" }}>
        <Field editable={canEditRecords} label="Past History / Previous Diagnosis" multiline rows={3} value={r.previousDiagnosis}  onChange={u("previousDiagnosis")}  placeholder="Diabetes, Hypertension, previous surgeries…" />
        <Field editable={canEditRecords} label="Past Surgeries"                    multiline rows={3} value={r.pastSurgeries}      onChange={u("pastSurgeries")}      placeholder="e.g. Appendectomy 2018…" />
        <Field editable={canEditRecords} label="Current Medications"  colSpan={2}  multiline rows={3} value={r.currentMedications} onChange={u("currentMedications")} placeholder="Currently used medications…" />
        <Field editable={canEditRecords} label="Known Allergies"                                      value={r.knownAllergies}    onChange={u("knownAllergies")}    placeholder="e.g. Penicillin, Sulfa drugs…" />
        <Field editable={canEditRecords} label="Chronic Conditions"                                   value={r.chronicConditions} onChange={u("chronicConditions")} placeholder="e.g. Asthma, COPD…" />
        <Field editable={canEditRecords} label="Family History"       colSpan={2}  multiline rows={2} value={r.familyHistory}      onChange={u("familyHistory")}     placeholder="Relevant family medical history…" />
        <Field editable={canEditRecords} label="Smoking Status"                                       value={r.smokingStatus}     onChange={u("smokingStatus")}     placeholder="Yes / No / Former" />
        <Field editable={canEditRecords} label="Alcohol Use"                                          value={r.alcoholUse}        onChange={u("alcoholUse")}        placeholder="Yes / No / Occasional" />
        <DoctorSelectField editable={canEditRecords} label="Treating Doctor" value={r.treatingDoctor} onChange={u("treatingDoctor")}
          onSelectDoctor={doc => updateEditableField(0,"treatingDoctor",`Dr. ${doc.name}`)}
          placeholder="Treating doctor name" doctors={doctors} />
        <Field editable={canEditRecords} label="Additional Notes"     colSpan={2}  multiline rows={3} value={r.notes}              onChange={u("notes")}             placeholder="Other notes…" />
      </div>
    </SectionCard>
  );
}
