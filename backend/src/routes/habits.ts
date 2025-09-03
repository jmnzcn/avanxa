import { Router, Request, Response } from "express";
import { z } from "zod";
import {
  HabitService,
  createHabitSchema,
  updateHabitSchema,
  toggleHabitSchema,
} from "../services/habitService";
import {
  authenticate,
  requireUser,
  requireOwnership,
} from "../middleware/auth";

import { cache, invalidateCache, cacheUtils } from "../middleware/cache";

const router = Router();

/**
 * @swagger
 * /api/habits:
 *   get:
 *     summary: Obtener hábitos del usuario
 *     description: Obtiene todos los hábitos del usuario autenticado con paginación y filtros
 *     tags: [Habits]
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
 *           default: 10
 *         description: Número de elementos por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Término de búsqueda para filtrar hábitos
 *       - in: query
 *         name: frequency
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *         description: Filtro por frecuencia del hábito
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filtro por estado activo del hábito
 *     responses:
 *       200:
 *         description: Lista de hábitos obtenida exitosamente
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
 *                     habits:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Habit'
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
 *         description: Parámetros de paginación inválidos
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
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/",
  authenticate,
  requireUser,
  cache({
    ttl: 2 * 60 * 1000, // 2 minutes
    key: (req) => `habits:${req.user!.userId}:${JSON.stringify(req.query)}`,
    condition: (req) => req.method === "GET" && !req.query.refresh,
  }),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const frequency = req.query.frequency as string;
      const isActive =
        req.query.isActive === "true"
          ? true
          : req.query.isActive === "false"
          ? false
          : undefined;

      // Validate pagination parameters
      if (page < 1 || limit < 1 || limit > 100) {
        return res.status(400).json({
          error: "Invalid pagination parameters",
          message: "Page must be >= 1, limit must be between 1 and 100",
        });
      }

      // Validate frequency parameter
      if (frequency && !["daily", "weekly", "monthly"].includes(frequency)) {
        return res.status(400).json({
          error: "Invalid frequency parameter",
          message: "Frequency must be daily, weekly, or monthly",
        });
      }

      const result = await HabitService.getUserHabits(
        userId,
        page,
        limit,
        search,
        frequency,
        isActive
      );

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Get habits error:", error);
      return res.status(500).json({
        error: "Failed to get habits",
        message: "Internal server error",
      });
    }
  }
);

/**
 * GET /api/habits/summary
 * Get habit summary for the authenticated user
 */
router.get(
  "/summary",
  authenticate,
  requireUser,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;
      const summary = await HabitService.getUserHabitSummary(userId);

      return res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      console.error("Get habit summary error:", error);
      return res.status(500).json({
        error: "Failed to get habit summary",
        message: "Internal server error",
      });
    }
  }
);

/**
 * GET /api/habits/frequency/:frequency
 * Get habits by frequency for the authenticated user
 */
router.get(
  "/frequency/:frequency",
  authenticate,
  requireUser,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;
      const frequency = req.params.frequency;

      if (!frequency) {
        return res.status(400).json({
          error: "Frequency parameter required",
          message: "Frequency parameter is missing",
        });
      }

      // Validate frequency parameter
      if (!["daily", "weekly", "monthly"].includes(frequency)) {
        return res.status(400).json({
          error: "Invalid frequency parameter",
          message: "Frequency must be daily, weekly, or monthly",
        });
      }

      const habits = await HabitService.getHabitsByFrequency(userId, frequency);

      return res.json({
        success: true,
        data: { habits, frequency },
      });
    } catch (error) {
      console.error("Get habits by frequency error:", error);
      return res.status(500).json({
        error: "Failed to get habits by frequency",
        message: "Internal server error",
      });
    }
  }
);

/**
 * GET /api/habits/:id
 * Get habit by ID (must belong to authenticated user)
 */
