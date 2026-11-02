import { describe, expect, it, vi } from "vitest";
import { emptyState, type Card, type HubState } from "@mainichi/core";
import {
  AnkiConnectClient,
  AnkiUnavailableError,
  ConflictError,
  GitHubFileStore,
  HttpError,
  NtfyNotifier,
  pushState,
  STATE_FILE,
  WanikaniClient,
  type FileStore,
  type StoredFile,
} from "../src";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

class MemoryStore implements FileStore {
  files = new Map<string, StoredFile<unknown>>();
  writes = 0;
  /** Simulates another device writing right before our next write lands. */
  interfere: (() => void) | null = null;

  async read(path: string) {
    return this.files.get(path) ?? null;
  }

  async write(path: string, value: unknown, sha: string | null) {
    this.interfere?.();
    this.interfere = null;
    if ((this.files.get(path)?.sha ?? null) !== sha) throw new ConflictError(path);
    const next = `sha-${++this.writes}`;
    this.files.set(path, { value: JSON.parse(JSON.stringify(value)), sha: next });
    return next;
  }
}

const card = (id: string): Card => ({
  id,
  jp: "水",
  reading: "みず",
  meaning: "agua",
  example: "",
  exampleMeaning: "",
  tag: "",
  createdOn: "2026-11-02",
  box: 0,
  due: "2026-11-02",
  exported: false,
  updatedAt: "2026-11-02T10:00:00.000Z",
});

const stateWith = (updatedAt: string, ...cards: Card[]): HubState => ({
  ...emptyState(),
  updatedAt,
  cards,
});

describe("GitHubFileStore", () => {
  const base64 = (text: string) => Buffer.from(text, "utf8").toString("base64");

  it("decodes Japanese text from base64 content", async () => {
    const fetch = vi.fn(async () =>
      json({ content: base64('{"jp":"毎日"}'), encoding: "base64", sha: "abc" }),
    );
    const store = new GitHubFileStore({ repo: "me/data", token: "t", fetch });
    expect(await store.read("state.json")).toEqual({ value: { jp: "毎日" }, sha: "abc" });
    expect(fetch).toHaveBeenCalledWith(
      "https://api.github.com/repos/me/data/contents/state.json",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("returns null for a file that does not exist yet", async () => {
    const store = new GitHubFileStore({
      repo: "me/data",
      token: "t",
      fetch: async () => json({}, 404),
    });
    expect(await store.read("state.json")).toBeNull();
  });

  it("falls back to the raw endpoint for files over 1 MB", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(json({ content: "", encoding: "none", sha: "big" }))
      .mockResolvedValueOnce(json({ large: true }));
    const store = new GitHubFileStore({ repo: "me/data", token: "t", fetch });
    expect(await store.read("state.json")).toEqual({ value: { large: true }, sha: "big" });
  });

  it("sends the SHA and round-trips UTF-8 on write", async () => {
    const fetch = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) =>
      json({ content: { sha: "new" } }),
    );
    const store = new GitHubFileStore({ repo: "me/data", token: "t", fetch });
    expect(await store.write("state.json", { jp: "日本語" }, "old", "msg")).toBe("new");
    const body = JSON.parse(fetch.mock.calls[0]?.[1]?.body as string);
    expect(body.sha).toBe("old");
    expect(Buffer.from(body.content, "base64").toString("utf8")).toContain("日本語");
  });

  it("maps a stale SHA to a conflict and other failures to HttpError", async () => {
    const conflict = new GitHubFileStore({
      repo: "me/data",
      token: "t",
      fetch: async () => json({}, 409),
    });
    await expect(conflict.write("a", {}, "x", "m")).rejects.toBeInstanceOf(ConflictError);
    const denied = new GitHubFileStore({
      repo: "me/data",
      token: "t",
      fetch: async () => json({}, 401),
    });
    await expect(denied.read("a")).rejects.toBeInstanceOf(HttpError);
  });
});

