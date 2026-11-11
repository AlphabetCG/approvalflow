// F-02 sample requests for local runs, the Lab 6 UAT and the E2E test.
import type { PrismaClient } from "@prisma/client";

// Stub until the implementation commit: the F-02 seed test must fail on its assertions.
export async function seedDemoRequests(_prisma: PrismaClient): Promise<{ created: number }> {
  return { created: 0 };
}
