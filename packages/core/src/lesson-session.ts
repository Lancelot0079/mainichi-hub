import { STROKE_COUNTS } from "./handwriting";
import type { Script } from "./kana";
import { LESSONS } from "./lesson-content";
import type { Lesson, LessonItem, LessonQuestion } from "./lessons";
import {
  dayToKana,
  formatNumberEs,
  hourToKana,
  minutesToKana,
  MONTH_NAMES,
  monthToKana,
  numberToKana,
  timeAlternatives,
  timeToKana,
  WEEKDAYS,
} from "./numbers";
import { kanaToRomaji } from "./romaji";
import type { HubState, KanaRecord, LessonRecord } from "./schema";

/**
 * Builds the exercises of one session. Each item has a Leitner record, and the kind of exercise
 * grows with it: recognizing comes first, then recalling, then typing, then drawing from memory.
 * Weak and due items are picked first, so no two sessions are the same.
 */

/** The word behind an exercise, so a miss can become a flashcard. */
export interface ExerciseCard {
  jp: string;
  reading: string;
  es: string;
}

export type Exercise =
  | {
      kind: "choice";
      key: string | null;
      prompt: string;
      promptJa: boolean;
      passage?: string;
      options: string[];
      optionsJa: boolean;
      answer: number;
      explanation: string;
      /** Japanese to read aloud; a listening exercise hides the prompt until answered. */
      speak?: string;
      listen?: boolean;
      card?: ExerciseCard;
    }
  | {
      kind: "type";
      key: string | null;
      prompt: string;
      promptJa: boolean;
      accept: string[];
      solution: string;
      explanation: string;
      /** The answer is rōmaji, as when reading a kana. */
      romaji: boolean;
      speak?: string;
      card?: ExerciseCard;
    }
  | {
      kind: "order";
      key: string;
      es: string;
      tiles: string[];
      solution: string[];
      explanation: string;
    }
  | { kind: "draw"; key: string; char: string; romaji: string; script: Script; strokes?: number }
  | { kind: "match"; key: null; pairs: Array<{ jp: string; es: string }> };

export type Random = () => number;

export interface SessionOptions {
  random?: Random;
  /** Whether a Japanese voice is available, so listening exercises can be offered. */
  audio?: boolean;
  size?: number;
}

const SESSION_SIZE = 12;
/** Box from which an item is drawn from memory instead of typed. */
const DRAW_BOX = 3;
/** Box from which an item counts as learned for a lesson's mastery. */
export const LEARNED_BOX = 2;
/** Score from which a lesson counts as completed. */
export const PASS_PERCENT = 80;

export const itemKey = (lesson: Lesson, item: LessonItem) => `${lesson.id}:${item.jp}`;
export const questionKey = (lesson: Lesson, index: number) => `${lesson.id}:q${index}`;
export const generatorKey = (lesson: Lesson) => `${lesson.id}:gen`;
export const drawKey = (char: string) => `draw:${char}`;

export const reading = (item: LessonItem) => item.kana ?? item.jp;
export const romajiOf = (item: LessonItem) => item.romaji ?? kanaToRomaji(reading(item));

function shuffle<T>(items: readonly T[], random: Random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
  }
  return copy;
}

/** Higher means more in need of practice. */
function need(record: KanaRecord | undefined, today: string): number {
  if (!record) return 3;
  if (record.box === 0) return 4;
  if (record.due <= today) return 2;
  return 0.25;
}

/** Weighted sample without replacement, so weak items come up more but never all at once. */
function pick<T>(entries: readonly T[], weight: (t: T) => number, count: number, random: Random) {
  const pool = entries.map((entry) => ({ entry, w: weight(entry) }));
  const out: T[] = [];
  while (out.length < count && pool.length) {
    const total = pool.reduce((sum, p) => sum + p.w, 0);
    let r = random() * total;
    let index = pool.findIndex((p) => (r -= p.w) < 0);
    if (index < 0) index = pool.length - 1;
    out.push(pool[index]?.entry as T);
    pool.splice(index, 1);
  }
  return out;
}

