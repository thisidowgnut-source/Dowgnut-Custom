"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useShop } from "@/store/use-shop";
import { useToast } from "@/hooks/use-toast";
import { SplashScreen } from "@/components/dowgnut/splash-screen";
import { DowgnutHeader } from "@/components/dowgnut/dowgnut-header";
import { BottomNav } from "@/components/dowgnut/bottom-nav";
import { SwipeView } from "@/components/dowgnut/swipe-view";
import { DonutSlider } from "@/components/dowgnut/donut-slider";
import { FavoritesView } from "@/components/dowgnut/favorites-view";
import { CheckoutView } from "@/components/dowgnut/checkout-view";
import { OrdersView } from "@/components/dowgnut/orders-view";
import { OrderTrackingView } from "@/components/dowgnut/order-tracking-view";
import { AdminDashboard } from "@/components/dowgnut/admin-dashboard";
import { DetailModal } from "@/components/dowgnut/detail-modal";
import { CartDrawer } from "@/components/dowgnut/cart-drawer";
import { AIConcierge } from "@/components/dowgnut/ai-concierge";
import { AIDesigner } from "@/components/dowgnut/ai-designer";
import { ShopHome } from "@/components/dowgnut/shop-home";
import { ErrorBoundary } from "@/components/dowgnut/error-boundary";

// NOTE: AdminDashboard (recharts) + OrderTrackingView (socket.io-client) were
// trialled as next/dynamic code-splits but that deadlocks with
// AnimatePresence mode="wait" (lazy subtree suspends mid-enter → the view
// never commits and the app blanks). Keep static imports; split the heavy
// DEPS inside those components instead if bundle size ever matters.

export default function Home() {
  const view = useShop((s) => s.view);
  const init = useShop((s) => s.init);
  const startTracking = useShop((s) => s.startTracking);
  const profile = useShop((s) => s.profile);
  const { toast } = useToast();

  useEffect(() => {
    init();
  }, [init]);

  // Billplz redirects the payer back to `/?paid=<orderId>` after checkout.
  // Land them straight in live tracking + confirm with a toast, then scrub
  // the param so a refresh doesn't replay it.
  useEffect(() => {
    const paid = new URLSearchParams(window.location.search).get("paid");
    if (!paid) return;
    window.history.replaceState(null, "", window.location.pathname);
    startTracking(paid, profile?.customerName ?? "");
    toast({
      title: "Payment received 🍩",
      description:
        "DOH BOLEH! Your order is confirmed — the fryer is warming up.",
    });
  }, [startTracking, profile, toast]);

  // Direction note: shop↔slider previously used a zoom crossfade in a
  // separate presence tree — unified into one keyed child for reliability
  // (see comment in main). Views all slide for a consistent rhythm.

  return (
    <>
      <SplashScreen />
      <DowgnutHeader />
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
            className="absolute inset-0 pb-16 flex flex-col overflow-y-auto overscroll-contain"
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
