// F-01 demo users for local runs, the Lab 6 UAT and the E2E test.
// The password comes only from DEMO_USER_PASSWORD; without it no users are made.
// Every department with requesters has at least 2 reviewers (F-02, D-01).
import type { PrismaClient, Role } from "@prisma/client";
import { hashPassword } from "../auth/password";

const DEMO_USERS: { email: string; name: string; role: Role; department: string }[] = [
  { email: "req.eng1@example.com", name: "Anan (Engineering requester)", role: "REQUESTER", department: "ENGINEERING" },
  { email: "req.eng2@example.com", name: "Busaba (Engineering requester)", role: "REQUESTER", department: "ENGINEERING" },
  { email: "rev.eng1@example.com", name: "Chai (Engineering reviewer)", role: "REVIEWER", department: "ENGINEERING" },
  { email: "rev.eng2@example.com", name: "Duangjai (Engineering reviewer)", role: "REVIEWER", department: "ENGINEERING" },
  { email: "req.fin1@example.com", name: "Ekachai (Finance requester)", role: "REQUESTER", department: "FINANCE" },
  { email: "rev.fin1@example.com", name: "Fah (Finance reviewer)", role: "REVIEWER", department: "FINANCE" },
  { email: "rev.fin2@example.com", name: "Ganya (Finance reviewer)", role: "REVIEWER", department: "FINANCE" },
];

export async function seedDemoUsers(
  prisma: PrismaClient,
  env: NodeJS.ProcessEnv = process.env,
): Promise<{ created: number; skipped: boolean }> {
  const password = env.DEMO_USER_PASSWORD;
  if (!password) return { created: 0, skipped: true };
  if (password.length < 8) throw new Error("DEMO_USER_PASSWORD must be at least 8 characters");

  const passwordHash = await hashPassword(password);
  let created = 0;
  for (const user of DEMO_USERS) {
    const exists = await prisma.user.findUnique({ where: { email: user.email }, select: { id: true } });
    if (exists) continue; // Rerun-safe: never overwrite an existing user or password.
    await prisma.user.create({ data: { ...user, passwordHash } });
    created += 1;
  }
  return { created, skipped: false };
}
