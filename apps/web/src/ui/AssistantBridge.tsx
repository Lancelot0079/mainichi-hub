import { extractJson } from "@mainichi/core";
import { useState } from "react";
import type { z } from "zod";
import { copyText } from "./clipboard";

interface Props<T> {
  buildPrompt: () => string | null;
  schema: z.ZodType<T>;
  onResult: (value: T) => void;
  copyLabel: string;
  emptyMessage: string;
}

/**
 * Round trip to any assistant without API keys: copy a prompt, paste the reply. The reply is
 * untrusted text, so it must pass the schema before it can touch any state.
 */
export function AssistantBridge<T>({
  buildPrompt,
  schema,
  onResult,
  copyLabel,
  emptyMessage,
}: Props<T>) {
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState("");

  async function copyPrompt() {
    const prompt = buildPrompt();
    if (!prompt) {
      setStatus(emptyMessage);
      return;
    }
    const copied = await copyText(prompt);
    setStatus(
      copied
        ? "Copiado. Pégalo en Claude y trae aquí su respuesta."
        : "No se pudo copiar. Revisa los permisos del navegador.",
    );
  }

  function applyReply() {
    try {
      onResult(schema.parse(extractJson(reply)));
      setReply("");
      setStatus("");
    } catch {
      setStatus(
        "La respuesta no tiene el formato esperado. Pega solo el JSON e inténtalo otra vez.",
      );
    }
  }

  return (
    <div className="stack">
      <div className="row">
        <button type="button" className="btn" onClick={() => void copyPrompt()}>
          {copyLabel}
        </button>
      </div>
      <label className="field">
        <span>Respuesta del asistente</span>
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Pega aquí el JSON que te devolvió…"
        />
      </label>
      <div className="row">
        <button type="button" className="btn ghost" disabled={!reply.trim()} onClick={applyReply}>
          Usar la respuesta
        </button>
        <span className="muted" role="status">
          {status}
        </span>
      </div>
    </div>
  );
}
