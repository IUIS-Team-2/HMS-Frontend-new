import { useState, useMemo, useEffect, createContext, useContext } from "react";
import { useTheme } from "../context/ThemeContext";
import * as XLSX from "xlsx";
import { apiService, BASE_URL } from "../services/apiService";
import { toast } from "react-toastify";
import ThemeModeDock from "../components/ui/ThemeModeDock";
import MedicalHistoryPage from "./MedicalHistoryPage";
import UpdateRecordsPanel from "../components/admin/UpdateRecordsPanel";
import {
  LayoutDashboard, Hospital, Hotel, Users, CreditCard, Stethoscope, DoorOpen,
  FileDown, UserCog, Building2, Star, ClipboardList, Wallet, Landmark,
  AlertTriangle, Upload, MessageCircle, Phone, FileText, FlaskConical, Printer,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════
   DESIGN TOKENS
══════════════════════════════════════════════════════════════ */
const T_DARK = {
  bg: "#0b1220", surface: "#111827", card: "#131c2c", card2: "#182236",
  border: "#1f2a3d", border2: "#2d3a52", laxmi: "#60a5fa", raya: "#93c5fd",
  green: "#34d399", amber: "#fbbf24", red: "#f87171", white: "#e2e8f0",
  dim: "#94a3b8", dimmer: "#64748b", sidebar: "#0d1424",
};
const T_LIGHT = {
  bg: "#f6f8fb", surface: "#ffffff", card: "#ffffff", card2: "#f8fafc",
  border: "#e2e8f0", border2: "#cbd5e1", laxmi: "#3b82f6", raya: "#2563eb",
  green: "#059669", amber: "#d97706", red: "#dc2626", white: "#0f172a",
  dim: "#64748b", dimmer: "#94a3b8", sidebar: "#ffffff",
};
let T = T_DARK;
const TC = createContext(T_DARK);
const useT = () => useContext(TC);

const SD = "0 4px 32px rgba(0,0,0,.5)";
const cardStyle = (t) => ({ background: t.card, borderRadius: 14, padding: 20, boxShadow: SD });
const ALL_HOSPITALS_LABEL = "All Hospitals";
const isGlobalAccessUser = (user) => user?.role === "superadmin" || user?.role === "office_admin" || user?.branch === "ALL";
const bColor = (loc, t) => loc === "ALL" ? t.amber : (loc === "laxmi" ? t.laxmi : t.raya);
const bName = loc => loc === "ALL" ? ALL_HOSPITALS_LABEL : (loc === "laxmi" ? "Lakshmi Nagar" : "Raya");
const fmt = d => { try { const dt = new Date(d); return isNaN(dt) ? "--" : dt.toLocaleDateString("en-IN"); } catch { return "--"; } };
const inr = v => "Rs." + Number(v || 0).toLocaleString("en-IN");

const ROLE_LABELS = { office_admin: "Office Admin", branch_admin: "Branch Admin", superadmin: "Super Admin" };
const roleColor = (role, t) => {
  if (role === "superadmin") return t.amber;
  if (role === "office_admin") return t.laxmi;
  if (role === "branch_admin") return t.raya;
  return t.green;
};

function exportXLSX(rows, cols, filename) {
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

function flattenDB(db, branchFilter) {
  const out = [];
  Object.entries(db || {}).forEach(([branch, pts]) => {
    if (branchFilter && branchFilter !== "all" && branchFilter !== branch) return;
    (pts || []).forEach(p => {
      (p.admissions || []).forEach(adm => {
        const svcs = adm.services || [];
        const subtotal = svcs.reduce((s, sv) => s + (parseFloat(sv.rate) || 0) * (parseFloat(sv.qty) || 1), 0);
        const discount = parseFloat(adm.billing?.discount) || 0;
        const advance = parseFloat(adm.billing?.advance) || 0;
        const paid = parseFloat(adm.billing?.paidNow) || 0;
        const grand = subtotal - discount;
        const pending = Math.max(0, grand - advance - paid);
        out.push({
          _branch: branch, _patient: p, _admission: adm,
          uhid: p.uhid, name: p.patientName, gender: p.gender || "--",
          age: p.ageYY ? p.ageYY + "y" : "--",
          phone: p.phone || "--", bloodGroup: p.bloodGroup || "--",
          address: p.address || "--", nationalId: p.nationalId || "--",
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
          services: svcs,
          medHistory: adm.medicalHistory || null,
          billingObj: adm.billing || {},
          guardianName: p.guardianName || "--",
          claimId: adm.billing?.claimId || "--",
        });
      });
    });
  });
  return out;
}

/* ══════════════════════════════════════════════════════════════
   MICRO UI COMPONENTS
══════════════════════════════════════════════════════════════ */
function Pill({ children, color }) {
  return <span style={{ background: color + "1A", color, border: `1px solid ${color}40`, borderRadius: 6, padding: "2px 9px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>{children}</span>;
}
function Badge({ children, color }) {
  return <span style={{ background: color + "18", color, borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{children}</span>;
}
function STitle({ children, action }) {
  const T = useT();
  return <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: T.dim }}>{children}</div>
    {action}
  </div>;
}
function StatCard({ icon, label, value, sub, color }) {
  const T = useT();
  const cs = cardStyle(T);
  const Icon = icon;
  return <div style={{ ...cs, borderLeft: `4px solid ${color || T.laxmi}`, flex: 1, minWidth: 150 }}>
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <div>
        <div style={{ fontSize: 11, color: T.dim, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 5 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: T.white }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: T.dim, marginTop: 3 }}>{sub}</div>}
      </div>
      <div style={{ fontSize: 22, opacity: .75 }}>{Icon ? <Icon size={20} strokeWidth={1.9} /> : null}</div>
    </div>
  </div>;
}
function XlsBtn({ onClick, label }) {
  const T = useT();
  return <button onClick={onClick} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: T.green, color: "#000", fontSize: 12, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" }}>{label || "Download Excel"}</button>;
}
function FilterSelect({ value, onChange, options, style }) {
  const T = useT();
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ padding: "6px 28px 6px 12px", borderRadius: 8, border: `1px solid ${T.border2}`, background: T.card, color: T.white, fontSize: 12, fontWeight: 600, cursor: "pointer", outline: "none", appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23888'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", ...style }}>
      {options.map(([val, label]) => (<option key={val} value={val}>{label}</option>))}
    </select>
  );
}
function TH({ h }) {
  const T = useT();
  return <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: T.dim, textTransform: "uppercase", letterSpacing: ".06em", whiteSpace: "nowrap", background: T.bg }}>{h}</th>;
}
function StarRating({ rating, max = 5, size = 16 }) {
  const T = useT();
  return <span style={{ display: "inline-flex", gap: 2 }}>{Array.from({ length: max }).map((_, i) => (<span key={i} style={{ fontSize: size, color: i < rating ? "#FBBF24" : T.dimmer, lineHeight: 1 }}>{i < rating ? "★" : "☆"}</span>))}</span>;
}

