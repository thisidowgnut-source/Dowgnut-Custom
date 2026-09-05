import { db } from "@/lib/db";

export class PaymentInventoryError extends Error {
  constructor(readonly donutName: string) {
    super(`Insufficient stock for paid order item: ${donutName}`);
    this.name = "PaymentInventoryError";
  }
}

/**
 * Atomically turns a payment-confirmed order into a fulfilment order.
 * Inventory and the matching cart quantities are changed only after payment.
 */
export async function confirmOrderPayment(input: {
  orderId: string;
  paidAmount: number;
  message: string;
}): Promise<boolean | "review"> {
  try {
    return await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: input.orderId },
      include: { items: true },
    });
    if (!order) throw new Error("Order not found");
    if (order.paidAt) return false;

    for (const item of order.items) {
      const reserved = await tx.donut.updateMany({
        where: { id: item.donutId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (reserved.count !== 1) {
        throw new PaymentInventoryError(item.name);
      }
    }

    const confirmed = await tx.order.updateMany({
      where: { id: order.id, paidAt: null },
      data: {
        paidAt: new Date(),
        paidAmount: input.paidAmount,
        status: "preparing",
      },
    });
    if (confirmed.count !== 1) {
      throw new Error("Payment was confirmed concurrently");
    }

    // Remove only quantities represented by this order. Items added while the
    // shopper was at the gateway stay in the cart.
    for (const item of order.items) {
      await tx.cartItem.deleteMany({
        where: {
          sessionId: order.sessionId,
          donutId: item.donutId,
          quantity: { lte: item.quantity },
        },
      });
      await tx.cartItem.updateMany({
        where: {
          sessionId: order.sessionId,
          donutId: item.donutId,
          quantity: { gt: item.quantity },
        },
        data: { quantity: { decrement: item.quantity } },
      });
    }

    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        status: "preparing",
        message: input.message,
      },
    });
      return true;
    });
  } catch (error) {
    if (!(error instanceof PaymentInventoryError)) throw error;

    // Billplz is the payment source of truth. If fulfilment cannot reserve
    // stock, record the successful charge without touching inventory/cart and
    // surface it for manual fulfilment or refund review.
    const recorded = await db.order.updateMany({
      where: { id: input.orderId, paidAt: null },
      data: {
        paidAt: new Date(),
        paidAmount: input.paidAmount,
        status: "payment_review",
      },
    });
    if (recorded.count !== 1) return false;

    await db.orderEvent.create({
      data: {
        orderId: input.orderId,
        status: "payment_review",
        message: `Payment received, but ${error.donutName} requires manual stock review.`,
      },
    });
    return "review";
  }
}

/** Atomically elects the single request allowed to create an external bill. */
export async function claimOrderPaymentStart(orderId: string): Promise<boolean> {
  const claimed = await db.order.updateMany({
    where: {
      id: orderId,
      paidAt: null,
      paymentRef: null,
      paymentUrl: null,
      status: { in: ["pending_payment", "payment_failed"] },
    },
    data: { status: "payment_starting" },
  });
  return claimed.count === 1;
}

export async function markOrderPaymentFailed(orderId: string): Promise<void> {
  await db.order.updateMany({
    where: { id: orderId, paidAt: null },
    data: { status: "payment_failed" },
  });
}
