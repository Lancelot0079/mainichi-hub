import {
  ankiImportText,
  cardsDue,
  cardsPrompt,
  draftCardsSchema,
  liveCards,
  type CardRating,
  type DraftCard,
} from "@mainichi/core";
import { AnkiConnectClient } from "@mainichi/integrations";
import { useState } from "react";
import { addCards, deleteCard, markExported, restoreCard, reviewCard } from "../../state/actions";
import { isDemo, useHub } from "../../state/store";
import { AssistantBridge } from "../../ui/AssistantBridge";
import { copyText, downloadText } from "../../ui/clipboard";
import { Jp } from "../../ui/primitives";
import { toast } from "../../ui/toast";
import { ankiErrorMessage } from "../resources/AnkiPanel";

const MAX_NOTES_LENGTH = 12_000;
const KNOWN_WORDS_IN_PROMPT = 150;

function Review() {
  const { state, today } = useHub();
  const due = cardsDue(state.cards, today);
  const [shownId, setShownId] = useState<string | null>(null);
  const card = due[0];

  if (!card) {
    return (
      <div className="panel flash">
        <div>
          <Jp className="front">済</Jp>
          <p className="muted">
            No hay tarjetas pendientes.{" "}
            {liveCards(state.cards).length
              ? "Vuelve mañana."
              : "Crea las primeras desde tus apuntes, abajo."}
          </p>
        </div>
      </div>
    );
  }

  const shown = shownId === card.id;
  const rate = (rating: CardRating) => {
    setShownId(null);
    reviewCard(card.id, rating);
  };

  return (
    <div className="panel flash">
      <div style={{ width: "100%" }}>
        <Jp className="front">{card.jp}</Jp>
        {card.example && (
          <div>
            <Jp className="display">{card.example}</Jp>
          </div>
        )}
        {shown ? (
          <>
            <div className="mt reveal">
              <Jp className="reading">{card.reading}</Jp>
              <div>
                <b>{card.meaning}</b>
              </div>
              {card.exampleMeaning && <div className="muted">{card.exampleMeaning}</div>}
            </div>
            <div className="row mt" style={{ justifyContent: "center" }}>
              <button type="button" className="btn shu" onClick={() => rate(0)}>
                Otra vez
              </button>
              <button type="button" className="btn" onClick={() => rate(1)}>
                Bien
              </button>
              <button type="button" className="btn ghost" onClick={() => rate(2)}>
                Fácil
              </button>
            </div>
          </>
        ) : (
          <div className="row mt" style={{ justifyContent: "center" }}>
            <button type="button" className="btn" onClick={() => setShownId(card.id)}>
              Mostrar respuesta
            </button>
          </div>
        )}
        <p className="muted num small mt">{due.length} por repasar hoy</p>
      </div>
    </div>
  );
}

function parseManualCards(text: string): DraftCard[] {
  return text
    .split("\n")
    .map((line) => line.split(/[;；\t]/).map((part) => part.trim()))
    .filter((parts) => parts.length >= 3 && parts[0] && parts[2])
    .map(([jp = "", r = "", es = "", ej = "", ejes = ""]) => ({ jp, r, es, ej, ejes, t: "" }));
}

function Drafts({ drafts, onDone }: { drafts: DraftCard[]; onDone: () => void }) {
  const [skipped, setSkipped] = useState<Set<number>>(new Set());
  function add() {
    const added = addCards(drafts.filter((_, i) => !skipped.has(i)));
    toast(added ? `${added} tarjetas agregadas.` : "Esas tarjetas ya estaban en tu mazo.");
    onDone();
  }
  return (
    <div className="stack mt">
      <h3>Revisa antes de agregar</h3>
      {drafts.map((draft, i) => (
        <label key={`${draft.jp}-${i}`} className="citem">
          <input
            type="checkbox"
            checked={!skipped.has(i)}
            onChange={(e) => {
              const next = new Set(skipped);
              if (e.target.checked) next.delete(i);
              else next.add(i);
              setSkipped(next);
            }}
          />
          <span>
            <Jp className="jp">{draft.jp}</Jp> <Jp className="muted">{draft.r}</Jp> · {draft.es}
          </span>
          {draft.t ? <span className="tag">{draft.t}</span> : <span />}
        </label>
      ))}
      <div className="row">
        <button type="button" className="btn shu" onClick={add}>
          Agregar al mazo
        </button>
        <button type="button" className="btn ghost" onClick={onDone}>
          Descartar
        </button>
      </div>
    </div>
  );
}

