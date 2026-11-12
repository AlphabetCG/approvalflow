import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const alice = {
  id: "u1",
  email: "alice@example.com",
  name: "Alice",
  role: "REQUESTER",
  department: "ENGINEERING",
};

const json = (status: number, body?: unknown) =>
  ({ ok: status < 400, status, statusText: "", json: async () => body ?? {} }) as Response;

// Route fetch calls by "METHOD path" to queued responses.
function mockApi(routes: Record<string, Response[]>) {
  const calls: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const key = `${init?.method ?? "GET"} ${url}`;
      calls.push(key);
      const queue = routes[key];
      if (!queue?.length) throw new Error(`Unexpected request ${key}`);
      return queue.length > 1 ? queue.shift()! : queue[0];
    }),
  );
  return calls;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("App authentication (F-01)", () => {
  // T-01-13 (AC-01-9)
  it("shows the login form when not signed in", async () => {
    mockApi({ "GET /api/auth/me": [json(401, { error: "UNAUTHENTICATED", message: "Sign in required" })] });
    render(<App />);
    expect(await screen.findByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  // T-01-14 (AC-01-9)
  it("shows the error, keeps the email and clears the password when login fails", async () => {
    mockApi({
      "GET /api/auth/me": [json(401)],
      "POST /api/auth/login": [
        json(401, { error: "INVALID_CREDENTIALS", message: "Email or password is incorrect" }),
      ],
    });
    render(<App />);
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("Email"), "alice@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Email or password is incorrect");
    expect(screen.getByLabelText("Email")).toHaveValue("alice@example.com");
    expect(screen.getByLabelText("Password")).toHaveValue("");
  });

  it("tells the user when the server cannot be reached", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url === "/api/auth/me") return json(401);
        throw new TypeError("Failed to fetch");
      }),
    );
    render(<App />);
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("Email"), "alice@example.com");
    await user.type(screen.getByLabelText("Password"), "whatever-123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Cannot reach the server. Try again.");
  });

  // T-01-15 (AC-01-9)
  it("shows the user after login and returns to the login form after sign out", async () => {
    const calls = mockApi({
      "GET /api/auth/me": [json(401)],
      "POST /api/auth/login": [json(200, { user: alice })],
      "POST /api/auth/logout": [json(204)],
    });
    render(<App />);
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("Email"), "alice@example.com");
    await user.type(screen.getByLabelText("Password"), "right-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Requester")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Sign out" }));
    expect(await screen.findByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(calls).toContain("POST /api/auth/logout");
  });

  // F-02: the header links to the new request form.
  it("opens the New request form from the header", async () => {
    mockApi({ "GET /api/auth/me": [json(200, { user: alice })] });
    render(<App />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("link", { name: "New request" }));
    expect(await screen.findByRole("heading", { name: "New request" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit request" })).toBeInTheDocument();
  });

  it("skips the login form when a session already exists", async () => {
    mockApi({ "GET /api/auth/me": [json(200, { user: { ...alice, name: "Bob", role: "REVIEWER" } })] });
    render(<App />);
    expect(await screen.findByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Reviewer")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sign in" })).not.toBeInTheDocument();
  });
});

describe("App session edge cases (F-01 v2)", () => {
  afterEach(() => {
    window.history.pushState({}, "", "/");
  });

  // T-01-16 (AC-01-11)
  it.each([
    ["the API answers 500", () => json(500, { error: "INTERNAL_ERROR", message: "Unexpected server error" })],
    [
      "the network fails",
      () => {
        throw new TypeError("Failed to fetch");
      },
    ],
  ])("stays signed in and says so when sign out fails because %s", async (_name, logoutResponse) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url === "/api/auth/me") return json(200, { user: alice });
        if (url === "/api/auth/logout" && init?.method === "POST") return logoutResponse();
        throw new Error(`Unexpected request ${url}`);
      }),
    );
    render(<App />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Sign out" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Sign out failed. Try again.");
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sign in" })).not.toBeInTheDocument();
  });

  // T-01-17 (AC-01-12)
  it("shows the cannot-reach message when login answers 5xx", async () => {
    mockApi({
      "GET /api/auth/me": [json(401)],
      "POST /api/auth/login": [json(500, { error: "INTERNAL_ERROR", message: "Unexpected server error" })],
    });
    render(<App />);
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("Email"), "alice@example.com");
    await user.type(screen.getByLabelText("Password"), "right-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Cannot reach the server. Try again.");
  });

  // T-01-18 (AC-01-13)
  it("returns to the login page when a page's API call answers 401", async () => {
    window.history.pushState({}, "", "/requests/new");
    mockApi({
      "GET /api/auth/me": [json(200, { user: alice })],
      "POST /api/requests": [json(401, { error: "UNAUTHENTICATED", message: "Sign in required" })],
    });
    render(<App />);
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("Title"), "Conference travel");
    await user.selectOptions(screen.getByLabelText("Category"), "TRAVEL");
    await user.type(screen.getByLabelText("Amount (THB)"), "1500");
    await user.type(screen.getByLabelText("Description"), "Train tickets");
    await user.click(screen.getByRole("button", { name: "Submit request" }));

    expect(await screen.findByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByText("Your session has ended. Please sign in again.")).toBeInTheDocument();
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
  });

  // T-01-19 (AC-01-13): login's own 401 means wrong credentials, not a session end.
  it("does not treat a failed login as a session end", async () => {
    mockApi({
      "GET /api/auth/me": [json(401)],
      "POST /api/auth/login": [
        json(401, { error: "INVALID_CREDENTIALS", message: "Email or password is incorrect" }),
      ],
    });
    render(<App />);
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("Email"), "alice@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Email or password is incorrect");
    expect(screen.queryByText("Your session has ended. Please sign in again.")).not.toBeInTheDocument();
  });

  it("does not show the session-ended message on first load when nobody is signed in", async () => {
    mockApi({ "GET /api/auth/me": [json(401)] });
    render(<App />);
    expect(await screen.findByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.queryByText("Your session has ended. Please sign in again.")).not.toBeInTheDocument();
  });
});
