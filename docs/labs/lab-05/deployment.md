# Lab 5 Deployment

> Fill in during Lab 5 (Student Guide Episodes 2–8).

## Stack and changes from the reference

Reference stack (Cloud Run, Cloud SQL for PostgreSQL, Artifact Registry, Secret Manager, GitHub Actions). Changes: _none yet_.

## Environment variables

| Variable | Purpose | Secret? | Where the value comes from |
|---|---|---|---|
| DATABASE_URL | PostgreSQL connection | Yes | `.env` locally; Secret Manager in the cloud |
| PORT | HTTP port | No | Cloud Run sets it |
| NODE_ENV | Runtime mode | No | Dockerfile / Cloud Run |
| CORS_ORIGIN | Allowed origins | No | Optional |
| CLIENT_DIST | Path to built SPA | No | Default `../client/dist` |

## Commands

| Task | Command |
|---|---|
| Build | _TODO_ |
| Test | _TODO_ |
| Run | _TODO_ |
| Migrate | `npx prisma migrate deploy` |
| Seed | `npm run prisma:seed` |

## GCP resources

Project: _TODO_ · Region: _TODO_ · Service: _TODO_ · Database: _TODO_

## Release procedure

_TODO: steps, and how to find the commit that is running._
