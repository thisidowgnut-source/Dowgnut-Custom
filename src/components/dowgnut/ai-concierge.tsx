"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Send, Sparkles, Loader2, Palette } from "lucide-react";
import { useShop } from "@/store/use-shop";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ChatMessage, Donut } from "@/lib/types";

interface Bubble extends ChatMessage {
  id: string;
}

const SUGGESTIONS = [
  "I want something chocolatey",
  "Surprise me",
  "Best for a party",
  "Not too sweet",
];

export function AIConcierge() {
  const open = useShop((s) => s.conciergeOpen);
  const setOpen = useShop((s) => s.setConciergeOpen);
  const aiConcierge = useShop((s) => s.aiConcierge);
  const openDetail = useShop((s) => s.openDetail);
  const designerOpen = useShop((s) => s.designerOpen);
  const setDesignerOpen = useShop((s) => s.setDesignerOpen);

  const [messages, setMessages] = useState<Bubble[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          id: "intro",
          role: "assistant",
          content:
            "DOH NUT WORRY — I got you. What you craving today? 🍩",
        },
      ]);
    }
  }, [open, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const userMsg: Bubble = {
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmed,
    };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    try {
      const res = await aiConcierge(
        nextMessages
          .filter((m) => m.id !== "intro")
          .map((m) => ({ role: m.role, content: m.content }))
      );
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: res.reply || "Hmm, I'm stumped. Try another craving!",
          donuts: res.donuts || [],
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: "Sorry, my donut radar is on the fritz. Try again in a sec.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onPickDonut = (d: Donut) => {
    setOpen(false);
    openDetail(d);
  };

  return (
    <>
      {/* Floating action button — sits above the bottom nav and respects
          iOS safe areas + nav indicator.

          Position math:
          - bottom nav is `h-16` (4rem) + safe-area padding
          - we want a comfortable gap (~1rem / 4 Tailwind units)
          - total clearance from screen bottom ≈ 5rem + safe-area
       */}
      {!open && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 16 }}
          onClick={() => setOpen(true)}
          aria-label="Open AI Concierge"
          aria-describedby="ai-concierge-hint"
          className="group fixed right-4 z-40 inline-flex size-14 items-center justify-center rounded-full bg-[var(--color-dowgnut-pink)] text-white shadow-lg shadow-[var(--color-dowgnut-pink-dark)]/40 transition-transform hover:scale-105 active:scale-95 sm:right-6 sm:size-16"
          style={{
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 5rem)",
          }}
        >
          <Sparkles className="size-6 animate-wiggle transition-transform group-hover:rotate-12 sm:size-7" />
          {/* Pulse halo — subtle attention without being noisy */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-[var(--color-dowgnut-pink)]/30"
            style={{ animationDuration: "2.4s" }}
          />
          {/* Screen-reader hint */}
          <span id="ai-concierge-hint" className="sr-only">
            Opens the DOH BOY concierge chat to recommend donuts, answer
            questions, and help you order.
          </span>
        </motion.button>
      )}

      {/* AI Donut Designer FAB — smaller navy button stacked above the
          concierge FAB. Restores access to the built-but-orphaned designer
          (designerOpen was previously never set true anywhere). */}
      {!open && !designerOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.08 }}
          onClick={() => setDesignerOpen(true)}
          aria-label="Open AI Donut Designer"
          aria-describedby="ai-designer-hint"
          className="group fixed right-4 z-40 inline-flex size-11 items-center justify-center rounded-full bg-[var(--color-dowgnut-blue)] text-white shadow-lg shadow-[var(--color-dowgnut-blue-dark)]/40 transition-transform hover:scale-105 active:scale-95 sm:right-6"
          style={{
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 9.5rem)",
          }}
        >
          <Palette className="size-5 transition-transform group-hover:rotate-12" />
          <span id="ai-designer-hint" className="sr-only">
            Opens the AI Donut Designer to dream up and render a custom donut
            from a text prompt.
          </span>
        </motion.button>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 bg-[var(--color-dowgnut-cream)] p-0 sm:max-w-md"
        >
          <SheetHeader className="border-b-4 border-[var(--color-dowgnut-pink)] bg-[var(--color-dowgnut-blue)] p-4 text-white">
            <SheetTitle className="flex items-center gap-3 text-white">
              <img
                src="/brand/dowgnut-mascot.png"
                alt=""
                className="size-10 animate-float object-contain"
              />
              <div>
                <p className="graffiti-text text-xl leading-none">
                  DOH BOY™
                </p>
                <p className="text-xs font-normal text-white/70">
                  Your AI donut whisperer — GOOD VIBE. GOOD DOH.
                </p>
              </div>
            </SheetTitle>
          </SheetHeader>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto scrollbar-dowgnut p-4"
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={
                  m.role === "user"
                    ? "flex justify-end"
                    : "flex flex-col items-start gap-2"
                }
              >
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[85%] rounded-2xl rounded-br-sm bg-[var(--color-dowgnut-pink)] px-3 py-2 text-sm text-white shadow-sm"
                      : "max-w-[85%] rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-sm text-[var(--color-dowgnut-blue-dark)] shadow-sm"
                  }
                >
                  {m.content}
                </div>
                {m.role === "assistant" && m.donuts && m.donuts.length > 0 && (
                  <div className="flex w-full gap-2 overflow-x-auto scrollbar-dowgnut pb-1">
                    {m.donuts.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => onPickDonut(d)}
                        className="flex w-32 shrink-0 flex-col items-center gap-1 rounded-2xl bg-white p-2 text-center shadow-sm transition-transform hover:scale-105"
                      >
                        <img
                          src={d.imgUrl}
                          alt={d.name}
                          className="size-14 object-contain"
                        />
                        <span className="line-clamp-2 text-[11px] font-bold text-[var(--color-dowgnut-blue-dark)]">
                          {d.name}
                        </span>
                        <span className="text-[11px] font-bold text-[var(--color-dowgnut-blue)]">
                          RM{d.price.toFixed(2)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-sm text-[var(--color-dowgnut-blue)]">
                <Loader2 className="size-4 animate-spin" />
                <span>Concierge is thinking…</span>
              </div>
            )}
          </div>

          {/* Suggestions — always visible so users always have a
              tap-to-start affordance, not only on the first message. */}
          <div className="flex gap-2 overflow-x-auto scrollbar-dowgnut px-4 pb-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                disabled={loading}
                className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[var(--color-dowgnut-blue-dark)] shadow-sm transition-colors hover:bg-[var(--color-dowgnut-lime)] disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-[var(--color-dowgnut-blue-dark)]/10 bg-[var(--color-dowgnut-cream)] p-3"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={loading ? "Concierge is thinking…" : "Ask the concierge…"}
              disabled={loading}
              className="h-11 flex-1 rounded-full bg-white disabled:opacity-60"
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              size="icon"
              className="size-11 rounded-full bg-[var(--color-dowgnut-pink)] text-white hover:bg-[var(--color-dowgnut-pink-dark)] hover:text-white"
              aria-label="Send"
            >
              <Send className="size-4" />
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
