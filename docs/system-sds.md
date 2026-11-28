# System-Level Software Design Specification

> DRAFT.

## 1. Architecture and stack

Modular monolith in one container:

- **UI:** React SPA (`client/`), built by Vite and served by the Express server in production.
- **API:** Express (`server/src/`), JSON over HTTP under `/api`. All business rules and permission checks run here.
- **Database:** PostgreSQL. Schema and migrations managed by Prisma (`server/prisma/`).

Why: same stack as Labs 1–4, and it matches the Lab 5 Starter Kit (one image on Cloud Run, Cloud SQL for PostgreSQL).

## 2. Data model (proposal)

| Entity | Key fields | Constraints |
|---|---|---|
| User | id, email, passwordHash, role, department | email unique; role in (REQUESTER, REVIEWER, ADMIN) |
| Session | id, userId, expiresAt | stored in the database, not in memory |
| Request | id, requesterId, reviewerId, title, category, amount, description, status, submittedAt, createdAt (F-05) | amount DECIMAL(12,2) > 0; reviewerId ≠ requesterId; F-05: reviewerId and submittedAt are NULL exactly when status = DRAFT; F-07: secondReviewerId (nullable) ≠ requesterId, ≠ reviewerId, set when status = SECOND_REVIEW |
| RequestHistory | id, requestId, actorId, fromStatus, toStatus, action, reason, createdAt | insert only |

_TODO: ER diagram._

## 3. State machine

| From | Action | To | Who |
|---|---|---|---|
| – | submit | SUBMITTED | requester |
| _Sprint 2 (F-05):_ – | create draft | DRAFT | requester |
| _Sprint 2 (F-05):_ DRAFT | edit (no history row, D-22) | DRAFT | requester |
| _Sprint 2 (F-05):_ DRAFT | submit (reviewer assigned now, D-19) | SUBMITTED | requester |
| SUBMITTED | approve | APPROVED | assigned reviewer (not the requester) |
| SUBMITTED | reject (reason) | REJECTED | assigned reviewer (not the requester) |
| _Sprint 2:_ SUBMITTED | return (reason) | RETURNED | assigned reviewer |
| _Sprint 2:_ RETURNED | resubmit | SUBMITTED | requester |
| _Sprint 2 (F-07):_ SUBMITTED | approve, amount > 50,000.00 (D-02) | SECOND_REVIEW (second reviewer assigned, D-35) | stage-1 reviewer |
| _Sprint 2 (F-07):_ SECOND_REVIEW | approve | APPROVED | second reviewer only (D-37) |
| _Sprint 2 (F-07):_ SECOND_REVIEW | reject (reason) | REJECTED | second reviewer only (D-37) |

Any other transition returns 409.

## 4. Role / permission matrix

| Operation | Requester | Reviewer | Admin |
|---|---|---|---|
| Submit request | ✓ | ✓ | – |
| View own requests | ✓ | ✓ | – |
| View assigned requests | – | ✓ (assigned only) | – |
| Approve / reject | – | ✓ (assigned, not own) | – |
| Save, edit, submit own draft (F-05) | ✓ | ✓ | – |
| Second-stage approve / reject (F-07) | – | ✓ (second reviewer only) | – |
| Own decision summary (F-09) | – | ✓ (own decisions only) | – |
| Manage users (Sprint 2) | – | – | ✓ |

Hiding a button in the UI is not authorization; every rule above is enforced in the API.

## 5. API conventions

- JSON request/response; errors as `{ "error": "CODE", "message": "..." }`.
- 400 validation, 401 not signed in, 403 forbidden role, 404 not found or not yours, 409 invalid transition.
- `/api/health` (liveness) and `/api/ready` (database check) are public.
- _Sprint 2 (F-08):_ list filters are optional query parameters on the existing list endpoints; they are AND-ed with the endpoint's access condition, so they can only narrow a list. Dates in filters are Asia/Bangkok calendar days. Bad values give 400 with per-field `details`.

## 6. Authentication

Details and tests: [F-01 contract](sprints/sprint-1/F-01.md).

- **Passwords:** bcrypt, cost 12 (`server/src/auth/password.ts`). A failed login compares against a dummy hash when the email is unknown, so the 401 and its timing do not reveal which accounts exist.
- **Sessions:** stored in the `Session` table, so they survive a redeploy and work across Cloud Run instances. The cookie `af_session` holds 32 random bytes; the table holds only their SHA-256 hash.
- **Cookie:** `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` in production. `SameSite=Lax` plus JSON-only endpoints is the CSRF protection for Sprint 1.
- **Expiry:** 8 hours after login, not extended by activity (`SESSION_TTL_HOURS`). An expired session is rejected and deleted when it is next used.
- **Current user:** `loadSessionUser` runs on every `/api` request and sets `req.user`. `GET /api/auth/me` returns it.
- **Logout:** deletes the session row and clears the cookie. Idempotent (204 even without a session).
- **Enforcement:** routes use `requireAuth` (401) and `requireRole(...)` (403) from `server/src/auth/middleware.ts`. Record ownership checks (own request, assigned reviewer) are done in each feature's handler.

## 7. Configuration and deployment plan

All settings come from environment variables (see `server/.env.example`). Lab 5 plan: Docker image in Artifact Registry, Cloud Run service, Cloud SQL for PostgreSQL, secrets in Secret Manager, GitHub Actions with Workload Identity Federation.
