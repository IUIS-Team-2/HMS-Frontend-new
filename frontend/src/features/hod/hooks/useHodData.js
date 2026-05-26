import { useState, useCallback } from "react";
import { BASE_URL } from "../../../services/apiService";

const API_BASE = BASE_URL;

async function apiFetch(path, options = {}) {
  const token = sessionStorage.getItem("hms_token");
  const headers = { "Content-Type":"application/json", ...(token && { Authorization:`Bearer ${token}` }) };
  const res = await fetch(`${API_BASE}${path}`, { headers:{ ...headers, ...(options.headers||{}) }, ...options });
  if (res.status === 401) { sessionStorage.clear(); window.location.href = "/"; return null; }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err.error || err.detail || err.message || "Request failed";
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}

export { apiFetch };

export default function useHodData(toast) {
  const [loading, setLoading] = useState(false);

  const request = useCallback(async (path, options = {}) => {
    setLoading(true);
    try { return await apiFetch(path, options); }
    catch (e) { toast(e.message || "Request failed", "e"); return null; }
    finally { setLoading(false); }
  }, [toast]);

  return { loading, request };
}
