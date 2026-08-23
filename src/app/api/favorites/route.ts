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

// GET /api/favorites  →  Favorite[]
export async function GET(request: Request) {
  try {
    await ensureReady();
    const sessionId = getSessionId(request);
    return NextResponse.json(await fetchFavorites(sessionId));
  } catch (err) {
    console.error("[api/favorites GET]", err);
    return NextResponse.json(
      { error: "Failed to load favorites" },
      { status: 500 }
    );
  }
}

// POST /api/favorites  { donutId }  →  Favorite[]  (ignore duplicates)
export async function POST(request: Request) {
  try {
    await ensureReady();
    const sessionId = getSessionId(request);
    const body = await request.json();
    const donutId = String(body.donutId ?? "");

    if (!donutId) {
      return NextResponse.json(
        { error: "donutId is required" },
        { status: 400 }
      );
    }

    const donut = await db.donut.findUnique({ where: { id: donutId } });
    if (!donut) {
      return NextResponse.json(
        { error: "Donut not found" },
        { status: 404 }
      );
    }

    const existing = await db.favorite.findUnique({
      where: { sessionId_donutId: { sessionId, donutId } },
    });
    if (!existing) {
      await db.favorite.create({ data: { sessionId, donutId } });
    }

    return NextResponse.json(await fetchFavorites(sessionId));
  } catch (err) {
    console.error("[api/favorites POST]", err);
    return NextResponse.json(
      { error: "Failed to add favorite" },
      { status: 500 }
    );
  }
}
