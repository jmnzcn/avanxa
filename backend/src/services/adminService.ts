import { prisma } from "../lib/prisma";
import { z } from "zod";

// Validation schemas
export const adminStatsSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const auditLogSchema = z.object({
  action: z.string().min(1, "Action is required"),
  targetType: z.enum(["USER", "HABIT", "PROGRESS", "SYSTEM"]),
  targetId: z.string().optional(),
  details: z.string().max(1000, "Details too long").optional(),
  metadata: z.record(z.any()).optional(),
});

export class AdminService {
  /**
   * Get comprehensive admin dashboard statistics
   */
  static async getAdminDashboardStats(startDate?: string, endDate?: string) {
    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [
      totalUsers,
      activeUsers,
      blockedUsers,
      totalHabits,
      activeHabits,
      totalProgress,
      recentRegistrations,
      recentActivity,
      habitsByFrequency,
      userGrowth,
      systemHealth,
    ] = await Promise.all([
      // User statistics
      prisma.user.count(),
      prisma.user.count({ where: { isBlocked: false } }),
      prisma.user.count({ where: { isBlocked: true } }),

      // Habit statistics
      prisma.habit.count(),
      prisma.habit.count({ where: { isActive: true } }),

      // Progress statistics
      prisma.habitProgress.count(),

      // Recent registrations (last 7 days)
      prisma.user.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
        },
        take: 10,
        orderBy: { createdAt: "desc" },
      }),

      // Recent activity (last 7 days)
      prisma.habitProgress.findMany({
        where: {
          completedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          id: true,
          completedAt: true,
          habit: {
            select: {
              id: true,
              name: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        take: 20,
        orderBy: { completedAt: "desc" },
      }),

      // Habits by frequency
      prisma.habit.groupBy({
        by: ["frequency"],
        where: { isActive: true },
        _count: { id: true },
      }),

      // User growth over time (last 30 days)
      this.getUserGrowthData(30),

      // System health check
      this.getSystemHealth(),
    ]);

    // Calculate additional metrics
    const userEngagement =
      totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
    const habitAdoption = totalUsers > 0 ? totalHabits / totalUsers : 0;
    const progressRate = totalHabits > 0 ? totalProgress / totalHabits : 0;

    return {
      overview: {
        totalUsers,
        activeUsers,
        blockedUsers,
        userEngagement: Math.round(userEngagement * 100) / 100,
      },
      habits: {
        totalHabits,
        activeHabits,
        habitAdoption: Math.round(habitAdoption * 100) / 100,
        habitsByFrequency: habitsByFrequency.reduce((acc, curr) => {
          acc[curr.frequency] = curr._count.id;
          return acc;
        }, {} as Record<string, number>),
      },
      progress: {
        totalProgress,
        progressRate: Math.round(progressRate * 100) / 100,
      },
      recentActivity: {
        registrations: recentRegistrations,
        progress: recentActivity,
      },
      trends: {
        userGrowth,
      },
      system: systemHealth,
      period: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
    };
  }

  /**
   * Get user growth data over a specified number of days
   */
  private static async getUserGrowthData(days: number) {
    const growthData = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);

      const userCount = await prisma.user.count({
        where: {
          createdAt: {
            lt: nextDate,
          },
        },
      });

