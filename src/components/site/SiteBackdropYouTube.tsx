"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { readClientNetworkHints } from "@/lib/client-network";
import { cn } from "@/lib/utils";
import { LC_SPLASH_FADE_EVENT } from "@/lib/splash-bridge";

const VIDEO_ID = "_5jELltfi9U";

function backdropEmbedSrc(): string {
  return `https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=1&mute=1&start=13&controls=0&loop=1&playlist=${VIDEO_ID}&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1`;
}

/**
 * Фоновий YouTube (mute, loop). Вимикається при зменшеному русі або «важкій» мережі;
 * iframe підвантажується після простою / невеликої затримки, щоб не конкурувати з LCP.
 */
export function SiteBackdropYouTube() {
  const [active, setActive] = useState(true);
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const [veilLifted, setVeilLifted] = useState(false);
  const liftedRef = useRef(false);
  const fallbackTimerRef = useRef<number | undefined>(undefined);
  const idleCancelRef = useRef<{ cancel: () => void } | null>(null);

  useLayoutEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      const { isConstrained } = readClientNetworkHints();
      const on = !mq.matches && !isConstrained;
      setActive(on);
      document.documentElement.classList.toggle("has-video-bg", on);
    };
    apply();
    mq.addEventListener("change", apply);
    const conn = (navigator as Navigator & { connection?: EventTarget })
      .connection;
    conn?.addEventListener?.("change", apply);
    return () => {
      mq.removeEventListener("change", apply);
      conn?.removeEventListener?.("change", apply);
      document.documentElement.classList.remove("has-video-bg");
    };
  }, []);

  useEffect(() => {
    if (!active) return;

    const scheduleLoad = () => setIframeSrc(backdropEmbedSrc());

    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(scheduleLoad, { timeout: 2800 });
      idleCancelRef.current = {
        cancel: () => window.cancelIdleCallback(id),
      };
    } else {
      const t = window.setTimeout(scheduleLoad, 1600);
      idleCancelRef.current = { cancel: () => window.clearTimeout(t) };
    }

    return () => {
      idleCancelRef.current?.cancel();
      idleCancelRef.current = null;
    };
  }, [active]);

  useEffect(() => {
    if (!active) return;

    function lift() {
      if (liftedRef.current) return;
      liftedRef.current = true;
      if (fallbackTimerRef.current !== undefined) {
        window.clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = undefined;
      }
      window.removeEventListener(LC_SPLASH_FADE_EVENT, lift);
      requestAnimationFrame(() => setVeilLifted(true));
    }

    window.addEventListener(LC_SPLASH_FADE_EVENT, lift);
    fallbackTimerRef.current = window.setTimeout(lift, 6000) as number;

    return () => {
      window.removeEventListener(LC_SPLASH_FADE_EVENT, lift);
      if (fallbackTimerRef.current !== undefined) {
        window.clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = undefined;
      }
    };
  }, [active]);

  if (!active) return null;

  return (
    <div className="mc-backdrop-youtube-wrap" aria-hidden>
      {iframeSrc ? (
        <iframe
          className="mc-backdrop-youtube-iframe"
          src={iframeSrc}
          title="Фонове відео"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : null}
      <div
        className={cn(
          "mc-backdrop-youtube-veil",
          veilLifted && "mc-backdrop-youtube-veil--lifted"
        )}
        aria-hidden
      />
    </div>
  );
}
