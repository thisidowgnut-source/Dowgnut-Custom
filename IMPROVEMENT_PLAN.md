# DohNut Next.js App — Codebase Audit Report

**Generated:** 2026-08-22  
**Scope:** `G:/THISISDOH-NUT` (Next.js 16 + React 19 + Prisma/SQLite + CopilotKit + Zustand)  
**Auditor:** Hermes Agent (codebase-audit skill)

---

## Executive Summary

| Dimension | Score (1–10) | Verdict |
|---|---|---|
| **Documentation** | 8 | Excellent README, good AGENTS context, VERCEL_DEPLOY.md |
| **Architecture** | 6 | Clean layering but session auth fundamentally broken; no validation layer |
| **Security** | 3 | `.env` tracked in git (live leak), client-trusted `x-session-id`, admin guard only in prod |
| **Testing** | 1 | Zero tests, no test runner configured |
| **Packaging** | 2 | 116 deps (74+ unused), 34 dead UI components, dual lock files |
| **Operations** | 5 | Ephemeral SQLite on Vercel, auto-reseed works, but no monitoring/alerts |
| **UI/UX** | 8 | Premium glassmorphism, mobile-first, WCAG AA, motion respect |
| **Overall** | **4.7** | **Functional demo with critical security & hygiene debt** |

---

## Critical Findings (P0 — Do First)

| # | Issue | Evidence | Impact | Fix |
|---|---|---|---|---|
| **1** | **`.env` tracked in git** — `ADMIN_API_KEY` + `SUPPORT_EMAIL` committed | `.gitignore` ignores `.env*` but `.env` is tracked (confirmed by `git status`) | **Secret leak** — admin key exposed in history; anyone with repo access gets admin | `git rm --cached .env` → rotate `ADMIN_API_KEY` → add to Vercel env vars only |
| **2** | **Session auth = client-controlled header** | `src/lib/session.ts:4-9` reads `x-session-id` from request; `src/lib/api.ts:41-42` injects from localStorage | **IDOR / impersonation** — any caller can set any `sessionId` and access others' carts/orders | Replace with **server-set httpOnly cookie** or **signed HMAC token** (short-term: HMAC of sessionId + secret) |
| **3** | **Admin routes unguarded in dev** | `src/app/api/admin/stats/route.ts:12` — guard only runs when `NODE_ENV === "production"` | Local/dev deployments fully open to `/api/admin/*` and `/api/orders/[id]/status` | Enforce `ADMIN_API_KEY` check **always** when key is configured (remove `NODE_ENV` condition) |
| **4** | **Zero input validation on 14/15 API routes** | Only `/api/payment/billplz/create` uses zod; rest trust raw `request.json()` | **Injection, DoS, logic bugs** — malformed payloads crash handlers or corrupt DB | Add zod schemas to all routes (`src/lib/validators/`) — see Phase 3 below |

---

## High Findings (P1 — This Sprint)

| # | Issue | Evidence | Fix |
|---|---|---|---|
| **5** | **Currency bugs — hardcoded `RM${...}`** | `grep -rn 'RM\$\{' src/components/dohnut/` → 12+ occurrences in `cart-drawer.tsx`, `checkout-view.tsx`, `orders-view.tsx`, `admin-dashboard.tsx` | Use `formatMYR()` from `src/lib/pricing.ts` everywhere; add `formatMYR` import to components |
| **6** | **`favicon.ico` missing** (blocks PWA install) | `public/favicon.ico` EXISTS per `ls`, but `manifest.json` doesn't reference it; PWA spec requires it | Add `"src": "/favicon.ico", "sizes": "64x64 32x32 16x16", "type": "image/x-icon"` to `manifest.json` |
| **7** | **Mini-service CORS `*` + no rate limit** | `mini-services/order-tracking/index.ts:174` — `cors: { origin: '*' }` | Restrict to app origin (`process.env.APP_ORIGIN`); add simple rate limiter (token bucket per IP) |
| **8** | **ETA mismatch: Prisma 25min vs Mini-service 18min** | `prisma/schema.prisma:80` — `etaMinutes @default(25)`; `mini-services/order-tracking/index.ts:39` — `preparing: 18` | Align both to **25 min** (update mini-service `ETA_MINUTES.preparing = 25`) |
| **9** | **Review model — no constraints/indexes** | `prisma/schema.prisma:117-128` — missing `@db.Check(rating >= 1 AND rating <= 5)`, `@@unique([sessionId, donutId])`, `@@index([sessionId])`, `@@index([donutId])` | Add constraints + indexes; run migration |
| **10** | **AI silent failure returns empty string** | `src/lib/ai.ts:48-70` — `callChat()` catches all errors, returns `""`; caller `parseDonutBlock("")` → empty picks | Return `{ ok: true, data: text } | { ok: false, error: string }`; handle in concierge route |

