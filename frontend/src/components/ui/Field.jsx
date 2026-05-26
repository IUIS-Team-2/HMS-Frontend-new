import React from "react";
const lblStyle = { fontSize: "10px", letterSpacing: "1px", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: "700", marginBottom: "5px" };
const inpStyle = { width: "100%", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "13px", padding: "9px 11px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
const txaStyle = { ...inpStyle, resize: "vertical" };
const ROStyle  = { fontSize: "13px", color: "var(--text)", fontWeight: "600", padding: "9px 0", lineHeight: 1.5, whiteSpace: "pre-wrap" };
export default function Field({ label, value, onChange, type = "text", placeholder = "", colSpan = 1, multiline = false, rows = 3, editable, list }) {
  return (
    <div style={{ gridColumn: `span ${colSpan}`, display: "flex", flexDirection: "column" }}>
      <label style={lblStyle}>{label}</label>
      {editable ? (
        multiline
          ? <textarea rows={rows} placeholder={placeholder} value={value || ""} onChange={e => onChange(e.target.value)} style={txaStyle} />
          : <input type={type} placeholder={placeholder} value={value || ""} onChange={e => onChange(e.target.value)} style={inpStyle} list={list} />
      ) : (
        <div style={ROStyle}>{value || "—"}</div>
      )}
    </div>
  );
}
