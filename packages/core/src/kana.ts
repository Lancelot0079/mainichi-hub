export type Script = "h" | "k";

export interface KanaItem {
  char: string;
  answers: string[];
  row: number;
}

/** First char + `reading|char:reading,alt|...`; alternatives accept other romanization systems. */
const ROWS: ReadonlyArray<readonly [string, string]> = [
  ["あ", "a|い:i|う:u|え:e|お:o"],
  ["か", "ka|き:ki|く:ku|け:ke|こ:ko"],
  ["さ", "sa|し:shi,si|す:su|せ:se|そ:so"],
  ["た", "ta|ち:chi,ti|つ:tsu,tu|て:te|と:to"],
  ["な", "na|に:ni|ぬ:nu|ね:ne|の:no"],
  ["は", "ha|ひ:hi|ふ:fu,hu|へ:he|ほ:ho"],
  ["ま", "ma|み:mi|む:mu|め:me|も:mo"],
  ["や", "ya|ゆ:yu|よ:yo"],
  ["ら", "ra|り:ri|る:ru|れ:re|ろ:ro"],
  ["わ", "wa|を:wo,o|ん:n,nn"],
  ["が", "ga|ぎ:gi|ぐ:gu|げ:ge|ご:go"],
  ["ざ", "za|じ:ji,zi|ず:zu|ぜ:ze|ぞ:zo"],
  ["だ", "da|ぢ:ji,di|づ:zu,du|で:de|ど:do"],
  ["ば", "ba|び:bi|ぶ:bu|べ:be|ぼ:bo"],
  ["ぱ", "pa|ぴ:pi|ぷ:pu|ぺ:pe|ぽ:po"],
  ["きゃ", "kya,kia|きゅ:kyu|きょ:kyo"],
  ["しゃ", "sha,sya|しゅ:shu,syu|しょ:sho,syo"],
  ["ちゃ", "cha,tya,cya|ちゅ:chu,tyu|ちょ:cho,tyo"],
  ["にゃ", "nya|にゅ:nyu|にょ:nyo"],
  ["ひゃ", "hya|ひゅ:hyu|ひょ:hyo"],
  ["みゃ", "mya|みゅ:myu|みょ:myo"],
  ["りゃ", "rya|りゅ:ryu|りょ:ryo"],
  ["ぎゃ", "gya|ぎゅ:gyu|ぎょ:gyo"],
  ["じゃ", "ja,jya,zya|じゅ:ju,jyu,zyu|じょ:jo,jyo,zyo"],
  ["びゃ", "bya|びゅ:byu|びょ:byo"],
  ["ぴゃ", "pya|ぴゅ:pyu|ぴょ:pyo"],
];

export const KANA_ROW_COUNT = ROWS.length;

const toKatakana = (s: string) =>
  s.replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));

function buildKana(): Record<Script, KanaItem[]> {
  const kana: Record<Script, KanaItem[]> = { h: [], k: [] };
  ROWS.forEach(([first, spec], row) => {
    const [firstReading = "", ...rest] = spec.split("|");
    const items = [[first, firstReading], ...rest.map((p) => p.split(":"))];
    for (const [char = "", reading = ""] of items) {
      const answers = reading.split(",");
      kana.h.push({ char, answers, row });
      kana.k.push({ char: toKatakana(char), answers, row });
    }
  });
  return kana;
}

export const KANA = buildKana();

export const isCorrectReading = (item: KanaItem, input: string) =>
  item.answers.includes(input.trim().toLowerCase().replace(/\s+/g, ""));
