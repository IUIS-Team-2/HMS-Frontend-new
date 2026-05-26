import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { apiService, BASE_URL } from "../../../../services/apiService";
import { DISCHARGE_SECTIONS, DISCHARGE_TYPES, normalizeDischType } from "../../../../constants/billing/dischargeTypes";
import { T, mkBtn } from "../../branchAdminConstants";

const inpStyle = {
  width: "100%", background: "var(--card)", border: "1px solid var(--border)",
  borderRadius: "8px", color: "var(--text)", fontSize: "13px",
  padding: "9px 11px", fontFamily: "inherit", outline: "none",
  boxSizing: "border-box",
};
const txaStyle = { ...inpStyle, resize: "vertical" };
const lblStyle = {
  fontSize: "10px", letterSpacing: "1px", textTransform: "uppercase",
  color: "var(--text-muted)", fontWeight: "700", marginBottom: "5px", display: "block",
};

const VITALS = [
  { k: "bp",    lbl: "BP (mmHg)",   ph: "120/80 mmHg"      },
  { k: "pulse", lbl: "Pulse (/min)",ph: "82/min"            },
  { k: "spo2",  lbl: "SPO2",        ph: "98% On RA"        },
  { k: "temp",  lbl: "Temperature", ph: "98.6°F"            },
  { k: "chest", lbl: "Chest",       ph: "B/L Clear"        },
  { k: "cvs",   lbl: "CVS",         ph: "S1 S2 +"          },
  { k: "cns",   lbl: "CNS",         ph: "Conscious, Oriented"},
  { k: "abd",   lbl: "P/A",         ph: "Soft, Non-tender" },
];

