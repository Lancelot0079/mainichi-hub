import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("the welcome tour opens on the first visit and walks through the sections", async ({
  page,
}) => {
  await page.goto("/");
  const tour = page.getByRole("dialog", { name: "Bienvenido a Mainichi Hub" });
  await expect(tour).toBeVisible();
  const axe = await new AxeBuilder({ page }).include(".tour").analyze();
  expect(axe.violations).toEqual([]);

  await page.getByRole("button", { name: "Siguiente" }).click();
  await page.getByRole("button", { name: "Siguiente" }).click();
  await expect(page.getByRole("dialog", { name: "Lecciones desde cero" })).toBeVisible();
  await expect(page).toHaveURL(/#lecciones$/);
  await page.getByRole("button", { name: "Anterior" }).click();
  await expect(page.getByRole("dialog", { name: "Hoy: tu plan del día" })).toBeVisible();

  await page.getByRole("button", { name: "Saltar recorrido" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await page.reload();
  await expect(page.getByText("Bienvenido a tu hub.")).toBeVisible();
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("the tour can be seen again from Ajustes and finished", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("mainichi-hub-tour", "seen"));
  await page.goto("/#ajustes");
  await page.getByRole("button", { name: "Ver el recorrido de nuevo" }).click();
  await expect(page.getByRole("dialog", { name: "Bienvenido a Mainichi Hub" })).toBeVisible();
  const next = page.getByRole("button", { name: "Siguiente" });
  while (await next.isVisible()) await next.click();
  await expect(page.getByRole("dialog", { name: "Ajustes" })).toBeVisible();
  await page.getByRole("button", { name: "Empezar a estudiar" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page).toHaveURL(/#hoy$/);
});