/** Three wrong options from `pool`, distinct from the answer and from each other. */
function choices(answer: string, pool: readonly string[], random: Random) {
  const wrong = shuffle(
    [...new Set(pool)].filter((p) => p !== answer),
    random,
  ).slice(0, 3);
  const options = shuffle([answer, ...wrong], random);
  return { options, answer: options.indexOf(answer) };
}

/** Distractors come from the same lesson first, then from the rest of its unit. */
function neighbours(lesson: Lesson, item: LessonItem): LessonItem[] {
  const same = lesson.items.filter((i) => i !== item && !!i.glyph === !!item.glyph);
  if (same.length >= 3) return same;
  const unit = LESSONS.filter((l) => l.unit === lesson.unit).flatMap((l) => l.items);
  return [...same, ...unit.filter((i) => i !== item && !!i.glyph === !!item.glyph)];
}

const gloss = (item: LessonItem) =>
  item.kana
    ? `${item.jp} (${item.kana}, ${romajiOf(item)}) = ${item.es}`
    : `${item.jp} (${romajiOf(item)}) = ${item.es}`;

function itemExercise(
  lesson: Lesson,
  item: LessonItem,
  record: KanaRecord | undefined,
  options: Required<SessionOptions>,
): Exercise {
  const key = itemKey(lesson, item);
  const box = record?.box ?? 0;
  const others = neighbours(lesson, item);
  const random = options.random;

  if (item.glyph) {
    const romaji = item.es;
    const drawable = lesson.script && item.jp.length === 1 && STROKE_COUNTS[item.jp] !== undefined;
    if (box >= DRAW_BOX && drawable && lesson.script) {
      return {
        kind: "draw",
        key,
        char: item.jp,
        romaji,
        script: lesson.script,
        strokes: STROKE_COUNTS[item.jp],
      };
    }
    if (box >= LEARNED_BOX) {
      return {
        kind: "type",
        key,
        prompt: item.jp,
        promptJa: true,
        accept: [...(item.alt ?? []), romaji],
        solution: romaji,
        explanation: `${item.jp} se lee «${romaji}».`,
        romaji: true,
        speak: item.jp,
      };
    }
    if (box === 1) {
      const c = choices(
        item.jp,
        others.map((o) => o.jp),
        random,
      );
      return {
        kind: "choice",
        key,
        prompt: `¿Cuál es «${romaji}»?`,
        promptJa: false,
        optionsJa: true,
        ...c,
        explanation: `«${romaji}» se escribe ${item.jp}.`,
        speak: item.jp,
      };
    }
    const c = choices(
      romaji,
      others.map((o) => o.es),
      random,
    );
    return {
      kind: "choice",
      key,
      prompt: item.jp,
      promptJa: true,
      optionsJa: false,
      ...c,
      explanation: `${item.jp} se lee «${romaji}».`,
      speak: item.jp,
    };
  }

  const card = { jp: item.jp, reading: item.kana ?? "", es: item.es };
  if (box >= LEARNED_BOX) {
    return {
      kind: "type",
      key,
      prompt: item.es,
      promptJa: false,
      accept: [reading(item), item.jp, romajiOf(item), ...(item.alt ?? [])],
      solution: item.kana ? `${item.jp} (${item.kana})` : item.jp,
      explanation: gloss(item),
      romaji: false,
      speak: reading(item),
      card,
    };
  }
  if (box === 1 && options.audio && random() < 0.5) {
    const c = choices(
      item.es,
      others.map((o) => o.es),
      random,
    );
    return {
      kind: "choice",
      key,
      prompt: item.jp,
      promptJa: true,
      optionsJa: false,
      ...c,
      explanation: gloss(item),
      speak: reading(item),
      card,
      listen: true,
    };
  }
  if (box === 1) {
    const c = choices(
      item.jp,
      others.map((o) => o.jp),
      random,
    );
    return {
      kind: "choice",
      key,
      prompt: item.es,
      promptJa: false,
      optionsJa: true,
      ...c,
      explanation: gloss(item),
      speak: reading(item),
      card,
    };
  }
  const c = choices(
    item.es,
    others.map((o) => o.es),
    random,
  );
  return {
    kind: "choice",
    key,
    prompt: item.jp,
    promptJa: true,
    optionsJa: false,
    ...c,
    explanation: gloss(item),
    speak: reading(item),
    card,
  };
}

