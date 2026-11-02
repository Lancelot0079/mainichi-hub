import { addDays, cardBack, cardFront } from "@mainichi/core";
import type { AnkiStats, Card } from "@mainichi/core";
import type { Fetch } from "./http";

const API_VERSION = 6;
const NOTE_MODEL = "Mainichi Hub";
const HISTORY_DAYS = 120;

export class AnkiUnavailableError extends Error {
  constructor() {
    super("Anki no respondió");
    this.name = "AnkiUnavailableError";
  }
}

export interface AnkiConnectOptions {
  url?: string;
  fetch?: Fetch;
}

type DeckStats = Record<
  string,
  {
    name: string;
    new_count: number;
    learn_count: number;
    review_count: number;
    total_in_deck: number;
  }
>;

/** Client for the AnkiConnect add-on, which serves a local API while Anki is open. */
export class AnkiConnectClient {
  private readonly url: string;
  private readonly fetch: Fetch;

  constructor(options: AnkiConnectOptions = {}) {
    this.url = options.url ?? "http://127.0.0.1:8765";
    this.fetch = options.fetch ?? globalThis.fetch.bind(globalThis);
  }

  private async invoke<T>(action: string, params: Record<string, unknown> = {}): Promise<T> {
    let res: Response;
    try {
      res = await this.fetch(this.url, {
        method: "POST",
        body: JSON.stringify({ action, version: API_VERSION, params }),
      });
    } catch {
      // A closed Anki and a blocked CORS origin look identical from the browser.
      throw new AnkiUnavailableError();
    }
    const body = (await res.json()) as { result: T; error: string | null };
    if (body.error) throw new Error(`AnkiConnect (${action}): ${body.error}`);
    return body.result;
  }

  /** Top-level decks already include their subdecks, so summing them counts each card once. */
  async readStats(pushDeck: string, today: string, at: string): Promise<AnkiStats> {
    const decks = await this.invoke<string[]>("deckNames");
    const topLevel = decks.filter((d) => !d.includes("::"));
    const [stats, reviewed] = await Promise.all([
      this.invoke<DeckStats>("getDeckStats", { decks: topLevel }),
      this.invoke<Array<[string, number]>>("getNumCardsReviewedByDay"),
    ]);
    const counts = Object.values(stats);
    const sum = (pick: (d: DeckStats[string]) => number) =>
      counts.reduce((total, deck) => total + pick(deck), 0);
    const oldest = addDays(today, -HISTORY_DAYS);
    return {
      syncedAt: at,
      deck: topLevel.length === 1 ? (topLevel[0] ?? pushDeck) : "todos los mazos",
      dueNew: sum((d) => d.new_count),
      dueLearn: sum((d) => d.learn_count),
      dueReview: sum((d) => d.review_count),
      total: sum((d) => d.total_in_deck),
      byDay: Object.fromEntries(reviewed.filter(([day]) => day >= oldest)),
    };
  }

  /** Uses its own note type: built-in names change with Anki's interface language. */
  private async ensureModel(): Promise<void> {
    const models = await this.invoke<string[]>("modelNames");
    if (models.includes(NOTE_MODEL)) return;
    await this.invoke("createModel", {
      modelName: NOTE_MODEL,
      inOrderFields: ["Front", "Back"],
      css: ".card { font-size: 22px; text-align: center; } small { font-size: 16px; }",
      cardTemplates: [
        {
          Name: "Mainichi",
          Front: "{{Front}}",
          Back: '{{FrontSide}}<hr id="answer">{{Back}}',
        },
      ],
    });
  }

  /** Adds the cards and returns the ids that now exist in Anki, duplicates included. */
  async pushCards(cards: Card[], deck: string): Promise<string[]> {
    if (!cards.length) return [];
    await this.invoke("createDeck", { deck });
    await this.ensureModel();
    const notes = cards.map((card) => ({
      cardId: card.id,
      deckName: deck,
      modelName: NOTE_MODEL,
      fields: { Front: cardFront(card), Back: cardBack(card) },
      tags: [card.tag || "mainichi"].map((t) => t.replace(/\s+/g, "-")),
      options: { allowDuplicate: false, duplicateScope: "deck" },
    }));
    const payload = notes.map(({ cardId: _cardId, ...note }) => note);
    const addable = await this.invoke<boolean[]>("canAddNotes", { notes: payload });
    const fresh = notes.filter((_, i) => addable[i]);
    if (!fresh.length) return cards.map((c) => c.id);
    const results = await this.invoke<Array<number | null>>("addNotes", {
      notes: payload.filter((_, i) => addable[i]),
    });
    const failed = new Set(fresh.filter((_, i) => results[i] === null).map((n) => n.cardId));
    return cards.map((c) => c.id).filter((id) => !failed.has(id));
  }
}
