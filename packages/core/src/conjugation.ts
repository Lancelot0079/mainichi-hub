/**
 * Verb and adjective conjugation, in kana. The rules are the ones a beginner learns: three verb
 * groups, the polite ます forms, the て form with its sound changes, and the plain ない and た forms.
 */

export type VerbGroup = "godan" | "ichidan" | "irregular";

export interface Verb {
  /** Dictionary form, in hiragana. */
  dict: string;
  es: string;
  group: VerbGroup;
}

export const VERBS: readonly Verb[] = [
  { dict: "かう", es: "comprar", group: "godan" },
  { dict: "あう", es: "encontrarse con alguien", group: "godan" },
  { dict: "かく", es: "escribir", group: "godan" },
  { dict: "きく", es: "escuchar, preguntar", group: "godan" },
  { dict: "いく", es: "ir", group: "godan" },
  { dict: "およぐ", es: "nadar", group: "godan" },
  { dict: "はなす", es: "hablar", group: "godan" },
  { dict: "まつ", es: "esperar", group: "godan" },
  { dict: "しぬ", es: "morir", group: "godan" },
  { dict: "あそぶ", es: "jugar, divertirse", group: "godan" },
  { dict: "のむ", es: "beber", group: "godan" },
  { dict: "よむ", es: "leer", group: "godan" },
  { dict: "つくる", es: "hacer, fabricar", group: "godan" },
  { dict: "わかる", es: "entender", group: "godan" },
  { dict: "かえる", es: "volver a casa", group: "godan" },
  { dict: "はいる", es: "entrar", group: "godan" },
  { dict: "たべる", es: "comer", group: "ichidan" },
  { dict: "みる", es: "ver, mirar", group: "ichidan" },
  { dict: "ねる", es: "dormir", group: "ichidan" },
  { dict: "おきる", es: "levantarse", group: "ichidan" },
  { dict: "おしえる", es: "enseñar", group: "ichidan" },
  { dict: "いる", es: "estar (seres vivos)", group: "ichidan" },
  { dict: "あける", es: "abrir", group: "ichidan" },
  { dict: "する", es: "hacer", group: "irregular" },
  { dict: "くる", es: "venir", group: "irregular" },
];

export type VerbForm = "masu" | "masen" | "mashita" | "masendeshita" | "te" | "nai" | "ta";

export const VERB_FORMS: Readonly<Record<VerbForm, string>> = {
  masu: "ます (presente cortés)",
  masen: "ません (negativo cortés)",
  mashita: "ました (pasado cortés)",
  masendeshita: "ませんでした (pasado negativo cortés)",
  te: "て (para pedir y unir acciones)",
  nai: "ない (negativo informal)",
  ta: "た (pasado informal)",
};

export const GROUP_LABEL: Readonly<Record<VerbGroup, string>> = {
  godan: "grupo 1 (u)",
  ichidan: "grupo 2 (る)",
  irregular: "irregular",
};

const shift = (vowelRow: string) => {
  const from = "うくぐすつぬぶむる";
  return (kana: string) => vowelRow[from.indexOf(kana)] ?? kana;
};
const toI = shift("いきぎしちにびみり");
const toA = shift("わかがさたなばまら");

/** The stem ます attaches to: かく → かき, たべる → たべ, する → し. */
export function masuStem(verb: Verb): string {
  if (verb.dict === "する") return "し";
  if (verb.dict === "くる") return "き";
  if (verb.group === "ichidan") return verb.dict.slice(0, -1);
  return verb.dict.slice(0, -1) + toI(verb.dict.slice(-1));
}

/** て and た share the same sound changes; only the last kana differs. */
function teTa(verb: Verb, e: "て" | "た"): string {
  const voiced = e === "て" ? "で" : "だ";
  if (verb.dict === "する") return "し" + e;
  if (verb.dict === "くる") return "き" + e;
  if (verb.group === "ichidan") return verb.dict.slice(0, -1) + e;
  if (verb.dict === "いく") return "いっ" + e;
  const base = verb.dict.slice(0, -1);
  switch (verb.dict.slice(-1)) {
    case "う":
    case "つ":
    case "る":
      return base + "っ" + e;
    case "む":
    case "ぶ":
    case "ぬ":
      return base + "ん" + voiced;
    case "く":
      return base + "い" + e;
    case "ぐ":
      return base + "い" + voiced;
    default:
      return base + "し" + e;
  }
}

