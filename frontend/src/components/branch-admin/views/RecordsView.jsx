import React from "react";
import { printWithAuth } from "../../../utils/printWithAuth";
import { toast } from "react-toastify";
import { BASE_URL } from "../../../services/apiService";
import { apiService } from "../../../services/apiService";
import { T, RECORD_TYPES, mkBtn, exportExcel } from "../branchAdminConstants";
import DischargeTab     from "./records/DischargeTab";
import AdmissionNoteTab from "./records/AdmissionNoteTab";
import MedicalHistoryTab from "./records/MedicalHistoryTab";
import ReportsTab       from "./records/ReportsTab";
import MedicinesTab     from "./records/MedicinesTab";
import ServicesTab      from "./records/ServicesTab";
import FinalBillTab     from "./records/FinalBillTab";

export default function RecordsView({
  selPatient, setSelPatient, patients, nav, setNav,
  recTab, setRecTab,
  editableRows, setEditableRows,
  updateEditableField, addEditableRow, removeEditableRow,
  persistedSvcRows, persistedMedRows, setPersistedMedRows,
  billEdit, setBillEdit,
  canEditRecords,
  savingRecords, setSavingRecords,
  isRecordDirty, setIsRecordDirty, isRecordDirtyRef,
  medicineMaster,
  doctors,
  theme,
  resolvedBranchCode,
}) {
  if (!selPatient) return (
    <div style={{ textAlign: "center", padding: "80px 20px" }}>
      <div style={{ fontSize: "40px", marginBottom: "16px", color: T.textMuted }}>◈</div>
      <div style={{ fontSize: "11px", letterSpacing: "3px", color: T.textMuted, marginBottom: "12px" }}>NO PATIENT SELECTED</div>
      <p style={{ color: T.textSub, fontSize: "13px", maxWidth: "360px", margin: "0 auto 24px" }}>
        Open All Patients or Cash Patients and click View on any row.
      </p>
      <button style={mkBtn("dim", theme)} onClick={() => setNav("patients")}>→ Go to Patients</button>
    </div>
  );

  const livePatientRow    = (patients || []).find(p => p.uhid === selPatient.uhid && Number(p.admObj?.admNo) === Number(selPatient.admObj?.admNo));
  const selectedAdmission = livePatientRow?.admObj || selPatient.admObj || {};
  const selectedDischarge = selectedAdmission.discharge || {};
  const selectedMedical   = selectedAdmission.medicalHistory || {};

  // ── Save handler for all tabs EXCEPT discharge_summary
  // (discharge_summary saves itself internally via DischargeTab)
  const saveCurrentTab = async () => {
    if (!canEditRecords || !selPatient?.uhid || !selectedAdmission?.admNo) return;
    setSavingRecords(true);
    try {
      if (recTab === "reports") {
        await apiService.saveLabReportsBulk(
          selPatient.uhid, selectedAdmission.admNo,
          editableRows.filter(r => r.reportName).map(row => ({
            reportName: row.reportName || "Report",
            reportType: row.reportType || "Haematology",
            date:       row.date       || new Date().toISOString().slice(0, 10),
            orderedBy:  row.orderedBy  || "",
            remarks:    row.remarks    || "",
            impression: row.impression || "",
            amount:     Number(row.amount || 0),
            tests:      (row.tests || []).filter(t => t.name),
          }))
        );
      } else if (recTab === "medicines") {
        await apiService.savePharmacyRecordsBulk(
          selPatient.uhid, selectedAdmission.admNo,
          editableRows.map(row => ({
            medicine_name: row.medicine_name || "Medicine",
            date_given:    row.date_given    || row.date || new Date().toISOString().slice(0, 10),
            quantity:      Number(row.quantity || 1),
            rate:          Number(row.rate || 0),
            batch_no:      row.batch_no    || "",
            expiry_date:   row.expiry_date || "",
          }))
        );
      } else if (recTab === "admission_note") {
        const f = editableRows[0] || {};
        await apiService.updateMedicalHistory(selPatient.uhid, selectedAdmission.admNo, {
          ...selectedMedical,
          treatingDoctor:       f.treatingDoctor       || "",
          doctorQual:           f.doctorQual           || "",
          presentComplaints:    f.presentComplaints    || "",
          chiefComplaints:      f.chiefComplaints      || "",
          bp: f.bp || "", pulse: f.pulse || "", spo2: f.spo2 || "", temp: f.temp || "",
          chest: f.chest || "", cvs: f.cvs || "", cns: f.cns || "", pa: f.pa || "",
          investigations:       f.investigations       || "",
          provisionalDiagnosis: f.provisionalDiagnosis || "",
          treatmentAdvised:     f.treatmentAdvised     || "",
          notes:                f.notes                || "",
        });
      } else if (recTab === "services") {
        await apiService.saveServicesBulk(
          selPatient.uhid, selectedAdmission.admNo,
          editableRows.map(row => ({
            svcName: row.medicine_name || "Service",
            svcDate: row.date_given    || new Date().toISOString().slice(0, 10),
            svcQty:  Number(row.quantity || 1),
            svcRate: Number(row.rate    || 0),
            svcTot:  Number(row.quantity || 1) * Number(row.rate || 0),
            svcCode: row.batch_no || "",
            cghs:    row.batch_no || "",
          }))
        );
      } else if (recTab === "final_bill") {
        await apiService.savePharmacyRecordsBulk(
          selPatient.uhid, selectedAdmission.admNo,
          editableRows.map(row => ({
            medicine_name: row.medicine_name || "Medicine",
            date_given:    row.date_given    || row.date || new Date().toISOString().slice(0, 10),
            quantity:      Number(row.quantity || 1),
            rate:          Number(row.rate    || 0),
            batch_no:      row.batch_no    || "",
            expiry_date:   row.expiry_date || "",
          }))
        );
        await apiService.updateBilling(selPatient.uhid, selectedAdmission.admNo, billEdit);
      } else if (recTab === "medical_history") {
        const f = editableRows[0] || {};
        await apiService.updateMedicalHistory(selPatient.uhid, selectedAdmission.admNo, {
          ...selectedMedical,
          previousDiagnosis:  f.previousDiagnosis  || "",
          pastSurgeries:      f.pastSurgeries      || "",
          currentMedications: f.currentMedications || "",
          knownAllergies:     f.knownAllergies     || "",
          chronicConditions:  f.chronicConditions  || "",
          familyHistory:      f.familyHistory      || "",
          smokingStatus:      f.smokingStatus      || "",
          alcoholUse:         f.alcoholUse         || "",
          treatingDoctor:     f.treatingDoctor     || "",
          notes:              f.notes              || "",
        });
      }
      setIsRecordDirty(false);
      isRecordDirtyRef.current = false;
      toast.success("Record updated successfully.");
    } catch { toast.error("Failed to update this section."); }
    finally { setSavingRecords(false); }
  };

  const handlePrint = () => {
    const uhid  = selPatient?.uhid;
    const admNo = selectedAdmission?.admNo;
    if (!uhid || !admNo) { toast.error("Patient/Admission identifiers missing."); return; }
    const PRINT_KIND_MAP = {
      admission_note:  "admission-note",
      medical_history: "medical-history",
      reports:         "lab-reports",
      medicines:       "pharmacy-records",
    };
    // discharge_summary has its own print button inside DischargeTab
    if (recTab === "discharge_summary") return;
    const kind = PRINT_KIND_MAP[recTab];
    if (kind) { printWithAuth(`${BASE_URL}/patients/${uhid}/admissions/${admNo}/${kind}/print/`).catch(e => toast.error(e.message||"Print failed.")); }
  };

  const sharedTabProps = {
    editableRows, setEditableRows,
    updateEditableField, addEditableRow, removeEditableRow,
    canEditRecords, theme, doctors,
  };

  return (
    <>
      {/* ── Patient header bar ── */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderLeft: `3px solid ${theme.primary}`, borderRadius: "10px", padding: "18px 24px", marginBottom: "22px", display: "flex", gap: "28px", flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: "9px", letterSpacing: "2px", color: T.textMuted, textTransform: "uppercase", marginBottom: "3px" }}>Patient</div>
          <div style={{ fontSize: "18px", fontWeight: "800", color: T.text }}>{selPatient.name}</div>
        </div>
        {[["ID","#"+selPatient.id],["Age",selPatient.age],["Dept",selPatient.department],["Doctor",selPatient.doctor],["Pay Mode",selPatient.paymentMode],["Type",selPatient.paymentType||"—"],["Status",selPatient.status]].map(([l,v]) => (
          <div key={l}>
            <div style={{ fontSize:"9px",letterSpacing:"2px",color:T.textMuted,textTransform:"uppercase",marginBottom:"3px" }}>{l}</div>
            <div style={{ fontSize:"12px",color:T.textSub }}>{v}</div>
          </div>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Print button — hidden for discharge_summary (it has its own) */}
          {recTab !== "discharge_summary" && (
            <button style={{ ...mkBtn("dim", theme), padding:"8px 14px", fontSize:"11px" }} onClick={handlePrint}>⎙ Print Section</button>
          )}
          {canEditRecords && recTab !== "discharge_summary" && (
            <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
              {[
                {key:"admission_note", label:"Admission", kind:"admission-note"},
                {key:"reports",        label:"Reports",   kind:"lab-reports"},
                {key:"medicines",      label:"Medicines", kind:"pharmacy-records"},
              ].map(d => (
                <button key={d.key} style={{ ...mkBtn("primary",theme), padding:"6px 10px", fontSize:10 }}
                  onClick={async () => { const uhid=selPatient?.uhid,admNo=selectedAdmission?.admNo; if(!uhid||!admNo)return; try{await printWithAuth(`${BASE_URL}/patients/${uhid}/admissions/${admNo}/${d.kind}/print/`);}catch(e){toast.error(e.message||"Print failed.");} }}>
                  🖨 {d.label}
                </button>
              ))}
            </div>
          )}
          <button style={{ ...mkBtn("excel",theme), fontSize:"11px" }}
            onClick={() => exportExcel((editableRows||[]).map(r=>({...r,patientId:selPatient.id,patientName:selPatient.name})),`${recTab}_${selPatient.id}`)}>
            ↓ Excel
          </button>
          {/* Save button — hidden for discharge_summary (it saves itself) */}
          {canEditRecords && recTab !== "discharge_summary"
            ? <button style={{ ...mkBtn("primary",theme), padding:"8px 12px", fontSize:"11px" }} onClick={saveCurrentTab} disabled={savingRecords}>{savingRecords?"Saving...":"Save Section"}</button>
            : !canEditRecords && <div style={{ fontSize:"10px",color:T.textMuted,alignSelf:"center",padding:"4px 10px",border:`1px solid ${T.border}`,borderRadius:"20px" }}>Cashless: View only</div>
          }
          <button style={{ ...mkBtn("ghost",theme), padding:"8px 12px" }} onClick={() => setSelPatient(null)}>✕</button>
        </div>
      </div>

      {/* ── Tab pills ── */}
      <div style={{ display:"flex", gap:"6px", marginBottom:"20px", flexWrap:"wrap" }}>
        {RECORD_TYPES.map(rt => (
          <button key={rt.id} onClick={() => setRecTab(rt.id)} style={{
            padding:"7px 16px", borderRadius:"7px", fontSize:"11px", fontFamily:"inherit",
            cursor:"pointer", border:"1px solid", transition:"all 0.15s",
            background:   recTab===rt.id ? theme.primaryDim   : "transparent",
            borderColor:  recTab===rt.id ? theme.primaryBorder : T.border,
            color:        recTab===rt.id ? theme.primary       : T.textSub,
            fontWeight:   recTab===rt.id ? "600"               : "400",
          }}>{rt.label}</button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div>
        {recTab === "discharge_summary" && (
          <DischargeTab
            selPatient={selPatient}
            selectedAdmission={selectedAdmission}
            canEditRecords={canEditRecords}
            theme={theme}
            doctors={doctors}
          />
        )}
        {recTab === "admission_note"    && <AdmissionNoteTab  {...sharedTabProps} />}
        {recTab === "medical_history"   && <MedicalHistoryTab {...sharedTabProps} />}
        {recTab === "reports"           && <ReportsTab        {...sharedTabProps} selPatient={selPatient} selectedAdmission={selectedAdmission} />}
        {recTab === "medicines"         && <MedicinesTab      {...sharedTabProps} medicineMaster={medicineMaster} />}
        {recTab === "services"          && <ServicesTab       {...sharedTabProps} savingRecords={savingRecords} onSave={saveCurrentTab} />}
        {recTab === "final_bill"        && (
          <FinalBillTab
            selPatient={selPatient}
            selectedAdmission={selectedAdmission}
            editableRows={editableRows}
            setEditableRows={setEditableRows}
            persistedSvcRows={persistedSvcRows}
            persistedMedRows={persistedMedRows}
            setPersistedMedRows={setPersistedMedRows}
            billEdit={billEdit}
            setBillEdit={setBillEdit}
            canEditRecords={canEditRecords}
            theme={theme}
            savingRecords={savingRecords}
            onSave={saveCurrentTab}
            setIsRecordDirty={setIsRecordDirty}
            isRecordDirtyRef={isRecordDirtyRef}
          />
        )}
      </div>
    </>
  );
}
