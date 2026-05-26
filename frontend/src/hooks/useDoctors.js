import { useState, useEffect } from "react";

const BASE_KEY = "medcore_doctors";

export function useDoctors(branchCode = "default") {
  const key = `${BASE_KEY}_${branchCode}`;

  const [doctors, setDoctors] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(key) || "[]"); }
    catch { return []; }
  });

  useEffect(() => {
    try { sessionStorage.setItem(key, JSON.stringify(doctors)); }
    catch {}
  }, [doctors, key]);

  const addDoctor    = (doc) => setDoctors(p => [...p, { ...doc, id: Date.now().toString() }]);
  const removeDoctor = (id)  => setDoctors(p => p.filter(d => d.id !== id));
  const updateDoctor = (id, patch) => setDoctors(p => p.map(d => d.id === id ? { ...d, ...patch } : d));

  return { doctors, addDoctor, removeDoctor, updateDoctor };
}
