# Lab 5 Deployment

How ApprovalFlow is built, configured, tested, deployed and released. Updated in each Lab 5 episode; GCP resource names arrive in Ep. 5, the release procedure in Ep. 7.

## Stack and changes from the reference

Reference stack, unchanged: one Docker image (React client built by Vite and served by the Express API), Artifact Registry, Cloud Run, Cloud SQL for PostgreSQL 16, Secret Manager, GitHub Actions with Workload Identity Federation.

Differences from the Starter Kit (TokTickIT):

| Kit | ApprovalFlow | Why |
|---|---|---|
| Resource names `toktickit*` | `approvalflow*` | Our app |
| Secret `ADMIN_PASSWORD` | Not used | No admin account in Sprint 1 (D-09); demo users only |
| Secret `DEMO_USER_PASSWORD` + `SEED_DEMO_DATA` flag | `DEMO_USER_PASSWORD` only | The seed creates demo users only when it is set |
| Smoke test reads `/api/categories` | Reads `/api/health`, `/api/ready` and an unauthenticated `/api/auth/me` (401) | Our API has no categories endpoint |

## Cloud-readiness check (Ep. 2)

| Point | Status | Where |
|---|---|---|
| 1. Uploaded files not kept in the container | Not applicable: the app has no uploads | – |
| 2. Seed safe for production | OK: demo passwords only from `DEMO_USER_PASSWORD`, never in code; without it no users are created; rerun-safe | `server/src/seed/demo-users.ts`, `demo-requests.ts` |
| 3. No dev shortcuts | OK: no user or role selector, no default password on the login page | `client/src/auth/LoginPage.tsx` |
| 4. Sessions in the database | OK: `Session` table, cookie holds a random token, DB holds its SHA-256 | `server/src/auth/session.ts` |
| 5. Port from `PORT`, all interfaces | OK: `PORT` (default 3000), binds `0.0.0.0` | `server/src/config.ts`, `server/src/index.ts` |
| 6. `/api/ready` | OK: 200 `{"db":"connected"}`, 503 when the database is unreachable | `server/src/app.ts` |

## Environment variables

Every setting comes from the environment. Examples: `server/.env.example`, `server/.env.test.example`, `client/.env.example`. Real values are never committed.

| Variable | Read by | Purpose | Secret? | Local value from | Cloud value from |
|---|---|---|---|---|---|
| `DATABASE_URL` | Prisma | PostgreSQL connection string | **Yes** | `server/.env` | Secret Manager |
| `DEMO_USER_PASSWORD` | Seed | Password of all demo users (8+ chars); unset = no demo users | **Yes** | `server/.env` | Secret Manager (migrate job only) |
| `PORT` | Server | HTTP port (default 3000) | No | `server/.env` | Set by Cloud Run |
| `NODE_ENV` | Server | `production` makes the session cookie `Secure` | No | Unset (development) | Dockerfile (`production`) |
| `SESSION_TTL_HOURS` | Server | Session length in hours (default 8, D-06) | No | Optional | Default |
| `CORS_ORIGIN` | Server | Allowed origins, comma-separated; only when the client is on another origin | No | Optional | Unset (same origin) |
| `CLIENT_DIST` | Server | Folder of the built client (default `../client/dist`) | No | Default | Default (`/app/client/dist` in the image) |
| `VITE_API_URL` | Client build | API base URL; empty = same origin | No | `client/.env` (empty) | Empty at build time |
| `DB_PORT` | `compose.dev.yml` | Host port of the dev database (default 5433) | No | Root `.env` (optional) | – |
| `TEST_DB_HOSTS`, `E2E_DATABASE_URL` | Tests only | Allowed test DB hosts; E2E database | No | Optional | CI workflow |

## Commands

From the repository root. Requires Node.js 24 and Docker.

| Task | Command |
|---|---|
| Start the dev database | `docker compose -f compose.dev.yml up -d` |
| Install | `(cd server && npm ci) && (cd client && npm ci)` |
| Migrate (dev) | `cd server && npx prisma migrate dev` |
| Migrate (production / CI) | `cd server && npx prisma migrate deploy` |
| Seed (needs `DEMO_USER_PASSWORD`) | `cd server && npm run prisma:seed` |
| Run (dev) | `cd server && npm run dev` and `cd client && npm run dev` |
| Test | `(cd server && npm test) && (cd client && npm test) && (cd e2e && npm run test:e2e)` |
| Build | `(cd client && npm run build) && (cd server && npm run build)` |

## GCP project and resources

Project ID `cpe334-approvalflow-10151028`. Region, resource names and URL: added in Ep. 5.

## Release procedure

Added in Ep. 7 (deploy workflow). Sprint 1 release: `v0.1.0` = `963b30e` on `main` (PR #18).
