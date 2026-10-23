import { apiRequest } from "@/lib/api";

interface HabitsSummary {
  totalHabits: number;
  activeHabits: number;
  totalProgress: number;
}

interface ProgressSummary {
  totalProgress: number;
  recentProgress: {
    id: string;
    completedAt: string;
    notes?: string;
    habit: { id: string; name: string };
  }[];
}

interface WeeklySummary {
  totalCompletions: number;
  completionRate: number;
  dailyBreakdown: { date: string; completedHabits: number }[];
}

interface MonthlySummary {
  totalCompletions: number;
  completionRate: number;
}

interface ApiHabit {
  id: string;
  name: string;
  frequency: "daily" | "weekly" | "monthly";
}

export interface HabitOverview {
  id: string;
  name: string;
  frequency: ApiHabit["frequency"];
  currentStreak: number;
  longestStreak: number;
  last30DaysRate: number; // % de cumplimiento en los últimos 30 días
}

export interface DashboardData {
  totalHabits: number;
  activeHabits: number;
  totalCompletions: number;
  completedToday: number;
  weekRate: number;
  weekCompletions: number;
  monthRate: number;
  monthCompletions: number;
  habits: HabitOverview[];
  recentActivity: ProgressSummary["recentProgress"];
}

const DAYS_WINDOW = 30;

// Fecha local en formato YYYY-MM-DD (el backend agrupa por día local)
const localDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

async function habitOverview(habit: ApiHabit): Promise<HabitOverview> {
  const since = new Date();
  since.setDate(since.getDate() - (DAYS_WINDOW - 1));
  since.setHours(0, 0, 0, 0);

  const [{ streak }, { progress }] = await Promise.all([
    apiRequest<{ streak: { currentStreak: number; longestStreak: number } }>(
      `/api/progress/streak/${habit.id}`
    ),
    apiRequest<{ progress: { completedAt: string }[] }>(
      `/api/progress/habit/${habit.id}?limit=100&startDate=${since.toISOString()}`
    ),
  ]);

  const expected =
    habit.frequency === "daily" ? DAYS_WINDOW : habit.frequency === "weekly" ? Math.ceil(DAYS_WINDOW / 7) : 1;

  return {
    id: habit.id,
    name: habit.name,
    frequency: habit.frequency,
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    last30DaysRate: Math.min(100, Math.round((progress.length / expected) * 100)),
  };
}

export const dashboardService = {
  async getDashboard(): Promise<DashboardData> {
    const [habitsSummary, progress, week, month, { habits }] = await Promise.all([
      apiRequest<HabitsSummary>("/api/habits/summary"),
      apiRequest<ProgressSummary>("/api/progress/summary"),
      apiRequest<WeeklySummary>("/api/progress/summary/weekly"),
      apiRequest<MonthlySummary>("/api/progress/summary/monthly"),
      apiRequest<{ habits: ApiHabit[] }>("/api/habits?isActive=true&limit=100"),
    ]);

    const today = localDate(new Date());

    return {
      totalHabits: habitsSummary.totalHabits,
      activeHabits: habitsSummary.activeHabits,
      totalCompletions: habitsSummary.totalProgress,
      completedToday: week.dailyBreakdown.find((d) => d.date === today)?.completedHabits ?? 0,
      weekRate: Math.round(week.completionRate),
      weekCompletions: week.totalCompletions,
      monthRate: Math.round(month.completionRate),
      monthCompletions: month.totalCompletions,
      habits: await Promise.all(habits.map(habitOverview)),
      recentActivity: progress.recentProgress,
    };
  },
};
