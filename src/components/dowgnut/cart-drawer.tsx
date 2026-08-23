"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2, Truck, X, ArrowRight, Sparkles } from "lucide-react";
import { useShop } from "@/store/use-shop";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  FREE_DELIVERY_THRESHOLD,
  computePricing,
} from "@/lib/pricing";

export function CartDrawer() {
  const open = useShop((s) => s.cartOpen);
  const setOpen = useShop((s) => s.setCartOpen);
  const cart = useShop((s) => s.cart);
  const loading = useShop((s) => s.cartLoading);
  const updateCartQty = useShop((s) => s.updateCartQty);
  const removeFromCart = useShop((s) => s.removeFromCart);
  const clearCart = useShop((s) => s.clearCart);
  const setView = useShop((s) => s.setView);
  const { toast } = useToast();

  const subtotal = cart.reduce((sum, c) => sum + c.donut.price * c.quantity, 0);
  const { delivery, sst, total } = computePricing(subtotal);
  const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const progressPct = Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100);
  const itemCount = cart.reduce((n, c) => n + c.quantity, 0);

  const onCheckout = () => {
    if (cart.length === 0) return;
    setOpen(false);
    setView("checkout");
  };

  const onClear = async () => {
    await clearCart();
    toast({ title: "Cart cleared" });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="bottom"
        className="mx-auto flex max-h-[82vh] w-full max-w-lg flex-col gap-0 overflow-hidden rounded-t-[32px] border-x border-t border-[var(--color-dowgnut-blue-dark)]/15 bg-[var(--color-dowgnut-cream)]/95 p-0 shadow-2xl backdrop-blur-2xl"
      >
        {/* iOS-Style Pill Grab Handle */}
        <div className="flex w-full justify-center pt-2.5 pb-1 select-none">
          <div className="h-1.5 w-12 rounded-full bg-black/20" />
        </div>

        {/* Modern Header with clean brand styling */}
        <SheetHeader className="relative border-b border-[var(--color-dowgnut-blue-dark)]/8 bg-white/70 px-5 pb-3 pt-1 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-[var(--color-dowgnut-pink)] text-white shadow-sm">
                <ShoppingBag className="size-4.5 stroke-[2.2]" />
              </div>
              <div>
                <SheetTitle className="graffiti-text text-xl tracking-tight text-[var(--color-dowgnut-blue-dark)]">
                  Your Box
                </SheetTitle>
                <p className="text-[11px] font-semibold text-[var(--color-dowgnut-blue-dark)]/50">
                  {itemCount > 0
                    ? `${itemCount} dowg${itemCount === 1 ? "" : "s"} selected`
                    : "No dowgs added yet"}
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setOpen(false)}
              aria-label="Close cart"
              className="inline-flex size-8 items-center justify-center rounded-full bg-black/5 text-[var(--color-dowgnut-blue-dark)] transition-colors hover:bg-black/10 cursor-pointer"
            >
              <X className="size-4" />
            </motion.button>
          </div>

          {/* Sleek Free Delivery Meter */}
          {cart.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2.5 rounded-xl bg-[var(--color-dowgnut-cream)] p-2.5 border border-[var(--color-dowgnut-blue-dark)]/8"
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-[var(--color-dowgnut-blue-dark)]">
                  <Truck className="size-3.5 text-[var(--color-dowgnut-pink)]" />
                  {remaining > 0 ? (
                    <span>
                      Add <strong className="text-[var(--color-dowgnut-pink-dark)]">RM{remaining.toFixed(2)}</strong> for FREE delivery
                    </span>
                  ) : (
                    <span className="text-emerald-600 font-extrabold">
                      🎉 FREE delivery unlocked!
                    </span>
                  )}
                </span>
                <span className="text-[10px] text-[var(--color-dowgnut-blue-dark)]/50">
                  {Math.round(progressPct)}%
                </span>
              </div>
              <Progress
                value={progressPct}
                className="mt-1.5 h-1.5 bg-black/5"
              />
            </motion.div>
          )}
        </SheetHeader>

        {/* Items List — compact & scrollable */}
        <div className="flex-1 overflow-y-auto scrollbar-dowgnut px-4 py-3 max-h-[42vh]">
          {loading && cart.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-[var(--color-dowgnut-blue)]">
              <p className="text-sm font-medium">Loading your box…</p>
            </div>
          ) : cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2.5 py-10 text-center">
              <img
                src="/brand/dowgnut-mascot.png"
                alt=""
                className="h-24 w-24 animate-float object-contain"
              />
              <div className="space-y-0.5">
                <h3 className="graffiti-text text-lg text-[var(--color-dowgnut-blue-dark)]">
                  Your Box is Empty!
                </h3>
                <p className="text-xs text-[var(--color-dowgnut-blue-dark)]/60">
                  Pick your favorite flavors and start filling up your box.
                </p>
              </div>
              <Button
                onClick={() => {
                  setOpen(false);
                  setView("shop");
                }}
                className="mt-1 rounded-full bg-[var(--color-dowgnut-pink)] px-5 text-xs font-bold text-white shadow-sm hover:bg-[var(--color-dowgnut-pink-dark)] cursor-pointer"
              >
                Browse Flavors
                <ArrowRight className="ml-1 size-3.5" />
              </Button>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              <ul className="flex flex-col gap-2">
                {cart.map((item) => (
                  <motion.li
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.18 }}
                    className="group relative flex items-center gap-3 rounded-2xl border border-[var(--color-dowgnut-blue-dark)]/8 bg-white p-2.5 shadow-xs transition-all hover:shadow-sm"
                  >
                    {/* Donut image preview */}
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-[var(--color-dowgnut-cream)] p-1">
                      <img
                        src={item.donut.imgUrl}
                        alt={item.donut.name}
                        className="size-12 object-contain transition-transform group-hover:scale-105"
                      />
                    </div>

                    {/* Donut details */}
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold text-[var(--color-dowgnut-blue-dark)]">
                            {item.donut.name}
                          </p>
                          <p className="text-[11px] font-semibold text-[var(--color-dowgnut-blue-dark)]/50">
                            RM{item.donut.price.toFixed(2)} each
                          </p>
                        </div>

                        {/* Remove item button */}
                        <button
                          onClick={() => removeFromCart(item.id)}
                          aria-label={`Remove ${item.donut.name}`}
                          className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-black/25 transition-colors hover:bg-red-50 hover:text-red-500 cursor-pointer"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>

                      {/* Bottom row: Stepper + Item total */}
                      <div className="mt-1.5 flex items-center justify-between">
                        {/* Compact pill stepper */}
                        <div className="inline-flex items-center rounded-full border border-[var(--color-dowgnut-blue-dark)]/15 bg-white shadow-xs">
                          <button
                            onClick={() => updateCartQty(item.id, item.quantity - 1)}
                            aria-label="Decrease quantity"
                            disabled={item.quantity <= 1}
                            className="inline-flex size-6 items-center justify-center rounded-l-full text-[var(--color-dowgnut-blue-dark)] transition-colors hover:bg-black/5 disabled:opacity-30 cursor-pointer"
                          >
                            <Minus className="size-3" />
                          </button>
                          <span
                            aria-live="polite"
                            className="min-w-6 text-center text-xs font-black text-[var(--color-dowgnut-blue-dark)] select-none"
                          >
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQty(item.id, item.quantity + 1)}
                            aria-label="Increase quantity"
                            className="inline-flex size-6 items-center justify-center rounded-r-full text-[var(--color-dowgnut-blue-dark)] transition-colors hover:bg-black/5 cursor-pointer"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>

                        {/* Item Total */}
                        <span className="text-sm font-black text-[var(--color-dowgnut-blue-dark)]">
                          RM{(item.donut.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </AnimatePresence>
          )}
        </div>

        {/* Modern Clean Footer with checkout CTA */}
        {cart.length > 0 && (
          <div className="border-t border-[var(--color-dowgnut-blue-dark)]/8 bg-white/95 px-5 pb-5 pt-3 backdrop-blur-md">
            {/* Price breakdown */}
            <div className="space-y-1 text-xs text-[var(--color-dowgnut-blue-dark)]/70 pb-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-[var(--color-dowgnut-blue-dark)]">RM{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span className={cn("font-bold", delivery === 0 ? "text-emerald-600 font-extrabold" : "text-[var(--color-dowgnut-blue-dark)]")}>
                  {delivery === 0 ? "FREE" : `RM${delivery.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>SST (6%)</span>
                <span className="font-bold text-[var(--color-dowgnut-blue-dark)]">RM{sst.toFixed(2)}</span>
              </div>
            </div>

            {/* Total Row */}
            <div className="flex items-baseline justify-between border-t border-[var(--color-dowgnut-blue-dark)]/10 pt-2 mb-2.5">
              <span className="text-xs font-black uppercase tracking-wider text-[var(--color-dowgnut-blue-dark)]">
                Total
              </span>
              <span className="text-xl font-black text-[var(--color-dowgnut-blue-dark)]">
                RM{total.toFixed(2)}
              </span>
            </div>

            {/* Primary Checkout CTA */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={onCheckout}
              className="flex h-12 w-full items-center justify-between rounded-full bg-[var(--color-dowgnut-pink)] px-5 text-sm font-extrabold text-white shadow-lg shadow-[var(--color-dowgnut-pink)]/25 transition-all hover:bg-[var(--color-dowgnut-pink-dark)] cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-black">
                <span>RM{total.toFixed(2)}</span>
                <ArrowRight className="size-3.5 stroke-[2.5]" />
              </div>
            </motion.button>

            {/* Footer sub-links */}
            <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--color-dowgnut-blue-dark)]/40 font-semibold">
              <button
                onClick={onClear}
                className="hover:text-red-500 transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <Trash2 className="size-3" />
                Clear box
              </button>
              <span className="flex items-center gap-1">
                <Sparkles className="size-3 text-amber-500" />
                Freshly Baked Guarantee
              </span>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
