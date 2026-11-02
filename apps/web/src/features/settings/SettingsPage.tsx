import { importState, mergeStates, milestoneSchema, type Milestone } from "@mainichi/core";
import { useState } from "react";
import { z } from "zod";
import { setMilestones } from "../../state/actions";
import { getHub, isDemo, replaceState, useHub } from "../../state/store";
import { connect, disconnect, loadConnection, syncRequested } from "../../state/sync";
import { copyText, downloadText } from "../../ui/clipboard";
import { relativeTime } from "../../ui/primitives";
import { toast } from "../../ui/toast";
import { AppearancePanel } from "./AppearancePanel";

function Connection() {
  const { status } = useHub();
  const saved = loadConnection();
  const [repo, setRepo] = useState(saved?.repo ?? "");
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setMessage("");
    const error = await connect({ repo: repo.trim(), token: token.trim() });
    setBusy(false);
    setToken("");
    setMessage(error ?? "Conectado.");
  }

  if (saved) {
    return (
      <div className="panel stack">
        <p>
          Conectado a <b>{saved.repo}</b>.{" "}
          {status.kind === "error" && <span role="alert">{status.message}</span>}
          {status.kind === "synced" && (
            <span className="muted">Última sincronización {relativeTime(status.at)}.</span>
          )}
        </p>
        <div className="row">
          <button type="button" className="btn ghost" onClick={syncRequested}>
            Sincronizar ahora
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              disconnect();
              setMessage("");
            }}
          >
            Desconectar este dispositivo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="panel stack">
      <p className="hint">
        Tus datos viven en un repositorio privado tuyo. Usa un token de GitHub de grano fino,
        limitado a ese repositorio, con permiso de contenido. Queda guardado solo en este
        dispositivo. Los pasos están en docs/setup.md.
      </p>
      <label className="field">
        <span>Repositorio de datos (usuario/nombre)</span>
        <input
          type="text"
          value={repo}
          autoComplete="off"
          spellCheck={false}
          placeholder="tu-usuario/mainichi-data"
          onChange={(e) => setRepo(e.target.value)}
        />
      </label>
      <label className="field">
        <span>Token de GitHub</span>
        <input
          type="password"
          value={token}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => setToken(e.target.value)}
        />
      </label>
      <div className="row">
        <button
          type="button"
          className="btn"
          disabled={busy || isDemo || !repo.trim() || !token.trim()}
          onClick={() => void submit()}
        >
          Conectar
        </button>
        <span className="muted" role="status">
          {isDemo ? "No disponible en la demo." : message}
        </span>
      </div>
    </div>
  );
}

function ScheduledJob() {
  const { snapshot } = useHub();
  if (!snapshot.generatedAt) {
    return (
      <p className="muted">
        Todavía no hay datos del proceso programado. Aparecerán tras su primera ejecución.
      </p>
    );
  }
  return (
    <div className="panel">
      <p>Última actualización automática: {relativeTime(snapshot.generatedAt)}.</p>
      {snapshot.errors.map((error) => (
        <p key={error.source} role="alert">
          ⚠ {error.source}: {error.message}
        </p>
      ))}
    </div>
  );
}

function Milestones() {
  const { state } = useHub();
  const [date, setDate] = useState("");
  const [label, setLabel] = useState("");
  const milestones = state.settings.milestones;

  function add() {
    const milestone: Milestone = milestoneSchema.parse({
      id: crypto.randomUUID(),
      date,
      label: label.trim(),
      short: label.trim().slice(0, 28),
    });
    setMilestones([...milestones, milestone]);
    setDate("");
    setLabel("");
  }

  return (
    <div className="panel stack">
      {milestones.map((m) => (
        <div key={m.id} className="session">
          <span>
            <span className="num">{m.date}</span> · {m.label}
          </span>
          <button
            type="button"
            className="btn ghost small"
            aria-label={`Borrar ${m.label}`}
            onClick={() => setMilestones(milestones.filter((x) => x.id !== m.id))}
          >
            Borrar
          </button>
        </div>
      ))}
      <div className="grid g2">
        <label className="field">
          <span>Fecha</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="field">
          <span>Qué pasa ese día</span>
          <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} />
        </label>
      </div>
      <div>
        <button type="button" className="btn ghost" disabled={!date || !label.trim()} onClick={add}>
          Agregar fecha
        </button>
      </div>
    </div>
  );
}

function Backup() {
  const [text, setText] = useState("");
  const backup = () => JSON.stringify(getHub().state);

  function restore() {
    try {
      const imported = importState(z.unknown().parse(JSON.parse(text)), new Date().toISOString());
      replaceState(mergeStates(getHub().state, imported));
      syncRequested();
      setText("");
      toast("Respaldo combinado con tu progreso.");
    } catch {
      toast("Ese texto no es un respaldo válido. No se cambió nada.");
    }
  }

  return (
    <div className="panel stack">
      <p className="hint">
        Pega aquí un respaldo de esta página o de la versión anterior («Copiar respaldo»). Se
        combina con lo que ya tienes, así que no borra tu progreso.
      </p>
      <div className="row">
        <button
          type="button"
          className="btn ghost"
          onClick={() => downloadText("mainichi-respaldo.json", backup(), "application/json")}
        >
          Descargar respaldo
        </button>
        <button
          type="button"
          className="btn ghost"
          onClick={() =>
            void copyText(backup()).then((ok) =>
              toast(ok ? "Respaldo copiado." : "No se pudo copiar. Usa la descarga."),
            )
          }
        >
          Copiar respaldo
        </button>
      </div>
      <label className="field">
        <span>Texto del respaldo</span>
        <textarea value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      <div>
        <button type="button" className="btn" disabled={!text.trim() || isDemo} onClick={restore}>
          Restaurar
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <>
      <h2>Sincronización</h2>
      <Connection />
      <h2>Apariencia</h2>
      <AppearancePanel />
      <h2>Proceso automático y alertas</h2>
      <ScheduledJob />
      <h2>Tus fechas</h2>
      <Milestones />
      <h2>Respaldo</h2>
      <Backup />
    </>
  );
}
