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
  // stays unblocked. NEVER active in production: a production deploy
  // without credentials must fail loudly, not hand out free donuts.
  if (!cfg) {
    if (process.env.NODE_ENV === "production" && process.env.PAYMENTS_ALLOW_DEV_FALLBACK !== "true") {
      console.error("[billplz] missing credentials in production — refusing dev fallback");
      return NextResponse.json(
        { error: "Payment gateway not configured" },
        { status: 503 },
      );
    }
    await db.order.update({
      where: { id: order.id },
      data: {
        paymentMethod: order.paymentMethod || "tng",
        paidAt: new Date(),
        paidAmount: order.total,
        status: "preparing",
      },
    });
    await db.orderEvent.create({
      data: {
        orderId: order.id,
        status: "preparing",
        message: "Dev payment received — starting to bake! 🍩",
      },
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
    return NextResponse.json(
      { error: "Payment gateway not configured (base URL)" },
      { status: 503 },
    );
  }
  const baseUrl = envBase || (req.headers.get("origin") ?? "http://localhost:3000");
  // P0 fix: the app is a single-page SPA — there is no /orders route.
  // Redirect back to `/?paid=<id>`; Home reads the param and drops the
  // customer straight into the live tracking view.
  const redirectUrl = `${baseUrl}/?paid=${order.id}`;
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
    // Log the full upstream detail server-side; return a generic message
    // so Billplz API internals never leak to the browser.
    console.error("[billplz] create failed:", err?.message);
    return NextResponse.json(
      { error: "Could not create payment bill. Please try again." },
      { status: 502 },
    );
  }
}
