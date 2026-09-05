import { describe, expect, test } from "bun:test";

import { classifyPaymentState } from "@/lib/payment-state";

describe("classifyPaymentState", () => {
  test("keeps an unpaid pending order pending", () => {
    expect(
      classifyPaymentState({ status: "pending_payment", paidAt: null }),
    ).toBe("pending");
  });

  test("does not infer payment from a fulfilment status", () => {
    expect(
      classifyPaymentState({ status: "preparing", paidAt: null }),
    ).toBe("pending");
  });

  test("classifies an explicitly failed payment as failed", () => {
    expect(
      classifyPaymentState({ status: "payment_failed", paidAt: null }),
    ).toBe("failed");
  });

  test("keeps payment initiation pending", () => {
    expect(
      classifyPaymentState({ status: "payment_starting", paidAt: null }),
    ).toBe("pending");
  });

  test("treats a verified payment requiring manual review as paid", () => {
    expect(
      classifyPaymentState({
        status: "payment_review",
        paidAt: "2026-09-03T04:00:00.000Z",
      }),
    ).toBe("paid");
  });

  test("treats a server-provided payment timestamp as authoritative", () => {
    expect(
      classifyPaymentState({
        status: "pending_payment",
        paidAt: "2026-09-03T04:00:00.000Z",
      }),
    ).toBe("paid");
  });

  test("lets a payment timestamp win over a stale failure status", () => {
    expect(
      classifyPaymentState({
        status: "payment_failed",
        paidAt: "2026-09-03T04:00:00.000Z",
      }),
    ).toBe("paid");
  });
});
