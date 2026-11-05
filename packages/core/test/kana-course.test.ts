import { describe, expect, it } from "vitest";
import {
  ADJECTIVES,
  adjectiveSlips,
  buildLessonSession,
  buildReviewSession,
  conjugate,
  conjugateAdjective,
  conjugationRule,
  conjugationSlips,
  dueLessonItems,
  emptyState,
  itemKey,
  KANA,
  KANA_COURSE,
  KANA_MNEMONICS,
  KANA_UNITS,
  kanaLessonById,
  NEW_PER_SESSION,
  nextLesson,
  PARTICLE_SENTENCES,
  VERBS,
  type Exercise,
  type KanaRecord,
  type Verb,
} from "../src";

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2 ** 31;
    return s / 2 ** 31;
  };
}

const TODAY = "2026-11-05";
const verb = (dict: string): Verb => {
  const found = VERBS.find((v) => v.dict === dict);
  if (!found) throw new Error(dict);
  return found;
};

describe("verb conjugation", () => {
  it.each([
    ["たべる", "masu", "たべます"],
    ["のむ", "masen", "のみません"],
    ["かう", "mashita", "かいました"],
    ["する", "masendeshita", "しませんでした"],
    ["くる", "masu", "きます"],
    ["かえる", "masu", "かえります"],
    ["はいる", "nai", "はいらない"],
  ] as const)("%s in the %s form is %s", (dict, form, expected) => {
    expect(conjugate(verb(dict), form)).toBe(expected);
  });

  it.each([
    ["かう", "かって", "かった"],
    ["まつ", "まって", "まった"],
    ["つくる", "つくって", "つくった"],
    ["のむ", "のんで", "のんだ"],
    ["あそぶ", "あそんで", "あそんだ"],
    ["しぬ", "しんで", "しんだ"],
    ["かく", "かいて", "かいた"],
    ["およぐ", "およいで", "およいだ"],
    ["はなす", "はなして", "はなした"],
    ["いく", "いって", "いった"],
    ["たべる", "たべて", "たべた"],
    ["する", "して", "した"],
    ["くる", "きて", "きた"],
  ])("%s → %s, %s", (dict, te, ta) => {
    expect(conjugate(verb(dict), "te")).toBe(te);
    expect(conjugate(verb(dict), "ta")).toBe(ta);
  });

  it.each([
    ["かう", "かわない"],
    ["まつ", "またない"],
    ["たべる", "たべない"],
    ["する", "しない"],
    ["くる", "こない"],
  ])("%s → %s", (dict, nai) => {
    expect(conjugate(verb(dict), "nai")).toBe(nai);
  });

  it("explains each rule and never offers the right answer as a slip", () => {
    for (const v of VERBS) {
      for (const form of ["masu", "masen", "mashita", "masendeshita", "te", "nai", "ta"] as const) {
        expect(conjugationRule(v, form)).toContain(conjugate(v, form));
        const slips = conjugationSlips(v, form);
        expect(slips.length).toBeGreaterThanOrEqual(3);
        expect(slips).not.toContain(conjugate(v, form));
      }
    }
    expect(conjugationRule(verb("いく"), "te")).toContain("excepción");
  });
});

describe("adjectives", () => {
  const adjective = (base: string) => ADJECTIVES.find((a) => a.base === base)!;

  it("conjugates い and な adjectives, with いい as the exception", () => {
    expect(conjugateAdjective(adjective("たかい"), "neg")).toBe("たかくないです");
    expect(conjugateAdjective(adjective("たかい"), "pastneg")).toBe("たかくなかったです");
    expect(conjugateAdjective(adjective("いい"), "past")).toBe("よかったです");
    expect(conjugateAdjective(adjective("しずか"), "past")).toBe("しずかでした");
    expect(conjugateAdjective(adjective("きれい"), "neg")).toBe("きれいじゃないです");
  });

  it("offers the other kind's form as a believable mistake", () => {
    expect(adjectiveSlips(adjective("きれい"), "neg")).toContain("きれくないです");
    expect(adjectiveSlips(adjective("いい"), "neg")).toContain("いくないです");
  });
});

describe("particle sentences", () => {
  it("each blank has a reason and the particle is not repeated as an alternative", () => {
    for (const s of PARTICLE_SENTENCES) {
      expect(s.why.length).toBeGreaterThan(10);
      expect(s.alsoOk ?? []).not.toContain(s.particle);
    }
  });
});

