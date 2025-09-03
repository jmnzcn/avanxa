import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
}

function StatCard({ title, value, change, changeLabel, icon }: StatCardProps) {
  const getChangeIcon = () => {
    if (change === undefined || change === 0)
      return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const getChangeColor = () => {
    if (change === undefined || change === 0) return "text-muted-foreground";
    if (change > 0) return "text-green-600";
    return "text-red-600";
  };

  const getChangeText = () => {
    if (change === undefined || change === 0) return "Sin cambios";
    const prefix = change > 0 ? "+" : "";
    return `${prefix}${change}${changeLabel || ""}`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
          {getChangeIcon()}
          <span className={getChangeColor()}>{getChangeText()}</span>
        </div>
      </CardContent>
    </Card>
  );
}

interface DashboardStatsProps {
  stats: {
    activeHabits: number;
    currentStreak: number;
    completionRate: number;
    totalHabits: number;
    weeklyProgress: number;
    monthlyProgress: number;
  };
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <StatCard
        title="Hábitos Activos"
        value={stats.activeHabits}
        change={stats.activeHabits - (stats.totalHabits - stats.activeHabits)}
        changeLabel=" desde la semana pasada"
      />

      <StatCard
        title="Racha Actual"
        value={`${stats.currentStreak} días`}
        change={stats.currentStreak > 7 ? 1 : 0}
        changeLabel=" día más"
      />

      <StatCard
        title="Tasa de Finalización"
        value={`${stats.completionRate}%`}
        change={stats.weeklyProgress > stats.monthlyProgress ? 5 : -2}
        changeLabel="% desde la semana pasada"
      />

      <StatCard
        title="Progreso Semanal"
        value={`${stats.weeklyProgress}%`}
        change={stats.weeklyProgress - stats.monthlyProgress}
        changeLabel="% vs mes anterior"
      />

      <StatCard
        title="Progreso Mensual"
        value={`${stats.monthlyProgress}%`}
        change={stats.monthlyProgress - 75}
        changeLabel="% vs objetivo"
      />

      <StatCard
        title="Total de Hábitos"
        value={stats.totalHabits}
        change={2}
        changeLabel=" nuevos este mes"
      />
    </div>
  );
}
