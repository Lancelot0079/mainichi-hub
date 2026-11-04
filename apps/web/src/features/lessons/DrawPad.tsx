import type { Point, Script, Stroke, Verdict } from "@mainichi/core";
import { useEffect, useRef, useState } from "react";
import { Jp } from "../../ui/primitives";
import { recognize } from "./recognizer";

/** Width of the ink on screen, as a fraction of the square; recognition uses its own pen. */
const PEN_WIDTH = 0.055;

function ink(): string {
  return getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || "#1c2333";
}

/**
 * A square to draw a kana with mouse, pen or finger; recognition happens on «Comprobar». Give it a
 * `key` per exercise so each one starts blank.
 */
export function DrawPad({
  target,
  script,
  hint,
  onResult,
}: {
  target: string;
  script: Script;
  hint?: string;
  onResult: (verdict: Verdict) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const current = useRef<Point[] | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  // Redraws everything from the stroke list, so undo and resizing stay simple.
  const paint = (list: readonly Stroke[]) => {
    const element = canvas.current;
    const context = element?.getContext("2d");
    if (!element || !context) return;
    const size = element.clientWidth;
    const ratio = devicePixelRatio || 1;
    if (element.width !== Math.round(size * ratio)) {
      element.width = element.height = Math.round(size * ratio);
    }
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, size, size);
    context.strokeStyle = ink();
    context.lineWidth = size * PEN_WIDTH;
    context.lineCap = "round";
    context.lineJoin = "round";
    for (const stroke of list) {
      const [first, ...rest] = stroke;
      if (!first) continue;
      context.beginPath();
      context.moveTo(first[0] * size, first[1] * size);
      if (!rest.length) context.lineTo(first[0] * size + 0.1, first[1] * size);
      for (const [x, y] of rest) context.lineTo(x * size, y * size);
      context.stroke();
    }
  };

  useEffect(() => {
    paint(strokes);
    const onResize = () => paint(strokes);
    addEventListener("resize", onResize);
    return () => removeEventListener("resize", onResize);
  });

  const point = (event: React.PointerEvent<HTMLCanvasElement>): Point => {
    const box = event.currentTarget.getBoundingClientRect();
    return [(event.clientX - box.left) / box.width, (event.clientY - box.top) / box.height];
  };

  const locked = verdict !== null || checking;

  async function check() {
    if (!strokes.length || locked) return;
    setChecking(true);
    try {
      const result = await recognize(strokes, target, script);
      setVerdict(result);
      onResult(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setChecking(false);
    }
  }

  const closest = verdict?.closest.filter((m) => m.char !== target).slice(0, 2) ?? [];

  return (
    <div className="draw">
      <div className="draw-sheet">
        <canvas
          ref={canvas}
          className="draw-canvas"
          role="img"
          aria-label={`Lienzo para dibujar ${hint ?? "el kana"}. Dibuja con el ratón, el lápiz o el dedo.`}
          onPointerDown={(e) => {
            if (locked) return;
            try {
              // Keeps the stroke going when the pointer leaves the square.
              e.currentTarget.setPointerCapture(e.pointerId);
            } catch {
              // Some pointers cannot be captured; drawing still works inside the square.
            }
            current.current = [point(e)];
            setStrokes((list) => [...list, current.current ?? []]);
          }}
          onPointerMove={(e) => {
            if (!current.current) return;
            current.current.push(point(e));
            const live = current.current;
            setStrokes((list) => [...list.slice(0, -1), [...live]]);
          }}
          onPointerUp={() => {
            current.current = null;
          }}
          onPointerCancel={() => {
            current.current = null;
          }}
        />
        {verdict && (
          <Jp className="draw-answer" aria-hidden="true">
            {target}
          </Jp>
        )}
      </div>
      <div className="row">
        <button
          type="button"
          className="btn ghost small"
          disabled={!strokes.length || locked}
          onClick={() => setStrokes((list) => list.slice(0, -1))}
        >
          Deshacer trazo
        </button>
        <button
          type="button"
          className="btn ghost small"
          disabled={!strokes.length || locked}
          onClick={() => setStrokes([])}
        >
          Borrar
        </button>
        <button
          type="button"
          className="btn small"
          disabled={!strokes.length || locked}
          onClick={() => void check()}
        >
          {checking ? "Revisando…" : "Comprobar"}
        </button>
      </div>
      <p className="muted small num">
        {strokes.length} trazo{strokes.length === 1 ? "" : "s"}
        {hint ? ` · ${hint}` : ""}
      </p>
      {error && <p className="feedback no">{error}</p>}
      {verdict && (
        <div className={`feedback ${verdict.passed ? "ok" : "no"}`} role="status">
          {verdict.passed ? "✓ " : "✗ "}
          Se parece en un {Math.round(verdict.score * 100)} % a <Jp>{target}</Jp>.
          {closest.length > 0 && (
            <>
              {" "}
              {verdict.passed ? "También recuerda a" : "Se parece más a"}{" "}
              {closest.map((m, i) => (
                <span key={m.char}>
                  {i > 0 && " y "}
                  <Jp>{m.char}</Jp> ({Math.round(m.score * 100)} %)
                </span>
              ))}
              .
            </>
          )}
        </div>
      )}
    </div>
  );
}
