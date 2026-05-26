import React from "react";
export default function FilterBar({ search, setSearch, statusFil, setStatusFil, onExport, exportLabel, mkInput, mkBtn, theme }) {
  return (
    <div style={{ display: "flex", gap: "10px", marginBottom: "18px", flexWrap: "wrap", alignItems: "center" }}>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>⌕</span>
        <input style={{ ...mkInput(), paddingLeft: "30px", width: "220px" }} placeholder="Search name / ID..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <select style={{ ...mkInput(), cursor: "pointer" }} value={statusFil} onChange={e => setStatusFil(e.target.value)}>
        <option value="all">All Status</option>
        <option value="admitted">Admitted</option>
        <option value="discharged">Discharged</option>
        <option value="pending">Pending</option>
      </select>
      <button style={{ ...mkBtn("excel", theme), marginLeft: "auto" }} onClick={onExport}>↓ {exportLabel}</button>
    </div>
  );
}
