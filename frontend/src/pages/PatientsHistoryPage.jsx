import { useState } from "react";
import { T } from "../data/constants";
import { fmtDT } from "../utils/helpers";
import { Ico, IC } from "../components/ui/Icons";
import { statusBadge } from "../components/ui/SharedUI";

export default function PatientsHistoryPage({ db, locId, onBack, onDischarge, onGenerateBill, onViewPatient, onViewMedical, branch }) {
  const loc = branch || { id: locId, name: "Hospital", color: "#0EA5E9" };

  const [filterDate,   setFilterDate]  = useState("");
  const [filterMonth,  setFilterMonth] = useState("");
  const [filterYear,   setFilterYear]  = useState("");

  const patients = Array.isArray(db) ? db : [];
  const allRows = patients.flatMap((p) => {
    const admissions = Array.isArray(p?.admissions) ? p.admissions : [];
    return admissions.map((adm, index) => ({
      patientName: p?.patientName || p?.name || "Unknown Patient",
      uhid: p?.uhid,
      admNo: adm?.admNo ?? adm?.id ?? index + 1,
      doa: adm?.discharge?.doa || adm?.dateTime || adm?.doa || "",
      dod: adm?.discharge?.dod || adm?.dod || "",
      status: adm?.discharge?.dischargeStatus || adm?.status || "",
      billing: adm?.billing || {},
      patientObj: p,
      admObj: { ...adm, admNo: adm?.admNo ?? adm?.id ?? index + 1 },
    }));
  }).sort((a, b) => new Date(b.doa || 0) - new Date(a.doa || 0));

  const years  = [...new Set(allRows.map(r => r.doa ? new Date(r.doa).getFullYear() : "").filter(Boolean))].sort((a, b) => b - a);
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  const filtered = allRows.filter(r => {
    if (!r.doa) return true;
    const d = new Date(r.doa);
    if (filterDate  && d.toDateString() !== new Date(filterDate).toDateString()) return false;
    if (filterMonth && String(d.getMonth()) !== filterMonth) return false;
    if (filterYear  && String(d.getFullYear()) !== filterYear) return false;
    return true;
  });

  const totalAdm   = filtered.length;
  const discharged = filtered.filter(r => r.dod && r.status).length;
  const pending    = totalAdm - discharged;
  const billed     = filtered.filter(r => r.billing && (r.billing.paidNow || r.billing.paymentMode)).length;
  const clearFilters = () => { setFilterDate(""); setFilterMonth(""); setFilterYear(""); };
  const hasFilter = filterDate || filterMonth || filterYear;
  const downloadExcel = async () => {
    const ExcelJS    = (await import("exceljs")).default;
    const { saveAs } = await import("file-saver");
    const wb    = new ExcelJS.Workbook();
    const ws    = wb.addWorksheet("IPD Records");
    const locName = loc?.name || "Hospital";

    ws.mergeCells("A1:P1");
    const title = ws.getCell("A1");
    title.value     = `🏥  ${locName} — IPD RECORDS  |  ${new Date().toLocaleDateString("en-IN", { day:"2-digit", month:"long", year:"numeric" })}`;
    title.font      = { bold:true, color:{ argb:"FFFFFFFF" }, size:14, name:"Arial" };
    title.fill      = { type:"pattern", pattern:"solid", fgColor:{ argb:"FF0D2B55" } };
    title.alignment = { horizontal:"center", vertical:"middle" };
    ws.getRow(1).height = 32;

    const headers   = ["SR.NO","PATIENT NAME","AGE/G","IPD NO","CARD NO","ROOM","DOA & TIME","DOD & TIME","STAY","TYPE","TYPE REF/EMERGENCY","CONSULTANT NAME","NUMBER","ADDRESS","DISCHARGE STATUS","BILL STATUS"];
    const headerRow = ws.addRow(headers);
    headerRow.height = 36;
    const bs = (style = "thin") => ({ style, color:{ argb:"FFBFCFDE" } });
    headerRow.eachCell(cell => {
      cell.font      = { bold:true, color:{ argb:"FFFFFFFF" }, size:9, name:"Arial" };
      cell.fill      = { type:"pattern", pattern:"solid", fgColor:{ argb:"FF1A3C6E" } };
      cell.alignment = { horizontal:"center", vertical:"middle", wrapText:true };
      cell.border    = { top:bs("medium"), bottom:bs("medium"), left:bs("medium"), right:bs("medium") };
    });

    const ROW_COLORS = ["FFD6E4F7","FFFFF8E7"];
    filtered.forEach((r, i) => {
      const bg  = ROW_COLORS[i % 2];
      const row = ws.addRow([
        i + 1, r.patientName,
        (r.patientObj?.ageYY ? r.patientObj.ageYY + " Yrs" : "") + (r.patientObj?.gender ? " / " + r.patientObj.gender.charAt(0).toUpperCase() : ""),
        r.admObj?.ipdNo || "—",
        r.patientObj?.tpaCard || r.patientObj?.tpaPanelCardNo || "—",
        r.admObj?.discharge?.wardName || "—",
        r.doa ? fmtDT(r.doa) : "",
        r.dod ? fmtDT(r.dod) : "",
        r.doa && r.dod ? Math.ceil((new Date(r.dod) - new Date(r.doa)) / (1000*60*60*24)) + " Days" : "—",
        r.admObj?.admissionType || "IPD",
        r.admObj?.admissionType || "—",
        r.admObj?.discharge?.doctorName || "—",
        r.patientObj?.phone   || "—",
        r.patientObj?.address || "—",
        r.status || "Pending",
        (r.billing && (r.billing.paidNow || r.billing.paymentMode)) ? "Generated" : "Pending",
      ]);
      row.height = 24;
      row.eachCell((cell, colNum) => {
        cell.border    = { top:bs(), bottom:bs(), left:bs(), right:bs() };
        cell.alignment = { horizontal:"center", vertical:"middle", wrapText:true };
        cell.font      = { size:9, name:"Arial" };
        if (colNum === 15) {
          const ok = ["Recovered","Discharged"].includes(cell.value);
          cell.fill = { type:"pattern", pattern:"solid", fgColor:{ argb: ok ? "FFE6F4EA" : "FFFFF3CD" } };
          cell.font = { bold:true, color:{ argb: ok ? "FF1E7E34" : "FF856404" }, size:9, name:"Arial" };
        } else if (colNum === 16) {
          const ok = cell.value === "Generated";
          cell.fill = { type:"pattern", pattern:"solid", fgColor:{ argb: ok ? "FFFFF3CD" : "FFFDE8E8" } };
          cell.font = { bold:true, color:{ argb: ok ? "FF856404" : "FFC0392B" }, size:9, name:"Arial" };
        } else {
          cell.fill = { type:"pattern", pattern:"solid", fgColor:{ argb: bg } };
        }
        if (colNum === 2 || colNum === 14) cell.alignment = { horizontal:"left", vertical:"middle", wrapText:true };
      });
    });

    [6,18,13,14,10,14,18,18,8,6,12,18,13,22,16,12].forEach((w, i) => { ws.getColumn(i + 1).width = w; });
    ws.views = [{ state:"frozen", ySplit:2 }];
    const buffer = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `${locName}_IPD_${new Date().toLocaleDateString("en-IN").replace(/\//g,"-")}.xlsx`);
  };

  return (
<div
  className="hist-page"
  style={{
    height: "calc(100vh - 80px)",
    overflowY: "auto",
    paddingBottom: "120px"
  }}
>

      {/* ── Header ── */}
      <div className="hist-page-hd">
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:5 }}>
            <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ padding:"6px 14px", fontSize:13 }}>
              <Ico d={IC.dn} size={13} sw={2.5} style={{ transform:"rotate(90deg)" }} /> ← Back
            </button>
          </div>
          <h1 style={{ fontFamily:"'DM Serif Display',serif", fontSize:26, color:T.primary, marginBottom:4 }}>Patients History</h1>
          <p style={{ fontSize:14, color:T.textMuted }}>{loc?.name} Branch · All admissions record</p>
        </div>
        <div style={{ marginLeft:"auto" }}>
          <button onClick={downloadExcel} style={{ backgroundColor:T.primary, color:"#fff", padding:"9px 18px", borderRadius:8, border:"none", cursor:"pointer", fontWeight:600, fontSize:13, display:"flex", alignItems:"center", gap:7 }}>
            ⬇ Download Excel
          </button>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="hist-filter-bar">
        <span className="hist-filter-label"><Ico d={IC.calendar} size={13} sw={2} /> Filter by</span>
        <div className="hist-filter-sep" />
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          <span style={{ fontSize:10, fontWeight:700, color:T.textLight, textTransform:"uppercase", letterSpacing:".06em" }}>Date</span>
          <input type="date" className="hist-filter-ctrl" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ width:150 }} />
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          <span style={{ fontSize:10, fontWeight:700, color:T.textLight, textTransform:"uppercase", letterSpacing:".06em" }}>Month</span>
          <select className="hist-filter-ctrl" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ width:140 }}>
            <option value="">All Months</option>
            {months.map((m, i) => <option key={i} value={String(i)}>{m}</option>)}
          </select>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          <span style={{ fontSize:10, fontWeight:700, color:T.textLight, textTransform:"uppercase", letterSpacing:".06em" }}>Year</span>
          <select className="hist-filter-ctrl" value={filterYear} onChange={e => setFilterYear(e.target.value)} style={{ width:110 }}>
            <option value="">All Years</option>
            {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
          </select>
        </div>
        {hasFilter && <button className="hist-clear-btn" onClick={clearFilters}>✕ Clear</button>}
        <span style={{ marginLeft:"auto", fontSize:13, color:T.textMuted, fontWeight:500 }}>
          {filtered.length} record{filtered.length !== 1 ? "s" : ""} found
        </span>
      </div>

      {/* ── Stats ── */}
      <div className="hist-summary-stats">
        {[
          { l:"Total Admissions",  v:totalAdm,   c:T.primary    },
          { l:"Discharged",        v:discharged, c:T.green      },
          { l:"Pending Discharge", v:pending,    c:T.amber      },
          { l:"Bills Generated",   v:billed,     c:T.accentDeep },
        ].map(s => (
          <div key={s.l} className="hist-stat">
            <span className="hist-stat-num" style={{ color:s.c }}>{s.v}</span>
            <span className="hist-stat-lbl">{s.l}</span>
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:"60px 0", color:T.textMuted, fontSize:14, background:T.white, borderRadius:16, border:`1px solid ${T.border}` }}>
          <Ico d={IC.search} size={32} sw={1.5} /><br /><br />
          No admissions found{hasFilter ? " for the selected filter." : "."}
          {hasFilter && <><br /><button className="btn btn-ghost btn-sm" style={{ marginTop:12 }} onClick={clearFilters}>Clear Filters</button></>}
        </div>
      ) : (
        <div className="hist-table-wrap">
          <table className="hist-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Patient</th>
                <th>Date of Admission</th>
                <th>Medical History</th>
                <th>Discharge Status</th>
                <th>Bill</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const isDischarge = r.dod && r.status;
                const hasBill     = r.billing && r.billing.printStatus === "APPROVED";
                const mh          = r.admObj.medicalHistory;
                const hasMedHist  = mh && (
                  mh.presentComplaints   ||
                  mh.provisionalDiagnosis ||
                  mh.previousDiagnosis   ||
                  mh.currentMedications  ||
                  mh.knownAllergies
                );

                return (
                  <tr key={`${r.uhid}-${r.admNo}`} onClick={() => onViewPatient({ ...r.patientObj, admissions:[r.admObj], medHistory:mh, dischargeStatus:r.status, admNo:r.admNo })}>

                    {/* # */}
                    <td style={{ color:T.textMuted, fontSize:12, width:40 }}>{i + 1}</td>

                    {/* Patient */}
                    <td>
                      <div className="hist-pt-name">{r.patientName}</div>
                      <div className="hist-pt-uhid">{r.uhid} · Adm #{r.admNo}</div>
                    </td>

                    {/* Date of Admission */}
                    <td style={{ fontSize:13, color:T.textMid, whiteSpace:"nowrap" }}>{fmtDT(r.doa)}</td>

                    {/* Medical History */}
                    <td onClick={e => e.stopPropagation()}>
                      {hasMedHist ? (
                        <div style={{ display:"inline-flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                          <button
                            onClick={e => { e.stopPropagation(); onViewMedical(r.patientObj, r.admObj); }}
                            style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:12, fontWeight:600, padding:"4px 11px", borderRadius:20, background:"#EEF2FF", color:"#4338CA", border:"1px solid #C7D2FE", cursor:"pointer" }}
                          >
                            ✎ Edit
                          </button>
                        </div>
                      ) : (
                        // Not filled → navigate to Medical History page
                        <button
                          onClick={e => { e.stopPropagation(); onViewMedical(r.patientObj, r.admObj); }}
                          style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:12, fontWeight:600, padding:"4px 11px", borderRadius:20, background:"#FEF3C7", color:"#D97706", border:"1px solid #FDE68A", cursor:"pointer" }}
                        >
                          ⚠ Not Filled — Click to Fill
                        </button>
                      )}
                    </td>

                    {/* Discharge Status */}
                    <td>
                      {isDischarge ? (
                        <div>
                          {statusBadge(r.status)}
                          <div className="hist-dod-val" style={{ marginTop:4, fontSize:11.5, color:T.textMid }}>
                            <Ico d={IC.check} size={10} sw={2.5} /> {fmtDT(r.dod)}
                          </div>
                        </div>
                      ) : (
                        <button className="hist-discharge-btn" onClick={e => { e.stopPropagation(); onDischarge(r.patientObj, r.admObj); }}>
                          <Ico d={IC.bed} size={13} sw={2} /> Discharge
                        </button>
                      )}
                    </td>

                    {/* Bill */}
                    <td>
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-start", gap:8 }}>
                        <button className="btn btn-ghost btn-sm" style={{ padding:"5px 10px", fontSize:12, display:"inline-flex", alignItems:"center", gap:6 }}
                          onClick={e => { e.stopPropagation(); onViewPatient({ ...r.patientObj, admissions:[r.admObj], medHistory:mh, dischargeStatus:r.status, admNo:r.admNo }); }}>
                          <Ico d={IC.edit} size={12} sw={2} /> Edit Patient
                        </button>
                        {hasBill ? (
                          <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:20, background:T.greenTint, color:T.green, border:`1px solid ${T.greenBorder}` }}>
                            <Ico d={IC.check} size={10} sw={2.5} /> Generated
                          </span>
                        ) : (
                          <button className="btn btn-ghost btn-sm" style={{ borderColor:T.accentDeep, color:T.accentDeep, padding:"5px 10px", fontSize:12, display:"inline-flex", alignItems:"center", gap:6 }}
                            onClick={e => { e.stopPropagation(); onGenerateBill(r.patientObj, r.admObj); }}>
                            <Ico d={IC.receipt} size={12} sw={2} /> Generate Bill
                          </button>
                        )}
                      </div>
                    </td>
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
