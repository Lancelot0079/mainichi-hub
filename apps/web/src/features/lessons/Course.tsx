import {
  buildLessonSession,
  buildReviewSession,
  drawingQueue,
  drawKey,
  dueLessonItems,
  hiraganaToKatakana,
  KANA,
  lessonMastery,
  lessonStatus,
  nextLesson,
  romajiToHiragana,
  STROKE_COUNTS,
  type CourseUnit,
  type Exercise,
  type Lesson,
  type LessonNote,
  type Script,
} from "@mainichi/core";
import { useState } from "react";
import { startLesson } from "../../state/actions";
import { getHub, useHub } from "../../state/store";
import { JpText } from "../../ui/JpText";
import { Jp } from "../../ui/primitives";
import { useJapaneseVoice } from "../../ui/speech";
import { SpeakButton } from "./Exercises";
import { LessonPlayer } from "./LessonPlayer";
import { basicKana } from "./recognizer";

type View =
  | { kind: "list" }
  | { kind: "lesson"; lesson: Lesson }
  | {
      kind: "session";
      title: string;
      lessonId: string | null;
      exercises: Exercise[];
      again: () => Exercise[];
      run: number;
    }
  | { kind: "draw-setup" };

const STATUS_LABEL = { nueva: "Nueva", "en-curso": "En curso", completada: "Completada" } as const;
const DRAW_ROUND = 10;

