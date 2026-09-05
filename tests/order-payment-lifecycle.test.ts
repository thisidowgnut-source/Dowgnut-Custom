import { beforeEach, describe, expect, mock, test } from "bun:test";

const updateStock = mock(async () => ({ count: 1 }));
const confirmOrder = mock(async () => ({ count: 1 }));
const deletePaidCartQuantity = mock(async () => ({ count: 1 }));
const reducePaidCartQuantity = mock(async () => ({ count: 0 }));
const createOrderEvent = mock(async () => ({ id: "event-1" }));
const markFailed = mock(async () => ({ count: 1 }));
const claimPaymentStart = mock(async () => ({ count: 1 }));
const recordPaymentReview = mock(async () => ({ count: 1 }));

let storedOrder: Record<string, unknown> | null;

const transactionClient = {
  order: {
    findUnique: mock(async () => storedOrder),
    updateMany: confirmOrder,
  },
  donut: { updateMany: updateStock },
  cartItem: {
    deleteMany: deletePaidCartQuantity,
    updateMany: reducePaidCartQuantity,
  },
  orderEvent: { create: createOrderEvent },
};

mock.module("@/lib/db", () => ({
  db: {
    $transaction: async <T>(callback: (tx: typeof transactionClient) => Promise<T>) =>
      callback(transactionClient),
    order: {
      updateMany: mock(async (args: Record<string, unknown>) => {
        const data = args.data as { status?: string };
        if (data.status === "payment_starting") return claimPaymentStart(args);
        if (data.status === "payment_review") return recordPaymentReview(args);
        return markFailed(args);
      }),
    },
    orderEvent: { create: createOrderEvent },
  },
}));

const {
  claimOrderPaymentStart,
  confirmOrderPayment,
  markOrderPaymentFailed,
} =
  await import("@/lib/order-payment-lifecycle");

beforeEach(() => {
  storedOrder = {
    id: "order-1",
    sessionId: "session-1",
    paidAt: null,
    items: [
      {
        donutId: "donut-1",
        name: "Pandan Gula Melaka",
        quantity: 2,
      },
    ],
  };
  for (const fn of [
    updateStock,
    confirmOrder,
    deletePaidCartQuantity,
    reducePaidCartQuantity,
    createOrderEvent,
    markFailed,
    claimPaymentStart,
    recordPaymentReview,
    transactionClient.order.findUnique,
  ]) {
    fn.mockClear();
  }
  updateStock.mockImplementation(async () => ({ count: 1 }));
  confirmOrder.mockImplementation(async () => ({ count: 1 }));
});

describe("confirmOrderPayment", () => {
  test("fulfils a paid order and consumes only its purchased quantities", async () => {
    const confirmed = await confirmOrderPayment({
      orderId: "order-1",
      paidAmount: 24.5,
      message: "Payment confirmed",
    });

    expect(confirmed).toBe(true);
    expect(updateStock).toHaveBeenCalledWith({
      where: { id: "donut-1", stock: { gte: 2 } },
      data: { stock: { decrement: 2 } },
    });
    expect(confirmOrder).toHaveBeenCalledWith({
      where: { id: "order-1", paidAt: null },
      data: {
        paidAt: expect.any(Date),
        paidAmount: 24.5,
        status: "preparing",
      },
    });
    expect(deletePaidCartQuantity).toHaveBeenCalledTimes(1);
    expect(reducePaidCartQuantity).toHaveBeenCalledTimes(1);
    expect(createOrderEvent).toHaveBeenCalledTimes(1);
  });

  test("is idempotent when Billplz retries an already-confirmed callback", async () => {
    storedOrder = {
      ...(storedOrder ?? {}),
      paidAt: new Date("2026-09-03T04:00:00.000Z"),
    };

    await expect(
      confirmOrderPayment({
        orderId: "order-1",
        paidAmount: 24.5,
        message: "Duplicate callback",
      }),
    ).resolves.toBe(false);

    expect(updateStock).not.toHaveBeenCalled();
    expect(confirmOrder).not.toHaveBeenCalled();
    expect(deletePaidCartQuantity).not.toHaveBeenCalled();
    expect(createOrderEvent).not.toHaveBeenCalled();
  });

  test("records verified payment for review without touching cart when inventory is unavailable", async () => {
    updateStock.mockImplementation(async () => ({ count: 0 }));

    await expect(confirmOrderPayment({
      orderId: "order-1",
      paidAmount: 24.5,
      message: "Payment confirmed",
    })).resolves.toBe("review");

    expect(recordPaymentReview).toHaveBeenCalledWith({
      where: { id: "order-1", paidAt: null },
      data: {
        paidAt: expect.any(Date),
        paidAmount: 24.5,
        status: "payment_review",
      },
    });
    expect(deletePaidCartQuantity).not.toHaveBeenCalled();
    expect(reducePaidCartQuantity).not.toHaveBeenCalled();
    expect(createOrderEvent).toHaveBeenCalledWith({
      data: expect.objectContaining({ status: "payment_review" }),
    });
  });
});

describe("claimOrderPaymentStart", () => {
  test("atomically claims only a not-yet-started unpaid order", async () => {
    await expect(claimOrderPaymentStart("order-1")).resolves.toBe(true);
    expect(claimPaymentStart).toHaveBeenCalledWith({
      where: {
        id: "order-1",
        paidAt: null,
        paymentRef: null,
        paymentUrl: null,
        status: { in: ["pending_payment", "payment_failed"] },
      },
      data: { status: "payment_starting" },
    });
  });
});

describe("markOrderPaymentFailed", () => {
  test("marks only an unpaid order and never consumes inventory or cart data", async () => {
    await markOrderPaymentFailed("order-1");

    expect(markFailed).toHaveBeenCalledWith({
      where: { id: "order-1", paidAt: null },
      data: { status: "payment_failed" },
    });
    expect(updateStock).not.toHaveBeenCalled();
    expect(deletePaidCartQuantity).not.toHaveBeenCalled();
  });
});
