# ApprovalFlow production image (adapted from the Lab 5 Starter Kit).
# One image serves the API (Express) and the built React client on $PORT 3000.
# Cloud Run runs it as the service; the migration job runs it with
# `npx prisma migrate deploy && npm run prisma:seed`.
# Build from the repository root:  docker build -t approvalflow .
# Secrets (DATABASE_URL, DEMO_USER_PASSWORD) are never baked in; they come from
# the environment at run time (Secret Manager on Cloud Run).

# ---- Stage 1: client (React + Vite) ----
FROM node:24-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
# Empty = the client calls the API on the same origin (same container).
ENV VITE_API_URL=""
RUN npm run build

# ---- Stage 2: server (Express + TypeScript + Prisma) ----
FROM node:24-alpine AS server-builder
WORKDIR /app/server
# Prisma needs openssl on alpine.
RUN apk add --no-cache openssl
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npx prisma generate && npm run build

# ---- Stage 3: runtime ----
FROM node:24-alpine AS production
WORKDIR /app/server
RUN apk add --no-cache openssl

COPY --from=server-builder /app/server/package*.json ./
# Full node_modules: the migration job needs the prisma CLI and tsx (seed).
COPY --from=server-builder /app/server/node_modules ./node_modules
COPY --from=server-builder /app/server/dist ./dist
# src + prisma: the seed (prisma/seed.ts) imports src/seed and src/requests.
COPY --from=server-builder /app/server/src ./src
COPY --from=server-builder /app/server/prisma ./prisma
COPY --from=server-builder /app/server/tsconfig.json ./tsconfig.json
COPY --from=server-builder /app/server/docker-entrypoint.sh ./docker-entrypoint.sh
# The server serves the client from CLIENT_DIST (default ../client/dist).
COPY --from=client-builder /app/client/dist /app/client/dist

RUN chmod +x ./docker-entrypoint.sh

# #41: the commit this image was built from, reported by /api/version.
# Deploy demo passes --build-arg APP_COMMIT=<commit SHA>.
ARG APP_COMMIT=unknown
ENV APP_COMMIT=$APP_COMMIT
ENV NODE_ENV=production
ENV TZ=Asia/Bangkok
# Must match --port in deploy/deploy.sh.
ENV PORT=3000
EXPOSE 3000

USER node
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]
