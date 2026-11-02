import type { BlockId, ListeningKind, ListeningLevel } from "./schema";

export interface ListeningKindInfo {
  id: ListeningKind;
  label: string;
  jp: string;
  /** A short routine that turns passive listening into practice. */
  method: readonly string[];
}

export const LISTENING_KINDS: readonly ListeningKindInfo[] = [
  {
    id: "podcast",
    label: "Podcast",
    jp: "音声",
    method: [
      "Escucha el episodio completo sin pausar y busca la idea general.",
      "Escúchalo otra vez y pausa en las frases que casi entiendes.",
      "Haz shadowing: repite 3 frases justo detrás del audio.",
      "Guarda 2 o 3 palabras nuevas como tarjetas.",
    ],
  },
  {
    id: "video",
    label: "Video",
    jp: "動画",
    method: [
      "Mira el video completo apoyándote en las imágenes y los gestos.",
      "Vuelve a las partes que no entendiste.",
      "Repite en voz alta 3 frases útiles.",
      "Guarda 2 o 3 palabras nuevas como tarjetas.",
    ],
  },
  {
    id: "anime",
    label: "Anime",
    jp: "アニメ",
    method: [
      "Mira una escena de 5 a 10 minutos con subtítulos en japonés, no en español.",
      "Vuelve a ver las frases que no entendiste.",
      "Repite en voz alta una frase que te sirva en la vida diaria.",
      "Guarda frases útiles y evita copiar las dramáticas o groseras.",
    ],
  },
  {
    id: "serie",
    label: "Serie",
    jp: "ドラマ",
    method: [
      "Mira una escena de 10 minutos con subtítulos en japonés.",
      "Vuelve a ver la escena sin subtítulos.",
      "Repite en voz alta una frase útil.",
      "Guarda 3 expresiones como tarjetas.",
    ],
  },
  {
    id: "pelicula",
    label: "Película",
    jp: "映画",
    method: [
      "Divídela en escenas de 10 minutos; no la veas de un tirón.",
      "La primera vez usa subtítulos en japonés, o en español si te pierdes.",
      "Repite la escena sin subtítulos.",
      "Guarda 3 expresiones como tarjetas.",
    ],
  },
  {
    id: "cancion",
    label: "Canción",
    jp: "歌",
    method: [
      "Escúchala sin letra para disfrutarla y captar palabras sueltas.",
      "Lee la letra en un sitio con licencia mientras la escuchas.",
      "Canta el coro justo detrás del audio.",
      "Guarda 2 palabras de la letra como tarjetas.",
    ],
  },
  {
    id: "noticias",
    label: "Noticias",
    jp: "ニュース",
    method: [
      "Lee el titular e intenta adivinar el tema.",
      "Escucha el audio sin leer.",
      "Lee el texto con furigana y vuelve a escuchar.",
      "Guarda 3 palabras del artículo como tarjetas.",
    ],
  },
];

