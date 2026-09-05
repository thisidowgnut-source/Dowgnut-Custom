import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * DohnutLogo — renders the DOHNUT brand wordmark
 * (`dohnut-logo-wordmark.png`, extracted from the source Flutter repo's
 * `assets/brand/dohnut_logo_wordmark_transparent.png`).
 * 
 * The wordmark is a blue graffiti wordmark with a pink dripping donut as
 * the "O" — designed for LIGHT backgrounds.
 * 
 * Variants:
 *  - "plain"  : bare image (use on light backgrounds: lime, cream, white)
 *  - "pill"   : image inside a cream rounded pill (use on dark/colored backgrounds: blue, navy)
 */
export function DowgNutLogo({
  height = 48,
  variant = "plain",
  className,
  alt = "DowgNut logo",
}: {
  height?: number;
  variant?: "plain" | "pill";
  className?: string;
  alt?: string;
}) {
  const width = Math.round(height * 2.5);

  const img = (
    <Image
      src="/brand/dohnut-logo-wordmark.png"
      alt={alt}
      width={width}
      height={height}
      priority
      style={{ height, width: "auto" }}
      className="object-contain"
      draggable={false}
    />
  );

  if (variant === "pill") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full bg-[var(--color-dowgnut-cream)] px-3 py-1 shadow-sm",
          className
        )}
      >
        {img}
      </span>
    );
  }

  return <span className={cn("inline-flex items-center", className)}>{img}</span>;
}
