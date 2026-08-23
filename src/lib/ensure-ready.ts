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
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "subtotal" REAL NOT NULL,
    "delivery" REAL NOT NULL DEFAULT 3.99,
    "total" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'preparing',
    "etaMinutes" INTEGER NOT NULL DEFAULT 25,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
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

let ready: Promise<void> | null = null;

async function ensureReadyOnce(): Promise<void> {
  // 1. Apply schema (idempotent).
  for (const stmt of DDL) {
    await db.$executeRawUnsafe(stmt);
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
