/** Calendar helpers. Days are `YYYY-MM-DD` strings so they sort, compare and serialize safely. */

const pad = (n: number) => String(n).padStart(2, "0");

export const toYmd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function parseYmd(s: string): Date {
  const [y = 1970, m = 1, d = 1] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(day: string, n: number): string {
  const d = parseYmd(day);
  d.setDate(d.getDate() + n);
  return toYmd(d);
}

export const daysBetween = (from: string, to: string) =>
  Math.round((parseYmd(to).getTime() - parseYmd(from).getTime()) / 864e5);

export function mondayOf(day: string): string {
  const d = parseYmd(day);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return toYmd(d);
}

/** The calendar day at `instant` in an IANA time zone, regardless of where the code runs. */
export function dayInTimeZone(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

export function hourInTimeZone(instant: Date, timeZone: string): number {
  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    hour: "2-digit",
  }).format(instant);
  return Number(hour);
}

/** UTC instant at which `day` starts in `timeZone`. */
export function startOfDayUtc(day: string, timeZone: string): Date {
  const utcMidnight = new Date(`${day}T00:00:00Z`);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(utcMidnight);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const shownMinutes = get("hour") * 60 + get("minute");
  const sameDay = get("day") === utcMidnight.getUTCDate();
  const offsetMinutes = sameDay ? shownMinutes : shownMinutes - 24 * 60;
  return new Date(utcMidnight.getTime() - offsetMinutes * 60_000);
}

export const DOW_JP = "日月火水木金土";
export const DOW_ES = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"] as const;
export const MONTHS_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;
