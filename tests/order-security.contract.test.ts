import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ordersRoute = readFileSync(resolve("src/app/api/orders/route.ts"), "utf8");
const statusRoute = readFileSync(
  resolve("src/app/api/orders/[id]/status/route.ts"),
  "utf8",
);

describe("order API security contracts", () => {
  test("derives POST and GET ownership from the request session", () => {
    expect(ordersRoute.match(/getSessionId\(request\)/g)).toHaveLength(2);
    expect(ordersRoute).not.toContain("body.sessionId");
    expect(ordersRoute).not.toContain('searchParams.get("sessionId")');
  });

  test("does not transition unpaid orders into fulfilment", () => {
    expect(statusRoute).toContain("paidAt");
    expect(statusRoute).toContain("Payment must be confirmed");
    expect(statusRoute).toContain("paidAt: { not: null }");
  });
});
