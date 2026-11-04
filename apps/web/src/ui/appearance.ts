import { useSyncExternalStore } from "react";
import { cssVariables, paletteById } from "./palettes";

export type ThemeMode = "auto" | "light" | "dark";

export interface Appearance {
  palette: string;
  mode: ThemeMode;
}

/** A per-device preference, so it lives in local storage rather than in synced state. */
const STORAGE_KEY = "mainichi-hub-appearance";
const DEFAULT: Appearance = { palette: "washi", mode: "auto" };
const darkQuery = matchMedia("(prefers-color-scheme: dark)");
const listeners = new Set<() => void>();

function load(): Appearance {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT, ...(JSON.parse(raw) as Partial<Appearance>) } : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

let current = load();

/** Paints the chosen palette onto the root element; the stylesheets only read variables. */
function paint() {
  const root = document.documentElement;
  const dark = current.mode === "dark" || (current.mode === "auto" && darkQuery.matches);
  const palette = paletteById(current.palette);
  const tokens = dark ? palette.dark : palette.light;
  for (const [name, value] of Object.entries(cssVariables(tokens))) {
    root.style.setProperty(name, value);
  }
  root.style.colorScheme = dark ? "dark" : "light";
  if (current.mode === "auto") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", current.mode);
  root.dataset.palette = palette.id;
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((meta) => meta.setAttribute("content", tokens.paper));
}

export function setAppearance(patch: Partial<Appearance>) {
  current = { ...current, ...patch };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // The choice still applies for this visit.
  }
  paint();
  listeners.forEach((listener) => listener());
}

export function startAppearance() {
  paint();
  darkQuery.addEventListener("change", paint);
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useAppearance = () => useSyncExternalStore(subscribe, () => current);
