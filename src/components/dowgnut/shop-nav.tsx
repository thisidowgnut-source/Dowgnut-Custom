"use client";

import { Search, X, Truck, ShieldCheck, Clock } from "lucide-react";
import { useShop } from "@/store/use-shop";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { key: "all", label: "All", emoji: "🍩" },
  { key: "classic", label: "Classic", emoji: "⭕" },
  { key: "sprinkled", label: "Sprinkled", emoji: "🌈" },
  { key: "stuffed", label: "Stuffed", emoji: "🫃" },
  { key: "specialty", label: "Specialty", emoji: "✨" },
];

const TRUST = [
  { icon: Truck, title: "Free Delivery", desc: "Orders over RM25" },
  { icon: ShieldCheck, title: "Secure Payment", desc: "TNG · DuitNow · Card" },
  { icon: Clock, title: "Fresh Daily", desc: "Baked every morning" },
];

export function ShopNav() {
  const filterType = useShop((s) => s.filterType);
  const setFilterType = useShop((s) => s.setFilterType);
  const search = useShop((s) => s.search);
  const setSearch = useShop((s) => s.setSearch);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6">
      {/* Search bar — prominent e-commerce style */}
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[var(--color-dowgnut-blue-dark)]/40" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search donuts, flavors, toppings…"
          className="h-12 rounded-full border-[var(--color-dowgnut-blue-dark)]/10 bg-white pl-12 pr-10 text-base shadow-sm"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-dowgnut-blue-dark)]/40 hover:text-[var(--color-dowgnut-pink)]"
            aria-label="Clear search"
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      {/* Category pills — horizontal scroll */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-dowgnut sm:mx-0 sm:px-0">
        {CATEGORIES.map((c) => {
          const active = filterType === c.key;
          return (
            <button
              key={c.key}
              onClick={() => setFilterType(c.key)}
              className={cn(
                "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-all",
                active
                  ? "bg-[var(--color-dowgnut-blue-dark)] text-white shadow-sm"
                  : "bg-white text-[var(--color-dowgnut-blue-dark)] shadow-sm hover:bg-[var(--color-dowgnut-cream)]"
              )}
            >
              <span className="text-base">{c.emoji}</span>
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Trust badges */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {TRUST.map((t) => (
          <div
            key={t.title}
            className="flex flex-col items-center gap-1 rounded-xl bg-white p-3 text-center shadow-sm"
          >
            <t.icon className="size-5 text-[var(--color-dowgnut-pink)]" />
            <p className="text-xs font-bold text-[var(--color-dowgnut-blue-dark)]">{t.title}</p>
            <p className="text-[10px] text-[var(--color-dowgnut-blue-dark)]/50">{t.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
