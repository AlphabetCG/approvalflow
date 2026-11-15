import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import NewRequestPage from "./NewRequestPage";

const json = (status: number, body?: unknown) =>
  ({ ok: status < 400, status, statusText: "", json: async () => body ?? {} }) as Response;

function mockFetch(...responses: (Response | Promise<Response>)[]) {
  const fetchMock = vi.fn(async () => {
    if (!responses.length) throw new Error("Unexpected request");
    return responses.shift()!;
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Title"), "Conference travel");
  await user.selectOptions(screen.getByLabelText("Category"), "TRAVEL");
  await user.type(screen.getByLabelText("Amount (THB)"), "1500.50");
  await user.type(screen.getByLabelText("Description"), "Train tickets to the conference");
}

const submit = () => screen.getByRole("button", { name: "Submit request" });

// The confirmation links to the new request (F-03), so the form needs a router.
const renderPage = () =>
  render(
    <MemoryRouter>
      <NewRequestPage />
    </MemoryRouter>,
  );

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("NewRequestPage (F-02)", () => {
  // T-02-16 (AC-02-9)
  it("shows a message beside each empty field and does not call the API", async () => {
    const fetchMock = mockFetch();
    renderPage();
    const user = userEvent.setup();

    await user.click(submit());

    expect(screen.getByLabelText("Title")).toHaveAccessibleDescription("Title is required");
    expect(screen.getByLabelText("Category")).toHaveAccessibleDescription("Choose a category");
    expect(screen.getByLabelText("Amount (THB)")).toHaveAccessibleDescription("Amount must be a number");
    expect(screen.getByLabelText("Description")).toHaveAccessibleDescription("Description is required");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["0", "Amount must be greater than 0"],
    ["100000.01", "Amount must be at most 100000"],
    ["1.234", "Amount must have at most 2 decimal places"],
  ])("rejects the amount %s before calling the API", async (amount, message) => {
    const fetchMock = mockFetch();
    renderPage();
    const user = userEvent.setup();
    await fillValid(user);
    await user.clear(screen.getByLabelText("Amount (THB)"));
    await user.type(screen.getByLabelText("Amount (THB)"), amount);

    await user.click(submit());

    expect(screen.getByLabelText("Amount (THB)")).toHaveAccessibleDescription(message);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends the request and shows its status and reviewer", async () => {
    const fetchMock = mockFetch(
      json(201, {
        id: "r1",
        title: "Conference travel",
        category: "TRAVEL",
        amount: "1500.50",
        description: "Train tickets to the conference",
        status: "SUBMITTED",
        submittedAt: "2026-11-11T09:00:00.000Z",
        requester: { id: "u1", email: "alice@example.com" },
        reviewer: { id: "u2", email: "chai@example.com" },
      }),
    );
    renderPage();
    const user = userEvent.setup();
    await fillValid(user);

    await user.click(submit());

    expect(await screen.findByRole("status")).toHaveTextContent(/SUBMITTED/);
    expect(screen.getByRole("status")).toHaveTextContent(/chai@example\.com/);
    // T-03-15 (AC-03-3)
    expect(screen.getByRole("link", { name: "View request" })).toHaveAttribute("href", "/requests/r1");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/requests");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      title: "Conference travel",
      category: "TRAVEL",
      amount: 1500.5,
      description: "Train tickets to the conference",
    });
  });

  it("disables the button while submitting, so a double click sends one request", async () => {
    let answer!: (res: Response) => void;
    const fetchMock = mockFetch(new Promise<Response>((resolve) => (answer = resolve)));
    renderPage();
    const user = userEvent.setup();
    await fillValid(user);

    await user.click(submit());
    expect(submit()).toBeDisabled();
    await user.click(submit());
    expect(fetchMock).toHaveBeenCalledTimes(1);

    answer(json(409, { error: "CONFLICT", message: "No reviewer is available in your department" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(submit()).toBeEnabled();
  });

  // T-02-21 (AC-02-9): an edit made while waiting would be wiped by the reset after success.
  it("locks every field while submitting, so no edit is lost when the form resets", async () => {
    let answer!: (res: Response) => void;
    mockFetch(new Promise<Response>((resolve) => (answer = resolve)));
    renderPage();
    const user = userEvent.setup();
    await fillValid(user);

    await user.click(submit());
    for (const label of ["Title", "Category", "Amount (THB)", "Description"]) {
      expect(screen.getByLabelText(label)).toBeDisabled();
    }
    await user.type(screen.getByLabelText("Title"), " (edited)");
    expect(screen.getByLabelText("Title")).toHaveValue("Conference travel");

    answer(
      json(201, {
        id: "r1",
        title: "Conference travel",
        status: "SUBMITTED",
        amount: "1500.50",
        reviewer: { id: "u2", email: "chai@example.com" },
      }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(/SUBMITTED/);
    expect(screen.getByLabelText("Title")).toBeEnabled();
    expect(screen.getByLabelText("Title")).toHaveValue("");
  });

  // T-02-17 (AC-02-9)
  it("shows the API message on 409 and keeps what the user typed", async () => {
    mockFetch(json(409, { error: "CONFLICT", message: "No reviewer is available in your department" }));
    renderPage();
    const user = userEvent.setup();
    await fillValid(user);

    await user.click(submit());

    expect(await screen.findByRole("alert")).toHaveTextContent("No reviewer is available in your department");
    expect(screen.getByLabelText("Title")).toHaveValue("Conference travel");
    expect(screen.getByLabelText("Category")).toHaveValue("TRAVEL");
    expect(screen.getByLabelText("Amount (THB)")).toHaveValue(1500.5);
    expect(screen.getByLabelText("Description")).toHaveValue("Train tickets to the conference");
  });

  // T-02-19 (AC-02-9)
  it("shows the API's per-field details beside each field", async () => {
    mockFetch(
      json(400, {
        error: "VALIDATION_ERROR",
        message: "Title must be at most 200 characters; Amount must be at most 100000",
        details: [
          { field: "title", message: "Title must be at most 200 characters" },
          { field: "amount", message: "Amount must be at most 100000" },
        ],
      }),
    );
    renderPage();
    const user = userEvent.setup();
    await fillValid(user);

    await user.click(submit());

    expect(await screen.findByLabelText("Title")).toHaveAccessibleDescription(
      "Title must be at most 200 characters",
    );
    expect(screen.getByLabelText("Amount (THB)")).toHaveAccessibleDescription("Amount must be at most 100000");
    expect(screen.getByLabelText("Description")).not.toHaveAccessibleDescription();
  });
});
