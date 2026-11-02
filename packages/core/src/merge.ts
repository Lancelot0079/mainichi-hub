import type {
  BlockLog,
  Card,
  DayLog,
  DiaryEntry,
  ExamAttempt,
  HubState,
  KanaRecord,
  ListeningItem,
  ResourceSession,
  ResourceTrack,
} from "./schema";

/**
 * Deterministic merge of two device states. Each field has a rule that does not depend on merge
 * order, so devices converge however their writes interleave. Deletions are tombstones
 * (`deletedAt`) because a missing item cannot be told apart from one the other device just created.
 */

type Stamped = { updatedAt: string };

const newer = <T extends Stamped>(a: T, b: T): T => (b.updatedAt > a.updatedAt ? b : a);

function mergeRecord<T>(
  a: Record<string, T>,
  b: Record<string, T>,
  pick: (x: T, y: T) => T,
): Record<string, T> {
  const out: Record<string, T> = { ...a };
  for (const [key, value] of Object.entries(b)) {
    const current = out[key];
    out[key] = current === undefined ? value : pick(current, value);
  }
  return out;
}

function mergeById<T extends { id: string }>(a: T[], b: T[], pick: (x: T, y: T) => T): T[] {
  const byId = new Map(a.map((item) => [item.id, item]));
  for (const item of b) {
    const current = byId.get(item.id);
    byId.set(item.id, current ? pick(current, item) : item);
  }
  return [...byId.values()];
}

/** Newest edit wins, and a tombstone beats an edit made at the same instant. */
function pickVersion<T extends Stamped & { deletedAt?: string }>(a: T, b: T): T {
  if (a.updatedAt !== b.updatedAt) return newer(a, b);
  if (!!a.deletedAt !== !!b.deletedAt) return a.deletedAt ? a : b;
  return JSON.stringify(a) >= JSON.stringify(b) ? a : b;
}

const pickSession = (a: ResourceSession, b: ResourceSession): ResourceSession =>
  a.deletedAt ? a : b.deletedAt ? b : JSON.stringify(a) >= JSON.stringify(b) ? a : b;

const bySessionTime = (a: ResourceSession, b: ResourceSession) =>
  a.at.localeCompare(b.at) || a.id.localeCompare(b.id);

/** Sorted so that every merge order produces the same bytes, which avoids empty sync commits. */
const withSortedSessions = (log: Record<string, DayLog>): Record<string, DayLog> =>
  Object.fromEntries(
    Object.entries(log).map(([day, entry]) => [
      day,
      { ...entry, sessions: [...entry.sessions].sort(bySessionTime) },
    ]),
  );

function pickLesson(a: DayLog, b: DayLog): DayLog {
  const [timeA, timeB] = [a.lessonUpdatedAt ?? "", b.lessonUpdatedAt ?? ""];
  if (timeA !== timeB) return timeA > timeB ? a : b;
  return a.lesson >= b.lesson ? a : b;
}

function mergeDay(a: DayLog, b: DayLog): DayLog {
  const lesson = pickLesson(a, b);
  return {
    blocks: mergeRecord(
      a.blocks as Record<string, BlockLog>,
      b.blocks as Record<string, BlockLog>,
      newer,
    ),
    lesson: lesson.lesson,
    lessonUpdatedAt: lesson.lessonUpdatedAt,
    reviews: Math.max(a.reviews, b.reviews),
    sessions: mergeById(a.sessions, b.sessions, pickSession),
  };
}

/** Attempts only grow, so the record with more attempts has seen everything the other has. */
function pickKana(a: KanaRecord, b: KanaRecord): KanaRecord {
  if (a.attempts !== b.attempts) return a.attempts > b.attempts ? a : b;
  return a.due >= b.due ? a : b;
}

export function mergeStates(a: HubState, b: HubState): HubState {
  const [older, latest] = b.updatedAt > a.updatedAt ? [a, b] : [b, a];
  const weekly = { ...older.progress.weekly };
  for (const [week, checks] of Object.entries(latest.progress.weekly)) {
    weekly[week] = { ...weekly[week], ...checks };
  }
  return {
    version: latest.version,
    updatedAt: latest.updatedAt,
    progress: {
      log: withSortedSessions(mergeRecord(a.progress.log, b.progress.log, mergeDay)),
      kana: {
        h: mergeRecord(a.progress.kana.h, b.progress.kana.h, pickKana),
        k: mergeRecord(a.progress.kana.k, b.progress.kana.k, pickKana),
      },
      unlocked: {
        h: Math.max(a.progress.unlocked.h, b.progress.unlocked.h),
        k: Math.max(a.progress.unlocked.k, b.progress.unlocked.k),
      },
      weekly,
      script: latest.progress.script,
    },
    cards: mergeById<Card>(a.cards, b.cards, pickVersion),
    diary: mergeById<DiaryEntry>(a.diary, b.diary, pickVersion),
    resources: mergeRecord<ResourceTrack>(a.resources, b.resources, newer),
    listening: mergeById<ListeningItem>(a.listening, b.listening, pickVersion),
    exams: mergeById<ExamAttempt>(a.exams, b.exams, pickVersion),
    settings: newer(latest.settings, older.settings),
    anki: !a.anki
      ? b.anki
      : !b.anki
        ? a.anki
        : a.anki.syncedAt >= b.anki.syncedAt
          ? a.anki
          : b.anki,
  };
}
