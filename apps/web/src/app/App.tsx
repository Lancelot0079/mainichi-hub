import { lazy, Suspense, useEffect, useState, type ComponentType, type CSSProperties } from "react";
import { DOW_ES, MONTHS_ES, parseYmd } from "@mainichi/core";
import { useHub, type SyncStatus } from "../state/store";
import { Jp, relativeTime } from "../ui/primitives";
import { Toaster } from "../ui/toast";
import { TodayPage } from "../features/today/TodayPage";
import { Tour } from "../features/tour/Tour";
import { useTourOpen } from "../features/tour/tour-state";

const page = (load: () => Promise<{ default: ComponentType }>) => lazy(load);

const ROUTES = [
  {
    id: "hoy",
    jp: "今日",
    mark: "今",
    reading: "きょう",
    line: "var(--shu)",
    label: "Hoy",
    Page: TodayPage,
  },
  {
    id: "lecciones",
    jp: "課",
    mark: "課",
    reading: "か",
    line: "var(--c-les)",
    label: "Lecciones",
    Page: page(() => import("../features/lessons/LessonsPage")),
  },
  {
    id: "recursos",
    jp: "資料",
    mark: "資",
    reading: "しりょう",
    line: "var(--ai)",
    label: "Recursos",
    Page: page(() => import("../features/resources/ResourcesPage")),
  },
  {
    id: "escucha",
    jp: "聴解",
    mark: "聴",
    reading: "ちょうかい",
    line: "var(--c-lis)",
    label: "Escucha",
    Page: page(() => import("../features/listening/ListeningPage")),
  },
  {
    id: "kana",
    jp: "仮名",
    mark: "仮",
    reading: "かな",
    line: "var(--c-les)",
    label: "Kana",
    Page: page(() => import("../features/kana/KanaPage")),
  },
  {
    id: "tarjetas",
    jp: "単語",
    mark: "語",
    reading: "たんご",
    line: "var(--c-srs)",
    label: "Tarjetas",
    Page: page(() => import("../features/cards/CardsPage")),
  },
  {
    id: "diario",
    jp: "日記",
    mark: "書",
    reading: "にっき",
    line: "var(--c-out)",
    label: "Diario",
    Page: page(() => import("../features/diary/DiaryPage")),
  },
  {
    id: "examen",
    jp: "試験",
    mark: "試",
    reading: "しけん",
    line: "var(--ink)",
    label: "Examen",
    Page: page(() => import("../features/exam/ExamPage")),
  },
  {
    id: "progreso",
    jp: "記録",
    mark: "録",
    reading: "きろく",
    line: "var(--muted)",
    label: "Progreso",
    Page: page(() => import("../features/progress/ProgressPage")),
  },
  {
    id: "ajustes",
    jp: "設定",
    mark: "設",
    reading: "せってい",
    line: "var(--muted)",
    label: "Ajustes",
    Page: page(() => import("../features/settings/SettingsPage")),
  },
  {
    id: "guia",
    jp: "案内",
    mark: "案",
    reading: "あんない",
    line: "var(--muted)",
    label: "Guía",
    Page: page(() => import("../features/guide/GuidePage")),
    hidden: true,
  },
] as const;

function useRoute() {
  const read = () => {
    const hash = location.hash.slice(1);
    return ROUTES.find((r) => r.id === hash) ?? ROUTES[0];
  };
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const onChange = () => {
      setRoute(read());
      scrollTo(0, 0);
    };
    addEventListener("hashchange", onChange);
    return () => removeEventListener("hashchange", onChange);
  }, []);
  return route;
}

function StatusPill({ status }: { status: SyncStatus }) {
  const view = {
    demo: ["warn", "Datos de ejemplo"],
    local: ["warn", "Solo en este navegador"],
    syncing: ["", "Sincronizando…"],
    synced: ["ok", "Sincronizado"],
    error: ["bad", "Sin sincronizar"],
  }[status.kind];
  const title =
    status.kind === "error"
      ? status.message
      : status.kind === "synced"
        ? relativeTime(status.at)
        : undefined;
  return (
    <a className={`pill ${view[0]}`} href="#ajustes" title={title}>
      <span className="dot" />
      {view[1]}
    </a>
  );
}

