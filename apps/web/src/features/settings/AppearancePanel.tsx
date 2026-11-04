import type { CSSProperties } from "react";
import { setAppearance, useAppearance, type ThemeMode } from "../../ui/appearance";
import { cssVariables, PALETTES, type Tokens } from "../../ui/palettes";

const MODES: ReadonlyArray<[ThemeMode, string]> = [
  ["auto", "Automático"],
  ["light", "Claro"],
  ["dark", "Oscuro"],
];

const LINES = ["--c-srs", "--c-les", "--c-out", "--c-lis"] as const;
/** Squares filled on each stop of the miniature: one done, one under way, two to go. */
const FILLED = [6, 3, 0, 0];

/** A miniature of the Today screen (rail, station sign, route, departures) in the palette's tokens. */
function Preview({ tokens, label }: { tokens: Tokens; label: string }) {
  return (
    <span className="preview" style={cssVariables(tokens) as CSSProperties} aria-hidden="true">
      <span className="pv-rail">
        <span className="pv-brand" lang="ja">
          毎日
        </span>
        <i className="pv-station is-on" />
        {LINES.map((line) => (
          <i
            key={line}
            className="pv-station"
            style={{ "--line": `var(${line})` } as CSSProperties}
          />
        ))}
      </span>
      <span className="pv-main">
        <span className="pv-sign">
          <span className="pv-name" lang="ja">
            今日
          </span>
          <i className="pv-band" />
        </span>
        <span className="pv-route">
          {LINES.map((line, i) => (
            <span
              key={line}
              className="pv-stop"
              style={{ "--line": `var(${line})` } as CSSProperties}
            >
              {Array.from({ length: 6 }, (_, j) => (
                <i key={j} className={j < (FILLED[i] ?? 0) ? "on" : undefined} />
              ))}
            </span>
          ))}
        </span>
        <span className="pv-board">
          {LINES.slice(0, 3).map((line) => (
            <span
              key={line}
              className="pv-dep"
              style={{ "--line": `var(${line})` } as CSSProperties}
            >
              <i />
              <b />
            </span>
          ))}
        </span>
        <span className="pv-label">{label}</span>
      </span>
    </span>
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