export const LEVEL_LABEL: Record<ListeningLevel, string> = {
  inicial: "Inicial",
  basico: "Básico",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

export interface CatalogItem {
  id: string;
  title: string;
  kind: ListeningKind;
  level: ListeningLevel;
  why: string;
  /** Official page when it was verified; otherwise the item opens a search. */
  url?: string;
  search: string;
}

/** Recommended starting material. Each entry was checked against public sources in 2026. */
export const LISTENING_CATALOG: readonly CatalogItem[] = [
  {
    id: "cijapanese",
    title: "Comprehensible Japanese",
    kind: "video",
    level: "inicial",
    why: "Videos hablados despacio, con dibujos y gestos, y etiquetados por nivel. Empieza por la lista para principiantes absolutos; cerca de la mitad es gratis.",
    url: "https://cijapanese.com",
    search: "Comprehensible Japanese complete beginner",
  },
  {
    id: "megs-diary",
    title: "JLPT N5 Japanese Podcast for Beginners (Meg's Diary)",
    kind: "podcast",
    level: "inicial",
    why: "Pensado para nivel N5 / A1: el punto de partida más seguro en podcast.",
    url: "https://podcasts.apple.com/us/podcast/id1736653108",
    search: "Meg's Diary JLPT N5 Japanese podcast",
  },
  {
    id: "teppei",
    title: "Nihongo con Teppei (para principiantes)",
    kind: "podcast",
    level: "basico",
    why: "Episodios de unos 4 minutos sobre temas cotidianos. Teppei casi no baja la velocidad: úsalo cuando ya sigas frases básicas.",
    url: "https://nihongoconteppei.com",
    search: "Nihongo con Teppei beginners",
  },
  {
    id: "japanese-with-shun",
    title: "Japanese with Shun",
    kind: "podcast",
    level: "basico",
    why: "Usa la gramática de Genki I y algo de Genki II, así que acompaña lo que estudias.",
    search: "Japanese with Shun podcast",
  },
  {
    id: "slow-japanese",
    title: "Slow Japanese (Akari)",
    kind: "podcast",
    level: "basico",
    why: "Japonés pausado para niveles A1 a B1.",
    search: "Slow Japanese Akari podcast",
  },
  {
    id: "nhk-easy",
    title: "NHK News Web Easy",
    kind: "noticias",
    level: "intermedio",
    why: "Noticias reales en japonés simplificado, con audio y furigana. Ideal desde N4.",
    url: "https://www3.nhk.or.jp/news/easy/",
    search: "NHK News Web Easy",
  },
  {
    id: "shirokuma",
    title: "しろくまカフェ (Polar Bear Café)",
    kind: "anime",
    level: "basico",
    why: "Vida cotidiana con lenguaje simple y pronunciación clara.",
    search: "しろくまカフェ アニメ",
  },
  {
    id: "usagi-drop",
    title: "うさぎドロップ (Usagi Drop)",
    kind: "anime",
    level: "basico",
    why: "Diálogos sencillos y una historia fácil de seguir.",
    search: "うさぎドロップ アニメ",
  },
  {
    id: "doraemon",
    title: "ドラえもん (Doraemon)",
    kind: "anime",
    level: "intermedio",
    why: "Diálogos accesibles cuando ya superas el nivel inicial.",
    search: "ドラえもん アニメ",
  },
  {
    id: "gokushufudou",
    title: "極主夫道 (The Way of the Househusband)",
    kind: "anime",
    level: "intermedio",
    why: "Ritmo más pausado que el anime típico. Ojo: el protagonista habla como yakuza, no copies ese registro.",
    search: "極主夫道 アニメ",
  },
  {
    id: "totoro",
    title: "となりのトトロ (Mi vecino Totoro)",
    kind: "pelicula",
    level: "basico",
    why: "Las protagonistas son niñas, así que hablan simple y claro.",
    search: "となりのトトロ",
  },
  {
    id: "kiki",
    title: "魔女の宅急便 (Kiki: entregas a domicilio)",
    kind: "pelicula",
    level: "basico",
    why: "Diálogos cotidianos y claros, de una protagonista joven.",
    search: "魔女の宅急便",
  },
  {
    id: "ue-wo-muite",
    title: "上を向いて歩こう (坂本九)",
    kind: "cancion",
    level: "basico",
    why: "Melodía lenta y pronunciación muy clara; un clásico que todo Japón conoce.",
    search: "上を向いて歩こう 坂本九",
  },
  {
    id: "sanpo",
    title: "さんぽ (canción de Mi vecino Totoro)",
    kind: "cancion",
    level: "inicial",
    why: "Letra infantil con vocabulario básico y ritmo marcado, ideal para cantar.",
    search: "さんぽ となりのトトロ 歌",
  },
];

/** Where an item opens: its own link, or a search when there is no verified page. */
export function listeningLink(item: { url?: string; title: string; kind: ListeningKind }): string {
  if (item.url) return item.url;
  const query = encodeURIComponent(item.title);
  const video = item.kind === "anime" || item.kind === "pelicula" || item.kind === "serie";
  return video
    ? `https://www.google.com/search?q=${query}+d%C3%B3nde+ver`
    : `https://www.youtube.com/results?search_query=${query}`;
}

/** Color family per kind, so the library reads at a glance; the label always names the kind. */
export const KIND_BLOCK: Record<ListeningKind, BlockId> = {
  podcast: "lis",
  cancion: "lis",
  video: "les",
  noticias: "les",
  anime: "out",
  serie: "out",
  pelicula: "srs",
};

export const kindInfo = (kind: ListeningKind) =>
  LISTENING_KINDS.find((k) => k.id === kind) ?? (LISTENING_KINDS[0] as ListeningKindInfo);