export default function DischargeTab({ selPatient, selectedAdmission, canEditRecords, theme, doctors }) {
  const uhid  = selPatient?.uhid;
  const admNo = selectedAdmission?.admNo;

  // ── header fields (always shown) ──────────────────────────────────────
  const discharge = selectedAdmission?.discharge || {};
  const medical   = selectedAdmission?.medicalHistory || {};

  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState(false);

  // summary_type drives which sections appear
  const rawType    = discharge.dischargeStatus || discharge.status || discharge.summary_type || "LAMA";
  const [sumType,  setSumType]  = useState(normalizeDischType(rawType));

  // header fields
  const [header, setHeader] = useState({
    doa:        (discharge.doa || discharge.doa_date || selectedAdmission?.dateTime || "").slice(0, 10),
    dod:        (discharge.dod || discharge.dod_date || "").slice(0, 10),
    expectedDod:(discharge.expectedDod || "").slice(0, 10),
    ward:       discharge.wardName || discharge.ward || discharge.department || "",
    bed:        discharge.bedNo   || discharge.bed  || discharge.bedNumber   || "",
    doctor:     discharge.doctorName || medical.treatingDoctor || "",
    diagnosis:  discharge.diagnosis  || discharge.finalDiagnosis || medical.provisionalDiagnosis || "",
  });
  const setH = (k, v) => setHeader(p => ({ ...p, [k]: v }));

  // dynamic sections from API
  const [sections, setSections] = useState([]);

  // ── load from API ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!uhid || !admNo) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiService.getDynamicSummary(uhid, admNo, sumType);
        if (!active) return;
        // API returns { content: { sections: [...] } } or { sections: [...] }
        const content = res?.content || res;
        let secs = content?.sections || [];
        // sections may be object (legacy) → convert to array
        if (!Array.isArray(secs)) {
          secs = Object.entries(secs).map(([key, v]) => ({
            key,
            label: v.label || key,
            type:  v.type  || "text",
            value: v.value ?? "",
          }));
        }
        // If backend returned populated sections, use them
        if (secs.length) {
          setSections(secs);
          // Also sync header from API content if richer
          if (content.doa)        setH("doa",        content.doa.slice(0, 10));
          if (content.dod)        setH("dod",        content.dod.slice(0, 10));
          if (content.expectedDod)setH("expectedDod",content.expectedDod.slice(0, 10));
          if (content.ward)       setH("ward",       content.ward);
          if (content.bed)        setH("bed",        content.bed);
          if (content.doctor)     setH("doctor",     content.doctor);
          if (content.diagnosis)  setH("diagnosis",  content.diagnosis);
          if (content.summary_type) setSumType(normalizeDischType(content.summary_type));
        } else {
          // Seed blank sections from local constants
          seedSections(sumType);
        }
      } catch {
        // Fallback: seed blank template from local constants
        seedSections(sumType);
      }
      setLoading(false);
    };
    load();
    return () => { active = false; };
  }, [uhid, admNo, sumType]);

  const seedSections = (type) => {
    const secs = DISCHARGE_SECTIONS[type] || DISCHARGE_SECTIONS.NORMAL;
    setSections(secs.map(sec => ({
      key:   sec.key,
      label: sec.label,
      type:  sec.type || "text",
      rows:  sec.rows || 3,
      value: sec.type === "vitals_grid"
        ? { bp: discharge.bp || "", pulse: discharge.pr || discharge.pulse || "", spo2: discharge.spo2 || "", temp: discharge.temp || "", chest: discharge.chest || "", cvs: discharge.cvs || "", cns: discharge.cns || "", abd: discharge.pa || "" }
        : (discharge[sec.key] || medical[sec.key] || ""),
    })));
  };

  const updateSection = (idx, val) => {
    setSections(prev => prev.map((s, i) => i === idx ? { ...s, value: val } : s));
  };
  const updateVital = (idx, vKey, val) => {
    setSections(prev => prev.map((s, i) => i === idx ? { ...s, value: { ...s.value, [vKey]: val } } : s));
  };

  const handleSave = async () => {
    if (!uhid || !admNo) { toast.error("Patient/Admission info missing."); return; }
    setSaving(true);
    try {
      await apiService.saveDynamicSummary(uhid, admNo, {
        summary_type: sumType,
        content: {
          summary_type: sumType,
          doa:          header.doa,
          dod:          header.dod,
          expectedDod:  header.expectedDod,
          ward:         header.ward,
          bed:          header.bed,
          doctor:       header.doctor,
          diagnosis:    header.diagnosis,
          sections,
        },
      });
      toast.success("Discharge summary saved!");
    } catch { toast.error("Failed to save discharge summary."); }
    setSaving(false);
  };

  const handlePrint = async () => {
    if (!uhid || !admNo) { toast.error("Patient/Admission info missing."); return; }
    const url = `${BASE_URL}/patients/${uhid}/admissions/${admNo}/dynamic-summary/print/?type=${encodeURIComponent(sumType)}`;
    try {
      const res = await fetch(url, {
        headers: { Authorization: "Bearer " + (sessionStorage.getItem("hms_token") || "") },
      });
      if (!res.ok) { toast.error(`Print failed (${res.status})`); return; }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
    } catch { toast.error("Print request failed."); }
  };

  const dtCfg = DISCHARGE_TYPES[sumType] || DISCHARGE_TYPES.NORMAL;

  // ── Discharge type selector pill row ──────────────────────────────────
  const TYPE_OPTIONS = ["NORMAL","RECOVERED","LAMA","REFER","DEATH","DOPR"];

  return (
    <div>
      {/* ── Discharge type label (read from fetched data) ── */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px 18px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 10, letterSpacing: "2px", color: T.textMuted, textTransform: "uppercase", fontWeight: 700 }}>Discharge Type</div>
        <span style={{ padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: `1px solid ${dtCfg.color}`, background: dtCfg.bg, color: dtCfg.color }}>
          {dtCfg.icon} {dtCfg.label}
        </span>
      </div>

      {/* ── Status banner ── */}
      <div style={{ background: dtCfg.bg, border: `2px solid ${dtCfg.border}`, borderRadius: 12, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 24 }}>{dtCfg.icon}</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: dtCfg.color }}>{dtCfg.label} Summary</div>
          <div style={{ fontSize: 11, color: dtCfg.color, opacity: .75, marginTop: 2 }}>
            {canEditRecords ? "All fields are editable · Save then Print PDF" : "View only — cashless patient"}
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {canEditRecords && (
            <button style={{ ...mkBtn("primary", theme), padding: "8px 16px", fontSize: 12 }} onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "💾 Save Summary"}
            </button>
          )}
          <button style={{ ...mkBtn("excel", theme), padding: "8px 16px", fontSize: 12 }} onClick={handlePrint}>
            🖨 Print PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: T.textMuted }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📄</div>
          <div>Loading discharge summary…</div>
        </div>
      ) : (
        <>
          {/* ── Header fields ── */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, marginBottom: 14, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, background: T.surface, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: dtCfg.bg, border: `1px solid ${dtCfg.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>📅</div>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.text, textTransform: "uppercase", letterSpacing: ".04em" }}>Dates & Basic Information</span>
            </div>
            <div style={{ padding: 18 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
                <div><label style={lblStyle}>Date of Admission</label><input style={inpStyle} type="date" value={header.doa} onChange={e => setH("doa", e.target.value)} disabled={!canEditRecords} /></div>
                <div><label style={lblStyle}>Expected Discharge</label><input style={inpStyle} type="date" value={header.expectedDod} onChange={e => setH("expectedDod", e.target.value)} disabled={!canEditRecords} /></div>
                <div><label style={lblStyle}>Actual Discharge (DOD)</label><input style={inpStyle} type="date" value={header.dod} onChange={e => setH("dod", e.target.value)} disabled={!canEditRecords} /></div>
                <div><label style={lblStyle}>Ward</label><input style={inpStyle} value={header.ward} placeholder="e.g. General Ward" onChange={e => setH("ward", e.target.value)} disabled={!canEditRecords} /></div>
                <div><label style={lblStyle}>Bed No.</label><input style={inpStyle} value={header.bed} placeholder="e.g. B-12" onChange={e => setH("bed", e.target.value)} disabled={!canEditRecords} /></div>
                <div>
                  <label style={lblStyle}>Treating Doctor</label>
                  {canEditRecords ? (
                    <div style={{ position: "relative" }}>
                      <input style={inpStyle} value={header.doctor} placeholder="Dr. Name" onChange={e => setH("doctor", e.target.value)} list="dis-doctors-list" />
                      <datalist id="dis-doctors-list">
                        {(doctors || []).map(d => <option key={d.id} value={`Dr. ${d.name}${d.qualification ? " (" + d.qualification + ")" : ""}`} />)}
                      </datalist>
                    </div>
                  ) : (
                    <div style={{ padding: "9px 0", fontSize: 13, fontWeight: 600, color: T.text }}>{header.doctor || "—"}</div>
                  )}
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={lblStyle}>Primary Diagnosis</label>
                  <input style={inpStyle} value={header.diagnosis} placeholder="e.g. Acute Appendicitis" onChange={e => setH("diagnosis", e.target.value)} disabled={!canEditRecords} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Dynamic sections ── */}
          {sections.map((sec, idx) => (
            <div key={sec.key || idx} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, marginBottom: 14, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, background: T.surface, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: dtCfg.bg, border: `1px solid ${dtCfg.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: dtCfg.color }}>{idx + 1}</div>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.text, textTransform: "uppercase", letterSpacing: ".04em" }}>{sec.label}</span>
              </div>
              <div style={{ padding: 18 }}>
                {sec.type === "vitals_grid" ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
                    {VITALS.map(v => (
                      <div key={v.k}>
                        <label style={lblStyle}>{v.lbl}</label>
                        <input
                          style={inpStyle}
                          value={(sec.value && sec.value[v.k]) || ""}
                          placeholder={v.ph}
                          onChange={e => updateVital(idx, v.k, e.target.value)}
                          disabled={!canEditRecords}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  canEditRecords
                    ? <textarea style={txaStyle} rows={sec.rows || 3} value={sec.value || ""} placeholder={`Enter ${sec.label.toLowerCase()}…`} onChange={e => updateSection(idx, e.target.value)} />
                    : <div style={{ fontSize: 13, color: T.text, lineHeight: 1.6, whiteSpace: "pre-wrap", padding: "4px 0" }}>{sec.value || "—"}</div>
                )}
              </div>
            </div>
          ))}

          {/* ── Bottom action bar ── */}
          {canEditRecords && (
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
              <button style={{ ...mkBtn("excel", theme), padding: "9px 20px" }} onClick={handlePrint}>🖨 Print PDF</button>
              <button style={{ ...mkBtn("primary", theme), padding: "9px 20px" }} onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "💾 Save Summary"}</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
