import { env } from "@/config/env";
import {
  LoginCredentials,
  RegisterCredentials,
  AuthTokens,
  User,
} from "@/types/auth";

const API_BASE = env.VITE_API_URL;

class AuthService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: "include", // Include cookies for JWT
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    return response.json();
  }

  async login(
    credentials: LoginCredentials
  ): Promise<{ user: User; tokens: AuthTokens }> {
    return this.makeRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  async register(
    credentials: RegisterCredentials
  ): Promise<{ user: User; tokens: AuthTokens }> {
    return this.makeRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  async logout(): Promise<void> {
    return this.makeRequest("/api/auth/logout", {
      method: "POST",
    });
  }

  async refreshToken(): Promise<{ tokens: AuthTokens }> {
    return this.makeRequest("/api/auth/refresh", {
      method: "POST",
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.makeRequest("/api/auth/me", {
      method: "GET",
    });
  }

  async validateToken(): Promise<boolean> {
    try {
      await this.getCurrentUser();
      return true;
    } catch {
      return false;
    }
  }
}

export const authService = new AuthService();
