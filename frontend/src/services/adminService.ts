import {
  AdminUserListResponse,
  AdminUserFilters,
  AdminDashboardStats,
  BlockUserRequest,
  ResetPasswordRequest,
  AuditLogResponse,
} from "@/types/admin";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

class AdminService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    return response.json();
  }

  // Get admin dashboard statistics
  async getAdminDashboardStats(
    startDate?: string,
    endDate?: string
  ): Promise<AdminDashboardStats> {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const queryString = params.toString();
    const endpoint = `/api/admin/statistics${
      queryString ? `?${queryString}` : ""
    }`;

    return this.request<AdminDashboardStats>(endpoint);
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
    const endpoint = `/api/admin/users${queryString ? `?${queryString}` : ""}`;

    return this.request<AdminUserListResponse>(endpoint);
  }

  // Block or unblock a user
  async blockUser(
    userId: string,
    data: BlockUserRequest
  ): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(
      `/api/admin/users/${userId}/block`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
  }

  // Reset a user's password
  async resetUserPassword(
    userId: string,
    data: ResetPasswordRequest
  ): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(
      `/api/admin/users/${userId}/reset-password`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
  }

  // Delete a user
  async deleteUser(
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(
      `/api/admin/users/${userId}`,
      {
        method: "DELETE",
      }
    );
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

    return this.request<AuditLogResponse>(`/api/admin/audit-logs?${params}`);
  }

  // Get system health
  async getSystemHealth(): Promise<{ status: string; uptime: number }> {
    return this.request<{ status: string; uptime: number }>(
      "/api/admin/health"
    );
  }
}

export const adminService = new AdminService();
