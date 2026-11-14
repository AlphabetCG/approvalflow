import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import ReviewQueuePage from "./ReviewQueuePage";

const json = (status: number, body?: unknown) =>
  ({ ok: status < 400, status, statusText: "", json: async () => body ?? {} }) as Response;

function mockFetch(response: Response) {
  const fetchMock = vi.fn(async () => response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const renderPage = () =>
  render(
    <MemoryRouter>
      <ReviewQueuePage />
    </MemoryRouter>,
  );

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ReviewQueuePage (F-04b)", () => {
  // T-04-14 (AC-04-10)
  it("shows one row per waiting request, linking to its detail", async () => {
    const fetchMock = mockFetch(
      json(200, {
        requests: [
          {
            id: "r1",
            title: "Conference travel",
            category: "TRAVEL",
            amount: "4500.00",
            submittedAt: "2026-11-11T09:00:00.000Z",
            requester: { id: "u1", email: "anan@example.com", name: "Anan" },
          },
          {
            id: "r2",
            title: "New laptop",
            category: "EQUIPMENT",
            amount: "29990.50",
            submittedAt: "2026-11-12T09:00:00.000Z",
            requester: { id: "u3", email: "bee@example.com", name: "Bee" },
          },
        ],
      }),
    );
    renderPage();

    const rows = await screen.findAllByRole("row");
    expect(rows).toHaveLength(3); // header + 2
    expect(within(rows[1]).getByRole("link", { name: "Conference travel" })).toHaveAttribute("href", "/requests/r1");
    expect(rows[1]).toHaveTextContent("Anan");
    expect(rows[1]).toHaveTextContent("Travel");
    expect(rows[1]).toHaveTextContent("4,500.00");
    expect(within(rows[2]).getByRole("link", { name: "New laptop" })).toHaveAttribute("href", "/requests/r2");
    expect(rows[2]).toHaveTextContent("29,990.50");
    expect(fetchMock).toHaveBeenCalledWith("/api/reviews/queue", expect.objectContaining({ method: "GET" }));
  });

  // T-04-15 (AC-04-10)
  it("says there is nothing to review when the queue is empty", async () => {
    mockFetch(json(200, { requests: [] }));
    renderPage();
    expect(await screen.findByText("Nothing to review.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  // T-04-15 (AC-04-10)
  it("shows the API message when the queue cannot be loaded", async () => {
    mockFetch(json(500, { error: "INTERNAL_ERROR", message: "Unexpected server error" }));
    renderPage();
    expect(await screen.findByRole("alert")).toHaveTextContent("Unexpected server error");
  });
});
