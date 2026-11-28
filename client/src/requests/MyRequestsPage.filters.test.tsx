// F-08: filter bar on My requests and the Review queue (contract docs/sprints/sprint-2/F-08.md v1.1, AC-08-10).
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import ReviewQueuePage from "../reviews/ReviewQueuePage";
import MyRequestsPage from "./MyRequestsPage";

const json = (status: number, body?: unknown) =>
  ({ ok: status < 400, status, statusText: "", json: async () => body ?? {} }) as Response;

const chai = { id: "u2", email: "chai@example.com", name: "Chai" };
const approvedTravel = {
  id: "r1",
  title: "Conference travel",
  category: "TRAVEL",
  amount: "4500.00",
  status: "APPROVED",
  submittedAt: "2026-11-12T09:00:00.000Z",
  reviewer: chai,
};

// Answers by URL; every call is recorded so a test can check the query string.
function mockApi(answer: (url: string) => Response) {
  const urls: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      urls.push(url);
      return answer(url);
    }),
  );
  return urls;
}

function Url() {
  const { pathname, search } = useLocation();
  return <output aria-label="url">{pathname + search}</output>;
}

const renderAt = (entry: string, page = <MyRequestsPage />) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      {page}
      <Url />
    </MemoryRouter>,
  );

const url = () => screen.getByRole("status", { name: "url" });
const select = (name: string) => screen.getByRole("combobox", { name });
const date = (name: string) => screen.getByLabelText(name);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("MyRequestsPage filters (F-08)", () => {
  // T-08-12 (AC-08-10)
  it("shows the filters from the URL and sends them to the API", async () => {
    const urls = mockApi(() => json(200, { requests: [approvedTravel] }));
    renderAt("/requests?status=APPROVED&category=TRAVEL");

    expect(await screen.findByRole("link", { name: "Conference travel" })).toBeInTheDocument();
    expect(select("Status")).toHaveValue("APPROVED");
    expect(select("Category")).toHaveDisplayValue("Travel");
    expect(urls).toEqual(["/api/requests/mine?status=APPROVED&category=TRAVEL"]);
    expect(screen.getByText("Results: 1")).toBeInTheDocument();
  });

  // T-08-13 (AC-08-10)
  it("refuses From after To without calling the API", async () => {
    const urls = mockApi(() => json(200, { requests: [approvedTravel] }));
    renderAt("/requests");
    await screen.findByRole("link", { name: "Conference travel" });

    fireEvent.change(date("From"), { target: { value: "2026-11-21" } });
    fireEvent.change(date("To"), { target: { value: "2026-11-20" } });
    await userEvent.setup().click(screen.getByRole("button", { name: "Apply" }));

    expect(date("To")).toHaveAccessibleDescription("To must not be before From");
    expect(urls).toEqual(["/api/requests/mine"]);
    expect(url()).toHaveTextContent(/^\/requests$/);
  });

  // T-08-14 (AC-08-10)
  it("puts the filters in the URL on Apply and removes them on Clear", async () => {
    const urls = mockApi(() => json(200, { requests: [approvedTravel] }));
    renderAt("/requests");
    const user = userEvent.setup();
    await screen.findByRole("link", { name: "Conference travel" });

    await user.selectOptions(select("Status"), "REJECTED");
    await user.click(screen.getByRole("button", { name: "Apply" }));

    await waitFor(() => expect(urls).toEqual(["/api/requests/mine", "/api/requests/mine?status=REJECTED"]));
    expect(url()).toHaveTextContent(/^\/requests\?status=REJECTED$/);

    await user.click(screen.getByRole("button", { name: "Clear" }));

    await waitFor(() => expect(urls).toHaveLength(3));
    expect(urls[2]).toBe("/api/requests/mine");
    expect(url()).toHaveTextContent(/^\/requests$/);
    expect(select("Status")).toHaveValue("");
  });

  // T-08-15 (AC-08-10)
  it("tells an empty filtered result apart from having no requests", async () => {
    mockApi(() => json(200, { requests: [] }));
    renderAt("/requests?category=TRAINING");

    expect(await screen.findByText("No requests match these filters.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Clear filters" })).toHaveAttribute("href", "/requests");
    expect(screen.queryByText(/You have not submitted any requests yet/)).not.toBeInTheDocument();
  });

  // T-08-15 (AC-08-10) — without filters the F-03 text is unchanged.
  it("keeps the F-03 empty text without filters", async () => {
    mockApi(() => json(200, { requests: [] }));
    renderAt("/requests");

    expect(await screen.findByText(/You have not submitted any requests yet\./)).toBeInTheDocument();
    expect(screen.queryByText("No requests match these filters.")).not.toBeInTheDocument();
  });

  // T-08-16 (AC-08-10)
  it("shows every message of a 400 and keeps the controls", async () => {
    mockApi(() =>
      json(400, {
        error: "VALIDATION_ERROR",
        message: "Status must be one of: SUBMITTED; Category must be one of: TRAVEL",
        details: [
          { field: "status", message: "Status must be one of: SUBMITTED" },
          { field: "category", message: "Category must be one of: TRAVEL" },
        ],
      }),
    );
    renderAt("/requests?status=APPROVED&category=TRAVEL");

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Status must be one of: SUBMITTED");
    expect(alert).toHaveTextContent("Category must be one of: TRAVEL");
    expect(select("Status")).toHaveValue("APPROVED");
    expect(select("Category")).toHaveValue("TRAVEL");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});

describe("ReviewQueuePage filters (F-08)", () => {
  // T-08-17 (AC-08-7, AC-08-10)
  it("filters the queue by category, without a Status control", async () => {
    const urls = mockApi((u) =>
      u === "/api/reviews/queue"
        ? json(200, {
            requests: [{ ...approvedTravel, category: "SUPPLIES", requester: chai, status: undefined }],
          })
        : json(200, { requests: [] }),
    );
    renderAt("/reviews", <ReviewQueuePage />);
    const user = userEvent.setup();
    await screen.findByRole("link", { name: "Conference travel" });

    expect(screen.queryByRole("combobox", { name: "Status" })).not.toBeInTheDocument();
    await user.selectOptions(select("Category"), "TRAVEL");
    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(await screen.findByText("No requests match these filters.")).toBeInTheDocument();
    expect(urls).toEqual(["/api/reviews/queue", "/api/reviews/queue?category=TRAVEL"]);
    expect(url()).toHaveTextContent(/^\/reviews\?category=TRAVEL$/);
  });
});
