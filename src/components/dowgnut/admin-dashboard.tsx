"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import {
  DollarSign,
  Package,
  ShoppingBag,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { AdminStats, OrderStatus } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_LABEL: Record<OrderStatus, string> = {
  preparing: "Preparing",
  baking: "Baking",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  preparing: "bg-[var(--color-dowgnut-blue)] text-white",
  baking: "bg-[var(--color-dowgnut-pink)] text-white",
  out_for_delivery: "bg-[var(--color-dowgnut-lime)] text-[var(--color-dowgnut-blue-dark)]",
  delivered: "bg-[var(--color-dowgnut-blue-dark)] text-white",
};

const PIE_COLORS = [
  "var(--color-dowgnut-blue)",
  "var(--color-dowgnut-pink)",
  "var(--color-dowgnut-lime)",
  "var(--color-dowgnut-cream)",
  "var(--color-dowgnut-blue-dark)",
];

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Admin key gate — requested once, kept in sessionStorage for the tab.
  const [adminKey, setAdminKey] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("dowgnut-admin-key");
    if (stored) {
      setAdminKey(stored);
      setAuthed(true);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authed) return;
    let mounted = true;
    (async () => {
      try {
        const data = await apiFetch<AdminStats>(`/api/admin/stats`, {
          headers: { "x-admin-key": adminKey },
        });
        if (mounted) setStats(data);
      } catch (err: any) {
        if (mounted) setError(err?.message ?? "Failed to load stats");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [authed, adminKey]);

  const onUnlock = async () => {
    setError(null);
    setLoading(true);
    try {
      await apiFetch<AdminStats>(`/api/admin/stats`, {
        headers: { "x-admin-key": keyInput },
      });
      sessionStorage.setItem("dowgnut-admin-key", keyInput);
      setAdminKey(keyInput);
      setAuthed(true);
    } catch {
      setError("Invalid admin key");
      setLoading(false);
    }
  };

  if (!authed && !loading) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-4 px-4 py-20">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--color-dowgnut-pink)]/10">
          <KeyRound className="size-7 text-[var(--color-dowgnut-pink)]" />
        </div>
        <h2 className="graffiti-text text-2xl text-[var(--color-dowgnut-blue-dark)]">
          ADMIN ACCESS
        </h2>
        <p className="text-center text-sm text-[var(--color-dowgnut-blue-dark)]/60">
          Enter the admin API key to view the dashboard.
        </p>
        <div className="w-full space-y-2">
          <Label htmlFor="admin-key">Admin key</Label>
          <Input
            id="admin-key"
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onUnlock()}
            placeholder="x-admin-key…"
            autoComplete="off"
          />
        </div>
        {error && <p className="text-sm font-medium text-red-500">{error}</p>}
        <Button
          onClick={onUnlock}
          disabled={!keyInput.trim()}
          className="h-11 w-full rounded-full bg-[var(--color-dowgnut-pink)] font-bold text-white hover:bg-[var(--color-dowgnut-pink-dark)]"
        >
          Unlock Dashboard
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-1 items-center justify-center px-4 py-20">
        <Loader2 className="size-8 animate-spin text-[var(--color-dowgnut-pink)]" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 text-center">
        <p className="graffiti-text text-2xl text-destructive">
          {error ?? "Failed to load stats"}
        </p>
      </div>
    );
  }

  const cards = [
    {
      label: "Total Revenue",
      value: `RM ${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "from-[var(--color-dowgnut-blue)] to-[var(--color-dowgnut-blue-dark)]",
    },
    {
      label: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingBag,
      color: "from-[var(--color-dowgnut-pink)] to-[var(--color-dowgnut-pink-dark)]",
    },
    {
      label: "Items Sold",
      value: stats.totalItems,
      icon: Package,
      color: "from-[var(--color-dowgnut-lime-dark)] to-[var(--color-dowgnut-lime)]",
    },
    {
      label: "Avg Order Value",
      value: `RM ${stats.avgOrderValue.toFixed(2)}`,
      icon: TrendingUp,
      color: "from-[var(--color-dowgnut-blue-dark)] to-[var(--color-dowgnut-blue)]",
    },
  ];

  return (
    <section className="mx-auto w-full max-w-7xl flex-1 px-4 pb-12 pt-8 sm:px-6">
      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-dowgnut-pink-dark)]">
          DowgNut HQ
        </p>
        <h1 className="graffiti-text text-4xl text-[var(--color-dowgnut-blue-dark)] sm:text-5xl">
          Command Center
        </h1>
        <p className="mt-1 text-sm text-[var(--color-dowgnut-blue-dark)]/60">
          Live metrics across the whole donut empire.
        </p>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card
              key={c.label}
              className={`gap-0 overflow-hidden rounded-3xl border-2 border-[var(--color-dowgnut-blue-dark)]/10 bg-gradient-to-br ${c.color} p-4 text-white shadow-sm sm:p-5`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wide text-white/80">
                  {c.label}
                </p>
                <Icon className="size-5 text-white/80" />
              </div>
              <p className="graffiti-text mt-2 text-2xl sm:text-3xl">{c.value}</p>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Hourly revenue */}
        <Card className="gap-3 rounded-3xl border-2 border-[var(--color-dowgnut-blue-dark)]/10 bg-[var(--color-dowgnut-cream)] p-5">
          <h2 className="graffiti-text text-lg text-[var(--color-dowgnut-blue-dark)]">
            Hourly Revenue
          </h2>
          <p className="text-xs text-[var(--color-dowgnut-blue-dark)]/60">
            Last 24h by hour of day
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.hourlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#07334f20" />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 10, fill: "#07334f" }}
                  interval={3}
                />
                <YAxis tick={{ fontSize: 10, fill: "#07334f" }} />
                <Tooltip
                  contentStyle={{
                    background: "#fff9e8",
                    border: "2px solid #07579b",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#f05a9b"
                  strokeWidth={3}
                  dot={{ r: 3, fill: "#07579b" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top donuts */}
        <Card className="gap-3 rounded-3xl border-2 border-[var(--color-dowgnut-blue-dark)]/10 bg-[var(--color-dowgnut-cream)] p-5">
          <h2 className="graffiti-text text-lg text-[var(--color-dowgnut-blue-dark)]">
            Top Donuts
          </h2>
          <p className="text-xs text-[var(--color-dowgnut-blue-dark)]/60">
            Best sellers by quantity
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.topDonuts}
                layout="vertical"
                margin={{ left: 20, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#07334f20" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#07334f" }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "#07334f" }}
                  width={90}
                />
                <Tooltip
                  contentStyle={{
                    background: "#fff9e8",
                    border: "2px solid #07579b",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="qty" fill="#07579b" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Sales by type */}
        <Card className="gap-3 rounded-3xl border-2 border-[var(--color-dowgnut-blue-dark)]/10 bg-[var(--color-dowgnut-cream)] p-5">
          <h2 className="graffiti-text text-lg text-[var(--color-dowgnut-blue-dark)]">
            Sales by Type
          </h2>
          <p className="text-xs text-[var(--color-dowgnut-blue-dark)]/60">
            Distribution across flavors
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.salesByType}
                  dataKey="qty"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={40}
                  paddingAngle={3}
                >
                  {stats.salesByType.map((_, i) => (
                    <Cell
                      key={i}
                      fill={PIE_COLORS[i % PIE_COLORS.length]}
                      stroke="#fff9e8"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#fff9e8",
                    border: "2px solid #07579b",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11, textTransform: "capitalize" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent orders table */}
        <Card className="gap-3 rounded-3xl border-2 border-[var(--color-dowgnut-blue-dark)]/10 bg-[var(--color-dowgnut-cream)] p-5">
          <h2 className="graffiti-text text-lg text-[var(--color-dowgnut-blue-dark)]">
            Recent Orders
          </h2>
          <p className="text-xs text-[var(--color-dowgnut-blue-dark)]/60">
            Last 8 orders placed
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.recentOrders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-6 text-center text-xs text-[var(--color-dowgnut-blue-dark)]/60"
                  >
                    No orders yet.
                  </TableCell>
                </TableRow>
              ) : (
                stats.recentOrders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">
                      #{o.id.slice(0, 8)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {o.customerName}
                    </TableCell>
                    <TableCell className="text-xs font-bold">
                      RM{o.total.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLOR[o.status]}>
                        {STATUS_LABEL[o.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-[var(--color-dowgnut-blue-dark)]/60">
                      {new Date(o.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </section>
  );
}
