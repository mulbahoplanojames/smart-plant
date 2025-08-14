// npx tsx scripts/clear-db.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    // The order is important due to foreign key constraints
    await prisma.command.deleteMany({});
    await prisma.telemetry.deleteMany({});
    await prisma.plant.deleteMany({});
    await prisma.device.deleteMany({});
    await prisma.user.deleteMany({});

    console.log("✅ Database cleared successfully");
  } catch (error) {
    console.error("Error clearing database:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();
