import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { WeeklyProgress, MonthlyProgress } from "@/types/habit";

interface ProgressChartProps {
  weeklyProgress: WeeklyProgress[];
  monthlyProgress: MonthlyProgress[];
  title?: string;
}

export function ProgressChart({
  weeklyProgress,
  monthlyProgress,
  title = "Progreso del Hábito",
}: ProgressChartProps) {
  // For now, we'll create a simple chart using CSS since Recharts isn't installed yet
  // This can be enhanced later with actual charting libraries

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-yellow-500";
    if (percentage >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const getProgressLabel = (percentage: number) => {
    if (percentage >= 80) return "Excelente";
    if (percentage >= 60) return "Bueno";
    if (percentage >= 40) return "Regular";
    return "Necesita Mejora";
  };

  return (
    <div className="space-y-6">
      {/* Weekly Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Progreso Semanal</span>
            <Badge variant="outline">Últimas 4 semanas</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {weeklyProgress.length > 0 ? (
            <div className="space-y-4">
              {weeklyProgress.map((week, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{week.week}</span>
                    <span className="text-muted-foreground">
                      {week.completions}/{week.target} ({week.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(
                        week.percentage
                      )}`}
                      style={{ width: `${Math.min(week.percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={getProgressColor(week.percentage)
                        .replace("bg-", "text-")
                        .replace("-500", "-600")}
                    >
                      {getProgressLabel(week.percentage)}
                    </span>
                    <span className="text-muted-foreground">
                      {week.completions} de {week.target} completados
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay datos de progreso semanal disponibles
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Progreso Mensual</span>
            <Badge variant="outline">Últimos 6 meses</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyProgress.length > 0 ? (
            <div className="space-y-4">
              {monthlyProgress.map((month, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{month.month}</span>
                    <span className="text-muted-foreground">
                      {month.completions}/{month.target} ({month.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(
                        month.percentage
                      )}`}
                      style={{ width: `${Math.min(month.percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={getProgressColor(month.percentage)
                        .replace("bg-", "text-")
                        .replace("-500", "-600")}
                    >
                      {getProgressLabel(month.percentage)}
                    </span>
                    <span className="text-muted-foreground">
                      {month.completions} de {month.target} completados
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay datos de progreso mensual disponibles
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen del Progreso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {weeklyProgress.length > 0
                  ? Math.round(
                      weeklyProgress.reduce(
                        (acc, week) => acc + week.percentage,
                        0
                      ) / weeklyProgress.length
                    )
                  : 0}
                %
              </div>
              <div className="text-sm text-muted-foreground">
                Promedio Semanal
              </div>
            </div>

            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {monthlyProgress.length > 0
                  ? Math.round(
                      monthlyProgress.reduce(
                        (acc, month) => acc + month.percentage,
                        0
                      ) / monthlyProgress.length
                    )
                  : 0}
                %
              </div>
              <div className="text-sm text-muted-foreground">
                Promedio Mensual
              </div>
            </div>

            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {weeklyProgress.length > 0
                  ? weeklyProgress.filter((week) => week.percentage >= 80)
                      .length
                  : 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Semanas Excelentes
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
