/**
 * Sentences with one particle left out, all in kana with spaces between words, the way beginner
 * texts are printed. Each says why that particle goes there, so a miss turns into a rule.
 */

export interface ParticleSentence {
  before: string;
  particle: string;
  after: string;
  es: string;
  why: string;
  /** Other particles that would also be right here, so they are never offered as wrong. */
  alsoOk?: readonly string[];
}

const s = (
  before: string,
  particle: string,
  after: string,
  es: string,
  why: string,
  alsoOk?: readonly string[],
): ParticleSentence => ({ before, particle, after, es, why, alsoOk });

export const PARTICLE_SENTENCES: readonly ParticleSentence[] = [
  // は: the topic
  s(
    "わたし",
    "は",
    "がくせい です。",
    "Yo soy estudiante.",
    "は marca el tema: «en cuanto a mí…». Se escribe は pero se dice «wa».",
  ),
  s("これ", "は", "ほん です。", "Esto es un libro.", "は presenta de qué se habla: «esto»."),
  s("きょう", "は", "あつい です。", "Hoy hace calor.", "は toma «hoy» como tema de la oración."),
  s(
    "たなかさん",
    "は",
    "せんせい です。",
    "El señor Tanaka es profesor.",
    "は marca a la persona de la que hablas.",
  ),
  // も: also
  s(
    "わたし",
    "も",
    "がくせい です。",
    "Yo también soy estudiante.",
    "も reemplaza a は para decir «también».",
  ),
  s(
    "ホセさん",
    "も",
    "コロンビアじん です。",
    "José también es colombiano.",
    "も significa «también» y ocupa el lugar de は.",
  ),
  // の: of, possession
  s(
    "わたし",
    "の",
    "ほん です。",
    "Es mi libro.",
    "の une dos sustantivos: «el libro de mí», es decir, «mi libro».",
  ),
  s(
    "にほんご",
    "の",
    "せんせい です。",
    "Es profesor de japonés.",
    "の: «profesor de japonés». El primer sustantivo describe al segundo.",
  ),
  s(
    "ともだち",
    "の",
    "いえ に いきます。",
    "Voy a la casa de un amigo.",
    "の: «la casa del amigo».",
  ),
  // か: question
  s(
    "がくせい です",
    "か",
    "。",
    "¿Eres estudiante?",
    "か al final convierte la oración en pregunta; no hace falta «¿?».",
  ),
  s("これ は なん です", "か", "。", "¿Qué es esto?", "か cierra la pregunta."),
  // を: direct object
  s(
    "みず",
    "を",
    "のみます。",
    "Bebo agua.",
    "を marca lo que recibe la acción: el agua es lo que se bebe. Se dice «o».",
  ),
  s("ほん", "を", "よみます。", "Leo un libro.", "を señala el objeto directo del verbo よむ."),
  s("ごはん", "を", "たべます。", "Como arroz.", "を: lo que se come."),
  s("テレビ", "を", "みます。", "Veo televisión.", "を: lo que se mira."),
  // に: destination, time, target
  s(
    "がっこう",
    "に",
    "いきます。",
    "Voy a la escuela.",
    "に marca el destino de いく, くる y かえる.",
    ["へ"],
  ),
  s(
    "しちじ",
    "に",
    "おきます。",
    "Me levanto a las siete.",
    "に marca un momento exacto: una hora, un día de la semana.",
  ),
  s(
    "ともだち",
    "に",
    "あいます。",
    "Me encuentro con un amigo.",
    "あう va con に: te encuentras «con» alguien.",
  ),
  s(
    "へや",
    "に",
    "ねこ が います。",
    "Hay un gato en el cuarto.",
    "に marca dónde está algo con いる y ある.",
  ),
  // へ: direction
  s(
    "にほん",
    "へ",
    "いきます。",
    "Voy hacia Japón.",
    "へ marca la dirección del movimiento. Se escribe へ pero se dice «e».",
    ["に"],
  ),
  s(
    "うち",
    "へ",
    "かえります。",
    "Vuelvo a casa.",
    "へ: hacia dónde vas. Aquí に también sería correcto.",
    ["に"],
  ),
  // で: place of action, means
  s(
    "としょかん",
    "で",
    "べんきょう します。",
    "Estudio en la biblioteca.",
    "で marca el lugar donde ocurre una acción.",
  ),
  s(
    "バス",
    "で",
    "いきます。",
    "Voy en bus.",
    "で marca el medio: en bus, con palillos, en japonés.",
  ),
  s(
    "にほんご",
    "で",
    "はなします。",
    "Hablo en japonés.",
    "で: el idioma es el medio con el que hablas.",
  ),
  s(
    "レストラン",
    "で",
    "たべます。",
    "Como en un restaurante.",
    "で: dónde se hace la acción de comer.",
  ),
  // と: with, and
  s(
    "ともだち",
    "と",
    "いきます。",
    "Voy con un amigo.",
    "と significa «con» cuando acompañas a alguien.",
  ),
  s(
    "パン",
    "と",
    "コーヒー を かいます。",
    "Compro pan y café.",
    "と une sustantivos: «A y B», la lista completa.",
  ),
  // が: subject with ある/いる, likes
  s("ねこ", "が", "います。", "Hay un gato.", "が marca qué existe con いる y ある."),
  s("おかね", "が", "あります。", "Tengo dinero (hay dinero).", "が: lo que hay, con ある."),
  s(
    "すし",
    "が",
    "すき です。",
    "Me gusta el sushi.",
    "すき va con が: lo que gusta se marca con が.",
  ),
  s("にほんご", "が", "わかります。", "Entiendo japonés.", "わかる va con が: lo que se entiende."),
  // から / まで: from, until
  s(
    "くじ",
    "から",
    "はたらきます。",
    "Trabajo desde las nueve.",
    "から marca el punto de partida: desde.",
  ),
  s(
    "ごじ",
    "まで",
    "べんきょう します。",
    "Estudio hasta las cinco.",
    "まで marca el límite: hasta.",
  ),
  s("コロンビア", "から", "きました。", "Vine de Colombia.", "から: el lugar de origen."),
  // や: and others
  s(
    "りんご",
    "や",
    "バナナ を かいました。",
    "Compré manzanas, bananos y otras cosas.",
    "や une ejemplos de una lista incompleta: «A, B, entre otros».",
  ),
  // ね / よ: sentence endings
  s(
    "きょう は さむい です",
    "ね",
    "。",
    "Hoy hace frío, ¿verdad?",
    "ね busca que el otro esté de acuerdo, como «¿verdad?».",
  ),
  s(
    "この ケーキ は おいしい です",
    "よ",
    "。",
    "Este pastel está rico, ¡te lo digo!",
    "よ informa algo que el otro no sabe, con seguridad.",
  ),
  s(
    "いい てんき です",
    "ね",
    "。",
    "Qué buen tiempo, ¿no?",
    "ね: compartes una impresión con quien te escucha.",
  ),
];

/** Particles that can stand in as wrong options, so each blank always has four choices. */
export const COMMON_PARTICLES = [
  "は",
  "が",
  "を",
  "に",
  "で",
  "へ",
  "と",
  "も",
  "の",
  "か",
] as const;
