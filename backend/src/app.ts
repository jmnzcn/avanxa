import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import fs from "fs";
import path from "path";
import { env } from "./config/environment";

import {
  performanceMonitor,
  requestId,
  errorLogger,
  securityLogger,
  apiStats,
} from "./middleware/logging";
import { handleUploadError } from "./middleware/upload";
import authRoutes from "./routes/auth";
import uploadRoutes from "./routes/upload";
import userRoutes from "./routes/users";
import habitRoutes from "./routes/habits";
import progressRoutes from "./routes/progress";
import adminRoutes from "./routes/admin";
import { specs, swaggerUiOptions } from "./config/swagger";
import swaggerUi from "swagger-ui-express";

const app = express();
const PORT = env.PORT;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);

// Enhanced middleware
app.use(requestId);
app.use(performanceMonitor);
app.use(securityLogger);
app.use(apiStats);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Cookie parser
app.use(cookieParser());

// Logging middleware
if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Basic health check route
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    version: "1.0.0",
  });
});

// API routes

// Authentication routes
app.use("/api/auth", authRoutes);

// File upload routes
app.use("/api/upload", uploadRoutes);

// User management routes
app.use("/api/users", userRoutes);

// Habit management routes
app.use("/api/habits", habitRoutes);

// Progress tracking routes
app.use("/api/progress", progressRoutes);

// Admin routes
app.use("/api/admin", adminRoutes);

// Swagger API Documentation
app.use("/api-docs", swaggerUi.serve);
app.get("/api-docs", swaggerUi.setup(specs, swaggerUiOptions));

// API status endpoint
app.get("/api", (req, res) => {
  res.json({
    message: "Avanxa API is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    documentation: "/api-docs",
  });
});

// Frontend compilado (producción): API y app web en un solo servicio y un solo
// dominio, así las cookies de sesión (sameSite=strict) funcionan sin CORS.
const frontendDist = path.resolve(__dirname, "../../frontend/dist");
if (fs.existsSync(path.join(frontendDist, "index.html"))) {
  app.use(express.static(frontendDist, { index: false, maxAge: "1h" }));
  // Rutas de React Router (/dashboard, /habits/…): devolver la SPA
  app.get(/^\/(?!api(\/|$)|api-docs|health).*/, (req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
});

// File upload error handling
app.use(handleUploadError);

// Error logging middleware
app.use(errorLogger);

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Error:", err);

    res.status(err.status || 500).json({
      error: err.message || "Internal server error",
      ...(env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }
);

// Start server (solo al ejecutar este archivo; los tests importan `app` sin abrir un puerto)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Avanxa Backend running on port ${PORT}`);
    console.log(`🌍 Environment: ${env.NODE_ENV}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  });
}

export default app;
