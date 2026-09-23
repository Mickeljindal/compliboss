#!/usr/bin/env bash
# =============================================================================
# CompliBoss — seed demo data into the running docker-compose Postgres.
#
#   bash deploy/seed-demo.sh
#
# Runs the framework/control library seed + a demo org + a demo login user,
# using a one-off bun container attached to the compose network. Run this AFTER
# `docker compose ... up -d` has the postgres + migrator finished.
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="${ROOT}/docker-compose.prod.yml"

# shellcheck disable=SC1091
source "${ROOT}/.env"

PG_CID="$(docker compose -f "${COMPOSE_FILE}" ps -q postgres)"
if [ -z "${PG_CID}" ]; then
  echo "ERROR: postgres container not running. Start the stack first." >&2
  exit 1
fi
NET="$(docker inspect -f '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}' "${PG_CID}")"
echo "Using docker network: ${NET}"

DB_URL="postgresql://compliboss:${POSTGRES_PASSWORD}@postgres:5432/compliboss"

docker run --rm --network "${NET}" \
  -v "${ROOT}":/app -w /app \
  -e DATABASE_URL="${DB_URL}" \
  oven/bun:1.2.8 sh -lc '
    set -e
    echo "Installing workspace deps (one-off)..."
    bun install
    cd packages/db
    echo "Seeding framework/control library..."
    bun run db:seed
    echo "Seeding demo org + user..."
    bun prisma/seed/demo-org.ts
    bun prisma/seed/add-demo-user.ts
    bun prisma/seed/backfill-demo-hash.ts
    echo "Seed complete."
  '

echo ""
echo "Demo data seeded. Log in at https://app.<your-domain> with the demo user"
echo "(check the API logs for the OTP/magic-link:  docker compose -f docker-compose.prod.yml logs -f api )"