router.get(
  "/:id",
  authenticate,
  requireUser,
  async (req: Request, res: Response) => {
    try {
      const habitId = req.params.id;
      if (!habitId) {
        return res.status(400).json({
          error: "Habit ID required",
          message: "Habit ID parameter is missing",
        });
      }

      const userId = req.user!.userId;
      const habit = await HabitService.getHabitById(habitId, userId);

      return res.json({
        success: true,
        data: { habit },
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Habit not found") {
        return res.status(404).json({
          error: "Habit not found",
          message: "The requested habit does not exist",
        });
      }

      console.error("Get habit error:", error);
      return res.status(500).json({
        error: "Failed to get habit",
        message: "Internal server error",
      });
    }
  }
);

/**
 * @swagger
 * /api/habits:
 *   post:
 *     summary: Crear nuevo hábito
 *     description: Crea un nuevo hábito para el usuario autenticado
 *     tags: [Habits]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - frequency
 *               - targetCount
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 description: Nombre del hábito
 *                 example: "Leer 30 minutos"
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Descripción opcional del hábito
 *                 example: "Leer libros de desarrollo personal"
 *               frequency:
 *                 type: string
 *                 enum: [DAILY, WEEKLY, MONTHLY]
 *                 description: Frecuencia del hábito
 *                 example: "DAILY"
 *               targetCount:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *                 description: Número objetivo de completaciones
 *                 example: 1
 *     responses:
 *       201:
 *         description: Hábito creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Habit created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     habit:
 *                       $ref: '#/components/schemas/Habit'
 *       400:
 *         description: Datos de entrada inválidos
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
 *       409:
 *         description: Ya existe un hábito activo con este nombre
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
router.post(
  "/",
  authenticate,
  requireUser,
  invalidateCache(/habits:/),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;
      const validatedData = createHabitSchema.parse(req.body);

      const habit = await HabitService.createHabit(userId, validatedData);

      return res.status(201).json({
        success: true,
        message: "Habit created successfully",
        data: { habit },
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
        error.message === "You already have an active habit with this name"
      ) {
        return res.status(409).json({
          error: "Habit already exists",
          message: error.message,
        });
      }

      console.error("Create habit error:", error);
      return res.status(500).json({
        error: "Failed to create habit",
        message: "Internal server error",
      });
    }
  }
);

/**
 * PUT /api/habits/:id
 * Update habit (must belong to authenticated user)
 */
router.put(
  "/:id",
  authenticate,
  requireUser,
  invalidateCache(/habits:/),
  async (req: Request, res: Response) => {
    try {
      const habitId = req.params.id;
      if (!habitId) {
        return res.status(400).json({
          error: "Habit ID required",
          message: "Habit ID parameter is missing",
        });
      }

      const userId = req.user!.userId;
      const updateData = updateHabitSchema.parse(req.body);

      const habit = await HabitService.updateHabit(habitId, userId, updateData);

      return res.json({
        success: true,
        message: "Habit updated successfully",
        data: { habit },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation error",
          message: "Invalid input data",
          details: error.errors,
        });
      }

      if (error instanceof Error && error.message === "Habit not found") {
        return res.status(404).json({
          error: "Habit not found",
          message: "The requested habit does not exist",
        });
      }

      if (
        error instanceof Error &&
        error.message === "You already have an active habit with this name"
      ) {
        return res.status(409).json({
          error: "Habit already exists",
          message: error.message,
        });
      }

      console.error("Update habit error:", error);
      return res.status(500).json({
        error: "Failed to update habit",
        message: "Internal server error",
      });
    }
  }
);

/**
 * PUT /api/habits/:id/toggle
 * Toggle habit active status (must belong to authenticated user)
 */
router.put(
  "/:id/toggle",
  authenticate,
  requireUser,
  invalidateCache(/habits:/),
  async (req: Request, res: Response) => {
    try {
      const habitId = req.params.id;
      if (!habitId) {
        return res.status(400).json({
          error: "Habit ID required",
          message: "Habit ID parameter is missing",
        });
      }

      const userId = req.user!.userId;
      const { isActive } = toggleHabitSchema.parse(req.body);

      const habit = await HabitService.toggleHabitStatus(
        habitId,
        userId,
        isActive
      );

      return res.json({
        success: true,
        message: `Habit ${isActive ? "activated" : "deactivated"} successfully`,
        data: { habit },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation error",
          message: "Invalid input data",
          details: error.errors,
        });
      }

      if (error instanceof Error && error.message === "Habit not found") {
        return res.status(404).json({
          error: "Habit not found",
          message: "The requested habit does not exist",
        });
      }

      console.error("Toggle habit status error:", error);
      return res.status(500).json({
        error: "Failed to toggle habit status",
        message: "Internal server error",
      });
    }
  }
);

/**
 * DELETE /api/habits/:id
 * Soft delete habit (set isActive to false, must belong to authenticated user)
 */
router.delete(
  "/:id",
  authenticate,
  requireUser,
  invalidateCache(/habits:/),
  async (req: Request, res: Response) => {
    try {
      const habitId = req.params.id;
      if (!habitId) {
        return res.status(400).json({
          error: "Habit ID required",
          message: "Habit ID parameter is missing",
        });
      }

      const userId = req.user!.userId;
      const habit = await HabitService.softDeleteHabit(habitId, userId);

      return res.json({
        success: true,
        message: "Habit deleted successfully",
        data: { habit },
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Habit not found") {
        return res.status(404).json({
          error: "Habit not found",
          message: "The requested habit does not exist",
        });
      }

      console.error("Delete habit error:", error);
      return res.status(500).json({
        error: "Failed to delete habit",
        message: "Internal server error",
      });
    }
  }
);

/**
 * GET /api/habits/:id/stats
 * Get habit statistics (must belong to authenticated user)
 */
router.get(
  "/:id/stats",
  authenticate,
  requireUser,
  async (req: Request, res: Response) => {
    try {
      const habitId = req.params.id;
      if (!habitId) {
        return res.status(400).json({
          error: "Habit ID required",
          message: "Habit ID parameter is missing",
        });
      }

      const userId = req.user!.userId;
      const stats = await HabitService.getHabitStats(habitId, userId);

      return res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Habit not found") {
        return res.status(404).json({
          error: "Habit not found",
          message: "The requested habit does not exist",
        });
      }

      console.error("Get habit stats error:", error);
      return res.status(500).json({
        error: "Failed to get habit statistics",
        message: "Internal server error",
      });
    }
  }
);

export default router;
