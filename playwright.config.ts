import { defineConfig, devices } from "@playwright/test";

// Puertos y base de datos propios para no chocar con el entorno de desarrollo
const API_PORT = 3101;
const WEB_PORT = 3100;
const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/avanxa_e2e";

export default defineConfig({
  testDir: "./e2e",
  // Los tests comparten la misma base de datos sembrada: de a uno, en orden
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // En Windows se puede usar Edge (PW_CHANNEL=msedge) en vez del Chromium de Playwright
    ...(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}),
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      // Recrea la base e2e, carga los datos de demo y arranca la API
      command:
        "npx prisma db push --force-reset --skip-generate && npx ts-node src/prisma/seed.ts && npx ts-node src/app.ts",
      cwd: "backend",
      url: `http://localhost:${API_PORT}/health`,
      timeout: 180_000,
      reuseExistingServer: false,
      env: {
        NODE_ENV: "test",
        PORT: String(API_PORT),
        DATABASE_URL: E2E_DATABASE_URL,
        JWT_SECRET: "e2e-jwt-secret-with-at-least-32-characters",
        JWT_REFRESH_SECRET: "e2e-refresh-secret-with-at-least-32-chars",
        CORS_ORIGIN: `http://localhost:${WEB_PORT}`,
      },
    },
    {
      command: `npx vite --port ${WEB_PORT} --strictPort --no-open`,
      cwd: "frontend",
      url: `http://localhost:${WEB_PORT}`,
      timeout: 120_000,
      reuseExistingServer: false,
      env: { VITE_API_URL: `http://localhost:${API_PORT}` },
    },
  ],
});
