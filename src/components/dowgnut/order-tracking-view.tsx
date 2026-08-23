"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Loader2,
  PartyPopper,
  Timer,
  Truck,
  ChefHat,
  Flame,
  Home,
} from "lucide-react";
import { useShop } from "@/store/use-shop";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus } from "@/lib/types";

interface StatusPayload {
  orderId: string;
  status: OrderStatus;
  step: 0 | 1 | 2 | 3;
  etaMinutes: number;
  message: string;
  updatedAt: string;
}

const STEPS = [
  {
    key: "preparing" as OrderStatus,
    label: "Preparing",
    icon: ChefHat,
    sub: "Mixing, rolling, cutting — the dough life.",
  },
  {
    key: "baking" as OrderStatus,
    label: "Baking",
    icon: Flame,
    sub: "Into the fryer, golden and puffing up.",
  },
  {
    key: "out_for_delivery" as OrderStatus,
    label: "Out for delivery",
    icon: Truck,
    sub: "On the road, boxed up and rolling your way.",
  },
  {
    key: "delivered" as OrderStatus,
    label: "Delivered",
    icon: Home,
    sub: "Arrived! Time to feast. 🍩",
  },
];

// Map the OrderStatus string → step index for safety
const STATUS_TO_STEP: Record<OrderStatus, number> = {
  preparing: 0,
  baking: 1,
  out_for_delivery: 2,
  delivered: 3,
};

