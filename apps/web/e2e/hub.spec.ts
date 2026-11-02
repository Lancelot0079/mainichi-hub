import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const ROUTES = ["hoy", "recursos", "kana", "tarjetas", "diario", "progreso", "ajustes"];

let cspViolations: string[] = [];

test.beforeEach(({ page }) => {
  cspViolations = [];
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
  await page.goto("/#kana");
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
  await page.goto("/#kana");
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

for (const route of ROUTES) {
  test(`${route} has no accessibility violations`, async ({ page }) => {
    await page.goto(`/?demo#${route}`);
    await expect(page.getByRole("main")).not.toBeEmpty();
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations.flatMap((v) =>
        v.nodes.map((n) => `${v.id}: ${n.html} ${n.any[0]?.message ?? ""}`),
      ),
    ).toEqual([]);
  });
}
