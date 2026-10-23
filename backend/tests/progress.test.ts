import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createHabit, prisma, resetDatabase, signUp } from "./helpers";

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

describe("progress", () => {
  it("marca un hábito como completado hoy", async () => {
    const { agent } = await signUp();
    const habit = await createHabit(agent);

    const res = await agent
      .post("/api/progress/complete")
      .send({ habitId: habit.id, notes: "Hecho" });
    expect(res.status).toBe(201);
    expect(res.body.data.progress.notes).toBe("Hecho");
  });

  it("no permite completar el mismo hábito dos veces el mismo día", async () => {
    const { agent } = await signUp();
    const habit = await createHabit(agent);

    await agent.post("/api/progress/complete").send({ habitId: habit.id });
    const again = await agent.post("/api/progress/complete").send({ habitId: habit.id });
    expect(again.status).toBe(409);
  });

  it("no permite completar hábitos de otro usuario", async () => {
    const owner = await signUp();
    const intruder = await signUp();
    const habit = await createHabit(owner.agent);

    const res = await intruder.agent.post("/api/progress/complete").send({ habitId: habit.id });
    expect(res.status).toBe(404);
  });

  it("devuelve el historial de un hábito", async () => {
    const { agent } = await signUp();
    const habit = await createHabit(agent);
    await agent.post("/api/progress/complete").send({ habitId: habit.id });
    await agent
      .post("/api/progress/complete")
      .send({ habitId: habit.id, completedAt: daysAgo(1).toISOString() });

    const res = await agent.get(`/api/progress/habit/${habit.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.progress).toHaveLength(2);
  });

  it("calcula la racha de un hábito diario", async () => {
    const { agent } = await signUp();
    const habit = await createHabit(agent);
    for (const n of [0, 1, 2, 4]) {
      await agent
        .post("/api/progress/complete")
        .send({ habitId: habit.id, completedAt: daysAgo(n).toISOString() });
    }

    const res = await agent.get(`/api/progress/streak/${habit.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.streak).toMatchObject({
      currentStreak: 3,
      longestStreak: 3,
      totalCompletions: 4,
    });
  });

  it("calcula la racha de un hábito semanal por semanas", async () => {
    const { agent } = await signUp();
    const habit = await createHabit(agent, { frequency: "weekly" });
    for (const n of [0, 7, 14]) {
      await agent
        .post("/api/progress/complete")
        .send({ habitId: habit.id, completedAt: daysAgo(n).toISOString() });
    }

    const res = await agent.get(`/api/progress/streak/${habit.id}`);
    expect(res.body.data.streak.currentStreak).toBe(3);
  });

  it("resume la semana actual", async () => {
    const { agent } = await signUp();
    const habit = await createHabit(agent);
    await agent.post("/api/progress/complete").send({ habitId: habit.id });

    const res = await agent.get("/api/progress/summary/weekly");
    expect(res.status).toBe(200);
    expect(res.body.data.totalCompletions).toBe(1);
    expect(res.body.data.dailyBreakdown).toHaveLength(7);
  });
});
