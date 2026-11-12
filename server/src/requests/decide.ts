// F-04: approve or reject a request, and the reviewer's queue.
import type { PrismaClient, RequestStatus } from "@prisma/client";
import { prisma as defaultDb } from "../db";
import { conflict, forbidden, notFound } from "../http";
import { nextStatus, type DecisionAction } from "./transitions";

const USER_REF = { select: { id: true, email: true, name: true } } as const;

export interface UserRef {
  id: string;
  email: string;
  name: string;
}

export interface QueueItem {
  id: string;
  title: string;
  category: string;
  amount: string;
  submittedAt: string;
  requester: UserRef;
}

// Same shape as a HistoryEntry in F-03, so the client can append it.
export interface DecisionEntry {
  id: string;
  action: string;
  fromStatus: RequestStatus | null;
  toStatus: RequestStatus;
  reason: string | null;
  createdAt: string;
  actor: UserRef;
}

export interface Decision {
  id: string;
  status: RequestStatus;
  decision: DecisionEntry;
}

// D-15: assigned SUBMITTED requests, oldest first.
export async function listQueue(reviewerId: string, db: PrismaClient = defaultDb): Promise<QueueItem[]> {
  const rows = await db.request.findMany({
    where: { reviewerId, status: "SUBMITTED" },
    orderBy: [{ submittedAt: "asc" }, { id: "asc" }],
    select: { id: true, title: true, category: true, amount: true, submittedAt: true, requester: USER_REF },
  });
  return rows.map((r) => ({ ...r, amount: r.amount.toFixed(2), submittedAt: r.submittedAt.toISOString() }));
}

// Checks 4–7 of the contract, in order. The status update is conditional
// (WHERE status = current), so of two simultaneous decisions only one
// updates the row (BR-07); the history row is in the same transaction.
export async function decide(
  reviewerId: string,
  requestId: string,
  action: DecisionAction,
  reason: string | null,
  db: PrismaClient = defaultDb,
): Promise<Decision> {
  return db.$transaction(async (tx) => {
    // D-13 / D-10: a request the caller is not part of looks like an unknown id.
    const r = await tx.request.findFirst({
      where: { id: requestId, OR: [{ requesterId: reviewerId }, { reviewerId }] },
      select: { status: true, requesterId: true },
    });
    if (!r) throw notFound("Request not found");
    if (r.requesterId === reviewerId) throw forbidden("You cannot decide on your own request");

    const to = nextStatus(r.status, action);
    if (!to) throw conflict(`This request is already ${r.status}`);

    const updated = await tx.request.updateMany({
      where: { id: requestId, reviewerId, status: r.status },
      data: { status: to },
    });
    if (updated.count === 0) throw conflict("This request was decided by someone else");

    const h = await tx.requestHistory.create({
      data: { requestId, actorId: reviewerId, action, fromStatus: r.status, toStatus: to, reason },
      include: { actor: USER_REF },
    });
    return {
      id: requestId,
      status: to,
      decision: {
        id: h.id,
        action: h.action,
        fromStatus: h.fromStatus,
        toStatus: h.toStatus,
        reason: h.reason,
        createdAt: h.createdAt.toISOString(),
        actor: h.actor,
      },
    };
  });
}
