import {
  addDays,
  blockDone,
  blockMinutes,
  BLOCKS,
  dailyPlan,
  DAILY_TARGET_MINUTES,
  dayActive,
  dayComplete,
  dayMinutes,
  DOW_JP,
  mondayOf,
  parseYmd,
  RESOURCES,
  upcomingMilestones,
  type Block,
  type PlanItem,
} from "@mainichi/core";
import { useEffect, useRef, useState } from "react";
import { setLesson, toggleBlock } from "../../state/actions";
import { isDemo, useHub } from "../../state/store";
import { startTimer, stopTimer, useTimer } from "../../state/timer";
import { Hanko, hoursSince, Jp, relativeTime, safeUrl } from "../../ui/primitives";

const pad = (n: number) => String(n).padStart(2, "0");

function Welcome() {
  return (
    <div className="banner">
      <b>Bienvenido a tu hub.</b> Puedes empezar ya: todo se guarda en este navegador.{" "}
      <a href="#ajustes">Conecta tu repositorio de datos</a> para sincronizar tus dispositivos y
      recibir alertas, o <a href="?demo">mira la demo</a>.
    </div>
  );
}

const STALE_AFTER_HOURS = 24;

/** The job can stop silently (GitHub disables schedules on idle repos), so the hub says so. */
function StaleJobNotice() {
  const { snapshot, status } = useHub();
  if (!snapshot.generatedAt || status.kind === "demo") return null;
  if (hoursSince(snapshot.generatedAt) < STALE_AFTER_HOURS) return null;
  return (
    <div className="banner" role="alert">
      El proceso automático no corre desde {relativeTime(snapshot.generatedAt)}, así que las alertas
      pueden estar detenidas. Revísalo en la pestaña Actions de tu repositorio.
    </div>
  );
}

const KANJI_DIGITS = "〇一二三四五六七八九";
/** 242 → 二四二, the way a count is often written on a sign. */
const kanjiNumber = (n: number) => [...String(n)].map((d) => KANJI_DIGITS[Number(d)]).join("");

