import { apiRequest } from "@/lib/api";
import {
  Habit,
  CreateHabitRequest,
  UpdateHabitRequest,
  HabitListResponse,
  HabitFilters,
  HabitStatistics,
  CompleteHabitRequest,
  HabitProgress,
  WeeklyProgress,
  MonthlyProgress,
} from "@/types/habit";

// El backend guarda la frecuencia en minúsculas ("daily"); la UI usa "DAILY".
type ApiFrequency = "daily" | "weekly" | "monthly";
type ApiHabit = Omit<Habit, "frequency"> & { frequency: ApiFrequency };

const fromApi = (habit: ApiHabit): Habit => ({
  ...habit,
  frequency: habit.frequency.toUpperCase() as Habit["frequency"],
});

const toApiFrequency = (frequency?: Habit["frequency"]) =>
  frequency?.toLowerCase() as ApiFrequency | undefined;

const toApiBody = (data: CreateHabitRequest | UpdateHabitRequest) =>
  JSON.stringify({ ...data, frequency: toApiFrequency(data.frequency) });

interface ApiHabitStats {
  habit: ApiHabit;
  stats: {
    totalProgress: number;
    completionRate: number;
    streakInfo: { currentStreak: number; longestStreak: number };
  };
}

interface ApiProgressEntry {
  id: string;
  completedAt: string;
  notes?: string;
}

const dayMs = 24 * 60 * 60 * 1000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// Últimas `weeks` semanas, de la más reciente a la más antigua (la UI lee [0] como "esta semana")
function weeklyBreakdown(entries: ApiProgressEntry[], target: number, weeks = 4): WeeklyProgress[] {
  const today = startOfDay(new Date());
  return Array.from({ length: weeks }, (_, i) => {
    const end = new Date(today.getTime() - i * 7 * dayMs + dayMs);
    const start = new Date(end.getTime() - 7 * dayMs);
    const completions = entries.filter((e) => {
      const t = new Date(e.completedAt).getTime();
      return t >= start.getTime() && t < end.getTime();
    }).length;
    return {
      week: start.toLocaleDateString("es", { day: "numeric", month: "short" }),
      completions,
      target,
      percentage: target ? Math.min(100, Math.round((completions / target) * 100)) : 0,
    };
  });
}

function monthlyBreakdown(
  entries: ApiProgressEntry[],
  frequency: ApiFrequency,
  createdAt: string,
  months = 6
): MonthlyProgress[] {
  const now = new Date();
  const created = new Date(createdAt);
  // Solo los meses desde que existe el hábito
  const available = (now.getFullYear() - created.getFullYear()) * 12 + now.getMonth() - created.getMonth() + 1;
  return Array.from({ length: Math.min(months, available) }, (_, i) => {
    const first = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const days = Math.round((next.getTime() - first.getTime()) / dayMs);
    const target = frequency === "daily" ? days : frequency === "weekly" ? Math.round(days / 7) : 1;
    const completions = entries.filter((e) => {
      const t = new Date(e.completedAt);
      return t >= first && t < next;
    }).length;
    return {
      month: first.toLocaleDateString("es", { month: "short", year: "numeric" }),
      completions,
      target,
      percentage: Math.min(100, Math.round((completions / target) * 100)),
    };
  });
}

class HabitService {
  // Get all habits for the current user
  async getHabits(filters: HabitFilters = {}): Promise<HabitListResponse> {
    const params = new URLSearchParams();

    if (filters.search) params.append("search", filters.search);
    if (filters.frequency) params.append("frequency", toApiFrequency(filters.frequency)!);
    if (filters.isActive !== undefined)
      params.append("isActive", filters.isActive.toString());
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());

    const queryString = params.toString();
    const { habits, pagination } = await apiRequest<{
      habits: ApiHabit[];
      pagination: { page: number; limit: number; total: number; pages: number };
    }>(`/api/habits${queryString ? `?${queryString}` : ""}`);

    return {
      habits: habits.map(fromApi),
      total: pagination.total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: pagination.pages,
    };
  }

  // Get a single habit by ID
  async getHabit(id: string): Promise<Habit> {
    const { habit } = await apiRequest<{ habit: ApiHabit }>(`/api/habits/${id}`);
    return fromApi(habit);
  }

  // Create a new habit
  async createHabit(habit: CreateHabitRequest): Promise<Habit> {
    const { habit: created } = await apiRequest<{ habit: ApiHabit }>("/api/habits", {
      method: "POST",
      body: toApiBody(habit),
    });
    return fromApi(created);
  }

  // Update an existing habit
  async updateHabit(id: string, updates: UpdateHabitRequest): Promise<Habit> {
    const { habit } = await apiRequest<{ habit: ApiHabit }>(`/api/habits/${id}`, {
      method: "PUT",
      body: toApiBody(updates),
    });
    return fromApi(habit);
  }

  // Delete a habit (el backend lo desactiva: soft delete)
  async deleteHabit(id: string): Promise<void> {
    await apiRequest(`/api/habits/${id}`, { method: "DELETE" });
  }

  // Mark a habit as completed for today
  async completeHabit(
    habitId: string,
    data: CompleteHabitRequest = {}
  ): Promise<HabitProgress> {
    const { progress } = await apiRequest<{ progress: HabitProgress }>("/api/progress/complete", {
      method: "POST",
      body: JSON.stringify({ habitId, ...data }),
    });
    return progress;
  }

  // Get progress statistics for a habit
  async getHabitProgress(habitId: string): Promise<HabitStatistics> {
    const [{ habit, stats }, history] = await Promise.all([
      apiRequest<ApiHabitStats>(`/api/habits/${habitId}/stats`),
      this.getHabitProgressHistory(habitId),
    ]);
    const weeklyTarget = habit.frequency === "daily" ? 7 * habit.targetCount : habit.targetCount;

    const today = startOfDay(new Date()).getTime();
    return {
      totalCompletions: stats.totalProgress,
      completedToday: history.some(
        (e) => startOfDay(new Date(e.completedAt)).getTime() === today
      ),
      currentStreak: stats.streakInfo.currentStreak,
      longestStreak: stats.streakInfo.longestStreak,
      completionRate: stats.completionRate,
      weeklyProgress: weeklyBreakdown(history, weeklyTarget),
      monthlyProgress: monthlyBreakdown(history, habit.frequency, habit.createdAt),
    };
  }

  // Get habit progress for a specific date range
  async getHabitProgressByDateRange(
    habitId: string,
    startDate: string,
    endDate: string
  ): Promise<HabitProgress[]> {
    const params = new URLSearchParams({ startDate, endDate, limit: "100" });
    const { progress } = await apiRequest<{ progress: HabitProgress[] }>(
      `/api/progress/habit/${habitId}?${params}`
    );
    return progress;
  }

  // Historial reciente de un hábito (hasta 100 registros, el máximo del backend)
  private async getHabitProgressHistory(habitId: string): Promise<ApiProgressEntry[]> {
    const { progress } = await apiRequest<{ progress: ApiProgressEntry[] }>(
      `/api/progress/habit/${habitId}?limit=100`
    );
    return progress;
  }
}

export const habitService = new HabitService();