function questionExercise(
  lesson: Lesson,
  question: LessonQuestion,
  index: number,
  random: Random,
): Exercise {
  const key = questionKey(lesson, index);
  if (question.kind === "order") {
    const solution = [...question.tiles];
    let tiles = shuffle(solution, random);
    // A shuffle that leaves the sentence in order would be no exercise at all.
    for (let i = 0; i < 5 && tiles.join("") === solution.join(""); i++)
      tiles = shuffle(solution, random);
    return {
      kind: "order",
      key,
      es: question.es,
      tiles,
      solution,
      explanation: question.explanation ?? `${solution.join(" ")} = ${question.es}`,
    };
  }
  const answerText = question.options[question.answer] ?? "";
  const options = shuffle(question.options, random);
  return {
    kind: "choice",
    key,
    prompt: question.prompt,
    promptJa: false,
    passage: question.passage,
    options,
    optionsJa: options.some((o) => /[぀-ヿ]/.test(o)),
    answer: options.indexOf(answerText),
    explanation: question.explanation,
  };
}

// ── Generated practice ─────────────────────────────────────────────────────────────────────

const int = (random: Random, min: number, max: number) =>
  min + Math.floor(random() * (max - min + 1));

/** Typical slips, so distractors look like answers a learner would actually give. */
const SLIPS: ReadonlyArray<readonly [string, string]> = [
  ["さんびゃく", "さんひゃく"],
  ["ろっぴゃく", "ろくひゃく"],
  ["はっぴゃく", "はちひゃく"],
  ["さんぜん", "さんせん"],
  ["はっせん", "はちせん"],
  ["いっせん", "いちせん"],
  ["よじ", "よんじ"],
  ["しちじ", "ななじ"],
  ["くじ", "きゅうじ"],
  ["いっぷん", "いちふん"],
  ["さんぷん", "さんふん"],
  ["よんぷん", "よんふん"],
  ["ろっぷん", "ろくふん"],
  ["はっぷん", "はちふん"],
  ["じゅっぷん", "じゅうふん"],
  ["にふん", "にぷん"],
  ["ごふん", "ごぷん"],
  ["しがつ", "よんがつ"],
  ["しちがつ", "なながつ"],
  ["くがつ", "きゅうがつ"],
];

function slips(correct: string): string[] {
  return SLIPS.filter(([from]) => correct.includes(from)).map(([from, to]) =>
    correct.replace(from, to),
  );
}