function NotesToCards() {
  const { state } = useHub();
  const [notes, setNotes] = useState("");
  const [drafts, setDrafts] = useState<DraftCard[]>([]);
  const [status, setStatus] = useState("");

  function fromFormat() {
    const parsed = parseManualCards(notes);
    setDrafts(parsed);
    setStatus(parsed.length ? "" : "No hay líneas con el formato japonés ; lectura ; significado.");
  }

  return (
    <div className="panel stack">
      <p className="hint">
        Pega tus apuntes. Puedes escribir una tarjeta por línea con el formato{" "}
        <b>japonés ; lectura ; significado</b>, o pedirle a un asistente que las extraiga.
      </p>
      <label className="field">
        <span>Apuntes de la clase</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={"水 ; みず ; agua\n食べます ; たべます ; comer"}
        />
      </label>
      <div className="row">
        <button type="button" className="btn ghost" disabled={!notes.trim()} onClick={fromFormat}>
          Crear desde el formato
        </button>
        <span className="muted" role="status">
          {status}
        </span>
      </div>
      <AssistantBridge
        copyLabel="Copiar prompt para el asistente"
        emptyMessage="Pega primero tus apuntes."
        schema={draftCardsSchema}
        buildPrompt={() =>
          notes.trim()
            ? cardsPrompt(
                notes.trim().slice(0, MAX_NOTES_LENGTH),
                liveCards(state.cards)
                  .slice(-KNOWN_WORDS_IN_PROMPT)
                  .map((c) => c.jp),
              )
            : null
        }
        onResult={setDrafts}
      />
      {drafts.length > 0 && <Drafts drafts={drafts} onDone={() => setDrafts([])} />}
    </div>
  );
}

function AnkiExport() {
  const { state, today } = useHub();
  const [onlyNew, setOnlyNew] = useState(true);
  const [busy, setBusy] = useState(false);
  const all = liveCards(state.cards);
  const pending = all.filter((c) => !c.exported);
  const selected = onlyNew ? pending : all;

  async function push() {
    setBusy(true);
    try {
      const ids = await new AnkiConnectClient().pushCards(selected, state.settings.ankiDeck);
      markExported(ids);
      toast(`${ids.length} tarjetas enviadas a Anki.`);
    } catch (error) {
      toast(ankiErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (await copyText(ankiImportText(selected))) {
      markExported(selected.map((c) => c.id));
      toast(`${selected.length} tarjetas copiadas.`);
    } else {
      toast("No se pudo copiar. Usa la descarga.");
    }
  }

  function download() {
    downloadText(`anki-mainichi-${today}.txt`, ankiImportText(selected));
    markExported(selected.map((c) => c.id));
  }

  const empty = selected.length === 0;
  return (
    <div className="panel stack">
      <p className="hint">
        Con Anki abierto, las tarjetas llegan directo. Sin Anki, descarga el archivo y usa Archivo →
        Importar.
      </p>
      <div className="row">
        <button
          type="button"
          className="btn"
          disabled={empty || busy || isDemo}
          onClick={() => void push()}
        >
          Enviar a Anki
        </button>
        <button type="button" className="btn ghost" disabled={empty} onClick={download}>
          Descargar archivo
        </button>
        <button type="button" className="btn ghost" disabled={empty} onClick={() => void copy()}>
          Copiar como texto
        </button>
        <label className="row small">
          <input type="checkbox" checked={onlyNew} onChange={(e) => setOnlyNew(e.target.checked)} />
          Solo las nuevas
        </label>
      </div>
      <p className="muted num small">
        {all.length} tarjetas en total · {pending.length} sin exportar
      </p>
    </div>
  );
}

function Deck() {
  const { state } = useHub();
  const [search, setSearch] = useState("");
  const all = liveCards(state.cards);
  const query = search.trim().toLowerCase();
  const matches = all.filter(
    (c) => !query || [c.jp, c.reading, c.meaning].some((x) => x.toLowerCase().includes(query)),
  );
  return (
    <>
      <h2>
        Tu mazo <small>{all.length} tarjetas</small>
      </h2>
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar en el mazo…"
        aria-label="Buscar en el mazo"
      />
      <div className="cardlist mt">
        {matches.length === 0 && (
          <p className="muted">
            {all.length ? "Nada coincide con la búsqueda." : "Tu mazo está vacío."}
          </p>
        )}
        {[...matches].reverse().map((card) => (
          <div key={card.id} className="citem">
            <Jp className="jp">{card.jp}</Jp>
            <span>
              <Jp>{card.reading}</Jp> · {card.meaning}
              <br />
              <span className="muted small">
                {card.tag && <span className="tag">{card.tag}</span>} próximo repaso: {card.due}
              </span>
            </span>
            <button
              type="button"
              className="btn ghost small"
              aria-label={`Borrar ${card.jp}`}
              onClick={() => {
                deleteCard(card.id);
                toast(`«${card.jp}» borrada.`, {
                  label: "Deshacer",
                  run: () => restoreCard(card.id),
                });
              }}
            >
              Borrar
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

export default function CardsPage() {
  const { state, today } = useHub();
  return (
    <>
      <h2>
        Repaso de hoy <small>{cardsDue(state.cards, today).length} pendientes</small>
      </h2>
      <Review />
      <h2>De tus apuntes a tarjetas</h2>
      <NotesToCards />
      <h2>Llevar a Anki</h2>
      <AnkiExport />
      <Deck />
    </>
  );
}
