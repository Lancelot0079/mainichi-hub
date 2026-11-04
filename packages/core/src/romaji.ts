/**
 * Conversion between rōmaji and kana, used to check typed answers: a beginner may type either,
 * with or without macrons, so both sides are reduced to the same loose key before comparing.
 */

// prettier-ignore
const SYLLABLES: ReadonlyArray<readonly [string, string]> = [
  ["a", "あ"], ["i", "い"], ["u", "う"], ["e", "え"], ["o", "お"],
  ["ka", "か"], ["ki", "き"], ["ku", "く"], ["ke", "け"], ["ko", "こ"],
  ["sa", "さ"], ["shi", "し"], ["su", "す"], ["se", "せ"], ["so", "そ"],
  ["ta", "た"], ["chi", "ち"], ["tsu", "つ"], ["te", "て"], ["to", "と"],
  ["na", "な"], ["ni", "に"], ["nu", "ぬ"], ["ne", "ね"], ["no", "の"],
  ["ha", "は"], ["hi", "ひ"], ["fu", "ふ"], ["he", "へ"], ["ho", "ほ"],
  ["ma", "ま"], ["mi", "み"], ["mu", "む"], ["me", "め"], ["mo", "も"],
  ["ya", "や"], ["yu", "ゆ"], ["yo", "よ"],
  ["ra", "ら"], ["ri", "り"], ["ru", "る"], ["re", "れ"], ["ro", "ろ"],
  ["wa", "わ"], ["wo", "を"],
  ["ga", "が"], ["gi", "ぎ"], ["gu", "ぐ"], ["ge", "げ"], ["go", "ご"],
  ["za", "ざ"], ["ji", "じ"], ["zu", "ず"], ["ze", "ぜ"], ["zo", "ぞ"],
  ["da", "だ"], ["de", "で"], ["do", "ど"],
  ["ba", "ば"], ["bi", "び"], ["bu", "ぶ"], ["be", "べ"], ["bo", "ぼ"],
  ["pa", "ぱ"], ["pi", "ぴ"], ["pu", "ぷ"], ["pe", "ぺ"], ["po", "ぽ"],
  ["kya", "きゃ"], ["kyu", "きゅ"], ["kyo", "きょ"],
  ["sha", "しゃ"], ["shu", "しゅ"], ["sho", "しょ"], ["she", "しぇ"],
  ["cha", "ちゃ"], ["chu", "ちゅ"], ["cho", "ちょ"], ["che", "ちぇ"],
  ["nya", "にゃ"], ["nyu", "にゅ"], ["nyo", "にょ"], ["nye", "にぇ"],
  ["hya", "ひゃ"], ["hyu", "ひゅ"], ["hyo", "ひょ"],
  ["mya", "みゃ"], ["myu", "みゅ"], ["myo", "みょ"],
  ["rya", "りゃ"], ["ryu", "りゅ"], ["ryo", "りょ"],
  ["gya", "ぎゃ"], ["gyu", "ぎゅ"], ["gyo", "ぎょ"],
  ["ja", "じゃ"], ["ju", "じゅ"], ["jo", "じょ"], ["je", "じぇ"],
  ["bya", "びゃ"], ["byu", "びゅ"], ["byo", "びょ"],
  ["pya", "ぴゃ"], ["pyu", "ぴゅ"], ["pyo", "ぴょ"],
  ["fa", "ふぁ"], ["fi", "ふぃ"], ["fe", "ふぇ"], ["fo", "ふぉ"],
  ["di", "でぃ"], ["du", "どぅ"], ["wi", "うぃ"], ["we", "うぇ"],
  ["va", "ゔぁ"], ["vi", "ゔぃ"], ["vu", "ゔ"], ["ve", "ゔぇ"], ["vo", "ゔぉ"],
];

/** Spellings that are read but never written back, like Nihon-shiki and Spanish-style input. */
// prettier-ignore
const INPUT_ONLY: ReadonlyArray<readonly [string, string]> = [
  ["si", "し"], ["ti", "ち"], ["tu", "つ"], ["hu", "ふ"], ["zi", "じ"],
  ["sya", "しゃ"], ["syu", "しゅ"], ["syo", "しょ"],
  ["tya", "ちゃ"], ["tyu", "ちゅ"], ["tyo", "ちょ"],
  ["jya", "じゃ"], ["jyu", "じゅ"], ["jyo", "じょ"],
  ["zya", "じゃ"], ["zyu", "じゅ"], ["zyo", "じょ"],
  ["la", "ら"], ["li", "り"], ["lu", "る"], ["le", "れ"], ["lo", "ろ"],
  ["dzu", "づ"], ["ye", "いぇ"],
];