function generated(lesson: Lesson, record: KanaRecord | undefined, random: Random): Exercise {
  const key = generatorKey(lesson);
  const typed = (record?.box ?? 0) >= LEARNED_BOX;
  const build = (prompt: string, correct: string, accept: string[], wrong: string[]): Exercise => {
    const explanation = `${prompt} = ${correct} (${kanaToRomaji(correct)})`;
    if (typed) {
      return {
        kind: "type",
        key,
        prompt,
        promptJa: false,
        accept,
        solution: correct,
        explanation,
        romaji: false,
        speak: correct,
      };
    }
    const c = choices(
      correct,
      wrong.filter((w) => !accept.includes(w)),
      random,
    );
    return {
      kind: "choice",
      key,
      prompt,
      promptJa: false,
      optionsJa: true,
      ...c,
      explanation,
      speak: correct,
    };
  };

  switch (lesson.generator) {
    case "numbers-small": {
      const n = int(random, 11, 99);
      const swapped = (n % 10) * 10 + Math.floor(n / 10);
      const near = [n + 1, n - 1, n + 2, n + 10, n - 10, n - 20, swapped].filter(
        (x) => x > 0 && x < 100 && x !== n,
      );
      return build(String(n), numberToKana(n), [numberToKana(n)], near.map(numberToKana));
    }
    case "numbers-big": {
      const magnitude = [999, 9999, 99_999, 9_999_999][int(random, 0, 3)] ?? 999;
      const n = int(random, 100, magnitude);
      const correct = numberToKana(n);
      const near = [n + 100, n - 100, n + 1000, n * 10].filter((x) => x > 0 && x < 1e8);
      return build(
        formatNumberEs(n),
        correct,
        [correct],
        [...slips(correct), ...near.map(numberToKana)],
      );
    }
    case "time": {
      const h = int(random, 1, 12);
      const m = [0, 5, 10, 15, 20, 30, 45, int(random, 1, 59)][int(random, 0, 7)] ?? 0;
      const correct = timeToKana(h, m);
      const prompt = `${h}:${String(m).padStart(2, "0")}`;
      const near = [
        timeToKana((h % 12) + 1, m),
        hourToKana(h) + (m ? minutesToKana((m % 59) + 1) : "はん"),
      ];
      return build(prompt, correct, timeAlternatives(h, m), [...slips(correct), ...near]);
    }
    case "dates": {
      const kind = int(random, 0, 2);
      if (kind === 0) {
        const month = int(random, 1, 12);
        const correct = monthToKana(month);
        const near = [
          monthToKana((month % 12) + 1),
          numberToKana(month) + "がつ",
          numberToKana(month) + "げつ",
        ];
        return build(
          MONTH_NAMES[month - 1] ?? "",
          correct,
          [correct],
          [...slips(correct), ...near],
        );
      }
      if (kind === 1) {
        const day =
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 14, 20, 24, int(random, 11, 31)][int(random, 0, 13)] ?? 1;
        const correct = dayToKana(day);
        const near = [
          numberToKana(day) + "にち",
          dayToKana((day % 31) + 1),
          dayToKana(((day + 9) % 31) + 1),
          dayToKana(day > 1 ? day - 1 : 2),
        ];
        return build(`día ${day} del mes`, correct, [correct], near);
      }
      const index = int(random, 0, 6);
      const day = WEEKDAYS[index] ?? WEEKDAYS[0];
      return build(
        day.es,
        day.kana,
        [day.kana, day.jp],
        WEEKDAYS.map((w) => w.kana),
      );
    }
    default:
      throw new Error(`La lección ${lesson.id} no tiene generador`);
  }
}

// ── Sessions ───────────────────────────────────────────────────────────────────────────────

const withDefaults = (options: SessionOptions): Required<SessionOptions> => ({
  random: options.random ?? Math.random,
  audio: options.audio ?? false,
  size: options.size ?? SESSION_SIZE,
});

/** One session of a lesson. Explanations are shown by the page; these are the exercises. */
export function buildLessonSession(
  lesson: Lesson,
  records: Record<string, KanaRecord>,
  today: string,
  options: SessionOptions = {},
): Exercise[] {
  const opts = withDefaults(options);
  const questions = lesson.questions ?? [];
  const questionCount = Math.min(questions.length, Math.ceil(opts.size / 3));
  const generatedCount = lesson.generator ? 4 : 0;
  const itemCount = Math.min(
    lesson.items.length,
    Math.max(4, opts.size - questionCount - generatedCount),
  );

  const items = pick(
    lesson.items,
    (i) => need(records[itemKey(lesson, i)], today),
    itemCount,
    opts.random,
  )
    // Easiest first: recognizing before recalling before producing.
    .sort(
      (a, b) => (records[itemKey(lesson, a)]?.box ?? 0) - (records[itemKey(lesson, b)]?.box ?? 0),
    );
  const exercises: Exercise[] = [];

  const fresh = items.filter((i) => !records[itemKey(lesson, i)]);
  if (fresh.length >= 4) {
    exercises.push({
      kind: "match",
      key: null,
      pairs: shuffle(fresh, opts.random)
        .slice(0, 4)
        .map((i) => ({ jp: i.jp, es: i.es })),
    });
  }
  for (const item of items)
    exercises.push(itemExercise(lesson, item, records[itemKey(lesson, item)], opts));
  for (let i = 0; i < generatedCount; i++)
    exercises.push(generated(lesson, records[generatorKey(lesson)], opts.random));
  const chosen = pick(
    questions.map((q, index) => ({ q, index })),
    ({ index }) => need(records[questionKey(lesson, index)], today),
    questionCount,
    opts.random,
  );
  for (const { q, index } of chosen)
    exercises.push(questionExercise(lesson, q, index, opts.random));
  return exercises;
}

