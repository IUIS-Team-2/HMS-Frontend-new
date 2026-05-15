import React, { useState } from "react";

const EMPTY = { name: "", qualification: "", specialization: "", regNo: "", phone: "", email: "" };

export default function DoctorsView({ doctors, addDoctor, removeDoctor, theme, T, mkBtn, mkInput }) {
  const [modal, setModal] = useState(false);
  const [form,  setForm]  = useState(EMPTY);
  const [error, setError] = useState("");

  const fi = { ...mkInput(), width: "100%" };
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Doctor name is required."); return; }
    addDoctor(form);
    setForm(EMPTY);
    setModal(false);
    setError("");
  };

  const Th = ({ c }) => (
    <th style={{ padding:"10px 16px", textAlign:"left", fontSize:9, letterSpacing:"2px",
      color: T.textMuted, textTransform:"uppercase", borderBottom:`1px solid ${T.border}`,
      background: T.surface, whiteSpace:"nowrap" }}>{c}</th>
  );

  return (
    <>
      {/* Toolbar */}
      <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginBottom:20 }}>
        <button style={mkBtn("primary", theme)} onClick={() => setModal(true)}>+ Add Doctor</button>
      </div>

      {/* Stat */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:22 }}>
        {[
          ["Total Doctors",    doctors.length,                                    theme.primary],
          ["Specialists",      doctors.filter(d => d.specialization).length,      "var(--info)" ],
          ["With Reg. No.",    doctors.filter(d => d.regNo).length,               "var(--success)"],
        ].map(([l, v, c]) => (
          <div key={l} style={{ background:T.card, border:`1px solid ${T.border}`,
            borderTop:`2px solid ${c}`, borderRadius:10, padding:"18px 20px" }}>
            <div style={{ fontSize:9, letterSpacing:"2.5px", color:T.textMuted,
              textTransform:"uppercase", marginBottom:10 }}>{l}</div>
            <div style={{ fontSize:28, fontWeight:800, color:c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, overflow:"hidden",
        boxShadow:`0 18px 40px ${theme.glow||"rgba(0,0,0,0.08)"}` }}>
        <div style={{ padding:"16px 18px", borderBottom:`1px solid ${T.border}`,
          background:T.surface, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:11, fontWeight:700, color:T.text }}>Doctors Registry</div>
          <div style={{ fontSize:10, color:T.textMuted }}>{doctors.length} doctors</div>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead>
              <tr>{["Name & Email","Qualification","Specialization","Reg. No.","Phone","Action"]
                .map(c => <Th key={c} c={c} />)}</tr>
            </thead>
            <tbody>
              {!doctors.length ? (
                <tr><td colSpan={6} style={{ padding:"52px 20px", textAlign:"center",
                  color:T.textMuted, fontSize:10, letterSpacing:"3px" }}>NO DOCTORS ADDED YET</td></tr>
              ) : doctors.map(doc => (
                <tr key={doc.id} style={{ borderBottom:`1px solid ${T.border}22` }}>
                  <td style={{ padding:"12px 16px" }}>
                    <div style={{ fontWeight:600, color:T.text }}>Dr. {doc.name}</div>
                    {doc.email && <div style={{ fontSize:10, color:T.textMuted, marginTop:2 }}>{doc.email}</div>}
                  </td>
                  <td style={{ padding:"12px 16px", color:T.textSub }}>{doc.qualification||"—"}</td>
                  <td style={{ padding:"12px 16px", color:T.textSub }}>{doc.specialization||"—"}</td>
                  <td style={{ padding:"12px 16px", color:T.textSub }}>{doc.regNo||"—"}</td>
                  <td style={{ padding:"12px 16px", color:T.textSub }}>{doc.phone||"—"}</td>
                  <td style={{ padding:"12px 16px" }}>
                    <button style={{ ...mkBtn("danger",theme), padding:"4px 12px", fontSize:10 }}
                      onClick={() => removeDoctor(doc.id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Doctor Modal */}
      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(3,8,18,0.72)", display:"flex",
          alignItems:"center", justifyContent:"center", zIndex:2000, backdropFilter:"blur(8px)" }}
          onClick={() => setModal(false)}>
          <div style={{ background:T.surface, border:`1px solid ${T.borderLight}`, borderRadius:18,
            padding:32, width:520, maxHeight:"88vh", overflowY:"auto",
            boxShadow:`0 30px 80px rgba(0,0,0,0.55), 0 0 0 1px ${theme.primary}24` }}
            onClick={e => e.stopPropagation()}>

            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
              <div>
                <div style={{ fontSize:11, letterSpacing:"0.18em", color:theme.primary,
                  textTransform:"uppercase", marginBottom:6, fontWeight:700 }}>Doctors Registry</div>
                <div style={{ fontSize:26, fontWeight:800, color:T.text, lineHeight:1.1 }}>Add Doctor</div>
                <div style={{ fontSize:13, color:T.textSub, marginTop:6 }}>
                  Name + qualification will appear in patient record dropdowns.
                </div>
              </div>
              <button style={{ ...mkBtn("ghost",theme), padding:"8px 11px" }} onClick={() => setModal(false)}>✕</button>
            </div>

            <form onSubmit={submit}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px 18px" }}>
                {[
                  ["Full Name *",          "name",           "text",  "Deepak Rawat"],
                  ["Qualification *",      "qualification",  "text",  "MBBS, DNB – Urology"],
                  ["Specialization",       "specialization", "text",  "Urology"],
                  ["Registration No.",     "regNo",          "text",  "UK-12345"],
                  ["Phone",                "phone",          "tel",   "+91 98765 43210"],
                  ["Email",                "email",          "email", "dr@hospital.com"],
                ].map(([label, field, type, ph]) => (
                  <div key={field}>
                    <label style={{ display:"block", fontSize:12, fontWeight:700,
                      color:T.textSub, marginBottom:7 }}>{label}</label>
                    <input type={type} style={fi} value={form[field]}
                      onChange={set(field)} placeholder={ph} />
                  </div>
                ))}
              </div>

              {error && <div style={{ color:"var(--danger)", fontSize:12, marginTop:12 }}>{error}</div>}

              <div style={{ display:"flex", gap:10, justifyContent:"flex-end",
                marginTop:24, paddingTop:18, borderTop:`1px solid ${T.border}` }}>
                <button type="button" style={mkBtn("ghost",theme)} onClick={() => setModal(false)}>Cancel</button>
                <button type="submit"  style={mkBtn("primary",theme)}>Add Doctor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
