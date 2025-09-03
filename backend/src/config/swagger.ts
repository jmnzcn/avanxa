import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Avanxa API",
      version: "1.0.0",
      description:
        "API completa para la aplicación de seguimiento de hábitos Avanxa",
      contact: {
        name: "Equipo de Desarrollo Avanxa",
        email: "dev@avanxa.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:3001",
        description: "Servidor de Desarrollo",
      },
      {
        url: "https://api.avanxa.com",
        description: "Servidor de Producción",
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "accessToken",
          description: "JWT token almacenado en cookie httpOnly",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Tipo de error",
            },
            message: {
              type: "string",
              description: "Descripción del error",
            },
            details: {
              type: "object",
              description: "Detalles adicionales del error",
            },
          },
        },
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "ID único del usuario",
            },
            email: {
              type: "string",
              format: "email",
              description: "Email del usuario",
            },
            firstName: {
              type: "string",
              description: "Nombre del usuario",
            },
            lastName: {
              type: "string",
              description: "Apellido del usuario",
            },
            role: {
              type: "string",
              enum: ["USER", "ADMIN"],
              description: "Rol del usuario",
            },
            isBlocked: {
              type: "boolean",
              description: "Estado de bloqueo del usuario",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Fecha de creación",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Fecha de última actualización",
            },
          },
        },
        Habit: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "ID único del hábito",
            },
            userId: {
              type: "string",
              format: "uuid",
              description: "ID del usuario propietario",
            },
            name: {
              type: "string",
              description: "Nombre del hábito",
            },
            description: {
              type: "string",
              description: "Descripción del hábito",
            },
            frequency: {
              type: "string",
              enum: ["DAILY", "WEEKLY", "MONTHLY"],
              description: "Frecuencia del hábito",
            },
            targetCount: {
              type: "integer",
              description: "Objetivo de completaciones",
            },
            isActive: {
              type: "boolean",
              description: "Estado activo del hábito",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Fecha de creación",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Fecha de última actualización",
            },
          },
        },
        HabitProgress: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "ID único del progreso",
            },
            habitId: {
              type: "string",
              format: "uuid",
              description: "ID del hábito",
            },
            userId: {
              type: "string",
              format: "uuid",
              description: "ID del usuario",
            },
            completedAt: {
              type: "string",
              format: "date-time",
              description: "Fecha de completación",
            },
            notes: {
              type: "string",
              description: "Notas adicionales",
            },
          },
        },
        HabitStatistics: {
          type: "object",
          properties: {
            habitId: {
              type: "string",
              format: "uuid",
              description: "ID del hábito",
            },
            habitName: {
              type: "string",
              description: "Nombre del hábito",
            },
            totalCompletions: {
              type: "integer",
              description: "Total de completaciones",
            },
            currentStreak: {
              type: "integer",
              description: "Racha actual",
            },
            longestStreak: {
              type: "integer",
              description: "Racha más larga",
            },
            completionRate: {
              type: "number",
              description: "Tasa de completación en porcentaje",
            },
            weeklyProgress: {
              type: "array",
              items: {
                $ref: "#/components/schemas/WeeklyProgress",
              },
            },
            monthlyProgress: {
              type: "array",
              items: {
                $ref: "#/components/schemas/MonthlyProgress",
              },
            },
          },
        },
        WeeklyProgress: {
          type: "object",
          properties: {
            week: {
              type: "string",
              description: "Semana (YYYY-WW)",
            },
            startDate: {
              type: "string",
              format: "date",
              description: "Fecha de inicio de la semana",
            },
            endDate: {
              type: "string",
              format: "date",
              description: "Fecha de fin de la semana",
            },
            completedCount: {
              type: "integer",
              description: "Número de completaciones",
            },
            targetCount: {
              type: "integer",
              description: "Objetivo de completaciones",
            },
            percentage: {
              type: "number",
              description: "Porcentaje de completación",
            },
          },
        },
        MonthlyProgress: {
          type: "object",
          properties: {
            month: {
              type: "string",
              description: "Mes (YYYY-MM)",
            },
            startDate: {
              type: "string",
              format: "date",
              description: "Fecha de inicio del mes",
            },
            endDate: {
              type: "string",
              format: "date",
              description: "Fecha de fin del mes",
            },
            completedCount: {
              type: "integer",
              description: "Número de completaciones",
            },
            targetCount: {
              type: "integer",
              description: "Objetivo de completaciones",
            },
            percentage: {
              type: "number",
              description: "Porcentaje de completación",
            },
          },
        },
        AdminUser: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "ID único del usuario",
            },
            email: {
              type: "string",
              format: "email",
              description: "Email del usuario",
            },
            firstName: {
              type: "string",
              description: "Nombre del usuario",
            },
            lastName: {
              type: "string",
              description: "Apellido del usuario",
            },
            role: {
              type: "string",
              enum: ["USER", "ADMIN"],
              description: "Rol del usuario",
            },
            isBlocked: {
              type: "boolean",
              description: "Estado de bloqueo del usuario",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Fecha de creación",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Fecha de última actualización",
            },
            totalHabits: {
              type: "integer",
              description: "Total de hábitos del usuario",
            },
            activeHabits: {
              type: "integer",
              description: "Hábitos activos del usuario",
            },
            totalCompletions: {
              type: "integer",
              description: "Total de completaciones del usuario",
            },
          },
        },
        AdminDashboardStats: {
          type: "object",
          properties: {
            totalUsers: {
              type: "integer",
              description: "Total de usuarios",
            },
            activeUsers: {
              type: "integer",
              description: "Usuarios activos",
            },
            blockedUsers: {
              type: "integer",
              description: "Usuarios bloqueados",
            },
            totalHabits: {
              type: "integer",
              description: "Total de hábitos",
            },
            activeHabits: {
              type: "integer",
              description: "Hábitos activos",
            },
            totalProgress: {
              type: "integer",
              description: "Total de progresos",
            },
            recentRegistrations: {
              type: "array",
              items: {
                $ref: "#/components/schemas/AdminUser",
              },
            },
            recentActivity: {
              type: "array",
              items: {
                $ref: "#/components/schemas/AdminActivity",
              },
            },
            systemHealth: {
              $ref: "#/components/schemas/SystemHealth",
            },
          },
        },
        SystemHealth: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["HEALTHY", "WARNING", "CRITICAL"],
              description: "Estado general del sistema",
            },
            database: {
              type: "string",
              enum: ["ONLINE", "OFFLINE"],
              description: "Estado de la base de datos",
            },
            uptime: {
              type: "integer",
              description: "Tiempo activo en segundos",
            },
            activeConnections: {
              type: "integer",
              description: "Conexiones activas",
            },
          },
        },
        AuditLogEntry: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "ID único del log",
            },
            adminId: {
              type: "string",
              format: "uuid",
              description: "ID del administrador",
            },
            adminEmail: {
              type: "string",
              description: "Email del administrador",
            },
            action: {
              type: "string",
              description: "Acción realizada",
            },
            targetType: {
              type: "string",
              enum: ["USER", "HABIT", "PROGRESS", "SYSTEM"],
              description: "Tipo de objetivo",
            },
            targetId: {
              type: "string",
              description: "ID del objetivo",
            },
            details: {
              type: "string",
              description: "Detalles de la acción",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Fecha de creación",
            },
          },
        },
      },
    },
    tags: [
      {
        name: "Authentication",
        description: "Endpoints de autenticación y autorización",
      },
      {
        name: "Users",
        description: "Gestión de usuarios y perfiles",
      },
      {
        name: "Habits",
        description: "Gestión de hábitos del usuario",
      },
      {
        name: "Progress",
        description: "Seguimiento del progreso de hábitos",
      },
      {
        name: "Admin",
        description: "Funcionalidades administrativas",
      },
      {
        name: "Upload",
        description: "Carga de archivos",
      },
    ],
  },
  apis: ["./src/routes/*.ts", "./src/middleware/*.ts", "./src/services/*.ts"],
};

const specs = swaggerJsdoc(options);

export const swaggerUiOptions = {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #2563eb; font-size: 2.5em; }
    .swagger-ui .info .description { font-size: 1.2em; }
    .swagger-ui .scheme-container { background: #f8fafc; padding: 20px; border-radius: 8px; }
  `,
  customSiteTitle: "Avanxa API Documentation",
  customfavIcon: "/favicon.ico",
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    deepLinking: true,
  },
};

export { specs };
