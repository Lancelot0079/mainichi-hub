import type { Script } from "./kana";

/**
 * Lesson model. Lessons are data: explanations, items to learn and hand-written questions. The
 * exercises themselves are generated per session (see lesson-session.ts), which is what lets a
 * lesson adapt to what each person already knows.
 */

/** A group of lessons inside a course. Each course has its own list of units. */
export interface CourseUnit {
  id: string;
  jp: string;
  title: string;
}

export type LessonUnit = string;

export const LESSON_UNITS: readonly CourseUnit[] = [
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
  /** A memory hook shown when the item is first learned. */
  mnemonic?: string;
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

export type LessonGenerator =
  | "numbers-small"
  | "numbers-big"
  | "time"
  | "dates"
  /** Fill in the particle; `focus` lists the particles practiced. */
  | "particles"
  /** Conjugate a verb; `focus` lists the forms (see VerbForm). */
  | "verbs"
  /** Say which group a verb belongs to. */
  | "verb-groups"
  /** Conjugate an adjective; `focus` lists the kinds, "i" and/or "na". */
  | "adjectives";

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
  /** What the generator practices: particles, verb forms or adjective kinds. */
  focus?: readonly string[];
  /** Generated exercises per session; 4 when not set. */
  generatedCount?: number;
  /**
   * New items are introduced with a study card, a few at a time, recalled right away and again
   * at the end of the session.
   */
  learnFirst?: boolean;
  /** Glyph items can be drawn and recognized when the script is known. */
  script?: Script;
  /** An interactive tool shown with the explanations. */
  builder?: "presentation";
}
