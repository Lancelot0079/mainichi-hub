import { lazy, Suspense, useEffect, useState, type ComponentType } from "react";
import { useHub, type SyncStatus } from "../state/store";
import { Jp, relativeTime } from "../ui/primitives";
import { Toaster } from "../ui/toast";
import { TodayPage } from "../features/today/TodayPage";

const page = (load: () => Promise<{ default: ComponentType }>) => lazy(load);

const ROUTES = [
  { id: "hoy", jp: "今日", label: "Hoy", Page: TodayPage },
  {
    id: "lecciones",
    jp: "課",
    label: "Lecciones",
    Page: page(() => import("../features/lessons/LessonsPage")),
  },
  {
    id: "recursos",
    jp: "資料",
    label: "Recursos",
    Page: page(() => import("../features/resources/ResourcesPage")),
  },
  {
    id: "escucha",
    jp: "聴解",
    label: "Escucha",
    Page: page(() => import("../features/listening/ListeningPage")),
  },
  { id: "kana", jp: "仮名", label: "Kana", Page: page(() => import("../features/kana/KanaPage")) },
  {
    id: "tarjetas",
    jp: "単語",
    label: "Tarjetas",
    Page: page(() => import("../features/cards/CardsPage")),
  },
  {
    id: "diario",
    jp: "日記",
    label: "Diario",
    Page: page(() => import("../features/diary/DiaryPage")),
  },
  {
    id: "examen",
    jp: "試験",
    label: "Examen",
    Page: page(() => import("../features/exam/ExamPage")),
  },
  {
    id: "progreso",
    jp: "記録",
    label: "Progreso",
    Page: page(() => import("../features/progress/ProgressPage")),
  },
  {
    id: "ajustes",
    jp: "設定",
    label: "Ajustes",
    Page: page(() => import("../features/settings/SettingsPage")),
  },
  {
    id: "guia",
    jp: "案内",
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

export function App() {
  const route = useRoute();
  const { status } = useHub();
  const { Page } = route;

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
      <div className="wrap">
        <header className="top">
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
        </header>
        <nav className="tabs" aria-label="Secciones">
          {ROUTES.filter((r) => !("hidden" in r)).map((r) => (
            <a key={r.id} href={`#${r.id}`} aria-current={r.id === route.id ? "page" : undefined}>
              <Jp className="jp">{r.jp}</Jp>
              {r.label}
            </a>
          ))}
        </nav>
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
      <Toaster />
    </>
  );
}
