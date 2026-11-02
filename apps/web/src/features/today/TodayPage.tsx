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
  DOW_ES,
  DOW_JP,
  mondayOf,
  MONTHS_ES,
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

function PlanCard({ item }: { item: PlanItem }) {
  const external = item.external ? { target: "_blank", rel: "noopener noreferrer" } : {};
  return (
    <a className="panel plan-item" href={item.href} {...external}>
      <Jp className="glyph">{item.jp}</Jp>
      <span>
        <b>{item.title}</b>
        <br />
        <span className="muted small">{item.detail}</span>
      </span>
    </a>
  );
}

function BlockCard({ block }: { block: Block }) {
  const { state, today } = useHub();
  const running = useTimer();
  const log = state.progress.log[today];
  const done = blockDone(log, block);
  const minutes = blockMinutes(log, block.id);
  const isRunning = running?.block === block.id;
  const links = RESOURCES.filter((r) => r.block === block.id);
  const seconds = isRunning ? running.secondsLeft : block.minutes * 60;

  return (
    <div className={`panel block ${done ? "done" : ""}`}>
      {done && (
        <span className="stamp">
          <Hanko state="full" small />
        </span>
      )}
      <Jp className="kanji">{block.jp}</Jp>
      <h3>
        {block.title} · {block.minutes} min
      </h3>
      <div className="muted small">{block.description}</div>
      <div className="row small">
        {links.map((r) => (
          <a
            key={r.id}
            href={safeUrl(state.resources[r.id]?.url ?? "", r.url)}
            target="_blank"
            rel="noopener noreferrer"
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
      <div className="muted num small">{minutes ? `${minutes} min registrados hoy` : " "}</div>
      <div className="row">
        {isRunning ? (
          <button type="button" className="btn shu small" onClick={() => stopTimer()}>
            Detener y guardar
          </button>
        ) : (
          <button type="button" className="btn small" onClick={() => startTimer(block.id)}>
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
  const date = parseYmd(today);
  const complete = dayComplete(log);
  const stamp = complete ? "full" : plan.studied ? "part" : "empty";

  const wasComplete = useRef(complete);
  const [celebrate, setCelebrate] = useState(false);
  useEffect(() => {
    if (complete && !wasComplete.current) setCelebrate(true);
    wasComplete.current = complete;
  }, [complete]);

  const isNew = !isDemo && !state.updatedAt;
  const milestones = upcomingMilestones(state, today).slice(0, 3);

  return (
    <>
      {isNew && <Welcome />}
      <StaleJobNotice />
      <div className="panel today-head">
        <div>
          <Jp className="date-jp">
            {date.getMonth() + 1}月{date.getDate()}日({DOW_JP[date.getDay()]})
          </Jp>
          <div className="muted">
            {DOW_ES[date.getDay()]} {date.getDate()} de {MONTHS_ES[date.getMonth()]} de{" "}
            {date.getFullYear()}
          </div>
          <div className="chips">
            {milestones.map((m) => (
              <span key={m.id} className="chip">
                {m.short || m.label}: <b className="num">{m.daysLeft}</b> días{" "}
                {m.estimated && <span className="muted">(est.)</span>}
              </span>
            ))}
          </div>
        </div>
        <div className="streak">
          <div>
            <div className="big num">{plan.streak}</div>
            <div className="muted">{plan.streak === 1 ? "día seguido" : "días seguidos"}</div>
          </div>
          <Hanko state={stamp} pop={celebrate} />
        </div>
      </div>

      <h2>Lo que te toca</h2>
      <div className="grid g2">
        {plan.items.map((item) => (
          <PlanCard key={item.id} item={item} />
        ))}
      </div>

      <h2>
        Rutina de hoy{" "}
        <small>
          {minutes} de {DAILY_TARGET_MINUTES} min
        </small>
      </h2>
      <div className="bar" aria-hidden="true">
        <i style={{ width: `${Math.min(100, (minutes / DAILY_TARGET_MINUTES) * 100)}%` }} />
      </div>
      <div className="grid g4 mt">
        {BLOCKS.map((block) => (
          <BlockCard key={block.id} block={block} />
        ))}
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
