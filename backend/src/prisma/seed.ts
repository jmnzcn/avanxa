import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Hábitos de demo: `rate` es la probabilidad de completarlo cada día del historial
const DEMO_HABITS = [
  { id: "habit-1", name: "Leer 30 minutos", description: "Leer al menos 30 minutos al día", frequency: "daily", rate: 0.85 },
  { id: "habit-2", name: "Hacer ejercicio", description: "Entrenar al menos 45 minutos", frequency: "daily", rate: 0.7 },
  { id: "habit-3", name: "Meditar", description: "Practicar mindfulness 15 minutos", frequency: "daily", rate: 0.6 },
  { id: "habit-4", name: "Beber 2 litros de agua", description: "Mantenerse hidratado durante el día", frequency: "daily", rate: 0.9 },
  { id: "habit-5", name: "Planificar la semana", description: "Revisar objetivos y agenda los domingos", frequency: "weekly", rate: 0.95 },
] as const;

const HISTORY_DAYS = 42;

// Generador pseudoaleatorio con semilla fija: la demo siempre produce los mismos datos
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

async function main() {
  console.log("🌱 Starting database seed...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@avanxa.com" },
    update: {},
    create: {
      email: "admin@avanxa.com",
      password: adminPassword,
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
    },
  });

  // Create regular user
  const userPassword = await bcrypt.hash("user123", 12);
  const user = await prisma.user.upsert({
    where: { email: "user@avanxa.com" },
    update: {},
    create: {
      email: "user@avanxa.com",
      password: userPassword,
      firstName: "John",
      lastName: "Doe",
      role: "USER",
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const createdAt = new Date(today);
  createdAt.setDate(createdAt.getDate() - HISTORY_DAYS);

  // Create sample habits for the regular user
  const habits = await Promise.all(
    DEMO_HABITS.map(({ rate, ...habit }) =>
      prisma.habit.upsert({
        where: { id: habit.id },
        update: {},
        create: { ...habit, userId: user.id, targetCount: 1, createdAt },
      })
    )
  );

  // Historial de progreso de las últimas semanas (hoy incluido)
  const random = seededRandom(42);
  const progress = [];
  for (const habit of DEMO_HABITS) {
    for (let daysAgo = HISTORY_DAYS - 1; daysAgo >= 0; daysAgo--) {
      const day = new Date(today);
      day.setDate(day.getDate() - daysAgo);

      const isWeekly = habit.frequency === "weekly";
      if (isWeekly && day.getDay() !== 0) continue; // semanal: solo domingos
      // Los últimos días siempre completados, para que la demo muestre rachas activas
      const done = daysAgo < 5 || random() < habit.rate;
      if (!done) continue;

      day.setHours(isWeekly ? 18 : 7 + (daysAgo % 12), 0, 0, 0);
      progress.push({ habitId: habit.id, userId: user.id, completedAt: day });
    }
  }
  const { count } = await prisma.habitProgress.createMany({
    data: progress,
    skipDuplicates: true,
  });

  console.log("✅ Database seeded successfully!");
  console.log(`👤 Admin user created: ${admin.email}`);
  console.log(`👤 Regular user created: ${user.email}`);
  console.log(`📚 Sample habits created: ${habits.length}`);
  console.log(`✔️  Progress entries created: ${count}`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
