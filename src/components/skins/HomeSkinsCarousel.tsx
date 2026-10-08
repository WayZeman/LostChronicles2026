"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { SkinCard, type SkinCardData } from "@/components/skins/SkinCard";
import { cn } from "@/lib/utils";

type Props = {
  skins: SkinCardData[];
  isLoggedIn: boolean;
  /** Від цієї кількості (або якщо не вміщаються) — карусель. */
  carouselMinCount?: number;
};

/**
 * Мало скінів — по центру. Багато / не вміщаються — плавний marquee.
 */
export function HomeSkinsCarousel({
  skins,
  isLoggedIn,
  carouselMinCount = 5,
}: Props) {
  const stripRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const halfWidthRef = useRef(0);
  const rafRef = useRef(0);
  const draggingRef = useRef(false);
  const hoverPausedRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStartXRef = useRef(0);
  const dragStartOffsetRef = useRef(0);

  const [reduceMotion, setReduceMotion] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const marquee =
    !reduceMotion && (skins.length >= carouselMinCount || overflows);

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

    const measure = () => {
      const singleWidth = marquee
        ? track.scrollWidth / 2
        : track.scrollWidth;
      setOverflows(singleWidth > strip.clientWidth + 8);
      if (marquee) {
        halfWidthRef.current = track.scrollWidth / 2;
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(strip);
    ro.observe(track);
    return () => ro.disconnect();
  }, [skins, marquee]);

  useEffect(() => {
    if (!marquee) {
      if (trackRef.current) trackRef.current.style.transform = "";
      offsetRef.current = 0;
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

    const SPEED = 32;
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
  }, [marquee, skins, applyTransform]);

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
    }, 1600);
  }, [pauseAuto]);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!marquee || e.button !== 0) return;
    draggingRef.current = true;
    setDragging(true);
    hoverPausedRef.current = true;
    pauseAuto();
    dragStartXRef.current = e.clientX;
    dragStartOffsetRef.current = offsetRef.current;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!marquee || !draggingRef.current) return;
    offsetRef.current =
      dragStartOffsetRef.current + (e.clientX - dragStartXRef.current);
    applyTransform();
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    scheduleResume();
  };

  if (skins.length === 0) return null;

  const cards = (keyPrefix: string) =>
    skins.map((skin) => (
      <div
        key={`${keyPrefix}-${skin.id}`}
        className="w-[9.5rem] shrink-0 sm:w-[11rem]"
      >
        <SkinCard skin={skin} compact isLoggedIn={isLoggedIn} />
      </div>
    ));

  return (
    <div
      ref={stripRef}
      className={cn(
        "mt-5 w-full",
        marquee
          ? cn(
              "overflow-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
              dragging ? "cursor-grabbing" : "cursor-grab",
            )
          : "overflow-x-auto",
      )}
      aria-label="Скіни спільноти"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onMouseEnter={() => {
        if (!marquee) return;
        hoverPausedRef.current = true;
        pauseAuto();
      }}
      onMouseLeave={() => {
        if (!marquee || draggingRef.current) return;
        scheduleResume();
      }}
    >
      <div
        ref={trackRef}
        className={cn(
          "flex gap-3 will-change-transform",
          marquee ? "w-max" : "mx-auto w-max justify-center",
        )}
      >
        {marquee ? (
          <>
            {cards("a")}
            {cards("b")}
          </>
        ) : (
          cards("c")
        )}
      </div>
    </div>
  );
}
