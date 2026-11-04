import { useEffect, useRef, useState } from "react";
import { Jp } from "../../ui/primitives";
import { closeTour } from "./tour-state";

interface TourStep {
  /** The section shown behind the dialog while this step is open. */
  route: string;
  jp: string;
  title: string;
  points: readonly string[];
  tip?: string;
}

export const TOUR_STEPS: readonly TourStep[] = [
  {
    route: "hoy",
    jp: "毎日",
    title: "Bienvenido a Mainichi Hub",
    points: [
      "Es tu centro de estudio de japonés: aquí planeas el día, aprendes, repasas y mides tu avance rumbo al JLPT.",
      "Todo se guarda en este navegador, y si lo conectas, en un repositorio privado tuyo que sincroniza tus dispositivos.",
      "Este recorrido te muestra cada sección en un minuto. Puedes volver a verlo cuando quieras desde Ajustes.",
    ],
  },
  {
    route: "hoy",
    jp: "今日",
    title: "Hoy: tu plan del día",
    points: [
      "«Lo que te toca» te dice qué hacer ahora: repasos pendientes, la siguiente lección o tu diario.",
      "El día se divide en bloques. Pulsa Empezar para usar el cronómetro o Marcar hecho si estudiaste fuera.",
      "Abajo ves cuánto falta para tus fechas clave, como el JLPT.",
    ],
    tip: "Haz primero el bloque Repaso: repasar antes de ver material nuevo es lo que fija lo aprendido.",
  },
  {
    route: "lecciones",
    jp: "課",
    title: "Lecciones desde cero",
    points: [
      "27 lecciones: escritura, hiragana, katakana, saludos, números y primeras oraciones.",
      "Los ejercicios se adaptan: primero reconoces, luego eliges, después escribes y al final dibujas de memoria.",
      "En «Reto de escritura» dibujas kana con el dedo o el ratón, y la página te dice cuánto se parece al correcto.",
    ],
    tip: "Empieza por «Los cuatro sistemas de escritura».",
  },
  {
    route: "recursos",
    jp: "資料",
    title: "Recursos: tus plataformas",
    points: [
      "Udemy, Genki, WaniKani, Bunpro, Anki y más, cada uno con su enlace y su avance.",
      "Al volver de una plataforma registra el tiempo con +10, +20 o +30; cuenta para tu rutina.",
      "WaniKani y Anki muestran sus repasos pendientes cuando los conectas.",
    ],
  },
  {
    route: "escucha",
    jp: "聴解",
    title: "Escucha",
    points: [
      "Arma tu biblioteca de podcasts, anime y canciones, con recomendados para tu nivel.",
      "Cada sesión sigue un método de cuatro pasos, y lo que atrapes al oír se vuelve tarjeta.",
    ],
  },
  {
    route: "kana",
    jp: "仮名",
    title: "Kana: lectura rápida",
    points: [
      "Rondas cortas de hiragana o katakana: ves el carácter y escribes su lectura.",
      "Las filas nuevas se desbloquean solas cuando dominas las anteriores.",
    ],
  },
  {
    route: "tarjetas",
    jp: "単語",
    title: "Tarjetas de vocabulario",
    points: [
      "Un mazo con repaso espaciado: lo difícil vuelve pronto y lo fácil se aleja.",
      "Crea tarjetas desde tus apuntes, a mano o con ayuda de Claude, y envíalas a Anki.",
    ],
  },
  {
    route: "diario",
    jp: "日記",
    title: "Diario",
    points: [
      "Cada día un tema con estructura sugerida: escribe tres oraciones, aunque sea en rōmaji.",
      "Copia el prompt de corrección para Claude y convierte sus correcciones en tarjetas.",
    ],
  },
  {
    route: "examen",
    jp: "試験",
    title: "Exámenes estilo MEXT",
    points: [
      "Practica una sección sin cronómetro o haz el simulacro completo de 100 minutos.",
      "Verás tu puntaje por sección, tu nivel estimado y cada error explicado.",
    ],
  },
  {
    route: "progreso",
    jp: "記録",
    title: "Progreso",
    points: [
      "Tus minutos de la semana frente a la meta, el tiempo por recurso y tu racha.",
      "Cada domingo, la revisión semanal te ayuda a ver qué estás descuidando.",
    ],
  },
  {
    route: "ajustes",
    jp: "設定",
    title: "Ajustes",
    points: [
      "Conecta tu repositorio privado para sincronizar el celular y el computador.",
      "Elige entre ocho paletas y el modo claro u oscuro, agrega tus fechas y descarga respaldos.",
      "Aquí está el botón para volver a ver este recorrido.",
    ],
    tip: "En la Guía (案内, arriba a la derecha) verás qué te falta configurar y un tutorial de cada herramienta.",
  },
];

/**
 * A step-by-step welcome that walks through every section, opening each one behind the dialog.
 * It shows on the first visit and again from Ajustes.
 */
export function Tour() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const step = TOUR_STEPS[index] ?? TOUR_STEPS[0]!;
  const last = index === TOUR_STEPS.length - 1;

  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
  }, []);

  useEffect(() => {
    if (location.hash.slice(1) !== step.route) location.hash = step.route;
  }, [step.route]);

  function finish() {
    dialog.current?.close();
    closeTour();
    location.hash = "hoy";
  }

  return (
    <dialog
      ref={dialog}
      className="tour"
      aria-labelledby="tour-title"
      onCancel={(e) => {
        e.preventDefault();
        finish();
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" && !last) setIndex(index + 1);
        if (e.key === "ArrowLeft" && index > 0) setIndex(index - 1);
      }}
    >
      <div className="tour-head">
        <Jp className="tour-glyph" aria-hidden="true">
          {step.jp}
        </Jp>
        <div>
          <p className="muted small num">
            Paso {index + 1} de {TOUR_STEPS.length}
          </p>
          <h2 id="tour-title" className="tour-title">
            {step.title}
          </h2>
        </div>
      </div>
      <ul className="tour-points" key={index}>
        {step.points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
      {step.tip && <p className="hint">{step.tip}</p>}
      <div className="tour-dots" aria-hidden="true">
        {TOUR_STEPS.map((s, i) => (
          <i key={s.title} className={i === index ? "is-on" : i < index ? "is-past" : ""} />
        ))}
      </div>
      <div className="row between">
        <button type="button" className="btn ghost small" onClick={finish}>
          {last ? "Cerrar" : "Saltar recorrido"}
        </button>
        <span className="row">
          <button
            type="button"
            className="btn ghost"
            disabled={index === 0}
            onClick={() => setIndex(index - 1)}
          >
            Anterior
          </button>
          {last ? (
            <button type="button" className="btn shu" onClick={finish} autoFocus>
              Empezar a estudiar
            </button>
          ) : (
            <button type="button" className="btn shu" onClick={() => setIndex(index + 1)} autoFocus>
              Siguiente
            </button>
          )}
        </span>
      </div>
    </dialog>
  );
}
