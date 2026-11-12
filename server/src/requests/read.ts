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

export async function listMyRequests(_userId: string, _db: PrismaClient = defaultDb): Promise<RequestListItem[]> {
  throw new Error("Not implemented");
}

// Returns null when the request does not exist or the user may not read it.
export async function findReadableRequest(
  _userId: string,
  _requestId: string,
  _db: PrismaClient = defaultDb,
): Promise<RequestDetail | null> {
  throw new Error("Not implemented");
}
