import { Router, Request, Response } from "express";
import { z } from "zod";
import {
  UserService,
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
  resetPasswordSchema,
} from "../services/userService";
import {
  authenticate,
  requireUser,
  requireAdmin,
  requireOwnership,
} from "../middleware/auth";

const router = Router();

/**
 * GET /api/users
 * Get all users (admin only)
 */
router.get(
  "/",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;

      // Validate pagination parameters
      if (page < 1 || limit < 1 || limit > 100) {
        return res.status(400).json({
          error: "Invalid pagination parameters",
          message: "Page must be >= 1, limit must be between 1 and 100",
        });
      }

      const result = await UserService.getAllUsers(page, limit, search);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Get users error:", error);
      return res.status(500).json({
        error: "Failed to get users",
        message: "Internal server error",
      });
    }
  }
);

/**
 * GET /api/users/:id
 * Get user by ID (admin or own profile)
 */
router.get(
  "/:id",
  authenticate,
  requireUser,
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      if (!userId) {
        return res.status(400).json({
          error: "User ID required",
          message: "User ID parameter is missing",
        });
      }

      const includeStats = req.query.stats === "true";

      // Check if user can access this profile
      if (req.user!.role !== "ADMIN" && req.user!.userId !== userId) {
        return res.status(403).json({
          error: "Access denied",
          message: "You can only view your own profile",
        });
      }

      const user = await UserService.getUserById(userId, includeStats);

      return res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      if (error instanceof Error && error.message === "User not found") {
        return res.status(404).json({
          error: "User not found",
          message: "The requested user does not exist",
        });
      }

      console.error("Get user error:", error);
      return res.status(500).json({
        error: "Failed to get user",
        message: "Internal server error",
      });
    }
  }
);

/**
 * POST /api/users
 * Create new user (admin only)
 */
router.post(
  "/",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedData = createUserSchema.parse(req.body);

      const user = await UserService.createUser(validatedData);

      return res.status(201).json({
        success: true,
        message: "User created successfully",
        data: { user },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation error",
          message: "Invalid input data",
          details: error.errors,
        });
      }

      if (
        error instanceof Error &&
        error.message === "User with this email already exists"
      ) {
        return res.status(409).json({
          error: "User already exists",
          message: error.message,
        });
      }

      console.error("Create user error:", error);
      return res.status(500).json({
        error: "Failed to create user",
        message: "Internal server error",
      });
    }
  }
);

/**
 * PUT /api/users/:id
 * Update user (admin or own profile)
 */
router.put(
  "/:id",
  authenticate,
  requireUser,
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      if (!userId) {
        return res.status(400).json({
          error: "User ID required",
          message: "User ID parameter is missing",
        });
      }

      const updateData = updateUserSchema.parse(req.body);

      // Check if user can update this profile
      if (req.user!.role !== "ADMIN" && req.user!.userId !== userId) {
        return res.status(403).json({
          error: "Access denied",
          message: "You can only update your own profile",
        });
      }

      // Regular users cannot change their role or block status
      if (req.user!.role !== "ADMIN") {
        delete updateData.role;
        delete updateData.isBlocked;
      }

      const user = await UserService.updateUser(userId, updateData);

      return res.json({
        success: true,
        message: "User updated successfully",
        data: { user },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation error",
          message: "Invalid input data",
          details: error.errors,
        });
      }

      if (error instanceof Error && error.message === "User not found") {
        return res.status(404).json({
          error: "User not found",
          message: "The requested user does not exist",
        });
      }

      console.error("Update user error:", error);
      return res.status(500).json({
        error: "Failed to update user",
        message: "Internal server error",
      });
    }
  }
);

/**
 * PUT /api/users/:id/change-password
 * Change user password (own password only)
 */
