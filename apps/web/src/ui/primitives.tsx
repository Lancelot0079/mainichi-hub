import type { ReactNode } from "react";

/** Marks Japanese text so screen readers and font fallback use the right language. */
export const Jp = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span lang="ja" translate="no" className={className}>
    {children}
  </span>
);

export function Hanko({
  state,
  small = false,
  pop = false,
}: {
  state: "full" | "part" | "empty";
  small?: boolean;
  pop?: boolean;
}) {
  const label = { full: "Día completo", part: "Día con práctica", empty: "Sin práctica" }[state];
  const classes = ["hanko", small && "sm", state !== "full" && state, pop && "pop"];
  return (
    <span className={classes.filter(Boolean).join(" ")} role="img" aria-label={label}>
      済
    </span>
  );
}

/** Only web links may reach an `href`, so a stored value can never run as `javascript:`. */
export function safeUrl(value: string, fallback: string): string {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : fallback;
  } catch {
    return fallback;
  }
}

export const hoursSince = (iso: string) => (Date.now() - new Date(iso).getTime()) / 3_600_000;

export function relativeTime(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "hace un momento";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `hace ${hours} h`;
  return `hace ${Math.round(hours / 24)} días`;
}
