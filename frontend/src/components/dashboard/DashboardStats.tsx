import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Activity, CalendarCheck, CalendarDays, CheckCircle2, Flame, Target } from "lucide-react";
import type { DashboardData } from "@/services/dashboardService";

interface StatCardProps {
  title: string;
  value: string | number;
  detail: string;
  icon: React.ReactNode;
}

function StatCard({ title, value, detail, icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

interface DashboardStatsProps {
  data: DashboardData;
}

export function DashboardStats({ data }: DashboardStatsProps) {
  const bestStreak = data.habits.reduce<DashboardData["habits"][number] | undefined>(
    (best, h) => (!best || h.currentStreak > best.currentStreak ? h : best),
    undefined
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <StatCard
        title="Hábitos Activos"
        value={data.activeHabits}
        detail={`de ${data.totalHabits} en total`}
        icon={<Target className="h-4 w-4" />}
      />
      <StatCard
        title="Mejor Racha Activa"
        value={`${bestStreak?.currentStreak ?? 0} días`}
        detail={bestStreak ? bestStreak.name : "Aún no hay rachas"}
        icon={<Flame className="h-4 w-4" />}
      />
      <StatCard
        title="Completados Hoy"
        value={`${data.completedToday} / ${data.activeHabits}`}
        detail="hábitos registrados hoy"
        icon={<CheckCircle2 className="h-4 w-4" />}
      />
      <StatCard
        title="Esta Semana"
        value={`${data.weekRate}%`}
        detail={`${data.weekCompletions} completados desde el lunes`}
        icon={<CalendarCheck className="h-4 w-4" />}
      />
      <StatCard
        title="Este Mes"
        value={`${data.monthRate}%`}
        detail={`${data.monthCompletions} completados este mes`}
        icon={<CalendarDays className="h-4 w-4" />}
      />
      <StatCard
        title="Total Completados"
        value={data.totalCompletions}
        detail="desde que empezaste"
        icon={<Activity className="h-4 w-4" />}
      />
    </div>
  );
}
