import { prisma } from "../lib/prisma";
import { z } from "zod";

// Validation schemas
export const createHabitSchema = z.object({
  name: z
    .string()
    .min(1, "Habit name is required")
    .max(100, "Habit name too long"),
  description: z.string().max(500, "Description too long").optional(),
  frequency: z.enum(["daily", "weekly", "monthly"], {
    errorMap: () => ({
      message: "Frequency must be daily, weekly, or monthly",
    }),
  }),
  targetCount: z
    .number()
    .int()
    .min(1, "Target count must be at least 1")
    .max(100, "Target count too high"),
});

export const updateHabitSchema = z.object({
  name: z
    .string()
    .min(1, "Habit name is required")
    .max(100, "Habit name too long")
    .optional(),
  description: z.string().max(500, "Description too long").optional(),
  frequency: z.enum(["daily", "weekly", "monthly"]).optional(),
  targetCount: z
    .number()
    .int()
    .min(1, "Target count must be at least 1")
    .max(100, "Target count too high")
    .optional(),
  isActive: z.boolean().optional(),
});

export const toggleHabitSchema = z.object({
  isActive: z.boolean(),
});

export class HabitService {
  /**
   * Get all habits for a specific user
   */
  static async getUserHabits(
    userId: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
    frequency?: string,
    isActive?: boolean
  ) {
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" as any } },
        { description: { contains: search, mode: "insensitive" as any } },
      ];
    }

    if (frequency) {
      where.frequency = frequency;
    }

    if (typeof isActive === "boolean") {
      where.isActive = isActive;
    }

    const [habits, total] = await Promise.all([
      prisma.habit.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          frequency: true,
          targetCount: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              habitProgress: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.habit.count({ where }),
    ]);

    return {
      habits,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get habit by ID (with ownership validation)
   */
  static async getHabitById(habitId: string, userId: string) {
    const habit = await prisma.habit.findFirst({
      where: {
        id: habitId,
        userId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        frequency: true,
        targetCount: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            habitProgress: true,
          },
        },
        habitProgress: {
          take: 10,
          orderBy: { completedAt: "desc" },
          select: {
            id: true,
            completedAt: true,
            notes: true,
          },
        },
      },
    });

    if (!habit) {
      throw new Error("Habit not found");
    }

    return habit;
  }

  /**
   * Create new habit for a user
   */
  static async createHabit(
    userId: string,
    habitData: z.infer<typeof createHabitSchema>
  ) {
    // Check if user already has a habit with the same name
    const existingHabit = await prisma.habit.findFirst({
      where: {
        userId,
        name: habitData.name,
        isActive: true,
      },
    });

    if (existingHabit) {
      throw new Error("You already have an active habit with this name");
    }

    // Create habit
    const habit = await prisma.habit.create({
      data: {
        name: habitData.name,
        description: habitData.description || null,
        frequency: habitData.frequency,
        targetCount: habitData.targetCount,
        userId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        frequency: true,
        targetCount: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return habit;
  }

  /**
   * Update habit
   */
  static async updateHabit(
    habitId: string,
    userId: string,
    updateData: z.infer<typeof updateHabitSchema>
  ) {
    // Check if habit exists and belongs to user
    const existingHabit = await prisma.habit.findFirst({
      where: {
        id: habitId,
        userId,
      },
    });

    if (!existingHabit) {
      throw new Error("Habit not found");
    }

    // If updating name, check for duplicates
    if (updateData.name && updateData.name !== existingHabit.name) {
      const duplicateHabit = await prisma.habit.findFirst({
        where: {
          userId,
          name: updateData.name,
          isActive: true,
          id: { not: habitId },
        },
      });

      if (duplicateHabit) {
        throw new Error("You already have an active habit with this name");
      }
    }

    // Filter out undefined values for Prisma
    const filteredData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    // Update habit
    const habit = await prisma.habit.update({
      where: { id: habitId },
      data: filteredData,
      select: {
        id: true,
        name: true,
        description: true,
        frequency: true,
        targetCount: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return habit;
  }

  /**
   * Toggle habit active status
   */
  static async toggleHabitStatus(
    habitId: string,
    userId: string,
    isActive: boolean
  ) {
    // Check if habit exists and belongs to user
    const existingHabit = await prisma.habit.findFirst({
      where: {
        id: habitId,
        userId,
      },
    });

    if (!existingHabit) {
      throw new Error("Habit not found");
    }

    // Update habit status
    const habit = await prisma.habit.update({
      where: { id: habitId },
      data: { isActive },
      select: {
        id: true,
        name: true,
        description: true,
        frequency: true,
        targetCount: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return habit;
  }

  /**
   * Soft delete habit (set isActive to false)
   */
  static async softDeleteHabit(habitId: string, userId: string) {
    // Check if habit exists and belongs to user
    const existingHabit = await prisma.habit.findFirst({
      where: {
        id: habitId,
        userId,
      },
    });

    if (!existingHabit) {
      throw new Error("Habit not found");
    }

    // Soft delete by setting isActive to false
    const habit = await prisma.habit.update({
      where: { id: habitId },
      data: { isActive: false },
      select: {
        id: true,
        name: true,
        description: true,
        frequency: true,
        targetCount: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return habit;
  }

  /**
   * Hard delete habit (admin only)
   */
  static async hardDeleteHabit(habitId: string) {
    // Check if habit exists
    const existingHabit = await prisma.habit.findUnique({
      where: { id: habitId },
    });

    if (!existingHabit) {
      throw new Error("Habit not found");
    }

    // Delete habit (this will cascade delete progress due to Prisma schema)
    await prisma.habit.delete({
      where: { id: habitId },
    });

    return { success: true, message: "Habit deleted successfully" };
  }

  /**
   * Get habit statistics
   */
  static async getHabitStats(habitId: string, userId: string) {
    // Check if habit exists and belongs to user
    const habit = await prisma.habit.findFirst({
      where: {
        id: habitId,
        userId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        frequency: true,
        targetCount: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!habit) {
      throw new Error("Habit not found");
    }

    // Get progress statistics
    const [totalProgress, recentProgress, streakInfo] = await Promise.all([
      prisma.habitProgress.count({
        where: { habitId },
      }),
      prisma.habitProgress.findMany({
        where: { habitId },
        take: 10,
        orderBy: { completedAt: "desc" },
        select: {
          id: true,
          completedAt: true,
          notes: true,
        },
      }),
      this.calculateStreak(habitId),
    ]);

    return {
      habit,
      stats: {
        totalProgress,
        recentProgress,
        streakInfo,
        completionRate: this.calculateCompletionRate(
          habit.frequency,
          totalProgress,
          habit.createdAt
        ),
      },
    };
  }

  /**
   * Calculate habit streak
   */
  private static async calculateStreak(habitId: string) {
    const progress = await prisma.habitProgress.findMany({
      where: { habitId },
      orderBy: { completedAt: "desc" },
      select: { completedAt: true },
    });

    if (progress.length === 0) {
      return { currentStreak: 0, longestStreak: 0, lastCompleted: null };
    }

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sort by date (oldest first for streak calculation)
    const sortedProgress = progress.sort(
      (a, b) => a.completedAt.getTime() - b.completedAt.getTime()
    );

    for (let i = 0; i < sortedProgress.length; i++) {
      const currentProgress = sortedProgress[i];
      if (!currentProgress) continue;

      const currentDate = new Date(currentProgress.completedAt);
      currentDate.setHours(0, 0, 0, 0);

      if (i === 0) {
        tempStreak = 1;
        if (currentDate.getTime() === today.getTime()) {
          currentStreak = 1;
        }
      } else {
        const prevProgress = sortedProgress[i - 1];
        if (!prevProgress) continue;

        const prevDate = new Date(prevProgress.completedAt);
        prevDate.setHours(0, 0, 0, 0);
        const dayDiff =
          (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

        if (dayDiff === 1) {
          tempStreak++;
          if (
            i === sortedProgress.length - 1 &&
            currentDate.getTime() === today.getTime()
          ) {
            currentStreak = tempStreak;
          }
        } else {
          tempStreak = 1;
        }
      }

      longestStreak = Math.max(longestStreak, tempStreak);
    }

    return {
      currentStreak,
      longestStreak,
      lastCompleted: progress[0]?.completedAt || null,
    };
  }

  /**
   * Calculate completion rate based on frequency
   */
  private static calculateCompletionRate(
    frequency: string,
    totalProgress: number,
    createdAt: Date
  ) {
    const now = new Date();
    const daysSinceCreation = Math.ceil(
      (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    let expectedCompletions = 0;

    switch (frequency) {
      case "daily":
        expectedCompletions = daysSinceCreation;
        break;
      case "weekly":
        expectedCompletions = Math.ceil(daysSinceCreation / 7);
        break;
      case "monthly":
        expectedCompletions = Math.ceil(daysSinceCreation / 30);
        break;
      default:
        expectedCompletions = daysSinceCreation;
    }

    if (expectedCompletions === 0) {
      return 0;
    }

    return Math.min(100, Math.round((totalProgress / expectedCompletions) * 100));
  }

  /**
   * Get habits by frequency for a user
   */
  static async getHabitsByFrequency(userId: string, frequency: string) {
    const habits = await prisma.habit.findMany({
      where: {
        userId,
        frequency,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        frequency: true,
        targetCount: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            habitProgress: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return habits;
  }

  /**
   * Get user's habit summary
   */
  static async getUserHabitSummary(userId: string) {
    const [totalHabits, activeHabits, totalProgress, habitsByFrequency] =
      await Promise.all([
        prisma.habit.count({ where: { userId } }),
        prisma.habit.count({ where: { userId, isActive: true } }),
        prisma.habitProgress.count({ where: { userId } }),
        prisma.habit.groupBy({
          by: ["frequency"],
          where: { userId, isActive: true },
          _count: { id: true },
        }),
      ]);

    return {
      totalHabits,
      activeHabits,
      totalProgress,
      habitsByFrequency: habitsByFrequency.reduce((acc, curr) => {
        acc[curr.frequency] = curr._count.id;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}
