import { Request, Response, NextFunction } from "express";
import { env } from "../config/environment";

// Request logging interface
interface RequestLog {
  timestamp: string;
  method: string;
  url: string;
  ip: string;
  userAgent: string;
  userId?: string;
  responseTime: number;
  statusCode: number;
  contentLength: number;
}

// Performance monitoring middleware
export const performanceMonitor = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();

  // Override res.end to capture response data
  const originalEnd = res.end;
  (res as any).end = function (chunk?: any, encoding?: any) {
    const responseTime = Date.now() - start;
    const contentLength = chunk ? chunk.length : 0;

    // Log request details
    const logData: RequestLog = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.connection.remoteAddress || "unknown",
      userAgent: req.get("User-Agent") || "unknown",
      userId: (req as any).user?.id,
      responseTime,
      statusCode: res.statusCode,
      contentLength,
    };

    // Log based on environment
    if (env.NODE_ENV === "development") {
      console.log("📊 Request Log:", JSON.stringify(logData, null, 2));
    } else {
      // In production, log only important metrics
      if (responseTime > 1000) {
        console.warn("⚠️ Slow Request:", {
          url: logData.url,
          responseTime: `${responseTime}ms`,
          method: logData.method,
        });
      }
    }

    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Request ID middleware for tracking requests
export const requestId = (req: Request, res: Response, next: NextFunction) => {
  const requestId = `req_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  req.headers["x-request-id"] = requestId;
  res.setHeader("x-request-id", requestId);
  next();
};

// Error logging middleware
export const errorLogger = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    requestId: req.headers["x-request-id"],
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userId: (req as any).user?.id,
    error: {
      name: err.name,
      message: err.message,
      stack: env.NODE_ENV === "development" ? err.stack : undefined,
    },
    requestBody: env.NODE_ENV === "development" ? req.body : undefined,
    requestHeaders: env.NODE_ENV === "development" ? req.headers : undefined,
  };

  console.error("❌ Error Log:", JSON.stringify(errorLog, null, 2));
  next(err);
};

// Security logging middleware
export const securityLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log potentially suspicious requests
  const suspiciousPatterns = [
    /\.\.\//, // Directory traversal
    /<script/i, // XSS attempts
    /union\s+select/i, // SQL injection attempts
    /eval\s*\(/i, // Code injection attempts
  ];

  const url = req.originalUrl.toLowerCase();
  const body = req.body ? JSON.stringify(req.body).toLowerCase() : "";
  const headers = JSON.stringify(req.headers).toLowerCase();

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url) || pattern.test(body) || pattern.test(headers)) {
      console.warn("🚨 Suspicious Request Detected:", {
        timestamp: new Date().toISOString(),
        ip: req.ip || req.connection.remoteAddress,
        url: req.originalUrl,
        method: req.method,
        userAgent: req.get("User-Agent"),
        pattern: pattern.source,
      });
      break;
    }
  }

  next();
};

// API usage statistics middleware
export const apiStats = (req: Request, res: Response, next: NextFunction) => {
  // Track API endpoint usage
  const endpoint = `${req.method} ${req.route?.path || req.path}`;

  // In a real application, you'd store this in Redis or a database
  // For now, we'll just log it
  if (env.NODE_ENV === "development") {
    console.log(`📈 API Call: ${endpoint}`);
  }

  next();
};
