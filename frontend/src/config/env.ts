// Configuración en tiempo de build: Vite reemplaza `import.meta.env.VITE_*` al compilar.
// Para apuntar a otra API (tests e2e, despliegue): VITE_API_URL=https://... npm run build
export const env = {
  VITE_API_URL: import.meta.env.VITE_API_URL || "http://localhost:3001",
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME || "Avanxa",
  VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION || "1.0.0",
} as const;
