// F-02: store a validated request with its reviewer and first history row.
import type { PrismaClient } from "@prisma/client";
import type { AuthUser } from "../auth/session";
import { prisma as defaultDb } from "../db";
import { conflict } from "../http";
import { pickReviewer } from "./assign-reviewer";
import type { SubmitRequestInput } from "./validation";

const USER_REF = { select: { id: true, email: true } } as const;

export interface SubmittedRequest {
  id: string;
  title: string;
  category: string;
  amount: string;
  description: string;
  status: string;
  submittedAt: string;
  requester: { id: string; email: string };
  reviewer: { id: string; email: string };
}

// One transaction: if the history row cannot be written, no request is stored.
export async function submitRequest(
  requester: Pick<AuthUser, "id" | "department">,
  input: SubmitRequestInput,
  db: PrismaClient = defaultDb,
): Promise<SubmittedRequest> {
  const created = await db.$transaction(async (tx) => {
    // D-01: round-robin among the department's reviewers, never the requester.
    const reviewers = await tx.user.findMany({
      where: { role: "REVIEWER", department: requester.department },
      select: { id: true },
      orderBy: { id: "asc" },
    });
    const last = await tx.request.findFirst({
      where: { reviewer: { department: requester.department } },
      orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
      select: { reviewerId: true },
    });
    const reviewerId = pickReviewer(
      reviewers.map((r) => r.id),
      requester.id,
      last?.reviewerId ?? null,
    );
    if (!reviewerId) throw conflict("No reviewer is available in your department");

    return tx.request.create({
      data: {
        ...input,
        requesterId: requester.id,
        reviewerId,
        status: "SUBMITTED",
        history: {
          create: { actorId: requester.id, action: "SUBMIT", fromStatus: null, toStatus: "SUBMITTED" },
        },
      },
      include: { requester: USER_REF, reviewer: USER_REF },
    });
  });

  return {
    id: created.id,
    title: created.title,
    category: created.category,
    amount: created.amount.toFixed(2),
    description: created.description,
    status: created.status,
    submittedAt: created.submittedAt.toISOString(),
    requester: created.requester,
    reviewer: created.reviewer,
  };
}
