import { expect, type Page } from "@playwright/test";
import { DEMO_USER_PASSWORD } from "../playwright.config";

export async function signIn(page: Page, email: string): Promise<void> {
  await page.goto("/");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(DEMO_USER_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
}

export async function signOut(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
}

// Submits a request through the form and returns the assigned reviewer's email
// (round-robin, D-01), read from the confirmation.
export async function submitRequest(page: Page, title: string): Promise<string> {
  await page.getByRole("link", { name: "New request" }).click();
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Category").selectOption("TRAVEL");
  await page.getByLabel("Amount (THB)").fill("1250.50");
  await page.getByLabel("Description").fill("E2E: train tickets to the partner office.");
  await page.getByRole("button", { name: "Submit request" }).click();

  const confirmation = page.getByRole("status").filter({ hasText: "Request submitted" });
  await expect(confirmation).toContainText("Status: SUBMITTED");
  // Greedy, so "rev.eng1@example.com." captures the whole address before the final dot.
  const reviewer = (await confirmation.textContent())?.match(/Reviewer: (\S+@\S+)\./)?.[1];
  expect(reviewer, "reviewer email in the confirmation").toBeTruthy();
  return reviewer!;
}

export const uniqueTitle = (label: string) => `E2E ${label} ${Date.now()}`;
