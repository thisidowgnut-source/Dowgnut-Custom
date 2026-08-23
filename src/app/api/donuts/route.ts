import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeDonut } from "@/lib/serialize";
import { ensureReady } from "@/lib/ensure-ready";

// GET /api/donuts?type=all|classic|sprinkled|stuffed|specialty&search=&sort=featured|price-asc|price-desc|rating|name&featured=true
export async function GET(request: Request) {
  try {
    // Ensure schema + catalog exist (matters on Vercel cold starts).
    await ensureReady();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") ?? "all";
    const search = (searchParams.get("search") ?? "").trim().toLowerCase();
    const sort = searchParams.get("sort") ?? "featured";
    const featuredOnly = searchParams.get("featured") === "true";

    const where: any = {};
    if (type && type !== "all") where.type = type;
    if (featuredOnly) where.featured = true;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { tags: { contains: search } },
      ];
    }

    let orderBy: any = { createdAt: "asc" };
    switch (sort) {
      case "price-asc":
        orderBy = { price: "asc" };
        break;
      case "price-desc":
        orderBy = { price: "desc" };
        break;
      case "rating":
        orderBy = { rating: "desc" };
        break;
      case "name":
        orderBy = { name: "asc" };
        break;
      default:
        orderBy = { createdAt: "asc" };
        break;
    }

    const rows = await db.donut.findMany({ where, orderBy });
    const donuts = rows.map(serializeDonut);
    return NextResponse.json(donuts);
  } catch (err) {
    console.error("[api/donuts GET]", err);
    return NextResponse.json(
      { error: "Failed to load donuts" },
      { status: 500 }
    );
  }
}