export function conjugate(verb: Verb, form: VerbForm): string {
  switch (form) {
    case "masu":
      return masuStem(verb) + "ます";
    case "masen":
      return masuStem(verb) + "ません";
    case "mashita":
      return masuStem(verb) + "ました";
    case "masendeshita":
      return masuStem(verb) + "ませんでした";
    case "te":
      return teTa(verb, "て");
    case "ta":
      return teTa(verb, "た");
    case "nai":
      if (verb.dict === "する") return "しない";
      if (verb.dict === "くる") return "こない";
      if (verb.group === "ichidan") return verb.dict.slice(0, -1) + "ない";
      return verb.dict.slice(0, -1) + toA(verb.dict.slice(-1)) + "ない";
  }
}

/** How the form is built, for the explanation after an answer. */
export function conjugationRule(verb: Verb, form: VerbForm): string {
  const result = conjugate(verb, form);
  if (verb.group === "irregular") return `${verb.dict} es irregular: ${result} se memoriza.`;
  if (form === "te" || form === "ta") {
    if (verb.dict === "いく")
      return `いく es la excepción: ${result}, no いい${form === "te" ? "て" : "た"}.`;
    if (verb.group === "ichidan")
      return `Grupo 2: quita る y añade ${form === "te" ? "て" : "た"} → ${result}.`;
    const last = verb.dict.slice(-1);
    const change = "うつる".includes(last)
      ? "う, つ y る pasan a っ"
      : "むぶぬ".includes(last)
        ? "む, ぶ y ぬ pasan a ん con sonido sonoro"
        : last === "く"
          ? "く pasa a い"
          : last === "ぐ"
            ? "ぐ pasa a い con sonido sonoro"
            : "す pasa a し";
    return `Grupo 1 en ${last}: ${change} → ${result}.`;
  }
  if (form === "nai") {
    if (verb.group === "ichidan") return `Grupo 2: quita る y añade ない → ${result}.`;
    return `Grupo 1: la última sílaba pasa a la fila a (${verb.dict.slice(-1)} → ${toA(verb.dict.slice(-1))}) y se añade ない → ${result}.${verb.dict.endsWith("う") ? " Ojo: う pasa a わ, no a あ." : ""}`;
  }
  const ending = result.slice(masuStem(verb).length);
  if (verb.group === "ichidan") return `Grupo 2: quita る y añade ${ending} → ${result}.`;
  return `Grupo 1: la última sílaba pasa a la fila i (${verb.dict.slice(-1)} → ${toI(verb.dict.slice(-1))}) y se añade ${ending} → ${result}.`;
}

/** Answers a learner is likely to give by mistake: the wrong group's rule, the wrong sound change. */
export function conjugationSlips(verb: Verb, form: VerbForm): string[] {
  const correct = conjugate(verb, form);
  const asOther: Verb = {
    ...verb,
    group: verb.group === "ichidan" ? "godan" : "ichidan",
  };
  const slips = [conjugate(asOther, form)];
  const base = verb.dict.slice(0, -1);
  if (form === "te" || form === "ta") {
    const e = form === "te" ? "て" : "た";
    const d = form === "te" ? "で" : "だ";
    slips.push(
      base + "っ" + e,
      base + "ん" + d,
      base + "い" + e,
      verb.dict + e,
      masuStem(verb) + e,
    );
  }
  if (form === "nai") slips.push(verb.dict + "ない", base + "あない", masuStem(verb) + "ない");
  if (form.startsWith("mas")) {
    const ending = correct.slice(masuStem(verb).length);
    slips.push(verb.dict + ending, base + ending);
  }
  const others = (Object.keys(VERB_FORMS) as VerbForm[]).filter((f) => f !== form);
  slips.push(...others.map((f) => conjugate(verb, f)));
  return [...new Set(slips)].filter((s) => s !== correct);
}

