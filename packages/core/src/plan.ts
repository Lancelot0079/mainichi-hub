import { blockDone, BLOCKS, currentStreak, dayActive, type Block } from "./activity";
import { addDays, daysBetween } from "./dates";
import type { AlertSlot, BlockId, HubState, Milestone, Snapshot } from "./schema";
import { cardsDue, kanaDue } from "./srs";

export interface PlanItem {
  id: string;
  /** Routine block the item belongs to, which gives it its color. */
  block: BlockId;
  jp: string;
  title: string;
  detail: string;
  count: number;
  href: string;
  /** Opens another site rather than a page of the hub. */
  external: boolean;
}

export interface DailyPlan {
  items: PlanItem[];
  pendingBlocks: Block[];
  studied: boolean;
  streak: number;
  nextMilestone: (Milestone & { daysLeft: number }) | null;
}

/** Days with practice that only the scheduled job knows about, including today's so far. */
export function externalActiveDays(snapshot: Snapshot, today: string): ReadonlySet<string> {
  const days = new Set(snapshot.activeDays);
  if (snapshot.wanikani?.activeToday) days.add(today);
  return days;
}

export function upcomingMilestones(state: HubState, today: string) {
  return state.settings.milestones
    .filter((m) => m.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((m) => ({ ...m, daysLeft: daysBetween(today, m.date) }));
}

/** One definition of "what is due today", shared by the dashboard and the push alerts. */
export function dailyPlan(state: HubState, snapshot: Snapshot, today: string): DailyPlan {
  const log = state.progress.log[today];
  const wanikani = snapshot.wanikani;
  const items: PlanItem[] = [];

  if (wanikani) {
    items.push({
      id: "wanikani",
      block: "srs",
      jp: "鰐",
      title: `${wanikani.reviewsAvailable} repasos en WaniKani`,
      detail: `${wanikani.lessonsAvailable} lecciones nuevas · nivel ${wanikani.level}`,
      count: wanikani.reviewsAvailable + wanikani.lessonsAvailable,
      href: "https://www.wanikani.com/dashboard",
      external: true,
    });
  }
  if (state.anki) {
    const due = state.anki.dueNew + state.anki.dueLearn + state.anki.dueReview;
    items.push({
      id: "anki",
      block: "srs",
      jp: "暗",
      title: `${due} tarjetas en Anki`,
      detail: `Mazo ${state.anki.deck}, según la última conexión`,
      count: due,
      href: "#recursos",
      external: false,
    });
  }
  const kana = kanaDue(state, "h", today).length + kanaDue(state, "k", today).length;
  items.push({
    id: "kana",
    block: "srs",
    jp: "仮名",
    title: `${kana} kana por repasar`,
    detail: kana ? "Unos 3 minutos" : "Nada pendiente; puedes hacer práctica libre",
    count: kana,
    href: "#kana",
    external: false,
  });
  const cards = cardsDue(state.cards, today).length;
  items.push({
    id: "cards",
    block: "les",
    jp: "単語",
    title: `${cards} tarjetas por repasar`,
    detail: cards ? "Cuenta para el bloque de repaso" : "Agrega tarjetas desde tus apuntes",
    count: cards,
    href: "#tarjetas",
    external: false,
  });
  const wrote = state.diary.some((e) => e.date === today && !e.deletedAt);
  items.push({
    id: "diary",
    block: "out",
    jp: "日記",
    title: wrote ? "Diario escrito hoy" : "Diario sin escribir",
    detail: wrote ? "Bien hecho" : "Tema del día listo",
    count: wrote ? 0 : 1,
    href: "#diario",
    external: false,
  });

  return {
    items,
    pendingBlocks: BLOCKS.filter((b) => !blockDone(log, b)),
    studied: dayActive(state, today) || !!wanikani?.activeToday,
    streak: currentStreak(state, today, externalActiveDays(snapshot, today)),
    nextMilestone: upcomingMilestones(state, today)[0] ?? null,
  };
}

export interface Alert {
  title: string;
  body: string;
  tags: string[];
  priority: "default" | "high";
}

const pendingLines = (plan: DailyPlan) =>
  plan.items.filter((i) => i.count > 0 && i.id !== "diary").map((i) => `• ${i.title}`);

export interface AlertHours {
  morning: number;
  evening: number;
}

export const DEFAULT_ALERT_HOURS: AlertHours = { morning: 7, evening: 20 };

/** A plan for the day stops being useful around midday, so a late run skips it. */
const MORNING_WINDOW_HOURS = 5;

/**
 * Which alert is due right now. The job runs hourly and decides from the clock instead of relying
 * on one exact schedule, because GitHub can delay or drop scheduled runs: any run inside the
 * window delivers the alert, and `alertsSent` keeps it to one per day.
 */
export function dueAlertSlot(
  hour: number,
  today: string,
  sent: Snapshot["alertsSent"],
  hours: AlertHours = DEFAULT_ALERT_HOURS,
): AlertSlot | null {
  if (hour >= hours.evening) return sent.evening === today ? null : "evening";
  const inMorning = hour >= hours.morning && hour < hours.morning + MORNING_WINDOW_HOURS;
  return inMorning && sent.morning !== today ? "morning" : null;
}

/** Returns `null` when there is nothing worth interrupting the user for. */
export function composeAlert(
  slot: AlertSlot,
  state: HubState,
  snapshot: Snapshot,
  today: string,
): Alert | null {
  const plan = dailyPlan(state, snapshot, today);

  if (slot === "evening") {
    if (plan.studied) return null;
    const streak = currentStreak(state, addDays(today, -1), externalActiveDays(snapshot, today));
    const risk =
      streak > 0
        ? `Tu racha de ${streak} ${streak === 1 ? "día" : "días"} se corta hoy.`
        : "Con 10 minutos hoy empiezas una racha nueva.";
    return {
      title: "Aún no registras práctica hoy",
      body: [risk, ...pendingLines(plan).slice(0, 3)].join("\n"),
      tags: ["hourglass_flowing_sand"],
      priority: "high",
    };
  }

  const lines = pendingLines(plan);
  const milestone = plan.nextMilestone;
  return {
    title: `毎日日本語: ${plan.streak} ${plan.streak === 1 ? "día seguido" : "días seguidos"}`,
    body: [
      ...(lines.length ? lines : ["Nada pendiente en tus repasos. Buen día para material nuevo."]),
      `Rutina: ${plan.pendingBlocks.map((b) => b.title).join(", ") || "completa"}`,
      ...(milestone ? [`${milestone.short}: faltan ${milestone.daysLeft} días`] : []),
    ].join("\n"),
    tags: ["sunrise"],
    priority: "default",
  };
}
