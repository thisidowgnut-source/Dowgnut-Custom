"use client";

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
import type { AdminStats } from "@/lib/types";
import { Card } from "@/components/ui/card";

const PIE_COLORS = [
  "var(--color-dowgnut-blue)",
  "var(--color-dowgnut-pink)",
  "var(--color-dowgnut-lime)",
  "var(--color-dowgnut-cream)",
  "var(--color-dowgnut-blue-dark)",
];

export function AdminCharts({ stats }: { stats: AdminStats }) {
  return (
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
              <CartesianGrid strokeDasharray="3 3" stroke="#1d355720" />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 10, fill: "#1d3557" }}
                interval={3}
              />
              <YAxis tick={{ fontSize: 10, fill: "#1d3557" }} />
              <Tooltip
                contentStyle={{
                  background: "#fff9db",
                  border: "2px solid #3d5a80",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#ef233c"
                strokeWidth={3}
                dot={{ r: 3, fill: "#3d5a80" }}
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
              <CartesianGrid strokeDasharray="3 3" stroke="#1d355720" />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#1d3557" }} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 10, fill: "#1d3557" }}
                width={90}
              />
              <Tooltip
                contentStyle={{
                  background: "#fff9db",
                  border: "2px solid #3d5a80",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="qty" fill="#3d5a80" radius={[0, 8, 8, 0]} />
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
                    stroke="#fff9db"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#fff9db",
                  border: "2px solid #3d5a80",
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
    </div>
  );
}
