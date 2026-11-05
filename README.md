# ApprovalFlow

CPE 334 Group Project, Theme 5: Workflow and Approval System.
Requesters submit requests; assigned reviewers approve, reject, or return them with reasons.

| | |
|---|---|
| Team | _TODO: names, student IDs, GitHub usernames_ |
| Live URL | _TODO after Lab 5 Episode 5_ |
| Current release | _TODO: tag / commit_ |

## Stack

- **Client:** React + TypeScript + Vite (`client/`)
- **Server:** Node.js + Express + TypeScript (`server/`)
- **Database:** PostgreSQL via Prisma ORM (`server/prisma/`)
- **Tests:** Vitest + Supertest (server), Vitest + Testing Library (client)
- **Deployment (Lab 5):** one Docker image serving UI and API, on Cloud Run with Cloud SQL

## Run locally

Requirements: Node.js 24, Docker Desktop (for PostgreSQL).

```bash
docker compose -f compose.dev.yml up -d        # start PostgreSQL on host port 5433
cp server/.env.example server/.env             # placeholders work for local dev
cd server && npm install && npx prisma migrate dev && npm run prisma:seed && npm run dev
```

In a second terminal:

```bash
cd client && npm install && npm run dev        # http://localhost:5173 (proxies /api to :3000)
```

Check: <http://localhost:3000/api/health> and <http://localhost:3000/api/ready>.

## Test and build

Server tests include API/database integration tests. They use a separate database, `approvalflow_test`, which `compose.dev.yml` creates the first time it starts. The test setup wipes that database, and refuses to run on a database whose name lacks `test`.

```bash
cp server/.env.test.example server/.env.test   # once
cd server && npm test && npm run build
cd client && npm test && npm run build
```

If you started the database before `scripts/create-test-db.sql` existed, recreate it once: `docker compose -f compose.dev.yml down -v` and then `up -d`. This deletes local dev data.

## Getting started (teammate)

1. Accept the GitHub invitation, then `git clone https://github.com/AlphabetCG/approvalflow.git`.
2. Follow **Run locally** and **Test and build** above. All tests should pass before you change anything.
3. Pick your Issue on the [project board](https://github.com/users/AlphabetCG/projects/5) and move it to *In Progress*.
4. `git switch staging && git pull`, then `git switch -c feature/<issue>-<short-name>`.
5. Commit the feature contract (`docs/sprints/sprint-1/F-0x.md`) first, then the failing tests, then the implementation.
6. Push and open a PR into `staging` with `Closes #<issue>`. Ask your teammate to review.

Conventions while working in parallel:

- **Errors:** throw `badRequest()`, `unauthorized()`, `forbidden()`, `notFound()` or `conflict()` from `server/src/http.ts`; the error handler returns `{ "error": CODE, "message": "..." }`.
- **Routes:** one router file per feature in `server/src/routes/`, mounted with one line in `server/src/routes/index.ts`.
- **Migrations:** only one person adds a Prisma migration at a time. Pull `staging` right before `npx prisma migrate dev --name <name>`, and merge migration PRs quickly.
- **Integration tests:** call `resetDb()` from `server/tests/helpers/db.ts` in `beforeEach`.

## Team workflow

1. Every task has an Issue (label `lab5` for Lab 5 work) on the project board.
2. Branch from `staging`: `feature/<issue>-<name>` or `fix/<issue>-<name>`.
3. Open a PR into `staging`; the teammate reviews with a specific check, question, or finding. Authors never approve their own PRs.
4. Release: PR from `staging` into `main`, then tag (`v0.1.0`, ...). Only `main` deploys.
5. Write the feature contract (`docs/sprints/sprint-N/`) and commit it **before** the implementation.

Never commit `.env`, passwords, connection strings, or keys. This repository is public.

## Documents

| Document | Path |
|---|---|
| SRS | [docs/srs.md](docs/srs.md) |
| Feature inventory | [docs/features.md](docs/features.md) |
| Traceability | [docs/traceability.md](docs/traceability.md) |
| System-Level SDS | [docs/system-sds.md](docs/system-sds.md) |
| Three-sprint plan | [docs/sprints/plan.md](docs/sprints/plan.md) |
| Sprint 1 contracts | [docs/sprints/sprint-1/](docs/sprints/sprint-1/) |
| Lab 5 deployment | [docs/labs/lab-05/deployment.md](docs/labs/lab-05/deployment.md) |
| AI-use declaration | [docs/ai-use.md](docs/ai-use.md) |
