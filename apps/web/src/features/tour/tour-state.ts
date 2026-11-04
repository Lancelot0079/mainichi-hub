import { useSyncExternalStore } from "react";

/** Whether the welcome tour was seen is a per-device fact, like the appearance. */
const STORAGE_KEY = "mainichi-hub-tour";
const listeners = new Set<() => void>();

function seen(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "seen";
  } catch {
    return false;
  }
}

let open = !seen();

function publish(value: boolean) {
  open = value;
  listeners.forEach((listener) => listener());
}

export function openTour() {
  publish(true);
}

export function closeTour() {
  try {
    localStorage.setItem(STORAGE_KEY, "seen");
  } catch {
    // It shows again on the next visit, which is harmless.
  }
  publish(false);
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useTourOpen = () => useSyncExternalStore(subscribe, () => open);
