import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import VersionFooter from "./VersionFooter";

const SHA = "daad8ab52e6e6cc6e65e275fcac0a2992051b3e7";

afterEach(() => vi.unstubAllGlobals());

// #41: testers can see which build is running (Lab 5 R-08, Lab 6 UAT).
describe("VersionFooter", () => {
  it("shows the short commit and the revision, with the full commit on hover", async () => {
    const fetchMock = vi.fn(async () =>
      ({ ok: true, status: 200, json: async () => ({ commit: SHA, revision: "approvalflow-00007-abc" }) }) as Response,
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<VersionFooter />);

    const version = await screen.findByText("Version daad8ab · approvalflow-00007-abc");
    expect(version).toHaveAttribute("title", SHA);
    expect(fetchMock).toHaveBeenCalledWith("/api/version", expect.objectContaining({ method: "GET" }));
  });

  it("shows only the commit when there is no revision (local run)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ commit: "unknown", revision: null }) }) as Response));
    render(<VersionFooter />);
    expect(await screen.findByText("Version unknown")).toBeInTheDocument();
  });

  it("shows nothing when the version cannot be read", async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error("offline");
    });
    vi.stubGlobal("fetch", fetchMock);
    const { container } = render(<VersionFooter />);
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
