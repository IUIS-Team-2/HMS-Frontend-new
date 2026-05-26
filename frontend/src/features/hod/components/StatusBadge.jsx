import React from "react";
import { STATUS_META } from "../constants/hodConstants";

export default function StatusBadge({ status }) {
  const key = String(status ?? "").trim().toLowerCase().replace(/\s+/g, "-");
  const metaKey = key === "inprogress" ? "in-progress" : key;
  const m = STATUS_META[metaKey] || STATUS_META.pending;
  return (
    <span className="hod-badge" style={{ background: m.bg, color: m.text, borderColor: m.border }}>
      {m.label}
    </span>
  );
}
