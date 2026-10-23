export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "USER" | "ADMIN";
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  totalHabits: number;
  totalCompletions: number;
}

export interface AdminUserListResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminUserFilters {
  search?: string;
  role?: "USER" | "ADMIN";
  isBlocked?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  totalHabits: number;
  activeHabits: number;
  totalProgress: number;
  recentRegistrations: AdminUser[];
  recentActivity: AdminActivity[];
  habitsByFrequency: HabitFrequencyStats[];
  userGrowth: UserGrowthData[];
  systemHealth: SystemHealth;
}

export interface AdminActivity {
  id: string;
  completedAt: string;
  habit: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface HabitFrequencyStats {
  frequency: string;
  count: number;
  percentage: number;
}

export interface UserGrowthData {
  date: string;
  newUsers: number;
  totalUsers: number;
}

export interface SystemHealth {
  status: "HEALTHY" | "WARNING" | "CRITICAL";
  database: "ONLINE" | "OFFLINE";
  uptime: number;
  lastBackup?: string;
  activeConnections: number;
}

export interface BlockUserRequest {
  isBlocked: boolean;
  reason?: string;
}

export interface ResetPasswordRequest {
  newPassword: string;
}

export interface AuditLogEntry {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetType: "USER" | "HABIT" | "PROGRESS" | "SYSTEM";
  targetId?: string;
  details?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface AuditLogResponse {
  logs: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
