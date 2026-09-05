"use client";

import { useEffect, useRef } from "react";

/**
 * ParticleBackground — High-fidelity Canvas 2D floating sprinkles & sugar pearls.
 * Multi-shape sprinkles (capsule jimmies, sugar beads, star crumbs) with gentle
 * wave physics, mouse parallax, and DPR sharpness.
 * Respects prefers-reduced-motion.
 */

type SprinkleShape = "capsule" | "bead" | "star";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  width: number;
  color: string;
  shape: SprinkleShape;
  rotation: number;
  rotationSpeed: number;
  floatPhase: number;
  alpha: number;
}

const COLORS = [
  "#EF9FBD", // DowgNut Pink
  "#297ABE", // DowgNut Blue
  "#E8F866", // DowgNut Lime
  "#C93373", // Berry Pink
  "#FFE0EC", // Pastel Glaze
  "#4FB0FF", // Bright Sky
];

export function ParticleBackground({ count = 42 }: { count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      if (width === 0 || height === 0) return;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    // Initialize diverse sprinkle particles
    const shapes: SprinkleShape[] = ["capsule", "capsule", "capsule", "bead", "star"];
    particlesRef.current = Array.from({ length: count }).map(() => {
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      const baseSize = 4 + Math.random() * 7;
      return {
        x: Math.random() * (width || 400),
        y: Math.random() * (height || 800),
        vx: (Math.random() - 0.5) * 0.25,
        vy: 0.15 + Math.random() * 0.35, // subtle natural downward/floating drift
        length: shape === "capsule" ? baseSize * 2.2 : baseSize,
        width: shape === "capsule" ? baseSize * 0.75 : baseSize,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        shape,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.015,
        floatPhase: Math.random() * Math.PI * 2,
        alpha: 0.35 + Math.random() * 0.45,
      };
    });

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };

    const onPointerLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerleave", onPointerLeave);

    let time = 0;

    const animate = () => {
      time += 0.016;
      ctx.clearRect(0, 0, width, height);

      const mouse = mouseRef.current;
      const particles = particlesRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Wave oscillation (harmonic sway)
        const waveX = Math.sin(time + p.floatPhase) * 0.2;
        p.x += p.vx + waveX;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        // Interactive mouse parallax & subtle repulsion
        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 16000 && distSq > 0) { // ~126px radius
            const dist = Math.sqrt(distSq);
            const force = (1 - dist / 126) * 0.45;
            p.x -= (dx / dist) * force;
            p.y -= (dy / dist) * force;
          }
        }

        // Screen boundary wrapping
        if (p.x < -25) p.x = width + 25;
        if (p.x > width + 25) p.x = -25;
        if (p.y < -25) p.y = height + 25;
        if (p.y > height + 25) p.y = -25;

        // Render sprinkle shape
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;

        if (p.shape === "capsule") {
          // Pill sprinkle
          const rx = p.length / 2;
          const ry = p.width / 2;
          const r = ry;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(-rx, -ry, p.length, p.width, r);
          } else {
            ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
          }
          ctx.fill();
        } else if (p.shape === "bead") {
          // Round sugar pearl
          ctx.beginPath();
          ctx.arc(0, 0, p.width / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Star crumb
          const s = p.width * 0.7;
          ctx.beginPath();
          ctx.moveTo(0, -s);
          ctx.lineTo(s * 0.4, -s * 0.3);
          ctx.lineTo(s, 0);
          ctx.lineTo(s * 0.4, s * 0.3);
          ctx.lineTo(0, s);
          ctx.lineTo(-s * 0.4, s * 0.3);
          ctx.lineTo(-s, 0);
          ctx.lineTo(-s * 0.4, -s * 0.3);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}

