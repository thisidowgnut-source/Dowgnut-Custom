"use client";

import { useEffect, useState } from "react";
import { Package, ArrowLeft } from "lucide-react";
import { useShop } from "@/store/use-shop";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Awaiting payment",
  payment_starting: "Starting payment",
  payment_failed: "Payment failed",
  payment_expired: "Payment expired",
  payment_review: "Payment under review",
  preparing: "Preparing",
  baking: "Baking",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
};

const STATUS_COLOR: Record<string, string> = {
  pending_payment: "bg-amber-500 text-white",
  payment_starting: "bg-amber-600 text-white",
  payment_failed: "bg-red-700 text-white",
  payment_expired: "bg-slate-600 text-white",
  payment_review: "bg-purple-700 text-white",
  preparing: "bg-[var(--color-dowgnut-blue)] text-white",
  baking: "bg-[var(--color-dowgnut-pink)] text-white",
  out_for_delivery: "bg-[var(--color-dowgnut-lime)] text-[var(--color-dowgnut-blue-dark)]",
  delivered: "bg-[var(--color-dowgnut-blue-dark)] text-white",
};

const PAYMENT_PENDING_STATUSES = new Set(["pending_payment", "payment_starting"]);

export function OrdersView() {
  const orders = useShop((s) => s.orders);
  const loadOrders = useShop((s) => s.loadOrders);
  const setView = useShop((s) => s.setView);
  const startTracking = useShop((s) => s.startTracking);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | undefined;
    let pollAttempt = 0;
    const POLL_MAX_ATTEMPTS = 20; // ~6 minutes of total polling at cap
    const POLL_BASE_MS = 3000; // 3s → 6s → 12s → 30s cap (LZ-06)

    const refreshOrders = async () => {
      const refreshed = await loadOrders();
      if (cancelled) return;
      setLoading(false);
      const stillPending = refreshed.some((order) => PAYMENT_PENDING_STATUSES.has(order.status));
      if (stillPending && pollAttempt < POLL_MAX_ATTEMPTS) {
        pollAttempt += 1;
        // Exponential backoff capped at 30s — prevents an infinite poll
        // loop on stuck `payment_starting` orders that would otherwise
        // hammer the API ~1,200 req/hour.
        const delay = Math.min(30000, POLL_BASE_MS * Math.pow(2, pollAttempt - 1));
        pollTimer = setTimeout(refreshOrders, delay);
      }
    };

    void refreshOrders();
    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
    };
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
          <h1 className="graffiti-text text-3xl text-[var(--color-dowgnut-blue-dark)] sm:text-4xl md:text-5xl">
            Your Orders
          </h1>
        </div>
      </header>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-[var(--color-dowgnut-blue-dark)]/15 bg-[var(--color-dowgnut-cream)] p-10 text-center">
          <Package className="size-10 text-[var(--color-dowgnut-pink)]" />
          <img
            src="/brand/dohnut-mascot.png"
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
            : orders.map((o) => {
                // LZ-12: extract the per-item reduce calls to locals so we
                // run them once per row instead of 3× per row.
                const totalQty = o.items.reduce((n, i) => n + i.quantity, 0);
                const itemSummary = o.items
                  .slice(0, 3)
                  .map((i) => `${i.quantity}× ${i.name}`)
                  .join(", ");
                const isPaymentStuck =
                  o.status === "pending_payment" ||
                  o.status === "payment_starting" ||
                  o.status === "payment_failed" ||
                  o.status === "payment_expired";
                return (
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
                        {totalQty} item{totalQty === 1 ? "" : "s"} • {o.customerName}
                      </p>
                      <p className="mt-2 text-xs text-[var(--color-dowgnut-blue-dark)]/60">
                        {itemSummary}
                        {o.items.length > 3 ? "…" : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-[var(--color-dowgnut-blue-dark)]">
                        RM {o.total.toFixed(2)}
                      </p>
                      <Button
                        disabled={o.status === "payment_review"}
                        onClick={() =>
                          isPaymentStuck ? setView("checkout") : openTrack(o.id, o.customerName)
                        }
                        size="sm"
                        className="mt-2 rounded-full bg-[var(--color-dowgnut-blue)] text-white hover:bg-[var(--color-dowgnut-blue-dark)] hover:text-white"
                      >
                        {o.status === "payment_review"
                          ? "Review in progress"
                          : isPaymentStuck
                          ? "Return to cart"
                          : "Track order"}
                      </Button>
                    </div>
                  </div>
                </li>
                );
              })}
        </ul>
      )}
    </section>
  );
}
