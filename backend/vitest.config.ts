import { defineConfig } from "vitest/config";

// Base de datos exclusiva para tests: se recrea en cada corrida (ver tests/global-setup.ts)
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/avanxa_test";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    globalSetup: ["tests/global-setup.ts"],
    // Todos los archivos comparten la misma base de datos: se ejecutan de a uno
    fileParallelism: false,
    env: {
      NODE_ENV: "test",
      DATABASE_URL: TEST_DATABASE_URL,
      JWT_SECRET: "test-jwt-secret-with-at-least-32-characters",
      JWT_REFRESH_SECRET: "test-refresh-secret-with-at-least-32-chars",
      CORS_ORIGIN: "http://localhost:3000",
    },
  },
});
