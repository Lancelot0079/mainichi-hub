import { describe, expect, it } from "vitest";
import {
  answerKey,
  buildLessonSession,
  buildReviewSession,
  dayToKana,
  drawingQueue,
  emptyState,
  gradeKana,
  itemKey,
  judgeDrawing,
  kanaToRomaji,
  lessonById,
  lessonMastery,
  LESSON_UNITS,
  LESSONS,
  matchesAnswer,
  normalizeImage,
  mergeStates,
  minutesToKana,
  monthToKana,
  nextLesson,
  numberToKana,
  rankCandidates,
  rasterizeStrokes,
  recordLessonRun,
  romajiToHiragana,
  similarity,
  STROKE_COUNTS,
  timeAlternatives,
  timeToKana,
  type HubState,
  type KanaRecord,
  type Stroke,
} from "../src";

/** Deterministic random numbers, so sessions can be compared. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2 ** 31;
    return s / 2 ** 31;
  };
}

const TODAY = "2026-11-03";

describe("rōmaji and kana", () => {
  it.each([
    ["konnichiwa", "こんにちわ"],
    ["kitte", "きって"],
    ["matcha", "まっちゃ"],
    ["hon'ya", "ほんや"],
    ["onna", "おんな"],
    ["shinbun", "しんぶん"],
    ["tōkyō", "とおきょお"],
    ["kyō", "きょお"],
    ["ramen-", "らめんー"],
  ])("converts %s", (romaji, kana) => {
    expect(romajiToHiragana(romaji)).toBe(kana);
  });

  it.each([
    ["きって", "kitte"],
    ["まっちゃ", "matcha"],
    ["しゃしん", "shashin"],
    ["コーヒー", "koohii"],
    ["ディエゴ", "diego"],
  ])("romanizes %s", (kana, romaji) => {
    expect(kanaToRomaji(kana)).toBe(romaji);
  });

  it("accepts long vowels however they are typed", () => {
    for (const typed of ["toukyou", "tōkyō", "tookyoo", "トーキョー"]) {
      expect(answerKey(typed), typed).toBe(answerKey("とうきょう"));
    }
    expect(matchesAnswer("tōkyō", ["とうきょう"])).toBe(true);
    expect(matchesAnswer("koohii", ["コーヒー"])).toBe(true);
    expect(matchesAnswer("sensei", ["せんせい"])).toBe(true);
    expect(matchesAnswer("sensee", ["せんせい"])).toBe(true);
  });

  it("ignores spaces and punctuation but not wrong kana", () => {
    expect(matchesAnswer("Hai, genki desu.", ["はい、げんきです"])).toBe(true);
    expect(matchesAnswer("ki o tsukete kudasai", ["きをつけてください"])).toBe(true);
    expect(matchesAnswer("genki", ["げんきです"])).toBe(false);
    expect(matchesAnswer("   ", [""])).toBe(false);
  });
});

describe("numbers, time and dates", () => {
  it.each([
    [0, "ゼロ"],
    [17, "じゅうなな"],
    [74, "ななじゅうよん"],
    [342, "さんびゃくよんじゅうに"],
    [600, "ろっぴゃく"],
    [981, "きゅうひゃくはちじゅういち"],
    [3000, "さんぜん"],
    [8457, "はっせんよんひゃくごじゅうなな"],
    [10000, "いちまん"],
    [18607, "いちまんはっせんろっぴゃくなな"],
    [85421, "はちまんごせんよんひゃくにじゅういち"],
    [1_000_000, "ひゃくまん"],
    [10_000_000, "いっせんまん"],
    [3_570_040, "さんびゃくごじゅうななまんよんじゅう"],
    [100_000_000, "いちおく"],
  ])("reads %i", (n, kana) => {
    expect(numberToKana(n)).toBe(kana);
  });

  it("rejects what it cannot read", () => {
    expect(() => numberToKana(-1)).toThrow();
    expect(() => numberToKana(1.5)).toThrow();
  });

  it.each([
    [1, 0, "いちじ"],
    [4, 0, "よじ"],
    [9, 15, "くじじゅうごふん"],
    [7, 1, "しちじいっぷん"],
    [3, 10, "さんじじゅっぷん"],
    [12, 46, "じゅうにじよんじゅうろっぷん"],
    [2, 33, "にじさんじゅうさんぷん"],
  ])("tells %i:%i", (h, m, kana) => {
    expect(timeToKana(h, m)).toBe(kana);
  });

  it("accepts はん and じっぷん as alternatives", () => {
    expect(timeAlternatives(3, 30)).toEqual([
      "さんじさんじゅっぷん",
      "さんじはん",
      "さんじさんじっぷん",
    ]);
    expect(minutesToKana(20)).toBe("にじゅっぷん");
  });

  it("knows the calendar exceptions", () => {
    expect([1, 2, 4, 8, 10, 14, 17, 19, 20, 24, 29].map(dayToKana)).toEqual([
      "ついたち",
      "ふつか",
      "よっか",
      "ようか",
      "とおか",
      "じゅうよっか",
      "じゅうしちにち",
      "じゅうくにち",
      "はつか",
      "にじゅうよっか",
      "にじゅうくにち",
    ]);
    expect([4, 7, 9, 10].map(monthToKana)).toEqual(["しがつ", "しちがつ", "くがつ", "じゅうがつ"]);
  });
});

describe("handwriting", () => {
  const line = (x0: number, y0: number, x1: number, y1: number): Stroke =>
    Array.from({ length: 11 }, (_, i) => [x0 + ((x1 - x0) * i) / 10, y0 + ((y1 - y0) * i) / 10]);
  // Rough shapes in a 100×100 box.
  const plus = [line(10, 50, 90, 50), line(50, 10, 50, 90)];
  const equals = [line(10, 35, 90, 35), line(10, 65, 90, 65)];
  const corner = [line(10, 10, 90, 10), line(90, 10, 90, 90)];

  it("scores a shape against itself as identical, at any size or position", () => {
    const small = plus.map((s) => s.map(([x, y]) => [x / 4 + 300, y / 4 + 20] as const));
    expect(similarity(rasterizeStrokes(plus), rasterizeStrokes(plus))).toBe(1);
    expect(similarity(rasterizeStrokes(plus), rasterizeStrokes(small))).toBeGreaterThan(0.95);
  });

  it("ranks the most similar shape first and judges by it", () => {
    const wobbly = [line(12, 48, 88, 53), line(47, 12, 52, 88)];
    const candidates = [
      { char: "十", templates: [rasterizeStrokes(plus)] },
      { char: "二", templates: [rasterizeStrokes(equals)] },
      { char: "コ", templates: [rasterizeStrokes(corner)] },
    ];
    const ranking = rankCandidates(rasterizeStrokes(wobbly), candidates);
    expect(ranking[0]?.char).toBe("十");
    expect(judgeDrawing("十", ranking).passed).toBe(true);
    expect(judgeDrawing("二", ranking).passed).toBe(false);
  });

  it("normalizes an image like a drawing of the same shape", () => {
    // A 100×100 alpha image of a plus sign, two pixels thick.
    const alpha = new Uint8Array(100 * 100);
    for (let i = 10; i <= 90; i++) {
      for (const d of [-1, 0, 1]) {
        alpha[(50 + d) * 100 + i] = 255;
        alpha[i * 100 + 50 + d] = 255;
      }
    }
    const image = normalizeImage(alpha, 100, 100);
    expect(similarity(image, rasterizeStrokes(plus))).toBeGreaterThan(0.8);
    expect(similarity(image, rasterizeStrokes(equals))).toBeLessThan(0.5);
    expect(similarity(normalizeImage(new Uint8Array(100), 10, 10), image)).toBe(0);
  });

  it("gives an empty drawing no similarity", () => {
    expect(similarity(rasterizeStrokes([]), rasterizeStrokes(plus))).toBe(0);
    expect(judgeDrawing("十", []).passed).toBe(false);
  });

  it("has a stroke count for every basic kana", () => {
    expect(Object.keys(STROKE_COUNTS)).toHaveLength(92);
  });
});

describe("lesson content", () => {
  it("has unique ids and every lesson in a known unit", () => {
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length);
    const units = new Set(LESSON_UNITS.map((u) => u.id));
    for (const lesson of LESSONS) expect(units.has(lesson.unit), lesson.id).toBe(true);
  });

  it("gives each lesson enough items for four-option questions", () => {
    for (const lesson of LESSONS) {
      expect(lesson.items.length, lesson.id).toBeGreaterThanOrEqual(4);
      expect(lesson.notes.length, lesson.id).toBeGreaterThan(0);
      const keys = lesson.items.map((i) => i.jp);
      expect(new Set(keys).size, `${lesson.id} repite un elemento`).toBe(keys.length);
    }
  });

  it("has valid hand-written questions", () => {
    for (const lesson of LESSONS) {
      for (const q of lesson.questions ?? []) {
        if (q.kind === "choice") {
          expect(new Set(q.options).size, q.prompt).toBe(q.options.length);
          expect(q.options[q.answer], q.prompt).toBeDefined();
        } else {
          expect(q.tiles.length, q.es).toBeGreaterThan(1);
        }
      }
    }
  });
});

describe("adaptive sessions", () => {
  const lesson = lessonById("hiragana-1")!;

  it("starts with matching and recognition for a new learner", () => {
    const session = buildLessonSession(lesson, {}, TODAY, { random: seeded(1) });
    expect(session[0]?.kind).toBe("match");
    expect(session.slice(1).every((e) => e.kind === "choice")).toBe(true);
    for (const e of session) {
      if (e.kind === "choice") {
        expect(e.options).toHaveLength(4);
        expect(new Set(e.options).size).toBe(4);
        expect(e.options[e.answer]).toBeDefined();
      }
    }
  });

  it("moves to typing and drawing as items are learned", () => {
    const records: Record<string, KanaRecord> = {};
    for (const item of lesson.items) {
      records[itemKey(lesson, item)] = { box: 3, due: TODAY, attempts: 3, correct: 3 };
    }
    const kinds = new Set(
      buildLessonSession(lesson, records, TODAY, { random: seeded(2) }).map((e) => e.kind),
    );
    expect(kinds.has("draw")).toBe(true);
    expect(kinds.has("type")).toBe(true);
    expect(kinds.has("choice")).toBe(false);
  });

  it("prefers weak items over the ones already known", () => {
    const records: Record<string, KanaRecord> = {};
    lesson.items.forEach((item, i) => {
      records[itemKey(lesson, item)] =
        i < 4
          ? { box: 0, due: TODAY, attempts: 2, correct: 0 }
          : { box: 5, due: "2027-01-01", attempts: 5, correct: 5 };
    });
    const weak = lesson.items.slice(0, 4).map((i) => itemKey(lesson, i));
    let hits = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const picked = buildLessonSession(lesson, records, TODAY, { random: seeded(seed), size: 4 });
      hits += picked.filter((e) => e.key && weak.includes(e.key)).length;
    }
    // Four picks per session; on average at least three should be the weak items.
    expect(hits / 20).toBeGreaterThanOrEqual(3);
  });

  it("generates numbers, times and dates with the right answer among the options", () => {
    for (const id of ["numeros-1", "numeros-2", "hora", "fechas"]) {
      const generated = lessonById(id)!;
      for (let seed = 1; seed < 40; seed++) {
        for (const e of buildLessonSession(generated, {}, TODAY, { random: seeded(seed) })) {
          if (e.kind !== "choice") continue;
          expect(e.options[e.answer], `${id} ${e.prompt}`).toBeDefined();
          expect(new Set(e.options).size, `${id} ${e.prompt}: ${e.options.join(",")}`).toBe(
            e.options.length,
          );
          expect(e.options.length, `${id} ${e.prompt}`).toBeGreaterThanOrEqual(3);
        }
      }
    }
  });

  it("shuffles sentence tiles and keeps the solution", () => {
    const desu = lessonById("desu")!;
    const orders = buildLessonSession(desu, {}, TODAY, { random: seeded(4) }).filter(
      (e) => e.kind === "order",
    );
    expect(orders.length).toBeGreaterThan(0);
    for (const e of orders) {
      if (e.kind !== "order") continue;
      expect([...e.tiles].sort()).toEqual([...e.solution].sort());
    }
  });

  it("reviews only what is due in lessons already started", () => {
    const state = emptyState();
    expect(buildReviewSession(state, TODAY)).toEqual([]);
    state.progress.lessons.saludos = recordLessonRun(undefined, 90, `${TODAY}T10:00:00Z`);
    const greetings = lessonById("saludos")!;
    const [first, second] = greetings.items;
    state.progress.items[itemKey(greetings, first!)] = gradeKana(undefined, false, TODAY);
    state.progress.items[itemKey(greetings, second!)] = gradeKana(undefined, true, TODAY);
    const review = buildReviewSession(state, TODAY, { random: seeded(5) });
    expect(review.map((e) => e.key)).toEqual([itemKey(greetings, first!)]);
  });

  it("tracks mastery, completion and the next lesson", () => {
    const state = emptyState();
    expect(nextLesson(state)?.id).toBe(LESSONS[0]?.id);
    const failed = recordLessonRun(undefined, 50, "2026-11-01T00:00:00Z");
    expect(failed.completedAt).toBeUndefined();
    const passed = recordLessonRun(failed, 85, "2026-11-02T00:00:00Z");
    expect(passed).toMatchObject({
      runs: 2,
      best: 85,
      last: 85,
      completedAt: "2026-11-02T00:00:00Z",
    });
    expect(recordLessonRun(passed, 40, "2026-11-03T00:00:00Z").completedAt).toBe(
      passed.completedAt,
    );
    state.progress.lessons[LESSONS[0]!.id] = passed;
    expect(nextLesson(state)?.id).toBe(LESSONS[1]?.id);
    expect(lessonMastery(lesson, {})).toBe(0);
  });

  it("orders the drawing queue by need", () => {
    const records = { "draw:あ": { box: 5, due: "2027-01-01", attempts: 5, correct: 5 } };
    const queue = drawingQueue(["あ", "い", "う"], records, TODAY, 2, seeded(6));
    expect(queue).toHaveLength(2);
  });
});

describe("merging lesson progress", () => {
  const withLesson = (record: HubState["progress"]["lessons"][string], at: string) => {
    const state = emptyState();
    state.updatedAt = at;
    state.progress.lessons.saludos = record;
    state.progress.items["saludos:こんにちは"] = {
      box: record.runs,
      due: TODAY,
      attempts: record.runs,
      correct: 0,
    };
    return state;
  };

  it("keeps the best score, the most runs and the first completion", () => {
    const a = withLesson(
      { runs: 3, best: 90, last: 60, completedAt: "2026-10-01", updatedAt: "2026-11-02" },
      "2026-11-02",
    );
    const b = withLesson({ runs: 2, best: 70, last: 70, updatedAt: "2026-11-03" }, "2026-11-03");
    const merged = mergeStates(a, b);
    expect(merged.progress.lessons.saludos).toEqual({
      runs: 3,
      best: 90,
      last: 70,
      completedAt: "2026-10-01",
      updatedAt: "2026-11-03",
    });
    expect(merged.progress.items["saludos:こんにちは"]?.attempts).toBe(3);
    expect(mergeStates(b, a)).toEqual(merged);
  });
});
