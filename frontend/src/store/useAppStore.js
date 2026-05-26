// Global store — replaces scattered sessionStorage reads across all dashboards
// Usage in any component: const user = useAppStore(s => s.currentUser);
import { create } from "zustand";

export const useAppStore = create((set) => ({
  // Auth
  currentUser: (() => {
    try { const u = sessionStorage.getItem("hms_currentUser"); return u ? JSON.parse(u) : null; } catch { return null; }
  })(),
  token: (() => { try { return sessionStorage.getItem("hms_token"); } catch { return null; } })(),
  isLoggedIn: (() => { try { return sessionStorage.getItem("hms_loggedIn") === "true"; } catch { return false; } })(),

  // Branches
  branches: (() => {
    try { const b = sessionStorage.getItem("hms_branches"); return b ? JSON.parse(b) : []; } catch { return []; }
  })(),

  // Navigation
  currentPage: (() => { try { return sessionStorage.getItem("hms_page") || "patient"; } catch { return "patient"; } })(),
  currentLocation: (() => { try { return sessionStorage.getItem("hms_locId") || "laxmi"; } catch { return "laxmi"; } })(),

  // Actions
  setCurrentUser: (user) => {
    sessionStorage.setItem("hms_currentUser", JSON.stringify(user));
    set({ currentUser: user });
  },
  setToken: (token) => {
    sessionStorage.setItem("hms_token", token);
    set({ token });
  },
  setLoggedIn: (val) => {
    sessionStorage.setItem("hms_loggedIn", String(val));
    set({ isLoggedIn: val });
  },
  setBranches: (branches) => {
    sessionStorage.setItem("hms_branches", JSON.stringify(branches));
    set({ branches });
  },
  setCurrentPage: (page) => {
    sessionStorage.setItem("hms_page", page);
    set({ currentPage: page });
  },
  setCurrentLocation: (loc) => {
    sessionStorage.setItem("hms_locId", loc);
    set({ currentLocation: loc });
  },
  logout: () => {
    sessionStorage.clear();
    set({ currentUser: null, token: null, isLoggedIn: false });
  },
}));
