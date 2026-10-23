import { execSync } from "node:child_process";

// Crea (o recrea desde cero) el esquema de la base de datos de tests antes de la suite
export default function setup() {
  const url =
    process.env.TEST_DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/avanxa_test";

  execSync("npx prisma db push --force-reset --skip-generate", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url },
  });
}
