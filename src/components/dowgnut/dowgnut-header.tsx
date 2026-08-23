"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Menu } from "lucide-react";
import { useShop } from "@/store/use-shop";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { DowgNutLogo } from "@/components/dowgnut/dowgnut-logo";

export function DowgnutHeader() {
  const view = useShop((s) => s.view);
  const setView = useShop((s) => s.setView);
  const cart = useShop((s) => s.cart);
  const setCartOpen = useShop((s) => s.setCartOpen);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const cartCount = cart.reduce((n, c) => n + c.quantity, 0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (v: "shop" | "favorites" | "orders" | "admin") => {
    setView(v);
    setMobileOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-40 text-white transition-all duration-300 ${
        scrolled
          ? "bg-[var(--color-dowgnut-blue)]/90 backdrop-blur-xl shadow-md"
          : "bg-transparent"
      }`}
    >
      <div className={`mx-auto flex items-center justify-between px-4 transition-all duration-300 ${scrolled ? "h-12" : "h-14"} sm:px-6`}>
        {/* Left: dripping brand wordmark */}
        <button
          onClick={() => go("shop")}
          className="-ml-2 flex shrink-0 items-center gap-2 rounded-full px-2 py-1 transition-transform hover:scale-105"
          aria-label="DowgNut home"
        >
          <DowgNutLogo height={32} variant={scrolled ? "pill" : "plain"} />
        </button>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          {/* Cart with animated badge */}
          <button
            onClick={() => setCartOpen(true)}
            className="relative inline-flex size-10 items-center justify-center rounded-full bg-[var(--color-dowgnut-pink)] text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
            aria-label="Open cart"
          >
            <ShoppingCart className="size-4" />
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span
                  key={cartCount}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-dowgnut-lime)] px-1 text-[9px] font-bold text-[var(--color-dowgnut-blue-dark)] ring-2 ring-[var(--color-dowgnut-blue)]"
                >
                  {cartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                className={`inline-flex size-10 items-center justify-center rounded-full transition-colors sm:hidden ${
                  scrolled
                    ? "bg-white/10 text-white"
                    : "bg-[var(--color-dowgnut-blue-dark)]/15 text-[var(--color-dowgnut-blue-dark)]"
                }`}
                aria-label="Open menu"
              >
                <Menu className="size-4" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[80vw] bg-[var(--color-dowgnut-cream)] sm:max-w-xs">
              <SheetHeader className="px-4">
                <SheetTitle className="graffiti-text text-2xl text-[var(--color-dowgnut-blue-dark)]">
                  Menu
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-2 px-4">
                {[
                  { k: "shop", l: "Shop" },
                  { k: "favorites", l: "Favorites" },
                  { k: "orders", l: "Orders" },
                  { k: "admin", l: "Admin" },
                ].map((item) => (
                  <button
                    key={item.k}
                    onClick={() => go(item.k as any)}
                    className="flex h-12 items-center rounded-2xl px-4 text-left text-base font-semibold text-[var(--color-dowgnut-blue-dark)] transition-colors hover:bg-white"
                  >
                    {item.l}
                  </button>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
