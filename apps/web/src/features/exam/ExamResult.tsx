import {
  estimatedLevel,
  JLPT_LEVELS,
  MEXT_SECTIONS,
  OPTION_LETTERS,
  type ExamAttempt,
} from "@mainichi/core";
import { addCards } from "../../state/actions";
import { JpText, plainJp } from "../../ui/JpText";
import { toast } from "../../ui/toast";

/** Sections I and II have a sentence worth keeping; kanji and reading items do not. */
function mistakesToCards(attempt: ExamAttempt) {
  const drafts = attempt.mistakes
    .filter(({ question }) => question.section === "I" || question.section === "II")
    .map(({ question }) => {
      const correct = plainJp(question.options[question.answer] ?? "");
      const sentence = plainJp(question.prompt);
      return {
        jp: question.section === "I" ? sentence.replace("＿＿", correct) : correct,
        r: "",
        es: question.explanation.slice(0, 160),
        ej: question.section === "II" ? sentence : "",
        ejes: "Error de examen",
        t: "examen",
      };
    });
  const added = addCards(drafts);
  toast(added ? `${added} tarjetas creadas con tus errores.` : "Esas tarjetas ya estaban.");
}

export function ExamResult({ attempt, onBack }: { attempt: ExamAttempt; onBack: () => void }) {
  const level = estimatedLevel(attempt.levels);
  const minutes = Math.round(attempt.durationSec / 60);
  return (
    <>
      <div className="panel result-head">
        <div>
          <div className="big-score num">
            {attempt.score}
            <span className="muted"> / {attempt.max}</span>
          </div>
          <div className="muted">
            {attempt.label}
            {minutes > 0 && ` · ${minutes} min`}
          </div>
        </div>
        <div className="stack">
          <span className="tag">
            {level ? `Nivel estimado: ${level}` : "Nivel estimado: por debajo de N5"}
          </span>
          <button type="button" className="btn ghost small" onClick={onBack}>
            Volver a exámenes
          </button>
        </div>
      </div>

      <div className="grid g2 mt">
        <div className="panel">
          <h3>Por sección</h3>
          <div className="hbars">
            {MEXT_SECTIONS.filter((s) => attempt.sections[s.id]).map((s) => {
              const stats = attempt.sections[s.id]!;
              return (
                <div key={s.id} className={`hbar cat-${s.tone}`}>
                  <span>
                    {s.id} · {s.title}
                  </span>
                  <div className="track" aria-hidden="true">
                    <i style={{ width: `${stats.max ? (stats.score / stats.max) * 100 : 0}%` }} />
                  </div>
                  <span className="num">
                    {stats.score}/{stats.max}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="panel">
          <h3>Por nivel</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Nivel</th>
                <th scope="col">Aciertos</th>
              </tr>
            </thead>
            <tbody>
              {JLPT_LEVELS.filter((l) => attempt.levels[l]).map((l) => (
                <tr key={l}>
                  <td>{l}</td>
                  <td className="num">
                    {attempt.levels[l]!.right} de {attempt.levels[l]!.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="hint">El nivel estimado es el más alto con al menos 70 % de aciertos.</p>
        </div>
      </div>

      <h2>
        Repaso de errores <small>{attempt.mistakes.length}</small>
      </h2>
      {attempt.mistakes.length === 0 ? (
        <p className="muted">Sin errores. 素晴らしい！</p>
      ) : (
        <>
          <div className="row">
            <button type="button" className="btn ghost" onClick={() => mistakesToCards(attempt)}>
              Pasar mis errores a tarjetas
            </button>
          </div>
          <div className="stack mt">
            {attempt.mistakes.map(({ question, chosen }) => (
              <div key={question.id} className="panel review">
                <div className="muted small">
                  Sección {question.section} · {question.level}
                </div>
                <JpText text={question.prompt} className="review-q" />
                <div className="small">
                  Tu respuesta:{" "}
                  {chosen === null ? (
                    "sin responder"
                  ) : (
                    <>
                      {OPTION_LETTERS[chosen]} <JpText text={question.options[chosen] ?? ""} />
                    </>
                  )}
                </div>
                <div className="ok-text">
                  Correcta: {OPTION_LETTERS[question.answer]}{" "}
                  <JpText text={question.options[question.answer] ?? ""} />
                </div>
                <div className="muted small">{question.explanation}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
