import { env } from "@/config/env";

/**
 * Cliente HTTP compartido por los servicios.
 *
 * El backend responde `{ success: true, data: ... }` en los casos de éxito y
 * `{ error, message }` en los de error. Esta función devuelve solo `data`, para
 * que cada servicio trabaje con el contenido real de la respuesta.
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${env.VITE_API_URL}${endpoint}`, {
    ...options,
    credentials: "include", // el JWT viaja en cookies httpOnly
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.message || `HTTP error! status: ${response.status}`);
  }

  return (body && typeof body === "object" && "data" in body ? body.data : body) as T;
}
