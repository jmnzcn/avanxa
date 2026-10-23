import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "@/lib/api";
import { mockApi, ok } from "./testUtils";

afterEach(() => vi.unstubAllGlobals());

describe("apiRequest", () => {
  it("desempaqueta el campo `data` de las respuestas del backend", async () => {
    mockApi({ "/api/x": ok({ value: 42 }) });
    await expect(apiRequest("/api/x")).resolves.toEqual({ value: 42 });
  });

  it("envía cookies y JSON en cada request", async () => {
    const fetchMock = mockApi({ "POST /api/x": ok({}) });
    await apiRequest("/api/x", { method: "POST", body: "{}" });

    const [, init] = fetchMock.mock.calls[0]!;
    expect(init?.credentials).toBe("include");
    expect((init?.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
  });

  it("lanza el `message` del backend cuando la respuesta es un error", async () => {
    mockApi({ "/api/x": { status: 409, body: { error: "Conflict", message: "Ya existe" } } });
    await expect(apiRequest("/api/x")).rejects.toThrow("Ya existe");
  });

  it("usa un mensaje genérico si el error no trae cuerpo JSON", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("boom", { status: 500 })));
    await expect(apiRequest("/api/x")).rejects.toThrow("HTTP error! status: 500");
  });
});
