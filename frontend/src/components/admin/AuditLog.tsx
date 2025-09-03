import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { adminService } from "@/services/adminService";
import { AuditLogEntry } from "@/types/admin";
import {
  Activity,
  User,
  Target,
  TrendingUp,
  Settings,
  Clock,
  Eye,
} from "lucide-react";

export function AuditLog() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const {
    data: auditData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["audit-logs", page, limit],
    queryFn: () => adminService.getAuditLogs(page, limit),
    keepPreviousData: true,
  });

  const getTargetTypeIcon = (targetType: string) => {
    switch (targetType) {
      case "USER":
        return <User className="h-4 w-4" />;
      case "HABIT":
        return <Target className="h-4 w-4" />;
      case "PROGRESS":
        return <TrendingUp className="h-4 w-4" />;
      case "SYSTEM":
        return <Settings className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getTargetTypeLabel = (targetType: string) => {
    switch (targetType) {
      case "USER":
        return "Usuario";
      case "HABIT":
        return "Hábito";
      case "PROGRESS":
        return "Progreso";
      case "SYSTEM":
        return "Sistema";
      default:
        return targetType;
    }
  };

  const getTargetTypeColor = (targetType: string) => {
    switch (targetType) {
      case "USER":
        return "bg-blue-100 text-blue-800";
      case "HABIT":
        return "bg-green-100 text-green-800";
      case "PROGRESS":
        return "bg-purple-100 text-purple-800";
      case "SYSTEM":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getActionLabel = (action: string) => {
    const actionMap: Record<string, string> = {
      USER_BLOCKED: "Usuario Bloqueado",
      USER_UNBLOCKED: "Usuario Desbloqueado",
      USER_PASSWORD_RESET: "Contraseña Restablecida",
      USER_DELETED: "Usuario Eliminado",
      HABIT_CREATED: "Hábito Creado",
      HABIT_UPDATED: "Hábito Actualizado",
      HABIT_DELETED: "Hábito Eliminado",
      PROGRESS_COMPLETED: "Progreso Completado",
      SYSTEM_BACKUP: "Respaldo del Sistema",
      SYSTEM_MAINTENANCE: "Mantenimiento del Sistema",
    };

    return actionMap[action] || action;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">
              Error al cargar el registro de auditoría
            </p>
            <Button onClick={() => refetch()}>Reintentar</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Registro de Auditoría</h2>
        <p className="text-muted-foreground">
          Historial de acciones administrativas y eventos del sistema
        </p>
      </div>

      {/* Audit Log */}
      {!auditData?.logs.length ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No hay registros de auditoría disponibles
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {auditData.logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start space-x-4 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {/* Action Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      {getTargetTypeIcon(log.targetType)}
                    </div>
                  </div>

                  {/* Log Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium">{log.adminEmail}</span>
                          <Badge className={getTargetTypeColor(log.targetType)}>
                            {getTargetTypeLabel(log.targetType)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {getActionLabel(log.action)}
                          </span>
                        </div>

                        {log.details && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {log.details}
                          </p>
                        )}

                        {log.targetId && (
                          <p className="text-xs text-muted-foreground">
                            ID del objetivo: {log.targetId}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {new Date(log.createdAt).toLocaleDateString("es-ES")}
                        </span>
                        <span>
                          {new Date(log.createdAt).toLocaleTimeString("es-ES")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {auditData && auditData.totalPages > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Mostrando {(page - 1) * limit + 1} -{" "}
                {Math.min(page * limit, auditData.total)} de {auditData.total}{" "}
                registros
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <span className="px-3 py-2 text-sm">
                  Página {page} de {auditData.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === auditData.totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Auditoría</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {auditData?.logs.filter((log) => log.targetType === "USER")
                  .length || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Acciones de Usuario
              </div>
            </div>

            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {auditData?.logs.filter((log) => log.targetType === "HABIT")
                  .length || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Acciones de Hábitos
              </div>
            </div>

            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {auditData?.logs.filter((log) => log.targetType === "PROGRESS")
                  .length || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Acciones de Progreso
              </div>
            </div>

            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {auditData?.logs.filter((log) => log.targetType === "SYSTEM")
                  .length || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Acciones del Sistema
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
