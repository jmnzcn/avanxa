import { describe, expect, it } from "vitest";
import { calculateStreak, periodIndex } from "../src/lib/streak";

// Fechas locales: d(2026, 10, 23) = 23 de octubre de 2026 a las 12:00
const d = (y: number, m: number, day: number, h = 12) => new Date(y, m - 1, day, h);

describe("periodIndex", () => {
  it("devuelve días consecutivos para fechas consecutivas, a cualquier hora", () => {
    expect(periodIndex(d(2026, 10, 24, 0), "daily") - periodIndex(d(2026, 10, 23, 23), "daily")).toBe(1);
  });

  it("no se desfasa con el cambio de horario de verano (día de 23 horas)", () => {
    // 8 de marzo de 2026: inicio del horario de verano en EE. UU.
    expect(periodIndex(d(2026, 3, 9, 0), "daily") - periodIndex(d(2026, 3, 8, 0), "daily")).toBe(1);
  });

  it("agrupa de lunes a domingo en la misma semana", () => {
    const monday = periodIndex(d(2026, 10, 19), "weekly");
    expect(periodIndex(d(2026, 10, 25), "weekly")).toBe(monday); // domingo
    expect(periodIndex(d(2026, 10, 26), "weekly")).toBe(monday + 1); // lunes siguiente
  });

  it("cuenta meses consecutivos a través del cambio de año", () => {
    expect(periodIndex(d(2027, 1, 1), "monthly") - periodIndex(d(2026, 12, 31), "monthly")).toBe(1);
  });
});

describe("calculateStreak", () => {
  const now = d(2026, 10, 23);

  it("sin completaciones devuelve 0 y 0", () => {
    expect(calculateStreak([], "daily", now)).toEqual({ currentStreak: 0, longestStreak: 0 });
  });

  it("cuenta días consecutivos que terminan hoy", () => {
    const days = [21, 22, 23].map((day) => d(2026, 10, day));
    expect(calculateStreak(days, "daily", now)).toEqual({ currentStreak: 3, longestStreak: 3 });
  });

  it("mantiene la racha viva si el último registro fue ayer", () => {
    const days = [20, 21, 22].map((day) => d(2026, 10, day));
    expect(calculateStreak(days, "daily", now).currentStreak).toBe(3);
  });

  it("corta la racha actual si pasó más de un período", () => {
    const days = [19, 20, 21].map((day) => d(2026, 10, day));
    expect(calculateStreak(days, "daily", now)).toEqual({ currentStreak: 0, longestStreak: 3 });
  });

  it("separa la racha más larga de la actual", () => {
    const days = [1, 2, 3, 4, 5, 10, 22, 23].map((day) => d(2026, 10, day));
    expect(calculateStreak(days, "daily", now)).toEqual({ currentStreak: 2, longestStreak: 5 });
  });

  it("cuenta una sola vez varias completaciones del mismo día", () => {
    const days = [d(2026, 10, 22, 8), d(2026, 10, 22, 20), d(2026, 10, 23)];
    expect(calculateStreak(days, "daily", now).currentStreak).toBe(2);
  });

  it("no depende del orden de entrada", () => {
    const days = [23, 21, 22].map((day) => d(2026, 10, day));
    expect(calculateStreak(days, "daily", now).currentStreak).toBe(3);
  });

  it("en hábitos semanales cuenta semanas consecutivas, no días", () => {
    // Domingos 5, 12 y 19 de octubre: tres semanas seguidas
    const sundays = [5, 12, 19].map((day) => d(2026, 10, day));
    expect(calculateStreak(sundays, "weekly", now)).toEqual({ currentStreak: 3, longestStreak: 3 });
  });

  it("en hábitos mensuales cuenta meses consecutivos", () => {
    const months = [d(2026, 8, 15), d(2026, 9, 2), d(2026, 10, 30)];
    expect(calculateStreak(months, "monthly", now)).toEqual({ currentStreak: 3, longestStreak: 3 });
  });
});
