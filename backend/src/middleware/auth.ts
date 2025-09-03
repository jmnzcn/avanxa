import { Request, Response, NextFunction } from "express";
import { AuthService, JWTPayload } from "../services/authService";

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({
        error: "Authentication required",
        message: "No access token provided",
      });
    }

    try {
      const decoded = AuthService.verifyAccessToken(token);
      req.user = decoded;
      next();
      return;
    } catch (error) {
      // Token is invalid or expired
      return res.status(401).json({
        error: "Invalid token",
        message: "Access token is invalid or expired",
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: "Authentication error",
      message: "Internal server error during authentication",
    });
  }
};

/**
 * Middleware to authorize users based on roles
 */
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
        message: "User not authenticated",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Insufficient permissions",
        message: `Role '${req.user.role}' is not authorized for this action`,
        requiredRoles: roles,
      });
    }

    next();
    return;
  };
};

/**
 * Middleware to require admin role
 */
export const requireAdmin = authorize(["ADMIN"]);

/**
 * Middleware to require user role (USER or ADMIN)
 */
export const requireUser = authorize(["USER", "ADMIN"]);

/**
 * Middleware to check if user owns the resource or is admin
 */
export const requireOwnership = (resourceUserIdField: string = "userId") => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
        message: "User not authenticated",
      });
    }

    // Admin can access any resource
    if (req.user.role === "ADMIN") {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId =
      req.params[resourceUserIdField] || req.body[resourceUserIdField];

    if (!resourceUserId) {
      return res.status(400).json({
        error: "Resource identifier missing",
        message: `Resource ${resourceUserIdField} is required`,
      });
    }

    if (req.user.userId !== resourceUserId) {
      return res.status(403).json({
        error: "Access denied",
        message: "You can only access your own resources",
      });
    }

    next();
    return;
  };
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.accessToken;

    if (token) {
      try {
        const decoded = AuthService.verifyAccessToken(token);
        req.user = decoded;
      } catch (error) {
        // Token is invalid, but we don't fail the request
        // Just don't set req.user
      }
    }

    next();
    return;
  } catch (error) {
    // Continue without authentication
    next();
    return;
  }
};

/**
 * Middleware to check if user is blocked
 */
export const checkUserStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required",
      message: "User not authenticated",
    });
  }

  try {
    // Check if user is still active and not blocked
    const user = await import("../lib/prisma").then((m) =>
      m.prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: { isBlocked: true },
      })
    );

    if (!user || user.isBlocked) {
      return res.status(403).json({
        error: "Account blocked",
        message: "Your account has been blocked",
      });
    }

    next();
    return;
  } catch (error) {
    return res.status(500).json({
      error: "Authentication error",
      message: "Error checking user status",
    });
  }
};
