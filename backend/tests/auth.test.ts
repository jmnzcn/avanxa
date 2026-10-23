import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { app, prisma, resetDatabase, signUp } from "./helpers";

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

describe("auth", () => {
  it("registra un usuario, guarda el JWT en cookies httpOnly y no expone la contraseña", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "ana@test.com",
      password: "password123",
      firstName: "Ana",
      lastName: "Mora",
    });

    expect(res.status).toBe(201);
    expect(res.body.data.user).toMatchObject({ email: "ana@test.com", role: "USER" });
    expect(res.body.data.user.password).toBeUndefined();

    const cookies = ([] as string[]).concat(res.headers["set-cookie"] ?? []);
    expect(cookies.some((c) => c.startsWith("accessToken=") && /HttpOnly/i.test(c))).toBe(true);

    const stored = await prisma.user.findUnique({ where: { email: "ana@test.com" } });
    expect(stored?.password).not.toBe("password123"); // guardada con bcrypt
  });

  it("rechaza datos inválidos con 400", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "no-es-email", password: "123", firstName: "", lastName: "" });
    expect(res.status).toBe(400);
  });

  it("rechaza un email ya registrado con 409", async () => {
    const { credentials } = await signUp();
    const res = await request(app).post("/api/auth/register").send(credentials);
    expect(res.status).toBe(409);
  });

  it("inicia sesión y devuelve el usuario actual en /me", async () => {
    const { credentials } = await signUp();
    const agent = request.agent(app);

    const login = await agent.post("/api/auth/login").send({
      email: credentials.email,
      password: credentials.password,
    });
    expect(login.status).toBe(200);

    const me = await agent.get("/api/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe(credentials.email);
  });

  it("rechaza una contraseña incorrecta con 401", async () => {
    const { credentials } = await signUp();
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email, password: "incorrecta" });
    expect(res.status).toBe(401);
  });

  it("no permite iniciar sesión a un usuario bloqueado", async () => {
    const { user, credentials } = await signUp();
    await prisma.user.update({ where: { id: user.id }, data: { isBlocked: true } });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email, password: credentials.password });
    expect(res.status).toBe(401);
  });

  it("protege /me sin sesión con 401", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("cierra la sesión", async () => {
    const { agent } = await signUp();
    expect((await agent.post("/api/auth/logout")).status).toBe(200);
    expect((await agent.get("/api/auth/me")).status).toBe(401);
  });
});
