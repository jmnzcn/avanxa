import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { app, createHabit, prisma, resetDatabase, signUp } from "./helpers";

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

describe("admin", () => {
  it("rechaza a usuarios sin rol ADMIN con 403", async () => {
    const { agent } = await signUp("USER");
    expect((await agent.get("/api/admin/dashboard")).status).toBe(403);
    expect((await request(app).get("/api/admin/dashboard")).status).toBe(401);
  });

  it("muestra métricas globales del sistema", async () => {
    const user = await signUp();
    await createHabit(user.agent);
    const admin = await signUp("ADMIN");

    const res = await admin.agent.get("/api/admin/dashboard");
    expect(res.status).toBe(200);
    expect(res.body.data.overview.totalUsers).toBe(2);
    expect(res.body.data.habits.totalHabits).toBe(1);
  });

  it("informa la salud del sistema con tiempo activo y conexiones", async () => {
    const admin = await signUp("ADMIN");
    const res = await admin.agent.get("/api/admin/system/health");
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ status: "healthy", database: "connected" });
    expect(res.body.data.uptime).toBeGreaterThanOrEqual(0);
    expect(res.body.data.activeConnections).toBeGreaterThan(0);
  });

  it("acepta fechas ISO en el filtro del panel y rechaza otros formatos", async () => {
    const admin = await signUp("ADMIN");
    const iso = await admin.agent.get(
      "/api/admin/dashboard?startDate=2026-01-01T00:00:00.000Z&endDate=2026-12-31T23:59:59.999Z"
    );
    expect(iso.status).toBe(200);

    const plain = await admin.agent.get("/api/admin/dashboard?startDate=2026-01-01&endDate=2026-12-31");
    expect(plain.status).toBe(400);
  });

  it("bloquear a un usuario le impide usar la API y queda en la auditoría", async () => {
    const target = await signUp();
    const admin = await signUp("ADMIN");

    const res = await admin.agent
      .put(`/api/admin/users/${target.user.id}/block`)
      .send({ isBlocked: true, reason: "Prueba" });
    expect(res.status).toBe(200);

    // Aunque su JWT todavía no expiró, el bloqueo aplica de inmediato
    const blocked = await target.agent.get("/api/habits");
    expect(blocked.status).toBe(403);
    expect(blocked.body.error).toBe("Account blocked");
    const logs = await admin.agent.get("/api/admin/audit-logs");
    expect(logs.body.data.logs.length).toBeGreaterThan(0);
  });

  it("lista usuarios con su total de hábitos y completados", async () => {
    const user = await signUp();
    const habit = await createHabit(user.agent);
    await user.agent.post("/api/progress/complete").send({ habitId: habit.id });
    const admin = await signUp("ADMIN");

    const res = await admin.agent.get(`/api/admin/users?search=${encodeURIComponent(user.user.email)}`);
    expect(res.status).toBe(200);
    expect(res.body.data.users[0]).toMatchObject({ totalHabits: 1, totalProgress: 1 });
  });
});
