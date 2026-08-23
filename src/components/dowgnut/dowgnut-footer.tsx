"use client";

import { Heart, Instagram, Package, Store, Twitter } from "lucide-react";
import { useShop } from "@/store/use-shop";

export function DowgnutFooter() {
  const setView = useShop((s) => s.setView);
  const setCartOpen = useShop((s) => s.setCartOpen);

  return (
    <footer className="mt-auto bg-[var(--color-dowgnut-blue-dark)] text-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-3">
            <img
              src="/brand/dowgnut-mascot.png"
              alt=""
              className="size-12 animate-float object-contain"
            />
            <img
              src="/brand/dowgnut-logo-wordmark.png"
              alt="DowgNut"
              className="h-9 w-auto rounded-full bg-[var(--color-dowgnut-cream)] px-3 py-1"
              draggable={false}
            />
          </div>
          <p className="mt-4 max-w-xs text-sm text-white/70">
            Bold, playful, authentic donuts — freshly glazed daily and
            delivered to your door across Malaysia.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-green-600/20 px-2 py-1 text-[10px] font-bold text-green-400">
              ☪️ Halal Certified
            </span>
            <a
              href="https://wa.me/60123456789"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md bg-[#25D366]/20 px-2 py-1 text-[10px] font-bold text-[#25D366]"
            >
              💬 WhatsApp Us
            </a>
          </div>
        </div>

        {/* Quick links — customer-facing only */}
        <div>
          <p className="graffiti-text text-sm uppercase tracking-widest text-[var(--color-dowgnut-lime)]">
            Quick links
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <button
                onClick={() => setView("shop")}
                className="inline-flex items-center gap-2 text-white/80 hover:text-[var(--color-dowgnut-pink-soft)]"
              >
                <Store className="size-4" /> Shop
              </button>
            </li>
            <li>
              <button
                onClick={() => setView("favorites")}
                className="inline-flex items-center gap-2 text-white/80 hover:text-[var(--color-dowgnut-pink-soft)]"
              >
                <Heart className="size-4" /> Favorites
              </button>
            </li>
            <li>
              <button
                onClick={() => setView("orders")}
                className="inline-flex items-center gap-2 text-white/80 hover:text-[var(--color-dowgnut-pink-soft)]"
              >
                <Package className="size-4" /> Orders
              </button>
            </li>
            <li>
              <button
                onClick={() => setCartOpen(true)}
                className="inline-flex items-center gap-2 text-white/80 hover:text-[var(--color-dowgnut-pink-soft)]"
              >
                <Package className="size-4" /> Cart
              </button>
            </li>
          </ul>
        </div>

        {/* Connect + payment methods */}
        <div>
          <p className="graffiti-text text-sm uppercase tracking-widest text-[var(--color-dowgnut-lime)]">
            We accept
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex h-8 items-center rounded-md bg-white px-2.5 text-xs font-black text-[#005EB8]">
              Touch 'n Go
            </span>
            <span className="inline-flex h-8 items-center rounded-md bg-white px-2.5 text-xs font-black text-[var(--color-dowgnut-blue-dark)]">
              DuitNow
            </span>
            <span className="inline-flex h-8 items-center rounded-md bg-white px-2.5 text-xs font-black text-[#EB001B]">
              Visa
            </span>
            <span className="inline-flex h-8 items-center rounded-md bg-white px-2.5 text-xs font-black text-[#FF5F00]">
              Mastercard
            </span>
          </div>
          <p className="graffiti-text mt-6 text-sm uppercase tracking-widest text-[var(--color-dowgnut-lime)]">
            Connect
          </p>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            <li className="inline-flex items-center gap-2">
              <Instagram className="size-4 text-[var(--color-dowgnut-pink-soft)]" />
              @dowgnut.my
            </li>
            <li className="inline-flex items-center gap-2">
              <Twitter className="size-4 text-[var(--color-dowgnut-pink-soft)]" />
              @dowgnut_my
            </li>
          </ul>
          <p className="mt-4 text-xs text-white/50">
            123 Jalan Sugar, Bukit Bintang, 55100 Kuala Lumpur, Malaysia
          </p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-white/60 sm:flex-row sm:px-6">
          <p>© 2025 DowgNut — Good Vibes &amp; Good Dowg</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView("admin")}
              className="text-white/30 transition-colors hover:text-white/60"
            >
              Admin
            </button>
            <p className="italic">Built with AI 🍩</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
