import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureReady } from "@/lib/ensure-ready";
import { requireAdmin } from "@/lib/admin-auth";
import type { AdminStats } from "@/lib/types";

// GET /api/admin/stats  →  AdminStats
export async function GET(request: Request) {
  // Fail-closed admin check (rejects when key unset, wrong key, or dev).
  const denied = requireAdmin(request);
  if (denied) return denied;
  
  try {
    await ensureReady();
    const [orders, orderItems, recentOrderRows] = await Promise.all([
      db.order.findMany({ include: { items: true } }),
      db.orderItem.findMany({ include: { donut: true } }),
      db.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]);

    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = orders.length;
    const totalItems = orderItems.reduce((sum, oi) => sum + oi.quantity, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Top donuts by name (sum qty + revenue)
    const byName = new Map<string, { qty: number; revenue: number }>();
    for (const oi of orderItems) {
      const cur = byName.get(oi.name) ?? { qty: 0, revenue: 0 };
      cur.qty += oi.quantity;
      cur.revenue += oi.price * oi.quantity;
      byName.set(oi.name, cur);
    }
    const topDonuts = [...byName.entries()]
      .map(([name, v]) => ({ name, qty: v.qty, revenue: v.revenue }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // Sales by type (join OrderItem → Donut.type)
    const byType = new Map<string, { qty: number; revenue: number }>();
    for (const oi of orderItems) {
      const t = oi.donut?.type ?? "unknown";
      const cur = byType.get(t) ?? { qty: 0, revenue: 0 };
      cur.qty += oi.quantity;
      cur.revenue += oi.price * oi.quantity;
      byType.set(t, cur);
    }
    const salesByType = [...byType.entries()].map(([type, v]) => ({
      type,
      qty: v.qty,
      revenue: v.revenue,
    }));

    const recentOrders = recentOrderRows.map((o) => ({
      id: o.id,
      customerName: o.customerName,
      total: o.total,
      status: o.status as AdminStats["recentOrders"][number]["status"],
      createdAt: o.createdAt.toISOString(),
    }));

    // Hourly revenue (24 buckets)
    const hourly: number[] = new Array(24).fill(0);
    for (const o of orders) {
      const h = new Date(o.createdAt).getHours();
      hourly[h] += o.total;
    }
    const hourlyRevenue = hourly.map((revenue, h) => ({
      hour: `${h.toString().padStart(2, "0")}:00`,
      revenue,
    }));

    const stats: AdminStats = {
      totalRevenue,
      totalOrders,
      totalItems,
      avgOrderValue,
      topDonuts,
      salesByType,
      recentOrders,
      hourlyRevenue,
    };

    return NextResponse.json(stats);
  } catch (err) {
    console.error("[api/admin/stats GET]", err);
    return NextResponse.json(
      { error: "Failed to compute admin stats" },
      { status: 500 }
    );
  }
}
