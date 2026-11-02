import {
  demoSnapshot,
  demoState,
  emptySnapshot,
  emptyState,
  hubStateSchema,
  toYmd,
  type HubState,
  type Snapshot,
} from "@mainichi/core";
import { useSyncExternalStore } from "react";

const STORAGE_KEY = "mainichi-hub-state-v2";
const UNREADABLE_KEY = `${STORAGE_KEY}-unreadable`;

export const isDemo = new URLSearchParams(location.search).has("demo");

export type SyncStatus =
  | { kind: "local" }
  | { kind: "demo" }
  | { kind: "syncing" }
  | { kind: "synced"; at: string }
  | { kind: "error"; message: string };

export interface Hub {
  state: HubState;
  snapshot: Snapshot;
  status: SyncStatus;
  today: string;
}

const currentDay = () => toYmd(new Date());

function loadLocal(): HubState {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
    return raw ? hubStateSchema.parse(JSON.parse(raw)) : emptyState();
  } catch {
    // The app starts empty, so keep a copy before the next save replaces the original.
    try {
      if (raw) localStorage.setItem(UNREADABLE_KEY, raw);
    } catch {
      // Storage is unavailable, so nothing can be overwritten either.
    }
    return emptyState();
  }
}

function persist(state: HubState) {
  if (isDemo) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be blocked or full; the session still works in memory.
  }
}

let hub: Hub = {
  state: isDemo ? demoState(currentDay()) : loadLocal(),
  snapshot: isDemo ? demoSnapshot(currentDay()) : emptySnapshot(),
  status: isDemo ? { kind: "demo" } : { kind: "local" },
  today: currentDay(),
};

const listeners = new Set<() => void>();
let onUserChange: (() => void) | null = null;

export const getHub = () => hub;

function publish(patch: Partial<Hub>) {
  hub = { ...hub, ...patch };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const useHub = () => useSyncExternalStore(subscribe, getHub);

/** Every user edit goes through here, which stamps, persists and queues it for sync. */
export function update(recipe: (draft: HubState) => void) {
  const draft = structuredClone(hub.state);
  recipe(draft);
  draft.updatedAt = new Date().toISOString();
  publish({ state: draft });
  persist(draft);
  onUserChange?.();
}

/** Applies state that came from sync, without counting as a new user edit. */
export function replaceState(state: HubState) {
  publish({ state });
  persist(state);
}

export const setSnapshot = (snapshot: Snapshot) => publish({ snapshot });
export const setStatus = (status: SyncStatus) => publish({ status });
export const setUserChangeListener = (listener: () => void) => {
  onUserChange = listener;
};

// The day rolls over at midnight even if the tab stays open.
setInterval(() => {
  if (currentDay() !== hub.today) publish({ today: currentDay() });
}, 60_000);
