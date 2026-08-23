"use client";

import { useState, useCallback } from "react";
import { Share2, X, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { Donut } from "@/lib/types";

/**
 * ShareableDonutCard — generates a branded share card for social media.
 * Uses html2canvas to capture a styled DOM element as an image.
 */

export function ShareableDonutCard({ donut, onClose }: { donut: Donut; onClose: () => void }) {
  const [generating, setGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const generate = useCallback(async () => {
    setGenerating(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const el = document.getElementById("share-card-content");
      if (!el) return;
      const canvas = await html2canvas(el, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false,
      });
      setImageUrl(canvas.toDataURL("image/png"));
    } catch (e) {
      console.error("Share card generation failed:", e);
    } finally {
      setGenerating(false);
    }
  }, []);

  const download = () => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `dowgnut-${donut.name.toLowerCase().replace(/\s+/g, "-")}.png`;
    a.click();
  };

  const share = async () => {
    if (!imageUrl) return;
    try {
      const blob = await (await fetch(imageUrl)).blob();
      const file = new File([blob], "dowgnut.png", { type: "image/png" });
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${donut.name} on DowgNut`,
          text: `Check out ${donut.name} on DowgNut! 🍩`,
        });
      } else {
        download();
      }
    } catch {
      download();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="relative max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -right-2 -top-2 z-10 inline-flex size-8 items-center justify-center rounded-full bg-[var(--color-dowgnut-blue-dark)] text-white"
        >
          <X className="size-4" />
        </button>

        {/* Hidden card for html2canvas capture */}
        <div className="overflow-hidden rounded-3xl" style={{ width: 360, height: 480 }}>
          <div
            id="share-card-content"
            className="flex h-full flex-col items-center justify-between bg-gradient-to-br from-[var(--color-dowgnut-blue-dark)] via-[var(--color-dowgnut-blue)] to-[var(--color-dowgnut-pink-dark)] p-6"
          >
            <div className="flex items-center gap-2">
              <img src="/brand/hypebeast-icon.png" alt="" className="size-8 rounded-full" />
              <span className="graffiti-text text-sm text-white">DOWGNUT</span>
            </div>

            <div className="flex flex-1 items-center justify-center">
              <img src={donut.imgUrl} alt={donut.name} className="size-44 object-contain" crossOrigin="anonymous" />
            </div>

            <div className="w-full text-center">
              <p className="graffiti-text text-2xl text-[var(--color-dowgnut-lime)]">{donut.name}</p>
              <p className="mt-1 text-sm text-white/80">
                ★ {donut.rating.toFixed(1)} · {donut.calories} kcal · RM{donut.price.toFixed(2)}
              </p>
              <p className="mt-2 text-[10px] uppercase tracking-widest text-white/40">
                Good Vibes & Good Dowg
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          {!imageUrl ? (
            <Button
              onClick={generate}
              disabled={generating}
              className="h-10 flex-1 rounded-full bg-[var(--color-dowgnut-pink)] text-white"
            >
              {generating ? "Generating..." : "Generate Card"}
            </Button>
          ) : (
            <>
              <Button onClick={share} className="h-10 flex-1 rounded-full bg-[var(--color-dowgnut-pink)] text-white">
                <Share2 className="size-4" /> Share
              </Button>
              <Button onClick={download} variant="outline" className="h-10 rounded-full">
                <Download className="size-4" />
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
