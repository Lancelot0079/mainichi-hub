import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const ROUTES = [
  "hoy",
  "lecciones",
  "recursos",
  "escucha",
  "hiragana",
  "hiragana/tabla",
  "hiragana/lectura",
  "katakana",
  "katakana/tabla",
  "tarjetas",
  "diario",
  "examen",
  "progreso",
  "ajustes",
  "guia",
];

let cspViolations: string[] = [];

test.beforeEach(async ({ page }) => {
  cspViolations = [];
  // The welcome tour has its own tests; elsewhere it would cover the page.
  await page.addInitScript(() => localStorage.setItem("mainichi-hub-tour", "seen"));
  page.on("pageerror", (error) => {
    throw error;
  });
  page.on("console", (message) => {
    if (message.text().includes("Content Security Policy")) cspViolations.push(message.text());
  });
});

test.afterEach(() => {
  expect(cspViolations.map((text) => text.slice(0, 120))).toEqual([]);
});

test("the demo shows every connected source on the dashboard", async ({ page }) => {
  await page.goto("/?demo");
  await expect(page.getByText("37 repasos en WaniKani")).toBeVisible();
  await expect(page.getByText("35 tarjetas en Anki")).toBeVisible();
  await expect(page.getByRole("link", { name: "Datos de ejemplo" })).toBeVisible();
});

test("a new user starts empty and keeps progress after reloading", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Bienvenido a tu hub.")).toBeVisible();
  await page.getByRole("button", { name: "Marcar hecho" }).first().click();
  await expect(page.getByText("15 de 55 min")).toBeVisible();
  await page.reload();
  await expect(page.getByText("15 de 55 min")).toBeVisible();
  await expect(page.getByText("Bienvenido a tu hub.")).toBeHidden();
});

test("a kana round grades answers and shows the correct reading on a miss", async ({ page }) => {
  await page.goto("/#hiragana/lectura");
  const field = page.getByLabel("Lectura");
  await field.fill("zzz");
  await field.press("Enter");
  await expect(page.getByText(/se lee «/)).toBeVisible();
  await field.press("Enter");
  await expect(page.getByText(/se lee «/)).toBeHidden();
});

test("unticking a block undoes it", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Marcar hecho" }).first().click();
  await expect(page.getByText("15 de 55 min")).toBeVisible();
  await page.getByRole("button", { name: "Desmarcar" }).click();
  await expect(page.getByText("0 de 55 min")).toBeVisible();
  await expect(page.getByText("días seguidos", { exact: true })).toBeVisible();
});

test("kana practice counts as studying", async ({ page }) => {
  await page.goto("/#hiragana/lectura");
  const field = page.getByLabel("Lectura");
  await field.fill("zzz");
  await field.press("Enter");
  await page.goto("/#hoy");
  await expect(page.getByText("día seguido", { exact: true })).toBeVisible();
});

