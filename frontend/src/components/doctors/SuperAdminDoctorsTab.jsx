import React, { useState, useMemo } from "react";
import { useAllDoctors } from "../../hooks/useAllDoctors";

const EMPTY_FORM = {
  name: "", qualification: "", specialization: "", regNo: "", phone: "", email: "",
};

export default function SuperAdminDoctorsTab({ branches = [], T, bColor, bName, Pill, StatCard, TH, cardStyle, SD }) {
  const { allFlat, addDoctor, removeDoctor } = useAllDoctors(branches);

  const [modal,      setModal]      = useState(false);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [selBranch,  setSelBranch]  = useState(branches[0]?.code || branches[0]?.branch || "");
  const [filterBr,   setFilterBr]   = useState("all");
  const [search,     setSearch]     = useState("");
  const [error,      setError]      = useState("");

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const fi = {
    width: "100%", padding: "9px 13px", borderRadius: 8,
    border: `1px solid ${T.border2}`, background: T.card,
    color: T.white, fontSize: 13, outline: "none", boxSizing: "border-box",
  };
  const labelSt = {
    fontSize: 11, color: T.dim, fontWeight: 700,
    textTransform: "uppercase", letterSpacing: ".06em",
    marginBottom: 4, display: "block",
  };

  const filtered = useMemo(() => allFlat.filter(d => {
    if (filterBr !== "all" && d._branchCode !== filterBr) return false;
    if (search && ![d.name, d.qualification, d.specialization, d.regNo]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  }), [allFlat, filterBr, search]);

  const submit = e => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Doctor name is required."); return; }
    if (!selBranch)        { setError("Select a branch.");          return; }
    addDoctor(selBranch, form);
    setForm(EMPTY_FORM);
    setModal(false);
    setError("");
  };

  // Per-branch doctor counts for stat cards
  const branchCounts = branches.map(b => {
    const code = b.code || b.branch || b.slug || "";
    return { name: b.name, code, count: allFlat.filter(d => d._branchCode === code).length, color: bColor(b.slug, T) };
  });

  const Th = ({ c }) => (
    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 9, fontWeight: 700,
      color: T.dim, textTransform: "uppercase", letterSpacing: ".06em",
      whiteSpace: "nowrap", background: T.bg }}>{c}</th>
  );

  return (
    <>
      {/* ── Stat Cards ── */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <div style={{ ...cardStyle(T), borderLeft: `4px solid ${T.laxmi}`, flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: 11, color: T.dim, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 5 }}>Total Doctors</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: T.white }}>{allFlat.length}</div>
          <div style={{ fontSize: 11, color: T.dim, marginTop: 3 }}>Across all branches</div>
        </div>
        {branchCounts.map(bc => (
          <div key={bc.code} style={{ ...cardStyle(T), borderLeft: `4px solid ${bc.color}`, flex: 1, minWidth: 140 }}>
            <div style={{ fontSize: 11, color: T.dim, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 5 }}>{bc.name}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: bc.color }}>{bc.count}</div>
            <div style={{ fontSize: 11, color: T.dim, marginTop: 3 }}>Doctors registered</div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
        {/* branch filter */}
        <select value={filterBr} onChange={e => setFilterBr(e.target.value)}
          style={{ padding: "6px 28px 6px 12px", borderRadius: 8, border: `1px solid ${T.border2}`,
            background: T.card, color: T.white, fontSize: 12, fontWeight: 600, cursor: "pointer",
            outline: "none", appearance: "none" }}>
          <option value="all">All Branches</option>
          {branches.filter((b, i, arr) => {
            const code = b.code || b.branch || b.slug || "";
            return arr.findIndex(x => (x.code || x.branch || x.slug || "") === code) === i;
          }).map(b => {
            const code = b.code || b.branch || b.slug || "";
            return <option key={code} value={code}>{b.name}</option>;
          })}
        </select>

        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search name, qualification, specialization..."
          style={{ marginLeft: "auto", padding: "7px 13px", borderRadius: 8,
            border: `1px solid ${T.border2}`, background: T.card, color: T.white,
            fontSize: 13, outline: "none", width: 290 }} />

        <button onClick={() => setModal(true)}
          style={{ padding: "8px 20px", borderRadius: 9, background: T.laxmi, color: "#000",
            border: "none", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
          + Add Doctor
        </button>
      </div>

      {/* ── Table ── */}
      <div style={{ ...cardStyle(T), padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`,
          background: T.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: T.white }}>Doctors Registry — All Branches</div>
          <div style={{ fontSize: 11, color: T.dim }}>{filtered.length} doctors</div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Name","Qualification","Specialization","Reg. No.","Phone","Email","Branch","Action"]
                  .map(c => <Th key={c} c={c} />)}
              </tr>
            </thead>
            <tbody>
              {!filtered.length ? (
                <tr><td colSpan={8} style={{ padding: "48px 20px", textAlign: "center",
                  color: T.dim, fontSize: 12, letterSpacing: "2px" }}>NO DOCTORS REGISTERED YET</td></tr>
              ) : filtered.map((doc, i) => (
                <tr key={doc.id || i} style={{ borderBottom: `1px solid ${T.border}`,
                  background: i % 2 === 0 ? T.card : T.surface }}>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>Dr. {doc.name}</div>
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: 12, color: T.dim }}>{doc.qualification || "—"}</td>
                  <td style={{ padding: "10px 12px", fontSize: 12, color: T.dim }}>{doc.specialization || "—"}</td>
                  <td style={{ padding: "10px 12px", fontSize: 12, color: T.dim }}>{doc.regNo || "—"}</td>
                  <td style={{ padding: "10px 12px", fontSize: 12, color: T.dim }}>{doc.phone || "—"}</td>
                  <td style={{ padding: "10px 12px", fontSize: 12, color: T.dim }}>{doc.email || "—"}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <Pill color={bColor(doc._branchCode, T)}>{doc._branchName}</Pill>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <button onClick={() => removeDoctor(doc._branchCode, doc.id)}
                      style={{ padding: "4px 12px", borderRadius: 7,
                        background: T.red + "15", color: T.red, border: `1px solid ${T.red}44`,
                        fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add Doctor Modal ── */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.82)",
          zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={() => setModal(false)}>
          <div style={{ background: T.surface, borderRadius: 16, padding: 30, width: 540,
            maxHeight: "90vh", overflowY: "auto", border: `1px solid ${T.border}`,
            boxShadow: SD || "0 32px 100px rgba(0,0,0,.7)" }}
            onClick={e => e.stopPropagation()}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: T.white, marginBottom: 4 }}>Add Doctor</div>
                <div style={{ fontSize: 12, color: T.dim }}>Doctor will appear in patient record dropdowns for the selected branch.</div>
              </div>
              <button onClick={() => setModal(false)}
                style={{ background: "rgba(255,255,255,.07)", border: "none",
                  color: T.white, width: 30, height: 30, borderRadius: 7, cursor: "pointer", fontSize: 14 }}>✕</button>
            </div>

            <form onSubmit={submit}>
              {/* Branch selector */}
              <div style={{ marginBottom: 14 }}>
                <label style={labelSt}>Assign to Branch <span style={{ color: T.red }}>*</span></label>
                <select value={selBranch} onChange={e => setSelBranch(e.target.value)}
                  style={{ ...fi, cursor: "pointer" }}>
                  {branches.filter((b, i, arr) => {
                    const code = b.code || b.branch || b.slug || "";
                    return arr.findIndex(x => (x.code || x.branch || x.slug || "") === code) === i;
                  }).map(b => {
                    const code = b.code || b.branch || b.slug || "";
                    return <option key={code} value={code}>{b.name}</option>;
                  })}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 18px" }}>
                {[
                  ["Full Name *",         "name",           "text",  "Deepak Rawat"],
                  ["Qualification *",     "qualification",  "text",  "MBBS, DNB – Urology"],
                  ["Specialization",      "specialization", "text",  "Urology"],
                  ["Registration No.",    "regNo",          "text",  "UK-12345"],
                  ["Phone",               "phone",          "tel",   "+91 98765 43210"],
                  ["Email",               "email",          "email", "dr@hospital.com"],
                ].map(([label, field, type, ph]) => (
                  <div key={field}>
                    <label style={labelSt}>{label}</label>
                    <input type={type} style={fi} value={form[field]} onChange={set(field)} placeholder={ph} />
                  </div>
                ))}
              </div>

              {error && <div style={{ color: T.red, fontSize: 12, marginTop: 10 }}>{error}</div>}

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end",
                marginTop: 20, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                <button type="button" onClick={() => setModal(false)}
                  style={{ padding: "9px 18px", borderRadius: 8, background: "transparent",
                    border: `1px solid ${T.border2}`, color: T.dim, fontWeight: 700, cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit"
                  style={{ padding: "9px 20px", borderRadius: 8, background: T.laxmi,
                    color: "#000", border: "none", fontWeight: 800, cursor: "pointer" }}>
                  Add Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
