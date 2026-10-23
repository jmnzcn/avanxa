import { apiRequest } from "@/lib/api";
import {
  AdminActivity,
  AdminUser,
  AdminUserListResponse,
  AdminUserFilters,
  AdminDashboardStats,
  BlockUserRequest,
  ResetPasswordRequest,
  AuditLogResponse,
  AuditLogEntry,
} from "@/types/admin";

interface ApiPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// Respuesta de GET /api/admin/dashboard
interface ApiDashboard {
  overview: { totalUsers: number; activeUsers: number; blockedUsers: number };
  habits: {
    totalHabits: number;
    activeHabits: number;
    habitsByFrequency: Record<string, number>;
  };
  progress: { totalProgress: number };
  recentActivity: { registrations: AdminUser[]; progress: AdminActivity[] };
}

// Respuesta de GET /api/admin/system/health
interface ApiSystemHealth {
  status: "healthy" | "unhealthy";
  database: "connected" | "disconnected";
  uptime?: number;
  activeConnections?: number;
}

type ApiAdminUser = Omit<AdminUser, "totalCompletions"> & {
  totalProgress: number;
};

interface ApiAuditLog {
  id: string;
  adminUserId: string;
  action: string;
  targetType: AuditLogEntry["targetType"];
  targetId?: string;
  details?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  adminUser?: { email: string };
}

const fromPagination = (p: ApiPagination) => ({
  total: p.total,
  page: p.page,
  limit: p.limit,
  totalPages: p.pages,
});

class AdminService {
  // Get admin dashboard statistics
  async getAdminDashboardStats(
    startDate?: string,
    endDate?: string
  ): Promise<AdminDashboardStats> {
    // El backend exige ISO completo; la UI maneja fechas "YYYY-MM-DD" (día local)
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", new Date(`${startDate}T00:00:00`).toISOString());
    if (endDate) params.append("endDate", new Date(`${endDate}T23:59:59.999`).toISOString());
    const queryString = params.toString();

    const [dashboard, health] = await Promise.all([
      apiRequest<ApiDashboard>(`/api/admin/dashboard${queryString ? `?${queryString}` : ""}`),
      apiRequest<ApiSystemHealth>("/api/admin/system/health"),
    ]);

    const byFrequency = Object.entries(dashboard.habits.habitsByFrequency);
    const totalByFrequency = byFrequency.reduce((sum, [, n]) => sum + n, 0);

    return {
      ...dashboard.overview,
      totalHabits: dashboard.habits.totalHabits,
      activeHabits: dashboard.habits.activeHabits,
      totalProgress: dashboard.progress.totalProgress,
      recentRegistrations: dashboard.recentActivity.registrations,
      recentActivity: dashboard.recentActivity.progress,
      habitsByFrequency: byFrequency.map(([frequency, count]) => ({
        frequency: frequency.toUpperCase(),
        count,
        percentage: totalByFrequency ? Math.round((count / totalByFrequency) * 100) : 0,
      })),
      userGrowth: [],
      systemHealth: {
        status: health.status === "healthy" ? "HEALTHY" : "CRITICAL",
        database: health.database === "connected" ? "ONLINE" : "OFFLINE",
        uptime: health.uptime ?? 0,
        activeConnections: health.activeConnections ?? 0,
      },
    };
  }

  // Get all users with pagination and filtering
  async getUsers(
    filters: AdminUserFilters = {}
  ): Promise<AdminUserListResponse> {
    const params = new URLSearchParams();

    if (filters.search) params.append("search", filters.search);
    if (filters.role) params.append("role", filters.role);
    if (filters.isBlocked !== undefined)
      params.append("isBlocked", filters.isBlocked.toString());
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.sortBy) params.append("sortBy", filters.sortBy);
    if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);

    const queryString = params.toString();
    const { users, pagination } = await apiRequest<{
      users: ApiAdminUser[];
      pagination: ApiPagination;
    }>(`/api/admin/users${queryString ? `?${queryString}` : ""}`);

    return {
      users: users.map(({ totalProgress, ...user }) => ({
        ...user,
        totalCompletions: totalProgress,
      })),
      ...fromPagination(pagination),
    };
  }

  // Block or unblock a user
  async blockUser(userId: string, data: BlockUserRequest): Promise<void> {
    await apiRequest(`/api/admin/users/${userId}/block`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Reset a user's password
  async resetUserPassword(
    userId: string,
    data: ResetPasswordRequest
  ): Promise<void> {
    await apiRequest(`/api/admin/users/${userId}/reset-password`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Delete a user
  async deleteUser(userId: string): Promise<void> {
    await apiRequest(`/api/admin/users/${userId}`, { method: "DELETE" });
  }

  // Get audit logs
  async getAuditLogs(
    page: number = 1,
    limit: number = 20
  ): Promise<AuditLogResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const { logs, pagination } = await apiRequest<{
      logs: ApiAuditLog[];
      pagination: ApiPagination;
    }>(`/api/admin/audit-logs?${params}`);

    return {
      logs: logs.map(({ adminUserId, adminUser, ...log }) => ({
        ...log,
        adminId: adminUserId,
        adminEmail: adminUser?.email ?? "",
      })),
      ...fromPagination(pagination),
    };
  }

  // Get system health
  async getSystemHealth(): Promise<ApiSystemHealth> {
    return apiRequest<ApiSystemHealth>("/api/admin/system/health");
  }
}

export const adminService = new AdminService();
