import { apiRequest } from "@/lib/api";
import {
  LoginCredentials,
  RegisterCredentials,
  AuthTokens,
  User,
} from "@/types/auth";

// Lo que devuelve el backend en login/register (dentro de `data`)
interface AuthPayload {
  user: User;
  accessToken: string;
  refreshToken: string;
}

const toSession = ({ user, accessToken, refreshToken }: AuthPayload) => ({
  user,
  tokens: { accessToken, refreshToken },
});

class AuthService {
  async login(
    credentials: LoginCredentials
  ): Promise<{ user: User; tokens: AuthTokens }> {
    const payload = await apiRequest<AuthPayload>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    return toSession(payload);
  }

  async register(
    credentials: RegisterCredentials
  ): Promise<{ user: User; tokens: AuthTokens }> {
    const payload = await apiRequest<AuthPayload>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    return toSession(payload);
  }

  async logout(): Promise<void> {
    await apiRequest("/api/auth/logout", { method: "POST" });
  }

  async refreshToken(): Promise<{ tokens: AuthTokens }> {
    // El backend solo renueva el access token; el refresh token sigue en su cookie
    const { accessToken } = await apiRequest<{ accessToken: string }>(
      "/api/auth/refresh",
      { method: "POST" }
    );
    return { tokens: { accessToken, refreshToken: "" } };
  }

  async getCurrentUser(): Promise<User> {
    const { user } = await apiRequest<{ user: User }>("/api/auth/me");
    return user;
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
