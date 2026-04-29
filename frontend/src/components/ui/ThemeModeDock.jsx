import { useTheme } from "../../context/ThemeContext";

const OPTIONS = [
  { id: "system", label: "System" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

export default function ThemeModeDock({ variant = "inline" }) {
  const { mode, setMode, resolvedMode } = useTheme();
  const isDark = resolvedMode === "dark";
  const isFixed = variant === "fixed";

  return (
    <div
      data-theme-control="true"
      style={{
        position: isFixed ? "fixed" : "relative",
        right: isFixed ? 18 : "auto",
        top: isFixed ? 16 : "auto",
        bottom: "auto",
        zIndex: isFixed ? 5000 : 1,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: isFixed ? "8px 10px" : "4px 6px 4px 10px",
        borderRadius: 14,
        background: isDark ? "rgba(10, 14, 24, 0.9)" : "rgba(255, 255, 255, 0.9)",
        border: `1px solid ${isDark ? "#263244" : "#dbe4f0"}`,
        boxShadow: isDark ? "0 12px 28px rgba(0,0,0,0.24)" : "0 10px 24px rgba(15, 23, 42, 0.08)",
        backdropFilter: "blur(12px)",
      }}
    >
      <span style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: isDark ? "#7f8ea8" : "#64748b", fontWeight: 700 }}>
        Theme
      </span>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: 4,
          borderRadius: 12,
          background: isDark ? "#131a27" : "#f1f5f9",
          border: `1px solid ${isDark ? "#1f2937" : "#e2e8f0"}`,
        }}
      >
        {OPTIONS.map((option) => {
          const active = option.id === mode;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setMode(option.id)}
              title={option.id === "system" ? `System theme (${resolvedMode})` : option.label}
              style={{
                border: "none",
                cursor: "pointer",
                padding: "6px 11px",
                borderRadius: 9,
                fontSize: 11,
                fontWeight: 700,
                background: active ? (isDark ? "#253041" : "#ffffff") : "transparent",
                color: active ? (isDark ? "#f8fafc" : "#0f172a") : (isDark ? "#8ea0bc" : "#64748b"),
                boxShadow: active ? (isDark ? "0 8px 16px rgba(0,0,0,0.24)" : "0 6px 12px rgba(15, 23, 42, 0.08)") : "none",
                transition: "all 0.15s ease",
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
