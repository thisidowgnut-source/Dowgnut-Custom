"use client";

import { useMemo, useState } from "react";
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
import { Plus } from "lucide-react";
import { useShop } from "@/store/use-shop";
import type { Donut } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * DonutCarousel3D — a tilted roulette-disk carousel.
 *
 * Donuts sit evenly spaced around a CIRCULAR DISK that is tilted back
 * (rotateX) like a roulette wheel viewed at an angle. Each donut faces
 * the camera (counter-rotated to stay upright & readable). Spinning the
 * disk orbits the donuts around the center — the front (bottom) donut
 * is the active/selected one.
 *
 * A single shared motion value `position` (in donut-slot units) drives
 * every donut's transform, so the whole disk rotates as one rigid piece.
 */

// Drag sensitivity: pixels of horizontal drag = 1 donut slot.
const PX_PER_DONUT = 140;

// Roulette disk geometry.
const TILT = 56; // degrees the disk is tilted back (0 = flat from top, 90 = vertical)
const RADIUS = 180; // px — how far donuts sit from the disk center

/** Wrap a raw offset into the shortest signed range [-len/2, len/2). */
function wrapOffset(o: number, len: number) {
  const half = len / 2;
  return ((((o + half) % len) + len) % len) - half;
}

/**
 * Compute the on-screen position + visual properties for a donut at slot
 * offset `o` from the front, on a tilted roulette disk with `len` slots.
 *
 * Returns:
 *  - x:       horizontal screen offset (sin of angle × radius)
 *  - y:       vertical screen offset (ellipse — foreshortened by tilt)
 *  - z:       depth (front = toward viewer, back = away)
 *  - scale, opacity, blur, zIndex: depth-based visual cues
 */
function slot(o: number, len: number) {
  // Angle around the disk from the front (bottom) position. 0 = front,
  // 180 = back. Positive = clockwise (to the right first).
  const angleDeg = (o / len) * 360;
  const rad = (angleDeg * Math.PI) / 180;

  // Position on the disk (before tilt): front donut at bottom (y+).
  const diskX = Math.sin(rad) * RADIUS;
  const diskY = Math.cos(rad) * RADIUS; // +y = front/bottom on disk

  // After rotateX(TILT): y foreshortens (× cos TILT), z gains depth (× sin TILT).
  const tiltRad = (TILT * Math.PI) / 180;
  const x = diskX;
  const y = diskY * Math.cos(tiltRad); // vertical on screen (ellipse)
  // Flatten z so donuts render at near-uniform apparent size (less 3D
  // foreshortening, more like the flat grid display).
  const z = 0;

  // Depth factor: 0 at front, 1 at back.
  const depth = (1 - Math.cos(rad)) / 2;
  const blur = depth * 4.5;
  const zIndex = Math.round(20 - depth * 30);

  // Half-moon: only show the front semicircle (|angle| <= 90°).
  const inFront = Math.abs(angleDeg) <= 90;
  const opacity = inFront ? Math.max(0.5, 1 - depth * 0.4) : 0;

  // Standard size — no depth scaling (all donuts same size).
  const scale = 1;

  return { x, y, z, scale, opacity, blur, zIndex };
}

/** One donut on the roulette disk — derives ALL transforms from `position`. */
function DonutCard3D({
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
  // Wrapped offset of this donut from the front (shortest path around).
  const wrapped = useTransform(position, (p: number) => wrapOffset(index - p, len));

  const x = useTransform(wrapped, (o) => slot(o, len).x);
  const y = useTransform(wrapped, (o) => slot(o, len).y);
  const z = useTransform(wrapped, (o) => slot(o, len).z);
  const scale = useTransform(wrapped, (o) => slot(o, len).scale);
  const opacity = useTransform(wrapped, (o) => slot(o, len).opacity);
  const filter = useTransform(wrapped, (o) => `blur(${slot(o, len).blur}px)`);
  const zIndex = useTransform(wrapped, (o) => slot(o, len).zIndex);

  return (
    <motion.button
      type="button"
      onClick={onCenter}
      style={{
        x,
        y,
        z,
        scale,
        opacity,
        filter,
        zIndex,
        transformStyle: "preserve-3d",
        // Counter-rotate so the donut face stays flat toward the camera,
        // undoing the parent disk's rotateX(TILT) — keeps visual size
        // uniform (no foreshortening) like the grid cards.
        rotateX: -TILT,
      }}
      className="absolute left-1/2 top-1/2 flex h-56 w-56 -translate-x-1/2 -translate-y-1/2 items-center justify-center sm:h-72 sm:w-72"
      aria-label={donut.name}
    >
      <img
        src={donut.imgUrl}
        alt={donut.name}
        className="size-full object-contain"
        draggable={false}
      />
    </motion.button>
  );
}

/** Active donut name + actions — re-renders the instant `activeIndex` MV
 *  crosses an integer, so name AND buttons stay in perfect sync with the
 *  ring rotation (no state lag from the `center` state). */
function ActiveInfo({
  featured,
  activeIndex,
  onOpen,
  onAdd,
}: {
  featured: Donut[];
  activeIndex: ReturnType<typeof useTransform<number, number>>;
  onOpen: (d: Donut) => void;
  onAdd: (d: Donut) => void;
}) {
  const [idx, setIdx] = useState(0);
  useMotionValueEvent(activeIndex, "change", (v) => {
    const next = ((Math.round(v) % featured.length) + featured.length) % featured.length;
    setIdx((prev) => (prev !== next ? next : prev));
  });
  const donut = featured[idx];
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <AnimatePresence mode="wait">
        <motion.h3
          key={donut.id}
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -8, opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="graffiti-text text-2xl leading-none text-[var(--color-dowgnut-blue-dark)] sm:text-3xl"
        >
          {donut.name}
        </motion.h3>
      </AnimatePresence>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onOpen(donut)}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--color-dowgnut-pink)] px-5 text-sm font-bold text-white transition-transform hover:scale-105 active:scale-95"
        >
          View donut
        </button>
        <button
          onClick={() => onAdd(donut)}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--color-dowgnut-blue)] px-5 text-sm font-bold text-white transition-transform hover:scale-105 active:scale-95"
        >
          <Plus className="size-4" /> Add to cart
        </button>
      </div>
    </div>
  );
}

