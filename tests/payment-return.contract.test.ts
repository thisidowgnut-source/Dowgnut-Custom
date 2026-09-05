import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const homeSource = readFileSync(resolve("src/app/page.tsx"), "utf8");

describe("payment return verification contract", () => {
  test("reloads the returned order from the server", () => {
    expect(homeSource).toContain("/api/orders/");
  });

  test("uses the server payment timestamp before announcing success", () => {
    expect(homeSource).toContain("paidAt");
    expect(homeSource).toContain("classifyPaymentState");
  });

  test("routes paid orders needing stock review away from fulfilment tracking", () => {
    expect(homeSource).toContain('order.status === "payment_review"');
    expect(homeSource).toContain("Payment received — order review needed");
  });
});
