import { createContext, useContext, useState } from "react";

export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(true);
  const toggle = () => setIsDark(d => !d);

  const theme = isDark ? DARK : LIGHT;

  return (
    <ThemeContext.Provider value={{ isDark, toggle, theme }}>
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
