"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useShop } from "@/store/use-shop";
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

export default function Home() {
  const view = useShop((s) => s.view);
  const init = useShop((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  // Direction: shop→slider feels like "zoom in", slider→shop "zoom out".
  const isShopSlider = view === "shop" || view === "slider";

  return (
    <>
      <SplashScreen />
      <DowgnutHeader />
      <ErrorBoundary>
        <main className="relative flex flex-1 flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            {/* Shop + Slider share a synchronized crossfade+scale transition */}
            {isShopSlider && (
              <motion.div
                key={view}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 pb-16 flex flex-col overflow-hidden"
              >
                {view === "shop" && <ShopHome />}
                {view === "slider" && <DonutSlider />}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Other views — slide in from right */}
          <AnimatePresence mode="wait">
            {!isShopSlider && (
              <motion.div
                key={view}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="absolute inset-0 pb-16 flex flex-col overflow-y-auto overscroll-contain"
              >
                {view === "swipe" && <SwipeView />}
                {view === "favorites" && <FavoritesView />}
                {view === "checkout" && <CheckoutView />}
                {view === "orders" && <OrdersView />}
                {view === "tracking" && <OrderTrackingView />}
                {view === "admin" && <AdminDashboard />}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </ErrorBoundary>

      {/* Bottom nav on ALL views — no desktop dead-end */}
      <BottomNav />

      <DetailModal />
      <CartDrawer />
      {/* AI Concierge only on non-shop/slider views (keeps home+slider minimal) */}
      <AIConcierge />
      <AIDesigner />
    </>
  );
}
