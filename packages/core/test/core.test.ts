import { describe, expect, it } from "vitest";
import {
  addDays,
  ankiImportText,
  bestStreak,
  blockDone,
  BLOCKS,
  blockMinutes,
  cardsPrompt,
  composeAlert,
  currentStreak,
  dailyPlan,
  dayComplete,
  dayInTimeZone,
  dayMinutes,
  dueAlertSlot,
  daysBetween,
  demoSnapshot,
  demoState,
  emptySnapshot,
  emptyState,
  extractJson,
  gradeKana,
  hourInTimeZone,
  importState,
  isCorrectReading,
  KANA,
  kanaDue,
  mergeStates,
  mondayOf,
  nextUnlock,
  rateCard,
  startOfDayUtc,
  type Card,
  type DayLog,
  type HubState,
} from "../src";

const today = "2026-11-02";

const card = (id: string, updatedAt: string, patch: Partial<Card> = {}): Card => ({
  id,
  jp: "水",
  reading: "みず",
  meaning: "agua",
  example: "",
  exampleMeaning: "",
  tag: "",
  createdOn: today,
  box: 1,
  due: today,
  exported: false,
  updatedAt,
  ...patch,
});

const day = (minutes: number, done = false): DayLog => ({
  blocks: { srs: { done, minutes, updatedAt: "" } },
  lesson: "",
  reviews: 0,
  sessions: [],
});

const session = (id: string, resourceId: string, minutes: number, deletedAt?: string) => ({
  id,
  resourceId,
  minutes,
  note: "",
  at: "",
  deletedAt,
});

function withDays(days: string[]): HubState {
  const state = emptyState();
  for (const d of days) state.progress.log[d] = day(10);
  return state;
}

function device(updatedAt: string, patch: Partial<HubState> = {}): HubState {
  return { ...emptyState(), updatedAt, ...patch };
}

describe("dates", () => {
  it("crosses month and year boundaries", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2027-03-01", -1)).toBe("2027-02-28");
    expect(daysBetween(today, "2027-07-04")).toBe(244);
  });

  it("finds the Monday of a week, with Sunday closing it", () => {
    expect(mondayOf(today)).toBe(today);
    expect(mondayOf("2026-11-08")).toBe(today);
  });

  it("resolves the local day of an instant, not the UTC one", () => {
    const lateEveningInBogota = new Date("2026-11-03T02:00:00Z");
    expect(dayInTimeZone(lateEveningInBogota, "America/Bogota")).toBe(today);
    expect(dayInTimeZone(lateEveningInBogota, "Asia/Tokyo")).toBe("2026-11-03");
  });

  it("computes when a local day starts in UTC", () => {
    expect(startOfDayUtc(today, "America/Bogota").toISOString()).toBe("2026-11-02T05:00:00.000Z");
    expect(startOfDayUtc(today, "Asia/Tokyo").toISOString()).toBe("2026-11-01T15:00:00.000Z");
    expect(startOfDayUtc(today, "UTC").toISOString()).toBe("2026-11-02T00:00:00.000Z");
  });
});

describe("schema", () => {
  it("never shares default objects between states", () => {
    const a = emptyState();
    const b = emptyState();
    a.progress.kana.h["あ"] = { box: 1, due: today, attempts: 1, correct: 1 };
    a.settings.milestones.pop();
    expect(b.progress.kana.h).toEqual({});
    expect(b.settings.milestones).toHaveLength(2);
  });
});

