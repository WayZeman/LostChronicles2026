"use client";

import { useEffect, useRef } from "react";
import { readClientNetworkHints } from "@/lib/client-network";
import { getServerAgeParts, isServerAnniversary } from "@/lib/lc-server-age";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  baseA: number;
  phase: number;
  /** ~20% жовті іскри (золото лого), решта зелені */
  yellow: boolean;
  /** 0 тьмяні · 1 звичайні · 2 яскраві спалахи */
  glowTier: 0 | 1 | 2;
};

/** 0 біля верху екрана → 1 біля низу (плавно) */
function fadeFromBottom(y: number, screenH: number): number {
  if (screenH <= 0) return 0;
  const edge1 = screenH * 0.44;
  const t = Math.min(1, Math.max(0, y / edge1));
  return t * t * (3 - 2 * t);
}

function initParticles(
  count: number,
  w: number,
  h: number,
  festive: boolean,
): Particle[] {
  const out: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const yellow = festive ? Math.random() < 0.72 : Math.random() < 0.2;
    const roll = Math.random();
    const glowTier: 0 | 1 | 2 = festive
      ? roll < 0.35
        ? 0
        : roll < 0.72
          ? 1
          : 2
      : roll < 0.55
        ? 0
        : roll < 0.82
          ? 1
          : 2;
    const baseA =
      glowTier === 2
        ? 0.38 + Math.random() * 0.42
        : glowTier === 1
          ? 0.14 + Math.random() * 0.24
          : 0.05 + Math.random() * 0.1;
    const r =
      glowTier === 2
        ? 0.65 + Math.random() * 0.75
        : glowTier === 1
          ? 0.35 + Math.random() * 0.55
          : 0.2 + Math.random() * 0.4;
    out.push({
      x: Math.random() * w,
      // Старт у нижній половині / під екраном — рух лише вгору
      y: h * (0.48 + Math.random() * 0.62),
      vx: (Math.random() - 0.5) * (festive ? 0.32 : 0.22),
      vy: festive
        ? -0.2 - Math.random() * 0.62
        : -0.14 - Math.random() * 0.52,
      r: festive ? r * 1.15 : r,
      baseA: festive ? Math.min(1, baseA * 1.25) : baseA,
      phase: Math.random() * Math.PI * 2,
      yellow,
      glowTier,
    });
  }
  return out;
}

/** Повільні іскри / пил у стилі атмосфери меню (на кшталт World of Tanks). */
export function AtmosphereParticles() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const { saveData, effectiveType } = readClientNetworkHints();
    if (
      saveData ||
      effectiveType === "slow-2g" ||
      effectiveType === "2g"
    ) {
      return;
    }

    const festive =
      isServerAnniversary() && getServerAgeParts().years >= 1;

    const el = ref.current;
    if (!el) return;
    const maybe = el.getContext("2d", { alpha: true });
    if (!maybe) return;
    const draw = maybe;

    let raf = 0;
    let w = 0;
    let h = 0;
    let particles: Particle[] = [];

    function resize() {
      const c = ref.current;
      if (!c) return;
      const narrow = window.innerWidth < 768;
      const { isConstrained, effectiveType } = readClientNetworkHints();
      const dprCap =
        isConstrained || narrow ? 1 : Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      c.width = Math.floor(w * dprCap);
      c.height = Math.floor(h * dprCap);
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
      draw.setTransform(dprCap, 0, 0, dprCap, 0, 0);

      const base = Math.min(
        festive ? 320 : 200,
        Math.max(festive ? 120 : 72, Math.floor((w * h) / (festive ? 8200 : 12500))),
      );
      const light =
        isConstrained || narrow || effectiveType === "3g" ? 0.42 : 1;
      const count = Math.max(festive ? 64 : 36, Math.floor(base * light));
      particles = initParticles(count, w, h, festive);
    }

    function tick(t: number) {
      const time = t * 0.001;
      draw.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.phase += 0.014 + p.r * 0.0035;
        p.x += p.vx + Math.sin(time * 0.75 + p.phase) * 0.09;
        p.y += p.vy;

        if (p.y < -24) {
          p.y = h + 18 + Math.random() * 90;
          p.x = Math.random() * w;
        }
        if (p.x < -28) p.x = w + 28;
        else if (p.x > w + 28) p.x = -28;

        // Легке мерехтіння, але головне — згасання до верху
        const tw = 0.72 + 0.28 * Math.sin(p.phase * 2.05);
        const brightBoost =
          p.glowTier === 2 ? 1.65 : p.glowTier === 1 ? 1.05 : 0.72;
        const verticalFade = fadeFromBottom(p.y, h);
        const a = Math.min(
          1,
          p.baseA * tw * brightBoost * verticalFade,
        );

        const glowMul =
          p.glowTier === 2 ? 4.4 : p.glowTier === 1 ? 3.3 : 2.5;
        const glowR = Math.max(1.6, p.r * glowMul);
        const g = draw.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
        const c0 = p.glowTier === 2 ? 1.12 : p.glowTier === 1 ? 0.9 : 0.7;
        const c1 = p.glowTier === 2 ? 0.82 : p.glowTier === 1 ? 0.48 : 0.3;
        const midA =
          a * (p.glowTier === 2 ? 0.42 : p.glowTier === 1 ? 0.26 : 0.14);

        if (p.yellow) {
          g.addColorStop(0, `rgba(255, 250, 210, ${Math.min(1, a * c0)})`);
          g.addColorStop(0.32, `rgba(255, 214, 64, ${a * c1})`);
          g.addColorStop(0.65, `rgba(236, 175, 45, ${midA})`);
          g.addColorStop(1, "rgba(236, 175, 45, 0)");
          draw.fillStyle = g;
          draw.beginPath();
          draw.arc(p.x, p.y, glowR, 0, Math.PI * 2);
          draw.fill();
          draw.fillStyle = `rgba(255, 248, 200, ${Math.min(1, a * (p.glowTier === 2 ? 1 : p.glowTier === 1 ? 0.78 : 0.55))})`;
        } else {
          g.addColorStop(0, `rgba(230, 255, 220, ${Math.min(1, a * c0)})`);
          g.addColorStop(0.32, `rgba(122, 224, 74, ${a * c1})`);
          g.addColorStop(0.65, `rgba(84, 197, 48, ${midA})`);
          g.addColorStop(1, "rgba(84, 197, 48, 0)");
          draw.fillStyle = g;
          draw.beginPath();
          draw.arc(p.x, p.y, glowR, 0, Math.PI * 2);
          draw.fill();
          draw.fillStyle = `rgba(240, 255, 235, ${Math.min(1, a * (p.glowTier === 2 ? 1 : p.glowTier === 1 ? 0.78 : 0.55))})`;
        }
        draw.beginPath();
        draw.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        draw.fill();
      }

      raf = requestAnimationFrame(tick);
    }

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="lc-atmosphere-particles pointer-events-none fixed inset-x-0 -top-1.5 -bottom-1.5 z-[1] mix-blend-screen opacity-[0.62]"
      aria-hidden
    />
  );
}
