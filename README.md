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
docker compose -f compose.dev.yml up -d        # start PostgreSQL on :5432
cp server/.env.example server/.env             # placeholders work for local dev
cd server && npm install && npx prisma migrate dev && npm run prisma:seed && npm run dev
```

In a second terminal:

```bash
cd client && npm install && npm run dev        # http://localhost:5173 (proxies /api to :3000)
```

Check: <http://localhost:3000/api/health> and <http://localhost:3000/api/ready>.

## Test and build

```bash
cd server && npm test && npm run build
cd client && npm test && npm run build
```

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
