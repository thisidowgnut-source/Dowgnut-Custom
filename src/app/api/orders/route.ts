import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureReady } from "@/lib/ensure-ready";
import { computePricing } from "@/lib/pricing";
import { serializeOrder } from "@/lib/serialize";
import { getSessionId } from "@/lib/session";

// POST /api/orders  { customerName, customerEmail, customerPhone?, address, city, state?, zip, notes?, paymentMethod? }
// - reads session cart and snapshots each item without consuming inventory or
//   clearing the cart. Those irreversible steps happen only after payment.
export async function POST(request: Request) {
  try {
    await ensureReady();
    const body = await request.json();
    const sessionId = getSessionId(request);
    const customerName = String(body.customerName ?? "").trim();
    const customerEmail = String(body.customerEmail ?? "").trim();
    const customerPhone = String(body.customerPhone ?? "").trim();
    const address = String(body.address ?? "").trim();
    const city = String(body.city ?? "").trim();
    const state = String(body.state ?? "").trim();
    const zip = String(body.zip ?? "").trim();
    const notes = String(body.notes ?? "").trim();
    const paymentMethod = String(body.paymentMethod ?? "").trim();

    if (!customerName || !customerEmail || !address || !city || !zip) {
      return NextResponse.json(
        { error: "Missing required customer fields" },
        { status: 400 }
      );
    }

    const cart = await db.cartItem.findMany({
      where: { sessionId },
      include: { donut: true },
    });
    if (cart.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      );
    }

    const unavailable = cart.find((item) => item.quantity > item.donut.stock);
    if (unavailable) {
      return NextResponse.json(
        {
          error: `Insufficient stock for ${unavailable.donut.name} — please refresh and try again.`,
        },
        { status: 409 },
      );
    }

    // Single source of pricing truth — identical to what the cart drawer
    // and checkout view display (threshold is >=, matching the UI).
    const subtotal = cart.reduce(
      (sum, item) => sum + item.donut.price * item.quantity,
      0
    );
    const { delivery, sst, total } = computePricing(subtotal);

    // The order is intentionally non-fulfillable until a signed payment
    // callback confirms funds. Keeping the cart intact provides a retry path
    // when Billplz is unavailable or the customer cancels.
    const order = await db.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          sessionId,
          customerName,
          customerEmail,
          customerPhone,
          address,
          city,
          state,
          zip,
          notes,
          subtotal,
          delivery,
          sst,
          total,
          paymentMethod,
          status: "pending_payment",
          etaMinutes: 25,
          items: {
            create: cart.map((item) => ({
              donutId: item.donutId,
              name: item.donut.name,
              price: item.donut.price,
              imgUrl: item.donut.imgUrl,
              quantity: item.quantity,
            })),
          },
        },
        include: { items: true },
      });

      await tx.orderEvent.create({
        data: {
          orderId: created.id,
          status: "pending_payment",
          message: "Order saved — awaiting payment confirmation.",
        },
      });

      return created;
    });

    return NextResponse.json(serializeOrder(order));
  } catch (err: any) {
    console.error("[api/orders POST]", err);
    // Stock failures thrown from the transaction are user-actionable —
    // surface them as 409 instead of a generic 500.
    if (err?.message?.startsWith("Insufficient stock")) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

// GET /api/orders  →  Order[] for the request session (newest first)
export async function GET(request: Request) {
  try {
    await ensureReady();
    const sessionId = getSessionId(request);

    const orders = await db.order.findMany({
      where: { sessionId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orders.map(serializeOrder));
  } catch (err) {
    console.error("[api/orders GET]", err);
    return NextResponse.json(
      { error: "Failed to load orders" },
      { status: 500 }
    );
  }
}
