import {
  addDays,
  bestStreak,
  currentStreak,
  dayMinutes,
  externalActiveDays,
  KANA,
  kanaMastered,
  liveCards,
  mondayOf,
  MONTHS_ES,
  parseYmd,
  upcomingMilestones,
} from "@mainichi/core";
import { setWeekly } from "../../state/actions";
import { useHub } from "../../state/store";
import { Heatmap, ResourceTime, WanikaniStages, WeeklyBars } from "./charts";

const WEEKLY_CHECKS = [
  ["rev", "Repasé todo lo de la semana sin ver material nuevo"],
  ["n5", "Hice preguntas de muestra del JLPT N5"],
  ["cnt", "Revisé mi avance en todas las plataformas"],
  ["ex", "Tuve un intercambio de idioma o escuché 30 min seguidos"],
] as const;

const LINKS = [
  ["https://www.jlpt.jp/e/samples/forlearners.html", "Preguntas de muestra del JLPT"],
  [
    "https://www.studyinjapan.go.jp/en/planning/scholarships/mext-scholarships/examination.html",
    "Exámenes de japonés de la beca MEXT",
  ],
  ["https://www.hellotalk.com", "HelloTalk (intercambio de idiomas)"],
] as const;

export default function ProgressPage() {
  const { state, snapshot, today } = useHub();
  const monday = mondayOf(today);
  const log = state.progress.log;
  const weekMinutes = Array.from({ length: 7 }, (_, i) =>
    dayMinutes(log[addDays(monday, i)]),
  ).reduce((sum, m) => sum + m, 0);
  const totalMinutes = Object.values(log).reduce((sum, day) => sum + dayMinutes(day), 0);
  const wanikani = snapshot.wanikani;
  const externalDays = externalActiveDays(snapshot, today);
  const mondayDate = parseYmd(monday);
  const checks = state.progress.weekly[monday] ?? {};

  const tiles: Array<[string | number, string]> = [
    [currentStreak(state, today, externalDays), "días seguidos"],
    [bestStreak(state, externalDays), "mejor racha"],
    [weekMinutes, "min esta semana"],
    [totalMinutes, "min en total"],
    [`${kanaMastered(state, "h")}/${KANA.h.length}`, "hiragana dominados"],
    [`${kanaMastered(state, "k")}/${KANA.k.length}`, "katakana dominados"],
    [liveCards(state.cards).length, "tarjetas en tu mazo"],
    [state.diary.filter((e) => !e.deletedAt).length, "entradas de diario"],
  ];

  return (
    <>
      <div className="grid g4">
        {tiles.map(([value, label]) => (
          <div key={label} className="panel tile">
            <div className="v">{value}</div>
            <div className="l">{label}</div>
          </div>
        ))}
      </div>

      <h2>Últimas 12 semanas</h2>
      <div className="panel">
        <Heatmap state={state} today={today} />
        <p className="hint">
          Cada cuadro es un día; más intenso, más minutos. El color pleno marca los días con la
          rutina completa.
        </p>
      </div>

      <h2>Minutos por semana</h2>
      <div className="panel">
        <WeeklyBars state={state} today={today} />
      </div>

      <div className="grid g2 mt">
        <div className="panel">
          <h3>Tiempo por recurso, últimos 30 días</h3>
          <ResourceTime state={state} today={today} />
        </div>
        {wanikani && (
          <div className="panel">
            <h3>WaniKani · nivel {wanikani.level}</h3>
            <WanikaniStages data={wanikani} />
          </div>
        )}
      </div>

      <div className="grid g2 mt">
        <div className="panel checklist">
          <h3>
            Revisión del domingo{" "}
            <span className="muted">
              · semana del {mondayDate.getDate()} de {MONTHS_ES[mondayDate.getMonth()]}
            </span>
          </h3>
          {WEEKLY_CHECKS.map(([id, label]) => (
            <label key={id}>
              <input
                type="checkbox"
                checked={!!checks[id]}
                onChange={(e) => setWeekly(monday, id, e.target.checked)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
        <div className="panel">
          <h3>Fechas que vienen</h3>
          <div className="milestones">
            {upcomingMilestones(state, today).map((m) => (
              <div key={m.id} className="ms">
                <span className="d">
                  {m.daysLeft}
                  <span className="muted small"> días</span>
                </span>
                <span>
                  {m.label}
                  <br />
                  <span className="muted num small">
                    {m.date}
                    {m.estimated && " (estimada)"}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <h2>Enlaces útiles</h2>
      <div className="panel">
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {LINKS.map(([href, label]) => (
            <li key={href}>
              <a href={href} target="_blank" rel="noopener noreferrer">
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
