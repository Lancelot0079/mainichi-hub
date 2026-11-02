import {
  isCorrectReading,
  KANA,
  kanaDue,
  kanaMastered,
  MASTERED_BOX,
  unlockedKana,
  type KanaItem,
  type Script,
} from "@mainichi/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { answerKana, setScript } from "../../state/actions";
import { getHub, useHub } from "../../state/store";
import { Jp } from "../../ui/primitives";
import { toast } from "../../ui/toast";

const FREE_ROUND = 10;
const ADVANCE_DELAY_MS = 550;

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
  }
  return copy;
}

interface Round {
  queue: KanaItem[];
  current: KanaItem | null;
  free: boolean;
}

const startRound = (items: KanaItem[], free: boolean): Round => {
  const [current = null, ...queue] = items;
  return { queue, current, free };
};

function KanaTable({ script }: { script: Script }) {
  const { state } = useHub();
  const unlocked = state.progress.unlocked[script];
  return (
    <div className="kgrid">
      {KANA[script].map((item) => {
        const record = state.progress.kana[script][item.char];
        const level =
          item.row >= unlocked
            ? "locked"
            : record
              ? `b${Math.min(MASTERED_BOX + 1, record.box)}`
              : "";
        return (
          <div key={item.char} className={`kcell ${level}`} title={item.answers.join(" / ")}>
            <Jp className="k">{item.char}</Jp>
            <span className="r">{item.answers[0]}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function KanaPage() {
  const { state, today } = useHub();
  const script = state.progress.script;
  const [round, setRound] = useState<Round>(() =>
    startRound(shuffled(kanaDue(state, script, today)), false),
  );
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [missed, setMissed] = useState(false);
  const field = useRef<HTMLInputElement>(null);
  const advance = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(advance.current), []);
  const currentChar = round.current?.char;
  useEffect(() => {
    // Focusing on touch screens would cover the page with the keyboard on arrival.
    if (matchMedia("(pointer: fine)").matches) field.current?.focus();
  }, [currentChar]);

  const next = useCallback(() => {
    clearTimeout(advance.current);
    setInput("");
    setFeedback(null);
    setMissed(false);
    setRound((r) => startRound(r.queue, r.free));
  }, []);

  function changeScript(value: Script) {
    setScript(value);
    const hub = getHub();
    setRound(startRound(shuffled(kanaDue(hub.state, value, hub.today)), false));
    setInput("");
    setFeedback(null);
    setMissed(false);
  }

  function record(correct: boolean) {
    if (!round.current) return;
    const unlocked = answerKana(script, round.current, correct, round.free);
    if (unlocked.length) {
      toast(`Desbloqueaste una fila nueva: ${unlocked.map((k) => k.char).join(" ")}`);
      setRound((r) => ({ ...r, queue: [...r.queue, ...shuffled(unlocked)] }));
    }
  }

  function revealMiss(item: KanaItem) {
    record(false);
    setRound((r) => ({ ...r, queue: [...r.queue, item] }));
    setMissed(true);
    setFeedback({ ok: false, text: `${item.char} se lee «${item.answers[0]}». Pulsa Enter.` });
  }

  function check() {
    const item = round.current;
    if (!item) return;
    if (missed) {
      next();
      return;
    }
    if (!input.trim() || feedback) return;
    if (isCorrectReading(item, input)) {
      record(true);
      setFeedback({ ok: true, text: `✓ ${item.char} = ${item.answers[0]}` });
      advance.current = setTimeout(next, ADVANCE_DELAY_MS);
    } else {
      revealMiss(item);
    }
  }

  const due = kanaDue(state, script, today).length;
  const mastered = kanaMastered(state, script);
  const total = KANA[script].length;
  const item = round.current;

  return (
    <>
      <div className="row between">
        <div className="seg" role="group" aria-label="Silabario">
          <button type="button" aria-pressed={script === "h"} onClick={() => changeScript("h")}>
            <Jp>ひらがな</Jp> Hiragana
          </button>
          <button type="button" aria-pressed={script === "k"} onClick={() => changeScript("k")}>
            <Jp>カタカナ</Jp> Katakana
          </button>
        </div>
        <span className="muted num">
          {due} por repasar · {unlockedKana(state, script).length} desbloqueados · {mastered}{" "}
          dominados de {total}
        </span>
      </div>
      <div className="kana-stage mt">
        <div className="sheet" aria-live="polite">
          <Jp className={`glyph ${item && item.char.length > 1 ? "yo" : ""}`}>
            {item?.char ?? "済"}
          </Jp>
        </div>
        <div className="panel">
          <h2 className="card-title">{round.free ? "Práctica libre" : "Repaso de hoy"}</h2>
          <p className="hint">
            Escribe la lectura en rōmaji y pulsa Enter. Los que fallas vuelven al final de la ronda.
            Cada fila nueva se desbloquea sola cuando dominas la anterior.
          </p>
          <label className="field">
            <span>Lectura</span>
            <input
              ref={field}
              type="text"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder="ej. shi"
              value={input}
              disabled={!item}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  check();
                }
              }}
            />
          </label>
          <div
            className={`feedback ${feedback ? (feedback.ok ? "ok" : "no") : item ? "" : "ok"}`}
            role="status"
          >
            {feedback?.text ??
              (item ? "" : "Nada pendiente. Usa la práctica libre si quieres más.")}
          </div>
          <div className="row">
            <button type="button" className="btn" disabled={!item} onClick={check}>
              Comprobar
            </button>
            <button
              type="button"
              className="btn ghost"
              disabled={!item || missed || !!feedback}
              onClick={() => item && revealMiss(item)}
            >
              No lo sé
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                clearTimeout(advance.current);
                setInput("");
                setFeedback(null);
                setMissed(false);
                setRound(
                  startRound(shuffled(unlockedKana(state, script)).slice(0, FREE_ROUND), true),
                );
              }}
            >
              Práctica libre ({FREE_ROUND})
            </button>
          </div>
          {item && (
            <p className="muted num small mt">Quedan {round.queue.length + 1} en esta ronda</p>
          )}
        </div>
      </div>
      <h2>
        Tu tabla{" "}
        <small>
          {mastered} de {total} dominados
        </small>
      </h2>
      <div className="panel">
        <KanaTable script={script} />
        <div className="legend">
          <span>
            <i className="locked" />
            bloqueado
          </span>
          <span>
            <i />
            nuevo
          </span>
          <span>
            <i className="kcell b2" />
            aprendiendo
          </span>
          <span>
            <i className="kcell b4" />
            dominado
          </span>
        </div>
      </div>
    </>
  );
}
