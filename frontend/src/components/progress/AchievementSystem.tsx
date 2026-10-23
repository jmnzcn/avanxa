import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  target?: number;
  category: "streak" | "completion" | "consistency" | "milestone";
}

interface AchievementSystemProps {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  completionRate: number;
  habitName: string;
}

export function AchievementSystem({
  currentStreak,
  longestStreak,
  totalCompletions,
  completionRate,
}: AchievementSystemProps) {
  const achievements: Achievement[] = [
    // Streak achievements
    {
      id: "first-day",
      name: "Primer Día",
      description: "Completa tu hábito por primera vez",
      icon: "🌱",
      isUnlocked: totalCompletions > 0,
      category: "streak",
    },
    {
      id: "three-day-streak",
      name: "Tres Días Seguidos",
      description: "Mantén tu hábito por 3 días consecutivos",
      icon: "⚡",
      isUnlocked: longestStreak >= 3,
      category: "streak",
      progress: Math.min(currentStreak, 3),
      target: 3,
    },
    {
      id: "week-warrior",
      name: "Guerrero Semanal",
      description: "Mantén tu hábito por 7 días consecutivos",
      icon: "🔥",
      isUnlocked: longestStreak >= 7,
      category: "streak",
      progress: Math.min(currentStreak, 7),
      target: 7,
    },
    {
      id: "month-master",
      name: "Maestro Mensual",
      description: "Mantén tu hábito por 30 días consecutivos",
      icon: "👑",
      isUnlocked: longestStreak >= 30,
      category: "streak",
      progress: Math.min(currentStreak, 30),
      target: 30,
    },
    {
      id: "century-club",
      name: "Club del Siglo",
      description: "Mantén tu hábito por 100 días consecutivos",
      icon: "💎",
      isUnlocked: longestStreak >= 100,
      category: "streak",
      progress: Math.min(currentStreak, 100),
      target: 100,
    },

    // Completion achievements
    {
      id: "first-ten",
      name: "Primeros Diez",
      description: "Completa tu hábito 10 veces",
      icon: "🎯",
      isUnlocked: totalCompletions >= 10,
      category: "completion",
      progress: Math.min(totalCompletions, 10),
      target: 10,
    },
    {
      id: "fifty-fifty",
      name: "Cincuenta y Cincuenta",
      description: "Completa tu hábito 50 veces",
      icon: "🏆",
      isUnlocked: totalCompletions >= 50,
      category: "completion",
      progress: Math.min(totalCompletions, 50),
      target: 50,
    },
    {
      id: "century-marker",
      name: "Marcador del Siglo",
      description: "Completa tu hábito 100 veces",
      icon: "🌟",
      isUnlocked: totalCompletions >= 100,
      category: "completion",
      progress: Math.min(totalCompletions, 100),
      target: 100,
    },

    // Consistency achievements
    {
      id: "consistency-beginner",
      name: "Consistencia Básica",
      description: "Mantén una tasa de completado del 60%",
      icon: "📈",
      isUnlocked: completionRate >= 60,
      category: "consistency",
      progress: Math.min(completionRate, 60),
      target: 60,
    },
    {
      id: "consistency-expert",
      name: "Experto en Consistencia",
      description: "Mantén una tasa de completado del 80%",
      icon: "🚀",
      isUnlocked: completionRate >= 80,
      category: "consistency",
      progress: Math.min(completionRate, 80),
      target: 80,
    },
    {
      id: "consistency-master",
      name: "Maestro de la Consistencia",
      description: "Mantén una tasa de completado del 95%",
      icon: "💫",
      isUnlocked: completionRate >= 95,
      category: "consistency",
      progress: Math.min(completionRate, 95),
      target: 95,
    },

    // Milestone achievements
    {
      id: "habit-builder",
      name: "Constructor de Hábitos",
      description: "Mantén tu hábito activo por 21 días",
      icon: "🏗️",
      isUnlocked: longestStreak >= 21,
      category: "milestone",
    },
    {
      id: "lifestyle-changer",
      name: "Cambiador de Estilo de Vida",
      description: "Mantén tu hábito activo por 90 días",
      icon: "🌍",
      isUnlocked: longestStreak >= 90,
      category: "milestone",
    },
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "streak":
        return "bg-orange-100 text-orange-800";
      case "completion":
        return "bg-blue-100 text-blue-800";
      case "consistency":
        return "bg-green-100 text-green-800";
      case "milestone":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "streak":
        return "Racha";
      case "completion":
        return "Completado";
      case "consistency":
        return "Consistencia";
      case "milestone":
        return "Hito";
      default:
        return category;
    }
  };

  const unlockedAchievements = achievements.filter((a) => a.isUnlocked);
  const lockedAchievements = achievements.filter((a) => !a.isUnlocked);

  return (
    <div className="space-y-6">
      {/* Achievement Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🏆 Sistema de Logros
            <Badge variant="outline">
              {unlockedAchievements.length}/{achievements.length} Desbloqueados
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {unlockedAchievements.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Logros Desbloqueados
              </div>
            </div>

            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(
                  (unlockedAchievements.length / achievements.length) * 100
                )}
                %
              </div>
              <div className="text-sm text-muted-foreground">
                Progreso Total
              </div>
            </div>

            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {
                  achievements.filter(
                    (a) => a.category === "streak" && a.isUnlocked
                  ).length
                }
              </div>
              <div className="text-sm text-muted-foreground">
                Logros de Racha
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unlocked Achievements */}
      {unlockedAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">
              ✅ Logros Desbloqueados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unlockedAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="p-4 border border-green-200 bg-green-50 rounded-lg text-center"
                >
                  <div className="text-3xl mb-2">{achievement.icon}</div>
                  <h4 className="font-semibold text-green-800 mb-1">
                    {achievement.name}
                  </h4>
                  <p className="text-sm text-green-700 mb-2">
                    {achievement.description}
                  </p>
                  <Badge className={getCategoryColor(achievement.category)}>
                    {getCategoryLabel(achievement.category)}
                  </Badge>
                  {achievement.unlockedAt && (
                    <p className="text-xs text-green-600 mt-2">
                      Desbloqueado:{" "}
                      {new Date(achievement.unlockedAt).toLocaleDateString(
                        "es-ES"
                      )}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Locked Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-muted-foreground">
            🔒 Logros por Desbloquear
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lockedAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className="p-4 border border-gray-200 bg-gray-50 rounded-lg text-center opacity-60"
              >
                <div className="text-3xl mb-2 filter grayscale">
                  {achievement.icon}
                </div>
                <h4 className="font-semibold text-gray-600 mb-1">
                  {achievement.name}
                </h4>
                <p className="text-sm text-gray-500 mb-2">
                  {achievement.description}
                </p>
                <Badge className="bg-gray-200 text-gray-600">
                  {getCategoryLabel(achievement.category)}
                </Badge>

                {achievement.progress !== undefined && achievement.target && (
                  <div className="mt-3 space-y-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            (achievement.progress / achievement.target) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      {achievement.progress}/{achievement.target} (
                      {Math.round(
                        (achievement.progress / achievement.target) * 100
                      )}
                      %)
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Next Achievement Preview */}
      {lockedAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>🎯 Próximo Logro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className="text-4xl">{lockedAchievements[0]?.icon}</div>
              <div>
                <h4 className="text-lg font-semibold mb-2">
                  {lockedAchievements[0]?.name}
                </h4>
                <p className="text-muted-foreground mb-4">
                  {lockedAchievements[0]?.description}
                </p>
                {lockedAchievements[0]?.progress !== undefined &&
                  lockedAchievements[0]?.target && (
                    <div className="space-y-2">
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(
                              (lockedAchievements[0].progress! /
                                lockedAchievements[0].target!) *
                                100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {lockedAchievements[0].progress}/
                        {lockedAchievements[0].target} (
                        {Math.round(
                          (lockedAchievements[0].progress! /
                            lockedAchievements[0].target!) *
                            100
                        )}
                        %)
                      </p>
                    </div>
                  )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
