import { KANA, type Script } from "./kana";
import type { Lesson, LessonItem } from "./lessons";

/**
 * The course "desde cero": writing, kana, everyday expressions, numbers and time, and the first
 * sentence patterns, in the order a pre-basic class covers them. All explanations and questions
 * are written for this project.
 */

/** Rows of the kana table (see kana.ts) as glyph items. */
function kanaItems(script: Script, rows: readonly number[]): LessonItem[] {
  return KANA[script]
    .filter((k) => rows.includes(k.row))
    .map((k) => ({ jp: k.char, es: k.answers[0] ?? "", glyph: true, alt: k.answers }));
}

const rowTable = (script: Script, rows: readonly number[]) => ({
  head: ["a", "i", "u", "e", "o"],
  jpCells: true,
  rows: rows.flatMap((row) => {
    const chars = KANA[script].filter((k) => k.row === row).map((k) => k.char);
    const [a = "", b = "", c = ""] = chars;
    // The や and わ rows have gaps; each kana stays under its vowel, and ん gets a row of its own.
    if (row === 7) return [[a, "", b, "", c]];
    if (row === 9)
      return [
        [a, "", "", "", b],
        [c, "", "", "", ""],
      ];
    return [chars];
  }),
});

const word = (jp: string, es: string, extra: Partial<LessonItem> = {}): LessonItem => ({
  jp,
  es,
  ...extra,
});