---

## Medium Findings (P2 — Next Sprint)

| # | Issue | Evidence | Fix |
|---|---|---|---|
| **11** | **34 dead shadcn/ui components** | `src/components/ui/` has 48 files; only 14 used (Card, Button, Badge, Input, Textarea, Label, Table, Sheet, Progress, Skeleton, Toaster, Toast, Separator, DropdownMenu) | Delete in dependency order: `sidebar` → `separator`, `tooltip`, `use-mobile.ts`; `toggle-group` → `toggle`; then 31 orphans → `bun remove` 30 Radix deps |
| **12** | **74 unused dependencies** | `package.json:116` deps; zero-import packages: `@dnd-kit/*`, `@tanstack/*`, `date-fns`, `hono`, `next-auth`, `next-intl`, `recharts`, `sharp`, `shiki`, `uuid`, `zod` (used only in 1 route), etc. | After #11, `bun remove` 44 zero-import deps; keep only what `grep -r "import.*from"` confirms |
| **13** | **`any` / `as any` in 5+ locations** | `src/lib/ai.ts:23-24, 55-56, 63-64`; `src/lib/db.ts:24-25`; `src/app/api/orders/[id]/status/route.ts:32` | Replace with `unknown` + type guards; define proper types for ZAI SDK |
| **14** | **Dangerous `node_modules` patch scripts at root** | `fix-mermaid-chunks.js`, `scan-missing-modules.js`, `fix-es-toolkit.js` — mutate installed packages | Delete 3 scripts; `rm -rf node_modules && bun install` |
| **15** | **Race conditions: stale-overwrite, double-send, qty floor, fake-payment cleanup** | `use-shop.ts:253-263` (addToCart no abort), `cart-drawer.tsx:160-166` (qty floor at 1 OK but no max), `checkout-view.tsx:122-143` (no double-click guard) | Add AbortController per request; disable button on submit; enforce `quantity >= 1 && <= stock`; cleanup fake-payment orders on timeout |

---

## Low Findings (P3 — Hygiene)

| # | Issue | Fix |
|---|---|---|
| **16** | **Stray files committed** | `git rm --cached package-lock.json verify-*.png commercial-result.json .FullName dev.log dev.pid skills-lock.json` |
| **17** | **ESLint config = all rules off** | `eslint.config.mjs` disables everything; enable core rules, fix actual violations |
| **18** | **No test runner / test setup** | Add `vitest` + `@testing-library/react` + `jsdom`; create `src/__tests__/` |
| **19** | **A11y gaps: dialog/carousel/card** | Escape close, focus trap, `aria-label` on icon buttons, toast on API errors |
| **20** | **CopilotKit route deleted but deps remain** | `@copilotkit/*` in `package.json` + `next.config.ts` transpile — remove if not re-adding |

---

## Fix Execution Plan (Sequential — Do Not Parallelize)

### Phase 1: Security & Critical Unblocks (Day 1)
```bash
cd /g/THISISDOH-NUT

# 1. Restore favicon (unblocks PWA)
git restore public/favicon.ico

# 2. Rotate ADMIN_API_KEY, untrack .env
git rm --cached .env
# Generate new key: openssl rand -hex 32
# Update .env.local (not tracked) + Vercel env vars

# 3. Implement server-set session cookie / HMAC token
# Replace src/lib/session.ts + src/lib/api.ts + middleware.ts
```

