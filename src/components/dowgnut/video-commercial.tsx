"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, ChevronRight, Volume2, VolumeX, Sparkles } from "lucide-react";
import { useShop } from "@/store/use-shop";
import { cn } from "@/lib/utils";

/**
 * VideoCommercial — a full-width cinematic donut commercial banner.
 *
 * Plays the AI-generated DowgNut commercial video with a bold graffiti
 * overlay: eyebrow tag, big headline, subtitle, and a CTA button. Muted
 * by default (autoplay-friendly), tap to unmute / replay.
 *
 * While the video file is still being generated or if it fails to load,
 * a static poster (hero banner) with a play button is shown instead.
 */

const VIDEO_SRC = "/videos/dowgnut-commercial.mp4";
const POSTER_SRC = "/brand/hero-banner.png";

export function VideoCommercial() {
  const setView = useShop((s) => s.setView);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const [videoExists, setVideoExists] = useState(false);

  // Check if the video file exists (it's generated async by z-ai CLI).
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch(VIDEO_SRC, { method: "HEAD" });
        if (!cancelled && res.ok) {
          setVideoExists(true);
          return true;
        }
      } catch {
        /* not ready yet */
      }
      return false;
    };
    check();
    // Re-check every 15s in case it's still generating.
    const t = setInterval(check, 15000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const togglePlay = () => {
    const v = document.getElementById("dowgnut-commercial-video") as HTMLVideoElement | null;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const v = document.getElementById("dowgnut-commercial-video") as HTMLVideoElement | null;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  return (
    <section
      className="relative mx-auto mt-8 w-full max-w-7xl overflow-hidden rounded-3xl border-4 border-[var(--color-dowgnut-blue-dark)] shadow-[0_8px_0_rgba(7,51,79,0.18)] sm:rounded-[2rem]"
      aria-label="DowgNut commercial"
    >
      <div className="relative aspect-video w-full bg-[var(--color-dowgnut-blue-dark)]">
        {/* Video / Poster */}
        {videoExists ? (
          <video
            id="dowgnut-commercial-video"
            src={VIDEO_SRC}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onCanPlay={() => setVideoReady(true)}
            onClick={togglePlay}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <img
            src={POSTER_SRC}
            alt="DowgNut commercial"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        {/* Subtle gradient overlay — light so video stays visible */}
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-dowgnut-blue-dark)]/60 via-transparent to-transparent" />

        {/* Content overlay — syncs with the hero copy the user referenced */}
        <div className="relative flex h-full flex-col justify-center gap-3 p-6 sm:p-10 lg:p-14">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--color-dowgnut-lime)] px-3 py-1 text-xs font-bold uppercase tracking-widest text-[var(--color-dowgnut-blue-dark)]">
            <Sparkles className="size-3" />
            Daily Made
          </span>
          <h2 className="graffiti-text max-w-xl text-3xl leading-[0.95] text-white drop-shadow-md sm:text-5xl lg:text-6xl">
            Freshly Glazed Daily
          </h2>
          <p className="max-w-md text-sm text-white/90 sm:text-lg">
            Classic, sprinkled, stuffed &amp; specialty — watch the magic, then taste the hype.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView("shop")}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--color-dowgnut-pink)] px-6 text-base font-bold text-white transition-transform hover:scale-105 active:scale-95"
            >
              Browse flavors
              <ChevronRight className="size-4" />
            </button>

            {/* Play / mute controls */}
            {videoExists && (
              <button
                onClick={togglePlay}
                className="inline-flex size-11 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition-colors hover:bg-white/30"
                aria-label={playing ? "Pause" : "Play"}
              >
                <Play className={cn("size-5", playing && "hidden")} />
                <span className={cn("hidden", playing && "block")}>❚❚</span>
              </button>
            )}
            {videoExists && (
              <button
                onClick={toggleMute}
                className="inline-flex size-11 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition-colors hover:bg-white/30"
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Generating badge while video isn't ready */}
        {!videoExists && (
          <div className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-dowgnut-blue-dark)]/80 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
            <span className="inline-block size-2 animate-pulse rounded-full bg-[var(--color-dowgnut-lime)]" />
            Rendering commercial…
          </div>
        )}
      </div>
    </section>
  );
}
