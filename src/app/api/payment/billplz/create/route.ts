import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ensureReady } from "@/lib/ensure-ready";
import { createBill, getBillplzConfig } from "@/lib/billplz";
import {
  claimOrderPaymentStart,
  confirmOrderPayment,
  markOrderPaymentFailed,
} from "@/lib/order-payment-lifecycle";
import { getSessionId } from "@/lib/session";

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
  const sessionId = getSessionId(req);
  // SECURITY: Ownership check (BZ-04). CUIDs are time-ordered and not
  // cryptographically unguessable — without this gate, any client that
  // knows an orderId could trigger a Billplz payment on someone else's
  // behalf. We return 404 (not 403) to avoid leaking the order's existence.
  if (order.sessionId !== sessionId) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.paidAt) {
    return NextResponse.json({ error: "Order already paid" }, { status: 409 });
  }

  if (order.paymentUrl && order.paymentRef) {
    return NextResponse.json({
      mode: "live",
      paymentUrl: order.paymentUrl,
      billId: order.paymentRef,
    });
  }

  const claimed = await claimOrderPaymentStart(order.id);
  if (!claimed) {
    const current = await db.order.findUnique({ where: { id: order.id } });
    if (current?.paidAt) {
      return NextResponse.json({ error: "Order already paid" }, { status: 409 });
    }
    if (current?.paymentUrl && current.paymentRef) {
      return NextResponse.json({
        mode: "live",
        paymentUrl: current.paymentUrl,
        billId: current.paymentRef,
      });
    }
    return NextResponse.json(
      { error: "Payment is already being initialized", status: "payment_starting" },
      { status: 409 },
    );
  }

  const cfg = getBillplzConfig();

  // Development-only fallback. Production can never opt into simulated
  // payment, even through an environment override.
  if (!cfg) {
    if (process.env.NODE_ENV === "production") {
      console.error("[billplz] missing credentials in production — refusing dev fallback");
      await markOrderPaymentFailed(order.id);
      return NextResponse.json(
        { error: "Payment gateway not configured" },
        { status: 503 },
      );
    }
    await confirmOrderPayment({
      orderId: order.id,
      paidAmount: order.total,
      message: "Dev payment received — starting to bake! 🍩",
    });
    return NextResponse.json({
      mode: "dev",
      paymentUrl: null,
      billId: `dev-${order.id}`,
    });
  }

  // Redirect/callback URLs must point at OUR origin. Trust the Origin header
  // only in dev; production requires NEXT_PUBLIC_BASE_URL so a spoofed
  // Origin can't redirect payers to an attacker host.
  const envBase = process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.NODE_ENV === "production" && !envBase) {
    console.error("[billplz] NEXT_PUBLIC_BASE_URL missing in production");
    await markOrderPaymentFailed(order.id);
    return NextResponse.json(
      { error: "Payment gateway not configured (base URL)" },
      { status: 503 },
    );
  }
  const baseUrl = envBase || (req.headers.get("origin") ?? "http://localhost:3000");
  // The SPA verifies this order against our API after the redirect. The
  // parameter identifies an order; it never asserts that payment succeeded.
  const redirectUrl = `${baseUrl}/?payment_return=${order.id}`;
  const callbackUrl = `${baseUrl}/api/payment/billplz/webhook`;

  try {
    const bill = await createBill(cfg, {
      amount: order.total,
      description: `DOHNUT order #${order.id.slice(0, 8)}`,
      referenceId: order.id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone || "+60000000000",
      redirectUrl,
      callbackUrl,
    });

    const stored = await db.order.updateMany({
      where: {
        id: order.id,
        paidAt: null,
        paymentRef: null,
        paymentUrl: null,
        status: "payment_starting",
      },
      data: {
        paymentRef: bill.id,
        paymentUrl: bill.url,
        paymentMethod: "billplz",
        status: "pending_payment",
      },
    });
    if (stored.count !== 1) {
      throw new Error("Payment initiation claim was lost before bill persistence");
    }

    return NextResponse.json({
      mode: "live",
      paymentUrl: bill.url,
      billId: bill.id,
    });
  } catch (err: any) {
    // Log the full upstream detail server-side; return a generic message
    // so Billplz API internals never leak to the browser.
    console.error("[billplz] create failed:", err?.message);
    await markOrderPaymentFailed(order.id);
    return NextResponse.json(
      { error: "Could not create payment bill. Please try again." },
      { status: 502 },
    );
  }
}
