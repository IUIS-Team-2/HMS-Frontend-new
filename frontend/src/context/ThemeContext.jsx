import { createContext, useContext, useEffect, useMemo, useState } from "react";

export const ThemeContext = createContext();
const STORAGE_KEY = "hms_theme_mode";
const THEME_MODES = ["system", "light", "dark"];

function getSystemPrefersDark() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    if (typeof window === "undefined") return "system";
    try {
      const savedMode = window.localStorage.getItem(STORAGE_KEY);
      return THEME_MODES.includes(savedMode) ? savedMode : "system";
    } catch {
      return "system";
    }
  });
  const [systemPrefersDark, setSystemPrefersDark] = useState(getSystemPrefersDark);
  const resolvedMode = mode === "system" ? (systemPrefersDark ? "dark" : "light") : mode;
  const isDark = resolvedMode === "dark";
  const theme = isDark ? DARK : LIGHT;

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event) => setSystemPrefersDark(event.matches);

    setSystemPrefersDark(media.matches);
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", handleChange);
      return () => media.removeEventListener("change", handleChange);
    }

    media.addListener(handleChange);
    return () => media.removeListener(handleChange);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, mode);
      } catch {}
    }

    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.dataset.themeMode = mode;
      root.dataset.themeResolved = resolvedMode;
      root.dataset.theme = resolvedMode;
      root.style.colorScheme = resolvedMode;
    }
  }, [mode, resolvedMode]);

  const cycleMode = () => {
    setMode((currentMode) => {
      const currentIndex = THEME_MODES.indexOf(currentMode);
      return THEME_MODES[(currentIndex + 1) % THEME_MODES.length];
    });
  };

  const value = useMemo(() => ({
    mode,
    setMode,
    cycleMode,
    resolvedMode,
    isDark,
    theme,
  }), [mode, resolvedMode, isDark, theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

/* ─────────────────────────────────────────────────────────────────────────────
   Clinical light-blue + slate palette. Mirrors the CSS variables in index.css so
   pages that style inline via `useTheme().theme` and pages that use CSS
   variables stay in lockstep.
   ───────────────────────────────────────────────────────────────────────────── */

const LIGHT = {
  // Brand
  accent:        "#3b82f6",
  accentDim:     "rgba(59,130,246,0.14)",
  accentBorder:  "#93c5fd",
  accentHover:   "#2563eb",
  accent2:       "#1d4ed8",
  accentSoft:    "#dbeafe",
  textOnAccent:  "#ffffff",

  // Surfaces
  bg:            "#f6f8fb",
  bgElev:        "#eef2f7",
  surface:       "#ffffff",
  card:          "#ffffff",
  card2:         "#f8fafc",
  border:        "#e2e8f0",
  border2:       "#cbd5e1",

  // Text
  text:          "#0f172a",
  textMid:       "#334155",
  textMuted:     "#64748b",
  textDim:       "#94a3b8",

  // Semantic
  green:         "#059669",
  greenDim:      "#05966914",
  greenTint:     "#ecfdf5",
  greenBorder:   "#a7f3d0",
  amber:         "#d97706",
  amberDim:      "#d9770614",
  amberTint:     "#fef3c7",
  red:           "#dc2626",
  redDim:        "#dc262614",
  redTint:       "#fef2f2",
  redBorder:     "#fecaca",
  cyan:          "#0284c7",
  cyanDim:       "#0284c714",

  // Sidebar / header
  sidebar:       "#ffffff",
  sidebarBorder: "#e2e8f0",
  hdr:           "#3b82f6",
  hdrBorder:     "rgba(255,255,255,0.14)",

  // Inputs
  inputBg:       "#ffffff",
  inputBorder:   "#cbd5e1",
  modalBg:       "#ffffff",
  modalBorder:   "#e2e8f0",

  // Helpers (kept for back-compat with pages that call theme.badge(...))
  badge: (col) => ({ background: col + "15", color: col, border: `1px solid ${col}35` }),
  shadow:    "0 4px 16px rgba(15, 23, 42, 0.08)",
  shadowMd:  "0 8px 24px rgba(15, 23, 42, 0.10)",
  shadowLg:  "0 16px 40px rgba(15, 23, 42, 0.12)",
};

const DARK = {
  // Brand
  accent:        "#60a5fa",
  accentDim:     "rgba(96,165,250,0.20)",
  accentBorder:  "rgba(96,165,250,0.45)",
  accentHover:   "#93c5fd",
  accent2:       "#bfdbfe",
  accentSoft:    "rgba(59,130,246,0.16)",
  textOnAccent:  "#0b1f44",

  // Surfaces
  bg:            "#0b1220",
  bgElev:        "#0f172a",
  surface:       "#111827",
  card:          "#131c2c",
  card2:         "#182236",
  border:        "#1f2a3d",
  border2:       "#2d3a52",

  // Text
  text:          "#e2e8f0",
  textMid:       "#cbd5e1",
  textMuted:     "#94a3b8",
  textDim:       "#64748b",

  // Semantic
  green:         "#34d399",
  greenDim:      "rgba(52,211,153,0.14)",
  greenTint:     "rgba(52,211,153,0.10)",
  greenBorder:   "rgba(52,211,153,0.35)",
  amber:         "#fbbf24",
  amberDim:      "rgba(251,191,36,0.14)",
  amberTint:     "rgba(251,191,36,0.10)",
  red:           "#f87171",
  redDim:        "rgba(248,113,113,0.16)",
  redTint:       "rgba(248,113,113,0.10)",
  redBorder:     "rgba(248,113,113,0.35)",
  cyan:          "#38bdf8",
  cyanDim:       "rgba(56,189,248,0.14)",

  // Sidebar / header
  sidebar:       "#0d1424",
  sidebarBorder: "#1f2a3d",
  hdr:           "#1e3a8a",
  hdrBorder:     "rgba(96,165,250,0.22)",

  // Inputs
  inputBg:       "#131c2c",
  inputBorder:   "#2d3a52",
  modalBg:       "#131c2c",
  modalBorder:   "#2d3a52",

  badge: (col) => ({ background: col + "22", color: col, border: `1px solid ${col}55` }),
  shadow:    "0 6px 20px rgba(0, 0, 0, 0.45)",
  shadowMd:  "0 12px 30px rgba(0, 0, 0, 0.55)",
  shadowLg:  "0 24px 56px rgba(0, 0, 0, 0.65)",
};
