import { hoursSince } from "../../ui/primitives";
import { useHub, type Hub } from "../../state/store";
import { loadConnection } from "../../state/sync";

interface Check {
  label: string;
  done: boolean;
  how: string;
  href: string;
}

/** What is still missing, read from the live state rather than from a static list. */
function setupChecks({ state, snapshot }: Hub): Check[] {
  const customDates = state.settings.milestones.some(
    (m) => m.id !== "jlpt-registration" && m.id !== "jlpt-n5",
  );
  return [
    {
      label: "Sincronizar tus dispositivos",
      done: loadConnection() !== null,
      how: "Crea el repositorio privado y conéctalo en Ajustes, en cada dispositivo.",
      href: "#ajustes",
    },
    {
      label: "Proceso automático corriendo",
      done: !!snapshot.generatedAt && hoursSince(snapshot.generatedAt) < 24,
      how: "Publica el repositorio y agrega los secretos de GitHub Actions (docs/setup.md, paso 7).",
      href: "#ajustes",
    },
    {
      label: "Alertas en el celular",
      done: Object.keys(snapshot.alertsSent).length > 0,
      how: "Instala ntfy, suscríbete a tu canal y guarda NTFY_TOPIC como secreto.",
      href: "#ajustes",
    },
    {
      label: "WaniKani conectado",
      done: snapshot.wanikani !== null,
      how: "Crea un token de lectura en WaniKani y guárdalo como WANIKANI_TOKEN.",
      href: "#recursos",
    },
    {
      label: "Anki conectado",
      done: state.anki !== null,
      how: "Instala AnkiConnect (código 2055492159), permite el origen del hub y pulsa «Leer de Anki».",
      href: "#recursos",
    },
    {
      label: "Tus fechas personales",
      done: customDates,
      how: "Pega datos-iniciales.json en Ajustes → Respaldo, o agrégalas en Ajustes → Tus fechas.",
      href: "#ajustes",
    },
    {
      label: "Enlace de tu curso de Udemy",
      done: !!state.resources.udemy?.url,
      how: "En Recursos → Udemy → Configurar, pega el enlace de tu curso y su total de clases.",
      href: "#recursos",
    },
    {
      label: "Primera lección",
      done: Object.keys(state.progress.lessons).length > 0,
      how: "Abre Lecciones y empieza por «Los cuatro sistemas de escritura».",
      href: "#lecciones",
    },
    {
      label: "Biblioteca de escucha",
      done: state.listening.some((i) => !i.deletedAt),
      how: "Agrega al menos un podcast o anime de los recomendados.",
      href: "#escucha",
    },
    {
      label: "Primer examen",
      done: state.exams.some((e) => !e.deletedAt),
      how: "Haz una sección de práctica para conocer tu nivel de partida.",
      href: "#examen",
    },
  ];
}

