import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import {
  composeAlert,
  emptySnapshot,
  emptyState,
  snapshotSchema,
  type WanikaniSnapshot,
} from "@mainichi/core";
import {
  ConflictError,
  SNAPSHOT_FILE,
  STATE_FILE,
  type FileStore,
  type Notifier,
  type StoredFile,
} from "@mainichi/integrations";
import { parseArgs, parseEnv } from "../src/config";
import { runSync, type SyncDeps } from "../src/run";

class MemoryStore implements FileStore {
  files = new Map<string, StoredFile<unknown>>();
  writes = 0;

  async read(path: string) {
    return this.files.get(path) ?? null;
  }

  async write(path: string, value: unknown, sha: string | null) {
    if ((this.files.get(path)?.sha ?? null) !== sha) throw new ConflictError(path);
    const next = `sha-${++this.writes}`;
    this.files.set(path, { value: JSON.parse(JSON.stringify(value)), sha: next });
    return next;
  }
}

const wanikani: WanikaniSnapshot = {
  username: "juan",
  level: 3,
  maxLevelGranted: 3,
  reviewsAvailable: 12,
  lessonsAvailable: 4,
  nextReviewsAt: null,
  activeToday: false,
  srs: { apprentice: 1, guru: 0, master: 0, enlightened: 0, burned: 0 },
};

// 7:17 a. m. and 8:17 p. m. in Bogotá on 2026-11-02.
const MORNING = new Date("2026-11-02T12:17:00Z");
const EVENING = new Date("2026-11-03T01:17:00Z");