export function OrderTrackingView() {
  const trackingOrderId = useShop((s) => s.trackingOrderId);
  const trackingCustomerName = useShop((s) => s.trackingCustomerName);
  const stopTracking = useShop((s) => s.stopTracking);
  const setView = useShop((s) => s.setView);
  const addToCart = useShop((s) => s.addToCart);
  const setCartOpen = useShop((s) => s.setCartOpen);
  const loadOrders = useShop((s) => s.loadOrders);

  const [payload, setPayload] = useState<StatusPayload | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch order details once we have an id
  useEffect(() => {
    if (!trackingOrderId) return;
    let mounted = true;
    (async () => {
      try {
        const data = await apiFetch<Order>(`/api/orders/${trackingOrderId}`);
        if (!mounted) return;
        setOrder(data);
        // Seed a baseline payload from the REST order
        setPayload({
          orderId: data.id,
          status: data.status,
          step: STATUS_TO_STEP[data.status] as 0 | 1 | 2 | 3,
          etaMinutes: data.etaMinutes,
          message:
            STEPS[STATUS_TO_STEP[data.status]]?.sub ?? "Tracking your order…",
          updatedAt: data.createdAt,
        });
      } catch {
        if (mounted) setError("Couldn't load this order.");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [trackingOrderId]);

  // WebSocket lifecycle
  useEffect(() => {
    if (!trackingOrderId) return;

    let disposed = false;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    const socket = io("/?XTransformPort=3004", {
      transports: ["websocket", "polling"],
      reconnection: true,
      forceNew: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      if (disposed) return;
      setConnected(true);
      setError(null);
      socket.emit("track-order", {
        orderId: trackingOrderId,
        customerName: trackingCustomerName,
      });
    });

    socket.on("connect_error", () => setConnected(false));
    socket.on("disconnect", () => setConnected(false));

    socket.on("order-status", (data: StatusPayload) => {
      if (disposed) return;
      if (!data || data.orderId !== trackingOrderId) return;
      setPayload(data);
      // when delivered, refresh orders list so Orders view is up-to-date later
      if (data.status === "delivered") {
        loadOrders().catch(() => undefined);
      }
    });

    // Fallback: if socket fails to connect within 5s, start polling REST.
    fallbackTimer = setTimeout(() => {
      if (disposed) return;
      if (!socket.connected) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        pollingRef.current = setInterval(async () => {
          try {
            const data = await apiFetch<Order>(`/api/orders/${trackingOrderId}`);
            if (disposed) return;
            setOrder(data);
            setPayload({
              orderId: data.id,
              status: data.status,
              step: STATUS_TO_STEP[data.status] as 0 | 1 | 2 | 3,
              etaMinutes: data.etaMinutes,
              message:
                STEPS[STATUS_TO_STEP[data.status]]?.sub ??
                "Tracking your order…",
              updatedAt: new Date().toISOString(),
            });
          } catch {
            /* keep last known */
          }
        }, 3000);
      }
    }, 5000);

    return () => {
      disposed = true;
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      try {
        socket.emit("stop-tracking", { orderId: trackingOrderId });
      } catch {
        /* noop */
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [trackingOrderId, trackingCustomerName, loadOrders]);

  if (!trackingOrderId) {
    return (
      <section className="mx-auto w-full max-w-3xl flex-1 px-4 pb-12 pt-8 sm:px-6">
        <div className="flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-[var(--color-dowgnut-blue-dark)]/15 bg-[var(--color-dowgnut-cream)] p-10 text-center">
          <Timer className="size-10 text-[var(--color-dowgnut-pink)]" />
          <h2 className="graffiti-text text-2xl text-[var(--color-dowgnut-blue-dark)]">
            No order to track
          </h2>
          <p className="text-sm text-[var(--color-dowgnut-blue-dark)]/70">
            Place an order or pick one from your history to see it travel in
            real time.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => setView("shop")}
              className="rounded-full bg-[var(--color-dowgnut-pink)] px-6 text-white hover:bg-[var(--color-dowgnut-pink-dark)] hover:text-white"
            >
              Start an order
            </Button>
            <Button
              onClick={() => setView("orders")}
              variant="outline"
              className="rounded-full border-[var(--color-dowgnut-blue)] text-[var(--color-dowgnut-blue)] hover:bg-[var(--color-dowgnut-blue)] hover:text-white"
            >
              View past orders
            </Button>
          </div>
        </div>
      </section>
    );
  }

  const currentStep = payload?.step ?? 0;
  const isDelivered = payload?.status === "delivered";

  const onOrderAgain = async () => {
    if (!order) return;
    for (const item of order.items) {
      try {
        await addToCart(item.donutId, item.quantity);
      } catch {
        /* ignore */
      }
    }
    setCartOpen(true);
    setView("shop");
  };

  return (
    <section className="mx-auto w-full max-w-4xl flex-1 px-4 pb-12 pt-8 sm:px-6">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              stopTracking();
              setView("orders");
            }}
            aria-label="Back to orders"
            className="inline-flex size-11 items-center justify-center rounded-full bg-white text-[var(--color-dowgnut-blue)] shadow-sm hover:bg-[var(--color-dowgnut-blue)] hover:text-white"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-dowgnut-pink-dark)]">
              Live tracking
            </p>
            <h1 className="graffiti-text text-3xl text-[var(--color-dowgnut-blue-dark)] sm:text-4xl">
              Order #{trackingOrderId.slice(0, 8)}
            </h1>
          </div>
        </div>
        <Badge
          className={
            connected
              ? "bg-[var(--color-dowgnut-lime)] text-[var(--color-dowgnut-blue-dark)]"
              : "bg-muted text-muted-foreground"
          }
        >
          {connected ? "● Live" : "○ Reconnecting"}
        </Badge>
      </header>

      {error && (
        <Card className="mb-4 rounded-2xl border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </Card>
      )}

      {/* Status message */}
      <Card className="mb-6 overflow-hidden rounded-3xl border-4 border-[var(--color-dowgnut-blue-dark)] bg-gradient-to-br from-[var(--color-dowgnut-blue)] to-[var(--color-dowgnut-blue-dark)] p-6 text-white">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/70">
          <span
            className={cn(
              "inline-flex size-2 rounded-full",
              isDelivered ? "bg-[var(--color-dowgnut-lime)]" : "bg-[var(--color-dowgnut-pink)] animate-pulse"
            )}
          />
          {isDelivered ? "Delivered" : "In progress"}
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={payload?.message}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="graffiti-text mt-2 text-2xl leading-tight sm:text-3xl"
          >
            {payload?.message ?? "Tracking your order…"}
          </motion.p>
        </AnimatePresence>
        {!isDelivered && payload && (
          <p className="mt-3 inline-flex items-center gap-2 text-sm text-white/80">
            <Timer className="size-4" />
            ETA ~{payload.etaMinutes} min
          </p>
        )}
      </Card>

      {/* Stepper */}
      <Card className="mb-6 rounded-3xl border-2 border-[var(--color-dowgnut-blue-dark)]/10 bg-[var(--color-dowgnut-cream)] p-5 sm:p-6">
        <ol className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-0">
          {STEPS.map((step, i) => {
            const isDone = i < currentStep;
            const isCurrent = i === currentStep;
            const Icon = step.icon;
            return (
              <li
                key={step.key}
                className="relative flex flex-1 items-start gap-3 sm:flex-col sm:items-center sm:text-center"
              >
                {/* connecting line (desktop) */}
                {i > 0 && (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute left-0 top-6 hidden h-0.5 w-full -translate-x-full sm:block",
                      i <= currentStep
                        ? "bg-[var(--color-dowgnut-pink)]"
                        : "bg-[var(--color-dowgnut-blue-dark)]/10"
                    )}
                  />
                )}
                <div
                  className={cn(
                    "relative z-10 inline-flex size-12 shrink-0 items-center justify-center rounded-full border-2 shadow-sm transition-all sm:size-14",
                    isDone
                      ? "border-[var(--color-dowgnut-pink)] bg-[var(--color-dowgnut-pink)] text-white"
                      : isCurrent
                        ? "border-[var(--color-dowgnut-pink)] bg-white text-[var(--color-dowgnut-pink)]"
                        : "border-[var(--color-dowgnut-blue-dark)]/15 bg-white text-[var(--color-dowgnut-blue-dark)]/40"
                  )}
                >
                  {isDone ? (
                    <CheckCircle2 className="size-6" />
                  ) : isCurrent ? (
                    <Loader2 className="size-6 animate-spin" />
                  ) : (
                    <Icon className="size-6" />
                  )}
                </div>
                <div className="sm:mt-2">
                  <p
                    className={cn(
                      "text-sm font-bold",
                      isDone || isCurrent
                        ? "text-[var(--color-dowgnut-blue-dark)]"
                        : "text-[var(--color-dowgnut-blue-dark)]/40"
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="hidden text-xs text-[var(--color-dowgnut-blue-dark)]/60 sm:block">
                    {step.sub}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </Card>

      {/* Order recap */}
      {order && (
        <Card className="mb-6 rounded-3xl border-2 border-[var(--color-dowgnut-blue-dark)]/10 bg-white p-5 sm:p-6">
          <h2 className="graffiti-text mb-3 text-lg text-[var(--color-dowgnut-blue-dark)]">
            In the box
          </h2>
          <ul className="flex flex-col gap-2">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-2xl bg-[var(--color-dowgnut-cream)]/70 p-2"
              >
                <img
                  src={item.imgUrl}
                  alt={item.name}
                  className="size-12 object-contain"
                />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="line-clamp-1 text-sm font-bold text-[var(--color-dowgnut-blue-dark)]">
                    {item.name}
                  </span>
                  <span className="text-xs text-[var(--color-dowgnut-blue-dark)]/60">
                    {item.quantity} × RM {item.price.toFixed(2)}
                  </span>
                </div>
                <span className="text-sm font-bold text-[var(--color-dowgnut-blue-dark)]">
                  RM {(item.price * item.quantity).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between border-t border-[var(--color-dowgnut-blue-dark)]/10 pt-3 text-sm">
            <span className="text-[var(--color-dowgnut-blue-dark)]/70">
              Delivery to
            </span>
            <span className="text-right font-semibold text-[var(--color-dowgnut-blue-dark)]">
              {order.customerName}
              <br />
              <span className="text-xs font-normal text-[var(--color-dowgnut-blue-dark)]/60">
                {order.address}, {order.city} {order.zip}
              </span>
            </span>
          </div>
        </Card>
      )}

      {isDelivered && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl border-4 border-[var(--color-dowgnut-pink)] bg-[var(--color-dowgnut-lime-bright)] p-6 text-center"
        >
          <PartyPopper className="mx-auto size-10 text-[var(--color-dowgnut-pink)]" />
          <h2 className="graffiti-text mt-2 text-3xl text-[var(--color-dowgnut-blue-dark)]">
            Enjoy your dowgs!
          </h2>
          <p className="mt-1 text-sm text-[var(--color-dowgnut-blue-dark)]/70">
            Thanks for choosing DowgNut. Want another round?
          </p>
          <Button
            onClick={onOrderAgain}
            className="mt-4 h-12 rounded-full bg-[var(--color-dowgnut-pink)] px-6 text-white hover:bg-[var(--color-dowgnut-pink-dark)] hover:text-white"
          >
            Order again
          </Button>
        </motion.div>
      )}
    </section>
  );
}
