/** Color tokens consumed by the stylesheets as CSS custom properties. */
export interface Tokens {
  paper: string;
  surface: string;
  ink: string;
  muted: string;
  rule: string;
  ai: string;
  onAi: string;
  shu: string;
  onShu: string;
  ok: string;
  warn: string;
}

export interface Palette {
  id: string;
  name: string;
  jp: string;
  description: string;
  light: Tokens;
  dark: Tokens;
}

/**
 * Each palette borrows from a traditional Japanese color family. Contrast is checked in
 * `palettes.test.ts`, so every pairing used for text stays readable in both modes.
 */
export const PALETTES: readonly Palette[] = [
  {
    id: "ai",
    name: "Índigo",
    jp: "藍",
    description: "Tinta índigo y sello bermellón sobre papel de cuaderno. La original.",
    light: {
      paper: "#f1f2ee",
      surface: "#ffffff",
      ink: "#1c2333",
      muted: "#5b6273",
      rule: "#d7dad1",
      ai: "#2e4a7d",
      onAi: "#ffffff",
      shu: "#c2412f",
      onShu: "#ffffff",
      ok: "#2d7a57",
      warn: "#8f5a0e",
    },
    dark: {
      paper: "#12161f",
      surface: "#1a202b",
      ink: "#e7e5de",
      muted: "#a2a8b4",
      rule: "#2a3243",
      ai: "#93aee0",
      onAi: "#12161f",
      shu: "#e46650",
      onShu: "#12161f",
      ok: "#5dba8d",
      warn: "#e0a24a",
    },
  },
  {
    id: "matcha",
    name: "Matcha",
    jp: "抹茶",
    description: "Verde té y madera tostada. Tranquila, para sesiones largas.",
    light: {
      paper: "#f2f1e8",
      surface: "#fffef9",
      ink: "#23281f",
      muted: "#5a6152",
      rule: "#d9dbcb",
      ai: "#3c6a37",
      onAi: "#ffffff",
      shu: "#a8502a",
      onShu: "#ffffff",
      ok: "#1f6b75",
      warn: "#87570b",
    },
    dark: {
      paper: "#141712",
      surface: "#1c211a",
      ink: "#e6e8dd",
      muted: "#a3aa98",
      rule: "#2e3529",
      ai: "#9cc48f",
      onAi: "#141712",
      shu: "#e08a5c",
      onShu: "#141712",
      ok: "#6cc3c9",
      warn: "#e0a84a",
    },
  },
  {
    id: "sakura",
    name: "Sakura",
    jp: "桜",
    description: "Ciruela y flor de cerezo. Cálida, con más personalidad.",
    light: {
      paper: "#f7f1f2",
      surface: "#ffffff",
      ink: "#2b1f27",
      muted: "#6b5a63",
      rule: "#e5d6da",
      ai: "#8a3a5c",
      onAi: "#ffffff",
      shu: "#b83a53",
      onShu: "#ffffff",
      ok: "#2d7a57",
      warn: "#8f5a0e",
    },
    dark: {
      paper: "#1a1418",
      surface: "#231b20",
      ink: "#f0e6ea",
      muted: "#b9a6af",
      rule: "#3a2d34",
      ai: "#e4a1be",
      onAi: "#1a1418",
      shu: "#f08aa0",
      onShu: "#1a1418",
      ok: "#6cc79a",
      warn: "#e3a653",
    },
  },
  {
    id: "umi",
    name: "Mar",
    jp: "海",
    description: "Azul profundo y coral. Fresca y con mucho contraste.",
    light: {
      paper: "#eef3f4",
      surface: "#ffffff",
      ink: "#142530",
      muted: "#50626c",
      rule: "#d2dee1",
      ai: "#0f5e73",
      onAi: "#ffffff",
      shu: "#b84a26",
      onShu: "#ffffff",
      ok: "#2d7a57",
      warn: "#8f5a0e",
    },
    dark: {
      paper: "#0e1a20",
      surface: "#15242c",
      ink: "#e2ecef",
      muted: "#9db1b9",
      rule: "#24363f",
      ai: "#7cc6d6",
      onAi: "#0e1a20",
      shu: "#f08a66",
      onShu: "#0e1a20",
      ok: "#63c29a",
      warn: "#e0a24a",
    },
  },
  {
    id: "sumi",
    name: "Tinta",
    jp: "墨",
    description: "Blanco y negro de caligrafía con un toque dorado. Sobria y sin distracciones.",
    light: {
      paper: "#f3f2ef",
      surface: "#ffffff",
      ink: "#1a1a1a",
      muted: "#5e5e5e",
      rule: "#d8d6d0",
      ai: "#2b2b2b",
      onAi: "#ffffff",
      shu: "#8a5e0f",
      onShu: "#ffffff",
      ok: "#2d6a4f",
      warn: "#8f3b1b",
    },
    dark: {
      paper: "#111111",
      surface: "#1a1a1a",
      ink: "#eceae4",
      muted: "#a8a6a0",
      rule: "#2e2e2e",
      ai: "#e8e6e0",
      onAi: "#111111",
      shu: "#d9a441",
      onShu: "#111111",
      ok: "#6dbf95",
      warn: "#e3a653",
    },
  },
];

export const paletteById = (id: string) =>
  PALETTES.find((p) => p.id === id) ?? (PALETTES[0] as Palette);

const CSS_NAMES: Record<keyof Tokens, string> = {
  paper: "--paper",
  surface: "--surface",
  ink: "--ink",
  muted: "--muted",
  rule: "--rule",
  ai: "--ai",
  onAi: "--on-ai",
  shu: "--shu",
  onShu: "--on-shu",
  ok: "--ok",
  warn: "--warn",
};

export const cssVariables = (tokens: Tokens): Record<string, string> =>
  Object.fromEntries(Object.entries(tokens).map(([k, v]) => [CSS_NAMES[k as keyof Tokens], v]));
