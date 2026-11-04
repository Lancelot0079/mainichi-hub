/**
 * Recognition of a hand-drawn kana by its shape. The drawing and each candidate glyph are scaled
 * into the same small grid, and compared with a symmetric chamfer distance: how far, on average,
 * each inked cell of one is from the nearest ink of the other. It needs no training data and runs
 * in a few milliseconds, at the cost of telling very similar shapes (シ/ツ) apart less reliably.
 */

export type Point = readonly [number, number];
export type Stroke = readonly Point[];

export interface Bitmap {
  size: number;
  /** Row-major, 1 where there is ink. */
  ink: Uint8Array;
}

export const GRID_SIZE = 40;
/** Free border inside the grid, so strokes at the edge keep their neighbourhood. */
const MARGIN = 4;
/** Distance, as a fraction of the grid, at which similarity reaches zero. */
const ZERO_AT = 0.08;

interface Box {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** Maps a box into the grid keeping its proportions, so a wide へ does not become a tall one. */
function fitter(box: Box, size: number) {
  const span = Math.max(box.maxX - box.minX, box.maxY - box.minY, 1e-6);
  const inner = size - 2 * MARGIN - 1;
  const scale = inner / span;
  const offsetX = MARGIN + (inner - (box.maxX - box.minX) * scale) / 2;
  const offsetY = MARGIN + (inner - (box.maxY - box.minY) * scale) / 2;
  return (x: number, y: number): Point => [
    offsetX + (x - box.minX) * scale,
    offsetY + (y - box.minY) * scale,
  ];
}

function distanceToSegment(px: number, py: number, a: Point, b: Point): number {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / length)) : 0;
  return Math.hypot(px - (a[0] + t * dx), py - (a[1] + t * dy));
}

/** Draws strokes in any coordinate space into a normalized grid, with a pen of fixed width. */
export function rasterizeStrokes(strokes: readonly Stroke[], size = GRID_SIZE): Bitmap {
  const ink = new Uint8Array(size * size);
  const points = strokes.flat();
  if (!points.length) return { size, ink };
  const box: Box = {
    minX: Math.min(...points.map((p) => p[0])),
    minY: Math.min(...points.map((p) => p[1])),
    maxX: Math.max(...points.map((p) => p[0])),
    maxY: Math.max(...points.map((p) => p[1])),
  };
  const fit = fitter(box, size);
  const radius = size * 0.045;
  for (const stroke of strokes) {
    const mapped = stroke.map(([x, y]) => fit(x, y));
    const segments = mapped.length === 1 ? [[mapped[0], mapped[0]] as const] : [];
    for (let i = 1; i < mapped.length; i++) segments.push([mapped[i - 1], mapped[i]] as const);
    for (const [a, b] of segments) {
      if (!a || !b) continue;
      const [x0, x1] = [Math.min(a[0], b[0]) - radius, Math.max(a[0], b[0]) + radius];
      const [y0, y1] = [Math.min(a[1], b[1]) - radius, Math.max(a[1], b[1]) + radius];
      for (let y = Math.max(0, Math.floor(y0)); y <= Math.min(size - 1, Math.ceil(y1)); y++) {
        for (let x = Math.max(0, Math.floor(x0)); x <= Math.min(size - 1, Math.ceil(x1)); x++) {
          if (distanceToSegment(x + 0.5, y + 0.5, a, b) <= radius) ink[y * size + x] = 1;
        }
      }
    }
  }
  return { size, ink };
}

/**
 * Normalizes an image, such as a glyph drawn on a canvas, into the same grid. `alpha` holds one
 * value per pixel between 0 and 255.
 */
export function normalizeImage(
  alpha: ArrayLike<number>,
  width: number,
  height: number,
  size = GRID_SIZE,
): Bitmap {
  const ink = new Uint8Array(size * size);
  const box: Box = { minX: width, minY: height, maxX: -1, maxY: -1 };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if ((alpha[y * width + x] ?? 0) < 128) continue;
      box.minX = Math.min(box.minX, x);
      box.maxX = Math.max(box.maxX, x);
      box.minY = Math.min(box.minY, y);
      box.maxY = Math.max(box.maxY, y);
    }
  }
  if (box.maxX < 0) return { size, ink };
  const fit = fitter(box, size);
  for (let y = box.minY; y <= box.maxY; y++) {
    for (let x = box.minX; x <= box.maxX; x++) {
      if ((alpha[y * width + x] ?? 0) < 128) continue;
      const [gx, gy] = fit(x + 0.5, y + 0.5);
      const cx = Math.min(size - 1, Math.max(0, Math.floor(gx)));
      const cy = Math.min(size - 1, Math.max(0, Math.floor(gy)));
      ink[cy * size + cx] = 1;
    }
  }
  return { size, ink };
}

