"use client";

import { Search, X } from "lucide-react";
import { useShop } from "@/store/use-shop";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const PILLS = [
  { key: "all", label: "All" },
  { key: "classic", label: "Classic" },
  { key: "sprinkled", label: "Sprinkled" },
  { key: "stuffed", label: "Stuffed" },
  { key: "specialty", label: "Specialty" },
];

export function FilterBar() {
  const filterType = useShop((s) => s.filterType);
  const setFilterType = useShop((s) => s.setFilterType);
  const sort = useShop((s) => s.sort);
  const setSort = useShop((s) => s.setSort);
  const search = useShop((s) => s.search);
  const setSearch = useShop((s) => s.setSearch);

  return (
    <section className="sticky top-16 z-30 mx-auto mt-6 w-full max-w-7xl px-4 sm:px-6">
      <div className="rounded-2xl border border-[var(--color-dowgnut-blue-dark)]/10 bg-[var(--color-dowgnut-cream)]/95 p-3 shadow-sm backdrop-blur sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Pills */}
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:overflow-visible">
            {PILLS.map((p) => {
              const isActive = filterType === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => setFilterType(p.key)}
                  className={cn(
                    "inline-flex h-9 shrink-0 items-center rounded-full px-4 text-sm font-bold uppercase tracking-wide transition-all",
                    isActive
                      ? "bg-[var(--color-dowgnut-pink)] text-white shadow-sm"
                      : "bg-white/70 text-[var(--color-dowgnut-blue-dark)] hover:bg-white"
                  )}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Sort + Search row */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger
                aria-label="Sort"
                className="h-10 w-full rounded-full bg-white sm:w-44"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="price-asc">Price ↑</SelectItem>
                <SelectItem value="price-desc">Price ↓</SelectItem>
                <SelectItem value="rating">Top rated</SelectItem>
                <SelectItem value="name">A–Z</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-dowgnut-blue)]/60" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search flavors…"
                className="h-10 rounded-full pl-9 pr-9"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-dowgnut-blue)]/60 hover:text-[var(--color-dowgnut-pink)]"
                  aria-label="Clear search"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
