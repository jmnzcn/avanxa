import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { app, createHabit, prisma, resetDatabase, signUp } from "./helpers";

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

describe("habits", () => {
  it("requiere sesión", async () => {
    expect((await request(app).get("/api/habits")).status).toBe(401);
  });

  it("crea un hábito y lo lista con paginación", async () => {
    const { agent } = await signUp();
    await createHabit(agent, { name: "Leer", description: "30 minutos" });

    const res = await agent.get("/api/habits");
    expect(res.status).toBe(200);
    expect(res.body.data.habits).toHaveLength(1);
    expect(res.body.data.habits[0]).toMatchObject({ name: "Leer", frequency: "daily", isActive: true });
    expect(res.body.data.pagination).toMatchObject({ page: 1, total: 1, pages: 1 });
  });

  it("valida la frecuencia y el objetivo", async () => {
    const { agent } = await signUp();
    const res = await agent
      .post("/api/habits")
      .send({ name: "Mal", frequency: "DAILY", targetCount: 0 });
    expect(res.status).toBe(400);
  });

  it("no permite dos hábitos activos con el mismo nombre", async () => {
    const { agent } = await signUp();
    await createHabit(agent, { name: "Meditar" });
    const res = await agent
      .post("/api/habits")
      .send({ name: "Meditar", frequency: "daily", targetCount: 1 });
    expect(res.status).toBe(409);
  });

  it("actualiza un hábito", async () => {
    const { agent } = await signUp();
    const habit = await createHabit(agent);
    const res = await agent.put(`/api/habits/${habit.id}`).send({ name: "Nuevo nombre" });
    expect(res.status).toBe(200);
    expect(res.body.data.habit.name).toBe("Nuevo nombre");
  });

  it("eliminar es un borrado lógico: el hábito queda inactivo", async () => {
    const { agent } = await signUp();
    const habit = await createHabit(agent);

    expect((await agent.delete(`/api/habits/${habit.id}`)).status).toBe(200);

    const stored = await prisma.habit.findUnique({ where: { id: habit.id } });
    expect(stored?.isActive).toBe(false);
    const active = await agent.get("/api/habits?isActive=true");
    expect(active.body.data.habits).toHaveLength(0);
  });

  it("un usuario no puede ver ni modificar hábitos de otro", async () => {
    const owner = await signUp();
    const intruder = await signUp();
    const habit = await createHabit(owner.agent);

    expect((await intruder.agent.get(`/api/habits/${habit.id}`)).status).toBe(404);
    expect((await intruder.agent.put(`/api/habits/${habit.id}`).send({ name: "x" })).status).toBe(404);
    expect((await intruder.agent.get("/api/habits")).body.data.habits).toHaveLength(0);
  });

  it("las estadísticas limitan la tasa de cumplimiento al 100 %", async () => {
    const { agent, user } = await signUp();
    const habit = await createHabit(agent);

    // Registros anteriores a la creación del hábito (como los del seed) inflaban la tasa
    const days = [0, 1, 2, 3, 4].map((n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000));
    await prisma.habitProgress.createMany({
      data: days.map((completedAt) => ({ habitId: habit.id, userId: user.id, completedAt })),
    });

    const res = await agent.get(`/api/habits/${habit.id}/stats`);
    expect(res.status).toBe(200);
    expect(res.body.data.stats.totalProgress).toBe(5);
    expect(res.body.data.stats.completionRate).toBe(100);
    expect(res.body.data.stats.streakInfo.currentStreak).toBe(5);
  });
});
