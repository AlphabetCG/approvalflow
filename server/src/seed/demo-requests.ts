// F-02 sample requests for local runs, the Lab 6 UAT and the E2E test.
// They go through submitRequest, so reviewers are assigned by the real D-01 rule.
// Needs the demo users (seedDemoUsers); a request whose requester is missing is skipped.
import type { PrismaClient } from "@prisma/client";
import { submitRequest } from "../requests/submit";
import type { SubmitRequestInput } from "../requests/validation";

const DEMO_REQUESTS: (SubmitRequestInput & { requesterEmail: string })[] = [
  {
    requesterEmail: "req.eng1@example.com",
    title: "Conference travel to Chiang Mai",
    category: "TRAVEL",
    amount: 4500,
    description: "Return train tickets and two nights of accommodation for the regional software conference.",
  },
  {
    requesterEmail: "req.eng2@example.com",
    title: "Replacement laptop charger",
    category: "EQUIPMENT",
    amount: 1290.5,
    description: "The original charger stopped working; the receipt from the vendor is attached to the email.",
  },
  {
    requesterEmail: "req.fin1@example.com",
    title: "Accounting software training",
    category: "TRAINING",
    amount: 8000,
    description: "Two-day course on the new accounting system before the year-end close.",
  },
  {
    // A reviewer's own request goes to the other reviewer in the department (AC-02-5).
    requesterEmail: "rev.eng1@example.com",
    title: "Printer paper and toner",
    category: "SUPPLIES",
    amount: 2350,
    description: "Paper and toner for the shared printer on the third floor.",
  },
];

export async function seedDemoRequests(prisma: PrismaClient): Promise<{ created: number }> {
  let created = 0;
  for (const { requesterEmail, ...input } of DEMO_REQUESTS) {
    const requester = await prisma.user.findUnique({
      where: { email: requesterEmail },
      select: { id: true, department: true },
    });
    if (!requester) continue;
    // Rerun-safe: the same requester and title means it was seeded before.
    const exists = await prisma.request.findFirst({
      where: { requesterId: requester.id, title: input.title },
      select: { id: true },
    });
    if (exists) continue;
    await submitRequest(requester, input, prisma);
    created += 1;
  }
  return { created };
}
