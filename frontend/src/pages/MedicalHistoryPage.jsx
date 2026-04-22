import { useState, useRef, useEffect } from "react";
import { T } from "../data/constants";
import { Ico, IC } from "../components/ui/Icons";

// ─── LAB TEST DATA (segregated from Sangi Hospital PDF) ──────────────────────
const LAB_TESTS = {
  "HAEMATOLOGY": {
    color: "#dc2626", bg: "#fef2f2", border: "#fecaca",
    icon: "🩸",
    subgroups: {
      "Complete Blood Count (CBC)": [
        "Haemoglobin", "TLC (Total Leucocyte Count)", "Polymorphs", "Lymphocyte",
        "Eosinophil", "Monocyte", "Basophil", "PCV", "MCV (Mean Corp Volume)",
        "MCH (Mean Corp Hb)", "MCHC (Mean Corp Hb Conc)", "RBC (Red Blood Cell Count)",
        "Platelet Count", "ESR (Wintrobe)"
      ],
      "Coagulation": [
        "Prothrombin Time (PT)", "INR", "APTT (Activated Partial Thromboplastin Time)",
        "BT (Bleeding Time)", "CT (Clotting Time)", "D-Dimer"
      ],
      "Blood Group & Typing": [
        "Blood Group", "Rh Factor"
      ],
      "Peripheral Smear": [
        "Blood Picture (Peripheral Smear)"
      ]
    }
  },
  "BIOCHEMISTRY": {
    color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe",
    icon: "🧪",
    subgroups: {
      "Kidney Function Test (KFT)": [
        "Blood Urea", "Serum Creatinine", "S.Uric Acid", "Sodium", "Potassium", "Calcium"
      ],
      "Liver Function Test (LFT)": [
        "Serum Bilirubin (Total)", "Conjugated (D Bilirubin)", "Unconjugated (I.D Bilirubin)",
        "SGOT/AST", "SGPT/ALT", "Total Protein", "Albumin", "Globuline", "Alkaline Phosphatase"
      ],
      "Lipid Profile": [
        "Cholesterol Total", "Triglyceride", "Cholesterol HDL", "Cholesterol VLDL",
        "Cholesterol LDL", "LDL/HDL Ratio"
      ],
      "Blood Gas Analysis": [
        "pH", "pCO2", "pO2", "TCO2", "HCO3", "BE", "%SO2C", "Na+", "K+", "Cl", "GLU", "THbc", "HCT"
      ],
      "Glucose": [
        "Blood Glucose Random (RBS)", "Blood Glucose Fasting (FBS)", "Blood Glucose PP",
        "HbA1c (Glycosylated Haemoglobin)", "Mean Plasma Glucose", "Urine Ketone"
      ],
      "Cardiac Markers": [
        "Troponin-T", "Troponin-I", "CPK-MB", "CPK", "NT-proBNP"
      ],
      "Inflammatory Markers": [
        "CRP (Qualitative)", "CRP (Quantitative)", "Serum Procalcitonin"
      ],
      "Pancreatic": [
        "S. Amylase", "S. Lipase"
      ],
      "Vitamins & Minerals": [
        "Vitamin B-12 (Cyanocobalamin)", "25 OH Vitamin D3", "Iron (Serum)",
        "TIBC", "Unsaturated Iron Binding Capacity", "Transferrin Saturation"
      ],
      "Miscellaneous Biochemistry": [
        "Adenosine Deaminase (ADA)", "Homocysteine", "PSA (Prostate Specific Antigen)",
        "SAAG (Serum Ascites Albumin Gradient)", "Albumin Fluid"
      ]
    }
  },
  "ENDOCRINOLOGY": {
    color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe",
    icon: "⚗️",
    subgroups: {
      "Thyroid Profile": [
        "T3 (Free)", "FT4 (Free Thyroxine)", "TSH (Thyroid Stimulating Hormone)",
        "Total Thyroid Profile"
      ]
    }
  },
  "IMMUNOLOGY – SEROLOGY": {
    color: "#b45309", bg: "#fffbeb", border: "#fde68a",
    icon: "🔬",
    subgroups: {
      "Fever Panel": [
        "Widal Test (Slide Method)", "Typhidot IgM", "Typhidot IgG"
      ],
      "Dengue": [
        "Dengue IgM Antibodies", "Dengue IgG Antibodies", "Dengue NS1 Antigen"
      ],
      "Thyroid Autoimmune": [
        "Anti-TPO (Thyroid Peroxidase Antibody)"
      ]
    }
  },
  "MICROBIOLOGY": {
    color: "#065f46", bg: "#ecfdf5", border: "#a7f3d0",
    icon: "🦠",
    subgroups: {
      "Malaria": [
        "Malaria Antigen Test (MP Antigen)", "Plasmodium P.Vivax", "Plasmodium Falciparum"
      ],
      "Viral Markers": [
        "HIV I & II", "Hepatitis B (HBsAg)", "HCV", "COVID-19 Rapid Antigen"
      ],
      "Urine": [
        "Urine Examination (R/M)", "Urine Gram Stain", "Urine C/S (Culture & Sensitivity)"
      ],
      "Blood": [
        "Blood C/S (Culture & Sensitivity)"
      ],
      "Sputum": [
        "Sputum For AFB", "Sputum Gram Stain", "Sputum C/S (Culture & Sensitivity)"
      ],
      "Stool": [
        "Stool R/M (Routine & Microscopy)", "Stool C/S (Culture & Sensitivity)"
      ],
      "Body Fluid": [
        "Body Fluid Cytology", "Body Fluid Routine Analysis", "Ascitic Fluid TLC/DLC"
      ]
    }
  }
};