const TO_KANA = new Map([...INPUT_ONLY, ...SYLLABLES]);
const WRITTEN: ReadonlyArray<readonly [string, string]> = [
  ...SYLLABLES,
  ["ji", "ぢ"],
  ["zu", "づ"],
  ["n", "ん"],
];
const TO_ROMAJI = new Map(WRITTEN.map(([r, k]) => [k, r] as const));

// prettier-ignore
const MACRONS: Record<string, string> = {
  ā: "aa", ī: "ii", ū: "uu", ē: "ee", ō: "oo", â: "aa", î: "ii", û: "uu", ê: "ee", ô: "oo",
};

const isVowel = (c: string | undefined) => !!c && "aiueo".includes(c);

export const katakanaToHiragana = (text: string) =>
  text.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));

export const hiraganaToKatakana = (text: string) =>
  text.replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));

/** Converts the rōmaji in `text` to hiragana and leaves everything else as it is. */
export function romajiToHiragana(text: string): string {
  const input = text.toLowerCase().replace(/[āīūēōâîûêô]/g, (c) => MACRONS[c] ?? c);
  let out = "";
  let i = 0;
  while (i < input.length) {
    const c = input[i] ?? "";
    const next = input[i + 1];
    if (c === "n" && (next === "'" || next === "n")) {
      // "konnichiwa": the second n starts the next syllable, as people type it.
      const after = input[i + 2];
      out += "ん";
      i += next === "n" && (isVowel(after) || after === "y") ? 1 : 2;
      continue;
    }
    if (c === "n" && !isVowel(next) && next !== "y") {
      out += "ん";
      i += 1;
      continue;
    }
    if (c === "-") {
      out += "ー";
      i += 1;
      continue;
    }
    // A doubled consonant, and "tch" as in "matcha", is a small tsu.
    if (/[a-z]/.test(c) && !isVowel(c) && (next === c || (c === "t" && next === "c"))) {
      out += "っ";
      i += 1;
      continue;
    }
    let matched = false;
    for (const length of [3, 2, 1]) {
      const kana = TO_KANA.get(input.slice(i, i + length));
      if (kana) {
        out += kana;
        i += length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      out += c;
      i += 1;
    }
  }
  return out;
}

/** Hepburn rōmaji for kana; particles are spelled as written (は is "ha"). */
export function kanaToRomaji(text: string): string {
  const kana = katakanaToHiragana(text);
  let out = "";
  let double = false;
  for (let i = 0; i < kana.length; i++) {
    const c = kana[i] ?? "";
    if (c === "っ") {
      double = true;
      continue;
    }
    if (c === "ー") {
      out += out.at(-1) && isVowel(out.at(-1)) ? out.at(-1) : "";
      continue;
    }
    const pair = TO_ROMAJI.get(kana.slice(i, i + 2));
    const romaji = pair ?? TO_ROMAJI.get(c) ?? c;
    if (pair) i += 1;
    if (double) {
      out += romaji.startsWith("ch") ? "t" : romaji[0] && !isVowel(romaji[0]) ? romaji[0] : "";
      double = false;
    }
    out += romaji;
  }
  return out;
}

const VOWEL_KANA: Record<string, string> = { a: "あ", i: "い", u: "う", e: "え", o: "お" };

function vowelOf(kana: string): string | undefined {
  const romaji = TO_ROMAJI.get(kana) ?? TO_ROMAJI.get({ ゃ: "や", ゅ: "ゆ", ょ: "よ" }[kana] ?? "");
  return romaji?.at(-1);
}

/**
 * Reduces an answer to a comparable form: hiragana only, no spaces or punctuation, and long vowels
 * spelled one way (とうきょう, tōkyō and toukyou all become とおきょお).
 */
export function answerKey(text: string): string {
  const kana = katakanaToHiragana(romajiToHiragana(text.normalize("NFC").trim()))
    .replace(/[\s・、。，．,.!！?？~〜「」()（）'"]/g, "")
    .replace(/ぢ/g, "じ")
    .replace(/づ/g, "ず")
    .replace(/を/g, "お");
  let out = "";
  for (const c of kana) {
    const vowel = vowelOf(out.at(-1) ?? "");
    if (c === "ー" && vowel) out += VOWEL_KANA[vowel];
    else if (c === "う" && vowel === "o") out += "お";
    else if (c === "い" && vowel === "e") out += "え";
    else out += c;
  }
  return out;
}

export const matchesAnswer = (input: string, accepted: readonly string[]) => {
  const key = answerKey(input);
  return key.length > 0 && accepted.some((a) => answerKey(a) === key);
};
