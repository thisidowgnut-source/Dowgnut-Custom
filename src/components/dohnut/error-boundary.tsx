"use client";

import { Component, ReactNode } from "react";
import { RefreshCcw, Home } from "lucide-react";
import { useShop } from "@/store/use-shop";

/**
 * Error boundary — catches render crashes, shows fallback UI with
 * recovery options instead of a hard reload.
 */
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    console.error("[ErrorBoundary]", error, info);
  }

  private reset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  private goHome = () => {
    this.reset();
    useShop.getState().setView("shop");
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <img
            src="/brand/dohnut-mascot.png"
            alt=""
            className="h-28 w-28 animate-float object-contain"
          />
          <h2 className="graffiti-text text-2xl text-[var(--color-dowgnut-blue-dark)]">
            DOH NUT PANIC!
          </h2>
          <p className="max-w-sm text-sm text-[var(--color-dowgnut-blue-dark)]/70">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={this.reset}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--color-dowgnut-pink)] px-5 text-sm font-bold text-white shadow-sm hover:bg-[var(--color-dowgnut-pink-dark)]"
            >
              <RefreshCcw className="size-4" />
              Try again
            </button>
            <button
              onClick={this.goHome}
              className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-[var(--color-dowgnut-blue-dark)]/15 bg-white px-5 text-sm font-bold text-[var(--color-dowgnut-blue-dark)] hover:border-[var(--color-dowgnut-blue-dark)]/30"
            >
              <Home className="size-4" />
              Back to shop
            </button>
          </div>
          <a
            href={`mailto:support@dowgnut.com?subject=${encodeURIComponent(
              "DOHNUT error: " + (this.state.error?.message?.slice(0, 50) ?? "unknown")
            )}`}
            className="mt-1 text-xs font-semibold text-[var(--color-dowgnut-blue)] hover:underline"
          >
            Report this issue →
          </a>
        </div>
      );
    }
    return this.props.children;
  }
}
