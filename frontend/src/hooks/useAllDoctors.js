import { useState, useCallback } from "react";

const BASE_KEY = "medcore_doctors";

/** Read doctors for one branch from localStorage */
function readBranch(branchCode) {
  try { return JSON.parse(sessionStorage.getItem(`${BASE_KEY}_${branchCode}`) || "[]"); }
  catch { return []; }
}

/** Write doctors for one branch back to localStorage */
function writeBranch(branchCode, list) {
  try { sessionStorage.setItem(`${BASE_KEY}_${branchCode}`, JSON.stringify(list)); }
  catch {}
}

/**
 * Returns all doctors across every branch.
 * `branches` must be the same array passed to SuperAdminDashboard
 * (each item has at least { code, slug, name }).
 */
export function useAllDoctors(branches = []) {
  // Build initial state: { [branchCode]: Doctor[] }
  const buildState = useCallback(() => {
    const map = {};
    branches.forEach(b => {
      const code = b.code || b.branch || b.slug || "";
      map[code] = readBranch(code);
    });
    return map;
  }, [branches]);

  const [doctorMap, setDoctorMap] = useState(buildState);

  /** Re-read all branches from localStorage (call after external write) */
  const refresh = useCallback(() => setDoctorMap(buildState()), [buildState]);

  /** Add a doctor to a specific branch */
  const addDoctor = useCallback((branchCode, doctor) => {
    setDoctorMap(prev => {
      const next = { ...prev };
      const list = [...(next[branchCode] || []), { ...doctor, id: Date.now().toString() }];
      next[branchCode] = list;
      writeBranch(branchCode, list);
      return next;
    });
  }, []);

  /** Remove a doctor from a specific branch */
  const removeDoctor = useCallback((branchCode, doctorId) => {
    setDoctorMap(prev => {
      const next = { ...prev };
      const list = (next[branchCode] || []).filter(d => d.id !== doctorId);
      next[branchCode] = list;
      writeBranch(branchCode, list);
      return next;
    });
  }, []);

  /** All doctors as a flat array (each row has _branchCode and _branchName) */
  const allFlat = branches.flatMap(b => {
    const code = b.code || b.branch || b.slug || "";
    return (doctorMap[code] || []).map(d => ({ ...d, _branchCode: code, _branchName: b.name }));
  });

  return { doctorMap, allFlat, addDoctor, removeDoctor, refresh };
}