/** «Lo que te toca» as a departure board: one row per thing waiting, coloured by its line. */
function Departures({ items }: { items: readonly PlanItem[] }) {
  return (
    <section className="panel departures" aria-labelledby="departures-title">
      <h2 id="departures-title" className="board-title">
        <Jp>発車時刻表</Jp> · Lo que te toca
      </h2>
      <ul>
        {items.map((item) => (
          <li key={item.id} className={`cat-${item.block}`}>
            <Jp className="line-mark" aria-hidden="true">
              {item.jp}
            </Jp>
            <a
              href={item.href}
              {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              <b>{item.title}</b>
              <span className="muted small">{item.detail}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The next milestone as the end of the line, and the ones before it as changes of train. */
function Destination({
  streak,
  stamp,
  celebrate,
}: {
  streak: number;
  stamp: "full" | "part" | "empty";
  celebrate: boolean;
}) {
  const { state, today } = useHub();
  const [first, ...rest] = upcomingMilestones(state, today).slice(0, 3);
  return (
    <section className="panel destination" aria-labelledby="destination-title">
      <h2 id="destination-title" className="board-title">
        <Jp>終点</Jp> · Destino
      </h2>
      {first ? (
        <>
          <p className="dest-name">{first.label}</p>
          <p className="dest-days">
            <Jp className="display" aria-hidden="true">
              {kanjiNumber(first.daysLeft)}
            </Jp>
            <span>
              <b className="num">{first.daysLeft}</b> días de viaje
              {first.estimated && <span className="muted"> (est.)</span>}
            </span>
          </p>
        </>
      ) : (
        <p className="muted">Agrega tus fechas en Ajustes para ver cuánto falta.</p>
      )}
      {rest.map((m) => (
        <p key={m.id} className="transfer small">
          Transbordo: {m.short || m.label}, en <b className="num">{m.daysLeft}</b> días
          {m.estimated && <span className="muted"> (est.)</span>}
        </p>
      ))}
      <div className="streak">
        <div>
          <div className="big num">{streak}</div>
          <div className="muted">{streak === 1 ? "día seguido" : "días seguidos"}</div>
        </div>
        <Hanko state={stamp} pop={celebrate} />
      </div>
    </section>
  );
}

/** One block of the routine as a station on the day's line, with a square per minute. */
function Stop({ block, here }: { block: Block; here: boolean }) {
  const { state, today } = useHub();
  const running = useTimer();
  const log = state.progress.log[today];
  const done = blockDone(log, block);
  const minutes = blockMinutes(log, block.id);
  const isRunning = running?.block === block.id;
  const links = RESOURCES.filter((r) => r.block === block.id);
  const seconds = isRunning ? running.secondsLeft : block.minutes * 60;
  const filled = done ? block.minutes : Math.min(minutes, block.minutes);

  return (
    <div className={`stop cat-${block.id}${done ? " done" : ""}${here ? " is-here" : ""}`}>
      <div className="stop-head">
        <Jp className="stop-mark" aria-hidden="true">
          {block.jp.slice(0, 1)}
        </Jp>
        <div>
          <h3>
            <Jp>{block.jp}</Jp> {block.title}
          </h3>
          <div className="muted small num">
            {filled} de {block.minutes} min{here && " · estás aquí"}
          </div>
        </div>
        {done && (
          <span className="stamp">
            <Hanko state="full" small />
          </span>
        )}
      </div>
      <div className="cells" aria-hidden="true">
        {Array.from({ length: block.minutes }, (_, i) => (
          <i key={i} className={i < filled ? "on" : undefined} />
        ))}
      </div>
      <div className="muted small">{block.description}</div>
      <div className="row small">
        {links.map((r) => (
          <a
            key={r.id}
            href={safeUrl(state.resources[r.id]?.url ?? "", r.url)}
            {...(r.url.startsWith("#") ? {} : { target: "_blank", rel: "noopener noreferrer" })}
          >
            {r.name}
          </a>
        ))}
      </div>
      {block.id === "les" && (
        <input
          type="text"
          key={log?.lesson ?? ""}
          defaultValue={log?.lesson ?? ""}
          placeholder="¿Qué clase viste?…"
          aria-label="Clase vista hoy"
          onBlur={(e) => {
            const value = e.target.value.trim();
            if (value !== (log?.lesson ?? "")) setLesson(value);
          }}
        />
      )}
      <div className="timer" role={isRunning ? "timer" : undefined}>
        {pad(Math.floor(seconds / 60))}:{pad(seconds % 60)}
      </div>
      <div className="row">
        {isRunning ? (
          <button type="button" className="btn shu small" onClick={() => stopTimer()}>
            Detener y guardar
          </button>
        ) : (
          <button
            type="button"
            className={here ? "btn small" : "btn ghost small"}
            onClick={() => startTimer(block.id)}
          >
            Empezar
          </button>
        )}
        <button type="button" className="btn ghost small" onClick={() => toggleBlock(block.id)}>
          {log?.blocks[block.id]?.done ? "Desmarcar" : "Marcar hecho"}
        </button>
      </div>
    </div>
  );
}

function Week() {
  const { state, today } = useHub();
  const monday = mondayOf(today);
  return (
    <div className="week">
      {Array.from({ length: 7 }, (_, i) => {
        const day = addDays(monday, i);
        const date = parseYmd(day);
        const log = state.progress.log[day];
        const stamp = dayComplete(log) ? "full" : dayActive(state, day) ? "part" : "empty";
        return (
          <div key={day} className={`day ${day === today ? "today" : ""}`}>
            <Jp className="dn">{DOW_JP[date.getDay()]}</Jp>
            <div className="dm num">
              {date.getDate()} · {dayMinutes(log)}′
            </div>
            <div className="mt">
              <Hanko state={stamp} small />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function TodayPage() {
  const { state, snapshot, today } = useHub();
  const plan = dailyPlan(state, snapshot, today);
  const log = state.progress.log[today];
  const minutes = dayMinutes(log);
  const complete = dayComplete(log);
  const stamp = complete ? "full" : plan.studied ? "part" : "empty";

  const wasComplete = useRef(complete);
  const [celebrate, setCelebrate] = useState(false);
  useEffect(() => {
    if (complete && !wasComplete.current) setCelebrate(true);
    wasComplete.current = complete;
  }, [complete]);

  const isNew = !isDemo && !state.updatedAt;
  // The first block not done yet is where the learner is on today's line.
  const here = BLOCKS.findIndex((b) => !blockDone(log, b));

  return (
    <>
      {isNew && <Welcome />}
      <StaleJobNotice />

      <section className="panel route" aria-labelledby="route-title">
        <div className="row between">
          <h2 id="route-title" className="board-title">
            <Jp>本日の路線</Jp> · Tu ruta de hoy
          </h2>
          <span className="muted">
            {here >= 0 ? `Estación ${here + 1} de ${BLOCKS.length}` : "Llegaste"} ·{" "}
            <b className="num">
              {minutes} de {DAILY_TARGET_MINUTES} min
            </b>
          </span>
        </div>
        <p className="hint">Cada casilla es un minuto: se llenan de tinta a medida que estudias.</p>
        <div className="stops">
          {BLOCKS.map((block, i) => (
            <Stop key={block.id} block={block} here={i === here} />
          ))}
        </div>
      </section>

      <div className="board-row">
        <Departures items={plan.items} />
        <Destination streak={plan.streak} stamp={stamp} celebrate={celebrate} />
      </div>

      <h2>Esta semana</h2>
      <Week />
      <p className="hint">
        Un sello lleno marca un día con las cuatro partes de la rutina; uno punteado, un día con
        algo de práctica.
      </p>
    </>
  );
}
