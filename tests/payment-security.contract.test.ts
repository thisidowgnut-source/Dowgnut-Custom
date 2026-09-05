import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const createRoute = readFileSync(
  resolve("src/app/api/payment/billplz/create/route.ts"),
  "utf8",
);
const webhookRoute = readFileSync(
  resolve("src/app/api/payment/billplz/webhook/route.ts"),
  "utf8",
);

describe("payment route security contracts", () => {
  test("requires order ownership before initiating payment", () => {
    expect(createRoute).toContain("getSessionId(req)");
    expect(createRoute).toContain("order.sessionId !== sessionId");
  });

  test("uses an atomic payment-start claim", () => {
    expect(createRoute).toContain("claimOrderPaymentStart");
    expect(createRoute).toContain("payment_starting");
  });

  test("never enables simulated payment in production", () => {
    expect(createRoute).not.toContain("PAYMENTS_ALLOW_DEV_FALLBACK");
    expect(createRoute).toContain('process.env.NODE_ENV === "production"');
  });

  test("requires exact bill, collection, and amount matches", () => {
    expect(webhookRoute).toContain("order.paymentRef !== billId");
    expect(webhookRoute).toContain("collection_id");
    expect(webhookRoute).toContain("Number.isSafeInteger");
    expect(webhookRoute).toContain("paidSen !== expectedSen");
  });
});
