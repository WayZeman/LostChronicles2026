"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { LC_SPLASH_FADE_EVENT } from "@/lib/splash-bridge";

/** Мінімум на екрані після load + шрифти, щоб встигла відіграти «дихаюча» анімація лого. */
const MIN_VISIBLE_MS = 2600;
const MAX_WAIT_MS = 10000;

type Phase = "show" | "fade" | "done";

/**
 * Повноекранна заставка при вході: логотип з легкою «дихаючою» анімацією,
 * зникає плавно після window load + шрифти та короткої паузи.
 */
export function SiteSplash() {
  const [phase, setPhase] = useState<Phase>("show");
  const startRef = useRef(0);
  const dismissedRef = useRef(false);
  const fadeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    dismissedRef.current = false;
    startRef.current = performance.now();

    const dismiss = () => {
      if (cancelled || dismissedRef.current) return;
      dismissedRef.current = true;
      const elapsed = performance.now() - startRef.current;
      const remain = Math.max(0, MIN_VISIBLE_MS - elapsed);
      fadeTimerRef.current = window.setTimeout(() => {
        fadeTimerRef.current = null;
        if (!cancelled) {
          window.dispatchEvent(new CustomEvent(LC_SPLASH_FADE_EVENT));
          setPhase("fade");
        }
      }, remain) as number;
    };

    const whenLoad = new Promise<void>((resolve) => {
      if (document.readyState === "complete") resolve();
      else window.addEventListener("load", () => resolve(), { once: true });
    });

    const whenFonts = document.fonts?.ready?.catch(() => undefined) ?? Promise.resolve();

    void Promise.all([whenLoad, whenFonts]).then(dismiss);

    const maxTimer = window.setTimeout(dismiss, MAX_WAIT_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(maxTimer);
      if (fadeTimerRef.current) window.clearTimeout(fadeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (phase === "done") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [phase]);

  const onFadeEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.propertyName !== "opacity") return;
    setPhase("done");
  };

  if (phase === "done") return null;

  return (
    <div
      className={cn("site-splash", phase === "fade" && "site-splash--out")}
      onTransitionEnd={onFadeEnd}
      aria-hidden={phase === "fade"}
    >
      <div className="site-splash__inner">
        <Image
          src="/logo.png"
          alt=""
          width={140}
          height={140}
          priority
          className="site-splash__logo"
        />
        <p className="site-splash__title">Lost Chronicles</p>
      </div>
    </div>
  );
}
