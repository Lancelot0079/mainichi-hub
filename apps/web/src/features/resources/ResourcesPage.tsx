import {
  liveSessions,
  RESOURCES,
  resourceById,
  type HubState,
  type IntegrationMode,
  type Resource,
  type Snapshot,
} from "@mainichi/core";
import { useState } from "react";
import { logSession, removeSession, setResourceProgress } from "../../state/actions";
import { useHub } from "../../state/store";
import { Jp, relativeTime, safeUrl } from "../../ui/primitives";
import { toast } from "../../ui/toast";
import { AnkiPanel } from "./AnkiPanel";

const MODE_LABEL: Record<IntegrationMode, [string, string]> = {
  api: ["api", "Automático"],
  local: ["local", "Con Anki abierto"],
  manual: ["", "Registro manual"],
};

const QUICK_MINUTES = [10, 20, 30];

function statusLine(resource: Resource, state: HubState, snapshot: Snapshot): string | null {
  if (resource.id === "wanikani") {
    const data = snapshot.wanikani;
    if (!data) return "Sin datos todavía. Se llena con la sincronización programada.";
    return `Nivel ${data.level} · ${data.reviewsAvailable} repasos · ${data.lessonsAvailable} lecciones`;
  }
  if (resource.id === "anki" && state.anki) {
    const due = state.anki.dueNew + state.anki.dueLearn + state.anki.dueReview;
    return `${due} pendientes de ${state.anki.total} · ${relativeTime(state.anki.syncedAt)}`;
  }
  return null;
}

function Progress({ resource }: { resource: Resource }) {
  const { state } = useHub();
  const track = state.resources[resource.id];
  const done = track?.done ?? 0;
  const total = track?.total || resource.defaultTotal || 0;
  return (
    <div className="stack">
      {total > 0 && (
        <div className="bar" aria-hidden="true">
          <i style={{ width: `${Math.min(100, (done / total) * 100)}%` }} />
        </div>
      )}
      <div className="stepper small">
        <button
          type="button"
          className="btn ghost small"
          aria-label={`Restar 1 en ${resource.name}`}
          disabled={done === 0}
          onClick={() => setResourceProgress(resource.id, { done: done - 1 })}
        >
          −
        </button>
        <span className="num">
          {done}
          {total > 0 && ` de ${total}`} {resource.unit}
        </span>
        <button
          type="button"
          className="btn ghost small"
          aria-label={`Sumar 1 en ${resource.name}`}
          onClick={() => setResourceProgress(resource.id, { done: done + 1 })}
        >
          +
        </button>
      </div>
    </div>
  );
}

function Configure({ resource }: { resource: Resource }) {
  const { state } = useHub();
  const track = state.resources[resource.id];
  return (
    <details>
      <summary>Configurar</summary>
      <div className="stack mt">
        <label className="field">
          <span>Enlace directo</span>
          <input
            type="url"
            key={track?.url ?? ""}
            defaultValue={track?.url ?? ""}
            placeholder={resource.url}
            onBlur={(e) => {
              const url = e.target.value.trim();
              if (url === (track?.url ?? "")) return;
              if (url && safeUrl(url, "") === "") {
                toast("Ese enlace no es válido.");
                return;
              }
              setResourceProgress(resource.id, { url });
            }}
          />
        </label>
        {resource.unit && (
          <label className="field">
            <span>Total de {resource.unit}</span>
            <input
              type="number"
              min="0"
              key={track?.total ?? 0}
              defaultValue={track?.total || resource.defaultTotal || ""}
              onBlur={(e) => {
                const total = Math.max(0, Number(e.target.value) || 0);
                if (total !== (track?.total ?? 0)) setResourceProgress(resource.id, { total });
              }}
            />
          </label>
        )}
      </div>
    </details>
  );
}

function ResourceCard({ resource }: { resource: Resource }) {
  const { state, snapshot } = useHub();
  const [tagClass, tagText] = MODE_LABEL[resource.mode];
  const status = statusLine(resource, state, snapshot);
  const href = safeUrl(state.resources[resource.id]?.url ?? "", resource.url);

  function log(minutes: number) {
    logSession(resource.id, minutes, "");
    toast(`${resource.name}: +${minutes} min`);
  }

  return (
    <article className="panel resource">
      <div className="row between">
        <Jp className="glyph">{resource.jp}</Jp>
        <span className={`tag ${tagClass}`}>{tagText}</span>
      </div>
      <h3>{resource.name}</h3>
      <div className="muted small">{resource.description}</div>
      {status && <div className="small">{status}</div>}
      {resource.unit && <Progress resource={resource} />}
      {resource.id === "anki" && <AnkiPanel />}
      <Configure resource={resource} />
      <div className="row">
        <a
          className="btn small"
          href={href}
          {...(href.startsWith("#") ? {} : { target: "_blank", rel: "noopener noreferrer" })}
        >
          Abrir
        </a>
        <span className="row" role="group" aria-label={`Registrar tiempo en ${resource.name}`}>
          {QUICK_MINUTES.map((minutes) => (
            <button
              key={minutes}
              type="button"
              className="btn ghost small"
              aria-label={`Registrar ${minutes} minutos en ${resource.name}`}
              onClick={() => log(minutes)}
            >
              +{minutes}
            </button>
          ))}
        </span>
      </div>
    </article>
  );
}

function TodaySessions() {
  const { state, today } = useHub();
  const sessions = liveSessions(state.progress.log[today]);
  if (!sessions.length) {
    return <p className="muted">Todavía no registras sesiones hoy.</p>;
  }
  return (
    <div className="panel">
      {sessions.map((session) => (
        <div key={session.id} className="session">
          <span>
            {resourceById(session.resourceId)?.name ?? session.resourceId} ·{" "}
            <span className="num">{session.minutes} min</span>
          </span>
          <button
            type="button"
            className="btn ghost small"
            onClick={() => removeSession(today, session.id)}
          >
            Deshacer
          </button>
        </div>
      ))}
    </div>
  );
}

export default function ResourcesPage() {
  const [filter, setFilter] = useState<IntegrationMode | "all">("all");
  const filters = [
    ["all", "Todos"],
    ["api", "Automáticos"],
    ["local", "Locales"],
    ["manual", "Manuales"],
  ] as const;
  const visible = RESOURCES.filter((r) => filter === "all" || r.mode === filter);

  return (
    <>
      <h2>Tus plataformas</h2>
      <div className="row between">
        <p className="hint">
          Todas tus plataformas en un lugar. Las automáticas se actualizan solas; en las demás
          registras el tiempo con un clic y cuenta para tu rutina. <a href="#ajustes">Conexiones</a>
        </p>
        <div className="seg" role="group" aria-label="Filtrar recursos">
          {filters.map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid g2 mt">
        {visible.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} />
        ))}
      </div>
      <h2>Sesiones de hoy</h2>
      <TodaySessions />
    </>
  );
}