describe("kana", () => {
  it("builds both syllabaries with all 104 sounds", () => {
    expect(KANA.h).toHaveLength(104);
    expect(KANA.k).toHaveLength(104);
    expect(KANA.k[0]?.char).toBe("ア");
  });

  it("accepts alternative romanizations and ignores case and spaces", () => {
    const shi = KANA.h.find((k) => k.char === "し")!;
    expect(isCorrectReading(shi, " SHI ")).toBe(true);
    expect(isCorrectReading(shi, "si")).toBe(true);
    expect(isCorrectReading(shi, "su")).toBe(false);
  });

  it("promotes on success and resets to today on failure", () => {
    const first = gradeKana(undefined, true, today);
    expect(first).toEqual({ box: 1, due: "2026-11-03", attempts: 1, correct: 1 });
    expect(gradeKana(first, false, today)).toEqual({ box: 0, due: today, attempts: 2, correct: 1 });
  });

  it("does not reschedule during free practice", () => {
    const record = { box: 3, due: "2026-11-10", attempts: 5, correct: 5 };
    expect(gradeKana(record, false, today, true)).toEqual({ ...record, attempts: 6 });
  });

  it("unlocks the next row only when the current rows are learned", () => {
    const state = emptyState();
    expect(nextUnlock(state, "h")).toBeNull();
    for (const k of KANA.h.filter((x) => x.row === 0)) {
      state.progress.kana.h[k.char] = { box: 2, due: today, attempts: 2, correct: 2 };
    }
    expect(nextUnlock(state, "h")).toBe(1);
  });

  it("treats unseen unlocked kana as due", () => {
    expect(kanaDue(emptyState(), "h", today)).toHaveLength(5);
  });
});

describe("cards", () => {
  it("keeps a failed card due today and restarts it", () => {
    expect(rateCard(card("1", ""), 0, today, "t")).toMatchObject({ box: 0, due: today });
  });

  it("schedules good and easy answers at growing intervals", () => {
    expect(rateCard(card("1", ""), 1, today, "t")).toMatchObject({ box: 2, due: "2026-11-04" });
    expect(rateCard(card("1", ""), 2, today, "t")).toMatchObject({ box: 3, due: "2026-11-06" });
  });

  it("never exceeds the last box", () => {
    expect(rateCard(card("1", "", { box: 6 }), 2, today, "t")).toMatchObject({
      box: 6,
      due: "2026-12-02",
    });
  });
});

describe("streaks", () => {
  it("counts back from today", () => {
    expect(currentStreak(withDays(["2026-11-01", today]), today)).toBe(2);
  });

  it("survives until the end of today", () => {
    expect(currentStreak(withDays(["2026-10-31", "2026-11-01"]), today)).toBe(2);
  });

  it("breaks after a full missed day", () => {
    expect(currentStreak(withDays(["2026-10-30"]), today)).toBe(0);
  });

  it("counts days reported only by Anki", () => {
    const state = emptyState();
    state.anki = {
      syncedAt: "",
      deck: "x",
      dueNew: 0,
      dueLearn: 0,
      dueReview: 0,
      total: 0,
      byDay: { [today]: 20 },
    };
    expect(currentStreak(state, today)).toBe(1);
  });

  it("counts activity supplied from outside the log", () => {
    expect(currentStreak(withDays(["2026-11-01"]), today, new Set([today]))).toBe(2);
  });

  it("includes external days in the best streak", () => {
    expect(bestStreak(emptyState(), new Set([today]))).toBe(1);
  });

  it("finds the longest run ever", () => {
    const days = ["2026-01-01", "2026-01-02", "2026-01-03", "2026-02-01", "2026-02-02"];
    expect(bestStreak(withDays(days))).toBe(3);
  });
});

describe("blocks", () => {
  it("adds logged sessions to the block of their resource", () => {
    const log: DayLog = {
      ...day(5),
      sessions: [session("1", "busuu", 20), session("2", "bunpro", 5)],
    };
    expect(blockMinutes(log, "les")).toBe(20);
    expect(blockMinutes(log, "srs")).toBe(10);
    expect(dayMinutes(log)).toBe(30);
  });

  it("completes a block once sessions reach its target", () => {
    const lesson = BLOCKS.find((b) => b.id === "les")!;
    expect(blockDone({ ...day(0), sessions: [session("1", "udemy", 20)] }, lesson)).toBe(true);
  });

  it("ignores deleted sessions", () => {
    expect(dayMinutes({ ...day(0), sessions: [session("1", "udemy", 20, today)] })).toBe(0);
  });

  it("requires all four blocks for a complete day", () => {
    const log: DayLog = {
      ...day(0),
      blocks: Object.fromEntries(
        BLOCKS.map((b) => [b.id, { done: true, minutes: 0, updatedAt: "" }]),
      ),
    };
    expect(dayComplete(log)).toBe(true);
    expect(dayComplete(day(5, true))).toBe(false);
  });
});

