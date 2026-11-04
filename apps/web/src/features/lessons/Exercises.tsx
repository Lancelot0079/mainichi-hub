import { matchesAnswer, type Exercise, type Verdict } from "@mainichi/core";
import { useEffect, useRef, useState } from "react";
import { JpText } from "../../ui/JpText";
import { Jp } from "../../ui/primitives";
import { speak } from "../../ui/speech";
import { DrawPad } from "./DrawPad";

export interface Answered {
  correct: boolean;
  /** What to show under the exercise once answered. */
  feedback: string;
}

type Props<K extends Exercise["kind"]> = {
  exercise: Extract<Exercise, { kind: K }>;
  audio: boolean;
  answered: Answered | null;
  onAnswer: (result: Answered) => void;
};

export function SpeakButton({ text, audio }: { text?: string; audio: boolean }) {
  if (!audio || !text) return null;
  return (
    <button
      type="button"
      className="btn ghost small speak"
      onClick={() => speak(text)}
      aria-label="Escuchar en japonés"
    >
      🔊
    </button>
  );
}

const Prompt = ({ text, ja }: { text: string; ja: boolean }) =>
  ja ? (
    <JpText text={text} className="ex-prompt jp-big" />
  ) : (
    <span className="ex-prompt">{text}</span>
  );

function Choice({ exercise, audio, answered, onAnswer }: Props<"choice">) {
  const [chosen, setChosen] = useState<number | null>(null);
  const listening = exercise.listen && audio && !answered;

  // Each exercise is mounted fresh (the player keys it), so state needs no reset here.
  useEffect(() => {
    if (exercise.listen && audio && exercise.speak) speak(exercise.speak);
  }, [exercise, audio]);

  return (
    <>
      {exercise.passage && (
        <div className="passage">
          <JpText text={exercise.passage} />
        </div>
      )}
      <div className="row ex-head">
        {listening ? (
          <span className="ex-prompt">Escucha y elige qué significa</span>
        ) : (
          <Prompt text={exercise.prompt} ja={exercise.promptJa} />
        )}
        <SpeakButton text={exercise.speak} audio={audio} />
      </div>
      <div className="options ex-options">
        {exercise.options.map((option, i) => {
          const state = !answered
            ? ""
            : i === exercise.answer
              ? "right"
              : i === chosen
                ? "wrong"
                : "";
          return (
            <button
              key={`${i}-${option}`}
              type="button"
              className={`opt ${state}`}
              disabled={!!answered}
              onClick={() => {
                setChosen(i);
                onAnswer({ correct: i === exercise.answer, feedback: exercise.explanation });
              }}
            >
              {exercise.optionsJa ? <JpText text={option} /> : option}
            </button>
          );
        })}
      </div>
    </>
  );
}

function Typed({ exercise, audio, answered, onAnswer }: Props<"type">) {
  const [value, setValue] = useState("");
  const field = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (matchMedia("(pointer: fine)").matches) field.current?.focus();
  }, [exercise]);

  const submit = () => {
    if (answered || !value.trim()) return;
    const correct = matchesAnswer(value, exercise.accept);
    onAnswer({
      correct,
      feedback: correct
        ? exercise.explanation
        : `La respuesta es ${exercise.solution}. ${exercise.explanation}`,
    });
  };

  return (
    <>
      <div className="row ex-head">
        <Prompt text={exercise.prompt} ja={exercise.promptJa} />
        {exercise.promptJa && <SpeakButton text={exercise.speak} audio={audio} />}
      </div>
      <label className="field">
        <span>
          {exercise.romaji ? "Escribe la lectura en rōmaji" : "Escríbelo en japonés: kana o rōmaji"}
        </span>
        <input
          ref={field}
          type="text"
          lang={exercise.romaji ? "es" : "ja"}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          value={value}
          disabled={!!answered}
          placeholder={exercise.romaji ? "ej. shi" : "ej. arigatou o ありがとう"}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
              submit();
            }
          }}
        />
      </label>
      <div className="row">
        <button
          type="button"
          className="btn"
          disabled={!!answered || !value.trim()}
          onClick={submit}
        >
          Comprobar
        </button>
        <button
          type="button"
          className="btn ghost"
          disabled={!!answered}
          onClick={() =>
            onAnswer({
              correct: false,
              feedback: `La respuesta es ${exercise.solution}. ${exercise.explanation}`,
            })
          }
        >
          No lo sé
        </button>
      </div>
    </>
  );
}

