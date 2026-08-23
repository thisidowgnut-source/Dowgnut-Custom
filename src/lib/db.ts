import { PrismaClient } from "@prisma/client";

// On Vercel (serverless), the filesystem is read-only except for /tmp.
// The local dev DB lives at /home/z/my-project/db/custom.db via DATABASE_URL.
// For Vercel we rewrite the SQLite path to /tmp so the app can create and
// write the ephemeral DB on every cold start. The schema is applied and the
// catalog re-seeded lazily by `src/lib/ensure-ready.ts` on first request.
//
// NOTE: this ephemeral SQLite is intended for demo/showcase deploys. Data
// (cart, orders, reviews) resets on cold starts. For persistent storage on
// Vercel, switch the Prisma provider to `postgresql` and point DATABASE_URL
// at Vercel Postgres / Neon / Supabase — see VERCEL_DEPLOY.md.
function resolveDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL ?? "file:./db/custom.db";
  if (process.env.VERCEL) {
    // Force the SQLite file into /tmp (the only writable dir on Vercel).
    return "file:/tmp/dowgnut.db";
  }
  return raw;
}

process.env.DATABASE_URL = resolveDatabaseUrl();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Keep query logging for local dev only — noisy + slow in serverless.
    log: process.env.NODE_ENV === "production" ? ["error", "warn"] : ["query"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
