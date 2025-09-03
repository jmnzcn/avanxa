import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Breadcrumb } from "@/components/navigation/Breadcrumb";
import { habitService } from "@/services/habitService";
import { Habit, HabitStatistics } from "@/types/habit";
import { ProgressChart } from "@/components/progress/ProgressChart";
import { StreakTracker } from "@/components/progress/StreakTracker";
import { AchievementSystem } from "@/components/progress/AchievementSystem";
import { HabitCompletion } from "@/components/habits/HabitCompletion";

export default function ProgressPage() {
  const { habitId } = useParams<{ habitId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "overview" | "charts" | "achievements"
  >("overview");

  // Fetch habit details
  const {
    data: habit,
    isLoading: habitLoading,
    error: habitError,
  } = useQuery({
    queryKey: ["habit", habitId],
    queryFn: () => habitService.getHabit(habitId!),
    enabled: !!habitId,
  });

  // Fetch habit progress
  const {
    data: progress,
    isLoading: progressLoading,
    error: progressError,
  } = useQuery({
    queryKey: ["habit-progress", habitId],
    queryFn: () => habitService.getHabitProgress(habitId!),
    enabled: !!habitId,
  });

  // Check if habit is completed today
  const isCompletedToday = progress?.weeklyProgress?.[0]?.completions > 0;

  if (habitLoading || progressLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingSpinner />
      </div>
    );
  }

  if (habitError || progressError || !habit) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Error al cargar el hábito
          </h2>
          <p className="text-muted-foreground mb-4">
            No se pudo cargar la información del hábito o su progreso.
          </p>
          <Button onClick={() => navigate("/dashboard")}>
            Volver al Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Mis Hábitos", href: "/habits" },
    { label: habit.name, href: `/progress/${habit.id}` },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Breadcrumb items={breadcrumbItems} />

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{habit.name}</h1>
            <p className="text-muted-foreground">
              Seguimiento y análisis de tu progreso
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/habits")}>
              Volver a Hábitos
            </Button>
            <Button onClick={() => navigate(`/habits/edit/${habit.id}`)}>
              Editar Hábito
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Completion */}
      <Card>
        <CardHeader>
          <CardTitle>Completar Hábito Hoy</CardTitle>
        </CardHeader>
        <CardContent>
          <HabitCompletion
            habit={habit}
            isCompletedToday={isCompletedToday}
            onComplete={() => {
              // Refresh progress data
              window.location.reload();
            }}
          />
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "overview"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
            }`}
          >
            Vista General
          </button>
          <button
            onClick={() => setActiveTab("charts")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "charts"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
            }`}
          >
            Gráficos y Estadísticas
          </button>
          <button
            onClick={() => setActiveTab("achievements")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "achievements"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
            }`}
          >
            Logros y Metas
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {progress?.totalCompletions || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Completado
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {progress?.currentStreak || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Racha Actual
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {progress?.longestStreak || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Mejor Racha
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round(progress?.completionRate || 0)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Tasa de Completado
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Streak Tracker */}
          {progress && (
            <StreakTracker
              currentStreak={progress.currentStreak}
              longestStreak={progress.longestStreak}
              totalCompletions={progress.totalCompletions}
              completionRate={progress.completionRate}
              habitName={habit.name}
            />
          )}
        </div>
      )}

      {activeTab === "charts" && (
        <div className="space-y-6">
          {progress ? (
            <ProgressChart
              weeklyProgress={progress.weeklyProgress}
              monthlyProgress={progress.monthlyProgress}
              title={`Progreso de ${habit.name}`}
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">
                  No hay datos de progreso disponibles para mostrar gráficos
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "achievements" && (
        <div className="space-y-6">
          {progress ? (
            <AchievementSystem
              currentStreak={progress.currentStreak}
              longestStreak={progress.longestStreak}
              totalCompletions={progress.totalCompletions}
              completionRate={progress.completionRate}
              habitName={habit.name}
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">
                  No hay datos de progreso disponibles para mostrar logros
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Habit Information */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Hábito</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-muted-foreground">
                  Descripción
                </h4>
                <p className="text-sm">
                  {habit.description || "Sin descripción"}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-muted-foreground">
                  Frecuencia
                </h4>
                <p className="text-sm">
                  {habit.frequency === "DAILY" && "Diario"}
                  {habit.frequency === "WEEKLY" && "Semanal"}
                  {habit.frequency === "MONTHLY" && "Mensual"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-muted-foreground">Objetivo</h4>
                <p className="text-sm">
                  {habit.targetCount} veces por{" "}
                  {habit.frequency === "DAILY" && "día"}
                  {habit.frequency === "WEEKLY" && "semana"}
                  {habit.frequency === "MONTHLY" && "mes"}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-muted-foreground">Estado</h4>
                <p className="text-sm">
                  {habit.isActive ? "Activo" : "Inactivo"}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-muted-foreground">Creado</h4>
                <p className="text-sm">
                  {new Date(habit.createdAt).toLocaleDateString("es-ES")}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
