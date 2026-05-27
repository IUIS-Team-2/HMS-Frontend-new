import { useState, useCallback } from "react";

export function useHodToast() {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((msg, type = "s") => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  return { toasts, toast };
}