const TUTORIALS: ReadonlyArray<{ title: string; jp: string; steps: readonly string[] }> = [
  {
    title: "Tu día en la página",
    jp: "今日",
    steps: [
      "Abre Hoy y mira «Lo que te toca»: cada tarjeta te lleva a donde se hace.",
      "Haz primero el bloque Repaso; repasar antes de ver material nuevo es lo que fija lo aprendido.",
      "En cada bloque, pulsa Empezar para usar el cronómetro, o Marcar hecho si lo hiciste fuera.",
      "Desmarcar deshace el bloque si te equivocaste.",
      "El sello 済 se llena cuando completas los cuatro bloques.",
    ],
  },
  {
    title: "Lecciones desde cero",
    jp: "課",
    steps: [
      "Abre Lecciones: el curso va de la escritura al hiragana, el katakana, los saludos, los números y las primeras oraciones.",
      "Entra a una lección y lee la explicación; con 🔊 la escuchas si tu dispositivo tiene voz japonesa.",
      "Pulsa «Empezar los ejercicios». Al principio reconoces, luego eliges, después escribes y al final dibujas de memoria.",
      "Lo que fallas vuelve al final de la sesión, y la próxima vez la lección insiste en eso.",
      "Con 80 % a la primera la lección queda completada; desde ahí sus elementos entran al «Repaso mixto» cuando toca.",
      "Al terminar puedes pasar tus errores a tarjetas, y el tiempo se suma al bloque Lección del día.",
    ],
  },
  {
    title: "Dibujar kana de memoria",
    jp: "書",
    steps: [
      "En Lecciones, pulsa «Dibujar» y elige hiragana o katakana y qué filas.",
      "Verás una lectura en rōmaji: dibuja el kana con el ratón, un lápiz o el dedo.",
      "Pulsa Comprobar: el sistema compara tu dibujo con todos los kana básicos y te dice cuánto se parece al correcto y a cuáles más se parece.",
      "Pasa si tu dibujo se parece más al kana correcto que a cualquier otro. Reconoce la forma, no el orden de los trazos.",
      "Los kana que te cuestan aparecen más seguido; los de las lecciones avanzadas también se piden dibujados.",
    ],
  },
  {
    title: "Crear tarjetas desde tus apuntes",
    jp: "単語",
    steps: [
      "Ve a Tarjetas → «De tus apuntes a tarjetas».",
      "Opción rápida: escribe una tarjeta por línea con el formato  水 ; みず ; agua  y pulsa «Crear desde el formato».",
      "Opción con Claude: pega tus apuntes de la clase, pulsa «Copiar prompt para el asistente», pégalo en Claude y copia su respuesta completa.",
      "Pega esa respuesta en «Respuesta del asistente» y pulsa «Usar la respuesta». La página revisa que el formato sea válido.",
      "Revisa la lista: desmarca lo que no quieras y pulsa «Agregar al mazo».",
      "Las tarjetas repetidas se omiten solas.",
    ],
  },
  {
    title: "Repasar tarjetas y llevarlas a Anki",
    jp: "復習",
    steps: [
      "En Tarjetas → Repaso de hoy, intenta recordar y pulsa «Mostrar respuesta».",
      "Califica con honestidad: Otra vez la repite hoy, Bien la aleja unos días y Fácil la aleja más.",
      "Con Anki abierto en tu PC, pulsa «Enviar a Anki» para pasar las nuevas sin archivos.",
      "Si usas Anki, repasa allá y no aquí, para no repasar dos veces lo mismo.",
    ],
  },
  {
    title: "Hiragana y katakana desde cero",
    jp: "仮名",
    steps: [
      "Abre Hiragana → Curso y empieza por «Sílabas, no letras». Sigue el orden: sistema, hiragana, sonidos, partículas, verbos y adjetivos.",
      "Cuando el hiragana te salga sin pensar, pasa a la sección Katakana: tiene su propio curso con el mismo método.",
      "Cada kana nuevo aparece en una tarjeta «Apréndelo» con su sonido y una imagen. Dilo en voz alta y pulsa «Lo tengo».",
      "Enseguida te lo pregunta sin ayuda y vuelve al final de la sesión al revés: del sonido al kana. Cada sesión trae como máximo cinco nuevos.",
      "En partículas completas oraciones; en verbos y adjetivos conjugas. Cada error te explica la regla.",
      "Lo que ya viste vuelve en el «Repaso mixto» cuando toca, y con práctica pasa de reconocerlo a escribirlo y dibujarlo.",
      "En la pestaña Tabla de cada sección tocas cualquier kana para oírlo, ver su truco y cuánto lo dominas.",
    ],
  },
  {
    title: "Lectura rápida de kana",
    jp: "読",
    steps: [
      "En Hiragana o Katakana → Lectura rápida, escribe la lectura en rōmaji y pulsa Enter.",
      "Si fallas, la página te muestra la respuesta y el carácter vuelve al final de la ronda.",
      "Las filas nuevas se desbloquean solas cuando dominas las anteriores.",
      "Práctica libre repasa 10 al azar sin alterar tu calendario.",
    ],
  },
  {
    title: "Una sesión de escucha",
    jp: "聴解",
    steps: [
      "En Escucha, agrega algo de los recomendados, o lo tuyo con «Agregar lo tuyo».",
      "Pulsa Practicar: arriba aparece la sesión con un método de 4 pasos según el tipo (podcast, anime, canción…).",
      "Pulsa «Empezar sesión», abre el material y sigue los pasos marcándolos.",
      "Cuando oigas una palabra o frase útil, escríbela en «Atrapa lo que escuchaste» y se vuelve tarjeta.",
      "Pulsa «Terminar y guardar»: los minutos cuentan para el bloque Escuchar y el episodio se suma.",
    ],
  },
  {
    title: "Escribir y corregir el diario",
    jp: "日記",
    steps: [
      "Lee el tema del día y su estructura sugerida.",
      "Escribe tres oraciones, aunque sea en rōmaji.",
      "Pulsa «Copiar prompt de corrección», pégalo en Claude y trae su respuesta.",
      "Revisa cada corrección y pulsa «Convertir las correcciones en tarjetas» para repasar tus propios errores.",
    ],
  },
  {
    title: "Exámenes estilo MEXT",
    jp: "試験",
    steps: [
      "Empieza con «Una sección, sin cronómetro» para conocer el formato y leer las explicaciones.",
      "Cuando te sientas listo, haz el simulacro completo de 100 minutos.",
      "Al terminar verás tu puntaje por sección, tu nivel estimado y cada error explicado; pásalos a tarjetas.",
      "Para practicar más, pide preguntas nuevas a Claude con el mismo formato.",
      "Una vez al mes, resuelve un examen oficial en PDF y registra tu puntaje para ver tu avance.",
    ],
  },
  {
    title: "Registrar plataformas externas",
    jp: "資料",
    steps: [
      "En Recursos, pulsa Abrir para ir a cada plataforma.",
      "Al volver, pulsa +10, +20 o +30 para registrar el tiempo; cuenta para tu rutina.",
      "Usa − y + para llevar las clases de Udemy y las lecciones de Busuu y Genki.",
      "Registra cada actividad de una sola forma (cronómetro o +min), o se cuenta doble.",
    ],
  },
  {
    title: "Revisión semanal",
    jp: "記録",
    steps: [
      "Cada domingo abre Progreso.",
      "Compara tus minutos con la meta de 385 y mira el tiempo por recurso para ver qué descuidas.",
      "Marca las casillas de la revisión del domingo.",
      "Haz una sección de examen y anota tu avance.",
    ],
  },
  {
    title: "Respaldo y apariencia",
    jp: "設定",
    steps: [
      "En Ajustes → Respaldo puedes descargar todo tu progreso; restaurar combina, nunca borra.",
      "En Ajustes → Apariencia eliges entre nueve paletas y el modo claro u oscuro.",
      "En Ajustes → Recorrido de bienvenida vuelves a ver la presentación de cada sección.",
    ],
  },
];

