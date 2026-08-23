import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ensureReady } from "@/lib/ensure-ready";
import { getBillplzConfig, verifyWebhook } from "@/lib/billplz";

/**
 * Billplz posts a webhook here when payment status changes.
 * The request body is application/x-www-form-urlencoded and the signature
 * is passed in the X-Signature header (hex HMAC-SHA256).
 */
export async function POST(req: NextRequest) {
  await ensureReady();
  const cfg = getBillplzConfig();
  if (!cfg) {
    return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  }

  const rawBody = await req.text();
  const xSignature = req.headers.get("x-signature");

  const valid = await verifyWebhook(cfg, rawBody, xSignature);
  if (!valid) {
    return NextResponse.json({ ok: false, reason: "bad_signature" }, { status: 401 });
  }

  const params = new URLSearchParams(rawBody);
  const billId = params.get("id");
  const paid = params.get("paid") === "true";
  const paidAmount = params.get("paid_amount");
  const reference1 = params.get("reference_1"); // our order id

  if (!billId || !reference1) {
    return NextResponse.json({ ok: false, reason: "missing_fields" }, { status: 400 });
  }

  const order = await db.order.findUnique({ where: { id: reference1 } });
  if (!order) {
    return NextResponse.json({ ok: false, reason: "order_not_found" }, { status: 404 });
  }

  if (paid && !order.paidAt) {
    await db.order.update({
      where: { id: order.id },
      data: {
        paidAt: new Date(),
        paidAmount: paidAmount ? Number(paidAmount) / 100 : order.total,
        status: "preparing", // kick off order prep
      },
    });
    await db.orderEvent.create({
      data: {
        orderId: order.id,
        status: "preparing",
        message: "Payment received — starting to bake! 🍩",
      },
    });
  } else if (!paid && order.paidAt) {
    // Refund / chargeback — revert to unpaid.
    await db.order.update({
      where: { id: order.id },
      data: { paidAt: null, paidAmount: null, status: "preparing" },
    });
  }

  return NextResponse.json({ ok: true });
}

/** Billplz uses GET for its redirect verification (ping). */
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Billplz webhook endpoint operational",
  });
}
