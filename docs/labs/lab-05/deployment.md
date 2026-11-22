# Lab 5 Deployment

How ApprovalFlow is built, configured, tested, deployed and released. Updated in each Lab 5 episode.

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
| `GCP_PROJECT_ID` | `deploy.yml` | Project to deploy to | No | – | GitHub environment `demo` (variable) |
| `GCP_REGION` | `deploy.yml` | Region of the service, job and registry (`asia-southeast1`) | No | – | GitHub environment `demo` (variable) |
| `WIF_PROVIDER` | `deploy.yml` | Full name of the WIF provider `github-actions/github-main` | No | – | GitHub environment `demo` (variable) |
| `WIF_SERVICE_ACCOUNT` | `deploy.yml` | Deployer account `approvalflow-deployer@…` | No | – | GitHub environment `demo` (variable) |
| `SMOKE_EMAIL` | `smoke_test.py` | Optional login check: account email | No | – | GitHub environment `demo` (variable); **not set** |
| `SMOKE_PASSWORD` | `smoke_test.py` | Optional login check: account password | **Yes** | – | GitHub environment `demo` (secret); **not set** |

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

Created by `deploy/deploy.sh` (Ep. 5) from `main` at `v0.1.1` (`d8002bd`), run in Cloud Shell by the project owner. One setting was changed in the Console afterwards; the table says which.

| Item | Value |
|---|---|
| Project ID | `cpe334-approvalflow-10151028` |
| Region | `asia-southeast1` (Singapore) |
| Public URL | <https://approvalflow-lecxxyja2q-as.a.run.app> |
| Cloud Run service | `approvalflow`: port 3000, 1 vCPU, 512 MiB, min 0 / max 3 instances, public (`--allow-unauthenticated`) |
| Migration job | `approvalflow-migrate` (Cloud Run job, same image): `npx prisma migrate deploy && npm run prisma:seed` |
| Cloud SQL | `approvalflow-pg`: PostgreSQL 16, `db-f1-micro`, Enterprise edition, 10 GB SSD, **storage auto-increase off** (turned off in the Console after `deploy.sh`, which leaves it on; checked with `gcloud sql instances describe approvalflow-pg --format="value(settings.storageAutoResize)"` = `False`), daily backup 03:00; database and user `approvalflow` |
| Artifact Registry | Docker repository `approvalflow` |
| Runtime service account | `approvalflow-runner`: Cloud SQL Client (project); Secret Accessor on its two secrets only |
| Secrets (Secret Manager) | `approvalflow-database-url` (service and job), `approvalflow-demo-password` (job only) |

Demo password: read it privately with `gcloud secrets versions access latest --secret=approvalflow-demo-password`; never paste it into Git, Issues, chats or the report.

**Cost:** Cloud SQL is billed for every hour it exists; Cloud Run scales to 0 when idle. An alerts-only budget is set (Ep. 1). Pause or tear down only after grading (Ep. 9–10).

## Release procedure

From Ep. 7, nobody types a deploy command. A merge into `main` starts the workflow **Deploy demo** (`.github/workflows/deploy.yml`).

1. Feature branch from `staging` → PR into `staging` → teammate approves, `test-and-docker` green → merge.
2. Sync `staging` with `main` first if `main` has a merge commit `staging` lacks (the ruleset requires up-to-date branches).
3. Release PR `staging` → `main` → 1 approval + `test-and-docker` green (ruleset `protect-main`) → merge with a merge commit → tag `vX.Y.Z`.
4. **Deploy demo** runs by itself:

| Stage | What happens | Where |
|---|---|---|
| `test` | Reuses `ci-docker.yml` (job `test-and-docker`) | `deploy.yml` |
| Authenticate | Workload Identity Federation as `approvalflow-deployer`; no key | `deploy.yml`, Ep. 6 |
| Build and push | Root `Dockerfile`, tagged with the full commit SHA, to `approvalflow/approvalflow` | `deploy.yml` |
| Verify, migrate, deploy | Resolves the digest, updates and runs `approvalflow-migrate`, then points the service at the digest; no deploy if the migration fails | `deploy/release.sh` |
| Smoke test | `/api/health`, `/api/ready`, `/`, `/requests`, `/api/auth/me` = 401 | `deploy/smoke_test.py` |
| Record | Commit tag, digest and URL in the run summary | `deploy.yml` |

The optional login check (variable `SMOKE_EMAIL` + secret `SMOKE_PASSWORD`) is **not set**, so the smoke step prints `SKIP login`. The guide asks for a dedicated lowest-role account, and the app has no way to create users yet (demo users only, D-09).

**Which commit is running:** the service runs an image by digest (`@sha256:…`), so the Cloud Run console shows no commit SHA. Find it in Cloud Shell:

```bash
# 1. Digest the service runs now
gcloud run services describe approvalflow --region=asia-southeast1   --format='value(spec.template.spec.containers[0].image)'
# 2. Map the digest to its tag (the tag is the full commit SHA)
gcloud artifacts docker images list   asia-southeast1-docker.pkg.dev/cpe334-approvalflow-10151028/approvalflow/approvalflow   --include-tags --filter='version=sha256:<digest from step 1>'
```

The same commit tag and digest are also in the run summary of each **Deploy demo** run (Actions → Deploy demo → run → Summary).

**Rollback:** Actions → Deploy demo → Run workflow on `main` with `image_tag` = the full 40-character SHA of an earlier release. Tests, build and migration are skipped; only the service moves back to that image. Migrations only add tables or columns, so an older image still works.

Releases: `v0.1.0` = `963b30e` (Sprint 1, PR #18), `v0.1.1` = `d8002bd` (Lab 5 Ep. 2–4, PR #25; first deploy from Cloud Shell in Ep. 5).
