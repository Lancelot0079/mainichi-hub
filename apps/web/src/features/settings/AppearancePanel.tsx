import type { CSSProperties } from "react";
import { setAppearance, useAppearance, type ThemeMode } from "../../ui/appearance";
import { cssVariables, PALETTES, type Tokens } from "../../ui/palettes";

const MODES: ReadonlyArray<[ThemeMode, string]> = [
  ["auto", "Automático"],
  ["light", "Claro"],
  ["dark", "Oscuro"],
];

/** A miniature of the dashboard painted with the palette's own tokens. */
function Preview({ tokens, label }: { tokens: Tokens; label: string }) {
  return (
    <div className="preview" style={cssVariables(tokens) as CSSProperties} aria-hidden="true">
      <span className="preview-label">{label}</span>
      <div className="preview-card">
        <span className="preview-title" lang="ja">
          毎日
        </span>
        <span className="hanko sm">済</span>
      </div>
      <div className="preview-row">
        <span className="preview-btn">Empezar</span>
        <span className="preview-link">Abrir</span>
        <span className="preview-bar">
          <i />
        </span>
      </div>
    </div>
  );
}

export function AppearancePanel() {
  const appearance = useAppearance();
  return (
    <div className="stack">
      <div className="seg" role="group" aria-label="Modo de color">
        {MODES.map(([mode, label]) => (
          <button
            key={mode}
            type="button"
            aria-pressed={appearance.mode === mode}
            onClick={() => setAppearance({ mode })}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="grid g2">
        {PALETTES.map((palette) => (
          <button
            key={palette.id}
            type="button"
            className={`panel palette ${appearance.palette === palette.id ? "selected" : ""}`}
            aria-pressed={appearance.palette === palette.id}
            onClick={() => setAppearance({ palette: palette.id })}
          >
            <span className="row between">
              <b>
                <span lang="ja">{palette.jp}</span> {palette.name}
              </b>
              {appearance.palette === palette.id && <span className="tag">En uso</span>}
            </span>
            <span className="muted small">{palette.description}</span>
            <span className="previews">
              <Preview tokens={palette.light} label="Claro" />
              <Preview tokens={palette.dark} label="Oscuro" />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
