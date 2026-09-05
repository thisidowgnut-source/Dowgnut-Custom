"use client";

import { useEffect } from "react";
import { useShop } from "@/store/use-shop";
import { DonutCard } from "./donut-card";
import { Button } from "@/components/ui/button";
import { HeartCrack, ArrowLeft } from "lucide-react";

export function FavoritesView() {
  const favorites = useShop((s) => s.favorites);
  const loadFavorites = useShop((s) => s.loadFavorites);
  const setView = useShop((s) => s.setView);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  return (
    <section className="mx-auto w-full max-w-7xl flex-1 px-4 pb-12 pt-8 sm:px-6">
      <header className="mb-6 flex items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView("shop")}
            aria-label="Back to shop"
            className="inline-flex size-11 items-center justify-center rounded-full bg-white text-[var(--color-dowgnut-blue)] shadow-sm hover:bg-[var(--color-dowgnut-blue)] hover:text-white"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-dowgnut-pink-dark)]">
              Saved for later
            </p>
            <h1 className="graffiti-text text-4xl text-[var(--color-dowgnut-blue-dark)] sm:text-5xl">
              My Favorites
            </h1>
          </div>
        </div>
      </header>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-[var(--color-dowgnut-blue-dark)]/15 bg-[var(--color-dowgnut-cream)] p-10 text-center">
          <HeartCrack className="size-10 text-[var(--color-dowgnut-pink)]" />
          <img
            src="/brand/dohnut-mascot.png"
            alt=""
            className="h-24 w-24 animate-float object-contain"
          />
          <h3 className="graffiti-text text-2xl text-[var(--color-dowgnut-blue-dark)]">
            DOH MY GOSH!
          </h3>
          <p className="text-sm text-[var(--color-dowgnut-blue-dark)]/70">
            No favorites yet — DOH NUT MISS OUT. Tap the heart on any donut to save it here.
          </p>
          <Button
            onClick={() => setView("shop")}
            className="rounded-full bg-[var(--color-dowgnut-pink)] px-6 text-white hover:bg-[var(--color-dowgnut-pink-dark)] hover:text-white"
          >
            Browse flavors
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {favorites.map((f) => (
            <DonutCard key={f.id} donut={f.donut} />
          ))}
        </div>
      )}
    </section>
  );
}
