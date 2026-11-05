import {
  isCorrectReading,
  itemKey,
  KANA,
  KANA_COURSE,
  KANA_MNEMONICS,
  KANA_UNITS,
  rowTable,
  STROKE_COUNTS,
  kanaDue,
  kanaMastered,
  MASTERED_BOX,
  unlockedKana,
  type KanaItem,
  type Script,
} from "@mainichi/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { answerKana, setScript } from "../../state/actions";
import { getHub, useHub, type Hub } from "../../state/store";
import { Jp } from "../../ui/primitives";
import { useJapaneseVoice, speak } from "../../ui/speech";
import { toast } from "../../ui/toast";
import { Course } from "../lessons/Course";
import { SpeakButton } from "../lessons/Exercises";

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

/** Quick reading drill: see a kana, type its reading. */
function QuickReading() {
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

/** Best Leitner box of a kana across the course and the quick-reading drill. */
function kanaBox({ state }: Hub, script: Script, char: string): number | null {
  const boxes: number[] = [];
  const drill = state.progress.kana[script][char];
  if (drill) boxes.push(drill.box);
  for (const lesson of KANA_COURSE) {
    if (lesson.script !== script) continue;
    const item = lesson.items.find((i) => i.glyph && i.jp === char);
    const record = item && state.progress.items[itemKey(lesson, item)];
    if (record) boxes.push(record.box);
  }
  return boxes.length ? Math.max(...boxes) : null;
}

const CHART_GROUPS = [
  { title: "Básicos", rows: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], columns: 5 },
  { title: "Con tenten y maru", rows: [10, 11, 12, 13, 14], columns: 5 },
  { title: "Combinados", rows: [15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25], columns: 3 },
] as const;

/** The whole syllabary to explore: tap a kana to hear it and see how to remember it. */
function KanaChart() {
  const hub = useHub();
  const audio = useJapaneseVoice();
  const [script, setScriptView] = useState<Script>(hub.state.progress.script);
  const [selected, setSelected] = useState<string>(script === "h" ? "あ" : "ア");
  const item = KANA[script].find((k) => k.char === selected) ?? KANA[script][0];
  const box = item ? kanaBox(hub, script, item.char) : null;
  const level =
    box === null ? "Todavía no lo practicas" : box >= MASTERED_BOX ? "Dominado" : "Aprendiendo";

  function choose(char: string) {
    setSelected(char);
    if (audio) speak(char);
  }

  return (
    <>
      <div className="row between">
        <div className="seg" role="group" aria-label="Silabario de la tabla">
          {(["h", "k"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={script === value}
              onClick={() => {
                setScriptView(value);
                setSelected(value === "h" ? "あ" : "ア");
              }}
            >
              <Jp>{value === "h" ? "ひらがな" : "カタカナ"}</Jp>{" "}
              {value === "h" ? "Hiragana" : "Katakana"}
            </button>
          ))}
        </div>
        <span className="muted small">Toca un kana para escucharlo y ver cómo recordarlo.</span>
      </div>
      <div className="chart-layout mt">
        <div className="stack">
          {CHART_GROUPS.map((group) => {
            const columns = group.columns === 5 ? rowTable(script, group.rows).rows : null;
            const cells = columns
              ? columns.flat()
              : KANA[script]
                  .filter((k) => (group.rows as readonly number[]).includes(k.row))
                  .map((k) => k.char);
            return (
              <section key={group.title} className="panel">
                <h2 className="card-title">{group.title}</h2>
                <div className={`chart cols-${group.columns}`}>
                  {cells.map((char, i) => {
                    if (!char) return <span key={`gap-${i}`} className="chart-gap" />;
                    const cellBox = kanaBox(hub, script, char);
                    const reading = KANA[script].find((k) => k.char === char)?.answers[0] ?? "";
                    const tone =
                      cellBox === null
                        ? ""
                        : cellBox >= MASTERED_BOX
                          ? "is-mastered"
                          : "is-learning";
                    return (
                      <button
                        key={char}
                        type="button"
                        className={`chart-cell ${tone}`}
                        aria-pressed={char === selected}
                        aria-label={`${char}, ${reading}`}
                        onClick={() => choose(char)}
                      >
                        <Jp className="k">{char}</Jp>
                        <span className="r">{reading}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
        {item && (
          <aside className="panel chart-detail" aria-live="polite">
            <Jp className="detail-glyph">{item.char}</Jp>
            <b className="detail-romaji">{item.answers.join(" · ")}</b>
            {STROKE_COUNTS[item.char] !== undefined && (
              <span className="muted small">
                {STROKE_COUNTS[item.char]} trazo{STROKE_COUNTS[item.char] === 1 ? "" : "s"}
              </span>
            )}
            {KANA_MNEMONICS[item.char] && <p className="learn-hook">{KANA_MNEMONICS[item.char]}</p>}
            <span className="chip">{level}</span>
            <SpeakButton text={item.char} audio={audio} />
          </aside>
        )}
      </div>
      <div className="legend mt">
        <span>
          <i />
          sin practicar
        </span>
        <span>
          <i className="is-learning" />
          aprendiendo
        </span>
        <span>
          <i className="is-mastered" />
          dominado
        </span>
      </div>
    </>
  );
}

type Tab = "curso" | "tabla" | "lectura";

const TABS: ReadonlyArray<readonly [Tab, string, string]> = [
  ["curso", "課", "Curso"],
  ["tabla", "表", "Tabla"],
  ["lectura", "読", "Lectura rápida"],
];

/** The part after the section in the address, as in #kana/lectura. */
function tabFromHash(): Tab {
  const part = location.hash.split("/")[1];
  return part === "tabla" || part === "lectura" ? part : "curso";
}

export default function KanaPage() {
  const [tab, setTab] = useState<Tab>(tabFromHash);

  useEffect(() => {
    const onChange = () => setTab(tabFromHash());
    addEventListener("hashchange", onChange);
    return () => removeEventListener("hashchange", onChange);
  }, []);

  function open(value: Tab) {
    history.replaceState(null, "", value === "curso" ? "#kana" : `#kana/${value}`);
    setTab(value);
  }

  return (
    <>
      <div className="seg kana-tabs" role="group" aria-label="Partes de la sección Kana">
        {TABS.map(([value, jp, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={tab === value}
            onClick={() => open(value)}
          >
            <Jp>{jp}</Jp> {label}
          </button>
        ))}
      </div>
      {tab === "curso" && (
        <Course
          lessons={KANA_COURSE}
          units={KANA_UNITS}
          title="Kana desde cero"
          backLabel="Todo el curso de kana"
        />
      )}
      {tab === "tabla" && <KanaChart />}
      {tab === "lectura" && <QuickReading />}
    </>
  );
}
