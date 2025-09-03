import { prisma } from "../lib/prisma";
import { AuthService } from "./authService";
import { AdminService } from "./adminService";
import { z } from "zod";

// Validation schemas
export const createUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name too long"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name too long"),
  role: z.enum(["USER", "ADMIN"]).default("USER"),
});

export const updateUserSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name too long")
    .optional(),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name too long")
    .optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
  isBlocked: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export class UserService {
  /**
   * Get all users (admin only)
   */
  static async getAllUsers(
    page: number = 1,
    limit: number = 10,
    search?: string
  ) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" as any } },
            { firstName: { contains: search, mode: "insensitive" as any } },
            { lastName: { contains: search, mode: "insensitive" as any } },
          ],
        }
      : {};

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
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string, includeStats: boolean = false) {
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
        ...(includeStats && {
          _count: {
            select: {
              habits: true,
              habitProgress: true,
            },
          },
        }),
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
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

    return user;
  }

  /**
   * Create new user (admin only)
   */
  static async createUser(userData: z.infer<typeof createUserSchema>) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email.toLowerCase() },
    });

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Hash password
    const hashedPassword = await AuthService.hashPassword(userData.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: userData.email.toLowerCase(),
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
      },
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

    return user;
  }

  /**
   * Update user
   */
  static async updateUser(
    userId: string,
    updateData: z.infer<typeof updateUserSchema>
  ) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new Error("User not found");
    }

    // Filter out undefined values for Prisma
    const filteredData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: filteredData,
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

    return user;
  }

  /**
   * Change user password (user's own password)
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ) {
    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Verify current password
    const isCurrentPasswordValid = await AuthService.comparePassword(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    // Hash new password
    const hashedNewPassword = await AuthService.hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return { success: true, message: "Password changed successfully" };
  }

  /**
   * Reset user password (admin only)
   */
  static async resetPassword(
    userId: string,
    newPassword: string,
    adminUserId?: string
  ) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new Error("User not found");
    }

    // Hash new password
    const hashedNewPassword = await AuthService.hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    // Log admin action if adminUserId is provided
    if (adminUserId) {
      try {
        await AdminService.createAuditLog(adminUserId, {
          action: "USER_PASSWORD_RESET",
          targetType: "USER",
          targetId: userId,
          details: `Password reset for user: ${existingUser.email}`,
          metadata: {
            userEmail: existingUser.email,
            userRole: existingUser.role,
          },
        });
      } catch (error) {
        // Don't fail the main operation if audit logging fails
        console.error("Failed to create audit log:", error);
      }
    }

    return { success: true, message: "Password reset successfully" };
  }

  /**
   * Block/unblock user (admin only)
   */
  static async toggleUserBlock(
    userId: string,
    block: boolean,
    adminUserId?: string
  ) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new Error("User not found");
    }

    // Prevent admin from blocking themselves
    if (existingUser.role === "ADMIN" && block) {
      throw new Error("Cannot block admin users");
    }

    // Update user block status
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isBlocked: block },
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

    // Log admin action if adminUserId is provided
    if (adminUserId) {
      try {
        await AdminService.createAuditLog(adminUserId, {
          action: block ? "USER_BLOCKED" : "USER_UNBLOCKED",
          targetType: "USER",
          targetId: userId,
          details: `User ${block ? "blocked" : "unblocked"}: ${
            existingUser.email
          }`,
          metadata: {
            previousStatus: existingUser.isBlocked,
            newStatus: block,
            userEmail: existingUser.email,
            userRole: existingUser.role,
          },
        });
      } catch (error) {
        // Don't fail the main operation if audit logging fails
        console.error("Failed to create audit log:", error);
      }
    }

    return user;
  }

  /**
   * Delete user (admin only)
   */
  static async deleteUser(userId: string, adminUserId?: string) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new Error("User not found");
    }

    // Prevent admin from deleting themselves
    if (existingUser.role === "ADMIN") {
      throw new Error("Cannot delete admin users");
    }

    // Delete user (this will cascade delete habits and progress due to Prisma schema)
    await prisma.user.delete({
      where: { id: userId },
    });

    // Log admin action if adminUserId is provided
    if (adminUserId) {
      try {
        await AdminService.createAuditLog(adminUserId, {
          action: "USER_DELETED",
          targetType: "USER",
          targetId: userId,
          details: `User deleted: ${existingUser.email}`,
          metadata: {
            userEmail: existingUser.email,
            userRole: existingUser.role,
            userCreatedAt: existingUser.createdAt,
          },
        });
      } catch (error) {
        // Don't fail the main operation if audit logging fails
        console.error("Failed to create audit log:", error);
      }
    }

    return { success: true, message: "User deleted successfully" };
  }

  /**
   * Get user statistics
   */
  static async getUserStats(userId: string) {
    const [user, habitsCount, progressCount, recentProgress] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isBlocked: true,
            createdAt: true,
          },
        }),
        prisma.habit.count({
          where: { userId, isActive: true },
        }),
        prisma.habitProgress.count({
          where: { userId },
        }),
        prisma.habitProgress.findMany({
          where: { userId },
          take: 5,
          orderBy: { completedAt: "desc" },
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
        }),
      ]);

    if (!user) {
      throw new Error("User not found");
    }

    return {
      user,
      stats: {
        activeHabits: habitsCount,
        totalProgressEntries: progressCount,
        recentProgress,
      },
    };
  }
}
