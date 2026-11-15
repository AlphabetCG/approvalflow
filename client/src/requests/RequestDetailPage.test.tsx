import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import RequestDetailPage from "./RequestDetailPage";

const json = (status: number, body?: unknown) =>
  ({ ok: status < 400, status, statusText: "", json: async () => body ?? {} }) as Response;

function mockFetch(response: Response | Promise<Response>) {
  const fetchMock = vi.fn(async () => response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const alice = { id: "u1", email: "alice@example.com", name: "Alice" };
const chai = { id: "u2", email: "chai@example.com", name: "Chai" };

const rejected = {
  id: "r1",
  title: "Conference travel",
  category: "TRAVEL",
  amount: "1500.00",
  description: "Train tickets to the conference",
  status: "REJECTED",
  submittedAt: "2026-11-12T09:00:00.000Z",
  requester: alice,
  reviewer: chai,
  history: [
    {
      id: "h1",
      action: "SUBMIT",
      fromStatus: null,
      toStatus: "SUBMITTED",
      reason: null,
      createdAt: "2026-11-12T09:00:00.000Z",
      actor: alice,
    },
    {
      id: "h2",
      action: "REJECT",
      fromStatus: "SUBMITTED",
      toStatus: "REJECTED",
      reason: "Budget for travel is closed this quarter",
      createdAt: "2026-11-12T10:30:00.000Z",
      actor: chai,
    },
  ],
};

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/requests/:id" element={<RequestDetailPage currentUserId="u1" />} />
      </Routes>
    </MemoryRouter>,
  );

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("RequestDetailPage (F-03)", () => {
  // T-03-12 (AC-03-3, AC-03-5)
  it("shows the request and its history oldest first", async () => {
    const fetchMock = mockFetch(json(200, rejected));
    renderAt("/requests/r1");

    expect(await screen.findByRole("heading", { level: 1, name: "Conference travel" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/requests/r1", expect.objectContaining({ method: "GET" }));
    const details = screen.getByRole("region", { name: "Request details" });
    expect(details).toHaveTextContent("REJECTED");
    expect(details).toHaveTextContent("Travel");
    expect(details).toHaveTextContent("1,500.00");
    expect(details).toHaveTextContent("Train tickets to the conference");
    expect(details).toHaveTextContent("Alice");
    expect(details).toHaveTextContent("chai@example.com");

    const history = within(screen.getByRole("region", { name: "History" })).getAllByRole("listitem");
    expect(history).toHaveLength(2);
    expect(history[0]).toHaveTextContent("Submitted");
    expect(history[0]).toHaveTextContent("Alice");
    expect(history[0]).toHaveTextContent("– → SUBMITTED");
    expect(history[1]).toHaveTextContent("Rejected");
    expect(history[1]).toHaveTextContent("Chai");
    expect(history[1]).toHaveTextContent("SUBMITTED → REJECTED");
    expect(history[1]).toHaveTextContent("Reason: Budget for travel is closed this quarter");
    expect(within(history[1]).getByText(/./, { selector: "time" })).toHaveAttribute(
      "datetime",
      "2026-11-12T10:30:00.000Z",
    );
  });

  // T-03-13 (AC-03-4, AC-03-7)
  it("says the request was not found on 404, with no request fields", async () => {
    mockFetch(json(404, { error: "NOT_FOUND", message: "Request not found" }));
    renderAt("/requests/someone-elses");

    expect(await screen.findByText("Request not found.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "My requests" })).toHaveAttribute("href", "/requests");
    expect(screen.queryByRole("region", { name: "Request details" })).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows Loading… while waiting, then the API message on another error", async () => {
    let answer!: (res: Response) => void;
    mockFetch(new Promise<Response>((resolve) => (answer = resolve)));
    renderAt("/requests/r1");

    expect(await screen.findByRole("status")).toHaveTextContent("Loading…");
    answer(json(500, { error: "INTERNAL_ERROR", message: "Unexpected server error" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Unexpected server error");
  });
});
