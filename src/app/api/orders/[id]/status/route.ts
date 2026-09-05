import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureReady } from "@/lib/ensure-ready";
import { serializeOrder } from "@/lib/serialize";
import { requireAdmin } from "@/lib/admin-auth";

const VALID_STATUSES = new Set([
  "preparing",
  "baking",
  "out_for_delivery",
  "delivered",
]);

class UnpaidOrderTransitionError extends Error {}

// PATCH /api/orders/[id]/status  { status }  →  Order
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureReady();
    // Fail-closed admin check (rejects when key unset, wrong key, or dev).
    const denied = requireAdmin(request);
    if (denied) return denied;
    const { id } = await params;
    const body = await request.json();
    const status = String(body.status ?? "").trim();

    if (!VALID_STATUSES.has(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${[...VALID_STATUSES].join(", ")}` },
        { status: 400 }
      );
    }

    const existing = await db.order.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    if (!existing.paidAt) {
      return NextResponse.json(
        { error: "Payment must be confirmed before fulfilment can begin" },
        { status: 409 },
      );
    }

    const updated = await db.$transaction(async (tx) => {
      const transition = await tx.order.updateMany({
        where: { id, paidAt: { not: null } },
        data: { status },
      });
      if (transition.count !== 1) throw new UnpaidOrderTransitionError();

      const order = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!order) throw new Error("Order disappeared during status transition");

      // Keep the status and its audit event atomic.
      await tx.orderEvent.create({
        data: {
          orderId: id,
          status,
          message: `Status updated to ${status.replace(/_/g, " ")} by admin.`,
        },
      });
      return order;
    });

    return NextResponse.json(serializeOrder(updated));
  } catch (err) {
    if (err instanceof UnpaidOrderTransitionError) {
      return NextResponse.json(
        { error: "Payment must be confirmed before fulfilment can begin" },
        { status: 409 },
      );
    }
    console.error("[api/orders/[id]/status PATCH]", err);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
}
