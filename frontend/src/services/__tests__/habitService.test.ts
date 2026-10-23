import { afterEach, describe, expect, it, vi } from "vitest";
import { habitService } from "@/services/habitService";
import { daysAgo, mockApi, ok } from "./testUtils";

afterEach(() => vi.unstubAllGlobals());

const apiHabit = {
  id: "h1",
  userId: "u1",
  name: "Leer",
  frequency: "daily",
  targetCount: 1,
  isActive: true,
  createdAt: daysAgo(40),
  updatedAt: daysAgo(40),
};

describe("habitService", () => {
  it("adapta la lista: frecuencia en mayúsculas y paginación plana", async () => {
    mockApi({
      "/api/habits": ok({
        habits: [apiHabit],
        pagination: { page: 2, limit: 10, total: 11, pages: 2 },
      }),
    });

    const res = await habitService.getHabits({ page: 2 });
    expect(res.habits[0]!.frequency).toBe("DAILY");
    expect(res).toMatchObject({ page: 2, limit: 10, total: 11, totalPages: 2 });
  });

  it("envía los filtros con la frecuencia en minúsculas", async () => {
    const fetchMock = mockApi({
      "/api/habits": ok({ habits: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }),
    });
    await habitService.getHabits({ frequency: "WEEKLY", isActive: true });

    const url = new URL(String(fetchMock.mock.calls[0]![0]));
    expect(url.searchParams.get("frequency")).toBe("weekly");
    expect(url.searchParams.get("isActive")).toBe("true");
  });

  it("crea un hábito enviando la frecuencia que espera el backend", async () => {
    const fetchMock = mockApi({ "POST /api/habits": ok({ habit: apiHabit }) });
    const habit = await habitService.createHabit({ name: "Leer", frequency: "DAILY", targetCount: 1 });

    expect(JSON.parse(fetchMock.mock.calls[0]![1]!.body as string).frequency).toBe("daily");
    expect(habit.frequency).toBe("DAILY");
  });

  it("completa un hábito en POST /api/progress/complete con el habitId en el cuerpo", async () => {
    const fetchMock = mockApi({
      "POST /api/progress/complete": ok({ progress: { id: "p1", habitId: "h1" } }),
    });
    await habitService.completeHabit("h1", { notes: "Bien" });

    expect(JSON.parse(fetchMock.mock.calls[0]![1]!.body as string)).toEqual({ habitId: "h1", notes: "Bien" });
  });

  it("arma las estadísticas: completado hoy, rachas y progreso semanal", async () => {
    mockApi({
      "/api/habits/h1/stats": ok({
        habit: apiHabit,
        stats: { totalProgress: 3, completionRate: 75, streakInfo: { currentStreak: 2, longestStreak: 5 } },
      }),
      "/api/progress/habit/h1": ok({
        progress: [{ id: "a", completedAt: daysAgo(0) }, { id: "b", completedAt: daysAgo(1) }, { id: "c", completedAt: daysAgo(9) }],
      }),
    });

    const stats = await habitService.getHabitProgress("h1");
    expect(stats).toMatchObject({ totalCompletions: 3, currentStreak: 2, longestStreak: 5, completionRate: 75, completedToday: true });
    expect(stats.weeklyProgress).toHaveLength(4);
    expect(stats.weeklyProgress[0]).toMatchObject({ completions: 2, target: 7 });
    expect(stats.weeklyProgress[1]!.completions).toBe(1);
  });

  it("no marca como completado hoy si solo hay registros de días anteriores", async () => {
    mockApi({
      "/api/habits/h1/stats": ok({
        habit: apiHabit,
        stats: { totalProgress: 1, completionRate: 10, streakInfo: { currentStreak: 1, longestStreak: 1 } },
      }),
      "/api/progress/habit/h1": ok({ progress: [{ id: "a", completedAt: daysAgo(1) }] }),
    });

    expect((await habitService.getHabitProgress("h1")).completedToday).toBe(false);
  });

  it("no muestra meses anteriores a la creación del hábito", async () => {
    mockApi({
      "/api/habits/h1/stats": ok({
        habit: { ...apiHabit, createdAt: new Date().toISOString() },
        stats: { totalProgress: 0, completionRate: 0, streakInfo: { currentStreak: 0, longestStreak: 0 } },
      }),
      "/api/progress/habit/h1": ok({ progress: [] }),
    });

    expect((await habitService.getHabitProgress("h1")).monthlyProgress).toHaveLength(1);
  });
});