describe("mergeStates", () => {
  const sortKeys = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(sortKeys);
    if (value === null || typeof value !== "object") return value;
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, sortKeys(item)]),
    );
  };
  const canonical = (s: HubState) =>
    JSON.stringify(
      sortKeys({ ...s, cards: [...s.cards].sort((a, b) => a.id.localeCompare(b.id)) }),
    );

  it("keeps cards created on either device", () => {
    const merged = mergeStates(
      device("1", { cards: [card("a", "1")] }),
      device("2", { cards: [card("b", "2")] }),
    );
    expect(merged.cards.map((c) => c.id).sort()).toEqual(["a", "b"]);
  });

  it("prefers the newest edit of a card, in either order", () => {
    const older = device("1", { cards: [card("a", "1", { box: 1 })] });
    const newer = device("2", { cards: [card("a", "2", { box: 4 })] });
    expect(mergeStates(older, newer).cards[0]?.box).toBe(4);
    expect(mergeStates(newer, older).cards[0]?.box).toBe(4);
  });

  it("does not resurrect a deleted card", () => {
    const alive = device("1", { cards: [card("a", "1")] });
    const removed = device("2", { cards: [card("a", "2", { deletedAt: "2" })] });
    expect(mergeStates(alive, removed).cards[0]?.deletedAt).toBe("2");
  });

  it("lets a deletion win a tie", () => {
    const alive = device("1", { cards: [card("a", "5")] });
    const removed = device("1", { cards: [card("a", "5", { deletedAt: "5" })] });
    expect(mergeStates(alive, removed).cards[0]?.deletedAt).toBe("5");
    expect(mergeStates(removed, alive).cards[0]?.deletedAt).toBe("5");
  });

  it("keeps practice logged on both devices on the same day", () => {
    const base = { lesson: "", reviews: 0 };
    const pc = device("1");
    pc.progress.log[today] = {
      ...base,
      blocks: { srs: { done: true, minutes: 15, updatedAt: "1" } },
      sessions: [session("s1", "busuu", 10)],
    };
    const phone = device("2");
    phone.progress.log[today] = {
      ...base,
      blocks: { out: { done: true, minutes: 10, updatedAt: "2" } },
      sessions: [session("s2", "udemy", 20)],
    };
    const merged = mergeStates(pc, phone).progress.log[today]!;
    expect(Object.keys(merged.blocks).sort()).toEqual(["out", "srs"]);
    expect(merged.sessions).toHaveLength(2);
  });

  it("keeps the kana record with more attempts and the highest unlock", () => {
    const a = device("1");
    a.progress.kana.h["あ"] = { box: 3, due: "2026-11-05", attempts: 9, correct: 8 };
    a.progress.unlocked.h = 4;
    const b = device("2");
    b.progress.kana.h["あ"] = { box: 1, due: "2026-11-03", attempts: 2, correct: 1 };
    b.progress.unlocked.h = 2;
    const merged = mergeStates(a, b);
    expect(merged.progress.kana.h["あ"]?.attempts).toBe(9);
    expect(merged.progress.unlocked.h).toBe(4);
  });

  it("converges whatever the merge order, and is idempotent", () => {
    const a = demoState(today);
    const b = { ...demoState("2026-11-01"), updatedAt: "2026-11-03T00:00:00.000Z" };
    b.cards = [...b.cards, card("only-b", "9")];
    expect(canonical(mergeStates(a, b))).toBe(canonical(mergeStates(b, a)));
    const once = mergeStates(a, b);
    expect(canonical(mergeStates(once, b))).toBe(canonical(once));
  });

  it("keeps settings from the device that edited them, not the last one active", () => {
    const pc = device("2026-11-02");
    pc.settings.updatedAt = "2026-11-02";
    pc.settings.milestones = [];
    const phone = device("2026-11-03");
    expect(mergeStates(pc, phone).settings.milestones).toEqual([]);
    expect(mergeStates(phone, pc).settings.milestones).toEqual([]);
  });

  it("keeps the most recently edited lesson note", () => {
    const pc = device("1");
    pc.progress.log[today] = { ...day(0), lesson: "Sección 9", lessonUpdatedAt: "1" };
    const phone = device("2");
    phone.progress.log[today] = { ...day(0), lesson: "Sección 10", lessonUpdatedAt: "2" };
    expect(mergeStates(pc, phone).progress.log[today]?.lesson).toBe("Sección 10");
    expect(mergeStates(phone, pc).progress.log[today]?.lesson).toBe("Sección 10");
  });

  it("keeps the most recent Anki stats", () => {
    const stats = { deck: "x", dueNew: 0, dueLearn: 0, dueReview: 0, total: 0, byDay: {} };
    const a = device("1", { anki: { ...stats, syncedAt: today } });
    const b = device("2", { anki: { ...stats, syncedAt: "2026-11-01" } });
    expect(mergeStates(a, b).anki?.syncedAt).toBe(today);
    expect(mergeStates(a, device("3")).anki?.syncedAt).toBe(today);
  });
});

