import { useTheme } from "../../context/ThemeContext";
import { Sun, Moon, Monitor } from "lucide-react";

const OPTIONS = [
  { id: "system", label: "System", Icon: Monitor },
  { id: "light",  label: "Light",  Icon: Sun },
  { id: "dark",   label: "Dark",   Icon: Moon },
];

export default function ThemeModeDock({ variant = "inline" }) {
  const { mode, setMode, resolvedMode } = useTheme();
  const isFixed = variant === "fixed";

  return (
    <div
      data-theme-control="true"
      style={{
        position: isFixed ? "fixed" : "relative",
        right: isFixed ? 18 : "auto",
        top: isFixed ? 16 : "auto",
        zIndex: isFixed ? 5000 : 1,
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: 3,
        borderRadius: "var(--radius-pill)",
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        boxShadow: isFixed ? "var(--shadow-md)" : "none",
      }}
    >
      {OPTIONS.map(({ id, label, Icon }) => {
        const active = id === mode;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            title={id === "system" ? `System theme (${resolvedMode})` : label}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 10px",
              borderRadius: "var(--radius-pill)",
              border: "none",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 600,
              fontFamily: "inherit",
              background: active ? "var(--accent)" : "transparent",
              color: active ? "var(--text-on-accent)" : "var(--text-mid)",
              transition: "background-color 0.15s ease, color 0.15s ease",
            }}
          >
            <Icon size={13} strokeWidth={2} />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