describe("pushState", () => {
  const at = "2026-11-02T12:00:00.000Z";

  it("creates the file on the first sync", async () => {
    const store = new MemoryStore();
    await pushState(store, stateWith(at, card("a")), at);
    expect(store.files.get(STATE_FILE)?.sha).toBe("sha-1");
  });

  it("merges with what another device already stored", async () => {
    const store = new MemoryStore();
    await pushState(store, stateWith("2026-11-02T10:00:00.000Z", card("phone")), at);
    const merged = await pushState(store, stateWith(at, card("pc")), at);
    expect(merged.cards.map((c) => c.id).sort()).toEqual(["pc", "phone"]);
  });

  it("does not write when nothing changed", async () => {
    const store = new MemoryStore();
    const state = stateWith(at, card("a"));
    await pushState(store, state, at);
    await pushState(store, state, at);
    expect(store.writes).toBe(1);
  });

  it("retries on top of a concurrent write without losing either side", async () => {
    const store = new MemoryStore();
    await pushState(store, stateWith("2026-11-02T09:00:00.000Z", card("base")), at);
    store.interfere = () => {
      store.files.set(STATE_FILE, {
        value: stateWith("2026-11-02T11:00:00.000Z", card("base"), card("phone")),
        sha: "other-device",
      });
    };
    const merged = await pushState(store, stateWith(at, card("pc")), at);
    expect(merged.cards.map((c) => c.id).sort()).toEqual(["base", "pc", "phone"]);
  });

  it("gives up after repeated conflicts instead of looping forever", async () => {
    const store = new MemoryStore();
    vi.spyOn(store, "write").mockRejectedValue(new ConflictError(STATE_FILE));
    await expect(pushState(store, stateWith(at), at)).rejects.toBeInstanceOf(ConflictError);
  });
});

describe("WanikaniClient", () => {
  const now = new Date("2026-11-02T12:00:00Z");

  const routes = (url: string) => {
    if (url.endsWith("/user")) {
      return json({
        data: { username: "juan", level: 3, subscription: { max_level_granted: 3 } },
      });
    }
    if (url.endsWith("/summary")) {
      return json({
        data: {
          lessons: [{ available_at: "2026-11-02T00:00:00Z", subject_ids: [1, 2] }],
          reviews: [
            { available_at: "2026-11-02T11:00:00Z", subject_ids: [3, 4, 5] },
            { available_at: "2026-11-02T18:00:00Z", subject_ids: [6] },
          ],
          next_reviews_at: "2026-11-02T18:00:00Z",
        },
      });
    }
    if (url.includes("updated_after")) return json({ total_count: 4 });
    if (url.includes("srs_stages=1,2,3,4")) return json({ total_count: 10 });
    return json({ total_count: 1 });
  };

  it("counts only what is available now and reports activity", async () => {
    const fetch = vi.fn(async (url: string | URL | Request, _init?: RequestInit) =>
      routes(String(url)),
    );
    const client = new WanikaniClient({ token: "t", fetch });
    const snapshot = await client.snapshot(now, new Date("2026-11-02T05:00:00Z"));
    expect(snapshot).toMatchObject({
      username: "juan",
      level: 3,
      reviewsAvailable: 3,
      lessonsAvailable: 2,
      activeToday: true,
      srs: { apprentice: 10, burned: 1 },
    });
    expect(fetch.mock.calls[0]?.[1]).toMatchObject({
      headers: { Authorization: "Bearer t", "Wanikani-Revision": "20170710" },
    });
  });

  it("reports an invalid token as HttpError", async () => {
    const client = new WanikaniClient({ token: "bad", fetch: async () => json({}, 401) });
    await expect(client.snapshot(now, now)).rejects.toBeInstanceOf(HttpError);
  });
});