const VISIBLE = ROUTES.filter((r) => !("hidden" in r));

/** Each section is a line on the rail; its color comes from the palette. */
const lineStyle = (line: string) => ({ "--line": line }) as CSSProperties;

/** The sign at the top of every section, like a station name board: this stop and its neighbours. */
function StationSign({ route }: { route: (typeof ROUTES)[number] }) {
  const { today } = useHub();
  const date = parseYmd(today);
  const at = VISIBLE.findIndex((r) => r.id === route.id);
  const prev = at > 0 ? VISIBLE[at - 1] : undefined;
  const next = at >= 0 && at < VISIBLE.length - 1 ? VISIBLE[at + 1] : undefined;
  return (
    <div className="sign" style={lineStyle(route.line)}>
      <div className="sign-name">
        <Jp className="sign-jp">{route.jp}</Jp>
        <span className="sign-reading">
          <span lang="ja">{route.reading}</span> · {route.label}
        </span>
      </div>
      <div className="sign-band" />
      <nav className="sign-nav" aria-label="Estaciones vecinas">
        {prev ? (
          <a href={`#${prev.id}`}>
            ← <Jp>{prev.jp}</Jp> <span className="sign-label">{prev.label}</span>
          </a>
        ) : (
          <span />
        )}
        <span className="sign-date muted small">
          {DOW_ES[date.getDay()]} {date.getDate()} de {MONTHS_ES[date.getMonth()]}
        </span>
        {next ? (
          <a href={`#${next.id}`}>
            <span className="sign-label">{next.label}</span> <Jp>{next.jp}</Jp> →
          </a>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}

export function App() {
  const route = useRoute();
  const { status } = useHub();
  const { Page } = route;
  const touring = useTourOpen();

  useEffect(() => {
    document.title = `${route.label} · Mainichi Hub`;
  }, [route]);

  return (
    <>
      <button
        type="button"
        className="skip"
        onClick={() => document.getElementById("main")?.focus()}
      >
        Saltar al contenido
      </button>
      <div className="shell">
        <nav className={touring ? "rail touring" : "rail"} aria-label="Secciones">
          <Jp className="rail-brand" aria-hidden="true">
            毎日線
          </Jp>
          {VISIBLE.map((r) => (
            <a
              key={r.id}
              href={`#${r.id}`}
              className="station"
              style={lineStyle(r.line)}
              aria-current={r.id === route.id ? "page" : undefined}
            >
              <Jp className="mark" aria-hidden="true">
                {r.mark}
              </Jp>
              <span className="name">{r.label}</span>
            </a>
          ))}
        </nav>
        <div className="wrap">
          <header>
            <div className="top">
              <div className="brand">
                <h1>
                  <Jp>毎日日本語</Jp>
                </h1>
                <span>Tu hub de japonés · rumbo al JLPT</span>
              </div>
              <div className="row">
                <a
                  className="pill"
                  href="#guia"
                  aria-current={route.id === "guia" ? "page" : undefined}
                >
                  <span lang="ja">案内</span> Guía
                </a>
                <StatusPill status={status} />
              </div>
            </div>
            <StationSign route={route} />
          </header>

          <main id="main" tabIndex={-1}>
            {status.kind === "demo" && (
              <div className="banner">
                Estás viendo datos de ejemplo. Nada de lo que hagas aquí se guarda.{" "}
                <a href={location.pathname}>Salir de la demo</a>
              </div>
            )}
            <Suspense fallback={<p className="muted">Cargando…</p>}>
              <div key={route.id} className="page">
                <Page />
              </div>
            </Suspense>
          </main>
        </div>
      </div>
      {touring && <Tour />}
      <Toaster />
    </>
  );
}
