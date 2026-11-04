import type { Script } from "./kana";

/**
 * Lesson model. Lessons are data: explanations, items to learn and hand-written questions. The
 * exercises themselves are generated per session (see lesson-session.ts), which is what lets a
 * lesson adapt to what each person already knows.
 */

export type LessonUnit =
  "escritura" | "hiragana" | "katakana" | "expresiones" | "numeros" | "gramatica";

export const LESSON_UNITS: ReadonlyArray<{ id: LessonUnit; jp: string; title: string }> = [
  { id: "escritura", jp: "文字", title: "La escritura japonesa" },
  { id: "hiragana", jp: "ひらがな", title: "Hiragana" },
  { id: "katakana", jp: "カタカナ", title: "Katakana" },
  { id: "expresiones", jp: "挨拶", title: "Saludos y expresiones" },
  { id: "numeros", jp: "数字", title: "Números y tiempo" },
  { id: "gramatica", jp: "文法", title: "Primeras oraciones" },
];

export interface LessonItem {
  /** As written; may contain kanji. */
  jp: string;
  /** Reading in kana, when `jp` has kanji. */
  kana?: string;
  /** Overrides the rōmaji derived from the kana, e.g. for particles (こんにちは → konnichiwa). */
  romaji?: string;
  es: string;
  /** A single kana (or kana pair) practiced as a character rather than a word. */
  glyph?: boolean;
  /** Other answers accepted when typing, in kana or rōmaji. */
  alt?: readonly string[];
}

export interface LessonExample {
  jp: string;
  romaji?: string;
  es: string;
}

export interface LessonNote {
  title: string;
  body: readonly string[];
  examples?: readonly LessonExample[];
  /** A small table; cells are shown in Japanese type when `jpCells` is set. */
  table?: { head: readonly string[]; rows: ReadonlyArray<readonly string[]>; jpCells?: boolean };
}

export type LessonQuestion =
  | {
      kind: "choice";
      /** May contain furigana markup: {漢字|かな}. */
      prompt: string;
      passage?: string;
      options: readonly string[];
      answer: number;
      explanation: string;
    }
  | {
      kind: "order";
      /** The meaning of the sentence to build. */
      es: string;
      /** The words in the right order. */
      tiles: readonly string[];
      explanation?: string;
    };

export type LessonGenerator = "numbers-small" | "numbers-big" | "time" | "dates";

export interface Lesson {
  id: string;
  unit: LessonUnit;
  jp: string;
  title: string;
  summary: string;
  notes: readonly LessonNote[];
  items: readonly LessonItem[];
  questions?: readonly LessonQuestion[];
  /** Endless practice built from rules instead of fixed items. */
  generator?: LessonGenerator;
  /** Glyph items can be drawn and recognized when the script is known. */
  script?: Script;
  /** An interactive tool shown with the explanations. */
  builder?: "presentation";
}
