// Reproducible demo data. Must be safe to rerun.
// Demo passwords must come from environment variables, never from this file.
import { PrismaClient } from "@prisma/client";
import { seedDemoUsers } from "../src/seed/demo-users";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const users = await seedDemoUsers(prisma);
  console.log(
    users.skipped
      ? "Seed: DEMO_USER_PASSWORD is not set, so no demo users were created."
      : `Seed: ${users.created} demo user(s) created.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