describe("importState", () => {
  const at = "2026-11-02T12:00:00.000Z";
  const legacy = {
    prog: {
      v: 1,
      log: { "2026-10-31": { b: { srs: { done: true, m: 15 } }, m: 15, l: "Clase 3", cr: 4 } },
      kana: { h: { あ: { b: 3, d: "2026-11-05", n: 6, ok: 5 } }, k: {} },
      unlocked: { h: 3, k: 1 },
      weekly: { "2026-10-26": { rev: true } },
      script: "h",
    },
    cards: {
      v: 1,
      list: [
        {
          id: "c1",
          jp: "水",
          r: "みず",
          es: "agua",
          ej: "",
          ejes: "",
          t: "",
          c: "2026-10-30",
          b: 2,
          d: "2026-11-03",
          x: true,
        },
      ],
    },
    diary: {
      v: 1,
      list: [{ id: "d1", date: "2026-10-31", prompt: "Hola", text: "わたしは", fb: null }],
    },
  };

  it("migrates a backup from the original page without losing data", () => {
    const state = importState(legacy, at);
    expect(state.progress.log["2026-10-31"]).toMatchObject({
      lesson: "Clase 3",
      reviews: 4,
      blocks: { srs: { done: true, minutes: 15 } },
    });
    expect(state.progress.kana.h["あ"]).toEqual({
      box: 3,
      due: "2026-11-05",
      attempts: 6,
      correct: 5,
    });
    expect(state.progress.unlocked.h).toBe(3);
    expect(state.cards[0]).toMatchObject({
      reading: "みず",
      meaning: "agua",
      box: 2,
      exported: true,
    });
    expect(state.diary[0]).toMatchObject({ id: "d1", text: "わたしは" });
  });

  it("round-trips a current export", () => {
    const state = { ...emptyState(), updatedAt: at };
    expect(importState(JSON.parse(JSON.stringify(state)), at)).toEqual(state);
  });

  it("rejects invalid input instead of producing an empty state", () => {
    expect(() => importState({ prog: { log: "nope" } }, at)).toThrow();
    expect(() => importState({ version: 99 }, at)).toThrow();
  });
});

describe("dailyPlan", () => {
  it("includes connected services only when they have data", () => {
    const ids = dailyPlan(emptyState(), emptySnapshot(), today).items.map((i) => i.id);
    expect(ids).toEqual(["kana", "lessons", "cards", "diary"]);
    const all = dailyPlan(demoState(today), demoSnapshot(today), today).items.map((i) => i.id);
    expect(all).toEqual(["wanikani", "anki", "kana", "lessons", "cards", "diary"]);
  });

  it("treats WaniKani activity as studying and extends the streak", () => {
    const snapshot = demoSnapshot(today);
    snapshot.wanikani!.activeToday = true;
    const plan = dailyPlan(emptyState(), snapshot, today);
    expect(plan.studied).toBe(true);
    expect(plan.streak).toBe(1);
  });

  it("skips milestones already past", () => {
    const plan = dailyPlan(emptyState(), emptySnapshot(), "2027-05-01");
    expect(plan.nextMilestone?.id).toBe("jlpt-n5");
    expect(plan.nextMilestone?.daysLeft).toBe(64);
  });
});