export const LESSONS: readonly Lesson[] = [
  // ── La escritura ────────────────────────────────────────────────────────────────────────
  {
    id: "escritura",
    unit: "escritura",
    jp: "文字",
    title: "Los cuatro sistemas de escritura",
    summary: "Kanji, hiragana, katakana y rōmaji: para qué sirve cada uno.",
    notes: [
      {
        title: "Una misma palabra, cuatro escrituras",
        body: [
          "El japonés mezcla tres sistemas en una misma oración, y usa un cuarto para quien aprende.",
          "Kanji: caracteres que vienen de la escritura china. Llevan el significado de la palabra.",
          "Hiragana: el silabario propio del japonés. Escribe las terminaciones, las partículas y las palabras sin kanji.",
          "Katakana: el silabario de las palabras extranjeras, los nombres de otros países y las onomatopeyas.",
          "Rōmaji: el japonés escrito con nuestro alfabeto. Ayuda al principio, pero los japoneses no lo usan para leer.",
        ],
        examples: [
          { jp: "日本語", es: "kanji" },
          { jp: "にほんご", es: "hiragana" },
          { jp: "ニホンゴ", es: "katakana" },
          { jp: "nihongo", es: "rōmaji" },
        ],
      },
      {
        title: "Por qué importan los kanji",
        body: [
          "Muchas palabras suenan igual. En hiragana かみ puede ser papel, dios, cabello o arriba; el kanji dice cuál es.",
          "Por eso los textos para principiantes ponen la lectura en pequeño encima del kanji. Esa ayuda se llama furigana.",
          "Cada kanji tiene lecturas de origen chino (on'yomi, que se suelen anotar en katakana) y lecturas japonesas (kun'yomi, en hiragana).",
        ],
        examples: [
          { jp: "紙", romaji: "kami", es: "papel" },
          { jp: "神", romaji: "kami", es: "dios" },
          { jp: "髪", romaji: "kami", es: "cabello" },
          { jp: "上", romaji: "ue / kami", es: "arriba" },
        ],
      },
      {
        title: "Cómo se escribe una fecha",
        body: [
          "Las fechas van de lo grande a lo pequeño: año 年, mes 月, día 日 y, entre paréntesis, el día de la semana.",
        ],
        examples: [{ jp: "2026年11月3日（火）", es: "martes 3 de noviembre de 2026" }],
      },
    ],
    items: [
      word("日本語", "idioma japonés", { kana: "にほんご" }),
      word("漢字", "kanji", { kana: "かんじ" }),
      word("ひらがな", "hiragana"),
      word("カタカナ", "katakana"),
      word("紙", "papel", { kana: "かみ" }),
      word("神", "dios", { kana: "かみ" }),
      word("髪", "cabello", { kana: "かみ" }),
      word("年", "año", { kana: "ねん" }),
      word("月", "mes", { kana: "がつ" }),
      word("日", "día", { kana: "にち" }),
    ],
    questions: [
      {
        kind: "choice",
        prompt: "¿Qué sistema se usa para las palabras extranjeras, como «Colombia»?",
        options: ["Katakana", "Hiragana", "Kanji", "Rōmaji"],
        answer: 0,
        explanation: "Los préstamos y los nombres de otros países van en katakana: コロンビア.",
      },
      {
        kind: "choice",
        prompt: "¿Qué es la furigana?",
        options: [
          "La lectura en kana escrita encima de un kanji",
          "Un tipo de kanji antiguo",
          "El japonés escrito con letras latinas",
          "La forma cursiva del katakana",
        ],
        answer: 0,
        explanation: "Furigana es la ayuda de lectura: kana pequeños sobre el kanji.",
      },
      {
        kind: "choice",
        prompt: "La lectura on'yomi de un kanji es…",
        options: [
          "La que viene del chino",
          "La japonesa original",
          "La que se usa solo en nombres",
          "La escrita en rōmaji",
        ],
        answer: 0,
        explanation: "On'yomi viene del chino; kun'yomi es la lectura japonesa.",
      },
      {
        kind: "choice",
        prompt: "¿Cuál de estas palabras está escrita en hiragana?",
        options: ["にほんご", "ニホンゴ", "日本語", "nihongo"],
        answer: 0,
        explanation: "El hiragana tiene trazos curvos; el katakana, rectos y angulosos.",
      },
      {
        kind: "choice",
        prompt: "En 2026年11月3日, ¿qué indica 月?",
        options: ["El mes", "El año", "El día", "El día de la semana"],
        answer: 0,
        explanation: "年 es año, 月 es mes y 日 es día.",
      },
    ],
  },

  // ── Hiragana ────────────────────────────────────────────────────────────────────────────
  {
    id: "hiragana-1",
    unit: "hiragana",
    jp: "あ〜こ",
    title: "Vocales y fila K",
    summary: "あ い う え お y か き く け こ, con tus primeras palabras.",
    script: "h",
    notes: [
      {
        title: "Las cinco vocales",
        body: [
          "Las vocales japonesas suenan como las del español, pero la う es más suave: los labios casi no se redondean.",
          "Cada fila siguiente es una consonante más estas cinco vocales, siempre en el orden a, i, u, e, o.",
        ],
        table: rowTable("h", [0, 1]),
      },
      {
        title: "Para no confundirlas",
        body: [
          "あ y お se parecen: お tiene un trazo suelto arriba a la derecha.",
          "い son dos trazos verticales; こ, dos horizontales.",
          "き es como さ con un trazo horizontal más.",
          "Dibuja cada una en la sección de práctica: el sistema te dirá a qué se parece tu trazo.",
        ],
      },
    ],
    items: [
      ...kanaItems("h", [0, 1]),
      word("あい", "amor"),
      word("いえ", "casa"),
      word("あお", "azul"),
      word("かお", "cara"),
      word("えき", "estación"),
      word("あき", "otoño"),
    ],
  },
  {
    id: "hiragana-2",
    unit: "hiragana",
    jp: "さ〜と",
    title: "Filas S y T",
    summary: "さ し す せ そ y た ち つ て と, con sus lecturas especiales.",
    script: "h",
    notes: [
      {
        title: "Tres lecturas que rompen el patrón",
        body: [
          "し se lee shi, no si. ち se lee chi y つ se lee tsu, un sonido que no existe en español: es una t seguida de una s suave.",
        ],
        table: rowTable("h", [2, 3]),
      },
      {
        title: "Parejas engañosas",
        body: [
          "さ y ち son casi un espejo: さ abre hacia la izquierda abajo y ち hacia la derecha.",
          "し es un anzuelo; つ, una ola tumbada.",
        ],
      },
    ],
    items: [
      ...kanaItems("h", [2, 3]),
      word("すし", "sushi"),
      word("あさ", "mañana (de la mañana)"),
      word("いす", "silla"),
      word("くつ", "zapatos"),
      word("そと", "afuera"),
      word("ちかてつ", "metro"),
      word("とけい", "reloj"),
    ],
  },
  {
    id: "hiragana-3",
    unit: "hiragana",
    jp: "な〜ほ",
    title: "Filas N y H",
    summary: "な に ぬ ね の y は ひ ふ へ ほ.",
    script: "h",
    notes: [
      {
        title: "La fila H",
        body: [
          "ふ se lee fu, con los labios casi cerrados, entre una f y una h.",
          "La h japonesa se pronuncia, como la j suave del Caribe: はな suena «jana».",
          "は como partícula se lee wa, y へ como partícula se lee e. Lo verás en las primeras oraciones.",
        ],
        table: rowTable("h", [4, 5]),
      },
      {
        title: "Parejas engañosas",
        body: [
          "ぬ y め: ぬ termina en un pequeño lazo; め, no.",
          "は y ほ: ほ tiene un trazo horizontal más arriba.",
          "ね termina en lazo, igual que ぬ; compárala con れ y わ en la siguiente lección.",
        ],
      },
    ],
    items: [
      ...kanaItems("h", [4, 5]),
      word("ねこ", "gato"),
      word("いぬ", "perro"),
      word("はな", "flor"),
      word("ふね", "barco"),
      word("ひと", "persona"),
      word("なつ", "verano"),
      word("さかな", "pescado"),
    ],
  },
  {
    id: "hiragana-4",
    unit: "hiragana",
    jp: "ま〜ん",
    title: "Filas M, Y, R, W y la ん",
    summary: "Completa el hiragana básico: 46 caracteres.",
    script: "h",
    notes: [
      {
        title: "Las últimas filas",
        body: [
          "La r japonesa es siempre suave, como en «pero»; nunca fuerte como en «perro».",
          "を se lee o y solo se usa como partícula de objeto.",
          "ん es la única consonante sola: suena n, m o ng según lo que venga después.",
        ],
        table: rowTable("h", [6, 7, 8, 9]),
      },
      {
        title: "Parejas engañosas",
        body: [
          "る y ろ: る termina en un lazo; ろ, abierta.",
          "ね, れ y わ comparten el primer trazo: ね termina en lazo, れ en una cola hacia afuera y わ en curva cerrada.",
          "ま y も: ま tiene dos trazos horizontales y un lazo; も, un gancho hacia arriba.",
        ],
      },
    ],
    items: [
      ...kanaItems("h", [6, 7, 8, 9]),
      word("やま", "montaña"),
      word("ゆき", "nieve"),
      word("よる", "noche"),
      word("わたし", "yo"),
      word("ほん", "libro"),
      word("さくら", "cerezo"),
      word("むらさき", "violeta (color)"),
      word("まいにち", "todos los días"),
    ],
  },
  {
    id: "hiragana-5",
    unit: "hiragana",
    jp: "が〜ぽ",
    title: "Dakuten y handakuten",
    summary: "Dos rayitas o un círculo cambian el sonido: か → が, は → ば → ぱ.",
    script: "h",
    notes: [
      {
        title: "Las marcas",
        body: [
          "Las dos rayitas ( ゛) se llaman dakuten y vuelven sonora la consonante: k → g, s → z, t → d, h → b.",
          "El círculo ( ゜) se llama handakuten y solo va en la fila H: h → p.",
          "じ y ぢ se leen igual (ji), y ず y づ también (zu). En la práctica casi siempre se usan じ y ず.",
        ],
        table: rowTable("h", [10, 11, 12, 13, 14]),
      },
    ],
    items: [
      ...kanaItems("h", [10, 11, 12, 13, 14]),
      word("ごはん", "arroz, comida"),
      word("かぞく", "familia"),
      word("でんわ", "teléfono"),
      word("たまご", "huevo"),
      word("かばん", "bolso"),
      word("えんぴつ", "lápiz"),
    ],
  },
  {
    id: "hiragana-6",
    unit: "hiragana",
    jp: "きゃ・っ",
    title: "Combinaciones, pausas y vocales largas",
    summary: "きゃ, la pausa っ y las vocales largas cambian el significado.",
    script: "h",
    notes: [
      {
        title: "Combinaciones con ゃ ゅ ょ",
        body: [
          "Una sílaba en i seguida de una や, ゆ o よ pequeña forma un solo sonido: き + ゃ = kya.",
          "Escríbelas más pequeñas que la sílaba anterior: きや (ki-ya) y きゃ (kya) son cosas distintas.",
        ],
        table: {
          head: ["ya", "yu", "yo"],
          jpCells: true,
          rows: [
            ["きゃ", "きゅ", "きょ"],
            ["しゃ", "しゅ", "しょ"],
            ["ちゃ", "ちゅ", "ちょ"],
            ["じゃ", "じゅ", "じょ"],
            ["りゃ", "りゅ", "りょ"],
          ],
        },
      },
      {
        title: "La pausa っ",
        body: [
          "Una つ pequeña marca una pausa breve que duplica la consonante siguiente: きて (kite) y きって (kitte) son palabras distintas.",
        ],
        examples: [
          { jp: "きって", romaji: "kitte", es: "estampilla" },
          { jp: "がっこう", romaji: "gakkō", es: "escuela" },
        ],
      },
      {
        title: "Vocales largas",
        body: [
          "Una vocal larga dura el doble y cambia el significado: おばさん (tía) y おばあさん (abuela).",
          "En hiragana se alarga con la vocal: ああ, いい, うう. La o larga casi siempre se escribe おう y la e larga, えい.",
          "En rōmaji se marca con una rayita encima: tōkyō. Aquí puedes escribir tokyo, toukyou o tōkyō y se acepta igual.",
        ],
        examples: [
          { jp: "おかあさん", romaji: "okāsan", es: "mamá" },
          { jp: "せんせい", romaji: "sensei", es: "profesor" },
          { jp: "とうきょう", romaji: "tōkyō", es: "Tokio" },
        ],
      },
    ],
    items: [
      ...kanaItems("h", [15, 16, 17, 23, 21]),
      word("きって", "estampilla"),
      word("がっこう", "escuela", { romaji: "gakkō" }),
      word("おかあさん", "mamá", { romaji: "okāsan" }),
      word("おとうさん", "papá", { romaji: "otōsan" }),
      word("いしゃ", "médico"),
      word("でんしゃ", "tren"),
      word("きょう", "hoy", { romaji: "kyō" }),
      word("りょこう", "viaje", { romaji: "ryokō" }),
    ],
  },

  // ── Katakana ────────────────────────────────────────────────────────────────────────────
  {
    id: "katakana-1",
    unit: "katakana",
    jp: "ア〜ノ",
    title: "Katakana: de ア a ノ",
    summary: "Las primeras cinco filas, con trazos rectos.",
    script: "k",
    notes: [
      {
        title: "Mismos sonidos, otra forma",
        body: [
          "El katakana tiene los mismos sonidos que el hiragana, con trazos rectos y angulosos.",
          "La rayita ー alarga la vocal anterior: ケーキ es kēki (torta).",
        ],
        table: rowTable("k", [0, 1, 2, 3, 4]),
      },
      {
        title: "Las parejas más difíciles",
        body: [
          "シ (shi) y ツ (tsu): en シ los dos puntos están a la izquierda y el trazo largo sube desde abajo; en ツ los puntos están arriba y el trazo baja.",
          "ソ (so) y ン (n): igual que la pareja anterior, ソ baja desde arriba y ン sube desde abajo.",
          "ク (ku) y ケ (ke): ケ tiene el trazo horizontal que sobresale.",
        ],
      },
    ],
    items: [
      ...kanaItems("k", [0, 1, 2, 3, 4]),
      word("ケーキ", "torta, ponqué", { romaji: "kēki" }),
      word("タクシー", "taxi", { romaji: "takushī" }),
      word("ネクタイ", "corbata"),
      word("アイス", "helado (de paleta)"),
    ],
  },
  {
    id: "katakana-2",
    unit: "katakana",
    jp: "ハ〜ン",
    title: "Katakana: de ハ a ン",
    summary: "Completa el katakana básico.",
    script: "k",
    notes: [
      {
        title: "Las últimas filas",
        body: [
          "ヲ casi no se usa; ン aparece en muchísimas palabras extranjeras.",
          "La ッ pequeña marca la pausa, igual que en hiragana: ロボット (robotto).",
        ],
        table: rowTable("k", [5, 6, 7, 8, 9]),
      },
      {
        title: "Parejas engañosas",
        body: [
          "ノ (no), メ (me) y ヌ (nu): メ es una ノ cruzada por un trazo corto; ヌ empieza además con un trazo horizontal, como una フ.",
          "ワ (wa) y ウ (u): ウ tiene un trazo extra arriba.",
          "ユ (yu) y コ (ko): ユ tiene la línea de abajo más larga.",
        ],
      },
    ],
    items: [
      ...kanaItems("k", [5, 6, 7, 8, 9]),
      word("ホテル", "hotel"),
      word("メロン", "melón"),
      word("ラーメン", "ramen", { romaji: "rāmen" }),
      word("ノート", "cuaderno", { romaji: "nōto" }),
      word("ミルク", "leche"),
      word("ロボット", "robot"),
    ],
  },
  {
    id: "katakana-3",
    unit: "katakana",
    jp: "ガ・ファ",
    title: "Katakana: dakuten y sonidos nuevos",
    summary: "ガ, パ y las combinaciones modernas como ファ, ティ o ジェ.",
    script: "k",
    notes: [
      {
        title: "Dakuten, igual que en hiragana",
        body: ["Las rayitas y el círculo funcionan igual: カ → ガ, ハ → バ → パ."],
        table: rowTable("k", [10, 11, 12, 13, 14]),
      },
      {
        title: "Sonidos «nuevos»",
        body: [
          "Para sonidos que el japonés no tenía, el katakana combina una sílaba con una vocal pequeña: フ + ァ = fa.",
          "Así se escriben nombres y palabras de otros idiomas con más fidelidad: フェリペ, ディエゴ.",
        ],
        table: {
          head: ["", "a", "i", "u", "e", "o"],
          jpCells: true,
          rows: [
            ["F", "ファ", "フィ", "", "フェ", "フォ"],
            ["T/D", "", "ティ・ディ", "トゥ・ドゥ", "", ""],
            ["W", "", "ウィ", "", "ウェ", ""],
            ["Sh/Ch/J", "", "", "", "シェ・チェ・ジェ", ""],
            ["V", "ヴァ", "ヴィ", "ヴ", "ヴェ", "ヴォ"],
          ],
        },
      },
    ],
    items: [
      ...kanaItems("k", [10, 11, 12, 13, 14]),
      { jp: "ファ", es: "fa", glyph: true },
      { jp: "フィ", es: "fi", glyph: true },
      { jp: "フェ", es: "fe", glyph: true },
      { jp: "フォ", es: "fo", glyph: true },
      { jp: "ティ", es: "ti", glyph: true, alt: ["thi"] },
      { jp: "ディ", es: "di", glyph: true, alt: ["dhi"] },
      { jp: "トゥ", es: "tu", glyph: true, alt: ["twu"] },
      { jp: "ウィ", es: "wi", glyph: true },
      { jp: "ウェ", es: "we", glyph: true },
      { jp: "シェ", es: "she", glyph: true },
      { jp: "チェ", es: "che", glyph: true },
      { jp: "ジェ", es: "je", glyph: true },
    ],
  },
  {
    id: "katakana-nombres",
    unit: "katakana",
    jp: "名前",
    title: "Tu nombre en katakana",
    summary: "Las reglas para pasar nombres y lugares del español al katakana.",
    notes: [
      {
        title: "Letras que no existen en japonés",
        body: [
          "La c suena k o s según la vocal: Colombia → コロンビア, Cecilia → セシリア.",
          "La h no es muda: se omite. Horacio → オラシオ.",
          "La j suena como la h japonesa: Jorge → ホルヘ, Juan → フアン.",
          "La ll y la y suenan como ji: Medellín → メデジン.",
          "La l se vuelve r: Laura → ラウラ.",
          "La ñ se escribe con ニャ, ニュ, ニェ o ニョ: Nariño → ナリニョ.",
          "La v latina se vuelve b: Valentina → バレンティナ.",
          "La z suena s en español latino: González → ゴンサレス.",
        ],
      },
      {
        title: "Reglas de escritura",
        body: [
          "Una consonante sola recibe una u: Carlos → カルロス (ka-ru-ro-su).",
          "Excepto t y d, que reciben una o: Edna → エドナ, Castro → カストロ.",
          "Las vocales largas y la y final se alargan con ー: Mary → マリー.",
          "Las letras dobles se marcan con ッ: Patty → パッティ.",
          "Entre nombre y apellido va un punto medio: Juan Pérez → フアン・ペレス.",
        ],
      },
    ],
    items: [
      word("コロンビア", "Colombia"),
      word("ボゴタ", "Bogotá"),
      word("メデジン", "Medellín"),
      word("カルタヘナ", "Cartagena"),
      word("トゥンハ", "Tunja"),
      word("カルロス", "Carlos"),
      word("ホルヘ", "Jorge"),
      word("フアン", "Juan"),
      word("ラウラ", "Laura"),
      word("バレンティナ", "Valentina"),
      word("ゴンサレス", "González"),
      word("ディエゴ", "Diego"),
    ],
    questions: [
      {
        kind: "choice",
        prompt: "¿Cómo se escribe «Carlos»?",
        options: ["カルロス", "カロス", "カルロ", "カーロス"],
        answer: 0,
        explanation: "La r y la s quedan solas, así que cada una recibe una u: ka-ru-ro-su.",
      },
      {
        kind: "choice",
        prompt: "¿Cómo se escribe «Castro»?",
        options: ["カストロ", "カスツロ", "カストゥロ", "カスロ"],
        answer: 0,
        explanation: "La t sola recibe una o, no una u: ka-su-to-ro.",
      },
      {
        kind: "choice",
        prompt: "¿Cómo se escribe «Jorge»?",
        options: ["ホルヘ", "ジョルジェ", "ヨルゲ", "ホルゲ"],
        answer: 0,
        explanation: "La j suena como la h japonesa, y ge suena he: ho-ru-he.",
      },
      {
        kind: "choice",
        prompt: "¿Cómo se escribe «Laura»?",
        options: ["ラウラ", "ラウナ", "ロウラ", "ラーラ"],
        answer: 0,
        explanation: "La l se vuelve r: ra-u-ra.",
      },
      {
        kind: "choice",
        prompt: "¿Qué signo separa el nombre del apellido?",
        options: ["El punto medio ・", "Un espacio", "La rayita ー", "Una coma 、"],
        answer: 0,
        explanation: "En katakana no se dejan espacios; se usa el punto medio: フアン・ペレス.",
      },
    ],
  },
  {
    id: "katakana-vocabulario",
    unit: "katakana",
    jp: "外来語",
    title: "Vocabulario en katakana",
    summary: "Palabras prestadas de otros idiomas que usarás todos los días.",
    notes: [
      {
        title: "Préstamos",
        body: [
          "Muchas palabras vienen del inglés, adaptadas a los sonidos japoneses. Si reconoces el sonido, adivinas el significado.",
          "Léelas en voz alta: コーヒー es «kōhī», coffee.",
        ],
      },
    ],
    items: [
      word("アイスクリーム", "helado", { romaji: "aisukurīmu" }),
      word("カメラ", "cámara"),
      word("サラダ", "ensalada"),
      word("チーズ", "queso", { romaji: "chīzu" }),
      word("テレビ", "televisor"),
      word("トマト", "tomate"),
      word("ゲーム", "juego", { romaji: "gēmu" }),
      word("ビール", "cerveza", { romaji: "bīru" }),
      word("レストラン", "restaurante"),
      word("パン", "pan"),
      word("スマホ", "teléfono inteligente"),
      word("コーヒー", "café", { romaji: "kōhī" }),
      word("トイレ", "baño"),
      word("ハンバーガー", "hamburguesa", { romaji: "hanbāgā" }),
    ],
  },

  // ── Saludos y expresiones ───────────────────────────────────────────────────────────────
  {
    id: "saludos",
    unit: "expresiones",
    jp: "挨拶",
    title: "Saludos del día",
    summary: "Buenos días, buenas tardes, buenas noches y cómo estás.",
    notes: [
      {
        title: "Según la hora",
        body: [
          "おはようございます es la forma cortés de «buenos días»; entre amigos basta おはよう.",
          "En こんにちは y こんばんは la última は se lee wa, porque es una partícula antigua.",
          "おやすみなさい es para despedirse de noche, antes de dormir; こんばんは es para saludar.",
        ],
        examples: [
          { jp: "おはようございます", romaji: "ohayō gozaimasu", es: "buenos días" },
          { jp: "こんにちは", romaji: "konnichiwa", es: "hola, buenas tardes" },
          { jp: "こんばんは", romaji: "konbanwa", es: "buenas noches (al llegar)" },
        ],
      },
    ],
    items: [
      word("おはようございます", "buenos días", { romaji: "ohayō gozaimasu" }),
      word("こんにちは", "hola, buenas tardes", { romaji: "konnichiwa" }),
      word("こんばんは", "buenas noches (saludo)", { romaji: "konbanwa" }),
      word("おやすみなさい", "buenas noches (al despedirse)"),
      word("さようなら", "adiós", { romaji: "sayōnara" }),
      word("おげんきですか", "¿cómo estás?"),
      word("はい、げんきです", "sí, estoy bien"),
      word("まあまあ", "más o menos", { romaji: "māmā" }),
      word("じゃ、また", "nos vemos"),
    ],
  },
  {
    id: "cortesia",
    unit: "expresiones",
    jp: "礼儀",
    title: "Gracias, disculpe y por favor",
    summary: "Las expresiones de cortesía que se usan a cada rato.",
    notes: [
      {
        title: "Niveles de cortesía",
        body: [
          "El japonés cambia la forma según a quién le hablas. ありがとう es para amigos; ありがとうございます, para todos los demás.",
          "すみません sirve para disculparse, para llamar la atención de alguien y hasta para agradecer una molestia.",
          "ございました en pasado agradece algo que ya terminó, como una clase o un favor.",
        ],
      },
    ],
    items: [
      word("ありがとう", "gracias (informal)", { romaji: "arigatō" }),
      word("ありがとうございます", "muchas gracias (cortés)", { romaji: "arigatō gozaimasu" }),
      word("どうも", "gracias (breve)", { romaji: "dōmo" }),
      word("どういたしまして", "de nada", { romaji: "dō itashimashite" }),
      word("すみません", "disculpe, perdón"),
      word("しつれいします", "con permiso"),
      word("どうぞ", "siga, adelante, tenga", { romaji: "dōzo" }),
      word("おねがいします", "por favor (al pedir)"),
      word("ごめんなさい", "lo siento"),
    ],
  },
  {
    id: "en-clase",
    unit: "expresiones",
    jp: "教室",
    title: "En clase",
    summary: "Entendiste, tienes preguntas, terminemos.",
    notes: [
      {
        title: "Preguntar y responder",
        body: [
          "か al final convierte una oración en pregunta: わかりました (entendí) → わかりましたか (¿entendiste?).",
          "Se responde con はい (sí) o いいえ (no) y se repite el verbo.",
        ],
        examples: [
          { jp: "わかりましたか", romaji: "wakarimashita ka", es: "¿entendiste?" },
          { jp: "はい、わかりました", romaji: "hai, wakarimashita", es: "sí, entendí" },
          { jp: "いいえ、わかりません", romaji: "iie, wakarimasen", es: "no, no entiendo" },
        ],
      },
    ],
    items: [
      word("わかりましたか", "¿entendiste?"),
      word("はい、わかりました", "sí, entendí"),
      word("いいえ、わかりません", "no, no entiendo"),
      word("しつもんがありますか", "¿tienen preguntas?"),
      word("はい、あります", "sí, tengo"),
      word("いいえ、ありません", "no, no tengo"),
      word("そうですか", "¿ah, sí?", { romaji: "sō desu ka" }),
      word("そうですね", "así es, ya veo", { romaji: "sō desu ne" }),
      word("おつかれさまでした", "gracias por el trabajo de hoy"),
    ],
  },
  {
    id: "en-casa",
    unit: "expresiones",
    jp: "家",
    title: "En casa y en fechas especiales",
    summary: "Salir, volver, comer y felicitar.",
    notes: [
      {
        title: "Frases que van en pareja",
        body: [
          "Quien sale dice いってきます y quien se queda responde いってらっしゃい.",
          "Al volver se dice ただいま y la respuesta es おかえりなさい.",
          "Antes de comer, いただきます; al terminar, ごちそうさまでした.",
        ],
      },
    ],
    items: [
      word("いってきます", "me voy (y vuelvo)"),
      word("いってらっしゃい", "que te vaya bien"),
      word("ただいま", "ya llegué"),
      word("おかえりなさい", "bienvenido de vuelta"),
      word("いただきます", "buen provecho (antes de comer)"),
      word("ごちそうさまでした", "gracias por la comida"),
      word("おたんじょうびおめでとう", "feliz cumpleaños", { romaji: "otanjōbi omedetō" }),
      word("あけましておめでとうございます", "feliz año nuevo", {
        romaji: "akemashite omedetō gozaimasu",
      }),
      word("きをつけてください", "cuídese, tenga cuidado", { romaji: "ki o tsukete kudasai" }),
    ],
    questions: [
      {
        kind: "choice",
        prompt: "Tu compañero sale de la casa y dice いってきます. ¿Qué respondes?",
        options: ["いってらっしゃい", "ただいま", "いただきます", "おかえりなさい"],
        answer: 0,
        explanation: "いってらっしゃい es la respuesta a いってきます.",
      },
      {
        kind: "choice",
        prompt: "Llegas a casa. ¿Qué dices?",
        options: ["ただいま", "いってきます", "ごちそうさまでした", "おやすみなさい"],
        answer: 0,
        explanation: "Al llegar se dice ただいま; te responderán おかえりなさい.",
      },
    ],
  },
  {
    id: "de-viaje",
    unit: "expresiones",
    jp: "旅行",
    title: "De viaje y de compras",
    summary: "Precios, baños, la cuenta y la hora.",
    notes: [
      {
        title: "Frases útiles en Japón",
        body: [
          "これ es «esto». これは いくらですか pregunta el precio de lo que señalas.",
          "Para pedir algo basta con nombrarlo y añadir を ください o おねがいします.",
        ],
        examples: [
          {
            jp: "これは いくらですか",
            romaji: "kore wa ikura desu ka",
            es: "¿cuánto cuesta esto?",
          },
          { jp: "これを ください", romaji: "kore o kudasai", es: "deme esto, por favor" },
        ],
      },
    ],
    items: [
      word("これは いくらですか", "¿cuánto cuesta esto?", { romaji: "kore wa ikura desu ka" }),
      word("これを ください", "deme esto, por favor", { romaji: "kore o kudasai" }),
      word("トイレは どこですか", "¿dónde está el baño?", { romaji: "toire wa doko desu ka" }),
      word("おかいけい おねがいします", "la cuenta, por favor"),
      word("いま なんじですか", "¿qué hora es?"),
      word("おいしいです", "está delicioso", { romaji: "oishii desu" }),
      word("チェックインは なんじですか", "¿a qué hora es el check-in?", {
        romaji: "chekkuin wa nanji desu ka",
      }),
    ],
  },
  {
    id: "presentacion",
    unit: "expresiones",
    jp: "自己紹介",
    title: "Tu presentación",
    summary: "Mucho gusto, me llamo…, vengo de…, encantado.",
    builder: "presentation",
    notes: [
      {
        title: "La estructura",
        body: [
          "Una presentación japonesa tiene cuatro partes fijas, siempre en este orden.",
          "わたしは の は se lee wa: es la partícula del tema («en cuanto a mí»).",
          "No digas さん después de tu propio nombre: es un trato de respeto solo para los demás.",
        ],
        examples: [
          { jp: "はじめまして。", romaji: "hajimemashite", es: "mucho gusto (es la primera vez)" },
          { jp: "わたしは マリア です。", romaji: "watashi wa Maria desu", es: "soy María" },
          {
            jp: "コロンビアから きました。",
            romaji: "Koronbia kara kimashita",
            es: "vengo de Colombia",
          },
          {
            jp: "どうぞ よろしく おねがいします。",
            romaji: "dōzo yoroshiku onegaishimasu",
            es: "encantada de conocerle",
          },
        ],
      },
    ],
    items: [
      word("はじめまして", "mucho gusto"),
      word("わたしは 〜 です", "soy ~", { romaji: "watashi wa ~ desu" }),
      word("〜から きました", "vengo de ~"),
      word("どうぞ よろしく おねがいします", "encantado de conocerle", {
        romaji: "dōzo yoroshiku onegaishimasu",
      }),
      word("コロンビアじん", "colombiano(a)"),
      word("がくせい", "estudiante"),
      word("エンジニア", "ingeniero(a)"),
      word("せんせい", "profesor(a)"),
    ],
    questions: [
      { kind: "order", es: "Soy estudiante.", tiles: ["わたし", "は", "がくせい", "です"] },
      { kind: "order", es: "Vengo de Colombia.", tiles: ["コロンビア", "から", "きました"] },
      {
        kind: "order",
        es: "Encantado de conocerle.",
        tiles: ["どうぞ", "よろしく", "おねがいします"],
      },
      {
        kind: "choice",
        prompt: "¿Qué se dice primero al presentarse?",
        options: ["はじめまして", "どうぞ よろしく", "さようなら", "おやすみなさい"],
        answer: 0,
        explanation:
          "La presentación empieza con はじめまして y termina con どうぞ よろしく おねがいします.",
      },
    ],
  },

  // ── Números y tiempo ────────────────────────────────────────────────────────────────────
  {
    id: "numeros-1",
    unit: "numeros",
    jp: "一〜百",
    title: "Números del 0 al 99",
    summary: "Diez palabras y una regla bastan para contar hasta 99.",
    generator: "numbers-small",
    notes: [
      {
        title: "Del 0 al 10",
        body: [
          "El 4, el 7 y el 9 tienen dos lecturas. Para contar se prefieren よん, なな y きゅう; し, しち y く aparecen en la hora y en los meses.",
        ],
        table: {
          head: ["", "lectura", "otra lectura"],
          jpCells: true,
          rows: [
            ["0", "ゼロ", "れい"],
            ["1", "いち", ""],
            ["2", "に", ""],
            ["3", "さん", ""],
            ["4", "よん", "し"],
            ["5", "ご", ""],
            ["6", "ろく", ""],
            ["7", "なな", "しち"],
            ["8", "はち", ""],
            ["9", "きゅう", "く"],
            ["10", "じゅう", ""],
          ],
        },
      },
      {
        title: "La regla",
        body: [
          "Del 11 al 19: diez + unidad. 17 = じゅう + なな = じゅうなな.",
          "Decenas: unidad × diez. 50 = ご + じゅう = ごじゅう.",
          "Todo junto: 74 = なな + じゅう + よん = ななじゅうよん.",
        ],
      },
    ],
    items: [
      word("ゼロ", "0", { alt: ["れい", "rei"] }),
      word("いち", "1"),
      word("に", "2"),
      word("さん", "3"),
      word("よん", "4", { alt: ["し", "shi"] }),
      word("ご", "5"),
      word("ろく", "6"),
      word("なな", "7", { alt: ["しち", "shichi"] }),
      word("はち", "8"),
      word("きゅう", "9", { alt: ["く", "ku"], romaji: "kyū" }),
      word("じゅう", "10", { romaji: "jū" }),
    ],
  },
  {
    id: "numeros-2",
    unit: "numeros",
    jp: "千・万",
    title: "Centenas, miles y diez miles",
    summary: "ひゃく, せん, まん y los cambios de sonido que hay que memorizar.",
    generator: "numbers-big",
    notes: [
      {
        title: "Cambios de sonido",
        body: [
          "Algunas combinaciones cambian para sonar más fluidas. Son pocas y salen en todos los precios.",
        ],
        table: {
          head: ["", "×100 ひゃく", "×1000 せん"],
          jpCells: true,
          rows: [
            ["1", "ひゃく", "せん"],
            ["3", "さんびゃく", "さんぜん"],
            ["6", "ろっぴゃく", "ろくせん"],
            ["8", "はっぴゃく", "はっせん"],
          ],
        },
      },
      {
        title: "El japonés agrupa de a cuatro cifras",
        body: [
          "Después de 9.999 viene まん (10.000). 85.421 son 8 まん y 5.421: はちまん ごせん よんひゃく にじゅういち.",
          "En español agrupamos de a tres (mil, millón); en japonés, de a cuatro (まん = 10⁴, おく = 10⁸). Un millón es ひゃくまん: cien まん.",
          "100 y 1.000 no llevan いち: ひゃく, せん. Pero 10.000 sí: いちまん.",
        ],
      },
    ],
    items: [
      word("ひゃく", "100", { romaji: "hyaku" }),
      word("さんびゃく", "300", { romaji: "sanbyaku" }),
      word("ろっぴゃく", "600", { romaji: "roppyaku" }),
      word("はっぴゃく", "800", { romaji: "happyaku" }),
      word("せん", "1.000"),
      word("さんぜん", "3.000"),
      word("はっせん", "8.000"),
      word("いちまん", "10.000"),
      word("ひゃくまん", "1.000.000"),
    ],
  },
  {
    id: "hora",
    unit: "numeros",
    jp: "時間",
    title: "La hora",
    summary: "〜じ, 〜ふん y 〜ぷん, はん, ごぜん y ごご.",
    generator: "time",
    notes: [
      {
        title: "Horas",
        body: [
          "La hora es el número + じ. Tres horas cambian: 4 よじ, 7 しちじ, 9 くじ.",
          "ごぜん (a. m.) y ごご (p. m.) van antes de la hora: ごご さんじ = 3 p. m.",
          "はん es «y media»: さんじはん = 3:30.",
        ],
      },
      {
        title: "Minutos",
        body: [
          "分 se lee ふん o ぷん según el número: 1, 3, 4, 6, 8 y 10 toman ぷん con cambios (いっぷん, さんぷん, よんぷん, ろっぷん, はっぷん, じゅっぷん).",
          "2, 5, 7 y 9 toman ふん: にふん, ごふん, ななふん, きゅうふん.",
          "Desde 11 se dice la decena y luego el minuto de 1 a 9: 45 = よんじゅう + ごふん.",
        ],
        table: {
          head: ["", "", "", ""],
          jpCells: true,
          rows: [
            ["1 いっぷん", "2 にふん", "3 さんぷん", "4 よんぷん"],
            ["5 ごふん", "6 ろっぷん", "7 ななふん", "8 はっぷん"],
            ["9 きゅうふん", "10 じゅっぷん", "15 じゅうごふん", "30 さんじゅっぷん"],
          ],
        },
      },
    ],
    items: [
      word("いま なんじですか", "¿qué hora es?"),
      word("よじ", "4:00"),
      word("しちじ", "7:00"),
      word("くじ", "9:00"),
      word("はん", "y media"),
      word("ごぜん", "a. m.", { romaji: "gozen" }),
      word("ごご", "p. m."),
      word("いっぷん", "1 minuto"),
      word("じゅっぷん", "10 minutos", { alt: ["じっぷん"] }),
    ],
  },
  {
    id: "fechas",
    unit: "numeros",
    jp: "日付",
    title: "Días de la semana, meses y fechas",
    summary: "げつようび, しがつ, ついたち y las excepciones del calendario.",
    generator: "dates",
    notes: [
      {
        title: "Días de la semana",
        body: [
          "Cada día lleva el kanji de un elemento + ようび: luna (lunes), fuego (martes), agua, madera, oro, tierra y sol (domingo).",
        ],
        table: {
          head: ["", "", ""],
          jpCells: true,
          rows: [
            ["月 げつようび · lunes", "火 かようび · martes", "水 すいようび · miércoles"],
            ["木 もくようび · jueves", "金 きんようび · viernes", "土 どようび · sábado"],
            ["日 にちようび · domingo", "", ""],
          ],
        },
      },
      {
        title: "Meses",
        body: [
          "El mes es el número + がつ: いちがつ es enero. Atención con 4 しがつ, 7 しちがつ y 9 くがつ.",
        ],
      },
      {
        title: "Días del mes",
        body: [
          "Del 1 al 10 tienen nombres propios que hay que memorizar. Del 11 en adelante es el número + にち, salvo 14, 20 y 24.",
        ],
        table: {
          head: ["", "", "", "", ""],
          jpCells: true,
          rows: [
            ["1 ついたち", "2 ふつか", "3 みっか", "4 よっか", "5 いつか"],
            ["6 むいか", "7 なのか", "8 ようか", "9 ここのか", "10 とおか"],
            [
              "14 じゅうよっか",
              "20 はつか",
              "24 にじゅうよっか",
              "17 じゅうしちにち",
              "19 じゅうくにち",
            ],
          ],
        },
      },
    ],
    items: [
      word("月曜日", "lunes", { kana: "げつようび" }),
      word("火曜日", "martes", { kana: "かようび" }),
      word("水曜日", "miércoles", { kana: "すいようび" }),
      word("木曜日", "jueves", { kana: "もくようび" }),
      word("金曜日", "viernes", { kana: "きんようび" }),
      word("土曜日", "sábado", { kana: "どようび" }),
      word("日曜日", "domingo", { kana: "にちようび" }),
      word("ついたち", "día 1"),
      word("はつか", "día 20"),
      word("たんじょうび", "cumpleaños", { romaji: "tanjōbi" }),
    ],
  },
  {
    id: "tiempo",
    unit: "numeros",
    jp: "時",
    title: "Ayer, hoy y mañana",
    summary: "Las palabras de tiempo: きのう, きょう, あした, らいしゅう…",
    notes: [
      {
        title: "Un patrón que se repite",
        body: [
          "せん = pasado, こん = este, らい = próximo. Sirve para semanas y meses: せんしゅう, こんしゅう, らいしゅう.",
          "Con los años cambia: きょねん (año pasado), ことし (este año), らいねん (próximo año).",
          "まい = cada: まいにち (cada día), まいしゅう (cada semana), まいとし (cada año).",
        ],
      },
    ],
    items: [
      word("おととい", "antier"),
      word("きのう", "ayer", { romaji: "kinō" }),
      word("きょう", "hoy", { romaji: "kyō" }),
      word("あした", "mañana (el día)"),
      word("あさって", "pasado mañana"),
      word("けさ", "esta mañana"),
      word("こんばん", "esta noche"),
      word("いま", "ahora"),
      word("せんしゅう", "la semana pasada", { romaji: "senshū" }),
      word("こんしゅう", "esta semana", { romaji: "konshū" }),
      word("らいしゅう", "la próxima semana", { romaji: "raishū" }),
      word("きょねん", "el año pasado"),
      word("ことし", "este año"),
      word("らいねん", "el próximo año"),
      word("まいにち", "todos los días"),
    ],
    questions: [
      {
        kind: "choice",
        prompt: "Si せんしゅう es la semana pasada, ¿cómo se dice el mes pasado?",
        options: ["せんげつ", "らいげつ", "こんげつ", "まいつき"],
        answer: 0,
        explanation: "せん + げつ = せんげつ. こんげつ es este mes y らいげつ, el próximo.",
      },
      {
        kind: "choice",
        prompt: "¿Cuál significa «este año»?",
        options: ["ことし", "こんねん", "きょねん", "らいねん"],
        answer: 0,
        explanation: "Los años no siguen el patrón: este año es ことし.",
      },
    ],
  },

  // ── Primeras oraciones ──────────────────────────────────────────────────────────────────
  {
    id: "desu",
    unit: "gramatica",
    jp: "です",
    title: "A は B です: ser y estar",
    summary: "です, じゃありません, でした y じゃありませんでした, con か y も.",
    notes: [
      {
        title: "La oración básica",
        body: [
          "A は B です significa «A es B». は (se lee wa) marca el tema y です cierra la oración con cortesía.",
          "No hay artículos ni plural: がくせい es «estudiante», «un estudiante» o «estudiantes».",
        ],
      },
      {
        title: "Los cuatro tiempos de です",
        body: ["Con estas cuatro formas ya puedes afirmar y negar en presente y en pasado."],
        table: {
          head: ["", "presente", "pasado"],
          jpCells: true,
          rows: [
            ["afirmativo", "です", "でした"],
            ["negativo", "じゃありません", "じゃありませんでした"],
          ],
        },
      },
      {
        title: "Partículas か y も",
        body: [
          "か al final convierte la oración en pregunta: がくせいですか (¿es estudiante?).",
          "も reemplaza a は y significa «también»: わたしも がくせいです (yo también soy estudiante).",
        ],
      },
    ],
    items: [
      word("です", "es, soy (presente)"),
      word("じゃありません", "no es (presente)"),
      word("でした", "era, fue (pasado)"),
      word("じゃありませんでした", "no era (pasado)"),
      word("か", "partícula de pregunta"),
      word("も", "también"),
    ],
    questions: [
      { kind: "order", es: "Yo soy estudiante.", tiles: ["わたし", "は", "がくせい", "です"] },
      {
        kind: "order",
        es: "El señor Santos no es ingeniero.",
        tiles: ["サントスさん", "は", "エンジニア", "じゃありません"],
      },
      {
        kind: "order",
        es: "¿La señora Wang es profesora?",
        tiles: ["ワンさん", "は", "せんせい", "ですか"],
      },
      {
        kind: "order",
        es: "Yo también soy colombiano.",
        tiles: ["わたし", "も", "コロンビアじん", "です"],
      },
      {
        kind: "order",
        es: "Ayer fue día de descanso.",
        tiles: ["きのう", "は", "やすみ", "でした"],
      },
      {
        kind: "choice",
        prompt: "カリナさんは がくせい［　］。(Karina era estudiante.)",
        options: ["でした", "です", "じゃありません", "ですか"],
        answer: 0,
        explanation: "«Era» es pasado afirmativo: でした.",
      },
      {
        kind: "choice",
        prompt: "わたし［　］ エンジニアです。(Yo también soy ingeniero.)",
        options: ["も", "は", "か", "の"],
        answer: 0,
        explanation: "«También» se dice con も, que ocupa el lugar de は.",
      },
      {
        kind: "choice",
        prompt: "Para preguntar «¿es usted profesor?», ¿qué agregas a せんせいです?",
        options: ["か al final", "も al principio", "は al final", "の al final"],
        answer: 0,
        explanation: "か al final vuelve pregunta cualquier oración: せんせいですか.",
      },
    ],
  },
  {
    id: "kore",
    unit: "gramatica",
    jp: "これ",
    title: "Esto, eso, aquello y の",
    summary: "これ・それ・あれ, この・その・あの y la partícula の.",
    notes: [
      {
        title: "Tres distancias",
        body: [
          "これ: esto, cerca de quien habla. それ: eso, cerca de quien escucha. あれ: aquello, lejos de los dos. どれ: ¿cuál?",
          "Delante de un sustantivo se usan この, その, あの y どの: このほん (este libro).",
        ],
        table: {
          head: ["", "cerca de mí", "cerca de ti", "lejos", "pregunta"],
          jpCells: true,
          rows: [
            ["solo", "これ", "それ", "あれ", "どれ"],
            ["+ sustantivo", "この", "その", "あの", "どの"],
          ],
        },
      },
      {
        title: "La partícula の",
        body: [
          "の une dos sustantivos, como «de» pero al revés: わたしの ほん = el libro de mí, mi libro.",
          "También indica tema o tipo: にほんごの ほん = libro de japonés.",
          "だれの ですか pregunta «¿de quién es?».",
        ],
      },
    ],
    items: [
      word("これ", "esto"),
      word("それ", "eso"),
      word("あれ", "aquello"),
      word("どれ", "¿cuál?"),
      word("この ほん", "este libro"),
      word("あの ひと", "aquella persona"),
      word("わたしの", "mío, mi"),
      word("だれの", "¿de quién?"),
      word("ほん", "libro"),
      word("かばん", "bolso, maleta"),
    ],
    questions: [
      {
        kind: "order",
        es: "Esto es mi libro.",
        tiles: ["これ", "は", "わたし", "の", "ほん", "です"],
      },
      {
        kind: "order",
        es: "¿De quién es aquel bolso?",
        tiles: ["あの", "かばん", "は", "だれ", "の", "ですか"],
      },
      {
        kind: "order",
        es: "Eso no es un libro de kanji.",
        tiles: ["それ", "は", "かんじ", "の", "ほん", "じゃありません"],
      },
      {
        kind: "choice",
        prompt: "［　］ほんは わたしのです。(Este libro es mío.)",
        options: ["この", "これ", "あれ", "どれ"],
        answer: 0,
        explanation: "Delante de un sustantivo va この, no これ.",
      },
      {
        kind: "choice",
        prompt: "Señalas algo que tiene tu amigo en la mano. ¿Qué palabra usas?",
        options: ["それ", "これ", "あれ", "どれ"],
        answer: 0,
        explanation: "それ es lo que está cerca de quien escucha.",
      },
    ],
  },
  {
    id: "doko",
    unit: "gramatica",
    jp: "どこ",
    title: "¿Dónde? ¿Cuánto cuesta?",
    summary: "ここ・そこ・あそこ・どこ, どちら e いくら.",
    notes: [
      {
        title: "Lugares",
        body: [
          "ここ (aquí), そこ (ahí), あそこ (allá) y どこ (¿dónde?) siguen las mismas distancias que これ, それ y あれ.",
          "どちら es la forma más cortés de どこ: トイレは どちらですか.",
        ],
      },
      {
        title: "Precios",
        body: [
          "いくら pregunta el precio y 〜えん es el yen: この とけいは いくらですか — さんぜんえんです.",
        ],
      },
    ],
    items: [
      word("ここ", "aquí"),
      word("そこ", "ahí"),
      word("あそこ", "allá"),
      word("どこ", "¿dónde?"),
      word("どちら", "¿dónde? (cortés)"),
      word("いくら", "¿cuánto cuesta?"),
      word("えん", "yen"),
      word("えき", "estación"),
      word("とけい", "reloj"),
    ],
    questions: [
      { kind: "order", es: "¿Dónde está el baño?", tiles: ["トイレ", "は", "どこ", "ですか"] },
      {
        kind: "order",
        es: "¿Cuánto cuesta este reloj?",
        tiles: ["この", "とけい", "は", "いくら", "ですか"],
      },
      { kind: "order", es: "La estación está allá.", tiles: ["えき", "は", "あそこ", "です"] },
      {
        kind: "choice",
        prompt:
          "En una tienda elegante, ¿cuál es la forma más cortés de preguntar dónde está algo?",
        options: ["どちらですか", "どこ？", "どれですか", "だれですか"],
        answer: 0,
        explanation: "どちら es la versión cortés de どこ.",
      },
    ],
  },
  {
    id: "horarios",
    unit: "gramatica",
    jp: "から",
    title: "Horarios: から y まで",
    summary: "Desde y hasta, para la hora y los lugares, con una lectura.",
    notes: [
      {
        title: "Desde y hasta",
        body: [
          "から es «desde» y まで es «hasta». Sirven para horas, días y lugares.",
          "くじから ごじまで: de 9 a 5. うちから えきまで: de la casa a la estación.",
          "に marca la hora exacta en que pasa algo: しちじに おきます (me levanto a las 7).",
        ],
      },
    ],
    items: [
      word("から", "desde"),
      word("まで", "hasta"),
      word("おきます", "levantarse"),
      word("ねます", "dormir, acostarse"),
      word("はたらきます", "trabajar"),
      word("べんきょうします", "estudiar", { romaji: "benkyō shimasu" }),
      word("いきます", "ir"),
      word("かえります", "volver a casa"),
    ],
    questions: [
      {
        kind: "choice",
        passage:
          "{田中|たなか}さんは まいにち しちじに おきます。 くじから ごじまで はたらきます。 よる じゅういちじに ねます。",
        prompt: "¿Desde qué hora trabaja Tanaka?",
        options: ["Desde las 9", "Desde las 7", "Desde las 5", "Desde las 11"],
        answer: 0,
        explanation: "くじから = desde las 9. ごじまで = hasta las 5.",
      },
      {
        kind: "choice",
        passage:
          "{田中|たなか}さんは まいにち しちじに おきます。 くじから ごじまで はたらきます。 よる じゅういちじに ねます。",
        prompt: "¿A qué hora se acuesta?",
        options: ["A las 11 de la noche", "A las 7", "A las 9", "A las 5"],
        answer: 0,
        explanation: "よる じゅういちじに ねます: se acuesta a las 11 de la noche.",
      },
      {
        kind: "order",
        es: "Trabajo de 9 a 5.",
        tiles: ["くじ", "から", "ごじ", "まで", "はたらきます"],
      },
      { kind: "order", es: "Me levanto a las 6.", tiles: ["ろくじ", "に", "おきます"] },
      {
        kind: "choice",
        prompt: "La clase es «desde» las 10. ¿Qué partícula va después de じゅうじ?",
        options: ["から", "まで", "の", "も"],
        answer: 0,
        explanation: "から = desde; まで = hasta.",
      },
    ],
  },
];

export const lessonById = (id: string) => LESSONS.find((l) => l.id === id);
