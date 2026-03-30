"use client";

import { useEffect, useRef } from "react";
import { readClientNetworkHints } from "@/lib/client-network";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  baseA: number;
  phase: number;
  warm: boolean;
  /** Яскраві «іскри» — сильніше світіння */
  bright: boolean;
};

/** 0 біля верху екрана → 1 біля низу (плавно) */
function fadeFromBottom(y: number, screenH: number): number {
  if (screenH <= 0) return 0;
  const edge1 = screenH * 0.44;
  const t = Math.min(1, Math.max(0, y / edge1));
  return t * t * (3 - 2 * t);
}

function initParticles(count: number, w: number, h: number): Particle[] {
  const out: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const warm = Math.random() < 0.64;
    const bright = Math.random() < 0.22;
    out.push({
      x: Math.random() * w,
      // Старт у нижній половині / під екраном — рух лише вгору
      y: h * (0.48 + Math.random() * 0.62),
      vx: (Math.random() - 0.5) * 0.22,
      vy: -0.14 - Math.random() * 0.52,
      r: Math.random() * 1.25 + 0.35,
      baseA: bright ? 0.22 + Math.random() * 0.38 : 0.12 + Math.random() * 0.34,
      phase: Math.random() * Math.PI * 2,
      warm,
      bright,
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

      const base = Math.min(200, Math.max(72, Math.floor((w * h) / 12500)));
      const light =
        isConstrained || narrow || effectiveType === "3g" ? 0.42 : 1;
      const count = Math.max(36, Math.floor(base * light));
      particles = initParticles(count, w, h);
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
        const brightBoost = p.bright ? 1.35 : 1;
        const verticalFade = fadeFromBottom(p.y, h);
        const a = Math.min(
          0.95,
          p.baseA * tw * brightBoost * verticalFade,
        );

        if (p.warm) {
          const glowR = Math.max(2.4, p.r * (p.bright ? 5.6 : 4.9));
          const g = draw.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
          const c0 = p.bright ? 1.05 : 0.92;
          const c1 = p.bright ? 0.72 : 0.48;
          g.addColorStop(0, `rgba(255, 252, 230, ${Math.min(1, a * c0)})`);
          g.addColorStop(0.32, `rgba(253, 230, 95, ${a * c1})`);
          g.addColorStop(0.65, `rgba(234, 179, 8, ${a * (p.bright ? 0.38 : 0.28)})`);
          g.addColorStop(1, "rgba(234, 179, 8, 0)");
          draw.fillStyle = g;
          draw.beginPath();
          draw.arc(p.x, p.y, glowR, 0, Math.PI * 2);
          draw.fill();
          draw.fillStyle = `rgba(255, 255, 248, ${Math.min(1, a * (p.bright ? 0.98 : 0.82))})`;
        } else {
          const ca = p.bright ? 0.72 : 0.52;
          draw.fillStyle = `rgba(210, 212, 225, ${a * ca})`;
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
      className="lc-atmosphere-particles pointer-events-none fixed inset-0 z-[1] mix-blend-screen opacity-[0.82]"
      aria-hidden
    />
  );
}
