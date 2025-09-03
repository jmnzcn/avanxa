import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { SearchAndFilter } from "@/components/dashboard/SearchAndFilter";
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
  // Sample data for demonstration
  const sampleStats = {
    activeHabits: 5,
    currentStreak: 12,
    completionRate: 87,
    totalHabits: 8,
    weeklyProgress: 92,
    monthlyProgress: 78,
  };

  const navigate = useNavigate();

  const handleQuickAction = (action: string) => {
    console.log(`Quick action: ${action}`);
    // TODO: Implement actual navigation or actions
  };

  const handleViewHabits = () => {
    navigate("/habits");
  };

  const handleSearch = (query: string) => {
    console.log(`Search query: ${query}`);
    // TODO: Implement actual search functionality
  };

  const handleFilterChange = (filters: string[]) => {
    console.log(`Active filters: ${filters.join(", ")}`);
    // TODO: Implement actual filtering
  };

  const handleSortChange = (sortBy: string) => {
    console.log(`Sort by: ${sortBy}`);
    // TODO: Implement actual sorting
  };

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

        {/* Dashboard Stats */}
        <DashboardStats stats={sampleStats} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Quick Actions and Search */}
          <div className="lg:col-span-1 space-y-6">
            <QuickActions
              onAddHabit={() => handleQuickAction("addHabit")}
              onViewProgress={() => handleQuickAction("viewProgress")}
              onViewCalendar={() => handleQuickAction("viewCalendar")}
              onMarkComplete={() => handleQuickAction("markComplete")}
              onViewStats={() => handleQuickAction("viewStats")}
              onSettings={() => handleQuickAction("settings")}
              onViewHabits={handleViewHabits}
            />

            <SearchAndFilter
              onSearch={handleSearch}
              onFilterChange={handleFilterChange}
              onSortChange={handleSortChange}
            />
          </div>

          {/* Right Column - Recent Activity */}
          <div className="lg:col-span-2">
            <RecentActivity activities={[]} />
          </div>
        </div>

        {/* Additional Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Próximos Objetivos</CardTitle>
              <CardDescription>
                Hábitos que están cerca de alcanzar sus metas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Ejercicio Matutino</span>
                  <span className="text-sm font-medium text-green-600">
                    95%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: "95%" }}
                  ></div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Leer</span>
                  <span className="text-sm font-medium text-blue-600">87%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: "87%" }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Logros Recientes</CardTitle>
              <CardDescription>
                Celebra tus éxitos y mantén la motivación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-100 rounded-full">
                    <span className="text-yellow-600 text-lg">🏆</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Racha de 30 días</p>
                    <p className="text-xs text-muted-foreground">Meditación</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <span className="text-green-600 text-lg">🎯</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      Meta semanal alcanzada
                    </p>
                    <p className="text-xs text-muted-foreground">Ejercicio</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
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
                        <HabitsPage />
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
                        <ProgressPage />
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
                        <AdminPage />
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
