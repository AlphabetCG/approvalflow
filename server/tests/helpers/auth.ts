// Test helpers for F-02, F-03 and F-04 API tests.
//
//   const reviewer = await createUser({ role: "REVIEWER" });
//   const agent = request.agent(app);
//   await loginAs(agent, reviewer);      // agent now sends the session cookie
//   await agent.get("/api/reviews/queue");
import bcrypt from "bcryptjs";
import type { Role, User } from "@prisma/client";
import type TestAgent from "supertest/lib/agent";
import { prisma } from "./db";

export const TEST_PASSWORD = "test-password-123";

let counter = 0;

export type TestUser = User & { password: string };

export async function createUser(
  overrides: Partial<{ email: string; name: string; role: Role; department: string; password: string }> = {},
): Promise<TestUser> {
  counter += 1;
  const password = overrides.password ?? TEST_PASSWORD;
  const user = await prisma.user.create({
    data: {
      email: (overrides.email ?? `user${counter}@example.com`).trim().toLowerCase(),
      name: overrides.name ?? `User ${counter}`,
      role: overrides.role ?? "REQUESTER",
      department: overrides.department ?? "ENGINEERING",
      // Low cost keeps tests fast; login reads the cost from the hash.
      passwordHash: await bcrypt.hash(password, 4),
    },
  });
  return { ...user, password };
}

export async function loginAs(agent: TestAgent, user: { email: string; password: string }): Promise<void> {
  const res = await agent.post("/api/auth/login").send({ email: user.email, password: user.password });
  if (res.status !== 200) {
    throw new Error(`loginAs(${user.email}) failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
}
