import { downloadAdmissionNote } from "./MedicalHistoryPage";
import UserManagementPage from './UserManagementPage';
import { useState, useEffect, useRef } from "react";

const BRANCH_COLORS = { laxmi: "#378ADD", raya: "#D85A30" };
const BRANCH_LABELS = { laxmi: "Lakshmi Nagar", raya: "Raya" };

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
          uhid: p.uhid, name: p.patientName || "—", branch: BRANCH_LABELS[loc],
          branchKey: loc, admType: adm.admissionType || "IPD", total: total,
          status: adm.discharge?.actualDod ? "Discharged" : "Admitted",
          admNo: adm.admNo, adm, patientObj: p, expDod: adm.discharge?.expectedDod || null,
        });
      });
    });
  });

  const topServices = Object.entries(serviceMap).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([label, value]) => ({ label: label.length > 10 ? label.slice(0, 10) + "…" : label, value }));
  recentPatients.sort((a, b) => new Date(b.adm.dateTime) - new Date(a.adm.dateTime));
  return { patients, admissions, discharges, revenue, pendingBills, topServices, recentPatients: recentPatients.slice(0, 8) };
}

export default function SuperAdminDashboard({ db, onBack, onLogout, printRequests = [], onApprovePrint, onViewBill }) {
  const [viewedReqs, setViewedReqs] = useState(new Set());
  const [viewLoc, setViewLoc] = useState("all");
  const [dropOpen, setDropOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard" | "requests"
  const dropRef = useRef(null);

  useEffect(() => {
    const handler = e => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const stats = computeStats(db, viewLoc);

  // Filter requests by branch if needed
  const filteredRequests = viewLoc === "all"
    ? printRequests
    : printRequests.filter(r => r.locId === viewLoc || (viewLoc === "laxmi" && r.locId === "laxmi-nagar") || (viewLoc === "raya" && r.locId === "raya"));

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
      {/* topbar */}
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

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,.06)", borderRadius: 10, padding: 4 }}>
            <button onClick={() => setActiveTab("dashboard")}
              style={{ padding: "6px 14px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                background: activeTab === "dashboard" ? "rgba(255,255,255,.12)" : "transparent",
                color: activeTab === "dashboard" ? "#fff" : "rgba(255,255,255,.4)" }}>
              📊 Dashboard
            </button>
            <button onClick={() => setActiveTab("requests")}
              style={{ padding: "6px 14px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, position: "relative",
                background: activeTab === "requests" ? "rgba(255,255,255,.12)" : "transparent",
                color: activeTab === "requests" ? "#fff" : "rgba(255,255,255,.4)" }}>
              🖨 Print Requests
              {printRequests.length > 0 && (
                <span style={{ position: "absolute", top: 2, right: 4, background: "#E24B4A", color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {printRequests.length}
                </span>
              )}
            </button>
            <button onClick={() => setActiveTab("users")}
              style={{ padding: "6px 14px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                background: activeTab === "users" ? "rgba(255,255,255,.12)" : "transparent",
                color: activeTab === "users" ? "#fff" : "rgba(255,255,255,.4)" }}>
              👥 Users
            </button>
          </div>
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
          <button style={S.backBtn} onClick={onLogout}>⏻ Logout</button>
        </div>
      </div>

      {/* body */}
      <div style={S.body}>

        {/* ── PRINT REQUESTS TAB ── */}
        {activeTab === "users" && <UserManagementPage />}
        {activeTab === "requests" && (
          <div>
            <div style={S.pageTitle}>🖨 Print Requests</div>
            <div style={S.pageSub}>Approve or reject invoice print requests from branch staff</div>

            {/* Branch filter summary */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              {["laxmi", "raya"].map(loc => {
                const count = printRequests.filter(r => r.locId === loc).length;
                return (
                  <div key={loc} style={{ background: "#1a1f2e", borderRadius: 10, padding: "12px 20px", border: `1px solid ${count > 0 ? BRANCH_COLORS[loc] : "rgba(255,255,255,.06)"}`, minWidth: 160 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: BRANCH_COLORS[loc] }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,.6)" }}>{BRANCH_LABELS[loc]}</span>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: count > 0 ? "#FAC775" : "rgba(255,255,255,.3)" }}>{count}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)" }}>pending request{count !== 1 ? "s" : ""}</div>
                  </div>
                );
              })}
            </div>

            {filteredRequests.length === 0 ? (
              <div style={{ ...S.card, textAlign: "center", padding: "48px 0", color: "rgba(255,255,255,.3)", fontSize: 14 }}>
                ✅ No pending print requests
                {viewLoc !== "all" && <div style={{ fontSize: 12, marginTop: 6 }}>for {BRANCH_LABELS[viewLoc]} branch</div>}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {filteredRequests.map((req, i) => (
                  <div key={i} style={{ ...S.card, border: `1px solid ${BRANCH_COLORS[req.locId] || "#378ADD"}44` }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(55,138,221,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🖨</div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{req.patient?.patientName || "—"}</div>
                          <div style={{ fontSize: 12, color: "rgba(255,255,255,.45)", display: "flex", gap: 12 }}>
                            <span>UHID: <strong style={{ color: "#fff" }}>{req.uhid}</strong></span>
                            <span>Adm #{req.admNo}</span>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <span style={{ width: 6, height: 6, borderRadius: "50%", background: BRANCH_COLORS[req.locId] }} />
                              {BRANCH_LABELS[req.locId] || req.locId}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", marginTop: 3 }}>
                            Requested at: {new Date(req.requestedAt).toLocaleString("en-IN")}
                          </div>
                        </div>
                      </div>

                      {/* Bill summary */}
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)", textAlign: "right" }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: "#1D9E75" }}>
                          ₹{(req.svcs || []).reduce((a, s) => a + (parseFloat(s.rate) || 0) * (parseInt(s.qty) || 0), 0).toFixed(2)}
                        </div>
                        <div style={{ fontSize: 11 }}>{(req.svcs || []).filter(s => s.title || s.type).length} service(s)</div>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <button onClick={() => { onViewBill && onViewBill(req); setViewedReqs(prev => new Set([...prev, req.uhid + req.admNo])); }}
                          style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid #4A90D944", background: "rgba(74,144,217,.12)", color: "#4A90D9", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                          👁 View Bill
                        </button>
                        {viewedReqs.has(req.uhid + req.admNo) ? (
                          <>
                            <button onClick={() => onApprovePrint && onApprovePrint(req, "reject")}
                              style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid #E24B4A44", background: "rgba(226,75,74,.12)", color: "#E24B4A", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                              ✕ Reject
                            </button>
                            <button onClick={() => onApprovePrint && onApprovePrint(req, "approve")}
                              style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#1D9E75", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                              ✓ Approve & Print
                            </button>
                          </>
                        ) : (
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,.3)", fontStyle: "italic" }}>View bill first to approve</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── DASHBOARD TAB ── */}
        {activeTab === "dashboard" && (
          <>
            <div style={S.pageTitle}>Super Admin Dashboard</div>
            <div style={S.pageSub}>Analytics across all branches — real-time view</div>
            <div style={S.branchTag}>
              <span style={S.locDot(activeLoc.color)} />
              {viewLoc === "all" ? "All Branches — Lakshmi Nagar + Raya" : `${activeLoc.label} Branch · Mathura`}
            </div>

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
                  : <div style={{ fontSize: 12, color: "rgba(255,255,255,.3)", marginTop: 20 }}>No service data yet</div>}
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

            <div style={S.card}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <div style={S.cardTitle}>Recent patients</div>
                  <div style={S.cardSub}>Latest admissions across branches</div>
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.35)" }}>{stats.recentPatients.length} records</div>
              </div>
              {stats.recentPatients.length === 0 ? (
                <div style={{ fontSize: 13, color: "rgba(255,255,255,.3)", padding: "24px 0", textAlign: "center" }}>No patients found.</div>
              ) : (
                <table style={S.table}>
                  <thead>
                    <tr>{["UHID", "Patient name", "Branch", "Adm type", "Exp. Discharge", "Total charges", "Status", "Adm. Note"].map(h => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}</tr>
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
                        <td style={{ ...S.td, fontSize: 12, color: row.expDod ? "#FAC775" : "rgba(255,255,255,.3)" }}>{row.expDod ? new Date(row.expDod).toLocaleDateString("en-IN") : "—"}</td>
                        <td style={S.td}>{row.total ? `₹${Number(row.total).toLocaleString("en-IN")}` : <span style={{ color: "rgba(255,255,255,.3)" }}>—</span>}</td>
                        <td style={S.td}><span style={statusStyle(row.status)}>{row.status}</span></td>
                        <td style={S.td}><button style={S.dlBtn} onClick={() => downloadAdmissionNote(row.adm?.medicalHistory, row.patientObj, row.adm?.discharge, row.branchKey)}>🖨 Download</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
