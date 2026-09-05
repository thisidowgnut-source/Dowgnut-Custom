// Ensures the SQLite schema exists and the donut catalog is seeded.
//
// On Vercel, every cold start gets a fresh /tmp/dowgnut.db (see src/lib/db.ts),
// so we must (1) create the tables and (2) seed the catalog before serving the
// first request. Both steps are idempotent and guarded by an in-process flag so
// they run at most once per warm instance.
//
// For a persistent production DB (Vercel Postgres / Neon / Supabase), switch
// the Prisma provider to `postgresql`, run `prisma db push` once, and this
// module becomes a harmless no-op (tables already exist, catalog already
// seeded by `bun prisma/seed.ts`).

import { db } from "@/lib/db";
import { SEED_DONUTS } from "@/lib/seed-data";

// Raw DDL mirroring prisma/schema.prisma (SQLite flavour). Using IF NOT EXISTS
// keeps it safe to run on an already-initialised DB.
const DDL = [
  `CREATE TABLE IF NOT EXISTS "Donut" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "imgUrl" TEXT NOT NULL,
    "tags" TEXT NOT NULL DEFAULT '',
    "rating" REAL NOT NULL DEFAULT 4.5,
    "calories" INTEGER NOT NULL DEFAULT 250,
    "sugar" INTEGER NOT NULL DEFAULT 10,
    "fat" INTEGER NOT NULL DEFAULT 8,
    "stock" INTEGER NOT NULL DEFAULT 50,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Donut_name_key" UNIQUE ("name")
  )`,
  `CREATE TABLE IF NOT EXISTS "CartItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "donutId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CartItem_sessionId_donutId_key" UNIQUE ("sessionId", "donutId"),
    CONSTRAINT "CartItem_donutId_fkey" FOREIGN KEY ("donutId") REFERENCES "Donut" ("id") ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Favorite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "donutId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Favorite_sessionId_donutId_key" UNIQUE ("sessionId", "donutId"),
    CONSTRAINT "Favorite_donutId_fkey" FOREIGN KEY ("donutId") REFERENCES "Donut" ("id") ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT '',
    "zip" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "subtotal" REAL NOT NULL,
    "delivery" REAL NOT NULL DEFAULT 3.99,
    "sst" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_payment',
    "etaMinutes" INTEGER NOT NULL DEFAULT 25,
    "paymentMethod" TEXT NOT NULL DEFAULT '',
    "paymentRef" TEXT,
    "paymentUrl" TEXT,
    "paidAt" DATETIME,
    "paidAmount" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "OrderEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrderEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "donutId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "imgUrl" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE,
    CONSTRAINT "OrderItem_donutId_fkey" FOREIGN KEY ("donutId") REFERENCES "Donut" ("id") ON DELETE RESTRICT
  )`,
  `CREATE TABLE IF NOT EXISTS "Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "donutId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_donutId_fkey" FOREIGN KEY ("donutId") REFERENCES "Donut" ("id") ON DELETE CASCADE
  )`,
];

// Migration patches for databases created by an OLDER version of this DDL
// (pre-payment columns / pre-OrderEvent). SQLite has no "ADD COLUMN IF NOT
// EXISTS", so we check PRAGMA table_info first. Each entry is
// [table, column, ALTER statement].
const DDL_MIGRATIONS: Array<[string, string, string]> = [
  ["Order", "customerPhone", `ALTER TABLE "Order" ADD COLUMN "customerPhone" TEXT NOT NULL DEFAULT ''`],
  ["Order", "state", `ALTER TABLE "Order" ADD COLUMN "state" TEXT NOT NULL DEFAULT ''`],
  ["Order", "sst", `ALTER TABLE "Order" ADD COLUMN "sst" REAL NOT NULL DEFAULT 0`],
  ["Order", "paymentMethod", `ALTER TABLE "Order" ADD COLUMN "paymentMethod" TEXT NOT NULL DEFAULT ''`],
  ["Order", "paymentRef", `ALTER TABLE "Order" ADD COLUMN "paymentRef" TEXT`],
  ["Order", "paymentUrl", `ALTER TABLE "Order" ADD COLUMN "paymentUrl" TEXT`],
  ["Order", "paidAt", `ALTER TABLE "Order" ADD COLUMN "paidAt" DATETIME`],
  ["Order", "paidAmount", `ALTER TABLE "Order" ADD COLUMN "paidAmount" REAL`],
];

let ready: Promise<void> | null = null;

async function ensureReadyOnce(): Promise<void> {
  // 1. Apply schema (idempotent).
  for (const stmt of DDL) {
    await db.$executeRawUnsafe(stmt);
  }

  // 1b. Patch legacy databases missing newer columns (pre-payment DDL).
  for (const [table, column, alter] of DDL_MIGRATIONS) {
    const cols = (await db.$queryRawUnsafe(
      `PRAGMA table_info("${table}")`,
    )) as Array<{ name: string }>;
    if (cols.length > 0 && !cols.some((c) => c.name === column)) {
      await db.$executeRawUnsafe(alter);
      console.log(`[ensure-ready] Migrated ${table}.${column}`);
    }
  }

  // 2. Seed catalog if empty.
  const count = await db.donut.count();
  if (count === 0) {
    for (const d of SEED_DONUTS) {
      await db.donut.upsert({
        where: { name: d.name },
        update: {},
        create: {
          name: d.name,
          description: d.description,
          price: d.price,
          type: d.type,
          imgUrl: d.imgUrl,
          tags: d.tags,
          rating: d.rating,
          calories: d.calories,
          sugar: d.sugar,
          fat: d.fat,
          stock: d.stock,
          featured: d.featured,
        },
      });
    }
    console.log(`[ensure-ready] Seeded ${SEED_DONUTS.length} donuts.`);
  }
}

/**
 * Lazily initialises the SQLite schema + catalog on the first request of a
 * warm instance. Safe to call from any API route; no-op after the first run.
 */
export function ensureReady(): Promise<void> {
  if (!ready) {
    ready = ensureReadyOnce().catch((err) => {
      // Reset so a subsequent request can retry.
      ready = null;
      console.error("[ensure-ready] FAILED:", err);
      throw err;
    });
  }
  return ready;
}
