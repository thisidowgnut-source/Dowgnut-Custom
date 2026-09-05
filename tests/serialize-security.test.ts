import { describe, expect, test } from "bun:test";

import {
  serializeCartItem,
  serializeFavorite,
  serializeOrder,
  serializeReview,
} from "@/lib/serialize";

const now = new Date("2026-09-03T00:00:00.000Z");
const donut = {
  id: "donut-1",
  name: "Classic",
  description: "A donut",
  price: 5,
  type: "classic",
  imgUrl: "/donut.png",
  tags: "classic",
  rating: 5,
  calories: 200,
  sugar: 10,
  fat: 8,
  stock: 10,
  featured: true,
  createdAt: now,
  updatedAt: now,
};

describe("public API serialization", () => {
  test("does not expose session bearer identifiers", () => {
    const cart = serializeCartItem({
      id: "cart-1",
      sessionId: "secret-session",
      donutId: donut.id,
      quantity: 1,
      createdAt: now,
      updatedAt: now,
      donut,
    });
    const favorite = serializeFavorite({
      id: "favorite-1",
      sessionId: "secret-session",
      donutId: donut.id,
      createdAt: now,
      donut,
    });
    const review = serializeReview({
      id: "review-1",
      donutId: donut.id,
      sessionId: "secret-session",
      author: "Customer",
      rating: 5,
      comment: "Great",
      createdAt: now,
    });

    expect(cart).not.toHaveProperty("sessionId");
    expect(favorite).not.toHaveProperty("sessionId");
    expect(review).not.toHaveProperty("sessionId");
  });

  test("does not expose order session or internal gateway references", () => {
    const order = serializeOrder({
      id: "order-1",
      sessionId: "secret-session",
      customerName: "Customer",
      customerEmail: "customer@example.com",
      customerPhone: "+60123456789",
      address: "1 Example Road",
      city: "Kuala Lumpur",
      state: "WP Kuala Lumpur",
      zip: "50000",
      notes: "",
      subtotal: 5,
      delivery: 3.99,
      sst: 0.3,
      total: 9.29,
      status: "pending_payment",
      etaMinutes: 25,
      paymentMethod: "billplz",
      paymentRef: "internal-bill-id",
      paymentUrl: "https://www.billplz.com/bills/internal-bill-id",
      paidAt: null,
      paidAmount: null,
      createdAt: now,
      updatedAt: now,
      items: [],
    });

    expect(order).not.toHaveProperty("sessionId");
    expect(order).not.toHaveProperty("paymentRef");
    expect(order).not.toHaveProperty("paymentUrl");
  });
});
