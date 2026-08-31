"use client";

import { useState, useRef, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useMotionValueEvent,
  useVelocity,
  useSpring,
  animate,
  type PanInfo,
  type MotionValue,
} from "framer-motion";
import { Heart, Minus, Plus, ArrowLeft, Loader2, Check } from "lucide-react";
import { useShop } from "@/store/use-shop";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Donut } from "@/lib/types";

/**
 * DonutSlider — 3D ring display showing donuts of the selected category.
 * Center donut = active, with nutrition + qty + add to cart below.
 *
 * Motion language (per Emil Kowalski standards):
 * - Snap spring inherits drag velocity + projects momentum → physical flicks.
 * - The ring leans into its rotation (velocity-driven rotateZ, spring-smoothed).
 * - Info card crossfades directionally in ~190ms — both cards animate
 *   simultaneously (popLayout), no dead gap between donuts.
 * - Newly-centered donut gets a small landing pulse (suppressed mid-drag).
 * - Tap any side donut to spin it to center (pan handlers live on the ring
 *   container itself, so clicks reach the cards).
 */

const PX_PER_DONUT = 120; // 120px drag = 1 donut slot (fast, responsive drag)
const TILT = 56;
const RADIUS = 160;

/** Strong ease-out — the house curve for enter/exit transitions. */
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function wrapOffset(o: number, len: number) {
  if (len <= 0) return 0;
  const half = len / 2;
  return ((((o + half) % len) + len) % len) - half;
}

function slot(o: number, len: number) {
  if (len <= 0) return { x: 0, y: 0, scale: 1, opacity: 1, blur: 0, zIndex: 10 };
  const angleDeg = (o / len) * 360;
  const rad = (angleDeg * Math.PI) / 180;
  const diskX = Math.sin(rad) * RADIUS;
  const diskY = Math.cos(rad) * RADIUS;
  const tiltRad = (TILT * Math.PI) / 180;
  const x = diskX;
  const y = diskY * Math.cos(tiltRad);
  const depth = (1 - Math.cos(rad)) / 2;
  const inFront = Math.abs(angleDeg) <= 100;
  const opacity = inFront ? Math.max(0.4, 1 - depth * 0.5) : 0;
  const scale = 1 - depth * 0.25;
  const blur = depth * 2.5; // capped — heavy blur on 8 live cards janks low-end phones
  const zIndex = Math.round(20 - depth * 30);
  return { x, y, scale, opacity, blur, zIndex };
}

/** One donut on the ring — derives all transforms from shared `position`. */
function RingCard({
  donut,
  index,
  position,
  len,
  isCenter,
  dragging,
  onCenter,
}: {
  donut: Donut;
  index: number;
  position: MotionValue<number>;
  len: number;
  isCenter: boolean;
  dragging: boolean;
  onCenter: () => void;
}) {
  const wrapped = useTransform(position, (p: number) => wrapOffset(index - p, len));
  const x = useTransform(wrapped, (o) => slot(o, len).x);
  const y = useTransform(wrapped, (o) => slot(o, len).y);
  const scale = useTransform(wrapped, (o) => slot(o, len).scale);
  const opacity = useTransform(wrapped, (o) => slot(o, len).opacity);
  // `filter: none` for near-center cards — skips the blur compositing pipeline.
  const filter = useTransform(wrapped, (o) => {
    const b = slot(o, len).blur;
    return b < 0.15 ? "none" : `blur(${b.toFixed(2)}px)`;
  });
  const zIndex = useTransform(wrapped, (o) => slot(o, len).zIndex);

  return (
    <motion.button
      onClick={onCenter}
      style={{
        x,
        y,
        scale,
        opacity,
        filter,
        zIndex,
        transformStyle: "preserve-3d",
        rotateX: -TILT,
      }}
      // Hit area (size-64/72) is intentionally tighter than the visual image
      // (size-72/80) — the center card's old 384px hit box used to swallow
      // taps meant for side donuts. Image overflows the button visually only.
      className="absolute left-1/2 top-1/2 flex size-64 -translate-x-1/2 -translate-y-1/2 touch-pan-y items-center justify-center cursor-pointer select-none sm:size-72"
      aria-label={donut.name}
    >
      {/* Landing pulse — fires when this donut settles into center (not mid-drag). */}
      <motion.div
        animate={{ scale: isCenter && !dragging ? [1, 1.06, 1] : 1 }}
        transition={{ duration: 0.34, ease: "easeOut" }}
        className="flex items-center justify-center"
      >
        <img
          src={donut.imgUrl}
          alt={donut.name}
          className="size-72 object-contain sm:size-80 drop-shadow-xl"
          draggable={false}
        />
      </motion.div>
    </motion.button>
  );
}

