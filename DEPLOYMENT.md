# CompliBoss — Go-Live Runbook

Deploying the CompliBoss stack (API + dashboard + portal + marketing site) with
local file storage. Written for a single KloudBean (or any Docker) host.

## 0. Before you deploy — read this

- **Licensing gate.** This codebase is a fork of an AGPLv3 project. Running it as
  a **closed-source commercial** service requires either a commercial license
  from the upstream (Comp AI) or open-sourcing your fork. Resolve this first —
  it's a legal decision, not a technical one.
- **Storage — use MinIO (recommended).** `docker-compose.prod.yml` includes a
  self-hosted, S3-compatible **MinIO** service. It works for the API *and* the
  web apps with no code changes, keeps files on your own server (the `minio-data`
  volume), and lets you switch to real AWS S3 later by changing env only. Set the
  `APP_AWS_*` vars to point at MinIO (see `.env.production.example`, Option A).
  A pure `STORAGE_DRIVER=local` mode also exists (Option B) but only covers the
  API's own flows — the web apps' upload/logo features need MinIO or the API.

## 1. Prerequisites

- A host with Docker + Docker Compose, ~4GB+ RAM (Next builds are memory-hungry).
- DNS A-records pointing at the host:
  - `app.compliboss.com`, `portal.compliboss.com`, `api.compliboss.com`, `compliboss.com` (marketing)
- A reverse proxy / TLS terminator (KloudBean's, or Caddy/Nginx) routing each
  subdomain to the right container port: app→3000, portal→3002, api→3333, web→3005.
- Accounts: Resend (email) + an OpenAI API key. Optional: Upstash (Redis/rate
  limiting), Trigger.dev (background jobs).

## 2. Configure environment

```bash
cp .env.production.example .env          # fill in secrets + your domain
# Then create per-service env files (share the CORE SECRETS + DATABASE_URL):
#   apps/api/.env      apps/app/.env      apps/portal/.env
```
Generate each secret with `openssl rand -base64 32`. `AUTH_SECRET`, `SECRET_KEY`,
`INTERNAL_API_TOKEN`, `SERVICE_TOKEN_*` must be identical everywhere they appear.
In `apps/api/.env` set `STORAGE_DRIVER=local` and
`LOCAL_STORAGE_DIR=/var/lib/compliboss/uploads` (matches the compose volume).

## 3. Verify the build locally first (do NOT skip)

```bash
bun install
bun run typecheck            # workspace packages build in dep order here
cd apps/api && bunx jest src/uploads src/attachments src/policies --passWithNoTests
```
Fix anything that fails before deploying.

## 4. Deploy

```bash
docker compose -f docker-compose.prod.yml up -d --build
```
This starts Postgres, runs migrations (`migrator`), then brings up api → app →
portal → web. Watch logs: `docker compose -f docker-compose.prod.yml logs -f api`.

## 5. Smoke test

- `curl https://api.compliboss.com/v1/health` → healthy
- Sign up / log in at `https://app.compliboss.com`; confirm the session cookie is
  set on `.compliboss.com` and you stay logged in across app/portal.
- Upload an attachment or policy PDF; confirm it saves and previews (exercises the
  local storage driver: `PUT /v1/uploads/local`, `GET /v1/files/local`).
- Marketing site loads at `https://compliboss.com`.

## Notes

- The in-app logo/theme comes from the external `@trycompai/design-system` package;
  only the accent color is rebranded. A full redesign needs that package vendored
  into the monorepo.
- Generated OpenAPI/MCP files regenerate when the API boots.
