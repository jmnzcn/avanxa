import { expect, test } from "@playwright/test";
import { DEMO_USER, login, uniqueName } from "./helpers";

test("redirige al login si se entra al panel sin sesión", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
});

test("muestra un error con credenciales incorrectas", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("tu@email.com").fill(DEMO_USER.email);
  await page.getByPlaceholder("Tu contraseña").fill("incorrecta");
  await page.getByRole("button", { name: "Iniciar Sesión" }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText(/invalid|incorrect|inválid|error/i).first()).toBeVisible();
});

test("inicia sesión, muestra el nombre real del usuario y cierra sesión", async ({ page }) => {
  await login(page);
  // Antes de la integración aparecía "undefined undefined"
  await expect(page.getByText("John Doe")).toBeVisible();
  await expect(page.getByText(DEMO_USER.email)).toBeVisible();

  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
});

test("registra una cuenta nueva y entra al panel", async ({ page }) => {
  const email = `${uniqueName("e2e").replace(/\W+/g, "")}@test.com`;

  await page.goto("/register");
  await page.getByPlaceholder("Tu nombre").fill("Ana");
  await page.getByPlaceholder("Tu apellido").fill("Mora");
  await page.getByPlaceholder("tu@email.com").fill(email);
  await page.getByPlaceholder("Tu contraseña", { exact: true }).fill("password123");
  await page.getByPlaceholder("Confirma tu contraseña").fill("password123");
  await page.getByRole("button", { name: /crear cuenta|registr/i }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("Ana Mora")).toBeVisible();
  // Usuario nuevo: el panel refleja que todavía no tiene hábitos
  await expect(page.getByText("de 0 en total")).toBeVisible();
});
