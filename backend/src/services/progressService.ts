import { prisma } from "../lib/prisma";
import { calculateStreak, type Frequency } from "../lib/streak";
import { z } from "zod";

// Validation schemas
export const createProgressSchema = z.object({
  habitId: z.string().min(1, "Habit ID is required"),
  notes: z.string().max(500, "Notes too long").optional(),
  completedAt: z.string().datetime().optional(), // ISO string, defaults to now
});

export const updateProgressSchema = z.object({
  notes: z.string().max(500, "Notes too long").optional(),
  completedAt: z.string().datetime().optional(),
});

export const bulkProgressSchema = z.object({
  habitIds: z.array(z.string()).min(1, "At least one habit ID is required"),
  notes: z.string().max(500, "Notes too long").optional(),
  completedAt: z.string().datetime().optional(),
});

export class ProgressService {
  /**
   * Mark a habit as completed for a specific date
   */
  static async markHabitCompleted(
    userId: string,
    habitId: string,
    progressData: z.infer<typeof createProgressSchema>
  ) {
    // Check if habit exists and belongs to user
    const habit = await prisma.habit.findFirst({
      where: {
        id: habitId,
        userId,
        isActive: true,
      },
    });

    if (!habit) {
      throw new Error("Habit not found or inactive");
    }

    // Parse completion date (default to now if not provided)
    const completedAt = progressData.completedAt
      ? new Date(progressData.completedAt)
      : new Date();

    // Check if habit was already completed for this date
    const existingProgress = await prisma.habitProgress.findFirst({
      where: {
        habitId,
        userId,
        completedAt: {
          gte: new Date(
            completedAt.getFullYear(),
            completedAt.getMonth(),
            completedAt.getDate()
          ),
          lt: new Date(
            completedAt.getFullYear(),
            completedAt.getMonth(),
            completedAt.getDate() + 1
          ),
        },
      },
    });

    if (existingProgress) {
      throw new Error("Habit already completed for this date");
    }

    // Create progress entry
    const progress = await prisma.habitProgress.create({
      data: {
        habitId,
        userId,
        notes: progressData.notes || null,
        completedAt,
      },
      select: {
        id: true,
        habitId: true,
        userId: true,
        notes: true,
        completedAt: true,
        habit: {
          select: {
            id: true,
            name: true,
            frequency: true,
            targetCount: true,
          },
        },
      },
    });

    return progress;
  }

