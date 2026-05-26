// Shared hook — gives any dashboard the current logged-in user
import { useState, useEffect } from "react";

export function useCurrentUser() {
  const [user, setUser] = useState(() => {
    try {
      const u = sessionStorage.getItem("hms_currentUser");
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  });

  useEffect(() => {
    const raw = sessionStorage.getItem("hms_currentUser");
    if (raw) setUser(JSON.parse(raw));
  }, []);

  return user;
}
