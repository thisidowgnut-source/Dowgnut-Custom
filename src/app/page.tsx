"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useShop } from "@/store/use-shop";
import { useToast } from "@/hooks/use-toast";
import { SplashScreen } from "@/components/dohnut/splash-screen";
import { DohnutHeader } from "@/components/dohnut/dohnut-header";
import { BottomNav } from "@/components/dohnut/bottom-nav";
import { SwipeView } from "@/components/dohnut/swipe-view";
import { DonutSlider } from "@/components/dohnut/donut-slider";
import { FavoritesView } from "@/components/dohnut/favorites-view";
import { CheckoutView } from "@/components/dohnut/checkout-view";
import { OrdersView } from "@/components/dohnut/orders-view";
import { OrderTrackingView } from "@/components/dohnut/order-tracking-view";
import { AdminDashboard } from "@/components/dohnut/admin-dashboard";
import { DetailModal } from "@/components/dohnut/detail-modal";
import { CartDrawer } from "@/components/dohnut/cart-drawer";
import { AIConcierge } from "@/components/dohnut/ai-concierge";
import { AIDesigner } from "@/components/dohnut/ai-designer";
import { ShopHome } from "@/components/dohnut/shop-home";
import { ErrorBoundary } from "@/components/dohnut/error-boundary";
import { apiFetch } from "@/lib/api";
import { classifyPaymentState } from "@/lib/payment-state";
import type { Order } from "@/lib/types";

// NOTE: AdminDashboard (recharts) + OrderTrackingView (socket.io-client) were
// trialled as next/dynamic code-splits but that deadlocks with
// AnimatePresence mode="wait" (lazy subtree suspends mid-enter → the view
// never commits and the app blanks). Keep static imports; split the heavy
// DEPS inside those components instead if bundle size ever matters.

export default function Home() {
  const view = useShop((s) => s.view);
  const init = useShop((s) => s.init);
  const startTracking = useShop((s) => s.startTracking);
  const setView = useShop((s) => s.setView);
  const { toast } = useToast();
  const paymentReturnHandled = useRef(false);

  useEffect(() => {
    init();
  }, [init]);

  // A redirect is not proof of payment. Reload the session-owned order and
  // wait briefly for a signed webhook before announcing success.
  useEffect(() => {
    if (paymentReturnHandled.current) return;
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("payment_return") ?? params.get("paid");
    if (!orderId) return;
    paymentReturnHandled.current = true;

    let cancelled = false;
    const verifyReturn = async () => {
      try {
        let order: Order | null = null;
        for (let attempt = 0; attempt < 5; attempt += 1) {
          order = await apiFetch<Order>(`/api/orders/${encodeURIComponent(orderId)}`);
          if (classifyPaymentState({ status: order.status, paidAt: order.paidAt }) !== "pending") {
            break;
          }
          await new Promise((resolve) => window.setTimeout(resolve, 1000));
        }
        if (cancelled || !order) return;

        const paymentState = classifyPaymentState({
          status: order.status,
          paidAt: order.paidAt,
        });
        if (order.status === "payment_review") {
          setView("orders");
          toast({
            title: "Payment received — order review needed",
            description: "Your payment is recorded. Our team needs to review item availability before fulfilment.",
          });
        } else if (paymentState === "paid") {
          startTracking(order.id, order.customerName);
          toast({
            title: "Payment received 🍩",
            description: "DOH BOLEH! Your order is confirmed — the fryer is warming up.",
          });
        } else if (paymentState === "failed") {
          setView("checkout");
          toast({
            title: "Payment not completed",
            description: "Your cart is still here. Review it and try payment again.",
            variant: "destructive",
          });
        } else {
          setView("orders");
          toast({
            title: "Payment confirmation pending",
            description: "We have not received confirmation yet. Your order will update automatically.",
          });
        }
      } catch {
        if (cancelled) return;
        setView("orders");
        toast({
          title: "Could not verify payment",
          description: "No success has been recorded. Open Orders to check again.",
          variant: "destructive",
        });
      } finally {
        if (!cancelled) {
          window.history.replaceState(null, "", window.location.pathname);
        }
      }
    };
    void verifyReturn();
    return () => {
      cancelled = true;
      paymentReturnHandled.current = false;
    };
  }, [setView, startTracking, toast]);

  // Direction note: shop↔slider previously used a zoom crossfade in a
  // separate presence tree — unified into one keyed child for reliability
  // (see comment in main). Views all slide for a consistent rhythm.

  return (
    <>
      <SplashScreen />
      <DohnutHeader />
      <ErrorBoundary>
        <main className="relative flex flex-1 flex-col overflow-hidden">
          {/* Keyed motion.div WITHOUT AnimatePresence/exit: the old view
            unmounts synchronously on view change and the new one animates
            in via framer's initial→animate (proven reliable). AnimatePresence
            exit tracking froze mid-flight in this environment (headless rAF
            throttling + long dev sessions), leaving invisible absolute divs
            stacked above the active view that swallowed every click — which
            is what broke the payment flow e2e. Deterministic > decorative
            exit animations. */}
          <motion.div
            key={view}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            // RX-12: pb must account for safe-area-inset-bottom, otherwise
            // an iPhone home indicator creates a 34px gap between the last
            // row of content and the bottom nav.
            className="absolute inset-0 pb-[calc(4rem+env(safe-area-inset-bottom,0px))] flex flex-col overflow-y-auto overscroll-contain"
          >
            {view === "shop" && <ShopHome />}
            {view === "slider" && <DonutSlider />}
            {view === "swipe" && <SwipeView />}
            {view === "favorites" && <FavoritesView />}
            {view === "checkout" && <CheckoutView />}
            {view === "orders" && <OrdersView />}
            {view === "tracking" && <OrderTrackingView />}
            {view === "admin" && <AdminDashboard />}
          </motion.div>
        </main>
      </ErrorBoundary>

      {/* Bottom nav on ALL views — no desktop dead-end */}
      <BottomNav />

      <DetailModal />
      <CartDrawer />
      {/* AI Concierge FAB (all views) + AI Designer FAB (added this session) */}
      <AIConcierge />
      <AIDesigner />
    </>
  );
}
