"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useShop } from "@/store/use-shop";
import { cn } from "@/lib/utils";

/**
 * SplashScreen — cinematic brand moment with original wordmark logo.
 * Logo fade-in + glow pulse + sprinkle particles.
 */

const SPRINKLES = Array.from({ length: 20 }).map((_, i) => ({
  x: ((i * 37) % 300) - 150,
  y: ((i * 53) % 400) - 200,
  size: 4 + (i % 6),
  color: ["var(--color-dowgnut-pink)", "var(--color-dowgnut-blue)", "var(--color-dowgnut-lime)", "var(--color-dowgnut-pink-dark)"][i % 4],
  delay: (i % 5) * 0.1,
  duration: 2 + (i % 3),
}));

export function SplashScreen() {
  const splashDone = useShop((s) => s.splashDone);
  const dismissSplash = useShop((s) => s.dismissSplash);
  const [visible, setVisible] = useState(true);
  // RX-11: once the splash has been dismissed, drop pointer-events so a
  // stuck splash overlay can never block clicks on the underlying app.
  // (AnimatePresence handles the unmount, but this is a belt-and-braces
  // safety net for slow-render edge cases.)
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (splashDone) return;
    // Respect reduced-motion: show & dismiss quickly so users with
    // motion sensitivity aren't trapped behind the brand moment.
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const hold = reduce ? 600 : 1600;
    const fade = reduce ? 200 : 500;
    const t1 = setTimeout(() => setVisible(false), hold);
    const t2 = setTimeout(() => {
      dismissSplash();
      setDismissed(true);
    }, hold + fade);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [splashDone, dismissSplash]);

  return (
    <AnimatePresence>
      {!splashDone && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          animate={{ opacity: visible ? 1 : 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          onClick={dismissSplash}
          className={cn(
            "fixed inset-0 z-[100] flex cursor-pointer flex-col items-center justify-center overflow-hidden bg-[var(--color-dowgnut-blue-dark)]",
            (dismissed || splashDone) && "pointer-events-none"
          )}
          role="dialog"
          aria-label="DowgNut splash screen"
        >
          {/* Radial glow pulse */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.5, 1.2], opacity: [0, 0.4, 0.25] }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="pointer-events-none absolute size-[500px] rounded-full"
            style={{
              background: "radial-gradient(circle, #fde047 0%, transparent 60%)",
              filter: "blur(40px)",
            }}
          />

          {/* Sprinkle particles */}
          {SPRINKLES.map((s, i) => (
            <motion.div
              key={i}
              initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
              animate={{
                x: s.x,
                y: s.y,
                scale: 1,
                opacity: [0, 1, 0.6, 0],
              }}
              transition={{
                delay: s.delay,
                duration: s.duration,
                repeat: Infinity,
                repeatDelay: 1,
              }}
              className="pointer-events-none absolute rounded-full"
              style={{ width: s.size, height: s.size, background: s.color }}
            />
          ))}

          {/* DOHNUT wordmark — brand logo rasmi (alt text) */}
          <motion.img
            src="/brand/dohnut-logo-wordmark.png"
            alt="DOHNUT"
            className="h-20 w-auto drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] sm:h-28"
            draggable={false}
            initial={{ scale: 0.5, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          />

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mt-4 text-xs font-medium tracking-[0.3em] text-[var(--color-dowgnut-lime)]"
          >
            GOOD VIBE · GOOD DOH.
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
