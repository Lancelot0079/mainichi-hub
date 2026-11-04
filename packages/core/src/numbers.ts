/**
 * Readings of numbers, clock times and dates in hiragana, with the sound changes a beginner has
 * to learn (さんびゃく, ろっぷん, よっか…). Used to generate endless practice from a few rules.
 */

const DIGITS = ["", "いち", "に", "さん", "よん", "ご", "ろく", "なな", "はち", "きゅう"] as const;

const digit = (n: number) => DIGITS[n] ?? "";

const HUNDREDS: Record<number, string> = {
  1: "ひゃく",
  3: "さんびゃく",
  6: "ろっぴゃく",
  8: "はっぴゃく",
};
const THOUSANDS: Record<number, string> = { 1: "せん", 3: "さんぜん", 8: "はっせん" };

/** 1–9999. Before まん or おく, a bare 1000 is いっせん (いっせんまん = 10 000 000). */
function group(n: number, beforeUnit: boolean): string {
  const [th, hu, te, on] = [
    Math.floor(n / 1000),
    Math.floor(n / 100) % 10,
    Math.floor(n / 10) % 10,
    n % 10,
  ];
  let out = "";
  if (th) out += th === 1 && beforeUnit ? "いっせん" : (THOUSANDS[th] ?? digit(th) + "せん");
  if (hu) out += HUNDREDS[hu] ?? digit(hu) + "ひゃく";
  if (te) out += (te === 1 ? "" : digit(te)) + "じゅう";
  if (on) out += digit(on);
  return out;
}

/** 0 to 999 999 999 999. */
export function numberToKana(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n >= 1e12) throw new RangeError(`Fuera de rango: ${n}`);
  if (n === 0) return "ゼロ";
  const oku = Math.floor(n / 1e8);
  const man = Math.floor(n / 1e4) % 1e4;
  const rest = n % 1e4;
  return (
    (oku ? group(oku, true) + "おく" : "") +
    (man ? group(man, true) + "まん" : "") +
    (rest ? group(rest, false) : "")
  );
}

/** The other accepted readings, for typed answers: よん/し, なな/しち, きゅう/く, ゼロ/れい. */
export function numberAlternatives(n: number): string[] {
  if (n === 0) return ["ゼロ", "れい"];
  return { 4: ["よん", "し"], 7: ["なな", "しち"], 9: ["きゅう", "く"] }[n] ?? [numberToKana(n)];
}

const HOURS: Record<number, string> = { 4: "よじ", 7: "しちじ", 9: "くじ" };

export const hourToKana = (h: number) => HOURS[h] ?? numberToKana(h) + "じ";

const MINUTE_UNITS = [
  "",
  "いっぷん",
  "にふん",
  "さんぷん",
  "よんぷん",
  "ごふん",
  "ろっぷん",
  "ななふん",
  "はっぷん",
  "きゅうふん",
] as const;

/** 1–59. Tens alone take じゅっぷん; otherwise the unit decides between ふん and ぷん. */
export function minutesToKana(m: number): string {
  const tens = Math.floor(m / 10);
  const unit = m % 10;
  const prefix = tens > 1 ? digit(tens) : "";
  if (unit === 0) return prefix + "じゅっぷん";
  return (tens ? prefix + "じゅう" : "") + (MINUTE_UNITS[unit] ?? "");
}

/** Clock time, 1–12 h, as said with 時 and 分. */
export function timeToKana(h: number, m: number): string {
  return hourToKana(h) + (m ? minutesToKana(m) : "");
}

/** Also correct: はん for half past, and じっぷん, which many speakers still use. */
export function timeAlternatives(h: number, m: number): string[] {
  const out = [timeToKana(h, m)];
  if (m === 30) out.push(hourToKana(h) + "はん");
  if (m % 10 === 0 && m) out.push(out[0]?.replace(/じゅっぷん$/, "じっぷん") ?? "");
  return out;
}

const MONTHS: Record<number, string> = { 4: "しがつ", 7: "しちがつ", 9: "くがつ" };

export const monthToKana = (month: number) => MONTHS[month] ?? numberToKana(month) + "がつ";

const DAYS: Record<number, string> = {
  1: "ついたち",
  2: "ふつか",
  3: "みっか",
  4: "よっか",
  5: "いつか",
  6: "むいか",
  7: "なのか",
  8: "ようか",
  9: "ここのか",
  10: "とおか",
  14: "じゅうよっか",
  20: "はつか",
  24: "にじゅうよっか",
};

/** Day of the month; from 11 on it is the number plus にち, with しち and く for 7 and 9. */
export function dayToKana(day: number): string {
  const special = DAYS[day];
  if (special) return special;
  const unit = day % 10;
  const base = numberToKana(day - unit) + (unit === 7 ? "しち" : unit === 9 ? "く" : digit(unit));
  return base + "にち";
}

export const WEEKDAYS = [
  { jp: "日曜日", kana: "にちようび", es: "domingo" },
  { jp: "月曜日", kana: "げつようび", es: "lunes" },
  { jp: "火曜日", kana: "かようび", es: "martes" },
  { jp: "水曜日", kana: "すいようび", es: "miércoles" },
  { jp: "木曜日", kana: "もくようび", es: "jueves" },
  { jp: "金曜日", kana: "きんようび", es: "viernes" },
  { jp: "土曜日", kana: "どようび", es: "sábado" },
] as const;

export const MONTH_NAMES = [
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

/** Spanish digits with thousands separated by dots, as written in Colombia. */
export const formatNumberEs = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
