// Shared hook — gives any dashboard the branch list
import { useState, useEffect } from "react";
import { apiService } from "../services/apiService";

export function useBranches() {
  const [branches, setBranches] = useState(() => {
    try {
      const raw = sessionStorage.getItem("hms_branches");
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  useEffect(() => {
    apiService.getHospitalBranches()
      .then((rows) => {
        const normalized = (Array.isArray(rows) ? rows : []).map((row, i) => ({
          id: row.id ?? row.branch ?? i,
          code: String(row.branch || "").toUpperCase(),
          slug: String(row.slug || row.branch || `branch-${i+1}`).toLowerCase(),
          name: row.branch_name || row.branch || `Branch ${i+1}`,
        }));
        setBranches(normalized);
        try { sessionStorage.setItem("hms_branches", JSON.stringify(normalized)); } catch {}
      })
      .catch(() => {});
  }, []);

  return branches;
}
