import type { BlockId } from "./schema";

/** How data gets from a platform into the hub. See docs/integrations.md. */
export type IntegrationMode = "api" | "local" | "manual";

export interface Resource {
  id: string;
  name: string;
  jp: string;
  description: string;
  url: string;
  mode: IntegrationMode;
  block: BlockId;
  /** Label for manual progress, e.g. "clases". Absent when there is nothing to count. */
  unit?: string;
  defaultTotal?: number;
}

export const RESOURCES: readonly Resource[] = [
  {
    id: "wanikani",
    name: "WaniKani",
    jp: "鰐",
    description: "Kanji y vocabulario con repetición espaciada.",
    url: "https://www.wanikani.com/dashboard",
    mode: "api",
    block: "srs",
  },
  {
    id: "anki",
    name: "Anki",
    jp: "暗",
    description: "Tus mazos. Se conecta con Anki abierto en tu PC.",
    url: "https://ankiweb.net/decks",
    mode: "local",
    block: "srs",
  },
  {
    id: "bunpro",
    name: "Bunpro",
    jp: "文",
    description: "Gramática con repetición espaciada.",
    url: "https://bunpro.jp/dashboard",
    mode: "manual",
    block: "srs",
  },
  {
    id: "udemy",
    name: "Udemy",
    jp: "授",
    description: "Tu curso de japonés. Pega el enlace del curso y lleva tus clases.",
    url: "https://www.udemy.com/home/my-courses/learning/",
    mode: "manual",
    block: "les",
    unit: "clases",
  },
  {
    id: "busuu",
    name: "Busuu",
    jp: "話",
    description: "Lecciones cortas y práctica de conversación.",
    url: "https://www.busuu.com/dashboard",
    mode: "manual",
    block: "les",
    unit: "lecciones",
  },
  {
    id: "genki",
    name: "Genki",
    jp: "元",
    description: "Libro de texto. Marca las lecciones que completas.",
    url: "https://genki3.japantimes.co.jp/en/",
    mode: "manual",
    block: "les",
    unit: "lecciones",
    defaultTotal: 23,
  },
  {
    id: "escucha",
    name: "Biblioteca de escucha",
    jp: "耳",
    description: "Tus podcasts, anime, canciones y películas, con sesiones guiadas.",
    url: "#escucha",
    mode: "manual",
    block: "lis",
  },
  {
    id: "teppei",
    name: "Nihongo con Teppei",
    jp: "聴",
    description: "Podcast para principiantes.",
    url: "https://nihongoconteppei.com",
    mode: "manual",
    block: "lis",
  },
  {
    id: "langcorrect",
    name: "LangCorrect",
    jp: "添",
    description: "Correcciones de nativos para tu diario.",
    url: "https://langcorrect.com",
    mode: "manual",
    block: "out",
  },
];

export const resourceById = (id: string) => RESOURCES.find((r) => r.id === id);
