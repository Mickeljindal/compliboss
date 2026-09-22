# =============================================================================
# CompliBoss marketing site (apps/web) — standalone Next.js image
# Build from the repo root:
#   docker build -f apps/web/Dockerfile -t compliboss-web .
# =============================================================================
FROM oven/bun:1.2.8 AS builder
WORKDIR /app

# Only the marketing app is needed — it has no internal workspace deps.
COPY apps/web/package.json ./apps/web/
RUN cd apps/web && bun install

COPY apps/web ./apps/web

ENV NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production
RUN cd apps/web && bun run build

# -----------------------------------------------------------------------------
FROM node:22-alpine AS web
WORKDIR /app

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3005
ENV PORT=3005
CMD ["node", "apps/web/server.js"]
