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
| FR-06 | F-04 | 1 | AC-04-2, AC-04-3 | T-04-13 | (needs F-03 on `staging`) | _not run_ | |
| FR-05, FR-06 | F-04 | 1 | UI | T-04-14+ | F-04b (#6) | _not written_ | |
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

Do not mark a row PASS until the test has run on the stated commit.
