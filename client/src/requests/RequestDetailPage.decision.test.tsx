// F-04b: the Decision section on the detail page (contract F-04 v2, AC-04-11, AC-04-12).
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import RequestDetailPage from "./RequestDetailPage";

const json = (status: number, body?: unknown) =>
  ({ ok: status < 400, status, statusText: "", json: async () => body ?? {} }) as Response;

const anan = { id: "u1", email: "anan@example.com", name: "Anan" };
const chai = { id: "u2", email: "chai@example.com", name: "Chai" };

const submitEntry = {
  id: "h1",
  action: "SUBMIT",
  fromStatus: null,
  toStatus: "SUBMITTED",
  reason: null,
  createdAt: "2026-11-12T09:00:00.000Z",
  actor: anan,
};

const submitted = {
  id: "r1",
  title: "Conference travel",
  category: "TRAVEL",
  amount: "1500.00",
  description: "Train tickets to the conference",
  status: "SUBMITTED",
  submittedAt: "2026-11-12T09:00:00.000Z",
  requester: anan,
  reviewer: chai,
  history: [submitEntry],
};

const decisionBy = (action: string, toStatus: string, reason: string | null) => ({
  id: "r1",
  status: toStatus,
  decision: {
    id: "h2",
    action,
    fromStatus: "SUBMITTED",
    toStatus,
    reason,
    createdAt: "2026-11-12T10:00:00.000Z",
    actor: chai,
  },
});

// Route fetch calls by "METHOD path" to queued responses (the last one repeats).
function mockApi(routes: Record<string, (Response | Promise<Response>)[]>) {
  const calls: { key: string; body: unknown }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const key = `${init?.method ?? "GET"} ${url}`;
      calls.push({ key, body: init?.body ? JSON.parse(init.body as string) : undefined });
      const queue = routes[key];
      if (!queue?.length) throw new Error(`Unexpected request ${key}`);
      return queue.length > 1 ? queue.shift()! : queue[0];
    }),
  );
  return calls;
}

const renderAs = (currentUserId: string) =>
  render(
    <MemoryRouter initialEntries={["/requests/r1"]}>
      <Routes>
        <Route path="/requests/:id" element={<RequestDetailPage currentUserId={currentUserId} />} />
      </Routes>
    </MemoryRouter>,
  );

