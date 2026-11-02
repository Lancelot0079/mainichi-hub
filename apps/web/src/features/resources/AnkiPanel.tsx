import { liveCards } from "@mainichi/core";
import { AnkiConnectClient, AnkiUnavailableError } from "@mainichi/integrations";
import { useState } from "react";
import { markExported } from "../../state/actions";
import { getHub, isDemo, update, useHub } from "../../state/store";

export function ankiErrorMessage(error: unknown): string {
  return error instanceof AnkiUnavailableError
    ? `No se pudo conectar. Abre Anki y permite este origen en AnkiConnect: ${location.origin}`
    : "Anki respondió con un error. Inténtalo otra vez.";
}

export function AnkiPanel() {
  const { state } = useHub();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const pending = liveCards(state.cards).filter((c) => !c.exported);

  async function run(task: (client: AnkiConnectClient) => Promise<string>) {
    setBusy(true);
    setMessage("");
    try {
      setMessage(await task(new AnkiConnectClient()));
    } catch (error) {
      setMessage(ankiErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  const refresh = () =>
    run(async (client) => {
      const { today } = getHub();
      const stats = await client.readStats(
        state.settings.ankiDeck,
        today,
        new Date().toISOString(),
      );
      update((s) => {
        s.anki = stats;
      });
      return "Estadísticas actualizadas.";
    });

  const push = () =>
    run(async (client) => {
      const ids = await client.pushCards(pending, state.settings.ankiDeck);
      markExported(ids);
      return `${ids.length} tarjetas enviadas al mazo ${state.settings.ankiDeck}.`;
    });

  return (
    <div className="stack">
      <div className="row">
        <button
          type="button"
          className="btn ghost small"
          disabled={busy || isDemo}
          onClick={() => void refresh()}
        >
          Leer de Anki
        </button>
        <button
          type="button"
          className="btn ghost small"
          disabled={busy || isDemo || !pending.length}
          onClick={() => void push()}
        >
          Enviar {pending.length} tarjetas
        </button>
      </div>
      {message && (
        <div className="small" role="status">
          {message}
        </div>
      )}
    </div>
  );
}
