# Sprint 1 end-to-end tests (Issue #7)

**Covers:** F-01 to F-04 together, through the real UI, API and PostgreSQL
**Version history:** v1 (2026-11-15, Member A) – initial

## Set-up

- Tool: Playwright (Chromium), in `e2e/`. Run with `npm run test:e2e` from `e2e/` (see README).
- Database: the local test database `approvalflow_test` (same guard as the API tests: name ends in `_test`, host is local). Before the run it is migrated, emptied, and seeded with the demo users and sample requests (`npm run prisma:seed`). The demo password used here is a throwaway test value set in `e2e/playwright.config.ts`.
- Server: the real Express server on port 3100, serving the built React app, exactly as in production (one origin, cookie session).
- Each test creates its own request with a unique title, so the tests do not depend on each other.

## Journeys

| Test ID | Requirements / AC | Journey | Expected result |
|---|---|---|---|
| E2E-01 | FR-01..FR-07; AC-01-1, AC-02-1, AC-03-3, AC-04-1, AC-04-2, AC-04-11 | Requester `req.eng1` signs in, submits a request, sees the assigned reviewer, signs out. That reviewer signs in, finds the request in the Review queue, approves with a comment. The requester signs in again and opens it from My requests. | Request shows `APPROVED`; history has "Submitted" and "Approved" with the comment. |
| E2E-02 | BR-03; AC-04-3, AC-04-4, AC-04-11 | Same start; the reviewer first tries Reject with a 5-character reason, then with a valid one. | The short reason is refused beside the field and nothing changes; the valid one gives `REJECTED`, and the requester sees "Reason: …". |
| E2E-03 | NFR-03; AC-03-4, AC-04-7, AC-04-10 | Requester `req.eng1` signs in: no "Review queue" link; opens `/reviews` directly; opens a request that belongs to `req.fin1`. | The queue page shows the API's 403 message and no requests; the other user's request shows "Request not found." |
| E2E-04 | AC-01-5, AC-01-9 | Sign in, sign out, then reload. | Back on the login page, still signed out after the reload. |

## Definition of Done

- [x] All four journeys pass on `ce29a4e` (run saved in `e2e-run-ce29a4e.txt`); re-run on the release commit for #8
- [x] `npm run test:e2e` documented in the README
- [x] Traceability updated
