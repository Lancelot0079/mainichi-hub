import { ADJECTIVES, VERBS } from "./conjugation";
import type { Script } from "./kana";
import { kanaItems, rowTable } from "./lesson-content";
import type { CourseUnit, Lesson, LessonItem } from "./lessons";
import { KANA_MNEMONICS } from "./mnemonics";

/**
 * The kana course: the writing system from zero, then the particles and conjugations that are
 * written in kana. Every new kana is introduced with a picture to remember it by, a few at a
 * time, and comes back until it can be drawn from memory. Written for this project.
 */

export const KANA_UNITS: readonly CourseUnit[] = [
  { id: "kana-sistema", jp: "仕組み", title: "Cómo funciona el kana" },
  { id: "kana-hiragana", jp: "ひらがな", title: "Hiragana, fila por fila" },
  { id: "kana-sonidos", jp: "濁音", title: "Tenten, combinados y sonidos largos" },
  { id: "kata-filas", jp: "カタカナ", title: "Katakana, fila por fila" },
  { id: "kata-sonidos", jp: "ガ", title: "Tenten, combinados y palabras en katakana" },
  { id: "kana-particulas", jp: "助詞", title: "Partículas" },
  { id: "kana-verbos", jp: "動詞", title: "Conjugación de verbos" },
  { id: "kana-adjetivos", jp: "形容詞", title: "Adjetivos" },
];

/** Kana of some rows, each with its memory hook. */
const glyphs = (script: Script, rows: readonly number[]): LessonItem[] =>
  kanaItems(script, rows).map((item) => ({ ...item, mnemonic: KANA_MNEMONICS[item.jp] }));

const word = (jp: string, es: string, extra: Partial<LessonItem> = {}): LessonItem => ({
  jp,
  es,
  ...extra,
});

const verbItems = (dicts: readonly string[]): LessonItem[] =>
  VERBS.filter((v) => dicts.includes(v.dict)).map((v) => word(v.dict, v.es));

const adjectiveItems = (kind: "i" | "na"): LessonItem[] =>
  ADJECTIVES.filter((a) => a.kind === kind).map((a) => word(a.base, a.es));

const METHOD = {
  title: "Cómo se memoriza aquí",
  body: [
    "1. Aprende: cada kana nuevo aparece en una tarjeta con su lectura, su sonido y una imagen para recordarlo. Dilo en voz alta.",
    "2. Recuerda: enseguida tienes que reconocerlo sin ayuda. Recordar cuesta, y ese esfuerzo es lo que lo fija.",
    "3. Repite: vuelve al final de la sesión y en los días siguientes, cada vez más espaciado. Lo que fallas vuelve antes.",
    "4. Produce: cuando ya lo reconoces, tienes que escribir su lectura y al final dibujarlo de memoria.",
    "Cada sesión trae como máximo cinco kana nuevos. Es mejor poco y todos los días que mucho de una vez.",
  ],
};

const STROKES = {
  title: "Reglas del trazo",
  body: [
    "De arriba hacia abajo y de izquierda a derecha.",
    "Las líneas horizontales van antes que las verticales que las cruzan.",
    "Escribe cada kana del mismo tamaño, como si ocupara un cuadrito del cuaderno.",
  ],
};

const hiraganaRow = (
  id: string,
  rows: readonly number[],
  jp: string,
  title: string,
  tips: readonly string[],
  examples: Lesson["notes"][number]["examples"] = [],
): Lesson => ({
  id,
  unit: "kana-hiragana",
  jp,
  title,
  summary: `${glyphs("h", rows)
    .map((i) => i.jp)
    .join(" ")}: sus formas, sus sonidos y cómo no confundirlos.`,
  script: "h",
  learnFirst: true,
  notes: [{ title: "La fila", body: tips, table: rowTable("h", rows), examples }, STROKES],
  items: glyphs("h", rows),
});

const katakanaRow = (
  id: string,
  rows: readonly number[],
  title: string,
  tips: readonly string[],
): Lesson => ({
  id,
  unit: "kata-filas",
  jp: glyphs("k", rows)[0]?.jp ?? "ア",
  title,
  summary: `${glyphs("k", rows)
    .map((i) => i.jp)
    .join(" ")}: los mismos sonidos que en hiragana, con trazos rectos.`,
  script: "k",
  learnFirst: true,
  notes: [{ title: "Las filas", body: tips, table: rowTable("k", rows) }],
  items: glyphs("k", rows),
});

const particleLesson = (
  id: string,
  jp: string,
  title: string,
  focus: readonly string[],
  notes: Lesson["notes"],
  items: readonly LessonItem[],
  questions: Lesson["questions"] = [],
): Lesson => ({
  id,
  unit: "kana-particulas",
  jp,
  title,
  summary: `Las partículas ${focus.join(", ")}: qué marcan y dónde van.`,
  generator: "particles",
  focus,
  generatedCount: 7,
  notes,
  items,
  questions,
});