describe("AnkiConnectClient", () => {
  const today = "2026-11-02";
  const at = `${today}T12:00:00.000Z`;

  function fakeAnki(results: Record<string, unknown>) {
    const calls: Array<{ action: string; params: Record<string, unknown> }> = [];
    const fetch = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const request = JSON.parse(init?.body as string);
      calls.push(request);
      expect(request.version).toBe(6);
      return json({ result: results[request.action] ?? null, error: null });
    });
    return { client: new AnkiConnectClient({ fetch }), calls };
  }

  it("sums top-level decks without counting subdecks twice", async () => {
    const { client, calls } = fakeAnki({
      deckNames: ["Japonés", "Japonés::N5", "Inglés"],
      getDeckStats: {
        1: { name: "Japonés", new_count: 5, learn_count: 1, review_count: 10, total_in_deck: 100 },
        2: { name: "Inglés", new_count: 0, learn_count: 0, review_count: 2, total_in_deck: 50 },
      },
      getNumCardsReviewedByDay: [
        ["2026-11-02", 30],
        ["2026-01-01", 9],
      ],
    });
    const stats = await client.readStats("Mainichi Hub", today, at);
    expect(calls.find((c) => c.action === "getDeckStats")?.params.decks).toEqual([
      "Japonés",
      "Inglés",
    ]);
    expect(stats).toMatchObject({ dueNew: 5, dueLearn: 1, dueReview: 12, total: 150 });
    expect(stats.deck).toBe("todos los mazos");
    expect(stats.byDay).toEqual({ "2026-11-02": 30 });
  });

  it("names the deck when there is only one", async () => {
    const { client } = fakeAnki({
      deckNames: ["Japonés"],
      getDeckStats: {},
      getNumCardsReviewedByDay: [],
    });
    expect((await client.readStats("x", today, at)).deck).toBe("Japonés");
  });

  it("creates its note type once and skips duplicates", async () => {
    const { client, calls } = fakeAnki({
      modelNames: ["Básico"],
      canAddNotes: [true, false],
      addNotes: [101],
    });
    const ids = await client.pushCards([card("a"), card("b")], "Mainichi Hub");
    expect(ids).toEqual(["a", "b"]);
    expect(calls.map((c) => c.action)).toContain("createModel");
    const add = calls.find((c) => c.action === "addNotes");
    expect((add?.params.notes as unknown[]).length).toBe(1);
  });

  it("does not report a note that Anki rejected", async () => {
    const { client } = fakeAnki({
      modelNames: ["Mainichi Hub"],
      canAddNotes: [true, true],
      addNotes: [101, null],
    });
    expect(await client.pushCards([card("ok"), card("rejected")], "d")).toEqual(["ok"]);
  });

  it("does not recreate an existing note type or call Anki for an empty list", async () => {
    const { client, calls } = fakeAnki({ modelNames: ["Mainichi Hub"], canAddNotes: [false] });
    expect(await client.pushCards([], "d")).toEqual([]);
    expect(calls).toHaveLength(0);
    await client.pushCards([card("a")], "d");
    expect(calls.map((c) => c.action)).toEqual(["createDeck", "modelNames", "canAddNotes"]);
  });

  it("reports a closed Anki distinctly from an API error", async () => {
    const closed = new AnkiConnectClient({
      fetch: async () => {
        throw new TypeError("Failed to fetch");
      },
    });
    await expect(closed.readStats("d", today, at)).rejects.toBeInstanceOf(AnkiUnavailableError);
    const failing = new AnkiConnectClient({
      fetch: async () => json({ result: null, error: "deck was not found" }),
    });
    await expect(failing.readStats("d", today, at)).rejects.toThrow("deck was not found");
  });
});

describe("NtfyNotifier", () => {
  const alert = {
    title: "毎日日本語",
    body: "• 3 kana",
    tags: ["sunrise"],
    priority: "high" as const,
  };

  it("publishes UTF-8 as JSON to the server root", async () => {
    const fetch = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => json({}));
    await new NtfyNotifier({ topic: "secret", fetch }).send(alert, "https://hub");
    expect(fetch.mock.calls[0]?.[0]).toBe("https://ntfy.sh");
    expect(JSON.parse(fetch.mock.calls[0]?.[1]?.body as string)).toEqual({
      topic: "secret",
      title: "毎日日本語",
      message: "• 3 kana",
      tags: ["sunrise"],
      priority: 4,
      click: "https://hub",
    });
  });

  it("fails loudly so the scheduled run is marked as failed", async () => {
    const notifier = new NtfyNotifier({ topic: "t", fetch: async () => json({}, 429) });
    await expect(notifier.send(alert)).rejects.toBeInstanceOf(HttpError);
  });
});
