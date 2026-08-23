"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useShop } from "@/store/use-shop";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

interface Slide {
  image: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: string;
  onClick: () => void;
}

export function HeroCarousel() {
  const setView = useShop((s) => s.setView);
  const setConciergeOpen = useShop((s) => s.setConciergeOpen);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const slides: Slide[] = [
    {
      image: "/brand/hero-banner.png",
      eyebrow: "Fresh Drop",
      title: "GOOD VIBES & GOOD DOWG",
      subtitle: "Bold. Playful. Authentic donuts, delivered fresh.",
      cta: "Shop the drop",
      onClick: () => setView("shop"),
    },
    {
      image: "/brand/promo-1.png",
      eyebrow: "Daily Made",
      title: "FRESHLY GLAZED DAILY",
      subtitle: "Classic, sprinkled, stuffed & specialty — pick your poison.",
      cta: "Browse flavors",
      onClick: () => setView("shop"),
    },
    {
      image: "/brand/promo-2.png",
      eyebrow: "AI Powered",
      title: "MEET THE DOWGNUT CONCIERGE",
      subtitle: "Our AI donut whisperer finds your perfect match.",
      cta: "Ask the concierge",
      onClick: () => setConciergeOpen(true),
    },
  ];

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 5000);
    return () => clearInterval(t);
  }, [paused, slides.length]);

  return (
    <section
      className="relative mx-auto mt-4 w-full max-w-7xl px-4 sm:px-6"
      aria-label="Featured promotions"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl border-4 border-[var(--color-dowgnut-blue-dark)] bg-[var(--color-dowgnut-cream)] shadow-[0_8px_0_rgba(7,51,79,0.18)] sm:aspect-[21/9]">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <img
              src={slides[index].image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-dowgnut-blue-dark)]/85 via-[var(--color-dowgnut-blue-dark)]/40 to-transparent" />
            <div className="relative flex h-full flex-col justify-center gap-3 p-6 sm:p-10 lg:p-14">
              <span className="inline-flex w-fit items-center rounded-full bg-[var(--color-dowgnut-lime)] px-3 py-1 text-xs font-bold uppercase tracking-widest text-[var(--color-dowgnut-blue-dark)]">
                {slides[index].eyebrow}
              </span>
              <h2 className="graffiti-text max-w-xl text-3xl leading-[0.95] text-white drop-shadow-md sm:text-5xl lg:text-6xl">
                {slides[index].title}
              </h2>
              <p className="max-w-md text-sm text-white/90 sm:text-lg">
                {slides[index].subtitle}
              </p>
              <div>
                <Button
                  onClick={slides[index].onClick}
                  className="mt-1 h-11 rounded-full bg-[var(--color-dowgnut-pink)] px-6 text-base font-bold text-white hover:bg-[var(--color-dowgnut-pink-dark)] hover:text-white"
                >
                  {slides[index].cta}
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dot indicators */}
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={
                i === index
                  ? "h-2.5 w-6 rounded-full bg-[var(--color-dowgnut-pink)] transition-all"
                  : "h-2.5 w-2.5 rounded-full bg-white/60 hover:bg-white transition-all"
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}
