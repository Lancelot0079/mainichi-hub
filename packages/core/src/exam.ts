import type { ExamAttempt, ExamQuestion, ExamSection, JlptLevel } from "./schema";

/**
 * Layout of the Japanese test that MEXT gives research applicants (2025 papers, science and
 * humanities share the same Japanese questions): 100 minutes, 100 points, four options per item,
 * difficulty rising inside every section.
 */
export interface SectionInfo {
  id: ExamSection;
  /** Color family borrowed from the routine palette. */
  tone: "srs" | "les" | "out" | "lis";
  title: string;
  jp: string;
  instruction: string;
  points: number;
  count: number;
}

export const MEXT_SECTIONS: readonly SectionInfo[] = [
  {
    id: "I",
    tone: "srs",
    title: "Completar la oración",
    jp: "空欄補充",
    instruction: "＿＿に入る一番適当なものをA〜Dの中から一つ選びなさい。",
    points: 2,
    count: 17,
  },
  {
    id: "II",
    tone: "les",
    title: "Significado más cercano",
    jp: "言い換え",
    instruction: "［　］の部分と一番関係があるものをA〜Dの中から一つ選びなさい。",
    points: 2,
    count: 17,
  },
  {
    id: "III",
    tone: "out",
    title: "El mismo kanji",
    jp: "漢字",
    instruction: "［　］のひらがなと同じ漢字で書くものをA〜Dの中から一つ選びなさい。",
    points: 2,
    count: 10,
  },
  {
    id: "IV",
    tone: "lis",
    title: "Comprensión de lectura",
    jp: "読解",
    instruction: "次の文章を読んで、あとの問いに答えなさい。",
    points: 3,
    count: 4,
  },
];

export const MEXT_DURATION_MINUTES = 100;
export const JLPT_LEVELS: readonly JlptLevel[] = ["N5", "N4", "N3", "N2", "N1"];
export const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

export const OFFICIAL_EXAMS_URL =
  "https://www.studyinjapan.go.jp/en/planning/scholarships/mext-scholarships/examination.html";

/** Official 2025 papers for research students, as linked from the page above. */
export const OFFICIAL_PAPERS = [
  {
    label: "2025 · Japonés (B), ciencias",
    question: "https://www.studyinjapan.go.jp/ja/_mt/2026/10/exam/2025_ke_ja(b).pdf",
    answers: "https://www.studyinjapan.go.jp/ja/_mt/2026/10/exam/2025_ke_ja(b)_en(b)_ans.pdf",
  },
  {
    label: "2025 · Japonés (A), humanidades",
    question: "https://www.studyinjapan.go.jp/ja/_mt/2026/10/exam/2025_ke_ja(a).pdf",
    answers: "https://www.studyinjapan.go.jp/ja/_mt/2026/10/exam/2025_ke_ja(a)_en(a)_ans.pdf",
  },
] as const;

export const sectionInfo = (id: ExamSection) =>
  MEXT_SECTIONS.find((s) => s.id === id) ?? (MEXT_SECTIONS[0] as SectionInfo);

export type Answers = Record<string, number | undefined>;

export type ExamResult = Pick<ExamAttempt, "score" | "max" | "sections" | "levels" | "mistakes">;

/** Scores with the official weights, and breaks results down by section and by level. */
export function gradeExam(questions: readonly ExamQuestion[], answers: Answers): ExamResult {
  const result: ExamResult = { score: 0, max: 0, sections: {}, levels: {}, mistakes: [] };
  for (const question of questions) {
    const points = sectionInfo(question.section).points;
    const chosen = answers[question.id];
    const right = chosen === question.answer;
    const section = (result.sections[question.section] ??= { score: 0, max: 0 });
    const level = (result.levels[question.level] ??= { right: 0, total: 0 });
    section.max += points;
    level.total += 1;
    result.max += points;
    if (right) {
      section.score += points;
      level.right += 1;
      result.score += points;
    } else {
      result.mistakes.push({ question, chosen: chosen ?? null });
    }
  }
  return result;
}

/** The hardest level where at least 70% of answers were right, scanning up from N5. */
export function estimatedLevel(levels: ExamResult["levels"]): JlptLevel | null {
  let reached: JlptLevel | null = null;
  for (const level of JLPT_LEVELS) {
    const stats = levels[level];
    if (!stats || stats.total === 0) continue;
    if (stats.right / stats.total < 0.7) break;
    reached = level;
  }
  return reached;
}

/** Prompt for fresh questions in the official format, validated by `generatedExamSchema`. */
export function mextExamPrompt(section: ExamSection, count: number, deckWords: string[]): string {
  const info = sectionInfo(section);
  const formats: Record<ExamSection, string> = {
    I: 'Oración con un espacio "＿＿" y 4 opciones (partícula, vocabulario, conjugación o gramática).',
    II: "Oración con una parte entre corchetes ［así］ y 4 opciones; la correcta significa lo mismo.",
    III: "Oración con una palabra en hiragana entre corchetes ［así］. Cada opción es otra palabra en hiragana con una parte entre corchetes; la correcta se escribe con el mismo kanji.",
    IV: 'Un texto corto en "pasaje" (150 a 300 caracteres) y preguntas sobre su contenido.',
  };
  return `Eres un experto en el examen de japonés de la beca MEXT para Research Students.
Crea ${count} preguntas ORIGINALES de la sección ${info.id} (${info.jp}: ${info.instruction}).
Formato: ${formats[section]}
Reglas:
- Exactamente 4 opciones, una sola correcta, distractores plausibles.
- La dificultad sube de N5 a N1 a lo largo de las preguntas, como en el examen real.
- En preguntas N5 y N4, añade furigana a los kanji con el formato {漢字|かんじ}.
- "explicacion" en español, breve, diciendo por qué la correcta es correcta.
- No copies preguntas de exámenes publicados.
${deckWords.length ? `Si encaja, usa este vocabulario que estudio: ${deckWords.join("、")}` : ""}
Responde SOLO con JSON con esta forma:
{"preguntas":[{"nivel":"N5","pasaje":"","enunciado":"わたしは まいにち にほんご＿＿ べんきょうします。","opciones":["が","を","に","で"],"correcta":1,"explicacion":"を marca el objeto directo de べんきょうします."}]}`;
}
