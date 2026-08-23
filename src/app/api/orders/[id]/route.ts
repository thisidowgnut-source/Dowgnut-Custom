import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureReady } from "@/lib/ensure-ready";
import { getSessionId } from "@/lib/session";
import { serializeOrder } from "@/lib/serialize";

// GET /api/orders/[id]  →  Order (with items)
// Ownership check: the order's session must match the caller's session.
// A valid admin key bypasses the check (the admin dashboard needs it).
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureReady();
    const { id } = await params;
    const order = await db.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Fail-closed ownership check (admin key may bypass).
    const adminKey = process.env.ADMIN_API_KEY;
    const providedAdmin = request.headers.get("x-admin-key");
    const isAdmin =
      !!adminKey && !!providedAdmin && providedAdmin === adminKey;
    if (!isAdmin) {
      const sessionId = getSessionId(request);
      if (order.sessionId !== sessionId) {
        // 404 (not 403) to avoid confirming the order id exists.
        return NextResponse.json(
          { error: "Order not found" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(serializeOrder(order));
  } catch (err) {
    console.error("[api/orders/[id] GET]", err);
    return NextResponse.json(
      { error: "Failed to load order" },
      { status: 500 }
    );
  }
}
