# Deploying DohNut to Vercel

DohNut is a Next.js 16 app. It deploys to Vercel out of the box. Two things to know:

1. **Database** — the default SQLite setup runs on Vercel's **ephemeral `/tmp`** filesystem. The app auto-creates the schema and re-seeds **32 donuts** (16 originals + 6 Malaysian specialties + 5 savory + 5 classics — see `src/lib/seed-data.ts`) on every cold start (handled by `src/lib/ensure-ready.ts`). This is perfect for a **demo/showcase** — browsing, cart, checkout, AI tools, payment all work. The trade-off: cart/orders/reviews reset when the serverless instance cold-starts. For **persistent** storage, switch to Vercel Postgres (see below).

2. **Real-time order tracking** — the WebSocket mini-service (`mini-services/order-tracking/`, port 3004) **cannot run on Vercel** (Vercel is serverless — no long-running processes). The order-tracking screen has a built-in REST polling fallback, so the UI still loads and shows the last-known order status. To get live progressing status, deploy the mini-service separately (Render / Railway / Fly.io) and point the frontend at it.

---

## Option A — One-click demo deploy (ephemeral SQLite, no setup)

1. Push this repo to GitHub (already at `https://github.com/thisisniagahub/Doh-Nut-Z.git`).
2. Go to **https://vercel.com/new** → import the `Doh-Nut-Z` repo.
3. Framework preset: **Next.js** (auto-detected).
4. Build command: `bun run build` (from `vercel.json`).
5. Install command: `bun install` (from `vercel.json`).
6. **No environment variables required** — the SQLite path is auto-resolved to `/tmp/dohnut.db`.
7. Click **Deploy**. Wait ~2 min.

That's it. The first request to `/api/donuts` lazily creates the schema + seeds 32 donuts.

> The `postinstall` script runs `prisma generate` so the Prisma Client is built during install.

---

## Option B — Production deploy with persistent Postgres

Use this if you want cart/orders/reviews to survive cold starts.

### 1. Create a Postgres DB
Easiest: **Vercel Postgres** (free tier) — in your Vercel project dashboard → **Storage** → **Create** → **Postgres**. Copy the `DATABASE_URL` (the pooled/`?pgbouncer=true` one works).

