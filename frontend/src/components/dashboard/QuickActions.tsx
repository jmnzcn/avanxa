import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Plus,
  Target,
  BarChart3,
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
      className="h-auto w-full justify-start p-4 text-left whitespace-normal"
      onClick={onClick}
    >
      <div className="flex items-center space-x-2 w-full">
        {/* Sobre el botón principal (fondo azul) el ícono y la descripción van en blanco */}
        <div className={variant === "default" ? "" : "text-primary"}>{icon}</div>
        <div className="flex-1">
          <div className="font-medium">{title}</div>
          <div
            className={`text-xs ${
              variant === "default" ? "text-primary-foreground/80" : "text-muted-foreground"
            }`}
          >
            {description}
          </div>
        </div>
      </div>
    </Button>
  );
}

interface QuickActionsProps {
  onAddHabit?: () => void;
  onViewProgress?: () => void;
  onMarkComplete?: () => void;
  onViewHabits?: () => void;
}

export function QuickActions({
  onAddHabit,
  onViewProgress,
  onMarkComplete,
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
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
            description="Historial y rachas de tu hábito principal"
            icon={<BarChart3 className="h-5 w-5" />}
            onClick={onViewProgress || (() => {})}
            variant="outline"
          />



        </div>
      </CardContent>
    </Card>
  );
}
