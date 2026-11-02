import {
  addDays,
  DAILY_TARGET_MINUTES,
  dayComplete,
  dayMinutes,
  mondayOf,
  parseYmd,
  resourceById,
  liveSessions,
  type HubState,
  type WanikaniSnapshot,
} from "@mainichi/core";
import { useState } from "react";

const HEAT_DAYS = 84;
const WEEKS_SHOWN = 8;
const RESOURCE_WINDOW_DAYS = 30;

function heatLevel(state: HubState, day: string, today: string): string {
  if (day > today) return "fut";
  const log = state.progress.log[day];
  const minutes = dayMinutes(log);
  if (dayComplete(log)) return "full";
  if (minutes >= 40) return "h3";
  if (minutes >= 20) return "h2";
  return minutes > 0 ? "h1" : "";
}

export function Heatmap({ state, today }: { state: HubState; today: string }) {
  const start = addDays(mondayOf(today), -77);
  const days = Array.from({ length: HEAT_DAYS }, (_, i) => addDays(start, i));
  const [hovered, setHovered] = useState<string | null>(null);
  const label = (day: string) => `${day}: ${dayMinutes(state.progress.log[day])} min`;
  return (
    <div className="chart">
      <div
        className="heat"
        role="img"
        aria-label="Minutos por día en las últimas 12 semanas. Hay una tabla con los datos debajo."
        onMouseLeave={() => setHovered(null)}
      >
        {days.map((day) => (
          <i
            key={day}
            className={heatLevel(state, day, today)}
            onMouseEnter={() => setHovered(day)}
          />
        ))}
      </div>
      <p className="muted num small">
        {hovered ? label(hovered) : "Pasa el cursor sobre un día para ver sus minutos."}
      </p>
      <details>
        <summary className="muted small">Ver como tabla</summary>
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Día</th>
              <th scope="col">Minutos</th>
            </tr>
          </thead>
          <tbody>
            {days
              .filter((day) => day <= today && dayMinutes(state.progress.log[day]) > 0)
              .map((day) => (
                <tr key={day}>
                  <td>{day}</td>
                  <td className="num">{dayMinutes(state.progress.log[day])}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

export function WeeklyBars({ state, today }: { state: HubState; today: string }) {
  const monday = mondayOf(today);
  const weeks = Array.from({ length: WEEKS_SHOWN }, (_, w) => {
    const start = addDays(monday, -7 * (WEEKS_SHOWN - 1 - w));
    const minutes = Array.from({ length: 7 }, (_, i) =>
      dayMinutes(state.progress.log[addDays(start, i)]),
    ).reduce((sum, m) => sum + m, 0);
    return { start, minutes };
  });
  const goal = DAILY_TARGET_MINUTES * 7;
  const max = Math.max(goal, ...weeks.map((w) => w.minutes)) * 1.12;
  return (
    <div className="chart">
      <div
        className="bars"
        role="img"
        aria-label={`Minutos por semana, con una meta de ${goal}: ${weeks.map((w) => w.minutes).join(", ")}`}
      >
        <div className="goal" style={{ bottom: `${(goal / max) * 100}%` }}>
          <span>meta {goal} min</span>
        </div>
        {weeks.map((week, i) => (
          <div
            key={week.start}
            className={`col ${i === WEEKS_SHOWN - 1 ? "now" : ""}`}
            title={`Semana del ${week.start}: ${week.minutes} min`}
          >
            <i style={{ height: `${(week.minutes / max) * 100}%` }}>
              <b>{week.minutes}</b>
            </i>
          </div>
        ))}
      </div>
      <div className="bar-axis" aria-hidden="true">
        {weeks.map((week) => {
          const date = parseYmd(week.start);
          return (
            <span key={week.start} className="num">
              {date.getDate()}/{date.getMonth() + 1}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function HorizontalBars({ rows, unit }: { rows: Array<[string, number]>; unit: string }) {
  const max = Math.max(1, ...rows.map(([, value]) => value));
  return (
    <div className="hbars">
      {rows.map(([label, value]) => (
        <div key={label} className="hbar">
          <span>{label}</span>
          <div className="track" aria-hidden="true">
            <i style={{ width: `${(value / max) * 100}%` }} />
          </div>
          <span className="num">
            {value} {unit}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ResourceTime({ state, today }: { state: HubState; today: string }) {
  const totals = new Map<string, number>();
  for (let i = 0; i < RESOURCE_WINDOW_DAYS; i++) {
    for (const session of liveSessions(state.progress.log[addDays(today, -i)])) {
      totals.set(session.resourceId, (totals.get(session.resourceId) ?? 0) + session.minutes);
    }
  }
  const rows = [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id, minutes]): [string, number] => [resourceById(id)?.name ?? id, minutes]);
  if (!rows.length) {
    return <p className="muted">Registra sesiones en Recursos para ver a qué dedicas tu tiempo.</p>;
  }
  return <HorizontalBars rows={rows} unit="min" />;
}

export function WanikaniStages({ data }: { data: WanikaniSnapshot }) {
  return (
    <HorizontalBars
      unit=""
      rows={[
        ["Apprentice", data.srs.apprentice],
        ["Guru", data.srs.guru],
        ["Master", data.srs.master],
        ["Enlightened", data.srs.enlightened],
        ["Burned", data.srs.burned],
      ]}
    />
  );
}
