// Response shapes of the request API (contracts F-02 and F-03).

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

// F-04: one row of GET /api/reviews/queue.
export interface QueueItem {
  id: string;
  title: string;
  category: string;
  amount: string;
  submittedAt: string;
  requester: UserRef;
}

// F-04: response of POST /api/requests/:id/approve and /reject.
export interface Decision {
  id: string;
  status: string;
  decision: HistoryEntry;
}
