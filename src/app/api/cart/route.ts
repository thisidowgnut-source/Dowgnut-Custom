import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureReady } from "@/lib/ensure-ready";
import { getSessionId } from "@/lib/session";
import { serializeCartItem } from "@/lib/serialize";

async function fetchCart(sessionId: string) {
  const items = await db.cartItem.findMany({
    where: { sessionId },
    include: { donut: true },
    orderBy: { createdAt: "asc" },
  });
  return items.map(serializeCartItem);
}

// GET /api/cart  →  CartItem[] (for the calling session)
export async function GET(request: Request) {
  try {
    await ensureReady();
    const sessionId = getSessionId(request);
    return NextResponse.json(await fetchCart(sessionId));
  } catch (err) {
    console.error("[api/cart GET]", err);
    return NextResponse.json(
      { error: "Failed to load cart" },
      { status: 500 }
    );
  }
}

// POST /api/cart  { donutId, quantity? }  →  CartItem[] (upsert, increment if exists)
export async function POST(request: Request) {
  try {
    await ensureReady();
    const sessionId = getSessionId(request);
    const body = await request.json();
    const donutId = String(body.donutId ?? "");
    const qty = Math.max(1, Math.floor(Number(body.quantity ?? 1) || 1));

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

    const existing = await db.cartItem.findUnique({
      where: { sessionId_donutId: { sessionId, donutId } },
    });

    if (existing) {
      await db.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + qty },
      });
    } else {
      await db.cartItem.create({
        data: { sessionId, donutId, quantity: qty },
      });
    }

    return NextResponse.json(await fetchCart(sessionId));
  } catch (err) {
    console.error("[api/cart POST]", err);
    return NextResponse.json(
      { error: "Failed to add to cart" },
      { status: 500 }
    );
  }
}
