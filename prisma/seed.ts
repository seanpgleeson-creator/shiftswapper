import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.settings.findFirst();
  if (existing) {
    console.log("Settings row already exists, skipping seed.");
    return;
  }
  await prisma.settings.create({
    data: {
      schedulerEmail: process.env.SCHEDULER_EMAIL ?? "scheduler@example.com",
      timezone: "America/Chicago",
    },
  });
  console.log("Seeded settings (scheduler_email, timezone).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
