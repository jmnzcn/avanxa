import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { CheckCircle, Flame } from "lucide-react";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/components/ui/Toast";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageLoading } from "@/components/ui/PageLoading";
import { lazy, Suspense } from "react";

// Lazy load pages for code splitting
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const HabitsPage = lazy(() => import("@/pages/HabitsPage"));
const ProgressPage = lazy(() => import("@/pages/ProgressPage"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { QuickActions } from "@/components/dashboard/QuickActions";
import {
  RecentActivity,
  type ActivityItem,
} from "@/components/dashboard/RecentActivity";
import {
  dashboardService,
  type HabitOverview,
} from "@/services/dashboardService";
import { Breadcrumb } from "@/components/navigation/Breadcrumb";
import { breadcrumbConfigs } from "@/components/navigation/Breadcrumb";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Landing page component
function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Rastrea Tus Hábitos,
              <br />
              <span className="text-primary">Construye Mejores Rutinas</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Avanxa te ayuda a crear, rastrear y mantener hábitos saludables
              con análisis poderosos, seguimiento de rachas y perspectivas
              personalizadas para lograr tus objetivos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-3">
                Comenzar Gratis
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                Saber Más
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          id="features"
          className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30"
        >
          <div className="container mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-foreground mb-16">
              Características Poderosas para Construir Hábitos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Seguimiento de Hábitos</CardTitle>
                  <CardDescription>
                    Crea y gestiona tus hábitos diarios, semanales y mensuales
                    con facilidad.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Establece frecuencia, objetivos y rastrea tu progreso con
                    interfaces intuitivas.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Análisis de Progreso</CardTitle>
                  <CardDescription>
                    Visualiza tu progreso con gráficos detallados y
                    estadísticas.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Rastrea rachas, tasas de finalización e identifica patrones
                    en tu comportamiento.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recordatorios Inteligentes</CardTitle>
                  <CardDescription>
                    Nunca pierdas un hábito con sistemas de notificación
                    inteligentes.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Recibe recordatorios personalizados y motivación para
                    mantenerte en el camino.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-8">
              Acerca de Avanxa
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Avanxa es una aplicación integral de seguimiento de hábitos
              diseñada para ayudarte a construir hábitos positivos duraderos y
              romper los negativos. Nuestra plataforma combina la última ciencia
              del comportamiento con un diseño intuitivo para hacer que la
              construcción de hábitos sea simple y efectiva.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

// Dashboard component (enhanced)
function Dashboard() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => dashboardService.getDashboard(),
  });

  // "Ver progreso" abre el hábito con la racha activa más larga
  const topHabit = data?.habits.reduce<HabitOverview | undefined>(
    (best, h) => (!best || h.currentStreak > best.currentStreak ? h : best),
    undefined
  );

  const activities: ActivityItem[] = (data?.recentActivity ?? []).map((p) => ({
    id: p.id,
    type: "completed",
    habitName: p.habit.name,
    description: p.notes || "Completaste este hábito",
    timestamp: formatRelative(p.completedAt),
    icon: <CheckCircle className="h-4 w-4 text-green-600" />,
    color: "bg-green-100",
  }));

  const habitsByRate = [...(data?.habits ?? [])].sort(
    (a, b) => b.last30DaysRate - a.last30DaysRate
  );
  const habitsByStreak = [...(data?.habits ?? [])]
    .sort((a, b) => b.longestStreak - a.longestStreak)
    .slice(0, 3);

  return (
    <MainLayout currentPath="/dashboard">
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbConfigs.dashboard} />

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Panel Principal</h1>
          <p className="text-muted-foreground">
            ¡Bienvenido de vuelta! Aquí tienes una vista general de tus hábitos
            y progreso.
          </p>
        </div>

        {isLoading && <PageLoading />}
        {error && (
          <Card>
            <CardContent className="py-8 text-center text-red-600">
              No se pudo cargar tu panel. Intenta recargar la página.
            </CardContent>
          </Card>
        )}

        {data && (
          <>
            {/* Dashboard Stats */}
            <DashboardStats data={data} />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <QuickActions
                  onAddHabit={() => navigate("/habits")}
                  onViewHabits={() => navigate("/habits")}
                  onMarkComplete={() => navigate("/habits")}
                  onViewProgress={() =>
                    navigate(topHabit ? `/progress/${topHabit.id}` : "/habits")
                  }
                />
              </div>

              <div className="lg:col-span-2">
                <RecentActivity activities={activities} />
              </div>
            </div>

            {/* Additional Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Cumplimiento por Hábito</CardTitle>
                  <CardDescription>Últimos 30 días</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {habitsByRate.map((habit) => (
                      <div key={habit.id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">{habit.name}</span>
                          <span className="text-sm font-medium">
                            {habit.last30DaysRate}%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${habit.last30DaysRate}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mejores Rachas</CardTitle>
                  <CardDescription>
                    Tus días consecutivos más largos por hábito
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {habitsByStreak.map((habit) => (
                      <div key={habit.id} className="flex items-center space-x-3">
                        <div className="p-2 bg-orange-100 rounded-full">
                          <Flame className="h-4 w-4 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{habit.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Racha actual: {habit.currentStreak}{" "}
                            {habit.frequency === "weekly" ? "semanas" : "días"}
                          </p>
                        </div>
                        <span className="text-sm font-semibold">
                          {habit.longestStreak}{" "}
                          {habit.frequency === "weekly" ? "sem." : "días"}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}

// "Hace 2 horas", "Hace 3 días"…
function formatRelative(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "Justo ahora";
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Hace ${hours} ${hours === 1 ? "hora" : "horas"}`;
  const days = Math.round(hours / 24);
  return `Hace ${days} ${days === 1 ? "día" : "días"}`;
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <Router>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<AuthPage />} />
                <Route path="/register" element={<AuthPage />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/habits"
                  element={
                    <ProtectedRoute>
                      <Suspense
                        fallback={<PageLoading message="Cargando hábitos..." />}
                      >
                        <MainLayout currentPath="/habits">
                          <HabitsPage />
                        </MainLayout>
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/progress/:habitId"
                  element={
                    <ProtectedRoute>
                      <Suspense
                        fallback={
                          <PageLoading message="Cargando progreso..." />
                        }
                      >
                        <MainLayout currentPath="/progress">
                          <ProgressPage />
                        </MainLayout>
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requireAdmin>
                      <Suspense
                        fallback={
                          <PageLoading message="Cargando panel de administración..." />
                        }
                      >
                        <MainLayout currentPath="/admin">
                          <AdminPage />
                        </MainLayout>
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<LandingPage />} />
              </Routes>
            </Router>
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
