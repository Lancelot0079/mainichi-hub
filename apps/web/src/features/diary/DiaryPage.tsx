import {
  correctionPrompt,
  correctionSchema,
  daysBetween,
  DIARY_PROMPTS,
  type Correction,
} from "@mainichi/core";
import { useState } from "react";
import { addCards, saveDiaryEntry } from "../../state/actions";
import { useHub } from "../../state/store";
import { AssistantBridge } from "../../ui/AssistantBridge";
import { Jp } from "../../ui/primitives";
import { toast } from "../../ui/toast";

const MAX_TEXT_LENGTH = 3000;
const HISTORY_SIZE = 40;

function promptFor(today: string): readonly [string, string] {
  const count = DIARY_PROMPTS.length;
  const index = ((daysBetween("2026-01-01", today) % count) + count) % count;
  return DIARY_PROMPTS[index] ?? ["Tema libre", "…"];
}

function Feedback({ feedback }: { feedback: Correction }) {
  return (
    <>
      {feedback.oraciones.map((sentence, i) => (
        <div key={i} className={`fb ${sentence.ok ? "okk" : ""}`}>
          {!sentence.ok && <Jp className="o">{sentence.original}</Jp>}
          <div>
            <Jp className="c">{sentence.corregida || sentence.original}</Jp>
          </div>
          {sentence.natural && sentence.natural !== sentence.corregida && (
            <div>
              Más natural: <Jp className="display">{sentence.natural}</Jp>
            </div>
          )}
          <div className="muted small">{sentence.explicacion}</div>
        </div>
      ))}
      {feedback.comentario && <p>{feedback.comentario}</p>}
    </>
  );
}

export default function DiaryPage() {
  const { state, today } = useHub();
  const [topic, structure] = promptFor(today);
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");
  const [corrected, setCorrected] = useState<Correction | null>(null);
  const entries = state.diary.filter((e) => !e.deletedAt);

  function save(feedback: Correction | null) {
    if (!text.trim()) {
      setStatus("Escribe tus oraciones primero.");
      return;
    }
    saveDiaryEntry(text.trim(), topic, feedback);
    setText("");
    setStatus(feedback ? "Guardado con correcciones." : "Guardado. Bloque de escritura marcado.");
    setCorrected(feedback);
  }

  function correctionsToCards() {
    if (!corrected) return;
    const added = addCards(
      corrected.oraciones
        .filter((sentence) => !sentence.ok)
        .map((sentence) => ({
          jp: sentence.corregida,
          r: "",
          es: sentence.explicacion.slice(0, 140),
          ej: "",
          ejes: "Corrección de tu diario",
          t: "corrección",
        })),
    );
    setCorrected({ ...corrected, oraciones: corrected.oraciones.map((s) => ({ ...s, ok: true })) });
    toast(`${added} tarjetas agregadas con tus correcciones.`);
  }

  return (
    <>
      <h2>Diario de 3 oraciones</h2>
      <div className="panel stack">
        <div>
          <div className="muted small">Tema de hoy</div>
          <div>
            {topic} <Jp className="display">{structure}</Jp>
          </div>
        </div>
        <label className="field">
          <span>Tus oraciones (en kana, kanji o rōmaji)</span>
          <textarea
            className="diary-input"
            lang="ja"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </label>
        <div className="row">
          <button
            type="button"
            className="btn ghost"
            disabled={!text.trim()}
            onClick={() => save(null)}
          >
            Guardar sin corregir
          </button>
          <span className="muted" role="status">
            {status}
          </span>
        </div>
        <AssistantBridge
          copyLabel="Copiar prompt de corrección"
          emptyMessage="Escribe tus oraciones primero."
          schema={correctionSchema}
          buildPrompt={() =>
            text.trim()
              ? correctionPrompt(text.trim().slice(0, MAX_TEXT_LENGTH), topic, structure)
              : null
          }
          onResult={save}
        />
        {corrected && (
          <div>
            <Feedback feedback={corrected} />
            {corrected.oraciones.some((sentence) => !sentence.ok) && (
              <button type="button" className="btn ghost" onClick={correctionsToCards}>
                Convertir las correcciones en tarjetas
              </button>
            )}
          </div>
        )}
      </div>
      <h2>
        Entradas anteriores <small>{entries.length} entradas</small>
      </h2>
      {entries.length === 0 && (
        <p className="muted">Todavía no hay entradas. La primera es la más difícil.</p>
      )}
      {[...entries]
        .reverse()
        .slice(0, HISTORY_SIZE)
        .map((entry) => (
          <details key={entry.id} className="panel entry">
            <summary>
              <b className="num">{entry.date}</b> <span className="muted">· {entry.prompt}</span>{" "}
              {entry.feedback && <span className="tag">corregido</span>}
            </summary>
            <Jp className="txt">{entry.text}</Jp>
            {entry.feedback && <Feedback feedback={entry.feedback} />}
          </details>
        ))}
    </>
  );
}
