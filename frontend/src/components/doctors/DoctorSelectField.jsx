import React, { useState, useRef, useEffect, useMemo } from "react";

/**
 * Module-scope so React never remounts it on parent re-render.
 * On doctor pick: fills name field + fires onSelectDoctor(doc)
 * so the parent can also fill qualification, reg no, etc.
 */
export default function DoctorSelectField({
  doctors = [],
  value = "",
  onChange,
  onSelectDoctor,
  editable,
  label,
  placeholder = "Select or type doctor name…",
  colSpan = 1,
}) {
  const [open, setOpen] = useState(false);
  const wRef = useRef(null);

  useEffect(() => {
    const h = e => {
      if (wRef.current && !wRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = useMemo(() => {
    const lq = (value || "").replace(/^dr\.\s*/i, "").trim().toLowerCase();
    if (!lq) return doctors.slice(0, 25);
    return doctors.filter(d => {

  const name =
    d.name ||
    d.doctor_name ||
    d.doctorName ||
    d.full_name ||
    "";

  const qualification =
    d.qualification ||
    d.degree ||
    d.doctor_qualification ||
    "";

  const specialization =
    d.specialization ||
    d.speciality ||
    "";

  return (
    name.toLowerCase().includes(lq) ||
    qualification.toLowerCase().includes(lq) ||
    specialization.toLowerCase().includes(lq)
  );

}).slice(0, 25);
  }, [value, doctors]);

  const lbl = {
    fontSize: "10px", letterSpacing: "1px", textTransform: "uppercase",
    color: "var(--text-muted)", fontWeight: "700", marginBottom: "5px",
  };
  const inp = {
    width: "100%", background: "var(--card)", border: "1px solid var(--border)",
    borderRadius: "8px", color: "var(--text)", fontSize: "13px",
    padding: "9px 11px", fontFamily: "inherit", outline: "none", boxSizing: "border-box",
  };
  const ro = {
    fontSize: "13px", color: "var(--text)", fontWeight: "600",
    padding: "9px 0", lineHeight: 1.5,
  };

  return (
    <div ref={wRef} style={{ gridColumn: `span ${colSpan}`, display: "flex", flexDirection: "column", position: "relative" }}>
      <label style={lbl}>{label}</label>

      {editable ? (
        <>
          <input
            type="text"
            placeholder={placeholder}
            value={value || ""}
            onChange={e => { onChange(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            style={inp}
          />

          {open && doctors.length > 0 && (
            <div style={{
              position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
              zIndex: 99999, maxHeight: 230, overflowY: "auto",
              background: "#fff", border: "1px solid #e2e8f0",
              borderRadius: 10, boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
            }}>
              {filtered.length === 0 ? (
                <div style={{ padding: "10px 14px", fontSize: 12, color: "#94a3b8" }}>
                  No matching doctors
                </div>
              ) : filtered.map(doc => (
                <div
                  key={doc.id}
                  onMouseDown={e => {
                    e.preventDefault();
                  const fullName = `Dr. ${
  doc.name ||
  doc.doctor_name ||
  doc.doctorName ||
  doc.full_name ||
  ""
}`;
                    onChange(fullName);
                    onSelectDoctor?.(doc);
                    setOpen(false);
                  }}
                  style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f1f5f9" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f0f9ff"}
                  onMouseLeave={e => e.currentTarget.style.background = ""}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                  Dr. {
  doc.name ||
  doc.doctor_name ||
  doc.doctorName ||
  doc.full_name ||
  ""
}
                  </div>
                {((doc.qualification || doc.degree || doc.doctor_qualification) || (doc.specialization || doc.speciality)) && (
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                    [(doc.qualification || doc.degree || doc.doctor_qualification), (doc.specialization || doc.speciality)].filter(Boolean).join(" · ")
                    </div>
                  )}
                  {doc.regNo && (
                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>
                      Reg: {doc.regNo}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div style={ro}>{value || "—"}</div>
      )}
    </div>
  );
}
