# Traceability Matrix

Requirement → feature → sprint → acceptance criterion → planned test → actual test → result and commit.

| Requirement | Feature | Sprint | AC | Planned test | Actual test file / name | Result | Commit |
|---|---|---|---|---|---|---|---|
| FR-01 | F-01 | 1 | AC-01-1, AC-01-8 | T-01-04, T-01-11 | `server/tests/auth.int.test.ts` (POST /api/auth/login) | PASS (API + DB) | 6cd4f46 |
| FR-01 | F-01 | 1 | AC-01-2, AC-01-3 | T-01-05, T-01-06 | `server/tests/auth.int.test.ts` (POST /api/auth/login) | PASS (API + DB) | 6cd4f46 |
| FR-01 | F-01 | 1 | AC-01-5 | T-01-08 | `server/tests/auth.int.test.ts` (POST /api/auth/logout) | PASS (API + DB) | 6cd4f46 |
| FR-01 | F-01 | 1 | AC-01-9 | T-01-13, T-01-14, T-01-15 | `client/src/App.test.tsx` (App authentication) | PASS (component) | 597e88b |
| FR-01 | F-01 | 1 | AC-01-10 | T-01-12 | `server/tests/auth.int.test.ts` (seedDemoUsers) | PASS (API + DB) | 6cd4f46 |
| NFR-01 | F-01 | 1 | AC-01-4 | T-01-07 | `server/tests/auth.int.test.ts` (GET /api/auth/me) | PASS (API + DB) | 6cd4f46 |
| NFR-01 | F-01 | 1 | AC-01-6 | T-01-09 | `server/tests/auth.int.test.ts` (requireRole) | PASS (API + DB) | 6cd4f46 |
| NFR-02 | F-01 | 1 | AC-01-7 | T-01-01, T-01-02, T-01-10 | `server/tests/auth.test.ts`; `server/tests/auth.int.test.ts` (stored credentials) | PASS (unit, API + DB) | 6cd4f46 |
| – (D-05, D-06) | F-01 | 1 | – | T-01-03 | `server/tests/auth.test.ts` (session cookie options) | PASS (unit) | 6cd4f46 |
| FR-01 | F-01 | 1 | AC-01-11 | T-01-16 | `client/src/App.test.tsx` (App session edge cases, sign out fails) | PASS (component) | 2a54443 |
| FR-01 | F-01 | 1 | AC-01-12 | T-01-17 | `client/src/App.test.tsx` (App session edge cases, login 5xx) | PASS (component) | 2a54443 |
| NFR-01 | F-01 | 1 | AC-01-13 | T-01-18, T-01-19 | `client/src/App.test.tsx` (App session edge cases, 401) | PASS (component) | 2a54443 |
| NFR-01 | F-01 | 1 | AC-01-14 | T-01-20, T-01-21 | `server/tests/auth.int.test.ts` (session cleanup) | PASS (API + DB) | 31036a1 |
| FR-01 | F-01 | 1 | AC-01-2 | T-01-22 | `server/tests/auth.test.ts` (dummy hash for unknown emails) | PASS (unit) | 31036a1 |
| FR-05 | F-04 | 1 | AC-04-1 | T-04-04 | `server/tests/decisions.int.test.ts` (GET /api/reviews/queue) | PASS (API + DB) | 28cfccd |
| FR-06 | F-04 | 1 | AC-04-2, AC-04-3 | T-04-05, T-04-06 | `server/tests/decisions.int.test.ts` (approve / reject) | PASS (API + DB) | 28cfccd |
| FR-07 | F-04 | 1 | AC-04-2, AC-04-3 | T-04-05, T-04-06 | `server/tests/decisions.int.test.ts` (history row per decision) | PASS (API + DB) | 28cfccd |
| BR-01 | F-04 | 1 | AC-04-5 | T-04-08 | `server/tests/decisions.int.test.ts` (own request) | PASS (API + DB) | 28cfccd |
| BR-02 | F-04 | 1 | AC-04-8 | T-04-01, T-04-11 | `server/tests/decisions.test.ts` (nextStatus); `server/tests/decisions.int.test.ts` (409 cases) | PASS (unit, API + DB) | 28cfccd |
| BR-03 | F-04 | 1 | AC-04-4 | T-04-02, T-04-03, T-04-07 | `server/tests/decisions.test.ts` (validateDecision); `server/tests/decisions.int.test.ts` (400 cases) | PASS (unit, API + DB) | 28cfccd |
| BR-06 | F-04 | 1 | AC-04-8, AC-04-9 | T-04-11, T-04-12 | `server/tests/decisions.int.test.ts` (one decision row) | PASS (API + DB) | 28cfccd |
| BR-07 | F-04 | 1 | AC-04-9 | T-04-12 | `server/tests/decisions.int.test.ts` (simultaneous approvals, forced overlap) | PASS (API + DB) | 28cfccd |
| NFR-03 | F-04 | 1 | AC-04-6, AC-04-7 | T-04-09, T-04-10 | `server/tests/decisions.int.test.ts` (404 / 403 / 401) | PASS (API + DB) | 28cfccd |
| NFR-03, D-13 | F-04 | 1 | AC-04-6 | T-04-23 | `server/tests/decisions.int.test.ts` (unassigned reviewer, approve and reject, same and other department; Lab 6 controlled defect exercise) | FAIL on defect `db65815`; PASS after the fix | 9715c6e |
| BR-08 (CR-01 #45) | F-04 | 1 (changed, Lab 7) | AC-04-13 | T-04-24, T-04-25, T-04-26 | `server/tests/decisions.test.ts` (requiresApproveComment), `server/tests/decisions.int.test.ts` (20,000.01 / 20,000.00) | T-04-25 FAIL on `b72d0cc` (RED); PASS on `782d2ab` (API + DB, unit) | 782d2ab |
| BR-08, D-13 | F-04 | 1 (changed, Lab 7) | AC-04-14 | T-04-27 | `server/tests/decisions.int.test.ts` (404 / 403 / 409 first) | PASS before and after (guard) | 782d2ab |
| BR-08, FR-06 | F-04 | 1 (changed, Lab 7) | AC-04-15, AC-04-2 | T-04-28, T-04-29 | `client/src/requests/RequestDetailPage.decision.test.tsx` (high-value hint and check; 20,000.00) | T-04-28 FAIL on `b72d0cc` (RED); PASS on `782d2ab`; T-04-29 PASS before and after | 782d2ab |
| FR-06 | F-04 | 1 | AC-04-2, AC-04-3 | T-04-13 | No automated test; checked by hand with `curl` on the merge of #14 and #15 (PR #15 review) | PASS (manual) | 805d217 |
| FR-05 | F-04 | 1 | AC-04-10 | T-04-14, T-04-15 | `client/src/reviews/ReviewQueuePage.test.tsx` | PASS (component) | 4d629e9 |
| FR-05 | F-04 | 1 | AC-04-10 | T-04-16 | `client/src/App.test.tsx` (Review queue link by role) | PASS (component) | 4d629e9 |
| FR-06 | F-04 | 1 | AC-04-11 | T-04-17, T-04-18, T-04-22 | `client/src/requests/RequestDetailPage.decision.test.tsx` (who sees the section, reason checks, 400) | PASS (component) | 4d629e9 |
| FR-06, FR-07 | F-04 | 1 | AC-04-12 | T-04-19, T-04-20, T-04-21 | `client/src/requests/RequestDetailPage.decision.test.tsx` (approve, reject, 409 reload) | PASS (component) | 4d629e9 |
| BR-04 | F-02 | 1 | AC-02-2 | T-02-01, T-02-02 | `server/tests/request-validation.test.ts` (amount cases) | PASS (unit) | eb53ec6 |
| BR-04 | F-02 | 1 | AC-02-2 | T-02-09 | `server/tests/requests.int.test.ts` (POST /api/requests, 400 cases) | PASS (API + DB) | eb53ec6 |
| BR-04 | F-02 | 1 | AC-02-2 | T-02-18 | `server/tests/requests.int.test.ts` (Request table constraints) | PASS (DB) | eb53ec6 |
| FR-02 | F-02 | 1 | AC-02-3, AC-02-8 | T-02-03, T-02-04 | `server/tests/request-validation.test.ts` (text, category, body cases) | PASS (unit) | eb53ec6 |
| FR-02 | F-02 | 1 | AC-02-1, AC-02-8 | T-02-08, T-02-14 | `server/tests/requests.int.test.ts` (POST /api/requests) | PASS (API + DB) | eb53ec6 |
| FR-02 | F-02 | 1 | AC-02-9 | T-02-16, T-02-17, T-02-19, T-02-21 | `client/src/requests/NewRequestPage.test.tsx` | PASS (component) | fd315d7 |
| FR-03 | F-02 | 1 | AC-02-5, AC-02-6, AC-02-7 | T-02-05, T-02-06, T-02-07 | `server/tests/assign-reviewer.test.ts` | PASS (unit) | eb53ec6 |
| FR-03 | F-02 | 1 | AC-02-5, AC-02-6, AC-02-7 | T-02-11, T-02-12, T-02-13 | `server/tests/requests.int.test.ts` (POST /api/requests) | PASS (API + DB) | eb53ec6 |
| FR-03 | F-02 | 1 | AC-02-5 | T-02-18 | `server/tests/requests.int.test.ts` (Request table constraints) | PASS (DB) | eb53ec6 |
| FR-03 | F-02 | 1 | AC-02-6 | T-02-20 | `server/tests/requests.int.test.ts` (seedDemoRequests) | PASS (API + DB) | eb53ec6 |
| FR-07 | F-02 | 1 | AC-02-1 | T-02-08, T-02-15 | `server/tests/requests.int.test.ts` (POST /api/requests) | PASS (API + DB) | eb53ec6 |
| BR-06 | F-02 | 1 | AC-02-1 | T-02-08 | `server/tests/requests.int.test.ts` (POST /api/requests) | PASS (API + DB) | eb53ec6 |
| NFR-01 | F-02 | 1 | AC-02-4 | T-02-10 | `server/tests/requests.int.test.ts` (POST /api/requests) | PASS (API + DB) | eb53ec6 |
| FR-04 | F-03 | 1 | AC-03-1, AC-03-2 | T-03-01, T-03-02 | `server/tests/my-requests.int.test.ts` (GET /api/requests/mine) | PASS (API + DB) | f4b33ba |
| FR-04 | F-03 | 1 | AC-03-1, AC-03-2, AC-03-7 | T-03-09, T-03-10, T-03-11, T-03-14 | `client/src/requests/MyRequestsPage.test.tsx`; `client/src/App.test.tsx` (opens My requests) | PASS (component) | 0fbf79f |
| FR-04 | F-03 | 1 | AC-03-3 | T-03-03, T-03-04 | `server/tests/my-requests.int.test.ts` (GET /api/requests/:id) | PASS (API + DB) | f4b33ba |
| FR-04 | F-03 | 1 | AC-03-3, AC-03-4, AC-03-5, AC-03-7 | T-03-12, T-03-13, T-03-15 | `client/src/requests/RequestDetailPage.test.tsx`; `client/src/requests/NewRequestPage.test.tsx` (View request link) | PASS (component) | 0fbf79f |
| FR-07 | F-03 | 1 | AC-03-5 | T-03-07 | `server/tests/my-requests.int.test.ts` (history oldest first) | PASS (API + DB) | f4b33ba |
| NFR-03 | F-03 | 1 | AC-03-4 | T-03-05, T-03-06 | `server/tests/my-requests.int.test.ts` (404 for others and unknown ids) | PASS (API + DB) | f4b33ba |
| NFR-01 | F-03 | 1 | AC-03-6 | T-03-08 | `server/tests/my-requests.int.test.ts` (without a session) | PASS (API + DB) | f4b33ba |
| FR-01..FR-07 | F-01..F-04 | 1 | AC-01-1, AC-02-1, AC-03-3, AC-04-1, AC-04-2, AC-04-11 | E2E-01 | `e2e/tests/sprint1.spec.ts` (approve journey) | PASS (E2E) | ce29a4e |
| BR-03 | F-04 | 1 | AC-04-3, AC-04-4, AC-04-11 | E2E-02 | `e2e/tests/sprint1.spec.ts` (reject journey) | PASS (E2E) | ce29a4e |
| NFR-03 | F-03, F-04 | 1 | AC-03-4, AC-04-7, AC-04-10 | E2E-03 | `e2e/tests/sprint1.spec.ts` (access restrictions) | PASS (E2E) | ce29a4e |
| FR-01 | F-01 | 1 | AC-01-5, AC-01-9 | E2E-04 | `e2e/tests/sprint1.spec.ts` (sign out) | PASS (E2E) | ce29a4e |
| FR-11 | F-08 | 2 | AC-08-1..AC-08-5 | T-08-01..T-08-06 | `server/tests/filters.test.ts`, `server/tests/filters.int.test.ts` | PLANNED (F-08 v1 contract) | – |
| FR-11, NFR-03 | F-08 | 2 | AC-08-6, AC-08-9 | T-08-07, T-08-10 | `server/tests/filters.int.test.ts` | PLANNED (F-08 v1 contract) | – |
| FR-11, FR-05 | F-08 | 2 | AC-08-7 | T-08-08, T-08-09 | `server/tests/filters.int.test.ts` | PLANNED (F-08 v1 contract) | – |
| FR-11, FR-08 | F-08 | 2 | AC-08-8 | T-08-11 | `server/tests/filters.int.test.ts` (after F-05) | PLANNED (F-08 v1 contract) | – |
| FR-11 | F-08 | 2 | AC-08-10 | T-08-12..T-08-17 | `client/src/requests/MyRequestsPage.filters.test.tsx`, `client/src/reviews/ReviewQueuePage.filters.test.tsx` | PLANNED (F-08 v1 contract) | – |

Do not mark a row PASS until the test has run on the stated commit.
