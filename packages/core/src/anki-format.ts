import type { Card } from "./schema";

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;" };

/** Anki renders fields as HTML, and card text can come from a pasted assistant reply. */
const clean = (s: string) => s.replace(/[\t\n\r]+/g, " ").replace(/[&<>]/g, (c) => ESCAPES[c] ?? c);

export const cardFront = (c: Card) =>
  clean(c.jp) + (c.example ? `<br><small>${clean(c.example)}</small>` : "");

export const cardBack = (c: Card) =>
  `${clean(c.reading)}<br><b>${clean(c.meaning)}</b>` +
  (c.exampleMeaning ? `<br><small>${clean(c.exampleMeaning)}</small>` : "");

/** Tab-separated file for Anki's File → Import, with its file-header directives. */
export function ankiImportText(cards: Card[]): string {
  const lines = cards.map((c) =>
    [cardFront(c), cardBack(c), clean(c.tag || "mainichi")].join("\t"),
  );
  return `#separator:tab\n#html:true\n#tags column:3\n${lines.join("\n")}\n`;
}
