import { Router, Request, Response } from "express";
import { z } from "zod";
import {
  AdminService,
  adminStatsSchema,
  auditLogSchema,
} from "../services/adminService";
import { authenticate, requireAdmin } from "../middleware/auth";

import { cache, invalidateCache } from "../middleware/cache";

const router = Router();

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Obtener todos los usuarios
 *     description: Obtiene una lista paginada de todos los usuarios con filtros y ordenamiento (Solo administradores)
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Número de elementos por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Término de búsqueda para filtrar usuarios
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [USER, ADMIN]
 *         description: Filtro por rol del usuario
 *       - in: query
 *         name: isBlocked
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filtro por estado de bloqueo
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, email, firstName, lastName, role]
 *           default: createdAt
 *         description: Campo para ordenar
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Orden de clasificación
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AdminUser'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       400:
 *         description: Parámetros de paginación o ordenamiento inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Acceso denegado - Se requieren permisos de administrador
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/users",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const role = req.query.role as string;
      const isBlocked = req.query.isBlocked as string;
      const sortBy = (req.query.sortBy as string) || "createdAt";
      const sortOrder = (req.query.sortOrder as string) || "desc";

      // Validate pagination parameters
      if (page < 1 || limit < 1 || limit > 100) {
        return res.status(400).json({
          error: "Invalid pagination parameters",
          message: "Page must be >= 1, limit must be between 1 and 100",
        });
      }

      // Validate sort parameters
      const allowedSortFields = [
        "createdAt",
        "updatedAt",
        "email",
        "firstName",
        "lastName",
        "role",
      ];
      const allowedSortOrders = ["asc", "desc"];

      if (!allowedSortFields.includes(sortBy)) {
        return res.status(400).json({
          error: "Invalid sort field",
          message: `Sort field must be one of: ${allowedSortFields.join(", ")}`,
        });
      }

      if (!allowedSortOrders.includes(sortOrder)) {
        return res.status(400).json({
          error: "Invalid sort order",
          message: "Sort order must be 'asc' or 'desc'",
        });
      }

      const users = await AdminService.getAllUsers(
        page,
        limit,
        search,
        role,
        isBlocked,
        sortBy,
        sortOrder
      );

      return res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      console.error("Get all users error:", error);
      return res.status(500).json({
        error: "Failed to get users",
        message: "Internal server error",
      });
    }
  }
);

/**
 * PUT /api/admin/users/:id/block
 * Block or unblock a user (Admin only)
 */
router.put(
  "/users/:id/block",
  authenticate,
  requireAdmin,
  invalidateCache(/admin:/),
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      if (!userId) {
        return res.status(400).json({
          error: "User ID required",
          message: "User ID parameter is missing",
        });
      }

      const { isBlocked, reason } = req.body;

      if (typeof isBlocked !== "boolean") {
        return res.status(400).json({
          error: "Invalid isBlocked parameter",
          message: "isBlocked must be a boolean value",
        });
      }

      if (isBlocked && !reason) {
        return res.status(400).json({
          error: "Block reason required",
          message: "Reason is required when blocking a user",
        });
      }

      const result = await AdminService.blockUser(
        req.user!.userId,
        userId,
        isBlocked,
        reason
      );

      return res.json({
        success: true,
        message: `User ${isBlocked ? "blocked" : "unblocked"} successfully`,
        data: result,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "User not found") {
        return res.status(404).json({
          error: "User not found",
          message: "The requested user does not exist",
        });
      }

      if (
        error instanceof Error &&
        error.message === "Cannot block admin user"
      ) {
        return res.status(403).json({
          error: "Cannot block admin user",
          message: "Admin users cannot be blocked",
        });
      }

      if (error instanceof Error && error.message === "Cannot block yourself") {
        return res.status(403).json({
          error: "Cannot block yourself",
          message: "You cannot block your own account",
        });
      }

      console.error("Block user error:", error);
      return res.status(500).json({
        error: "Failed to block user",
        message: "Internal server error",
      });
    }
  }
);

/**
 * PUT /api/admin/users/:id/reset-password
 * Reset a user's password (Admin only)
 */
