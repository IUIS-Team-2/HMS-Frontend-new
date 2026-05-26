import { maskAadhaar } from "../../../utils/helpers";
import * as XLSX from "xlsx";

export function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function exportXLSX(rows, cols, filename) {
  const data = rows.map(r => {
    const obj = {};
    cols.forEach(c => { obj[c.label] = typeof c.get === "function" ? c.get(r) : (r[c.key] ?? ""); });
    return obj;
  });
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, filename);
}

export function flattenDB(db, branchFilter) {
  const out = [];
  Object.entries(db || {}).forEach(([branch, pts]) => {
    if (branchFilter && branchFilter !== "all" && branchFilter !== branch) return;
    (pts || []).forEach(p => {
      (p.admissions || []).forEach(adm => {
        const svcs = adm.services || [];
        const subtotal = svcs.reduce((s, sv) => s + (parseFloat(sv.rate)||0)*(parseFloat(sv.qty)||1), 0);
        const discount = parseFloat(adm.billing?.discount) || 0;
        const advance  = parseFloat(adm.billing?.advance)  || 0;
        const paid     = parseFloat(adm.billing?.paidNow)  || 0;
        const grand    = subtotal - discount;
        const pending  = Math.max(0, grand - advance - paid);
        out.push({
          _branch: branch, _patient: p, _admission: adm,
          uhid: p.uhid, name: p.patientName, gender: p.gender || "--",
          age: p.ageYY ? p.ageYY + "y" : "--",
          phone: p.phone || "--", bloodGroup: p.bloodGroup || "--",
          address: p.address || "--", nationalId: maskAadhaar(p.nationalId) || "--",
          allergies: p.allergies || "--", remarks: p.remarks || "--",
          tpa: p.tpa || "--", tpaCard: p.tpaCard || "--",
          admNo: adm.admNo,
          admDate: adm.discharge?.doa || adm.dateTime || adm.date || "",
          dischargeDate: adm.discharge?.dod || null,
          doctor: adm.discharge?.doctorName || "--",
          ward: adm.discharge?.wardName || "--",
          bed: adm.discharge?.bedNo || "--",
          room: adm.discharge?.roomNo || "--",
          department: adm.discharge?.department || "--",
          diagnosis: adm.discharge?.diagnosis || "--",
          dischargeStatus: adm.discharge?.dischargeStatus || "Admitted",
          paymentMode: adm.billing?.paymentMode || "--",
          subtotal, discount, advance, paid, grand, pending,
          admType: (p.tpa || p.payMode === "cashless") ? "Cashless" : "Cash",
          services: svcs, medHistory: adm.medicalHistory || null,
          billingObj: adm.billing || {}, guardianName: p.guardianName || "--",
          claimId: adm.billing?.claimId || "--",
        });
      });
    });
  });
  return out;
}
