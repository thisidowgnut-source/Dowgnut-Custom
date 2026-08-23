"use client";

import { useState, useRef, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useMotionValueEvent,
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
 */

const PX_PER_DONUT = 120; // 120px drag = 1 donut slot (fast, responsive drag)
const TILT = 56;
const RADIUS = 160;

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
  const blur = depth * 3.5;
  const zIndex = Math.round(20 - depth * 30);
  return { x, y, scale, opacity, blur, zIndex };
}

/** One donut on the ring — derives all transforms from shared `position`. */
function RingCard({
  donut,
  index,
  position,
  len,
  onCenter,
}: {
  donut: Donut;
  index: number;
  position: MotionValue<number>;
  len: number;
  onCenter: () => void;
}) {
  const wrapped = useTransform(position, (p: number) => wrapOffset(index - p, len));
  const x = useTransform(wrapped, (o) => slot(o, len).x);
  const y = useTransform(wrapped, (o) => slot(o, len).y);
  const scale = useTransform(wrapped, (o) => slot(o, len).scale);
  const opacity = useTransform(wrapped, (o) => slot(o, len).opacity);
  const filter = useTransform(wrapped, (o) => `blur(${slot(o, len).blur}px)`);
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
      className="absolute left-1/2 top-1/2 flex h-80 w-80 -translate-x-1/2 -translate-y-1/2 items-center justify-center cursor-pointer select-none sm:h-96 sm:w-96"
      aria-label={donut.name}
    >
      <img
        src={donut.imgUrl}
        alt={donut.name}
        className="size-72 object-contain sm:size-80 drop-shadow-xl"
        draggable={false}
      />
    </motion.button>
  );
}

export function DonutSlider() {
  const allDonuts = useShop((s) => s.donuts);
  const filterType = useShop((s) => s.filterType);
  const setFilterType = useShop((s) => s.setFilterType);
  const loadingDonuts = useShop((s) => s.loadingDonuts);
  const isFavorite = useShop((s) => s.isFavorite);
  const toggleFavorite = useShop((s) => s.toggleFavorite);
  const addToCart = useShop((s) => s.addToCart);
  const openDetail = useShop((s) => s.openDetail);
  const setView = useShop((s) => s.setView);
  const { toast } = useToast();

  const [added, setAdded] = useState(false);

  const donuts =
    filterType && filterType !== "all"
      ? allDonuts.filter((d) => d.type === filterType)
      : allDonuts;

  const len = donuts.length;
  const position = useMotionValue<number>(0);
  const [center, setCenter] = useState(0);
  const [qty, setQty] = useState(1);
  const [dragging, setDragging] = useState(false);

  const dragStartPos = useRef(0);

  // Reset position + center when category filter changes
  useEffect(() => {
    position.set(0);
    setCenter(0);
    setQty(1);
    setAdded(false);
  }, [filterType, len]);

  // Real-time synchronization of center index with rotation
  useMotionValueEvent(position, "change", (p) => {
    if (len <= 0) return;
    const wrapped = ((Math.round(p) % len) + len) % len;
    setCenter(wrapped);
  });

  const snapTo = (targetInt: number) => {
    animate(position, targetInt, {
      type: "spring",
      stiffness: 320,
      damping: 28,
      mass: 0.65,
    });
  };

  const onPanStart = () => {
    dragStartPos.current = position.get();
    setDragging(true);
  };

  const onPan = (_: unknown, info: PanInfo) => {
    position.set(dragStartPos.current - info.offset.x / PX_PER_DONUT);
  };

  const onPanEnd = (_: unknown, info: PanInfo) => {
    const currentPos = position.get();
    let target = Math.round(currentPos);
    
    // Quick swipe / flick support
    if (Math.abs(info.velocity.x) > 200) {
      if (info.velocity.x < 0) {
        target = Math.ceil(currentPos);
      } else {
        target = Math.floor(currentPos);
      }
    }
    
    snapTo(target);
    setDragging(false);
  };

  const centerThis = (index: number) => {
    if (len <= 0) return;
    const current = Math.round(position.get());
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

  const fav = isFavorite(current.id);

  const onFav = async () => {
    const wasFav = isFavorite(current.id);
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
      setTimeout(() => setAdded(false), 1400);
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

      {/* 3D ring with swipe/drag */}
      <div
        className="relative w-full flex-1 overflow-hidden"
        style={{
          perspective: "1600px",
          minHeight: "min(38vh, 300px)",
        }}
      >
        {/* Pan / drag interactive layer */}
        <motion.div
          className="absolute inset-0 z-40 cursor-grab touch-pan-y active:cursor-grabbing"
          onPanStart={onPanStart}
          onPan={onPan}
          onPanEnd={onPanEnd}
        />

        <div
          className="absolute inset-0"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateX(${TILT}deg)`,
          }}
        >
          {donuts.map((donut, i) => (
            <RingCard
              key={donut.id}
              donut={donut}
              index={i}
              position={position}
              len={len}
              onCenter={() => centerThis(i)}
            />
          ))}
        </div>
      </div>

      {/* Active donut info — sticky card style at the bottom */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          className="mt-2 flex flex-col items-center gap-1.5 rounded-3xl border-2 border-[var(--color-dowgnut-blue-dark)]/10 bg-white/85 px-4 pb-3 pt-3 text-center shadow-lg backdrop-blur-md"
        >
          <h2 className="text-base font-black leading-tight text-[var(--color-dowgnut-blue-dark)] sm:text-lg">
            {current.name}{" "}
            <span className="text-xs font-semibold text-[var(--color-dowgnut-blue-dark)]/45">
              ★{current.rating.toFixed(1)}
            </span>
          </h2>
          <p className="text-[11px] font-medium text-[var(--color-dowgnut-blue-dark)]/55">
            {current.calories} kcal · {current.sugar}g sugar · {current.fat}g fat
          </p>

          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-base font-black text-[var(--color-dowgnut-blue-dark)]">
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
                className="min-w-8 text-center text-sm font-extrabold text-[var(--color-dowgnut-blue-dark)] select-none"
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

          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-dowgnut-blue-dark)]/40 mt-0.5">
            {filterType && filterType !== "all" ? `${filterType} · ` : ""}{`${center + 1}/${len} · swipe to explore`}
          </p>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
