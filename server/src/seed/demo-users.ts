// F-01 demo users. STUB: real implementation follows the failing tests.
import type { PrismaClient } from "@prisma/client";

export async function seedDemoUsers(
  _prisma: PrismaClient,
  _env: NodeJS.ProcessEnv = process.env,
): Promise<{ created: number; skipped: boolean }> {
  return { created: 0, skipped: true };
}
