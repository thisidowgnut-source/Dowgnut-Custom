"use client";

import { useState } from "react";
import { Loader2, Sparkles, RefreshCw, ImageIcon } from "lucide-react";
import { useShop } from "@/store/use-shop";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const PRESETS = [
  "Galaxy glaze with star sprinkles",
  "Rainbow explosion of sprinkles",
  "Matcha & gold leaf donut",
  "Spicy chili chocolate donut",
];

export function AIDesigner() {
  const open = useShop((s) => s.designerOpen);
  const setOpen = useShop((s) => s.setDesignerOpen);
  const aiDesigner = useShop((s) => s.aiDesigner);
  const { toast } = useToast();

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);
  const [gallery, setGallery] = useState<string[]>([]);

  const onGenerate = async (text: string) => {
    const p = text.trim();
    if (!p || loading) return;
    setLoading(true);
    try {
      const res = await aiDesigner(p);
      setCurrent(res.imageUrl);
      setGallery((g) => [res.imageUrl, ...g].slice(0, 6));
    } catch (err: any) {
      toast({
        title: "Designer offline",
        description:
          err?.message ?? "Couldn't render that one — try another prompt.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onClose = (o: boolean) => {
    setOpen(o);
    if (!o) {
      setPrompt("");
      setCurrent(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[92vh] w-full max-w-2xl overflow-y-auto scrollbar-dowgnut rounded-3xl border-4 border-[var(--color-dowgnut-blue-dark)] bg-[var(--color-dowgnut-cream)] p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="graffiti-text flex items-center gap-2 text-3xl text-[var(--color-dowgnut-blue-dark)]">
            <Sparkles className="size-6 text-[var(--color-dowgnut-pink)]" />
            AI Donut Designer
          </DialogTitle>
          <DialogDescription className="text-sm text-[var(--color-dowgnut-blue-dark)]/70">
            Dream up your own donut — we&apos;ll render it.
          </DialogDescription>
        </DialogHeader>

        {/* Prompt input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onGenerate(prompt);
          }}
          className="flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. cosmic blue donut with glitter galaxies"
            className="h-11 flex-1 bg-white"
          />
          <Button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="h-11 rounded-full bg-[var(--color-dowgnut-pink)] px-6 text-white hover:bg-[var(--color-dowgnut-pink-dark)] hover:text-white"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Generate
          </Button>
        </form>

        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => {
                setPrompt(p);
                onGenerate(p);
              }}
              disabled={loading}
              className={cn(
                "rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[var(--color-dowgnut-blue-dark)] shadow-sm transition-colors hover:bg-[var(--color-dowgnut-lime)]",
                loading && "opacity-50"
              )}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Current image */}
        {loading && !current && (
          <div className="flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-3xl bg-[var(--color-dowgnut-lime-bright)]">
            <Loader2 className="size-8 animate-spin text-[var(--color-dowgnut-pink)]" />
            <p className="text-sm font-semibold text-[var(--color-dowgnut-blue-dark)]">
              Rendering your dream dowg…
            </p>
          </div>
        )}

        {current && (
          <div className="rounded-3xl border-4 border-[var(--color-dowgnut-blue-dark)] bg-gradient-to-br from-[var(--color-dowgnut-lime)] to-[var(--color-dowgnut-cream)] p-3">
            <img
              src={current}
              alt="AI-designed donut"
              className="aspect-square w-full rounded-2xl object-cover"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-[var(--color-dowgnut-blue-dark)]/70">
                ✨ Your custom dowg concept
              </p>
              <Button
                onClick={() => onGenerate(prompt)}
                disabled={loading || !prompt.trim()}
                size="sm"
                className="rounded-full bg-[var(--color-dowgnut-blue)] text-white hover:bg-[var(--color-dowgnut-blue-dark)] hover:text-white"
              >
                <RefreshCw className="size-4" /> Generate another
              </Button>
            </div>
          </div>
        )}

        {!loading && !current && gallery.length === 0 && (
          <div className="flex aspect-[3/1] flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-[var(--color-dowgnut-blue-dark)]/15 text-center">
            <ImageIcon className="size-8 text-[var(--color-dowgnut-blue)]/40" />
            <p className="text-sm text-[var(--color-dowgnut-blue-dark)]/60">
              Type a prompt or pick a preset to begin.
            </p>
          </div>
        )}

        {/* Gallery */}
        {gallery.length > 0 && (
          <div>
            <p className="graffiti-text mb-2 text-sm text-[var(--color-dowgnut-blue-dark)]">
              This session&apos;s gallery
            </p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {gallery.map((g, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(g)}
                  className="aspect-square overflow-hidden rounded-2xl border-2 border-[var(--color-dowgnut-blue-dark)]/10 bg-white"
                >
                  <img
                    src={g}
                    alt={`Generated donut ${i + 1}`}
                    className="size-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
