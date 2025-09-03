import { Router, Request, Response } from "express";
import { z } from "zod";
import {
  ProgressService,
  createProgressSchema,
  updateProgressSchema,
  bulkProgressSchema,
} from "../services/progressService";
import { authenticate, requireUser } from "../middleware/auth";

const router = Router();

/**
 * POST /api/progress/complete
 * Mark a habit as completed for a specific date
 */
router.post(
  "/complete",
  authenticate,
  requireUser,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;
      const validatedData = createProgressSchema.parse(req.body);

      const progress = await ProgressService.markHabitCompleted(
        userId,
        validatedData.habitId,
        validatedData
      );

      return res.status(201).json({
        success: true,
        message: "Habit marked as completed",
        data: { progress },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation error",
          message: "Invalid input data",
          details: error.errors,
        });
      }

      if (error instanceof Error) {
        if (error.message === "Habit not found or inactive") {
          return res.status(404).json({
            error: "Habit not found",
            message: error.message,
          });
        }
        if (error.message === "Habit already completed for this date") {
          return res.status(409).json({
            error: "Already completed",
            message: error.message,
          });
        }
      }

      console.error("Mark habit completed error:", error);
      return res.status(500).json({
        error: "Failed to mark habit as completed",
        message: "Internal server error",
      });
    }
  }
);

/**
 * POST /api/progress/complete-bulk
 * Mark multiple habits as completed for a specific date
 */
router.post(
  "/complete-bulk",
  authenticate,
  requireUser,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;
      const validatedData = bulkProgressSchema.parse(req.body);

      const result = await ProgressService.markMultipleHabitsCompleted(
        userId,
        validatedData
      );

      return res.status(201).json({
        success: true,
        message: "Bulk completion processed",
        data: result,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation error",
          message: "Invalid input data",
          details: error.errors,
        });
      }

      console.error("Bulk complete habits error:", error);
      return res.status(500).json({
        error: "Failed to process bulk completion",
        message: "Internal server error",
      });
    }
  }
);

/**
 * GET /api/progress/habit/:habitId
 * Get progress for a specific habit
 */
router.get(
  "/habit/:habitId",
  authenticate,
  requireUser,
  async (req: Request, res: Response) => {
    try {
      const habitId = req.params.habitId;
      if (!habitId) {
        return res.status(400).json({
          error: "Habit ID required",
          message: "Habit ID parameter is missing",
        });
      }

      const userId = req.user!.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      // Validate pagination parameters
      if (page < 1 || limit < 1 || limit > 100) {
        return res.status(400).json({
          error: "Invalid pagination parameters",
          message: "Page must be >= 1, limit must be between 1 and 100",
        });
      }

      const result = await ProgressService.getHabitProgress(
        habitId,
        userId,
        page,
        limit,
        startDate,
        endDate
      );

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Habit not found") {
        return res.status(404).json({
          error: "Habit not found",
          message: "The requested habit does not exist",
        });
      }

      console.error("Get habit progress error:", error);
      return res.status(500).json({
        error: "Failed to get habit progress",
        message: "Internal server error",
      });
    }
  }
);

/**
 * PUT /api/progress/:progressId
 * Update a progress entry
 */
router.put(
  "/:progressId",
  authenticate,
  requireUser,
  async (req: Request, res: Response) => {
    try {
      const progressId = req.params.progressId;
      if (!progressId) {
        return res.status(400).json({
          error: "Progress ID required",
          message: "Progress ID parameter is missing",
        });
      }

      const userId = req.user!.userId;
      const updateData = updateProgressSchema.parse(req.body);

      const progress = await ProgressService.updateProgress(
        progressId,
        userId,
        updateData
      );

      return res.json({
        success: true,
        message: "Progress updated successfully",
        data: { progress },
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
        error.message === "Progress entry not found"
      ) {
        return res.status(404).json({
          error: "Progress entry not found",
          message: "The requested progress entry does not exist",
        });
      }

      console.error("Update progress error:", error);
      return res.status(500).json({
        error: "Failed to update progress",
        message: "Internal server error",
      });
    }
  }
);

/**
 * DELETE /api/progress/:progressId
 * Delete a progress entry
 */
router.delete(
  "/:progressId",
  authenticate,
  requireUser,
  async (req: Request, res: Response) => {
    try {
      const progressId = req.params.progressId;
      if (!progressId) {
        return res.status(400).json({
          error: "Progress ID required",
          message: "Progress ID parameter is missing",
        });
      }

      const userId = req.user!.userId;
      const result = await ProgressService.deleteProgress(progressId, userId);

      return res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Progress entry not found"
      ) {
        return res.status(404).json({
          error: "Progress entry not found",
          message: "The requested progress entry does not exist",
        });
      }

      console.error("Delete progress error:", error);
      return res.status(500).json({
        error: "Failed to delete progress",
        message: "Internal server error",
      });
    }
  }
);

/**
 * GET /api/progress/summary
 * Get user's progress summary
 */
router.get(
  "/summary",
  authenticate,
  requireUser,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      const summary = await ProgressService.getUserProgressSummary(
        userId,
        startDate,
        endDate
      );

      return res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      console.error("Get progress summary error:", error);
      return res.status(500).json({
        error: "Failed to get progress summary",
        message: "Internal server error",
      });
    }
  }
);

/**
 * GET /api/progress/summary/weekly
 * Get weekly progress summary
 */
router.get(
  "/summary/weekly",
  authenticate,
  requireUser,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;
      const weekStart = req.query.weekStart as string;

      const summary = await ProgressService.getWeeklyProgressSummary(
        userId,
        weekStart
      );

      return res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      console.error("Get weekly progress summary error:", error);
      return res.status(500).json({
        error: "Failed to get weekly progress summary",
        message: "Internal server error",
      });
    }
  }
);

/**
 * GET /api/progress/summary/monthly
 * Get monthly progress summary
 */
router.get(
  "/summary/monthly",
  authenticate,
  requireUser,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;
      const month = req.query.month as string;

      const summary = await ProgressService.getMonthlyProgressSummary(
        userId,
        month
      );

      return res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      console.error("Get monthly progress summary error:", error);
      return res.status(500).json({
        error: "Failed to get monthly progress summary",
        message: "Internal server error",
      });
    }
  }
);

/**
 * GET /api/progress/streak/:habitId
 * Get streak information for a specific habit
 */
router.get(
  "/streak/:habitId",
  authenticate,
  requireUser,
  async (req: Request, res: Response) => {
    try {
      const habitId = req.params.habitId;
      if (!habitId) {
        return res.status(400).json({
          error: "Habit ID required",
          message: "Habit ID parameter is missing",
        });
      }

      const userId = req.user!.userId;
      const streak = await ProgressService.getHabitStreak(habitId, userId);

      return res.json({
        success: true,
        data: { streak },
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Habit not found") {
        return res.status(404).json({
          error: "Habit not found",
          message: "The requested habit does not exist",
        });
      }

      console.error("Get habit streak error:", error);
      return res.status(500).json({
        error: "Failed to get habit streak",
        message: "Internal server error",
      });
    }
  }
);

export default router;
