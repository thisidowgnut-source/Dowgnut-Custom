import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ensureReady } from "@/lib/ensure-ready";
import { createBill, getBillplzConfig } from "@/lib/billplz";

const Body = z.object({
  orderId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  await ensureReady();
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const order = await db.order.findUnique({ where: { id: parsed.data.orderId } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.paidAt) {
    return NextResponse.json({ error: "Order already paid" }, { status: 409 });
  }

  const cfg = getBillplzConfig();

  // Dev fallback — no Billplz creds → simulate success so checkout flow
  // stays unblocked. Mark the order as paid immediately.
  if (!cfg) {
    await db.order.update({
      where: { id: order.id },
      data: {
        paymentMethod: order.paymentMethod || "tng",
        paidAt: new Date(),
        paidAmount: order.total,
        status: "preparing",
      },
    });
    return NextResponse.json({
      mode: "dev",
      paymentUrl: null,
      billId: `dev-${order.id}`,
    });
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (req.headers.get("origin") ?? "http://localhost:3000");
  const redirectUrl = `${baseUrl}/orders?paid=${order.id}`;
  const callbackUrl = `${baseUrl}/api/payment/billplz/webhook`;

  try {
    const bill = await createBill(cfg, {
      amount: order.total,
      description: `DowgNut order #${order.id.slice(0, 8)}`,
      referenceId: order.id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone || "+60000000000",
      redirectUrl,
      callbackUrl,
    });

    await db.order.update({
      where: { id: order.id },
      data: {
        paymentRef: bill.id,
        paymentUrl: bill.url,
        paymentMethod: "billplz",
      },
    });

    return NextResponse.json({
      mode: "live",
      paymentUrl: bill.url,
      billId: bill.id,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Billplz create failed" },
      { status: 502 },
    );
  }
}
