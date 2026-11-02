import { addDays } from "./dates";
import { KANA, KANA_ROW_COUNT, type KanaItem, type Script } from "./kana";
import type { Card, HubState, KanaRecord } from "./schema";

/** Days until the next review for each Leitner box. */
export const INTERVALS = [0, 1, 2, 4, 7, 15, 30] as const;
const MAX_BOX = INTERVALS.length - 1;
const UNLOCK_BOX = 2;
export const MASTERED_BOX = 4;

const interval = (box: number) => INTERVALS[Math.min(box, MAX_BOX)] ?? 0;

export const unlockedKana = (state: HubState, script: Script): KanaItem[] =>
  KANA[script].filter((k) => k.row < state.progress.unlocked[script]);

export function kanaDue(state: HubState, script: Script, today: string): KanaItem[] {
  return unlockedKana(state, script).filter((k) => {
    const record = state.progress.kana[script][k.char];
    return !record || record.due <= today;
  });
}

export const kanaMastered = (state: HubState, script: Script) =>
  KANA[script].filter((k) => (state.progress.kana[script][k.char]?.box ?? 0) >= MASTERED_BOX)
    .length;

export function gradeKana(
  record: KanaRecord | undefined,
  correct: boolean,
  today: string,
  free = false,
): KanaRecord {
  const base: KanaRecord = record ?? { box: 0, due: today, attempts: 0, correct: 0 };
  const next: KanaRecord = {
    ...base,
    attempts: base.attempts + 1,
    correct: base.correct + (correct ? 1 : 0),
  };
  if (free) return next;
  if (!correct) return { ...next, box: 0, due: today };
  const box = Math.min(MAX_BOX, base.box + 1);
  return { ...next, box, due: addDays(today, interval(box)) };
}

/** Returns the row to unlock next, or `null` while the current rows are not yet learned. */
export function nextUnlock(state: HubState, script: Script): number | null {
  const unlocked = state.progress.unlocked[script];
  if (unlocked >= KANA_ROW_COUNT) return null;
  const ready = unlockedKana(state, script).every(
    (k) => (state.progress.kana[script][k.char]?.box ?? 0) >= UNLOCK_BOX,
  );
  return ready ? unlocked : null;
}

export const liveCards = (cards: Card[]) => cards.filter((c) => !c.deletedAt);

export const cardsDue = (cards: Card[], today: string) =>
  liveCards(cards).filter((c) => c.due <= today);

export type CardRating = 0 | 1 | 2;

/** 0 = again (stays due today), 1 = good, 2 = easy. */
export function rateCard(card: Card, rating: CardRating, today: string, at: string): Card {
  if (rating === 0) return { ...card, box: 0, due: today, updatedAt: at };
  const box = Math.min(MAX_BOX, card.box + rating);
  return { ...card, box, due: addDays(today, Math.max(1, interval(box))), updatedAt: at };
}
