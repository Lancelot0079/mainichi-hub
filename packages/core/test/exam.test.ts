import { describe, expect, it } from "vitest";
import {
  emptyState,
  estimatedLevel,
  generatedExamSchema,
  gradeExam,
  JLPT_LEVELS,
  LISTENING_CATALOG,
  listeningLink,
  mergeStates,
  MEXT_PRACTICE_SET,
  MEXT_SECTIONS,
  mextExamPrompt,
  type HubState,
} from "../src";

describe("MEXT practice set", () => {
  it("matches the official item count and weights per section, for 100 points", () => {
    for (const section of MEXT_SECTIONS) {
      expect(
        MEXT_PRACTICE_SET.filter((q) => q.section === section.id),
        section.id,
      ).toHaveLength(section.count);
    }
    expect(MEXT_SECTIONS.reduce((sum, s) => sum + s.points * s.count, 0)).toBe(100);
  });

  it("has unique ids, four distinct options and a valid answer everywhere", () => {
    expect(new Set(MEXT_PRACTICE_SET.map((q) => q.id)).size).toBe(MEXT_PRACTICE_SET.length);
    for (const q of MEXT_PRACTICE_SET) {
      expect(new Set(q.options).size, q.id).toBe(4);
      expect(q.answer, q.id).toBeGreaterThanOrEqual(0);
      expect(q.answer, q.id).toBeLessThan(4);
      expect(q.explanation, q.id).not.toBe("");
    }
  });

  it("marks blanks in section I and underlines in sections II and III", () => {
    for (const q of MEXT_PRACTICE_SET) {
      if (q.section === "I") expect(q.prompt, q.id).toContain("＿＿");
      if (q.section === "II" || q.section === "III") expect(q.prompt, q.id).toMatch(/［.+］/);
      if (q.section === "IV") expect(q.passage, q.id).toBeTruthy();
    }
  });

  it("never lowers the level inside a section, like the official papers", () => {
    for (const section of MEXT_SECTIONS) {
      const ranks = MEXT_PRACTICE_SET.filter((q) => q.section === section.id).map((q) =>
        JLPT_LEVELS.indexOf(q.level),
      );
      expect(ranks, section.id).toEqual([...ranks].sort((a, b) => a - b));
    }
  });
});

describe("gradeExam", () => {
  it("applies the official weights and reports mistakes", () => {
    const answers = Object.fromEntries(MEXT_PRACTICE_SET.map((q) => [q.id, q.answer]));
    const perfect = gradeExam(MEXT_PRACTICE_SET, answers);
    expect(perfect).toMatchObject({ score: 100, max: 100, mistakes: [] });
    expect(perfect.sections.IV).toEqual({ score: 12, max: 12 });

    const reading = MEXT_PRACTICE_SET.filter((q) => q.section === "IV");
    const partial = gradeExam(reading, { [reading[0]!.id]: reading[0]!.answer });
    expect(partial.score).toBe(3);
    expect(partial.mistakes).toHaveLength(3);
    expect(partial.mistakes[0]?.chosen).toBeNull();
  });

  it("estimates the highest level with at least 70% right, stopping at the first gap", () => {
    expect(
      estimatedLevel({
        N5: { right: 4, total: 4 },
        N4: { right: 3, total: 4 },
        N3: { right: 1, total: 4 },
        N2: { right: 4, total: 4 },
      }),
    ).toBe("N4");
    expect(estimatedLevel({ N5: { right: 1, total: 4 } })).toBeNull();
  });
});

describe("generated questions", () => {
  it("accepts a well-formed reply and rejects wrong option counts", () => {
    const ok = {
      preguntas: [
        {
          nivel: "N5",
          enunciado: "ねこ＿＿います。",
          opciones: ["が", "を", "で", "へ"],
          correcta: 0,
        },
      ],
    };
    expect(generatedExamSchema.parse(ok).preguntas[0]?.explicacion).toBe("");
    const bad = { preguntas: [{ ...ok.preguntas[0], opciones: ["a", "b"] }] };
    expect(() => generatedExamSchema.parse(bad)).toThrow();
  });

  it("asks for the requested section and vocabulary", () => {
    const prompt = mextExamPrompt("III", 5, ["水", "山"]);
    expect(prompt).toContain("sección III");
    expect(prompt).toContain("5 preguntas");
    expect(prompt).toContain("水、山");
  });
});

describe("listening", () => {
  it("links verified pages directly and searches the rest", () => {
    const teppei = LISTENING_CATALOG.find((c) => c.id === "teppei")!;
    expect(listeningLink(teppei)).toBe("https://nihongoconteppei.com");
    const totoro = LISTENING_CATALOG.find((c) => c.id === "totoro")!;
    expect(listeningLink(totoro)).toMatch(/^https:\/\/www\.google\.com\/search\?q=/);
    const song = LISTENING_CATALOG.find((c) => c.kind === "cancion")!;
    expect(listeningLink(song)).toMatch(/^https:\/\/www\.youtube\.com\/results/);
  });

  it("merges library items and exam attempts from two devices", () => {
    const item = {
      id: "l1",
      title: "Teppei",
      kind: "podcast" as const,
      level: "basico" as const,
      url: "",
      done: 3,
      total: 0,
    };
    const a: HubState = {
      ...emptyState(),
      updatedAt: "1",
      listening: [{ ...item, updatedAt: "1" }],
    };
    const b: HubState = {
      ...emptyState(),
      updatedAt: "2",
      listening: [{ ...item, done: 4, updatedAt: "2" }],
      exams: [
        {
          id: "e1",
          kind: "seccion",
          label: "IV",
          at: "2",
          durationSec: 60,
          score: 9,
          max: 12,
          sections: {},
          levels: {},
          mistakes: [],
          updatedAt: "2",
        },
      ],
    };
    const merged = mergeStates(a, b);
    expect(merged.listening[0]?.done).toBe(4);
    expect(merged.exams).toHaveLength(1);
  });
});