function Note({ note, audio }: { note: LessonNote; audio: boolean }) {
  return (
    <section className="panel note">
      <h3 className="card-title">{note.title}</h3>
      {note.body.map((p) => (
        <p key={p}>{p}</p>
      ))}
      {note.table && (
        <div className="table-scroll">
          <table className={`data-table note-table ${note.table.jpCells ? "jp-cells" : ""}`}>
            {note.table.head.some(Boolean) && (
              <thead>
                <tr>
                  {note.table.head.map((h, i) => (
                    <th key={i}>{h}</th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {note.table.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td key={c}>{note.table?.jpCells ? <Jp>{cell}</Jp> : cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {note.examples && (
        <ul className="examples">
          {note.examples.map((ex) => (
            <li key={ex.jp}>
              <JpText text={ex.jp} className="ex-jp" />
              <SpeakButton text={ex.jp} audio={audio} />
              <span className="muted">
                {ex.romaji && <i>{ex.romaji}</i>} {ex.romaji ? "· " : ""}
                {ex.es}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const COUNTRIES = [
  ["コロンビア", "Colombia"],
  ["メキシコ", "México"],
  ["ペルー", "Perú"],
  ["チリ", "Chile"],
  ["アルゼンチン", "Argentina"],
  ["エクアドル", "Ecuador"],
  ["ベネズエラ", "Venezuela"],
  ["スペイン", "España"],
  ["アメリカ", "Estados Unidos"],
] as const;

const JOBS = [
  ["がくせい", "estudiante"],
  ["エンジニア", "ingeniero(a)"],
  ["せんせい", "profesor(a)"],
  ["かいしゃいん", "empleado(a) de empresa"],
  ["いしゃ", "médico(a)"],
] as const;

/** Builds a self-introduction from a few choices, to say aloud. */
function PresentationBuilder({ audio }: { audio: boolean }) {
  const [name, setName] = useState("");
  const [country, setCountry] = useState(0);
  const [job, setJob] = useState(0);
  // A rough reading of the name; the katakana lesson explains how to refine it.
  const katakana = name.trim()
    ? hiraganaToKatakana(romajiToHiragana(name.trim().replace(/\s+/g, "・")))
    : "〜";
  const lines = [
    "はじめまして。",
    `わたしは ${katakana} です。`,
    `${COUNTRIES[country]?.[0]}から きました。`,
    `${JOBS[job]?.[0]}です。`,
    "どうぞ よろしく おねがいします。",
  ];
  return (
    <section className="panel note builder">
      <h3 className="card-title">Arma tu presentación</h3>
      <div className="g2">
        <label className="field">
          <span>Tu nombre como suena (rōmaji)</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ej. kamira"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <label className="field">
          <span>Vienes de</span>
          <select value={country} onChange={(e) => setCountry(Number(e.target.value))}>
            {COUNTRIES.map(([jp, es], i) => (
              <option key={jp} value={i}>
                {es}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Eres</span>
          <select value={job} onChange={(e) => setJob(Number(e.target.value))}>
            {JOBS.map(([jp, es], i) => (
              <option key={jp} value={i}>
                {es}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="muted small">
        Escribe tu nombre como se pronuncia, no como se escribe: Camila → kamira, Jorge → horuhe.
      </p>
      <ol className="presentation">
        {lines.map((line) => (
          <li key={line}>
            <Jp>{line}</Jp>
          </li>
        ))}
      </ol>
      <SpeakButton text={lines.join("")} audio={audio} />
    </section>
  );
}

function LessonView({
  lesson,
  audio,
  backLabel,
  onStart,
  onBack,
}: {
  lesson: Lesson;
  audio: boolean;
  backLabel: string;
  onStart: () => void;
  onBack: () => void;
}) {
  const { state } = useHub();
  const record = state.progress.lessons[lesson.id];
  const status = lessonStatus(record);
  const mastery = Math.round(lessonMastery(lesson, state.progress.items) * 100);
  return (
    <>
      <button type="button" className="btn ghost small" onClick={onBack}>
        ← {backLabel}
      </button>
      <div className="row between mt">
        <h2>
          <Jp className="lesson-glyph">{lesson.jp}</Jp> {lesson.title}
        </h2>
        <span className={`chip status-${status}`}>{STATUS_LABEL[status]}</span>
      </div>
      <p className="muted">
        {lesson.summary}
        {record && ` · mejor resultado ${record.best} % · ${mastery} % aprendido`}
      </p>
      <div className="stack">
        {lesson.notes.map((note) => (
          <Note key={note.title} note={note} audio={audio} />
        ))}
        {lesson.builder === "presentation" && <PresentationBuilder audio={audio} />}
      </div>
      <div className="row mt">
        <button type="button" className="btn shu" onClick={onStart}>
          {status === "nueva" ? "Empezar los ejercicios" : "Practicar otra vez"}
        </button>
        <span className="muted small">
          Unos {Math.max(5, Math.round(lesson.items.length * 0.6))} minutos · se adapta a lo que ya
          sabes
        </span>
      </div>
    </>
  );
}

function DrawSetup({
  backLabel,
  onStart,
  onBack,
}: {
  backLabel: string;
  onStart: (script: Script, rows: number) => void;
  onBack: () => void;
}) {
  const [script, setScript] = useState<Script>("h");
  const [rows, setRows] = useState(10);
  const groups = [
    [2, "あ〜こ"],
    [4, "あ〜と"],
    [6, "あ〜ほ"],
    [10, "las 46"],
  ] as const;
  return (
    <>
      <button type="button" className="btn ghost small" onClick={onBack}>
        ← {backLabel}
      </button>
      <h2>
        <Jp className="lesson-glyph">書</Jp> Reto de escritura
      </h2>
      <div className="panel stack">
        <p>
          Verás una lectura en rōmaji y tendrás que dibujar el kana de memoria. El sistema compara
          tu dibujo con los {KANA[script].filter((k) => k.row <= 9).length} caracteres básicos y te
          dice cuánto se parece al correcto y a cuáles más se parece.
        </p>
        <p className="muted small">
          Reconoce la forma, no el orden de los trazos. Los que te cuesten más aparecerán más
          seguido.
        </p>
        <div className="seg" role="group" aria-label="Silabario">
          <button type="button" aria-pressed={script === "h"} onClick={() => setScript("h")}>
            <Jp>ひらがな</Jp> Hiragana
          </button>
          <button type="button" aria-pressed={script === "k"} onClick={() => setScript("k")}>
            <Jp>カタカナ</Jp> Katakana
          </button>
        </div>
        <div className="seg" role="group" aria-label="Caracteres">
          {groups.map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={rows === value}
              onClick={() => setRows(value)}
            >
              <Jp>{script === "h" ? label : hiraganaToKatakana(label)}</Jp>
            </button>
          ))}
        </div>
        <div className="row">
          <button type="button" className="btn shu" onClick={() => onStart(script, rows)}>
            Empezar ({DRAW_ROUND} kana)
          </button>
        </div>
      </div>
    </>
  );
}

function drawingExercises(script: Script, rows: number): Exercise[] {
  const { state, today } = getHub();
  const chars = basicKana(script).filter(
    (c) => (KANA[script].find((k) => k.char === c)?.row ?? 99) < rows,
  );
  return drawingQueue(chars, state.progress.items, today, DRAW_ROUND).map((char) => ({
    kind: "draw",
    key: drawKey(char),
    char,
    romaji: KANA[script].find((k) => k.char === char)?.answers[0] ?? "",
    script,
    strokes: STROKE_COUNTS[char],
  }));
}

export interface CourseProps {
  lessons: readonly Lesson[];
  units: readonly CourseUnit[];
  title: string;
  /** Label of the link back to the list, e.g. «Todas las lecciones». */
  backLabel: string;
}

/**
 * A course: its lessons by unit, the next one to take, a mixed review of what is due and the
 * drawing challenge. Both the lessons tab and the kana tab are one.
 */
export function Course({ lessons, units, title, backLabel }: CourseProps) {
  const { state, today } = useHub();
  const audio = useJapaneseVoice();
  const [view, setView] = useState<View>({ kind: "list" });
  const list = () => setView({ kind: "list" });

  const lessonSession = (lesson: Lesson) => () => {
    const hub = getHub();
    return buildLessonSession(lesson, hub.state.progress.items, hub.today, { audio });
  };
  const startSession = (title: string, lessonId: string | null, build: () => Exercise[]) => {
    if (lessonId) startLesson(lessonId);
    setView({ kind: "session", title, lessonId, exercises: build(), again: build, run: 0 });
    scrollTo(0, 0);
  };
  const reviewSession = () => {
    const hub = getHub();
    return buildReviewSession(hub.state, hub.today, { audio }, lessons);
  };

  if (view.kind === "session") {
    return (
      <LessonPlayer
        key={view.run}
        title={view.title}
        lessonId={view.lessonId}
        exercises={view.exercises}
        audio={audio}
        onExit={list}
        onRepeat={() => setView({ ...view, exercises: view.again(), run: view.run + 1 })}
      />
    );
  }
  if (view.kind === "lesson") {
    const { lesson } = view;
    return (
      <LessonView
        lesson={lesson}
        audio={audio}
        backLabel={backLabel}
        onBack={list}
        onStart={() => startSession(lesson.title, lesson.id, lessonSession(lesson))}
      />
    );
  }
  if (view.kind === "draw-setup") {
    return (
      <DrawSetup
        backLabel={backLabel}
        onBack={list}
        onStart={(script, rows) =>
          startSession("Reto de escritura", null, () => drawingExercises(script, rows))
        }
      />
    );
  }

  const next = nextLesson(state, lessons);
  const due = dueLessonItems(state, today, lessons).length;
  const completed = lessons.filter((l) => state.progress.lessons[l.id]?.completedAt).length;

  return (
    <>
      <h2>
        {title}{" "}
        <small>
          {completed} de {lessons.length} completadas
        </small>
      </h2>
      <div className="lesson-actions">
        <div className="panel cat-les lesson-next">
          <span className="muted small">Sigue el curso</span>
          {next ? (
            <>
              <b>
                <Jp>{next.jp}</Jp> {next.title}
              </b>
              <span className="muted small">{next.summary}</span>
              <button
                type="button"
                className="btn shu"
                onClick={() => setView({ kind: "lesson", lesson: next })}
              >
                {state.progress.lessons[next.id] ? "Continuar" : "Empezar"}
              </button>
            </>
          ) : (
            <b>¡Completaste el curso!</b>
          )}
        </div>
        <div className="panel cat-srs lesson-next">
          <span className="muted small">Repaso mixto</span>
          <b>{due ? `${due} elementos para hoy` : "Nada pendiente"}</b>
          <span className="muted small">Mezcla lo que ya viste, según lo que más te cuesta.</span>
          <button
            type="button"
            className="btn"
            disabled={!due}
            onClick={() => startSession("Repaso mixto", null, reviewSession)}
          >
            Repasar
          </button>
        </div>
        <div className="panel cat-out lesson-next">
          <span className="muted small">Reto de escritura</span>
          <b>Dibuja kana de memoria</b>
          <span className="muted small">
            El sistema reconoce tu trazo y te dice cuánto se parece.
          </span>
          <button type="button" className="btn" onClick={() => setView({ kind: "draw-setup" })}>
            Dibujar
          </button>
        </div>
      </div>
      {units.map((unit) => (
        <section key={unit.id}>
          <h2>
            <Jp>{unit.jp}</Jp> {unit.title}
          </h2>
          <div className="lesson-grid">
            {lessons
              .filter((l) => l.unit === unit.id)
              .map((lesson) => {
                const record = state.progress.lessons[lesson.id];
                const status = lessonStatus(record);
                const mastery = Math.round(lessonMastery(lesson, state.progress.items) * 100);
                return (
                  <button
                    key={lesson.id}
                    type="button"
                    className={`lesson-card status-${status} ${lesson === next ? "is-next" : ""}`}
                    onClick={() => setView({ kind: "lesson", lesson })}
                  >
                    <Jp className="lesson-glyph">{lesson.jp}</Jp>
                    <span className="lesson-title">{lesson.title}</span>
                    <span className="muted small">
                      {STATUS_LABEL[status]}
                      {record?.runs ? ` · ${record.best} %` : ""}
                    </span>
                    <span className="bar" aria-hidden="true">
                      <i style={{ width: `${mastery}%` }} />
                    </span>
                  </button>
                );
              })}
          </div>
        </section>
      ))}
    </>
  );
}
