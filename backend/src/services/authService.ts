import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/environment";
import { prisma } from "../lib/prisma";

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
}

export class AuthService {
  /**
   * Hash a password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  /**
   * Compare a password with its hash
   */
  static async comparePassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate access token
   */
  static generateAccessToken(payload: JWTPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
      issuer: "avanxa-api",
      audience: "avanxa-users",
    });
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(payload: RefreshTokenPayload): string {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
      issuer: "avanxa-api",
      audience: "avanxa-users",
    });
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, env.JWT_SECRET) as JWTPayload;
    } catch (error) {
      throw new Error("Invalid access token");
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
    } catch (error) {
      throw new Error("Invalid refresh token");
    }
  }

  /**
   * Set authentication cookies
   */
  static setAuthCookies(
    res: any,
    accessToken: string,
    refreshToken: string
  ): void {
    // Access token cookie (short-lived)
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: "/",
    });

    // Refresh token cookie (long-lived)
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    });
  }

  /**
   * Clear authentication cookies
   */
  static clearAuthCookies(res: any): void {
    res.clearCookie("accessToken", { path: "/" });
    res.clearCookie("refreshToken", { path: "/" });
  }

  /**
   * Authenticate user with email and password
   */
  static async authenticateUser(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    if (user.isBlocked) {
      throw new Error("Account is blocked");
    }

    const isPasswordValid = await this.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    return user;
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(refreshToken: string): Promise<string> {
    const payload = this.verifyRefreshToken(refreshToken);

    // Get user to check if still exists and not blocked
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || user.isBlocked) {
      throw new Error("User not found or blocked");
    }

    // Generate new access token
    const newPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    return this.generateAccessToken(newPayload);
  }

  /**
   * Invalidate refresh token (for logout)
   */
  static async invalidateRefreshToken(userId: string): Promise<void> {
    // In a real application, you might want to store refresh tokens in a database
    // and mark them as invalid. For now, we'll just rely on the JWT expiration.
    // This could be enhanced with a token blacklist or versioning system.

    // For now, we'll update the user's token version to invalidate all existing tokens
    await prisma.user.update({
      where: { id: userId },
      data: {
        updatedAt: new Date(),
      },
    });
  }
}
