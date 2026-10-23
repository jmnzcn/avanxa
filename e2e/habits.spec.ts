import { expect, test } from "@playwright/test";
import { login, uniqueName } from "./helpers";

test.beforeEach(async ({ page }) => {
  await login(page);
});

test("el panel muestra datos reales del usuario", async ({ page }) => {
  // El seed crea 5 hábitos activos con 6 semanas de historial
  await expect(page.getByText("de 5 en total")).toBeVisible();
  await expect(page.getByText("Mejor Racha Activa")).toBeVisible();
  await expect(page.getByText("Cumplimiento por Hábito")).toBeVisible();
  await expect(page.getByText("Leer 30 minutos").first()).toBeVisible();
  // Antes estas cifras eran fijas en el código
  await expect(page.getByText("12 días")).toHaveCount(0);
});

test("crea un hábito y aparece en la lista", async ({ page }) => {
  const name = uniqueName("Estirar");

  await page.goto("/habits");
  await page.getByRole("button", { name: "Crear Hábito" }).first().click();
  await page.getByLabel("Nombre del Hábito *").fill(name);
  await page.getByLabel("Descripción (opcional)").fill("10 minutos al despertar");
  await page.getByLabel("Frecuencia *").selectOption("WEEKLY");
  await page.locator("form").getByRole("button", { name: "Crear Hábito" }).click();

  const card = page.locator("div", { has: page.getByText(name, { exact: true }) }).filter({
    hasText: "Semanal",
  });
  await expect(card.first()).toBeVisible();
});

test("registra un hábito como completado hoy desde su página de progreso", async ({ page }) => {
  const name = uniqueName("Caminar");

  await page.goto("/habits");
  await page.getByRole("button", { name: "Crear Hábito" }).first().click();
  await page.getByLabel("Nombre del Hábito *").fill(name);
  await page.locator("form").getByRole("button", { name: "Crear Hábito" }).click();
  await expect(page.getByText(name, { exact: true })).toBeVisible();

  // "Ver Detalles" de la tarjeta de este hábito
  const card = page.locator("div.rounded-lg, div[class*='card']").filter({ hasText: name }).last();
  await card.getByRole("button", { name: "Ver Detalles" }).click();
  await expect(page).toHaveURL(/\/progress\//);

  await page.getByRole("button", { name: "Marcar como Completado" }).click();
  await expect(page.getByText("¡Excelente! Has completado este hábito hoy")).toBeVisible();

  // Al recargar sigue completado: se guardó en el backend
  await page.reload();
  await expect(page.getByText("¡Excelente! Has completado este hábito hoy")).toBeVisible();
});

test("la página de progreso muestra el historial semanal", async ({ page }) => {
  await page.goto("/progress/habit-1");
  await page.getByRole("button", { name: "Gráficos y Estadísticas" }).click();
  await expect(page.getByText("Progreso Semanal")).toBeVisible();
  await expect(page.getByText(/de 7 completados/).first()).toBeVisible();
});
