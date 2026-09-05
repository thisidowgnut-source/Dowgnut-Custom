"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Menu, Sparkles } from "lucide-react";
import { useShop } from "@/store/use-shop";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { DowgNutLogo } from "@/components/dohnut/dohnut-logo";

export function DohnutHeader() {
  const view = useShop((s) => s.view);
  const setView = useShop((s) => s.setView);
  const cart = useShop((s) => s.cart);
  const setCartOpen = useShop((s) => s.setCartOpen);
  const setConciergeOpen = useShop((s) => s.setConciergeOpen);
  const setDesignerOpen = useShop((s) => s.setDesignerOpen);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const cartCount = cart.reduce((n, c) => n + c.quantity, 0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (v: "shop" | "swipe" | "favorites" | "orders" | "admin") => {
    setView(v);
    setMobileOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-40 text-white transition-[background-color,backdrop-filter,box-shadow] duration-200 ease-out ${
        scrolled
          ? "bg-[var(--color-dowgnut-blue)]/90 backdrop-blur-xl shadow-md"
          : "bg-transparent"
      }`}
    >
      <div className={`mx-auto flex items-center justify-between px-4 transition-[height] duration-200 ease-out sm:px-6 ${scrolled ? "h-14 sm:h-14" : "h-16 sm:h-18"}`}>
        {/* Left: dripping brand wordmark */}
        <button
          onClick={() => go("shop")}
          className="-ml-2 flex shrink-0 items-center gap-2 rounded-full px-2 py-1 transition-transform hover:scale-105 cursor-pointer"
          aria-label="DowgNut home"
        >
          <DowgNutLogo height={scrolled ? 38 : 48} variant={scrolled ? "pill" : "plain"} />
        </button>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          {/* Cart with animated badge and fly-to-cart receiver anchor */}
          <motion.button
            id="dohnut-cart-btn"
            onClick={() => setCartOpen(true)}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            animate={cartCount > 0 ? { scale: [1, 1.18, 1], transition: { duration: 0.35, ease: [0.23, 1, 0.32, 1] } } : {}}
            className="relative inline-flex size-10 items-center justify-center rounded-full bg-[var(--color-dowgnut-pink)] text-white shadow-sm transition-colors"
            aria-label="Open cart"
          >
            <ShoppingCart className="size-4" />
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span
                  key={cartCount}
                  initial={{ scale: 0.85, opacity: 0, rotate: -8 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  exit={{ scale: 0.85, opacity: 0, rotate: 8 }}
                  transition={{ type: "spring", stiffness: 520, damping: 14 }}
                  className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-dowgnut-lime)] px-1 text-[9px] font-bold text-[var(--color-dowgnut-blue-dark)] ring-2 ring-[var(--color-dowgnut-blue)] shadow-xs"
                >
                  {cartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* AI Concierge quick access button */}
          <button
            onClick={() => setConciergeOpen(true)}
            className={`inline-flex size-10 items-center justify-center rounded-full transition-colors cursor-pointer ${
              scrolled
                ? "bg-white/10 text-white hover:bg-white/20"
                : "bg-[var(--color-dowgnut-blue-dark)]/15 text-[var(--color-dowgnut-blue-dark)] hover:bg-[var(--color-dowgnut-blue-dark)]/25"
            }`}
            aria-label="Open AI Concierge"
            title="DOH BOY™ AI Concierge"
          >
            <Sparkles className="size-4 text-[var(--color-dowgnut-pink)]" />
          </button>

          {/* Menu — visible at ALL breakpoints. */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                className={`inline-flex size-10 items-center justify-center rounded-full transition-colors ${
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
                  { k: "shop", l: "Shop", fn: () => go("shop") },
                  { k: "swipe", l: "Swipe Deck 🔥", fn: () => go("swipe") },
                  { k: "favorites", l: "Favorites", fn: () => go("favorites") },
                  { k: "orders", l: "Orders", fn: () => go("orders") },
                  {
                    k: "concierge",
                    l: "DOH BOY™ AI Concierge ✨",
                    fn: () => {
                      setMobileOpen(false);
                      setConciergeOpen(true);
                    },
                  },
                  {
                    k: "designer",
                    l: "AI Donut Designer 🎨",
                    fn: () => {
                      setMobileOpen(false);
                      setDesignerOpen(true);
                    },
                  },
                  { k: "admin", l: "Admin", fn: () => go("admin") },
                ].map((item) => (
                  <button
                    key={item.k}
                    onClick={item.fn}
                    className="flex h-12 items-center rounded-2xl px-4 text-left text-base font-semibold text-[var(--color-dowgnut-blue-dark)] transition-colors hover:bg-white cursor-pointer"
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

export const DowgnutHeader = DohnutHeader;

