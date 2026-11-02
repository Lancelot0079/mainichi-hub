import { describe, expect, it } from "vitest";
import { PALETTES, type Tokens } from "./palettes";

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r = 0, g = 0, b = 0] = channels.map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

/** Every pairing the stylesheets use for text, with the WCAG AA minimum for body text. */
const TEXT_PAIRS: ReadonlyArray<[keyof Tokens, keyof Tokens]> = [
  ["ink", "paper"],
  ["ink", "surface"],
  ["muted", "paper"],
  ["muted", "surface"],
  ["ai", "surface"],
  ["ai", "paper"],
  ["onAi", "ai"],
  ["onShu", "shu"],
  ["shu", "surface"],
  ["ok", "surface"],
  ["warn", "surface"],
];

describe("palettes", () => {
  for (const palette of PALETTES) {
    for (const mode of ["light", "dark"] as const) {
      it(`${palette.id} ${mode} keeps text readable`, () => {
        const tokens = palette[mode];
        const failing = TEXT_PAIRS.map(([fg, bg]) => ({
          pair: `${fg} on ${bg}`,
          ratio: Number(contrast(tokens[fg], tokens[bg]).toFixed(2)),
        })).filter(({ ratio }) => ratio < 4.5);
        expect(failing).toEqual([]);
      });
    }
  }

  it("defines every token in both modes", () => {
    for (const palette of PALETTES) {
      expect(Object.keys(palette.dark).sort()).toEqual(Object.keys(palette.light).sort());
    }
  });
});