function Order({ exercise, answered, onAnswer }: Props<"order">) {
  const [placed, setPlaced] = useState<number[]>([]);
  const built = placed.map((i) => exercise.tiles[i] ?? "");
  const complete = placed.length === exercise.tiles.length;

  return (
    <>
      <p className="ex-prompt">Ordena: «{exercise.es}»</p>
      <div className="tiles built" aria-label="Tu oración">
        {built.length ? (
          placed.map((tileIndex, position) => (
            <button
              key={`${tileIndex}-${position}`}
              type="button"
              className="tile"
              disabled={!!answered}
              onClick={() => setPlaced(placed.filter((_, p) => p !== position))}
            >
              <Jp>{exercise.tiles[tileIndex]}</Jp>
            </button>
          ))
        ) : (
          <span className="muted small">Toca las palabras en orden.</span>
        )}
      </div>
      <div className="tiles" aria-label="Palabras disponibles">
        {exercise.tiles.map((tile, i) =>
          placed.includes(i) ? null : (
            <button
              key={`${i}-${tile}`}
              type="button"
              className="tile"
              disabled={!!answered}
              onClick={() => setPlaced([...placed, i])}
            >
              <Jp>{tile}</Jp>
            </button>
          ),
        )}
      </div>
      <button
        type="button"
        className="btn"
        disabled={!complete || !!answered}
        onClick={() => {
          const correct = built.join("") === exercise.solution.join("");
          onAnswer({
            correct,
            feedback: correct
              ? exercise.explanation
              : `Lo correcto: ${exercise.solution.join(" ")}. ${exercise.explanation}`,
          });
        }}
      >
        Comprobar
      </button>
    </>
  );
}

function Match({ exercise, answered, onAnswer }: Props<"match">) {
  const [left] = useState(() => exercise.pairs.map((p) => p.jp));
  const [right] = useState(() => [...exercise.pairs.map((p) => p.es)].sort());
  const [selected, setSelected] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [misses, setMisses] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);

  function chooseMeaning(es: string) {
    if (!selected || answered) return;
    const pair = exercise.pairs.find((p) => p.jp === selected);
    if (pair?.es === es) {
      const next = [...done, selected];
      setDone(next);
      setSelected(null);
      if (next.length === exercise.pairs.length) {
        onAnswer({
          correct: misses === 0,
          feedback: misses
            ? `Lo lograste con ${misses} error${misses > 1 ? "es" : ""}.`
            : "¡Todas a la primera!",
        });
      }
    } else {
      setMisses(misses + 1);
      setFlash(es);
      setTimeout(() => setFlash(null), 400);
    }
  }

  const doneMeanings = new Set(exercise.pairs.filter((p) => done.includes(p.jp)).map((p) => p.es));
  return (
    <>
      <p className="ex-prompt">Une cada palabra con su significado</p>
      <div className="match">
        <div className="stack">
          {left.map((jp) => (
            <button
              key={jp}
              type="button"
              className={`opt ${done.includes(jp) ? "right" : ""} ${selected === jp ? "chosen" : ""}`}
              aria-pressed={selected === jp}
              disabled={done.includes(jp) || !!answered}
              onClick={() => setSelected(jp)}
            >
              <Jp>{jp}</Jp>
            </button>
          ))}
        </div>
        <div className="stack">
          {right.map((es) => (
            <button
              key={es}
              type="button"
              className={`opt ${doneMeanings.has(es) ? "right" : ""} ${flash === es ? "wrong" : ""}`}
              disabled={doneMeanings.has(es) || !selected || !!answered}
              onClick={() => chooseMeaning(es)}
            >
              {es}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function Draw({ exercise, answered, onAnswer }: Props<"draw">) {
  return (
    <>
      <p className="ex-prompt">
        Dibuja de memoria <b>«{exercise.romaji}»</b> en{" "}
        {exercise.script === "h" ? "hiragana" : "katakana"}
      </p>
      <DrawPad
        target={exercise.char}
        script={exercise.script}
        hint={
          exercise.strokes
            ? `se escribe con ${exercise.strokes} trazo${exercise.strokes > 1 ? "s" : ""}`
            : undefined
        }
        onResult={(verdict: Verdict) =>
          onAnswer({
            correct: verdict.passed,
            feedback: verdict.passed
              ? `${exercise.char} = ${exercise.romaji}.`
              : `La forma correcta aparece sobre tu dibujo: ${exercise.char}.`,
          })
        }
      />
      {!answered && (
        <button
          type="button"
          className="btn ghost small mt"
          onClick={() =>
            onAnswer({
              correct: false,
              feedback: `«${exercise.romaji}» se escribe ${exercise.char}.`,
            })
          }
        >
          No me acuerdo
        </button>
      )}
    </>
  );
}

export function ExerciseView(props: {
  exercise: Exercise;
  audio: boolean;
  answered: Answered | null;
  onAnswer: (result: Answered) => void;
}) {
  const { exercise } = props;
  switch (exercise.kind) {
    case "choice":
      return <Choice {...props} exercise={exercise} />;
    case "type":
      return <Typed {...props} exercise={exercise} />;
    case "order":
      return <Order {...props} exercise={exercise} />;
    case "match":
      return <Match {...props} exercise={exercise} />;
    case "draw":
      return <Draw {...props} exercise={exercise} />;
  }
}
