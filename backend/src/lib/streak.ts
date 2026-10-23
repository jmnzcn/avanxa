export type Frequency = "daily" | "weekly" | "monthly";

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Índice entero del período (día, semana o mes) al que pertenece una fecha,
 * en la zona horaria local del servidor. Dos períodos consecutivos difieren en 1.
 */
export function periodIndex(date: Date, frequency: Frequency): number {
  if (frequency === "monthly") {
    return date.getFullYear() * 12 + date.getMonth();
  }

  // Días desde 1970-01-01 usando la fecha local (inmune a los cambios de horario)
  const day = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MS_PER_DAY
  );
  if (frequency === "weekly") {
    // 1970-01-01 fue jueves: +3 hace que las semanas empiecen en lunes
    return Math.floor((day + 3) / 7);
  }
  return day;
}

/**
 * Calcula la racha actual y la más larga de un hábito.
 *
 * - Cuenta períodos consecutivos según la frecuencia (días, semanas o meses).
 * - Varias completaciones en el mismo período cuentan una sola vez.
 * - La racha actual sigue viva si el último período completado es el actual o
 *   el anterior: no se pierde a primera hora del día solo por no haber
 *   registrado todavía el hábito de hoy.
 */
export function calculateStreak(
  completions: Date[],
  frequency: Frequency,
  now: Date = new Date()
): StreakResult {
  const periods = [...new Set(completions.map((d) => periodIndex(d, frequency)))].sort(
    (a, b) => a - b
  );

  if (periods.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  let longestStreak = 1;
  let run = 1;
  for (let i = 1; i < periods.length; i++) {
    run = periods[i]! - periods[i - 1]! === 1 ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
  }

  // `run` es la longitud del tramo que termina en el último período registrado
  const current = periodIndex(now, frequency);
  const last = periods[periods.length - 1]!;
  const currentStreak = current - last <= 1 && last <= current ? run : 0;

  return { currentStreak, longestStreak };
}
