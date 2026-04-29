import { createContext, useContext, useEffect, useMemo, useState } from "react";

export const ThemeContext = createContext();
const STORAGE_KEY = "hms_theme_mode";
const THEME_MODES = ["system", "light", "dark"];

function getSystemPrefersDark() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return true;
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
      document.documentElement.dataset.themeMode = mode;
      document.documentElement.dataset.themeResolved = resolvedMode;
      document.documentElement.style.colorScheme = resolvedMode;
      document.body.style.backgroundColor = theme.bg;
      document.body.style.color = theme.text;
    }
  }, [mode, resolvedMode, theme.bg, theme.text]);

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

// ── PURPLE/VIOLET DARK THEME ─────────────────────────────────
const DARK = {
  accent:      "#a78bfa",
  accentDim:   "#a78bfa18",
  accentBorder:"#a78bfa35",
  accentHover: "#c4b5fd",
  accent2:     "#7c3aed",

  bg:          "#0d0b14",
  surface:     "#120f1e",
  card:        "#1a1628",
  card2:       "#201c30",
  border:      "#2a2040",
  border2:     "#362a52",

  text:        "#f0ebff",
  textMid:     "#c4b5fd",
  textMuted:   "#7c6fa0",
  textDim:     "#4a3f6b",

  green:       "#34d399",
  greenDim:    "#34d39918",
  amber:       "#fbbf24",
  amberDim:    "#fbbf2418",
  red:         "#f87171",
  redDim:      "#f8717118",
  cyan:        "#22d3ee",
  cyanDim:     "#22d3ee18",

  sidebar:     "#0a0814",
  sidebarBorder:"#1e1830",
  hdr:         "#0d0b14",
  hdrBorder:   "#1e1830",

  inputBg:     "#120f1e",
  inputBorder: "#2a2040",
  modalBg:     "#1a1628",
  modalBorder: "#2a2040",

  badge: (col) => ({ background: col+"20", color: col, border: `1px solid ${col}40` }),
  shadow: "0 4px 24px rgba(0,0,0,0.5)",
};

// ── PURPLE/VIOLET LIGHT THEME ─────────────────────────────────
const LIGHT = {
  accent:      "#7c3aed",
  accentDim:   "#7c3aed12",
  accentBorder:"#7c3aed30",
  accentHover: "#6d28d9",
  accent2:     "#5b21b6",

  bg:          "#f5f3ff",
  surface:     "#ffffff",
  card:        "#ffffff",
  card2:       "#faf8ff",
  border:      "#e9e3ff",
  border2:     "#d4c8ff",

  text:        "#1e1033",
  textMid:     "#4c1d95",
  textMuted:   "#7c6fa0",
  textDim:     "#c4b5fd",

  green:       "#059669",
  greenDim:    "#05966912",
  amber:       "#d97706",
  amberDim:    "#d9770612",
  red:         "#dc2626",
  redDim:      "#dc262612",
  cyan:        "#0891b2",
  cyanDim:     "#0891b212",

  sidebar:     "#ffffff",
  sidebarBorder:"#e9e3ff",
  hdr:         "#ffffff",
  hdrBorder:   "#e9e3ff",

  inputBg:     "#faf8ff",
  inputBorder: "#d4c8ff",
  modalBg:     "#ffffff",
  modalBorder: "#e9e3ff",

  badge: (col) => ({ background: col+"15", color: col, border: `1px solid ${col}35` }),
  shadow: "0 4px 24px rgba(109,40,217,0.08)",
};