router.put(
  "/users/:id/reset-password",
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

      const { newPassword } = req.body;

      if (
        !newPassword ||
        typeof newPassword !== "string" ||
        newPassword.length < 6
      ) {
        return res.status(400).json({
          error: "Invalid password",
          message: "Password must be at least 6 characters long",
        });
      }

      const result = await AdminService.resetUserPassword(
        req.user!.userId,
        userId,
        newPassword
      );

      return res.json({
        success: true,
        message: "User password reset successfully",
        data: result,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "User not found") {
        return res.status(404).json({
          error: "User not found",
          message: "The requested user does not exist",
        });
      }

      console.error("Reset user password error:", error);
      return res.status(500).json({
        error: "Failed to reset user password",
        message: "Internal server error",
      });
    }
  }
);

/**
 * DELETE /api/admin/users/:id
 * Delete a user and all associated data (Admin only)
 */
router.delete(
  "/users/:id",
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

      const { reason } = req.body;

      if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
        return res.status(400).json({
          error: "Deletion reason required",
          message: "Reason is required when deleting a user",
        });
      }

      const result = await AdminService.deleteUser(
        req.user!.userId,
        userId,
        reason.trim()
      );

      return res.json({
        success: true,
        message: "User deleted successfully",
        data: result,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "User not found") {
        return res.status(404).json({
          error: "User not found",
          message: "The requested user does not exist",
        });
      }

      if (
        error instanceof Error &&
        error.message === "Cannot delete admin user"
      ) {
        return res.status(403).json({
          error: "Cannot delete admin user",
          message: "Admin users cannot be deleted",
        });
      }

      if (
        error instanceof Error &&
        error.message === "Cannot delete yourself"
      ) {
        return res.status(403).json({
          error: "Cannot delete yourself",
          message: "You cannot delete your own account",
        });
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
 * GET /api/admin/users/:id
 * Get detailed user information for admin view (Admin only)
 */
router.get(
  "/users/:id",
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

      const userDetails = await AdminService.getUserDetails(userId);

      return res.json({
        success: true,
        data: userDetails,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "User not found") {
        return res.status(404).json({
          error: "User not found",
          message: "The requested user does not exist",
        });
      }

      console.error("Get user details error:", error);
      return res.status(500).json({
        error: "Failed to get user details",
        message: "Internal server error",
      });
    }
  }
);

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Obtener estadísticas del dashboard administrativo
 *     description: Obtiene estadísticas completas del sistema para el panel de administrador (Solo administradores)
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Fecha de inicio para filtrar estadísticas (ISO 8601)
 *         example: "2024-01-01T00:00:00Z"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Fecha de fin para filtrar estadísticas (ISO 8601)
 *         example: "2024-12-31T23:59:59Z"
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AdminDashboardStats'
 *       400:
 *         description: Parámetros de fecha inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Acceso denegado - Se requieren permisos de administrador
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/dashboard",
  authenticate,
  requireAdmin,
  cache({
    ttl: 30 * 1000, // 30 seconds for admin dashboard
    key: (req) => `admin:dashboard:${JSON.stringify(req.query)}`,
  }),
  async (req: Request, res: Response) => {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      // Validate date parameters if provided
      if (startDate || endDate) {
        try {
          adminStatsSchema.parse({ startDate, endDate });
        } catch (error) {
          return res.status(400).json({
            error: "Invalid date parameters",
            message: "Start and end dates must be valid ISO datetime strings",
          });
        }
      }

      const stats = await AdminService.getAdminDashboardStats(
        startDate,
        endDate
      );

      return res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Get admin dashboard stats error:", error);
      return res.status(500).json({
        error: "Failed to get admin dashboard statistics",
        message: "Internal server error",
      });
    }
  }
);

/**
 * GET /api/admin/users/:id/stats
 * Get detailed user statistics for admin view
 */
router.get(
  "/users/:id/stats",
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

      const stats = await AdminService.getAdminUserStats(userId);

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

      console.error("Get admin user stats error:", error);
      return res.status(500).json({
        error: "Failed to get user statistics",
        message: "Internal server error",
      });
    }
  }
);

/**
 * GET /api/admin/habits/stats
 * Get system-wide habit statistics
 */
router.get(
  "/habits/stats",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const stats = await AdminService.getSystemHabitStats();

      return res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Get system habit stats error:", error);
      return res.status(500).json({
        error: "Failed to get system habit statistics",
        message: "Internal server error",
      });
    }
  }
);

