"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { cn } from "@/lib/utils";

/** Швидкий рендер голови (Mojang); для Ely-акаунтів підставляється резерв нижче. */
function getMcHeadAvatarUrl(nick: string, size: 32 | 48 = 32): string {
  return `https://mc-heads.net/avatar/${encodeURIComponent(nick)}/${size}`;
}

/** Ely — лише як fallback: менший scale швидше віддає PNG. */
function getElyPlayerHeadUrl(nick: string): string {
  const skinUrl = `http://skinsystem.ely.by/skins/${encodeURIComponent(nick)}.png`;
  return `https://ely.by/services/skins-renderer?url=${encodeURIComponent(skinUrl)}&scale=10&renderFace=1`;
}

function PlayerHead({
  nick,
  eager,
}: {
  nick: string;
  eager?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- зовнішні скіни з fallback-ланцюжком
    <img
      src={getMcHeadAvatarUrl(nick)}
      alt=""
      width={22}
      height={22}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={eager ? "high" : undefined}
      data-player={nick}
      data-head-stage="mc"
      onError={(event) => {
        const img = event.currentTarget;
        const playerNick = img.dataset.player ?? "";
        const stage = img.dataset.headStage ?? "mc";
        if (stage === "mc") {
          img.dataset.headStage = "ely";
          img.src = getElyPlayerHeadUrl(playerNick);
          return;
        }
        if (stage === "ely") {
          img.dataset.headStage = "steve";
          img.src = getMcHeadAvatarUrl("steve");
        }
      }}
      className="pointer-events-none size-[22px] shrink-0 rounded-[3px] border border-white/20"
      aria-hidden
    />
  );
}

type Props = {
  names: string[];
  /** Якщо ніків більше — стрічка крутиться як у блоці онлайну. */
  marqueeMinCount?: number;
  ariaLabel?: string;
  className?: string;
};

/**
 * Горизонтальна стрічка ніків з аватарками.
 * Якщо не вміщаються (багато імен) — плавний marquee + drag/wheel.
 */
export function PlayerNamesStrip({
  names,
  marqueeMinCount = 4,
  ariaLabel = "Ніки. Перетягніть смужку або натисніть на нік, щоб скопіювати.",
  className,
}: Props) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [copiedNick, setCopiedNick] = useState<string | null>(null);
  const [overflows, setOverflows] = useState(false);

  const stripRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const offsetRef = useRef(0);
  const draggingRef = useRef(false);
  const hoverPausedRef = useRef(false);
  const lastXRef = useRef(0);
  const dragDistRef = useRef(0);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number>(0);
  const halfWidthRef = useRef(0);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const marquee =
    !reduceMotion && (names.length > marqueeMinCount || overflows);

  const applyTransform = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    let half = halfWidthRef.current;
    if (half <= 0) {
      half = track.scrollWidth / 2;
      halfWidthRef.current = half;
    }
    if (half > 0) {
      let x = offsetRef.current % half;
      if (x > 0) x -= half;
      offsetRef.current = x;
    }
    track.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
  }, []);

  useEffect(() => {
    const strip = stripRef.current;
    const track = trackRef.current;
    if (!strip || !track) return;

    const measureOverflow = () => {
      // Без дублікатів track ширший за комірку → треба marquee
      const singleWidth = marquee
        ? track.scrollWidth / 2
        : track.scrollWidth;
      setOverflows(singleWidth > strip.clientWidth + 2);
      if (marquee) {
        halfWidthRef.current = track.scrollWidth / 2;
      }
    };
    measureOverflow();

    const ro = new ResizeObserver(measureOverflow);
    ro.observe(strip);
    ro.observe(track);
    return () => ro.disconnect();
  }, [names, marquee]);

  useEffect(() => {
    if (!marquee) {
      if (trackRef.current) trackRef.current.style.transform = "";
      return;
    }

    const measure = () => {
      const track = trackRef.current;
      if (!track) return;
      halfWidthRef.current = track.scrollWidth / 2;
    };
    measure();

    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);

    const SPEED = 28; // px/s
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(32, now - last) / 1000;
      last = now;
      if (!draggingRef.current && !hoverPausedRef.current) {
        offsetRef.current -= SPEED * dt;
        applyTransform();
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, [marquee, names, applyTransform]);

  const pauseAuto = useCallback(() => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  const scheduleResume = useCallback(() => {
    pauseAuto();
    resumeTimerRef.current = setTimeout(() => {
      hoverPausedRef.current = false;
      resumeTimerRef.current = null;
    }, 1400);
  }, [pauseAuto]);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!marquee) return;
    const el = stripRef.current;
    if (!el) return;
    const onWheelNative = (e: WheelEvent) => {
      const dx =
        Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (dx === 0) return;
      e.preventDefault();
      pauseAuto();
      hoverPausedRef.current = true;
      offsetRef.current -= dx;
      applyTransform();
      scheduleResume();
    };
    el.addEventListener("wheel", onWheelNative, { passive: false });
    return () => el.removeEventListener("wheel", onWheelNative);
  }, [marquee, applyTransform, pauseAuto, scheduleResume]);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!marquee) return;
    if (e.button !== 0) return;
    pauseAuto();
    draggingRef.current = true;
    hoverPausedRef.current = true;
    setDragging(true);
    lastXRef.current = e.clientX;
    dragDistRef.current = 0;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!marquee || !draggingRef.current) return;
    const dx = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;
    dragDistRef.current += Math.abs(dx);
    offsetRef.current += dx;
    applyTransform();
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!marquee) return;
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    scheduleResume();
  };

  const copyNick = async (nick: string) => {
    if (dragDistRef.current > 8) return;
    try {
      await navigator.clipboard.writeText(nick);
      setCopiedNick(nick);
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopiedNick(null), 1600);
    } catch {
      /* clipboard may be unavailable */
    }
  };

  const chip = (nick: string, key: string, eager?: boolean) => (
    <li key={key} className="list-none">
      <button
        type="button"
        className={cn(
          "lc-player-chip inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius)] border border-[var(--mc-border-card)] bg-[var(--mc-surface-elevated)] px-2 py-1.5",
          "cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--mc-net-green)]",
          copiedNick === nick && "lc-player-chip-copied",
        )}
        title={
          copiedNick === nick ? "Скопійовано" : `Скопіювати нік: ${nick}`
        }
        aria-label={`Скопіювати нік ${nick}`}
        onClick={() => void copyNick(nick)}
      >
        <PlayerHead nick={nick} eager={eager} />
        <span className="max-w-[7.5rem] truncate text-xs font-medium text-[var(--mc-text)] sm:max-w-[9rem] sm:text-[13px]">
          {copiedNick === nick ? "Скопійовано" : nick}
        </span>
      </button>
    </li>
  );

  if (names.length === 0) return null;

  return (
    <div
      ref={stripRef}
      className={cn(
        "lc-player-strip",
        marquee ? "lc-player-strip-marquee" : "lc-player-strip-static",
        marquee && (dragging ? "lc-player-strip-dragging" : "lc-player-strip-grab"),
        className,
      )}
      role="list"
      aria-label={ariaLabel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerEnter={() => {
        if (!marquee) return;
        pauseAuto();
        hoverPausedRef.current = true;
      }}
      onPointerLeave={() => {
        if (!marquee || draggingRef.current) return;
        scheduleResume();
      }}
    >
      <ul ref={trackRef} className="lc-player-strip-track">
        {names.map((nick, i) => chip(nick, nick, i < 8))}
        {marquee
          ? names.map((nick) => chip(nick, `dup-${nick}`, false))
          : null}
      </ul>
    </div>
  );
}
