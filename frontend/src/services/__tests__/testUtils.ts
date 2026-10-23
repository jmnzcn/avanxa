import { vi } from "vitest";

type Route = { status?: number; body: unknown };

/**
 * Sustituye `fetch` por un mock que responde según la ruta (sin query string).
 * Devuelve el mock para inspeccionar las llamadas.
 */
export function mockApi(routes: Record<string, Route | ((url: URL, init?: RequestInit) => Route)>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const handler = routes[`${init?.method ?? "GET"} ${url.pathname}`] ?? routes[url.pathname];
    if (!handler) throw new Error(`Ruta no simulada: ${init?.method ?? "GET"} ${url.pathname}`);
    const { status = 200, body } = typeof handler === "function" ? handler(url, init) : handler;
    return new Response(JSON.stringify(body), { status });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/** Envuelve datos como lo hace el backend: `{ success: true, data }`. */
export const ok = (data: unknown): Route => ({ body: { success: true, data } });

/** Fecha ISO de hace `n` días. */
export const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
