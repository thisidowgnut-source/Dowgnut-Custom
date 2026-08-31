"use client";

import { useEffect, useState } from "react";
import { Package, ArrowLeft } from "lucide-react";
import { useShop } from "@/store/use-shop";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_LABEL: Record<string, string> = {
  preparing: "Preparing",
  baking: "Baking",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
};

const STATUS_COLOR: Record<string, string> = {
  preparing: "bg-[var(--color-dowgnut-blue)] text-white",
  baking: "bg-[var(--color-dowgnut-pink)] text-white",
  out_for_delivery: "bg-[var(--color-dowgnut-lime)] text-[var(--color-dowgnut-blue-dark)]",
  delivered: "bg-[var(--color-dowgnut-blue-dark)] text-white",
};

export function OrdersView() {
  const orders = useShop((s) => s.orders);
  const loadOrders = useShop((s) => s.loadOrders);
  const setView = useShop((s) => s.setView);
  const startTracking = useShop((s) => s.startTracking);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders().finally(() => setLoading(false));
  }, [loadOrders]);

  const openTrack = (orderId: string, name: string) => {
    startTracking(orderId, name);
  };

  return (
    <section className="mx-auto w-full max-w-4xl flex-1 px-4 pb-12 pt-8 sm:px-6">
      <header className="mb-6 flex items-center gap-3">
        <button
          onClick={() => setView("shop")}
          aria-label="Back to shop"
          className="inline-flex size-11 items-center justify-center rounded-full bg-white text-[var(--color-dowgnut-blue)] shadow-sm hover:bg-[var(--color-dowgnut-blue)] hover:text-white"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-dowgnut-pink-dark)]">
            Track record
          </p>
          <h1 className="graffiti-text text-4xl text-[var(--color-dowgnut-blue-dark)] sm:text-5xl">
            Your Orders
          </h1>
        </div>
      </header>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-[var(--color-dowgnut-blue-dark)]/15 bg-[var(--color-dowgnut-cream)] p-10 text-center">
          <Package className="size-10 text-[var(--color-dowgnut-pink)]" />
          <img
            src="/brand/dowgnut-mascot.png"
            alt=""
            className="h-24 w-24 animate-float object-contain"
          />
          <h3 className="graffiti-text text-2xl text-[var(--color-dowgnut-blue-dark)]">
            DOH NUT WAIT!
          </h3>
          <p className="text-sm text-[var(--color-dowgnut-blue-dark)]/70">
            No orders yet — DOH BOLEH! Place your first order and watch it travel to your door in real time.
          </p>
          <Button
            onClick={() => setView("shop")}
            className="rounded-full bg-[var(--color-dowgnut-pink)] px-6 text-white hover:bg-[var(--color-dowgnut-pink-dark)] hover:text-white"
          >
            Start an order
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {loading && orders.length === 0
            ? Array.from({ length: 3 }).map((_, i) => (
                <li key={i}>
                  <Skeleton className="h-32 w-full rounded-3xl" />
                </li>
              ))
            : orders.map((o) => (
                <li
                  key={o.id}
                  className="rounded-3xl border-2 border-[var(--color-dowgnut-blue-dark)]/10 bg-[var(--color-dowgnut-cream)] p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="graffiti-text text-lg text-[var(--color-dowgnut-blue-dark)]">
                          #{o.id.slice(0, 8)}
                        </span>
                        <Badge className={STATUS_COLOR[o.status] ?? "bg-muted"}>
                          {STATUS_LABEL[o.status] ?? o.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-[var(--color-dowgnut-blue-dark)]/60">
                        {new Date(o.createdAt).toLocaleString()} •{" "}
                        {o.items.reduce((n, i) => n + i.quantity, 0)} item{o.items.reduce((n, i) => n + i.quantity, 0) === 1 ? "" : "s"} • {o.customerName}
                      </p>
                      <p className="mt-2 text-xs text-[var(--color-dowgnut-blue-dark)]/60">
                        {o.items
                          .slice(0, 3)
                          .map((i) => `${i.quantity}× ${i.name}`)
                          .join(", ")}
                        {o.items.length > 3 ? "…" : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-[var(--color-dowgnut-blue-dark)]">
                        RM {o.total.toFixed(2)}
                      </p>
                      <Button
                        onClick={() => openTrack(o.id, o.customerName)}
                        size="sm"
                        className="mt-2 rounded-full bg-[var(--color-dowgnut-blue)] text-white hover:bg-[var(--color-dowgnut-blue-dark)] hover:text-white"
                      >
                        Track order
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
        </ul>
      )}
    </section>
  );
}
