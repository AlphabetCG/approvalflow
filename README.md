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

### Demo accounts

The seed creates demo users only when `DEMO_USER_PASSWORD` (8+ characters) is set in `server/.env`. All of them share that password, which you choose yourself and never commit. Rerunning the seed keeps existing users.

| Email | Role | Department |
|---|---|---|
| `req.eng1@example.com`, `req.eng2@example.com` | Requester | ENGINEERING |
| `rev.eng1@example.com`, `rev.eng2@example.com` | Reviewer | ENGINEERING |
| `req.fin1@example.com` | Requester | FINANCE |
| `rev.fin1@example.com`, `rev.fin2@example.com` | Reviewer | FINANCE |

After the users, the seed submits 4 sample requests (F-02) through the real reviewer assignment, one of them by `rev.eng1` so it goes to `rev.eng2`. Rerunning it adds none.

In API tests, use `createUser()` and `loginAs()` from `server/tests/helpers/auth.ts` instead of the seed.

### Database port

The dev database listens on host port **5433** by default. If something else already uses 5433, `docker compose up` fails with "port is already allocated". If you miss that error, `server/.env` still points at 5433 and Prisma would migrate the *other* PostgreSQL. Check with `docker compose -f compose.dev.yml ps` that the `db` container is running before you migrate. To pick another port:

1. Create a `.env` file in the repository root (it is git-ignored) with `DB_PORT=55433`, or export `DB_PORT` in your shell.
2. `docker compose -f compose.dev.yml up -d`
3. Change `5433` to the same port in `server/.env` and `server/.env.test`.

**Already have a `server/.env`?** Files copied before the move to 5433 still say `5432`. Change the port in `DATABASE_URL` yourself; copying the example again would overwrite your other settings.

## Test and build

Server integration tests (`*.int.test.ts`) use a separate database, `approvalflow_test`, which `compose.dev.yml` creates the first time it starts. Before the run, the test setup drops everything in that database and applies the migrations of the current branch, so tables from other branches never linger. It refuses to run unless the database is on `localhost` and its name is `test` or ends with `_test` (CI can allow another host with `TEST_DB_HOSTS`).

Run from the repository root:

```bash
cp server/.env.test.example server/.env.test   # once
(cd server && npm test && npm run build)
(cd client && npm test && npm run build)
```

`npm test` in `server` runs both kinds. Without a database, `npm run test:unit` runs only the tests that do not need one; `npm run test:integration` runs only the database tests.

If you started the database before `scripts/create-test-db.sql` existed, create the test database once (keeps your dev data):

```bash
docker compose -f compose.dev.yml exec db createdb -U approvalflow approvalflow_test
```

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
