import { z } from "zod";

/**
 * Persisted shapes. Everything read from storage, a backup or an LLM response goes through these
 * schemas, so the rest of the code can trust its types. Defaults keep older files loadable.
 */

export const STATE_VERSION = 2;

export const blockIdSchema = z.enum(["srs", "les", "out", "lis"]);
export type BlockId = z.infer<typeof blockIdSchema>;

const blockLogSchema = z.object({
  done: z.boolean().default(false),
  minutes: z.number().nonnegative().default(0),
  updatedAt: z.string().default(""),
});
export type BlockLog = z.infer<typeof blockLogSchema>;

const sessionSchema = z.object({
  id: z.string(),
  resourceId: z.string(),
  minutes: z.number().nonnegative(),
  note: z.string().default(""),
  at: z.string(),
  deletedAt: z.string().optional(),
});
export type ResourceSession = z.infer<typeof sessionSchema>;

const dayLogSchema = z.object({
  blocks: z.partialRecord(blockIdSchema, blockLogSchema).default({}),
  lesson: z.string().default(""),
  lessonUpdatedAt: z.string().optional(),
  reviews: z.number().nonnegative().default(0),
  sessions: z.array(sessionSchema).default([]),
});
export type DayLog = z.infer<typeof dayLogSchema>;

const kanaRecordSchema = z.object({
  box: z.number().int().nonnegative().default(0),
  due: z.string(),
  attempts: z.number().int().nonnegative().default(0),
  correct: z.number().int().nonnegative().default(0),
});
export type KanaRecord = z.infer<typeof kanaRecordSchema>;

const progressSchema = z.object({
  log: z.record(z.string(), dayLogSchema).default({}),
  kana: z
    .object({
      h: z.record(z.string(), kanaRecordSchema).default({}),
      k: z.record(z.string(), kanaRecordSchema).default({}),
    })
    .default(() => ({ h: {}, k: {} })),
  unlocked: z
    .object({ h: z.number().int().min(1).default(1), k: z.number().int().min(1).default(1) })
    .default(() => ({ h: 1, k: 1 })),
  weekly: z.record(z.string(), z.record(z.string(), z.boolean())).default({}),
  script: z.enum(["h", "k"]).default("h"),
});

export const cardSchema = z.object({
  id: z.string(),
  jp: z.string(),
  reading: z.string().default(""),
  meaning: z.string(),
  example: z.string().default(""),
  exampleMeaning: z.string().default(""),
  tag: z.string().default(""),
  createdOn: z.string(),
  box: z.number().int().nonnegative().default(0),
  due: z.string(),
  exported: z.boolean().default(false),
  updatedAt: z.string().default(""),
  deletedAt: z.string().optional(),
});
export type Card = z.infer<typeof cardSchema>;

export const correctionSchema = z.object({
  oraciones: z
    .array(
      z.object({
        original: z.coerce.string().default(""),
        corregida: z.coerce.string().default(""),
        natural: z.coerce.string().default(""),
        explicacion: z.coerce.string().default(""),
        ok: z.boolean().default(false),
      }),
    )
    .max(12)
    .default([]),
  comentario: z.coerce.string().default(""),
});
export type Correction = z.infer<typeof correctionSchema>;

export const diaryEntrySchema = z.object({
  id: z.string(),
  date: z.string(),
  prompt: z.string().default(""),
  text: z.string(),
  feedback: correctionSchema.nullable().default(null),
  updatedAt: z.string().default(""),
  deletedAt: z.string().optional(),
});
export type DiaryEntry = z.infer<typeof diaryEntrySchema>;

export const resourceTrackSchema = z.object({
  url: z.string().default(""),
  done: z.number().nonnegative().default(0),
  total: z.number().nonnegative().default(0),
  updatedAt: z.string().default(""),
});
export type ResourceTrack = z.infer<typeof resourceTrackSchema>;

