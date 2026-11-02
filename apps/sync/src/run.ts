import {
  composeAlert,
  dayInTimeZone,
  dueAlertSlot,
  emptySnapshot,
  emptyState,
  hourInTimeZone,
  snapshotSchema,
  startOfDayUtc,
  type AlertHours,
  type AlertSlot,
  type Snapshot,
  type WanikaniSnapshot,
} from "@mainichi/core";
import {
  readRemoteState,
  SNAPSHOT_FILE,
  type FileStore,
  type Notifier,
} from "@mainichi/integrations";

/** A platform the job can read on its own. New connectors plug in here. */
export interface WanikaniSource {
  snapshot(now: Date, activeSince: Date): Promise<WanikaniSnapshot>;
}

export interface SyncDeps {
  store: FileStore;
  notifier: Notifier;
  wanikani: WanikaniSource | null;
  timeZone: string;
  hubUrl?: string;
  alertHours?: AlertHours;
  now: () => Date;
}

/** `auto` decides from the clock; a slot name forces it; `null` only refreshes data. */
export type SlotRequest = AlertSlot | "auto" | null;

export interface SyncResult {
  today: string;
  snapshot: Snapshot;
  alert: "sent" | "skipped" | "none";
}

const ACTIVE_DAYS_KEPT = 800;

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

/**
 * One scheduled run: refresh connected data, send the alert for `slot` if due, save the snapshot.
 * A failing connector degrades the alert rather than cancelling it: the reminder matters more
 * than a fresh count, so the previous value is kept and the failure is recorded.
 */
export async function runSync(deps: SyncDeps, request: SlotRequest): Promise<SyncResult> {
  const now = deps.now();
  const today = dayInTimeZone(now, deps.timeZone);
  const stored = await deps.store.read(SNAPSHOT_FILE);
  const previous = stored ? snapshotSchema.parse(stored.value) : emptySnapshot();
  const remote = await readRemoteState(deps.store);
  const state = remote?.state ?? emptyState();

  const lastRunDay =
    previous.generatedAt && dayInTimeZone(new Date(previous.generatedAt), deps.timeZone);

  const snapshot: Snapshot = {
    ...previous,
    generatedAt: now.toISOString(),
    errors: [],
    wanikani:
      previous.wanikani && previous.generatedAt && lastRunDay === today
        ? previous.wanikani
        : previous.wanikani && { ...previous.wanikani, activeToday: false },
  };

  if (deps.wanikani) {
    try {
      snapshot.wanikani = await deps.wanikani.snapshot(now, startOfDayUtc(today, deps.timeZone));
    } catch (error) {
      snapshot.errors.push({ source: "WaniKani", message: errorMessage(error) });
    }
  }

  if (snapshot.wanikani?.activeToday) {
    snapshot.activeDays = [...new Set([...previous.activeDays, today])].slice(-ACTIVE_DAYS_KEPT);
  }

  const hour = hourInTimeZone(now, deps.timeZone);
  const slot =
    request === "auto" ? dueAlertSlot(hour, today, snapshot.alertsSent, deps.alertHours) : request;

  let alertOutcome: SyncResult["alert"] = "none";
  const forced = request !== "auto";
  if (slot && (forced || snapshot.alertsSent[slot] !== today)) {
    const alert = composeAlert(slot, state, snapshot, today);
    if (alert) {
      const warning = snapshot.errors.map((e) => `⚠ ${e.source} no se actualizó`);
      await deps.notifier.send(
        { ...alert, body: [alert.body, ...warning].join("\n") },
        deps.hubUrl,
      );
      alertOutcome = "sent";
    } else {
      alertOutcome = "skipped";
    }
    // Recorded even when skipped, so a re-run of the job cannot alert late.
    snapshot.alertsSent = { ...snapshot.alertsSent, [slot]: today };
  }

  await deps.store.write(SNAPSHOT_FILE, snapshot, stored?.sha ?? null, `snapshot: ${today}`);
  return { today, snapshot, alert: alertOutcome };
}
