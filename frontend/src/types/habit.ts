export interface Habit {
  id: string;
  userId: string;
  name: string;
  description?: string;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY";
  targetCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HabitProgress {
  id: string;
  habitId: string;
  userId: string;
  completedAt: string;
  notes?: string;
}

export interface CreateHabitRequest {
  name: string;
  description?: string;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY";
  targetCount: number;
}

export interface UpdateHabitRequest {
  name?: string;
  description?: string;
  frequency?: "DAILY" | "WEEKLY" | "MONTHLY";
  targetCount?: number;
  isActive?: boolean;
}

export interface HabitStatistics {
  totalCompletions: number;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  weeklyProgress: WeeklyProgress[];
  monthlyProgress: MonthlyProgress[];
}

export interface WeeklyProgress {
  week: string;
  completions: number;
  target: number;
  percentage: number;
}

export interface MonthlyProgress {
  month: string;
  completions: number;
  target: number;
  percentage: number;
}

export interface CompleteHabitRequest {
  notes?: string;
}

export interface HabitListResponse {
  habits: Habit[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface HabitFilters {
  search?: string;
  frequency?: "DAILY" | "WEEKLY" | "MONTHLY";
  isActive?: boolean;
  page?: number;
  limit?: number;
}
