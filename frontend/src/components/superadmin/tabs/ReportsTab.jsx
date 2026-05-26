import { useState } from "react";
import { useT, bName, branchFilterOptions, cardStyle, fmt, inr } from "../shared/tokens";
import { FilterSelect, XlsBtn, TH } from "../shared/MicroUI";
import { exportXLSX } from "../shared/helpers";
import { ClipboardList, Wallet, DoorOpen, Landmark, AlertTriangle } from "lucide-react";

const PT_COLS = [
  { label:"UHID",key:"uhid" },{ label:"Patient",key:"name" },{ label:"Gender",key:"gender" },
  { label:"Age",key:"age" },{ label:"Phone",key:"phone" },{ label:"Branch",get:r=>bName(r._branch) },
  { label:"Type",key:"admType" },{ label:"Doctor",key:"doctor" },{ label:"Ward",key:"ward" },
  { label:"Department",key:"department" },{ label:"Adm Date",get:r=>fmt(r.admDate) },
  { label:"Discharge Date",get:r=>fmt(r.dischargeDate) },{ label:"Diagnosis",key:"diagnosis" },
  { label:"Status",key:"dischargeStatus" },{ label:"Grand Total",key:"grand" },
  { label:"Paid",key:"paid" },{ label:"Pending",key:"pending" },{ label:"Payment Mode",key:"paymentMode" },
  { label:"TPA",key:"tpa" },
];

export default function ReportsTab({ all }) {
  const T = useT();
  const [branch, setBranch] = useState("all");
  const [openReport, setOpenReport] = useState("Complete Patient Register");
  const base = branch === "all" ? all : all.filter(p => p._branch === branch);

  const REPORTS = [
    { title:"Complete Patient Register", icon:ClipboardList, desc:"All admissions with every detail", rows:base, cols:PT_COLS, file:"complete_register.xlsx" },
    { title:"Revenue Report", icon:Wallet, desc:"All billing and payment breakdown",
      rows:base, file:"revenue_report.xlsx", cols:[
        { label:"UHID",key:"uhid" },{ label:"Patient",key:"name" },{ label:"Branch",get:r=>bName(r._branch) },
        { label:"Type",key:"admType" },{ label:"Doctor",key:"doctor" },{ label:"Date",get:r=>fmt(r.admDate) },
        { label:"Subtotal",key:"subtotal" },{ label:"Discount",key:"discount" },{ label:"Advance",key:"advance" },
        { label:"Grand",key:"grand" },{ label:"Paid",key:"paid" },{ label:"Pending",key:"pending" },
        { label:"Mode",key:"paymentMode" },{ label:"TPA",key:"tpa" }] },
    { title:"Discharge Summary", icon:DoorOpen, desc:"All discharged patients with DOD",
      rows:base.filter(p=>p.dischargeDate), file:"discharge_summary.xlsx", cols:[
        { label:"UHID",key:"uhid" },{ label:"Patient",key:"name" },{ label:"Branch",get:r=>bName(r._branch) },
        { label:"Doctor",key:"doctor" },{ label:"Diagnosis",key:"diagnosis" },
        { label:"Adm Date",get:r=>fmt(r.admDate) },{ label:"DOD",get:r=>fmt(r.dischargeDate) },
        { label:"Status",key:"dischargeStatus" },{ label:"Grand",key:"grand" }] },
    { title:"Cash Patients Report", icon:Wallet, desc:"Only cash payment patients",
      rows:base.filter(p=>p.admType==="Cash"), file:"cash_patients.xlsx", cols:[
        { label:"UHID",key:"uhid" },{ label:"Patient",key:"name" },{ label:"Branch",get:r=>bName(r._branch) },
        { label:"Doctor",key:"doctor" },{ label:"Date",get:r=>fmt(r.admDate) },
        { label:"Grand",key:"grand" },{ label:"Paid",key:"paid" },{ label:"Pending",key:"pending" },
        { label:"Mode",key:"paymentMode" }] },
    { title:"Cashless and TPA Report", icon:Landmark, desc:"Insurance and TPA patients only",
      rows:base.filter(p=>p.admType==="Cashless"), file:"cashless_tpa.xlsx", cols:[
        { label:"UHID",key:"uhid" },{ label:"Patient",key:"name" },{ label:"Branch",get:r=>bName(r._branch) },
        { label:"Doctor",key:"doctor" },{ label:"TPA",key:"tpa" },{ label:"TPA Card",key:"tpaCard" },
        { label:"Date",get:r=>fmt(r.admDate) },{ label:"Grand",key:"grand" },{ label:"Paid",key:"paid" }] },
    { title:"Pending Dues Report", icon:AlertTriangle, desc:"Patients with outstanding balance",
      rows:base.filter(p=>p.pending>0), file:"pending_dues.xlsx", cols:[
        { label:"UHID",key:"uhid" },{ label:"Patient",key:"name" },{ label:"Phone",key:"phone" },
        { label:"Branch",get:r=>bName(r._branch) },{ label:"Doctor",key:"doctor" },
        { label:"Grand",key:"grand" },{ label:"Paid",key:"paid" },{ label:"Pending",key:"pending" },
        { label:"Mode",key:"paymentMode" }] },
  ];

  const selected = REPORTS.find(r => r.title === openReport) || REPORTS[0];
  const previewRows = (selected?.rows || []).slice(0, 8);
  const previewCols = (selected?.cols || []).slice(0, 6);

  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:20 }}>
        <FilterSelect value={branch} onChange={setBranch} options={branchFilterOptions()} />
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
        {REPORTS.map(r => (
          <div key={r.title} style={{ ...cardStyle(T), display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ fontSize:28 }}>{r.icon ? <r.icon size={28} strokeWidth={1.9}/> : null}</div>
            <div style={{ fontSize:14, fontWeight:800, color:T.white }}>{r.title}</div>
            <div style={{ fontSize:12, color:T.dim, flex:1 }}>{r.desc}</div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:13, fontWeight:700, color:T.amber }}>{r.rows.length} records</span>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <button onClick={() => setOpenReport(r.title)} style={{ padding:"7px 12px", borderRadius:8, border:`1px solid ${T.border2}`, background:T.card2, color:T.white, fontSize:12, fontWeight:700, cursor:"pointer" }}>View Format</button>
                <XlsBtn onClick={() => exportXLSX(r.rows, r.cols, r.file)} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ ...cardStyle(T), marginTop:18, padding:0, overflow:"hidden" }}>
        <div style={{ padding:"14px 16px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:14, fontWeight:800, color:T.white }}>{selected?.title}</div>
            <div style={{ fontSize:11, color:T.dim, marginTop:2 }}>{selected?.desc} · Showing top {previewRows.length} rows</div>
          </div>
          <XlsBtn onClick={() => exportXLSX(selected?.rows||[], selected?.cols||[], selected?.file||"report.xlsx")} label="Download Full Report" />
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr>{previewCols.map(col => <TH key={col.label} h={col.label} />)}</tr></thead>
            <tbody>
              {!previewRows.length
                ? <tr><td colSpan={Math.max(previewCols.length,1)} style={{ padding:40, textAlign:"center", color:T.dim }}>No data available.</td></tr>
                : previewRows.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom:`1px solid ${T.border}`, background:idx%2===0?T.card:T.surface }}>
                    {previewCols.map(col => {
                      const val = typeof col.get === "function" ? col.get(row) : (row[col.key] ?? "—");
                      return <td key={col.label} style={{ padding:"9px 12px", fontSize:12, color:T.white }}>{String(val||"—")}</td>;
                    })}
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}