  /**
   * Mark multiple habits as completed for a specific date
   */
  static async markMultipleHabitsCompleted(
    userId: string,
    progressData: z.infer<typeof bulkProgressSchema>
  ) {
    const completedAt = progressData.completedAt
      ? new Date(progressData.completedAt)
      : new Date();

    const results = [];
    const errors = [];

    for (const habitId of progressData.habitIds) {
      try {
        const progress = await this.markHabitCompleted(userId, habitId, {
          habitId,
          notes: progressData.notes,
          completedAt: completedAt.toISOString(),
        });
        results.push(progress);
      } catch (error) {
        errors.push({
          habitId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      successful: results,
      failed: errors,
      totalRequested: progressData.habitIds.length,
      totalSuccessful: results.length,
      totalFailed: errors.length,
    };
  }

  /**
   * Update progress entry
   */
  static async updateProgress(
    progressId: string,
    userId: string,
    updateData: z.infer<typeof updateProgressSchema>
  ) {
    // Check if progress exists and belongs to user
    const existingProgress = await prisma.habitProgress.findFirst({
      where: {
        id: progressId,
        userId,
      },
    });

    if (!existingProgress) {
      throw new Error("Progress entry not found");
    }

    // Filter out undefined values for Prisma
    const filteredData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    // Update progress
    const progress = await prisma.habitProgress.update({
      where: { id: progressId },
      data: filteredData,
      select: {
        id: true,
        habitId: true,
        userId: true,
        notes: true,
        completedAt: true,
        habit: {
          select: {
            id: true,
            name: true,
            frequency: true,
            targetCount: true,
          },
        },
      },
    });

    return progress;
  }

  /**
   * Delete progress entry
   */
  static async deleteProgress(progressId: string, userId: string) {
    // Check if progress exists and belongs to user
    const existingProgress = await prisma.habitProgress.findFirst({
      where: {
        id: progressId,
        userId,
      },
    });

    if (!existingProgress) {
      throw new Error("Progress entry not found");
    }

    // Delete progress
    await prisma.habitProgress.delete({
      where: { id: progressId },
    });

    return { success: true, message: "Progress entry deleted successfully" };
  }

  /**
   * Get progress for a specific habit
   */
  static async getHabitProgress(
    habitId: string,
    userId: string,
    page: number = 1,
    limit: number = 20,
    startDate?: string,
    endDate?: string
  ) {
    // Check if habit exists and belongs to user
    const habit = await prisma.habit.findFirst({
      where: {
        id: habitId,
        userId,
      },
    });

    if (!habit) {
      throw new Error("Habit not found");
    }

    const skip = (page - 1) * limit;

    const where: any = {
      habitId,
      userId,
    };

    // Add date filtering if provided
    if (startDate || endDate) {
      where.completedAt = {};
      if (startDate) {
        where.completedAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.completedAt.lte = new Date(endDate);
      }
    }

    const [progress, total] = await Promise.all([
      prisma.habitProgress.findMany({
        where,
        select: {
          id: true,
          notes: true,
          completedAt: true,
          habit: {
            select: {
              id: true,
              name: true,
              frequency: true,
              targetCount: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { completedAt: "desc" },
      }),
      prisma.habitProgress.count({ where }),
    ]);

    return {
      progress,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user's progress summary
   */
  static async getUserProgressSummary(
    userId: string,
    startDate?: string,
    endDate?: string
  ) {
    const where: any = { userId };

    // Add date filtering if provided
    if (startDate || endDate) {
      where.completedAt = {};
      if (startDate) {
        where.completedAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.completedAt.lte = new Date(endDate);
      }
    }

    const [totalProgress, habitsWithProgress, recentProgress] =
      await Promise.all([
        prisma.habitProgress.count({ where }),
        prisma.habitProgress.groupBy({
          by: ["habitId"],
          where,
          _count: { id: true },
          _max: { completedAt: true },
        }),
        prisma.habitProgress.findMany({
          where,
          take: 10,
          orderBy: { completedAt: "desc" },
          select: {
            id: true,
            completedAt: true,
            notes: true,
            habit: {
              select: {
                id: true,
                name: true,
                frequency: true,
              },
            },
          },
        }),
      ]);

    // Get habit details for progress summary
    const habitIds = habitsWithProgress.map((h) => h.habitId);
    const habits = await prisma.habit.findMany({
      where: { id: { in: habitIds } },
      select: {
        id: true,
        name: true,
        frequency: true,
        targetCount: true,
      },
    });

    // Create habit progress summary
    const habitProgressSummary = habits.map((habit) => {
      const progressData = habitsWithProgress.find(
        (h) => h.habitId === habit.id
      );
      const lastCompleted = progressData?._max.completedAt;
      const completionCount = progressData?._count.id || 0;

      return {
        habitId: habit.id,
        habitName: habit.name,
        frequency: habit.frequency,
        targetCount: habit.targetCount,
        completionCount,
        lastCompleted,
        completionRate: this.calculateHabitCompletionRate(
          habit.frequency,
          completionCount,
          startDate,
          endDate
        ),
      };
    });

    return {
      totalProgress,
      habitProgressSummary,
      recentProgress,
      period: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
    };
  }

  /**
   * Get weekly progress summary
   */
  static async getWeeklyProgressSummary(userId: string, weekStart?: string) {
    let weekStartDate: Date;

    if (weekStart) {
      weekStartDate = new Date(weekStart);
    } else {
      // Default to current week (Monday)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      weekStartDate = new Date(now);
      weekStartDate.setDate(now.getDate() - daysToMonday);
      weekStartDate.setHours(0, 0, 0, 0);
    }

    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 6);
    weekEndDate.setHours(23, 59, 59, 999);

    const where = {
      userId,
      completedAt: {
        gte: weekStartDate,
        lte: weekEndDate,
      },
    };

    const [weeklyProgress, habits] = await Promise.all([
      prisma.habitProgress.findMany({
        where,
        select: {
          id: true,
          completedAt: true,
          habitId: true,
          habit: {
            select: {
              id: true,
              name: true,
              frequency: true,
              targetCount: true,
            },
          },
        },
        orderBy: { completedAt: "asc" },
      }),
      prisma.habit.findMany({
        where: {
          userId,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          frequency: true,
          targetCount: true,
        },
      }),
    ]);

    // Create daily breakdown
    const dailyBreakdown = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStartDate);
      date.setDate(weekStartDate.getDate() + i);

      const dayProgress = weeklyProgress.filter((p) => {
        const progressDate = new Date(p.completedAt);
        return progressDate.toDateString() === date.toDateString();
      });

      dailyBreakdown.push({
        date: date.toISOString().split("T")[0],
        dayName: date.toLocaleDateString("en-US", { weekday: "long" }),
        completedHabits: dayProgress.length,
        habits: dayProgress.map((p) => ({
          habitId: p.habitId,
          habitName: p.habit.name,
          frequency: p.habit.frequency,
        })),
      });
    }

    // Calculate weekly statistics
    const totalCompletions = weeklyProgress.length;
    const activeHabits = habits.length;
    const averageDailyCompletions = totalCompletions / 7;
    const completionRate =
      activeHabits > 0 ? (totalCompletions / (activeHabits * 7)) * 100 : 0;

    return {
      weekStart: weekStartDate.toISOString(),
      weekEnd: weekEndDate.toISOString(),
      totalCompletions,
      activeHabits,
      averageDailyCompletions: Math.round(averageDailyCompletions * 100) / 100,
      completionRate: Math.round(completionRate * 100) / 100,
      dailyBreakdown,
      habits,
    };
  }

  /**
   * Get monthly progress summary
   */
  static async getMonthlyProgressSummary(userId: string, month?: string) {
    let monthStart: Date;

    if (month) {
      monthStart = new Date(month);
    } else {
      // Default to current month
      const now = new Date();
      monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const monthEnd = new Date(
      monthStart.getFullYear(),
      monthStart.getMonth() + 1,
      0
    );
    monthEnd.setHours(23, 59, 59, 999);

    const where = {
      userId,
      completedAt: {
        gte: monthStart,
        lte: monthEnd,
      },
    };

    const [monthlyProgress, habits] = await Promise.all([
      prisma.habitProgress.findMany({
        where,
        select: {
          id: true,
          completedAt: true,
          habitId: true,
          habit: {
            select: {
              id: true,
              name: true,
              frequency: true,
              targetCount: true,
            },
          },
        },
        orderBy: { completedAt: "asc" },
      }),
      prisma.habit.findMany({
        where: {
          userId,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          frequency: true,
          targetCount: true,
        },
      }),
    ]);

    // Create weekly breakdown
    const weeklyBreakdown = [];
    const daysInMonth = monthEnd.getDate();

    for (let week = 0; week < Math.ceil(daysInMonth / 7); week++) {
      const weekStart = new Date(monthStart);
      weekStart.setDate(monthStart.getDate() + week * 7);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      if (weekEnd > monthEnd) weekEnd.setDate(monthEnd.getDate());

      const weekProgress = monthlyProgress.filter((p) => {
        const progressDate = new Date(p.completedAt);
        return progressDate >= weekStart && progressDate <= weekEnd;
      });

      weeklyBreakdown.push({
        week: week + 1,
        weekStart: weekStart.toISOString().split("T")[0],
        weekEnd: weekEnd.toISOString().split("T")[0],
        completedHabits: weekProgress.length,
        habits: weekProgress.map((p) => ({
          habitId: p.habitId,
          habitName: p.habit.name,
          frequency: p.habit.frequency,
        })),
      });
    }

    // Calculate monthly statistics
    const totalCompletions = monthlyProgress.length;
    const activeHabits = habits.length;
    const daysInMonthCount = monthEnd.getDate();
    const averageDailyCompletions = totalCompletions / daysInMonthCount;
    const completionRate =
      activeHabits > 0
        ? (totalCompletions / (activeHabits * daysInMonthCount)) * 100
        : 0;

    return {
      month: monthStart.toISOString().substring(0, 7), // YYYY-MM format
      monthStart: monthStart.toISOString(),
      monthEnd: monthEnd.toISOString(),
      daysInMonth: daysInMonthCount,
      totalCompletions,
      activeHabits,
      averageDailyCompletions: Math.round(averageDailyCompletions * 100) / 100,
      completionRate: Math.round(completionRate * 100) / 100,
      weeklyBreakdown,
      habits,
    };
  }

  /**
   * Get streak information for a habit
   */
  static async getHabitStreak(habitId: string, userId: string) {
    // Check if habit exists and belongs to user
    const habit = await prisma.habit.findFirst({
      where: {
        id: habitId,
        userId,
      },
    });

    if (!habit) {
      throw new Error("Habit not found");
    }

    const progress = await prisma.habitProgress.findMany({
      where: { habitId, userId },
      orderBy: { completedAt: "desc" },
      select: { completedAt: true },
    });

    return {
      ...calculateStreak(
        progress.map((p) => p.completedAt),
        habit.frequency as Frequency
      ),
      lastCompleted: progress[0]?.completedAt || null,
      totalCompletions: progress.length,
    };
  }

  /**
   * Calculate habit completion rate for a specific period
   */
  private static calculateHabitCompletionRate(
    frequency: string,
    completionCount: number,
    startDate?: string,
    endDate?: string
  ): number {
    if (completionCount === 0) return 0;

    let periodDays = 1;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      periodDays =
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) +
        1;
    } else {
      // Default to 30 days if no period specified
      periodDays = 30;
    }

    let expectedCompletions = 0;

    switch (frequency) {
      case "daily":
        expectedCompletions = periodDays;
        break;
      case "weekly":
        expectedCompletions = Math.ceil(periodDays / 7);
        break;
      case "monthly":
        expectedCompletions = Math.ceil(periodDays / 30);
        break;
      default:
        expectedCompletions = periodDays;
    }

    if (expectedCompletions === 0) return 0;
    return Math.round((completionCount / expectedCompletions) * 100);
  }
}
