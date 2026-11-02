/**
 * Prompts the user copies into any assistant. The reply is pasted back and validated with the
 * schemas in `schema.ts`, so the hub needs neither an API key nor a backend.
 */

const STUDENT = "un estudiante hispanohablante de nivel principiante, preparando el JLPT N5";

export function cardsPrompt(notes: string, knownWords: string[]): string {
  return `Eres tutor de japonés de ${STUDENT}.
A partir de sus apuntes de una clase, crea tarjetas de estudio con el vocabulario, las expresiones y los puntos de gramática que aparecen. Corrige errores que haya en los apuntes. No inventes temas que no estén en los apuntes. Omite lo que ya está en su mazo.
Responde SOLO con un arreglo JSON (máximo 20 objetos) con esta forma exacta:
[{"jp":"水を飲みます","r":"みずをのみます","es":"tomo agua","ej":"まいにち水を飲みます。","ejes":"Tomo agua todos los días.","t":"gramática"}]
Reglas: "jp" en japonés (usa kanji solo si son de nivel N5; si no, kana); "r" la lectura completa en hiragana; "es" significado breve en español; "ej" una oración de ejemplo corta y natural de nivel N5; "ejes" su traducción; "t" es "vocabulario", "gramática" o "expresión".
Ya está en su mazo: ${knownWords.join("、") || "(nada)"}
Apuntes:
"""
${notes}
"""`;
}

export function correctionPrompt(text: string, topic: string, structure: string): string {
  return `Eres un profesor de japonés amable y honesto. Tu alumno es ${STUDENT}. Escribió estas oraciones sobre el tema «${topic}» (estructura sugerida: ${structure}).
Si escribió en rōmaji, transcríbelo a kana. Corrige errores de gramática, partículas, conjugación y ortografía; no reescribas el estilo si la oración ya es correcta. Explica cada corrección en español en una o dos frases, a nivel principiante.
Responde SOLO con JSON con esta forma:
{"oraciones":[{"original":"...","corregida":"...","natural":"versión más natural, o igual a corregida","explicacion":"...","ok":true}],"comentario":"una frase de ánimo concreta y una sugerencia para la próxima vez"}
Texto del alumno:
"""
${text}
"""`;
}

export function quizPrompt(deck: string[]): string {
  return `Crea un mini examen de 5 preguntas de opción múltiple estilo JLPT N5 (vocabulario, lectura de kanji y gramática/partículas) para un hispanohablante principiante.
${deck.length ? `Basa al menos 3 preguntas en este vocabulario que está estudiando:\n${deck.join("\n")}` : "Usa vocabulario básico de N5."}
Responde SOLO con un arreglo JSON de 5 objetos con esta forma:
[{"q":"わたし＿＿がくせいです。","opts":["は","を","に","で"],"a":0,"exp":"は marca el tema de la oración."}]
"q" la pregunta (en japonés, con una instrucción breve en español si hace falta); "opts" exactamente 4 opciones; "a" el índice de la correcta; "exp" explicación breve en español.`;
}

/** Assistants often wrap JSON in a Markdown fence or add a sentence around it. */
export function extractJson(reply: string): unknown {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(reply)?.[1];
  const text = (fenced ?? reply).trim();
  const start = text.search(/[[{]/);
  const end = Math.max(text.lastIndexOf("]"), text.lastIndexOf("}"));
  if (start < 0 || end < start) throw new SyntaxError("La respuesta no contiene JSON.");
  return JSON.parse(text.slice(start, end + 1));
}

export const DIARY_PROMPTS: ReadonlyArray<readonly [string, string]> = [
  ["Preséntate", "わたしは…です。"],
  ["¿Qué comiste hoy?", "…をたべました。"],
  ["Tu juego favorito", "…がすきです。"],
  ["Describe tu ciudad", "…は…です。"],
  ["¿Qué harás mañana?", "あした…をします。"],
  ["Tu rutina de la mañana", "…におきます。"],
  ["¿Qué estudias?", "…をべんきょうしています。"],
  ["El clima de hoy", "きょうは…です。"],
  ["Un amigo o familiar", "…は…です。"],
  ["¿Qué hiciste el fin de semana?", "…へいきました。"],
  ["Tu comida favorita", "…がおいしいです。"],
  ["¿Qué hay en tu escritorio?", "…があります。"],
  ["¿Por qué estudias japonés?", "…からです。"],
  ["Algo que quieres comprar", "…がほしいです。"],
  ["Tu proyecto de programación", "…をつくっています。"],
  ["¿Qué música escuchas?", "…をききます。"],
  ["Un lugar al que quieres ir en Japón", "…にいきたいです。"],
  ["¿Qué hora es y qué haces?", "いま…じです。"],
  ["Tu deporte o ejercicio", "…をします。"],
  ["Lo que más te gustó de la semana", "…がたのしかったです。"],
];