/**
 * GET /api/admin/progress/stats
 * Get system-wide progress statistics
 */
router.get(
  "/progress/stats",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      const stats = await AdminService.getSystemProgressStats(
        startDate,
        endDate
      );

      return res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Get system progress stats error:", error);
      return res.status(500).json({
        error: "Failed to get system progress statistics",
        message: "Internal server error",
      });
    }
  }
);

/**
 * GET /api/admin/audit-logs
 * Get audit logs with filtering and pagination
 */
router.get(
  "/audit-logs",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const action = req.query.action as string;
      const targetType = req.query.targetType as string;
      const adminUserId = req.query.adminUserId as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      // Validate pagination parameters
      if (page < 1 || limit < 1 || limit > 100) {
        return res.status(400).json({
          error: "Invalid pagination parameters",
          message: "Page must be >= 1, limit must be between 1 and 100",
        });
      }

      const logs = await AdminService.getAuditLogs(
        page,
        limit,
        action,
        targetType,
        adminUserId,
        startDate,
        endDate
      );

      return res.json({
        success: true,
        data: logs,
      });
    } catch (error) {
      console.error("Get audit logs error:", error);
      return res.status(500).json({
        error: "Failed to get audit logs",
        message: "Internal server error",
      });
    }
  }
);

/**
 * POST /api/admin/audit-logs
 * Create audit log entry
 */
router.post(
  "/audit-logs",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const adminUserId = req.user!.userId;
      const validatedData = auditLogSchema.parse(req.body);

      const auditLog = await AdminService.createAuditLog(
        adminUserId,
        validatedData
      );

      return res.status(201).json({
        success: true,
        message: "Audit log created successfully",
        data: { auditLog },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation error",
          message: "Invalid input data",
          details: error.errors,
        });
      }

      console.error("Create audit log error:", error);
      return res.status(500).json({
        error: "Failed to create audit log",
        message: "Internal server error",
      });
    }
  }
);

/**
 * GET /api/admin/audit-logs/activity/:adminUserId
 * Get admin activity summary
 */
router.get(
  "/audit-logs/activity/:adminUserId",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const adminUserId = req.params.adminUserId;
      if (!adminUserId) {
        return res.status(400).json({
          error: "Admin User ID required",
          message: "Admin User ID parameter is missing",
        });
      }

      const days = parseInt(req.query.days as string) || 30;

      // Validate days parameter
      if (days < 1 || days > 365) {
        return res.status(400).json({
          error: "Invalid days parameter",
          message: "Days must be between 1 and 365",
        });
      }

      const summary = await AdminService.getAdminActivitySummary(
        adminUserId,
        days
      );

      return res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      console.error("Get admin activity summary error:", error);
      return res.status(500).json({
        error: "Failed to get admin activity summary",
        message: "Internal server error",
      });
    }
  }
);

/**
 * GET /api/admin/system/health
 * Get system health information
 */
router.get(
  "/system/health",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      // This endpoint provides real-time system health check
      const health = await AdminService.getSystemHealth();

      const statusCode = health.status === "healthy" ? 200 : 503;

      return res.status(statusCode).json({
        success: health.status === "healthy",
        data: health,
      });
    } catch (error) {
      console.error("Get system health error:", error);
      return res.status(503).json({
        success: false,
        error: "Failed to get system health",
        message: "Internal server error",
      });
    }
  }
);

/**
 * GET /api/admin/system/overview
 * Get system overview information
 */
router.get(
  "/system/overview",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const [userStats, habitStats, progressStats] = await Promise.all([
        AdminService.getAdminDashboardStats(),
        AdminService.getSystemHabitStats(),
        AdminService.getSystemProgressStats(),
      ]);

      const overview = {
        users: userStats.overview,
        habits: habitStats.overview,
        progress: progressStats.overview,
        timestamp: new Date().toISOString(),
      };

      return res.json({
        success: true,
        data: overview,
      });
    } catch (error) {
      console.error("Get system overview error:", error);
      return res.status(500).json({
        error: "Failed to get system overview",
        message: "Internal server error",
      });
    }
  }
);

export default router;
