import {
  Habit,
  CreateHabitRequest,
  UpdateHabitRequest,
  HabitListResponse,
  HabitFilters,
  HabitStatistics,
  CompleteHabitRequest,
  HabitProgress,
} from "@/types/habit";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

class HabitService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    return response.json();
  }

  // Get all habits for the current user
  async getHabits(filters: HabitFilters = {}): Promise<HabitListResponse> {
    const params = new URLSearchParams();

    if (filters.search) params.append("search", filters.search);
    if (filters.frequency) params.append("frequency", filters.frequency);
    if (filters.isActive !== undefined)
      params.append("isActive", filters.isActive.toString());
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());

    const queryString = params.toString();
    const endpoint = `/api/habits${queryString ? `?${queryString}` : ""}`;

    return this.request<HabitListResponse>(endpoint);
  }

  // Get a single habit by ID
  async getHabit(id: string): Promise<Habit> {
    return this.request<Habit>(`/api/habits/${id}`);
  }

  // Create a new habit
  async createHabit(habit: CreateHabitRequest): Promise<Habit> {
    return this.request<Habit>("/api/habits", {
      method: "POST",
      body: JSON.stringify(habit),
    });
  }

  // Update an existing habit
  async updateHabit(id: string, updates: UpdateHabitRequest): Promise<Habit> {
    return this.request<Habit>(`/api/habits/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  // Delete a habit
  async deleteHabit(id: string): Promise<void> {
    return this.request<void>(`/api/habits/${id}`, {
      method: "DELETE",
    });
  }

  // Mark a habit as completed for today
  async completeHabit(
    habitId: string,
    data: CompleteHabitRequest = {}
  ): Promise<HabitProgress> {
    return this.request<HabitProgress>(`/api/progress/${habitId}/complete`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Get progress statistics for a habit
  async getHabitProgress(habitId: string): Promise<HabitStatistics> {
    return this.request<HabitStatistics>(`/api/progress/${habitId}`);
  }

  // Get weekly summary
  async getWeeklySummary(): Promise<HabitStatistics[]> {
    return this.request<HabitStatistics[]>("/api/progress/summary/weekly");
  }

  // Get monthly summary
  async getMonthlySummary(): Promise<HabitStatistics[]> {
    return this.request<HabitStatistics[]>("/api/progress/summary/monthly");
  }

  // Get habit progress for a specific date range
  async getHabitProgressByDateRange(
    habitId: string,
    startDate: string,
    endDate: string
  ): Promise<HabitProgress[]> {
    const params = new URLSearchParams({
      startDate,
      endDate,
    });

    return this.request<HabitProgress[]>(`/api/progress/${habitId}?${params}`);
  }
}

export const habitService = new HabitService();
