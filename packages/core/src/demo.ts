import { addDays } from "./dates";
import { KANA } from "./kana";
import { emptySnapshot, emptyState, type Card, type HubState, type Snapshot } from "./schema";

const DEMO_SESSIONS: ReadonlyArray<readonly [string, number, number]> = [
  ["udemy", 2, 20],
  ["busuu", 3, 15],
  ["bunpro", 4, 10],
  ["teppei", 5, 10],
];

/** Fictional data so visitors can explore the hub without connecting anything. */
export function demoState(today: string): HubState {
  const state = emptyState();
  const at = `${today}T12:00:00.000Z`;
  state.updatedAt = at;
  const skipped = new Set([5, 13, 22, 31, 40, 47, 58]);
  for (let i = 1; i <= 70; i++) {
    if (skipped.has(i)) continue;
    const block = (done: boolean, minutes: number) => ({ done, minutes, updatedAt: at });
    const full = i % 3 !== 0;
    state.progress.log[addDays(today, -i)] = {
      blocks: {
        srs: block(true, 15),
        les: block(full, full ? 20 : 8),
        out: block(full, full ? 10 : 0),
        lis: block(i % 2 === 0, i % 2 === 0 ? 10 : 0),
      },
      lesson: "",
      reviews: 12,
      sessions: DEMO_SESSIONS.flatMap(([resourceId, every, minutes]) =>
        i % every === 0
          ? [{ id: `demo-${i}-${resourceId}`, resourceId, minutes, note: "", at }]
          : [],
      ),
    };
  }
  state.progress.unlocked = { h: 8, k: 3 };
  for (const item of KANA.h.filter((k) => k.row < 8)) {
    state.progress.kana.h[item.char] = {
      box: item.row < 5 ? 5 : 2,
      due: addDays(today, item.row < 5 ? 6 : 0),
      attempts: 14,
      correct: 12,
    };
  }
  const card = (id: string, jp: string, reading: string, meaning: string, due: string): Card => ({
    id,
    jp,
    reading,
    meaning,
    example: "",
    exampleMeaning: "",
    tag: "vocabulario",
    createdOn: addDays(today, -10),
    box: 1,
    due,
    exported: false,
    updatedAt: at,
  });
  state.cards = [
    card("demo-1", "水", "みず", "agua", today),
    card("demo-2", "学生", "がくせい", "estudiante", today),
    card("demo-3", "食べます", "たべます", "comer", addDays(today, 3)),
  ];
  state.resources = {
    udemy: { url: "", done: 34, total: 120, updatedAt: at },
    busuu: { url: "", done: 12, total: 60, updatedAt: at },
    genki: { url: "", done: 3, total: 23, updatedAt: at },
  };
  state.listening = [
    {
      id: "demo-teppei",
      title: "Nihongo con Teppei (para principiantes)",
      kind: "podcast",
      level: "basico",
      url: "https://nihongoconteppei.com",
      done: 42,
      total: 0,
      catalogId: "teppei",
      updatedAt: at,
    },
    {
      id: "demo-shirokuma",
      title: "しろくまカフェ (Polar Bear Café)",
      kind: "anime",
      level: "basico",
      url: "",
      done: 6,
      total: 50,
      catalogId: "shirokuma",
      updatedAt: at,
    },
  ];
  state.anki = {
    syncedAt: at,
    deck: "Mainichi Hub",
    dueNew: 5,
    dueLearn: 2,
    dueReview: 28,
    total: 412,
    byDay: { [addDays(today, -1)]: 42, [addDays(today, -2)]: 38 },
  };
  return state;
}

export function demoSnapshot(today: string): Snapshot {
  return {
    ...emptySnapshot(),
    generatedAt: `${today}T12:00:00.000Z`,
    wanikani: {
      username: "demo",
      level: 4,
      maxLevelGranted: 60,
      reviewsAvailable: 37,
      lessonsAvailable: 8,
      nextReviewsAt: `${today}T15:00:00.000Z`,
      activeToday: false,
      srs: { apprentice: 64, guru: 121, master: 40, enlightened: 12, burned: 0 },
    },
  };
}
