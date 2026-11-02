import type { ReactNode } from "react";

/** `{漢字|かんじ}` becomes furigana and `［…］` an underline, as on the official papers. */
const MARKUP = /\{([^|}]+)\|([^}]+)\}|［([^］]*)］/g;

function render(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(MARKUP)) {
    const index = match.index ?? 0;
    if (index > last) nodes.push(text.slice(last, index));
    const key = `${keyPrefix}-${index}`;
    if (match[1] !== undefined) {
      nodes.push(
        <ruby key={key}>
          {match[1]}
          <rt>{match[2]}</rt>
        </ruby>,
      );
    } else {
      nodes.push(<u key={key}>{render(match[3] ?? "", key)}</u>);
    }
    last = index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function JpText({ text, className }: { text: string; className?: string }) {
  return (
    <span lang="ja" translate="no" className={className}>
      {render(text, "t")}
    </span>
  );
}

/** The same text without markup, for cards and clipboard. */
export const plainJp = (text: string) =>
  text.replace(/\{([^|}]+)\|[^}]+\}/g, "$1").replace(/[［］]/g, "");