const verbLesson = (
  id: string,
  jp: string,
  title: string,
  summary: string,
  focus: readonly string[],
  notes: Lesson["notes"],
  verbs: readonly string[],
): Lesson => ({
  id,
  unit: "kana-verbos",
  jp,
  title,
  summary,
  generator: "verbs",
  focus,
  generatedCount: 8,
  notes,
  items: verbItems(verbs),
});

export const KANA_COURSE: readonly Lesson[] = [
  // ── El sistema ──────────────────────────────────────────────────────────────────────────
  {
    id: "kd-sistema",
    unit: "kana-sistema",
    jp: "仮名",
    title: "Sílabas, no letras",
    summary: "Cómo está armado el kana y las cinco vocales, que son la base de todo.",
    script: "h",
    learnFirst: true,
    notes: [
      {
        title: "Cada kana es una sílaba",
        body: [
          "En español escribimos letras sueltas; en japonés cada carácter es una sílaba entera: か es «ka», no «k».",
          "Casi todas las sílabas son una vocal sola o una consonante más una vocal. La única consonante que va sola es ん.",
          "Hay dos silabarios con los mismos sonidos: el hiragana, de trazos curvos, y el katakana, de trazos rectos.",
        ],
      },
      {
        title: "Las cinco vocales",
        body: [
          "Suenan igual que en español: a, i, u, e, o. Son cortas y limpias.",
          "La u se pronuncia con los labios relajados, sin redondearlos tanto como en español.",
          "Se ordenan a, i, u, e, o. Ese orden se repite en todas las filas de la tabla.",
        ],
        table: rowTable("h", [0]),
      },
      {
        title: "La tabla de cincuenta sonidos",
        body: [
          "Las filas son las consonantes (k, s, t, n, h, m, y, r, w) y las columnas las vocales. か き く け こ es la fila k.",
          "Por eso basta aprender una fila a la vez: cambias la consonante y las vocales siguen en el mismo orden.",
        ],
        table: rowTable("h", [1, 2]),
      },
      METHOD,
    ],
    items: glyphs("h", [0]),
    questions: [
      {
        kind: "choice",
        prompt: "¿Qué representa un kana?",
        options: ["Una sílaba", "Una letra", "Una palabra", "Una idea"],
        answer: 0,
        explanation: "Cada kana es una sílaba: か = ka.",
      },
      {
        kind: "choice",
        prompt: "¿Cuál es la única consonante que se escribe sola?",
        options: ["ん (n)", "く (k)", "す (s)", "つ (ts)"],
        answer: 0,
        explanation: "ん es la única que no lleva vocal.",
      },
      {
        kind: "choice",
        prompt: "¿En qué orden van las vocales en la tabla?",
        options: ["a, i, u, e, o", "a, e, i, o, u", "a, o, u, e, i", "i, a, u, o, e"],
        answer: 0,
        explanation: "あ い う え お: a, i, u, e, o.",
      },
      {
        kind: "choice",
        prompt: "¿Qué diferencia al hiragana del katakana?",
        options: [
          "Los mismos sonidos; el katakana tiene trazos rectos y se usa para palabras extranjeras",
          "El katakana tiene más sonidos",
          "El hiragana solo se usa en nombres",
          "El katakana se lee de derecha a izquierda",
        ],
        answer: 0,
        explanation: "Suenan igual; cambian la forma y el uso.",
      },
    ],
  },

  // ── Hiragana ────────────────────────────────────────────────────────────────────────────
  hiraganaRow(
    "kd-h-k",
    [1],
    "か",
    "Fila k: か き く け こ",
    [
      "Consonante k más cada vocal. Suena como en «casa», «kilo», «cuna», «queso», «cosa».",
      "き tiene dos rayas horizontales; さ, que viene en la siguiente fila, solo una.",
    ],
    [
      { jp: "かお", es: "cara" },
      { jp: "こえ", es: "voz" },
    ],
  ),
  hiraganaRow(
    "kd-h-s",
    [2],
    "さ",
    "Fila s: さ し す せ そ",
    [
      "Fila s, con una excepción: し se dice «shi», no «si».",
      "し es un solo trazo, como un anzuelo. No lo confundas con つ, que es horizontal.",
    ],
    [
      { jp: "すし", es: "sushi" },
      { jp: "あさ", es: "mañana (temprano)" },
    ],
  ),
  hiraganaRow(
    "kd-h-t",
    [3],
    "た",
    "Fila t: た ち つ て と",
    [
      "Dos excepciones: ち se dice «chi» y つ se dice «tsu».",
      "つ es una ola horizontal; し, un anzuelo vertical.",
    ],
    [
      { jp: "くつ", es: "zapatos" },
      { jp: "ちかてつ", es: "metro" },
    ],
  ),
  hiraganaRow(
    "kd-h-n",
    [4],
    "な",
    "Fila n: な に ぬ ね の",
    [
      "Suena como en español: na, ni, nu, ne, no.",
      "ぬ y め se parecen mucho: ぬ termina en un rulito; め, no.",
    ],
    [
      { jp: "ねこ", es: "gato" },
      { jp: "いぬ", es: "perro" },
    ],
  ),
  hiraganaRow(
    "kd-h-h",
    [5],
    "は",
    "Fila h: は ひ ふ へ ほ",
    [
      "La h japonesa es aspirada, como una j suave: は suena entre «ja» y «ha».",
      "ふ está entre «fu» y «ju»: soplas sin juntar los labios con los dientes.",
      "Como partícula, は se dice «wa» y へ se dice «e». Lo verás en la unidad de partículas.",
    ],
    [
      { jp: "はな", es: "flor, nariz" },
      { jp: "ふね", es: "barco" },
    ],
  ),
  hiraganaRow(
    "kd-h-m",
    [6],
    "ま",
    "Fila m: ま み む め も",
    ["Como en español: ma, mi, mu, me, mo.", "Repasa la pareja ぬ / め: la de rulito es ぬ."],
    [
      { jp: "あめ", es: "lluvia" },
      { jp: "もも", es: "durazno" },
    ],
  ),
  hiraganaRow(
    "kd-h-yrw",
    [7, 8, 9],
    "や",
    "Filas y, r, w y la ん",
    [
      "La fila y solo tiene ya, yu, yo; la w, wa y wo. Los huecos de la tabla son sonidos que el japonés ya no usa.",
      "La r japonesa es suave y corta, como la de «pero», nunca como la de «perro».",
      "を se dice «o» y solo sirve como partícula. ん cierra sílabas: ほん es «hon», libro.",
    ],
    [
      { jp: "さくら", es: "cerezo" },
      { jp: "ほん", es: "libro" },
    ],
  ),
  {
    id: "kd-h-todo",
    unit: "kana-hiragana",
    jp: "全",
    title: "Las 46 mezcladas",
    summary: "Todas las filas mezcladas, para comprobar que las reconoces fuera de orden.",
    script: "h",
    notes: [
      {
        title: "Mezclar para fijar",
        body: [
          "En orden es fácil: sabes que después de か viene き. Mezcladas tienes que reconocer cada una por su forma.",
          "Cada sesión elige las que más te cuestan. Repítela hasta que las 46 te salgan sin pensar.",
        ],
        table: rowTable("h", [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
      },
    ],
    items: glyphs("h", [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
  },

  // ── Sonidos ─────────────────────────────────────────────────────────────────────────────
  {
    id: "kd-dakuten",
    unit: "kana-sonidos",
    jp: "゛",
    title: "Tenten y maru: が, ざ, だ, ば, ぱ",
    summary: "Dos marquitas que cambian el sonido sin cambiar la forma.",
    script: "h",
    learnFirst: true,
    notes: [
      {
        title: "Dos comillas: el tenten",
        body: [
          "Las comillas ゛ hacen sonora la consonante: か → が (ga), さ → ざ (za), た → だ (da), は → ば (ba).",
          "じ y ぢ suenan igual («ji»), y ず y づ también («zu»). Casi siempre se escriben じ y ず.",
        ],
        table: rowTable("h", [10, 11, 12, 13]),
      },
      {
        title: "Un circulito: el maru",
        body: ["El circulito ゜ solo va en la fila h y la vuelve p: は → ぱ (pa), ひ → ぴ (pi)."],
        table: rowTable("h", [14]),
        examples: [
          { jp: "ごはん", es: "arroz, comida" },
          { jp: "かぞく", es: "familia" },
          { jp: "てんぷら", es: "tempura" },
        ],
      },
    ],
    items: glyphs("h", [10, 11, 12, 13, 14]),
  },
  {
    id: "kd-yoon",
    unit: "kana-sonidos",
    jp: "きゃ",
    title: "Combinados: きゃ, しゅ, ちょ",
    summary: "Un kana de la columna i más un ゃ, ゅ o ょ pequeño forman una sola sílaba.",
    script: "h",
    learnFirst: true,
    notes: [
      {
        title: "Una sílaba, dos caracteres",
        body: [
          "き + ゃ pequeña = きゃ (kya), una sola sílaba. Si la や fuera grande, serían dos: きや (ki-ya).",
          "Se combinan con ゃ, ゅ, ょ los kana de la columna i: き, し, ち, に, ひ, み, り, ぎ, じ, び, ぴ.",
          "しゃ es «sha», ちゃ es «cha» y じゃ es «ja» suave, como en inglés «jam».",
        ],
        examples: [
          { jp: "おちゃ", es: "té" },
          { jp: "きょう", es: "hoy" },
          { jp: "でんしゃ", es: "tren" },
        ],
      },
    ],
    items: glyphs("h", [15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]),
  },
  {
    id: "kd-largas",
    unit: "kana-sonidos",
    jp: "っ",
    title: "La pausa っ y las vocales largas",
    summary:
      "Dos detalles que cambian el significado: una っ pequeña y una vocal que dura el doble.",
    notes: [
      {
        title: "La っ pequeña: una pausa",
        body: [
          "Una っ pequeña no se pronuncia: es un silencio corto antes de la siguiente consonante, que suena doble.",
          "きて (ven) y きって (estampilla) son palabras distintas. En rōmaji se dobla la consonante: kitte.",
        ],
        examples: [
          { jp: "きって", es: "estampilla" },
          { jp: "がっこう", es: "escuela" },
        ],
      },
      {
        title: "Vocales largas",
        body: [
          "Una vocal larga dura el doble. En hiragana se escribe añadiendo una vocal: おかあさん, おにいさん.",
          "El sonido «o» largo casi siempre se escribe con う (とうきょう) y la «e» larga con い (せんせい).",
          "おばさん es tía; おばあさん es abuela. La duración cambia la palabra.",
        ],
        examples: [
          { jp: "おばさん", es: "tía, señora" },
          { jp: "おばあさん", es: "abuela, anciana" },
          { jp: "せんせい", es: "profesor" },
        ],
      },
    ],
    items: [
      word("きって", "estampilla"),
      word("がっこう", "escuela"),
      word("ざっし", "revista"),
      word("ちょっと", "un poco"),
      word("いっしょ", "juntos"),
      word("おかあさん", "mamá"),
      word("おとうさん", "papá"),
      word("おばあさん", "abuela"),
      word("おじいさん", "abuelo"),
      word("せんせい", "profesor"),
      word("とうきょう", "Tokio"),
      word("きょう", "hoy"),
    ],
    questions: [
      {
        kind: "choice",
        prompt: "¿Cómo se escribe «kitte», estampilla?",
        options: ["きって", "きつて", "きて", "きいて"],
        answer: 0,
        explanation: "La pausa se escribe con una っ pequeña: きって.",
      },
      {
        kind: "choice",
        prompt: "¿Cuál significa «abuela»?",
        options: ["おばあさん", "おばさん", "おばさあん", "おばんさ"],
        answer: 0,
        explanation: "おばあさん tiene la a larga; おばさん es tía.",
      },
      {
        kind: "choice",
        prompt: "¿Cómo se escribe la «o» larga de «Tōkyō»?",
        options: ["とうきょう", "とおきょお", "ときょ", "とーきょー"],
        answer: 0,
        explanation: "En hiragana la o larga casi siempre se escribe con う.",
      },
    ],
  },

  // ── Katakana ────────────────────────────────────────────────────────────────────────────
  katakanaRow("kd-k-1", [0, 1, 2], "Katakana: ア a ソ", [
    "El katakana tiene los mismos sonidos que el hiragana. Se usa para palabras extranjeras, nombres de otros países y onomatopeyas.",
    "Algunos se parecen a su versión en hiragana: カ y か, キ y き, セ y せ.",
    "シ y ツ son la trampa clásica: en シ los trazos suben de izquierda a derecha; en ツ caen desde arriba.",
  ]),
  katakanaRow("kd-k-2", [3, 4, 5], "Katakana: タ a ホ", [
    "ソ y ン son la otra trampa: ソ cae de arriba hacia abajo; ン sube desde abajo.",
    "ヘ es casi igual que へ.",
  ]),
  katakanaRow("kd-k-3", [6, 7, 8, 9], "Katakana: マ a ン", [
    "ヲ casi nunca se usa; ン es muy común porque aparece en muchos préstamos: パン, ワイン.",
    "ロ parece el kanji 口 (boca), pero es más pequeño.",
  ]),
  {
    id: "kd-k-todo",
    unit: "kata-filas",
    jp: "全",
    title: "Las 46 mezcladas",
    summary: "Todo el katakana básico fuera de orden, con énfasis en las parejas que se confunden.",
    script: "k",
    notes: [
      {
        title: "Las parejas trampa",
        body: [
          "シ y ツ: los trazos de シ suben de izquierda a derecha; los de ツ caen desde arriba.",
          "ソ y ン: el trazo largo de ソ cae; el de ン sube.",
          "ク y ケ, ウ y ワ, ヌ y ス: mira el trazo que sobra o que falta.",
          "Cada sesión elige las que más te cuestan. Repítela hasta que las 46 te salgan sin pensar.",
        ],
        table: rowTable("k", [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
      },
    ],
    items: glyphs("k", [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
  },
  {
    id: "kd-k-sonidos",
    unit: "kata-sonidos",
    jp: "ー",
    title: "Katakana con tenten y la raya ー",
    summary: "ガ, パ y compañía, y la raya que alarga las vocales de los préstamos.",
    script: "k",
    learnFirst: true,
    notes: [
      {
        title: "Lo mismo que en hiragana",
        body: [
          "El tenten y el maru funcionan igual: カ → ガ, ハ → パ. Las combinaciones también: キャ, シュ, チョ.",
          "Las vocales largas no se escriben con otra vocal sino con una raya: コーヒー (café), ケーキ (pastel).",
          "Para sonidos que el japonés no tiene, se combinan vocales pequeñas: ティ (ti), ファ (fa), ウィ (wi).",
        ],
        table: rowTable("k", [10, 11, 12, 13, 14]),
        examples: [
          { jp: "コーヒー", es: "café" },
          { jp: "パーティー", es: "fiesta" },
          { jp: "ゲーム", es: "videojuego" },
        ],
      },
    ],
    items: [
      ...glyphs("k", [10, 11, 12, 13, 14]),
      word("コーヒー", "café"),
      word("ケーキ", "pastel"),
      word("ゲーム", "videojuego"),
      word("パーティー", "fiesta"),
      word("テレビ", "televisión"),
      word("パソコン", "computador"),
    ],
  },
  {
    id: "kd-k-yoon",
    unit: "kata-sonidos",
    jp: "キャ",
    title: "Combinados: キャ, シュ, チョ",
    summary: "Igual que en hiragana: un kana de la columna i más ャ, ュ o ョ pequeña.",
    script: "k",
    learnFirst: true,
    notes: [
      {
        title: "Una sílaba, dos caracteres",
        body: [
          "キ + ャ pequeña = キャ (kya). Si la ヤ es grande, son dos sílabas: キヤ.",
          "Aparecen mucho en préstamos: チョコレート (chocolate), シャツ (camisa), ニュース (noticias).",
        ],
        examples: [
          { jp: "シャツ", es: "camisa" },
          { jp: "ニュース", es: "noticias" },
          { jp: "チョコレート", es: "chocolate" },
        ],
      },
    ],
    items: glyphs("k", [15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]),
  },
  {
    id: "kd-k-palabras",
    unit: "kata-sonidos",
    jp: "語",
    title: "Leer palabras en katakana",
    summary: "Países, ciudades y palabras prestadas: leer katakana de corrido.",
    notes: [
      {
        title: "Cómo se adapta una palabra extranjera",
        body: [
          "El japonés casi no tiene consonantes sueltas, así que añade vocales: «hotel» → ホテル (hoteru).",
          "La l y la r se escriben igual, con la fila ラ: «restaurante» → レストラン.",
          "Las vocales largas van con ー: タクシー (taxi), アイスクリーム (helado).",
          "Lee despacio, sílaba por sílaba, y después dilo de corrido: suele sonar a la palabra original.",
        ],
        examples: [
          { jp: "コロンビア", es: "Colombia" },
          { jp: "ボゴタ", es: "Bogotá" },
          { jp: "ホテル", es: "hotel" },
        ],
      },
    ],
    items: [
      word("コロンビア", "Colombia"),
      word("ボゴタ", "Bogotá"),
      word("メキシコ", "México"),
      word("スペイン", "España"),
      word("アメリカ", "Estados Unidos"),
      word("ホテル", "hotel"),
      word("レストラン", "restaurante"),
      word("タクシー", "taxi"),
      word("アイスクリーム", "helado"),
      word("カメラ", "cámara"),
    ],
  },

  // ── Partículas ──────────────────────────────────────────────────────────────────────────
  particleLesson(
    "kd-p-1",
    "は",
    "は, も, の y か: presentarte",
    ["は", "も", "の", "か"],
    [
      {
        title: "Qué es una partícula",
        body: [
          "Las partículas son palabritas que van después de una palabra y dicen qué papel cumple en la oración.",
          "En español el orden y las preposiciones hacen ese trabajo; en japonés lo hacen las partículas.",
          "Se escriben en hiragana, y algunas no se pronuncian como se escriben: は es «wa», へ es «e» y を es «o».",
        ],
      },
      {
        title: "は: el tema",
        body: ["A は B です: «en cuanto a A, es B». Presenta de qué vas a hablar."],
        examples: [{ jp: "わたし は がくせい です。", es: "Yo soy estudiante." }],
      },
      {
        title: "も, の y か",
        body: [
          "も reemplaza a は para decir «también».",
          "の une sustantivos: わたし の ほん, mi libro.",
          "か al final de la oración la vuelve pregunta.",
        ],
        examples: [
          { jp: "わたし も がくせい です。", es: "Yo también soy estudiante." },
          { jp: "わたし の ほん です。", es: "Es mi libro." },
          { jp: "がくせい です か。", es: "¿Eres estudiante?" },
        ],
      },
    ],
    [
      word("わたし", "yo"),
      word("がくせい", "estudiante"),
      word("せんせい", "profesor"),
      word("ほん", "libro"),
      word("ともだち", "amigo"),
      word("なん", "qué"),
    ],
    [
      {
        kind: "choice",
        prompt: "¿Cómo se pronuncia は cuando es partícula?",
        options: ["wa", "ha", "ba", "a"],
        answer: 0,
        explanation: "Como partícula, は se dice «wa».",
      },
      {
        kind: "choice",
        prompt: "¿Qué hace か al final de una oración?",
        options: ["La vuelve pregunta", "La niega", "La pone en pasado", "La vuelve cortés"],
        answer: 0,
        explanation: "か convierte la oración en pregunta.",
      },
    ],
  ),
  particleLesson(
    "kd-p-2",
    "を",
    "を, に y へ: acciones y destinos",
    ["を", "に", "へ"],
    [
      {
        title: "を: lo que recibe la acción",
        body: [
          "を va después de lo que se come, se lee, se compra o se mira. Se escribe を y se dice «o».",
          "El verbo va siempre al final: みず を のみます, «agua bebo».",
        ],
        examples: [{ jp: "ほん を よみます。", es: "Leo un libro." }],
      },
      {
        title: "に y へ: hacia dónde, y cuándo",
        body: [
          "に y へ marcan el destino con いく, くる y かえる. へ pone el acento en la dirección y se dice «e».",
          "に también marca una hora o un día exactos: しちじ に, a las siete.",
        ],
        examples: [
          { jp: "がっこう に いきます。", es: "Voy a la escuela." },
          { jp: "しちじ に おきます。", es: "Me levanto a las siete." },
        ],
      },
    ],
    [
      word("みず", "agua"),
      word("ごはん", "arroz, comida"),
      word("がっこう", "escuela"),
      word("うち", "casa, hogar"),
      word("にほん", "Japón"),
      word("しちじ", "las siete"),
    ],
    [
      {
        kind: "choice",
        prompt: "¿Cómo se pronuncia を?",
        options: ["o", "wo fuerte", "wa", "u"],
        answer: 0,
        explanation: "を se pronuncia «o».",
      },
    ],
  ),
  particleLesson(
    "kd-p-3",
    "で",
    "で y と: dónde y con quién",
    ["で", "と", "に"],
    [
      {
        title: "で: dónde pasa algo y con qué",
        body: [
          "で marca el lugar donde ocurre una acción: としょかん で べんきょう します.",
          "También el medio: バス で (en bus), にほんご で (en japonés).",
          "No la confundas con に: に es adonde vas o dónde está algo; で es donde haces algo.",
        ],
        examples: [{ jp: "レストラン で たべます。", es: "Como en un restaurante." }],
      },
      {
        title: "と: con, y",
        body: [
          "と significa «con» (ともだち と) y también une dos o más cosas en una lista completa.",
        ],
        examples: [{ jp: "パン と コーヒー を かいます。", es: "Compro pan y café." }],
      },
    ],
    [
      word("としょかん", "biblioteca"),
      word("バス", "bus"),
      word("レストラン", "restaurante"),
      word("にほんご", "idioma japonés"),
      word("パン", "pan"),
      word("へや", "cuarto"),
    ],
    [
      {
        kind: "choice",
        prompt: "«Estudio en la biblioteca»: ¿qué partícula va después de としょかん?",
        options: ["で", "に", "を", "へ"],
        answer: 0,
        explanation: "Estudiar es una acción; el lugar de una acción va con で.",
      },
    ],
  ),
  particleLesson(
    "kd-p-4",
    "が",
    "が, から, まで y や",
    ["が", "から", "まで", "や"],
    [
      {
        title: "が: lo que hay, lo que gusta",
        body: [
          "が marca qué existe con ある (cosas) e いる (seres vivos): ねこ が います.",
          "También va con すき (gustar) y わかる (entender): すし が すき です.",
          "La diferencia fina entre は y が se aprende con el tiempo; por ahora usa が con estos verbos.",
        ],
        examples: [{ jp: "ねこ が います。", es: "Hay un gato." }],
      },
      {
        title: "から, まで y や",
        body: [
          "から es «desde» y まで es «hasta»: くじ から ごじ まで, de nueve a cinco.",
          "や une ejemplos de una lista incompleta: «manzanas, bananos, entre otras cosas».",
        ],
        examples: [{ jp: "コロンビア から きました。", es: "Vine de Colombia." }],
      },
    ],
    [
      word("ねこ", "gato"),
      word("おかね", "dinero"),
      word("すし", "sushi"),
      word("くじ", "las nueve"),
      word("ごじ", "las cinco"),
      word("りんご", "manzana"),
    ],
  ),
  particleLesson(
    "kd-p-5",
    "ね",
    "ね y よ: el tono al final",
    ["ね", "よ", "か"],
    [
      {
        title: "Partículas del final",
        body: [
          "ね busca acuerdo, como «¿verdad?» o «¿no?»: compartes algo que el otro también ve.",
          "よ informa algo que el otro no sabe, con seguridad: «¡te lo digo!».",
          "か, como ya viste, hace una pregunta.",
        ],
        examples: [
          { jp: "さむい です ね。", es: "Hace frío, ¿verdad?" },
          { jp: "おいしい です よ。", es: "¡Está rico, de verdad!" },
        ],
      },
    ],
    [
      word("さむい", "frío"),
      word("おいしい", "rico, delicioso"),
      word("てんき", "el tiempo, el clima"),
      word("きょう", "hoy"),
    ],
  ),

  // ── Verbos ──────────────────────────────────────────────────────────────────────────────
  {
    id: "kd-v-grupos",
    unit: "kana-verbos",
    jp: "類",
    title: "Los tres grupos de verbos",
    summary: "Para conjugar un verbo primero hay que saber de qué grupo es.",
    generator: "verb-groups",
    generatedCount: 8,
    notes: [
      {
        title: "Tres grupos",
        body: [
          "Todos los verbos en forma de diccionario terminan en un sonido u: かう, かく, たべる, する.",
          "Grupo 2 (verbos る): terminan en «e + る» o «i + る», como たべる y みる. Se conjugan quitando る.",
          "Grupo 1 (verbos u): todos los demás, como かう, のむ, はなす. Cambian la última sílaba.",
          "Irregulares: solo する (hacer) y くる (venir).",
        ],
        table: {
          head: ["Grupo", "Ejemplos", "Pista"],
          rows: [
            ["Grupo 1 (u)", "かう, かく, のむ, はなす", "No terminan en e/i + る"],
            ["Grupo 2 (る)", "たべる, みる, ねる, おきる", "Terminan en e/i + る"],
            ["Irregulares", "する, くる", "Solo estos dos"],
          ],
        },
      },
      {
        title: "Las excepciones",
        body: [
          "Algunos verbos terminan en e/i + る pero son del grupo 1: かえる (volver), はいる (entrar), はしる (correr), しる (saber).",
          "No hay forma de deducirlo: se memorizan. La práctica te los pregunta más.",
        ],
      },
    ],
    items: verbItems([
      "かう",
      "のむ",
      "かく",
      "たべる",
      "みる",
      "ねる",
      "する",
      "くる",
      "かえる",
      "はいる",
    ]),
  },
  verbLesson(
    "kd-v-masu",
    "ます",
    "La forma ます: presente y negativo",
    "La forma cortés con la que hablarás al principio: たべます, たべません.",
    ["masu", "masen"],
    [
      {
        title: "Cómo se forma",
        body: [
          "Grupo 2: quita る y añade ます. たべる → たべます.",
          "Grupo 1: la última sílaba pasa a la columna i y se añade ます. のむ → のみます, かう → かいます.",
          "Irregulares: する → します, くる → きます.",
          "El negativo cambia ます por ません: たべません, のみません.",
          "ます sirve para el presente y para el futuro: あした いきます, iré mañana.",
        ],
        table: {
          head: ["Diccionario", "ます", "ません"],
          rows: [
            ["たべる", "たべます", "たべません"],
            ["のむ", "のみます", "のみません"],
            ["かう", "かいます", "かいません"],
            ["する", "します", "しません"],
            ["くる", "きます", "きません"],
          ],
          jpCells: true,
        },
      },
    ],
    ["たべる", "のむ", "かう", "よむ", "みる", "いく", "する", "くる"],
  ),
  verbLesson(
    "kd-v-pasado",
    "ました",
    "Pasado: ました y ませんでした",
    "Lo que hiciste y lo que no: たべました, たべませんでした.",
    ["mashita", "masendeshita", "masu", "masen"],
    [
      {
        title: "Del presente al pasado",
        body: [
          "Sobre la forma ます: ます → ました (pasado) y ません → ませんでした (pasado negativo).",
          "Si sabes たべます, ya sabes たべました y たべませんでした. La raíz no cambia.",
        ],
        table: {
          head: ["", "Presente", "Pasado"],
          rows: [
            ["Afirmativo", "たべます", "たべました"],
            ["Negativo", "たべません", "たべませんでした"],
          ],
          jpCells: true,
        },
      },
    ],
    ["たべる", "のむ", "はなす", "かく", "みる", "ねる", "する", "くる"],
  ),
  verbLesson(
    "kd-v-te",
    "て",
    "La forma て",
    "La forma más útil: pedir algo (〜てください) y unir acciones.",
    ["te"],
    [
      {
        title: "Para qué sirve",
        body: [
          "〜てください pide algo con cortesía: みて ください, mire por favor.",
          "También une acciones en orden: おきて、たべて、いきます. Me levanto, como y me voy.",
        ],
      },
      {
        title: "Grupo 2 e irregulares",
        body: [
          "Grupo 2: quita る y añade て. たべる → たべて. Irregulares: する → して, くる → きて.",
        ],
      },
      {
        title: "Grupo 1: depende de la última sílaba",
        body: [
          "Memoriza la tabla como una canción. Es la parte más difícil de los verbos básicos.",
          "La única excepción es いく: いって, no いいて.",
        ],
        table: {
          head: ["Termina en", "Pasa a", "Ejemplo"],
          rows: [
            ["う, つ, る", "って", "かう → かって"],
            ["む, ぶ, ぬ", "んで", "のむ → のんで"],
            ["く", "いて", "かく → かいて"],
            ["ぐ", "いで", "およぐ → およいで"],
            ["す", "して", "はなす → はなして"],
          ],
          jpCells: true,
        },
      },
    ],
    [
      "かう",
      "まつ",
      "つくる",
      "のむ",
      "あそぶ",
      "かく",
      "およぐ",
      "はなす",
      "いく",
      "たべる",
      "する",
    ],
  ),
  verbLesson(
    "kd-v-nai-ta",
    "ない",
    "Informal: ない y た",
    "Las formas que se usan entre amigos y dentro de oraciones más largas.",
    ["nai", "ta"],
    [
      {
        title: "ない: el negativo informal",
        body: [
          "Grupo 2: quita る y añade ない. たべる → たべない.",
          "Grupo 1: la última sílaba pasa a la columna a y se añade ない. のむ → のまない. Ojo: う pasa a わ, かう → かわない.",
          "Irregulares: する → しない, くる → こない.",
        ],
      },
      {
        title: "た: el pasado informal",
        body: [
          "Se forma igual que la forma て, cambiando て por た y で por だ: かって → かった, のんで → のんだ.",
          "Si dominas la て, la た sale sola.",
        ],
      },
    ],
    ["かう", "のむ", "かく", "はなす", "まつ", "たべる", "みる", "いく", "する", "くる"],
  ),

  // ── Adjetivos ───────────────────────────────────────────────────────────────────────────
  {
    id: "kd-a-i",
    unit: "kana-adjetivos",
    jp: "い",
    title: "Adjetivos い",
    summary: "Los adjetivos que terminan en い se conjugan como si fueran verbos.",
    generator: "adjectives",
    focus: ["i"],
    generatedCount: 8,
    notes: [
      {
        title: "Se conjuga la い final",
        body: [
          "Presente: たかい です. Negativo: cambia い por くない → たかくない です.",
          "Pasado: cambia い por かった → たかかった です. Pasado negativo: たかくなかった です.",
          "いい (bueno) es la excepción: se conjuga desde よい → よくない, よかった.",
        ],
        table: {
          head: ["", "Afirmativo", "Negativo"],
          rows: [
            ["Presente", "たかい です", "たかくない です"],
            ["Pasado", "たかかった です", "たかくなかった です"],
          ],
          jpCells: true,
        },
      },
    ],
    items: adjectiveItems("i"),
  },
  {
    id: "kd-a-na",
    unit: "kana-adjetivos",
    jp: "な",
    title: "Adjetivos な",
    summary: "Los adjetivos な no cambian: la conjugación va en です.",
    generator: "adjectives",
    focus: ["na", "i"],
    generatedCount: 8,
    notes: [
      {
        title: "La palabra no cambia",
        body: [
          "Presente: しずか です. Negativo: しずか じゃない です. Pasado: しずか でした.",
          "Antes de un sustantivo llevan な: しずか な まち, una ciudad tranquila. De ahí su nombre.",
          "Cuidado: きれい y ゆうめい terminan en い pero son adjetivos な. きれくない está mal; se dice きれい じゃない.",
        ],
        table: {
          head: ["", "Afirmativo", "Negativo"],
          rows: [
            ["Presente", "しずか です", "しずか じゃない です"],
            ["Pasado", "しずか でした", "しずか じゃなかった です"],
          ],
          jpCells: true,
        },
      },
    ],
    items: adjectiveItems("na"),
  },
];

/** The hiragana side of the course, with the grammar, which is written in hiragana. */
export const HIRAGANA_UNITS = KANA_UNITS.filter((u) => !u.id.startsWith("kata-"));
export const KATAKANA_UNITS = KANA_UNITS.filter((u) => u.id.startsWith("kata-"));
export const HIRAGANA_COURSE = KANA_COURSE.filter((l) => !l.unit.startsWith("kata-"));
export const KATAKANA_COURSE = KANA_COURSE.filter((l) => l.unit.startsWith("kata-"));

export const kanaLessonById = (id: string) => KANA_COURSE.find((l) => l.id === id);