export function DonutSlider() {
  const allDonuts = useShop((s) => s.donuts);
  const filterType = useShop((s) => s.filterType);
  const setFilterType = useShop((s) => s.setFilterType);
  const loadingDonuts = useShop((s) => s.loadingDonuts);
  // Subscribe to the favorites ARRAY (not the helper fn) — hearts update live.
  const favorites = useShop((s) => s.favorites);
  const toggleFavorite = useShop((s) => s.toggleFavorite);
  const addToCart = useShop((s) => s.addToCart);
  const setView = useShop((s) => s.setView);
  const { toast } = useToast();

  const [added, setAdded] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const donuts =
    filterType && filterType !== "all"
      ? allDonuts.filter((d) => d.type === filterType)
      : allDonuts;

  const len = donuts.length;
  const position = useMotionValue<number>(0);
  const [center, setCenter] = useState(0);
  const [qty, setQty] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [dir, setDir] = useState(1); // +1 → moving to next donut, -1 → previous

  const dragStartPos = useRef(0);
  const lastPos = useRef(0);
  // Where the current snap animation is heading — lets rapid keypresses
  // queue up steps instead of getting eaten mid-spring.
  const snapTarget = useRef(0);

  // Ring leans into its rotation: velocity → capped rotateZ, spring-smoothed
  // so the wobble settles naturally instead of tracking raw velocity jitter.
  const velocity = useVelocity(position);
  const tiltRaw = useTransform(velocity, (v) => clamp(-v * 0.8, -8, 8));
  const tiltZ = useSpring(tiltRaw, { stiffness: 140, damping: 18 });

  // Category change → reset picker state via React's "adjust state when a
  // prop changes" pattern (during render — cheaper than an effect).
  const catKey = `${filterType}:${len}`;
  const [prevCatKey, setPrevCatKey] = useState(catKey);
  if (prevCatKey !== catKey) {
    setPrevCatKey(catKey);
    setQty(1);
    setAdded(false);
  }

  // …and spin the ring home smoothly instead of teleporting (external system
  // sync — belongs in an effect; the center index follows via the listener).
  useEffect(() => {
    snapTarget.current = 0;
    if (position.get() !== 0) {
      animate(position, 0, { type: "spring", duration: 0.6, bounce: 0.12 });
    }
  }, [filterType, len]);

  // Real-time sync of center index (+ travel direction) with rotation.
  useMotionValueEvent(position, "change", (p) => {
    if (len <= 0) return;
    const delta = p - lastPos.current;
    if (Math.abs(delta) > 0.001) setDir(delta > 0 ? 1 : -1);
    lastPos.current = p;
    const wrapped = ((Math.round(p) % len) + len) % len;
    setCenter((c) => (c === wrapped ? c : wrapped));
  });

  // Clear the "Added ✓" timer if the component unmounts mid-flight.
  useEffect(() => {
    return () => {
      if (addedTimer.current) clearTimeout(addedTimer.current);
    };
  }, []);

  const snapTo = (targetInt: number) => {
    snapTarget.current = targetInt;
    animate(position, targetInt, {
      // Apple-style spring — inherits the motion value's current velocity,
      // so releases continue the flick instead of restarting from zero.
      type: "spring",
      duration: 0.42,
      bounce: 0.22,
    });
  };

  // Keyboard: ← → step between donuts (ignored while typing in inputs).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = document.activeElement;
      if (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          (el instanceof HTMLElement && el.isContentEditable))
      ) {
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        snapTo(snapTarget.current + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        snapTo(snapTarget.current - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onPanStart = () => {
    dragStartPos.current = position.get();
    snapTarget.current = Math.round(position.get());
    setDragging(true);
  };

  const onPan = (_: unknown, info: PanInfo) => {
    position.set(dragStartPos.current - info.offset.x / PX_PER_DONUT);
  };

  const onPanEnd = (_: unknown, info: PanInfo) => {
    const currentPos = position.get();
    const travel = -info.velocity.x / PX_PER_DONUT; // donuts/sec; + = next donut
    const projected = currentPos + travel * 0.15; // ~150ms of release momentum

    let target: number;
    if (Math.abs(info.velocity.x) > 250) {
      // Deliberate flick: follow momentum, but always advance at least one
      // slot in the travel direction, and never fling more than two.
      target = Math.round(projected);
      if (travel > 0) target = Math.max(target, Math.floor(currentPos) + 1);
      else target = Math.min(target, Math.ceil(currentPos) - 1);
    } else {
      // Gentle release: snap to the nearest slot, ignore velocity noise.
      target = Math.round(currentPos);
    }
    target = clamp(target, Math.ceil(currentPos) - 2, Math.floor(currentPos) + 2);

    snapTo(target);
    setDragging(false);
  };

  const centerThis = (index: number) => {
    if (len <= 0) return;
    // Base on the snap target (not live position) so taps during an
    // in-flight spring still compute the shortest correct path.
    const current = snapTarget.current;
    let delta = index - (((current % len) + len) % len);
    if (delta > len / 2) delta -= len;
    if (delta < -len / 2) delta += len;
    snapTo(current + delta);
  };

  if (loadingDonuts && allDonuts.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-[var(--color-dowgnut-blue)]">
        <Loader2 className="size-8 animate-spin" />
        <p className="text-sm font-medium">Loading dowgs…</p>
      </div>
    );
  }

  if (len === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
        <img
          src="/brand/dowgnut-mascot.png"
          alt=""
          className="h-24 w-24 animate-float object-contain"
        />
        <h3 className="graffiti-text text-xl text-[var(--color-dowgnut-blue-dark)]">
          No dowgs here yet
        </h3>
        <p className="text-sm text-[var(--color-dowgnut-blue-dark)]/70">
          We&apos;re baking fresh — check back in a sec.
        </p>
      </div>
    );
  }

  const current = donuts[center];
  if (!current) return null;

  const fav = favorites.some((f) => f.donutId === current.id);

  const onFav = async () => {
    const wasFav = favorites.some((f) => f.donutId === current.id);
    await toggleFavorite(current.id);
    toast({
      title: wasFav ? "Removed from favorites" : "Saved to favorites 💖",
      description: current.name,
    });
  };

  const onAdd = async () => {
    try {
      await addToCart(current.id, qty);
      setAdded(true);
      if (addedTimer.current) clearTimeout(addedTimer.current);
      addedTimer.current = setTimeout(() => setAdded(false), 1400);
      toast({ title: "Added to cart! 🛒", description: `${current.name} × ${qty}` });
    } catch {
      toast({ title: "Couldn't add to cart", variant: "destructive" });
    }
  };

  return (
    <section className="relative mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-2">
      {/* Back button */}
      <motion.button
        whileHover={{ scale: 1.1, x: -2 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          setFilterType("all");
          setView("shop");
        }}
        className="mb-1 inline-flex size-9 items-center justify-center rounded-full text-[var(--color-dowgnut-blue-dark)]/60 hover:bg-white/80 hover:text-[var(--color-dowgnut-blue-dark)] shadow-sm backdrop-blur-sm cursor-pointer transition-colors"
        aria-label="Back to home"
      >
        <ArrowLeft className="size-5" />
      </motion.button>

      {/* 3D ring — pan/drag handlers live on the container itself so taps
          still reach the donut cards (no more blocking overlay). */}
      <motion.div
        className="relative w-full flex-1 overflow-hidden cursor-grab touch-pan-y active:cursor-grabbing"
        style={{
          perspective: "1600px",
          minHeight: "min(38vh, 300px)",
        }}
        onPanStart={onPanStart}
        onPan={onPan}
        onPanEnd={onPanEnd}
        role="group"
        aria-label="Donut carousel"
      >
        <motion.div
          className="absolute inset-0"
          style={{
            transformStyle: "preserve-3d",
            rotateX: TILT,
            rotateZ: tiltZ,
          }}
        >
          {donuts.map((donut, i) => (
            <RingCard
              key={donut.id}
              donut={donut}
              index={i}
              position={position}
              len={len}
              isCenter={i === center}
              dragging={dragging}
              onCenter={() => centerThis(i)}
            />
          ))}
        </motion.div>
      </motion.div>

      {/* Active donut info — directional crossfade: the new card enters from
          the side the donut arrived from while the old one exits (popLayout). */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 12, x: dir * 26, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, x: -dir * 18, scale: 0.98 }}
          transition={{ duration: 0.19, ease: EASE_OUT }}
          className="mt-2 flex flex-col items-center gap-1.5 rounded-3xl border-2 border-[var(--color-dowgnut-blue-dark)]/10 bg-white/85 px-4 pb-3 pt-3 text-center shadow-lg backdrop-blur-md"
        >
          <h2
            aria-live="polite"
            className="text-base font-black leading-tight text-[var(--color-dowgnut-blue-dark)] sm:text-lg"
          >
            {current.name}{" "}
            <span className="text-xs font-semibold text-[var(--color-dowgnut-blue-dark)]/45">
              ★{current.rating.toFixed(1)}
            </span>
          </h2>
          <p className="text-[11px] font-medium text-[var(--color-dowgnut-blue-dark)]/55">
            {current.calories} kcal · {current.sugar}g sugar · {current.fat}g fat
          </p>

          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-base font-black tabular-nums text-[var(--color-dowgnut-blue-dark)]">
              RM {(current.price * qty).toFixed(2)}
            </span>

            {/* Heart / Favorite with spring pop */}
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.8 }}
              onClick={onFav}
              className={cn(
                "inline-flex size-11 items-center justify-center rounded-full transition-colors hover:bg-white cursor-pointer",
                fav ? "text-[var(--color-dowgnut-pink)]" : "text-[var(--color-dowgnut-blue-dark)]/30"
              )}
              aria-label={fav ? "Remove from favorites" : "Add to favorites"}
              aria-pressed={fav}
            >
              <motion.div
                animate={fav ? { scale: [1, 1.4, 0.95, 1] } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 450, damping: 15 }}
              >
                <Heart className={cn("size-5 transition-colors", fav && "fill-current")} />
              </motion.div>
            </motion.button>

            {/* Quantity Stepper with micro-bounce */}
            <div className="inline-flex items-center rounded-full border border-[var(--color-dowgnut-blue-dark)]/15 bg-white/50 shadow-inner">
              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="inline-flex size-11 items-center justify-center rounded-l-full text-[var(--color-dowgnut-blue-dark)] hover:bg-white/80 cursor-pointer transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="size-4" />
              </motion.button>
              <span
                aria-live="polite"
                aria-label={`Quantity ${qty}`}
                className="min-w-8 text-center text-sm font-extrabold tabular-nums text-[var(--color-dowgnut-blue-dark)] select-none"
              >
                {qty}
              </span>
              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={() => setQty((q) => q + 1)}
                className="inline-flex size-11 items-center justify-center rounded-r-full text-[var(--color-dowgnut-blue-dark)] hover:bg-white/80 cursor-pointer transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="size-4" />
              </motion.button>
            </div>
          </div>

          {/* Add to Cart button with animated success state */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={onAdd}
            disabled={current.stock <= 0}
            className={cn(
              "inline-flex h-11 min-w-44 items-center justify-center gap-1.5 rounded-full px-6 text-sm font-bold text-white shadow-md transition-all cursor-pointer",
              added
                ? "bg-emerald-500 shadow-emerald-500/30"
                : "bg-[var(--color-dowgnut-pink)] hover:bg-[var(--color-dowgnut-pink-dark)] shadow-[var(--color-dowgnut-pink)]/25",
              current.stock <= 0 && "opacity-50 cursor-not-allowed"
            )}
          >
            {added ? (
              <>
                <Check className="size-4 stroke-[3]" />
                <span>Added to cart!</span>
              </>
            ) : current.stock <= 0 ? (
              "Sold out"
            ) : (
              "Add to Cart"
            )}
          </motion.button>

          <p className="text-[10px] font-bold uppercase tracking-wider tabular-nums text-[var(--color-dowgnut-blue-dark)]/40 mt-0.5">
            {filterType && filterType !== "all" ? `${filterType} · ` : ""}{`${center + 1}/${len} · swipe or ← → to explore`}
          </p>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
