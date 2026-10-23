import { useState, useEffect } from "react";
import {
  keepPreviousData,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { adminService } from "@/services/adminService";
import { AdminUser, AdminUserFilters } from "@/types/admin";
import {
  Search,
  Filter,
  UserCheck,
  UserX,
  Key,
  Trash2,
  Eye,
} from "lucide-react";

interface UserManagementTableProps {
  onUserSelect?: (user: AdminUser) => void;
}

export function UserManagementTable({
  onUserSelect,
}: UserManagementTableProps) {
  const [filters, setFilters] = useState<AdminUserFilters>({
    page: 1,
    limit: 20,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Fetch users
  const {
    data: usersData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-users", filters],
    queryFn: () => adminService.getUsers(filters),
    placeholderData: keepPreviousData, // React Query v5
  });

  // Block/Unblock user mutation
  const blockMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: any }) =>
      adminService.blockUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      setActionLoading(null);
    },
    onError: (error) => {
      console.error("Error blocking user:", error);
      setActionLoading(null);
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: any }) =>
      adminService.resetUserPassword(userId, data),
    onSuccess: () => {
      setActionLoading(null);
      alert("Contraseña restablecida exitosamente");
    },
    onError: (error) => {
      console.error("Error resetting password:", error);
      setActionLoading(null);
    },
  });

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: (userId: string) => adminService.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      setActionLoading(null);
    },
    onError: (error) => {
      console.error("Error deleting user:", error);
      setActionLoading(null);
    },
  });

  // Handle search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchTerm, page: 1 }));
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Handle filter changes
  const handleFilterChange = (key: keyof AdminUserFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  // Handle user actions
  const handleBlockUser = async (user: AdminUser) => {
    const isBlocking = !user.isBlocked;
    const reason = isBlocking
      ? prompt("Razón para bloquear al usuario:")
      : undefined;

    if (isBlocking && !reason) return;

    setActionLoading(user.id);
    blockMutation.mutate({
      userId: user.id,
      data: { isBlocked: isBlocking, reason },
    });
  };

  const handleResetPassword = async (user: AdminUser) => {
    const newPassword = prompt("Nueva contraseña (mínimo 6 caracteres):");
    if (!newPassword || newPassword.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setActionLoading(user.id);
    resetPasswordMutation.mutate({
      userId: user.id,
      data: { newPassword },
    });
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (user.role === "ADMIN") {
      alert("No se pueden eliminar usuarios administradores");
      return;
    }

    if (
      window.confirm(
        `¿Estás seguro de que quieres eliminar a ${user.firstName} ${user.lastName}? Esta acción no se puede deshacer.`
      )
    ) {
      setActionLoading(user.id);
      deleteMutation.mutate(user.id);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Administrador";
      case "USER":
        return "Usuario";
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-800";
      case "USER":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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
            <p className="text-red-500 mb-4">Error al cargar los usuarios</p>
            <Button onClick={() => refetch()}>Reintentar</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
          <p className="text-muted-foreground">
            Administra usuarios, roles y permisos del sistema
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuarios por nombre, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-border">
                {/* Role Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rol</label>
                  <select
                    value={filters.role || ""}
                    onChange={(e) =>
                      handleFilterChange("role", e.target.value || undefined)
                    }
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Todos los roles</option>
                    <option value="USER">Usuario</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Estado</label>
                  <select
                    value={filters.isBlocked?.toString() || ""}
                    onChange={(e) =>
                      handleFilterChange(
                        "isBlocked",
                        e.target.value === "true"
                          ? true
                          : e.target.value === "false"
                          ? false
                          : undefined
                      )
                    }
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Todos los estados</option>
                    <option value="false">Activos</option>
                    <option value="true">Bloqueados</option>
                  </select>
                </div>

                {/* Sort By */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ordenar por</label>
                  <select
                    value={filters.sortBy || "createdAt"}
                    onChange={(e) =>
                      handleFilterChange("sortBy", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="createdAt">Fecha de registro</option>
                    <option value="email">Email</option>
                    <option value="firstName">Nombre</option>
                    <option value="lastName">Apellido</option>
                    <option value="role">Rol</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Orden</label>
                  <select
                    value={filters.sortOrder || "desc"}
                    onChange={(e) =>
                      handleFilterChange(
                        "sortOrder",
                        e.target.value as "asc" | "desc"
                      )
                    }
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="desc">Descendente</option>
                    <option value="asc">Ascendente</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      {!usersData?.users.length ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No se encontraron usuarios con los filtros aplicados
              </p>
              <Button onClick={() => setFilters({ page: 1, limit: 20 })}>
                Limpiar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium">Usuario</th>
                    <th className="text-left py-3 px-4 font-medium">Rol</th>
                    <th className="text-left py-3 px-4 font-medium">Estado</th>
                    <th className="text-left py-3 px-4 font-medium">Hábitos</th>
                    <th className="text-left py-3 px-4 font-medium">
                      Registrado
                    </th>
                    <th className="text-left py-3 px-4 font-medium">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {usersData.users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-border hover:bg-muted/30"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
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
                      </td>

                      <td className="py-3 px-4">
                        <Badge className={getRoleColor(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                      </td>

                      <td className="py-3 px-4">
                        <Badge
                          variant={user.isBlocked ? "destructive" : "default"}
                        >
                          {user.isBlocked ? "Bloqueado" : "Activo"}
                        </Badge>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <div>{user.totalHabits} total</div>
                          <div className="text-muted-foreground">
                            {user.totalCompletions} completados
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-sm text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString("es-ES")}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          {onUserSelect && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onUserSelect(user)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBlockUser(user)}
                            disabled={actionLoading === user.id}
                          >
                            {user.isBlocked ? (
                              <UserCheck className="h-4 w-4" />
                            ) : (
                              <UserX className="h-4 w-4" />
                            )}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResetPassword(user)}
                            disabled={actionLoading === user.id}
                          >
                            <Key className="h-4 w-4" />
                          </Button>

                          {user.role !== "ADMIN" && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteUser(user)}
                              disabled={actionLoading === user.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {usersData && usersData.totalPages > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Mostrando {(filters.page! - 1) * filters.limit! + 1} -{" "}
                {Math.min(filters.page! * filters.limit!, usersData.total)} de{" "}
                {usersData.total} usuarios
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(filters.page! - 1)}
                  disabled={filters.page === 1}
                >
                  Anterior
                </Button>
                <span className="px-3 py-2 text-sm">
                  Página {filters.page} de {usersData.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(filters.page! + 1)}
                  disabled={filters.page === usersData.totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
