import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

function mockFetch(response: Partial<Response> & { json?: () => Promise<unknown> }) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("App", () => {
  it("shows ready when the API reports the database as connected", async () => {
    mockFetch({ ok: true, json: async () => ({ db: "connected" }) });
    render(<App />);
    expect(await screen.findByText("Server and database are ready.")).toBeInTheDocument();
  });

  it("shows an error when the API is unavailable", async () => {
    mockFetch({ ok: false, status: 503, statusText: "Service Unavailable" });
    render(<App />);
    expect(await screen.findByText("Server or database is not reachable.")).toBeInTheDocument();
  });
});