Alternatives: **Neon** (https://neon.tech) or **Supabase** (https://supabase.com) — both have free Postgres tiers.

### 2. Switch the Prisma provider
Edit `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"   // was "sqlite"
  url      = env("DATABASE_URL")
}
```

Then regenerate:

```bash
bun run db:generate
```

### 3. Set the env var
- **Locally**: put `DATABASE_URL="postgresql://..."` in `.env`.
- **On Vercel**: Project Settings → Environment Variables → add `DATABASE_URL` (paste the Postgres URL).

### 4. Create tables + seed
```bash
bun run db:push      # creates tables in Postgres
bun run seed         # inserts 32 donuts (idempotent)
```

### 5. Deploy
Push to `main` — Vercel auto-deploys. The `src/lib/ensure-ready.ts` module becomes a harmless no-op (tables already exist, catalog already seeded).

---

## Real-time order tracking (optional, separate host)

The WebSocket service lives in `mini-services/order-tracking/`. To run it:

1. Deploy `mini-services/order-tracking/` to **Render** (free Web Service), **Railway**, or **Fly.io**. It's a standalone Bun + socket.io server on port 3004.
2. Update the frontend connection string in `src/components/dohnut/order-tracking-view.tsx`:
   - Currently: `io("/?XTransformPort=3004", …)` (works behind the local Caddy gateway).
   - For production: `io("https://your-tracking-service.onrender.com", { transports: ["websocket","polling"] })`.
3. The tracking screen falls back to REST polling (`/api/orders/[id]`) if the socket can't connect, so it never breaks.

---

## Local dev

```bash
bun install
bun run db:push      # create local SQLite schema
bun run seed         # seed 32 donuts
bun run dev          # http://localhost:3000
```

To also run real-time tracking locally:

```bash
cd mini-services/order-tracking
bun install
bun run dev          # port 3004
```

---

## What's in this repo

| Path | Purpose |
|---|---|
| `src/app/` | Next.js App Router — single `/` route (SPA) + `/api/*` routes |
| `src/lib/db.ts` | Prisma client — auto-resolves `/tmp` on Vercel |
| `src/lib/ensure-ready.ts` | Auto schema-create + seed on cold start (Vercel) |
| `src/lib/seed-data.ts` | Shared 32-donut catalog (16 originals + 6 Malaysian + 5 savory + extras) |
| `prisma/schema.prisma` | DB schema (SQLite default; switch to postgres for persistence) |
| `prisma/seed.ts` | Seed script (`bun run seed`) |
| `vercel.json` | Vercel build config |
| `mini-services/order-tracking/` | Standalone socket.io service (deploy separately) |
| `public/brand/` | Logo + brand images |

---

## Troubleshooting

**Build fails on Vercel with Prisma error** — ensure `postinstall: prisma generate` is in `package.json` (it is). If still failing, add `prisma generate` explicitly to the build command.

**`/api/donuts` returns 500 on Vercel** — check Vercel function logs. The `ensure-ready` raw DDL should create tables; if it fails, the SQLite /tmp may be full. Redeploy.

**Orders disappear after a while** — that's the ephemeral SQLite cold-start reset. Use Option B (Postgres) for persistence.

**Order tracking stuck on "preparing"** — the WebSocket service isn't running. Either deploy it separately (see above) or rely on the REST polling fallback (shows last-known status only).

---

## Payment — Billplz (Malaysian gateway)

Checkout uses **Billplz** for FPX / TnG eWallet / DuitNow QR. The frontend calls `/api/payment/billplz/create` → gets a `paymentUrl` → redirects the user to Billplz's hosted page → Billplz POSTs back to `/api/payment/billplz/webhook` → order gets `paidAt` stamped + an `OrderEvent` is logged.

### Sandbox (no credentials)
If none of the env vars below are set, the create route **marks the order as paid immediately** and returns `{ paid: true, devMode: true }`. The frontend then routes the user straight to the live tracking screen so checkout stays unblocked for demos. Real money never moves in dev mode.

### Production setup
1. Sign up at **https://www.billplz.com** and create a Collection.
2. In Vercel → Project Settings → Environment Variables, add:

| Variable | Description | Where to find it |
|---|---|---|
| `BILLPLZ_API_KEY` | API secret key | Billplz Dashboard → Settings → API Keys |
| `BILLPLZ_COLLECTION_ID` | Your Collection ID | Billplz Dashboard → Collections |
| `BILLPLZ_X_SIGNATURE_KEY` | Webhook signing key | Billplz Dashboard → Settings → Webhooks → X-Signature Key |
| `BILLPLZ_SANDBOX` | `true` for sandbox, `false` for production | Set per-environment |

3. Point the webhook at **`https://<your-vercel-domain>/api/payment/billplz/webhook`** in Billplz Dashboard → Webhooks. The route verifies the `X-Signature` header (HMAC-SHA256, timing-safe) and rejects any payload with a mismatched signature.
4. SST (Sales & Service Tax) **6%** is auto-computed in `POST /api/orders` and surfaced in the cart/checkout UI. Billplz receives `paidAmount = subtotal + sst + delivery`.

### Local dev with Billplz sandbox
```bash
# .env.local
BILLPLZ_API_KEY=your_sandbox_key
BILLPLZ_COLLECTION_ID=your_sandbox_collection
BILLPLZ_X_SIGNATURE_KEY=your_sandbox_signing_key
BILLPLZ_SANDBOX=true
```
With these set, hitting checkout redirects to the Billplz sandbox page. Leave them out and the dev fallback kicks in (instant "paid" + tracking screen).

---

## Environment variables — quick reference

| Variable | Required? | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | No | `/tmp/dohnut.db` on Vercel, `./prisma/dev.db` locally | Prisma data source |
| `ADMIN_API_KEY` | Yes for prod | unset (dev guard only) | Guards `/api/admin/*` and `/api/orders/[id]/status` |
| `BILLPLZ_API_KEY` | No | unset | Billplz payments (missing = dev instant-paid fallback) |
| `BILLPLZ_COLLECTION_ID` | No | unset | Billplz collection |
| `BILLPLZ_X_SIGNATURE_KEY` | No | unset | Billplz webhook HMAC verification |
| `BILLPLZ_SANDBOX` | No | `false` | `true` to use Billplz sandbox |
| `PORT` | No | `3000` | Override Next.js dev port |

> **Security**: `.env` is gitignored. Never commit real API keys. The `ADMIN_API_KEY` previously leaked in git history has been rotated — if you're standing up a fresh instance, generate a new one (e.g. `openssl rand -hex 32`).

> **Removed**: `@copilotkit/*` packages, `/api/copilotkit` route, and the in-app Sparkles button have been **removed** (was a paid SaaS dependency). AI Concierge now runs on the in-house `/api/ai/concierge` route with no third-party runtime cost.
