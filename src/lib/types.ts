// DowgNut — shared types

export type DonutType =
  | "classic"
  | "sprinkled"
  | "stuffed"
  | "specialty"
  | "savory";

export interface Donut {
  id: string;
  name: string;
  description: string;
  price: number;
  type: DonutType;
  imgUrl: string;
  tags: string[];
  rating: number;
  calories: number;
  sugar: number;
  fat: number;
  stock: number;
  featured: boolean;
}

export interface CartItem {
  id: string;
  sessionId: string;
  donutId: string;
  quantity: number;
  donut: Donut;
}

export interface Favorite {
  id: string;
  sessionId: string;
  donutId: string;
  donut: Donut;
}

export type OrderStatus =
  | "preparing"
  | "baking"
  | "out_for_delivery"
  | "delivered";

export interface OrderItem {
  id: string;
  orderId: string;
  donutId: string;
  name: string;
  price: number;
  imgUrl: string;
  quantity: number;
}

export interface SavedAddress {
  id: string;
  label: string; // "Home", "Office", etc.
  customerName: string;
  customerPhone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  isDefault?: boolean;
}

export interface CustomerProfile {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  createdAt: string;
  addresses: SavedAddress[];
  recentlyViewed: string[]; // donut ids, newest first
  optedInMarketing: boolean;
}

export interface Order {
  id: string;
  sessionId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
  paymentMethod: string;
  paymentRef?: string;
  paymentUrl?: string;
  subtotal: number;
  delivery: number;
  sst: number;
  total: number;
  status: OrderStatus;
  etaMinutes: number;
  createdAt: string;
  items: OrderItem[];
}

export interface Review {
  id: string;
  donutId: string;
  sessionId: string;
  author: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  donuts?: Donut[];
}

export interface AdminStats {
  totalRevenue: number;
  totalOrders: number;
  totalItems: number;
  avgOrderValue: number;
  topDonuts: { name: string; qty: number; revenue: number }[];
  salesByType: { type: string; qty: number; revenue: number }[];
  recentOrders: (Pick<Order, "id" | "customerName" | "total" | "status" | "createdAt">)[];
  hourlyRevenue: { hour: string; revenue: number }[];
}

