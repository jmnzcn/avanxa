import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { habitService } from "@/services/habitService";
import { Habit, HabitFilters } from "@/types/habit";
import { HabitForm } from "./HabitForm";

interface HabitListProps {
  onHabitSelect?: (habit: Habit) => void;
}

export function HabitList({ onHabitSelect }: HabitListProps) {
  const [filters, setFilters] = useState<HabitFilters>({
    page: 1,
    limit: 10,
    isActive: true,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [deletingHabit, setDeletingHabit] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Fetch habits
  const {
    data: habitsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["habits", filters],
    queryFn: () => habitService.getHabits(filters),
    keepPreviousData: true,
  });

  // Debug logging
  console.log("HabitList - habitsData:", habitsData);
  console.log("HabitList - error:", error);
  console.log("HabitList - isLoading:", isLoading);

  // Delete habit mutation
  const deleteMutation = useMutation({
    mutationFn: (habitId: string) => habitService.deleteHabit(habitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      setDeletingHabit(null);
    },
    onError: (error) => {
      console.error("Error deleting habit:", error);
      setDeletingHabit(null);
    },
  });

  // Create/Update habit mutation
  const habitMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingHabit) {
        return habitService.updateHabit(editingHabit.id, data);
      } else {
        return habitService.createHabit(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      setShowCreateForm(false);
      setEditingHabit(null);
    },
    onError: (error) => {
      console.error("Error saving habit:", error);
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
  const handleFilterChange = (key: keyof HabitFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  // Handle habit actions
  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setShowCreateForm(true);
  };

  const handleDeleteHabit = async (habitId: string) => {
    if (
      window.confirm(
        "¿Estás seguro de que quieres eliminar este hábito? Esta acción no se puede deshacer."
      )
    ) {
      setDeletingHabit(habitId);
      deleteMutation.mutate(habitId);
    }
  };

  const handleToggleHabitStatus = async (habit: Habit) => {
    try {
      await habitService.updateHabit(habit.id, { isActive: !habit.isActive });
      refetch();
    } catch (error) {
      console.error("Error toggling habit status:", error);
    }
  };

  const handleFormSubmit = async (data: any) => {
    await habitMutation.mutateAsync(data);
  };

  const handleCancelForm = () => {
    setShowCreateForm(false);
    setEditingHabit(null);
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case "DAILY":
        return "Diario";
      case "WEEKLY":
        return "Semanal";
      case "MONTHLY":
        return "Mensual";
      default:
        return frequency;
    }
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case "DAILY":
        return "bg-blue-100 text-blue-800";
      case "WEEKLY":
        return "bg-green-100 text-green-800";
      case "MONTHLY":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (showCreateForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {editingHabit ? "Editar Hábito" : "Crear Nuevo Hábito"}
          </h2>
          <Button variant="outline" onClick={handleCancelForm}>
            Volver a la Lista
          </Button>
        </div>
        <HabitForm
          habit={editingHabit || undefined}
          onSubmit={handleFormSubmit}
          onCancel={handleCancelForm}
          isLoading={habitMutation.isLoading}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mis Hábitos</h2>
          <p className="text-muted-foreground">
            Gestiona y rastrea tus hábitos diarios para construir mejores
            rutinas
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-primary hover:bg-primary/90"
        >
          Crear Hábito
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm bg-muted/30">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Buscar
              </label>
              <Input
                placeholder="Buscar hábitos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-background border-input"
              />
            </div>

            {/* Frequency Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Frecuencia
              </label>
              <select
                value={filters.frequency || ""}
                onChange={(e) =>
                  handleFilterChange("frequency", e.target.value || undefined)
                }
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              >
                <option value="">Todas</option>
                <option value="DAILY">Diario</option>
                <option value="WEEKLY">Semanal</option>
                <option value="MONTHLY">Mensual</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Estado
              </label>
              <select
                value={filters.isActive?.toString() || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "isActive",
                    e.target.value === "true"
                      ? true
                      : e.target.value === "false"
                      ? false
                      : undefined
                  )
                }
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              >
                <option value="">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>
            </div>

            {/* Items per page */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Por página
              </label>
              <select
                value={filters.limit}
                onChange={(e) =>
                  handleFilterChange("limit", parseInt(e.target.value))
                }
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Habits List */}
      {isLoading ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-12 pb-12">
            <div className="text-center space-y-4">
              <LoadingSpinner size="lg" className="mx-auto" />
              <p className="text-muted-foreground">Cargando tus hábitos...</p>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-0 shadow-sm bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-12 pb-12">
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-red-700 dark:text-red-300">
                  Error al cargar los hábitos
                </h3>
                <p className="text-red-600 dark:text-red-400 max-w-md mx-auto">
                  {error instanceof Error ? error.message : "Error desconocido"}
                </p>
              </div>
              <Button
                onClick={() => refetch()}
                variant="outline"
                className="border-red-200 text-red-700 hover:bg-red-100"
              >
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : !habitsData?.habits?.length ? (
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardContent className="pt-12 pb-12">
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <span className="text-2xl">📝</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-foreground">
                  ¡Comienza tu viaje de hábitos!
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  No tienes hábitos creados aún. Crea tu primer hábito para
                  comenzar a construir mejores rutinas y alcanzar tus objetivos.
                </p>
              </div>
              <Button
                onClick={() => setShowCreateForm(true)}
                size="lg"
                className="bg-primary hover:bg-primary/90 px-8 py-3"
              >
                Crear mi Primer Hábito
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {habitsData.habits.map((habit) => (
            <Card
              key={habit.id}
              className="hover:shadow-lg transition-all duration-200 border-0 shadow-sm bg-gradient-to-r from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50"
            >
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{habit.name}</h3>
                      <Badge className={getFrequencyColor(habit.frequency)}>
                        {getFrequencyLabel(habit.frequency)}
                      </Badge>
                      <Badge variant={habit.isActive ? "default" : "secondary"}>
                        {habit.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>

                    {habit.description && (
                      <p className="text-muted-foreground text-sm">
                        {habit.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        Objetivo: {habit.targetCount}{" "}
                        {getFrequencyLabel(habit.frequency).toLowerCase()}
                      </span>
                      <span>
                        Creado:{" "}
                        {new Date(habit.createdAt).toLocaleDateString("es-ES")}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    {onHabitSelect && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onHabitSelect(habit)}
                        className="border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        Ver Detalles
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditHabit(habit)}
                      className="border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleHabitStatus(habit)}
                      className={`${
                        habit.isActive
                          ? "border-orange-200 text-orange-700 hover:bg-orange-50"
                          : "border-green-200 text-green-700 hover:bg-green-50"
                      }`}
                    >
                      {habit.isActive ? "Desactivar" : "Activar"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteHabit(habit.id)}
                      disabled={deletingHabit === habit.id}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {deletingHabit === habit.id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        "Eliminar"
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {habitsData?.totalPages && habitsData.totalPages > 1 && (
        <Card className="border-0 shadow-sm bg-muted/30">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Mostrando{" "}
                <span className="font-medium">
                  {(filters.page! - 1) * filters.limit! + 1}
                </span>{" "}
                -{" "}
                <span className="font-medium">
                  {Math.min(filters.page! * filters.limit!, habitsData.total)}
                </span>{" "}
                de <span className="font-medium">{habitsData.total}</span>{" "}
                hábitos
              </p>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(filters.page! - 1)}
                  disabled={filters.page === 1}
                  className="border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  ← Anterior
                </Button>
                <span className="px-4 py-2 text-sm bg-background rounded-md border border-input">
                  Página <span className="font-medium">{filters.page}</span> de{" "}
                  <span className="font-medium">{habitsData.totalPages}</span>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(filters.page! + 1)}
                  disabled={filters.page === habitsData.totalPages}
                  className="border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Siguiente →
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