const decision = () => screen.queryByRole("region", { name: "Decision" });
const field = () => screen.getByLabelText("Comment or reason");
const historyItems = () => within(screen.getByRole("region", { name: "History" })).getAllByRole("listitem");

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("RequestDetailPage decisions (F-04b)", () => {
  // T-04-17 (AC-04-11)
  it("shows the Decision section to the assigned reviewer of a SUBMITTED request", async () => {
    mockApi({ "GET /api/requests/r1": [json(200, submitted)] });
    renderAs(chai.id);

    expect(await screen.findByRole("region", { name: "Decision" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Approve" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Reject" })).toBeEnabled();
  });

  // T-04-17 (AC-04-11)
  it.each([
    ["the requester", anan.id, submitted],
    ["the assigned reviewer of a decided request", chai.id, { ...submitted, status: "REJECTED" }],
  ])("hides the Decision section from %s", async (_who, userId, body) => {
    mockApi({ "GET /api/requests/r1": [json(200, body)] });
    renderAs(userId);

    expect(await screen.findByRole("heading", { level: 1, name: "Conference travel" })).toBeInTheDocument();
    expect(decision()).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
  });

  // T-04-18 (AC-04-11)
  it.each(["", "too short"])("asks for a reason of 10+ characters before rejecting (%j)", async (reason) => {
    const calls = mockApi({ "GET /api/requests/r1": [json(200, submitted)] });
    renderAs(chai.id);
    const user = userEvent.setup();
    await screen.findByRole("region", { name: "Decision" });

    if (reason) await user.type(field(), reason);
    await user.click(screen.getByRole("button", { name: "Reject" }));

    expect(field()).toHaveAccessibleDescription("A rejection needs a reason of at least 10 characters");
    expect(calls.map((c) => c.key)).toEqual(["GET /api/requests/r1"]);
  });

  // T-04-19 (AC-04-12)
  it("approves with a comment, locks the section while waiting, then shows the result", async () => {
    let answer!: (res: Response) => void;
    const calls = mockApi({
      "GET /api/requests/r1": [json(200, submitted)],
      "POST /api/requests/r1/approve": [new Promise<Response>((resolve) => (answer = resolve))],
    });
    renderAs(chai.id);
    const user = userEvent.setup();
    await screen.findByRole("region", { name: "Decision" });

    await user.type(field(), "Fine, small amount");
    await user.click(screen.getByRole("button", { name: "Approve" }));

    expect(field()).toBeDisabled();
    expect(screen.getByRole("button", { name: "Approve" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reject" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Approve" }));
    expect(calls.filter((c) => c.key.startsWith("POST"))).toEqual([
      { key: "POST /api/requests/r1/approve", body: { reason: "Fine, small amount" } },
    ]);

    answer(json(200, decisionBy("APPROVE", "APPROVED", "Fine, small amount")));

    expect(await screen.findByRole("status")).toHaveTextContent("Request approved.");
    expect(screen.getByRole("region", { name: "Request details" })).toHaveTextContent("APPROVED");
    expect(historyItems()).toHaveLength(2);
    expect(historyItems()[1]).toHaveTextContent("Approved");
    expect(historyItems()[1]).toHaveTextContent("SUBMITTED → APPROVED");
    expect(historyItems()[1]).toHaveTextContent("Comment: Fine, small amount");
    expect(decision()).not.toBeInTheDocument();
  });

  it("approves without a comment by sending an empty body", async () => {
    const calls = mockApi({
      "GET /api/requests/r1": [json(200, submitted)],
      "POST /api/requests/r1/approve": [json(200, decisionBy("APPROVE", "APPROVED", null))],
    });
    renderAs(chai.id);
    const user = userEvent.setup();
    await screen.findByRole("region", { name: "Decision" });

    await user.click(screen.getByRole("button", { name: "Approve" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Request approved.");
    expect(calls.find((c) => c.key.startsWith("POST"))?.body).toEqual({});
    expect(historyItems()[1]).not.toHaveTextContent("Comment:");
  });

  // T-04-20 (AC-04-12)
  it("rejects with the trimmed reason", async () => {
    const calls = mockApi({
      "GET /api/requests/r1": [json(200, submitted)],
      "POST /api/requests/r1/reject": [json(200, decisionBy("REJECT", "REJECTED", "Missing the receipt"))],
    });
    renderAs(chai.id);
    const user = userEvent.setup();
    await screen.findByRole("region", { name: "Decision" });

    await user.type(field(), "  Missing the receipt  ");
    await user.click(screen.getByRole("button", { name: "Reject" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Request rejected.");
    expect(calls.find((c) => c.key.startsWith("POST"))).toEqual({
      key: "POST /api/requests/r1/reject",
      body: { reason: "Missing the receipt" },
    });
    expect(screen.getByRole("region", { name: "Request details" })).toHaveTextContent("REJECTED");
    expect(historyItems()[1]).toHaveTextContent("Reason: Missing the receipt");
  });

  // T-04-21 (AC-04-12)
  it("shows the API message on 409 and reloads the request", async () => {
    const calls = mockApi({
      "GET /api/requests/r1": [
        json(200, submitted),
        json(200, { ...submitted, status: "APPROVED", history: [submitEntry, decisionBy("APPROVE", "APPROVED", null).decision] }),
      ],
      "POST /api/requests/r1/approve": [
        json(409, { error: "CONFLICT", message: "This request was decided by someone else" }),
      ],
    });
    renderAs(chai.id);
    const user = userEvent.setup();
    await screen.findByRole("region", { name: "Decision" });

    await user.click(screen.getByRole("button", { name: "Approve" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("This request was decided by someone else");
    expect(await screen.findByText("SUBMITTED → APPROVED")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Request details" })).toHaveTextContent("APPROVED");
    expect(decision()).not.toBeInTheDocument();
    expect(calls.filter((c) => c.key === "GET /api/requests/r1")).toHaveLength(2);
  });

  // T-04-22 (AC-04-11)
  it("shows the API's 400 message beside the field", async () => {
    mockApi({
      "GET /api/requests/r1": [json(200, submitted)],
      "POST /api/requests/r1/reject": [
        json(400, {
          error: "VALIDATION_ERROR",
          message: "Reason must be at most 1000 characters",
          details: [{ field: "reason", message: "Reason must be at most 1000 characters" }],
        }),
      ],
    });
    renderAs(chai.id);
    const user = userEvent.setup();
    await screen.findByRole("region", { name: "Decision" });

    await user.type(field(), "A long enough reason");
    await user.click(screen.getByRole("button", { name: "Reject" }));

    expect(await screen.findByText("Reason must be at most 1000 characters")).toBeInTheDocument();
    expect(field()).toHaveAccessibleDescription("Reason must be at most 1000 characters");
    expect(field()).toHaveValue("A long enough reason");
    expect(field()).toBeEnabled();
  });
});
