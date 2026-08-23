"use client";

import { PackageOpen } from "lucide-react";
import { useShop } from "@/store/use-shop";
import { DonutCard } from "./donut-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export function DonutGrid() {
  const donuts = useShop((s) => s.donuts);
  const loading = useShop((s) => s.loadingDonuts);
  const setView = useShop((s) => s.setView);
  const setFilterType = useShop((s) => s.setFilterType);
  const setSearch = useShop((s) => s.setSearch);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col p-3">
            <Skeleton className="aspect-square w-full rounded-xl bg-[var(--color-dowgnut-lime)]/40" />
            <Skeleton className="mt-2 h-3 w-3/4 rounded-full" />
            <Skeleton className="mt-1.5 h-3 w-1/2 rounded-full" />
            <Skeleton className="mt-2 h-6 w-full rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (donuts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <PackageOpen className="size-8 text-[var(--color-dowgnut-blue)]/50" />
        <div>
          <h3 className="text-sm font-bold text-[var(--color-dowgnut-blue-dark)]">No donuts found</h3>
          <p className="mt-0.5 text-xs text-[var(--color-dowgnut-blue-dark)]/60">
            Try a different flavor or search.
          </p>
        </div>
        <Button
          onClick={() => {
            setFilterType("all");
            setSearch("");
          }}
          className="h-9 rounded-full bg-[var(--color-dowgnut-pink)] px-4 text-xs text-white hover:bg-[var(--color-dowgnut-pink-dark)]"
        >
          Reset
        </Button>
      </div>
    );
  }

  return (
    <>
      <p className="text-xs text-[var(--color-dowgnut-blue-dark)]/50">
        {donuts.length} {donuts.length === 1 ? "donut" : "donuts"} available
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {donuts.map((d) => (
          <DonutCard key={d.id} donut={d} />
        ))}
      </div>
    </>
  );
}
