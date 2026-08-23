import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureReady } from "@/lib/ensure-ready";
import { getSessionId } from "@/lib/session";
import { serializeReview } from "@/lib/serialize";

// POST /api/donuts/[id]/reviews  { author, rating (1-5), comment, sessionId? }
// After insert, recompute donut.rating as the average of all its reviews.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureReady();
    const { id } = await params;
    const body = await request.json();
    const author = String(body.author ?? "").trim();
    const ratingRaw = Number(body.rating);
    const comment = String(body.comment ?? "").trim();
    const sessionId = body.sessionId || getSessionId(request);

    if (!author) {
      return NextResponse.json(
        { error: "author is required" },
        { status: 400 }
      );
    }
    if (!Number.isFinite(ratingRaw) || ratingRaw < 1 || ratingRaw > 5) {
      return NextResponse.json(
        { error: "rating must be between 1 and 5" },
        { status: 400 }
      );
    }
    const rating = Math.round(ratingRaw);

    const donut = await db.donut.findUnique({ where: { id } });
    if (!donut) {
      return NextResponse.json(
        { error: "Donut not found" },
        { status: 404 }
      );
    }

    const created = await db.review.create({
      data: {
        donutId: id,
        sessionId,
        author,
        rating,
        comment,
      },
    });

    // recompute average rating
    const agg = await db.review.aggregate({
      where: { donutId: id },
      _avg: { rating: true },
    });
    const newRating = agg._avg.rating ?? 4.5;
    await db.donut.update({
      where: { id },
      data: { rating: Math.round(newRating * 10) / 10 },
    });

    return NextResponse.json(serializeReview(created));
  } catch (err) {
    console.error("[api/donuts/[id]/reviews POST]", err);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    );
  }
}
