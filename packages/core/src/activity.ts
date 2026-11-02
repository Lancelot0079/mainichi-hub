import { addDays, daysBetween } from "./dates";
import { resourceById } from "./resources";
import type { BlockId, DayLog, HubState, ResourceSession } from "./schema";

export interface Block {
  id: BlockId;
  jp: string;
  title: string;
  minutes: number;
  description: string;
}

export const BLOCKS: readonly Block[] = [
  {
    id: "srs",
    jp: "復習",
    title: "Repaso espaciado",
    minutes: 15,
    description: "WaniKani, Bunpro o Anki antes de ver material nuevo.",
  },
  {
    id: "les",
    jp: "授業",
    title: "Lección",
    minutes: 20,
    description: "Una clase de Udemy o Busuu, repitiendo en voz alta.",
  },
  {
    id: "out",
    jp: "作文",
    title: "Escribir",
    minutes: 10,
    description: "Tres oraciones en el diario con lo de hoy.",
  },
  {
    id: "lis",
    jp: "聴解",
    title: "Escuchar",
    minutes: 10,
    description: "Podcast o video para principiantes, aunque no entiendas todo.",
  },
];

export const DAILY_TARGET_MINUTES = BLOCKS.reduce((sum, b) => sum + b.minutes, 0);

export const liveSessions = (log: DayLog | undefined): ResourceSession[] =>
  log?.sessions.filter((s) => !s.deletedAt) ?? [];

export function blockMinutes(log: DayLog | undefined, block: BlockId): number {
  const timed = log?.blocks[block]?.minutes ?? 0;
  const logged = liveSessions(log)
    .filter((s) => resourceById(s.resourceId)?.block === block)
    .reduce((sum, s) => sum + s.minutes, 0);
  return timed + logged;
}

/** A block counts as done when ticked, or when logged sessions reach its target minutes. */
export function blockDone(log: DayLog | undefined, block: Block): boolean {
  return !!log?.blocks[block.id]?.done || blockMinutes(log, block.id) >= block.minutes;
}

export const dayMinutes = (log: DayLog | undefined) =>
  BLOCKS.reduce((sum, b) => sum + blockMinutes(log, b.id), 0);

export const dayComplete = (log: DayLog | undefined) => BLOCKS.every((b) => blockDone(log, b));

/** Any practice counts toward the streak, including reviews reported by Anki. */
export function dayActive(state: HubState, day: string): boolean {
  const log = state.progress.log[day];
  const logged =
    dayMinutes(log) > 0 || BLOCKS.some((b) => log?.blocks[b.id]?.done) || (log?.reviews ?? 0) > 0;
  return logged || (state.anki?.byDay[day] ?? 0) > 0;
}

/** `externalDays` are days with activity known only outside the state, like WaniKani reviews. */
export function currentStreak(
  state: HubState,
  today: string,
  externalDays: ReadonlySet<string> = new Set(),
): number {
  const active = (day: string) => externalDays.has(day) || dayActive(state, day);
  let day = active(today) ? today : addDays(today, -1);
  let streak = 0;
  while (active(day) && streak < 3650) {
    streak += 1;
    day = addDays(day, -1);
  }
  return streak;
}

export function bestStreak(state: HubState, externalDays: ReadonlySet<string> = new Set()): number {
  const days = [
    ...new Set([
      ...Object.keys(state.progress.log),
      ...Object.keys(state.anki?.byDay ?? {}),
      ...externalDays,
    ]),
  ]
    .filter((d) => externalDays.has(d) || dayActive(state, d))
    .sort();
  let best = 0;
  let run = 0;
  let previous: string | null = null;
  for (const day of days) {
    run = previous && daysBetween(previous, day) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    previous = day;
  }
  return best;
}
