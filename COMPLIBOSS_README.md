# CompliBoss - Build Notes

This codebase is a fork of the open-source Comp AI project (trycompai/comp), rebranded as a
starting point for CompliBoss. Read this whole file before you touch anything else.

## 1. IMPORTANT - License situation (read this first)

The upstream project is licensed **AGPLv3** (see LICENSE). That license matters a lot for
your plan to "sell the same services":

- AGPL's Section 13 (network use clause) means: if you run a modified version of this code
  as a hosted service that other people interact with over a network (which is exactly what
  a SaaS compliance platform does), you are required to make the complete corresponding
  source code of your modified version available to your users, free of charge.
- In plain terms: if you deploy CompliBoss to clients as-is or lightly modified, under AGPL
  you would need to publish your source code (including your customizations) to anyone who
  uses the hosted app.
- This does NOT mean you cannot use the code. It means you have three realistic paths:
  1. **Comply with AGPL** - open-source your CompliBoss fork too, and build your revenue on
     services (onboarding, implementation, custom integrations, managed hosting) rather than
     on closed source code. This is literally Comp AI's own business model.
  2. **Get a commercial license from Comp AI** - some open-source companies sell a
     commercial/proprietary license that waives the AGPL obligations for a fee. Email
     hello@trycomp.ai and ask directly if this exists.
  3. **Use this repo only as a learning/reference architecture** - study how they modeled
     controls, frameworks, evidence collection, and integrations, then build your own
     implementation from scratch (clean-room) that you fully own and can license however
     you want.
- I'm not a lawyer and this isn't legal advice - if real client revenue is on the line,
  get 30 minutes with an actual IP/licensing lawyer before you launch. This is the single
  biggest business risk in this plan, bigger than any technical risk.

## 2. What you're starting with

Stack: Next.js, Prisma + Postgres, Trigger.dev (background jobs), Tailwind, Upstash (Redis),
Better Auth, deployed on Vercel. It's a Turborepo monorepo.

Apps:
- `apps/app` - the main customer-facing dashboard (controls, policies, evidence, tasks)
- `apps/portal` - the public "trust center" page companies show to their prospects/auditors
- `apps/api` - backend API
- `apps/framework-editor` - internal tool for authoring compliance frameworks
- `apps/mcp-server` - MCP server (lets AI agents query compliance data)

Packages worth knowing: `packages/db` (Prisma schema - this is the heart of the data model),
`packages/integrations` (the connectors to AWS/GCP/GitHub/Okta/etc.), `packages/billing`,
`packages/device-agent` (the endpoint agent that checks employee laptops for disk encryption,
firewall, screen lock).

## 3. Rebrand checklist (cosmetic, do this after the license decision above)

- [ ] Replace "Comp AI" / "trycomp.ai" strings with "CompliBoss" / your domain across
      `README.md`, `apps/app/src/app`, `apps/portal`, email templates in `packages/email`
- [ ] Swap `public/logo.png` and favicon assets in `apps/app/public` and `apps/portal/public`
- [ ] Update `packages/email` sender name/footer
- [ ] Update `apps/app/.env.example` comments if you rename any services
- [ ] Point `NEXT_PUBLIC_VERCEL_URL` and auth URLs at your own domain
- [ ] Replace OSS-specific links (Discord, GitHub issues, roadmap) with your own support channels

## 4. Environment variables you'll need before it runs

Copy the `.env.example` files in `apps/app`, `apps/portal`, and `packages/db` to `.env` and
fill in: a Postgres connection string, an OpenAI key (AI features), a Resend key (email),
a Trigger.dev key (background jobs), and AWS credentials (file storage). Google/GitHub OAuth
are optional. See each `.env.example` for the full list.

## 5. Suggested build order

1. Get it running locally against your own Postgres (see main README "Getting Started")
2. Decide on the license path (section 1) before writing a single line of custom code
3. Rebrand cosmetically (section 3)
4. Pick your first framework to nail (SOC 2 Type 1 is the easiest wedge - it's what most
   first-time buyers search for) and make sure that one path is flawless before expanding
5. Set up your own integrations catalog priorities based on your target client stack
   (for Indian/SMB clients: GitHub, Google Workspace, AWS are the highest-value first three)
