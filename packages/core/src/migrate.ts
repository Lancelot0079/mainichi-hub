import { z } from "zod";
import { emptyState, hubStateSchema, type HubState } from "./schema";

const legacyKanaSchema = z.record(
  z.string(),
  z.object({
    b: z.number().default(0),
    d: z.string(),
    n: z.number().default(0),
    ok: z.number().default(0),
  }),
);

/** Shape of the backup produced by the original single-file page ("Copiar respaldo"). */
const legacySchema = z.object({
  prog: z.object({
    log: z
      .record(
        z.string(),
        z.object({
          b: z
            .record(
              z.string(),
              z.object({ done: z.boolean().default(false), m: z.number().default(0) }),
            )
            .default({}),
          l: z.string().default(""),
          cr: z.number().default(0),
        }),
      )
      .default({}),
    kana: z
      .object({ h: legacyKanaSchema.default({}), k: legacyKanaSchema.default({}) })
      .default(() => ({ h: {}, k: {} })),
    unlocked: z
      .object({ h: z.number().default(1), k: z.number().default(1) })
      .default(() => ({ h: 1, k: 1 })),
    weekly: z.record(z.string(), z.record(z.string(), z.boolean())).default({}),
    script: z.enum(["h", "k"]).default("h"),
  }),
  cards: z
    .object({
      list: z
        .array(
          z.object({
            id: z.string(),
            jp: z.string(),
            r: z.string().default(""),
            es: z.string(),
            ej: z.string().default(""),
            ejes: z.string().default(""),
            t: z.string().default(""),
            c: z.string().optional(),
            b: z.number().default(0),
            d: z.string().optional(),
            x: z.boolean().default(false),
          }),
        )
        .default([]),
    })
    .default({ list: [] }),
  diary: z
    .object({
      list: z
        .array(
          z.object({
            id: z.string(),
            date: z.string(),
            prompt: z.string().default(""),
            text: z.string(),
            fb: z.unknown().nullable().default(null),
          }),
        )
        .default([]),
    })
    .default({ list: [] }),
});

function fromLegacy(raw: z.infer<typeof legacySchema>, at: string): HubState {
  const state = emptyState();
  const day = at.slice(0, 10);
  state.updatedAt = at;
  for (const [date, log] of Object.entries(raw.prog.log)) {
    state.progress.log[date] = {
      blocks: Object.fromEntries(
        Object.entries(log.b).map(([id, b]) => [id, { done: b.done, minutes: b.m, updatedAt: at }]),
      ),
      lesson: log.l,
      reviews: log.cr,
      sessions: [],
    };
  }
  for (const script of ["h", "k"] as const) {
    state.progress.kana[script] = Object.fromEntries(
      Object.entries(raw.prog.kana[script]).map(([char, r]) => [
        char,
        { box: r.b, due: r.d, attempts: r.n, correct: r.ok },
      ]),
    );
  }
  state.progress.unlocked = raw.prog.unlocked;
  state.progress.weekly = raw.prog.weekly;
  state.progress.script = raw.prog.script;
  state.cards = raw.cards.list.map((c) => ({
    id: c.id,
    jp: c.jp,
    reading: c.r,
    meaning: c.es,
    example: c.ej,
    exampleMeaning: c.ejes,
    tag: c.t,
    createdOn: c.c ?? day,
    box: c.b,
    due: c.d ?? day,
    exported: c.x,
    updatedAt: at,
  }));
  state.diary = raw.diary.list.map((e) => ({
    id: e.id,
    date: e.date,
    prompt: e.prompt,
    text: e.text,
    feedback: (e.fb as HubState["diary"][number]["feedback"]) ?? null,
    updatedAt: at,
  }));
  return hubStateSchema.parse(state);
}

/**
 * Accepts any supported export (current or original page) and returns valid current state.
 * Throws on anything else, so a bad paste can never overwrite real progress.
 */
export function importState(raw: unknown, at: string): HubState {
  if (raw && typeof raw === "object" && "prog" in raw) {
    return fromLegacy(legacySchema.parse(raw), at);
  }
  return hubStateSchema.parse(raw);
}
