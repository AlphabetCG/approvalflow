import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import MyRequestsPage from "./MyRequestsPage";

const json = (status: number, body?: unknown) =>
  ({ ok: status < 400, status, statusText: "", json: async () => body ?? {} }) as Response;

function mockFetch(response: Response | Promise<Response>) {
  const fetchMock = vi.fn(async () => response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const chai = { id: "u2", email: "chai@example.com", name: "Chai" };

const twoRequests = {
  requests: [
    {
      id: "r2",
      title: "New laptop",
      category: "EQUIPMENT",
      amount: "1500.00",
      status: "SUBMITTED",
      submittedAt: "2026-11-12T09:00:00.000Z",
      reviewer: chai,
    },
    {
      id: "r1",
      title: "Conference travel",
      category: "TRAVEL",
      amount: "100000.00",
      status: "REJECTED",
      submittedAt: "2026-11-10T09:00:00.000Z",
      reviewer: chai,
    },
  ],
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <MyRequestsPage />
    </MemoryRouter>,
  );

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("MyRequestsPage (F-03)", () => {
  // T-03-09 (AC-03-1, AC-03-7)
  it("shows one row per request, with a link to its detail", async () => {
    const fetchMock = mockFetch(json(200, twoRequests));
    renderPage();

    const rows = await screen.findAllByRole("row");
    expect(rows).toHaveLength(3); // header + 2
    expect(within(rows[1]).getByRole("link", { name: "New laptop" })).toHaveAttribute("href", "/requests/r2");
    expect(rows[1]).toHaveTextContent("Equipment");
    expect(rows[1]).toHaveTextContent("1,500.00");
    expect(rows[1]).toHaveTextContent("SUBMITTED");
    expect(rows[1]).toHaveTextContent("Chai");
    expect(within(rows[2]).getByRole("link", { name: "Conference travel" })).toHaveAttribute("href", "/requests/r1");
    expect(rows[2]).toHaveTextContent("100,000.00");
    expect(rows[2]).toHaveTextContent("REJECTED");
    expect(fetchMock).toHaveBeenCalledWith("/api/requests/mine", expect.objectContaining({ method: "GET" }));
  });

  // T-03-10 (AC-03-2, AC-03-7)
  it("says so when there are no requests and links to the form", async () => {
    mockFetch(json(200, { requests: [] }));
    renderPage();

    expect(await screen.findByText(/You have not submitted any requests yet\./)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "New request" })).toHaveAttribute("href", "/requests/new");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  // T-03-11 (AC-03-7)
  it("shows Loading… while waiting, then the API message on an error", async () => {
    let answer!: (res: Response) => void;
    mockFetch(new Promise<Response>((resolve) => (answer = resolve)));
    renderPage();

    expect(await screen.findByRole("status")).toHaveTextContent("Loading…");
    answer(json(500, { error: "INTERNAL_ERROR", message: "Unexpected server error" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Unexpected server error");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
