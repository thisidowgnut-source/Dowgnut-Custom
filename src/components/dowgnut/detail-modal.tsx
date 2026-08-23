"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Minus, Plus, Loader2, Star, X, Sparkles, Flame, ShieldCheck, ShoppingBag } from "lucide-react";
import { useShop } from "@/store/use-shop";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function DetailModal() {
  const open = useShop((s) => s.detailOpen);
  const donut = useShop((s) => s.selectedDonut);
  const reviews = useShop((s) => s.detailReviews);
  const closeDetail = useShop((s) => s.closeDetail);
  const isFavorite = useShop((s) => s.isFavorite);
  const toggleFavorite = useShop((s) => s.toggleFavorite);
  const addToCart = useShop((s) => s.addToCart);
  const setCartOpen = useShop((s) => s.setCartOpen);
  const allDonuts = useShop((s) => s.donuts);
  const openDetail = useShop((s) => s.openDetail);
  const addReview = useShop((s) => s.addReview);
  const { toast } = useToast();

  const [qty, setQty] = useState(1);
  const [showReviews, setShowReviews] = useState(false);
  const [author, setAuthor] = useState("");
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setQty(1);
      setShowReviews(false);
      setAuthor("");
      setRating("5");
      setComment("");
    }
  }, [open, donut?.id]);

  if (!donut) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && closeDetail()}>
        <DialogContent className="bg-transparent p-0">
          <DialogTitle className="sr-only">Loading</DialogTitle>
          <div className="flex items-center justify-center py-8 text-[var(--color-dowgnut-blue)]">
            <Loader2 className="size-6 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const fav = isFavorite(donut.id);
  const related = allDonuts
    .filter((d) => d.id !== donut.id && d.type === donut.type)
    .slice(0, 4);

  const onAdd = async (buyNow = false) => {
    try {
      await addToCart(donut.id, qty);
      toast({
        title: buyNow ? "Opening cart…" : "Added to cart! 🍩",
        description: `${donut.name} × ${qty} (RM ${(donut.price * qty).toFixed(2)})`,
      });
      if (buyNow) {
        closeDetail();
        setCartOpen(true);
      }
    } catch {
      toast({
        title: "Couldn't add to cart",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const onFav = async () => {
    await toggleFavorite(donut.id);
    toast({
      title: fav ? "Removed from favorites" : "Saved to favorites ❤️",
      description: donut.name,
    });
  };

  const onReview = async () => {
    if (!author.trim() || !comment.trim()) {
      toast({
        title: "Missing details",
        description: "Please add your name and review message.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      await addReview(donut.id, {
        author: author.trim(),
        rating: Number(rating),
        comment: comment.trim(),
      });
      setAuthor("");
      setComment("");
      setRating("5");
      toast({ title: "Review posted!", description: "Thank you for the feedback." });
    } catch {
      toast({
        title: "Couldn't post review",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeDetail()}>
      <DialogContent
        showCloseButton={false}
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg max-h-[88vh] rounded-t-[32px] border-t border-[rgba(239,159,189,0.3)] p-0 shadow-2xl bg-[var(--color-dowgnut-cream)] overflow-hidden flex flex-col z-50 animate-in slide-in-from-bottom duration-300 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:border"
      >
        <DialogTitle className="sr-only">{donut.name}</DialogTitle>

        {/* Grab Handle Pill */}
        <div className="flex justify-center pt-3 pb-1 cursor-grab">
          <div className="h-1.5 w-12 rounded-full bg-[var(--color-dowgnut-blue-dark)]/20" />
        </div>

        {/* Header Action Bar */}
        <div className="flex items-center justify-between px-5 py-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-dowgnut-pink)]/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--color-dowgnut-pink-dark)]">
            <Sparkles className="size-3" />
            {donut.type}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onFav}
              aria-label="Favorite"
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-full transition-transform active:scale-90",
                fav
                  ? "bg-[var(--color-dowgnut-pink)] text-white shadow-xs"
                  : "bg-white/80 text-[var(--color-dowgnut-blue-dark)] hover:bg-white shadow-xs"
              )}
            >
              <Heart className={cn("size-4", fav && "fill-current")} />
            </button>

            <button
              onClick={closeDetail}
              aria-label="Close"
              className="inline-flex size-9 items-center justify-center rounded-full bg-black/5 text-[var(--color-dowgnut-blue-dark)] hover:bg-black/10 transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 pb-6 pt-1 space-y-4">
          {/* Floating Donut Visual Showcase */}
          <div className="relative flex h-52 items-center justify-center py-2">
            {/* Ground soft radial shadow */}
            <div className="absolute bottom-2 h-5 w-44 rounded-full bg-black/12 blur-md" />

            <motion.img
              src={donut.imgUrl}
              alt={donut.name}
              className="size-48 object-contain drop-shadow-2xl select-none"
              draggable={false}
              whileHover={{ rotate: 12, scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            />
          </div>

          {/* Title & Rating */}
          <div className="text-center">
            <h2 className="graffiti-text text-2xl tracking-wide text-[var(--color-dowgnut-blue-dark)] sm:text-3xl">
              {donut.name}
            </h2>
            <div className="mt-1 flex items-center justify-center gap-2">
              <div className="flex items-center text-amber-500">
                <Star className="size-4 fill-amber-400 text-amber-400" />
                <span className="ml-1 text-sm font-black text-[var(--color-dowgnut-blue-dark)]">
                  {donut.rating.toFixed(1)}
                </span>
              </div>
              <span className="text-xs text-[var(--color-dowgnut-blue-dark)]/40">•</span>
              <span className="text-xs font-bold text-[var(--color-dowgnut-blue-dark)]/60">
                {reviews.length} reviews
              </span>
              <span className="text-xs text-[var(--color-dowgnut-blue-dark)]/40">•</span>
              <span className="text-xs font-bold text-emerald-600">
                In Stock ({donut.stock})
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="text-center text-sm leading-relaxed text-[var(--color-dowgnut-blue-dark)]/80 px-2">
            {donut.description}
          </p>

          {/* Nutritional Pills */}
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center rounded-2xl bg-white/75 p-2.5 shadow-xs border border-white/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-dowgnut-blue-dark)]/60">
                Calories
              </span>
              <span className="text-sm font-black text-[var(--color-dowgnut-blue-dark)]">
                {donut.calories} <span className="text-[10px] font-normal">kcal</span>
              </span>
            </div>
            <div className="flex flex-col items-center rounded-2xl bg-white/75 p-2.5 shadow-xs border border-white/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-dowgnut-blue-dark)]/60">
                Sugar
              </span>
              <span className="text-sm font-black text-[var(--color-dowgnut-blue-dark)]">
                {donut.sugar}g
              </span>
            </div>
            <div className="flex flex-col items-center rounded-2xl bg-white/75 p-2.5 shadow-xs border border-white/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-dowgnut-blue-dark)]/60">
                Fat
              </span>
              <span className="text-sm font-black text-[var(--color-dowgnut-blue-dark)]">
                {donut.fat}g
              </span>
            </div>
          </div>

          {/* Quantity Stepper & Price Row */}
          <div className="flex items-center justify-between rounded-2xl bg-white/90 p-3 shadow-xs border border-[rgba(239,159,189,0.2)]">
            <div>
              <span className="text-xs font-bold uppercase text-[var(--color-dowgnut-blue-dark)]/60">
                Price
              </span>
              <div className="graffiti-text text-xl text-[var(--color-dowgnut-blue-dark)]">
                RM {(donut.price * qty).toFixed(2)}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="flex size-9 items-center justify-center rounded-full bg-[var(--color-dowgnut-cream)] text-[var(--color-dowgnut-blue-dark)] transition-transform active:scale-90 font-black shadow-xs"
                aria-label="Decrease quantity"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-6 text-center text-base font-black text-[var(--color-dowgnut-blue-dark)]">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty(qty + 1)}
                className="flex size-9 items-center justify-center rounded-full bg-[var(--color-dowgnut-blue)] text-white transition-transform active:scale-90 font-black shadow-xs"
                aria-label="Increase quantity"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>

          {/* Toggle Reviews Section */}
          <div className="pt-1">
            <button
              onClick={() => setShowReviews(!showReviews)}
              className="w-full text-center text-xs font-bold text-[var(--color-dowgnut-blue)] hover:underline py-1"
            >
              {showReviews ? "▲ Hide Reviews" : `▼ Customer Reviews (${reviews.length})`}
            </button>

            <AnimatePresence>
              {showReviews && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 pt-2"
                >
                  {/* Reviews List */}
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {reviews.length === 0 ? (
                      <p className="text-center text-xs text-[var(--color-dowgnut-blue-dark)]/60 py-2">
                        No reviews yet. Be the first to review!
                      </p>
                    ) : (
                      reviews.map((r) => (
                        <div
                          key={r.id}
                          className="rounded-xl bg-white/70 p-2.5 text-xs shadow-xs"
                        >
                          <div className="flex items-center justify-between font-bold text-[var(--color-dowgnut-blue-dark)]">
                            <span>{r.author}</span>
                            <span className="inline-flex items-center gap-0.5 text-amber-500"><Star className="size-3 fill-amber-400 text-amber-400" /> {r.rating}</span>
                          </div>
                          <p className="mt-1 text-[var(--color-dowgnut-blue-dark)]/80">
                            {r.comment}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Review Form */}
                  <div className="rounded-xl bg-white/90 p-3 space-y-2 shadow-xs border border-white/80">
                    <span className="text-xs font-black text-[var(--color-dowgnut-blue-dark)]">
                      Write a Review
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Your name"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        className="h-8 text-xs bg-white rounded-lg"
                      />
                      <Select value={rating} onValueChange={setRating}>
                        <SelectTrigger className="h-8 text-xs bg-white rounded-lg">
                          <SelectValue placeholder="Rating" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">⭐⭐⭐⭐⭐ (5/5)</SelectItem>
                          <SelectItem value="4">⭐⭐⭐⭐ (4/5)</SelectItem>
                          <SelectItem value="3">⭐⭐⭐ (3/5)</SelectItem>
                          <SelectItem value="2">⭐⭐ (2/5)</SelectItem>
                          <SelectItem value="1">⭐ (1/5)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Textarea
                      placeholder="What did you think of this flavor?"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="min-h-[48px] text-xs bg-white rounded-lg resize-none"
                    />
                    <Button
                      onClick={onReview}
                      disabled={submitting}
                      className="w-full h-8 text-xs font-bold rounded-lg bg-[var(--color-dowgnut-blue)] text-white hover:bg-[var(--color-dowgnut-blue-dark)]"
                    >
                      {submitting ? "Posting…" : "Submit Review"}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="border-t border-[rgba(239,159,189,0.2)] bg-white/95 p-4 backdrop-blur-md flex gap-2">
          <Button
            onClick={() => onAdd(false)}
            variant="outline"
            className="flex-1 h-12 rounded-full border-2 border-[var(--color-dowgnut-blue)] text-[var(--color-dowgnut-blue)] font-black text-sm hover:bg-[var(--color-dowgnut-blue)]/10 active:scale-95 transition-transform"
          >
            Add to Cart
          </Button>

          <Button
            onClick={() => onAdd(true)}
            className="flex-1 h-12 rounded-full bg-[var(--color-dowgnut-pink)] text-white font-black text-sm hover:bg-[var(--color-dowgnut-pink-dark)] shadow-md active:scale-95 transition-transform"
          >
            Buy Now • RM {(donut.price * qty).toFixed(2)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