export function DonutCarousel3D() {
  const donuts = useShop((s) => s.donuts);
  const openDetail = useShop((s) => s.openDetail);
  const addToCart = useShop((s) => s.addToCart);

  const featured = useMemo(() => {
    const f = donuts.filter((d) => d.featured);
    const pool = f.length >= 5 ? f : donuts;
    return pool.slice(0, 5);
  }, [donuts]);

  const len = featured.length;

  const position = useMotionValue<number>(0);
  const [center, setCenter] = useState(0);
  const [dragging, setDragging] = useState(false);

  if (len > 0 && center >= len) {
    setCenter(0);
    if (position.get() > len) position.set(0);
  }

  const snapTo = (targetInt: number) => {
    // Fast, snappy slide — higher stiffness, lower damping.
    animate(position, targetInt, {
      type: "spring",
      stiffness: 380,
      damping: 32,
    });
    const wrapped = ((targetInt % len) + len) % len;
    setCenter(wrapped);
  };

  const go = (dir: number) => {
    snapTo(Math.round(position.get()) + dir);
  };

  // Synced name — derived directly from the `position` motion value so the
  // label updates the instant a new donut crosses center (no state lag).
  const activeIndex = useTransform(position, (p: number) => ((Math.round(p) % len) + len) % len);

  if (len === 0) return null;

  const onPan = (_: unknown, info: PanInfo) => {
    position.set(center - info.offset.x / PX_PER_DONUT);
  };
  const onPanEnd = () => {
    snapTo(Math.round(position.get()));
    setDragging(false);
  };

  const centerThis = (index: number) => {
    const current = Math.round(position.get());
    let delta = index - (((current % len) + len) % len);
    if (delta > len / 2) delta -= len;
    if (delta < -len / 2) delta += len;
    snapTo(current + delta);
  };

  return (
    <section
      className="relative mx-auto mt-8 w-full max-w-7xl px-4 sm:px-6"
      aria-label="Featured donuts — roulette carousel"
    >
      {/* Heading */}
      <div className="mb-2 flex items-end justify-between gap-3 px-1">
        <div>
          <p className="graffiti-text text-xs uppercase tracking-[0.25em] text-[var(--color-dowgnut-pink-dark)]">
            Gempak picks
          </p>
          <h2 className="graffiti-text text-2xl leading-none text-[var(--color-dowgnut-blue-dark)] sm:text-3xl">
            Spin the dowgs
          </h2>
        </div>
        <p className="hidden text-xs text-[var(--color-dowgnut-blue-dark)]/50 sm:block">
          drag to spin · tap a donut
        </p>
      </div>

      {/* Roulette stage */}
      <div
        className="relative h-[340px] w-full overflow-hidden sm:h-[420px]"
        style={{ perspective: "1400px" }}
      >
        {/* Pan/drag layer */}
        <motion.div
          className="absolute inset-0 z-40 cursor-grab touch-pan-y active:cursor-grabbing"
          onPanStart={() => setDragging(true)}
          onPan={onPan}
          onPanEnd={onPanEnd}
        />

        {/* Tilted roulette disk (no background — donuts float on the tilt) */}
        <div
          className="absolute inset-0"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateX(${TILT}deg)`,
          }}
        >
          {/* Donuts on the disk */}
          {featured.map((donut, i) => (
            <DonutCard3D
              key={donut.id}
              donut={donut}
              index={i}
              position={position}
              len={len}
              onCenter={() => {
                const off = Math.abs(wrapOffset(i - position.get(), len));
                if (off < 0.5) openDetail(donut);
                else centerThis(i);
              }}
            />
          ))}
        </div>
      </div>

      {/* Active donut label + actions — name syncs live with the ring rotation */}
      <div className="mt-3">
        <ActiveInfo
          featured={featured}
          activeIndex={activeIndex}
          onOpen={(d) => openDetail(d)}
          onAdd={async (d) => {
            try {
              await addToCart(d.id, 1);
            } catch {
              /* toast handled elsewhere */
            }
          }}
        />
      </div>

      {/* Dot indicators */}
      <div className="mt-3 flex items-center justify-center gap-2">
        {featured.map((_, i) => (
          <button
            key={i}
            onClick={() => centerThis(i)}
            aria-label={`Go to donut ${i + 1}`}
            className={cn(
              "rounded-full transition-all",
              i === center
                ? "h-2.5 w-7 bg-[var(--color-dowgnut-pink)]"
                : "h-2.5 w-2.5 bg-[var(--color-dowgnut-blue-dark)]/25 hover:bg-[var(--color-dowgnut-blue-dark)]/50"
            )}
          />
        ))}
      </div>
    </section>
  );
}
