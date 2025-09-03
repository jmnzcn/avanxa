import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { habitService } from "@/services/habitService";
import { Habit, CompleteHabitRequest } from "@/types/habit";

interface HabitCompletionProps {
  habit: Habit;
  onComplete?: () => void;
  isCompletedToday?: boolean;
}

export function HabitCompletion({
  habit,
  onComplete,
  isCompletedToday = false,
}: HabitCompletionProps) {
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();

  const completeMutation = useMutation({
    mutationFn: (data: CompleteHabitRequest) =>
      habitService.completeHabit(habit.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["progress"] });
      setNotes("");
      setShowNotes(false);
      setIsSubmitting(false);
      onComplete?.();
    },
    onError: (error) => {
      console.error("Error completing habit:", error);
      setIsSubmitting(false);
    },
  });

  const handleComplete = async () => {
    if (isCompletedToday) return;

    setIsSubmitting(true);
    const data: CompleteHabitRequest = {};

    if (notes.trim()) {
      data.notes = notes.trim();
    }

    completeMutation.mutate(data);
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case "DAILY":
        return "Diario";
      case "WEEKLY":
        return "Semanal";
      case "MONTHLY":
        return "Mensual";
      default:
        return frequency;
    }
  };

  const getTargetLabel = (frequency: string) => {
    switch (frequency) {
      case "DAILY":
        return "veces por día";
      case "WEEKLY":
        return "veces por semana";
      case "MONTHLY":
        return "veces por mes";
      default:
        return "veces";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{habit.name}</span>
          <Badge variant={habit.isActive ? "default" : "secondary"}>
            {habit.isActive ? "Activo" : "Inactivo"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Habit Info */}
        <div className="space-y-2">
          {habit.description && (
            <p className="text-muted-foreground text-sm">{habit.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-800">
                {getFrequencyLabel(habit.frequency)}
              </Badge>
              <span>
                Objetivo: {habit.targetCount} {getTargetLabel(habit.frequency)}
              </span>
            </span>
          </div>
        </div>

        {/* Completion Status */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                isCompletedToday ? "bg-green-500" : "bg-gray-300"
              }`}
            />
            <span className="text-sm font-medium">
              {isCompletedToday ? "Completado hoy" : "Pendiente de completar"}
            </span>
          </div>

          {isCompletedToday && (
            <Badge className="bg-green-100 text-green-800">✓ Completado</Badge>
          )}
        </div>

        {/* Notes Input */}
        {showNotes && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Notas (opcional)</label>
            <Input
              placeholder="Agrega notas sobre tu progreso..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {notes.length}/500 caracteres
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!isCompletedToday ? (
            <>
              <Button
                onClick={handleComplete}
                disabled={isSubmitting || !habit.isActive}
                className="flex-1"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Completando...
                  </span>
                ) : (
                  "Marcar como Completado"
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowNotes(!showNotes)}
                disabled={isSubmitting}
              >
                {showNotes ? "Ocultar Notas" : "Agregar Notas"}
              </Button>
            </>
          ) : (
            <div className="w-full text-center">
              <p className="text-green-600 font-medium">
                ¡Excelente! Has completado este hábito hoy
              </p>
            </div>
          )}
        </div>

        {/* Progress Info */}
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Última actualización:{" "}
            {new Date(habit.updatedAt).toLocaleString("es-ES")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
