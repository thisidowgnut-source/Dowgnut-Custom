import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureReady } from "@/lib/ensure-ready";
import { getSessionId } from "@/lib/session";
import { serializeFavorite } from "@/lib/serialize";

async function fetchFavorites(sessionId: string) {
  const rows = await db.favorite.findMany({
    where: { sessionId },
    include: { donut: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(serializeFavorite);
}

// DELETE /api/favorites/[id]  (id = donutId)  →  Favorite[]
// Removes the favorite matching both donutId and the calling session.
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureReady();
    const { id } = await params;
    const sessionId = getSessionId(request);
    const donutId = id;

    const existing = await db.favorite.findUnique({
      where: { sessionId_donutId: { sessionId, donutId } },
    });
    if (existing) {
      await db.favorite.delete({ where: { id: existing.id } });
    }

    return NextResponse.json(await fetchFavorites(sessionId));
  } catch (err) {
    console.error("[api/favorites/[id] DELETE]", err);
    return NextResponse.json(
      { error: "Failed to remove favorite" },
      { status: 500 }
    );
  }
}
