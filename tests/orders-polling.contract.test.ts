import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(
  resolve("src/components/dohnut/orders-view.tsx"),
  "utf8",
);

describe("pending payment order polling", () => {
  test("polls unsettled payment states and cancels the timer on cleanup", () => {
    expect(source).toContain("PAYMENT_PENDING_STATUSES");
    expect(source).toContain("setTimeout(refreshOrders");
    expect(source).toContain("clearTimeout(pollTimer)");
  });
});
