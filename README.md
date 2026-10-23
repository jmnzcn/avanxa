# ✅ Avanxa

**Aplicación full-stack para crear hábitos, registrarlos cada día y ver tu progreso con rachas, estadísticas y un panel de administración.** Monorepo en TypeScript: React 19 en el frontend y una API REST con Express, Prisma y PostgreSQL.

![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)

[English summary](#-english-summary) · [Funcionalidades](#-funcionalidades) · [Arquitectura](#-arquitectura) · [Caso de estudio](#-caso-de-estudio-de-prototipo-a-app-integrada) · [Cómo correrlo](#-cómo-correrlo)

![Panel principal con estadísticas reales del usuario](docs/screenshots/03_dashboard.png)

---

## ✨ Funcionalidades

- **Hábitos:** crear, editar, desactivar y eliminar hábitos diarios, semanales o mensuales, con búsqueda, filtros y paginación.
- **Registro diario:** marcar un hábito como completado, con notas opcionales; el backend evita duplicados el mismo día.
- **Progreso:** racha actual y más larga, tasa de cumplimiento, progreso por semana y por mes, y logros desbloqueables.
- **Panel principal:** hábitos activos, mejor racha, completados hoy, porcentaje de la semana y del mes, actividad reciente y cumplimiento por hábito en los últimos 30 días.
- **Administración:** estado del sistema (base de datos, tiempo activo, conexiones), métricas globales, gestión de usuarios (bloquear, restablecer contraseña, eliminar) y registro de auditoría de cada acción de admin.
- **API documentada** con Swagger en `/api-docs`.

<table>
<tr>
<td width="50%"><img src="docs/screenshots/04_habits.png" alt="Lista de hábitos con filtros"></td>
<td width="50%"><img src="docs/screenshots/06_progress_charts.png" alt="Progreso semanal de un hábito"></td>
</tr>
<tr>
<td align="center"><sub>Mis hábitos: búsqueda, filtros y acciones</sub></td>
<td align="center"><sub>Progreso de un hábito: completado hoy y avance semanal</sub></td>
</tr>
<tr>
<td width="50%"><img src="docs/screenshots/07_admin.png" alt="Panel de administrador"></td>
<td width="50%"><img src="docs/screenshots/08_admin_users.png" alt="Gestión de usuarios"></td>
</tr>
<tr>
<td align="center"><sub>Panel de admin: salud del sistema y métricas</sub></td>
<td align="center"><sub>Gestión de usuarios</sub></td>
</tr>
</table>

---

## 🧩 Arquitectura

```mermaid
flowchart LR
    U["Usuario"] --> FE["Frontend · React 19 + Vite<br/>React Query · React Hook Form · Zod · Tailwind"]
    FE -- "fetch + cookies httpOnly" --> API["API REST · Express<br/>Zod · JWT · Helmet · CORS · caché"]
    API --> DB[("PostgreSQL 17<br/>Prisma ORM")]
    API --> SW["Swagger UI<br/>/api-docs"]
```

| Capa | Detalles |
|---|---|
| **Autenticación** | JWT de acceso (15 min) y de refresco (7 días) en cookies `httpOnly` con `sameSite=strict`; contraseñas con bcrypt; roles `USER` y `ADMIN`; usuarios bloqueables |
| **Validación** | Zod en el backend (cuerpo y parámetros de cada endpoint) y en los formularios del frontend |
| **Datos** | Prisma con PostgreSQL: usuarios, hábitos, progreso y auditoría, con índices en las columnas de consulta frecuente y restricción de un registro por hábito por día |
| **API** | 40+ endpoints REST con respuestas uniformes `{ success, data }`, borrado lógico de hábitos, caché en memoria en lecturas frecuentes y documentación OpenAPI |
| **Frontend** | React Query para caché e invalidación, rutas protegidas, carga diferida por página y una capa de servicios que adapta el contrato de la API a los tipos de la UI |

---

## 🔧 Caso de estudio: de prototipo a app integrada

Al levantar la app para documentarla, el frontend y el backend **no estaban conectados de verdad**: el usuario aparecía como *"undefined undefined"*, la lista de hábitos salía vacía aunque la API devolvía datos, el panel mostraba cifras fijas y el admin no cargaba. El backend estaba bien; el frontend se había escrito contra otro contrato.

**Qué encontré y cómo lo resolví:**

1. **Contrato de respuestas distinto.** El backend envuelve todo en `{ success, data }` y el frontend leía la respuesta directa. Unifiqué tres clientes HTTP duplicados en uno ([`frontend/src/lib/api.ts`](frontend/src/lib/api.ts)) que desempaqueta `data`.
2. **Formas y rutas que no coincidían.** El login devuelve `{ user, accessToken, refreshToken }`, no `{ user, tokens }`; la frecuencia es `"daily"`, no `"DAILY"`; la paginación viene en `pagination`; y algunas rutas de progreso no existían. En lugar de tocar todos los componentes, cada servicio ahora **adapta** el contrato de la API a los tipos de la UI.
3. **Panel con datos inventados.** Las 6 métricas, la actividad reciente, los "próximos objetivos" y los "logros" eran valores fijos. Ahora salen de 5 endpoints reales ([`dashboardService.ts`](frontend/src/services/dashboardService.ts)), incluido el cumplimiento por hábito de los últimos 30 días.
4. **Bugs de lógica:**
   - "Completado hoy" se calculaba como "hay registros esta semana".
   - La tasa de cumplimiento podía superar el 100 %.
   - El panel de admin enviaba fechas `YYYY-MM-DD` cuando el backend exige ISO completo.
   - Faltaban el tiempo activo y las conexiones del sistema; los agregué al endpoint de salud con datos reales en vez de inventarlos.
5. **Detalles de interfaz:** el menú lateral tapaba el contenido en pantallas angostas, había dos enlaces del menú sin página detrás, un título duplicado y un botón con texto ilegible.
6. **Datos de demo realistas:** el seed ahora crea 5 hábitos con 6 semanas de historial determinista, para que rachas y gráficos tengan sentido.

Verificado en el navegador: login, panel, lista de hábitos, registro de un hábito, progreso y panel de admin. El build de producción compila, el backend no tiene errores de tipos y el frontend no suma errores nuevos de TypeScript (ver [estado](#-estado-y-próximos-pasos)).

---

## 🚀 Cómo correrlo

Requisitos: Node.js 20+ y Docker.

```bash
git clone https://github.com/jmnzcn/avanxa.git
cd avanxa
npm install

# Base de datos
docker compose up -d db
cp backend/env.example backend/.env
npm run db:generate
npm run db:push
npm run db:seed

# Backend (:3001) y frontend (:3000)
npm run dev
```

Abre http://localhost:3000. La documentación de la API está en http://localhost:3001/api-docs.

**Cuentas de demo** (las crea `npm run db:seed`, solo para desarrollo local):

| Rol | Email | Contraseña |
|---|---|---|
| Usuario | `user@avanxa.com` | `user123` |
| Admin | `admin@avanxa.com` | `admin123` |

<details>
<summary>Otros comandos</summary>

```bash
npm run backend:dev     # solo backend
npm run frontend:dev    # solo frontend
npm run build           # build de producción de ambos paquetes
npm run db:migrate      # migraciones de Prisma
npm run db:studio       # Prisma Studio
```
</details>

<details>
<summary>Estructura del repositorio</summary>

```text
backend/
  prisma/schema.prisma   modelos: User, Habit, HabitProgress, AuditLog
  src/routes/            auth, habits, progress, users, admin, upload
  src/services/          lógica de negocio y validación (Zod)
  src/middleware/        auth (JWT), caché, logging, uploads
  src/prisma/seed.ts     datos de demo
frontend/
  src/services/          clientes de la API y adaptadores de contrato
  src/pages/             hábitos, progreso, admin, login
  src/components/        dashboard, hábitos, progreso, admin, layout, ui
docs/screenshots/        capturas del README
```
</details>

---

## 📌 Estado y próximos pasos

- **Sin tests automatizados todavía.** Es lo siguiente: tests de la API con Supertest y de los servicios del frontend.
- **Errores de TypeScript heredados en el frontend.** Vite no verifica tipos, así que la app corre y compila, pero `tsc` reporta 61 errores previos (imports sin usar y tipos genéricos de React Query). Ninguno viene de los cambios de integración.
- **Rachas de hábitos semanales:** el backend cuenta rachas por días consecutivos, así que en un hábito semanal la racha máxima es 1. Falta contar por semanas.
- **Sin despliegue público** todavía.

---

## 🇺🇸 English summary

**Avanxa** is a full-stack habit tracker: a TypeScript monorepo with a **React 19 + Vite** frontend and an **Express + Prisma + PostgreSQL** REST API (JWT auth in httpOnly cookies, Zod validation, Swagger docs, role-based admin panel with audit logging).

When I brought the app up to document it, the frontend wasn't really wired to the backend: user data showed as *"undefined"*, the habit list was empty, and the dashboard showed hard-coded numbers. I traced it to a **contract mismatch** (response envelope, field names, enum casing, pagination, missing routes). I fixed it with a single HTTP client plus **adapter layers** in each service, connected the dashboard to 5 real endpoints, and fixed several logic bugs: "completed today", completion rates over 100 %, and date formats the admin API rejected. I also wrote a realistic demo seed. Everything was verified end to end in the browser.

---

**Ney Fred Jiménez Campos** · [LinkedIn](https://www.linkedin.com/in/neyfred/) · [GitHub](https://github.com/jmnzcn) · neyfred@gmail.com
