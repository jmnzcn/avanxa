import { afterEach, describe, expect, it, vi } from "vitest";
import { authService } from "@/services/authService";
import { adminService } from "@/services/adminService";
import { mockApi, ok } from "./testUtils";

afterEach(() => vi.unstubAllGlobals());

const user = { id: "u1", email: "a@b.com", firstName: "Ana", lastName: "Mora", role: "USER" };

describe("authService", () => {
  it("convierte la respuesta de login en { user, tokens }", async () => {
    mockApi({ "POST /api/auth/login": ok({ user, accessToken: "at", refreshToken: "rt" }) });

    const session = await authService.login({ email: "a@b.com", password: "x" });
    expect(session).toEqual({ user, tokens: { accessToken: "at", refreshToken: "rt" } });
  });

  it("devuelve el usuario de /me sin envoltorio", async () => {
    mockApi({ "/api/auth/me": ok({ user }) });
    await expect(authService.getCurrentUser()).resolves.toEqual(user);
  });
});

describe("adminService", () => {
  const dashboard = {
    overview: { totalUsers: 3, activeUsers: 2, blockedUsers: 1 },
    habits: { totalHabits: 10, activeHabits: 8, habitsByFrequency: { daily: 6, weekly: 2 } },
    progress: { totalProgress: 120 },
    recentActivity: { registrations: [], progress: [] },
  };
  const health = { status: "healthy", database: "connected", uptime: 90, activeConnections: 4 };

  it("convierte las fechas YYYY-MM-DD a ISO completo antes de enviarlas", async () => {
    const fetchMock = mockApi({ "/api/admin/dashboard": ok(dashboard), "/api/admin/system/health": ok(health) });
    await adminService.getAdminDashboardStats("2026-10-01", "2026-10-31");

    const url = new URL(String(fetchMock.mock.calls[0]![0]));
    expect(url.searchParams.get("startDate")).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(new Date(url.searchParams.get("startDate")!).getDate()).toBe(1); // 1 de octubre, hora local
  });

  it("combina el panel y la salud del sistema en las métricas que usa la UI", async () => {
    mockApi({ "/api/admin/dashboard": ok(dashboard), "/api/admin/system/health": ok(health) });
    const stats = await adminService.getAdminDashboardStats();

    expect(stats).toMatchObject({ totalUsers: 3, blockedUsers: 1, totalHabits: 10, totalProgress: 120 });
    expect(stats.habitsByFrequency).toEqual([
      { frequency: "DAILY", count: 6, percentage: 75 },
      { frequency: "WEEKLY", count: 2, percentage: 25 },
    ]);
    expect(stats.systemHealth).toEqual({ status: "HEALTHY", database: "ONLINE", uptime: 90, activeConnections: 4 });
  });

  it("expone el total de completados de cada usuario", async () => {
    mockApi({
      "/api/admin/users": ok({
        users: [{ ...user, isBlocked: false, createdAt: "", updatedAt: "", totalHabits: 2, totalProgress: 7 }],
        pagination: { page: 1, limit: 10, total: 1, pages: 1 },
      }),
    });

    const res = await adminService.getUsers();
    expect(res.users[0]).toMatchObject({ totalHabits: 2, totalCompletions: 7 });
    expect(res.totalPages).toBe(1);
  });
});
