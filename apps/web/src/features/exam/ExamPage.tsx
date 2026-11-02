import {
  estimatedLevel,
  generatedExamSchema,
  gradeExam,
  liveCards,
  MEXT_DURATION_MINUTES,
  MEXT_PRACTICE_SET,
  MEXT_SECTIONS,
  mextExamPrompt,
  OFFICIAL_EXAMS_URL,
  OFFICIAL_PAPERS,
  type ExamAttempt,
  type ExamQuestion,
  type ExamSection,
} from "@mainichi/core";
import { useState } from "react";
import { removeExamAttempt, saveExamAttempt } from "../../state/actions";
import { useHub } from "../../state/store";
import { AssistantBridge } from "../../ui/AssistantBridge";
import { toast } from "../../ui/toast";
import { ExamRunner, type RunConfig } from "./ExamRunner";
import { ExamResult } from "./ExamResult";

type View =
  { kind: "menu" } | { kind: "run"; config: RunConfig } | { kind: "result"; attempt: ExamAttempt };

const DECK_WORDS_IN_PROMPT = 30;

function Format() {
  return (
    <div className="panel stack">
      <p>
        Formato de la prueba de japonés para Research Students (2025): <b>100 minutos</b>,{" "}
        <b>100 puntos</b> y cuatro opciones por pregunta. Las preguntas van de N5 a N1 dentro de
        cada sección. En 2025, las versiones de humanidades (A) y ciencias (B) tuvieron las mismas
        preguntas.
      </p>
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Sección</th>
            <th scope="col">Tipo</th>
            <th scope="col">Preguntas</th>
            <th scope="col">Puntos</th>
          </tr>
        </thead>
        <tbody>
          {MEXT_SECTIONS.map((s) => (
            <tr key={s.id}>
              <td>{s.id}</td>
              <td>
                {s.title} <span lang="ja">({s.jp})</span>
              </td>
              <td className="num">{s.count}</td>
              <td className="num">
                {s.points} × {s.count} = {s.points * s.count}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="hint">
        Las preguntas de esta página son originales y siguen ese formato; las oficiales tienen
        derechos de JASSO y se practican en sus PDF.{" "}
        <a href={OFFICIAL_EXAMS_URL} target="_blank" rel="noopener noreferrer">
          Ver exámenes oficiales
        </a>
      </p>
    </div>
  );
}

function Generate({ onReady }: { onReady: (config: RunConfig) => void }) {
  const { state } = useHub();
  const [section, setSection] = useState<ExamSection>("I");
  const [count, setCount] = useState(10);
  return (
    <div className="panel stack">
      <p className="hint">
        Claude crea preguntas nuevas con el formato oficial, usando tu vocabulario cuando encaja.
      </p>
      <div className="grid g2">
        <label className="field">
          <span>Sección</span>
          <select value={section} onChange={(e) => setSection(e.target.value as ExamSection)}>
            {MEXT_SECTIONS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id} · {s.title}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Cantidad</span>
          <input
            type="number"
            min="2"
            max="20"
            value={count}
            onChange={(e) => setCount(Math.min(20, Math.max(2, Number(e.target.value) || 10)))}
          />
        </label>
      </div>
      <AssistantBridge
        copyLabel="Copiar prompt de preguntas"
        emptyMessage=""
        schema={generatedExamSchema}
        buildPrompt={() =>
          mextExamPrompt(
            section,
            count,
            liveCards(state.cards)
              .slice(-DECK_WORDS_IN_PROMPT)
              .map((c) => c.jp),
          )
        }
        onResult={({ preguntas }) => {
          const stamp = Date.now().toString(36);
          const questions: ExamQuestion[] = preguntas.map((p, i) => ({
            id: `gen-${stamp}-${i}`,
            section,
            level: p.nivel,
            passage: p.pasaje || undefined,
            prompt: p.enunciado,
            options: p.opciones,
            answer: p.correcta,
            explanation: p.explicacion,
          }));
          onReady({
            questions,
            kind: "generado",
            label: `Preguntas nuevas · sección ${section}`,
            timed: false,
          });
        }}
      />
    </div>
  );
}

function OfficialScore() {
  const [paper, setPaper] = useState<string>(OFFICIAL_PAPERS[0].label);
  const [scores, setScores] = useState<Record<string, string>>({});

  function save() {
    const sections = Object.fromEntries(
      MEXT_SECTIONS.map((s) => {
        const max = s.points * s.count;
        return [s.id, { score: Math.min(max, Math.max(0, Number(scores[s.id]) || 0)), max }];
      }),
    );
    const score = Object.values(sections).reduce((sum, s) => sum + s.score, 0);
    saveExamAttempt({
      kind: "oficial",
      label: `Oficial ${paper}`,
      at: new Date().toISOString(),
      durationSec: 0,
      score,
      max: 100,
      sections,
      levels: {},
      mistakes: [],
    });
    setScores({});
    toast(`Puntaje oficial guardado: ${score} de 100.`);
  }

  return (
    <div className="panel stack">
      <p className="hint">
        Imprime o abre un examen oficial, resuélvelo en 100 minutos, califícalo con su clave y anota
        aquí tus puntos por sección.
      </p>
      <ul className="links">
        {OFFICIAL_PAPERS.map((p) => (
          <li key={p.label}>
            {p.label}:{" "}
            <a href={p.question} target="_blank" rel="noopener noreferrer">
              preguntas
            </a>{" "}
            ·{" "}
            <a href={p.answers} target="_blank" rel="noopener noreferrer">
              respuestas
            </a>
          </li>
        ))}
      </ul>
      <label className="field">
        <span>Examen</span>
        <select value={paper} onChange={(e) => setPaper(e.target.value)}>
          {OFFICIAL_PAPERS.map((p) => (
            <option key={p.label}>{p.label}</option>
          ))}
          <option>Otro año (2023 o 2024)</option>
        </select>
      </label>
      <div className="grid g4">
        {MEXT_SECTIONS.map((s) => (
          <label key={s.id} className="field">
            <span>
              Sección {s.id} (máx. {s.points * s.count})
            </span>
            <input
              type="number"
              min="0"
              max={s.points * s.count}
              value={scores[s.id] ?? ""}
              onChange={(e) => setScores({ ...scores, [s.id]: e.target.value })}
            />
          </label>
        ))}
      </div>
      <div>
        <button
          type="button"
          className="btn ghost"
          disabled={Object.keys(scores).length === 0}
          onClick={save}
        >
          Guardar puntaje
        </button>
      </div>
    </div>
  );
}

function History({ onOpen }: { onOpen: (attempt: ExamAttempt) => void }) {
  const { state } = useHub();
  const attempts = state.exams.filter((a) => !a.deletedAt).sort((a, b) => b.at.localeCompare(a.at));
  if (!attempts.length) return <p className="muted">Todavía no has presentado ningún examen.</p>;
  return (
    <div className="panel">
      {attempts.map((attempt) => {
        const level = estimatedLevel(attempt.levels);
        return (
          <div key={attempt.id} className="session">
            <span>
              <b className="num">
                {attempt.score}/{attempt.max}
              </b>{" "}
              · {attempt.label}
              <br />
              <span className="muted small">
                {attempt.at.slice(0, 10)}
                {level && ` · nivel estimado ${level}`}
              </span>
            </span>
            <span className="row">
              {attempt.kind !== "oficial" && (
                <button type="button" className="btn ghost small" onClick={() => onOpen(attempt)}>
                  Revisar
                </button>
              )}
              <button
                type="button"
                className="btn ghost small"
                aria-label={`Borrar intento ${attempt.label}`}
                onClick={() => removeExamAttempt(attempt.id)}
              >
                Borrar
              </button>
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function ExamPage() {
  const [view, setView] = useState<View>({ kind: "menu" });

  if (view.kind === "run") {
    return (
      <ExamRunner
        config={view.config}
        onCancel={() => setView({ kind: "menu" })}
        onFinish={(answers, durationSec) => {
          const { config } = view;
          const attempt: Omit<ExamAttempt, "id" | "updatedAt"> = {
            kind: config.kind,
            label: config.label,
            at: new Date().toISOString(),
            durationSec,
            ...gradeExam(config.questions, answers),
          };
          saveExamAttempt(attempt);
          setView({ kind: "result", attempt: { ...attempt, id: "", updatedAt: "" } });
          scrollTo({ top: 0 });
        }}
      />
    );
  }

  if (view.kind === "result") {
    return <ExamResult attempt={view.attempt} onBack={() => setView({ kind: "menu" })} />;
  }

  const start = (config: RunConfig) => {
    setView({ kind: "run", config });
    scrollTo({ top: 0 });
  };

  return (
    <>
      <h2>Formato oficial MEXT</h2>
      <Format />

      <h2>Practicar</h2>
      <div className="grid g2">
        <div className="panel stack">
          <h3>Simulacro completo</h3>
          <p className="muted small">
            Las 48 preguntas, con cronómetro de {MEXT_DURATION_MINUTES} minutos, como el día del
            examen.
          </p>
          <div>
            <button
              type="button"
              className="btn"
              onClick={() =>
                start({
                  questions: [...MEXT_PRACTICE_SET],
                  kind: "simulacro",
                  label: "Simulacro completo",
                  timed: true,
                })
              }
            >
              Empezar simulacro
            </button>
          </div>
        </div>
        <div className="panel stack">
          <h3>Una sección, sin cronómetro</h3>
          <p className="muted small">Para practicar con calma y leer cada explicación.</p>
          <div className="row">
            {MEXT_SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                className="btn ghost small"
                onClick={() =>
                  start({
                    questions: MEXT_PRACTICE_SET.filter((q) => q.section === s.id),
                    kind: "seccion",
                    label: `Sección ${s.id} · ${s.title}`,
                    timed: false,
                  })
                }
              >
                {s.id} · {s.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      <h2>Preguntas nuevas con Claude</h2>
      <Generate onReady={start} />

      <h2>Exámenes oficiales</h2>
      <OfficialScore />

      <h2>Tu historial</h2>
      <History onOpen={(attempt) => setView({ kind: "result", attempt })} />
    </>
  );
}