router.put(
  "/:id/change-password",
  authenticate,
  requireUser,
  requireOwnership(),
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      if (!userId) {
        return res.status(400).json({
          error: "User ID required",
          message: "User ID parameter is missing",
        });
      }

      const { currentPassword, newPassword } = changePasswordSchema.parse(
        req.body
      );

      const result = await UserService.changePassword(
        userId,
        currentPassword,
        newPassword
      );

      return res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation error",
          message: "Invalid input data",
          details: error.errors,
        });
      }

      if (
        error instanceof Error &&
        error.message === "Current password is incorrect"
      ) {
        return res.status(401).json({
          error: "Password change failed",
          message: error.message,
        });
      }

      console.error("Change password error:", error);
      return res.status(500).json({
        error: "Failed to change password",
        message: "Internal server error",
      });
    }
  }
);

/**
 * PUT /api/users/:id/reset-password
 * Reset user password (admin only)
 */
router.put(
  "/:id/reset-password",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      if (!userId) {
        return res.status(400).json({
          error: "User ID required",
          message: "User ID parameter is missing",
        });
      }

      const { newPassword } = resetPasswordSchema.parse(req.body);

      const result = await UserService.resetPassword(
        userId,
        newPassword,
        req.user!.userId
      );

      return res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation error",
          message: "Invalid input data",
          details: error.errors,
        });
      }

      if (error instanceof Error && error.message === "User not found") {
        return res.status(404).json({
          error: "User not found",
          message: "The requested user does not exist",
        });
      }

      console.error("Reset password error:", error);
      return res.status(500).json({
        error: "Failed to reset password",
        message: "Internal server error",
      });
    }
  }
);

/**
 * PUT /api/users/:id/block
 * Block/unblock user (admin only)
 */
router.put(
  "/:id/block",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      if (!userId) {
        return res.status(400).json({
          error: "User ID required",
          message: "User ID parameter is missing",
        });
      }

      const { block } = req.body;

      if (typeof block !== "boolean") {
        return res.status(400).json({
          error: "Invalid request",
          message: "Block parameter must be a boolean",
        });
      }

      const user = await UserService.toggleUserBlock(
        userId,
        block,
        req.user!.userId
      );

      return res.json({
        success: true,
        message: `User ${block ? "blocked" : "unblocked"} successfully`,
        data: { user },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "User not found") {
          return res.status(404).json({
            error: "User not found",
            message: "The requested user does not exist",
          });
        }
        if (error.message === "Cannot block admin users") {
          return res.status(400).json({
            error: "Operation not allowed",
            message: error.message,
          });
        }
      }

      console.error("Toggle user block error:", error);
      return res.status(500).json({
        error: "Failed to update user block status",
        message: "Internal server error",
      });
    }
  }
);

/**
 * DELETE /api/users/:id
 * Delete user (admin only)
 */
router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      if (!userId) {
        return res.status(400).json({
          error: "User ID required",
          message: "User ID parameter is missing",
        });
      }

      const result = await UserService.deleteUser(userId, req.user!.userId);

      return res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "User not found") {
          return res.status(404).json({
            error: "User not found",
            message: "The requested user does not exist",
          });
        }
        if (error.message === "Cannot delete admin users") {
          return res.status(400).json({
            error: "Operation not allowed",
            message: error.message,
          });
        }
      }

      console.error("Delete user error:", error);
      return res.status(500).json({
        error: "Failed to delete user",
        message: "Internal server error",
      });
    }
  }
);

/**
 * GET /api/users/:id/stats
 * Get user statistics (admin or own profile)
 */
router.get(
  "/:id/stats",
  authenticate,
  requireUser,
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      if (!userId) {
        return res.status(400).json({
          error: "User ID required",
          message: "User ID parameter is missing",
        });
      }

      // Check if user can access this profile
      if (req.user!.role !== "ADMIN" && req.user!.userId !== userId) {
        return res.status(403).json({
          error: "Access denied",
          message: "You can only view your own statistics",
        });
      }

      const stats = await UserService.getUserStats(userId);

      return res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "User not found") {
        return res.status(404).json({
          error: "User not found",
          message: "The requested user does not exist",
        });
      }

      console.error("Get user stats error:", error);
      return res.status(500).json({
        error: "Failed to get user statistics",
        message: "Internal server error",
      });
    }
  }
);

export default router;