/** Distance from every cell to the nearest ink, by two passes of a 3-4 chamfer mask. */
function distanceField({ size, ink }: Bitmap): Float32Array {
  const far = size * 3 * 2;
  const d = new Float32Array(size * size).map((_, i) => (ink[i] ? 0 : far));
  const at = (x: number, y: number) =>
    x < 0 || y < 0 || x >= size || y >= size ? far : (d[y * size + x] ?? far);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      d[i] = Math.min(
        d[i] ?? far,
        at(x - 1, y) + 3,
        at(x, y - 1) + 3,
        at(x - 1, y - 1) + 4,
        at(x + 1, y - 1) + 4,
      );
    }
  }
  for (let y = size - 1; y >= 0; y--) {
    for (let x = size - 1; x >= 0; x--) {
      const i = y * size + x;
      d[i] = Math.min(
        d[i] ?? far,
        at(x + 1, y) + 3,
        at(x, y + 1) + 3,
        at(x + 1, y + 1) + 4,
        at(x - 1, y + 1) + 4,
      );
    }
  }
  return d.map((v) => v / 3);
}

/** Root mean square distance from the ink of `from` to the nearest ink of `to`. */
function directedDistance(from: Bitmap, toField: Float32Array): number {
  let sum = 0;
  let count = 0;
  from.ink.forEach((v, i) => {
    if (!v) return;
    sum += (toField[i] ?? 0) ** 2;
    count += 1;
  });
  return count ? Math.sqrt(sum / count) : Infinity;
}

export const inkCount = (bitmap: Bitmap) => bitmap.ink.reduce((sum, v) => sum + v, 0);

/** 1 for the same shape, falling to 0 as the shapes drift apart. */
export function similarity(a: Bitmap, b: Bitmap): number {
  if (!inkCount(a) || !inkCount(b)) return 0;
  const distance =
    (directedDistance(a, distanceField(b)) + directedDistance(b, distanceField(a))) / 2;
  return Math.max(0, 1 - distance / (a.size * ZERO_AT));
}

export interface Candidate {
  char: string;
  /** One or more renderings of the character, for example in two typefaces. */
  templates: readonly Bitmap[];
}

export interface Match {
  char: string;
  score: number;
}

/** Candidates ordered from most to least similar to the drawing. */
export function rankCandidates(drawing: Bitmap, candidates: readonly Candidate[]): Match[] {
  return candidates
    .map((c) => ({
      char: c.char,
      score: Math.max(0, ...c.templates.map((t) => similarity(drawing, t))),
    }))
    .sort((x, y) => y.score - x.score || x.char.localeCompare(y.char));
}

export interface Verdict {
  passed: boolean;
  /** Similarity to the expected character, 0–1. */
  score: number;
  /** Closest characters overall, best first. */
  closest: Match[];
}

const PASS_SCORE = 0.25;
/** How close to the best match the target may be and still pass, for look-alike pairs. */
const TIE_MARGIN = 0.05;

/** Passes when the target is recognizably what was drawn: the best match, or nearly. */
export function judgeDrawing(target: string, ranking: readonly Match[]): Verdict {
  const best = ranking[0];
  const score = ranking.find((m) => m.char === target)?.score ?? 0;
  const passed = !!best && score >= PASS_SCORE && score >= best.score - TIE_MARGIN;
  return { passed, score, closest: ranking.slice(0, 3) };
}

/** Standard stroke counts, shown as a hint; recognition itself ignores the number of strokes. */
// prettier-ignore
export const STROKE_COUNTS: Readonly<Record<string, number>> = {
  あ: 3, い: 2, う: 2, え: 2, お: 3, か: 3, き: 4, く: 1, け: 3, こ: 2,
  さ: 3, し: 1, す: 2, せ: 3, そ: 1, た: 4, ち: 2, つ: 1, て: 1, と: 2,
  な: 4, に: 3, ぬ: 2, ね: 2, の: 1, は: 3, ひ: 1, ふ: 4, へ: 1, ほ: 4,
  ま: 3, み: 2, む: 3, め: 2, も: 3, や: 3, ゆ: 2, よ: 2,
  ら: 2, り: 2, る: 1, れ: 2, ろ: 1, わ: 2, を: 3, ん: 1,
  ア: 2, イ: 2, ウ: 3, エ: 3, オ: 3, カ: 2, キ: 3, ク: 2, ケ: 3, コ: 2,
  サ: 3, シ: 3, ス: 2, セ: 2, ソ: 2, タ: 3, チ: 3, ツ: 3, テ: 3, ト: 2,
  ナ: 2, ニ: 2, ヌ: 2, ネ: 4, ノ: 1, ハ: 2, ヒ: 2, フ: 1, ヘ: 1, ホ: 4,
  マ: 2, ミ: 3, ム: 2, メ: 2, モ: 3, ヤ: 2, ユ: 2, ヨ: 3,
  ラ: 2, リ: 2, ル: 2, レ: 1, ロ: 3, ワ: 2, ヲ: 3, ン: 2,
};
