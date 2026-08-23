import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ensureReady } from "@/lib/ensure-ready";
import { getBillplzConfig, verifyWebhook } from "@/lib/billplz";

/**
 * Billplz posts a webhook here when payment status changes.
 * The request body is application/x-www-form-urlencoded and the signature
 * is passed as the `x_signature` FORM FIELD (hex HMAC-SHA256 over the
 * sorted `key+value` pipe-joined source string — see lib/billplz.ts).
 */
export async function POST(req: NextRequest) {
  await ensureReady();
  const cfg = getBillplzConfig();
  if (!cfg) {
    return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  }

  const rawBody = await req.text();
  const params = new URLSearchParams(rawBody);
  // Billplz sends the signature as a form field (some clients also mirror
  // it in a header — accept either, but the body field is the documented one).
  const xSignature = params.get("x_signature") ?? req.headers.get("x-signature");

  const valid = await verifyWebhook(cfg, rawBody, xSignature);
  if (!valid) {
    return NextResponse.json({ ok: false, reason: "bad_signature" }, { status: 401 });
  }

  const billId = params.get("id");
  const paid = params.get("paid") === "true";
  const paidAmount = params.get("paid_amount");
  const reference1 = params.get("reference_1"); // our order id

  if (!billId || !reference1) {
    return NextResponse.json({ ok: false, reason: "missing_fields" }, { status: 400 });
  }

  const order = await db.order.findUnique({ where: { id: reference1 } });
  if (!order) {
    // Unknown reference but VALID signature — ack 200 so Billplz stops
    // retrying (a 404 makes them retry forever and degrade account rank).
    console.warn("[billplz] webhook for unknown order:", reference1);
    return NextResponse.json({ ok: true, ignored: "order_not_found" });
  }

  // Cross-check: the bill id must match the one we created for this order.
  if (order.paymentRef && order.paymentRef !== billId) {
    console.warn(
      `[billplz] bill id mismatch for order ${order.id}: expected ${order.paymentRef}, got ${billId}`,
    );
    return NextResponse.json({ ok: false, reason: "bill_mismatch" }, { status: 400 });
  }

  if (paid && !order.paidAt) {
    // Cross-check: the amount actually paid must match the order total.
    const paidSen = paidAmount ? Number(paidAmount) : null;
    const expectedSen = Math.round(order.total * 100);
    if (paidSen != null && paidSen < expectedSen) {
      console.warn(
        `[billplz] underpayment for order ${order.id}: paid ${paidSen} sen < ${expectedSen} sen`,
      );
      return NextResponse.json({ ok: false, reason: "amount_mismatch" }, { status: 400 });
    }

    // Conditional update — guards against duplicate/concurrent callbacks.
    const res = await db.order.updateMany({
      where: { id: order.id, paidAt: null },
      data: {
        paidAt: new Date(),
        paidAmount: paidSen != null ? paidSen / 100 : order.total,
        status: "preparing", // kick off order prep
      },
    });
    if (res.count === 1) {
      await db.orderEvent.create({
        data: {
          orderId: order.id,
          status: "preparing",
          message: "Payment received — starting to bake! 🍩",
        },
      });
    }
  } else if (!paid && order.paidAt) {
    // Refund / chargeback — revert to unpaid.
    await db.order.update({
      where: { id: order.id },
      data: { paidAt: null, paidAmount: null, status: "preparing" },
    });
    await db.orderEvent.create({
      data: {
        orderId: order.id,
        status: "preparing",
        message: "Payment refunded — order reverted.",
      },
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
