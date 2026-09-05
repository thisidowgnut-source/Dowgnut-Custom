// Serialization helpers — convert Prisma rows to the typed API contracts in src/lib/types.ts.
// `tags` is stored as a comma-separated string in DB and exposed as string[] at the API boundary.

import type { Donut, CartItem, Favorite, Order, OrderItem, Review } from "@/lib/types";

export type PublicCartItem = Omit<CartItem, "sessionId">;
export type PublicFavorite = Omit<Favorite, "sessionId">;
export type PublicOrder = Omit<
  Order,
  "sessionId" | "paymentRef" | "paymentUrl"
>;
export type PublicReview = Omit<Review, "sessionId">;

type DonutRow = {
  id: string;
  name: string;
  description: string;
  price: number;
  type: string;
  imgUrl: string;
  tags: string;
  rating: number;
  calories: number;
  stock: number;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function parseTags(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

export function joinTags(tags: string[] | undefined | null): string {
  if (!tags || !Array.isArray(tags)) return "";
  return tags
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .join(",");
}

export function serializeDonut(row: DonutRow): Donut {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    type: row.type as Donut["type"],
    imgUrl: row.imgUrl,
    tags: parseTags(row.tags),
    rating: row.rating,
    calories: row.calories,
    sugar: (row as any).sugar ?? 10,
    fat: (row as any).fat ?? 8,
    stock: row.stock,
    featured: row.featured,
  };
}

type CartItemRow = {
  id: string;
  sessionId: string;
  donutId: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
  donut: DonutRow;
};

export function serializeCartItem(row: CartItemRow): PublicCartItem {
  return {
    id: row.id,
    donutId: row.donutId,
    quantity: row.quantity,
    donut: serializeDonut(row.donut),
  };
}

type FavoriteRow = {
  id: string;
  sessionId: string;
  donutId: string;
  createdAt: Date;
  donut: DonutRow;
};

export function serializeFavorite(row: FavoriteRow): PublicFavorite {
  return {
    id: row.id,
    donutId: row.donutId,
    donut: serializeDonut(row.donut),
  };
}

type OrderItemRow = {
  id: string;
  orderId: string;
  donutId: string;
  name: string;
  price: number;
  imgUrl: string;
  quantity: number;
};

export function serializeOrderItem(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    orderId: row.orderId,
    donutId: row.donutId,
    name: row.name,
    price: row.price,
    imgUrl: row.imgUrl,
    quantity: row.quantity,
  };
}

type OrderRow = {
  id: string;
  sessionId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  address: string;
  city: string;
  state?: string;
  zip: string;
  notes: string;
  subtotal: number;
  delivery: number;
  sst?: number;
  total: number;
  status: string;
  etaMinutes: number;
  paymentMethod?: string;
  paymentRef?: string | null;
  paymentUrl?: string | null;
  paidAt?: Date | null;
  paidAmount?: number | null;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItemRow[];
};

export function serializeOrder(row: OrderRow): PublicOrder {
  return {
    id: row.id,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    customerPhone: row.customerPhone ?? "",
    address: row.address,
    city: row.city,
    state: row.state ?? "",
    zip: row.zip,
    notes: row.notes,
    paymentMethod: row.paymentMethod ?? "",
    paidAt: row.paidAt?.toISOString(),
    subtotal: row.subtotal,
    delivery: row.delivery,
    sst: row.sst ?? 0,
    total: row.total,
    status: row.status as Order["status"],
    etaMinutes: row.etaMinutes,
    createdAt: row.createdAt.toISOString(),
    items: row.items.map(serializeOrderItem),
  };
}

type ReviewRow = {
  id: string;
  donutId: string;
  sessionId: string;
  author: string;
  rating: number;
  comment: string;
  createdAt: Date;
};

export function serializeReview(row: ReviewRow): PublicReview {
  return {
    id: row.id,
    donutId: row.donutId,
    author: row.author,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.createdAt.toISOString(),
  };
}
