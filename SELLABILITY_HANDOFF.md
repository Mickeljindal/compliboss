# CompliBoss — Sellability Handoff

Status of the platform for commercial launch, what's verified working, and the
blockers only you can clear (they're not code). Written after a build-and-verify
pass; every "verified" item below was exercised against real data locally.

---

## 1. What's working and verified

**Core compliance engine (real, not demo-ware)**
- Framework library seeds 23 frameworks (SOC 2, ISO 27001, HIPAA, GDPR, PCI DSS, NIST CSF, …) with 204 control templates, 148 task templates, 1,334 requirements.
- A framework instantiates into org-scoped controls, tasks, requirement maps, and policy/task links. Verified end-to-end with a demo org (SOC 2: 35 controls, 121 requirement mappings).
- Multi-cloud automated evidence collection is genuinely implemented: **AWS** (~46 service adapters), **Azure** (Defender + 12 adapters), **GCP** (Security Command Center), **GitHub**, **Google Workspace**, **JumpCloud**. These produce timestamped, source-attributed, per-resource evidence.

**Auditor evidence package (built + shipped this pass)**
- Control-by-control package mapping framework → requirement (e.g. CC6.1) → control → evidence tasks + latest automated check results + linked policies, with per-control coverage (satisfied / partial / gap) and a readiness summary.
- Downloadable **Markdown** and branded **PDF** binders (verified: valid 11-page PDF).
- Dashboard page under the auditor view with a framework picker, coverage heatmap, and download buttons.
- Endpoints: `GET /v1/evidence-export/frameworks`, `/:id/package`, `/:id/binder.md`, `/:id/binder.pdf`, `/:id/verify` (all API-key + `evidence:read` gated).

**Evidence integrity / tamper-evidence (built + proven this pass)**
- Every automated check result is hashed (SHA-256 over canonical content) at collection time.
- `/verify` recomputes and flags tampering. Proven: tampering a DB row was detected and named.
- UI shows a green "Integrity verified" / red "tampered" badge.

**Verification performed**
- API production typecheck: 0 errors in production source (only pre-existing test-file type issues remain).
- Evidence-export tests: 40/40 pass.
- App production build: succeeds; the new route compiles.
- Full stack runs locally: Postgres + API (:3333) + dashboard (:3000) + marketing (:3005), local file storage.

**Deploy artifacts ready**
- `docker-compose.prod.yml` (Postgres + MinIO + API + app + portal + web), `.env.production.example`, `apps/web/Dockerfile`, `DEPLOYMENT.md`.

---

## 2. Honest gaps (known, documented — decide what matters for launch)

- **Evidence integrity covers automated check results only.** Manual evidence submissions and uploaded files are not yet hashed. (Follow-up.)
- **Auditor evidence package maps evidence via tasks**, not as direct criterion-level citations — correct, but indirect.
- **Dynamic (customer-authored) integrations** don't run their checks in the Trigger.dev background runtime — so "hands-off daily evidence" isn't guaranteed for those. Native connectors are fine.
- **Rippling / Vercel / Aikido** are partial (narrow scope). **Okta / Microsoft Entra are NOT native** — they're handled by the AI Agent (best-effort), and the UI/pitch now say so. Don't sell them as native.
- **Marketing site** (`apps/web`) is a single strong landing page, not a full multi-page site (no per-framework SEO pages, pricing page, blog).
- **Browser click-through of the new auditor page** wasn't automated (needs a logged-in session); it compiles and the API is proven.

---

## 3. Blockers only you can clear (NOT code)

1. **Licensing — the hard gate.** This is a fork of an AGPLv3 project. Selling it as a **closed-source commercial** service requires either a commercial license from the upstream (Comp AI) or open-sourcing your fork. Resolve this **before** taking money. Nothing technical unblocks it.
2. **Your own platform trust.** You're selling security software — buyers will ask for *your* SOC 2 / pen test, uptime SLA, backup policy, and sub-processor list. Prepare answers (and ideally start your own SOC 2 — you can run it on CompliBoss).
3. **Auditor relationships.** "SOC 2 in weeks" implies audit firms that accept CompliBoss-collected evidence. Line up 1–2 audit partners, or sell "audit readiness," not the report.
4. **Commercial paperwork.** Pricing model + order form, MSA/ToS, DPA, privacy policy. (Pricing is intentionally "on request" in the pitch deck.)
5. **KloudBean deployment (needs your account + DNS).** Provision a server, point DNS for `app.` / `portal.` / `api.` / root, fill `.env`, `docker compose -f docker-compose.prod.yml up -d --build`, add TLS. Steps in `DEPLOYMENT.md`. I cannot do this without your credentials.
6. **Real customer logos/testimonials** to replace the representative placeholders in the pitch deck and marketing site.

---

## 4. Suggested order to launch
1. Settle licensing (#1) — go/no-go.
2. Deploy to KloudBean and smoke-test signup → framework → connect AWS → evidence → export binder.
3. Stand up commercial paperwork + pricing.
4. Line up an audit partner.
5. Expand the marketing site + add real proof.

---

## 5. Local demo (to show a prospect today)
- Seed: `cd packages/db && DATABASE_URL=... bun prisma/seed/seed.ts` then `bun prisma/seed/demo-org.ts` (prints an org id, framework instance id, and API key).
- API: `cd apps/api && nest start` (with `STORAGE_DRIVER=local`).
- Try: `GET /v1/evidence-export/frameworks`, `/:fi/package`, `/:fi/binder.pdf`, `/:fi/verify` with `x-api-key`.
- Dashboard: `/[orgId]/auditor/evidence-package`.
