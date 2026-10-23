import { expect, type Page } from "@playwright/test";

// Cuentas que crea el seed del backend (solo para entornos locales y de test)
export const DEMO_USER = { email: "user@avanxa.com", password: "user123" };
export const DEMO_ADMIN = { email: "admin@avanxa.com", password: "admin123" };

export async function login(page: Page, { email, password } = DEMO_USER) {
  await page.goto("/login");
  await page.getByPlaceholder("tu@email.com").fill(email);
  await page.getByPlaceholder("Tu contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar Sesión" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

/** Nombre único por test para no depender del estado que dejan otros tests. */
export const uniqueName = (prefix: string) => `${prefix} ${Date.now().toString(36)}`;