describe("the kana course", () => {
  it("has a memory hook for every basic kana", () => {
    for (const script of ["h", "k"] as const) {
      for (const k of KANA[script].filter((k) => k.row <= 9)) {
        expect(KANA_MNEMONICS[k.char], k.char).toBeTruthy();
      }
    }
  });

  it("puts every lesson in a unit and gives each generator something to practice", () => {
    const units = new Set(KANA_UNITS.map((u) => u.id));
    const ids = new Set<string>();
    for (const lesson of KANA_COURSE) {
      expect(units.has(lesson.unit), lesson.id).toBe(true);
      expect(ids.has(lesson.id), lesson.id).toBe(false);
      ids.add(lesson.id);
      expect(lesson.items.length, lesson.id).toBeGreaterThanOrEqual(4);
      if (lesson.generator === "particles") {
        for (const p of lesson.focus ?? []) {
          expect(
            PARTICLE_SENTENCES.some((s) => s.particle === p),
            `${lesson.id} ${p}`,
          ).toBe(true);
        }
      }
    }
    expect(kanaLessonById("kd-h-k")?.items.map((i) => i.jp)).toEqual([
      "か",
      "き",
      "く",
      "け",
      "こ",
    ]);
  });

  it("introduces at most five new kana, each studied, recalled and asked again at the end", () => {
    const lesson = kanaLessonById("kd-h-todo")!;
    const teaching = { ...lesson, learnFirst: true };
    const session = buildLessonSession(teaching, {}, TODAY, { random: seeded(3) });
    const learned = session.filter((e) => e.kind === "learn");
    expect(learned).toHaveLength(NEW_PER_SESSION);
    for (const card of learned) {
      if (card.kind !== "learn") continue;
      expect(card.mnemonic).toBeTruthy();
      const at = session.indexOf(card);
      // Right after the card comes a question about the same kana.
      expect(JSON.stringify(session[at + 1])).toContain(card.jp);
      // And the kana is asked again, reversed, at the end of the session.
      const last = session.slice(-NEW_PER_SESSION).map((e) => JSON.stringify(e));
      expect(last.some((e) => e.includes(card.jp) && e.includes("¿Cuál es"))).toBe(true);
    }
  });

  it("moves on to the next five once the first are known, and reviews the known ones", () => {
    const lesson = kanaLessonById("kd-h-todo")!;
    const teaching = { ...lesson, learnFirst: true };
    const records: Record<string, KanaRecord> = {};
    for (const item of lesson.items.slice(0, 5)) {
      records[itemKey(lesson, item)] = { box: 1, due: TODAY, attempts: 1, correct: 1 };
    }
    const session = buildLessonSession(teaching, records, TODAY, { random: seeded(4) });
    const learned = session.flatMap((e) => (e.kind === "learn" ? [e.jp] : []));
    expect(learned).toEqual(lesson.items.slice(5, 10).map((i) => i.jp));
    expect(session.some((e) => e.kind !== "learn" && e.key?.endsWith(":あ"))).toBe(true);
  });

  it("generates particle, conjugation and group exercises with the answer among four options", () => {
    for (const id of ["kd-p-2", "kd-v-te", "kd-v-grupos", "kd-a-na"]) {
      const lesson = kanaLessonById(id)!;
      for (let seed = 1; seed < 30; seed++) {
        const session = buildLessonSession(lesson, {}, TODAY, { random: seeded(seed) });
        const generated = session.filter((e) => e.key?.endsWith(":gen"));
        expect(generated.length, id).toBe(lesson.generatedCount);
        for (const e of generated as Array<Extract<Exercise, { kind: "choice" }>>) {
          expect(e.kind).toBe("choice");
          expect(new Set(e.options).size).toBe(e.options.length);
          expect(e.options[e.answer], `${id} ${e.prompt}`).toBeTruthy();
          if (id !== "kd-v-grupos") expect(e.options).toHaveLength(4);
        }
      }
    }
  });

  it("never offers a particle that would also be right", () => {
    const lesson = kanaLessonById("kd-p-2")!;
    for (let seed = 1; seed < 60; seed++) {
      for (const e of buildLessonSession(lesson, {}, TODAY, { random: seeded(seed) })) {
        if (e.kind !== "choice" || !e.passage?.includes("かえります")) continue;
        expect(e.options.filter((o) => o === "に" || o === "へ")).toHaveLength(1);
      }
    }
  });

  it("asks to type the conjugation once the generator is learned", () => {
    const lesson = kanaLessonById("kd-v-masu")!;
    const records = { "kd-v-masu:gen": { box: 2, due: TODAY, attempts: 3, correct: 3 } };
    const session = buildLessonSession(lesson, records, TODAY, { random: seeded(7) });
    const typed = session.filter((e) => e.kind === "type" && e.key === "kd-v-masu:gen");
    expect(typed.length).toBe(lesson.generatedCount);
  });

  it("keeps its own next lesson and review apart from the other course", () => {
    const state = emptyState();
    expect(nextLesson(state, KANA_COURSE)?.id).toBe("kd-sistema");
    const lesson = kanaLessonById("kd-sistema")!;
    state.progress.lessons[lesson.id] = { runs: 1, best: 50, last: 50, updatedAt: TODAY };
    state.progress.items[itemKey(lesson, lesson.items[0]!)] = {
      box: 1,
      due: TODAY,
      attempts: 1,
      correct: 1,
    };
    expect(dueLessonItems(state, TODAY, KANA_COURSE)).toHaveLength(1);
    expect(dueLessonItems(state, TODAY)).toHaveLength(0);
    expect(buildReviewSession(state, TODAY, {}, KANA_COURSE)).toHaveLength(1);
  });
});
