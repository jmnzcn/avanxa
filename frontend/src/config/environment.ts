import { z } from "zod";

const envSchema = z.object({
  VITE_API_URL: z.string().url().default("http://localhost:3001"),
  VITE_APP_NAME: z.string().default("Avanxa"),
  VITE_APP_VERSION: z.string().default("1.0.0"),
});

export const env = envSchema.parse(import.meta.env);
