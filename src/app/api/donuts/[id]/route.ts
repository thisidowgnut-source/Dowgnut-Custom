import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureReady } from "@/lib/ensure-ready";
import { serializeDonut, serializeReview } from "@/lib/serialize";

// GET /api/donuts/[id]  →  { donut, reviews }
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureReady();
    const { id } = await params;
    const donut = await db.donut.findUnique({ where: { id } });
    if (!donut) {
      return NextResponse.json(
        { error: "Donut not found" },
        { status: 404 }
      );
    }
    const reviews = await db.review.findMany({
      where: { donutId: id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({
      donut: serializeDonut(donut),
      reviews: reviews.map(serializeReview),
    });
  } catch (err) {
    console.error("[api/donuts/[id] GET]", err);
    return NextResponse.json(
      { error: "Failed to load donut" },
      { status: 500 }
    );
  }
}
