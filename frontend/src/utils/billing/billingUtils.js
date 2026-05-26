import { buildDischargeSections } from "../../constants/billing/dischargeTypes";
import { isRadiologyType } from "../../constants/billing/reportTemplates";

export const toLocalDT = (v) =>
  String(v || "").replace(/([+-]\d{2}:\d{2}|Z).*$/, "").slice(0, 16);

export const stripTZ = (obj) => {
  if (!obj || typeof obj !== "object") return obj;
  const out = { ...obj };
  for (const k of Object.keys(out)) {
    if (typeof out[k] === "string" && /\d{4}-\d{2}-\d{2}T/.test(out[k]))
      out[k] = out[k].replace(/([+-]\d{2}:\d{2}|Z).*$/, "");
  }
  return out;
};

export const fmt        = n => "Rs." + Number(n || 0).toLocaleString("en-IN");
export const fmtDt      = d => d ? new Date(d).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }) : "--";
export const fmtDtShort = d => d ? new Date(d).toLocaleDateString("en-IN", { day:"numeric", month:"short" }) : "--";

export const normalizeMedicineKey = (value = "") =>
  String(value).toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();

export function fileNameSafe(str = "") {
  return str.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase().replace(/_+/g, "_").replace(/^_|_$/g, "");
}

export function buildFileName(patientName, reportType, date) {
  const name   = fileNameSafe(patientName || "PATIENT");
  const dt     = (date || new Date().toISOString().slice(0, 10)).replace(/-/g, "");
  const prefix = isRadiologyType(reportType) ? "RAD" : "LAB";
  return `${prefix}_reports_${name}_${dt}.pdf`;
}

export function statusColor(status) {
  if (status === "High") return "#dc2626";
  if (status === "Low")  return "#d97706";
  return "#059669";
}

export function calcTotals(svcs, labReports, med, billing) {
  const s    = svcs.reduce((a, r) => a + Number(r.amount || 0), 0);
  const p    = labReports.reduce((a, r) => a + Number(r.amount || 0), 0);
  const m    = med.reduce((a, r) => a + Number(r.amount || 0), 0);
  const gross = s + p + m;
  const disc  = Number(billing?.discount || 0);
  const adv   = Number(billing?.advance  || 0);
  const paid  = Number(billing?.paidNow  || 0);
  return { s, p, m, gross, disc, adv, paid, net: gross - disc, due: gross - disc - adv - paid };
}

export function normalizeServices(services = []) {
  return services.map((svc, i) => ({
    id:       svc.id       || `svc-${i}`,
    name:     svc.svcName  || svc.title    || "",
    category: svc.svcCat   || svc.type     || "",
    qty:      Number(svc.svcQty  ?? svc.qty  ?? 1),
    rate:     Number(svc.svcRate ?? svc.rate ?? 0),
    amount:   Number(svc.svcTot  ?? svc.total ?? ((svc.svcRate ?? svc.rate ?? 0) * (svc.svcQty ?? svc.qty ?? 1))),
    date:     svc.svcDate  || svc.date     || "",
  }));
}

export function hasAnyValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "number")  return value !== 0;
  if (typeof value === "string")  return value.trim() !== "";
  if (Array.isArray(value))       return value.some(hasAnyValue);
  if (typeof value === "object")  return Object.values(value).some(hasAnyValue);
  return Boolean(value);
}

export function isPathologyCategory(category = "") {
  const n = String(category).toLowerCase();
  return ["path","lab","bio","haem","micro","sero","histo","radiology","x-ray","scan","echo","usg","mri","ct"]
    .some(k => n.includes(k));
}

export function isMedicineCategory(category = "") {
  const n = String(category).toLowerCase();
  return ["med","pharma","drug"].some(k => n.includes(k));
}

export function buildDischargePayload(form) {
  return {
    doa:                  form.doa                 || "",
    dod:                  form.dod                 || "",
    expectedDod:          form.expectedDod          ? String(form.expectedDod).slice(0, 10) : "",
    wardName:             form.ward                 || "",
    bedNo:                form.bed                  || "",
    roomNo:               form.bed                  || "",
    doctorName:           form.doctor               || "",
    diagnosis:            form.diagnosis            || "",
    dischargeStatus:      form.conditionAtDischarge || form.condition || "",
    instructions:         form.adviceOnDischarge    || form.instructions || "",
    notes:                form.notes                || "",
    dischargeType:        form.dischargeType        || "NORMAL",
    chiefComplaints:      form.chiefComplaints      || "",
    historyOfIllness:     form.historyOfIllness     || "",
    investigations:       form.investigations       || "",
    treatmentGiven:       form.treatmentGiven       || "",
    conditionAtDischarge: form.conditionAtDischarge || "",
    adviceOnDischarge:    form.adviceOnDischarge    || "",
    followUp:             form.followUp             || "",
    reasonForLama:        form.reasonForLama        || "",
    lamaDeclaration:      form.lamaDeclaration      || "",
    reasonForDopr:        form.reasonForDopr        || "",
    referredTo:           form.referredTo           || "",
    bp:    form.bp    || "",
    pr:    form.pr    || "",
    spo2:  form.spo2  || "",
    temp:  form.temp  || "",
    chest: form.chest || "",
    cvs:   form.cvs   || "",
    cns:   form.cns   || "",
    pa:    form.pa    || "",
    sections: buildDischargeSections(form.dischargeType || "NORMAL", form),
  };
}

export function buildServicePayload(service, fallbackCategory) {
  const qty  = Number(service.qty    || 1);
  const rate = Number(service.rate   || service.amount || 0);
  return {
    svcName:      service.name,
    svcCat:       service.category || fallbackCategory,
    svcQty:       qty,
    svcRate:      rate,
    svcDate:      service.date || new Date().toISOString().slice(0, 10),
    pricing_type: service.pricing_type,
    rate,
    qty,
  };
}

export function buildLabReportPayload(report) {
  return {
    reportName:      report.reportName  || report.report_type || report.reportType || "Report",
    reportType:      report.reportType  || report.report_type || "Haematology",
    reportCategory:  report.reportCategory || report.report_category || "",
    date:            report.date        || new Date().toISOString().slice(0, 10),
    orderedBy:       report.orderedBy   || report.ordered_by  || "",
    amount:          Number(report.amount || 0),
    remarks:         report.remarks     || "",
    modalityDetails: report.modalityDetails || report.modality_details || {},
    findings:        report.findings    || "",
    impression:      report.impression  || "",
    tests:           Array.isArray(report.tests) ? report.tests : [],
  };
}

export function buildPharmacyPayload(record) {
  return {
    medicine_name: record.medicine_name || record.item || record.name || "",
    date_given:    record.date_given    || record.date || new Date().toISOString().slice(0, 10),
    quantity:      Number(record.quantity || 1),
    rate:          Number(record.rate || (record.amount || 0)),
    batch_no:      record.batch_no  || record.batchNo  || "",
    expiry_date:   record.expiry_date || record.expiryDate || "",
  };
}