export default function GuidePage() {
  const hub = useHub();
  const checks = setupChecks(hub);
  const done = checks.filter((c) => c.done).length;

  return (
    <>
      <h2>
        Lo que falta configurar{" "}
        <small>
          {done} de {checks.length} listo
        </small>
      </h2>
      <div className="panel checklist-status">
        {checks.map((check) => (
          <div key={check.label} className={`check ${check.done ? "is-done" : ""}`}>
            <span className="mark" aria-hidden="true">
              {check.done ? "✓" : "○"}
            </span>
            <span>
              <b>{check.label}</b>
              <span className="visually-hidden">{check.done ? ": listo" : ": pendiente"}</span>
              {!check.done && (
                <>
                  <br />
                  <span className="muted small">
                    {check.how} <a href={check.href}>Ir</a>
                  </span>
                </>
              )}
            </span>
          </div>
        ))}
      </div>

      <h2>Cómo usar cada herramienta</h2>
      <div className="stack">
        {TUTORIALS.map((tutorial) => (
          <details key={tutorial.title} className="panel tutorial">
            <summary>
              <span lang="ja" className="glyph">
                {tutorial.jp}
              </span>{" "}
              {tutorial.title}
            </summary>
            <ol>
              {tutorial.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </details>
        ))}
      </div>
    </>
  );
}