export const startedLessons = (state: HubState) =>
  LESSONS.filter((l) => state.progress.lessons[l.id]);

interface Due {
  lesson: Lesson;
  item: LessonItem;
  record: KanaRecord;
}

/** Items of the lessons already started that are due today, weakest first. */
export function dueLessonItems(state: HubState, today: string): Due[] {
  const records = state.progress.items;
  return startedLessons(state)
    .flatMap((lesson) =>
      lesson.items.flatMap((item) => {
        const record = records[itemKey(lesson, item)];
        return record && record.due <= today ? [{ lesson, item, record }] : [];
      }),
    )
    .sort((a, b) => a.record.box - b.record.box);
}

/** A mixed review across every started lesson, for the days without a new lesson. */
export function buildReviewSession(
  state: HubState,
  today: string,
  options: SessionOptions = {},
): Exercise[] {
  const opts = withDefaults(options);
  const due = pick(
    dueLessonItems(state, today),
    (d) => need(d.record, today),
    opts.size,
    opts.random,
  );
  const exercises = due.map((d) => itemExercise(d.lesson, d.item, d.record, opts));
  for (const lesson of startedLessons(state).filter((l) => l.generator)) {
    const record = state.progress.items[generatorKey(lesson)];
    if (exercises.length < opts.size && (!record || record.due <= today)) {
      exercises.push(generated(lesson, record, opts.random));
    }
  }
  return shuffle(exercises, opts.random);
}

/** Share of a lesson's items and questions already learned, 0–1. */
export function lessonMastery(lesson: Lesson, records: Record<string, KanaRecord>): number {
  const keys = [
    ...lesson.items.map((i) => itemKey(lesson, i)),
    ...(lesson.questions ?? []).map((_, i) => questionKey(lesson, i)),
    ...(lesson.generator ? [generatorKey(lesson)] : []),
  ];
  if (!keys.length) return 0;
  return keys.filter((k) => (records[k]?.box ?? 0) >= LEARNED_BOX).length / keys.length;
}

export type LessonStatus = "nueva" | "en-curso" | "completada";

export function lessonStatus(record: LessonRecord | undefined): LessonStatus {
  if (!record) return "nueva";
  return record.completedAt ? "completada" : "en-curso";
}

/** The first lesson not yet completed, in course order. */
export const nextLesson = (state: HubState): Lesson | null =>
  LESSONS.find((l) => !state.progress.lessons[l.id]?.completedAt) ?? null;

/** Updates a lesson's record after a session. `score` is the percentage right on first try. */
export function recordLessonRun(
  record: LessonRecord | undefined,
  score: number,
  at: string,
): LessonRecord {
  const base: LessonRecord = record ?? { runs: 0, best: 0, last: 0, updatedAt: at };
  return {
    runs: base.runs + 1,
    best: Math.max(base.best, score),
    last: score,
    completedAt: base.completedAt ?? (score >= PASS_PERCENT ? at : undefined),
    updatedAt: at,
  };
}

/** Kana for the drawing challenge, weakest first. Only single characters can be drawn. */
export function drawingQueue(
  chars: readonly string[],
  records: Record<string, KanaRecord>,
  today: string,
  count: number,
  random: Random = Math.random,
): string[] {
  return pick(chars, (c) => need(records[drawKey(c)], today), count, random);
}
