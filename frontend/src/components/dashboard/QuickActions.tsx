import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Plus,
  Target,
  BarChart3,
  Settings,
  Calendar,
  CheckCircle,
  Star,
} from "lucide-react";

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "outline" | "secondary";
}

function QuickAction({
  title,
  description,
  icon,
  onClick,
  variant = "default",
}: QuickActionProps) {
  return (
    <Button
      variant={variant}
      className="h-auto p-4 flex-col items-start space-y-2 text-left"
      onClick={onClick}
    >
      <div className="flex items-center space-x-2 w-full">
        <div className="text-primary">{icon}</div>
        <div className="flex-1">
          <div className="font-medium">{title}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
      </div>
    </Button>
  );
}

interface QuickActionsProps {
  onAddHabit?: () => void;
  onViewProgress?: () => void;
  onViewCalendar?: () => void;
  onMarkComplete?: () => void;
  onViewStats?: () => void;
  onSettings?: () => void;
  onViewHabits?: () => void;
}

export function QuickActions({
  onAddHabit,
  onViewProgress,
  onViewCalendar,
  onMarkComplete,
  onViewStats,
  onSettings,
  onViewHabits,
}: QuickActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Star className="h-5 w-5 text-primary" />
          <span>Acciones Rápidas</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <QuickAction
            title="Crear Hábito"
            description="Añadir un nuevo hábito a tu rutina"
            icon={<Plus className="h-5 w-5" />}
            onClick={onAddHabit || (() => {})}
            variant="default"
          />

          <QuickAction
            title="Ver Mis Hábitos"
            description="Gestionar todos tus hábitos"
            icon={<Target className="h-5 w-5" />}
            onClick={onViewHabits || (() => {})}
            variant="outline"
          />

          <QuickAction
            title="Marcar Completado"
            description="Registrar hábitos completados hoy"
            icon={<CheckCircle className="h-5 w-5" />}
            onClick={onMarkComplete || (() => {})}
            variant="outline"
          />

          <QuickAction
            title="Ver Progreso"
            description="Revisar tu progreso semanal"
            icon={<BarChart3 className="h-5 w-5" />}
            onClick={onViewProgress || (() => {})}
            variant="outline"
          />

          <QuickAction
            title="Calendario"
            description="Ver tu historial de hábitos"
            icon={<Calendar className="h-5 w-5" />}
            onClick={onViewCalendar || (() => {})}
            variant="outline"
          />

          <QuickAction
            title="Estadísticas"
            description="Analizar tus patrones"
            icon={<Target className="h-5 w-5" />}
            onClick={onViewStats || (() => {})}
            variant="outline"
          />

          <QuickAction
            title="Configuración"
            description="Personalizar tu experiencia"
            icon={<Settings className="h-5 w-5" />}
            onClick={onSettings || (() => {})}
            variant="secondary"
          />
        </div>
      </CardContent>
    </Card>
  );
}