describe("runSync", () => {
  let store: MemoryStore;
  let send: Mock<Notifier["send"]>;
  let deps: SyncDeps;

  beforeEach(() => {
    store = new MemoryStore();
    send = vi.fn<Notifier["send"]>(async () => undefined);
    deps = {
      store,
      notifier: { send },
      wanikani: { snapshot: async () => wanikani },
      timeZone: "America/Bogota",
      hubUrl: "https://hub",
      now: () => MORNING,
    };
  });

  const savedSnapshot = () => snapshotSchema.parse(store.files.get(SNAPSHOT_FILE)?.value);

  it("refreshes data without alerting when no slot is given", async () => {
    const result = await runSync(deps, null);
    expect(result.alert).toBe("none");
    expect(send).not.toHaveBeenCalled();
    expect(savedSnapshot().wanikani?.reviewsAvailable).toBe(12);
  });

  it("sends the morning plan with fresh counts and a link to the hub", async () => {
    await runSync(deps, "morning");
    expect(send).toHaveBeenCalledOnce();
    const [alert, url] = send.mock.calls[0]!;
    expect(alert.body).toContain("12 repasos en WaniKani");
    expect(url).toBe("https://hub");
  });

  it("uses the user's day, not the UTC day, in the evening", async () => {
    const result = await runSync({ ...deps, now: () => EVENING }, "evening");
    expect(result.today).toBe("2026-11-02");
    expect(savedSnapshot().alertsSent.evening).toBe("2026-11-02");
  });

  it("decides the slot from the clock in auto mode, once a day", async () => {
    const first = await runSync(deps, "auto");
    expect(first.alert).toBe("sent");
    expect(savedSnapshot().alertsSent.morning).toBe("2026-11-02");
    const second = await runSync(deps, "auto");
    expect(second.alert).toBe("none");
    expect(send).toHaveBeenCalledOnce();
  });

  it("sends nothing in auto mode between the alert windows", async () => {
    const afternoon = new Date("2026-11-02T20:17:00Z");
    const result = await runSync({ ...deps, now: () => afternoon }, "auto");
    expect(result.alert).toBe("none");
  });

  it("lets a manual run resend an alert, to test the channel", async () => {
    await runSync(deps, "morning");
    const second = await runSync(deps, "morning");
    expect(second.alert).toBe("sent");
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("keeps today's activity across UTC midnight when a connector fails", async () => {
    store.files.set(SNAPSHOT_FILE, {
      value: {
        ...emptySnapshot(),
        generatedAt: "2026-11-03T00:30:00.000Z",
        wanikani: { ...wanikani, activeToday: true },
      },
      sha: "old",
    });
    const failing = {
      snapshot: async () => {
        throw new Error("caído");
      },
    };
    const result = await runSync({ ...deps, wanikani: failing, now: () => EVENING }, null);
    expect(result.snapshot.wanikani?.activeToday).toBe(true);
  });

  it("stays silent in the evening if WaniKani shows activity", async () => {
    const active = { ...wanikani, activeToday: true };
    const result = await runSync(
      { ...deps, wanikani: { snapshot: async () => active }, now: () => EVENING },
      "evening",
    );
    expect(result.alert).toBe("skipped");
    expect(send).not.toHaveBeenCalled();
  });

  it("still alerts when a connector fails, keeps old data and flags it", async () => {
    await runSync(deps, null);
    const failing = {
      snapshot: async () => {
        throw new Error("WaniKani respondió 503");
      },
    };
    const result = await runSync({ ...deps, wanikani: failing }, "morning");
    expect(result.alert).toBe("sent");
    expect(result.snapshot.wanikani?.level).toBe(3);
    expect(result.snapshot.errors).toEqual([
      { source: "WaniKani", message: "WaniKani respondió 503" },
    ]);
    expect(send.mock.calls[0]![0].body).toContain("WaniKani no se actualizó");
  });

  it("remembers days active only on WaniKani, so the streak survives the next day", async () => {
    const active = { ...wanikani, activeToday: true };
    await runSync({ ...deps, wanikani: { snapshot: async () => active } }, null);
    const nextDay = new Date("2026-11-03T15:00:00Z");
    const result = await runSync({ ...deps, now: () => nextDay }, null);
    expect(result.snapshot.activeDays).toEqual(["2026-11-02"]);
    const alert = composeAlert("evening", emptyState(), result.snapshot, "2026-11-03");
    expect(alert?.body).toContain("racha de 1 día");
  });

  it("clears yesterday's activity when the connector cannot refresh it", async () => {
    store.files.set(SNAPSHOT_FILE, {
      value: {
        ...emptySnapshot(),
        generatedAt: "2026-11-01T23:00:00.000Z",
        wanikani: { ...wanikani, activeToday: true },
      },
      sha: "old",
    });
    const failing = {
      snapshot: async () => {
        throw new Error("caído");
      },
    };
    const result = await runSync({ ...deps, wanikani: failing }, null);
    expect(result.snapshot.wanikani?.activeToday).toBe(false);
  });

  it("does not record the alert as sent if the notifier fails", async () => {
    send.mockRejectedValue(new Error("ntfy respondió 429"));
    await expect(runSync(deps, "morning")).rejects.toThrow("429");
    expect(store.files.has(SNAPSHOT_FILE)).toBe(false);
  });

  it("works before the browser has stored any state", async () => {
    const result = await runSync({ ...deps, wanikani: null }, "morning");
    expect(result.alert).toBe("sent");
  });

  it("reads the progress saved by the browser", async () => {
    const state = emptyState();
    state.progress.log["2026-11-02"] = {
      blocks: { srs: { done: true, minutes: 15, updatedAt: "" } },
      lesson: "",
      reviews: 0,
      sessions: [],
    };
    store.files.set(STATE_FILE, { value: state, sha: "s" });
    const result = await runSync({ ...deps, wanikani: null, now: () => EVENING }, "evening");
    expect(result.alert).toBe("skipped");
  });
});

describe("config", () => {
  const env = { DATA_REPO: "me/data", DATA_REPO_TOKEN: "t" };

  it("defaults the time zone and treats blank secrets as missing", () => {
    const parsed = parseEnv({ ...env, WANIKANI_TOKEN: "  " });
    expect(parsed.HUB_TIMEZONE).toBe("America/Bogota");
    expect(parsed.ALERT_MORNING_HOUR).toBe(7);
    expect(parseEnv({ ...env, ALERT_EVENING_HOUR: "21" }).ALERT_EVENING_HOUR).toBe(21);
    expect(parseEnv({ ...env, ALERT_MORNING_HOUR: "" }).ALERT_MORNING_HOUR).toBe(7);
    expect(parsed.WANIKANI_TOKEN).toBeUndefined();
  });

  it("rejects a malformed repository name", () => {
    expect(() => parseEnv({ ...env, DATA_REPO: "not a repo" })).toThrow();
  });

  it("parses the alert slot and dry-run flag", () => {
    expect(parseArgs(["--slot=morning", "--dry-run"])).toEqual({ slot: "morning", dryRun: true });
    expect(parseArgs(["--slot=none"])).toEqual({ slot: null, dryRun: false });
    expect(parseArgs(["--slot=auto"])).toEqual({ slot: "auto", dryRun: false });
    expect(parseArgs([])).toEqual({ slot: null, dryRun: false });
    expect(() => parseArgs(["--slot=noon"])).toThrow();
  });
});