test("manual cards can be created, reviewed and deleted", async ({ page }) => {
  await page.goto("/#tarjetas");
  await page.getByLabel("Apuntes de la clase").fill("水 ; みず ; agua");
  await page.getByRole("button", { name: "Crear desde el formato" }).click();
  await page.getByRole("button", { name: "Agregar al mazo" }).click();
  await expect(page.getByText("1 tarjetas", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Mostrar respuesta" }).click();
  await page.getByRole("button", { name: "Bien" }).click();
  await expect(page.getByText("No hay tarjetas pendientes.")).toBeVisible();
  await page.getByRole("button", { name: "Borrar 水" }).click();
  await expect(page.getByText("0 tarjetas", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Deshacer" }).click();
  await expect(page.getByText("1 tarjetas", { exact: true })).toBeVisible();
});

test("a pasted assistant reply is validated before it is used", async ({ page }) => {
  await page.goto("/#tarjetas");
  const reply = page.getByLabel("Respuesta del asistente").first();
  await reply.fill('[{"nope":true}]');
  await page.getByRole("button", { name: "Usar la respuesta" }).first().click();
  await expect(page.getByText("La respuesta no tiene el formato esperado.")).toBeVisible();
  await reply.fill('```json\n[{"jp":"火","r":"ひ","es":"fuego"}]\n```');
  await page.getByRole("button", { name: "Usar la respuesta" }).first().click();
  await expect(page.getByRole("button", { name: "Agregar al mazo" })).toBeVisible();
});

test("logging a session on a manual resource counts toward the routine", async ({ page }) => {
  await page.goto("/#recursos");
  await page.getByRole("button", { name: "Registrar 20 minutos en Busuu" }).click();
  await expect(page.getByText("Busuu · 20 min")).toBeVisible();
  await page.goto("/#hoy");
  await expect(page.getByText("20 de 55 min")).toBeVisible();
});

test("a backup from the original page can be restored", async ({ page }) => {
  await page.goto("/#ajustes");
  const legacy = {
    prog: { log: { "2026-10-31": { b: { srs: { done: true, m: 15 } }, l: "", cr: 0 } } },
    cards: { list: [{ id: "c1", jp: "水", es: "agua" }] },
  };
  await page.getByLabel("Texto del respaldo").fill(JSON.stringify(legacy));
  await page.getByRole("button", { name: "Restaurar" }).click();
  await expect(page.getByText("Respaldo combinado con tu progreso.")).toBeVisible();
  await page.goto("/#tarjetas");
  await expect(page.getByText("1 tarjetas", { exact: true })).toBeVisible();
});

test("an invalid backup changes nothing", async ({ page }) => {
  await page.goto("/#ajustes");
  await page.getByLabel("Texto del respaldo").fill('{"version":99}');
  await page.getByRole("button", { name: "Restaurar" }).click();
  await expect(page.getByText("Ese texto no es un respaldo válido.")).toBeVisible();
});

test("a stored javascript: link never reaches an href", async ({ page }) => {
  await page.goto("/#recursos");
  await page.getByText("Configurar").nth(3).click();
  await page.getByLabel("Enlace directo").nth(3).fill("javascript:alert(1)");
  await page.getByLabel("Enlace directo").nth(3).blur();
  await expect(page.getByText("Ese enlace no es válido.")).toBeVisible();
  const hrefs = await page
    .locator("a")
    .evaluateAll((links) => links.map((link) => link.getAttribute("href") ?? ""));
  expect(hrefs.filter((href) => href.startsWith("javascript:"))).toEqual([]);
});

test("the page has no horizontal scroll", async ({ page }) => {
  for (const route of ROUTES) {
    await page.goto(`/?demo#${route}`);
    await expect(page.getByRole("main")).not.toBeEmpty();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, route).toBeLessThanOrEqual(0);
  }
});

test("a listening session logs time to the routine and creates cards", async ({ page }) => {
  await page.goto("/#escucha");
  await page.getByRole("button", { name: "Agregar" }).first().click();
  await expect(page.getByText("1 elementos")).toBeVisible();
  await page.getByRole("button", { name: "+10 min" }).click();
  await expect(page.getByText("10 min de escucha registrados.")).toBeVisible();
  await page.getByLabel("Palabra o frase").fill("いただきます");
  await page.getByLabel("Significado").fill("buen provecho");
  await page.getByRole("button", { name: "Crear tarjeta" }).click();
  await page.goto("/#hoy");
  await expect(page.getByText("10 de 55 min")).toBeVisible();
  await page.goto("/#tarjetas");
  await expect(page.getByText("1 tarjetas", { exact: true })).toBeVisible();
});

test("an exam section is graded with the official weights and explained", async ({ page }) => {
  await page.goto("/#examen");
  await page.getByRole("button", { name: "IV · Comprensión de lectura" }).click();
  await expect(page.getByText("次の文章を読んで")).toBeVisible();
  const first = page.getByRole("group").filter({ hasText: "なぜ" });
  await first.getByRole("radio").first().check();
  await page.getByRole("button", { name: "Terminar y calificar" }).last().click();
  await expect(page.getByText("/ 12")).toBeVisible();
  await expect(page.getByText("Repaso de errores")).toBeVisible();
  await page.getByRole("button", { name: "Volver a exámenes" }).click();
  await expect(page.getByText("3/12")).toBeVisible();
});

test("a generated exam reply is validated before it runs", async ({ page }) => {
  await page.goto("/#examen");
  const reply = page.getByLabel("Respuesta del asistente");
  await reply.fill('{"preguntas":[{"enunciado":"x","opciones":["a","b"],"correcta":0}]}');
  await page.getByRole("button", { name: "Usar la respuesta" }).click();
  await expect(page.getByText("La respuesta no tiene el formato esperado.")).toBeVisible();
  await reply.fill(
    '{"preguntas":[{"nivel":"N5","enunciado":"ねこ＿＿います。","opciones":["が","を","で","へ"],"correcta":0,"explicacion":"が marca el sujeto."}]}',
  );
  await page.getByRole("button", { name: "Usar la respuesta" }).click();
  await expect(page.getByText("0 de 1 respondidas")).toBeVisible();
});

test("the chosen palette persists and stays accessible", async ({ page }) => {
  // Contrast is audited on the final colors, not mid-way through a fade-in.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#ajustes");
  await page.getByRole("button", { name: /Matcha/ }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-palette", "matcha");
  await page.getByRole("button", { name: "Oscuro" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const results = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
  expect(results.violations).toEqual([]);
});

test("a lesson teaches first, then adapts its exercises and records the result", async ({
  page,
}) => {
  await page.goto("/#lecciones");
  await expect(page.getByText("0 de 27 completadas")).toBeVisible();
  await page.getByRole("button", { name: /Vocales y fila K/ }).click();
  await expect(page.getByRole("heading", { name: "Las cinco vocales" })).toBeVisible();
  await page.getByRole("button", { name: "Empezar los ejercicios" }).click();
  await expect(page.getByText("Une cada palabra con su significado")).toBeVisible();
  // Leaving halfway keeps the lesson as started.
  await page.getByRole("button", { name: "Salir" }).click();
  await expect(page.getByRole("button", { name: /Vocales y fila K.*En curso/ })).toBeVisible();
});

test("an order exercise builds a sentence from tiles", async ({ page }) => {
  await page.goto("/#lecciones");
  await page.getByRole("button", { name: /Tu presentación/ }).click();
  await page.getByLabel("Tu nombre como suena (rōmaji)").fill("kamira");
  await expect(page.getByText("わたしは カミラ です。")).toBeVisible();
  await page.getByRole("button", { name: "Empezar los ejercicios" }).click();
  // Answer whatever comes until an ordering exercise shows up.
  for (let i = 0; i < 20; i++) {
    if (await page.getByText(/^Ordena:/).isVisible()) break;
    const match = page.locator(".match");
    if (await match.isVisible()) {
      // Pair each word by trying meanings until it locks in.
      const words = match.locator(".stack").first().getByRole("button");
      const meanings = match.locator(".stack").last().getByRole("button");
      for (let w = 0; w < (await words.count()); w++) {
        for (let m = 0; m < (await meanings.count()) && !(await words.nth(w).isDisabled()); m++) {
          await words.nth(w).click();
          if (!(await meanings.nth(m).isDisabled())) await meanings.nth(m).click();
        }
      }
      await page.getByRole("button", { name: /Continuar|Ver resultado/ }).click();
      continue;
    }
    const option = page.locator(".ex-options .opt").first();
    if (await option.isVisible()) await option.click();
    else await page.getByRole("button", { name: "No lo sé" }).click();
    await page.getByRole("button", { name: /Continuar|Ver resultado/ }).click();
  }
  const available = page.getByLabel("Palabras disponibles").getByRole("button");
  while ((await available.count()) > 0) await available.first().click();
  await page.getByRole("button", { name: "Comprobar" }).click();
  await expect(page.getByText(/¡Correcto!|No exactamente\./)).toBeVisible();
});

test("a drawn kana is recognized and compared with the closest ones", async ({ page }) => {
  await page.goto("/#lecciones");
  await page.getByRole("button", { name: "Dibujar" }).click();
  await page.getByRole("button", { name: "Empezar (10 kana)" }).click();
  const canvas = page.locator(".draw-canvas");
  const box = (await canvas.boundingBox())!;
  const at = (x: number, y: number) => [box.x + x * box.width, box.y + y * box.height] as const;
  await page.mouse.move(...at(0.68, 0.12));
  await page.mouse.down();
  await page.mouse.move(...at(0.3, 0.5), { steps: 8 });
  await page.mouse.move(...at(0.68, 0.88), { steps: 8 });
  await page.mouse.up();
  await expect(page.getByText("1 trazo")).toBeVisible();
  await page.getByRole("button", { name: "Comprobar" }).click();
  await expect(page.getByText(/Se parece en un \d+ % a/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Continuar|Ver resultado/ })).toBeVisible();
});

test("the guide lists what is still missing", async ({ page }) => {
  await page.goto("/#guia");
  await expect(page.getByText("Sincronizar tus dispositivos")).toBeVisible();
  await page.getByText("Crear tarjetas desde tus apuntes").click();
  await expect(page.getByText("Crear desde el formato").first()).toBeVisible();
});

for (const route of ROUTES) {
  test(`${route} has no accessibility violations`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/?demo#${route}`);
    await expect(page.getByText("Cargando…")).toBeHidden();
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations.flatMap((v) =>
        v.nodes.map((n) => `${v.id}: ${n.html} ${n.any[0]?.message ?? ""}`),
      ),
    ).toEqual([]);
  });
}

test("the kana course teaches a new kana with a card, then asks for it", async ({ page }) => {
  await page.goto("/#hiragana");
  await expect(page.getByText("0 de 24 completadas")).toBeVisible();
  await page.getByRole("button", { name: /Sílabas, no letras/ }).click();
  await expect(page.getByRole("heading", { name: "Cómo se memoriza aquí" })).toBeVisible();
  await page.getByRole("button", { name: "Empezar los ejercicios" }).click();
  await expect(page.getByText("Nuevo · apréndelo")).toBeVisible();
  await expect(page.locator(".learn-hook")).toContainText("aaah");
  await page.getByRole("button", { name: "Lo tengo, sigue" }).click();
  // Right after the card comes the same kana, to recall without help.
  await expect(page.locator(".ex-options .opt").first()).toBeVisible();
  await page.locator(".ex-options .opt").first().click();
  await expect(page.getByText(/¡Correcto!|No exactamente\./)).toBeVisible();
});

test("a particle exercise explains why the particle goes there", async ({ page }) => {
  await page.goto("/#hiragana");
  await page.getByRole("button", { name: /を, に y へ/ }).click();
  await page.getByRole("button", { name: "Empezar los ejercicios" }).click();
  // Answer whatever comes until a fill-in-the-particle exercise shows up.
  for (let i = 0; i < 25 && !(await page.getByText(/^Completa:/).isVisible()); i++) {
    const match = page.locator(".match");
    if (await match.isVisible()) {
      const words = match.locator(".stack").first().getByRole("button");
      const meanings = match.locator(".stack").last().getByRole("button");
      for (let w = 0; w < (await words.count()); w++) {
        for (let m = 0; m < (await meanings.count()) && !(await words.nth(w).isDisabled()); m++) {
          await words.nth(w).click();
          if (!(await meanings.nth(m).isDisabled())) await meanings.nth(m).click();
        }
      }
    } else {
      const option = page.locator(".ex-options .opt").first();
      if (await option.isVisible()) await option.click();
      else await page.getByRole("button", { name: "No lo sé" }).click();
    }
    await page.getByRole("button", { name: /Continuar|Ver resultado/ }).click();
  }
  await expect(page.locator(".passage")).toContainText("＿＿");
  await page.locator(".ex-options .opt").first().click();
  await expect(page.getByRole("status")).toContainText(/ — /);
});

test("the kana chart shows how to remember the kana you tap", async ({ page }) => {
  await page.goto("/#hiragana");
  await page.getByRole("button", { name: /Tabla/ }).click();
  await expect(page).toHaveURL(/#hiragana\/tabla$/);
  await page.getByRole("button", { name: "ね, ne" }).click();
  await expect(page.locator(".chart-detail")).toContainText("gato");
  await page.goto("/#katakana/tabla");
  await page.getByRole("button", { name: "シ, shi" }).click();
  await expect(page.locator(".chart-detail")).toContainText("hacia arriba");
});

test("katakana has its own course, and old kana links land on hiragana", async ({ page }) => {
  await page.goto("/#katakana");
  await expect(page.getByRole("heading", { name: /Katakana desde cero/ })).toBeVisible();
  await expect(page.getByText("0 de 7 completadas")).toBeVisible();
  await expect(page.getByRole("button", { name: /Leer palabras en katakana/ })).toBeVisible();
  await page.goto("/#kana/lectura");
  await expect(page.getByRole("heading", { name: /Lectura rápida de/ })).toContainText("ひらがな");
});
