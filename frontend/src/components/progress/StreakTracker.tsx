import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface StreakTrackerProps {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  completionRate: number;
  habitName: string;
}

export function StreakTracker({
  currentStreak,
  longestStreak,
  totalCompletions,
  completionRate,
  habitName,
}: StreakTrackerProps) {
  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return "🔥🔥🔥";
    if (streak >= 21) return "🔥🔥";
    if (streak >= 7) return "🔥";
    if (streak >= 3) return "⚡";
    return "💪";
  };

  const getStreakLabel = (streak: number) => {
    if (streak === 0) return "Sin racha";
    if (streak === 1) return "1 día";
    if (streak < 7) return `${streak} días`;
    if (streak < 30) return `${Math.floor(streak / 7)} semanas`;
    return `${Math.floor(streak / 30)} meses`;
  };

  const getCompletionRateColor = (rate: number) => {
    if (rate >= 90) return "text-green-600";
    if (rate >= 75) return "text-blue-600";
    if (rate >= 60) return "text-yellow-600";
    if (rate >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getCompletionRateLabel = (rate: number) => {
    if (rate >= 90) return "Excelente";
    if (rate >= 75) return "Muy Bueno";
    if (rate >= 60) return "Bueno";
    if (rate >= 40) return "Regular";
    return "Necesita Mejora";
  };

  return (
    <div className="space-y-6">
      {/* Current Streak */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Racha Actual</span>
            <Badge variant="outline" className="text-lg">
              {getStreakEmoji(currentStreak)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="text-4xl font-bold text-primary">
              {currentStreak}
            </div>
            <div className="text-lg text-muted-foreground">
              {getStreakLabel(currentStreak)}
            </div>
            {currentStreak > 0 && (
              <div className="text-sm text-green-600 font-medium">
                ¡Mantén la racha! 🎯
              </div>
            )}
            {currentStreak === 0 && (
              <div className="text-sm text-muted-foreground">
                Comienza tu racha hoy
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Longest Streak */}
      <Card>
        <CardHeader>
          <CardTitle>Racha Más Larga</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="text-4xl font-bold text-purple-600">
              {longestStreak}
            </div>
            <div className="text-lg text-muted-foreground">
              {getStreakLabel(longestStreak)}
            </div>
            {longestStreak > currentStreak && (
              <div className="text-sm text-muted-foreground">
                Tu mejor racha fue de {longestStreak} días
              </div>
            )}
            {longestStreak === currentStreak && currentStreak > 0 && (
              <div className="text-sm text-green-600 font-medium">
                ¡Nueva racha récord! 🏆
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Estadísticas Generales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Total Completions */}
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {totalCompletions}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Completado
              </div>
            </div>

            {/* Completion Rate */}
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div
                className={`text-2xl font-bold ${getCompletionRateColor(
                  completionRate
                )}`}
              >
                {Math.round(completionRate)}%
              </div>
              <div className="text-sm text-muted-foreground">
                {getCompletionRateLabel(completionRate)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Motivation */}
      <Card>
        <CardHeader>
          <CardTitle>💪 Motivación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentStreak === 0 && (
              <p className="text-center text-muted-foreground">
                "El primer paso es siempre el más difícil. ¡Comienza tu racha
                hoy con <strong>{habitName}</strong>!"
              </p>
            )}
            {currentStreak > 0 && currentStreak < 7 && (
              <p className="text-center text-muted-foreground">
                "¡Excelente! Has mantenido <strong>{habitName}</strong> por{" "}
                {currentStreak} días. ¡Sigue así!"
              </p>
            )}
            {currentStreak >= 7 && currentStreak < 21 && (
              <p className="text-center text-muted-foreground">
                "¡Increíble! Una semana completa de <strong>{habitName}</strong>
                . ¡Estás construyendo un hábito sólido!"
              </p>
            )}
            {currentStreak >= 21 && currentStreak < 30 && (
              <p className="text-center text-muted-foreground">
                "¡Fantástico! 21 días de <strong>{habitName}</strong>. ¡Los
                expertos dicen que esto es lo que se necesita para formar un
                hábito!"
              </p>
            )}
            {currentStreak >= 30 && (
              <p className="text-center text-muted-foreground">
                "¡Espectacular! Más de un mes de <strong>{habitName}</strong>.
                ¡Eres un ejemplo de consistencia!"
              </p>
            )}

            {currentStreak > longestStreak && longestStreak > 0 && (
              <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">
                  🎉 ¡Nueva racha récord! Has superado tu mejor marca de{" "}
                  {longestStreak} días
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
