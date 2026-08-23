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

// PATCH /api/cart/[id]  { quantity }  →  CartItem[]  (delete if quantity <= 0)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureReady();
    const { id } = await params;
    const sessionId = getSessionId(request);
    const body = await request.json();
    const qty = Math.floor(Number(body.quantity ?? 0));

    const item = await db.cartItem.findUnique({ where: { id } });
    if (!item || item.sessionId !== sessionId) {
      return NextResponse.json(
        { error: "Cart item not found" },
        { status: 404 }
      );
    }

    if (!Number.isFinite(qty) || qty <= 0) {
      await db.cartItem.delete({ where: { id } });
    } else {
      await db.cartItem.update({ where: { id }, data: { quantity: qty } });
    }

    return NextResponse.json(await fetchCart(sessionId));
  } catch (err) {
    console.error("[api/cart/[id] PATCH]", err);
    return NextResponse.json(
      { error: "Failed to update cart item" },
      { status: 500 }
    );
  }
}

// DELETE /api/cart/[id]  →  CartItem[]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureReady();
    const { id } = await params;
    const sessionId = getSessionId(request);

    const item = await db.cartItem.findUnique({ where: { id } });
    if (!item || item.sessionId !== sessionId) {
      return NextResponse.json(
        { error: "Cart item not found" },
        { status: 404 }
      );
    }
    await db.cartItem.delete({ where: { id } });

    return NextResponse.json(await fetchCart(sessionId));
  } catch (err) {
    console.error("[api/cart/[id] DELETE]", err);
    return NextResponse.json(
      { error: "Failed to remove cart item" },
      { status: 500 }
    );
  }
}
