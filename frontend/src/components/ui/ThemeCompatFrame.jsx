import { useTheme } from "../../context/ThemeContext";

export default function ThemeCompatFrame({ nativeMode = "light", children }) {
  const { resolvedMode } = useTheme();
  const shouldInvert = nativeMode !== resolvedMode;

  return (
    <>
      {shouldInvert && (
        <style>
          {`
            [data-theme-compat="true"] [data-theme-control="true"] {
              filter: invert(1) hue-rotate(180deg);
            }
            [data-theme-compat="true"] img,
            [data-theme-compat="true"] picture,
            [data-theme-compat="true"] video,
            [data-theme-compat="true"] canvas,
            [data-theme-compat="true"] iframe {
              filter: invert(1) hue-rotate(180deg);
            }
          `}
        </style>
      )}
      <style>
        {`
          [data-theme-compat] input,
          [data-theme-compat] select,
          [data-theme-compat] textarea,
          [data-theme-compat] button,
          [data-theme-compat] label {
            font-family: var(--ui-font-sans) !important;
          }

          [data-theme-compat] input,
          [data-theme-compat] select,
          [data-theme-compat] textarea {
            caret-color: currentColor;
          }
        `}
      </style>
      <div
        data-theme-compat={shouldInvert ? "true" : "false"}
        style={{
          minHeight: "100vh",
          background: resolvedMode === "dark" ? "#060810" : "#f8fafc",
          filter: shouldInvert ? "invert(1) hue-rotate(180deg)" : "none",
          transition: "filter 0.2s ease, background 0.2s ease",
        }}
      >
        {children}
      </div>
    </>
  );
}
