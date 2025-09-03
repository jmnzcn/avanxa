import { Router, Request, Response } from "express";
import { uploadSingle, uploadImage } from "../middleware/upload";
import { authenticate, requireUser } from "../middleware/auth";

const router = Router();

/**
 * POST /api/upload/file
 * Upload a single file
 */
router.post(
  "/file",
  authenticate,
  requireUser,
  uploadSingle,
  (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "No file uploaded",
          message: "Please select a file to upload",
        });
      }

      return res.json({
        success: true,
        message: "File uploaded successfully",
        data: {
          filename: req.file.filename,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          path: req.file.path,
        },
      });
    } catch (error) {
      console.error("File upload error:", error);
      return res.status(500).json({
        error: "File upload failed",
        message: "Internal server error during file upload",
      });
    }
  }
);

/**
 * POST /api/upload/image
 * Upload an image file
 */
router.post(
  "/image",
  authenticate,
  requireUser,
  uploadImage,
  (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "No image uploaded",
          message: "Please select an image file to upload",
        });
      }

      return res.json({
        success: true,
        message: "Image uploaded successfully",
        data: {
          filename: req.file.filename,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          path: req.file.path,
        },
      });
    } catch (error) {
      console.error("Image upload error:", error);
      return res.status(500).json({
        error: "Image upload failed",
        message: "Internal server error during image upload",
      });
    }
  }
);

export default router;
