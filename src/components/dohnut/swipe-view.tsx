"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  type PanInfo,
} from "framer-motion";
import {
  Heart,
  X,
  ShoppingCart,
  RotateCcw,
  Info,
  Star,
  Shuffle,
  Trophy,
  Loader2,
} from "lucide-react";
import { useShop } from "@/store/use-shop";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Donut } from "@/lib/types";

type Dir = "left" | "right" | "up";

interface SwipeCardHandle {
  flyOut: (dir: Dir) => void;
}

const FLY: Record<Dir, { x: number; y: number; rotate: number }> = {
  left: { x: -700, y: 80, rotate: -22 },
  right: { x: 700, y: 80, rotate: 22 },
  up: { x: 0, y: -700, rotate: 0 },
};

const STACK = [
  { scale: 1, y: 0 },
  { scale: 0.94, y: 22 },
  { scale: 0.88, y: 44 },
];

/* ─────────────────────────  SwipeCard  ───────────────────────── */

interface SwipeCardProps {
  donut: Donut;
  stackPos: number; // 0 = top
  isFavorite: boolean;
  onGone: (dir: Dir, donut: Donut) => void;
}

const SwipeCard = forwardRef<SwipeCardHandle, SwipeCardProps>(
  function SwipeCard({ donut, stackPos, isFavorite, onGone }, ref) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const opacity = useMotionValue(1);
    const rotate = useTransform(x, [-220, 220], [-18, 18]);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // overlay stamp opacities
    const loveOpacity = useTransform(x, [30, 130], [0, 1]);
    const nopeOpacity = useTransform(x, [-130, -30], [1, 0]);
    const cartOpacity = useTransform(y, [-130, -30], [1, 0]);

    const isTop = stackPos === 0;

    const flyOut = useCallback(
      (dir: Dir) => {
        const target = FLY[dir];
        animate(x, target.x, { duration: 0.35, ease: "easeOut" });
        animate(y, target.y, { duration: 0.35, ease: "easeOut" });
        animate(opacity, 0, { duration: 0.35, ease: "easeOut" });
        if (timerRef.current) clearTimeout(timerRef.current);
        // LZ-08: track the timer so we can cancel it on unmount and avoid
        // set-state-on-unmounted-component warnings when the user navigates
        // away mid-animation.
        timerRef.current = setTimeout(() => onGone(dir, donut), 360);
      },
      [donut, onGone, x, y, opacity]
    );

    useEffect(
      () => () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      },
      []
    );

    useImperativeHandle(ref, () => ({ flyOut }), [flyOut]);

    const handleDragEnd = (_: unknown, info: PanInfo) => {
      const { offset, velocity } = info;
      if (offset.x > 110 || velocity.x > 600) flyOut("right");
      else if (offset.x < -110 || velocity.x < -600) flyOut("left");
      else if (offset.y < -110 || velocity.y < -600) flyOut("up");
      else {
        animate(x, 0, { type: "spring", stiffness: 320, damping: 22 });
        animate(y, 0, { type: "spring", stiffness: 320, damping: 22 });
      }
    };

    const pos = STACK[stackPos] ?? STACK[STACK.length - 1];

    return (
      <motion.div
        className="absolute inset-0 select-none"
        style={{ zIndex: 10 - stackPos, pointerEvents: isTop ? "auto" : "none" }}
        initial={{ scale: pos.scale, y: pos.y + 30, opacity: 0 }}
        animate={{ scale: pos.scale, y: pos.y, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
      >
        <motion.div
          className="relative h-full w-full"
          style={{ x, y, rotate, opacity }}
          drag={isTop}
          dragElastic={0.65}
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          onDragEnd={handleDragEnd}
          whileTap={isTop ? { cursor: "grabbing" } : undefined}
        >
          <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[2rem] border-4 border-[var(--color-dowgnut-blue-dark)]/15 bg-[var(--color-dowgnut-cream)] shadow-[0_18px_0_rgba(7,51,79,0.12)]">
          {/* Drag hint stamps (top card only) */}
          {isTop && (
            <>
              <motion.div
                style={{ opacity: loveOpacity }}
                className="absolute left-5 top-5 z-20 -rotate-12 rounded-xl border-4 border-[var(--color-dowgnut-pink)] px-3 py-1 text-xl font-black uppercase tracking-wider text-[var(--color-dowgnut-pink)]"
              >
                Love 💗
              </motion.div>
              <motion.div
                style={{ opacity: nopeOpacity }}
                className="absolute right-5 top-5 z-20 rotate-12 rounded-xl border-4 border-[var(--color-dowgnut-blue-dark)] px-3 py-1 text-xl font-black uppercase tracking-wider text-[var(--color-dowgnut-blue-dark)]"
              >
                Nope
              </motion.div>
              <motion.div
                style={{ opacity: cartOpacity }}
                className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 -rotate-6 rounded-xl border-4 border-[var(--color-dowgnut-blue)] px-3 py-1 text-xl font-black uppercase tracking-wider text-[var(--color-dowgnut-blue)]"
              >
                Cart! 🛒
              </motion.div>
            </>
          )}

          {/* Donut image */}
          <div className="relative flex flex-1 items-center justify-center bg-[var(--color-dowgnut-lime-bright)] lime-bg-grid">
            <img
              src={donut.imgUrl}
              alt={donut.name}
              className="size-[70%] animate-float object-contain drop-shadow-lg"
              draggable={false}
            />
            {donut.featured && (
              <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-[var(--color-dowgnut-blue)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                ★ Featured
              </span>
            )}
            {isFavorite && (
              <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[var(--color-dowgnut-pink)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                <Heart className="size-3 fill-current" /> Loved
              </span>
            )}
          </div>

          {/* Info */}
          <div className="space-y-2 border-t-4 border-dashed border-[var(--color-dowgnut-blue-dark)]/15 bg-[var(--color-dowgnut-cream)] p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="graffiti-text text-lg leading-none text-[var(--color-dowgnut-blue-dark)] sm:text-2xl">
                {donut.name}
              </h3>
              <span className="shrink-0 rounded-full bg-[var(--color-dowgnut-blue)] px-3 py-1 text-lg font-black text-white">
                RM{donut.price.toFixed(2)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge
                variant="outline"
                className="border-[var(--color-dowgnut-pink)]/40 bg-white/60 capitalize text-[var(--color-dowgnut-pink-dark)]"
              >
                {donut.type}
              </Badge>
              <span className="inline-flex items-center gap-1 font-semibold text-[var(--color-dowgnut-blue-dark)]">
                <Star className="size-3.5 fill-[var(--color-dowgnut-pink)] text-[var(--color-dowgnut-pink)]" />
                {donut.rating.toFixed(1)}
              </span>
              <span className="text-[var(--color-dowgnut-blue-dark)]/60">
                {donut.calories} cal
              </span>
              {donut.stock <= 5 && donut.stock > 0 && (
                <span className="font-bold text-[var(--color-dowgnut-pink-dark)]">
                  Only {donut.stock} left!
                </span>
              )}
            </div>

            <p className="line-clamp-2 text-sm leading-snug text-[var(--color-dowgnut-blue-dark)]/75">
              {donut.description}
            </p>

            {donut.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {donut.tags.slice(0, 4).map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-[var(--color-dowgnut-lime)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-dowgnut-blue-dark)]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        </motion.div>
      </motion.div>
    );
  }
);

/* ─────────────────────────  SwipeView  ───────────────────────── */

export function SwipeView() {
  const donuts = useShop((s) => s.donuts);
  const loadingDonuts = useShop((s) => s.loadingDonuts);
  const filterType = useShop((s) => s.filterType);
  const isFavorite = useShop((s) => s.isFavorite);
  const toggleFavorite = useShop((s) => s.toggleFavorite);
  const addToCart = useShop((s) => s.addToCart);
  const openDetail = useShop((s) => s.openDetail);
  const setCartOpen = useShop((s) => s.setCartOpen);
  const setView = useShop((s) => s.setView);
  const { toast } = useToast();

  const [index, setIndex] = useState(0);
  const [stats, setStats] = useState({ loved: 0, carted: 0, skipped: 0 });
  const topRef = useRef<SwipeCardHandle>(null);

  // reset when the catalog/filter changes (React-recommended "adjust state
  // during render" pattern — avoids setState-in-effect). LZ-07: batching the
  // resets into a single state object reduces re-renders from 3 to 1.
  const swipeKey = `${filterType}-${donuts.length}-${donuts[0]?.id ?? ""}`;
  const [prevKey, setPrevKey] = useState(swipeKey);
  if (swipeKey !== prevKey) {
    setPrevKey(swipeKey);
    setIndex(0);
    setStats({ loved: 0, carted: 0, skipped: 0 });
  }

  const remaining = useMemo(() => donuts.slice(index, index + 3), [donuts, index]);
  const finished = index >= donuts.length;

  const handleGone = useCallback(
    async (dir: Dir, donut: Donut) => {
      if (dir === "right") {
        try {
          if (!isFavorite(donut.id)) {
            await toggleFavorite(donut.id);
          }
          setStats((s) => ({ ...s, loved: s.loved + 1 }));
          toast({ title: "Loved it 💗", description: `${donut.name} saved to favorites` });
        } catch {
          toast({
            title: "Couldn't save favorite",
            description: "Please try again.",
            variant: "destructive",
          });
        }
      } else if (dir === "up") {
        try {
          await addToCart(donut.id, 1);
          setStats((s) => ({ ...s, carted: s.carted + 1 }));
          toast({
            title: "Added to your dowgs! 🛒",
            description: `${donut.name} × 1`,
          });
        } catch {
          toast({
            title: "Couldn't add to cart",
            description: "Please try again.",
            variant: "destructive",
          });
        }
      } else {
        setStats((s) => ({ ...s, skipped: s.skipped + 1 }));
      }
      setIndex((i) => i + 1);
    },
    [addToCart, isFavorite, toggleFavorite, toast]
  );

  const trigger = (dir: Dir) => topRef.current?.flyOut(dir);

  const restart = () => {
    setIndex(0);
    setStats({ loved: 0, carted: 0, skipped: 0 });
  };

  /* loading */
  if (loadingDonuts && donuts.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-[var(--color-dowgnut-blue)]">
        <Loader2 className="size-8 animate-spin" />
        <p className="text-sm font-medium">Loading the deck…</p>
      </div>
    );
  }

  /* empty catalog */
  if (donuts.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-4 p-10 text-center">
        <img
          src="/brand/dohnut-mascot.png"
          alt=""
          className="size-24 animate-float object-contain"
        />
        <h2 className="graffiti-text text-3xl text-[var(--color-dowgnut-blue-dark)]">
          No donuts to swipe
        </h2>
        <p className="text-[var(--color-dowgnut-blue-dark)]/70">
          Try a different flavor filter or clear your search.
        </p>
        <Button onClick={() => setView("shop")} className="rounded-full">
          Back to shop
        </Button>
      </div>
    );
  }

  /* finished summary */
  if (finished) {
    return (
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-5 overflow-y-auto p-6 text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 14 }}
          className="flex size-28 items-center justify-center rounded-full bg-[var(--color-dowgnut-lime)] shadow-[0_10px_0_rgba(7,51,79,0.15)]"
        >
          <Trophy className="size-14 text-[var(--color-dowgnut-blue-dark)]" />
        </motion.div>
        <h2 className="graffiti-text text-4xl text-[var(--color-dowgnut-blue-dark)]">
          You tasted them all!
        </h2>
        <p className="text-[var(--color-dowgnut-blue-dark)]/70">
          That's every donut in the shop. Here's your swipe summary:
        </p>

        <div className="grid w-full grid-cols-3 gap-3">
          <div className="rounded-2xl border-2 border-[var(--color-dowgnut-pink)]/30 bg-white/60 p-4">
            <Heart className="mx-auto size-6 fill-[var(--color-dowgnut-pink)] text-[var(--color-dowgnut-pink)]" />
            <p className="mt-2 graffiti-text text-3xl text-[var(--color-dowgnut-pink-dark)]">
              {stats.loved}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-dowgnut-blue-dark)]/60">
              Loved
            </p>
          </div>
          <div className="rounded-2xl border-2 border-[var(--color-dowgnut-blue)]/30 bg-white/60 p-4">
            <ShoppingCart className="mx-auto size-6 text-[var(--color-dowgnut-blue)]" />
            <p className="mt-2 graffiti-text text-3xl text-[var(--color-dowgnut-blue)]">
              {stats.carted}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-dowgnut-blue-dark)]/60">
              In cart
            </p>
          </div>
          <div className="rounded-2xl border-2 border-[var(--color-dowgnut-blue-dark)]/20 bg-white/60 p-4">
            <X className="mx-auto size-6 text-[var(--color-dowgnut-blue-dark)]/50" />
            <p className="mt-2 graffiti-text text-3xl text-[var(--color-dowgnut-blue-dark)]/60">
              {stats.skipped}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-dowgnut-blue-dark)]/60">
              Skipped
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            onClick={restart}
            className="rounded-full bg-[var(--color-dowgnut-pink)] hover:bg-[var(--color-dowgnut-pink-dark)]"
          >
            <RotateCcw className="size-4" /> Swipe again
          </Button>
          {stats.carted > 0 && (
            <Button
              onClick={() => setCartOpen(true)}
              className="rounded-full bg-[var(--color-dowgnut-blue)] hover:bg-[var(--color-dowgnut-blue-dark)]"
            >
              <ShoppingCart className="size-4" /> View cart ({stats.carted})
            </Button>
          )}
          <Button
            onClick={() => setView("favorites")}
            variant="outline"
            className="rounded-full border-[var(--color-dowgnut-pink)] text-[var(--color-dowgnut-pink-dark)]"
          >
            <Heart className="size-4" /> Favorites
          </Button>
        </div>
      </div>
    );
  }

  /* active swipe deck */
  const current = donuts[index];

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-6 sm:py-8">
      {/* header row */}
      <div className="mb-4 flex items-center justify-between">
        <div className="inline-flex items-center gap-2">
          <span className="inline-flex size-9 items-center justify-center rounded-full bg-[var(--color-dowgnut-pink)] text-white">
            <Shuffle className="size-4" />
          </span>
          <div>
            <h1 className="graffiti-text text-xl leading-none text-[var(--color-dowgnut-blue-dark)]">
              Swipe the dowgs
            </h1>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-dowgnut-blue-dark)]/55">
              {index + 1} / {donuts.length}
            </p>
          </div>
        </div>
        <Button
          onClick={() => openDetail(current)}
          variant="outline"
          size="sm"
          className="rounded-full border-[var(--color-dowgnut-blue)]/40 text-[var(--color-dowgnut-blue-dark)]"
        >
          <Info className="size-4" /> Details
        </Button>
      </div>

      {/* progress bar */}
      <div className="mb-5 h-2.5 w-full overflow-hidden rounded-full bg-white/70">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[var(--color-dowgnut-pink)] to-[var(--color-dowgnut-blue)]"
          initial={false}
          animate={{ width: `${((index) / donuts.length) * 100}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>

      {/* card deck */}
      <div className="relative flex-1" style={{ minHeight: "min(460px, 60vh)" }}>
        {remaining
          .slice()
          .reverse()
          .map((donut, i) => {
            const revIndex = remaining.length - 1 - i; // 0 = top
            const isTop = revIndex === 0;
            return (
              <SwipeCard
                key={donut.id}
                ref={isTop ? topRef : undefined}
                donut={donut}
                stackPos={revIndex}
                isFavorite={isFavorite(donut.id)}
                onGone={handleGone}
              />
            );
          })}
      </div>

      {/* action buttons */}
      <div className="mt-6 flex items-center justify-center gap-4 sm:gap-6">
        <ActionButton
          label="Skip"
          color="navy"
          onClick={() => trigger("left")}
          icon={<X className="size-6" />}
        />
        <ActionButton
          label="Love"
          color="pink"
          big
          onClick={() => trigger("right")}
          icon={<Heart className="size-7" />}
        />
        <ActionButton
          label="Cart"
          color="blue"
          big
          onClick={() => trigger("up")}
          icon={<ShoppingCart className="size-6" />}
        />
      </div>

      {/* swipe hint legend */}
      <p className="mt-4 text-center text-[11px] font-semibold uppercase tracking-wider text-[var(--color-dowgnut-blue-dark)]/50">
        Swipe ← skip · → love 💗 · ↑ cart 🛒 · or tap the buttons
      </p>
    </div>
  );
}

/* ─────────────────────────  ActionButton  ───────────────────────── */

function ActionButton({
  label,
  icon,
  onClick,
  color,
  big = false,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color: "pink" | "blue" | "navy";
  big?: boolean;
}) {
  const palette = {
    pink: "bg-[var(--color-dowgnut-pink)] text-white hover:bg-[var(--color-dowgnut-pink-dark)]",
    blue: "bg-[var(--color-dowgnut-blue)] text-white hover:bg-[var(--color-dowgnut-blue-dark)]",
    navy:
      "bg-white text-[var(--color-dowgnut-blue-dark)] border-2 border-[var(--color-dowgnut-blue-dark)]/20 hover:bg-[var(--color-dowgnut-cream)]",
  }[color];

  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex flex-col items-center gap-1 transition-transform active:scale-90",
        "hover:scale-105"
      )}
    >
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full shadow-[0_6px_0_rgba(7,51,79,0.15)]",
          big ? "size-16" : "size-14",
          palette
        )}
      >
        {icon}
      </span>
      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-dowgnut-blue-dark)]/60">
        {label}
      </span>
    </button>
  );
}
