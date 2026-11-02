import {
  MEXT_DURATION_MINUTES,
  MEXT_SECTIONS,
  OPTION_LETTERS,
  type Answers,
  type ExamAttempt,
  type ExamQuestion,
} from "@mainichi/core";
import { useEffect, useRef, useState } from "react";
import { JpText } from "../../ui/JpText";

export interface RunConfig {
  questions: ExamQuestion[];
  kind: ExamAttempt["kind"];
  label: string;
  timed: boolean;
}

const pad = (n: number) => String(n).padStart(2, "0");

function Question({
  question,
  number,
  chosen,
  onChoose,
}: {
  question: ExamQuestion;
  number: number;
  chosen: number | undefined;
  onChoose: (option: number) => void;
}) {
  return (
    <fieldset className="question">
      <legend>
        <span className="num">{number}.</span> <JpText text={question.prompt} />
      </legend>
      <div className="options">
        {question.options.map((option, i) => (
          <label key={i} className={`opt ${chosen === i ? "chosen" : ""}`}>
            <input
              type="radio"
              name={question.id}
              checked={chosen === i}
              onChange={() => onChoose(i)}
            />
            <b>{OPTION_LETTERS[i]}</b> <JpText text={option} />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function ExamRunner({
  config,
  onFinish,
  onCancel,
}: {
  config: RunConfig;
  onFinish: (answers: Answers, durationSec: number) => void;
  onCancel: () => void;
}) {
  const [answers, setAnswers] = useState<Answers>({});
  const [startedAt] = useState(() => Date.now());
  const [secondsLeft, setSecondsLeft] = useState(MEXT_DURATION_MINUTES * 60);
  const finished = useRef(false);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    onFinish(answers, Math.round((Date.now() - startedAt) / 1000));
  };
  // The interval needs the latest answers without restarting every time one changes.
  const finishRef = useRef(finish);
  useEffect(() => {
    finishRef.current = finish;
  });

  useEffect(() => {
    if (!config.timed) return;
    const endsAt = startedAt + MEXT_DURATION_MINUTES * 60_000;
    const interval = setInterval(() => {
      const left = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) finishRef.current();
    }, 1000);
    return () => clearInterval(interval);
  }, [config.timed, startedAt]);

  const answered = Object.keys(answers).length;
  // Numbered in paper order: section by section, as they are shown.
  const ordered = MEXT_SECTIONS.flatMap((s) => config.questions.filter((q) => q.section === s.id));
  const numbers = new Map(ordered.map((q, i) => [q.id, i + 1]));

  return (
    <>
      <div className="exam-bar">
        <b>{config.label}</b>
        {config.timed && (
          <span className={`num ${secondsLeft < 300 ? "warn-text" : ""}`} role="timer">
            ⏱ {pad(Math.floor(secondsLeft / 60))}:{pad(secondsLeft % 60)}
          </span>
        )}
        <span className="muted num small">
          {answered} de {config.questions.length} respondidas
        </span>
        <span className="row">
          <button type="button" className="btn ghost small" onClick={onCancel}>
            Salir sin guardar
          </button>
          <button type="button" className="btn shu small" onClick={finish}>
            Terminar y calificar
          </button>
        </span>
      </div>
      {MEXT_SECTIONS.map((section) => {
        const questions = config.questions.filter((q) => q.section === section.id);
        if (!questions.length) return null;
        return (
          <section key={section.id} className="exam-section">
            <h2>
              {section.id}. {section.title}{" "}
              <small>
                {section.points} punto{section.points > 1 ? "s" : ""} cada una
              </small>
            </h2>
            <p className="instruction">
              <JpText text={section.instruction} />
            </p>
            <div className="panel stack">
              {questions.map((question, i) => {
                const showPassage =
                  question.passage && question.passage !== questions[i - 1]?.passage;
                return (
                  <div key={question.id}>
                    {showPassage && (
                      <div className="passage">
                        <JpText text={question.passage ?? ""} />
                      </div>
                    )}
                    <Question
                      question={question}
                      number={numbers.get(question.id) ?? 0}
                      chosen={answers[question.id]}
                      onChoose={(option) => setAnswers({ ...answers, [question.id]: option })}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
      <div className="row mt">
        <button type="button" className="btn shu" onClick={finish}>
          Terminar y calificar
        </button>
      </div>
    </>
  );
}