// ── Adjectives ─────────────────────────────────────────────────────────────────────────────

export type AdjectiveKind = "i" | "na";

export interface Adjective {
  /** Without な: しずか, not しずかな. */
  base: string;
  es: string;
  kind: AdjectiveKind;
}

export const ADJECTIVES: readonly Adjective[] = [
  { base: "たかい", es: "caro, alto", kind: "i" },
  { base: "やすい", es: "barato", kind: "i" },
  { base: "おおきい", es: "grande", kind: "i" },
  { base: "ちいさい", es: "pequeño", kind: "i" },
  { base: "あつい", es: "caluroso", kind: "i" },
  { base: "さむい", es: "frío (el clima)", kind: "i" },
  { base: "おいしい", es: "rico, delicioso", kind: "i" },
  { base: "たのしい", es: "divertido", kind: "i" },
  { base: "あたらしい", es: "nuevo", kind: "i" },
  { base: "いい", es: "bueno", kind: "i" },
  { base: "しずか", es: "tranquilo", kind: "na" },
  { base: "げんき", es: "animado, sano", kind: "na" },
  { base: "きれい", es: "bonito, limpio", kind: "na" },
  { base: "ゆうめい", es: "famoso", kind: "na" },
  { base: "すき", es: "que gusta", kind: "na" },
  { base: "べんり", es: "práctico", kind: "na" },
  { base: "ひま", es: "libre, desocupado", kind: "na" },
];

export type AdjectiveForm = "pres" | "neg" | "past" | "pastneg";

export const ADJECTIVE_FORMS: Readonly<Record<AdjectiveForm, string>> = {
  pres: "presente (es)",
  neg: "negativo (no es)",
  past: "pasado (era)",
  pastneg: "pasado negativo (no era)",
};

export function conjugateAdjective(adjective: Adjective, form: AdjectiveForm): string {
  if (adjective.kind === "na") {
    const b = adjective.base;
    return {
      pres: `${b}です`,
      neg: `${b}じゃないです`,
      past: `${b}でした`,
      pastneg: `${b}じゃなかったです`,
    }[form];
  }
  // いい conjugates from its older form よい.
  const stem = adjective.base === "いい" ? "よ" : adjective.base.slice(0, -1);
  if (form === "pres") return `${adjective.base}です`;
  return { neg: `${stem}くないです`, past: `${stem}かったです`, pastneg: `${stem}くなかったです` }[
    form
  ];
}

export function adjectiveRule(adjective: Adjective, form: AdjectiveForm): string {
  const result = conjugateAdjective(adjective, form);
  if (form === "pres") return `Presente: ${adjective.base} + です → ${result}.`;
  if (adjective.kind === "na") {
    const note = adjective.base.endsWith("い")
      ? ` Ojo: ${adjective.base} termina en い pero es adjetivo な.`
      : "";
    return `Adjetivo な: la terminación va después, sin tocar la palabra → ${result}.${note}`;
  }
  if (adjective.base === "いい") return `いい es la excepción: se conjuga como よい → ${result}.`;
  return `Adjetivo い: cambia la い final por ${result.slice(adjective.base.length - 1, -2)} y añade です → ${result}.`;
}

export function adjectiveSlips(adjective: Adjective, form: AdjectiveForm): string[] {
  const correct = conjugateAdjective(adjective, form);
  const other: Adjective = { ...adjective, kind: adjective.kind === "i" ? "na" : "i" };
  const slips = [
    conjugateAdjective(other, form),
    ...(Object.keys(ADJECTIVE_FORMS) as AdjectiveForm[]).map((f) =>
      conjugateAdjective(adjective, f),
    ),
  ];
  if (adjective.kind === "i" && form === "past") slips.push(`${adjective.base}でした`);
  if (adjective.kind === "i" && form === "neg") slips.push(`${adjective.base}じゃないです`);
  if (adjective.base === "いい") slips.push("いくないです", "いかったです");
  return [...new Set(slips)].filter((s) => s !== correct);
}
