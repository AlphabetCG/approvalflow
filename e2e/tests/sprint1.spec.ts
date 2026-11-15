// Sprint 1 journeys (docs/sprints/sprint-1/E2E.md).
import { expect, test } from "@playwright/test";
import { signIn, signOut, submitRequest, uniqueTitle } from "./helpers";

const REQUESTER = "req.eng1@example.com";

test("E2E-01: requester submits, the assigned reviewer approves, the requester sees it", async ({ page }) => {
  const title = uniqueTitle("approve");

  await signIn(page, REQUESTER);
  const reviewer = await submitRequest(page, title);
  expect(reviewer).toMatch(/^rev\.eng\d@example\.com$/); // same department (D-01)
  await signOut(page);

  await signIn(page, reviewer);
  await page.getByRole("link", { name: "Review queue" }).click();
  await page.getByRole("link", { name: title }).click();
  await page.getByLabel("Comment or reason").fill("Budget checked, approved.");
  await page.getByRole("button", { name: "Approve" }).click();
  await expect(page.getByText("Request approved.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Decision" })).toHaveCount(0);
  await page.getByRole("link", { name: "Review queue" }).click();
  await expect(page.getByRole("link", { name: title })).toHaveCount(0);
  await signOut(page);

  await signIn(page, REQUESTER);
  await page.getByRole("link", { name: "My requests" }).click();
  const row = page.getByRole("row").filter({ hasText: title });
  await expect(row).toContainText("APPROVED");
  await row.getByRole("link", { name: title }).click();
  const history = page.getByRole("region", { name: "History" });
  await expect(history).toContainText("Submitted");
  await expect(history).toContainText("Approved");
  await expect(history).toContainText("Comment: Budget checked, approved.");
});

test("E2E-02: a short reject reason is refused, a valid one rejects the request", async ({ page }) => {
  const title = uniqueTitle("reject");

  await signIn(page, REQUESTER);
  const reviewer = await submitRequest(page, title);
  await signOut(page);

  await signIn(page, reviewer);
  await page.getByRole("link", { name: "Review queue" }).click();
  await page.getByRole("link", { name: title }).click();
  const reason = page.getByLabel("Comment or reason");
  await reason.fill("short");
  await page.getByRole("button", { name: "Reject" }).click();
  await expect(page.getByText("A rejection needs a reason of at least 10 characters")).toBeVisible();
  await expect(page.getByRole("region", { name: "Request details" })).toContainText("SUBMITTED");

  await reason.fill("Please attach the ticket receipt.");
  await page.getByRole("button", { name: "Reject" }).click();
  await expect(page.getByText("Request rejected.")).toBeVisible();
  await signOut(page);

  await signIn(page, REQUESTER);
  await page.getByRole("link", { name: "My requests" }).click();
  await page.getByRole("link", { name: title }).click();
  await expect(page.getByRole("region", { name: "Request details" })).toContainText("REJECTED");
  await expect(page.getByRole("region", { name: "History" })).toContainText("Reason: Please attach the ticket receipt.");
});

test("E2E-03: a requester cannot use the review queue or open someone else's request", async ({ page, request }) => {
  // Find a request that belongs to another user (a seeded FINANCE request) through the API.
  const login = await request.post("/api/auth/login", {
    data: { email: "req.fin1@example.com", password: "e2e-demo-password" },
  });
  expect(login.ok()).toBeTruthy();
  const mine = await (await request.get("/api/requests/mine")).json();
  const othersId: string = mine.requests[0].id;

  await signIn(page, REQUESTER);
  await expect(page.getByRole("link", { name: "Review queue" })).toHaveCount(0);

  await page.goto("/reviews");
  await expect(page.getByRole("alert")).toContainText("Requires role REVIEWER");
  await expect(page.getByRole("table")).toHaveCount(0);

  await page.goto(`/requests/${othersId}`);
  await expect(page.getByText("Request not found.")).toBeVisible();
});

test("E2E-04: signing out ends the session, also after a reload", async ({ page }) => {
  await signIn(page, REQUESTER);
  await signOut(page);
  await page.reload();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign out" })).toHaveCount(0);
});
