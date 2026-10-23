import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/lib/prisma";
import { globalCache } from "../src/middleware/cache";

export { app, prisma };

let counter = 0;

/** Vacía todas las tablas y la caché en memoria entre tests. */
export async function resetDatabase() {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "audit_logs", "habit_progress", "habits", "users" CASCADE'
  );
  globalCache.clear();
}

/**
 * Registra un usuario nuevo y devuelve un agente de Supertest que conserva
 * las cookies de sesión (el JWT viaja en cookies httpOnly).
 */
export async function signUp(role: "USER" | "ADMIN" = "USER") {
  counter += 1;
  const credentials = {
    email: `user${counter}@test.com`,
    password: "password123",
    firstName: "Test",
    lastName: `User ${counter}`,
  };

  const agent = request.agent(app);
  const res = await agent.post("/api/auth/register").send(credentials);
  if (res.status !== 201) {
    throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  }

  const user = res.body.data.user;
  if (role === "ADMIN") {
    await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
    // El rol va dentro del JWT: hay que volver a iniciar sesión para obtenerlo
    await agent.post("/api/auth/login").send({
      email: credentials.email,
      password: credentials.password,
    });
  }

  return { agent, user, credentials };
}

/** Crea un hábito diario para el usuario del agente. */
export async function createHabit(
  agent: ReturnType<typeof request.agent>,
  overrides: Record<string, unknown> = {}
) {
  const res = await agent.post("/api/habits").send({
    name: `Hábito ${++counter}`,
    frequency: "daily",
    targetCount: 1,
    ...overrides,
  });
  if (res.status !== 201) {
    throw new Error(`create habit failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.data.habit as { id: string; name: string; frequency: string };
}
