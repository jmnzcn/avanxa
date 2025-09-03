import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Habit, CreateHabitRequest, UpdateHabitRequest } from "@/types/habit";

const habitSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre del hábito es requerido")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  description: z
    .string()
    .max(500, "La descripción no puede exceder 500 caracteres")
    .optional(),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"], {
    required_error: "Selecciona una frecuencia",
  }),
  targetCount: z
    .number()
    .min(1, "El objetivo debe ser al menos 1")
    .max(100, "El objetivo no puede exceder 100"),
});

type HabitFormData = z.infer<typeof habitSchema>;

interface HabitFormProps {
  habit?: Habit;
  onSubmit: (data: CreateHabitRequest | UpdateHabitRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function HabitForm({
  habit,
  onSubmit,
  onCancel,
  isLoading = false,
}: HabitFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm<HabitFormData>({
    resolver: zodResolver(habitSchema),
    defaultValues: habit
      ? {
          name: habit.name,
          description: habit.description || "",
          frequency: habit.frequency,
          targetCount: habit.targetCount,
        }
      : {
          name: "",
          description: "",
          frequency: "DAILY",
          targetCount: 1,
        },
    mode: "onChange",
  });

  const frequency = watch("frequency");

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case "DAILY":
        return "Diario";
      case "WEEKLY":
        return "Semanal";
      case "MONTHLY":
        return "Mensual";
      default:
        return freq;
    }
  };

  const getTargetLabel = (freq: string) => {
    switch (freq) {
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

  const handleFormSubmit = async (data: HabitFormData) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      reset();
    } catch (error) {
      console.error("Error submitting habit:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (habit) {
      reset({
        name: habit.name,
        description: habit.description || "",
        frequency: habit.frequency,
        targetCount: habit.targetCount,
      });
    }
  }, [habit, reset]);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{habit ? "Editar Hábito" : "Crear Nuevo Hábito"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Nombre del hábito */}
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Hábito *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Ej: Ejercicio, Leer, Meditar..."
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <textarea
              id="description"
              {...register("description")}
              placeholder="Describe tu hábito y por qué es importante para ti..."
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-500">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Frecuencia */}
          <div className="space-y-2">
            <Label htmlFor="frequency">Frecuencia *</Label>
            <select
              id="frequency"
              {...register("frequency")}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="DAILY">Diario</option>
              <option value="WEEKLY">Semanal</option>
              <option value="MONTHLY">Mensual</option>
            </select>
            {errors.frequency && (
              <p className="text-sm text-red-500">{errors.frequency.message}</p>
            )}
          </div>

          {/* Objetivo */}
          <div className="space-y-2">
            <Label htmlFor="targetCount">
              Objetivo: {getTargetLabel(frequency)}
            </Label>
            <Input
              id="targetCount"
              type="number"
              {...register("targetCount", { valueAsNumber: true })}
              min="1"
              max="100"
              className={errors.targetCount ? "border-red-500" : ""}
            />
            {errors.targetCount && (
              <p className="text-sm text-red-500">
                {errors.targetCount.message}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Meta: {watch("targetCount")} {getTargetLabel(frequency)}
            </p>
          </div>

          {/* Resumen */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium mb-2">Resumen del Hábito</h4>
            <p className="text-sm text-muted-foreground">
              <strong>{watch("name") || "Nombre del hábito"}</strong> -
              {watch("description")
                ? ` ${watch("description")}`
                : " Sin descripción"}{" "}
              - Frecuencia: <strong>{getFrequencyLabel(frequency)}</strong> -
              Objetivo:{" "}
              <strong>
                {watch("targetCount")} {getTargetLabel(frequency)}
              </strong>
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={!isValid || isSubmitting || isLoading}
              className="flex-1"
            >
              {isSubmitting || isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {habit ? "Actualizando..." : "Creando..."}
                </span>
              ) : habit ? (
                "Actualizar Hábito"
              ) : (
                "Crear Hábito"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting || isLoading}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
