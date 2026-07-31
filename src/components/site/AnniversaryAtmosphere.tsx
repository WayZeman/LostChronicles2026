"use client";

import { useEffect, useMemo, useRef } from "react";
import { readClientNetworkHints } from "@/lib/client-network";
import {
  getServerAgeParts,
  isServerAnniversary,
} from "@/lib/lc-server-age";

type Piece = {
  x: number;
  y: number;
  w: number;
  h: number;
  vy: number;
  vx: number;
  rot: number;
  vr: number;
  color: string;
  alpha: number;
};

const COLORS = [
  "#ffff55",
  "#ffe566",
  "#ecaf2d",
  "#55ff55",
  "#fff8c8",
  "#ffaa00",
];

function makePieces(count: number, w: number, h: number): Piece[] {
  const out: Piece[] = [];
  for (let i = 0; i < count; i++) {
    const size = 2 + Math.random() * 5;
    out.push({
      x: Math.random() * w,
      y: -20 - Math.random() * h * 0.9,
      w: size,
      h: size * (0.55 + Math.random() * 1.1),
      vy: 0.55 + Math.random() * 1.35,
      vx: (Math.random() - 0.5) * 0.85,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.08,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
      alpha: 0.45 + Math.random() * 0.5,
    });
  }
  return out;
}

/**
 * Святкова атмосфера річниці: клас на <html> + піксельний «конфеті».
 */
export function AnniversaryAtmosphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const active = useMemo(() => {
    if (!isServerAnniversary()) return false;
    return getServerAgeParts().years >= 1;
  }, []);

  useEffect(() => {
    if (!active) return;
    const root = document.documentElement;
    root.classList.add("lc-anniversary");
    return () => {
      root.classList.remove("lc-anniversary");
    };
  }, [active]);

  useEffect(() => {
    if (!active) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const { saveData, effectiveType } = readClientNetworkHints();
    if (saveData || effectiveType === "slow-2g" || effectiveType === "2g") {
      return;
    }

    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const maybeCtx = canvasEl.getContext("2d", { alpha: true });
    if (!maybeCtx) return;
    const drawCtx: CanvasRenderingContext2D = maybeCtx;

    let raf = 0;
    let w = 0;
    let h = 0;
    let pieces: Piece[] = [];
    const narrow = () => window.innerWidth < 768;

    function resize() {
      const c = canvasRef.current;
      if (!c) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      c.width = Math.floor(w * dpr);
      c.height = Math.floor(h * dpr);
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
      drawCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = narrow() ? 42 : 78;
      pieces = makePieces(count, w, h);
    }

    function tick() {
      drawCtx.clearRect(0, 0, w, h);
      for (const p of pieces) {
        p.x += p.vx + Math.sin(p.y * 0.02 + p.rot) * 0.35;
        p.y += p.vy;
        p.rot += p.vr;

        if (p.y > h + 24) {
          p.y = -16 - Math.random() * 80;
          p.x = Math.random() * w;
        }

        drawCtx.save();
        drawCtx.translate(p.x, p.y);
        drawCtx.rotate(p.rot);
        drawCtx.globalAlpha = p.alpha;
        drawCtx.fillStyle = p.color;
        // Піксельні «конфеті» — квадратики під Minecraft GUI
        drawCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        drawCtx.restore();
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
  }, [active]);

  if (!active) return null;

  return (
    <div className="lc-anniversary-fx" aria-hidden>
      <span className="lc-anniversary-fx__wash" />
      <span className="lc-anniversary-fx__glow lc-anniversary-fx__glow--top" />
      <span className="lc-anniversary-fx__glow lc-anniversary-fx__glow--mid" />
      <canvas
        ref={canvasRef}
        className="lc-anniversary-fx__confetti"
      />
    </div>
  );
}
