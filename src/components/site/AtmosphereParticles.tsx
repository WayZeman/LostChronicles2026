"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  baseA: number;
  phase: number;
  warm: boolean;
};

function initParticles(count: number, w: number, h: number): Particle[] {
  const out: Particle[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.26,
      vy: -0.1 - Math.random() * 0.48,
      r: Math.random() * 1.25 + 0.35,
      baseA: 0.11 + Math.random() * 0.36,
      phase: Math.random() * Math.PI * 2,
      warm: Math.random() < 0.48,
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
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      c.width = Math.floor(w * dpr);
      c.height = Math.floor(h * dpr);
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
      draw.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(120, Math.max(48, Math.floor((w * h) / 21000)));
      particles = initParticles(count, w, h);
    }

    function tick(t: number) {
      const time = t * 0.001;
      draw.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.phase += 0.014 + p.r * 0.0035;
        p.x += p.vx + Math.sin(time * 0.75 + p.phase) * 0.11;
        p.y += p.vy;

        if (p.y < -14) {
          p.y = h + 14;
          p.x = Math.random() * w;
        }
        if (p.x < -28) p.x = w + 28;
        else if (p.x > w + 28) p.x = -28;

        const tw = 0.52 + 0.48 * Math.sin(p.phase * 2.05);
        const a = p.baseA * tw;

        if (p.warm) {
          const glowR = Math.max(2.2, p.r * 4.8);
          const g = draw.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
          g.addColorStop(0, `rgba(255, 240, 190, ${a * 0.9})`);
          g.addColorStop(0.4, `rgba(234, 179, 8, ${a * 0.45})`);
          g.addColorStop(1, "rgba(234, 179, 8, 0)");
          draw.fillStyle = g;
          draw.beginPath();
          draw.arc(p.x, p.y, glowR, 0, Math.PI * 2);
          draw.fill();
          draw.fillStyle = `rgba(255, 252, 235, ${a * 0.85})`;
        } else {
          draw.fillStyle = `rgba(188, 188, 198, ${a * 0.5})`;
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
      className="lc-atmosphere-particles pointer-events-none fixed inset-0 z-[1] mix-blend-screen opacity-[0.72]"
      aria-hidden
    />
  );
}
