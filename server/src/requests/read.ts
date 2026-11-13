// F-03: read requests. "Mine" = requests the user submitted (D-11); one request
// is readable by its requester or its assigned reviewer only (D-10, NFR-03).
import type { PrismaClient } from "@prisma/client";
import { prisma as defaultDb } from "../db";

export interface UserRef {
  id: string;
  email: string;
  name: string;
}

export interface RequestListItem {
  id: string;
  title: string;
  category: string;
  amount: string;
  status: string;
  submittedAt: string;
  reviewer: UserRef;
}

export interface HistoryEntry {
  id: string;
  action: string;
  fromStatus: string | null;
  toStatus: string;
  reason: string | null;
  createdAt: string;
  actor: UserRef;
}

export interface RequestDetail {
  id: string;
  title: string;
  category: string;
  amount: string;
  description: string;
  status: string;
  submittedAt: string;
  requester: UserRef;
  reviewer: UserRef;
  history: HistoryEntry[];
}

const USER_REF = { select: { id: true, email: true, name: true } } as const;

export async function listMyRequests(userId: string, db: PrismaClient = defaultDb): Promise<RequestListItem[]> {
  const rows = await db.request.findMany({
    where: { requesterId: userId },
    orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      title: true,
      category: true,
      amount: true,
      status: true,
      submittedAt: true,
      reviewer: USER_REF,
    },
  });
  return rows.map((r) => ({ ...r, amount: r.amount.toFixed(2), submittedAt: r.submittedAt.toISOString() }));
}

// Returns null when the request does not exist or the user may not read it.
// The access rule is part of the query, so another user's request is never loaded.
export async function findReadableRequest(
  userId: string,
  requestId: string,
  db: PrismaClient = defaultDb,
): Promise<RequestDetail | null> {
  const r = await db.request.findFirst({
    where: { id: requestId, OR: [{ requesterId: userId }, { reviewerId: userId }] },
    include: {
      requester: USER_REF,
      reviewer: USER_REF,
      history: {
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        include: { actor: USER_REF },
      },
    },
  });
  if (!r) return null;
  return {
    id: r.id,
    title: r.title,
    category: r.category,
    amount: r.amount.toFixed(2),
    description: r.description,
    status: r.status,
    submittedAt: r.submittedAt.toISOString(),
    requester: r.requester,
    reviewer: r.reviewer,
    history: r.history.map((h) => ({
      id: h.id,
      action: h.action,
      fromStatus: h.fromStatus,
      toStatus: h.toStatus,
      reason: h.reason,
      createdAt: h.createdAt.toISOString(),
      actor: h.actor,
    })),
  };
}
