"use client";

import { motion } from "framer-motion";
import { Store, Heart, ShoppingCart, User } from "lucide-react";
import { useShop } from "@/store/use-shop";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const view = useShop((s) => s.view);
  const setView = useShop((s) => s.setView);
  const cartOpen = useShop((s) => s.cartOpen);
  const setCartOpen = useShop((s) => s.setCartOpen);
  const cart = useShop((s) => s.cart);
  const favorites = useShop((s) => s.favorites);

  const cartCount = cart.reduce((n, c) => n + c.quantity, 0);
  const favCount = favorites.length;

  interface NavItem {
    key: "shop" | "favorites" | "cart" | "orders";
    label: string;
    icon: typeof Store;
    badge?: number;
    action?: () => void;
  }

  const items: NavItem[] = [
    {
      key: "shop",
      label: "Shop",
      icon: Store,
      action: () => {
        setCartOpen(false);
        setView("shop");
      },
    },
    {
      key: "favorites",
      label: "Saved",
      icon: Heart,
      badge: favCount > 0 ? favCount : undefined,
      action: () => {
        setCartOpen(false);
        setView("favorites");
      },
    },
    {
      key: "cart",
      label: "Cart",
      icon: ShoppingCart,
      badge: cartCount > 0 ? cartCount : undefined,
      action: () => setCartOpen(true),
    },
    {
      key: "orders",
      label: "Orders",
      icon: User,
      action: () => {
        setCartOpen(false);
        setView("orders");
      },
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-dowgnut-blue)]/12 bg-[var(--color-dowgnut-cream)]/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] shadow-lg"
      aria-label="Bottom navigation"
    >
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-2">
        {items.map((item) => {
          // Robust active state resolution so navbar is always 100% consistent across all sub-views
          const isActive =
            item.key === "shop"
              ? (view === "shop" || view === "slider") && !cartOpen
              : item.key === "cart"
              ? cartOpen
              : item.key === "favorites"
              ? view === "favorites" && !cartOpen
              : item.key === "orders"
              ? (view === "orders" || view === "tracking") && !cartOpen
              : false;

          const Icon = item.icon;

          return (
            <motion.button
              key={item.key}
              onClick={item.action}
              whileTap={{ scale: 0.92, y: -2 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-1 py-2 cursor-pointer transition-colors select-none",
                isActive
                  ? "text-[var(--color-dowgnut-blue)]"
                  : "text-[var(--color-dowgnut-blue-dark)]/40 hover:text-[var(--color-dowgnut-blue-dark)]/70"
              )}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              {/* Active Indicator Pill */}
              {isActive && (
                <motion.div
                  layoutId="navIndicator"
                  className="absolute top-0 h-1 w-8 rounded-full bg-[var(--color-dowgnut-blue)] shadow-xs"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              <div className="relative">
                <Icon className={cn("size-5 transition-transform", isActive ? "stroke-[2.5] scale-105" : "stroke-[1.8]")} />

                {/* Live Badge Pop Animation */}
                {item.badge && item.badge > 0 ? (
                  <motion.span
                    key={item.badge}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    className="absolute -right-2.5 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-dowgnut-pink)] px-1 text-[9px] font-black text-white shadow-sm ring-2 ring-[var(--color-dowgnut-cream)]"
                  >
                    {item.badge}
                  </motion.span>
                ) : null}
              </div>

              <span
                className={cn(
                  "text-[11px] leading-tight tracking-tight transition-all",
                  isActive ? "font-black text-[var(--color-dowgnut-blue)]" : "font-semibold"
                )}
              >
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
