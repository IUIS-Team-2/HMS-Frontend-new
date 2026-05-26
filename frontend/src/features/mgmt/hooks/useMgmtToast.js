import { useState } from "react";

export function useMgmtToast() {
  const [notif, setNotif] = useState(null);
  const toast = (msg, type="ok") => {
    setNotif({ msg, type });
    setTimeout(() => setNotif(null), 3200);
  };
  return { notif, toast };
}
