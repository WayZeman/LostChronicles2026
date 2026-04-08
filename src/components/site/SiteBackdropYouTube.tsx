"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { readClientNetworkHints } from "@/lib/client-network";
import { cn } from "@/lib/utils";

const VIDEO_ID = "_5jELltfi9U";

function backdropEmbedSrc(): string {
  return `https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=1&mute=1&start=13&controls=0&loop=1&playlist=${VIDEO_ID}&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1`;
}

/**
 * Фоновий YouTube (mute, loop). Вимикається при зменшеному русі або «важкій» мережі;
 * iframe підвантажується після простою / невеликої затримки, щоб не конкурувати з LCP.
 */
const IFRAME_LOAD_FALLBACK_MS = 9000;
/** Пауза після load: перший кадр декодується без «смуги знизу». */
const REVEAL_DELAY_AFTER_LOAD_MS = 400;

export function SiteBackdropYouTube() {
  const [active, setActive] = useState(true);
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const [revealCover, setRevealCover] = useState(false);
  const idleCancelRef = useRef<{ cancel: () => void } | null>(null);
  const loadFallbackRef = useRef<number | null>(null);
  const revealDelayRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      const { isConstrained } = readClientNetworkHints();
      const on = !mq.matches && !isConstrained;
      setActive(on);
    };
    apply();
    mq.addEventListener("change", apply);
    const conn = (navigator as Navigator & { connection?: EventTarget })
      .connection;
    conn?.addEventListener?.("change", apply);
    return () => {
      mq.removeEventListener("change", apply);
      conn?.removeEventListener?.("change", apply);
    };
  }, []);

  /** Режим відео лише коли iframe в DOM — інакше знімається фон «в ніч» до появи картинки. */
  useEffect(() => {
    const showVideoLayer = Boolean(active && iframeSrc);
    document.documentElement.classList.toggle("has-video-bg", showVideoLayer);
  }, [active, iframeSrc]);

  useEffect(() => {
    return () => {
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

  /** Якщо onLoad не прийшов (рідко), усе одно знімаємо вуаль — інакше вічна заслінка. */
  useEffect(() => {
    if (!iframeSrc) return;
    const resetCover = requestAnimationFrame(() => setRevealCover(false));
    if (loadFallbackRef.current !== null) {
      window.clearTimeout(loadFallbackRef.current);
    }
    loadFallbackRef.current = window.setTimeout(() => {
      loadFallbackRef.current = null;
      setRevealCover(true);
    }, IFRAME_LOAD_FALLBACK_MS) as unknown as number;
    return () => {
      window.cancelAnimationFrame(resetCover);
      if (loadFallbackRef.current !== null) {
        window.clearTimeout(loadFallbackRef.current);
        loadFallbackRef.current = null;
      }
    };
  }, [iframeSrc]);

  const scheduleRevealAfterLoad = useCallback(() => {
    if (loadFallbackRef.current !== null) {
      window.clearTimeout(loadFallbackRef.current);
      loadFallbackRef.current = null;
    }
    if (revealDelayRef.current !== null) {
      window.clearTimeout(revealDelayRef.current);
    }
    revealDelayRef.current = window.setTimeout(() => {
      revealDelayRef.current = null;
      setRevealCover(true);
    }, REVEAL_DELAY_AFTER_LOAD_MS) as unknown as number;
  }, []);

  useEffect(() => {
    return () => {
      if (revealDelayRef.current !== null) {
        window.clearTimeout(revealDelayRef.current);
      }
    };
  }, []);

  if (!active) return null;

  return (
    <div className="mc-backdrop-youtube-wrap" aria-hidden>
      {iframeSrc ? (
        <>
          <iframe
            className="mc-backdrop-youtube-iframe"
            src={iframeSrc}
            title="Фонове відео"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={scheduleRevealAfterLoad}
          />
          {/* Вуаль знімається лише після load + пауза; без анімації opacity на iframe. */}
          <div
            className={cn(
              "mc-backdrop-youtube-cover",
              revealCover && "mc-backdrop-youtube-cover--reveal",
            )}
            aria-hidden
          />
        </>
      ) : null}
    </div>
  );
}
