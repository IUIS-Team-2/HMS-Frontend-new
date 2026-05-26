import { toast } from "react-toastify";
import { escapeHtml } from "../shared/helpers";

export function openPrintWindow(title, htmlBody, cssExtra = "") {
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) { toast.warning("Please allow pop-ups for this site."); return; }
  const fullHtml = `<!DOCTYPE html>
<html><head>
  <title>${escapeHtml(title)}</title>
  <style>
    body{font-family:Arial,sans-serif;font-size:12px;color:#000;padding:20px;margin:0;}
    table{width:100%;border-collapse:collapse;}
    th,td{border:1px solid #000;padding:6px 10px;text-align:left;font-size:11px;}
    th{background:#f0f0f0;font-weight:bold;}
    .no-border td,.no-border th{border:none;}
    .total-row td{font-weight:bold;background:#f9f9f9;}
    @media print{@page{size:A4;margin:10mm;}}
    ${cssExtra}
  </style>
</head><body>${htmlBody}</body></html>`;
  win.document.open();
  win.document.write(fullHtml);
  win.document.close();
  win.onload = () => { win.focus(); win.print(); };
  setTimeout(() => { try { win.focus(); win.print(); } catch(e) {} }, 800);
}
