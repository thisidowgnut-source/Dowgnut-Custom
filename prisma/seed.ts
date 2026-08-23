// DowgNut seed script — idempotent (upsert by name).
// Run with:  bun prisma/seed.ts
// Seed data lives in src/lib/seed-data.ts (shared with runtime auto-seed).

import { db } from "../src/lib/db";
import { SEED_DONUTS } from "../src/lib/seed-data";

const DONUTS = SEED_DONUTS;

async function main() {
  console.log(`[seed] Upserting ${DONUTS.length} donuts…`);
  let created = 0;
  let updated = 0;

  for (const d of DONUTS) {
    const res = await db.donut.upsert({
      where: { name: d.name },
      update: {
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
    // detect insert vs update by checking createdAt vs updatedAt
    const isNew = res.createdAt.getTime() === res.updatedAt.getTime();
    if (isNew) created++;
    else updated++;
  }

  const total = await db.donut.count();
  console.log(
    `[seed] Done. Inserted ${created}, updated ${updated}. Total donuts in DB: ${total}`
  );
}

main()
  .catch((e) => {
    console.error("[seed] FAILED:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