/* ══════════════════════════════════════════════════════════════
   SHARED PRINT HELPER
══════════════════════════════════════════════════════════════ */
function openPrintWindow(title, htmlBody, cssExtra = "") {
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) { alert("Pop-up blocked. Please allow pop-ups for this site."); return; }
  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; color: #000; padding: 20px; margin: 0; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #000; padding: 6px 10px; text-align: left; font-size: 11px; }
    th { background: #f0f0f0; font-weight: bold; }
    .no-border td, .no-border th { border: none; }
    .total-row td { font-weight: bold; background: #f9f9f9; }
    @media print { @page { size: A4; margin: 10mm; } }
    ${cssExtra}
  </style>
</head>
<body>
  ${htmlBody}
</body>
</html>`;
  win.document.open();
  win.document.write(fullHtml);
  win.document.close();
  win.onload = () => { win.focus(); win.print(); };
  setTimeout(() => { try { win.focus(); win.print(); } catch(e) {} }, 800);
}

/* ══════════════════════════════════════════════════════════════
   BILL PRINT MODAL
══════════════════════════════════════════════════════════════ */
function BillPrintModal({ p, onClose }) {
  const T = useT();
  if (!p) return null;

  const branchInfo = {
    laxmi: { name: "Lakshmi Nagar Branch", address: "Lakshmi Nagar, Mathura, Uttar Pradesh", phone: "+91-9717444531 / +91-9717444532", email: "laxminagar@sangihospital.com" },
    raya:  { name: "Raya Branch", address: "Raya, Mathura, Uttar Pradesh - 281204", phone: "+91-9311212090 / +91-9311212091", email: "info@sangihospital.com" },
  };
  const branch = branchInfo[p._branch] || branchInfo.laxmi;
  const billDate = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
    + " " + new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }) + " HRS";
  const today  = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
  const svcs   = p.services || [];
  const subtotal = p.subtotal ?? svcs.reduce((s, sv) => s + (parseFloat(sv.rate)||0) * (parseFloat(sv.qty)||1), 0);
  const discount = p.discount ?? (parseFloat(p.billingObj?.discount) || 0);
  const grand    = p.grand   ?? (subtotal - discount);

  const handlePrint = () => {
    const svcRows = svcs.length === 0
      ? `<tr><td colspan="7" style="padding:20px;text-align:center;color:#999">No services recorded</td></tr>`
      : svcs.map((sv, i) => {
          const amount = (parseFloat(sv.rate)||0) * (parseFloat(sv.qty)||1);
          return `<tr>
            <td style="padding:5px 8px">${i+1}</td>
            <td style="padding:5px 8px">${fmt(p.admDate)}</td>
            <td style="padding:5px 8px">${sv.cghs || sv.type || "--"}</td>
            <td style="padding:5px 8px">${sv.title || sv.type}</td>
            <td style="padding:5px 8px;text-align:center">${sv.qty || 1}</td>
            <td style="padding:5px 8px;text-align:right">${parseFloat(sv.rate||0).toFixed(2)}</td>
            <td style="padding:5px 8px;text-align:right">${amount.toFixed(2)}</td>
          </tr>`;
        }).join("");

    const html = `
<div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:10px">
  <div>
    <div style="font-size:12px;color:#555;margin-bottom:4px">${today}</div>
    <div style="font-size:16px;font-weight:900">FINAL BILL</div>
  </div>
  <div style="text-align:center">
    <div style="font-size:28px;font-weight:900;color:#1a5b8c;letter-spacing:2px;line-height:1">SANGi</div>
    <div style="font-size:13px;font-weight:700;color:#d93838;letter-spacing:4px">HOSPITAL</div>
    <div style="font-size:11px;color:#555;margin-top:4px">${branch.name}</div>
  </div>
  <div style="text-align:right;font-size:11px;color:#444;line-height:1.8">
    <div>${branch.address}</div>
    <div>Ph.: ${branch.phone}</div>
    <div>Email: ${branch.email}</div>
    <div>Web.: www.sangihospital.com</div>
  </div>
</div>
<table style="margin-bottom:12px;font-size:11px">
  <tbody>
    <tr>
      <td style="border:1px solid #ccc;padding:5px 10px;width:25%"><strong>IPD No. :</strong> ${p.admNo||"--"}</td>
      <td style="border:1px solid #ccc;padding:5px 10px;width:25%"><strong>Bill No. :</strong> ${p.admNo||"--"}/26</td>
      <td style="border:1px solid #ccc;padding:5px 10px;width:25%"><strong>Patient Name :</strong> ${(p.name||"").toUpperCase()}</td>
      <td style="border:1px solid #ccc;padding:5px 10px;width:25%"><strong>Bill Date :</strong> ${billDate}</td>
    </tr>
    <tr>
      <td style="border:1px solid #ccc;padding:5px 10px"><strong>Guardian Name :</strong> ${p.guardianName !== "--" ? p.guardianName : "--"}</td>
      <td style="border:1px solid #ccc;padding:5px 10px"><strong>Age/Sex :</strong> ${p.age} / ${p.gender?.toUpperCase()}</td>
      <td style="border:1px solid #ccc;padding:5px 10px"><strong>Address :</strong> ${p.address !== "--" ? p.address : "--"}</td>
      <td style="border:1px solid #ccc;padding:5px 10px"><strong>Card No. :</strong> ${p.tpaCard !== "--" ? p.tpaCard : "--"}</td>
    </tr>
    <tr>
      <td style="border:1px solid #ccc;padding:5px 10px"><strong>Consultant :</strong> ${p.doctor !== "--" ? p.doctor : "—"}</td>
      <td style="border:1px solid #ccc;padding:5px 10px"><strong>Room :</strong> ${p.room !== "--" ? p.room : "—"} / ${p.bed !== "--" ? p.bed : "—"}</td>
      <td style="border:1px solid #ccc;padding:5px 10px"><strong>Claim ID :</strong> ${p.claimId !== "--" ? p.claimId : "—"}</td>
      <td style="border:1px solid #ccc;padding:5px 10px"><strong>Panel :</strong> ${p.admType === "Cashless" ? (p.tpa !== "--" ? p.tpa : "CASHLESS") : "CASH"}</td>
    </tr>
    <tr>
      <td style="border:1px solid #ccc;padding:5px 10px"><strong>DOA &amp; Time :</strong> ${p.admDate ? fmt(p.admDate) : "—"}</td>
      <td style="border:1px solid #ccc;padding:5px 10px"><strong>Contact No. :</strong> ${p.phone !== "--" ? p.phone : "—"}</td>
      <td style="border:1px solid #ccc;padding:5px 10px"><strong>DOD &amp; Time :</strong> ${p.dischargeDate ? fmt(p.dischargeDate) : "—"}</td>
      <td style="border:1px solid #ccc;padding:5px 10px"><strong>Status on Discharge :</strong> ${p.dischargeStatus}</td>
    </tr>
  </tbody>
</table>
<table style="margin-bottom:12px">
  <thead>
    <tr style="background:#f0f0f0">
      <th style="border:1px solid #000;padding:6px 8px;text-align:left">Sr No.</th>
      <th style="border:1px solid #000;padding:6px 8px;text-align:left">Date</th>
      <th style="border:1px solid #000;padding:6px 8px;text-align:left">CGHS Code</th>
      <th style="border:1px solid #000;padding:6px 8px;text-align:left">Description</th>
      <th style="border:1px solid #000;padding:6px 8px;text-align:center">Quantity</th>
      <th style="border:1px solid #000;padding:6px 8px;text-align:right">Rate</th>
      <th style="border:1px solid #000;padding:6px 8px;text-align:right">Amount</th>
    </tr>
  </thead>
  <tbody>${svcRows}</tbody>
</table>
<table style="margin-bottom:20px">
  <tbody>
    <tr><td style="border:none;padding:3px 8px;text-align:right;font-weight:700">Gross Total:</td><td style="border:1px solid #ccc;padding:3px 10px;text-align:right;width:120px;font-weight:700">${subtotal.toFixed(2)}</td></tr>
    <tr><td style="border:none;padding:3px 8px;text-align:right;font-weight:700">Discount:</td><td style="border:1px solid #ccc;padding:3px 10px;text-align:right;font-weight:700">- ${discount.toFixed(2)}</td></tr>
    <tr><td style="border:none;padding:3px 8px;text-align:right;font-weight:700">Advance:</td><td style="border:1px solid #ccc;padding:3px 10px;text-align:right;font-weight:700">${(parseFloat(p.billingObj?.advance)||0).toFixed(2)}</td></tr>
    <tr><td style="border:none;padding:3px 8px;text-align:right;font-size:13px;font-weight:900">Net Payable Amount:</td><td style="border:1px solid #ccc;padding:3px 10px;text-align:right;font-size:13px;font-weight:900">${grand.toFixed(2)}</td></tr>
  </tbody>
</table>
<div style="display:flex;justify-content:space-between;margin-top:40px">
  <div style="text-align:center;min-width:160px">
    <div style="border-top:1px solid #000;padding-top:6px;font-weight:700">Cashier Signature</div>
  </div>
  <div style="text-align:center;min-width:160px">
    <div style="border-top:1px solid #000;padding-top:6px;font-weight:700">Patient / Attendant Signature</div>
  </div>
</div>`;

    openPrintWindow(`Bill - ${p.name}`, html);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 4000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: T.surface, borderRadius: 16, width: "100%", maxWidth: 900, maxHeight: "94vh", overflow: "hidden", display: "flex", flexDirection: "column", border: `1px solid ${T.border}`, boxShadow: "0 32px 100px rgba(0,0,0,.8)" }}>
        <div style={{ padding: "14px 22px", borderBottom: `1px solid ${T.border}`, background: T.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: T.white }}>Bill Preview — {p.name}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handlePrint} style={{ padding: "8px 18px", borderRadius: 8, background: T.laxmi, color: "#000", border: "none", fontWeight: 800, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Printer size={14} /> Print Bill
            </button>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,.08)", border: "none", color: T.white, width: 34, height: 34, borderRadius: 8, cursor: "pointer", fontSize: 16 }}>✕</button>
          </div>
        </div>
        <div style={{ overflowY: "auto", padding: 24 }}>
          <div style={{ background: "#fff", color: "#000", fontFamily: "Arial,sans-serif", fontSize: 12, padding: 24, borderRadius: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #000", paddingBottom: 10, marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 12, color: "#555", marginBottom: 4 }}>{today}</div>
                <div style={{ fontSize: 16, fontWeight: 900 }}>FINAL BILL</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#1a5b8c", letterSpacing: 2, lineHeight: 1 }}>SANGi</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#d93838", letterSpacing: 4 }}>HOSPITAL</div>
                <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>{branch.name}</div>
              </div>
              <div style={{ textAlign: "right", fontSize: 11, color: "#444", lineHeight: 1.8 }}>
                <div>{branch.address}</div>
                <div>Ph.: {branch.phone}</div>
                <div>Email: {branch.email}</div>
                <div>Web.: www.sangihospital.com</div>
              </div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12, fontSize: 11 }}>
              <tbody>
                <tr>
                  <td style={{ border: "1px solid #ccc", padding: "5px 10px", width: "25%" }}><strong>IPD No. :</strong> {p.admNo||"--"}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 10px", width: "25%" }}><strong>Bill No. :</strong> {p.admNo||"--"}/26</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 10px", width: "25%" }}><strong>Patient Name :</strong> {(p.name||"").toUpperCase()}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 10px", width: "25%" }}><strong>Bill Date :</strong> {billDate}</td>
                </tr>
                <tr>
                  <td style={{ border: "1px solid #ccc", padding: "5px 10px" }}><strong>Guardian Name :</strong> {p.guardianName !== "--" ? p.guardianName : "--"}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 10px" }}><strong>Age/Sex :</strong> {p.age} / {p.gender?.toUpperCase()}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 10px" }}><strong>Address :</strong> {p.address !== "--" ? p.address : "--"}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 10px" }}><strong>Card No. :</strong> {p.tpaCard !== "--" ? p.tpaCard : "--"}</td>
                </tr>
                <tr>
                  <td style={{ border: "1px solid #ccc", padding: "5px 10px" }}><strong>Consultant :</strong> {p.doctor !== "--" ? p.doctor : "—"}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 10px" }}><strong>Room :</strong> {p.room !== "--" ? p.room : "—"} / {p.bed !== "--" ? p.bed : "—"}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 10px" }}><strong>Claim ID :</strong> {p.claimId !== "--" ? p.claimId : "—"}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 10px" }}><strong>Panel :</strong> {p.admType === "Cashless" ? (p.tpa !== "--" ? p.tpa : "CASHLESS") : "CASH"}</td>
                </tr>
                <tr>
                  <td style={{ border: "1px solid #ccc", padding: "5px 10px" }}><strong>DOA &amp; Time :</strong> {p.admDate ? fmt(p.admDate) : "—"}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 10px" }}><strong>Contact No. :</strong> {p.phone !== "--" ? p.phone : "—"}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 10px" }}><strong>DOD &amp; Time :</strong> {p.dischargeDate ? fmt(p.dischargeDate) : "—"}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 10px" }}><strong>Status on Discharge :</strong> {p.dischargeStatus}</td>
                </tr>
              </tbody>
            </table>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12 }}>
              <thead>
                <tr style={{ background: "#f0f0f0" }}>
                  {["Sr No.", "Date", "CGHS Code", "Description", "Quantity", "Rate", "Amount"].map(h => (
                    <th key={h} style={{ border: "1px solid #000", padding: "6px 8px", fontSize: 11, textAlign: h === "Amount" || h === "Rate" ? "right" : "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {svcs.length === 0 ? (
                  <tr><td colSpan={7} style={{ border: "1px solid #ccc", padding: 20, textAlign: "center", color: "#999" }}>No services recorded</td></tr>
                ) : svcs.map((sv, i) => {
                  const amount = (parseFloat(sv.rate)||0) * (parseFloat(sv.qty)||1);
                  return (
                    <tr key={i}>
                      <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>{i+1}</td>
                      <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>{fmt(p.admDate)}</td>
                      <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>{sv.cghs||sv.type||"--"}</td>
                      <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>{sv.title||sv.type}</td>
                      <td style={{ border: "1px solid #ccc", padding: "5px 8px", textAlign: "center" }}>{sv.qty||1}</td>
                      <td style={{ border: "1px solid #ccc", padding: "5px 8px", textAlign: "right" }}>{parseFloat(sv.rate||0).toFixed(2)}</td>
                      <td style={{ border: "1px solid #ccc", padding: "5px 8px", textAlign: "right" }}>{amount.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
              <tbody>
                {[["Gross Total:", subtotal.toFixed(2)], ["Discount:", "- " + discount.toFixed(2)],
                  ["Advance:", (parseFloat(p.billingObj?.advance)||0).toFixed(2)],
                  ["Net Payable Amount:", grand.toFixed(2)]].map(([k, v]) => (
                  <tr key={k}>
                    <td style={{ border: "none", padding: "3px 8px", textAlign: "right", fontWeight: k.includes("Net") ? 900 : 700, fontSize: k.includes("Net") ? 13 : 11 }}>{k}</td>
                    <td style={{ border: "1px solid #ccc", padding: "3px 10px", textAlign: "right", fontWeight: k.includes("Net") ? 900 : 700, width: 120, fontSize: k.includes("Net") ? 13 : 11 }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 40 }}>
              <div style={{ textAlign: "center", minWidth: 160 }}>
                <div style={{ borderTop: "1px solid #000", paddingTop: 6, fontWeight: 700 }}>Cashier Signature</div>
              </div>
              <div style={{ textAlign: "center", minWidth: 160 }}>
                <div style={{ borderTop: "1px solid #000", paddingTop: 6, fontWeight: 700 }}>Patient / Attendant Signature</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   DISCHARGE SUMMARY PRINT MODAL
══════════════════════════════════════════════════════════════ */
export function DischargeSummaryPrintModal({ p, branchKey, onClose }) {
  const T = useT();
  const [docTemplate, setDocTemplate] = useState(null);
  const [docLoading, setDocLoading] = useState(false);

  useEffect(() => {
    if (!p) return;
    const load = async () => {
      setDocLoading(true);
      try {
        const res = await apiService.getDynamicSummary(p.uhid, p.admNo, p.dischargeStatus || "NORMAL");
        let content = res.content;
        if (content && content.sections && !Array.isArray(content.sections)) {
          content.sections = Object.entries(content.sections).map(([k, v]) => ({ key: k, ...v }));
        }
        setDocTemplate(content);
      } catch (err) {
        toast.error("Failed to load discharge summary from server.");
      }
      setDocLoading(false);
    };
    load();
  }, [p]);

  if (!p) return null;

  const col = bColor(branchKey || p._branch, T);

  const handleSave = async () => {
    if (!docTemplate) return;
    try {
      await apiService.saveDynamicSummary(p.uhid, p.admNo, {
        summary_type: (p.dischargeStatus || "NORMAL").toUpperCase(),
        content: docTemplate,
      });
      toast.success("Discharge summary saved!");
    } catch { toast.error("Failed to save."); }
  };

  const handlePrint = () => {
    window.open(`${BASE_URL}/patients/${p.uhid}/admissions/${p.admNo}/dynamic-summary/print/`, "_blank");
  };

  const updateSection = (idx, val) => {
    const s = [...docTemplate.sections];
    s[idx] = { ...s[idx], value: val };
    setDocTemplate({ ...docTemplate, sections: s });
  };
  const updateVital = (idx, vKey, val) => {
    const s = [...docTemplate.sections];
    s[idx] = { ...s[idx], value: { ...s[idx].value, [vKey]: val } };
    setDocTemplate({ ...docTemplate, sections: s });
  };

  const inp = { width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.border2}`, background: T.bg, color: T.white, fontSize: 13, outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 4500, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: T.surface, borderRadius: 16, width: "100%", maxWidth: 860, maxHeight: "94vh", overflow: "hidden", display: "flex", flexDirection: "column", border: `1px solid ${T.border}`, boxShadow: "0 32px 100px rgba(0,0,0,.8)" }}>
        <div style={{ padding: "14px 22px", borderBottom: `1px solid ${T.border}`, background: T.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: T.white }}>Official Discharge Summary</div>
            <div style={{ fontSize: 12, color: T.dim, marginTop: 3, display: "flex", gap: 8 }}>
              <span>{p.name}</span>·<span>{p.uhid}</span>
              <Pill color={col}>{bName(branchKey || p._branch)}</Pill>
              <Pill color={T.amber}>{p.dischargeStatus}</Pill>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {docTemplate && (
              <>
                <button onClick={handleSave} style={{ padding: "8px 16px", borderRadius: 8, background: T.green, color: "#000", border: "none", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>
                  💾 Save
                </button>
                <button onClick={handlePrint} style={{ padding: "8px 16px", borderRadius: 8, background: T.laxmi, color: "#000", border: "none", fontWeight: 800, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                  <Printer size={13} /> Print
                </button>
              </>
            )}
            <button onClick={onClose} style={{ background: "rgba(255,255,255,.08)", border: "none", color: T.white, width: 34, height: 34, borderRadius: 8, cursor: "pointer", fontSize: 16 }}>✕</button>
          </div>
        </div>
        <div style={{ overflowY: "auto", padding: 24 }}>
          {docLoading ? (
            <div style={{ textAlign: "center", padding: 60 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
              <div style={{ color: T.dim, fontSize: 14 }}>Loading discharge summary from server...</div>
            </div>
          ) : !docTemplate ? (
            <div style={{ textAlign: "center", padding: 60 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
              <div style={{ color: T.dim, fontSize: 14 }}>Could not load the document template.</div>
              <button onClick={async () => {
                setDocLoading(true);
                try {
                  const res = await apiService.getDynamicSummary(p.uhid, p.admNo, p.dischargeStatus || "NORMAL");
                  let content = res.content;
                  if (content?.sections && !Array.isArray(content.sections)) {
                    content.sections = Object.entries(content.sections).map(([k, v]) => ({ key: k, ...v }));
                  }
                  setDocTemplate(content);
                } catch { toast.error("Still failing — check backend."); }
                setDocLoading(false);
              }} style={{ marginTop: 14, padding: "9px 20px", borderRadius: 8, background: T.laxmi, color: "#000", border: "none", fontWeight: 800, cursor: "pointer" }}>
                Retry
              </button>
            </div>
          ) : (
            <>
              <div style={{ background: T.card, borderRadius: 10, padding: "14px 18px", marginBottom: 20, border: `1px solid ${col}30`, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                {[["Patient", p.name], ["UHID", p.uhid], ["Age / Gender", `${p.age} / ${p.gender}`], ["Doctor", p.doctor],
                  ["Ward", p.ward], ["Bed", p.bed], ["Admitted", fmt(p.admDate)], ["Discharged", p.dischargeDate ? fmt(p.dischargeDate) : "—"],
                  ["Diagnosis", p.diagnosis], ["Status", p.dischargeStatus], ["Payment", p.paymentMode], ["Type", p.admType]
                ].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: 10, color: T.dim, fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>{k}</div>
                    <div style={{ fontSize: 12, color: T.white, fontWeight: 600 }}>{v || "--"}</div>
                  </div>
                ))}
              </div>
              {Array.isArray(docTemplate.sections) && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {docTemplate.sections.map((sec, idx) => {
                    if (sec.type === "textarea") return (
                      <div key={sec.key || idx}>
                        <label style={{ fontSize: 11, color: T.dim, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", display: "block", marginBottom: 5 }}>{sec.label}</label>
                        <textarea value={sec.value || ""} onChange={e => updateSection(idx, e.target.value)} rows={3} style={{ ...inp, resize: "vertical" }} />
                      </div>
                    );
                    if (sec.type === "text") return (
                      <div key={sec.key || idx}>
                        <label style={{ fontSize: 11, color: T.dim, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", display: "block", marginBottom: 5 }}>{sec.label}</label>
                        <input type="text" value={sec.value || ""} onChange={e => updateSection(idx, e.target.value)} style={inp} />
                      </div>
                    );
                    if (sec.type === "vitals_grid") return (
                      <div key={sec.key || idx} style={{ background: T.bg, border: `1px solid ${T.border2}`, padding: 16, borderRadius: 8 }}>
                        <div style={{ fontSize: 11, color: T.dim, fontWeight: 700, textTransform: "uppercase", marginBottom: 12 }}>{sec.label}</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                          {Object.entries(sec.value || {}).map(([vKey, vVal]) => (
                            <div key={vKey}>
                              <div style={{ fontSize: 10, color: T.dim, textTransform: "uppercase", marginBottom: 4 }}>{vKey}</div>
                              <input type="text" value={vVal || ""} onChange={e => updateVital(idx, vKey, e.target.value)}
                                style={{ width: "100%", padding: "8px", borderRadius: 6, background: T.card, border: `1px solid ${T.border2}`, color: T.white, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                    return null;
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PATIENT DETAIL MODAL  ← Official Discharge section REMOVED
══════════════════════════════════════════════════════════════ */
function PatientModal({ p, onClose }) {
  const T = useT();
  const [editSvcs, setEditSvcs] = useState(null);
  const [showBillPrint, setShowBillPrint] = useState(false);
  const [showDischargePrint, setShowDischargePrint] = useState(false);

  if (!p) return null;
  const svcs = editSvcs || p.services || [];
  const upd = (i, field, val) => setEditSvcs((editSvcs || p.services || []).map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  const subtotal = svcs.reduce((s, sv) => s + (parseFloat(sv.rate)||0) * (parseFloat(sv.qty)||1), 0);
  const discount = parseFloat(p.billingObj?.discount) || 0;
  const grand = subtotal - discount;
  const col = bColor(p._branch, T);

  const PT_COLS = [
    { label: "UHID", key: "uhid" }, { label: "Patient", key: "name" }, { label: "Branch", get: r => bName(r._branch) },
    { label: "Gender", key: "gender" }, { label: "Age", key: "age" }, { label: "Phone", key: "phone" },
    { label: "Blood Group", key: "bloodGroup" }, { label: "Address", key: "address" },
    { label: "Doctor", key: "doctor" }, { label: "Ward", key: "ward" }, { label: "Bed", key: "bed" },
    { label: "Department", key: "department" }, { label: "Diagnosis", key: "diagnosis" },
    { label: "Adm Date", get: r => fmt(r.admDate) }, { label: "Discharge Date", get: r => fmt(r.dischargeDate) },
    { label: "Status", key: "dischargeStatus" }, { label: "Payment Mode", key: "paymentMode" },
    { label: "Grand Total", key: "grand" }, { label: "Paid", key: "paid" }, { label: "Pending", key: "pending" },
    { label: "TPA", key: "tpa" }, { label: "TPA Card", key: "tpaCard" },
  ];

  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ background: T.surface, borderRadius: 20, width: "100%", maxWidth: 860, maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 32px 100px rgba(0,0,0,.7)", border: `1px solid ${T.border}` }}>

          {/* ── Header ── */}
          <div style={{ padding: "18px 24px", borderBottom: `1px solid ${T.border}`, background: T.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: col+"20", border: `1.5px solid ${col}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🧑</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: T.white }}>{p.name}</div>
                <div style={{ fontSize: 12, color: T.dim, display: "flex", gap: 8, alignItems: "center", marginTop: 2 }}>
                  <span>{p.uhid}</span><span>Adm #{p.admNo}</span>
                  <Pill color={col}>{bName(p._branch)}</Pill>
                  <Pill color={p.admType === "Cash" ? T.green : T.amber}>{p.admType}</Pill>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {p.dischargeStatus && p.dischargeStatus !== "Admitted" && (
                <button onClick={() => setShowDischargePrint(true)} style={{ padding: "6px 14px", borderRadius: 8, background: T.amber+"20", color: T.amber, border: `1px solid ${T.amber}44`, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                  <FileText size={13} /> Discharge Doc
                </button>
              )}
              <button onClick={() => setShowBillPrint(true)} style={{ padding: "6px 14px", borderRadius: 8, background: T.laxmi+"20", color: T.laxmi, border: `1px solid ${T.laxmi}44`, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                <Printer size={13} /> Print Bill
              </button>
              <XlsBtn onClick={() => exportXLSX([p], PT_COLS, `${p.uhid}_adm${p.admNo}.xlsx`)} label="Download" />
              <button onClick={onClose} style={{ background: "rgba(255,255,255,.08)", border: "none", color: T.white, width: 34, height: 34, borderRadius: 8, cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
          </div>

          <div style={{ overflowY: "auto", padding: 24 }}>
            {/* Patient detail grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 20 }}>
              {[["Gender", p.gender], ["Age", p.age], ["Blood Group", p.bloodGroup], ["Phone", p.phone],
                ["Ward", p.ward], ["Bed / Room", p.bed + " / " + p.room], ["Department", p.department], ["Doctor", p.doctor],
                ["Admitted", fmt(p.admDate)], ["Discharged", p.dischargeDate ? fmt(p.dischargeDate) : "Still Admitted"],
                ["Diagnosis", p.diagnosis], ["Status", p.dischargeStatus],
                ["Payment Mode", p.paymentMode], ["Type", p.admType], ["TPA", p.tpa], ["Allergies", p.allergies],
              ].map(([k, v]) => (
                <div key={k} style={{ background: T.card, borderRadius: 8, padding: "8px 12px" }}>
                  <div style={{ fontSize: 10, color: T.dim, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 2 }}>{k}</div>
                  <div style={{ fontSize: 12, color: T.white, fontWeight: 600, wordBreak: "break-word" }}>{v || "--"}</div>
                </div>
              ))}
            </div>

            {/* Medical history (read-only summary) */}
            {p.medHistory && Object.values(p.medHistory).some(v => v) && (
              <div style={{ ...cardStyle(T), marginBottom: 18 }}>
                <STitle>Medical History</STitle>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {Object.entries(p.medHistory).filter(([, v]) => v).map(([k, v]) => (
                    <div key={k} style={{ background: T.bg, borderRadius: 8, padding: "9px 12px" }}>
                      <div style={{ fontSize: 10, color: T.dim, fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>{k.replace(/([A-Z])/g, " $1").trim()}</div>
                      <div style={{ fontSize: 13, color: T.white }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Services / bill section */}
            <div style={{ ...cardStyle(T), marginBottom: 18 }}>
              <STitle action={
                <div style={{ display: "flex", gap: 8 }}>
                  {editSvcs && (
                    <button onClick={() => setEditSvcs(null)} style={{ padding: "5px 12px", borderRadius: 7, background: "transparent", border: `1px solid ${T.border2}`, color: T.dim, fontSize: 12, cursor: "pointer" }}>Reset</button>
                  )}
                  <button onClick={() => setShowBillPrint(true)} style={{ padding: "5px 12px", borderRadius: 7, background: T.laxmi+"20", color: T.laxmi, border: `1px solid ${T.laxmi}44`, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                    <Printer size={12} /> Print Bill
                  </button>
                  <button onClick={() => alert("Save connected to your backend")} style={{ padding: "5px 12px", borderRadius: 7, background: T.green, color: "#000", border: "none", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>Save Changes</button>
                </div>
              }>Services and Bill (Editable Rates and Qty)</STitle>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead><tr>{["Service", "Type", "Rate", "Qty", "Amount"].map(h => <TH key={h} h={h} />)}</tr></thead>
                <tbody>
                  {svcs.map((sv, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: "8px 12px", color: T.white, fontWeight: 600 }}>{sv.title||sv.type}</td>
                      <td style={{ padding: "8px 12px" }}><Badge color={T.dim}>{sv.type}</Badge></td>
                      <td style={{ padding: "8px 12px" }}>
                        <input type="number" value={sv.rate} onChange={e => upd(i, "rate", e.target.value)}
                          style={{ width: 90, background: T.bg, border: `1px solid ${T.border2}`, borderRadius: 6, color: T.white, padding: "4px 8px", fontSize: 13, outline: "none", textAlign: "right" }} />
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        <input type="number" value={sv.qty} onChange={e => upd(i, "qty", e.target.value)}
                          style={{ width: 60, background: T.bg, border: `1px solid ${T.border2}`, borderRadius: 6, color: T.white, padding: "4px 8px", fontSize: 13, outline: "none", textAlign: "right" }} />
                      </td>
                      <td style={{ padding: "8px 12px", fontWeight: 800, color: T.amber }}>{inr((parseFloat(sv.rate)||0)*(parseFloat(sv.qty)||1))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
                {[["Subtotal", inr(subtotal), T.white], ["Discount", "-"+inr(discount), T.red],
                  ["Advance", inr(parseFloat(p.billingObj?.advance)||0), T.green],
                  ["Paid Now", inr(p.paid), T.green]].map(([k, v, c]) => (
                  <div key={k} style={{ fontSize: 12, color: T.dim }}>{k}: <strong style={{ color: c }}>{v}</strong></div>
                ))}
                <div style={{ fontSize: 16, fontWeight: 900, color: T.amber, marginTop: 4 }}>Grand Total: {inr(grand)}</div>
                {p.pending > 0 && <div style={{ fontSize: 13, fontWeight: 800, color: T.red }}>Pending: {inr(p.pending)}</div>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showBillPrint && <BillPrintModal p={{ ...p, subtotal, discount, grand }} onClose={() => setShowBillPrint(false)} />}
      {showDischargePrint && <DischargeSummaryPrintModal p={p} branchKey={p._branch} onClose={() => setShowDischargePrint(false)} />}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   PATIENT TABLE
══════════════════════════════════════════════════════════════ */
const PT_COLS = [
  { label: "UHID", key: "uhid" }, { label: "Patient", key: "name" }, { label: "Gender", key: "gender" },
  { label: "Age", key: "age" }, { label: "Phone", key: "phone" }, { label: "Branch", get: r => bName(r._branch) },
  { label: "Type", key: "admType" }, { label: "Doctor", key: "doctor" }, { label: "Ward", key: "ward" },
  { label: "Department", key: "department" }, { label: "Adm Date", get: r => fmt(r.admDate) },
  { label: "Discharge Date", get: r => fmt(r.dischargeDate) }, { label: "Diagnosis", key: "diagnosis" },
  { label: "Status", key: "dischargeStatus" }, { label: "Grand Total", key: "grand" },
  { label: "Paid", key: "paid" }, { label: "Pending", key: "pending" }, { label: "Payment Mode", key: "paymentMode" },
  { label: "TPA", key: "tpa" },
];

function PTable({ rows, showBranch, filename }) {
  const T = useT();
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState("");
  const [typeF, setTypeF] = useState("all");

  const filtered = rows.filter(p => {
    if (typeF === "cash" && p.admType !== "Cash") return false;
    if (typeF === "cashless" && p.admType !== "Cashless") return false;
    if (search && ![p.name, p.uhid, p.doctor, p.diagnosis].some(v => v?.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  return (
    <>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        <FilterSelect value={typeF} onChange={setTypeF} options={[["all", "All Types"], ["cash", "Cash Patients"], ["cashless", "Cashless / TPA"]]} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, UHID, doctor, diagnosis..." style={{ marginLeft: "auto", padding: "7px 13px", borderRadius: 8, border: `1px solid ${T.border2}`, background: T.card, color: T.white, fontSize: 13, outline: "none", width: 270 }} />
        <XlsBtn onClick={() => exportXLSX(filtered, PT_COLS, filename || "patients.xlsx")} />
      </div>
      <div style={{ ...cardStyle(T), padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>
            {["#", "UHID", "Patient", "Type", showBranch && "Branch", "Doctor", "Ward", "Adm", "Discharge", "Diagnosis", "Grand", "Paid", "Pending", "Status", ""].filter(Boolean).map(h => <TH key={h} h={h} />)}
          </tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={15} style={{ padding: 48, textAlign: "center", color: T.dim }}>No records found</td></tr>}
            {filtered.map((p, i) => (
              <tr key={i} onClick={() => setModal(p)} style={{ borderBottom: `1px solid ${T.border}`, background: i%2===0 ? T.card : T.surface, cursor: "pointer" }}>
                <td style={{ padding: "9px 12px", color: T.dim, fontSize: 11 }}>{i+1}</td>
                <td style={{ padding: "9px 12px", fontSize: 12, fontWeight: 700, color: bColor(p._branch, T) }}>{p.uhid}</td>
                <td style={{ padding: "9px 12px" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: T.dim }}>{p.age} {p.gender}</div>
                </td>
                <td style={{ padding: "9px 12px" }}><Pill color={p.admType==="Cash" ? T.green : T.amber}>{p.admType}</Pill></td>
                {showBranch && <td style={{ padding: "9px 12px" }}><Pill color={bColor(p._branch, T)}>{bName(p._branch)}</Pill></td>}
                <td style={{ padding: "9px 12px", fontSize: 12, color: T.dim }}>{p.doctor}</td>
                <td style={{ padding: "9px 12px", fontSize: 11, color: T.dim }}>{p.ward} {p.bed}</td>
                <td style={{ padding: "9px 12px", fontSize: 11, color: T.dim }}>{fmt(p.admDate)}</td>
                <td style={{ padding: "9px 12px", fontSize: 11, color: p.dischargeDate ? T.green : T.amber }}>{p.dischargeDate ? fmt(p.dischargeDate) : "Admitted"}</td>
                <td style={{ padding: "9px 12px", fontSize: 11, color: T.dim, maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.diagnosis}</td>
                <td style={{ padding: "9px 12px", fontSize: 13, fontWeight: 800, color: T.amber }}>{inr(p.grand)}</td>
                <td style={{ padding: "9px 12px", fontSize: 12, fontWeight: 700, color: T.green }}>{inr(p.paid)}</td>
                <td style={{ padding: "9px 12px", fontSize: 12, color: p.pending>0 ? T.red : T.dim }}>{p.pending>0 ? inr(p.pending) : "--"}</td>
                <td style={{ padding: "9px 12px" }}><Badge color={p.dischargeStatus==="Recovered" ? T.green : p.dischargeStatus==="Admitted" ? T.laxmi : T.amber}>{p.dischargeStatus}</Badge></td>
                <td style={{ padding: "9px 12px" }}><button onClick={e => { e.stopPropagation(); setModal(p); }} style={{ padding: "4px 10px", borderRadius: 6, background: T.laxmi+"20", color: T.laxmi, border: `1px solid ${T.laxmi}40`, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PatientModal p={modal} onClose={() => setModal(null)} />
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   DASHBOARD TAB
══════════════════════════════════════════════════════════════ */
function DashboardTab({ all, laxmi, raya }) {
  const T = useT();
  const totalRev = all.reduce((s, p) => s + p.grand, 0);
  const lRev = laxmi.reduce((s, p) => s + p.grand, 0);
  const rRev = raya.reduce((s, p) => s + p.grand, 0);
  const pend = all.reduce((s, p) => s + p.pending, 0);
  const admitted = all.filter(p => !p.dischargeDate).length;
  const disch = all.filter(p => p.dischargeDate).length;
  const cash = all.filter(p => p.admType === "Cash").length;
  const cashless = all.filter(p => p.admType === "Cashless").length;

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <StatCard icon={Users} label="Total Patients" value={all.length} sub={admitted + " admitted / " + disch + " discharged"} color={T.laxmi} />
        <StatCard icon={Wallet} label="Total Revenue" value={inr(totalRev)} sub={pend > 0 ? inr(pend) + " pending" : "All collected"} color={T.green} />
        <StatCard icon={Hospital} label="Laxmi Nagar" value={laxmi.length} sub={inr(lRev)} color={T.laxmi} />
        <StatCard icon={Hotel} label="Raya" value={raya.length} sub={inr(rRev)} color={T.raya} />
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 22 }}>
        <StatCard icon={Stethoscope} label="Currently Admitted" value={admitted} sub="Active patients" color={T.amber} />
        <StatCard icon={DoorOpen} label="Discharged" value={disch} sub="Completed" color={T.green} />
        <StatCard icon={CreditCard} label="Cash Patients" value={cash} sub={Math.round(cash/Math.max(all.length,1)*100)+"%"} color={T.green} />
        <StatCard icon={Landmark} label="Cashless / TPA" value={cashless} sub={Math.round(cashless/Math.max(all.length,1)*100)+"%"} color={T.amber} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 22 }}>
        {[["laxmi", laxmi, T.laxmi], ["raya", raya, T.raya]].map(([br, pts, col]) => (
          <div key={br} style={{ ...cardStyle(T), borderTop: `3px solid ${col}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Pill color={col}>{bName(br)}</Pill>
              <span style={{ fontSize: 12, color: T.dim }}>Branch Summary</span>
            </div>
            {[["Total Admissions", pts.length], ["Admitted", pts.filter(p=>!p.dischargeDate).length],
              ["Discharged", pts.filter(p=>p.dischargeDate).length], ["Cash", pts.filter(p=>p.admType==="Cash").length],
              ["Cashless / TPA", pts.filter(p=>p.admType==="Cashless").length],
              ["Revenue", inr(pts.reduce((s,p)=>s+p.grand,0))], ["Collected", inr(pts.reduce((s,p)=>s+p.paid,0))],
              ["Pending", inr(pts.reduce((s,p)=>s+p.pending,0))],
              ["Avg Bill", inr(Math.round(pts.reduce((s,p)=>s+p.grand,0)/Math.max(pts.length,1)))],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 12, color: T.dim }}>{k}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.white }}>{v}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <STitle action={<XlsBtn onClick={() => exportXLSX(all, PT_COLS, "overview_all.xlsx")} />}>Recent Admissions — All Hospitals</STitle>
      <div style={{ ...cardStyle(T), padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["UHID", "Patient", "Branch", "Type", "Doctor", "Admitted", "Grand Total", "Status"].map(h => <TH key={h} h={h} />)}</tr></thead>
          <tbody>
            {all.slice(0, 12).map((p, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i%2===0 ? T.card : T.surface }}>
                <td style={{ padding: "9px 12px", fontSize: 12, fontWeight: 700, color: bColor(p._branch,T) }}>{p.uhid}</td>
                <td style={{ padding: "9px 12px", fontSize: 13, fontWeight: 600, color: T.white }}>{p.name}</td>
                <td style={{ padding: "9px 12px" }}><Pill color={bColor(p._branch,T)}>{bName(p._branch)}</Pill></td>
                <td style={{ padding: "9px 12px" }}><Pill color={p.admType==="Cash" ? T.green : T.amber}>{p.admType}</Pill></td>
                <td style={{ padding: "9px 12px", fontSize: 12, color: T.dim }}>{p.doctor}</td>
                <td style={{ padding: "9px 12px", fontSize: 11, color: T.dim }}>{fmt(p.admDate)}</td>
                <td style={{ padding: "9px 12px", fontSize: 13, fontWeight: 800, color: T.amber }}>{inr(p.grand)}</td>
                <td style={{ padding: "9px 12px" }}><Badge color={p.dischargeDate ? T.green : T.amber}>{p.dischargeDate ? "Discharged" : "Admitted"}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   BRANCH TAB
══════════════════════════════════════════════════════════════ */
function BranchTab({ pts, branch }) {
  const T = useT();
  const col = bColor(branch, T);
  const cash = pts.filter(p => p.admType === "Cash");
  const cl = pts.filter(p => p.admType === "Cashless");
  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <StatCard icon={Users} label="Total Patients" value={pts.length} sub={pts.filter(p=>!p.dischargeDate).length+" active"} color={col} />
        <StatCard icon={CreditCard} label="Cash" value={cash.length} sub={inr(cash.reduce((s,p)=>s+p.grand,0))} color={T.green} />
        <StatCard icon={Landmark} label="Cashless / TPA" value={cl.length} sub={inr(cl.reduce((s,p)=>s+p.grand,0))} color={T.amber} />
        <StatCard icon={Wallet} label="Revenue" value={inr(pts.reduce((s,p)=>s+p.grand,0))} sub={inr(pts.reduce((s,p)=>s+p.pending,0))+" pending"} color={col} />
      </div>
      <PTable rows={pts} showBranch={false} filename={branch+"_patients.xlsx"} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ALL PATIENTS TAB
══════════════════════════════════════════════════════════════ */
function AllPatientsTab({ all }) {
  const T = useT();
  const [branch, setBranch] = useState("all");
  const rows = branch === "all" ? all : all.filter(p => p._branch === branch);
  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <StatCard icon={Users} label="All Patients" value={all.length} color={T.laxmi} />
        <StatCard icon={Hospital} label="Laxmi Nagar" value={all.filter(p=>p._branch==="laxmi").length} color={T.laxmi} />
        <StatCard icon={Hotel} label="Raya" value={all.filter(p=>p._branch==="raya").length} color={T.raya} />
        <StatCard icon={Wallet} label="Combined Revenue" value={inr(all.reduce((s,p)=>s+p.grand,0))} color={T.green} />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <FilterSelect value={branch} onChange={setBranch} options={[["all","All Hospitals"],["laxmi","Lakshmi Nagar"],["raya","Raya"]]} />
      </div>
      <PTable rows={rows} showBranch={branch==="all"} filename="all_patients.xlsx" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   BILLING TAB
══════════════════════════════════════════════════════════════ */
function BillingTab({ all }) {
  const T = useT();
  const [branch, setBranch] = useState("all");
  const [typeF, setTypeF] = useState("all");
  const [modal, setModal] = useState(null);
  const [billPrint, setBillPrint] = useState(null);

  const rows = all.filter(p => {
    if (branch !== "all" && p._branch !== branch) return false;
    if (typeF === "cash" && p.admType !== "Cash") return false;
    if (typeF === "cashless" && p.admType !== "Cashless") return false;
    return true;
  });

  const BCOLS = [
    { label: "UHID", key: "uhid" }, { label: "Patient", key: "name" }, { label: "Branch", get: r => bName(r._branch) },
    { label: "Type", key: "admType" }, { label: "Doctor", key: "doctor" }, { label: "Date", get: r => fmt(r.admDate) },
    { label: "Subtotal", key: "subtotal" }, { label: "Discount", key: "discount" }, { label: "Advance", key: "advance" },
    { label: "Grand Total", key: "grand" }, { label: "Paid", key: "paid" }, { label: "Pending", key: "pending" },
    { label: "Payment Mode", key: "paymentMode" }, { label: "TPA", key: "tpa" },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <StatCard icon={Wallet} label="Collected" value={inr(rows.reduce((s,p)=>s+p.paid,0))} color={T.green} />
        <StatCard icon={ClipboardList} label="Grand Total" value={inr(rows.reduce((s,p)=>s+p.grand,0))} color={T.amber} />
        <StatCard icon={AlertTriangle} label="Pending Dues" value={inr(rows.reduce((s,p)=>s+p.pending,0))} color={T.red} />
        <StatCard icon={CreditCard} label="Records" value={rows.length} color={T.laxmi} />
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        <FilterSelect value={branch} onChange={setBranch} options={[["all","All Hospitals"],["laxmi","Lakshmi Nagar"],["raya","Raya"]]} />
        <FilterSelect value={typeF} onChange={setTypeF} options={[["all","All Types"],["cash","Cash"],["cashless","Cashless / TPA"]]} />
        <XlsBtn onClick={() => exportXLSX(rows, BCOLS, "billing_all.xlsx")} />
      </div>
      <div style={{ ...cardStyle(T), padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["UHID","Patient","Branch","Type","Doctor","Date","Grand","Paid","Pending","Mode","Actions"].map(h => <TH key={h} h={h} />)}</tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={11} style={{ padding: 48, textAlign: "center", color: T.dim }}>No records</td></tr>}
            {rows.map((p, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i%2===0 ? T.card : T.surface }}>
                <td style={{ padding: "9px 12px", fontSize: 12, fontWeight: 700, color: bColor(p._branch,T) }}>{p.uhid}</td>
                <td style={{ padding: "9px 12px" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: T.dim }}>{p.age} {p.gender}</div>
                </td>
                <td style={{ padding: "9px 12px" }}><Pill color={bColor(p._branch,T)}>{bName(p._branch)}</Pill></td>
                <td style={{ padding: "9px 12px" }}><Pill color={p.admType==="Cash" ? T.green : T.amber}>{p.admType}</Pill></td>
                <td style={{ padding: "9px 12px", fontSize: 12, color: T.dim }}>{p.doctor}</td>
                <td style={{ padding: "9px 12px", fontSize: 11, color: T.dim }}>{fmt(p.admDate)}</td>
                <td style={{ padding: "9px 12px", fontSize: 13, fontWeight: 800, color: T.amber }}>{inr(p.grand)}</td>
                <td style={{ padding: "9px 12px", fontSize: 12, fontWeight: 700, color: T.green }}>{inr(p.paid)}</td>
                <td style={{ padding: "9px 12px", fontSize: 12, color: p.pending>0 ? T.red : T.dim }}>{p.pending>0 ? inr(p.pending) : "--"}</td>
                <td style={{ padding: "9px 12px", fontSize: 11, color: T.dim }}>{p.paymentMode}</td>
                <td style={{ padding: "9px 12px" }}>
                  <div style={{ display: "flex", gap: 5 }}>
                    <button onClick={() => setModal(p)} style={{ padding: "4px 9px", borderRadius: 6, background: T.laxmi+"20", color: T.laxmi, border: `1px solid ${T.laxmi}40`, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Edit</button>
                    <button onClick={() => setBillPrint(p)} style={{ padding: "4px 9px", borderRadius: 6, background: T.green+"20", color: T.green, border: `1px solid ${T.green}40`, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                      <Printer size={11} /> Print
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PatientModal p={modal} onClose={() => setModal(null)} />
      {billPrint && <BillPrintModal p={billPrint} onClose={() => setBillPrint(null)} />}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MEDICAL HISTORY TAB
══════════════════════════════════════════════════════════════ */
function MedicalTab({ all }) {
  const T = useT();
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [medData, setMedData] = useState({});
  const [loading, setLoading] = useState(false);
  const [branch, setBranch] = useState("all");
  const [search, setSearch] = useState("");

  const rows = all.filter(p => {
    if (branch !== "all" && p._branch !== branch) return false;
    if (search && ![p.name, p.uhid].some(v => v?.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const handleOpenPatient = async (p) => {
    setSelectedPatient(p);
    setLoading(true);
    try {
      const data = await apiService.getMedicalHistory(p.uhid, p.admNo);
      setMedData(data || {});
    } catch { setMedData(p.medHistory || {}); }
    setLoading(false);
  };

  const handleSaveMedData = async () => {
    if (!selectedPatient) return;
    try {
      await apiService.saveMedicalHistory(selectedPatient.uhid, selectedPatient.admNo, medData);
      toast.success("Medical history saved!");
      setSelectedPatient(null);
    } catch { toast.error("Failed to save medical history."); }
  };

  if (selectedPatient) {
    if (loading) return (
      <div style={{ ...cardStyle(T), textAlign: "center", padding: 60 }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
        <div style={{ color: T.dim }}>Loading medical history for {selectedPatient.name}...</div>
      </div>
    );
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <button onClick={() => setSelectedPatient(null)} style={{ padding: "7px 16px", borderRadius: 8, background: T.bg, border: `1px solid ${T.border2}`, color: T.dim, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>← Back to List</button>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.white }}>{selectedPatient.name} — {selectedPatient.uhid}</div>
          <Pill color={bColor(selectedPatient._branch, T)}>{bName(selectedPatient._branch)}</Pill>
        </div>
        <MedicalHistoryPage data={medData} setData={setMedData} onSave={handleSaveMedData} onSkip={() => setSelectedPatient(null)} patient={selectedPatient._patient} discharge={selectedPatient._admission?.discharge} locId={selectedPatient._branch} />
      </div>
    );
  }

  const withMed = all.filter(p => p.medHistory && Object.values(p.medHistory).some(v => v));
  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <StatCard icon={ClipboardList} label="With Medical History" value={withMed.length} sub={"of "+all.length+" total"} color={T.laxmi} />
        <StatCard icon={Hospital} label="Laxmi Nagar" value={withMed.filter(p=>p._branch==="laxmi").length} color={T.laxmi} />
        <StatCard icon={Hotel} label="Raya" value={withMed.filter(p=>p._branch==="raya").length} color={T.raya} />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
        <FilterSelect value={branch} onChange={setBranch} options={[["all","All Hospitals"],["laxmi","Lakshmi Nagar"],["raya","Raya"]]} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or UHID..." style={{ marginLeft: "auto", padding: "7px 13px", borderRadius: 8, border: `1px solid ${T.border2}`, background: T.card, color: T.white, fontSize: 13, outline: "none", width: 240 }} />
      </div>
      <div style={{ ...cardStyle(T), padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["UHID","Patient","Branch","Doctor","Adm Date","Diagnosis","History Status",""].map(h => <TH key={h} h={h} />)}</tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={8} style={{ padding: 48, textAlign: "center", color: T.dim }}>No records found</td></tr>}
            {rows.map((p, i) => {
              const hasMed = p.medHistory && Object.values(p.medHistory).some(v => v);
              return (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i%2===0 ? T.card : T.surface }}>
                  <td style={{ padding: "9px 12px", fontSize: 12, fontWeight: 700, color: bColor(p._branch,T) }}>{p.uhid}</td>
                  <td style={{ padding: "9px 12px" }}><div style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{p.name}</div><div style={{ fontSize: 10, color: T.dim }}>{p.age} {p.gender}</div></td>
                  <td style={{ padding: "9px 12px" }}><Pill color={bColor(p._branch,T)}>{bName(p._branch)}</Pill></td>
                  <td style={{ padding: "9px 12px", fontSize: 12, color: T.dim }}>{p.doctor}</td>
                  <td style={{ padding: "9px 12px", fontSize: 11, color: T.dim }}>{fmt(p.admDate)}</td>
                  <td style={{ padding: "9px 12px", fontSize: 11, color: T.dim, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.diagnosis}</td>
                  <td style={{ padding: "9px 12px" }}><Badge color={hasMed ? T.green : T.amber}>{hasMed ? "Filled" : "Not Filled"}</Badge></td>
                  <td style={{ padding: "9px 12px" }}><button onClick={() => handleOpenPatient(p)} style={{ padding: "4px 10px", borderRadius: 6, background: T.laxmi+"20", color: T.laxmi, border: `1px solid ${T.laxmi}40`, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{hasMed ? "Edit" : "Add"} History</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   DISCHARGE TAB
══════════════════════════════════════════════════════════════ */
function DischargeTab({ all }) {
  const T = useT();
  const disch = all.filter(p => p.dischargeDate);
  const [branch, setBranch] = useState("all");
  const [modal, setModal] = useState(null);
  const [dischargePrint, setDischargePrint] = useState(null);
  const rows = branch === "all" ? disch : disch.filter(p => p._branch === branch);

  const DCOLS = [
    { label: "UHID", key: "uhid" }, { label: "Patient", key: "name" }, { label: "Branch", get: r => bName(r._branch) },
    { label: "Doctor", key: "doctor" }, { label: "Department", key: "department" }, { label: "Diagnosis", key: "diagnosis" },
    { label: "Adm Date", get: r => fmt(r.admDate) }, { label: "Discharge Date (DOD)", get: r => fmt(r.dischargeDate) },
    { label: "Status", key: "dischargeStatus" }, { label: "Grand Total", key: "grand" }, { label: "Paid", key: "paid" },
    { label: "Pending", key: "pending" }, { label: "Type", key: "admType" },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <StatCard icon={DoorOpen} label="Total Discharges" value={disch.length} color={T.dim} />
        <StatCard icon={Hospital} label="Laxmi Nagar" value={disch.filter(p=>p._branch==="laxmi").length} color={T.laxmi} />
        <StatCard icon={Hotel} label="Raya" value={disch.filter(p=>p._branch==="raya").length} color={T.raya} />
        <StatCard icon={Wallet} label="Revenue" value={inr(disch.reduce((s,p)=>s+p.grand,0))} color={T.amber} />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
        <FilterSelect value={branch} onChange={setBranch} options={[["all","All Hospitals"],["laxmi","Lakshmi Nagar"],["raya","Raya"]]} />
        <XlsBtn onClick={() => exportXLSX(rows, DCOLS, "discharge_summary.xlsx")} />
      </div>
      <div style={{ ...cardStyle(T), padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["UHID","Patient","Branch","Type","Doctor","Department","Admitted","DOD","Diagnosis","Status","Billed","Actions"].map(h => <TH key={h} h={h} />)}</tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={12} style={{ padding: 48, textAlign: "center", color: T.dim }}>No discharges yet</td></tr>}
            {rows.map((p, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i%2===0 ? T.card : T.surface }}>
                <td style={{ padding: "9px 12px", fontSize: 12, fontWeight: 700, color: bColor(p._branch,T) }}>{p.uhid}</td>
                <td style={{ padding: "9px 12px", fontSize: 13, fontWeight: 600, color: T.white }}>{p.name}</td>
                <td style={{ padding: "9px 12px" }}><Pill color={bColor(p._branch,T)}>{bName(p._branch)}</Pill></td>
                <td style={{ padding: "9px 12px" }}><Pill color={p.admType==="Cash" ? T.green : T.amber}>{p.admType}</Pill></td>
                <td style={{ padding: "9px 12px", fontSize: 12, color: T.dim }}>{p.doctor}</td>
                <td style={{ padding: "9px 12px", fontSize: 12, color: T.dim }}>{p.department}</td>
                <td style={{ padding: "9px 12px", fontSize: 11, color: T.dim }}>{fmt(p.admDate)}</td>
                <td style={{ padding: "9px 12px", fontSize: 11, color: T.green, fontWeight: 700 }}>{fmt(p.dischargeDate)}</td>
                <td style={{ padding: "9px 12px", fontSize: 11, color: T.dim, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.diagnosis}</td>
                <td style={{ padding: "9px 12px" }}><Badge color={p.dischargeStatus==="Recovered" ? T.green : T.amber}>{p.dischargeStatus}</Badge></td>
                <td style={{ padding: "9px 12px", fontSize: 13, fontWeight: 800, color: T.amber }}>{inr(p.grand)}</td>
                <td style={{ padding: "9px 12px" }}>
                  <div style={{ display: "flex", gap: 5 }}>
                    <button onClick={() => setModal(p)} style={{ padding: "4px 10px", borderRadius: 6, background: T.laxmi+"20", color: T.laxmi, border: `1px solid ${T.laxmi}40`, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>View</button>
                    <button onClick={() => setDischargePrint(p)} style={{ padding: "4px 10px", borderRadius: 6, background: T.amber+"20", color: T.amber, border: `1px solid ${T.amber}40`, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                      <Printer size={11} /> Doc
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PatientModal p={modal} onClose={() => setModal(null)} />
      {dischargePrint && <DischargeSummaryPrintModal p={dischargePrint} branchKey={dischargePrint._branch} onClose={() => setDischargePrint(null)} />}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   LAB REPORTS TAB
══════════════════════════════════════════════════════════════ */
const LAB_TEST_COLORS = {
  HAEMATOLOGY: { color: "#dc2626", bg: "#fef2f2" },
  BIOCHEMISTRY: { color: "#2563eb", bg: "#eff6ff" },
  MICROBIOLOGY: { color: "#065f46", bg: "#ecfdf5" },
  "IMMUNOLOGY – SEROLOGY": { color: "#b45309", bg: "#fffbeb" },
  ENDOCRINOLOGY: { color: "#7c3aed", bg: "#f5f3ff" },
};

function LabReportsTab({ all }) {
  const T = useT();
  const [branch, setBranch] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [expandedReport, setExpandedReport] = useState(null);

  const rows = all.filter(p => {
    if (branch !== "all" && p._branch !== branch) return false;
    if (search && ![p.name, p.uhid].some(v => v?.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const fetchReports = async (p) => {
    setSelectedPatient(p);
    setReports([]);
    setLoadingReports(true);
    try {
      const data = await apiService.getLabReports(p.uhid, p.admNo);
      setReports(Array.isArray(data) ? data : []);
    } catch { toast.error("Failed to load lab reports."); setReports([]); }
    setLoadingReports(false);
  };

  const handlePrintReport = (report) => {
    const branchInfo = {
      laxmi: { name: "Lakshmi Nagar Branch", address: "Lakshmi Nagar, Mathura, UP", phone: "+91-9717444531" },
      raya:  { name: "Raya Branch", address: "Raya, Mathura, UP - 281204", phone: "+91-9311212090" },
    };
    const bi = branchInfo[selectedPatient?._branch] || branchInfo.laxmi;
    const dept = report.department || "PATHOLOGY";
    const deptStyle = LAB_TEST_COLORS[dept] || { color: "#333", bg: "#f9f9f9" };

    const fieldsHtml = Array.isArray(report.fields) ? report.fields.map(f => `
      <tr>
        <td style="padding:6px 10px;border:1px solid #ccc;font-size:12px">${f.name||f.label}</td>
        <td style="padding:6px 10px;border:1px solid #ccc;font-size:12px;font-weight:bold;color:${f.isAbnormal?"red":"#000"}">${f.value||"--"}</td>
        <td style="padding:6px 10px;border:1px solid #ccc;font-size:12px;color:#555">${f.unit||""}</td>
        <td style="padding:6px 10px;border:1px solid #ccc;font-size:12px;color:#555">${f.normal||""}</td>
      </tr>`).join("") : `<tr><td colspan="4" style="padding:10px;text-align:center;color:#999">No fields</td></tr>`;

    const html = `
<div style="display:flex;justify-content:space-between;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:12px">
  <div>
    <div style="font-size:28px;font-weight:900;color:#1a5b8c;letter-spacing:2px">SANGi</div>
    <div style="font-size:13px;font-weight:700;color:#d93838;letter-spacing:4px">HOSPITAL</div>
  </div>
  <div style="text-align:right;font-size:11px;color:#555">
    <div>${bi.name}</div><div>${bi.address}</div><div>Ph: ${bi.phone}</div>
  </div>
</div>
<div style="text-align:center;font-size:14px;font-weight:900;letter-spacing:1px;margin-bottom:10px">Department of Pathology</div>
<table style="margin-bottom:10px;font-size:11px">
  <tr><td style="padding:4px 8px;border:1px solid #ccc"><strong>Patient's Name:</strong> ${selectedPatient?.name||"--"}</td><td style="padding:4px 8px;border:1px solid #ccc"><strong>Referred by:</strong> SANGI HOSPITAL</td></tr>
  <tr><td style="padding:4px 8px;border:1px solid #ccc"><strong>Age/Sex:</strong> ${selectedPatient?.age||"--"} / ${selectedPatient?.gender?.toUpperCase()||"--"}</td><td style="padding:4px 8px;border:1px solid #ccc"><strong>Date:</strong> ${report.date||fmt(new Date())}</td></tr>
  <tr><td style="padding:4px 8px;border:1px solid #ccc"><strong>Patient ID:</strong> ${selectedPatient?.uhid||"--"}</td><td style="padding:4px 8px;border:1px solid #ccc"><strong>Sr. No.:</strong> ${report.srNo||"--"}</td></tr>
</table>
<div style="text-align:center;font-size:13px;font-weight:900;text-transform:uppercase;margin:10px 0;color:${deptStyle.color}">${dept}</div>
<div style="text-align:center;font-size:12px;font-weight:700;text-decoration:underline;margin-bottom:8px">${report.title||report.type||""}</div>
<table><thead><tr><th>Test Name</th><th>Value</th><th>Unit</th><th>Normal Value</th></tr></thead><tbody>${fieldsHtml}</tbody></table>
<div style="text-align:center;margin:20px 0;font-size:12px">***End Of The Report***</div>
<div style="display:flex;justify-content:space-between;margin-top:40px">
  <div><div style="border-top:1px solid #000;padding-top:5px;font-weight:700">TECHNOLOGIST</div></div>
  <div style="text-align:right"><div style="font-weight:700">Dr. Rakesh Koul</div><div style="font-size:11px;color:#555">(M.B.B.S. DCP)</div><div style="font-weight:700;border-top:1px solid #000;padding-top:5px;margin-top:30px">PATHOLOGIST</div></div>
</div>`;
    openPrintWindow(`Lab Report - ${selectedPatient?.name}`, html);
  };

  if (selectedPatient) {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={() => { setSelectedPatient(null); setReports([]); }} style={{ padding: "7px 16px", borderRadius: 8, background: T.bg, border: `1px solid ${T.border2}`, color: T.dim, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>← Back</button>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.white }}>{selectedPatient.name}</div>
            <div style={{ fontSize: 12, color: T.dim, display: "flex", gap: 8, marginTop: 2 }}>
              <span>{selectedPatient.uhid}</span>
              <Pill color={bColor(selectedPatient._branch, T)}>{bName(selectedPatient._branch)}</Pill>
              <span>{selectedPatient.age} {selectedPatient.gender}</span>
            </div>
          </div>
        </div>
        {loadingReports ? (
          <div style={{ ...cardStyle(T), textAlign: "center", padding: 60 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔬</div>
            <div style={{ color: T.dim }}>Loading lab reports...</div>
          </div>
        ) : reports.length === 0 ? (
          <div style={{ ...cardStyle(T), textAlign: "center", padding: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.white, marginBottom: 8 }}>No Lab Reports Found</div>
            <div style={{ fontSize: 13, color: T.dim }}>No lab reports are available for this patient admission.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {reports.map((report, i) => {
              const dept = report.department || "PATHOLOGY";
              const deptMeta = LAB_TEST_COLORS[dept] || { color: T.laxmi, bg: T.laxmi+"10" };
              const isExpanded = expandedReport === i;
              return (
                <div key={i} style={{ ...cardStyle(T), borderLeft: `4px solid ${deptMeta.color}`, padding: 0, overflow: "hidden" }}>
                  <div onClick={() => setExpandedReport(isExpanded ? null : i)} style={{ padding: "14px 18px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ background: deptMeta.bg, borderRadius: 8, padding: "6px 12px" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: deptMeta.color, textTransform: "uppercase", letterSpacing: ".06em" }}>{dept}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: T.white }}>{report.title||report.type}</div>
                        <div style={{ fontSize: 11, color: T.dim, marginTop: 2 }}>Date: {report.date||"--"} · Sr. No.: {report.srNo||"--"}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <button onClick={e => { e.stopPropagation(); handlePrintReport(report); }} style={{ padding: "5px 12px", borderRadius: 7, background: T.laxmi+"20", color: T.laxmi, border: `1px solid ${T.laxmi}44`, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                        <Printer size={11} /> Print
                      </button>
                      <span style={{ fontSize: 12, color: T.dim }}>{isExpanded ? "▲" : "▼"}</span>
                    </div>
                  </div>
                  {isExpanded && (
                    <div style={{ padding: "0 18px 18px", borderTop: `1px solid ${T.border}` }}>
                      {Array.isArray(report.fields) && report.fields.length > 0 ? (
                        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
                          <thead><tr>{["Test Name","Value","Unit","Normal Range"].map(h => <TH key={h} h={h} />)}</tr></thead>
                          <tbody>
                            {report.fields.map((f, fi) => (
                              <tr key={fi} style={{ borderBottom: `1px solid ${T.border}`, background: fi%2===0 ? T.card : T.surface }}>
                                <td style={{ padding: "8px 12px", fontSize: 12, color: T.white }}>{f.name||f.label}</td>
                                <td style={{ padding: "8px 12px", fontSize: 13, fontWeight: 800, color: f.isAbnormal ? T.red : T.green }}>{f.value||"--"}</td>
                                <td style={{ padding: "8px 12px", fontSize: 11, color: T.dim }}>{f.unit||"--"}</td>
                                <td style={{ padding: "8px 12px", fontSize: 11, color: T.dim }}>{f.normal||"--"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : report.narrative ? (
                        <div style={{ background: T.bg, borderRadius: 8, padding: 14, marginTop: 12, fontSize: 13, color: T.white, lineHeight: 1.7 }}>{report.narrative}</div>
                      ) : (
                        <div style={{ textAlign: "center", padding: "20px", color: T.dim, fontSize: 12 }}>No detailed fields available</div>
                      )}
                      {report.remarks && (
                        <div style={{ marginTop: 10, background: T.amber+"10", border: `1px solid ${T.amber}40`, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: T.amber }}>
                          <strong>Remarks:</strong> {report.remarks}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <StatCard icon={FlaskConical} label="Total Patients" value={all.length} sub="Select to view reports" color={T.laxmi} />
        <StatCard icon={Hospital} label="Laxmi Nagar" value={all.filter(p=>p._branch==="laxmi").length} color={T.laxmi} />
        <StatCard icon={Hotel} label="Raya" value={all.filter(p=>p._branch==="raya").length} color={T.raya} />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
        <FilterSelect value={branch} onChange={setBranch} options={[["all","All Hospitals"],["laxmi","Lakshmi Nagar"],["raya","Raya"]]} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or UHID..." style={{ marginLeft: "auto", padding: "7px 13px", borderRadius: 8, border: `1px solid ${T.border2}`, background: T.card, color: T.white, fontSize: 13, outline: "none", width: 240 }} />
      </div>
      <div style={{ ...cardStyle(T), padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["UHID","Patient","Branch","Age/Sex","Doctor","Adm Date","Diagnosis",""].map(h => <TH key={h} h={h} />)}</tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={8} style={{ padding: 48, textAlign: "center", color: T.dim }}>No records found</td></tr>}
            {rows.map((p, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i%2===0 ? T.card : T.surface }}>
                <td style={{ padding: "9px 12px", fontSize: 12, fontWeight: 700, color: bColor(p._branch,T) }}>{p.uhid}</td>
                <td style={{ padding: "9px 12px" }}><div style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{p.name}</div></td>
                <td style={{ padding: "9px 12px" }}><Pill color={bColor(p._branch,T)}>{bName(p._branch)}</Pill></td>
                <td style={{ padding: "9px 12px", fontSize: 11, color: T.dim }}>{p.age} / {p.gender}</td>
                <td style={{ padding: "9px 12px", fontSize: 12, color: T.dim }}>{p.doctor}</td>
                <td style={{ padding: "9px 12px", fontSize: 11, color: T.dim }}>{fmt(p.admDate)}</td>
                <td style={{ padding: "9px 12px", fontSize: 11, color: T.dim, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.diagnosis}</td>
                <td style={{ padding: "9px 12px" }}>
                  <button onClick={() => fetchReports(p)} style={{ padding: "5px 12px", borderRadius: 7, background: T.laxmi+"20", color: T.laxmi, border: `1px solid ${T.laxmi}44`, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                    <FlaskConical size={11} /> View Reports
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   REPORTS TAB
══════════════════════════════════════════════════════════════ */
function ReportsTab({ all }) {
  const T = useT();
  const [branch, setBranch] = useState("all");
  const base = branch === "all" ? all : all.filter(p => p._branch === branch);

  const REPORTS = [
    { title: "Complete Patient Register", icon: ClipboardList, desc: "All admissions with every detail", rows: base, cols: PT_COLS, file: "complete_register.xlsx" },
    { title: "Revenue Report", icon: Wallet, desc: "All billing and payment breakdown", rows: base, cols: [
        { label: "UHID", key: "uhid" }, { label: "Patient", key: "name" }, { label: "Branch", get: r => bName(r._branch) },
        { label: "Type", key: "admType" }, { label: "Doctor", key: "doctor" }, { label: "Date", get: r => fmt(r.admDate) },
        { label: "Subtotal", key: "subtotal" }, { label: "Discount", key: "discount" }, { label: "Advance", key: "advance" },
        { label: "Grand", key: "grand" }, { label: "Paid", key: "paid" }, { label: "Pending", key: "pending" },
        { label: "Mode", key: "paymentMode" }, { label: "TPA", key: "tpa" }], file: "revenue_report.xlsx" },
    { title: "Discharge Summary", icon: DoorOpen, desc: "All discharged patients with DOD", rows: base.filter(p=>p.dischargeDate), cols: [
        { label: "UHID", key: "uhid" }, { label: "Patient", key: "name" }, { label: "Branch", get: r => bName(r._branch) },
        { label: "Doctor", key: "doctor" }, { label: "Diagnosis", key: "diagnosis" },
        { label: "Adm Date", get: r => fmt(r.admDate) }, { label: "DOD", get: r => fmt(r.dischargeDate) },
        { label: "Status", key: "dischargeStatus" }, { label: "Grand", key: "grand" }], file: "discharge_summary.xlsx" },
    { title: "Cash Patients Report", icon: Wallet, desc: "Only cash payment patients", rows: base.filter(p=>p.admType==="Cash"), cols: [
        { label: "UHID", key: "uhid" }, { label: "Patient", key: "name" }, { label: "Branch", get: r => bName(r._branch) },
        { label: "Doctor", key: "doctor" }, { label: "Date", get: r => fmt(r.admDate) },
        { label: "Grand", key: "grand" }, { label: "Paid", key: "paid" }, { label: "Pending", key: "pending" },
        { label: "Mode", key: "paymentMode" }], file: "cash_patients.xlsx" },
    { title: "Cashless and TPA Report", icon: Landmark, desc: "Insurance and TPA patients only", rows: base.filter(p=>p.admType==="Cashless"), cols: [
        { label: "UHID", key: "uhid" }, { label: "Patient", key: "name" }, { label: "Branch", get: r => bName(r._branch) },
        { label: "Doctor", key: "doctor" }, { label: "TPA", key: "tpa" }, { label: "TPA Card", key: "tpaCard" },
        { label: "Date", get: r => fmt(r.admDate) }, { label: "Grand", key: "grand" }, { label: "Paid", key: "paid" }], file: "cashless_tpa.xlsx" },
    { title: "Pending Dues Report", icon: AlertTriangle, desc: "Patients with outstanding balance", rows: base.filter(p=>p.pending>0), cols: [
        { label: "UHID", key: "uhid" }, { label: "Patient", key: "name" }, { label: "Phone", key: "phone" },
        { label: "Branch", get: r => bName(r._branch) }, { label: "Doctor", key: "doctor" },
        { label: "Grand", key: "grand" }, { label: "Paid", key: "paid" }, { label: "Pending", key: "pending" },
        { label: "Mode", key: "paymentMode" }], file: "pending_dues.xlsx" },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <FilterSelect value={branch} onChange={setBranch} options={[["all","All Hospitals"],["laxmi","Lakshmi Nagar"],["raya","Raya"]]} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {REPORTS.map(r => (
          <div key={r.title} style={{ ...cardStyle(T), display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 28 }}>{r.icon ? <r.icon size={28} strokeWidth={1.9}/> : null}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.white }}>{r.title}</div>
            <div style={{ fontSize: 12, color: T.dim, flex: 1 }}>{r.desc}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.amber }}>{r.rows.length} records</span>
              <XlsBtn onClick={() => exportXLSX(r.rows, r.cols, r.file)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ADMIN MANAGEMENT TAB
══════════════════════════════════════════════════════════════ */
function AdminsTab() {
  const T = useT();
  const [users, setUsers] = useState([]);
  const [subTab, setSubTab] = useState("all");
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [search, setSearch] = useState("");

  const EMPTY_FORM = { id: "", name: "", password: "", confirmPassword: "", role: "office_admin", branch: "ALL" };
  const [form, setForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showEditPass, setShowEditPass] = useState(false);
  const [passErr, setPassErr] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const data = await apiService.getUsers();
      const formatted = data.map(u => ({
        ...u, id: u.id, username: u.username,
        name: `${u.first_name} ${u.last_name}`.trim() || u.username,
        role: u.role === "admin" ? "branch_admin" : u.role,
        branch: ["superadmin","office_admin"].includes(u.role) ? "ALL" : (u.branch==="LNM" ? "laxmi" : (u.branch==="RYM" ? "raya" : "ALL")),
        isActive: u.is_active, lastLogin: u.last_login,
      }));
      setUsers(formatted);
    } catch { setUsers([]); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter(u => {
    const matchSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.username?.toLowerCase().includes(search.toLowerCase()) || u.role?.toLowerCase().includes(search.toLowerCase());
    if (subTab === "active") return matchSearch && u.isActive !== false;
    if (subTab === "deactivated") return matchSearch && u.isActive === false;
    return matchSearch;
  });

  const officeAdmins = users.filter(u => u.role === "office_admin");
  const branchAdmins = users.filter(u => u.role === "branch_admin");
  const activeCount = users.filter(u => u.isActive !== false).length;
  const deactCount = users.filter(u => u.isActive === false).length;

  const sf = k => e => { setForm(f => ({ ...f, [k]: e.target.value })); setPassErr(""); };
  const sef = k => e => setEditForm(f => ({ ...f, [k]: e.target.value }));
  const handleRoleChange = val => setForm(f => ({ ...f, role: val, branch: val==="office_admin" ? "ALL" : (f.branch==="ALL" ? "laxmi" : f.branch) }));

  const handleCreate = async () => {
    if (!form.id||!form.name||!form.password) { toast.error("Fill all required fields"); return; }
    if (form.password !== form.confirmPassword) { setPassErr("Passwords do not match"); return; }
    const isOfficeAdmin = form.role === "office_admin";
    const backendRole = form.role === "branch_admin" ? "admin" : form.role;
    const branchCode = isOfficeAdmin ? "ALL" : (form.branch==="laxmi" ? "LNM" : "RYM");
    const nameParts = form.name.split(" ");
    const payload = { username: form.id, first_name: nameParts[0], last_name: nameParts.length>1 ? nameParts.slice(1).join(" ") : ".", password: form.password, confirm_password: form.password, role: backendRole, branch: branchCode, email: `${form.id}@sangihospital.com` };
    try {
      await apiService.createUser(payload);
      toast.success("User created successfully!");
      setCreateModal(false); setForm(EMPTY_FORM); fetchUsers();
    } catch (error) {
      const errData = error.response?.data;
      if (errData?.username) toast.error("Username: "+errData.username[0]);
      else if (errData?.password) toast.error("Password: "+errData.password[0]);
      else toast.error("Failed to create user.");
    }
  };

  const openEdit = (u) => { setEditForm({ name: u.name||"", role: u.role||"branch_admin", branch: u.branch||"laxmi", newPass: "", confirmNewPass: "" }); setEditModal(u); };

  const handleSaveEdit = async () => {
    if (!editForm.name) { toast.error("Name cannot be empty"); return; }
    if (editForm.newPass && editForm.newPass !== editForm.confirmNewPass) { toast.error("New passwords do not match"); return; }
    setLoading(true);
    const nameParts = editForm.name.split(" ");
    const backendRole = editForm.role === "branch_admin" ? "admin" : editForm.role;
    const branchCode = editForm.role === "office_admin" ? "ALL" : (editForm.branch==="laxmi" ? "LNM" : "RYM");
    const payload = { first_name: nameParts[0], last_name: nameParts.length>1 ? nameParts.slice(1).join(" ") : ".", role: backendRole, branch: branchCode, ...(editForm.newPass ? { password: editForm.newPass, confirm_password: editForm.newPass } : {}) };
    try {
      await apiService.updateUser(editModal.id, payload);
      toast.success("User updated successfully!"); setEditModal(null); fetchUsers();
    } catch { toast.error("Failed to update user."); } finally { setLoading(false); }
  };

  const handleToggleActive = async (u) => {
    setLoading(true);
    try {
      if (u.isActive === false) { await apiService.reactivateUser(u.id); toast.success(`${u.name} reactivated.`); }
      else { await apiService.deactivateUser(u.id); toast.success(`${u.name} deactivated.`); }
      setConfirmModal(null); fetchUsers();
    } catch { toast.error("Failed to update user status."); } finally { setLoading(false); }
  };

  const handleDelete = async (u) => {
    setLoading(true);
    try { await apiService.deleteUser(u.id); toast.success(`${u.name} permanently deleted.`); setConfirmModal(null); fetchUsers(); }
    catch { toast.error("Failed to delete user."); } finally { setLoading(false); }
  };

  const handleConfirm = () => {
    if (!confirmModal) return;
    if (confirmModal.type === "delete") handleDelete(confirmModal.user);
    else handleToggleActive(confirmModal.user);
  };

  const inputSt = { width: "100%", padding: "9px 13px", borderRadius: 8, border: `1px solid ${T.border2}`, background: T.card, color: T.white, fontSize: 13, outline: "none", boxSizing: "border-box" };
  const labelSt = { fontSize: 11, color: T.dim, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4, display: "block" };
  const btnSm = (bg, c, bdr) => ({ padding: "5px 12px", borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer", border: `1px solid ${bdr||bg}`, background: bg, color: c, whiteSpace: "nowrap" });

  const SubPill = ({ id, label, count }) => (
    <button onClick={() => setSubTab(id)} style={{ padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none", background: subTab===id ? T.laxmi : T.bg, color: subTab===id ? "#000" : T.dim, display: "flex", alignItems: "center", gap: 6 }}>
      {label}
      {count !== undefined && <span style={{ background: subTab===id ? "rgba(0,0,0,.2)" : T.dimmer, color: subTab===id ? "#000" : T.dim, borderRadius: 10, padding: "1px 7px", fontSize: 10, fontWeight: 900 }}>{count}</span>}
    </button>
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <StatCard icon={Users} label="Total Users" value={users.length} color={T.laxmi} />
        <StatCard icon={UserCog} label="Active" value={activeCount} sub="Can log in" color={T.green} />
        <StatCard icon={UserCog} label="Deactivated" value={deactCount} sub="Blocked from login" color={T.red} />
        <StatCard icon={UserCog} label="Office Admins" value={officeAdmins.length} sub="All hospitals" color={T.laxmi} />
        <StatCard icon={UserCog} label="Branch Admins" value={branchAdmins.length} sub="Single branch" color={T.raya} />
      </div>
      <div style={{ ...cardStyle(T), marginBottom: 18, display: "flex", gap: 24, flexWrap: "wrap", padding: "14px 20px" }}>
        {[["Office Admin",T.laxmi,"Global operational authority across all hospitals."],["Super Admin",T.amber,"Full system control across all hospitals."],["Branch Admin",T.raya,"Dedicated admin for one branch only."]].map(([label,color,desc]) => (
          <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <Pill color={color}>{label}</Pill>
            <div style={{ fontSize: 12, color: T.dim, maxWidth: 240 }}>{desc}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 4, background: T.bg, borderRadius: 22, padding: 3, border: `1px solid ${T.border}` }}>
          <SubPill id="all" label="All Users" count={users.length} />
          <SubPill id="active" label="Active" count={activeCount} />
          <SubPill id="deactivated" label="Deactivated" count={deactCount} />
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, username, role..." style={{ marginLeft: "auto", padding: "7px 13px", borderRadius: 8, border: `1px solid ${T.border2}`, background: T.card, color: T.white, fontSize: 12, outline: "none", width: 220 }} />
        <button onClick={() => setCreateModal(true)} style={{ padding: "8px 20px", borderRadius: 9, background: T.laxmi, color: "#000", border: "none", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>+ Create User</button>
      </div>
      <div style={{ ...cardStyle(T), padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["Username","Full Name","Role","Branch Access","Status","Last Login","Actions"].map(h => <TH key={h} h={h} />)}</tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={7} style={{ padding: 48, textAlign: "center", color: T.dim }}>{search ? "No users match your search" : "No users found"}</td></tr>}
            {filtered.map((u, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: u.isActive===false ? (i%2===0 ? T.bg+"cc" : T.surface+"cc") : (i%2===0 ? T.card : T.surface), opacity: u.isActive===false ? 0.7 : 1 }}>
                <td style={{ padding: "10px 12px", fontSize: 12, fontFamily: "monospace", color: T.laxmi }}>{u.username}</td>
                <td style={{ padding: "10px 12px" }}><div style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{u.name}</div></td>
                <td style={{ padding: "10px 12px" }}><Pill color={roleColor(u.role,T)}>{ROLE_LABELS[u.role]||u.role}</Pill></td>
                <td style={{ padding: "10px 12px" }}>
                  {isGlobalAccessUser(u) ? <Pill color={u.role==="superadmin" ? T.amber : T.laxmi}>{ALL_HOSPITALS_LABEL}</Pill> : u.branch ? <Pill color={bColor(u.branch,T)}>{bName(u.branch)}</Pill> : <span style={{ color: T.dim }}>--</span>}
                </td>
                <td style={{ padding: "10px 12px" }}><Badge color={u.isActive===false ? T.red : T.green}>{u.isActive===false ? "Deactivated" : "Active"}</Badge></td>
                <td style={{ padding: "10px 12px", fontSize: 11, color: T.dim }}>{u.lastLogin ? fmt(u.lastLogin) : "--"}</td>
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button onClick={() => openEdit(u)} style={btnSm(T.laxmi+"20", T.laxmi, T.laxmi+"44")}>✏ Edit</button>
                    {u.isActive===false
                      ? <button onClick={() => setConfirmModal({ type:"reactivate", user:u })} style={btnSm(T.green+"20",T.green,T.green+"44")}>▶ Activate</button>
                      : <button onClick={() => setConfirmModal({ type:"deactivate", user:u })} style={btnSm(T.amber+"18",T.amber,T.amber+"44")}>⏸ Deactivate</button>}
                    <button onClick={() => setConfirmModal({ type:"delete", user:u })} style={btnSm(T.red+"15",T.red,T.red+"44")}>🗑 Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CREATE MODAL */}
      {createModal && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.78)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center" }}>
          <div style={{ background:T.surface,borderRadius:16,padding:30,width:460,border:`1px solid ${T.border}`,boxShadow:SD,maxHeight:"90vh",overflowY:"auto" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
              <div style={{ fontSize:16,fontWeight:800,color:T.white }}>Create New User</div>
              <button onClick={() => setCreateModal(false)} style={{ background:"rgba(255,255,255,.07)",border:"none",color:T.white,width:30,height:30,borderRadius:7,cursor:"pointer",fontSize:14 }}>✕</button>
            </div>
            <div style={{ marginBottom:12 }}><label style={labelSt}>Username / ID <span style={{ color:T.red }}>*</span></label><input type="text" placeholder="admin_xyz" value={form.id} onChange={sf("id")} style={inputSt}/></div>
            <div style={{ marginBottom:12 }}><label style={labelSt}>Full Name <span style={{ color:T.red }}>*</span></label><input type="text" placeholder="Full Name" value={form.name} onChange={sf("name")} style={inputSt}/></div>
            {[["Password","password",showPass,()=>setShowPass(p=>!p)],["Confirm Password","confirmPassword",showConfirm,()=>setShowConfirm(p=>!p)]].map(([lbl,k,visible,toggle]) => (
              <div key={k} style={{ marginBottom:12 }}>
                <label style={labelSt}>{lbl} <span style={{ color:T.red }}>*</span></label>
                <div style={{ position:"relative" }}>
                  <input type={visible?"text":"password"} placeholder="••••••••" value={form[k]||""} onChange={sf(k)} style={{ ...inputSt,paddingRight:52 }}/>
                  <button type="button" onClick={toggle} style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#9ca3af",fontSize:11,fontWeight:600 }}>{visible?"HIDE":"SHOW"}</button>
                </div>
                {k==="confirmPassword" && passErr && <div style={{ color:T.red,fontSize:12,marginTop:4 }}>{passErr}</div>}
              </div>
            ))}
            <div style={{ marginBottom:12 }}>
              <label style={labelSt}>Role</label>
              <select value={form.role} onChange={e => handleRoleChange(e.target.value)} style={{ ...inputSt,cursor:"pointer" }}>
                <option value="office_admin">Office Admin (All Hospitals)</option>
                <option value="branch_admin">Branch Admin (Single Branch)</option>
              </select>
            </div>
            <div style={{ marginBottom:18 }}>
              <label style={labelSt}>Branch</label>
              {form.role==="office_admin" ? (
                <div style={{ padding:"9px 13px",borderRadius:8,border:`1px solid ${T.border}`,background:T.bg,color:T.dim,fontSize:13,display:"flex",gap:8 }}><Pill color={T.laxmi}>{ALL_HOSPITALS_LABEL}</Pill></div>
              ) : (
                <select value={form.branch} onChange={sf("branch")} style={{ ...inputSt,cursor:"pointer" }}><option value="laxmi">Lakshmi Nagar</option><option value="raya">Raya</option></select>
              )}
            </div>
            <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
              <button onClick={() => setCreateModal(false)} style={{ padding:"9px 18px",borderRadius:8,background:"transparent",border:`1px solid ${T.border2}`,color:T.dim,fontWeight:700,cursor:"pointer" }}>Cancel</button>
              <button onClick={handleCreate} disabled={loading} style={{ padding:"9px 18px",borderRadius:8,background:T.laxmi,color:"#000",border:"none",fontWeight:800,cursor:"pointer",opacity:loading?0.7:1 }}>{loading?"Creating...":"Create User"}</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModal && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.78)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center" }}>
          <div style={{ background:T.surface,borderRadius:16,padding:30,width:460,border:`1px solid ${T.border}`,boxShadow:SD,maxHeight:"90vh",overflowY:"auto" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
              <div style={{ fontSize:16,fontWeight:800,color:T.white }}>Edit User</div>
              <button onClick={() => setEditModal(null)} style={{ background:"rgba(255,255,255,.07)",border:"none",color:T.white,width:30,height:30,borderRadius:7,cursor:"pointer",fontSize:14 }}>✕</button>
            </div>
            <div style={{ fontSize:12,color:T.dim,marginBottom:20 }}>Editing: <strong style={{ color:T.laxmi,fontFamily:"monospace" }}>{editModal.id}</strong></div>
            <div style={{ marginBottom:12 }}><label style={labelSt}>Full Name <span style={{ color:T.red }}>*</span></label><input type="text" value={editForm.name} onChange={sef("name")} style={inputSt}/></div>
            <div style={{ marginBottom:12 }}>
              <label style={labelSt}>Role</label>
              <select value={editForm.role} onChange={e => setEditForm(f => ({ ...f,role:e.target.value,branch:e.target.value==="office_admin"?"ALL":(f.branch==="ALL"?"laxmi":f.branch) }))} style={{ ...inputSt,cursor:"pointer" }}>
                <option value="office_admin">Office Admin (All Hospitals)</option>
                <option value="branch_admin">Branch Admin (Single Branch)</option>
              </select>
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={labelSt}>Branch</label>
              {editForm.role==="office_admin" ? (
                <div style={{ padding:"9px 13px",borderRadius:8,border:`1px solid ${T.border}`,background:T.bg,display:"flex",gap:8 }}><Pill color={T.laxmi}>{ALL_HOSPITALS_LABEL}</Pill></div>
              ) : (
                <select value={editForm.branch} onChange={sef("branch")} style={{ ...inputSt,cursor:"pointer" }}><option value="laxmi">Lakshmi Nagar</option><option value="raya">Raya</option></select>
              )}
            </div>
            <div style={{ borderTop:`1px solid ${T.border}`,margin:"18px 0 14px",fontSize:11,color:T.dim,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",paddingTop:14 }}>
              Reset Password <span style={{ color:T.dimmer,textTransform:"none",fontWeight:400 }}>(leave blank to keep current)</span>
            </div>
            {[["New Password","newPass"],["Confirm New Password","confirmNewPass"]].map(([lbl,k]) => (
              <div key={k} style={{ marginBottom:12 }}>
                <label style={labelSt}>{lbl}</label>
                <div style={{ position:"relative" }}>
                  <input type={showEditPass?"text":"password"} placeholder="••••••••" value={editForm[k]||""} onChange={sef(k)} style={{ ...inputSt,paddingRight:52 }}/>
                  {k==="newPass" && <button type="button" onClick={() => setShowEditPass(p=>!p)} style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#9ca3af",fontSize:11,fontWeight:600 }}>{showEditPass?"HIDE":"SHOW"}</button>}
                </div>
              </div>
            ))}
            {editForm.newPass && editForm.newPass!==editForm.confirmNewPass && <div style={{ color:T.red,fontSize:12,marginBottom:10 }}>Passwords do not match</div>}
            <div style={{ display:"flex",gap:8,justifyContent:"flex-end",marginTop:18 }}>
              <button onClick={() => setEditModal(null)} style={{ padding:"9px 18px",borderRadius:8,background:"transparent",border:`1px solid ${T.border2}`,color:T.dim,fontWeight:700,cursor:"pointer" }}>Cancel</button>
              <button onClick={handleSaveEdit} disabled={loading} style={{ padding:"9px 18px",borderRadius:8,background:T.laxmi,color:"#000",border:"none",fontWeight:800,cursor:"pointer",opacity:loading?0.7:1 }}>{loading?"Saving...":"Save Changes"}</button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL */}
      {confirmModal && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.82)",zIndex:2100,display:"flex",alignItems:"center",justifyContent:"center" }}>
          <div style={{ background:T.surface,borderRadius:16,padding:28,width:400,border:`1px solid ${confirmModal.type==="delete"?T.red:confirmModal.type==="deactivate"?T.amber:T.green}44`,boxShadow:SD }}>
            <div style={{ textAlign:"center",marginBottom:16 }}>
              <div style={{ fontSize:44,marginBottom:8 }}>{confirmModal.type==="delete"?"🗑️":confirmModal.type==="deactivate"?"⏸️":"▶️"}</div>
              <div style={{ fontSize:16,fontWeight:900,color:T.white }}>{confirmModal.type==="delete"?"Permanently Delete User?":confirmModal.type==="deactivate"?"Deactivate User?":"Reactivate User?"}</div>
            </div>
            <div style={{ background:T.bg,borderRadius:10,padding:"12px 16px",marginBottom:20 }}>
              <div style={{ fontSize:13,fontWeight:700,color:T.white,marginBottom:4 }}>{confirmModal.user.name}</div>
              <div style={{ fontSize:12,color:T.dim,fontFamily:"monospace" }}>{confirmModal.user.username}</div>
              <div style={{ marginTop:8,fontSize:12,color:T.dim }}>
                {confirmModal.type==="delete"?"⚠️ This action is permanent and cannot be undone.":confirmModal.type==="deactivate"?"This will block the user from logging in.":"This will restore the user's login access."}
              </div>
            </div>
            <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
              <button onClick={() => setConfirmModal(null)} style={{ padding:"9px 18px",borderRadius:8,background:"transparent",border:`1px solid ${T.border2}`,color:T.dim,fontWeight:700,cursor:"pointer" }}>Cancel</button>
              <button onClick={handleConfirm} disabled={loading} style={{ padding:"9px 20px",borderRadius:8,border:"none",fontWeight:800,cursor:"pointer",opacity:loading?0.7:1,background:confirmModal.type==="delete"?T.red:confirmModal.type==="deactivate"?T.amber:T.green,color:confirmModal.type==="delete"?"#fff":"#000" }}>
                {loading?"Processing...":confirmModal.type==="delete"?"Yes, Delete":confirmModal.type==="deactivate"?"Yes, Deactivate":"Yes, Reactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   DEPARTMENTS TAB
══════════════════════════════════════════════════════════════ */
function DepartmentsTab({ all }) {
  const T = useT();
  const map = {};
  all.forEach(p => {
    const key = p._branch+"__"+p.department;
    if (!map[key]) map[key] = { branch:p._branch,dept:p.department,patients:0,revenue:0,doctors:new Set() };
    map[key].patients++;
    map[key].revenue += p.grand;
    if (p.doctor && p.doctor !== "--") map[key].doctors.add(p.doctor);
  });
  const depts = Object.values(map).map(d => ({ ...d, doctors:[...d.doctors] }));
  const allDepts = new Set(all.map(p => p.department)).size;

  return (
    <div>
      <div style={{ display:"flex",gap:12,flexWrap:"wrap",marginBottom:20 }}>
        <StatCard icon={Building2} label="Total Departments" value={allDepts} color={T.laxmi} />
        <StatCard icon={Hospital} label="Laxmi Nagar Depts" value={new Set(all.filter(p=>p._branch==="laxmi").map(p=>p.department)).size} color={T.laxmi} />
        <StatCard icon={Hotel} label="Raya Depts" value={new Set(all.filter(p=>p._branch==="raya").map(p=>p.department)).size} color={T.raya} />
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14 }}>
        {depts.map((d, i) => {
          const col = bColor(d.branch, T);
          return (
            <div key={i} style={{ ...cardStyle(T),borderTop:`3px solid ${col}` }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14 }}>
                <div>
                  <div style={{ fontSize:15,fontWeight:800,color:T.white }}>{d.dept}</div>
                  <div style={{ marginTop:5 }}><Pill color={col}>{bName(d.branch)}</Pill></div>
                </div>
                <div style={{ fontSize:24 }}>🏢</div>
              </div>
              {[["Total Patients",d.patients],["Doctors",d.doctors.length],["Total Revenue",inr(d.revenue)]].map(([k,v]) => (
                <div key={k} style={{ display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${T.border}` }}>
                  <span style={{ fontSize:12,color:T.dim }}>{k}</span>
                  <span style={{ fontSize:13,fontWeight:700,color:T.white }}>{v}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TASK PERFORMANCE TAB
══════════════════════════════════════════════════════════════ */
const DEPARTMENTS_PERF = ["Billing","Uploading","OPD","Query","Intimation"];
const DEPT_META = {
  Billing: { icon:CreditCard, color:"#FBBF24", desc:"Invoice generation, payment collection" },
  Uploading: { icon:Upload, color:"#38BDF8", desc:"Document uploads, report filing" },
  OPD: { icon:Stethoscope, color:"#34D399", desc:"Outpatient registration, scheduling" },
  Query: { icon:MessageCircle, color:"#A78BFA", desc:"Patient queries, information desk" },
  Intimation: { icon:Phone, color:"#FB923C", desc:"Insurance intimation, TPA coordination" },
};
const ratingMeta = (r) => {
  if (r>=5) return { label:"Excellent", color:"#34D399" };
  if (r>=4) return { label:"Good", color:"#4ADE80" };
  if (r>=3) return { label:"Average", color:"#FBBF24" };
  if (r>=2) return { label:"Below Avg", color:"#FB923C" };
  return { label:"Poor", color:"#F87171" };
};
const DEMO_PERFORMANCES = [
  { staffName:"Rahul Verma",staffId:"EMP002",branch:"laxmi",role:"Billing Staff",department:"Billing",task:"Invoice Generation",rating:4,reviewedBy:"Office Admin (Laxmi)",description:"Invoices raised accurately.",reason:"",date:"2026-04-15" },
  { staffName:"Suresh Patel",staffId:"EMP004",branch:"raya",role:"Billing Staff",department:"Billing",task:"Cashless Billing",rating:3,reviewedBy:"Office Admin (Raya)",description:"Two invoice discrepancies found.",reason:"",date:"2026-04-13" },
  { staffName:"Priya Nair",staffId:"EMP003",branch:"raya",role:"Billing Staff",department:"Billing",task:"Daily Collections",rating:5,reviewedBy:"Office Admin (Raya)",description:"Exceptional daily collection rate.",reason:"",date:"2026-04-14" },
  { staffName:"Meena Kapoor",staffId:"EMP005",branch:"laxmi",role:"Lab Technician",department:"Uploading",task:"Report Upload Accuracy",rating:5,reviewedBy:"Office Admin (Laxmi)",description:"All lab reports uploaded with zero errors.",reason:"",date:"2026-04-12" },
  { staffName:"Kavya Reddy",staffId:"EMP007",branch:"laxmi",role:"Nurse",department:"OPD",task:"Patient Registration",rating:5,reviewedBy:"Office Admin (Laxmi)",description:"Handled 62 OPD patients in a single shift.",reason:"",date:"2026-04-10" },
  { staffName:"Arjun Singh",staffId:"EMP006",branch:"raya",role:"Insurance Exec",department:"Intimation",task:"TPA Pre-Auth Processing",rating:2,reviewedBy:"Office Admin (Raya)",description:"Two pre-auth requests with incorrect ICD codes.",reason:"",date:"2026-04-11" },
];

function TaskPerformanceTab() {
  const T = useT();
  const [performances, setPerformances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [branchF, setBranchF] = useState("all");
  const [deptF, setDeptF] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try { const data = await apiService.getPerformanceRatings(); setPerformances(data || []); }
      catch { setPerformances(DEMO_PERFORMANCES); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const filtered = performances.filter(e => {
    if (branchF !== "all" && e.branch !== branchF) return false;
    if (deptF !== "all" && e.department !== deptF) return false;
    if (search && ![e.staffName, e.staffId, e.task, e.department].some(v => v?.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const overallAvg = filtered.length ? (filtered.reduce((s,e)=>s+e.rating,0)/filtered.length).toFixed(1) : "—";
  const laxmiEntries = performances.filter(e=>e.branch==="laxmi");
  const rayaEntries = performances.filter(e=>e.branch==="raya");
  const laxmiAvg = laxmiEntries.length ? (laxmiEntries.reduce((s,e)=>s+e.rating,0)/laxmiEntries.length).toFixed(1) : "—";
  const rayaAvg = rayaEntries.length ? (rayaEntries.reduce((s,e)=>s+e.rating,0)/rayaEntries.length).toFixed(1) : "—";
  const poorCount = performances.filter(e=>e.rating<=2).length;

  const PERF_COLS = [
    { label:"Staff Name",key:"staffName" }, { label:"Staff ID",key:"staffId" },
    { label:"Branch",get:r=>bName(r.branch) }, { label:"Role",key:"role" },
    { label:"Department",key:"department" }, { label:"Task",key:"task" },
    { label:"Rating",key:"rating" }, { label:"Label",get:r=>ratingMeta(r.rating).label },
    { label:"Description",key:"description" }, { label:"Reviewed By",key:"reviewedBy" },
    { label:"Date",get:r=>fmt(r.date) },
  ];

  return (
    <div>
      <div style={{ display:"flex",gap:12,flexWrap:"wrap",marginBottom:18 }}>
        <StatCard icon={Star} label="Overall Avg Rating" value={overallAvg} sub={performances.length+" total reviews"} color={T.amber} />
        <StatCard icon={Hospital} label="Laxmi Nagar Avg" value={laxmiAvg} sub="Branch average" color={T.laxmi} />
        <StatCard icon={Hotel} label="Raya Avg" value={rayaAvg} sub="Branch average" color={T.raya} />
        <StatCard icon={AlertTriangle} label="Poor Ratings (≤2)" value={poorCount} sub="Needs attention" color={poorCount>0?T.red:T.green} />
      </div>
      <div style={{ display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",marginBottom:14 }}>
        <FilterSelect value={branchF} onChange={setBranchF} options={[["all","All Hospitals"],["laxmi","Lakshmi Nagar"],["raya","Raya"]]} />
        <FilterSelect value={deptF} onChange={setDeptF} options={[["all","All Departments"],...DEPARTMENTS_PERF.map(d=>[d,d])]} />
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search staff, task, dept..." style={{ marginLeft:"auto",padding:"7px 13px",borderRadius:8,border:`1px solid ${T.border2}`,background:T.card,color:T.white,fontSize:13,outline:"none",width:210 }}/>
        <XlsBtn onClick={() => exportXLSX(filtered, PERF_COLS, "performance_ratings.xlsx")} />
      </div>
      {loading ? (
        <div style={{ ...cardStyle(T),textAlign:"center",padding:60,color:T.dim }}>Loading performance data...</div>
      ) : (
        <div style={{ ...cardStyle(T),padding:0,overflow:"hidden" }}>
          <table style={{ width:"100%",borderCollapse:"collapse" }}>
            <thead><tr>{["Staff","Branch","Dept","Task","Rating","Description","Reviewed By","Date"].map(h=><TH key={h} h={h}/>)}</tr></thead>
            <tbody>
              {filtered.length===0 && <tr><td colSpan={8} style={{ padding:48,textAlign:"center",color:T.dim }}>No performance records found</td></tr>}
              {filtered.map((e,i) => {
                const rm = ratingMeta(e.rating);
                const meta = DEPT_META[e.department] || { icon:FileText, color:T.dim };
                return (
                  <tr key={i} style={{ borderBottom:`1px solid ${T.border}`,background:i%2===0?T.card:T.surface }}>
                    <td style={{ padding:"9px 12px" }}>
                      <div style={{ fontSize:13,fontWeight:700,color:T.white }}>{e.staffName}</div>
                      <div style={{ fontSize:10,color:T.dim }}>{e.staffId} · {e.role}</div>
                    </td>
                    <td style={{ padding:"9px 12px" }}><Pill color={bColor(e.branch,T)}>{bName(e.branch)}</Pill></td>
                    <td style={{ padding:"9px 12px" }}><span style={{ fontSize:12,color:meta.color,fontWeight:700 }}>{e.department}</span></td>
                    <td style={{ padding:"9px 12px",fontSize:12,color:T.white }}>{e.task}</td>
                    <td style={{ padding:"9px 12px" }}>
                      <div style={{ display:"flex",alignItems:"center",gap:4 }}>
                        <span style={{ fontSize:16,fontWeight:900,color:rm.color }}>{e.rating}</span>
                        <StarRating rating={e.rating} size={11}/>
                      </div>
                      <Badge color={rm.color}>{rm.label}</Badge>
                    </td>
                    <td style={{ padding:"9px 12px",fontSize:11,color:T.dim,maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{e.description||"--"}</td>
                    <td style={{ padding:"9px 12px",fontSize:12,color:T.dim }}>{e.reviewedBy}</td>
                    <td style={{ padding:"9px 12px",fontSize:11,color:T.dim }}>{fmt(e.date)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════════════════ */
export default function SuperAdminDashboard({ db = {}, onLogout }) {
  const { isDark } = useTheme();
  // eslint-disable-next-line no-global-assign
  T = isDark ? T_DARK : T_LIGHT;
  const [tab, setTab] = useState("dashboard");

  const all   = useMemo(() => flattenDB(db, "all"),   [db]);
  const laxmi = useMemo(() => flattenDB(db, "laxmi"), [db]);
  const raya  = useMemo(() => flattenDB(db, "raya"),  [db]);

  const NAV = [
    { section:"Analytics" },
    { id:"dashboard",   icon:LayoutDashboard, label:"Dashboard" },
    { section:"Branches" },
    { id:"laxmi",       icon:Hospital,        label:"Lakshmi Nagar" },
    { id:"raya",        icon:Hotel,           label:"Raya" },
    { id:"allpatients", icon:Users,           label:"All Patients" },
    { section:"Finance" },
    { id:"billing",     icon:CreditCard,      label:"Billing and Invoices" },
    { section:"Medical" },
    { id:"medical",     icon:Stethoscope,     label:"Medical History" },
    { id:"discharge",   icon:DoorOpen,        label:"Discharge Summary" },
    { id:"labreports",  icon:FlaskConical,    label:"Lab Reports" },
    { section:"Management" },
    { id:"reports",     icon:FileDown,        label:"Reports and Export" },
    { id:"records",     icon:Upload,          label:"Update Records" },
    { id:"admins",      icon:UserCog,         label:"Admin Management" },
    { id:"departments", icon:Building2,       label:"Departments" },
    { id:"performance", icon:Star,            label:"Task Performance" },
  ];

  const activeLabel = NAV.find(n => n.id === tab);
  const ActiveIcon  = activeLabel?.icon;

  return (
    <TC.Provider value={T}>
      <div style={{ minHeight:"100vh", background:T.bg, fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
        {/* SIDEBAR */}
        <div style={{ width:228, minHeight:"100vh", background:T.sidebar, display:"flex", flexDirection:"column", position:"fixed", top:0, left:0, zIndex:50, borderRight:`1px solid ${T.border}` }}>
          <div style={{ padding:"18px 14px 14px", borderBottom:`1px solid ${T.border}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <img src="/app_icon.png" alt="logo" style={{ width:36, height:36, borderRadius:10, objectFit:"cover" }}/>
              <div>
                <div style={{ color:T.white, fontWeight:800, fontSize:13 }}>Sangi Hospital</div>
                <div style={{ color:T.dim, fontSize:10, textTransform:"uppercase", letterSpacing:".1em" }}>Super Admin Portal</div>
              </div>
            </div>
          </div>
          <div style={{ flex:1, overflowY:"auto", padding:"6px 6px" }}>
            {NAV.map((n, i) => {
              if (n.section) return <div key={i} style={{ fontSize:10, color:T.dimmer, fontWeight:700, textTransform:"uppercase", letterSpacing:".1em", padding:"12px 10px 4px" }}>{n.section}</div>;
              const active = tab === n.id;
              const Icon = n.icon;
              return (
                <button key={n.id} onClick={() => setTab(n.id)} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", borderRadius:9, border:"none", cursor:"pointer", width:"100%", textAlign:"left", marginBottom:1, background:active?"rgba(56,189,248,.12)":"transparent", color:active?T.laxmi:T.dim, fontWeight:active?700:400, fontSize:13, borderLeft:active?`3px solid ${T.laxmi}`:"3px solid transparent" }}>
                  <span style={{ fontSize:15 }}>{Icon ? <Icon size={15} strokeWidth={1.9}/> : null}</span>
                  <span style={{ flex:1 }}>{n.label}</span>
                </button>
              );
            })}
          </div>
          <div style={{ padding:"10px", borderTop:`1px solid ${T.border}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 11px", background:"rgba(255,255,255,.04)", borderRadius:9 }}>
              <div style={{ width:30, height:30, borderRadius:8, background:T.laxmi+"30", display:"flex", alignItems:"center", justifyContent:"center", color:T.laxmi, fontWeight:900, fontSize:13 }}>S</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, color:T.white, fontWeight:700 }}>Super Admin</div>
                <div style={{ fontSize:10, color:T.dim }}>All hospitals</div>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ marginLeft:228, flex:1, minHeight:"100vh", overflowX:"hidden" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 28px", borderBottom:`1px solid ${T.border}`, background:T.sidebar, position:"sticky", top:0, zIndex:40 }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.white, display:"inline-flex", alignItems:"center", gap:8 }}>
              {ActiveIcon ? <ActiveIcon size={14} strokeWidth={2}/> : null}
              {activeLabel?.label}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <ThemeModeDock variant="inline"/>
              <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.05)", borderRadius:20, padding:"3px 6px 3px 12px", border:`1px solid ${T.border}` }}>
                <span style={{ fontSize:11, color:T.dim, fontWeight:500 }}>Super Admin</span>
                <div style={{ width:28, height:28, borderRadius:"50%", background:T.laxmi+"30", display:"flex", alignItems:"center", justifyContent:"center", color:T.laxmi, fontWeight:900, fontSize:12 }}>S</div>
              </div>
              <button onClick={onLogout} style={{ background:"transparent", border:`1px solid ${T.border}`, color:T.dim, padding:"5px 13px", borderRadius:8, cursor:"pointer", fontSize:11, fontWeight:600, display:"flex", alignItems:"center", gap:5 }}>↪ Logout</button>
            </div>
          </div>
          <div style={{ padding:"18px 28px 4px" }}>
            <div style={{ fontSize:12, color:T.dim }}>
              {new Date().toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}
              {" · "}{all.length} total records · {laxmi.length} Laxmi Nagar · {raya.length} Raya
            </div>
          </div>
          <div style={{ padding:"16px 28px 28px" }}>
            {tab==="dashboard"   && <DashboardTab all={all} laxmi={laxmi} raya={raya}/>}
            {tab==="laxmi"       && <BranchTab pts={laxmi} branch="laxmi"/>}
            {tab==="raya"        && <BranchTab pts={raya} branch="raya"/>}
            {tab==="allpatients" && <AllPatientsTab all={all}/>}
            {tab==="billing"     && <BillingTab all={all}/>}
            {tab==="medical"     && <MedicalTab all={all}/>}
            {tab==="discharge"   && <DischargeTab all={all}/>}
            {tab==="labreports"  && <LabReportsTab all={all}/>}
            {tab==="reports"     && <ReportsTab all={all}/>}
            {tab==="records"     && <UpdateRecordsPanel roleLabel="Super Admin"/>}
            {tab==="admins"      && <AdminsTab/>}
            {tab==="departments" && <DepartmentsTab all={all}/>}
            {tab==="performance" && <TaskPerformanceTab/>}
          </div>
        </div>
      </div>
    </TC.Provider>
  );
}