### Phase 2: Visible Bugs & Currency (Day 1–2)
```bash
# 4. Currency audit → replace all RM${} with formatMYR()
grep -rn 'RM\$\{' src/components/dohnut/
# Create src/lib/currency.ts re-exporting formatMYR
# Update all 12+ component files

# 5. Add formatMYR util import to components
```

### Phase 3: API Hardening (Day 2–3)
```bash
# 6. Zod validation on all 15 API routes
mkdir -p src/lib/validators
# Create schemas for each route
# Import + validate in each route handler

# 7. Rate limiting on /api/ai/*, /api/copilotkit
# Upstash Redis or custom in-memory middleware
```

### Phase 4: Dead Code Purge (Day 3–4)
```bash
# 8. Delete 34 dead UI components (dependency order)
# 9. bun remove 30 dead-ui deps
# 10. bun remove 44 zero-import deps
```

### Phase 5: Mini-Service & Schema (Day 4)
```bash
# 11. Mini-service: rate limit, CORS to app origin, start script, ETA=25
# 12. Prisma schema: Review constraints + indexes, etaMinutes=25
bun run db:migrate
```

### Phase 6: Race Conditions & Hygiene (Day 5)
```bash
# 13. AbortController, double-send guard, qty max=stock, fake-payment cleanup
# 14. Delete root patch scripts
# 15. Clean strays (git rm --cached)
```

---

## Verification Gates (Mandatory Before "Done")

```bash
cd /g/THISISDOH-NUT

# 1. Type check
bunx tsc --noEmit

# 2. Build — MUST pass clean
bun run build         # prisma generate + next build --webpack

# 3. Lint (after eslint.config.mjs fix)
bun run lint

# 4. PWA verification (after favicon + manifest fix)
cd build && python -m http.server 52317 --bind 127.0.0.1
# Browser: http://127.0.0.1:52317/
# - Install prompt appears
# - Offline works
# - Console 0 errors

# 5. Security smoke test
curl -H "x-admin-key: wrong" http://localhost:3000/api/admin/stats  # → 401
curl -H "x-session-id: other-user-id" http://localhost:3000/api/cart  # → isolated cart
```

---

## Architecture Decision Records (ADRs)

| ADR | Decision | Rationale |
|---|---|---|
| **ADR-001** | Session auth via signed HMAC cookie (not header) | Prevents client impersonation; works with edge runtime |
| **ADR-002** | Zod validation on ALL API boundaries | Runtime safety > developer convenience; catches drift early |
| **ADR-003** | Single lock file (bun.lock only) | `package-lock.json` is noise; removes supply-chain confusion |
| **ADR-004** | Mini-service deployed separately (Render/Railway) | WebSocket + serverless don't mix; keeps Next.js cold-start fast |
| **ADR-005** | Persistent Postgres for production (Neon/Supabase) | Ephemeral `/tmp` SQLite loses data on every cold start |

---

## Related Skills & References

- `dohnut-nextjs-app` skill — full project knowledge base
- `references/dohnut-nextjs-review-findings.md` — prior audit details
- `references/dohnut-z-known-issues.md` — living issue tracker
- `systematic-debugging` — for race conditions
- `writing-plans` — for fix execution plans
- `test-driven-development` — when adding tests

---

## Next Actions for User

1. **Confirm Phase 1 start** — I'll execute security fixes first (rotate key, untrack .env, HMAC session)
2. **Decide on session auth approach** — HMAC cookie vs httpOnly cookie (both need middleware)
3. **Choose rate limiter** — Upstash Redis (free tier) vs in-memory (simpler, single-instance only)
4. **Prioritize PWA vs Mini-service** — Both blocked by different issues; which unblocks your demo?

**File saved to:** `/g/THISISDOH-NUT/IMPROVEMENT_PLAN.md`