describe("composeAlert", () => {
  it("sends a morning plan with what is due", () => {
    const alert = composeAlert("morning", demoState(today), demoSnapshot(today), today)!;
    expect(alert.title).toContain("毎日日本語");
    expect(alert.body).toContain("37 repasos en WaniKani");
    expect(alert.body).toContain("JLPT");
  });

  it("stays silent in the evening once the user has studied", () => {
    const state = demoState(today);
    state.progress.log[today] = day(15, true);
    expect(composeAlert("evening", state, emptySnapshot(), today)).toBeNull();
  });

  it("warns about the streak in the evening when nothing was done", () => {
    const alert = composeAlert("evening", demoState(today), emptySnapshot(), today)!;
    expect(alert.title).toBe("Aún no registras práctica hoy");
    expect(alert.body).toMatch(/racha de \d+ días/);
    expect(alert.priority).toBe("high");
  });

  it("encourages a fresh start when there is no streak to lose", () => {
    const alert = composeAlert("evening", emptyState(), emptySnapshot(), today)!;
    expect(alert.body).toContain("empiezas una racha nueva");
  });
});

describe("dueAlertSlot", () => {
  it("picks the slot from the local hour", () => {
    expect(dueAlertSlot(6, today, {})).toBeNull();
    expect(dueAlertSlot(7, today, {})).toBe("morning");
    expect(dueAlertSlot(11, today, {})).toBe("morning");
    expect(dueAlertSlot(14, today, {})).toBeNull();
    expect(dueAlertSlot(20, today, {})).toBe("evening");
    expect(dueAlertSlot(23, today, {})).toBe("evening");
  });

  it("recovers a dropped run at the next hour, and sends only once", () => {
    expect(dueAlertSlot(9, today, {})).toBe("morning");
    expect(dueAlertSlot(9, today, { morning: today })).toBeNull();
    expect(dueAlertSlot(21, today, { evening: today })).toBeNull();
  });

  it("alerts again on a new day and honors custom hours", () => {
    expect(dueAlertSlot(8, today, { morning: "2026-11-01" })).toBe("morning");
    expect(dueAlertSlot(6, today, {}, { morning: 6, evening: 21 })).toBe("morning");
    expect(dueAlertSlot(20, today, {}, { morning: 6, evening: 21 })).toBeNull();
  });

  it("reads the hour in the user's time zone", () => {
    expect(hourInTimeZone(new Date("2026-11-02T12:17:00Z"), "America/Bogota")).toBe(7);
    expect(hourInTimeZone(new Date("2026-11-03T04:30:00Z"), "America/Bogota")).toBe(23);
  });
});

describe("assistant helpers", () => {
  it("extracts JSON from fenced and chatty replies", () => {
    expect(extractJson('Claro:\n```json\n[{"a":1}]\n```\nListo.')).toEqual([{ a: 1 }]);
    expect(extractJson('Aquí tienes: {"a":1} ¡Suerte!')).toEqual({ a: 1 });
    expect(() => extractJson("sin datos")).toThrow(SyntaxError);
  });

  it("tells the assistant what is already in the deck", () => {
    expect(cardsPrompt("notas", ["水", "火"])).toContain("水、火");
    expect(cardsPrompt("notas", [])).toContain("(nada)");
  });

  it("escapes card text so it cannot inject HTML into Anki", () => {
    const text = ankiImportText([card("1", "", { jp: "<img src=x onerror=alert(1)>" })]);
    expect(text).toContain("&lt;img");
    expect(text).not.toContain("<img");
  });

  it("writes Anki's import headers and strips field separators", () => {
    const text = ankiImportText([card("1", "", { jp: "水\tagua" })]);
    expect(text.startsWith("#separator:tab\n#html:true\n#tags column:3\n")).toBe(true);
    expect(text.split("\n")[3]?.split("\t")).toHaveLength(3);
  });
});
