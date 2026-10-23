import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { adminService } from "@/services/adminService";
import { AdminDashboardStats } from "@/types/admin";
import {
  Users,
  Target,
  TrendingUp,
  Shield,
  Activity,
  Clock,
  Database,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";

export function AdminDashboard() {
  const [dateRange, setDateRange] = useState<{
    startDate: string;
    endDate: string;
  }>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  const {
    data: stats,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-stats", dateRange],
    queryFn: () =>
      adminService.getAdminDashboardStats(
        dateRange.startDate,
        dateRange.endDate
      ),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getSystemHealthColor = (status: string) => {
    switch (status) {
      case "HEALTHY":
        return "text-green-600";
      case "WARNING":
        return "text-yellow-600";
      case "CRITICAL":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getSystemHealthIcon = (status: string) => {
    switch (status) {
      case "HEALTHY":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "WARNING":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "CRITICAL":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Error al cargar estadísticas del administrador
          </h2>
          <p className="text-muted-foreground mb-4">
            No se pudieron cargar las estadísticas del sistema.
          </p>
          <Button onClick={() => refetch()}>Reintentar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Panel de Administrador</h1>
          <p className="text-muted-foreground">
            Vista general del sistema y estadísticas de usuarios
          </p>
        </div>

        <div className="flex gap-2">
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, startDate: e.target.value }))
            }
            className="px-3 py-2 border border-input rounded-md text-sm"
          />
          <span className="text-muted-foreground self-center">a</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
            }
            className="px-3 py-2 border border-input rounded-md text-sm"
          />
        </div>
      </div>

      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Estado del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                {getSystemHealthIcon(stats.systemHealth.status)}
                <span
                  className={`font-medium ${getSystemHealthColor(
                    stats.systemHealth.status
                  )}`}
                >
                  {stats.systemHealth.status === "HEALTHY" && "Saludable"}
                  {stats.systemHealth.status === "WARNING" && "Advertencia"}
                  {stats.systemHealth.status === "CRITICAL" && "Crítico"}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Estado General
              </div>
            </div>

            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Database className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-600">
                  {stats.systemHealth.database === "ONLINE"
                    ? "En Línea"
                    : "Desconectado"}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">Base de Datos</div>
            </div>

            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-600">
                  {formatUptime(stats.systemHealth.uptime)}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">Tiempo Activo</div>
            </div>

            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Activity className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-purple-600">
                  {stats.systemHealth.activeConnections}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Conexiones Activas
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Total de Usuarios
              </span>
            </div>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeUsers} activos, {stats.blockedUsers} bloqueados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Total de Hábitos
              </span>
            </div>
            <div className="text-2xl font-bold">{stats.totalHabits}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeHabits} activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Total de Completaciones
              </span>
            </div>
            <div className="text-2xl font-bold">{stats.totalProgress}</div>
            <p className="text-xs text-muted-foreground">
              Seguimiento de progreso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Actividad Reciente
              </span>
            </div>
            <div className="text-2xl font-bold">
              {stats.recentActivity.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Últimos registros de progreso
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Habits by Frequency */}
      <Card>
        <CardHeader>
          <CardTitle>Hábitos por Frecuencia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.habitsByFrequency.map((freq) => (
              <div
                key={freq.frequency}
                className="text-center p-4 bg-muted/30 rounded-lg"
              >
                <div className="text-2xl font-bold text-primary">
                  {freq.count}
                </div>
                <div className="text-sm text-muted-foreground">
                  {freq.frequency === "DAILY" && "Diarios"}
                  {freq.frequency === "WEEKLY" && "Semanales"}
                  {freq.frequency === "MONTHLY" && "Mensuales"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {freq.percentage}% del total
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Registrations */}
      <Card>
        <CardHeader>
          <CardTitle>Registros Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentRegistrations.length > 0 ? (
            <div className="space-y-3">
              {stats.recentRegistrations.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {user.firstName.charAt(0)}
                        {user.lastName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={user.role === "ADMIN" ? "default" : "secondary"}
                    >
                      {user.role === "ADMIN" ? "Administrador" : "Usuario"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString("es-ES")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay registros recientes
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">
                        {activity.user.firstName} {activity.user.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Completó "{activity.habit.name}"
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(activity.completedAt).toLocaleDateString("es-ES")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay actividad reciente
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
