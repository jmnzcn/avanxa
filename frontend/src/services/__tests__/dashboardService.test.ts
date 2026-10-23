import { afterEach, describe, expect, it, vi } from "vitest";
import { dashboardService } from "@/services/dashboardService";
import { daysAgo, mockApi, ok } from "./testUtils";

afterEach(() => vi.unstubAllGlobals());

const localDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

describe("dashboardService", () => {
  it("arma el panel a partir de los endpoints reales", async () => {
    const today = localDate(new Date());
    mockApi({
      "/api/habits/summary": ok({ totalHabits: 3, activeHabits: 2, totalProgress: 40 }),
      "/api/progress/summary": ok({
        totalProgress: 40,
        recentProgress: [{ id: "p1", completedAt: daysAgo(0), habit: { id: "h1", name: "Leer" } }],
      }),
      "/api/progress/summary/weekly": ok({
        totalCompletions: 9,
        completionRate: 64.29,
        dailyBreakdown: [{ date: today, completedHabits: 2 }],
      }),
      "/api/progress/summary/monthly": ok({ totalCompletions: 30, completionRate: 48.4 }),
      "/api/habits": ok({
        habits: [
          { id: "h1", name: "Leer", frequency: "daily" },
          { id: "h2", name: "Planificar", frequency: "weekly" },
        ],
      }),
      "/api/progress/streak/h1": ok({ streak: { currentStreak: 12, longestStreak: 20 } }),
      "/api/progress/streak/h2": ok({ streak: { currentStreak: 3, longestStreak: 4 } }),
      // 15 completaciones en 30 días → 50 %; 5 semanales en 30 días (5 semanas) → 100 %
      "/api/progress/habit/h1": ok({ progress: Array.from({ length: 15 }, (_, i) => ({ completedAt: daysAgo(i * 2) })) }),
      "/api/progress/habit/h2": ok({ progress: Array.from({ length: 5 }, (_, i) => ({ completedAt: daysAgo(i * 7) })) }),
    });

    const data = await dashboardService.getDashboard();

    expect(data).toMatchObject({
      totalHabits: 3,
      activeHabits: 2,
      totalCompletions: 40,
      completedToday: 2,
      weekRate: 64,
      weekCompletions: 9,
      monthRate: 48,
      monthCompletions: 30,
    });
    expect(data.recentActivity).toHaveLength(1);
    expect(data.habits).toEqual([
      { id: "h1", name: "Leer", frequency: "daily", currentStreak: 12, longestStreak: 20, last30DaysRate: 50 },
      { id: "h2", name: "Planificar", frequency: "weekly", currentStreak: 3, longestStreak: 4, last30DaysRate: 100 },
    ]);
  });

  it("muestra 0 completados hoy si la semana no tiene registros de hoy", async () => {
    mockApi({
      "/api/habits/summary": ok({ totalHabits: 0, activeHabits: 0, totalProgress: 0 }),
      "/api/progress/summary": ok({ totalProgress: 0, recentProgress: [] }),
      "/api/progress/summary/weekly": ok({ totalCompletions: 0, completionRate: 0, dailyBreakdown: [] }),
      "/api/progress/summary/monthly": ok({ totalCompletions: 0, completionRate: 0 }),
      "/api/habits": ok({ habits: [] }),
    });

    const data = await dashboardService.getDashboard();
    expect(data.completedToday).toBe(0);
    expect(data.habits).toEqual([]);
  });
});
