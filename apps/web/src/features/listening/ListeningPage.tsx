import {
  addDays,
  blockMinutes,
  kindInfo,
  LEVEL_LABEL,
  LISTENING_CATALOG,
  LISTENING_KINDS,
  listeningLink,
  type ListeningItem,
  type ListeningKind,
  type ListeningLevel,
} from "@mainichi/core";
import { useEffect, useState } from "react";
import {
  addCards,
  addListeningItem,
  logListening,
  removeListeningItem,
  restoreListeningItem,
  updateListeningItem,
} from "../../state/actions";
import { useHub } from "../../state/store";
import { Jp } from "../../ui/primitives";
import { toast } from "../../ui/toast";

const pad = (n: number) => String(n).padStart(2, "0");

function useElapsed(startedAt: number | null) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (startedAt === null) return;
    const tick = () => setSeconds(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);
  return startedAt === null ? 0 : seconds;
}

function Capture({ item }: { item: ListeningItem }) {
  const [jp, setJp] = useState("");
  const [reading, setReading] = useState("");
  const [meaning, setMeaning] = useState("");

  function save() {
    const added = addCards([
      {
        jp: jp.trim(),
        r: reading.trim(),
        es: meaning.trim(),
        ej: "",
        ejes: `De: ${item.title}`,
        t: "escucha",
      },
    ]);
    toast(added ? "Tarjeta creada desde tu escucha." : "Esa tarjeta ya estaba en tu mazo.");
    setJp("");
    setReading("");
    setMeaning("");
  }

  return (
    <div className="stack">
      <h3>Atrapa lo que escuchaste</h3>
      <div className="grid g3">
        <label className="field">
          <span>Palabra o frase</span>
          <input
            type="text"
            lang="ja"
            value={jp}
            autoComplete="off"
            onChange={(e) => setJp(e.target.value)}
            placeholder="いただきます…"
          />
        </label>
        <label className="field">
          <span>Lectura</span>
          <input
            type="text"
            lang="ja"
            value={reading}
            autoComplete="off"
            onChange={(e) => setReading(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Significado</span>
          <input
            type="text"
            value={meaning}
            autoComplete="off"
            onChange={(e) => setMeaning(e.target.value)}
          />
        </label>
      </div>
      <div>
        <button
          type="button"
          className="btn ghost"
          disabled={!jp.trim() || !meaning.trim()}
          onClick={save}
        >
          Crear tarjeta
        </button>
      </div>
    </div>
  );
}

function Session({ item }: { item: ListeningItem | undefined }) {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [episode, setEpisode] = useState(true);
  const seconds = useElapsed(startedAt);

  if (!item) {
    return (
      <div className="panel">
        <p className="muted">
          Elige algo de tu biblioteca con <b>Practicar</b>, o agrega un recomendado más abajo.
        </p>
      </div>
    );
  }

  const info = kindInfo(item.kind);

  function finish(minutes: number) {
    if (!item) return;
    logListening(item, minutes, episode);
    setStartedAt(null);
    setChecked(new Set());
    toast(`${minutes} min de escucha registrados.`);
  }

  return (
    <div className="panel stack session-panel">
      <div className="row between">
        <div>
          <span className="tag">
            <Jp>{info.jp}</Jp> {info.label}
          </span>
          <h3 className="mt-s">{item.title}</h3>
        </div>
        <a
          className="btn small"
          href={listeningLink(item)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Abrir
        </a>
      </div>
      <ol className="method">
        {info.method.map((step, i) => (
          <li key={step}>
            <label>
              <input
                type="checkbox"
                checked={checked.has(i)}
                onChange={(e) => {
                  const next = new Set(checked);
                  if (e.target.checked) next.add(i);
                  else next.delete(i);
                  setChecked(next);
                }}
              />
              <span>{step}</span>
            </label>
          </li>
        ))}
      </ol>
      <div className="row">
        <span className="timer-inline num" role="timer">
          {pad(Math.floor(seconds / 60))}:{pad(seconds % 60)}
        </span>
        {startedAt === null ? (
          <button type="button" className="btn" onClick={() => setStartedAt(Date.now())}>
            Empezar sesión
          </button>
        ) : (
          <button
            type="button"
            className="btn shu"
            onClick={() => finish(Math.max(1, Math.round(seconds / 60)))}
          >
            Terminar y guardar
          </button>
        )}
        <span className="muted small">o registra sin cronómetro:</span>
        {[10, 20].map((minutes) => (
          <button
            key={minutes}
            type="button"
            className="btn ghost small"
            onClick={() => finish(minutes)}
          >
            +{minutes} min
          </button>
        ))}
      </div>
      <label className="row small">
        <input type="checkbox" checked={episode} onChange={(e) => setEpisode(e.target.checked)} />
        Terminé un episodio, capítulo o canción
      </label>
      <Capture item={item} />
    </div>
  );
}

function LibraryItem({ item, onPractice }: { item: ListeningItem; onPractice: () => void }) {
  const info = kindInfo(item.kind);
  return (
    <article className="panel resource">
      <div className="row between">
        <Jp className="glyph">{info.jp}</Jp>
        <span className="tag">
          {info.label} · {LEVEL_LABEL[item.level]}
        </span>
      </div>
      <h3>{item.title}</h3>
      <div className="small num">
        {item.done}
        {item.total > 0 && ` de ${item.total}`} {item.kind === "cancion" ? "escuchas" : "episodios"}
      </div>
      {item.total > 0 && (
        <div className="bar" aria-hidden="true">
          <i style={{ width: `${Math.min(100, (item.done / item.total) * 100)}%` }} />
        </div>
      )}
      <details>
        <summary>Editar</summary>
        <div className="stack mt">
          <label className="field">
            <span>Enlace</span>
            <input
              type="url"
              key={item.url}
              defaultValue={item.url}
              placeholder="https://…"
              onBlur={(e) => {
                const url = e.target.value.trim();
                if (url !== item.url) updateListeningItem(item.id, { url });
              }}
            />
          </label>
          <label className="field">
            <span>Total de episodios (0 si no aplica)</span>
            <input
              type="number"
              min="0"
              key={item.total}
              defaultValue={item.total}
              onBlur={(e) => {
                const total = Math.max(0, Number(e.target.value) || 0);
                if (total !== item.total) updateListeningItem(item.id, { total });
              }}
            />
          </label>
          <div>
            <button
              type="button"
              className="btn ghost small"
              onClick={() => {
                removeListeningItem(item.id);
                toast(`«${item.title}» quitado.`, {
                  label: "Deshacer",
                  run: () => restoreListeningItem(item.id),
                });
              }}
            >
              Quitar de la biblioteca
            </button>
          </div>
        </div>
      </details>
      <div className="row">
        <button type="button" className="btn small" onClick={onPractice}>
          Practicar
        </button>
        <a
          className="btn ghost small"
          href={listeningLink(item)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Abrir
        </a>
      </div>
    </article>
  );
}

function Catalog({ added }: { added: Set<string> }) {
  const [kind, setKind] = useState<ListeningKind | "all">("all");
  const visible = LISTENING_CATALOG.filter((c) => kind === "all" || c.kind === kind);
  const kinds = LISTENING_KINDS.filter((k) => LISTENING_CATALOG.some((c) => c.kind === k.id));
  return (
    <>
      <div className="filters" role="group" aria-label="Filtrar por tipo">
        <button type="button" aria-pressed={kind === "all"} onClick={() => setKind("all")}>
          Todos
        </button>
        {kinds.map((k) => (
          <button
            key={k.id}
            type="button"
            aria-pressed={kind === k.id}
            onClick={() => setKind(k.id)}
          >
            {k.label}
          </button>
        ))}
      </div>
      <div className="grid g2 mt">
        {visible.map((c) => (
          <article key={c.id} className="panel resource">
            <div className="row between">
              <Jp className="glyph">{kindInfo(c.kind).jp}</Jp>
              <span className="tag">
                {kindInfo(c.kind).label} · {LEVEL_LABEL[c.level]}
              </span>
            </div>
            <h3>{c.title}</h3>
            <p className="muted small">{c.why}</p>
            <div className="row">
              <button
                type="button"
                className="btn small"
                disabled={added.has(c.id)}
                onClick={() => {
                  addListeningItem({
                    title: c.title,
                    kind: c.kind,
                    level: c.level,
                    url: c.url ?? "",
                    total: 0,
                    catalogId: c.id,
                  });
                  toast(`«${c.title}» está en tu biblioteca.`);
                }}
              >
                {added.has(c.id) ? "En tu biblioteca" : "Agregar"}
              </button>
              <a
                className="btn ghost small"
                href={listeningLink(c)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {c.url ? "Abrir" : "Buscar"}
              </a>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function AddOwn() {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<ListeningKind>("podcast");
  const [level, setLevel] = useState<ListeningLevel>("basico");
  const [url, setUrl] = useState("");

  function add() {
    addListeningItem({ title: title.trim(), kind, level, url: url.trim(), total: 0 });
    toast(`«${title.trim()}» está en tu biblioteca.`);
    setTitle("");
    setUrl("");
  }

  return (
    <div className="panel stack">
      <div className="grid g2">
        <label className="field">
          <span>Título</span>
          <input
            type="text"
            value={title}
            autoComplete="off"
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tu anime, canción o podcast favorito…"
          />
        </label>
        <label className="field">
          <span>Enlace (opcional)</span>
          <input
            type="url"
            value={url}
            autoComplete="off"
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
          />
        </label>
        <label className="field">
          <span>Tipo</span>
          <select value={kind} onChange={(e) => setKind(e.target.value as ListeningKind)}>
            {LISTENING_KINDS.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Nivel</span>
          <select value={level} onChange={(e) => setLevel(e.target.value as ListeningLevel)}>
            {Object.entries(LEVEL_LABEL).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div>
        <button type="button" className="btn" disabled={!title.trim()} onClick={add}>
          Agregar a mi biblioteca
        </button>
      </div>
    </div>
  );
}

export default function ListeningPage() {
  const { state, today } = useHub();
  const items = state.listening.filter((i) => !i.deletedAt);
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = items.find((i) => i.id === activeId) ?? items[0];
  const added = new Set(items.map((i) => i.catalogId).filter((id): id is string => !!id));
  const weekMinutes = Array.from({ length: 7 }, (_, i) =>
    blockMinutes(state.progress.log[addDays(today, -i)], "lis"),
  ).reduce((sum, m) => sum + m, 0);

  return (
    <>
      <p className="hint">
        Escuchar todos los días entrena el oído, aunque no entiendas todo. Cada sesión cuenta para
        el bloque <b>Escuchar</b> de tu rutina. Últimos 7 días:{" "}
        <b className="num">{weekMinutes} min</b>.
      </p>
      <h2>Sesión de escucha</h2>
      <Session key={active?.id ?? "none"} item={active} />

      <h2>
        Mi biblioteca <small>{items.length} elementos</small>
      </h2>
      {items.length === 0 ? (
        <p className="muted">Todavía está vacía. Agrega algo de los recomendados.</p>
      ) : (
        <div className="grid g2">
          {items.map((item) => (
            <LibraryItem
              key={item.id}
              item={item}
              onPractice={() => {
                setActiveId(item.id);
                scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          ))}
        </div>
      )}

      <h2>Recomendados para empezar</h2>
      <p className="hint">
        Ordenados por nivel. Las canciones no traen letra aquí: búscala en un sitio con licencia.
      </p>
      <Catalog added={added} />

      <h2>Agregar lo tuyo</h2>
      <AddOwn />
    </>
  );
}
