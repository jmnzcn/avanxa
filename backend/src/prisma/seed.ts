import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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

  // Create sample habits for the regular user
  const habits = await Promise.all([
    prisma.habit.upsert({
      where: { id: "habit-1" },
      update: {},
      create: {
        id: "habit-1",
        userId: user.id,
        name: "Read Daily",
        description: "Read at least 30 minutes every day",
        frequency: "daily",
        targetCount: 1,
      },
    }),
    prisma.habit.upsert({
      where: { id: "habit-2" },
      update: {},
      create: {
        id: "habit-2",
        userId: user.id,
        name: "Exercise",
        description: "Workout for at least 45 minutes",
        frequency: "daily",
        targetCount: 1,
      },
    }),
    prisma.habit.upsert({
      where: { id: "habit-3" },
      update: {},
      create: {
        id: "habit-3",
        userId: user.id,
        name: "Meditation",
        description: "Practice mindfulness for 15 minutes",
        frequency: "daily",
        targetCount: 1,
      },
    }),
  ]);

  // Create some sample progress entries
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  await Promise.all([
    prisma.habitProgress.upsert({
      where: { id: "progress-1" },
      update: {},
      create: {
        id: "progress-1",
        habitId: habits[0].id,
        userId: user.id,
        completedAt: today,
        notes: "Read chapter 5 of the book",
      },
    }),
    prisma.habitProgress.upsert({
      where: { id: "progress-2" },
      update: {},
      create: {
        id: "progress-2",
        habitId: habits[1].id,
        userId: user.id,
        completedAt: today,
        notes: "Ran 5km in the park",
      },
    }),
    prisma.habitProgress.upsert({
      where: { id: "progress-3" },
      update: {},
      create: {
        id: "progress-3",
        habitId: habits[0].id,
        userId: user.id,
        completedAt: yesterday,
        notes: "Read chapter 4 of the book",
      },
    }),
  ]);

  console.log("✅ Database seeded successfully!");
  console.log(`👤 Admin user created: ${admin.email}`);
  console.log(`👤 Regular user created: ${user.email}`);
  console.log(`📚 Sample habits created: ${habits.length}`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
