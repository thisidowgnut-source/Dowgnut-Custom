"use client";

import confetti from "canvas-confetti";

/**
 * Celebration system — viral micro-interactions.
 * Uses canvas-confetti for particle bursts + DOM animation for donut-fly.
 */

// 🎉 Add to Cart — confetti burst from button + donut flies to cart icon
export function celebrateAddToCart(buttonEl?: HTMLElement | null, donutImgUrl?: string) {
  if (buttonEl) {
    const rect = buttonEl.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: 30,
      spread: 50,
      origin: { x, y },
      colors: ["#f05a9b", "#07579b", "#e8f866", "#fff9e8"],
      scalar: 0.7,
      ticks: 80,
      gravity: 0.8,
      disableForReducedMotion: true,
    });
  }

  // Donut fly to cart icon
  if (donutImgUrl) {
    flyDonutToCart(donutImgUrl, buttonEl);
  }

  // Cart badge bounce
  bounceCartBadge();
}

// 💗 Favorite — heart pop with pink particles
export function celebrateFavorite(element?: HTMLElement | null) {
  if (!element) return;
  const rect = element.getBoundingClientRect();
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;

  confetti({
    particleCount: 12,
    spread: 35,
    origin: { x, y },
    colors: ["#f05a9b", "#ff9ac7", "#fff9e8"],
    scalar: 0.5,
    ticks: 60,
    gravity: 0.5,
    shapes: ["circle"],
    disableForReducedMotion: true,
  });
}

// 🎊 Order complete — full screen celebration
export function celebrateOrderComplete() {
  const colors = ["#f05a9b", "#07579b", "#e8f866", "#fff9e8"];

  // Left burst
  confetti({
    particleCount: 80,
    angle: 60,
    spread: 70,
    origin: { x: 0, y: 0.8 },
    colors,
    disableForReducedMotion: true,
  });
  // Right burst
  confetti({
    particleCount: 80,
    angle: 120,
    spread: 70,
    origin: { x: 1, y: 0.8 },
    colors,
    disableForReducedMotion: true,
  });
  // Center rain
  setTimeout(() => {
    confetti({
      particleCount: 50,
      spread: 100,
      origin: { x: 0.5, y: 0.3 },
      colors,
      startVelocity: 25,
      gravity: 0.6,
      ticks: 150,
      disableForReducedMotion: true,
    });
  }, 200);
}

// 🏆 Swipe deck complete
export function celebrateSwipeComplete() {
  const colors = ["#f05a9b", "#07579b", "#e8f866"];
  confetti({
    particleCount: 100,
    spread: 160,
    origin: { x: 0.5, y: 0.4 },
    colors,
    startVelocity: 35,
    gravity: 0.5,
    ticks: 200,
    disableForReducedMotion: true,
  });
}

// Donut image flies to cart icon (DOM animation)
function flyDonutToCart(imgUrl: string, fromEl?: HTMLElement | null) {
  if (typeof document === "undefined") return;
  const cartIcon = document.querySelector('[aria-label="Open cart"]') as HTMLElement | null;
  if (!cartIcon || !fromEl) return;

  const fromRect = fromEl.getBoundingClientRect();
  const toRect = cartIcon.getBoundingClientRect();

  const flyEl = document.createElement("img");
  flyEl.src = imgUrl;
  flyEl.style.cssText = `
    position: fixed;
    left: ${fromRect.left + fromRect.width / 2 - 30}px;
    top: ${fromRect.top + fromRect.height / 2 - 30}px;
    width: 60px;
    height: 60px;
    object-fit: contain;
    z-index: 9999;
    pointer-events: none;
    transition: all 0.7s cubic-bezier(0.4, 0, 0.6, 1);
    opacity: 1;
  `;
  document.body.appendChild(flyEl);

  // Trigger animation to cart
  requestAnimationFrame(() => {
    flyEl.style.left = `${toRect.left + toRect.width / 2 - 15}px`;
    flyEl.style.top = `${toRect.top + toRect.height / 2 - 15}px`;
    flyEl.style.width = "30px";
    flyEl.style.height = "30px";
    flyEl.style.opacity = "0.3";
    flyEl.style.transform = "rotate(180deg)";
  });

  setTimeout(() => flyEl.remove(), 750);
}

// Cart badge bounce
function bounceCartBadge() {
  const badge = document.querySelector('[aria-label="Open cart"] .absolute') as HTMLElement | null;
  if (!badge) return;
  badge.style.transition = "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)";
  badge.style.transform = "scale(1.6)";
  setTimeout(() => {
    badge.style.transform = "scale(1)";
  }, 300);
}
