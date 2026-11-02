import { mergeStates } from "@mainichi/core";
import {
  GitHubFileStore,
  HttpError,
  pushState,
  readRemoteSnapshot,
  readRemoteState,
} from "@mainichi/integrations";
import {
  getHub,
  isDemo,
  replaceState,
  setSnapshot,
  setStatus,
  setUserChangeListener,
} from "./store";

const REPO_PATTERN = /^[\w.-]+\/[\w.-]+$/;
const CONNECTION_KEY = "mainichi-hub-connection";
const PUSH_DELAY_MS = 15_000;
const PULL_INTERVAL_MS = 5 * 60_000;

export interface Connection {
  repo: string;
  token: string;
}

export function loadConnection(): Connection | null {
  try {
    const raw = localStorage.getItem(CONNECTION_KEY);
    return raw ? (JSON.parse(raw) as Connection) : null;
  } catch {
    return null;
  }
}

function explain(error: unknown): string {
  if (error instanceof HttpError && (error.status === 401 || error.status === 403)) {
    return "El token no es válido o venció.";
  }
  if (error instanceof HttpError && error.status === 404) {
    return "No se encuentra el repositorio, o el token no tiene acceso a él.";
  }
  return "Sin conexión con GitHub; tus cambios quedan en este dispositivo.";
}

let timer: ReturnType<typeof setTimeout> | undefined;
let inFlight: Promise<void> | null = null;
let dirty = false;
let lastPull = 0;

/** Two-way sync. Edits made while the request runs are merged over its result, not lost. */
async function syncNow(): Promise<void> {
  const connection = loadConnection();
  if (!connection || isDemo) return;
  if (inFlight) return inFlight;
  const store = new GitHubFileStore(connection);
  setStatus({ kind: "syncing" });
  inFlight = (async () => {
    try {
      dirty = false;
      const sent = getHub().state;
      const merged = await pushState(store, sent, new Date().toISOString());
      const current = getHub().state;
      replaceState(current === sent ? merged : mergeStates(merged, current));
      setSnapshot(await readRemoteSnapshot(store));
      lastPull = Date.now();
      setStatus({ kind: "synced", at: new Date().toISOString() });
    } catch (error) {
      dirty = true;
      setStatus({ kind: "error", message: explain(error) });
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

function schedulePush() {
  dirty = true;
  clearTimeout(timer);
  timer = setTimeout(() => void syncNow(), PUSH_DELAY_MS);
}

export function startSync() {
  if (isDemo) return;
  setUserChangeListener(schedulePush);
  addEventListener("online", () => void syncNow());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && dirty) void syncNow();
    if (document.visibilityState === "visible" && Date.now() - lastPull > PULL_INTERVAL_MS) {
      void syncNow();
    }
  });
  void syncNow();
}

/** Verifies access before saving, so a typo cannot leave the hub silently disconnected. */
export async function connect(connection: Connection): Promise<string | null> {
  if (!REPO_PATTERN.test(connection.repo)) return "Usa el formato usuario/nombre.";
  try {
    await readRemoteState(new GitHubFileStore(connection));
  } catch (error) {
    return explain(error);
  }
  try {
    localStorage.setItem(CONNECTION_KEY, JSON.stringify(connection));
  } catch {
    return "Este navegador no permite guardar la conexión.";
  }
  await syncNow();
  return null;
}

export function disconnect() {
  try {
    localStorage.removeItem(CONNECTION_KEY);
  } catch {
    // Nothing stored, so there is nothing to remove.
  }
  setStatus({ kind: "local" });
}

export const syncRequested = () => void syncNow();
