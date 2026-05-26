import { branchKeyFromLocation, mapLivePatients } from "./dataMappers";
import { normalizeDischType } from "../../constants/billing/dischargeTypes";
import {
  normalizeServices,
  isPathologyCategory,
  isMedicineCategory,
} from "./billingUtils";
import {
  normalizeLabReports,
  normalizePharmacyRecords,
  deriveInsuranceType,
  deriveSavedState,
} from "./dataMappers";

export function admissionSortScore(row) {
  const admNo = Number(row?.admNo || 0);
  const doaTs = row?.doa ? new Date(row.doa).getTime() : 0;
  return (Number.isFinite(doaTs) ? doaTs : 0) + admNo;
}

export function pickPreferredPatientRecord(records = [], task = {}) {
  if (!Array.isArray(records) || records.length === 0) return null;
  const desiredAdmNo = Number(
    task?.admNo ||
    task?.admission_no ||
    task?.current_admission_no ||
    task?.admissionNo ||
    task?.patient_detail?.current_admission_no ||
    0
  ) || null;

  if (desiredAdmNo) {
    const exact = records.find(row => Number(row?.admNo || 0) === desiredAdmNo);
    if (exact) return exact;
  }

  const activeRows = records.filter(row => !row?.dod);
  const source     = activeRows.length ? activeRows : records;
  return [...source].sort((a, b) => admissionSortScore(b) - admissionSortScore(a))[0] || null;
}

export function mapTaskPatientDetail(task, fallbackBranchKey) {
  if (!task?.patient_detail) return null;
  const branchKey = branchKeyFromLocation(
    task.patient_detail.branch_location,
    fallbackBranchKey
  );
  const preferredAdmission =
    task?.admission_detail ||
    task?.current_admission_detail ||
    task?.patient_detail?.current_admission_detail ||
    null;

  const taskPatientRecord = preferredAdmission
    ? [{ ...task.patient_detail, admissions: [preferredAdmission] }]
    : [task.patient_detail];

  const mappedRows = mapLivePatients(taskPatientRecord, branchKey);
  return pickPreferredPatientRecord(mappedRows, task);
}

export function buildFallbackTaskPatient(task, resolvedBranchKey) {
  const taskPatientDetail   = task.patient_detail   || {};
  const taskAdmissionDetail =
    task.admission_detail ||
    task.current_admission_detail ||
    taskPatientDetail.current_admission_detail ||
    {};

  const fallbackBranchKey  = branchKeyFromLocation(
    taskPatientDetail.branch_location, resolvedBranchKey
  );
  const fallbackBranchName =
    fallbackBranchKey === "raya" ? "Raya Branch" : "Laxmi Nagar Branch";

  const taskServices       = normalizeServices(taskAdmissionDetail.services || []);
  const taskDirectServices = taskServices.filter(
    s => !isPathologyCategory(s.category) && !isMedicineCategory(s.category)
  );
  const taskLabReports  = Array.isArray(taskAdmissionDetail.labReports)
    ? normalizeLabReports(taskAdmissionDetail.labReports, taskServices)
    : [];
  const taskMedicalBill = Array.isArray(taskAdmissionDetail.pharmacyRecords)
    ? normalizePharmacyRecords(taskAdmissionDetail.pharmacyRecords, taskServices)
    : [];

  const taskDischarge   = taskAdmissionDetail.discharge     || {};
  const taskMedHistory  = taskAdmissionDetail.medicalHistory || {};

  const taskStatusRaw = String(task.status || "").toLowerCase();
  const normalizedTaskStatus = taskStatusRaw.includes("complete")
    ? "completed"
    : taskStatusRaw.includes("progress")
      ? "submitted"
      : "pending";

  return {
    taskId:         task.id,
    uhid:           String(task.patient_uhid || "") || `task-${task.id}`,
    admNo:          task.admNo || task.admission_no || task.current_admission_no || taskAdmissionDetail.admNo || "—",
    assignedTo:     task.assigned_to     || null,
    assignedToName: task.assigned_to_name || "",
    department:     task.department       || "Billing",
    branch:         fallbackBranchName,
    patientName:    task.patient_name || taskPatientDetail.patientName || "Assigned Patient",
    age:            taskPatientDetail.ageYY  || taskPatientDetail.age  || "—",
    gender:         taskPatientDetail.gender || "",
    phone:          taskPatientDetail.phone  || "",
    address:        taskPatientDetail.address || "",
    doa:            taskDischarge.doa     || taskAdmissionDetail.dateTime || "",
    dod:            taskDischarge.dod     || "",
    expectedDod:    taskDischarge.expectedDod || "",
    ward:           taskDischarge.wardName    || "",
    bed:            taskDischarge.bedNo       || taskDischarge.roomNo || "",
    doctor:         taskDischarge.doctorName  || taskMedHistory.treatingDoctor || "",
    diagnosis:      taskDischarge.diagnosis   || taskMedHistory.previousDiagnosis || task.title || "",
    status:         taskDischarge.dod ? "discharged" : "admitted",
    taskStatus:     normalizedTaskStatus,
    saved: deriveSavedState(
      taskDischarge, taskMedHistory, taskLabReports,
      taskMedicalBill, taskAdmissionDetail.billing || {}, taskDirectServices
    ),
    discharge: {
      ...taskDischarge,
      dischargeType:        normalizeDischType(taskDischarge.dischargeType || taskDischarge.dischargeStatus || "NORMAL"),
      dischargeStatus:      taskDischarge.dischargeStatus || taskDischarge.dischargeType || "",
      chiefComplaints:      taskDischarge.chiefComplaints  || taskMedHistory.chiefComplaints  || "",
      historyOfIllness:     taskDischarge.historyOfIllness || "",
      investigations:       taskDischarge.investigations   || taskMedHistory.investigations   || "",
      treatmentGiven:       taskDischarge.treatmentGiven   || taskMedHistory.treatmentAdvised || "",
      conditionAtDischarge: taskDischarge.conditionAtDischarge || taskDischarge.dischargeStatus || "",
      adviceOnDischarge:    taskDischarge.adviceOnDischarge    || taskDischarge.instructions   || "",
      followUp:             taskDischarge.followUp      || "",
      reasonForLama:        taskDischarge.reasonForLama  || "",
      lamaDeclaration:      taskDischarge.lamaDeclaration || "",
      reasonForDopr:        taskDischarge.reasonForDopr  || "",
      referredTo:           taskDischarge.referredTo     || "",
      bp:    taskDischarge.bp    || taskMedHistory.bp    || "",
      pr:    taskDischarge.pr    || taskMedHistory.pr    || "",
      spo2:  taskDischarge.spo2  || taskMedHistory.spo2  || "",
      temp:  taskDischarge.temp  || taskMedHistory.temp  || "",
      chest: taskDischarge.chest || taskMedHistory.chest || "",
      cvs:   taskDischarge.cvs   || taskMedHistory.cvs   || "",
      cns:   taskDischarge.cns   || taskMedHistory.cns   || "",
      pa:    taskDischarge.pa    || taskMedHistory.pa    || "",
    },
    medicalHistory:  taskMedHistory,
    services:        taskDirectServices,
    labReports:      taskLabReports,
    medicalBill:     taskMedicalBill,
    billing: {
      ...(taskAdmissionDetail.billing || {}),
      printStatus:  taskAdmissionDetail.billing?.printStatus  || "DRAFT",
      tpaInfo:      taskAdmissionDetail.billing?.tpaInfo      || {},
      tpaDocStatus: taskAdmissionDetail.billing?.tpaDocStatus || {},
    },
  };
}