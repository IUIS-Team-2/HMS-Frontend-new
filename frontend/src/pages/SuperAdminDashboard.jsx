import { useState, useEffect, useRef } from "react";

const BRANCH_COLORS = { laxmi: "#378ADD", raya: "#D85A30" };
const BRANCH_LABELS = { laxmi: "Lakshmi Nagar", raya: "Raya" };

// ── tiny chart helpers ────────────────────────────────────────────────────────
function BarChart({ data, color = "#1D9E75", unit = "" }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,.5)" }}>{d.value}{unit}</span>
          <div style={{ width: "100%", background: color, borderRadius: "3px 3px 0 0", height: `${(d.value / max) * 60}px`, minHeight: 4, transition: "height .4s ease" }} />
          <span style={{ fontSize: 9, color: "rgba(255,255,255,.4)" }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ segments, size = 80 }) {
  const r = 28, cx = 40, cy = 40, circ = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth={10} />
      {segments.map((seg, i) => {
        const dash = (seg.value / total) * circ;
        const gap = circ - dash;
        const el = (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={seg.color} strokeWidth={10}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            transform="rotate(-90 40 40)" />
        );
        offset += dash;
        return el;
      })}
    </svg>
  );
}

function LineSparkline({ data, color }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const W = 120, H = 36;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - min) / range) * (H - 4) - 2}`).join(" ");
  return (
    <svg width={W} height={H} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}

// ── computed stats from real db ───────────────────────────────────────────────
function computeStats(db, locId) {
  const locs = locId === "all" ? ["laxmi", "raya"] : [locId];
  let patients = 0, admissions = 0, discharges = 0, revenue = 0, pendingBills = 0;
  const serviceMap = {};
  const recentPatients = [];

  locs.forEach(loc => {
    (db[loc] || []).forEach(p => {
      patients++;
      (p.admissions || []).forEach(adm => {
        admissions++;
        if (adm.discharge && adm.discharge.actualDod) discharges++;
        const total = adm.billing?.grandTotal || adm.billing?.total || 0;
        revenue += Number(total) || 0;
        if (!adm.billing?.paid) pendingBills++;
        (adm.services || []).forEach(svc => {
          const name = svc.serviceName || svc.name || "Other";
          const amt = Number(svc.amount || svc.price || 0);
          serviceMap[name] = (serviceMap[name] || 0) + amt;
        });
        recentPatients.push({
          uhid: p.uhid,
          name: p.patientName || "—",
          branch: BRANCH_LABELS[loc],
          branchKey: loc,
          admType: adm.admissionType || "IPD",
          total: total,
          status: adm.discharge?.actualDod ? "Discharged" : "Admitted",
          admNo: adm.admNo,
          adm,
          patientObj: p,
        });
      });
    });
  });

  const topServices = Object.entries(serviceMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value]) => ({ label: label.length > 10 ? label.slice(0, 10) + "…" : label, value }));

  recentPatients.sort((a, b) => new Date(b.adm.dateTime) - new Date(a.adm.dateTime));

  return { patients, admissions, discharges, revenue, pendingBills, topServices, recentPatients: recentPatients.slice(0, 8) };
}

// ── bill download ─────────────────────────────────────────────────────────────
function downloadBill(patientObj, admObj, locId) {
  const lines = [];
  lines.push("════════════════════════════════════════");
  lines.push("         SANGI HOSPITAL — IPD PORTAL    ");
  lines.push("════════════════════════════════════════");
  lines.push(`Branch   : ${BRANCH_LABELS[locId] || locId}`);
  lines.push(`Date     : ${new Date().toLocaleDateString("en-IN")}`);
  lines.push("────────────────────────────────────────");
  lines.push(`UHID     : ${patientObj.uhid}`);
  lines.push(`Patient  : ${patientObj.patientName || "—"}`);
  lines.push(`Phone    : ${patientObj.phone || "—"}`);
  lines.push(`Adm No   : ${admObj.admNo}`);
  lines.push(`Adm Date : ${admObj.dateTime ? new Date(admObj.dateTime).toLocaleDateString("en-IN") : "—"}`);
  lines.push("────────────────────────────────────────");
  lines.push("SERVICES");
  lines.push("────────────────────────────────────────");
  (admObj.services || []).forEach(s => {
    const name = (s.serviceName || s.name || "Service").padEnd(24);
    const amt = `₹${Number(s.amount || s.price || 0).toLocaleString("en-IN")}`;
    lines.push(`${name} ${amt}`);
  });
  lines.push("────────────────────────────────────────");
  const grand = admObj.billing?.grandTotal || admObj.billing?.total || 0;
  lines.push(`${"GRAND TOTAL".padEnd(24)} ₹${Number(grand).toLocaleString("en-IN")}`);
  lines.push("════════════════════════════════════════");
  lines.push("   Generated by Super Admin — HMS Portal");

  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Bill_${patientObj.uhid}_Adm${admObj.admNo}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── main component ────────────────────────────────────────────────────────────
export default function SuperAdminDashboard({ db, onBack }) {
  const [viewLoc, setViewLoc] = useState("all");
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    const handler = e => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const stats = computeStats(db, viewLoc);

  const admissionsOverTime = (() => {
    const months = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
    const laxmiData = [38, 42, 35, 50, 48, 54];
    const rayaData = [22, 26, 20, 31, 29, 35];
    if (viewLoc === "laxmi") return months.map((label, i) => ({ label, value: laxmiData[i] }));
    if (viewLoc === "raya") return months.map((label, i) => ({ label, value: rayaData[i] }));
    return months.map((label, i) => ({ label, value: laxmiData[i] + rayaData[i] }));
  })();

  const bedOccupancy = viewLoc === "all"
    ? [{ label: "Lakshmi Nagar", value: 82 }, { label: "Raya", value: 71 }]
    : [{ label: BRANCH_LABELS[viewLoc], value: viewLoc === "laxmi" ? 82 : 71 }];

  const dischargeSeg = [
    { color: "#1D9E75", value: 72, label: "Recovered" },
    { color: "#FAC775", value: 18, label: "Referred" },
    { color: "#E24B4A", value: 10, label: "LAMA" },
  ];

  const revenueSplit = viewLoc === "all"
    ? [{ color: "#378ADD", value: 62, label: "Lakshmi Nagar" }, { color: "#D85A30", value: 38, label: "Raya" }]
    : [{ color: BRANCH_COLORS[viewLoc], value: 100, label: BRANCH_LABELS[viewLoc] }];

  const locOptions = [
    { key: "all", label: "All Branches", sub: "Combined view", color: "#1D9E75" },
    { key: "laxmi", label: "Lakshmi Nagar", sub: "Mathura", color: "#378ADD" },
    { key: "raya", label: "Raya", sub: "Mathura", color: "#D85A30" },
  ];
  const activeLoc = locOptions.find(l => l.key === viewLoc);

  const S = {
    wrap: { background: "#0f1117", minHeight: "100vh", fontFamily: "system-ui,sans-serif", color: "#fff" },
    topbar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", borderBottom: "1px solid rgba(255,255,255,.07)", background: "#141720" },
    brandRow: { display: "flex", alignItems: "center", gap: 10 },
    brandIcon: { width: 34, height: 34, background: "#0F6E56", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" },
    navRight: { display: "flex", alignItems: "center", gap: 10 },
    pill: { fontSize: 12, padding: "5px 12px", borderRadius: 20, border: "1px solid rgba(255,255,255,.12)", color: "rgba(255,255,255,.6)", background: "transparent" },
    locBtn: { display: "flex", alignItems: "center", gap: 7, padding: "6px 14px", borderRadius: 20, border: "1px solid rgba(255,255,255,.18)", background: "rgba(255,255,255,.06)", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#fff" },
    locDot: (color) => ({ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }),
    dropdown: { position: "absolute", top: "calc(100% + 8px)", right: 0, background: "#1e2130", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, minWidth: 210, zIndex: 100, overflow: "hidden" },
    dropOption: (active) => ({ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,.06)", background: active ? "rgba(255,255,255,.06)" : "transparent" }),
    backBtn: { fontSize: 12, padding: "6px 14px", borderRadius: 8, background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)", color: "#fff", cursor: "pointer" },
    logoutBtn: { fontSize: 12, padding: "6px 14px", borderRadius: 8, background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)", color: "#fff", cursor: "pointer" },
    body: { padding: "24px" },
    pageTitle: { fontSize: 22, fontWeight: 700, marginBottom: 2 },
    pageSub: { fontSize: 13, color: "rgba(255,255,255,.45)", marginBottom: 16 },
    branchTag: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, padding: "4px 12px", background: "rgba(29,158,117,.15)", borderRadius: 20, color: "#1D9E75", fontWeight: 600, marginBottom: 24 },
    metricsGrid: { display: "grid", gridTemplateColumns: "repeat(6,minmax(0,1fr))", gap: 12, marginBottom: 24 },
    metricCard: { background: "#1a1f2e", borderRadius: 10, padding: "14px 16px" },
    metricLabel: { fontSize: 11, color: "rgba(255,255,255,.4)", marginBottom: 4 },
    metricValue: { fontSize: 22, fontWeight: 700 },
    metricDelta: { fontSize: 11, marginTop: 3, color: "#1D9E75" },
    chartsRow: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 },
    chartsRow2: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 },
    card: { background: "#1a1f2e", borderRadius: 12, padding: 18, border: "1px solid rgba(255,255,255,.06)" },
    cardTitle: { fontSize: 14, fontWeight: 600, marginBottom: 2 },
    cardSub: { fontSize: 12, color: "rgba(255,255,255,.4)", marginBottom: 14 },
    legend: { display: "flex", gap: 12, marginBottom: 10, flexWrap: "wrap" },
    legendItem: { display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "rgba(255,255,255,.5)" },
    legendDot: (color) => ({ width: 9, height: 9, borderRadius: 2, background: color, flexShrink: 0 }),
    table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
    th: { fontSize: 11, color: "rgba(255,255,255,.35)", fontWeight: 400, textAlign: "left", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,.07)" },
    td: { padding: "11px 0", borderBottom: "1px solid rgba(255,255,255,.05)", color: "#fff" },
    dlBtn: { display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,.15)", background: "rgba(255,255,255,.05)", color: "#fff", cursor: "pointer" },
  };

  const statusStyle = s => s === "Discharged"
    ? { background: "rgba(29,158,117,.15)", color: "#1D9E75", padding: "2px 9px", borderRadius: 20, fontSize: 11 }
    : s === "Admitted"
    ? { background: "rgba(55,138,221,.15)", color: "#378ADD", padding: "2px 9px", borderRadius: 20, fontSize: 11 }
    : { background: "rgba(250,199,117,.15)", color: "#FAC775", padding: "2px 9px", borderRadius: 20, fontSize: 11 };

  return (
    <div style={S.wrap}>
      {/* ── topbar ── */}
      <div style={S.topbar}>
        <div style={S.brandRow}>
          <div style={S.brandIcon}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="white"><path d="M12 2L3 7v10l9 5 9-5V7z"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Sangi Hospital</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,.4)", letterSpacing: 1 }}>IPD PORTAL</div>
          </div>
        </div>

        <div style={S.navRight}>
          <div style={S.pill}>{new Date().toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}</div>

          {/* location switcher */}
          <div ref={dropRef} style={{ position: "relative" }}>
            <button style={S.locBtn} onClick={() => setDropOpen(o => !o)}>
              <span style={S.locDot(activeLoc.color)} />
              {activeLoc.label}
              <span style={{ fontSize: 10, color: "rgba(255,255,255,.4)" }}>▾</span>
            </button>
            {dropOpen && (
              <div style={S.dropdown}>
                {locOptions.map(opt => (
                  <div key={opt.key} style={S.dropOption(viewLoc === opt.key)}
                    onClick={() => { setViewLoc(opt.key); setDropOpen(false); }}>
                    <span style={S.locDot(opt.color)} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{opt.label}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)" }}>{opt.sub}</div>
                    </div>
                    {viewLoc === opt.key && <span style={{ marginLeft: "auto", fontSize: 14, color: "#1D9E75" }}>✓</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ fontSize: 12, textAlign: "right", lineHeight: 1.4 }}>
            <div style={{ fontWeight: 700 }}>Super Admin</div>
            <div style={{ color: "rgba(255,255,255,.4)" }}>All Branches</div>
          </div>
          <button style={S.backBtn} onClick={onBack}>← Back to Portal</button>
        </div>
      </div>

      {/* ── body ── */}
      <div style={S.body}>
        <div style={S.pageTitle}>Super Admin Dashboard</div>
        <div style={S.pageSub}>Analytics across all branches — real-time view</div>
        <div style={S.branchTag}>
          <span style={S.locDot(activeLoc.color)} />
          {viewLoc === "all" ? "All Branches — Lakshmi Nagar + Raya" : `${activeLoc.label} Branch · Mathura`}
        </div>

        {/* ── metrics ── */}
        <div style={S.metricsGrid}>
          {[
            { label: "Total Patients", value: stats.patients, delta: "+12 this week", up: true },
            { label: "Admissions", value: stats.admissions, delta: `${stats.admissions} total`, up: true },
            { label: "Discharges", value: stats.discharges, delta: `${stats.admissions - stats.discharges} still admitted`, up: false },
            { label: "Bed Occupancy", value: viewLoc === "raya" ? "71%" : viewLoc === "laxmi" ? "82%" : "78%", delta: "+4% vs last month", up: true },
            { label: "Revenue (INR)", value: stats.revenue > 0 ? "₹" + (stats.revenue / 100000).toFixed(1) + "L" : "₹0", delta: "+18% this month", up: true },
            { label: "Pending Bills", value: stats.pendingBills, delta: "needs attention", up: false },
          ].map((m, i) => (
            <div key={i} style={S.metricCard}>
              <div style={S.metricLabel}>{m.label}</div>
              <div style={S.metricValue}>{m.value}</div>
              <div style={{ ...S.metricDelta, color: m.up ? "#1D9E75" : "#E24B4A" }}>{m.delta}</div>
            </div>
          ))}
        </div>

        {/* ── row 1: admissions + revenue ── */}
        <div style={S.chartsRow}>
          <div style={S.card}>
            <div style={S.cardTitle}>Admissions over time</div>
            <div style={S.cardSub}>Monthly trend</div>
            {viewLoc === "all" && (
              <div style={S.legend}>
                <span style={S.legendItem}><span style={S.legendDot("#378ADD")} />Lakshmi Nagar</span>
                <span style={S.legendItem}><span style={S.legendDot("#D85A30")} />Raya</span>
              </div>
            )}
            <BarChart data={admissionsOverTime} color={viewLoc === "raya" ? "#D85A30" : "#378ADD"} />
            {viewLoc === "all" && (
              <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                <BarChart data={[{label:"Oct",value:22},{label:"Nov",value:26},{label:"Dec",value:20},{label:"Jan",value:31},{label:"Feb",value:29},{label:"Mar",value:35}]} color="#D85A30" />
              </div>
            )}
          </div>
          <div style={S.card}>
            <div style={S.cardTitle}>Revenue split</div>
            <div style={S.cardSub}>By branch (this month)</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <DonutChart segments={revenueSplit} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {revenueSplit.map((s, i) => (
                  <div key={i} style={S.legendItem}>
                    <span style={S.legendDot(s.color)} />{s.label} {s.value}%
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── row 2: bed + services + discharge ── */}
        <div style={S.chartsRow2}>
          <div style={S.card}>
            <div style={S.cardTitle}>Bed occupancy</div>
            <div style={S.cardSub}>Current % by branch</div>
            <BarChart data={bedOccupancy} color="#378ADD" unit="%" />
          </div>
          <div style={S.card}>
            <div style={S.cardTitle}>Top services</div>
            <div style={S.cardSub}>By charges (INR)</div>
            {stats.topServices.length > 0
              ? <BarChart data={stats.topServices} color="#1D9E75" />
              : <div style={{ fontSize: 12, color: "rgba(255,255,255,.3)", marginTop: 20 }}>No service data yet</div>
            }
          </div>
          <div style={S.card}>
            <div style={S.cardTitle}>Discharge outcomes</div>
            <div style={S.cardSub}>Breakdown</div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <DonutChart segments={dischargeSeg} size={70} />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {dischargeSeg.map((s, i) => (
                  <div key={i} style={S.legendItem}>
                    <span style={S.legendDot(s.color)} />{s.label} {s.value}%
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── patient table ── */}
        <div style={S.card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div style={S.cardTitle}>Recent patients — billable</div>
              <div style={S.cardSub}>Super Admin can download bill for any patient</div>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.35)" }}>{stats.recentPatients.length} records</div>
          </div>

          {stats.recentPatients.length === 0 ? (
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.3)", padding: "24px 0", textAlign: "center" }}>
              No patients found for this branch yet.
            </div>
          ) : (
            <table style={S.table}>
              <thead>
                <tr>
                  {["UHID", "Patient name", "Branch", "Adm type", "Total charges", "Status", "Bill"].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.recentPatients.map((row, i) => (
                  <tr key={i}>
                    <td style={{ ...S.td, color: "rgba(255,255,255,.5)", fontSize: 12 }}>{row.uhid}</td>
                    <td style={S.td}>{row.name}</td>
                    <td style={S.td}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: BRANCH_COLORS[row.branchKey] || "#888" }} />
                        {row.branch}
                      </span>
                    </td>
                    <td style={{ ...S.td, fontSize: 12 }}>{row.admType}</td>
                    <td style={S.td}>
                      {row.total ? `₹${Number(row.total).toLocaleString("en-IN")}` : <span style={{ color: "rgba(255,255,255,.3)" }}>—</span>}
                    </td>
                    <td style={S.td}><span style={statusStyle(row.status)}>{row.status}</span></td>
                    <td style={S.td}>
                      <button style={S.dlBtn} onClick={() => downloadBill(row.patientObj, row.adm, row.branchKey)}>
                        ↓ Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
