import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureReady } from "@/lib/ensure-ready";
import { serializeOrder } from "@/lib/serialize";

const DELIVERY_FLAT = 3.99;
const FREE_DELIVERY_THRESHOLD = 25;

// POST /api/orders  { sessionId, customerName, customerEmail, customerPhone?, address, city, state?, zip, notes?, paymentMethod? }
// - reads session cart, snapshots each item, decrements donut stock,
//   clears cart, returns the created Order with items.
export async function POST(request: Request) {
  try {
    await ensureReady();
    const body = await request.json();
    const sessionId = String(body.sessionId ?? "").trim();
    const customerName = String(body.customerName ?? "").trim();
    const customerEmail = String(body.customerEmail ?? "").trim();
    const customerPhone = String(body.customerPhone ?? "").trim();
    const address = String(body.address ?? "").trim();
    const city = String(body.city ?? "").trim();
    const state = String(body.state ?? "").trim();
    const zip = String(body.zip ?? "").trim();
    const notes = String(body.notes ?? "").trim();
    const paymentMethod = String(body.paymentMethod ?? "").trim();

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }
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

    // Validate stock
    for (const item of cart) {
      if (item.donut.stock < item.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${item.donut.name} (have ${item.donut.stock}, need ${item.quantity})`,
          },
          { status: 409 }
        );
      }
    }

    const subtotal = cart.reduce(
      (sum, item) => sum + item.donut.price * item.quantity,
      0
    );
    const delivery = subtotal > FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FLAT;
    const sst = subtotal * 0.06; // 6% SST (Malaysia)
    const total = subtotal + delivery + sst;

    // Create order + items + decrement stock + clear cart in a transaction.
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
          status: "preparing",
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

      for (const item of cart) {
        await tx.donut.update({
          where: { id: item.donutId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      await tx.cartItem.deleteMany({ where: { sessionId } });

      return created;
    });

    return NextResponse.json(serializeOrder(order));
  } catch (err) {
    console.error("[api/orders POST]", err);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

// GET /api/orders?sessionId=...  →  Order[] (newest first, with items)
export async function GET(request: Request) {
  try {
    await ensureReady();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId") ?? "";

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId query param is required" },
        { status: 400 }
      );
    }

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
