import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const routeSource = readFileSync(
  resolve("src/app/api/orders/route.ts"),
  "utf8",
);
const postHandlerSource = routeSource.slice(
  routeSource.indexOf("export async function POST"),
  routeSource.indexOf("export async function GET"),
);
const storeSource = readFileSync(resolve("src/store/use-shop.ts"), "utf8");
const checkoutActionSource = storeSource.slice(
  storeSource.indexOf("checkout: async"),
  storeSource.indexOf("loadOrders: async"),
);

describe("order creation before payment confirmation", () => {
  test("creates the order in pending-payment state", () => {
    expect(postHandlerSource).toContain('status: "pending_payment"');
    expect(postHandlerSource).not.toContain('status: "preparing"');
  });

  test("does not consume stock", () => {
    expect(postHandlerSource).not.toContain("stock: { decrement:");
    expect(postHandlerSource).not.toContain("tx.donut.updateMany");
  });

  test("preserves the cart so payment initiation can be retried", () => {
    expect(postHandlerSource).not.toContain("tx.cartItem.deleteMany");
    expect(checkoutActionSource).not.toContain("set({ cart: [] })");
  });
});