export const milestoneSchema = z.object({
  id: z.string(),
  date: z.string(),
  label: z.string(),
  short: z.string().default(""),
  estimated: z.boolean().default(true),
});
export type Milestone = z.infer<typeof milestoneSchema>;

export const ankiStatsSchema = z.object({
  syncedAt: z.string(),
  deck: z.string(),
  dueNew: z.number().default(0),
  dueLearn: z.number().default(0),
  dueReview: z.number().default(0),
  total: z.number().default(0),
  byDay: z.record(z.string(), z.number()).default({}),
});
export type AnkiStats = z.infer<typeof ankiStatsSchema>;

const defaultMilestones: Milestone[] = [
  {
    id: "jlpt-registration",
    date: "2027-03-02",
    label: "Abre la inscripción al JLPT de julio.",
    short: "Inscripción JLPT",
    estimated: true,
  },
  {
    id: "jlpt-n5",
    date: "2027-07-04",
    label: "JLPT N5 (primer domingo de julio).",
    short: "JLPT N5",
    estimated: true,
  },
];

export const settingsSchema = z.object({
  updatedAt: z.string().default(""),
  milestones: z.array(milestoneSchema).default(() => defaultMilestones.map((m) => ({ ...m }))),
  ankiDeck: z.string().default("Mainichi Hub"),
});
export type Settings = z.infer<typeof settingsSchema>;

export const hubStateSchema = z.object({
  version: z.literal(STATE_VERSION).default(STATE_VERSION),
  updatedAt: z.string().default(""),
  progress: progressSchema.prefault({}),
  cards: z.array(cardSchema).default([]),
  diary: z.array(diaryEntrySchema).default([]),
  resources: z.record(z.string(), resourceTrackSchema).default({}),
  settings: settingsSchema.prefault({}),
  anki: ankiStatsSchema.nullable().default(null),
});
export type HubState = z.infer<typeof hubStateSchema>;

export const emptyState = (): HubState => hubStateSchema.parse({});

export const wanikaniSnapshotSchema = z.object({
  username: z.string(),
  level: z.number(),
  maxLevelGranted: z.number(),
  reviewsAvailable: z.number(),
  lessonsAvailable: z.number(),
  nextReviewsAt: z.string().nullable(),
  activeToday: z.boolean(),
  srs: z.object({
    apprentice: z.number(),
    guru: z.number(),
    master: z.number(),
    enlightened: z.number(),
    burned: z.number(),
  }),
});
export type WanikaniSnapshot = z.infer<typeof wanikaniSnapshotSchema>;

export const alertSlotSchema = z.enum(["morning", "evening"]);
export type AlertSlot = z.infer<typeof alertSlotSchema>;

/** Written only by the scheduled job; the browser only reads it. */
export const snapshotSchema = z.object({
  version: z.literal(1).default(1),
  generatedAt: z.string().default(""),
  wanikani: wanikaniSnapshotSchema.nullable().default(null),
  activeDays: z.array(z.string()).default([]),
  errors: z.array(z.object({ source: z.string(), message: z.string() })).default([]),
  alertsSent: z.partialRecord(alertSlotSchema, z.string()).default({}),
});
export type Snapshot = z.infer<typeof snapshotSchema>;

export const emptySnapshot = (): Snapshot => snapshotSchema.parse({});

/** Draft cards returned by an assistant, validated before they reach the deck. */
export const draftCardsSchema = z
  .array(
    z.object({
      jp: z.string().min(1),
      r: z.coerce.string().default(""),
      es: z.string().min(1),
      ej: z.coerce.string().default(""),
      ejes: z.coerce.string().default(""),
      t: z.coerce.string().default(""),
    }),
  )
  .max(25);
export type DraftCard = z.infer<typeof draftCardsSchema>[number];

export const quizSchema = z
  .array(
    z.object({
      q: z.string(),
      opts: z.array(z.coerce.string()).min(2),
      a: z.coerce.number().int().nonnegative(),
      exp: z.coerce.string().default(""),
    }),
  )
  .max(5);
export type QuizQuestion = z.infer<typeof quizSchema>[number];
