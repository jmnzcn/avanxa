// Configuración en tiempo de build: Vite reemplaza `import.meta.env.VITE_*` al compilar.
// - Sin definir: API en http://localhost:3001 (desarrollo)
// - VITE_API_URL=https://...: API en otro servidor (tests e2e)
// - VITE_API_URL="": API en el mismo dominio que la app (despliegue en un solo servicio)
export const env = {
  VITE_API_URL: import.meta.env.VITE_API_URL ?? "http://localhost:3001",
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME || "Avanxa",
  VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION || "1.0.0",
} as const;
