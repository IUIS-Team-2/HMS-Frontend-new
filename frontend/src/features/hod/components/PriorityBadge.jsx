import React from "react";
import { PRIORITY_META } from "../constants/hodConstants";

export default function PriorityBadge({ priority }) {
  const raw = String(priority ?? "Medium").trim();
  const key = raw.length ? raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase() : "Medium";
  const m = PRIORITY_META[key] || PRIORITY_META.Medium;
  return (
    <span className="hod-badge" style={{ background: m.bg, color: m.color, borderColor: m.color + "40" }}>
      {priority}
    </span>
  );
}
