import { PASS_PERCENT, type DraftCard, type Exercise } from "@mainichi/core";
import { useEffect, useRef, useState } from "react";
import { addCards, finishLesson, gradeLessonItem } from "../../state/actions";
import { Hanko } from "../../ui/primitives";
import { toast } from "../../ui/toast";
import { ExerciseView, type Answered } from "./Exercises";

interface Step {
  exercise: Exercise;
  /** A retry of an exercise missed earlier in the session; it is not graded again. */
  retry: boolean;
}

interface Miss {
  exercise: Exercise;
  feedback: string;
}

/** A word missed in a session, as a card for the deck. Kana, numbers and sentences are left out. */
function missToCard({ exercise }: Miss): DraftCard | null {
  const card = exercise.kind === "choice" || exercise.kind === "type" ? exercise.card : undefined;
  if (!card) return null;
  return { jp: card.jp, r: card.reading, es: card.es, ej: "", ejes: "", t: "lección" };
}

export function LessonPlayer({
  title,
  lessonId,
  exercises,
  audio,
  onExit,
  onRepeat,
}: {
  title: string;
  /** `null` for mixed reviews and drawing challenges, which are not one lesson. */
  lessonId: string | null;
  exercises: Exercise[];
  audio: boolean;
  onExit: () => void;
  onRepeat: () => void;
}) {
  const [steps, setSteps] = useState<Step[]>(() =>
    exercises.map((exercise) => ({ exercise, retry: false })),
  );
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState<Answered | null>(null);
  const [firstTry, setFirstTry] = useState({ right: 0, total: 0 });
  const [misses, setMisses] = useState<Miss[]>([]);
  const [startedAt] = useState(() => Date.now());
  const [finished, setFinished] = useState<{ score: number; minutes: number } | null>(null);
  const continueButton = useRef<HTMLButtonElement>(null);

  const step = steps[index];

  useEffect(() => {
    if (answered) continueButton.current?.focus();
  }, [answered]);

  function answer(result: Answered) {
    if (!step || answered) return;
    setAnswered(result);
    if (step.retry) return;
    setFirstTry((t) => ({ right: t.right + (result.correct ? 1 : 0), total: t.total + 1 }));
    if (step.exercise.key) gradeLessonItem(step.exercise.key, result.correct);
    if (!result.correct) {
      // Missed exercises come back at the end of the session, once. A matching round is not
      // repeated, since its pairs come back on their own.
      if (step.exercise.kind !== "match") {
        setMisses((m) => [...m, { exercise: step.exercise, feedback: result.feedback }]);
        setSteps((s) => [...s, { exercise: step.exercise, retry: true }]);
      }
    }
  }

  function next() {
    setAnswered(null);
    if (index + 1 < steps.length) {
      setIndex(index + 1);
      return;
    }
    const score = firstTry.total ? Math.round((firstTry.right / firstTry.total) * 100) : 0;
    const minutes = Math.max(1, Math.round((Date.now() - startedAt) / 60_000));
    finishLesson(lessonId, score, minutes);
    setFinished({ score, minutes });
  }

  if (finished) {
    const cards = misses.map(missToCard).filter((c): c is DraftCard => c !== null);
    const passed = finished.score >= PASS_PERCENT;
    return (
      <div className="panel lesson-end">
        <div className="row between">
          <div>
            <h2 className="card-title">{title}</h2>
            <p className="display num">{finished.score} %</p>
            <p className="muted">a la primera · {finished.minutes} min sumados al bloque Lección</p>
          </div>
          <Hanko state={passed ? "full" : "part"} pop />
        </div>
        <p>
          {passed
            ? lessonId
              ? "¡Lección completada! Sus elementos volverán en el repaso mixto cuando toque."
              : "¡Buen repaso!"
            : `Necesitas ${PASS_PERCENT} % para completarla. La próxima sesión insistirá en lo que fallaste.`}
        </p>
        {misses.length > 0 && (
          <>
            <h3 className="card-title mt">Para repasar</h3>
            <ul className="stack small">
              {misses.map((m, i) => (
                <li key={i}>{m.feedback}</li>
              ))}
            </ul>
          </>
        )}
        <div className="row mt">
          <button type="button" className="btn" onClick={onExit}>
            Volver a las lecciones
          </button>
          <button type="button" className="btn ghost" onClick={onRepeat}>
            Otra sesión
          </button>
          {cards.length > 0 && (
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                const added = addCards(cards);
                toast(added ? `${added} tarjetas nuevas en tu mazo` : "Ya estaban en tu mazo");
              }}
            >
              Pasar {cards.length} errores a tarjetas
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!step) {
    return (
      <div className="panel">
        <p>No hay nada que practicar ahora.</p>
        <button type="button" className="btn" onClick={onExit}>
          Volver
        </button>
      </div>
    );
  }

  return (
    <div
      className="panel lesson-player"
      onKeyDown={(e) => {
        if (e.key === "Enter" && answered && e.target === e.currentTarget) next();
      }}
    >
      <div className="row between">
        <b>{title}</b>
        <span className="row">
          <span className="muted num small">
            {index + 1} de {steps.length}
          </span>
          <button type="button" className="btn ghost small" onClick={onExit}>
            Salir
          </button>
        </span>
      </div>
      <div
        className="bar mt"
        role="progressbar"
        aria-label="Avance de la sesión"
        aria-valuenow={index}
        aria-valuemax={steps.length}
      >
        <i style={{ width: `${(index / steps.length) * 100}%` }} />
      </div>
      {step.retry && <p className="chip mt">Otra oportunidad</p>}
      <div className="exercise" key={index}>
        <ExerciseView
          exercise={step.exercise}
          audio={audio}
          answered={answered}
          onAnswer={answer}
        />
      </div>
      {answered && (
        <div className={`ex-feedback ${answered.correct ? "ok" : "no"}`} role="status">
          <b>{answered.correct ? "¡Correcto!" : "No exactamente."}</b> {answered.feedback}
          <div className="row mt">
            <button ref={continueButton} type="button" className="btn shu" onClick={next}>
              {index + 1 < steps.length ? "Continuar" : "Ver resultado"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