// ─── InvestigationsDropdown ───────────────────────────────────────────────────
function InvestigationsDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({});
  const [selected, setSelected] = useState(() => {
    const map = {};
    if (value) value.split(", ").forEach(t => { if (t.trim()) map[t.trim()] = true; });
    return map;
  });
  const dropRef = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const str = Object.keys(selected).filter(k => selected[k]).join(", ");
    onChange({ target: { value: str } });
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedCount = Object.values(selected).filter(Boolean).length;

  function toggleTest(test) {
    setSelected(prev => ({ ...prev, [test]: !prev[test] }));
  }

  function toggleDept(deptTests) {
    const allSel = deptTests.every(t => selected[t]);
    const update = {};
    deptTests.forEach(t => { update[t] = !allSel; });
    setSelected(prev => ({ ...prev, ...update }));
  }

  function toggleSubgroup(tests) {
    const allSel = tests.every(t => selected[t]);
    const update = {};
    tests.forEach(t => { update[t] = !allSel; });
    setSelected(prev => ({ ...prev, ...update }));
  }

  function clearAll() { setSelected({}); }

  const searchLower = search.toLowerCase();
  const matchesSearch = t => !search || t.toLowerCase().includes(searchLower);
  const deptHasMatch = dept =>
    !search || Object.values(LAB_TESTS[dept].subgroups).flat().some(matchesSearch);

  return (
    <div ref={dropRef} style={{ position: "relative", width: "100%" }}>
      {/* Trigger */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          fontFamily: "DM Sans,sans-serif", fontSize: 14,
          color: selectedCount ? T.text : T.textLight,
          background: T.white, border: `1.5px solid ${open ? T.accentDeep : T.border}`,
          borderRadius: 10, padding: "11px 14px", width: "100%", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          boxSizing: "border-box", minHeight: 46, transition: "border-color .15s"
        }}
      >
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>
          {selectedCount > 0
            ? `${selectedCount} test${selectedCount > 1 ? "s" : ""} selected`
            : "Select investigations..."}
        </span>
        <span style={{ color: T.textLight, fontSize: 12, flexShrink: 0 }}>{open ? "▴" : "▾"}</span>
      </div>

      {/* Chips */}
      {selectedCount > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 7 }}>
          {Object.keys(selected).filter(k => selected[k]).map(test => (
            <span key={test} style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              background: "#e0f2fe", border: "1px solid #7dd3fc",
              borderRadius: 20, padding: "3px 10px", fontSize: 12, color: "#0369a1"
            }}>
              {test}
              <span
                onClick={e => { e.stopPropagation(); toggleTest(test); }}
                style={{ cursor: "pointer", fontSize: 11, color: "#0284c7", fontWeight: 700, lineHeight: 1 }}
              >×</span>
            </span>
          ))}
          <span
            onClick={clearAll}
            style={{ cursor: "pointer", fontSize: 12, color: "#ef4444", alignSelf: "center", marginLeft: 4 }}
          >Clear all</span>
        </div>
      )}

      {/* Dropdown Panel */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
          background: T.white, border: `1.5px solid ${T.border}`,
          borderRadius: 12, boxShadow: "0 8px 32px rgba(11,37,69,.14)",
          zIndex: 1000, maxHeight: 420, display: "flex", flexDirection: "column",
          overflow: "hidden"
        }}>
          {/* Search */}
          <div style={{ padding: "10px 12px", borderBottom: `1px solid ${T.border}` }}>
            <input
              autoFocus
              placeholder="Search tests..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: "100%", fontFamily: "DM Sans,sans-serif", fontSize: 13,
                border: `1.5px solid ${T.border}`, borderRadius: 8,
                padding: "8px 12px", outline: "none", boxSizing: "border-box",
                color: T.text, background: T.offwhite
              }}
            />
          </div>

          {/* List */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {Object.entries(LAB_TESTS).map(([dept, { color, bg, border, icon, subgroups }]) => {
              if (!deptHasMatch(dept)) return null;
              const allDeptTests = Object.values(subgroups).flat().filter(matchesSearch);
              const deptSelCount = allDeptTests.filter(t => selected[t]).length;
              const deptAllSel = allDeptTests.length > 0 && allDeptTests.every(t => selected[t]);
              const isDeptOpen = expanded[dept] !== false;

              return (
                <div key={dept}>
                  {/* Dept header */}
                  <div
                    onClick={() => setExpanded(p => ({ ...p, [dept]: !isDeptOpen }))}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 14px", background: bg,
                      borderTop: `2px solid ${border}`, cursor: "pointer", userSelect: "none"
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={deptAllSel}
                      ref={el => { if (el) el.indeterminate = deptSelCount > 0 && !deptAllSel; }}
                      onChange={e => { e.stopPropagation(); toggleDept(allDeptTests); }}
                      onClick={e => e.stopPropagation()}
                      style={{ width: 15, height: 15, cursor: "pointer", accentColor: color, flexShrink: 0 }}
                    />
                    <span style={{ fontSize: 14 }}>{icon}</span>
                    <span style={{ flex: 1, fontWeight: 700, fontSize: 13, color, letterSpacing: ".04em" }}>
                      {dept}
                    </span>
                    {deptSelCount > 0 && (
                      <span style={{
                        background: color, color: "#fff", borderRadius: 20,
                        padding: "1px 8px", fontSize: 11, fontWeight: 700
                      }}>{deptSelCount}</span>
                    )}
                    <span style={{ color, fontSize: 11, marginLeft: 4 }}>{isDeptOpen ? "▴" : "▾"}</span>
                  </div>

                  {/* Subgroups */}
                  {isDeptOpen && Object.entries(subgroups).map(([subgroup, tests]) => {
                    const filteredTests = tests.filter(matchesSearch);
                    if (filteredTests.length === 0) return null;
                    const subAllSel = filteredTests.every(t => selected[t]);
                    const subSomeSel = filteredTests.some(t => selected[t]);
                    const isSubOpen = expanded[`${dept}_${subgroup}`] !== false;

                    return (
                      <div key={subgroup}>
                        <div
                          onClick={() => setExpanded(p => ({ ...p, [`${dept}_${subgroup}`]: !isSubOpen }))}
                          style={{
                            display: "flex", alignItems: "center", gap: 9,
                            padding: "8px 14px 8px 28px",
                            background: "#f8fafc", borderBottom: "1px solid #f1f5f9",
                            cursor: "pointer", userSelect: "none"
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={subAllSel}
                            ref={el => { if (el) el.indeterminate = subSomeSel && !subAllSel; }}
                            onChange={e => { e.stopPropagation(); toggleSubgroup(filteredTests); }}
                            onClick={e => e.stopPropagation()}
                            style={{ width: 14, height: 14, cursor: "pointer", accentColor: color, flexShrink: 0 }}
                          />
                          <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "#475569" }}>
                            {subgroup}
                          </span>
                          <span style={{ fontSize: 10, color: "#94a3b8" }}>{isSubOpen ? "▴" : "▾"}</span>
                        </div>

                        {isSubOpen && filteredTests.map(test => (
                          <label
                            key={test}
                            style={{
                              display: "flex", alignItems: "center", gap: 10,
                              padding: "7px 14px 7px 46px", cursor: "pointer", userSelect: "none",
                              borderBottom: "1px solid #f8fafc",
                              background: selected[test] ? bg : "transparent",
                              transition: "background .1s"
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={!!selected[test]}
                              onChange={() => toggleTest(test)}
                              style={{ width: 14, height: 14, cursor: "pointer", accentColor: color, flexShrink: 0 }}
                            />
                            <span style={{
                              fontSize: 13,
                              color: selected[test] ? color : T.text,
                              fontWeight: selected[test] ? 600 : 400
                            }}>{test}</span>
                          </label>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{
            padding: "8px 14px", borderTop: `1px solid ${T.border}`,
            display: "flex", justifyContent: "space-between", alignItems: "center",
            background: T.offwhite
          }}>
            <span style={{ fontSize: 12, color: T.textMuted }}>
              {selectedCount} test{selectedCount !== 1 ? "s" : ""} selected
            </span>
            <button
              onClick={() => setOpen(false)}
              style={{
                padding: "5px 16px", borderRadius: 8, border: "none",
                background: T.accentDeep, color: "#fff",
                fontFamily: "DM Sans,sans-serif", fontSize: 13, fontWeight: 600,
                cursor: "pointer"
              }}
            >Done</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shared form primitives ───────────────────────────────────────────────────
function Field({ label, req, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{
        fontSize: 11, fontWeight: 700, color: T.textMuted,
        textTransform: "uppercase", letterSpacing: ".06em"
      }}>
        {label}{req && <span style={{ color: T.red }}> *</span>}
      </label>
      {children}
    </div>
  );
}

function Inp({ label, req, placeholder, value, onChange, type = "text" }) {
  return (
    <Field label={label} req={req}>
      <input
        type={type} placeholder={placeholder} value={value} onChange={onChange}
        style={{
          fontFamily: "DM Sans,sans-serif", fontSize: 14, color: T.text,
          background: T.white, border: `1.5px solid ${T.border}`,
          borderRadius: 10, padding: "11px 14px", width: "100%", outline: "none",
          boxSizing: "border-box"
        }}
      />
    </Field>
  );
}

function Txta({ label, req, placeholder, value, onChange, rows = 3 }) {
  return (
    <Field label={label} req={req}>
      <textarea
        placeholder={placeholder} value={value} onChange={onChange} rows={rows}
        style={{
          fontFamily: "DM Sans,sans-serif", fontSize: 14, color: T.text,
          background: T.white, border: `1.5px solid ${T.border}`,
          borderRadius: 10, padding: "11px 14px", width: "100%",
          outline: "none", resize: "vertical", boxSizing: "border-box"
        }}
      />
    </Field>
  );
}

function Section({ title, subtitle, icon, children }) {
  return (
    <div style={{
      background: T.white, border: `1px solid ${T.border}`, borderRadius: 16,
      marginBottom: 20, overflow: "hidden", boxShadow: "0 1px 4px rgba(11,37,69,.07)"
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 13, padding: "17px 22px",
        borderBottom: `1px solid ${T.border}`, background: T.offwhite
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, background: T.bgTint,
          border: `1px solid ${T.border}`, display: "flex", alignItems: "center",
          justifyContent: "center", color: T.accentDeep
        }}>
          <Ico d={icon} size={16} sw={1.75} />
        </div>
        <div>
          <p style={{ fontFamily: "DM Serif Display,serif", fontSize: 15, color: T.primary, margin: 0 }}>{title}</p>
          <p style={{ fontSize: 12, color: T.textMuted, margin: "2px 0 0" }}>{subtitle}</p>
        </div>
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  );
}

// ─── Print helpers (unchanged) ────────────────────────────────────────────────
export function AdmissionNotePrint({ data, patient, discharge, locId }) {
  const branchInfo = {
    "laxmi": { name: "Lakshmi Nagar Branch", address: "Lakshmi Nagar, Mathura, Uttar Pradesh - 281004", phone1: "+91-9717444531", phone2: "+91-9717444532", email: "laxminagar@sangihospital.com" },
    "raya": { name: "Raya Branch", address: "Raya, Mathura, Uttar Pradesh - 281204", phone1: "+91-9311212090", phone2: "+91-9311212091", email: "info@sangihospital.com" },
  };
  const branch = branchInfo[locId] || branchInfo["laxmi"];
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
  const nowTime = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });

  const investigationsText = [data?.investigations, data?.investigationsCustom].filter(Boolean).join(", ");

  return (
    <div id="admission-note-print" style={{ fontFamily: "Arial,sans-serif", fontSize: 12, color: "#000", padding: "24px 32px", background: "#fff", maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #000", paddingBottom: 10, marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/logo512.png" alt="Sangi Hospital" style={{ width: 64, height: 64, objectFit: "contain", borderRadius: 12 }} />
          <div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#1a5b8c", letterSpacing: 2, lineHeight: 1 }}>SANGi</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#d93838", letterSpacing: 4 }}>HOSPITAL</div>
          </div>
        </div>
        <div style={{ textAlign: "right", fontSize: 11, color: "#444", lineHeight: 1.8 }}>
          <div>Add.: {branch.address}</div>
          <div>Ph.: {branch.phone1}, {branch.phone2}</div>
          <div>Email: {branch.email}</div>
          <div>Web.: www.sangihospital.com</div>
        </div>
      </div>
      <div style={{ textAlign: "center", fontSize: 16, fontWeight: 900, letterSpacing: 2, borderBottom: "1px solid #000", paddingBottom: 8, marginBottom: 10 }}>ADMISSION NOTE</div>
      <div style={{ display: "flex", gap: 24, marginBottom: 10, flexWrap: "wrap" }}>
        <div><strong>Name of the Patient: </strong><u>{(patient?.patientName || "—").toUpperCase()}</u></div>
        <div><strong>Age/Sex: </strong><u>{patient?.ageYY || "—"}Y / {(patient?.gender || "—").toUpperCase()}</u></div>
        <div><strong>IPD NO: </strong><u>SH/{discharge?.department?.substring(0, 4)?.toUpperCase() || "GEN"}/26/001</u></div>
      </div>
      <div style={{ display: "flex", gap: 24, marginBottom: 14, flexWrap: "wrap" }}>
        <div><strong>Card No: </strong><u>{patient?.tpaCard || patient?.tpaPanelCardNo || "—"}</u></div>
        <div><strong>WARD/Bed NO: </strong><u>{discharge?.wardName || "—"}</u></div>
        <div><strong>Date: </strong><u>{today} AT {nowTime} HR</u></div>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12 }}>
        <tbody>
          <tr>
            <td style={{ border: "1px solid #000", padding: "10px 12px", width: "50%", verticalAlign: "top" }}>
              <div style={{ fontWeight: 900, fontSize: 12, marginBottom: 6 }}>PRESENT COMPLAINTS-</div>
              <div style={{ fontSize: 12, whiteSpace: "pre-wrap", minHeight: 60 }}>{data?.presentComplaints || "—"}</div>
              {data?.chiefComplaints && <><div style={{ fontWeight: 700, marginTop: 8 }}>C/O-</div><div style={{ whiteSpace: "pre-wrap" }}>{data.chiefComplaints}</div></>}
            </td>
            <td style={{ border: "1px solid #000", padding: "10px 12px", width: "50%", verticalAlign: "top" }}>
              <div style={{ fontWeight: 900, fontSize: 12, marginBottom: 6 }}>INVESTIGATIONS-</div>
              <div style={{ fontSize: 12, whiteSpace: "pre-wrap", minHeight: 60 }}>{investigationsText || "—"}</div>
            </td>
          </tr>
          <tr>
            <td style={{ border: "1px solid #000", padding: "10px 12px", verticalAlign: "top" }}>
              <div style={{ fontWeight: 900, fontSize: 12, marginBottom: 6 }}>PAST HISTORY-</div>
              <div style={{ fontSize: 12, whiteSpace: "pre-wrap", minHeight: 40 }}>{[data?.previousDiagnosis, data?.pastSurgeries].filter(Boolean).join("\n") || "—"}</div>
            </td>
            <td style={{ border: "1px solid #000", padding: "10px 12px", verticalAlign: "top" }}>
              <div style={{ fontWeight: 900, fontSize: 12, marginBottom: 6 }}>TREATMENT ADVISED-</div>
              <div style={{ fontSize: 12, whiteSpace: "pre-wrap", minHeight: 40 }}>{data?.treatmentAdvised || "—"}</div>
            </td>
          </tr>
          <tr>
            <td style={{ border: "1px solid #000", padding: "10px 12px", verticalAlign: "top" }}>
              <div style={{ fontWeight: 900, fontSize: 12, marginBottom: 8 }}>EXAMINATIONS-</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px", fontSize: 12 }}>
                {[["BP", data?.bp], ["PR", data?.pr], ["SPO2", data?.spo2], ["TEMP", data?.temp]].map(([k, v]) => (
                  <div key={k}><strong>{k}= </strong>{v || "—"}</div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px", fontSize: 12, marginTop: 6 }}>
                {[["Chest", data?.chest], ["CVS", data?.cvs], ["CNS", data?.cns], ["P/A", data?.pa]].map(([k, v]) => (
                  <div key={k}><strong>{k}: </strong>{v || "—"}</div>
                ))}
              </div>
            </td>
            <td style={{ border: "1px solid #000", padding: "10px 12px", verticalAlign: "top" }}>
              <div style={{ fontWeight: 900, fontSize: 12, marginBottom: 6 }}>PROVISIONAL DIAGNOSIS-</div>
              <div style={{ fontSize: 12, whiteSpace: "pre-wrap", minHeight: 40 }}>{data?.provisionalDiagnosis || discharge?.diagnosis || "—"}</div>
            </td>
          </tr>
        </tbody>
      </table>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 40, fontSize: 12 }}>
        <div style={{ textAlign: "center", minWidth: 160 }}>
          <div style={{ borderTop: "1px solid #000", paddingTop: 6, fontWeight: 700 }}>Adv.</div>
          <div style={{ color: "#555", marginTop: 4 }}>{data?.treatingDoctor || discharge?.doctorName || "—"}</div>
        </div>
        <div style={{ textAlign: "center", minWidth: 160 }}>
          <div style={{ borderTop: "1px solid #000", paddingTop: 6, fontWeight: 700 }}>Consultant</div>
        </div>
        <div style={{ textAlign: "center", minWidth: 160 }}>
          <div style={{ borderTop: "1px solid #000", paddingTop: 6, fontWeight: 700 }}>DOCTOR SIGNATURE</div>
        </div>
      </div>
    </div>
  );
}

export function downloadAdmissionNote(data, patient, discharge, locId) {
  const printWindow = window.open("", "_blank", "width=900,height=700");
  const branchInfo = {
    "laxmi": { address: "Lakshmi Nagar, Mathura, Uttar Pradesh - 281004", phone1: "+91-9717444531", phone2: "+91-9717444532", email: "laxminagar@sangihospital.com" },
    "raya": { address: "Raya, Mathura, Uttar Pradesh - 281204", phone1: "+91-9311212090", phone2: "+91-9311212091", email: "info@sangihospital.com" },
  };
  const branch = branchInfo[locId] || branchInfo["laxmi"];
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
  const nowTime = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
  const investigationsText = [data?.investigations, data?.investigationsCustom].filter(Boolean).join(", ");

  printWindow.document.write(`
    <!DOCTYPE html><html><head><title>Admission Note - ${patient?.patientName || ""}</title>
    <style>
      body{font-family:Arial,sans-serif;font-size:12px;color:#000;padding:24px 32px;margin:0}
      table{width:100%;border-collapse:collapse}
      td{border:1px solid #000;padding:10px 12px;vertical-align:top;width:50%}
      .pre{white-space:pre-wrap;min-height:50px}
      @media print{@page{size:A4;margin:10mm}}
    </style></head><body>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:10px">
      <div style="display:flex;align-items:center;gap:12px">
        <img src="/sangi-logo.png" onerror="this.src='/logo512.png'" alt="Sangi Hospital" style="width:64px;height:64px;object-fit:contain;border-radius:12px"/>
        <div>
          <div style="font-size:28px;font-weight:900;color:#1a5b8c;letter-spacing:2px;line-height:1">SANGi</div>
          <div style="font-size:13px;font-weight:700;color:#d93838;letter-spacing:4px">HOSPITAL</div>
        </div>
      </div>
      <div style="text-align:right;font-size:11px;color:#444;line-height:1.8">
        <div>Add.: ${branch.address}</div>
        <div>Ph.: ${branch.phone1}, ${branch.phone2}</div>
        <div>Email: ${branch.email}</div>
        <div>Web.: www.sangihospital.com</div>
      </div>
    </div>
    <div style="text-align:center;font-size:16px;font-weight:900;letter-spacing:2px;border-bottom:1px solid #000;padding-bottom:8px;margin-bottom:10px">ADMISSION NOTE</div>
    <div style="display:flex;gap:24px;margin-bottom:8px;flex-wrap:wrap">
      <div><strong>Name of the Patient: </strong><u>${(patient?.patientName || "—").toUpperCase()}</u></div>
      <div><strong>Age/Sex: </strong><u>${patient?.ageYY || "—"}Y / ${(patient?.gender || "—").toUpperCase()}</u></div>
      <div><strong>IPD NO: </strong><u>SH/${discharge?.department?.substring(0, 4)?.toUpperCase() || "GEN"}/26/001</u></div>
    </div>
    <div style="display:flex;gap:24px;margin-bottom:14px;flex-wrap:wrap">
      <div><strong>Card No: </strong><u>${patient?.tpaCard || patient?.tpaPanelCardNo || "—"}</u></div>
      <div><strong>WARD/Bed NO: </strong><u>${discharge?.wardName || "—"}</u></div>
      <div><strong>Date: </strong><u>${today} AT ${nowTime} HR</u></div>
    </div>
    <table>
      <tr>
        <td><strong>PRESENT COMPLAINTS-</strong><div class="pre">${data?.presentComplaints || "—"}</div>${data?.chiefComplaints ? `<strong>C/O-</strong><div class="pre">${data.chiefComplaints}</div>` : ""}</td>
        <td><strong>INVESTIGATIONS-</strong><div class="pre">${investigationsText || "—"}</div></td>
      </tr>
      <tr>
        <td><strong>PAST HISTORY-</strong><div class="pre">${[data?.previousDiagnosis, data?.pastSurgeries].filter(Boolean).join("\n") || "—"}</div></td>
        <td><strong>TREATMENT ADVISED-</strong><div class="pre">${data?.treatmentAdvised || "—"}</div></td>
      </tr>
      <tr>
        <td>
          <strong>EXAMINATIONS-</strong><br/>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;margin-top:6px">
            <div><strong>BP= </strong>${data?.bp || "—"}</div>
            <div><strong>Chest: </strong>${data?.chest || "—"}</div>
            <div><strong>PR= </strong>${data?.pr || "—"}</div>
            <div><strong>CVS: </strong>${data?.cvs || "—"}</div>
            <div><strong>SPO2= </strong>${data?.spo2 || "—"}</div>
            <div><strong>CNS: </strong>${data?.cns || "—"}</div>
            <div><strong>TEMP= </strong>${data?.temp || "—"}</div>
            <div><strong>P/A: </strong>${data?.pa || "—"}</div>
          </div>
        </td>
        <td><strong>PROVISIONAL DIAGNOSIS-</strong><div class="pre">${data?.provisionalDiagnosis || discharge?.diagnosis || "—"}</div></td>
      </tr>
    </table>
    <div style="display:flex;justify-content:space-between;margin-top:50px">
      <div style="text-align:center;min-width:160px"><div style="border-top:1px solid #000;padding-top:6px;font-weight:700">Adv.</div><div style="color:#555;margin-top:4px">${data?.treatingDoctor || discharge?.doctorName || "—"}</div></div>
      <div style="text-align:center;min-width:160px"><div style="border-top:1px solid #000;padding-top:6px;font-weight:700">Consultant</div></div>
      <div style="text-align:center;min-width:160px"><div style="border-top:1px solid #000;padding-top:6px;font-weight:700">DOCTOR SIGNATURE</div></div>
    </div>
    <script>window.onload=()=>{window.print();}<\/script>
    </body></html>
  `);
  printWindow.document.close();
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MedicalHistoryPage({ data, setData, onSave, onSkip, patient, discharge, locId }) {
  const set = k => e => setData(p => ({ ...p, [k]: e.target.value }));
  const isFilled = data.presentComplaints || data.previousDiagnosis || data.provisionalDiagnosis;

  return (
    <div style={{ padding: "32px 44px 80px", animation: "fadeUp .3s ease both", fontFamily: "DM Sans,sans-serif" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "DM Serif Display,serif", fontSize: 26, color: T.primary, marginBottom: 5 }}>Medical History</h1>
            <p style={{ fontSize: 14, color: T.textMuted }}>Record admission note — complaints, examinations and treatment</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{
              padding: "6px 14px", borderRadius: 20,
              background: isFilled ? T.greenTint : T.amberTint,
              border: `1px solid ${isFilled ? T.greenBorder : "#FDE68A"}`,
              fontSize: 12, fontWeight: 600, color: isFilled ? T.green : T.amber
            }}>
              {isFilled ? "✓ History Added" : "⚠ Not Filled"}
            </div>
          </div>
        </div>
      </div>

      {/* Present Complaints */}
      <Section title="Present Complaints" subtitle="Chief complaints and presenting symptoms" icon={IC.pulse}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <Txta label="Present Complaints" req placeholder="Patient presented in Department of Emergency Medicine..." value={data.presentComplaints || ""} onChange={set("presentComplaints")} rows={4} />
          <Txta label="C/O (Chief Complaints)" placeholder="Severe pain at Rt. Iliac fossa, fever with chills..." value={data.chiefComplaints || ""} onChange={set("chiefComplaints")} rows={4} />
        </div>
      </Section>

      {/* Examinations */}
      <Section title="Examinations" subtitle="Vitals and clinical examination findings" icon={IC.pulse}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 16 }}>
          <Inp label="BP (mmHg)" placeholder="e.g. 120/80mmHg" value={data.bp || ""} onChange={set("bp")} />
          <Inp label="PR (/min)" placeholder="e.g. 82/min" value={data.pr || ""} onChange={set("pr")} />
          <Inp label="SPO2" placeholder="e.g. 98% On RA" value={data.spo2 || ""} onChange={set("spo2")} />
          <Inp label="TEMP" placeholder="e.g. 98.6°F" value={data.temp || ""} onChange={set("temp")} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          <Inp label="Chest" placeholder="e.g. B/L Crepts+" value={data.chest || ""} onChange={set("chest")} />
          <Inp label="CVS" placeholder="e.g. S1 S2 +" value={data.cvs || ""} onChange={set("cvs")} />
          <Inp label="CNS" placeholder="e.g. Conscious" value={data.cns || ""} onChange={set("cns")} />
          <Inp label="P/A" placeholder="e.g. Distended" value={data.pa || ""} onChange={set("pa")} />
        </div>
      </Section>

      {/* Investigations & Diagnosis */}
      <Section title="Investigations & Diagnosis" subtitle="Tests ordered and provisional diagnosis" icon={IC.file}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* LEFT: dropdown + custom */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Investigations">
              <InvestigationsDropdown
                value={data.investigations || ""}
                onChange={set("investigations")}
              />
            </Field>
            <Txta
              label="Additional / Custom Tests"
              placeholder="Any other tests not listed above..."
              value={data.investigationsCustom || ""}
              onChange={set("investigationsCustom")}
              rows={2}
            />
          </div>
          {/* RIGHT: diagnosis */}
          <Txta
            label="Provisional Diagnosis"
            req
            placeholder="Acute Retention of Urine with ?UTI..."
            value={data.provisionalDiagnosis || ""}
            onChange={set("provisionalDiagnosis")}
            rows={6}
          />
        </div>
      </Section>

      {/* Treatment & Past History */}
      <Section title="Treatment & Past History" subtitle="Treatment advised and past medical history" icon={IC.wallet}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
          <Txta label="Treatment Advised" req placeholder="IV Fluids NS/RL @ 100ml/hr, Inj. Esomac 40mg IV BD..." value={data.treatmentAdvised || ""} onChange={set("treatmentAdvised")} rows={5} />
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Txta label="Past History / Previous Diagnosis" placeholder="Diabetes, Hypertension, previous surgeries..." value={data.previousDiagnosis || ""} onChange={set("previousDiagnosis")} rows={2} />
            <Txta label="Past Surgeries" placeholder="e.g. Appendectomy 2018..." value={data.pastSurgeries || ""} onChange={set("pastSurgeries")} rows={2} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <Txta label="Current Medications" placeholder="e.g. Metformin 500mg, Amlodipine 5mg..." value={data.currentMedications || ""} onChange={set("currentMedications")} rows={2} />
          <Txta label="Known Allergies" placeholder="e.g. Penicillin, Sulfa drugs..." value={data.knownAllergies || ""} onChange={set("knownAllergies")} rows={2} />
        </div>
      </Section>

      {/* Doctor */}
      <Section title="Treating Doctor & Notes" subtitle="Doctor details and additional clinical notes" icon={IC.doctor}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <Inp label="Treating Doctor" placeholder="Dr. Full Name & Speciality" value={data.treatingDoctor || ""} onChange={set("treatingDoctor")} />
          <Inp label="Qualification & Reg. No." placeholder="MBBS (Mp), DNB (Urology), No. 35942" value={data.doctorQual || ""} onChange={set("doctorQual")} />
          <div style={{ gridColumn: "span 2" }}>
            <Txta label="Additional Notes / Remarks" placeholder="Any other relevant clinical information..." value={data.notes || ""} onChange={set("notes")} rows={2} />
          </div>
        </div>
      </Section>

      {/* Action buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8, justifyContent: "space-between" }}>
        <button onClick={onSkip} style={{
          padding: "11px 26px", borderRadius: 10, border: `1.5px solid ${T.border}`,
          background: T.white, color: T.textMid, fontFamily: "DM Sans,sans-serif",
          fontSize: 14, fontWeight: 600, cursor: "pointer"
        }}>
          Skip for now →
        </button>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => downloadAdmissionNote(data, patient, discharge, locId)}
            style={{
              padding: "11px 26px", borderRadius: 10, border: `1.5px solid ${T.accentDeep}`,
              background: T.white, color: T.accentDeep, fontFamily: "DM Sans,sans-serif",
              fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8
            }}
          >
            🖨 Preview Admission Note
          </button>
          <button
            onClick={onSave}
            style={{
              padding: "11px 26px", borderRadius: 10, border: "none",
              background: `linear-gradient(135deg,${T.accentDeep},${T.primary})`,
              color: "#fff", fontFamily: "DM Sans,sans-serif", fontSize: 14, fontWeight: 600,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
              boxShadow: "0 4px 16px rgba(14,165,233,.32)"
            }}
          >
            <Ico d={IC.check} size={15} sw={2.5} /> Save & Continue →
          </button>
        </div>
      </div>
    </div>
  );
}