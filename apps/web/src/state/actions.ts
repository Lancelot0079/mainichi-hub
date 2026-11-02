import {
  blockMinutes,
  BLOCKS,
  gradeKana,
  KANA,
  nextUnlock,
  rateCard,
  type BlockId,
  type Card,
  type CardRating,
  type Correction,
  type DayLog,
  type DraftCard,
  type HubState,
  type KanaItem,
  type Milestone,
  type Script,
} from "@mainichi/core";
import { getHub, update } from "./store";

const MAX_DIARY_ENTRIES = 120;

const now = () => new Date().toISOString();
const newId = () => crypto.randomUUID();

function dayLog(state: HubState, day: string): DayLog {
  const log = state.progress.log[day];
  if (log) return log;
  const created: DayLog = { blocks: {}, lesson: "", reviews: 0, sessions: [] };
  state.progress.log[day] = created;
  return created;
}

function blockLog(log: DayLog, block: BlockId) {
  const entry = log.blocks[block] ?? { done: false, minutes: 0, updatedAt: "" };
  log.blocks[block] = entry;
  return entry;
}

export function addBlockMinutes(block: BlockId, minutes: number, done: boolean) {
  update((s) => {
    const entry = blockLog(dayLog(s, getHub().today), block);
    entry.minutes += minutes;
    entry.done ||= done;
    entry.updatedAt = now();
  });
}

export function toggleBlock(block: BlockId) {
  update((s) => {
    const log = dayLog(s, getHub().today);
    const entry = blockLog(log, block);
    const target = BLOCKS.find((b) => b.id === block)?.minutes ?? 0;
    entry.done = !entry.done;
    entry.minutes = entry.done ? entry.minutes + Math.max(0, target - blockMinutes(log, block)) : 0;
    entry.updatedAt = now();
  });
}

export function setLesson(lesson: string) {
  update((s) => {
    const log = dayLog(s, getHub().today);
    log.lesson = lesson;
    log.lessonUpdatedAt = now();
  });
}

export function logSession(resourceId: string, minutes: number, note: string) {
  update((s) => {
    dayLog(s, getHub().today).sessions.push({ id: newId(), resourceId, minutes, note, at: now() });
  });
}

export function removeSession(day: string, id: string) {
  update((s) => {
    const session = s.progress.log[day]?.sessions.find((x) => x.id === id);
    if (session) session.deletedAt = now();
  });
}

export function setResourceProgress(
  id: string,
  patch: Partial<{ url: string; done: number; total: number }>,
) {
  update((s) => {
    const current = s.resources[id] ?? { url: "", done: 0, total: 0, updatedAt: "" };
    s.resources[id] = { ...current, ...patch, updatedAt: now() };
  });
}

/** Grades an answer and returns the kana of a row it unlocked, if any. */
export function answerKana(
  script: Script,
  item: KanaItem,
  correct: boolean,
  free: boolean,
): KanaItem[] {
  let unlocked: KanaItem[] = [];
  update((s) => {
    const records = s.progress.kana[script];
    const today = getHub().today;
    records[item.char] = gradeKana(records[item.char], correct, today, free);
    dayLog(s, today).reviews += 1;
    if (free) return;
    const row = nextUnlock(s, script);
    if (row !== null) {
      s.progress.unlocked[script] = row + 1;
      unlocked = KANA[script].filter((k) => k.row === row);
    }
  });
  return unlocked;
}

export function setScript(script: Script) {
  update((s) => {
    s.progress.script = script;
  });
}

export function reviewCard(id: string, rating: CardRating) {
  update((s) => {
    const index = s.cards.findIndex((c) => c.id === id);
    const card = s.cards[index];
    if (!card) return;
    const today = getHub().today;
    const rated = rateCard(card, rating, today, now());
    s.cards.splice(index, 1);
    // A failed card goes to the back of today's queue.
    if (rating === 0) s.cards.push(rated);
    else s.cards.splice(index, 0, rated);
    dayLog(s, today).reviews += 1;
  });
}

const makeCard = (draft: DraftCard, today: string, at: string): Card => ({
  id: newId(),
  jp: draft.jp,
  reading: draft.r,
  meaning: draft.es,
  example: draft.ej,
  exampleMeaning: draft.ejes,
  tag: draft.t,
  createdOn: today,
  box: 0,
  due: today,
  exported: false,
  updatedAt: at,
});

/** Returns how many drafts were new; the rest were already in the deck. */
export function addCards(drafts: DraftCard[]): number {
  let added = 0;
  update((s) => {
    const seen = new Set(s.cards.filter((c) => !c.deletedAt).map((c) => `${c.jp}|${c.meaning}`));
    for (const draft of drafts) {
      if (seen.has(`${draft.jp}|${draft.es}`)) continue;
      s.cards.push(makeCard(draft, getHub().today, now()));
      added += 1;
    }
  });
  return added;
}

export function deleteCard(id: string) {
  update((s) => {
    const card = s.cards.find((c) => c.id === id);
    if (card) {
      card.deletedAt = now();
      card.updatedAt = card.deletedAt;
    }
  });
}

export function restoreCard(id: string) {
  update((s) => {
    const card = s.cards.find((c) => c.id === id);
    if (card) {
      delete card.deletedAt;
      card.updatedAt = now();
    }
  });
}

export function markExported(ids: string[]) {
  const wanted = new Set(ids);
  update((s) => {
    for (const card of s.cards) {
      if (wanted.has(card.id)) {
        card.exported = true;
        card.updatedAt = now();
      }
    }
  });
}

export function saveDiaryEntry(text: string, prompt: string, feedback: Correction | null) {
  update((s) => {
    const today = getHub().today;
    s.diary.push({ id: newId(), date: today, prompt, text, feedback, updatedAt: now() });
    if (s.diary.length > MAX_DIARY_ENTRIES) s.diary.splice(0, s.diary.length - MAX_DIARY_ENTRIES);
    const entry = blockLog(dayLog(s, today), "out");
    entry.done = true;
    entry.minutes ||= BLOCKS.find((b) => b.id === "out")?.minutes ?? 0;
    entry.updatedAt = now();
  });
}

export function setWeekly(week: string, check: string, value: boolean) {
  update((s) => {
    s.progress.weekly[week] = { ...s.progress.weekly[week], [check]: value };
  });
}

export function setMilestones(milestones: Milestone[]) {
  update((s) => {
    s.settings.milestones = milestones;
    s.settings.updatedAt = now();
  });
}
