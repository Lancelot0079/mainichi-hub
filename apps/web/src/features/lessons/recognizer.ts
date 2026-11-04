import {
  judgeDrawing,
  KANA,
  normalizeImage,
  rankCandidates,
  rasterizeStrokes,
  type Bitmap,
  type Candidate,
  type Script,
  type Stroke,
  type Verdict,
} from "@mainichi/core";

/**
 * Templates are the page's own fonts drawn on a hidden canvas: a gothic face close to how people
 * write and a mincho face with brush-like strokes. Comparing against both tolerates more styles.
 */
const FONTS = ['400 100px "Zen Kaku Gothic New"', '600 100px "Shippori Mincho B1"'];
const CANVAS = 128;

/** The 46 basic characters of a script; a drawing is compared against all of them. */
export const basicKana = (script: Script) =>
  KANA[script].filter((k) => k.row <= 9).map((k) => k.char);

const cache = new Map<Script, Promise<Candidate[]>>();

function renderGlyph(context: CanvasRenderingContext2D, char: string, font: string): Bitmap {
  context.clearRect(0, 0, CANVAS, CANVAS);
  context.font = font;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#000";
  context.fillText(char, CANVAS / 2, CANVAS / 2);
  const { data } = context.getImageData(0, 0, CANVAS, CANVAS);
  const alpha = new Uint8Array(CANVAS * CANVAS);
  for (let i = 0; i < alpha.length; i++) alpha[i] = data[i * 4 + 3] ?? 0;
  return normalizeImage(alpha, CANVAS, CANVAS);
}

async function buildCandidates(script: Script): Promise<Candidate[]> {
  const chars = basicKana(script);
  // The fonts are split by Unicode range; loading with the text fetches the kana subsets.
  await Promise.all(FONTS.map((font) => document.fonts.load(font, chars.join(""))));
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = CANVAS;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Este navegador no permite dibujar en un lienzo");
  return chars.map((char) => ({
    char,
    templates: FONTS.map((font) => renderGlyph(context, char, font)),
  }));
}

export function candidatesFor(script: Script): Promise<Candidate[]> {
  let pending = cache.get(script);
  if (!pending) {
    pending = buildCandidates(script);
    cache.set(script, pending);
    pending.catch(() => cache.delete(script));
  }
  return pending;
}

export async function recognize(
  strokes: readonly Stroke[],
  target: string,
  script: Script,
): Promise<Verdict> {
  const candidates = await candidatesFor(script);
  return judgeDrawing(target, rankCandidates(rasterizeStrokes(strokes), candidates));
}
