import React, { useState } from "react";
import { Printer, RefreshCw } from "lucide-react";
import { BASE_URL } from "../../../services/apiService";

const API_BASE = BASE_URL;

async function apiFetchBlob(path) {
  const token = sessionStorage.getItem("hms_token");
  const headers = { ...(token && { Authorization: `Bearer ${token}` }) };
  const res = await fetch(`${API_BASE}${path}`, { headers });
  if (!res.ok) throw new Error("Download failed");
  return res.blob();
}

const URL_MAP = {
  discharge_summary: (u, a) => `/patients/${u}/admissions/${a}/dynamic-summary/print/`,
  admission_note:    (u, a) => `/patients/${u}/admissions/${a}/admission-note/print/`,
  lab_reports:       (u, a) => `/patients/${u}/admissions/${a}/lab-reports/print/`,
  medicine_bill:     (u, a) => `/patients/${u}/admissions/${a}/pharmacy-records/print/`,
  final_bill:        (u, a) => `/patients/${u}/admissions/${a}/bill/print/`,
};

export default function PdfDownloadBtn({ uhid, admNo, docType, label, icon, onToast }) {
  const [loading, setLoading] = useState(false);

  const handlePrint = async () => {
    setLoading(true);
    try {
      const getUrl = URL_MAP[docType] || URL_MAP[docType?.replace(/-/g, "_")];
      if (!getUrl) throw new Error("Unknown doc type");
      const blob = await apiFetchBlob(getUrl(uhid, admNo));
      const url = window.URL.createObjectURL(blob);
      const win = window.open(url, "_blank");
      if (!win) { onToast("Popup blocked", "e"); return; }
      win.onload = () => { win.focus(); win.print(); };
      onToast(`${label} opened for print ✓`);
    } catch {
      onToast(`Failed to print ${label}`, "e");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handlePrint} disabled={loading}
      style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"8px 16px", background:"rgba(16,185,129,0.1)", border:"1.5px solid rgba(16,185,129,0.35)", color:"#10b981", borderRadius:9, cursor:loading?"not-allowed":"pointer", fontSize:12, fontFamily:"inherit", fontWeight:600, opacity:loading?0.6:1 }}>
      {loading ? <RefreshCw size={13} style={{ animation:"spin 1s linear infinite" }}/> : <Printer size={13}/>}
      {loading ? "Opening..." : `${icon} Print ${label}`}
    </button>
  );
}