      growthData.push({
        date: date.toISOString().split("T")[0],
        userCount,
      });
    }

    return growthData;
  }

  /**
   * Get system health information
   */
  static async getSystemHealth() {
    try {
      // Test database connection
      await prisma.$queryRaw`SELECT 1`;

      // Get database size info (if available)
      const dbInfo = await prisma.$queryRaw`
        SELECT 
          pg_size_pretty(pg_database_size(current_database())) as database_size,
          current_database() as database_name
      `;

      return {
        status: "healthy",
        database: "connected",
        databaseInfo: dbInfo,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: "unhealthy",
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get admin-specific user statistics
   */
  static async getAdminUserStats(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isBlocked: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const [habits, progress, recentActivity] = await Promise.all([
      prisma.habit.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          frequency: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              habitProgress: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.habitProgress.findMany({
        where: { userId },
        select: {
          id: true,
          completedAt: true,
          habit: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        take: 20,
        orderBy: { completedAt: "desc" },
      }),
      prisma.habitProgress.findMany({
        where: {
          userId,
          completedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          id: true,
          completedAt: true,
          habit: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        take: 10,
        orderBy: { completedAt: "desc" },
      }),
    ]);

    // Calculate user engagement metrics
    const totalHabits = habits.length;
    const activeHabits = habits.filter((h) => h.isActive).length;
    const totalProgress = progress.length;
    const recentProgress = recentActivity.length;

    // Calculate completion rate for the last 7 days
    const expectedCompletions = activeHabits * 7; // Assuming daily habits
    const completionRate =
      expectedCompletions > 0
        ? (recentProgress / expectedCompletions) * 100
        : 0;

    return {
      user,
      statistics: {
        totalHabits,
        activeHabits,
        totalProgress,
        recentProgress,
        completionRate: Math.round(completionRate * 100) / 100,
      },
      habits,
      recentActivity,
    };
  }

  /**
   * Get system-wide habit statistics
   */
  static async getSystemHabitStats() {
    const [
      totalHabits,
      activeHabits,
      habitsByFrequency,
      habitsByUser,
      topHabits,
    ] = await Promise.all([
      prisma.habit.count(),
      prisma.habit.count({ where: { isActive: true } }),
      prisma.habit.groupBy({
        by: ["frequency"],
        where: { isActive: true },
        _count: { id: true },
      }),
      prisma.habit.groupBy({
        by: ["userId"],
        where: { isActive: true },
        _count: { id: true },
      }),
      prisma.habit.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          frequency: true,
          _count: {
            select: {
              habitProgress: true,
            },
          },
        },
        orderBy: {
          habitProgress: {
            _count: "desc",
          },
        },
        take: 10,
      }),
    ]);

    // Calculate average habits per user
    const uniqueUsers = habitsByUser.length;
    const averageHabitsPerUser =
      uniqueUsers > 0 ? totalHabits / uniqueUsers : 0;

    return {
      overview: {
        totalHabits,
        activeHabits,
        averageHabitsPerUser: Math.round(averageHabitsPerUser * 100) / 100,
      },
      frequency: habitsByFrequency.reduce((acc, curr) => {
        acc[curr.frequency] = curr._count.id;
        return acc;
      }, {} as Record<string, number>),
      topHabits: topHabits.map((habit) => ({
        id: habit.id,
        name: habit.name,
        frequency: habit.frequency,
        progressCount: habit._count.habitProgress,
      })),
    };
  }

  /**
   * Get system-wide progress statistics
   */
  static async getSystemProgressStats(startDate?: string, endDate?: string) {
    const where: any = {};

    if (startDate || endDate) {
      where.completedAt = {};
      if (startDate) {
        where.completedAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.completedAt.lte = new Date(endDate);
      }
    }

    const [totalProgress, progressByDate, progressByHabit, recentProgress] =
      await Promise.all([
        prisma.habitProgress.count({ where }),
        prisma.habitProgress.groupBy({
          by: ["completedAt"],
          where,
          _count: { id: true },
        }),
        prisma.habitProgress.groupBy({
          by: ["habitId"],
          where,
          _count: { id: true },
        }),
        prisma.habitProgress.findMany({
          where,
          select: {
            id: true,
            completedAt: true,
            habit: {
              select: {
                id: true,
                name: true,
                frequency: true,
              },
            },
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          take: 20,
          orderBy: { completedAt: "desc" },
        }),
      ]);

    // Calculate daily progress trends
    const dailyProgress = progressByDate.reduce((acc: Record<string, number>, curr: any) => {
      const date = curr.completedAt.toISOString().split("T")[0];
      if (date) {
        acc[date] = curr._count.id;
      }
      return acc;
    }, {} as Record<string, number>);

    // Calculate top performing habits
    const topHabits = await prisma.habit.findMany({
      where: {
        id: {
          in: progressByHabit.map((p) => p.habitId),
        },
      },
      select: {
        id: true,
        name: true,
        frequency: true,
        _count: {
          select: {
            habitProgress: true,
          },
        },
      },
      orderBy: {
        habitProgress: {
          _count: "desc",
        },
      },
      take: 10,
    });

    return {
      overview: {
        totalProgress,
        period: {
          startDate: startDate || null,
          endDate: endDate || null,
        },
      },
      trends: {
        dailyProgress,
      },
      topHabits: topHabits.map((habit) => ({
        id: habit.id,
        name: habit.name,
        frequency: habit.frequency,
        progressCount: habit._count.habitProgress,
      })),
      recentActivity: recentProgress,
    };
  }

  /**
   * Create audit log entry
   */
  static async createAuditLog(
    adminUserId: string,
    logData: z.infer<typeof auditLogSchema>
  ) {
    const auditLog = await prisma.auditLog.create({
      data: {
        adminUserId,
        action: logData.action,
        targetType: logData.targetType,
        targetId: logData.targetId || null,
        details: logData.details || null,
        metadata: logData.metadata || {},
      },
      select: {
        id: true,
        adminUserId: true,
        action: true,
        targetType: true,
        targetId: true,
        details: true,
        metadata: true,
        createdAt: true,
      },
    });

    return auditLog;
  }

  /**
   * Get audit logs with filtering and pagination
   */
  static async getAuditLogs(
    page: number = 1,
    limit: number = 20,
    action?: string,
    targetType?: string,
    adminUserId?: string,
    startDate?: string,
    endDate?: string
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (action) {
      where.action = { contains: action, mode: "insensitive" as any };
    }

    if (targetType) {
      where.targetType = targetType;
    }

    if (adminUserId) {
      where.adminUserId = adminUserId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        select: {
          id: true,
          action: true,
          targetType: true,
          targetId: true,
          details: true,
          metadata: true,
          createdAt: true,
          adminUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get admin activity summary
   */
  static async getAdminActivitySummary(adminUserId: string, days: number = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [totalActions, actionsByType, recentActions] = await Promise.all([
      prisma.auditLog.count({
        where: {
          adminUserId,
          createdAt: { gte: startDate },
        },
      }),
      prisma.auditLog.groupBy({
        by: ["action"],
        where: {
          adminUserId,
          createdAt: { gte: startDate },
        },
        _count: { id: true },
      }),
      prisma.auditLog.findMany({
        where: {
          adminUserId,
          createdAt: { gte: startDate },
        },
        select: {
          id: true,
          action: true,
          targetType: true,
          targetId: true,
          details: true,
          createdAt: true,
        },
        take: 20,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
      },
      totalActions,
      actionsByType: actionsByType.reduce((acc: Record<string, number>, curr: any) => {
        acc[curr.action] = curr._count.id;
        return acc;
      }, {} as Record<string, number>),
      recentActions,
    };
  }

  /**
   * Get all users with pagination and filtering
   */
  static async getAllUsers(
    page: number = 1,
    limit: number = 20,
    search?: string,
    role?: string,
    isBlocked?: string,
    sortBy: string = "createdAt",
    sortOrder: string = "desc"
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    // Search filter
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" as any } },
        { firstName: { contains: search, mode: "insensitive" as any } },
        { lastName: { contains: search, mode: "insensitive" as any } },
      ];
    }

    // Role filter
    if (role && ["USER", "ADMIN"].includes(role)) {
      where.role = role;
    }

    // Blocked status filter
    if (isBlocked !== undefined) {
      if (isBlocked === "true") {
        where.isBlocked = true;
      } else if (isBlocked === "false") {
        where.isBlocked = false;
      }
    }

    // Build sort object
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isBlocked: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              habits: true,
              habitProgress: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users: users.map(user => ({
        ...user,
        totalHabits: user._count.habits,
        totalProgress: user._count.habitProgress,
        _count: undefined, // Remove the _count object
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      filters: {
        search: search || null,
        role: role || null,
        isBlocked: isBlocked || null,
        sortBy,
        sortOrder,
      },
    };
  }

  /**
   * Block or unblock a user
   */
  static async blockUser(
    adminUserId: string,
    userId: string,
    isBlocked: boolean,
    reason?: string
  ) {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, isBlocked: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Prevent blocking admin users
    if (user.role === "ADMIN") {
      throw new Error("Cannot block admin user");
    }

    // Prevent blocking yourself
    if (adminUserId === userId) {
      throw new Error("Cannot block yourself");
    }

    // Update user blocked status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isBlocked },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isBlocked: true,
        updatedAt: true,
      },
    });

    // Create audit log
    await this.createAuditLog(adminUserId, {
      action: isBlocked ? "USER_BLOCKED" : "USER_UNBLOCKED",
      targetType: "USER",
      targetId: userId,
      details: reason || `User ${isBlocked ? "blocked" : "unblocked"} by admin`,
      metadata: {
        previousStatus: user.isBlocked,
        newStatus: isBlocked,
        reason: reason || null,
      },
    });

    return updatedUser;
  }

  /**
   * Reset a user's password
   */
  static async resetUserPassword(
    adminUserId: string,
    userId: string,
    newPassword: string
  ) {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Hash the new password
    const bcrypt = require("bcrypt");
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        updatedAt: true,
      },
    });

    // Create audit log
    await this.createAuditLog(adminUserId, {
      action: "USER_PASSWORD_RESET",
      targetType: "USER",
      targetId: userId,
      details: `Password reset for user ${user.email}`,
      metadata: {
        userEmail: user.email,
        resetBy: adminUserId,
      },
    });

    return updatedUser;
  }

  /**
   * Delete a user and all associated data
   */
  static async deleteUser(
    adminUserId: string,
    userId: string,
    reason: string
  ) {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Prevent deleting admin users
    if (user.role === "ADMIN") {
      throw new Error("Cannot delete admin user");
    }

    // Prevent deleting yourself
    if (adminUserId === userId) {
      throw new Error("Cannot delete yourself");
    }

    // Get user statistics before deletion for audit log
    const [habitCount, progressCount] = await Promise.all([
      prisma.habit.count({ where: { userId } }),
      prisma.habitProgress.count({ where: { userId } }),
    ]);

    // Delete user and all associated data (cascade)
    await prisma.user.delete({
      where: { id: userId },
    });

    // Create audit log
    await this.createAuditLog(adminUserId, {
      action: "USER_DELETED",
      targetType: "USER",
      targetId: userId,
      details: `User deleted: ${reason}`,
      metadata: {
        userEmail: user.email,
        deletedHabits: habitCount,
        deletedProgress: progressCount,
        reason,
        deletedBy: adminUserId,
      },
    });

    return {
      deletedUser: {
        id: userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      deletedData: {
        habits: habitCount,
        progress: progressCount,
      },
      reason,
      deletedAt: new Date().toISOString(),
    };
  }

  /**
   * Get detailed user information for admin view
   */
  static async getUserDetails(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isBlocked: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const [habits, progress, recentActivity, auditLogs] = await Promise.all([
      // Get user habits
      prisma.habit.findMany({
        where: { userId },
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
        orderBy: { createdAt: "desc" },
      }),

      // Get user progress
      prisma.habitProgress.findMany({
        where: { userId },
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
        orderBy: { completedAt: "desc" },
        take: 50,
      }),

      // Get recent activity (last 7 days)
      prisma.habitProgress.findMany({
        where: {
          userId,
          completedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          id: true,
          completedAt: true,
          habit: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { completedAt: "desc" },
      }),

      // Get audit logs related to this user
      prisma.auditLog.findMany({
        where: {
          targetType: "USER",
          targetId: userId,
        },
        select: {
          id: true,
          action: true,
          details: true,
          createdAt: true,
          adminUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    // Calculate user statistics
    const totalHabits = habits.length;
    const activeHabits = habits.filter((h: any) => h.isActive).length;
    const totalProgress = progress.length;
    const recentProgress = recentActivity.length;

    // Calculate completion rate for the last 7 days
    const expectedCompletions = activeHabits * 7; // Assuming daily habits
    const completionRate = expectedCompletions > 0 
      ? (recentProgress / expectedCompletions) * 100 
      : 0;

    return {
      user,
      statistics: {
        totalHabits,
        activeHabits,
        totalProgress,
        recentProgress,
        completionRate: Math.round(completionRate * 100) / 100,
      },
      habits: habits.map((habit: any) => ({
        ...habit,
        progressCount: habit._count.habitProgress,
        _count: undefined, // Remove the _count object
      })),
      recentActivity,
      auditLogs,
    };
  }
}
