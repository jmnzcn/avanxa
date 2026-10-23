import { expect, test } from "@playwright/test";
import { DEMO_ADMIN, login } from "./helpers";

test("un usuario normal no puede entrar al panel de admin", async ({ page }) => {
  await login(page);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("el admin ve la salud del sistema y la lista de usuarios", async ({ page }) => {
  await login(page, DEMO_ADMIN);
  await page.goto("/admin");

  await expect(page.getByText("Estado del Sistema")).toBeVisible();
  await expect(page.getByText("Saludable")).toBeVisible();
  await expect(page.getByText("En Línea")).toBeVisible();

  await page.getByRole("button", { name: "Gestión de Usuarios" }).click();
  await expect(page.getByText("user@avanxa.com")).toBeVisible();
  await expect(page.getByText(/\d+ completados/).first()).toBeVisible();
});
