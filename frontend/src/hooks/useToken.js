// Shared hook — gives any component the auth token safely
export function useToken() {
  try {
    return sessionStorage.getItem("hms_token") || null;
  } catch { return null; }
}
