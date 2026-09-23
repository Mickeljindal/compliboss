# CompliBoss — Demo deploy on a KloudBean server (Postgres, one box)

Gets `app.compliboss.com` (dashboard) + `api.compliboss.com` (API) live for demos,
on a single KloudBean **server** (the kind you SSH into), using Docker Compose.
Everything — Postgres, API, dashboard — runs in containers on that one box.
No MySQL, no managed DB, no external services required for a basic demo.

> Why Docker and not KloudBean's Next.js one-click: the app is a monorepo whose
> packages use bun `workspace:*` deps that npm can't install, and it needs
> Postgres. Docker builds with bun inside the image, so both problems disappear.

## 0. What you need
- SSH access to a KloudBean server (any Linux VM you control on KloudBean).
- DNS you can edit for your domain.
- ~4 GB RAM on the server (Next builds are memory-hungry).

## 1. SSH in and confirm Docker
```bash
docker --version && docker compose version
```
If missing, install it (Ubuntu/Debian):
```bash
curl -fsSL https://get.docker.com | sh
```

## 2. Get the code
```bash
git clone https://github.com/Mickeljindal/compliboss.git
cd compliboss
```
(Private repo — use a GitHub token or deploy key when prompted.)

## 3. Generate env (secrets + your domain)
```bash
bash deploy/setup-env.sh compliboss.com
```
This writes `.env`, `apps/api/.env`, `apps/app/.env`, `apps/portal/.env` with
freshly generated secrets, Postgres password, and your domain baked in.
File storage is local disk on a persistent volume. Email/AI keys are left blank
(the demo works without them — see step 6 for login).

## 4. Build & start (Postgres + API + dashboard)
```bash
docker compose -f docker-compose.prod.yml up -d --build postgres migrator api app
```
First build takes a while (it builds the API and the Next dashboard). Watch it:
```bash
docker compose -f docker-compose.prod.yml logs -f api app
```
`migrator` runs the 269 Postgres migrations automatically before the API starts.

Health check:
```bash
curl -s http://localhost:3333/v1/health    # API
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000   # dashboard -> 200
```

## 5. Seed demo data (frameworks + a demo org + login user)
```bash
bash deploy/seed-demo.sh
```
Without this, the dashboard has no framework/control library to show.

## 6. Log in (no email provider needed for the demo)
The demo has no Resend key, so the login OTP / magic-link is printed to the API
logs instead of emailed. Enter your email on the sign-in page, then grab the code:
```bash
docker compose -f docker-compose.prod.yml logs api | grep -iE "otp|magic|sign-in|code" | tail
```

## 7. Point the subdomains at the server
Add DNS A-records to the server's public IP:
- `app.compliboss.com`  → dashboard (container port **3000**)
- `api.compliboss.com`  → API (container port **3333**)

Then have KloudBean's reverse proxy (or Caddy/Nginx) route each subdomain to the
right port and terminate TLS. Minimum for a demo: `app.` → 3000, `api.` → 3333.
Both MUST be on the same parent domain (`*.compliboss.com`) so the session cookie
(`COOKIE_DOMAIN=.compliboss.com`) works across them.

Example Caddyfile (if you use Caddy):
```
app.compliboss.com { reverse_proxy localhost:3000 }
api.compliboss.com { reverse_proxy localhost:3333 }
```

## Updating later
```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build api app
```

## Optional (enable more features)
Edit `apps/api/.env` and restart `api`:
- `RESEND_API_KEY=...` → real invite/login emails (instead of logs)
- `OPENAI_API_KEY=...` → AI policy/vendor/risk generation
- `TRIGGER_SECRET_KEY=...` → scheduled evidence-collection jobs

## Notes / honesty
- I could not build the Docker images in my environment (no Docker daemon there),
  so the first `up --build` is the real test. If a build step fails, send me the
  log and I'll fix it.
- Portal and the MinIO object store are omitted from the demo for simplicity. Add
  `portal` / `minio` back to the `up` command if you need them.
