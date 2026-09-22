# Deploy the CompliBoss marketing site (apps/web) on KloudBean

The marketing site is a self-contained Next.js app (no workspace dependencies),
so KloudBean can build and run it straight from the monorepo by pointing the
App Directory at `apps/web`.

## Prerequisites
- Your repo pushed to GitHub / GitLab / Bitbucket (KloudBean deploys via Git).
- A KloudBean account.

## 1. Provision the server
KloudBean → **Add Application → Next.js** (new server or existing).
- Cloud provider + datacenter nearest your users.
- **Server size: 2–4 GB RAM** (Next builds need memory).
- Default stack gives Node 20 — that's what this app needs.

## 2. Connect the repo (Code Delivery → Git Deployment)
- Connect GitHub (OAuth) or add the SSH deploy key to your Git provider.
- Git Repository URL: your repo. Branch: `main` (or your release branch).
- Clone Repository.

## 3. Node runtime configuration — set these exact values
| Field | Value |
|---|---|
| **App Directory** | `apps/web` |
| **Node Version** | `20` |
| **Install Command** | `npm install` |
| **Build Command** | `npm run build` |
| **Start Command** | `npm run start` |
| **Port** | leave KloudBean's assigned port — the app reads `$PORT` automatically (`next start -H 0.0.0.0 -p ${PORT:-3005}`) |

## 4. Environment variables (Runtime Configuration → Environment Variables)
```
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
NODE_OPTIONS=--max-old-space-size=2048
# Point "Sign in" links at your app (update when the app is deployed):
NEXT_PUBLIC_APP_URL=https://app.compliboss.com
```
(`NODE_OPTIONS` only needed if the build hits "JavaScript heap out of memory" on a small server.)

## 5. Deploy
Click **Pull & Deploy** (or `sudo adm` over SSH). KloudBean will install, build,
and start the app. Watch build logs in the UI; app logs under
**Application Administration → Logs Viewer** (App Errors tab for 503s).

## 6. Domain + SSL
- Application Administration → Access → copy the server public IP.
- Point `compliboss.com` (and `www`) A-records at it.
- Add the custom domain in KloudBean, then install the SSL certificate.

## Notes / gotchas
- **Monorepo:** KloudBean clones the whole repo; building only `apps/web` is fine
  because it has no `workspace:*` dependencies — `npm install` resolves everything
  from npm.
- **Node 20 required** (Next 16 / React 19). KloudBean's default is 20.
- If the build OOMs, bump server RAM to 4 GB or raise `--max-old-space-size`.
- 503 after deploy = app not listening. Confirm the Start Command is
  `npm run start` and the app is binding to `$PORT` (it does by default here).
- This deploys only the marketing site. The dashboard/API/portal are a separate,
  heavier deploy (Postgres + Trigger.dev + email) — see `DEPLOYMENT.md`.
