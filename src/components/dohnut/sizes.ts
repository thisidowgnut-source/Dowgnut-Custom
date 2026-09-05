/**
 * Doh-Nut — touch target & spacing tokens.
 *
 * Centralised so the WCAG 2.5.5 minimum (44×44) is enforced in one place.
 * `use these rather than raw Tailwind sizes in interactive controls so the
 * whole app stays accessible without per-component auditing.
 *
 * All values are mobile-first baselines. Components that need different
 * sizes at `sm:` / `md:` / `lg:` should pass a breakpoint string instead of
 * a single value.
 */

export const TOUCH_TARGET = {
  /** WCAG minimum — applies to any tappable control. */
  min: "h-11 w-11", // 44px
  /** Comfortable for primary actions. */
  comfortable: "h-12 w-12", // 48px
  /** Large primary CTAs (checkout, pay, etc.). */
  large: "h-14 w-14", // 56px
  /** Compact stepper / icon-only buttons (still >= 36px). */
  compact: "size-9", // 36px
} as const;

export const HEADER_HEIGHT = {
  mobile: "h-14", // 56px — comfortable thumb reach
  scrolledMobile: "h-14", // never compress on mobile (RX-10)
  desktop: "sm:h-14",
  scrolledDesktop: "sm:h-12",
} as const;

export const BOTTOM_NAV_CLEARANCE = {
  /** pb value for main content; accounts for safe-area-inset-bottom (RX-12). */
  main: "pb-[calc(4rem+env(safe-area-inset-bottom,0px))]",
  /** pb value for sticky/fixed bottom elements that should sit *under* the
   *  bottom nav rather than clear it. */
  under: "pb-[env(safe-area-inset-bottom,0px)]",
} as const;

export const FAB_POSITIONS = {
  /** Right-side FABs (concierge, designer) — clears bottom nav + safe area. */
  concierge: "bottom-[calc(env(safe-area-inset-bottom,0px)+5rem)]",
  designer: "bottom-[calc(env(safe-area-inset-bottom,0px)+9.5rem)]",
} as const;

export const RADIUS = {
  chip: "rounded-full",
  card: "rounded-2xl", // 16px
  modal: "rounded-3xl", // 24px
  sheet: "rounded-t-[32px]", // iOS-style bottom sheet
} as const;
